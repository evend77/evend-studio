// CHEMIN : src/pages/gestionnaire/StudioConfigParutionFutur.tsx
// e-Vend Studio — Add-on « Parution future » : 🗓️ Configuration — Date de parution future (côté gestionnaire).
// Personnalise le compte à rebours affiché sur SA marketplace : couleurs, textes, animations, feux d'artifice.
// API : GET/PUT/DELETE /api/studio-forfaits/mv/parution-config  (l'enregistrement exige l'add-on actif)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MVParutionCountdown, { ConfigParution } from '../../templates/multivendeur/MVParutionCountdown';

const API_BASE = '/api';
const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-guide-parution-future-add-on';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

type Config = ConfigParution & {
  bloquer_wishlist: boolean; duree_vente_ouverte: number; vitesse_vague: 'lente' | 'normale' | 'rapide';
};

const DEFAULT_CONFIG: Config = {
  couleur_fond_debut: '#0d2b5d', couleur_fond_fin: '#0a1a3d', couleur_texte: '#e2ebff', couleur_titres: '#b7c9ff', couleur_chiffres: '#ffffff',
  couleur_bordure: '#000000', couleur_boite_fond: '#1a3a6e', couleur_boite_bordure: '#3a6aaf', taille_chiffres: 140, border_radius: 14,
  border_width: 3, ombre_active: true, ombre_intensite: 35, couleur_fond_mobile_debut: '#0d2b5d', couleur_fond_mobile_fin: '#0a1a3d',
  masquer_timezone_mobile: false, texte_titre: '⏳ Disponible dans :', texte_date_prefix: '🗓️ Mise en vente le',
  texte_timezone: '(Heure de Montréal — EST/EDT)', texte_seo: 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte: '🎉 La vente est ouverte !!!', texte_atc_bloque: '', afficher_feux_artifice: true, duree_feux_artifice: 5,
  afficher_timezone: true, afficher_seo: true, effet_vague: true, vitesse_vague: 'normale', effet_bordure: true, bloquer_wishlist: true,
  afficher_message_atc: false, duree_vente_ouverte: 24, duree_disparition_bloc: 5,
  couleur_feux_1: '#fbbf24', couleur_feux_2: '#f472b6', couleur_feux_3: '#60a5fa',
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
export default function StudioConfigParutionFutur({ gestionnaireId }: { gestionnaireId: number }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [addonActif, setAddonActif] = useState(true);
  const [personnalisee, setPersonnalisee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [onglet, setOnglet] = useState<'apparence' | 'textes' | 'options' | 'modeles' | 'apercu'>('apparence');
  const [dateTest, setDateTest] = useState(() => new Date(Date.now() + 90061 * 1000).toISOString());
  const [cleTest, setCleTest] = useState(0);

  const entetes = (json = false): Record<string, string> => {
    const h: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  };

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/mv/parution-config`, { headers: entetes(), credentials: 'include' });
      const d = await r.json().catch(() => null);
      if (r.ok && d && d.config) {
        setConfig({ ...DEFAULT_CONFIG, ...d.config });
        setAddonActif(d.addon_actif !== false);
        setPersonnalisee(d.personnalisee === true);
      }
    } catch { /* garde les valeurs par défaut */ }
    setChargement(false);
  }, [gestionnaireId]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [charger]);

  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig(prev => ({ ...prev, [key]: value }));

  const sauvegarder = async () => {
    setSauvegarde('saving'); setMessage('');
    try {
      const res = await fetch(`${API_BASE}/studio-forfaits/mv/parution-config`, { method: 'PUT', headers: entetes(true), credentials: 'include', body: JSON.stringify(config) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setSauvegarde('success'); setPersonnalisee(true); }
      else { setSauvegarde('error'); setMessage(d.error || 'Enregistrement impossible'); }
    } catch { setSauvegarde('error'); setMessage('Erreur réseau'); }
    setTimeout(() => setSauvegarde('idle'), 3000);
  };

  const reinitialiser = async () => {
    if (!window.confirm("Revenir à l'apparence par défaut de la plateforme ? Vos personnalisations seront supprimées.")) return;
    try { await fetch(`${API_BASE}/studio-forfaits/mv/parution-config`, { method: 'DELETE', headers: entetes(), credentials: 'include' }); } catch { /* ignore */ }
    setChargement(true); await charger();
  };

  const appliquerModele = (m: typeof MODELES[0]) => {
    setConfig({ ...DEFAULT_CONFIG, ...m.config } as Config);
    setOnglet('apercu');
  };

  const relancerCompteARebours = () => { setDateTest(new Date(Date.now() + 90061 * 1000).toISOString()); setCleTest(k => k + 1); };
  const simulerOuverture = () => { setDateTest(new Date(Date.now() + 4000).toISOString()); setCleTest(k => k + 1); };

  const onglets = [
    { id: 'apparence', label: '🎨 Apparence' },
    { id: 'textes',    label: '✏️ Textes' },
    { id: 'options',   label: '⚙️ Options' },
    { id: 'modeles',   label: '🎭 Modèles' },
    { id: 'apercu',    label: '👁️ Aperçu' },
  ] as const;

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: THEME.textLight }}>Chargement…</div>;

  const grille2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 32px' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '980px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🗓️ Configuration — Date de parution future
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Personnalisez l'apparence et les textes du compte à rebours affiché sur les annonces programmées de votre marketplace.
          </p>
        </div>
        <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, textDecoration: 'none',
          padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e0533, #0d0a2e)',
          color: 'white', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 16px rgba(30,5,51,0.4)',
        }}><span style={{ fontSize: '16px' }}>📖</span><span>Guide</span></a>
      </div>

      {!addonActif && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 18 }}>
          🔒 L'add-on <strong>Parution future</strong> n'est pas activé : vous pouvez regarder les réglages, mais l'enregistrement est désactivé. Activez-le dans <strong>Mon plan &amp; limites</strong>.
        </div>
      )}
      {message && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{message}</div>}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#f0f2f5', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            backgroundColor: onglet === o.id ? 'white' : 'transparent', color: onglet === o.id ? THEME.accent : THEME.textLight,
            boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s',
          }}>{o.label}</button>
        ))}
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {onglet === 'apparence' && (
          <div>
            <SectionTitre titre="🎨 Couleurs principales" />
            <div style={grille2}>
              <ChampCouleur label="Fond début (dégradé)" valeur={config.couleur_fond_debut} onChange={v => set('couleur_fond_debut', v)} />
              <ChampCouleur label="Fond fin (dégradé)"   valeur={config.couleur_fond_fin}   onChange={v => set('couleur_fond_fin', v)} />
              <ChampCouleur label="Texte principal"       valeur={config.couleur_texte}       onChange={v => set('couleur_texte', v)} />
              <ChampCouleur label="Titres / sous-titres"  valeur={config.couleur_titres}      onChange={v => set('couleur_titres', v)} />
              <ChampCouleur label="Chiffres du compte à rebours" valeur={config.couleur_chiffres} onChange={v => set('couleur_chiffres', v)} />
              <ChampCouleur label="Bordure"               valeur={config.couleur_bordure}     onChange={v => set('couleur_bordure', v)} />
            </div>

            <SectionTitre titre="📦 Boîtes des chiffres" />
            <div style={grille2}>
              <ChampCouleur label="Fond des boîtes"    valeur={config.couleur_boite_fond}    onChange={v => set('couleur_boite_fond', v)} />
              <ChampCouleur label="Bordure des boîtes" valeur={config.couleur_boite_bordure} onChange={v => set('couleur_boite_bordure', v)} />
            </div>
            <Slider label="Taille des chiffres" valeur={config.taille_chiffres} onChange={v => set('taille_chiffres', v)} min={80} max={220} unite="%" />

            <SectionTitre titre="📐 Forme du bloc" />
            <div style={grille2}>
              <Slider label="Rayon des coins"    valeur={config.border_radius} onChange={v => set('border_radius', v)} min={0} max={30} unite="px" />
              <Slider label="Épaisseur bordure"  valeur={config.border_width}  onChange={v => set('border_width', v)}  min={0} max={8}  unite="px" />
            </div>
            <Toggle label="Ombre portée" description="Ajoute une ombre autour du bloc" valeur={config.ombre_active} onChange={v => set('ombre_active', v)} />
            {config.ombre_active && <Slider label="Intensité de l'ombre" valeur={config.ombre_intensite} onChange={v => set('ombre_intensite', v)} min={5} max={100} unite="%" />}

            <SectionTitre titre="📱 Mobile (fond spécifique)" />
            <div style={grille2}>
              <ChampCouleur label="Fond mobile début" valeur={config.couleur_fond_mobile_debut} onChange={v => set('couleur_fond_mobile_debut', v)} />
              <ChampCouleur label="Fond mobile fin"   valeur={config.couleur_fond_mobile_fin}   onChange={v => set('couleur_fond_mobile_fin', v)} />
            </div>
          </div>
        )}

        {onglet === 'textes' && (
          <div>
            {([
              { label: 'Titre du compte à rebours',           cle: 'texte_titre',         ph: '⏳ Disponible dans :' },
              { label: 'Préfixe date de parution',            cle: 'texte_date_prefix',   ph: '🗓️ Mise en vente le' },
              { label: 'Indication fuseau horaire',           cle: 'texte_timezone',      ph: '(Heure de Montréal — EST/EDT)' },
              { label: "Message quand la vente s'ouvre",      cle: 'texte_vente_ouverte', ph: '🎉 La vente est ouverte !!!' },
              { label: 'Message à la place du bouton « Ajouter au panier »', cle: 'texte_atc_bloque', ph: 'Ex : Disponible le 23 avril à 14 h' },
            ] as { label: string; cle: 'texte_titre' | 'texte_date_prefix' | 'texte_timezone' | 'texte_vente_ouverte' | 'texte_atc_bloque'; ph: string }[]).map(({ label, cle, ph }) => (
              <div key={cle} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                <input type="text" value={config[cle]} placeholder={ph} maxLength={160} onChange={e => set(cle, e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Texte explicatif (sous le compte à rebours)</label>
              <textarea value={config.texte_seo} rows={3} maxLength={400} onChange={e => set('texte_seo', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>💡 Le « message à la place du bouton » s'affiche seulement si l'option est activée dans l'onglet Options.</p>
            </div>
          </div>
        )}

        {onglet === 'options' && (
          <div>
            <SectionTitre titre="🎆 Feux d'artifice" />
            <Toggle label="Feux d'artifice" description="Animation de feux d'artifice quand la vente s'ouvre (ordinateur seulement)" valeur={config.afficher_feux_artifice} onChange={v => set('afficher_feux_artifice', v)} />
            {config.afficher_feux_artifice && (
              <>
                <Slider label="Durée des feux d'artifice" valeur={config.duree_feux_artifice} onChange={v => set('duree_feux_artifice', v)} min={1} max={30} unite="s" />
                <div style={grille2}>
                  <ChampCouleur label="Couleur des feux n° 1" valeur={config.couleur_feux_1} onChange={v => set('couleur_feux_1', v)} />
                  <ChampCouleur label="Couleur des feux n° 2" valeur={config.couleur_feux_2} onChange={v => set('couleur_feux_2', v)} />
                  <ChampCouleur label="Couleur des feux n° 3" valeur={config.couleur_feux_3} onChange={v => set('couleur_feux_3', v)} />
                </div>
              </>
            )}

            <SectionTitre titre="🌊 Animations" />
            <Toggle label="Effet vague" description="Animation de reflet en vague sur le fond (ordinateur seulement)" valeur={config.effet_vague} onChange={v => set('effet_vague', v)} />
            <Toggle label="Effet bordure pulsante" description="Animation de bordure qui pulse doucement (ordinateur seulement)" valeur={config.effet_bordure} onChange={v => set('effet_bordure', v)} />

            <SectionTitre titre="⚙️ Comportement" />
            <Toggle label="Afficher le fuseau horaire"   description="Afficher la mention du fuseau horaire sous la date" valeur={config.afficher_timezone} onChange={v => set('afficher_timezone', v)} />
            <Toggle label="Masquer le fuseau sur mobile" description="Gain d'espace sur petit écran" valeur={config.masquer_timezone_mobile} onChange={v => set('masquer_timezone_mobile', v)} />
            <Toggle label="Texte explicatif"             description="Afficher le texte sous le compte à rebours" valeur={config.afficher_seo} onChange={v => set('afficher_seo', v)} />
            <Toggle label="Message à la place du bouton" description="Afficher un texte informatif plutôt que le bouton grisé « Pas encore disponible »" valeur={config.afficher_message_atc} onChange={v => set('afficher_message_atc', v)} />
            <Slider label="Délai avant disparition du bloc « vente ouverte »" valeur={config.duree_disparition_bloc} onChange={v => set('duree_disparition_bloc', v)} min={1} max={30} unite="s" />
          </div>
        )}

        {onglet === 'modeles' && (
          <div>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 20px 0' }}>Choisissez un modèle comme point de départ, puis personnalisez-le dans les autres onglets.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {MODELES.map(m => (
                <div key={m.id} style={{ borderRadius: '12px', border: `2px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '90px', background: m.apercu, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>{m.nom}</span>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 12px 0', lineHeight: 1.5 }}>{m.description}</p>
                    <button onClick={() => appliquerModele(m)} style={{ width: '100%', padding: '8px', backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Appliquer →</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>⚠️ Appliquer un modèle remplace vos réglages à l'écran. Cliquez sur « Sauvegarder » pour l'enregistrer.</p>
            </div>
          </div>
        )}

        {onglet === 'apercu' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <p style={{ fontSize: '12px', color: THEME.textLight, textAlign: 'center', marginBottom: '16px' }}>Aperçu en temps réel de ce que verront vos acheteurs (les changements non sauvegardés y sont déjà).</p>
            <div style={{ background: '#0a0a0a', borderRadius: 14, padding: 18 }}>
              <MVParutionCountdown key={cleTest} dateParution={dateTest} configOverride={config} />
              {config.afficher_message_atc && config.texte_atc_bloque && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', color: '#fcd34d', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>{config.texte_atc_bloque}</div>
              )}
              <div style={{ marginTop: 14, maxWidth: 230 }}><MVParutionCountdown key={'c' + cleTest} compact dateParution={dateTest} configOverride={config} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={simulerOuverture} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🎆 Tester l'ouverture de la vente</button>
              <button onClick={relancerCompteARebours} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>↺ Relancer le compte à rebours</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={sauvegarder} disabled={sauvegarde === 'saving' || !addonActif} style={{
          backgroundColor: sauvegarde === 'success' ? THEME.success : sauvegarde === 'error' ? THEME.danger : THEME.accent,
          color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700',
          cursor: sauvegarde === 'saving' || !addonActif ? 'not-allowed' : 'pointer', opacity: sauvegarde === 'saving' || !addonActif ? 0.6 : 1, transition: 'all 0.2s',
        }}>
          {sauvegarde === 'saving' ? '⏳ Sauvegarde...' : sauvegarde === 'success' ? '✅ Sauvegardé !' : sauvegarde === 'error' ? '❌ Erreur' : '💾 Sauvegarder'}
        </button>
        <button onClick={reinitialiser} disabled={!personnalisee} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: personnalisee ? 'pointer' : 'not-allowed', opacity: personnalisee ? 1 : 0.5 }}>
          🔄 Revenir au style par défaut
        </button>
        <button onClick={() => setOnglet('apercu')} style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>👁️ Aperçu</button>
      </div>
    </div>
  );
}