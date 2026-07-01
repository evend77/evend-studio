const bcrypt = require('bcrypt');

async function createUsers() {
    const saltRounds = 10;
    const password = '123456'; // Mot de passe commun pour les tests
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('=== EXÉCUTE CES COMMANDES SQL DANS pgAdmin ===\n');
    
    // Admin
    console.log('-- 1. Administrateur');
    console.log(`INSERT INTO admins (email, mot_de_passe, nom) VALUES (`);
    console.log(`    'admin@evend.ca',`);
    console.log(`    '${hash}',`);
    console.log(`    'Admin Principal'`);
    console.log(`);\n`);
    
    // Vendeurs
    console.log('-- 2. Vendeurs');
    console.log(`INSERT INTO vendeurs (email, mot_de_passe, nom, nom_boutique, province, statut, sellerId) VALUES`);
    console.log(`    ('vendeur1@test.com', '${hash}', 'Jean Dupont', 'Boutique Jean', 'Québec', 'actif', 'VEN-2025-001'),`);
    console.log(`    ('vendeur2@test.com', '${hash}', 'Marie Tremblay', 'Artisanat Marie', 'Ontario', 'actif', 'VEN-2025-002'),`);
    console.log(`    ('vendeur3@test.com', '${hash}', 'Pierre Lavoie', 'Tech Pierre', 'Alberta', 'en_attente', 'VEN-2025-003');\n`);
    
    // Acheteurs
    console.log('-- 3. Acheteurs');
    console.log(`INSERT INTO acheteurs (email, mot_de_passe, nom, prenom, province) VALUES`);
    console.log(`    ('acheteur1@test.com', '${hash}', 'Martin', 'Robert', 'Québec'),`);
    console.log(`    ('acheteur2@test.com', '${hash}', 'Lefebvre', 'Sophie', 'Colombie-Britannique'),`);
    console.log(`    ('acheteur3@test.com', '${hash}', 'Gagnon', 'Julie', 'Alberta');\n`);
    
    console.log('-- 4. Vérification');
    console.log('SELECT * FROM admins;');
    console.log('SELECT * FROM vendeurs;');
    console.log('SELECT * FROM acheteurs;');
}

createUsers();
