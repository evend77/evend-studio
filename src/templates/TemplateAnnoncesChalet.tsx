// src/templates/TemplateAnnoncesChalet.tsx
// e-Vend Studio — Petites annonces « Chalet Boréal » (location de vacances / chalets, fond marine, menthe, vert forêt) — affichage seulement, aucune réservation ni paiement.
// Bannière photo avec recherche de séjour (région, voyageurs), carrousel de chalets, présentation, atouts, régions, liste filtrable
// (région, type, voyageurs, chambres, spa, animaux, prix), avis, activités, étapes, galerie, FAQ, contact. Tout est configurable dans Mes annonces → Apparence (config.annonces).
// Un seul gestionnaire (propriétaire ou gestionnaire de chalets) publie ses propres annonces. Pied de page, politiques et contact : annoncesSite/pied.tsx et contactSite.tsx.

import { useState, useMemo, useEffect } from 'react';
import { useAnnonces, fmtPrix, FILTRES_VIDES, type AnnoncePub, type Filtres } from './annoncesSite/moteur';
import { Detail, type ProfilAnnonces } from './annoncesSite/SiteClassique';
import { usePolitiques, PagePolitique, Pied } from './annoncesSite/pied';
import { FormulaireSite } from './annoncesSite/contactSite';
import { Carrousel, CSS_CARROUSEL } from './annoncesSite/carrousel';
import { lien as lienOk, telHref } from './annoncesSite/autoShowroomConfig';
import { alpha, surCouleur, foncer } from './annoncesSite/couleurs';
import { normaliserConfig, SECTIONS_INFO, SECTION_IDS, type SectionId } from './annoncesSite/chaletConfig';

interface Props { config?: any; siteId?: number; vendeurId?: number; }

// ─── Profil « chalets » : annonces d'exemple, filtres, fiche détaillée ───
const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const ch = (id: number, titre: string, description: string, prix: number, region: string, lieu: string, jours: number, details: Record<string, string>, vedette = false): AnnoncePub => ({
  id, titre, description, prix, prixTexte: '', categorie: region, lieu, photos: [], details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const DEMO: AnnoncePub[] = [
  ch(1, 'Chalet du Lac-Bleu — spa et accès au lac', 'Grand chalet en bois rond face au lac : spa extérieur, foyer au bois, quai privé et canots à votre disposition. Cuisine tout équipée, grande terrasse et vue sur les montagnes.', 289, 'Charlevoix', 'Baie-Saint-Paul', 1, { Type: 'Chalet de luxe', Voyageurs: '8', Chambres: '4', Lits: '5', 'Salles de bain': '2', Superficie: '2 100 pi²', Spa: 'Oui', Foyer: 'Oui', Animaux: 'Non', Wifi: 'Oui', Stationnement: '4 places', 'Lac ou rivière': 'Lac privé', 'Séjour minimum': '2 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Baie-Saint-Paul, Québec' }, true),
  ch(2, 'La Cabane du Sentier — petit refuge pour deux', 'Cabane chaleureuse pour une escapade en amoureux : poêle à bois, lit queen, petite cuisine et terrasse dans les arbres. Départ de sentiers à la porte.', 139, 'Laurentides', 'Saint-Donat', 2, { Type: 'Cabane', Voyageurs: '2', Chambres: '1', Lits: '1', 'Salles de bain': '1', Superficie: '480 pi²', Spa: 'Non', Foyer: 'Oui', Animaux: 'Oui', Wifi: 'Oui', Stationnement: '2 places', 'Lac ou rivière': 'Non', 'Séjour minimum': '2 nuits', Arrivée: '15 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Saint-Donat, Québec' }, true),
  ch(3, 'Domaine des Érables — grand chalet pour groupes', 'Idéal pour les familles et les groupes d\'amis : salle à manger pour douze, salle de jeux, foyer en pierre et grand terrain. Accès rapide aux pistes de ski.', 359, 'Cantons-de-l\'Est', 'Orford', 3, { Type: 'Chalet', Voyageurs: '12', Chambres: '6', Lits: '8', 'Salles de bain': '3', Superficie: '3 200 pi²', Spa: 'Oui', Foyer: 'Oui', Animaux: 'Oui', Wifi: 'Oui', Stationnement: '6 places', 'Lac ou rivière': 'Non', 'Séjour minimum': '3 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Orford, Québec' }),
  ch(4, 'Le Pêcheur — chalet les pieds dans l\'eau', 'Chalet de pêche rénové au bord de la rivière : galerie couverte, foyer extérieur, rangement pour l\'équipement. Calme garanti, idéal pour les pêcheurs.', 189, 'Gaspésie', 'Gaspé', 4, { Type: 'Chalet', Voyageurs: '6', Chambres: '3', Lits: '4', 'Salles de bain': '1', Superficie: '1 300 pi²', Spa: 'Non', Foyer: 'Oui', Animaux: 'Oui', Wifi: 'Non', Stationnement: '3 places', 'Lac ou rivière': 'Rivière', 'Séjour minimum': '2 nuits', Arrivée: '15 h', Départ: '10 h', Saison: 'Mai à octobre', Secteur: 'Gaspé, Québec' }),
  ch(5, 'Chalet nordique du Fjord — vue panoramique', 'Architecture moderne, grandes baies vitrées et sauna sec. Vue exceptionnelle sur le fjord, sentiers de raquette et ski de fond à proximité.', 245, 'Saguenay–Lac-Saint-Jean', 'La Baie', 6, { Type: 'Chalet nordique', Voyageurs: '6', Chambres: '3', Lits: '4', 'Salles de bain': '2', Superficie: '1 700 pi²', Spa: 'Oui', Foyer: 'Oui', Animaux: 'Non', Wifi: 'Oui', Stationnement: '3 places', 'Lac ou rivière': 'Fjord', 'Séjour minimum': '2 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'La Baie, Québec' }),
  ch(6, 'Chalet de la Pinède — famille et enfants', 'Chalet tout confort pour les familles : lits superposés, jeux de société, terrain clôturé et balançoires. À dix minutes du lac et de la plage.', 199, 'Mauricie', 'Saint-Alexis-des-Monts', 8, { Type: 'Chalet', Voyageurs: '8', Chambres: '4', Lits: '6', 'Salles de bain': '2', Superficie: '1 900 pi²', Spa: 'Non', Foyer: 'Oui', Animaux: 'Oui', Wifi: 'Oui', Stationnement: '4 places', 'Lac ou rivière': 'Lac à 10 min', 'Séjour minimum': '2 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Saint-Alexis-des-Monts, Québec' }),
  ch(7, 'Le Hibou — mini-chalet romantique', 'Mini-chalet en bois avec poêle, bain extérieur et ciel étoilé. Petit-déjeuner de bienvenue inclus.', 169, 'Charlevoix', 'Les Éboulements', 10, { Type: 'Cabane', Voyageurs: '2', Chambres: '1', Lits: '1', 'Salles de bain': '1', Superficie: '420 pi²', Spa: 'Oui', Foyer: 'Oui', Animaux: 'Non', Wifi: 'Oui', Stationnement: '2 places', 'Lac ou rivière': 'Non', 'Séjour minimum': '2 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Les Éboulements, Québec' }),
  ch(8, 'Maison de campagne du Verger', 'Maison de campagne de caractère entourée de pommiers : grande cuisine, véranda et foyer. Idéale pour un week-end entre amis.', 219, 'Cantons-de-l\'Est', 'Dunham', 12, { Type: 'Maison de campagne', Voyageurs: '10', Chambres: '5', Lits: '7', 'Salles de bain': '2', Superficie: '2 600 pi²', Spa: 'Non', Foyer: 'Oui', Animaux: 'Oui', Wifi: 'Oui', Stationnement: '5 places', 'Lac ou rivière': 'Non', 'Séjour minimum': '2 nuits', Arrivée: '16 h', Départ: '11 h', Saison: 'Toute l\'année', Secteur: 'Dunham, Québec' }),
];
const EMOJI_REG: [RegExp, string][] = [[/charlevoix|fjord|saguenay/i, '🏔️'], [/laurentide/i, '🌲'], [/canton/i, '🍎'], [/gasp[ée]sie|mer|maritime/i, '🌊'], [/mauricie/i, '🏞️'], [/lac/i, '🛶']];
const emojiDe = (cat: string) => (EMOJI_REG.find(([r]) => r.test(cat)) || [null, '🏕️'])[1];

export const PROFIL_CHALET: ProfilAnnonces = {
  icone: '🏕️',
  recherche: 'Chalet, région, ville…',
  lieuPlaceholder: 'Région ou ville',
  defaut: { nomSite: 'Chalet Boréal', slogan: 'Location de chalets et de maisons de vacances', logoUrl: '', couleurPrincipale: '#7dffd5', couleurFond: '#1b2130', police: 'moderne', apropos: '', email: '', telephone: '' },
  demo: DEMO,
  selects: [{ cle: 'Type', label: 'Type d\'hébergement' }],
  plages: [{ cle: 'Voyageurs', label: 'Voyageurs', max: false }, { cle: 'Chambres', label: 'Chambres', max: false }],
  puces: (a) => [a.details['Voyageurs'] ? `${a.details['Voyageurs']} voyageurs` : '', a.details['Chambres'] ? `${a.details['Chambres']} ch.` : '', a.details['Salles de bain'] ? `${a.details['Salles de bain']} s. de bain` : ''].filter(Boolean),
  suffixePrix: () => '/ nuit',
  avis: "Les annonces sont affichées à titre informatif. Aucune réservation ni aucun paiement n'est effectué sur ce site : les disponibilités, les conditions et le paiement se confirment directement avec le propriétaire.",
  groupes: [
    { titre: 'Le chalet', cles: ['Type', 'Voyageurs', 'Chambres', 'Lits', 'Salles de bain', 'Superficie'] },
    { titre: 'Équipements', cles: ['Spa', 'Foyer', 'Animaux', 'Wifi', 'Stationnement', 'Lac ou rivière'] },
    { titre: 'Séjour', cles: ['Séjour minimum', 'Arrivée', 'Départ', 'Saison'] },
  ],
  carteCle: 'Secteur',
};

const POLICES = {
  geometrique: { corps: "'Poppins', sans-serif", titre: "'Poppins', sans-serif", poids: 700, interlettre: '-.02em' },
  moderne:     { corps: "'Inter', sans-serif",   titre: "'Inter', sans-serif",   poids: 800, interlettre: '-.03em' },
  arrondie:    { corps: "'Nunito', sans-serif",  titre: "'Nunito', sans-serif",  poids: 900, interlettre: '-.01em' },
};

function allerAModule(id: string) { const el = document.getElementById(`sec-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

type Th = { ac: string; ne: string; fond: string; carte: string; bande: string; tx: string; doux: string; trait: string; surAc: string; titre: string; corps: string; poids: number; il: string };

function Lien({ v, style, children, className }: { v: string; style: React.CSSProperties; children: React.ReactNode; className?: string }) {
  const l = lienOk(v, [...SECTION_IDS]);
  if (!l) return null;
  if (l.type === 'ancre') return <button className={className} style={{ ...style, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => allerAModule(l.valeur)}>{children}</button>;
  return <a className={className} style={{ ...style, textDecoration: 'none', display: 'inline-block' }} href={l.valeur} {...(l.type === 'externe' ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
}

// Crête de montagnes (séparateur) : silhouette pleine `couleur` avec un filet dégradé menthe → citron sur la ligne de crête.
function Crete({ couleur, t, haut = false, hauteur = 70 }: { couleur: string; t: Th; haut?: boolean; hauteur?: number }) {
  const id = 'cr' + couleur.replace('#', '') + (haut ? 'h' : 'b');
  const ligne = 'M0,52 L110,30 L190,44 L300,14 L400,40 L480,26 L590,50 L700,20 L790,42 L880,10 L980,38 L1080,24 L1180,48 L1290,28 L1380,44 L1440,32';
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: hauteur, transform: haut ? 'scaleY(-1)' : 'none' }}>
      <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor={t.ac} /><stop offset="1" stopColor={t.ne} /></linearGradient></defs>
      <path d={`${ligne} L1440,80 L0,80 Z`} fill={couleur} />
      <path d={ligne} fill="none" stroke={`url(#${id})`} strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EnTete({ c, t, centre = false }: { c: Record<string, any>; t: Th; centre?: boolean }) {
  if (!c.surtitre && !c.titre && !c.texte) return null;
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: 28 }}>
      {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
      {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.2vw,44px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.12, color: t.tx, margin: 0 }}>{c.titre}</h2>}
      {c.texte && <p style={{ fontSize: 17, lineHeight: 1.65, color: t.doux, margin: centre ? '12px auto 0' : '12px 0 0', maxWidth: 700, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
    </div>
  );
}

function Carte({ a, t, onOuvrir }: { a: AnnoncePub; t: Th; onOuvrir: (a: AnnoncePub) => void }) {
  const prix = a.prix != null || a.prixTexte ? fmtPrix(a) : '';
  const type = a.details['Type'];
  const infos = PROFIL_CHALET.puces(a);
  return (
    <article className="cb-carte" onClick={() => onOuvrir(a)} style={{ cursor: 'pointer', background: t.carte, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', border: `1px solid ${t.trait}` }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: `linear-gradient(160deg, ${alpha(t.ac, .35)}, ${t.bande} 70%)` }}>
        {a.photos[0] ? <img src={a.photos[0]} alt={a.titre} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54 }}>{emojiDe(a.categorie)}</div>}
        {type && <span style={{ position: 'absolute', top: 10, left: 10, background: alpha(t.fond, .82), color: t.ac, fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 999 }}>{type}</span>}
        {a.vedette && <span style={{ position: 'absolute', top: 10, right: 10, background: t.ne, color: surCouleur(t.ne), fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999 }}>★ Coup de cœur</span>}
        {a.photos.length > 1 && <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>📷 {a.photos.length}</span>}
      </div>
      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: 12, color: t.doux, margin: '0 0 4px' }}>📍 {[a.categorie, a.lieu].filter(Boolean).join(' · ')}</p>
        <h3 style={{ fontFamily: t.titre, fontSize: 18, fontWeight: t.poids, letterSpacing: t.il, color: t.tx, margin: '0 0 8px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titre}</h3>
        {infos.length > 0 && <p style={{ fontSize: 12.5, color: t.doux, margin: '0 0 12px' }}>{infos.join(' · ')}</p>}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span><strong style={{ fontSize: 19, color: t.tx }}>{prix}</strong>{a.prix != null && <span style={{ fontSize: 12, color: t.doux }}> / nuit</span>}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.ac }}>Voir le chalet →</span>
        </div>
      </div>
    </article>
  );
}

export default function TemplateAnnoncesChalet({ config, vendeurId }: Props) {
  const cfg = useMemo(() => normaliserConfig(config), [config]);
  const gid = Number(vendeurId || 0);
  const pf = POLICES[cfg.police];
  const tx = cfg.couleurTexte;
  const t: Th = { ac: cfg.couleurPrincipale, ne: cfg.couleurSecondaire, fond: cfg.couleurFond, carte: cfg.couleurCarte, bande: cfg.couleurBande, tx, doux: alpha(tx, .72), trait: alpha(tx, .12), surAc: surCouleur(cfg.couleurPrincipale), titre: pf.titre, corps: pf.corps, poids: pf.poids, il: pf.interlettre };
  const clair = foncer(t.ac, 0.85);
  const politiques = usePolitiques(gid);
  const allerA = (id: string) => { if (politiques.statut !== 'ferme') { politiques.fermer(); setTimeout(() => allerAModule(id), 120); } else allerAModule(id); };
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (politiques.statut !== 'ferme') setMenu(false); }, [politiques.statut]);

  const accueil = useAnnonces(gid, DEMO, FILTRES_VIDES, []);
  const [f, setF] = useState<Filtres>(FILTRES_VIDES);
  const [q, setQ] = useState('');
  const cat = useAnnonces(gid, DEMO, f, ['Type']);
  const setFiltre = (p: Partial<Filtres>) => setF((x) => ({ ...x, page: 1, ...p }));
  const setDetail = (k: string, val: string) => setFiltre({ d: { ...(f.d || {}), [k]: val } });
  const setMin = (k: string, val: string) => setFiltre({ dmin: { ...(f.dmin || {}), [k]: val } });
  const [ouverte, setOuverte] = useState<AnnoncePub | null>(null);
  const versCategorie = (nom: string) => { setFiltre({ categorie: nom }); allerA('annonces'); };
  // Recherche rapide de la bannière
  const [rReg, setRReg] = useState('');
  const [rVoy, setRVoy] = useState('');
  const lancerRecherche = () => { setFiltre({ categorie: rReg, dmin: { ...(f.dmin || {}), Voyageurs: rVoy } }); allerA('annonces'); };

  const visibles = cfg.sections.filter((x) => x.visible);
  const ent = visibles.some((x) => x.id === 'entete') ? cfg.contenu.entete : null;
  const nav = visibles.filter((x) => x.id !== 'entete' && (x.label || SECTIONS_INFO[x.id].navDefaut));
  const wrap: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 24px' };
  const sec: React.CSSProperties = { padding: 'clamp(36px,5.5vw,72px) 0' };
  const bouton = (plein: boolean): React.CSSProperties => ({ padding: '13px 26px', borderRadius: 999, fontWeight: 700, fontSize: 15, background: plein ? t.ac : 'transparent', color: plein ? t.surAc : t.ac, border: plein ? 'none' : `1.5px solid ${t.ac}` });
  const champ: React.CSSProperties = { padding: '12px 16px', border: `1.5px solid ${t.trait}`, borderRadius: 12, fontSize: 15, fontFamily: 'inherit', background: t.carte, color: t.tx, boxSizing: 'border-box', minWidth: 0, outline: 'none' };
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, val]) => val) as [string, string][];
  const GLYPHE: Record<string, string> = { facebook: 'f', instagram: '◎', youtube: '▶', twitter: '𝕏', tiktok: '♪', linkedin: 'in' };

  const tous = accueil.annonces;
  const regions = accueil.categories;
  const rendre = (id: SectionId) => {
    const c = cfg.contenu[id];
    switch (id) {
      case 'entete': return null;   // rendu tout en haut de la page
      case 'hero': return (
        <section style={{ position: 'relative', background: t.fond }}>
          <div style={{ position: 'relative', minHeight: 'clamp(520px,78vh,720px)', display: 'flex', alignItems: 'center', background: `linear-gradient(160deg, ${t.bande}, ${t.fond} 75%)`, overflow: 'hidden' }}>
            {c.image && <img src={c.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${alpha(t.fond, .86)} 0%, ${alpha(t.fond, .45)} 55%, ${alpha(t.fond, .1)} 100%)` }} />
            <div style={{ ...wrap, position: 'relative', width: '100%', paddingTop: 40, paddingBottom: 90 }}>
              <h1 style={{ fontFamily: t.titre, fontSize: 'clamp(38px,6.4vw,76px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.04, color: '#fff', margin: 0, maxWidth: 760, textShadow: '0 2px 24px rgba(0,0,0,.45)' }}>
                {c.titre}{c.titre && c.titreAccent ? ' ' : ''}{c.titreAccent && <span style={{ color: t.ac }}>{c.titreAccent}</span>}
              </h1>
              {c.texte && <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,.88)', margin: '18px 0 0', maxWidth: 560, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
                {c.btnTexte && <Lien v={c.btnLien} style={bouton(true)}>{c.btnTexte}</Lien>}
                {c.btn2Texte && <Lien v={c.btn2Lien} style={{ ...bouton(false), color: '#fff', border: '1.5px solid rgba(255,255,255,.7)' }}>{c.btn2Texte}</Lien>}
              </div>
              {c.rechercheTitre && (
                <div style={{ marginTop: 34, background: alpha(t.fond, .86), border: `1px solid ${alpha(t.ac, .45)}`, borderRadius: 20, padding: '16px 18px', maxWidth: 760, backdropFilter: 'blur(8px)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: t.ac }}>{c.rechercheTitre}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <select aria-label="Région" value={rReg} onChange={(e) => setRReg(e.target.value)} style={{ ...champ, flex: '1 1 180px' }}><option value="">Toutes les régions</option>{regions.map((o) => <option key={o.nom} value={o.nom}>{o.nom}</option>)}</select>
                    <select aria-label="Voyageurs" value={rVoy} onChange={(e) => setRVoy(e.target.value)} style={{ ...champ, flex: '1 1 150px' }}><option value="">Voyageurs</option>{[2, 4, 6, 8, 10, 12].map((n) => <option key={n} value={String(n)}>{n} voyageurs et plus</option>)}</select>
                    <button onClick={lancerRecherche} style={{ ...bouton(true), cursor: 'pointer', fontFamily: 'inherit', flex: '0 0 auto' }}>Rechercher</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: -69, position: 'relative' }}><Crete couleur={t.fond} t={t} hauteur={70} /></div>
        </section>
      );
      case 'vedettes': { const vd = tous.filter((a) => a.vedette); const liste = vd.concat(tous.filter((a) => !a.vedette)).slice(0, Number(c.nombre) || 6); return liste.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <Carrousel couleur={t.ac} fond={t.carte}>{liste.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</Carrousel>
        </div></section>
      ) : null; }
      case 'apropos': return (c.titre || c.texte || c.image) ? (
        <section style={sec}><div style={wrap}>
          {c.image && <div style={{ borderRadius: 22, overflow: 'hidden', aspectRatio: '21 / 8', marginBottom: 34, background: `linear-gradient(135deg, ${t.bande}, ${t.carte})` }}><img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div className="cb-duo" style={{ borderTop: `1px solid ${t.trait}`, paddingTop: 34 }}>
            <div>
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(24px,3.4vw,38px)', fontWeight: 600, letterSpacing: t.il, lineHeight: 1.3, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.75, color: t.doux, margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            </div>
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              {c.btnTexte && <Lien v={c.btnLien} style={{ ...bouton(true), textAlign: 'center', display: 'block' }}>{c.btnTexte}</Lien>}
              {c.btn2Texte && <Lien v={c.btn2Lien} style={{ ...bouton(false), textAlign: 'center', display: 'block' }}>{c.btn2Texte}</Lien>}
            </div>
          </div>
        </div></section>
      ) : null;
      case 'atouts': return c.items && c.items.length ? (
        <section style={{ padding: 'clamp(24px,4vw,48px) 0' }}><div style={wrap}>
          <div className="cb-g3" style={{ borderTop: `1px solid ${t.trait}`, paddingTop: 34 }}>{c.items.map((it: any, i: number) => (
            <div key={i}>
              {it.icone && <div style={{ fontSize: 34, marginBottom: 10 }}>{it.icone}</div>}
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 22, fontWeight: t.poids, letterSpacing: t.il, margin: '0 0 8px', color: t.tx }}>{it.titre}</h3>}
              {it.texte && <p style={{ fontSize: 15.5, lineHeight: 1.65, color: t.doux, margin: 0, whiteSpace: 'pre-wrap' }}>{it.texte}</p>}
            </div>))}</div>
        </div></section>
      ) : null;
      case 'categories': return accueil.categories.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="cb-g4">{accueil.categories.slice(0, 8).map((x) => (
            <button key={x.nom} className="cb-tuile" onClick={() => versCategorie(x.nom)} style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(160deg, ${t.bande}, ${t.carte})`, border: `1px solid ${t.trait}`, borderRadius: 18, padding: '26px 18px', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 34, marginBottom: 8 }}>{emojiDe(x.nom)}</span>
              <span style={{ display: 'block', fontFamily: t.titre, fontSize: 18, fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.2 }}>{x.nom}</span>
              <span style={{ display: 'block', fontSize: 13, color: t.ac, marginTop: 6 }}>{x.n} chalet{x.n > 1 ? 's' : ''}</span>
            </button>))}</div>
        </div></section>
      ) : null;
      case 'annonces': return (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <input style={{ ...champ, flex: '1 1 240px' }} placeholder="Chalet, région, ville…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFiltre({ q: q.trim() })} maxLength={80} />
            <button onClick={() => setFiltre({ q: q.trim() })} style={{ ...bouton(true), cursor: 'pointer', fontFamily: 'inherit', padding: '0 28px' }}>Chercher</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            {cat.categories.length > 0 && <select aria-label="Région" value={f.categorie} onChange={(e) => setFiltre({ categorie: e.target.value })} style={champ}><option value="">Toutes les régions</option>{cat.categories.map((o) => <option key={o.nom} value={o.nom}>{o.nom} ({o.n})</option>)}</select>}
            {((cat.facettes && cat.facettes['Type']) || []).length > 0 && <select aria-label="Type" value={(f.d || {})['Type'] || ''} onChange={(e) => setDetail('Type', e.target.value)} style={champ}><option value="">Tous les types</option>{((cat.facettes && cat.facettes['Type']) || []).map((o) => <option key={o.nom} value={o.nom}>{o.nom} ({o.n})</option>)}</select>}
            <select aria-label="Voyageurs" value={(f.dmin || {})['Voyageurs'] || ''} onChange={(e) => setMin('Voyageurs', e.target.value)} style={champ}><option value="">Voyageurs</option>{[2, 4, 6, 8, 10, 12].map((n) => <option key={n} value={String(n)}>{n} et plus</option>)}</select>
            <select aria-label="Chambres" value={(f.dmin || {})['Chambres'] || ''} onChange={(e) => setMin('Chambres', e.target.value)} style={champ}><option value="">Chambres</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n} et plus</option>)}</select>
            <input aria-label="Prix maximum par nuit" inputMode="numeric" placeholder="Prix max / nuit" value={f.prixMax} onChange={(e) => setFiltre({ prixMax: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })} style={{ ...champ, width: 150 }} />
            <select aria-label="Tri" value={f.tri} onChange={(e) => setFiltre({ tri: e.target.value as Filtres['tri'] })} style={champ}><option value="recent">Plus récents</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option></select>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(['Spa', 'Animaux', 'Foyer'] as const).map((k) => { const on = (f.d || {})[k] === 'Oui'; return (
              <button key={k} onClick={() => setDetail(k, on ? '' : 'Oui')} aria-pressed={on} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${on ? t.ac : t.trait}`, background: on ? alpha(t.ac, .16) : 'transparent', color: on ? t.ac : t.tx, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{k === 'Spa' ? '♨️ Spa' : k === 'Animaux' ? '🐾 Animaux acceptés' : '🔥 Foyer'}</button>); })}
          </div>
          {cat.demo && <div style={{ background: 'rgba(252,211,77,.12)', border: '1px solid #fcd34d', borderRadius: 12, padding: '10px 14px', color: '#fde68a', fontSize: 13, marginBottom: 18 }}>Aperçu avec des annonces d'exemple. Vos vrais chalets s'afficheront ici une fois ajoutés dans « Mes annonces ».</div>}
          {!cat.loading && cat.annonces.length === 0
            ? <p style={{ textAlign: 'center', color: t.doux, padding: '40px 0' }}>{c.vide || 'Aucun chalet ne correspond à votre recherche.'}</p>
            : <div className="cb-g3">{cat.annonces.map((a) => <Carte key={a.id} a={a} t={t} onOuvrir={setOuverte} />)}</div>}
          {cat.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <button disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page <= 1 ? .4 : 1 }}>← Précédent</button>
              <span style={{ fontSize: 14, color: t.doux }}>Page {f.page} / {cat.pages}</span>
              <button disabled={f.page >= cat.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} style={{ ...champ, fontWeight: 700, cursor: 'pointer', opacity: f.page >= cat.pages ? .4 : 1 }}>Suivant →</button>
            </div>
          )}
        </div></section>
      );
      case 'temoignages': return c.items && c.items.length ? (
        <section style={sec}><div style={wrap}>
          <EnTete c={c} t={t} />
          <div className="cb-g3">{c.items.map((it: any, i: number) => (
            <figure key={i} style={{ margin: 0, background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 20, padding: '26px 24px' }}>
              <div aria-label="5 étoiles" style={{ color: '#fbbf24', letterSpacing: 3, marginBottom: 10 }}>★★★★★</div>
              {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 21, fontWeight: t.poids, letterSpacing: t.il, margin: '0 0 8px', color: t.tx }}>{it.titre}</h3>}
              <blockquote style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: t.doux, whiteSpace: 'pre-wrap' }}>{it.texte}</blockquote>
              {it.auteur && <figcaption style={{ marginTop: 14, fontSize: 14, color: t.ac }}>— {it.auteur}</figcaption>}
            </figure>))}</div>
        </div></section>
      ) : null;
      case 'activites': return c.items && c.items.length ? (
        <section style={{ margin: '30px 0 0' }}>
          <Crete couleur={t.bande} t={t} hauteur={70} />
          <div style={{ background: t.bande }}>
          <div style={{ ...wrap, padding: 'clamp(10px,3vw,36px) 24px clamp(44px,6vw,80px)' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ne, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4.4vw,46px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, margin: 0, background: `linear-gradient(90deg, ${t.ac}, ${t.ne})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, color: alpha('#ffffff', .85), margin: '12px auto 0', maxWidth: 640, whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            </div>
            <div className="cb-g4">{c.items.map((it: any, i: number) => (
              <div key={i}>
                <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '1 / 1', background: `linear-gradient(135deg, ${alpha(t.ac, .3)}, ${t.carte})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                  {it.image ? <img src={it.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ['🥾', '🛶', '⛷️', '🔥'][i % 4]}
                </div>
                {it.titre && <h3 style={{ fontFamily: t.titre, fontSize: 18, fontWeight: t.poids, margin: '12px 0 4px', color: '#fff' }}>{it.titre}</h3>}
                {it.texte && <p style={{ fontSize: 14, margin: 0, color: alpha('#ffffff', .8) }}>{it.texte}</p>}
              </div>))}</div>
          </div>
          <div style={{ marginTop: -1 }}><Crete couleur={t.fond} t={t} hauteur={70} /></div>
          </div>
        </section>
      ) : null;
      case 'etapes': return (c.titre || (c.items && c.items.length)) ? (
        <section style={sec}><div className="cb-duo" style={wrap}>
          <div style={{ borderRadius: 22, overflow: 'hidden', aspectRatio: '4 / 4.2', background: `linear-gradient(135deg, ${t.bande}, ${t.carte})` }}>
            {c.image && <img src={c.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,42px)', fontWeight: t.poids, letterSpacing: t.il, margin: 0, color: t.tx }}>{c.titre}</h2>}
            {c.texte && <p style={{ fontSize: 16, lineHeight: 1.7, color: t.doux, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
            <ol style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 18 }}>{(c.items || []).map((it: any, i: number) => (
              <li key={i} style={{ display: 'flex', gap: 14 }}>
                <span style={{ flex: '0 0 34px', height: 34, borderRadius: '50%', background: t.ac, color: t.surAc, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span><strong style={{ display: 'block', fontSize: 17, color: t.tx }}>{it.titre}</strong>{it.texte && <span style={{ fontSize: 15, lineHeight: 1.6, color: t.doux }}>{it.texte}</span>}</span>
              </li>))}</ol>
          </div>
        </div></section>
      ) : null;
      case 'galerie': return c.items && c.items.filter((x: any) => x.image).length ? (
        <section style={{ padding: '10px 0 40px' }}><div style={wrap}>
          <div className="cb-bande">{c.items.filter((x: any) => x.image).map((x: any, i: number) => <img key={i} src={x.image} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ height: 170, width: 'auto', borderRadius: 16, objectFit: 'cover', flex: '0 0 auto' }} />)}</div>
        </div></section>
      ) : null;
      case 'faq': return c.items && c.items.length ? (
        <section style={sec}><div style={{ ...wrap, maxWidth: 840 }}>
          <EnTete c={c} t={t} centre />
          <div style={{ display: 'grid', gap: 12 }}>{c.items.map((it: any, i: number) => (
            <details key={i} className="cb-faq" style={{ background: t.carte, border: `1px solid ${t.trait}`, borderRadius: 16, padding: '4px 22px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 17, padding: '16px 0', color: t.tx, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{it.q}</span><span aria-hidden="true" style={{ color: t.ac, fontSize: 22, lineHeight: 1 }}>＋</span></summary>
              <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.65, color: t.doux, whiteSpace: 'pre-wrap' }}>{it.r}</p>
            </details>))}</div>
        </div></section>
      ) : null;
      case 'contact': return (
        <section style={sec}><div style={wrap}>
          <div className="cb-duo" style={{ border: `1px solid ${alpha(t.ac, .35)}`, borderRadius: 28, background: t.carte, padding: 'clamp(22px,4vw,48px)' }}>
            <div>
              {c.surtitre && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ac, margin: '0 0 8px' }}>{c.surtitre}</p>}
              {c.titre && <h2 style={{ fontFamily: t.titre, fontSize: 'clamp(28px,4vw,44px)', fontWeight: t.poids, letterSpacing: t.il, lineHeight: 1.1, color: t.tx, margin: 0 }}>{c.titre}</h2>}
              {c.texte && <p style={{ fontSize: 17, lineHeight: 1.6, color: t.doux, margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{c.texte}</p>}
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17 }}><span style={{ color: t.ac }}>📞</span> {cfg.telephone}</a>}
                {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: t.tx, textDecoration: 'none', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}><span style={{ color: t.ac }}>✉️</span> {cfg.courriel}</a>}
                {cfg.adresse && <p style={{ margin: 0, color: t.doux }}><span style={{ color: t.ac }}>📍</span> {cfg.adresse}</p>}
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
        : <span style={{ fontFamily: t.titre, fontSize: 24, fontWeight: 800, letterSpacing: t.il, color: t.tx, whiteSpace: 'nowrap' }}><span aria-hidden="true" style={{ color: t.ac }}>▲ </span>{cfg.nomSite}</span>}
    </div>
  );

  return (
    <div style={{ background: t.fond, color: t.tx, fontFamily: t.corps, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
      <style>{`${CSS_CARROUSEL}
        .cb-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.cb-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
        .cb-duo{display:grid;grid-template-columns:1.4fr .8fr;gap:clamp(24px,5vw,60px);align-items:start}
        .cb-bande{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}
        .cb-carte{transition:border-color .2s,box-shadow .2s,transform .2s}.cb-carte:hover{border-color:${t.ac} !important;box-shadow:0 14px 34px rgba(0,0,0,.35);transform:translateY(-3px)}
        .cb-tuile{transition:box-shadow .2s,transform .2s}.cb-tuile:hover{box-shadow:0 12px 30px rgba(0,0,0,.35);transform:translateY(-3px)}
        .cb-faq summary::-webkit-details-marker{display:none}.cb-faq[open]{border-color:${alpha(t.ac, .5)} !important}
        @media(prefers-reduced-motion:reduce){.cb-carte,.cb-tuile{transition:none}.cb-carte:hover,.cb-tuile:hover{transform:none}}
        .cb-nav{display:flex;gap:24px;align-items:center}.cb-burger{display:none}
        @media(max-width:980px){.cb-g3{grid-template-columns:repeat(2,minmax(0,1fr))}.cb-g4{grid-template-columns:repeat(2,minmax(0,1fr))}.cb-duo{grid-template-columns:1fr}.cb-nav{display:none}.cb-burger{display:block}}
        @media(max-width:600px){.cb-g3{grid-template-columns:1fr}}
        *{box-sizing:border-box}img{display:block;max-width:100%}input::placeholder{color:${alpha(tx, .45)}}select option{color:#111;background:#fff}`}</style>

      {politiques.statut === 'ferme' && ent && (cfg.telephone || cfg.courriel || ent.texte) && (
        <div style={{ background: t.ac, color: t.surAc, fontSize: 13, fontWeight: 600 }}>
          <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, minHeight: 38, flexWrap: 'wrap', padding: '6px 24px' }}>
            <span style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {cfg.telephone && <a href={telHref(cfg.telephone)} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {cfg.telephone}</a>}
              {cfg.courriel && <a href={`mailto:${cfg.courriel}`} style={{ color: 'inherit', textDecoration: 'none', overflowWrap: 'anywhere' }}>✉️ {cfg.courriel}</a>}
            </span>
            {ent.texte && <span>{ent.texte}</span>}
          </div>
        </div>
      )}

      <header style={{ background: alpha(t.fond, .92), position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${t.trait}`, backdropFilter: 'blur(10px)' }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 70, gap: 16 }}>
          {logo}
          <nav className="cb-nav">{nav.map((x) => <button key={x.id} onClick={() => allerA(x.id)} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: t.tx, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="cb-nav" style={{ gap: 8 }}>{reseauxActifs.map(([k, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer nofollow" aria-label={k} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${alpha(t.ac, .5)}`, color: t.tx, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>{GLYPHE[k] || k.charAt(0)}</a>)}</div>
            <button className="cb-burger" aria-label="Menu" onClick={() => setMenu((x) => !x)} style={{ background: 'none', border: `1px solid ${t.trait}`, borderRadius: 10, color: t.tx, fontSize: 22, padding: '4px 12px', cursor: 'pointer' }}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {menu && <div className="cb-burger" style={{ borderTop: `1px solid ${t.trait}`, padding: '8px 24px 14px' }}>{nav.map((x) => <button key={x.id} onClick={() => { setMenu(false); allerA(x.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: t.tx, padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{x.label || SECTIONS_INFO[x.id].navDefaut}</button>)}</div>}
      </header>

      {politiques.statut !== 'ferme'
        ? <div style={{ background: '#fff', color: '#111827' }}><PagePolitique pol={politiques} couleur={clair} police={t.corps} /></div>
        : visibles.filter((x) => x.id !== 'entete').map((x) => { const el = rendre(x.id); return el ? <div key={x.id} id={`sec-${x.id}`} style={{ scrollMarginTop: 76 }}>{el}</div> : null; })}

      <Pied nom={cfg.nomSite} fond={t.carte} texteLibre={cfg.piedTexte} avis={PROFIL_CHALET.avis} reseaux={cfg.reseaux} telephone={cfg.telephone} courriel={cfg.courriel} adresse={cfg.adresse} afficherPropulse={cfg.afficherPropulse} pol={politiques} />

      {ouverte && <Detail a={ouverte} gid={gid} demo={accueil.demo} cfg={{ nomSite: cfg.nomSite, slogan: '', logoUrl: '', couleurPrincipale: clair, couleurFond: '#ffffff', police: 'moderne', apropos: '', email: '', telephone: '' }} police={t.corps} profil={PROFIL_CHALET} onClose={() => setOuverte(null)} />}
    </div>
  );
}