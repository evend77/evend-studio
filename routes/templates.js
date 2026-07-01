// routes/templates.js
// Gestion des templates pour e-Vend Studio

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// 📋 DONNÉES DE BASE (à déplacer en BD plus tard)
// =====================================================================

const TEMPLATES_DATA = [
  // === SITES VITRINE (non transactionnels) ===
  { id: 1, nom: 'Minimaliste', slug: 'minimaliste', type: 'base', prix: 0, rating: 98, nouveau: true, image_apercu: '/images/templates/minimaliste.jpg', demo_url: '/demo/minimaliste', categorie: 'Artisanat', description: 'Design épuré pour portfolio et présentation. Parfait pour les artistes et créateurs.', fonctionnalites: ['Responsive', 'SEO optimisé', 'Galerie photo', 'Formulaire contact'] },
  { id: 2, nom: 'Studio Créa', slug: 'studio-crea', type: 'base', prix: 0, rating: 96, nouveau: false, image_apercu: '/images/templates/studio-crea.jpg', demo_url: '/demo/studio-crea', categorie: 'Art', description: 'Ambiance créative avec mise en valeur des visuels. Idéal pour les portfolios.', fonctionnalites: ['Masonry grid', 'Animations', 'Dark mode', 'Typographie personnalisable'] },
  { id: 3, nom: 'Élégance', slug: 'elegance', type: 'base', prix: 0, rating: 94, nouveau: false, image_apercu: '/images/templates/elegance.jpg', demo_url: '/demo/elegance', categorie: 'Mode', description: 'Design élégant pour vitrines et présentations haut de gamme.', fonctionnalites: ['Slider fullwidth', 'Effets parallaxe', 'Polices Google', 'Intégration Instagram'] },
  { id: 4, nom: 'Nature & Co', slug: 'nature-co', type: 'base', prix: 0, rating: 92, nouveau: true, image_apercu: '/images/templates/nature-co.jpg', demo_url: '/demo/nature-co', categorie: 'Jardin', description: 'Ambiance naturelle et apaisante pour produits bio et bien-être.', fonctionnalites: ['Palette de verts', 'Icônes nature', 'Blog intégré', 'Newsletter'] },
  
  // === BOUTIQUES EN LIGNE (transactionnels) ===
  { id: 5, nom: 'Boutique Pro', slug: 'boutique-pro', type: 'transactionnel', prix: 29, rating: 99, nouveau: false, image_apercu: '/images/templates/boutique-pro.jpg', demo_url: '/demo/boutique-pro', categorie: 'Commerce', description: 'Panier d\'achat complet et paiements intégrés. Solution professionnelle.', fonctionnalites: ['Panier', 'Stripe connecté', 'Gestion stock', 'Livraison calculée', 'Factures auto'] },
  { id: 6, nom: 'Marketplace', slug: 'marketplace', type: 'transactionnel', prix: 49, rating: 97, nouveau: true, image_apercu: '/images/templates/marketplace.jpg', demo_url: '/demo/marketplace', categorie: 'Multi-vendeurs', description: 'Plateforme multi-vendeurs avec commissions automatiques.', fonctionnalites: ['Multi-vendeurs', 'Commission auto', 'Messagerie', 'Système avis', 'Dashboard vendeur'] },
  { id: 7, nom: 'Luxe & Chic', slug: 'luxe-chic', type: 'transactionnel', prix: 39, rating: 98, nouveau: false, image_apercu: '/images/templates/luxe-chic.jpg', demo_url: '/demo/luxe-chic', categorie: 'Mode', description: 'Design haut de gamme pour marques premium et luxe.', fonctionnalites: ['Zoom produit', 'Micro-interactions', 'Lookbook', 'Wishlist', 'Retour facile'] },
  { id: 8, nom: 'Tech Store', slug: 'tech-store', type: 'transactionnel', prix: 34, rating: 95, nouveau: true, image_apercu: '/images/templates/tech-store.jpg', demo_url: '/demo/tech-store', categorie: 'Électronique', description: 'Vitrine technologique moderne pour gadgets et électronique.', fonctionnalites: ['Comparateur', 'Filtres avancés', 'Fiche technique', 'Support chat'] },
  
  // === MONO-PRODUIT ===
  { id: 9, nom: 'Launch One', slug: 'launch-one', type: 'monoproduit', prix: 19, rating: 100, nouveau: true, image_apercu: '/images/templates/launch-one.jpg', demo_url: '/demo/launch-one', categorie: 'Lancement', description: 'Page de vente unique pour un seul produit. Parfait pour les lancements.', fonctionnalites: ['Page unique', 'Compte à rebours', 'CTA optimisé', 'Avis clients', 'Upsell intégré'] },
  { id: 10, nom: 'Capsule', slug: 'capsule', type: 'monoproduit', prix: 15, rating: 98, nouveau: false, image_apercu: '/images/templates/capsule.jpg', demo_url: '/demo/capsule', categorie: 'Produit', description: 'Design épuré focus produit avec storytelling.', fonctionnalites: ['Storytelling', 'Video intégrée', 'Preuve sociale', 'Garantie satisfait'] },
  { id: 11, nom: 'Événementiel', slug: 'evenementiel', type: 'monoproduit', prix: 25, rating: 96, nouveau: true, image_apercu: '/images/templates/evenementiel.jpg', demo_url: '/demo/evenementiel', categorie: 'Événements', description: 'Billetterie et réservations intégrées pour événements.', fonctionnalites: ['Billetterie', 'Réservations', 'Gestion places', 'QR codes', 'Rappels email'] },
  
  // === ENCHÈRES ===
  { id: 12, nom: 'Auction House', slug: 'auction-house', type: 'enchere', prix: 59, rating: 97, nouveau: true, image_apercu: '/images/templates/auction-house.jpg', demo_url: '/demo/auction-house', categorie: 'Enchères', description: 'Système d\'enchères en temps réel pour ventes aux enchères.', fonctionnalites: ['Enchères live', 'Compte à rebours', 'Prix de réserve', 'Notifications push', 'Historique mises'] },
  { id: 13, nom: 'BidMaster', slug: 'bidmaster', type: 'enchere', prix: 49, rating: 94, nouveau: false, image_apercu: '/images/templates/bidmaster.jpg', demo_url: '/demo/bidmaster', categorie: 'Enchères', description: 'Plateforme d\'enchères complète avec multiples catégories.', fonctionnalites: ['Multi-catégories', 'Enchères automatiques', 'Watchlist', 'Paiements intégrés', 'Certificat authentique'] },
  { id: 14, nom: 'Art Auction', slug: 'art-auction', type: 'enchere', prix: 45, rating: 96, nouveau: true, image_apercu: '/images/templates/art-auction.jpg', demo_url: '/demo/art-auction', categorie: 'Art', description: 'Spécialisé pour œuvres d\'art avec galerie virtuelle.', fonctionnalites: ['Galerie virtuelle', 'Zoom haute résolution', 'Certificat provenance', 'Expertise intégrée', 'Commission flexible'] },
];

// Tous les secteurs disponibles
const SECTEURS = [
  'Art', 'Auto', 'Sacs', 'Beauté', 'Vêtements', 'Électronique', 'Divertissement',
  'Nourriture', 'Jardin', 'Matériel', 'Accueil', 'Bijoux', 'Enfants', 'Bureau',
  'Animaux', 'Services', 'Chaussures', 'Sport', 'Jouets', 'Bien-être'
];

// =====================================================================
// 🎨 ROUTES TEMPLATES
// =====================================================================

// GET - Liste de tous les templates avec filtres
router.get('/', async (req, res) => {
  try {
    let { type, prix, secteur, recherche, page = 1, limit = 24 } = req.query;
    
    let templates = [...TEMPLATES_DATA];
    
    // Filtre par type
    if (type && type !== 'tous') {
      templates = templates.filter(t => t.type === type);
    }
    
    // Filtre par prix
    if (prix === 'gratuit') {
      templates = templates.filter(t => t.prix === 0);
    } else if (prix === 'payant') {
      templates = templates.filter(t => t.prix > 0);
    }
    
    // Filtre par secteur
    if (secteur && secteur !== 'tous') {
      templates = templates.filter(t => t.categorie === secteur);
    }
    
    // Filtre par recherche
    if (recherche) {
      const searchLower = recherche.toLowerCase();
      templates = templates.filter(t => 
        t.nom.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower) ||
        t.categorie.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTemplates = templates.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      templates: paginatedTemplates,
      total: templates.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(templates.length / parseInt(limit)),
      secteurs: SECTEURS,
      types: [
        { value: 'tous', label: 'Tous les types' },
        { value: 'base', label: 'Site vitrine' },
        { value: 'transactionnel', label: 'Boutique en ligne' },
        { value: 'monoproduit', label: 'Mono-produit' },
        { value: 'enchere', label: 'Plateforme enchères' }
      ]
    });
  } catch (error) {
    console.error('Erreur GET /api/templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Template par ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = TEMPLATES_DATA.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    
    // Templates similaires (même type ou même catégorie)
    const similaires = TEMPLATES_DATA
      .filter(t => t.id !== id && (t.type === template.type || t.categorie === template.categorie))
      .slice(0, 3);
    
    res.json({
      success: true,
      template,
      similaires,
      stats: {
        boutiques_actives: Math.floor(Math.random() * 500) + 50,
        avis: Math.floor(Math.random() * 200) + 20,
        satisfaction: template.rating
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Templates par type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['base', 'transactionnel', 'monoproduit', 'enchere'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Type invalide' });
    }
    
    const templates = TEMPLATES_DATA.filter(t => t.type === type);
    
    res.json({
      success: true,
      templates,
      total: templates.length,
      typeLabel: {
        base: 'Sites vitrine',
        transactionnel: 'Boutiques en ligne',
        monoproduit: 'Mono-produit',
        enchere: 'Plateformes d\'enchères'
      }[type]
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/type/:type:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Templates populaires (pour page d'accueil)
router.get('/populaires/limit/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 8;
    
    // Trier par rating et prendre les meilleurs
    const populaires = [...TEMPLATES_DATA]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
    
    res.json({
      success: true,
      templates: populaires,
      total: populaires.length
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/populaires:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Nouveaux templates
router.get('/nouveaux/limit/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 4;
    
    const nouveaux = TEMPLATES_DATA
      .filter(t => t.nouveau)
      .slice(0, limit);
    
    res.json({
      success: true,
      templates: nouveaux,
      total: nouveaux.length
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/nouveaux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Templates par catégorie
router.get('/categorie/:categorie', async (req, res) => {
  try {
    const { categorie } = req.params;
    
    const templates = TEMPLATES_DATA.filter(t => 
      t.categorie.toLowerCase() === categorie.toLowerCase()
    );
    
    res.json({
      success: true,
      templates,
      total: templates.length,
      categorie
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/categorie/:categorie:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Statistiques des templates
router.get('/stats/global', async (req, res) => {
  try {
    const stats = {
      total: TEMPLATES_DATA.length,
      parType: {
        base: TEMPLATES_DATA.filter(t => t.type === 'base').length,
        transactionnel: TEMPLATES_DATA.filter(t => t.type === 'transactionnel').length,
        monoproduit: TEMPLATES_DATA.filter(t => t.type === 'monoproduit').length,
        enchere: TEMPLATES_DATA.filter(t => t.type === 'enchere').length
      },
      gratuits: TEMPLATES_DATA.filter(t => t.prix === 0).length,
      payants: TEMPLATES_DATA.filter(t => t.prix > 0).length,
      nouveaux: TEMPLATES_DATA.filter(t => t.nouveau).length,
      noteMoyenne: (TEMPLATES_DATA.reduce((acc, t) => acc + t.rating, 0) / TEMPLATES_DATA.length).toFixed(1)
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur GET /api/templates/stats/global:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Démarrer l'installation d'un template (créer boutique)
router.post('/:id/installer', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = TEMPLATES_DATA.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    
    // Simuler création de boutique (à connecter avec la vraie BD)
    const boutique = {
      id: Math.floor(Math.random() * 1000),
      template_id: template.id,
      template_nom: template.nom,
      user_id: req.user.id,
      user_email: req.user.email,
      statut: 'en_creation',
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: `Installation du template "${template.nom}" démarrée`,
      boutique,
      prochainesEtapes: [
        'Personnalisez les couleurs et le logo',
        'Ajoutez vos produits',
        'Configurez Stripe pour les paiements',
        'Connectez votre domaine personnalisé',
        'Publiez votre boutique !'
      ]
    });
  } catch (error) {
    console.error('Erreur POST /api/templates/:id/installer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Aperçu du template (HTML/CSS/JS du démo)
router.get('/:id/apercu', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = TEMPLATES_DATA.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    
    // Envoyer les données de configuration du template pour l'aperçu
    res.json({
      success: true,
      template: {
        id: template.id,
        nom: template.nom,
        type: template.type,
        couleurs: {
          primary: '#f5a623',
          secondary: '#000000',
          background: '#ffffff',
          text: '#333333'
        },
        polices: {
          titre: 'Inter',
          corps: 'Inter'
        },
        miseEnPage: template.type === 'monoproduit' ? 'centree' : 'grille',
        fonctionnalites: template.fonctionnalites
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/:id/apercu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Sauvegarder la personnalisation d'un template
router.post('/:id/personnaliser', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = TEMPLATES_DATA.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    
    const { couleurs, polices, logo, banner, configuration } = req.body;
    
    // Sauvegarder la configuration (à connecter avec BD)
    const personnalisation = {
      template_id: id,
      user_id: req.user.id,
      couleurs: couleurs || {},
      polices: polices || {},
      logo: logo || null,
      banner: banner || null,
      configuration: configuration || {},
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Personnalisation sauvegardée',
      personnalisation
    });
  } catch (error) {
    console.error('Erreur POST /api/templates/:id/personnaliser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Variables CSS pour personnalisation en direct
router.get('/:id/variables-css', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = TEMPLATES_DATA.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    
    // Variables CSS par défaut selon le type de template
    const variables = {
      '--primary-color': '#f5a623',
      '--secondary-color': '#000000',
      '--background-color': '#ffffff',
      '--text-color': '#333333',
      '--font-family': 'Inter, sans-serif',
      '--border-radius': '8px',
      '--spacing-unit': '16px'
    };
    
    res.json({
      success: true,
      variables,
      template: template.nom
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/:id/variables-css:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Liste des secteurs disponibles
router.get('/secteurs/liste', async (req, res) => {
  try {
    res.json({
      success: true,
      secteurs: SECTEURS,
      total: SECTEURS.length
    });
  } catch (error) {
    console.error('Erreur GET /api/templates/secteurs/liste:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;