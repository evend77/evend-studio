// src/templates/TemplateAnnoncesAutoShowroom.tsx
// e-Vend Studio — Petites annonces « Auto Showroom » : site vitrine complet pour concessionnaire / revendeur de véhicules.
// Affichage seulement (aucune transaction). Les véhicules viennent de « Mes annonces » ; tout le reste est configurable
// (couleurs, photos, textes, sections à afficher / masquer / réordonner) et contrôlé avant affichage (autoShowroomConfig.ts).

import { useState, useEffect, useMemo } from 'react';
import { useAnnonces, fmtPrix, nbDe, FILTRES_VIDES, filtresActifs, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail } from './annoncesSite/SiteClassique';
import { PROFIL_AUTO } from './TemplateAnnoncesAutoClassique';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, lien as lienOk, telHref, type ConfigShowroom, type SectionId } from './annoncesSite/autoShowroomConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

const POLICES = {
  arrondie:  { titre: "'Nunito', sans-serif",            corps: "'Lato', sans-serif" },
  moderne:   { titre: "'Inter', sans-serif",             corps: "'Inter', sans-serif" },
  classique: { titre: "'Source Serif 4', Georgia, serif", corps: "'Inter', sans-serif" },
};

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, border: style.border || 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerA(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}
function allerA(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function EnTete({ c, s, centre = true, clair = false }: { c: Record<string, any>; s: { cp: string; sombre: string; titre: string }; centre?: boolean; clair?: boolean }) {
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: 36 }}>
      {c.surtitre && <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: clair ? 'rgba(255,255,255,.6)' : '#8a8f98', margin: '0 0 12px', textTransform: 'uppercase' }}>{c.surtitre}</p>}
      {c.titre && <h2 style={{ fontFamily: s.titre, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.15, color: clair ? '#fff' : s.sombre, margin: 0 }}>{c.titre}</h2>}
      <div style={{ width: 54, height: 3, background: s.cp, margin: centre ? '18px auto' : '18px 0', borderRadius: 2 }} />
      {c.texte && <p style={{ fontSize: 17, lineHeight: 1.7, color: clair ? 'rgba(255,255,255,.85)' : '#5f6670', maxWidth: 700, margin: centre ? '0 auto' : 0, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
    </div>
  );
}

function Compte({ fin, cp }: { fin: string; cp: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = new Date(fin.replace(' ', 'T')).getTime() - now;
  if (!fin || Number.isNaN(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const blocs: [number, string][] = [[Math.floor(s / 86400), 'Jours'], [Math.floor(s % 86400 / 3600), 'Heures'], [Math.floor(s % 3600 / 60), 'Minutes'], [s % 60, 'Secondes']];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 0, margin: '28px 0', flexWrap: 'wrap' }}>
      {blocs.map(([n, l], i) => <div key={l} style={{ minWidth: 100, padding: '4px 18px', borderLeft: i ? '1px solid rgba(255,255,255,.35)' : 'none', textAlign: 'center' }}><div style={{ fontSize: 'clamp(32px,6vw,48px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{String(n).padStart(2, '0')}</div><div style={{ fontSize: 15, color: 'rgba(255,255,255,.8)' }}>{l}</div></div>)}
    </div>
  );
}

function CarteVehicule({ a, s, onClick }: { a: AnnoncePub; s: { cp: string; ca: string; sombre: string; titre: string }; onClick: () => void }) {
  const d = a.details || {};
  const km = Number.isFinite(nbDe(d['Kilométrage'])) ? `${nbDe(d['Kilométrage']).toLocaleString('fr-CA')} km` : '';
  const lignes = [d['Année'], km, d['Transmission'], d['Carburant']].filter(Boolean) as string[];
  return (
    <article style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 14px rgba(0,0,0,.06)', transition: 'transform .2s, box-shadow .2s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 34px rgba(0,0,0,.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(0,0,0,.06)'; }}>
      <div onClick={onClick} style={{ position: 'relative', aspectRatio: '16/10', background: '#eceff3', cursor: 'pointer' }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🚗</div>}
        {a.vedette && <span style={{ position: 'absolute', top: 12, left: 12, background: s.cp, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>⭐ VEDETTE</span>}
      </div>
      <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#9aa0a8', textTransform: 'uppercase' }}>{a.categorie || 'Véhicule'}</span>
        <h3 onClick={onClick} style={{ fontFamily: s.titre, fontSize: 20, fontWeight: 800, color: s.sombre, margin: '6px 0 12px', lineHeight: 1.25, cursor: 'pointer' }}>{a.titre}</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'grid', gap: 8 }}>
          {lignes.map((t) => <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#5f6670', fontWeight: 600 }}><span style={{ width: 20, height: 20, borderRadius: '50%', background: s.ca, color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>{t}</li>)}
        </ul>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: s.cp }}>{fmtPrix(a)}</span>
          <button onClick={onClick} style={{ background: s.ca, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Voir les détails</button>
        </div>
        {a.lieu && <p style={{ fontSize: 12, color: '#9aa0a8', margin: '10px 0 0' }}>📍 {a.lieu}</p>}
      </div>
    </article>
  );
}

function Vehicules({ cfg, gid, s }: { cfg: ConfigShowroom; gid: number; s: { cp: string; ca: string; sombre: string; titre: string; corps: string } }) {
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const [panneau, setPanneau] = useState(false);
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const r = useAnnonces(gid, PROFIL_AUTO.demo, f, PROFIL_AUTO.selects.map((x) => x.cle));
  const set = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const champ: React.CSSProperties = { padding: '11px 14px', border: '1px solid #dde1e6', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', background: '#fff', color: '#2f3033', boxSizing: 'border-box', minWidth: 0 };
  const mini: React.CSSProperties = { ...champ, width: '100%', padding: '9px 10px', fontSize: 14 };
  const c = cfg.contenu.vehicules;
  return (
    <div>
      <EnTete c={c} s={s} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input style={{ ...champ, flex: '1 1 220px' }} placeholder="Marque, modèle…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && set({ q: q.trim() })} maxLength={80} />
        <button onClick={() => set({ q: q.trim() })} style={{ background: s.ca, color: '#fff', border: 'none', borderRadius: 10, padding: '0 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>🔍 Chercher</button>
        <button onClick={() => setPanneau((v) => !v)} style={{ ...champ, fontWeight: 700, cursor: 'pointer' }}>⚙️ Filtres {panneau ? '▲' : '▼'}</button>
        <select value={f.tri} onChange={(e) => set({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récents</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
      </div>
      {r.categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
          {[{ nom: '', n: r.categories.reduce((t, x) => t + x.n, 0) }, ...r.categories].map((x) => (
            <button key={x.nom || 'toutes'} onClick={() => set({ categorie: x.nom })} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 30, border: `1.5px solid ${f.categorie === x.nom ? s.ca : '#dde1e6'}`, background: f.categorie === x.nom ? s.ca : '#fff', color: f.categorie === x.nom ? '#fff' : '#4b5563', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{x.nom || 'Tous'} ({x.n})</button>
          ))}
        </div>
      )}
      {panneau && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          {PROFIL_AUTO.selects.map((x) => (
            <label key={x.cle} style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{x.label}
              <select style={{ ...mini, marginTop: 4 }} value={(f.d || {})[x.cle] || ''} onChange={(e) => set({ d: { ...(f.d || {}), [x.cle]: e.target.value } })}><option value="">Tous</option>{(r.facettes[x.cle] || []).map((o) => <option key={o.nom} value={o.nom}>{o.nom} ({o.n})</option>)}</select>
            </label>
          ))}
          <div><span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>Année</span><div style={{ display: 'flex', gap: 6 }}><input style={mini} type="number" min={0} placeholder="Min" value={(f.dmin || {})['Année'] || ''} onChange={(e) => set({ dmin: { ...(f.dmin || {}), Année: e.target.value } })} /><input style={mini} type="number" min={0} placeholder="Max" value={(f.dmax || {})['Année'] || ''} onChange={(e) => set({ dmax: { ...(f.dmax || {}), Année: e.target.value } })} /></div></div>
          <div><span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>Kilométrage max (km)</span><input style={mini} type="number" min={0} placeholder="Max" value={(f.dmax || {})['Kilométrage'] || ''} onChange={(e) => set({ dmax: { ...(f.dmax || {}), Kilométrage: e.target.value } })} /></div>
          <div><span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>Prix ($)</span><div style={{ display: 'flex', gap: 6 }}><input style={mini} type="number" min={0} placeholder="Min" value={f.prixMin} onChange={(e) => set({ prixMin: e.target.value })} /><input style={mini} type="number" min={0} placeholder="Max" value={f.prixMax} onChange={(e) => set({ prixMax: e.target.value })} /></div></div>
          {filtresActifs(f) && <button onClick={() => { setF(FILTRES_VIDES); setQ(''); }} style={{ background: 'none', border: 'none', color: s.ca, fontWeight: 800, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>✕ Tout effacer</button>}
        </div>
      )}
      {r.demo && <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', color: '#92400e', fontSize: 13, marginBottom: 16 }}>Aperçu avec des véhicules d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 14px' }}>{r.loading ? 'Chargement…' : `${r.total} véhicule${r.total !== 1 ? 's' : ''}`}</p>
      {!r.loading && r.annonces.length === 0
        ? <div style={{ textAlign: 'center', padding: '50px 16px', color: '#6b7280' }}><div style={{ fontSize: 44 }}>🚗</div><p>Aucun véhicule ne correspond.</p></div>
        : <div className="asr-grid">{r.annonces.map((a) => <CarteVehicule key={a.id} a={a} s={s} onClick={() => setOuverte(a)} />)}</div>}
      {r.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
          <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
          <span style={{ fontSize: 14, color: '#6b7280' }}>Page {f.page} / {r.pages}</span>
          <button disabled={f.page >= r.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= r.pages ? .4 : 1 }}>Suivant →</button>
        </div>
      )}
      {ouverte && <Detail a={ouverte} gid={gid} demo={r.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: s.cp, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={s.corps} profil={PROFIL_AUTO} onClose={() => setOuverte(null)} />}
    </div>
  );
}

export default function TemplateAnnoncesAutoShowroom({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pol = POLICES[cfg.police];
  const s = { cp: cfg.couleurPrincipale, ca: cfg.couleurAccent, sombre: cfg.couleurSombre, fond: cfg.couleurFond, titre: pol.titre, corps: pol.corps };
  const [menu, setMenu] = useState(false);
  const [avis, setAvis] = useState(0);
  const [faqOuverte, setFaqOuverte] = useState<number | null>(null);
  const visibles = cfg.sections.filter((x) => x.visible);
  const nav = visibles.filter((x) => x.id !== 'promo');
  const grad = `linear-gradient(135deg, ${s.cp}, ${s.cp}dd 60%, ${s.cp}bb)`;
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 20px' };
  const bouton = (plein: boolean): React.CSSProperties => ({ padding: '14px 26px', borderRadius: 10, fontWeight: 800, fontSize: 15, background: plein ? s.ca : 'transparent', color: plein ? '#fff' : s.ca, border: plein ? 'none' : `2px solid ${s.ca}` });
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };

  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'hero': return (
        <section style={{ background: s.fond, padding: 'clamp(40px,7vw,90px) 0', overflow: 'hidden' }}>
          <div style={{ ...wrap }} className="asr-2col">
            <div>
              {c.surtitre && <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#5f6670', margin: '0 0 14px' }}>{c.surtitre}</p>}
              <h1 style={{ fontFamily: s.titre, fontSize: 'clamp(32px, 5.5vw, 58px)', fontWeight: 800, lineHeight: 1.1, color: s.sombre, margin: 0 }}>{c.titre}</h1>
              <div style={{ width: 54, height: 3, background: s.cp, margin: '24px 0' }} />
              {c.texte && <p style={{ fontSize: 19, lineHeight: 1.65, color: '#5f6670', margin: '0 0 28px', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {c.btn1Texte && <Lien v={c.btn1Lien} style={bouton(true)}>{c.btn1Texte}</Lien>}
                {c.btn2Texte && <Lien v={c.btn2Lien} style={bouton(false)}>{c.btn2Texte}</Lien>}
              </div>
            </div>
            <div style={{ position: 'relative', padding: '0 0 22px 22px' }}>
              <div style={{ position: 'absolute', inset: '22px 0 0 0', borderRadius: 28, background: grad, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
                <div style={{ position: 'absolute', bottom: -80, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.10)' }} />
              </div>
              <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', aspectRatio: '4/3', background: '#e5e7eb', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
                {c.image ? <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🚗</div>}
              </div>
            </div>
          </div>
        </section>
      );
      case 'etapes': return (
        <section style={{ background: '#fff', padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap}>
          <EnTete c={c} s={s} />
          <div className="asr-etapes">
            {(c.items as any[]).map((it, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 16, background: grad, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>{it.icone || '⭐'}
                  <span style={{ position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: s.ca, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{i + 1}</span></div>
                <h3 style={{ fontFamily: s.titre, fontSize: 21, fontWeight: 800, color: s.sombre, margin: '0 0 8px' }}>{it.titre}</h3>
                <div style={{ width: 36, height: 2, background: '#e5e7eb', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, lineHeight: 1.65, color: '#5f6670', margin: 0, whiteSpace: 'pre-wrap' }}>{it.texte}</p>
              </div>
            ))}
          </div>
        </div></section>
      );
      case 'apropos': return (
        <section style={{ background: s.fond, padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap} className="asr-2col">
          <div style={{ position: 'relative', paddingRight: 18, paddingBottom: 18 }}>
            <div style={{ position: 'absolute', inset: '18px 0 0 18px', borderRadius: 24, background: grad }} />
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: '#e5e7eb' }}>
              {c.image ? <img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>🏢</div>}
            </div>
          </div>
          <div>
            <EnTete c={c} s={s} centre={false} />
            {(c.points as string[]).length > 0 && <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>{(c.points as string[]).map((p, i) => <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16, fontWeight: 700, color: s.sombre }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: s.ca, color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>{p}</li>)}</ul>}
            {c.btnTexte && <Lien v={c.btnLien} style={bouton(true)}>{c.btnTexte}</Lien>}
          </div>
        </div></section>
      );
      case 'vehicules': return (<section style={{ background: s.fond, padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap}><Vehicules cfg={cfg} gid={gid} s={s} /></div></section>);
      case 'avantages': return (
        <section style={{ background: '#fff', padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap} className="asr-2col">
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', maxHeight: 520, background: grad, boxShadow: '0 20px 50px rgba(0,0,0,.18)' }}>
            {c.image ? <img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
          </div>
          <div>
            <EnTete c={c} s={s} centre={false} />
            <div style={{ display: 'grid', gap: 22 }}>
              {(c.items as any[]).map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: s.fond, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{it.icone || '⭐'}</div>
                  <div><h3 style={{ fontFamily: s.titre, fontSize: 20, fontWeight: 800, color: s.sombre, margin: '0 0 4px' }}>{it.titre}</h3><p style={{ fontSize: 15, lineHeight: 1.65, color: '#5f6670', margin: 0, whiteSpace: 'pre-wrap' }}>{it.texte}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div></section>
      );
      case 'offres': return (
        <section style={{ background: s.sombre, padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap}>
          <EnTete c={c} s={s} clair />
          <div className="asr-offres">
            {(c.items as any[]).map((it, i) => (
              <div key={i} style={{ position: 'relative', background: grad, borderRadius: 24, padding: '30px 30px 26px', color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: -50, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
                {it.etiquette && <span style={{ position: 'absolute', top: 16, right: 16, background: '#fff', color: s.cp, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{it.etiquette}</span>}
                <p style={{ position: 'relative', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{it.nom}</p>
                <p style={{ position: 'relative', fontFamily: s.titre, fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>{it.prix}</p>
                {it.texte && <p style={{ position: 'relative', fontSize: 15, margin: 0, opacity: .95, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
                <div style={{ width: 40, height: 2, background: '#fff', margin: '16px 0' }} />
                <div style={{ position: 'relative', display: 'grid', gap: 10, marginBottom: 20 }}>
                  {(it.lignes as string[]).map((l, j) => { const k = l.indexOf(':'); const [a, b] = k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : [l, '']; return <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}><strong>{a}</strong><span style={{ opacity: .9, textAlign: 'right' }}>{b}</span></div>; })}
                </div>
                {it.btnTexte && <div style={{ marginTop: 'auto', position: 'relative' }}><Lien v={it.btnLien} style={{ background: 'transparent', color: '#fff', fontWeight: 800, fontSize: 15, padding: 0 }}>{it.btnTexte} →</Lien></div>}
              </div>
            ))}
          </div>
        </div></section>
      );
      case 'temoignages': { const items = c.items as any[]; if (!items.length) return null; const t = items[Math.min(avis, items.length - 1)]; return (
        <section style={{ background: '#fff', padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap}>
          <EnTete c={c} s={s} />
          <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '0 46px', textAlign: 'center' }}>
            {items.length > 1 && <button aria-label="Précédent" onClick={() => setAvis((avis - 1 + items.length) % items.length)} style={{ position: 'absolute', left: 0, top: '40%', background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', color: s.sombre }}>‹</button>}
            <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', background: s.fond, margin: '0 auto 14px', border: '4px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{t.photo ? <img src={t.photo} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🙂'}</div>
            <p style={{ fontFamily: s.titre, fontSize: 20, fontWeight: 800, color: s.cp, margin: '0 0 12px' }}>{t.nom}</p>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: '#5f6670', fontStyle: 'italic', margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>« {t.texte} »</p>
            {t.date && <p style={{ fontSize: 14, fontWeight: 700, color: s.sombre, margin: 0 }}>{t.date}</p>}
            {items.length > 1 && <button aria-label="Suivant" onClick={() => setAvis((avis + 1) % items.length)} style={{ position: 'absolute', right: 0, top: '40%', background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', color: s.sombre }}>›</button>}
          </div>
        </div></section>
      ); }
      case 'promo': return (
        <section style={{ background: s.cp, padding: 'clamp(60px,8vw,110px) 0', clipPath: 'polygon(0 6%, 100% 0, 100% 94%, 0 100%)', margin: '-1px 0' }}><div style={{ ...wrap, textAlign: 'center' }}>
          <h2 style={{ fontFamily: s.titre, fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 800, color: '#fff', margin: '0 auto', maxWidth: 800, lineHeight: 1.15 }}>{c.titre}</h2>
          <Compte fin={c.dateFin} cp={s.cp} />
          {c.texte && <p style={{ color: '#fff', fontSize: 17, margin: '0 auto 22px', maxWidth: 700, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          {c.btnTexte && <Lien v={c.btnLien} style={{ background: '#fff', color: s.cp, padding: '14px 28px', borderRadius: 10, fontWeight: 800, fontSize: 15 }}>{c.btnTexte}</Lien>}
        </div></section>
      );
      case 'faq': { const items = c.items as any[]; return (
        <section style={{ background: '#fff', padding: 'clamp(50px,7vw,90px) 0' }}><div style={wrap}>
          <EnTete c={c} s={s} />
          <div className="asr-faq">
            {items.map((it, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <button aria-expanded={faqOuverte === i} onClick={() => setFaqOuverte(faqOuverte === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '20px 0', fontSize: 18, fontWeight: 700, color: s.sombre, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>{it.q}<span style={{ transform: faqOuverte === i ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }}>⌄</span></button>
                {faqOuverte === i && <p style={{ fontSize: 15, lineHeight: 1.7, color: '#5f6670', margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>{it.r}</p>}
              </div>
            ))}
          </div>
        </div></section>
      ); }
      case 'contact': return (
        <section style={{ background: s.fond, padding: 'clamp(50px,7vw,90px) 0', textAlign: 'center' }}><div style={wrap}>
          <h2 style={{ fontFamily: s.titre, fontSize: 'clamp(28px,5vw,50px)', fontWeight: 800, color: s.ca, margin: '0 auto', maxWidth: 800, lineHeight: 1.15 }}>{c.titre}</h2>
          {c.texte && <p style={{ fontSize: 18, color: '#5f6670', margin: '16px auto 26px', maxWidth: 640, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ ...bouton(true), textDecoration: 'none' }}>📞 {cfg.telephone}</a>}
            {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ ...bouton(false), textDecoration: 'none' }}>✉️ {cfg.courriel}</a>}
          </div>
          {cfg.adresse && <p style={{ fontSize: 15, color: '#5f6670', marginTop: 18 }}>📍 {cfg.adresse}</p>}
        </div></section>
      );
    }
  };

  return (
    <div style={{ background: '#fff', color: s.sombre, fontFamily: s.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Lato:wght@400;700&family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700;800&display=swap" />
      <style>{`.asr-2col{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,70px);align-items:center}
        .asr-etapes{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:34px}
        .asr-offres{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px}
        .asr-faq{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;align-items:start}
        .asr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
        .asr-nav{display:flex;gap:22px;align-items:center}.asr-burger{display:none}
        @media(max-width:860px){.asr-2col,.asr-faq{grid-template-columns:1fr}.asr-nav{display:none}.asr-burger{display:block}.asr-grid{grid-template-columns:1fr}}
        *{box-sizing:border-box}img{display:block;max-width:100%}`}</style>

      {(cfg.telephone || reseauxActifs.length > 0) && (
        <div style={{ background: s.fond, borderBottom: '1px solid #eceff3' }}><div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.ca }}>{cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: 'inherit', textDecoration: 'none' }}>Téléphone : <span style={{ color: s.sombre, fontWeight: 600 }}>{cfg.telephone}</span></a>}</span>
          <div style={{ display: 'flex', gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 24, height: 24, borderRadius: 6, background: s.ca, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k]}</a>)}</div>
        </div></div>
      )}

      <header style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 0 #eceff3' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 76, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 46, objectFit: 'contain' }} /> : <div style={{ width: 44, height: 44, borderRadius: 10, background: s.cp, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚗</div>}
            <span style={{ fontFamily: s.titre, fontSize: 24, fontWeight: 800, color: s.cp }}>{cfg.nomSite}</span>
          </div>
          <nav className="asr-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 700, color: s.sombre, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <button className="asr-burger" aria-label="Menu" onClick={() => setMenu((v) => !v)} style={{ background: 'none', border: '1px solid #dde1e6', borderRadius: 8, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
        </div>
        {menu && <div className="asr-burger" style={{ borderTop: '1px solid #eceff3', padding: '8px 20px 14px', background: '#fff' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: 16, fontWeight: 700, color: s.sombre, padding: '12px 0', borderBottom: '1px solid #f1f3f5', cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {visibles.map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 80 }}>{el}</div> : null; })}

      <footer style={{ background: s.sombre, color: 'rgba(255,255,255,.75)', padding: '26px 20px', textAlign: 'center', fontSize: 13 }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#fff' }}>{cfg.nomSite}</p>
        {cfg.piedTexte && <p style={{ margin: '0 0 6px' }}>{cfg.piedTexte}</p>}
        <p style={{ margin: '0 auto', maxWidth: 620, fontSize: 11, opacity: .7, lineHeight: 1.6 }}>Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur. Vérifiez le véhicule (historique, inspection) avant tout paiement.</p>
      </footer>
    </div>
  );
}