// src/pages/gestionnaire/ApparenceAutoShowroom.tsx
// e-Vend Studio — Éditeur d'apparence du template « Auto Showroom » : couleurs, photos, textes, sections (afficher / masquer / réordonner).
// Contrôle des liens/couleurs (normaliserConfig) avant l'enregistrement ; le site le refait à l'affichage.

import { useState, useEffect } from 'react';
import ChampPhotos from './ChampPhotos';
import { normaliserConfig, urlHttps, SCHEMA, SECTIONS_INFO, RESEAUX, SECTION_IDS, type Champ, type ConfigShowroom, type SectionId } from '../../templates/annoncesSite/autoShowroomConfig';

interface Props { gestionnaireId: number; templateId: string; }

const entetes = (): HeadersInit => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const champ: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#111827' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 };
const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18, marginBottom: 14 };
const btn = (c = '#0f766e', plein = true): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: plein ? 'none' : `1px solid ${c}`, background: plein ? c : '#fff', color: plein ? '#fff' : c, fontWeight: 700, fontSize: 13, cursor: 'pointer' });
const petit: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14, flexShrink: 0 };

// ── Un champ du schéma ────────────────────────────────────────────────────────
function ChampEditeur({ ch, valeur, onChange, gid }: { ch: Champ; valeur: any; onChange: (v: any) => void; gid: number }) {
  if (ch.t === 'liste') {
    const items: any[] = Array.isArray(valeur) ? valeur : [];
    const max = ch.maxItems || 8;
    const vide = () => Object.fromEntries((ch.sub || []).map((s) => [s.k, s.t === 'puces' || s.t === 'liste' ? [] : '']));
    const deplacer = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const a = [...items]; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>{ch.label} ({items.length}/{max})</label>
        {items.map((it, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 8, background: '#f9fafb' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginBottom: 8 }}>
              <button style={petit} title="Monter" onClick={() => deplacer(i, -1)}>↑</button>
              <button style={petit} title="Descendre" onClick={() => deplacer(i, 1)}>↓</button>
              <button style={{ ...petit, color: '#dc2626' }} title="Retirer" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              {(ch.sub || []).map((s) => <div key={s.k} style={s.t === 'area' || s.t === 'puces' ? { gridColumn: '1 / -1' } : undefined}><ChampEditeur gid={gid} ch={s} valeur={it[s.k]} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [s.k]: v } : x)))} /></div>)}
            </div>
          </div>
        ))}
        {items.length < max && <button style={btn('#0f766e', false)} onClick={() => onChange([...items, vide()])}>＋ Ajouter</button>}
      </div>
    );
  }
  const v = valeur ?? '';
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={lbl}>{ch.label}</label>
      {ch.t === 'area' && <textarea style={{ ...champ, minHeight: 70 }} maxLength={ch.max || 1000} value={v} onChange={(e) => onChange(e.target.value)} />}
      {ch.t === 'puces' && <textarea style={{ ...champ, minHeight: 70 }} value={Array.isArray(v) ? v.join('\n') : v} onChange={(e) => onChange(e.target.value.split('\n'))} />}
      {ch.t === 'date' && <input style={{ ...champ, maxWidth: 200 }} type="date" value={v} onChange={(e) => onChange(e.target.value)} />}
      {ch.t === 'emoji' && <input style={{ ...champ, maxWidth: 90, textAlign: 'center', fontSize: 20 }} value={v} maxLength={6} onChange={(e) => onChange(e.target.value)} />}
      {ch.t === 'lien' && <><input style={champ} list="liens-sections" value={v} placeholder="#vehicules" maxLength={300} onChange={(e) => onChange(e.target.value)} /></>}
      {ch.t === 'img' && <ChampPhotos gestionnaireId={gid} valeur={v ? [String(v)] : []} onChange={(a) => onChange(a[0] || '')} max={1} />}
      {ch.t === 'text' && <input style={champ} maxLength={ch.max || 200} value={v} onChange={(e) => onChange(e.target.value)} />}
      {ch.aide && <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0' }}>{ch.aide}</p>}
    </div>
  );
}

export default function ApparenceAutoShowroom({ gestionnaireId, templateId }: Props) {
  const [cfg, setCfg] = useState<ConfigShowroom>(() => normaliserConfig({}));
  const [ouverte, setOuverte] = useState<SectionId | 'general' | null>('general');
  const [occupe, setOccupe] = useState(false);
  const [charge, setCharge] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4500); };

  useEffect(() => {
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { setCfg(normaliserConfig(d && d.config && d.config.annonces)); }).catch(() => {}).finally(() => setCharge(true));
  }, [gestionnaireId]);

  const maj = (p: Partial<ConfigShowroom>) => setCfg((c) => ({ ...c, ...p }));
  const majContenu = (id: SectionId, k: string, v: any) => setCfg((c) => ({ ...c, contenu: { ...c.contenu, [id]: { ...c.contenu[id], [k]: v } } }));
  const deplacer = (i: number, d: number) => setCfg((c) => { const j = i + d; if (j < 0 || j >= c.sections.length) return c; const a = [...c.sections]; [a[i], a[j]] = [a[j], a[i]]; return { ...c, sections: a }; });
  const majSection = (i: number, p: Partial<ConfigShowroom['sections'][0]>) => setCfg((c) => ({ ...c, sections: c.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) }));

  const sauver = async () => {
    setOccupe(true);
    try {
      const propre = normaliserConfig(cfg); // assainissement avant enregistrement
      const r = await fetch(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', headers: entetes(), credentials: 'include', body: JSON.stringify({ config: { annonces: propre }, template_id: templateId }) });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch { /* ignore */ } throw new Error(d.message || 'Erreur.'); }
      setCfg(propre); flash(true, 'Apparence enregistrée. Votre site est à jour.');
    } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };

  const reinitSection = (id: SectionId) => { if (window.confirm('Remettre les textes et photos de cette section aux valeurs d\'origine ?')) setCfg((c) => ({ ...c, contenu: { ...c.contenu, [id]: normaliserConfig({}).contenu[id] } })); };

  if (!charge) return <p style={{ color: '#6b7280' }}>Chargement…</p>;
  return (
    <div>
      <datalist id="liens-sections">{SECTION_IDS.map((id) => <option key={id} value={`#${id}`}>{SECTIONS_INFO[id].nom}</option>)}</datalist>
      {msg && <div style={{ background: msg.ok ? '#dcfce7' : '#fee2e2', color: msg.ok ? '#166534' : '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{msg.t}</div>}

      <div style={carte}>
        <button onClick={() => setOuverte(ouverte === 'general' ? null : 'general')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 800, padding: 0 }}>🎨 Général : nom, logo, couleurs, coordonnées <span>{ouverte === 'general' ? '▲' : '▼'}</span></button>
        {ouverte === 'general' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={lbl}>Nom du site</label><input style={champ} maxLength={60} value={cfg.nomSite} onChange={(e) => maj({ nomSite: e.target.value })} /></div>
              <div><ChampPhotos gestionnaireId={gestionnaireId} etiquette="Logo" valeur={cfg.logoUrl ? [cfg.logoUrl] : []} onChange={(a) => maj({ logoUrl: a[0] || '' })} max={1} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, margin: '12px 0' }}>
              {([['couleurPrincipale', 'Couleur principale'], ['couleurAccent', 'Boutons & coches'], ['couleurSombre', 'Texte & sections sombres'], ['couleurFond', 'Fond clair']] as const).map(([k, l]) => (
                <div key={k}><label style={lbl}>{l}</label><input type="color" style={{ ...champ, padding: 3, height: 40 }} value={cfg[k]} onChange={(e) => maj({ [k]: e.target.value } as any)} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 12, maxWidth: 260 }}><label style={lbl}>Police</label><select style={champ} value={cfg.police} onChange={(e) => maj({ police: e.target.value as ConfigShowroom['police'] })}><option value="arrondie">Arrondie (Nunito)</option><option value="moderne">Moderne (Inter)</option><option value="classique">Classique (avec empattements)</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={lbl}>Téléphone</label><input style={champ} maxLength={25} value={cfg.telephone} onChange={(e) => maj({ telephone: e.target.value })} /></div>
              <div><label style={lbl}>Courriel affiché</label><input style={champ} type="email" maxLength={200} value={cfg.courriel} onChange={(e) => maj({ courriel: e.target.value })} /></div>
              <div><label style={lbl}>Adresse</label><input style={champ} maxLength={160} value={cfg.adresse} onChange={(e) => maj({ adresse: e.target.value })} /></div>
              <div><label style={lbl}>Texte du bas de page</label><input style={champ} maxLength={200} value={cfg.piedTexte} onChange={(e) => maj({ piedTexte: e.target.value })} /></div>
            </div>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '6px 0 0' }}>Les messages des visiteurs arrivent à votre courriel de compte, même si vous laissez « Courriel affiché » vide.</p>
            <label style={{ ...lbl, marginTop: 14 }}>Réseaux sociaux (adresses https://…, laissez vide pour masquer)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {RESEAUX.map((k) => <div key={k}><label style={{ ...lbl, fontWeight: 600, textTransform: 'capitalize' }}>{k}</label><input style={champ} maxLength={600} value={cfg.reseaux[k]} placeholder="https://…" onChange={(e) => maj({ reseaux: { ...cfg.reseaux, [k]: e.target.value } })} /></div>)}
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 2px 10px' }}>Sections du site, dans l'ordre d'affichage. Utilisez ↑ ↓ pour les déplacer et l'interrupteur pour les retirer.</p>
      {cfg.sections.map((sec, i) => {
        const info = SECTIONS_INFO[sec.id];
        const ouv = ouverte === sec.id;
        return (
          <div key={sec.id} style={{ ...carte, padding: 0, opacity: sec.visible ? 1 : 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button style={{ ...petit, height: 22, width: 28, fontSize: 11 }} disabled={i === 0} onClick={() => deplacer(i, -1)} title="Monter">↑</button>
                <button style={{ ...petit, height: 22, width: 28, fontSize: 11 }} disabled={i === cfg.sections.length - 1} onClick={() => deplacer(i, 1)} title="Descendre">↓</button>
              </div>
              <span style={{ fontSize: 22 }}>{info.icone}</span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong style={{ fontSize: 15 }}>{info.nom}</strong>
                {info.note && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{info.note}</p>}
              </div>
              <input style={{ ...champ, width: 150 }} maxLength={30} placeholder={`Menu : ${info.navDefaut}`} title="Nom dans le menu du site" value={sec.label} onChange={(e) => majSection(i, { label: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><input type="checkbox" checked={sec.visible} onChange={(e) => majSection(i, { visible: e.target.checked })} />{sec.visible ? 'Affichée' : 'Masquée'}</label>
              <button style={btn('#0f766e', false)} onClick={() => setOuverte(ouv ? null : sec.id)}>{ouv ? 'Fermer' : '✏️ Modifier'}</button>
            </div>
            {ouv && (
              <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0' }}><button style={btn('#6b7280', false)} onClick={() => reinitSection(sec.id)}>↺ Valeurs d'origine</button></div>
                {SCHEMA[sec.id].map((ch) => <ChampEditeur gid={gestionnaireId} key={ch.k} ch={ch} valeur={cfg.contenu[sec.id][ch.k]} onChange={(v) => majContenu(sec.id, ch.k, v)} />)}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,.95)', borderTop: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btn()} disabled={occupe} onClick={sauver}>{occupe ? '⏳ Enregistrement…' : '💾 Enregistrer l\'apparence'}</button>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Les adresses d'images et de liens doivent commencer par https://. Tout texte est nettoyé automatiquement.</span>
      </div>
    </div>
  );
}