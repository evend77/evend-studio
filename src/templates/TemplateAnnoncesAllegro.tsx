// src/templates/TemplateAnnoncesAllegro.tsx
// e-Vend Studio — Petites annonces « Allegro » (généraliste, en-tête coloré avec recherche, titres à dégradé, bannières en mosaïque,
// section sombre à carrousel) — affichage seulement, aucune transaction.
// Sections réordonnables / masquables, textes, photos et couleurs configurables dans Mes annonces → Apparence (config.annonces).
// Pied de page, politiques et contact : voir annoncesSite/pied.tsx et contactSite.tsx.

import { useState, useMemo, useEffect } from 'react';
import { useAnnonces, fmtPrix, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { Carrousel, CSS_CARROUSEL } from './annoncesSite/carrousel';
import { PROFIL_GENERAL } from './TemplateAnnoncesClassique';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { alpha, surCouleur } from './annoncesSite/couleurs';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/allegroConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

const POLICES = {
  condensee: { corps: "'Barlow', sans-serif",  titre: "'Barlow Condensed', sans-serif", poids: 800, interlettre: '0' },
  moderne:   { corps: "'Inter', sans-serif",   titre: "'Inter', sans-serif",            poids: 800, interlettre: '-.03em' },
  arrondie:  { corps: "'Nunito', sans-serif",  titre: "'Nunito', sans-serif",           poids: 900, interlettre: '-.01em' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

type Th = { rouge: string; bleu: string; ac: string; sombre: string; fond: string; carte: string; tx: string; doux: string; trait: string; titre: string; corps: string; poids: number; il: string; degrade: string };

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}
/** Bloc cliquable si le lien est valide, simple bloc sinon. */
function Cadre({ v, style, children }: { v: string; style: React.CSSProperties; children: React.ReactNode }) {
  return lienOk(v, [...SECTION_IDS]) ? <Lien v={v} style={{ ...style, display: 'block', textAlign: 'left', border: 'none', padding: 0, width: '100%' }}>{children}</Lien> : <div style={style}>{children}</div>;
}

const degradeTexte = (t: Th): React.CSSProperties => ({ background: t.degrade, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' });

function EnTete({ c, t, clair, droite }: { c: Record<string, any>; t: Th; clair?: boolean; droite?: React.ReactNode }) {
  if (!c.surtitre && !c.titre && !c.texte && !droite) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
      <div style={{ minWidth: 0 }}>
        {c.surtitre && <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: clair ? t.ac : t.rouge, margin: '0 0 6px' }}>{c.surtitre}</p>}
        {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(32px,5vw,54px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, color: clair ? '#fff' : t.tx, margin: 0 }}>{c.titre}</h2>}
        {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: clair ? 'rgba(255,255,255,.75)' : t.doux, margin: '10px 0 0', maxWidth: 680, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
      </div>
      {droite}
    </div>
  );
}

function Carte({ a, t, onOuvrir }: { a: AnnoncePub; t: Th; onOuvrir: (a: AnnoncePub) => void }) {
  return (
    <article className="al-carte" onClick={() => onOuvrir(a)} style={{ cursor: 'pointer', background: t.carte, borderRadius: 20, overflow: 'hidden', border: `1px solid ${t.trait}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: alpha(t.tx, .06) }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>📷</div>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, left: 10, background: t.rouge, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>★ Vedette</span>}
        {a.lieu && <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,.92)', color: '#222', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.lieu}</span>}
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {a.categorie && <p style={{ fontSize: 12, fontWeight: 700, color: t.bleu, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.categorie}</p>}
        <h3 style={{ fontFamily: t.titre, fontSize: 21, fontWeight: t.poids, letterSpacing: t.il, color: t.tx, margin: '0 0 10px', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: t.rouge }}>{fmtPrix(a)}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.bleu, border: `1.5px solid ${t.bleu}`, borderRadius: 999, padding: '5px 14px' }}>Voir →</span>
        </div>
      </div>
    </article>
  );
}

export default function TemplateAnnoncesAllegro({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const t: Th = { rouge: cfg.couleurPrincipale, bleu: cfg.couleurSecondaire, ac: cfg.couleurAccent, sombre: cfg.couleurSombre, fond: cfg.couleurFond, carte: cfg.couleurCarte, tx: cfg.couleurTexte, doux: alpha(cfg.couleurTexte, .66), trait: alpha(cfg.couleurTexte, .12), titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre, degrade: `linear-gradient(90deg, ${cfg.couleurAccent}, ${cfg.couleurPrincipale} 50%, ${cfg.couleurSecondaire})` };
  const surRouge = surCouleur(t.rouge), surBleu = surCouleur(t.bleu);
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);

  const accueil = useAnnonces(gid, PROFIL_GENERAL.demo, FILTRES_VIDES, []);
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const [catRech, setCatRech] = useState('');
  const cat = useAnnonces(gid, PROFIL_GENERAL.demo, f, []);
  const setFiltre = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const versCategorie = (nom: string) => { setFiltre({ categorie: nom }); allerA('annonces'); };
  const chercher = () => { setFiltre({ q: q.trim(), categorie: catRech }); allerA('annonces'); };

  const visibles = cfg.sections.filter((x) => x.visible);
  const ent = visibles.some((x) => x.id === 'entete') ? cfg.contenu.entete : null;
  const nav = visibles.filter((x) => x.id !== 'entete' && (x.label || SECTIONS_INFO[x.id].navDefaut));
  const wrap: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(30px,5vw,60px) 0' };
  const pilule = (plein: boolean, surSombre = false): React.CSSProperties => ({ padding: '14px 28px', borderRadius: 999, fontWeight: 800, fontSize: 15, background: plein ? t.bleu : 'transparent', color: plein ? surBleu : (surSombre ? '#fff' : t.bleu), border: `2px solid ${plein ? t.bleu : (surSombre ? 'rgba(255,255,255,.7)' : t.bleu)}` });
  const champ: React.CSSProperties = { padding: '12px 18px', border: `1.5px solid ${t.trait}`, borderRadius: 999, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };

  const tous = accueil.annonces;
  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'entete': return null;   // rendu dans l'en-tête
      case 'hero': return (
        <section style={{ padding: '20px 0 0' }}><div style={wrap}>
          <div style={{ position: 'relative', borderRadius: 30, overflow: 'hidden', minHeight: 'clamp(360px,48vw,520px)', display: 'flex', alignItems: 'center', background: `linear-gradient(120deg, ${t.sombre}, ${t.bleu})` }}>
            {c.image
              ? <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <><span aria-hidden="true" style={{ position: 'absolute', right: '-8%', top: '-30%', width: '55%', aspectRatio: '1', borderRadius: '50%', background: alpha(t.ac, .35), filter: 'blur(10px)' }} /><span aria-hidden="true" style={{ position: 'absolute', right: '12%', bottom: '-35%', width: '40%', aspectRatio: '1', borderRadius: '50%', background: alpha(t.rouge, .4), filter: 'blur(10px)' }} /></>}
            {c.image && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${alpha(t.sombre, .9)} 10%, ${alpha(t.sombre, .35)} 60%, transparent)` }} />}
            <div style={{ position: 'relative', padding: 'clamp(30px,6vw,70px)', maxWidth: 720 }}>
              <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(42px,7.4vw,86px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1, color: '#fff', margin: 0 }}>
                {c.titre}{c.titre && c.titreAccent ? ' ' : ''}{c.titreAccent && <span style={degradeTexte({ ...t, degrade: `linear-gradient(90deg, ${t.ac}, #ff6fb5 55%, #7cc4ff)` })}>{c.titreAccent}</span>}
              </h1>
              {c.texte && <p style={{ fontSize: 'clamp(16px,2vw,19px)', lineHeight: 1.6, color: 'rgba(255,255,255,.85)', margin: '18px 0 0', maxWidth: 520, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              {c.btnTexte && <div style={{ marginTop: 28 }}><Lien v={c.btnLien} style={{ ...pilule(false, true), padding: '15px 30px' }}>{c.btnTexte} →</Lien></div>}
            </div>
          </div>
        </div></section>
      );
      case 'reassurance': return c.items && c.items.length ? (
        <section style={{ padding: '22px 0 0' }}><div style={wrap}>
          <div className="al-reass" style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 22, padding: '16px 24px' }}>
            {c.items.map((it: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 15, color: t.tx }}>{it.icone && <span style={{ fontSize: 24 }}>{it.icone}</span>}<span>{it.texte}</span></div>)}
          </div>
        </div></section>
      ) : null;
      case 'categories': return accueil.categories.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="al-cats">{accueil.categories.slice(0, 8).map((x, i) => {
            const couleurs = [t.rouge, t.bleu, t.ac, t.sombre];
            const cc = couleurs[i % couleurs.length];
            return (
              <button key={x.nom} className="al-tuile" onClick={() => versCategorie(x.nom)} style={{ background: cc, color: surCouleur(cc), border: 'none', borderRadius: 22, padding: '30px 20px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                <span aria-hidden="true" style={{ position: 'absolute', right: -24, bottom: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.18)' }} />
                <span style={{ display: 'block', fontFamily: t.titre, fontSize: 28, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05 }}>{x.nom}</span>
                <span style={{ display: 'block', fontSize: 13, marginTop: 8, opacity: .85 }}>{x.n} annonce{x.n > 1 ? 's' : ''}</span>
              </button>);
          })}</div>
        </div></section>
      ) : null;
      case 'vedettes': { const v = tous.filter((a) => a.vedette); const liste = v.concat(tous.filter((a) => !a.vedette)).slice(0, Number(c.nombre) || 8); return liste.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel couleur={t.bleu} fond={t.carte}>{liste.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</Carrousel>
        </div></section>
      ) : null; }
      case 'apropos': return (c.titre || c.texte) ? (
        <section style={sec}><div style={{ ...wrap, textAlign: 'center' }}>
          {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(40px,7vw,76px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, margin: 0, ...degradeTexte(t) }}>{c.titre}</h2>}
          {c.texte && <p style={{ fontSize: 'clamp(16px,2vw,19px)', lineHeight: 1.7, color: t.doux, margin: '18px auto 0', maxWidth: 640, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          {c.btnTexte && <div style={{ marginTop: 26 }}><Lien v={c.btnLien} style={pilule(false)}>{c.btnTexte} →</Lien></div>}
        </div></section>
      ) : null;
      case 'promos': { const its: any[] = (c.items || []).filter((x: any) => x.titre || x.image); if (!its.length) return null;
        const fonds = [`linear-gradient(135deg, ${t.sombre}, ${t.bleu})`, `linear-gradient(135deg, ${t.bleu}, ${t.ac})`, `linear-gradient(135deg, ${t.rouge}, ${t.ac})`];
        const bloc = (it: any, i: number, grand: boolean) => (
          <Cadre key={i} v={it.lien} style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, minHeight: grand ? 'clamp(280px,34vw,400px)' : 190, flex: grand ? undefined : 1, background: fonds[i % 3], color: '#fff', display: 'flex', alignItems: 'flex-end' }}>
            {it.image && <img src={it.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent 65%)' }} />
            <div style={{ position: 'relative', padding: grand ? 'clamp(20px,3vw,34px)' : 22 }}>
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: grand ? 'clamp(30px,4vw,48px)' : 28, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, margin: 0 }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: grand ? 17 : 15, margin: '8px 0 0', opacity: .92 }}>{it.texte}</p>}
              {it.btnTexte && lienOk(it.lien, [...SECTION_IDS]) && <span style={{ display: 'inline-block', marginTop: 14, background: '#fff', color: '#111', fontWeight: 800, fontSize: 14, padding: '9px 20px', borderRadius: 999 }}>{it.btnTexte} →</span>}
            </div>
          </Cadre>);
        return (
          <section style={sec}><div style={wrap}>
            <div className={its.length > 1 ? 'al-promos' : ''} style={{ display: 'grid', gap: 16 }}>
              {bloc(its[0], 0, true)}
              {its.length > 1 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{its.slice(1).map((it, i) => bloc(it, i + 1, false))}</div>}
            </div>
          </div></section>
        ); }
      case 'annonces': return (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Que cherchez-vous ?" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFiltre({ q: q.trim() })} maxLength={80} />
            <input style={{ ...champ, flex: '0 1 180px' }} placeholder="Ville ou région" value={f.lieu} onChange={(e) => setFiltre({ lieu: e.target.value })} maxLength={60} />
            <button onClick={() => setFiltre({ q: q.trim() })} style={{ ...pilule(true), cursor: 'pointer', fontFamily: 'inherit', padding: '0 28px' }}>Chercher</button>
            <select value={f.tri} onChange={(e) => setFiltre({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récentes</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
          </div>
          {cat.categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
              {[{ nom: '', n: cat.categories.reduce((s, x) => s + x.n, 0) }, ...cat.categories].map((x) => (
                <button key={x.nom || 'toutes'} onClick={() => setFiltre({ categorie: x.nom })} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${f.categorie === x.nom ? t.rouge : t.trait}`, background: f.categorie === x.nom ? t.rouge : t.carte, color: f.categorie === x.nom ? surRouge : t.tx, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{x.nom || 'Toutes'} ({x.n})</button>))}
            </div>
          )}
          {cat.demo && <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '10px 14px', color: '#92400e', fontSize: 13, marginBottom: 18 }}>Aperçu avec des annonces d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
          {!cat.loading && cat.annonces.length === 0
            ? <p style={{ textAlign: 'center', color: t.doux, padding: '40px 0' }}>{c.vide || 'Aucune annonce ne correspond.'}</p>
            : <div className="al-grille">{cat.annonces.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>}
          {cat.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
              <span style={{ fontSize: 14, color: t.doux }}>Page {f.page} / {cat.pages}</span>
              <button disabled={f.page >= cat.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= cat.pages ? .4 : 1 }}>Suivant →</button>
            </div>
          )}
        </div></section>
      );
      case 'mise': return (c.titre || c.titreDroite || c.imageGauche || c.imageDroite) ? (
        <section style={{ padding: 'clamp(20px,4vw,40px) 0 0' }}>
          <div className="al-mise">
            <div style={{ position: 'relative', background: t.sombre, color: '#fff', minHeight: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 'clamp(26px,5vw,60px)' }}>
              {c.imageGauche && <img src={c.imageGauche} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '62%', objectFit: 'cover', maskImage: 'linear-gradient(to top, #000 55%, transparent)', WebkitMaskImage: 'linear-gradient(to top, #000 55%, transparent)' }} />}
              <div style={{ position: 'relative' }}>
                {c.etiquette && <p style={{ fontSize: 13, letterSpacing: '.14em', fontWeight: 700, margin: '0 0 12px', opacity: .8 }}>{c.etiquette}</p>}
                {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(34px,5vw,56px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.02, margin: 0 }}>{c.titre}</h2>}
                {c.btnTexte && <div style={{ marginTop: 22 }}><Lien v={c.btnLien} style={{ background: '#fff', color: '#111', fontWeight: 800, fontSize: 15, padding: '12px 26px', borderRadius: 999 }}>{c.btnTexte} →</Lien></div>}
              </div>
            </div>
            <div style={{ background: t.carte, padding: 'clamp(26px,5vw,60px)' }}>
              {c.titreDroite && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(30px,4.4vw,48px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, margin: 0, ...degradeTexte(t) }}>{c.titreDroite}</h2>}
              {c.texteDroite && <p style={{ fontSize: 17, lineHeight: 1.7, color: t.doux, margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>{c.texteDroite}</p>}
              {c.imageDroite && <img src={c.imageDroite} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 20, marginTop: 24 }} />}
            </div>
          </div>
        </section>
      ) : null;
      case 'actus': return c.items && c.items.length ? (
        <section style={{ background: t.sombre, color: '#fff', padding: 'clamp(36px,6vw,72px) 0', marginTop: 'clamp(30px,5vw,60px)' }}><div style={wrap}>
          <EnTete c={c} t={t} clair droite={c.btnTexte && lienOk(c.btnLien, [...SECTION_IDS]) ? <Lien v={c.btnLien} style={{ color: '#fff', fontWeight: 800, fontSize: 15, background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}>{c.btnTexte} →</Lien> : undefined} />
          <Carrousel couleur={t.bleu} fond="#fff">{c.items.map((it: any, i: number) => (
            <Cadre key={i} v={it.lien} style={{ background: '#fff', color: '#14171f', borderRadius: 18, overflow: 'hidden', height: '100%' }}>
              <div style={{ aspectRatio: '4 / 3', background: `linear-gradient(135deg, ${[t.rouge, t.bleu, t.ac][i % 3]}, ${t.sombre})` }}>{it.image && <img src={it.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
              <div style={{ padding: '14px 16px 18px' }}>
                {it.date && <p style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px' }}>{it.date}</p>}
                {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 22, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.15, margin: 0 }}>{it.titre}</h3>}
                {it.categorie && <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: t.bleu, margin: '14px 0 0' }}>{it.categorie}</p>}
              </div>
            </Cadre>))}</Carrousel>
        </div></section>
      ) : null;
      case 'contact': return (
        <section style={sec}><div style={wrap}>
          <div className="al-comp" style={{ background: t.sombre, color: '#fff', borderRadius: 30, padding: 'clamp(22px,4vw,48px)' }}>
            <div>
              {c.surtitre && <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(32px,4.6vw,52px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17 }}>📞 {cfg.telephone}</a>}
                {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}>✉️ {cfg.courriel}</a>}
                {cfg.adresse && <p style={{ margin: 0, color: 'rgba(255,255,255,.8)' }}>📍 {cfg.adresse}</p>}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 22, padding: 24, color: '#1f2937' }}><FormulaireSite gid={gid} couleur={t.bleu} police={t.corps} /></div>
          </div>
        </div></section>
      );
    }
  };

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }} onClick={() => { if (politiques.statut !== 'ferme') politiques.fermer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 44, objectFit: 'contain' }} />
        : <span style={{ fontFamily: t.titre, fontSize: 36, fontWeight: 900, letterSpacing: t.il, color: surRouge, whiteSpace: 'nowrap' }}>{cfg.nomSite}</span>}
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
      <style>{`${CSS_CARROUSEL}
        .al-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.al-cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .al-reass{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .al-promos{grid-template-columns:1.7fr 1fr}.al-mise{display:grid;grid-template-columns:1fr 1fr}
        .al-comp{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(20px,4vw,48px);align-items:center}
        .al-carte{transition:box-shadow .2s,transform .2s}.al-carte:hover{box-shadow:0 14px 34px rgba(0,0,0,.14);transform:translateY(-3px)}
        .al-tuile{transition:transform .2s}.al-tuile:hover{transform:translateY(-3px)}
        @media(prefers-reduced-motion:reduce){.al-carte,.al-tuile{transition:none}.al-carte:hover,.al-tuile:hover{transform:none}}
        .al-nav{display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap}.al-burger{display:none}.al-cta{display:flex}
        @media(max-width:980px){.al-grille,.al-cats,.al-reass{grid-template-columns:repeat(2,minmax(0,1fr))}.al-promos,.al-mise,.al-comp{grid-template-columns:1fr}.al-nav{display:none}.al-burger{display:block}.al-cta{display:none}}
        @media(max-width:560px){.al-grille{gap:12px}.al-reass{grid-template-columns:1fr}}
        *{box-sizing:border-box}img{display:block;max-width:100%}input::placeholder{color:${alpha(t.tx, .45)}}`}</style>

      {ent && ent.texte && (
        <div style={{ background: t.bleu, color: surBleu, fontSize: 14, fontWeight: 600 }}>
          <div style={{ ...wrap, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, minHeight: 38, flexWrap: 'wrap', padding: '6px 24px', textAlign: 'center' }}>
            <span>{ent.texte}</span>
            {ent.lienTexte && <Lien v={ent.lien} style={{ background: 'none', border: 'none', color: surBleu, fontWeight: 800, textDecoration: 'underline', padding: 0, fontSize: 14 }}>{ent.lienTexte}</Lien>}
          </div>
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: t.rouge, color: surRouge, boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', gap: 18, minHeight: 74 }}>
          {logo}
          <div className="al-cta" style={{ flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 999, padding: 4, width: '100%', maxWidth: 480 }}>
              <select aria-label="Catégorie" value={catRech} onChange={(e) => setCatRech(e.target.value)} style={{ border: 'none', background: '#f1f1f4', color: '#222', borderRadius: 999, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', maxWidth: 130 }}>
                <option value="">Tout</option>{accueil.categories.map((x) => <option key={x.nom} value={x.nom}>{x.nom}</option>)}
              </select>
              <input aria-label="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && chercher()} maxLength={80} placeholder="Rechercher une annonce…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '0 12px', fontSize: 15, fontFamily: 'inherit', color: '#222', background: 'transparent' }} />
              <button aria-label="Lancer la recherche" onClick={chercher} style={{ border: 'none', background: t.bleu, color: surBleu, width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>🔍</button>
            </div>
          </div>
          {ent && ent.ctaTexte && lienOk(ent.ctaLien, [...SECTION_IDS]) && (
            <Lien className="al-cta" v={ent.ctaLien} style={{ background: 'rgba(0,0,0,.18)', color: surRouge, borderRadius: 999, padding: '9px 22px', textAlign: 'left', border: 'none', lineHeight: 1.2 }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>{ent.ctaTexte}</span>
              {ent.ctaSous && <span style={{ display: 'block', fontSize: 12, opacity: .85 }}>{ent.ctaSous}</span>}
            </Lien>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <div className="al-cta" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${alpha(surRouge, .5)}`, color: surRouge, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="al-burger" aria-label="Menu" onClick={() => setMenu((v) => !v)} style={{ background: 'none', border: `1.5px solid ${alpha(surRouge, .5)}`, borderRadius: 10, color: surRouge, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {nav.length > 0 && <div style={{ background: alpha('#000000', .14) }}><nav className="al-nav" style={{ ...wrap, minHeight: 46 }}>{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 700, color: surRouge, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav></div>}
        {menu && <div className="al-burger" style={{ borderTop: `1px solid ${alpha(surRouge, .3)}`, padding: '8px 24px 14px', background: t.rouge }}>
          <div style={{ display: 'flex', gap: 8, margin: '8px 0 6px' }}><input aria-label="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setMenu(false); chercher(); } }} placeholder="Rechercher…" maxLength={80} style={{ flex: 1, minWidth: 0, border: 'none', borderRadius: 999, padding: '10px 14px', fontSize: 15, fontFamily: 'inherit' }} /><button onClick={() => { setMenu(false); chercher(); }} style={{ border: 'none', background: t.bleu, color: surBleu, borderRadius: 999, padding: '0 16px', fontWeight: 800, cursor: 'pointer' }}>OK</button></div>
          {nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: surRouge, padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={t.bleu} police={t.corps} /></div>
        : visibles.filter((x) => x.id !== 'entete').map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 130 }}>{el}</div> : null; })}

      <div style={{ height: 'clamp(30px,5vw,60px)' }} />
      <Pied nom={cfg.nomSite} fond={t.sombre} texteLibre={cfg.piedTexte} avis={PROFIL_GENERAL.avis} reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />

      {ouverte && <Detail a={ouverte} gid={gid} demo={accueil.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: t.rouge, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_GENERAL} onClose={() => setOuverte(null)} />}
    </div>
  );
}