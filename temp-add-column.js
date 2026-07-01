const pool = require('./db');
pool.query(\
  ALTER TABLE commandes 
  ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'pending'
\).then(() => {
    console.log('✅ Colonne statut ajoutée avec succès');
    process.exit();
}).catch(e => { console.error('❌ Erreur:', e.message); process.exit(); });
