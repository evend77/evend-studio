// src/pages/studio/ConfigTemplateVitrineProTech.tsx
// e-Vend Studio — Configurateur Template PREMIUM Pro Tech / SaaS

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_VITRINE_PRO_TECH_DEFAUT,
  type ConfigVitrineProTech,
  type Solution,
  type Feature,
  type Partenaire,
  type TemoignageTech,
  type PlanTarif,
  type MediaHero,
} from '../../templates/TemplateVitrineProTech';

// ─── STYLES ───────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 18px', marginBottom: 16 };
const CP = '#c026d3';
const btnP: React.CSSProperties = { background: CP, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnS: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnD: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };

type Onglet = 'hero' | 'ticker' | 'contenu' | 'solutions' | 'partenaires' | 'temoignages' | 'tarifs' | 'contact' | 'apparence';

interface Props { vendeurId: string; templateId?: string; onSauvegarde: (config: ConfigVitrineProTech) => Promise<void>; }

// ─── ÉDITEUR LISTE GÉNÉRIQUE ──────────────────────────────────────────────────

function ListeEditor<T extends Record<string, any>>({
  items, onUpdate, fields, titre, creerItem,
}: {
  items: T[]; onUpdate: (v: T[]) => void;
  fields: { key: keyof T; label: string; type?: 'text' | 'textarea' | 'number' | 'checkbox'; placeholder?: string }[];
  titre: string; creerItem: () => T;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft]     = useState<T | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{titre} ({items.length})</h4>
        <button style={btnP} onClick={() => { const n = creerItem(); onUpdate([...items, n]); setEditIdx(items.length); setDraft(n); }}>+ Ajouter</button>
      </div>

      {editIdx !== null && draft !== null && (
        <div style={{ background: '#f8fafc', borderRadius: 10, border: `2px solid ${CP}30`, padding: '14px', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <div key={String(f.key)} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
                <label style={lbl}>{f.label}</label>
                {f.type === 'checkbox'
                  ? <label style={{ display: 'flex', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={Boolean(draft[f.key])} onChange={e => setDraft({ ...draft, [f.key]: e.target.checked })} />
                      Oui
                    </label>
                  : f.type === 'textarea'
                  ? <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={String(draft[f.key] ?? '')} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  : f.type === 'number'
                  ? <input style={inp} type="number" value={Number(draft[f.key] ?? 0)} onChange={e => setDraft({ ...draft, [f.key]: parseFloat(e.target.value) || 0 })} />
                  : <input style={inp} type="text" value={String(draft[f.key] ?? '')} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button style={btnS} onClick={() => { setEditIdx(null); setDraft(null); }}>Annuler</button>
            <button style={btnP} onClick={() => { if (!draft) return; const next = [...items]; next[editIdx] = draft; onUpdate(next); setEditIdx(null); setDraft(null); }}>✓ OK</button>
          </div>
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, border: `1px solid ${editIdx === i ? CP : '#e5e7eb'}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(item[fields[0].key] || '(vide)')}</p>
            {fields[1] && <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{String(item[fields[1].key] || '').slice(0, 60)}</p>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => { const n=[...items]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]];onUpdate(n);} }} disabled={i===0} style={{...btnS,padding:'3px 7px',opacity:i===0?0.3:1}}>↑</button>
            <button onClick={() => { const n=[...items]; if(i<items.length-1){[n[i],n[i+1]]=[n[i+1],n[i]];onUpdate(n);} }} disabled={i===items.length-1} style={{...btnS,padding:'3px 7px',opacity:i===items.length-1?0.3:1}}>↓</button>
            <button style={{ ...btnS, padding: '5px 10px', fontSize: 12 }} onClick={() => { setEditIdx(i); setDraft({ ...item }); }}>{editIdx===i?'✕':'✏️'}</button>
            <button style={btnD} onClick={() => { if(!window.confirm('Supprimer?'))return; onUpdate(items.filter((_,j)=>j!==i)); }}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function ConfigTemplateVitrineProTech({ vendeurId, templateId = 'vitrine-pro-tech', onSauvegarde }: Props) {
  const [config, setConfig]         = useState<ConfigVitrineProTech>(CONFIG_VITRINE_PRO_TECH_DEFAUT);
  const [onglet, setOnglet]         = useState<Onglet>('hero');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces]         = useState('');
  const [erreur, setErreur]         = useState('');

  useEffect(() => {
    (async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (d.config && Object.keys(d.config).length > 0)
            setConfig({ ...CONFIG_VITRINE_PRO_TECH_DEFAUT, ...d.config });
        }
      } catch {}
      setChargement(false);
    })();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigVitrineProTech>(k: K, v: ConfigVitrineProTech[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Template Pro Tech sauvegardé !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'hero',         label: 'Hero',         icone: '🎬' },
    { id: 'ticker',       label: 'Tickers',      icone: '📜' },
    { id: 'contenu',      label: 'Contenu',      icone: '📝' },
    { id: 'solutions',    label: 'Solutions',    icone: '⬡'  },
    { id: 'partenaires',  label: 'Partenaires',  icone: '🤝' },
    { id: 'temoignages',  label: 'Témoignages',  icone: '⭐' },
    { id: 'tarifs',       label: 'Tarifs',       icone: '💰' },
    { id: 'contact',      label: 'Contact',      icone: '✉️' },
    { id: 'apparence',    label: 'Apparence',    icone: '🎨' },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80 }}><p style={{ fontSize: 36 }}>⏳</p><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>💻 Pro Tech / SaaS</h1>
            <span style={{ background: '#c026d322', color: '#86198f', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>PREMIUM 25$</span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Ticker défilant · Hero vidéo/photo · Solutions · Tarifs · Partenaires</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer" style={{ ...btnS, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>👁 Aperçu</a>
          <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>{sauvegarde ? '⏳...' : '💾 Sauvegarder'}</button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#16a34a', fontWeight: 600 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#dc2626', fontWeight: 600 }}>{erreur}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '7px 11px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? CP : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      {onglet === 'hero' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🎬 Media principal (photo ou vidéo)</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {(['photo', 'video'] as const).map(type => (
                <div key={type} onClick={() => set('heroMedia', { ...config.heroMedia, type })}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: `2px solid ${config.heroMedia.type === type ? CP : '#e5e7eb'}`, background: config.heroMedia.type === type ? CP + '10' : '#fff', cursor: 'pointer', textAlign: 'center' as const, fontWeight: 700, fontSize: 14, color: config.heroMedia.type === type ? CP : '#666' }}>
                  {type === 'photo' ? '🖼 Photo' : '🎬 Vidéo'}
                </div>
              ))}
            </div>

            {config.heroMedia.type === 'video' ? (
              <>
                <div>
                  <label style={lbl}>URL de la vidéo (MP4 — hébergée sur AWS S3 ou autre)</label>
                  <input style={inp} value={config.heroMedia.url} onChange={e => set('heroMedia', { ...config.heroMedia, url: e.target.value })} placeholder="https://votre-bucket.s3.amazonaws.com/video.mp4" />
                  <p style={{ fontSize: 11, color: '#888', marginTop: 5 }}>Vidéo courte recommandée (5-15 sec), en boucle silencieuse. Format MP4 H.264.</p>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={lbl}>Image de préchargement (poster) — s'affiche avant la vidéo</label>
                  <input style={inp} value={config.heroMedia.poster || ''} onChange={e => set('heroMedia', { ...config.heroMedia, poster: e.target.value })} placeholder="https://... (URL d'une image de prévisualisation)" />
                </div>
              </>
            ) : (
              <div>
                <label style={lbl}>URL de la photo principale</label>
                <input style={inp} value={config.heroMedia.url} onChange={e => set('heroMedia', { ...config.heroMedia, url: e.target.value })} placeholder="https://..." />
                {config.heroMedia.url && <img src={config.heroMedia.url} alt="hero" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📝 Textes du hero</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Titre ligne 1 (blanc)</label>
                <input style={inp} value={config.heroTitre1} onChange={e => set('heroTitre1', e.target.value)} placeholder="Amplifier" />
              </div>
              <div>
                <label style={lbl}>Titre ligne 2 (blanc)</label>
                <input style={inp} value={config.heroTitre2} onChange={e => set('heroTitre2', e.target.value)} placeholder="Nexus IA" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Description sous le titre</label>
                <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={config.heroDescription} onChange={e => set('heroDescription', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Bouton principal</label>
                <input style={inp} value={config.heroBouton1} onChange={e => set('heroBouton1', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Bouton secondaire</label>
                <input style={inp} value={config.heroBouton2} onChange={e => set('heroBouton2', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>💬 Phrase d'impact (bicolore)</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Grande phrase sous le hero — <span style={{ color: CP }}>partie 1 et 3 en couleur principale</span>, <span style={{ fontWeight: 700 }}>partie 2 en blanc</span>.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lbl}>Partie 1 (couleur principale)</label>
                <input style={inp} value={config.phraseImpact1} onChange={e => set('phraseImpact1', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Partie 2 (blanc)</label>
                <input style={inp} value={config.phraseImpact2} onChange={e => set('phraseImpact2', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Partie 3 (couleur principale)</label>
                <input style={inp} value={config.phraseImpact3} onChange={e => set('phraseImpact3', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📰 Section Presse ("Vu dans")</h3>
            <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
              <input type="checkbox" id="presse-actif" checked={config.presseActif} onChange={e => set('presseActif', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="presse-actif" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Afficher la section "Vu dans"</label>
            </div>
            <label style={lbl}>Logos / noms de médias (séparés par des virgules)</label>
            <input style={inp} value={config.presseLogos.join(', ')} onChange={e => set('presseLogos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="FUTURE FORTUNE, Business+, AINOW" />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Affichés en texte stylisé. Idéalement 3-5 logos.</p>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📊 Statistiques</h3>
            <ListeEditor<{ valeur: string; label: string }>
              items={config.stats}
              onUpdate={v => set('stats', v)}
              titre="Stats"
              creerItem={() => ({ valeur: '100+', label: 'Nouvelle stat' })}
              fields={[
                { key: 'valeur', label: 'Valeur affichée', placeholder: '+10M$, 95%, 40+' },
                { key: 'label',  label: 'Description',     placeholder: 'Économies clients' },
              ]}
            />
          </div>
        </>
      )}

      {/* ── TICKER ───────────────────────────────────────────────────────────── */}
      {onglet === 'ticker' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📜 Ticker principal (après le hero)</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Texte géant qui défile en boucle. L'icône séparateur est coloré.</p>

            <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" id="ticker1" checked={config.tickerActif} onChange={e => set('tickerActif', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="ticker1" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Activer le ticker principal</label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: config.tickerActif ? 1 : 0.4, pointerEvents: config.tickerActif ? 'all' : 'none' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Texte défilant</label>
                <input style={inp} value={config.tickerTexte} onChange={e => set('tickerTexte', e.target.value)} placeholder="Innover avec Précision" />
              </div>
              <div>
                <label style={lbl}>Icône séparateur</label>
                <input style={inp} value={config.tickerIcone} onChange={e => set('tickerIcone', e.target.value)} placeholder="✦ ou ★ ou •" />
              </div>
              <div>
                <label style={lbl}>Taille du texte</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="32" max="120" step="4" value={config.tickerTaille} onChange={e => set('tickerTaille', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: CP, minWidth: 50 }}>{config.tickerTaille}px</span>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Vitesse de défilement</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="10" max="80" step="5" value={config.tickerVitesse} onChange={e => set('tickerVitesse', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: CP, minWidth: 60 }}>{config.tickerVitesse}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  <span>← Rapide (10s)</span><span>Lent (80s) →</span>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            {config.tickerActif && (
              <div style={{ marginTop: 16, background: config.couleurSecondaire, borderRadius: 10, overflow: 'hidden', padding: `${config.tickerTaille * 0.3}px 0` }}>
                <style>{`@keyframes prev-tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
                <div style={{ display: 'flex', animation: `prev-tick ${config.tickerVitesse}s linear infinite`, width: 'max-content' }}>
                  {[0,1].map(i => (
                    <span key={i} style={{ fontSize: Math.min(config.tickerTaille, 48), fontWeight: 900, color: config.couleurTexte, whiteSpace: 'nowrap', paddingRight: 48 }}>
                      {config.tickerTexte} <span style={{ color: config.couleurPrincipale }}>{config.tickerIcone}</span> {config.tickerTexte} <span style={{ color: config.couleurPrincipale }}>{config.tickerIcone}</span>{' '}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📜 Ticker secondaire (entre partenaires et solutions)</h3>
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" id="ticker2" checked={config.ticker2Actif} onChange={e => set('ticker2Actif', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="ticker2" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Activer le ticker secondaire</label>
            </div>
            <label style={lbl}>Texte défilant 2</label>
            <input style={inp} value={config.ticker2Texte} onChange={e => set('ticker2Texte', e.target.value)} placeholder="Bâtir des partenariats solides" />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Utilise le même icône séparateur et une vitesse légèrement plus lente. Même taille ajustée à 90%.</p>
          </div>
        </>
      )}

      {/* ── CONTENU ──────────────────────────────────────────────────────────── */}
      {onglet === 'contenu' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>👁 Section Vision</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Label (ex: VISION)</label>
                <input style={inp} value={config.visionTitre1} onChange={e => set('visionTitre1', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Titre accentué (couleur principale)</label>
                <input style={inp} value={config.visionTitre2} onChange={e => set('visionTitre2', e.target.value)} placeholder="Utilisez \n pour sauter une ligne" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Texte de vision</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.visionTexte} onChange={e => set('visionTexte', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Photo (URL)</label>
                <input style={inp} value={config.visionPhoto} onChange={e => set('visionPhoto', e.target.value)} placeholder="https://..." />
                {config.visionPhoto && <img src={config.visionPhoto} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => {(e.target as HTMLImageElement).style.display='none';}} />}
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>✅ Section Fonctionnalités</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Label (ex: FONCTIONNALITÉS)</label>
                <input style={inp} value={config.featuresTitre1} onChange={e => set('featuresTitre1', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Titre</label>
                <input style={inp} value={config.featuresTitre2} onChange={e => set('featuresTitre2', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Texte</label>
                <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={config.featuresTexte} onChange={e => set('featuresTexte', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Photo (URL)</label>
                <input style={inp} value={config.featuresPhoto} onChange={e => set('featuresPhoto', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <ListeEditor<Feature>
              items={config.features}
              onUpdate={v => set('features', v)}
              titre="Points clés (✓)"
              creerItem={() => ({ texte: '' })}
              fields={[{ key: 'texte', label: 'Fonctionnalité', placeholder: 'Décrivez un avantage clé...' }]}
            />
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏁 CTA final</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Ligne 1 (grande)</label>
                <input style={inp} value={config.ctaFinalTitre} onChange={e => set('ctaFinalTitre', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Ligne 2 (sous-titre)</label>
                <input style={inp} value={config.ctaFinalSousTitre} onChange={e => set('ctaFinalSousTitre', e.target.value)} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SOLUTIONS ────────────────────────────────────────────────────────── */}
      {onglet === 'solutions' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section</label>
            <input style={inp} value={config.solutionsTitre} onChange={e => set('solutionsTitre', e.target.value)} />
          </div>
          <ListeEditor<Solution>
            items={config.solutions}
            onUpdate={v => set('solutions', v)}
            titre="Solutions / produits"
            creerItem={() => ({ id: `s${Date.now()}`, nom: '', description: '', icone: '⬡' })}
            fields={[
              { key: 'nom',         label: 'Nom de la solution' },
              { key: 'icone',       label: 'Icône (emoji ou symbole)', placeholder: '⬡ ✦ ◉ ⬟' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]}
          />
        </div>
      )}

      {/* ── PARTENAIRES ──────────────────────────────────────────────────────── */}
      {onglet === 'partenaires' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Label (ex: PARTENAIRES)</label>
              <input style={inp} value={config.partenairesTitre1} onChange={e => set('partenairesTitre1', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre accentué</label>
              <input style={inp} value={config.partenairesTitre2} onChange={e => set('partenairesTitre2', e.target.value)} placeholder="Titre\nsur 2 lignes" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Texte</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={config.partenairesTexte} onChange={e => set('partenairesTexte', e.target.value)} />
            </div>
          </div>
          <ListeEditor<Partenaire>
            items={config.partenaires}
            onUpdate={v => set('partenaires', v)}
            titre="Partenaires (grille 3 colonnes)"
            creerItem={() => ({ nom: '', logoUrl: '' })}
            fields={[
              { key: 'nom',    label: 'Nom du partenaire' },
              { key: 'logoUrl', label: 'URL logo (vide = texte affiché)', placeholder: 'https://...' },
            ]}
          />
        </div>
      )}

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────────── */}
      {onglet === 'temoignages' && (
        <div style={card}>
          <ListeEditor<TemoignageTech>
            items={config.temoignages}
            onUpdate={v => set('temoignages', v)}
            titre="Témoignages (carrousel plein écran)"
            creerItem={() => ({ citation: '', nom: '', role: '', photo: '' })}
            fields={[
              { key: 'citation', label: 'Citation (sans guillemets)', type: 'textarea' },
              { key: 'nom',      label: 'Nom' },
              { key: 'role',     label: 'Poste / entreprise', placeholder: 'PDG, Luminous' },
              { key: 'photo',    label: 'Photo (URL)', placeholder: 'https://...' },
            ]}
          />
        </div>
      )}

      {/* ── TARIFS ───────────────────────────────────────────────────────────── */}
      {onglet === 'tarifs' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Titre ligne 1</label>
              <input style={inp} value={config.tarifsTitre1} onChange={e => set('tarifsTitre1', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre ligne 2 (accentué)</label>
              <input style={inp} value={config.tarifsTitre2} onChange={e => set('tarifsTitre2', e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Chaque plan s'affiche dans une carte. Le plan vedette a une bordure colorée.</p>
          {config.plans.map((plan, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 10, border: `1px solid #e5e7eb`, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={lbl}>Prix</label>
                  <input style={inp} value={plan.prix} onChange={e => { const p=[...config.plans]; p[i]={...p[i],prix:e.target.value}; set('plans',p); }} placeholder="79$/mois" />
                </div>
                <div>
                  <label style={lbl}>Nom du plan</label>
                  <input style={inp} value={plan.nom} onChange={e => { const p=[...config.plans]; p[i]={...p[i],nom:e.target.value}; set('plans',p); }} />
                </div>
                <div>
                  <label style={lbl}>Texte du bouton</label>
                  <input style={inp} value={plan.cta} onChange={e => { const p=[...config.plans]; p[i]={...p[i],cta:e.target.value}; set('plans',p); }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Fonctionnalités (une par ligne)</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={plan.fonctionnalites.join('\n')} onChange={e => { const p=[...config.plans]; p[i]={...p[i],fonctionnalites:e.target.value.split('\n').filter(Boolean)}; set('plans',p); }} />
              </div>
              <label style={{ display: 'flex', gap: 8, cursor: 'pointer', fontSize: 14, alignItems: 'center' }}>
                <input type="checkbox" checked={plan.vedette} onChange={e => { const p=[...config.plans]; p[i]={...p[i],vedette:e.target.checked}; set('plans',p); }} />
                ⭐ Plan vedette (bordure colorée)
              </label>
            </div>
          ))}
          <button style={btnP} onClick={() => set('plans', [...config.plans, { prix: '', nom: 'Nouveau', fonctionnalites: [], cta: 'Commencer', vedette: false }])}>+ Ajouter un plan</button>
        </div>
      )}

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      {onglet === 'contact' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>✉️ Footer & Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Nom de l'entreprise</label>
              <input style={inp} value={config.nomEntreprise} onChange={e => set('nomEntreprise', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Courriel</label>
              <input style={inp} type="email" value={config.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Instagram (@handle)</label>
              <input style={inp} value={config.instagram || ''} onChange={e => set('instagram', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>LinkedIn (slug)</label>
              <input style={inp} value={config.linkedin || ''} onChange={e => set('linkedin', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Titre section newsletter</label>
              <input style={inp} value={config.newsletterTitre} onChange={e => set('newsletterTitre', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Liens footer (un par ligne)</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.liensFooter.map(l => l.label).join('\n')} onChange={e => set('liensFooter', e.target.value.split('\n').filter(Boolean).map(label => ({ label })))} />
            </div>
          </div>
        </div>
      )}

      {/* ── APPARENCE ────────────────────────────────────────────────────────── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🎨 Couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { k: 'couleurPrincipale' as const, l: 'Couleur principale',  h: 'Ticker icone, boutons, accentuation, stats' },
                { k: 'couleurSecondaire' as const, l: 'Fond de page',         h: 'Arrière-plan général sombre' },
              ].map(({ k, l, h }) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input type="color" value={config[k]} onChange={e => set(k, e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} value={config[k]} onChange={e => set(k, e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{h}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[{ v: 'moderne' as const, l: 'Moderne (Inter)' }, { v: 'bold' as const, l: 'Impact (Oswald)' }, { v: 'elegant' as const, l: 'Élégant (Playfair)' }].map(({ v, l }) => (
                <div key={v} onClick={() => set('police', v)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === v ? CP : '#e5e7eb'}`, background: config.police === v ? CP + '15' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === v ? CP : '#444' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏷️ Logo</h3>
            <label style={lbl}>URL du logo (vide = nom texte dans la navbar)</label>
            <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
            {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 40, marginTop: 8, objectFit: 'contain', borderRadius: 6 }} onError={e => {(e.target as HTMLImageElement).style.display='none';}} />}
          </div>

          {/* Aperçu couleurs */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👁 Aperçu</h3>
            <div style={{ background: config.couleurSecondaire, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 900, fontSize: 22, color: config.couleurTexte }}>{config.nomEntreprise}</span>
                <button style={{ background: config.couleurPrincipale, color: '#fff', border: 'none', borderRadius: 30, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>{config.heroBouton1}</button>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                {config.stats.slice(0, 3).map((s, i) => (
                  <div key={i}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: config.couleurTexte }}>{s.valeur}</span>
                    <p style={{ fontSize: 11, color: config.couleurPrincipale, marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant bas */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e5e7eb', margin: '0 -20px -28px', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder le template'}
        </button>
      </div>
    </div>
  );
}