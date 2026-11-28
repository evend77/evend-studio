// CHEMIN : services/vitrines_addons.js
// e-Vend Studio — Add-ons des sites VITRINE : système PARALLÈLE au multi-vendeur et aux boutiques.
//   • Catalogue et prix : table vitrines_addons (prix réglés dans l'admin : Templates → « Vitrines (add-ons) »).
//   • Activation : colonnes existantes de options_gestionnaire (déjà lues par les sites et les pages de configuration).
//   • Pas de forfaits à paliers. Facturation Stripe : plus tard — on enregistre seulement les choix.

'use strict';

const pool = require('../db');

class ErreurAddon extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// code → colonne de options_gestionnaire. Liste FERMÉE : seule source des noms de colonnes insérés en SQL.
const COLONNES = {
  cacher_propulse: 'cacher_propulse',
  verificateur_age: 'verificateur_age',
  popup_annonce: 'popup_annonce',
  reservation_ecole: 'reservation_ecole',
  abonnement_ecole: 'abonnement_ecole',
  pub_sponsor: 'pub_sponsor',
  analytique: 'analytique',
  chatbot: 'chatbot',
  favicon_vitrine: 'favicon_vitrine',
  pwa_vitrine: 'pwa_vitrine',
  effets_vitrine: 'effets_vitrine',
};

// Valeurs de départ (reprises de BrandingEtOptions.tsx), insérées UNE seule fois. Ensuite la BD fait foi.
// [code, nom, description, emoji, categorie, prix_ht, revenu_partage, guide_url, ordre]
const DEPART = [
  ['cacher_propulse', 'Cacher le branding', 'Retirez le badge "Propulsé par e-Vend Studio" du pied de page de votre site.', '🏷️', 'Branding', 2, false, '', 1],
  ['popup_annonce', 'Popup Annonce', 'Popup ou bannière configurable — promo, événement, fermeture. 3 formats, dates de début/fin.', '📢', 'Marketing & Promotions', 3, false, '', 2],
  ['verificateur_age', "Vérificateur d'âge", "Popup de vérification d'âge — 3 modes, écran de blocage si refus, entièrement personnalisable.", '🔞', 'Sécurité & Conformité', 5, false, '', 3],
  ['reservation_ecole', 'Réservation — École/Cours', 'Créneaux de cours avec capacité, suivi des places en direct — Salle, Professeur, Niveau.', '📅', 'Réservations', 5, false, '', 4],
  ['abonnement_ecole', 'Abonnement — École/Cours', "Forfaits récurrents (hebdomadaire, mensuel, annuel) — vos clients s'abonnent directement sur votre site.", '💳', 'Abonnements', 5, false, '', 5],
  ['pub_sponsor', 'Espace Sponsors', "Affichez des publicités de commanditaires e-Vend sur votre site et touchez une part des revenus générés — vous gardez le contrôle : bloquez n'importe quelle pub ou sponsor en un clic.", '⭐', 'Publicité & Revenus', 0, true, 'https://www.e-vendstudio.ca/documents/guide-add-on-espace-sponsors', 6],
  ['analytique', 'Analytique', 'Suivez le trafic de votre site — visites, pages consultées, provenance géographique, appareils et sources de trafic. Respecte le consentement cookie de vos visiteurs (conforme Loi 25).', '📈', 'Statistiques', 5, false, 'https://www.e-vendstudio.ca/documents/guide-add-on-analytique', 7],
  ['chatbot', 'Chat bot', 'Un assistant virtuel sur votre site qui répond automatiquement aux questions de vos visiteurs — à partir de vos pages, produits et articles de blogue, ou de réponses que vous configurez vous-même. Sans intelligence artificielle : aucune donnée envoyée à un tiers.', '💬', 'Support & Communication', 5, false, 'https://www.e-vendstudio.ca/documents/guide-add-on-chat-bot', 8],
  ['favicon_vitrine', 'Favicon personnalisé', "La petite icône de votre site dans l'onglet du navigateur, avec une animation d'onglet pour faire revenir vos visiteurs.", '🖼️', 'Branding', 3, false, '', 9],
  ['pwa_vitrine', 'App installable (PWA)', 'Vos visiteurs installent votre site sur leur téléphone comme une vraie app : votre nom, vos couleurs et votre icône.', '📲', 'Branding', 10, false, '', 10],
  ['effets_vitrine', 'Effets de boutique', 'Décorations de saison (neige, traîneau, Halloween…), effets de vente (Vendredi noir, rubans, drapeaux…) et musique de fond sur votre site.', '🎃', 'Marketing & Promotions', 10, false, '', 11],
];

let _pret = null;
function pret() {
  if (!_pret) {
    _pret = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrines_addons (
        code TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        emoji TEXT NOT NULL DEFAULT '🧩',
        categorie TEXT NOT NULL DEFAULT 'Autres',
        prix_ht NUMERIC(8,2) NOT NULL DEFAULT 0,
        revenu_partage BOOLEAN NOT NULL DEFAULT false,
        guide_url TEXT NOT NULL DEFAULT '',
        ordre INTEGER NOT NULL DEFAULT 0,
        actif BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      // Colonnes d'activation propres aux vitrines (les autres existent déjà)
      await pool.query(`ALTER TABLE options_gestionnaire
        ADD COLUMN IF NOT EXISTS favicon_vitrine BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS pwa_vitrine BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS effets_vitrine BOOLEAN NOT NULL DEFAULT false`);
      for (const a of DEPART) {
        await pool.query(
          `INSERT INTO vitrines_addons (code, nom, description, emoji, categorie, prix_ht, revenu_partage, guide_url, ordre)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (code) DO NOTHING`, a);
      }
    })().catch((e) => { _pret = null; throw e; });
  }
  return _pret;
}

function formater(r) {
  return {
    code: r.code,
    nom: r.nom,
    description: r.description,
    emoji: r.emoji,
    categorie: r.categorie,
    prix_ht: parseFloat(r.prix_ht) || 0,
    revenu_partage: r.revenu_partage === true,
    guide_url: r.guide_url,
    actif: r.actif === true,
  };
}

async function catalogue() {
  await pret();
  const r = await pool.query('SELECT * FROM vitrines_addons ORDER BY ordre, code');
  return r.rows.map(formater).filter((a) => Object.prototype.hasOwnProperty.call(COLONNES, a.code));
}

/** Add-ons vus par un gestionnaire. Un add-on retiré par l'admin reste visible pour ceux qui l'ont (pour pouvoir le désactiver). */
async function etat(gid) {
  const cat = await catalogue();   // d'abord : garantit que les colonnes existent
  const o = await pool.query('SELECT * FROM options_gestionnaire WHERE gestionnaire_id = $1 LIMIT 1', [gid]);
  const row = o.rows[0] || {};
  const addons = cat
    .map((a) => ({ ...a, achete: row[COLONNES[a.code]] === true }))
    .filter((a) => a.actif || a.achete);
  const total = addons.reduce((s, a) => s + (a.achete && !a.revenu_partage ? a.prix_ht : 0), 0);
  return { addons, total_ht: Math.round(total * 100) / 100 };
}

async function poser(gid, code, valeur) {
  const col = COLONNES[code];
  await pool.query(
    `INSERT INTO options_gestionnaire (gestionnaire_id, ${col}) VALUES ($1, $2)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET ${col} = $2, updated_at = NOW()`, [gid, valeur]);
}

function verifierCode(code) {
  if (!Object.prototype.hasOwnProperty.call(COLONNES, code)) throw new ErreurAddon('Add-on introuvable.', 404);
}

async function activer(gid, code) {
  verifierCode(code);
  const a = (await catalogue()).find((x) => x.code === code);
  if (!a || !a.actif) throw new ErreurAddon("Cet add-on n'est pas offert pour le moment.", 404);
  await poser(gid, code, true);
}

async function desactiver(gid, code) {
  verifierCode(code);
  await poser(gid, code, false);
}

/** ADMIN : change le prix et/ou l'offre d'un add-on. */
async function modifier(code, b) {
  verifierCode(code);
  const a = (await catalogue()).find((x) => x.code === code);
  if (!a) throw new ErreurAddon('Add-on introuvable.', 404);
  b = b || {};
  let prix = a.prix_ht;
  if (b.prix_ht !== undefined && !a.revenu_partage) {
    const brut = String(b.prix_ht).trim().replace(',', '.');
    const n = brut === '' ? NaN : Number(brut);
    if (!Number.isFinite(n) || n < 0 || n > 5000) throw new ErreurAddon('Prix invalide (entre 0 $ et 5000 $).');
    prix = Math.round(n * 100) / 100;
  }
  const actif = typeof b.actif === 'boolean' ? b.actif : a.actif;
  await pool.query('UPDATE vitrines_addons SET prix_ht = $2, actif = $3, updated_at = NOW() WHERE code = $1', [code, prix, actif]);
}

/** true si le gestionnaire a activé l'add-on `code`. */
async function actif(gid, code) {
  verifierCode(code);
  await pret();
  const r = await pool.query(`SELECT ${COLONNES[code]} AS v FROM options_gestionnaire WHERE gestionnaire_id = $1 LIMIT 1`, [gid]);
  return !!r.rows[0] && r.rows[0].v === true;
}

module.exports = { actif, ErreurAddon, COLONNES, pret, catalogue, etat, activer, desactiver, modifier };