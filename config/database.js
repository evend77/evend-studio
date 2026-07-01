const { Pool } = require('pg');

// Utiliser DATABASE_URL du .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Forcer l'encodage UTF-8 sur chaque nouvelle connexion
// Ceci permet les emojis et caracteres speciaux dans les textes JSON
pool.on('connect', (client) => {
  client.query("SET client_encoding = 'UTF8'");
});

// Test de connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erreur de connexion a la base de donnees:', err.stack);
  } else {
    console.log('Connexion a la base de donnees etablie avec succes (UTF-8)');
    release();
  }
});

module.exports = pool;