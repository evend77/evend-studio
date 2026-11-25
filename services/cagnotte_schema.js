// CHEMIN : services/cagnotte_schema.js
// e-Vend Studio — Cagnotte : création automatique (et sans risque) des tables au démarrage.
// Tout est "IF NOT EXISTS" : on peut le relancer autant de fois qu'on veut, il ne touche à aucune donnée existante.

'use strict';

const pool = require('../db');

const TAUX_DEFAUT = {
  AB: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  BC: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  MB: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  NB: { tps: 0, tvq: 0, tvh: 15, label: 'TVH' },
  NL: { tps: 0, tvq: 0, tvh: 15, label: 'TVH' },
  NS: { tps: 0, tvq: 0, tvh: 15, label: 'TVH' },
  NT: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  NU: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  ON: { tps: 0, tvq: 0, tvh: 13, label: 'TVH' },
  PE: { tps: 0, tvq: 0, tvh: 15, label: 'TVH' },
  QC: { tps: 5, tvq: 9.975, tvh: 0, label: 'TPS + TVQ' },
  SK: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
  YT: { tps: 5, tvq: 0, tvh: 0, label: 'TPS' },
};

const PALIERS_DEFAUT = [
  { id: 'p1', nom: 'Petite cagnotte', objectif_max: 5000, prix: 49 },
  { id: 'p2', nom: 'Cagnotte', objectif_max: 25000, prix: 99 },
  { id: 'p3', nom: 'Grande cagnotte', objectif_max: null, prix: 149 },
];

const DDL = [
  `CREATE TABLE IF NOT EXISTS cagnotte_reglages (
     id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
     paliers JSONB NOT NULL DEFAULT '[]'::jsonb,
     taxes JSONB NOT NULL DEFAULT '{}'::jsonb,
     numeros_taxes JSONB NOT NULL DEFAULT '{}'::jsonb,
     duree_max_jours INTEGER NOT NULL DEFAULT 90,
     remboursement_actif BOOLEAN NOT NULL DEFAULT true,
     remboursement_pct NUMERIC(5,2) NOT NULL DEFAULT 50,
     remboursement_auto BOOLEAN NOT NULL DEFAULT true,
     don_min NUMERIC(10,2) NOT NULL DEFAULT 1,
     don_max NUMERIC(10,2) NOT NULL DEFAULT 10000,
     devise TEXT NOT NULL DEFAULT 'CAD',
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS cagnotte_campagnes (
     id SERIAL PRIMARY KEY,
     site_id INTEGER NOT NULL,
     gestionnaire_id INTEGER NOT NULL,
     palier_id TEXT NOT NULL,
     palier_nom TEXT,
     objectif NUMERIC(12,2),
     prix NUMERIC(10,2) NOT NULL,
     taxes JSONB NOT NULL DEFAULT '{}'::jsonb,
     total NUMERIC(10,2) NOT NULL,
     devise TEXT NOT NULL DEFAULT 'CAD',
     province TEXT,
     statut TEXT NOT NULL DEFAULT 'en_attente_paiement',
     duree_max_jours INTEGER NOT NULL DEFAULT 90,
     fin_prevue TIMESTAMPTZ,
     publiee_le TIMESTAMPTZ,
     fin_le TIMESTAMPTZ,
     terminee_le TIMESTAMPTZ,
     raison_fin TEXT,
     stripe_session_id TEXT,
     stripe_payment_intent TEXT,
     stripe_env TEXT,
     anomalie TEXT,
     nb_dons_final INTEGER,
     total_dons_final NUMERIC(12,2),
     remb_statut TEXT NOT NULL DEFAULT 'aucun',
     remb_montant NUMERIC(10,2),
     remb_stripe_id TEXT,
     remb_erreur TEXT,
     remb_le TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS cagnotte_campagnes_site_idx ON cagnotte_campagnes (site_id, id DESC)`,
  `CREATE INDEX IF NOT EXISTS cagnotte_campagnes_statut_idx ON cagnotte_campagnes (statut, fin_le)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cagnotte_campagnes_session_uq ON cagnotte_campagnes (stripe_session_id) WHERE stripe_session_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS cagnotte_paiement_config (
     gestionnaire_id INTEGER PRIMARY KEY,
     sandbox BOOLEAN NOT NULL DEFAULT true,
     devise TEXT NOT NULL DEFAULT 'CAD',
     stripe_actif BOOLEAN NOT NULL DEFAULT false,
     paypal_actif BOOLEAN NOT NULL DEFAULT false,
     stripe_dev_publish_key TEXT, stripe_dev_secret_key TEXT, stripe_dev_webhook_id TEXT, stripe_dev_webhook_secret TEXT,
     stripe_prod_publish_key TEXT, stripe_prod_secret_key TEXT, stripe_prod_webhook_id TEXT, stripe_prod_webhook_secret TEXT,
     paypal_dev_client_id TEXT, paypal_dev_secret TEXT, paypal_dev_webhook_id TEXT,
     paypal_prod_client_id TEXT, paypal_prod_secret TEXT, paypal_prod_webhook_id TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS cagnotte_evenements (
     fournisseur TEXT NOT NULL,
     event_id TEXT NOT NULL,
     gestionnaire_id INTEGER,
     type TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (fournisseur, event_id)
   )`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS campagne_id INTEGER`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS mode_paiement TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS devise TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS env TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS paypal_order_id TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS anomalie TEXT`,
  `ALTER TABLE dons ADD COLUMN IF NOT EXISTS paye_le TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS dons_campagne_idx ON dons (campagne_id, statut)`,
];

let promesse = null;

// Retourne toujours la même promesse : les tables sont créées une seule fois par démarrage.
function pret() {
  if (!promesse) {
    promesse = (async () => {
      for (const sql of DDL) await pool.query(sql);
      await pool.query(
        `INSERT INTO cagnotte_reglages (id, paliers, taxes) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(PALIERS_DEFAUT), JSON.stringify(TAUX_DEFAUT)]
      );
    })().catch((e) => { promesse = null; throw e; });
  }
  return promesse;
}

module.exports = { pret, TAUX_DEFAUT, PALIERS_DEFAUT };