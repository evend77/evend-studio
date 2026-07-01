// routes/boutiques.js
// Gestion des boutiques créées avec e-Vend Studio

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// 📋 MODÈLE DE DONNÉES (temporaire - à remplacer par BD)
// =====================================================================

// Stockage temporaire des boutiques (en mémoire)
let BOUTIQUES = [
  {
    id: 1,
    user_id: 1,
    user_email: 'demo@evend.studio',
    template_id: 5,
    template_nom: 'Boutique Pro',
    slug: 'ma-boutique-demo',
    nom_boutique: 'Ma Boutique Demo',
    description: 'Ma belle boutique en ligne',
    domaine: 'demo.e-vend.studio',
    domaine_personnalise: null,
    logo: '/uploads/logos/demo-logo.png',
    banner: '/uploads/banners/demo-banner.jpg',
    couleurs: {
      primary: '#f5a623',
      secondary: '#000000',
      background: '#ffffff',
      text: '#333333',
      accent: '#f97316'
    },
    polices: {
      titre: 'Inter',
      corps: 'Inter'
    },
    configuration: {
      mise_en_page: 'grille',
      produits_par_page: 12,
      footer_texte: '© 2026 Ma Boutique - Tous droits réservés',
      seo: {
        meta_title: 'Ma Boutique Demo',
        meta_description: 'Découvrez mes produits'
      }
    },
    stripe_account_id: null,
    stripe_onboarding_complete: false,
    statut: 'active', // draft, active, suspended
    produits_count: 0,
    commandes_count: 0,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-05-01T14:30:00Z'
  }
];

// Compteur pour IDs
let nextId = 2;

// =====================================================================
// 🏪 ROUTES BOUTIQUES
// =====================================================================

// GET - Liste des boutiques (admin seulement)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Vérifier si admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const { statut, page = 1, limit = 20 } = req.query;
    let boutiques = [...BOUTIQUES];
    
    if (statut && statut !== 'tous') {
      boutiques = boutiques.filter(b => b.statut === statut);
    }
    
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = boutiques.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      boutiques: paginated,
      total: boutiques.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Erreur GET /api/boutiques:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Ma boutique (utilisateur connecté)
router.get('/ma-boutique', authenticateToken, async (req, res) => {
  try {
    const boutique = BOUTIQUES.find(b => b.user_id === req.user.id);
    
    if (!boutique) {
      return res.json({ success: true, boutique: null, message: 'Aucune boutique trouvée' });
    }
    
    // Ne pas exposer certaines données sensibles
    const boutiqueSecurisee = {
      ...boutique,
      stripe_account_id: boutique.stripe_account_id ? 'présent' : null
    };
    
    res.json({ success: true, boutique: boutiqueSecurisee });
  } catch (error) {
    console.error('Erreur GET /api/boutiques/ma-boutique:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Boutique par son slug (publique)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const boutique = BOUTIQUES.find(b => b.slug === slug && b.statut === 'active');
    
    if (!boutique) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    // Version publique : pas de données sensibles
    const boutiquePublique = {
      id: boutique.id,
      nom_boutique: boutique.nom_boutique,
      description: boutique.description,
      slug: boutique.slug,
      domaine: boutique.domaine_personnalise || boutique.domaine,
      logo: boutique.logo,
      banner: boutique.banner,
      couleurs: boutique.couleurs,
      polices: boutique.polices,
      configuration: boutique.configuration,
      produits_count: boutique.produits_count,
      created_at: boutique.created_at
    };
    
    res.json({ success: true, boutique: boutiquePublique });
  } catch (error) {
    console.error('Erreur GET /api/boutiques/:slug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Créer une nouvelle boutique
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      template_id,
      template_nom,
      nom_boutique,
      description,
      domaine_personnalise,
      couleurs,
      polices
    } = req.body;
    
    // Vérifier si l'utilisateur a déjà une boutique
    const existing = BOUTIQUES.find(b => b.user_id === req.user.id);
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vous avez déjà une boutique. Vous ne pouvez en créer qu\'une seule pour le moment.' 
      });
    }
    
    // Créer le slug
    const slug = nom_boutique
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Vérifier si slug existe déjà
    const slugExists = BOUTIQUES.find(b => b.slug === slug);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;
    
    const nouvelleBoutique = {
      id: nextId++,
      user_id: req.user.id,
      user_email: req.user.email,
      template_id: parseInt(template_id),
      template_nom: template_nom || 'Template Standard',
      slug: finalSlug,
      nom_boutique,
      description: description || '',
      domaine: `${finalSlug}.e-vend.studio`,
      domaine_personnalise: domaine_personnalise || null,
      logo: null,
      banner: null,
      couleurs: couleurs || {
        primary: '#f5a623',
        secondary: '#000000',
        background: '#ffffff',
        text: '#333333',
        accent: '#f97316'
      },
      polices: polices || {
        titre: 'Inter',
        corps: 'Inter'
      },
      configuration: {
        mise_en_page: 'grille',
        produits_par_page: 12,
        footer_texte: `© 2026 ${nom_boutique} - Tous droits réservés`,
        seo: {
          meta_title: nom_boutique,
          meta_description: description || `Découvrez ${nom_boutique} sur e-Vend Studio`
        }
      },
      stripe_account_id: null,
      stripe_onboarding_complete: false,
      statut: 'draft',
      produits_count: 0,
      commandes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    BOUTIQUES.push(nouvelleBoutique);
    
    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès',
      boutique: nouvelleBoutique
    });
  } catch (error) {
    console.error('Erreur POST /api/boutiques:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Mettre à jour la boutique
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    const boutique = BOUTIQUES[boutiqueIndex];
    
    // Vérifier les permissions
    if (boutique.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const {
      nom_boutique,
      description,
      logo,
      banner,
      couleurs,
      polices,
      configuration
    } = req.body;
    
    // Mettre à jour
    BOUTIQUES[boutiqueIndex] = {
      ...boutique,
      nom_boutique: nom_boutique || boutique.nom_boutique,
      description: description !== undefined ? description : boutique.description,
      logo: logo !== undefined ? logo : boutique.logo,
      banner: banner !== undefined ? banner : boutique.banner,
      couleurs: couleurs || boutique.couleurs,
      polices: polices || boutique.polices,
      configuration: configuration || boutique.configuration,
      updated_at: new Date().toISOString()
    };
    
    // Mettre à jour le slug si le nom change
    if (nom_boutique && nom_boutique !== boutique.nom_boutique) {
      const newSlug = nom_boutique
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const slugExists = BOUTIQUES.find(b => b.slug === newSlug && b.id !== id);
      BOUTIQUES[boutiqueIndex].slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      BOUTIQUES[boutiqueIndex].domaine = `${BOUTIQUES[boutiqueIndex].slug}.e-vend.studio`;
    }
    
    res.json({
      success: true,
      message: 'Boutique mise à jour',
      boutique: BOUTIQUES[boutiqueIndex]
    });
  } catch (error) {
    console.error('Erreur PUT /api/boutiques/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Supprimer la boutique
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    const boutique = BOUTIQUES[boutiqueIndex];
    
    // Vérifier permissions
    if (boutique.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    BOUTIQUES.splice(boutiqueIndex, 1);
    
    res.json({
      success: true,
      message: 'Boutique supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur DELETE /api/boutiques/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================================
// 💳 ROUTES STRIPE
// =====================================================================

// POST - Créer un compte Stripe Connect pour la boutique
router.post('/:id/stripe/connect', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutique = BOUTIQUES.find(b => b.id === id);
    
    if (!boutique) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (boutique.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // TODO: Appeler l'API Stripe Connect pour créer un compte
    // Pour l'instant, simulation
    const stripeAccountId = `acct_${Math.random().toString(36).substring(2, 15)}`;
    
    // Générer URL d'onboarding Stripe
    const onboardingUrl = `https://connect.stripe.com/setup/${stripeAccountId}`;
    
    res.json({
      success: true,
      url: onboardingUrl,
      account_id: stripeAccountId,
      message: 'Compte Stripe Connect créé'
    });
  } catch (error) {
    console.error('Erreur POST /api/boutiques/:id/stripe/connect:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Vérifier le statut du compte Stripe
router.get('/:id/stripe/status', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutique = BOUTIQUES.find(b => b.id === id);
    
    if (!boutique) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    res.json({
      success: true,
      stripe_onboarding_complete: boutique.stripe_onboarding_complete,
      stripe_account_id: boutique.stripe_account_id ? 'présent' : null,
      message: boutique.stripe_onboarding_complete 
        ? 'Compte Stripe actif' 
        : 'Configuration Stripe en attente'
    });
  } catch (error) {
    console.error('Erreur GET /api/boutiques/:id/stripe/status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook Stripe (callback après onboarding)
router.post('/webhooks/stripe/connect', async (req, res) => {
  try {
    const { account_id, user_id, status } = req.body;
    
    const boutique = BOUTIQUES.find(b => b.user_id === parseInt(user_id));
    
    if (boutique && status === 'complete') {
      boutique.stripe_account_id = account_id;
      boutique.stripe_onboarding_complete = true;
      boutique.updated_at = new Date().toISOString();
      
      console.log(`✅ Stripe Connect activé pour boutique #${boutique.id}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================================
// 📊 ROUTES STATISTIQUES
// =====================================================================

// GET - Statistiques de la boutique
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutique = BOUTIQUES.find(b => b.id === id);
    
    if (!boutique) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (boutique.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // Stats simulées (à remplacer par vraies données BD)
    const stats = {
      produits: boutique.produits_count,
      commandes: boutique.commandes_count,
      revenus: Math.floor(Math.random() * 10000),
      visiteurs: Math.floor(Math.random() * 5000),
      taux_conversion: (Math.random() * 5 + 1).toFixed(1),
      evolution: {
        produits: '+12%',
        commandes: '+8%',
        revenus: '+15%'
      },
      ventes_par_jour: [
        { jour: 'Lun', ventes: 120 },
        { jour: 'Mar', ventes: 180 },
        { jour: 'Mer', ventes: 150 },
        { jour: 'Jeu', ventes: 220 },
        { jour: 'Ven', ventes: 280 },
        { jour: 'Sam', ventes: 200 },
        { jour: 'Dim', ventes: 140 }
      ]
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur GET /api/boutiques/:id/stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================================
// 🎨 ROUTES PERSONNALISATION
// =====================================================================

// PUT - Mettre à jour les couleurs
router.put('/:id/couleurs', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { couleurs } = req.body;
    
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (BOUTIQUES[boutiqueIndex].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    BOUTIQUES[boutiqueIndex].couleurs = {
      ...BOUTIQUES[boutiqueIndex].couleurs,
      ...couleurs
    };
    BOUTIQUES[boutiqueIndex].updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Couleurs mises à jour',
      couleurs: BOUTIQUES[boutiqueIndex].couleurs
    });
  } catch (error) {
    console.error('Erreur PUT /api/boutiques/:id/couleurs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Mettre à jour le logo
router.post('/:id/logo', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { logo_url } = req.body;
    
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (BOUTIQUES[boutiqueIndex].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    BOUTIQUES[boutiqueIndex].logo = logo_url;
    BOUTIQUES[boutiqueIndex].updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Logo mis à jour',
      logo: logo_url
    });
  } catch (error) {
    console.error('Erreur POST /api/boutiques/:id/logo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================================
// 🚀 ROUTES PUBLICATION
// =====================================================================

// POST - Publier la boutique (passer de draft à active)
router.post('/:id/publier', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (BOUTIQUES[boutiqueIndex].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // Vérifier que la boutique a au moins un produit
    if (BOUTIQUES[boutiqueIndex].produits_count === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ajoutez au moins un produit avant de publier votre boutique' 
      });
    }
    
    BOUTIQUES[boutiqueIndex].statut = 'active';
    BOUTIQUES[boutiqueIndex].updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Boutique publiée avec succès !',
      url: `https://${BOUTIQUES[boutiqueIndex].domaine_personnalise || BOUTIQUES[boutiqueIndex].domaine}`
    });
  } catch (error) {
    console.error('Erreur POST /api/boutiques/:id/publier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Mettre en pause la boutique
router.post('/:id/suspendre', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const boutiqueIndex = BOUTIQUES.findIndex(b => b.id === id);
    
    if (boutiqueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Boutique non trouvée' });
    }
    
    if (BOUTIQUES[boutiqueIndex].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    BOUTIQUES[boutiqueIndex].statut = 'suspended';
    BOUTIQUES[boutiqueIndex].updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Boutique mise en pause'
    });
  } catch (error) {
    console.error('Erreur POST /api/boutiques/:id/suspendre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;