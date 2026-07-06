const express = require('express');
const router = express.Router();
const axios = require('axios'); // 👈 Installe axios si pas déjà fait : npm install axios

// Route : rechercher des photos
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 20 } = req.query;

    console.log('🔍 Recherche Unsplash:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Le paramètre query est requis' });
    }

    // 👇 APPEL DIRECT À L'API UNSPLASH (sans leur package)
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query.trim(),
        page: parseInt(page),
        per_page: parseInt(perPage),
      },
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    console.log('✅ Photos trouvées:', response.data.results?.length || 0);

    // Retourner les données comme avant
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erreur Unsplash:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche',
      details: error.response?.data?.errors || error.message 
    });
  }
});

// Route : obtenir les détails d'une photo
router.get('/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`https://api.unsplash.com/photos/${id}`, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Erreur Unsplash:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la photo',
      details: error.response?.data?.errors || error.message 
    });
  }
});

module.exports = router;