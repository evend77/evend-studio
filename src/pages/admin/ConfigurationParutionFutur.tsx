// src/pages/admin/ConfigurationParutionFutur.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ParutionInstructionsModal } from '../../components/ParutionInstructionsModal';
import { API_BASE } from '../../config/api';

const THEME = {
  accent:     '#2d6a9f',
  accentLight:'#e8f2fb',
  bg:         '#f0f2f5',
  card:       '#ffffff',
  border:     '#e1e4e8',
  text:       '#1a2332',
  textLight:  '#6b7280',
  danger:     '#dc2626',
  success:    '#16a34a',
  warning:    '#d97706',
};

interface Config {
  couleur_fond_debut:        string;
  couleur_fond_fin:          string;
  couleur_texte:             string;
  couleur_titres:            string;
  couleur_chiffres:          string;
  couleur_bordure:           string;
  couleur_boite_fond:        string;
  couleur_boite_bordure:     string;
  taille_chiffres:           number;
  border_radius:             number;
  border_width:              number;
  ombre_active:              boolean;
  ombre_intensite:           number;
  couleur_fond_mobile_debut: string;
  couleur_fond_mobile_fin:   string;
  masquer_timezone_mobile:   boolean;
  texte_titre:               string;
  texte_date_prefix:         string;
  texte_timezone:            string;
  texte_seo:                 string;
  texte_vente_ouverte:       string;
  texte_atc_bloque:          string;
  afficher_feux_artifice:    boolean;
  duree_feux_artifice:       number;
  afficher_timezone:         boolean;
  afficher_seo:              boolean;
  effet_vague:               boolean;
  vitesse_vague:             'lente' | 'normale' | 'rapide';
  effet_bordure:             boolean;
  bloquer_wishlist:          boolean;
  afficher_message_atc:      boolean;
  duree_vente_ouverte:       number;
  duree_disparition_bloc:    number;
}

const DEFAULT_CONFIG: Config = {
  couleur_fond_debut:        '#0d2b5d',
  couleur_fond_fin:          '#0a1a3d',
  couleur_texte:             '#e2ebff',
  couleur_titres:            '#b7c9ff',
  couleur_chiffres:          '#ffffff',
  couleur_bordure:           '#000000',
  couleur_boite_fond:        '#1a3a6e',
  couleur_boite_bordure:     '#3a6aaf',
  taille_chiffres:           140,
  border_radius:             14,
  border_width:              3,
  ombre_active:              true,
  ombre_intensite:           35,
  couleur_fond_mobile_debut: '#0d2b5d',
  couleur_fond_mobile_fin:   '#0a1a3d',
  masquer_timezone_mobile:   false,
  texte_titre:               '⏳ Disponible dans :',
  texte_date_prefix:         '🗓️ Mise en vente le',
  texte_timezone:            '(Heure de Montréal — EST/EDT)',
  texte_seo:                 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte:       '🎉 La vente est ouverte !!!',
  texte_atc_bloque:          '',
  afficher_feux_artifice:    true,
  duree_feux_artifice:       5,
  afficher_timezone:         true,
  afficher_seo:              true,
  effet_vague:               true,
  vitesse_vague:             'normale',
  effet_bordure:             true,
  bloquer_wishlist:          true,
  afficher_message_atc:      false,
  duree_vente_ouverte:       24,
  duree_disparition_bloc:    5,
};

const MODELES: { id: number; nom: string; emoji: string; description: string; apercu: string; config: Partial<Config> }[] = [
  {
    id: 1, nom: 'Classique', emoji: '🌊',
    description: 'Le modèle original — bleu nuit élégant avec reflet en vague',
    apercu: 'linear-gradient(135deg, #0d2b5d, #0a1a3d)',
    config: { ...DEFAULT_CONFIG },
  },
  {
    id: 2, nom: 'Minimaliste', emoji: '⬜',
    description: 'Sobre et professionnel — fond blanc avec bordure fine grise',
    apercu: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    config: {
      couleur_fond_debut: '#f8fafc', couleur_fond_fin: '#e2e8f0',
      couleur_texte: '#334155', couleur_titres: '#64748b',
      couleur_chiffres: '#1e293b', couleur_bordure: '#cbd5e1',
      couleur_boite_fond: '#edf2f7', couleur_boite_bordure: '#cbd5e1',
      couleur_fond_mobile_debut: '#f8fafc', couleur_fond_mobile_fin: '#e2e8f0',
      border_radius: 8, border_width: 1, ombre_active: false,
      effet_vague: false, effet_bordure: false, afficher_feux_artifice: false,
      texte_vente_ouverte: '✓ La vente est maintenant ouverte',
    },
  },
  {
    id: 3, nom: 'Luxe', emoji: '✨',
    description: 'Noir et or — classe et prestige pour vos articles premium',
    apercu: 'linear-gradient(135deg, #1a1008, #2d1f0a)',
    config: {
      couleur_fond_debut: '#1a1008', couleur_fond_fin: '#2d1f0a',
      couleur_texte: '#d4a855', couleur_titres: '#c9961a',
      couleur_chiffres: '#f5d78a', couleur_bordure: '#c9961a',
      couleur_boite_fond: '#2a1f08', couleur_boite_bordure: '#c9961a',
      couleur_fond_mobile_debut: '#1a1008', couleur_fond_mobile_fin: '#2d1f0a',
      border_radius: 6, border_width: 2, ombre_active: true, ombre_intensite: 50,
      effet_vague: true, effet_bordure: true,
      texte_vente_ouverte: '✨ La vente exclusive est ouverte !',
    },
  },
  {
    id: 4, nom: 'Néon', emoji: '⚡',
    description: 'Fond sombre avec accents cyan et vert néon — high-tech et gaming',
    apercu: 'linear-gradient(135deg, #030712, #0f172a)',
    config: {
      couleur_fond_debut: '#030712', couleur_fond_fin: '#0f172a',
      couleur_texte: '#00f5d4', couleur_titres: '#7df9ff',
      couleur_chiffres: '#00ff88', couleur_bordure: '#00f5d4',
      couleur_boite_fond: '#0a1f1e', couleur_boite_bordure: '#00f5d4',
      couleur_fond_mobile_debut: '#030712', couleur_fond_mobile_fin: '#0f172a',
      border_radius: 4, border_width: 2, ombre_active: true, ombre_intensite: 60,
      effet_vague: true, vitesse_vague: 'rapide', effet_bordure: true,
      texte_vente_ouverte: '⚡ SYSTÈME EN LIGNE — VENTE ACTIVÉE !',
    },
  },
  {
    id: 5, nom: 'Feu', emoji: '🔥',
    description: 'Dégradé rouge-orange intense — pour les offres flash et ventes choc',
    apercu: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
    config: {
      couleur_fond_debut: '#7f1d1d', couleur_fond_fin: '#c2410c',
      couleur_texte: '#fef3c7', couleur_titres: '#fcd34d',
      couleur_chiffres: '#ffffff', couleur_bordure: '#f97316',
      couleur_boite_fond: '#a03010', couleur_boite_bordure: '#fcd34d',
      couleur_fond_mobile_debut: '#7f1d1d', couleur_fond_mobile_fin: '#c2410c',
      border_radius: 10, border_width: 3, ombre_active: true, ombre_intensite: 55,
      effet_vague: true, vitesse_vague: 'rapide', effet_bordure: true,
      texte_titre: '🔥 Offre flash — disponible dans :',
      texte_vente_ouverte: '🔥 L\'offre flash est maintenant disponible !',
    },
  },
  {
    id: 6, nom: 'Galaxy WOW', emoji: '🌌',
    description: 'Violet cosmos — le plus spectaculaire, pour un effet waouh garanti',
    apercu: 'linear-gradient(135deg, #1e0533, #0d0a2e)',
    config: {
      couleur_fond_debut: '#1e0533', couleur_fond_fin: '#0d0a2e',
      couleur_texte: '#e9d5ff', couleur_titres: '#c084fc',
      couleur_chiffres: '#ffffff', couleur_bordure: '#7c3aed',
      couleur_boite_fond: '#2d1050', couleur_boite_bordure: '#a78bfa',
      couleur_fond_mobile_debut: '#1e0533', couleur_fond_mobile_fin: '#0d0a2e',
      border_radius: 16, border_width: 2, ombre_active: true, ombre_intensite: 70,
      taille_chiffres: 160, effet_vague: true, vitesse_vague: 'lente', effet_bordure: true,
      afficher_feux_artifice: true, duree_feux_artifice: 8,
      texte_titre: '🌌 Lancement cosmique dans :',
      texte_vente_ouverte: '🌌 Le lancement est en cours — Bienvenue dans la galaxie !',
    },
  },
];

// ── Champ couleur avec fix bug picker ──────────────────────────────────────
function ChampCouleur({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(valeur);
  useEffect(() => { setLocal(valeur); }, [valeur]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{ width: '44px', height: '44px', borderRadius: '8px', border: `2px solid ${THEME.border}`, cursor: 'pointer', backgroundColor: local, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
          onClick={() => inputRef.current?.click()}
        />
        <input ref={inputRef} type="color" defaultValue={local}
          onInput={e => { const v = (e.target as HTMLInputElement).value; setLocal(v); onChange(v); }}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        <input type="text" value={local}
          onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
          style={{ flex: 1, padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
}

function Slider({ label, valeur, onChange, min, max, unite = '' }: { label: string; valeur: number; onChange: (v: number) => void; min: number; max: number; unite?: string }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>{valeur}{unite}</span>
      </div>
      <input type="range" min={min} max={max} value={valeur} onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: THEME.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#aaa' }}>{min}{unite}</span>
        <span style={{ fontSize: '10px', color: '#aaa' }}>{max}{unite}</span>
      </div>
    </div>
  );
}

function Toggle({ label, description, valeur, onChange }: { label: string; description: string; valeur: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: `1px solid ${THEME.border}`, marginBottom: '10px' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 2px 0' }}>{label}</p>
        <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{description}</p>
      </div>
      <div onClick={() => onChange(!valeur)}
        style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: valeur ? THEME.success : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '16px' }}>
        <div style={{ position: 'absolute', top: '2px', left: valeur ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

function SectionTitre({ titre }: { titre: string }) {
  return <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '20px 0 16px 0', paddingBottom: '12px', borderBottom: `1px solid ${THEME.border}` }}>{titre}</p>;
}

// ── Composant principal ────────────────────────────────────────────────────
export default function ConfigurationParutionFutur({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [onglet, setOnglet] = useState<'apparence' | 'textes' | 'options' | 'modeles' | 'apercu'>('apparence');
  const [instructionsOuvertes, setInstructionsOuvertes] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/admin/configuration/parution-futur`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // L'API retourne { success: true, config: {...} } — on lit data.config
        const cfg = data?.config || data;
        if (cfg && typeof cfg === 'object' && !cfg.success) {
          setConfig({ ...DEFAULT_CONFIG, ...cfg });
        }
      })
      .catch(() => {});
  }, []);

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const sauvegarder = async () => {
    console.log('[e-Vend] Sauvegarder cliqué, config:', config.couleur_fond_debut);
    setSauvegarde('saving');
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/admin/configuration/parution-futur`;
      console.log('[e-Vend] POST vers:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      console.log('[e-Vend] Réponse:', data);
      setSauvegarde(res.ok ? 'success' : 'error');
    } catch(err) {
      console.error('[e-Vend] Erreur fetch:', err);
      setSauvegarde('error');
    }
    setTimeout(() => setSauvegarde('idle'), 3000);
  };

  const appliquerModele = (m: typeof MODELES[0]) => {
    // Remplacer TOUTE la config par le modèle — pas de merge avec l'ancienne
    setConfig({ ...DEFAULT_CONFIG, ...m.config } as Config);
    setOnglet('apercu');
  };

  // ── Aperçu live ──
  const Apercu = () => {
    const [sec, setSec] = useState(90061);
    useEffect(() => {
      const t = setInterval(() => setSec(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(t);
    }, []);
    const jours    = Math.floor(sec / 86400);
    const heures   = Math.floor((sec % 86400) / 3600);
    const minutes  = Math.floor((sec % 3600) / 60);
    const secondes = sec % 60;
    const taille   = `${config.taille_chiffres / 100}rem`;

    return (
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <p style={{ fontSize: '12px', color: THEME.textLight, textAlign: 'center', marginBottom: '16px' }}>
          Aperçu en temps réel — les animations CSS complètes s'appliquent sur Shopify
        </p>
        <div style={{
          overflow: 'hidden', padding: '20px',
          background: `linear-gradient(135deg, ${config.couleur_fond_debut}, ${config.couleur_fond_fin})`,
          borderRadius: `${config.border_radius}px`,
          color: config.couleur_texte, textAlign: 'center',
          border: `${config.border_width}px solid ${config.couleur_bordure}`,
          boxShadow: config.ombre_active ? `0 0 ${config.ombre_intensite}px rgba(0,0,0,0.4)` : 'none',
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: config.couleur_texte, margin: '0 0 4px 0' }}>
            {config.texte_date_prefix} <strong>mercredi 23 avril 2026 à 14:00</strong>
          </p>
          {config.afficher_timezone && (
            <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: '0 0 10px 0' }}>{config.texte_timezone}</p>
          )}
          <p style={{ fontSize: '0.85rem', marginBottom: '12px', color: config.couleur_titres }}>{config.texte_titre}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {[['jours', jours], ['heures', heures], ['min', minutes], ['sec', secondes]].map(([label, val]) => (
              <div key={label as string} style={{ backgroundColor: config.couleur_boite_fond, border: `1px solid ${config.couleur_boite_bordure}`, borderRadius: '10px', padding: '10px 12px', minWidth: '62px' }}>
                <div style={{ fontSize: taille, fontWeight: 700, color: config.couleur_chiffres }}>{String(val).padStart(2, '0')}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.75, color: config.couleur_texte }}>{label}</div>
              </div>
            ))}
          </div>
          {config.afficher_seo && (
            <p style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '10px', marginBottom: 0 }}>{config.texte_seo}</p>
          )}
        </div>
        {config.afficher_message_atc && config.texte_atc_bloque && (
          <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#fef9c3', border: '1px solid #fcd34d', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
            {config.texte_atc_bloque}
          </div>
        )}
      </div>
    );
  };

  const onglets = [
    { id: 'apparence', label: '🎨 Apparence' },
    { id: 'textes',    label: '✏️ Textes' },
    { id: 'options',   label: '⚙️ Options' },
    { id: 'modeles',   label: '🎭 Modèles' },
    { id: 'apercu',    label: '👁️ Aperçu' },
  ] as const;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '980px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🗓️ Configuration — Date de parution future
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Personnalisez l'apparence et les textes du widget de compte à rebours affiché sur les pages produit Shopify.
          </p>
        </div>
        <button
          onClick={() => setInstructionsOuvertes(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #1e0533, #0d0a2e)',
            color: 'white', fontSize: '13px', fontWeight: '700',
            boxShadow: '0 4px 16px rgba(30,5,51,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <span style={{ fontSize: '16px' }}>📋</span>
          <span>Guide d'installation</span>
        </button>
      </div>

      <ParutionInstructionsModal ouvert={instructionsOuvertes} onFermer={() => setInstructionsOuvertes(false)} />

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#f0f2f5', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            backgroundColor: onglet === o.id ? 'white' : 'transparent',
            color: onglet === o.id ? THEME.accent : THEME.textLight,
            boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{o.label}</button>
        ))}
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* APPARENCE */}
        {onglet === 'apparence' && (
          <div>
            <SectionTitre titre="🎨 Couleurs principales" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <ChampCouleur label="Fond début (dégradé)" valeur={config.couleur_fond_debut} onChange={v => set('couleur_fond_debut', v)} />
              <ChampCouleur label="Fond fin (dégradé)"   valeur={config.couleur_fond_fin}   onChange={v => set('couleur_fond_fin', v)} />
              <ChampCouleur label="Texte principal"       valeur={config.couleur_texte}       onChange={v => set('couleur_texte', v)} />
              <ChampCouleur label="Titres / sous-titres"  valeur={config.couleur_titres}      onChange={v => set('couleur_titres', v)} />
              <ChampCouleur label="Chiffres countdown"    valeur={config.couleur_chiffres}    onChange={v => set('couleur_chiffres', v)} />
              <ChampCouleur label="Bordure"               valeur={config.couleur_bordure}     onChange={v => set('couleur_bordure', v)} />
            </div>

            <SectionTitre titre="📦 Boîtes des chiffres" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <ChampCouleur label="Fond des boîtes"    valeur={config.couleur_boite_fond}    onChange={v => set('couleur_boite_fond', v)} />
              <ChampCouleur label="Bordure des boîtes" valeur={config.couleur_boite_bordure} onChange={v => set('couleur_boite_bordure', v)} />
            </div>
            <Slider label="Taille des chiffres" valeur={config.taille_chiffres} onChange={v => set('taille_chiffres', v)} min={80} max={220} unite="%" />

            <SectionTitre titre="📐 Forme du bloc" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <Slider label="Rayon des coins"    valeur={config.border_radius} onChange={v => set('border_radius', v)} min={0} max={30} unite="px" />
              <Slider label="Épaisseur bordure"  valeur={config.border_width}  onChange={v => set('border_width', v)}  min={0} max={8}  unite="px" />
            </div>
            <Toggle label="Ombre portée" description="Ajoute une ombre autour du bloc" valeur={config.ombre_active} onChange={v => set('ombre_active', v)} />
            {config.ombre_active && <Slider label="Intensité de l'ombre" valeur={config.ombre_intensite} onChange={v => set('ombre_intensite', v)} min={5} max={100} unite="%" />}

            <SectionTitre titre="📱 Mobile (fond spécifique)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <ChampCouleur label="Fond mobile début" valeur={config.couleur_fond_mobile_debut} onChange={v => set('couleur_fond_mobile_debut', v)} />
              <ChampCouleur label="Fond mobile fin"   valeur={config.couleur_fond_mobile_fin}   onChange={v => set('couleur_fond_mobile_fin', v)} />
            </div>
          </div>
        )}

        {/* TEXTES */}
        {onglet === 'textes' && (
          <div>
            {[
              { label: 'Titre du countdown',                  cle: 'texte_titre'          as keyof Config, ph: '⏳ Disponible dans :' },
              { label: 'Préfixe date de parution',            cle: 'texte_date_prefix'    as keyof Config, ph: '🗓️ Mise en vente le' },
              { label: 'Indication fuseau horaire',           cle: 'texte_timezone'       as keyof Config, ph: '(Heure de Montréal — EST/EDT)' },
              { label: "Message quand la vente s'ouvre",      cle: 'texte_vente_ouverte'  as keyof Config, ph: '🎉 La vente est ouverte !!!' },
              { label: 'Message à la place du bouton ATC',    cle: 'texte_atc_bloque'     as keyof Config, ph: 'Ex: Disponible le 23 avril à 14h00' },
            ].map(({ label, cle, ph }) => (
              <div key={cle} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                <input type="text" value={config[cle] as string} placeholder={ph}
                  onChange={e => set(cle, e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Texte SEO (sous le countdown)</label>
              <textarea value={config.texte_seo} rows={3}
                onChange={e => set('texte_seo', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>💡 Le champ "Message ATC" s'affiche sous le countdown si l'option est activée dans l'onglet Options.</p>
            </div>
          </div>
        )}

        {/* OPTIONS */}
        {onglet === 'options' && (
          <div>
            <SectionTitre titre="🎆 Feux d'artifice" />
            <Toggle label="Feux d'artifice" description="Animation feux d'artifice quand la vente s'ouvre (PC seulement)" valeur={config.afficher_feux_artifice} onChange={v => set('afficher_feux_artifice', v)} />
            {config.afficher_feux_artifice && <Slider label="Durée des feux d'artifice" valeur={config.duree_feux_artifice} onChange={v => set('duree_feux_artifice', v)} min={1} max={30} unite="s" />}

            <SectionTitre titre="🌊 Animations" />
            <Toggle label="Effet vague" description="Animation de reflet en vague sur le fond (PC seulement)" valeur={config.effet_vague} onChange={v => set('effet_vague', v)} />
            {config.effet_vague && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vitesse de la vague</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['lente', 'normale', 'rapide'] as const).map(v => (
                    <button key={v} onClick={() => set('vitesse_vague', v)} style={{
                      flex: 1, padding: '8px', border: `2px solid ${config.vitesse_vague === v ? THEME.accent : THEME.border}`,
                      borderRadius: '8px', backgroundColor: config.vitesse_vague === v ? THEME.accentLight : 'white',
                      color: config.vitesse_vague === v ? THEME.accent : THEME.textLight,
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize',
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            )}
            <Toggle label="Effet bordure pulsante" description="Animation de bordure qui pulse doucement (PC seulement)" valeur={config.effet_bordure} onChange={v => set('effet_bordure', v)} />

            <SectionTitre titre="⚙️ Comportement" />
            <Toggle label="Afficher fuseau horaire"     description="Afficher la mention du fuseau horaire sous la date"            valeur={config.afficher_timezone}      onChange={v => set('afficher_timezone', v)} />
            <Toggle label="Masquer timezone sur mobile" description="Gain d'espace sur petit écran"                                  valeur={config.masquer_timezone_mobile} onChange={v => set('masquer_timezone_mobile', v)} />
            <Toggle label="Texte SEO"                   description="Afficher le texte explicatif sous le countdown"                 valeur={config.afficher_seo}            onChange={v => set('afficher_seo', v)} />
            <Toggle label="Bloquer liste de souhaits"   description="Empêche l'ajout en wishlist avant la parution"                  valeur={config.bloquer_wishlist}        onChange={v => set('bloquer_wishlist', v)} />
            <Toggle label="Message à la place du bouton ATC" description="Afficher un texte informatif plutôt que le bouton grisé"   valeur={config.afficher_message_atc}   onChange={v => set('afficher_message_atc', v)} />
            <Slider label="Durée d'affichage 'vente ouverte'"  valeur={config.duree_vente_ouverte}    onChange={v => set('duree_vente_ouverte', v)}    min={1} max={48} unite="h" />
            <Slider label="Délai avant disparition du bloc"    valeur={config.duree_disparition_bloc} onChange={v => set('duree_disparition_bloc', v)} min={1} max={30} unite="s" />
          </div>
        )}

        {/* MODÈLES */}
        {onglet === 'modeles' && (
          <div>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 20px 0' }}>
              Choisissez un modèle comme point de départ, puis personnalisez-le dans les autres onglets.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {MODELES.map(m => (
                <div key={m.id} style={{ borderRadius: '12px', border: `2px solid ${THEME.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = THEME.accent; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(45,106,159,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = THEME.border; el.style.transform = 'none'; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>
                  <div style={{ height: '90px', background: m.apercu, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>{m.nom}</span>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 12px 0', lineHeight: 1.5 }}>{m.description}</p>
                    <button onClick={() => appliquerModele(m)} style={{
                      width: '100%', padding: '8px', backgroundColor: THEME.accent, color: 'white',
                      border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}>Appliquer →</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                ⚠️ Appliquer un modèle remplace votre configuration actuelle. Pensez à sauvegarder avant si vous voulez conserver vos réglages.
              </p>
            </div>
          </div>
        )}

        {/* APERÇU */}
        {onglet === 'apercu' && <Apercu />}
      </div>

      {/* Boutons action */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={sauvegarder} disabled={sauvegarde === 'saving'} style={{
          backgroundColor: sauvegarde === 'success' ? THEME.success : sauvegarde === 'error' ? THEME.danger : THEME.accent,
          color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px',
          fontSize: '14px', fontWeight: '700', cursor: sauvegarde === 'saving' ? 'not-allowed' : 'pointer',
          opacity: sauvegarde === 'saving' ? 0.7 : 1, transition: 'all 0.2s',
        }}>
          {sauvegarde === 'saving' ? '⏳ Sauvegarde...' : sauvegarde === 'success' ? '✅ Sauvegardé !' : sauvegarde === 'error' ? '❌ Erreur' : '💾 Sauvegarder'}
        </button>
        <button onClick={() => setConfig(DEFAULT_CONFIG)} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          🔄 Réinitialiser
        </button>
        <button onClick={() => setOnglet('apercu')} style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          👁️ Aperçu
        </button>
      </div>

      <div style={{ marginTop: '20px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px' }}>
        <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
          <strong>📌 Prochaine étape :</strong> Connecter cette configuration au widget <code>parution-futur-widget.js</code> pour que les changements s'appliquent automatiquement sur Shopify.
        </p>
      </div>
    </div>
  );
}