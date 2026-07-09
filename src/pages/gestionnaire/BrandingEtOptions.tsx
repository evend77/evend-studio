// src/pages/gestionnaire/BrandingEtOptions.tsx
// e-Vend Studio — Branding & Options — architecture "marketplace d'add-ons"
// Conçue pour scaler à des dizaines d'add-ons sans dupliquer de code par add-on.
// Ajouter un nouvel add-on simple = une entrée dans ADDONS, rien d'autre.
// Le Formulaire de contact est un cas spécial "configurable" (a un panneau détaillé).

import { useState, useEffect } from 'react';
import type { ChampFormulaire, ChampType } from '../../addons/contact/AddonContact';

const API_BASE = '/api';
const CP_CONTACT = '#2563eb';

interface Props { gestionnaireId: number; onOptionsUpdated?: () => void; }

// ─────────────────────────────────────────────────────────────────────────
// CATALOGUE D'ADD-ONS — ajouter un add-on simple = une ligne ici
// ─────────────────────────────────────────────────────────────────────────

interface AddonDef {
  id: string;              // doit correspondre au champ backend (snake_case)
  categorie: string;
  nom: string;
  icone: string;
  couleur: string;
  prix: number;
  description: string;
  necessiteConfirmation: boolean;
  badge?: string;
  configurable?: boolean;  // a un panneau de config détaillé (ex: formulaire de contact)
  detailsActifTexte?: string; // texte "Configurez dans..." pour les add-ons non-configurables ici
}

const ADDONS: AddonDef[] = [
  {
    id: 'formulaire_contact', categorie: 'Formulaires', nom: 'Formulaire de contact',
    icone: '📋', couleur: '#2563eb', prix: 2,
    description: "Formulaire personnalisable — fonctionne sur n'importe quel template.",
    necessiteConfirmation: true, configurable: true, badge: 'Recommandé',
  },
  {
    id: 'cacher_propulse', categorie: 'Branding', nom: 'Cacher le branding',
    icone: '🏷️', couleur: '#2563eb', prix: 2,
    description: 'Retirez le badge "Propulsé par e-Vend Studio" du footer de votre boutique.',
    necessiteConfirmation: false,
  },
  {
    id: 'verificateur_age', categorie: 'Sécurité & Conformité', nom: "Vérificateur d'âge",
    icone: '🔞', couleur: '#ef4444', prix: 5,
    description: "Popup de vérification d'âge — 3 modes, écran de blocage si refus, entièrement personnalisable.",
    necessiteConfirmation: true, detailsActifTexte: 'Configurez les détails dans Configuration → Vérificateur d\'âge',
  },
  {
    id: 'popup_annonce', categorie: 'Marketing & Promotions', nom: 'Popup Annonce',
    icone: '📢', couleur: '#e63946', prix: 3,
    description: 'Popup ou bannière configurable — promo, événement, fermeture. 3 formats, dates de début/fin.',
    necessiteConfirmation: true, detailsActifTexte: 'Configurez dans Configuration → Popup Annonce',
  },
];

const CATEGORIES_ORDRE = ['Formulaires', 'Branding', 'Marketing & Promotions', 'Sécurité & Conformité'];

// ─────────────────────────────────────────────────────────────────────────
// FORMULAIRE DE CONTACT — types, défauts, petits composants internes
// ─────────────────────────────────────────────────────────────────────────

interface ConfigFormulaireContact {
  titre: string;
  sousTitre: string;
  boutonTexte: string;
  messageSuccesTitre: string;
  messageSuccesTexte: string;
  destinataireEmail: string;
  champs: ChampFormulaire[];
}

const CHAMPS_SUGGERES: Array<{ id: string; type: ChampType; label: string; options?: string[] }> = [
  { id: 'nom',       type: 'text',  label: 'Nom' },
  { id: 'prenom',    type: 'text',  label: 'Prénom' },
  { id: 'email',     type: 'email', label: 'Email' },
  { id: 'telephone', type: 'tel',   label: 'Téléphone' },
  { id: 'sujet',     type: 'select', label: 'Sujet', options: ['Question générale', 'Devis', 'Autre'] },
  { id: 'message',   type: 'textarea', label: 'Message' },
];

const CONFIG_CONTACT_DEFAUT: ConfigFormulaireContact = {
  titre: 'Nous contacter',
  sousTitre: '',
  boutonTexte: 'Envoyer',
  messageSuccesTitre: 'Message envoyé!',
  messageSuccesTexte: 'Nous vous répondrons dans les plus brefs délais.',
  destinataireEmail: '',
  champs: [
    { id: 'nom',     type: 'text',     label: 'Nom',    requis: true },
    { id: 'email',   type: 'email',    label: 'Email',  requis: true, largeurPleine: true },
    { id: 'message', type: 'textarea', label: 'Message', requis: true, largeurPleine: true },
  ],
};

const TYPE_LABELS: Record<ChampType, string> = {
  text: 'Texte court', email: 'Email', tel: 'Téléphone',
  select: 'Menu déroulant', textarea: 'Zone de texte',
};

const InpC = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value || ''} placeholder={placeholder} onChange={(e: any) => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={(e: any) => e.target.style.borderColor = CP_CONTACT}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'} />
);
const TxtC = ({ value, onChange, placeholder, rows = 2 }: any) => (
  <textarea value={value || ''} placeholder={placeholder} rows={rows} onChange={(e: any) => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }} />
);
const FC = ({ label, children }: any) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {children}
  </div>
);

function EditeurChampContact({ champ, onChange, onSupprimer, onDeplacer, index, total }: {
  champ: ChampFormulaire; onChange: (c: ChampFormulaire) => void; onSupprimer: () => void;
  onDeplacer: (dir: -1 | 1) => void; index: number; total: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => onDeplacer(-1)} disabled={index === 0}
            style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: index === 0 ? '#f5f5f5' : '#fff', cursor: index === 0 ? 'default' : 'pointer', fontSize: 7 }}>▲</button>
          <button onClick={() => onDeplacer(1)} disabled={index === total - 1}
            style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: index === total - 1 ? '#f5f5f5' : '#fff', cursor: index === total - 1 ? 'default' : 'pointer', fontSize: 7 }}>▼</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{champ.label || '(sans nom)'}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{TYPE_LABELS[champ.type]} {champ.requis && '· Obligatoire'}</p>
        </div>
        <button onClick={() => setOuvert(!ouvert)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>{ouvert ? '✕' : '✏️'}</button>
        <button onClick={onSupprimer} style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
      </div>
      {ouvert && (
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb' }}>
          <FC label="Label affiché"><InpC value={champ.label} onChange={(v: string) => onChange({ ...champ, label: v })} /></FC>
          <FC label="Type de champ">
            <select value={champ.type} onChange={e => onChange({ ...champ, type: e.target.value as ChampType })}
              style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FC>
          <FC label="Placeholder (texte d'exemple)"><InpC value={champ.placeholder} onChange={(v: string) => onChange({ ...champ, placeholder: v })} /></FC>
          {champ.type === 'select' && (
            <FC label="Options (une par ligne)">
              <TxtC value={(champ.options || []).join('\n')} onChange={(v: string) => onChange({ ...champ, options: v.split('\n').filter(Boolean) })} rows={3} />
            </FC>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!champ.requis} onChange={e => onChange({ ...champ, requis: e.target.checked })} />
              Obligatoire
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!champ.largeurPleine} onChange={e => onChange({ ...champ, largeurPleine: e.target.checked })} />
              Pleine largeur
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CARTE D'ADD-ON — générique, sert pour tous les add-ons du catalogue
// ─────────────────────────────────────────────────────────────────────────

function AddonCard({ addon, actif, onToggle, enfant }: {
  addon: AddonDef; actif: boolean; onToggle: () => void; enfant?: React.ReactNode;
}) {
  return (
    <div style={{ border: `2px solid ${actif ? addon.couleur : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s', background: '#fff' }}>
      <div style={{ padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${addon.couleur}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{addon.icone}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{addon.nom}</h3>
            {actif && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>Actif</span>}
            {!actif && addon.badge && <span style={{ fontSize: 10, background: `${addon.couleur}15`, color: addon.couleur, padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>{addon.badge}</span>}
          </div>
          <p style={{ fontSize: 11, color: addon.couleur, fontWeight: 700, margin: '0 0 5px' }}>+{addon.prix.toFixed(2)} $/mois + tx</p>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, margin: 0 }}>{addon.description}</p>
        </div>
        <div onClick={onToggle}
          style={{ width: 40, height: 22, borderRadius: 11, background: actif ? addon.couleur : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginTop: 2 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: actif ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
      {actif && addon.detailsActifTexte && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{addon.detailsActifTexte}</p>
        </div>
      )}
      {actif && enfant}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL DE CONFIRMATION — générique, sert pour tous les add-ons payants
// ─────────────────────────────────────────────────────────────────────────

function ModalConfirmationAddon({ addon, onAnnuler, onConfirmer }: { addon: AddonDef; onAnnuler: () => void; onConfirmer: () => void }) {
  return (
    <div onClick={onAnnuler}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: 'inherit' }}>
        <div style={{ background: `linear-gradient(135deg, ${addon.couleur}, ${addon.couleur}cc)`, padding: '26px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{addon.icone}</div>
          <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Activer {addon.nom}</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Add-On — facturation mensuelle</p>
        </div>
        <div style={{ padding: '22px 28px' }}>
          <div style={{ background: `${addon.couleur}10`, border: `1px solid ${addon.couleur}30`, borderRadius: 12, padding: '13px 16px', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1a1a1a', lineHeight: 1.6 }}>
              Des frais de <strong style={{ color: addon.couleur }}>{addon.prix.toFixed(2)} $/mois + taxes</strong> seront ajoutés à votre abonnement, effectifs dès le prochain renouvellement.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAnnuler} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Annuler</button>
            <button onClick={onConfirmer}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 10, background: addon.couleur, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✅ Activer — {addon.prix.toFixed(2)} $/mois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────

export default function BrandingEtOptions({ gestionnaireId, onOptionsUpdated }: Props) {
  const [actifs, setActifs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle' | 'ok' | 'err'>('idle');
  const [confirmationEnCours, setConfirmationEnCours] = useState<AddonDef | null>(null);
  const [planActuel, setPlanActuel] = useState('simplisse-25');
  const [panneauOuvert, setPanneauOuvert] = useState<string | null>(null); // id de l'addon dont le panneau config est ouvert

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }).then(r => r.ok ? r.json() : {} as any),
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }).then(r => r.ok ? r.json() : {} as any),
    ]).then(([opts, gest]: [any, any]) => {
      const map: Record<string, boolean> = {};
      for (const a of ADDONS) map[a.id] = !!opts[a.id];
      setActifs(map);
      setPlanActuel(gest?.plan || 'simplisse-25');
    }).catch(() => {});
  }, [gestionnaireId]);

  const sauvegarderOptions = async (patch?: Record<string, boolean>) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const nouveauxActifs = { ...actifs, ...(patch || {}) };
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(nouveauxActifs),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
      onOptionsUpdated?.();
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  const toggleAddon = (addon: AddonDef) => {
    const estActif = !!actifs[addon.id];
    if (!estActif && addon.necessiteConfirmation) {
      setConfirmationEnCours(addon);
      return;
    }
    const nouveauxActifs = { ...actifs, [addon.id]: !estActif };
    setActifs(nouveauxActifs);
    if (estActif) {
      // Désactivation : sauvegarde immédiate
      sauvegarderOptions({ [addon.id]: false });
    }
    // Activation sans confirmation (cacher_propulse) : attend le bouton Sauvegarder global
  };

  const confirmerActivation = async () => {
    if (!confirmationEnCours) return;
    const id = confirmationEnCours.id;
    setConfirmationEnCours(null);
    setActifs(prev => ({ ...prev, [id]: true }));
    await sauvegarderOptions({ [id]: true });
    if (ADDONS.find(a => a.id === id)?.configurable) setPanneauOuvert(id);
  };

  // ── Formulaire de contact — config détaillée ─────────────────────────────
  const [configContact, setConfigContact] = useState<ConfigFormulaireContact>({ ...CONFIG_CONTACT_DEFAUT });
  const [sauvContact, setSauvContact] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [ajoutChampOuvert, setAjoutChampOuvert] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const existant = d?.config?.addons?.contact;
        if (existant) setConfigContact({ ...CONFIG_CONTACT_DEFAUT, ...existant });
      })
      .catch(() => {});
  }, [gestionnaireId]);

  const setC = (k: keyof ConfigFormulaireContact, v: any) => setConfigContact(prev => ({ ...prev, [k]: v }));
  const majChamp = (i: number, c: ChampFormulaire) => { const arr = [...configContact.champs]; arr[i] = c; setC('champs', arr); };
  const supprimerChamp = (i: number) => setC('champs', configContact.champs.filter((_, j) => j !== i));
  const deplacerChamp = (i: number, dir: -1 | 1) => {
    const arr = [...configContact.champs]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setC('champs', arr);
  };
  const ajouterChampSuggere = (s: typeof CHAMPS_SUGGERES[number]) => {
    setC('champs', [...configContact.champs, { id: `${s.id}_${Date.now()}`, type: s.type, label: s.label, options: s.options }]);
    setAjoutChampOuvert(false);
  };
  const ajouterChampVierge = () => {
    setC('champs', [...configContact.champs, { id: `champ_${Date.now()}`, type: 'text', label: '' }]);
    setAjoutChampOuvert(false);
  };

  const sauvegarderContact = async () => {
    setSauvContact('loading');
    try {
      const token = localStorage.getItem('token');
      const siteRes = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      const site = siteRes.ok ? await siteRes.json() : { config: {} };
      const nouvelleConfig = { ...site.config, addons: { ...(site.config?.addons || {}), contact: configContact } };
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ config: nouvelleConfig }),
      });
      if (!res.ok) throw new Error();
      setSauvContact('ok'); setTimeout(() => setSauvContact('idle'), 2500);
    } catch {
      setSauvContact('err'); setTimeout(() => setSauvContact('idle'), 3000);
    }
  };

  // ── Calculs dérivés ───────────────────────────────────────────────────
  const addonsActifs = ADDONS.filter(a => actifs[a.id]);
  const totalMensuel = addonsActifs.reduce((sum, a) => sum + a.prix, 0);
  const categories = CATEGORIES_ORDRE.map(cat => ({ nom: cat, addons: ADDONS.filter(a => a.categorie === cat) })).filter(c => c.addons.length > 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .boe-layout { display: flex; gap: 24px; align-items: flex-start; }
        .boe-sidebar { width: 260px; flex-shrink: 0; position: sticky; top: 20px; }
        @media (max-width: 760px) {
          .boe-layout { flex-direction: column; }
          .boe-sidebar { width: 100%; position: static; }
        }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚙️</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Branding & Options</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Personnalisez votre boutique et activez des fonctionnalités premium</p>
        </div>
      </div>

      <div className="boe-layout">

        {/* ── Colonne principale ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Section Actifs — résumé rapide */}
          {addonsActifs.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                ✅ {addonsActifs.length} add-on{addonsActifs.length > 1 ? 's' : ''} actif{addonsActifs.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {addonsActifs.map(a => (
                  <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${a.couleur}40`, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                    <span>{a.icone}</span>{a.nom}
                    <span style={{ color: a.couleur, fontWeight: 800 }}>{a.prix.toFixed(2)}$</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Catalogue par catégorie */}
          {categories.map(cat => (
            <div key={cat.nom} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{cat.nom}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {cat.addons.map(addon => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    actif={!!actifs[addon.id]}
                    onToggle={() => toggleAddon(addon)}
                    enfant={addon.configurable ? (
                      <div style={{ padding: '14px 16px', borderTop: '1px solid #f0f0f0' }}>
                        {panneauOuvert !== addon.id ? (
                          <button onClick={() => setPanneauOuvert(addon.id)}
                            style={{ width: '100%', padding: 9, border: `1.5px solid ${addon.couleur}`, borderRadius: 8, background: 'transparent', color: addon.couleur, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            ⚙️ Configurer le formulaire
                          </button>
                        ) : (
                          <div>
                            <button onClick={() => setPanneauOuvert(null)}
                              style={{ marginBottom: 12, background: 'none', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer', padding: 0 }}>
                              ✕ Fermer la config
                            </button>

                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Textes affichés</p>
                            <FC label="Titre du formulaire"><InpC value={configContact.titre} onChange={(v: string) => setC('titre', v)} /></FC>
                            <FC label="Sous-titre (optionnel)"><InpC value={configContact.sousTitre} onChange={(v: string) => setC('sousTitre', v)} /></FC>
                            <FC label="Texte du bouton"><InpC value={configContact.boutonTexte} onChange={(v: string) => setC('boutonTexte', v)} /></FC>
                            <FC label="Titre message de succès"><InpC value={configContact.messageSuccesTitre} onChange={(v: string) => setC('messageSuccesTitre', v)} /></FC>
                            <FC label="Texte message de succès"><TxtC value={configContact.messageSuccesTexte} onChange={(v: string) => setC('messageSuccesTexte', v)} rows={2} /></FC>
                            <FC label="Recevoir les messages à"><InpC value={configContact.destinataireEmail} onChange={(v: string) => setC('destinataireEmail', v)} placeholder="contact@monsite.ca" /></FC>

                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '16px 0 8px' }}>
                              Champs ({configContact.champs.length})
                            </p>
                            {configContact.champs.map((champ, i) => (
                              <EditeurChampContact key={champ.id} champ={champ} index={i} total={configContact.champs.length}
                                onChange={c => majChamp(i, c)} onSupprimer={() => supprimerChamp(i)} onDeplacer={dir => deplacerChamp(i, dir)} />
                            ))}

                            {!ajoutChampOuvert ? (
                              <button onClick={() => setAjoutChampOuvert(true)}
                                style={{ width: '100%', padding: 9, border: `2px dashed ${CP_CONTACT}`, borderRadius: 7, background: 'transparent', color: CP_CONTACT, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                + Ajouter un champ
                              </button>
                            ) : (
                              <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                  {CHAMPS_SUGGERES.map(s => (
                                    <button key={s.id} onClick={() => ajouterChampSuggere(s)}
                                      style={{ fontSize: 11, padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#f9f9f9', cursor: 'pointer' }}>
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={ajouterChampVierge} style={{ flex: 1, padding: 7, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>+ Champ vierge</button>
                                  <button onClick={() => setAjoutChampOuvert(false)} style={{ padding: '7px 12px', border: 'none', borderRadius: 6, background: '#f3f4f6', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
                                </div>
                              </div>
                            )}

                            <button onClick={sauvegarderContact} disabled={sauvContact === 'loading'}
                              style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff',
                                background: sauvContact === 'ok' ? '#10b981' : sauvContact === 'err' ? '#dc2626' : CP_CONTACT }}>
                              {sauvContact === 'loading' ? '⏳...' : sauvContact === 'ok' ? '✅ Sauvegardé!' : sauvContact === 'err' ? '❌ Erreur' : '💾 Sauvegarder le formulaire'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Résumé de facturation — collant ────────────────────────────── */}
        <div className="boe-sidebar">
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', margin: '0 0 14px' }}>💰 Facturation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                <span>Plan actif</span>
                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{planActuel}</span>
              </div>
              {addonsActifs.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                  <span>{a.nom}</span><span style={{ fontWeight: 600, color: a.couleur }}>+{a.prix.toFixed(2)}$</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>Total options</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: totalMensuel > 0 ? '#dc2626' : '#888' }}>
                {totalMensuel > 0 ? `+${totalMensuel.toFixed(2).replace('.', ',')} $/mois` : 'Aucune'}
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#aaa', margin: '8px 0 14px' }}>+ taxes · ajusté au prochain renouvellement</p>

            <button onClick={() => sauvegarderOptions()} disabled={saving}
              style={{ width: '100%', padding: 11, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳...' : '💾 Sauvegarder'}
            </button>
            {statut === 'ok' && <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, textAlign: 'center', margin: '8px 0 0' }}>✅ Mis à jour!</p>}
            {statut === 'err' && <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textAlign: 'center', margin: '8px 0 0' }}>❌ Erreur</p>}
          </div>
        </div>
      </div>

      {confirmationEnCours && (
        <ModalConfirmationAddon
          addon={confirmationEnCours}
          onAnnuler={() => setConfirmationEnCours(null)}
          onConfirmer={confirmerActivation}
        />
      )}
    </div>
  );
}