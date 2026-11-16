// CHEMIN : services/boutique_inscription.js
// e-Vend Studio — Inscription des ACHETEURS des templates boutique (solo), configurable par le gestionnaire.
// La config vit dans sites.config.<template>.inscription (onglet « Compte / Inscription » de Config Mes pages).
// Le compte créé est un compte du MV (marketplace_acheteurs) : même connexion, mêmes jetons. Rien du MV n'est modifié.
// Valeurs par défaut identiques à celles de la page de config et du template.

'use strict';

const bcrypt = require('bcrypt');
const pool = require('../db');
const cfgMV = require('./studio_config_mv');

// Clés de config des templates solo (un site n'en utilise qu'une). Ajouter ici chaque nouveau template passé.
const CLES_TEMPLATES = ['premium'];

const TYPES_CHAMP = ['text', 'email', 'tel', 'select', 'textarea', 'checkbox'];

const DEFAUT = {
  titre: 'Créer un compte',
  sousTitre: '',
  boutonTexte: 'Créer mon compte',
  messageSuccesTitre: 'Compte créé avec succès !',
  messageSuccesTexte: 'Vous pouvez maintenant vous connecter.',
  libelles: { prenom: 'Prénom', nom: 'Nom', email: 'Courriel', mot_de_passe: 'Mot de passe', confirmation: 'Confirmez le mot de passe' },
  telephone: { mode: 'cache' },                       // cache | facultatif | obligatoire
  infolettre: { affiche: false, texte: 'Je veux recevoir les nouveautés par courriel' },
  age: { affiche: true, minimum: 16, texte: 'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes: { affiche: true, texte: "J'accepte les termes et conditions de la boutique", url: '' },
  champs: [],
};

function fusion(brut) {
  const b = brut && typeof brut === 'object' ? brut : {};
  const sous = (k) => Object.assign({}, DEFAUT[k], b[k] && typeof b[k] === 'object' ? b[k] : {});
  return Object.assign({}, DEFAUT, b, {
    libelles: sous('libelles'), telephone: sous('telephone'), infolettre: sous('infolettre'), age: sous('age'), termes: sous('termes'),
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
  for (let i = 0; i < CLES_TEMPLATES.length; i++) {
    const t = cfg[CLES_TEMPLATES[i]];
    if (t && typeof t === 'object' && t.inscription) { brut = t.inscription; break; }
  }
  return fusion(brut);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const txt = (v, max) => String(v === undefined || v === null ? '' : v).trim().slice(0, max || 200);

// Valide le corps reçu selon la config. Retourne { erreur } ou { donnees, reponses }.
function valider(cfg, b) {
  const corps = b && typeof b === 'object' ? b : {};
  const L = cfg.libelles;
  const prenom = txt(corps.prenom, 100), nom = txt(corps.nom, 100), email = txt(corps.email, 200); // tel que saisi : le login du MV compare le courriel exactement
  const mdp = String(corps.mot_de_passe || '');
  if (!prenom) return { erreur: `${L.prenom} : obligatoire.` };
  if (!nom) return { erreur: `${L.nom} : obligatoire.` };
  if (!EMAIL.test(email)) return { erreur: 'Adresse courriel invalide.' };
  if (mdp.length < 8) return { erreur: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (mdp.length > 200) return { erreur: 'Mot de passe trop long.' };
  if (mdp !== String(corps.confirmation || '')) return { erreur: 'Les mots de passe ne correspondent pas.' };
  let telephone = null;
  if (cfg.telephone.mode !== 'cache') {
    telephone = txt(corps.telephone, 40) || null;
    if (!telephone && cfg.telephone.mode === 'obligatoire') return { erreur: 'Téléphone : obligatoire.' };
  }
  const infolettre = cfg.infolettre.affiche === true && corps.infolettre === true;
  const reponses = [];
  const saisies = corps.champs && typeof corps.champs === 'object' ? corps.champs : {};
  for (let i = 0; i < cfg.champs.length; i++) {
    const c = cfg.champs[i];
    const etiquette = txt(c.label, 120) || 'Champ';
    let v = saisies[c.id];
    if (c.type === 'checkbox') {
      v = v === true;
      if (c.requis && !v) return { erreur: `${etiquette} : obligatoire.` };
    } else {
      v = txt(v, c.type === 'textarea' ? 2000 : 500);
      if (!v) { if (c.requis) return { erreur: `${etiquette} : obligatoire.` }; v = ''; }
      if (v && c.type === 'email' && !EMAIL.test(v)) return { erreur: `${etiquette} : adresse courriel invalide.` };
      if (v && c.type === 'select' && (c.options || []).indexOf(v) === -1) return { erreur: `${etiquette} : choix invalide.` };
    }
    if (v !== '' && v !== false) reponses.push({ id: String(c.id).slice(0, 80), label: etiquette, valeur: v });
  }
  // Même ordre que la page : champs, puis infolettre, âge, termes
  if (cfg.age.affiche === true && corps.age_confirme !== true) return { erreur: `Vous devez confirmer votre âge (${Number(cfg.age.minimum) || 16} ans ou +).` };
  if (cfg.termes.affiche === true && corps.termes_acceptes !== true) return { erreur: "Vous devez accepter les conditions d'utilisation." };
  return { donnees: { prenom, nom, email, mdp, telephone, infolettre }, reponses };
}

// Crée le compte (même requête que l'inscription du MV) + les réponses aux champs personnalisés
async function inscrire(gid, corps) {
  const cfg = await configSite(gid);
  if (!cfg) return { statut: 404, message: "Cette boutique n'est pas disponible." };
  if (cfgMV.actif(await cfgMV.lire(gid, pool), 'bloquer_inscription_acheteur', false)) {
    return { statut: 403, message: "Les inscriptions d'acheteurs sont fermées sur cette boutique.", ferme: true };
  }
  // Anti-bot (toujours actif) : champ piège vide, délai minimum de 3 s, souris bougée
  if (corps && corps.website) return { statut: 201, acheteur: { id: 0, prenom: '', nom: '', email: '' }, leurre: true };
  if (!corps || !(Number(corps.duree_ms) >= 3000)) return { statut: 400, message: 'Soumission trop rapide. Veuillez prendre le temps de remplir le formulaire.' };
  if (corps.souris !== true) return { statut: 400, message: 'Comportement inhabituel détecté. Veuillez réessayer.' };
  const v = valider(cfg, corps);
  if (v.erreur) return { statut: 400, message: v.erreur };
  const d = v.donnees;
  const existant = await pool.query('SELECT id FROM marketplace_acheteurs WHERE gestionnaire_id = $1 AND email = $2', [gid, d.email]);
  if (existant.rows.length > 0) return { statut: 409, message: 'Un compte existe deja avec ce courriel' };
  const hash = await bcrypt.hash(d.mdp, 10);
  const r = await pool.query(
    `INSERT INTO marketplace_acheteurs (gestionnaire_id, prenom, nom, email, mot_de_passe, telephone, infolettre)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, prenom, nom, email`,
    [gid, d.prenom, d.nom, d.email, hash, d.telephone, d.infolettre]
  );
  const acheteur = r.rows[0];
  if (v.reponses.length) {
    await pool.query('INSERT INTO boutique_acheteur_reponses (gestionnaire_id, acheteur_id, reponses) VALUES ($1,$2,$3)', [gid, acheteur.id, JSON.stringify(v.reponses)]);
  }
  return { statut: 201, acheteur };
}

module.exports = { DEFAUT, CLES_TEMPLATES, TYPES_CHAMP, fusion, configSite, valider, inscrire };