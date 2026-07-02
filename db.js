// db.js — Connexion PostgreSQL e-Vend Studio
const { Pool } = require('pg');
require('dotenv').config();

// Si DATABASE_URL est définie (cas de Render en production), on l'utilise.
// Sinon, on retombe sur les variables séparées (cas du développement local).
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // requis par Render Postgres
      max: 10,
      idleTimeoutMillis: 600000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'evend_studio',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 10,
      idleTimeoutMillis: 600000,       // 10 min avant de fermer une connexion idle
      connectionTimeoutMillis: 5000,   // 5s max pour obtenir une connexion
      keepAlive: true,                 // garde les connexions TCP vivantes
      keepAliveInitialDelayMillis: 10000,
    });

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue pool PostgreSQL:', err.message);
  // Ne pas planter le serveur — le pool se reconnecte automatiquement
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur connexion BD:', err.message);
  } else {
    console.log('✅ Connecté à e-Vend Studio DB', process.env.DATABASE_URL ? '(Render)' : '(local)');
    release();
  }
});

module.exports = pool;