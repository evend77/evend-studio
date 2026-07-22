import React, { useState, useEffect } from 'react';

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

// ── Styles partagés ───────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px',
  fontSize: '13px', outline: 'none', backgroundColor: 'white',
  width: '100%', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  backgroundColor: 'white',
};

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ actif, onChange, disabled }: { actif: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!actif)}
      style={{ width: '48px', height: '26px', borderRadius: '13px', backgroundColor: actif ? T.success : '#d1d5db', cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ position: 'absolute', top: '3px', left: actif ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ── Composant Select avec recherche ───────────────────────────────────────────
function SelectRecherche({ 
  options, 
  value, 
  onChange, 
  placeholder = "Sélectionner...",
  disabled = false,
  optionLabel = (opt: any) => opt.nom || opt.label || opt.toString(),
  optionValue = (opt: any) => opt.id || opt.value || opt
}: { 
  options: any[]; 
  value: any; 
  onChange: (v: any) => void; 
  placeholder?: string;
  disabled?: boolean;
  optionLabel?: (opt: any) => string;
  optionValue?: (opt: any) => any;
}) {
  const [recherche, setRecherche] = useState('');
  const [ouvert, setOuvert] = useState(false);

  const optionsFiltrees = options.filter(opt => 
    optionLabel(opt).toLowerCase().includes(recherche.toLowerCase())
  );

  const optionSelectionnee = options.find(opt => optionValue(opt) === value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setOuvert(!ouvert)}
        style={{ 
          ...inputStyle, 
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ color: optionSelectionnee ? T.text : '#9ca3af' }}>
          {optionSelectionnee ? optionLabel(optionSelectionnee) : placeholder}
        </span>
        <span style={{ fontSize: '10px' }}>{ouvert ? '▲' : '▼'}</span>
      </div>
      
      {ouvert && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: `1px solid ${T.border}`,
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '300px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <div style={{ padding: '8px', borderBottom: `1px solid ${T.border}` }}>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              style={{ ...inputStyle, width: '100%' }}
              autoFocus
            />
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {optionsFiltrees.length > 0 ? (
              optionsFiltrees.map((opt) => (
                <div
                  key={optionValue(opt)}
                  onClick={() => {
                    onChange(optionValue(opt));
                    setOuvert(false);
                    setRecherche('');
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: optionValue(opt) === value ? T.accentLight : 'transparent',
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = optionValue(opt) === value ? T.accentLight : 'transparent'}
                >
                  {optionLabel(opt)}
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>
                Aucun résultat
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ titre, icon, children, danger, disabled }: { titre: string; icon: string; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <div style={{ 
      backgroundColor: T.card, 
      borderRadius: '14px', 
      border: `1px solid ${danger ? '#fecdd3' : T.border}`, 
      overflow: 'hidden', 
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', 
      marginBottom: '20px',
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto' as const,
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${danger ? T.danger : T.accent}`, backgroundColor: danger ? '#fff5f5' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ fontSize: '13px', fontWeight: '800', color: danger ? T.danger : T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ── Ligne paramètre ───────────────────────────────────────────────────────────
function ParamLigne({ label, description, children, derniere }: {
  label: string; description?: string; children: React.ReactNode; derniere?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', paddingBottom: derniere ? 0 : '16px', marginBottom: derniere ? 0 : '16px', borderBottom: derniere ? 'none' : `1px solid #f0f0f0` }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 2px 0' }}>{label}</p>
        {description && <p style={{ fontSize: '11px', color: T.textLight, margin: 0, lineHeight: '1.5' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ── Composant d'upload d'image ────────────────────────────────────────────────
function ImageUploader({ 
  label, 
  description, 
  imageUrl, 
  onImageChange,
  onImageRemove,
  uploading 
}: { 
  label: string;
  description?: string;
  imageUrl: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 2px 0' }}>{label}</p>
      {description && <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 10px 0', lineHeight: '1.5' }}>{description}</p>}
      
      <div style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: imageUrl ? '0' : '20px',
        textAlign: 'center',
        marginBottom: '8px',
        backgroundColor: '#fafafa',
        minHeight: imageUrl ? 'auto' : '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {uploading && (
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
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={label} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '150px',
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
        ) : (
          <>
            <span style={{ fontSize: '40px' }}>🖼️</span>
            <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>Aucune image sélectionnée</p>
          </>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleClick}
          disabled={uploading}
          style={{
            padding: '6px 12px',
            backgroundColor: T.accent,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1
          }}
        >
          {imageUrl ? 'Changer l\'image' : 'Télécharger une image'}
        </button>
        
        {imageUrl && (
          <button 
            onClick={onImageRemove}
            disabled={uploading}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: T.danger,
              border: `1px solid ${T.danger}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.5 : 1
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' | 'info' }) {
  const bg = { success: T.success, danger: T.danger, info: T.accent }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '420px', lineHeight: '1.5' }}>
      {msg}
    </div>
  );
}

// ── Modal confirmation danger ─────────────────────────────────────────────────
function ModalConfirm({ titre, message, onConfirmer, onAnnuler }: {
  titre: string; message: string; onConfirmer: () => void; onAnnuler: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onAnnuler()}>
      <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', backgroundColor: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
          <p style={{ fontSize: '15px', fontWeight: '800', color: T.danger, margin: 0 }}>⚠️ {titre}</p>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px 0', lineHeight: '1.6' }}>{message}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onAnnuler} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
            <button onClick={onConfirmer} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Onglet ────────────────────────────────────────────────────────────────────
function Onglet({ label, actif, onClick }: { label: string; actif: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        fontSize: '13px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        border: 'none',
        borderBottom: actif ? `3px solid ${T.accent}` : `3px solid transparent`,
        backgroundColor: actif ? '#ffffff' : 'transparent',
        color: actif ? T.accent : T.textLight,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginRight: '4px',
        borderRadius: '8px 8px 0 0',
      }}
    >
      {label}
    </button>
  );
}

// ── Types pour les commissions ────────────────────────────────────────────────
interface CommissionSlab {
  min: string;
  max: string;
  type: string;
  premiereCommission: string;
  secondeCommission: string;
}

interface CommissionCategorie {
  id: string;
  categorieId: number;
  categorieNom: string;
  type: string;
  premiereCommission: string;
  secondeCommission?: string;
}

interface CommissionVendeur {
  id: string;
  gestionnaireId: number;
  vendeurEmail: string;
  vendeurBoutique: string;
  type: string;
  premiereCommission: string;
  secondeCommission?: string;
}

// ── Page principale ───────────────────────────────────────────────────────────
interface ConfigurationGeneraleProps { naviguerVers: (p: string, d?: any) => void; }

export default function ConfigurationGenerale({ naviguerVers }: ConfigurationGeneraleProps) {
  const [ongletActif, setOngletActif] = useState<'generalite' | 'configurationVendeur' | 'configurationProduits' | 'configurationCommande' | 'commission' | 'avance'>('generalite');
  const [chargement, setChargement] = useState(true);

  // ── État des paramètres (Généralité) ──────────────────────────────────────
  const [bloquerInscriptionVendeur, setBloquerInscriptionVendeur] = useState(false);
  const [bloquerInscriptionAcheteur, setBloquerInscriptionAcheteur] = useState(false);
  const [modeMaintenance,          setModeMaintenance]          = useState(false);
  const [messageMaintenance,       setMessageMaintenance]       = useState('');
  const [stripeActif,              setStripeActif]              = useState(true);
  const [paypalActif,              setPaypalActif]              = useState(true);
  const [avisActifs,               setAvisActifs]               = useState(true);
  const [notifsAutoVendeurs,       setNotifsAutoVendeurs]       = useState(true);

  const [utiliserPlansVendeur,     setUtiliserPlansVendeur]     = useState(false);
  const [maxProduits,              setMaxProduits]              = useState('50');
  const [nomPlateforme,            setNomPlateforme]            = useState('e-Vend');
  const [tauxTps,                  setTauxTps]                  = useState(0.05);
  const [tauxTvq,                  setTauxTvq]                  = useState(0.09975);
  const [noTpsPlateforme,          setNoTpsPlateforme]          = useState('');
  const [noTvqPlateforme,          setNoTvqPlateforme]          = useState('');
  const [shopifyDomain,            setShopifyDomain]            = useState('');
  const [emailContact,             setEmailContact]             = useState('support@evend.ca');
  const [storeEmail,               setStoreEmail]               = useState('evend.ca@outlook.com');
  const [domaine,                  setDomaine]                  = useState('www.e-vend.ca');
  const [contactNumber,            setContactNumber]            = useState('');
  const [currency,                 setCurrency]                 = useState('CAD');
  const [customCurrencySymbol,     setCustomCurrencySymbol]     = useState(false);
  const [langue,                   setLangue]                   = useState('fr');
  const [timeZone,                 setTimeZone]                 = useState('EST');
  const [dateFormat,               setDateFormat]               = useState('DD-MMM-YYYY');
  const [timeFormat,               setTimeFormat]               = useState('hh:mm A');
  const [footerText,               setFooterText]               = useState('Copyright ($current_year) e-Vend Studio, Tous droits réservés');

  const [banniereActive,  setBanniereActive]  = useState(false);
  const [banniereTitre,   setBanniereTitre]   = useState('');
  const [banniereMessage, setBanniereMessage] = useState('');
  const [banniereType,    setBanniereType]    = useState<'info' | 'warning' | 'danger'>('info');

  // Bannière dashboard vendeur
  const [banniereVendeurActive,    setBanniereVendeurActive]    = useState(false);
  const [banniereVendeurMessage,   setBanniereVendeurMessage]   = useState('');
  const [banniereVendeurCouleurBg, setBanniereVendeurCouleurBg] = useState('#1e3a5f');
  const [banniereVendeurCouleurTx, setBanniereVendeurCouleurTx] = useState('#ffffff');
  const [banniereVendeurHauteur,   setBanniereVendeurHauteur]   = useState('36');
  const [banniereVendeurPolice,    setBanniereVendeurPolice]    = useState('13');

  // Bannière dashboard acheteur
  const [banniereAcheteurActive,    setBanniereAcheteurActive]    = useState(false);
  const [banniereAcheteurMessage,   setBanniereAcheteurMessage]   = useState('');
  const [banniereAcheteurCouleurBg, setBanniereAcheteurCouleurBg] = useState('#1e3a5f');
  const [banniereAcheteurCouleurTx, setBanniereAcheteurCouleurTx] = useState('#ffffff');
  const [banniereAcheteurHauteur,   setBanniereAcheteurHauteur]   = useState('36');
  const [banniereAcheteurPolice,    setBanniereAcheteurPolice]    = useState('13');

  // Bannière page de connexion
  const [banniereLoginActive,    setBanniereLoginActive]    = useState(false);
  const [banniereLoginMessage,   setBanniereLoginMessage]   = useState('');
  const [banniereLoginCouleurBg, setBanniereLoginCouleurBg] = useState('#1e3a5f');
  const [banniereLoginCouleurTx, setBanniereLoginCouleurTx] = useState('#ffffff');
  const [banniereLoginHauteur,   setBanniereLoginHauteur]   = useState('36');
  const [banniereLoginPolice,    setBanniereLoginPolice]    = useState('13');

  const [banniereDefautUrl, setBanniereDefautUrl] = useState<string | null>(null);
  const [logoDefautUrl, setLogoDefautUrl] = useState<string | null>(null);
  const [uploadingBanniere, setUploadingBanniere] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── État des paramètres (Configuration Vendeur) ───────────────────────────
  const [permettreExpedition, setPermettreExpedition] = useState(true);
  const [approuverAutoVendeur, setApprouverAutoVendeur] = useState(false);
  const [importerVendeursCSV, setImporterVendeursCSV] = useState(false);
  const [voirDetailsClient, setVoirDetailsClient] = useState(true);
  const [voirEmailClient, setVoirEmailClient] = useState(true);
  const [voirTelephoneClient, setVoirTelephoneClient] = useState(true);
  const [politiqueVendeur, setPolitiqueVendeur] = useState('normale');
  const [permettreAjoutPersonnel, setPermettreAjoutPersonnel] = useState(false);
  const [restreindreInscription, setRestreindreInscription] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(true);
  const [permettreTags, setPermettreTags] = useState(true);
  const [restreindreTagsInscription, setRestreindreTagsInscription] = useState(false);
  const [permettreCategories, setPermettreCategories] = useState(true);
  const [restreindreCategoriesInscription, setRestreindreCategoriesInscription] = useState(false);
  const [permettreDevisePropre, setPermettreDevisePropre] = useState(false);
  const [methodeConversion, setMethodeConversion] = useState('automatique');
  const [permettreChangementUnitePoids, setPermettreChangementUnitePoids] = useState(true);
  const [restreindreDesactivationAvis, setRestreindreDesactivationAvis] = useState(false);
  const [mettreAJourIdentifiant, setMettreAJourIdentifiant] = useState(false);
  const [redirigerVerificationEmail, setRedirigerVerificationEmail] = useState(false);
  const [permettreNomBoutiqueInscription, setPermettreNomBoutiqueInscription] = useState(true);
  const [approuverAutoAvis, setApprouverAutoAvis] = useState(false);
  const [permettreGestionAutoApprobationAvis, setPermettreGestionAutoApprobationAvis] = useState(false);
  const [avisAvance, setAvisAvance] = useState(false);
  const [ssoActif, setSsoActif] = useState(false);
  const [voirTotalDu, setVoirTotalDu] = useState(true);
  const [notificationStockFaible, setNotificationStockFaible] = useState(false);
  const [seuilStockFaible, setSeuilStockFaible] = useState('1');
  const [modifierValeurParDefautChamp, setModifierValeurParDefautChamp] = useState(false);
  const [synchroniserMetaObjet, setSynchroniserMetaObjet] = useState(false);
  const [vacancesVendeur, setVacancesVendeur] = useState(false);
  const [vendeurSurBoutique, setVendeurSurBoutique] = useState(true);
  const [optionInscription, setOptionInscription] = useState('email');
  const [shopFaq, setShopFaq] = useState(false);
  const [c2cMarketplace, setC2cMarketplace] = useState(false);
  const [customerCreation, setCustomerCreation] = useState('signup');
  const [customerTag, setCustomerTag] = useState('Acheteur devenu vendeur');
  const [emailNotificationProductQuery, setEmailNotificationProductQuery] = useState(false);
  const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState(false);
  const [loginAsSeller, setLoginAsSeller] = useState(false);
  const [checkCustomerLogin, setCheckCustomerLogin] = useState(false);
  const [checkCustomerPurchase, setCheckCustomerPurchase] = useState(false);

  // ── État des paramètres (Configuration Produits) ──────────────────────────
  const [approuverAutoProduit, setApprouverAutoProduit] = useState(true);
  const [desactiverAutoProduit, setDesactiverAutoProduit] = useState(false);
  const [conditionDesactivation, setConditionDesactivation] = useState('');
  const [importerProduitsCSV, setImporterProduitsCSV] = useState(false);
  const [permettreAjoutProduit, setPermettreAjoutProduit] = useState(true);
  const [permettreEditionProduit, setPermettreEditionProduit] = useState(true);
  const [permettreSuppressionProduit, setPermettreSuppressionProduit] = useState(true);
  const [commissionParProduit, setCommissionParProduit] = useState(false);
  const [taxesParDefaut, setTaxesParDefaut] = useState(false);
  const [afficherCheckboxTaxes, setAfficherCheckboxTaxes] = useState(true);
  // 'libre' = vendeur choisit | 'force_taxable' = toujours taxé | 'force_non_taxable' = jamais taxé
  const [modeTaxe, setModeTaxe] = useState<'libre' | 'force_taxable' | 'force_non_taxable'>('libre');
  // 'admin' = les taxes perçues vont à l'admin | 'vendeur' = les taxes sont versées au vendeur
  const [destinataireTaxes, setDestinataireTaxes] = useState<'admin' | 'vendeur'>('admin');
  const [expeditionRequiseProduitsNormaux, setExpeditionRequiseProduitsNormaux] = useState(true);
  const [skuProduitsNumeriques, setSkuProduitsNumeriques] = useState(false);
  const [codeBarreProduitsNumeriques, setCodeBarreProduitsNumeriques] = useState(false);
  const [collectionsObligatoires, setCollectionsObligatoires] = useState(false);
  const [maxCollections, setMaxCollections] = useState('5');
  const [assignationProduitsPar, setAssignationProduitsPar] = useState('email');
  const [affichageNomVendeur, setAffichageNomVendeur] = useState('nom');
  const [utiliserS3, setUtiliserS3] = useState(false);
  const [editeurDescription, setEditeurDescription] = useState('tinymce');
  const [sauvegarderBrouillon, setSauvegarderBrouillon] = useState(false);
  const [statutBrouillonCSV, setStatutBrouillonCSV] = useState(false);
  const [creerBrouillonShopify, setCreerBrouillonShopify] = useState(false);
  const [cacherBrouillonAdmin, setCacherBrouillonAdmin] = useState(false);
  const [ajouterPrefixeNomProduit, setAjouterPrefixeNomProduit] = useState(false);
  const [remplacerNomParId, setRemplacerNomParId] = useState(false);
  const [afficherPolitiqueProduit, setAfficherPolitiqueProduit] = useState(false);
  const [annuaireProduitsNormaux, setAnnuaireProduitsNormaux] = useState(false);
  const [canauxVente, setCanauxVente] = useState({
    boutiqueEnLigne: true,
    pointsVente: false,
    canauxSociaux: false
  });
  const [modifierVisibiliteAnciensProduits, setModifierVisibiliteAnciensProduits] = useState(false);
  const [permettreAjoutHandle, setPermettreAjoutHandle] = useState(false);
  const [permettreAjoutMeta, setPermettreAjoutMeta] = useState(false);
  const [permettreDesactivationProduit, setPermettreDesactivationProduit] = useState(true);
  const [mettreAJourNomBoutiqueShopify, setMettreAJourNomBoutiqueShopify] = useState(true);
  const [gererInventaireParDefaut, setGererInventaireParDefaut] = useState(true);
  const [produitNumeriqueCommeService, setProduitNumeriqueCommeService] = useState(false);
  const [permettreLienProduitNumerique, setPermettreLienProduitNumerique] = useState(false);
  const [quantiteMinimumAchat, setQuantiteMinimumAchat] = useState(false);
  const [applicationQuantiteMinimum, setApplicationQuantiteMinimum] = useState('produit');
  const [prixZeroAutorise, setPrixZeroAutorise] = useState(false);
  const [texteAideFormulaire, setTexteAideFormulaire] = useState(false);
  const [delaisLivraison, setDelaisLivraison] = useState(false);
  const [avalaraTaxe, setAvalaraTaxe] = useState(false);
  const [codeTaxeParType, setCodeTaxeParType] = useState(false);
  const [cacherChampTags, setCacherChampTags] = useState(false);
  const [supportVideoMedia, setSupportVideoMedia] = useState(false);
  const [afficherImageListeProduits, setAfficherImageListeProduits] = useState(false);
  const [synchronisationDouble, setSynchronisationDouble] = useState(false);
  const [menuProduitsConnecteur, setMenuProduitsConnecteur] = useState(false);
  const [permettreAjoutPrixRevient, setPermettreAjoutPrixRevient] = useState(false);
  const [afficherNomMarque, setAfficherNomMarque] = useState(false);
  const [permettreAjoutDocumentsSignature, setPermettreAjoutDocumentsSignature] = useState(false);
  const [publierTousMarches, setPublierTousMarches] = useState(false);
  const [typePrixLibre, setTypePrixLibre] = useState(false);
  const [prixMinimum, setPrixMinimum] = useState('0');
  const [datePublicationFuture, setDatePublicationFuture] = useState(false);
  const [dateVenteFuture, setDateVenteFuture] = useState(false);
  const [afficherProduitsFuturs, setAfficherProduitsFuturs] = useState(false);
  const [syncApprobationMetachamp, setSyncApprobationMetachamp] = useState(false);
  const [listeProduitsDesactivesMail, setListeProduitsDesactivesMail] = useState(false);
  const [gererTaxonomie, setGererTaxonomie] = useState(false);
  const [restreindreCaracteresSpeciaux, setRestreindreCaracteresSpeciaux] = useState(false);
  const [fraisTransaction, setFraisTransaction] = useState(false);
  const [typeFraisTransaction, setTypeFraisTransaction] = useState('normal');
  const [porteurFraisTransaction, setPorteurFraisTransaction] = useState('admin');
  const [applicationFraisTransaction, setApplicationFraisTransaction] = useState('commande');
  const [pourcentageFrais, setPourcentageFrais] = useState('2.90');
  const [montantFixeFrais, setMontantFixeFrais] = useState('0.30');
  const [typeFraisFixe, setTypeFraisFixe] = useState('commande');
  const [selectionHeureExpiration, setSelectionHeureExpiration] = useState(false);
  const [paysOrigineProduit, setPaysOrigineProduit] = useState(false);
  const [texteAlternatifMedia, setTexteAlternatifMedia] = useState(true);
  const [templateAlternatifProduit, setTemplateAlternatifProduit] = useState(false);
  const [nomTemplate, setNomTemplate] = useState('');
  const [prixSolde, setPrixSolde] = useState(false);
  const [arrondiPrix, setArrondiPrix] = useState('2');
  const [fraisManutention, setFraisManutention] = useState(false);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dimensionUnit, setDimensionUnit] = useState('cm');

  // ── État des paramètres (Configuration Commande) ──────────────────────────
  const [modeExpeditionObligatoire, setModeExpeditionObligatoire] = useState(false);
  const [numeroSuiviObligatoire, setNumeroSuiviObligatoire] = useState(false);
  const [statutPreparationCommande, setStatutPreparationCommande] = useState(false);
  const [heuresPreparation, setHeuresPreparation] = useState('0');
  const [remboursementExpiration, setRemboursementExpiration] = useState(false);
  const [taxesInclusesPrix, setTaxesInclusesPrix] = useState(false);
  const [deduireExpeditionRemboursement, setDeduireExpeditionRemboursement] = useState(false);
  const [deduireTaxesRemboursement, setDeduireTaxesRemboursement] = useState(false);
  const [taxesSurExpedition, setTaxesSurExpedition] = useState(false);
  const [permettreEtiquetteExpedition, setPermettreEtiquetteExpedition] = useState(false);
  const [montantEncaisable, setMontantEncaisable] = useState(false);
  const [joursRemboursement, setJoursRemboursement] = useState('14');
  const [calculMontantEncaisable, setCalculMontantEncaisable] = useState('dateCommande');
  const [permettreJoursRemboursementVendeur, setPermettreJoursRemboursementVendeur] = useState(false);
  const [gererRemiseCommande, setGererRemiseCommande] = useState(false);
  const [fraisRemise, setFraisRemise] = useState('vendeur');
  const [ajouterTVABaliseCommande, setAjouterTVABaliseCommande] = useState(false);
  const [generationFacture, setGenerationFacture] = useState('anyTime');
  const [permettreInfosSupplementaires, setPermettreInfosSupplementaires] = useState(false);
  const [modifierInfosSupplementaires, setModifierInfosSupplementaires] = useState(false);
  const [permettreAnnulerExpedition, setPermettreAnnulerExpedition] = useState(false);
  const [permettreAccepterCommande, setPermettreAccepterCommande] = useState(true);
  const [annulerAutoRejet, setAnnulerAutoRejet] = useState(false);
  const [permettreAnnulerCommandeAcceptee, setPermettreAnnulerCommandeAcceptee] = useState(false);
  const [accepterEtExpedier, setAccepterEtExpedier] = useState(false);
  const [permettreCreationCommande, setPermettreCreationCommande] = useState(false);
  const [envoyerMailExpedition, setEnvoyerMailExpedition] = useState(true);
  const [permettreDateLivraisonPrevue, setPermettreDateLivraisonPrevue] = useState(false);
  const [dateLivraisonObligatoire, setDateLivraisonObligatoire] = useState(false);
  const [gestionPourboire, setGestionPourboire] = useState('vendeurs');
  const [permettreCCEmailCommande, setPermettreCCEmailCommande] = useState(false);
  const [rappelExpeditionAuto, setRappelExpeditionAuto] = useState(false);
  const [joursAvantRappel, setJoursAvantRappel] = useState('2');
  const [joursMaxRappel, setJoursMaxRappel] = useState('30');
  const [permettreNotificationAvis, setPermettreNotificationAvis] = useState(false);
  const [evenementNotification, setEvenementNotification] = useState('expedition');
  const [delaiNotification, setDelaiNotification] = useState('0');
  const [limiteMaxNotification, setLimiteMaxNotification] = useState('1');
  const [tcsSurCommandes, setTcsSurCommandes] = useState(false);
  const [tdsSurCommandes, setTdsSurCommandes] = useState(false);
  const [restreindreExpeditionFraude, setRestreindreExpeditionFraude] = useState(false);
  const [restreindreVoirCommandesImpayees, setRestreindreVoirCommandesImpayees] = useState(false);

  // ── État des paramètres (Avancé) ──────────────────────────────────────────
  const [groupingCustomFields, setGroupingCustomFields] = useState(false);
  const [f2aAdminActif, setF2aAdminActif] = useState(false);
  const [f2aAdminSaving, setF2aAdminSaving] = useState(false);
  const [googleTranslation, setGoogleTranslation] = useState(false);
  const [translationPanel, setTranslationPanel] = useState('both');
  const [rtlAlignment, setRtlAlignment] = useState(false);

  // ── État des paramètres (Commission) ──────────────────────────────────────
  const [calculCommissionBase, setCalculCommissionBase] = useState('normal');
  const [typeCommissionGlobale, setTypeCommissionGlobale] = useState('%');
  const [commissionGlobale, setCommissionGlobale] = useState('10.00');
  const [secondeCommissionGlobale, setSecondeCommissionGlobale] = useState('0.00');
  const [typeCommissionFixe, setTypeCommissionFixe] = useState('produit');
  const [activerCommissionMax, setActiverCommissionMax] = useState(false);
  const [commissionMax, setCommissionMax] = useState('0.00');

  const [baremesCommission, setBaremesCommission] = useState<CommissionSlab[]>([
    { min: '', max: '', type: '% + FIXED', premiereCommission: '', secondeCommission: '' }
  ]);

  const [categories, setCategories] = useState<any[]>([
    { id: 1, nom: "Abris extérieurs" },
    { id: 2, nom: "Accès membres & contenus privés" },
    // ... (garde toutes tes catégories)
  ]);

  const [vendeurs, setVendeurs] = useState<any[]>([
    { id: 3, email: "sophie@example.com", nom_boutique: "Mode Sophie", statut: "actif" },
    { id: 5, email: "momsworld2026@hotmail.com", nom_boutique: "Mom's World", statut: "actif" },
    { id: 16, email: "canada-distribution.center@hotmail.com", nom_boutique: "super mag", statut: "actif" }
  ]);

  const [commissionsCategorie, setCommissionsCategorie] = useState<CommissionCategorie[]>([
    { id: '1', categorieId: 81, categorieNom: "Chandails / T-shirts", type: '%', premiereCommission: '5' },
    { id: '2', categorieId: 185, categorieNom: "Montres", type: 'FIXED', premiereCommission: '2' },
    { id: '3', categorieId: 55, categorieNom: "Bandes dessinées", type: '% + FIXED', premiereCommission: '3', secondeCommission: '1' },
  ]);

  const [nouvelleCategorie, setNouvelleCategorie] = useState({
    categorieId: '',
    type: '%',
    premiereCommission: '',
    secondeCommission: ''
  });

  const [commissionsVendeur, setCommissionsVendeur] = useState<CommissionVendeur[]>([
    { id: '1', gestionnaireId: 3, vendeurEmail: "sophie@example.com", vendeurBoutique: "Mode Sophie", type: '%', premiereCommission: '8' },
    { id: '2', gestionnaireId: 5, vendeurEmail: "momsworld2026@hotmail.com", vendeurBoutique: "Mom's World", type: 'FIXED + %', premiereCommission: '5', secondeCommission: '2' },
  ]);

  const [nouveauVendeur, setNouveauVendeur] = useState({
    gestionnaireId: '',
    type: '%',
    premiereCommission: '',
    secondeCommission: ''
  });

  // ── État UI ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'danger'|'info' } | null>(null);
  const [modalConfirm, setModalConfirm] = useState<{ titre: string; message: string; action: () => void } | null>(null);
  const [modifie, setModifie] = useState(false);
  const [afficherFormulaireCategorie, setAfficherFormulaireCategorie] = useState(false);
  const [afficherFormulaireVendeur, setAfficherFormulaireVendeur] = useState(false);

  const showToast = (msg: string, type: 'success'|'danger'|'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const marquerModifie = () => setModifie(true);

  // ── F2A admin — séparé du reste de la config, bascule instantanée ──────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/config/2fa', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.two_factor_enabled === 'boolean') setF2aAdminActif(data.two_factor_enabled); })
      .catch(() => {});
  }, []);

  const toggleF2aAdmin = async () => {
    const nouvelEtat = !f2aAdminActif;
    setF2aAdminSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/config/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!res.ok) throw new Error();
      setF2aAdminActif(nouvelEtat);
    } catch {
      // pas de toast dédié ici — le toggle revient visuellement à son état précédent
    } finally {
      setF2aAdminSaving(false);
    }
  };

  // ============================================
  // CHARGEMENT DE LA CONFIGURATION DEPUIS L'API ADMIN
  // ============================================
  useEffect(() => {
    const chargerConfiguration = async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/configuration', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📥 Configuration admin chargée:', data);
          
          // Généralité
          if (data.bloquer_inscription_vendeur !== undefined) setBloquerInscriptionVendeur(data.bloquer_inscription_vendeur);
          if (data.bloquer_inscription_acheteur !== undefined) setBloquerInscriptionAcheteur(data.bloquer_inscription_acheteur);
          if (data.mode_maintenance !== undefined) setModeMaintenance(data.mode_maintenance);
          if (data.message_maintenance !== undefined) setMessageMaintenance(data.message_maintenance);
          if (data.stripe_actif !== undefined) setStripeActif(data.stripe_actif);
          if (data.paypal_actif !== undefined) setPaypalActif(data.paypal_actif);
          if (data.avis_actifs !== undefined) setAvisActifs(data.avis_actifs);
          if (data.notifs_auto_vendeurs !== undefined) setNotifsAutoVendeurs(data.notifs_auto_vendeurs);
          if (data.utiliser_plans_vendeur !== undefined) setUtiliserPlansVendeur(data.utiliser_plans_vendeur);
          if (data.max_produits !== undefined) setMaxProduits(data.max_produits);
          if (data.nom_plateforme !== undefined) setNomPlateforme(data.nom_plateforme);
          if (data.taux_tps !== undefined) setTauxTps(parseFloat(data.taux_tps));
          if (data.taux_tvq !== undefined) setTauxTvq(parseFloat(data.taux_tvq));
          if (data.no_tps_plateforme !== undefined) setNoTpsPlateforme(data.no_tps_plateforme || '');
          if (data.no_tvq_plateforme !== undefined) setNoTvqPlateforme(data.no_tvq_plateforme || '');
          if (data.shopify_domain !== undefined) setShopifyDomain(data.shopify_domain);
          if (data.email_contact !== undefined) setEmailContact(data.email_contact);
          if (data.store_email !== undefined) setStoreEmail(data.store_email);
          if (data.domaine !== undefined) setDomaine(data.domaine);
          if (data.contact_number !== undefined) setContactNumber(data.contact_number);
          if (data.currency !== undefined) setCurrency(data.currency);
          if (data.custom_currency_symbol !== undefined) setCustomCurrencySymbol(data.custom_currency_symbol);
          if (data.langue !== undefined) setLangue(data.langue);
          if (data.time_zone !== undefined) setTimeZone(data.time_zone);
          if (data.date_format !== undefined) setDateFormat(data.date_format);
          if (data.time_format !== undefined) setTimeFormat(data.time_format);
          if (data.footer_text !== undefined) setFooterText(data.footer_text);
          if (data.banniere_active !== undefined) setBanniereActive(data.banniere_active);
          if (data.banniere_titre !== undefined) setBanniereTitre(data.banniere_titre);
          if (data.banniere_message !== undefined) setBanniereMessage(data.banniere_message);
          if (data.banniere_type !== undefined) setBanniereType(data.banniere_type);
          // Bannières dashboards
          if (data.banniere_vendeur_active !== undefined) setBanniereVendeurActive(data.banniere_vendeur_active);
          if (data.banniere_vendeur_message !== undefined) setBanniereVendeurMessage(data.banniere_vendeur_message);
          if (data.banniere_vendeur_couleur_bg !== undefined) setBanniereVendeurCouleurBg(data.banniere_vendeur_couleur_bg);
          if (data.banniere_vendeur_couleur_tx !== undefined) setBanniereVendeurCouleurTx(data.banniere_vendeur_couleur_tx);
          if (data.banniere_vendeur_hauteur !== undefined) setBanniereVendeurHauteur(data.banniere_vendeur_hauteur);
          if (data.banniere_vendeur_police !== undefined) setBanniereVendeurPolice(data.banniere_vendeur_police);
          if (data.banniere_acheteur_active !== undefined) setBanniereAcheteurActive(data.banniere_acheteur_active);
          if (data.banniere_acheteur_message !== undefined) setBanniereAcheteurMessage(data.banniere_acheteur_message);
          if (data.banniere_acheteur_couleur_bg !== undefined) setBanniereAcheteurCouleurBg(data.banniere_acheteur_couleur_bg);
          if (data.banniere_acheteur_couleur_tx !== undefined) setBanniereAcheteurCouleurTx(data.banniere_acheteur_couleur_tx);
          if (data.banniere_acheteur_hauteur !== undefined) setBanniereAcheteurHauteur(data.banniere_acheteur_hauteur);
          if (data.banniere_acheteur_police !== undefined) setBanniereAcheteurPolice(data.banniere_acheteur_police);
          if (data.banniere_login_active !== undefined) setBanniereLoginActive(data.banniere_login_active);
          if (data.banniere_login_message !== undefined) setBanniereLoginMessage(data.banniere_login_message);
          if (data.banniere_login_couleur_bg !== undefined) setBanniereLoginCouleurBg(data.banniere_login_couleur_bg);
          if (data.banniere_login_couleur_tx !== undefined) setBanniereLoginCouleurTx(data.banniere_login_couleur_tx);
          if (data.banniere_login_hauteur !== undefined) setBanniereLoginHauteur(data.banniere_login_hauteur);
          if (data.banniere_login_police !== undefined) setBanniereLoginPolice(data.banniere_login_police);
          if (data.banniere_defaut_url !== undefined) setBanniereDefautUrl(data.banniere_defaut_url);
          if (data.logo_defaut_url !== undefined) setLogoDefautUrl(data.logo_defaut_url);
          
          // Configuration vendeur (extrait - garde tous les paramètres)
          if (data.permettre_expedition !== undefined) setPermettreExpedition(data.permettre_expedition);
          if (data.approuver_auto_vendeur !== undefined) setApprouverAutoVendeur(data.approuver_auto_vendeur);
          if (data.importer_vendeurs_csv !== undefined) setImporterVendeursCSV(data.importer_vendeurs_csv);
          if (data.voir_details_client !== undefined) setVoirDetailsClient(data.voir_details_client);
          if (data.voir_email_client !== undefined) setVoirEmailClient(data.voir_email_client);
          if (data.voir_telephone_client !== undefined) setVoirTelephoneClient(data.voir_telephone_client);
          if (data.politique_vendeur !== undefined) setPolitiqueVendeur(data.politique_vendeur);
          if (data.permettre_ajout_personnel !== undefined) setPermettreAjoutPersonnel(data.permettre_ajout_personnel);
          if (data.restreindre_inscription !== undefined) setRestreindreInscription(data.restreindre_inscription);
          if (data.verification_email !== undefined) setVerificationEmail(data.verification_email);
          if (data.permettre_tags !== undefined) setPermettreTags(data.permettre_tags);
          if (data.restreindre_tags_inscription !== undefined) setRestreindreTagsInscription(data.restreindre_tags_inscription);
          if (data.permettre_categories !== undefined) setPermettreCategories(data.permettre_categories);
          if (data.restreindre_categories_inscription !== undefined) setRestreindreCategoriesInscription(data.restreindre_categories_inscription);
          if (data.permettre_devise_propre !== undefined) setPermettreDevisePropre(data.permettre_devise_propre);
          if (data.methode_conversion !== undefined) setMethodeConversion(data.methode_conversion);
          if (data.permettre_changement_unite_poids !== undefined) setPermettreChangementUnitePoids(data.permettre_changement_unite_poids);
          if (data.restreindre_desactivation_avis !== undefined) setRestreindreDesactivationAvis(data.restreindre_desactivation_avis);
          if (data.mettre_a_jour_identifiant !== undefined) setMettreAJourIdentifiant(data.mettre_a_jour_identifiant);
          if (data.rediriger_verification_email !== undefined) setRedirigerVerificationEmail(data.rediriger_verification_email);
          if (data.permettre_nom_boutique_inscription !== undefined) setPermettreNomBoutiqueInscription(data.permettre_nom_boutique_inscription);
          if (data.approuver_auto_avis !== undefined) setApprouverAutoAvis(data.approuver_auto_avis);
          if (data.permettre_gestion_auto_approbation_avis !== undefined) setPermettreGestionAutoApprobationAvis(data.permettre_gestion_auto_approbation_avis);
          if (data.avis_avance !== undefined) setAvisAvance(data.avis_avance);
          if (data.sso_actif !== undefined) setSsoActif(data.sso_actif);
          if (data.voir_total_du !== undefined) setVoirTotalDu(data.voir_total_du);
          if (data.notification_stock_faible !== undefined) setNotificationStockFaible(data.notification_stock_faible);
          if (data.seuil_stock_faible !== undefined) setSeuilStockFaible(data.seuil_stock_faible);
          if (data.modifier_valeur_par_defaut_champ !== undefined) setModifierValeurParDefautChamp(data.modifier_valeur_par_defaut_champ);
          if (data.synchroniser_meta_objet !== undefined) setSynchroniserMetaObjet(data.synchroniser_meta_objet);
          if (data.vacances_vendeur !== undefined) setVacancesVendeur(data.vacances_vendeur);
          if (data.vendeur_sur_boutique !== undefined) setVendeurSurBoutique(data.vendeur_sur_boutique);
          if (data.option_inscription !== undefined) setOptionInscription(data.option_inscription);
          if (data.shop_faq !== undefined) setShopFaq(data.shop_faq);
          if (data.c2c_marketplace !== undefined) setC2cMarketplace(data.c2c_marketplace);
          if (data.customer_creation !== undefined) setCustomerCreation(data.customer_creation);
          if (data.customer_tag !== undefined) setCustomerTag(data.customer_tag);
          if (data.email_notification_product_query !== undefined) setEmailNotificationProductQuery(data.email_notification_product_query);
          if (data.minimum_purchase_amount !== undefined) setMinimumPurchaseAmount(data.minimum_purchase_amount);
          if (data.login_as_seller !== undefined) setLoginAsSeller(data.login_as_seller);
          if (data.check_customer_login !== undefined) setCheckCustomerLogin(data.check_customer_login);
          if (data.check_customer_purchase !== undefined) setCheckCustomerPurchase(data.check_customer_purchase);
          
          // Configuration produits (extrait - garde tous les paramètres)
          if (data.approuver_auto_produit !== undefined) setApprouverAutoProduit(data.approuver_auto_produit);
          if (data.desactiver_auto_produit !== undefined) setDesactiverAutoProduit(data.desactiver_auto_produit);
          if (data.condition_desactivation !== undefined) setConditionDesactivation(data.condition_desactivation);
          if (data.importer_produits_csv !== undefined) setImporterProduitsCSV(data.importer_produits_csv);
          if (data.permettre_ajout_produit !== undefined) setPermettreAjoutProduit(data.permettre_ajout_produit);
          if (data.permettre_edition_produit !== undefined) setPermettreEditionProduit(data.permettre_edition_produit);
          if (data.permettre_suppression_produit !== undefined) setPermettreSuppressionProduit(data.permettre_suppression_produit);
          if (data.commission_par_produit !== undefined) setCommissionParProduit(data.commission_par_produit);
          if (data.taxes_par_defaut !== undefined) setTaxesParDefaut(data.taxes_par_defaut);
          if (data.afficher_checkbox_taxes !== undefined) setAfficherCheckboxTaxes(data.afficher_checkbox_taxes);
          if (data.mode_taxe !== undefined) setModeTaxe(data.mode_taxe);
          if (data.destinataire_taxes !== undefined) setDestinataireTaxes(data.destinataire_taxes);
          if (data.expedition_requise_produits_normaux !== undefined) setExpeditionRequiseProduitsNormaux(data.expedition_requise_produits_normaux);
          if (data.sku_produits_numeriques !== undefined) setSkuProduitsNumeriques(data.sku_produits_numeriques);
          if (data.code_barre_produits_numeriques !== undefined) setCodeBarreProduitsNumeriques(data.code_barre_produits_numeriques);
          if (data.collections_obligatoires !== undefined) setCollectionsObligatoires(data.collections_obligatoires);
          if (data.max_collections !== undefined) setMaxCollections(data.max_collections);
          if (data.assignation_produits_par !== undefined) setAssignationProduitsPar(data.assignation_produits_par);
          if (data.affichage_nom_vendeur !== undefined) setAffichageNomVendeur(data.affichage_nom_vendeur);
          if (data.utiliser_s3 !== undefined) setUtiliserS3(data.utiliser_s3);
          if (data.editeur_description !== undefined) setEditeurDescription(data.editeur_description);
          if (data.sauvegarder_brouillon !== undefined) setSauvegarderBrouillon(data.sauvegarder_brouillon);
          if (data.statut_brouillon_csv !== undefined) setStatutBrouillonCSV(data.statut_brouillon_csv);
          if (data.creer_brouillon_shopify !== undefined) setCreerBrouillonShopify(data.creer_brouillon_shopify);
          if (data.cacher_brouillon_admin !== undefined) setCacherBrouillonAdmin(data.cacher_brouillon_admin);
          if (data.ajouter_prefixe_nom_produit !== undefined) setAjouterPrefixeNomProduit(data.ajouter_prefixe_nom_produit);
          if (data.remplacer_nom_par_id !== undefined) setRemplacerNomParId(data.remplacer_nom_par_id);
          if (data.afficher_politique_produit !== undefined) setAfficherPolitiqueProduit(data.afficher_politique_produit);
          if (data.annuaire_produits_normaux !== undefined) setAnnuaireProduitsNormaux(data.annuaire_produits_normaux);
          if (data.canaux_vente !== undefined) setCanauxVente(data.canaux_vente);
          if (data.modifier_visibilite_anciens_produits !== undefined) setModifierVisibiliteAnciensProduits(data.modifier_visibilite_anciens_produits);
          if (data.permettre_ajout_handle !== undefined) setPermettreAjoutHandle(data.permettre_ajout_handle);
          if (data.permettre_ajout_meta !== undefined) setPermettreAjoutMeta(data.permettre_ajout_meta);
          if (data.permettre_desactivation_produit !== undefined) setPermettreDesactivationProduit(data.permettre_desactivation_produit);
          if (data.mettre_a_jour_nom_boutique_shopify !== undefined) setMettreAJourNomBoutiqueShopify(data.mettre_a_jour_nom_boutique_shopify);
          if (data.gerer_inventaire_par_defaut !== undefined) setGererInventaireParDefaut(data.gerer_inventaire_par_defaut);
          if (data.produit_numerique_comme_service !== undefined) setProduitNumeriqueCommeService(data.produit_numerique_comme_service);
          if (data.permettre_lien_produit_numerique !== undefined) setPermettreLienProduitNumerique(data.permettre_lien_produit_numerique);
          if (data.quantite_minimum_achat !== undefined) setQuantiteMinimumAchat(data.quantite_minimum_achat);
          if (data.application_quantite_minimum !== undefined) setApplicationQuantiteMinimum(data.application_quantite_minimum);
          if (data.prix_zero_autorise !== undefined) setPrixZeroAutorise(data.prix_zero_autorise);
          if (data.texte_aide_formulaire !== undefined) setTexteAideFormulaire(data.texte_aide_formulaire);
          if (data.delais_livraison !== undefined) setDelaisLivraison(data.delais_livraison);
          if (data.avalara_taxe !== undefined) setAvalaraTaxe(data.avalara_taxe);
          if (data.code_taxe_par_type !== undefined) setCodeTaxeParType(data.code_taxe_par_type);
          if (data.cacher_champ_tags !== undefined) setCacherChampTags(data.cacher_champ_tags);
          if (data.support_video_media !== undefined) setSupportVideoMedia(data.support_video_media);
          if (data.afficher_image_liste_produits !== undefined) setAfficherImageListeProduits(data.afficher_image_liste_produits);
          if (data.synchronisation_double !== undefined) setSynchronisationDouble(data.synchronisation_double);
          if (data.menu_produits_connecteur !== undefined) setMenuProduitsConnecteur(data.menu_produits_connecteur);
          if (data.permettre_ajout_prix_revient !== undefined) setPermettreAjoutPrixRevient(data.permettre_ajout_prix_revient);
          if (data.afficher_nom_marque !== undefined) setAfficherNomMarque(data.afficher_nom_marque);
          if (data.permettre_ajout_documents_signature !== undefined) setPermettreAjoutDocumentsSignature(data.permettre_ajout_documents_signature);
          if (data.publier_tous_marches !== undefined) setPublierTousMarches(data.publier_tous_marches);
          if (data.type_prix_libre !== undefined) setTypePrixLibre(data.type_prix_libre);
          if (data.prix_minimum !== undefined) setPrixMinimum(data.prix_minimum);
          if (data.date_publication_future !== undefined) setDatePublicationFuture(data.date_publication_future);
          if (data.date_vente_future !== undefined) setDateVenteFuture(data.date_vente_future);
          if (data.afficher_produits_futurs !== undefined) setAfficherProduitsFuturs(data.afficher_produits_futurs);
          if (data.sync_approbation_metachamp !== undefined) setSyncApprobationMetachamp(data.sync_approbation_metachamp);
          if (data.liste_produits_desactives_mail !== undefined) setListeProduitsDesactivesMail(data.liste_produits_desactives_mail);
          if (data.gerer_taxonomie !== undefined) setGererTaxonomie(data.gerer_taxonomie);
          if (data.restreindre_caracteres_speciaux !== undefined) setRestreindreCaracteresSpeciaux(data.restreindre_caracteres_speciaux);
          if (data.frais_transaction !== undefined) setFraisTransaction(data.frais_transaction);
          if (data.type_frais_transaction !== undefined) setTypeFraisTransaction(data.type_frais_transaction);
          if (data.porteur_frais_transaction !== undefined) setPorteurFraisTransaction(data.porteur_frais_transaction);
          if (data.application_frais_transaction !== undefined) setApplicationFraisTransaction(data.application_frais_transaction);
          if (data.pourcentage_frais !== undefined) setPourcentageFrais(data.pourcentage_frais);
          if (data.montant_fixe_frais !== undefined) setMontantFixeFrais(data.montant_fixe_frais);
          if (data.type_frais_fixe !== undefined) setTypeFraisFixe(data.type_frais_fixe);
          if (data.selection_heure_expiration !== undefined) setSelectionHeureExpiration(data.selection_heure_expiration);
          if (data.pays_origine_produit !== undefined) setPaysOrigineProduit(data.pays_origine_produit);
          if (data.texte_alternatif_media !== undefined) setTexteAlternatifMedia(data.texte_alternatif_media);
          if (data.template_alternatif_produit !== undefined) setTemplateAlternatifProduit(data.template_alternatif_produit);
          if (data.nom_template !== undefined) setNomTemplate(data.nom_template);
          if (data.prix_solde !== undefined) setPrixSolde(data.prix_solde);
          if (data.arrondi_prix !== undefined) setArrondiPrix(data.arrondi_prix);
          if (data.frais_manutention !== undefined) setFraisManutention(data.frais_manutention);
          if (data.weight_unit !== undefined) setWeightUnit(data.weight_unit);
          if (data.dimension_unit !== undefined) setDimensionUnit(data.dimension_unit);
          
          // Configuration commande (extrait)
          if (data.mode_expedition_obligatoire !== undefined) setModeExpeditionObligatoire(data.mode_expedition_obligatoire);
          if (data.numero_suivi_obligatoire !== undefined) setNumeroSuiviObligatoire(data.numero_suivi_obligatoire);
          if (data.statut_preparation_commande !== undefined) setStatutPreparationCommande(data.statut_preparation_commande);
          if (data.heures_preparation !== undefined) setHeuresPreparation(data.heures_preparation);
          if (data.remboursement_expiration !== undefined) setRemboursementExpiration(data.remboursement_expiration);
          if (data.taxes_incluses_prix !== undefined) setTaxesInclusesPrix(data.taxes_incluses_prix);
          if (data.deduire_expedition_remboursement !== undefined) setDeduireExpeditionRemboursement(data.deduire_expedition_remboursement);
          if (data.deduire_taxes_remboursement !== undefined) setDeduireTaxesRemboursement(data.deduire_taxes_remboursement);
          if (data.taxes_sur_expedition !== undefined) setTaxesSurExpedition(data.taxes_sur_expedition);
          if (data.permettre_etiquette_expedition !== undefined) setPermettreEtiquetteExpedition(data.permettre_etiquette_expedition);
          if (data.montant_encaisable !== undefined) setMontantEncaisable(data.montant_encaisable);
          if (data.jours_remboursement !== undefined) setJoursRemboursement(data.jours_remboursement);
          if (data.calcul_montant_encaisable !== undefined) setCalculMontantEncaisable(data.calcul_montant_encaisable);
          if (data.permettre_jours_remboursement_vendeur !== undefined) setPermettreJoursRemboursementVendeur(data.permettre_jours_remboursement_vendeur);
          if (data.gerer_remise_commande !== undefined) setGererRemiseCommande(data.gerer_remise_commande);
          if (data.frais_remise !== undefined) setFraisRemise(data.frais_remise);
          if (data.ajouter_tva_balise_commande !== undefined) setAjouterTVABaliseCommande(data.ajouter_tva_balise_commande);
          if (data.generation_facture !== undefined) setGenerationFacture(data.generation_facture);
          if (data.permettre_infos_supplementaires !== undefined) setPermettreInfosSupplementaires(data.permettre_infos_supplementaires);
          if (data.modifier_infos_supplementaires !== undefined) setModifierInfosSupplementaires(data.modifier_infos_supplementaires);
          if (data.permettre_annuler_expedition !== undefined) setPermettreAnnulerExpedition(data.permettre_annuler_expedition);
          if (data.permettre_accepter_commande !== undefined) setPermettreAccepterCommande(data.permettre_accepter_commande);
          if (data.annuler_auto_rejet !== undefined) setAnnulerAutoRejet(data.annuler_auto_rejet);
          if (data.permettre_annuler_commande_acceptee !== undefined) setPermettreAnnulerCommandeAcceptee(data.permettre_annuler_commande_acceptee);
          if (data.accepter_et_expedier !== undefined) setAccepterEtExpedier(data.accepter_et_expedier);
          if (data.permettre_creation_commande !== undefined) setPermettreCreationCommande(data.permettre_creation_commande);
          if (data.envoyer_mail_expedition !== undefined) setEnvoyerMailExpedition(data.envoyer_mail_expedition);
          if (data.permettre_date_livraison_prevue !== undefined) setPermettreDateLivraisonPrevue(data.permettre_date_livraison_prevue);
          if (data.date_livraison_obligatoire !== undefined) setDateLivraisonObligatoire(data.date_livraison_obligatoire);
          if (data.gestion_pourboire !== undefined) setGestionPourboire(data.gestion_pourboire);
          if (data.permettre_cc_email_commande !== undefined) setPermettreCCEmailCommande(data.permettre_cc_email_commande);
          if (data.rappel_expedition_auto !== undefined) setRappelExpeditionAuto(data.rappel_expedition_auto);
          if (data.jours_avant_rappel !== undefined) setJoursAvantRappel(data.jours_avant_rappel);
          if (data.jours_max_rappel !== undefined) setJoursMaxRappel(data.jours_max_rappel);
          if (data.permettre_notification_avis !== undefined) setPermettreNotificationAvis(data.permettre_notification_avis);
          if (data.evenement_notification !== undefined) setEvenementNotification(data.evenement_notification);
          if (data.delai_notification !== undefined) setDelaiNotification(data.delai_notification);
          if (data.limite_max_notification !== undefined) setLimiteMaxNotification(data.limite_max_notification);
          if (data.tcs_sur_commandes !== undefined) setTcsSurCommandes(data.tcs_sur_commandes);
          if (data.tds_sur_commandes !== undefined) setTdsSurCommandes(data.tds_sur_commandes);
          if (data.restreindre_expedition_fraude !== undefined) setRestreindreExpeditionFraude(data.restreindre_expedition_fraude);
          if (data.restreindre_voir_commandes_impayees !== undefined) setRestreindreVoirCommandesImpayees(data.restreindre_voir_commandes_impayees);
          
          // Avancé
          if (data.grouping_custom_fields !== undefined) setGroupingCustomFields(data.grouping_custom_fields);
          if (data.google_translation !== undefined) setGoogleTranslation(data.google_translation);
          if (data.translation_panel !== undefined) setTranslationPanel(data.translation_panel);
          if (data.rtl_alignment !== undefined) setRtlAlignment(data.rtl_alignment);
          
          // Commission
          if (data.calcul_commission_base !== undefined) setCalculCommissionBase(data.calcul_commission_base);
          if (data.type_commission_globale !== undefined) setTypeCommissionGlobale(data.type_commission_globale);
          if (data.commission_globale !== undefined) setCommissionGlobale(data.commission_globale);
          if (data.seconde_commission_globale !== undefined) setSecondeCommissionGlobale(data.seconde_commission_globale);
          if (data.type_commission_fixe !== undefined) setTypeCommissionFixe(data.type_commission_fixe);
          if (data.activer_commission_max !== undefined) setActiverCommissionMax(data.activer_commission_max);
          if (data.commission_max !== undefined) setCommissionMax(data.commission_max);
          if (data.baremes_commission !== undefined) setBaremesCommission(data.baremes_commission);
          if (data.commissions_categorie !== undefined) setCommissionsCategorie(data.commissions_categorie);
          if (data.commissions_vendeur !== undefined) setCommissionsVendeur(data.commissions_vendeur);
        }
      } catch (error) {
        console.error('❌ Erreur chargement configuration admin:', error);
        showToast('Erreur lors du chargement de la configuration', 'danger');
      } finally {
        setChargement(false);
      }
    };

    chargerConfiguration();
  }, []);

  // ============================================
  // UPLOAD IMAGE VERS S3
  // ============================================
  const uploadImageToS3 = async (file: File, type: 'banniere' | 'logo'): Promise<string | null> => {
    const setUploading = type === 'banniere' ? setUploadingBanniere : setUploadingLogo;
    const token = localStorage.getItem('token');
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('folder', 'default');
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.url;
      
      console.log(`✅ Image ${type} uploadée vers S3:`, fileUrl);
      showToast(`✅ ${type === 'banniere' ? 'Bannière' : 'Logo'} par défaut uploadé`, 'success');
      
      return fileUrl;
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      showToast('❌ Erreur lors de l\'upload', 'danger');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleBanniereDefautChange = async (file: File) => {
    const url = await uploadImageToS3(file, 'banniere');
    if (url) {
      setBanniereDefautUrl(url);
      marquerModifie();
    }
  };

  const handleBanniereDefautRemove = () => {
    setBanniereDefautUrl(null);
    marquerModifie();
    showToast('✅ Bannière par défaut supprimée', 'success');
  };

  const handleLogoDefautChange = async (file: File) => {
    const url = await uploadImageToS3(file, 'logo');
    if (url) {
      setLogoDefautUrl(url);
      marquerModifie();
    }
  };

  const handleLogoDefautRemove = () => {
    setLogoDefautUrl(null);
    marquerModifie();
    showToast('✅ Logo par défaut supprimé', 'success');
  };

  const toggleCritique = (
    valeur: boolean,
    setter: (v: boolean) => void,
    titrConf: string,
    msgConf: string,
  ) => {
    if (valeur) {
      setModalConfirm({ titre: titrConf, message: msgConf, action: () => { setter(false); marquerModifie(); setModalConfirm(null); } });
    } else {
      setter(true); marquerModifie();
    }
  };

  // ============================================
  // SAUVEGARDE VERS L'API ADMIN
  // ============================================
  const sauvegarder = async () => {
    try {
        const token = localStorage.getItem('token');
        
        // Construire l'objet avec TOUS les paramètres (tous les onglets)
        const configData = {
            // Généralité
            bloquerInscriptionVendeur,
            bloquerInscriptionAcheteur,
            modeMaintenance,
            messageMaintenance,
            stripeActif,
            paypalActif,
            avisActifs,
            notifsAutoVendeurs,
            utiliserPlansVendeur,
            maxProduits,
            nomPlateforme,
            tauxTps,
            tauxTvq,
            noTpsPlateforme,
            noTvqPlateforme,
            shopifyDomain,
            emailContact,
            storeEmail,
            domaine,
            contactNumber,
            currency,
            customCurrencySymbol,
            langue,
            timeZone,
            dateFormat,
            timeFormat,
            footerText,
            banniereActive,
            banniereTitre,
            banniereMessage,
            banniereType,
            banniereVendeurActive,
            banniereVendeurMessage,
            banniereVendeurCouleurBg,
            banniereVendeurCouleurTx,
            banniereVendeurHauteur,
            banniereVendeurPolice,
            banniereAcheteurActive,
            banniereAcheteurMessage,
            banniereAcheteurCouleurBg,
            banniereAcheteurCouleurTx,
            banniereAcheteurHauteur,
            banniereAcheteurPolice,
            banniereLoginActive,
            banniereLoginMessage,
            banniereLoginCouleurBg,
            banniereLoginCouleurTx,
            banniereLoginHauteur,
            banniereLoginPolice,
            banniereDefautUrl,
            logoDefautUrl,
            
            // Configuration vendeur
            permettreExpedition,
            approuverAutoVendeur,
            importerVendeursCSV,
            voirDetailsClient,
            voirEmailClient,
            voirTelephoneClient,
            politiqueVendeur,
            permettreAjoutPersonnel,
            restreindreInscription,
            verificationEmail,
            permettreTags,
            restreindreTagsInscription,
            permettreCategories,
            restreindreCategoriesInscription,
            permettreDevisePropre,
            methodeConversion,
            permettreChangementUnitePoids,
            restreindreDesactivationAvis,
            mettreAJourIdentifiant,
            redirigerVerificationEmail,
            permettreNomBoutiqueInscription,
            approuverAutoAvis,
            permettreGestionAutoApprobationAvis,
            avisAvance,
            ssoActif,
            voirTotalDu,
            notificationStockFaible,
            seuilStockFaible,
            modifierValeurParDefautChamp,
            synchroniserMetaObjet,
            vacancesVendeur,
            vendeurSurBoutique,
            optionInscription,
            shopFaq,
            c2cMarketplace,
            customerCreation,
            customerTag,
            emailNotificationProductQuery,
            minimumPurchaseAmount,
            loginAsSeller,
            checkCustomerLogin,
            checkCustomerPurchase,
            
            // Configuration produits
            approuverAutoProduit,
            desactiverAutoProduit,
            conditionDesactivation,
            importerProduitsCSV,
            permettreAjoutProduit,
            permettreEditionProduit,
            permettreSuppressionProduit,
            commissionParProduit,
            taxesParDefaut,
            afficherCheckboxTaxes,
            modeTaxe,
            destinataireTaxes,
            expeditionRequiseProduitsNormaux,
            skuProduitsNumeriques,
            codeBarreProduitsNumeriques,
            collectionsObligatoires,
            maxCollections,
            assignationProduitsPar,
            affichageNomVendeur,
            utiliserS3,
            editeurDescription,
            sauvegarderBrouillon,
            statutBrouillonCSV,
            creerBrouillonShopify,
            cacherBrouillonAdmin,
            ajouterPrefixeNomProduit,
            remplacerNomParId,
            afficherPolitiqueProduit,
            annuaireProduitsNormaux,
            canauxVente,
            modifierVisibiliteAnciensProduits,
            permettreAjoutHandle,
            permettreAjoutMeta,
            permettreDesactivationProduit,
            mettreAJourNomBoutiqueShopify,
            gererInventaireParDefaut,
            produitNumeriqueCommeService,
            permettreLienProduitNumerique,
            quantiteMinimumAchat,
            applicationQuantiteMinimum,
            prixZeroAutorise,
            texteAideFormulaire,
            delaisLivraison,
            avalaraTaxe,
            codeTaxeParType,
            cacherChampTags,
            supportVideoMedia,
            afficherImageListeProduits,
            synchronisationDouble,
            menuProduitsConnecteur,
            permettreAjoutPrixRevient,
            afficherNomMarque,
            permettreAjoutDocumentsSignature,
            publierTousMarches,
            typePrixLibre,
            prixMinimum,
            datePublicationFuture,
            dateVenteFuture,
            afficherProduitsFuturs,
            syncApprobationMetachamp,
            listeProduitsDesactivesMail,
            gererTaxonomie,
            restreindreCaracteresSpeciaux,
            fraisTransaction,
            typeFraisTransaction,
            porteurFraisTransaction,
            applicationFraisTransaction,
            pourcentageFrais,
            montantFixeFrais,
            typeFraisFixe,
            selectionHeureExpiration,
            paysOrigineProduit,
            texteAlternatifMedia,
            templateAlternatifProduit,
            nomTemplate,
            prixSolde,
            arrondiPrix,
            fraisManutention,
            weightUnit,
            dimensionUnit,
            
            // Configuration commande
            modeExpeditionObligatoire,
            numeroSuiviObligatoire,
            statutPreparationCommande,
            heuresPreparation,
            remboursementExpiration,
            taxesInclusesPrix,
            deduireExpeditionRemboursement,
            deduireTaxesRemboursement,
            taxesSurExpedition,
            permettreEtiquetteExpedition,
            montantEncaisable,
            joursRemboursement,
            calculMontantEncaisable,
            permettreJoursRemboursementVendeur,
            gererRemiseCommande,
            fraisRemise,
            ajouterTVABaliseCommande,
            generationFacture,
            permettreInfosSupplementaires,
            modifierInfosSupplementaires,
            permettreAnnulerExpedition,
            permettreAccepterCommande,
            annulerAutoRejet,
            permettreAnnulerCommandeAcceptee,
            accepterEtExpedier,
            permettreCreationCommande,
            envoyerMailExpedition,
            permettreDateLivraisonPrevue,
            dateLivraisonObligatoire,
            gestionPourboire,
            permettreCCEmailCommande,
            rappelExpeditionAuto,
            joursAvantRappel,
            joursMaxRappel,
            permettreNotificationAvis,
            evenementNotification,
            delaiNotification,
            limiteMaxNotification,
            tcsSurCommandes,
            tdsSurCommandes,
            restreindreExpeditionFraude,
            restreindreVoirCommandesImpayees,
            
            // Avancé
            groupingCustomFields,
            googleTranslation,
            translationPanel,
            rtlAlignment,
            
            // Commission
            calculCommissionBase,
            typeCommissionGlobale,
            commissionGlobale,
            secondeCommissionGlobale,
            typeCommissionFixe,
            activerCommissionMax,
            commissionMax,
            baremesCommission,
            commissionsCategorie,
            commissionsVendeur
        };

        const response = await fetch('/api/admin/configuration', {
            method: 'POST',  // ← POST au lieu de PATCH
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(configData)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Réponse sauvegarde:', data);

        setModifie(false);
        showToast('✅ Configuration sauvegardée avec succès !', 'success');
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showToast('❌ Erreur lors de la sauvegarde', 'danger');
    }
};

  const BANNIERE_COULEURS = {
    info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'ℹ️ Information' },
    warning: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: '⚠️ Avertissement' },
    danger:  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: '🚨 Urgent' },
  };

  // Fonctions pour gérer les commissions
  const ajouterBareme = () => {
    setBaremesCommission([...baremesCommission, { min: '', max: '', type: '% + FIXED', premiereCommission: '', secondeCommission: '' }]);
    marquerModifie();
  };

  const supprimerBareme = (index: number) => {
    const nouveauxBaremes = baremesCommission.filter((_, i) => i !== index);
    setBaremesCommission(nouveauxBaremes);
    marquerModifie();
  };

  const ajouterCommissionCategorie = () => {
    if (nouvelleCategorie.categorieId && nouvelleCategorie.premiereCommission) {
      const categorie = categories.find(c => c.id === parseInt(nouvelleCategorie.categorieId));
      if (categorie) {
        const nouvelle: CommissionCategorie = {
          id: Date.now().toString(),
          categorieId: parseInt(nouvelleCategorie.categorieId),
          categorieNom: categorie.nom,
          type: nouvelleCategorie.type,
          premiereCommission: nouvelleCategorie.premiereCommission,
          secondeCommission: nouvelleCategorie.secondeCommission || undefined
        };
        setCommissionsCategorie([...commissionsCategorie, nouvelle]);
        setNouvelleCategorie({ categorieId: '', type: '%', premiereCommission: '', secondeCommission: '' });
        setAfficherFormulaireCategorie(false);
        marquerModifie();
      }
    }
  };

  const supprimerCommissionCategorie = (id: string) => {
    setCommissionsCategorie(commissionsCategorie.filter(c => c.id !== id));
    marquerModifie();
  };

  const ajouterCommissionVendeur = () => {
    if (nouveauVendeur.gestionnaireId && nouveauVendeur.premiereCommission) {
      const vendeur = vendeurs.find(v => v.id === parseInt(nouveauVendeur.gestionnaireId));
      if (vendeur) {
        const nouveau: CommissionVendeur = {
          id: Date.now().toString(),
          gestionnaireId: parseInt(nouveauVendeur.gestionnaireId),
          vendeurEmail: vendeur.email,
          vendeurBoutique: vendeur.nom_boutique,
          type: nouveauVendeur.type,
          premiereCommission: nouveauVendeur.premiereCommission,
          secondeCommission: nouveauVendeur.secondeCommission || undefined
        };
        setCommissionsVendeur([...commissionsVendeur, nouveau]);
        setNouveauVendeur({ gestionnaireId: '', type: '%', premiereCommission: '', secondeCommission: '' });
        setAfficherFormulaireVendeur(false);
        marquerModifie();
      }
    }
  };

  const supprimerCommissionVendeur = (id: string) => {
    setCommissionsVendeur(commissionsVendeur.filter(v => v.id !== id));
    marquerModifie();
  };

  // Afficher le spinner pendant le chargement
  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  // Rendu de l'onglet Généralité
  const renduGeneralite = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <Section titre="Informations plateforme" icon="🌍">
          <ParamLigne
            label="Nom de votre plateforme"
            description="Nom affiché dans l'interface admin et les communications.">
            <input type="text" value={nomPlateforme}
              onChange={e => { setNomPlateforme(e.target.value); marquerModifie(); }}
              placeholder="e-Vend"
              style={{ ...inputStyle, width: '220px', fontWeight: '700' }} />
          </ParamLigne>

          <ParamLigne
            label="Domaine Shopify"
            description="Domaine technique Shopify (ex: ma-boutique.myshopify.com). Utilisé pour construire les URLs produits.">
            <div>
              <input type="text" value={shopifyDomain}
                onChange={e => { setShopifyDomain(e.target.value.trim()); marquerModifie(); }}
                placeholder="ma-boutique.myshopify.com"
                style={{ ...inputStyle, width: '220px' }} />
              {shopifyDomain && (
                <p style={{ fontSize: '10px', color: T.success, margin: '3px 0 0 0' }}>
                  ✅ URLs produits : https://{shopifyDomain}/products/...
                </p>
              )}
            </div>
          </ParamLigne>

          <ParamLigne
            label="Email de contact officiel"
            description="Adresse email affichée sur le site.">
            <input type="email" value={emailContact}
              onChange={e => { setEmailContact(e.target.value); marquerModifie(); }}
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>

          <ParamLigne
            label="Email de la boutique"
            description="Email utilisé pour les communications de la boutique.">
            <input type="email" value={storeEmail}
              onChange={e => { setStoreEmail(e.target.value); marquerModifie(); }}
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>

          <ParamLigne
            label="Nom de domaine"
            description="Nom de domaine de votre boutique.">
            <input type="text" value={domaine}
              onChange={e => { setDomaine(e.target.value); marquerModifie(); }}
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>

          <ParamLigne
            label="Numéro de contact"
            description="Format international requis.">
            <input type="text" value={contactNumber}
              onChange={e => { setContactNumber(e.target.value); marquerModifie(); }}
              placeholder="+1 234 567 8900"
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>

          <ParamLigne
            label="Devise"
            description="Devise par défaut de la boutique.">
            <select value={currency} onChange={e => { setCurrency(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="CAD">Dollar canadien (CAD)</option>
              <option value="USD">Dollar américain (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Symbole de devise personnalisé"
            description="Symbole personnalisé dans le panneau vendeur.">
            <Toggle actif={customCurrencySymbol} onChange={v => { setCustomCurrencySymbol(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Langue par défaut"
            description="Langue d'interface par défaut.">
            <select value={langue} onChange={e => { setLangue(e.target.value); marquerModifie(); }}
              style={{ ...inputStyle, width: '160px', cursor: 'pointer' }}>
              <option value="fr">🇨🇦 Français (CA)</option>
              <option value="en">🇺🇸 English (EN)</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Fuseau horaire"
            description="Fuseau horaire de votre boutique.">
            <select value={timeZone} onChange={e => { setTimeZone(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '220px' }}>
              <option value="EST">(GMT-05:00) Eastern Time (US & Canada)</option>
              <option value="CST">(GMT-06:00) Central Time</option>
              <option value="MST">(GMT-07:00) Mountain Time</option>
              <option value="PST">(GMT-08:00) Pacific Time</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Format de date"
            description="Format d'affichage des dates.">
            <select value={dateFormat} onChange={e => { setDateFormat(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '160px' }}>
              <option value="DD-MMM-YYYY">DD-MMM-YYYY (15-Mar-2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-03-15)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (15/03/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (03/15/2026)</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Format d'heure"
            description="Format d'affichage des heures.">
            <select value={timeFormat} onChange={e => { setTimeFormat(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '160px' }}>
              <option value="hh:mm A">hh:mm A (02:30 PM)</option>
              <option value="HH:mm">HH:mm (14:30)</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Texte du pied de page"
            description="Texte affiché dans le footer. Utilisez $current_year pour l'année en cours."
            derniere>
            <input type="text" value={footerText}
              onChange={e => { setFooterText(e.target.value); marquerModifie(); }}
              placeholder="Copyright ($current_year) e-Vend Studio, Tous droits réservés"
              style={{ ...inputStyle, width: '280px' }} />
          </ParamLigne>
        </Section>

        <Section titre="Taux de taxes" icon="💰">
          <ParamLigne
            label="Taux TPS (%)"
            description="Taxe fédérale. Utilisé partout sur le site — abonnements Studio, portefeuille publicitaire des commanditaires, etc. Si le gouvernement change ce taux, ajustez-le ici, aucun redéploiement requis.">
            <input type="number" step="0.001" min="0" value={(tauxTps * 100).toString()}
              onChange={e => { setTauxTps((parseFloat(e.target.value) || 0) / 100); marquerModifie(); }}
              placeholder="5"
              style={{ ...inputStyle, width: '120px' }} />
          </ParamLigne>

          <ParamLigne
            label="Taux TVQ (%)"
            description="Taxe de vente du Québec. S'applique aux mêmes transactions que la TPS ci-dessus.">
            <input type="number" step="0.001" min="0" value={(tauxTvq * 100).toString()}
              onChange={e => { setTauxTvq((parseFloat(e.target.value) || 0) / 100); marquerModifie(); }}
              placeholder="9.975"
              style={{ ...inputStyle, width: '120px' }} />
          </ParamLigne>

          <ParamLigne
            label="Numéro de TPS de e-Vend Studio"
            description="Votre numéro d'inscription fédéral. Apparaît sur toutes les factures émises par la plateforme.">
            <input type="text" value={noTpsPlateforme}
              onChange={e => { setNoTpsPlateforme(e.target.value); marquerModifie(); }}
              placeholder="123456789 RT0001"
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>

          <ParamLigne
            label="Numéro de TVQ de e-Vend Studio"
            description="Votre numéro d'inscription au Québec. Apparaît sur toutes les factures émises par la plateforme."
            derniere>
            <input type="text" value={noTvqPlateforme}
              onChange={e => { setNoTvqPlateforme(e.target.value); marquerModifie(); }}
              placeholder="1234567890 TQ0001"
              style={{ ...inputStyle, width: '220px' }} />
          </ParamLigne>
        </Section>

        <Section titre="Accès & Inscriptions" icon="🚪" danger={modeMaintenance || bloquerInscriptionVendeur || bloquerInscriptionAcheteur}>
          <ParamLigne
            label="Bloquer inscriptions vendeurs"
            description="Empêche les nouveaux vendeurs de créer un compte. Le bouton S'inscrire sera masqué sur la page de connexion.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: bloquerInscriptionVendeur ? T.danger : T.success }}>
                {bloquerInscriptionVendeur ? '🔒 Bloqué' : '✓ Ouvert'}
              </span>
              <Toggle actif={bloquerInscriptionVendeur} onChange={() =>
                toggleCritique(bloquerInscriptionVendeur, setBloquerInscriptionVendeur,
                  bloquerInscriptionVendeur ? 'Rouvrir les inscriptions vendeurs' : 'Bloquer les inscriptions vendeurs',
                  bloquerInscriptionVendeur
                    ? "Les vendeurs pourront à nouveau s'inscrire. Confirmez-vous?"
                    : "Les nouveaux vendeurs ne pourront plus s'inscrire. Confirmez-vous?"
                )
              } />
            </div>
          </ParamLigne>

          <ParamLigne
            label="Bloquer inscriptions acheteurs"
            description="Empêche les nouveaux acheteurs de créer un compte. Le bouton S'inscrire sera masqué sur la page de connexion.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: bloquerInscriptionAcheteur ? T.danger : T.success }}>
                {bloquerInscriptionAcheteur ? '🔒 Bloqué' : '✓ Ouvert'}
              </span>
              <Toggle actif={bloquerInscriptionAcheteur} onChange={() =>
                toggleCritique(bloquerInscriptionAcheteur, setBloquerInscriptionAcheteur,
                  bloquerInscriptionAcheteur ? 'Rouvrir les inscriptions acheteurs' : 'Bloquer les inscriptions acheteurs',
                  bloquerInscriptionAcheteur
                    ? "Les acheteurs pourront à nouveau s'inscrire. Confirmez-vous?"
                    : "Les nouveaux acheteurs ne pourront plus s'inscrire. Confirmez-vous?"
                )
              } />
            </div>
          </ParamLigne>

          <ParamLigne
            label="Mode maintenance"
            description="Bloque l'accès à tous les comptes. Un message s'affiche sur la page de connexion.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: modeMaintenance ? T.danger : T.success }}>
                {modeMaintenance ? '🛑 Actif' : '✓ Normal'}
              </span>
              <Toggle actif={modeMaintenance} onChange={() =>
                toggleCritique(modeMaintenance, setModeMaintenance,
                  'Activer le mode maintenance',
                  '⚠️ Le site sera inaccessible pour tous les utilisateurs. Confirmez-vous?'
                )
              } />
            </div>
          </ParamLigne>

          <ParamLigne
            label="Message de maintenance"
            description="Affiché sur la page de connexion quand le mode maintenance est actif."
            derniere>
            <input
              type="text"
              value={messageMaintenance}
              onChange={e => { setMessageMaintenance(e.target.value); marquerModifie(); }}
              placeholder="Site en maintenance. Retour prévu bientôt..."
              style={{ ...inputStyle, width: '280px' }}
            />
          </ParamLigne>

          {modeMaintenance && (
            <div style={{ marginTop: '14px', backgroundColor: '#fff5f5', border: `1px solid #fecdd3`, borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ fontSize: '12px', color: T.danger, fontWeight: '700', margin: '0 0 4px 0' }}>
                🛑 Mode maintenance ACTIF — Le site est actuellement inaccessible au public.
              </p>
              {messageMaintenance && (
                <p style={{ fontSize: '11px', color: T.text, margin: 0 }}>
                  Message affiché : « {messageMaintenance} »
                </p>
              )}
            </div>
          )}
        </Section>

        <Section titre="Méthodes de paiement" icon="💳">
          <ParamLigne
            label="Stripe Connect"
            description="Permet aux vendeurs de recevoir leurs paiements via Stripe.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: stripeActif ? '#635bff' : T.textLight }}>{stripeActif ? '⚡ Actif' : '— Inactif'}</span>
              <Toggle actif={stripeActif} onChange={() =>
                toggleCritique(stripeActif, setStripeActif,
                  'Désactiver Stripe Connect',
                  'Les vendeurs ne recevront plus de virements Stripe. Confirmez-vous?'
                )
              } />
            </div>
          </ParamLigne>
          <ParamLigne
            label="PayPal Platform"
            description="Permet aux vendeurs de recevoir leurs paiements via PayPal."
            derniere>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: paypalActif ? '#003087' : T.textLight }}>{paypalActif ? '🅿 Actif' : '— Inactif'}</span>
              <Toggle actif={paypalActif} onChange={() =>
                toggleCritique(paypalActif, setPaypalActif,
                  'Désactiver PayPal Platform',
                  'Les vendeurs ne recevront plus de virements PayPal. Confirmez-vous?'
                )
              } />
            </div>
          </ParamLigne>
        </Section>

        <Section titre="Fonctionnalités plateforme" icon="⭐">
          <ParamLigne
            label="Avis clients"
            description="Permet aux acheteurs de laisser des avis.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: avisActifs ? T.success : T.textLight }}>{avisActifs ? '✓ Actif' : '— Inactif'}</span>
              <Toggle actif={avisActifs} onChange={v => { setAvisActifs(v); marquerModifie(); }} />
            </div>
          </ParamLigne>
          <ParamLigne
            label="Notifications automatiques vendeurs"
            description="Envoie des emails aux vendeurs pour les nouvelles commandes."
            derniere>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: notifsAutoVendeurs ? T.success : T.textLight }}>{notifsAutoVendeurs ? '🔔 Actif' : '— Inactif'}</span>
              <Toggle actif={notifsAutoVendeurs} onChange={v => { setNotifsAutoVendeurs(v); marquerModifie(); }} />
            </div>
          </ParamLigne>
        </Section>
      </div>

      <div>
        <Section titre="Paramètres financiers" icon="💰">
          <ParamLigne
            label="Utiliser les plans vendeur"
            description="Si activé, les commissions sont gérées par les plans vendeur. L'onglet Commission sera désactivé.">
            <Toggle actif={utiliserPlansVendeur} onChange={v => { setUtiliserPlansVendeur(v); marquerModifie(); }} />
          </ParamLigne>
          
          <ParamLigne
            label="Nombre max de produits par défaut"
            description="Limite appliquée aux vendeurs sans plan."
            derniere>
            <input type="number" value={maxProduits}
              onChange={e => { setMaxProduits(e.target.value); marquerModifie(); }}
              min="1" max="9999"
              style={{ ...inputStyle, width: '100px', textAlign: 'center', fontWeight: '800' }} />
          </ParamLigne>
        </Section>

        <Section titre="Bannière dashboard vendeur" icon="🏪">
          <ParamLigne
            label="Activer la bannière vendeur"
            description="Affiche une bande de message sous la barre du haut dans le dashboard vendeur.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: banniereVendeurActive ? T.success : T.textLight }}>
                {banniereVendeurActive ? '📢 Active' : '— Inactive'}
              </span>
              <Toggle actif={banniereVendeurActive} onChange={v => { setBanniereVendeurActive(v); marquerModifie(); }} />
            </div>
          </ParamLigne>

          {banniereVendeurActive && (
            <>
              <ParamLigne label="Message" description="Texte affiché dans la bannière.">
                <input type="text" value={banniereVendeurMessage}
                  onChange={e => { setBanniereVendeurMessage(e.target.value); marquerModifie(); }}
                  placeholder="Ex : Nouvelle fonctionnalité disponible !"
                  style={{ ...inputStyle, width: '280px' }} />
              </ParamLigne>

              <ParamLigne label="Couleur de fond" description="Couleur de l'arrière-plan de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereVendeurCouleurBg}
                    onChange={e => { setBanniereVendeurCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereVendeurCouleurBg}
                    onChange={e => { setBanniereVendeurCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Couleur du texte" description="Couleur du texte de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereVendeurCouleurTx}
                    onChange={e => { setBanniereVendeurCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereVendeurCouleurTx}
                    onChange={e => { setBanniereVendeurCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Hauteur (px)" description="Hauteur de la bannière en pixels.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereVendeurHauteur} min="20" max="120"
                    onChange={e => { setBanniereVendeurHauteur(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <ParamLigne label="Taille de la police (px)" description="Grosseur du texte dans la bannière." derniere>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereVendeurPolice} min="10" max="72"
                    onChange={e => { setBanniereVendeurPolice(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <div style={{ marginTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>Aperçu :</p>
                <div style={{
                  backgroundColor: banniereVendeurCouleurBg,
                  color: banniereVendeurCouleurTx,
                  height: `${banniereVendeurHauteur}px`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', fontSize: `${banniereVendeurPolice}px`, fontWeight: '600',
                  padding: '0 16px', textAlign: 'center',
                }}>
                  {banniereVendeurMessage || 'Votre message apparaîtra ici'}
                </div>
              </div>
            </>
          )}
        </Section>

        <Section titre="Bannière dashboard acheteur" icon="🛍️">
          <ParamLigne
            label="Activer la bannière acheteur"
            description="Affiche une bande de message sous la barre du haut dans le dashboard acheteur.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: banniereAcheteurActive ? T.success : T.textLight }}>
                {banniereAcheteurActive ? '📢 Active' : '— Inactive'}
              </span>
              <Toggle actif={banniereAcheteurActive} onChange={v => { setBanniereAcheteurActive(v); marquerModifie(); }} />
            </div>
          </ParamLigne>

          {banniereAcheteurActive && (
            <>
              <ParamLigne label="Message" description="Texte affiché dans la bannière.">
                <input type="text" value={banniereAcheteurMessage}
                  onChange={e => { setBanniereAcheteurMessage(e.target.value); marquerModifie(); }}
                  placeholder="Ex : Livraison gratuite ce weekend !"
                  style={{ ...inputStyle, width: '280px' }} />
              </ParamLigne>

              <ParamLigne label="Couleur de fond" description="Couleur de l'arrière-plan de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereAcheteurCouleurBg}
                    onChange={e => { setBanniereAcheteurCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereAcheteurCouleurBg}
                    onChange={e => { setBanniereAcheteurCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Couleur du texte" description="Couleur du texte de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereAcheteurCouleurTx}
                    onChange={e => { setBanniereAcheteurCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereAcheteurCouleurTx}
                    onChange={e => { setBanniereAcheteurCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Hauteur (px)" description="Hauteur de la bannière en pixels.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereAcheteurHauteur} min="20" max="120"
                    onChange={e => { setBanniereAcheteurHauteur(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <ParamLigne label="Taille de la police (px)" description="Grosseur du texte dans la bannière." derniere>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereAcheteurPolice} min="10" max="72"
                    onChange={e => { setBanniereAcheteurPolice(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <div style={{ marginTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>Aperçu :</p>
                <div style={{
                  backgroundColor: banniereAcheteurCouleurBg,
                  color: banniereAcheteurCouleurTx,
                  height: `${banniereAcheteurHauteur}px`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', fontSize: `${banniereAcheteurPolice}px`, fontWeight: '600',
                  padding: '0 16px', textAlign: 'center',
                }}>
                  {banniereAcheteurMessage || 'Votre message apparaîtra ici'}
                </div>
              </div>
            </>
          )}
        </Section>

        <Section titre="Bannière page de connexion" icon="🔐">
          <ParamLigne
            label="Activer la bannière connexion"
            description="Affiche une bande de message en haut de la page de connexion.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: banniereLoginActive ? T.success : T.textLight }}>
                {banniereLoginActive ? '📢 Active' : '— Inactive'}
              </span>
              <Toggle actif={banniereLoginActive} onChange={v => { setBanniereLoginActive(v); marquerModifie(); }} />
            </div>
          </ParamLigne>

          {banniereLoginActive && (
            <>
              <ParamLigne label="Message" description="Texte affiché dans la bannière.">
                <input type="text" value={banniereLoginMessage}
                  onChange={e => { setBanniereLoginMessage(e.target.value); marquerModifie(); }}
                  placeholder="Ex : Bienvenue ! Inscrivez-vous maintenant."
                  style={{ ...inputStyle, width: '280px' }} />
              </ParamLigne>

              <ParamLigne label="Couleur de fond" description="Couleur de l'arrière-plan de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereLoginCouleurBg}
                    onChange={e => { setBanniereLoginCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereLoginCouleurBg}
                    onChange={e => { setBanniereLoginCouleurBg(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Couleur du texte" description="Couleur du texte de la bannière.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={banniereLoginCouleurTx}
                    onChange={e => { setBanniereLoginCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ width: '48px', height: '36px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={banniereLoginCouleurTx}
                    onChange={e => { setBanniereLoginCouleurTx(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
                </div>
              </ParamLigne>

              <ParamLigne label="Hauteur (px)" description="Hauteur de la bannière en pixels.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereLoginHauteur} min="20" max="120"
                    onChange={e => { setBanniereLoginHauteur(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <ParamLigne label="Taille de la police (px)" description="Grosseur du texte dans la bannière." derniere>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={banniereLoginPolice} min="10" max="72"
                    onChange={e => { setBanniereLoginPolice(e.target.value); marquerModifie(); }}
                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: T.textLight }}>px</span>
                </div>
              </ParamLigne>

              <div style={{ marginTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', marginBottom: '6px' }}>Aperçu :</p>
                <div style={{
                  backgroundColor: banniereLoginCouleurBg,
                  color: banniereLoginCouleurTx,
                  height: `${banniereLoginHauteur}px`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', fontSize: `${banniereLoginPolice}px`, fontWeight: '600',
                  padding: '0 16px', textAlign: 'center',
                }}>
                  {banniereLoginMessage || 'Votre message apparaîtra ici'}
                </div>
              </div>
            </>
          )}
        </Section>

        <Section titre="Images par défaut des boutiques vendeurs" icon="🖼️">
          <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 16px 0', lineHeight: '1.5', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
            Ces images seront affichées dans les boutiques publiques des vendeurs qui n'ont pas encore téléchargé leur propre bannière ou logo.
          </p>

          <ImageUploader
            label="Bannière par défaut"
            description="Image affichée en haut des boutiques sans bannière personnalisée. Format recommandé : 1200x300px"
            imageUrl={banniereDefautUrl}
            onImageChange={handleBanniereDefautChange}
            onImageRemove={handleBanniereDefautRemove}
            uploading={uploadingBanniere}
          />

          <ImageUploader
            label="Logo par défaut"
            description="Image affichée pour les boutiques sans logo personnalisé. Format recommandé : 200x200px"
            imageUrl={logoDefautUrl}
            onImageChange={handleLogoDefautChange}
            onImageRemove={handleLogoDefautRemove}
            uploading={uploadingLogo}
          />
        </Section>
      </div>
    </div>
  );

  // Rendu de l'onglet Configuration Vendeur
  const renduConfigurationVendeur = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <Section titre="Paramètres généraux vendeur" icon="👤">
          <ParamLigne
            label="Permettre aux vendeurs d'expédier les commandes"
            description="Les vendeurs gèrent l'expédition de leurs produits.">
            <Toggle actif={permettreExpedition} onChange={v => { setPermettreExpedition(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Approuver automatiquement les vendeurs"
            description="Les nouveaux vendeurs sont automatiquement approuvés.">
            <Toggle actif={approuverAutoVendeur} onChange={v => { setApprouverAutoVendeur(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Ajouter des vendeurs par CSV"
            description="Import de vendeurs en masse via CSV.">
            <Toggle actif={importerVendeursCSV} onChange={v => { setImporterVendeursCSV(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'ajout de personnel"
            description="Les vendeurs peuvent ajouter des membres à leur équipe.">
            <Toggle actif={permettreAjoutPersonnel} onChange={v => { setPermettreAjoutPersonnel(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Restreindre l'inscription des vendeurs"
            description="Empêche l'inscription depuis le panneau vendeur.">
            <Toggle actif={restreindreInscription} onChange={v => { setRestreindreInscription(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Vérification d'email des vendeurs"
            description="Les vendeurs doivent vérifier leur email.">
            <Toggle actif={verificationEmail} onChange={v => { setVerificationEmail(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Rediriger vers nouvelle page pour vérification email"
            description="Page dédiée pour la vérification d'email.">
            <Toggle actif={redirigerVerificationEmail} onChange={v => { setRedirigerVerificationEmail(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre le nom de boutique à l'inscription"
            description="Les vendeurs ajoutent le nom de leur boutique lors de l'inscription.">
            <Toggle actif={permettreNomBoutiqueInscription} onChange={v => { setPermettreNomBoutiqueInscription(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="FAQ de la boutique"
            description="Permet aux vendeurs de voir la FAQ de votre boutique.">
            <Toggle actif={shopFaq} onChange={v => { setShopFaq(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Marketplace C2C"
            description="Convertit les clients en vendeurs avec un bouton sur leur page compte."
            derniere>
            <Toggle actif={c2cMarketplace} onChange={v => { setC2cMarketplace(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Visibilité des informations client" icon="👁️">
          <ParamLigne
            label="Voir les détails des clients"
            description="Les vendeurs voient les informations détaillées des clients.">
            <Toggle actif={voirDetailsClient} onChange={v => { setVoirDetailsClient(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Voir l'email des clients"
            description="Les vendeurs voient l'email des clients.">
            <Toggle actif={voirEmailClient} onChange={v => { setVoirEmailClient(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Voir le téléphone des clients"
            description="Les vendeurs voient le téléphone des clients."
            derniere>
            <Toggle actif={voirTelephoneClient} onChange={v => { setVoirTelephoneClient(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Tags et catégories" icon="🏷️">
          <ParamLigne
            label="Permettre aux vendeurs d'ajouter des tags"
            description="Les vendeurs peuvent ajouter des tags à leur compte.">
            <Toggle actif={permettreTags} onChange={v => { setPermettreTags(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Restreindre l'ajout de tags à l'inscription"
            description="Les vendeurs ne peuvent pas ajouter de tags lors de l'inscription.">
            <Toggle actif={restreindreTagsInscription} onChange={v => { setRestreindreTagsInscription(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre aux vendeurs d'ajouter des catégories"
            description="Les vendeurs peuvent ajouter des catégories à leur compte.">
            <Toggle actif={permettreCategories} onChange={v => { setPermettreCategories(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Restreindre l'ajout de catégories à l'inscription"
            description="Les vendeurs ne peuvent pas ajouter de catégories lors de l'inscription."
            derniere>
            <Toggle actif={restreindreCategoriesInscription} onChange={v => { setRestreindreCategoriesInscription(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>
      </div>

      <div>
        <Section titre="Devises et finances" icon="💱">
          <ParamLigne
            label="Permettre aux vendeurs d'utiliser leur propre devise"
            description="Les vendeurs peuvent fixer les prix dans leur devise locale.">
            <Toggle actif={permettreDevisePropre} onChange={v => { setPermettreDevisePropre(v); marquerModifie(); }} />
          </ParamLigne>

          {permettreDevisePropre && (
            <ParamLigne
              label="Méthode de conversion des devises"
              description="Comment les devises sont converties.">
              <select value={methodeConversion} onChange={e => { setMethodeConversion(e.target.value); marquerModifie(); }}
                style={{ ...selectStyle, width: '200px' }}>
                <option value="automatique">Conversion automatique</option>
                <option value="manuelle">Conversion manuelle</option>
              </select>
            </ParamLigne>
          )}

          <ParamLigne
            label="Permettre le changement d'unité de poids"
            description="Les vendeurs peuvent modifier l'unité de poids des produits.">
            <Toggle actif={permettreChangementUnitePoids} onChange={v => { setPermettreChangementUnitePoids(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Voir le total dû (gains du vendeur)"
            description="Affiche les gains du vendeur sur son tableau de bord.">
            <Toggle actif={voirTotalDu} onChange={v => { setVoirTotalDu(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Mettre à jour l'identifiant du vendeur"
            description="Permet de mettre à jour l'identifiant unique du vendeur.">
            <Toggle actif={mettreAJourIdentifiant} onChange={v => { setMettreAJourIdentifiant(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Montant minimum de commande"
            description="Permet aux vendeurs de fixer un montant minimum pour les commandes."
            derniere>
            <Toggle actif={minimumPurchaseAmount} onChange={v => { setMinimumPurchaseAmount(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Gestion des avis" icon="⭐">
          <ParamLigne
            label="Restreindre la désactivation des avis"
            description="Empêche les vendeurs de masquer les avis.">
            <Toggle actif={restreindreDesactivationAvis} onChange={v => { setRestreindreDesactivationAvis(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Approuver automatiquement les avis"
            description="Tous les avis sont automatiquement approuvés.">
            <Toggle actif={approuverAutoAvis} onChange={v => { setApprouverAutoAvis(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre la gestion de l'auto-approbation"
            description="Les vendeurs peuvent activer l'approbation automatique.">
            <Toggle actif={permettreGestionAutoApprobationAvis} onChange={v => { setPermettreGestionAutoApprobationAvis(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Avis avancé"
            description="Active les fonctionnalités avancées pour les avis.">
            <Toggle actif={avisAvance} onChange={v => { setAvisAvance(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Vérifier connexion client avant feedback"
            description="Le client doit être connecté pour laisser un avis.">
            <Toggle actif={checkCustomerLogin} onChange={v => { setCheckCustomerLogin(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Vérifier achat avant feedback"
            description="Le client doit avoir acheté au moins un produit du vendeur."
            derniere>
            <Toggle actif={checkCustomerPurchase} onChange={v => { setCheckCustomerPurchase(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Paramètres avancés" icon="⚙️">
          <ParamLigne
            label="SSO pour vendeurs"
            description="Active l'authentification unique (Single Sign-On).">
            <Toggle actif={ssoActif} onChange={v => { setSsoActif(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Notification de stock faible"
            description="Envoie un email aux vendeurs quand le stock est faible.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle actif={notificationStockFaible} onChange={v => { setNotificationStockFaible(v); marquerModifie(); }} />
            </div>
          </ParamLigne>

          {notificationStockFaible && (
            <ParamLigne
              label="Seuil de stock faible"
              description="Nombre de produits déclenchant l'alerte.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={seuilStockFaible}
                  onChange={e => { setSeuilStockFaible(e.target.value); marquerModifie(); }}
                  min="0" max="9999"
                  style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                <span style={{ fontSize: '12px', color: T.textLight }}>unités</span>
              </div>
            </ParamLigne>
          )}

          <ParamLigne
            label="Email notification pour requêtes produits"
            description="L'admin reçoit un email quand un client pose une question sur un produit vendeur.">
            <Toggle actif={emailNotificationProductQuery} onChange={v => { setEmailNotificationProductQuery(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Se connecter en tant que vendeur"
            description="Permet d'accéder au tableau de bord du vendeur depuis la liste.">
            <Toggle actif={loginAsSeller} onChange={v => { setLoginAsSeller(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Modifier les valeurs par défaut des champs"
            description="Les vendeurs peuvent modifier les valeurs par défaut des champs personnalisés.">
            <Toggle actif={modifierValeurParDefautChamp} onChange={v => { setModifierValeurParDefautChamp(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Synchroniser les données vendeur dans Metaobject"
            description="Synchronise les données des vendeurs dans les metaobjets Shopify.">
            <Toggle actif={synchroniserMetaObjet} onChange={v => { setSynchroniserMetaObjet(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Vacances du vendeur"
            description="Permet aux vendeurs de mettre leurs produits en pause pendant les vacances.">
            <Toggle actif={vacancesVendeur} onChange={v => { setVacancesVendeur(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Vendeur sur la boutique"
            description="Permet aux vendeurs de s'inscrire via l'application Multivendor Marketplace.">
            <Toggle actif={vendeurSurBoutique} onChange={v => { setVendeurSurBoutique(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Option d'inscription vendeur"
            description="Méthode d'inscription autorisée pour les vendeurs.">
            <select value={optionInscription} onChange={e => { setOptionInscription(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="email">Email uniquement</option>
              <option value="telephone">Téléphone uniquement</option>
              <option value="email_telephone">Email et téléphone</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Création de client"
            description="Quand créer un compte client pour les vendeurs.">
            <select value={customerCreation} onChange={e => { setCustomerCreation(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="signup">Au moment de l'inscription</option>
              <option value="approval">Au moment de l'approbation</option>
              <option value="none">Ne pas créer</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Tag client"
            description="Tag à ajouter aux clients convertis en vendeurs."
            derniere>
            <input type="text" value={customerTag}
              onChange={e => { setCustomerTag(e.target.value); marquerModifie(); }}
              placeholder="Acheteur devenu vendeur"
              style={{ ...inputStyle, width: '200px' }} />
          </ParamLigne>
        </Section>

        <Section titre="Politique vendeur" icon="📜">
          <ParamLigne
            label="Politique vendeur par défaut"
            description="Politique appliquée aux nouveaux vendeurs."
            derniere>
            <select value={politiqueVendeur} onChange={e => { setPolitiqueVendeur(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '200px' }}>
              <option value="normale">Politique normale</option>
              <option value="avancee">Politique avancée</option>
            </select>
          </ParamLigne>
        </Section>
      </div>
    </div>
  );

  // Rendu de l'onglet Configuration Produits
  const renduConfigurationProduits = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <Section titre="Gestion générale des produits" icon="📦">
          <ParamLigne
            label="Approuver automatiquement les produits"
            description="Approuve automatiquement tous les nouveaux produits.">
            <Toggle actif={approuverAutoProduit} onChange={v => { setApprouverAutoProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Désactiver automatiquement les produits"
            description="Désactive automatiquement les produits selon certaines conditions.">
            <Toggle actif={desactiverAutoProduit} onChange={v => { setDesactiverAutoProduit(v); marquerModifie(); }} />
          </ParamLigne>

          {desactiverAutoProduit && (
            <ParamLigne
              label="Condition de désactivation"
              description="Condition pour désactiver automatiquement les produits.">
              <input type="text" value={conditionDesactivation}
                onChange={e => { setConditionDesactivation(e.target.value); marquerModifie(); }}
                placeholder="Ex: stock = 0"
                style={{ ...inputStyle, width: '200px' }} />
            </ParamLigne>
          )}

          <ParamLigne
            label="Ajouter des produits par CSV"
            description="Import de produits en masse via CSV.">
            <Toggle actif={importerProduitsCSV} onChange={v => { setImporterProduitsCSV(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre aux vendeurs d'ajouter des produits"
            description="Les vendeurs peuvent ajouter des produits.">
            <Toggle actif={permettreAjoutProduit} onChange={v => { setPermettreAjoutProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre aux vendeurs de modifier les produits"
            description="Les vendeurs peuvent modifier les produits.">
            <Toggle actif={permettreEditionProduit} onChange={v => { setPermettreEditionProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre aux vendeurs de supprimer les produits"
            description="Les vendeurs peuvent supprimer des produits."
            derniere>
            <Toggle actif={permettreSuppressionProduit} onChange={v => { setPermettreSuppressionProduit(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Configuration des produits" icon="⚙️">
          <ParamLigne
            label="Collections obligatoires"
            description="Rend les collections obligatoires.">
            <Toggle actif={collectionsObligatoires} onChange={v => { setCollectionsObligatoires(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Nombre maximum de collections par produit"
            description="Limite du nombre de collections.">
            <input type="number" value={maxCollections}
              onChange={e => { setMaxCollections(e.target.value); marquerModifie(); }}
              min="1" max="100"
              style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
          </ParamLigne>

          <ParamLigne
            label="Assigner les produits par"
            description="Méthode d'assignation des produits aux vendeurs.">
            <select value={assignationProduitsPar} onChange={e => { setAssignationProduitsPar(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="email">Email du vendeur</option>
              <option value="boutique">Nom de la boutique</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Afficher sur la liste des produits"
            description="Affiche le nom du vendeur ou de la boutique.">
            <select value={affichageNomVendeur} onChange={e => { setAffichageNomVendeur(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="nom">Nom du vendeur</option>
              <option value="boutique">Nom de la boutique</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Utiliser Amazon S3 pour les produits numériques"
            description="Utilise vos identifiants S3 pour télécharger les produits.">
            <Toggle actif={utiliserS3} onChange={v => { setUtiliserS3(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Éditeur de description"
            description="Type d'éditeur pour la description.">
            <select value={editeurDescription} onChange={e => { setEditeurDescription(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="tinymce">TinyMCE Editor</option>
              <option value="texte">Zone de texte simple</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Texte d'aide du formulaire produit"
            description="Active le texte d'aide sur le formulaire.">
            <Toggle actif={texteAideFormulaire} onChange={v => { setTexteAideFormulaire(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Délais de livraison"
            description="Ajoute un champ pour les délais de livraison.">
            <Toggle actif={delaisLivraison} onChange={v => { setDelaisLivraison(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Pays d'origine du produit"
            description="Permet d'ajouter le pays d'origine."
            derniere>
            <Toggle actif={paysOrigineProduit} onChange={v => { setPaysOrigineProduit(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Gestion des brouillons" icon="📝">
          <ParamLigne
            label="Sauvegarder le produit comme brouillon"
            description="Ajoute l'option de sauvegarder les produits comme brouillons.">
            <Toggle actif={sauvegarderBrouillon} onChange={v => { setSauvegarderBrouillon(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Statut brouillon pour les imports CSV"
            description="Définit le statut des produits importés par CSV comme 'Brouillon'.">
            <Toggle actif={statutBrouillonCSV} onChange={v => { setStatutBrouillonCSV(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Créer un brouillon sur Shopify"
            description="Crée un brouillon du produit sur Shopify également.">
            <Toggle actif={creerBrouillonShopify} onChange={v => { setCreerBrouillonShopify(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Cacher les brouillons côté admin"
            description="Masque les produits en brouillon dans l'interface admin."
            derniere>
            <Toggle actif={cacherBrouillonAdmin} onChange={v => { setCacherBrouillonAdmin(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Taxes et frais" icon="💰">
          <ParamLigne
            label="Mode de taxation des annonces"
            description="Contrôle comment la taxe est appliquée sur les nouvelles annonces créées par les vendeurs.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
              {(
                [
                  {
                    val: 'libre' as const,
                    label: '🔓 Libre — le vendeur choisit',
                    desc: 'La checkbox est visible et modifiable.',
                  },
                  {
                    val: 'force_taxable' as const,
                    label: '✅ Forcer taxable — toujours coché',
                    desc: 'Checkbox cochée et verrouillée pour tous.',
                  },
                  {
                    val: 'force_non_taxable' as const,
                    label: '🚫 Forcer non-taxable — toujours décoché',
                    desc: 'Checkbox désactivée et non cliquable pour tous.',
                  },
                ] as const
              ).map(opt => (
                <label
                  key={opt.val}
                  onClick={() => { setModeTaxe(opt.val); marquerModifie(); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${modeTaxe === opt.val ? T.accent : T.border}`,
                    backgroundColor: modeTaxe === opt.val ? T.accentLight : '#f8fafc',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    border: `2px solid ${modeTaxe === opt.val ? T.accent : '#9ca3af'}`,
                    backgroundColor: modeTaxe === opt.val ? T.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {modeTaxe === opt.val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: '0 0 2px 0' }}>{opt.label}</p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </ParamLigne>

          {/* Aperçu du comportement selon le mode choisi */}
          <div style={{
            backgroundColor: modeTaxe === 'libre' ? '#f0f9ff' : modeTaxe === 'force_taxable' ? '#f0fdf4' : '#fff5f5',
            border: `1px solid ${modeTaxe === 'libre' ? '#bae6fd' : modeTaxe === 'force_taxable' ? '#bbf7d0' : '#fecdd3'}`,
            borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: '0 0 4px 0' }}>
              {modeTaxe === 'libre' && '📝 Comportement actuel : le vendeur voit la checkbox et peut cocher ou décocher librement.'}
              {modeTaxe === 'force_taxable' && '✅ Comportement actuel : toutes les nouvelles annonces seront automatiquement taxables. La checkbox sera cochée et verrouillée.'}
              {modeTaxe === 'force_non_taxable' && '🚫 Comportement actuel : toutes les nouvelles annonces seront non-taxables. La checkbox sera désactivée et grisée.'}
            </p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
              Ce paramètre est transmis à Shopify via le champ <code>taxable</code> lors de la création du produit.
            </p>
          </div>

          <ParamLigne
            label="Destinataire des taxes perçues"
            description="Détermine à qui sont versées les taxes collectées sur les ventes taxables.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px' }}>
              {(
                [
                  {
                    val: 'admin' as const,
                    label: '🏢 Admin — les taxes vont à la plateforme',
                    desc: 'Les taxes perçues sont conservées par l\'administrateur.',
                  },
                  {
                    val: 'vendeur' as const,
                    label: '🧑‍💼 Vendeur — les taxes sont versées au vendeur',
                    desc: 'Les taxes collectées sont reversées au vendeur concerné.',
                  },
                ] as const
              ).map(opt => (
                <label
                  key={opt.val}
                  onClick={() => { setDestinataireTaxes(opt.val); marquerModifie(); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${destinataireTaxes === opt.val ? T.accent : T.border}`,
                    backgroundColor: destinataireTaxes === opt.val ? T.accentLight : '#f8fafc',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    border: `2px solid ${destinataireTaxes === opt.val ? T.accent : '#9ca3af'}`,
                    backgroundColor: destinataireTaxes === opt.val ? T.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {destinataireTaxes === opt.val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: '0 0 2px 0' }}>{opt.label}</p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
              <div style={{
                backgroundColor: destinataireTaxes === 'admin' ? '#f0f9ff' : '#fefce8',
                border: `1px solid ${destinataireTaxes === 'admin' ? '#bae6fd' : '#fde68a'}`,
                borderRadius: '8px', padding: '10px 12px', marginTop: '4px',
              }}>
                <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                  {destinataireTaxes === 'admin'
                    ? '💡 Les taxes ne font pas partie du montant reversé au vendeur. Elles restent dans les fonds de la plateforme.'
                    : '💡 Les taxes sont incluses dans le versement au vendeur. Assurez-vous que vos contrats vendeurs le prévoient.'}
                </p>
              </div>
            </div>
          </ParamLigne>

          <ParamLigne
            label="Avalara AvaTax"
            description="Ajoute les codes de taxe Avalara aux produits.">
            <Toggle actif={avalaraTaxe} onChange={v => { setAvalaraTaxe(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Code de taxe par type de produit"
            description="Ajoute un code de taxe basé sur le type de produit.">
            <Toggle actif={codeTaxeParType} onChange={v => { setCodeTaxeParType(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Commission par produit"
            description="Permet d'ajouter une commission spécifique à un produit.">
            <Toggle actif={commissionParProduit} onChange={v => { setCommissionParProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Frais de transaction"
            description="Gère les frais de transaction sur les commandes.">
            <Toggle actif={fraisTransaction} onChange={v => { setFraisTransaction(v); marquerModifie(); }} />
          </ParamLigne>

          {fraisTransaction && (
            <>
              <ParamLigne
                label="Type de frais de transaction"
                description="Type de frais à appliquer.">
                <select value={typeFraisTransaction} onChange={e => { setTypeFraisTransaction(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="normal">Normal</option>
                  <option value="pourcentage">Pourcentage</option>
                  <option value="fixe">Fixe</option>
                </select>
              </ParamLigne>

              <ParamLigne
                label="Frais supportés par"
                description="Qui supporte les frais de transaction.">
                <select value={porteurFraisTransaction} onChange={e => { setPorteurFraisTransaction(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="admin">Admin</option>
                  <option value="vendeur">Vendeur</option>
                </select>
              </ParamLigne>

              <ParamLigne
                label="Application des frais"
                description="Comment les frais sont appliqués.">
                <select value={applicationFraisTransaction} onChange={e => { setApplicationFraisTransaction(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="commande">Par commande</option>
                  <option value="produit">Par produit</option>
                </select>
              </ParamLigne>

              <ParamLigne
                label="Pourcentage de frais"
                description="Pourcentage à appliquer.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={pourcentageFrais}
                    onChange={e => { setPourcentageFrais(e.target.value); marquerModifie(); }}
                    step="0.01" min="0" max="100"
                    style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                  <span>%</span>
                </div>
              </ParamLigne>

              <ParamLigne
                label="Montant fixe"
                description="Montant fixe à appliquer.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>$</span>
                  <input type="number" value={montantFixeFrais}
                    onChange={e => { setMontantFixeFrais(e.target.value); marquerModifie(); }}
                    step="0.01" min="0"
                    style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                </div>
              </ParamLigne>

              <ParamLigne
                label="Type de frais fixe"
                description="Comment le montant fixe est appliqué."
                derniere>
                <select value={typeFraisFixe} onChange={e => { setTypeFraisFixe(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="commande">Par commande</option>
                  <option value="produit">Par produit</option>
                </select>
              </ParamLigne>
            </>
          )}

          <ParamLigne
            label="Frais de manutention"
            description="Ajoute des frais de manutention au prix de base."
            derniere>
            <Toggle actif={fraisManutention} onChange={v => { setFraisManutention(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>
      </div>

      <div>
        <Section titre="Produits numériques" icon="💾">
          <ParamLigne
            label="SKU pour produits numériques"
            description="Active la gestion des SKU pour les produits numériques.">
            <Toggle actif={skuProduitsNumeriques} onChange={v => { setSkuProduitsNumeriques(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Code-barres pour produits numériques"
            description="Active la gestion des codes-barres pour les produits numériques.">
            <Toggle actif={codeBarreProduitsNumeriques} onChange={v => { setCodeBarreProduitsNumeriques(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Produit numérique comme service"
            description="Définit les produits numériques comme des services.">
            <Toggle actif={produitNumeriqueCommeService} onChange={v => { setProduitNumeriqueCommeService(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre un lien pour produit numérique"
            description="Ajoute un champ pour un lien vers le produit numérique."
            derniere>
            <Toggle actif={permettreLienProduitNumerique} onChange={v => { setPermettreLienProduitNumerique(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Visibilité et publication" icon="👁️">
          <ParamLigne
            label="Annuaire des produits normaux"
            description="Active le listing d'annuaire pour les produits normaux.">
            <Toggle actif={annuaireProduitsNormaux} onChange={v => { setAnnuaireProduitsNormaux(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Canaux de vente"
            description="Définit la visibilité des produits sur différents canaux.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input type="checkbox" checked={canauxVente.boutiqueEnLigne}
                  onChange={e => setCanauxVente({...canauxVente, boutiqueEnLigne: e.target.checked})} />
                Boutique en ligne
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input type="checkbox" checked={canauxVente.pointsVente}
                  onChange={e => setCanauxVente({...canauxVente, pointsVente: e.target.checked})} />
                Points de vente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input type="checkbox" checked={canauxVente.canauxSociaux}
                  onChange={e => setCanauxVente({...canauxVente, canauxSociaux: e.target.checked})} />
                Canaux sociaux
              </label>
            </div>
          </ParamLigne>

          <ParamLigne
            label="Modifier la visibilité des anciens produits"
            description="Applique les nouveaux paramètres à tous les anciens produits.">
            <Toggle actif={modifierVisibiliteAnciensProduits} onChange={v => { setModifierVisibiliteAnciensProduits(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Publier sur tous les marchés"
            description="Permet de publier/dépublier sur tous les marchés Shopify.">
            <Toggle actif={publierTousMarches} onChange={v => { setPublierTousMarches(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Date de publication future"
            description="Permet de définir une date de publication future.">
            <Toggle actif={datePublicationFuture} onChange={v => { setDatePublicationFuture(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Date de vente future"
            description="Permet de définir une date de vente future.">
            <Toggle actif={dateVenteFuture} onChange={v => { setDateVenteFuture(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Afficher les produits futurs"
            description="Affiche les produits à vente future sur le profil du vendeur."
            derniere>
            <Toggle actif={afficherProduitsFuturs} onChange={v => { setAfficherProduitsFuturs(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Unités et dimensions" icon="📏">
          <ParamLigne
            label="Unité de poids"
            description="Unité de mesure pour le poids des produits. Si modifié, mettez à jour manuellement les produits existants.">
            <select value={weightUnit} onChange={e => { setWeightUnit(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="lb">Pound (lb)</option>
              <option value="oz">Ounce (oz)</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Unité de dimension"
            description="Unité de mesure pour les dimensions des produits. Si modifié, mettez à jour manuellement les produits existants."
            derniere>
            <select value={dimensionUnit} onChange={e => { setDimensionUnit(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="cm">Centimeter (cm)</option>
              <option value="m">Meter (m)</option>
              <option value="in">Inch (in)</option>
              <option value="ft">Foot (ft)</option>
            </select>
          </ParamLigne>
        </Section>

        <Section titre="Champs et métadonnées" icon="🏷️">
          <ParamLigne
            label="Ajouter un préfixe au nom du produit"
            description="Ajoute un préfixe au nom du produit sur la boutique.">
            <Toggle actif={ajouterPrefixeNomProduit} onChange={v => { setAjouterPrefixeNomProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Remplacer le nom par l'ID"
            description="Remplace le nom du produit par son ID dans le titre.">
            <Toggle actif={remplacerNomParId} onChange={v => { setRemplacerNomParId(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Afficher la politique produit"
            description="Affiche la politique produit sur la page de description.">
            <Toggle actif={afficherPolitiqueProduit} onChange={v => { setAfficherPolitiqueProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'ajout d'handle produit"
            description="Les vendeurs peuvent ajouter un handle personnalisé.">
            <Toggle actif={permettreAjoutHandle} onChange={v => { setPermettreAjoutHandle(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'ajout de métadonnées"
            description="Les vendeurs peuvent ajouter des meta titres et descriptions.">
            <Toggle actif={permettreAjoutMeta} onChange={v => { setPermettreAjoutMeta(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Afficher le nom de la marque"
            description="Affiche le nom de la marque sur la page produit.">
            <Toggle actif={afficherNomMarque} onChange={v => { setAfficherNomMarque(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'ajout de prix de revient"
            description="Les vendeurs peuvent ajouter un prix de revient.">
            <Toggle actif={permettreAjoutPrixRevient} onChange={v => { setPermettreAjoutPrixRevient(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'ajout de documents signés"
            description="Ajoute la possibilité d'ajouter des documents signés.">
            <Toggle actif={permettreAjoutDocumentsSignature} onChange={v => { setPermettreAjoutDocumentsSignature(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Texte alternatif des médias par défaut"
            description="Définit le texte alternatif avec le nom du média par défaut.">
            <Toggle actif={texteAlternatifMedia} onChange={v => { setTexteAlternatifMedia(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Afficher l'image dans la liste des produits"
            description="Affiche le champ d'image dans la liste des produits.">
            <Toggle actif={afficherImageListeProduits} onChange={v => { setAfficherImageListeProduits(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Restreindre les caractères spéciaux"
            description="Limite les noms aux lettres, chiffres, espaces et tirets."
            derniere>
            <Toggle actif={restreindreCaracteresSpeciaux} onChange={v => { setRestreindreCaracteresSpeciaux(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Paramètres avancés" icon="🔧">
          <ParamLigne
            label="Expédition requise pour produits normaux"
            description="Définit si les produits normaux nécessitent une expédition par défaut.">
            <Toggle actif={expeditionRequiseProduitsNormaux} onChange={v => { setExpeditionRequiseProduitsNormaux(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre la désactivation du produit"
            description="Les vendeurs peuvent désactiver leurs produits.">
            <Toggle actif={permettreDesactivationProduit} onChange={v => { setPermettreDesactivationProduit(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Mettre à jour le nom de la boutique sur Shopify"
            description="Met à jour le nom de la boutique sur Shopify lors de la création/modification.">
            <Toggle actif={mettreAJourNomBoutiqueShopify} onChange={v => { setMettreAJourNomBoutiqueShopify(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Gérer l'inventaire par défaut"
            description="Option par défaut pour le suivi de l'inventaire.">
            <Toggle actif={gererInventaireParDefaut} onChange={v => { setGererInventaireParDefaut(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Quantité minimum d'achat"
            description="Permet de définir une quantité minimum d'achat par produit.">
            <Toggle actif={quantiteMinimumAchat} onChange={v => { setQuantiteMinimumAchat(v); marquerModifie(); }} />
          </ParamLigne>

          {quantiteMinimumAchat && (
            <ParamLigne
              label="Appliquer la quantité minimum"
              description="Applique au niveau du produit ou des variantes.">
              <select value={applicationQuantiteMinimum} onChange={e => { setApplicationQuantiteMinimum(e.target.value); marquerModifie(); }}
                style={{ ...selectStyle, width: '180px' }}>
                <option value="produit">Produit</option>
                <option value="variantes">Variantes</option>
              </select>
            </ParamLigne>
          )}

          <ParamLigne
            label="Prix zéro autorisé"
            description="Permet de créer des produits gratuits.">
            <Toggle actif={prixZeroAutorise} onChange={v => { setPrixZeroAutorise(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Type de prix libre"
            description="Active l'option de prix libre (Pay What You Want).">
            <Toggle actif={typePrixLibre} onChange={v => { setTypePrixLibre(v); marquerModifie(); }} />
          </ParamLigne>

          {typePrixLibre && (
            <ParamLigne
              label="Prix minimum"
              description="Prix minimum pour les produits à prix libre.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>$</span>
                <input type="number" value={prixMinimum}
                  onChange={e => { setPrixMinimum(e.target.value); marquerModifie(); }}
                  step="0.01" min="0"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </div>
            </ParamLigne>
          )}

          <ParamLigne
            label="Prix soldé"
            description="Active la gestion des prix soldés.">
            <Toggle actif={prixSolde} onChange={v => { setPrixSolde(v); marquerModifie(); }} />
          </ParamLigne>

          {prixSolde && (
            <ParamLigne
              label="Arrondi du prix de vente"
              description="Nombre de chiffres après la virgule.">
              <select value={arrondiPrix} onChange={e => { setArrondiPrix(e.target.value); marquerModifie(); }}
                style={{ ...selectStyle, width: '180px' }}>
                <option value="0">0 chiffre</option>
                <option value="1">1 chiffre</option>
                <option value="2">2 chiffres</option>
              </select>
            </ParamLigne>
          )}

          <ParamLigne
            label="Cacher le champ des tags"
            description="Masque le champ des tags dans le formulaire.">
            <Toggle actif={cacherChampTags} onChange={v => { setCacherChampTags(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Support vidéo dans les médias"
            description="Permet d'ajouter des vidéos (ne peut pas être désactivé ensuite).">
            <Toggle actif={supportVideoMedia} onChange={v => { setSupportVideoMedia(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Synchronisation double"
            description="Synchronise les détails des produits modifiés depuis Shopify.">
            <Toggle actif={synchronisationDouble} onChange={v => { setSynchronisationDouble(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Menu des produits connecteurs"
            description="Affiche le menu 'Tous les produits importés par connecteur'.">
            <Toggle actif={menuProduitsConnecteur} onChange={v => { setMenuProduitsConnecteur(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Synchroniser l'approbation dans Metachamp"
            description="Synchronise l'horodatage d'approbation dans les metachamps Shopify.">
            <Toggle actif={syncApprobationMetachamp} onChange={v => { setSyncApprobationMetachamp(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Liste des produits désactivés par email"
            description="Envoie un email quotidien à l'admin concernant les produits désactivés.">
            <Toggle actif={listeProduitsDesactivesMail} onChange={v => { setListeProduitsDesactivesMail(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Gérer la taxonomie des produits"
            description="Active la gestion de la catégorie de taxonomie.">
            <Toggle actif={gererTaxonomie} onChange={v => { setGererTaxonomie(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Sélection de l'heure d'expiration"
            description="Fournit des créneaux horaires pour la date d'expiration.">
            <Toggle actif={selectionHeureExpiration} onChange={v => { setSelectionHeureExpiration(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Template alternatif pour produit"
            description="Permet de sélectionner un fichier de template alternatif.">
            <Toggle actif={templateAlternatifProduit} onChange={v => { setTemplateAlternatifProduit(v); marquerModifie(); }} />
          </ParamLigne>

          {templateAlternatifProduit && (
            <ParamLigne
              label="Nom du template"
              description="Nom du template à utiliser."
              derniere>
              <input type="text" value={nomTemplate}
                onChange={e => { setNomTemplate(e.target.value); marquerModifie(); }}
                placeholder="product.nom-template"
                style={{ ...inputStyle, width: '200px' }} />
            </ParamLigne>
          )}
        </Section>
      </div>
    </div>
  );

  // Rendu de l'onglet Configuration Commande
  const renduConfigurationCommande = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <Section titre="Gestion des commandes" icon="📋">
          <ParamLigne
            label="Mode d'expédition obligatoire"
            description="Rend obligatoire la sélection d'un mode d'expédition.">
            <Toggle actif={modeExpeditionObligatoire} onChange={v => { setModeExpeditionObligatoire(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Numéro de suivi obligatoire"
            description="Rend obligatoire l'ajout d'un numéro de suivi.">
            <Toggle actif={numeroSuiviObligatoire} onChange={v => { setNumeroSuiviObligatoire(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Statut de préparation de commande"
            description="Permet de suivre la préparation des commandes avant expédition.">
            <Toggle actif={statutPreparationCommande} onChange={v => { setStatutPreparationCommande(v); marquerModifie(); }} />
          </ParamLigne>

          {statutPreparationCommande && (
            <>
              <ParamLigne
                label="Heures de préparation"
                description="Nombre d'heures accordées (0 = illimité).">
                <input type="number" value={heuresPreparation}
                  onChange={e => { setHeuresPreparation(e.target.value); marquerModifie(); }}
                  min="0"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>

              <ParamLigne
                label="Remboursement à expiration"
                description="Rembourse automatiquement si délai dépassé."
                derniere>
                <Toggle actif={remboursementExpiration} onChange={v => { setRemboursementExpiration(v); marquerModifie(); }} />
              </ParamLigne>
            </>
          )}

          <ParamLigne
            label="Permettre aux vendeurs d'accepter les commandes"
            description="Les vendeurs doivent accepter les commandes avant traitement.">
            <Toggle actif={permettreAccepterCommande} onChange={v => { setPermettreAccepterCommande(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Annulation automatique sur rejet"
            description="Annule automatiquement la commande si le vendeur la rejette.">
            <Toggle actif={annulerAutoRejet} onChange={v => { setAnnulerAutoRejet(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'annulation des commandes acceptées"
            description="Permet d'annuler une commande même après acceptation si non expédiée.">
            <Toggle actif={permettreAnnulerCommandeAcceptee} onChange={v => { setPermettreAnnulerCommandeAcceptee(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Accepter et expédier"
            description="Permet d'accepter et d'expédier en une seule étape.">
            <Toggle actif={accepterEtExpedier} onChange={v => { setAccepterEtExpedier(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre la création de commandes"
            description="Les vendeurs peuvent créer des commandes pour le compte des clients."
            derniere>
            <Toggle actif={permettreCreationCommande} onChange={v => { setPermettreCreationCommande(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Remboursements et délais" icon="💰">
          <ParamLigne
            label="Déduire l'expédition des gains sur remboursement"
            description="Déduit les frais d'expédition des gains du vendeur en cas de remboursement.">
            <Toggle actif={deduireExpeditionRemboursement} onChange={v => { setDeduireExpeditionRemboursement(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Déduire les taxes des gains sur remboursement"
            description="Déduit les taxes des gains du vendeur en cas de remboursement.">
            <Toggle actif={deduireTaxesRemboursement} onChange={v => { setDeduireTaxesRemboursement(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Taxes sur l'expédition"
            description="Calcule automatiquement les taxes sur l'expédition.">
            <Toggle actif={taxesSurExpedition} onChange={v => { setTaxesSurExpedition(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Montant encaissable"
            description="Active le calcul des gains après expiration du délai de remboursement.">
            <Toggle actif={montantEncaisable} onChange={v => { setMontantEncaisable(v); marquerModifie(); }} />
          </ParamLigne>

          {montantEncaisable && (
            <>
              <ParamLigne
                label="Jours de remboursement"
                description="Nombre de jours pendant lesquels une commande peut être remboursée (-1 = illimité).">
                <input type="number" value={joursRemboursement}
                  onChange={e => { setJoursRemboursement(e.target.value); marquerModifie(); }}
                  min="-1"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>

              <ParamLigne
                label="Calculer le montant encaissable à partir de"
                description="Date de référence pour le calcul.">
                <select value={calculMontantEncaisable} onChange={e => { setCalculMontantEncaisable(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '200px' }}>
                  <option value="dateCommande">Date de commande</option>
                  <option value="dateLivraison">Date de livraison</option>
                  <option value="dateExpedition">Date d'expédition</option>
                </select>
              </ParamLigne>

              <ParamLigne
                label="Permettre aux vendeurs de définir les jours de remboursement"
                description="Les vendeurs peuvent personnaliser le délai de remboursement."
                derniere>
                <Toggle actif={permettreJoursRemboursementVendeur} onChange={v => { setPermettreJoursRemboursementVendeur(v); marquerModifie(); }} />
              </ParamLigne>
            </>
          )}
        </Section>

        <Section titre="Taxes et remises" icon="🏷️">
          <ParamLigne
            label="Taxes incluses dans le prix"
            description="Si activé, les taxes sont incluses dans le prix du produit.">
            <Toggle actif={taxesInclusesPrix} onChange={v => { setTaxesInclusesPrix(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Gérer les remises sur les commandes"
            description="Si activé, le montant après remise va à l'admin qui paie les vendeurs manuellement.">
            <Toggle actif={gererRemiseCommande} onChange={v => { setGererRemiseCommande(v); marquerModifie(); }} />
          </ParamLigne>

          {gererRemiseCommande && (
            <ParamLigne
              label="Frais de remise supportés par"
              description="Qui supporte le coût des remises.">
              <select value={fraisRemise} onChange={e => { setFraisRemise(e.target.value); marquerModifie(); }}
                style={{ ...selectStyle, width: '180px' }}>
                <option value="vendeur">Vendeur</option>
                <option value="admin">Admin</option>
                <option value="personne">Personne</option>
              </select>
            </ParamLigne>
          )}

          <ParamLigne
            label="TCS sur les commandes"
            description="Applique la Taxe Collectée à la Source.">
            <Toggle actif={tcsSurCommandes} onChange={v => { setTcsSurCommandes(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="TDS sur les commandes"
            description="Applique la Taxe Déduite à la Source."
            derniere>
            <Toggle actif={tdsSurCommandes} onChange={v => { setTdsSurCommandes(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>

        <Section titre="Expédition et étiquettes" icon="📦">
          <ParamLigne
            label="Permettre la génération d'étiquettes d'expédition"
            description="Les vendeurs peuvent générer des étiquettes.">
            <Toggle actif={permettreEtiquetteExpedition} onChange={v => { setPermettreEtiquetteExpedition(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre l'annulation de l'expédition"
            description="Les vendeurs peuvent annuler l'expédition d'une commande.">
            <Toggle actif={permettreAnnulerExpedition} onChange={v => { setPermettreAnnulerExpedition(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Permettre la date de livraison prévue"
            description="Les vendeurs peuvent ajouter une date de livraison prévue.">
            <Toggle actif={permettreDateLivraisonPrevue} onChange={v => { setPermettreDateLivraisonPrevue(v); marquerModifie(); }} />
          </ParamLigne>

          {permettreDateLivraisonPrevue && (
            <ParamLigne
              label="Date de livraison obligatoire"
              description="Rend obligatoire l'ajout d'une date de livraison prévue."
              derniere>
              <Toggle actif={dateLivraisonObligatoire} onChange={v => { setDateLivraisonObligatoire(v); marquerModifie(); }} />
            </ParamLigne>
          )}

          <ParamLigne
            label="Restreindre l'expédition pour commandes frauduleuses"
            description="Empêche d'expédier les commandes à risque de fraude élevé.">
            <Toggle actif={restreindreExpeditionFraude} onChange={v => { setRestreindreExpeditionFraude(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Restreindre la vue des commandes impayées"
            description="Empêche les vendeurs de voir les commandes non payées."
            derniere>
            <Toggle actif={restreindreVoirCommandesImpayees} onChange={v => { setRestreindreVoirCommandesImpayees(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>
      </div>

      <div>
        <Section titre="Informations supplémentaires" icon="📝">
          <ParamLigne
            label="Permettre les informations supplémentaires"
            description="Les vendeurs peuvent ajouter des infos complémentaires.">
            <Toggle actif={permettreInfosSupplementaires} onChange={v => { setPermettreInfosSupplementaires(v); marquerModifie(); }} />
          </ParamLigne>

          {permettreInfosSupplementaires && (
            <ParamLigne
              label="Modifier les informations supplémentaires"
              description="Met à jour les informations sur Shopify."
              derniere>
              <Toggle actif={modifierInfosSupplementaires} onChange={v => { setModifierInfosSupplementaires(v); marquerModifie(); }} />
            </ParamLigne>
          )}

          <ParamLigne
            label="Ajouter la TVA du vendeur comme balise de commande"
            description="Ajoute la TVA du vendeur comme tag sur la commande.">
            <Toggle actif={ajouterTVABaliseCommande} onChange={v => { setAjouterTVABaliseCommande(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Génération de facture"
            description="Quand afficher le bouton de génération de facture.">
            <select value={generationFacture} onChange={e => { setGenerationFacture(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '200px' }}>
              <option value="anyTime">À tout moment</option>
              <option value="apresExpedition">Après expédition</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Ajouter des destinataires en copie"
            description="Permet d'ajouter des destinataires en copie sur les emails de confirmation.">
            <Toggle actif={permettreCCEmailCommande} onChange={v => { setPermettreCCEmailCommande(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Pourboires"
            description="Gestion des pourboires sur les commandes.">
            <select value={gestionPourboire} onChange={e => { setGestionPourboire(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '200px' }}>
              <option value="vendeurs">Distribuer entre les vendeurs</option>
              <option value="admin">Ajouter aux gains de l'admin</option>
            </select>
          </ParamLigne>

          <ParamLigne
            label="Notifications de feedback"
            description="Permet aux vendeurs d'envoyer des notifications de feedback aux clients."
            derniere>
            <Toggle actif={permettreNotificationAvis} onChange={v => { setPermettreNotificationAvis(v); marquerModifie(); }} />
          </ParamLigne>

          {permettreNotificationAvis && (
            <>
              <ParamLigne
                label="Événement de notification"
                description="Quand envoyer la notification de feedback.">
                <select value={evenementNotification} onChange={e => { setEvenementNotification(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="expedition">Après expédition</option>
                  <option value="livraison">Après livraison</option>
                </select>
              </ParamLigne>

              <ParamLigne
                label="Délai de notification"
                description="Nombre de jours après l'événement (0 = le jour même).">
                <input type="number" value={delaiNotification}
                  onChange={e => { setDelaiNotification(e.target.value); marquerModifie(); }}
                  min="0"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>

              <ParamLigne
                label="Limite maximale"
                description="Nombre maximum de jours pour envoyer les notifications."
                derniere>
                <input type="number" value={limiteMaxNotification}
                  onChange={e => { setLimiteMaxNotification(e.target.value); marquerModifie(); }}
                  min="1"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>
            </>
          )}
        </Section>

        <Section titre="Emails et rappels" icon="📧">
          <ParamLigne
            label="Envoyer l'email d'expédition depuis Shopify"
            description="Les emails d'expédition sont envoyés par Shopify.">
            <Toggle actif={envoyerMailExpedition} onChange={v => { setEnvoyerMailExpedition(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Rappel automatique d'expédition"
            description="Envoie des emails de rappel aux vendeurs.">
            <Toggle actif={rappelExpeditionAuto} onChange={v => { setRappelExpeditionAuto(v); marquerModifie(); }} />
          </ParamLigne>

          {rappelExpeditionAuto && (
            <>
              <ParamLigne
                label="Jours avant rappel"
                description="Nombre de jours après la commande pour le premier rappel (minimum 2).">
                <input type="number" value={joursAvantRappel}
                  onChange={e => { setJoursAvantRappel(e.target.value); marquerModifie(); }}
                  min="2"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>

              <ParamLigne
                label="Jours maximum de rappel"
                description="Nombre maximum de jours pour envoyer des rappels (maximum 30)."
                derniere>
                <input type="number" value={joursMaxRappel}
                  onChange={e => { setJoursMaxRappel(e.target.value); marquerModifie(); }}
                  max="30"
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
              </ParamLigne>
            </>
          )}
        </Section>
      </div>
    </div>
  );

  // Rendu de l'onglet Avancé
  const renduAvance = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <Section titre="Paramètres avancés" icon="🔧">
          <ParamLigne
            label="Regroupement des champs personnalisés"
            description="Regroupe les champs personnalisés pour les produits et vendeurs.">
            <Toggle actif={groupingCustomFields} onChange={v => { setGroupingCustomFields(v); marquerModifie(); }} />
          </ParamLigne>

          <ParamLigne
            label="Traduction Google"
            description="Active le dropdown de traduction Google.">
            <Toggle actif={googleTranslation} onChange={v => { setGoogleTranslation(v); marquerModifie(); }} />
          </ParamLigne>

          {googleTranslation && (
            <ParamLigne
              label="Panneau pour la traduction"
              description="Où afficher la traduction Google.">
              <select value={translationPanel} onChange={e => { setTranslationPanel(e.target.value); marquerModifie(); }}
                style={{ ...selectStyle, width: '180px' }}>
                <option value="both">Les deux panneaux</option>
                <option value="admin">Admin uniquement</option>
                <option value="seller">Vendeur uniquement</option>
              </select>
            </ParamLigne>
          )}

          <ParamLigne
            label="Alignement RTL"
            description="Alignement droite-gauche pour les langues comme l'arabe ou l'hébreu."
            derniere>
            <Toggle actif={rtlAlignment} onChange={v => { setRtlAlignment(v); marquerModifie(); }} />
          </ParamLigne>
        </Section>
      </div>
      <div>
        <Section titre="Vérification en 2 étapes" icon="🔐">
          <ParamLigne
            label="Activer la F2A pour mon compte admin"
            description="À chaque connexion, un code vous sera envoyé par courriel en plus de votre mot de passe."
            derniere>
            <Toggle actif={f2aAdminActif} onChange={toggleF2aAdmin} />
          </ParamLigne>
          {f2aAdminSaving && <p style={{ fontSize: '11px', color: T.textLight, margin: '8px 0 0' }}>⏳ Mise à jour…</p>}
        </Section>
      </div>
    </div>
  );

  // Rendu de l'onglet Commission
  const renduCommission = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ backgroundColor: '#e8f2fb', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: `1px solid ${T.accentLight}` }}>
          <p style={{ fontSize: '12px', color: T.text, margin: '0 0 8px 0', fontWeight: '700' }}>📝 Note sur les types de commission :</p>
          <ul style={{ fontSize: '11px', color: T.textLight, margin: '0 0 0 16px', padding: '0', lineHeight: '1.6' }}>
            <li><strong>Pourcentage</strong> - Un pourcentage est déduit du prix de base du produit.</li>
            <li><strong>Fixe</strong> - Un montant fixe est déduit du prix de base.</li>
            <li><strong>Pourcentage + Fixe</strong> - D'abord le pourcentage, puis un montant fixe sur le reste.</li>
            <li><strong>Fixe + Pourcentage</strong> - D'abord un montant fixe, puis un pourcentage sur le reste.</li>
          </ul>
        </div>

        <Section titre="Commission globale" icon="🌐" disabled={utiliserPlansVendeur}>
          <ParamLigne
            label="Calcul de la commission basé sur"
            description="Choisissez comment la commission doit être calculée.">
            <select value={calculCommissionBase} onChange={e => { setCalculCommissionBase(e.target.value); marquerModifie(); }}
              style={{ ...selectStyle, width: '180px' }}>
              <option value="normal">Normal</option>
              <option value="bareme">Barème de vente</option>
            </select>
          </ParamLigne>

          {calculCommissionBase === 'normal' ? (
            <>
              <ParamLigne
                label="Type de commission globale"
                description="Choisissez le type de commission.">
                <select value={typeCommissionGlobale} onChange={e => { setTypeCommissionGlobale(e.target.value); marquerModifie(); }}
                  style={{ ...selectStyle, width: '180px' }}>
                  <option value="%">Pourcentage (%)</option>
                  <option value="FIXED">Fixe</option>
                  <option value="% + FIXED">Pourcentage + Fixe</option>
                  <option value="FIXED + %">Fixe + Pourcentage</option>
                </select>
              </ParamLigne>

              {(typeCommissionGlobale === '%' || typeCommissionGlobale === '% + FIXED' || typeCommissionGlobale === 'FIXED + %') && (
                <ParamLigne
                  label="Commission globale"
                  description="Entrez le pourcentage de commission.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" value={commissionGlobale}
                      onChange={e => { setCommissionGlobale(e.target.value); marquerModifie(); }}
                      step="0.01" min="0" max="100"
                      style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                    <span>%</span>
                  </div>
                </ParamLigne>
              )}

              {(typeCommissionGlobale === 'FIXED' || typeCommissionGlobale === '% + FIXED' || typeCommissionGlobale === 'FIXED + %') && (
                <>
                  {typeCommissionGlobale === 'FIXED' && (
                    <ParamLigne
                      label="Commission globale"
                      description="Entrez le montant fixe de commission.">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>$</span>
                        <input type="number" value={commissionGlobale}
                          onChange={e => { setCommissionGlobale(e.target.value); marquerModifie(); }}
                          step="0.01" min="0"
                          style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                      </div>
                    </ParamLigne>
                  )}

                  <ParamLigne
                    label="Type de commission fixe"
                    description="Comment appliquer la commission fixe.">
                    <select value={typeCommissionFixe} onChange={e => { setTypeCommissionFixe(e.target.value); marquerModifie(); }}
                      style={{ ...selectStyle, width: '180px' }}>
                      <option value="produit">Par produit</option>
                      <option value="commande">Par commande</option>
                    </select>
                  </ParamLigne>

                  {(typeCommissionGlobale === '% + FIXED' || typeCommissionGlobale === 'FIXED + %') && (
                    <ParamLigne
                      label="Seconde commission globale"
                      description={typeCommissionGlobale === '% + FIXED' ? "Montant fixe à appliquer après le pourcentage." : "Pourcentage à appliquer après le montant fixe."}
                      derniere>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {typeCommissionGlobale === '% + FIXED' ? <span>$</span> : <span>%</span>}
                        <input type="number" value={secondeCommissionGlobale}
                          onChange={e => { setSecondeCommissionGlobale(e.target.value); marquerModifie(); }}
                          step="0.01" min="0"
                          style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                      </div>
                    </ParamLigne>
                  )}
                </>
              )}

              <ParamLigne
                label="Activer la commission maximale"
                description="Vous pouvez définir une commission maximale par commande.">
                <Toggle actif={activerCommissionMax} onChange={v => { setActiverCommissionMax(v); marquerModifie(); }} />
              </ParamLigne>

              {activerCommissionMax && (
                <ParamLigne
                  label="Commission maximale"
                  description="Montant maximum de commission qui peut être prélevé sur une commande."
                  derniere>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>$</span>
                    <input type="number" value={commissionMax}
                      onChange={e => { setCommissionMax(e.target.value); marquerModifie(); }}
                      step="0.01" min="0"
                      style={{ ...inputStyle, width: '100px', textAlign: 'center' }} />
                  </div>
                </ParamLigne>
              )}
            </>
          ) : (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, marginBottom: '12px' }}>Barèmes de commission par tranche de vente</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Ventes min ($)</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Ventes max ($)</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>1ère commission</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>2nde commission</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baremesCommission.map((bareme, index) => (
                      <tr key={index} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={bareme.min} onChange={e => {
                            const newBaremes = [...baremesCommission];
                            newBaremes[index].min = e.target.value;
                            setBaremesCommission(newBaremes);
                            marquerModifie();
                          }} style={{ ...inputStyle, width: '70px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={bareme.max} onChange={e => {
                            const newBaremes = [...baremesCommission];
                            newBaremes[index].max = e.target.value;
                            setBaremesCommission(newBaremes);
                            marquerModifie();
                          }} style={{ ...inputStyle, width: '70px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <select value={bareme.type} onChange={e => {
                            const newBaremes = [...baremesCommission];
                            newBaremes[index].type = e.target.value;
                            setBaremesCommission(newBaremes);
                            marquerModifie();
                          }} style={{ ...selectStyle, width: '100px' }}>
                            <option value="%">%</option>
                            <option value="FIXED">FIXED</option>
                            <option value="% + FIXED">% + FIXED</option>
                            <option value="FIXED + %">FIXED + %</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={bareme.premiereCommission} onChange={e => {
                            const newBaremes = [...baremesCommission];
                            newBaremes[index].premiereCommission = e.target.value;
                            setBaremesCommission(newBaremes);
                            marquerModifie();
                          }} style={{ ...inputStyle, width: '70px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={bareme.secondeCommission} onChange={e => {
                            const newBaremes = [...baremesCommission];
                            newBaremes[index].secondeCommission = e.target.value;
                            setBaremesCommission(newBaremes);
                            marquerModifie();
                          }} style={{ ...inputStyle, width: '70px' }} />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => supprimerBareme(index)}
                            style={{ background: 'none', border: 'none', color: T.danger, fontSize: '16px', cursor: 'pointer' }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={ajouterBareme}
                style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: 'white', border: `1px solid ${T.accent}`, borderRadius: '6px', color: T.accent, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                + Ajouter une tranche
              </button>
            </div>
          )}
        </Section>

        <Section titre="Commission par catégorie" icon="📁" disabled={utiliserPlansVendeur}>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setAfficherFormulaireCategorie(!afficherFormulaireCategorie)}
              style={{ padding: '8px 16px', backgroundColor: T.accent, border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              + Ajouter une commission par catégorie
            </button>
          </div>

          {afficherFormulaireCategorie && (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, marginBottom: '12px' }}>Nouvelle commission par catégorie</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                <SelectRecherche
                  options={categories}
                  value={nouvelleCategorie.categorieId}
                  onChange={(val) => setNouvelleCategorie({...nouvelleCategorie, categorieId: val})}
                  placeholder="Sélectionner une catégorie"
                  optionLabel={(cat) => cat.nom}
                  optionValue={(cat) => cat.id.toString()}
                />
                <select value={nouvelleCategorie.type} onChange={e => setNouvelleCategorie({...nouvelleCategorie, type: e.target.value})}
                  style={{ ...selectStyle }}>
                  <option value="%">Pourcentage (%)</option>
                  <option value="FIXED">Fixe</option>
                  <option value="% + FIXED">Pourcentage + Fixe</option>
                  <option value="FIXED + %">Fixe + Pourcentage</option>
                </select>
                <input type="number" placeholder="Première commission" value={nouvelleCategorie.premiereCommission}
                  onChange={e => setNouvelleCategorie({...nouvelleCategorie, premiereCommission: e.target.value})}
                  style={{ ...inputStyle }} />
                {(nouvelleCategorie.type === '% + FIXED' || nouvelleCategorie.type === 'FIXED + %') && (
                  <input type="number" placeholder="Seconde commission" value={nouvelleCategorie.secondeCommission}
                    onChange={e => setNouvelleCategorie({...nouvelleCategorie, secondeCommission: e.target.value})}
                    style={{ ...inputStyle }} />
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={ajouterCommissionCategorie}
                    style={{ flex: 1, padding: '8px', backgroundColor: T.success, border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    Ajouter
                  </button>
                  <button onClick={() => setAfficherFormulaireCategorie(false)}
                    style={{ flex: 1, padding: '8px', backgroundColor: 'white', border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {commissionsCategorie.length > 0 ? (
            <div style={{ marginTop: '8px' }}>
              {commissionsCategorie.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${T.border}` }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 4px 0' }}>{cat.categorieNom}</p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                      Type: {cat.type} | Commission: {cat.premiereCommission}{cat.type.includes('%') ? '%' : '$'}
                      {cat.secondeCommission && ` + ${cat.secondeCommission}${cat.type.startsWith('%') ? '$' : '%'}`}
                    </p>
                  </div>
                  <button onClick={() => supprimerCommissionCategorie(cat.id)}
                    style={{ background: 'none', border: 'none', color: T.danger, fontSize: '16px', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: T.textLight, textAlign: 'center', padding: '20px' }}>
              Aucune commission par catégorie définie.
            </p>
          )}
        </Section>
      </div>

      <div>
        <Section titre="Commission par vendeur" icon="👤" disabled={utiliserPlansVendeur}>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setAfficherFormulaireVendeur(!afficherFormulaireVendeur)}
              style={{ padding: '8px 16px', backgroundColor: T.accent, border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              + Ajouter une commission par vendeur
            </button>
          </div>

          {afficherFormulaireVendeur && (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, marginBottom: '12px' }}>Nouvelle commission par vendeur</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                <SelectRecherche
                  options={vendeurs}
                  value={nouveauVendeur.gestionnaireId}
                  onChange={(val) => setNouveauVendeur({...nouveauVendeur, gestionnaireId: val})}
                  placeholder="Sélectionner un vendeur"
                  optionLabel={(v) => `${v.nom_boutique} (${v.email})`}
                  optionValue={(v) => v.id.toString()}
                />
                <select value={nouveauVendeur.type} onChange={e => setNouveauVendeur({...nouveauVendeur, type: e.target.value})}
                  style={{ ...selectStyle }}>
                  <option value="%">Pourcentage (%)</option>
                  <option value="FIXED">Fixe</option>
                  <option value="% + FIXED">Pourcentage + Fixe</option>
                  <option value="FIXED + %">Fixe + Pourcentage</option>
                </select>
                <input type="number" placeholder="Première commission" value={nouveauVendeur.premiereCommission}
                  onChange={e => setNouveauVendeur({...nouveauVendeur, premiereCommission: e.target.value})}
                  style={{ ...inputStyle }} />
                {(nouveauVendeur.type === '% + FIXED' || nouveauVendeur.type === 'FIXED + %') && (
                  <input type="number" placeholder="Seconde commission" value={nouveauVendeur.secondeCommission}
                    onChange={e => setNouveauVendeur({...nouveauVendeur, secondeCommission: e.target.value})}
                    style={{ ...inputStyle }} />
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={ajouterCommissionVendeur}
                    style={{ flex: 1, padding: '8px', backgroundColor: T.success, border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    Ajouter
                  </button>
                  <button onClick={() => setAfficherFormulaireVendeur(false)}
                    style={{ flex: 1, padding: '8px', backgroundColor: 'white', border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {commissionsVendeur.length > 0 ? (
            <div style={{ marginTop: '8px' }}>
              {commissionsVendeur.map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${T.border}` }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 4px 0' }}>{v.vendeurBoutique}</p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                      {v.vendeurEmail} | Type: {v.type} | Commission: {v.premiereCommission}{v.type.includes('%') ? '%' : '$'}
                      {v.secondeCommission && ` + ${v.secondeCommission}${v.type.startsWith('%') ? '$' : '%'}`}
                    </p>
                  </div>
                  <button onClick={() => supprimerCommissionVendeur(v.id)}
                    style={{ background: 'none', border: 'none', color: T.danger, fontSize: '16px', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: T.textLight, textAlign: 'center', padding: '20px' }}>
              Aucune commission par vendeur définie.
            </p>
          )}
        </Section>

        {utiliserPlansVendeur && (
          <div style={{ backgroundColor: '#fff5f5', borderRadius: '8px', padding: '16px', border: `1px solid ${T.danger}`, marginTop: '20px' }}>
            <p style={{ fontSize: '12px', color: T.danger, fontWeight: '700', margin: '0 0 8px 0' }}>
              ⚠️ Configuration des commissions désactivée
            </p>
            <p style={{ fontSize: '11px', color: T.text, margin: 0, lineHeight: '1.6' }}>
              L'option "Utiliser les plans vendeur" est activée dans l'onglet Généralité. 
              Les commissions sont donc gérées directement par les plans vendeur. 
              Pour modifier les commissions globales, par catégorie ou par vendeur, 
              veuillez d'abord désactiver cette option.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {modalConfirm && (
        <ModalConfirm
          titre={modalConfirm.titre}
          message={modalConfirm.message}
          onConfirmer={modalConfirm.action}
          onAnnuler={() => setModalConfirm(null)}
        />
      )}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Configuration générale</h1>
            <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Plateforme · Paramètres globaux de e-Vend</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {modifie && (
              <span style={{ fontSize: '12px', color: T.warning, fontWeight: '700', backgroundColor: '#fef9c3', padding: '5px 12px', borderRadius: '20px' }}>
                ● Modifications non sauvegardées
              </span>
            )}
            <button onClick={sauvegarder}
              style={{ backgroundColor: modifie ? T.success : '#9ca3af', color: 'white', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: modifie ? 'pointer' : 'default', boxShadow: modifie ? `0 2px 8px rgba(22,163,74,0.35)` : 'none', transition: 'all 0.2s' }}>
              💾 Sauvegarder
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: `2px solid ${T.border}`, marginBottom: '24px', flexWrap: 'wrap' as const }}>
          <Onglet label="Généralité" actif={ongletActif === 'generalite'} onClick={() => setOngletActif('generalite')} />
          <Onglet label="Configuration vendeur" actif={ongletActif === 'configurationVendeur'} onClick={() => setOngletActif('configurationVendeur')} />
          <Onglet label="Configuration produits" actif={ongletActif === 'configurationProduits'} onClick={() => setOngletActif('configurationProduits')} />
          <Onglet label="Configuration commande" actif={ongletActif === 'configurationCommande'} onClick={() => setOngletActif('configurationCommande')} />
          <Onglet label="Commission" actif={ongletActif === 'commission'} onClick={() => setOngletActif('commission')} />
          <Onglet label="Avancé" actif={ongletActif === 'avance'} onClick={() => setOngletActif('avance')} />
        </div>

        {ongletActif === 'generalite' && renduGeneralite()}
        {ongletActif === 'configurationVendeur' && renduConfigurationVendeur()}
        {ongletActif === 'configurationProduits' && renduConfigurationProduits()}
        {ongletActif === 'configurationCommande' && renduConfigurationCommande()}
        {ongletActif === 'commission' && renduCommission()}
        {ongletActif === 'avance' && renduAvance()}

        {ongletActif === 'generalite' && (
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginTop: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '800', color: T.accent, margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Statut actuel de la plateforme</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Inscriptions vendeurs', val: bloquerInscriptionVendeur  ? '🔒 Bloquées' : '✅ Ouvertes', ok: !bloquerInscriptionVendeur  },
                { label: 'Inscriptions acheteurs', val: bloquerInscriptionAcheteur ? '🔒 Bloquées' : '✅ Ouvertes', ok: !bloquerInscriptionAcheteur },
                { label: 'Maintenance',    val: modeMaintenance           ? '🛑 Active'     : '✅ Normal',    ok: !modeMaintenance           },
                { label: 'Stripe Connect', val: stripeActif               ? '⚡ Actif'      : '— Inactif',   ok: stripeActif                },
                { label: 'PayPal',         val: paypalActif               ? '🅿 Actif'      : '— Inactif',   ok: paypalActif                },
                { label: 'Avis clients',   val: avisActifs                ? '⭐ Actif'      : '— Inactif',   ok: avisActifs                 },
                { label: 'Notifs auto',    val: notifsAutoVendeurs        ? '🔔 Actif'      : '— Inactif',   ok: notifsAutoVendeurs         },
                { label: 'Plans vendeur',  val: utiliserPlansVendeur      ? '✅ Actif'      : '— Inactif',   ok: true                       },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${s.ok ? '#e5e7eb' : '#fecdd3'}` }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', margin: '0 0 3px 0' }}>{s.label}</p>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: s.ok ? T.text : T.danger, margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}