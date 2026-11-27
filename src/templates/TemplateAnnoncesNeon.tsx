// src/templates/TemplateAnnoncesNeon.tsx
// e-Vend Studio — Petites annonces « Néon » (généraliste, fond noir, accent néon + halo dégradé) — affichage seulement, aucune transaction.
// Bannière centrée avec halo, étiquette inclinée, avantages, catégories en pastilles, annonces à la une, bandeau d'offre, catalogue complet, FAQ, contact.
// Sections réordonnables / masquables, textes, photos et couleurs configurables dans Mes annonces → Apparence (config.annonces).
// Pied de page, politiques et contact : voir annoncesSite/pied.tsx et contactSite.tsx.

import { useState, useMemo, useEffect } from 'react';
import { useAnnonces, fmtPrix, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { PROFIL_GENERAL } from './TemplateAnnoncesClassique';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { alpha, surCouleur, foncer } from './annoncesSite/couleurs';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/neonConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

const POLICES = {
  moderne:     { corps: "'Inter', sans-serif",   titre: "'Inter', sans-serif",   poids: 800, interlettre: '-.03em' },
  geometrique: { corps: "'Poppins', sans-serif", titre: "'Poppins', sans-serif", poids: 700, interlettre: '-.02em' },
  arrondie:    { corps: "'Nunito', sans-serif",  titre: "'Nunito', sans-serif",  poids: 800, interlettre: '-.01em' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

type Th = { ac: string; ac2: string; fond: string; carte: string; tx: string; doux: string; trait: string; sur: string; titre: string; corps: string; poids: number; il: string };

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}

/** Étiquette inclinée à contour dégradé (clin d'œil « étiquette de prix »). */
function Etiquette({ texte, t, fond }: { texte: string; t: Th; fond: string }) {
  if (!texte) return null;
  return (
    <span className="nn-etiq" style={{ display: 'inline-block', transform: 'rotate(-9deg)', padding: '12px 22px', borderRadius: 18, border: '2px solid transparent', background: `linear-gradient(${fond},${fond}) padding-box, linear-gradient(135deg, ${t.ac2}, ${t.ac}) border-box`, color: t.tx, fontWeight: 800, fontSize: 15, lineHeight: 1.25, textAlign: 'center', whiteSpace: 'pre-line', boxShadow: `0 0 24px ${alpha(t.ac, .35)}` }}>{texte}</span>
  );
}

function EnTete({ c, t, centre }: { c: Record<string, any>; t: Th; centre?: boolean }) {
  if (!c.surtitre && !c.titre && !c.texte) return null;
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: 30 }}>
      {c.surtitre && <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ac, margin: '0 0 8px', textShadow: `0 0 18px ${alpha(t.ac, .6)}` }}>{c.surtitre}</p>}
      {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.4vw,46px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, color: t.tx, margin: 0 }}>{c.titre}</h2>}
      {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '12px auto 0', maxWidth: 680, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
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
  const blocs: [string, string][] = [[p(Math.floor(s / 86400)), 'jours'], [p(Math.floor(s % 86400 / 3600)), 'h'], [p(Math.floor(s % 3600 / 60)), 'min'], [p(s % 60), 's']];
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '18px 0 0' }}>
      {blocs.map(([n, l]) => <div key={l} style={{ minWidth: 64, textAlign: 'center', padding: '10px 8px', borderRadius: 14, border: `1px solid ${alpha(t.ac, .5)}`, background: alpha(t.ac, .08) }}>
        <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: t.ac }}>{n}</div><div style={{ fontSize: 11, color: t.doux }}>{l}</div></div>)}
    </div>
  );
}

// Carte d'annonce : contour néon au survol, prix dans une pastille « étiquette »
function Carte({ a, t, onOuvrir }: { a: AnnoncePub; t: Th; onOuvrir: (a: AnnoncePub) => void }) {
  return (
    <article className="nn-carte" onClick={() => onOuvrir(a)} style={{ cursor: 'pointer', background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: alpha(t.tx, .05) }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>📷</div>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, left: 10, background: t.ac, color: t.sur, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>★ Vedette</span>}
        {a.lieu && <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.lieu}</span>}
      </div>
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {a.categorie && <p style={{ fontSize: 12, fontWeight: 700, color: t.ac, margin: '0 0 4px' }}>{a.categorie}</p>}
        <h3 style={{ fontFamily: t.titre, fontSize: 18, fontWeight: 800, letterSpacing: t.il, color: t.tx, margin: '0 0 12px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        <div style={{ marginTop: 'auto' }}>
          <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 12, border: '1.5px solid transparent', background: `linear-gradient(${t.carte},${t.carte}) padding-box, linear-gradient(135deg, ${t.ac2}, ${t.ac}) border-box`, color: t.tx, fontWeight: 800, fontSize: 16 }}>{fmtPrix(a)}</span>
        </div>
      </div>
    </article>
  );
}

export default function TemplateAnnoncesNeon({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const tx = cfg.couleurTexte;
  const t: Th = { ac: cfg.couleurPrincipale, ac2: cfg.couleurSecondaire, fond: cfg.couleurFond, carte: cfg.couleurCarte, tx, doux: alpha(tx, .66), trait: alpha(tx, .13), sur: surCouleur(cfg.couleurPrincipale), titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre };
  const clair = foncer(t.ac);   // version lisible sur fond blanc (fiche détaillée, formulaire)
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);

  const accueil = useAnnonces(gid, PROFIL_GENERAL.demo, FILTRES_VIDES, []);
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const cat = useAnnonces(gid, PROFIL_GENERAL.demo, f, []);
  const setFiltre = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const versCategorie = (nom: string) => { setFiltre({ categorie: nom }); allerA('annonces'); };

  const visibles = cfg.sections.filter((x) => x.visible);
  const nav = visibles.filter((x) => x.label || SECTIONS_INFO[x.id].navDefaut);
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(40px,6vw,80px) 0' };
  const pilule = (plein: boolean): React.CSSProperties => ({ padding: '15px 30px', borderRadius: 999, fontWeight: 800, fontSize: 15, background: plein ? t.ac : 'transparent', color: plein ? t.sur : t.tx, border: plein ? `2px solid ${t.ac}` : `2px solid ${alpha(t.tx, .28)}`, boxShadow: plein ? `0 0 28px ${alpha(t.ac, .45)}` : 'none' });
  const champ: React.CSSProperties = { padding: '12px 18px', border: `1.5px solid ${t.trait}`, borderRadius: 999, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };

  const tous = accueil.annonces;
  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'hero': return (
        <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(56px,9vw,120px) 0 clamp(80px,12vw,160px)', textAlign: 'center' }}>
          {/* Halo : deux nappes qui coulent du bas vers le haut, du cyan au vert */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: '-34%', width: '150%', height: '90%', transform: 'translateX(-50%)', background: `radial-gradient(ellipse 45% 60% at 35% 60%, ${alpha(t.ac2, .55)}, transparent 70%), radial-gradient(ellipse 45% 60% at 65% 60%, ${alpha(t.ac, .6)}, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', background: `linear-gradient(to top, ${alpha(t.ac, .18)}, transparent)`, pointerEvents: 'none' }} />
          <div style={{ ...wrap, position: 'relative' }}>
            {c.etiquette && <div style={{ marginBottom: 26 }}><Etiquette texte={c.etiquette} t={t} fond={t.fond} /></div>}
            <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(40px,8vw,92px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.02, color: t.tx, margin: '0 auto', maxWidth: 980 }}>
              {c.titre && <span style={{ display: 'block' }}>{c.titre}</span>}
              {c.titreAccent && <span style={{ display: 'block', color: t.ac, textShadow: `0 0 36px ${alpha(t.ac, .55)}` }}>{c.titreAccent}</span>}
              {c.titreSuite && <span style={{ display: 'block' }}>{c.titreSuite}</span>}
            </h1>
            {c.texte && <p style={{ fontSize: 'clamp(16px,2vw,20px)', lineHeight: 1.6, color: t.doux, margin: '24px auto 0', maxWidth: 620, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 34 }}>
              {c.btnTexte && <Lien v={c.btnLien} style={pilule(true)}>{c.btnTexte}</Lien>}
              {c.btn2Texte && <Lien v={c.btn2Lien} style={pilule(false)}>{c.btn2Texte}</Lien>}
            </div>
            {c.image && <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ margin: '48px auto 0', maxHeight: 380, width: 'auto', maxWidth: '100%', objectFit: 'contain', borderRadius: 24, boxShadow: `0 0 60px ${alpha(t.ac, .35)}` }} />}
          </div>
        </section>
      );
      case 'avantages': return c.items && c.items.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} centre />
          <div className="nn-grille3">{c.items.map((it: any, i: number) => (
            <div key={i} style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 22, padding: '26px 24px' }}>
              {it.icone && <span style={{ display: 'inline-flex', width: 52, height: 52, alignItems: 'center', justifyContent: 'center', fontSize: 26, borderRadius: 16, border: `1.5px solid ${alpha(t.ac, .6)}`, background: alpha(t.ac, .1), boxShadow: `0 0 20px ${alpha(t.ac, .25)}`, marginBottom: 16 }}>{it.icone}</span>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 20, fontWeight: t.poids, letterSpacing: t.il, margin: '0 0 8px', color: t.tx }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: 15, lineHeight: 1.6, color: t.doux, margin: 0, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
            </div>))}</div>
        </div></section>
      ) : null;
      case 'categories': return accueil.categories.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} centre />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>{accueil.categories.slice(0, 12).map((x) => (
            <button key={x.nom} className="nn-pastille" onClick={() => versCategorie(x.nom)} style={{ background: 'transparent', border: `1.5px solid ${alpha(t.ac, .55)}`, borderRadius: 999, padding: '12px 24px', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 16 }}>
              {x.nom} <span style={{ color: t.ac, marginLeft: 6, fontSize: 13 }}>{x.n}</span>
            </button>))}</div>
        </div></section>
      ) : null;
      case 'vedettes': { const v = tous.filter((a) => a.vedette); const liste = v.concat(tous.filter((a) => !a.vedette)).slice(0, Number(c.nombre) || 6); return liste.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} centre />
          <div className="nn-grille3">{liste.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>
        </div></section>
      ) : null; }
      case 'offre': return (c.titre || c.texte) ? (
        <section style={sec}><div style={wrap}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 30, border: `1.5px solid ${alpha(t.ac, .5)}`, background: t.carte, padding: 'clamp(26px,5vw,56px)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: '-10%', bottom: '-60%', width: '70%', height: '140%', background: `radial-gradient(ellipse at center, ${alpha(t.ac2, .35)}, ${alpha(t.ac, .2)} 45%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            {c.etiquette && <div style={{ position: 'relative', padding: '0 10px' }}><Etiquette texte={c.etiquette} t={t} fond={t.carte} /></div>}
            <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 0 }}>
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(26px,4vw,42px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, margin: 0, color: t.tx }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <Compte fin={c.dateFin} t={t} />
              {c.btnTexte && <div style={{ marginTop: 24 }}><Lien v={c.btnLien} style={pilule(true)}>{c.btnTexte}</Lien></div>}
            </div>
          </div>
        </div></section>
      ) : null;
      case 'annonces': return (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} centre />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Que cherchez-vous ?" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFiltre({ q: q.trim() })} maxLength={80} />
            <input style={{ ...champ, flex: '0 1 180px' }} placeholder="Ville ou région" value={f.lieu} onChange={(e) => setFiltre({ lieu: e.target.value })} maxLength={60} />
            <button onClick={() => setFiltre({ q: q.trim() })} style={{ ...pilule(true), cursor: 'pointer', fontFamily: 'inherit', padding: '0 28px' }}>Chercher</button>
            <select value={f.tri} onChange={(e) => setFiltre({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récentes</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
          </div>
          {cat.categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {[{ nom: '', n: cat.categories.reduce((s, x) => s + x.n, 0) }, ...cat.categories].map((x) => (
                <button key={x.nom || 'toutes'} onClick={() => setFiltre({ categorie: x.nom })} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${f.categorie === x.nom ? t.ac : t.trait}`, background: f.categorie === x.nom ? t.ac : 'transparent', color: f.categorie === x.nom ? t.sur : t.tx, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{x.nom || 'Toutes'} ({x.n})</button>))}
            </div>
          )}
          {cat.demo && <div style={{ background: 'rgba(252,211,77,.12)', border: '1px solid #fcd34d', borderRadius: 12, padding: '10px 14px', color: '#fde68a', fontSize: 13, marginBottom: 18 }}>Aperçu avec des annonces d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
          {!cat.loading && cat.annonces.length === 0
            ? <p style={{ textAlign: 'center', color: t.doux, padding: '40px 0' }}>{c.vide || 'Aucune annonce ne correspond.'}</p>
            : <div className="nn-grille4">{cat.annonces.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>}
          {cat.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
              <span style={{ fontSize: 14, color: t.doux }}>Page {f.page} / {cat.pages}</span>
              <button disabled={f.page >= cat.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= cat.pages ? .4 : 1 }}>Suivant →</button>
            </div>
          )}
        </div></section>
      );
      case 'faq': return c.items && c.items.length ? (
        <section style={sec}><div style={{ ...wrap, maxWidth: 820 }}>
          <EnTete c={c} t={t} centre />
          <div style={{ display: 'grid', gap: 12 }}>{c.items.map((it: any, i: number) => (
            <details key={i} className="nn-faq" style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 18, padding: '4px 22px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 17, padding: '16px 0', color: t.tx, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{it.q}</span><span aria-hidden="true" style={{ color: t.ac, fontSize: 22, lineHeight: 1 }}>＋</span></summary>
              <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.65, color: t.doux, whiteSpace: 'pre-wrap' }}>{it.r}</p>
            </details>))}</div>
        </div></section>
      ) : null;
      case 'contact': return (
        <section style={sec}><div style={wrap}>
          <div className="nn-comp" style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${t.trait}`, borderRadius: 30, background: t.carte, padding: 'clamp(20px,4vw,48px)' }}>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-15%', bottom: '-50%', width: '60%', height: '120%', background: `radial-gradient(ellipse at center, ${alpha(t.ac, .22)}, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              {c.surtitre && <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17 }}><span style={{ color: t.ac }}>📞</span> {cfg.telephone}</a>}
                {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}><span style={{ color: t.ac }}>✉️</span> {cfg.courriel}</a>}
                {cfg.adresse && <p style={{ margin: 0, color: t.doux }}><span style={{ color: t.ac }}>📍</span> {cfg.adresse}</p>}
              </div>
            </div>
            <div style={{ position: 'relative', background: '#fff', borderRadius: 22, padding: 24, color: '#1f2937' }}><FormulaireSite gid={gid} couleur={clair} police={t.corps} /></div>
          </div>
        </div></section>
      );
    }
  };

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }} onClick={() => { if (politiques.statut !== 'ferme') politiques.fermer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 40, objectFit: 'contain' }} />
        : <span style={{ fontFamily: t.titre, fontSize: 26, fontWeight: 900, letterSpacing: '-.02em', color: t.tx, whiteSpace: 'nowrap', textShadow: `0 0 20px ${alpha(t.ac, .6)}` }}><span style={{ color: t.ac }}>●</span> {cfg.nomSite}</span>}
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
      <style>{`
        .nn-grille3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.nn-grille4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .nn-comp{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(20px,4vw,48px);align-items:center}
        .nn-carte{transition:border-color .2s,box-shadow .2s,transform .2s}.nn-carte:hover{border-color:${t.ac} !important;box-shadow:0 0 30px ${alpha(t.ac, .35)};transform:translateY(-3px)}
        .nn-pastille{transition:background .2s,box-shadow .2s}.nn-pastille:hover{background:${alpha(t.ac, .14)} !important;box-shadow:0 0 22px ${alpha(t.ac, .35)}}
        .nn-faq summary::-webkit-details-marker{display:none}.nn-faq[open]{border-color:${alpha(t.ac, .55)} !important}
        @media(prefers-reduced-motion:reduce){.nn-carte{transition:none}.nn-carte:hover{transform:none}}
        .nn-nav{display:flex;gap:26px;align-items:center}.nn-burger{display:none}
        @media(max-width:980px){.nn-grille3{grid-template-columns:repeat(2,minmax(0,1fr))}.nn-grille4{grid-template-columns:repeat(2,minmax(0,1fr))}.nn-comp{grid-template-columns:1fr}.nn-nav{display:none}.nn-burger{display:block}}
        @media(max-width:560px){.nn-grille3{grid-template-columns:1fr}.nn-grille4{gap:12px}}
        *{box-sizing:border-box}img{display:block;max-width:100%}input::placeholder{color:${alpha(tx, .45)}}select option{color:#111;background:#fff}`}</style>

      <header style={{ background: alpha(t.fond, .88), position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${t.trait}`, backdropFilter: 'blur(10px)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 70, gap: 16 }}>
          {logo}
          <nav className="nn-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 600, color: t.tx, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nn-nav" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${alpha(t.ac, .5)}`, color: t.tx, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="nn-burger" aria-label="Menu" onClick={() => setMenu((v) => !v)} style={{ background: 'none', border: `1px solid ${t.trait}`, borderRadius: 10, color: t.tx, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {menu && <div className="nn-burger" style={{ borderTop: `1px solid ${t.trait}`, padding: '8px 24px 14px' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: t.tx, padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={clair} police={t.corps} /></div>
        : visibles.map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 76 }}>{el}</div> : null; })}

      <Pied nom={cfg.nomSite} fond={t.carte} texteLibre={cfg.piedTexte} avis={PROFIL_GENERAL.avis} reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />

      {ouverte && <Detail a={ouverte} gid={gid} demo={accueil.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: clair, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_GENERAL} onClose={() => setOuverte(null)} />}
    </div>
  );
}