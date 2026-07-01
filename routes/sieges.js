// routes/sieges.js
// e-Vend Studio — Gestion des sièges pour spectacles

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── GET — Plan de salle public (sans auth) ──────────────────────────────────
router.get('/public/:siteId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.rangee, s.numero, s.statut,
              r.nom_client as reserve_par
       FROM sieges_spectacle s
       LEFT JOIN reservations r ON r.id = s.reservation_id
       WHERE s.site_id = $1
       ORDER BY s.rangee ASC, s.numero ASC`,
      [req.params.siteId]
    );
    res.json({ sieges: result.rows });
  } catch (err) {
    console.error('GET sieges public:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST — Réserver un siège (public) ───────────────────────────────────────
router.post('/reserver', async (req, res) => {
  const { site_id, siege_ids, nom_client, email_client, telephone, notes } = req.body;

  if (!site_id || !siege_ids?.length || !nom_client || !email_client) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Vérifier que tous les sièges sont libres
    const check = await client.query(
      `SELECT id, rangee, numero, statut FROM sieges_spectacle
       WHERE site_id = $1 AND id = ANY($2::int[]) FOR UPDATE`,
      [site_id, siege_ids]
    );

    const occupes = check.rows.filter(s => s.statut !== 'libre');
    if (occupes.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: `Les sièges suivants ne sont plus disponibles : ${occupes.map(s => `${s.rangee}${s.numero}`).join(', ')}. Veuillez en choisir d'autres.`
      });
    }

    // Créer une réservation
    const siteInfo = await client.query(
      `SELECT s.config, v.email as vendeur_email
       FROM sites s JOIN vendeurs v ON v.id = s.vendeur_id
       WHERE s.id = $1`,
      [site_id]
    );

    const siegesLabels = check.rows.map(s => `${s.rangee}${s.numero}`).join(', ');

    const resResult = await client.query(
      `INSERT INTO reservations
        (site_id, nom_client, email_client, telephone, date_debut, date_fin,
         nb_personnes, notes, statut, type_reservation, objet_reserve)
       VALUES ($1,$2,$3,$4,NOW(),NOW(),$5,$6,'confirmee','spectacle',$7)
       RETURNING *`,
      [site_id, nom_client, email_client, telephone || null,
       siege_ids.length, notes || null, `Sièges: ${siegesLabels}`]
    );
    const reservation = resResult.rows[0];

    // Marquer les sièges comme réservés
    await client.query(
      `UPDATE sieges_spectacle
       SET statut = 'reserve', reservation_id = $1, updated_at = NOW()
       WHERE site_id = $2 AND id = ANY($3::int[])`,
      [reservation.id, site_id, siege_ids]
    );

    await client.query('COMMIT');

    // Email de confirmation
    try {
      const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
      const config = siteInfo.rows[0]?.config || {};
      const ses = new SESClient({
        region: process.env.AWS_REGION || 'us-east-2',
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      });

      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:${config.couleurPrincipale||'#c9a96e'};padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0">${config.nomEntreprise || 'Spectacle'}</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
          <h2>✅ Réservation confirmée!</h2>
          <p>Bonjour <strong>${nom_client}</strong>,</p>
          <p>Votre réservation est confirmée pour les sièges suivants :</p>
          <div style="background:#f8f8f6;border-left:4px solid ${config.couleurPrincipale||'#c9a96e'};padding:16px;margin:20px 0;border-radius:0 8px 8px 0">
            <p><strong>🎭 Sièges :</strong> ${siegesLabels}</p>
            <p><strong>📋 Réf. :</strong> #${reservation.id}</p>
            <p><strong>👤 Nom :</strong> ${nom_client}</p>
          </div>
          <p style="color:#888;font-size:13px">Présentez-vous avec cette confirmation le soir de l'événement.</p>
        </div>
        <div style="background:#f8f8f6;padding:16px;text-align:center;border-radius:0 0 12px 12px">
          <p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p>
        </div>
      </div>`;

      await ses.send(new SendEmailCommand({
        Destination: { ToAddresses: [email_client] },
        Message: {
          Subject: { Data: `✅ Confirmation sièges ${siegesLabels} — ${config.nomEntreprise || 'Spectacle'}`, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } }
        },
        Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
      }));

      if (siteInfo.rows[0]?.vendeur_email) {
        await ses.send(new SendEmailCommand({
          Destination: { ToAddresses: [siteInfo.rows[0].vendeur_email] },
          Message: {
            Subject: { Data: `🎭 Nouvelle réservation — ${nom_client} (${siegesLabels})`, Charset: 'UTF-8' },
            Body: { Html: { Data: `<p><strong>Client:</strong> ${nom_client} (${email_client})</p><p><strong>Sièges:</strong> ${siegesLabels}</p>`, Charset: 'UTF-8' } }
          },
          Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
        }));
      }
    } catch (emailErr) {
      console.error('Erreur email sièges:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Réservation confirmée! Vos sièges ${siegesLabels} sont réservés. Un courriel de confirmation vous a été envoyé.`,
      reservation_id: reservation.id,
      sieges: siegesLabels,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST reserver siege:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// ─── GET — Sièges du vendeur (dashboard) ────────────────────────────────────
router.get('/vendeur', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query(
      'SELECT id FROM sites WHERE vendeur_id = $1', [req.user.id]
    );
    if (!siteResult.rows.length) return res.json({ sieges: [] });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `SELECT s.*, r.nom_client, r.email_client
       FROM sieges_spectacle s
       LEFT JOIN reservations r ON r.id = s.reservation_id
       WHERE s.site_id = $1
       ORDER BY s.rangee ASC, s.numero ASC`,
      [siteId]
    );
    res.json({ sieges: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST — Générer/Réinitialiser le plan de salle ──────────────────────────
router.post('/generer', authenticateToken, async (req, res) => {
  const { config_salle } = req.body;
  // config_salle = { rangees: [{label, nb_sieges, debut_numero, type_num}], allee_centrale: bool }

  try {
    const siteResult = await pool.query(
      'SELECT id FROM sites WHERE vendeur_id = $1', [req.user.id]
    );
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const siteId = siteResult.rows[0].id;

    // Vérifier s'il y a des réservations actives
    const reservations = await pool.query(
      `SELECT COUNT(*) FROM sieges_spectacle WHERE site_id = $1 AND statut = 'reserve'`,
      [siteId]
    );
    if (parseInt(reservations.rows[0].count) > 0) {
      return res.status(409).json({ message: 'Impossible de régénérer le plan: des sièges sont déjà réservés.' });
    }

    // Supprimer l'ancien plan
    await pool.query('DELETE FROM sieges_spectacle WHERE site_id = $1', [siteId]);

    // Générer les nouveaux sièges
    const inserts = [];
    for (const rangee of config_salle.rangees) {
      const nums = genererNumerotation(rangee);
      for (const num of nums) {
        inserts.push(pool.query(
          `INSERT INTO sieges_spectacle (site_id, rangee, numero, statut)
           VALUES ($1, $2, $3, 'libre')`,
          [siteId, rangee.label, num]
        ));
      }
    }
    await Promise.all(inserts);

    const total = await pool.query(
      'SELECT COUNT(*) FROM sieges_spectacle WHERE site_id = $1', [siteId]
    );

    res.json({
      success: true,
      message: `Plan généré : ${total.rows[0].count} sièges créés.`,
      total: parseInt(total.rows[0].count),
    });
  } catch (err) {
    console.error('POST generer salle:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT — Libérer un siège (admin/vendeur) ──────────────────────────────────
router.put('/:id/liberer', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE sieges_spectacle SET statut = 'libre', reservation_id = NULL, updated_at = NOW()
       WHERE id = $1
       AND site_id IN (SELECT id FROM sites WHERE vendeur_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── HELPER: Générer la numérotation ─────────────────────────────────────────
function genererNumerotation(rangee) {
  const { nb_sieges, debut_numero = 1, type_num = 'sequentiel', allee_centrale = false } = rangee;
  const nums = [];

  switch (type_num) {
    case 'sequentiel':
      // 1, 2, 3, 4, 5...
      for (let i = 0; i < nb_sieges; i++) nums.push(debut_numero + i);
      break;

    case 'impair_pair':
      // Impair côté gauche, pair côté droit: 1,3,5... puis 2,4,6...
      const moitie = Math.floor(nb_sieges / 2);
      for (let i = 0; i < moitie; i++) nums.push(1 + i * 2);         // 1,3,5...
      for (let i = 0; i < nb_sieges - moitie; i++) nums.push(2 + i * 2); // 2,4,6...
      break;

    case 'centre_ext':
      // Centre vers extérieur: 101,102,103... (côté gauche pair, côté droit impair)
      const centre = Math.floor(nb_sieges / 2);
      for (let i = centre; i >= 1; i--) nums.push(i * 2);            // pair: côté gauche
      for (let i = 1; i <= nb_sieges - centre; i++) nums.push(i * 2 - 1); // impair: côté droit
      break;

    case 'allee':
      // Allee centrale: gauche 1..N/2, droite N/2+1..N
      if (allee_centrale) {
        const g = Math.floor(nb_sieges / 2);
        for (let i = 1; i <= g; i++) nums.push(i);
        for (let i = g + 1; i <= nb_sieges; i++) nums.push(i);
      } else {
        for (let i = 0; i < nb_sieges; i++) nums.push(debut_numero + i);
      }
      break;

    default:
      for (let i = 0; i < nb_sieges; i++) nums.push(debut_numero + i);
  }

  return nums;
}

module.exports = router;