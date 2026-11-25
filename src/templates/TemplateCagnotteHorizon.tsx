// src/templates/TemplateCagnotteHorizon.tsx
// e-Vend Studio — Cagnotte « Horizon » : page de collecte de style « lancement de projet » (bleu nuit, accent jaune,
// titres précédés d'un tiret, chronologie centrale numérotée, vidéo, répartition des fonds, partenaires, compte à rebours).
// Même thermomètre géant que « Cause ». Mêmes dons que les autres modèles (Stripe / PayPal du gestionnaire, aucune commission).

import { useState, useEffect, useRef, useMemo } from 'react';
import { ModalDon, useLargeur, argent, couleurValide, lienReseau, AVIS_LEGAL, type EtatPublic } from './TemplateCagnotteClassique';
import {
  CONFIG_CAUSE_DEFAUT, Thermometre, Photo, httpsUrl, tab, texteSur, idYoutube, aPhoto,
  type ConfigCause, type SectionCause, type JalonThermo, type BlocHistoire, type Etape, type PhotoGalerie, type Temoignage, type MembreEquipe, type Question, type Impact, type Raison, type Chiffre,
} from './TemplateCagnotteCause';

// ─── TYPES ─────────────────────────────────────────────────────────
export interface PartAffectation { libelle: string; pct: number }
export interface Partenaire { nom: string; logoUrl: string; lien: string }
export interface PointCle { texte: string }

export interface ConfigHorizon extends ConfigCause {
  couleurAccent2: string;    // violet des pastilles et en-têtes de tableau
  couleurAccent3: string;    // vert/bleu des bandeaux
  barreGauche: string;
  barreDroite: string;
  pointsCles: PointCle[];
  titrePointsCles: string;
  titreProgression: string;
  titreRepartition: string;
  texteRepartition: string;
  repartition: PartAffectation[];
  titrePartenaires: string;
  partenaires: Partenaire[];
}

export const SECTIONS_HORIZON: { id: SectionCause; label: string }[] = [
  { id: 'chiffres', label: 'Progression (chiffres)' },
  { id: 'histoire', label: 'Présentation et sections photo' },
  { id: 'pointsCles', label: 'Points clés (flèches)' },
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'video', label: 'Vidéo YouTube' },
  { id: 'chronologie', label: 'Chronologie' },
  { id: 'repartition', label: 'Utilisation des fonds' },
  { id: 'raisons', label: 'Pourquoi nous soutenir' },
  { id: 'impacts', label: 'Votre don en action' },
  { id: 'galerie', label: 'Galerie de photos' },
  { id: 'equipe', label: "L'équipe" },
  { id: 'temoignages', label: 'Témoignages' },
  { id: 'nouvelles', label: 'Mises à jour' },
  { id: 'compteRebours', label: 'Compte à rebours' },
  { id: 'faq', label: 'Questions fréquentes' },
  { id: 'donateurs', label: 'Mur des donateurs' },
];

export const PALETTES_HORIZON: { id: string; label: string; principale: string; fond: string; cartes: string; texte: string; a2: string; a3: string }[] = [
  { id: 'nuit', label: 'Nuit & jaune', principale: '#fdb913', fond: '#1b1d36', cartes: '#252b4d', texte: '#ffffff', a2: '#7a5bd6', a3: '#1fc8a0' },
  { id: 'aurore', label: 'Aurore', principale: '#ff8a3d', fond: '#1d1a2e', cartes: '#2a2540', texte: '#ffffff', a2: '#c04fd0', a3: '#ff5e7e' },
  { id: 'lagon', label: 'Lagon', principale: '#2dd4bf', fond: '#0f1c2b', cartes: '#192b3f', texte: '#ffffff', a2: '#3b82f6', a3: '#22c55e' },
  { id: 'prune', label: 'Prune', principale: '#f472b6', fond: '#1e1530', cartes: '#2b2045', texte: '#ffffff', a2: '#8b5cf6', a3: '#38bdf8' },
  { id: 'clair', label: 'Clair', principale: '#e6a100', fond: '#f4f6fb', cartes: '#ffffff', texte: '#1b1d36', a2: '#6c5ce7', a3: '#14b8a6' },
];

export const CONFIG_HORIZON_DEFAUT: ConfigHorizon = {
  ...CONFIG_CAUSE_DEFAUT,
  themeId: 'horizon',
  nomEntreprise: 'Bibliothèque Les Mille Pages',
  slogan: "Aidez-nous à ouvrir une bibliothèque libre d'accès, vivante et chaleureuse, au cœur du quartier.",
  couleurPrincipale: '#fdb913',
  couleurSecondaire: '#252b4d',
  couleurFond: '#1b1d36',
  couleurTexte: '#ffffff',
  couleurAccent2: '#7a5bd6',
  couleurAccent3: '#1fc8a0',
  nomCampagne: 'Une bibliothèque pour tout le quartier',
  descriptionCampagne: "Le quartier n'a plus de bibliothèque depuis la fermeture de l'ancienne succursale. Des familles, des aînés et des étudiants n'ont nulle part où lire, étudier ou simplement se rencontrer.\n\nAvec votre aide, nous transformerons un local vacant en bibliothèque communautaire : plus de 8 000 livres, des postes informatiques gratuits, un coin pour les enfants et une salle d'activités.\n\nChaque don nous rapproche de l'ouverture des portes.",
  objectifMontant: 40000,
  nomOrganisateur: 'Collectif Les Mille Pages',
  bioOrganisateur: "Collectif de bénévoles qui anime des clubs de lecture dans le quartier depuis 2018.",
  montantsSuggeres: [20, 50, 100, 250],
  messageRemerciement: 'Merci ! Grâce à vous, bientôt, de nouvelles histoires pourront circuler.',
  kicker: 'Campagne de financement',
  texteBoutonDon: 'Soutenir le projet',
  barreGauche: 'Soutenez-nous : chaque don compte',
  barreDroite: '',
  jalonsThermo: [
    { montant: 10000, libelle: 'Local aménagé' },
    { montant: 20000, libelle: 'Premiers livres' },
    { montant: 40000, libelle: 'Ouverture' },
  ],
  titrePointsCles: 'Ce que vous financez',
  pointsCles: [
    { texte: 'Plus de 8 000 livres' }, { texte: 'Accès libre et gratuit' }, { texte: 'Coin des enfants' },
    { texte: 'Postes informatiques' }, { texte: "Salle d'activités" }, { texte: 'Ouvert à toutes et tous' },
  ],
  titreProgression: 'Progression de la campagne',
  titreHistoire: 'Pourquoi cette bibliothèque ?',
  blocsHistoire: [
    { titre: 'Un lieu pour tout le monde', texte: "Lire, étudier, jouer, rencontrer ses voisins : la bibliothèque sera un lieu ouvert à tous, sans abonnement.", photoUrl: '', position: 'droite' },
  ],
  titreRepartition: 'Où vont vos dons',
  texteRepartition: "Chaque dollar est investi dans le projet. Voici la répartition prévue des fonds amassés.",
  repartition: [
    { libelle: 'Aménagement du local', pct: 40 }, { libelle: 'Livres et collections', pct: 30 }, { libelle: 'Équipement informatique', pct: 15 },
    { libelle: 'Activités et animation', pct: 10 }, { libelle: 'Frais de campagne', pct: 5 },
  ],
  titrePartenaires: 'Ils nous soutiennent',
  partenaires: [{ nom: 'Partenaire 1', logoUrl: '', lien: '' }, { nom: 'Partenaire 2', logoUrl: '', lien: '' }, { nom: 'Partenaire 3', logoUrl: '', lien: '' }, { nom: 'Partenaire 4', logoUrl: '', lien: '' }],
  titreRaisons: 'Pourquoi nous soutenir',
  raisons: [
    { titre: 'Accès pour tous', texte: "Aucune carte, aucun frais : la bibliothèque sera gratuite pour toutes les personnes du quartier." },
    { titre: 'Apprendre ensemble', texte: "Aide aux devoirs, ateliers numériques et clubs de lecture pour tous les âges." },
    { titre: 'Un lieu vivant', texte: "Une salle d'activités pour les rencontres, les conférences et les ateliers." },
  ],
  titreImpacts: 'Votre don en action',
  impacts: [
    { montant: 20, texte: "Achète cinq livres jeunesse pour le coin des enfants." },
    { montant: 50, texte: "Finance une étagère complète de romans." },
    { montant: 100, texte: "Équipe un poste informatique d'accès libre." },
    { montant: 250, texte: "Offre une série d'ateliers pour une classe." },
  ],
  titreCompteRebours: 'Le temps file',
  texteCompteRebours: "Il reste peu de temps pour soutenir le projet. Choisissez un montant :",
  titreChronologie: 'Où en sommes-nous ?',
  chronologie: [
    { date: 'Étape 1', titre: 'Idée du projet', texte: "Un petit groupe de lecteurs imagine un lieu ouvert à tous, au cœur du quartier.", photoUrl: '' },
    { date: 'Étape 2', titre: 'Recherche du local', texte: "Nous trouvons un local vacant et négocions un bail avantageux avec le propriétaire.", photoUrl: '' },
    { date: 'Étape 3', titre: 'Lancement de la campagne', texte: "Nous invitons toute la communauté à contribuer et à partager l'initiative.", photoUrl: '' },
    { date: 'Étape 4', titre: 'Aménagement et ouverture', texte: "Travaux, installation des collections et grande fête d'ouverture.", photoUrl: '' },
  ],
  titreGalerie: 'En images',
  galerie: [
    { url: '', legende: 'Le local' }, { url: '', legende: 'Nos bénévoles' }, { url: '', legende: 'Club de lecture' },
    { url: '', legende: 'Les collections' }, { url: '', legende: 'Plan d\'aménagement' },
  ],
  titreTemoignages: 'Ce que disent nos proches',
  temoignages: [
    { nom: 'Élise M.', role: 'Enseignante', texte: "Un tel lieu manque cruellement au quartier. Mes élèves y trouveraient enfin un endroit calme pour lire.", date: '' },
    { nom: 'Hugo P.', role: 'Résident', texte: "J'ai grandi ici. Voir une bibliothèque renaître serait un vrai cadeau pour les prochaines générations.", date: '' },
  ],
  titreEquipe: 'Les personnes derrière le projet',
  equipe: [{ nom: 'Marie Lavoie', role: 'Coordonnatrice', photoUrl: '' }, { nom: 'Antoine Bégin', role: 'Responsable des collections', photoUrl: '' }, { nom: 'Rita Gomez', role: 'Animation jeunesse', photoUrl: '' }],
  titreFaq: 'Questions fréquentes',
  faq: [
    { q: 'À quoi serviront les dons ?', r: "Les fonds servent à aménager le local, acheter les livres et l'équipement, et lancer les activités. Le tableau « Où vont vos dons » en donne la répartition." },
    { q: 'Puis-je donner de façon anonyme ?', r: "Oui. Il suffit de cocher « Don anonyme » dans la fenêtre de don : votre nom n'apparaîtra pas." },
    { q: 'Recevrai-je un reçu fiscal ?', r: "Sauf mention contraire de l'organisateur, un don ne donne pas droit à un reçu fiscal. Écrivez-nous pour en savoir plus." },
    { q: "Que se passe-t-il si l'objectif est dépassé ?", r: 'Les sommes supplémentaires serviront à enrichir les collections et à financer des activités.' },
  ],
  titreFinal: 'Rejoignez la communauté',
  texteFinal: 'Soyez parmi les premiers à suivre le projet et à partager la campagne.',
  chiffres: [{ valeur: '8 000', libelle: 'livres prévus' }, { valeur: '120', libelle: 'bénévoles' }],
  misesAJour: [
    { date: new Date().toISOString(), titre: 'Le local est réservé', texte: 'Le propriétaire a accepté de nous réserver le local jusqu\'à la fin de la campagne.' },
  ],
};

// ─── HELPERS ────────────────────────────────────────────────────────
const FONT_H = "'Ubuntu', 'Fira Sans', sans-serif";
const FONT_H_SERIF = "'Playfair Display', Georgia, serif";
const COULEURS_PIE = (cp: string, a2: string, a3: string) => [cp, a2, '#b455d0', a3, '#4f8cff', '#ff6b8a', '#9be15d', '#f59e0b'];

// Décompte : possède sa propre horloge pour ne pas redessiner toute la page chaque seconde
function Decompte({ finMs, police, taille, surCc, isMobile }: { finMs: number; police: string; taille: (min: number, vw: number, max: number) => string; surCc: string; isMobile: boolean }) {
  const [maintenant, setMaintenant] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);
  const reste = Number.isFinite(finMs) ? Math.max(0, finMs - maintenant) : 0;
  const cases: [number, string][] = [[Math.floor(reste / 86400000), 'Jours'], [Math.floor(reste / 3600000) % 24, 'Heures'], [Math.floor(reste / 60000) % 60, 'Minutes'], [Math.floor(reste / 1000) % 60, 'Secondes']];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
      {cases.map(([v, l], i) => (
        <div key={l} style={{ textAlign: 'center', borderLeft: i ? `1px solid ${surCc}22` : 'none', padding: '4px 4px' }}>
          <div style={{ fontFamily: police, fontSize: taille(26, 4, 46), fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          <div style={{ fontSize: isMobile ? 12 : 16, color: `${surCc}99` }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// Petits points décoratifs façon « réseau » (positions fixes, sans hasard)
const POINTS: [number, number, number, number][] = [
  [6, 12, 6, .8], [12, 62, 10, .9], [18, 30, 5, .5], [24, 84, 8, .7], [31, 9, 4, .5], [38, 72, 6, .6], [45, 90, 5, .5], [53, 6, 7, .6],
  [61, 78, 6, .7], [68, 20, 5, .5], [74, 88, 9, .8], [81, 40, 5, .6], [86, 10, 8, .7], [90, 66, 6, .6], [95, 30, 5, .5], [97, 82, 10, .8], [3, 44, 5, .5], [58, 50, 4, .4],
];

function LecteurVideo({ id, cp, a2 }: { id: string; cp: string; a2: string }) {
  const [lancee, setLancee] = useState(false);
  const [vignetteKo, setVignetteKo] = useState(false);
  return (
    <div style={{ background: '#fff', padding: 'clamp(8px, 1.6vw, 18px)', borderRadius: 4, boxShadow: `0 30px 80px ${a2}33` }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: `linear-gradient(135deg, ${a2}, #b455d0 60%, ${cp}55)`, overflow: 'hidden' }}>
        {lancee ? (
          <iframe title="Vidéo de la campagne" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        ) : (
          <>
            {!vignetteKo && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" onError={() => setVignetteKo(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <button onClick={() => setLancee(true)} aria-label="Lire la vidéo" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(64px, 9vw, 100px)', height: 'clamp(64px, 9vw, 100px)', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.35)' }}>
              <span style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: `22px solid ${a2}`, marginLeft: 6 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────
interface Props { config?: Partial<ConfigHorizon>; isPreviewMobile?: boolean; siteId?: number; vendeurId?: number }

export default function TemplateCagnotteHorizon({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const brut = (configPartiel || {}) as Partial<ConfigHorizon>;
  // Réglages enregistrés avec un autre modèle : on garde les couleurs et la police de celui-ci
  const autreModele = brut.themeId !== 'horizon';
  const brutNet: Partial<ConfigHorizon> = { ...brut };
  if (autreModele) { delete brutNet.couleurPrincipale; delete brutNet.couleurSecondaire; delete brutNet.couleurFond; delete brutNet.couleurTexte; delete brutNet.couleurAccent2; delete brutNet.couleurAccent3; delete brutNet.police; }
  const config: ConfigHorizon = { ...CONFIG_HORIZON_DEFAUT, ...brutNet };
  if (!Array.isArray(config.montantsSuggeres) || !config.montantsSuggeres.length) config.montantsSuggeres = CONFIG_HORIZON_DEFAUT.montantsSuggeres;
  const apercu = !siteId;
  const largeur = useLargeur();
  const isMobile = isPreviewMobile || largeur <= 768;
  const taille = (min: number, vw: number, max: number) => (isPreviewMobile ? `${Math.round(min + (max - min) * 0.1)}px` : `clamp(${min}px, ${vw}vw, ${max}px)`);
  const cp = couleurValide(config.couleurPrincipale, '#fdb913');
  const cc = couleurValide(config.couleurSecondaire, '#252b4d');
  const cf = couleurValide(config.couleurFond, '#1b1d36');
  const ct = couleurValide(config.couleurTexte, '#ffffff');
  const a2 = couleurValide(config.couleurAccent2, '#7a5bd6');
  const a3 = couleurValide(config.couleurAccent3, '#1fc8a0');
  const surCp = texteSur(cp), surCc = texteSur(cc), surA2 = texteSur(a2);
  const police = config.police === 'classique' ? FONT_H_SERIF : FONT_H;
  const fontsUrl = config.police === 'classique'
    ? 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Fira+Sans:wght@400;500;600&display=swap'
    : 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@500;700&family=Fira+Sans:wght@400;500;600&display=swap';
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
  const maintenant = Date.now();   // les chiffres qui changent chaque seconde sont dans <Decompte>

  const chargerEtat = () => {
    if (!siteId) return;
    fetch(`/api/dons/public/${siteId}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d === 'object') setEtat(d as EtatPublic); })
      .catch(() => {});
  };
  useEffect(chargerEtat, [siteId]);

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
  const joursRestants = Number.isFinite(finMs) ? Math.max(0, Math.ceil((finMs - maintenant) / 86400000)) : null;
  const termine = !apercu && etat !== null && etat.statut === 'terminee';
  const nonOuvert = !apercu && etat !== null && !etat.ouvert && !termine;
  const donsOuverts = apercu || etat === null || etat.ouvert;
  const modes = apercu ? { stripe: true, paypal: false } : (etat ? etat.modes : { stripe: true, paypal: false });
  const minimum = Math.max(Number(config.montantMinimum) || 1, etat ? etat.don_min : 1);
  const maximum = etat ? etat.don_max : 10000;

  const ouvrirDon = (m?: number) => { if (donsOuverts) { setMontantInitial(m); setModalDon(true); } };
  const copierLien = () => { try { navigator.clipboard.writeText(window.location.href.split('?')[0]).then(() => { setLienCopie(true); setTimeout(() => setLienCopie(false), 2500); }); } catch { /* ignore */ } };
  const libBouton = termine ? 'Campagne terminée' : nonOuvert ? 'Bientôt ouvert aux dons' : (config.texteBoutonDon || 'Faire un don');
  const defiler = (id: string) => { const el = racine.current && racine.current.querySelector(`#hz-${id}`); if (el && 'scrollIntoView' in el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  // ── Contenu ──
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
  const points = tab<PointCle>(config.pointsCles, []).filter(x => x.texte);
  const parts = tab<PartAffectation>(config.repartition, []).filter(x => x.libelle && Number(x.pct) > 0);
  const partenaires = tab<Partenaire>(config.partenaires, []).filter(x => x.nom || httpsUrl(x.logoUrl)).filter(x => apercu || httpsUrl(x.logoUrl) || x.nom);
  const videoId = idYoutube(config.videoUrl);
  const afficherDonateurs = config.afficherDonateurs !== false && donsListe.length > 0 && visible('donateurs');
  const sommeParts = parts.reduce((a, x) => a + Number(x.pct), 0) || 1;
  const sec = (id: SectionCause, ok: boolean) => visible(id) && ok;
  const aff = {
    chiffres: sec('chiffres', true),
    histoire: sec('histoire', !!config.descriptionCampagne || blocs.length > 0),
    pointsCles: sec('pointsCles', points.length > 0),
    partenaires: sec('partenaires', partenaires.length > 0),
    video: sec('video', !!videoId),
    chronologie: sec('chronologie', etapes.length > 0),
    repartition: sec('repartition', parts.length > 0),
    raisons: sec('raisons', raisons.length > 0),
    impacts: sec('impacts', impacts.length > 0),
    galerie: sec('galerie', photos.length > 0),
    equipe: sec('equipe', equipe.length > 0),
    temoignages: sec('temoignages', temoins.length > 0),
    nouvelles: sec('nouvelles', nouvelles.length > 0),
    compteRebours: sec('compteRebours', Number.isFinite(finMs) && !termine && finMs > maintenant),
    faq: sec('faq', questions.length > 0),
  };

  // ── Styles communs ──
  const pad = isMobile ? '52px 18px' : '84px 24px';
  const conteneur: React.CSSProperties = { maxWidth: 1170, margin: '0 auto', width: '100%' };
  // Composants stables (pas recréés à chaque rendu) : sinon la vidéo et les photos seraient rechargées à chaque clic
  const Section = useMemo(() => function Section({ id, alt, children, p }: { id?: string; alt?: boolean; children: React.ReactNode; p?: string }) {
    return <section id={id ? `hz-${id}` : undefined} style={{ padding: p || pad, background: alt ? cc : 'transparent', color: alt ? surCc : ct, position: 'relative' }}><div style={conteneur}>{children}</div></section>;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad, cc, surCc, ct]);
  const Titre = useMemo(() => function Titre({ texte, droite, alt }: { texte: string; droite?: React.ReactNode; alt?: boolean }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: isMobile ? 28 : 44 }}>
        <h2 style={{ fontFamily: police, fontSize: taille(26, 4.2, 46), fontWeight: 700, lineHeight: 1.15, display: 'flex', alignItems: 'center', gap: 14, overflowWrap: 'anywhere', color: alt ? surCc : ct }}>
          <span aria-hidden="true" style={{ width: isMobile ? 26 : 44, height: 5, background: cp, flexShrink: 0, borderRadius: 1 }} />{texte}
        </h2>
        {droite}
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isPreviewMobile, police, surCc, ct, cp]);
  const btnJaune = (grand = false): React.CSSProperties => ({ background: cp, color: surCp, border: 'none', padding: grand ? '17px 34px' : '11px 22px', borderRadius: 3, fontSize: grand ? 17 : 14.5, fontWeight: 700, cursor: donsOuverts ? 'pointer' : 'not-allowed', opacity: donsOuverts ? 1 : 0.55, fontFamily: 'inherit', boxShadow: donsOuverts ? `0 10px 30px ${cp}40` : 'none', whiteSpace: 'nowrap' });
  const gradViolet = `linear-gradient(90deg, ${a2}, #b455d0)`;
  const gradVert = `linear-gradient(90deg, ${a3}, #3a6fd0)`;
  const motsTitre = (() => { const t = String(config.nomCampagne || '').trim(); const k = t.lastIndexOf(' '); return k > 0 ? { debut: t.slice(0, k), dernier: t.slice(k + 1) } : { debut: '', dernier: t }; })();

  const liens = [
    aff.histoire ? ['histoire', 'Présentation'] : null, aff.chronologie ? ['chronologie', 'Étapes'] : null, aff.equipe ? ['equipe', 'Équipe'] : null,
    aff.temoignages ? ['temoignages', 'Témoignages'] : null, aff.faq ? ['faq', 'Questions'] : null,
  ].filter(Boolean) as [string, string][];
  const courrielValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email || '');
  const dateFinTexte = Number.isFinite(finMs) ? new Date(finMs).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const couleursPie = COULEURS_PIE(cp, a2, a3);
  const conic = (() => { let acc = 0; return parts.map((x, i) => { const d = (Number(x.pct) / sommeParts) * 100; const seg = `${couleursPie[i % couleursPie.length]} ${acc}% ${acc + d}%`; acc += d; return seg; }).join(', '); })();
  const ligneTemoin = isMobile ? 1 : 2;
  const nbPagesTemoin = Math.max(1, Math.ceil(temoins.length / ligneTemoin));
  const pageTemoin = Math.min(indexTemoin, nbPagesTemoin - 1);

  return (
    <div ref={racine} className="hz-root" style={{ fontFamily: "'Fira Sans', sans-serif", background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden', lineHeight: 1.65 }}>
      <link rel="stylesheet" href={fontsUrl} />
      <style>{`
        .hz-root *, .hz-root *::before, .hz-root *::after { box-sizing: border-box; }
        .hz-root h1, .hz-root h2, .hz-root h3, .hz-root h4, .hz-root p, .hz-root figure { margin: 0; }
        .hz-btn { transition: transform .2s, filter .2s; } .hz-btn:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.08); }
        .hz-lien { background: none; border: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; padding: 6px 2px; opacity: .8; } .hz-lien:hover { opacity: 1; color: ${cp}; }
        .hz-carte { transition: transform .25s; } .hz-carte:hover { transform: translateY(-4px); }
        .hz-photo { transition: transform .5s; } .hz-gal:hover .hz-photo { transform: scale(1.06); }
        @keyframes hz-lueur { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
      `}</style>

      {modalDon && <ModalDon config={config} cp={cp} cs={cf} siteId={siteId} modes={modes} minimum={minimum} maximum={maximum} apercu={apercu} montantInitial={montantInitial} onClose={() => setModalDon(false)} />}

      {zoom !== null && photos[zoom] && (
        <div role="dialog" aria-modal="true" onClick={() => setZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(5,6,20,.94)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <button aria-label="Fermer" onClick={() => setZoom(null)} style={{ position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>✕</button>
          {photos.length > 1 && <button aria-label="Précédente" onClick={e => { e.stopPropagation(); setZoom((zoom - 1 + photos.length) % photos.length); }} style={{ position: 'absolute', left: 14, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>‹</button>}
          <figure onClick={e => e.stopPropagation()} style={{ maxWidth: 'min(92vw, 1100px)', maxHeight: '86vh', textAlign: 'center' }}>
            {httpsUrl(photos[zoom].url) && <img src={photos[zoom].url.trim()} alt={photos[zoom].legende || ''} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }} />}
            {photos[zoom].legende && <figcaption style={{ color: '#fff', marginTop: 12, fontSize: 15 }}>{photos[zoom].legende}</figcaption>}
          </figure>
          {photos.length > 1 && <button aria-label="Suivante" onClick={e => { e.stopPropagation(); setZoom((zoom + 1) % photos.length); }} style={{ position: 'absolute', right: 14, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>›</button>}
        </div>
      )}

      {retour && (
        <div role="status" style={{ position: 'fixed', top: 82, left: '50%', transform: 'translateX(-50%)', zIndex: 900, width: 'calc(100% - 32px)', maxWidth: 520, background: retour.type === 'succes' ? '#ecfdf5' : retour.type === 'annule' ? '#fffbeb' : '#fef2f2', border: `1px solid ${retour.type === 'succes' ? '#6ee7b7' : retour.type === 'annule' ? '#fcd34d' : '#fca5a5'}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,.4)', color: '#1a1a1a' }}>
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

      {/* HAUT DE PAGE : barre d'information + navigation */}
      <header style={{ position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse 90% 70% at 50% 100%, ${a2}55, transparent 70%), linear-gradient(180deg, ${cf}, ${cf})` }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {POINTS.map(([x, y, t, o], i) => <span key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: t, height: t, borderRadius: '50%', background: i % 3 === 0 ? '#2f8cff' : 'transparent', border: i % 3 === 0 ? 'none' : `1.5px solid ${'#4f8cff'}`, opacity: o * 0.7 }} />)}
        </div>
        {httpsUrl(config.photoHeroUrl) && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHeroUrl.trim()})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.22 }} />}
        <div style={{ ...conteneur, position: 'relative', padding: isMobile ? '0 18px' : '0 24px' }}>
          {(config.barreGauche || config.barreDroite) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '16px 0', borderBottom: `1px solid ${ct}22`, fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: cp }}>{config.barreGauche}</span>
              {config.barreDroite && (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.barreDroite) ? <a href={`mailto:${config.barreDroite}`} style={{ color: cp, textDecoration: 'none' }}>✉ {config.barreDroite}</a> : <span style={{ color: cp }}>{config.barreDroite}</span>)}
            </div>
          )}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {httpsUrl(config.logoUrl)
                ? <img src={config.logoUrl.trim()} alt="logo" style={{ height: 40, objectFit: 'contain' }} />
                : <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%', border: `2px dashed ${a2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: police, fontWeight: 700, color: ct, flexShrink: 0 }}>{(config.nomEntreprise || '?').charAt(0).toUpperCase()}</span>}
              <span style={{ fontFamily: police, fontSize: 17, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{config.nomEntreprise}</span>
            </div>
            {!isMobile && <div style={{ display: 'flex', gap: 20 }}>{liens.map(([id, l]) => <button key={id} className="hz-lien" onClick={() => defiler(id)} style={{ color: '#9aa7f0', opacity: 1 }}>{l}</button>)}</div>}
            {isMobile && <button className="hz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnJaune()}>{donsOuverts ? 'Donner' : (termine ? 'Terminée' : 'Bientôt')}</button>}
          </nav>

          {/* HÉROS centré + thermomètre */}
          <div style={{ textAlign: 'center', padding: isMobile ? '28px 0 20px' : '52px 0 24px', position: 'relative' }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9aa7f0', marginBottom: 18 }}>{config.kicker}{joursRestants !== null && !termine ? ` · ${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}` : ''}</p>
            <h1 style={{ fontFamily: police, fontSize: taille(34, 6.2, 74), fontWeight: 700, lineHeight: 1.1, maxWidth: 980, margin: '0 auto 20px', overflowWrap: 'anywhere' }}>{motsTitre.debut}{motsTitre.debut ? ' ' : ''}{motsTitre.dernier}</h1>
            {config.slogan && <p style={{ fontSize: taille(16, 2.1, 21), color: `${ct}cc`, maxWidth: 740, margin: '0 auto 26px' }}>{config.slogan}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="hz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnJaune(true)}>{libBouton}</button>
              {aff.histoire && <button className="hz-lien" onClick={() => defiler('histoire')} style={{ color: cp, opacity: 1, fontSize: 17 }}>En savoir plus →</button>}
            </div>
            <p style={{ fontSize: 12.5, color: `${ct}88`, marginTop: 14 }}>🔒 Paiement sécurisé · aucune commission sur les dons</p>
            <div style={{ marginTop: isMobile ? 26 : 34 }}>
              <Thermometre pct={pct} total={total} objectif={objectif} jalons={tab<JalonThermo>(config.jalonsThermo, [])} cp={cp} texte={ct} hauteur={isMobile ? 320 : 430} police={police} />
            </div>
          </div>
        </div>
      </header>

      {(termine || nonOuvert) && (
        <div style={{ background: termine ? '#111827' : '#fffbeb', color: termine ? '#fff' : '#92400e', padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
          {termine ? '🏁 Cette campagne est terminée. Merci à toutes les personnes qui ont contribué !' : "⏳ Cette cagnotte n'est pas encore ouverte aux dons. Revenez bientôt !"}
        </div>
      )}

      {/* PRÉSENTATION */}
      {aff.histoire && (
        <Section id="histoire">
          <Titre texte={config.titreHistoire || 'Pourquoi ce projet ?'} />
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 30 : 64, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, color: `${ct}d0`, lineHeight: 1.85, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{config.descriptionCampagne}</div>
              {aff.pointsCles && (
                <div style={{ marginTop: 30 }}>
                  {config.titrePointsCles && <p style={{ fontFamily: police, fontSize: 19, fontWeight: 700, marginBottom: 14 }}>{config.titrePointsCles}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px 20px' }}>
                    {points.slice(0, 12).map((x, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600, fontSize: 15 }}><span style={{ color: cp, fontSize: 18 }}>→</span>{x.texte}</div>)}
                  </div>
                </div>
              )}
            </div>
            {aPhoto(config.photoCampagne, apercu) && (
              <div style={{ flex: isMobile ? undefined : '0 0 42%', width: isMobile ? '100%' : undefined, aspectRatio: '1 / 1', maxHeight: 480, borderRadius: 10, overflow: 'hidden', boxShadow: `0 30px 80px ${a2}44`, border: `1px solid ${ct}1a` }}>
                <Photo url={config.photoCampagne} apercu={apercu} etiquette="Photo de la campagne" cp={cp} cc={cc} />
              </div>
            )}
          </div>
          {blocs.map((b, i) => {
            const photo = aPhoto(b.photoUrl, apercu); const gauche = b.position === 'gauche';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'column' : (gauche ? 'row' : 'row-reverse'), gap: isMobile ? 22 : 60, alignItems: 'center', marginTop: isMobile ? 46 : 80 }}>
                {photo && <div style={{ flex: '0 0 44%', width: isMobile ? '100%' : undefined, aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', border: `1px solid ${ct}1a` }}><Photo url={b.photoUrl} apercu={apercu} etiquette={b.titre} cp={cp} cc={cc} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {b.titre && <h3 style={{ fontFamily: police, fontSize: taille(22, 3, 32), fontWeight: 700, marginBottom: 14, overflowWrap: 'anywhere' }}>{b.titre}</h3>}
                  <p style={{ fontSize: 16.5, color: `${ct}cc`, lineHeight: 1.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{b.texte}</p>
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* PARTENAIRES */}
      {aff.partenaires && (
        <Section p={isMobile ? '12px 18px 40px' : '16px 24px 56px'}>
          {config.titrePartenaires && <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: `${ct}99`, marginBottom: 22 }}>{config.titrePartenaires}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {partenaires.slice(0, 10).map((x, i) => {
              const contenu = httpsUrl(x.logoUrl)
                ? <img src={x.logoUrl.trim()} alt={x.nom} loading="lazy" style={{ maxWidth: '78%', maxHeight: 54, objectFit: 'contain' }} />
                : <span style={{ fontFamily: police, fontSize: 18, fontWeight: 700, color: `${ct}bb`, textAlign: 'center', padding: '0 10px' }}>{x.nom}</span>;
              const style: React.CSSProperties = { width: isMobile ? 'calc(50% - 10px)' : 204, height: 100, background: cc, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 2 };
              return httpsUrl(x.lien) ? <a key={i} href={x.lien.trim()} target="_blank" rel="noopener noreferrer" style={style}>{contenu}</a> : <div key={i} style={style}>{contenu}</div>;
            })}
          </div>
        </Section>
      )}

      {/* PROGRESSION + VIDÉO */}
      {(aff.chiffres || aff.video) && (
        <Section id="progression" alt>
          {aff.chiffres && (
            <>
              <Titre alt texte={config.titreProgression || 'Progression de la campagne'} />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr) auto', gap: isMobile ? 22 : 26, alignItems: 'center' }}>
                {[{ l: 'Montant amassé', v: argent(Math.round(total)) }, { l: 'Objectif', v: argent(objectif) }, { l: 'Donateurs', v: String(nbDonateurs) }, ...(chiffresPerso.length ? [{ l: chiffresPerso[0].libelle, v: chiffresPerso[0].valeur }] : [{ l: 'Jours restants', v: joursRestants !== null ? String(joursRestants) : '—' }])].map((c, i) => (
                  <div key={i}><p style={{ fontSize: 14.5, fontWeight: 700, color: '#8b8ef0', marginBottom: 8 }}>{c.l}</p><p style={{ fontFamily: police, fontSize: taille(20, 2.6, 30), fontWeight: 700, color: surCc, overflowWrap: 'anywhere' }}>{c.v}</p></div>
                ))}
                <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}><button className="hz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={{ ...btnJaune(true), width: isMobile ? '100%' : undefined, padding: '16px 26px', fontSize: 16 }}>{libBouton}</button></div>
              </div>
            </>
          )}
          {aff.video && videoId && <div style={{ marginTop: aff.chiffres ? (isMobile ? 36 : 56) : 0, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>{!aff.chiffres && <Titre alt texte={config.titreVideo || 'Découvrez le projet en vidéo'} />}<LecteurVideo id={videoId} cp={cp} a2={a2} /></div>}
        </Section>
      )}

      {/* CHRONOLOGIE */}
      {aff.chronologie && (
        <Section id="chronologie">
          <Titre texte={config.titreChronologie || 'Où en sommes-nous ?'} />
          <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
            <div aria-hidden="true" style={{ position: 'absolute', left: isMobile ? 24 : '50%', transform: isMobile ? 'none' : 'translateX(-50%)', top: 12, bottom: 12, width: 4, background: `${ct}e6`, borderRadius: 2 }} />
            {etapes.map((e, i) => {
              const aDroite = isMobile ? true : i % 2 === 0;
              return (
                <div key={i} style={{ position: 'relative', display: 'flex', justifyContent: aDroite ? 'flex-end' : 'flex-start', marginBottom: i < etapes.length - 1 ? (isMobile ? 34 : 18) : 0, minHeight: isMobile ? undefined : 150 }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: isMobile ? 0 : '50%', transform: isMobile ? 'none' : 'translateX(-50%)', top: 0, width: 50, height: 50, borderRadius: '50%', background: gradViolet, color: surA2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: police, fontWeight: 700, fontSize: 17, zIndex: 2, boxShadow: `0 0 0 6px ${cf}` }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ width: isMobile ? 'calc(100% - 74px)' : 'calc(50% - 48px)', textAlign: aDroite || isMobile ? 'left' : 'right' }}>
                    {e.date && <p style={{ fontSize: 14.5, fontWeight: 600, color: '#4f8cff', marginBottom: 2 }}>{e.date}</p>}
                    {e.titre && <h3 style={{ fontFamily: police, fontSize: taille(20, 2.4, 26), fontWeight: 700, marginBottom: 10, overflowWrap: 'anywhere' }}>{e.titre}</h3>}
                    {httpsUrl(e.photoUrl) && <div style={{ height: 130, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}><Photo url={e.photoUrl} apercu={false} cp={cp} cc={cc} /></div>}
                    {e.texte && <p style={{ fontSize: 16, color: `${ct}aa`, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{e.texte}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* UTILISATION DES FONDS */}
      {aff.repartition && (
        <Section id="repartition" alt>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 30 : 56, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Titre alt texte={config.titreRepartition || 'Où vont vos dons'} />
              {config.texteRepartition && <p style={{ fontSize: 17, color: `${surCc}bb`, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{config.texteRepartition}</p>}
            </div>
            <div style={{ display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
              <div role="img" aria-label="Répartition des fonds" style={{ width: isMobile ? 220 : 280, height: isMobile ? 220 : 280, borderRadius: '50%', background: `conic-gradient(${conic})`, boxShadow: `0 20px 60px ${a2}44`, flexShrink: 0 }} />
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {parts.map((x, i) => <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 15.5 }}><span style={{ width: 11, height: 11, borderRadius: '50%', background: couleursPie[i % couleursPie.length], flexShrink: 0 }} />{Math.round((Number(x.pct) / sommeParts) * 100)} % {x.libelle}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: isMobile ? 34 : 54, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto', background: cf, color: ct, overflow: 'hidden', borderRadius: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: gradViolet, color: '#fff', fontFamily: police, fontWeight: 700, fontSize: isMobile ? 15 : 20, padding: isMobile ? '14px 14px' : '18px 20px' }}><span>Poste</span><span>Part</span><span>Montant</span></div>
            {parts.map((x, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: isMobile ? '14px 14px' : '17px 20px', background: i % 2 ? `${ct}08` : 'transparent', fontWeight: 600, fontSize: isMobile ? 14 : 16, gap: 6 }}>
                <span style={{ overflowWrap: 'anywhere' }}>{x.libelle}</span><span>{Math.round((Number(x.pct) / sommeParts) * 100)} %</span><span style={{ color: a3, fontWeight: 700 }}>{argent(Math.round((Number(x.pct) / sommeParts) * objectif))}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* POURQUOI NOUS SOUTENIR */}
      {aff.raisons && (
        <Section id="raisons">
          <Titre texte={config.titreRaisons || 'Pourquoi nous soutenir'} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 30 }}>
            {raisons.slice(0, 9).map((r, i) => (
              <div key={i} className="hz-carte" style={{ background: cc, color: surCc, borderTop: '0', overflow: 'hidden', minHeight: 230 }}>
                <div style={{ height: 14, background: gradVert }} />
                <div style={{ padding: '26px 28px 32px' }}>
                  <h3 style={{ fontFamily: police, fontSize: 22, fontWeight: 700, marginBottom: 16, overflowWrap: 'anywhere' }}>{r.titre}</h3>
                  <p style={{ fontSize: 16, color: `${surCc}b0`, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{r.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* IMPACT */}
      {aff.impacts && (
        <Section id="impacts" alt>
          <Titre alt texte={config.titreImpacts || 'Votre don en action'} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(4, impacts.length)}, 1fr)`, gap: 22 }}>
            {impacts.slice(0, 8).map((im, i) => (
              <button key={i} className="hz-carte" disabled={!donsOuverts} onClick={() => ouvrirDon(Number(im.montant))} style={{ textAlign: 'left', background: cf, color: ct, border: `1px solid ${ct}1a`, padding: '26px 24px', cursor: donsOuverts ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontFamily: police, fontSize: 38, fontWeight: 700, color: cp, lineHeight: 1 }}>{argent(Number(im.montant))}</span>
                <span style={{ fontSize: 16, color: `${ct}bb`, lineHeight: 1.6, flex: 1 }}>{im.texte}</span>
                {donsOuverts && <span style={{ fontSize: 14, fontWeight: 700, color: cp }}>Donner ce montant →</span>}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* GALERIE */}
      {aff.galerie && (
        <Section id="galerie">
          <Titre texte={config.titreGalerie || 'En images'} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 18 }}>
            {photos.slice(0, 18).map((p, i) => (
              <figure key={i} className="hz-gal" onClick={() => httpsUrl(p.url) && setZoom(i)}
                style={{ position: 'relative', aspectRatio: i % 5 === 0 && !isMobile ? '2 / 1' : '1 / 1', gridColumn: i % 5 === 0 && !isMobile ? 'span 2' : undefined, overflow: 'hidden', cursor: httpsUrl(p.url) ? 'zoom-in' : 'default', border: `1px solid ${ct}14` }}>
                <div className="hz-photo" style={{ width: '100%', height: '100%' }}><Photo url={p.url} apercu={apercu} etiquette={p.legende} cp={cp} cc={cc} /></div>
                {p.legende && httpsUrl(p.url) && <figcaption style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 14px 12px', background: 'linear-gradient(0deg, rgba(5,6,20,.8), transparent)', color: '#fff', fontSize: 14, fontWeight: 600 }}>{p.legende}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ÉQUIPE */}
      {aff.equipe && (
        <Section id="equipe" alt>
          <Titre alt texte={config.titreEquipe || 'Les personnes derrière le projet'} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 26 : 48, justifyContent: 'center' }}>
            {equipe.slice(0, 12).map((m, i) => (
              <div key={i} style={{ width: isMobile ? 130 : 190, textAlign: 'center' }}>
                <div style={{ width: isMobile ? 104 : 140, height: isMobile ? 104 : 140, margin: '0 auto 14px', borderRadius: '50%', padding: 4, background: gradViolet }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: cf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {httpsUrl(m.photoUrl) ? <Photo url={m.photoUrl} apercu={false} cp={cp} cc={cc} /> : <span style={{ fontFamily: police, fontSize: 40, fontWeight: 700, color: ct }}>{m.nom.charAt(0).toUpperCase()}</span>}
                  </div>
                </div>
                <p style={{ fontFamily: police, fontSize: 18, fontWeight: 700, color: surCc, overflowWrap: 'anywhere' }}>{m.nom}</p>
                {m.role && <p style={{ fontSize: 14, color: `${surCc}99`, overflowWrap: 'anywhere' }}>{m.role}</p>}
              </div>
            ))}
          </div>
          {config.nomOrganisateur && <p style={{ textAlign: 'center', marginTop: 34, fontSize: 14.5, color: `${surCc}99` }}>Organisé par <b style={{ color: surCc }}>{config.nomOrganisateur}</b>{config.bioOrganisateur ? ` — ${config.bioOrganisateur}` : ''}</p>}
        </Section>
      )}

      {/* TÉMOIGNAGES */}
      {aff.temoignages && (
        <Section id="temoignages">
          <Titre texte={config.titreTemoignages || 'Ce que disent nos proches'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 18 }}>
            {nbPagesTemoin > 1 && <button aria-label="Précédent" onClick={() => setIndexTemoin((pageTemoin - 1 + nbPagesTemoin) % nbPagesTemoin)} style={{ background: 'none', border: 'none', color: ct, fontSize: 36, cursor: 'pointer', padding: 4 }}>‹</button>}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${ligneTemoin}, 1fr)`, gap: 30 }}>
              {temoins.slice(pageTemoin * ligneTemoin, pageTemoin * ligneTemoin + ligneTemoin).map((t, i) => (
                <div key={i} style={{ background: cc, color: surCc, padding: '36px 36px 30px' }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%', padding: 3, background: gradViolet, marginBottom: 20 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: cf, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct, fontFamily: police, fontWeight: 700, fontSize: 26 }}>
                      {httpsUrl(t.photoUrl || '') ? <Photo url={t.photoUrl || ''} apercu={false} cp={cp} cc={cc} /> : (t.nom || '?').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: police, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.nom}</h3>
                  {t.role && <p style={{ fontSize: 13, color: '#8b8ef0', fontWeight: 600, marginBottom: 14 }}>{t.role}</p>}
                  <p style={{ fontSize: 16, color: `${surCc}b8`, lineHeight: 1.7, overflowWrap: 'anywhere' }}>«&nbsp;{t.texte}&nbsp;»</p>
                  {t.date && <p style={{ fontSize: 12.5, color: '#4f8cff', fontWeight: 600, marginTop: 14 }}>{t.date}</p>}
                </div>
              ))}
            </div>
            {nbPagesTemoin > 1 && <button aria-label="Suivant" onClick={() => setIndexTemoin((pageTemoin + 1) % nbPagesTemoin)} style={{ background: 'none', border: 'none', color: ct, fontSize: 36, cursor: 'pointer', padding: 4 }}>›</button>}
          </div>
        </Section>
      )}

      {/* MISES À JOUR */}
      {aff.nouvelles && (
        <Section alt p={isMobile ? '44px 18px' : '64px 24px'}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 36 }}>
            {nouvelles.slice(0, 6).map((m, i) => (
              <div key={i}>
                <h3 style={{ fontFamily: police, fontSize: 20, fontWeight: 700, color: surCc, overflowWrap: 'anywhere' }}>{m.titre}</h3>
                <div style={{ width: 40, height: 3, background: cp, margin: '10px 0 14px' }} />
                <p style={{ fontSize: 15.5, color: `${surCc}c0`, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{m.texte}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#8b8ef0', marginTop: 8 }}>{m.date ? new Date(m.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* COMPTE À REBOURS */}
      {aff.compteRebours && (
        <Section id="compte">
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 30 : 56, alignItems: 'stretch' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Titre texte={config.titreCompteRebours || 'Le temps file'} />
              {config.texteCompteRebours && <p style={{ fontSize: 17, color: `${ct}cc`, marginBottom: 18 }}>{config.texteCompteRebours}</p>}
              {impacts.length > 0 && visible('impacts') && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {impacts.slice(0, 4).map((im, i) => (
                    <li key={i}><button onClick={() => ouvrirDon(Number(im.montant))} disabled={!donsOuverts} style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', cursor: donsOuverts ? 'pointer' : 'default', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 0, fontSize: 16 }}>
                      <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: `${a3}44`, color: a3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✓</span>
                      <span><b>{argent(Number(im.montant))}</b> — {im.texte}</span></button></li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ flex: 1, background: cc, color: surCc, padding: isMobile ? '28px 22px' : '38px 36px' }}>
              <p style={{ fontFamily: police, fontSize: taille(22, 2.8, 34), fontWeight: 700, marginBottom: 26 }}>Fin de la campagne <span style={{ color: cp }}>{dateFinTexte}</span></p>
              <Decompte finMs={finMs} police={police} taille={taille} surCc={surCc} isMobile={isMobile} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[{ l: 'Amassé', v: argent(Math.round(total)), c: a3 }, { l: 'Objectif', v: argent(objectif), c: cp }, { l: 'Donateurs', v: String(nbDonateurs), c: cp }].map((x, i) => (
                  <div key={i}><p style={{ fontSize: 13, color: `${surCc}b0`, borderTop: `1px solid ${surCc}44`, paddingTop: 8 }}>{x.l}</p><p style={{ fontFamily: police, fontSize: taille(16, 2, 21), fontWeight: 700, color: x.c, overflowWrap: 'anywhere' }}>{x.v}</p></div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* DONATEURS */}
      {afficherDonateurs && (
        <Section alt p={isMobile ? '44px 18px' : '64px 24px'}>
          <Titre alt texte="Ils ont donné" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {donsListe.slice(0, 8).map((d, i) => (
              <div key={d.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: cf, color: ct }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: gradViolet, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{d.nom_donateur === 'Anonyme' ? '🕶' : (d.nom_donateur || '?').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, overflowWrap: 'anywhere' }}>{d.nom_donateur}</p>
                  {d.message && <p style={{ fontSize: 13, color: `${ct}99`, fontStyle: 'italic', overflowWrap: 'anywhere' }}>« {d.message.substring(0, 80)}{d.message.length > 80 ? '…' : ''} »</p>}
                </div>
                <span style={{ fontWeight: 700, color: cp, flexShrink: 0 }}>{Math.round(parseFloat(d.montant))} $</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* FAQ */}
      {aff.faq && (
        <Section id="faq">
          <Titre texte={config.titreFaq || 'Questions fréquentes'} />
          <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, i) => {
              const ouvert = ouvertFaq === i;
              return (
                <div key={i} style={{ background: cc, color: surCc, border: `1px solid ${ouvert ? cp + '77' : ct + '14'}` }}>
                  <button onClick={() => setOuvertFaq(ouvert ? null : i)} aria-expanded={ouvert} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '19px 24px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', fontFamily: police, fontSize: taille(16, 2.3, 20), fontWeight: 700 }}>
                    <span style={{ overflowWrap: 'anywhere' }}>{q.q}</span>
                    <span aria-hidden="true" style={{ fontSize: 26, color: cp, transform: ouvert ? 'rotate(45deg)' : 'none', transition: 'transform .2s', lineHeight: 1 }}>+</span>
                  </button>
                  {ouvert && <p style={{ padding: '0 24px 22px', fontSize: 16, color: `${surCc}c0`, lineHeight: 1.7, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{q.r}</p>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* BANDEAU FINAL */}
      <section style={{ padding: isMobile ? '24px 18px 56px' : '40px 24px 90px' }}>
        <div style={{ ...conteneur, background: `linear-gradient(100deg, ${a2} 0%, ${a3} 100%)`, color: '#fff', padding: isMobile ? '34px 24px' : '56px 60px' }}>
          <h2 style={{ fontFamily: police, fontSize: taille(26, 4, 44), fontWeight: 700, marginBottom: 16 }}>{config.titreFinal || 'Rejoignez la communauté'}</h2>
          {config.texteFinal && <p style={{ fontSize: 17, marginBottom: 20 }}>{config.texteFinal}</p>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="hz-btn" onClick={() => ouvrirDon()} disabled={!donsOuverts} style={btnJaune(true)}>{libBouton}</button>
            <button onClick={copierLien} className="hz-btn" style={{ background: 'rgba(255,255,255,.18)', color: '#fff', border: '1px solid rgba(255,255,255,.4)', padding: '16px 24px', borderRadius: 3, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{lienCopie ? '✓ Lien copié' : '🔗 Copier le lien'}</button>
          </div>
        </div>
      </section>

      {/* PIED DE PAGE */}
      <footer style={{ background: `${cc}`, color: surCc, padding: isMobile ? '40px 18px 28px' : '56px 24px 32px' }}>
        <div style={{ ...conteneur, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr 1fr', gap: isMobile ? 28 : 48 }}>
          <div>
            <p style={{ fontFamily: police, fontSize: 19, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>{config.nomEntreprise}</p>
            {config.nomOrganisateur && <p style={{ fontSize: 14.5, color: `${surCc}99` }}>Organisé par {config.nomOrganisateur}</p>}
          </div>
          <div>
            <p style={{ fontFamily: police, fontSize: 19, fontWeight: 700, marginBottom: 12 }}>Liens utiles</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              {liens.map(([id, l]) => <button key={id} className="hz-lien" onClick={() => defiler(id)} style={{ color: '#8b8ef0', opacity: 1 }}>{l}</button>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: police, fontSize: 19, fontWeight: 700, marginBottom: 12 }}>Suivez-nous</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, fontSize: 15 }}>
              {config.facebook && <a href={lienReseau('https://facebook.com/', config.facebook)} target="_blank" rel="noopener noreferrer" style={{ color: '#8b8ef0', textDecoration: 'none', fontWeight: 600 }}>Facebook</a>}
              {config.instagram && <a href={lienReseau('https://instagram.com/', config.instagram)} target="_blank" rel="noopener noreferrer" style={{ color: '#8b8ef0', textDecoration: 'none', fontWeight: 600 }}>Instagram</a>}
              {httpsUrl(config.siteExterne) && <a href={config.siteExterne.trim()} target="_blank" rel="noopener noreferrer" style={{ color: '#8b8ef0', textDecoration: 'none', fontWeight: 600 }}>Site web</a>}
              {courrielValide && <a href={`mailto:${config.email}`} style={{ color: '#8b8ef0', textDecoration: 'none', fontWeight: 600 }}>{config.email}</a>}
            </div>
          </div>
        </div>
        <div style={{ ...conteneur, borderTop: `1px solid ${surCc}22`, marginTop: 30, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: `${surCc}77`, maxWidth: 700, margin: '0 auto 8px', lineHeight: 1.6 }}>{AVIS_LEGAL}</p>
          <p style={{ fontSize: 12, color: `${surCc}66` }}>{config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span></p>
        </div>
      </footer>
    </div>
  );
}