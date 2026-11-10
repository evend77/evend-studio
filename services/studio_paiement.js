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
const vacances = require('./studio_vacances');
const { dechiffrer } = require('../src/utils/chiffrement');
const promo = require('./studio_promo');
const taxesMV = require('./studio_taxes');
const regCmd = require('./studio_regles_commande');
const cfgMV = require('./studio_config_mv');
const OFFRES = require('./studio_offres');
const PALIERS = require('./studio_paliers');
const NEGO = require('./studio_negociations');
const reglesMV = require('./studio_regles_produits');

const DUREE_SESSION_MIN = 30; // minimum permis par Stripe

class ErreurPaiement extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const refus = (m, s) => { throw new ErreurPaiement(m, s); };

const nombre = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const cents = (v) => Math.round((Number(v) || 0) * 100);

// ── Commission (réglée par le gestionnaire : Config multi → Commission) ──────
// La partie FIXE de la commission s'applique une fois par commande (défaut) ou pour chaque article acheté
// (mv.commission_fixe_application = 'article' × nbArticles). Le plafond « Commission maximum » s'applique ensuite.
function commissionDe(mv, { sousTotal, taxes, expedition, total, nbArticles }) {
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

  const fois = mv.commission_fixe_application === 'article' ? Math.max(1, parseInt(nbArticles, 10) || 1) : 1;
  let c = 0;
  if (type === 'FIXED') c = a * fois;
  else if (type === '% + FIXED') c = base * a / 100 + b * fois;
  else c = base * a / 100;
  if (mv.activer_commission_max && nombre(mv.commission_max, 0) > 0) c = Math.min(c, nombre(mv.commission_max, 0));
  c = Math.max(0, Math.min(c, total)); // jamais négative, jamais plus que la commande
  return Math.round(c * 100) / 100;
}

// ── Stock ────────────────────────────────────────────────────────────────────
// delta < 0 : retire ; delta > 0 : remet. Retourne false si le stock est insuffisant.
// Stock vide (NULL) = illimité. Une variante avec son propre stock le gère elle-même.
async function ajusterStock(client, produitId, variante, delta) {
  const r = await client.query('SELECT stock, variantes, gestionnaire_id FROM produits WHERE id = $1 FOR UPDATE', [produitId]);
  const p = r.rows[0];
  if (!p) return true;
  // Config produits → Gérer l'inventaire désactivé : le stock n'est plus suivi (ni retiré, ni remis)
  if (!reglesMV.deMV(await cfgMV.lire(p.gestionnaire_id, client)).gererStock) return true;
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


// Le gagnant peut réessayer de payer tant que son délai n'est pas écoulé : l'article verrouillé revient dans son panier.
async function remettreEnchereAuPanier(client, cmd, enchereId) {
  const e = (await client.query(
    `SELECT * FROM encheres WHERE id = $1 AND statut = 'attente_paiement' AND gagnant_id = $2 AND paiement_expire_le > NOW()`, [enchereId, cmd.acheteur_id])).rows[0];
  if (!e) return;
  const deja = await client.query('SELECT 1 FROM marketplace_panier WHERE enchere_id = $1 AND acheteur_id = $2', [enchereId, cmd.acheteur_id]);
  if (deja.rows.length) return;
  await client.query(
    `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, enchere_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)`,
    [e.gestionnaire_id, e.gagnant_id, e.collaborateur_id, String(e.produit_id), e.titre, e.image_url, e.prix_final, e.id]);
}

// Add-on « Faire une offre » : l'offre acceptée revient au panier si elle est encore valide (le stock, lui, est remis par libererCommande)
async function remettreNegociationAuPanier(client, cmd, negociationId) {
  const n = (await client.query(
    `SELECT * FROM negociations WHERE id = $1 AND statut = 'acceptee' AND acheteur_id = $2 AND expire_le > NOW()`, [negociationId, cmd.acheteur_id])).rows[0];
  if (!n) return;
  const deja = await client.query('SELECT 1 FROM marketplace_panier WHERE negociation_id = $1 AND acheteur_id = $2', [negociationId, cmd.acheteur_id]);
  if (deja.rows.length) return;
  await client.query(
    `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, variante, negociation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$9)`,
    [n.gestionnaire_id, n.acheteur_id, n.collaborateur_id, String(n.produit_id), n.titre, n.image_url, n.prix_final, n.variante, n.id]);
}

// Remet le stock d'une commande non payée. Idempotent : le drapeau stock_reserve n'est retiré qu'une fois.
async function libererCommande(commandeId, { raison, annuler = true, par = 'systeme' } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      `UPDATE marketplace_commandes SET stock_reserve = false WHERE id = $1 AND stock_reserve = true AND statut_paiement <> 'paye'
       RETURNING id, articles, stripe_session_id, gestionnaire_id, acheteur_id, collaborateur_id, reduction_id, reduction_comptee`, [commandeId]);
    if (!c.rows[0]) { await client.query('ROLLBACK'); return false; }
    let articles = c.rows[0].articles;
    if (typeof articles === 'string') { try { articles = JSON.parse(articles); } catch (e) { articles = []; } }
    for (const a of Array.isArray(articles) ? articles : []) {
      if (a.enchere_id) { await remettreEnchereAuPanier(client, c.rows[0], a.enchere_id); continue; }
      const pid = parseInt(a.produit_id, 10);
      const q = parseInt(a.quantite, 10);
      if (pid && q > 0) await ajusterStock(client, pid, a.variante || '', q);
      if (a.negociation_id) await remettreNegociationAuPanier(client, c.rows[0], a.negociation_id);
    }
    // Le code promo retrouve son utilisation (paiement jamais complété)
    if (c.rows[0].reduction_comptee && c.rows[0].reduction_id) {
      await promo.remettreUtilisation(client, c.rows[0].reduction_id);
      await client.query('UPDATE marketplace_commandes SET reduction_comptee = false WHERE id = $1', [commandeId]);
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
// Le collaborateur peut-il recevoir un paiement ? (Stripe du gestionnaire prêt + compte Stripe du collaborateur actif)
async function collaborateurPeutEncaisser(gid, collaborateurId) {
  try {
    const ctx = await contexteStripe(gid);
    if (!ctx) return false;
    const r = await pool.query(
      `SELECT 1 FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3 AND statut = 'active' AND charges_enabled = true`,
      [collaborateurId, gid, ctx.env]);
    return r.rows.length > 0;
  } catch (e) { return false; }
}

async function creerCommandePayable({ gid, acheteurId, collaborateurId, adresse, methodeId, note, pourboire, codePromo, outils }) {
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
  const rgCmd = regCmd.deMV(mv);

  const province = adresse && typeof adresse.province === 'string' ? adresse.province.toUpperCase().slice(0, 2) : 'QC';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const panier = (await client.query(
      `SELECT * FROM marketplace_panier WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 ORDER BY created_at ASC`,
      [acheteurId, gid, collaborateurId])).rows;
    if (!panier.length) refus('Votre panier est vide.', 404);

    // Vendeur en vacances avec annonces masquées : plus d'achat direct (le paiement d'une enchère déjà gagnée reste permis)
    const vacs = await vacances.etat(client, gid, collaborateurId);
    if (vacs && vacs.mode === 'masque' && panier.some((l) => !l.enchere_id)) refus(vacances.texteBlocage(vacs), 409);

    // Taxe : décidée ici seulement (collaborateur inscrit aux taxes ET catégorie taxable) — jamais par le navigateur
    const taxMap = await taxesMV.taxabilite(client, gid, panier.map((l) => l.produit_id));

    // 1) Prix et stock relus dans la base — le navigateur n'envoie que l'adresse et le mode d'expédition
    const reglesPrd = await reglesMV.lire(gid, client);   // Config produits (stock géré ou non, quantité minimum)
    const lignes = [];
    for (const ligne of panier) {
      // Article gagné aux enchères : prix = mise gagnante, quantité 1, stock déjà retiré à la création de l'enchère
      if (ligne.enchere_id) {
        const e = (await client.query(
          'SELECT * FROM encheres WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 FOR UPDATE', [ligne.enchere_id, gid, collaborateurId])).rows[0];
        if (!e || e.statut !== 'attente_paiement' || e.gagnant_id !== acheteurId) refus(`L'enchère « ${ligne.titre} » n'est plus disponible pour le paiement.`, 409);
        if (e.paiement_expire_le && new Date(e.paiement_expire_le) < new Date()) refus(`Le délai de paiement de « ${ligne.titre} » est dépassé.`, 409);
        lignes.push({ produit_id: e.produit_id, titre: e.titre, variante: '', quantite: 1, prix: Number(e.prix_final), image_url: e.image_url || null,
                      produit_numerique: false, enchere_id: e.id,
                      facturation_taxes: (await taxesMV.taxabilite(client, gid, [e.produit_id])).get(parseInt(e.produit_id, 10)) === true });
        continue;
      }
      // Prix négocié : prix = prix convenu, quantité 1, le stock se retire normalement (il n'était pas réservé)
      let negoLigne = null;
      if (ligne.negociation_id) {
        negoLigne = await NEGO.pourCaisse(client, gid, acheteurId, collaborateurId, ligne.negociation_id);
        if (!negoLigne) refus(`L'offre négociée de « ${ligne.titre} » n'est plus valide. Retirez l'article de votre panier.`, 409);
      }
      const pid = parseInt(ligne.produit_id, 10);
      const prod = pid ? (await client.query(
        `SELECT id, titre, prix, ${OFFRES.sqlPromo('produits')} AS prix_promo, stock, variantes, statut, quantite_min, date_parution, date_expiration, paliers FROM produits
          WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 FOR UPDATE`, [pid, gid, collaborateurId])).rows[0] : null;
      if (!prod || prod.statut !== 'actif') refus(`« ${ligne.titre} » n'est plus disponible. Retirez-le de votre panier.`, 409);
      if (prod.date_parution && new Date(prod.date_parution).getTime() > Date.now()) refus(`« ${ligne.titre} » sera disponible à la vente le ${new Date(prod.date_parution).toLocaleString('fr-CA', { timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short' })}. Retirez-le de votre panier.`, 409);
      if (prod.date_expiration && new Date(prod.date_expiration).getTime() <= Date.now()) refus(`« ${ligne.titre} » n'est plus disponible (annonce expirée). Retirez-le de votre panier.`, 409);
      const variante = ligne.variante || '';
      const choix = outils.prixEtStock(prod, variante, reglesPrd.gererStock);
      if (choix.erreur) refus(`« ${ligne.titre} » : ${choix.erreur}`, 409);
      const qte = negoLigne ? 1 : parseInt(ligne.quantite, 10);
      if (!(qte >= 1)) refus('Quantité invalide.', 400);
      let prixLigne = choix.prix;
      if (!negoLigne && prod.paliers && (await PALIERS.actifPourBoutique(gid))) prixLigne = PALIERS.prixPourQuantite(prod.paliers, variante, qte, choix.prix);
      if (qte > choix.stock) refus(choix.stock <= 0 ? `« ${ligne.titre} » est épuisé.` : `« ${ligne.titre} » : il n'en reste que ${choix.stock}.`, 409);
      if (!(await ajusterStock(client, pid, variante, -qte))) refus(`« ${ligne.titre} » est épuisé.`, 409);
      lignes.push({ produit_id: pid, titre: ligne.titre, variante, quantite: qte, quantite_min: negoLigne ? 1 : prod.quantite_min, prix: negoLigne ? Number(negoLigne.prix_final) : prixLigne, image_url: ligne.image_url || null,
                    produit_numerique: ligne.produit_numerique === true, facturation_taxes: taxMap.get(pid) === true, ...(negoLigne ? { negociation_id: negoLigne.id } : {}) });
    }

    // Quantité minimum d'achat : l'acheteur est averti dans le panier, et le paiement est refusé ici tant que le minimum n'est pas atteint
    const minimums = reglesMV.verifierQuantitesMin(reglesPrd, lignes);
    if (minimums.length) refus(minimums.map((m) => m.message).join(' '), 409);

    // 2) Code promo (rabais sur les articles seulement), expédition, taxes, total — tout calculé ici, en cents
    const sousTotalC = lignes.reduce((s, l) => s + cents(l.prix) * l.quantite, 0);
    let rabaisC = 0, reduction = null, alloc = lignes.map(() => 0);
    if (codePromo && String(codePromo).trim()) {
      let ev;
      try { ev = await promo.evaluer(client, { gid, collaborateurId, code: codePromo, lignes, verrou: true }); }
      catch (e) { if (e instanceof promo.ErreurPromo) refus(e.message, e.status); throw e; }
      try { await promo.reserverUtilisation(client, ev.reduction.id); }
      catch (e) { if (e instanceof promo.ErreurPromo) refus(e.message, e.status); throw e; }
      rabaisC = ev.rabaisC; reduction = ev.reduction;
      alloc = promo.repartir(lignes, rabaisC);
    }
    // Prix net de chaque ligne (après rabais) : base des taxes et des lignes Stripe
    const nets = lignes.map((l, i) => cents(l.prix) * l.quantite - alloc[i]);
    const sousNetC = sousTotalC - rabaisC;
    const exp = await outils.fraisExpedition(client, lignes, sousTotalC / 100, methodeId, { collaborateurId, province, sousTotalNet: sousNetC / 100 });
    if (exp.erreur) refus(exp.erreur, 400);
    const fraisC = cents(exp.frais);
    const lignesNettes = lignes.map((l, i) => ({ ...l, prix: nets[i] / 100, quantite: 1 }));
    const tx = outils.calculerTaxesProvince(sousNetC / 100, fraisC / 100, province, lignesNettes, 0, taxesMV.tableTaux(mv), rgCmd.taxesIncluses);
    // Pourboire (non taxé, hors commission, plafonné contre les abus). Qui le reçoit : Configuration marketplace → Commande
    //   vendeurs = 100 % au collaborateur · admin = 100 % au gestionnaire · split50 = moitié/moitié (le cent impair va au collaborateur)
    //   desactive = pourboire refusé. La part du gestionnaire passe par application_fee_amount (comme la commission).
    const tipDemande = rgCmd.pourboire === 'desactive' ? 0 : cents(Math.max(0, parseFloat(pourboire) || 0));
    const tipC = Math.min(tipDemande, sousTotalC, 100000);
    const tipPlatC = rgCmd.pourboire === 'admin' ? tipC : (rgCmd.pourboire === 'split50' ? Math.floor(tipC / 2) : 0);
    // Taxes incluses dans le prix : déjà comprises dans les montants ; on garde leur détail (extrait) mais on ne les ajoute pas au total
    const taxesC = cents(tx.tps) + cents(tx.tvq) + cents(tx.tvh) + cents(tx.tvp);
    const taxesAjouteesC = rgCmd.taxesIncluses ? 0 : taxesC;
    const totalC = sousNetC + fraisC + taxesAjouteesC + tipC;
    if (totalC < 50) refus('Le montant de la commande est trop bas pour un paiement en ligne.', 400);
    const total = totalC / 100;

    // 3) Commission du gestionnaire (en cents, jamais plus que le total) — calculée sur le prix après rabais
    // Taxes incluses : « Normal » = montant sans taxes (taxes des articles extraites), « Avec taxes » = prix complet des articles
    let baseSousC = sousNetC, baseTaxesC = taxesAjouteesC;
    if (rgCmd.taxesIncluses && taxesC > 0) {
      const taxableC = lignesNettes.reduce((s2, l) => s2 + (l.facturation_taxes !== false ? cents(l.prix) * l.quantite : 0), 0);
      const taxArtC = taxableC + fraisC > 0 ? Math.round(taxesC * taxableC / (taxableC + fraisC)) : 0;
      baseSousC = sousNetC - taxArtC; baseTaxesC = taxArtC;
    }
    const nbArticles = lignes.reduce((s2, l) => s2 + (parseInt(l.quantite, 10) || 0), 0);
    const commission = commissionDe(mv, { sousTotal: baseSousC / 100, taxes: baseTaxesC / 100, expedition: fraisC / 100, nbArticles, total: (totalC - tipC) / 100 });
    const commissionC = Math.min(cents(commission), totalC);
    // Taxes sur la commission : seulement si le gestionnaire l'a choisi (Config multi → Commission). Facturées au collaborateur
    // (prélevées avec la commission), jamais ajoutées au total de l'acheteur. Taux de la province du gestionnaire.
    let comTaxC = 0;
    if (mv.commission_taxable === true && commissionC > 0) {
      const tbl = taxesMV.tableTaux(mv);
      const tp = tbl[mv.commission_province] || tbl.QC;
      comTaxC = Math.round(commissionC * ((tp.tps || 0) + (tp.tvq || 0) + (tp.tvh || 0) + (tp.tvp || 0)) + 1e-7);
    }
    const fraisCommC = Math.min(commissionC + comTaxC + tipPlatC, totalC); // total prélevé par le gestionnaire (commission + taxes + sa part du pourboire)
    const comTaxStockeeC = Math.max(0, fraisCommC - commissionC - tipPlatC);

    const numero = `MV-${gid}-${Date.now()}`;
    const expireLe = new Date(Date.now() + DUREE_SESSION_MIN * 60000);
    const ins = await client.query(
      `INSERT INTO marketplace_commandes
         (gestionnaire_id, acheteur_id, collaborateur_id, numero_commande, statut, statut_paiement, total, commission, montant_net, commission_taxes,
          articles, adresse_livraison, note, frais_expedition, taxes, stock_reserve, expire_le, stripe_env,
          code_promo, reduction_id, rabais, reduction_comptee, pourboire_plateforme)
       VALUES ($1,$2,$3,$4,'en_attente','en_attente',$5,$6,$7,$19,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$20) RETURNING id`,
      [gid, acheteurId, collaborateurId, numero, total, commissionC / 100, (totalC - fraisCommC) / 100,
       JSON.stringify(lignes.map((l, i) => (alloc[i] ? { ...l, rabais: alloc[i] / 100 } : l))),
       JSON.stringify(adresse || {}), note ? String(note).slice(0, 500) : null, fraisC / 100,
       JSON.stringify({ tps: tx.tps, tvq: tx.tvq, tvh: tx.tvh, tvp: tx.tvp, label: tx.label_taxe, province, pourboire: tipC / 100, incluses: rgCmd.taxesIncluses, pourboire_mode: rgCmd.pourboire }), expireLe, ctx.env,
       reduction ? reduction.code : null, reduction ? reduction.id : null, rabaisC / 100, !!reduction, comTaxStockeeC / 100, tipPlatC / 100]);
    const commandeId = ins.rows[0].id;

    // 4) Session Stripe Checkout : une ligne par article + expédition + taxes (le total Stripe = notre total)
    const lineItems = [];
    lignes.forEach((l, i) => {
      if (!alloc[i]) {
        lineItems.push({ quantity: l.quantite, price_data: { currency: devise, unit_amount: cents(l.prix), product_data: { name: String(l.titre).slice(0, 120) } } });
      } else if (nets[i] > 0) {
        // Ligne rabaissée : un seul montant exact (Stripe n'accepte pas de montant négatif ni de cents fractionnaires)
        const nom = (String(l.titre).slice(0, 100) + (l.quantite > 1 ? ` × ${l.quantite}` : '')).slice(0, 120);
        lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: nets[i],
          product_data: { name: nom, description: `Code promo ${reduction.code} : -${(alloc[i] / 100).toFixed(2)} $` } } });
      }
    });
    if (fraisC > 0) lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: fraisC, product_data: { name: 'Expédition' } } });
    if (tipC > 0) lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: tipC, product_data: { name: 'Pourboire' } } });
    if (taxesAjouteesC > 0) lineItems.push({ quantity: 1, price_data: { currency: devise, unit_amount: taxesC, product_data: { name: `Taxes (${tx.label_taxe})` } } });

    const direct = String(ctx.p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
    const meta = { type: 'mv_commande', commande_id: String(commandeId), gestionnaire_id: String(gid), collaborateur_id: String(collaborateurId) };
    if (reduction) meta.code_promo = reduction.code;
    const paymentIntentData = { metadata: meta };
    if (fraisCommC > 0) paymentIntentData.application_fee_amount = fraisCommC;
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

  // « Permettre d'accepter les commandes » (défaut : oui) : la commande payée attend l'acceptation du collaborateur (reste « en_attente »).
  // Désactivé : elle est confirmée automatiquement dès le paiement.
  const apres = regCmd.statutApresPaiement(await regCmd.lire(gid, pool));
  const r = await pool.query(
    `UPDATE marketplace_commandes
        SET statut_paiement = 'paye', statut = CASE WHEN statut = 'en_attente' THEN '${apres === 'confirmee' ? 'confirmee' : 'en_attente'}' ELSE statut END,
            stripe_payment_intent = $1, paye_le = NOW(), expire_le = NULL, stock_reserve = false, updated_at = NOW()
      WHERE id = $2 AND gestionnaire_id = $3 AND stripe_session_id = $4 AND statut_paiement = 'en_attente' AND statut <> 'annulee'
        AND ROUND(total * 100) = $5
      RETURNING id, numero_commande`,
    [pi, commandeId, gid, session.id, session.amount_total]);
  if (r.rows[0]) {
    const lignes = (await pool.query('SELECT articles FROM marketplace_commandes WHERE id = $1', [commandeId])).rows[0];
    let arts = lignes && lignes.articles; if (typeof arts === 'string') { try { arts = JSON.parse(arts); } catch (e) { arts = []; } }
    for (const a of Array.isArray(arts) ? arts : []) {
      if (a.enchere_id) await pool.query(`UPDATE encheres SET statut = 'payee', commande_id = $1, updated_at = NOW() WHERE id = $2 AND statut = 'attente_paiement'`, [commandeId, a.enchere_id]);
      if (a.negociation_id) await pool.query(`UPDATE negociations SET statut = 'payee', commande_id = $1, updated_at = NOW() WHERE id = $2 AND statut = 'acceptee'`, [commandeId, a.negociation_id]);
    }
    capturerFraisStripe(gid, commandeId, { reessayerMs: 3000 }); // en arrière-plan : ne retarde jamais l'accusé de réception du webhook
    return { paye: true, commande: r.rows[0] };
  }

  const c = (await pool.query('SELECT statut, statut_paiement, total FROM marketplace_commandes WHERE id = $1 AND gestionnaire_id = $2', [commandeId, gid])).rows[0];
  if (c && c.statut_paiement === 'paye') return { deja: true };
  console.error(`[studio_paiement] ⚠️ paiement reçu mais commande ${commandeId} non confirmée (état: ${c ? c.statut + '/' + c.statut_paiement : 'introuvable'}, montant Stripe ${session.amount_total}). À vérifier/rembourser manuellement.`);
  return { anomalie: true };
}

// ── Vrais frais Stripe (comme e-Vend) ────────────────────────────────────────
// En Direct Charges, balance_transaction.fee du compte connecté = frais Stripe + application_fee de la plateforme :
// on exclut la ligne 'application_fee' de fee_details pour ne pas compter la commission deux fois.
function fraisStripeDepuisBalanceTx(bt, applicationFeeCents) {
  if (!bt || typeof bt !== 'object') return null;
  if (Array.isArray(bt.fee_details) && bt.fee_details.length > 0) {
    return bt.fee_details.filter((f) => f.type !== 'application_fee').reduce((t, f) => t + (f.amount || 0), 0) / 100;
  }
  return Math.max(0, (bt.fee || 0) - (applicationFeeCents || 0)) / 100;
}

// Lit chez Stripe les frais réels d'une commande payée et les enregistre (jamais d'écrasement). Non bloquant : renvoie null au moindre souci.
// Stripe crée parfois la balance_transaction avec un léger retard : `reessayerMs` permet une 2e tentative.
async function capturerFraisStripe(gid, commandeId, { reessayerMs = 0 } = {}) {
  try {
    const c = (await pool.query(
      `SELECT stripe_payment_intent, collaborateur_id, frais_stripe FROM marketplace_commandes
        WHERE id = $1 AND gestionnaire_id = $2 AND statut_paiement IN ('paye','rembourse')`, [commandeId, gid])).rows[0];
    if (!c || !c.stripe_payment_intent) return null;
    if (c.frais_stripe !== null) return parseFloat(c.frais_stripe);
    const ctx = await contexteStripe(gid);
    if (!ctx) return null;
    const direct = String(ctx.p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
    let opts;
    if (direct) {
      const cs = (await pool.query('SELECT stripe_account_id FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3', [c.collaborateur_id, gid, ctx.env])).rows[0];
      if (!cs) return null;
      opts = { stripeAccount: cs.stripe_account_id };
    }
    const lire = async () => {
      const pi = await ctx.stripe.paymentIntents.retrieve(c.stripe_payment_intent, { expand: ['latest_charge.balance_transaction'] }, opts);
      const ch = pi && pi.latest_charge;
      if (!ch || typeof ch !== 'object' || !ch.balance_transaction || typeof ch.balance_transaction !== 'object') return null;
      return fraisStripeDepuisBalanceTx(ch.balance_transaction, ch.application_fee_amount);
    };
    let frais = await lire();
    if (frais === null && reessayerMs > 0) { await new Promise((r) => setTimeout(r, reessayerMs)); frais = await lire(); }
    if (frais === null) return null;
    await pool.query('UPDATE marketplace_commandes SET frais_stripe = $1 WHERE id = $2 AND frais_stripe IS NULL', [frais, commandeId]);
    return frais;
  } catch (e) { console.error('[studio_paiement] capture frais Stripe :', e.message); return null; }
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

module.exports = { collaborateurPeutEncaisser, ErreurPaiement, commissionDe, ajusterStock, libererCommande, annulerNonPayee, contexteStripe, creerCommandePayable, confirmerPaiement, capturerFraisStripe, fraisStripeDepuisBalanceTx, sessionExpiree, balayerCommandesExpirees, demarrerBalayage };