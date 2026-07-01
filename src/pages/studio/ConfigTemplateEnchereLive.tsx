// src/pages/studio/ConfigTemplateEnchereLive.tsx
// e-Vend Studio — Configurateur Enchère Live (méga site multi-lots)

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_ENCHERE_LIVE_DEFAUT,
  type ConfigEnchereLive,
  type LotLive,
} from '../../templates/TemplateEnchereLive';

// ─── STYLES ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '22px 20px', marginBottom: 18 };
const CP = '#6366f1';
const btnPrimaire: React.CSSProperties = { background: CP, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondaire: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnDanger: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };

function toLocal(iso: string) { try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; } }
function fromLocal(val: string) { try { return new Date(val).toISOString(); } catch { return ''; } }

function nouveauLotLive(): LotLive {
  return {
    id: `live-${Date.now()}`,
    titre: '', description: '', photos: [],
    categorie: '', condition: 'Excellent',
    prixBase: 0, dateFin: new Date(Date.now() + 7 * 86400000).toISOString(),
    dateDebut: new Date().toISOString(), vedette: false, tags: [],
  };
}

// ─── ÉDITEUR LOT LIVE ─────────────────────────────────────────────────────────

function EditorLotLive({ lot, onSave, onCancel }: { lot: LotLive; onSave: (l: LotLive) => void; onCancel: () => void }) {
  const [l, setL] = useState<LotLive>({ ...lot, photos: [...(lot.photos || [])], tags: [...(lot.tags || [])] });
  const s = <K extends keyof LotLive>(k: K, v: LotLive[K]) => setL(prev => ({ ...prev, [k]: v }));
  const [tagsInput, setTagsInput] = useState((lot.tags || []).join(', '));

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, border: `2px solid ${CP}30`, padding: '18px 16px', marginBottom: 14 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
        {l.titre === '' ? '➕ Nouveau lot Live' : `✏️ ${l.titre}`}
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Titre du lot *</label>
          <input style={inp} value={l.titre} onChange={e => s('titre', e.target.value)} placeholder="Ex: Sneakers Jordan 1 — Taille 42" />
        </div>
        <div>
          <label style={lbl}>Catégorie</label>
          <input style={inp} value={l.categorie} onChange={e => s('categorie', e.target.value)} placeholder="Ex: Sneakers, Gaming, Luxe" />
        </div>
        <div>
          <label style={lbl}>Condition</label>
          <select style={inp} value={l.condition} onChange={e => s('condition', e.target.value)}>
            {['Neuf', 'Comme neuf', 'Excellent', 'Très bon état', 'Bon état'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Prix de départ ($) *</label>
          <input style={inp} type="number" min="0" step="0.01" value={l.prixBase} onChange={e => s('prixBase', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label style={lbl}>Prix de réserve ($) <span style={{ color: '#aaa', fontWeight: 400 }}>opt.</span></label>
          <input style={inp} type="number" min="0" step="0.01" value={l.prixReserve || ''} onChange={e => s('prixReserve', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="Aucune réserve" />
        </div>
        <div>
          <label style={lbl}>Début</label>
          <input style={inp} type="datetime-local" value={toLocal(l.dateDebut)} onChange={e => s('dateDebut', fromLocal(e.target.value))} />
        </div>
        <div>
          <label style={lbl}>Fin *</label>
          <input style={inp} type="datetime-local" value={toLocal(l.dateFin)} onChange={e => s('dateFin', fromLocal(e.target.value))} />
        </div>
        <div>
          <label style={lbl}>Tags <span style={{ color: '#aaa', fontWeight: 400 }}>optionnel</span></label>
          <input style={inp} value={tagsInput} onChange={e => { setTagsInput(e.target.value); s('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean)); }} placeholder="Ex: Nike, Jordan, Deadstock" />
          <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>Séparés par des virgules · Affichés comme hashtags</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id={`vedette-${l.id}`} checked={l.vedette} onChange={e => s('vedette', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor={`vedette-${l.id}`} style={{ fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>⭐ Lot vedette</label>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={l.description} onChange={e => s('description', e.target.value)} placeholder="État, contenu, détails techniques..." />
        </div>
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={lbl}>Photos</label>
          <button style={{ ...btnSecondaire, padding: '5px 12px', fontSize: 12 }} onClick={() => s('photos', [...l.photos, ''])}>+ Photo</button>
        </div>
        {l.photos.map((ph, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            {ph && <img src={ph} alt="" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <input style={{ ...inp, flex: 1 }} value={ph} onChange={e => { const p = [...l.photos]; p[i] = e.target.value; s('photos', p); }} placeholder="URL photo" />
            <button style={btnDanger} onClick={() => s('photos', l.photos.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        {l.photos.length === 0 && <p style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>Ajoutez des photos pour ce lot.</p>}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btnSecondaire} onClick={onCancel}>Annuler</button>
        <button style={btnPrimaire} onClick={() => { if (!l.titre.trim()) { alert('Le titre est requis.'); return; } onSave(l); }}>Sauvegarder le lot</button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { vendeurId: string; templateId?: string; onSauvegarde: (config: ConfigEnchereLive) => Promise<void>; }
type Onglet = 'lots' | 'vente' | 'apparence' | 'contact';

export default function ConfigTemplateEnchereLive({ vendeurId, templateId = 'enchere-live', onSauvegarde }: Props) {
  const [config, setConfig]     = useState<ConfigEnchereLive>(CONFIG_ENCHERE_LIVE_DEFAUT);
  const [onglet, setOnglet]     = useState<Onglet>('lots');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces]     = useState('');
  const [erreur, setErreur]     = useState('');
  const [lotEdite, setLotEdite] = useState<LotLive | null>(null);
  const [modeEdition, setModeEdition] = useState<'new' | 'edit' | null>(null);

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.config && Object.keys(data.config).length > 0) {
            const cfg = { ...data.config };
            // Sécuriser les lots chargés depuis la BD
            if (cfg.lots) {
              cfg.lots = cfg.lots.map((l: any) => ({
                ...l,
                photos: l.photos || [],
                tags:   l.tags   || [],
              }));
            }
            setConfig({ ...CONFIG_ENCHERE_LIVE_DEFAUT, ...cfg });
          }
        }
      } catch {}
      setChargement(false);
    };
    charger();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigEnchereLive>(k: K, v: ConfigEnchereLive[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Enchère Live sauvegardée !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const sauvegarderLot = (l: LotLive) => {
    setConfig(prev => {
      const existe = prev.lots.find(x => x.id === l.id);
      return { ...prev, lots: existe ? prev.lots.map(x => x.id === l.id ? l : x) : [...prev.lots, l] };
    });
    setLotEdite(null); setModeEdition(null);
  };

  const supprimerLot = (id: string) => {
    if (!window.confirm('Supprimer ce lot ?')) return;
    setConfig(prev => ({ ...prev, lots: prev.lots.filter(l => l.id !== id) }));
  };

  const deplacerLot = (id: string, dir: 'up' | 'down') => {
    setConfig(prev => {
      const arr = [...prev.lots];
      const i = arr.findIndex(l => l.id === id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, lots: arr };
    });
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'lots',      label: 'Lots',      icone: '📦' },
    { id: 'vente',     label: 'Vente',     icone: '📡' },
    { id: 'apparence', label: 'Apparence', icone: '🎨' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80, fontFamily: 'Inter, sans-serif' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>📡 Enchère Live</h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{config.lots.length} lot(s) · Style bourse en direct</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer"
            style={{ ...btnSecondaire, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>👁 Aperçu</a>
          <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
            {sauvegarde ? '⏳...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 600, fontSize: 14 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>{erreur}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? CP : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ── LOTS ── */}
      {onglet === 'lots' && (
        <div>
          <div style={{ ...card, background: '#030712', border: `1px solid ${CP}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>
                <strong style={{ color: '#fff' }}>{config.lots.length} lots</strong> en Direct — Les acheteurs voient tous les lots simultanément dans la sidebar.
              </p>
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📦 Lots de l'enchère</h3>
            {modeEdition !== 'new' && (
              <button style={btnPrimaire} onClick={() => { setLotEdite(nouveauLotLive()); setModeEdition('new'); }}>+ Nouveau lot</button>
            )}
          </div>

          {modeEdition === 'new' && lotEdite && <EditorLotLive lot={lotEdite} onSave={sauvegarderLot} onCancel={() => { setLotEdite(null); setModeEdition(null); }} />}
          {modeEdition === 'edit' && lotEdite && <EditorLotLive lot={lotEdite} onSave={sauvegarderLot} onCancel={() => { setLotEdite(null); setModeEdition(null); }} />}

          {config.lots.length === 0 && modeEdition !== 'new' && (
            <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📡</p>
              <p style={{ color: '#aaa', marginBottom: 20 }}>Aucun lot — Ajoutez plusieurs lots pour l'expérience Live.</p>
              <button style={btnPrimaire} onClick={() => { setLotEdite(nouveauLotLive()); setModeEdition('new'); }}>+ Ajouter mon premier lot</button>
            </div>
          )}

          {config.lots.map((lot, idx) => (
            <div key={lot.id} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${modeEdition === 'edit' && lotEdite?.id === lot.id ? CP : '#f0f0f8'}`, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 60, height: 48, borderRadius: 8, overflow: 'hidden', background: '#030712', flexShrink: 0 }}>
                {lot.photos[0]
                  ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{lot.titre || '(Sans titre)'}</p>
                  {lot.vedette && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>⭐ Vedette</span>}
                  <span style={{ fontSize: 11, background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: 12 }}>{lot.categorie || 'Sans catégorie'}</span>
                  {(lot.tags || []).length > 0 && (lot.tags || []).map(t => <span key={t} style={{ fontSize: 10, background: `${CP}15`, color: CP, padding: '1px 6px', borderRadius: 10 }}>#{t}</span>)}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
                  {lot.prixBase.toFixed(2)} $ · Fin : {new Date(lot.dateFin).toLocaleDateString('fr-CA')}
                  {lot.prixReserve && ` · Réserve : ${lot.prixReserve.toFixed(2)} $`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => deplacerLot(lot.id, 'up')} disabled={idx === 0} style={{ ...btnSecondaire, padding: '5px 8px', opacity: idx === 0 ? 0.35 : 1 }}>↑</button>
                <button onClick={() => deplacerLot(lot.id, 'down')} disabled={idx === config.lots.length - 1} style={{ ...btnSecondaire, padding: '5px 8px', opacity: idx === config.lots.length - 1 ? 0.35 : 1 }}>↓</button>
                <button style={{ ...btnSecondaire, padding: '6px 12px', fontSize: 13 }}
                  onClick={() => { if (modeEdition === 'edit' && lotEdite?.id === lot.id) { setLotEdite(null); setModeEdition(null); } else { setLotEdite({ ...lot, photos: [...(lot.photos || [])], tags: [...(lot.tags || [])] }); setModeEdition('edit'); } }}>
                  {modeEdition === 'edit' && lotEdite?.id === lot.id ? '✕ Fermer' : '✏️ Modifier'}
                </button>
                <button style={{ ...btnDanger, padding: '6px 12px' }} onClick={() => supprimerLot(lot.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── VENTE ── */}
      {onglet === 'vente' && (
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📡 Paramètres Live</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Nom de la vente</label>
              <input style={inp} value={config.nomVente} onChange={e => set('nomVente', e.target.value)} placeholder="Ex: Vente Live — Juin 2026" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={config.descriptionVente} onChange={e => set('descriptionVente', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Incrément minimum ($)</label>
              <input style={inp} type="number" min="1" step="1" value={config.incrementMin} onChange={e => set('incrementMin', parseFloat(e.target.value) || 1)} />
            </div>
            <div>
              <label style={lbl}>Mises max sans compte</label>
              <input style={inp} type="number" min="0" step="1" value={config.maxMisesSansCompte} onChange={e => set('maxMisesSansCompte', parseInt(e.target.value) || 0)} />
              <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>Nombre de mises autorisées sans créer de compte acheteur. 0 = compte requis.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── APPARENCE ── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎨 Couleurs néon</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { k: 'couleurPrimaire'   as const, l: 'Couleur primaire',  h: 'Sidebar, boutons, accents' },
                { k: 'couleurAccent'     as const, l: 'Couleur accent',    h: 'Highlights, gradient' },
                { k: 'couleurFond'       as const, l: 'Fond de page',      h: 'Arrière-plan général' },
                { k: 'couleurSecondaire' as const, l: 'Couleur secondaire',h: 'Textes secondaires' },
              ].map(({ k, l: l2, h }) => (
                <div key={k}>
                  <label style={lbl}>{l2}</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={config[k]} onChange={e => set(k, e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} value={config[k]} onChange={e => set(k, e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{h}</p>
                </div>
              ))}
            </div>
            {/* Aperçu */}
            <div style={{ marginTop: 16, background: config.couleurFond, borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live</span>
              <div style={{ height: 3, flex: 1, background: `linear-gradient(90deg, ${config.couleurPrimaire}, ${config.couleurAccent})`, borderRadius: 2 }} />
              <span style={{ color: config.couleurPrimaire, fontWeight: 900, fontSize: 16 }}>1 250 $</span>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🏷️ Identité</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Nom de boutique</label>
                <input style={inp} value={config.nomBoutique} onChange={e => set('nomBoutique', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Slogan</label>
                <input style={inp} value={config.slogan} onChange={e => set('slogan', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>URL du logo</label>
                <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CONTACT ── */}
      {onglet === 'contact' && (
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>✉️ Coordonnées</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Nom de l'organisateur</label>
              <input style={inp} value={config.nomOrganisateur} onChange={e => set('nomOrganisateur', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Courriel *</label>
              <input style={inp} type="email" value={config.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Téléphone</label>
              <input style={inp} value={config.telephone || ''} onChange={e => set('telephone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Bouton bas */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e5e7eb', margin: '0 -20px -32px', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder le Live'}
        </button>
      </div>
    </div>
  );
}