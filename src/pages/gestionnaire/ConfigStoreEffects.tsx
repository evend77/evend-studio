// e-Vend Studio — Configuration des Effets Visuels (Store Effects)
// Version complète avec toutes les catégories, effets, curseurs, musique, décorations

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
  };
  curseur: string | null;
  curseurSettings: {
    type?: 'emoji' | 'image' | 'trail' | 'point';
    couleur?: string;
    taille?: number;
    enableMobile?: boolean;
    customEmoji?: string;
    customText?: string;
    imageUrl?: string;
    trailColor?: string;
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
    type?: 'guirlande' | 'araignee' | 'neige' | 'halloween' | 'squelette';
    animationStyle?: 'twinkle' | 'sparkle' | 'static' | 'slide';
    couleurs?: string[];
    quantite?: number;
    enable3D?: boolean;
    showAnimation?: boolean;
    direction?: 'gauche-droite' | 'droite-gauche';
    taille?: number;
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

const Txt = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea
    value={value ?? ''}
    placeholder={placeholder}
    rows={rows}
    onChange={(e: any) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1.5px solid #e5e7eb',
      borderRadius: 6,
      fontSize: 13,
      outline: 'none',
      resize: 'vertical',
      fontFamily: 'inherit',
      background: '#fff',
      color: '#1a1a1a',
      boxSizing: 'border-box'
    }}
    onFocus={(e: any) => e.target.style.borderColor = PRIMARY}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'}
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
    <Inp value={value || ''} onChange={onChange} placeholder="#000000" style={{ flex: 1 }} />
  </div>
);

const Badge = ({ type, label }: { type: string; label?: string }) => {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    gratuit: { bg: '#d1fae5', color: '#065f46', label: 'GRATUIT' },
    pro: { bg: '#fef3c7', color: '#92400e', label: 'PRO' },
    upgrade: { bg: '#fef3c7', color: '#92400e', label: 'UPGRADE' },
    legend: { bg: '#ede9fe', color: '#5b21b6', label: 'LEGEND' }
  };
  const style = colors[type] || colors.gratuit;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.05em',
      background: style.bg,
      color: style.color,
      marginLeft: 6
    }}>
      {label || style.label}
    </span>
  );
};

const Card = ({ children, titre, icone, description, badge }: any) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '18px 20px',
    marginBottom: 16,
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{icone}</span>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          {titre}
          {badge && <span style={{ marginLeft: 8 }}>{badge}</span>}
        </h3>
        {description && <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

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
      bulbColors: ['#ff4545', '#3ddc84', '#3d8bff', '#ff5ebd', '#ffd23d']
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

  const setActif = (v: boolean) => setConfig(prev => ({ ...prev, actif: v }));
  const setEffetMagasin = (v: string | null) => setConfig(prev => ({ ...prev, effetMagasin: v }));
  const setCurseur = (v: string | null) => setConfig(prev => ({ ...prev, curseur: v }));
  const setMusique = (v: string | null) => setConfig(prev => ({ ...prev, musique: v }));
  const setDecoration = (v: string | null) => setConfig(prev => ({ ...prev, decoration: v }));
  const setAddToCart = (v: string | null) => setConfig(prev => ({ ...prev, addToCart: v }));

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

  const EFFETS_MAGASIN = {
    saisonniers: [
      { value: 'neige', label: 'Chute de neige', emoji: '❄️', badge: { type: 'upgrade' } },
      { value: 'neige3d', label: 'Neige 3D immersive', emoji: '🌨️', badge: { type: 'pro' } },
      { value: 'feuxartifice', label: 'Feux d\'artifice', emoji: '🎆', badge: { type: 'upgrade' } },
      { value: 'noel', label: 'Père Noël de Noël', emoji: '🎅', badge: { type: 'upgrade' } },
      { value: 'halloween', label: 'Citrouille d\'Halloween', emoji: '🎃', badge: { type: 'upgrade' } },
      { value: 'chauvesouris', label: 'Chauves-souris d\'Halloween', emoji: '🦇', badge: { type: 'upgrade' } },
      { value: 'sorciere', label: 'Sorcière volante avec chauves-souris', emoji: '🧙', badge: { type: 'gratuit' } },
      { value: 'papillon', label: 'Papillon', emoji: '🦋', badge: { type: 'gratuit' } },
    ],
    confettis: [
      { value: 'confettis', label: 'Confettis colorés', emoji: '🎊', badge: { type: 'upgrade' } },
      { value: 'confettis_licorne', label: 'Confettis licorne', emoji: '🦄', badge: { type: 'upgrade' } },
      { value: 'confettis_etoile', label: 'Confettis en forme d\'étoile', emoji: '⭐', badge: { type: 'upgrade' } },
      { value: 'confettis_coeur', label: 'Confettis en forme de cœur', emoji: '❤️', badge: { type: 'upgrade' } },
      { value: 'confettis_feu', label: 'Confettis de feux d\'artifice', emoji: '🎇', badge: { type: 'upgrade' } },
      { value: 'confettis_bienvenue', label: 'Confettis de bienvenue', emoji: '👋', badge: { type: 'upgrade' } },
      { value: 'confettis_tombants', label: 'Confettis tombants', emoji: '📉', badge: { type: 'upgrade' } },
    ],
    rubans: [
      { value: 'rubans_classic', label: 'Rubans classiques', emoji: '🎀', badge: { type: 'gratuit' } },
      { value: 'rubans_large', label: 'Rubans larges', emoji: '🎗️', badge: { type: 'upgrade' } },
      { value: 'rubans_colorful', label: 'Rubans colorés', emoji: '🌈', badge: { type: 'upgrade' } },
      { value: 'rubans_fixed', label: 'Rubans position fixe', emoji: '📍', badge: { type: 'upgrade' } },
    ],
    vente: [
      { value: 'vente_ete', label: 'Vente d\'été', emoji: '☀️', badge: { type: 'gratuit' } },
      { value: 'vente_50', label: '50% de réduction', emoji: '🏷️', badge: { type: 'gratuit' } },
      { value: 'vente_merci', label: 'Merci', emoji: '🙏', badge: { type: 'gratuit' } },
      { value: 'vente_noir', label: 'Vendredi noir', emoji: '🖤', badge: { type: 'upgrade' } },
      { value: 'vente_grande', label: 'Grande vente', emoji: '💰', badge: { type: 'upgrade' } },
      { value: 'prime_amazon', label: 'Journée Prime Amazon', emoji: '📦', badge: { type: 'gratuit' } },
      { value: 'cyber_monday', label: 'Lundi cyber', emoji: '💻', badge: { type: 'gratuit' } },
    ],
    automne: [
      { value: 'feuilles', label: 'Feuilles de fleurs', emoji: '🍂', badge: { type: 'upgrade' } },
      { value: 'pongal', label: 'Pongal', emoji: '🌾', badge: { type: 'gratuit' } },
      { value: 'holi', label: 'Holi', emoji: '🎨', badge: { type: 'gratuit' } },
      { value: 'diya', label: 'Effet Diya', emoji: '🪔', badge: { type: 'gratuit' } },
    ],
    autres: [
      { value: 'pluie', label: 'Pluie', emoji: '🌧️', badge: { type: 'upgrade' } },
      { value: 'pluie_ondulations', label: 'Pluie avec ondulations', emoji: '💧', badge: { type: 'pro' } },
      { value: 'etoiles', label: 'Chute d\'étoiles', emoji: '⭐', badge: { type: 'upgrade' } },
      { value: 'cerise', label: 'Effet cerise', emoji: '🍒', badge: { type: 'gratuit' } },
      { value: 'bulle', label: 'Bulle', emoji: '🫧', badge: { type: 'gratuit' } },
      { value: 'soleil', label: 'Soleil', emoji: '☀️', badge: { type: 'gratuit' } },
      { value: 'lune', label: 'Lune du Ramadan', emoji: '🌙', badge: { type: 'gratuit' } },
      { value: 'ovni', label: 'Alien OVNI', emoji: '🛸', badge: { type: 'gratuit' } },
      { value: 'drapeau_us', label: 'Drapeau américain', emoji: '🇺🇸', badge: { type: 'gratuit' } },
      { value: 'drapeau_uk', label: 'Drapeau anglais', emoji: '🇬🇧', badge: { type: 'gratuit' } },
      { value: 'drapeau_chine', label: 'Drapeau de la Chine', emoji: '🇨🇳', badge: { type: 'gratuit' } },
      { value: 'image', label: 'Effet d\'image personnalisé', emoji: '🖼️', badge: { type: 'pro' } },
      { value: 'texte', label: 'Chute de texte personnalisée', emoji: '✏️', badge: { type: 'pro' } },
      { value: 'emoji', label: 'Chute d\'emoji personnalisée', emoji: '😊', badge: { type: 'upgrade' } },
      { value: 'fusee', label: 'Fusée', emoji: '🚀', badge: { type: 'upgrade' } },
      { value: 'scintillant', label: 'Effet scintillant', emoji: '✨', badge: { type: 'gratuit' } },
    ]
  };

  const CURSEURS = [
    { value: 'halloween', label: 'Curseur Halloween', emoji: '🎃', badge: { type: 'upgrade' } },
    { value: 'noel', label: 'Curseur Noël', emoji: '🎄', badge: { type: 'upgrade' } },
    { value: 'chauve', label: 'Curseur chauves-souris', emoji: '🦇', badge: { type: 'upgrade' } },
    { value: 'etoile', label: 'Curseur étoile', emoji: '⭐', badge: { type: 'upgrade' } },
    { value: 'neige', label: 'Curseur neige', emoji: '❄️', badge: { type: 'upgrade' } },
    { value: 'bulles', label: 'Curseur bulles', emoji: '🫧', badge: { type: 'upgrade' } },
    { value: 'arcenciel', label: 'Curseur arc-en-ciel', emoji: '🌈', badge: { type: 'upgrade' } },
    { value: 'coeur', label: 'Curseur cœur', emoji: '❤️', badge: { type: 'gratuit' } },
    { value: 'licorne', label: 'Curseur licorne', emoji: '🦄', badge: { type: 'gratuit' } },
    { value: 'fantome', label: 'Curseur fantôme', emoji: '👻', badge: { type: 'upgrade' } },
    { value: 'fee', label: 'Curseur poussière de fée', emoji: '🧚', badge: { type: 'gratuit' } },
    { value: 'emoji', label: 'Curseur emoji personnalisé', emoji: '😊', badge: { type: 'gratuit' } },
    { value: 'point_gris', label: 'Curseur point gris', emoji: '⚪', badge: { type: 'upgrade' } },
    { value: 'point_rouge', label: 'Curseur point rouge', emoji: '🔴', badge: { type: 'gratuit' } },
    { value: 'point_bleu', label: 'Curseur point bleu', emoji: '🔵', badge: { type: 'gratuit' } },
    { value: 'trail', label: 'Curseur traînée', emoji: '💫', badge: { type: 'gratuit' } },
    { value: 'image', label: 'Curseur image personnalisé', emoji: '🖼️', badge: { type: 'gratuit' } },
  ];

  const MUSIQUES = [
    { value: 'noel', label: 'Musique de Noël', emoji: '🎄', badge: { type: 'gratuit' } },
    { value: 'piano_noel', label: 'Piano de Noël', emoji: '🎹', badge: { type: 'gratuit' } },
    { value: 'nuit_noel', label: 'Nuit de Noël', emoji: '🌙', badge: { type: 'gratuit' } },
    { value: 'halloween', label: 'Musique d\'Halloween', emoji: '🎃', badge: { type: 'gratuit' } },
    { value: 'romantique', label: 'Musique romantique', emoji: '💕', badge: { type: 'gratuit' } },
    { value: 'bienvenue', label: 'Musique de bienvenue', emoji: '👋', badge: { type: 'gratuit' } },
    { value: 'esprit_noel', label: 'Esprit de Noël', emoji: '✨', badge: { type: 'upgrade' } },
  ];

  const DECORATIONS = [
    { value: 'guirlande', label: 'Guirlandes lumineuses', emoji: '💡', badge: { type: 'gratuit' } },
    { value: 'araignee', label: 'Araignées suspendues', emoji: '🕷️', badge: { type: 'gratuit' } },
    { value: 'neige', label: 'Décoration hivernale', emoji: '☃️', badge: { type: 'gratuit' } },
    { value: 'halloween', label: 'Décoration d\'Halloween', emoji: '💀', badge: { type: 'gratuit' } },
    { value: 'squelette', label: 'Squelette mouvant', emoji: '💀', badge: { type: 'gratuit' } },
    { value: 'graveyard', label: 'Cimetière hanté', emoji: '🪦', badge: { type: 'gratuit' } },
  ];

  const ADD_TO_CART = [
    { value: 'confettis', label: 'Confettis', emoji: '🎊', badge: { type: 'gratuit' } },
    { value: 'rubans', label: 'Rubans', emoji: '🎀', badge: { type: 'gratuit' } },
    { value: 'etoiles', label: 'Étoiles', emoji: '⭐', badge: { type: 'gratuit' } },
    { value: 'feux', label: 'Feux d\'artifice', emoji: '🎆', badge: { type: 'upgrade' } },
    { value: 'coeurs', label: 'Cœurs', emoji: '❤️', badge: { type: 'upgrade' } },
  ];

  // ─── RENDU ───────────────────────────────────────────────────────────

  if (chargement) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>⏳ Chargement...</p>
      </div>
    );
  }

  const onglets = [
    { id: 'magasin', label: 'Magasin', emoji: '🎭' },
    { id: 'curseur', label: 'Curseur', emoji: '🖱️' },
    { id: 'musique', label: 'Musique', emoji: '🎵' },
    { id: 'decoration', label: 'Décorations', emoji: '🎄' },
    { id: 'panier', label: 'Panier', emoji: '🛒' },
    { id: 'scroll', label: 'Remonter', emoji: '⬆️' },
    { id: 'tab', label: 'Onglet', emoji: '🔄' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', fontFamily: "'Inter', sans-serif" }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Effets visuels</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Animez votre boutique</p>
        </div>
        <Toggle value={config.actif} onChange={setActif} label={config.actif ? 'Activé' : 'Désactivé'} />
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
              padding: '8px 16px',
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

      {/* Contenu des onglets */}
      {!config.actif && onglet !== 'magasin' && (
        <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12, padding: '40px 24px', textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🎨</span>
          <p style={{ fontSize: 14, color: '#666' }}>Activez les effets visuels pour configurer cette section</p>
        </div>
      )}

      {/* ===== ONGLET MAGASIN ===== */}
      {onglet === 'magasin' && (
        <>
          <Card titre="Effet de magasin" icone="🎭" description="Choisissez l'effet principal">
            <F label="Effet sélectionné">
              <Select
                value={config.effetMagasin}
                onChange={setEffetMagasin}
                options={[
                  { value: '', label: '— Aucun —' },
                  ...EFFETS_MAGASIN.saisonniers,
                  ...EFFETS_MAGASIN.confettis,
                  ...EFFETS_MAGASIN.rubans,
                  ...EFFETS_MAGASIN.vente,
                  ...EFFETS_MAGASIN.automne,
                  ...EFFETS_MAGASIN.autres,
                ]}
                placeholder="— Aucun effet —"
              />
            </F>
          </Card>

          {config.effetMagasin && (
            <Card titre="Paramètres" icone="⚙️" description="Personnalisez votre effet">

              {['neige', 'neige3d'].includes(config.effetMagasin) && (
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
                  {config.effetMagasin === 'neige3d' && (
                    <div style={{ marginTop: 4 }}>
                      <Toggle
                        value={config.effetMagasinSettings.animation3D || false}
                        onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                        label="Activer l'animation 3D"
                      />
                    </div>
                  )}
                </>
              )}

              {['confettis', 'confettis_licorne', 'confettis_etoile', 'confettis_coeur', 'confettis_feu', 'confettis_bienvenue', 'confettis_tombants'].includes(config.effetMagasin) && (
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

              {['chauvesouris'].includes(config.effetMagasin) && (
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
                  <div style={{ marginTop: 4 }}>
                    <Toggle
                      value={config.effetMagasinSettings.animation3D || false}
                      onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                      label="Activer l'animation 3D"
                    />
                  </div>
                </>
              )}

              {['halloween'].includes(config.effetMagasin) && (
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
                  <div style={{ marginTop: 4 }}>
                    <Toggle
                      value={config.effetMagasinSettings.animation3D || false}
                      onChange={(v: boolean) => setEffetSettings('animation3D', v)}
                      label="Activer l'animation 3D"
                    />
                  </div>
                </>
              )}

              {['pluie', 'pluie_ondulations'].includes(config.effetMagasin) && (
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
                  {config.effetMagasin === 'pluie_ondulations' && (
                    <F label="Couleur des ondulations">
                      <ColorPicker value={config.effetMagasinSettings.couleur1} onChange={(v: string) => setEffetSettings('couleur1', v)} />
                    </F>
                  )}
                </>
              )}

              {['image', 'texte', 'emoji'].includes(config.effetMagasin) && (
                <>
                  {config.effetMagasin === 'image' && (
                    <F label="URL de l'image">
                      <Inp value={config.effetMagasinSettings.customImage} onChange={(v: string) => setEffetSettings('customImage', v)} placeholder="https://exemple.com/image.png" />
                    </F>
                  )}
                  {config.effetMagasin === 'texte' && (
                    <F label="Texte personnalisé">
                      <Inp value={config.effetMagasinSettings.customText} onChange={(v: string) => setEffetSettings('customText', v)} placeholder="Votre message animé..." />
                    </F>
                  )}
                  {config.effetMagasin === 'emoji' && (
                    <F label="Emoji personnalisé">
                      <Inp value={config.effetMagasinSettings.customEmoji} onChange={(v: string) => setEffetSettings('customEmoji', v)} placeholder="🌟" />
                    </F>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <F label="Quantité">
                      <Inp type="number" value={config.effetMagasinSettings.quantite} onChange={(v: string) => setEffetSettings('quantite', parseInt(v) || 50)} min="10" max="200" />
                    </F>
                    <F label="Vitesse">
                      <Select
                        value={config.effetMagasinSettings.vitesse}
                        onChange={(v: string) => setEffetSettings('vitesse', parseInt(v) || 3)}
                        options={[
                          { value: '1', label: 'Lente' },
                          { value: '2', label: 'Normale' },
                          { value: '3', label: 'Rapide' },
                        ]}
                      />
                    </F>
                  </div>
                </>
              )}

              {['rubans_classic', 'rubans_large', 'rubans_colorful', 'rubans_fixed'].includes(config.effetMagasin) && (
                <>
                  <F label="Couleur des rubans">
                    <ColorPicker value={config.effetMagasinSettings.couleur1} onChange={(v: string) => setEffetSettings('couleur1', v)} />
                  </F>
                  {config.effetMagasin === 'rubans_colorful' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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

            </Card>
          )}

          <Card titre="Tous les effets" icone="📋" description="Parcourez tous les effets disponibles">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(EFFETS_MAGASIN).map(([cat, effets]) => (
                <div key={cat} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#888', letterSpacing: '0.05em', marginBottom: 8 }}>
                    {cat === 'saisonniers' ? '🎄 Saisonniers' :
                     cat === 'confettis' ? '🎊 Confettis' :
                     cat === 'rubans' ? '🎀 Rubans' :
                     cat === 'vente' ? '🏷️ Vente' :
                     cat === 'automne' ? '🍂 Automne' : '✨ Autres'}
                  </p>
                  {effets.map((e: any) => (
                    <div
                      key={e.value}
                      onClick={() => setEffetMagasin(e.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        background: config.effetMagasin === e.value ? PRIMARY_LIGHT : 'transparent',
                        fontSize: 12
                      }}
                    >
                      <span>{e.emoji} {e.label}</span>
                      {e.badge && <Badge type={e.badge.type} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ===== ONGLET CURSEUR ===== */}
      {onglet === 'curseur' && config.actif && (
        <>
          <Card titre="Effet de curseur" icone="🖱️" description="Personnalisez le curseur de la souris">
            <F label="Style de curseur">
              <Select
                value={config.curseur}
                onChange={setCurseur}
                options={[
                  { value: '', label: '— Curseur par défaut —' },
                  ...CURSEURS
                ]}
                placeholder="— Aucun —"
              />
            </F>

            {config.curseur && (
              <>
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

                {config.curseur === 'emoji' && (
                  <F label="Emoji personnalisé">
                    <Inp value={config.curseurSettings.customEmoji} onChange={(v: string) => setCurseurSettings('customEmoji', v)} placeholder="😊" />
                  </F>
                )}

                {config.curseur === 'image' && (
                  <F label="URL de l'image">
                    <Inp value={config.curseurSettings.imageUrl} onChange={(v: string) => setCurseurSettings('imageUrl', v)} placeholder="https://exemple.com/cursor.png" />
                  </F>
                )}

                {config.curseur === 'trail' && (
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
              </>
            )}
          </Card>

          <Card titre="Tous les curseurs" icone="📋" description="Parcourez tous les curseurs disponibles">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {CURSEURS.map(c => (
                <div
                  key={c.value}
                  onClick={() => setCurseur(c.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: config.curseur === c.value ? PRIMARY_LIGHT : 'transparent',
                    border: config.curseur === c.value ? `1px solid ${PRIMARY}` : '1px solid transparent',
                    fontSize: 12
                  }}
                >
                  <span>{c.emoji} {c.label}</span>
                  {c.badge && <Badge type={c.badge.type} />}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ===== ONGLET MUSIQUE ===== */}
      {onglet === 'musique' && config.actif && (
        <>
          <Card titre="Musique de fond" icone="🎵" description="Jouez de la musique en arrière-plan">
            <F label="Musique">
              <Select
                value={config.musique}
                onChange={setMusique}
                options={[
                  { value: '', label: '— Aucune musique —' },
                  ...MUSIQUES
                ]}
                placeholder="— Aucune —"
              />
            </F>

            {config.musique && (
              <>
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
                <F label="Arrondi des icônes">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={config.musiqueSettings.iconRounded || 0}
                    onChange={(e: any) => setMusiqueSettings('iconRounded', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{config.musiqueSettings.iconRounded || 0}px</span>
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
              </>
            )}
          </Card>
        </>
      )}

      {/* ===== ONGLET DECORATION ===== */}
      {onglet === 'decoration' && config.actif && (
        <>
          <Card titre="Décorations" icone="🎄" description="Ajoutez des décorations saisonnières">
            <F label="Type de décoration">
              <Select
                value={config.decoration}
                onChange={setDecoration}
                options={[
                  { value: '', label: '— Aucune décoration —' },
                  ...DECORATIONS
                ]}
                placeholder="— Aucune —"
              />
            </F>

            {config.decoration === 'guirlande' && (
              <>
                <F label="Style d'animation">
                  <Select
                    value={config.decorationSettings.animationStyle}
                    onChange={(v: string) => setDecorationSettings('animationStyle', v)}
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

            {config.decoration === 'araignee' && (
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
                <div style={{ marginTop: 8 }}>
                  <Toggle
                    value={config.effetMagasinSettings.showWebs || false}
                    onChange={(v: boolean) => setEffetSettings('showWebs', v)}
                    label="Afficher les toiles d'araignée"
                  />
                </div>
              </>
            )}

            {config.decoration === 'squelette' && (
              <>
                <F label="Direction du squelette">
                  <Select
                    value={config.decorationSettings.direction}
                    onChange={(v: string) => setDecorationSettings('direction', v)}
                    options={[
                      { value: 'gauche-droite', label: 'Gauche → Droite' },
                      { value: 'droite-gauche', label: 'Droite → Gauche' },
                    ]}
                  />
                </F>
              </>
            )}

            {config.decoration === 'graveyard' && (
              <>
                <F label="Taille de la décoration">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.decorationSettings.taille || 50}
                    onChange={(e: any) => setDecorationSettings('taille', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{config.decorationSettings.taille || 50}%</span>
                </F>
                <div style={{ marginTop: 8 }}>
                  <Toggle
                    value={config.decorationSettings.showAnimation || false}
                    onChange={(v: boolean) => setDecorationSettings('showAnimation', v)}
                    label="Afficher avec animation (glisser vers le haut)"
                  />
                </div>
              </>
            )}

            {config.decoration === 'halloween' && (
              <>
                <F label="Taille">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.decorationSettings.taille || 50}
                    onChange={(e: any) => setDecorationSettings('taille', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{config.decorationSettings.taille || 50}%</span>
                </F>
                <div style={{ marginTop: 8 }}>
                  <Toggle
                    value={config.decorationSettings.showAnimation || false}
                    onChange={(v: boolean) => setDecorationSettings('showAnimation', v)}
                    label="Afficher avec animation"
                  />
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* ===== ONGLET PANIER ===== */}
      {onglet === 'panier' && config.actif && (
        <Card titre="Ajout au panier" icone="🛒" description="Célébrez les achats avec des effets">
          <F label="Effet">
            <Select
              value={config.addToCart}
              onChange={setAddToCart}
              options={[
                { value: '', label: '— Désactivé —' },
                ...ADD_TO_CART
              ]}
              placeholder="— Aucun —"
            />
          </F>

          {config.addToCart && (
            <>
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
            </>
          )}
        </Card>
      )}

      {/* ===== ONGLET SCROLL ===== */}
      {onglet === 'scroll' && config.actif && (
        <Card titre="Bouton remonter" icone="⬆️" description="Ajoutez un bouton pour revenir en haut">
          <Toggle
            value={config.scrollToTop.enabled}
            onChange={(v: boolean) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, enabled: v } }))}
            label="Activer le bouton remonter"
          />

          {config.scrollToTop.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
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
                    { value: '⬑', label: 'Flèche retour' },
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
          )}
        </Card>
      )}

      {/* ===== ONGLET TAB ===== */}
      {onglet === 'tab' && config.actif && (
        <Card titre="Animation d'onglet" icone="🔄" description="Attirez l'attention avec le titre de l'onglet">
          <Toggle
            value={config.tabAnimation.enabled}
            onChange={(v: boolean) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, enabled: v } }))}
            label="Activer l'animation de l'onglet"
          />

          {config.tabAnimation.enabled && (
            <>
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
            </>
          )}
        </Card>
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