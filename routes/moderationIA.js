// routes/moderationIA.js
// Appelle l'endpoint de modération OpenAI (gratuit) — omni-moderation-latest.
// N'est appelé QUE si le toggle "Vérification IA" est activé (voir configuration_moderation).
// En cas d'erreur (clé manquante, API down, etc.), on ne bloque JAMAIS l'upload —
// on retombe simplement sur la file d'attente manuelle habituelle.

async function verifierModerationIA(urlImage, texte) {
  if (!process.env.OPENAI_API_KEY) {
    return { erreur: true, message: 'OPENAI_API_KEY non configurée sur le serveur' };
  }

  try {
    const contenu = [{ type: 'image_url', image_url: { url: urlImage } }];
    if (texte && texte.trim()) {
      contenu.push({ type: 'text', text: texte.trim() });
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: contenu,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { erreur: true, message: `OpenAI a répondu ${response.status}: ${errText}` };
    }

    const data = await response.json();
    const resultat = data.results?.[0];
    if (!resultat) {
      return { erreur: true, message: 'Réponse OpenAI inattendue (pas de résultat)' };
    }

    return {
      erreur: false,
      flagged: resultat.flagged,
      scores: resultat.category_scores || {},
    };
  } catch (e) {
    return { erreur: true, message: e.message };
  }
}

// Compare les scores obtenus aux seuils configurés — retourne true si une pub
// doit être rejetée automatiquement (cas évidents seulement, pas un filtre fin).
function doitEtreRejetee(scores, seuils) {
  const correspondances = {
    sexual: seuils.seuil_sexuel,
    violence: seuils.seuil_violence,
    'self-harm': seuils.seuil_automutilation,
  };
  for (const [categorie, seuil] of Object.entries(correspondances)) {
    if ((scores[categorie] || 0) >= parseFloat(seuil)) return true;
  }
  return false;
}

module.exports = { verifierModerationIA, doitEtreRejetee };