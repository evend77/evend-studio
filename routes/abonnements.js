// routes/abonnements.js
// e-Vend Studio — Add-on Abonnement École/Cours
// Gère les forfaits récurrents (formations) et les clients abonnés.
// Même structure/conventions que routes/reservations.js.
//
// ⚠️ Paiement Stripe : PAS ENCORE BRANCHÉ (comme convenu — après réservations).
// Pour l'instant, une inscription est acceptée directement (statut 'actif') sans
// passer par un vrai paiement, pour permettre de tester le reste du système.
// Une fois Stripe branché : POST / doit rediriger vers Stripe Checkout (mode
// 'subscription'), et le statut ne doit passer à 'actif' qu'après confirmation
// par webhook (checkout.session.completed / invoice.payment_succeeded).

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

const BACKEND_URL = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';

// ── Bas niveau : envoi brut via AWS SES (identique à reservations.js) ─────────
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

function substituerVariables(texte, vars) {
  let resultat = texte;
  for (const [cle, val] of Object.entries(vars)) {
    resultat = resultat.split(cle).join(val ?? '');
  }
  return resultat;
}

const LABEL_FREQUENCE = { hebdomadaire: 'semaine', mensuel: 'mois', annuel: 'an' };

// ── Fallbacks HTML si le gestionnaire n'a pas de modèle actif pour ce type ────
function templateFallbackAbonnement(type, couleur, nomSite, abonnement, formation, lienGestion, lienPaiement) {
  const details = `
    <p><strong>📋 Forfait :</strong> ${formation?.titre || abonnement.objet_abonnement || ''}</p>
    <p style="margin-top:8px"><strong>💳 Montant :</strong> ${Number(abonnement.montant).toFixed(2)} ${(abonnement.devise || 'CAD').toUpperCase()} / ${LABEL_FREQUENCE[abonnement.frequence] || abonnement.frequence}</p>
    <p style="margin-top:8px"><strong>🪪 Numéro de membre :</strong> #${String(abonnement.numero_membre).padStart(4, '0')}</p>`;

  if (type === 'paiement_en_attente') {
    return {
      sujet: `Il vous reste une étape — ${nomSite}`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:${couleur};border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <div style="text-align:center;margin-bottom:24px"><div style="font-size:48px">⏳</div><h2 style="font-size:20px;color:#1a1a1a;margin-top:12px">Il vous reste une étape!</h2></div>
  <p style="font-size:14px;color:#555;margin:0 0 16px">Bonjour <strong>${abonnement.nom_client}</strong>, votre demande d'abonnement a bien été reçue, mais le paiement n'a pas encore été complété.</p>
  <div style="background:#f8f8f6;border-left:4px solid ${couleur};border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0">${details}</div>
  <div style="text-align:center;margin:28px 0 8px"><a href="${lienPaiement}" style="display:inline-block;padding:13px 28px;border-radius:8px;background:${couleur};color:#fff;text-decoration:none;font-size:14px;font-weight:700">Compléter mon paiement →</a></div>
  <p style="font-size:12px;color:#888;text-align:center;margin-top:20px">Votre abonnement ne sera activé qu'une fois le paiement complété.</p>
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p></div>
</div></body></html>`,
    };
  }
  if (type === 'annulation') {
    return {
      sujet: `Abonnement annulé — ${nomSite}`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:#dc2626;border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px">Abonnement annulé</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px">Bonjour <strong>${abonnement.nom_client}</strong>, votre abonnement a été annulé.</p>
  <div style="background:#f8f8f6;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0">${details}</div>
  <p style="font-size:13px;color:#888">La période déjà payée reste active jusqu'à son terme — aucun prélèvement supplémentaire n'aura lieu par la suite.</p>
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p></div>
</div></body></html>`,
    };
  }
  if (type === 'recu_paiement') {
    return {
      sujet: `Reçu de paiement — ${nomSite}`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:${couleur};border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px">✅ Paiement reçu</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px">Bonjour <strong>${abonnement.nom_client}</strong>, voici votre reçu :</p>
  <div style="background:#f8f8f6;border-left:4px solid ${couleur};border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0">${details}</div>
  <p style="font-size:13px;color:#888">Merci de votre confiance!</p>
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p></div>
</div></body></html>`,
    };
  }
  // confirmation (défaut)
  return {
    sujet: `Bienvenue — ${nomSite}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="background:#f4f4f2;font-family:'Segoe UI',Arial,sans-serif;padding:32px 16px;margin:0">
<div style="max-width:600px;margin:0 auto">
<div style="background:${couleur};border-radius:12px 12px 0 0;padding:24px 32px"><h1 style="color:#fff;font-size:20px;margin:0">${nomSite}</h1></div>
<div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
  <div style="text-align:center;margin-bottom:24px"><div style="font-size:56px">🎉</div><h2 style="font-size:22px;font-weight:800;color:#1a1a1a;margin-top:12px">Abonnement confirmé!</h2></div>
  <div style="background:#f8f8f6;border-left:4px solid ${couleur};border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0">${details}</div>
  ${lienGestion ? `<div style="text-align:center;margin:28px 0 8px"><a href="${lienGestion}" style="display:inline-block;padding:11px 24px;border:1.5px solid #dc2626;border-radius:8px;color:#dc2626;text-decoration:none;font-size:13px;font-weight:600">Annuler mon abonnement</a></div>` : ''}
</div>
<div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center"><p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p></div>
</div></body></html>`,
  };
}

// ── Point d'entrée : envoie confirmation / annulation / recu_paiement ─────────
// Réutilise sites.config.modeles_courriel[type] si actif, même mécanique que reservations.js.
async function envoyerCourrielAbonnement(type, abonnement, configSite, formation, options = {}) {
  try {
    const couleur = configSite?.couleurPrincipale || '#c9a96e';
    const nomSite = configSite?.nomEntreprise || 'Notre service';
    const lienGestion = options.lienGestion || ''; // TODO: lien d'auto-annulation, une fois le token équivalent ajouté (comme reservations.js)
    const lienPaiement = options.lienPaiement || '';
    const detailsBloc = `
      <p><strong>📋 Forfait :</strong> ${formation?.titre || ''}</p>
      <p style="margin-top:8px"><strong>💳 Montant :</strong> ${Number(abonnement.montant || 0).toFixed(2)} ${(abonnement.devise || 'CAD').toUpperCase()} ${LABEL_FREQUENCE[abonnement.frequence] || ''}</p>`;

    const modele = configSite?.modeles_courriel?.[type];
    let sujet, html;

    if (modele?.html && modele.actif !== false) {
      const vars = {
        '{$nomClient}':        abonnement.nom_client || '',
        '{$emailClient}':      abonnement.email_client || '',
        '{$objetAbonnement}':  formation?.titre || '',
        '{$frequence}':        LABEL_FREQUENCE[abonnement.frequence] || abonnement.frequence || '',
        '{$montant}':          Number(abonnement.montant || 0).toFixed(2),
        '{$numeroMembre}':     `#${String(abonnement.numero_membre).padStart(4, '0')}`,
        '{$detailsReservation}': detailsBloc,
        '{$lienGestionAbonnement}': lienGestion,
        '{$lienPaiement}':     lienPaiement,
        '{$nomSite}':          nomSite,
        '{$couleur}':          couleur,
      };
      sujet = substituerVariables(modele.sujet || '', vars);
      html  = substituerVariables(modele.html, vars);
    } else {
      const fallback = templateFallbackAbonnement(type, couleur, nomSite, abonnement, formation, lienGestion, lienPaiement);
      sujet = fallback.sujet;
      html  = fallback.html;
    }

    await envoyerSES(abonnement.email_client, sujet, html);
    console.log(`✅ Courriel abonnement (${type}) envoyé — abonnement #${abonnement.id}`);
  } catch (err) {
    console.error(`❌ Erreur envoi courriel abonnement (${type}):`, err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES
// ═══════════════════════════════════════════════════════════════

// GET /api/abonnements/formations/:siteId — forfaits actifs, pour le site public
router.get('/formations/:siteId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, titre, description, prix_hebdomadaire, prix_mensuel, prix_annuel
       FROM formations WHERE site_id = $1 AND actif = true ORDER BY id ASC`,
      [req.params.siteId]
    );
    res.json({ formations: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/abonnements — un client s'inscrit à un forfait (public)
// ⚠️ Sans Stripe branché : accepté directement, statut 'actif'. À corriger plus
// tard pour rediriger vers Stripe Checkout et n'activer qu'après webhook.
router.post('/', async (req, res) => {
  const { formation_id, nom_client, email_client, telephone, frequence } = req.body;
  if (!formation_id || !nom_client || !email_client || !frequence) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }
  if (!['hebdomadaire', 'mensuel', 'annuel'].includes(frequence)) {
    return res.status(400).json({ message: 'Fréquence invalide.' });
  }
  try {
    const formationResult = await pool.query(`SELECT * FROM formations WHERE id = $1 AND actif = true`, [formation_id]);
    if (!formationResult.rows.length) return res.status(404).json({ message: 'Forfait introuvable.' });
    const formation = formationResult.rows[0];

    const colonnePrix = { hebdomadaire: 'prix_hebdomadaire', mensuel: 'prix_mensuel', annuel: 'prix_annuel' }[frequence];
    const montant = formation[colonnePrix];
    if (montant == null) return res.status(400).json({ message: 'Ce forfait n\'offre pas cette fréquence.' });

    const numeroResult = await pool.query(
      `SELECT COALESCE(MAX(numero_membre), 0) + 1 AS prochain FROM abonnements_clients WHERE site_id = $1`,
      [formation.site_id]
    );
    const numeroMembre = numeroResult.rows[0].prochain;

    const result = await pool.query(
      `INSERT INTO abonnements_clients
        (site_id, formation_id, numero_membre, nom_client, email_client, telephone, frequence, montant, statut)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'en_attente_paiement')
       RETURNING *`,
      [formation.site_id, formation_id, numeroMembre, nom_client, email_client, telephone || null, frequence, montant]
    );
    const abonnement = result.rows[0];

    // Le paiement (Stripe Checkout, mode subscription) est TOUJOURS requis pour un
    // abonnement — pas de bypass comme pour réservation. L'activation réelle et le
    // courriel de confirmation se font au webhook (checkout.session.completed).
    res.status(201).json({
      success: true,
      payment_required: true,
      abonnement,
      message: 'Abonnement créé — paiement requis pour l\'activer.',
    });
  } catch (err) {
    console.error('POST /api/abonnements', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES GESTIONNAIRE (authentifiées)
// ═══════════════════════════════════════════════════════════════

// GET /mes-formations — tous les forfaits du gestionnaire (actifs + inactifs)
router.get('/mes-formations', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.json({ formations: [] });
    const result = await pool.query(`SELECT * FROM formations WHERE site_id = $1 ORDER BY created_at DESC`, [siteResult.rows[0].id]);
    res.json({ formations: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /formations — créer un forfait
router.post('/formations', authenticateToken, async (req, res) => {
  const { titre, description, prix_hebdomadaire, prix_mensuel, prix_annuel } = req.body;
  if (!titre) return res.status(400).json({ message: 'Titre requis.' });
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const result = await pool.query(
      `INSERT INTO formations (site_id, titre, description, prix_hebdomadaire, prix_mensuel, prix_annuel)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [siteResult.rows[0].id, titre, description || null, prix_hebdomadaire || null, prix_mensuel || null, prix_annuel || null]
    );
    res.status(201).json({ success: true, formation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /formations/:id — modifier un forfait
router.put('/formations/:id', authenticateToken, async (req, res) => {
  const { titre, description, prix_hebdomadaire, prix_mensuel, prix_annuel, actif } = req.body;
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    const result = await pool.query(
      `UPDATE formations SET
         titre = COALESCE($1, titre), description = COALESCE($2, description),
         prix_hebdomadaire = COALESCE($3, prix_hebdomadaire), prix_mensuel = COALESCE($4, prix_mensuel),
         prix_annuel = COALESCE($5, prix_annuel), actif = COALESCE($6, actif), updated_at = NOW()
       WHERE id = $7 AND site_id = $8 RETURNING *`,
      [titre, description, prix_hebdomadaire, prix_mensuel, prix_annuel, actif, req.params.id, siteResult.rows[0].id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Forfait introuvable.' });
    res.json({ success: true, formation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /formations/:id
router.delete('/formations/:id', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.status(404).json({ message: 'Site non trouvé.' });
    await pool.query(`DELETE FROM formations WHERE id = $1 AND site_id = $2`, [req.params.id, siteResult.rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /abonnes — tous les clients abonnés (onglet "Mes abonnés")
router.get('/abonnes', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.json({ abonnes: [] });
    const result = await pool.query(
      `SELECT a.*, f.titre as formation_titre
       FROM abonnements_clients a
       JOIN formations f ON f.id = a.formation_id
       WHERE a.site_id = $1 ORDER BY a.created_at DESC`,
      [siteResult.rows[0].id]
    );
    res.json({ abonnes: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /:id/annuler — annuler un abonnement (arrête les prélèvements futurs, ne rembourse pas la période en cours)
router.post('/:id/annuler', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, f.titre as formation_titre, s.config, g.email as gestionnaire_email
       FROM abonnements_clients a
       JOIN formations f ON f.id = a.formation_id
       JOIN sites s ON s.id = a.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE a.id = $1 AND s.gestionnaire_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Abonnement introuvable.' });
    const abonnement = result.rows[0];
    if (abonnement.statut === 'annule') return res.status(400).json({ message: 'Déjà annulé.' });

    // ⚠️ Une fois Stripe branché : appeler stripe.subscriptions.update(id, { cancel_at_period_end: true })
    // ICI, avant de marquer 'annule' en BD — pour l'instant, annulation immédiate côté BD seulement.

    await pool.query(`UPDATE abonnements_clients SET statut = 'annule', annule_le = NOW() WHERE id = $1`, [abonnement.id]);

    const configSite = { ...(abonnement.config || {}), gestionnaireEmail: abonnement.gestionnaire_email };
    envoyerCourrielAbonnement('annulation', abonnement, configSite, { titre: abonnement.formation_titre }); // pas de await

    res.json({ success: true });
  } catch (err) {
    console.error('POST /:id/annuler', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
module.exports.envoyerCourrielAbonnement = envoyerCourrielAbonnement;