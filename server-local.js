// server-local.js - Version allégée pour le développement local
require('dotenv').config();

// Désactiver les crons
process.env.DISABLE_CRONS = 'true';
process.env.DISABLE_SHOPIFY_SYNC = 'true';

// Lancer le serveur normal
require('./server.js');