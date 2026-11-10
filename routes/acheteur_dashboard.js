// CHEMIN : routes/acheteur_dashboard.js
// e-Vend Studio — API du dashboard acheteur (commandes, retours, liste de souhaits,
// collaborateurs favoris, notifications, profil + adresses, documents, support gestionnaire).
//
// Monté dans server.js sur : /api/acheteur/:gestionnaireId
//
// ── Côté acheteur : cookie httpOnly mv_token_<gestionnaireId> (compte acheteur de CETTE boutique) ──
//   Commandes   GET /commandes · GET /commandes/:id · PUT /commandes/:id/annuler
//               PUT /commandes/:id/confirmer-reception · POST /commandes/:id/retour · POST /commandes/:id/avis
//   Retours     GET /retours
//   Souhaits    GET /wishlist · POST /wishlist { produit_id } · DELETE /wishlist/:produitId
//   Favoris     GET /favoris · GET /favoris/suggestions · POST /favoris/:collabId · DELETE /favoris/:collabId
//   Notifs      GET /notifications · PUT /notifications/:id/lire · PUT /notifications/lire-tout
//   Profil      GET /profil · PUT /profil · PUT /profil/mot-de-passe
//   Adresses    GET /adresses · POST /adresses · PUT /adresses/:id · DELETE /adresses/:id · PUT /adresses/:id/principale
//   Documents   GET /sommaires · GET /sommaires/:annee/:mois/commandes
//   Support     GET /support/conversations · POST /support/conversations · GET /support/conversations/:id/messages
//               POST /support/conversations/:id/messages · GET /support/non-lus
//
// ── Côté gestionnaire (jeton gestionnaire, propriétaire de :gestionnaireId) ──
//   GET /gestionnaire/support/conversations · GET /gestionnaire/support/conversations/:id/messages
//   POST /gestionnaire/support/conversations/:id/messages · PUT /gestionnaire/support/conversations/:id/statut
//   DELETE /gestionnaire/support/messages/:msgId · GET /gestionnaire/support/non-lus

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sanitizeHtml = require('sanitize-html');
const OFFRES = require('../services/studio_offres');
const pool = require('../db');
const cfgMV = require('../services/studio_config_mv');
const regCmd = require('../services/studio_regles_commande');
const rembMV = require('../services/studio_remboursement');
const avisMV = require('../services/studio_avis');
const addonsMV = require('../services/studio_addons');
const paiementMV = require('../services/studio_paiement');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_MESSAGE = 2000;

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────

class Invalide extends Error {
  constructor(message, status) { super(message); this.status = status || 400; }
}
const bad = (message, status) => { throw new Invalide(message, status); };

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide) return res.status(e.status).json({ error: e.message });
    if (e && e.code === '23505') return res.status(409).json({ error: 'Cet élément existe déjà.' });
    console.error('[acheteur_dashboard]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function texte(v, nom, max, obligatoire) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') bad(`${nom} invalide`);
  if (v.length > max * 5) bad(`${nom} trop long (max ${max} caractères)`);
  let t = sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = t.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (t.length > max) bad(`${nom} trop long (max ${max} caractères)`);
  if (obligatoire && !t) bad(`${nom} requis`);
  return t;
}

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now);
  compteurs.set(cle, liste);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [cle, liste] of compteurs) {
    const restants = liste.filter((t) => now - t < 3600000);
    if (restants.length) compteurs.set(cle, restants); else compteurs.delete(cle);
  }
}, 10 * 60 * 1000).unref();

function lireContenu(c) {
  try { return dechiffrer(c) || '[Message non déchiffrable]'; }
  catch (e) { return '[Message non déchiffrable]'; }
}
function apercu(c, supprime) {
  if (supprime) return 'Message supprimé';
  const t = lireContenu(c).replace(/\s+/g, ' ');
  return t.length > 80 ? t.slice(0, 80) + '…' : t;
}

// ─── Authentification ─────────────────────────────────────────────────────────

async function authAcheteur(req, res, next) {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.status(400).json({ error: 'Boutique invalide' });
    const token = req.cookies && req.cookies[`mv_token_${gid}`];
    if (!token) return res.status(401).json({ error: 'Non authentifié' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch (e) { return res.status(401).json({ error: 'Session expirée' }); }
    if (payload.type !== 'acheteur' || Number(payload.gestionnaireId) !== gid) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const r = await pool.query(
      `SELECT id FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2`,
      [entier(payload.id), gid]
    );
    if (!r.rows.length) return res.status(403).json({ error: 'Compte introuvable' });
    req.gid = gid;
    req.aid = r.rows[0].id;
    next();
  } catch (err) {
    console.error('[acheteur_dashboard] auth', err && err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

function verifierGestionnaire(req, res, next) {
  const gid = entier(req.params.gestionnaireId);
  if (!gid || !req.user || req.user.role !== 'gestionnaire' || Number(req.user.id) !== gid) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  req.gid = gid;
  next();
}

router.use('/gestionnaire', authenticateToken, verifierGestionnaire);
// Tout le reste (sauf /gestionnaire) : acheteur connecté.
router.use((req, res, next) => (req.path.startsWith('/gestionnaire') ? next() : authAcheteur(req, res, next)));

// Add-on « Favoris » (produits préférés + boutiques favorites) : si inactif, listes vides en lecture, 403 en écriture.
router.use(['/wishlist', '/favoris'], async (req, res, next) => {
  try {
    if (await addonsMV.addonActifRapide(req.gid, 'favoris', pool)) return next();
    if (req.method === 'GET') return res.json({ items: [], collaborateurs: [] });
    return res.status(403).json({ error: "L'option « Favoris » n'est pas activée pour cette marketplace." });
  } catch (e) {
    console.error('[acheteur_dashboard] favoris', e && e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Notification vers l'acheteur (utilisable aussi par d'autres routes) ──────

async function notifier(gid, acheteurId, titre, message, type, lien) {
  try {
    await pool.query(
      `INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type, lien_url, lien_texte)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [gid, acheteurId, titre, message, type || 'information', lien ? lien.url : null, lien ? lien.texte : null]
    );
  } catch (e) { console.error('[acheteur_dashboard] notifier', e && e.message); }
}

// ════════════════════════════════════════════════════════════════════════════
// COMMANDES
// ════════════════════════════════════════════════════════════════════════════

const RAISONS = {
  non_recu: 'Article non reçu', non_conforme: 'Non conforme à la description', endommage: 'Arrivé endommagé',
  pieces_manquantes: 'Pièces manquantes', change_idee: "J'ai changé d'idée", erreur_commande: 'Erreur de commande',
  mauvaise_taille: 'Mauvaise taille', defectueux: 'Produit défectueux',
};
const TYPES_DEMANDE = ['retour', 'echange', 'remboursement'];

const COLS_CMD = `c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.articles, c.adresse_livraison, c.note,
  c.date_commande, c.numero_suivi, c.transporteur, c.url_suivi, c.etiquette_provider, c.etape_livraison, c.historique_suivi, c.recu_le, c.annule_par, c.raison_annulation, c.collaborateur_id,
  COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS boutique,
  (SELECT r.statut FROM demandes_retour r WHERE r.commande_id = c.id ORDER BY r.created_at DESC LIMIT 1) AS retour_statut,
  EXISTS (SELECT 1 FROM avis_collaborateur a WHERE a.commande_id = c.id AND a.acheteur_id = c.acheteur_id) AS a_avis,
  ${regCmd.SQL_LIVREE_LE} AS livree_le`;

// Ajoute avis_expire (délai pour laisser un avis dépassé) à une commande
function avecAvis(rg, row) { return { ...row, avis_expire: row.statut === 'livree' && regCmd.avisExpire(rg, row.livree_le) }; }

router.get('/commandes', h(async (req, res) => {
  const r = await pool.query(
    `SELECT ${COLS_CMD}
       FROM marketplace_commandes c LEFT JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
      WHERE c.acheteur_id = $1 AND c.gestionnaire_id = $2
      ORDER BY c.date_commande DESC, c.id DESC LIMIT 300`,
    [req.aid, req.gid]);
  const rg = await regCmd.lire(req.gid, pool);
  const mvCfg = await cfgMV.lire(req.gid, pool);
  // avis_actifs = add-on « Avis clients » actif ET réglage marketplace non coupé (sinon : pas de bouton « Donner un avis »)
  res.json({ commandes: r.rows.map((x) => avecAvis(rg, x)), jours_delai_avis: rg.joursAvis, avis_detailles: avisMV.detailles(mvCfg), avis_actifs: await avisMV.actifs(req.gid, pool, mvCfg) });
}));

router.get('/commandes/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  const r = await pool.query(
    `SELECT ${COLS_CMD}
       FROM marketplace_commandes c LEFT JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
      WHERE c.id = $1 AND c.acheteur_id = $2 AND c.gestionnaire_id = $3`, [id, req.aid, req.gid]);
  if (!r.rows.length) bad('Commande introuvable', 404);
  const retours = await pool.query(
    `SELECT id, type_demande, motif, details, statut, montant_remboursement, reponse, created_at
       FROM demandes_retour WHERE commande_id = $1 AND acheteur_id = $2 ORDER BY created_at DESC`, [id, req.aid]);
  res.json({ ...avecAvis(await regCmd.lire(req.gid, pool), r.rows[0]), retours: retours.rows });
}));

router.put('/commandes/:id/annuler', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  const raison = texte(req.body && req.body.raison, 'Raison', 300);
  const c = await pool.query(
    `SELECT statut, statut_paiement FROM marketplace_commandes WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3`,
    [id, req.aid, req.gid]);
  if (!c.rows.length) bad('Commande introuvable', 404);
  if (!['en_attente', 'confirmee'].includes(c.rows[0].statut)) bad('Cette commande ne peut plus être annulée.', 409);
  if (c.rows[0].statut_paiement === 'paye') bad('Commande déjà payée : faites plutôt une demande de remboursement.', 409);
  try {
    // Ferme la page de paiement Stripe, annule la commande et remet le stock réservé
    await paiementMV.annulerNonPayee(id, { par: 'acheteur', raison });
  } catch (e) {
    if (e instanceof paiementMV.ErreurPaiement) bad(e.message, e.status);
    throw e;
  }
  res.json({ success: true });
}));

router.put('/commandes/:id/confirmer-reception', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  const r = await pool.query(
    `UPDATE marketplace_commandes SET statut='livree', recu_le=NOW(), updated_at=NOW()
      WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3 AND statut='expediee'`, [id, req.aid, req.gid]);
  if (!r.rowCount) bad('Cette commande ne peut pas être confirmée comme reçue.', 409);
  // Dans l'historique : sert de point de départ au délai de remboursement et au délai pour laisser un avis
  await rembMV.noter(pool, id, 'statut_livree', 'Réception confirmée par l\'acheteur', 'acheteur');
  res.json({ success: true });
}));

router.post('/commandes/:id/retour', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  if (!limite(`ret-${req.aid}`, 10, 60 * 60 * 1000)) bad('Trop de demandes. Réessayez plus tard.', 429);
  const b = req.body || {};
  const type = TYPES_DEMANDE.includes(b.type_demande) ? b.type_demande : null;
  if (!type) bad('Type de demande invalide');
  const raisons = Array.isArray(b.raisons) ? b.raisons.filter((x) => Object.prototype.hasOwnProperty.call(RAISONS, x)) : [];
  if (!raisons.length) bad('Choisissez au moins une raison');
  const details = texte(b.details, 'Détails', 1000);
  const c = await pool.query(
    `SELECT statut, collaborateur_id FROM marketplace_commandes WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3`,
    [id, req.aid, req.gid]);
  if (!c.rows.length) bad('Commande introuvable', 404);
  if (!['expediee', 'livree'].includes(c.rows[0].statut)) bad('Une demande n\'est possible qu\'après l\'expédition.', 409);
  // Délai de remboursement (Configuration marketplace → Commande) : N jours après la livraison (sinon la date de livraison prévue,
  // sinon l'expédition, sinon le paiement). 0 = sans limite.
  const rg = await regCmd.lire(req.gid, pool);
  if (rg.joursRemboursement > 0) {
    const ref = (await pool.query(
      `SELECT COALESCE(
                (SELECT MAX(h.created_at) FROM commande_historique h WHERE h.commande_id = c.id AND h.evenement = 'statut_livree'),
                c.date_livraison_prevue::timestamptz,
                (SELECT MAX(h.created_at) FROM commande_historique h WHERE h.commande_id = c.id AND h.evenement = 'statut_expediee'),
                c.paye_le, c.date_commande) AS ref
         FROM marketplace_commandes c WHERE c.id = $1`, [id])).rows[0];
    if (ref && ref.ref && Date.now() > new Date(ref.ref).getTime() + rg.joursRemboursement * 86400000) {
      bad(`Le délai pour demander un remboursement ou un retour (${rg.joursRemboursement} jours) est dépassé.`, 409);
    }
  }
  const ouverte = await pool.query(
    `SELECT 1 FROM demandes_retour WHERE commande_id=$1 AND statut IN ('en_attente','approuve') LIMIT 1`, [id]);
  if (ouverte.rows.length) bad('Une demande est déjà en cours pour cette commande.', 409);
  const motif = raisons.map((x) => RAISONS[x]).join(', ').slice(0, 120);
  const r = await pool.query(
    `INSERT INTO demandes_retour (gestionnaire_id, collaborateur_id, commande_id, acheteur_id, motif, details, type_demande)
     VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7) RETURNING id`,
    [req.gid, c.rows[0].collaborateur_id, id, req.aid, motif, details, type]);
  res.status(201).json({ success: true, id: r.rows[0].id });
}));

// ── Avis détaillés : photos (option « Avis détaillés » de Configuration marketplace → Gestion des avis) ──
const MEDIA_URL = 'https://media.e-vend.ca';
const s3 = new S3Client({
  region: 'auto', endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const envoiPhoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('file');
function extensionSelonContenu(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}
const MAX_PHOTOS_AVIS = 5;

router.post('/avis/photo', (req, res) => {
  if (!limite(`avph-${req.aid}`, 20, 10 * 60 * 1000)) return res.status(429).json({ error: 'Trop d\'envois. Réessayez dans quelques minutes.' });
  envoiPhoto(req, res, (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 5 Mo)' : 'Envoi invalide' });
    }
    h(async () => {
      if (!(await avisMV.actifs(req.gid, pool))) bad('Les avis ne sont pas activés sur cette marketplace.', 403);
      if (!avisMV.detailles(await cfgMV.lire(req.gid, pool))) bad('Les photos ne sont pas activées pour les avis.', 403);
      if (!req.file) bad('Aucun fichier reçu');
      const ext = extensionSelonContenu(req.file.buffer);
      if (!ext) bad('Format non accepté (JPEG, PNG ou WebP seulement)');
      const cle = `studio/avis/${req.gid}/${req.aid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
      const mimes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: req.file.buffer, ContentType: mimes[ext] }));
      res.status(201).json({ url: `${MEDIA_URL}/${cle}` });
    })(req, res);
  });
});

// Critères et photos d'un avis détaillé. Ignorés (vides) si l'option est désactivée.
function detailsAvis(req, b, actif) {
  if (!actif) return { criteres: {}, photos: [] };
  const c = b.criteres && typeof b.criteres === 'object' ? b.criteres : {};
  const delai = c.delai_respecte === undefined || c.delai_respecte === null ? null : c.delai_respecte;
  if (delai !== null && typeof delai !== 'boolean') bad('Délai respecté invalide');
  const etoile = (v, nom) => {
    if (v === undefined || v === null) return null;
    if (!Number.isInteger(v) || v < 1 || v > 5) bad(`${nom} invalide (1 à 5)`);
    return v;
  };
  const criteres = { delai_respecte: delai, communication: etoile(c.communication, 'Communication'), emballage: etoile(c.emballage, 'Emballage') };
  const photos = b.photos === undefined || b.photos === null ? [] : b.photos;
  if (!Array.isArray(photos) || photos.length > MAX_PHOTOS_AVIS) bad(`Maximum ${MAX_PHOTOS_AVIS} photos`);
  const re = new RegExp(`^${MEDIA_URL.replace(/\./g, '\\.')}/studio/avis/${req.gid}/${req.aid}/[a-f0-9]{32}\\.(jpg|png|webp)$`);
  for (const u of photos) if (typeof u !== 'string' || !re.test(u)) bad("Photo invalide (utilisez le bouton d'envoi)");
  return { criteres, photos: [...new Set(photos)] };
}

router.post('/commandes/:id/avis', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  const mvCfg = await cfgMV.lire(req.gid, pool);
  if (!(await avisMV.actifs(req.gid, pool, mvCfg))) bad('Les avis ne sont pas activés sur cette marketplace.', 403);
  const b = req.body || {};
  const note = Number(b.note);
  if (!Number.isInteger(note) || note < 1 || note > 5) bad('Note invalide (1 à 5)');
  const titre = texte(b.titre, 'Titre', 120);
  const commentaire = texte(b.commentaire, 'Commentaire', 1500);
  const det = detailsAvis(req, b, avisMV.detailles(mvCfg));
  const c = await pool.query(
    `SELECT c.statut, c.collaborateur_id, ${regCmd.SQL_LIVREE_LE} AS livree_le FROM marketplace_commandes c WHERE c.id=$1 AND c.acheteur_id=$2 AND c.gestionnaire_id=$3`,
    [id, req.aid, req.gid]);
  if (!c.rows.length) bad('Commande introuvable', 404);
  if (c.rows[0].statut !== 'livree') bad('Vous pouvez donner un avis une fois la commande livrée.', 409);
  // Délai pour laisser un avis (Configuration marketplace → Gestion des avis) : N jours après la livraison, 0 = sans limite
  const rgAvis = regCmd.deMV(mvCfg);
  if (regCmd.avisExpire(rgAvis, c.rows[0].livree_le)) bad(`Le délai pour donner un avis (${rgAvis.joursAvis} jours après la livraison) est dépassé.`, 409);
  const deja = await pool.query(`SELECT 1 FROM avis_collaborateur WHERE commande_id=$1 AND acheteur_id=$2`, [id, req.aid]);
  if (deja.rows.length) bad('Vous avez déjà donné un avis pour cette commande.', 409);
  // Publié tout de suite, ou en attente : qui doit l'approuver ? (Configuration marketplace → Gestion des avis)
  const d = await avisMV.decision(req.gid, c.rows[0].collaborateur_id, pool);
  const ins = await pool.query(
    `INSERT INTO avis_collaborateur (gestionnaire_id, collaborateur_id, acheteur_id, commande_id, note, titre, commentaire, approuve, approbateur, criteres, photos)
     VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),NULLIF($7,''),$8,$9,$10::jsonb,$11::jsonb) RETURNING id`,
    [req.gid, c.rows[0].collaborateur_id, req.aid, id, note, titre, commentaire, d.publie, d.approbateur, JSON.stringify(det.criteres), JSON.stringify(det.photos)]);
  const avisId = ins.rows[0].id;
  // Notifications en arrière-plan : ne ralentissent pas l'acheteur
  if (d.publie) avisMV.notifierNouvelAvis(req.gid, avisId, pool);
  else if (d.approbateur === 'collaborateur') avisMV.notifierAvisAApprouver(req.gid, avisId, pool);
  else avisMV.notifierGestionnaire(req.gid, avisId, pool);
  res.status(201).json({ success: true, en_attente: !d.publie, message_acheteur: d.publie ? undefined : 'Merci ! Votre avis sera publié après approbation.' });
}));

// ════════════════════════════════════════════════════════════════════════════
// RETOURS
// ════════════════════════════════════════════════════════════════════════════

router.get('/retours', h(async (req, res) => {
  const r = await pool.query(
    `SELECT r.id, r.commande_id, r.type_demande, r.motif, r.details, r.statut, r.montant_remboursement, r.reponse, r.created_at, r.updated_at,
            c.numero_commande, c.total AS commande_total, c.articles,
            COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS boutique
       FROM demandes_retour r
       JOIN marketplace_commandes c ON c.id = r.commande_id
       LEFT JOIN marketplace_collaborateurs mc ON mc.id = r.collaborateur_id
      WHERE r.acheteur_id = $1 AND r.gestionnaire_id = $2
      ORDER BY r.created_at DESC LIMIT 300`, [req.aid, req.gid]);
  res.json({ retours: r.rows });
}));

// ════════════════════════════════════════════════════════════════════════════
// LISTE DE SOUHAITS
// ════════════════════════════════════════════════════════════════════════════

router.get('/wishlist', h(async (req, res) => {
  const r = await pool.query(
    `SELECT w.id, w.created_at, p.id AS produit_id, p.titre, p.prix, ${OFFRES.sqlPromo('p')} AS prix_promo, p.stock, p.photo_principale, p.categorie, p.statut,
            p.collaborateur_id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable, g.nom) AS boutique
       FROM marketplace_wishlist w
       JOIN produits p ON p.id = w.produit_id
       LEFT JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id
       JOIN gestionnaires g ON g.id = w.gestionnaire_id
      WHERE w.acheteur_id = $1 AND w.gestionnaire_id = $2
      ORDER BY w.created_at DESC LIMIT 300`, [req.aid, req.gid]);
  res.json({ items: r.rows });
}));

router.post('/wishlist', h(async (req, res) => {
  const produitId = entier(req.body && req.body.produit_id);
  if (!produitId) bad('Produit invalide');
  const p = await pool.query(`SELECT id FROM produits WHERE id=$1 AND gestionnaire_id=$2 AND statut='actif'`, [produitId, req.gid]);
  if (!p.rows.length) bad('Produit introuvable', 404);
  await pool.query(
    `INSERT INTO marketplace_wishlist (gestionnaire_id, acheteur_id, produit_id) VALUES ($1,$2,$3)
     ON CONFLICT (acheteur_id, produit_id) DO NOTHING`, [req.gid, req.aid, produitId]);
  res.status(201).json({ success: true });
}));

router.delete('/wishlist/:produitId', h(async (req, res) => {
  const produitId = entier(req.params.produitId);
  if (!produitId) bad('Produit invalide');
  await pool.query(`DELETE FROM marketplace_wishlist WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND produit_id=$3`,
    [req.aid, req.gid, produitId]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// COLLABORATEURS FAVORIS
// ════════════════════════════════════════════════════════════════════════════

const COLS_COLLAB = `mc.id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.logo_url, mc.banniere_url,
  mc.ville, mc.province, mc.type_entreprise, mc.description_boutique, mc.created_at AS membre_depuis,
  (SELECT COUNT(*) FROM produits p WHERE p.collaborateur_id = mc.id AND p.statut = 'actif') AS total_produits,
  (SELECT COALESCE(AVG(a.note),0) FROM avis_collaborateur a WHERE a.collaborateur_id = mc.id AND a.approuve) AS note_moyenne,
  (SELECT COUNT(*) FROM avis_collaborateur a WHERE a.collaborateur_id = mc.id AND a.approuve) AS nombre_avis`;

function formaterCollab(r, avisOk = true) {
  return {
    id: r.id, nom_boutique: r.nom_boutique, logo_url: r.logo_url, banniere_url: r.banniere_url,
    ville: r.ville, province: r.province, type_entreprise: r.type_entreprise,
    description: r.description_boutique ? String(r.description_boutique).slice(0, 150) : '',
    membre_depuis: r.membre_depuis,
    total_produits: parseInt(r.total_produits, 10) || 0,
    note_moyenne: avisOk ? Math.round((parseFloat(r.note_moyenne) || 0) * 10) / 10 : 0,
    nombre_avis: avisOk ? (parseInt(r.nombre_avis, 10) || 0) : 0,
  };
}

router.get('/favoris', h(async (req, res) => {
  const avisOk = await avisMV.actifs(req.gid, pool);
  const r = await pool.query(
    `SELECT ${COLS_COLLAB} FROM marketplace_favoris_collab f
       JOIN marketplace_collaborateurs mc ON mc.id = f.collaborateur_id AND mc.statut = 'actif'
      WHERE f.acheteur_id = $1 AND f.gestionnaire_id = $2 ORDER BY f.created_at DESC LIMIT 200`, [req.aid, req.gid]);
  res.json({ collaborateurs: r.rows.map((x) => formaterCollab(x, avisOk)) });
}));

router.get('/favoris/suggestions', h(async (req, res) => {
  const avisOk = await avisMV.actifs(req.gid, pool);
  const r = await pool.query(
    `SELECT ${COLS_COLLAB} FROM marketplace_collaborateurs mc
      WHERE mc.gestionnaire_id = $2 AND mc.statut = 'actif'
        AND NOT EXISTS (SELECT 1 FROM marketplace_favoris_collab f WHERE f.acheteur_id = $1 AND f.collaborateur_id = mc.id)
      ORDER BY mc.created_at DESC LIMIT 12`, [req.aid, req.gid]);
  res.json({ collaborateurs: r.rows.map((x) => formaterCollab(x, avisOk)) });
}));

router.post('/favoris/:collabId', h(async (req, res) => {
  const collabId = entier(req.params.collabId);
  if (!collabId) bad('Collaborateur invalide');
  const c = await pool.query(`SELECT 1 FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2 AND statut='actif'`, [collabId, req.gid]);
  if (!c.rows.length) bad('Collaborateur introuvable', 404);
  await pool.query(
    `INSERT INTO marketplace_favoris_collab (gestionnaire_id, acheteur_id, collaborateur_id) VALUES ($1,$2,$3)
     ON CONFLICT (acheteur_id, collaborateur_id) DO NOTHING`, [req.gid, req.aid, collabId]);
  res.status(201).json({ success: true });
}));

router.delete('/favoris/:collabId', h(async (req, res) => {
  const collabId = entier(req.params.collabId);
  if (!collabId) bad('Collaborateur invalide');
  await pool.query(`DELETE FROM marketplace_favoris_collab WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND collaborateur_id=$3`,
    [req.aid, req.gid, collabId]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════

router.get('/notifications', h(async (req, res) => {
  const r = await pool.query(
    `SELECT id, titre, message, type, lien_url, lien_texte, lu, created_at AS date
       FROM marketplace_notifications WHERE acheteur_id=$1 AND gestionnaire_id=$2 ORDER BY created_at DESC LIMIT 300`,
    [req.aid, req.gid]);
  res.json({ notifications: r.rows });
}));

// « lire-tout » AVANT « :id/lire » pour que ce chemin ne soit pas pris pour un id.
router.put('/notifications/lire-tout', h(async (req, res) => {
  await pool.query(`UPDATE marketplace_notifications SET lu=true WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND lu=false`, [req.aid, req.gid]);
  res.json({ success: true });
}));

router.put('/notifications/:id/lire', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Notification invalide');
  await pool.query(`UPDATE marketplace_notifications SET lu=true WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3`, [id, req.aid, req.gid]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// PROFIL + ADRESSES
// ════════════════════════════════════════════════════════════════════════════

// Mes badges (attribués par le gestionnaire). Liste vide si l'add-on « Badges » est inactif.
router.get('/badges', h(async (req, res) => {
  if (!(await addonsMV.addonActifRapide(req.gid, 'badges', pool))) return res.json({ actif: false, badges: [] });
  const r = await pool.query(
    `SELECT b.id, b.nom, b.description, b.icone, b.couleur, b.niveau
       FROM badges_acheteur ba JOIN badges_gestionnaire b ON b.id = ba.badge_id
      WHERE ba.acheteur_id = $1 AND b.gestionnaire_id = $2 AND b.statut = 'actif'
      ORDER BY b.niveau DESC, b.nom ASC`, [req.aid, req.gid]);
  res.json({ actif: true, badges: r.rows });
}));

router.get('/profil', h(async (req, res) => {
  const r = await pool.query(
    `SELECT a.id, a.prenom, a.nom, a.email, a.telephone, a.infolettre, a.notifications_promo, a.langue,
            to_char(a.date_naissance, 'YYYY-MM-DD') AS date_naissance, a.created_at,
            (SELECT COUNT(*) FROM marketplace_commandes c WHERE c.acheteur_id = a.id) AS nb_commandes,
            (SELECT COUNT(*) FROM avis_collaborateur v WHERE v.acheteur_id = a.id) AS nb_avis,
            (SELECT COUNT(*) FROM marketplace_wishlist w WHERE w.acheteur_id = a.id) AS nb_wishlist
       FROM marketplace_acheteurs a WHERE a.id = $1 AND a.gestionnaire_id = $2`, [req.aid, req.gid]);
  if (!r.rows.length) bad('Compte introuvable', 404);
  res.json(r.rows[0]);
}));

router.put('/profil', h(async (req, res) => {
  const b = req.body || {};
  const prenom = texte(b.prenom, 'Prénom', 60, true);
  const nom = texte(b.nom, 'Nom', 60, true);
  const email = texte(b.email, 'Courriel', 120, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad('Courriel invalide');
  const telephone = texte(b.telephone, 'Téléphone', 30);
  const langue = b.langue === 'en' ? 'en' : 'fr';
  let naissance = null;
  if (b.date_naissance) {
    if (typeof b.date_naissance !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date_naissance) || Number.isNaN(Date.parse(b.date_naissance))) bad('Date de naissance invalide');
    naissance = b.date_naissance;
  }
  const doublon = await pool.query(
    `SELECT 1 FROM marketplace_acheteurs WHERE gestionnaire_id=$1 AND email=$2 AND id<>$3`, [req.gid, email, req.aid]);
  if (doublon.rows.length) bad('Un compte existe déjà avec ce courriel', 409);
  await pool.query(
    `UPDATE marketplace_acheteurs SET prenom=$1, nom=$2, email=$3, telephone=NULLIF($4,''), langue=$5, date_naissance=$6,
            infolettre=$7, notifications_promo=$8 WHERE id=$9 AND gestionnaire_id=$10`,
    [prenom, nom, email, telephone, langue, naissance, !!b.infolettre, !!b.notifications_promo, req.aid, req.gid]);
  res.json({ success: true });
}));

router.put('/profil/mot-de-passe', h(async (req, res) => {
  if (!limite(`mdp-${req.aid}`, 5, 15 * 60 * 1000)) bad('Trop d\'essais. Réessayez dans quelques minutes.', 429);
  const b = req.body || {};
  if (typeof b.actuel !== 'string' || typeof b.nouveau !== 'string') bad('Champs requis');
  if (b.nouveau.length < 8 || b.nouveau.length > 100) bad('Le nouveau mot de passe doit avoir au moins 8 caractères.');
  const r = await pool.query(`SELECT mot_de_passe FROM marketplace_acheteurs WHERE id=$1 AND gestionnaire_id=$2`, [req.aid, req.gid]);
  if (!r.rows.length) bad('Compte introuvable', 404);
  const ok = await bcrypt.compare(b.actuel, r.rows[0].mot_de_passe);
  if (!ok) bad('Mot de passe actuel incorrect.', 403);
  await pool.query(`UPDATE marketplace_acheteurs SET mot_de_passe=$1 WHERE id=$2`, [await bcrypt.hash(b.nouveau, 10), req.aid]);
  res.json({ success: true });
}));

const COLS_ADR = 'id, nom, type, ligne1, ligne2, ville, province, code_postal, pays, telephone, est_principale';

function lireAdresse(b) {
  b = b || {};
  return {
    nom: texte(b.nom, 'Nom de l\'adresse', 60) || 'Adresse',
    type: b.type === 'facturation' ? 'facturation' : 'livraison',
    ligne1: texte(b.ligne1, 'Adresse', 160, true),
    ligne2: texte(b.ligne2, 'Adresse (ligne 2)', 160),
    ville: texte(b.ville, 'Ville', 80, true),
    province: texte(b.province, 'Province', 60, true),
    code_postal: texte(b.code_postal, 'Code postal', 12, true),
    pays: texte(b.pays, 'Pays', 40) || 'Canada',
    telephone: texte(b.telephone, 'Téléphone', 30),
    principale: !!b.est_principale,
  };
}

router.get('/adresses', h(async (req, res) => {
  const r = await pool.query(
    `SELECT ${COLS_ADR} FROM marketplace_adresses_acheteur WHERE acheteur_id=$1 AND gestionnaire_id=$2
      ORDER BY est_principale DESC, created_at DESC LIMIT 50`, [req.aid, req.gid]);
  res.json({ adresses: r.rows });
}));

router.post('/adresses', h(async (req, res) => {
  const n = await pool.query(`SELECT COUNT(*) AS n FROM marketplace_adresses_acheteur WHERE acheteur_id=$1`, [req.aid]);
  if (parseInt(n.rows[0].n, 10) >= 20) bad('Maximum 20 adresses.');
  const a = lireAdresse(req.body);
  const premiere = parseInt(n.rows[0].n, 10) === 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (a.principale || premiere) {
      await client.query(`UPDATE marketplace_adresses_acheteur SET est_principale=false WHERE acheteur_id=$1`, [req.aid]);
    }
    const r = await client.query(
      `INSERT INTO marketplace_adresses_acheteur (gestionnaire_id, acheteur_id, nom, type, ligne1, ligne2, ville, province, code_postal, pays, telephone, est_principale)
       VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7,$8,$9,$10,NULLIF($11,''),$12) RETURNING ${COLS_ADR}`,
      [req.gid, req.aid, a.nom, a.type, a.ligne1, a.ligne2, a.ville, a.province, a.code_postal, a.pays, a.telephone, a.principale || premiere]);
    await client.query('COMMIT');
    res.status(201).json(r.rows[0]);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

router.put('/adresses/:id/principale', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Adresse invalide');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ex = await client.query(`SELECT 1 FROM marketplace_adresses_acheteur WHERE id=$1 AND acheteur_id=$2`, [id, req.aid]);
    if (!ex.rows.length) { await client.query('ROLLBACK'); bad('Adresse introuvable', 404); }
    await client.query(`UPDATE marketplace_adresses_acheteur SET est_principale=(id=$1) WHERE acheteur_id=$2`, [id, req.aid]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) { try { await client.query('ROLLBACK'); } catch (_) {} throw e; }
  finally { client.release(); }
}));

router.put('/adresses/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Adresse invalide');
  const a = lireAdresse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (a.principale) await client.query(`UPDATE marketplace_adresses_acheteur SET est_principale=false WHERE acheteur_id=$1`, [req.aid]);
    const r = await client.query(
      `UPDATE marketplace_adresses_acheteur SET nom=$1, type=$2, ligne1=$3, ligne2=NULLIF($4,''), ville=$5, province=$6, code_postal=$7,
              pays=$8, telephone=NULLIF($9,''), est_principale=CASE WHEN $10 THEN true ELSE est_principale END
        WHERE id=$11 AND acheteur_id=$12 RETURNING ${COLS_ADR}`,
      [a.nom, a.type, a.ligne1, a.ligne2, a.ville, a.province, a.code_postal, a.pays, a.telephone, a.principale, id, req.aid]);
    if (!r.rows.length) { await client.query('ROLLBACK'); bad('Adresse introuvable', 404); }
    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (e) { try { await client.query('ROLLBACK'); } catch (_) {} throw e; }
  finally { client.release(); }
}));

router.delete('/adresses/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Adresse invalide');
  const r = await pool.query(`DELETE FROM marketplace_adresses_acheteur WHERE id=$1 AND acheteur_id=$2 AND est_principale=false`, [id, req.aid]);
  if (!r.rowCount) bad('Adresse introuvable, ou principale (choisissez-en une autre d\'abord).', 409);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTS — sommaires mensuels calculés à partir des commandes
// ════════════════════════════════════════════════════════════════════════════

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

router.get('/sommaires', h(async (req, res) => {
  const r = await pool.query(
    `SELECT EXTRACT(YEAR FROM date_commande)::int AS annee, EXTRACT(MONTH FROM date_commande)::int AS mois,
            COUNT(*) AS nb_commandes, COALESCE(SUM(total),0) AS total_depense,
            ARRAY_AGG(DISTINCT COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable)) FILTER (WHERE mc.id IS NOT NULL) AS boutiques
       FROM marketplace_commandes c LEFT JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
      WHERE c.acheteur_id=$1 AND c.gestionnaire_id=$2 AND c.statut <> 'annulee'
      GROUP BY 1,2 ORDER BY 1 DESC, 2 DESC LIMIT 36`, [req.aid, req.gid]);
  res.json({ sommaires: r.rows.map((s) => ({
    annee: s.annee, mois: s.mois, periode_label: `${MOIS[s.mois - 1]} ${s.annee}`.replace(/^./, (c) => c.toUpperCase()),
    nb_commandes: parseInt(s.nb_commandes, 10), total_depense: parseFloat(s.total_depense), boutiques: s.boutiques || [],
  })) });
}));

router.get('/sommaires/:annee/:mois/commandes', h(async (req, res) => {
  const annee = parseInt(req.params.annee, 10), mois = parseInt(req.params.mois, 10);
  if (!(annee >= 2000 && annee <= 2100) || !(mois >= 1 && mois <= 12)) bad('Période invalide');
  const r = await pool.query(
    `SELECT c.id, c.numero_commande, c.date_commande, c.statut, c.total, c.articles,
            COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS boutique
       FROM marketplace_commandes c LEFT JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
      WHERE c.acheteur_id=$1 AND c.gestionnaire_id=$2 AND c.statut <> 'annulee'
        AND EXTRACT(YEAR FROM c.date_commande)=$3 AND EXTRACT(MONTH FROM c.date_commande)=$4
      ORDER BY c.date_commande`, [req.aid, req.gid, annee, mois]);
  res.json({ commandes: r.rows });
}));

// ════════════════════════════════════════════════════════════════════════════
// SUPPORT — acheteur ↔ gestionnaire
// ════════════════════════════════════════════════════════════════════════════

const CATEGORIES = ['Général', 'Paiement', 'Commande', 'Produit', 'Technique', 'Compte'];

const SQL_TICKETS = `
  SELECT t.id, t.sujet, t.categorie, t.numero_commande, t.priorite, t.statut, t.created_at, t.updated_at,
         a.id AS acheteur_id, a.prenom, a.nom,
         lm.contenu AS dm_contenu, lm.created_at AS dm_date, lm.supprime AS dm_supprime,
         (SELECT COUNT(*) FROM support_acheteur_msg x
           WHERE x.ticket_id = t.id AND x.expediteur_role = $3 AND x.lu = false AND x.supprime = false) AS non_lus
    FROM support_acheteur t
    JOIN marketplace_acheteurs a ON a.id = t.acheteur_id
    LEFT JOIN LATERAL (
      SELECT contenu, created_at, supprime FROM support_acheteur_msg WHERE ticket_id = t.id ORDER BY created_at DESC, id DESC LIMIT 1
    ) lm ON true
   WHERE t.gestionnaire_id = $1 AND ($2::int IS NULL OR t.acheteur_id = $2) AND ($4::int IS NULL OR t.id = $4)
   ORDER BY t.updated_at DESC LIMIT 200`;

function formaterTicket(r) {
  return {
    id: r.id, sujet: r.sujet, categorie: r.categorie, numero_commande: r.numero_commande, priorite: r.priorite, statut: r.statut,
    created_at: r.created_at, updated_at: r.updated_at,
    acheteur: { id: r.acheteur_id, prenom: r.prenom, nom: r.nom },
    dernier_message: r.dm_contenu ? apercu(r.dm_contenu, r.dm_supprime) : null,
    dernier_message_date: r.dm_date,
    non_lus: parseInt(r.non_lus, 10) || 0,
  };
}

async function messagesTicket(ticketId, lecteurRole) {
  const msgs = await pool.query(
    `SELECT m.id, m.expediteur_role, m.contenu, m.supprime, m.created_at,
            CASE m.expediteur_role WHEN 'acheteur' THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')) ELSE g.nom END AS expediteur_nom
       FROM support_acheteur_msg m
       JOIN support_acheteur t ON t.id = m.ticket_id
       JOIN marketplace_acheteurs a ON a.id = t.acheteur_id
       JOIN gestionnaires g ON g.id = t.gestionnaire_id
      WHERE m.ticket_id = $1 ORDER BY m.created_at ASC, m.id ASC LIMIT 500`, [ticketId]);
  // Ce que l'AUTRE partie a écrit est maintenant lu.
  await pool.query(
    `UPDATE support_acheteur_msg SET lu = true WHERE ticket_id = $1 AND expediteur_role <> $2 AND lu = false`, [ticketId, lecteurRole]);
  return msgs.rows.map((m) => ({
    id: m.id, expediteur_role: m.expediteur_role, expediteur_nom: m.expediteur_nom,
    contenu: m.supprime ? '' : lireContenu(m.contenu), supprime: m.supprime, created_at: m.created_at,
  }));
}

// ── Côté acheteur ──
router.get('/support/conversations', h(async (req, res) => {
  const r = await pool.query(SQL_TICKETS, [req.gid, req.aid, 'gestionnaire', null]);
  res.json(r.rows.map(formaterTicket));
}));

router.get('/support/non-lus', h(async (req, res) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS n FROM support_acheteur_msg m JOIN support_acheteur t ON t.id = m.ticket_id
      WHERE t.gestionnaire_id=$1 AND t.acheteur_id=$2 AND m.expediteur_role='gestionnaire' AND m.lu=false AND m.supprime=false`,
    [req.gid, req.aid]);
  res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
}));

router.post('/support/conversations', h(async (req, res) => {
  if (!limite(`sup-new-${req.aid}`, 5, 10 * 60 * 1000)) bad('Trop de billets créés. Réessayez plus tard.', 429);
  const b = req.body || {};
  const sujet = texte(b.sujet, 'Sujet', 120, true);
  const description = texte(b.description, 'Description', MAX_MESSAGE, true);
  const categorie = CATEGORIES.includes(b.categorie) ? b.categorie : 'Général';
  const numero = texte(b.numero_commande, 'Numéro de commande', 60);
  const r = await pool.query(
    `WITH t AS (
       INSERT INTO support_acheteur (gestionnaire_id, acheteur_id, sujet, categorie, numero_commande)
       VALUES ($1,$2,$3,$4,NULLIF($5,'')) RETURNING id
     )
     INSERT INTO support_acheteur_msg (ticket_id, expediteur_role, expediteur_id, contenu)
     SELECT id, 'acheteur', $2, $6 FROM t RETURNING ticket_id`,
    [req.gid, req.aid, sujet, categorie, numero, chiffrer(description)]);
  const t = await pool.query(SQL_TICKETS, [req.gid, req.aid, 'gestionnaire', r.rows[0].ticket_id]);
  res.status(201).json(formaterTicket(t.rows[0]));
}));

router.get('/support/conversations/:id/messages', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Conversation invalide');
  const c = await pool.query(`SELECT id FROM support_acheteur WHERE id=$1 AND gestionnaire_id=$2 AND acheteur_id=$3`, [id, req.gid, req.aid]);
  if (!c.rows.length) bad('Conversation introuvable', 404);
  res.json(await messagesTicket(id, 'acheteur'));
}));

router.post('/support/conversations/:id/messages', h(async (req, res) => {
  if (!limite(`sup-msg-${req.aid}`, 30, 60 * 1000)) bad('Trop de messages. Ralentissez un peu.', 429);
  const id = entier(req.params.id);
  if (!id) bad('Conversation invalide');
  const t = texte(req.body && req.body.contenu, 'Message', MAX_MESSAGE, true);
  const c = await pool.query(
    `SELECT id FROM support_acheteur WHERE id=$1 AND gestionnaire_id=$2 AND acheteur_id=$3 AND statut <> 'ferme'`, [id, req.gid, req.aid]);
  if (!c.rows.length) bad('Conversation introuvable ou fermée', 403);
  await pool.query(`INSERT INTO support_acheteur_msg (ticket_id, expediteur_role, expediteur_id, contenu) VALUES ($1,'acheteur',$2,$3)`,
    [id, req.aid, chiffrer(t)]);
  await pool.query(`UPDATE support_acheteur SET updated_at=NOW(), statut='ouvert' WHERE id=$1`, [id]);
  res.status(201).json({ success: true });
}));

// ── Côté gestionnaire ──
router.get('/gestionnaire/support/conversations', h(async (req, res) => {
  const r = await pool.query(SQL_TICKETS, [req.gid, null, 'acheteur', null]);
  res.json(r.rows.map(formaterTicket));
}));

router.get('/gestionnaire/support/non-lus', h(async (req, res) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS n FROM support_acheteur_msg m JOIN support_acheteur t ON t.id = m.ticket_id
      WHERE t.gestionnaire_id=$1 AND m.expediteur_role='acheteur' AND m.lu=false AND m.supprime=false`, [req.gid]);
  res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
}));

router.get('/gestionnaire/support/conversations/:id/messages', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Conversation invalide');
  const c = await pool.query(`SELECT id FROM support_acheteur WHERE id=$1 AND gestionnaire_id=$2`, [id, req.gid]);
  if (!c.rows.length) bad('Conversation introuvable', 404);
  res.json(await messagesTicket(id, 'gestionnaire'));
}));

router.post('/gestionnaire/support/conversations/:id/messages', h(async (req, res) => {
  if (!limite(`sup-g-${req.gid}`, 30, 60 * 1000)) bad('Trop de messages. Ralentissez un peu.', 429);
  const id = entier(req.params.id);
  if (!id) bad('Conversation invalide');
  const t = texte(req.body && req.body.contenu, 'Message', MAX_MESSAGE, true);
  const c = await pool.query(
    `SELECT acheteur_id, sujet FROM support_acheteur WHERE id=$1 AND gestionnaire_id=$2 AND statut <> 'ferme'`, [id, req.gid]);
  if (!c.rows.length) bad('Conversation introuvable ou fermée', 403);
  await pool.query(`INSERT INTO support_acheteur_msg (ticket_id, expediteur_role, expediteur_id, contenu) VALUES ($1,'gestionnaire',$2,$3)`,
    [id, req.gid, chiffrer(t)]);
  await pool.query(`UPDATE support_acheteur SET updated_at=NOW() WHERE id=$1`, [id]);
  await notifier(req.gid, c.rows[0].acheteur_id, 'Nouvelle réponse du support', `Réponse à votre billet « ${c.rows[0].sujet} ».`, 'information');
  res.status(201).json({ success: true });
}));

router.put('/gestionnaire/support/conversations/:id/statut', h(async (req, res) => {
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !['ouvert', 'resolu', 'ferme'].includes(statut)) bad('Statut invalide');
  const r = await pool.query(`UPDATE support_acheteur SET statut=$1, updated_at=NOW() WHERE id=$2 AND gestionnaire_id=$3`, [statut, id, req.gid]);
  if (!r.rowCount) bad('Conversation introuvable', 404);
  res.json({ success: true });
}));

router.delete('/gestionnaire/support/messages/:msgId', h(async (req, res) => {
  const msgId = entier(req.params.msgId);
  if (!msgId) bad('Message invalide');
  const r = await pool.query(
    `UPDATE support_acheteur_msg m SET supprime = true FROM support_acheteur t
      WHERE m.id=$1 AND t.id=m.ticket_id AND t.gestionnaire_id=$2 AND m.expediteur_role='gestionnaire'`, [msgId, req.gid]);
  if (!r.rowCount) bad('Message introuvable', 404);
  res.json({ success: true });
}));

module.exports = router;