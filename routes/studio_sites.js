// routes/studio_sites.js
// e-Vend Studio — Routes pour la config des sites des gestionnaires
// Utilisé par ConfigMesPagesSimplisse, ConfigMesPagesPremium, SitePreview, MonDomaine

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');
const renderService = require('../services/renderService');

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
    return res.status(500).json({ success: false, error: err.message });
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
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.domaine_perso = $1
       LIMIT 1`,
      [domaine]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce domaine.' });
    }

    return res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    console.error('GET /studio/sites/domaine-perso/public/:domaine', err);
    return res.status(500).json({ success: false, error: err.message });
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
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.sous_domaine = $1
       LIMIT 1`,
      [slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Aucun site trouvé pour ce sous-domaine.' });
    }

    return res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    console.error('GET /studio/sites/sous-domaine/public/:slug', err);
    return res.status(500).json({ success: false, error: err.message });
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
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/domaine
// Sauvegarde le sous-domaine gratuit ET/OU le domaine personnalisé.
// Si domaine_perso est fourni et nouveau, crée un Custom Hostname Cloudflare.
// =====================================================================
router.put('/:gestionnaireId/domaine', authenticateToken, async (req, res) => {
  const { gestionnaireId } = req.params;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

  if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
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
    const ancienCfId = actuel.rows[0].cf_hostname_id; // réutilisé : stocke maintenant l'ID du domaine Render
    let cfHostnameId = ancienCfId;
    let domaineStatut = null;
    let avertissementRender = null;

    // ── Si le domaine perso a changé, gérer Render ──
    if (domaine_perso && domaine_perso !== ancienDomainePerso) {
      // Retirer l'ancien domaine Render s'il y en avait un
      if (ancienDomainePerso) {
        try {
          await renderService.supprimerDomainePerso(ancienDomainePerso);
        } catch (e) {
          console.warn('Impossible de supprimer l\'ancien domaine Render:', e.message);
        }
      }

      const resultat = await renderService.ajouterDomainePerso(domaine_perso);
      if (resultat.success) {
        cfHostnameId = resultat.domaine?.id || null;
        domaineStatut = 'en_attente';
      } else {
        cfHostnameId = null;
        domaineStatut = 'erreur';
        avertissementRender = `Le domaine a été enregistré, mais la configuration Render a échoué : ${resultat.erreur}`;
      }
    } else if (!domaine_perso && ancienDomainePerso) {
      // Le gestionnaire a retiré son domaine perso
      try {
        await renderService.supprimerDomainePerso(ancienDomainePerso);
      } catch (e) {
        console.warn('Impossible de supprimer le domaine Render retiré:', e.message);
      }
      cfHostnameId = null;
      domaineStatut = null;
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
            type: 'CNAME',
            hote: domaine_perso.startsWith('www.') ? 'www' : '@',
            valeur: 'evend-studio.onrender.com',
            message: `Configurez un enregistrement CNAME pour ${domaine_perso} pointant vers evend-studio.onrender.com`,
          }
        : null,
    });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/domaine', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================================================
// GET /api/studio/sites/:gestionnaireId/domaine/statut
// Vérifie en direct le statut de vérification Render (pour polling UI)
// =====================================================================
router.get('/:gestionnaireId/domaine/statut', authenticateToken, async (req, res) => {
  const { gestionnaireId } = req.params;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

  if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
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
    const resultat = await renderService.obtenirStatutDomaine(domaine_perso);

    if (!resultat.success || !resultat.trouve) {
      return res.json({
        success: true,
        statut: 'erreur',
        message: resultat.erreur || 'Impossible de vérifier le statut sur Render.',
      });
    }

    // Traduction des statuts Render en statuts internes
    const d = resultat.domaine || {};
    const verifie = d.verificationStatus === 'verified';
    const certificatEmis = d.domainType || d.certificate; // selon la forme exacte retournée par l'API

    let statut = 'en_attente';
    let message = 'En attente de vérification DNS. Assurez-vous que le CNAME pointe bien vers evend-studio.onrender.com.';

    if (verifie) {
      statut = 'actif';
      message = 'Domaine actif et sécurisé (SSL valide).';
    }

    // Mettre à jour le statut en BD si actif
    if (statut === 'actif') {
      await pool.query(
        `UPDATE sites SET domaine_statut = $1 WHERE gestionnaire_id = $2`,
        [statut, gestionnaireId]
      );
    }

    return res.json({ success: true, statut, message });
  } catch (err) {
    console.error('GET /studio/sites/:gestionnaireId/domaine/statut', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================================================
// PUT /api/studio/sites/:gestionnaireId/config
// =====================================================================
router.put('/:gestionnaireId/config', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const configPatch = req.body;

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
    return res.status(500).json({ success: false, error: err.message });
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

    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (!template_id) {
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
    return res.status(500).json({ success: false, error: err.message });
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

    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await pool.query(
      'UPDATE sites SET publie = $1, updated_at = NOW() WHERE gestionnaire_id = $2',
      [publie === true, gestionnaireId]
    );

    return res.json({ success: true, publie: publie === true });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/publier', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;