/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

// Composants Polaris personnalisés (remplacent les imports)
// ============================================================

// Page personnalisé
const Page = ({ title, subtitle, children }: any) => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a2332', margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// BlockStack personnalisé
const BlockStack = ({ children, gap }: any) => {
  const gapMap: Record<string, string> = { '200': '8px', '300': '12px', '400': '16px', '500': '20px' };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: gapMap[gap] || '8px' }}>{children}</div>;
};

// TextField personnalisé
const TextField = ({ label, value, onChange, type = 'text', placeholder, autoComplete, helpText, error, prefix, multiline, rows, clearButton, onClearButtonClick, min }: any) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#1a2332' }}>{label}</label>}
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      {prefix && <span style={{ marginRight: '8px', fontSize: '14px', color: '#666' }}>{prefix}</span>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${error ? '#dc2626' : '#e1e4e8'}`,
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${error ? '#dc2626' : '#e1e4e8'}`,
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      )}
      {clearButton && value && (
        <button
          onClick={onClearButtonClick}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#999'
          }}
        >
          ✕
        </button>
      )}
    </div>
    {helpText && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{helpText}</p>}
    {error && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
  </div>
);

// Select personnalisé
const Select = ({ label, options, value, onChange, disabled }: any) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#1a2332' }}>{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e1e4e8',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: disabled ? '#f5f5f5' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Checkbox personnalisé
const Checkbox = ({ label, checked, onChange, disabled }: any) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      style={{ width: '18px', height: '18px', cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
    <span style={{ fontSize: '13px', color: '#1a2332' }}>{label}</span>
  </label>
);

// Button personnalisé
const Button = ({ children, onClick, variant, tone, size, disabled, loading, fullWidth }: any) => {
  const getStyles = (): React.CSSProperties => {
    let bg = '#537373';
    let color = 'white';
    if (variant === 'primary') bg = '#2c6ecb';
    if (tone === 'success') bg = '#059669';
    if (tone === 'critical') bg = '#dc2626';
    if (variant === 'plain') {
      bg = 'transparent';
      color = tone === 'critical' ? '#dc2626' : '#537373';
    }
    return {
      padding: size === 'slim' ? '6px 12px' : '10px 16px',
      backgroundColor: loading ? '#9ca3af' : bg,
      color,
      border: variant === 'plain' ? '1px solid #e1e4e8' : 'none',
      borderRadius: '6px',
      fontSize: size === 'slim' ? '12px' : '14px',
      fontWeight: '600',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    };
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={getStyles()}>
      {loading && <span>⏳</span>}
      {children}
    </button>
  );
};

// Modal personnalisé
const Modal = ({ open, onClose, title, children, primaryAction, secondaryActions }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        {title && <div style={{ padding: '16px 20px', borderBottom: '1px solid #e1e4e8', fontWeight: 'bold', fontSize: '18px' }}>{title}</div>}
        <div style={{ padding: '20px' }}>{children}</div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e1e4e8', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {secondaryActions?.map((action: any, idx: number) => (
            <Button key={idx} variant="plain" onClick={action.onAction}>{action.content}</Button>
          ))}
          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onAction}>{primaryAction.content}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

Modal.Section = ({ children }: any) => <div>{children}</div>;

// ============================================================
// FIN DES COMPOSANTS POLARIS PERSONNALISÉS
// ============================================================

// Suppression des imports Polaris d'origine
// import {
//   Page,
//   BlockStack,
//   TextField,
//   Select,
//   Checkbox,
//   Button,
//   Modal,
// } from '@shopify/polaris';

import Cropper from 'react-easy-crop';

const API_BASE = 'https://api.e-vend.ca/api';
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
  attachment?: string;
  filename?: string;
  imageFile?: File;
};

// Types pour les images produit
type ProductImage = {
  id: string;
  file?: File;
  url: string;
  attachment?: string;
  filename?: string;
  altText: string;
  rotation: number;
  width?: number;
  height?: number;
  isExisting?: boolean;
  isUploading?: boolean;
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
              <p style={{ margin: '8px 0 0 0', fontSize: '10px', opacity: 0.7 }}>Tarifs appliqués automatiquement par e-Vend</p>
            </>
          ) : (
            text
          )}
        </div>
      )}
    </span>
  );
};

// Composant d'éditeur de texte enrichi CORRIGÉ
const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('Times New Roman');
  const [selectedSize, setSelectedSize] = useState('12pt');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isInitialized, setIsInitialized] = useState(false);
  const isUpdatingRef = useRef(false);

    useEffect(() => {
    if (editorRef.current && viewMode === 'visual' && !isInitialized) {
      editorRef.current.innerHTML = value || '';
      editorRef.current.dir = 'ltr';
      editorRef.current.style.textAlign = 'left';
      setIsInitialized(true);
    }
  }, [viewMode, isInitialized, value]);

  useEffect(() => {
    if (editorRef.current && viewMode === 'visual' && isInitialized && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, viewMode, isInitialized]);

  const execCommand = (command: string, val: string = '') => {
    if (viewMode !== 'visual') return;
    document.execCommand(command, false, val);
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => { isUpdatingRef.current = false; }, 10);
    }
  };

  const handleInput = () => {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      document.execCommand('justifyLeft', false);
      onChange(editorRef.current.innerHTML);
      setTimeout(() => { isUpdatingRef.current = false; }, 10);
    }
  };

  const handleBlur = () => {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => { isUpdatingRef.current = false; }, 10);
    }
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const sizeMap: { [key: string]: string } = {
      '8pt': '1', '10pt': '2', '12pt': '3', '14pt': '4', '18pt': '5', '24pt': '6', '36pt': '7'
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
          <button onClick={() => execCommand('bold')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button"><strong>B</strong></button>
          <button onClick={() => execCommand('italic')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', fontStyle: 'italic', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button"><em>I</em></button>
          <button onClick={() => execCommand('underline')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', textDecoration: 'underline', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button"><u>U</u></button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#ccc', margin: '0 4px' }}></div>
          
          <select value={selectedFont} onChange={(e) => handleFontChange(e.target.value)} disabled={viewMode !== 'visual'} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', opacity: viewMode === 'visual' ? 1 : 0.5, cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', height: '30px' }}>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>

          <select value={selectedSize} onChange={(e) => handleSizeChange(e.target.value)} disabled={viewMode !== 'visual'} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', opacity: viewMode === 'visual' ? 1 : 0.5, cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', height: '30px' }}>
            <option value="8pt">8pt</option>
            <option value="10pt">10pt</option>
            <option value="12pt">12pt</option>
            <option value="14pt">14pt</option>
            <option value="18pt">18pt</option>
            <option value="24pt">24pt</option>
            <option value="36pt">36pt</option>
          </select>

          <input type="color" value={selectedColor} onChange={(e) => handleColorChange(e.target.value)} disabled={viewMode !== 'visual'} style={{ width: '30px', height: '30px', border: '1px solid #ccc', borderRadius: '4px', opacity: viewMode === 'visual' ? 1 : 0.5, cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', padding: '2px' }} />

          <div style={{ width: '1px', height: '24px', backgroundColor: '#ccc', margin: '0 4px' }}></div>
          
          <button onClick={() => handleAlign('Left')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button">⬅️</button>
          <button onClick={() => handleAlign('Center')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button">⏺️</button>
          <button onClick={() => handleAlign('Right')} disabled={viewMode !== 'visual'} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: viewMode === 'visual' ? 'pointer' : 'not-allowed', opacity: viewMode === 'visual' ? 1 : 0.5, minWidth: '30px' }} type="button">➡️</button>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => { setViewMode('visual'); setIsInitialized(false); }} style={{ padding: '4px 12px', background: viewMode === 'visual' ? '#3b82f6' : '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'visual' ? '#fff' : '#333', fontWeight: viewMode === 'visual' ? 'bold' : 'normal' }} type="button">Visuel</button>
          <button onClick={() => setViewMode('html')} style={{ padding: '4px 12px', background: viewMode === 'html' ? '#3b82f6' : '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'html' ? '#fff' : '#333', fontWeight: viewMode === 'html' ? 'bold' : 'normal' }} type="button">HTML</button>
        </div>
      </div>
      
      {viewMode === 'visual' ? (
        <div 
          ref={editorRef} 
          contentEditable={viewMode === 'visual'} 
          onInput={handleInput} 
          onBlur={handleBlur} 
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
            textAlign: 'left' 
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
            textAlign: 'left' 
          }} 
        />
      )}
    </div>
  );
};

function CreerAnnonce({ produitId, onRetour, gestionnaireId, dupliquerDeId }: { produitId?: string; onRetour?: () => void; gestionnaireId?: number; dupliquerDeId?: string } = {}) {

  // Injecter le CSS responsive au montage
  useEffect(() => {
    const styleId = 'creerannonce-responsive-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .creerannonce-layout {
        display: grid;
        grid-template-columns: 60% calc(40% - 16px);
        gap: 16px;
        width: 100%;
        align-items: flex-start;
      }
      .creerannonce-col-left,
      .creerannonce-col-right {
        min-width: 0;
        box-sizing: border-box;
      }
      @media (max-width: 768px) {
        .creerannonce-layout {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .creerannonce-col-left,
        .creerannonce-col-right {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const modeModifier = !!produitId;
  const modeDupliquer = !!dupliquerDeId && !produitId;
  const naviguerRetour = () => { if (onRetour) onRetour(); };
  const [chargementInitial, setChargementInitial] = useState(modeModifier || modeDupliquer);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Limites du plan vendeur ──────────────────────────────────────────────
  const [planVendeur, setPlanVendeur] = useState<{
    peut_creer_produit: boolean;
    nb_produits_actifs: number;
    limite_produits: number | null;
    produits_restants: number | null;
    nom_plan: string;
    emoji_plan: string;
    limiter_produits: boolean;
    publicationFuture: boolean;
  } | null>(null);

  useEffect(() => {
    if (!gestionnaireId || modeModifier) return; // En mode modification, pas de blocage
    const chargerPlan = async () => {
      try {
        const res = await fetch(`${API_BASE}/plans/vendeur/${gestionnaireId}/plan-actif`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setPlanVendeur({
          peut_creer_produit: data.utilisation?.peut_creer_produit ?? true,
          nb_produits_actifs: data.utilisation?.nb_produits_actifs ?? 0,
          limite_produits: data.limites?.limite_produits ?? null,
          produits_restants: data.utilisation?.produits_restants ?? null,
          nom_plan: data.abonnement?.plan ?? '',
          emoji_plan: data.plan?.emoji ?? '📦',
          limiter_produits: data.limites?.limiter_produits ?? false,
          publicationFuture: data.limites?.fonctionnalites?.publicationFuture ?? true,
        });
      } catch (e) {
        console.error('Erreur chargement plan vendeur:', e);
      }
    };
    chargerPlan();
  }, [gestionnaireId, modeModifier]);
  // ────────────────────────────────────────────────────────────────────────

  // ===== CHARGEMENT CONFIG ADMIN MAKE OFFER =====
  useEffect(() => {
    const chargerConfigMakeOffer = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/configuration/make-offer`);
        if (!res.ok) return;
        const data = await res.json();
        const cfg = data?.config || {};
        setMakeOfferConfigAdmin({
          make_offer_actif:              cfg.make_offer_actif              ?? true,
          permettre_vendeur_configurer:  cfg.permettre_vendeur_configurer  ?? true,
          permettre_vendeur_auto_accept: cfg.permettre_vendeur_auto_accept ?? true,
          offre_min_pourcentage:         cfg.offre_min_pourcentage         ?? 30,
        });
      } catch (e) {
        // Si l'API est indisponible, on laisse null (l'encadré sera activé par défaut)
      }
    };
    chargerConfigMakeOffer();
  }, []);

  // ===== CHARGEMENT CONFIG ADMIN (mode taxe) =====
  useEffect(() => {
    const chargerConfigTaxe = async () => {
      try {
        const res = await fetch(`${API_BASE}/creer-annonce/config-taxes`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const mode = data.mode_taxe || 'libre';
        setModeTaxeConfig(mode);
        // Appliquer la valeur initiale selon le mode
        if (mode === 'force_taxable') setFacturationTaxes(true);
        else if (mode === 'force_non_taxable') setFacturationTaxes(false);
      } catch (e) {
        console.error('Erreur chargement config taxe:', e);
      }
    };
    chargerConfigTaxe();
  }, []);

  const afficherToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ===== FONCTION UPLOAD VERS S3 (via backend Render) =====
  const uploadImageToS3 = async (file: File): Promise<{ url: string; filename: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', file.name);

      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erreur upload image:', error);
        throw new Error(error.message || 'Erreur upload');
      }

      const data = await response.json();

      if (!data.image_url || !data.image_url.startsWith('http')) {
        throw new Error('URL S3 invalide reçue');
      }

      console.log('✅ Image hébergée sur S3:', data.image_url);
      
      return { 
        url: data.image_url, 
        filename: data.filename || file.name 
      };
    } catch (error) {
      console.error('❌ Erreur uploadImageToS3:', error);
      return null;
    }
  };

  const [typeProduit, setTypeProduit] = useState('physique');
  const [nomProduit, setNomProduit] = useState('');

  // ── Mettre à jour automatiquement les altText vides quand le titre change ──
  useEffect(() => {
    if (!nomProduit.trim()) return;
    setProductImages(prev => prev.map(img =>
      img.altText.trim() === '' ? { ...img, altText: nomProduit.trim() } : img
    ));
  }, [nomProduit]);
  const [description, setDescription] = useState('');
  const [unitePoids, setUnitePoids] = useState('kg');
  const [poids, setPoids] = useState('');
  const [expeditionNecessaire, setExpeditionNecessaire] = useState(true);
  const [methodesVendeur, setMethodesVendeur] = useState<any[]>([]);
  const [methodesSelectionnees, setMethodesSelectionnees] = useState<number[]>([]);

  // Charger les méthodes d'expédition du vendeur
  useEffect(() => {
    const token = localStorage.getItem('token');
    const effectifVendeurId = gestionnaireId ?? JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (!effectifVendeurId || !token) return;
    fetch(`https://api.e-vend.ca/api/vendeurs/${effectifVendeurId}/methodes-expedition/details`, {
      credentials: 'include', headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      const methodes = Array.isArray(data) ? data : [];
      setMethodesVendeur(methodes);
      // En mode modification, charger les méthodes assignées à ce produit
      if (produitId) {
        fetch(`https://api.e-vend.ca/api/vendeurs/produit/${produitId}/methodes`)
          .then(r => r.ok ? r.json() : { methodes: [] })
          .then(d => {
            const ids = (d.methodes || []).filter((m: any) => m.id !== -1).map((m: any) => m.id);
            if (ids.length > 0) setMethodesSelectionnees(ids);
            else if (methodes.length === 0) setMethodesSelectionnees([-1]);
          })
          .catch(() => {});
      } else if (methodes.length === 0) {
        setMethodesSelectionnees([-1]);
      }
    })
    .catch(() => { if (!produitId) setMethodesSelectionnees([-1]); });
  }, []);
  const [prix, setPrix] = useState('');
  const [prixOriginal, setPrixOriginal] = useState('');
  const [prixRevient, setPrixRevient] = useState('');
  const [facturationTaxes, setFacturationTaxes] = useState(false);
  // Config admin : 'libre' | 'force_taxable' | 'force_non_taxable'
  const [modeTaxeConfig, setModeTaxeConfig] = useState<'libre' | 'force_taxable' | 'force_non_taxable'>('libre');
  const [codeBarres, setCodeBarres] = useState('');
  const [suiviInventaire, setSuiviInventaire] = useState('suivre');
  const [quantiteMinimum, setQuantiteMinimum] = useState('1');
  const [quantite, setQuantite] = useState('');
  const [ville, setVille] = useState('CANADA');
  const [modeExpeditionOffert, setModeExpeditionOffert] = useState({
    transporteur: true,
    ramassage: false
  });
  const [typeAnnonce, setTypeAnnonce] = useState('neuf');
  const [etatArticle, setEtatArticle] = useState('1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine');
  const [retourOffert, setRetourOffert] = useState('non aucun retour accepté vente finale');
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

  // ===== NOUVEAU : POINT DE VENTE =====
  const [canauxVente, setCanauxVente] = useState({
    boutique_en_ligne: true,   // Activé par défaut
    point_de_vente: false       // Désactivé par défaut
  });

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

  // États pour Make Offer
  const [makeOfferEnabled, setMakeOfferEnabled] = useState(false);
  const [makeOfferPrixMin, setMakeOfferPrixMin] = useState('');
  const [makeOfferAutoAccept, setMakeOfferAutoAccept] = useState(false);
  const [makeOfferConfigAdmin, setMakeOfferConfigAdmin] = useState<{ make_offer_actif: boolean; permettre_vendeur_configurer: boolean; permettre_vendeur_auto_accept: boolean; offre_min_pourcentage: number } | null>(null);

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
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [nouvelleOptionNom, setNouvelleOptionNom] = useState('');
  const [nouvelleOptionValeurs, setNouvelleOptionValeurs] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState(false);
  const [variantView, setVariantView] = useState<'options' | 'table'>('options');
  const [prixParDefaut, setPrixParDefaut] = useState('');
  const [poidsParDefaut, setPoidsParDefaut] = useState('');

  // États pour les catégories
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<Categorie[]>([]);
  const [rechercheCategorie, setRechercheCategorie] = useState('');
  const [showCategorieDropdown, setShowCategorieDropdown] = useState(false);
  const categorieDropdownRef = useRef<HTMLDivElement>(null);

  // États pour les tags
  const [tagsDisponibles, setTagsDisponibles] = useState<Tag[]>([]);
  const [tagsSelectionnes, setTagsSelectionnes] = useState<Tag[]>([]);
  const [rechercheTag, setRechercheTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns
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

  const categoriesFiltrees = categories.filter(cat => 
    cat.nom.toLowerCase().includes(rechercheCategorie.toLowerCase()) &&
    !categoriesSelectionnees.some(sel => sel.id === cat.id)
  );

  const tagsFiltres = tagsDisponibles.filter(tag => 
    tag.nom.toLowerCase().includes(rechercheTag.toLowerCase()) &&
    !tagsSelectionnes.some(sel => sel.id === tag.id)
  );

  const ajouterCategorie = (categorie: Categorie) => {
    if (categoriesSelectionnees.length >= 5) {
      setMaxCategoriesModalOpen(true);
      return;
    }
    setCategoriesSelectionnees([...categoriesSelectionnees, categorie]);
    setRechercheCategorie('');
    setShowCategorieDropdown(false);
  };

  const supprimerCategorie = (categorieId: string) => {
    setCategoriesSelectionnees(categoriesSelectionnees.filter(cat => cat.id !== categorieId));
  };

  const ajouterTag = (tag: Tag) => {
    if (tagsSelectionnes.length >= 5) {
      setMaxTagsModalOpen(true);
      return;
    }
    setTagsSelectionnes([...tagsSelectionnes, tag]);
    setRechercheTag('');
    setShowTagDropdown(false);
  };

  const supprimerTag = (tagId: string) => {
    setTagsSelectionnes(tagsSelectionnes.filter(tag => tag.id !== tagId));
  };

  const getDateMinimale = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  const calculerProfit = () => {
    const prixVente = parseFloat(prix) || 0;
    const prixCost = parseFloat(prixRevient) || 0;
    return (prixVente - prixCost).toFixed(2);
  };

  const validerChampsObligatoires = () => {
    const manquants: string[] = [];

    if (!typeProduit) manquants.push('Choisir le produit');
    if (!nomProduit.trim()) manquants.push('Nom du produit');
    if (!description.trim()) manquants.push('Description');
    const imgsUploaded = productImages.filter(img => img.url && img.url.startsWith('http') && !img.isUploading);
    if (imgsUploaded.length === 0) manquants.push('Images du produit (attendez la fin de l\'upload)');
    if (!prix) manquants.push('Prix de vente');
    if (typeProduit === 'physique' && !poids) manquants.push('Poids');
    if (!ville.trim()) manquants.push('Ville');
    if (!typeAnnonce) manquants.push("Type d'annonce");
    if (!etatArticle) manquants.push("État de l'article");
    if (!retourOffert) manquants.push('Retour offert');
    if (!garantieOfferte) manquants.push('Garantie offerte');
    if (!quantite) manquants.push('Quantité disponible');
    if (categoriesSelectionnees.length === 0) manquants.push('Catégories (au moins une)');

    if (typeParution === 'future' && !dateParution) {
      manquants.push('Date et heure de parution');
    }

    if (typeProduit === 'numerique') {
      if (produitNumeriqueType === 'fichier') {
        // En mode édition, si lienNumerique existe déjà (S3), le fichier n'est pas re-obligatoire
        if (!fichierNumerique && !lienNumerique.trim()) manquants.push('Fichier numérique');
        if (fichierError && fichierError.startsWith('⏳')) manquants.push('Upload du fichier numérique en cours, veuillez patienter');
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

  const handleEnregistrer = async (statut: 'actif' | 'brouillon' = 'actif') => {
    const manquants = validerChampsObligatoires();
    if (statut === 'actif' && manquants.length > 0) {
      setChampsManquants(manquants);
      setValidationModalOpen(true);
      return;
    }

    setSauvegardeEnCours(true);
    
    try {
      // Images valides : url CDN requise, attachment base64 si disponible (sinon le backend utilise l'url)
      const imagesEnCours = productImages.filter(img => img.isUploading);
      if (imagesEnCours.length > 0) {
        alert(`⏳ Attendez la fin de l'upload des ${imagesEnCours.length} image(s) en cours...`);
        setSauvegardeEnCours(false);
        return;
      }

      const validImages = productImages
        .filter(img => img.url && img.url.startsWith('http') && !img.isUploading)
        .map(img => ({
          url: img.url,
          filename: img.filename || 'image.jpg',
          altText: img.altText || '',
          rotation: img.rotation || 0,
          isExisting: img.isExisting || false
        }));

      if (validImages.length === 0 && statut === 'actif') {
        alert('❌ Aucune image valide. Ajoutez au moins une image et attendez la fin de l\'upload.');
        setSauvegardeEnCours(false);
        return;
      }
      
      const optionsForApi = options.map(opt => ({
        nom: opt.nom,
        valeurs: opt.valeurs.map(v => ({ valeur: v.valeur }))
      }));
      
      const variantsForApi = variants.map(v => ({
        combinaison: v.combinaison,
        prix:        v.prix !== '' && v.prix !== undefined ? v.prix : null,
        quantite:    v.quantite !== '' && v.quantite !== undefined ? v.quantite : null,
        sku:         v.sku || '',
        poids:       parseFloat(v.poids) || 0,
        codeBarres:  v.codeBarres || '',
        image:       v.image || null,
      }));
      
      const body = {
        nom: nomProduit,
        description,
        type_produit: typeProduit,
        prix: parseFloat(prix) || 0,
        prix_original: prixOriginal ? parseFloat(prixOriginal) : null,
        prix_revient: prixRevient ? parseFloat(prixRevient) : null,
        facturation_taxes: facturationTaxes,
        quantite: parseInt(quantite) || 0,
        sku: sku || '',
        code_barres: codeBarres || upc || '',
        suivi_inventaire: suiviInventaire,
        quantite_minimum: parseInt(quantiteMinimum) || 1,
        poids: typeProduit === 'physique' ? (parseFloat(poids) || 0) : 0,
        hauteur: hauteur ? parseFloat(hauteur) : null,
        largeur: largeur ? parseFloat(largeur) : null,
        longueur: longueur ? parseFloat(longueur) : null,
        marque: marque || '',
        modele: modele || '',
        mode_expedition: modeExpeditionOffert,
        methodes_expedition_ids: methodesSelectionnees,
        expedition_necessaire: expeditionNecessaire,
        type_annonce: typeAnnonce,
        etat_article: etatArticle,
        retour_offert: retourOffert,
        garantie_offerte: garantieOfferte,
        pays_fabrication: paysFabrication || '',
        formats: formats || '',
        adresse_vente: adresseVente || '',
        lien_youtube: lienYoutube || '',
        ville: ville || 'CANADA',
        categories_selectionnees: categoriesSelectionnees,
        tags_selectionnes: tagsSelectionnes,
        product_images: validImages,
        product_video: productVideo ? {
          url: productVideo.url,
          thumbnail: productVideo.thumbnail,
          duration: productVideo.duration
        } : null,
        options: optionsForApi,
        variants: variantsForApi,
        produit_numerique_type: produitNumeriqueType,
        lien_numerique: lienNumerique || null,
        jours_accessibles: parseInt(joursAccessibles) || 0,
        nombre_telechargements: parseInt(nombreTelechargements) || 0,
        type_parution: typeParution,
        date_parution: typeParution === 'future' ? dateParution : null,
        make_offer_enabled:     makeOfferEnabled,
        make_offer_prix_min:    makeOfferPrixMin ? parseFloat(makeOfferPrixMin) : null,
        make_offer_auto_accept: makeOfferAutoAccept,
        statut: statut,
        canaux_vente: canauxVente  // ← NOUVEAU
      };
      
      let res;
      if (modeModifier) {
        res = await fetch(`${API_BASE}/creer-annonce/${produitId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ ...body, vendeur_id: gestionnaireId }),
        });
      } else {
        res = await fetch(`${API_BASE}/creer-annonce`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ ...body, vendeur_id: gestionnaireId }),
        });
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Erreur serveur');
      }
      
      afficherToast(data.message);
      setTimeout(() => naviguerRetour(), 1500);
      
    } catch (err: any) {
      console.error('Erreur:', err);
      afficherToast(err.message || '❌ Erreur lors de la sauvegarde');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  useEffect(() => {
    if (typeProduit === 'numerique') {
      setPoids('0');
      setExpeditionNecessaire(false);
    } else {
      setPoids('');
      setExpeditionNecessaire(true);
    }
  }, [typeProduit]);

  useEffect(() => {
    const chargerCategoriesEtTags = async () => {
      try {
        const resCat = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
        if (resCat.ok) {
          const dataCat = await resCat.json();
          const categoriesList = (dataCat.categories || dataCat).map((c: any) => ({ id: String(c.id), nom: c.nom }));
          setCategories(categoriesList);
        }
      } catch (e) {
        console.error('Erreur chargement catégories:', e);
      }

      try {
        const resTag = await fetch(`${API_BASE}/tags`, { headers: authHeaders() });
        if (resTag.ok) {
          const dataTag = await resTag.json();
          setTagsDisponibles((dataTag.tags || dataTag).map((t: any) => ({ id: String(t.id), nom: t.nom })));
        }
      } catch (e) {
        console.error('Erreur chargement tags:', e);
      }
    };
    chargerCategoriesEtTags();
  }, []);

  useEffect(() => {
    if (modeModifier && produitId) {
      const chargerProduit = async () => {
        try {
          const fetchUrl = gestionnaireId
            ? `${API_BASE}/creer-annonce/${produitId}?vendeur_id=${gestionnaireId}`
            : `${API_BASE}/creer-annonce/${produitId}`;
          const res = await fetch(fetchUrl, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            const p = data.produit;
            
            setNomProduit(p.nom || '');
            setDescription(p.description || '');
            setPrix(p.prix ? String(p.prix) : '');
            setPrixOriginal(p.prix_original ? String(p.prix_original) : '');
            setPrixRevient(p.prix_revient ? String(p.prix_revient) : '');
            setQuantite(p.stock ? String(p.stock) : '0');
            setSku(p.sku || '');
            setCodeBarres(p.code_barres || '');
            setMarque(p.marque || '');
            setModele(p.modele || '');
            setPoids(p.poids ? String(p.poids) : '');
            setHauteur(p.hauteur ? String(p.hauteur) : '');
            setLargeur(p.largeur ? String(p.largeur) : '');
            setLongueur(p.longueur ? String(p.longueur) : '');
            setTypeAnnonce(p.type_annonce || 'neuf');
            
            const etatMapping = {
              'neuf': '1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine',
              'comme-neuf': '2. Comme neuf – Utilisé une ou deux fois en excellent état',
              'tres-bon': '3. Très bon état – Quelques signes mineurs d\'usure mais fonctionne parfaitement',
              'bon': '4. Bon état – L\'article a été utilisé mais reste en bon état général',
              'correct': '5. État correct – Présente des marques d\'usure visibles mais fonctionne',
              'use': '6. Usé / Bien utilisé – L\'article fonctionne mais montre des signes d\'usage importants',
              'a-reparer': '7. À réparer – Ne fonctionne pas ou endommagé - peut être réparé',
              'pieces': '8. Pour pièces – Non fonctionnel - vendu pour récupérer des pièces'
            };
            setEtatArticle(etatMapping[p.etat] || p.etat || '1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine');
            
            setRetourOffert(p.retour_offert || 'non aucun retour accepté vente finale');
            setGarantieOfferte(p.garantie || 'aucune');
            setPaysFabrication(p.pays_fabrication || '');
            setLienYoutube(p.lien_youtube || '');
            setAdresseVente(p.adresse_vente || '');
            setFormats(p.formats || '');
            setSuiviInventaire(p.suivi_inventaire || 'suivre');
            setQuantiteMinimum(p.quantite_minimum ? String(p.quantite_minimum) : '1');
            setTypeProduit(p.produit_numerique ? 'numerique' : 'physique');
            // ===== CHAMPS PRODUIT NUMÉRIQUE =====
            if (p.produit_numerique) {
              setProduitNumeriqueType((p.produit_numerique_type as ProduitNumeriqueType) || 'fichier');
              setLienNumerique(p.lien_numerique || '');
              setJoursAccessibles(p.jours_accessibles ? String(p.jours_accessibles) : '0');
              setNombreTelechargements(p.telechargements_max ? String(p.telechargements_max) : '0');
            }
            setVille(p.ville || 'CANADA');
            
            if (p.canaux_vente) {
              setCanauxVente(p.canaux_vente);
            }
            
            if (p.mode_expedition) {
              setModeExpeditionOffert(p.mode_expedition);
            }
            
            if (p.tags && Array.isArray(p.tags)) {
              setTagsSelectionnes(p.tags);
            }
            
            if (p.categorie_id) {
              const categorieTrouvee = categories.find(cat => cat.id === String(p.categorie_id));
              if (categorieTrouvee) {
                setCategoriesSelectionnees([categorieTrouvee]);
              }
            }
            
            if (p.date_parution) {
              setTypeParution('future');
              // PostgreSQL retourne ex: "2026-04-09T14:30:00.000Z"
              // Le champ datetime-local attend "2026-04-09T14:30"
              // On convertit en heure locale pour afficher correctement
              try {
                const d = new Date(p.date_parution);
                // Format local: YYYY-MM-DDTHH:MM
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16);
                setDateParution(local);
              } catch(e) {
                setDateParution(p.date_parution.slice(0, 16));
              }
            }
            
            // Charger les valeurs Make Offer si elles existent
            if (p.make_offer_enabled !== undefined) setMakeOfferEnabled(!!p.make_offer_enabled);
            if (p.make_offer_prix_min !== undefined && p.make_offer_prix_min !== null) setMakeOfferPrixMin(String(p.make_offer_prix_min));
            if (p.make_offer_auto_accept !== undefined) setMakeOfferAutoAccept(!!p.make_offer_auto_accept);

            // Charger les images — priorité images_data (avec métadonnées), fallback sur images[]
            const imagesDataValides = (p.images_data || []).filter((img: any) => img && img.url && img.url.startsWith('http'));
            const imagesUrlsValides = (p.images || []).filter((url: string) => url && url.startsWith('http'));

            if (imagesDataValides.length > 0) {
              const existingImages: ProductImage[] = imagesDataValides.map((img: any, i: number) => ({
                id: `existing-${i}-${Date.now()}`,
                url: img.url,
                filename: img.filename || 'image.jpg',
                altText: img.altText || '',
                rotation: img.rotation || 0,
                isExisting: true,
                isUploading: false,
              }));
              setProductImages(existingImages);
              console.log(`📷 ${existingImages.length} images chargées depuis images_data`);
            } else if (imagesUrlsValides.length > 0) {
              const existingImages: ProductImage[] = imagesUrlsValides.map((url: string, i: number) => ({
                id: `existing-${i}-${Date.now()}`,
                url,
                altText: nomProduit.trim() || '',
                rotation: 0,
                isExisting: true,
                isUploading: false,
              }));
              setProductImages(existingImages);
              console.log(`📷 ${existingImages.length} images chargées depuis images[]`);
            } else if (p.image && p.image.startsWith('http')) {
              // Dernier fallback : image principale seulement
              setProductImages([{
                id: `existing-0-${Date.now()}`,
                url: p.image,
                altText: nomProduit.trim() || p.nom || '',
                rotation: 0,
                isExisting: true,
                isUploading: false,
              }]);
              console.log('📷 1 image chargée depuis image principale');
            }
            
            if (p.options && Array.isArray(p.options)) {
              setOptions(p.options.map((opt: any) => ({
                id: opt.id,
                nom: opt.nom,
                valeurs: opt.valeurs || []
              })));
            }
            
            if (p.variants && Array.isArray(p.variants)) {
              setVariants(p.variants.map((v: any) => ({
                id:          String(v.id),
                combinaison: v.combinaison,
                prix:        String(v.prix),
                quantite:    String(v.quantite),
                sku:         v.sku || '',
                poids:       v.poids ? String(v.poids) : '',
                codeBarres:  v.code_barres || '',
                image:       v.image_url || v.image || '',
              })));
            }

            // ✅ Les méthodes d'expédition sont chargées dans le useEffect des méthodes vendeur
          }
        } catch (e) {
          console.error('Erreur chargement produit:', e);
        } finally {
          setChargementInitial(false);
        }
      };
      chargerProduit();
    } else if (!modeModifier) {
      setChargementInitial(false);
    }
  }, [modeModifier, produitId, categories]);

  // ===== MODE DUPLICATION =====
  useEffect(() => {
    if (!modeDupliquer || !dupliquerDeId) return;
    const chargerProduitADupliquer = async () => {
      setChargementInitial(true);
      try {
        const res = await fetch(`${API_BASE}/creer-annonce/${dupliquerDeId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Annonce source introuvable');
        const data = await res.json();
        const p = data.produit;

        // Nom modifié
        setNomProduit(`Copie de ${p.nom || ''}`);
        setDescription(p.description || '');
        setPrix(p.prix ? String(p.prix) : '');
        setPrixOriginal(p.prix_original ? String(p.prix_original) : '');
        setPrixRevient(p.prix_revient ? String(p.prix_revient) : '');
        setQuantite(p.stock ? String(p.stock) : '0');
        setSku(''); // SKU vide pour éviter doublons
        setCodeBarres(p.code_barres || '');
        setMarque(p.marque || '');
        setModele(p.modele || '');
        setPoids(p.poids ? String(p.poids) : '');
        setHauteur(p.hauteur ? String(p.hauteur) : '');
        setLargeur(p.largeur ? String(p.largeur) : '');
        setLongueur(p.longueur ? String(p.longueur) : '');
        setTypeAnnonce(p.type_annonce || 'neuf');
        const etatMapping: Record<string, string> = {
          'neuf': "1. Neuf / Jamais utilisé – L'article est neuf dans son emballage d'origine",
          'comme-neuf': '2. Comme neuf – Utilisé une ou deux fois en excellent état',
          'tres-bon': '3. Très bon état – Quelques signes mineurs d\'usure mais fonctionne parfaitement',
          'bon': '4. Bon état – L\'article a été utilisé mais reste en bon état général',
          'correct': '5. État correct – Présente des marques d\'usure visibles mais fonctionne',
          'use': '6. Usé / Bien utilisé – L\'article fonctionne mais montre des signes d\'usage importants',
          'a-reparer': '7. À réparer – Ne fonctionne pas ou endommagé - peut être réparé',
          'pieces': '8. Pour pièces – Non fonctionnel - vendu pour récupérer des pièces'
        };
        setEtatArticle(etatMapping[p.etat] || p.etat || etatMapping['neuf']);
        setRetourOffert(p.retour_offert || 'non aucun retour accepté vente finale');
        setGarantieOfferte(p.garantie || 'aucune');
        setPaysFabrication(p.pays_fabrication || '');
        setLienYoutube(p.lien_youtube || '');
        setAdresseVente(p.adresse_vente || '');
        setFormats(p.formats || '');
        setSuiviInventaire(p.suivi_inventaire || 'suivre');
        setQuantiteMinimum(p.quantite_minimum ? String(p.quantite_minimum) : '1');
        setTypeProduit(p.produit_numerique ? 'numerique' : 'physique');
        // ===== CHAMPS PRODUIT NUMÉRIQUE =====
        if (p.produit_numerique) {
          setProduitNumeriqueType((p.produit_numerique_type as ProduitNumeriqueType) || 'fichier');
          setLienNumerique(p.lien_numerique || '');
          setJoursAccessibles(p.jours_accessibles ? String(p.jours_accessibles) : '0');
          setNombreTelechargements(p.telechargements_max ? String(p.telechargements_max) : '0');
        }
        setVille(p.ville || 'CANADA');
        if (p.canaux_vente) setCanauxVente(p.canaux_vente);
        if (p.mode_expedition) setModeExpeditionOffert(p.mode_expedition);
        if (p.tags && Array.isArray(p.tags)) setTagsSelectionnes(p.tags);

        // Catégories
        if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
          setCategoriesSelectionnees(p.categories.map((c: any) => ({ id: String(c.id), nom: c.nom })));
        } else if (p.categorie_id) {
          const found = categories.find(cat => cat.id === String(p.categorie_id));
          if (found) setCategoriesSelectionnees([found]);
        }

        // Images — on charge les URLs existantes (S3)
        const dupImagesData = (p.images_data || []).filter((img: any) => img && img.url && img.url.startsWith('http'));
        const dupImagesUrls = (p.images || []).filter((url: string) => url && url.startsWith('http'));

        if (dupImagesData.length > 0) {
          setProductImages(dupImagesData.map((img: any, i: number) => ({
            id: `dup-${i}-${Date.now()}`,
            url: img.url,
            filename: img.filename || `image-${i}.jpg`,
            altText: img.altText || '',
            rotation: img.rotation || 0,
            isExisting: true,
            isUploading: false,
          })));
        } else if (dupImagesUrls.length > 0) {
          setProductImages(dupImagesUrls.map((url: string, i: number) => ({
            id: `dup-${i}-${Date.now()}`,
            url,
            altText: '',
            rotation: 0,
            isExisting: true,
            isUploading: false,
          })));
        } else if (p.image && p.image.startsWith('http')) {
          setProductImages([{
            id: `dup-0-${Date.now()}`,
            url: p.image,
            altText: '',
            rotation: 0,
            isExisting: true,
            isUploading: false,
          }]);
        }

        // Options et variantes
        if (p.options && Array.isArray(p.options)) {
          setOptions(p.options.map((opt: any) => ({
            id: `opt-dup-${opt.id || Date.now()}`,
            nom: opt.nom,
            valeurs: (opt.valeurs || []).map((v: any) => ({ id: `val-dup-${v.id || Date.now()}`, valeur: v.valeur }))
          })));
        }
        if (p.variants && Array.isArray(p.variants)) {
          setVariants(p.variants.map((v: any, i: number) => ({
            id: `var-dup-${i}-${Date.now()}`,
            combinaison: v.combinaison,
            prix: String(v.prix || ''),
            quantite: String(v.quantite || ''),
            sku: '',
            poids: v.poids ? String(v.poids) : '',
            codeBarres: '',
            image: v.image_url || v.image || '',
          })));
        }
      } catch (e) {
        console.error('Erreur chargement duplication:', e);
      } finally {
        setChargementInitial(false);
      }
    };
    chargerProduitADupliquer();
  }, [modeDupliquer, dupliquerDeId, categories]);

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

  useEffect(() => {
    if (options.length > 0 && prix) {
      const combinaisons = generateCombinations();
      const newVariants = combinaisons.map(comb => {
        const existingVariant = variants.find(v =>
          Object.keys(comb).every(key => v.combinaison[key] === comb[key])
        );

        return {
          id: existingVariant?.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          combinaison: comb,
          // ← Conserve le prix saisi par variante; n'utilise le prix général QUE si vide
          prix:       (existingVariant?.prix && existingVariant.prix !== '') ? existingVariant.prix : prix,
          quantite:   (existingVariant?.quantite && existingVariant.quantite !== '') ? existingVariant.quantite : quantite,
          sku:        existingVariant?.sku        || '',
          poids:      existingVariant?.poids      || poids,
          codeBarres: existingVariant?.codeBarres || '',
          image:      existingVariant?.image      || '',
          attachment: existingVariant?.attachment || undefined,
          filename:   existingVariant?.filename   || undefined,
          imageFile:  existingVariant?.imageFile  || undefined,
        };
      });
      setVariants(newVariants);
    }
  }, [options, prix, quantite, poids]);

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

  const handleVariantImageUpload = async (variantId: string, file: File) => {
    // Upload sur S3 exactement comme les photos produit
    const result = await uploadImageToS3(file);
    if (result) {
      setVariants(variants.map(v =>
        v.id === variantId ? {
          ...v,
          image:    result.url,
          filename: result.filename,
          imageFile: file
        } : v
      ));
    }
  };

  const appliquerPrixParDefaut = () => {
    setVariants(variants.map(v => ({ ...v, prix: prixParDefaut })));
  };

  const appliquerPoidsParDefaut = () => {
    setVariants(variants.map(v => ({ ...v, poids: poidsParDefaut })));
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (productImages.length + files.length > 9) {
      alert('Vous ne pouvez télécharger que 9 images maximum');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `img-${Date.now()}-${i}`;
      
      setProductImages(prev => [...prev, {
        id: tempId,
        file,
        url: '',
        altText: nomProduit.trim() || '',
        rotation: 0,
        isUploading: true
      }]);

      const result = await uploadImageToS3(file);

      if (result) {
        setProductImages(prev => prev.map(img =>
          img.id === tempId
            ? { 
                ...img, 
                url: result.url, 
                filename: result.filename,
                isUploading: false 
              }
            : img
        ));
        console.log(`✅ Image prête — URL S3: ${result.url}`);
      } else {
        setProductImages(prev => prev.filter(img => img.id !== tempId));
        alert(`❌ L'image "${file.name}" n'a pas pu être uploadée. Réessayez.`);
      }
    }

    e.target.value = '';
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

      const tempId = selectedImage.id;
      
      setProductImages(prev => prev.map(img =>
        img.id === tempId
          ? { ...img, isUploading: true }
          : img
      ));

      const result = await uploadImageToS3(croppedFile);

      if (result) {
        setProductImages(prev => prev.map(img =>
          img.id === tempId
            ? {
                ...img,
                file: croppedFile,
                url: result.url,
                filename: result.filename,
                width: croppedAreaPixels.width,
                height: croppedAreaPixels.height,
                isUploading: false
              }
            : img
        ));
        console.log('✅ Image recadrée uploadée sur S3');
      } else {
        alert('❌ Erreur lors de l\'upload de l\'image recadrée. Réessayez.');
      }

      setCropModalOpen(false);
      setCropImage(null);
    } catch (error) {
      console.error('Erreur crop:', error);
      alert('Erreur lors du recadrage de l\'image');
    }
  };

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

  const handleFichierNumeriqueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFichierError('');

    if (file.size > 50 * 1024 * 1024) {
      setFichierError('⚠️ FICHIER TROP GROS - DÉPASSE 50 Mo ⚠️ Veuillez plutôt utiliser le type "Produit numérique comme lien" pour les fichiers volumineux.');
      setFichierNumerique(null);
      return;
    }

    setFichierNumerique(file);
    setFichierError('⏳ Upload en cours...');

    // Upload vers S3 via /api/upload-fichier-numerique
    try {
      const formData = new FormData();
      formData.append('fichier', file);

      const response = await fetch(`${API_BASE}/upload-fichier-numerique`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erreur upload fichier');
      }

      const data = await response.json();
      if (!data.fichier_url) throw new Error('URL du fichier invalide');

      setLienNumerique(data.fichier_url);
      setFichierError('');
      console.log('✅ Fichier numérique hébergé:', data.fichier_url);
    } catch (err: any) {
      setFichierError(`❌ Erreur upload : ${err.message}`);
      setFichierNumerique(null);
    }
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

      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toastMsg.startsWith('❌') ? '#d32f2f' : '#388e3c',
          color: 'white', padding: '12px 20px', borderRadius: '8px',
          fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>{toastMsg}</div>
      )}

      {chargementInitial ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #537373', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#537373', fontWeight: '600' }}>Chargement de l'annonce...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
      <>
      {/* ── Bannière limite de plan ─────────────────────────────────────────── */}
      {!modeModifier && planVendeur && planVendeur.limiter_produits && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 12px' }}>
          {!planVendeur.peut_creer_produit ? (
            // BLOQUÉ — limite atteinte
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              backgroundColor: '#fee2e2', border: '1.5px solid #dc2626',
              borderRadius: '10px', padding: '16px 20px',
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>🚫</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#991b1b', margin: '0 0 4px 0' }}>
                  Limite d'annonces atteinte
                </p>
                <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 4px 0', lineHeight: '1.5' }}>
                  Votre plan <strong>{planVendeur.emoji_plan} {planVendeur.nom_plan}</strong> permet{' '}
                  <strong>{planVendeur.limite_produits} annonce{planVendeur.limite_produits !== 1 ? 's' : ''}</strong> maximum.
                  Vous en avez actuellement <strong>{planVendeur.nb_produits_actifs}</strong> actives.
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  Supprimez une annonce existante ou passez à un plan supérieur pour continuer.
                </p>
              </div>
            </div>
          ) : planVendeur.produits_restants !== null && planVendeur.produits_restants <= 3 ? (
            // AVERTISSEMENT — proche de la limite
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              backgroundColor: '#fef9c3', border: '1.5px solid #d97706',
              borderRadius: '10px', padding: '16px 20px',
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#92400e', margin: '0 0 4px 0' }}>
                  Limite bientôt atteinte
                </p>
                <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' }}>
                  Il vous reste <strong>{planVendeur.produits_restants} emplacement{planVendeur.produits_restants > 1 ? 's' : ''}</strong> sur{' '}
                  <strong>{planVendeur.limite_produits}</strong> dans votre plan{' '}
                  <strong>{planVendeur.emoji_plan} {planVendeur.nom_plan}</strong>.
                </p>
              </div>
            </div>
          ) : (
            // INFO — quota affiché discrètement
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              backgroundColor: '#e8f2fb', border: '1px solid #2d6a9f40',
              borderRadius: '8px', padding: '10px 16px',
            }}>
              <span style={{ fontSize: '14px' }}>📊</span>
              <p style={{ fontSize: '12px', color: '#2d6a9f', margin: 0, fontWeight: '600' }}>
                Plan <strong>{planVendeur.emoji_plan} {planVendeur.nom_plan}</strong> :{' '}
                {planVendeur.nb_produits_actifs} / {planVendeur.limite_produits} annonces utilisées
                {planVendeur.produits_restants !== null && (
                  <> — <strong>{planVendeur.produits_restants} restante{planVendeur.produits_restants !== 1 ? 's' : ''}</strong></>
                )}
              </p>
            </div>
          )}
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}

      <Page
        title={modeModifier ? "✏️ Modifier l'annonce" : modeDupliquer ? "📋 Dupliquer l'annonce" : "➕ Créer une annonce"}
        subtitle={modeModifier ? "Modifiez les informations de votre annonce." : modeDupliquer ? "Tous les champs sont pré-remplis depuis l'annonce originale. Modifiez ce que vous souhaitez puis cliquez sur Enregistrer." : "Ici vous pouvez ajouter des produits dans votre boutique e-Vend."}
      >
        <div className="creerannonce-layout">
          
          {/* COLONNE GAUCHE 60% */}
          <div className="creerannonce-col-left">
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '10px',
                  marginBottom: '20px',
                  width: '100%',
                }}>
                  
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
                          {image.isUploading ? (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#f0f0f0'
                            }}>
                              <div>⏳</div>
                            </div>
                          ) : (
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
                          )}
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
                        {options.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            Aucune variante. Cliquez sur + pour ajouter des options (couleur, taille, etc.)
                          </div>
                        ) : (
                          options.map((option, optIndex) => (
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
                                  <input
                                    type="text"
                                    value={option.nom}
                                    onChange={(e) => mettreAJourNomOption(option.id, e.target.value)}
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      padding: '4px 8px',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      backgroundColor: '#fff'
                                    }}
                                  />
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
                          ))
                        )}

                        {!showAddOption ? (
                          <div style={{ marginTop: '16px' }}>
                            <Button 
                              variant="primary" 
                              onClick={() => setShowAddOption(true)}
                            >
                              + Ajouter une option
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

                    {variantView === 'table' && variants.length === 0 && options.length > 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#637381', fontSize: '13px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #ddd' }}>
                        ⚠️ Entrez un prix pour générer le tableau des variantes
                      </div>
                    )}
                    {variantView === 'table' && variants.length > 0 && (
                      <div>
                        {options.length > 0 && (
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
                        )}

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

              {/* 5. Détails supplémentaires */}
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
                      { label: '1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine', value: '1. Neuf / Jamais utilisé – L\'article est neuf dans son emballage d\'origine' },
                      { label: '2. Comme neuf – Utilisé une ou deux fois en excellent état', value: '2. Comme neuf – Utilisé une ou deux fois en excellent état' },
                      { label: '3. Très bon état – Quelques signes mineurs d\'usure mais fonctionne parfaitement', value: '3. Très bon état – Quelques signes mineurs d\'usure mais fonctionne parfaitement' },
                      { label: '4. Bon état – L\'article a été utilisé mais reste en bon état général', value: '4. Bon état – L\'article a été utilisé mais reste en bon état général' },
                      { label: '5. État correct – Présente des marques d\'usure visibles mais fonctionne', value: '5. État correct – Présente des marques d\'usure visibles mais fonctionne' },
                      { label: '6. Usé / Bien utilisé – L\'article fonctionne mais montre des signes d\'usage importants', value: '6. Usé / Bien utilisé – L\'article fonctionne mais montre des signes d\'usage importants' },
                      { label: '7. À réparer – Ne fonctionne pas ou endommagé - peut être réparé', value: '7. À réparer – Ne fonctionne pas ou endommagé - peut être réparé' },
                      { label: '8. Pour pièces – Non fonctionnel - vendu pour récupérer des pièces', value: '8. Pour pièces – Non fonctionnel - vendu pour récupérer des pièces' },
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
                      { label: 'Non, aucun retour accepté vente finale', value: 'non aucun retour accepté vente finale' },
                      { label: 'Oui, retour sous 30 jours après date achat', value: 'oui retour sous 30 jours après date achat' },
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

          {/* COLONNE DROITE 40% */}
          <div className="creerannonce-col-right">
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
                          {!fichierNumerique && lienNumerique && lienNumerique.startsWith('http') && (
                            <p style={{ marginTop: '8px', fontSize: '13px', color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '4px', border: '1px solid #a5d6a7' }}>
                              ✅ Fichier déjà hébergé — {lienNumerique.split('/').pop()}
                              <br /><span style={{ fontSize: '11px', color: '#666' }}>Vous pouvez remplacer le fichier en sélectionnant un nouveau.</span>
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

              {/* Détails des prix */}
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

                  {/* ===== TAXES — comportement contrôlé par l'admin ===== */}
                  <div style={{
                    pointerEvents: modeTaxeConfig !== 'libre' ? 'none' : 'auto',
                    opacity: modeTaxeConfig !== 'libre' ? 0.55 : 1,
                    userSelect: 'none',
                  }}>
                    <Checkbox
                      label={
                        modeTaxeConfig === 'force_taxable'
                          ? 'Facturer des taxes sur ce produit 🔒 (imposé par l\'administrateur)'
                          : modeTaxeConfig === 'force_non_taxable'
                          ? 'Facturer des taxes sur ce produit 🔒 (désactivé par l\'administrateur)'
                          : 'Facturer des taxes sur ce produit'
                      }
                      checked={facturationTaxes}
                      onChange={(checked) => {
                        if (modeTaxeConfig === 'libre') setFacturationTaxes(checked);
                      }}
                    />
                  </div>
                </BlockStack>
              </div>

              {/* ===== NOUVEAU : CANAUX DE VENTE ===== */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  🏪 Canaux de vente
                  <HelpIcon text="Choisissez où ce produit sera disponible à la vente." />
                </div>
                <p style={sectionSubtitleStyle}>Sélectionnez les canaux de vente pour ce produit.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: canauxVente.boutique_en_ligne ? '#e8f5e9' : '#f5f5f5',
                    borderRadius: '8px',
                    border: canauxVente.boutique_en_ligne ? '1px solid #4caf50' : '1px solid #ddd'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>🛍️ Boutique en ligne</span>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Visible sur votre boutique e-Vend</p>
                    </div>
                    <div 
                      onClick={() => setCanauxVente({...canauxVente, boutique_en_ligne: !canauxVente.boutique_en_ligne})}
                      style={{
                        width: '44px',
                        height: '24px',
                        backgroundColor: canauxVente.boutique_en_ligne ? '#4caf50' : '#ccc',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: '0.3s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: canauxVente.boutique_en_ligne ? '22px' : '2px',
                        transition: '0.3s'
                      }} />
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: canauxVente.point_de_vente ? '#e8f5e9' : '#f5f5f5',
                    borderRadius: '8px',
                    border: canauxVente.point_de_vente ? '1px solid #4caf50' : '1px solid #ddd'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>📍 Point de vente (POS)</span>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Disponible dans vos magasins physiques</p>
                    </div>
                    <div 
                      onClick={() => setCanauxVente({...canauxVente, point_de_vente: !canauxVente.point_de_vente})}
                      style={{
                        width: '44px',
                        height: '24px',
                        backgroundColor: canauxVente.point_de_vente ? '#4caf50' : '#ccc',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: '0.3s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: canauxVente.point_de_vente ? '22px' : '2px',
                        transition: '0.3s'
                      }} />
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
                  La boutique en ligne est activée par défaut
                </p>
              </div>

              {/* Détails d'expédition */}
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
                        Méthodes d'expédition disponibles pour ce produit
                        <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                        <HelpIcon text="Sélectionnez les méthodes d'expédition que vous offrez pour ce produit. Configurez vos méthodes dans Paramètres → Expédition." />
                      </span>
                    </p>
                    {typeProduit === 'numerique' ? (
                      <p style={{ fontSize: '13px', color: '#666' }}>Produit numérique — pas d'expédition physique.</p>
                    ) : methodesVendeur.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* ✅ Free shipping par défaut si aucune méthode configurée */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', borderRadius: '10px',
                          border: '2px solid #008060', background: '#f0fdf4',
                        }}>
                          <input type="checkbox" checked readOnly
                            style={{ width: '16px', height: '16px', accentColor: '#008060' }} />
                          <span style={{ fontSize: '20px' }}>🎁</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>Livraison gratuite</p>
                            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Appliquée par défaut — configurez vos méthodes dans Paramètres</p>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#008060', background: '#f0fdf4', padding: '3px 10px', borderRadius: '20px' }}>
                            Gratuit
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                          💡 Ajoutez vos méthodes dans <strong>Paramètres → Méthodes d'expédition</strong> pour plus d'options.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {methodesVendeur.map((m: any) => {
                          const transporteursNoms: Record<number, { nom: string; logo: string }> = {
                            1: { nom: 'Canada Post / Postes Canada', logo: '📮' },
                            2: { nom: 'Purolator', logo: '🚚' },
                            3: { nom: 'FedEx Canada', logo: '✈️' },
                            4: { nom: 'UPS Canada', logo: '📦' },
                            5: { nom: 'Intelcom Courrier', logo: '📬' },
                            6: { nom: 'DHL Express Canada', logo: '🌍' },
                            7: { nom: 'GLS Canada', logo: '🚛' },
                            8: { nom: 'CanPar', logo: '🇨🇦' },
                            9: { nom: 'Loomis Express', logo: '📦' },
                            10: { nom: 'Transport A. Bélanger', logo: '🚚' },
                            11: { nom: 'Groupe Robert', logo: '🏭' },
                            12: { nom: 'Livraison locale', logo: '🛵' },
                            13: { nom: 'Ramassage sur place', logo: '🏪' },
                            14: { nom: 'Livraison gratuite', logo: '🎁' },
                          };
                          const t = transporteursNoms[m.transporteur_id] || { nom: 'Expédition', logo: '📦' };
                          const estSelectionne = methodesSelectionnees.includes(m.id);
                          const gratuit = (parseFloat(m.frais_fixes) || 0) === 0;
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setMethodesSelectionnees(prev =>
                                  prev.includes(m.id)
                                    ? prev.filter(id => id !== m.id)
                                    : [...prev, m.id]
                                );
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 16px', borderRadius: '10px',
                                border: `2px solid ${estSelectionne ? '#008060' : '#e1e3e5'}`,
                                background: estSelectionne ? '#f0fdf4' : '#fff',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={estSelectionne}
                                onChange={() => {}}
                                style={{ width: '16px', height: '16px', accentColor: '#008060', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '20px' }}>{t.logo}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{t.nom}</p>
                                {m.delais_estime && (
                                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>⏱ {m.delais_estime}</p>
                                )}
                              </div>
                              <span style={{
                                fontSize: '13px', fontWeight: 700,
                                color: gratuit ? '#008060' : '#1a1a1a',
                                background: gratuit ? '#f0fdf4' : '#f5f5f5',
                                padding: '3px 10px', borderRadius: '20px',
                              }}>
                                {gratuit ? 'Gratuit' : `${parseFloat(m.frais_fixes).toFixed(2)} $`}
                              </span>
                            </div>
                          );
                        })}
                        {methodesSelectionnees.length === 0 && (
                          <p style={{ fontSize: '12px', color: '#d72c0d', margin: '4px 0 0' }}>
                            Sélectionnez au moins une méthode d'expédition.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </BlockStack>
              </div>

              {/* Catégories */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  📂 Catégories <span style={{ color: 'red', fontSize: '16px', marginLeft: '2px' }}>*</span>
                  <HelpIcon text="Ajoutez ce produit à une ou plusieurs catégories pour le regrouper avec des produits similaires." />
                </div>
                <p style={sectionSubtitleStyle}>
                  Ajoutez ce produit à une catégorie afin qu'il soit facile à trouver dans votre magasin.
                </p>
                
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

              {/* Tags */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  🏷️ Tags
                  <HelpIcon text="Ajoutez des tags à votre produit pour faciliter la recherche." />
                </div>
                <p style={sectionSubtitleStyle}>
                  Ajoutez des tags à votre produit (optionnel, max 5).
                </p>
                
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

              {/* Date de parution */}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: planVendeur && !planVendeur.publicationFuture ? 0.5 : 1 }}>
                    <input
                      type="radio"
                      id="parutionFuture"
                      name="typeParution"
                      checked={typeParution === 'future'}
                      onChange={() => { if (!planVendeur || planVendeur.publicationFuture) setTypeParution('future'); }}
                      disabled={planVendeur !== null && !planVendeur.publicationFuture}
                    />
                    <label htmlFor="parutionFuture" style={{ fontSize: '13px', color: planVendeur && !planVendeur.publicationFuture ? '#9ca3af' : '#333', cursor: planVendeur && !planVendeur.publicationFuture ? 'not-allowed' : 'pointer' }}>
                      {planVendeur && !planVendeur.publicationFuture ? '🔒 ' : ''}Parution future <span style={{ color: 'red', fontSize: '14px', marginLeft: '2px' }}>*</span>
                      {planVendeur && !planVendeur.publicationFuture && (
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>— Non inclus dans votre plan</span>
                      )}
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

              {/* ─── Make Offer ────────────────────────────────────────────────────────── */}
              {(() => {
                // L'admin désactive globalement OU désactive la config par vendeur
                const adminBloque = makeOfferConfigAdmin !== null && (
                  !makeOfferConfigAdmin.make_offer_actif || !makeOfferConfigAdmin.permettre_vendeur_configurer
                );
                const prixMinPourcentage = makeOfferConfigAdmin?.offre_min_pourcentage ?? 30;
                const prixActuel = parseFloat(prix) || 0;
                const prixMinCalcule = prixActuel > 0 ? (prixActuel * prixMinPourcentage / 100).toFixed(2) : null;

                return (
                  <div style={{
                    ...sectionStyle,
                    position: 'relative',
                    opacity: adminBloque ? 0.55 : 1,
                    userSelect: adminBloque ? 'none' : 'auto',
                  }}>
                    {/* Overlay de blocage si admin désactive */}
                    {adminBloque && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        borderRadius: '8px', cursor: 'not-allowed',
                        background: 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.04) 12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          backgroundColor: 'white', borderRadius: '10px', padding: '10px 18px',
                          border: '2px solid #fcd34d', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span style={{ fontSize: '18px' }}>🔒</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
                            {!makeOfferConfigAdmin?.make_offer_actif
                              ? "Make Offer est désactivé par l'administrateur"
                              : "L'administrateur ne permet pas la configuration par annonce"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={sectionTitleStyle}>
                      💬 Make Offer — Faire une offre
                      <HelpIcon text="Permet aux acheteurs de proposer un prix. Vous recevrez un courriel et pourrez accepter ou refuser depuis votre tableau de bord." />
                    </div>
                    <p style={sectionSubtitleStyle}>
                      Laissez les acheteurs vous proposer un prix pour ce produit.
                    </p>

                    {/* Toggle principal */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', backgroundColor: makeOfferEnabled ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '10px', border: `1px solid ${makeOfferEnabled ? '#bbf7d0' : '#e1e4e8'}`,
                      marginBottom: '16px', pointerEvents: adminBloque ? 'none' : 'auto',
                      transition: 'all 0.2s',
                    }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a2332', margin: '0 0 2px' }}>
                          Activer Make Offer pour cette annonce
                        </p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          Un encadré "Faire une offre" apparaîtra sur la page produit
                        </p>
                      </div>
                      <div
                        onClick={() => !adminBloque && setMakeOfferEnabled(!makeOfferEnabled)}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px',
                          backgroundColor: makeOfferEnabled ? '#16a34a' : '#d1d5db',
                          cursor: adminBloque ? 'not-allowed' : 'pointer',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '16px',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '2px', left: makeOfferEnabled ? '22px' : '2px',
                          width: '20px', height: '20px', borderRadius: '50%',
                          backgroundColor: 'white', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </div>

                    {/* Options avancées — visibles seulement si Make Offer activé */}
                    {makeOfferEnabled && !adminBloque && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Prix minimum */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Prix minimum accepté ($) — optionnel
                            <HelpIcon text={`Si défini, les offres en dessous de ce montant seront automatiquement rejetées par le widget. L'admin a configuré un minimum de ${prixMinPourcentage}% du prix.`} />
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#6b7280', fontSize: '14px' }}>$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={makeOfferPrixMin}
                              onChange={e => setMakeOfferPrixMin(e.target.value)}
                              placeholder={prixMinCalcule ? `Min. suggéré : ${prixMinCalcule} $` : 'Ex : 35.00'}
                              style={{
                                width: '100%', padding: '10px 12px 10px 28px',
                                border: '1px solid #e1e4e8', borderRadius: '8px',
                                fontSize: '13px', boxSizing: 'border-box', outline: 'none',
                              }}
                            />
                          </div>
                          {prixMinCalcule && (
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                              💡 Minimum suggéré par la plateforme ({prixMinPourcentage}% de {prix} $) : <strong>{prixMinCalcule} $</strong>
                            </p>
                          )}
                        </div>

                        {/* Auto-acceptation — visible seulement si l'admin le permet */}
                        {makeOfferConfigAdmin?.permettre_vendeur_auto_accept !== false && (
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', backgroundColor: makeOfferAutoAccept ? '#fffbeb' : '#f8fafc',
                            borderRadius: '10px', border: `1px solid ${makeOfferAutoAccept ? '#fcd34d' : '#e1e4e8'}`,
                            transition: 'all 0.2s',
                          }}>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a2332', margin: '0 0 2px' }}>
                                ⚡ Acceptation automatique
                              </p>
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                                Accepte automatiquement toute offre atteignant le prix minimum défini ci-dessus
                              </p>
                            </div>
                            <div
                              onClick={() => setMakeOfferAutoAccept(!makeOfferAutoAccept)}
                              style={{
                                width: '44px', height: '24px', borderRadius: '12px',
                                backgroundColor: makeOfferAutoAccept ? '#d97706' : '#d1d5db',
                                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                flexShrink: 0, marginLeft: '16px',
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: '2px', left: makeOfferAutoAccept ? '22px' : '2px',
                                width: '20px', height: '20px', borderRadius: '50%',
                                backgroundColor: 'white', transition: 'left 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              }} />
                            </div>
                          </div>
                        )}

                        {/* Note d'info */}
                        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px' }}>
                          <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>
                            💡 Les acheteurs verront un encadré "Faire une offre" sous le bouton Ajouter au panier. Vous recevrez un courriel pour chaque offre reçue et pourrez répondre depuis <strong>Mes offres reçues</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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

        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <Button variant="primary" tone="success" onClick={() => handleEnregistrer('actif')} loading={sauvegardeEnCours} disabled={!modeModifier && planVendeur !== null && !planVendeur.peut_creer_produit}>
            ✅ {modeModifier ? 'Enregistrer les modifications' : modeDupliquer ? 'Créer la copie' : 'Enregistrer et publier'}
          </Button>
          <Button onClick={() => handleEnregistrer('brouillon')} disabled={sauvegardeEnCours}>
            📝 Enregistrer comme brouillon
          </Button>
          <Button variant="plain" tone="critical" onClick={() => naviguerRetour()} disabled={sauvegardeEnCours}>
            Annuler
          </Button>
        </div>

      </Page>
      </>
      )}
    </div>
  );
}

export default CreerAnnonce;
