// routes/templates_prix_public.js
// e-Vend Studio — Endpoint PUBLIC de résolution de prix
// Utilisé par PageTemplates.tsx et PageChoisirTemplate.tsx (aucune authentification requise)
//
// Résolution du prix affiché pour un template :
//   1. Surcharge dans templates_prix (si prix_texte non NULL)
//   2. Défaut de sa catégorie dans groupes_prix
//   3. 'Gratuit' par défaut

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─── GET /api/templates/prix ──────────────────────────────────────────────────
router.get('/prix', async (req, res) => {
  try {
    const [groupesRes, templatesRes] = await Promise.all([
      pool.query('SELECT groupe_id, prix_texte, prix_type FROM groupes_prix'),
      pool.query('SELECT template_id, groupe_id, prix_texte, prix_type, prix_paliers FROM templates_prix'),
    ]);

    const defautsParGroupe = {};
    for (const g of groupesRes.rows) {
      defautsParGroupe[g.groupe_id] = { prix_texte: g.prix_texte, prix_type: g.prix_type };
    }

    const resolved = {};
    for (const t of templatesRes.rows) {
      resolved[t.template_id] = {
        prix_texte:   t.prix_texte || (defautsParGroupe[t.groupe_id]?.prix_texte ?? 'Gratuit'),
        prix_type:    t.prix_type  || (defautsParGroupe[t.groupe_id]?.prix_type  ?? 'gratuit'),
        prix_paliers: t.prix_paliers || null,
      };
    }

    return res.json({
      success: true,
      groupes: defautsParGroupe,   // défauts par catégorie   — { groupeId: { prix_texte, prix_type } }
      templates: resolved,         // prix résolu par template — { templateId: { prix_texte, prix_type, prix_paliers } }
    });
  } catch (err) {
    console.error('Erreur GET /api/templates/prix:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;