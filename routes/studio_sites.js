// CHEMIN : routes/studio_sites.js
// e-Vend Studio — Routes pour la config des sites des gestionnaires
// Utilisé par ConfigMesPagesSimplisse, ConfigMesPagesPremium, SitePreview, MonDomaine

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, estProprietaireOuAdmin } = require('../middleware/auth');
const { nettoyerTexte } = require('../utils/sanitize');
const domainePerso = require('../services/studio_domaine_perso');   // VPS + Caddy (ancien hébergement Render retiré)

// =====================================================================
// 🌐 GESTION DE DOMAINE — constantes & utilitaires
// =====================================================================

// Sous-domaines réservés (ne peuvent pas être choisis par un gestionnaire)
const SOUS_DOMAINES_RESERVES = [
  'www', 'api', 'admin', 'mail', 'ftp', 'blog', 'app', 'staging', 'test',
  'dashboard', 'sites', 'cdn', 'assets', 'static', 'support', 'help',
  'shop', 'store', 'evend', 'evendstudio', 'studio', 'login', 'signup',
];

// Format valide : lettres minuscules, chiffres, tirets — 1 seul niveau
const REGEX_SOUS_DOMAINE = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;

function validerFormatSousDomaine(slug) {
  if (!slug) return { valide: false, erreur: 'Le sous-domaine est requis.' };
  if (slug.length < 3) return { valide: false, erreur: 'Minimum 3 caractères.' };
  if (slug.length > 30) return { valide: false, erreur: 'Maximum 30 caractères.' };
  if (!REGEX_SOUS_DOMAINE.test(slug)) {
    return {
      valide: false,
      erreur: 'Seulement lettres minuscules, chiffres et tirets (pas au début/fin, pas de point).',
    };
  }
  if (SOUS_DOMAINES_RESERVES.includes(slug)) {
    return { valide: false, erreur: 'Ce sous-domaine est réservé.' };
  }
  return { valide: true };
}

// Format simple pour un domaine perso (ex: monsite.com, www.monsite.com)
const REGEX_DOMAINE_PERSO = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function validerFormatDomainePerso(domaine) {
  if (!domaine) return { valide: true }; // optionnel
  const d = domaine.trim().toLowerCase();
  if (!REGEX_DOMAINE_PERSO.test(d)) {
    return { valide: false, erreur: 'Format de domaine invalide (ex: www.mondomaine.com).' };
  }
  // Un CNAME ne peut pas être posé sur un domaine racine (limitation DNS standard).
  // On exige donc le préfixe www (le gestionnaire peut rediriger la racine chez son registraire).
  if (!d.startsWith('www.')) {
    return {
      valide: false,
      erreur: 'Le domaine doit commencer par "www." (ex: www.mondomaine.com). Configurez une redirection pour le domaine sans www chez votre fournisseur.',
    };
  }
  return { valide: true };
}

// Mode maintenance : réglé soit dans Config générale (Avancé) du site, soit dans Config marketplace → Généralité (multi-vendeur),
// soit imposé par l'admin (statut « en_maintenance »). Le message du gestionnaire passe en priorité.
// Valide une couleur #RRGGBB (sinon valeur par défaut)
function couleurSure(v, defaut) {
  return (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())) ? v.trim() : defaut;
}
// Accepte seulement une URL http(s) ou un chemin relatif /uploads... (jamais javascript:, data:, etc.)
function urlImageSure(v) {
  if (typeof v !== 'string') return '';
  const u = v.trim().slice(0, 1000);
  if (/^https?:\/\//i.test(u) || /^\/[^/\\]/.test(u)) return u;
  return '';
}
// Page de maintenance personnalisée (assainie) — stockée dans config.generale.maintenance_page
function pageMaintenanceSure(cfg, messageFallback) {
  const p = (cfg && cfg.generale && cfg.generale.maintenance_page) || {};
  return {
    titre: nettoyerTexte(p.titre || '', 120),
    message: nettoyerTexte(p.message || messageFallback || '', 1000),
    image_url: urlImageSure(p.image_url),
    couleur_fond: couleurSure(p.couleur_fond, '#0f172a'),
    couleur_texte: couleurSure(p.couleur_texte, '#ffffff'),
    couleur_accent: couleurSure(p.couleur_accent, '#f59e0b'),
    barre: p.barre !== false,
  };
}

// Mode maintenance : réglé soit dans « Page maintenance » (gestionnaire), soit dans Config marketplace → Généralité (multi-vendeur),
// soit imposé par l'admin (statut « en_maintenance »). Le message du gestionnaire passe en priorité.
function etatMaintenance(row) {
  const cfg = row.config || {};
  const gen = cfg.generale?.mode_maintenance === true;
  const mv = cfg.multivendeur?.mode_maintenance === true;
  const imposee = row.gestionnaire_statut === 'en_maintenance';
  const message = gen
    ? (cfg.generale?.message_maintenance || null)
    : (mv ? (String(cfg.multivendeur?.message_maintenance || '').trim() || null) : null);
  return {
    maintenance: gen || mv || imposee,
    message,
    imposee_admin: imposee,
    page: pageMaintenanceSure(cfg, message),
  };
}

// =====================================================================
// GET /api/studio/sites/sousdomaine/verifier/:slug
// Vérification en temps réel (pour l'UI pendant que le gestionnaire tape)
// Publique (pas de données sensibles exposées), exclut optionnellement
// le gestionnaire courant via ?exclude=<gestionnaireId>
//
// ⚠️ IMPORTANT : cette route DOIT rester déclarée AVANT la route générique
// GET /:gestionnaireId ci-dessous, sinon Express interprète "sousdomaine"
// comme une valeur de :gestionnaireId.
// =====================================================================
router.get('/sousdomaine/verifier/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    const exclude = req.query.exclude ? String(req.query.exclude) : null;

    const format = validerFormatSousDomaine(slug);
    if (!format.valide) {
      return res.json({ success: true, disponible: false, raison: format.erreur });
    }

    const existant = await pool.query(
      `SELECT gestionnaire_id FROM sites WHERE sous_domaine = $1 LIMIT 1`,
      [slug]
    );

    const pris = existant.rows.length > 0 && String(existant.rows[0].gestionnaire_id) !== exclude;

    if (pris) {
      return res.json({ success: true, disponible: false, raison: 'Ce sous-domaine est déjà utilisé.' });
    }

    return res.json({ success: true, disponible: true });
  } catch (err) {
    console.error('GET /studio/sites/sousdomaine/verifier/:slug', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// GET /api/studio/sites/domaine-perso/public/:domaine
// Route PUBLIQUE (aucune auth) — utilisée par le frontend pour afficher
// le site correspondant quand un visiteur arrive sur un domaine personnalisé
// externe (ex: www.idee-cadeau.ca), en plus de la route sous-domaine.
// =====================================================================
router.get('/domaine-perso/public/:domaine', async (req, res) => {
  try {
    const domaine = decodeURIComponent(req.params.domaine || '').toLowerCase().trim();

    const result = await pool.query(
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie, s.site_suspendu_email,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description, g.statut AS gestionnaire_statut,
              d.statut AS domaine_statut
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       LEFT JOIN domaines d ON d.domaine = s.domaine_perso
       WHERE s.domaine_perso = $1
       LIMIT 1`,
      [domaine]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce domaine.' });
    }

    // Un gestionnaire suspendu ou banni par un administrateur : le site
    // n'existe tout simplement plus publiquement, comme s'il n'avait jamais
    // été créé — pas de page spéciale, juste 404.
    if (['suspendu', 'banni'].includes(result.rows[0].gestionnaire_statut)) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce domaine.' });
    }

    // Un domaine suspendu par un administrateur (ex: non-renouvellement,
    // litige) ne doit plus servir le site — même si le sous-domaine gratuit
    // reste, lui, toujours accessible séparément.
    if (result.rows[0].domaine_statut === 'suspendu') {
      return res.status(403).json({
        success: false,
        suspendu: true,
        message: 'Ce domaine a été suspendu. Le site n\'est pas accessible via ce nom de domaine pour le moment.',
      });
    }

    const etatMaint = etatMaintenance(result.rows[0]);

    return res.json({
      success: true,
      ...result.rows[0],
      site_suspendu: result.rows[0].site_suspendu_email === true,
      maintenance: etatMaint.maintenance,
      message_maintenance: etatMaint.message,
      page_maintenance: etatMaint.page,
    });
  } catch (err) {
    console.error('GET /studio/sites/domaine-perso/public/:domaine', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// GET /api/studio/sites/sous-domaine/public/:slug
// Route PUBLIQUE (aucune auth) — utilisée par le frontend pour afficher
// le site correspondant quand un visiteur arrive sur xxx.e-vendstudio.ca
//
// ⚠️ IMPORTANT : cette route DOIT rester déclarée AVANT la route générique
// GET /:gestionnaireId ci-dessous, sinon Express interprète "sous-domaine"
// comme une valeur de :gestionnaireId.
// =====================================================================
router.get('/sous-domaine/public/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();

    const result = await pool.query(
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie, s.site_suspendu_email,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description, g.statut AS gestionnaire_statut
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.sous_domaine = $1
       LIMIT 1`,
      [slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce sous-domaine.' });
    }

    if (['suspendu', 'banni'].includes(result.rows[0].gestionnaire_statut)) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce sous-domaine.' });
    }

    const etatMaint = etatMaintenance(result.rows[0]);

    return res.json({
      success: true,
      ...result.rows[0],
      site_suspendu: result.rows[0].site_suspendu_email === true,
      maintenance: etatMaint.maintenance,
      message_maintenance: etatMaint.message,
      page_maintenance: etatMaint.page,
    });
  } catch (err) {
    console.error('GET /studio/sites/sous-domaine/public/:slug', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// GET /api/studio/sites/:gestionnaireId
// =====================================================================
router.get('/:gestionnaireId', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie,
              s.sous_domaine, s.domaine_perso, s.domaine_statut,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.gestionnaire_id = $1
       LIMIT 1`,
      [gestionnaireId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /studio/sites/:gestionnaireId', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/domaine
// Sauvegarde le sous-domaine gratuit ET/OU le domaine personnalisé.
// Domaine perso : hébergé sur le VPS (Caddy). Voir services/studio_domaine_perso.js.
// =====================================================================
router.put('/:gestionnaireId/domaine', authenticateToken, async (req, res) => {
  const { gestionnaireId } = req.params;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

  if (!estProprietaireOuAdmin(req, gestionnaireId)) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  try {
    let { sous_domaine, domaine_perso } = req.body;

    sous_domaine = (sous_domaine || '').toLowerCase().trim();
    domaine_perso = (domaine_perso || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // ── Validation du sous-domaine (si fourni) ──
    if (sous_domaine) {
      const format = validerFormatSousDomaine(sous_domaine);
      if (!format.valide) {
        return res.status(400).json({ success: false, message: format.erreur, champ: 'sous_domaine' });
      }

      const existant = await pool.query(
        `SELECT gestionnaire_id FROM sites WHERE sous_domaine = $1 LIMIT 1`,
        [sous_domaine]
      );
      if (existant.rows.length && String(existant.rows[0].gestionnaire_id) !== String(gestionnaireId)) {
        return res.status(409).json({
          success: false,
          message: 'Ce sous-domaine est déjà utilisé par une autre boutique.',
          champ: 'sous_domaine',
        });
      }
    }

    // ── Validation du domaine perso (si fourni) ──
    if (domaine_perso) {
      const format = validerFormatDomainePerso(domaine_perso);
      if (!format.valide) {
        return res.status(400).json({ success: false, message: format.erreur, champ: 'domaine_perso' });
      }
    }

    // ── Récupérer l'état actuel pour savoir si domaine_perso a changé ──
    const actuel = await pool.query(
      `SELECT domaine_perso, cf_hostname_id FROM sites WHERE gestionnaire_id = $1 LIMIT 1`,
      [gestionnaireId]
    );
    if (!actuel.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    const ancienDomainePerso = actuel.rows[0].domaine_perso;
    // Hébergement sur le VPS : rien à créer chez un fournisseur. Caddy émet le certificat à la première visite
    // (autorisé par /caddy/ask tant que le domaine est enregistré ici). On remet le statut à « en attente » si le domaine change.
    const cfHostnameId = null;
    let domaineStatut = null;
    let avertissementRender = null;

    if (domaine_perso) {
      if (domaine_perso !== ancienDomainePerso) {
        const conflit = await pool.query(
          `SELECT 1 FROM sites WHERE domaine_perso = $1 AND gestionnaire_id <> $2 LIMIT 1`, [domaine_perso, gestionnaireId]);
        if (conflit.rows.length) {
          return res.status(409).json({ success: false, message: 'Ce domaine est déjà connecté à une autre boutique.', champ: 'domaine_perso' });
        }
        domaineStatut = 'en_attente';
      } else {
        const st = await pool.query(`SELECT domaine_statut FROM sites WHERE gestionnaire_id = $1`, [gestionnaireId]);
        domaineStatut = st.rows[0]?.domaine_statut || 'en_attente';
      }
    }

    await pool.query(
      `UPDATE sites
       SET sous_domaine = NULLIF($1, ''),
           domaine_perso = NULLIF($2, ''),
           cf_hostname_id = $3,
           domaine_statut = $4,
           updated_at = NOW()
       WHERE gestionnaire_id = $5`,
      [sous_domaine, domaine_perso, cfHostnameId, domaineStatut, gestionnaireId]
    );

    return res.json({
      success: true,
      sous_domaine: sous_domaine || null,
      domaine_perso: domaine_perso || null,
      domaine_statut: domaineStatut,
      avertissement: avertissementRender,
      instructions: domaine_perso
        ? {
            type: 'A',
            hote: domaine_perso.startsWith('www.') ? 'www' : '@',
            valeur: domainePerso.IP_VPS,
            message: `Chez votre fournisseur de domaine, ajoutez un enregistrement A pour ${domaine_perso} qui pointe vers ${domainePerso.IP_VPS}.`,
          }
        : null,
    });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/domaine', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// GET /api/studio/sites/:gestionnaireId/domaine/statut
// Vérifie en direct le DNS + le certificat SSL du domaine (pour polling UI)
// =====================================================================
router.get('/:gestionnaireId/domaine/statut', authenticateToken, async (req, res) => {
  const { gestionnaireId } = req.params;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

  if (!estProprietaireOuAdmin(req, gestionnaireId)) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  try {
    const result = await pool.query(
      `SELECT domaine_perso FROM sites WHERE gestionnaire_id = $1 LIMIT 1`,
      [gestionnaireId]
    );

    if (!result.rows.length || !result.rows[0].domaine_perso) {
      return res.json({ success: true, statut: 'aucun', message: 'Aucun domaine personnalisé configuré.' });
    }

    const { domaine_perso } = result.rows[0];
    const { statut, message } = await domainePerso.verifierDomaine(domaine_perso);

    // Mémoriser le statut en BD (sauf si l'admin a suspendu le domaine)
    await pool.query(
      `UPDATE sites SET domaine_statut = $1 WHERE gestionnaire_id = $2 AND domaine_statut IS DISTINCT FROM 'suspendu'`,
      [statut, gestionnaireId]
    );

    return res.json({ success: true, statut, message });
  } catch (err) {
    console.error('GET /studio/sites/:gestionnaireId/domaine/statut', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/config
// =====================================================================
router.put('/:gestionnaireId/config', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!estProprietaireOuAdmin(req, gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    // 🔒 Le corps doit être un objet (sinon « {...configActuelle, ...'abc'} » écrivait les lettres comme clés)
    const configPatch = req.body;
    if (!configPatch || typeof configPatch !== 'object' || Array.isArray(configPatch)) {
      return res.status(400).json({ success: false, message: 'Configuration invalide.' });
    }

    const existing = await pool.query(
      'SELECT config FROM sites WHERE gestionnaire_id = $1 LIMIT 1',
      [gestionnaireId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    const configActuelle = existing.rows[0].config || {};
    const nouvelleConfig = { ...configActuelle, ...configPatch };

    await pool.query(
      `UPDATE sites SET config = $1, updated_at = NOW()
       WHERE gestionnaire_id = $2`,
      [JSON.stringify(nouvelleConfig), gestionnaireId]
    );

    console.log(`✅ Config site mis à jour — gestionnaire ${gestionnaireId}`);
    return res.json({ success: true, config: nouvelleConfig });

  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/config', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// GET /api/studio/sites/:gestionnaireId/maintenance
// État réel de la maintenance + contenu enregistré de la page (pour le tableau de bord
// et la page « Page maintenance »).
// ⚠️ Le GET /api/studio/sites/:id de server.js passe avant ce router : c'est pourquoi l'état
// de maintenance a sa propre route (2 segments, jamais interceptée par server.js).
// =====================================================================
router.get('/:gestionnaireId/maintenance', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    if (!estProprietaireOuAdmin(req, gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    const r = await pool.query(
      `SELECT s.config, s.sous_domaine, s.domaine_perso,
              g.nom_boutique, g.statut AS gestionnaire_statut
       FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.gestionnaire_id = $1 LIMIT 1`,
      [gestionnaireId]
    );
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    const row = r.rows[0];
    const cfg = row.config || {};
    const etat = etatMaintenance(row);
    return res.json({
      success: true,
      maintenance: etat.maintenance,
      maintenance_imposee_admin: etat.imposee_admin,
      generale_actif: cfg.generale?.mode_maintenance === true,
      nom_boutique: row.nom_boutique || '',
      adresse: row.domaine_perso || (row.sous_domaine ? `${row.sous_domaine}.e-vendstudio.ca` : null),
      page: pageMaintenanceSure(cfg, cfg.generale?.message_maintenance || null),
    });
  } catch (err) {
    console.error('GET /studio/sites/:gestionnaireId/maintenance', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/maintenance
// Active/désactive la maintenance du site et/ou enregistre la page de maintenance.
// Fusion côté serveur dans config.generale (mode_maintenance, message_maintenance, maintenance_page).
// Corps : { actif?: boolean, titre?, message?, image_url?, couleur_fond?, couleur_texte?, couleur_accent?, barre? }
// =====================================================================
router.put('/:gestionnaireId/maintenance', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    if (!estProprietaireOuAdmin(req, gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    const b = req.body;
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
      return res.status(400).json({ success: false, message: 'Données invalides.' });
    }

    const existing = await pool.query(
      `SELECT s.config, g.statut AS gestionnaire_statut
       FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.gestionnaire_id = $1 LIMIT 1`,
      [gestionnaireId]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    const config = existing.rows[0].config || {};
    const gen = { ...(config.generale || {}) };
    const page = { ...(gen.maintenance_page || {}) };

    if (typeof b.actif === 'boolean') gen.mode_maintenance = b.actif;

    const aContenu = ['titre', 'message', 'image_url', 'couleur_fond', 'couleur_texte', 'couleur_accent', 'barre']
      .some(k => k in b);
    if (aContenu) {
      if ('titre' in b)          page.titre = nettoyerTexte(b.titre || '', 120);
      if ('message' in b)        page.message = nettoyerTexte(b.message || '', 1000);
      if ('image_url' in b)      page.image_url = urlImageSure(b.image_url);
      if ('couleur_fond' in b)   page.couleur_fond = couleurSure(b.couleur_fond, '#0f172a');
      if ('couleur_texte' in b)  page.couleur_texte = couleurSure(b.couleur_texte, '#ffffff');
      if ('couleur_accent' in b) page.couleur_accent = couleurSure(b.couleur_accent, '#f59e0b');
      if ('barre' in b)          page.barre = b.barre !== false;
      gen.maintenance_page = page;
      // Garde l'ancien champ en phase (utilisé par la config générale et l'ancien affichage)
      gen.message_maintenance = page.message || '';
    }

    const nouvelleConfig = { ...config, generale: gen };
    await pool.query(
      `UPDATE sites SET config = $1, updated_at = NOW() WHERE gestionnaire_id = $2`,
      [JSON.stringify(nouvelleConfig), gestionnaireId]
    );

    const etat = etatMaintenance({ config: nouvelleConfig, gestionnaire_statut: existing.rows[0].gestionnaire_statut });
    return res.json({
      success: true,
      maintenance: etat.maintenance,
      maintenance_imposee_admin: etat.imposee_admin,
      generale_actif: gen.mode_maintenance === true,
      page: etat.page,
    });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/maintenance', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/template
// =====================================================================
router.put('/:gestionnaireId/template', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { template_id } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!estProprietaireOuAdmin(req, gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (typeof template_id !== 'string' || !template_id.trim() || template_id.length > 100) {
      return res.status(400).json({ success: false, message: 'template_id requis.' });
    }

    await pool.query(
      `UPDATE sites SET template_id = $1, updated_at = NOW()
       WHERE gestionnaire_id = $2`,
      [template_id, gestionnaireId]
    );

    return res.json({ success: true, template_id });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/template', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/publier
// =====================================================================
router.put('/:gestionnaireId/publier', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { publie } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!estProprietaireOuAdmin(req, gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await pool.query(
      'UPDATE sites SET publie = $1, updated_at = NOW() WHERE gestionnaire_id = $2',
      [publie === true, gestionnaireId]
    );

    return res.json({ success: true, publie: publie === true });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/publier', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;