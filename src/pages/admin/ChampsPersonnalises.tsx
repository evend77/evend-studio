import React, { useState } from 'react';

// Thème local
const THEME = {
  sidebar: '#1a2436',
  sidebarHover: '#243044',
  sidebarActive: '#2d6a9f',
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
  topbar: '#ffffff',
  bg: '#f0f2f5',
  card: '#ffffff',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

// Types pour les champs personnalisés
type TypeAssociation = 'PRODUIT' | 'VENDEUR' | 'COMMANDE';
type TypeSaisie = 'texte' | 'zone-texte' | 'liste-deroulante' | 'nombre' | 'date' | 'fichier' | 'selection-multiple';

interface OptionDropdown {
  id: string;
  valeur: string;
  estDefaut: boolean;
}

interface ChampPersonnalise {
  id: string;
  nomTechnique: string;
  nomAffichage: string;
  typeSaisie: TypeSaisie;
  obligatoire: boolean;
  association: TypeAssociation;
  ordre: number;
  afficherBoutique: boolean;
  texteAide: string;
  afficherAideSousTitre: boolean;
  activerValeurParDefaut: boolean;
  valeurParDefaut?: string;
  disponibleRecherche: boolean;
  options?: OptionDropdown[];
  dateCreation: string;
  seulementImages?: boolean;
}

// Fonction pour générer un nom technique compatible Shopify
const genererNomTechnique = (nomAffichage: string): string => {
  return nomAffichage
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Données mock temporaires (seront remplacées par l'API)
const CHAMPS_MOCK: ChampPersonnalise[] = [
  {
    id: '1',
    nomTechnique: 'payment_method',
    nomAffichage: 'Méthode de paiement',
    typeSaisie: 'liste-deroulante',
    obligatoire: true,
    association: 'PRODUIT',
    ordre: 1,
    afficherBoutique: true,
    texteAide: 'Sélectionnez la méthode de paiement acceptée',
    afficherAideSousTitre: false,
    activerValeurParDefaut: true,
    valeurParDefaut: 'Carte de crédit',
    disponibleRecherche: true,
    options: [
      { id: '1', valeur: 'Carte de crédit', estDefaut: true },
      { id: '2', valeur: 'PayPal', estDefaut: false },
      { id: '3', valeur: 'Virement bancaire', estDefaut: false },
    ],
    dateCreation: '2026-01-15',
  },
  {
    id: '2',
    nomTechnique: 'type_entreprise',
    nomAffichage: "Type d'entreprise",
    typeSaisie: 'liste-deroulante',
    obligatoire: true,
    association: 'VENDEUR',
    ordre: 8,
    afficherBoutique: true,
    texteAide: "Sélectionnez le type d'entreprise",
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: true,
    options: [
      { id: '1', valeur: 'SAS', estDefaut: false },
      { id: '2', valeur: 'SARL', estDefaut: false },
      { id: '3', valeur: 'EI', estDefaut: false },
      { id: '4', valeur: 'EURL', estDefaut: false },
      { id: '5', valeur: 'Auto-entrepreneur', estDefaut: false },
    ],
    dateCreation: '2026-01-15',
  },
  {
    id: '3',
    nomTechnique: 'zones_expedition',
    nomAffichage: 'Zones où la boutique expédie',
    typeSaisie: 'liste-deroulante',
    obligatoire: true,
    association: 'VENDEUR',
    ordre: 7,
    afficherBoutique: true,
    texteAide: 'Sélectionnez les zones de livraison',
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: false,
    options: [
      { id: '1', valeur: 'France métropolitaine', estDefaut: false },
      { id: '2', valeur: 'DOM-TOM', estDefaut: false },
      { id: '3', valeur: 'International', estDefaut: false },
    ],
    dateCreation: '2026-01-15',
  },
  {
    id: '4',
    nomTechnique: 'region_administrative',
    nomAffichage: 'Région administrative',
    typeSaisie: 'liste-deroulante',
    obligatoire: true,
    association: 'VENDEUR',
    ordre: 6,
    afficherBoutique: true,
    texteAide: 'Sélectionnez votre région',
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: true,
    options: [
      { id: '1', valeur: 'Île-de-France', estDefaut: false },
      { id: '2', valeur: 'Auvergne-Rhône-Alpes', estDefaut: false },
      { id: '3', valeur: 'Nouvelle-Aquitaine', estDefaut: false },
      { id: '4', valeur: 'Occitanie', estDefaut: false },
      { id: '5', valeur: 'Hauts-de-France', estDefaut: false },
    ],
    dateCreation: '2026-01-15',
  },
  {
    id: '5',
    nomTechnique: 'email_vendeur_contact',
    nomAffichage: 'Email de contact du vendeur',
    typeSaisie: 'texte',
    obligatoire: true,
    association: 'PRODUIT',
    ordre: 2,
    afficherBoutique: true,
    texteAide: 'Email pour contacter le vendeur',
    afficherAideSousTitre: true,
    activerValeurParDefaut: false,
    disponibleRecherche: false,
    dateCreation: '2026-01-15',
  },
  {
    id: '6',
    nomTechnique: 'youtube_video_link',
    nomAffichage: 'Lien vidéo YouTube',
    typeSaisie: 'texte',
    obligatoire: false,
    association: 'PRODUIT',
    ordre: 23,
    afficherBoutique: true,
    texteAide: 'Ajoutez un lien vers une vidéo de présentation',
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: false,
    dateCreation: '2026-01-15',
  },
  {
    id: '7',
    nomTechnique: 'custom_longueur',
    nomAffichage: 'Longueur (cm)',
    typeSaisie: 'nombre',
    obligatoire: false,
    association: 'PRODUIT',
    ordre: 15,
    afficherBoutique: true,
    texteAide: 'Longueur du produit en centimètres',
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: true,
    dateCreation: '2026-01-15',
  },
  {
    id: '8',
    nomTechnique: 'cus_villearticle',
    nomAffichage: "Ville de l'article",
    typeSaisie: 'texte',
    obligatoire: true,
    association: 'PRODUIT',
    ordre: 3,
    afficherBoutique: true,
    texteAide: "Ville où se trouve l'article",
    afficherAideSousTitre: true,
    activerValeurParDefaut: false,
    disponibleRecherche: true,
    dateCreation: '2026-01-15',
  },
  {
    id: '9',
    nomTechnique: 'shipping_modes',
    nomAffichage: "Modes d'expédition",
    typeSaisie: 'selection-multiple',
    obligatoire: true,
    association: 'PRODUIT',
    ordre: 5,
    afficherBoutique: true,
    texteAide: "Sélectionnez les modes d'expédition disponibles",
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: true,
    options: [
      { id: '1', valeur: 'Standard', estDefaut: false },
      { id: '2', valeur: 'Express', estDefaut: false },
      { id: '3', valeur: 'Chronopost', estDefaut: false },
      { id: '4', valeur: 'Point relais', estDefaut: false },
    ],
    dateCreation: '2026-01-15',
  },
];

export default function ChampsPersonnalises({ naviguerVers }: { naviguerVers?: (page: string) => void }) {
  const [champs, setChamps] = useState<ChampPersonnalise[]>(CHAMPS_MOCK);
  const [recherche, setRecherche] = useState('');
  const [filtreAssociation, setFiltreAssociation] = useState<TypeAssociation | 'TOUS'>('TOUS');
  const [modalOuverte, setModalOuverte] = useState(false);
  const [champEnEdition, setChampEnEdition] = useState<ChampPersonnalise | null>(null);
  const [autoGenerationActivee, setAutoGenerationActivee] = useState(true);
  const [nouvelleOption, setNouvelleOption] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState<Partial<ChampPersonnalise>>({
    association: 'PRODUIT',
    typeSaisie: 'texte',
    obligatoire: false,
    afficherBoutique: true,
    afficherAideSousTitre: false,
    activerValeurParDefaut: false,
    disponibleRecherche: false,
    ordre: 1,
    options: [],
    seulementImages: false,
  });

  const champsFiltres = champs.filter(champ => {
    const matchRecherche = champ.nomTechnique.toLowerCase().includes(recherche.toLowerCase()) ||
      champ.nomAffichage.toLowerCase().includes(recherche.toLowerCase());
    const matchAssociation = filtreAssociation === 'TOUS' || champ.association === filtreAssociation;
    return matchRecherche && matchAssociation;
  });

  // Gestionnaire pour le nom affiché - génère automatiquement le nom technique
  const handleNomAffichageChange = (valeur: string) => {
    setFormData({ ...formData, nomAffichage: valeur });
    if (autoGenerationActivee && !champEnEdition) {
      setFormData(prev => ({ ...prev, nomTechnique: genererNomTechnique(valeur) }));
    }
  };

  // Gestion des options pour dropdown
  const ajouterOption = () => {
    if (nouvelleOption.trim()) {
      const nouvellesOptions = [...(formData.options as OptionDropdown[] || [])];
      nouvellesOptions.push({
        id: Date.now().toString(),
        valeur: nouvelleOption.trim(),
        estDefaut: false,
      });
      setFormData({ ...formData, options: nouvellesOptions });
      setNouvelleOption('');
    }
  };

  const supprimerOption = (id: string) => {
    const nouvellesOptions = (formData.options as OptionDropdown[] || []).filter(opt => opt.id !== id);
    setFormData({ ...formData, options: nouvellesOptions });
  };

  const definirOptionParDefaut = (id: string) => {
    const nouvellesOptions = (formData.options as OptionDropdown[] || []).map(opt => ({
      ...opt,
      estDefaut: opt.id === id,
    }));
    setFormData({ ...formData, options: nouvellesOptions });
  };

  const handleSupprimer = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce champ personnalisé ?')) {
      setChamps(champs.filter(c => c.id !== id));
    }
  };

  const handleModifier = (champ: ChampPersonnalise) => {
    setChampEnEdition(champ);
    setFormData(champ);
    setAutoGenerationActivee(false);
    setModalOuverte(true);
  };

  const handleAjouter = () => {
    setChampEnEdition(null);
    setAutoGenerationActivee(true);
    setFormData({
      association: 'PRODUIT',
      typeSaisie: 'texte',
      obligatoire: false,
      afficherBoutique: true,
      afficherAideSousTitre: false,
      activerValeurParDefaut: false,
      disponibleRecherche: false,
      ordre: champs.length + 1,
      options: [],
      seulementImages: false,
      nomTechnique: '',
      nomAffichage: '',
    });
    setModalOuverte(true);
  };

  const handleSauvegarder = () => {
    if (!formData.nomAffichage) {
      alert('Le nom affiché est requis');
      return;
    }
    if (!formData.nomTechnique) {
      alert('Le nom technique est requis');
      return;
    }

    if (champEnEdition) {
      setChamps(champs.map(c => c.id === champEnEdition.id ? { ...c, ...formData as ChampPersonnalise } : c));
    } else {
      const nouveauChamp: ChampPersonnalise = {
        id: Date.now().toString(),
        nomTechnique: formData.nomTechnique!,
        nomAffichage: formData.nomAffichage!,
        typeSaisie: formData.typeSaisie as TypeSaisie || 'texte',
        obligatoire: formData.obligatoire || false,
        association: formData.association as TypeAssociation || 'PRODUIT',
        ordre: formData.ordre || champs.length + 1,
        afficherBoutique: formData.afficherBoutique !== false,
        texteAide: formData.texteAide || '',
        afficherAideSousTitre: formData.afficherAideSousTitre || false,
        activerValeurParDefaut: formData.activerValeurParDefaut || false,
        valeurParDefaut: formData.valeurParDefaut,
        disponibleRecherche: formData.disponibleRecherche || false,
        options: formData.options as OptionDropdown[] || [],
        seulementImages: formData.seulementImages || false,
        dateCreation: new Date().toISOString().split('T')[0],
      };
      setChamps([...champs, nouveauChamp]);
    }
    setModalOuverte(false);
  };

  const getAssociationLabel = (association: TypeAssociation) => {
    switch (association) {
      case 'PRODUIT': return '📦 Produit';
      case 'VENDEUR': return '🏪 Vendeur';
      case 'COMMANDE': return '📋 Commande';
      default: return association;
    }
  };

  const getTypeSaisieLabel = (type: TypeSaisie) => {
    const types: Record<TypeSaisie, string> = {
      'texte': '📝 Texte',
      'zone-texte': '📄 Zone de texte',
      'liste-deroulante': '📋 Liste déroulante',
      'nombre': '🔢 Nombre',
      'date': '📅 Date',
      'fichier': '📎 Fichier',
      'selection-multiple': '✅ Sélection multiple',
    };
    return types[type] || type;
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔖 Champs personnalisés (Méta)
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              Gérez les métachamps pour les produits, vendeurs et commandes sur Shopify
            </p>
          </div>
          <button
            onClick={handleAjouter}
            style={{
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e5a8a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = THEME.accent)}
          >
            <span>➕</span>
            <span>Ajouter un champ personnalisé</span>
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{
        backgroundColor: THEME.card,
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFiltreAssociation('TOUS')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              border: `1px solid ${filtreAssociation === 'TOUS' ? THEME.accent : THEME.border}`,
              backgroundColor: filtreAssociation === 'TOUS' ? THEME.accent : 'transparent',
              color: filtreAssociation === 'TOUS' ? 'white' : THEME.textLight,
              cursor: 'pointer',
            }}
          >
            Tous
          </button>
          <button
            onClick={() => setFiltreAssociation('PRODUIT')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              border: `1px solid ${filtreAssociation === 'PRODUIT' ? THEME.accent : THEME.border}`,
              backgroundColor: filtreAssociation === 'PRODUIT' ? THEME.accent : 'transparent',
              color: filtreAssociation === 'PRODUIT' ? 'white' : THEME.textLight,
              cursor: 'pointer',
            }}
          >
            📦 Produits
          </button>
          <button
            onClick={() => setFiltreAssociation('VENDEUR')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              border: `1px solid ${filtreAssociation === 'VENDEUR' ? THEME.accent : THEME.border}`,
              backgroundColor: filtreAssociation === 'VENDEUR' ? THEME.accent : 'transparent',
              color: filtreAssociation === 'VENDEUR' ? 'white' : THEME.textLight,
              cursor: 'pointer',
            }}
          >
            🏪 Vendeurs
          </button>
          <button
            onClick={() => setFiltreAssociation('COMMANDE')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              border: `1px solid ${filtreAssociation === 'COMMANDE' ? THEME.accent : THEME.border}`,
              backgroundColor: filtreAssociation === 'COMMANDE' ? THEME.accent : 'transparent',
              color: filtreAssociation === 'COMMANDE' ? 'white' : THEME.textLight,
              cursor: 'pointer',
            }}
          >
            📋 Commandes
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un champ..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${THEME.border}`,
              fontSize: '13px',
              width: '220px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des champs */}
      <div style={{
        backgroundColor: THEME.card,
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: THEME.text }}>Nom du champ</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: THEME.text }}>Type de saisie</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: THEME.text }}>Obligatoire</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: THEME.text }}>Associé à</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: THEME.text }}>Ordre</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: THEME.text }}>Visible</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: THEME.text }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {champsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: THEME.textLight }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>🔖</div>
                    <p>Aucun champ personnalisé trouvé</p>
                    <button
                      onClick={handleAjouter}
                      style={{
                        marginTop: '12px',
                        backgroundColor: THEME.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      + Ajouter votre premier champ
                    </button>
                  </td>
                </tr>
              ) : (
                champsFiltres.map((champ, index) => (
                  <tr
                    key={champ.id}
                    style={{
                      borderBottom: index < champsFiltres.length - 1 ? `1px solid ${THEME.border}` : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: THEME.text }}>
                      <div>{champ.nomTechnique}</div>
                      {champ.nomAffichage !== champ.nomTechnique && (
                        <div style={{ fontSize: '11px', color: THEME.textLight }}>({champ.nomAffichage})</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: THEME.text }}>
                      {getTypeSaisieLabel(champ.typeSaisie)}
                      {champ.typeSaisie === 'selection-multiple' && champ.options && (
                        <div style={{ fontSize: '10px', color: THEME.textLight, marginTop: '4px' }}>
                          {(champ.options as OptionDropdown[]).slice(0, 2).map(o => o.valeur).join(', ')}{(champ.options as OptionDropdown[]).length > 2 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: champ.obligatoire ? '#dcfce7' : '#f3f4f6',
                        color: champ.obligatoire ? THEME.success : THEME.textLight,
                      }}>
                        {champ.obligatoire ? '✓ Oui' : '✗ Non'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: champ.association === 'PRODUIT' ? '#e8f2fb' : champ.association === 'VENDEUR' ? '#fef9c3' : '#f3e8ff',
                        color: champ.association === 'PRODUIT' ? THEME.accent : champ.association === 'VENDEUR' ? '#d97706' : '#7c3aed',
                      }}>
                        {getAssociationLabel(champ.association)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: THEME.text }}>
                      {champ.ordre}
                      {champ.ordre === 1 && <span style={{ fontSize: '10px', marginLeft: '4px' }}>🥇</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '28px',
                        height: '28px',
                        lineHeight: '28px',
                        textAlign: 'center',
                        borderRadius: '50%',
                        backgroundColor: champ.afficherBoutique ? '#dcfce7' : '#f3f4f6',
                        color: champ.afficherBoutique ? THEME.success : THEME.textLight,
                      }}>
                        {champ.afficherBoutique ? '👁️' : '👁️‍🗨️'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleModifier(champ)}
                          style={{
                            backgroundColor: '#e8f2fb',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: THEME.accent,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleSupprimer(champ.id)}
                          style={{
                            backgroundColor: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: THEME.danger,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      {modalOuverte && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* En-tête modal */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: THEME.accent,
              color: 'white',
              borderBottom: `2px solid ${THEME.accentLight}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔖</span>
                {champEnEdition ? 'Modifier le champ personnalisé' : 'Ajouter un champ personnalisé'}
              </h3>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', opacity: 0.8 }}>
                {champEnEdition ? 'Modifiez les détails du métachamp' : 'Créez un nouveau métachamp pour les produits ou vendeurs'}
              </p>
            </div>

            {/* Corps modal */}
            <div style={{ padding: '24px' }}>
              {/* Association - Pour quelle section */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Associé à * <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Pour quelle section)</span>
                </label>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'PRODUIT', label: '📦 PRODUIT', desc: 'Ajouter aux fiches produits' },
                    { value: 'VENDEUR', label: '🏪 VENDEUR', desc: 'Ajouter aux profils vendeurs' },
                    { value: 'COMMANDE', label: '📋 COMMANDE', desc: 'Ajouter aux commandes' },
                  ].map(option => (
                    <label key={option.value} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: `2px solid ${formData.association === option.value ? THEME.accent : THEME.border}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: formData.association === option.value ? `${THEME.accent}10` : 'transparent',
                    }}>
                      <input
                        type="radio"
                        name="association"
                        value={option.value}
                        checked={formData.association === option.value}
                        onChange={(e) => setFormData({ ...formData, association: e.target.value as TypeAssociation })}
                        style={{ margin: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{option.label}</div>
                        <div style={{ fontSize: '10px', color: THEME.textLight }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nom affiché (en premier) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Nom affiché * <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Visible par les vendeurs)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Méthode de paiement"
                  value={formData.nomAffichage || ''}
                  onChange={(e) => handleNomAffichageChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${THEME.border}`,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '4px' }}>
                  Nom visible par les vendeurs et clients sur la boutique
                </p>
              </div>

              {/* Nom technique (généré automatiquement mais modifiable) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Nom technique * <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Utilisé dans l'API Shopify)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: payment_method"
                  value={formData.nomTechnique || ''}
                  onChange={(e) => {
                    setAutoGenerationActivee(false);
                    setFormData({ ...formData, nomTechnique: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${THEME.border}`,
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'monospace',
                    backgroundColor: !autoGenerationActivee && !champEnEdition ? '#fef9c3' : 'white',
                  }}
                />
                <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '4px' }}>
                  {!champEnEdition && autoGenerationActivee && formData.nomAffichage && (
                    <span style={{ color: THEME.success }}>✨ Généré automatiquement à partir du nom affiché</span>
                  )}
                  {!champEnEdition && !autoGenerationActivee && (
                    <span style={{ color: THEME.warning }}>✏️ Mode manuel - vous modifiez le nom technique</span>
                  )}
                  {champEnEdition && (
                    <span>Modifiable manuellement</span>
                  )}
                </p>
              </div>

              {/* Type de saisie */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Type de saisie * <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Type d'input)</span>
                </label>
                <select
                  value={formData.typeSaisie}
                  onChange={(e) => setFormData({ ...formData, typeSaisie: e.target.value as TypeSaisie })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${THEME.border}`,
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="texte">📝 Texte</option>
                  <option value="zone-texte">📄 Zone de texte</option>
                  <option value="liste-deroulante">📋 Liste déroulante</option>
                  <option value="selection-multiple">✅ Sélection multiple</option>
                  <option value="nombre">🔢 Nombre</option>
                  <option value="date">📅 Date</option>
                  <option value="fichier">📎 Fichier</option>
                </select>
              </div>

              {/* SECTION OPTIONS POUR DROPDOWN (comme sur la photo) */}
              {(formData.typeSaisie === 'liste-deroulante' || formData.typeSaisie === 'selection-multiple') && (
                <div style={{ marginBottom: '20px', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '12px' }}>
                    OPTIONS
                  </label>
                  
                  {/* Liste des options existantes */}
                  {(formData.options as OptionDropdown[] || []).length > 0 && (
                    <div style={{ marginBottom: '12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      {(formData.options as OptionDropdown[] || []).map((opt, idx) => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx < (formData.options as OptionDropdown[] || []).length - 1 ? `1px solid ${THEME.border}` : 'none', backgroundColor: opt.estDefaut ? '#fef9c3' : 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>{opt.valeur}</span>
                            {opt.estDefaut && <span style={{ fontSize: '10px', backgroundColor: THEME.success, color: 'white', padding: '2px 6px', borderRadius: '4px' }}>DÉFAUT</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => definirOptionParDefaut(opt.id)} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>DÉFINIR DÉFAUT</button>
                            <button type="button" onClick={() => supprimerOption(opt.id)} style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>SUPPRIMER</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Ajouter une nouvelle option */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Entrez votre option de liste déroulante"
                      value={nouvelleOption}
                      onChange={(e) => setNouvelleOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && ajouterOption()}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${THEME.border}`,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button type="button" onClick={ajouterOption} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>AJOUTER</button>
                  </div>
                  <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '8px' }}>
                    {formData.typeSaisie === 'liste-deroulante' ? 'Ajoutez les options pour la liste déroulante' : 'Ajoutez les options pour la sélection multiple'}
                  </p>
                </div>
              )}

              {/* SECTION SPÉCIFIQUE POUR LE TYPE FICHIER */}
              {formData.typeSaisie === 'fichier' && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef9c3', borderRadius: '10px', border: `1px solid ${THEME.warning}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.seulementImages || false}
                      onChange={(e) => setFormData({ ...formData, seulementImages: e.target.checked })}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>Activer pour afficher l'image devant</span>
                  </label>
                  <p style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '24px', marginTop: '8px' }}>
                    En activant cette configuration, vous ne pourrez télécharger que des fichiers image (JPG, JPEG, PNG, GIF, WEBP), sinon ils pourront télécharger tout type de fichier.
                  </p>
                  <p style={{ fontSize: '11px', color: THEME.danger, marginLeft: '24px', marginTop: '8px' }}>
                    Note: Si vous activez cette option, vous devrez re-télécharger le fichier.
                  </p>
                </div>
              )}

              {/* SECTION SPÉCIFIQUE POUR LE TYPE DATE */}
              {formData.typeSaisie === 'date' && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#e8f2fb', borderRadius: '10px', border: `1px solid ${THEME.accent}` }}>
                  <p style={{ fontSize: '12px', color: THEME.text, margin: 0 }}>
                    📅 Format de date: <strong>mm/jj/aaaa</strong>
                  </p>
                </div>
              )}

              {/* Checkboxes : Obligatoire et Afficher sur la boutique */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.obligatoire || false}
                      onChange={(e) => setFormData({ ...formData, obligatoire: e.target.checked })}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>Obligatoire *</span>
                  </label>
                  <p style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '24px' }}>Champ obligatoire à remplir</p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.afficherBoutique || false}
                      onChange={(e) => setFormData({ ...formData, afficherBoutique: e.target.checked })}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>Afficher sur la boutique *</span>
                  </label>
                  <p style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '24px' }}>Afficher le champ sur la boutique</p>
                </div>
              </div>

              {/* Ordre d'affichage */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Ordre d'affichage * <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Position)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.ordre || 1}
                  onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${THEME.border}`,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '4px' }}>
                  Définit l'ordre d'affichage du champ (1 = premier)
                </p>
              </div>

              {/* Texte d'aide */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '6px' }}>
                  Texte d'aide <span style={{ fontWeight: 'normal', color: THEME.textLight }}>(Help text)</span>
                </label>
                <textarea
                  placeholder="Texte d'aide affiché sous le champ..."
                  value={formData.texteAide || ''}
                  onChange={(e) => setFormData({ ...formData, texteAide: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${THEME.border}`,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Afficher l'aide sous le titre */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.afficherAideSousTitre || false}
                    onChange={(e) => setFormData({ ...formData, afficherAideSousTitre: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>
                    Afficher le texte d'aide sous le titre
                  </span>
                </label>
                <p style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '24px' }}>
                  Afficher le texte d'aide juste en dessous du titre (toujours visible)
                </p>
              </div>

              {/* Valeur par défaut */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.activerValeurParDefaut || false}
                    onChange={(e) => setFormData({ ...formData, activerValeurParDefaut: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>
                    Activer une valeur par défaut
                  </span>
                </label>

                {formData.activerValeurParDefaut && (
                  <div style={{ marginTop: '12px', marginLeft: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: THEME.text, marginBottom: '4px' }}>
                      Valeur par défaut *
                    </label>
                    <input
                      type={formData.typeSaisie === 'date' ? 'text' : 'text'}
                      placeholder={formData.typeSaisie === 'date' ? 'mm/jj/aaaa' : 'Valeur par défaut...'}
                      value={formData.valeurParDefaut || ''}
                      onChange={(e) => setFormData({ ...formData, valeurParDefaut: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${THEME.border}`,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {formData.typeSaisie === 'date' && (
                      <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '4px' }}>Format: mm/jj/aaaa</p>
                    )}
                  </div>
                )}
              </div>

              {/* Disponible pour la recherche */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.disponibleRecherche || false}
                    onChange={(e) => setFormData({ ...formData, disponibleRecherche: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.text }}>
                    Disponible pour la recherche
                  </span>
                </label>
                <p style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '24px' }}>
                  Permet de rechercher des produits par ce champ personnalisé
                </p>
              </div>
            </div>

            {/* Footer modal */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${THEME.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '0 0 16px 16px',
            }}>
              <button
                onClick={() => setModalOuverte(false)}
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: THEME.textLight,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSauvegarder}
                style={{
                  backgroundColor: THEME.accent,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {champEnEdition ? '💾 Mettre à jour' : '➕ Ajouter le champ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}