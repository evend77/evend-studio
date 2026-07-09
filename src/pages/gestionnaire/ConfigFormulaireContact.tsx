// src/pages/gestionnaire/ConfigFormulaireContact.tsx
// e-Vend Studio — Configuration du formulaire de contact
// Gratuit et inclus par défaut sur tous les sites (sauf multivendeur).
// Le gestionnaire choisit ses champs — fonctionne sur n'importe quel template.

import { useState, useEffect } from 'react';
import type { ChampFormulaire, ChampType } from '../../addons/contact/AddonContact';

const API_BASE = '/api';
const CP = '#2563eb';

interface Props { gestionnaireId: number; }

export interface ConfigFormulaireContactData {
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

export const CONFIG_CONTACT_DEFAUT: ConfigFormulaireContactData = {
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

const Inp = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value || ''} placeholder={placeholder} onChange={(e: any) => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={(e: any) => e.target.style.borderColor = CP}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'} />
);
const Txt = ({ value, onChange, placeholder, rows = 2 }: any) => (
  <textarea value={value || ''} placeholder={placeholder} rows={rows} onChange={(e: any) => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }} />
);
const F = ({ label, children }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

function EditeurChamp({ champ, onChange, onSupprimer, onDeplacer, index, total, ouvertParDefaut }: {
  champ: ChampFormulaire; onChange: (c: ChampFormulaire) => void; onSupprimer: () => void;
  onDeplacer: (dir: -1 | 1) => void; index: number; total: number; ouvertParDefaut?: boolean;
}) {
  const [ouvert, setOuvert] = useState(!!ouvertParDefaut);
  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => onDeplacer(-1)} disabled={index === 0}
            style={{ width: 20, height: 16, border: '1px solid #ddd', borderRadius: 3, background: index === 0 ? '#f5f5f5' : '#fff', cursor: index === 0 ? 'default' : 'pointer', fontSize: 8 }}>▲</button>
          <button onClick={() => onDeplacer(1)} disabled={index === total - 1}
            style={{ width: 20, height: 16, border: '1px solid #ddd', borderRadius: 3, background: index === total - 1 ? '#f5f5f5' : '#fff', cursor: index === total - 1 ? 'default' : 'pointer', fontSize: 8 }}>▼</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{champ.label || '(sans nom)'}</p>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{TYPE_LABELS[champ.type]} {champ.requis && '· Obligatoire'}</p>
        </div>
        <button onClick={() => setOuvert(!ouvert)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>{ouvert ? '✕' : '✏️'}</button>
        <button onClick={onSupprimer} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
      </div>
      {ouvert && (
        <div style={{ padding: 14, borderTop: '1px solid #e5e7eb' }}>
          <F label="Label affiché"><Inp value={champ.label} onChange={(v: string) => onChange({ ...champ, label: v })} /></F>
          <F label="Type de champ">
            <select value={champ.type} onChange={e => onChange({ ...champ, type: e.target.value as ChampType })}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Placeholder (texte d'exemple)"><Inp value={champ.placeholder} onChange={(v: string) => onChange({ ...champ, placeholder: v })} /></F>
          {champ.type === 'select' && (
            <F label="Options — une par ligne (ex: pour un champ Sujet)">
              <Txt value={(champ.options || []).join('\n')} onChange={(v: string) => onChange({ ...champ, options: v.split('\n').filter(Boolean) })} rows={4} />
            </F>
          )}
          <div style={{ display: 'flex', gap: 18 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!champ.requis} onChange={e => onChange({ ...champ, requis: e.target.checked })} />
              Obligatoire
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!champ.largeurPleine} onChange={e => onChange({ ...champ, largeurPleine: e.target.checked })} />
              Pleine largeur
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigFormulaireContact({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigFormulaireContactData>({ ...CONFIG_CONTACT_DEFAUT });
  const [chargement, setChargement] = useState(true);
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [dernierChampAjoute, setDernierChampAjoute] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const existant = d?.config?.addons?.contact;
        if (existant) setConfig({ ...CONFIG_CONTACT_DEFAUT, ...existant });
      })
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [gestionnaireId]);

  const set = (k: keyof ConfigFormulaireContactData, v: any) => setConfig(prev => ({ ...prev, [k]: v }));
  const majChamp = (i: number, c: ChampFormulaire) => { const arr = [...config.champs]; arr[i] = c; set('champs', arr); };
  const supprimerChamp = (i: number) => set('champs', config.champs.filter((_, j) => j !== i));
  const deplacerChamp = (i: number, dir: -1 | 1) => {
    const arr = [...config.champs]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    set('champs', arr);
  };
  const ajouterChampSuggere = (s: typeof CHAMPS_SUGGERES[number]) => {
    const nouvelId = `${s.id}_${Date.now()}`;
    set('champs', [...config.champs, { id: nouvelId, type: s.type, label: s.label, options: s.options }]);
    setDernierChampAjoute(nouvelId);
    setAjoutOuvert(false);
  };
  const ajouterChampVierge = () => {
    const nouvelId = `champ_${Date.now()}`;
    set('champs', [...config.champs, { id: nouvelId, type: 'text', label: '' }]);
    setDernierChampAjoute(nouvelId);
    setAjoutOuvert(false);
  };

  const handleSave = async () => {
    setSauv('loading');
    try {
      const token = localStorage.getItem('token');
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

  if (chargement) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: "'Inter',sans-serif" }}>Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${CP}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Formulaire de contact</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Inclus gratuitement — fonctionne sur n'importe quel template</p>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', margin: '16px 0 24px', fontSize: 12, color: '#166534' }}>
        ✅ 100 messages gratuits par mois inclus. Consultez vos messages reçus et votre quota dans <strong>Messagerie</strong>.
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 14 }}>Textes affichés</p>
        <F label="Titre du formulaire"><Inp value={config.titre} onChange={(v: string) => set('titre', v)} /></F>
        <F label="Sous-titre (optionnel)"><Inp value={config.sousTitre} onChange={(v: string) => set('sousTitre', v)} /></F>
        <F label="Texte du bouton"><Inp value={config.boutonTexte} onChange={(v: string) => set('boutonTexte', v)} /></F>
        <F label="Titre message de succès"><Inp value={config.messageSuccesTitre} onChange={(v: string) => set('messageSuccesTitre', v)} /></F>
        <F label="Texte message de succès"><Txt value={config.messageSuccesTexte} onChange={(v: string) => set('messageSuccesTexte', v)} rows={2} /></F>
        <F label="Recevoir les messages à (vide = email du compte)"><Inp value={config.destinataireEmail} onChange={(v: string) => set('destinataireEmail', v)} placeholder="contact@monsite.ca" /></F>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 14 }}>
          Champs du formulaire ({config.champs.length})
        </p>

        {config.champs.map((champ, i) => (
          <EditeurChamp
            key={champ.id} champ={champ} index={i} total={config.champs.length}
            ouvertParDefaut={champ.id === dernierChampAjoute}
            onChange={c => majChamp(i, c)} onSupprimer={() => supprimerChamp(i)} onDeplacer={dir => deplacerChamp(i, dir)}
          />
        ))}

        {!ajoutOuvert ? (
          <button onClick={() => setAjoutOuvert(true)}
            style={{ width: '100%', padding: 11, border: `2px dashed ${CP}`, borderRadius: 8, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Ajouter un champ
          </button>
        ) : (
          <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10 }}>Champs courants :</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {CHAMPS_SUGGERES.map(s => (
                <button key={s.id} onClick={() => ajouterChampSuggere(s)}
                  style={{ fontSize: 13, padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#f9f9f9', cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={ajouterChampVierge} style={{ flex: 1, padding: 9, border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                + Champ personnalisé vierge
              </button>
              <button onClick={() => setAjoutOuvert(false)} style={{ padding: '9px 16px', border: 'none', borderRadius: 7, background: '#f3f4f6', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={sauv === 'loading'}
        style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff',
          background: sauv === 'ok' ? '#10b981' : sauv === 'err' ? '#dc2626' : CP }}>
        {sauv === 'loading' ? '⏳ Enregistrement...' : sauv === 'ok' ? '✅ Sauvegardé!' : sauv === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
      </button>
    </div>
  );
}