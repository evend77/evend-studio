// CHEMIN : services/boutique_inscription.js
// e-Vend Studio — Inscription des ACHETEURS des templates boutique (solo), configurable par le gestionnaire.
// La config vit dans sites.config.<template>.inscription (onglet « Compte / Inscription » de Config Mes pages).
// Le compte créé est un compte du MV (marketplace_acheteurs) : même connexion, mêmes jetons. Rien du MV n'est modifié.
// Règles de format (téléphone, code postal, province) : mêmes que routes/acheteurs.js (validerInscriptionAcheteur).
// Nettoyage du texte : même méthode que routes/collab_dashboard.js (sanitize-html, aucune balise permise).
// L'adresse est chiffrée au repos (src/utils/chiffrement), comme dans e-Vend. Valeurs par défaut identiques à la page de config et au template.

'use strict';

const bcrypt = require('bcrypt');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const cfgMV = require('./studio_config_mv');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

// Clés de config des templates solo (un site n'en utilise qu'une). Ajouter ici chaque nouveau template passé.
const CLES_TEMPLATES = ['premium', 'simplisse', 'simple'];

// Clé de config d'un template solo d'après son identifiant (null = inconnu : on cherche alors dans toutes les clés ci-dessus).
// Simplisse-Mode et Beauté seront ajoutés ici quand leur config d'inscription existera.
function cleDuTemplate(templateId) {
  const t = String(templateId || '');
  if (t === 'boutique-simple') return 'simple';   // Mono-produit : comparaison EXACTE (« boutique-simplisse » commence par « boutique-simple »)
  if (t.startsWith('boutique-premium')) return 'premium';
  if (t.startsWith('boutique-simplisse') && !t.startsWith('boutique-simplisse-mode')) return 'simplisse';
  return null;
}

const TYPES_CHAMP = ['text', 'email', 'tel', 'select', 'textarea', 'checkbox'];

const DEFAUT = {
  titre: 'Créer un compte',
  sousTitre: '',
  boutonTexte: 'Créer mon compte',
  messageSuccesTitre: 'Compte créé avec succès !',
  messageSuccesTexte: 'Vous pouvez maintenant vous connecter.',
  libelles: { prenom: 'Prénom', nom: 'Nom', email: 'Courriel', mot_de_passe: 'Mot de passe', confirmation: 'Confirmez le mot de passe' },
  telephone: { mode: 'cache' },                       // cache | facultatif | obligatoire
  adresse: { mode: 'obligatoire' },                   // cache | facultatif | obligatoire — adresse de livraison, pré-remplit la caisse
  infolettre: { affiche: false, texte: 'Je veux recevoir les nouveautés par courriel' },
  age: { affiche: true, minimum: 16, texte: 'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes: { affiche: true, texte: "J'accepte les termes et conditions de la boutique", url: '' },
  champs: [],
};

function fusion(brut) {
  const b = brut && typeof brut === 'object' ? brut : {};
  const sous = (k) => Object.assign({}, DEFAUT[k], b[k] && typeof b[k] === 'object' ? b[k] : {});
  return Object.assign({}, DEFAUT, b, {
    libelles: sous('libelles'), telephone: sous('telephone'), adresse: sous('adresse'), infolettre: sous('infolettre'), age: sous('age'), termes: sous('termes'),
    champs: Array.isArray(b.champs) ? b.champs.filter((c) => c && typeof c === 'object' && c.id && TYPES_CHAMP.indexOf(c.type) !== -1) : [],
  });
}

// Lit le site : config d'inscription fusionnée avec les défauts, et mode solo ou non
async function configSite(gid, db) {
  const r = await (db || pool).query('SELECT template_id, config FROM sites WHERE gestionnaire_id = $1', [gid]);
  const s = r.rows[0];
  if (!s || !String(s.template_id || '').startsWith('boutique-')) return null;
  const cfg = s.config && typeof s.config === 'object' ? s.config : {};
  let brut = null;
  const cle = cleDuTemplate(s.template_id);
  if (cle) { const t0 = cfg[cle]; if (t0 && typeof t0 === 'object' && t0.inscription) brut = t0.inscription; }
  else for (let i = 0; i < CLES_TEMPLATES.length; i++) {
    const t = cfg[CLES_TEMPLATES[i]];
    if (t && typeof t === 'object' && t.inscription) { brut = t.inscription; break; }
  }
  return fusion(brut);
}

// ─── Format (mêmes règles que routes/acheteurs.js) ───────────────────────────
const REGEX_CODE_POSTAL_CA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const REGEX_TELEPHONE_NA = /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROVINCES_VALIDES = ['QC', 'ON', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
const PROVINCE_PAR_LETTRE_CODE_POSTAL = { A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON', R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT' };
const PROVINCES_ACCEPTEES_POUR_X = ['NT', 'NU'];

function normaliserCodePostal(cp) {
  const n = cp.trim().toUpperCase().replace(/[\s-]/g, '');
  return `${n.slice(0, 3)} ${n.slice(3)}`;
}

// ─── Nettoyage : texte seul, balises retirées (scripts avec leur contenu), caractères de contrôle retirés ───
const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function texte(v, max) {
  if (typeof v !== 'string') return '';
  let t = sanitizeHtml(v.slice(0, (max || 200) * 5), { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = t.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  return t.slice(0, max || 200);
}

// Valide le corps reçu selon la config. Retourne { erreur } ou { donnees, adresse, reponses }.
function valider(cfg, b) {
  const corps = b && typeof b === 'object' ? b : {};
  const L = cfg.libelles;
  const prenom = texte(corps.prenom, 100), nom = texte(corps.nom, 100), email = texte(corps.email, 200); // courriel tel que saisi : le login du MV le compare exactement
  const mdp = typeof corps.mot_de_passe === 'string' ? corps.mot_de_passe : '';
  if (!prenom) return { erreur: `${L.prenom} : obligatoire.` };
  if (!nom) return { erreur: `${L.nom} : obligatoire.` };
  if (!REGEX_EMAIL.test(email)) return { erreur: 'Adresse courriel invalide.' };
  if (mdp.length < 8) return { erreur: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (mdp.length > 200) return { erreur: 'Mot de passe trop long.' };
  if (mdp !== (typeof corps.confirmation === 'string' ? corps.confirmation : '')) return { erreur: 'Les mots de passe ne correspondent pas.' };
  let telephone = null;
  if (cfg.telephone.mode !== 'cache') {
    telephone = texte(corps.telephone, 40) || null;
    if (!telephone && cfg.telephone.mode === 'obligatoire') return { erreur: 'Téléphone : obligatoire.' };
    if (telephone && !REGEX_TELEPHONE_NA.test(telephone)) return { erreur: 'Numéro de téléphone invalide (format nord-américain attendu, ex: 514-555-0100).' };
  }
  let adresse = null;
  if (cfg.adresse.mode !== 'cache') {
    const a = texte(corps.adresse, 160), v = texte(corps.ville, 80), cp = texte(corps.code_postal, 10), prov = texte(corps.province, 5).toUpperCase();
    if (cfg.adresse.mode === 'obligatoire' || a || v || cp) {
      if (a.length < 3) return { erreur: 'Adresse invalide.' };
      if (v.length < 2) return { erreur: 'Ville invalide.' };
      if (!REGEX_CODE_POSTAL_CA.test(cp)) return { erreur: 'Code postal invalide (format canadien attendu, ex: H2X 1Y4).' };
      if (PROVINCES_VALIDES.indexOf(prov) === -1) return { erreur: 'Province invalide.' };
      const premiere = cp.toUpperCase()[0];
      const coherent = premiere === 'X' ? PROVINCES_ACCEPTEES_POUR_X.indexOf(prov) !== -1 : prov === PROVINCE_PAR_LETTRE_CODE_POSTAL[premiere];
      if (!coherent) return { erreur: 'Le code postal ne correspond pas à la province sélectionnée.' };
      adresse = { adresse1: a, ville: v, province: prov, code_postal: normaliserCodePostal(cp) };
    }
  }
  const infolettre = cfg.infolettre.affiche === true && corps.infolettre === true;
  const reponses = [];
  const saisies = corps.champs && typeof corps.champs === 'object' && !Array.isArray(corps.champs) ? corps.champs : {};
  for (let i = 0; i < cfg.champs.length; i++) {
    const c = cfg.champs[i];
    const etiquette = texte(c.label, 120) || 'Champ';
    let v = saisies[c.id];
    if (c.type === 'checkbox') {
      v = v === true;
      if (c.requis && !v) return { erreur: `${etiquette} : obligatoire.` };
    } else {
      v = texte(v, c.type === 'textarea' ? 2000 : 500);
      if (!v && c.requis) return { erreur: `${etiquette} : obligatoire.` };
      if (v && c.type === 'email' && !REGEX_EMAIL.test(v)) return { erreur: `${etiquette} : adresse courriel invalide.` };
      if (v && c.type === 'tel' && !REGEX_TELEPHONE_NA.test(v)) return { erreur: `${etiquette} : numéro de téléphone invalide.` };
      if (v && c.type === 'select' && (c.options || []).indexOf(v) === -1) return { erreur: `${etiquette} : choix invalide.` };
    }
    if (v !== '' && v !== false) reponses.push({ id: String(c.id).slice(0, 80), label: etiquette, valeur: v });
  }
  // Même ordre que la page : champs, puis infolettre, âge, termes
  if (cfg.age.affiche === true && corps.age_confirme !== true) return { erreur: `Vous devez confirmer votre âge (${Number(cfg.age.minimum) || 16} ans ou +).` };
  if (cfg.termes.affiche === true && corps.termes_acceptes !== true) return { erreur: "Vous devez accepter les conditions d'utilisation." };
  return { donnees: { prenom, nom, email, mdp, telephone, infolettre }, adresse, reponses };
}

// Crée le compte (même requête que l'inscription du MV) + adresse chiffrée + réponses aux champs personnalisés, en une transaction
async function inscrire(gid, corps) {
  const cfg = await configSite(gid);
  if (!cfg) return { statut: 404, message: "Cette boutique n'est pas disponible." };
  if (cfgMV.actif(await cfgMV.lire(gid, pool), 'bloquer_inscription_acheteur', false)) {
    return { statut: 403, message: "Les inscriptions d'acheteurs sont fermées sur cette boutique.", ferme: true };
  }
  // Anti-bot (toujours actif) : champ piège vide, délai minimum de 3 s, souris bougée
  if (corps && corps.website) return { statut: 201, acheteur: { id: 0, prenom: '', nom: '', email: '' }, leurre: true };
  if (!corps || !(Number(corps.duree_ms) >= 3000)) return { statut: 400, message: 'Soumission trop rapide. Veuillez prendre le temps de remplir le formulaire.', bot: true };
  if (corps.souris !== true) return { statut: 400, message: 'Comportement inhabituel détecté. Veuillez réessayer.', bot: true };
  const v = valider(cfg, corps);
  if (v.erreur) return { statut: 400, message: v.erreur };
  const d = v.donnees;
  const existant = await pool.query('SELECT id FROM marketplace_acheteurs WHERE gestionnaire_id = $1 AND email = $2', [gid, d.email]);
  if (existant.rows.length > 0) return { statut: 409, message: 'Un compte existe deja avec ce courriel' };
  const hash = await bcrypt.hash(d.mdp, 10);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await c.query(
      `INSERT INTO marketplace_acheteurs (gestionnaire_id, prenom, nom, email, mot_de_passe, telephone, infolettre)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, prenom, nom, email`,
      [gid, d.prenom, d.nom, d.email, hash, d.telephone, d.infolettre]
    );
    const acheteur = r.rows[0];
    if (v.adresse) {
      const a = v.adresse;
      await c.query(
        `INSERT INTO boutique_acheteur_adresses (gestionnaire_id, acheteur_id, nom, adresse1, ville, province, code_postal, telephone, type, est_principale)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'livraison',true)`,
        [gid, acheteur.id, `${d.prenom} ${d.nom}`.slice(0, 200), chiffrer(a.adresse1), chiffrer(a.ville), a.province, chiffrer(a.code_postal), d.telephone]
      );
    }
    if (v.reponses.length) {
      await c.query('INSERT INTO boutique_acheteur_reponses (gestionnaire_id, acheteur_id, reponses) VALUES ($1,$2,$3)', [gid, acheteur.id, JSON.stringify(v.reponses)]);
    }
    await c.query('COMMIT');
    return { statut: 201, acheteur };
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

// Adresse principale de livraison (celle de l'inscription au départ). null si aucune. Le carnet complet : services/boutique_adresses.js
async function adresseDe(gid, acheteurId) {
  const r = await pool.query(`SELECT nom, adresse1, adresse2, ville, province, code_postal, telephone FROM boutique_acheteur_adresses WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND type = 'livraison' ORDER BY est_principale DESC, id LIMIT 1`, [gid, acheteurId]);
  const a = r.rows[0];
  if (!a) return null;
  try {
    return { nom: a.nom, adresse1: dechiffrer(a.adresse1), adresse2: a.adresse2 ? dechiffrer(a.adresse2) : '', ville: dechiffrer(a.ville), province: a.province, code_postal: dechiffrer(a.code_postal), telephone: a.telephone || '' };
  } catch (e) { return null; }
}

module.exports = { DEFAUT, CLES_TEMPLATES, TYPES_CHAMP, fusion, configSite, valider, inscrire, adresseDe, texte };