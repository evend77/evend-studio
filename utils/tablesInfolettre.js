// utils/tablesInfolettre.js
// Crée (une seule fois, au démarrage) les deux tables de l'infolettre si elles
// n'existent pas : abonnés + journal des campagnes. Sans danger si elles existent déjà.

const pool = require('../db');

const pret = (async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS infolettre_abonnes (
      id                 SERIAL PRIMARY KEY,
      email              VARCHAR(254) NOT NULL UNIQUE,
      source             VARCHAR(50)  NOT NULL DEFAULT 'footer_accueil',
      actif              BOOLEAN      NOT NULL DEFAULT true,
      date_inscription   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      date_desabonnement TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campagnes_marketing (
      id             SERIAL PRIMARY KEY,
      sujet          TEXT        NOT NULL,
      message        TEXT        NOT NULL,
      images_apercu  JSONB       NOT NULL DEFAULT '[]',
      documents_noms JSONB       NOT NULL DEFAULT '[]',
      mode           VARCHAR(20),
      total          INTEGER     NOT NULL DEFAULT 0,
      envoyes        INTEGER     NOT NULL DEFAULT 0,
      echecs         INTEGER     NOT NULL DEFAULT 0,
      echecs_emails  JSONB       NOT NULL DEFAULT '[]',
      statut         VARCHAR(20) NOT NULL DEFAULT 'en_cours',
      date_debut     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      date_fin       TIMESTAMPTZ
    )
  `);
})().catch(err => { console.error('[infolettre] Création des tables impossible :', err.message); });

// Middleware : attend que les tables soient prêtes avant de traiter une requête.
function attendreTables(req, res, next) { pret.then(() => next(), () => next()); }

module.exports = { pret, attendreTables };