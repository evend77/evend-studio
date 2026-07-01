// src/pages/studio/ConfigTemplateVitrineProBeaute.tsx
// e-Vend Studio — Configurateur Template PREMIUM Vitrine Pro Beauté

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_VITRINE_PRO_BEAUTE_DEFAUT,
  type ConfigVitrineProBeaute,
  type CaracteristiqueProduit,
  type TemoignageBeaute,
} from '../../templates/TemplateVitrineProBeaute';

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 18px', marginBottom: 16 };
const CP = '#f4a5a0';
const btnP: React.CSSProperties = { background: CP, color: '#3d1a4a', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnS: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnD: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' };

type Onglet = 'hero' | 'animations' | 'sections' | 'temoignages' | 'fleur' | 'contact' | 'apparence';

interface Props { vendeurId: string; templateId?: string; onSauvegarde: (config: ConfigVitrineProBeaute) => Promise<void>; }

export default function ConfigTemplateVitrineProBeaute({ vendeurId, templateId = 'vitrine-pro-beaute', onSauvegarde }: Props) {
  const [config, setConfig]         = useState<ConfigVitrineProBeaute>(CONFIG_VITRINE_PRO_BEAUTE_DEFAUT);
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
            setConfig({ ...CONFIG_VITRINE_PRO_BEAUTE_DEFAUT, ...d.config });
        }
      } catch {}
      setChargement(false);
    })();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigVitrineProBeaute>(k: K, v: ConfigVitrineProBeaute[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Template Beauté sauvegardé !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'hero',         label: 'Hero',         icone: '🌸' },
    { id: 'animations',   label: 'Animations',   icone: '🦋' },
    { id: 'sections',     label: 'Sections',     icone: '🌿' },
    { id: 'temoignages',  label: 'Témoignages',  icone: '⭐' },
    { id: 'fleur',        label: 'Fleur',        icone: '🌹' },
    { id: 'contact',      label: 'Contact',      icone: '✉️' },
    { id: 'apparence',    label: 'Apparence',    icone: '🎨' },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80 }}><p style={{ fontSize: 36 }}>⏳</p><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🌸 Pro Beauté / Cosmétique</h1>
            <span style={{ background: '#fce4dc', color: '#9a3412', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>PREMIUM 25$</span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Pétales animés · Papillons · Fleur rotative · 6 sections configurables</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer" style={{ ...btnS, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>👁 Aperçu</a>
          <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>{sauvegarde ? '⏳...' : '💾 Sauvegarder'}</button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#16a34a', fontWeight: 600 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#dc2626', fontWeight: 600 }}>{erreur}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, background: '#fce4dc22', borderRadius: 12, padding: 4 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? '#9a3412' : '#666',
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
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🌸 Textes du hero</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nom de la boutique</label>
                <input style={inp} value={config.nomBoutique} onChange={e => set('nomBoutique', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Bouton principal</label>
                <input style={inp} value={config.heroBouton} onChange={e => set('heroBouton', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Titre ligne 1</label>
                <input style={inp} value={config.heroTitreLigne1} onChange={e => set('heroTitreLigne1', e.target.value)} placeholder="Illuminate Your" />
              </div>
              <div>
                <label style={lbl}>Titre ligne 2</label>
                <input style={inp} value={config.heroTitreLigne2} onChange={e => set('heroTitreLigne2', e.target.value)} placeholder="Natural Glow" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🖼 Photo produit (flottante)</h3>
            <label style={lbl}>URL de la photo principale (fond transparent préférable)</label>
            <input style={inp} value={config.heroProduitPhoto} onChange={e => set('heroProduitPhoto', e.target.value)} placeholder="https://..." />
            {config.heroProduitPhoto && <img src={config.heroProduitPhoto} alt="produit" style={{ maxHeight: 120, marginTop: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🎨 Dégradé de fond du hero</h3>
            <label style={lbl}>CSS gradient (copiez depuis un générateur de dégradé)</label>
            <input style={inp} value={config.heroBgGradient} onChange={e => set('heroBgGradient', e.target.value)} placeholder="linear-gradient(135deg, #fce4dc, #f9d5e5)" />
            <div style={{ height: 48, borderRadius: 8, marginTop: 8, background: config.heroBgGradient, border: '1px solid #e5e7eb' }} />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Exemples : <code>linear-gradient(135deg, #fce4dc, #d8b4fe)</code> ou <code>linear-gradient(160deg, #fff0f5, #ffe4e1, #f3e8ff)</code></p>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { v: 'manuscrite' as const, l: 'Manuscrite (Dancing Script)' },
                { v: 'elegant' as const,    l: 'Élégante (Cormorant)' },
                { v: 'moderne' as const,    l: 'Moderne (Inter)' },
              ].map(({ v, l }) => (
                <div key={v} onClick={() => set('police', v)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === v ? CP : '#e5e7eb'}`, background: config.police === v ? CP + '18' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === v ? '#9a3412' : '#444' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── ANIMATIONS ───────────────────────────────────────────────────────── */}
      {onglet === 'animations' && (
        <>
          {/* Pétales */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" id="petales" checked={config.petalesActifs} onChange={e => set('petalesActifs', e.target.checked)} style={{ width: 18, height: 18 }} />
              <label htmlFor="petales" style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>🌸 Pétales tombants</label>
            </div>
            <div style={{ opacity: config.petalesActifs ? 1 : 0.4, pointerEvents: config.petalesActifs ? 'all' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Couleur des pétales</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="color" value={config.petalesCouleur} onChange={e => set('petalesCouleur', e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} value={config.petalesCouleur} onChange={e => set('petalesCouleur', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Vitesse de chute</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min="3" max="15" step="0.5" value={config.petalesVitesse} onChange={e => set('petalesVitesse', parseFloat(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412', minWidth: 50 }}>{config.petalesVitesse}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  <span>← Rapide</span><span>Lent →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Papillons */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" id="papillons" checked={config.papillonsActifs} onChange={e => set('papillonsActifs', e.target.checked)} style={{ width: 18, height: 18 }} />
              <label htmlFor="papillons" style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>🦋 Papillons animés</label>
            </div>
            <div style={{ opacity: config.papillonsActifs ? 1 : 0.4, pointerEvents: config.papillonsActifs ? 'all' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Nombre de papillons</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min="1" max="6" step="1" value={config.papillonsNb} onChange={e => set('papillonsNb', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412', minWidth: 30 }}>{config.papillonsNb}</span>
                </div>
              </div>
              <div>
                <label style={lbl}>Vitesse battements d'ailes</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min="0.5" max="5" step="0.5" value={config.papillonsVitesse} onChange={e => set('papillonsVitesse', parseFloat(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412', minWidth: 40 }}>{config.papillonsVitesse}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  <span>← Rapide</span><span>Lent →</span>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Image papillon personnalisée (PNG fond transparent)</label>
                <input style={inp} value={config.papillonsPhoto} onChange={e => set('papillonsPhoto', e.target.value)} placeholder="https://... (vide = papillon SVG généré automatiquement)" />
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Laissez vide pour utiliser les papillons SVG intégrés aux couleurs de votre thème.</p>
              </div>
            </div>

            {/* Aperçu papillon */}
            <div style={{ marginTop: 16, background: config.heroBgGradient, borderRadius: 10, padding: 20, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
              <style>{`
                @keyframes prev-papillon { 0%,100%{transform:scaleX(1) rotate(-5deg)} 50%{transform:scaleX(0.3) rotate(5deg)} }
              `}</style>
              {Array.from({ length: Math.min(config.papillonsNb, 3) }).map((_, i) => (
                <svg key={i} width={40 + i * 8} height={32 + i * 6} viewBox="0 0 60 48"
                  style={{ animation: `prev-papillon ${config.papillonsVitesse}s ease-in-out ${i * 0.3}s infinite` }}>
                  <ellipse cx="18" cy="18" rx="16" ry="12" fill={i % 2 === 0 ? cs : cp} opacity="0.75" transform="rotate(-20 18 18)" />
                  <ellipse cx="15" cy="34" rx="12" ry="8" fill={i % 2 === 0 ? cs : cp} opacity="0.6" transform="rotate(15 15 34)" />
                  <ellipse cx="42" cy="18" rx="16" ry="12" fill={i % 2 === 0 ? cs : cp} opacity="0.75" transform="rotate(20 42 18)" />
                  <ellipse cx="45" cy="34" rx="12" ry="8" fill={i % 2 === 0 ? cs : cp} opacity="0.6" transform="rotate(-15 45 34)" />
                  <ellipse cx="30" cy="24" rx="2.5" ry="10" fill={config.couleurTexte} opacity="0.5" />
                </svg>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SECTIONS ─────────────────────────────────────────────────────────── */}
      {onglet === 'sections' && (
        <>
          {/* Présentation */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📝 Section présentation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Titre (police manuscrite)</label>
                <input style={inp} value={config.sousTitreSection} onChange={e => set('sousTitreSection', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Texte de présentation</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.textePresentation} onChange={e => set('textePresentation', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Caractéristiques */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏷️ Badges caractéristiques (max 6)</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>3 badges à gauche + 3 à droite du produit central.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.caracteristiques.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} value={c.label} onChange={e => { const arr = [...config.caracteristiques]; arr[i] = { label: e.target.value }; set('caracteristiques', arr); }} placeholder={`Badge ${i + 1}`} />
                  {config.caracteristiques.length > 2 && (
                    <button style={btnD} onClick={() => set('caracteristiques', config.caracteristiques.filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
              ))}
              {config.caracteristiques.length < 6 && (
                <button style={{ ...btnS, alignSelf: 'flex-start' }} onClick={() => set('caracteristiques', [...config.caracteristiques, { label: 'Nouveau badge' }])}>+ Ajouter</button>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={lbl}>Photo produit (centre de la section)</label>
              <input style={inp} value={config.produitCentrePhoto} onChange={e => set('produitCentrePhoto', e.target.value)} placeholder="https://..." />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Dégradé de fond de la section</label>
              <input style={inp} value={config.fondCaracteristiques} onChange={e => set('fondCaracteristiques', e.target.value)} placeholder="linear-gradient(160deg, #fce4dc, #d4c5e2)" />
              <div style={{ height: 32, borderRadius: 6, marginTop: 6, background: config.fondCaracteristiques, border: '1px solid #e5e7eb' }} />
            </div>
          </div>

          {/* Collection */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🛍️ Section Collection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Titre</label>
                <input style={inp} value={config.collectionTitre} onChange={e => set('collectionTitre', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Bouton</label>
                <input style={inp} value={config.collectionBouton} onChange={e => set('collectionBouton', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Texte</label>
                <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={config.collectionTexte} onChange={e => set('collectionTexte', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Photo de fond (URL)</label>
                <input style={inp} value={config.collectionPhoto} onChange={e => set('collectionPhoto', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={lbl}>Couleur de fond</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="color" value={config.collectionFond.startsWith('#') ? config.collectionFond : '#c4b5fd'} onChange={e => set('collectionFond', e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  <input style={{ ...inp, flex: 1 }} value={config.collectionFond} onChange={e => set('collectionFond', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────────── */}
      {onglet === 'temoignages' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Photo / couleur de fond des témoignages</label>
            <input style={inp} value={config.temoignagesFond} onChange={e => set('temoignagesFond', e.target.value)} placeholder="https://... (photo de personnes)" />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Photo de visages recommandée (plein écran en fond).</p>
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⭐ Témoignages clients</h4>
          {config.temoignages.map((t, i) => (
            <div key={i} style={{ background: '#fce4dc18', borderRadius: 10, border: '1px solid #fce4dc', padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <textarea style={{ ...inp, minHeight: 64, resize: 'vertical', flex: 1 }} value={t.texte} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], texte: e.target.value }; set('temoignages', arr); }} placeholder="Témoignage (avec guillemets si désiré)" />
                <button style={btnD} onClick={() => set('temoignages', config.temoignages.filter((_, j) => j !== i))}>✕</button>
              </div>
              <div>
                <label style={lbl}>Auteur</label>
                <input style={inp} value={t.auteur} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], auteur: e.target.value }; set('temoignages', arr); }} placeholder="— Sarah M." />
              </div>
            </div>
          ))}
          <button style={{ ...btnP, marginTop: 4 }} onClick={() => set('temoignages', [...config.temoignages, { texte: '', auteur: '— Nouveau client' }])}>+ Ajouter un témoignage</button>
        </div>
      )}

      {/* ── FLEUR ROTATIVE ───────────────────────────────────────────────────── */}
      {onglet === 'fleur' && (
        <div style={card}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <input type="checkbox" id="fleur-actif" checked={config.fleurActif} onChange={e => set('fleurActif', e.target.checked)} style={{ width: 18, height: 18 }} />
            <label htmlFor="fleur-actif" style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>🌹 Activer la fleur décorative rotative</label>
          </div>

          <div style={{ opacity: config.fleurActif ? 1 : 0.4, pointerEvents: config.fleurActif ? 'all' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Vitesse de rotation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min="5" max="120" step="5" value={config.fleurVitesse} onChange={e => set('fleurVitesse', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412', minWidth: 60 }}>{config.fleurVitesse}s / tour</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  <span>← Rapide (5s)</span><span>Très lent (120s) →</span>
                </div>
              </div>
              <div>
                <label style={lbl}>Taille de la fleur</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min="100" max="500" step="20" value={config.fleurTaille} onChange={e => set('fleurTaille', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412', minWidth: 60 }}>{config.fleurTaille}px</span>
                </div>
              </div>
            </div>

            <div>
              <label style={lbl}>Photo de la fleur (PNG ou JPG — sera découpée en cercle)</label>
              <input style={inp} value={config.fleurPhoto} onChange={e => set('fleurPhoto', e.target.value)} placeholder="https://... (rose, pivoine, dahlia, fleur de cerisier...)" />
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Laissez vide pour utiliser une fleur SVG générée automatiquement aux couleurs du thème.</p>

              {config.fleurPhoto && (
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                  <style>{`@keyframes config-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                  <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', animation: `config-spin ${config.fleurVitesse}s linear infinite` }}>
                    <img src={config.fleurPhoto} alt="fleur" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      {onglet === 'contact' && (
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>✉️ Coordonnées & Footer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Courriel</label>
              <input style={inp} type="email" value={config.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Téléphone</label>
              <input style={inp} value={config.telephone} onChange={e => set('telephone', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Instagram (@handle)</label>
              <input style={inp} value={config.instagram} onChange={e => set('instagram', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Facebook (@handle)</label>
              <input style={inp} value={config.facebook} onChange={e => set('facebook', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>TikTok (@handle)</label>
              <input style={inp} value={config.tiktok} onChange={e => set('tiktok', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Adresse</label>
              <input style={inp} value={config.adresse} onChange={e => set('adresse', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Texte copyright (bas de page)</label>
              <input style={inp} value={config.copyright} onChange={e => set('copyright', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>URL du logo</label>
              <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://... (vide = logo SVG fleur)" />
              {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 40, marginTop: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            </div>
          </div>
        </div>
      )}

      {/* ── APPARENCE ────────────────────────────────────────────────────────── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🎨 Palette de couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { k: 'couleurPrimaire'   as const, l: 'Couleur primaire',   h: 'Boutons, badges hover, bords' },
                { k: 'couleurSecondaire' as const, l: 'Couleur secondaire', h: 'Papillons, menu slide, accents' },
                { k: 'couleurFond'       as const, l: 'Fond de page',       h: 'Arrière-plan général crème/blanc' },
                { k: 'couleurTexte'      as const, l: 'Couleur du texte',   h: 'Titres, corps de texte' },
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

          {/* Aperçu */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👁 Aperçu couleurs</h3>
            <div style={{ background: config.heroBgGradient, borderRadius: 10, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 28, fontWeight: 700, color: config.couleurTexte }}>{config.nomBoutique}</span>
              </div>
              <h2 style={{ fontFamily: "'Dancing Script', cursive", fontSize: 36, fontWeight: 700, color: config.couleurTexte, lineHeight: 1.2, marginBottom: 16 }}>
                {config.heroTitreLigne1}<br />{config.heroTitreLigne2}
              </h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {config.caracteristiques.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: config.couleurTexte, border: `1px solid ${config.couleurPrimaire}44` }}>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant bas */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,248,248,0.95)', backdropFilter: 'blur(6px)', borderTop: `1px solid ${CP}44`, margin: '0 -20px -28px', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder le template'}
        </button>
      </div>
    </div>
  );
}

// Variable manquante dans le configurateur — définie pour l'aperçu
const cs = '#d8b4fe';
const cp = '#f4a5a0';