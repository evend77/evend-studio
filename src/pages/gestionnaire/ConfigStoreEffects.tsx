// e-Vend Studio — Configuration des Effets Visuels (Store Effects)
// Version inspirée de Dakaas avec chaque effet dans son encadré + toggle
// Tous les effets sont accessibles (app payante)

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const PRIMARY = '#8B5CF6';
const PRIMARY_LIGHT = '#EDE9FE';
const PRIMARY_DARK = '#5B21B6';

// ─── TYPES ──────────────────────────────────────────────────────────────

interface StoreEffectsConfig {
  actif: boolean;
  effetMagasin: string | null;
  effetMagasinSettings: {
    intensite?: 'faible' | 'moyen' | 'eleve';
    couleur1?: string;
    couleur2?: string;
    couleur3?: string;
    quantite?: number;
    taille?: number;
    vitesse?: number;
    animation3D?: boolean;
    customText?: string;
    customImage?: string;
    customEmoji?: string;
    spiderColor?: string;
    webColor?: string;
    showWebs?: boolean;
    pumpkinCount?: number;
    batCount?: number;
    bulbColors?: string[];
    animationStyle?: 'twinkle' | 'sparkle' | 'static';
    direction?: 'gauche-droite' | 'droite-gauche';
    showAnimation?: boolean;
    decorationSize?: number;
  };
  curseur: string | null;
  curseurSettings: {
    couleur?: string;
    taille?: number;
    enableMobile?: boolean;
    customEmoji?: string;
    customText?: string;
    imageUrl?: string;
    trailLength?: number;
  };
  musique: string | null;
  musiqueSettings: {
    url?: string;
    autoPlay?: boolean;
    volume?: number;
    loop?: boolean;
    position?: 'bas-gauche' | 'bas-droite' | 'haut-gauche' | 'haut-droite';
    backgroundColor?: string;
    message?: string;
    iconRounded?: number;
  };
  decoration: string | null;
  decorationSettings: {
    animationStyle?: 'twinkle' | 'sparkle' | 'static' | 'slide';
    couleurs?: string[];
    quantite?: number;
    enable3D?: boolean;
    showAnimation?: boolean;
    direction?: 'gauche-droite' | 'droite-gauche';
    taille?: number;
    spiderColor?: string;
    webColor?: string;
    showWebs?: boolean;
    decorationSize?: number;
  };
  addToCart: string | null;
  addToCartSettings: {
    showOnlyFirstAdd?: boolean;
    triggerAmount?: number;
    allProducts?: boolean;
    specificProducts?: string[];
    specificCollections?: string[];
    customColor?: string;
    taille?: 'petit' | 'moyen' | 'grand';
  };
  scrollToTop: {
    enabled: boolean;
    couleur?: string;
    couleurSurvol?: string;
    icone?: string;
    animationStyle?: 'lineaire' | 'doux' | 'rebond';
    position?: 'bas-droite' | 'bas-gauche';
  };
  tabAnimation: {
    enabled: boolean;
    faviconMode?: 'emoji' | 'site';
    faviconEmoji?: string;
    animationStyle?: 'clignotant' | 'defilement' | 'saisie';
    messages: string[];
  };
}

// ─── COMPOSANTS UI ──────────────────────────────────────────────────────

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <div
    onClick={() => onChange(!value)}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      userSelect: 'none'
    }}
  >
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? PRIMARY : '#d1d5db',
        transition: 'background 0.25s',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          transition: 'left 0.25s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
    {label && <span style={{ fontSize: 13, color: '#555' }}>{label}</span>}
  </div>
);

const Select = ({ value, onChange, options, placeholder }: any) => (
  <select
    value={value ?? ''}
    onChange={(e: any) => onChange(e.target.value || null)}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1.5px solid #e5e7eb',
      borderRadius: 6,
      fontSize: 13,
      outline: 'none',
      background: '#fff',
      color: '#1a1a1a',
      boxSizing: 'border-box',
      cursor: 'pointer'
    }}
    onFocus={(e: any) => e.target.style.borderColor = PRIMARY}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'}
  >
    <option value="">{placeholder || '— Aucun —'}</option>
    {options.map((opt: any) => (
      <option key={opt.value} value={opt.value}>
        {opt.emoji || ''} {opt.label}
      </option>
    ))}
  </select>
);

const ColorPicker = ({ value, onChange, label }: { value?: string; onChange: (v: string) => void; label?: string }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {label && <span style={{ fontSize: 12, color: '#666' }}>{label}</span>}
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 40,
        height: 36,
        padding: 2,
        border: '1.5px solid #e5e7eb',
        borderRadius: 6,
        cursor: 'pointer',
        background: 'transparent'
      }}
    />
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="#000000"
      style={{
        flex: 1,
        padding: '8px 12px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 6,
        fontSize: 13,
        outline: 'none',
        background: '#fff',
        color: '#1a1a1a',
        boxSizing: 'border-box'
      }}
    />
  </div>
);

const Inp = ({ value, onChange, placeholder, type = 'text', ...props }: any) => (
  <input
    type={type}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e: any) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1.5px solid #e5e7eb',
      borderRadius: 6,
      fontSize: 13,
      outline: 'none',
      background: '#fff',
      color: '#1a1a1a',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s'
    }}
    onFocus={(e: any) => e.target.style.borderColor = PRIMARY}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'}
    {...props}
  />
);

const F = ({ label, children, aide }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
      {label}
    </label>
    {children}
    {aide && <p style={{ fontSize: 11, color: '#999', marginTop: 4, marginBottom: 0 }}>{aide}</p>}
  </div>
);

// ─── COMPOSANT EFFET CARD ─────────────────────────────────────────────

interface EffectCardProps {
  id: string;
  nom: string;
  description: string;
  icone: string;
  selected: boolean;
  onToggle: (id: string, actif: boolean) => void;
  children?: React.ReactNode;
  expanded?: boolean;
  onExpand?: () => void;
}

function EffectCard({ id, nom, description, icone, selected, onToggle, children, expanded, onExpand }: EffectCardProps) {
  return (
    <div style={{
      border: `2px solid ${selected ? PRIMARY : '#e5e7eb'}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      background: selected ? PRIMARY_LIGHT : '#fff',
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 24 }}>{icone}</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{nom}</span>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {children && onExpand && (
            <button
              onClick={onExpand}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                color: '#888',
                padding: '4px 8px'
              }}
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
          <Toggle value={selected} onChange={(v) => onToggle(id, v)} />
        </div>
      </div>
      {expanded && children && (
        <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────

interface Props {
  gestionnaireId: number;
}

export default function ConfigStoreEffects({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<StoreEffectsConfig>({
    actif: false,
    effetMagasin: null,
    effetMagasinSettings: {
      intensite: 'moyen',
      quantite: 50,
      taille: 50,
      spiderColor: '#110d04',
      webColor: '#aaaaaa',
      showWebs: true,
      pumpkinCount: 5,
      batCount: 10,
      bulbColors: ['#ff4545', '#3ddc84', '#3d8bff', '#ff5ebd', '#ffd23d'],
      direction: 'droite-gauche',
      showAnimation: true,
      decorationSize: 50
    },
    curseur: null,
    curseurSettings: { enableMobile: false, trailLength: 20 },
    musique: null,
    musiqueSettings: { autoPlay: false, volume: 50, loop: true, position: 'bas-gauche', iconRounded: 0 },
    decoration: null,
    decorationSettings: { showAnimation: true, taille: 50, direction: 'droite-gauche' },
    addToCart: null,
    addToCartSettings: { showOnlyFirstAdd: false, allProducts: true, taille: 'moyen' },
    scrollToTop: { enabled: false, couleur: PRIMARY, couleurSurvol: PRIMARY_DARK, icone: '⬆', animationStyle: 'doux', position: 'bas-droite' },
    tabAnimation: { enabled: false, faviconMode: 'emoji', faviconEmoji: '✨', animationStyle: 'clignotant', messages: ["N'oubliez pas votre panier!"] }
  });

  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [erreur, setErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');
  const [onglet, setOnglet] = useState<'magasin' | 'curseur' | 'musique' | 'decoration' | 'panier' | 'scroll' | 'tab'>('magasin');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ─── CHARGEMENT ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/store-effects/config/${gestionnaireId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        setChargement(false);
      })
      .catch(() => {
        setErreur('Erreur de chargement.');
        setChargement(false);
      });
  }, [gestionnaireId]);

  // ─── SAUVEGARDE ──────────────────────────────────────────────────────

  const sauvegarder = async () => {
    setSauvegarde('loading');
    setErreur('');
    setMessageSucces('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/store-effects/config/${gestionnaireId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config })
      });

      const data = await res.json();
      if (!res.ok) {
        setErreur(data.message || 'Erreur.');
        setSauvegarde('err');
        return;
      }

      setMessageSucces('✅ Configuration sauvegardée !');
      setSauvegarde('ok');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setErreur('Erreur de connexion.');
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────

  const toggleEffect = (effectId: string, actif: boolean) => {
    setConfig(prev => ({
      ...prev,
      effetMagasin: actif ? effectId : null,
      actif: actif || prev.effetMagasin !== null
    }));
  };

  const toggleCurseur = (effectId: string, actif: boolean) => {
    setConfig(prev => ({
      ...prev,
      curseur: actif ? effectId : null
    }));
  };

  const toggleMusique = (effectId: string, actif: boolean) => {
    setConfig(prev => ({
      ...prev,
      musique: actif ? effectId : null
    }));
  };

  const toggleDecoration = (effectId: string, actif: boolean) => {
    setConfig(prev => ({
      ...prev,
      decoration: actif ? effectId : null
    }));
  };

  const toggleAddToCart = (effectId: string, actif: boolean) => {
    setConfig(prev => ({
      ...prev,
      addToCart: actif ? effectId : null
    }));
  };

  const setEffetSettings = (k: string, v: any) => setConfig(prev => ({
    ...prev,
    effetMagasinSettings: { ...prev.effetMagasinSettings, [k]: v }
  }));

  const setCurseurSettings = (k: string, v: any) => setConfig(prev => ({
    ...prev,
    curseurSettings: { ...prev.curseurSettings, [k]: v }
  }));

  const setMusiqueSettings = (k: string, v: any) => setConfig(prev => ({
    ...prev,
    musiqueSettings: { ...prev.musiqueSettings, [k]: v }
  }));

  const setDecorationSettings = (k: string, v: any) => setConfig(prev => ({
    ...prev,
    decorationSettings: { ...prev.decorationSettings, [k]: v }
  }));

  // ─── CATALOGUES ──────────────────────────────────────────────────────

  const EFFETS_MAGASIN = [
    // 🎄 SAISONNIERS
    { id: 'neige', nom: 'Chute de neige', description: 'Flocons de neige qui tombent', icone: '❄️' },
    { id: 'neige3d', nom: 'Neige 3D immersive', description: 'Neige en 3D avec profondeur', icone: '🌨️' },
    { id: 'noel', nom: 'Père Noël de Noël', description: 'Père Noël qui traverse l\'écran', icone: '🎅' },
    { id: 'halloween', nom: 'Citrouille d\'Halloween', description: 'Citrouilles qui apparaissent', icone: '🎃' },
    { id: 'chauvesouris', nom: 'Chauves-souris d\'Halloween', description: 'Vol de chauves-souris', icone: '🦇' },
    { id: 'sorciere', nom: 'Sorcière volante avec chauves-souris', description: 'Sorcière sur son balai', icone: '🧙' },
    { id: 'papillon', nom: 'Papillon', description: 'Papillons qui volent', icone: '🦋' },
    { id: 'feuxartifice', nom: 'Feux d\'artifice', description: 'Feux d\'artifice explosifs', icone: '🎆' },

    // 🎊 CONFETTIS
    { id: 'confettis', nom: 'Confettis colorés', description: 'Pluie de confettis', icone: '🎊' },
    { id: 'confettis_licorne', nom: 'Confettis licorne', description: 'Confettis arc-en-ciel', icone: '🦄' },
    { id: 'confettis_etoile', nom: 'Confettis en forme d\'étoile', description: 'Étoiles tombantes', icone: '⭐' },
    { id: 'confettis_coeur', nom: 'Confettis en forme de cœur', description: 'Cœurs qui tombent', icone: '❤️' },
    { id: 'confettis_feu', nom: 'Confettis de feux d\'artifice', description: 'Explosion de confettis', icone: '🎇' },
    { id: 'confettis_bienvenue', nom: 'Confettis de bienvenue', description: 'Bienvenue en couleurs', icone: '👋' },

    // 🎀 RUBANS
    { id: 'rubans_classic', nom: 'Rubans classiques', description: 'Rubans traditionnels', icone: '🎀' },
    { id: 'rubans_large', nom: 'Rubans larges', description: 'Grands rubans flottants', icone: '🎗️' },
    { id: 'rubans_colorful', nom: 'Rubans colorés', description: 'Rubans multicolores', icone: '🌈' },

    // 🏷️ VENTE
    { id: 'vente_ete', nom: 'Vente d\'été', description: 'Promotion estivale', icone: '☀️' },
    { id: 'vente_50', nom: '50% de réduction', description: 'Bannière -50%', icone: '🏷️' },
    { id: 'vente_merci', nom: 'Merci', description: 'Message de remerciement', icone: '🙏' },
    { id: 'vente_noir', nom: 'Vendredi noir', description: 'Black Friday', icone: '🖤' },
    { id: 'prime_amazon', nom: 'Journée Prime Amazon', description: 'Style Prime Day', icone: '📦' },
    { id: 'cyber_monday', nom: 'Lundi cyber', description: 'Cyber Monday', icone: '💻' },

    // ✨ AUTRES
    { id: 'pluie', nom: 'Pluie', description: 'Gouttes de pluie', icone: '🌧️' },
    { id: 'pluie_ondulations', nom: 'Pluie avec ondulations', description: 'Pluie avec effet d\'eau', icone: '💧' },
    { id: 'etoiles', nom: 'Chute d\'étoiles', description: 'Étoiles filantes', icone: '⭐' },
    { id: 'image', nom: 'Effet d\'image personnalisé', description: 'Votre propre image', icone: '🖼️' },
    { id: 'texte', nom: 'Chute de texte personnalisée', description: 'Votre texte animé', icone: '✏️' },
    { id: 'emoji', nom: 'Chute d\'emoji personnalisée', description: 'Vos emojis en pluie', icone: '😊' },
    { id: 'fusee', nom: 'Fusée', description: 'Fusée qui décolle', icone: '🚀' },
    { id: 'scintillant', nom: 'Effet scintillant', description: 'Étincelles', icone: '✨' },
  ];

  const CURSEURS = [
    { id: 'curseur_halloween', nom: 'Curseur Halloween', description: 'Citrouille', icone: '🎃' },
    { id: 'curseur_noel', nom: 'Curseur Noël', description: 'Sapin de Noël', icone: '🎄' },
    { id: 'curseur_chauve', nom: 'Curseur chauves-souris', description: 'Chauve-souris', icone: '🦇' },
    { id: 'curseur_etoile', nom: 'Curseur étoile', description: 'Étoile scintillante', icone: '⭐' },
    { id: 'curseur_neige', nom: 'Curseur neige', description: 'Flocon de neige', icone: '❄️' },
    { id: 'curseur_coeur', nom: 'Curseur cœur', description: 'Cœur', icone: '❤️' },
    { id: 'curseur_licorne', nom: 'Curseur licorne', description: 'Licorne', icone: '🦄' },
    { id: 'curseur_emoji', nom: 'Curseur emoji personnalisé', description: 'Votre emoji', icone: '😊' },
    { id: 'curseur_trail', nom: 'Curseur traînée', description: 'Effet de traînée', icone: '💫' },
    { id: 'curseur_image', nom: 'Curseur image personnalisé', description: 'Votre image', icone: '🖼️' },
  ];

  const MUSIQUES = [
    { id: 'musique_noel', nom: 'Musique de Noël', description: 'Chants de Noël', icone: '🎄' },
    { id: 'musique_piano_noel', nom: 'Piano de Noël', description: 'Piano', icone: '🎹' },
    { id: 'musique_halloween', nom: 'Musique d\'Halloween', description: 'Ambiance', icone: '🎃' },
    { id: 'musique_romantique', nom: 'Musique romantique', description: 'Douce ambiance', icone: '💕' },
    { id: 'musique_bienvenue', nom: 'Musique de bienvenue', description: 'Message d\'accueil', icone: '👋' },
  ];

  const DECORATIONS = [
    { id: 'decoration_guirlande', nom: 'Guirlandes lumineuses', description: 'Lumière de Noël', icone: '💡' },
    { id: 'decoration_araignee', nom: 'Araignées suspendues', description: 'Toiles d\'araignée', icone: '🕷️' },
    { id: 'decoration_halloween', nom: 'Décoration d\'Halloween', description: 'Ambiance', icone: '💀' },
    { id: 'decoration_squelette', nom: 'Squelette mouvant', description: 'Squelette animé', icone: '💀' },
    { id: 'decoration_graveyard', nom: 'Cimetière hanté', description: 'Atmosphère', icone: '🪦' },
    { id: 'decoration_neige', nom: 'Décoration hivernale', description: 'Paysage enneigé', icone: '☃️' },
  ];

  const ADD_TO_CART = [
    { id: 'panier_confettis', nom: 'Confettis', description: 'Confettis au panier', icone: '🎊' },
    { id: 'panier_rubans', nom: 'Rubans', description: 'Rubans', icone: '🎀' },
    { id: 'panier_etoiles', nom: 'Étoiles', description: 'Étoiles', icone: '⭐' },
    { id: 'panier_feux', nom: 'Feux d\'artifice', description: 'Feux', icone: '🎆' },
    { id: 'panier_coeurs', nom: 'Cœurs', description: 'Cœurs', icone: '❤️' },
  ];

  // ─── RENDU ───────────────────────────────────────────────────────────

  if (chargement) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>⏳ Chargement...</p>
      </div>
    );
  }

  const onglets = [
    { id: 'magasin', label: 'Effet de magasin', emoji: '🎭' },
    { id: 'curseur', label: 'Effet de curseur', emoji: '🖱️' },
    { id: 'musique', label: 'Musique de fond', emoji: '🎵' },
    { id: 'decoration', label: 'Store Decoration', emoji: '🎄' },
    { id: 'panier', label: 'Ajout au panier', emoji: '🛒' },
    { id: 'scroll', label: 'Remonter en haut', emoji: '⬆️' },
    { id: 'tab', label: 'Animation onglet', emoji: '🔄' },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px', fontFamily: "'Inter', sans-serif" }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#fff',
            flexShrink: 0
          }}>✨</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Store Effects</h1>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Effets visuels pour votre boutique</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#555' }}>{config.actif ? '🟢 Activé' : '⏸ Désactivé'}</span>
          <Toggle value={config.actif} onChange={(v) => setConfig(prev => ({ ...prev, actif: v }))} />
        </div>
      </div>

      {/* Erreurs / succès */}
      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
          ⚠️ {erreur}
        </div>
      )}
      {messageSucces && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#065f46' }}>
          {messageSucces}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>
        {onglets.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id as any)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: onglet === o.id ? PRIMARY : 'transparent',
              color: onglet === o.id ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: onglet === o.id ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <span>{o.emoji}</span> {o.label}
          </button>
        ))}
      </div>

      {/* ===== ONGLET MAGASIN ===== */}
      {onglet === 'magasin' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Sélectionnez un effet de magasin. Chaque effet a ses propres paramètres.
          </p>
          {EFFETS_MAGASIN.map(effect => (
            <EffectCard
              key={effect.id}
              id={effect.id}
              nom={effect.nom}
              description={effect.description}
              icone={effect.icone}
              selected={config.effetMagasin === effect.id}
              onToggle={toggleEffect}
              expanded={expanded === effect.id}
              onExpand={() => setExpanded(expanded === effect.id ? null : effect.id)}
            >
              {/* NEIGE */}
              {(effect.id === 'neige' || effect.id === 'neige3d') && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <F label="Intensité">
                      <Select
                        value={config.effetMagasinSettings.intensite}
                        onChange={(v: string) => setEffetSettings('intensite', v)}
                        options={[
                          { value: 'faible', label: 'Faible' },
                          { value: 'moyen', label: 'Moyen' },
                          { value: 'eleve', label: 'Élevé' },
                        ]}
                      />
                    </F>
                    <F label="Quantité">
                      <Inp type="number" value={config.effetMagasinSettings.quantite} onChange={(v: string) => setEffetSettings('quantite', parseInt(v) || 50)} min="10" max="200" />
                    </F>
                  </div>
                  {effect.id === 'neige3d' && (
                    <Toggle
                      value={config.effetMagasinSettings.animation3D || false}
                      onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                      label="Activer l'animation 3D"
                    />
                  )}
                </>
              )}

              {/* CHAUVES-SOURIS */}
              {effect.id === 'chauvesouris' && (
                <>
                  <F label="Nombre de chauves-souris">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={config.effetMagasinSettings.batCount || 10}
                      onChange={(e: any) => setEffetSettings('batCount', parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>{config.effetMagasinSettings.batCount || 10}</span>
                  </F>
                  <Toggle
                    value={config.effetMagasinSettings.animation3D || false}
                    onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                    label="Activer l'animation 3D"
                  />
                </>
              )}

              {/* HALLOWEEN */}
              {effect.id === 'halloween' && (
                <>
                  <F label="Nombre de citrouilles">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={config.effetMagasinSettings.pumpkinCount || 5}
                      onChange={(e: any) => setEffetSettings('pumpkinCount', parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>{config.effetMagasinSettings.pumpkinCount || 5}</span>
                  </F>
                  <Toggle
                    value={config.effetMagasinSettings.animation3D || false}
                    onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                    label="Activer l'animation 3D"
                  />
                </>
              )}

              {/* IMAGE PERSONNALISÉE */}
              {effect.id === 'image' && (
                <F label="URL de l'image">
                  <Inp value={config.effetMagasinSettings.customImage} onChange={(v: string) => setEffetSettings('customImage', v)} placeholder="https://exemple.com/image.png" />
                </F>
              )}

              {/* TEXTE PERSONNALISÉ */}
              {effect.id === 'texte' && (
                <F label="Texte personnalisé">
                  <Inp value={config.effetMagasinSettings.customText} onChange={(v: string) => setEffetSettings('customText', v)} placeholder="Votre message animé..." />
                </F>
              )}

              {/* EMOJI PERSONNALISÉ */}
              {effect.id === 'emoji' && (
                <F label="Emoji personnalisé">
                  <Inp value={config.effetMagasinSettings.customEmoji} onChange={(v: string) => setEffetSettings('customEmoji', v)} placeholder="🌟" />
                </F>
              )}

              {/* PLUIE */}
              {(effect.id === 'pluie' || effect.id === 'pluie_ondulations') && (
                <>
                  <F label="Intensité">
                    <Select
                      value={config.effetMagasinSettings.intensite}
                      onChange={(v: string) => setEffetSettings('intensite', v)}
                      options={[
                        { value: 'faible', label: 'Faible' },
                        { value: 'moyen', label: 'Moyen' },
                        { value: 'eleve', label: 'Élevé' },
                      ]}
                    />
                  </F>
                  {effect.id === 'pluie_ondulations' && (
                    <F label="Couleur des ondulations">
                      <ColorPicker value={config.effetMagasinSettings.couleur1} onChange={(v: string) => setEffetSettings('couleur1', v)} />
                    </F>
                  )}
                </>
              )}

              {/* CONFETTIS */}
              {['confettis', 'confettis_licorne', 'confettis_etoile', 'confettis_coeur', 'confettis_feu', 'confettis_bienvenue'].includes(effect.id) && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <F label="Couleur 1">
                      <ColorPicker value={config.effetMagasinSettings.couleur1} onChange={(v: string) => setEffetSettings('couleur1', v)} />
                    </F>
                    <F label="Couleur 2">
                      <ColorPicker value={config.effetMagasinSettings.couleur2} onChange={(v: string) => setEffetSettings('couleur2', v)} />
                    </F>
                    <F label="Couleur 3">
                      <ColorPicker value={config.effetMagasinSettings.couleur3} onChange={(v: string) => setEffetSettings('couleur3', v)} />
                    </F>
                  </div>
                  <F label="Taille">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.effetMagasinSettings.taille || 50}
                      onChange={(e: any) => setEffetSettings('taille', parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>{config.effetMagasinSettings.taille || 50}%</span>
                  </F>
                </>
              )}

              {/* RUBANS */}
              {['rubans_classic', 'rubans_large', 'rubans_colorful'].includes(effect.id) && (
                <>
                  <F label="Couleur des rubans">
                    <ColorPicker value={config.effetMagasinSettings.couleur1} onChange={(v: string) => setEffetSettings('couleur1', v)} />
                  </F>
                  {effect.id === 'rubans_colorful' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <F label="Couleur 2">
                        <ColorPicker value={config.effetMagasinSettings.couleur2} onChange={(v: string) => setEffetSettings('couleur2', v)} />
                      </F>
                      <F label="Couleur 3">
                        <ColorPicker value={config.effetMagasinSettings.couleur3} onChange={(v: string) => setEffetSettings('couleur3', v)} />
                      </F>
                    </div>
                  )}
                </>
              )}

              {/* AUCUN PARAMÈTRE */}
              {!['neige', 'neige3d', 'chauvesouris', 'halloween', 'image', 'texte', 'emoji', 'pluie', 'pluie_ondulations', 'confettis', 'confettis_licorne', 'confettis_etoile', 'confettis_coeur', 'confettis_feu', 'confettis_bienvenue', 'rubans_classic', 'rubans_large', 'rubans_colorful'].includes(effect.id) && (
                <p style={{ fontSize: 12, color: '#888' }}>Aucun paramètre supplémentaire pour cet effet.</p>
              )}
            </EffectCard>
          ))}
        </div>
      )}

      {/* ===== ONGLET CURSEUR ===== */}
      {onglet === 'curseur' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Personnalisez le curseur de votre boutique.
          </p>
          {CURSEURS.map(effect => (
            <EffectCard
              key={effect.id}
              id={effect.id}
              nom={effect.nom}
              description={effect.description}
              icone={effect.icone}
              selected={config.curseur === effect.id}
              onToggle={toggleCurseur}
              expanded={expanded === effect.id}
              onExpand={() => setExpanded(expanded === effect.id ? null : effect.id)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <F label="Couleur">
                  <ColorPicker value={config.curseurSettings.couleur} onChange={(v: string) => setCurseurSettings('couleur', v)} />
                </F>
                <F label="Taille">
                  <Select
                    value={config.curseurSettings.taille}
                    onChange={(v: string) => setCurseurSettings('taille', parseInt(v) || 24)}
                    options={[
                      { value: '16', label: 'Petite' },
                      { value: '24', label: 'Moyenne' },
                      { value: '32', label: 'Grande' },
                      { value: '48', label: 'Très grande' },
                    ]}
                  />
                </F>
              </div>
              {effect.id === 'curseur_emoji' && (
                <F label="Emoji personnalisé">
                  <Inp value={config.curseurSettings.customEmoji} onChange={(v: string) => setCurseurSettings('customEmoji', v)} placeholder="😊" />
                </F>
              )}
              {effect.id === 'curseur_image' && (
                <F label="URL de l'image">
                  <Inp value={config.curseurSettings.imageUrl} onChange={(v: string) => setCurseurSettings('imageUrl', v)} placeholder="https://exemple.com/cursor.png" />
                </F>
              )}
              {effect.id === 'curseur_trail' && (
                <F label="Longueur de la traînée">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={config.curseurSettings.trailLength || 20}
                    onChange={(e: any) => setCurseurSettings('trailLength', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{config.curseurSettings.trailLength || 20}px</span>
                </F>
              )}
              <div style={{ marginTop: 8 }}>
                <Toggle
                  value={config.curseurSettings.enableMobile || false}
                  onChange={(v: boolean) => setCurseurSettings('enableMobile', v)}
                  label="Activer sur les appareils mobiles"
                />
              </div>
            </EffectCard>
          ))}
        </div>
      )}

      {/* ===== ONGLET MUSIQUE ===== */}
      {onglet === 'musique' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Jouez de la musique en arrière-plan.
          </p>
          {MUSIQUES.map(effect => (
            <EffectCard
              key={effect.id}
              id={effect.id}
              nom={effect.nom}
              description={effect.description}
              icone={effect.icone}
              selected={config.musique === effect.id}
              onToggle={toggleMusique}
              expanded={expanded === effect.id}
              onExpand={() => setExpanded(expanded === effect.id ? null : effect.id)}
            >
              <F label="URL personnalisée (optionnel)">
                <Inp value={config.musiqueSettings.url} onChange={(v: string) => setMusiqueSettings('url', v)} placeholder="https://exemple.com/musique.mp3" />
              </F>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <F label="Volume">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.musiqueSettings.volume || 50}
                    onChange={(e: any) => setMusiqueSettings('volume', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{config.musiqueSettings.volume || 50}%</span>
                </F>
                <F label="Position">
                  <Select
                    value={config.musiqueSettings.position}
                    onChange={(v: string) => setMusiqueSettings('position', v)}
                    options={[
                      { value: 'bas-gauche', label: 'Bas gauche' },
                      { value: 'bas-droite', label: 'Bas droite' },
                      { value: 'haut-gauche', label: 'Haut gauche' },
                      { value: 'haut-droite', label: 'Haut droite' },
                    ]}
                  />
                </F>
              </div>
              <F label="Message de bienvenue">
                <Inp value={config.musiqueSettings.message} onChange={(v: string) => setMusiqueSettings('message', v)} placeholder="Sound on, worries off 😊" />
              </F>
              <F label="Couleur de fond">
                <ColorPicker value={config.musiqueSettings.backgroundColor} onChange={(v: string) => setMusiqueSettings('backgroundColor', v)} />
              </F>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <Toggle
                  value={config.musiqueSettings.autoPlay || false}
                  onChange={(v: boolean) => setMusiqueSettings('autoPlay', v)}
                  label="Lecture automatique"
                />
                <Toggle
                  value={config.musiqueSettings.loop || false}
                  onChange={(v: boolean) => setMusiqueSettings('loop', v)}
                  label="Musique en boucle"
                />
              </div>
            </EffectCard>
          ))}
        </div>
      )}

      {/* ===== ONGLET DECORATION ===== */}
      {onglet === 'decoration' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Ajoutez des décorations saisonnières à votre boutique.
          </p>
          {DECORATIONS.map(effect => (
            <EffectCard
              key={effect.id}
              id={effect.id}
              nom={effect.nom}
              description={effect.description}
              icone={effect.icone}
              selected={config.decoration === effect.id}
              onToggle={toggleDecoration}
              expanded={expanded === effect.id}
              onExpand={() => setExpanded(expanded === effect.id ? null : effect.id)}
            >
              {/* ARAIGNÉE */}
              {effect.id === 'decoration_araignee' && (
                <>
                  <F label="Couleur de l'araignée">
                    <ColorPicker value={config.effetMagasinSettings.spiderColor} onChange={(v: string) => setEffetSettings('spiderColor', v)} />
                  </F>
                  <F label="Couleur de la toile">
                    <ColorPicker value={config.effetMagasinSettings.webColor} onChange={(v: string) => setEffetSettings('webColor', v)} />
                  </F>
                  <F label="Nombre d'araignées">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={config.effetMagasinSettings.quantite || 5}
                      onChange={(e: any) => setEffetSettings('quantite', parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>{config.effetMagasinSettings.quantite || 5}</span>
                  </F>
                  <Toggle
                    value={config.effetMagasinSettings.showWebs || false}
                    onChange={(v: boolean) => setEffetSettings('showWebs', v)}
                    label="Afficher les toiles d'araignée"
                  />
                </>
              )}

              {/* GUIRLANDE */}
              {effect.id === 'decoration_guirlande' && (
                <>
                  <F label="Style d'animation">
                    <Select
                      value={config.effetMagasinSettings.animationStyle}
                      onChange={(v: string) => setEffetSettings('animationStyle', v)}
                      options={[
                        { value: 'twinkle', label: 'Clignotant' },
                        { value: 'sparkle', label: 'Scintillant' },
                        { value: 'static', label: 'Statique' },
                      ]}
                    />
                  </F>
                  <F label="Couleurs des ampoules">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[0, 1, 2, 3, 4].map(i => {
                        const colors = config.effetMagasinSettings.bulbColors || [];
                        return (
                          <ColorPicker
                            key={i}
                            value={colors[i] || '#ffffff'}
                            onChange={(v: string) => {
                              const newColors = [...colors];
                              newColors[i] = v;
                              setEffetSettings('bulbColors', newColors);
                            }}
                          />
                        );
                      })}
                    </div>
                  </F>
                </>
              )}

              {/* SQUELETTE */}
              {effect.id === 'decoration_squelette' && (
                <F label="Direction du squelette">
                  <Select
                    value={config.effetMagasinSettings.direction}
                    onChange={(v: string) => setEffetSettings('direction', v)}
                    options={[
                      { value: 'gauche-droite', label: 'Gauche → Droite' },
                      { value: 'droite-gauche', label: 'Droite → Gauche' },
                    ]}
                  />
                </F>
              )}

              {/* CIMETIÈRE */}
              {effect.id === 'decoration_graveyard' && (
                <>
                  <F label="Taille de la décoration">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.effetMagasinSettings.decorationSize || 50}
                      onChange={(e: any) => setEffetSettings('decorationSize', parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>{config.effetMagasinSettings.decorationSize || 50}%</span>
                  </F>
                  <Toggle
                    value={config.effetMagasinSettings.showAnimation || false}
                    onChange={(v: boolean) => setEffetSettings('showAnimation', v)}
                    label="Afficher avec animation (glisser vers le haut)"
                  />
                </>
              )}

              {/* AUCUN PARAMÈTRE */}
              {!['decoration_araignee', 'decoration_guirlande', 'decoration_squelette', 'decoration_graveyard'].includes(effect.id) && (
                <p style={{ fontSize: 12, color: '#888' }}>Aucun paramètre supplémentaire pour cette décoration.</p>
              )}
            </EffectCard>
          ))}
        </div>
      )}

      {/* ===== ONGLET PANIER ===== */}
      {onglet === 'panier' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Célébrez les ajouts au panier avec des effets.
          </p>
          {ADD_TO_CART.map(effect => (
            <EffectCard
              key={effect.id}
              id={effect.id}
              nom={effect.nom}
              description={effect.description}
              icone={effect.icone}
              selected={config.addToCart === effect.id}
              onToggle={toggleAddToCart}
              expanded={expanded === effect.id}
              onExpand={() => setExpanded(expanded === effect.id ? null : effect.id)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <F label="Taille">
                  <Select
                    value={config.addToCartSettings.taille}
                    onChange={(v: string) => setConfig(prev => ({ ...prev, addToCartSettings: { ...prev.addToCartSettings, taille: v as any } }))}
                    options={[
                      { value: 'petit', label: 'Petit' },
                      { value: 'moyen', label: 'Moyen' },
                      { value: 'grand', label: 'Grand' },
                    ]}
                  />
                </F>
                <F label="Couleur personnalisée">
                  <ColorPicker
                    value={config.addToCartSettings.customColor}
                    onChange={(v: string) => setConfig(prev => ({ ...prev, addToCartSettings: { ...prev.addToCartSettings, customColor: v } }))}
                  />
                </F>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <Toggle
                  value={config.addToCartSettings.showOnlyFirstAdd || false}
                  onChange={(v: boolean) => setConfig(prev => ({ ...prev, addToCartSettings: { ...prev.addToCartSettings, showOnlyFirstAdd: v } }))}
                  label="Afficher uniquement la première fois par produit"
                />
                <F label="Montant minimum du panier">
                  <Inp
                    type="number"
                    value={config.addToCartSettings.triggerAmount || ''}
                    onChange={(v: string) => setConfig(prev => ({ ...prev, addToCartSettings: { ...prev.addToCartSettings, triggerAmount: parseFloat(v) || 0 } }))}
                    placeholder="0 = toujours"
                    min="0"
                    step="5"
                  />
                </F>
              </div>
            </EffectCard>
          ))}
        </div>
      )}

      {/* ===== ONGLET SCROLL ===== */}
      {onglet === 'scroll' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Ajoutez un bouton pour revenir en haut de la page.
          </p>
          <EffectCard
            id="scroll_to_top"
            nom="Bouton remonter en haut"
            description="Retour en haut de page"
            icone="⬆️"
            selected={config.scrollToTop.enabled}
            onToggle={(id, actif) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, enabled: actif } }))}
            expanded={expanded === 'scroll_to_top'}
            onExpand={() => setExpanded(expanded === 'scroll_to_top' ? null : 'scroll_to_top')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Couleur">
                <ColorPicker
                  value={config.scrollToTop.couleur}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, couleur: v } }))}
                />
              </F>
              <F label="Couleur au survol">
                <ColorPicker
                  value={config.scrollToTop.couleurSurvol}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, couleurSurvol: v } }))}
                />
              </F>
              <F label="Icône">
                <Select
                  value={config.scrollToTop.icone}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, icone: v } }))}
                  options={[
                    { value: '⬆', label: 'Flèche haut' },
                    { value: '▲', label: 'Triangle' },
                    { value: '↑', label: 'Flèche fine' },
                    { value: '⇧', label: 'Flèche double' },
                    { value: '🔼', label: 'Bouton haut' },
                  ]}
                />
              </F>
              <F label="Position">
                <Select
                  value={config.scrollToTop.position}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, position: v as any } }))}
                  options={[
                    { value: 'bas-droite', label: 'Bas droite' },
                    { value: 'bas-gauche', label: 'Bas gauche' },
                  ]}
                />
              </F>
            </div>
          </EffectCard>
        </div>
      )}

      {/* ===== ONGLET TAB ===== */}
      {onglet === 'tab' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Animez l'onglet du navigateur pour attirer l'attention.
          </p>
          <EffectCard
            id="tab_animation"
            nom="Animation d'onglet"
            description="Titre animé dans le navigateur"
            icone="🔄"
            selected={config.tabAnimation.enabled}
            onToggle={(id, actif) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, enabled: actif } }))}
            expanded={expanded === 'tab_animation'}
            onExpand={() => setExpanded(expanded === 'tab_animation' ? null : 'tab_animation')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Mode favicon">
                <Select
                  value={config.tabAnimation.faviconMode}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, faviconMode: v as any } }))}
                  options={[
                    { value: 'emoji', label: 'Utiliser un emoji' },
                    { value: 'site', label: 'Utiliser le favicon du site' },
                  ]}
                />
              </F>
              {config.tabAnimation.faviconMode === 'emoji' && (
                <F label="Emoji du favicon">
                  <Inp
                    value={config.tabAnimation.faviconEmoji}
                    onChange={(v: string) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, faviconEmoji: v } }))}
                    placeholder="✨"
                  />
                </F>
              )}
              <F label="Style d'animation">
                <Select
                  value={config.tabAnimation.animationStyle}
                  onChange={(v: string) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, animationStyle: v as any } }))}
                  options={[
                    { value: 'clignotant', label: 'Clignotant' },
                    { value: 'defilement', label: 'Défilement' },
                    { value: 'saisie', label: 'Saisie' },
                  ]}
                />
              </F>
            </div>

            <F label="Messages (max 5)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {config.tabAnimation.messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#999', width: 24 }}>#{i + 1}</span>
                    <Inp
                      value={msg}
                      onChange={(v: string) => {
                        const newMessages = [...config.tabAnimation.messages];
                        newMessages[i] = v;
                        setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, messages: newMessages } }));
                      }}
                      placeholder="Votre message..."
                    />
                    <button
                      onClick={() => {
                        const newMessages = config.tabAnimation.messages.filter((_, idx) => idx !== i);
                        setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, messages: newMessages } }));
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '4px' }}
                    >✕</button>
                  </div>
                ))}
                {config.tabAnimation.messages.length < 5 && (
                  <button
                    onClick={() => {
                      const newMessages = [...config.tabAnimation.messages, 'Nouveau message'];
                      setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, messages: newMessages } }));
                    }}
                    style={{ padding: '6px 12px', border: '2px dashed #d1d5db', borderRadius: 6, background: 'transparent', color: '#666', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >+ Ajouter un message</button>
                )}
              </div>
            </F>
          </EffectCard>
        </div>
      )}

      {/* Bouton sauvegarder */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20,
        position: 'sticky',
        bottom: 0,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          {config.actif ? '🟢 Effets actifs' : '⏸ Effets désactivés'}
        </p>
        <button
          onClick={sauvegarder}
          disabled={sauvegarde === 'loading'}
          style={{
            padding: '10px 32px',
            border: 'none',
            borderRadius: 8,
            background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : PRIMARY,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: sauvegarde === 'loading' ? 'default' : 'pointer',
            opacity: sauvegarde === 'loading' ? 0.7 : 1,
            transition: 'background 0.3s',
            minWidth: 160
          }}
        >
          {sauvegarde === 'loading' ? '⏳ Sauvegarde...' :
           sauvegarde === 'ok' ? '✅ Sauvegardé !' :
           sauvegarde === 'err' ? '❌ Erreur' :
           '💾 Enregistrer'}
        </button>
      </div>

    </div>
  );
}