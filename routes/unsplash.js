const express = require('express');
const router = express.Router();

// Route : rechercher des photos
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 20 } = req.query;

    console.log('🔍 Recherche Unsplash:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Le paramètre query est requis' });
    }

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.append('query', query.trim());
    url.searchParams.append('page', parseInt(page));
    url.searchParams.append('per_page', parseInt(perPage));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.join(', ') || 'Erreur Unsplash');
    }

    const data = await response.json();
    console.log('✅ Photos trouvées:', data.results?.length || 0);
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur Unsplash:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche',
      details: error.message 
    });
  }
});

// Route : obtenir les détails d'une photo
router.get('/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://api.unsplash.com/photos/${id}`, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.join(', ') || 'Erreur Unsplash');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur Unsplash:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la photo',
      details: error.message 
    });
  }
});

// 👇 NOUVEAU : Route pour déclencher le téléchargement (requis par Unsplash)
router.post('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📥 Trigger download pour la photo:', id);

    const response = await fetch(`https://api.unsplash.com/photos/${id}/download`, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.join(', ') || 'Erreur Unsplash');
    }

    const data = await response.json();
    console.log('✅ Download trigger réussi');
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur download:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement',
      details: error.message 
    });
  }
});

module.exports = router;