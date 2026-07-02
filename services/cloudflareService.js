// services/cloudflareService.js
// e-Vend Studio — Intégration API Cloudflare for SaaS (Custom Hostnames)
//
// Prérequis (une seule fois, dans le dashboard Cloudflare) :
//   1. DNS : CNAME "sites" -> evend-studio.onrender.com (Proxied)
//   2. SSL/TLS > Custom Hostnames : activer, définir "sites.e-vendstudio.ca"
//      comme Fallback Origin
//   3. Variables d'environnement Render :
//      CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function getCredentials() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new Error('CLOUDFLARE_API_TOKEN ou CLOUDFLARE_ZONE_ID manquant dans les variables d\'environnement.');
  }
  return { token, zoneId };
}

async function cfFetch(path, options = {}) {
  const { token, zoneId } = getCredentials();
  const res = await fetch(`${CF_API_BASE}/zones/${zoneId}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!data.success) {
    const msg = (data.errors || []).map(e => e.message).join(', ') || 'Erreur inconnue Cloudflare';
    const err = new Error(msg);
    err.cloudflareErrors = data.errors;
    throw err;
  }

  return data.result;
}

// ── Créer un Custom Hostname (domaine perso d'un client) ──────────────────
async function creerCustomHostname(hostname) {
  return cfFetch('/custom_hostnames', {
    method: 'POST',
    body: JSON.stringify({
      hostname,
      ssl: {
        method: 'http',
        type: 'dv',
        settings: { min_tls_version: '1.2' },
      },
    }),
  });
}

// ── Vérifier le statut d'un Custom Hostname ────────────────────────────────
async function statutCustomHostname(cloudflareId) {
  return cfFetch(`/custom_hostnames/${cloudflareId}`, { method: 'GET' });
}

// ── Rechercher un Custom Hostname par nom (utile si on a perdu l'ID) ──────
async function chercherCustomHostnameParNom(hostname) {
  const results = await cfFetch(`/custom_hostnames?hostname=${encodeURIComponent(hostname)}`, {
    method: 'GET',
  });
  return Array.isArray(results) && results.length ? results[0] : null;
}

// ── Supprimer un Custom Hostname (quand un client change/retire son domaine) ──
async function supprimerCustomHostname(cloudflareId) {
  return cfFetch(`/custom_hostnames/${cloudflareId}`, { method: 'DELETE' });
}

// ── Traduire le statut Cloudflare en message clair pour l'utilisateur ─────
function traduireStatut(cfResult) {
  if (!cfResult) return { statut: 'inconnu', message: 'Statut inconnu.' };

  const hostnameActive = cfResult.status === 'active';
  const sslActive = cfResult.ssl?.status === 'active';

  if (hostnameActive && sslActive) {
    return { statut: 'actif', message: '✅ Domaine actif et sécurisé (SSL valide).' };
  }
  if (cfResult.status === 'pending' || cfResult.ssl?.status === 'pending_validation') {
    return {
      statut: 'en_attente',
      message: '⏳ En attente de vérification DNS. Assurez-vous que le CNAME pointe bien vers sites.e-vendstudio.ca.',
    };
  }
  if (cfResult.status === 'blocked') {
    return { statut: 'bloque', message: '⛔ Domaine bloqué. Contactez le support.' };
  }
  return { statut: 'en_attente', message: `⏳ Statut : ${cfResult.status} / SSL : ${cfResult.ssl?.status || 'n/a'}` };
}

module.exports = {
  creerCustomHostname,
  statutCustomHostname,
  chercherCustomHostnameParNom,
  supprimerCustomHostname,
  traduireStatut,
};