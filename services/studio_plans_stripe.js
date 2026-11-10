// CHEMIN : services/studio_plans_stripe.js
// e-Vend Studio — Add-on « Plans collaborateurs », Phase 2 : abonnement mensuel du collaborateur à son plan.
// L'abonnement vit sur le compte Stripe du GESTIONNAIRE (le collaborateur lui paie son plan; Stripe Connect sert aux commissions).
// Aucun cron, aucun webhook à ajouter : l'état de l'abonnement est relu chez Stripe
//   - au retour du paiement (confirmer),
//   - à l'ouverture de « Mon plan », et
//   - au plus une fois par heure quand le collaborateur crée/modifie une annonce.

'use strict';

const pool = require('../db');
const paiement = require('./studio_paiement');
const cfgMV = require('./studio_config_mv');
const taxesMV = require('./studio_taxes');
const P = require('./studio_plans_collab');

const FRAICHEUR_MS = 60 * 60 * 1000;

const cents = (n) => Math.round((Number(n) || 0) * 100);

async function contexte(gid) {
  const ctx = await paiement.contexteStripe(gid);   // Stripe du gestionnaire prêt (clé + Connect actif)
  if (!ctx) throw new P.ErreurPlan("Les paiements de cette marketplace ne sont pas encore configurés : contactez le gestionnaire.", 409);
  return ctx;
}

// Prix mensuel facturé (taxes ajoutées si le gestionnaire l'a choisi; taux de la province de Config multi → Commission, défaut QC)
async function montantMensuel(gid, plan) {
  const cfg = await P.reglages(gid, pool);
  const mv = await cfgMV.lire(gid, pool);
  let taxe = 0;
  if (cfg.taxes_ajoutees) {
    const tbl = taxesMV.tableTaux(mv);
    const tp = tbl[mv.commission_province] || tbl.QC;
    taxe = (tp.tps || 0) + (tp.tvq || 0) + (tp.tvh || 0) + (tp.tvp || 0);
  }
  const c = Math.round(cents(plan.prix_mensuel) * (1 + taxe) + 1e-7);
  return { cents: c, taxes: cfg.taxes_ajoutees && taxe > 0, devise: cfgMV.deviseDe(mv).toLowerCase() };
}

const lignePrix = (plan, m) => ({
  currency: m.devise, unit_amount: m.cents, recurring: { interval: 'month' },
  product_data: { name: `Plan « ${plan.nom} »${m.taxes ? ' (taxes incluses)' : ''}` },
});

async function client(gid, cid) {
  return (await pool.query('SELECT id, email, nom_boutique, stripe_customer_id, stripe_subscription_id, plan_id, plan_suivant_id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0];
}

async function clientStripeId(ctx, col, gid) {
  if (col.stripe_customer_id) return col.stripe_customer_id;
  const c = await ctx.stripe.customers.create({ email: col.email || undefined, name: col.nom_boutique || undefined, metadata: { gestionnaire_id: String(gid), collaborateur_id: String(col.id), type: 'mv_plan' } });
  await pool.query('UPDATE marketplace_collaborateurs SET stripe_customer_id = $1 WHERE id = $2', [c.id, col.id]);
  return c.id;
}

const finPeriode = (sub) => {
  const t = sub.current_period_end || (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end);
  return t ? new Date(t * 1000) : null;
};

/** Relit l'abonnement chez Stripe et met à jour le collaborateur. `force` = ignorer le délai d'une heure. Ne lance jamais d'erreur. */
async function synchroniser(gid, cid, { force = false } = {}) {
  try {
    const r = (await pool.query('SELECT stripe_subscription_id, plan_verifie_le, plan_suivant_id, plan_statut, plan_impaye_depuis FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0];
    if (!r || !r.stripe_subscription_id) return false;
    if (!force && r.plan_verifie_le && Date.now() - new Date(r.plan_verifie_le).getTime() < FRAICHEUR_MS) return false;
    const ctx = await paiement.contexteStripe(gid);
    if (!ctx) return false;
    let sub;
    try { sub = await ctx.stripe.subscriptions.retrieve(r.stripe_subscription_id); }
    catch (e) { if (e && (e.code === 'resource_missing' || e.statusCode === 404)) sub = { status: 'canceled' }; else throw e; }
    const st = sub.status;
    if (st === 'active' || st === 'trialing') {
      await pool.query(`UPDATE marketplace_collaborateurs SET plan_statut = 'actif', plan_impaye_depuis = NULL, plan_fin_periode = $2, plan_annule = $3, plan_verifie_le = NOW() WHERE id = $1`,
        [cid, finPeriode(sub), sub.cancel_at_period_end === true]);
    } else if (st === 'past_due' || st === 'unpaid' || st === 'incomplete') {
      await pool.query(`UPDATE marketplace_collaborateurs SET plan_statut = 'impaye', plan_impaye_depuis = COALESCE(plan_impaye_depuis, NOW()), plan_verifie_le = NOW() WHERE id = $1`, [cid]);
    } else {   // canceled / incomplete_expired : l'abonnement est fini → plan suivant prévu, sinon le collaborateur doit en choisir un
      await pool.query(
        `UPDATE marketplace_collaborateurs SET stripe_subscription_id = NULL, plan_id = (SELECT id FROM mv_plans WHERE id = plan_suivant_id AND gestionnaire_id = $2),
                plan_suivant_id = NULL, plan_depuis = NOW(), plan_statut = 'actif', plan_impaye_depuis = NULL, plan_fin_periode = NULL, plan_annule = FALSE, plan_verifie_le = NOW()
          WHERE id = $1`, [cid, gid]);
    }
    return true;
  } catch (e) { console.error('[plans_stripe] synchro', e && e.message); return false; }
}

/** Démarre un abonnement (Checkout) ou change le plan d'un abonnement existant. Renvoie { url } (Checkout) ou { change: true }. */
async function abonner(gid, cid, plan, retourUrl) {
  const ctx = await contexte(gid);
  const col = await client(gid, cid);
  const m = await montantMensuel(gid, plan);
  if (m.cents < 50) throw new P.ErreurPlan('Prix du plan trop bas pour un paiement en ligne.', 400);

  // Abonnement déjà actif : on change le prix (au prorata) au lieu d'en créer un deuxième
  if (col.stripe_subscription_id) {
    await synchroniser(gid, cid, { force: true });
    const frais = await client(gid, cid);
    if (frais.stripe_subscription_id) {
      const sub = await ctx.stripe.subscriptions.retrieve(frais.stripe_subscription_id);
      await ctx.stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price_data: { currency: m.devise, unit_amount: m.cents, recurring: { interval: 'month' }, product: typeof sub.items.data[0].price.product === 'string' ? sub.items.data[0].price.product : sub.items.data[0].price.product.id } }],
        proration_behavior: 'create_prorations', cancel_at_period_end: false,
        metadata: { type: 'mv_plan', gestionnaire_id: String(gid), collaborateur_id: String(cid), plan_id: String(plan.id) },
      });
      await pool.query(`UPDATE marketplace_collaborateurs SET plan_id = $1, plan_depuis = NOW(), plan_suivant_id = NULL, plan_annule = FALSE, plan_verifie_le = NULL WHERE id = $2`, [plan.id, cid]);
      return { change: true };
    }
  }

  const customer = await clientStripeId(ctx, col, gid);
  const u = new URL(retourUrl);
  u.searchParams.set('page', 'dashboard-collaborateur');
  u.hash = '';
  const ok = new URL(u.toString()); ok.searchParams.set('plan', 'succes');
  const ko = new URL(u.toString()); ko.searchParams.set('plan', 'annule');
  const meta = { type: 'mv_plan', gestionnaire_id: String(gid), collaborateur_id: String(cid), plan_id: String(plan.id) };
  const session = await ctx.stripe.checkout.sessions.create({
    mode: 'subscription', customer,
    line_items: [{ quantity: 1, price_data: lignePrix(plan, m) }],
    success_url: `${ok.toString()}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: ko.toString(),
    metadata: meta, subscription_data: { metadata: meta },
  });
  await pool.query('UPDATE marketplace_collaborateurs SET plan_session_id = $1 WHERE id = $2', [session.id, cid]);
  return { url: session.url };
}

/** Finalise un paiement revenu de Stripe (ou retrouvé plus tard). Idempotent. Renvoie true si le plan est maintenant actif. */
async function confirmer(gid, cid, sessionId) {
  const ctx = await contexte(gid);
  const col = (await pool.query('SELECT plan_session_id, stripe_subscription_id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0];
  const sid = sessionId || (col && col.plan_session_id);
  if (!sid || !/^cs_[A-Za-z0-9_]+$/.test(sid)) return false;
  const s = await ctx.stripe.checkout.sessions.retrieve(sid);
  const md = s.metadata || {};
  if (md.type !== 'mv_plan' || md.gestionnaire_id !== String(gid) || md.collaborateur_id !== String(cid)) throw new P.ErreurPlan('Session de paiement invalide.', 403);
  if (s.status !== 'complete' || !s.subscription) return false;
  const plan = await P.lirePlan(gid, parseInt(md.plan_id, 10), pool);
  if (!plan) throw new P.ErreurPlan('Plan introuvable.', 404);
  const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
  await pool.query(
    `UPDATE marketplace_collaborateurs SET plan_id = $1, plan_depuis = NOW(), plan_statut = 'actif', plan_impaye_depuis = NULL, plan_suivant_id = NULL, plan_annule = FALSE,
            stripe_subscription_id = $2, stripe_customer_id = COALESCE(stripe_customer_id, $3), plan_session_id = NULL, plan_verifie_le = NULL
      WHERE id = $4 AND gestionnaire_id = $5`, [plan.id, subId, typeof s.customer === 'string' ? s.customer : (s.customer && s.customer.id) || null, cid, gid]);
  await synchroniser(gid, cid, { force: true });
  return true;
}

/** Passe à un plan GRATUIT quand on a un abonnement payant : l'abonnement s'arrête à la fin de la période déjà payée. */
async function versGratuit(gid, cid, plan) {
  const col = await client(gid, cid);
  if (!col || !col.stripe_subscription_id) return { immediat: true };
  const ctx = await contexte(gid);
  await ctx.stripe.subscriptions.update(col.stripe_subscription_id, { cancel_at_period_end: true });
  await pool.query('UPDATE marketplace_collaborateurs SET plan_suivant_id = $1, plan_annule = TRUE, plan_verifie_le = NULL WHERE id = $2', [plan.id, cid]);
  return { immediat: false };
}

/** Portail Stripe du client (carte, factures, annulation). */
async function portail(gid, cid, retourUrl) {
  const ctx = await contexte(gid);
  const col = await client(gid, cid);
  if (!col || !col.stripe_customer_id) throw new P.ErreurPlan("Vous n'avez pas encore d'abonnement.", 409);
  const u = new URL(retourUrl); u.searchParams.set('page', 'dashboard-collaborateur'); u.hash = '';
  try {
    const s = await ctx.stripe.billingPortal.sessions.create({ customer: col.stripe_customer_id, return_url: u.toString() });
    return { url: s.url };
  } catch (e) {
    throw new P.ErreurPlan("Le portail de facturation n'est pas encore configuré chez Stripe (Paramètres → Facturation → Portail client). Contactez le gestionnaire.", 409);
  }
}

module.exports = { synchroniser, abonner, confirmer, versGratuit, portail, montantMensuel };