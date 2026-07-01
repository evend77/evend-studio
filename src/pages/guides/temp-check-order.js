const pool = require('./db');
pool.query(\
  SELECT id, commande_id, statut, montant, articles, date_commande, email_client 
  FROM commandes 
  ORDER BY created_at DESC 
  LIMIT 1
\).then(r => {
    console.log('?? Dernière commande enregistrée:');
    console.log(JSON.stringify(r.rows[0], null, 2));
    process.exit();
}).catch(e => { console.error(e); process.exit(); });
