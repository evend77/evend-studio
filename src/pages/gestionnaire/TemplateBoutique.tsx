// src/pages/vendeur/TemplateBoutique.tsx
// Configuration du template de la boutique - Espace vendeur

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: number;
  nom: string;
  image: string;
  categorie: string;
  description: string;
}

interface Configuration {
  couleurs: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    header: string;
    footer: string;
    button: string;
  };
  polices: {
    titre: string;
    corps: string;
    taille_titre: string;
    taille_corps: string;
  };
  miseEnPage: {
    largeur: 'standard' | 'large' | 'pleine';
    grille_produits: '2' | '3' | '4' | '6';
    sidebar: 'gauche' | 'droite' | 'aucune';
  };
  pageAccueil: {
    hero_titre: string;
    hero_sous_titre: string;
    hero_image: string;
    hero_bouton_texte: string;
    hero_bouton_lien: string;
    featured_categories: string[];
    featured_products: string[];
    blog_actif: boolean;
    newsletter_actif: boolean;
  };
  pageCollection: {
    afficher_filtres: boolean;
    afficher_tris: boolean;
    produits_par_page: '12' | '24' | '48';
    affichage_par_defaut: 'grille' | 'liste';
    sidebar_filtres: string[];
  };
  pageProduit: {
    afficher_galerie: boolean;
    afficher_quantite: boolean;
    afficher_avis: boolean;
    afficher_produits_similaires: boolean;
    zoom_image: boolean;
    afficher_stock: boolean;
  };
  panier: {
    afficher_recommandations: boolean;
    montant_min_commande: number;
    frais_livraison_offerts: boolean;
    montant_livraison_offerte: number;
    afficher_code_promo: boolean;
  };
  checkout: {
    demander_telephone: boolean;
    demander_notes: boolean;
    proposer_compte: boolean;
    newsletter_checkbox: boolean;
    cgu_checkbox: boolean;
  };
}

const TEMPLATES: Template[] = [
  { id: 1, nom: 'Minimalist Studio', image: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=400', categorie: 'Mode & Accessoires', description: 'Design épuré pour mettre vos produits en valeur' },
  { id: 2, nom: 'Nature & Co', image: 'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&cs=tinysrgb&w=400', categorie: 'Artisanat / Maison', description: 'Ambiance naturelle et chaleureuse' },
  { id: 3, nom: 'Tech Store', image: 'https://images.pexels.com/photos/6991226/pexels-photo-6991226.jpeg?auto=compress&cs=tinysrgb&w=400', categorie: 'Électronique', description: 'Design moderne pour produits high-tech' },
  { id: 4, nom: 'Boutique Chic', image: 'https://images.pexels.com/photos/4381392/pexels-photo-4381392.jpeg?auto=compress&cs=tinysrgb&w=400', categorie: 'Tendances', description: 'Élégant et raffiné' },
];

const POLICES = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display',
  'Lato', 'Raleway', 'Nunito', 'Merriweather', 'DM Sans', 'Sora'
];

export default function TemplateBoutique() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'modele' | 'accueil' | 'collection' | 'produit' | 'panier' | 'checkout'>('modele');
  const [templateSelectionne, setTemplateSelectionne] = useState<Template | null>(null);
  const [config, setConfig] = useState<Configuration>({
    couleurs: {
      primary: '#f5a623',
      secondary: '#000000',
      background: '#ffffff',
      text: '#333333',
      accent: '#f97316',
      header: '#ffffff',
      footer: '#111111',
      button: '#f5a623',
    },
    polices: {
      titre: 'Inter',
      corps: 'Inter',
      taille_titre: '32px',
      taille_corps: '16px',
    },
    miseEnPage: {
      largeur: 'standard',
      grille_produits: '4',
      sidebar: 'gauche',
    },
    pageAccueil: {
      hero_titre: 'Bienvenue dans notre boutique',
      hero_sous_titre: 'Découvrez nos produits exclusifs',
      hero_image: '',
      hero_bouton_texte: 'Magasiner maintenant',
      hero_bouton_lien: '/catalogue',
      featured_categories: [],
      featured_products: [],
      blog_actif: false,
      newsletter_actif: true,
    },
    pageCollection: {
      afficher_filtres: true,
      afficher_tris: true,
      produits_par_page: '24',
      affichage_par_defaut: 'grille',
      sidebar_filtres: ['categories', 'prix', 'marques'],
    },
    pageProduit: {
      afficher_galerie: true,
      afficher_quantite: true,
      afficher_avis: true,
      afficher_produits_similaires: true,
      zoom_image: true,
      afficher_stock: true,
    },
    panier: {
      afficher_recommandations: true,
      montant_min_commande: 0,
      frais_livraison_offerts: false,
      montant_livraison_offerte: 100,
      afficher_code_promo: true,
    },
    checkout: {
      demander_telephone: true,
      demander_notes: false,
      proposer_compte: true,
      newsletter_checkbox: false,
      cgu_checkbox: true,
    },
  });

  // Simuler le chargement du template actuel de la boutique
  useEffect(() => {
    // TODO: Charger depuis l'API
    setTemplateSelectionne(TEMPLATES[0]);
  }, []);

  const handleConfigChange = (section: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof Configuration],
        [field]: value
      }
    }));
  };

  const handleCouleurChange = (couleur: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      couleurs: { ...prev.couleurs, [couleur]: value }
    }));
  };

  const handlePoliceChange = (type: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      polices: { ...prev.polices, [type]: value }
    }));
  };

  const handleSauvegarder = async () => {
    // TODO: Sauvegarder la configuration dans l'API
    console.log('Configuration sauvegardée:', config);
    alert('Configuration sauvegardée avec succès !');
  };

  const ouvrirPageTemplates = () => {
    window.open('/templates', '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Retour au tableau de bord
        </button>
        <h1 style={styles.title}>🎨 Configuration du template</h1>
        <p style={styles.subtitle}>Personnalisez l'apparence et le contenu de votre boutique</p>
      </div>

      {/* Template actuel */}
      <div style={styles.currentTemplate}>
        <span style={styles.currentTemplateLabel}>Template actif :</span>
        <span style={styles.currentTemplateName}>{templateSelectionne?.nom || 'Aucun'}</span>
        <button style={styles.changeTemplateButton} onClick={() => setActiveTab('modele')}>
          Changer de template
        </button>
      </div>

      {/* Onglets */}
      <div style={styles.tabs}>
        <button
          className={activeTab === 'modele' ? 'active' : ''}
          onClick={() => setActiveTab('modele')}
          style={{ ...styles.tab, ...(activeTab === 'modele' ? styles.tabActive : {}) }}
        >
          📐 Modèle template
        </button>
        <button
          className={activeTab === 'accueil' ? 'active' : ''}
          onClick={() => setActiveTab('accueil')}
          style={{ ...styles.tab, ...(activeTab === 'accueil' ? styles.tabActive : {}) }}
        >
          🏠 Page d'accueil
        </button>
        <button
          className={activeTab === 'collection' ? 'active' : ''}
          onClick={() => setActiveTab('collection')}
          style={{ ...styles.tab, ...(activeTab === 'collection' ? styles.tabActive : {}) }}
        >
          📁 Page collection
        </button>
        <button
          className={activeTab === 'produit' ? 'active' : ''}
          onClick={() => setActiveTab('produit')}
          style={{ ...styles.tab, ...(activeTab === 'produit' ? styles.tabActive : {}) }}
        >
          📦 Page produit
        </button>
        <button
          className={activeTab === 'panier' ? 'active' : ''}
          onClick={() => setActiveTab('panier')}
          style={{ ...styles.tab, ...(activeTab === 'panier' ? styles.tabActive : {}) }}
        >
          🛒 Panier
        </button>
        <button
          className={activeTab === 'checkout' ? 'active' : ''}
          onClick={() => setActiveTab('checkout')}
          style={{ ...styles.tab, ...(activeTab === 'checkout' ? styles.tabActive : {}) }}
        >
          💳 Checkout
        </button>
      </div>

      {/* Contenu des onglets */}
      <div style={styles.tabContent}>
        {/* Onglet 1: Modèle template */}
        {activeTab === 'modele' && (
          <div>
            <h2 style={styles.sectionTitle}>Choisissez votre modèle de template</h2>
            <p style={styles.sectionDesc}>Sélectionnez le design qui correspond le mieux à votre marque</p>
            
            <div style={styles.templatesGrid}>
              {TEMPLATES.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${templateSelectionne?.id === template.id ? 'selected' : ''}`}
                   onClick={() => navigate('/guide-template-minimalist')}  // ← REDIRIGE VERS LE GUIDE
                  style={{
                    ...styles.templateCard,
                    ...(templateSelectionne?.id === template.id ? styles.templateCardSelected : {}),
                    border: templateSelectionne?.id === template.id ? '2px solid #f5a623' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <img src={template.image} alt={template.nom} style={styles.templateImage} />
                  <div style={styles.templateInfo}>
                    <h3 style={styles.templateName}>{template.nom}</h3>
                    <p style={styles.templateCategorie}>{template.categorie}</p>
                    <p style={styles.templateDesc}>{template.description}</p>
                    {templateSelectionne?.id === template.id && (
                      <span style={styles.selectedBadge}>✓ Sélectionné</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={styles.templatesCta}>
              <button onClick={ouvrirPageTemplates} style={styles.voirTousButton}>
                Voir tous les templates (24) ↗
              </button>
            </div>
          </div>
        )}

        {/* Onglet 2: Page d'accueil */}
        {activeTab === 'accueil' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration de la page d'accueil</h2>
            
            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>🖼️ Section Hero</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Titre principal</label>
                <input
                  type="text"
                  value={config.pageAccueil.hero_titre}
                  onChange={(e) => handleConfigChange('pageAccueil', 'hero_titre', e.target.value)}
                  style={styles.input}
                  placeholder="Titre du hero"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sous-titre</label>
                <input
                  type="text"
                  value={config.pageAccueil.hero_sous_titre}
                  onChange={(e) => handleConfigChange('pageAccueil', 'hero_sous_titre', e.target.value)}
                  style={styles.input}
                  placeholder="Sous-titre du hero"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image du hero (URL)</label>
                <input
                  type="text"
                  value={config.pageAccueil.hero_image}
                  onChange={(e) => handleConfigChange('pageAccueil', 'hero_image', e.target.value)}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Texte du bouton</label>
                  <input
                    type="text"
                    value={config.pageAccueil.hero_bouton_texte}
                    onChange={(e) => handleConfigChange('pageAccueil', 'hero_bouton_texte', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Lien du bouton</label>
                  <input
                    type="text"
                    value={config.pageAccueil.hero_bouton_lien}
                    onChange={(e) => handleConfigChange('pageAccueil', 'hero_bouton_lien', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>⚙️ Options</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageAccueil.blog_actif}
                    onChange={(e) => handleConfigChange('pageAccueil', 'blog_actif', e.target.checked)}
                  />
                  Activer la section blog
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageAccueil.newsletter_actif}
                    onChange={(e) => handleConfigChange('pageAccueil', 'newsletter_actif', e.target.checked)}
                  />
                  Activer la section newsletter
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3: Page collection */}
        {activeTab === 'collection' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration de la page collection</h2>
            
            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>📊 Affichage</h3>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Produits par page</label>
                  <select
                    value={config.pageCollection.produits_par_page}
                    onChange={(e) => handleConfigChange('pageCollection', 'produits_par_page', e.target.value)}
                    style={styles.select}
                  >
                    <option value="12">12 produits</option>
                    <option value="24">24 produits</option>
                    <option value="48">48 produits</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Affichage par défaut</label>
                  <select
                    value={config.pageCollection.affichage_par_defaut}
                    onChange={(e) => handleConfigChange('pageCollection', 'affichage_par_defaut', e.target.value)}
                    style={styles.select}
                  >
                    <option value="grille">Grille</option>
                    <option value="liste">Liste</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>🔧 Fonctionnalités</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageCollection.afficher_filtres}
                    onChange={(e) => handleConfigChange('pageCollection', 'afficher_filtres', e.target.checked)}
                  />
                  Afficher les filtres
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageCollection.afficher_tris}
                    onChange={(e) => handleConfigChange('pageCollection', 'afficher_tris', e.target.checked)}
                  />
                  Afficher les options de tri
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 4: Page produit */}
        {activeTab === 'produit' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration de la page produit</h2>
            
            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>📸 Affichage produit</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageProduit.afficher_galerie}
                    onChange={(e) => handleConfigChange('pageProduit', 'afficher_galerie', e.target.checked)}
                  />
                  Afficher la galerie d'images
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageProduit.afficher_quantite}
                    onChange={(e) => handleConfigChange('pageProduit', 'afficher_quantite', e.target.checked)}
                  />
                  Afficher le sélecteur de quantité
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageProduit.afficher_avis}
                    onChange={(e) => handleConfigChange('pageProduit', 'afficher_avis', e.target.checked)}
                  />
                  Afficher les avis clients
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageProduit.zoom_image}
                    onChange={(e) => handleConfigChange('pageProduit', 'zoom_image', e.target.checked)}
                  />
                  Activer le zoom sur les images
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.pageProduit.afficher_stock}
                    onChange={(e) => handleConfigChange('pageProduit', 'afficher_stock', e.target.checked)}
                  />
                  Afficher le niveau de stock
                </label>
              </div>
            </div>

            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>🔄 Recommandations</h3>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={config.pageProduit.afficher_produits_similaires}
                  onChange={(e) => handleConfigChange('pageProduit', 'afficher_produits_similaires', e.target.checked)}
                />
                Afficher les produits similaires
              </label>
            </div>
          </div>
        )}

        {/* Onglet 5: Panier */}
        {activeTab === 'panier' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration du panier</h2>
            
            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>💰 Options panier</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.panier.afficher_recommandations}
                    onChange={(e) => handleConfigChange('panier', 'afficher_recommandations', e.target.checked)}
                  />
                  Afficher les recommandations dans le panier
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.panier.afficher_code_promo}
                    onChange={(e) => handleConfigChange('panier', 'afficher_code_promo', e.target.checked)}
                  />
                  Afficher le champ code promo
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.panier.frais_livraison_offerts}
                    onChange={(e) => handleConfigChange('panier', 'frais_livraison_offerts', e.target.checked)}
                  />
                  Activer la livraison offerte
                </label>
              </div>
            </div>

            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>📦 Seuils</h3>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Montant minimum de commande ($)</label>
                  <input
                    type="number"
                    value={config.panier.montant_min_commande}
                    onChange={(e) => handleConfigChange('panier', 'montant_min_commande', parseFloat(e.target.value))}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Montant pour livraison offerte ($)</label>
                  <input
                    type="number"
                    value={config.panier.montant_livraison_offerte}
                    onChange={(e) => handleConfigChange('panier', 'montant_livraison_offerte', parseFloat(e.target.value))}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 6: Checkout */}
        {activeTab === 'checkout' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration du checkout</h2>
            
            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>📝 Champs du formulaire</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.checkout.demander_telephone}
                    onChange={(e) => handleConfigChange('checkout', 'demander_telephone', e.target.checked)}
                  />
                  Demander le numéro de téléphone
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.checkout.demander_notes}
                    onChange={(e) => handleConfigChange('checkout', 'demander_notes', e.target.checked)}
                  />
                  Demander des notes de commande
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.checkout.proposer_compte}
                    onChange={(e) => handleConfigChange('checkout', 'proposer_compte', e.target.checked)}
                  />
                  Proposer la création d'un compte
                </label>
              </div>
            </div>

            <div style={styles.configSection}>
              <h3 style={styles.configTitle}>✓ Validations</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.checkout.newsletter_checkbox}
                    onChange={(e) => handleConfigChange('checkout', 'newsletter_checkbox', e.target.checked)}
                  />
                  Ajouter une case à cocher newsletter
                </label>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={config.checkout.cgu_checkbox}
                    onChange={(e) => handleConfigChange('checkout', 'cgu_checkbox', e.target.checked)}
                  />
                  Exiger l'acceptation des CGU
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Couleurs et Polices (affichée dans tous les onglets sauf modele) */}
      {activeTab !== 'modele' && (
        <div style={styles.designSection}>
          <h2 style={styles.sectionTitle}>🎨 Design global</h2>
          
          <div style={styles.configSection}>
            <h3 style={styles.configTitle}>Couleurs</h3>
            <div style={styles.colorsGrid}>
              <div>
                <label style={styles.label}>Primaire</label>
                <input
                  type="color"
                  value={config.couleurs.primary}
                  onChange={(e) => handleCouleurChange('primary', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.primary}</span>
              </div>
              <div>
                <label style={styles.label}>Secondaire</label>
                <input
                  type="color"
                  value={config.couleurs.secondary}
                  onChange={(e) => handleCouleurChange('secondary', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.secondary}</span>
              </div>
              <div>
                <label style={styles.label}>Fond</label>
                <input
                  type="color"
                  value={config.couleurs.background}
                  onChange={(e) => handleCouleurChange('background', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.background}</span>
              </div>
              <div>
                <label style={styles.label}>Texte</label>
                <input
                  type="color"
                  value={config.couleurs.text}
                  onChange={(e) => handleCouleurChange('text', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.text}</span>
              </div>
              <div>
                <label style={styles.label}>Accent</label>
                <input
                  type="color"
                  value={config.couleurs.accent}
                  onChange={(e) => handleCouleurChange('accent', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.accent}</span>
              </div>
              <div>
                <label style={styles.label}>Boutons</label>
                <input
                  type="color"
                  value={config.couleurs.button}
                  onChange={(e) => handleCouleurChange('button', e.target.value)}
                  style={styles.colorInput}
                />
                <span style={styles.colorValue}>{config.couleurs.button}</span>
              </div>
            </div>
          </div>

          <div style={styles.configSection}>
            <h3 style={styles.configTitle}>Polices</h3>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Police des titres</label>
                <select
                  value={config.polices.titre}
                  onChange={(e) => handlePoliceChange('titre', e.target.value)}
                  style={styles.select}
                >
                  {POLICES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Police du corps</label>
                <select
                  value={config.polices.corps}
                  onChange={(e) => handlePoliceChange('corps', e.target.value)}
                  style={styles.select}
                >
                  {POLICES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Taille des titres</label>
                <select
                  value={config.polices.taille_titre}
                  onChange={(e) => handleConfigChange('polices', 'taille_titre', e.target.value)}
                  style={styles.select}
                >
                  <option value="24px">24px</option>
                  <option value="28px">28px</option>
                  <option value="32px">32px</option>
                  <option value="36px">36px</option>
                  <option value="42px">42px</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Taille du corps</label>
                <select
                  value={config.polices.taille_corps}
                  onChange={(e) => handleConfigChange('polices', 'taille_corps', e.target.value)}
                  style={styles.select}
                >
                  <option value="14px">14px</option>
                  <option value="15px">15px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.configSection}>
            <h3 style={styles.configTitle}>Mise en page</h3>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Largeur du site</label>
                <select
                  value={config.miseEnPage.largeur}
                  onChange={(e) => handleConfigChange('miseEnPage', 'largeur', e.target.value)}
                  style={styles.select}
                >
                  <option value="standard">Standard (1200px)</option>
                  <option value="large">Large (1400px)</option>
                  <option value="pleine">Pleine largeur</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Grille produits</label>
                <select
                  value={config.miseEnPage.grille_produits}
                  onChange={(e) => handleConfigChange('miseEnPage', 'grille_produits', e.target.value)}
                  style={styles.select}
                >
                  <option value="2">2 colonnes</option>
                  <option value="3">3 colonnes</option>
                  <option value="4">4 colonnes</option>
                  <option value="6">6 colonnes</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Position sidebar</label>
                <select
                  value={config.miseEnPage.sidebar}
                  onChange={(e) => handleConfigChange('miseEnPage', 'sidebar', e.target.value)}
                  style={styles.select}
                >
                  <option value="gauche">Gauche</option>
                  <option value="droite">Droite</option>
                  <option value="aucune">Aucune</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton sauvegarder */}
      <div style={styles.saveContainer}>
        <button onClick={handleSauvegarder} style={styles.saveButton}>
          💾 Sauvegarder toutes les modifications
        </button>
      </div>

      {/* Aperçu en direct */}
      <div style={styles.previewSection}>
        <h2 style={styles.sectionTitle}>👁️ Aperçu en direct</h2>
        <div
          style={{
            ...styles.preview,
            backgroundColor: config.couleurs.background,
            color: config.couleurs.text,
            fontFamily: config.polices.corps,
          }}
        >
          <div style={{ ...styles.previewHeader, backgroundColor: config.couleurs.header }}>
            <span style={{ fontWeight: 'bold', fontSize: config.polices.taille_titre }}>Logo</span>
            <div style={styles.previewNav}>
              <span>Accueil</span>
              <span>Produits</span>
              <span>Contact</span>
            </div>
          </div>
          <div style={styles.previewHero}>
            <h1 style={{ fontFamily: config.polices.titre, fontSize: config.polices.taille_titre }}>
              {config.pageAccueil.hero_titre}
            </h1>
            <p>{config.pageAccueil.hero_sous_titre}</p>
            <button style={{ ...styles.previewButton, backgroundColor: config.couleurs.button }}>
              {config.pageAccueil.hero_bouton_texte}
            </button>
          </div>
          <div style={styles.previewFooter}>
            <span>© 2026 e-Vend Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    color: '#fff',
    minHeight: '100vh',          // ← AJOUTE AUSSI CELLE-CI
    backgroundColor: '#0a1628',
  },
  header: {
    marginBottom: '24px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#f5a623',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
  currentTemplate: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  currentTemplateLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
  },
  currentTemplateName: {
    fontWeight: 600,
    color: '#f5a623',
  },
  changeTemplateButton: {
    marginLeft: 'auto',
    background: 'rgba(245,166,35,0.15)',
    border: '1px solid rgba(245,166,35,0.3)',
    borderRadius: '6px',
    padding: '4px 12px',
    color: '#f5a623',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#f5a623',
    borderBottom: '2px solid #f5a623',
  },
  tabContent: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  sectionDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    marginBottom: '24px',
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  templateCard: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  templateCardSelected: {
    background: 'rgba(245,166,35,0.1)',
  },
  templateImage: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
  },
  templateInfo: {
    padding: '16px',
  },
  templateName: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  templateCategorie: {
    fontSize: '12px',
    color: '#f5a623',
    marginBottom: '8px',
  },
  templateDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '12px',
  },
  selectedBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#f5a623',
    color: '#000',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  templatesCta: {
    textAlign: 'center',
    marginTop: '24px',
  },
  voirTousButton: {
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '30px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  configSection: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  configTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  colorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '16px',
  },
  colorInput: {
    width: '60px',
    height: '36px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
  },
  colorValue: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: '8px',
  },
  designSection: {
    marginTop: '32px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  saveContainer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  saveButton: {
    padding: '14px 32px',
    background: '#f5a623',
    border: 'none',
    borderRadius: '40px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  previewSection: {
    marginTop: '48px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  preview: {
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  previewNav: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
  },
  previewHero: {
    padding: '48px 20px',
    textAlign: 'center',
  },
  previewButton: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '16px',
  },
  previewFooter: {
    padding: '12px 20px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
};