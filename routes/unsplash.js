const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// 👇 APPROCHE DIFFÉRENTE POUR IMPORTER
let createApi;
try {
  const unsplashModule = require('unsplash-js');
  console.log('📦 unsplash-js chargé:', typeof unsplashModule);
  console.log('📦 Clés disponibles:', Object.keys(unsplashModule));
  
  // Essayer différentes façons d'obtenir createApi
  if (unsplashModule.default && unsplashModule.default.createApi) {
    createApi = unsplashModule.default.createApi;
  } else if (unsplashModule.createApi) {
    createApi = unsplashModule.createApi;
  } else {
    // Dernier recours : essayer avec .default
    const defaultExport = unsplashModule.default;
    if (defaultExport && typeof defaultExport === 'object') {
      createApi = defaultExport.createApi;
    }
  }
} catch (e) {
  console.error('❌ Erreur import unsplash-js:', e);
}

if (!createApi) {
  console.error('❌ createApi non trouvé !');
  // Créer un faux createApi pour éviter les crashs
  createApi = function() {
    console.error('❌ createApi est un faux (fallback)');
    return {
      search: {
        getPhotos: async () => {
          throw new Error('Unsplash API non disponible');
        }
      },
      photos: {
        get: async () => {
          throw new Error('Unsplash API non disponible');
        }
      }
    };
  };
}

// Initialiser l'API Unsplash
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Vérifier que unsplash est bien initialisé
console.log('🔑 Unsplash initialisé:', typeof unsplash);
console.log('🔑 unsplash.search existe?', typeof unsplash?.search);
console.log('🔑 unsplash.search.getPhotos existe?', typeof unsplash?.search?.getPhotos);

// Route : rechercher des photos
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 20 } = req.query;

    console.log('🔍 Recherche Unsplash:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Le paramètre query est requis' });
    }

    // Vérifier que unsplash est bien défini
    if (!unsplash || !unsplash.search || !unsplash.search.getPhotos) {
      console.error('❌ unsplash.search.getPhotos est undefined !');
      return res.status(500).json({ 
        error: 'Unsplash API non initialisée correctement',
        details: 'unsplash.search.getPhotos est undefined'
      });
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

// Route : obtenir les détails d'une photo
router.get('/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!unsplash || !unsplash.photos || !unsplash.photos.get) {
      console.error('❌ unsplash.photos.get est undefined !');
      return res.status(500).json({ 
        error: 'Unsplash API non initialisée correctement'
      });
    }

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