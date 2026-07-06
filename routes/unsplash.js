const express = require('express');
const router = express.Router();

// 👇 CELLE-LÀ EST BONNE
const { createApi } = require('unsplash-js').default || require('unsplash-js');

const fetch = require('node-fetch');

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Rechercher des photos
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 20 } = req.query;

    console.log('🔍 Recherche Unsplash:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Le paramètre query est requis' });
    }

    const result = await unsplash.search.getPhotos({
      query: query.trim(),
      page: parseInt(page),
      perPage: parseInt(perPage),
    });

    if (result.errors) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result.response);
  } catch (error) {
    console.error('Erreur Unsplash:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Obtenir les détails d'une photo
router.get('/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await unsplash.photos.get({
      photoId: id,
    });

    if (result.errors) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result.response);
  } catch (error) {
    console.error('Erreur Unsplash:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la photo' });
  }
});

module.exports = router;