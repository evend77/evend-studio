const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:alex123@localhost:5432/ma_boutique'
});

async function hashExistingPasswords() {
    try {
        console.log('🔐 Hashage des mots de passe...');
        
        // 1. Vérifier les tables existantes
        const tables = ['admins', 'vendeurs', 'acheteurs'];
        
        for (const table of tables) {
            try {
                // Vérifier si la table existe
                const tableExists = await pool.query(
                    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
                    [table]
                );
                
                if (!tableExists.rows[0].exists) {
                    console.log(`⚠️ Table ${table} n'existe pas, ignorée`);
                    continue;
                }
                
                // Récupérer les utilisateurs avec mot de passe non nul
                const result = await pool.query(
                    `SELECT id, mot_de_passe FROM ${table} WHERE mot_de_passe IS NOT NULL`
                );
                
                console.log(`📊 ${table}: ${result.rows.length} utilisateurs trouvés`);
                
                for (const user of result.rows) {
                    // Vérifier si le mot de passe est déjà hashé (commence par $2b$)
                    if (user.mot_de_passe && !user.mot_de_passe.startsWith('$2b$')) {
                        const hash = await bcrypt.hash(user.mot_de_passe, 10);
                        await pool.query(
                            `UPDATE ${table} SET mot_de_passe = $1 WHERE id = $2`,
                            [hash, user.id]
                        );
                        console.log(`✅ ${table} ID ${user.id} hashé`);
                    } else if (user.mot_de_passe && user.mot_de_passe.startsWith('$2b$')) {
                        console.log(`⏭️ ${table} ID ${user.id} déjà hashé, ignoré`);
                    }
                }
                
            } catch (err) {
                console.error(`❌ Erreur sur la table ${table}:`, err.message);
            }
        }
        
        console.log('🎉 Traitement terminé !');
        
        // Vérification finale
        console.log('\n📋 Vérification finale :');
        for (const table of tables) {
            try {
                const result = await pool.query(
                    `SELECT id, email, 
                        CASE 
                            WHEN mot_de_passe IS NULL THEN 'NULL'
                            WHEN mot_de_passe LIKE '$2b$%' THEN 'HASHÉ'
                            ELSE 'EN CLAIR'
                        END as statut
                    FROM ${table} LIMIT 5`
                );
                if (result.rows.length > 0) {
                    console.log(`\n${table}:`);
                    result.rows.forEach(r => {
                        console.log(`  ID ${r.id} (${r.email}): ${r.statut}`);
                    });
                }
            } catch (err) {
                // Table n'existe pas, on ignore
            }
        }
        
    } catch (err) {
        console.error('❌ Erreur générale:', err);
    } finally {
        await pool.end();
    }
}

hashExistingPasswords();
