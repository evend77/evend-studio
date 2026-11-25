// src/templates/TemplateCagnotteCause.tsx
// e-Vend Studio — Cagnotte « Cause » : page de collecte complète pour une grande cause.
// Grand thermomètre qui monte avec les dons, histoire en sections avec photos, impact des dons, chronologie,
// galerie, vidéo, témoignages, équipe, questions fréquentes. Tout se règle dans « Ma campagne ».
// Même fonctionnement de dons que « Classique » (Stripe / PayPal du gestionnaire, aucune commission, publication payée).

import { useState, useEffect, useRef } from 'react';
import {
  ModalDon, useLargeur, argent, couleurValide, lienReseau, AVIS_LEGAL,
  CONFIG_CAGNOTTE_DEFAUT,
  type ConfigCagnotte, type EtatPublic,
} from './TemplateCagnotteClassique';

// ─── TYPES ─────────────────────────────────────────────────────────

export interface BlocHistoire { titre: string; texte: string; photoUrl: string; position: 'gauche' | 'droite' }
export interface Etape { date: string; titre: string; texte: string; photoUrl: string }
export interface PhotoGalerie { url: string; legende: string }
export interface Temoignage { nom: string; role: string; texte: string; date: string }
export interface MembreEquipe { nom: string; role: string; photoUrl: string }
export interface Question { q: string; r: string }
export interface Impact { montant: number; texte: string }
export interface Chiffre { valeur: string; libelle: string }
export interface Raison { titre: string; texte: string }
export interface JalonThermo { montant: number; libelle: string }

export type SectionCause = 'chiffres' | 'histoire' | 'raisons' | 'impacts' | 'compteRebours' | 'video' | 'chronologie' | 'galerie' | 'nouvelles' | 'temoignages' | 'equipe' | 'faq' | 'donateurs';

export interface ConfigCause extends ConfigCagnotte {
  kicker: string;
  texteBoutonDon: string;
  // Thermomètre
  jalonsThermo: JalonThermo[];
  // Sections
  sectionsVisibles: Partial<Record<SectionCause, boolean>>;
  chiffres: Chiffre[];
  titreHistoire: string;
  blocsHistoire: BlocHistoire[];
  titreRaisons: string;
  raisons: Raison[];
  titreImpacts: string;
  impacts: Impact[];
  titreCompteRebours: string;
  texteCompteRebours: string;
  videoUrl: string;
  titreVideo: string;
  titreChronologie: string;
  chronologie: Etape[];
  titreGalerie: string;
  galerie: PhotoGalerie[];
  titreTemoignages: string;
  temoignages: Temoignage[];
  titreEquipe: string;
  equipe: MembreEquipe[];
  titreFaq: string;
  faq: Question[];
  titreFinal: string;
  texteFinal: string;
}

export const SECTIONS_CAUSE: { id: SectionCause; label: string }[] = [
  { id: 'chiffres', label: 'Bandeau de chiffres' },
  { id: 'histoire', label: 'Histoire en sections' },
  { id: 'raisons', label: 'Pourquoi cette cause' },
  { id: 'impacts', label: 'Votre don en action' },
  { id: 'compteRebours', label: 'Compte à rebours' },
  { id: 'video', label: 'Vidéo' },
  { id: 'chronologie', label: 'Chronologie' },
  { id: 'galerie', label: 'Galerie de photos' },
  { id: 'nouvelles', label: 'Mises à jour' },
  { id: 'temoignages', label: 'Témoignages' },
  { id: 'equipe', label: "L'équipe" },
  { id: 'faq', label: 'Questions fréquentes' },
  { id: 'donateurs', label: 'Mur des donateurs' },
];

const dansJours = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const PALETTES_CAUSE: { id: string; label: string; principale: string; fond: string; cartes: string; texte: string }[] = [
  { id: 'braise', label: 'Braise', principale: '#e2651a', fond: '#171717', cartes: '#262626', texte: '#ffffff' },
  { id: 'rubis', label: 'Rubis', principale: '#e11d48', fond: '#16101a', cartes: '#251a2b', texte: '#ffffff' },
  { id: 'foret', label: 'Forêt', principale: '#34a853', fond: '#101a14', cartes: '#1b2a21', texte: '#ffffff' },
  { id: 'ocean', label: 'Océan', principale: '#2f8cff', fond: '#0f1724', cartes: '#192639', texte: '#ffffff' },
  { id: 'or', label: 'Or', principale: '#d4a63a', fond: '#15130f', cartes: '#25211a', texte: '#ffffff' },
  { id: 'clair', label: 'Clair', principale: '#e2651a', fond: '#faf7f2', cartes: '#ffffff', texte: '#1f1f1f' },
];

export const CONFIG_CAUSE_DEFAUT: ConfigCause = {
  ...CONFIG_CAGNOTTE_DEFAUT,
  sousType: 'communaute',
  nomEntreprise: 'Refuge Les Quatre Vents',
  slogan: "Aidez-nous à bâtir un refuge sûr et chaleureux pour les animaux abandonnés de la région.",
  logoUrl: '',
  photoHeroUrl: '',
  couleurPrincipale: '#e2651a',
  couleurSecondaire: '#262626',
  couleurFond: '#171717',
  couleurTexte: '#ffffff',
  police: 'moderne',
  nomCampagne: 'Un nouveau refuge pour les animaux du quartier',
  descriptionCampagne: "Depuis dix ans, notre petite équipe de bénévoles recueille, soigne et replace des animaux abandonnés. Le bâtiment actuel est trop petit, mal isolé et ne répond plus aux normes.\n\nAvec votre aide, nous construirons un refuge moderne : des enclos chauffés, une salle de soins, un espace d'adoption et un grand terrain d'exercice.\n\nChaque don, petit ou grand, nous rapproche du jour où aucun animal n'aura à attendre dehors.",
  objectifMontant: 50000,
  photoCampagne: '',
  dateFinCampagne: dansJours(60),
  nomOrganisateur: 'Refuge Les Quatre Vents',
  photoOrganisateur: '',
  bioOrganisateur: "Organisme sans but lucratif géré par des bénévoles depuis 2016.",
  misesAJour: [
    { date: new Date().toISOString(), titre: 'Le terrain est acquis !', texte: "Grâce à une première vague de soutien, nous avons pu réserver le terrain. Place maintenant à la construction." },
  ],
  montantsSuggeres: [25, 50, 100, 250],
  montantMinimum: 5,
  messageRemerciement: 'Merci du fond du cœur ! Grâce à vous, un animal de plus aura un toit.',
  afficherDonateurs: true,

  kicker: 'Campagne de financement',
  texteBoutonDon: 'Faire un don',
  jalonsThermo: [
    { montant: 12500, libelle: 'Terrain préparé' },
    { montant: 25000, libelle: 'Fondations' },
    { montant: 50000, libelle: 'Ouverture du refuge' },
  ],
  sectionsVisibles: {},
  chiffres: [
    { valeur: '10 ans', libelle: "d'expérience" },
    { valeur: '1 200+', libelle: 'animaux replacés' },
    { valeur: '45', libelle: 'bénévoles actifs' },
  ],
  titreHistoire: 'Notre histoire',
  blocsHistoire: [
    { titre: 'Un besoin qui grandit', texte: "Chaque année, nous recevons plus d'animaux que nous pouvons en accueillir. Les listes d'attente s'allongent et l'hiver rend la situation encore plus difficile.", photoUrl: '', position: 'droite' },
    { titre: 'Un refuge pensé pour eux', texte: "Le nouveau bâtiment offrira des espaces chauffés, une clinique de soins et un lieu d'adoption chaleureux où chaque rencontre compte.", photoUrl: '', position: 'gauche' },
  ],
  titreRaisons: 'Pourquoi cette cause compte',
  raisons: [
    { titre: 'Un toit pour chacun', texte: "Des enclos chauffés et sécuritaires, toute l'année, pour que personne ne reste dehors." },
    { titre: 'Des soins sur place', texte: "Une salle de soins pour vacciner, stériliser et soigner sans attendre." },
    { titre: 'Plus de familles heureuses', texte: "Un espace d'adoption accueillant pour faciliter les belles rencontres." },
    { titre: 'Une communauté fière', texte: "Un lieu ouvert aux bénévoles, aux écoles et aux familles du quartier." },
    { titre: 'Un avenir durable', texte: "Un bâtiment bien isolé et économe en énergie, qui réduira nos frais d'exploitation." },
    { titre: 'Un impact concret', texte: "Chaque dollar amassé est investi directement dans la construction et les soins." },
  ],
  titreImpacts: 'Votre don en action',
  impacts: [
    { montant: 25, texte: "Offre une journée complète de nourriture et de soins à un animal." },
    { montant: 50, texte: "Finance une vaccination et un examen vétérinaire." },
    { montant: 100, texte: "Aménage un enclos chauffé pendant un mois." },
    { montant: 250, texte: "Équipe la salle de soins d'un appareil essentiel." },
  ],
  titreCompteRebours: 'Le temps file',
  texteCompteRebours: "La campagne se termine bientôt. Votre don compte maintenant, chaque jour qui passe nous rapproche de l'ouverture.",
  videoUrl: '',
  titreVideo: 'Découvrez le projet en vidéo',
  titreChronologie: 'Les grandes étapes',
  chronologie: [
    { date: 'Étape 1', titre: 'Lancement de la campagne', texte: "Nous présentons le projet et amassons les premiers dons.", photoUrl: '' },
    { date: 'Étape 2', titre: 'Début des travaux', texte: "Préparation du terrain et coulée des fondations.", photoUrl: '' },
    { date: 'Étape 3', titre: 'Construction du bâtiment', texte: "Murs, toiture, isolation et aménagement des enclos.", photoUrl: '' },
    { date: 'Étape 4', titre: 'Ouverture officielle', texte: "Portes ouvertes pour toute la communauté.", photoUrl: '' },
  ],
  titreGalerie: 'En images',
  galerie: [
    { url: '', legende: 'Le refuge actuel' }, { url: '', legende: 'Nos bénévoles' }, { url: '', legende: 'Une adoption réussie' },
    { url: '', legende: 'Le terrain du projet' }, { url: '', legende: 'Plan du futur bâtiment' },
  ],
  titreTemoignages: 'Ce que disent nos proches',
  temoignages: [
    { nom: 'Camille R.', role: 'Adoptante', texte: "Grâce à l'équipe, notre chien a trouvé une famille. Leur dévouement est remarquable.", date: '' },
    { nom: 'Marc-Antoine B.', role: 'Bénévole', texte: "Voir un animal retrouver confiance chaque semaine, c'est ce qui me motive à revenir.", date: '' },
  ],
  titreEquipe: "L'équipe derrière le projet",
  equipe: [
    { nom: 'Julie Tremblay', role: 'Directrice', photoUrl: '' },
    { nom: 'Samuel Roy', role: 'Responsable des soins', photoUrl: '' },
    { nom: 'Nadia Gagnon', role: 'Coordonnatrice des bénévoles', photoUrl: '' },
  ],
  titreFaq: 'Questions fréquentes',
  faq: [
    { q: "À quoi serviront les dons ?", r: "Les fonds servent à la construction et à l'aménagement du nouveau refuge, ainsi qu'aux soins des animaux accueillis." },
    { q: "Puis-je donner de façon anonyme ?", r: "Oui. Il suffit de cocher « Don anonyme » dans la fenêtre de don : votre nom n'apparaîtra pas." },
    { q: "Recevrai-je un reçu fiscal ?", r: "Sauf mention contraire de l'organisateur, un don ne donne pas droit à un reçu fiscal. Écrivez-nous pour en savoir plus." },
    { q: "Que se passe-t-il si l'objectif est dépassé ?", r: "Les sommes supplémentaires serviront à soutenir les soins et le fonctionnement du refuge." },
  ],
  titreFinal: 'Chaque geste compte',
  texteFinal: "Ensemble, on peut y arriver. Merci de faire partie de cette aventure.",
};

// ─── HELPERS ────────────────────────────────────────────────────────
const httpsUrl = (u: any) => typeof u === 'string' && /^https:\/\//i.test(u.trim());
const tab = <T,>(v: any, defaut: T[]): T[] => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') as T[] : defaut);
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const texteSur = (bg: string) => (lum(bg) > 0.6 ? '#1a1a1a' : '#ffffff');
const idYoutube = (u: string): string | null => {
  if (!httpsUrl(u)) return null;
  const m = u.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/i);
  return m ? m[1] : null;
};
const FONT_TITRE = "'Comfortaa', 'Nunito', sans-serif";
const FONT_TITRE_CLASSIQUE = "'Playfair Display', Georgia, serif";

// ─── PHOTO (ou emplacement de démonstration en aperçu) ────────────────────────
function Photo({ url, apercu, etiquette, style, cp, cc }: { url: string; apercu: boolean; etiquette?: string; style?: React.CSSProperties; cp: string; cc: string }) {
  const [casse, setCasse] = useState(false);
  useEffect(() => { setCasse(false); }, [url]);
  if (httpsUrl(url) && !casse) {
    return <img src={url.trim()} alt={etiquette || ''} loading="lazy" onError={() => setCasse(true)} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
  }
  if (!apercu) return null;
  return (
    <div aria-hidden="true" style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${cp}33, ${cc} 60%, ${cp}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: `${cp}`, ...style }}>
      <span style={{ fontSize: 30, opacity: 0.7 }}>📷</span>
      {etiquette && <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{etiquette}</span>}
    </div>
  );
}
const aPhoto = (url: string, apercu: boolean) => apercu || httpsUrl(url);

// ─── THERMOMÈTRE ──────────────────────────────────────────────────────
function Thermometre({ pct, total, objectif, jalons, cp, texte, hauteur }: { pct: number; total: number; objectif: number; jalons: JalonThermo[]; cp: string; texte: string; hauteur: number }) {
  const [monte, setMonte] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMonte(true), 250); return () => clearTimeout(t); }, []);
  const H = hauteur;                       // hauteur du tube
  const W = Math.round(H * 0.2);           // largeur du tube
  const B = Math.round(W * 2);             // diamètre du bulbe
  const LARG = Math.max(330, Math.round(H * 0.95));
  const CX = Math.round(LARG / 2);
  const gros = H >= 420;
  const fillPct = monte ? pct : 0;
  const fond = `linear-gradient(0deg, ${cp}, ${cp}ee 55%, ${cp}cc)`;
  const yDe = (p: number) => H - (Math.max(0, Math.min(100, p)) / 100) * H;
  const yActuel = yDe(pct);
  const joursGrad = Array.from({ length: 21 }, (_, k) => k * 5);            // un trait tous les 5 %
  const jalonsOk = jalons.filter(j => j && j.libelle && Number(j.montant) > 0 && Number(j.montant) <= objectif * 1.0001)
    .map(j => ({ ...j, p: (Number(j.montant) / objectif) * 100 }))
    .filter(j => Math.abs(yDe(j.p) - yActuel) > 30);
  const gauche = CX - W / 2 - 6;
  return (
    <div style={{ position: 'relative', width: LARG, maxWidth: '100%', height: H + B - Math.round(B * 0.16), margin: '0 auto' }} role="img" aria-label={`Thermomètre : ${pct} % de l'objectif atteint`}>
      {/* Échelle graduée (gauche) : traits tous les 5 %, montants tous les 25 % */}
      {joursGrad.map(g => {
        const majeur = g % 25 === 0;
        return (
          <div key={g} style={{ position: 'absolute', left: 0, width: gauche, top: yDe(g) - (majeur ? 8 : 1), display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            {majeur && <span style={{ fontSize: gros ? 14 : 12, color: `${texte}bb`, fontWeight: 800, whiteSpace: 'nowrap' }}>{g === 0 ? '0 $' : argent(Math.round(objectif * g / 100))}</span>}
            <span style={{ display: 'inline-block', width: majeur ? 26 : 13, height: majeur ? 3 : 2, background: majeur ? `${texte}88` : `${texte}44`, borderRadius: 2 }} />
          </div>
        );
      })}
      {/* Verre du tube */}
      <div style={{ position: 'absolute', left: CX - W / 2, top: 0, width: W, height: H, borderRadius: `${W / 2}px ${W / 2}px 0 0`, background: `linear-gradient(90deg, ${texte}14, ${texte}06 45%, ${texte}10)`, border: `4px solid ${texte}38`, borderBottom: 'none', overflow: 'hidden', zIndex: 2, boxShadow: 'inset 0 0 26px #00000066' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fillPct}%`, background: fond, transition: 'height 2.2s cubic-bezier(.2,.8,.2,1)', boxShadow: `0 0 34px ${cp}bb` }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: cp, filter: 'brightness(1.35)', opacity: 0.85 }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '16%', width: '14%', background: 'linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,.05))', borderRadius: 6 }} />
        </div>
        <div style={{ position: 'absolute', top: 18, left: '14%', width: '10%', height: '74%', borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0))', pointerEvents: 'none' }} />
      </div>
      {/* Bulbe */}
      <div style={{ position: 'absolute', left: CX - B / 2, top: H - Math.round(B * 0.16), width: B, height: B, borderRadius: '50%', background: fond, border: `4px solid ${texte}38`, boxShadow: `0 0 60px ${cp}99, inset 0 -16px 34px #00000050, inset 0 10px 24px rgba(255,255,255,.18)`, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: Math.round(B * 0.28), fontWeight: 800, color: texteSur(cp), fontFamily: FONT_TITRE, textShadow: '0 2px 10px rgba(0,0,0,.25)' }}>{pct} %</span>
        <div style={{ position: 'absolute', top: Math.round(B * 0.12), left: Math.round(B * 0.16), width: Math.round(B * 0.24), height: Math.round(B * 0.13), borderRadius: '50%', background: 'rgba(255,255,255,.4)', transform: 'rotate(-35deg)' }} />
      </div>
      {/* Col de raccord tube/bulbe */}
      <div style={{ position: 'absolute', left: CX - W / 2 + 4, top: H - Math.round(B * 0.2), width: W - 8, height: Math.round(B * 0.26), background: fond, zIndex: 3 }} />
      {/* Paliers (droite) */}
      {jalonsOk.map((j, i) => {
        const atteint = total >= Number(j.montant);
        return (
          <div key={i} style={{ position: 'absolute', left: CX + W / 2 + 8, top: yDe(j.p) - 11, display: 'flex', alignItems: 'center', gap: 8, fontSize: gros ? 14 : 12.5, fontWeight: 800, color: atteint ? cp : `${texte}cc`, maxWidth: LARG - (CX + W / 2 + 8), zIndex: 4 }}>
            <span style={{ width: 20, height: 3, background: atteint ? cp : `${texte}66`, flexShrink: 0, borderRadius: 2 }} />
            <span style={{ lineHeight: 1.2 }}>{atteint ? '✓ ' : ''}{j.libelle}</span>
          </div>
        );
      })}
      {/* Montant actuel */}
      <div style={{ position: 'absolute', left: CX + W / 2 + 4, top: monte ? Math.max(0, Math.min(H - 26, yActuel - 22)) : H - 26, zIndex: 5, transition: 'top 2.2s cubic-bezier(.2,.8,.2,1)', display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: `11px solid ${cp}` }} />
        <span style={{ background: cp, color: texteSur(cp), fontWeight: 800, fontSize: gros ? 19 : 16, padding: gros ? '8px 16px' : '6px 12px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: `0 8px 26px ${cp}77`, fontFamily: FONT_TITRE }}>{argent(Math.round(total))}</span>
      </div>
    </div>
  );
}

// ─── COMPTE À REBOURS ─────────────────────────────────────────────────
function CompteRebours({ finMs, cc, texte, taille }: { finMs: number; cc: string; texte: string; taille: (min: number, vw: number, max: number) => string }) {
  const [maintenant, setMaintenant] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);
  const reste = Math.max(0, finMs - maintenant);
  const j = Math.floor(reste / 86400000), h = Math.floor(reste / 3600000) % 24, m = Math.floor(reste / 60000) % 60, s = Math.floor(reste / 1000) % 60;
  const cases: [number, string][] = [[j, 'Jours'], [h, 'Heures'], [m, 'Minutes'], [s, 'Secondes']];
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
      {cases.map(([v, l]) => (
        <div key={l} style={{ width: taille(72, 20, 150), padding: '18px 6px', background: cc, color: texte, border: `1px solid ${texte}1f`, borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: taille(28, 6, 46), fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          <div style={{ fontSize: taille(11, 2, 16), color: `${texte}99`, marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────
interface Props {
  config?: Partial<ConfigCause>;
  isPreviewMobile?: boolean;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateCagnotteCause({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const brut = (configPartiel || {}) as Partial<ConfigCause>;
  // Réglages enregistrés avec un autre modèle (pas de « kicker ») : on garde les couleurs et la police propres à ce modèle
  const autreModele = brut.kicker === undefined;
  const brutNet: Partial<ConfigCause> = { ...brut };
  if (autreModele) { delete brutNet.couleurPrincipale; delete brutNet.couleurSecondaire; delete brutNet.couleurFond; delete brutNet.couleurTexte; delete brutNet.police; }
  const config: ConfigCause = { ...CONFIG_CAUSE_DEFAUT, ...brutNet };
  if (!Array.isArray(config.montantsSuggeres) || !config.montantsSuggeres.length) config.montantsSuggeres = CONFIG_CAUSE_DEFAUT.montantsSuggeres;
  const apercu = !siteId;
  const largeur = useLargeur();
  const isMobile = isPreviewMobile || largeur <= 768;
  // En aperçu réduit (page de configuration), les unités vw suivraient la fenêtre du navigateur : tailles fixes
  const taille = (min: number, vw: number, max: number) => (isPreviewMobile ? `${Math.round(min + (max - min) * 0.1)}px` : `clamp(${min}px, ${vw}vw, ${max}px)`);
  const cp = couleurValide(config.couleurPrincipale, '#e2651a');
  const cc = couleurValide(config.couleurSecondaire, '#262626');   // cartes
  const cf = couleurValide(config.couleurFond, '#171717');
  const ct = couleurValide(config.couleurTexte, '#ffffff');
  const surCp = texteSur(cp);
  const surCc = texteSur(cc);
  const police = config.police === 'classique' ? FONT_TITRE_CLASSIQUE : FONT_TITRE;
  const fontsUrl = config.police === 'classique'
    ? 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap'
    : 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&family=Nunito:wght@400;600;700;800&display=swap';

  const visible = (id: SectionCause) => !(config.sectionsVisibles && config.sectionsVisibles[id] === false);

  const [modalDon, setModalDon] = useState(false);
  const [montantInitial, setMontantInitial] = useState<number | undefined>(undefined);
  const [etat, setEtat] = useState<EtatPublic | null>(null);
  const [retour, setRetour] = useState<{ type: 'succes' | 'annule' | 'erreur'; texte: string } | null>(null);
  const [lienCopie, setLienCopie] = useState(false);
  const [ouvertFaq, setOuvertFaq] = useState<number | null>(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [indexTemoin, setIndexTemoin] = useState(0);
  const racine = useRef<HTMLDivElement>(null);

  const chargerEtat = () => {
    if (!siteId) return;
    fetch(`/api/dons/public/${siteId}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d === 'object') setEtat(d as EtatPublic); })
      .catch(() => {});
  };
  useEffect(chargerEtat, [siteId]);

  // Retour de Stripe / PayPal
  useEffect(() => {
    if (!siteId) return;
    const p = new URLSearchParams(window.location.search);
    const don = p.get('don');
    if (!don) return;
    const nettoyer = () => { try { window.history.replaceState({}, '', window.location.pathname + window.location.hash); } catch { /* ignore */ } };
    if (don === 'succes') { setRetour({ type: 'succes', texte: config.messageRemerciement }); nettoyer(); setTimeout(chargerEtat, 2500); }
    else if (don === 'annule') { setRetour({ type: 'annule', texte: "Le paiement a été annulé. Aucun montant n'a été prélevé." }); nettoyer(); }
    else if (don === 'retour' && p.get('mode') === 'paypal') {
      const donId = p.get('don_id'), orderId = p.get('token');
      nettoyer();
      fetch('/api/dons/paypal/capturer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site_id: siteId, don_id: donId, order_id: orderId }) })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (ok && d.paye) { setRetour({ type: 'succes', texte: config.messageRemerciement }); chargerEtat(); }
          else setRetour({ type: 'erreur', texte: (d && d.message) || "Le paiement PayPal n'a pas été confirmé. Aucun montant n'a été prélevé." });
        })
        .catch(() => setRetour({ type: 'erreur', texte: 'Impossible de confirmer le paiement. Si vous avez été débité, contactez l’organisateur.' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Fermer le zoom avec Échap
  useEffect(() => {
    if (zoom === null) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [zoom]);

  // ── Chiffres ──
  const objectif = Math.max(1, (etat && etat.objectif) || Number(config.objectifMontant) || 1);
  const total = apercu ? Math.round(objectif * 0.34) : Number(etat ? etat.total : 0) || 0;
  const nbDonateurs = apercu ? 86 : (etat ? etat.count : 0);
  const pct = Math.max(0, Math.min(100, Math.round((total / objectif) * 100)));
  const donsListe = apercu
    ? [{ id: 1, nom_donateur: 'Sophie L.', montant: '100', message: 'Bravo pour ce beau projet !' }, { id: 2, nom_donateur: 'Anonyme', montant: '50', message: null }, { id: 3, nom_donateur: 'Marc-André', montant: '250', message: 'De tout cœur avec vous.' }, { id: 4, nom_donateur: 'Léa P.', montant: '25', message: null }]
    : (etat ? etat.dons : []);
  const fin = (etat && etat.fin_le) || config.dateFinCampagne;
  const finMs = fin ? new Date(fin).getTime() : NaN;
  const joursRestants = Number.isFinite(finMs) ? Math.max(0, Math.ceil((finMs - Date.now()) / 86400000)) : null;
  const termine = !apercu && etat !== null && etat.statut === 'terminee';
  const nonOuvert = !apercu && etat !== null && !etat.ouvert && !termine;
  const donsOuverts = apercu || etat === null || etat.ouvert;
  const modes = apercu ? { stripe: true, paypal: false } : (etat ? etat.modes : { stripe: true, paypal: false });
  const minimum = Math.max(Number(config.montantMinimum) || 1, etat ? etat.don_min : 1);
  const maximum = etat ? etat.don_max : 10000;

  const ouvrirDon = (m?: number) => { if (donsOuverts) { setMontantInitial(m); setModalDon(true); } };
  const copierLien = () => {
    try { navigator.clipboard.writeText(window.location.href.split('?')[0]).then(() => { setLienCopie(true); setTimeout(() => setLienCopie(false), 2500); }); } catch { /* ignore */ }
  };
  const libBouton = termine ? 'Campagne terminée' : nonOuvert ? 'Bientôt ouvert aux dons' : (config.texteBoutonDon || 'Faire un don');
  const defiler = (id: string) => { const el = racine.current && racine.current.querySelector(`#cz-${id}`); if (el && 'scrollIntoView' in el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  // ── Contenu des sections ──
  const chiffresPerso = tab<Chiffre>(config.chiffres, []).filter(c => c.valeur && c.libelle);
  const blocs = tab<BlocHistoire>(config.blocsHistoire, []).filter(b => b.titre || b.texte || aPhoto(b.photoUrl, apercu));
  const raisons = tab<Raison>(config.raisons, []).filter(r => r.titre || r.texte);
  const impacts = tab<Impact>(config.impacts, []).filter(i => Number(i.montant) > 0 && i.texte);
  const etapes = tab<Etape>(config.chronologie, []).filter(e => e.titre || e.texte);
  const photos = tab<PhotoGalerie>(config.galerie, []).filter(p => apercu || httpsUrl(p.url));
  const nouvelles = tab<{ date: string; titre: string; texte: string }>(config.misesAJour, []);
  const temoins = tab<Temoignage>(config.temoignages, []).filter(t => t.texte);
  const equipe = tab<MembreEquipe>(config.equipe, []).filter(m => m.nom);
  const questions = tab<Question>(config.faq, []).filter(q => q.q && q.r);
  const videoId = idYoutube(config.videoUrl);
  const afficherDonateurs = config.afficherDonateurs !== false && donsListe.length > 0 && visible('donateurs');

  const sec = (id: SectionCause, ok: boolean) => visible(id) && ok;
  const motsTitre = (() => { const t = String(config.nomCampagne || '').trim(); const k = t.lastIndexOf(' '); return k > 0 ? { debut: t.slice(0, k), dernier: t.slice(k + 1) } : { debut: '', dernier: t }; })();
  const aff = {
    chiffres: sec('chiffres', true),
    histoire: sec('histoire', !!config.descriptionCampagne || blocs.length > 0),
    raisons: sec('raisons', raisons.length > 0),
    impacts: sec('impacts', impacts.length > 0),
    compteRebours: sec('compteRebours', Number.isFinite(finMs) && !termine && finMs > Date.now()),
    video: sec('video', !!videoId),
    chronologie: sec('chronologie', etapes.length > 0),
    galerie: sec('galerie', photos.length > 0),
    nouvelles: sec('nouvelles', nouvelles.length > 0),
    temoignages: sec('temoignages', temoins.length > 0),
    equipe: sec('equipe', equipe.length > 0),
    faq: sec('faq', questions.length > 0),
  };

  const pad = isMobile ? '56px 18px' : '88px 24px';
  const conteneur: React.CSSProperties = { maxWidth: 1140, margin: '0 auto', width: '100%' };
  const Titre = ({ kicker, texte, centre = false }: { kicker?: string; texte: string; centre?: boolean }) => (
    <div style={{ textAlign: centre ? 'center' : 'left', marginBottom: isMobile ? 28 : 44 }}>
      {kicker && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: cp, margin: '0 0 12px' }}>{kicker}</p>}
      <h2 style={{ fontFamily: police, fontSize: taille(26, 4.4, 46), fontWeight: 600, lineHeight: 1.15, margin: 0, overflowWrap: 'anywhere' }}>{texte}<span style={{ color: cp }}>.</span></h2>
    </div>
  );
  const btnDon = (grand = false): React.CSSProperties => ({ background: cp, color: surCp, border: 'none', padding: grand ? '17px 38px' : '10px 22px', borderRadius: 50, fontSize: grand ? 17 : 14, fontWeight: 800, cursor: donsOuverts ? 'pointer' : 'not-allowed', opacity: donsOuverts ? 1 : 0.55, fontFamily: 'inherit', boxShadow: donsOuverts ? `0 8px 28px ${cp}55` : 'none', whiteSpace: 'nowrap' });

  const liens = [
    aff.histoire ? ['histoire', 'Histoire'] : null, aff.impacts ? ['impacts', 'Impact'] : null, aff.chronologie ? ['chronologie', 'Étapes'] : null,
    aff.galerie ? ['galerie', 'Galerie'] : null, aff.faq ? ['faq', 'Questions'] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div ref={racine} className="cz-root" style={{ fontFamily: "'Nunito', sans-serif", background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden', lineHeight: 1.6 }}>
      <link rel="stylesheet" href={fontsUrl} />
      <style>{`
        .cz-root *, .cz-root *::before, .cz-root *::after { box-sizing: border-box; }
        .cz-root h1, .cz-root h2, .cz-root h3, .cz-root h4, .cz-root p, .cz-root figure { margin: 0; }
        .cz-btn { transition: transform .2s, box-shadow .2s; } .cz-btn:hover:not(:disabled) { transform: translateY(-3px); }
        .cz-carte { transition: transform .25s, box-shadow .25s; } .cz-carte:hover { transform: translateY(-4px); }
        .cz-lien { background: none; border: none; color: inherit; font: inherit; font-weight: 700; cursor: pointer; padding: 6px 4px; opacity: .85; } .cz-lien:hover { opacity: 1; color: ${cp}; }
        .cz-photo { transition: transform .5s; } .cz-galerie-item:hover .cz-photo { transform: scale(1.06); }
        @keyframes cz-pulse { 0%,100% { opacity: .55; transform: scale(1);} 50% { opacity: .9; transform: scale(1.06);} }
      `}</style>

      {modalDon && <ModalDon config={config} cp={cp} cs={cf} siteId={siteId} modes={modes} minimum={minimum} maximum={maximum} apercu={apercu} montantInitial={montantInitial} onClose={() => setModalDon(false)} />}

      {zoom !== null && photos[zoom] && (
        <div role="dialog" aria-modal="true" onClick={() => setZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <button aria-label="Fermer" onClick={() => setZoom(null)} style={{ position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>✕</button>
          {photos.length > 1 && <button aria-label="Précédente" onClick={e => { e.stopPropagation(); setZoom((zoom - 1 + photos.length) % photos.length); }} style={{ position: 'absolute', left: 14, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>‹</button>}
          <figure onClick={e => e.stopPropagation()} style={{ maxWidth: 'min(92vw, 1100px)', maxHeight: '86vh', textAlign: 'center' }}>
            {httpsUrl(photos[zoom].url) && <img src={photos[zoom].url.trim()} alt={photos[zoom].legende || ''} style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 10, objectFit: 'contain' }} />}
            {photos[zoom].legende && <figcaption style={{ color: '#fff', marginTop: 12, fontSize: 15 }}>{photos[zoom].legende}</figcaption>}
          </figure>
          {photos.length > 1 && <button aria-label="Suivante" onClick={e => { e.stopPropagation(); setZoom((zoom + 1) % photos.length); }} style={{ position: 'absolute', right: 14, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>›</button>}
        </div>
      )}

      {retour && (
        <div role="status" style={{ position: 'fixed', top: 82, left: '50%', transform: 'translateX(-50%)', zIndex: 900, width: 'calc(100% - 32px)', maxWidth: 520, background: retour.type === 'succes' ? '#ecfdf5' : retour.type === 'annule' ? '#fffbeb' : '#fef2f2', border: `1px solid ${retour.type === 'succes' ? '#6ee7b7' : retour.type === 'annule' ? '#fcd34d' : '#fca5a5'}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,.35)', color: '#1a1a1a' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>{retour.type === 'succes' ? '🎉' : retour.type === 'annule' ? 'ℹ️' : '⚠️'}</span>
            <div style={{ flex: 1 }}>
              {retour.type === 'succes' && <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Don reçu — merci !</p>}
              <p style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{retour.texte}</p>
            </div>
            <button onClick={() => setRetour(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666' }}>✕</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${cf}e6`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${ct}14`, height: 68, display: 'flex', alignItems: 'center' }}>
        <div style={{ ...conteneur, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {httpsUrl(config.logoUrl) && <img src={config.logoUrl.trim()} alt="logo" style={{ height: 34, objectFit: 'contain' }} />}
            <span style={{ fontFamily: police, fontSize: 17, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{config.nomEntreprise}</span>
          </div>
          {!isMobile && liens.length > 0 && <div style={{ display: 'flex', gap: 18 }}>{liens.map(([id, l]) => <button key={id} className="cz-lien" onClick={() => defiler(id)}>{l}</button>)}</div>}
          <button className="cz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnDon()}>{donsOuverts ? `💝 ${config.texteBoutonDon || 'Faire un don'}` : (termine ? 'Terminée' : 'Bientôt')}</button>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: 'relative', padding: isMobile ? '104px 18px 48px' : '132px 24px 84px', overflow: 'hidden' }}>
        {httpsUrl(config.photoHeroUrl) && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHeroUrl.trim()})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.28 }} />
        )}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 70% at ${isMobile ? '50% 80%' : '78% 55%'}, ${cp}40, transparent 70%), linear-gradient(180deg, ${cf}00 55%, ${cf})`, animation: 'cz-pulse 6s ease-in-out infinite' }} />
        <div style={{ ...conteneur, position: 'relative', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 40 : 56 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>
              {config.kicker} {joursRestants !== null && !termine && <span style={{ color: cp }}>/ {joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''}</span>}
            </p>
            <h1 style={{ fontFamily: police, fontSize: taille(34, 6.4, 72), fontWeight: 700, lineHeight: 1.08, textTransform: 'uppercase', overflowWrap: 'anywhere', marginBottom: 22 }}>{motsTitre.debut}{motsTitre.debut ? ' ' : ''}<span style={{ color: cp }}>{motsTitre.dernier}.</span></h1>
            {config.slogan && <p style={{ fontSize: taille(16, 2.2, 21), color: `${ct}cc`, maxWidth: 560, marginBottom: 30 }}>{config.slogan}</p>}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 34 }}>
              <div><div style={{ fontFamily: police, fontSize: taille(26, 4, 38), fontWeight: 700, color: cp, lineHeight: 1.1 }}>{argent(Math.round(total))}</div><div style={{ fontSize: 13, color: `${ct}99` }}>amassés sur {argent(objectif)}</div></div>
              <div><div style={{ fontFamily: police, fontSize: taille(26, 4, 38), fontWeight: 700, lineHeight: 1.1 }}>{nbDonateurs}</div><div style={{ fontSize: 13, color: `${ct}99` }}>donateur{nbDonateurs > 1 ? 's' : ''}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="cz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={{ ...btnDon(true), background: ct, color: cf, boxShadow: `0 8px 28px ${ct}22` }}>{donsOuverts ? libBouton : libBouton}</button>
              {(aff.histoire) && <button className="cz-lien" onClick={() => defiler('histoire')} style={{ fontSize: 16 }}>En savoir plus ↗</button>}
            </div>
            <p style={{ fontSize: 12, color: `${ct}77`, marginTop: 16 }}>🔒 Paiement sécurisé · aucune commission sur les dons</p>
          </div>
          <div style={{ flexShrink: 0, width: isMobile ? '100%' : 470 }}>
            <Thermometre pct={pct} total={total} objectif={objectif} jalons={tab<JalonThermo>(config.jalonsThermo, [])} cp={cp} texte={ct} hauteur={isMobile ? 330 : 470} />
          </div>
        </div>
      </header>

      {(termine || nonOuvert) && (
        <div style={{ background: termine ? '#111827' : '#fffbeb', color: termine ? '#fff' : '#92400e', padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
          {termine ? '🏁 Cette campagne est terminée. Merci à toutes les personnes qui ont contribué !' : "⏳ Cette cagnotte n'est pas encore ouverte aux dons. Revenez bientôt !"}
        </div>
      )}

      {/* CHIFFRES */}
      {aff.chiffres && (
        <section style={{ padding: isMobile ? '8px 18px 40px' : '8px 24px 56px' }}>
          <div style={{ ...conteneur, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${Math.min(4, 3 + chiffresPerso.length > 4 ? 4 : 3 + chiffresPerso.length)}, 1fr)`, gap: 16 }}>
            {[{ valeur: `${pct} %`, libelle: "de l'objectif atteint" }, { valeur: joursRestants !== null && !termine ? String(joursRestants) : '—', libelle: joursRestants === 1 ? 'jour restant' : 'jours restants' }, ...chiffresPerso].slice(0, 4).map((c, i) => (
              <div key={i} className="cz-carte" style={{ background: cc, color: surCc, borderRadius: 18, padding: '24px 18px', textAlign: 'center', border: `1px solid ${ct}12` }}>
                <div style={{ fontFamily: police, fontSize: taille(24, 4, 40), fontWeight: 700, color: i === 0 ? cp : surCc, lineHeight: 1.1 }}>{c.valeur}</div>
                <div style={{ fontSize: 13.5, color: `${surCc}99`, marginTop: 6 }}>{c.libelle}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HISTOIRE */}
      {aff.histoire && (
        <section id="cz-histoire" style={{ padding: pad }}>
          <div style={conteneur}>
            <Titre kicker="À propos" texte={config.titreHistoire || 'Notre histoire'} />
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 28 : 56, alignItems: 'flex-start', marginBottom: blocs.length ? (isMobile ? 56 : 88) : 0 }}>
              {aPhoto(config.photoCampagne, apercu) && (
                <div style={{ flex: '0 0 42%', width: isMobile ? '100%' : undefined, aspectRatio: '4 / 3', borderRadius: 22, overflow: 'hidden', border: `1px solid ${ct}14` }}>
                  <Photo url={config.photoCampagne} apercu={apercu} etiquette="Photo de la campagne" cp={cp} cc={cc} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, color: `${ct}d0`, lineHeight: 1.85, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{config.descriptionCampagne}</div>
            </div>
            {blocs.map((b, i) => {
              const photo = aPhoto(b.photoUrl, apercu);
              const gauche = b.position === 'gauche';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'column' : (gauche ? 'row' : 'row-reverse'), gap: isMobile ? 22 : 56, alignItems: 'center', marginBottom: i < blocs.length - 1 ? (isMobile ? 48 : 80) : 0 }}>
                  {photo && (
                    <div style={{ flex: '0 0 46%', width: isMobile ? '100%' : undefined, aspectRatio: '4 / 3', borderRadius: 22, overflow: 'hidden', border: `1px solid ${ct}14`, boxShadow: `0 18px 40px ${cp}14` }}>
                      <Photo url={b.photoUrl} apercu={apercu} etiquette={b.titre} cp={cp} cc={cc} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {b.titre && <h3 style={{ fontFamily: police, fontSize: taille(22, 3, 32), fontWeight: 600, marginBottom: 14, color: cp, overflowWrap: 'anywhere' }}>{b.titre}</h3>}
                    <p style={{ fontSize: 16.5, color: `${ct}cc`, lineHeight: 1.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{b.texte}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RAISONS */}
      {aff.raisons && (
        <section style={{ padding: pad }}>
          <div style={conteneur}>
            <Titre kicker="Pourquoi" texte={config.titreRaisons || 'Pourquoi cette cause compte'} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 22 }}>
              {raisons.slice(0, 9).map((r, i) => {
                const fort = i % 5 === 2 || i % 5 === 3;
                const fondCarte = fort ? cp : cc;
                const surCarte = texteSur(fondCarte);
                return (
                  <div key={i} className="cz-carte" style={{ background: fondCarte, color: surCarte, borderRadius: 22, padding: isMobile ? '26px 22px' : '30px 28px 34px', minHeight: isMobile ? undefined : 270, display: 'flex', flexDirection: 'column', border: `1px solid ${ct}12` }}>
                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: fort ? surCarte : cp }}>{String(i + 1).padStart(2, '0')}.</span>
                    <h3 style={{ fontFamily: police, fontSize: 24, fontWeight: 600, lineHeight: 1.2, margin: '34px 0 16px', paddingBottom: 16, borderBottom: `1px solid ${surCarte}33`, overflowWrap: 'anywhere' }}>{r.titre}</h3>
                    <p style={{ fontSize: 15.5, color: `${surCarte}cc`, lineHeight: 1.65, overflowWrap: 'anywhere' }}>{r.texte}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* IMPACTS */}
      {aff.impacts && (
        <section id="cz-impacts" style={{ padding: pad }}>
          <div style={conteneur}>
            <Titre kicker="Impact" texte={config.titreImpacts || 'Votre don en action'} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(4, impacts.length)}, 1fr)`, gap: 20 }}>
              {impacts.slice(0, 8).map((im, i) => (
                <button key={i} className="cz-carte" disabled={!donsOuverts} onClick={() => ouvrirDon(Number(im.montant))}
                  style={{ textAlign: 'left', background: cc, color: surCc, border: `1px solid ${cp}44`, borderRadius: 20, padding: '26px 22px', cursor: donsOuverts ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontFamily: police, fontSize: 38, fontWeight: 700, color: cp, lineHeight: 1 }}>{argent(Number(im.montant))}</span>
                  <span style={{ fontSize: 15.5, color: `${surCc}cc`, lineHeight: 1.55, flex: 1 }}>{im.texte}</span>
                  {donsOuverts && <span style={{ fontSize: 13.5, fontWeight: 800, color: cp }}>Donner ce montant →</span>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMPTE À REBOURS */}
      {aff.compteRebours && (
        <section style={{ padding: pad, textAlign: 'center' }}>
          <div style={{ ...conteneur, maxWidth: 900 }}>
            <h2 style={{ fontFamily: police, fontSize: taille(28, 5, 54), fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.15, marginBottom: 18 }}>{config.titreCompteRebours || 'Le temps file'}<span style={{ color: cp }}>!</span></h2>
            {config.texteCompteRebours && <p style={{ fontSize: taille(15, 2, 19), color: `${ct}cc`, marginBottom: 34, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>{config.texteCompteRebours}</p>}
            <CompteRebours finMs={finMs} cc={cc} texte={surCc} taille={taille} />
            <div style={{ marginTop: 34 }}><button className="cz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnDon(true)}>{donsOuverts ? `💝 ${libBouton}` : libBouton}</button></div>
          </div>
        </section>
      )}

      {/* VIDÉO */}
      {aff.video && videoId && (
        <section style={{ padding: pad }}>
          <div style={{ ...conteneur, maxWidth: 940 }}>
            <Titre kicker="Vidéo" texte={config.titreVideo || 'Découvrez le projet en vidéo'} centre />
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 22, overflow: 'hidden', border: `1px solid ${ct}14`, boxShadow: `0 24px 70px ${cp}22`, background: '#000' }}>
              <iframe title="Vidéo de la campagne" src={`https://www.youtube-nocookie.com/embed/${videoId}`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
            </div>
          </div>
        </section>
      )}

      {/* CHRONOLOGIE */}
      {aff.chronologie && (
        <section id="cz-chronologie" style={{ padding: pad }}>
          <div style={{ ...conteneur, maxWidth: 940 }}>
            <Titre kicker="Calendrier" texte={config.titreChronologie || 'Les grandes étapes'} />
            <div style={{ position: 'relative', paddingLeft: isMobile ? 34 : 52 }}>
              <div aria-hidden="true" style={{ position: 'absolute', left: isMobile ? 9 : 15, top: 8, bottom: 8, width: 3, borderRadius: 2, background: `linear-gradient(180deg, ${cp}, ${cp}22)` }} />
              {etapes.map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: i < etapes.length - 1 ? 34 : 0 }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: isMobile ? -34 : -52, top: 4, width: isMobile ? 22 : 34, height: isMobile ? 22 : 34, borderRadius: '50%', background: cf, border: `3px solid ${cp}`, boxShadow: `0 0 0 6px ${cp}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: cp }}>{isMobile ? '' : i + 1}</span>
                  <div className="cz-carte" style={{ background: cc, color: surCc, borderRadius: 18, padding: '20px 22px', border: `1px solid ${ct}12`, display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
                    {aPhoto(e.photoUrl, apercu) && httpsUrl(e.photoUrl) && (
                      <div style={{ flex: isMobile ? undefined : '0 0 180px', height: isMobile ? 160 : 120, borderRadius: 12, overflow: 'hidden' }}><Photo url={e.photoUrl} apercu={false} cp={cp} cc={cc} /></div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      {e.date && <p style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: cp, marginBottom: 4 }}>{e.date}</p>}
                      {e.titre && <h3 style={{ fontFamily: police, fontSize: 21, fontWeight: 600, marginBottom: 6, overflowWrap: 'anywhere' }}>{e.titre}</h3>}
                      {e.texte && <p style={{ fontSize: 15, color: `${surCc}bb`, overflowWrap: 'anywhere' }}>{e.texte}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALERIE */}
      {aff.galerie && (
        <section id="cz-galerie" style={{ padding: pad }}>
          <div style={conteneur}>
            <Titre kicker="Galerie" texte={config.titreGalerie || 'En images'} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 18 }}>
              {photos.slice(0, 18).map((p, i) => (
                <figure key={i} className="cz-galerie-item" onClick={() => httpsUrl(p.url) && setZoom(i)}
                  style={{ position: 'relative', aspectRatio: i % 5 === 0 && !isMobile ? '2 / 1' : '1 / 1', gridColumn: i % 5 === 0 && !isMobile ? 'span 2' : undefined, borderRadius: 18, overflow: 'hidden', cursor: httpsUrl(p.url) ? 'zoom-in' : 'default', border: `1px solid ${ct}12` }}>
                  <div className="cz-photo" style={{ width: '100%', height: '100%' }}><Photo url={p.url} apercu={apercu} etiquette={p.legende} cp={cp} cc={cc} /></div>
                  {p.legende && httpsUrl(p.url) && <figcaption style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 14px 12px', background: 'linear-gradient(0deg, rgba(0,0,0,.75), transparent)', color: '#fff', fontSize: 13.5, fontWeight: 600 }}>{p.legende}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MISES À JOUR */}
      {aff.nouvelles && (
        <section style={{ padding: pad }}>
          <div style={{ ...conteneur, maxWidth: 900 }}>
            <Titre kicker="Nouvelles" texte="Mises à jour" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {nouvelles.map((m, i) => (
                <div key={i} style={{ padding: '22px 24px', background: cc, color: surCc, borderRadius: 16, border: `1px solid ${ct}12`, borderLeft: `5px solid ${cp}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: police, fontSize: 19, fontWeight: 600, overflowWrap: 'anywhere' }}>{m.titre}</h3>
                    <span style={{ fontSize: 12.5, color: `${surCc}88` }}>{m.date ? new Date(m.date).toLocaleDateString('fr-CA') : ''}</span>
                  </div>
                  <p style={{ fontSize: 15, color: `${surCc}bb`, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{m.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TÉMOIGNAGES */}
      {aff.temoignages && (
        <section style={{ padding: pad }}>
          <div style={conteneur}>
            <Titre kicker="Témoignages" texte={config.titreTemoignages || 'Ce que disent nos proches'} centre />
            {(() => {
              const parPage = isMobile ? 1 : 2;
              const nbPages = Math.ceil(temoins.length / parPage);
              const page = Math.min(indexTemoin, nbPages - 1);
              const visibles = temoins.slice(page * parPage, page * parPage + parPage);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 20 }}>
                  {nbPages > 1 && <button aria-label="Précédent" onClick={() => setIndexTemoin((page - 1 + nbPages) % nbPages)} style={{ background: 'none', border: 'none', color: ct, fontSize: 34, cursor: 'pointer', padding: 4 }}>‹</button>}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${parPage}, 1fr)`, gap: 22 }}>
                    {visibles.map((t, i) => (
                      <div key={i} style={{ background: cc, color: surCc, borderRadius: 20, padding: '30px 26px', textAlign: 'center', border: `1px solid ${ct}12` }}>
                        <div aria-hidden="true" style={{ color: cp, fontSize: 38, lineHeight: 1, fontFamily: 'Georgia, serif' }}>“</div>
                        <p style={{ fontSize: 16, color: `${surCc}dd`, lineHeight: 1.7, margin: '6px 0 20px', overflowWrap: 'anywhere' }}>{t.texte}</p>
                        <p style={{ fontFamily: police, fontSize: 18, fontWeight: 600 }}>{t.nom}</p>
                        {t.role && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: cp, marginTop: 4 }}>{t.role}</p>}
                      </div>
                    ))}
                  </div>
                  {nbPages > 1 && <button aria-label="Suivant" onClick={() => setIndexTemoin((page + 1) % nbPages)} style={{ background: 'none', border: 'none', color: ct, fontSize: 34, cursor: 'pointer', padding: 4 }}>›</button>}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ÉQUIPE + ORGANISATEUR */}
      {(aff.equipe || config.nomOrganisateur) && (
        <section style={{ padding: pad }}>
          <div style={conteneur}>
            {aff.equipe && (
              <>
                <Titre kicker="Équipe" texte={config.titreEquipe || "L'équipe derrière le projet"} centre />
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 26 : 44, marginBottom: config.nomOrganisateur ? (isMobile ? 48 : 70) : 0 }}>
                  {equipe.slice(0, 12).map((m, i) => (
                    <div key={i} style={{ width: isMobile ? 130 : 190, textAlign: 'center' }}>
                      <div style={{ width: isMobile ? 112 : 160, height: isMobile ? 112 : 160, margin: '0 auto 14px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${cp}`, boxShadow: `0 0 0 7px ${cp}22, 0 14px 40px ${cp}33`, background: cc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {httpsUrl(m.photoUrl) ? <Photo url={m.photoUrl} apercu={false} cp={cp} cc={cc} /> : <span style={{ fontFamily: police, fontSize: 44, fontWeight: 700, color: cp }}>{m.nom.charAt(0).toUpperCase()}</span>}
                      </div>
                      <p style={{ fontFamily: police, fontSize: 17, fontWeight: 600, overflowWrap: 'anywhere' }}>{m.nom}</p>
                      {m.role && <p style={{ fontSize: 13, color: `${ct}99`, overflowWrap: 'anywhere' }}>{m.role}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            {config.nomOrganisateur && (
              <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 18, alignItems: 'center', padding: '22px 24px', background: cc, color: surCc, borderRadius: 18, border: `1px solid ${ct}12` }}>
                {httpsUrl(config.photoOrganisateur)
                  ? <img src={config.photoOrganisateur.trim()} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${cp}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>👤</div>}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, color: `${surCc}88` }}>Organisé par</p>
                  <p style={{ fontFamily: police, fontSize: 18, fontWeight: 700, overflowWrap: 'anywhere' }}>{config.nomOrganisateur}</p>
                  {config.bioOrganisateur && <p style={{ fontSize: 14, color: `${surCc}aa`, overflowWrap: 'anywhere' }}>{config.bioOrganisateur}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* DONATEURS */}
      {afficherDonateurs && (
        <section style={{ padding: pad }}>
          <div style={{ ...conteneur, maxWidth: 900 }}>
            <Titre kicker="Merci" texte="Ils ont donné" centre />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {donsListe.slice(0, 8).map((d, i) => (
                <div key={d.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: cc, color: surCc, borderRadius: 14, border: `1px solid ${ct}12` }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${cp}2a`, color: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{d.nom_donateur === 'Anonyme' ? '🕶' : (d.nom_donateur || '?').charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 700, overflowWrap: 'anywhere' }}>{d.nom_donateur}</p>
                    {d.message && <p style={{ fontSize: 12.5, color: `${surCc}99`, fontStyle: 'italic', overflowWrap: 'anywhere' }}>« {d.message.substring(0, 80)}{d.message.length > 80 ? '…' : ''} »</p>}
                  </div>
                  <span style={{ fontWeight: 800, color: cp, flexShrink: 0 }}>{Math.round(parseFloat(d.montant))} $</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {aff.faq && (
        <section id="cz-faq" style={{ padding: pad }}>
          <div style={{ ...conteneur, maxWidth: 900 }}>
            <Titre kicker="FAQ" texte={config.titreFaq || 'Questions fréquentes'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {questions.map((q, i) => {
                const ouvert = ouvertFaq === i;
                return (
                  <div key={i} style={{ background: cc, color: surCc, borderRadius: 16, border: `1px solid ${ouvert ? cp + '66' : ct + '12'}`, overflow: 'hidden' }}>
                    <button onClick={() => setOuvertFaq(ouvert ? null : i)} aria-expanded={ouvert}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', fontFamily: police, fontSize: taille(16, 2.4, 20), fontWeight: 600 }}>
                      <span style={{ overflowWrap: 'anywhere' }}>{q.q}</span>
                      <span aria-hidden="true" style={{ fontSize: 26, color: cp, transform: ouvert ? 'rotate(45deg)' : 'none', transition: 'transform .2s', flexShrink: 0, lineHeight: 1 }}>+</span>
                    </button>
                    {ouvert && <p style={{ padding: '0 24px 22px', fontSize: 15.5, color: `${surCc}bb`, lineHeight: 1.7, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{q.r}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* APPEL FINAL + PARTAGE */}
      <section style={{ padding: isMobile ? '64px 18px' : '100px 24px', textAlign: 'center', background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${cp}30, transparent 70%)` }}>
        <div style={{ ...conteneur, maxWidth: 760 }}>
          <h2 style={{ fontFamily: police, fontSize: taille(28, 5, 52), fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.15, marginBottom: 16 }}>{config.titreFinal || 'Chaque geste compte'}<span style={{ color: cp }}>.</span></h2>
          {config.texteFinal && <p style={{ fontSize: taille(15, 2, 19), color: `${ct}cc`, marginBottom: 30 }}>{config.texteFinal}</p>}
          <button className="cz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnDon(true)}>{donsOuverts ? `💝 ${libBouton}` : libBouton}</button>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 34 }}>
            {config.facebook && <a href={lienReseau('https://facebook.com/', config.facebook)} target="_blank" rel="noopener noreferrer" style={lienBtn(cc, surCc, ct)}>👥 Facebook</a>}
            {config.instagram && <a href={lienReseau('https://instagram.com/', config.instagram)} target="_blank" rel="noopener noreferrer" style={lienBtn(cc, surCc, ct)}>📷 Instagram</a>}
            {httpsUrl(config.siteExterne) && <a href={config.siteExterne.trim()} target="_blank" rel="noopener noreferrer" style={lienBtn(cc, surCc, ct)}>🌐 Site web</a>}
            {config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) && <a href={`mailto:${config.email}`} style={lienBtn(cc, surCc, ct)}>✉️ Nous écrire</a>}
            <button onClick={copierLien} style={{ ...lienBtn(cc, surCc, ct), cursor: 'pointer', fontFamily: 'inherit' }}>{lienCopie ? '✓ Lien copié' : '🔗 Copier le lien'}</button>
          </div>
        </div>
      </section>

      <footer style={{ padding: '26px 20px', borderTop: `1px solid ${ct}14`, textAlign: 'center' }}>
        <p style={{ fontSize: 11.5, color: `${ct}77`, maxWidth: 680, margin: '0 auto 10px', lineHeight: 1.6 }}>{AVIS_LEGAL}</p>
        <p style={{ fontSize: 12, color: `${ct}66` }}>{config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span></p>
      </footer>
    </div>
  );
}

const lienBtn = (bg: string, fg: string, bord: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: fg, border: `1px solid ${bord}22`, borderRadius: 50, textDecoration: 'none', fontSize: 13.5, fontWeight: 700, display: 'inline-block' });