import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Types
interface NoteInterne {
  id: number;
  date: string;
  contenu: string;
}

interface Produit {
  id: string;
  nom: string;
  sku: string;
  categorie: string;
  prix: number;
  stock: number;
  typeVente: 'standard' | 'enchere';
  statut: 'actif' | 'inactif' | 'en_attente' | 'vendu' | 'suspendu';
  dateCreation: string;
  image?: string;
  enchereId?: string;
  totalVentes?: number;
  note?: number;
  notes?: NoteInterne[];
  poids?: number;
  hauteur?: number;
  largeur?: number;
  longueur?: number;
  codeBarres?: string;
  marque?: string;
  modele?: string;
  tags?: string[];
  typeAnnonce?: 'neuf' | 'occasion' | 'remis-a-neuf';
  etat?: 'neuf' | 'comme-neuf' | 'tres-bon' | 'bon' | 'correct' | 'use' | 'a-reparer' | 'pieces';
  retourOffert?: 'non' | 'oui-description';
  garantie?: 'aucune' | '30j' | '6m' | '1an';
  paysFabrication?: string;
  formats?: string;
  adresseVente?: string;
  lienYoutube?: string;
  modeExpedition?: {
    transporteur: boolean;
    ramassage: boolean;
  };
  suiviInventaire?: 'suivre' | 'non';
  quantiteMinimum?: number;
  produitNumerique?: boolean;
  lienNumerique?: string;
  joursAccessibles?: number;
  telechargementsMax?: number;
}

interface BulkEditProduitsProps {
  produits: Produit[];
  onClose: () => void;
  onSave: (produitsModifies: Produit[]) => void;
}

// Données mock COMPLÈTES
const PRODUITS_MOCK: Produit[] = [
  { 
    id: '#21303165', 
    nom: 'Montre à quartz pour enfant – Motif dinosaure', 
    sku: 'MON-DIN-001', 
    categorie: 'Montres', 
    prix: 16.99, 
    stock: 8, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-01-15', 
    enchereId: 'ENC-001', 
    totalVentes: 12, 
    note: 4.5,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.5,
    hauteur: 10,
    largeur: 5,
    longueur: 2,
    notes: [
      { id: 1, date: '15 jan 2026', contenu: 'Produit populaire, bien noté par les clients.' },
    ]
  },
  { 
    id: '#21303166', 
    nom: 'Écusson brodé vintage – Série limitée', 
    sku: 'ECU-VIN-002', 
    categorie: 'Accessoires', 
    prix: 12.50, 
    stock: 23, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-01-22', 
    totalVentes: 8, 
    note: 4.2,
    typeAnnonce: 'occasion',
    etat: 'tres-bon',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.1,
    notes: []
  },
  { 
    id: '#21303167', 
    nom: 'Porte-clés artisanal en cuir véritable', 
    sku: 'CLE-CUI-003', 
    categorie: 'Maroquinerie', 
    prix: 24.00, 
    stock: 15, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-02-01', 
    totalVentes: 34, 
    note: 4.7,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'oui-description',
    garantie: '6m',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.2,
    notes: [
      { id: 1, date: '1 fév 2026', contenu: 'Très bon vendeur, produit de qualité.' },
    ]
  },
  { 
    id: '#21303168', 
    nom: 'CD Glass Piano Bruce Brubeck Collection', 
    sku: 'CD-BRU-004', 
    categorie: 'Musique', 
    prix: 18.99, 
    stock: 4, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-02-10', 
    enchereId: 'ENC-002', 
    totalVentes: 3, 
    note: 4.0,
    typeAnnonce: 'occasion',
    etat: 'bon',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.1,
    notes: []
  },
  { 
    id: '#21303169', 
    nom: 'Figurine rétro robot mécanique années 70', 
    sku: 'FIG-ROB-005', 
    categorie: 'Collectibles', 
    prix: 45.00, 
    stock: 2, 
    typeVente: 'standard', 
    statut: 'en_attente', 
    dateCreation: '2026-02-14', 
    totalVentes: 0, 
    note: 0,
    typeAnnonce: 'remis-a-neuf',
    etat: 'correct',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 1.2,
    notes: [
      { id: 1, date: '14 fév 2026', contenu: 'En attente de vérification par l\'équipe.' },
    ]
  },
  { 
    id: '#21303170', 
    nom: 'Lampe de bureau industrielle cuivre brossé', 
    sku: 'LAM-CUI-006', 
    categorie: 'Déco', 
    prix: 89.00, 
    stock: 6, 
    typeVente: 'standard', 
    statut: 'inactif', 
    dateCreation: '2026-02-18', 
    totalVentes: 2, 
    note: 3.5,
    typeAnnonce: 'occasion',
    etat: 'use',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 2.5,
    notes: []
  },
  { 
    id: '#21303171', 
    nom: 'Faux billets loterie – Lot 6 pièces', 
    sku: 'FAU-LOT-007', 
    categorie: 'Jeux', 
    prix: 9.99, 
    stock: 50, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-02-20', 
    enchereId: 'ENC-003', 
    totalVentes: 5, 
    note: 4.3,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.3,
    notes: []
  },
  { 
    id: '#21303172', 
    nom: 'Masque hydratant visage', 
    sku: 'MAS-HYD-008', 
    categorie: 'Cosmétiques', 
    prix: 35.00, 
    stock: 2, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-02-15', 
    totalVentes: 12, 
    note: 4.5,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.2,
    notes: []
  },
  { 
    id: '#21303173', 
    nom: 'Sérum hydratant pour le visage', 
    sku: 'SER-HYD-009', 
    categorie: 'Cosmétiques', 
    prix: 35.00, 
    stock: 3, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-02-14', 
    totalVentes: 8, 
    note: 4.2,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.2,
    notes: []
  },
  { 
    id: '#21303174', 
    nom: 'Pads nettoyant Anti-imperfection au curcuma', 
    sku: 'PAD-NET-010', 
    categorie: 'Cosmétiques', 
    prix: 25.00, 
    stock: 47, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-02-10', 
    totalVentes: 34, 
    note: 4.7,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.3,
    notes: []
  },
  { 
    id: '#21303175', 
    nom: 'Crème anti-âge', 
    sku: 'CRE-ANT-011', 
    categorie: 'Cosmétiques', 
    prix: 45.00, 
    stock: 0, 
    typeVente: 'standard', 
    statut: 'vendu', 
    dateCreation: '2026-02-01', 
    totalVentes: 2, 
    note: 3.5,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.4,
    notes: []
  },
];

function BulkEditProduits({ produits: propsProduits, onClose, onSave }: BulkEditProduitsProps) {
  // Utiliser les props ou les données mock si aucune props fournie
  const [produitsModifies, setProduitsModifies] = useState<Produit[]>(
    propsProduits.length > 0 ? propsProduits : PRODUITS_MOCK
  );
  const [selection, setSelection] = useState<string[]>([]);
  const [recherche, setRecherche] = useState('');
  const [editionMode, setEditionMode] = useState<'individuel' | 'groupe'>('individuel');
  const [colonnesActives, setColonnesActives] = useState<string[]>([
    'id', 'nom', 'sku', 'categorie', 'prix', 'stock', 'typeVente', 'etat', 'typeAnnonce', 'poids', 'statut'
  ]);
  const [menuColonnesOuvert, setMenuColonnesOuvert] = useState(false);
  const [menuActionGroupeOuvert, setMenuActionGroupeOuvert] = useState(false);
  const [modificationGroupee, setModificationGroupee] = useState<{
    champ: string;
    valeur: any;
    application: 'tous' | 'selection';
  } | null>(null);

  const menuColonnesRef = useRef<HTMLDivElement>(null);
  const menuActionRef = useRef<HTMLDivElement>(null);
  
  // Ref pour savoir quel champ est en train d'être édité (pour garder le focus)
  const editingRef = useRef<{id: string, champ: string} | null>(null);

  // useCallback pour éviter les re-rendus inutiles
  const modifierProduit = useCallback((id: string, champ: keyof Produit, valeur: any) => {
    setProduitsModifies(prev => 
      prev.map(p => p.id === id ? { ...p, [champ]: valeur } : p)
    );
    // Ne pas perdre la référence d'édition
  }, []);

  // Filtrer les produits
  const produitsFiltres = useMemo(() => {
    return produitsModifies.filter(p => 
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.id.toLowerCase().includes(recherche.toLowerCase()) ||
      p.sku.toLowerCase().includes(recherche.toLowerCase())
    );
  }, [produitsModifies, recherche]);

  // Colonnes disponibles
  const toutesColonnes = useMemo(() => [
    { id: 'id', label: 'ID Produit' },
    { id: 'nom', label: 'Nom' },
    { id: 'sku', label: 'SKU' },
    { id: 'categorie', label: 'Catégorie' },
    { id: 'prix', label: 'Prix ($)' },
    { id: 'stock', label: 'Stock' },
    { id: 'typeVente', label: 'Type de vente' },
    { id: 'statut', label: 'Statut' },
    { id: 'typeAnnonce', label: "Type d'annonce" },
    { id: 'etat', label: 'État' },
    { id: 'poids', label: 'Poids (kg)' },
    { id: 'hauteur', label: 'Hauteur (cm)' },
    { id: 'largeur', label: 'Largeur (cm)' },
    { id: 'longueur', label: 'Longueur (cm)' },
    { id: 'codeBarres', label: 'Code-barres' },
    { id: 'marque', label: 'Marque' },
    { id: 'modele', label: 'Modèle' },
    { id: 'retourOffert', label: 'Retour offert' },
    { id: 'garantie', label: 'Garantie' },
    { id: 'paysFabrication', label: 'Pays de fabrication' },
    { id: 'formats', label: 'Formats' },
    { id: 'adresseVente', label: 'Adresse' },
    { id: 'lienYoutube', label: 'YouTube' },
    { id: 'quantiteMinimum', label: 'Qté min.' },
    { id: 'suiviInventaire', label: 'Suivi inventaire' },
    { id: 'dateCreation', label: 'Date création' },
  ], []);

  // Fermer les menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuColonnesRef.current && !menuColonnesRef.current.contains(e.target as Node)) {
        setMenuColonnesOuvert(false);
      }
      if (menuActionRef.current && !menuActionRef.current.contains(e.target as Node)) {
        setMenuActionGroupeOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestion de la sélection
  const toggleSelection = useCallback((id: string) => {
    setSelection(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectionTous = useCallback(() => {
    if (selection.length === produitsFiltres.length) {
      setSelection([]);
    } else {
      setSelection(produitsFiltres.map(p => p.id));
    }
  }, [selection.length, produitsFiltres]);

  // Modifier un champ pour tous les produits sélectionnés
  const modifierGroupe = useCallback((champ: keyof Produit, valeur: any) => {
    const idsAAppliquer = modificationGroupee?.application === 'tous' 
      ? produitsModifies.map(p => p.id)
      : selection;
    
    setProduitsModifies(prev => 
      prev.map(p => idsAAppliquer.includes(p.id) ? { ...p, [champ]: valeur } : p)
    );
    setModificationGroupee(null);
  }, [modificationGroupee, produitsModifies, selection]);

  // Afficher la valeur d'un champ
  const afficherValeur = useCallback((produit: Produit, champ: string): string => {
    const valeur = produit[champ as keyof Produit];
    
    if (valeur === undefined || valeur === null) return '—';
    
    if (champ === 'prix') return `${valeur} $`;
    if (champ === 'typeVente') return valeur === 'standard' ? '📦 Standard' : '🔨 Enchère';
    if (champ === 'statut') {
      if (valeur === 'actif') return '✓ Actif';
      if (valeur === 'inactif') return '✗ Inactif';
      if (valeur === 'en_attente') return '⏳ En attente';
      if (valeur === 'vendu') return '💰 Vendu';
    }
    if (champ === 'typeAnnonce') {
      if (valeur === 'neuf') return 'Neuf';
      if (valeur === 'occasion') return 'Occasion';
      if (valeur === 'remis-a-neuf') return 'Remis à neuf';
    }
    if (champ === 'etat') {
      if (valeur === 'neuf') return '1. Neuf';
      if (valeur === 'comme-neuf') return '2. Comme neuf';
      if (valeur === 'tres-bon') return '3. Très bon état';
      if (valeur === 'bon') return '4. Bon état';
      if (valeur === 'correct') return '5. État correct';
      if (valeur === 'use') return '6. Usé';
      if (valeur === 'a-reparer') return '7. À réparer';
      if (valeur === 'pieces') return '8. Pour pièces';
    }
    if (champ === 'retourOffert') return valeur === 'non' ? '❌ Non' : '✅ Oui';
    if (champ === 'garantie') {
      if (valeur === 'aucune') return 'Aucune';
      if (valeur === '30j') return '30 jours';
      if (valeur === '6m') return '6 mois';
      if (valeur === '1an') return '1 an';
    }
    if (champ === 'suiviInventaire') return valeur === 'suivre' ? '✅ Suivre' : '❌ Non';
    if (champ === 'dateCreation') return String(valeur);
    
    return String(valeur);
  }, []);

  // Fonction pour obtenir la valeur comme string pour les inputs
  const getValeurInput = useCallback((produit: Produit, champ: string): string => {
    const valeur = produit[champ as keyof Produit];
    if (valeur === undefined || valeur === null) return '';
    return String(valeur);
  }, []);

  // Éditeur de champ avec gestion du focus
  const EditeurChamp = ({ produit, champ }: { produit: Produit; champ: string }) => {
    const selectRef = useRef<HTMLSelectElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Vérifier si ce champ est en cours d'édition
    const isEditing = editingRef.current?.id === produit.id && editingRef.current?.champ === champ;
    
    // Focus automatique quand on commence à éditer
    useEffect(() => {
      if (isEditing) {
        if (selectRef.current) {
          selectRef.current.focus();
        } else if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [isEditing]);

    // Quand on clique sur le champ, on marque ce champ comme en cours d'édition
    const handleClick = useCallback(() => {
      editingRef.current = { id: produit.id, champ };
    }, [produit.id, champ]);

    // Quand on perd le focus, on enlève le marqueur d'édition
    const handleBlur = useCallback(() => {
      // Petit délai pour éviter de perdre le focus quand on clique sur une option du select
      setTimeout(() => {
        if (editingRef.current?.id === produit.id && editingRef.current?.champ === champ) {
          editingRef.current = null;
        }
      }, 200);
    }, [produit.id, champ]);

    // Gestionnaires de changement
    const handleTypeVenteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'typeVente', e.target.value as 'standard' | 'enchere');
    }, [produit.id, modifierProduit]);

    const handleStatutChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'statut', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleTypeAnnonceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'typeAnnonce', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleEtatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'etat', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleRetourOffertChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'retourOffert', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleGarantieChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'garantie', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleSuiviInventaireChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      modifierProduit(produit.id, 'suiviInventaire', e.target.value as any);
    }, [produit.id, modifierProduit]);

    const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = champ === 'prix' ? parseFloat(e.target.value) : parseInt(e.target.value);
      modifierProduit(produit.id, champ as keyof Produit, isNaN(val) ? 0 : val);
    }, [produit.id, champ, modifierProduit]);

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      modifierProduit(produit.id, champ as keyof Produit, e.target.value);
    }, [produit.id, champ, modifierProduit]);

    // Type de vente
    if (champ === 'typeVente') {
      return (
        <select
          ref={selectRef}
          value={produit.typeVente}
          onChange={handleTypeVenteChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="standard">📦 Standard</option>
          <option value="enchere">🔨 Enchère</option>
        </select>
      );
    }

    // Statut
    if (champ === 'statut') {
      return (
        <select
          ref={selectRef}
          value={produit.statut}
          onChange={handleStatutChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="actif">✓ Actif</option>
          <option value="inactif">✗ Inactif</option>
          <option value="en_attente">⏳ En attente</option>
          <option value="vendu">💰 Vendu</option>
        </select>
      );
    }

    // TYPE D'ANNONCE (3 options)
    if (champ === 'typeAnnonce') {
      return (
        <select
          ref={selectRef}
          value={produit.typeAnnonce || 'neuf'}
          onChange={handleTypeAnnonceChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="neuf">Neuf</option>
          <option value="occasion">Occasion</option>
          <option value="remis-a-neuf">Remis à neuf</option>
        </select>
      );
    }

    // ÉTAT (8 options)
    if (champ === 'etat') {
      return (
        <select
          ref={selectRef}
          value={produit.etat || 'neuf'}
          onChange={handleEtatChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '11px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="neuf">1. Neuf</option>
          <option value="comme-neuf">2. Comme neuf</option>
          <option value="tres-bon">3. Très bon état</option>
          <option value="bon">4. Bon état</option>
          <option value="correct">5. État correct</option>
          <option value="use">6. Usé</option>
          <option value="a-reparer">7. À réparer</option>
          <option value="pieces">8. Pour pièces</option>
        </select>
      );
    }

    // Retour offert
    if (champ === 'retourOffert') {
      return (
        <select
          ref={selectRef}
          value={produit.retourOffert || 'non'}
          onChange={handleRetourOffertChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="non">Non</option>
          <option value="oui-description">Oui</option>
        </select>
      );
    }

    // Garantie
    if (champ === 'garantie') {
      return (
        <select
          ref={selectRef}
          value={produit.garantie || 'aucune'}
          onChange={handleGarantieChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="aucune">Aucune</option>
          <option value="30j">30 jours</option>
          <option value="6m">6 mois</option>
          <option value="1an">1 an</option>
        </select>
      );
    }

    // Suivi inventaire
    if (champ === 'suiviInventaire') {
      return (
        <select
          ref={selectRef}
          value={produit.suiviInventaire || 'suivre'}
          onChange={handleSuiviInventaireChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="suivre">Suivre</option>
          <option value="non">Ne pas suivre</option>
        </select>
      );
    }

    // Champs numériques
    if (champ === 'prix' || champ === 'stock' || champ === 'poids' || champ === 'hauteur' || 
        champ === 'largeur' || champ === 'longueur' || champ === 'quantiteMinimum') {
      return (
        <input
          ref={inputRef}
          type="number"
          step={champ === 'prix' ? '0.01' : '1'}
          min="0"
          value={getValeurInput(produit, champ)}
          onChange={handleNumberChange}
          onClick={handleClick}
          onBlur={handleBlur}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%',
          }}
        />
      );
    }

    // Champs texte
    return (
      <input
        ref={inputRef}
        type="text"
        value={getValeurInput(produit, champ)}
        onChange={handleTextChange}
        onClick={handleClick}
        onBlur={handleBlur}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          width: '100%',
        }}
      />
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '1400px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        
        {/* En-tête */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #2d6a9f, #1d4f7a)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              ✏️
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>
                Modification groupée
              </h2>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
                {produitsModifies.length} produits sélectionnés · {selection.length} produits en cours d'édition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✕</span>
            <span>Fermer</span>
          </button>
        </div>

        {/* Barre d'outils */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e1e3e5',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}>
          
          {/* Recherche */}
          <div style={{
            flex: 1,
            minWidth: '250px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            border: '1px solid #e1e3e5',
            borderRadius: '8px',
            padding: '0 12px',
          }}>
            <span style={{ color: '#999', marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, ID, SKU..."
              style={{
                border: 'none',
                outline: 'none',
                padding: '10px 0',
                width: '100%',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Menu colonnes */}
          <div ref={menuColonnesRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuColonnesOuvert(!menuColonnesOuvert)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📋 Colonnes</span>
              <span style={{ fontSize: '10px' }}>{menuColonnesOuvert ? '▲' : '▼'}</span>
            </button>
            
            {menuColonnesOuvert && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '220px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                <div style={{ padding: '8px 0' }}>
                  {toutesColonnes.map(col => (
                    <label
                      key={col.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={colonnesActives.includes(col.id)}
                        onChange={() => {
                          setColonnesActives(prev =>
                            prev.includes(col.id)
                              ? prev.filter(c => c !== col.id)
                              : [...prev, col.id]
                          );
                        }}
                        style={{ marginRight: '10px' }}
                      />
                      <span style={{ fontSize: '12px' }}>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mode d'édition */}
          <div style={{
            display: 'flex',
            backgroundColor: 'white',
            border: '1px solid #e1e3e5',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setEditionMode('individuel')}
              style={{
                padding: '8px 16px',
                background: editionMode === 'individuel' ? '#2d6a9f' : 'white',
                color: editionMode === 'individuel' ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Édition individuelle
            </button>
            <button
              onClick={() => setEditionMode('groupe')}
              style={{
                padding: '8px 16px',
                background: editionMode === 'groupe' ? '#2d6a9f' : 'white',
                color: editionMode === 'groupe' ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Édition groupée
            </button>
          </div>

          {/* Actions groupées */}
          {editionMode === 'groupe' && (
            <div ref={menuActionRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuActionGroupeOuvert(!menuActionGroupeOuvert)}
                disabled={selection.length === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selection.length > 0 ? '#2d6a9f' : '#f0f0f0',
                  color: selection.length > 0 ? 'white' : '#999',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selection.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚡ Appliquer à {selection.length} produit(s)</span>
                <span style={{ fontSize: '10px' }}>{menuActionGroupeOuvert ? '▲' : '▼'}</span>
              </button>

              {menuActionGroupeOuvert && selection.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e1e3e5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '300px',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e3e5' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0' }}>
                      Modifier en groupe
                    </h4>
                    <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                      Les modifications s'appliqueront aux {selection.length} produits sélectionnés
                    </p>
                  </div>

                  <div style={{ padding: '12px 16px' }}>
                    {/* Prix */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Prix
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Nouveau prix"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setModificationGroupee({ champ: 'prix', valeur: val, application: 'selection' });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        />
                        <button
                          onClick={() => modificationGroupee?.champ === 'prix' && modifierGroupe('prix', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'prix'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'prix' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'prix' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'prix' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Stock */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Stock
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="Nouveau stock"
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              setModificationGroupee({ champ: 'stock', valeur: val, application: 'selection' });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        />
                        <button
                          onClick={() => modificationGroupee?.champ === 'stock' && modifierGroupe('stock', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'stock'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'stock' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'stock' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'stock' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Type de vente */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Type de vente
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          onChange={(e) => setModificationGroupee({ champ: 'typeVente', valeur: e.target.value, application: 'selection' })}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          <option value="">Sélectionner...</option>
                          <option value="standard">📦 Standard</option>
                          <option value="enchere">🔨 Enchère</option>
                        </select>
                        <button
                          onClick={() => modificationGroupee?.champ === 'typeVente' && modifierGroupe('typeVente', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'typeVente'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'typeVente' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'typeVente' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'typeVente' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Type d'annonce */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Type d'annonce
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          onChange={(e) => setModificationGroupee({ champ: 'typeAnnonce', valeur: e.target.value, application: 'selection' })}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          <option value="">Sélectionner...</option>
                          <option value="neuf">Neuf</option>
                          <option value="occasion">Occasion</option>
                          <option value="remis-a-neuf">Remis à neuf</option>
                        </select>
                        <button
                          onClick={() => modificationGroupee?.champ === 'typeAnnonce' && modifierGroupe('typeAnnonce', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'typeAnnonce'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'typeAnnonce' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'typeAnnonce' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'typeAnnonce' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* État */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        État
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          onChange={(e) => setModificationGroupee({ champ: 'etat', valeur: e.target.value, application: 'selection' })}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}
                        >
                          <option value="">Sélectionner...</option>
                          <option value="neuf">1. Neuf</option>
                          <option value="comme-neuf">2. Comme neuf</option>
                          <option value="tres-bon">3. Très bon</option>
                          <option value="bon">4. Bon</option>
                          <option value="correct">5. Correct</option>
                          <option value="use">6. Usé</option>
                          <option value="a-reparer">7. À réparer</option>
                          <option value="pieces">8. Pour pièces</option>
                        </select>
                        <button
                          onClick={() => modificationGroupee?.champ === 'etat' && modifierGroupe('etat', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'etat'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'etat' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'etat' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'etat' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Poids */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Poids (kg)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Nouveau poids"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setModificationGroupee({ champ: 'poids', valeur: val, application: 'selection' });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        />
                        <button
                          onClick={() => modificationGroupee?.champ === 'poids' && modifierGroupe('poids', modificationGroupee.valeur)}
                          disabled={modificationGroupee?.champ !== 'poids'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: modificationGroupee?.champ === 'poids' ? '#2d6a9f' : '#f0f0f0',
                            color: modificationGroupee?.champ === 'poids' ? 'white' : '#999',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: modificationGroupee?.champ === 'poids' ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                          }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tableau des produits */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 24px 24px 24px',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10,
            }}>
              <tr style={{ borderBottom: '2px solid #2d6a9f' }}>
                <th style={{ padding: '12px 8px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selection.length === produitsFiltres.length && produitsFiltres.length > 0}
                    onChange={toggleSelectionTous}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                {colonnesActives.map(colId => {
                  const colonne = toutesColonnes.find(c => c.id === colId);
                  return (
                    <th key={colId} style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#2d6a9f',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      {colonne?.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {produitsFiltres.map((produit, index) => (
                <tr key={produit.id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: selection.includes(produit.id) ? '#e8f2fb' : (index % 2 === 0 ? 'white' : '#fafafa'),
                }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selection.includes(produit.id)}
                      onChange={() => toggleSelection(produit.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  
                  {colonnesActives.map(colId => (
                    <td key={colId} style={{ padding: '6px 8px' }}>
                      {editionMode === 'individuel' ? (
                        <EditeurChamp produit={produit} champ={colId} />
                      ) : (
                        <div style={{ padding: '4px 8px' }}>
                          {afficherValeur(produit, colId)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {produitsFiltres.length === 0 && (
                <tr>
                  <td colSpan={colonnesActives.length + 1} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de page */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e1e3e5',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            <strong>{produitsFiltres.length}</strong> produits affichés · 
            <strong>{selection.length}</strong> sélectionnés
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(produitsModifies)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2d6a9f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: '0 2px 4px rgba(45,106,159,0.2)',
              }}
            >
              ✅ Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkEditProduits;