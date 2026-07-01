// InscriptionVendeur.tsx
import {
  Page,
  BlockStack,
  TextField,
  Select,
  Button,
  Checkbox,
  Modal,
  Banner,
  Frame,
  Toast,
} from '@shopify/polaris';
import React, { useState, useCallback, useEffect, useRef } from 'react';

// Composant d'autocomplétion d'adresse avec HERE API
const AdresseAutocomplete = ({ 
  onAddressSelect 
}: { 
  onAddressSelect: (data: any) => void 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const HERE_API_KEY = 'K3Hf5kk3yyKiMLty8ptK9YKiKla9t_mUj_JVObLwXtk';

  const rechercherAdresses = useCallback(async (searchText: string) => {
    if (searchText.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://autocomplete.search.hereapi.com/v1/autocomplete?` +
        `q=${encodeURIComponent(searchText)}&` +
        `apiKey=${HERE_API_KEY}&` +
        `limit=5&` +
        `in=countryCode:CAN`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data.items || []);
    } catch (error) {
      console.error('Erreur de recherche HERE:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [HERE_API_KEY]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length >= 3) {
      timeoutRef.current = setTimeout(() => {
        rechercherAdresses(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, rechercherAdresses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAddressDetails = async (addressId: string) => {
    try {
      const response = await fetch(
        `https://lookup.search.hereapi.com/v1/lookup?id=${addressId}&apiKey=${HERE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur API lookup: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      return null;
    }
  };

  const extraireNumeroEtRue = (address: any): { numero: string; rue: string } => {
    let numero = '';
    let rue = '';
    
    if (address.houseNumber) {
      numero = address.houseNumber;
      rue = address.street || address.road || '';
      return { numero, rue };
    }
    
    if (address.street) {
      const streetText = address.street;
      const match = streetText.match(/^(\d+[a-z]?)[\s-]+(.+)$/i);
      if (match) {
        numero = match[1];
        rue = match[2];
        return { numero, rue };
      }
      rue = streetText;
      return { numero: '', rue };
    }
    
    return { numero: '', rue: '' };
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    
    if (suggestion.id) {
      const details = await getAddressDetails(suggestion.id);
      
      if (details) {
        const address = details.address || {};
        const { numero, rue } = extraireNumeroEtRue(address);
        
        onAddressSelect({
          adresseComplete: details.title || suggestion.title,
          numero: numero,
          rue: rue,
          ville: address.city || '',
          province: address.state || address.stateCode || address.county || '',
          codePostal: address.postalCode || '',
          pays: address.countryCode || 'CAN',
          latitude: details.position?.lat,
          longitude: details.position?.lng
        });
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Commencez à taper votre adresse"
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '14px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#666'
        }}>
          ⏳
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                fontSize: '13px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {suggestion.title}
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && query.length >= 3 && suggestions.length === 0 && !isLoading && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '10px 12px',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          color: '#666',
          fontSize: '13px'
        }}>
          Aucune adresse trouvée
        </div>
      )}
    </div>
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
        />
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

function InscriptionVendeur() {
  // États pour le compte
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
  const [nomVendeur, setNomVendeur] = useState('');
  const [nomBoutique, setNomBoutique] = useState('');
  
  // États pour l'adresse
  const [numCivique, setNumCivique] = useState('');
  const [rue, setRue] = useState('');
  const [ville, setVille] = useState('');
  const [province, setProvince] = useState('quebec');
  const [pays, setPays] = useState('canada');
  const [codePostal, setCodePostal] = useState('');
  const [telephone, setTelephone] = useState('');
  
  // États pour la description et politiques
  const [descriptionDetaillee, setDescriptionDetaillee] = useState('');
  const [politiqueRetours, setPolitiqueRetours] = useState('');
  const [politiqueLivraison, setPolitiqueLivraison] = useState('');
  
  // États pour les informations supplémentaires
  const [regionAdmin, setRegionAdmin] = useState('');
  const [zonesExpedition, setZonesExpedition] = useState('');
  const [typeEntreprise, setTypeEntreprise] = useState('');
  const [termesAcceptes, setTermesAcceptes] = useState(false);
  const [joursRemboursement, setJoursRemboursement] = useState('1');
  
  // États pour les images
  const [banniereImage, setBanniereImage] = useState<string | null>(null);
  const [banniereUrl, setBanniereUrl] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [banniereNom, setBanniereNom] = useState<string>('');
  const [logoNom, setLogoNom] = useState<string>('');
  
  // États pour l'upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{banner: boolean; logo: boolean}>({
    banner: false,
    logo: false
  });
  
  // États pour les modales
  const [modalActive, setModalActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [champsManquants, setChampsManquants] = useState<string[]>([]);
  
  // États pour l'entreprise enregistrée
  const [estEntrepriseEnregistree, setEstEntrepriseEnregistree] = useState(false);
  const [provinceEntreprise, setProvinceEntreprise] = useState('qc');
  const [numEntrepriseProvincial, setNumEntrepriseProvincial] = useState('');
  const [noTPS, setNoTPS] = useState('');
  const [noTaxeProvinciale, setNoTaxeProvinciale] = useState('');
  
  // États pour le chargement
  const [saving, setSaving] = useState(false);
  const [vendeurId, setVendeurId] = useState<number | null>(null);
  
  // États pour le plan (statique pour l'inscription)
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [abonnementInfo, setAbonnementInfo] = useState<any>(null);
  const [paiementsHisto, setPaiementsHisto] = useState<any[]>([]);
  const [showForfaitPopup, setShowForfaitPopup] = useState(false);

  // Mapping des provinces avec leurs codes
  const provinces = [
    { label: 'Québec', value: 'qc' },
    { label: 'Ontario', value: 'on' },
    { label: 'Colombie-Britannique', value: 'bc' },
    { label: 'Alberta', value: 'ab' },
    { label: 'Saskatchewan', value: 'sk' },
    { label: 'Manitoba', value: 'mb' },
    { label: 'Nouveau-Brunswick', value: 'nb' },
    { label: 'Nouvelle-Écosse', value: 'ns' },
    { label: 'Île-du-Prince-Édouard', value: 'pe' },
    { label: 'Terre-Neuve-et-Labrador', value: 'nl' },
    { label: 'Yukon', value: 'yt' },
    { label: 'Territoires du Nord-Ouest', value: 'nt' },
    { label: 'Nunavut', value: 'nu' },
  ];

  // Charger les plans disponibles au montage
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('https://evend-multivendeur-api.onrender.com/api/plans');
        const plans = await response.json();
        // Sélectionner le plan gratuit par défaut
        const planGratuit = plans.find((p: any) => parseFloat(p.prix_ht) === 0);
        if (planGratuit) {
          setPlanInfo(planGratuit);
        } else if (plans.length > 0) {
          setPlanInfo(plans[0]);
        }
      } catch (error) {
        console.error('Erreur chargement plans:', error);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (toastActive) {
      const timer = setTimeout(() => {
        setToastActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastActive]);

  // Fonctions pour les labels
  const getLabelEntrepriseProvincial = () => {
    switch(provinceEntreprise) {
      case 'qc': return 'Numéro d\'entreprise du Québec (NEQ)';
      case 'on': return 'Numéro d\'enregistrement de l\'Ontario (Master Business License)';
      case 'bc': return 'BC Business Number';
      case 'ab': return 'Alberta Corporate Access Number';
      case 'sk': return 'Saskatchewan Business Number';
      case 'mb': return 'Manitoba Business Number';
      case 'nb': return 'New Brunswick Business Number';
      case 'ns': return 'Nova Scotia Business Number';
      case 'pe': return 'PEI Business Number';
      case 'nl': return 'Newfoundland Business Number';
      case 'yt': return 'Yukon Business Number';
      case 'nt': return 'NWT Business Number';
      case 'nu': return 'Nunavut Business Number';
      default: return 'Numéro d\'entreprise provincial';
    }
  };

  const getPlaceholderEntreprise = () => {
    switch(provinceEntreprise) {
      case 'qc': return 'Ex: 1234567890';
      case 'on': return 'Ex: 123456789';
      case 'bc': return 'Ex: A1234567';
      default: return 'Ex: 123456789';
    }
  };

  const aTaxeProvincialeDistincte = () => {
    return ['qc', 'bc', 'sk', 'mb'].includes(provinceEntreprise);
  };

  const getLabelTaxeProvinciale = () => {
    switch(provinceEntreprise) {
      case 'qc': return 'Numéro de TVQ';
      case 'bc': return 'Numéro de TVP (PST)';
      case 'sk': return 'Numéro de TVP (PST)';
      case 'mb': return 'Numéro de TVD (RST)';
      default: return 'Numéro de taxe provinciale';
    }
  };

  const getPlaceholderTaxeProvinciale = () => {
    switch(provinceEntreprise) {
      case 'qc': return 'Ex: 1234567890 TQ0001';
      case 'bc': return 'Ex: PST-12345';
      case 'sk': return 'Ex: 123456';
      case 'mb': return 'Ex: 123456-7';
      default: return 'Ex: 123456';
    }
  };

  const getTauxTaxe = () => {
    switch(provinceEntreprise) {
      case 'qc': return '9.975% (TVQ) + 5% (TPS) = 14.975%';
      case 'on': return '13% (TVH)';
      case 'bc': return '7% (TVP) + 5% (TPS) = 12%';
      case 'ab': return '5% (TPS seulement)';
      case 'sk': return '6% (TVP) + 5% (TPS) = 11%';
      case 'mb': return '7% (TVD) + 5% (TPS) = 12%';
      case 'nb': case 'ns': case 'pe': case 'nl': return '15% (TVH)';
      case 'yt': case 'nt': case 'nu': return '5% (TPS seulement)';
      default: return '';
    }
  };

  const estProvinceHarmonisee = () => {
    return ['on', 'nb', 'ns', 'pe', 'nl'].includes(provinceEntreprise);
  };

  const estSansTaxeProvinciale = () => {
    return ['ab', 'yt', 'nt', 'nu'].includes(provinceEntreprise);
  };

  // Fonction d'upload vers S3
  const uploadToS3 = async (file: File, type: 'banner' | 'logo'): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [type]: true }));
    
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('vendeur_id', vendeurId?.toString() || '');
      
      const uploadRes = await fetch('https://evend-multivendeur-api.onrender.com/api/upload', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const uploadData = await uploadRes.json();
      
      setToastMessage(`✅ Image ${type === 'banner' ? 'de bannière' : 'de logo'} téléchargée avec succès`);
      setToastActive(true);
      
      return uploadData.url;
    } catch (error: any) {
      console.error('Erreur upload:', error);
      setToastMessage(`❌ Erreur: ${error.message}`);
      setToastActive(true);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(prev => ({ ...prev, [type]: false }));
    }
  };

  // Fonction de téléchargement de bannière
  const handleTelechargerBanniere = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setBanniereNom(file.name);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setBanniereImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        const fileUrl = await uploadToS3(file, 'banner');
        if (fileUrl) {
          setBanniereUrl(fileUrl);
        }
      }
    };
    input.click();
  }, [vendeurId]);

  const handleSupprimerBanniere = useCallback(() => {
    setBanniereImage(null);
    setBanniereUrl(null);
    setBanniereNom('');
  }, []);

  const handleTelechargerLogo = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLogoNom(file.name);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setLogoImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        const fileUrl = await uploadToS3(file, 'logo');
        if (fileUrl) {
          setLogoUrl(fileUrl);
        }
      }
    };
    input.click();
  }, [vendeurId]);

  const handleSupprimerLogo = useCallback(() => {
    setLogoImage(null);
    setLogoUrl(null);
    setLogoNom('');
  }, []);

  const sectionStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e1e3e5',
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#537373',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const sectionSubtitleStyle = {
    fontSize: '13px',
    color: '#999',
    marginBottom: '16px',
  };

  // Fonction de validation des champs obligatoires
  const validerChampsObligatoires = () => {
    const manquants: string[] = [];

    if (!email.trim()) manquants.push('E-mail');
    if (!motDePasse.trim()) manquants.push('Mot de passe');
    else if (motDePasse.length < 8) manquants.push('Le mot de passe doit contenir au moins 8 caractères');
    if (!confirmerMotDePasse.trim()) manquants.push('Confirmation du mot de passe');
    else if (motDePasse !== confirmerMotDePasse) manquants.push('Les mots de passe ne correspondent pas');
    if (!nomVendeur.trim()) manquants.push('Nom du vendeur');
    if (!nomBoutique.trim()) manquants.push('Nom de la boutique du vendeur');
    if (!descriptionDetaillee.trim()) manquants.push('Description détaillée de votre boutique');
    if (!politiqueRetours.trim()) manquants.push('Politique de retours');
    if (!politiqueLivraison.trim()) manquants.push('Politique de livraison');
    if (!regionAdmin) manquants.push('Région administrative');
    if (!zonesExpedition) manquants.push('Zones où la boutique expédie');
    if (!typeEntreprise) manquants.push("Type d'entreprise");
    if (!termesAcceptes) manquants.push('Accepter les termes et conditions');
    
    if (estEntrepriseEnregistree) {
      if (!numEntrepriseProvincial.trim()) {
        manquants.push(getLabelEntrepriseProvincial());
      }
      if (!noTPS.trim()) {
        manquants.push('Numéro de TPS/TVH');
      }
      if (aTaxeProvincialeDistincte() && !noTaxeProvinciale.trim()) {
        manquants.push(getLabelTaxeProvinciale());
      }
    }

    return manquants;
  };

  // Gestionnaire pour créer un nouveau vendeur
  const handleCreerVendeur = useCallback(async () => {
    const manquants = validerChampsObligatoires();
    if (manquants.length > 0) {
      setChampsManquants(manquants);
      setValidationModalOpen(true);
      return;
    }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://evend-multivendeur-api.onrender.com/api/vendeurs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          email,
          mot_de_passe: motDePasse,
          nom: nomVendeur, 
          nom_boutique: nomBoutique, 
          telephone,
          province: regionAdmin, 
          region_admin: regionAdmin,
          zone_expedition: zonesExpedition, 
          type_entreprise: typeEntreprise,
          num_civique: numCivique, 
          rue, 
          ville, 
          code_postal: codePostal, 
          pays,
          description: descriptionDetaillee,
          description_longue: descriptionDetaillee,
          politique_retours: politiqueRetours,
          politique_livraison: politiqueLivraison,
          jours_remboursement: parseInt(joursRemboursement) || 1,
          est_entreprise_enregistree: estEntrepriseEnregistree,
          province_entreprise: provinceEntreprise,
          num_entreprise_provincial: numEntrepriseProvincial,
          no_tps: noTPS, 
          no_taxe_provinciale: noTaxeProvinciale,
          banniere_url: banniereUrl,
          logo_url: logoUrl,
          plan_id: planInfo?.id || null
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      
      setToastMessage('✅ Vendeur créé avec succès');
      setToastActive(true);
      
      // Rediriger vers la page de connexion après création
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
    } catch (err: any) {
      setToastMessage('❌ ' + (err.message || 'Erreur lors de la création'));
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  }, [email, motDePasse, confirmerMotDePasse, nomVendeur, nomBoutique, telephone, regionAdmin, 
      zonesExpedition, typeEntreprise, numCivique, rue, ville, codePostal, pays, descriptionDetaillee, 
      politiqueRetours, politiqueLivraison, joursRemboursement, estEntrepriseEnregistree, 
      provinceEntreprise, numEntrepriseProvincial, noTPS, noTaxeProvinciale, termesAcceptes,
      banniereUrl, logoUrl, planInfo]);

  const handleVoirMonForfait = useCallback(() => {
    setShowForfaitPopup(true);
  }, [planInfo]);

  const toggleToast = useCallback(() => setToastActive((active) => !active), []);

  const openTermsOfService = useCallback(() => {
    window.open('https://e-vend.ca/policies/terms-of-service', '_blank');
  }, []);

  const toastMarkup = toastActive ? (
    <div style={{
      position: 'fixed',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      backgroundColor: toastMessage.startsWith('❌') ? '#dc2626' : '#16a34a',
      color: 'white',
      padding: '14px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '700',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: '280px',
      maxWidth: '480px',
    }}>
      <span style={{ flex: 1 }}>{toastMessage}</span>
      <button onClick={toggleToast} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
    </div>
  ) : null;

  return (
    <>
    <Frame>
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
        <Page
          title="Inscription vendeur"
          subtitle="Créez votre compte vendeur"
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* Colonne gauche 60% */}
            <div style={{ flex: '0 0 60%' }}>
              <BlockStack gap="400">

                {/* Détails de votre compte */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>👤 Détails de votre compte</p>
                  <BlockStack gap="400">
                    <TextField
                      label={
                        <span>
                          E-mail <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      value={email}
                      onChange={setEmail}
                      autoComplete="off"
                      type="email"
                      placeholder="Entrez votre adresse e-mail"
                    />
                    
                    <TextField
                      label={
                        <span>
                          Mot de passe <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      value={motDePasse}
                      onChange={setMotDePasse}
                      type="password"
                      autoComplete="new-password"
                      helpText="Le mot de passe doit contenir au moins 8 caractères"
                    />
                    
                    <TextField
                      label={
                        <span>
                          Confirmer le mot de passe <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      value={confirmerMotDePasse}
                      onChange={setConfirmerMotDePasse}
                      type="password"
                      autoComplete="new-password"
                    />
                    
                    <TextField
                      label={
                        <span>
                          Nom du vendeur <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      value={nomVendeur}
                      onChange={setNomVendeur}
                      autoComplete="off"
                    />
                    
                    <TextField
                      label={
                        <span>
                          Nom de la boutique du vendeur <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      value={nomBoutique}
                      onChange={setNomBoutique}
                      autoComplete="off"
                    />
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Adresse complète</span>
                        <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                          (Commencez à taper pour voir les suggestions)
                        </span>
                      </div>
                      <AdresseAutocomplete 
                        onAddressSelect={(data) => {
                          if (data.numero) setNumCivique(data.numero);
                          if (data.rue) setRue(data.rue);
                          if (data.ville) setVille(data.ville);
                          if (data.codePostal) setCodePostal(data.codePostal);
                          
                          if (data.province) {
                            const provinceMap: { [key: string]: string } = {
                              'quebec': 'quebec',
                              'québec': 'quebec',
                              'qc': 'quebec',
                              'ontario': 'ontario',
                              'on': 'ontario',
                              'british columbia': 'cb',
                              'bc': 'cb',
                              'alberta': 'alberta',
                              'ab': 'alberta',
                              'manitoba': 'manitoba',
                              'mb': 'manitoba',
                              'saskatchewan': 'saskatchewan',
                              'sk': 'saskatchewan',
                              'nova scotia': 'nouvelle-ecosse',
                              'ns': 'nouvelle-ecosse',
                              'new brunswick': 'nouveau-brunswick',
                              'nb': 'nouveau-brunswick',
                              'newfoundland': 'terre-neuve',
                              'nl': 'terre-neuve',
                              'prince edward island': 'ipe',
                              'pe': 'ipe',
                              'yukon': 'yukon',
                              'yt': 'yukon',
                              'northwest territories': 'nwt',
                              'nt': 'nwt',
                              'nunavut': 'nunavut',
                              'nu': 'nunavut'
                            };
                            const provinceLower = data.province.toLowerCase();
                            setProvince(provinceMap[provinceLower] || provinceLower);
                            
                            const entrepriseMap: { [key: string]: string } = {
                              'quebec': 'qc',
                              'ontario': 'on',
                              'cb': 'bc',
                              'alberta': 'ab',
                              'manitoba': 'mb',
                              'saskatchewan': 'sk',
                              'nouvelle-ecosse': 'ns',
                              'nouveau-brunswick': 'nb',
                              'terre-neuve': 'nl',
                              'ipe': 'pe',
                              'yukon': 'yt',
                              'nwt': 'nt',
                              'nunavut': 'nu'
                            };
                            setProvinceEntreprise(entrepriseMap[provinceMap[provinceLower] || provinceLower] || 'qc');
                          }
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '8px' }}>
                      <TextField
                        label="Numéro civique"
                        value={numCivique}
                        onChange={setNumCivique}
                        placeholder="1234"
                        autoComplete="off"
                      />
                      <TextField
                        label="Rue"
                        value={rue}
                        onChange={setRue}
                        placeholder="rue Saint-Denis"
                        autoComplete="off"
                      />
                    </div>
                    
                    <TextField
                      label="Ville"
                      value={ville}
                      onChange={setVille}
                      autoComplete="off"
                      placeholder="Montréal"
                    />
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <Select
                          label="Province"
                          options={[
                            { label: 'Québec', value: 'quebec' },
                            { label: 'Ontario', value: 'ontario' },
                            { label: 'Colombie-Britannique', value: 'cb' },
                            { label: 'Alberta', value: 'alberta' },
                            { label: 'Manitoba', value: 'manitoba' },
                            { label: 'Saskatchewan', value: 'saskatchewan' },
                            { label: 'Nouvelle-Écosse', value: 'nouvelle-ecosse' },
                            { label: 'Nouveau-Brunswick', value: 'nouveau-brunswick' },
                            { label: 'Terre-Neuve', value: 'terre-neuve' },
                            { label: 'Île-du-Prince-Édouard', value: 'ipe' },
                            { label: 'Yukon', value: 'yukon' },
                            { label: 'Territoires du Nord-Ouest', value: 'nwt' },
                            { label: 'Nunavut', value: 'nunavut' },
                          ]}
                          value={province}
                          onChange={setProvince}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Select
                          label="Pays"
                          options={[
                            { label: 'Canada', value: 'canada' },
                          ]}
                          value={pays}
                          onChange={setPays}
                        />
                      </div>
                    </div>
                    
                    <TextField
                      label="Code postal"
                      value={codePostal}
                      onChange={setCodePostal}
                      autoComplete="off"
                      placeholder="H2X 3K4"
                    />
                    
                    <TextField
                      label="Téléphone"
                      value={telephone}
                      onChange={setTelephone}
                      autoComplete="off"
                      placeholder="514-555-1234"
                      prefix="+1"
                    />
                  </BlockStack>
                </div>

                {/* Section Informations d'entreprise */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>🏢 Informations d'entreprise</p>
                  <p style={sectionSubtitleStyle}>Renseignez vos informations fiscales selon votre province.</p>

                  <div style={{ marginBottom: estEntrepriseEnregistree ? '16px' : '0' }}>
                    <Checkbox
                      label="Je suis une entreprise enregistrée"
                      checked={estEntrepriseEnregistree}
                      onChange={setEstEntrepriseEnregistree}
                    />
                  </div>

                  {estEntrepriseEnregistree && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      backgroundColor: '#f0f5f5',
                      borderRadius: '8px',
                      border: '1px solid #d0e0e0',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                        Numéros d'enregistrement et taxes
                      </p>
                      
                      <BlockStack gap="400">
                        <Select
                          label="Province de l'entreprise *"
                          options={provinces}
                          value={provinceEntreprise}
                          onChange={setProvinceEntreprise}
                        />

                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#e3f2fd', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#0d47a1',
                          border: '1px solid #bbdefb'
                        }}>
                          <span>ℹ️ {getTauxTaxe()}</span>
                        </div>

                        <TextField
                          label={
                            <span>
                              {getLabelEntrepriseProvincial()} <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                            </span>
                          }
                          value={numEntrepriseProvincial}
                          onChange={setNumEntrepriseProvincial}
                          autoComplete="off"
                          placeholder={getPlaceholderEntreprise()}
                          helpText="Numéro d'immatriculation de votre entreprise"
                        />

                        <TextField
                          label={
                            <span>
                              Numéro de TPS/TVH <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                            </span>
                          }
                          value={noTPS}
                          onChange={setNoTPS}
                          autoComplete="off"
                          placeholder="Ex: 123456789 RT0001"
                          helpText="Taxe fédérale (obligatoire pour toutes les entreprises)"
                        />

                        {aTaxeProvincialeDistincte() && (
                          <TextField
                            label={
                              <span>
                                {getLabelTaxeProvinciale()} <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                              </span>
                            }
                            value={noTaxeProvinciale}
                            onChange={setNoTaxeProvinciale}
                            autoComplete="off"
                            placeholder={getPlaceholderTaxeProvinciale()}
                            helpText="Taxe de vente provinciale"
                          />
                        )}

                        {estProvinceHarmonisee() && (
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#e6f7e6', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#2e7d32',
                            border: '1px solid #a5d6a7'
                          }}>
                            <span>ℹ️ Province à TVH - La taxe provinciale est incluse dans votre numéro de TPS/TVH</span>
                          </div>
                        )}

                        {estSansTaxeProvinciale() && (
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#e6f7e6', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#2e7d32',
                            border: '1px solid #a5d6a7'
                          }}>
                            <span>ℹ️ Aucune taxe de vente provinciale - Seule la TPS fédérale de 5% s'applique</span>
                          </div>
                        )}
                      </BlockStack>
                    </div>
                  )}
                </div>

                {/* Description & Politiques de votre boutique */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>📝 Description & Politiques de votre boutique</p>
                  <BlockStack gap="400">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                          Description détaillée de votre boutique <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      </div>
                      <RichTextEditor
                        value={descriptionDetaillee}
                        onChange={setDescriptionDetaillee}
                        placeholder="Entrez une description détaillée de votre boutique..."
                      />
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                          Politique de retours <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      </div>
                      <RichTextEditor
                        value={politiqueRetours}
                        onChange={setPolitiqueRetours}
                        placeholder="Entrez votre politique de retours..."
                      />
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                          Politique de livraison <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      </div>
                      <RichTextEditor
                        value={politiqueLivraison}
                        onChange={setPolitiqueLivraison}
                        placeholder="Entrez votre politique de livraison..."
                      />
                    </div>
                  </BlockStack>
                </div>

                {/* Informations supplémentaires */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>📋 Informations supplémentaires</p>
                  <p style={sectionSubtitleStyle}>Informations supplémentaires sur le vendeur.</p>
                  <BlockStack gap="400">
                    <Select
                      label={
                        <span>
                          Région administrative <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      options={[
                        { label: 'Veuillez sélectionner une option', value: '' },
                        { label: 'Abitibi-Témiscamingue (QC)', value: 'Abitibi-Témiscamingue (QC)' },
                        { label: 'Bas-Saint-Laurent (QC)', value: 'Bas-Saint-Laurent (QC)' },
                        { label: 'Capitale-Nationale (QC)', value: 'Capitale-Nationale (QC)' },
                        { label: 'Centre-du-Québec (QC)', value: 'Centre-du-Québec (QC)' },
                        { label: 'Chaudière-Appalaches (QC)', value: 'Chaudière-Appalaches (QC)' },
                        { label: 'Côte-Nord (QC)', value: 'Côte-Nord (QC)' },
                        { label: 'Estrie (QC)', value: 'Estrie (QC)' },
                        { label: 'Gaspésie–Îles-de-la-Madeleine (QC)', value: 'Gaspésie–Îles-de-la-Madeleine (QC)' },
                        { label: 'Lanaudière (QC)', value: 'Lanaudière (QC)' },
                        { label: 'Laurentides (QC)', value: 'Laurentides (QC)' },
                        { label: 'Laval (QC)', value: 'Laval (QC)' },
                        { label: 'Mauricie (QC)', value: 'Mauricie (QC)' },
                        { label: 'Montérégie (QC)', value: 'Montérégie (QC)' },
                        { label: 'Montréal (QC)', value: 'Montréal (QC)' },
                        { label: 'Nord-du-Québec (QC)', value: 'Nord-du-Québec (QC)' },
                        { label: 'Outaouais (QC)', value: 'Outaouais (QC)' },
                        { label: 'Saguenay–Lac-Saint-Jean (QC)', value: 'Saguenay–Lac-Saint-Jean (QC)' },
                        { label: 'Albert (N.-B.)', value: 'Albert (N.-B.)' },
                        { label: 'Carleton (N.-B.)', value: 'Carleton (N.-B.)' },
                        { label: 'Charlotte (N.-B.)', value: 'Charlotte (N.-B.)' },
                        { label: 'Gloucester (N.-B.)', value: 'Gloucester (N.-B.)' },
                        { label: 'Kent (N.-B.)', value: 'Kent (N.-B.)' },
                        { label: 'Kings (N.-B.)', value: 'Kings (N.-B.)' },
                        { label: 'Madawaska (N.-B.)', value: 'Madawaska (N.-B.)' },
                        { label: 'Northumberland (N.-B.)', value: 'Northumberland (N.-B.)' },
                        { label: 'Queens (N.-B.)', value: 'Queens (N.-B.)' },
                        { label: 'Restigouche (N.-B.)', value: 'Restigouche (N.-B.)' },
                        { label: 'Saint John (N.-B.)', value: 'Saint John (N.-B.)' },
                        { label: 'Sunbury (N.-B.)', value: 'Sunbury (N.-B.)' },
                        { label: 'Victoria (N.-B.)', value: 'Victoria (N.-B.)' },
                        { label: 'Westmorland (N.-B.)', value: 'Westmorland (N.-B.)' },
                        { label: 'York (N.-B.)', value: 'York (N.-B.)' },
                        { label: 'Cap-Breton (N.É.)', value: 'cap-breton-ns' },
                        { label: 'Centre de la Nouvelle-Écosse (N.É.)', value: 'centre-ns' },
                        { label: 'Nord de la Nouvelle-Écosse (N.É.)', value: 'nord-ns' },
                        { label: 'Région d\'Halifax (N.É.)', value: 'halifax-ns' },
                        { label: 'Sud de la Nouvelle-Écosse (N.É.)', value: 'sud-ns' },
                        { label: 'Vallée d\'Annapolis (N.É.)', value: 'annapolis-ns' },
                        { label: 'Centre de l\'Île-du-Prince-Édouard (Î.-P.-É.)', value: 'centre-pei' },
                        { label: 'Est de l\'Île-du-Prince-Édouard (Î.-P.-É.)', value: 'est-pei' },
                        { label: 'Ouest de l\'Île-du-Prince-Édouard (Î.-P.-É.)', value: 'ouest-pei' },
                        { label: 'Région de Charlottetown (Î.-P.-É.)', value: 'charlottetown-pei' },
                        { label: 'Centre de Terre-Neuve (T.-N.-L.)', value: 'centre-nl' },
                        { label: 'Côte Ouest de Terre-Neuve (T.-N.-L.)', value: 'ouest-nl' },
                        { label: 'Est de Terre-Neuve (T.-N.-L.)', value: 'est-nl' },
                        { label: 'Labrador (T.-N.-L.)', value: 'labrador-nl' },
                        { label: 'Péninsule d\'Avalon (T.-N.-L.)', value: 'avalon-nl' },
                        { label: 'Centre de l\'Ontario (ON)', value: 'centre-on' },
                        { label: 'Est de l\'Ontario (ON)', value: 'est-on' },
                        { label: 'Nord de l\'Ontario (ON)', value: 'nord-on' },
                        { label: 'Région du Golden Horseshoe (ON)', value: 'golden-horseshoe-on' },
                        { label: 'Région du Grand Toronto (GTA) (ON)', value: 'gta-on' },
                        { label: 'Région de Winnipeg (MB)', value: 'winnipeg-mb' },
                        { label: 'Centre de la Saskatchewan (SK)', value: 'centre-sk' },
                        { label: 'Nord de la Saskatchewan (SK)', value: 'nord-sk' },
                        { label: 'Sud de la Saskatchewan (SK)', value: 'sud-sk' },
                        { label: 'Région de Regina (SK)', value: 'regina-sk' },
                        { label: 'Région de Saskatoon (SK)', value: 'saskatoon-sk' },
                        { label: 'Centre de l\'Alberta (AB)', value: 'centre-ab' },
                        { label: 'Nord de l\'Alberta (AB)', value: 'nord-ab' },
                        { label: 'Sud de l\'Alberta (AB)', value: 'sud-ab' },
                        { label: 'Région de Calgary (AB)', value: 'calgary-ab' },
                        { label: 'Région d\'Edmonton (AB)', value: 'edmonton-ab' },
                        { label: 'Côte Nord de la C.-B. (C.-B.)', value: 'cote-nord-bc' },
                        { label: 'Centre de la C.-B. (C.-B.)', value: 'centre-bc' },
                        { label: 'Sud de la C.-B. (C.-B.)', value: 'sud-bc' },
                        { label: 'Région de Vancouver (C.-B.)', value: 'vancouver-bc' },
                        { label: 'Vallée de l\'Okanagan (C.-B.)', value: 'okanagan-bc' },
                        { label: 'Yukon (YT)', value: 'yukon' },
                        { label: 'Territoires du Nord-Ouest (T.N.-O.)', value: 'nwt' },
                        { label: 'Nunavut (NU)', value: 'nunavut' },
                        { label: 'Ah... ma région administrative? C\'est un secret bien gardé!', value: 'secret' },
                      ]}
                      value={regionAdmin}
                      onChange={setRegionAdmin}
                    />

                    <Select
                      label={
                        <span>
                          Zones où la boutique expédie <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      options={[
                        { label: 'Veuillez sélectionner une option', value: '' },
                        { label: 'Canada entier', value: 'Canada entier' },
                        { label: 'Québec seulement', value: 'Québec seulement' },
                        { label: 'Ontario seulement', value: 'Ontario seulement' },
                        { label: 'Nouveau-Brunswick seulement', value: 'Nouveau-Brunswick seulement' },
                        { label: 'Provinces maritimes seulement (NB/NS/IPE)', value: 'Provinces maritimes seulement (NB/ NS/ Î-P-É)' },
                        { label: 'Québec et Ontario', value: 'Québec et Ontario' },
                        { label: 'Est du Canada (QC/NB/NS/IPE/TNL)', value: 'Est du Canada (QC/ NB/ NS/ Î-P-É/ T.-N.-L.)' },
                        { label: 'Ouest du Canada (MB/SK/AB/CB)', value: 'Ouest du Canada (MB/ SK/ AB/ CB)' },
                        { label: 'Canada sans régions éloignées', value: 'Canada sans régions éloignées' },
                        { label: 'Régions sélectionnées seulement (voir description)', value: 'Régions sélectionnées seulement (voir description)' },
                        { label: 'Aucun/ ramassage sur place seulement', value: 'Aucun/ ramassage sur place seulement' },
                      ]}
                      value={zonesExpedition}
                      onChange={setZonesExpedition}
                    />

                    <Select
                      label={
                        <span>
                          Type d'entreprise <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        </span>
                      }
                      options={[
                        { label: 'Veuillez sélectionner une option', value: '' },
                        { label: 'Particulier (Personne physique / non enregistrée)', value: 'Particulier (Personne physique / non enregistrée)' },
                        { label: 'Entreprise (Enregistrée au registre des entreprises)', value: 'Entreprise (Enregistrée au registre des entreprises)' },
                        { label: 'Organisme à but non lucratif', value: 'Organisme à but non lucratif' },
                      ]}
                      value={typeEntreprise}
                      onChange={setTypeEntreprise}
                    />
                  </BlockStack>
                </div>

                {/* Image de bannière de votre boutique avec upload S3 */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>🖼️ Image de bannière de votre boutique</p>
                  <p style={sectionSubtitleStyle}>Ici, vous pouvez télécharger la bannière du magasin que vous souhaitez ajouter.</p>
                  <div style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: banniereImage ? '0' : '40px',
                    textAlign: 'center',
                    marginBottom: '12px',
                    backgroundColor: '#fafafa',
                    minHeight: banniereImage ? 'auto' : '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {uploadProgress.banner && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '3px solid #e1e3e5',
                          borderTop: '3px solid #008060',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span style={{ fontSize: '12px', color: '#008060', fontWeight: '600' }}>Upload en cours...</span>
                      </div>
                    )}
                    {banniereImage ? (
                      <img 
                        src={banniereImage} 
                        alt="Bannière" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }} 
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: '40px' }}>🖼️</span>
                        <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Aucune bannière choisie</p>
                      </>
                    )}
                  </div>
                  {banniereNom && (
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      Fichier: {banniereNom}
                    </p>
                  )}
                  {banniereUrl && (
                    <p style={{ fontSize: '12px', color: '#008060', marginBottom: '8px' }}>
                      ✅ Image stockée sur S3
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button onClick={handleTelechargerBanniere} disabled={uploadProgress.banner}>
                      {uploadProgress.banner ? '⏳ Upload en cours...' : '📁 Télécharger la bannière'}
                    </Button>
                    {banniereImage && (
                      <Button tone="critical" variant="plain" onClick={handleSupprimerBanniere} disabled={uploadProgress.banner}>
                        Supprimer la bannière
                      </Button>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    Note : Dimension recommandée 900x225 px.
                  </p>
                </div>

              </BlockStack>
            </div>

            {/* Colonne droite 40% */}
            <div style={{ flex: '0 0 38%' }}>
              <BlockStack gap="400">

                {/* Logo de la boutique avec upload S3 */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>🏪 Logo de la boutique du vendeur</p>
                  <p style={sectionSubtitleStyle}>Ici, vous pouvez télécharger le logo de la boutique du vendeur.</p>
                  <div style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: logoImage ? '0' : '30px',
                    textAlign: 'center',
                    marginBottom: '12px',
                    backgroundColor: '#fafafa',
                    minHeight: logoImage ? 'auto' : '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {uploadProgress.logo && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '3px solid #e1e3e5',
                          borderTop: '3px solid #008060',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span style={{ fontSize: '12px', color: '#008060', fontWeight: '600' }}>Upload en cours...</span>
                      </div>
                    )}
                    {logoImage ? (
                      <img 
                        src={logoImage} 
                        alt="Logo" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '150px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }} 
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: '40px' }}>🏪</span>
                        <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Aucun fichier choisi</p>
                      </>
                    )}
                  </div>
                  {logoNom && (
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      Fichier: {logoNom}
                    </p>
                  )}
                  {logoUrl && (
                    <p style={{ fontSize: '12px', color: '#008060', marginBottom: '8px' }}>
                      ✅ Image stockée sur S3
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button onClick={handleTelechargerLogo} disabled={uploadProgress.logo}>
                      {uploadProgress.logo ? '⏳ Upload en cours...' : '📁 Télécharger une image'}
                    </Button>
                    {logoImage && (
                      <Button tone="critical" variant="plain" onClick={handleSupprimerLogo} disabled={uploadProgress.logo}>
                        Supprimer le logo
                      </Button>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    Note : Dimension recommandée 185x185 px.
                  </p>
                </div>

                {/* Détails de l'adhésion */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>📋 Détails de l'adhésion</p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Nom du forfait</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{planInfo?.nom || 'Gratuit'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Prix mensuel TTC</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: parseFloat(planInfo?.prix_ht||'0') === 0 ? '#008060' : '#333' }}>
                        {planInfo
                          ? (parseFloat(planInfo.prix_ht||'0') === 0 ? 'Gratuit (0,00 $/mois)'
                            : `${(parseFloat(planInfo.prix_ht||0)+parseFloat(planInfo.tps||0)+parseFloat(planInfo.tvq||0)+parseFloat(planInfo.tvh||0)).toFixed(2)} $/mois`)
                          : 'Gratuit (0,00 $/mois)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Détails complets du forfait</span>
                      <Button size="slim" onClick={handleVoirMonForfait}>Voir</Button>
                    </div>
                  </div>
                </div>

                {/* Gérer le montant encaissable */}
                <div style={sectionStyle}>
                  <p style={sectionTitleStyle}>💰 Gérer le montant encaissable</p>
                  <p style={sectionSubtitleStyle}>Entrer les jours de remboursement</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        value={joursRemboursement}
                        onChange={setJoursRemboursement}
                        autoComplete="off"
                        type="number"
                      />
                    </div>
                    <span style={{ fontSize: '13px', color: '#666', paddingBottom: '8px' }}>Jours</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    Cela indiquera le nombre de jours éligibles pour rembourser la commande (-1 pour un nombre illimité de jours)
                  </p>
                </div>

              </BlockStack>
            </div>

          </div>

          {/* Bloc termes + bouton Enregistrer encadrés */}
          <div style={{
            marginTop: '32px',
            border: '2px solid #2c6ecb',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(44,110,203,0.10)',
          }}>
            {/* Zone termes et conditions */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fb 100%)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #c7dcf8',
              flexWrap: 'wrap' as const,
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: termesAcceptes ? '#2c6ecb' : '#e0e0e0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                    border: `2px solid ${termesAcceptes ? '#1a4fa0' : '#bbb'}`,
                  }}
                  onClick={() => setTermesAcceptes((v: boolean) => !v)}
                >
                  {termesAcceptes && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9.5L7 13L14.5 5.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a2332' }}>
                    En vous inscrivant, vous acceptez les termes et conditions
                    <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Requis pour créer votre compte
                  </p>
                </div>
              </div>
              <button
                onClick={openTermsOfService}
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'white', border: '1px solid #2c6ecb', borderRadius: '8px',
                  color: '#2c6ecb', fontSize: '13px', fontWeight: '600',
                  padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap' as const,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2c6ecb'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#2c6ecb'; }}
              >
                📄 Voir les conditions
              </button>
            </div>

            {/* Zone bouton enregistrer */}
            <div style={{
              background: 'white', padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '16px', flexWrap: 'wrap' as const,
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                {saving ? '⏳ Création en cours...' : uploading ? '⏳ Upload en cours...' : '✅ Prêt à créer le compte'}
              </p>
              <button
                onClick={handleCreerVendeur}
                disabled={saving || uploading}
                style={{
                  background: saving || uploading
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #2c6ecb 0%, #1a4fa0 100%)',
                  color: 'white', border: 'none', borderRadius: '8px',
                  padding: '13px 32px', fontSize: '15px', fontWeight: '700',
                  cursor: saving || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: saving || uploading ? 'none' : '0 4px 12px rgba(44,110,203,0.35)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => { if (!saving && !uploading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                ✨ Créer mon compte vendeur
              </button>
            </div>
          </div>
        </Page>

        {/* Modale de validation des champs obligatoires */}
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

        {toastMarkup}
      </div>
    </Frame>

    {/* Popup Détails du Forfait */}
    {showForfaitPopup && (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }} onClick={() => setShowForfaitPopup(false)}>
        <div style={{
          background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px',
          maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }} onClick={e => e.stopPropagation()}>

          <div style={{ background: 'linear-gradient(135deg, #0055a4 0%, #003d7a 100%)', padding: '20px 28px', borderRadius: '12px 12px 0 0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>MEMBERSHIP PLAN</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.85 }}>Détails du plan de votre boutique</p>
            </div>
            <button onClick={() => setShowForfaitPopup(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e1e3e5', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', overflow: 'hidden' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🏪'
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#333' }}>{nomBoutique || 'Nouvelle boutique'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{email || 'Email non renseigné'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#fff3cd', color: '#856404', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', border: '1px solid #ffc107' }}>{planInfo?.nom || 'Gratuit'}</span>
              <span style={{ background: '#d4edda', color: '#155724', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', border: '1px solid #28a745' }}>✅ Actif</span>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>📋</span>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: 0 }}>PLAN DETAILS</p>
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Détails du plan de membership</p>
              <div style={{ border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                  { label: 'Plan choisi', value: planInfo?.nom || 'Gratuit' },
                  { label: 'Prix mensuel', value: planInfo ? (parseFloat(planInfo.prix_ht||'0') === 0 ? 'Gratuit (0,00 $/mois)' : `${(parseFloat(planInfo.prix_ht||0)+parseFloat(planInfo.tps||0)+parseFloat(planInfo.tvq||0)+parseFloat(planInfo.tvh||0)).toFixed(2)} $/mois TTC`) : 'Gratuit (0,00 $/mois)' },
                  { label: "Frais d'installation uniques", value: planInfo?.frais_activation_actif ? (parseFloat(planInfo?.frais_activation_ht||'0') === 0 ? 'Gratuit' : `${parseFloat(planInfo?.frais_activation_ht||'0').toFixed(2)} $ (avant taxes)`) : 'N/A' },
                  { label: 'Produits autorisés', value: (!planInfo?.limiter_produits || planInfo?.limite_produits <= 0) ? 'Illimité' : String(planInfo?.limite_produits) },
                  { label: 'Période de facturation', value: '30 jours' },
                  { label: 'Commission sur ventes', value: planInfo?.commission != null ? `${planInfo.commission}%${!planInfo?.commission_active || planInfo.commission === 0 ? ' (aucune)' : ''}` : 'N/A' },
                ].map((row: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < 5 ? '1px solid #f0f0f0' : 'none', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <span style={{ fontSize: '13px', color: '#555' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default InscriptionVendeur;
