// routes/domaines.js
// Gestion des domaines personnalisés pour e-Vend Studio

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// 📋 MODÈLE DE DONNÉES (temporaire - à remplacer par BD)
// =====================================================================

// Domaines réservés (indisponibles)
const DOMAINES_RESERVES = [
  'evend', 'e-vend', 'evend-studio', 'admin', 'api', 'www', 'mail',
  'support', 'shop', 'store', 'boutique', 'marketplace', 'auction',
  'blog', 'app', 'dashboard', 'account', 'login', 'signup', 'register'
];

// Extensions disponibles
const EXTENSIONS_DISPONIBLES = [
  { extension: '.com', prix: 14.99, populaire: true, description: 'Classique et universel' },
  { extension: '.ca', prix: 12.99, populaire: true, description: 'Parfait pour le Canada' },
  { extension: '.net', prix: 13.99, populaire: false, description: 'Pour les réseaux et technologies' },
  { extension: '.org', prix: 13.99, populaire: false, description: 'Pour les organisations' },
  { extension: '.shop', prix: 9.99, populaire: true, description: 'Idéal pour le commerce' },
  { extension: '.store', prix: 8.99, populaire: true, description: 'Pour votre boutique' },
  { extension: '.online', prix: 4.99, populaire: false, description: 'Économique et moderne' },
  { extension: '.site', prix: 4.99, populaire: false, description: 'Simple et court' },
  { extension: '.boutique', prix: 15.99, populaire: false, description: 'Version française' },
  { extension: '.quebec', prix: 19.99, populaire: false, description: 'Fierment québécois' },
  { extension: '.design', prix: 16.99, populaire: false, description: 'Pour les créatifs' },
  { extension: '.art', prix: 18.99, populaire: false, description: 'Pour les artistes' }
];

// Domaines déjà pris
let DOMAINES_PRIS = [
  { domaine: 'ma-boutique.e-vend.studio', boutique_id: 1, user_id: 1 },
  { domaine: 'maboutique.com', boutique_id: 1, user_id: 1, externe: true }
];

// Vérifications DNS simulées
const VERIFICATIONS_DNS = {};

// =====================================================================
// 🎯 FONCTIONS UTILITAIRES
// =====================================================================

// Vérifier si un domaine est réservé
function estDomaineReserve(nom) {
  const nomLower = nom.toLowerCase();
  return DOMAINES_RESERVES.includes(nomLower) || 
         DOMAINES_RESERVES.some(reserve => nomLower.startsWith(`${reserve}-`)) ||
         nomLower.length < 3 ||
         nomLower.length > 63;
}

// Vérifier si un domaine est déjà pris
function estDomainePris(domaine, extension = '') {
  const domaineComplet = extension ? `${domaine}${extension}` : domaine;
  return DOMAINES_PRIS.some(d => d.domaine === domaineComplet);
}

// Générer suggestions de domaines
function genererSuggestions(nom, categorie = null) {
  const mots = nom.toLowerCase().split(/[\s-_]+/);
  const suggestions = [];
  
  // Nettoyer les mots
  const motsPropres = mots.filter(m => m.length > 2 && !DOMAINES_RESERVES.includes(m));
  
  if (motsPropres.length > 0) {
    // Suggestion 1: mot principal .com
    suggestions.push({
      domaine: motsPropres[0],
      extension: '.com',
      disponible: true,
      prix: 14.99,
      populaire: true
    });
    
    // Suggestion 2: mot principal .ca
    suggestions.push({
      domaine: motsPropres[0],
      extension: '.ca',
      disponible: true,
      prix: 12.99,
      populaire: true
    });
    
    // Suggestion 3: mot principal .shop
    suggestions.push({
      domaine: motsPropres[0],
      extension: '.shop',
      disponible: true,
      prix: 9.99,
      populaire: true
    });
    
    // Suggestion 4: nom complet sans espaces .com
    const nomComplet = nom.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nomComplet !== motsPropres[0]) {
      suggestions.push({
        domaine: nomComplet,
        extension: '.com',
        disponible: true,
        prix: 14.99,
        populaire: true
      });
    }
    
    // Suggestion 5: ajout de 'shop' ou 'store'
    suggestions.push({
      domaine: `${motsPropres[0]}shop`,
      extension: '.com',
      disponible: true,
      prix: 14.99,
      populaire: false
    });
    
    suggestions.push({
      domaine: `${motsPropres[0]}store`,
      extension: '.ca',
      disponible: true,
      prix: 12.99,
      populaire: false
    });
  }
  
  // Suggestions basées sur catégorie
  const categoriesSuggestions = {
    'mode': ['fashion', 'style', 'wear', 'clothing'],
    'beaute': ['beauty', 'glow', 'cosmetics', 'care'],
    'electronique': ['tech', 'gadget', 'digital', 'device'],
    'artisanat': ['craft', 'handmade', 'artisan', 'create'],
    'maison': ['home', 'deco', 'living', 'interior'],
    'jardin': ['garden', 'plant', 'nature', 'green'],
    'sport': ['sport', 'fit', 'active', 'move'],
    'alimentation': ['food', 'taste', 'eat', 'market'],
    'animaux': ['pet', 'animal', 'paw', 'fur']
  };
  
  if (categorie && categoriesSuggestions[categorie]) {
    const motsCat = categoriesSuggestions[categorie];
    if (motsPropres.length > 0) {
      suggestions.push({
        domaine: `${motsPropres[0]}${motsCat[0]}`,
        extension: '.com',
        disponible: true,
        prix: 14.99,
        populaire: false
      });
    }
  }
  
  return suggestions.slice(0, 8);
}

// Simuler vérification DNS MX
async function verifierDNSMX(domaine) {
  // Simulation - dans la réalité, appeler une API ou faire une requête DNS
  const temps = Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, temps));
  
  // Simuler 90% de disponibilité
  return Math.random() > 0.1;
}

// =====================================================================
// 🌐 ROUTES DOMAINES
// =====================================================================

// GET - Liste des extensions disponibles
router.get('/extensions', async (req, res) => {
  try {
    res.json({
      success: true,
      extensions: EXTENSIONS_DISPONIBLES
    });
  } catch (error) {
    console.error('Erreur GET /api/domaines/extensions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Vérifier disponibilité d'un domaine
router.post('/verifier', async (req, res) => {
  try {
    const { domaine, extension, verifierDNS = false } = req.body;
    
    if (!domaine) {
      return res.status(400).json({ success: false, error: 'Nom de domaine requis' });
    }
    
    const domaineNet = domaine.toLowerCase().trim();
    const extensionFinale = extension || '.com';
    const domaineComplet = `${domaineNet}${extensionFinale}`;
    
    // Vérifier format
    const domainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!domainRegex.test(domaineNet)) {
      return res.status(400).json({
        success: false,
        error: 'Nom de domaine invalide. Utilisez uniquement des lettres, chiffres et tirets.',
        disponible: false
      });
    }
    
    // Vérifier si réservé
    if (estDomaineReserve(domaineNet)) {
      return res.json({
        success: true,
        disponible: false,
        raison: 'reserve',
        message: 'Ce nom de domaine est réservé'
      });
    }
    
    // Vérifier si déjà pris
    if (estDomainePris(domaineNet, extensionFinale)) {
      return res.json({
        success: true,
        disponible: false,
        raison: 'pris',
        message: 'Ce domaine est déjà utilisé'
      });
    }
    
    // Vérification DNS supplémentaire
    let dnsValide = true;
    let dnsMessage = null;
    
    if (verifierDNS) {
      dnsValide = await verifierDNSMX(domaineComplet);
      if (!dnsValide) {
        dnsMessage = 'Le domaine semble déjà configuré ailleurs';
      }
    }
    
    // Trouver le prix
    const extensionInfo = EXTENSIONS_DISPONIBLES.find(e => e.extension === extensionFinale);
    const prix = extensionInfo ? extensionInfo.prix : 14.99;
    
    res.json({
      success: true,
      disponible: dnsValide,
      domaine: domaineComplet,
      prix,
      extension: extensionFinale,
      dns_valide: dnsValide,
      dns_message: dnsMessage,
      message: dnsValide ? 'Domaine disponible' : 'Domaine non disponible'
    });
  } catch (error) {
    console.error('Erreur POST /api/domaines/verifier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Suggérer des domaines
router.post('/suggestions', async (req, res) => {
  try {
    const { nom, categorie } = req.body;
    
    if (!nom || nom.length < 2) {
      return res.status(400).json({ success: false, error: 'Nom requis pour les suggestions' });
    }
    
    const suggestions = genererSuggestions(nom, categorie);
    
    res.json({
      success: true,
      suggestions,
      message: `${suggestions.length} suggestions générées`
    });
  } catch (error) {
    console.error('Erreur POST /api/domaines/suggestions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Acheter/enregistrer un domaine
router.post('/acheter', authenticateToken, async (req, res) => {
  try {
    const { domaine, extension, periode = 1, boutique_id } = req.body;
    
    if (!domaine || !extension) {
      return res.status(400).json({ success: false, error: 'Domaine et extension requis' });
    }
    
    const domaineComplet = `${domaine.toLowerCase().trim()}${extension}`;
    
    // Vérifier disponibilité
    const disponible = !estDomaineReserve(domaine) && !estDomainePris(domaine, extension);
    
    if (!disponible) {
      return res.status(400).json({ success: false, error: 'Domaine non disponible' });
    }
    
    const extensionInfo = EXTENSIONS_DISPONIBLES.find(e => e.extension === extension);
    const prix = (extensionInfo ? extensionInfo.prix : 14.99) * periode;
    const taxes = prix * 0.14975; // TVQ + TPS Québec
    const total = prix + taxes;
    
    // Créer un enregistrement d'achat
    const achat = {
      id: Date.now(),
      user_id: req.user.id,
      user_email: req.user.email,
      domaine: domaineComplet,
      periode,
      prix,
      taxes,
      total,
      boutique_id: boutique_id || null,
      statut: 'en_attente', // en_attente, configure, actif, expire
      date_achat: new Date().toISOString(),
      date_expiration: new Date(Date.now() + periode * 365 * 24 * 60 * 60 * 1000).toISOString(),
      config_dns: {
        a_record: null,
        cname: null,
        txt: null,
        status: 'pending'
      }
    };
    
    // Ajouter aux domaines pris
    DOMAINES_PRIS.push({
      domaine: domaineComplet,
      boutique_id: boutique_id,
      user_id: req.user.id,
      externe: false,
      achat_id: achat.id
    });
    
    res.json({
      success: true,
      achat,
      config_dns: {
        type: 'CNAME',
        valeur: `${boutique_id || 'boutique'}.e-vend.studio`,
        instructions: `Configurez votre domaine ${domaineComplet} avec un enregistrement CNAME pointant vers ${boutique_id || 'boutique'}.e-vend.studio`
      },
      total_a_payer: total.toFixed(2),
      message: 'Domaine réservé avec succès ! Configurez-le dans votre interface DNS.'
    });
  } catch (error) {
    console.error('Erreur POST /api/domaines/acheter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Mes domaines (utilisateur connecté)
router.get('/mes-domaines', authenticateToken, async (req, res) => {
  try {
    const mesDomaines = DOMAINES_PRIS.filter(d => d.user_id === req.user.id);
    
    // Enrichir avec les infos d'expiration
    const domainesEnrichis = mesDomaines.map(dom => {
      // Trouver l'achat correspondant
      const achat = null; // À connecter avec vrai BD
      return {
        domaine: dom.domaine,
        boutique_id: dom.boutique_id,
        date_achat: achat?.date_achat || new Date().toISOString(),
        date_expiration: achat?.date_expiration || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        statut: achat?.statut || 'actif',
        config_dns: achat?.config_dns || { status: 'pending' }
      };
    });
    
    res.json({
      success: true,
      domaines: domainesEnrichis,
      total: domainesEnrichis.length
    });
  } catch (error) {
    console.error('Erreur GET /api/domaines/mes-domaines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Vérifier configuration DNS d'un domaine
router.get('/verifier-config/:domaine', authenticateToken, async (req, res) => {
  try {
    const { domaine } = req.params;
    
    const domaineInfo = DOMAINES_PRIS.find(d => d.domaine === domaine && d.user_id === req.user.id);
    
    if (!domaineInfo) {
      return res.status(404).json({ success: false, error: 'Domaine non trouvé' });
    }
    
    // Simuler vérification DNS
    const configOk = await verifierDNSMX(domaine);
    
    res.json({
      success: true,
      domaine,
      configure: configOk,
      message: configOk ? 'Domaine correctement configuré' : 'Configuration DNS non détectée',
      instructions: {
        type: 'CNAME',
        cible: `${domaineInfo.boutique_id || 'boutique'}.e-vend.studio`,
        ttl: '3600'
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/domaines/verifier-config/:domaine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Mettre à jour la configuration DNS
router.post('/configurer/:domaine', authenticateToken, async (req, res) => {
  try {
    const { domaine } = req.params;
    const { record_type, record_value } = req.body;
    
    const domaineIndex = DOMAINES_PRIS.findIndex(d => d.domaine === domaine && d.user_id === req.user.id);
    
    if (domaineIndex === -1) {
      return res.status(404).json({ success: false, error: 'Domaine non trouvé' });
    }
    
    // Mettre à jour la configuration
    // Dans la vraie BD, mettre à jour les enregistrements
    
    res.json({
      success: true,
      message: 'Configuration DNS enregistrée',
      domaine,
      record_type,
      record_value
    });
  } catch (error) {
    console.error('Erreur POST /api/domaines/configurer/:domaine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Connecter un domaine existant (déjà acheté ailleurs)
router.post('/connecter-existant', authenticateToken, async (req, res) => {
  try {
    const { domaine, boutique_id } = req.body;
    
    if (!domaine) {
      return res.status(400).json({ success: false, error: 'Domaine requis' });
    }
    
    // Vérifier si déjà utilisé
    if (estDomainePris(domaine)) {
      return res.status(400).json({ success: false, error: 'Ce domaine est déjà connecté à une autre boutique' });
    }
    
    // Ajouter le domaine externe
    DOMAINES_PRIS.push({
      domaine: domaine.toLowerCase(),
      boutique_id: boutique_id || null,
      user_id: req.user.id,
      externe: true,
      date_connexion: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Domaine externe connecté avec succès',
      domaine,
      instructions: {
        type: 'CNAME',
        valeur: `${boutique_id || 'boutique'}.e-vend.studio`,
        message: 'Configurez votre domaine avec un enregistrement CNAME pointant vers e-vend.studio'
      }
    });
  } catch (error) {
    console.error('Erreur POST /api/domaines/connecter-existant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Supprimer un domaine (déconnecter)
router.delete('/:domaine', authenticateToken, async (req, res) => {
  try {
    const { domaine } = req.params;
    const domaineIndex = DOMAINES_PRIS.findIndex(d => d.domaine === domaine && d.user_id === req.user.id);
    
    if (domaineIndex === -1) {
      return res.status(404).json({ success: false, error: 'Domaine non trouvé' });
    }
    
    DOMAINES_PRIS.splice(domaineIndex, 1);
    
    res.json({
      success: true,
      message: 'Domaine déconnecté avec succès'
    });
  } catch (error) {
    console.error('Erreur DELETE /api/domaines/:domaine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Domaines populaires (pour inspiration)
router.get('/populaires', async (req, res) => {
  try {
    const domainesPopulaires = [
      { domaine: 'boutique', extension: '.shop', prix: 9.99 },
      { domaine: 'magasin', extension: '.store', prix: 8.99 },
      { domaine: 'quebec', extension: '.ca', prix: 12.99 },
      { domaine: 'artisan', extension: '.art', prix: 18.99 },
      { domaine: 'mode', extension: '.shop', prix: 9.99 },
      { domaine: 'tech', extension: '.com', prix: 14.99 },
      { domaine: 'beaute', extension: '.ca', prix: 12.99 },
      { domaine: 'maison', extension: '.boutique', prix: 15.99 },
      { domaine: 'jardin', extension: '.shop', prix: 9.99 },
      { domaine: 'vetements', extension: '.com', prix: 14.99 }
    ];
    
    res.json({
      success: true,
      domaines: domainesPopulaires
    });
  } catch (error) {
    console.error('Erreur GET /api/domaines/populaires:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Vérification rapide (pour autocomplete)
router.get('/verification-rapide/:nom', async (req, res) => {
  try {
    const { nom } = req.params;
    const extensions = ['.com', '.ca', '.shop', '.store'];
    
    const resultats = [];
    
    for (const ext of extensions) {
      const disponible = !estDomaineReserve(nom) && !estDomainePris(nom, ext);
      const extensionInfo = EXTENSIONS_DISPONIBLES.find(e => e.extension === ext);
      
      resultats.push({
        domaine: `${nom}${ext}`,
        extension: ext,
        disponible,
        prix: extensionInfo ? extensionInfo.prix : 14.99,
        populaire: extensionInfo?.populaire || false
      });
    }
    
    const disponibles = resultats.filter(r => r.disponible);
    const suggererAlternatives = disponibles.length === 0;
    
    res.json({
      success: true,
      resultats,
      disponibles_count: disponibles.length,
      suggerer_alternatives: suggererAlternatives,
      message: suggererAlternatives ? 'Aucun domaine disponible, essayez d\'autres mots-clés' : ` ${disponibles.length} domaine(s) disponible(s)`
    });
  } catch (error) {
    console.error('Erreur GET /api/domaines/verification-rapide/:nom:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;