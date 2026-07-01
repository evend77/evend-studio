import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  BlockStack,
  Text,
  Tabs,
  TextField,
  Button,
  Banner,
  InlineStack,
  Box,
  Divider,
  Link,
  Icon,
  Badge,
  Select,
  Modal,
  Spinner,
  Tooltip,
} from '@shopify/polaris';
import {
  ExternalIcon,
  ConnectIcon,
  RefreshIcon,
  InfoIcon,
} from '@shopify/polaris-icons';

// Types pour les connexions (affichage seulement - sans tokens)
interface StoreConnection {
  id: number;
  vendor_id: string;
  platform: string;
  store_url: string;
  store_name: string;
  email?: string;
  sync_status: 'syncing' | 'ok' | 'error' | 'pending';
  last_sync: string | null;
  products_count: number;
  orders_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Type pour le formulaire de nouvelle connexion (avec les champs sensibles)
interface NewConnectionForm {
  platform: string;
  store_url: string;
  store_name: string;
  email: string;
  api_key: string;
  api_secret: string;
  seller_id: string;
  marketplace_id: string;
  region: string;
}

// Props du composant
interface ConnecterBoutiqueProps {
  onRetour?: () => void;
  vendorId: string;
}

// Logos des plateformes
const platformLogos: Record<string, { emoji: string, color: string }> = {
  shopify: { emoji: '🛍️', color: '#7AB55C' },
  ebay: { emoji: '📦', color: '#E53238' },
  amazon: { emoji: '📚', color: '#FF9900' },
  etsy: { emoji: '🧶', color: '#F56400' },
  woocommerce: { emoji: '🛒', color: '#96588A' },
  magento: { emoji: '⚡', color: '#F26322' },
  bigcommerce: { emoji: '🏪', color: '#1B1F23' },
  square: { emoji: '💳', color: '#0070E0' },
  squarespace: { emoji: '📐', color: '#000000' },
  linnworks: { emoji: '📊', color: '#00A1E0' },
  soopos: { emoji: '💵', color: '#4CAF50' },
  dytel: { emoji: '🖥️', color: '#2196F3' },
};

export default function ConnecterBoutique({ onRetour, vendorId }: ConnecterBoutiqueProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('marketplace');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalDeconnexion, setModalDeconnexion] = useState(false);
  const [connexionADeconnecter, setConnexionADeconnecter] = useState<StoreConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<number | null>(null);
  const [connections, setConnections] = useState<StoreConnection[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Nouvelle connexion en cours - utilise le type séparé
  const [newConnection, setNewConnection] = useState<NewConnectionForm>({
    platform: 'shopify',
    store_url: '',
    store_name: '',
    email: '',
    api_key: '',
    api_secret: '',
    seller_id: '',
    marketplace_id: '',
    region: 'US',
  });

  // Vérifier si le formulaire est valide pour désactiver le bouton
  const isFormValid = (): boolean => {
    const platform = newConnection.platform;
    const fields = requiredFields[platform] || [];
    
    for (const field of fields) {
      if (!newConnection[field as keyof NewConnectionForm]) {
        return false;
      }
    }
    
    if (newConnection.store_url && !validateUrl(newConnection.store_url, platform)) {
      return false;
    }
    
    return true;
  };

  // Charger les connexions depuis l'API (base de données)
  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/vendor/${vendorId}/connections`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
        } else {
          const error = await response.json().catch(() => ({ message: 'Erreur chargement' }));
          throw new Error(error.message || 'Erreur chargement');
        }
      } catch (error: any) {
        console.error('Erreur chargement connexions:', error);
        setErrorMessage(error.message || 'Impossible de charger vos connexions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConnections();

    // Polling pour les statuts de synchronisation (toutes les 30 secondes)
    const interval = setInterval(() => {
      fetch(`/api/vendor/${vendorId}/connections/status`, {
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setConnections(prev => {
              const updated = [...prev];
              data.forEach((status: any) => {
                const index = updated.findIndex(c => c.id === status.id);
                if (index !== -1) {
                  updated[index] = { ...updated[index], ...status };
                }
              });
              return updated;
            });
          }
        })
        .catch(err => console.error('Erreur polling status:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, [vendorId]);

  // Catégories de plateformes
  const categories = [
    { id: 'marketplace', label: 'Marketplaces' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'pos', label: 'Points de vente (POS)' },
    { id: 'cms', label: 'CMS' },
    { id: 'erp', label: 'ERP' },
  ];

  // Liste des onglets par catégorie
  const tabsByCategory = {
    marketplace: [
      { id: 'shopify', title: 'Shopify', content: 'Shopify' },
      { id: 'ebay', title: 'eBay', content: 'eBay' },
      { id: 'amazon', title: 'Amazon', content: 'Amazon' },
      { id: 'etsy', title: 'Etsy', content: 'Etsy' },
    ],
    ecommerce: [
      { id: 'woocommerce', title: 'WooCommerce', content: 'WooCommerce' },
      { id: 'magento', title: 'Magento', content: 'Magento' },
      { id: 'bigcommerce', title: 'BigCommerce', content: 'BigCommerce' },
    ],
    pos: [
      { id: 'square', title: 'Square', content: 'Square' },
      { id: 'soopos', title: 'SooPOS', content: 'SooPOS' },
      { id: 'dytel', title: 'Dytel POS', content: 'Dytel POS' },
    ],
    cms: [
      { id: 'squarespace', title: 'Squarespace', content: 'Squarespace' },
    ],
    erp: [
      { id: 'linnworks', title: 'Linnworks', content: 'Linnworks' },
    ],
  };

  // Tous les onglets pour l'affichage (plat)
  const allTabs = Object.values(tabsByCategory).flat();

  // Onglet courant avec sécurité (évite les crashes)
  const currentTab = allTabs[selectedTab] || allTabs[0];
  const plateformeCourante = currentTab.id;
  const titrePlateforme = currentTab.title;

  // Types de connexion par plateforme
  const typesConnexion: Record<string, 'oauth' | 'apikey' | 'complex'> = {
    shopify: 'oauth',
    ebay: 'oauth',
    amazon: 'complex',
    etsy: 'oauth',
    square: 'oauth',
    woocommerce: 'apikey',
    magento: 'apikey',
    bigcommerce: 'apikey',
    squarespace: 'apikey',
    linnworks: 'apikey',
    soopos: 'apikey',
    dytel: 'apikey',
  };

  // Champs requis par plateforme
  const requiredFields: Record<string, string[]> = {
    shopify: ['store_url'],
    ebay: ['store_url'],
    amazon: ['seller_id', 'marketplace_id', 'region'],
    etsy: ['store_url'],
    square: ['store_url'],
    woocommerce: ['store_url', 'api_key', 'api_secret'],
    magento: ['store_url', 'api_key', 'api_secret'],
    bigcommerce: ['store_url', 'api_key', 'api_secret'],
    squarespace: ['store_url', 'api_key', 'api_secret'],
    linnworks: ['store_url', 'api_key', 'api_secret'],
    soopos: ['store_url', 'api_key', 'api_secret'],
    dytel: ['store_url', 'api_key', 'api_secret'],
  };

  // Validation URL plus robuste
  const validateUrl = (url: string, platform: string): boolean => {
    if (!url) return false;
    
    // Pour Shopify, validation spécifique
    if (platform === 'shopify') {
      const shopifyPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
      return shopifyPattern.test(url);
    }
    
    // Pour les autres plateformes
    const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return urlPattern.test(url);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const firstTab = tabsByCategory[value as keyof typeof tabsByCategory][0];
    if (firstTab) {
      const newIndex = allTabs.findIndex(t => t.id === firstTab.id);
      setSelectedTab(newIndex);
      setNewConnection(prev => ({ ...prev, platform: firstTab.id }));
      setFormErrors({});
    }
  };

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    const platform = allTabs[index].id;
    setNewConnection(prev => ({ ...prev, platform }));
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage('');
    setFormErrors({});
    
    for (const [cat, tabs] of Object.entries(tabsByCategory)) {
      if (tabs.some(t => t.id === platform)) {
        setSelectedCategory(cat);
        break;
      }
    }
  };

  const handleInputChange = (field: keyof NewConnectionForm, value: string) => {
    setNewConnection(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ quand l'utilisateur tape
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      store_url: 'URL de la boutique',
      api_key: 'Clé API',
      api_secret: 'Secret API',
      seller_id: 'ID vendeur',
      marketplace_id: 'ID marketplace',
      region: 'Région',
    };
    return labels[field] || field;
  };

  const getFieldHelp = (field: string, platform: string): string => {
    const helps: Record<string, Record<string, string>> = {
      amazon: {
        seller_id: "Votre identifiant unique de vendeur Amazon (ex: A123456789)",
        marketplace_id: "ID de la région (US: ATVPDKIKX0DER, CA: A2EUQ1WTGCTBG2, UK: A1F83G8C2ARO7P)",
        region: "Sélectionnez la région où vous vendez",
      },
      shopify: {
        store_url: "Format: ma-boutique.myshopify.com (sans https://)",
      },
      woocommerce: {
        api_key: "Généré dans WooCommerce → Réglages → Avancé → API REST",
        api_secret: "Gardez ce secret en sécurité, il sera chiffré",
      }
    };
    return helps[platform]?.[field] || '';
  };

  const validateChamps = (platform: string): boolean => {
    const fields = requiredFields[platform] || [];
    const errors: Record<string, string> = {};
    
    for (const field of fields) {
      if (!newConnection[field as keyof NewConnectionForm]) {
        errors[field] = `Le champ ${getFieldLabel(field)} est requis`;
      }
    }
    
    // Validation URL spécifique
    if (newConnection.store_url && !validateUrl(newConnection.store_url, platform)) {
      errors.store_url = platform === 'shopify' 
        ? 'URL Shopify invalide. Format attendu: ma-boutique.myshopify.com'
        : 'URL de boutique invalide';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnecter = async () => {
    const platform = newConnection.platform;
    
    if (!validateChamps(platform)) {
      setShowError(true);
      setErrorMessage('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Vérifier si la boutique est déjà connectée
    const dejaConnectee = connections.some(c => 
      c.platform === platform && 
      c.store_url === newConnection.store_url
    );
    
    if (dejaConnectee) {
      setErrorMessage('Cette boutique est déjà connectée');
      setShowError(true);
      return;
    }

    setIsLoading(true);
    const type = typesConnexion[platform];
    
    try {
      if (type === 'oauth') {
        // Pour Shopify, validation supplémentaire
        if (platform === 'shopify' && !newConnection.store_url?.includes('myshopify.com')) {
          setErrorMessage('URL Shopify doit être au format: ma-boutique.myshopify.com');
          setShowError(true);
          setIsLoading(false);
          return;
        }
        
        const cleanUrl = newConnection.store_url?.replace('https://', '').replace('http://', '');
        
        // Appel API pour initier OAuth (créer une entrée dans oauth_states)
        const response = await fetch('/api/vendor/connect/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor_id: vendorId,
            platform,
            store_url: cleanUrl,
            store_name: newConnection.store_name,
          }),
        });
        
        if (response.ok) {
          const { auth_url } = await response.json();
          // Sauvegarder l'état actuel dans sessionStorage pour le restaurer après OAuth
          sessionStorage.setItem('oauth_pending', JSON.stringify({
            platform,
            timestamp: Date.now()
          }));
          window.location.href = auth_url;
        } else {
          const error = await response.json().catch(() => ({ message: 'Erreur initiation OAuth' }));
          throw new Error(error.message || 'Erreur initiation OAuth');
        }
      } else {
        // Connexion API Key (WooCommerce, Magento, etc.)
        const response = await fetch('/api/vendor/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor_id: vendorId,
            ...newConnection,
          }),
        });
        
        if (response.ok) {
          const newStore = await response.json();
          setConnections(prev => [...prev, newStore]);
          setShowSuccess(true);
          setShowError(false);
          setErrorMessage('Boutique connectée avec succès!');
          
          // Reset form
          setNewConnection({
            platform: platform,
            store_url: '',
            store_name: '',
            email: '',
            api_key: '',
            api_secret: '',
            seller_id: '',
            marketplace_id: '',
            region: 'US',
          });
          setFormErrors({});
        } else {
          const error = await response.json().catch(() => ({ message: 'Erreur connexion' }));
          throw new Error(error.message || 'Erreur connexion');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur lors de la connexion');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (connectionId: number) => {
    setIsSyncing(connectionId);
    try {
      const response = await fetch(`/api/vendor/sync/${connectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId }),
      });
      
      if (response.ok) {
        // Mettre à jour le statut de la connexion
        setConnections(prev => prev.map(c => 
          c.id === connectionId 
            ? { ...c, sync_status: 'syncing' } 
            : c
        ));
        
        // Note: La vraie mise à jour viendra via le polling
      } else {
        const error = await response.json().catch(() => ({ message: 'Erreur synchronisation' }));
        throw new Error(error.message || 'Erreur synchronisation');
      }
    } catch (error: any) {
      setConnections(prev => prev.map(c => 
        c.id === connectionId 
          ? { ...c, sync_status: 'error', error_message: error.message || 'Échec de synchronisation' } 
          : c
      ));
      setIsSyncing(null);
    }
  };

  const confirmerDeconnexion = async () => {
    if (!connexionADeconnecter) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connexionADeconnecter.id,
          vendor_id: vendorId,
        }),
      });
      
      if (response.ok) {
        setConnections(prev => prev.filter(c => c.id !== connexionADeconnecter.id));
        fermerModalDeconnexion();
        setShowSuccess(true);
        setErrorMessage('Boutique déconnectée avec succès');
      } else {
        const error = await response.json().catch(() => ({ message: 'Erreur déconnexion' }));
        throw new Error(error.message || 'Erreur déconnexion');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur lors de la déconnexion');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const ouvrirModalDeconnexion = (connexion: StoreConnection) => {
    setConnexionADeconnecter(connexion);
    setModalDeconnexion(true);
  };

  const fermerModalDeconnexion = () => {
    setModalDeconnexion(false);
    setConnexionADeconnecter(null);
  };

  const getSyncStatusBadge = (status: string) => {
    switch(status) {
      case 'syncing':
        return <Badge tone="info">🔄 Synchronisation en cours</Badge>;
      case 'ok':
        return <Badge tone="success">✓ Synchronisé</Badge>;
      case 'error':
        return <Badge tone="critical">⚠ Erreur synchro</Badge>;
      default:
        return <Badge tone="info">⏳ En attente</Badge>;
    }
  };

  const typeConnexion = typesConnexion[plateformeCourante];
  const connectionsFiltrees = connections.filter(c => c.platform === plateformeCourante);
  const logo = platformLogos[plateformeCourante] || { emoji: '🔌', color: '#888' };

  const renderChampsConnexion = () => {
    if (isLoading && connections.length === 0) {
      return (
        <Box padding="400">
          <div style={{ textAlign: 'center' }}>
            <Spinner />
            <div style={{ marginTop: '16px' }}>
              <Text as="p" tone="subdued">Chargement de vos connexions...</Text>
            </div>
          </div>
        </Box>
      );
    }

    return (
      <BlockStack gap="400">
        {showSuccess && (
          <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
            <Text as="p">{errorMessage}</Text>
          </Banner>
        )}
        
        {showError && (
          <Banner tone="critical" onDismiss={() => setShowError(false)}>
            <Text as="p">{errorMessage}</Text>
          </Banner>
        )}

        {/* Afficher les boutiques déjà connectées */}
        {connectionsFiltrees.length > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">Vos boutiques connectées</Text>
              {connectionsFiltrees.map(conn => (
                <Box key={conn.id} background="bg-surface-secondary" padding="400" borderRadius="200">
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="space-between" wrap={false}>
                      <InlineStack gap="200" wrap={false}>
                        <span style={{ fontSize: '24px' }}>{platformLogos[conn.platform]?.emoji || '🔌'}</span>
                        <Text as="span" fontWeight="bold">{conn.store_name || conn.store_url}</Text>
                      </InlineStack>
                      {getSyncStatusBadge(conn.sync_status)}
                    </InlineStack>
                    
                    <Text as="span" tone="subdued">{conn.store_url}</Text>
                    
                    <InlineStack gap="200" align="space-between" wrap={false}>
                      <Text as="span">Produits: {conn.products_count}</Text>
                      <Text as="span">Commandes: {conn.orders_count}</Text>
                    </InlineStack>
                    
                    {conn.sync_status === 'error' && conn.error_message && (
                      <Banner tone="critical">
                        <Text as="p">{conn.error_message}</Text>
                      </Banner>
                    )}
                    
                    <InlineStack gap="200" align="space-between" wrap={false}>
                      <Text as="span" tone="subdued">
                        Dernière sync: {conn.last_sync ? new Date(conn.last_sync).toLocaleDateString('fr-CA', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Jamais'}
                      </Text>
                      <InlineStack gap="200" wrap={false}>
                        <Tooltip content="Lancer une synchronisation manuelle">
                          <Button 
                            size="slim"
                            icon={RefreshIcon}
                            onClick={() => handleSync(conn.id)}
                            loading={isSyncing === conn.id}
                            disabled={conn.sync_status === 'syncing'}
                          >
                            Sync
                          </Button>
                        </Tooltip>
                        <Tooltip content="Déconnecter cette boutique">
                          <Button 
                            tone="critical" 
                            size="slim" 
                            onClick={() => ouvrirModalDeconnexion(conn)}
                            loading={isLoading}
                          >
                            Déconnecter
                          </Button>
                        </Tooltip>
                      </InlineStack>
                    </InlineStack>
                  </BlockStack>
                </Box>
              ))}
            </BlockStack>
          </Card>
        )}

        {/* Explication spécifique à chaque plateforme */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" wrap={false}>
              <span style={{ fontSize: '32px' }}>{logo.emoji}</span>
              <Text variant="headingMd" as="h3">
                Comment connecter votre boutique {titrePlateforme}
              </Text>
            </InlineStack>
            
            <Text as="p">
              {getExplication(plateformeCourante, typeConnexion)}
            </Text>
            
            <Divider />
            
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <Text as="p" fontWeight="bold">Étapes à suivre:</Text>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                {getEtapes(plateformeCourante, typeConnexion).map((etape, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    <Text as="span">{etape}</Text>
                  </li>
                ))}
              </ul>
            </Box>
            
            <Link url={getDocumentationUrl(plateformeCourante)} external>
              Voir la documentation complète <Icon source={ExternalIcon} />
            </Link>
          </BlockStack>
        </Card>

        {/* Formulaire de connexion */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Ajouter une nouvelle boutique {titrePlateforme}</Text>
            
            {/* Champs communs */}
            <TextField
              label="Nom de votre boutique (optionnel)"
              value={newConnection.store_name}
              onChange={(value) => handleInputChange('store_name', value)}
              placeholder={`ex: Ma Boutique ${titrePlateforme}`}
              autoComplete="off"
              helpText="Pour vous aider à identifier cette boutique"
            />
            
            {/* Pour Shopify et OAuth, on ne demande que l'URL */}
            {typeConnexion === 'oauth' && plateformeCourante === 'shopify' && (
              <TextField
                label="URL de votre boutique Shopify"
                value={newConnection.store_url}
                onChange={(value) => handleInputChange('store_url', value)}
                placeholder="ma-boutique.myshopify.com"
                autoComplete="off"
                helpText={getFieldHelp('store_url', 'shopify')}
                error={formErrors.store_url}
                requiredIndicator
              />
            )}
            
            {/* Pour les autres OAuth */}
            {typeConnexion === 'oauth' && plateformeCourante !== 'shopify' && (
              <TextField
                label="URL de votre boutique"
                value={newConnection.store_url}
                onChange={(value) => handleInputChange('store_url', value)}
                placeholder={`https://${plateformeCourante}.com/votre-boutique`}
                autoComplete="off"
                helpText="L'adresse web de votre boutique"
                error={formErrors.store_url}
                requiredIndicator
              />
            )}
            
            {/* Pour Amazon (complex) */}
            {plateformeCourante === 'amazon' && (
              <>
                <TextField
                  label="ID Vendeur Amazon"
                  value={newConnection.seller_id}
                  onChange={(value) => handleInputChange('seller_id', value)}
                  placeholder="A123456789"
                  autoComplete="off"
                  helpText={getFieldHelp('seller_id', 'amazon')}
                  error={formErrors.seller_id}
                  requiredIndicator
                />
                
                <TextField
                  label="ID Marketplace"
                  value={newConnection.marketplace_id}
                  onChange={(value) => handleInputChange('marketplace_id', value)}
                  placeholder="ATVPDKIKX0DER"
                  autoComplete="off"
                  helpText={getFieldHelp('marketplace_id', 'amazon')}
                  error={formErrors.marketplace_id}
                  requiredIndicator
                />
                
                <Select
                  label={
                    <InlineStack gap="100" wrap={false}>
                      <span>Région</span>
                      <Tooltip content="Sélectionnez la région où vous vendez">
                        <Icon source={InfoIcon} />
                      </Tooltip>
                    </InlineStack>
                  }
                  options={[
                    { label: 'États-Unis', value: 'US' },
                    { label: 'Canada', value: 'CA' },
                    { label: 'Europe', value: 'EU' },
                    { label: 'Royaume-Uni', value: 'UK' },
                  ]}
                  value={newConnection.region}
                  onChange={(value) => handleInputChange('region', value)}
                  error={formErrors.region}
                />
              </>
            )}
            
            {/* Pour API Key (WooCommerce, Magento, etc.) */}
            {typeConnexion === 'apikey' && (
              <>
                <TextField
                  label="URL de votre boutique"
                  value={newConnection.store_url}
                  onChange={(value) => handleInputChange('store_url', value)}
                  placeholder={`https://votre-boutique.com`}
                  autoComplete="off"
                  helpText="L'adresse web de votre boutique"
                  error={formErrors.store_url}
                  requiredIndicator
                />
                
                <TextField
                  label="Clé API"
                  value={newConnection.api_key}
                  onChange={(value) => handleInputChange('api_key', value)}
                  placeholder="ck_..."
                  autoComplete="off"
                  helpText={getFieldHelp('api_key', 'woocommerce')}
                  error={formErrors.api_key}
                  requiredIndicator
                />
                
                <TextField
                  label="Secret API"
                  value={newConnection.api_secret}
                  onChange={(value) => handleInputChange('api_secret', value)}
                  type="password"
                  placeholder="cs_..."
                  autoComplete="off"
                  helpText={getFieldHelp('api_secret', 'woocommerce')}
                  error={formErrors.api_secret}
                  requiredIndicator
                />
              </>
            )}
            
            {/* Email (optionnel) */}
            {typeConnexion !== 'oauth' && (
              <TextField
                label="Email du compte (optionnel)"
                value={newConnection.email}
                onChange={(value) => handleInputChange('email', value)}
                type="email"
                placeholder="votre@email.com"
                autoComplete="off"
                helpText="Pour vous aider à identifier ce compte"
              />
            )}
            
            <InlineStack gap="200">
              <Button
                variant="primary"
                onClick={handleConnecter}
                icon={ConnectIcon}
                loading={isLoading}
                disabled={!isFormValid()}
              >
                {typeConnexion === 'oauth' 
                  ? `Se connecter avec ${titrePlateforme}`
                  : `Connecter cette boutique ${titrePlateforme}`
                }
              </Button>
              
              <Button onClick={() => {
                setNewConnection({
                  platform: plateformeCourante,
                  store_url: '',
                  store_name: '',
                  email: '',
                  api_key: '',
                  api_secret: '',
                  seller_id: '',
                  marketplace_id: '',
                  region: 'US',
                });
                setFormErrors({});
              }}>
                Effacer
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    );
  };

  return (
    <Page
      title="Connecter votre boutique"
      subtitle="Synchronisez votre boutique e-Vend avec vos autres plateformes de vente"
      backAction={onRetour ? { onAction: onRetour } : undefined}
    >
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon source={ConnectIcon} />
              <Text variant="headingLg" as="h2">
                Connectez vos plateformes de vente
              </Text>
            </div>
            
            <Text as="p" tone="subdued">
              Gérez toutes vos ventes depuis un seul endroit! Connectez vos comptes 
              Shopify, Amazon, eBay et autres pour synchroniser automatiquement vos 
              produits, commandes et stocks avec votre boutique e-Vend.
            </Text>
            
            <Banner tone="info">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">💡 Pourquoi connecter vos boutiques?</Text>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><Text as="span">Gestion centralisée de tous vos produits</Text></li>
                  <li><Text as="span">Synchronisation automatique des stocks en temps réel</Text></li>
                  <li><Text as="span">Commandes regroupées dans un seul tableau de bord</Text></li>
                  <li><Text as="span">Mises à jour en masse de vos prix et descriptions</Text></li>
                  <li><Text as="span">Rapports de ventes consolidés</Text></li>
                </ul>
              </BlockStack>
            </Banner>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Select
              label="Catégorie de plateforme"
              options={categories.map(c => ({ label: c.label, value: c.id }))}
              value={selectedCategory}
              onChange={handleCategoryChange}
            />
            
            <Tabs 
              tabs={tabsByCategory[selectedCategory as keyof typeof tabsByCategory]} 
              selected={tabsByCategory[selectedCategory as keyof typeof tabsByCategory].findIndex(
                t => t.id === plateformeCourante
              ) >= 0 ? tabsByCategory[selectedCategory as keyof typeof tabsByCategory].findIndex(
                t => t.id === plateformeCourante
              ) : 0} 
              onSelect={(index) => {
                const tab = tabsByCategory[selectedCategory as keyof typeof tabsByCategory][index];
                const globalIndex = allTabs.findIndex(t => t.id === tab.id);
                handleTabChange(globalIndex);
              }} 
            />
            
            <Box padding={{ xs: '200', sm: '400' }}>
              {renderChampsConnexion()}
            </Box>
          </BlockStack>
        </Card>
      </BlockStack>

      {/* Modal de confirmation de déconnexion */}
      <Modal
        open={modalDeconnexion}
        onClose={fermerModalDeconnexion}
        title="Confirmer la déconnexion"
        primaryAction={{
          content: 'Déconnecter',
          destructive: true,
          onAction: confirmerDeconnexion,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: 'Annuler',
            onAction: fermerModalDeconnexion,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="warning">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">⚠️ Attention : Cette action est irréversible</Text>
              </BlockStack>
            </Banner>
            
            <Text as="p">
              Vous êtes sur le point de déconnecter la boutique suivante :
            </Text>
            
            {connexionADeconnecter && (
              <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <InlineStack gap="200" align="space-between">
                    <Text as="span" fontWeight="bold">Boutique:</Text>
                    <Text as="span">{connexionADeconnecter.store_name || connexionADeconnecter.store_url}</Text>
                  </InlineStack>
                  <InlineStack gap="200" align="space-between">
                    <Text as="span" fontWeight="bold">Plateforme:</Text>
                    <Badge>{connexionADeconnecter.platform}</Badge>
                  </InlineStack>
                  <InlineStack gap="200" align="space-between">
                    <Text as="span" fontWeight="bold">URL:</Text>
                    <Text as="span">{connexionADeconnecter.store_url}</Text>
                  </InlineStack>
                  {connexionADeconnecter.sync_status === 'error' && (
                    <Banner tone="critical">
                      <Text as="p">⚠ Cette boutique a des erreurs de synchronisation</Text>
                    </Banner>
                  )}
                </BlockStack>
              </Box>
            )}
            
            <Divider />
            
            <Text variant="headingMd" as="h3">Ce que ça implique :</Text>
            
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <Text as="span" fontWeight="bold">❌ Fin de la synchronisation</Text>
                <Text as="p" tone="subdued">Les produits et commandes ne seront plus synchronisés automatiquement</Text>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Text as="span" fontWeight="bold">📦 Produits existants</Text>
                <Text as="p" tone="subdued">Les {connexionADeconnecter?.products_count || 0} produits déjà importés resteront dans votre catalogue mais ne seront plus mis à jour</Text>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Text as="span" fontWeight="bold">📊 Données historiques</Text>
                <Text as="p" tone="subdued">Les commandes déjà importées ({connexionADeconnecter?.orders_count || 0}) resteront dans votre historique</Text>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Text as="span" fontWeight="bold">🔄 Reconnexion</Text>
                <Text as="p" tone="subdued">Vous pourrez reconnecter cette boutique plus tard, mais une nouvelle synchronisation complète sera nécessaire</Text>
              </li>
            </ul>
            
            <Banner tone="critical">
              <Text as="p">
                Cette action ne supprime PAS vos produits sur {connexionADeconnecter?.platform}, 
                seulement le lien de synchronisation avec e-Vend.
              </Text>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

// Fonctions d'aide pour les explications
function getExplication(plateforme: string, type: 'oauth' | 'apikey' | 'complex'): string {
  const baseExplications: Record<string, string> = {
    shopify: "Shopify utilise OAuth. Entrez simplement l'URL de votre boutique (ex: ma-boutique.myshopify.com) et vous serez redirigé vers Shopify pour autoriser l'accès.",
    ebay: "eBay utilise OAuth. Vous serez redirigé vers eBay pour autoriser l'accès à votre compte vendeur.",
    amazon: "Amazon utilise SP-API. Vous aurez besoin de votre Seller ID et Marketplace ID disponibles dans votre compte vendeur Amazon.",
    etsy: "Etsy utilise OAuth. Vous devrez autoriser l'application e-Vend à accéder à votre boutique.",
    woocommerce: "Générez une clé API dans WooCommerce → Réglages → Avancé → API REST avec accès en lecture/écriture.",
    magento: "Créez une intégration dans l'admin Magento pour obtenir vos clés d'accès API.",
    bigcommerce: "Générez vos identifiants API dans les paramètres avancés de votre compte BigCommerce.",
    square: "Square utilise OAuth. Connectez-vous avec votre compte Square et autorisez l'accès.",
    squarespace: "Générez une clé API depuis les paramètres développeur de Squarespace.",
    linnworks: "Obtenez votre identifiant d'application et secret depuis votre compte Linnworks.",
    soopos: "Contactez le support SooPOS pour obtenir vos identifiants API.",
    dytel: "Utilisez votre clé de licence Dytel POS comme identifiant API.",
  };
  
  return baseExplications[plateforme] || "Suivez les instructions ci-dessous pour connecter votre boutique.";
}

function getEtapes(plateforme: string, type: 'oauth' | 'apikey' | 'complex'): string[] {
  if (type === 'oauth') {
    return [
      "Entrez l'URL de votre boutique",
      "Cliquez sur 'Se connecter'",
      "Autorisez l'application e-Vend sur la page de la plateforme",
      "Vous serez automatiquement redirigé après autorisation",
    ];
  }
  
  if (plateforme === 'amazon') {
    return [
      "Connectez-vous à votre compte vendeur Amazon",
      "Allez dans Paramètres → Informations sur le compte",
      "Copiez votre Seller ID",
      "Trouvez votre Marketplace ID dans la documentation Amazon",
      "Entrez les informations dans les champs ci-dessous",
    ];
  }
  
  return [
    "Générez vos clés API dans l'administration de votre plateforme",
    "Copiez les clés dans les champs ci-dessous",
    "Cliquez sur 'Connecter' pour autoriser la synchronisation",
  ];
}

function getDocumentationUrl(plateforme: string): string {
  const urls: Record<string, string> = {
    shopify: "https://shopify.dev/api/admin",
    ebay: "https://developer.ebay.com/docs",
    amazon: "https://developer.amazonservices.com/",
    etsy: "https://developers.etsy.com/",
    woocommerce: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
    magento: "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html",
    square: "https://developer.squareup.com/docs",
    squarespace: "https://developers.squarespace.com/",
    linnworks: "https://docs.linnworks.net/",
    soopos: "https://soopos.com/api-docs",
    bigcommerce: "https://developer.bigcommerce.com/",
    dytel: "https://dytel.ca/support/api",
  };
  return urls[plateforme] || "https://evend.ca/guides/connexion";
}
