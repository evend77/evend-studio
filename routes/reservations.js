// routes/reservations.js
// e-Vend Studio — Gestion des réservations et disponibilités

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const crypto  = require('crypto');
const { authenticateToken } = require('../middleware/auth');

const BACKEND_URL = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';
// ⚠️ À vérifier : je n'ai pas trouvé de variable d'environnement existante pour
// l'URL publique du backend dans les fichiers que tu m'as envoyés. J'utilise ce
// fallback par défaut (même convention que FROM_EMAIL plus bas). Si BACKEND_URL
// n'est pas défini dans tes variables d'environnement, ajoute-le, sinon les liens
// d'annulation dans les courriels pointeront vers cette URL par défaut.

// ── Bas niveau : envoi brut via AWS SES ────────────────────────────────────────
async function envoyerSES(destinataire, sujet, html) {
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const ses = new SESClient({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
  await ses.send(new SendEmailCommand({
    Destination: { ToAddresses: [destinataire] },
    Message: {
      Subject: { Data: sujet, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } }
    },
    Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
  }));
}

// ── Remplace les variables {$...} dans un sujet/html (même approche que le test-email de server.js) ──
function substituerVariables(texte, vars) {
  let resultat = texte;
  for (const [cle, val] of Object.entries(vars)) {
    resultat = resultat.split(cle).join(val ?? '');
  }
  return resultat;
}

// ── Construit le bloc de détails, n'affiche que ce qui s'applique au type de réservation ──
function construireDetailsReservationHtml(reservation, dispo) {
  const dateDebut = new Date(reservation.date_debut).toLocaleString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const lignes = [`<p><strong>📅 Date :</strong> ${dateDebut}</p>`];
  if (reservation.objet_reserve) lignes.push(`<p style="margin-top:8px"><strong>📋 Réservation :</strong> ${reservation.objet_reserve}</p>`);
  if (dispo?.salle) lignes.push(`<p style="margin-top:8px"><strong>📍 Salle :</strong> ${dispo.salle}</p>`);
  if (dispo?.professeur) lignes.push(`<p style="margin-top:8px"><strong>👤 Professeur :</strong> ${dispo.professeur}</p>`);
  if (dispo?.niveau) lignes.push(`<p style="margin-top:8px"><strong>🎯 Niveau :</strong> ${dispo.niveau}</p>`);
  if (reservation.nb_personnes && reservation.nb_personnes > 1) lignes.push(`<p style="margin-top:8px"><strong>👥 Personnes :</strong> ${reservation.nb_personnes}</p>`);
  return lignes.join('\n      ');
}

// ── Récupère salle/professeur/niveau si un créneau (disponibilite) correspond ──
async function recupererDispoAssociee(siteId, dateDebut) {
  try {
    const r = await pool.query(
      `SELECT titre, salle, professeur, niveau FROM disponibilites WHERE site_id = $1 AND date_debut = $2::timestamp LIMIT 1`,
      [siteId, dateDebut]
    );
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

// ── Fallbacks HTML codés en dur, utilisés seulement si le gestionnaire n'a pas de modèle actif ──
function templateFallback(type, couleur, nomSite, detailsHtml, reservation, lienAnnulation) {
  if (type === 'annulation') {
    return {
      sujet: `Réservation annulée — ${nomSite}`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:#dc2626;border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px">Réservation annulée</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px">Bonjour <strong>${reservation.nom_client}</strong>, la réservation suivante a été annulée :</p>
  <div style="background:#f8f8f6;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0">${detailsHtml}</div>
  <p style="font-size:13px;color:#888;margin-top:24px">Cordialement,<br><strong>${nomSite}</strong></p>
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p></div>
</div></body></html>`,
    };
  }
  // confirmation (défaut)
  return {
    sujet: `✅ Réservation confirmée — ${nomSite}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:${couleur};border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:56px">✅</div>
    <h2 style="font-size:22px;font-weight:800;color:#1a1a1a;margin-top:12px">Réservation confirmée!</h2>
  </div>
  <div style="background:#f8f8f6;border-left:4px solid ${couleur};border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0">${detailsHtml}</div>
  <div style="text-align:center;margin:8px 0 4px"><span style="display:inline-block;background:${couleur}20;color:${couleur};border:1px solid ${couleur}40;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">Numéro de réservation : #${reservation.id}</span></div>
  ${lienAnnulation ? `<div style="text-align:center;margin:28px 0 8px"><a href="${lienAnnulation}" style="display:inline-block;padding:11px 24px;border:1.5px solid #dc2626;border-radius:8px;color:#dc2626;text-decoration:none;font-size:13px;font-weight:600">Annuler cette réservation</a></div>` : ''}
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa;line-height:1.6">${nomSite} — Propulsé par e-Vend Studio<br>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p></div>
</div></body></html>`,
  };
}

// ── Point d'entrée principal : envoie le courriel de confirmation ou d'annulation ──
// Utilise le modèle personnalisé du gestionnaire (configSite.modeles_courriel) s'il
// existe et est actif; sinon, repli sur le HTML codé en dur ci-dessus.
async function envoyerCourrielReservation(type, reservation, configSite) {
  try {
    const couleur = configSite?.couleurPrincipale || '#c9a96e';
    const nomSite = configSite?.nomEntreprise || 'Notre service';
    const dispo = await recupererDispoAssociee(reservation.site_id, reservation.date_debut);
    const detailsHtml = construireDetailsReservationHtml(reservation, dispo);
    const lienAnnulation = type === 'confirmation' && reservation.token_annulation
      ? `${BACKEND_URL}/api/reservations/annuler/${reservation.token_annulation}`
      : '';

    const modele = configSite?.modeles_courriel?.[type];
    let sujet, html;

    if (modele?.html && modele.actif !== false) {
      const vars = {
        '{$nomClient}':           reservation.nom_client || '',
        '{$emailClient}':         reservation.email_client || '',
        '{$objetReserve}':        reservation.objet_reserve || '',
        '{$detailsReservation}':  detailsHtml,
        '{$dateReservation}':     new Date(reservation.date_debut).toLocaleString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        '{$nbPersonnes}':         String(reservation.nb_personnes || 1),
        '{$salle}':               dispo?.salle || '',
        '{$professeur}':          dispo?.professeur || '',
        '{$niveau}':              dispo?.niveau || '',
        '{$idReservation}':       String(reservation.id),
        '{$lienAnnulation}':      lienAnnulation,
        '{$nomSite}':             nomSite,
        '{$couleur}':             couleur,
        '{$notesSupplementaires}': reservation.notes || '',
      };
      sujet = substituerVariables(modele.sujet || '', vars);
      html  = substituerVariables(modele.html, vars);
    } else {
      const fallback = templateFallback(type, couleur, nomSite, detailsHtml, reservation, lienAnnulation);
      sujet = fallback.sujet;
      html  = fallback.html;
    }

    await envoyerSES(reservation.email_client, sujet, html);

    // Notification interne au gestionnaire — seulement pour une nouvelle confirmation
    if (type === 'confirmation' && configSite?.gestionnaireEmail) {
      const htmlVendeur = `<div style="font-family:sans-serif;padding:24px">
        <h2>🔔 Nouvelle réservation reçue</h2>
        <p><strong>Client:</strong> ${reservation.nom_client} (${reservation.email_client})</p>
        <div style="margin:12px 0">${detailsHtml}</div>
        ${reservation.notes ? `<p><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
      </div>`;
      await envoyerSES(configSite.gestionnaireEmail, `🔔 Nouvelle réservation — ${reservation.nom_client}`, htmlVendeur);
    }

    console.log(`✅ Courriel ${type} envoyé pour réservation #${reservation.id}`);
  } catch (err) {
    console.error(`❌ Erreur envoi courriel ${type}:`, err.message);
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
    // 🟢 Un créneau à capacité (ex: cours de danse) existe-t-il exactement pour ce moment?
    // Si oui : on compte les places au lieu de bloquer au premier chevauchement.
    // Si non : comportement EXACTEMENT identique à avant (réservation exclusive).
    const dispoResult = await pool.query(
      `SELECT id, capacite_max FROM disponibilites
       WHERE site_id = $1 AND date_debut = $2::timestamp AND actif = true`,
      [site_id, date_debut]
    );

    if (dispoResult.rows.length > 0) {
      const dispo = dispoResult.rows[0];
      const compteResult = await pool.query(
        `SELECT COALESCE(SUM(nb_personnes), 0) AS total
         FROM reservations
         WHERE site_id = $1 AND date_debut = $2::timestamp AND statut != 'annulee'`,
        [site_id, date_debut]
      );
      const placesDejaReservees = parseInt(compteResult.rows[0].total, 10);
      const demandees = nb_personnes || 1;
      const placesRestantes = dispo.capacite_max - placesDejaReservees;

      if (placesDejaReservees + demandees > dispo.capacite_max) {
        return res.status(409).json({
          message: placesRestantes > 0
            ? `Il ne reste que ${placesRestantes} place(s) pour ce créneau.`
            : 'Ce créneau est complet. Veuillez choisir un autre horaire.',
        });
      }
      // Capacité suffisante — on continue vers la création, pas de vérification d'exclusivité.
    } else {
      // Comportement d'origine, inchangé — réservation exclusive (table, ressource unique, etc.)
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
    }

    // Le paiement en ligne est-il activé pour ce site?
    const optionsResult = await pool.query(
      `SELECT o.reservation_ecole_paiement
       FROM sites s JOIN options_gestionnaire o ON o.gestionnaire_id = s.gestionnaire_id
       WHERE s.id = $1`,
      [site_id]
    );
    const paiementActif = !!optionsResult.rows[0]?.reservation_ecole_paiement;

    // Créer la réservation — en attente de paiement si l'option est active, confirmée sinon
    const tokenAnnulation = crypto.randomBytes(24).toString('hex');
    const result = await pool.query(
      `INSERT INTO reservations
        (site_id, nom_client, email_client, telephone, date_debut, date_fin,
         nb_personnes, notes, statut, statut_paiement, type_reservation, objet_reserve, token_annulation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [site_id, nom_client, email_client, telephone || null,
       date_debut, date_fin || date_debut, nb_personnes || 1,
       notes || null,
       paiementActif ? 'en_attente_paiement' : 'confirmee',
       paiementActif ? 'en_attente' : null,
       type_reservation || null, objet_reserve || null, tokenAnnulation]
    );

    const reservation = result.rows[0];

    // Si paiement requis : ne pas confirmer/envoyer le courriel tout de suite —
    // ça se fera au webhook (checkout.session.completed) ou après capture PayPal.
    if (paiementActif) {
      return res.status(201).json({
        success: true,
        payment_required: true,
        reservation,
        message: 'Réservation créée — paiement requis pour la confirmer.',
      });
    }

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

    // Envoyer le courriel de confirmation (modèle personnalisé, sinon repli par défaut)
    await envoyerCourrielReservation('confirmation', reservation, configSite);

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

// ── Petite page HTML autonome pour les réponses du lien d'annulation (ouvert dans le navigateur, pas une API JSON) ──
function pageAnnulationHtml(titre, message, succes) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head>
<body style="margin:0;background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px">
  <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 32px;max-width:440px;width:100%;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">${succes ? '✅' : '⚠️'}</div>
    <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 10px">${titre}</h1>
    <p style="font-size:14px;color:#666;line-height:1.5;margin:0">${message}</p>
  </div>
</body></html>`;
}

// GET /api/reservations/annuler/:token — lien public cliqué depuis le courriel de confirmation
router.get('/annuler/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.config, g.email as gestionnaire_email
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE r.token_annulation = $1`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).send(pageAnnulationHtml('Lien invalide', "Ce lien d'annulation n'existe pas ou n'est plus valide. Contactez directement le commerce si vous souhaitez annuler votre réservation.", false));
    }
    const reservation = result.rows[0];
    if (reservation.statut === 'annulee') {
      return res.send(pageAnnulationHtml('Déjà annulée', 'Cette réservation avait déjà été annulée. Aucune action supplémentaire n\'est requise.', true));
    }

    await pool.query(`UPDATE reservations SET statut = 'annulee' WHERE id = $1`, [reservation.id]);

    const configSite = { ...(reservation.config || {}), gestionnaireEmail: reservation.gestionnaire_email };
    await envoyerCourrielReservation('annulation', reservation, configSite);

    return res.send(pageAnnulationHtml('Réservation annulée', 'Votre réservation a bien été annulée. Une place est maintenant libre pour ce créneau. Un courriel de confirmation vous a été envoyé.', true));
  } catch (err) {
    console.error('GET /annuler/:token', err);
    return res.status(500).send(pageAnnulationHtml('Erreur', "Une erreur est survenue. Veuillez contacter directement le commerce pour annuler votre réservation.", false));
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

// POST /api/reservations/gestionnaire/creer-manuel
// Le gestionnaire crée une réservation lui-même (ex: client qui appelle par téléphone).
// Même logique de capacité que la route publique, mais le site_id vient du token,
// jamais du corps de la requête — un gestionnaire ne peut réserver que sur son propre site.
router.post('/gestionnaire/creer-manuel', authenticateToken, async (req, res) => {
  const { nom_client, email_client, telephone, date_debut, date_fin, nb_personnes, notes } = req.body;
  if (!nom_client || !date_debut) {
    return res.status(400).json({ message: 'Nom du client et date requis.' });
  }
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const siteId = siteResult.rows[0].id;

    // Même vérification de capacité que la route publique — un gestionnaire ne
    // peut pas dépasser la capacité d'un créneau non plus.
    const dispoResult = await pool.query(
      `SELECT id, capacite_max FROM disponibilites WHERE site_id = $1 AND date_debut = $2::timestamp AND actif = true`,
      [siteId, date_debut]
    );
    if (dispoResult.rows.length > 0) {
      const dispo = dispoResult.rows[0];
      const compteResult = await pool.query(
        `SELECT COALESCE(SUM(nb_personnes), 0) AS total FROM reservations
         WHERE site_id = $1 AND date_debut = $2::timestamp AND statut != 'annulee'`,
        [siteId, date_debut]
      );
      const placesDejaReservees = parseInt(compteResult.rows[0].total, 10);
      const demandees = nb_personnes || 1;
      if (placesDejaReservees + demandees > dispo.capacite_max) {
        return res.status(409).json({ message: `Il ne reste que ${dispo.capacite_max - placesDejaReservees} place(s) pour ce créneau.` });
      }
    }

    const result = await pool.query(
      `INSERT INTO reservations
        (site_id, nom_client, email_client, telephone, date_debut, date_fin, nb_personnes, notes, statut, type_reservation, objet_reserve)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmee','cours',$9)
       RETURNING *`,
      [siteId, nom_client, email_client || null, telephone || null, date_debut, date_fin || date_debut, nb_personnes || 1, notes || null, 'Réservation par téléphone']
    );

    res.status(201).json({ success: true, reservation: result.rows[0] });
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
    const result = await pool.query(
      `UPDATE reservations SET statut = $1
       WHERE id = $2 AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $3)
       RETURNING *`,
      [statut, req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Réservation introuvable.' });

    // Le gestionnaire vient d'annuler manuellement — avertir le client par courriel
    if (statut === 'annulee' && result.rows[0].email_client) {
      const reservation = result.rows[0];
      const siteResult = await pool.query(
        `SELECT s.config, g.email as gestionnaire_email FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE s.id = $1`,
        [reservation.site_id]
      );
      const siteData = siteResult.rows[0];
      const configSite = { ...(siteData?.config || {}), gestionnaireEmail: siteData?.gestionnaire_email };
      envoyerCourrielReservation('annulation', reservation, configSite); // pas de await — ne bloque pas la réponse au gestionnaire
    }

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
      `SELECT
         d.*,
         COALESCE(r.nb_reservees, 0) AS places_reservees,
         d.capacite_max - COALESCE(r.nb_reservees, 0) AS places_restantes
       FROM disponibilites d
       LEFT JOIN (
         SELECT date_debut, SUM(nb_personnes) AS nb_reservees
         FROM reservations
         WHERE site_id = $1 AND statut != 'annulee'
         GROUP BY date_debut
       ) r ON r.date_debut = d.date_debut
       WHERE d.site_id = $1
       ORDER BY d.date_debut ASC`,
      [siteId]
    );
    res.json({ disponibilites: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/reservations/disponibilites/:id — modifier un créneau (dates, capacité, actif)
router.put('/disponibilites/:id', authenticateToken, async (req, res) => {
  const { date_debut, date_fin, capacite_max, titre, actif, salle, professeur, niveau, notes_internes, style, prix } = req.body;
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `UPDATE disponibilites
          SET date_debut     = COALESCE($1, date_debut),
              date_fin       = COALESCE($2, date_fin),
              capacite_max   = COALESCE($3, capacite_max),
              titre          = COALESCE($4, titre),
              actif          = COALESCE($5, actif),
              salle          = COALESCE($6, salle),
              professeur     = COALESCE($7, professeur),
              niveau         = COALESCE($8, niveau),
              notes_internes = COALESCE($9, notes_internes),
              style          = COALESCE($10, style),
              prix           = COALESCE($11, prix)
        WHERE id = $12 AND site_id = $13
        RETURNING *`,
      [date_debut, date_fin, capacite_max, titre, actif, salle, professeur, niveau, notes_internes, style, prix, req.params.id, siteId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Créneau introuvable.' });
    res.json({ success: true, disponibilite: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/reservations/disponibilites — créer un créneau
router.post('/disponibilites', authenticateToken, async (req, res) => {
  const { date_debut, date_fin, capacite_max, titre, salle, professeur, niveau, notes_internes, style, prix } = req.body;
  if (!date_debut || !date_fin) return res.status(400).json({ message: 'Dates requises.' });
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO disponibilites (site_id, date_debut, date_fin, capacite_max, titre, salle, professeur, niveau, notes_internes, style, prix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [siteId, date_debut, date_fin, capacite_max || 1, titre || null, salle || null, professeur || null, niveau || null, notes_internes || null, style || null, prix || null]
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

// GET /api/reservations/paiements — liste des paiements du gestionnaire (onglet Paiements)
router.get('/paiements', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.nom_client, r.email_client, r.objet_reserve, r.date_debut,
              r.montant, r.devise, r.statut_paiement, r.created_at
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       WHERE s.gestionnaire_id = $1 AND r.statut_paiement IS NOT NULL
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ paiements: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/reservations/:id/rembourser — rembourse un paiement, annule la réservation, libère la place
router.post('/:id/rembourser', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.config, g.email as gestionnaire_email
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE r.id = $1 AND s.gestionnaire_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Paiement introuvable.' });
    const reservation = result.rows[0];
    if (reservation.statut_paiement === 'rembourse') return res.status(400).json({ message: 'Déjà remboursé.' });
    if (!reservation.stripe_payment_intent_id) return res.status(400).json({ message: 'Aucun paiement Stripe associé à cette réservation.' });

    // ⚠️ Nécessite Stripe Connect configuré (étape 2, pas encore branchée à l'écriture de ce code).
    // Une fois le compte connecté du gestionnaire disponible (reservation.config.stripe_account_id
    // ou équivalent), le remboursement doit être fait SUR CE COMPTE CONNECTÉ, pas sur la plateforme.
    try {
      const { Stripe } = require('stripe');
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY_STUDIO); // clé du compte plateforme Studio (2e compte admin)
      const stripeAccountId = reservation.config?.stripe_account_id;
      await stripe.refunds.create(
        { payment_intent: reservation.stripe_payment_intent_id },
        stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
      );
    } catch (stripeErr) {
      console.error('❌ Erreur remboursement Stripe:', stripeErr.message);
      return res.status(502).json({ message: 'Erreur Stripe lors du remboursement. Rien n\'a été modifié.' });
    }

    await pool.query(
      `UPDATE reservations SET statut = 'annulee', statut_paiement = 'rembourse' WHERE id = $1`,
      [reservation.id]
    );

    const configSite = { ...(reservation.config || {}), gestionnaireEmail: reservation.gestionnaire_email };
    envoyerCourrielReservation('annulation', reservation, configSite); // pas de await — ne bloque pas la réponse

    res.json({ success: true });
  } catch (err) {
    console.error('POST /:id/rembourser', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
module.exports.envoyerCourrielReservation = envoyerCourrielReservation;