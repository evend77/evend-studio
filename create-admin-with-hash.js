const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('✅ Mot de passe hashé généré !');
        console.log('\n📋 COPIE CETTE COMMANDE SQL DANS pgAdmin :\n');
        console.log('-- Supprimer ancien admin (optionnel)');
        console.log("DELETE FROM admins WHERE email = 'admin@evend.ca';");
        console.log('\n-- Créer le nouvel admin');
        console.log(`INSERT INTO admins (email, mot_de_passe, nom) VALUES ('admin@evend.ca', '${hash}', 'Administrateur');`);
        console.log('\n-- Vérifier');
        console.log("SELECT * FROM admins;");
        
    } catch (err) {
        console.error('❌ Erreur:', err);
    }
}

createAdmin();
