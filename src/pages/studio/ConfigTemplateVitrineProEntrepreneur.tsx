// src/pages/studio/ConfigTemplateVitrineProEntrepreneur.tsx
// e-Vend Studio — Configurateur Template PREMIUM Vitrine Pro Entrepreneur

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_VITRINE_PRO_ENTREPRENEUR_DEFAUT,
  type ConfigVitrineProEntrepreneur,
  type Service,
  type MembreEquipe,
  type Temoignage,
  type ArticleBlog,
  type StatItem,
} from '../../templates/TemplateVitrineProEntrepreneur';

// ─── STYLES ───────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 18px', marginBottom: 16 };
const CP = '#f59e0b';
const btnP: React.CSSProperties = { background: CP, color: '#111', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnS: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnD: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

type Onglet = 'hero' | 'badge' | 'stats' | 'apropos' | 'services' | 'equipe' | 'temoignages' | 'blog' | 'devis' | 'contact' | 'apparence';

interface Props {
  vendeurId: string;
  templateId?: string;
  onSauvegarde: (config: ConfigVitrineProEntrepreneur) => Promise<void>;
}

// ─── ÉDITEUR GÉNÉRIQUE LISTE ──────────────────────────────────────────────────

function ListeEditor<T extends Record<string, any>>({
  items, onUpdate, fields, titre, icone, creerItem,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  fields: { key: keyof T; label: string; type?: 'text' | 'textarea' | 'number' | 'url'; placeholder?: string }[];
  titre: string;
  icone: string;
  creerItem: () => T;
}) {
  const [editeIdx, setEditeIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<T | null>(null);

  const ouvrir = (i: number) => { setEditeIdx(i); setDraft({ ...items[i] }); };
  const fermer = () => { setEditeIdx(null); setDraft(null); };
  const sauver = () => {
    if (draft === null || editeIdx === null) return;
    const next = [...items]; next[editeIdx] = draft; onUpdate(next); fermer();
  };
  const ajouter = () => {
    const next = [...items, creerItem()];
    onUpdate(next);
    setEditeIdx(next.length - 1);
    setDraft(creerItem());
  };
  const supprimer = (i: number) => { if (!window.confirm('Supprimer?')) return; onUpdate(items.filter((_, idx) => idx !== i)); };
  const deplacer = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; onUpdate(next);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{icone} {titre} ({items.length})</h3>
        <button style={btnP} onClick={ajouter}>+ Ajouter</button>
      </div>

      {/* Éditeur inline */}
      {editeIdx !== null && draft !== null && (
        <div style={{ background: '#f8fafc', borderRadius: 12, border: `2px solid ${CP}40`, padding: '16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <div key={String(f.key)} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
                <label style={lbl}>{f.label}</label>
                {f.type === 'textarea'
                  ? <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={String(draft[f.key] ?? '')} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  : f.type === 'number'
                  ? <input style={inp} type="number" value={Number(draft[f.key] ?? 0)} onChange={e => setDraft({ ...draft, [f.key]: parseFloat(e.target.value) || 0 })} />
                  : <input style={inp} type="text" value={String(draft[f.key] ?? '')} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button style={btnS} onClick={fermer}>Annuler</button>
            <button style={btnP} onClick={sauver}>✓ Sauvegarder</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {items.map((item, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${editeIdx === i ? CP : '#e5e7eb'}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {item.photo && <img src={item.photo} alt="" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {String(item[fields[0].key] || '(vide)')}
            </p>
            {fields[1] && <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{String(item[fields[1].key] || '').slice(0, 60)}</p>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => deplacer(i, 'up')} disabled={i === 0} style={{ ...btnS, padding: '4px 8px', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
            <button onClick={() => deplacer(i, 'down')} disabled={i === items.length - 1} style={{ ...btnS, padding: '4px 8px', opacity: i === items.length - 1 ? 0.3 : 1 }}>↓</button>
            <button onClick={() => editeIdx === i ? fermer() : ouvrir(i)} style={{ ...btnS, padding: '5px 10px', fontSize: 12 }}>{editeIdx === i ? '✕' : '✏️'}</button>
            <button onClick={() => supprimer(i)} style={btnD}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function ConfigTemplateVitrineProEntrepreneur({ vendeurId, templateId = 'vitrine-pro-entrepreneur', onSauvegarde }: Props) {
  const [config, setConfig]         = useState<ConfigVitrineProEntrepreneur>(CONFIG_VITRINE_PRO_ENTREPRENEUR_DEFAUT);
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
            setConfig({ ...CONFIG_VITRINE_PRO_ENTREPRENEUR_DEFAUT, ...d.config });
        }
      } catch {}
      setChargement(false);
    })();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigVitrineProEntrepreneur>(k: K, v: ConfigVitrineProEntrepreneur[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Template sauvegardé !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'hero',         label: 'Hero',        icone: '🖼'  },
    { id: 'badge',        label: 'Badge',       icone: '⭕'  },
    { id: 'stats',        label: 'Stats',       icone: '📊'  },
    { id: 'apropos',      label: 'À propos',    icone: '🏢'  },
    { id: 'services',     label: 'Services',    icone: '🔧'  },
    { id: 'equipe',       label: 'Équipe',      icone: '👥'  },
    { id: 'temoignages',  label: 'Avis',        icone: '⭐'  },
    { id: 'blog',         label: 'Blog',        icone: '📝'  },
    { id: 'devis',        label: 'Devis',       icone: '📋'  },
    { id: 'contact',      label: 'Contact',     icone: '✉️'  },
    { id: 'apparence',    label: 'Apparence',   icone: '🎨'  },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80, fontFamily: 'Inter, sans-serif' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🏗️ Vitrine Pro Entrepreneur</h1>
            <span style={{ background: CP + '20', color: '#b45309', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>PREMIUM 25$</span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Template pro — Badge rotatif · Stats animées · 9 sections configurables</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer" style={{ ...btnS, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>👁 Aperçu</a>
          <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>{sauvegarde ? '⏳...' : '💾 Sauvegarder'}</button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#16a34a', fontWeight: 600, fontSize: 14 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>{erreur}</div>}

      {/* Onglets — 2 rangées */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 22, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
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
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🖼 Section Hero</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Nom de l'entreprise</label>
                <input style={inp} value={config.nomEntreprise} onChange={e => set('nomEntreprise', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Titre hero (utilisez \n pour sauter une ligne)</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.heroTitre} onChange={e => set('heroTitre', e.target.value)} placeholder="Construire Votre\nVision avec\nPrécision" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Sous-titre hero</label>
                <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={config.heroSousTitre} onChange={e => set('heroSousTitre', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Texte bouton principal</label>
                <input style={inp} value={config.heroBouton1Texte} onChange={e => set('heroBouton1Texte', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Texte bouton secondaire</label>
                <input style={inp} value={config.heroBouton2Texte} onChange={e => set('heroBouton2Texte', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Photo hero (URL)</label>
                <input style={inp} value={config.heroPhoto} onChange={e => set('heroPhoto', e.target.value)} placeholder="https://..." />
                {config.heroPhoto && <img src={config.heroPhoto} alt="hero" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🧭 Navigation visible</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['lienAbout',    'À propos'],
                ['lienServices', 'Services'],
                ['lienEquipe',   'Équipe'],
                ['lienBlog',     'Blog'],
                ['lienContact',  'Contact'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={Boolean(config[key as keyof ConfigVitrineProEntrepreneur])} onChange={e => set(key as any, e.target.checked)} style={{ width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── BADGE ROTATIF ────────────────────────────────────────────────────── */}
      {onglet === 'badge' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>⭕ Badge rotatif</h3>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
            Le badge apparaît à droite du titre hero. Le texte tourne autour du logo de votre entreprise.
          </p>

          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="badge-actif" checked={config.badgeActif} onChange={e => set('badgeActif', e.target.checked)} style={{ width: 18, height: 18 }} />
            <label htmlFor="badge-actif" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Afficher le badge rotatif</label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: config.badgeActif ? 1 : 0.4, pointerEvents: config.badgeActif ? 'all' : 'none' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Texte circulaire</label>
              <input style={inp} value={config.badgeTexte} onChange={e => set('badgeTexte', e.target.value)} placeholder="★ EXPERTS DE CONFIANCE ★ DEPUIS 1989 ★" />
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Conseil : séparez les mots avec ★ ou · pour un rendu élégant</p>
            </div>
            <div>
              <label style={lbl}>Logo au centre (URL)</label>
              <input style={inp} value={config.badgeLogoUrl} onChange={e => set('badgeLogoUrl', e.target.value)} placeholder="https://... (vide = icône par défaut)" />
            </div>
            <div>
              <label style={lbl}>Vitesse de rotation</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min="5" max="30" step="1" value={config.badgeVitesse} onChange={e => set('badgeVitesse', parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: CP, minWidth: 60 }}>
                  {config.badgeVitesse}s / tour
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
                <span>← Rapide (5s)</span>
                <span>Lent (30s) →</span>
              </div>
            </div>
          </div>

          {/* Aperçu */}
          {config.badgeActif && (
            <div style={{ marginTop: 20, background: '#111827', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 160, height: 160, position: 'relative' }}>
                <style>{`@keyframes prev-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <svg style={{ position: 'absolute', inset: 0, animation: `prev-spin ${config.badgeVitesse}s linear infinite` }} width="160" height="160" viewBox="0 0 160 160">
                  {config.badgeTexte.split('').map((char, i, arr) => {
                    const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
                    const x = 80 + 70 * Math.cos(angle);
                    const y = 80 + 70 * Math.sin(angle);
                    return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(i / arr.length) * 360}, ${x}, ${y})`} style={{ fontSize: 10, fontWeight: 700, fill: '#fff', fontFamily: 'Inter, sans-serif' }}>{char}</text>;
                  })}
                </svg>
                <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {config.badgeLogoUrl
                    ? <img src={config.badgeLogoUrl} alt="logo" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: '50%' }} />
                    : <span style={{ fontSize: 28 }}>🏗️</span>
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      {onglet === 'stats' && (
        <>
          <div style={card}>
            <label style={lbl}>Photo de fond de la section stats (URL)</label>
            <input style={inp} value={config.statsBackground} onChange={e => set('statsBackground', e.target.value)} placeholder="https://..." />
          </div>
          <div style={card}>
            <ListeEditor<StatItem>
              items={config.stats}
              onUpdate={v => set('stats', v)}
              titre="Statistiques animées"
              icone="📊"
              creerItem={() => ({ valeur: 100, suffixe: '+', label: 'Nouveau stat' })}
              fields={[
                { key: 'valeur', label: 'Valeur (nombre)', type: 'number' },
                { key: 'suffixe', label: 'Suffixe (ex: +, M+, ans)', placeholder: '+' },
                { key: 'label', label: 'Libellé', placeholder: 'Projets complétés' },
              ]}
            />
          </div>
        </>
      )}

      {/* ── À PROPOS ─────────────────────────────────────────────────────────── */}
      {onglet === 'apropos' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏢 Section À propos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Sous-titre (majuscules)</label>
              <input style={inp} value={config.aproposSousTitre} onChange={e => set('aproposSousTitre', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Badge clients</label>
              <input style={inp} value={config.aproposNbClients} onChange={e => set('aproposNbClients', e.target.value)} placeholder="500+ clients satisfaits" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Titre</label>
              <input style={inp} value={config.aproposTitre} onChange={e => set('aproposTitre', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Texte</label>
              <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={config.aproposTexte} onChange={e => set('aproposTexte', e.target.value)} />
            </div>
            {['Photo gauche (grande)', 'Photo droite haut', 'Photo droite bas'].map((label2, i) => (
              <div key={i}>
                <label style={lbl}>{label2}</label>
                <input style={inp} value={config.aproposPhotos[i] || ''} onChange={e => { const p = [...config.aproposPhotos]; p[i] = e.target.value; set('aproposPhotos', p); }} placeholder="https://..." />
                {config.aproposPhotos[i] && <img src={config.aproposPhotos[i]} alt="" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6, marginTop: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SERVICES ─────────────────────────────────────────────────────────── */}
      {onglet === 'services' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <div style={grid2}>
              <div>
                <label style={lbl}>Sous-titre section</label>
                <input style={inp} value={config.servicesSousTitre} onChange={e => set('servicesSousTitre', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Titre section</label>
                <input style={inp} value={config.servicesTitre} onChange={e => set('servicesTitre', e.target.value)} />
              </div>
            </div>
          </div>
          <ListeEditor<Service>
            items={config.services}
            onUpdate={v => set('services', v)}
            titre="Services"
            icone="🔧"
            creerItem={() => ({ titre: '', description: '', photo: '', icone: '🏠' })}
            fields={[
              { key: 'titre', label: 'Titre du service' },
              { key: 'icone', label: 'Icône (emoji)', placeholder: '🏠' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'photo', label: 'Photo (URL)', type: 'url' },
            ]}
          />
        </div>
      )}

      {/* ── ÉQUIPE ───────────────────────────────────────────────────────────── */}
      {onglet === 'equipe' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section équipe</label>
            <input style={inp} value={config.equipeTitre} onChange={e => set('equipeTitre', e.target.value)} />
          </div>
          <ListeEditor<MembreEquipe>
            items={config.equipe}
            onUpdate={v => set('equipe', v)}
            titre="Membres de l'équipe"
            icone="👥"
            creerItem={() => ({ nom: '', role: '', photo: '' })}
            fields={[
              { key: 'nom',   label: 'Nom complet' },
              { key: 'role',  label: 'Poste / rôle' },
              { key: 'photo', label: 'Photo (URL)', type: 'url' },
            ]}
          />
        </div>
      )}

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────────── */}
      {onglet === 'temoignages' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section</label>
            <input style={inp} value={config.temoignagesTitre} onChange={e => set('temoignagesTitre', e.target.value)} />
          </div>
          <ListeEditor<Temoignage>
            items={config.temoignages}
            onUpdate={v => set('temoignages', v)}
            titre="Témoignages clients"
            icone="⭐"
            creerItem={() => ({ nom: '', note: 5, texte: '', photo: '' })}
            fields={[
              { key: 'nom',   label: 'Nom du client' },
              { key: 'note',  label: 'Note (1-5)', type: 'number' },
              { key: 'texte', label: 'Témoignage', type: 'textarea' },
              { key: 'photo', label: 'Photo (URL)', type: 'url' },
            ]}
          />
        </div>
      )}

      {/* ── BLOG ─────────────────────────────────────────────────────────────── */}
      {onglet === 'blog' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section blog</label>
            <input style={inp} value={config.blogTitre} onChange={e => set('blogTitre', e.target.value)} />
          </div>
          <ListeEditor<ArticleBlog>
            items={config.articles}
            onUpdate={v => set('articles', v)}
            titre="Articles"
            icone="📝"
            creerItem={() => ({ titre: '', extrait: '', photo: '', categorie: '', date: new Date().toISOString().slice(0, 10) })}
            fields={[
              { key: 'titre',     label: 'Titre de l\'article' },
              { key: 'categorie', label: 'Catégorie' },
              { key: 'date',      label: 'Date (AAAA-MM-JJ)' },
              { key: 'extrait',   label: 'Extrait', type: 'textarea' },
              { key: 'photo',     label: 'Photo (URL)', type: 'url' },
            ]}
          />
        </div>
      )}

      {/* ── DEVIS ────────────────────────────────────────────────────────────── */}
      {onglet === 'devis' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 Section Formulaire de devis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Sous-titre (petite ligne)</label>
              <input style={inp} value={config.devisTitre} onChange={e => set('devisTitre', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre principal</label>
              <input style={inp} value={config.devisSousTitre} onChange={e => set('devisSousTitre', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Photo de fond (URL)</label>
              <input style={inp} value={config.devisBackground} onChange={e => set('devisBackground', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      {onglet === 'contact' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>✉️ Coordonnées et réseaux</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { k: 'email',       l: 'Courriel',   ph: 'info@entreprise.ca' },
              { k: 'telephone',   l: 'Téléphone',  ph: '514-555-0000' },
              { k: 'instagram',   l: 'Instagram (@handle)', ph: 'macompagnie' },
              { k: 'facebook',    l: 'Facebook (@handle)',  ph: 'macompagnie' },
              { k: 'linkedin',    l: 'LinkedIn (slug)',     ph: 'ma-compagnie' },
            ].map(({ k, l, ph }) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input style={inp} value={String(config[k as keyof ConfigVitrineProEntrepreneur] || '')} onChange={e => set(k as any, e.target.value)} placeholder={ph} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Adresse complète</label>
              <input style={inp} value={config.adresse} onChange={e => set('adresse', e.target.value)} placeholder="123 rue Principale, Montréal, QC" />
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
                { k: 'couleurPrincipale' as const, l: 'Couleur principale', h: 'Stats, boutons, badges, badge rotatif' },
                { k: 'couleurSecondaire' as const, l: 'Fond sombre',         h: 'Navbar, footer, section équipe' },
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
              {[
                { v: 'moderne' as const,  l: 'Moderne (Inter)' },
                { v: 'classique' as const, l: 'Classique (Playfair)' },
                { v: 'bold' as const,      l: 'Impact (Oswald)' },
              ].map(({ v, l }) => (
                <div key={v} onClick={() => set('police', v)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === v ? CP : '#e5e7eb'}`, background: config.police === v ? CP + '18' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === v ? '#b45309' : '#444' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🖼 Logo & Description</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>URL du logo (navbar + footer)</label>
                <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
                {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 44, marginTop: 8, objectFit: 'contain', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Description courte (footer)</label>
                <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={config.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Aperçu couleurs */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👁 Aperçu</h3>
            <div style={{ background: config.couleurSecondaire, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{config.nomEntreprise}</span>
                <button style={{ background: config.couleurPrincipale, color: config.couleurSecondaire, border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Contact</button>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {config.stats.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: config.couleurPrincipale }}>{s.valeur}{s.suffixe}</span>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e5e7eb', margin: '0 -20px -28px', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder le template'}
        </button>
      </div>
    </div>
  );
}