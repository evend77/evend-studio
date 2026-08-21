// e-Vend Studio — Configuration des Effets Visuels (Store Effects)
// Permet aux gestionnaires d'activer et configurer des animations
// sur leur boutique (neige, confettis, curseurs, décorations, etc.)

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const PRIMARY = '#8B5CF6'; // Violet moderne (différent du magenta des autres pages)
const PRIMARY_LIGHT = '#EDE9FE';
const PRIMARY_DARK = '#5B21B6';

// ─── TYPES ──────────────────────────────────────────────────────────────

interface StoreEffectsConfig {
  // Toggle global
  actif: boolean;
  
  // Effet de magasin
  effetMagasin: string | null;
  effetMagasinSettings: {
    intensite?: 'faible' | 'moyen' | 'eleve';
    couleur1?: string;
    couleur2?: string;
    quantite?: number;
    customText?: string;
    customImage?: string;
    customEmoji?: string;
  };
  
  // Effet de curseur
  curseur: string | null;
  curseurSettings: {
    couleur?: string;
    taille?: number;
    enableMobile?: boolean;
    customEmoji?: string;
    customText?: string;
  };
  
  // Musique de fond
  musique: string | null;
  musiqueSettings: {
    autoPlay?: boolean;
    volume?: number;
    loop?: boolean;
  };
  
  // Décorations
  decoration: string | null;
  decorationSettings: {
    animationStyle?: 'clignotant' | 'scintillant' | 'statique';
    couleurs?: string[];
    quantite?: number;
    enable3D?: boolean;
  };
  
  // Ajout au panier
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
  
  // Bouton remonter
  scrollToTop: {
    enabled: boolean;
    couleur?: string;
    couleurSurvol?: string;
    icone?: string;
    animationStyle?: 'lineaire' | 'doux' | 'rebond';
    position?: 'bas-droite' | 'bas-gauche';
  };
  
  // Animation onglet
  tabAnimation: {
    enabled: boolean;
    faviconMode?: 'emoji' | 'site';
    faviconEmoji?: string;
    animationStyle?: 'clignotant' | 'defilement' | 'saisie';
    messages: string[];
  };
  
  // Icônes sociales flottantes
  socialIcons: {
    enabled: boolean;
    whatsapp?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    email?: string | null;
    position?: 'gauche' | 'droite';
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
      padding: '9px 12px',
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
      padding: '9px 12px',
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
      padding: '9px 12px',
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

const ColorPicker = ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
    <Inp value={value || ''} onChange={onChange} placeholder="#000000" />
  </div>
);

const Card = ({ children, titre, icone, description }: any) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 20 }}>{icone}</span>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{titre}</h3>
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
    effetMagasinSettings: { intensite: 'moyen', quantite: 50 },
    curseur: null,
    curseurSettings: { enableMobile: false },
    musique: null,
    musiqueSettings: { autoPlay: false, volume: 50, loop: true },
    decoration: null,
    decorationSettings: { animationStyle: 'scintillant', couleurs: ['#ff4545', '#3ddc84', '#3d8bff', '#ff5ebd', '#ffd23d'], quantite: 10 },
    addToCart: null,
    addToCartSettings: { showOnlyFirstAdd: false, allProducts: true, taille: 'moyen' },
    scrollToTop: { enabled: false, couleur: PRIMARY, couleurSurvol: PRIMARY_DARK, icone: '⬆', animationStyle: 'doux', position: 'bas-droite' },
    tabAnimation: { enabled: false, faviconMode: 'emoji', faviconEmoji: '✨', animationStyle: 'clignotant', messages: ["N'oubliez pas votre panier!"] },
    socialIcons: { enabled: false, position: 'droite' }
  });

  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [erreur, setErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');

  // ─── CHARGEMENT DE LA CONFIG ────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/store-effects/config/${gestionnaireId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
        setChargement(false);
      })
      .catch(() => {
        setErreur('Erreur de chargement de la configuration.');
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ config })
      });

      const data = await res.json();
      if (!res.ok) {
        setErreur(data.message || 'Erreur lors de la sauvegarde.');
        setSauvegarde('err');
        return;
      }

      setMessageSucces('✅ Configuration sauvegardée avec succès !');
      setSauvegarde('ok');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setErreur('Erreur de connexion.');
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // ─── HELPERS DE MISE À JOUR ─────────────────────────────────────────

  const setActif = (v: boolean) => setConfig(prev => ({ ...prev, actif: v }));
  const setEffetMagasin = (v: string | null) => setConfig(prev => ({ ...prev, effetMagasin: v }));
  const setCurseur = (v: string | null) => setConfig(prev => ({ ...prev, curseur: v }));
  const setMusique = (v: string | null) => setConfig(prev => ({ ...prev, musique: v }));
  const setDecoration = (v: string | null) => setConfig(prev => ({ ...prev, decoration: v }));
  const setAddToCart = (v: string | null) => setConfig(prev => ({ ...prev, addToCart: v }));
  const setScrollToTop = (k: string, v: any) => setConfig(prev => ({ ...prev, scrollToTop: { ...prev.scrollToTop, [k]: v } }));
  const setTabAnimation = (k: string, v: any) => setConfig(prev => ({ ...prev, tabAnimation: { ...prev.tabAnimation, [k]: v } }));
  const setSocialIcons = (k: string, v: any) => setConfig(prev => ({ ...prev, socialIcons: { ...prev.socialIcons, [k]: v } }));

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

  const setCartSettings = (k: string, v: any) => setConfig(prev => ({
    ...prev,
    addToCartSettings: { ...prev.addToCartSettings, [k]: v }
  }));

  // ─── CATALOGUES ──────────────────────────────────────────────────────

  const EFFETS_MAGASIN = [
    { value: 'neige', label: 'Chute de neige', emoji: '❄️' },
    { value: 'neige3d', label: 'Neige 3D immersive', emoji: '🌨️' },
    { value: 'confettis', label: 'Confettis colorés', emoji: '🎊' },
    { value: 'feuxartifice', label: 'Feux d\'artifice', emoji: '🎆' },
    { value: 'pluie', label: 'Pluie avec ondulations', emoji: '🌧️' },
    { value: 'papillons', label: 'Vol de papillons', emoji: '🦋' },
    { value: 'etoiles', label: 'Pluie d\'étoiles filantes', emoji: '⭐' },
    { value: 'personnalise', label: 'Effet personnalisé', emoji: '✨' },
  ];

  const CURSEURS = [
    { value: 'halloween', label: 'Citrouille d\'Halloween', emoji: '🎃' },
    { value: 'noel', label: 'Père Noël', emoji: '🎅' },
    { value: 'etoile', label: 'Étoile scintillante', emoji: '⭐' },
    { value: 'coeur', label: 'Cœur flottant', emoji: '❤️' },
    { value: 'chauve', label: 'Chauve-souris', emoji: '🦇' },
    { value: 'flocon', label: 'Flocon de neige', emoji: '❄️' },
    { value: 'arcenciel', label: 'Arc-en-ciel', emoji: '🌈' },
    { value: 'emoji', label: 'Emoji personnalisé', emoji: '😊' },
    { value: 'texte', label: 'Texte personnalisé', emoji: '✏️' },
  ];

  const DECORATIONS = [
    { value: 'guirlande', label: 'Guirlandes lumineuses', emoji: '💡' },
    { value: 'araignee', label: 'Araignées suspendues', emoji: '🕷️' },
    { value: 'neige', label: 'Décoration hivernale', emoji: '☃️' },
    { value: 'halloween', label: 'Décoration d\'Halloween', emoji: '💀' },
  ];

  const ANIM_STYLES = [
    { value: 'clignotant', label: 'Clignotant' },
    { value: 'scintillant', label: 'Scintillant' },
    { value: 'statique', label: 'Statique' },
  ];

  // ─── RENDU ───────────────────────────────────────────────────────────

  if (chargement) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>⏳ Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
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
        }}>
          ✨
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Effets visuels</h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            Animez votre boutique avec des effets saisonniers et interactifs
          </p>
        </div>
      </div>

      {/* Messages */}
      {erreur && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '10px 14px',
          margin: '16px 0',
          fontSize: 13,
          color: '#991b1b'
        }}>
          ⚠️ {erreur}
        </div>
      )}

      {messageSucces && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 10,
          padding: '10px 14px',
          margin: '16px 0',
          fontSize: 13,
          color: '#065f46'
        }}>
          {messageSucces}
        </div>
      )}

      {/* Toggle global */}
      <div style={{
        background: config.actif ? PRIMARY_LIGHT : '#f9fafb',
        border: `2px solid ${config.actif ? PRIMARY : '#e5e7eb'}`,
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        transition: 'all 0.3s'
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            {config.actif ? '🟢 Effets activés' : '⏸ Effets désactivés'}
          </p>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            {config.actif
              ? 'Les effets sélectionnés s\'affichent sur votre boutique'
              : 'Aucun effet ne sera visible sur votre site'
            }
          </p>
        </div>
        <Toggle value={config.actif} onChange={setActif} />
      </div>

      {/* Si désactivé, on affiche un message */}
      {!config.actif && (
        <div style={{
          background: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: 12,
          padding: '40px 24px',
          textAlign: 'center',
          marginBottom: 24
        }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🎨</span>
          <p style={{ fontSize: 15, color: '#666' }}>
            Activez les effets visuels pour commencer à configurer vos animations
          </p>
        </div>
      )}

      {/* Sections de configuration (uniquement si actif) */}
      {config.actif && (
        <>

          {/* 1. Effet de magasin */}
          <Card titre="Ambiance visuelle" icone="🎭" description="Effet principal qui s'affiche en fond de votre boutique">
            <F label="Effet sélectionné">
              <Select
                value={config.effetMagasin}
                onChange={setEffetMagasin}
                options={EFFETS_MAGASIN}
                placeholder="— Aucun effet —"
              />
            </F>

            {config.effetMagasin === 'neige' || config.effetMagasin === 'neige3d' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                  <F label="Quantité de flocons">
                    <Inp
                      type="number"
                      value={config.effetMagasinSettings.quantite}
                      onChange={(v: string) => setEffetSettings('quantite', parseInt(v) || 50)}
                      min="10"
                      max="200"
                    />
                  </F>
                </div>
                <F label="Couleur des flocons (optionnel)">
                  <ColorPicker
                    value={config.effetMagasinSettings.couleur1}
                    onChange={(v: string) => setEffetSettings('couleur1', v)}
                  />
                </F>
              </>
            ) : config.effetMagasin === 'confettis' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <F label="Couleur 1">
                    <ColorPicker
                      value={config.effetMagasinSettings.couleur1}
                      onChange={(v: string) => setEffetSettings('couleur1', v)}
                    />
                  </F>
                  <F label="Couleur 2">
                    <ColorPicker
                      value={config.effetMagasinSettings.couleur2}
                      onChange={(v: string) => setEffetSettings('couleur2', v)}
                    />
                  </F>
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
                </div>
              </>
            ) : config.effetMagasin === 'personnalise' ? (
              <>
                <F label="Texte personnalisé" aide="Le texte qui s'affichera en animation">
                  <Inp
                    value={config.effetMagasinSettings.customText}
                    onChange={(v: string) => setEffetSettings('customText', v)}
                    placeholder="Votre message animé..."
                  />
                </F>
                <F label="Emoji personnalisé">
                  <Inp
                    value={config.effetMagasinSettings.customEmoji}
                    onChange={(v: string) => setEffetSettings('customEmoji', v)}
                    placeholder="🌟"
                  />
                </F>
                <F label="Image personnalisée (URL)" aide="Si vous voulez une image au lieu d'un emoji/texte">
                  <Inp
                    value={config.effetMagasinSettings.customImage}
                    onChange={(v: string) => setEffetSettings('customImage', v)}
                    placeholder="https://exemple.com/image.png"
                  />
                </F>
              </>
            ) : null}
          </Card>

          {/* 2. Effet de curseur */}
          <Card titre="Curseur personnalisé" icone="🖱️" description="Changez l'apparence du curseur de la souris">
            <F label="Style de curseur">
              <Select
                value={config.curseur}
                onChange={setCurseur}
                options={CURSEURS}
                placeholder="— Curseur par défaut —"
              />
            </F>

            {config.curseur && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="Couleur du curseur">
                    <ColorPicker
                      value={config.curseurSettings.couleur}
                      onChange={(v: string) => setCurseurSettings('couleur', v)}
                    />
                  </F>
                  <F label="Taille">
                    <Select
                      value={config.curseurSettings.taille}
                      onChange={(v: string) => setCurseurSettings('taille', parseInt(v) || 24)}
                      options={[
                        { value: '16', label: 'Petit' },
                        { value: '24', label: 'Moyen' },
                        { value: '32', label: 'Grand' },
                      ]}
                    />
                  </F>
                </div>

                {config.curseur === 'emoji' && (
                  <F label="Emoji personnalisé">
                    <Inp
                      value={config.curseurSettings.customEmoji}
                      onChange={(v: string) => setCurseurSettings('customEmoji', v)}
                      placeholder="😊"
                    />
                  </F>
                )}

                {config.curseur === 'texte' && (
                  <F label="Texte personnalisé">
                    <Inp
                      value={config.curseurSettings.customText}
                      onChange={(v: string) => setCurseurSettings('customText', v)}
                      placeholder="Votre texte"
                    />
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

          {/* 3. Décorations */}
          <Card titre="Décorations" icone="🎄" description="Guirlandes, araignées, décors saisonniers">
            <F label="Type de décoration">
              <Select
                value={config.decoration}
                onChange={setDecoration}
                options={DECORATIONS}
                placeholder="— Aucune décoration —"
              />
            </F>

            {config.decoration === 'guirlande' && (
              <>
                <F label="Style d'animation">
                  <Select
                    value={config.decorationSettings.animationStyle}
                    onChange={(v: string) => setDecorationSettings('animationStyle', v)}
                    options={ANIM_STYLES}
                  />
                </F>
                <F label="Couleurs des ampoules (5 couleurs max)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4].map(i => {
                      const couleurs = config.decorationSettings.couleurs || [];
                      return (
                        <ColorPicker
                          key={i}
                          value={couleurs[i] || '#ffffff'}
                          onChange={(v: string) => {
                            const newCouleurs = [...couleurs];
                            newCouleurs[i] = v;
                            setDecorationSettings('couleurs', newCouleurs);
                          }}
                        />
                      );
                    })}
                  </div>
                </F>
                <F label="Quantité">
                  <Inp
                    type="number"
                    value={config.decorationSettings.quantite}
                    onChange={(v: string) => setDecorationSettings('quantite', parseInt(v) || 10)}
                    min="1"
                    max="50"
                  />
                </F>
              </>
            )}

            {config.decoration === 'araignee' && (
              <F label="Activer l'animation 3D" aide="Effet de profondeur pour les araignées">
                <Toggle
                  value={config.decorationSettings.enable3D || false}
                  onChange={(v: boolean) => setDecorationSettings('enable3D', v)}
                />
              </F>
            )}
          </Card>

          {/* 4. Ajout au panier */}
          <Card titre="Confettis au panier" icone="🛒" description="Célébrez chaque ajout au panier avec des confettis">
            <F label="Effet déclenché par l'ajout au panier">
              <Select
                value={config.addToCart}
                onChange={setAddToCart}
                options={[
                  { value: 'confettis', label: 'Confettis', emoji: '🎊' },
                  { value: 'rubans', label: 'Rubans', emoji: '🎀' },
                  { value: 'etoiles', label: 'Étoiles', emoji: '⭐' },
                ]}
                placeholder="— Désactivé —"
              />
            </F>

            {config.addToCart && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="Taille des confettis">
                    <Select
                      value={config.addToCartSettings.taille}
                      onChange={(v: string) => setCartSettings('taille', v)}
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
                      onChange={(v: string) => setCartSettings('customColor', v)}
                    />
                  </F>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <Toggle
                    value={config.addToCartSettings.showOnlyFirstAdd || false}
                    onChange={(v: boolean) => setCartSettings('showOnlyFirstAdd', v)}
                    label="Afficher l'effet uniquement la première fois par produit"
                  />
                  <F label="Montant minimum du panier pour déclencher l'effet">
                    <Inp
                      type="number"
                      value={config.addToCartSettings.triggerAmount || ''}
                      onChange={(v: string) => setCartSettings('triggerAmount', parseFloat(v) || 0)}
                      placeholder="0 = toujours"
                      min="0"
                      step="5"
                    />
                  </F>
                </div>
              </>
            )}
          </Card>

          {/* 5. Bouton remonter en haut */}
          <Card titre="Bouton remonter" icone="⬆️" description="Ajoutez un bouton pour revenir en haut de la page">
            <div style={{ marginBottom: 12 }}>
              <Toggle
                value={config.scrollToTop.enabled}
                onChange={(v: boolean) => setScrollToTop('enabled', v)}
                label="Activer le bouton remonter"
              />
            </div>

            {config.scrollToTop.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <F label="Couleur du bouton">
                  <ColorPicker
                    value={config.scrollToTop.couleur}
                    onChange={(v: string) => setScrollToTop('couleur', v)}
                  />
                </F>
                <F label="Couleur au survol">
                  <ColorPicker
                    value={config.scrollToTop.couleurSurvol}
                    onChange={(v: string) => setScrollToTop('couleurSurvol', v)}
                  />
                </F>
                <F label="Icône">
                  <Select
                    value={config.scrollToTop.icone}
                    onChange={(v: string) => setScrollToTop('icone', v)}
                    options={[
                      { value: '⬆', label: 'Flèche haut' },
                      { value: '▲', label: 'Triangle' },
                      { value: '↑', label: 'Flèche fine' },
                      { value: '⇧', label: 'Flèche double' },
                      { value: '⬑', label: 'Flèche retour' },
                    ]}
                  />
                </F>
                <F label="Position">
                  <Select
                    value={config.scrollToTop.position}
                    onChange={(v: string) => setScrollToTop('position', v)}
                    options={[
                      { value: 'bas-droite', label: 'Bas droite' },
                      { value: 'bas-gauche', label: 'Bas gauche' },
                    ]}
                  />
                </F>
              </div>
            )}
          </Card>

          {/* 6. Animation d'onglet */}
          <Card titre="Animation d'onglet" icone="🔄" description="Attirez l'attention avec l'animation du titre de l'onglet">
            <div style={{ marginBottom: 12 }}>
              <Toggle
                value={config.tabAnimation.enabled}
                onChange={(v: boolean) => setTabAnimation('enabled', v)}
                label="Activer l'animation de l'onglet"
              />
            </div>

            {config.tabAnimation.enabled && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="Mode favicon">
                    <Select
                      value={config.tabAnimation.faviconMode}
                      onChange={(v: string) => setTabAnimation('faviconMode', v)}
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
                        onChange={(v: string) => setTabAnimation('faviconEmoji', v)}
                        placeholder="✨"
                      />
                    </F>
                  )}
                  <F label="Style d'animation">
                    <Select
                      value={config.tabAnimation.animationStyle}
                      onChange={(v: string) => setTabAnimation('animationStyle', v)}
                      options={[
                        { value: 'clignotant', label: 'Clignotant' },
                        { value: 'defilement', label: 'Défilement' },
                        { value: 'saisie', label: 'Saisie' },
                      ]}
                    />
                  </F>
                </div>

                <F label="Messages (max 5)" aide="Un message s'affiche quand le client quitte l'onglet">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {config.tabAnimation.messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#999', width: 24 }}>#{i + 1}</span>
                        <Inp
                          value={msg}
                          onChange={(v: string) => {
                            const newMessages = [...config.tabAnimation.messages];
                            newMessages[i] = v;
                            setTabAnimation('messages', newMessages);
                          }}
                          placeholder="Votre message..."
                        />
                        <button
                          onClick={() => {
                            const newMessages = config.tabAnimation.messages.filter((_, idx) => idx !== i);
                            setTabAnimation('messages', newMessages);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: '4px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {config.tabAnimation.messages.length < 5 && (
                      <button
                        onClick={() => {
                          const newMessages = [...config.tabAnimation.messages, 'Nouveau message'];
                          setTabAnimation('messages', newMessages);
                        }}
                        style={{
                          padding: '6px 12px',
                          border: '2px dashed #d1d5db',
                          borderRadius: 6,
                          background: 'transparent',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        + Ajouter un message
                      </button>
                    )}
                  </div>
                </F>
              </>
            )}
          </Card>

          {/* 7. Icônes sociales flottantes */}
          <Card titre="Icônes sociales flottantes" icone="📱" description="Ajoutez des icônes WhatsApp, Instagram, etc.">
            <div style={{ marginBottom: 12 }}>
              <Toggle
                value={config.socialIcons.enabled}
                onChange={(v: boolean) => setSocialIcons('enabled', v)}
                label="Activer les icônes sociales"
              />
            </div>

            {config.socialIcons.enabled && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="WhatsApp (numéro)">
                    <Inp
                      value={config.socialIcons.whatsapp || ''}
                      onChange={(v: string) => setSocialIcons('whatsapp', v)}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </F>
                  <F label="Instagram (URL)">
                    <Inp
                      value={config.socialIcons.instagram || ''}
                      onChange={(v: string) => setSocialIcons('instagram', v)}
                      placeholder="https://instagram.com/..."
                    />
                  </F>
                  <F label="Facebook (URL)">
                    <Inp
                      value={config.socialIcons.facebook || ''}
                      onChange={(v: string) => setSocialIcons('facebook', v)}
                      placeholder="https://facebook.com/..."
                    />
                  </F>
                  <F label="YouTube (URL)">
                    <Inp
                      value={config.socialIcons.youtube || ''}
                      onChange={(v: string) => setSocialIcons('youtube', v)}
                      placeholder="https://youtube.com/..."
                    />
                  </F>
                  <F label="Email">
                    <Inp
                      value={config.socialIcons.email || ''}
                      onChange={(v: string) => setSocialIcons('email', v)}
                      placeholder="contact@exemple.com"
                    />
                  </F>
                  <F label="Position">
                    <Select
                      value={config.socialIcons.position}
                      onChange={(v: string) => setSocialIcons('position', v)}
                      options={[
                        { value: 'gauche', label: 'À gauche' },
                        { value: 'droite', label: 'À droite' },
                      ]}
                    />
                  </F>
                </div>
              </>
            )}
          </Card>

        </>
      )}

      {/* Bouton sauvegarder */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
        position: 'sticky',
        bottom: 0,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          {config.actif ? '🟢 Les effets sont actifs sur votre boutique' : '⏸ Les effets sont désactivés'}
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
            minWidth: 140
          }}
        >
          {sauvegarde === 'loading' ? '⏳ Sauvegarde...' :
           sauvegarde === 'ok' ? '✅ Sauvegardé !' :
           sauvegarde === 'err' ? '❌ Erreur' :
           '💾 Enregistrer la configuration'}
        </button>
      </div>

    </div>
  );
}