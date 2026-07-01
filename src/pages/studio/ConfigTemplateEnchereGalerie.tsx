// src/pages/studio/ConfigTemplateEnchereGalerie.tsx
// e-Vend Studio — Configurateur Enchère Galerie (multi-lots)

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_ENCHERE_GALERIE_DEFAUT,
  type ConfigEnchereGalerie,
  type Lot,
} from '../../templates/TemplateEnchereGalerie';

// ─── STYLES PARTAGÉS ──────────────────────────────────────────────────────────

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '22px 20px', marginBottom: 18 };
const cp = '#c9a96e';
const btnPrimaire: React.CSSProperties = { background: cp, color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondaire: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnDanger: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };

function toLocal(iso: string) { try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; } }
function fromLocal(val: string) { try { return new Date(val).toISOString(); } catch { return ''; } }

function nouveauLot(): Lot {
  return {
    id: `lot-${Date.now()}`,
    titre: '', description: '', photos: [], condition: 'Excellent',
    categorie: '', prixBase: 0, dateFin: new Date(Date.now() + 3 * 86400000).toISOString(),
    dateDebut: new Date().toISOString(), vedette: false,
  };
}

// ─── ÉDITEUR DE LOT ───────────────────────────────────────────────────────────

function EditorLot({ lot, onSave, onCancel }: { lot: Lot; onSave: (l: Lot) => void; onCancel: () => void }) {
  const [l, setL] = useState<Lot>({ ...lot, photos: [...lot.photos] });
  const s = <K extends keyof Lot>(k: K, v: Lot[K]) => setL(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, border: `2px solid ${cp}30`, padding: '18px 16px', marginBottom: 14 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
        {l.id.startsWith('lot-') && l.titre === '' ? '➕ Nouveau lot' : `✏️ ${l.titre || 'Modifier le lot'}`}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Titre du lot *</label>
          <input style={inp} value={l.titre} onChange={e => s('titre', e.target.value)} placeholder="Ex: Montre Tissot Le Locle" />
        </div>
        <div>
          <label style={lbl}>Catégorie</label>
          <input style={inp} value={l.categorie} onChange={e => s('categorie', e.target.value)} placeholder="Ex: Montres, Art, Électronique" />
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
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={l.description} onChange={e => s('description', e.target.value)} placeholder="État, historique, inclus..." />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id={`vedette-${l.id}`} checked={l.vedette} onChange={e => s('vedette', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor={`vedette-${l.id}`} style={{ fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>⭐ Lot vedette</label>
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
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={btnSecondaire} onClick={onCancel}>Annuler</button>
        <button style={btnPrimaire} onClick={() => { if (!l.titre.trim()) { alert('Le titre est requis.'); return; } onSave(l); }}>Sauvegarder le lot</button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { vendeurId: string; templateId?: string; onSauvegarde: (config: ConfigEnchereGalerie) => Promise<void>; }
type Onglet = 'lots' | 'vente' | 'apparence' | 'contact';

export default function ConfigTemplateEnchereGalerie({ vendeurId, templateId = 'enchere-galerie', onSauvegarde }: Props) {
  const [config, setConfig]     = useState<ConfigEnchereGalerie>(CONFIG_ENCHERE_GALERIE_DEFAUT);
  const [onglet, setOnglet]     = useState<Onglet>('lots');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces]     = useState('');
  const [erreur, setErreur]     = useState('');
  const [lotEdite, setLotEdite] = useState<Lot | null>(null);
  const [modeEdition, setModeEdition] = useState<'new' | 'edit' | null>(null);

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.config && Object.keys(data.config).length > 0)
            setConfig({ ...CONFIG_ENCHERE_GALERIE_DEFAUT, ...data.config });
        }
      } catch {}
      setChargement(false);
    };
    charger();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigEnchereGalerie>(k: K, v: ConfigEnchereGalerie[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Galerie sauvegardée !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const sauvegarderLot = (l: Lot) => {
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
    { id: 'vente',     label: 'Vente',     icone: '🔨' },
    { id: 'apparence', label: 'Apparence', icone: '🎨' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80, fontFamily: 'Inter, sans-serif' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>🏛 Enchère Galerie</h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{config.lots.length} lot(s) · Style maison de ventes</p>
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
              color: onglet === o.id ? cp : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ── LOTS ── */}
      {onglet === 'lots' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📦 Mes lots</h3>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{config.lots.length} lot(s) dans votre galerie</p>
            </div>
            {modeEdition !== 'new' && (
              <button style={btnPrimaire} onClick={() => { setLotEdite(nouveauLot()); setModeEdition('new'); }}>+ Nouveau lot</button>
            )}
          </div>

          {modeEdition === 'new' && lotEdite && <EditorLot lot={lotEdite} onSave={sauvegarderLot} onCancel={() => { setLotEdite(null); setModeEdition(null); }} />}
          {modeEdition === 'edit' && lotEdite && <EditorLot lot={lotEdite} onSave={sauvegarderLot} onCancel={() => { setLotEdite(null); setModeEdition(null); }} />}

          {config.lots.length === 0 && modeEdition !== 'new' && (
            <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
              <p style={{ color: '#aaa', marginBottom: 20 }}>Aucun lot dans votre galerie.</p>
              <button style={btnPrimaire} onClick={() => { setLotEdite(nouveauLot()); setModeEdition('new'); }}>+ Ajouter mon premier lot</button>
            </div>
          )}

          {config.lots.map((lot, idx) => (
            <div key={lot.id} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${modeEdition === 'edit' && lotEdite?.id === lot.id ? cp : '#f0f0f8'}`, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 60, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f5f5fa', flexShrink: 0 }}>
                {lot.photos[0]
                  ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{lot.titre || '(Sans titre)'}</p>
                  {lot.vedette && <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>⭐ Vedette</span>}
                  <span style={{ fontSize: 11, background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: 12 }}>{lot.categorie || 'Sans catégorie'}</span>
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
                  onClick={() => { if (modeEdition === 'edit' && lotEdite?.id === lot.id) { setLotEdite(null); setModeEdition(null); } else { setLotEdite({ ...lot, photos: [...lot.photos] }); setModeEdition('edit'); } }}>
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
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔨 Paramètres de la vente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Nom de la vente</label>
                <input style={inp} value={config.nomVente} onChange={e => set('nomVente', e.target.value)} placeholder="Ex: Vente de prestige — Juin 2026" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Description de la vente</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.descriptionVente} onChange={e => set('descriptionVente', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Incrément minimum ($)</label>
                <input style={inp} type="number" min="1" step="1" value={config.incrementMin} onChange={e => set('incrementMin', parseFloat(e.target.value) || 1)} />
              </div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🖼 Bannière</h3>
            <label style={lbl}>URL de la bannière hero</label>
            <input style={inp} value={config.banniereUrl} onChange={e => set('banniereUrl', e.target.value)} placeholder="https://... (photo d'ambiance)" />
            {config.banniereUrl && <img src={config.banniereUrl} alt="Bannière" style={{ width: '100%', maxHeight: 120, marginTop: 8, borderRadius: 8, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>
        </>
      )}

      {/* ── APPARENCE ── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎨 Couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { k: 'couleurPrincipale' as const, l: 'Couleur principale', h: 'Boutons, prix, accents' },
                { k: 'couleurSecondaire' as const, l: 'Fond de page',       h: 'Arrière-plan sombre' },
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
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ val: 'moderne' as const, l: 'Moderne (Inter)' }, { val: 'classique' as const, l: 'Classique (Playfair)' }].map(({ val, l: l2 }) => (
                <div key={val} onClick={() => set('police', val)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === val ? cp : '#e5e7eb'}`, background: config.police === val ? cp + '18' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === val ? cp : '#444' }}>
                  {l2}
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🏷️ Nom de boutique</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Nom</label>
                <input style={inp} value={config.nomBoutique} onChange={e => set('nomBoutique', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Slogan</label>
                <input style={inp} value={config.sloganBoutique} onChange={e => set('sloganBoutique', e.target.value)} />
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
              <label style={lbl}>Nom du vendeur / maison</label>
              <input style={inp} value={config.nomVendeur} onChange={e => set('nomVendeur', e.target.value)} />
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
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder la galerie'}
        </button>
      </div>
    </div>
  );
}