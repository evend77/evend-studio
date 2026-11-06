// CHEMIN : services/studio_paiement.js
// e-Vend Studio — Paiement des commandes du multivendeur.
//
//   creerCommandePayable(...)  : recalcule TOUT côté serveur (prix, stock, expédition, taxes, commission),
//                                réserve le stock, crée la commande + la session Stripe Checkout.
//   confirmerPaiement(...)     : appelé par le webhook (paiement réussi) → commande payée.
//   libererCommande(...)       : remet le stock (session expirée, commande annulée…). Idempotent.
//   balayerCommandesExpirees() : filet de sécurité (toutes les 5 min) pour les commandes jamais payées.
//
// Les clés Stripe sont celles du GESTIONNAIRE (jamais celles de la plateforme).

'use strict';

const Stripe = require('stripe');
const pool = require('../db');
const { dechiffrer } = require('../src/utils/chiffrement');

const DUREE_SESSION_MIN = 30; // minimum permis par Stripe

class ErreurPaiement extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const refus = (m, s) => { throw new ErreurPaiement(m, s); };

const nombre = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const cents = (v) => Math.round((Number(v) || 0) * 100);

// ── Commission (réglée par le gestionnaire : Config multi → Commission) ──────
function commissionDe(mv, { sousTotal, taxes, expedition, total }) {
  mv = mv || {};
  let base = sousTotal;
  if (mv.calcul_commission_base === 'avec_taxes') base = sousTotal + taxes;
  else if (mv.calcul_commission_base === 'avec_expedition') base = sousTotal + expedition;

  let type = mv.type_commission_globale || '%';
  let a = nombre(mv.commission_globale, 0);
  let b = nombre(mv.seconde_commission_globale, 0);
  const baremes = Array.isArray(mv.baremes_commission) ? mv.baremes_commission : [];
  const bareme = baremes.find((x) => x && base >= nombre(x.min, 0) && base <= (String(x.max ?? '').trim() === '' ? Infinity : nombre(x.max, Infinity)));
  if (bareme) { type = bareme.type || '%'; a = nombre(bareme.premiereCommission, 0); b = nombre(bareme.secondeCommission, 0); }

  let c = 0;
  if (type === 'FIXED') c = a;
  else if (type === '% + FIXED') c = base * a / 100 + b;
  else c = base * a / 100;
  if (mv.activer_commission_max && nombre(mv.commission_max, 0) > 0) c = Math.min(c, nombre(mv.commission_max, 0));
  c = Math.max(0, Math.min(c, total)); // jamais négative, jamais plus que la commande
  return Math.round(c * 100) / 100;
}

// ── Stock ────────────────────────────────────────────────────────────────────
// delta < 0 : retire ; delta > 0 : remet. Retourne false si le stock est insuffisant.
// Stock vide (NULL) = illimité. Une variante avec son propre stock le gère elle-même.
async function ajusterStock(client, produitId, variante, delta) {
  const r = await client.query('SELECT stock, variantes FROM produits WHERE id = $1 FOR UPDATE', [produitId]);
  const p = r.rows[0];
  if (!p) return true;
  let vars = p.variantes;
  if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = null; } }
  if (variante && Array.isArray(vars)) {
    const v = vars.find((x) => x && typeof x.nom === 'string' && x.nom.trim() === variante);
    if (v && v.stock !== null && v.stock !== undefined && v.stock !== '') {
      const nouveau = Math.trunc(Number(v.stock)) + delta;
      if (nouveau < 0) return false;
      v.stock = nouveau;
      await client.query('UPDATE produits SET variantes = $1 WHERE id = $2', [JSON.stringify(vars), produitId]);
      return true;
    }
  }
  if (p.stock === null || p.stock === undefined) return true;
  const nouveau = Number(p.stock) + delta;
  if (nouveau < 0) return false;
  await client.query('UPDATE produits SET stock = $1 WHERE id = $2', [nouveau, produitId]);
  return true;
}

// Remet le stock d'une commande non payée. Idempotent : le drapeau stock_reserve n'est retiré qu'une fois.
async function libererCommande(commandeId, { raison, annuler = true, par = 'systeme' } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      `UPDATE marketplace_commandes SET stock_reserve = false WHERE id = $1 AND stock_reserve = true AND statut_paiement <> 'paye'
       RETURNING id, articles, stripe_session_id, gestionnaire_id`, [commandeId]);
    if (!c.rows[0]) { await client.query('ROLLBACK'); return false; }
    let articles = c.rows[0].articles;
    if (typeof articles === 'string') { try { articles = JSON.parse(articles); } catch (e) { articles = []; } }
    for (const a of Array.isArray(articles) ? articles : []) {
      const pid = parseInt(a.produit_id, 10);
      const q = parseInt(a.quantite, 10);
      if (pid && q > 0) await ajusterStock(client, pid, a.variante || '', q);
    }
    if (annuler) {
      await client.query(
        `UPDATE marketplace_commandes SET statut = 'annulee', statut_paiement = CASE WHEN statut_paiement = 'en_attente' THEN 'echoue' ELSE statut_paiement END,
                annule_par = COALESCE(annule_par, $2), raison_annulation = COALESCE(raison_annulation, $3), updated_at = NOW()
          WHERE id = $1 AND statut_paiement <> 'paye'`,
        [commandeId, par, raison || 'Paiement non complété']);
    }
    await client.query('COMMIT');
    return c.rows[0];
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}

// ── Stripe du gestionnaire ───────────────────────────────────────────────────
function lire(v) { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } }

async function contexteStripe(gid) {
  const r = await pool.query('SELECT * FROM gestionnaire_stripe_config WHERE gestionnaire_id = $1', [gid]);
  const cfg = r.rows[0];
  if (!cfg) return null;
  const env = cfg.sandbox ? 'dev' : 'prod';
  const cle = lire(env === 'dev' ? cfg.dev_secret_key : cfg.prod_secret_key);
  const connectActif = env === 'dev' ? cfg.connect_actif_dev : cfg.connect_actif_prod;
  if (!cle || !connectActif) return null;
  return { env, p: cfg.parametres && typeof cfg.parametres === 'object' ? cfg.parametres : {}, stripe: Stripe(cle) };
}

// ── Création de la commande + session de paiement ────────────────────────────
// outils : { prixEtStock, calculerTaxesProvince, fraisExpedition } (viennent de marketplace-panier.js)
async function creerCommandePayable({ gid, acheteurId, collaborateurId, adresse, methodeId, note, outils }) {
  const ctx = await contexteStripe(gid);
  if (!ctx) refus("Le paiement n'est pas encore configuré pour cette boutique.", 503);

  const collab = (await pool.query(
    `SELECT mc.id, mc.statut, cs.stripe_account_id, cs.statut AS stripe_statut, cs.charges_enabled
       FROM marketplace_collaborateurs mc
       LEFT JOIN collaborateurs_stripe cs ON cs.collaborateur_id = mc.id AND cs.gestionnaire_id = mc.gestionnaire_id AND cs.env = $3
      WHERE mc.id = $1 AND mc.gestionnaire_id = $2`, [collaborateurId, gid, ctx.env])).rows[0];
  if (!collab || collab.statut !== 'actif') refus("Cette boutique n'est pas disponible.", 404);
  if (!collab.stripe_account_id || collab.stripe_statut !== 'active' || !collab.charges_enabled) refus("Ce vendeur n'accepte pas encore les paiements en ligne.", 409);

  const acheteur = (await pool.query('SELECT id, email FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0];
  if (!acheteur) refus('Compte acheteur introuvable.', 404);
  const site = (await pool.query('SELECT slug, domaine_custom, config FROM sites WHERE gestionnaire_id = $1', [gid])).rows[0] || {};
  const domaine = site.domaine_custom || (site.slug ? `${site.slug}.e-vendstudio.ca` : '');
  if (!domaine) refus("Le site de cette boutique n'est pas publié.", 503);
  const mv = (site.config && site.config.multivendeur) || {};
  const devise = String(mv.devise || 'CAD').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3) || 'cad';
  const urlSite = `https://${domaine}`;

  const province = adresse && typeof adresse.province === 'string' ? adresse.province.toUpperCase().slice(0, 2) : 'QC';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const panier = (await client.query(
      `SELECT * FROM marketplace_panier WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 ORDER BY created_at ASC`,
      [acheteurId, gid, collaborateurId])).rows;
    if (!panier.length) refus('Votre panier est vide.', 404);

    // 1) Prix et stock relus dans la base — le navigateur n'envoie que l'adresse et le mode d'expédition
    const lignes = [];
    for (const ligne of panier) {
      const pid = parseInt(ligne.produit_id, 10);
      const prod = pid ? (await client.query(
        `SELECT id, titre, prix, prix_promo, stock, variantes, statut FROM produits
          WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 FOR UPDATE`, [pid, gid, collaborateurId])).rows[0] : null;
      if (!prod || prod.statut !== 'actif') refus(`« ${ligne.titre} » n'est plus disponible. Retirez-le de votre panier.`, 409);
      const variante = ligne.variante || '';
      const choix = outils.prixEtStock(prod, variante);
      if (choix.erreur) refus(`« ${ligne.titre} » : ${choix.erreur}`, 409);
      const qte = parseInt(ligne.quantite, 10);
      if (!(qte >= 1)) refus('Quantité invalide.', 400);
      if (qte > choix.stock) refus(choix.stock <= 0 ? `« ${ligne.titre} » est épuisé.` : `« ${ligne.titre} » : il n'en reste que ${choix.stock}.`, 409);
      if (!(await ajusterStock(client, pid, variante, -qte))) refus(`« ${ligne.titre} » est épuisé.`, 409);
      lignes.push({ produit_id: pid, titre: ligne.titre, variante, quantite: qte, prix: choix.prix, image_url: ligne.image_url || null,
                    produit_numerique: ligne.produit_numerique === true, facturation_taxes: ligne.facturation_taxes !== false });
    }

    // 2) Expédition, taxes, total — tout calculé ici, en cents
    const sousTotalC = lignes.reduce((s, l) => s + cents(l.prix) * l.quantite, 0);
    const exp = await outils.fraisExpedition(client, lignes, sousTotalC / 100, methodeId);
    if (exp.erreur) refus(exp.erreur, 400);
    const fraisC = cents(exp.frais);
    const tx = outils.calculerTaxesProvince(sousTotalC / 100, fraisC / 100, province, lignes);
    const taxesC = cents(tx.tps) + cents(tx.tvq) + cents(tx.tvh);
    const totalC = sousTotalC + fraisC + taxesC;
    if (totalC < 50) refus('Le montant de la commande est trop bas pour un paiement en ligne.', 400);
    const total = totalC / 100;

    // 3) Commission du gestionnaire (en cents, jamais plus que le total)
    const commission = commissionDe(mv, { sousTotal: sousTotalC / 100, taxes: taxesC / 100, expedition: fraisC / 100, total });
    const commissionC = Math.min(cents(commission), totalC);

    const numero = `MV-${gid}-${Date.now()}`;
    const expireLe = new Date(Date.now() + DUREE_SESSION_MIN * 60000);
    const ins = await client.query(
      `INSERT INTO marketplace_commandes
         (gestionnaire_id, acheteur_id, collaborateur_id, numero_commande, statut, statut_paiement, total, commission, montant_net,
          articles, adresse_livraison, note, frais_expedition, taxes, stock_reserve, expire_le, stripe_env)
       VALUES ($1,$2,$3,$4,'en_attente','en_attente',$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14) RETURNING id`,
      [gid, acheteurId, collaborateurId, numero, total, commissionC / 100, (totalC - commissionC) / 100, JSON.stringify(lignes),
       JSON.stringify(adresse || {}), note ? String(note).slice(0, 500) : null, fraisC / 100,
       JSON.stringify({ tps: tx.tps, tvq: tx.tvq, tvh: tx.tvh, label: tx.label_taxe, province }), expireLe, ctx.env]);
    const commandeId = ins.rows[0].id;

    // 4) Session Stripe Checkout : une ligne par article + expédition + taxes (le total Stripe = notre total)
    const lineItems = lignes.map((l) => ({
      quantity: l.quantite,
      price_data: { currency: devise, unit_amount: cents(l.prix), product_data: { name: String(l.titre).slice(0, 120) } },
    }));
    if (fraisC > 0) lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: fraisC, product_data: { name: 'Expédition' } } });
    if (taxesC > 0) lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: taxesC, product_data: { name: `Taxes (${tx.label_taxe})` } } });

    const direct = String(ctx.p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
    const meta = { type: 'mv_commande', commande_id: String(commandeId), gestionnaire_id: String(gid), collaborateur_id: String(collaborateurId) };
    const paymentIntentData = { metadata: meta };
    if (commissionC > 0) paymentIntentData.application_fee_amount = commissionC;
    if (!direct) paymentIntentData.transfer_data = { destination: collab.stripe_account_id };

    const params = {
      mode: 'payment',
      line_items: lineItems,
      customer_email: acheteur.email,
      metadata: meta,
      payment_intent_data: paymentIntentData,
      expires_at: Math.floor(expireLe.getTime() / 1000),
      success_url: `${urlSite}/?page=dashboard-acheteur&paiement=succes&commande=${encodeURIComponent(numero)}`,
      cancel_url: `${urlSite}/?page=dashboard-acheteur&paiement=annule&commande=${encodeURIComponent(numero)}`,
    };
    let session;
    try {
      session = await ctx.stripe.checkout.sessions.create(params, direct ? { stripeAccount: collab.stripe_account_id } : undefined);
    } catch (e) {
      console.error('[studio_paiement] Stripe :', e.message);
      refus("Le paiement n'a pas pu être démarré. Réessayez dans un instant.", 502);
    }
    await client.query('UPDATE marketplace_commandes SET stripe_session_id = $1 WHERE id = $2', [session.id, commandeId]);

    // Panier vidé seulement quand la commande est bien créée
    await client.query('DELETE FROM marketplace_panier WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3', [acheteurId, gid, collaborateurId]);
    await client.query('COMMIT');
    return { commande_id: commandeId, numero_commande: numero, checkout_url: session.url, total, expire_le: expireLe };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}


// Annulation d'une commande NON payée (par l'acheteur ou le collaborateur) : la page de paiement Stripe est fermée
// (sinon l'acheteur pourrait encore payer une commande annulée), la commande passe à « annulée » et le stock est remis.
async function annulerNonPayee(commandeId, { par, raison } = {}) {
  const c = (await pool.query('SELECT gestionnaire_id, stripe_session_id, stripe_env, collaborateur_id, statut_paiement FROM marketplace_commandes WHERE id = $1', [commandeId])).rows[0];
  if (!c) return false;
  if (c.statut_paiement === 'paye') refus('Commande déjà payée.', 409);
  if (c.stripe_session_id) {
    const ctx = await contexteStripe(c.gestionnaire_id);
    if (ctx) {
      try {
        const direct = String(ctx.p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
        let opts;
        if (direct) {
          const cs = (await pool.query('SELECT stripe_account_id FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3', [c.collaborateur_id, c.gestionnaire_id, ctx.env])).rows[0];
          if (cs) opts = { stripeAccount: cs.stripe_account_id };
        }
        await ctx.stripe.checkout.sessions.expire(c.stripe_session_id, {}, opts);
      } catch (e) {
        if (/complete/i.test(e.message || '') && !/expired/i.test(e.message || '')) refus('Le paiement est en cours de traitement. Réessayez dans un instant.', 409);
        // session déjà expirée ou introuvable : on continue
      }
    }
  }
  await pool.query(
    `UPDATE marketplace_commandes SET statut = 'annulee', annule_par = $2, raison_annulation = NULLIF($3,''), updated_at = NOW()
      WHERE id = $1 AND statut_paiement <> 'paye'`, [commandeId, par || 'systeme', raison || '']);
  await libererCommande(commandeId, { annuler: false });
  return true;
}

// ── Webhook : paiement réussi ────────────────────────────────────────────────
async function confirmerPaiement(gid, session) {
  const meta = session.metadata || {};
  if (meta.type !== 'mv_commande' || String(meta.gestionnaire_id) !== String(gid)) return { ignore: true };
  if (session.payment_status !== 'paid') return { ignore: true };
  const commandeId = parseInt(meta.commande_id, 10);
  if (!commandeId) return { ignore: true };
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null;

  const r = await pool.query(
    `UPDATE marketplace_commandes
        SET statut_paiement = 'paye', statut = CASE WHEN statut = 'en_attente' THEN 'confirmee' ELSE statut END,
            stripe_payment_intent = $1, paye_le = NOW(), expire_le = NULL, stock_reserve = false, updated_at = NOW()
      WHERE id = $2 AND gestionnaire_id = $3 AND stripe_session_id = $4 AND statut_paiement = 'en_attente' AND statut <> 'annulee'
        AND ROUND(total * 100) = $5
      RETURNING id, numero_commande`,
    [pi, commandeId, gid, session.id, session.amount_total]);
  if (r.rows[0]) return { paye: true, commande: r.rows[0] };

  const c = (await pool.query('SELECT statut, statut_paiement, total FROM marketplace_commandes WHERE id = $1 AND gestionnaire_id = $2', [commandeId, gid])).rows[0];
  if (c && c.statut_paiement === 'paye') return { deja: true };
  console.error(`[studio_paiement] ⚠️ paiement reçu mais commande ${commandeId} non confirmée (état: ${c ? c.statut + '/' + c.statut_paiement : 'introuvable'}, montant Stripe ${session.amount_total}). À vérifier/rembourser manuellement.`);
  return { anomalie: true };
}

async function sessionExpiree(gid, session) {
  const meta = session.metadata || {};
  if (meta.type !== 'mv_commande' || String(meta.gestionnaire_id) !== String(gid)) return { ignore: true };
  const commandeId = parseInt(meta.commande_id, 10);
  if (!commandeId) return { ignore: true };
  const ok = await libererCommande(commandeId, { raison: 'Session de paiement expirée', par: 'systeme' });
  return { libere: !!ok };
}

// ── Filet de sécurité ────────────────────────────────────────────────────────
async function balayerCommandesExpirees() {
  try {
    const r = await pool.query(
      `SELECT id FROM marketplace_commandes
        WHERE stock_reserve = true AND statut_paiement = 'en_attente' AND expire_le IS NOT NULL AND expire_le < NOW() - INTERVAL '10 minutes'
        LIMIT 100`);
    for (const c of r.rows) await libererCommande(c.id, { raison: 'Paiement non complété', par: 'systeme' });
    return r.rows.length;
  } catch (e) { console.error('[studio_paiement] balayage :', e.message); return 0; }
}
function demarrerBalayage() {
  const t = setInterval(balayerCommandesExpirees, 5 * 60000);
  if (t.unref) t.unref();
}

module.exports = { ErreurPaiement, commissionDe, ajusterStock, libererCommande, annulerNonPayee, contexteStripe, creerCommandePayable, confirmerPaiement, sessionExpiree, balayerCommandesExpirees, demarrerBalayage };