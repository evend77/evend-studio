/**
 * routes/acheteurs.js
 * Routes admin pour la gestion des acheteurs
 * GET liste, notes CRUD, statut, mot de passe, commandes détaillées
 */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ── GET /api/admin/acheteurs — liste complète ─────────────────────────────
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT
        a.id,
        a.prenom,
        a.nom,
        a.email,
        a.telephone,
        a.adresse,
        a.ville,
        a.province,
        a.code_postal,
        a.statut,
        a.date_inscription,
        a.derniere_connexion,
        a.deux_facteurs_actif,
        COUNT(DISTINCT c.id)          AS nb_commandes,
        COALESCE(SUM(c.montant), 0)   AS total_achats
      FROM acheteurs a
      LEFT JOIN commandes c ON c.acheteur_id = a.id
      GROUP BY a.id, a.prenom, a.nom, a.email, a.telephone, a.adresse, 
               a.ville, a.province, a.code_postal, a.statut, 
               a.date_inscription, a.derniere_connexion, a.deux_facteurs_actif
      ORDER BY a.date_inscription DESC
    `);

    // Charger les notes pour chaque acheteur
    const acheteurs = await Promise.all(rows.rows.map(async (a) => {
      try {
        const notes = await pool.query(
          `SELECT id, to_char(date_creation, 'YYYY-MM-DD') AS date, auteur, contenu
           FROM notes_acheteurs WHERE acheteur_id = $1 ORDER BY date_creation ASC`,
          [a.id]
        );
        return {
          ...a,
          nb_commandes: parseInt(a.nb_commandes) || 0,
          total_achats: parseFloat(a.total_achats) || 0,
          two_factor_enabled: a.deux_facteurs_actif ?? false,
          notes: notes.rows,
        };
      } catch (noteErr) {
        console.error(`❌ Erreur chargement notes pour acheteur ${a.id}:`, noteErr);
        return {
          ...a,
          nb_commandes: parseInt(a.nb_commandes) || 0,
          total_achats: parseFloat(a.total_achats) || 0,
          two_factor_enabled: a.deux_facteurs_actif ?? false,
          notes: [],
        };
      }
    }));

    res.json(acheteurs);
  } catch (err) { 
    console.error('❌ Erreur GET acheteurs:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// ── GET /api/admin/acheteurs/:id/commandes — commandes détaillées ─────────
router.get('/:id/commandes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);

    const commandes = await pool.query(`
      SELECT
        c.id,
        c.store_order_id AS numero_commande,
        c.date_commande,
        c.statut_commande AS statut,
        c.transporteur AS mode_expedition,
        c.montant AS sous_total,
        0 AS tps,
        0 AS tvq,
        c.montant AS total,
        '' AS adresse_livraison,
        c.vendeur_id,
        c.vendeur_nom,
        c.boutique AS vendeur_boutique,
        '' AS seller_id
      FROM commandes c
      WHERE c.client_email = (SELECT email FROM acheteurs WHERE id = $1)
      ORDER BY c.date_commande DESC
    `, [acheteurId]);

    // Transformer les commandes
    const result = commandes.rows.map(cmd => ({
      ...cmd,
      sous_total: parseFloat(cmd.sous_total || 0),
      tps: parseFloat(cmd.tps || 0),
      tvq: parseFloat(cmd.tvq || 0),
      total: parseFloat(cmd.total || 0),
      items: [] // Pas d'items pour l'instant
    }));

    res.json(result);
  } catch (err) { 
    console.error('❌ Erreur GET commandes:', err);
    res.status(500).json({ error: err.message }); 
  }
});

//
router.post('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu requis' });

    const auteur = req.user.email || req.user.nom || 'Admin';

    const result = await pool.query(
      `INSERT INTO notes_acheteurs (acheteur_id, auteur, contenu, date_creation)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, to_char(date_creation, 'YYYY-MM-DD') AS date, auteur, contenu`,
      [parseInt(req.params.id), auteur, contenu.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    console.error('❌ Erreur POST note:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// ── DELETE /api/admin/acheteurs/:id/notes/:noteId — supprimer note ────────
router.delete('/:id/notes/:noteId', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notes_acheteurs WHERE id = $1 AND acheteur_id = $2`,
      [parseInt(req.params.noteId), parseInt(req.params.id)]
    );
    res.json({ success: true });
  } catch (err) { 
    console.error('❌ Erreur DELETE note:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// ── PUT /api/admin/acheteurs/:id/statut — changer statut ─────────────────
router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut, raison } = req.body;
    if (!['actif', 'suspendu', 'banni'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    await pool.query(
      `UPDATE acheteurs SET statut = $1, notes = $2 WHERE id = $3`,
      [statut, raison || null, parseInt(req.params.id)]
    );
    res.json({ success: true, message: `Statut changé à ${statut}` });
  } catch (err) { 
    console.error('❌ Erreur PUT statut:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// ── PUT /api/admin/acheteurs/:id/mot-de-passe — changer mdp ──────────────
router.put('/:id/mot-de-passe', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mot_de_passe } = req.body;
    if (!mot_de_passe || mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Mot de passe trop court (minimum 8 caractères)' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    await pool.query(
      `UPDATE acheteurs SET mot_de_passe = $1 WHERE id = $2`,
      [hash, parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err) { 
    console.error('❌ Erreur PUT mot de passe:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// ── PUT /api/admin/acheteurs/:id/2fa — activer ou désactiver la F2A ─────────
router.put('/:id/2fa', authenticateToken, isAdmin, async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean')
    return res.status(400).json({ error: 'Le champ "enabled" (boolean) est requis' });

  try {
    // 1. Mettre à jour acheteurs.deux_facteurs_actif
    const result = await pool.query(
      `UPDATE acheteurs SET deux_facteurs_actif = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, prenom, nom, email, deux_facteurs_actif`,
      [enabled, parseInt(req.params.id)]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Acheteur non trouvé' });

    const a = result.rows[0];

    // 2. Mettre à jour config_acheteur.deux_facteurs_actif (c'est ce que le login vérifie)
    await pool.query(
      `INSERT INTO config_acheteur (acheteur_id, deux_facteurs_actif)
       VALUES ($1, $2)
       ON CONFLICT (acheteur_id) DO UPDATE SET deux_facteurs_actif = $2, updated_at = NOW()`,
      [parseInt(req.params.id), enabled]
    );

    // 3. Si on désactive, vider les codes F2A en attente
    if (!enabled) {
      await pool.query(
        `DELETE FROM pending_2fa WHERE user_id = $1 AND user_type = 'acheteur'`,
        [parseInt(req.params.id)]
      );
    }

    const nomComplet = [a.prenom, a.nom].filter(Boolean).join(' ');
    console.log(`🔐 F2A acheteur ${nomComplet} (id:${a.id}) → ${enabled ? 'activée' : 'désactivée'} par admin`);

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      [enabled ? 'F2A_ACHETEUR_ACTIVEE_ADMIN' : 'F2A_ACHETEUR_DESACTIVEE_ADMIN',
       req.user?.email || 'admin',
       JSON.stringify({ acheteur_id: a.id, nom: nomComplet, deux_facteurs_actif: enabled }), 'info']
    ).catch(e => console.error('Erreur log 2fa acheteur:', e));

    res.json({ success: true, acheteur: { ...a, two_factor_enabled: enabled } });
  } catch (err) {
    console.error('❌ Erreur PUT /:id/2fa acheteur:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
