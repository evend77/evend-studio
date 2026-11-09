// services/studio_domaine_perso.js
// Domaine personnalisé d'un gestionnaire — hébergement sur le VPS (Caddy + certificat SSL « on-demand »).
// Plus aucun appel à Render : rien à « ajouter » chez un fournisseur. Le gestionnaire pointe son DNS vers le VPS,
// Caddy (via /caddy/ask dans server.js) émet le certificat à la première visite.

const dns = require('dns').promises;
const https = require('https');

const IP_VPS = process.env.VPS_IP || '144.217.85.111';

/** Les adresses IPv4 du domaine (tableau vide si le DNS ne répond pas encore). */
async function adressesA(domaine) {
  try { return await dns.resolve4(domaine); } catch { return []; }
}

/** true si le site répond en HTTPS avec un certificat valide (le certificat est donc émis). */
function httpsValide(domaine) {
  return new Promise((resolve) => {
    const req = https.request({ host: domaine, port: 443, method: 'HEAD', path: '/', timeout: 6000 }, (r) => { r.resume(); resolve(true); });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Statut du domaine : 'actif' | 'en_attente' (DNS ou certificat pas prêt) | 'erreur' (DNS pointe ailleurs).
 * message = texte affiché au gestionnaire.
 */
async function verifierDomaine(domaine) {
  const ips = await adressesA(domaine);
  if (!ips.length) {
    return { statut: 'en_attente', message: `En attente du DNS : ajoutez l'enregistrement A de « ${domaine} » vers ${IP_VPS}. La propagation peut prendre jusqu'à 48 h.` };
  }
  if (!ips.includes(IP_VPS)) {
    return { statut: 'erreur', message: `Le DNS de « ${domaine} » pointe vers ${ips[0]} au lieu de ${IP_VPS}. Corrigez l'enregistrement A chez votre fournisseur de domaine.` };
  }
  if (await httpsValide(domaine)) return { statut: 'actif', message: 'Domaine actif et sécurisé (SSL valide).' };
  return { statut: 'en_attente', message: 'DNS correct ✅ — le certificat SSL est en cours de création (1 à 2 minutes). Visitez votre domaine pour accélérer le processus.' };
}

module.exports = { IP_VPS, verifierDomaine };