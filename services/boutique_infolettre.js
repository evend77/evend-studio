// CHEMIN : services/boutique_infolettre.js
// e-Vend Studio — Add-on « Infolettre » (boutique solo). Le gestionnaire branche SON service de courriels : Studio n'envoie jamais de courriels de masse
// (la réputation de Studio n'est jamais engagée). Quand quelqu'un s'inscrit (pied de page ou case de la caisse), le courriel est :
//   1) gardé dans la boutique (table boutique_infolettre_abonnes, avec la preuve de consentement, export CSV) ;
//   2) transmis au service du gestionnaire : Mailchimp, Brevo, MailerLite, Amazon SES (liste de contacts) ou webhook. Un échec est noté et peut être renvoyé.
// Un désabonnement se fait chez le fournisseur (lien dans ses courriels) : la copie de la boutique est la liste des inscriptions reçues, pas un miroir.
// Clés chiffrées (AES-256-GCM), jamais renvoyées au navigateur. Tables : boutique_infolettre_config, boutique_infolettre_abonnes.

'use strict';

const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const CODE_ADDON = 'infolettre';
const FOURNISSEURS = ['aucun', 'mailchimp', 'brevo', 'mailerlite', 'ses', 'webhook'];
const DELAI_MS = 12000;
const MAX_EMAIL = 254;
// Même règle que l'infolettre de Studio : l'extension (.com, .ca…) doit faire au moins 2 lettres
const REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const DEFAUTS = {
  titre: 'Abonnez-vous à notre infolettre',
  texte: 'Recevez nos nouveautés, conseils et offres.',
  placeholder: 'Votre adresse courriel',
  texte_bouton: "S'abonner",
  texte_succes: 'Merci ! Votre inscription est confirmée.',
  consentement_texte: "J'accepte de recevoir les courriels de cette boutique. Je peux me désabonner en tout temps.",
  texte_caisse: "M'inscrire à l'infolettre de la boutique",
};

const refus = (m, s, extra) => { throw new ErreurBoutique(m, s || 400, extra); };
const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };
const masquer = (v, n) => { const c = lire(v); return c ? `${c.slice(0, n || 4)}••••${c.slice(-3)}` : null; };
const texte = (v) => (typeof v === 'string' ? v.trim() : '');
const nettoyer = (v, max) => texte(v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
const refusAddon = () => refus("L'option « Infolettre » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
async function exigerAddon(gid) { if (!(await autorise(gid))) refusAddon(); }

// ─── Limites en mémoire ───────────────────────────────────────────────────────
const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste);
  if (compteurs.size > 20000) for (const [k, v] of compteurs) if (!v.length || now - v[v.length - 1] > fenetreMs) compteurs.delete(k);
  return true;
}

// ─── Configuration ────────────────────────────────────────────────────────────
async function ligneConfig(gid) { return (await pool.query('SELECT * FROM boutique_infolettre_config WHERE gestionnaire_id = $1', [gid])).rows[0] || null; }

function configuree(c) {
  if (!c) return false;
  switch (c.fournisseur) {
    case 'aucun': return true;
    case 'mailchimp': case 'brevo': case 'mailerlite': return !!(lire(c.cle_chiffre) && c.liste_id);
    case 'ses': return !!(lire(c.cle_chiffre) && lire(c.secret_chiffre) && c.liste_id && c.region);
    case 'webhook': return !!c.webhook_url;
    default: return false;
  }
}

function vue(c) {
  const x = c || {};
  return {
    fournisseur: x.fournisseur || 'aucun',
    cle_masquee: masquer(x.cle_chiffre, x.fournisseur === 'ses' ? 4 : 5),
    secret_masque: masquer(x.secret_chiffre, 3),
    liste_id: x.liste_id || '',
    region: x.region || '',
    webhook_url: x.webhook_url || '',
    double_optin: !!x.double_optin,
    actif: x.actif !== false,
    titre: x.titre || '', texte: x.texte || '', placeholder: x.placeholder || '', texte_bouton: x.texte_bouton || '', texte_succes: x.texte_succes || '',
    consentement_texte: x.consentement_texte || '', consentement_obligatoire: x.consentement_obligatoire !== false,
    afficher_footer: x.afficher_footer !== false, afficher_caisse: x.afficher_caisse !== false, texte_caisse: x.texte_caisse || '',
    verifie_le: x.verifie_le || null,
    configuree: configuree(c),
    existe: !!c,
  };
}

async function etat(gid) {
  const addon = await autorise(gid);
  if (!addon) return { addon_actif: false, config: null, defauts: DEFAUTS, stats: null };
  const c = await ligneConfig(gid);
  const s = (await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE statut_envoi = 'ok')::int AS ok,
            COUNT(*) FILTER (WHERE statut_envoi = 'erreur')::int AS erreur,
            COUNT(*) FILTER (WHERE statut_envoi = 'local')::int AS local,
            COUNT(*) FILTER (WHERE statut_envoi = 'en_attente')::int AS en_attente
       FROM boutique_infolettre_abonnes WHERE gestionnaire_id = $1`, [gid])).rows[0];
  return { addon_actif: true, config: vue(c), defauts: DEFAUTS, stats: s };
}

const REG_CLE = {
  mailchimp: /^[a-f0-9]{32}-[a-z]{2}\d{1,2}$/i,
  brevo: /^[A-Za-z0-9_-]{20,300}$/,
  mailerlite: /^[A-Za-z0-9._-]{20,3000}$/,
  ses: /^[A-Z0-9]{16,128}$/,
};
const REG_LISTE = {
  mailchimp: /^[a-z0-9]{6,20}$/i,
  brevo: /^\d{1,12}$/,
  mailerlite: /^\d{1,24}$/,
  ses: /^[A-Za-z0-9_-]{1,64}$/,
};
const REG_REGION = /^[a-z]{2}(-[a-z]+)+-\d$/;

/** Enregistre (champ vide = inchangé ; clés chiffrées). Changer de fournisseur efface les réglages de l'ancien. */
async function enregistrer(gid, b) {
  await exigerAddon(gid);
  b = b || {};
  const ex = await ligneConfig(gid);
  let f = b.fournisseur !== undefined ? String(b.fournisseur) : (ex ? ex.fournisseur : 'aucun');
  if (!FOURNISSEURS.includes(f)) refus('Fournisseur invalide.');
  const change = !ex || f !== ex.fournisseur;
  const v = {
    cle_chiffre: change ? null : ex.cle_chiffre, secret_chiffre: change ? null : ex.secret_chiffre,
    liste_id: change ? null : ex.liste_id, region: change ? null : ex.region, webhook_url: change ? null : ex.webhook_url,
    double_optin: change ? false : ex.double_optin, verifie_le: change ? null : ex.verifie_le,
  };
  let touche = change;
  const cle = texte(b.cle), secret = texte(b.secret), liste = texte(b.liste_id), region = texte(b.region);
  if (cle) {
    if (f === 'aucun' || f === 'webhook') refus('Ce mode ne demande pas de clé.');
    if (!REG_CLE[f].test(cle)) refus(f === 'mailchimp' ? "Clé Mailchimp invalide : elle ressemble à « 0123abcd…-us21 » (copiez-la en entier)." : f === 'ses' ? "ID de clé d'accès AWS invalide : copiez-le en entier, sans espace." : 'Clé API invalide : copiez-la en entier, sans espace.');
    v.cle_chiffre = chiffrer(cle); touche = true;
  }
  if (secret) {
    if (f === 'ses') { if (!/^\S{20,120}$/.test(secret)) refus('Secret AWS invalide : copiez-le en entier, sans espace.'); }
    else if (f === 'webhook') { if (!/^\S{8,200}$/.test(secret)) refus('Secret de signature invalide (8 caractères minimum, sans espace).'); }
    else refus('Ce fournisseur ne demande pas de secret.');
    v.secret_chiffre = chiffrer(secret); touche = true;
  }
  if (b.liste_id !== undefined && liste) {
    if (!REG_LISTE[f]) refus('Ce mode ne demande pas de liste.');
    if (!REG_LISTE[f].test(liste)) refus(f === 'ses' ? 'Nom de liste de contacts invalide (lettres, chiffres, - et _ seulement).' : f === 'brevo' || f === 'mailerlite' ? "L'ID de liste ne contient que des chiffres." : "ID d'audience invalide (copiez l'« Audience ID »).");
    v.liste_id = liste; touche = true;
  }
  if (b.region !== undefined && region) {
    if (f !== 'ses') refus('Ce mode ne demande pas de région.');
    if (!REG_REGION.test(region)) refus('Région AWS invalide (exemple : ca-central-1).');
    v.region = region; touche = true;
  }
  if (b.webhook_url !== undefined) {
    const u = texte(b.webhook_url);
    if (u) {
      if (f !== 'webhook') refus('Ce mode ne demande pas de webhook.');
      let x; try { x = new URL(u); } catch (e) { refus("Adresse du webhook invalide."); }
      if (x.protocol !== 'https:' || x.username || x.password || u.length > 500) refus("L'adresse du webhook doit commencer par https:// et ne pas contenir d'identifiant.");
      v.webhook_url = x.toString(); touche = true;
    }
  }
  if (b.double_optin !== undefined) { const d = b.double_optin === true; if (d !== v.double_optin) { v.double_optin = d; touche = true; } if (d && f !== 'mailchimp') refus('La confirmation par courriel est offerte pour Mailchimp seulement : pour les autres services, activez-la dans leur compte.'); }
  if (touche) v.verifie_le = null;
  // Affichage
  const t = (k, max) => (b[k] !== undefined ? (nettoyer(b[k], max) || null) : (ex ? ex[k] : null));
  const bool = (k, defaut) => (b[k] !== undefined ? b[k] === true : (ex ? ex[k] : defaut));
  const vals = [
    gid, f, v.cle_chiffre, v.secret_chiffre, v.liste_id, v.region, v.webhook_url, v.double_optin, bool('actif', true),
    t('titre', 120), t('texte', 300), t('placeholder', 80), t('texte_bouton', 40), t('texte_succes', 200), t('consentement_texte', 400),
    bool('consentement_obligatoire', true), bool('afficher_footer', true), bool('afficher_caisse', true), t('texte_caisse', 200), v.verifie_le,
  ];
  await pool.query(
    `INSERT INTO boutique_infolettre_config (gestionnaire_id, fournisseur, cle_chiffre, secret_chiffre, liste_id, region, webhook_url, double_optin, actif,
        titre, texte, placeholder, texte_bouton, texte_succes, consentement_texte, consentement_obligatoire, afficher_footer, afficher_caisse, texte_caisse, verifie_le, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET fournisseur=EXCLUDED.fournisseur, cle_chiffre=EXCLUDED.cle_chiffre, secret_chiffre=EXCLUDED.secret_chiffre, liste_id=EXCLUDED.liste_id,
        region=EXCLUDED.region, webhook_url=EXCLUDED.webhook_url, double_optin=EXCLUDED.double_optin, actif=EXCLUDED.actif, titre=EXCLUDED.titre, texte=EXCLUDED.texte,
        placeholder=EXCLUDED.placeholder, texte_bouton=EXCLUDED.texte_bouton, texte_succes=EXCLUDED.texte_succes, consentement_texte=EXCLUDED.consentement_texte,
        consentement_obligatoire=EXCLUDED.consentement_obligatoire, afficher_footer=EXCLUDED.afficher_footer, afficher_caisse=EXCLUDED.afficher_caisse,
        texte_caisse=EXCLUDED.texte_caisse, verifie_le=EXCLUDED.verifie_le, updated_at=NOW()`, vals);
}

async function effacerCles(gid) {
  await exigerAddon(gid);
  await pool.query(`UPDATE boutique_infolettre_config SET cle_chiffre = NULL, secret_chiffre = NULL, verifie_le = NULL, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid]);
}

/** Réglages publics (vitrine et caisse). null si l'add-on est inactif, en pause, pas encore configuré ou incomplet. */
async function configPublique(gid) {
  if (!(await autorise(gid))) return null;
  const c = await ligneConfig(gid);
  if (!c || c.actif === false || !configuree(c)) return null;
  if (c.afficher_footer === false && c.afficher_caisse === false) return null;
  const d = (k) => c[k] || DEFAUTS[k];
  return {
    afficher_footer: c.afficher_footer !== false, afficher_caisse: c.afficher_caisse !== false,
    titre: d('titre'), texte: d('texte'), placeholder: d('placeholder'), texte_bouton: d('texte_bouton'), texte_succes: c.double_optin ? "Merci ! Vérifiez votre boîte courriel pour confirmer votre inscription." : d('texte_succes'),
    consentement_texte: d('consentement_texte'), consentement_obligatoire: c.consentement_obligatoire !== false, texte_caisse: d('texte_caisse'),
  };
}

// ─── Appels aux fournisseurs ──────────────────────────────────────────────────
class ErreurFournisseur extends Error { constructor(m, ignorer) { super(m); this.ignorer = !!ignorer; } }

async function appel(url, options) {
  const ctrl = new AbortController();
  const delai = setTimeout(() => ctrl.abort(), DELAI_MS);
  try { return await fetch(url, { redirect: 'manual', ...options, signal: ctrl.signal }); }
  catch (e) { throw new ErreurFournisseur("Impossible de joindre le service de courriels pour l'instant."); }
  finally { clearTimeout(delai); }
}
const corpsJson = async (r) => { try { return await r.json(); } catch (e) { return {}; } };
const court = (s) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 250);

// SigV4 (Amazon SES v2). Pas de dépendance : seulement crypto.
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d, 'utf8').digest();
const sha = (d) => crypto.createHash('sha256').update(d, 'utf8').digest('hex');
function signerAws({ methode, hote, chemin, corps, region, cleId, secret, date }) {
  const d = date || new Date();
  const amz = d.toISOString().replace(/[:-]|\.\d{3}/g, '');   // 20260101T000000Z
  const jour = amz.slice(0, 8);
  const entetes = { host: hote, 'x-amz-date': amz, ...(corps ? { 'content-type': 'application/json' } : {}) };
  const noms = Object.keys(entetes).sort();
  const canon = [methode, chemin, '', ...noms.map((n) => `${n}:${entetes[n]}`), '', noms.join(';'), sha(corps || '')].join('\n');
  const portee = `${jour}/${region}/ses/aws4_request`;
  const aSigner = ['AWS4-HMAC-SHA256', amz, portee, sha(canon)].join('\n');
  const cle = hmac(hmac(hmac(hmac(`AWS4${secret}`, jour), region), 'ses'), 'aws4_request');
  const signature = crypto.createHmac('sha256', cle).update(aSigner, 'utf8').digest('hex');
  return { ...entetes, Authorization: `AWS4-HMAC-SHA256 Credential=${cleId}/${portee}, SignedHeaders=${noms.join(';')}, Signature=${signature}` };
}

async function appelSes(c, methode, corps) {
  const cleId = lire(c.cle_chiffre), secret = lire(c.secret_chiffre);
  const hote = `email.${c.region}.amazonaws.com`;
  const chemin = `/v2/email/contact-lists/${encodeURIComponent(c.liste_id)}${methode === 'POST' ? '/contacts' : ''}`;
  const body = corps ? JSON.stringify(corps) : '';
  const h = signerAws({ methode, hote, chemin, corps: body, region: c.region, cleId, secret });
  delete h.host;
  return appel(`https://${hote}${chemin}`, { method: methode, headers: h, body: body || undefined });
}

function mdcServeur(cle) { const m = /-([a-z]{2}\d{1,2})$/i.exec(cle); return m ? m[1].toLowerCase() : null; }

// IP publique seulement (le webhook ne doit jamais viser le réseau interne)
function ipPublique(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return !(a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224);
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === '::1' || x === '::' || x.startsWith('fe80') || x.startsWith('fc') || x.startsWith('fd')) return false;
    const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x); return m ? ipPublique(m[1]) : true;
  }
  return false;
}
async function hotePublic(u) {
  const h = new URL(u).hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(h)) return ipPublique(h);
  try { const r = await dns.lookup(h, { all: true }); return r.length > 0 && r.every((x) => ipPublique(x.address)); }
  catch (e) { return false; }
}

/** Envoie UNE inscription au service du gestionnaire. Lance ErreurFournisseur si ça échoue ; { ignore:true } si le service refuse volontairement (ex. déjà désabonné). */
async function pousser(c, ab) {
  const f = c.fournisseur;
  if (f === 'aucun') return { local: true };
  if (f === 'mailchimp') {
    const cle = lire(c.cle_chiffre), dc = mdcServeur(cle || '');
    if (!cle || !dc) throw new ErreurFournisseur('Clé Mailchimp invalide.');
    const hash = crypto.createHash('md5').update(ab.email).digest('hex');
    const r = await appel(`https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(c.liste_id)}/members/${hash}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: ab.email, status_if_new: c.double_optin ? 'pending' : 'subscribed' }),   // jamais « status » : une personne déjà désabonnée n'est pas réabonnée de force
    });
    if (r.ok) return { ok: true };
    const j = await corpsJson(r);
    if (r.status === 401 || r.status === 403) throw new ErreurFournisseur('Mailchimp a refusé la clé API.');
    if (r.status === 404) throw new ErreurFournisseur("Mailchimp : audience introuvable (vérifiez l'Audience ID).");
    if (r.status === 400 && /compliance|forgotten/i.test(`${j.title} ${j.detail}`)) return { ignore: true, message: court(j.detail || j.title) };
    throw new ErreurFournisseur(`Mailchimp : ${court(j.detail || j.title || r.status)}`);
  }
  if (f === 'brevo') {
    const cle = lire(c.cle_chiffre);
    const r = await appel('https://api.brevo.com/v3/contacts', {
      method: 'POST', headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: ab.email, listIds: [parseInt(c.liste_id, 10)], updateEnabled: true }),
    });
    if (r.ok) return { ok: true };
    const j = await corpsJson(r);
    if (r.status === 401 || r.status === 403) throw new ErreurFournisseur('Brevo a refusé la clé API.');
    throw new ErreurFournisseur(`Brevo : ${court(j.message || r.status)}`);
  }
  if (f === 'mailerlite') {
    const cle = lire(c.cle_chiffre);
    const r = await appel('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST', headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: ab.email, groups: [c.liste_id], opted_in_at: new Date(ab.consentement_le).toISOString().replace('T', ' ').slice(0, 19) }),
    });
    if (r.ok) return { ok: true };
    const j = await corpsJson(r);
    if (r.status === 401) throw new ErreurFournisseur('MailerLite a refusé la clé API.');
    if (r.status === 422) {
      // Désabonné, rebond ou indésirable chez MailerLite : on ne le réabonne pas de force ; sinon l'adresse est invalide pour eux
      const msg = court((j.errors && Object.values(j.errors).flat()[0]) || j.message || '');
      return { ignore: true, message: `MailerLite n'a pas ajouté cette adresse : ${msg}` };
    }
    throw new ErreurFournisseur(`MailerLite : ${court(j.message || r.status)}`);
  }
  if (f === 'ses') {
    const r = await appelSes(c, 'POST', { EmailAddress: ab.email });
    if (r.ok) return { ok: true };
    const j = await corpsJson(r);
    const type = String(j.__type || j.code || r.headers.get('x-amzn-errortype') || '');
    if (r.status === 400 && /AlreadyExists/i.test(type)) return { ok: true };
    if (r.status === 403) throw new ErreurFournisseur("Amazon SES a refusé la clé : vérifiez la clé, le secret et les autorisations (créer un contact et lire la liste).");
    if (r.status === 404) throw new ErreurFournisseur('Amazon SES : liste de contacts introuvable (vérifiez le nom et la région).');
    throw new ErreurFournisseur(`Amazon SES : ${court(j.message || j.Message || type || r.status)}`);
  }
  if (f === 'webhook') {
    if (!(await hotePublic(c.webhook_url))) throw new ErreurFournisseur("L'adresse du webhook n'est pas joignable publiquement.");
    const corps = JSON.stringify({ evenement: 'infolettre.inscription', boutique_id: c.gestionnaire_id, courriel: ab.email, source: ab.source, consentement_le: new Date(ab.consentement_le).toISOString(), consentement_texte: ab.consentement_texte || null });
    const h = { 'Content-Type': 'application/json', 'User-Agent': 'e-Vend-Studio-Infolettre/1.0' };
    const secret = lire(c.secret_chiffre);
    if (secret) h['X-Studio-Signature'] = `sha256=${crypto.createHmac('sha256', secret).update(corps).digest('hex')}`;
    const r = await appel(c.webhook_url, { method: 'POST', headers: h, body: corps });
    if (r.ok) return { ok: true };
    throw new ErreurFournisseur(`Le webhook a répondu ${r.status}.`);
  }
  throw new ErreurFournisseur('Fournisseur inconnu.');
}

/** Test de connexion (clé + liste) sans rien ajouter. */
async function tester(gid) {
  await exigerAddon(gid);
  if (!limite(`bq-info-test-${gid}`, 6, 60 * 1000)) refus("Trop d'essais. Réessayez dans une minute.", 429);
  const c = await ligneConfig(gid);
  if (!c || !configuree(c)) refus("Enregistrez d'abord les réglages de votre service.");
  const f = c.fournisseur;
  let message;
  if (f === 'aucun') refus('Aucun service branché : il n\'y a rien à tester. Les inscriptions restent dans votre boutique (export CSV).');
  if (f === 'mailchimp') {
    const cle = lire(c.cle_chiffre), dc = mdcServeur(cle || '');
    const r = await appel(`https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(c.liste_id)}`, { headers: { Authorization: `Bearer ${cle}` } });
    if (r.status === 401 || r.status === 403) refus('Mailchimp a refusé la clé API.');
    if (r.status === 404) refus("Mailchimp : audience introuvable (vérifiez l'Audience ID).");
    if (!r.ok) refus(`Mailchimp a répondu ${r.status}.`);
    const j = await corpsJson(r); message = `Connexion réussie : audience « ${court(j.name)} ».`;
  } else if (f === 'brevo') {
    const r = await appel(`https://api.brevo.com/v3/contacts/lists/${encodeURIComponent(c.liste_id)}`, { headers: { 'api-key': lire(c.cle_chiffre), Accept: 'application/json' } });
    if (r.status === 401 || r.status === 403) refus('Brevo a refusé la clé API.');
    if (r.status === 404) refus('Brevo : liste introuvable (vérifiez son ID).');
    if (!r.ok) refus(`Brevo a répondu ${r.status}.`);
    const j = await corpsJson(r); message = `Connexion réussie : liste « ${court(j.name)} ».`;
  } else if (f === 'mailerlite') {
    const r = await appel('https://connect.mailerlite.com/api/groups?limit=100', { headers: { Authorization: `Bearer ${lire(c.cle_chiffre)}`, Accept: 'application/json' } });
    if (r.status === 401) refus('MailerLite a refusé la clé API.');
    if (!r.ok) refus(`MailerLite a répondu ${r.status}.`);
    const j = await corpsJson(r); const gs = Array.isArray(j.data) ? j.data : [];
    const g = gs.find((x) => String(x.id) === String(c.liste_id));
    if (g) message = `Connexion réussie : groupe « ${court(g.name)} ».`;
    else if (gs.length < 100) refus("MailerLite : groupe introuvable (vérifiez l'ID du groupe).");
    else message = "Clé acceptée. Le groupe n'est pas parmi les 100 premiers : il sera vérifié à la première inscription.";
  } else if (f === 'ses') {
    const r = await appelSes(c, 'GET');
    if (r.status === 403) refus("Amazon SES a refusé la clé : vérifiez la clé, le secret et les autorisations.");
    if (r.status === 404) refus('Amazon SES : liste de contacts introuvable (vérifiez le nom et la région).');
    if (!r.ok) refus(`Amazon SES a répondu ${r.status}.`);
    message = `Connexion réussie : liste de contacts « ${c.liste_id} » (${c.region}).`;
  } else if (f === 'webhook') {
    if (!(await hotePublic(c.webhook_url))) refus("L'adresse du webhook n'est pas joignable publiquement.");
    const r = await appel(c.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'e-Vend-Studio-Infolettre/1.0' }, body: JSON.stringify({ evenement: 'infolettre.test', boutique_id: gid }) });
    if (!r.ok) refus(`Le webhook a répondu ${r.status}.`);
    message = 'Le webhook a répondu correctement (un événement « infolettre.test » lui a été envoyé).';
  }
  await pool.query('UPDATE boutique_infolettre_config SET verifie_le = NOW() WHERE gestionnaire_id = $1', [gid]);
  return { ok: true, message };
}

// ─── Inscriptions ─────────────────────────────────────────────────────────────
function formatEmailValide(e) { return typeof e === 'string' && e.length > 0 && e.length <= MAX_EMAIL && REGEX_EMAIL.test(e.trim()); }

// Le domaine doit exister (MX ou, à défaut, A). Une erreur DNS passagère ne bloque jamais une vraie personne.
async function domaineRecoitCourriel(email) {
  const dom = email.split('@')[1];
  try { const mx = await module.exports._dns.resolveMx(dom); if (mx && mx.length) return true; }
  catch (e) { if (e.code !== 'ENOTFOUND' && e.code !== 'ENODATA') return true; }
  try { await module.exports._dns.resolve4(dom); return true; }
  catch (e) { return !(e.code === 'ENOTFOUND' || e.code === 'ENODATA'); }
}

async function envoyer(c, ab) {
  let statut = 'ok', erreur = null;
  try {
    const r = await pousser(c, ab);
    if (r.local) statut = 'local';
    else if (r.ignore) { statut = 'ok'; erreur = r.message || null; }
  } catch (e) {
    if (!(e instanceof ErreurFournisseur)) console.error('[boutique_infolettre] envoi', e && e.message);
    statut = 'erreur'; erreur = e instanceof ErreurFournisseur ? e.message : "Erreur inattendue pendant l'envoi.";
  }
  await pool.query(`UPDATE boutique_infolettre_abonnes SET statut_envoi = $2::text, erreur_envoi = $3, envoye_le = CASE WHEN $2::text IN ('ok','local') THEN NOW() ELSE envoye_le END WHERE id = $1`, [ab.id, statut, erreur]);
  return statut;
}

/**
 * Inscription depuis le pied de page. Réponses : { ok:true, deja_inscrit? }. Anti-robot : piège invisible, délai minimum, limites par IP et par boutique.
 * Le courriel est gardé tout de suite ; l'envoi au service du gestionnaire se fait en arrière-plan (le visiteur n'attend pas).
 */
async function inscrire(gid, { email, consentement, source, piege, delaiMs, ip, texteConsentement }) {
  const c = await ligneConfig(gid);
  if (!(await autorise(gid)) || !c || c.actif === false || !configuree(c)) refus("L'infolettre n'est pas disponible.", 404);
  if (!limite(`bq-info-ip-${gid}-${ip || '?'}`, 5, 60 * 60 * 1000) || !limite(`bq-info-boutique-${gid}`, 300, 60 * 60 * 1000)) refus('Trop de demandes, réessayez plus tard.', 429);
  // Piège invisible rempli ou formulaire envoyé trop vite : on répond « ok » sans rien enregistrer
  if (texte(piege) || (Number.isFinite(delaiMs) && delaiMs < 1500)) return { ok: true };
  if (!formatEmailValide(email)) refus('Adresse courriel invalide.');
  if (c.consentement_obligatoire !== false && consentement !== true) refus('Veuillez cocher la case de consentement.');
  const mail = email.trim().toLowerCase();
  if (!(await domaineRecoitCourriel(mail))) refus("Ce domaine de courriel n'existe pas.");
  const src = source === 'caisse' ? 'caisse' : 'footer';
  const consTexte = nettoyer(texteConsentement || c.consentement_texte || DEFAUTS.consentement_texte, 400);
  const ins = await pool.query(
    `INSERT INTO boutique_infolettre_abonnes (gestionnaire_id, email, source, consentement_texte) VALUES ($1,$2,$3,$4) ON CONFLICT (gestionnaire_id, email) DO NOTHING RETURNING *`,
    [gid, mail, src, consTexte]);
  if (!ins.rows[0]) return { ok: true, deja_inscrit: true };
  envoyer(c, ins.rows[0]).catch((e) => console.error('[boutique_infolettre] envoi', e && e.message));
  return { ok: true };
}

/** Case « M'inscrire » de la caisse : l'adresse du compte acheteur (jamais un courriel venant du navigateur). N'échoue jamais la commande. */
async function inscrireDepuisCaisse(gid, acheteurId) {
  try {
    const c = await ligneConfig(gid);
    if (!(await autorise(gid)) || !c || c.actif === false || c.afficher_caisse === false || !configuree(c)) return false;
    const a = (await pool.query('SELECT email FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0];
    if (!a || !formatEmailValide(a.email)) return false;
    const mail = a.email.trim().toLowerCase();
    const ins = await pool.query(
      `INSERT INTO boutique_infolettre_abonnes (gestionnaire_id, email, source, consentement_texte) VALUES ($1,$2,'caisse',$3) ON CONFLICT (gestionnaire_id, email) DO NOTHING RETURNING *`,
      [gid, mail, nettoyer(c.texte_caisse || DEFAUTS.texte_caisse, 400)]);
    if (ins.rows[0]) envoyer(c, ins.rows[0]).catch((e) => console.error('[boutique_infolettre] envoi', e && e.message));
    return true;
  } catch (e) { console.error('[boutique_infolettre] caisse', e && e.message); return false; }
}

// ─── Liste des abonnés (gestionnaire) ─────────────────────────────────────────
async function lister(gid, { q, statut, page }) {
  await exigerAddon(gid);
  const par = 50; const p = Math.max(parseInt(page, 10) || 1, 1);
  const w = ['gestionnaire_id = $1']; const v = [gid];
  if (q) { v.push(`%${String(q).toLowerCase().replace(/[%_\\]/g, '\\$&').slice(0, 100)}%`); w.push(`email LIKE $${v.length}`); }
  if (['ok', 'erreur', 'local', 'en_attente'].includes(statut)) { v.push(statut); w.push(`statut_envoi = $${v.length}`); }
  const total = +(await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_infolettre_abonnes WHERE ${w.join(' AND ')}`, v)).rows[0].n;
  v.push(par, (p - 1) * par);
  const rows = (await pool.query(
    `SELECT id, email, source, consentement_le, statut_envoi, erreur_envoi, created_at FROM boutique_infolettre_abonnes WHERE ${w.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT $${v.length - 1} OFFSET $${v.length}`, v)).rows;
  return { abonnes: rows, total, page: p, pages: Math.max(Math.ceil(total / par), 1) };
}

async function supprimer(gid, id) {
  await exigerAddon(gid);
  const r = await pool.query('DELETE FROM boutique_infolettre_abonnes WHERE gestionnaire_id = $1 AND id = $2', [gid, id]);
  if (!r.rowCount) refus('Abonné introuvable.', 404);
  return { ok: true };
}

/** Renvoie au service les inscriptions en erreur (ou restées en attente depuis plus de 2 minutes). Au plus 200 par demande. */
async function renvoyer(gid) {
  await exigerAddon(gid);
  if (!limite(`bq-info-renvoi-${gid}`, 3, 10 * 60 * 1000)) refus('Une relance a déjà été faite récemment. Réessayez dans quelques minutes.', 429);
  const c = await ligneConfig(gid);
  if (!c || !configuree(c)) refus("Enregistrez d'abord les réglages de votre service.");
  const lignes = (await pool.query(
    `SELECT * FROM boutique_infolettre_abonnes WHERE gestionnaire_id = $1 AND (statut_envoi = 'erreur' OR (statut_envoi = 'en_attente' AND created_at < NOW() - interval '2 minutes') OR (statut_envoi = 'local' AND $2::text <> 'aucun'))
      ORDER BY id LIMIT 200`, [gid, c.fournisseur])).rows;
  let ok = 0, erreurs = 0;
  for (const ab of lignes) { const s = await envoyer(c, ab); if (s === 'erreur') erreurs++; else ok++; }
  return { traites: lignes.length, ok, erreurs };
}

// CSV (UTF-8 avec BOM pour Excel). Les cellules qui commenceraient par = + - @ sont neutralisées (injection de formule).
const celluleCsv = (v) => { let s = v === null || v === undefined ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
async function exporterCsv(gid) {
  await exigerAddon(gid);
  const rows = (await pool.query('SELECT email, source, consentement_le, consentement_texte, statut_envoi, created_at FROM boutique_infolettre_abonnes WHERE gestionnaire_id = $1 ORDER BY created_at, id', [gid])).rows;
  const lignes = [['Courriel', 'Source', 'Consentement le', 'Texte accepté', 'Statut', 'Inscrit le'].map(celluleCsv).join(',')];
  for (const r of rows) lignes.push([r.email, r.source, new Date(r.consentement_le).toISOString(), r.consentement_texte, r.statut_envoi, new Date(r.created_at).toISOString()].map(celluleCsv).join(','));
  return '﻿' + lignes.join('\r\n') + '\r\n';
}

module.exports = {
  CODE_ADDON, DEFAUTS, autorise, exigerAddon, etat, enregistrer, effacerCles, configPublique, tester, inscrire, inscrireDepuisCaisse,
  lister, supprimer, renvoyer, exporterCsv, signerAws, formatEmailValide, _dns: dns, _limites: compteurs,
};