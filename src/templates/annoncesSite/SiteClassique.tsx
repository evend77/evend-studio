// src/templates/annoncesSite/SiteClassique.tsx
// e-Vend Studio — Gabarit « Classique » partagé par les petites annonces spécialisées (Auto, Immobilier).
// Même apparence que « Annonces Classique », avec filtres par détails (marque, année, chambres…) et puces de fiche.

import { useState, useEffect } from 'react';
import { useAnnonces, FormulaireContact, fmtPrix, ilYa, FILTRES_VIDES, filtresActifs, type AnnoncePub, type Filtres } from './moteur';

export interface ConfigAnnoncesClassique {
  nomSite: string; slogan: string; logoUrl: string; couleurPrincipale: string; couleurFond: string;
  police: 'classique' | 'moderne'; apropos: string; email: string; telephone: string;
}

export interface ProfilAnnonces {
  icone: string;
  recherche: string;                                   // placeholder de la recherche
  lieuPlaceholder: string;
  defaut: ConfigAnnoncesClassique;
  demo: AnnoncePub[];
  selects: { cle: string; label: string }[];           // filtres « liste » (valeurs vues dans les annonces)
  plages: { cle: string; label: string; unite?: string; min?: boolean; max?: boolean; pas?: number }[];
  puces: (a: AnnoncePub) => string[];                  // puces affichées sur la carte
  suffixePrix?: (a: AnnoncePub) => string;             // ex. « /mois »
  avis: string;                                        // bas de page
}

function Carte({ a, couleur, police, profil, onClick }: { a: AnnoncePub; couleur: string; police: string; profil: ProfilAnnonces; onClick: () => void }) {
  const puces = profil.puces(a);
  return (
    <article onClick={onClick} style={{ background: '#fff', border: '1px solid #e7e2d8', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column', fontFamily: police }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 26px rgba(0,0,0,.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: '#efe9dc' }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>📷</div>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, left: 10, background: couleur, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '.05em' }}>⭐ VEDETTE</span>}
        {a.photos.length > 1 && <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>📷 {a.photos.length}</span>}
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: couleur, margin: 0 }}>{fmtPrix(a)}{a.prix != null && profil.suffixePrix ? <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}> {profil.suffixePrix(a)}</span> : null}</p>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        {puces.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>{puces.map((p) => <span key={p} style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px' }}>{p}</span>)}</div>}
        <p style={{ fontSize: 12, color: '#6b7280', margin: 'auto 0 0', paddingTop: 6 }}>{a.lieu ? `📍 ${a.lieu} · ` : ''}{ilYa(a.datePublication)}</p>
      </div>
    </article>
  );
}

function Detail({ a, gid, demo: estDemo, cfg, police, profil, onClose }: { a: AnnoncePub; gid: number; demo: boolean; cfg: ConfigAnnoncesClassique; police: string; profil: ProfilAnnonces; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  const cp = cfg.couleurPrincipale;
  const det = Object.entries(a.details || {});
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: cfg.couleurFond, borderRadius: 18, width: '100%', maxWidth: 960, fontFamily: police, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e7e2d8', background: '#fff' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{a.categorie || 'Annonce'}</span>
          <button onClick={onClose} aria-label="Fermer" style={{ background: '#f3f0e8', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, padding: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#efe9dc', aspectRatio: '4/3', marginBottom: 8 }}>
              {a.photos[photo] ? <img src={a.photos[photo]} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#efe9dc', display: 'block' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46 }}>📷</div>}
            </div>
            {a.photos.length > 1 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{a.photos.map((p, i) => <div key={i} onClick={() => setPhoto(i)} style={{ width: 60, height: 46, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photo ? cp : 'transparent'}` }}><img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}</div>}
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1f2937', margin: '18px 0 4px', lineHeight: 1.25 }}>{a.titre}</h2>
            <p style={{ fontSize: 26, fontWeight: 900, color: cp, margin: '0 0 6px' }}>{fmtPrix(a)}{a.prix != null && profil.suffixePrix ? <span style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}> {profil.suffixePrix(a)}</span> : null}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>{a.lieu ? `📍 ${a.lieu} · ` : ''}Publiée {ilYa(a.datePublication)}</p>
            {det.length > 0 && <div style={{ background: '#fff', border: '1px solid #e7e2d8', borderRadius: 10, padding: '4px 14px', marginBottom: 14 }}>{det.map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1ede3', fontSize: 14 }}><span style={{ color: '#6b7280' }}>{k}</span><strong style={{ color: '#1f2937', textAlign: 'right' }}>{v}</strong></div>)}</div>}
            {a.description && <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{a.description}</p>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ background: '#fff', border: '1px solid #e7e2d8', borderRadius: 14, padding: 18, position: 'sticky', top: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Contacter l'annonceur</h3>
              {estDemo && <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>Aperçu avec des annonces d'exemple : l'envoi est désactivé.</div>}
              <FormulaireContact gid={gid} annonceId={a.id} couleur={cp} demo={estDemo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props { profil: ProfilAnnonces; config?: Partial<ConfigAnnoncesClassique>; siteId?: number; vendeurId?: number; }

export default function SiteClassique({ profil, config: configProp, vendeurId }: Props) {
  const cfg: ConfigAnnoncesClassique = { ...profil.defaut, ...Object.fromEntries(Object.entries(configProp || {}).filter(([, v]) => v !== '' && v != null)) } as ConfigAnnoncesClassique;
  const gid = Number(vendeurId || 0);
  const cp = cfg.couleurPrincipale;
  const police = cfg.police === 'moderne' ? "'Inter', sans-serif" : "'Source Serif 4', Georgia, serif";
  const police2 = "'Inter', sans-serif";

  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [saisie, setSaisie] = useState('');
  const [lieuSaisie, setLieuSaisie] = useState('');
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const r = useAnnonces(gid, profil.demo, f, profil.selects.map((x) => x.cle));

  const set = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const chercher = () => set({ q: saisie.trim(), lieu: lieuSaisie.trim() });

  const champ: React.CSSProperties = { padding: '12px 14px', border: '1px solid #d6d3cc', borderRadius: 10, fontSize: 15, fontFamily: police2, background: '#fff', color: '#1f2937', minWidth: 0, boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: cfg.couleurFond, color: '#1f2937', fontFamily: police2 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;700;800&family=Inter:wght@400;500;600;700;800&display=swap" />
      <style>{`* { box-sizing: border-box; } img { display:block; } input::placeholder, textarea::placeholder { color:#9ca3af; } .ann-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap:18px; }
        @media (max-width: 640px) { .ann-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; } .ann-recherche { flex-direction: column !important; } .ann-recherche > * { width:100% !important; flex:none !important; } }`}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #e7e2d8' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt="logo" style={{ height: 38, objectFit: 'contain' }} /> : <div style={{ width: 38, height: 38, borderRadius: 10, background: cp, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{profil.icone}</div>}
          <span style={{ fontFamily: police, fontSize: 22, fontWeight: 800, color: '#1f2937' }}>{cfg.nomSite}</span>
        </div>
      </header>

      <section style={{ background: `linear-gradient(135deg, ${cp}, ${cp}cc)`, padding: '34px 18px 38px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: police, fontSize: 'clamp(24px, 4.5vw, 38px)', color: '#fff', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.15 }}>{cfg.slogan}</h1>
          <div className="ann-recherche" style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <input style={{ ...champ, flex: 3 }} placeholder={profil.recherche} value={saisie} onChange={(e) => setSaisie(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && chercher()} />
            <input style={{ ...champ, flex: 2 }} placeholder={profil.lieuPlaceholder} value={lieuSaisie} onChange={(e) => setLieuSaisie(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && chercher()} />
            <button onClick={chercher} style={{ padding: '12px 24px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>🔍 Chercher</button>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 18px 50px' }}>
        {r.demo && <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', color: '#92400e', fontSize: 13, marginBottom: 16 }}>Aperçu avec des annonces d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}

        {r.categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
            {[{ nom: '', n: r.categories.reduce((s, c) => s + c.n, 0) }, ...r.categories].map((c) => (
              <button key={c.nom || 'toutes'} onClick={() => set({ categorie: c.nom })} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 30, border: `1.5px solid ${f.categorie === c.nom ? cp : '#d6d3cc'}`, background: f.categorie === c.nom ? cp : '#fff', color: f.categorie === c.nom ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c.nom || 'Toutes'} <span style={{ opacity: .7, fontWeight: 600 }}>({c.n})</span></button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{r.loading ? 'Chargement…' : `${r.total} annonce${r.total !== 1 ? 's' : ''}`}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setFiltresOuverts((v) => !v)} style={{ ...champ, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⚙️ Filtres {filtresOuverts ? '▲' : '▼'}</button>
            <select value={f.tri} onChange={(e) => set({ tri: e.target.value as Filtres['tri'] })} style={{ ...champ, padding: '8px 12px', fontSize: 13 }}>
              <option value="recent">Plus récentes</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option>
            </select>
          </div>
        </div>
        {filtresOuverts && (
          <div style={{ background: '#fff', border: '1px solid #e7e2d8', borderRadius: 12, padding: 14, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, alignItems: 'end' }}>
            {profil.selects.map((x) => (
              <label key={x.cle} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{x.label}
                <select style={{ ...champ, width: '100%', marginTop: 4, padding: '9px 10px', fontSize: 14 }} value={(f.d || {})[x.cle] || ''} onChange={(e) => set({ d: { ...(f.d || {}), [x.cle]: e.target.value } })}>
                  <option value="">Tous</option>
                  {(r.facettes[x.cle] || []).map((o) => <option key={o.nom} value={o.nom}>{o.nom} ({o.n})</option>)}
                </select>
              </label>
            ))}
            {profil.plages.map((x) => (
              <div key={x.cle}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>{x.label}{x.unite ? ` (${x.unite})` : ''}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {x.min !== false && <input style={{ ...champ, width: '100%', padding: '9px 10px', fontSize: 14 }} type="number" min={0} placeholder="Min" value={(f.dmin || {})[x.cle] || ''} onChange={(e) => set({ dmin: { ...(f.dmin || {}), [x.cle]: e.target.value } })} />}
                  {x.min !== false && x.max !== false && <span style={{ color: '#9ca3af' }}>–</span>}
                  {x.max !== false && <input style={{ ...champ, width: '100%', padding: '9px 10px', fontSize: 14 }} type="number" min={0} placeholder="Max" value={(f.dmax || {})[x.cle] || ''} onChange={(e) => set({ dmax: { ...(f.dmax || {}), [x.cle]: e.target.value } })} />}
                </div>
              </div>
            ))}
            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>Prix ($)</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input style={{ ...champ, width: '100%', padding: '9px 10px', fontSize: 14 }} type="number" min={0} placeholder="Min" value={f.prixMin} onChange={(e) => set({ prixMin: e.target.value })} />
                <span style={{ color: '#9ca3af' }}>–</span>
                <input style={{ ...champ, width: '100%', padding: '9px 10px', fontSize: 14 }} type="number" min={0} placeholder="Max" value={f.prixMax} onChange={(e) => set({ prixMax: e.target.value })} />
              </div>
            </div>
            {filtresActifs(f) && <button onClick={() => { setF(FILTRES_VIDES); setSaisie(''); setLieuSaisie(''); }} style={{ background: 'none', border: 'none', color: cp, fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: '10px 0' }}>✕ Tout effacer</button>}
          </div>
        )}

        {!r.loading && r.annonces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: '#6b7280' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🗂️</div>
            <p style={{ fontSize: 16, margin: '0 0 12px' }}>Aucune annonce ne correspond.</p>
            {filtresActifs(f) && <button onClick={() => { setF(FILTRES_VIDES); setSaisie(''); setLieuSaisie(''); }} style={{ padding: '9px 18px', background: cp, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Voir toutes les annonces</button>}
          </div>
        ) : (
          <div className="ann-grid">{r.annonces.map((a) => <Carte key={a.id} a={a} couleur={cp} police={police2} profil={profil} onClick={() => setOuverte(a)} />)}</div>
        )}

        {r.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, padding: '8px 16px', fontWeight: 700, cursor: f.page <= 1 ? 'default' : 'pointer', opacity: f.page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Page {f.page} / {r.pages}</span>
            <button disabled={f.page >= r.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, padding: '8px 16px', fontWeight: 700, cursor: f.page >= r.pages ? 'default' : 'pointer', opacity: f.page >= r.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #e7e2d8', background: '#fff', padding: '26px 18px', textAlign: 'center' }}>
        {cfg.apropos && <p style={{ maxWidth: 640, margin: '0 auto 12px', fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>{cfg.apropos}</p>}
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 4px' }}>{cfg.email && <a href={`mailto:${cfg.email}`} style={{ color: cp }}>{cfg.email}</a>}{cfg.email && cfg.telephone ? ' · ' : ''}{cfg.telephone}</p>
        <p style={{ fontSize: 11, color: '#9ca3af', maxWidth: 560, margin: '10px auto 0', lineHeight: 1.6 }}>{profil.avis}</p>
      </footer>

      {ouverte && <Detail a={ouverte} gid={gid} demo={r.demo} cfg={cfg} police={police2} profil={profil} onClose={() => setOuverte(null)} />}
    </div>
  );
}