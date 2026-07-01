// routes/vendeurs_expedition.js
// Routes pour les méthodes d'expédition et les commissions
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── TRANSPORTEURS DISPONIBLES ───────────────────────────────────────────
const TRANSPORTEURS_NOMS = {
  1:  { nom: 'Canada Post / Postes Canada', logo: '📮' },
  2:  { nom: 'Purolator',                   logo: '🚚' },
  3:  { nom: 'FedEx Canada',                logo: '✈️'  },
  4:  { nom: 'UPS Canada',                  logo: '📦'  },
  5:  { nom: 'Intelcom Courrier',            logo: '📬'  },
  6:  { nom: 'DHL Express Canada',           logo: '🌍'  },
  7:  { nom: 'GLS Canada',                  logo: '🚛'  },
  8:  { nom: 'CanPar',                      logo: '🇨🇦'  },
  9:  { nom: 'Loomis Express',              logo: '📦'  },
  10: { nom: 'Transport A. Bélanger',        logo: '🚚'  },
  11: { nom: 'Groupe Robert',               logo: '🏭'  },
  12: { nom: 'Livraison locale',            logo: '🛵'  },
  13: { nom: 'Ramassage sur place',          logo: '🏪'  },
  14: { nom: 'Livraison gratuite',           logo: '🎁'  },
};

const FREE_SHIPPING_FALLBACK = {
  id: -1, transporteur_id: 14,
  nom: 'Livraison gratuite', logo: '🎁',
  mode_calcul: 'fixe', frais_fixes: 0, frais_par_kg: 0,
  gratuit_superieur: null, delais_estime: 'Variable selon le vendeur',
  combine_shipping: false, combine_frais_fixe_unique: true, combine_kg_additionne: true,
  frais_zones: null, gratuit: true, ramassage: false,
  frais_calcule: 0, detail_calcul: 'Livraison gratuite',
};

function enrichirMethode(m) {
  const t = TRANSPORTEURS_NOMS[m.transporteur_id] || { nom: 'Expédition', logo: '📦' };
  return {
    ...m,
    nom: t.nom,
    logo: t.logo,
    frais_fixes: m.frais_fixes ? parseFloat(m.frais_fixes) : 0,
    frais_par_kg: m.frais_par_kg ? parseFloat(m.frais_par_kg) : 0,
    gratuit_superieur: m.gratuit_superieur ? parseFloat(m.gratuit_superieur) : null,
    gratuit: (parseFloat(m.frais_fixes) || 0) === 0,
    ramassage: m.transporteur_id === 13,
  };
}

// GET /:vendeurId/methodes-expedition/details — avec auth (pour CreerAnnonce)
router.get('/:vendeurId/methodes-expedition/details', authenticateToken, async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.vendeurId);
    const result = await pool.query(
      `SELECT * FROM vendeur_methodes_expedition WHERE vendeur_id = $1 AND actif = true ORDER BY transporteur_id`,
      [vendeurId]
    );
    const methodes = result.rows.map(enrichirMethode);
    res.json(methodes.length > 0 ? methodes : [FREE_SHIPPING_FALLBACK]);
  } catch (err) {
    console.error('❌ GET /details:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /:vendeurId/methodes-expedition/publiques — sans auth (pour checkout acheteur)
router.get('/:vendeurId/methodes-expedition/publiques', async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.vendeurId);
    const result = await pool.query(
      `SELECT * FROM vendeur_methodes_expedition WHERE vendeur_id = $1 AND actif = true ORDER BY transporteur_id`,
      [vendeurId]
    );
    const methodes = result.rows.map(enrichirMethode);
    res.json(methodes.length > 0 ? methodes : [FREE_SHIPPING_FALLBACK]);
  } catch (err) {
    console.error('❌ GET /publiques:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /produit/:produitId/methodes — méthodes d'un produit spécifique
router.get('/produit/:produitId/methodes', async (req, res) => {
  try {
    const produitId = parseInt(req.params.produitId);
    const result = await pool.query(
      `SELECT vme.*
       FROM produit_methodes_expedition pme
       JOIN vendeur_methodes_expedition vme ON vme.id = pme.methode_id
       WHERE pme.produit_id = $1 AND vme.actif = true
       ORDER BY vme.frais_fixes ASC NULLS LAST`,
      [produitId]
    );
    const methodes = result.rows.map(enrichirMethode);
    res.json({ methodes: methodes.length > 0 ? methodes : [FREE_SHIPPING_FALLBACK] });
  } catch (err) {
    console.error('❌ GET /produit/:id/methodes:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /:vendeurId/methodes-expedition
router.get('/:vendeurId/methodes-expedition', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const tableCheck = await pool.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendeur_methodes_expedition');
        `);
        if (!tableCheck.rows[0].exists) {
            console.log('⚠️ Table vendeur_methodes_expedition n\'existe pas encore');
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT * FROM vendeur_methodes_expedition WHERE vendeur_id = $1 ORDER BY transporteur_id`,
            [vendeurId]
        );
        console.log(`📦 ${result.rows.length} méthodes d'expédition récupérées pour le vendeur ${vendeurId}`);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/methodes-expedition:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:vendeurId/methodes-expedition
router.put('/:vendeurId/methodes-expedition', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const { methodes } = req.body;
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });
        if (!methodes || !Array.isArray(methodes)) return res.status(400).json({ error: 'Données invalides' });

        await client.query('BEGIN');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendeur_methodes_expedition (
                id SERIAL PRIMARY KEY,
                vendeur_id INTEGER NOT NULL REFERENCES vendeurs(id) ON DELETE CASCADE,
                transporteur_id INTEGER NOT NULL,
                actif BOOLEAN DEFAULT true,
                frais_fixes DECIMAL(10,2),
                frais_par_kg DECIMAL(10,2),
                delais_estime VARCHAR(100),
                gratuit_superieur DECIMAL(10,2),
                mode_calcul VARCHAR(20) DEFAULT 'fixe',
                combine_shipping BOOLEAN DEFAULT false,
                combine_frais_fixe_unique BOOLEAN DEFAULT true,
                combine_kg_additionne BOOLEAN DEFAULT true,
                frais_zones JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vendeur_id, transporteur_id)
            )
        `);
        await client.query('DELETE FROM vendeur_methodes_expedition WHERE vendeur_id = $1', [vendeurId]);

        for (const methode of methodes) {
            await client.query(
                `INSERT INTO vendeur_methodes_expedition
                 (vendeur_id, transporteur_id, actif, frais_fixes, frais_par_kg, delais_estime, gratuit_superieur,
                  mode_calcul, combine_shipping, combine_frais_fixe_unique, combine_kg_additionne, frais_zones)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    vendeurId,
                    methode.transporteur_id,
                    methode.actif !== undefined ? methode.actif : true,
                    methode.frais_fixes !== undefined ? methode.frais_fixes : null,
                    methode.frais_par_kg || null,
                    methode.delais_estime || null,
                    methode.gratuit_superieur || null,
                    methode.mode_calcul || 'fixe',
                    methode.combine_shipping || false,
                    methode.combine_frais_fixe_unique !== false,
                    methode.combine_kg_additionne !== false,
                    methode.frais_zones ? JSON.stringify(methode.frais_zones) : null,
                ]
            );
        }
        await client.query('COMMIT');

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['METHODES_EXPEDITION_SAUVEGARDEES', req.user?.email || 'vendeur',
             JSON.stringify({ vendeur_id: vendeurId, nb_methodes: methodes.length }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`✅ ${methodes.length} méthodes d'expédition sauvegardées pour le vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Méthodes d\'expédition sauvegardées avec succès' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur PUT /:vendeurId/methodes-expedition:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /:vendeurId/commissions
router.get('/:vendeurId/commissions', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const tableCheck = await pool.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions');
        `);
        if (!tableCheck.rows[0].exists) {
            return res.json({
                commissions: [],
                stats: { total_commissions: 0, total_commissions_remboursees: 0, total_net: 0, nb_commandes: 0, nb_produits: 0 }
            });
        }

        const result = await pool.query(`
            SELECT c.id, c.vendeur_id, c.commande_id, c.no_commande, c.no_commande_evend,
                   c.date_commande, c.produit_id, c.produit_nom, c.quantite, c.prix_unitaire,
                   c.commission_unitaire, c.commission_totale_produit, c.commission_totale_admin,
                   c.commission_admin_rembourse, c.taxes_commission, c.commission_taxes,
                   c.commission_expedition, c.taux_commission, c.statut, c.rembourse, c.raison_remboursement
            FROM commissions c
            WHERE c.vendeur_id = $1
            ORDER BY c.date_commande DESC, c.id DESC
        `, [vendeurId]);

        const stats = await pool.query(`
            SELECT
                COALESCE(SUM(commission_totale_admin), 0) as total_commissions,
                COALESCE(SUM(commission_admin_rembourse), 0) as total_commissions_remboursees,
                COALESCE(SUM(commission_totale_admin) - SUM(COALESCE(commission_admin_rembourse, 0)), 0) as total_net,
                COUNT(DISTINCT commande_id) as nb_commandes,
                COUNT(*) as nb_produits
            FROM commissions WHERE vendeur_id = $1
        `, [vendeurId]);

        res.json({ commissions: result.rows, stats: stats.rows[0] });
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/commissions:', err);
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;