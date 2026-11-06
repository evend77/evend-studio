// CHEMIN : routes/studio_courriels.js
// e-Vend Studio — Modèles de courriel de la boutique + serveur d'envoi (SMTP) du gestionnaire.
//
// Monté dans server.js sur : /api/studio/courriels/:gestionnaireId   (gestionnaire connecté, SA boutique seulement)
//   GET    /modeles                    — liste (copie les modèles de base la 1re fois) + sections + variables
//   PUT    /modeles/:cle               — modifier { sujet, html, actif }
//   POST   /modeles/:cle/reinitialiser — remet le texte de base
//   POST   /apercu                     — { sujet, html } → rendu avec valeurs d'exemple
//   POST   /modeles/:cle/test          — { destinataire, sujet?, html? } → courriel de test via SON SMTP
//   GET    /smtp                       — réglages (sans le mot de passe)
//   PUT    /smtp                       — enregistrer { host, port, utilisateur, mot_de_passe?, expediteur_email, expediteur_nom, actif }
//   POST   /smtp/tester                — { destinataire } → vérifie la connexion et envoie un courriel de test

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const svc = require('../services/studio_courriels');
const { SECTIONS, COMMUNES, parCle, MODELES } = require('../services/courriels_defauts');

const router = express.Router({ mergeParams: true });

class Invalide extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const bad = (m, s) => { throw new Invalide(m, s); };
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide) return res.status(e.status).json({ error: e.message });
    console.error('[studio_courriels]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

function proprietaire(req, res, next) {
  const idToken = parseInt(req.user && req.user.id, 10);
  const idParam = parseInt(req.params.gestionnaireId, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(idParam) || idToken !== idParam) return res.status(403).json({ error: 'Accès refusé.' });
  req.gid = idParam;
  next();
}
router.use(authenticateToken, proprietaire);

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const texte = (v, nom, max, obligatoire) => {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') bad(`${nom} invalide.`);
  v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (obligatoire && !v.trim()) bad(`${nom} obligatoire.`);
  if (v.length > max) bad(`${nom} trop long (max ${max} caractères).`);
  return v;
};

// Limite des courriels de test (évite d'utiliser le site pour spammer quelqu'un)
const tests = new Map();
function limiteTests(gid) {
  const n = Date.now(), c = tests.get(gid);
  if (!c || n - c.debut > 3600000) { tests.set(gid, { debut: n, n: 1 }); return; }
  if (c.n >= 20) bad('Trop de courriels de test. Réessayez plus tard.', 429);
  c.n++;
}

// ── Modèles ──────────────────────────────────────────────────────────────────
router.get('/modeles', h(async (req, res) => {
  await svc.assurerModeles(req.gid);
  const r = await pool.query(`SELECT cle, sujet, html, actif, modifie FROM studio_modeles_courriel WHERE gestionnaire_id = $1`, [req.gid]);
  const enBase = new Map(r.rows.map((x) => [x.cle, x]));
  const modeles = MODELES.map((m) => {
    const b = enBase.get(m.cle) || { sujet: m.sujet, html: m.html, actif: true, modifie: false };
    return { cle: m.cle, section: m.section, nom: m.nom, destinataire: m.destinataire, branche: m.branche, variables: [...m.variables, ...COMMUNES], sujet: b.sujet, html: b.html, actif: b.actif, modifie: b.modifie };
  });
  res.json({ sections: SECTIONS, modeles });
}));

router.put('/modeles/:cle', h(async (req, res) => {
  const cle = req.params.cle;
  if (!parCle.has(cle)) bad('Modèle introuvable.', 404);
  const sujet = texte(req.body && req.body.sujet, 'Sujet', 200, true).replace(/[\r\n]+/g, ' ');
  const html = svc.nettoyerHtml(texte(req.body && req.body.html, 'Contenu', 50000, true));
  if (!html.trim()) bad('Le contenu est vide ou invalide.');
  if (typeof (req.body && req.body.actif) !== 'boolean') bad('État invalide.');
  await svc.assurerModeles(req.gid);
  const defaut = parCle.get(cle);
  await pool.query(
    `UPDATE studio_modeles_courriel SET sujet = $1::varchar, html = $2::text, actif = $3, modifie = ($1::varchar <> $4::varchar OR $2::text <> $5::text), updated_at = NOW() WHERE gestionnaire_id = $6 AND cle = $7`,
    [sujet, html, req.body.actif, defaut.sujet, svc.nettoyerHtml(defaut.html), req.gid, cle]);
  res.json({ success: true, html });
}));

router.post('/modeles/:cle/reinitialiser', h(async (req, res) => {
  const defaut = parCle.get(req.params.cle);
  if (!defaut) bad('Modèle introuvable.', 404);
  await svc.assurerModeles(req.gid);
  await pool.query(`UPDATE studio_modeles_courriel SET sujet = $1, html = $2, modifie = false, updated_at = NOW() WHERE gestionnaire_id = $3 AND cle = $4`, [defaut.sujet, defaut.html, req.gid, defaut.cle]);
  res.json({ success: true, sujet: defaut.sujet, html: defaut.html });
}));

router.post('/apercu', h(async (req, res) => {
  const sujet = texte(req.body && req.body.sujet, 'Sujet', 200);
  const html = texte(req.body && req.body.html, 'Contenu', 50000);
  res.json(await svc.composerExemple(req.gid, sujet, html));
}));

router.post('/modeles/:cle/test', h(async (req, res) => {
  const defaut = parCle.get(req.params.cle);
  if (!defaut) bad('Modèle introuvable.', 404);
  const a = texte(req.body && req.body.destinataire, 'Destinataire', 160, true).trim();
  if (!EMAIL.test(a)) bad('Adresse courriel invalide.');
  const sujet = texte(req.body && req.body.sujet, 'Sujet', 200, true);
  const html = texte(req.body && req.body.html, 'Contenu', 50000, true);
  limiteTests(req.gid);
  try { await svc.envoyerTest(req.gid, a, sujet, html); } catch (e) { bad(svc.messageErreur(e), 400); }
  res.json({ success: true });
}));

// ── SMTP du gestionnaire ─────────────────────────────────────────────────────
const publicSmtp = (r) => (r ? { host: r.host, port: r.port, utilisateur: r.utilisateur || '', mot_de_passe_defini: !!r.mot_de_passe_chiffre, expediteur_email: r.expediteur_email, expediteur_nom: r.expediteur_nom || '', actif: r.actif, derniere_verification: r.derniere_verification } : null);

router.get('/smtp', h(async (req, res) => {
  res.json({ smtp: publicSmtp(await svc.chargerSmtp(req.gid)), ports: svc.PORTS_PERMIS });
}));

router.put('/smtp', h(async (req, res) => {
  const b = req.body || {};
  const host = texte(b.host, 'Serveur SMTP', 253, true).trim().toLowerCase();
  const port = parseInt(b.port, 10);
  if (!svc.PORTS_PERMIS.includes(port)) bad(`Port invalide (permis : ${svc.PORTS_PERMIS.join(', ')}).`);
  const utilisateur = texte(b.utilisateur, 'Utilisateur', 200).trim();
  const expediteurEmail = texte(b.expediteur_email, "Adresse d'expédition", 160, true).trim();
  if (!EMAIL.test(expediteurEmail)) bad("Adresse d'expédition invalide.");
  const expediteurNom = texte(b.expediteur_nom, "Nom d'expéditeur", 100).replace(/[\r\n"<>]/g, '').trim();
  if (typeof b.actif !== 'boolean') bad('État invalide.');
  try { await svc.verifierServeurSmtp(host); } catch (e) { bad(e.message); }

  const existant = await svc.chargerSmtp(req.gid);
  let mdp = existant ? existant.mot_de_passe_chiffre : null;
  if (typeof b.mot_de_passe === 'string' && b.mot_de_passe !== '') {
    if (b.mot_de_passe.length > 500) bad('Mot de passe trop long.');
    mdp = svc.chiffrer(b.mot_de_passe);
  }
  if (utilisateur && !mdp) bad('Le mot de passe SMTP est obligatoire.');
  await pool.query(
    `INSERT INTO studio_smtp (gestionnaire_id, host, port, utilisateur, mot_de_passe_chiffre, expediteur_email, expediteur_nom, actif, updated_at)
     VALUES ($1,$2,$3,NULLIF($4,''),$5,$6,NULLIF($7,''),$8,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET host=$2, port=$3, utilisateur=NULLIF($4,''), mot_de_passe_chiffre=$5, expediteur_email=$6, expediteur_nom=NULLIF($7,''), actif=$8, updated_at=NOW()`,
    [req.gid, host, port, utilisateur, mdp, expediteurEmail, expediteurNom, b.actif]);
  res.json({ success: true, smtp: publicSmtp(await svc.chargerSmtp(req.gid)) });
}));

router.post('/smtp/tester', h(async (req, res) => {
  const a = texte(req.body && req.body.destinataire, 'Destinataire', 160, true).trim();
  if (!EMAIL.test(a)) bad('Adresse courriel invalide.');
  const cfg = await svc.chargerSmtp(req.gid);
  if (!cfg) bad("Enregistrez d'abord vos réglages SMTP.");
  limiteTests(req.gid);
  try {
    const t = await svc.creerTransport(cfg);
    await t.verify();
    const site = await svc.composerExemple(req.gid, 'Test de votre serveur d\'envoi', '<div style="font-family:Arial,sans-serif;padding:24px;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;"><h2 style="margin:0 0 12px 0;">Ça fonctionne ✅</h2><p>Ce courriel confirme que votre serveur SMTP est bien configuré pour <strong>{$nom_site}</strong>.</p></div>');
    const de = cfg.expediteur_nom ? { name: cfg.expediteur_nom, address: cfg.expediteur_email } : cfg.expediteur_email;
    await t.sendMail({ from: de, to: a, subject: '[TEST] ' + site.sujet, html: site.html });
  } catch (e) {
    await pool.query(`UPDATE studio_smtp SET derniere_verification = NULL WHERE gestionnaire_id = $1`, [req.gid]).catch(() => {});
    bad(svc.messageErreur(e), 400);
  }
  await pool.query(`UPDATE studio_smtp SET derniere_verification = NOW() WHERE gestionnaire_id = $1`, [req.gid]);
  res.json({ success: true });
}));

module.exports = router;