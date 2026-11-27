// src/pages/gestionnaire/ChampPhotos.tsx
// e-Vend Studio — Sélecteur de photos : adresse https:// OU téléversement vers « Mes photos de site » (R2) OU choix parmi mes photos.
// Utilise les routes existantes : /api/studio/photos-gestionnaire/:id  (GET liste, POST /upload champ « photo », comme StudioGestionPhotosGestionnaire).

import { useState, useEffect, useRef } from 'react';

interface Props {
  gestionnaireId: number;
  valeur: string[];                 // liste d'URL (mode multiple) — en mode « unique », 0 ou 1 élément
  onChange: (v: string[]) => void;
  max?: number;                     // nombre maximum de photos (défaut 12 ; 1 = mode unique)
  etiquette?: string;
}
interface PhotoBib { id: number; url: string; nom: string; }

const API = '/api/studio/photos-gestionnaire';
const auth = (): HeadersInit => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const httpsOk = (s: string) => /^https:\/\/[^\s]+\.[^\s]+$/i.test(s.trim()) && s.trim().length <= 600;
const btn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: '1px solid #0f766e', background: '#fff', color: '#0f766e', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const champ: React.CSSProperties = { flex: 1, minWidth: 0, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function ChampPhotos({ gestionnaireId, valeur, onChange, max = 12, etiquette }: Props) {
  const unique = max === 1;
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [envoi, setEnvoi] = useState('');
  const [biblio, setBiblio] = useState<PhotoBib[] | null>(null);
  const [chargeBib, setChargeBib] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 5000); };
  const ajouter = (urls: string[]) => {
    const base = unique ? [] : valeur;
    const nouveau = [...base, ...urls.filter((u) => !base.includes(u))].slice(0, max);
    onChange(nouveau);
  };

  const ajouterUrl = () => {
    if (!httpsOk(url)) { flash(false, "L'adresse doit commencer par https://"); return; }
    ajouter([url.trim()]); setUrl('');
  };

  const televerser = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const liste = Array.from(files).slice(0, unique ? 1 : Math.max(0, max - valeur.length));
    if (!liste.length) { flash(false, `Maximum ${max} photos.`); return; }
    const ajoutees: string[] = [];
    for (let i = 0; i < liste.length; i++) {
      const f = liste[i];
      if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(f.type)) { flash(false, `« ${f.name} » : format non supporté (JPG, PNG, GIF ou WebP).`); continue; }
      if (f.size > 10 * 1024 * 1024) { flash(false, `« ${f.name} » : fichier trop lourd (max 10 Mo).`); continue; }
      setEnvoi(`Envoi ${i + 1}/${liste.length}…`);
      try {
        const form = new FormData(); form.append('photo', f);
        const r = await fetch(`${API}/${gestionnaireId}/upload`, { method: 'POST', credentials: 'include', headers: auth(), body: form });
        let d: any = {}; try { d = await r.json(); } catch { /* ignore */ }
        if (!r.ok) { flash(false, d.error || d.message || "Erreur lors de l'envoi."); break; }
        if (d.photo && d.photo.url) ajoutees.push(d.photo.url);
      } catch { flash(false, 'Erreur réseau pendant l\'envoi.'); break; }
    }
    setEnvoi('');
    if (ajoutees.length) { ajouter(ajoutees); flash(true, `${ajoutees.length} photo${ajoutees.length > 1 ? 's' : ''} ajoutée${ajoutees.length > 1 ? 's' : ''}.`); }
    if (fichier.current) fichier.current.value = '';
  };

  const ouvrirBiblio = async () => {
    setBiblio([]); setChargeBib(true);
    try {
      const r = await fetch(`${API}/${gestionnaireId}`, { credentials: 'include', headers: auth() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      setBiblio(d.photos || []);
    } catch (e: any) { flash(false, e.message || 'Impossible de charger vos photos.'); setBiblio(null); }
    finally { setChargeBib(false); }
  };

  const deplacer = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= valeur.length) return; const a = [...valeur]; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const plein = valeur.length >= max && !unique;

  return (
    <div>
      {etiquette && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{etiquette}</label>}
      {valeur.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {valeur.map((u, i) => (
            <div key={u + i} style={{ position: 'relative', width: 84, height: 66, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }}>
              <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '.2'; }} />
              {i === 0 && !unique && <span style={{ position: 'absolute', top: 2, left: 2, background: '#0f766e', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10 }}>1re</span>}
              <button type="button" onClick={() => onChange(valeur.filter((_, j) => j !== i))} title="Retirer" style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.65)', color: '#fff', cursor: 'pointer', fontSize: 11, lineHeight: '20px', padding: 0 }}>✕</button>
              {!unique && valeur.length > 1 && (
                <div style={{ position: 'absolute', bottom: 2, left: 2, display: 'flex', gap: 2 }}>
                  <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 20, height: 18, border: 'none', borderRadius: 4, background: 'rgba(255,255,255,.85)', cursor: 'pointer', fontSize: 10, padding: 0 }}>◀</button>
                  <button type="button" onClick={() => deplacer(i, 1)} disabled={i === valeur.length - 1} style={{ width: 20, height: 18, border: 'none', borderRadius: 4, background: 'rgba(255,255,255,.85)', cursor: 'pointer', fontSize: 10, padding: 0 }}>▶</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!plein && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <input ref={fichier} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple={!unique} style={{ display: 'none' }} onChange={(e) => televerser(e.target.files)} />
            <button type="button" style={btn} disabled={!!envoi} onClick={() => fichier.current && fichier.current.click()}>{envoi || '📤 Téléverser'}</button>
            <button type="button" style={btn} onClick={ouvrirBiblio}>🖼️ Mes photos</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={champ} placeholder="…ou collez une adresse https://" value={url} maxLength={600} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterUrl(); } }} />
            <button type="button" style={btn} onClick={ajouterUrl}>Ajouter</button>
          </div>
        </>
      )}
      {!unique && <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{valeur.length}/{max} photos · la 1re est la photo principale · JPG, PNG, GIF ou WebP, 10 Mo max.</p>}
      {msg && <p style={{ fontSize: 12, margin: '6px 0 0', color: msg.ok ? '#166534' : '#991b1b' }}>{msg.t}</p>}

      {biblio !== null && (
        <div onClick={() => setBiblio(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'auto', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 16 }}>Mes photos de site</strong>
              <button type="button" onClick={() => setBiblio(null)} style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>✕</button>
            </div>
            {chargeBib ? <p style={{ color: '#6b7280' }}>Chargement…</p> : biblio.length === 0 ? <p style={{ color: '#6b7280' }}>Aucune photo dans votre bibliothèque. Utilisez « Téléverser ».</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                {biblio.map((p) => {
                  const dedans = valeur.includes(p.url);
                  return (
                    <button type="button" key={p.id} disabled={dedans || plein} onClick={() => { ajouter([p.url]); if (unique) setBiblio(null); }} title={p.nom}
                      style={{ padding: 0, border: `2px solid ${dedans ? '#0f766e' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden', cursor: dedans ? 'default' : 'pointer', background: '#f3f4f6', aspectRatio: '4/3', opacity: dedans ? .5 : 1 }}>
                      <img src={p.url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}