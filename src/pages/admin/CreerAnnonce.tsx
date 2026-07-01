/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  Page,
  BlockStack,
  TextField,
  Select,
  Checkbox,
  Button,
  Modal,
  Banner,
  Tag,
} from '@shopify/polaris';
import Cropper from 'react-easy-crop';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// Types pour les variantes
type VariantOption = {
  id: string;
  nom: string;
  valeurs: VariantValue[];
};

type VariantValue = {
  id: string;
  valeur: string;
};

type Variant = {
  id: string;
  combinaison: { [key: string]: string };
  prix: string;
  quantite: string;
  sku: string;
  poids?: string;
  codeBarres?: string;
  image?: string;
  imageFile?: File;
};

// Types pour les images produit
type ProductImage = {
  id: string;
  file?: File;  // optionnel pour les images existantes depuis URL
  url: string;
  altText: string;
  rotation: number;
  width?: number;
  height?: number;
  isExisting?: boolean; // true = image déjà en BD, pas besoin d'upload
};

// Type pour la vidéo produit
type ProductVideo = {
  id: string;
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
};

// Types pour les produits numériques
type ProduitNumeriqueType = 'fichier' | 'lien' | 'service';

// Type pour les catégories
type Categorie = {
  id: string;
  nom: string;
};

// Type pour les tags
type Tag = {
  id: string;
  nom: string;
};

// Fonctions utilitaires pour le crop
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      1
    );
  });
}

// Composant HelpIcon
const HelpIcon = ({ text, showShippingTable }: { text: string; showShippingTable?: boolean }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '4px' }}>
      <span
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
        onClick={() => setShowHelp(!showHelp)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#333',
          color: 'white',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          lineHeight: '16px',
          textAlign: 'center',
        }}
      >
        ?
      </span>
      {showHelp && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '0',
          backgroundColor: '#333',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          width: showShippingTable ? '350px' : '300px',
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          whiteSpace: 'pre-line',
        }}>
          {showShippingTable ? (
            <>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>⚖️ Tableau des frais d'expédition</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid #555' }}>Poids</th>
                    <th style={{ textAlign: 'right', padding: '4px', borderBottom: '1px solid #555' }}>Frais</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '4px' }}>0 kg</td><td style={{ textAlign: 'right' }}>Gratuit</td></tr>
                  <tr><td style={{ padding: '4px' }}>0 – 0,29 kg</td><td style={{ textAlign: 'right' }}>2 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>0,3 – 0,5 kg</td><td style={{ textAlign: 'right' }}>5 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>0,6 – 1 kg</td><td style={{ textAlign: 'right' }}>8 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>1,01 – 2 kg</td><td style={{ textAlign: 'right' }}>12 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>2,01 – 5 kg</td><td style={{ textAlign: 'right' }}>20 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>5,01 – 10 kg</td><td style={{ textAlign: 'right' }}>30 $</td></tr>
                  <tr><td style={{ padding: '4px' }}>10,01 kg et +</td><td style={{ textAlign: 'right' }}>40 $</td></tr>
                </tbody>
              </table>
              <p style={{ margin: '8px 0 0 0', fontSize: '10px', opacity: 0.7 }}>
                Tarifs appliqués automatiquement par e-Vend
              </p>
            </>
          ) : (
            text
          )}
        </div>
      )}
    </span>
  );
};

// Composant d'éditeur de texte enrichi
const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('Times New Roman');
  const [selectedSize, setSelectedSize] = useState('12pt');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && viewMode === 'visual' && !isInitialized) {
      editorRef.current.innerHTML = value || '';
      editorRef.current.dir = 'ltr';
      editorRef.current.style.textAlign = 'left';
      setIsInitialized(true);
    }
  }, [viewMode, isInitialized]);

  useEffect(() => {
    if (editorRef.current && viewMode === 'visual' && isInitialized) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, viewMode, isInitialized]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const sizeMap: { [key: string]: string } = {
      '8pt': '1',
      '10pt': '2',
      '12pt': '3',
      '14pt': '4',
      '18pt': '5',
      '24pt': '6',
      '36pt': '7'
    };
    execCommand('fontSize', sizeMap[size] || '3');
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    execCommand('foreColor', color);
  };

  const handleAlign = (align: string) => {
    execCommand(`justify${align}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleInput = () => {
    if (editorRef.current) {
      try {
        document.execCommand('justifyLeft', false);
      } catch (e) {}
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '8px',
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ccc',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => execCommand('bold')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            <strong>B</strong>
          </button>
          <button 
            onClick={() => execCommand('italic')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              fontStyle: 'italic',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            <em>I</em>
          </button>
          <button 
            onClick={() => execCommand('underline')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              textDecoration: 'underline',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            <u>U</u>
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#ccc', margin: '0 4px' }}></div>
          
          <select 
            value={selectedFont}
            onChange={(e) => handleFontChange(e.target.value)}
            disabled={viewMode !== 'visual'}
            style={{ 
              padding: '4px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              height: '30px'
            }}
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>

          <select 
            value={selectedSize}
            onChange={(e) => handleSizeChange(e.target.value)}
            disabled={viewMode !== 'visual'}
            style={{ 
              padding: '4px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              height: '30px'
            }}
          >
            <option value="8pt">8pt</option>
            <option value="10pt">10pt</option>
            <option value="12pt">12pt</option>
            <option value="14pt">14pt</option>
            <option value="18pt">18pt</option>
            <option value="24pt">24pt</option>
            <option value="36pt">36pt</option>
          </select>

          <input 
            type="color" 
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={viewMode !== 'visual'}
            style={{ 
              width: '30px', 
              height: '30px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              padding: '2px'
            }}
          />

          <div style={{ width: '1px', height: '24px', backgroundColor: '#ccc', margin: '0 4px' }}></div>
          
          <button 
            onClick={() => handleAlign('Left')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            ⬅️
          </button>
          <button 
            onClick={() => handleAlign('Center')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            ⏺️
          </button>
          <button 
            onClick={() => handleAlign('Right')} 
            disabled={viewMode !== 'visual'}
            style={{
              padding: '4px 8px',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed',
              opacity: viewMode === 'visual' ? 1 : 0.5,
              minWidth: '30px'
            }}
            type="button"
          >
            ➡️
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => {
              setViewMode('visual');
              setIsInitialized(false);
            }}
            style={{
              padding: '4px 12px',
              background: viewMode === 'visual' ? '#3b82f6' : '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              color: viewMode === 'visual' ? '#fff' : '#333',
              fontWeight: viewMode === 'visual' ? 'bold' : 'normal'
            }}
            type="button"
          >
            Visuel
          </button>
          <button 
            onClick={() => setViewMode('html')}
            style={{
              padding: '4px 12px',
              background: viewMode === 'html' ? '#3b82f6' : '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              color: viewMode === 'html' ? '#fff' : '#333',
              fontWeight: viewMode === 'html' ? 'bold' : 'normal'
            }}
            type="button"
          >
            HTML
          </button>
        </div>
      </div>
      
      {viewMode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable={viewMode === 'visual'}
          onInput={handleInput}
          onBlur={handleInput}
          onContextMenu={handleContextMenu}
          style={{
            minHeight: '200px',
            padding: '12px',
            backgroundColor: 'white',
            cursor: 'text',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            overflowY: 'auto',
            fontFamily: selectedFont,
            direction: 'ltr',
            textAlign: 'left',
          }}
          suppressContentEditableWarning={true}
        >
          {value && <div dangerouslySetInnerHTML={{ __html: value }} />}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            border: 'none',
            outline: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
            direction: 'ltr',
            textAlign: 'left',
          }}
        />
      )}
    </div>
  );
};

function CreerAnnonce({ produitId, onRetour, vendeurId }: { produitId?: string; onRetour?: () => void; vendeurId?: number } = {}) {
  const modeModifier = !!produitId;
  const naviguerRetour = () => { if (onRetour) onRetour(); };
  const [chargementInitial, setChargementInitial] = useState(modeModifier);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const afficherToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const [typeProduit, setTypeProduit] = useState('physique');
  const [nomProduit, setNomProduit] = useState('');
  const [description, setDescription] = useState('');
  const [unitePoids, setUnitePoids] = useState('kg');
  const [unitePoidsBloquee, setUnitePoidsBloquee] = useState(true);
  const [poids, setPoids] = useState('0');
  const [expeditionNecessaire, setExpeditionNecessaire] = useState(true);
  const [prix, setPrix] = useState('');
  const [prixOriginal, setPrixOriginal] = useState('');
  const [prixRevient, setPrixRevient] = useState('');
  const [facturationTaxes, setFacturationTaxes] = useState(false);
  const [codeBarres, setCodeBarres] = useState('');
  const [suiviInventaire, setSuiviInventaire] = useState('suivre');
  const [quantiteMinimum, setQuantiteMinimum] = useState('1');
  const [quantite, setQuantite] = useState('0');
  const [ville, setVille] = useState('CANADA');
  const [modeExpeditionOffert, setModeExpeditionOffert] = useState({
    transporteur: true,
    ramassage: false
  });
  const [typeAnnonce, setTypeAnnonce] = useState('neuf');
  const [etatArticle, setEtatArticle] = useState('neuf');
  const [retourOffert, setRetourOffert] = useState('non');
  const [garantieOfferte, setGarantieOfferte] = useState('aucune');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [sku, setSku] = useState('');
  const [upc, setUpc] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [paysFabrication, setPaysFabrication] = useState('');
  const [poidsReel, setPoidsReel] = useState('');
  const [formats, setFormats] = useState('');
  const [adresseVente, setAdresseVente] = useState('');
  const [lienYoutube, setLienYoutube] = useState('');

  // États pour les produits numériques
  const [produitNumeriqueType, setProduitNumeriqueType] = useState<ProduitNumeriqueType>('fichier');
  const [fichierNumerique, setFichierNumerique] = useState<File | null>(null);
  const [fichierError, setFichierError] = useState('');
  const [lienNumerique, setLienNumerique] = useState('');
  const [joursAccessibles, setJoursAccessibles] = useState('0');
  const [nombreTelechargements, setNombreTelechargements] = useState('0');

  // États pour la date de parution
  const [typeParution, setTypeParution] = useState('immediate');
  const [dateParution, setDateParution] = useState('');

  // États pour les images produit
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [altModalOpen, setAltModalOpen] = useState(false);
  const [tempAltText, setTempAltText] = useState('');
  const [tempRotation, setTempRotation] = useState(0);
  const [tempWidth, setTempWidth] = useState(800);
  const [tempHeight, setTempHeight] = useState(800);

  // États pour le recadrage
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // État pour la vidéo produit
  const [productVideo, setProductVideo] = useState<ProductVideo | null>(null);
  const [videoError, setVideoError] = useState('');

  // État pour le modal d'erreur de validation
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [champsManquants, setChampsManquants] = useState<string[]>([]);
  const [maxCategoriesModalOpen, setMaxCategoriesModalOpen] = useState(false);
  const [maxTagsModalOpen, setMaxTagsModalOpen] = useState(false);

  // États pour les variantes
  const [options, setOptions] = useState<VariantOption[]>([
    { 
      id: 'opt1', 
      nom: 'Couleur', 
      valeurs: [
        { id: 'val1', valeur: 'Noir' },
        { id: 'val2', valeur: 'Blanc' },
        { id: 'val3', valeur: 'Rose' }
      ] 
    },
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [nouvelleOptionNom, setNouvelleOptionNom] = useState('');
  const [nouvelleOptionValeurs, setNouvelleOptionValeurs] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState(false);
  const [variantView, setVariantView] = useState<'options' | 'table'>('options');
  const [prixParDefaut, setPrixParDefaut] = useState('18.50');
  const [poidsParDefaut, setPoidsParDefaut] = useState('0.10');

  // États pour les catégories — chargées depuis la BD
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<Categorie[]>([]);
  const [rechercheCategorie, setRechercheCategorie] = useState('');
  const [showCategorieDropdown, setShowCategorieDropdown] = useState(false);
  const categorieDropdownRef = useRef<HTMLDivElement>(null);

  // États pour les tags — chargés depuis la BD
  const [tagsDisponibles, setTagsDisponibles] = useState<Tag[]>([]);
  const [tagsSelectionnes, setTagsSelectionnes] = useState<Tag[]>([]);
  const [rechercheTag, setRechercheTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categorieDropdownRef.current && !categorieDropdownRef.current.contains(event.target as Node)) {
        setShowCategorieDropdown(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les catégories selon la recherche
  const categoriesFiltrees = categories.filter(cat => 
    cat.nom.toLowerCase().includes(rechercheCategorie.toLowerCase()) &&
    !categoriesSelectionnees.some(sel => sel.id === cat.id)
  );

  // Filtrer les tags selon la recherche
  const tagsFiltres = tagsDisponibles.filter(tag => 
    tag.nom.toLowerCase().includes(rechercheTag.toLowerCase()) &&
    !tagsSelectionnes.some(sel => sel.id === tag.id)
  );

  //
  const ajouterCategorie = (categorie: Categorie) => {
    if (categoriesSelectionnees.length >= 5) {
      setMaxCategoriesModalOpen(true);
      return;
    }
    setCategoriesSelectionnees([...categoriesSelectionnees, categorie]);
    setRechercheCategorie('');
    setShowCategorieDropdown(false);
  };

  // Supprimer une catégorie
  const supprimerCategorie = (categorieId: string) => {
    setCategoriesSelectionnees(categoriesSelectionnees.filter(cat => cat.id !== categorieId));
  };

  //
  const ajouterTag = (tag: Tag) => {
    if (tagsSelectionnes.length >= 5) {
      setMaxTagsModalOpen(true);
      return;
    }
    setTagsSelectionnes([...tagsSelectionnes, tag]);
    setRechercheTag('');
    setShowTagDropdown(false);
  };

  // Supprimer un tag
  const supprimerTag = (tagId: string) => {
    setTagsSelectionnes(tagsSelectionnes.filter(tag => tag.id !== tagId));
  };

  // Fonction pour obtenir la date minimale (30 minutes dans le futur)
  const getDateMinimale = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  // Calcul du profit
  const calculerProfit = () => {
    const prixVente = parseFloat(prix) || 0;
    const prixCost = parseFloat(prixRevient) || 0;
    return (prixVente - prixCost).toFixed(2);
  };

  // Fonction de validation des champs obligatoires
  const validerChampsObligatoires = () => {
    const manquants: string[] = [];

    if (!typeProduit) manquants.push('Choisir le produit');
    if (!nomProduit.trim()) manquants.push('Nom du produit');
    if (!description.trim()) manquants.push('Description');
    if (productImages.length === 0) manquants.push('Images du produit');
    if (!prix) manquants.push('Prix de vente');
    if (typeProduit === 'physique' && !poids) manquants.push('Poids');
    if (!ville.trim()) manquants.push('Ville');
    if (!typeAnnonce) manquants.push("Type d'annonce");
    if (!etatArticle) manquants.push("État de l'article");
    if (!retourOffert) manquants.push('Retour offert');
    if (!garantieOfferte) manquants.push('Garantie offerte');
    if (!quantite) manquants.push('Quantité disponible');
    if (categoriesSelectionnees.length === 0) manquants.push('Catégories (au moins une)');

    // Validation de la date de parution future
    if (typeParution === 'future' && !dateParution) {
      manquants.push('Date et heure de parution');
    }

    // Validation des champs produit numérique
    if (typeProduit === 'numerique') {
      if (produitNumeriqueType === 'fichier') {
        if (!joursAccessibles || joursAccessibles === '0') manquants.push('Nombre de jours accessibles');
        if (!nombreTelechargements || nombreTelechargements === '0') manquants.push('Nombre de téléchargements autorisés');
      }
      if (produitNumeriqueType === 'lien') {
        if (!lienNumerique.trim()) manquants.push('Lien vers le fichier de produit numérique');
        if (!joursAccessibles || joursAccessibles === '0') manquants.push('Nombre de jours accessibles');
        if (!nombreTelechargements || nombreTelechargements === '0') manquants.push('Nombre de téléchargements autorisés');
      }
    }

    return manquants;
  };

  // Gestionnaire d'enregistrement
  const handleEnregistrer = async (statut: 'actif' | 'brouillon' = 'actif') => {
    const manquants = validerChampsObligatoires();
    if (statut === 'actif' && manquants.length > 0) {
      setChampsManquants(manquants);
      setValidationModalOpen(true);
      return;
    }

    setSauvegardeEnCours(true);
    try {
      const body = {
        vendeur_id: vendeurId ?? undefined,
        nom: nomProduit,
        description,
        prix: parseFloat(prix) || 0,
        stock: parseInt(quantite) || 0,
        sku,
        marque,
        modele,
        poids: parseFloat(poids) || 0,
        hauteur: parseFloat(hauteur) || null,
        largeur: parseFloat(largeur) || null,
        longueur: parseFloat(longueur) || null,
        type_annonce: typeAnnonce,
        etat: etatArticle,
        retour_offert: retourOffert,
        garantie: garantieOfferte,
        pays_fabrication: paysFabrication,
        lien_youtube: lienYoutube,
        adresse_vente: adresseVente,
        formats,
        code_barres: codeBarres,
        suivi_inventaire: suiviInventaire,
        quantite_minimum: parseInt(quantiteMinimum) || 1,
        produit_numerique: typeProduit === 'numerique',
        mode_expedition: modeExpeditionOffert,
        tags: tagsSelectionnes.map(t => t.nom).join(','),
        categorie_id: categoriesSelectionnees.length > 0 ? categoriesSelectionnees[0].id : null,
        statut,
        date_parution: typeParution === 'future' && dateParution ? dateParution : null,
        type_vente: 'standard',
        // Images : séparer les existantes (URL) des nouvelles (à uploader)
        image: productImages.length > 0 ? productImages[0].url : null,
        images: productImages.map(img => img.url),
      };

      let res;
      if (modeModifier) {
        res = await fetch(`${API_BASE}/produits-vendeur/${produitId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/produits-vendeur`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) throw new Error('Erreur serveur');
      afficherToast(modeModifier ? '✅ Annonce modifiée avec succès!' : '✅ Annonce créée avec succès!');
      setTimeout(() => naviguerRetour(), 1500);
    } catch (err) {
      afficherToast('❌ Erreur lors de la sauvegarde');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  // Effet pour gérer le poids quand le type de produit change
  useEffect(() => {
    if (typeProduit === 'numerique') {
      setPoids('0');
      setExpeditionNecessaire(false);
    } else {
      setPoids('');
      setExpeditionNecessaire(true);
    }
  }, [typeProduit]);

  // ─── CHARGEMENT INITIAL : catégories, tags, et produit si mode modifier ───
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        // Charger catégories
        const resCat = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
        if (resCat.ok) {
          const dataCat = await resCat.json();
          setCategories((dataCat.categories || dataCat).map((c: any) => ({ id: String(c.id), nom: c.nom })));
        }
      } catch (e) {}

      try {
        // Charger tags
        const resTag = await fetch(`${API_BASE}/tags`, { headers: authHeaders() });
        if (resTag.ok) {
          const dataTag = await resTag.json();
          setTagsDisponibles((dataTag.tags || dataTag).map((t: any) => ({ id: String(t.id), nom: t.nom })));
        }
      } catch (e) {}

      // Mode modifier : charger les données du produit
      if (modeModifier && produitId) {
        try {
          const res = await fetch(`${API_BASE}/produits-vendeur/${produitId}`, { headers: authHeaders() });
          if (res.ok) {
            const p = await res.json();
            setNomProduit(p.nom || '');
            setDescription(p.description || '');
            setPrix(p.prix ? String(p.prix) : '');
            setQuantite(p.stock ? String(p.stock) : '0');
            setSku(p.sku || '');
            setMarque(p.marque || '');
            setModele(p.modele || '');
            setPoids(p.poids ? String(p.poids) : '0');
            setHauteur(p.hauteur ? String(p.hauteur) : '');
            setLargeur(p.largeur ? String(p.largeur) : '');
            setLongueur(p.longueur ? String(p.longueur) : '');
            setTypeAnnonce(p.typeAnnonce || p.type_annonce || 'neuf');
            setEtatArticle(p.etat || 'neuf');
            setRetourOffert(p.retourOffert || p.retour_offert || 'non');
            setGarantieOfferte(p.garantie || 'aucune');
            setPaysFabrication(p.paysFabrication || p.pays_fabrication || '');
            setLienYoutube(p.lienYoutube || p.lien_youtube || '');
            setAdresseVente(p.adresseVente || p.adresse_vente || '');
            setFormats(p.formats || '');
            setCodeBarres(p.codeBarres || p.code_barres || '');
            setSuiviInventaire(p.suiviInventaire || p.suivi_inventaire || 'suivre');
            setQuantiteMinimum(p.quantiteMinimum ? String(p.quantiteMinimum) : '1');
            setTypeProduit(p.produitNumerique || p.produit_numerique ? 'numerique' : 'physique');
            if (p.modeExpedition || p.mode_expedition) {
              setModeExpeditionOffert(p.modeExpedition || p.mode_expedition);
            }
            if (p.tags) {
              const tagsList = Array.isArray(p.tags)
                ? p.tags
                : p.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
              setTagsSelectionnes(tagsList.map((nom: string, i: number) => ({ id: String(i), nom })));
            }
            if (p.categorie_id) {
              setCategoriesSelectionnees([{ id: String(p.categorie_id), nom: p.categorie || '' }]);
            }
            if (p.date_parution) {
              setTypeParution('future');
              setDateParution(p.date_parution.slice(0, 16));
            }

            // ── Charger les images existantes depuis les URLs BD ───────────
            const urls: string[] = [];
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
              urls.push(...p.images.filter(Boolean));
            } else if (p.image) {
              urls.push(p.image);
            }
            if (urls.length > 0) {
              const existingImages: ProductImage[] = urls.map((url: string, i: number) => ({
                id: `existing-${i}-${Date.now()}`,
                url,
                altText: '',
                rotation: 0,
                isExisting: true,
              }));
              setProductImages(existingImages);
            }
          }
        } catch (e) {
          console.error('Erreur chargement produit:', e);
        }
        setChargementInitial(false);
      }
    };
    chargerDonnees();
  }, [produitId]);

  // Générer les combinaisons de variantes
  const generateCombinations = () => {
    if (options.length === 0) return [];

    const generate = (index: number, current: { [key: string]: string }): Array<{ [key: string]: string }> => {
      if (index === options.length) return [current];

      const results: Array<{ [key: string]: string }> = [];
      const option = options[index];

      option.valeurs.forEach(valeur => {
        if (valeur.valeur.trim() !== '') {
          const newCurrent = { ...current, [option.nom]: valeur.valeur };
          results.push(...generate(index + 1, newCurrent));
        }
      });

      return results;
    };

    return generate(0, {});
  };

  // Mettre à jour les variantes
  useEffect(() => {
    const combinaisons = generateCombinations();
    const newVariants = combinaisons.map(comb => {
      const existingVariant = variants.find(v => 
        Object.keys(comb).every(key => v.combinaison[key] === comb[key])
      );

      return {
        id: existingVariant?.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        combinaison: comb,
        prix: existingVariant?.prix || prixParDefaut,
        quantite: existingVariant?.quantite || '1',
        sku: existingVariant?.sku || '',
        poids: existingVariant?.poids || poidsParDefaut,
        codeBarres: existingVariant?.codeBarres || '',
        image: existingVariant?.image || '',
      };
    });
    setVariants(newVariants);
  }, [options]);

  const ajouterOption = () => {
    if (nouvelleOptionNom && nouvelleOptionValeurs) {
      const valeurs = nouvelleOptionValeurs.split(',').map(v => v.trim()).map((v, index) => ({
        id: `val-${Date.now()}-${index}`,
        valeur: v
      }));

      setOptions([...options, { 
        id: `opt-${Date.now()}`, 
        nom: nouvelleOptionNom, 
        valeurs 
      }]);
      setNouvelleOptionNom('');
      setNouvelleOptionValeurs('');
      setShowAddOption(false);
    }
  };

  const supprimerOption = (optionId: string) => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const mettreAJourNomOption = (optionId: string, nouveauNom: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId ? { ...opt, nom: nouveauNom } : opt
    ));
  };

  const ajouterValeurOption = (optionId: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId 
        ? { 
            ...opt, 
            valeurs: [...opt.valeurs, { id: `val-${Date.now()}`, valeur: '' }] 
          } 
        : opt
    ));
  };

  const mettreAJourValeurOption = (optionId: string, valeurId: string, nouvelleValeur: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId 
        ? { 
            ...opt, 
            valeurs: opt.valeurs.map(v => 
              v.id === valeurId ? { ...v, valeur: nouvelleValeur } : v
            ) 
          } 
        : opt
    ));
  };

  const supprimerValeurOption = (optionId: string, valeurId: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId 
        ? { ...opt, valeurs: opt.valeurs.filter(v => v.id !== valeurId) } 
        : opt
    ));
  };

  const mettreAJourVariant = (variantId: string, champ: keyof Variant, valeur: string) => {
    setVariants(variants.map(v => 
      v.id === variantId ? { ...v, [champ]: valeur } : v
    ));
  };

  const handleVariantImageUpload = (variantId: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setVariants(variants.map(v => 
      v.id === variantId ? { ...v, image: imageUrl, imageFile: file } : v
    ));
  };

  const appliquerPrixParDefaut = () => {
    setVariants(variants.map(v => ({ ...v, prix: prixParDefaut })));
  };

  const appliquerPoidsParDefaut = () => {
    setVariants(variants.map(v => ({ ...v, poids: poidsParDefaut })));
  };

  // Fonctions pour déplacer les options
  const deplacerOptionVersLeHaut = (optionId: string) => {
    const index = options.findIndex(opt => opt.id === optionId);
    if (index <= 0) return;
    
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setOptions(newOptions);
  };

  const deplacerOptionVersLeBas = (optionId: string) => {
    const index = options.findIndex(opt => opt.id === optionId);
    if (index === -1 || index === options.length - 1) return;
    
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
  };

  // Fonctions pour déplacer les valeurs
  const deplacerValeurVersLeHaut = (optionId: string, valeurId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    const valeurIndex = options[optionIndex].valeurs.findIndex(v => v.id === valeurId);
    if (valeurIndex <= 0) return;
    
    const newOptions = [...options];
    const newValeurs = [...newOptions[optionIndex].valeurs];
    [newValeurs[valeurIndex - 1], newValeurs[valeurIndex]] = [newValeurs[valeurIndex], newValeurs[valeurIndex - 1]];
    newOptions[optionIndex].valeurs = newValeurs;
    setOptions(newOptions);
  };

  const deplacerValeurVersLeBas = (optionId: string, valeurId: string) => {
    const optionIndex = options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    const valeurIndex = options[optionIndex].valeurs.findIndex(v => v.id === valeurId);
    if (valeurIndex === -1 || valeurIndex === options[optionIndex].valeurs.length - 1) return;
    
    const newOptions = [...options];
    const newValeurs = [...newOptions[optionIndex].valeurs];
    [newValeurs[valeurIndex], newValeurs[valeurIndex + 1]] = [newValeurs[valeurIndex + 1], newValeurs[valeurIndex]];
    newOptions[optionIndex].valeurs = newValeurs;
    setOptions(newOptions);
  };

  // Gestion des images produit
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (productImages.length + files.length > 9) {
      alert('Vous ne pouvez télécharger que 9 images maximum (1 place réservée pour la vidéo)');
      return;
    }

    const newImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setTempWidth(img.width);
        setTempHeight(img.height);
      };
      img.src = url;

      newImages.push({
        id: `img-${Date.now()}-${i}`,
        file,
        url,
        altText: '',
        rotation: 0,
        width: img.width,
        height: img.height,
      });
    }

    setProductImages([...productImages, ...newImages]);
  };

  const deleteImage = (imageId: string) => {
    setProductImages(productImages.filter(img => img.id !== imageId));
  };

  const openAltModal = (image: ProductImage) => {
    setSelectedImage(image);
    setTempAltText(image.altText);
    setTempRotation(image.rotation);
    setTempWidth(image.width || 800);
    setTempHeight(image.height || 800);
    setAltModalOpen(true);
  };

  const saveAltText = () => {
    if (!selectedImage) return;

    setProductImages(productImages.map(img => 
      img.id === selectedImage.id 
        ? { 
            ...img, 
            altText: tempAltText, 
            rotation: tempRotation,
            width: tempWidth,
            height: tempHeight,
          } 
        : img
    ));
    setAltModalOpen(false);
    setSelectedImage(null);
  };

  // Fonctions de recadrage
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropImage = (image: ProductImage) => {
    setCropImage(image.url);
    setCropModalOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImg(
        selectedImage.url,
        croppedAreaPixels,
        0
      );

      const croppedUrl = URL.createObjectURL(croppedFile);
      
      setProductImages(productImages.map(img => 
        img.id === selectedImage.id 
          ? { 
              ...img, 
              file: croppedFile,
              url: croppedUrl,
              width: croppedAreaPixels.width,
              height: croppedAreaPixels.height,
            } 
          : img
      ));

      setCropModalOpen(false);
      setCropImage(null);
    } catch (error) {
      console.error('Erreur de recadrage:', error);
      alert('Erreur lors du recadrage de l\'image');
    }
  };

  // Gestion de la vidéo produit
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError('');

    if (!file.type.startsWith('video/')) {
      setVideoError('Le fichier doit être une vidéo');
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      if (video.duration > 10) {
        setVideoError('⚠️ LA VIDÉO NE DOIT PAS DÉPASSER 10 SECONDES ⚠️');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setVideoError('⚠️ LA VIDÉO NE DOIT PAS DÉPASSER 50 Mo ⚠️');
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg');

      setProductVideo({
        id: `video-${Date.now()}`,
        file,
        url: videoUrl,
        thumbnail: thumbnailUrl,
        duration: video.duration
      });
      setVideoError('');
    };
    video.src = URL.createObjectURL(file);
  };

  const deleteVideo = () => {
    if (productVideo) {
      URL.revokeObjectURL(productVideo.url);
      setProductVideo(null);
    }
  };

  // Gestion des fichiers numériques - LIMITE À 50 MO
  const handleFichierNumeriqueUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFichierError('');

    if (file.size > 50 * 1024 * 1024) {
      setFichierError('⚠️ FICHIER TROP GROS - DÉPASSE 50 Mo ⚠️ Veuillez plutôt utiliser le type "Produit numérique comme lien" pour les fichiers volumineux.');
      setFichierNumerique(null);
      return;
    }

    setFichierNumerique(file);
    setFichierError('');
  };

  const sectionStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e1e3e5',
    width: '100%',
    boxSizing: 'border-box'
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#537373',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
  };

  const sectionSubtitleStyle = {
    fontSize: '13px',
    color: '#999',
    marginBottom: '16px',
  };

    return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* Toast notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toastMsg.startsWith('❌') ? '#d32f2f' : '#388e3c',
          color: 'white', padding: '12px 20px', borderRadius: '8px',
          fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>{toastMsg}</div>
      )}

      {/* Spinner chargement initial */}
      {chargementInitial ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #537373', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#537373', fontWeight: '600' }}>Chargement de l'annonce...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
      <Page
        title={modeModifier ? "✏️ Modifier l'annonce" : "➕ Créer une annonce"}
        subtitle={modeModifier ? "Modifiez les informations de votre annonce." : "Ici vous pouvez ajouter produits dans votre magasin."}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60% calc(40% - 16px)',
          gap: '16px',
          width: '100%',
          alignItems: 'flex-start',
        }}>
          
          {/* ── COLONNE GAUCHE 60% ───────────────────────────────────────── */}
          <div style={{ minWidth: 0, boxSizing: 'border-box' }}>
            <BlockStack gap="400">

              {/* 1. Détails du produit */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  📦 Détails du produit
                  <HelpIcon text="Saisissez les informations de base de votre produit." />
                </div>
                <p style={sectionSubtitleStyle}>Ajouter détails du produit ici</p>
                <BlockStack gap="400">
                  <Select
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Choisir le produit <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Sélectionnez le type de produit : • Produit physique : article livré physiquement à l'acheteur. • Produit numérique : contenu téléchargeable ou accès numérique, sans expédition." />
                      </span>
                    }
                    options={[
                      { label: 'Produit normal (physique)', value: 'physique' },
                      { label: 'Produit numérique', value: 'numerique' },
                    ]}
                    value={typeProduit}
                    onChange={(value) => setTypeProduit(value)}
                  />
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Nom du produit <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Correspond au titre de l'annonce affiché sur la boutique et visible par les acheteurs." />
                      </span>
                    }
                    value={nomProduit}
                    onChange={(value) => setNomProduit(value)}
                    placeholder="Entrez le nom du produit ici"
                    autoComplete="off"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Description <span style={{ color: 'red', fontSize: '16px' }}>*</span></span>
                      <HelpIcon text="Décrivez les caractéristiques, les avantages et les détails importants de votre produit." />
                    </div>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Entrez la description du produit..."
                    />
                  </div>
                </BlockStack>
              </div>

              {/* 2. Images du produit */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  🖼️ Images du produit <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                  <HelpIcon text="Téléchargez jusqu'à 9 images et 1 vidéo de votre produit. Format recommandé pour images : 1024x1024px, max 15 Mo. Vidéo max 10 secondes, 50 Mo." />
                </div>
                <p style={sectionSubtitleStyle}>Vous pouvez télécharger jusqu'à 9 images et 1 vidéo.</p>

                {/* GRILLE IMAGES */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '10px',
                  marginBottom: '20px',
                  width: '100%',
                }}>
                  
                  {/* 10 EMPLACEMENTS */}
                  {[...Array(10)].map((_, index) => {
                    const image = productImages[index];
                    
                    if (index === 9) {
                      return (
                        <div
                          key={`video-slot`}
                          style={{
                            aspectRatio: '1 / 1',
                            width: '100%',
                            minWidth: '80px',
                            borderRadius: '8px',
                            border: productVideo ? '2px solid #3b82f6' : '2px dashed #e1e3e5',
                            backgroundColor: productVideo ? '#000' : '#fafafa',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '12px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: productVideo ? 'pointer' : 'pointer',
                          }}
                          onClick={() => !productVideo && document.getElementById('video-upload')?.click()}
                        >
                          {productVideo ? (
                            <>
                              {productVideo.thumbnail ? (
                                <img 
                                  src={productVideo.thumbnail} 
                                  alt="Video thumbnail"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <div style={{ color: 'white', fontSize: '24px' }}>🎬</div>
                              )}
                              <div style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '4px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                              }}>
                                {Math.round(productVideo.duration || 0)}s
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVideo();
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255,0,0,0.8)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  zIndex: 2,
                                }}
                              >
                                ✕
                              </button>
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '30px',
                                color: 'white',
                                textShadow: '0 0 10px rgba(0,0,0,0.5)',
                              }}>
                                ▶️
                              </div>
                            </>
                          ) : (
                            <div 
                              style={{ 
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%'
                              }} 
                              onClick={() => document.getElementById('video-upload')?.click()}
                            >
                              <span style={{ fontSize: '30px', opacity: 0.7, marginBottom: '4px' }}>🎬</span>
                              <p style={{ fontSize: '11px', margin: 0, textAlign: 'center' }}>Cliquer pour ajouter</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    if (image) {
                      return (
                        <div
                          key={image.id}
                          style={{
                            position: 'relative',
                            aspectRatio: '1 / 1',
                            width: '100%',
                            minWidth: '80px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #e1e3e5',
                            backgroundColor: '#f5f5f5',
                            cursor: 'pointer',
                          }}
                          onClick={() => openAltModal(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.altText || 'Image produit'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transform: `rotate(${image.rotation}deg)`,
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              zIndex: 2,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`empty-${index}`}
                          style={{
                            aspectRatio: '1 / 1',
                            width: '100%',
                            minWidth: '80px',
                            borderRadius: '8px',
                            border: '2px dashed #e1e3e5',
                            backgroundColor: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          {index === 0 && productImages.length === 0 ? (
                            <div style={{ padding: '10px' }}>Cliquez pour ajouter</div>
                          ) : ''}
                        </div>
                      );
                    }
                  })}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="image-upload"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    📁 Télécharger des images
                  </Button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="file"
                    accept="video/*"
                    id="video-upload"
                    style={{ display: 'none' }}
                    onChange={handleVideoUpload}
                  />
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => document.getElementById('video-upload')?.click()}
                    disabled={!!productVideo}
                  >
                    🎬 {productVideo ? 'Vidéo déjà téléchargée' : 'Ajouter une vidéo (max 10 sec, 50 Mo)'}
                  </Button>
                  {videoError && (
                    <p style={{ 
                      color: 'red', 
                      fontSize: '14px', 
                      marginTop: '8px',
                      fontWeight: 'bold',
                      backgroundColor: '#ffeeee',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ffcccc'
                    }}>
                      {videoError}
                    </p>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  {productImages.length}/9 images téléchargées. {productVideo ? '1/1 vidéo' : '0/1 vidéo'}. 
                  Images: 1024x1024 max 15 Mo. Vidéo: max 10 secondes, 50 Mo.
                </p>
              </div>

              {/* 3. Détails de l'inventaire */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  📊 Détails de l'inventaire
                  <HelpIcon text="Gérez le stock, les codes-barres et les quantités minimales d'achat pour votre produit." />
                </div>
                <p style={sectionSubtitleStyle}>Ajouter détails de l'inventaire ici</p>
                <BlockStack gap="400">
                  <TextField
                    label="SKU / Numéro de pièce"
                    value={sku}
                    onChange={(value) => setSku(value)}
                    placeholder="Entrez le SKU du produit ici"
                    autoComplete="off"
                  />
                  <TextField
                    label="Code à barres"
                    value={codeBarres || upc}
                    onChange={(value) => {
                      setCodeBarres(value);
                      setUpc(value);
                    }}
                    placeholder="Entrez le code-barres du produit ici"
                    autoComplete="off"
                  />
                  
                  {/* Suivi inventaire en premier */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Suivi inventaire</span>
                      <HelpIcon text="Suivre l'inventaire : lorsque le stock atteint 0, le produit devient indisponible à la vente. Ne pas suivre l'inventaire : le produit reste vendable en tout temps, même si la quantité est à 0." />
                    </div>
                    <Select
                      label=""
                      options={[
                        { label: "Suivre l'inventaire", value: 'suivre' },
                        { label: 'Ne pas suivre', value: 'non' },
                      ]}
                      value={suiviInventaire}
                      onChange={(value) => setSuiviInventaire(value)}
                    />
                  </div>

                  {/* Quantité minimum d'achat en deuxième */}
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Quantité minimum d'achat
                        <HelpIcon text="Permet de définir le nombre minimum d’articles que l’acheteur doit ajouter au panier par commande pour pouvoir acheter ce produit." />
                      </span>
                    }
                    value={quantiteMinimum}
                    onChange={(value) => setQuantiteMinimum(value)}
                    autoComplete="off"
                    type="number"
                  />

                  {/* Quantité disponible en troisième */}
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Quantité disponible <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Indique le nombre d’articles en stock pour ce produit. Ce chiffre sert à gérer le stock et à limiter les ventes si le suivi d’inventaire est activé." />
                      </span>
                    }
                    value={quantite}
                    onChange={(value) => setQuantite(value)}
                    autoComplete="off"
                    type="number"
                  />
                </BlockStack>
              </div>

              {/* 4. Variantes */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={sectionTitleStyle}>
                    🎨 Détails des variantes
                    <HelpIcon text="Créez des variantes pour les produits disponibles en plusieurs versions (tailles, couleurs, etc.)." />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        variant={variantView === 'options' ? 'primary' : 'plain'}
                        onClick={() => setVariantView('options')}
                        size="slim"
                      >
                        Options
                      </Button>
                      <Button 
                        variant={variantView === 'table' ? 'primary' : 'plain'}
                        onClick={() => setVariantView('table')}
                        size="slim"
                      >
                        Tableau
                      </Button>
                    </div>
                    <div
                      onClick={() => setExpandedVariants(!expandedVariants)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {expandedVariants ? '−' : '+'}
                    </div>
                  </div>
                </div>

                {expandedVariants && (
                  <BlockStack gap="400">
                    {variantView === 'options' && (
                      <div>
                        {options.map((option, optIndex) => (
                          <div 
                            key={option.id} 
                            style={{ 
                              marginBottom: '20px', 
                              padding: '16px', 
                              backgroundColor: '#f9f9f9', 
                              borderRadius: '6px',
                              border: '1px solid #eaeaea',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{option.nom}</h3>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button 
                                    onClick={() => deplacerOptionVersLeHaut(option.id)}
                                    disabled={optIndex === 0}
                                    style={{
                                      background: 'none',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      cursor: optIndex === 0 ? 'not-allowed' : 'pointer',
                                      opacity: optIndex === 0 ? 0.3 : 1,
                                      fontSize: '12px',
                                    }}
                                  >
                                    ↑
                                  </button>
                                  <button 
                                    onClick={() => deplacerOptionVersLeBas(option.id)}
                                    disabled={optIndex === options.length - 1}
                                    style={{
                                      background: 'none',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      cursor: optIndex === options.length - 1 ? 'not-allowed' : 'pointer',
                                      opacity: optIndex === options.length - 1 ? 0.3 : 1,
                                      fontSize: '12px',
                                    }}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                              <Button 
                                variant="plain" 
                                tone="critical"
                                onClick={() => supprimerOption(option.id)}
                                size="slim"
                              >
                                Supprimer
                              </Button>
                            </div>

                            <div style={{ marginLeft: '24px' }}>
                              <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>Valeurs d'option</p>

                              {option.valeurs.map((valeur, valIndex) => (
                                <div 
                                  key={valeur.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    marginBottom: '8px',
                                    padding: '4px',
                                    backgroundColor: '#fff',
                                    borderRadius: '4px',
                                    border: '1px solid #eaeaea',
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <TextField
                                      label=""
                                      value={valeur.valeur}
                                      onChange={(value) => mettreAJourValeurOption(option.id, valeur.id, value)}
                                      autoComplete="off"
                                      placeholder="Valeur"
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                      onClick={() => deplacerValeurVersLeHaut(option.id, valeur.id)}
                                      disabled={valIndex === 0}
                                      style={{
                                        background: 'none',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        cursor: valIndex === 0 ? 'not-allowed' : 'pointer',
                                        opacity: valIndex === 0 ? 0.3 : 1,
                                        fontSize: '12px',
                                      }}
                                    >
                                      ↑
                                    </button>
                                    <button 
                                      onClick={() => deplacerValeurVersLeBas(option.id, valeur.id)}
                                      disabled={valIndex === option.valeurs.length - 1}
                                      style={{
                                        background: 'none',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        cursor: valIndex === option.valeurs.length - 1 ? 'not-allowed' : 'pointer',
                                        opacity: valIndex === option.valeurs.length - 1 ? 0.3 : 1,
                                        fontSize: '12px',
                                      }}
                                    >
                                      ↓
                                    </button>
                                  </div>
                                  <Button 
                                    variant="plain" 
                                    tone="critical"
                                    onClick={() => supprimerValeurOption(option.id, valeur.id)}
                                    size="slim"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ))}

                              <div style={{ marginTop: '8px' }}>
                                <Button 
                                  variant="plain" 
                                  onClick={() => ajouterValeurOption(option.id)}
                                  size="slim"
                                >
                                  + Ajouter une valeur
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {!showAddOption ? (
                          <div style={{ marginTop: '16px' }}>
                            <Button 
                              variant="primary" 
                              onClick={() => setShowAddOption(true)}
                            >
                              + Ajouter une autre option
                            </Button>
                          </div>
                        ) : (
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: '#f0f4f8', 
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            marginBottom: '16px'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2c3e50' }}>Nouvelle option</p>
                            <div style={{ marginBottom: '12px' }}>
                              <TextField
                                label="Nom de l'option"
                                value={nouvelleOptionNom}
                                onChange={(value) => setNouvelleOptionNom(value)}
                                placeholder="Ex: Taille, Couleur, Matériau"
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <TextField
                                label="Valeurs (séparées par des virgules)"
                                value={nouvelleOptionValeurs}
                                onChange={(value) => setNouvelleOptionValeurs(value)}
                                placeholder="Ex: Petit, Moyen, Grand"
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button onClick={ajouterOption} variant="primary">Ajouter</Button>
                              <Button onClick={() => setShowAddOption(false)} variant="plain">Annuler</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {variantView === 'table' && variants.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px', backgroundColor: '#f0f4f8', borderRadius: '6px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px' }}>Prix par défaut:</span>
                            <div style={{ width: '100px' }}>
                              <TextField
                                label=""
                                value={prixParDefaut}
                                onChange={(value) => setPrixParDefaut(value)}
                                prefix="$"
                                autoComplete="off"
                              />
                            </div>
                            <Button onClick={appliquerPrixParDefaut} size="slim">Appliquer à tous</Button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px' }}>Poids par défaut:</span>
                            <div style={{ width: '100px' }}>
                              <TextField
                                label=""
                                value={poidsParDefaut}
                                onChange={(value) => setPoidsParDefaut(value)}
                                autoComplete="off"
                              />
                            </div>
                            <Button onClick={appliquerPoidsParDefaut} size="slim">Appliquer à tous</Button>
                          </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#537373', color: 'white' }}>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Image</th>
                                {options.map(opt => (
                                  <th key={opt.id} style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>{opt.nom}</th>
                                ))}
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Prix</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Poids (kg)</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Qté</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>SKU</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Code barres</th>
                              </tr>
                            </thead>
                            <tbody>
                              {variants.map((variant) => (
                                <tr key={variant.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                                  <td style={{ padding: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {variant.image ? (
                                        <img 
                                          src={variant.image} 
                                          alt={Object.values(variant.combinaison).join(' / ')} 
                                          style={{ 
                                            width: '50px', 
                                            height: '50px', 
                                            objectFit: 'cover', 
                                            borderRadius: '4px',
                                            border: '1px solid #eaeaea'
                                          }} 
                                        />
                                      ) : (
                                        <div style={{ 
                                          width: '50px', 
                                          height: '50px', 
                                          background: '#f5f5f5', 
                                          borderRadius: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '10px',
                                          color: '#999',
                                          border: '1px dashed #ccc'
                                        }}>
                                          Aucune
                                        </div>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id={`file-${variant.id}`}
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleVariantImageUpload(variant.id, e.target.files[0]);
                                          }
                                        }}
                                      />
                                      <Button
                                        variant="plain"
                                        size="slim"
                                        onClick={() => document.getElementById(`file-${variant.id}`)?.click()}
                                      >
                                        Choisir
                                      </Button>
                                    </div>
                                  </td>
                                  {options.map(opt => (
                                    <td key={opt.id} style={{ padding: '10px', fontSize: '13px' }}>
                                      {variant.combinaison[opt.nom] || '-'}
                                    </td>
                                  ))}
                                  <td style={{ padding: '10px' }}>
                                    <input
                                      type="text"
                                      value={variant.prix}
                                      onChange={(e) => mettreAJourVariant(variant.id, 'prix', e.target.value)}
                                      placeholder="Prix"
                                      style={{
                                        width: '80px',
                                        padding: '4px 8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px' }}>
                                    <input
                                      type="text"
                                      value={variant.poids || ''}
                                      onChange={(e) => mettreAJourVariant(variant.id, 'poids', e.target.value)}
                                      placeholder="Poids"
                                      style={{
                                        width: '70px',
                                        padding: '4px 8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px' }}>
                                    <input
                                      type="text"
                                      value={variant.quantite}
                                      onChange={(e) => mettreAJourVariant(variant.id, 'quantite', e.target.value)}
                                      placeholder="Qté"
                                      style={{
                                        width: '60px',
                                        padding: '4px 8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px' }}>
                                    <input
                                      type="text"
                                      value={variant.sku}
                                      onChange={(e) => mettreAJourVariant(variant.id, 'sku', e.target.value)}
                                      placeholder="SKU"
                                      style={{
                                        width: '100px',
                                        padding: '4px 8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px' }}>
                                    <input
                                      type="text"
                                      value={variant.codeBarres || ''}
                                      onChange={(e) => mettreAJourVariant(variant.id, 'codeBarres', e.target.value)}
                                      placeholder="Code"
                                      style={{
                                        width: '90px',
                                        padding: '4px 8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
                          Stock total : {variants.reduce((acc, v) => acc + (parseInt(v.quantite) || 0), 0)} disponibles
                        </div>
                      </div>
                    )}
                  </BlockStack>
                )}
              </div>

              {/* 5. Détails supplémentaires (anciennement Champs personnalisés) */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  ⚙️ Détails supplémentaires
                  <HelpIcon text="Configurez des options supplémentaires comme l'état de l'article, la garantie, etc." />
                </div>
                <p style={sectionSubtitleStyle}>Fournir plus de détails sur le produit aux clients.</p>
                <BlockStack gap="400">
                  
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Ville ou se situe l'article (carte Google) <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Indiquez la ville où se trouve l'article pour faciliter la livraison locale." />
                      </span>
                    }
                    value={ville}
                    onChange={(value) => setVille(value)}
                    autoComplete="off"
                  />
                  
                  <Select
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Type d'annonce <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Indiquez le type d'article que vous vendez." />
                      </span>
                    }
                    options={[
                      { label: 'Article neuf', value: 'neuf' },
                      { label: 'Article d\'occasion', value: 'occasion' },
                      { label: 'Article remis à neuf', value: 'remis-a-neuf' },
                    ]}
                    value={typeAnnonce}
                    onChange={(value) => setTypeAnnonce(value)}
                  />
                  <Select
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        État de l'article <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Décrivez l'état physique du produit selon l'échelle détaillée." />
                      </span>
                    }
                    options={[
                      { label: '1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine', value: 'neuf' },
                      { label: '2. Comme neuf – Utilisé une ou deux fois en excellent état', value: 'comme-neuf' },
                      { label: '3. Très bon état – Quelques signes mineurs d\'usure mais fonctionne parfaitement', value: 'tres-bon' },
                      { label: '4. Bon état – L\'article a été utilisé mais reste en bon état général', value: 'bon' },
                      { label: '5. État correct – Présente des marques d\'usure visibles mais fonctionne', value: 'correct' },
                      { label: '6. Usé / Bien utilisé – L\'article fonctionne mais montre des signes d\'usage importants', value: 'use' },
                      { label: '7. À réparer – Ne fonctionne pas ou endommagé – peut être réparé', value: 'a-reparer' },
                      { label: '8. Pour pièces – Non fonctionnel – vendu pour récupérer des pièces', value: 'pieces' },
                    ]}
                    value={etatArticle}
                    onChange={(value) => setEtatArticle(value)}
                  />
                  <Select
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Retour offert <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Indiquez si les retours sont acceptés pour ce produit." />
                      </span>
                    }
                    options={[
                      { label: 'Non, aucun retour offert', value: 'non' },
                      { label: 'Oui, voir détails dans description du produit', value: 'oui-description' },
                    ]}
                    value={retourOffert}
                    onChange={(value) => setRetourOffert(value)}
                  />
                  <Select
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Garantie offerte <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Choisissez la durée de garantie applicable à ce produit." />
                      </span>
                    }
                    options={[
                      { label: 'Aucune', value: 'aucune' },
                      { label: '30 jours', value: '30j' },
                      { label: '6 mois', value: '6m' },
                      { label: '1 an', value: '1an' },
                    ]}
                    value={garantieOfferte}
                    onChange={(value) => setGarantieOfferte(value)}
                  />
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Marque
                        <HelpIcon text="Nom de la marque du produit." />
                      </span>
                    } 
                    value={marque} 
                    onChange={(value) => setMarque(value)} 
                    autoComplete="off" 
                  />
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Modèle
                        <HelpIcon text="Référence du modèle du produit." />
                      </span>
                    } 
                    value={modele} 
                    onChange={(value) => setModele(value)} 
                    autoComplete="off" 
                  />
                  
                  {typeProduit === 'physique' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <TextField 
                        label={
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            Hauteur (cm)
                            <HelpIcon text="Hauteur du produit emballé en centimètres." />
                          </span>
                        } 
                        value={hauteur} 
                        onChange={(value) => setHauteur(value)} 
                        autoComplete="off" 
                        type="number" 
                      />
                      <TextField 
                        label={
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            Longueur (cm)
                            <HelpIcon text="Longueur du produit emballé en centimètres." />
                          </span>
                        } 
                        value={longueur} 
                        onChange={(value) => setLongueur(value)} 
                        autoComplete="off" 
                        type="number" 
                      />
                      <TextField 
                        label={
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            Largeur (cm)
                            <HelpIcon text="Largeur du produit emballé en centimètres." />
                          </span>
                        } 
                        value={largeur} 
                        onChange={(value) => setLargeur(value)} 
                        autoComplete="off" 
                        type="number" 
                      />
                    </div>
                  )}
                  
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Poids réel du produit (Kg)
                        <HelpIcon text="Poids exact du produit sans emballage, pour information." />
                      </span>
                    } 
                    value={poidsReel} 
                    onChange={(value) => setPoidsReel(value)} 
                    autoComplete="off" 
                    type="number" 
                  />
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Pays de fabrication
                        <HelpIcon text="Pays où le produit a été fabriqué." />
                      </span>
                    } 
                    value={paysFabrication} 
                    onChange={(value) => setPaysFabrication(value)} 
                    autoComplete="off" 
                  />
                  
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Formats / Grandeur
                        <HelpIcon text="Tailles disponibles (ex: S, M, L, XL)." />
                      </span>
                    } 
                    value={formats} 
                    onChange={(value) => setFormats(value)} 
                    autoComplete="off" 
                  />
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Adresse ou se trouve l'article en vente
                        <HelpIcon text="Adresse physique où se trouve l'article pour le ramassage." />
                      </span>
                    } 
                    value={adresseVente} 
                    onChange={(value) => setAdresseVente(value)} 
                    autoComplete="off" 
                  />
                  <TextField 
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Lien vidéo YouTube
                        <HelpIcon text="Ajoutez ici le lien de votre vidéo YouTube pour ce produit. Mettre juste le ID de la vidéo (juste les chiffres et lettres à la fin de l'URL, souvent après le =)" />
                      </span>
                    } 
                    value={lienYoutube} 
                    onChange={(value) => setLienYoutube(value)} 
                    autoComplete="off" 
                    placeholder="Ex: dQw4w9WgXcQ" 
                  />
                </BlockStack>
              </div>

            </BlockStack>
          </div>

          {/* ── COLONNE DROITE 40% ───────────────────────────────────────── */}
          <div style={{ minWidth: 0, boxSizing: 'border-box' }}>
            <BlockStack gap="400">

              {/* SECTION PRODUIT NUMÉRIQUE */}
              {typeProduit === 'numerique' && (
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>
                    📁 Détails du produit numérique
                    <HelpIcon text="Configurez les détails spécifiques à votre produit numérique." />
                  </div>
                  <p style={sectionSubtitleStyle}>Configurez les détails du produit numérique ici</p>
                  
                  <BlockStack gap="400">
                    <Select
                      label="Ajouter un produit numérique comme"
                      options={[
                        { label: 'Produit numérique sous forme de fichier', value: 'fichier' },
                        { label: 'Produit numérique comme lien', value: 'lien' },
                        { label: 'Produit numérique en tant que service', value: 'service' },
                      ]}
                      value={produitNumeriqueType}
                      onChange={(value) => setProduitNumeriqueType(value as ProduitNumeriqueType)}
                    />

                    {produitNumeriqueType === 'fichier' && (
                      <div>
                        <div style={{ marginBottom: '16px' }}>
                          <input
                            type="file"
                            id="fichier-numerique"
                            style={{ display: 'none' }}
                            onChange={handleFichierNumeriqueUpload}
                          />
                          <Button
                            variant="primary"
                            onClick={() => document.getElementById('fichier-numerique')?.click()}
                          >
                            📁 Télécharger le fichier
                          </Button>
                          {fichierNumerique && (
                            <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                              Fichier sélectionné : {fichierNumerique.name} ({(fichierNumerique.size / (1024 * 1024)).toFixed(2)} Mo)
                            </p>
                          )}
                          {fichierError && (
                            <p style={{ 
                              color: 'red', 
                              fontSize: '14px', 
                              marginTop: '8px',
                              fontWeight: 'bold',
                              backgroundColor: '#ffeeee',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #ffcccc'
                            }}>
                              {fichierError}
                            </p>
                          )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <TextField
                            label={
                              <span>
                                Nombre de jours accessibles <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            type="number"
                            value={joursAccessibles}
                            onChange={(value) => setJoursAccessibles(value)}
                            helpText="Par défaut, le nombre de jours accessibles est zéro (0), ce qui signifie un accès illimité au fichier pour le client"
                            autoComplete="off"
                          />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <TextField
                            label={
                              <span>
                                Nombre de téléchargements autorisés <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            type="number"
                            value={nombreTelechargements}
                            onChange={(value) => setNombreTelechargements(value)}
                            helpText="Par défaut, le nombre de téléchargements est zéro (0), ce qui signifie un téléchargement illimité de fichiers pour le client"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    )}

                    {produitNumeriqueType === 'lien' && (
                      <div>
                        <div style={{ marginBottom: '16px' }}>
                          <TextField
                            label={
                              <span>
                                Lien vers le fichier de produit numérique <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            value={lienNumerique}
                            onChange={(value) => setLienNumerique(value)}
                            placeholder="https://..."
                            autoComplete="off"
                          />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <TextField
                            label={
                              <span>
                                Nombre de jours accessibles <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            type="number"
                            value={joursAccessibles}
                            onChange={(value) => setJoursAccessibles(value)}
                            helpText="Par défaut, le nombre de jours accessibles est zéro (0), ce qui signifie un accès illimité au fichier pour le client"
                            autoComplete="off"
                          />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <TextField
                            label={
                              <span>
                                Nombre de téléchargements autorisés <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            type="number"
                            value={nombreTelechargements}
                            onChange={(value) => setNombreTelechargements(value)}
                            helpText="Par défaut, le nombre de téléchargements est zéro (0), ce qui signifie un téléchargement illimité de fichiers pour le client"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    )}

                    {produitNumeriqueType === 'service' && (
                      <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          Configuration spécifique pour les services à venir.
                        </p>
                      </div>
                    )}
                  </BlockStack>
                </div>
              )}

              {/* 1. Détails des prix */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  💰 Détails des prix
                  <HelpIcon text="Définissez le prix de vente, le prix original pour les promotions, et votre prix de revient pour suivre vos marges." />
                </div>
                <p style={sectionSubtitleStyle}>Ajouter détails des tarifs ici</p>
                <BlockStack gap="400">
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Prix de vente <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Le prix auquel le produit est vendu aux clients. C'est le montant qui sera affiché sur la boutique." />
                      </span>
                    }
                    value={prix}
                    onChange={(value) => setPrix(value)}
                    placeholder="Entrez le prix de vente ici"
                    autoComplete="off"
                    type="number"
                    prefix="$"
                  />
                  <TextField
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Prix régulier (prix original)
                        <HelpIcon text="Utilisez ce champ pour afficher un prix barré (ex: prix avant promotion). Laissez vide si aucun rabais." />
                      </span>
                    }
                    value={prixOriginal}
                    onChange={(value) => setPrixOriginal(value)}
                    placeholder="Si l'article est en spécial"
                    autoComplete="off"
                    type="number"
                    prefix="$"
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '100%' }}>
                      <TextField
                        label={
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            Prix de revient (cost price)
                            <HelpIcon text="Ce prix ne sera pas visible aux acheteurs. Il sert uniquement au vendeur pour calculer ses profits." />
                          </span>
                        }
                        value={prixRevient}
                        onChange={(value) => setPrixRevient(value)}
                        placeholder="Entrez le prix de revient"
                        autoComplete="off"
                        type="number"
                        prefix="$"
                      />
                    </div>
                    {prix && prixRevient && (
                      <div style={{
                        backgroundColor: '#e6f7e6',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2e7d32',
                        border: '1px solid #a5d6a7',
                        display: 'inline-block',
                        alignSelf: 'flex-start'
                      }}>
                        📈 Profit: ${calculerProfit()}
                      </div>
                    )}
                  </div>

                  <Checkbox
                    label="Facturer des taxes sur ce produit"
                    checked={facturationTaxes}
                    onChange={(checked) => setFacturationTaxes(checked)}
                  />
                </BlockStack>
              </div>

              {/* 2. Détails d'expédition */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  🚚 Détails d'expédition
                  <HelpIcon text="Configurez les paramètres d'expédition, y compris le poids, les dimensions et le mode de livraison." />
                </div>
                <p style={sectionSubtitleStyle}>Ajouter détails d'expédition ici</p>
                <BlockStack gap="400">
                  <Select
                    label="Unité de poids"
                    options={[
                      { label: 'Kilogram (kg)', value: 'kg' },
                    ]}
                    value={unitePoids}
                    onChange={(value) => setUnitePoids(value)}
                    disabled={true}
                  />
                  
                  <TextField
                    label={
                      typeProduit === 'physique' ? (
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          Poids (KG) pour frais d'expédition <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                          <HelpIcon text="" showShippingTable={true} />
                        </span>
                      ) : (
                        'Poids (KG) pour frais d\'expédition'
                      )
                    }
                    value={poids}
                    onChange={(value) => typeProduit !== 'numerique' && setPoids(value)}
                    placeholder={typeProduit === 'numerique' ? "0 kg (produit numérique)" : "Entrez le poids du produit ici"}
                    autoComplete="off"
                    type="number"
                    disabled={typeProduit === 'numerique'}
                  />
                  
                  <Checkbox
                    label="Expédition nécessaire"
                    checked={expeditionNecessaire}
                    onChange={(checked) => typeProduit !== 'numerique' && setExpeditionNecessaire(checked)}
                    disabled={typeProduit === 'numerique'}
                  />

                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Mode(s) d'expédition offert <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Sélectionnez les options d'expédition disponibles pour ce produit." />
                      </span>
                    </p>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                      <Checkbox
                        label="Expédition par transporteur"
                        checked={modeExpeditionOffert.transporteur}
                        onChange={(checked) => setModeExpeditionOffert({...modeExpeditionOffert, transporteur: checked})}
                        disabled={typeProduit === 'numerique'}
                      />
                      <Checkbox
                        label="Ramassage sur place"
                        checked={modeExpeditionOffert.ramassage}
                        onChange={(checked) => setModeExpeditionOffert({...modeExpeditionOffert, ramassage: checked})}
                        disabled={typeProduit === 'numerique'}
                      />
                    </div>
                  </div>
                </BlockStack>
              </div>

              {/* 3. Catégories (anciennement Collections) */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  📂 Catégories <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                  <HelpIcon text="Ajoutez ce produit à une ou plusieurs catégories pour le regrouper avec des produits similaires." />
                </div>
                <p style={sectionSubtitleStyle}>
                  Ajoutez ce produit à une catégorie afin qu'il soit facile à trouver dans votre magasin.
                </p>
                
                {/* Barre de recherche et dropdown pour catégories */}
                <div ref={categorieDropdownRef} style={{ position: 'relative', marginBottom: '16px' }}>
                  <TextField
                    label="Rechercher une catégorie"
                    value={rechercheCategorie}
                    onChange={setRechercheCategorie}
                    onFocus={() => setShowCategorieDropdown(true)}
                    placeholder="Tapez pour rechercher..."
                    autoComplete="off"
                    clearButton
                    onClearButtonClick={() => {
                      setRechercheCategorie('');
                      setShowCategorieDropdown(false);
                    }}
                  />
                  
                  {showCategorieDropdown && categoriesFiltrees.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      {categoriesFiltrees.map((categorie) => (
                        <div
                          key={categorie.id}
                          onClick={() => ajouterCategorie(categorie)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          {categorie.nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Catégories sélectionnées */}
                {categoriesSelectionnees.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                      Vos catégories sélectionnées:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {categoriesSelectionnees.map((categorie) => (
                        <div
                          key={categorie.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#e6f7e6',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #a5d6a7',
                            color: '#2e7d32',
                            fontSize: '13px'
                          }}
                        >
                          <span>{categorie.nom}</span>
                          <button
                            onClick={() => supprimerCategorie(categorie.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d32f2f',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              padding: '0 4px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {categoriesSelectionnees.length}/5 catégories sélectionnées
                </p>
              </div>

              {/* 4. Tags (nouvel encadré) */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  🏷️ Tags
                  <HelpIcon text="Ajoutez des tags à votre produit pour faciliter la recherche." />
                </div>
                <p style={sectionSubtitleStyle}>
                  Ajoutez des tags à votre produit (optionnel, max 5).
                </p>
                
                {/* Barre de recherche et dropdown pour tags */}
                <div ref={tagDropdownRef} style={{ position: 'relative', marginBottom: '16px' }}>
                  <TextField
                    label="Rechercher un tag"
                    value={rechercheTag}
                    onChange={setRechercheTag}
                    onFocus={() => setShowTagDropdown(true)}
                    placeholder="Tapez pour rechercher..."
                    autoComplete="off"
                    clearButton
                    onClearButtonClick={() => {
                      setRechercheTag('');
                      setShowTagDropdown(false);
                    }}
                  />
                  
                  {showTagDropdown && tagsFiltres.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      {tagsFiltres.map((tag) => (
                        <div
                          key={tag.id}
                          onClick={() => ajouterTag(tag)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          {tag.nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags sélectionnés */}
                {tagsSelectionnes.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                      Vos tags sélectionnés:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tagsSelectionnes.map((tag) => (
                        <div
                          key={tag.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#e6f7e6',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #a5d6a7',
                            color: '#2e7d32',
                            fontSize: '13px'
                          }}
                        >
                          <span>{tag.nom}</span>
                          <button
                            onClick={() => supprimerTag(tag.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d32f2f',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              padding: '0 4px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {tagsSelectionnes.length}/5 tags sélectionnés (optionnel)
                </p>
              </div>

              {/* 5. Date de parution */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  📅 Date de parution
                  <HelpIcon text="Choisissez quand le produit sera visible sur la boutique. La parution future rend le produit visible mais non achetable jusqu'à la date choisie." />
                </div>
                <p style={sectionSubtitleStyle}>Choisissez quand le produit sera visible sur la boutique.</p>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      id="parutionImmediate"
                      name="typeParution"
                      checked={typeParution === 'immediate'}
                      onChange={() => setTypeParution('immediate')}
                    />
                    <label htmlFor="parutionImmediate" style={{ fontSize: '13px', color: '#333' }}>
                      Immédiatement après enregistrement
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      id="parutionFuture"
                      name="typeParution"
                      checked={typeParution === 'future'}
                      onChange={() => setTypeParution('future')}
                    />
                    <label htmlFor="parutionFuture" style={{ fontSize: '13px', color: '#333' }}>
                      Parution future <span style={{ color: 'red', fontSize: '14px', marginLeft: '2px' }}>*</span>
                    </label>
                  </div>
                </div>

                {typeParution === 'future' && (
                  <div style={{ marginBottom: '12px' }}>
                    <TextField
                      label={
                        <span>
                          Date et heure de parution <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      type="datetime-local"
                      value={dateParution}
                      onChange={(value) => setDateParution(value)}
                      autoComplete="off"
                      min={getDateMinimale()}
                    />
                  </div>
                )}

                <div style={{
                  backgroundColor: '#fff8e7',
                  border: '1px solid #ffe6b3',
                  borderRadius: '6px',
                  padding: '10px',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#73510d',
                }}>
                  <strong>ℹ️ Note :</strong> En sélectionnant "Parution future", l'annonce sera visible sur la boutique mais ne sera pas disponible à la vente tant que la date de parution future n'est pas atteinte.
                </div>
              </div>

            </BlockStack>
          </div>

        </div>

        {/* Modals */}
        <Modal
          open={altModalOpen}
          onClose={() => setAltModalOpen(false)}
          title="Modifier l'image"
          primaryAction={{
            content: 'Enregistrer',
            onAction: saveAltText,
          }}
          secondaryActions={[
            {
              content: 'Annuler',
              onAction: () => setAltModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            {selectedImage && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '20px' }}>
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.altText || 'Image produit'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      transform: `rotate(${tempRotation}deg)`,
                      transition: 'transform 0.3s',
                      borderRadius: '8px',
                      border: '1px solid #e1e3e5',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <Button onClick={() => setTempRotation(prev => prev - 90)}>↺ Rotation gauche</Button>
                  <Button onClick={() => setTempRotation(prev => prev + 90)}>↻ Rotation droite</Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setAltModalOpen(false);
                      setTimeout(() => handleCropImage(selectedImage), 300);
                    }}
                  >
                    ✂️ Recadrer
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ width: '100px' }}>
                    <TextField
                      label="Largeur"
                      type="number"
                      value={String(tempWidth)}
                      onChange={(value) => setTempWidth(Number(value))}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <TextField
                      label="Hauteur"
                      type="number"
                      value={String(tempHeight)}
                      onChange={(value) => setTempHeight(Number(value))}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <TextField
                  label="Texte alternatif de l'image"
                  value={tempAltText}
                  onChange={(value) => setTempAltText(value)}
                  multiline={2}
                  helpText="Décrivez l'image pour l'accessibilité et le SEO. Max 450 caractères."
                  autoComplete="off"
                />

                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'left' }}>
                  Note : Max 450 caractères autorisés
                </p>
              </div>
            )}
          </Modal.Section>
        </Modal>

        <Modal
          open={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          title="Recadrer l'image"
          primaryAction={{
            content: 'Appliquer',
            onAction: handleCropConfirm,
          }}
          secondaryActions={[
            {
              content: 'Annuler',
              onAction: () => setCropModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            {cropImage && (
              <div style={{ height: '400px', position: 'relative', marginBottom: '20px' }}>
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                    },
                  }}
                />
              </div>
            )}
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#333' }}>
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <p style={{ fontSize: '12px', color: '#666', marginTop: '16px', fontStyle: 'italic' }}>
              Astuce: Utilise la molette de la souris pour zoomer, clique et glisse pour sélectionner la zone à garder.
            </p>
          </Modal.Section>
        </Modal>

        <Modal
          open={validationModalOpen}
          onClose={() => setValidationModalOpen(false)}
          title="❌ Champs obligatoires manquants"
          primaryAction={{
            content: 'Compris',
            onAction: () => setValidationModalOpen(false),
          }}
        >
          <Modal.Section>
            <p style={{ marginBottom: '16px', fontWeight: 'bold' }}>
              Veuillez remplir les champs obligatoires suivants :
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              {champsManquants.map((champ, index) => (
                <li key={index} style={{ marginBottom: '4px', color: '#d32f2f' }}>
                  {champ}
                </li>
              ))}
            </ul>
          </Modal.Section>
        </Modal>

        <Modal
          open={maxCategoriesModalOpen}
          onClose={() => setMaxCategoriesModalOpen(false)}
          title="❌ Limite atteinte"
          primaryAction={{
            content: 'Compris',
            onAction: () => setMaxCategoriesModalOpen(false),
          }}
        >
          <Modal.Section>
            <p style={{ marginBottom: '16px', fontWeight: 'bold', color: '#d32f2f' }}>
              Vous avez atteint le maximum de 5 catégories autorisées par produit.
            </p>
            <p>
              Veuillez retirer une catégorie existante avant d'en ajouter une nouvelle.
            </p>
          </Modal.Section>
        </Modal>

        <Modal
          open={maxTagsModalOpen}
          onClose={() => setMaxTagsModalOpen(false)}
          title="❌ Limite atteinte"
          primaryAction={{
            content: 'Compris',
            onAction: () => setMaxTagsModalOpen(false),
          }}
        >
          <Modal.Section>
            <p style={{ marginBottom: '16px', fontWeight: 'bold', color: '#d32f2f' }}>
              Vous avez atteint le maximum de 5 tags autorisés par produit.
            </p>
            <p>
              Veuillez retirer un tag existant avant d'en ajouter un nouveau.
            </p>
          </Modal.Section>
        </Modal>

        {/* BOUTONS EN BAS DE PAGE (SANS AUCUNE BARRE) */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <Button variant="primary" tone="success" onClick={() => handleEnregistrer('actif')} loading={sauvegardeEnCours}>
            ✅ {modeModifier ? 'Enregistrer les modifications' : 'Enregistrer et publier'}
          </Button>
          <Button onClick={() => handleEnregistrer('brouillon')} disabled={sauvegardeEnCours}>
            📝 Enregistrer comme brouillon
          </Button>
          <Button variant="plain" tone="critical" onClick={() => naviguerRetour()} disabled={sauvegardeEnCours}>
            Annuler
          </Button>
        </div>

      </Page>
      )} {/* fin spinner conditionnel */}
    </div>
  );
}

export default CreerAnnonce;
