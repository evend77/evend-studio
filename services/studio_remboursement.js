// CHEMIN : services/studio_remboursement.js
// e-Vend Studio — remboursement d'une commande PAYÉE (Stripe) : refus par le collaborateur, remboursement partiel ou total.
//
// Règles :
//   • Le gestionnaire décide (Configuration marketplace → Remboursements → « Le collaborateur peut rembourser lui-même », clé
//     multivendeur.remboursement_collab_autonome). Désactivé (défaut) : la demande attend l'approbation du gestionnaire.
//   • Le montant remboursé ne dépasse jamais ce qui reste de la commande ; une seule demande ouverte par commande.
//   • Stripe : remboursement du paiement ET de la commission du gestionnaire au prorata (refund_application_fee) ; en « destination
//     charge », le transfert au vendeur est aussi repris (reverse_transfer). Clé d'idempotence = id de la demande (aucun double remboursement).
//   • Remboursement TOTAL d'une commande pas encore expédiée (ou refus) : commande annulée et stock remis.

'use strict';

const pool = require('../db');
const paiement = require('./studio_paiement');

class ErreurRemboursement extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const refus = (m, s) => { throw new ErreurRemboursement(m, s); };
const cents = (v) => Math.round((parseFloat(v) || 0) * 100 + 1e-7);

async function noter(db, commandeId, evenement, detail, auteur) {
  try { await db.query('INSERT INTO commande_historique (commande_id, evenement, detail, auteur) VALUES ($1,$2,$3,$4)', [commandeId, evenement, detail || null, auteur || 'systeme']); }
  catch (e) { console.error('[studio_remboursement] historique :', e.message); }
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  if (!acheteurId) return;
  try { await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'commande')`, [gid, acheteurId, titre, message]); }
  catch (e) { console.error('[studio_remboursement] notification :', e.message); }
}

async function collaborateurAutonome(gid) {
  const r = await pool.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  const mv = (r.rows[0] && r.rows[0].config && r.rows[0].config.multivendeur) || {};
  return mv.remboursement_collab_autonome === true;
}

// Ce qui reste remboursable (en cents) pour une commande
const restantC = (c) => Math.max(0, cents(c.total) - cents(c.montant_rembourse));

// Crée une demande ; l'exécute tout de suite si le gestionnaire l'autorise (ou s'il la fait lui-même).
//   montant null = tout ce qui reste.  Retourne { statut: 'effectue' | 'en_attente', remboursement_id, montant }
async function demander({ gid, collaborateurId, commandeId, origine = 'remboursement', montant = null, raison, par = 'collaborateur' }) {
  raison = String(raison || '').trim();
  if (!raison) refus('La raison est obligatoire.');
  if (raison.length > 500) refus('Raison trop longue (500 caractères maximum).');
  const client = await pool.connect();
  let id;
  try {
    await client.query('BEGIN');
    const c = (await client.query(
      `SELECT id, statut, statut_paiement, total, montant_rembourse, collaborateur_id FROM marketplace_commandes
        WHERE id = $1 AND gestionnaire_id = $2 AND ($3::int IS NULL OR collaborateur_id = $3) FOR UPDATE`, [commandeId, gid, collaborateurId || null])).rows[0];
    if (!c) refus('Commande introuvable.', 404);
    if (c.statut_paiement !== 'paye') refus(c.statut_paiement === 'rembourse' ? 'Cette commande est déjà entièrement remboursée.' : "Cette commande n'a pas été payée : il n'y a rien à rembourser.", 409);
    if (origine === 'refus' && !['en_attente', 'confirmee'].includes(c.statut)) refus('Une commande déjà expédiée ne peut plus être refusée : faites un remboursement.', 409);
    const reste = restantC(c);
    if (reste <= 0) refus('Cette commande est déjà entièrement remboursée.', 409);
    const demandeC = origine === 'refus' || montant === null || montant === undefined ? reste : cents(montant);
    if (!(demandeC > 0)) refus('Montant invalide.');
    if (demandeC > reste) refus(`Le montant dépasse ce qui reste remboursable (${(reste / 100).toFixed(2)} $).`);
    const ouverte = await client.query(`SELECT 1 FROM commande_remboursements WHERE commande_id = $1 AND statut IN ('en_attente','en_cours')`, [commandeId]);
    if (ouverte.rows.length) refus('Un remboursement est déjà en cours ou en attente d\'approbation pour cette commande.', 409);
    const ins = await client.query(
      `INSERT INTO commande_remboursements (gestionnaire_id, collaborateur_id, commande_id, origine, montant, raison, statut, demande_par)
       VALUES ($1,$2,$3,$4,$5,$6,'en_attente',$7) RETURNING id`,
      [gid, c.collaborateur_id, commandeId, origine, demandeC / 100, raison, par]);
    id = ins.rows[0].id;
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }

  const m = (await pool.query('SELECT montant FROM commande_remboursements WHERE id = $1', [id])).rows[0].montant;
  await noter(pool, commandeId, origine === 'refus' ? 'refus_demande' : 'remboursement_demande', `${Number(m).toFixed(2)} $ — ${raison}`, par);
  if (par === 'gestionnaire' || await collaborateurAutonome(gid)) {
    const r = await executer(id, { par });
    return { statut: 'effectue', remboursement_id: id, montant: Number(m), ...r };
  }
  return { statut: 'en_attente', remboursement_id: id, montant: Number(m) };
}

// Envoie le remboursement à Stripe puis met la commande à jour.
async function executer(remboursementId, { par = 'collaborateur', gid = null } = {}) {
  // 1) Verrouille la demande (en_attente → en_cours) : un seul exécutant possible
  const client = await pool.connect();
  let dem, cmd;
  try {
    await client.query('BEGIN');
    dem = (await client.query(
      `SELECT * FROM commande_remboursements WHERE id = $1 AND ($2::int IS NULL OR gestionnaire_id = $2) FOR UPDATE`, [remboursementId, gid])).rows[0];
    if (!dem) refus('Demande introuvable.', 404);
    if (dem.statut !== 'en_attente') refus('Cette demande a déjà été traitée.', 409);
    cmd = (await client.query('SELECT * FROM marketplace_commandes WHERE id = $1 FOR UPDATE', [dem.commande_id])).rows[0];
    if (!cmd || cmd.statut_paiement !== 'paye') refus("Cette commande n'est plus remboursable.", 409);
    if (cents(dem.montant) > restantC(cmd)) refus('Le montant dépasse ce qui reste remboursable.', 409);
    await client.query(`UPDATE commande_remboursements SET statut = 'en_cours', traite_par = $2 WHERE id = $1`, [remboursementId, par]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }

  // 2) Stripe (hors transaction)
  let refundId = null;
  try {
    if (!cmd.stripe_payment_intent) throw new Error('Paiement Stripe introuvable pour cette commande.');
    const ctx = await paiement.contexteStripe(dem.gestionnaire_id);
    if (!ctx) throw new Error("Stripe n'est pas configuré pour cette boutique.");
    if (cmd.stripe_env && ctx.env !== cmd.stripe_env) throw new Error(`Cette commande a été payée en mode ${cmd.stripe_env === 'dev' ? 'test' : 'production'} : changez le mode Stripe pour la rembourser.`);
    const direct = String(ctx.p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
    const params = { payment_intent: cmd.stripe_payment_intent, amount: cents(dem.montant), refund_application_fee: true, reason: 'requested_by_customer',
      metadata: { type: 'mv_remboursement', commande_id: String(cmd.id), remboursement_id: String(dem.id) } };
    const opts = { idempotencyKey: `mvref-${dem.id}` };
    if (direct) {
      const cs = (await pool.query('SELECT stripe_account_id FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3', [cmd.collaborateur_id, dem.gestionnaire_id, ctx.env])).rows[0];
      if (!cs || !cs.stripe_account_id) throw new Error('Compte Stripe du vendeur introuvable.');
      opts.stripeAccount = cs.stripe_account_id;
    } else params.reverse_transfer = true;
    const rf = await ctx.stripe.refunds.create(params, opts);
    refundId = rf && rf.id;
  } catch (e) {
    await pool.query(`UPDATE commande_remboursements SET statut = 'echoue', erreur = $2, traite_le = NOW() WHERE id = $1`, [remboursementId, String(e.message || e).slice(0, 300)]);
    await noter(pool, dem.commande_id, 'remboursement_echoue', String(e.message || e).slice(0, 200), par);
    console.error('[studio_remboursement] Stripe :', e.message);
    refus(`Le remboursement n'a pas pu être effectué : ${e.message || 'erreur Stripe'}`, 502);
  }

  // 3) Mise à jour de la commande (+ stock si annulée)
  const c2 = await pool.connect();
  let totalRembourse = false, annulee = false;
  try {
    await c2.query('BEGIN');
    const cm = (await c2.query('SELECT * FROM marketplace_commandes WHERE id = $1 FOR UPDATE', [dem.commande_id])).rows[0];
    const cumulC = cents(cm.montant_rembourse) + cents(dem.montant);
    totalRembourse = cumulC >= cents(cm.total);
    annulee = (dem.origine === 'refus' || totalRembourse) && ['en_attente', 'confirmee'].includes(cm.statut);
    await c2.query(
      `UPDATE marketplace_commandes SET montant_rembourse = $2, statut_paiement = CASE WHEN $3 THEN 'rembourse' ELSE statut_paiement END,
              statut = CASE WHEN $4 THEN 'annulee' ELSE statut END, raison_annulation = CASE WHEN $4 THEN $5 ELSE raison_annulation END, updated_at = NOW()
        WHERE id = $1`, [cm.id, cumulC / 100, totalRembourse, annulee, dem.raison]);
    if (annulee) {
      let arts = cm.articles; if (typeof arts === 'string') { try { arts = JSON.parse(arts); } catch (e) { arts = []; } }
      for (const a of Array.isArray(arts) ? arts : []) {
        if (a.enchere_id) continue; // l'unité d'une enchère n'est pas remise en vente automatiquement
        const pid = parseInt(a.produit_id, 10); const q = parseInt(a.quantite, 10) || 0;
        if (pid && q > 0) await paiement.ajusterStock(c2, pid, a.variante || '', q);
      }
    }
    await c2.query(`UPDATE commande_remboursements SET statut = 'effectue', stripe_refund_id = $2, traite_le = NOW() WHERE id = $1`, [remboursementId, refundId]);
    await c2.query('COMMIT');
  } catch (e) {
    await c2.query('ROLLBACK').catch(() => {});
    // L'argent est déjà remboursé chez Stripe : on garde une trace claire pour la reprise manuelle
    console.error(`[studio_remboursement] ⚠️ remboursement Stripe ${refundId} fait mais base non mise à jour (commande ${dem.commande_id}) :`, e.message);
    await pool.query(`UPDATE commande_remboursements SET statut = 'effectue', stripe_refund_id = $2, traite_le = NOW(), erreur = 'Base non mise à jour : à vérifier' WHERE id = $1`, [remboursementId, refundId]).catch(() => {});
    throw e;
  } finally { c2.release(); }

  await noter(pool, dem.commande_id, dem.origine === 'refus' ? 'commande_refusee' : 'remboursement_effectue',
    `${Number(dem.montant).toFixed(2)} $${totalRembourse ? ' (total)' : ''} — ${dem.raison}`, par);
  await notifierAcheteur(dem.gestionnaire_id, cmd.acheteur_id,
    dem.origine === 'refus' ? 'Commande refusée et remboursée' : 'Remboursement effectué',
    `Votre commande ${cmd.numero_commande} : ${Number(dem.montant).toFixed(2)} $ vous ${dem.montant > 1 ? 'sont' : 'est'} remboursé${totalRembourse ? ' (remboursement total)' : ''}. Raison : ${dem.raison}`);
  return { montant: Number(dem.montant), total_rembourse: totalRembourse, annulee, stripe_refund_id: refundId };
}

// Le gestionnaire refuse une demande en attente
async function refuserDemande(remboursementId, gid, motif) {
  motif = String(motif || '').trim();
  if (!motif) refus('Le motif du refus est obligatoire.');
  if (motif.length > 500) refus('Motif trop long (500 caractères maximum).');
  const r = await pool.query(
    `UPDATE commande_remboursements SET statut = 'refuse', motif_refus = $3, traite_par = 'gestionnaire', traite_le = NOW()
      WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'en_attente' RETURNING commande_id, montant`, [remboursementId, gid, motif]);
  if (!r.rows[0]) refus('Demande introuvable ou déjà traitée.', 404);
  await noter(pool, r.rows[0].commande_id, 'remboursement_refuse', motif, 'gestionnaire');
  return { success: true };
}

module.exports = { ErreurRemboursement, demander, executer, refuserDemande, collaborateurAutonome, noter, restantC };