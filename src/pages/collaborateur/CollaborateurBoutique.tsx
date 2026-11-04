// CHEMIN : src/pages/collaborateur/CollaborateurBoutique.tsx
// e-Vend Studio — Dashboard collaborateur : ma boutique (nom, description, logo, bannière, adresse, politique)
// Adapté de MonCompte.tsx / vendeurs_profil.js (e-Vend). API : /api/collab/:gestionnaireId/boutique et /upload

import React, { useState, useEffect, useRef } from 'react';

interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#1E8449' };
const VIDE = { nom_boutique: '', description_boutique: '', logo_url: '', banniere_url: '', adresse: '', ville: '', province: '', code_postal: '', site_web: '', politique_retour: '' };

export default function CollaborateurBoutique({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}`;
  const [f, setF] = useState(VIDE);
  const [chargement, setChargement] = useState(true);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [envoi, setEnvoi] = useState<'logo_url' | 'banniere_url' | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const banniereRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/boutique`, { credentials: 'include' });
        if (res.ok) {
          const p = await res.json();
          setF(Object.fromEntries(Object.keys(VIDE).map(k => [k, p[k] || ''])) as typeof VIDE);
        } else setMsg({ t: 'err', m: (await res.json().catch(() => ({}))).error || 'Chargement impossible' });
      } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
      setChargement(false);
    })();
  }, [base]);

  const televerser = async (champ: 'logo_url' | 'banniere_url', fichier?: File) => {
    if (!fichier) return;
    setEnvoi(champ); setMsg(null);
    const fd = new FormData(); fd.append('file', fichier);
    try {
      const res = await fetch(`${base}/upload`, { method: 'POST', credentials: 'include', body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) setF(prev => ({ ...prev, [champ]: j.url }));
      else setMsg({ t: 'err', m: j.error || 'Envoi impossible' });
    } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
    setEnvoi(null);
    if (logoRef.current) logoRef.current.value = '';
    if (banniereRef.current) banniereRef.current.value = '';
  };

  const enregistrer = async () => {
    setOccupe(true); setMsg(null);
    try {
      const res = await fetch(`${base}/boutique`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      setMsg(res.ok ? { t: 'ok', m: '✅ Boutique enregistrée' } : { t: 'err', m: (await res.json().catch(() => ({}))).error || 'Enregistrement impossible' });
    } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
    setOccupe(false);
  };

  const maj = (k: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 22, marginBottom: 16 };
  const petit: React.CSSProperties = { border: `1px solid ${accent}`, color: accent, background: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>🏪 Ma boutique</h2>
      {msg && <div style={{ background: msg.t === 'ok' ? '#E9F7EF' : '#FDECEA', color: msg.t === 'ok' ? T.ok : '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{msg.m}</div>}

      <div style={carte}>
        <label style={lbl}>Bannière</label>
        <div style={{ height: 120, borderRadius: 10, background: f.banniere_url ? `url(${f.banniere_url}) center/cover` : '#f3f4f6', border: `1px solid ${T.border}`, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={() => banniereRef.current?.click()} disabled={envoi !== null} style={petit}>{envoi === 'banniere_url' ? '⏳…' : '📷 Choisir une bannière'}</button>
          {f.banniere_url && <button onClick={() => setF({ ...f, banniere_url: '' })} style={{ ...petit, borderColor: T.border, color: T.light }}>Retirer</button>}
          <input ref={banniereRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => televerser('banniere_url', e.target.files?.[0])} />
        </div>

        <label style={lbl}>Logo</label>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: f.logo_url ? `url(${f.logo_url}) center/cover` : '#f3f4f6', border: `1px solid ${T.border}`, flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => logoRef.current?.click()} disabled={envoi !== null} style={petit}>{envoi === 'logo_url' ? '⏳…' : '📷 Choisir un logo'}</button>
            {f.logo_url && <button onClick={() => setF({ ...f, logo_url: '' })} style={{ ...petit, borderColor: T.border, color: T.light }}>Retirer</button>}
          </div>
          <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => televerser('logo_url', e.target.files?.[0])} />
        </div>

        <label style={lbl}>Nom de la boutique *</label>
        <input value={f.nom_boutique} onChange={maj('nom_boutique')} maxLength={80} style={{ ...champ, marginBottom: 14 }} />
        <label style={lbl}>Description</label>
        <textarea value={f.description_boutique} onChange={maj('description_boutique')} maxLength={2000} rows={5} placeholder="Présentez votre boutique (texte seulement)" style={{ ...champ, resize: 'vertical' }} />
        <div style={{ textAlign: 'right', fontSize: 11, color: T.light }}>{f.description_boutique.length} / 2000</div>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: T.text }}>Adresse et site web</h3>
        <label style={lbl}>Adresse</label>
        <input value={f.adresse} onChange={maj('adresse')} maxLength={160} style={{ ...champ, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1.5fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={lbl}>Ville</label><input value={f.ville} onChange={maj('ville')} maxLength={80} style={champ} /></div>
          <div><label style={lbl}>Province</label><input value={f.province} onChange={maj('province')} maxLength={60} style={champ} /></div>
          <div><label style={lbl}>Code postal</label><input value={f.code_postal} onChange={maj('code_postal')} maxLength={12} style={champ} /></div>
        </div>
        <label style={lbl}>Site web</label>
        <input value={f.site_web} onChange={maj('site_web')} maxLength={200} placeholder="https://" style={champ} />
      </div>

      <div style={carte}>
        <label style={lbl}>Politique de retour</label>
        <textarea value={f.politique_retour} onChange={maj('politique_retour')} maxLength={2000} rows={4} placeholder="Ex : retours acceptés sous 14 jours, produit non utilisé…" style={{ ...champ, resize: 'vertical' }} />
      </div>

      <button disabled={occupe || !f.nom_boutique.trim()} onClick={enregistrer} style={{ padding: '11px 24px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        {occupe ? '⏳ Enregistrement…' : '💾 Enregistrer'}
      </button>
    </div>
  );
}