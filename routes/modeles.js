const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =====================================================================
// RÉCUPÉRER TOUS LES MODÈLES DE DOCUMENTS
// =====================================================================
router.get('/admin/modeles-documents', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cle, valeur FROM parametres WHERE cle LIKE $1',
      ['modele_%']
    );
    
    const modeles = {};
    result.rows.forEach(row => {
      const type = row.cle.replace('modele_', '');
      modeles[type] = row.valeur;
    });
    
    res.json(modeles);
  } catch (err) {
    console.error('❌ Erreur chargement modèles:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// SAUVEGARDER UN MODÈLE DE DOCUMENT
// =====================================================================
router.post('/admin/modeles-documents/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { html } = req.body;
    
    await pool.query(
      `INSERT INTO parametres (cle, valeur, description) 
       VALUES ($1, $2, $3)
       ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW()`,
      [`modele_${type}`, html, `Modèle HTML pour ${type}`]
    );
    
    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      ['MODELE_DOCUMENT_MAJ', req.user.email, JSON.stringify({ type }), 'info']
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur sauvegarde modèle:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// MODÈLES DE COURRIELS (email_templates)
// =====================================================================

// Créer la table si elle n'existe pas
const initEmailTemplates = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id           INTEGER PRIMARY KEY,
      nom          VARCHAR(255) NOT NULL,
      theme        VARCHAR(50)  NOT NULL,
      destinataire VARCHAR(20)  NOT NULL,
      canal        VARCHAR(20)  NOT NULL,
      actif        BOOLEAN      NOT NULL DEFAULT true,
      sujet        TEXT         NOT NULL,
      html         TEXT         NOT NULL,
      variables    JSONB        NOT NULL DEFAULT '[]',
      updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
};
initEmailTemplates().catch(err => console.error('❌ Init email_templates:', err.message));

// GET /api/modeles-email — tous les templates sauvegardés
router.get('/modeles-email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM email_templates ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET modeles-email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/modeles-email/:id — un seul template (utilisé par le cron server.js)
router.get('/modeles-email/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ GET modeles-email/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/modeles-email — sauvegarder un template (upsert)
router.post('/modeles-email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const templates = Array.isArray(req.body) ? req.body : [req.body];
    for (const t of templates) {
      await pool.query(`
        INSERT INTO email_templates (id, nom, theme, destinataire, canal, actif, sujet, html, variables, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
        ON CONFLICT (id) DO UPDATE SET
          nom=EXCLUDED.nom, theme=EXCLUDED.theme, destinataire=EXCLUDED.destinataire,
          canal=EXCLUDED.canal, actif=EXCLUDED.actif, sujet=EXCLUDED.sujet,
          html=EXCLUDED.html, variables=EXCLUDED.variables, updated_at=NOW()
      `, [t.id, t.nom, t.theme, t.destinataire, t.canal, t.actif !== false,
          t.sujet, t.html, JSON.stringify(t.variables || [])]);
    }
    console.log(`✅ ${templates.length} template(s) email sauvegardé(s)`);
    res.json({ success: true, count: templates.length });
  } catch (err) {
    console.error('❌ POST modeles-email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/test-email — envoie un email de test via AWS SES
router.post('/test-email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { template, destinataire, variables } = req.body;
    if (!template?.html || !destinataire) {
      return res.status(400).json({ error: 'template.html et destinataire requis' });
    }

    let html  = template.html;
    let sujet = template.sujet || 'Test e-Vend';
    const dateStr = new Date().toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' });

    if (variables) {
      for (const [cle, val] of Object.entries(variables)) {
        html  = html.split(`{$${cle}}`).join(String(val));
        sujet = sujet.split(`{$${cle}}`).join(String(val));
      }
    }
    html  = html.split('{$date}').join(dateStr);
    sujet = sujet.split('{$date}').join(dateStr);

    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    await sesClient.send(new SendEmailCommand({
      Destination: { ToAddresses: [destinataire] },
      Message: {
        Subject: { Data: `[TEST] ${sujet}`, Charset: 'UTF-8' },
        Body:    { Html:  { Data: html,      Charset: 'UTF-8' } }
      },
      Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
    }));

    console.log(`📧 Email test envoyé à ${destinataire}`);
    res.json({ success: true, message: `Email test envoyé à ${destinataire}` });
  } catch (err) {
    console.error('❌ POST test-email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
