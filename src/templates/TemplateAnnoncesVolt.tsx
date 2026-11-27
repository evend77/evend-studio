// src/templates/TemplateAnnoncesVolt.tsx
// e-Vend Studio — Petites annonces « Volt » (généraliste, thème sombre à accent jaune) — affichage seulement, aucune transaction.
// Bandeau à compte à rebours, bannière arrondie, catégories, Top 10 numéroté, avant/après, annonces à la une, nouveautés par onglets,
// catalogue complet, contact, grand nom défilant. Sections réordonnables / masquables, textes, photos et couleurs configurables
// dans Mes annonces → Apparence (config.annonces). Pied de page, politiques et contact : voir annoncesSite/pied.tsx et contactSite.tsx.

import { useState, useMemo, useEffect } from 'react';
import { useAnnonces, fmtPrix, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { Carrousel, CSS_CARROUSEL } from './annoncesSite/carrousel';
import { PROFIL_GENERAL } from './TemplateAnnoncesClassique';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/voltConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

const POLICES = {
  moderne:     { corps: "'Inter', sans-serif",             titre: "'Inter', sans-serif",             poids: 800, interlettre: '-.02em' },
  geometrique: { corps: "'Poppins', sans-serif",           titre: "'Poppins', sans-serif",           poids: 700, interlettre: '-.02em' },
  condensee:   { corps: "'Barlow', sans-serif",            titre: "'Barlow Condensed', sans-serif",  poids: 700, interlettre: '0' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

// ─── Couleurs dérivées de la palette configurée ─────────────────────────────────
const rgb = (h: string): [number, number, number] => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255]; };
const alpha = (h: string, a: number) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
const lum = (h: string) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const surAccent = (h: string) => (lum(h) > 0.6 ? '#111111' : '#ffffff');
/** Version plus foncée de l'accent pour la fiche détaillée (fond blanc) : un jaune clair y serait illisible. */
const assombrir = (h: string) => { if (lum(h) <= 0.55) return h; const [r, g, b] = rgb(h); const f = 0.55; const x = (v: number) => Math.round(v * f).toString(16).padStart(2, '0'); return `#${x(r)}${x(g)}${x(b)}`; };

type Th = { ac: string; fond: string; carte: string; tx: string; doux: string; trait: string; sur: string; titre: string; corps: string; poids: number; il: string };

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}

function EnTete({ c, t, droite }: { c: Record<string, any>; t: Th; droite?: React.ReactNode }) {
  if (!c.surtitre && !c.titre && !c.texte && !droite) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
      <div style={{ minWidth: 0 }}>
        {c.surtitre && <p style={{ fontSize: 14, fontWeight: 600, color: t.ac, margin: '0 0 6px' }}>{c.surtitre}</p>}
        {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.2vw,46px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.08, color: t.tx, margin: 0 }}>{c.titre}</h2>}
        {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '10px 0 0', maxWidth: 680, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
      </div>
      {droite}
    </div>
  );
}

function Compte({ fin, t }: { fin: string; t: Th }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const ms = new Date(fin.replace(' ', 'T')).getTime() - now;
  if (!fin || Number.isNaN(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  const blocs: [string, string][] = [[p(Math.floor(s / 86400)), 'J'], [p(Math.floor(s % 86400 / 3600)), 'H'], [p(Math.floor(s % 3600 / 60)), 'M'], [p(s % 60), 'S']];
  return <span style={{ display: 'inline-flex', gap: 8, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: t.sur }}>{blocs.map(([n, l]) => <span key={l}>{n}<small style={{ fontSize: 10, fontWeight: 600, marginLeft: 2, opacity: .7 }}>{l}</small></span>)}</span>;
}

// Carte d'annonce (pas d'achat : « Aperçu » ouvre la fiche détaillée)
function Carte({ a, t, onOuvrir, rang }: { a: AnnoncePub; t: Th; onOuvrir: (a: AnnoncePub) => void; rang?: number }) {
  return (
    <article className="vl-carte" onClick={() => onOuvrir(a)} style={{ cursor: 'pointer', position: 'relative', paddingLeft: rang ? 56 : 0 }}>
      {rang ? <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 64, fontFamily: t.titre, fontSize: 150, fontWeight: 900, lineHeight: .8, color: 'transparent', WebkitTextStroke: `2px ${alpha(t.tx, .22)}`, userSelect: 'none' }}>{rang}</span> : null}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 20, overflow: 'hidden', background: t.carte }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>📷</div>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, left: 10, background: t.ac, color: t.sur, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>★ Vedette</span>}
        {a.lieu && <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.72)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.lieu}</span>}
        <span className="vl-apercu" style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', background: t.ac, color: t.sur, fontWeight: 800, fontSize: 14, padding: '10px 22px', borderRadius: 999 }}>Aperçu</span>
      </div>
      <div style={{ padding: '14px 4px 0' }}>
        {a.categorie && <p style={{ fontSize: 12, color: t.doux, margin: '0 0 4px' }}>{a.categorie}</p>}
        <h3 style={{ fontFamily: t.titre, fontSize: 18, fontWeight: 800, letterSpacing: t.il, color: t.tx, margin: '0 0 6px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        <p style={{ fontSize: 17, fontWeight: 700, color: t.tx, margin: 0 }}>{fmtPrix(a)}</p>
      </div>
    </article>
  );
}

// Curseur avant / après : une vraie glissière (input range) superposée, donc souris, doigt et clavier fonctionnent
function Comparateur({ c, t }: { c: Record<string, any>; t: Th }) {
  const [p, setP] = useState(50);
  return (
    <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 22, overflow: 'hidden', background: t.carte, userSelect: 'none' }}>
      <img src={c.imageApres} alt={c.etiquetteApres || 'Après'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <img src={c.imageAvant} alt={c.etiquetteAvant || 'Avant'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 ${100 - p}% 0 0)` }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 3, marginLeft: -1.5, background: t.ac }} />
      <div style={{ position: 'absolute', top: '50%', left: `${p}%`, width: 48, height: 48, marginLeft: -24, marginTop: -24, borderRadius: '50%', background: t.ac, color: t.sur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>↔</div>
      {c.etiquetteAvant && <span style={{ position: 'absolute', left: 14, bottom: 14, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 999 }}>{c.etiquetteAvant}</span>}
      {c.etiquetteApres && <span style={{ position: 'absolute', right: 14, bottom: 14, background: 'rgba(0,0,0,.7)', color: t.ac, fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 999 }}>{c.etiquetteApres}</span>}
      <input type="range" min={0} max={100} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="Comparer avant et après" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', margin: 0 }} />
    </div>
  );
}

export default function TemplateAnnoncesVolt({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const tx = cfg.couleurTexte;
  const t: Th = { ac: cfg.couleurPrincipale, fond: cfg.couleurFond, carte: cfg.couleurCarte, tx, doux: alpha(tx, .64), trait: alpha(tx, .14), sur: surAccent(cfg.couleurPrincipale), titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre };
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);

  // Données : « accueil » (sans filtre) alimente catégories, Top 10, à la une et nouveautés ; « cat » alimente le catalogue filtré
  const accueil = useAnnonces(gid, PROFIL_GENERAL.demo, FILTRES_VIDES, []);
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const cat = useAnnonces(gid, PROFIL_GENERAL.demo, f, []);
  const setFiltre = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const [onglet, setOnglet] = useState('');
  const versCategorie = (nom: string) => { setFiltre({ categorie: nom }); allerA('annonces'); };

  const visibles = cfg.sections.filter((x) => x.visible);
  const nav = visibles.filter((x) => x.label || SECTIONS_INFO[x.id].navDefaut);
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(36px,6vw,72px) 0' };
  const pilule = (plein: boolean): React.CSSProperties => ({ padding: '14px 28px', borderRadius: 999, fontWeight: 800, fontSize: 15, background: plein ? t.ac : 'transparent', color: plein ? t.sur : t.tx, border: plein ? `2px solid ${t.ac}` : `2px solid ${t.trait}` });
  const champ: React.CSSProperties = { padding: '12px 16px', border: `1.5px solid ${t.trait}`, borderRadius: 999, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };

  const tous = accueil.annonces;
  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'bandeau': return c.texte ? (
        <div style={{ background: t.ac, color: t.sur }}>
          <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 44, flexWrap: 'wrap', padding: '8px 24px', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
            <Compte fin={c.dateFin} t={t} /><span>{c.texte}</span>
            {c.lienTexte && <Lien v={c.lien} style={{ background: 'none', border: 'none', color: t.sur, fontWeight: 800, textDecoration: 'underline', padding: 0, fontSize: 14 }}>{c.lienTexte}</Lien>}
          </div>
        </div>
      ) : null;
      case 'hero': return (
        <section style={{ ...sec, paddingTop: 24 }}><div style={wrap}>
          <div style={{ position: 'relative', border: `1px solid ${t.trait}`, borderRadius: 28, overflow: 'hidden', minHeight: 440, background: c.image ? `linear-gradient(120deg, ${t.fond} 30%, ${t.carte})` : `radial-gradient(circle at 88% 50%, ${alpha(t.ac, .22)}, transparent 52%), linear-gradient(120deg, ${t.fond} 30%, ${t.carte})`, display: 'flex', alignItems: 'center' }}>
            {c.image && <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} className="vl-hero-img" style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', maxWidth: '58%', objectFit: 'contain', objectPosition: 'right bottom' }} />}
            {c.badge && <span style={{ position: 'absolute', top: 26, left: 32, background: alpha(t.tx, .1), color: t.tx, fontSize: 14, fontWeight: 800, padding: '6px 14px', borderRadius: 8, transform: 'skewX(-8deg)' }}>{c.badge}</span>}
            <div style={{ position: 'relative', padding: 'clamp(70px,9vw,100px) clamp(24px,5vw,60px) clamp(36px,5vw,60px)', maxWidth: 700 }}>
              {c.surtitre && <p style={{ fontSize: 15, fontWeight: 600, color: t.ac, margin: '0 0 10px' }}>{c.surtitre}</p>}
              <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(36px,6.4vw,72px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.04, color: t.tx, margin: 0 }}>{c.titre}</h1>
              {c.texte && <p style={{ fontSize: 18, lineHeight: 1.6, color: t.doux, margin: '18px 0 0', maxWidth: 520, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
                {c.btnTexte && <Lien v={c.btnLien} style={pilule(true)}>{c.btnTexte}</Lien>}
                {c.btn2Texte && <Lien v={c.btn2Lien} style={pilule(false)}>{c.btn2Texte}</Lien>}
              </div>
            </div>
          </div>
        </div></section>
      );
      case 'categories': return accueil.categories.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="vl-cats">{accueil.categories.slice(0, 8).map((x) => (
            <button key={x.nom} onClick={() => versCategorie(x.nom)} style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 20, padding: '34px 18px', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              <span style={{ display: 'block', fontFamily: t.titre, fontSize: 24, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.15 }}>{x.nom}</span>
              <span style={{ display: 'block', fontSize: 13, color: t.doux, marginTop: 8 }}>{x.n} annonce{x.n > 1 ? 's' : ''}</span>
            </button>))}</div>
        </div></section>
      ) : null;
      case 'populaires': return tous.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel couleur={t.ac} fond={t.fond}>{tous.slice(0, 10).map((a, i) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} rang={i + 1} />)}</Carrousel>
        </div></section>
      ) : null;
      case 'comparateur': return (c.imageAvant && c.imageApres) ? (
        <section style={sec}><div style={wrap}>
          <div className="vl-comp" style={{ border: `1px solid ${t.trait}`, borderRadius: 28, background: t.carte, padding: 'clamp(20px,4vw,40px)' }}>
            <div>
              {c.surtitre && <p style={{ fontSize: 14, fontWeight: 600, color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(30px,4.4vw,52px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              {c.btnTexte && <div style={{ marginTop: 26 }}><Lien v={c.btnLien} style={pilule(true)}>{c.btnTexte}</Lien></div>}
            </div>
            <Comparateur c={c} t={t} />
          </div>
        </div></section>
      ) : null;
      case 'vedettes': { const v = tous.filter((a) => a.vedette); return v.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel couleur={t.ac} fond={t.fond} large>{v.map((a) => (
            <article key={a.id} className="vl-une" style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 24, overflow: 'hidden' }}>
              <div onClick={() => setOuverte(a)} style={{ cursor: 'pointer', background: alpha(t.tx, .05), minHeight: 260 }}>
                {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 260 }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>📷</div>}
              </div>
              <div style={{ padding: '28px 28px 26px', display: 'flex', flexDirection: 'column' }}>
                {a.categorie && <p style={{ fontSize: 13, fontWeight: 700, color: t.ac, margin: '0 0 6px' }}>{a.categorie}</p>}
                <h3 style={{ fontFamily: t.titre, fontSize: 26, fontWeight: t.poids, letterSpacing: t.il, color: t.tx, margin: '0 0 10px', lineHeight: 1.15 }}>{a.titre}</h3>
                {a.description && <p style={{ fontSize: 15, lineHeight: 1.6, color: t.doux, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</p>}
                <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: t.tx }}>{fmtPrix(a)}</span>
                  <button onClick={() => setOuverte(a)} style={{ ...pilule(true), cursor: 'pointer', fontFamily: 'inherit' }}>{c.btnTexte || 'Voir la fiche'}</button>
                </div>
              </div>
            </article>))}</Carrousel>
        </div></section>
      ) : null; }
      case 'nouveautes': {
        if (!tous.length) return null;
        const noms = Array.from(new Set(tous.map((a) => a.categorie).filter(Boolean))).slice(0, 5);
        const liste = tous.filter((a) => !onglet || a.categorie === onglet).slice(0, Number(c.nombre) || 8);
        const onglets = (
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: t.carte, flexWrap: 'wrap' }}>
            {['', ...noms].map((n) => <button key={n || 'tous'} onClick={() => setOnglet(n)} style={{ border: 'none', borderRadius: 999, padding: '9px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', background: onglet === n ? t.ac : 'transparent', color: onglet === n ? t.sur : t.doux }}>{n || 'Toutes'}</button>)}
          </div>
        );
        return (
          <section style={sec}><div style={wrap}>
            <EnTete c={c} t={t} droite={onglets} />
            <div className="vl-grille">{liste.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>
            {c.btnTexte && <div style={{ textAlign: 'center', marginTop: 30 }}><button onClick={() => allerA('annonces')} style={{ ...pilule(false), cursor: 'pointer', fontFamily: 'inherit' }}>{c.btnTexte}</button></div>}
          </div></section>
        );
      }
      case 'annonces': return (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Que cherchez-vous ?" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFiltre({ q: q.trim() })} maxLength={80} />
            <input style={{ ...champ, flex: '0 1 180px' }} placeholder="Ville ou région" value={f.lieu} onChange={(e) => setFiltre({ lieu: e.target.value })} maxLength={60} />
            <button onClick={() => setFiltre({ q: q.trim() })} style={{ ...pilule(true), cursor: 'pointer', fontFamily: 'inherit', padding: '0 26px' }}>Chercher</button>
            <select value={f.tri} onChange={(e) => setFiltre({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récentes</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
          </div>
          {cat.categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
              {[{ nom: '', n: cat.categories.reduce((s, x) => s + x.n, 0) }, ...cat.categories].map((x) => (
                <button key={x.nom || 'toutes'} onClick={() => setFiltre({ categorie: x.nom })} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${f.categorie === x.nom ? t.ac : t.trait}`, background: f.categorie === x.nom ? t.ac : 'transparent', color: f.categorie === x.nom ? t.sur : t.tx, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{x.nom || 'Toutes'} ({x.n})</button>))}
            </div>
          )}
          {cat.demo && <div style={{ background: 'rgba(252,211,77,.12)', border: '1px solid #fcd34d', borderRadius: 12, padding: '10px 14px', color: '#fde68a', fontSize: 13, marginBottom: 18 }}>Aperçu avec des annonces d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
          {!cat.loading && cat.annonces.length === 0
            ? <p style={{ textAlign: 'center', color: t.doux, padding: '40px 0' }}>{c.vide || 'Aucune annonce ne correspond.'}</p>
            : <div className="vl-grille">{cat.annonces.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>}
          {cat.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1, color: t.tx }}>← Précédent</button>
              <span style={{ fontSize: 14, color: t.doux }}>Page {f.page} / {cat.pages}</span>
              <button disabled={f.page >= cat.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= cat.pages ? .4 : 1, color: t.tx }}>Suivant →</button>
            </div>
          )}
        </div></section>
      );
      case 'contact': return (
        <section style={sec}><div style={wrap}>
          <div className="vl-comp" style={{ border: `1px solid ${t.trait}`, borderRadius: 28, background: t.carte, padding: 'clamp(20px,4vw,44px)', alignItems: 'start' }}>
            <div>
              {c.image && <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 18, marginBottom: 22 }} />}
              {c.surtitre && <p style={{ fontSize: 14, fontWeight: 600, color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.08, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17 }}><span style={{ color: t.ac }}>📞</span> {cfg.telephone}</a>}
                {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}><span style={{ color: t.ac }}>✉️</span> {cfg.courriel}</a>}
                {cfg.adresse && <p style={{ margin: 0, color: t.doux }}><span style={{ color: t.ac }}>📍</span> {cfg.adresse}</p>}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, color: '#1f2937' }}><FormulaireSite gid={gid} couleur={assombrir(t.ac)} police={t.corps} /></div>
          </div>
        </div></section>
      );
      case 'enseigne': { const mot = (c.texte || cfg.nomSite || '').toUpperCase(); return mot ? (
        <div aria-hidden="true" style={{ overflow: 'hidden', background: '#000', padding: '20px 0' }}>
          <div className="vl-piste">{[0, 1].map((k) => <div key={k} style={{ display: 'flex', flexShrink: 0 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ fontFamily: t.titre, fontSize: 'clamp(80px,15vw,200px)', fontWeight: 900, lineHeight: 1, color: t.ac, padding: '0 .3em', whiteSpace: 'nowrap' }}>{mot}</span>)}</div>)}</div>
        </div>
      ) : null; }
    }
  };

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }} onClick={() => { if (politiques.statut !== 'ferme') politiques.fermer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 40, objectFit: 'contain' }} />
        : <span style={{ fontFamily: t.titre, fontSize: 30, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.03em', color: t.ac, whiteSpace: 'nowrap' }}>{cfg.nomSite}</span>}
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" />
      <style>{`${CSS_CARROUSEL}
        .vl-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}.vl-cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
        .vl-comp{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(20px,4vw,48px);align-items:center}
        .vl-une{display:grid;grid-template-columns:1fr 1fr}
        .vl-carte .vl-apercu{opacity:0;transition:opacity .2s}.vl-carte:hover .vl-apercu{opacity:1}
        .vl-piste{display:flex;width:max-content;animation:vlDefile 38s linear infinite}@keyframes vlDefile{to{transform:translateX(-50%)}}
        @media(prefers-reduced-motion:reduce){.vl-piste{animation:none}}
        .vl-nav{display:flex;gap:26px;align-items:center}.vl-burger{display:none}
        @media(max-width:980px){.vl-grille,.vl-cats{grid-template-columns:repeat(2,minmax(0,1fr))}.vl-comp{grid-template-columns:1fr}.vl-nav{display:none}.vl-burger{display:block}}
        @media(max-width:680px){.vl-une{grid-template-columns:1fr}.vl-hero-img{opacity:.28;max-width:100% !important}.vl-carte .vl-apercu{opacity:1}}
        *{box-sizing:border-box}img{display:block;max-width:100%}input::placeholder{color:${alpha(tx, .45)}}`}</style>

      {politiques.statut === 'ferme' && visibles.some((x) => x.id === 'bandeau') && rendre('bandeau')}

      <header style={{ background: alpha(t.fond, .94), position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${t.trait}`, backdropFilter: 'blur(8px)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 72, gap: 16 }}>
          {logo}
          <nav className="vl-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 700, color: t.tx, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="vl-nav" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${t.trait}`, color: t.tx, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="vl-burger" aria-label="Menu" onClick={() => setMenu((v) => !v)} style={{ background: 'none', border: `1px solid ${t.trait}`, borderRadius: 10, color: t.tx, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {menu && <div className="vl-burger" style={{ borderTop: `1px solid ${t.trait}`, padding: '8px 24px 14px' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: t.tx, padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={assombrir(t.ac)} police={t.corps} /></div>
        : visibles.filter((x) => x.id !== 'bandeau').map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 80 }}>{el}</div> : null; })}

      <Pied nom={cfg.nomSite} fond={t.carte} texteLibre={cfg.piedTexte} avis={PROFIL_GENERAL.avis} reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />

      {ouverte && <Detail a={ouverte} gid={gid} demo={accueil.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: assombrir(t.ac), couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_GENERAL} onClose={() => setOuverte(null)} />}
    </div>
  );
}