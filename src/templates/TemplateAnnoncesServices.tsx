// src/templates/TemplateAnnoncesServices.tsx
// e-Vend Studio — Petites annonces « Néo Services » (emplois et services, fond noir, bleu néon) — affichage seulement, aucune transaction.
// Bannière avec formulaire de demande, bande bleue de 3 cartes, chiffres, catégories, annonces (filtres nature / contrat / lieu),
// histoire, étapes, forfaits, témoignages, bande de photos, FAQ, contact. Tout est configurable dans Mes annonces → Apparence (config.annonces).
// Une entreprise qui veut se présenter elle-même utilise plutôt les templates Vitrine. Pied de page, politiques et contact : annoncesSite/pied.tsx et contactSite.tsx.

import { useState, useMemo, useEffect } from 'react';
import { useAnnonces, fmtPrix, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail, type ProfilAnnonces } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { Carrousel, CSS_CARROUSEL } from './annoncesSite/carrousel';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { alpha, surCouleur, foncer } from './annoncesSite/couleurs';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/servicesConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

// ─── Profil « emplois et services » : annonces d'exemple, filtres, fiche détaillée ───
const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const v = (id: number, titre: string, description: string, prix: number | null, prixTexte: string, categorie: string, lieu: string, jours: number, details: Record<string, string>, vedette = false): AnnoncePub => ({
  id, titre, description, prix, prixTexte, categorie, lieu, photos: [], details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const DEMO: AnnoncePub[] = [
  v(1, 'Rénovation de salles de bain — soumission gratuite', 'Équipe d\'expérience, travaux propres et dans les délais. Plomberie, céramique, meuble-lavabo. Estimation gratuite sur place.', null, 'Soumission gratuite', 'Rénovation et construction', 'Québec', 1, { Nature: 'Service offert', Entreprise: 'Rénovations Bélanger', 'Zone desservie': 'Québec et Lévis', Disponibilité: 'Dès la semaine prochaine', Certification: 'Licence RBQ' }, true),
  v(2, 'Électricien de métier — temps plein', 'Nous recherchons un électricien pour chantiers résidentiels. Véhicule fourni, assurances collectives, horaires de jour.', null, '32 $ à 42 $ / h', 'Emploi — Offres', 'Lévis', 2, { Nature: 'Offre d\'emploi', Contrat: 'Temps plein', Entreprise: 'Électro Services Lévis', Expérience: '3 ans et plus', Échéance: 'Fin du mois' }, true),
  v(3, 'Entretien de pelouse et déneigement', 'Forfaits saisonniers pour résidences et petits commerces. Service fiable, tarifs clairs.', 49, 'À partir de 49 $', 'Entretien et paysagement', 'Sherbrooke', 3, { Nature: 'Service offert', Entreprise: 'Vert Hiver Entretien', 'Zone desservie': 'Sherbrooke et environs', Disponibilité: 'Toute l\'année' }),
  v(4, 'Aide-cuisinier — temps partiel', 'Restaurant familial cherche aide-cuisinier, soirs et fins de semaine. Formation sur place.', null, '18 $ / h', 'Emploi — Offres', 'Montréal', 4, { Nature: 'Offre d\'emploi', Contrat: 'Temps partiel', Entreprise: 'Bistro du Coin', Expérience: 'Débutant accepté' }),
  v(5, 'Tutorat en mathématiques — secondaire et cégep', 'Séances individuelles en personne ou en ligne. Préparation aux examens, suivi des progrès.', 45, '45 $ / h', 'Cours et tutorat', 'Trois-Rivières', 6, { Nature: 'Service offert', 'Zone desservie': 'En ligne et Trois-Rivières', Disponibilité: 'Soirs et fins de semaine' }),
  v(6, 'Déménagement local et livraison', 'Camion avec deux déménageurs, emballage disponible. Assurance responsabilité incluse.', 120, 'À partir de 120 $ / h', 'Transport et livraison', 'Montréal', 8, { Nature: 'Service offert', Entreprise: 'Déménagement Express', 'Zone desservie': 'Grand Montréal', Disponibilité: '7 jours sur 7' }),
  v(7, 'Recherche travail de jardinage — été', 'Étudiant fiable cherche contrats de jardinage et entretien extérieur pour la saison.', null, 'Selon tarif horaire', 'Entretien et paysagement', 'Québec', 9, { Nature: 'Recherche d\'emploi', Contrat: 'Saisonnier', Disponibilité: 'Mai à septembre' }),
  v(8, 'Conception de site web pour petite entreprise', 'Site clair, rapide et adapté au mobile. Textes, photos et formation inclus.', 899, 'À partir de 899 $', 'Informatique et web', 'À distance', 11, { Nature: 'Service offert', Entreprise: 'Studio Pixel', 'Zone desservie': 'Partout au Québec', Disponibilité: 'Délai de 3 semaines' }),
];
const EMOJI_CAT: [RegExp, string][] = [[/emploi/i, '💼'], [/r[ée]novation|construction/i, '🔨'], [/entretien|paysag/i, '🌿'], [/transport|livraison/i, '🚚'], [/cours|tutorat/i, '🎓'], [/beaut|bien-?[eê]tre/i, '💆'], [/informatique|web/i, '💻'], [/[ée]v[ée]nement/i, '🎉'], [/restaur/i, '🍽️'], [/domicile/i, '🏠']];
const emojiDe = (cat: string) => (EMOJI_CAT.find(([r]) => r.test(cat)) || [null, '✨'])[1];

export const PROFIL_SERVICES: ProfilAnnonces = {
  icone: '💼',
  recherche: 'Service, métier, emploi…',
  lieuPlaceholder: 'Ville ou région',
  defaut: { nomSite: 'Néo Services', slogan: 'Services et emplois près de chez vous', logoUrl: '', couleurPrincipale: '#2f3bff', couleurFond: '#05050a', police: 'moderne', apropos: '', email: '', telephone: '' },
  demo: DEMO,
  selects: [{ cle: 'Nature', label: 'Nature de l\'annonce' }, { cle: 'Contrat', label: 'Type de contrat' }],
  plages: [],
  puces: (a) => [a.details['Nature'], a.details['Contrat'], a.details['Zone desservie']].filter(Boolean) as string[],
  avis: "Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les ententes et les paiements se font directement avec l'annonceur. Vérifiez les licences, références et conditions avant de vous engager.",
  groupes: [
    { titre: 'Résumé', cles: ['Nature', 'Entreprise', 'Contrat', 'Rémunération'] },
    { titre: 'Détails', cles: ['Zone desservie', 'Disponibilité', 'Expérience', 'Certification', 'Échéance'] },
  ],
};

const POLICES = {
  geometrique: { corps: "'Poppins', sans-serif", titre: "'Poppins', sans-serif", poids: 700, interlettre: '-.02em' },
  moderne:     { corps: "'Inter', sans-serif",   titre: "'Inter', sans-serif",   poids: 800, interlettre: '-.03em' },
  arrondie:    { corps: "'Nunito', sans-serif",  titre: "'Nunito', sans-serif",  poids: 900, interlettre: '-.01em' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

type Th = { ac: string; ne: string; fond: string; carte: string; tx: string; doux: string; trait: string; surAc: string; titre: string; corps: string; poids: number; il: string };

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}

function EnTete({ c, t, centre = true }: { c: Record<string, any>; t: Th; centre?: boolean }) {
  if (!c.surtitre && !c.titre && !c.texte) return null;
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: 30 }}>
      {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ne, margin: '0 0 8px', textShadow: `0 0 16px ${alpha(t.ne, .6)}` }}>{c.surtitre}</p>}
      {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.4vw,46px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.12, color: t.tx, margin: 0 }}>{c.titre}</h2>}
      {c.texte && <p style={{ fontSize: 17, lineHeight: 1.65, color: t.doux, margin: '12px auto 0', maxWidth: 700, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
    </div>
  );
}

function Carte({ a, t, onOuvrir }: { a: AnnoncePub; t: Th; onOuvrir: (a: AnnoncePub) => void }) {
  const prix = a.prix != null || a.prixTexte ? fmtPrix(a) : '';
  return (
    <article className="ns-carte" onClick={() => onOuvrir(a)} style={{ cursor: 'pointer', background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 10', background: `linear-gradient(135deg, ${alpha(t.ac, .55)}, ${alpha(t.ne, .25)} 70%, ${t.carte})` }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, filter: `drop-shadow(0 0 18px ${alpha(t.ne, .6)})` }}>{emojiDe(a.categorie)}</div>}
        {a.details['Nature'] && <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(5,5,10,.78)', border: `1px solid ${alpha(t.ne, .6)}`, color: t.ne, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{a.details['Nature']}</span>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, right: 10, background: t.ac, color: t.surAc, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>★</span>}
      </div>
      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: 12, color: t.doux, margin: '0 0 4px' }}>{[a.categorie, a.lieu].filter(Boolean).join(' · ')}</p>
        <h3 style={{ fontFamily: t.titre, fontSize: 18, fontWeight: t.poids, letterSpacing: t.il, color: t.tx, margin: '0 0 10px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        {a.details['Entreprise'] && <p style={{ fontSize: 13, color: t.doux, margin: '0 0 8px' }}>{a.details['Entreprise']}</p>}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: t.tx }}>{prix}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.ne }}>Voir l'annonce →</span>
        </div>
      </div>
    </article>
  );
}

export default function TemplateAnnoncesServices({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const tx = cfg.couleurTexte;
  const t: Th = { ac: cfg.couleurPrincipale, ne: cfg.couleurSecondaire, fond: cfg.couleurFond, carte: cfg.couleurCarte, tx, doux: alpha(tx, .68), trait: alpha(tx, .13), surAc: surCouleur(cfg.couleurPrincipale), titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre };
  const clair = foncer(t.ac, 0.85);
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);

  const accueil = useAnnonces(gid, DEMO, FILTRES_VIDES, []);
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const cat = useAnnonces(gid, DEMO, f, ['Nature', 'Contrat']);
  const setFiltre = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const setDetail = (k: string, val: string) => setFiltre({ d: { ...(f.d || {}), [k]: val } });
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const versCategorie = (nom: string) => { setFiltre({ categorie: nom }); allerA('annonces'); };

  const visibles = cfg.sections.filter((x) => x.visible);
  const ent = visibles.some((x) => x.id === 'entete') ? cfg.contenu.entete : null;
  const nav = visibles.filter((x) => x.id !== 'entete' && (x.label || SECTIONS_INFO[x.id].navDefaut));
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(40px,6vw,80px) 0' };
  const bouton = (plein: boolean): React.CSSProperties => ({ padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, background: plein ? t.ac : '#fff', color: plein ? t.surAc : '#111', border: 'none', boxShadow: plein ? `0 0 26px ${alpha(t.ac, .55)}` : 'none' });
  const champ: React.CSSProperties = { padding: '12px 16px', border: `1.5px solid ${t.trait}`, borderRadius: 12, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, val]) => val) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };
  const bande: React.CSSProperties = { background: t.ac, color: t.surAc };

  const tous = accueil.annonces;
  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'entete': return null;   // rendu tout en haut de la page
      case 'hero': return (
        <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(40px,6vw,80px) 0' }}>
          <div aria-hidden="true" style={{ position: 'absolute', right: '-10%', top: '-10%', width: '60%', aspectRatio: '1', background: `radial-gradient(circle, ${alpha(t.ac, .55)}, ${alpha(t.ne, .18)} 45%, transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
          {c.image && <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', objectFit: 'cover', opacity: .35, maskImage: 'linear-gradient(to left, #000 30%, transparent)', WebkitMaskImage: 'linear-gradient(to left, #000 30%, transparent)' }} />}
          <div className="ns-hero" style={{ ...wrap, position: 'relative' }}>
            <div>
              <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(38px,6vw,68px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.05, color: t.tx, margin: 0 }}>
                {c.titre}{c.titre && c.titreAccent ? ' ' : ''}{c.titreAccent && <span style={{ color: t.ne, textShadow: `0 0 34px ${alpha(t.ne, .55)}` }}>{c.titreAccent}</span>}
              </h1>
              {c.texte && <p style={{ fontSize: 18, lineHeight: 1.65, color: t.doux, margin: '20px 0 0', maxWidth: 560, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              {c.puces && c.puces.length > 0 && <ul style={{ listStyle: 'none', padding: 0, margin: '22px 0 0', display: 'grid', gap: 10 }}>{c.puces.map((p: string, i: number) => <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: t.tx }}><span aria-hidden="true" style={{ flex: '0 0 18px', height: 18, marginTop: 2, borderRadius: '50%', background: '#22c55e', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(34,197,94,.6)' }}>✓</span><span>{p}</span></li>)}</ul>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
                {c.btnTexte && <Lien v={c.btnLien} style={bouton(true)}>{c.btnTexte}</Lien>}
                {c.btn2Texte && <Lien v={c.btn2Lien} style={bouton(false)}>{c.btn2Texte}</Lien>}
              </div>
            </div>
            <div style={{ position: 'relative', borderRadius: 22, padding: 2, background: `linear-gradient(135deg, ${t.ne}, ${t.ac})`, boxShadow: `0 0 50px ${alpha(t.ac, .45)}` }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(18px,3vw,28px)', color: '#1f2937' }}>
                {c.formTitre && <h2 style={{ fontFamily: t.titre, fontSize: 22, fontWeight: 800, letterSpacing: t.il, margin: '0 0 14px', color: '#111827' }}>{c.formTitre}</h2>}
                <FormulaireSite gid={gid} couleur={clair} police={t.corps} />
              </div>
            </div>
          </div>
        </section>
      );
      case 'piliers': return (c.titre || (c.items && c.items.length)) ? (
        <section style={{ ...bande, padding: 'clamp(40px,6vw,76px) 0' }}><div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, margin: 0 }}>{c.titre}</h2>}
            {c.sousTitre && <p style={{ fontSize: 18, margin: '12px 0 0', opacity: .92 }}>{c.sousTitre}</p>}
            {c.texte && <p style={{ fontSize: 16, lineHeight: 1.65, margin: '10px auto 0', maxWidth: 760, opacity: .88, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          </div>
          <div className="ns-g3">{(c.items || []).map((it: any, i: number) => (
            <div key={i} style={{ background: alpha('#ffffff', .1), border: `1px solid ${alpha('#ffffff', .22)}`, borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
              {it.icone && <div style={{ fontSize: 44, marginBottom: 12 }}>{it.icone}</div>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 21, fontWeight: t.poids, letterSpacing: t.il, margin: '0 0 8px' }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: .9, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
            </div>))}</div>
        </div></section>
      ) : null;
      case 'chiffres': return c.items && c.items.length ? (
        <section style={{ padding: '34px 0' }}><div style={wrap}>
          <div className="ns-chiffres">{c.items.map((it: any, i: number) => <div key={i} style={{ textAlign: 'center' }}><div style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,40px)', fontWeight: t.poids, color: t.ne, textShadow: `0 0 22px ${alpha(t.ne, .55)}` }}>{it.valeur}</div><div style={{ fontSize: 14, color: t.doux, marginTop: 4 }}>{it.label}</div></div>)}</div>
        </div></section>
      ) : null;
      case 'categories': return accueil.categories.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="ns-g4">{accueil.categories.slice(0, 8).map((x) => (
            <button key={x.nom} className="ns-tuile" onClick={() => versCategorie(x.nom)} style={{ background: t.carte, border: `1.5px solid ${alpha(t.ne, .45)}`, borderRadius: 20, padding: '26px 18px', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 38, marginBottom: 10, filter: `drop-shadow(0 0 12px ${alpha(t.ne, .5)})` }}>{emojiDe(x.nom)}</span>
              <span style={{ display: 'block', fontFamily: t.titre, fontSize: 17, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.2 }}>{x.nom}</span>
              <span style={{ display: 'block', fontSize: 13, color: t.ne, marginTop: 6 }}>{x.n} annonce{x.n > 1 ? 's' : ''}</span>
            </button>))}</div>
        </div></section>
      ) : null;
      case 'vedettes': { const vd = tous.filter((a) => a.vedette); const liste = vd.concat(tous.filter((a) => !a.vedette)).slice(0, Number(c.nombre) || 6); return liste.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel couleur={t.ac} fond={t.carte}>{liste.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</Carrousel>
        </div></section>
      ) : null; }
      case 'annonces': return (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Service, métier, emploi…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFiltre({ q: q.trim() })} maxLength={80} />
            <input style={{ ...champ, flex: '0 1 180px' }} placeholder="Ville ou région" value={f.lieu} onChange={(e) => setFiltre({ lieu: e.target.value })} maxLength={60} />
            <button onClick={() => setFiltre({ q: q.trim() })} style={{ ...bouton(true), cursor: 'pointer', fontFamily: 'inherit', padding: '0 28px' }}>Chercher</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['Nature', 'Contrat'] as const).map((k) => { const opts = (cat.facettes && cat.facettes[k]) || []; return opts.length ? (
              <select key={k} aria-label={k} value={(f.d || {})[k] || ''} onChange={(e) => setDetail(k, e.target.value)} style={champ}><option value="">{k === 'Nature' ? 'Toutes les natures' : 'Tous les contrats'}</option>{opts.map((o) => <option key={o.nom} value={o.nom}>{o.nom} ({o.n})</option>)}</select>
            ) : null; })}
            <select aria-label="Tri" value={f.tri} onChange={(e) => setFiltre({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récentes</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
          </div>
          {cat.categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
              {[{ nom: '', n: cat.categories.reduce((s, x) => s + x.n, 0) }, ...cat.categories].map((x) => (
                <button key={x.nom || 'toutes'} onClick={() => setFiltre({ categorie: x.nom })} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${f.categorie === x.nom ? t.ne : t.trait}`, background: f.categorie === x.nom ? alpha(t.ne, .18) : 'transparent', color: f.categorie === x.nom ? t.ne : t.tx, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{x.nom || 'Toutes'} ({x.n})</button>))}
            </div>
          )}
          {cat.demo && <div style={{ background: 'rgba(252,211,77,.12)', border: '1px solid #fcd34d', borderRadius: 12, padding: '10px 14px', color: '#fde68a', fontSize: 13, marginBottom: 18 }}>Aperçu avec des annonces d'exemple. Vos vraies annonces s'afficheront ici une fois ajoutées dans « Mes annonces ».</div>}
          {!cat.loading && cat.annonces.length === 0
            ? <p style={{ textAlign: 'center', color: t.doux, padding: '40px 0' }}>{c.vide || 'Aucune annonce ne correspond.'}</p>
            : <div className="ns-g3">{cat.annonces.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>}
          {cat.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
              <span style={{ fontSize: 14, color: t.doux }}>Page {f.page} / {cat.pages}</span>
              <button disabled={f.page >= cat.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= cat.pages ? .4 : 1 }}>Suivant →</button>
            </div>
          )}
        </div></section>
      );
      case 'histoire': return (c.titre || c.texte || c.image) ? (
        <section style={sec}><div className="ns-duo" style={wrap}>
          <div style={{ borderRadius: 22, overflow: 'hidden', aspectRatio: '4 / 4.4', background: `linear-gradient(135deg, ${t.ac}, ${t.ne} 60%, ${t.fond})`, boxShadow: `0 0 50px ${alpha(t.ac, .35)}` }}>
            {c.image && <img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,42px)', fontWeight: t.poids, letterSpacing: t.il, margin: 0, color: t.tx }}>{c.titre}</h2>}
            {c.texte && <p style={{ fontSize: 16, lineHeight: 1.8, color: t.doux, margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            {c.btnTexte && <div style={{ marginTop: 24 }}><Lien v={c.btnLien} style={bouton(true)}>{c.btnTexte}</Lien></div>}
          </div>
        </div></section>
      ) : null;
      case 'etapes': return (c.titre || (c.items && c.items.length)) ? (
        <section style={sec}><div className="ns-duo" style={wrap}>
          <div style={{ borderRadius: 22, overflow: 'hidden', aspectRatio: '4 / 4.4', background: `linear-gradient(135deg, ${t.carte}, ${t.ac})`, boxShadow: `0 0 50px ${alpha(t.ne, .25)}` }}>
            {c.image && <img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,42px)', fontWeight: t.poids, letterSpacing: t.il, margin: 0, color: t.tx }}>{c.titre}</h2>}
            {c.texte && <p style={{ fontSize: 16, lineHeight: 1.7, color: t.doux, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            <ol style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 18 }}>{(c.items || []).map((it: any, i: number) => (
              <li key={i} style={{ display: 'flex', gap: 14 }}>
                <span style={{ flex: '0 0 34px', height: 34, borderRadius: '50%', background: alpha(t.ne, .14), border: `1.5px solid ${t.ne}`, color: t.ne, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${alpha(t.ne, .4)}` }}>{i + 1}</span>
                <span><strong style={{ display: 'block', fontSize: 17, color: t.tx }}>{it.titre}</strong>{it.texte && <span style={{ fontSize: 15, lineHeight: 1.6, color: t.doux }}>{it.texte}</span>}</span>
              </li>))}</ol>
          </div>
        </div></section>
      ) : null;
      case 'forfaits': return c.items && c.items.length ? (
        <section style={{ ...bande, padding: 'clamp(40px,6vw,76px) 0' }}><div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 8px', opacity: .85 }}>{c.surtitre}</p>}
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, margin: 0 }}>{c.titre}</h2>}
            {c.texte && <p style={{ fontSize: 16, margin: '10px auto 0', maxWidth: 700, opacity: .9, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
          </div>
          <div className="ns-g3">{c.items.map((it: any, i: number) => (
            <div key={i} style={{ background: i === 1 ? '#fff' : alpha('#000000', .22), color: i === 1 ? '#111' : 'inherit', border: `1px solid ${alpha('#ffffff', .25)}`, borderRadius: 20, padding: '28px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {it.icone && <div style={{ fontSize: 40, marginBottom: 8 }}>{it.icone}</div>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 22, fontWeight: t.poids, letterSpacing: t.il, margin: '0 0 8px' }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: .85, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
              {it.prix && <p style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 0' }}>{it.prix}</p>}
              {it.btnTexte && <div style={{ marginTop: 16 }}><Lien v={it.lien} style={{ padding: '11px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: i === 1 ? t.ac : '#fff', color: i === 1 ? t.surAc : '#111', border: 'none' }}>{it.btnTexte}</Lien></div>}
            </div>))}</div>
        </div></section>
      ) : null;
      case 'temoignages': return c.items && c.items.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="ns-g3">{c.items.map((it: any, i: number) => (
            <figure key={i} style={{ margin: 0, background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 20, padding: '26px 24px' }}>
              <div aria-label="5 étoiles" style={{ color: '#fbbf24', letterSpacing: 3, marginBottom: 10 }}>★★★★★</div>
              <blockquote style={{ margin: 0, fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: t.tx, whiteSpace: 'pre-wrap' }}>« {it.texte} »</blockquote>
              {it.auteur && <figcaption style={{ marginTop: 14, fontSize: 14, color: t.doux }}>— {it.auteur}</figcaption>}
            </figure>))}</div>
        </div></section>
      ) : null;
      case 'galerie': return c.items && c.items.filter((x: any) => x.image).length ? (
        <section style={{ padding: '10px 0 40px' }}><div style={wrap}>
          <div className="ns-bande">{c.items.filter((x: any) => x.image).map((x: any, i: number) => <img key={i} src={x.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ height: 170, width: 'auto', borderRadius: 16, objectFit: 'cover', flex: '0 0 auto' }} />)}</div>
        </div></section>
      ) : null;
      case 'faq': return c.items && c.items.length ? (
        <section style={sec}><div style={{ ...wrap, maxWidth: 840 }}>
          <EnTete c={c} t={t} />
          <div style={{ display: 'grid', gap: 12 }}>{c.items.map((it: any, i: number) => (
            <details key={i} className="ns-faq" style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 16, padding: '4px 22px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 17, padding: '16px 0', color: t.tx, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{it.q}</span><span aria-hidden="true" style={{ color: t.ne, fontSize: 22, lineHeight: 1 }}>＋</span></summary>
              <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.65, color: t.doux, whiteSpace: 'pre-wrap' }}>{it.r}</p>
            </details>))}</div>
        </div></section>
      ) : null;
      case 'contact': return (
        <section style={sec}><div style={wrap}>
          <div className="ns-duo" style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${alpha(t.ne, .4)}`, borderRadius: 28, background: t.carte, padding: 'clamp(22px,4vw,48px)', boxShadow: `0 0 40px ${alpha(t.ac, .25)}` }}>
            <div>
              {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ne, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17 }}><span style={{ color: t.ne }}>📞</span> {cfg.telephone}</a>}
                {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}><span style={{ color: t.ne }}>✉️</span> {cfg.courriel}</a>}
                {cfg.adresse && <p style={{ margin: 0, color: t.doux }}><span style={{ color: t.ne }}>📍</span> {cfg.adresse}</p>}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, color: '#1f2937' }}><FormulaireSite gid={gid} couleur={clair} police={t.corps} /></div>
          </div>
        </div></section>
      );
    }
  };

  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }} onClick={() => { if (politiques.statut !== 'ferme') politiques.fermer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomSite} style={{ height: 40, objectFit: 'contain' }} />
        : <span style={{ fontFamily: t.titre, fontSize: 24, fontWeight: 800, letterSpacing: t.il, color: t.tx, whiteSpace: 'nowrap', textShadow: `0 0 20px ${alpha(t.ne, .5)}` }}>{cfg.nomSite}</span>}
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
      <style>{`${CSS_CARROUSEL}
        .ns-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.ns-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
        .ns-chiffres{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
        .ns-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(24px,5vw,60px);align-items:center}
        .ns-duo{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(24px,5vw,60px);align-items:center}
        .ns-bande{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}
        .ns-carte{transition:border-color .2s,box-shadow .2s,transform .2s}.ns-carte:hover{border-color:${t.ne} !important;box-shadow:0 0 30px ${alpha(t.ne, .3)};transform:translateY(-3px)}
        .ns-tuile{transition:box-shadow .2s,transform .2s}.ns-tuile:hover{box-shadow:0 0 28px ${alpha(t.ne, .35)};transform:translateY(-3px)}
        .ns-faq summary::-webkit-details-marker{display:none}.ns-faq[open]{border-color:${alpha(t.ne, .5)} !important}
        @media(prefers-reduced-motion:reduce){.ns-carte,.ns-tuile{transition:none}.ns-carte:hover,.ns-tuile:hover{transform:none}}
        .ns-nav{display:flex;gap:24px;align-items:center}.ns-burger{display:none}
        @media(max-width:980px){.ns-g3{grid-template-columns:repeat(2,minmax(0,1fr))}.ns-g4,.ns-chiffres{grid-template-columns:repeat(2,minmax(0,1fr))}.ns-hero,.ns-duo{grid-template-columns:1fr}.ns-nav{display:none}.ns-burger{display:block}}
        @media(max-width:600px){.ns-g3{grid-template-columns:1fr}}
        *{box-sizing:border-box}img{display:block;max-width:100%}input::placeholder{color:${alpha(tx, .45)}}select option{color:#111;background:#fff}`}</style>

      {politiques.statut === 'ferme' && ent && (cfg.telephone || cfg.courriel || ent.texte) && (
        <div style={{ ...bande, fontSize: 13, fontWeight: 600 }}>
          <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, minHeight: 38, flexWrap: 'wrap', padding: '6px 24px' }}>
            <span style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {cfg.telephone}</a>}
              {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: 'inherit', textDecoration: 'none', overflowWrap: 'anywhere' }}>✉️ {cfg.courriel}</a>}
            </span>
            {ent.texte && <span>{ent.texte}</span>}
          </div>
        </div>
      )}

      <header style={{ background: alpha(t.fond, .88), position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${t.trait}`, backdropFilter: 'blur(10px)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 70, gap: 16 }}>
          {logo}
          <nav className="ns-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 500, color: t.tx, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ns-nav" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${alpha(t.ne, .5)}`, color: t.tx, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="ns-burger" aria-label="Menu" onClick={() => setMenu((x) => !x)} style={{ background: 'none', border: `1px solid ${t.trait}`, borderRadius: 10, color: t.tx, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {menu && <div className="ns-burger" style={{ borderTop: `1px solid ${t.trait}`, padding: '8px 24px 14px' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: t.tx, padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={clair} police={t.corps} /></div>
        : visibles.filter((x) => x.id !== 'entete').map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 76 }}>{el}</div> : null; })}

      <Pied nom={cfg.nomSite} fond={t.carte} texteLibre={cfg.piedTexte} avis={PROFIL_SERVICES.avis} reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />

      {ouverte && <Detail a={ouverte} gid={gid} demo={accueil.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: clair, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_SERVICES} onClose={() => setOuverte(null)} />}
    </div>
  );
}