// routes/reservations.js
// e-Vend Studio — Gestion des réservations et disponibilités

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── Envoi email AWS SES ───────────────────────────────────────────────────────
async function envoyerEmailConfirmation(reservation, configSite) {
  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    const dateDebut = new Date(reservation.date_debut).toLocaleString('fr-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const couleur = configSite?.couleurPrincipale || '#c9a96e';
    const nomSite = configSite?.nomEntreprise || 'Notre service';

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#f4f4f2; font-family:'Segoe UI',Arial,sans-serif; padding:32px 16px; }
.wrap { max-width:600px; margin:0 auto; }
.hdr { background:${couleur}; border-radius:12px 12px 0 0; padding:24px 32px; }
.hdr h1 { color:#fff; font-size:20px; font-weight:800; }
.hdr p { color:rgba(255,255,255,0.8); font-size:12px; margin-top:4px; }
.body { background:#fff; padding:32px; border:1px solid #e5e7eb; border-top:none; }
.check { text-align:center; margin-bottom:24px; }
.check-icon { font-size:56px; }
.check h2 { font-size:22px; font-weight:800; color:#1a1a1a; margin-top:12px; }
.check p { font-size:14px; color:#6b7280; margin-top:6px; }
.box { background:#f8f8f6; border-left:4px solid ${couleur}; border-radius:0 8px 8px 0; padding:16px 20px; margin:24px 0; }
.row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f0f0f0; font-size:13px; }
.row:last-child { border-bottom:none; }
.lbl { color:#6b7280; } .val { font-weight:700; color:#1a1a1a; }
.ftr { background:#f8f8f6; border-radius:0 0 12px 12px; border:1px solid #e5e7eb; border-top:none; padding:18px 32px; text-align:center; }
.ftr p { font-size:11px; color:#aaa; line-height:1.6; }
.badge { display:inline-block; background:${couleur}20; color:${couleur}; border:1px solid ${couleur}40; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:700; margin-top:16px; }
</style></head>
<body><div class="wrap">
<div class="hdr"><h1>${nomSite}</h1><p>Propulsé par e-Vend Studio</p></div>
<div class="body">
  <div class="check">
    <div class="check-icon">✅</div>
    <h2>Réservation confirmée!</h2>
    <p>Voici le récapitulatif de votre réservation.</p>
  </div>
  <div class="box">
    <div class="row"><span class="lbl">Nom</span><span class="val">${reservation.nom_client}</span></div>
    <div class="row"><span class="lbl">Date</span><span class="val">${dateDebut}</span></div>
    ${reservation.nb_personnes ? `<div class="row"><span class="lbl">Personnes</span><span class="val">${reservation.nb_personnes}</span></div>` : ''}
    ${reservation.objet_reserve ? `<div class="row"><span class="lbl">Réservation</span><span class="val">${reservation.objet_reserve}</span></div>` : ''}
    ${reservation.notes ? `<div class="row"><span class="lbl">Notes</span><span class="val">${reservation.notes}</span></div>` : ''}
    <div class="row"><span class="lbl">Statut</span><span class="val">✅ Confirmé</span></div>
  </div>
  <div class="badge">Numéro de réservation : #${reservation.id}</div>
</div>
<div class="ftr"><p>${nomSite} — Propulsé par e-Vend Studio<br>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p></div>
</div></body></html>`;

    // Email au client
    await ses.send(new SendEmailCommand({
      Destination: { ToAddresses: [reservation.email_client] },
      Message: {
        Subject: { Data: `✅ Réservation confirmée — ${nomSite}`, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
    }));

    // Email au vendeur (notification)
    if (configSite?.gestionnaireEmail) {
      const htmlVendeur = `<div style="font-family:sans-serif;padding:24px">
        <h2>🔔 Nouvelle réservation reçue</h2>
        <p><strong>Client:</strong> ${reservation.nom_client} (${reservation.email_client})</p>
        <p><strong>Date:</strong> ${dateDebut}</p>
        <p><strong>Personnes:</strong> ${reservation.nb_personnes || 1}</p>
        ${reservation.notes ? `<p><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
      </div>`;
      await ses.send(new SendEmailCommand({
        Destination: { ToAddresses: [configSite.gestionnaireEmail] },
        Message: {
          Subject: { Data: `🔔 Nouvelle réservation — ${reservation.nom_client}`, Charset: 'UTF-8' },
          Body: { Html: { Data: htmlVendeur, Charset: 'UTF-8' } }
        },
        Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
      }));
    }

    console.log(`✅ Emails envoyés pour réservation #${reservation.id}`);
  } catch (err) {
    console.error('❌ Erreur envoi email réservation:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES (clients qui réservent)
// ═══════════════════════════════════════════════════════════════

// GET /api/reservations/disponibilites/:siteId
// Retourne les créneaux disponibles + réservations existantes
router.get('/disponibilites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { debut, fin } = req.query;

    const [dispos, reservations] = await Promise.all([
      pool.query(
        `SELECT * FROM disponibilites 
         WHERE site_id = $1 AND actif = true
         AND date_debut >= COALESCE($2::timestamp, NOW())
         AND date_fin <= COALESCE($3::timestamp, NOW() + INTERVAL '3 months')
         ORDER BY date_debut ASC`,
        [siteId, debut || null, fin || null]
      ),
      pool.query(
        `SELECT date_debut, date_fin, nb_personnes, statut
         FROM reservations
         WHERE site_id = $1 AND statut != 'annulee'
         AND date_debut >= COALESCE($2::timestamp, NOW())
         ORDER BY date_debut ASC`,
        [siteId, debut || null]
      )
    ]);

    res.json({
      disponibilites: dispos.rows,
      reservations:   reservations.rows,
    });
  } catch (err) {
    console.error('GET disponibilites:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/reservations
// Créer une réservation (public — client)
router.post('/', async (req, res) => {
  const {
    site_id, nom_client, email_client, telephone,
    date_debut, date_fin, nb_personnes, notes,
    type_reservation, objet_reserve
  } = req.body;

  if (!site_id || !nom_client || !email_client || !date_debut) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  try {
    // Vérifier conflit de réservation
    const conflit = await pool.query(
      `SELECT id FROM reservations
       WHERE site_id = $1
       AND statut != 'annulee'
       AND tsrange(date_debut, date_fin) && tsrange($2::timestamp, $3::timestamp)`,
      [site_id, date_debut, date_fin || date_debut]
    );

    if (conflit.rows.length > 0) {
      return res.status(409).json({ message: 'Ce créneau est déjà réservé. Veuillez choisir un autre horaire.' });
    }

    // Créer la réservation
    const result = await pool.query(
      `INSERT INTO reservations
        (site_id, nom_client, email_client, telephone, date_debut, date_fin,
         nb_personnes, notes, statut, type_reservation, objet_reserve)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmee',$9,$10)
       RETURNING *`,
      [site_id, nom_client, email_client, telephone || null,
       date_debut, date_fin || date_debut, nb_personnes || 1,
       notes || null, type_reservation || null, objet_reserve || null]
    );

    const reservation = result.rows[0];

    // Récupérer config du site pour l'email
    const siteResult = await pool.query(
      `SELECT s.config, v.email as gestionnaire_email
       FROM sites s JOIN gestionnaires v ON v.id = s.gestionnaire_id
       WHERE s.id = $1`,
      [site_id]
    );
    const siteData = siteResult.rows[0];
    const configSite = {
      ...(siteData?.config || {}),
      gestionnaireEmail: siteData?.gestionnaire_email,
    };

    // Envoyer emails
    await envoyerEmailConfirmation(reservation, configSite);

    res.status(201).json({
      success: true,
      message: 'Réservation confirmée! Un email de confirmation vous a été envoyé.',
      reservation: {
        id:         reservation.id,
        date_debut: reservation.date_debut,
        date_fin:   reservation.date_fin,
        statut:     reservation.statut,
      }
    });
  } catch (err) {
    console.error('POST reservations:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES GESTIONNAIRE (authentifiées)
// ═══════════════════════════════════════════════════════════════

// GET /api/reservations/gestionnaire — toutes mes réservations
router.get('/gestionnaire', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.slug as site_slug
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       WHERE s.gestionnaire_id = $1
       ORDER BY r.date_debut DESC`,
      [req.user.id]
    );
    res.json({ reservations: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/reservations/:id/statut — changer le statut
router.put('/:id/statut', authenticateToken, async (req, res) => {
  const { statut } = req.body;
  const statutsValides = ['confirmee', 'annulee', 'en_attente', 'completee'];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }
  try {
    await pool.query(
      `UPDATE reservations SET statut = $1
       WHERE id = $2 AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $3)`,
      [statut, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Disponibilités (gestion par le gestionnaire) ──────────────────────────────────

// GET /api/reservations/mes-disponibilites
router.get('/mes-disponibilites', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.json({ disponibilites: [] });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `SELECT * FROM disponibilites WHERE site_id = $1 ORDER BY date_debut ASC`,
      [siteId]
    );
    res.json({ disponibilites: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/reservations/disponibilites — créer un créneau
router.post('/disponibilites', authenticateToken, async (req, res) => {
  const { date_debut, date_fin, capacite_max, titre } = req.body;
  if (!date_debut || !date_fin) return res.status(400).json({ message: 'Dates requises.' });
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO disponibilites (site_id, date_debut, date_fin, capacite_max, titre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [siteId, date_debut, date_fin, capacite_max || 1, titre || null]
    );
    res.status(201).json({ success: true, disponibilite: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/reservations/disponibilites/:id
router.delete('/disponibilites/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM disponibilites WHERE id = $1
       AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;