// src/pages/admin/ConfigurationWishList.tsx
import React, { useState, useEffect } from 'react';
import { AlertePrixInstructionsModal } from '../../components/AlertePrixInstructionsModal';

interface ConfigurationWishListProps {
  naviguerVers?: (page: string, data?: any) => void;
}

interface FeatureConfig {
  enabled: boolean;
  settings?: any;
}

interface WishListConfig {
  // Section: Affichage produit
  collectionButton: FeatureConfig & { position?: 'haut' | 'bas' | 'superposition'; styleBouton?: string };
  productPageButton: FeatureConfig & { position?: 'avantPanier' | 'apresPanier' | 'personnalise' };
  floatingButton: FeatureConfig & { position?: 'basDroite' | 'basGauche' | 'hautDroite' | 'hautGauche'; offsetX?: number; offsetY?: number };
  
  // Section: Pages et navigation
  wishlistPage: FeatureConfig & { slug?: string; elementsParPage?: number };
  wishlistHeader: FeatureConfig & { afficherCompteur?: boolean; position?: 'gauche' | 'centre' | 'droite' };
  wishlistIcon: FeatureConfig & { styleIcone?: 'coeur' | 'etoile' | 'signet'; animation?: 'aucune' | 'rebond' | 'echelle' | 'fondu'; taille?: number; couleur?: string; couleurActive?: string };
  
  // Section: Notifications contextuelles
  notifications: FeatureConfig & { 
    duree?: number; 
    position?: 'haut' | 'bas'; 
    placement?: 'basCentre' | 'basDroite' | 'basGauche' | 'hautCentre';
    animer?: boolean;
    couleurTexte?: string;
    couleurFond?: string;
    couleurErreurTexte?: string;
    couleurFondErreur?: string;
    messageAjout?: string;
    messageRetrait?: string;
    messageAjoutInvite?: string;
    messagePanierDepuisWishlist?: string;
    messageCopieLien?: string;
    messageEnregistrerPourPlusTard?: string;
    messageErreurProduit?: string;
    messageErreurWishlist?: string;
  };
  
  // Section: Invités et accès
  guestWishlist: FeatureConfig & { dureeStockage?: number; maxArticles?: number };
  disableTooltips: boolean;
  
  // Section: Personnalisation avancée
  customCss: string;
  customJs: string;
  
  // Section: Panier
  moveToWishlistFromCart: boolean;
  
  // Section: Marketing
  emailMarketing: FeatureConfig & { rappels?: boolean; alertesPrix?: boolean; retourStock?: boolean };
  
  // Section: Produits
  productVariants: boolean;
  accountPageWishlist: boolean;
  shopifyPosSync: boolean;
  
  // Section: Recommandations
  productRecommendations: FeatureConfig & { type?: 'ia' | 'manuel'; produitsManuels?: number[]; limite?: number };
  
  // Section: Alerte Prix (Price Drop)
  priceDropAlert: FeatureConfig & {
    pourcentageCible?: number;
    positionDesktop?: 'inline' | 'apresPrix' | 'avantPanier';
    positionMobile?: 'inline' | 'apresPrix' | 'avantPanier';
    offsetDesktop?: number;
    offsetMobile?: number;
    texteBouton?: string;
    couleurFondBouton?: string;
    couleurTexteBouton?: string;
    classeCSSMobile?: string;
    cssPersonnalise?: string;
    frequenceSurveillance?: 'toutesLesHeures' | 'toutesLes4Heures' | 'toutesLes8Heures' | 'toutesLes12Heures' | 'quotidienne';
    modeSurveillance?: 'auto' | 'manuel';
    envoyerNotificationAdmin?: boolean;
    alerteMultiLangue?: boolean;
    notificationPush?: boolean;
    notificationEmail?: boolean;
    // Nouveaux champs pour les styles
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  
  // Liste noire des produits pour l'alerte prix
  priceDropBlacklist: {
    produitsIds: number[];
    tags: string[];
  };
}

// Composant Switch personnalisé
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
      <input type="checkbox" checked={enabled} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: enabled ? '#2d6a9f' : '#cbd5e1',
        transition: '0.3s',
        borderRadius: '24px',
      }}>
        <span style={{
          position: 'absolute',
          height: '18px',
          width: '18px',
          left: '3px',
          bottom: '3px',
          backgroundColor: 'white',
          transition: '0.3s',
          borderRadius: '50%',
          transform: enabled ? 'translateX(20px)' : 'translateX(0)'
        }} />
      </span>
    </label>
  );
};

const ConfigurationWishList: React.FC<ConfigurationWishListProps> = ({ naviguerVers }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [blacklistProductInput, setBlacklistProductInput] = useState('');
  const [instructionsOuvertes, setInstructionsOuvertes] = useState(false);
  const [blacklistTagsInput, setBlacklistTagsInput] = useState('');
  
  const [config, setConfig] = useState<WishListConfig>({
    collectionButton: { enabled: true, position: 'bas', styleBouton: 'moderne' },
    productPageButton: { enabled: true, position: 'avantPanier' },
    floatingButton: { enabled: false, position: 'basDroite', offsetX: 20, offsetY: 80 },
    wishlistPage: { enabled: true, slug: 'liste-envies', elementsParPage: 20 },
    wishlistHeader: { enabled: true, afficherCompteur: true, position: 'droite' },
    wishlistIcon: { enabled: true, styleIcone: 'coeur', animation: 'echelle', taille: 24, couleur: '#9ca3af', couleurActive: '#ef4444' },
    notifications: { 
      enabled: true, 
      duree: 3000, 
      position: 'bas',
      placement: 'basCentre',
      animer: true,
      couleurTexte: '#ffffff',
      couleurFond: '#19af66',
      couleurErreurTexte: '#ffffff',
      couleurFondErreur: '#f84e40',
      messageAjout: 'Article ajouté à votre liste d\'envies',
      messageRetrait: 'Article retiré de votre liste d\'envies',
      messageAjoutInvite: 'Article temporairement ajouté, <a href="/account">connectez-vous</a> pour l\'enregistrer',
      messagePanierDepuisWishlist: 'Article ajouté à votre panier',
      messageCopieLien: 'Lien de la liste d\'envies copié',
      messageEnregistrerPourPlusTard: 'Article enregistré pour plus tard',
      messageErreurProduit: 'Détails du produit non trouvés',
      messageErreurWishlist: 'Liste d\'envies introuvable',
    },
    guestWishlist: { enabled: true, dureeStockage: 30, maxArticles: 50 },
    disableTooltips: false,
    customCss: '',
    customJs: '',
    moveToWishlistFromCart: true,
    emailMarketing: { enabled: false, rappels: true, alertesPrix: true, retourStock: true },
    productVariants: true,
    accountPageWishlist: false,
    shopifyPosSync: false,
    productRecommendations: { enabled: false, type: 'ia', limite: 4 },
    priceDropAlert: {
      enabled: false,
      pourcentageCible: 15,
      positionDesktop: 'apresPrix',
      positionMobile: 'inline',
      offsetDesktop: 0,
      offsetMobile: 0,
      texteBouton: 'Alerte de baisse de prix',
      couleurFondBouton: '#000000',
      couleurTexteBouton: '#ff6d37',
      classeCSSMobile: 'price-alert-button',
      cssPersonnalise: '',
      frequenceSurveillance: 'toutesLes4Heures',
      modeSurveillance: 'auto',
      envoyerNotificationAdmin: false,
      alerteMultiLangue: false,
      notificationPush: true,
      notificationEmail: true,
      // Nouveaux styles par défaut
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 0,
      marginRight: 0,
      borderRadius: 8,
      borderWidth: 0,
      borderColor: '#000000',
      fontSize: 14,
      fontWeight: '600',
    },
    priceDropBlacklist: {
      produitsIds: [],
      tags: [],
    },
  });

  // Charger la configuration depuis l'API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/wishlist/config');
        const data = await response.json();
        
        // Config par défaut complète
        const defaultConfig = {
          collectionButton: { enabled: true, position: 'bas', styleBouton: 'moderne' },
          productPageButton: { enabled: true, position: 'avantPanier' },
          floatingButton: { enabled: false, position: 'basDroite', offsetX: 20, offsetY: 80 },
          wishlistPage: { enabled: true, slug: 'liste-envies', elementsParPage: 20 },
          wishlistHeader: { enabled: true, afficherCompteur: true, position: 'droite' },
          wishlistIcon: { enabled: true, styleIcone: 'coeur', animation: 'echelle', taille: 24, couleur: '#9ca3af', couleurActive: '#ef4444' },
          notifications: { 
            enabled: true, duree: 3000, position: 'bas', placement: 'basCentre', animer: true,
            couleurTexte: '#ffffff', couleurFond: '#19af66', couleurErreurTexte: '#ffffff', couleurFondErreur: '#f84e40',
            messageAjout: 'Article ajouté à votre liste d\'envies', messageRetrait: 'Article retiré de votre liste d\'envies',
            messageAjoutInvite: 'Article temporairement ajouté, <a href="/account">connectez-vous</a> pour l\'enregistrer',
            messagePanierDepuisWishlist: 'Article ajouté à votre panier', messageCopieLien: 'Lien de la liste d\'envies copié',
            messageEnregistrerPourPlusTard: 'Article enregistré pour plus tard',
            messageErreurProduit: 'Détails du produit non trouvés', messageErreurWishlist: 'Liste d\'envies introuvable',
          },
          guestWishlist: { enabled: true, dureeStockage: 30, maxArticles: 50 },
          disableTooltips: false,
          customCss: '', customJs: '',
          moveToWishlistFromCart: true,
          emailMarketing: { enabled: false, rappels: true, alertesPrix: true, retourStock: true },
          productVariants: true, accountPageWishlist: false, shopifyPosSync: false,
          productRecommendations: { enabled: false, type: 'ia', limite: 4 },
          priceDropAlert: {
            enabled: false, pourcentageCible: 15, positionDesktop: 'apresPrix', positionMobile: 'inline',
            offsetDesktop: 0, offsetMobile: 0, texteBouton: 'Alerte de baisse de prix',
            couleurFondBouton: '#000000', couleurTexteBouton: '#ff6d37', classeCSSMobile: 'price-alert-button',
            cssPersonnalise: '', frequenceSurveillance: 'toutesLes4Heures', modeSurveillance: 'auto',
            envoyerNotificationAdmin: false, alerteMultiLangue: false,
            notificationPush: true, notificationEmail: true,
            marginTop: 10, marginBottom: 10, marginLeft: 0, marginRight: 0,
            borderRadius: 8, borderWidth: 0, borderColor: '#000000',
            fontSize: 14, fontWeight: '600',
          },
          priceDropBlacklist: { produitsIds: [], tags: [] },
        };
        
        // Fusionner les données reçues avec les valeurs par défaut
        const mergedConfig = { ...defaultConfig, ...data };
        setConfig(mergedConfig);
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement configuration:', error);
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Sauvegarder la configuration dans l'API
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/wishlist/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('✅ Configuration sauvegardée avec succès !');
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const ajouterProduitBlacklist = () => {
    if (blacklistProductInput) {
      const id = parseInt(blacklistProductInput);
      if (!isNaN(id) && !config.priceDropBlacklist.produitsIds.includes(id)) {
        setConfig({
          ...config,
          priceDropBlacklist: {
            ...config.priceDropBlacklist,
            produitsIds: [...config.priceDropBlacklist.produitsIds, id]
          }
        });
        setBlacklistProductInput('');
      }
    }
  };

  const retirerProduitBlacklist = (id: number) => {
    setConfig({
      ...config,
      priceDropBlacklist: {
        ...config.priceDropBlacklist,
        produitsIds: config.priceDropBlacklist.produitsIds.filter(p => p !== id)
      }
    });
  };

  const ajouterTagBlacklist = () => {
    if (blacklistTagsInput) {
      const tags = blacklistTagsInput.split(',').map(t => t.trim());
      const tagsExistants = [...config.priceDropBlacklist.tags];
      const nouveauxTags = tags.filter(tag => !tagsExistants.includes(tag));
      setConfig({
        ...config,
        priceDropBlacklist: {
          ...config.priceDropBlacklist,
          tags: [...tagsExistants, ...nouveauxTags]
        }
      });
      setBlacklistTagsInput('');
    }
  };

  const retirerTagBlacklist = (tag: string) => {
    setConfig({
      ...config,
      priceDropBlacklist: {
        ...config.priceDropBlacklist,
        tags: config.priceDropBlacklist.tags.filter(t => t !== tag)
      }
    });
  };

  const tabs = [
    { id: 'general', label: '📦 Général', icon: '📦' },
    { id: 'apparence', label: '🎨 Apparence', icon: '🎨' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'invites', label: '👤 Invités', icon: '👤' },
    { id: 'alertes-prix', label: '💰 Alerte Prix', icon: '💰' },
    { id: 'personnalisation', label: '🎨 CSS/JS', icon: '🎨' },
    { id: 'marketing', label: '📧 Marketing', icon: '📧' },
    { id: 'avance', label: '⚙️ Avancé', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>❤️</span>
            <span>Configuration de la Liste d'envies (Wishlist)</span>
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            Personnalisez entièrement l'expérience de la liste d'envies pour vos clients
          </p>
        </div>
        <button
          onClick={() => setInstructionsOuvertes(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #064e3b, #065f46)',
            color: 'white', fontSize: '13px', fontWeight: '700',
            boxShadow: '0 4px 12px rgba(6,78,59,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <span>📋</span>
          <span>Guide d'installation</span>
        </button>
      </div>

      <AlertePrixInstructionsModal ouvert={instructionsOuvertes} onFermer={() => setInstructionsOuvertes(false)} />

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              color: activeTab === tab.id ? '#2d6a9f' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #2d6a9f' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Contenu principal */}
        <div style={{ flex: 1 }}>
          {/* Onglet Général - Gardé identique */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Bouton collection */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>🖼️ Bouton sur les collections</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Ajoute un bouton "Liste d'envies" sur les cartes produits</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.collectionButton.enabled} 
                    onChange={() => setConfig({ ...config, collectionButton: { ...config.collectionButton, enabled: !config.collectionButton.enabled } })}
                  />
                </div>
                {config.collectionButton.enabled && (
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fefce8' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Position</label>
                      <select 
                        value={config.collectionButton.position} 
                        onChange={(e) => setConfig({ ...config, collectionButton: { ...config.collectionButton, position: e.target.value as any } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="haut">Haut de la carte</option>
                        <option value="bas">Bas de la carte</option>
                        <option value="superposition">Superposition (sur l'image)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Style du bouton</label>
                      <select 
                        value={config.collectionButton.styleBouton} 
                        onChange={(e) => setConfig({ ...config, collectionButton: { ...config.collectionButton, styleBouton: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="moderne">Moderne (arrondi)</option>
                        <option value="classique">Classique (carré)</option>
                        <option value="minimaliste">Minimaliste (icône seule)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton page produit */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>📄 Bouton sur page produit</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Affiche un bouton sur la page de détail du produit</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.productPageButton.enabled} 
                    onChange={() => setConfig({ ...config, productPageButton: { ...config.productPageButton, enabled: !config.productPageButton.enabled } })}
                  />
                </div>
                {config.productPageButton.enabled && (
                  <div style={{ padding: '16px 20px', backgroundColor: '#fefce8' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Position relative au panier</label>
                    <select 
                      value={config.productPageButton.position} 
                      onChange={(e) => setConfig({ ...config, productPageButton: { ...config.productPageButton, position: e.target.value as any } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                    >
                      <option value="avantPanier">Avant le bouton Ajouter au panier</option>
                      <option value="apresPanier">Après le bouton Ajouter au panier</option>
                      <option value="personnalise">Emplacement personnalisé (shortcode)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Page liste d'envies */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>📋 Page Liste d'envies</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Page dédiée pour voir et gérer les articles</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.wishlistPage.enabled} 
                    onChange={() => setConfig({ ...config, wishlistPage: { ...config.wishlistPage, enabled: !config.wishlistPage.enabled } })}
                  />
                </div>
                {config.wishlistPage.enabled && (
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fefce8' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Slug de la page</label>
                      <input 
                        type="text" 
                        value={config.wishlistPage.slug} 
                        onChange={(e) => setConfig({ ...config, wishlistPage: { ...config.wishlistPage, slug: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} 
                        placeholder="/liste-envies" 
                      />
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>URL: /{config.wishlistPage.slug}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Articles par page</label>
                      <input 
                        type="number" 
                        value={config.wishlistPage.elementsParPage} 
                        onChange={(e) => setConfig({ ...config, wishlistPage: { ...config.wishlistPage, elementsParPage: parseInt(e.target.value) } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} 
                        min="5" 
                        max="100" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Icône en-tête */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>🔝 Icône dans l'en-tête</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Affiche une icône avec compteur dans l'en-tête du site</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.wishlistHeader.enabled} 
                    onChange={() => setConfig({ ...config, wishlistHeader: { ...config.wishlistHeader, enabled: !config.wishlistHeader.enabled } })}
                  />
                </div>
                {config.wishlistHeader.enabled && (
                  <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', backgroundColor: '#fefce8' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={config.wishlistHeader.afficherCompteur} 
                        onChange={(e) => setConfig({ ...config, wishlistHeader: { ...config.wishlistHeader, afficherCompteur: e.target.checked } })}
                      />
                      <span style={{ fontSize: '13px' }}>Afficher le compteur</span>
                    </label>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Position</label>
                      <select 
                        value={config.wishlistHeader.position} 
                        onChange={(e) => setConfig({ ...config, wishlistHeader: { ...config.wishlistHeader, position: e.target.value as any } })}
                        style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="gauche">Gauche</option>
                        <option value="centre">Centre</option>
                        <option value="droite">Droite</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Apparence - Gardé identique */}
          {activeTab === 'apparence' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🎨 Personnalisation de l'icône</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Style et animation de l'icône Wishlist</p>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Style d'icône</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { value: 'coeur', label: '❤️ Cœur', color: '#ef4444' },
                        { value: 'etoile', label: '⭐ Étoile', color: '#fbbf24' },
                        { value: 'signet', label: '🔖 Signet', color: '#2d6a9f' },
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => setConfig({ ...config, wishlistIcon: { ...config.wishlistIcon, styleIcone: style.value as any } })}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: config.wishlistIcon.styleIcone === style.value ? '2px solid #2d6a9f' : '1px solid #e5e7eb',
                            backgroundColor: config.wishlistIcon.styleIcone === style.value ? '#eff6ff' : 'white',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Animation</label>
                    <select 
                      value={config.wishlistIcon.animation} 
                      onChange={(e) => setConfig({ ...config, wishlistIcon: { ...config.wishlistIcon, animation: e.target.value as any } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    >
                      <option value="aucune">Aucune</option>
                      <option value="rebond">Rebond</option>
                      <option value="echelle">Zoom</option>
                      <option value="fondu">Fondu</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Taille (px)</label>
                    <input 
                      type="range" 
                      min="16" 
                      max="48" 
                      value={config.wishlistIcon.taille} 
                      onChange={(e) => setConfig({ ...config, wishlistIcon: { ...config.wishlistIcon, taille: parseInt(e.target.value) } })}
                      style={{ width: '100%' }} 
                    />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{config.wishlistIcon.taille}px</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur par défaut</label>
                    <input 
                      type="color" 
                      value={config.wishlistIcon.couleur} 
                      onChange={(e) => setConfig({ ...config, wishlistIcon: { ...config.wishlistIcon, couleur: e.target.value } })}
                      style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur active (ajouté)</label>
                  <input 
                    type="color" 
                    value={config.wishlistIcon.couleurActive} 
                    onChange={(e) => setConfig({ ...config, wishlistIcon: { ...config.wishlistIcon, couleurActive: e.target.value } })}
                    style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                  />
                </div>

                {/* Bouton flottant */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>🔄 Bouton flottant</h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Bouton flottant pour accès rapide</p>
                    </div>
                    <ToggleSwitch 
                      enabled={config.floatingButton.enabled} 
                      onChange={() => setConfig({ ...config, floatingButton: { ...config.floatingButton, enabled: !config.floatingButton.enabled } })}
                    />
                  </div>
                  {config.floatingButton.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fefce8', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600' }}>Position</label>
                        <select 
                          value={config.floatingButton.position} 
                          onChange={(e) => setConfig({ ...config, floatingButton: { ...config.floatingButton, position: e.target.value as any } })}
                          style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                        >
                          <option value="basDroite">Bas droite</option>
                          <option value="basGauche">Bas gauche</option>
                          <option value="hautDroite">Haut droite</option>
                          <option value="hautGauche">Haut gauche</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600' }}>Marge (px)</label>
                        <input 
                          type="number" 
                          value={config.floatingButton.offsetY} 
                          onChange={(e) => setConfig({ ...config, floatingButton: { ...config.floatingButton, offsetY: parseInt(e.target.value) } })}
                          style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Notifications - Gardé identique */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Paramètres généraux des notifications */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🔔 Paramètres généraux</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Apparence et comportement des notifications</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.notifications.enabled} 
                    onChange={() => setConfig({ ...config, notifications: { ...config.notifications, enabled: !config.notifications.enabled } })}
                  />
                </div>
                {config.notifications.enabled && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Placement</label>
                        <select 
                          value={config.notifications.placement} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, placement: e.target.value as any } })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        >
                          <option value="basCentre">Bas centre</option>
                          <option value="basDroite">Bas droite</option>
                          <option value="basGauche">Bas gauche</option>
                          <option value="hautCentre">Haut centre</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Durée (millisecondes)</label>
                        <input 
                          type="number" 
                          value={config.notifications.duree} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, duree: parseInt(e.target.value) } })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        />
                      </div>
                    </div>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={config.notifications.animer} 
                        onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, animer: e.target.checked } })}
                      />
                      <span>Animer la notification (apparition en fondu)</span>
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur du texte (succès)</label>
                        <input 
                          type="color" 
                          value={config.notifications.couleurTexte} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, couleurTexte: e.target.value } })}
                          style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur de fond (succès)</label>
                        <input 
                          type="color" 
                          value={config.notifications.couleurFond} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, couleurFond: e.target.value } })}
                          style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur du texte (erreur)</label>
                        <input 
                          type="color" 
                          value={config.notifications.couleurErreurTexte} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, couleurErreurTexte: e.target.value } })}
                          style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur de fond (erreur)</label>
                        <input 
                          type="color" 
                          value={config.notifications.couleurFondErreur} 
                          onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, couleurFondErreur: e.target.value } })}
                          style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages personnalisés */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>✉️ Messages personnalisés</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Texte affiché dans les notifications</p>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Ajout à la liste d'envies (utilisateur connecté)</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageAjout} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageAjout: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Ajout temporaire (invité non connecté)</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageAjoutInvite} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageAjoutInvite: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Utilisez &lt;a href="/account"&gt;connectez-vous&lt;/a&gt; pour un lien</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Retrait de la liste</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageRetrait} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageRetrait: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Ajout au panier depuis la wishlist</label>
                    <input 
                      type="text" 
                      value={config.notifications.messagePanierDepuisWishlist} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messagePanierDepuisWishlist: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Copie du lien partagé</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageCopieLien} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageCopieLien: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Message d'erreur - Produit</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageErreurProduit} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageErreurProduit: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Message d'erreur - Wishlist</label>
                    <input 
                      type="text" 
                      value={config.notifications.messageErreurWishlist} 
                      onChange={(e) => setConfig({ ...config, notifications: { ...config.notifications, messageErreurWishlist: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Invités - Gardé identique */}
          {activeTab === 'invites' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>👤 Wishlist pour invités</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Permet aux visiteurs non connectés de créer une liste</p>
                </div>
                <ToggleSwitch 
                  enabled={config.guestWishlist.enabled} 
                  onChange={() => setConfig({ ...config, guestWishlist: { ...config.guestWishlist, enabled: !config.guestWishlist.enabled } })}
                />
              </div>
              {config.guestWishlist.enabled && (
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#fefce8' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Durée de conservation (jours)</label>
                    <input 
                      type="number" 
                      value={config.guestWishlist.dureeStockage} 
                      onChange={(e) => setConfig({ ...config, guestWishlist: { ...config.guestWishlist, dureeStockage: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Stockage local (localStorage)</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Max articles par liste</label>
                    <input 
                      type="number" 
                      value={config.guestWishlist.maxArticles} 
                      onChange={(e) => setConfig({ ...config, guestWishlist: { ...config.guestWishlist, maxArticles: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              )}
              
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>🔧 Désactiver les tooltips</h4>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Désactive les infobulles d'aide</p>
                </div>
                <ToggleSwitch 
                  enabled={config.disableTooltips} 
                  onChange={() => setConfig({ ...config, disableTooltips: !config.disableTooltips })}
                />
              </div>
            </div>
          )}

          {/* Onglet Alerte Prix */}
          {activeTab === 'alertes-prix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Activation Alerte Prix */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>💰 Alertes de baisse de prix</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Surveille les prix et envoie des notifications par e-mail</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.priceDropAlert.enabled} 
                    onChange={() => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, enabled: !config.priceDropAlert.enabled } })}
                  />
                </div>
              </div>

              {config.priceDropAlert.enabled && (
                <>
                  {/* Configuration du bouton d'alerte */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🔘 Configuration du bouton d'alerte</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Apparence et position du bouton "Alerte de baisse de prix"</p>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Pourcentage de baisse cible (%)</label>
                          <input 
                            type="number" 
                            value={config.priceDropAlert.pourcentageCible} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, pourcentageCible: parseInt(e.target.value) } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                            min="1" 
                            max="100"
                          />
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Alerte envoyée quand le prix baisse d'au moins X%</p>
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Texte du bouton</label>
                          <input 
                            type="text" 
                            value={config.priceDropAlert.texteBouton} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, texteBouton: e.target.value } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Position - Desktop</label>
                          <select 
                            value={config.priceDropAlert.positionDesktop} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, positionDesktop: e.target.value as any } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          >
                            <option value="inline">En ligne (recommandé)</option>
                            <option value="apresPrix">Après le prix</option>
                            <option value="avantPanier">Avant le panier</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Position - Mobile</label>
                          <select 
                            value={config.priceDropAlert.positionMobile} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, positionMobile: e.target.value as any } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          >
                            <option value="inline">En ligne (recommandé)</option>
                            <option value="apresPrix">Après le prix</option>
                            <option value="avantPanier">Avant le panier</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Décalage Desktop (px)</label>
                          <input 
                            type="number" 
                            value={config.priceDropAlert.offsetDesktop} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, offsetDesktop: parseInt(e.target.value) } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Décalage Mobile (px)</label>
                          <input 
                            type="number" 
                            value={config.priceDropAlert.offsetMobile} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, offsetMobile: parseInt(e.target.value) } })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur de fond</label>
                          <input 
                            type="color" 
                            value={config.priceDropAlert.couleurFondBouton} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, couleurFondBouton: e.target.value } })}
                            style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Couleur du texte</label>
                          <input 
                            type="color" 
                            value={config.priceDropAlert.couleurTexteBouton} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, couleurTexteBouton: e.target.value } })}
                            style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Classe CSS personnalisée (mobile)</label>
                        <input 
                          type="text" 
                          value={config.priceDropAlert.classeCSSMobile} 
                          onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, classeCSSMobile: e.target.value } })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          placeholder="price-alert-button"
                        />
                      </div>

                      {/* Nouvelle section: Styles avancés */}
                      <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>🎨 Styles avancés</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Marge supérieure (px)</label>
                            <input type="number" value={config.priceDropAlert.marginTop ?? 10} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, marginTop: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Marge inférieure (px)</label>
                            <input type="number" value={config.priceDropAlert.marginBottom ?? 10} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, marginBottom: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Marge gauche (px)</label>
                            <input type="number" value={config.priceDropAlert.marginLeft ?? 0} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, marginLeft: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Marge droite (px)</label>
                            <input type="number" value={config.priceDropAlert.marginRight ?? 0} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, marginRight: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Arrondissement des coins (px)</label>
                            <input type="number" value={config.priceDropAlert.borderRadius ?? 8} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, borderRadius: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Épaisseur bordure (px)</label>
                            <input type="number" value={config.priceDropAlert.borderWidth ?? 0} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, borderWidth: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Couleur de la bordure</label>
                            <input type="color" value={config.priceDropAlert.borderColor ?? '#000000'} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, borderColor: e.target.value } })} style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Taille police (px)</label>
                            <input type="number" value={config.priceDropAlert.fontSize ?? 14} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, fontSize: parseInt(e.target.value) } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Épaisseur police</label>
                            <select value={config.priceDropAlert.fontWeight ?? '600'} onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, fontWeight: e.target.value } })} style={{ width: '100%', padding: '6px 10px', marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                              <option value="normal">Normal</option>
                              <option value="500">500</option>
                              <option value="600">600</option>
                              <option value="700">Bold</option>
                              <option value="800">800</option>
                              <option value="900">900</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Aperçu du bouton :</p>
                        <button style={{
                          backgroundColor: config.priceDropAlert.couleurFondBouton,
                          color: config.priceDropAlert.couleurTexteBouton,
                          border: `${config.priceDropAlert.borderWidth ?? 0}px solid ${config.priceDropAlert.borderColor ?? '#000000'}`,
                          borderRadius: `${config.priceDropAlert.borderRadius ?? 8}px`,
                          padding: '12px 20px',
                          fontSize: `${config.priceDropAlert.fontSize ?? 14}px`,
                          fontWeight: config.priceDropAlert.fontWeight ?? '600',
                          cursor: 'pointer',
                          width: '100%',
                          marginTop: `${config.priceDropAlert.marginTop ?? 10}px`,
                          marginBottom: `${config.priceDropAlert.marginBottom ?? 10}px`,
                          marginLeft: `${config.priceDropAlert.marginLeft ?? 0}px`,
                          marginRight: `${config.priceDropAlert.marginRight ?? 0}px`
                        }}>
                          {config.priceDropAlert.texteBouton}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Configuration de la surveillance */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🔄 Surveillance des prix</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Fréquence et mode de surveillance</p>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Mode de surveillance</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="radio" 
                              checked={config.priceDropAlert.modeSurveillance === 'auto'} 
                              onChange={() => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, modeSurveillance: 'auto' } })}
                            />
                            <span>⚡ Automatique</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="radio" 
                              checked={config.priceDropAlert.modeSurveillance === 'manuel'} 
                              onChange={() => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, modeSurveillance: 'manuel' } })}
                            />
                            <span>🖐️ Manuel</span>
                          </label>
                        </div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                          {config.priceDropAlert.modeSurveillance === 'auto' 
                            ? ({ toutesLesHeures: 'Surveillance toutes les heures ⚡ (charge serveur élevée)', toutesLes4Heures: 'Surveillance toutes les 4 heures (recommandé)', toutesLes8Heures: 'Surveillance toutes les 8 heures', toutesLes12Heures: 'Surveillance toutes les 12 heures', quotidienne: 'Surveillance quotidienne' } as any)[config.priceDropAlert.frequenceSurveillance || 'toutesLes4Heures']
                            : 'Déclenchement manuel via l\'API ou cron job'}
                        </p>
                      </div>

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Fréquence de surveillance</label>
                        <select 
                          value={config.priceDropAlert.frequenceSurveillance} 
                          onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, frequenceSurveillance: e.target.value as any } })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          disabled={config.priceDropAlert.modeSurveillance !== 'auto'}
                        >
                          <option value="toutesLesHeures">Toutes les heures ⚡</option>
                          <option value="toutesLes4Heures">Toutes les 4 heures</option>
                          <option value="toutesLes8Heures">Toutes les 8 heures</option>
                          <option value="toutesLes12Heures">Toutes les 12 heures</option>
                          <option value="quotidienne">Quotidienne</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={config.priceDropAlert.envoyerNotificationAdmin} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, envoyerNotificationAdmin: e.target.checked } })}
                          />
                          <span>📧 M'envoyer un e-mail quand un client s'abonne à une alerte prix</span>
                        </label>
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={config.priceDropAlert.alerteMultiLangue} 
                            onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, alerteMultiLangue: e.target.checked } })}
                          />
                          <span>🌐 Support multi-langues (les e-mails s'adaptent à la langue du client)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Options de notification */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🔔 Types de notification</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Choisissez comment les clients seront alertés</p>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>🔔 Notification push (navigateur)</div>
                          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Notification directement dans le navigateur</p>
                        </div>
                        <ToggleSwitch 
                          enabled={config.priceDropAlert.notificationPush ?? true} 
                          onChange={() => setConfig({ 
                            ...config, 
                            priceDropAlert: { 
                              ...config.priceDropAlert, 
                              notificationPush: !(config.priceDropAlert.notificationPush ?? true) 
                            } 
                          })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>📧 Notification par e-mail</div>
                          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Envoi d'un e-mail quand le prix baisse</p>
                        </div>
                        <ToggleSwitch 
                          enabled={config.priceDropAlert.notificationEmail ?? true} 
                          onChange={() => setConfig({ 
                            ...config, 
                            priceDropAlert: { 
                              ...config.priceDropAlert, 
                              notificationEmail: !(config.priceDropAlert.notificationEmail ?? true) 
                            } 
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CSS personnalisé pour l'alerte prix */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🎨 CSS personnalisé (Alerte Prix)</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Style avancé pour le bouton d'alerte prix</p>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <textarea
                        value={config.priceDropAlert.cssPersonnalise}
                        onChange={(e) => setConfig({ ...config, priceDropAlert: { ...config.priceDropAlert, cssPersonnalise: e.target.value } })}
                        placeholder="/* CSS personnalisé pour le bouton d'alerte prix */
.price-alert-button {
  /* Vos styles ici */
}"
                        style={{ width: '100%', minHeight: '120px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* Liste noire des produits */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🚫 Liste noire</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Produits exclus de la fonctionnalité d'alerte prix</p>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Produits blacklistés */}
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Ajouter un produit (ID Shopify)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                            type="text" 
                            value={blacklistProductInput} 
                            onChange={(e) => setBlacklistProductInput(e.target.value)}
                            placeholder="Rechercher par titre ou ID produit"
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <button onClick={ajouterProduitBlacklist} style={{ padding: '8px 20px', backgroundColor: '#2d6a9f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Ajouter
                          </button>
                        </div>
                        {config.priceDropBlacklist.produitsIds.length > 0 && (
                          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {config.priceDropBlacklist.produitsIds.map(id => (
                              <span key={id} style={{ backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Produit #{id}
                                <button onClick={() => retirerProduitBlacklist(id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tags blacklistés */}
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Tags à exclure</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                            type="text" 
                            value={blacklistTagsInput} 
                            onChange={(e) => setBlacklistTagsInput(e.target.value)}
                            placeholder="Tags séparés par des virgules (ex: solde, promotion)"
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <button onClick={ajouterTagBlacklist} style={{ padding: '8px 20px', backgroundColor: '#2d6a9f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Ajouter
                          </button>
                        </div>
                        {config.priceDropBlacklist.tags.length > 0 && (
                          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {config.priceDropBlacklist.tags.map(tag => (
                              <span key={tag} style={{ backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                #{tag}
                                <button onClick={() => retirerTagBlacklist(tag)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Onglet CSS/JS */}
          {activeTab === 'personnalisation' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🎨 CSS personnalisé</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Ajoutez votre propre CSS pour personnaliser l'apparence</p>
              </div>
              <div style={{ padding: '20px' }}>
                <textarea
                  value={config.customCss}
                  onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
                  placeholder="/* Votre CSS personnalisé ici */.wishlist-button { background: red; }"
                  style={{ width: '100%', minHeight: '150px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>📜 JavaScript personnalisé</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>Ajoutez votre propre JS pour étendre les fonctionnalités</p>
                <textarea
                  value={config.customJs}
                  onChange={(e) => setConfig({ ...config, customJs: e.target.value })}
                  placeholder="// Votre JavaScript personnalisé ici\ndocument.addEventListener('wishlist:added', function(e) {\n  console.log('Article ajouté:', e.detail);\n});"
                  style={{ width: '100%', minHeight: '150px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* Onglet Marketing */}
          {activeTab === 'marketing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>📧 Marketing par e-mail</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Campagnes automatisées pour les listes d'envies</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.emailMarketing.enabled} 
                    onChange={() => setConfig({ ...config, emailMarketing: { ...config.emailMarketing, enabled: !config.emailMarketing.enabled } })}
                  />
                </div>
                {config.emailMarketing.enabled && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fefce8' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={config.emailMarketing.rappels} 
                        onChange={(e) => setConfig({ ...config, emailMarketing: { ...config.emailMarketing, rappels: e.target.checked } })}
                      />
                      <span>📅 Envoi de rappels (articles toujours en liste)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={config.emailMarketing.alertesPrix} 
                        onChange={(e) => setConfig({ ...config, emailMarketing: { ...config.emailMarketing, alertesPrix: e.target.checked } })}
                      />
                      <span>💰 Alertes de baisse de prix</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={config.emailMarketing.retourStock} 
                        onChange={(e) => setConfig({ ...config, emailMarketing: { ...config.emailMarketing, retourStock: e.target.checked } })}
                      />
                      <span>📦 Notification retour en stock</span>
                    </label>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🎯 Recommandations produits</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Afficher des suggestions sur la page wishlist</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.productRecommendations.enabled} 
                    onChange={() => setConfig({ ...config, productRecommendations: { ...config.productRecommendations, enabled: !config.productRecommendations.enabled } })}
                  />
                </div>
                {config.productRecommendations.enabled && (
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#fefce8' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Type de recommandation</label>
                      <select 
                        value={config.productRecommendations.type} 
                        onChange={(e) => setConfig({ ...config, productRecommendations: { ...config.productRecommendations, type: e.target.value as any } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      >
                        <option value="ia">Intelligence artificielle (IA)</option>
                        <option value="manuel">Sélection manuelle</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nombre maximum</label>
                      <input 
                        type="number" 
                        value={config.productRecommendations.limite} 
                        onChange={(e) => setConfig({ ...config, productRecommendations: { ...config.productRecommendations, limite: parseInt(e.target.value) } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        min="1" 
                        max="20" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Avancé */}
          {activeTab === 'avance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>🛒 Déplacer du panier vers wishlist</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Permet de déplacer des articles du panier vers la liste d'envies</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.moveToWishlistFromCart} 
                    onChange={() => setConfig({ ...config, moveToWishlistFromCart: !config.moveToWishlistFromCart })}
                  />
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>🎨 Sauvegarde des variantes</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Enregistre la variante spécifique (taille, couleur, etc.)</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.productVariants} 
                    onChange={() => setConfig({ ...config, productVariants: !config.productVariants })}
                  />
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>👤 Wishlist dans page compte client</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Intègre la wishlist dans le nouveau système de compte client</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.accountPageWishlist} 
                    onChange={() => setConfig({ ...config, accountPageWishlist: !config.accountPageWishlist })}
                  />
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>🔄 Synchronisation POS Shopify</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Synchronise les wishlists avec Shopify POS</p>
                  </div>
                  <ToggleSwitch 
                    enabled={config.shopifyPosSync} 
                    onChange={() => setConfig({ ...config, shopifyPosSync: !config.shopifyPosSync })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar aide */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', padding: '20px', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>💡</div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0', color: '#0369a1' }}>Aide - Liste d'envies</h4>
            <p style={{ fontSize: '12px', color: '#0c4a6e', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              La liste d'envies permet à vos clients de sauvegarder des produits pour plus tard, augmentant ainsi l'engagement et les ventes potentielles.
            </p>
            <div style={{ borderTop: '1px solid #bae6fd', paddingTop: '12px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', color: '#0369a1', margin: '0 0 8px 0' }}>
                <strong>✨ Conseils :</strong>
              </p>
              <ul style={{ fontSize: '11px', color: '#0c4a6e', margin: 0, paddingLeft: '16px' }}>
                <li>Activez les notifications pour améliorer l'expérience</li>
                <li>Les wishlists invités augmentent les conversions de 15%</li>
                <li>Les rappels email récupèrent les ventes perdues</li>
                <li>Les alertes prix fidélisent les clients sensibles au prix</li>
              </ul>
            </div>
          </div>

          {/* Aperçu rapide */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>
              {config.wishlistIcon.styleIcone === 'coeur' ? '❤️' : config.wishlistIcon.styleIcone === 'etoile' ? '⭐' : '🔖'}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Aperçu de l'icône</p>
            <div style={{ marginTop: '12px', fontSize: `${config.wishlistIcon.taille}px`, color: config.wishlistIcon.couleur }}>
              {config.wishlistIcon.styleIcone === 'coeur' ? '❤️' : config.wishlistIcon.styleIcone === 'etoile' ? '⭐' : '🔖'}
            </div>
          </div>

          {/* Statistiques alerte prix (si activé) */}
          {config.priceDropAlert.enabled && (
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 12px 0', color: '#166534' }}>📊 Statistiques alertes prix</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#15803d' }}>0</p>
                  <p style={{ fontSize: '10px', color: '#166534', margin: 0 }}>Alertes souscrites</p>
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#15803d' }}>0</p>
                  <p style={{ fontSize: '10px', color: '#166534', margin: 0 }}>E-mails capturés</p>
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#15803d' }}>0</p>
                  <p style={{ fontSize: '10px', color: '#166534', margin: 0 }}>Notifications envoyées</p>
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#15803d' }}>0</p>
                  <p style={{ fontSize: '10px', color: '#166534', margin: 0 }}>Derniers 7 jours</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Boutons action */}
      <div style={{ position: 'sticky', bottom: '20px', marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={() => naviguerVers?.('dashboard')}
          style={{
            padding: '10px 24px',
            backgroundColor: 'white',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            backgroundColor: '#2d6a9f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder la configuration'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationWishList;