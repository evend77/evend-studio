// src/templates/TemplateAnnoncesAutoLease.tsx
// e-Vend Studio — Petites annonces « Auto Leasing » (location / vente de véhicules) — affichage seulement, aucune transaction.
// Thème sombre, accent rouge, titres condensés en majuscules. Sections réordonnables / masquables, textes, photos et couleurs
// configurables dans Mes annonces → Apparence (config.annonces). Les véhicules viennent de « Mes annonces ».
// Pied de page, politiques et formulaire de contact : mêmes que les autres templates (voir annoncesSite/pied.tsx et contactSite.tsx).

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAnnonces, fmtPrix, nbDe, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { PROFIL_AUTO } from './TemplateAnnoncesAutoClassique';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/leaseConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

const POLICES = {
  condensee: { titre: "'Teko', 'Oswald', sans-serif",  corps: "'Noto Sans', 'Open Sans', sans-serif", poids: 600, interlettre: '.01em' },
  oswald:    { titre: "'Oswald', sans-serif",          corps: "'Open Sans', sans-serif",              poids: 600, interlettre: '.01em' },
  moderne:   { titre: "'Inter', sans-serif",           corps: "'Inter', sans-serif",                  poids: 800, interlettre: '0' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

type Th = { ac: string; fond: string; carte: string; tx: string; titre: string; corps: string; poids: number; il: string };
const doux = 'rgba(255,255,255,.66)';

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}

function EnTete({ c, t, centre = true }: { c: Record<string, any>; t: Th; centre?: boolean }) {
  if (!c.surtitre && !c.titre && !c.texte) return null;
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: 44 }}>
      {c.surtitre && <p style={{ fontFamily: t.titre, fontSize: 18, fontWeight: 600, letterSpacing: '.12em', color: t.tx, margin: '0 0 14px', textTransform: 'uppercase' }}>{c.surtitre}</p>}
      {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(38px,6vw,68px)', fontWeight: t.poids, lineHeight: 1.02, color: t.tx, margin: 0, textTransform: 'uppercase', letterSpacing: t.il }}>{c.titre}</h2>}
      {c.texte && <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.6, color: doux, maxWidth: 820, margin: centre ? '24px auto 0' : '24px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
    </div>
  );
}

// Carrousel horizontal : défilement par ppas avec flèches, glissement tactile, aucun défilement de page
function Carrousel({ children, t, un = false }: { children: React.ReactNode; t: Th; un?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pas = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.9, behavior: 'smooth' }); };
  const fl = (cote: 'g' | 'd'): React.CSSProperties => ({ position: 'absolute', top: '50%', [cote === 'g' ? 'left' : 'right']: -6, transform: 'translateY(-50%)', background: 'none', border: 'none', color: t.ac, fontSize: 34, cursor: 'pointer', padding: 8, lineHeight: 1, zIndex: 2 });
  const n = Array.isArray(children) ? children.length : 1;
  return (
    <div style={{ position: 'relative', padding: '0 34px' }}>
      <div ref={ref} className={un ? 'fl-car fl-un' : 'fl-car'}>{children}</div>
      {n > 1 && <><button aria-label="Précédent" style={fl('g')} onClick={() => pas(-1)}>‹</button><button aria-label="Suivant" style={fl('d')} onClick={() => pas(1)}>›</button></>}
    </div>
  );
}

function Vehicules({ c, gid, t, suffixe }: { c: Record<string, any>; gid: number; t: Th; suffixe: string }) {
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const r = useAnnonces(gid, PROFIL_AUTO.demo, f, []);
  const set = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const champ: React.CSSProperties = { padding: '12px 14px', border: '1.5px solid rgba(255,255,255,.18)', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  return (
    <div>
      <EnTete c={c} t={t} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 auto 18px', maxWidth: 760 }}>
        <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Marque, modèle…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && set({ q: q.trim() })} maxLength={80} />
        <button onClick={() => set({ q: q.trim() })} style={{ background: t.ac, color: '#fff', border: 'none', padding: '0 26px', fontFamily: t.titre, fontSize: 20, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>Chercher</button>
        <select value={f.tri} onChange={(e) => set({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récents</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
      </div>
      {r.categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 26 }}>
          {[{ nom: '', n: r.categories.reduce((s, x) => s + x.n, 0) }, ...r.categories].map((x) => (
            <button key={x.nom || 'toutes'} onClick={() => set({ categorie: x.nom })} style={{ padding: '7px 16px', border: `1.5px solid ${f.categorie === x.nom ? t.ac : 'rgba(255,255,255,.2)'}`, background: f.categorie === x.nom ? t.ac : 'transparent', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{x.nom || 'Tous'} ({x.n})</button>
          ))}
        </div>
      )}
      {r.demo && <div style={{ background: 'rgba(252,211,77,.12)', border: '1px solid #fcd34d', padding: '10px 14px', color: '#fde68a', fontSize: 13, marginBottom: 18, textAlign: 'center' }}>Aperçu avec des véhicules d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
      {!r.loading && r.annonces.length === 0
        ? <p style={{ textAlign: 'center', color: doux, padding: '30px 0' }}>{c.vide || 'Aucun véhicule ne correspond.'}</p>
        : (
          <Carrousel t={t}>
            {r.annonces.map((a) => {
              const d = a.details || {};
              const km = Number.isFinite(nbDe(d['Kilométrage'])) ? `${nbDe(d['Kilométrage']).toLocaleString('fr-CA')} km` : '';
              const ligne = [d['Année'], km, d['Transmission']].filter(Boolean).join(' · ');
              return (
                <article key={a.id} className="fl-carte" style={{ textAlign: 'center' }}>
                  <div onClick={() => setOuverte(a)} style={{ aspectRatio: '16/10', background: t.carte, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                    {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🚗</div>}
                    {a.vedette && <span style={{ position: 'absolute', top: 10, left: 10, background: t.ac, color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 9px' }}>⭐ VEDETTE</span>}
                  </div>
                  <h3 onClick={() => setOuverte(a)} style={{ fontFamily: t.titre, fontSize: 30, fontWeight: t.poids, textTransform: 'uppercase', color: t.tx, margin: '18px 0 8px', lineHeight: 1.1, cursor: 'pointer' }}>{a.titre}</h3>
                  <p style={{ fontFamily: t.corps, fontSize: 15, fontWeight: 700, color: t.ac, margin: '0 0 12px', textTransform: 'uppercase' }}>{fmtPrix(a)}{a.prix != null && suffixe ? ` ${suffixe}` : ''}</p>
                  {ligne && <p style={{ fontSize: 15, color: doux, margin: '0 0 14px' }}>{ligne}</p>}
                  <button onClick={() => setOuverte(a)} style={{ background: 'none', border: 'none', color: t.tx, fontFamily: t.titre, fontSize: 19, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', padding: 4 }}>{c.btnTexte || 'En savoir plus'}</button>
                </article>
              );
            })}
          </Carrousel>
        )}
      {r.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
          <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
          <span style={{ fontSize: 14, color: doux }}>Page {f.page} / {r.pages}</span>
          <button disabled={f.page >= r.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= r.pages ? .4 : 1 }}>Suivant →</button>
        </div>
      )}
      {ouverte && <Detail a={ouverte} gid={gid} demo={r.demo} cfg={{ nomSite: '', slogan: '', logoUrl: '', couleurPrincipale: t.ac, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_AUTO} onClose={() => setOuverte(null)} />}
    </div>
  );
}

export default function TemplateAnnoncesAutoLease({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const t: Th = { ac: cfg.couleurPrincipale, fond: cfg.couleurFond, carte: cfg.couleurCarte, tx: cfg.couleurTexte, titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre };
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);
  const visibles = cfg.sections.filter((x) => x.visible);
  const nav = visibles.filter((x) => x.label || SECTIONS_INFO[x.id].navDefaut);
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(56px,8vw,110px) 0' };
  const bouton = (plein: boolean): React.CSSProperties => ({ padding: '20px 40px', fontFamily: t.titre, fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.01em', background: plein ? t.ac : 'transparent', color: '#fff', border: `2px solid ${t.ac}`, borderRadius: 0, lineHeight: 1 });
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };
  const lienTexte = (l: React.CSSProperties = {}): React.CSSProperties => ({ background: 'none', border: 'none', padding: 4, color: t.tx, fontFamily: t.titre, fontSize: 19, fontWeight: 600, textTransform: 'uppercase', ...l });

  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    const items: any[] = Array.isArray(c.items) ? c.items : [];
    switch (id) {
      case 'hero': return (
        <section style={{ position: 'relative', minHeight: 'min(86vh, 760px)', display: 'flex', alignItems: 'center', background: t.carte, overflow: 'hidden' }}>
          {c.image && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${c.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,11,.82), rgba(10,10,11,.45))' }} />
          <div style={{ ...wrap, position: 'relative', padding: '90px 24px' }}>
            <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(48px,9vw,112px)', fontWeight: t.poids, lineHeight: .98, color: '#fff', margin: 0, textTransform: 'uppercase', maxWidth: 1000, letterSpacing: t.il }}>{c.titre}</h1>
            {c.texte && <p style={{ fontSize: 'clamp(18px,2vw,22px)', fontWeight: 700, color: 'rgba(255,255,255,.78)', margin: '28px 0 38px', maxWidth: 640, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: c.texte ? 0 : 34 }}>
              {c.btn1Texte && <Lien v={c.btn1Lien} style={bouton(true)}>{c.btn1Texte}</Lien>}
              {c.btn2Texte && <Lien v={c.btn2Lien} style={bouton(false)}>{c.btn2Texte}</Lien>}
            </div>
          </div>
        </section>
      );
      case 'atouts': return items.length ? (
        <section style={{ ...sec, padding: 'clamp(40px,6vw,80px) 0' }}><div style={wrap}>
          <Carrousel t={t}>{items.map((it, i) => (
            <div key={i} className="fl-carte" style={{ background: t.carte, padding: '34px 30px', height: '100%', boxSizing: 'border-box' }}>
              {it.icone && <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 20 }}>{it.icone}</div>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 30, fontWeight: t.poids, textTransform: 'uppercase', color: t.tx, margin: 0, lineHeight: 1.1 }}>{it.titre}</h3>}
              <div style={{ width: 44, height: 3, background: t.ac, margin: '16px 0' }} />
              {it.texte && <p style={{ fontSize: 17, lineHeight: 1.65, color: doux, margin: 0, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
            </div>))}</Carrousel>
        </div></section>
      ) : null;
      case 'types': return items.length ? (
        <section style={{ ...sec, padding: 'clamp(30px,5vw,60px) 0' }}><div style={wrap}>
          {items.map((it, i) => (
            <div key={i} className="fl-type" style={{ display: 'grid', gridTemplateColumns: it.image ? '1fr 1fr' : '1fr', marginBottom: i < items.length - 1 ? 30 : 0, direction: i % 2 ? 'rtl' : 'ltr' }}>
              {it.image && <div style={{ minHeight: 320, backgroundImage: `url("${it.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div style={{ background: '#fff', padding: 'clamp(28px,5vw,64px)', direction: 'ltr', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {it.surtitre && <p style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase' }}>{it.surtitre}</p>}
                {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 'clamp(40px,5vw,60px)', fontWeight: t.poids, textTransform: 'uppercase', color: t.ac, margin: '0 0 18px', lineHeight: 1 }}>{it.titre}</h3>}
                {it.texte && <p style={{ fontSize: 17, lineHeight: 1.7, color: '#4b5563', margin: '0 0 28px', whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
                {it.btnTexte && <div><Lien v={it.btnLien} style={{ ...bouton(true), border: 'none', padding: '20px 36px', fontSize: 20 }}>{it.btnTexte}</Lien></div>}
              </div>
            </div>))}
        </div></section>
      ) : null;
      case 'vehicules': return <section style={sec}><div style={wrap}><Vehicules c={c} gid={gid} t={t} suffixe={c.suffixePrix} /></div></section>;
      case 'offres': return (c.titre || items.length) ? (
        <section style={sec}><div style={wrap} className="fl-offres">
          <div>
            {c.surtitre && <p style={{ fontFamily: t.titre, fontSize: 18, fontWeight: 600, letterSpacing: '.12em', margin: '0 0 14px', textTransform: 'uppercase' }}>{c.surtitre}</p>}
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(44px,6vw,72px)', fontWeight: t.poids, lineHeight: 1.02, margin: 0, textTransform: 'uppercase' }}>{c.titre}</h2>}
            {c.texte && <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.6, color: doux, margin: '22px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          </div>
          <div className="fl-offres-cartes">
            {items.map((it, i) => (
              <div key={i} style={{ position: 'relative', minHeight: 440, background: t.carte, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                {it.image && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${it.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(1)', opacity: .55 }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(18,18,19,.1), rgba(18,18,19,.92) 75%)' }} />
                <div style={{ position: 'relative', padding: 30, width: '100%' }}>
                  {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 30, fontWeight: t.poids, textTransform: 'uppercase', color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>{it.titre}</h3>}
                  {it.prix && <p style={{ fontSize: 14, fontWeight: 700, color: t.ac, margin: '0 0 20px', textTransform: 'uppercase' }}>{it.prix}</p>}
                  {it.btnTexte && <Lien v={it.btnLien} style={lienTexte()}>{it.btnTexte}</Lien>}
                </div>
              </div>))}
          </div>
        </div></section>
      ) : null;
      case 'apropos': return (c.titre || c.texte || c.image) ? (
        <section className="fl-apropos" style={{ display: 'grid', gridTemplateColumns: c.image ? '1fr 1fr' : '1fr', background: t.fond }}>
          {c.image && <div style={{ background: t.ac, position: 'relative', minHeight: 420 }}><div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${c.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(1) contrast(1.15)', mixBlendMode: 'multiply' }} /></div>}
          <div style={{ padding: 'clamp(40px,7vw,110px) clamp(24px,6vw,90px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {c.surtitre && <p style={{ fontFamily: t.titre, fontSize: 18, fontWeight: 600, letterSpacing: '.12em', margin: '0 0 16px', textTransform: 'uppercase' }}>{c.surtitre}</p>}
            {(c.titre || c.titreAccent) && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(40px,5.5vw,70px)', fontWeight: t.poids, lineHeight: 1.02, margin: '0 0 26px', textTransform: 'uppercase' }}>{c.titre}{c.titre && c.titreAccent ? ' ' : ''}<span style={{ color: t.ac }}>{c.titreAccent}</span></h2>}
            {c.texteGras && <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', margin: '0 0 22px' }}>{c.texteGras}</p>}
            {c.texte && <p style={{ fontSize: 17, lineHeight: 1.7, color: doux, margin: '0 0 32px', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {c.btn1Texte && <Lien v={c.btn1Lien} style={{ ...bouton(true), padding: '18px 28px', fontSize: 19 }}>{c.btn1Texte}</Lien>}
              {c.btn2Texte && <Lien v={c.btn2Lien} style={{ ...bouton(false), padding: '18px 28px', fontSize: 19 }}>{c.btn2Texte}</Lien>}
            </div>
          </div>
        </section>
      ) : null;
      case 'guide': return (items.length || c.titre) ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="fl-grille">{items.map((it, i) => (
            <div key={i} style={{ background: t.carte, padding: '34px 30px' }}>
              {it.icone && <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 22 }}>{it.icone}</div>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 30, fontWeight: t.poids, textTransform: 'uppercase', color: t.tx, margin: '0 0 14px', lineHeight: 1.1 }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: 17, lineHeight: 1.65, color: doux, margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
              {it.btnTexte && <Lien v={it.btnLien} style={lienTexte({ padding: 0, fontSize: 18 })}>{it.btnTexte}</Lien>}
            </div>))}</div>
        </div></section>
      ) : null;
      case 'temoignages': return items.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel t={t} un>{items.map((it, i) => (
            <div key={i} className="fl-carte" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: `5px solid ${t.ac}`, margin: '0 auto 22px', overflow: 'hidden', background: t.carte, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                {it.photo ? <img src={it.photo} alt={it.nom} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              {it.nom && <h3 style={{ fontFamily: t.titre, fontSize: 34, fontWeight: t.poids, textTransform: 'uppercase', margin: '0 0 6px' }}>{it.nom}</h3>}
              {it.role && <p style={{ fontSize: 14, fontWeight: 700, color: t.ac, margin: '0 0 20px', textTransform: 'uppercase' }}>{it.role}</p>}
              {it.texte && <p style={{ fontSize: 18, lineHeight: 1.7, color: doux, margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>« {it.texte} »</p>}
              {it.date && <p style={{ fontSize: 14, fontWeight: 700, color: t.ac, margin: 0, textTransform: 'uppercase' }}>{it.date}</p>}
            </div>))}</Carrousel>
        </div></section>
      ) : null;
      case 'actualites': return items.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="fl-grille">{items.map((it, i) => (
            <article key={i} style={{ background: t.carte }}>
              {it.image && <div style={{ aspectRatio: '16/10', backgroundImage: `url("${it.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div style={{ padding: '24px 26px 28px' }}>
                {it.date && <p style={{ fontSize: 13, fontWeight: 700, color: t.ac, margin: '0 0 10px', textTransform: 'uppercase' }}>{it.date}</p>}
                {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 28, fontWeight: t.poids, textTransform: 'uppercase', color: t.tx, margin: '0 0 12px', lineHeight: 1.1 }}>{it.titre}</h3>}
                {it.texte && <p style={{ fontSize: 16, lineHeight: 1.6, color: doux, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
                {it.btnTexte && <Lien v={it.btnLien} style={lienTexte({ padding: 0, fontSize: 18 })}>{it.btnTexte}</Lien>}
              </div>
            </article>))}</div>
        </div></section>
      ) : null;
      case 'contact': return (
        <section style={sec}><div style={{ ...wrap, maxWidth: 940 }}>
          <EnTete c={c} t={t} />
          <div className="fl-contact">
            <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
              {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: t.tx, textDecoration: 'none', fontSize: 20, fontWeight: 700 }}><span style={{ color: t.ac }}>📞</span> {cfg.telephone}</a>}
              {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: t.tx, textDecoration: 'none', fontSize: 20, fontWeight: 700, overflowWrap: 'anywhere' }}><span style={{ color: t.ac }}>✉️</span> {cfg.courriel}</a>}
              {cfg.adresse && <p style={{ margin: 0, fontSize: 18, color: doux }}><span style={{ color: t.ac }}>📍</span> {cfg.adresse}</p>}
            </div>
            <div style={{ background: '#fff', padding: 26, color: '#1f2937' }}><FormulaireSite gid={gid} couleur={t.ac} police={t.corps} /></div>
          </div>
        </div></section>
      );
    }
  };

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minWidth: 0 }} onClick={() => { if (politiques.statut !== 'ferme') politiques.fermer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      {cfg.logoUrl
        ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 44, objectFit: 'contain' }} />
        : <div style={{ width: 38, height: 38, borderRadius: '50%', border: `4px solid ${t.ac}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ width: 9, height: 9, borderRadius: '50%', background: t.ac }} /></div>}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: t.titre, fontSize: 28, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase', color: t.tx, whiteSpace: 'nowrap' }}>{cfg.nomSite}<span style={{ color: t.ac }}>{cfg.nomAccent}</span></div>
        {cfg.slogan && <div style={{ fontSize: 11, letterSpacing: '.08em', color: doux, marginTop: 2, whiteSpace: 'nowrap' }}>{cfg.slogan}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Oswald:wght@500;600;700&family=Noto+Sans:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Inter:wght@400;600;700;800&display=swap" />
      <style>{`.fl-car{display:flex;gap:30px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}.fl-car::-webkit-scrollbar{display:none}
        .fl-car>*{flex:0 0 calc((100% - 60px)/3);scroll-snap-align:start;min-width:0}.fl-car.fl-un>*{flex:0 0 100%}
        .fl-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px}
        .fl-offres{display:grid;grid-template-columns:minmax(220px,.8fr) 2fr;gap:50px;align-items:center}.fl-offres-cartes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px}
        .fl-contact{display:grid;grid-template-columns:1fr 1.2fr;gap:44px}
        .fl-nav{display:flex;gap:30px;align-items:center}.fl-burger{display:none}
        @media(max-width:980px){.fl-car>*{flex:0 0 calc((100% - 30px)/2)}.fl-grille{grid-template-columns:repeat(2,minmax(0,1fr))}.fl-offres{grid-template-columns:1fr}.fl-nav{display:none}.fl-burger{display:block}}
        @media(max-width:680px){.fl-car{gap:20px}.fl-car>*{flex:0 0 100%}.fl-grille,.fl-offres-cartes,.fl-contact{grid-template-columns:1fr}.fl-type,.fl-apropos{grid-template-columns:1fr !important;direction:ltr !important}}
        *{box-sizing:border-box}img{display:block;max-width:100%}`}</style>

      <header style={{ background: 'rgba(18,18,19,.94)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,.08)', backdropFilter: 'blur(6px)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 78, gap: 16 }}>
          {logo}
          <nav className="fl-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="fl-nav" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 28, height: 28, border: `1.5px solid ${t.ac}`, color: t.ac, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="fl-burger" aria-label="Menu" onClick={() => setMenu((v) => !v)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.25)', color: t.tx, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {menu && <div className="fl-burger" style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '8px 24px 14px' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: t.tx, padding: '12px 0', fontSize: 14, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={t.ac} police={t.corps} /></div>
        : visibles.map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 80 }}>{el}</div> : null; })}

      <Pied nom={`${cfg.nomSite}${cfg.nomAccent}`} fond={t.carte} texteLibre={cfg.piedTexte} avis="Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur." reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />
    </div>
  );
}