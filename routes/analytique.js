// routes/analytique.js
// e-Vend Studio — Add-on Analytique
// Tracking multi-tenant : chaque visite appartient obligatoirement à UN
// gestionnaire (gestionnaire_id requis). GET /stats ne lit jamais un id
// fourni par le client — toujours req.user.id du token, donc un gestionnaire
// ne peut structurellement pas voir les stats d'un autre.
// Conforme Loi 25 : le frontend (hook useAnalytics) n'appelle POST /visite
// qu'après consentement explicite du visiteur — rien à valider ici côté
// serveur, la route fait confiance à l'appelant comme le reste de l'API publique.

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const geoip   = require('geoip-lite');
const { authenticateToken: verifierToken, isGestionnaire: estGestionnaire } = require('../middleware/auth');

// ── Utilitaires ──────────────────────────────────────────────────────────────

function parseUserAgent(ua = '') {
  let navigateur = 'Autre';
  let os         = 'Autre';
  let device     = 'desktop';

  if (ua.includes('Edg/'))              navigateur = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) navigateur = 'Opera';
  else if (ua.includes('Chrome'))       navigateur = 'Chrome';
  else if (ua.includes('Firefox'))      navigateur = 'Firefox';
  else if (ua.includes('Safari'))       navigateur = 'Safari';

  if (ua.includes('Windows'))           os = 'Windows';
  else if (ua.includes('Mac OS X'))     os = 'macOS';
  else if (ua.includes('Android'))      os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux'))        os = 'Linux';

  if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    device = 'tablet';
  }

  return { navigateur, os, device };
}

function extraireUTM(referent = '') {
  try {
    const url = new URL(referent);
    return {
      utm_source:   url.searchParams.get('utm_source')   || null,
      utm_medium:   url.searchParams.get('utm_medium')   || null,
      utm_campaign: url.searchParams.get('utm_campaign') || null,
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROUTES PUBLIQUES — appelées depuis le site du gestionnaire (visiteur)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/analytique/visite
 * Enregistre une visite de page — appelée par le hook useAnalytics,
 * uniquement après consentement du visiteur (géré côté frontend).
 */
router.post('/visite', async (req, res) => {
  try {
    const {
      gestionnaire_id, session_id, page, titre, referent,
      resolution, langue,
    } = req.body;

    if (!gestionnaire_id || !session_id || !page) {
      return res.status(400).json({ error: 'gestionnaire_id, session_id et page requis' });
    }

    const ua                           = req.headers['user-agent'] || '';
    const { navigateur, os, device }   = parseUserAgent(ua);
    const { utm_source, utm_medium, utm_campaign } = extraireUTM(referent);

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
             || req.socket?.remoteAddress
             || '';
    const geo      = geoip.lookup(ip);
    const pays     = geo?.country  || null;
    const ville    = geo?.city     || null;
    const province = geo?.region   || null; // ex: QC, ON, BC

    const { rows } = await db.query(
      `INSERT INTO visites
        (gestionnaire_id, session_id, page, titre, referent, pays, province, ville, device, navigateur, os,
         resolution, langue, utm_source, utm_medium, utm_campaign)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id`,
      [
        gestionnaire_id, session_id,
        page, titre || null, referent || null,
        pays, province, ville, device, navigateur, os,
        resolution || null, langue || null,
        utm_source, utm_medium, utm_campaign,
      ]
    );

    await db.query(
      `INSERT INTO visites_sessions (session_id, gestionnaire_id, pays, device, derniere_visite, nb_pages)
       VALUES ($1, $2, $3, $4, NOW(), 1)
       ON CONFLICT (session_id, gestionnaire_id) DO UPDATE SET
         derniere_visite = NOW(),
         nb_pages = visites_sessions.nb_pages + 1`,
      [session_id, gestionnaire_id, pays, device]
    );

    res.json({ success: true, visite_id: rows[0].id });
  } catch (err) {
    console.error('POST /analytique/visite:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/analytique/visite/:id/duree
 * Met à jour la durée passée sur une page (appelé au unmount du composant)
 */
router.patch('/visite/:id/duree', async (req, res) => {
  try {
    const { duree_secondes } = req.body;
    const id = parseInt(req.params.id);

    if (!id || duree_secondes === undefined) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    await db.query(
      `UPDATE visites SET duree_secondes = $1 WHERE id = $2`,
      [Math.min(duree_secondes, 86400), id] // max 24h pour éviter les valeurs aberrantes
    );

    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /analytique/visite/:id/duree:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ROUTE GESTIONNAIRE — protégée, toujours scopée sur req.user.id
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/analytique/stats
 * Tableau de bord du gestionnaire connecté — jamais un autre.
 * gestionnaire_id ne vient JAMAIS du client (ni params, ni query, ni body) :
 * uniquement de req.user.id, posé par verifierToken. C'est ce qui garantit
 * qu'un gestionnaire ne peut techniquement pas lire les stats d'un autre.
 */
router.get('/stats', verifierToken, estGestionnaire, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const { periode = '30' } = req.query; // jours
    const jours = Math.min(parseInt(periode) || 30, 365);

    const [
      totaux,
      parJour,
      pagesTop,
      paysTop,
      devices,
      navigateurs,
      referents,
      provincesTop,
    ] = await Promise.all([

      // Totaux globaux — pour CE gestionnaire seulement
      db.query(`
        SELECT
          COUNT(*)                                          AS total_visites,
          COUNT(DISTINCT v.session_id)                      AS visiteurs_uniques,
          ROUND(AVG(v.duree_secondes) FILTER (WHERE v.duree_secondes > 0)) AS duree_moyenne,
          ROUND(AVG(s.nb_pages))                            AS pages_par_session,
          COUNT(DISTINCT v.session_id)
            FILTER (WHERE v.created_at >= NOW() - INTERVAL '24 hours') AS actifs_aujourdhui
        FROM visites v
        LEFT JOIN visites_sessions s
          ON s.session_id = v.session_id AND s.gestionnaire_id = v.gestionnaire_id
        WHERE v.gestionnaire_id = $1
          AND v.created_at >= NOW() - ($2 || ' days')::INTERVAL
      `, [gestionnaireId, jours]),

      // Visites par jour
      db.query(`
        SELECT
          DATE(created_at AT TIME ZONE 'America/Toronto') AS jour,
          COUNT(*)                                         AS visites,
          COUNT(DISTINCT session_id)                       AS visiteurs
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY jour
        ORDER BY jour ASC
      `, [gestionnaireId, jours]),

      // Pages les plus visitées
      db.query(`
        SELECT
          page,
          titre,
          COUNT(*)                                          AS visites,
          COUNT(DISTINCT session_id)                        AS visiteurs_uniques,
          ROUND(AVG(duree_secondes) FILTER (WHERE duree_secondes > 0)) AS duree_moy
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY page, titre
        ORDER BY visites DESC
        LIMIT 500
      `, [gestionnaireId, jours]),

      // Top pays
      db.query(`
        SELECT
          COALESCE(pays, 'Inconnu') AS pays,
          COUNT(*)                  AS visites,
          COUNT(DISTINCT session_id) AS visiteurs
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY pays
        ORDER BY visites DESC
        LIMIT 10
      `, [gestionnaireId, jours]),

      // Répartition devices
      db.query(`
        SELECT device, COUNT(*) AS total
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY device
        ORDER BY total DESC
      `, [gestionnaireId, jours]),

      // Navigateurs
      db.query(`
        SELECT navigateur, COUNT(*) AS total
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY navigateur
        ORDER BY total DESC
        LIMIT 6
      `, [gestionnaireId, jours]),

      // Sources de trafic (référents)
      db.query(`
        SELECT
          CASE
            WHEN referent IS NULL OR referent = '' THEN 'Direct'
            WHEN referent LIKE '%google%'          THEN 'Google'
            WHEN referent LIKE '%facebook%'        THEN 'Facebook'
            WHEN referent LIKE '%instagram%'       THEN 'Instagram'
            WHEN referent LIKE '%tiktok%'          THEN 'TikTok'
            WHEN referent LIKE '%twitter%' OR referent LIKE '%x.com%' THEN 'Twitter/X'
            WHEN referent LIKE '%youtube%'         THEN 'YouTube'
            ELSE 'Autre'
          END AS source,
          COUNT(*) AS visites
        FROM visites
        WHERE gestionnaire_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY source
        ORDER BY visites DESC
      `, [gestionnaireId, jours]),

      // Visites par province canadienne
      db.query(`
        SELECT
          province,
          COUNT(*) AS visites
        FROM visites
        WHERE gestionnaire_id = $1
          AND pays = 'CA'
          AND province IS NOT NULL
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY province
        ORDER BY visites DESC
      `, [gestionnaireId, jours]),
    ]);

    res.json({
      periode: jours,
      totaux: totaux.rows[0],
      parJour: parJour.rows,
      pagesTop: pagesTop.rows,
      paysTop: paysTop.rows,
      devices: devices.rows,
      navigateurs: navigateurs.rows,
      referents: referents.rows,
      provincesTop: provincesTop.rows,
    });
  } catch (err) {
    console.error('GET /analytique/stats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;