// CHEMIN : services/boutique_commandes.js
// e-Vend Studio — Panier, commandes et paiement des templates boutique (solo).
// Chaque gestionnaire encaisse sur SON Stripe / SON PayPal (voir services/boutique_paiement.js). Aucun lien avec le MV.
//
// Règles :
//  • le navigateur n'envoie que l'adresse, le mode d'expédition et le mode de paiement : prix, stock, expédition,
//    taxes et total sont TOUJOURS recalculés ici, dans la base ;
//  • le stock est réservé à la création de la commande (verrou de ligne), remis si le paiement n'aboutit pas ;
//  • confirmer / libérer sont idempotents (webhooks reçus deux fois, balayage, annulation de l'acheteur).

'use strict';

const pool = require('../db');
const paiement = require('./boutique_paiement');
const TAXES = require('./boutique_taxes');
const EXP = require('./boutique_expedition');

const DUREE_SESSION_MIN = 35;      // Stripe exige au moins 30 min
const DELAI_GRACE_MIN = 5;         // on ne balaie qu'après l'expiration + ce délai (laisse arriver le webhook)

const { ErreurCommande } = require('./boutique_commandes_erreur');
const PROMOS = require('./boutique_promos');
const refus = (m, s, c) => { throw new ErreurCommande(m, s, c); };
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);

// ── Prix et stock d'une annonce (ou de la variante choisie) ──────────────────
// Variantes : [{ nom, prix (vide = prix du produit), stock (vide = stock du produit) }] ; stock vide = illimité.
function prixEtStock(p, nomVariante) {
  const base = Number(p.prix) || 0;
  const promo = p.prix_promo !== null && p.prix_promo !== undefined ? Number(p.prix_promo) : 0;
  const prixProduit = promo > 0 && promo < base ? promo : base;
  const stockProduit = p.stock === null || p.stock === undefined ? 999999 : Math.max(0, Number(p.stock) || 0);
  let vars = p.variantes;
  if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
  vars = Array.isArray(vars) ? vars.filter((v) => v && typeof v.nom === 'string' && v.nom.trim()) : [];
  if (!vars.length) return nomVariante ? { erreur: 'Variante inconnue.' } : { prix: prixProduit, stock: stockProduit };
  if (!nomVariante) return { erreur: 'Choisissez une variante.' };
  const v = vars.find((x) => x.nom.trim() === nomVariante);
  if (!v) return { erreur: 'Variante inconnue.' };
  const prixVar = v.prix === null || v.prix === undefined || v.prix === '' || !(Number(v.prix) >= 0) ? prixProduit : Number(v.prix);
  const stockVar = v.stock === null || v.stock === undefined || v.stock === '' ? stockProduit : Math.max(0, Math.trunc(Number(v.stock)) || 0);
  return { prix: prixVar, stock: stockVar };
}

// Vendable maintenant ? (retourne le texte du problème, ou null)
function problemeDisponibilite(p) {
  if (!p || p.statut !== 'actif') return "n'est plus disponible";
  if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) return "n'est pas encore en vente";
  if (p.date_expiration && new Date(p.date_expiration).getTime() <= Date.now()) return "n'est plus disponible (annonce expirée)";
  return null;
}

// delta < 0 : retire ; delta > 0 : remet. Retourne false si le stock est insuffisant. Stock vide = illimité.
async function ajusterStock(client, produitId, variante, delta) {
  const r = await client.query('SELECT stock, variantes FROM produits WHERE id = $1 AND collaborateur_id IS NULL FOR UPDATE', [produitId]);
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

// ── Panier (lecture) ─────────────────────────────────────────────────────────
// Toujours relu dans la base : le panier affiche le prix que le paiement facturera.
async function lireLignes(db, gid, acheteurId, { verrou = false } = {}) {
  if (verrou) {   // verrou des annonces du panier, toujours dans le même ordre (pas de blocage croisé)
    await db.query(`SELECT p.id FROM produits p WHERE p.collaborateur_id IS NULL AND p.id IN (SELECT produit_id FROM boutique_panier WHERE gestionnaire_id = $1 AND acheteur_id = $2) ORDER BY p.id FOR UPDATE`, [gid, acheteurId]);
  }
  const r = await db.query(
    `SELECT bp.id AS ligne_id, bp.produit_id, bp.variante, bp.quantite,
            p.id AS pid, p.titre, p.prix, p.prix_promo, p.stock, p.variantes, p.statut, p.photo_principale, p.poids,
            p.quantite_min, p.date_parution, p.date_expiration
       FROM boutique_panier bp
       LEFT JOIN produits p ON p.id = bp.produit_id AND p.gestionnaire_id = bp.gestionnaire_id AND p.collaborateur_id IS NULL
      WHERE bp.gestionnaire_id = $1 AND bp.acheteur_id = $2
      ORDER BY bp.created_at, bp.id`, [gid, acheteurId]);
  return r.rows.map((x) => {
    const ligne = { id: x.ligne_id, produit_id: x.produit_id, variante: x.variante || '', quantite: x.quantite,
      titre: x.titre || 'Article retiré', image_url: x.photo_principale || null, poids: Number(x.poids) || 0, quantite_min: x.quantite_min || null,
      prix: 0, stock: 0, total_ligne: 0, erreur: null, _p: x.pid ? x : null };
    const pb = problemeDisponibilite(x.pid ? x : null);
    if (pb) { ligne.erreur = `« ${ligne.titre} » ${pb}. Retirez-le de votre panier.`; return ligne; }
    const c = prixEtStock(x, ligne.variante);
    if (c.erreur) { ligne.erreur = `« ${ligne.titre} » : ${c.erreur}`; return ligne; }
    ligne.prix = c.prix; ligne.stock = c.stock; ligne.total_ligne = cents(c.prix) * x.quantite / 100;
    if (x.quantite > c.stock) ligne.erreur = c.stock <= 0 ? `« ${ligne.titre} » est épuisé.` : `« ${ligne.titre} » : il n'en reste que ${c.stock}.`;
    else if (x.quantite_min && x.quantite < x.quantite_min) ligne.erreur = `« ${ligne.titre} » : quantité minimum ${x.quantite_min}.`;
    return ligne;
  });
}
const publique = (l) => { const { _p, ...reste } = l; return reste; };

// ── Modes de paiement offerts ────────────────────────────────────────────────
function modesDisponibles(cfg) {
  if (!cfg) return { stripe: false, paypal: false, env: 'dev' };
  const env = paiement.envDe(cfg);
  const stripe = !!cfg.stripe_actif && !!paiement.lire(cfg[`stripe_${env}_secret_key`]);
  const paypal = !!cfg.paypal_actif && !!cfg[`paypal_${env}_client_id`] && !!paiement.lire(cfg[`paypal_${env}_secret`]);
  return { stripe, paypal, env };
}

function normaliserAdresse(a) {
  if (!a || typeof a !== 'object') refus("L'adresse de livraison est requise.");
  const t = (v, n) => String(v === undefined || v === null ? '' : v).trim().slice(0, n);
  const adr = { nom: t(a.nom, 120), adresse1: t(a.adresse1, 160), adresse2: t(a.adresse2, 160), ville: t(a.ville, 80),
    province: t(a.province, 2).toUpperCase(), code_postal: t(a.code_postal, 12).toUpperCase(), pays: t(a.pays || 'CA', 2).toUpperCase(), telephone: t(a.telephone, 30) };
  if (!adr.nom || !adr.adresse1 || !adr.ville || !adr.code_postal) refus("Adresse incomplète (nom, adresse, ville et code postal sont requis).");
  if (!EXP.PROVINCES.includes(adr.province)) refus('Province invalide.');
  return adr;
}

// ── Calcul complet (aperçu ET commande) ──────────────────────────────────────
// Retourne { sousTotalC, fraisC, taxes, totalC, methode } ou lève ErreurCommande.
async function calculerTotaux(db, gid, lignes, province, methodeId, rabaisC = 0) {
  const sousTotalC = lignes.reduce((s, l) => s + cents(l.prix) * l.quantite, 0);
  const alloc = PROMOS.repartir(lignes, rabaisC);                                   // rabais par ligne
  const nets = lignes.map((l, i) => cents(l.prix) * l.quantite - alloc[i]);          // montant net de chaque ligne
  const sousNetC = sousTotalC - rabaisC;
  const exp = await EXP.fraisPourPaiement(db, {
    gid, lignes: lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })),
    sousTotal: sousTotalC / 100, sousTotalNet: sousNetC / 100, province, methodeId });
  if (exp.erreur) refus(exp.erreur, 400);
  const fraisC = cents(exp.frais || 0);
  const taxes = await TAXES.calculer(db, { gid, lignes: lignes.map((l, i) => ({ produit_id: l.produit_id, montant: nets[i] / 100 })), fraisExpedition: fraisC / 100, province });
  const taxesC = cents(taxes.total_taxes);
  return { sousTotalC, rabaisC, alloc, nets, sousNetC, fraisC, taxes, taxesC, totalC: sousNetC + fraisC + taxesC };
}

async function apercu(gid, acheteurId, { province, methodeId, codePromo } = {}) {
  const lignes = await lireLignes(pool, gid, acheteurId);
  const prov = EXP.PROVINCES.includes(province) ? province : 'QC';
  const sousTotal = lignes.reduce((s, l) => s + (l.erreur ? 0 : cents(l.prix) * l.quantite), 0) / 100;
  const modes = modesDisponibles(await paiement.config(gid));
  const devise = await EXP.deviseDe(pool, gid);
  const exp = lignes.length ? await EXP.methodesPourPanier(pool, { gid, lignes: lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })), sousTotal, province: prov }) : { methodes: [], indisponible: false };
  const out = { lignes: lignes.map(publique), sous_total: sousTotal, devise, province: prov,
    methodes_expedition: exp.methodes, expedition_indisponible: !!exp.indisponible, modes_paiement: { stripe: modes.stripe, paypal: modes.paypal },
    problemes: lignes.filter((l) => l.erreur).map((l) => l.erreur) };
  // Totaux détaillés dès que le mode d'expédition est connu (ou unique)
  const choix = methodeId !== undefined && methodeId !== null && methodeId !== '' ? methodeId : (exp.methodes.length === 1 ? exp.methodes[0].id : null);
  if (lignes.length && !out.problemes.length && !exp.indisponible && choix !== null) {
    try {
      let rabaisC = 0;
      if (codePromo && String(codePromo).trim()) {
        try { const ev = await PROMOS.evaluer(pool, { gid, acheteurId, code: codePromo, sousTotalC: Math.round(sousTotal * 100) }); rabaisC = ev.rabaisC; out.code_promo = { code: ev.promo.code, rabais: rabaisC / 100 }; }
        catch (e) { if (!(e instanceof ErreurCommande)) throw e; out.code_erreur = e.message; }
      }
      const t = await calculerTotaux(pool, gid, lignes, prov, choix, rabaisC);
      out.totaux = { sous_total: t.sousTotalC / 100, rabais: t.rabaisC / 100, frais_expedition: t.fraisC / 100, taxes: t.taxes, total: t.totalC / 100 };
    } catch (e) { if (!(e instanceof ErreurCommande)) throw e; out.totaux_erreur = e.message; }
  }
  return out;
}

// ── Création de la commande + démarrage du paiement ─────────────────────────
async function urlDuSite(gid) {
  const s = (await pool.query('SELECT slug, domaine_custom FROM sites WHERE gestionnaire_id = $1', [gid])).rows[0] || {};
  const d = s.domaine_custom || (s.slug ? `${s.slug}.e-vendstudio.ca` : '');
  return d ? `https://${d}` : null;
}

async function creerCommande({ gid, acheteurId, adresse, methodeId, note, mode, codePromo }) {
  const cfg = await paiement.config(gid);
  const modes = modesDisponibles(cfg);
  if (mode !== 'stripe' && mode !== 'paypal') refus('Choisissez un mode de paiement.');
  if (!modes[mode]) refus("Ce mode de paiement n'est pas offert par cette boutique.", 409);
  const urlSite = await urlDuSite(gid);
  if (!urlSite) refus("Le site de cette boutique n'est pas publié.", 503);
  const adr = normaliserAdresse(adresse);
  const acheteur = (await pool.query('SELECT id, email FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0];
  if (!acheteur) refus('Compte acheteur introuvable.', 404);
  const devise = String(cfg.devise || 'CAD').toUpperCase();

  // Une seule commande non payée à la fois : les anciennes sont annulées (stock remis, articles remis au panier)
  const anciennes = await pool.query(`SELECT id FROM boutique_commandes WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND statut_paiement = 'en_attente' AND statut <> 'annulee'`, [gid, acheteurId]);
  for (const a of anciennes.rows) { try { await annulerNonPayee(a.id, { par: 'acheteur', raison: 'Nouvelle commande' }); } catch (e) { if (!(e instanceof ErreurCommande)) throw e; refus('Un paiement est en cours de traitement. Réessayez dans un instant.', 409); } }

  let cmd;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lignes = await lireLignes(client, gid, acheteurId, { verrou: true });
    if (!lignes.length) refus('Votre panier est vide.', 404);
    const bad = lignes.find((l) => l.erreur);
    if (bad) refus(bad.erreur, 409);
    for (const l of lignes) if (!(await ajusterStock(client, l.produit_id, l.variante, -l.quantite))) refus(`« ${l.titre} » est épuisé.`, 409);
    // Code promo : vérifié ICI, avec verrou, au moment de créer la commande (jamais cru sur parole)
    let promo = null, rabaisC = 0;
    if (codePromo && String(codePromo).trim()) {
      const ev = await PROMOS.evaluer(client, { gid, acheteurId, code: codePromo, sousTotalC: lignes.reduce((s2, l) => s2 + cents(l.prix) * l.quantite, 0), verrou: true });
      promo = ev.promo; rabaisC = ev.rabaisC;
    }
    const t = await calculerTotaux(pool, gid, lignes, adr.province, methodeId, rabaisC);   // lectures seules : pas besoin de la transaction
    if (t.totalC < 50) refus('Le montant de la commande est trop bas pour un paiement en ligne.', 400);

    // Méthode retenue (pour l'historique)
    let methode = null;
    if (methodeId !== undefined && methodeId !== null && methodeId !== '') {
      const m = await EXP.methodesPourPanier(pool, { gid, lignes: lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })), sousTotal: t.sousTotalC / 100, province: adr.province });
      const f = m.methodes.find((x) => String(x.id) === String(methodeId));
      if (f) methode = { id: f.id, nom: f.nom || f.transporteur_nom || null, delais: f.delais_estime || null, frais: t.fraisC / 100 };
    }
    const articles = lignes.map((l, i) => ({ produit_id: l.produit_id, titre: l.titre, variante: l.variante, quantite: l.quantite, prix: l.prix, image_url: l.image_url, ...(t.alloc[i] ? { rabais: t.alloc[i] / 100 } : {}) }));
    const numero = `BQ-${gid}-${Date.now()}`;
    const expireLe = new Date(Date.now() + DUREE_SESSION_MIN * 60000);
    const ins = await client.query(
      `INSERT INTO boutique_commandes (gestionnaire_id, acheteur_id, numero_commande, mode_paiement, devise, sous_total, frais_expedition, taxes, total,
         articles, methode_expedition, adresse_livraison, note, stock_reserve, expire_le, env, code_promo, code_promo_id, rabais)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14,$15,$16,$17,$18) RETURNING *`,
      [gid, acheteurId, numero, mode, devise, t.sousTotalC / 100, t.fraisC / 100, JSON.stringify({ ...t.taxes, province: adr.province }), t.totalC / 100,
       JSON.stringify(articles), methode ? JSON.stringify(methode) : null, JSON.stringify(adr), note ? String(note).slice(0, 500) : null, expireLe, modes.env, promo ? promo.code : null, promo ? promo.id : null, t.rabaisC / 100]);
    cmd = ins.rows[0];
    // Le panier reste en place jusqu'à ce que le paiement soit bien démarré (voir plus bas)
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }

  // Démarrage du paiement chez le fournisseur du gestionnaire (hors transaction : aucun verrou gardé pendant l'appel réseau)
  try {
    const lien = mode === 'stripe' ? await demarrerStripe(cmd, cfg, acheteur, urlSite) : await demarrerPaypal(cmd, cfg, urlSite);
    await pool.query('DELETE FROM boutique_panier WHERE gestionnaire_id = $1 AND acheteur_id = $2', [gid, acheteurId]);
    return { commande_id: cmd.id, numero_commande: cmd.numero_commande, mode, checkout_url: lien, total: Number(cmd.total), expire_le: cmd.expire_le };
  } catch (e) {
    await liberer(cmd.id, { raison: 'Paiement non démarré', restaurerPanier: false }).catch(() => {});
    console.error(`❌ [boutique-commandes] démarrage ${mode} :`, e.message);
    if (e instanceof ErreurCommande) throw e;
    throw new ErreurCommande("Le paiement n'a pas pu être démarré. Réessayez dans un instant.", 502);
  }
}

async function demarrerStripe(cmd, cfg, acheteur, urlSite) {
  const stripe = paiement.clientStripe(cfg, cmd.env);
  if (!stripe) refus("Le paiement par carte n'est pas disponible.", 409);
  const devise = cmd.devise.toLowerCase();
  const items = [];
  for (const l of (Array.isArray(cmd.articles) ? cmd.articles : [])) {
    const nom = (String(l.titre) + (l.variante ? ` — ${l.variante}` : '')).slice(0, 120);
    const rabaisL = cents(l.rabais || 0);
    if (!rabaisL) { items.push({ quantity: l.quantite, price_data: { currency: devise, unit_amount: cents(l.prix), product_data: { name: nom } } }); continue; }
    // Ligne rabaissée : un seul montant exact (Stripe n'accepte ni montant négatif ni cents fractionnaires)
    const net = cents(l.prix) * l.quantite - rabaisL;
    if (net > 0) items.push({ quantity: 1, price_data: { currency: devise, unit_amount: net, product_data: { name: (nom.slice(0, 100) + (l.quantite > 1 ? ` × ${l.quantite}` : '')).slice(0, 120), description: `Code promo ${cmd.code_promo} : -${(rabaisL / 100).toFixed(2)} $` } } });
  }
  if (cents(cmd.frais_expedition) > 0) items.push({ quantity: 1, price_data: { currency: devise, unit_amount: cents(cmd.frais_expedition), product_data: { name: 'Expédition' } } });
  const tx = cmd.taxes || {};
  if (cents(tx.total_taxes || 0) > 0) items.push({ quantity: 1, price_data: { currency: devise, unit_amount: cents(tx.total_taxes), product_data: { name: `Taxes (${tx.label || 'taxes'})` } } });
  const meta = { type: 'boutique_commande', commande_id: String(cmd.id), gestionnaire_id: String(cmd.gestionnaire_id) };
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', line_items: items, customer_email: acheteur.email, metadata: meta, payment_intent_data: { metadata: meta },
    expires_at: Math.floor(new Date(cmd.expire_le).getTime() / 1000),
    success_url: `${urlSite}/?page=dashboard-acheteur&vue=commande-confirmee&commande=${encodeURIComponent(cmd.numero_commande)}`,
    cancel_url: `${urlSite}/?page=dashboard-acheteur&vue=panier&paiement=annule&commande=${encodeURIComponent(cmd.numero_commande)}`,
  });
  await pool.query('UPDATE boutique_commandes SET stripe_session_id = $1 WHERE id = $2', [session.id, cmd.id]);
  return session.url;
}

async function demarrerPaypal(cmd, cfg, urlSite) {
  const r = await paiement.appelPaypal(cfg, cmd.env, 'POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ custom_id: String(cmd.id), invoice_id: cmd.numero_commande, description: `Commande ${cmd.numero_commande}`,
      amount: { currency_code: cmd.devise, value: Number(cmd.total).toFixed(2) } }],
    payment_source: { paypal: { experience_context: { user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING',
      return_url: `${urlSite}/?page=dashboard-acheteur&vue=commande-confirmee&commande=${encodeURIComponent(cmd.numero_commande)}&mode=paypal`,
      cancel_url: `${urlSite}/?page=dashboard-acheteur&vue=panier&paiement=annule&commande=${encodeURIComponent(cmd.numero_commande)}` } } },
  });
  const lien = r.data && Array.isArray(r.data.links) ? r.data.links.find((x) => x.rel === 'payer-action' || x.rel === 'approve') : null;
  if (r.status >= 300 || !r.data.id || !lien) throw new Error((r.data && r.data.message) || `PayPal a refusé la commande (${r.status})`);
  await pool.query('UPDATE boutique_commandes SET paypal_order_id = $1 WHERE id = $2', [r.data.id, cmd.id]);
  return lien.href;
}

// L'acheteur revient de PayPal : on capture le paiement (le webhook confirmera aussi — le premier arrivé gagne, l'autre voit « déjà payé »)
async function capturerPaypal(gid, acheteurId, numero, orderId) {
  const c = (await pool.query('SELECT * FROM boutique_commandes WHERE numero_commande = $1 AND gestionnaire_id = $2 AND acheteur_id = $3', [numero, gid, acheteurId])).rows[0];
  if (!c || c.mode_paiement !== 'paypal') refus('Commande introuvable.', 404);
  if (c.statut_paiement === 'paye') return { paye: true, deja: true, numero_commande: c.numero_commande };
  if (c.paypal_order_id !== orderId) refus('Paiement PayPal inconnu pour cette commande.', 400);
  if (c.statut === 'annulee' || !c.stock_reserve) refus('Cette commande a expiré ou a été annulée. Aucun montant n\'a été prélevé.', 409);
  const cfg = await paiement.config(gid);
  let r = await paiement.appelPaypal(cfg, c.env, 'POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
  if (r.status >= 300 || (r.data && r.data.status !== 'COMPLETED')) {
    const o = await paiement.appelPaypal(cfg, c.env, 'GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
    if (o.status < 300 && o.data && o.data.status === 'COMPLETED') r = o; else refus("Le paiement PayPal n'a pas été complété.", 402);
  }
  const cap = (((r.data.purchase_units || [])[0] || {}).payments || {}).captures;
  const capture = Array.isArray(cap) ? cap[0] : null;
  if (!capture || capture.status !== 'COMPLETED') refus("Le paiement PayPal n'a pas été complété.", 402);
  const res = await confirmer(gid, c.id, { mode: 'paypal', reference: capture.id, totalC: cents(capture.amount && capture.amount.value), devise: capture.amount && capture.amount.currency_code });
  return { paye: !!(res.paye || res.deja), numero_commande: c.numero_commande };
}

// ── Confirmation (webhooks Stripe / PayPal / capture) ────────────────────────
async function confirmer(gid, commandeId, { mode, reference, totalC, devise, sessionId }) {
  const col = mode === 'stripe' ? 'stripe_payment_intent' : 'paypal_capture_id';
  const r = await pool.query(
    `UPDATE boutique_commandes SET statut_paiement = 'paye', statut = 'confirmee', ${col} = $1, paye_le = NOW(), expire_le = NULL, stock_reserve = false, updated_at = NOW()
      WHERE id = $2 AND gestionnaire_id = $3 AND mode_paiement = $4 AND statut_paiement = 'en_attente' AND statut <> 'annulee'
        AND ROUND(total * 100) = $5 AND UPPER(devise) = UPPER($6) ${sessionId ? 'AND stripe_session_id = $7' : ''}
      RETURNING id, numero_commande`,
    sessionId ? [reference, commandeId, gid, mode, totalC, devise, sessionId] : [reference, commandeId, gid, mode, totalC, devise]);
  if (r.rows[0]) return { paye: true, commande: r.rows[0] };

  const c = (await pool.query('SELECT statut, statut_paiement, total, devise, mode_paiement FROM boutique_commandes WHERE id = $1 AND gestionnaire_id = $2', [commandeId, gid])).rows[0];
  if (!c) { console.error(`[boutique-commandes] ⚠️ paiement ${mode} pour une commande inconnue (${commandeId})`); return { anomalie: true }; }
  if (c.statut_paiement === 'paye') return { deja: true };
  // Argent reçu mais la commande ne peut plus être honorée automatiquement : on le signale au gestionnaire (remboursement à faire)
  let msg = null;
  if (c.statut === 'annulee') msg = `Paiement ${mode} reçu après l'annulation ou l'expiration de la commande (stock déjà remis en vente). Remboursez l'acheteur ou recréez la commande.`;
  else if (Math.round(Number(c.total) * 100) !== totalC || String(c.devise).toUpperCase() !== String(devise).toUpperCase()) msg = `Montant ${mode} reçu (${(totalC / 100).toFixed(2)} ${devise}) différent du total attendu (${Number(c.total).toFixed(2)} ${c.devise}). Vérifiez avant d'expédier.`;
  if (msg) {
    await pool.query(
      `UPDATE boutique_commandes SET anomalie = $2, statut_paiement = 'paye', ${col} = $3, paye_le = NOW(), updated_at = NOW() WHERE id = $1 AND statut_paiement IN ('en_attente','echoue')`,
      [commandeId, msg, reference]);
    console.error(`[boutique-commandes] ⚠️ commande ${commandeId} : ${msg}`);
  }
  return { anomalie: true };
}

async function confirmerStripe(gid, session) {
  const meta = (session && session.metadata) || {};
  if (meta.type !== 'boutique_commande' || String(meta.gestionnaire_id) !== String(gid)) return { ignore: true };
  if (session.payment_status !== 'paid') return { ignore: true };
  const id = parseInt(meta.commande_id, 10);
  if (!id) return { ignore: true };
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null;
  return confirmer(gid, id, { mode: 'stripe', reference: pi, totalC: session.amount_total, devise: String(session.currency || '').toUpperCase(), sessionId: session.id });
}

async function expireeStripe(gid, session) {
  const c = (await pool.query('SELECT id FROM boutique_commandes WHERE stripe_session_id = $1 AND gestionnaire_id = $2', [session && session.id, gid])).rows[0];
  if (!c) return { ignore: true };
  await liberer(c.id, { raison: 'Session de paiement expirée' });
  return { libere: true };
}

async function evenementPaypalCommande(gid, ev) {
  if (!ev || ev.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return { ignore: true };
  const cap = ev.resource || {};
  const id = parseInt(cap.custom_id, 10);
  if (!id || cap.status !== 'COMPLETED') return { ignore: true };
  return confirmer(gid, id, { mode: 'paypal', reference: cap.id, totalC: cents(cap.amount && cap.amount.value), devise: cap.amount && cap.amount.currency_code });
}

// ── Libération du stock d'une commande NON payée ─────────────────────────────
// Idempotent : le drapeau stock_reserve n'est retiré qu'une fois. Les articles retournent au panier de l'acheteur.
async function liberer(commandeId, { raison, annuler = true, par = 'systeme', restaurerPanier = true } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      `UPDATE boutique_commandes SET stock_reserve = false WHERE id = $1 AND stock_reserve = true AND statut_paiement <> 'paye'
       RETURNING id, articles, gestionnaire_id, acheteur_id`, [commandeId]);
    if (!c.rows[0]) { await client.query('ROLLBACK'); return false; }
    const cmd = c.rows[0];
    const arts = Array.isArray(cmd.articles) ? cmd.articles : [];
    for (const a of [...arts].sort((x, y) => x.produit_id - y.produit_id)) {
      const pid = parseInt(a.produit_id, 10), q = parseInt(a.quantite, 10);
      if (!(pid && q > 0)) continue;
      await ajusterStock(client, pid, a.variante || '', q);
      if (restaurerPanier) {
        await client.query(
          `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite)
           SELECT $1, $2, $3, $4, $5 WHERE EXISTS (SELECT 1 FROM produits WHERE id = $3 AND gestionnaire_id = $1)
           ON CONFLICT (acheteur_id, produit_id, variante) DO NOTHING`, [cmd.gestionnaire_id, cmd.acheteur_id, pid, a.variante || '', q]);
      }
    }
    if (annuler) {
      await client.query(
        `UPDATE boutique_commandes SET statut = 'annulee', statut_paiement = CASE WHEN statut_paiement = 'en_attente' THEN 'echoue' ELSE statut_paiement END,
                annule_par = COALESCE(annule_par, $2), raison_annulation = COALESCE(raison_annulation, $3), updated_at = NOW()
          WHERE id = $1 AND statut_paiement <> 'paye'`, [commandeId, par, raison || 'Paiement non complété']);
    }
    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}

// Annulation d'une commande non payée : la page Stripe est fermée (sinon l'acheteur pourrait encore payer), puis le stock est remis.
async function annulerNonPayee(commandeId, { par = 'acheteur', raison } = {}) {
  const c = (await pool.query('SELECT gestionnaire_id, stripe_session_id, env, statut_paiement, mode_paiement FROM boutique_commandes WHERE id = $1', [commandeId])).rows[0];
  if (!c) return false;
  if (c.statut_paiement === 'paye') refus('Commande déjà payée.', 409);
  if (c.mode_paiement === 'stripe' && c.stripe_session_id) {
    const stripe = paiement.clientStripe(await paiement.config(c.gestionnaire_id), c.env);
    if (stripe) {
      try { await stripe.checkout.sessions.expire(c.stripe_session_id); }
      catch (e) { if (/complete/i.test(e.message || '') && !/expired/i.test(e.message || '')) refus('Le paiement est en cours de traitement. Réessayez dans un instant.', 409); }
    }
  }
  const libere = await liberer(commandeId, { raison: raison || "Annulée par l'acheteur", par });
  // Filet : une commande non payée dont le stock était déjà remis doit quand même passer à « annulée »
  await pool.query(
    `UPDATE boutique_commandes SET statut = 'annulee', statut_paiement = 'echoue', annule_par = COALESCE(annule_par, $2), raison_annulation = COALESCE(raison_annulation, $3), updated_at = NOW()
      WHERE id = $1 AND statut_paiement = 'en_attente' AND statut <> 'annulee'`, [commandeId, par, raison || "Annulée par l'acheteur"]);
  return libere;
}

// ── Balayage : commandes jamais payées ───────────────────────────────────────
async function balayer() {
  const r = await pool.query(
    `SELECT id FROM boutique_commandes WHERE statut_paiement = 'en_attente' AND stock_reserve = true AND expire_le < NOW() - ($1 || ' minutes')::interval LIMIT 200`, [String(DELAI_GRACE_MIN)]);
  let n = 0;
  for (const c of r.rows) { try { if (await liberer(c.id, { raison: 'Délai de paiement dépassé' })) n++; } catch (e) { console.error('[boutique-commandes] balayage :', e.message); } }
  return n;
}

let minuteur = null;
function demarrerBalayage() {
  if (minuteur) return;
  minuteur = setInterval(() => { balayer().catch((e) => console.error('[boutique-commandes] balayage :', e.message)); }, 5 * 60 * 1000);
  if (minuteur.unref) minuteur.unref();
}

module.exports = {
  ErreurCommande, DUREE_SESSION_MIN, prixEtStock, problemeDisponibilite, ajusterStock, lireLignes, publique, modesDisponibles, normaliserAdresse,
  calculerTotaux, apercu, creerCommande, capturerPaypal, confirmer, confirmerStripe, expireeStripe, evenementPaypalCommande, liberer, annulerNonPayee, balayer, demarrerBalayage,
};