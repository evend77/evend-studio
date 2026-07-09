// 📁 src/pages/studio/ConfigAddonContact.tsx
// e-Vend Studio — Configuration de l'add-on Contact
// Le gestionnaire choisit SES champs, peu importe le template utilisé.
// Cette config est sauvegardée dans sites.config.addons.contact
// et sera lue par AddonContact.tsx au moment du rendu, quel que soit le template.

import { useState, useEffect } from 'react';
import type { ChampFormulaire, ChampType } from '../../addons/contact/AddonContact';

const API_BASE = '/api';
const CP = '#2563eb'; // couleur neutre studio (pas liée à un template)

// ─── Modèle de config sauvegardé ──────────────────────────────────────────────
export interface ConfigAddonContact {
  actif: boolean;
  titre: string;
  sousTitre: string;
  boutonTexte: string;
  messageSuccesTitre: string;
  messageSuccesTexte: string;
  destinataireEmail: string; // où les messages sont envoyés (vide = email du compte)
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

export const CONFIG_ADDON_CONTACT_DEFAUT: ConfigAddonContact = {
  actif: true,
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

// ─── Petits composants réutilisés ─────────────────────────────────────────────
const Inp = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={e => (e.target as HTMLInputElement).style.borderColor = CP}
    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
);
const Txt = ({ value, onChange, placeholder, rows = 2 }: any) => (
  <textarea value={value || ''} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }} />
);
const F = ({ label, children }: any) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {children}
  </div>
);

const TYPE_LABELS: Record<ChampType, string> = {
  text: 'Texte court', email: 'Email', tel: 'Téléphone',
  select: 'Menu déroulant', textarea: 'Zone de texte',
};

// ─── Éditeur d'un champ (dans la liste) ──────────────────────────────────────
function EditeurChamp({ champ, onChange, onSupprimer, onDeplacer, index, total }: {
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
          <F label="Label affiché"><Inp value={champ.label} onChange={(v: string) => onChange({ ...champ, label: v })} /></F>
          <F label="Type de champ">
            <select value={champ.type} onChange={e => onChange({ ...champ, type: e.target.value as ChampType })}
              style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Placeholder (texte d'exemple)"><Inp value={champ.placeholder} onChange={(v: string) => onChange({ ...champ, placeholder: v })} /></F>
          {champ.type === 'select' && (
            <F label="Options (une par ligne)">
              <Txt value={(champ.options || []).join('\n')} onChange={(v: string) => onChange({ ...champ, options: v.split('\n').filter(Boolean) })} rows={3} />
            </F>
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

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function ConfigAddonContact({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigAddonContact>({ ...CONFIG_ADDON_CONTACT_DEFAUT });
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  // Charger la config existante (nichée sous config.addons.contact dans sites)
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const existant = d?.config?.addons?.contact;
        if (existant) setConfig({ ...CONFIG_ADDON_CONTACT_DEFAUT, ...existant });
      })
      .catch(() => {});
  }, [gestionnaireId]);

  const set = (k: keyof ConfigAddonContact, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const majChamp = (i: number, c: ChampFormulaire) => {
    const arr = [...config.champs]; arr[i] = c; set('champs', arr);
  };
  const supprimerChamp = (i: number) => set('champs', config.champs.filter((_, j) => j !== i));
  const deplacerChamp = (i: number, dir: -1 | 1) => {
    const arr = [...config.champs]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    set('champs', arr);
  };
  const ajouterChampSuggere = (s: typeof CHAMPS_SUGGERES[number]) => {
    set('champs', [...config.champs, { id: `${s.id}_${Date.now()}`, type: s.type, label: s.label, options: s.options }]);
    setAjoutOuvert(false);
  };
  const ajouterChampVierge = () => {
    set('champs', [...config.champs, { id: `champ_${Date.now()}`, type: 'text', label: '' }]);
    setAjoutOuvert(false);
  };

  const handleSave = async () => {
    setSauv('loading');
    try {
      const token = localStorage.getItem('token');
      // On récupère d'abord la config actuelle du site pour ne pas écraser le reste (template, etc.)
      const siteRes = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      const site = siteRes.ok ? await siteRes.json() : { config: {} };
      const nouvelleConfig = { ...site.config, addons: { ...(site.config?.addons || {}), contact: config } };

      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ config: nouvelleConfig }),
      });
      if (!res.ok) throw new Error();
      setSauv('ok'); setTimeout(() => setSauv('idle'), 2500);
    } catch {
      setSauv('err'); setTimeout(() => setSauv('idle'), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📋 Formulaire de contact</h1>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Fonctionne sur n'importe quel template — configurez-le une fois.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={config.actif} onChange={e => set('actif', e.target.checked)} />
          Actif sur le site
        </label>
      </div>

      {/* Textes */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>Textes affichés</h3>
        <F label="Titre du formulaire"><Inp value={config.titre} onChange={(v: string) => set('titre', v)} /></F>
        <F label="Sous-titre (optionnel)"><Inp value={config.sousTitre} onChange={(v: string) => set('sousTitre', v)} /></F>
        <F label="Texte du bouton"><Inp value={config.boutonTexte} onChange={(v: string) => set('boutonTexte', v)} /></F>
        <F label="Titre message de succès"><Inp value={config.messageSuccesTitre} onChange={(v: string) => set('messageSuccesTitre', v)} /></F>
        <F label="Texte message de succès"><Txt value={config.messageSuccesTexte} onChange={(v: string) => set('messageSuccesTexte', v)} rows={2} /></F>
        <F label="Recevoir les messages à (vide = email du compte)"><Inp value={config.destinataireEmail} onChange={(v: string) => set('destinataireEmail', v)} placeholder="contact@monsite.ca" /></F>
      </div>

      {/* Champs */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>
          Champs du formulaire ({config.champs.length})
        </h3>

        {config.champs.map((champ, i) => (
          <EditeurChamp
            key={champ.id} champ={champ} index={i} total={config.champs.length}
            onChange={c => majChamp(i, c)} onSupprimer={() => supprimerChamp(i)} onDeplacer={dir => deplacerChamp(i, dir)}
          />
        ))}

        {/* Ajout d'un champ */}
        {!ajoutOuvert ? (
          <button onClick={() => setAjoutOuvert(true)}
            style={{ width: '100%', padding: 10, border: `2px dashed ${CP}`, borderRadius: 7, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            + Ajouter un champ
          </button>
        ) : (
          <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8 }}>Champs courants :</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {CHAMPS_SUGGERES.map(s => (
                <button key={s.id} onClick={() => ajouterChampSuggere(s)}
                  style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#f9f9f9', cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={ajouterChampVierge} style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>
                + Champ personnalisé vierge
              </button>
              <button onClick={() => setAjoutOuvert(false)} style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#f3f4f6', fontSize: 12, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sauvegarder */}
      <button onClick={handleSave} disabled={sauv === 'loading'}
        style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff',
          background: sauv === 'ok' ? '#10b981' : sauv === 'err' ? '#dc2626' : CP }}>
        {sauv === 'loading' ? '⏳ Enregistrement...' : sauv === 'ok' ? '✅ Sauvegardé!' : sauv === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
      </button>
    </div>
  );
}