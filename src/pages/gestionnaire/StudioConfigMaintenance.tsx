// CHEMIN : src/pages/gestionnaire/StudioConfigMaintenance.tsx
// e-Vend Studio — Configuration → Page maintenance
// Active/désactive la maintenance du site (tous templates) et personnalise la page vue par les visiteurs.
// Routes : GET /api/studio/sites/:gestionnaireId/maintenance  ·  PUT /api/studio/sites/:gestionnaireId/maintenance
//          POST /api/studio/photos-vendeur/:gestionnaireId/upload (image)

import React, { useState, useEffect, useCallback } from 'react';
import SiteMaintenanceBoutique from '../SiteMaintenanceBoutique';

const API_BASE = (window as any).API_BASE || '/api';

const C = {
  bg: '#f4f6f8', card: '#ffffff', border: '#e2e8f0', border2: '#cbd5e1', gold: '#c9a96e',
  green: '#10b981', red: '#ef4444', redLight: 'rgba(239,68,68,0.10)', greenLight: 'rgba(16,185,129,0.10)',
  text: '#1e293b', textLight: '#64748b', textXLight: '#94a3b8',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1px solid ${C.border2}`,
  borderRadius: '8px', fontSize: '14px', color: C.text, background: '#f8fafc', outline: 'none',
  fontFamily: 'system-ui, sans-serif',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
};

const DEF = {
  titre: 'Site en maintenance',
  message: 'Nous effectuons actuellement des améliorations. Nous serons de retour très bientôt.',
  image_url: '', couleur_fond: '#0f172a', couleur_texte: '#ffffff', couleur_accent: '#f59e0b', barre: true,
};
type Contenu = typeof DEF;

const hexOk = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => { if (!disabled) onChange(!value); }} role="switch" aria-checked={value}
      style={{ width: '48px', height: '26px', borderRadius: '13px', background: value ? C.green : '#d1d5db', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    </div>
  );
}

function Section({ titre, icon, children }: { titre: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${C.gold}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: C.gold, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function CouleurInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="color" value={hexOk(value) ? value : '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '40px', height: '36px', border: `1px solid ${C.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
        <input type="text" value={value} maxLength={7} onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, fontFamily: 'monospace', minWidth: 0 }} />
      </div>
    </div>
  );
}

export default function StudioConfigMaintenance({ gestionnaireId }: { gestionnaireId: number }) {
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [actif, setActif] = useState(false);
  const [imposee, setImposee] = useState(false);
  const [nomBoutique, setNomBoutique] = useState('');
  const [c, setC] = useState<Contenu>(DEF);
  const [saving, setSaving] = useState(false);
  const [togSaving, setTogSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/maintenance`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      const p = d.page ?? {};
      setActif(d.generale_actif === true);
      setImposee(d.maintenance_imposee_admin === true);
      setNomBoutique(d.nom_boutique || '');
      setC({
        titre: p.titre || DEF.titre,
        message: p.message || DEF.message,
        image_url: p.image_url ?? '',
        couleur_fond: p.couleur_fond ?? DEF.couleur_fond,
        couleur_texte: p.couleur_texte ?? DEF.couleur_texte,
        couleur_accent: p.couleur_accent ?? DEF.couleur_accent,
        barre: p.barre !== false,
      });
    } catch { /* garder défauts */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  async function put(body: any) {
    const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/maintenance`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    return res.json();
  }

  async function basculer(v: boolean) {
    setTogSaving(true);
    try {
      const r = await put({ actif: v });
      setActif(r.generale_actif === true);
      setImposee(r.maintenance_imposee_admin === true);
      setToast({ msg: v ? 'Maintenance activée : votre site affiche la page maintenance.' : 'Maintenance désactivée : votre site est en ligne.', type: 'ok' });
    } catch { setToast({ msg: 'Erreur lors de la modification.', type: 'err' }); }
    finally { setTogSaving(false); }
  }

  async function sauvegarder() {
    for (const k of ['couleur_fond', 'couleur_texte', 'couleur_accent'] as const) {
      if (!hexOk(c[k])) { setToast({ msg: 'Couleur invalide (format #RRGGBB).', type: 'err' }); return; }
    }
    setSaving(true);
    try {
      await put({ ...c });
      setToast({ msg: 'Page maintenance sauvegardée !', type: 'ok' });
    } catch { setToast({ msg: 'Erreur lors de la sauvegarde.', type: 'err' }); }
    finally { setSaving(false); }
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.append('photo', file);
    try {
      const res = await fetch(`${API_BASE}/studio/photos-vendeur/${gestionnaireId}/upload`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setC(x => ({ ...x, image_url: data.photo.url }));
      setToast({ msg: 'Image téléversée. N\'oubliez pas de sauvegarder.', type: 'ok' });
    } catch { setToast({ msg: "Erreur lors du téléversement.", type: 'err' }); }
  }

  const set = <K extends keyof Contenu>(k: K) => (v: Contenu[K]) => setC(x => ({ ...x, [k]: v }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>🚧</div><p style={{ margin: 0 }}>Chargement…</p></div>
    </div>
  );

  const apercuColors = {
    ...c,
    couleur_fond: hexOk(c.couleur_fond) ? c.couleur_fond : DEF.couleur_fond,
    couleur_texte: hexOk(c.couleur_texte) ? c.couleur_texte : DEF.couleur_texte,
    couleur_accent: hexOk(c.couleur_accent) ? c.couleur_accent : DEF.couleur_accent,
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '760px', margin: '0 auto', padding: '4px 0 40px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>🚧 Page maintenance</h2>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight }}>
        Quand la maintenance est active, vos visiteurs voient cette page à la place de votre site, peu importe le template.
      </p>

      <Section titre="Statut du site" icon="🛠️">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>Mode maintenance</div>
            <div style={{ fontSize: '12px', color: C.textLight, marginTop: '2px' }}>
              {actif || imposee ? 'Votre site affiche actuellement la page maintenance.' : 'Votre site est en ligne.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: (actif || imposee) ? C.red : C.green }}>
              {(actif || imposee) ? '🛑 En maintenance' : '🟢 En ligne'}
            </span>
            <Toggle value={actif || imposee} onChange={basculer} disabled={togSaving || imposee} />
          </div>
        </div>
        {imposee && (
          <div style={{ marginTop: '14px', background: C.redLight, border: `1px solid ${C.red}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: C.text }}>
            🔒 La maintenance a été activée par l'administration de la plateforme. Vous ne pouvez pas la désactiver vous-même.
          </div>
        )}
      </Section>

      <Section titre="Contenu de la page" icon="✏️">
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Titre</label>
          <input style={inputStyle} value={c.titre} maxLength={120} onChange={e => set('titre')(e.target.value)} placeholder="Site en maintenance" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Message</label>
          <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} rows={3} value={c.message} maxLength={1000}
            onChange={e => set('message')(e.target.value)} placeholder="Nous serons de retour très bientôt…" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Image (optionnelle)</label>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: C.textXLight }}>Si aucune image n'est choisie, l'icône ⚙️ est affichée.</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input style={{ ...inputStyle, flex: '1 1 200px', width: 'auto', minWidth: 0 }} value={c.image_url} maxLength={1000}
              onChange={e => set('image_url')(e.target.value)} placeholder="https://… ou téléversez un fichier" />
            <label style={{ padding: '9px 14px', background: '#f1f5f9', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: C.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📁 Téléverser
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }} />
            </label>
            {c.image_url && (
              <button type="button" onClick={() => set('image_url')('')}
                style={{ padding: '9px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.red, cursor: 'pointer' }}>
                Retirer
              </button>
            )}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={c.barre} onChange={e => set('barre')(e.target.checked)} />
          Afficher la barre de progression animée
        </label>
      </Section>

      <Section titre="Couleurs" icon="🎨">
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <CouleurInput label="Fond" value={c.couleur_fond} onChange={set('couleur_fond')} />
          <CouleurInput label="Texte" value={c.couleur_texte} onChange={set('couleur_texte')} />
          <CouleurInput label="Accent" value={c.couleur_accent} onChange={set('couleur_accent')} />
        </div>
      </Section>

      <Section titre="Aperçu" icon="👁️">
        <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <SiteMaintenanceBoutique apercu nomBoutique={nomBoutique} page={apercuColors} />
        </div>
      </Section>

      <button onClick={sauvegarder} disabled={saving}
        style={{ width: '100%', padding: '13px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Sauvegarde…' : '💾 Sauvegarder la page'}
      </button>

      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, zIndex: 9999, maxWidth: '90vw', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.type === 'ok' ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}
    </div>
  );
}