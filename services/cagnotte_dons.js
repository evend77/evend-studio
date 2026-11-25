// CHEMIN : services/cagnotte_dons.js
// e-Vend Studio — Cagnotte : création d'un don, paiement chez le fournisseur du GESTIONNAIRE (son Stripe / son PayPal),
// confirmation par webhook ou retour PayPal. Le navigateur n'envoie que le montant, le nom, le message et le mode de paiement :
// le gestionnaire, la campagne et le site sont toujours retrouvés ici, côté serveur.

'use strict';

const pool = require('../db');
const schema = require('./cagnotte_schema');
const paiement = require('./cagnotte_paiement');
const camp = require('./cagnotte_campagnes');

const { ErreurCagnotte } = camp;
const refus = (m, s) => { throw new ErreurCagnotte(m, s); };
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);
const DUREE_SESSION_MIN = 35;   // Stripe exige au moins 30 min

const txt = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : '');
const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Création d'un don + démarrage du paiement ────────────────────────────────
async function creerDon({ siteId, montant, nom, anonyme, message, mode }) {
  await schema.pret();
  const sid = parseInt(siteId, 10);
  if (!Number.isInteger(sid) || sid <= 0) refus('Site invalide.', 400);
  if (mode !== 'stripe' && mode !== 'paypal') refus('Choisissez un mode de paiement.', 400);
  const site = (await pool.query('SELECT id, gestionnaire_id, slug, domaine_custom, config FROM sites WHERE id = $1', [sid])).rows[0];
  if (!site) refus('Cagnotte introuvable.', 404);
  const gid = site.gestionnaire_id;
  const pub = await camp.etatPublic(sid);
  if (!pub || pub.statut !== 'publiee') refus(pub && pub.statut === 'terminee' ? 'Cette campagne est terminée. Merci de votre générosité !' : "Cette cagnotte n'est pas encore ouverte aux dons.", 409);
  const cfgPaiement = await paiement.config(gid);
  const modes = paiement.modesDisponibles(cfgPaiement);
  if (!modes[mode]) refus("Ce mode de paiement n'est pas offert pour cette cagnotte.", 409);

  const cfgSite = camp.configSite(site);
  const rg = await camp.reglages();
  const m = Number(montant);
  if (!Number.isFinite(m)) refus('Montant invalide.', 400);
  const minimum = Math.max(rg.don_min, Number(cfgSite.montantMinimum) || 0);
  if (m < minimum) refus(`Le don minimum est de ${minimum.toFixed(2)} $.`, 400);
  if (m > rg.don_max) refus(`Le don maximum est de ${rg.don_max.toFixed(0)} $. Pour un montant plus élevé, contactez l'organisateur.`, 400);
  const montantC = cents(m);

  const urlSite = await camp.urlDuSite(site);
  if (!urlSite) refus("Le site de cette cagnotte n'est pas publié.", 503);

  const estAnonyme = anonyme === true;
  const nomDon = estAnonyme ? 'Anonyme' : (txt(nom, 80) || 'Anonyme');
  const msg = txt(message, 500) || null;
  const devise = String(cfgPaiement.devise || rg.devise || 'CAD').toUpperCase();

  const ins = await pool.query(
    `INSERT INTO dons (site_id, gestionnaire_id, campagne_id, nom_donateur, anonyme, montant, message, statut, mode_paiement, devise, env)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'en_attente',$8,$9,$10) RETURNING id`,
    [sid, gid, pub.campagne_id, nomDon, estAnonyme, montantC / 100, msg, mode, devise, modes.env]);
  const donId = ins.rows[0].id;
  const titre = txt(cfgSite.nomCampagne, 100) || 'Cagnotte';
  try {
    if (mode === 'stripe') {
      const stripe = paiement.clientStripe(cfgPaiement, modes.env);
      const meta = { type: 'cagnotte_don', don_id: String(donId), gestionnaire_id: String(gid), site_id: String(sid) };
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', metadata: meta, payment_intent_data: { metadata: meta },
        line_items: [{ quantity: 1, price_data: { currency: devise.toLowerCase(), unit_amount: montantC, product_data: { name: `Don — ${titre}`.slice(0, 120) } } }],
        expires_at: Math.floor(Date.now() / 1000) + DUREE_SESSION_MIN * 60,
        success_url: `${urlSite}/?don=succes&don_id=${donId}`, cancel_url: `${urlSite}/?don=annule`,
      });
      await pool.query('UPDATE dons SET stripe_session_id = $1 WHERE id = $2', [session.id, donId]);
      return { don_id: donId, checkout_url: session.url };
    }
    const r = await paiement.appelPaypal(cfgPaiement, modes.env, 'POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{ custom_id: String(donId), invoice_id: `DON-${gid}-${donId}`, description: `Don — ${titre}`.slice(0, 120), amount: { currency_code: devise, value: (montantC / 100).toFixed(2) } }],
      payment_source: { paypal: { experience_context: { user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING',
        return_url: `${urlSite}/?don=retour&mode=paypal&don_id=${donId}`, cancel_url: `${urlSite}/?don=annule` } } },
    });
    const lien = r.data && Array.isArray(r.data.links) ? r.data.links.find((x) => x.rel === 'payer-action' || x.rel === 'approve') : null;
    if (r.status >= 300 || !r.data.id || !lien) throw new Error((r.data && r.data.message) || `PayPal a refusé la commande (${r.status})`);
    await pool.query('UPDATE dons SET paypal_order_id = $1 WHERE id = $2', [r.data.id, donId]);
    return { don_id: donId, checkout_url: lien.href };
  } catch (e) {
    await pool.query(`UPDATE dons SET statut = 'annule' WHERE id = $1 AND statut = 'en_attente'`, [donId]).catch(() => {});
    console.error(`❌ [cagnotte] démarrage ${mode} :`, e.message);
    if (e instanceof ErreurCagnotte) throw e;
    throw new ErreurCagnotte("Le paiement n'a pas pu être démarré. Réessayez dans un instant.", 502);
  }
}

// ── Confirmation (webhooks / capture PayPal) — idempotente ───────────────────
async function confirmerDon(gid, donId, { mode, reference, totalC, devise }) {
  const col = mode === 'stripe' ? 'stripe_payment_intent' : 'paypal_capture_id';
  const r = await pool.query(
    `UPDATE dons SET statut = 'complete', ${col} = $1, paye_le = NOW()
      WHERE id = $2 AND gestionnaire_id = $3 AND mode_paiement = $4 AND statut = 'en_attente'
        AND ROUND(montant * 100) = $5 AND UPPER(devise) = UPPER($6)
      RETURNING id`, [reference, donId, gid, mode, totalC, devise]);
  if (r.rows.length) { notifier(donId).catch((e) => console.error('[cagnotte] courriel don :', e.message)); return { paye: true }; }
  const d = (await pool.query('SELECT statut, montant, devise FROM dons WHERE id = $1 AND gestionnaire_id = $2', [donId, gid])).rows[0];
  if (!d) { console.error(`[cagnotte] ⚠️ paiement ${mode} pour un don inconnu (${donId})`); return { anomalie: true }; }
  if (d.statut === 'complete') return { deja: true };
  // Argent reçu mais le don n'était plus « en attente » ou le montant diffère : on le note pour le gestionnaire
  const msg = Math.round(Number(d.montant) * 100) !== totalC || String(d.devise).toUpperCase() !== String(devise).toUpperCase()
    ? `Montant ${mode} reçu (${(totalC / 100).toFixed(2)} ${devise}) différent du don attendu (${Number(d.montant).toFixed(2)} ${d.devise}).`
    : `Paiement ${mode} reçu pour un don déjà ${d.statut}.`;
  await pool.query(`UPDATE dons SET anomalie = $2, ${col} = $3 WHERE id = $1`, [donId, msg, reference]);
  return { anomalie: true };
}

async function annulerDon(gid, donId) {
  await pool.query(`UPDATE dons SET statut = 'annule' WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'en_attente'`, [donId, gid]);
}

// Retour de PayPal : on capture (le webhook peut aussi confirmer — le premier arrivé gagne)
async function capturerPaypal({ siteId, donId, orderId }) {
  await schema.pret();
  const d = (await pool.query('SELECT * FROM dons WHERE id = $1 AND site_id = $2', [parseInt(donId, 10), parseInt(siteId, 10)])).rows[0];
  if (!d || d.mode_paiement !== 'paypal') refus('Don introuvable.', 404);
  if (d.statut === 'complete') return { paye: true, deja: true };
  if (!orderId || d.paypal_order_id !== orderId) refus('Paiement PayPal inconnu pour ce don.', 400);
  if (d.statut === 'annule') refus("Ce don a expiré ou a été annulé. Aucun montant n'a été prélevé.", 409);
  const cfg = await paiement.config(d.gestionnaire_id);
  let r = await paiement.appelPaypal(cfg, d.env, 'POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
  if (r.status >= 300 || (r.data && r.data.status !== 'COMPLETED')) {
    const o = await paiement.appelPaypal(cfg, d.env, 'GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
    if (o.status < 300 && o.data && o.data.status === 'COMPLETED') r = o; else refus("Le paiement PayPal n'a pas été complété.", 402);
  }
  const cap = (((r.data.purchase_units || [])[0] || {}).payments || {}).captures;
  const capture = Array.isArray(cap) ? cap[0] : null;
  if (!capture || capture.status !== 'COMPLETED') refus("Le paiement PayPal n'a pas été complété.", 402);
  const res = await confirmerDon(d.gestionnaire_id, d.id, { mode: 'paypal', reference: capture.id, totalC: cents(capture.amount && capture.amount.value), devise: capture.amount && capture.amount.currency_code });
  return { paye: !!(res.paye || res.deja) };
}

// Événements PayPal reçus par le webhook du gestionnaire
async function evenementPaypal(gid, ev) {
  const type = ev.event_type, res = ev.resource || {};
  if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    const donId = parseInt(res.custom_id, 10);
    if (!Number.isInteger(donId)) return;
    await confirmerDon(gid, donId, { mode: 'paypal', reference: res.id, totalC: cents(res.amount && res.amount.value), devise: res.amount && res.amount.currency_code });
  } else if (type === 'CHECKOUT.ORDER.APPROVED') {   // le donateur a approuvé mais n'est pas revenu sur le site : on capture nous-mêmes
    const d = (await pool.query('SELECT id, site_id FROM dons WHERE paypal_order_id = $1 AND gestionnaire_id = $2', [res.id, gid])).rows[0];
    if (d) await capturerPaypal({ siteId: d.site_id, donId: d.id, orderId: res.id });
  } else if (type === 'PAYMENT.CAPTURE.DENIED') {
    const donId = parseInt(res.custom_id, 10);
    if (Number.isInteger(donId)) await annulerDon(gid, donId);
  }
}

// ── Courriel au gestionnaire (tout le texte du donateur est échappé) ─────────
async function notifier(donId) {
  const r = await pool.query(
    `SELECT d.montant, d.devise, d.nom_donateur, d.message, d.anonyme, g.email AS email_gestionnaire, s.config
       FROM dons d JOIN gestionnaires g ON g.id = d.gestionnaire_id JOIN sites s ON s.id = d.site_id WHERE d.id = $1`, [donId]);
  const d = r.rows[0];
  if (!d || !d.email_gestionnaire || !process.env.AWS_ACCESS_KEY_ID) return;
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-2', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
  const cfg = typeof d.config === 'string' ? JSON.parse(d.config) : (d.config || {});
  const cp = /^#[0-9a-fA-F]{6}$/.test(cfg.couleurPrincipale || '') ? cfg.couleurPrincipale : '#c9a96e';
  const montant = Number(d.montant).toFixed(2);
  await ses.send(new SendEmailCommand({
    Destination: { ToAddresses: [d.email_gestionnaire] },
    Message: {
      Subject: { Data: `🎉 Nouveau don reçu — ${montant} $`, Charset: 'UTF-8' },
      Body: { Html: { Charset: 'UTF-8', Data: `<div style="font-family:sans-serif;padding:24px"><h2 style="color:${cp}">🎉 Nouveau don reçu !</h2>
        <p><strong>Donateur :</strong> ${esc(d.anonyme ? 'Anonyme' : d.nom_donateur)}</p><p><strong>Montant :</strong> ${esc(montant)} ${esc(d.devise)}</p>
        ${d.message ? `<p><strong>Message :</strong> ${esc(d.message)}</p>` : ''}<p style="color:#888;font-size:12px">Cagnotte — e-Vend Studio</p></div>` } },
    },
    Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
  }));
}

module.exports = { creerDon, confirmerDon, annulerDon, capturerPaypal, evenementPaypal, esc };