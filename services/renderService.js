// services/renderService.js — e-Vend Studio
//
// Remplace cloudflareService.js pour la gestion des domaines personnalisés.
// Utilise l'API Custom Domains de Render au lieu de Cloudflare for SaaS,
// car Render héberge lui-même ses serveurs derrière Cloudflare, ce qui rend
// Cloudflare for SaaS (Custom Hostnames) incompatible (Erreur 1000 — voir
// résumé technique du 2026-07-04 si besoin de contexte).

const RENDER_API_BASE = 'https://api.render.com/v1';
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID; // ex: srv-d92iabok1i2s73eurvu0

if (!RENDER_API_KEY) {
  console.warn('⚠️  RENDER_API_KEY manquant dans les variables d\'environnement.');
}
if (!RENDER_SERVICE_ID) {
  console.warn('⚠️  RENDER_SERVICE_ID manquant dans les variables d\'environnement.');
}

function headers() {
  return {
    Authorization: `Bearer ${RENDER_API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Ajoute un domaine personnalisé au service Render.
 * @param {string} domaine — ex: "www.idee-cadeau.ca"
 * @returns {Promise<{success: boolean, domaine?: object, erreur?: string}>}
 */
async function ajouterDomainePerso(domaine) {
  try {
    const res = await fetch(`${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/custom-domains`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: domaine }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 201) {
      return { success: true, domaine: data };
    }

    if (res.status === 409) {
      return { success: false, erreur: 'Ce domaine est déjà connecté à un service Render.' };
    }

    if (res.status === 402) {
      return {
        success: false,
        erreur: 'Limite de domaines gratuits atteinte sur Render. Un domaine supplémentaire coûte 0.25$ USD/mois — vérifiez la facturation du compte Render.',
      };
    }

    return { success: false, erreur: data?.message || `Erreur Render (${res.status})` };
  } catch (err) {
    console.error('ajouterDomainePerso Render:', err);
    return { success: false, erreur: 'Erreur de connexion à l\'API Render.' };
  }
}

/**
 * Récupère le statut d'un domaine personnalisé (vérifié, certificat, etc.)
 * @param {string} domaine — le nom du domaine (Render accepte le nom ou l'ID)
 */
async function obtenirStatutDomaine(domaine) {
  try {
    const res = await fetch(
      `${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/custom-domains/${encodeURIComponent(domaine)}`,
      { headers: headers() }
    );

    if (res.status === 404) {
      return { success: false, trouve: false, erreur: 'Domaine non trouvé sur Render.' };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, erreur: data?.message || `Erreur Render (${res.status})` };
    }

    return { success: true, trouve: true, domaine: data };
  } catch (err) {
    console.error('obtenirStatutDomaine Render:', err);
    return { success: false, erreur: 'Erreur de connexion à l\'API Render.' };
  }
}

/**
 * Déclenche une nouvelle vérification DNS pour un domaine (utile si le
 * gestionnaire vient de modifier son DNS et ne veut pas attendre le polling
 * automatique de Render).
 */
async function reverifierDomaine(domaine) {
  try {
    const res = await fetch(
      `${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/custom-domains/${encodeURIComponent(domaine)}/verify`,
      { method: 'POST', headers: headers() }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, erreur: data?.message || `Erreur Render (${res.status})` };
    }

    return { success: true, domaine: data };
  } catch (err) {
    console.error('reverifierDomaine Render:', err);
    return { success: false, erreur: 'Erreur de connexion à l\'API Render.' };
  }
}

/**
 * Supprime un domaine personnalisé du service Render (ex: le gestionnaire
 * change de domaine ou annule son abonnement).
 */
async function supprimerDomainePerso(domaine) {
  try {
    const res = await fetch(
      `${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/custom-domains/${encodeURIComponent(domaine)}`,
      { method: 'DELETE', headers: headers() }
    );

    if (res.status === 204 || res.status === 200) {
      return { success: true };
    }
    if (res.status === 404) {
      // Déjà absent — on considère ça comme un succès (idempotent)
      return { success: true };
    }

    const data = await res.json().catch(() => ({}));
    return { success: false, erreur: data?.message || `Erreur Render (${res.status})` };
  } catch (err) {
    console.error('supprimerDomainePerso Render:', err);
    return { success: false, erreur: 'Erreur de connexion à l\'API Render.' };
  }
}

module.exports = {
  ajouterDomainePerso,
  obtenirStatutDomaine,
  reverifierDomaine,
  supprimerDomainePerso,
};