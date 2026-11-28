// src/templates/TemplateLocationAstro.tsx
// e-Vend Studio — Template « Location d'astronomie » (reservation-location-astro)
// Location de télescopes, jumelles, montures et accessoires d'observation du ciel.
// Rendu PUBLIC : hero étoilé, catalogue filtrable, fenêtre de spécifications, réservation par dates
// avec disponibilité calculée appareil par appareil (quantité en stock).
// Les appareils sont stockés dans config.location_objets (même clé que les autres templates de location :
// c'est ce tableau que la limite d'annonces du palier compte).

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SpecLigne { label: string; valeur: string }

export interface ObjetAstro {
  id: string;
  nom: string;
  categorie: string;          // ex. « Télescopes », « Jumelles », « Accessoires »
  niveau: string;             // Débutant | Intermédiaire | Avancé (texte libre)
  resume: string;             // une ligne sur la carte
  description: string;        // texte complet dans la fenêtre
  prixJour: number;           // $ par jour
  imageUrl: string;
  images: string[];           // photos supplémentaires (fenêtre)
  quantite: number;           // nombre d'appareils identiques en stock
  disponible: boolean;
  specs: SpecLigne[];         // fiche technique
  inclus: string[];           // ce qui est fourni avec l'appareil
}

export interface ConfigLocationAstro {
  // Identité
  nomEntreprise: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHeroUrl: string;
  // Couleurs
  couleurPrincipale: string;  // violet (boutons, accents)
  couleurAccent: string;      // violet clair (italiques, étoiles)
  couleurFond: string;        // fond sombre principal
  couleurFondClair: string;   // sections claires
  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  instagram: string;
  facebook: string;
  siteExterne: string;
  // Catalogue
  location_objets: ObjetAstro[];
  // Conditions
  location_depot: string;
  location_conditions: string;
  dureeMinJours: number;
  dureeMaxJours: number;
  heureRamassage: string;
  // Contenu
  stats: { valeur: string; label: string }[];
  etapes: { titre: string; texte: string }[];
  faq: { q: string; a: string }[];
  galerie: { url: string; titre: string }[];
  // Réservation
  titreSection: string;
  descriptionResa: string;
  messageConfirmation: string;
}

// ─── PHOTOS LIBRES (Pexels) ───────────────────────────────────────────────────

const PX = (id: number, w = 800) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// ─── CONFIG PAR DÉFAUT (aperçu démo et site pas encore configuré) ─────────────

export const CONFIG_LOCATION_ASTRO_DEFAUT: ConfigLocationAstro = {
  nomEntreprise: 'Observatoire Nomade',
  slogan: 'Louez un télescope et partez à la rencontre des étoiles',
  description: 'Télescopes, jumelles, montures et accessoires prêts à observer. Nous préparons chaque appareil, vous apprenons à vous en servir et vous remettons le tout avec une carte du ciel adaptée à la saison.',
  logoUrl: '',
  photoHeroUrl: PX(2106759, 1600),
  couleurPrincipale: '#8e54d9',
  couleurAccent: '#c4b5fd',
  couleurFond: '#14112b',
  couleurFondClair: '#f5f3fb',
  adresse: '120 chemin de l\'Observatoire',
  ville: 'Mont-Mégantic, QC  J0B 1A0',
  telephone: '(819) 555-0142',
  email: 'ciel@observatoirenomade.ca',
  instagram: 'observatoirenomade',
  facebook: '',
  siteExterne: '',
  location_objets: [
    {
      id: 'a1', nom: 'Dobson 8" — Le grand collecteur', categorie: 'Télescopes', niveau: 'Débutant',
      resume: 'Le meilleur rapport lumière / prix pour découvrir planètes, nébuleuses et amas d\'étoiles.',
      description: 'Un télescope de type Dobson, simple à monter et à pointer à la main. Son grand miroir de 8 pouces récolte beaucoup de lumière : les anneaux de Saturne, les bandes de Jupiter et des dizaines de galaxies deviennent visibles. Idéal pour une première nuit sous un ciel noir.',
      prixJour: 45, imageUrl: PX(2034892), images: [PX(2646380), PX(8495471)], quantite: 2, disponible: true,
      specs: [
        { label: 'Type', valeur: 'Réflecteur Newton sur monture Dobson' },
        { label: 'Ouverture', valeur: '203 mm (8 po)' },
        { label: 'Distance focale', valeur: '1200 mm (f/5,9)' },
        { label: 'Grossissement utile', valeur: 'de 30× à 400×' },
        { label: 'Oculaires fournis', valeur: '25 mm et 10 mm' },
        { label: 'Poids', valeur: '14 kg (tube 9 kg + base 5 kg)' },
      ],
      inclus: ['2 oculaires + lentille de Barlow 2×', 'Chercheur point rouge', 'Lampe rouge et carte du ciel de la saison', 'Initiation de 20 minutes au ramassage'],
    },
    {
      id: 'a2', nom: 'Réfracteur 102 mm — Lunes et planètes', categorie: 'Télescopes', niveau: 'Débutant',
      resume: 'Images nettes et contrastées, léger et rapide à installer. Parfait pour la Lune et les planètes.',
      description: 'Un réfracteur à lentille de 102 mm : aucun réglage délicat, image très contrastée, mise en route en deux minutes. Il se transporte facilement en voiture et convient autant à l\'observation du ciel qu\'à celle d\'oiseaux ou de paysages éloignés.',
      prixJour: 38, imageUrl: PX(34195083), images: [PX(7441197)], quantite: 2, disponible: true,
      specs: [
        { label: 'Type', valeur: 'Réfracteur achromatique' },
        { label: 'Ouverture', valeur: '102 mm' },
        { label: 'Distance focale', valeur: '660 mm (f/6,5)' },
        { label: 'Monture', valeur: 'Altazimutale avec trépied en aluminium' },
        { label: 'Poids total', valeur: '7,5 kg' },
        { label: 'Étui de transport', valeur: 'Inclus' },
      ],
      inclus: ['2 oculaires', 'Diagonale à 90°', 'Filtre lunaire', 'Étui de transport rigide'],
    },
    {
      id: 'a3', nom: 'Schmidt-Cassegrain 8" GoTo', categorie: 'Télescopes', niveau: 'Intermédiaire',
      resume: 'Un ordinateur de pointage trouve pour vous plus de 40 000 objets célestes.',
      description: 'Choisissez un astre sur la raquette de commande et le télescope s\'y dirige tout seul, puis le suit pendant que la Terre tourne. Compact malgré sa longue focale, il offre des vues spectaculaires des planètes et du ciel profond.',
      prixJour: 85, imageUrl: PX(8495471), images: [PX(28760143)], quantite: 1, disponible: true,
      specs: [
        { label: 'Type', valeur: 'Schmidt-Cassegrain' },
        { label: 'Ouverture', valeur: '203 mm (8 po)' },
        { label: 'Distance focale', valeur: '2032 mm (f/10)' },
        { label: 'Pointage', valeur: 'GoTo, base de données de 40 000+ objets' },
        { label: 'Alimentation', valeur: 'Batterie externe 12 V incluse' },
        { label: 'Poids', valeur: '16 kg' },
      ],
      inclus: ['Monture GoTo et trépied', 'Batterie 12 V chargée', '3 oculaires de qualité', 'Alignement guidé au ramassage'],
    },
    {
      id: 'a4', nom: 'Newton 130 mm sur monture équatoriale', categorie: 'Télescopes', niveau: 'Avancé',
      resume: 'Une monture qui suit le ciel : l\'outil de base pour apprendre l\'astrophotographie.',
      description: 'Une monture équatoriale motorisée compense la rotation de la Terre. C\'est la configuration idéale pour observer longtemps le même objet, ou pour s\'initier à la photo du ciel avec un appareil ou un téléphone.',
      prixJour: 60, imageUrl: PX(2646380), images: [PX(4254548)], quantite: 1, disponible: true,
      specs: [
        { label: 'Type', valeur: 'Réflecteur Newton' },
        { label: 'Ouverture', valeur: '130 mm' },
        { label: 'Distance focale', valeur: '650 mm (f/5)' },
        { label: 'Monture', valeur: 'Équatoriale avec moteur de suivi' },
        { label: 'Adaptateur photo', valeur: 'Appareil photo et téléphone' },
        { label: 'Poids', valeur: '18 kg' },
      ],
      inclus: ['Moteur de suivi et contrepoids', 'Adaptateurs photo', 'Lampe rouge', 'Guide d\'alignement polaire'],
    },
    {
      id: 'a5', nom: 'Jumelles 15×70 avec trépied', categorie: 'Jumelles', niveau: 'Débutant',
      resume: 'Les cratères de la Lune, la Voie lactée et les amas d\'étoiles, sans rien régler.',
      description: 'Des jumelles puissantes pour un grand champ de vision. Montées sur trépied, elles révèlent les lunes de Jupiter, la nébuleuse d\'Orion et les riches champs d\'étoiles de la Voie lactée. Un excellent premier instrument, et parfait en famille.',
      prixJour: 22, imageUrl: PX(1567069), images: [PX(2901134)], quantite: 3, disponible: true,
      specs: [
        { label: 'Grossissement', valeur: '15×' },
        { label: 'Diamètre des objectifs', valeur: '70 mm' },
        { label: 'Champ de vision', valeur: '4,4°' },
        { label: 'Traitement optique', valeur: 'Multicouche' },
        { label: 'Poids des jumelles', valeur: '1,6 kg' },
        { label: 'Trépied', valeur: 'Inclus, avec adaptateur en L' },
      ],
      inclus: ['Trépied et adaptateur', 'Housse rembourrée', 'Carte du ciel de la saison'],
    },
    {
      id: 'a6', nom: 'Kit découverte de la Lune', categorie: 'Accessoires', niveau: 'Débutant',
      resume: 'Petit télescope, filtres lunaires et atlas : tout pour une première soirée réussie.',
      description: 'Un ensemble prêt à l\'emploi pour observer la Lune de très près, sans rien oublier à la maison. Pensé pour les enfants et les débutants : le matériel est léger, solide et se règle en quelques minutes.',
      prixJour: 28, imageUrl: PX(7441197), images: [PX(9680581)], quantite: 3, disponible: true,
      specs: [
        { label: 'Télescope', valeur: '70 mm, focale 700 mm' },
        { label: 'Filtres', valeur: 'Lunaire, bleu et vert' },
        { label: 'Atlas', valeur: 'Carte de la Lune et calendrier des phases' },
        { label: 'Poids total', valeur: '4 kg' },
      ],
      inclus: ['Télescope et trépied', '3 filtres', 'Atlas lunaire', 'Lampe rouge'],
    },
    {
      id: 'a7', nom: 'Kit astrophotographie débutant', categorie: 'Accessoires', niveau: 'Avancé',
      resume: 'Monture suiveuse, adaptateurs et guide pour photographier la Voie lactée.',
      description: 'Une monture suiveuse compacte qui permet des poses longues avec un appareil photo ou un téléphone, sans traînées d\'étoiles. Accompagné d\'un guide pas à pas pour réussir vos premières photos du ciel profond dès la première nuit.',
      prixJour: 50, imageUrl: PX(28760143), images: [PX(28956669)], quantite: 1, disponible: true,
      specs: [
        { label: 'Monture', valeur: 'Suiveuse équatoriale portable' },
        { label: 'Charge maximale', valeur: '3 kg' },
        { label: 'Autonomie', valeur: '8 heures' },
        { label: 'Accessoires', valeur: 'Rotule, déclencheur, plaque d\'alignement' },
      ],
      inclus: ['Monture suiveuse et trépied', 'Déclencheur à distance', 'Guide pas à pas', 'Appel d\'aide le soir même'],
    },
    {
      id: 'a8', nom: 'Forfait soirée étoilée', categorie: 'Forfaits', niveau: 'Débutant',
      resume: 'Un télescope, une chaise longue, une couverture et le guide de la nuit. Il ne manque que le ciel.',
      description: 'Le forfait clé en main pour une sortie en famille ou en couple : télescope Dobson, chaises longues, couvertures, thermos et guide des objets visibles ce soir-là. Nous vous indiquons aussi les meilleurs endroits sombres près de chez vous.',
      prixJour: 70, imageUrl: PX(31432923), images: [PX(2901134)], quantite: 1, disponible: true,
      specs: [
        { label: 'Télescope', valeur: 'Dobson 8"' },
        { label: 'Confort', valeur: '2 chaises longues, 2 couvertures' },
        { label: 'Guide', valeur: 'Objets visibles selon la date' },
        { label: 'Personnes', valeur: '2 à 4' },
      ],
      inclus: ['Dobson 8" complet', '2 chaises longues et 2 couvertures', 'Thermos et lampe rouge', 'Carte des lieux d\'observation'],
    },
  ],
  location_depot: '150 $ remboursable au retour',
  location_conditions: 'Le matériel est remis nettoyé, calibré et testé. Une pièce d\'identité et un dépôt remboursable sont demandés au ramassage. Tout dommage causé par une chute ou un manque de précaution est facturé selon la grille de réparation.',
  dureeMinJours: 1,
  dureeMaxJours: 14,
  heureRamassage: '9 h à 17 h',
  stats: [
    { valeur: '8', label: 'appareils en location' },
    { valeur: '40 000+', label: 'objets célestes accessibles' },
    { valeur: '20 min', label: 'd\'initiation incluse' },
    { valeur: '100 %', label: 'calibrés avant le départ' },
  ],
  etapes: [
    { titre: 'Choisissez votre appareil', texte: 'Parcourez le catalogue et ouvrez la fiche d\'un appareil pour voir ses spécifications et ce qui est fourni.' },
    { titre: 'Réservez vos dates', texte: 'Indiquez le début et la fin de la location. La disponibilité est vérifiée en direct, appareil par appareil.' },
    { titre: 'Ramassez et apprenez', texte: 'Nous préparons le matériel, le calibrons et vous montrons en 20 minutes comment l\'utiliser.' },
    { titre: 'Observez, puis rapportez', texte: 'Profitez du ciel, rapportez l\'appareil à la fin de la période et récupérez votre dépôt.' },
  ],
  faq: [
    { q: 'Ai-je besoin d\'expérience pour louer un télescope ?', a: 'Non. Chaque location comprend une initiation de 20 minutes et une carte du ciel adaptée à la saison. Les appareils marqués « Débutant » se règlent en quelques minutes.' },
    { q: 'Que se passe-t-il s\'il y a des nuages ?', a: 'Choisissez une période de deux ou trois jours pour augmenter vos chances d\'une nuit dégagée. Une location de plus de trois jours est possible, jusqu\'à la durée maximale indiquée.' },
    { q: 'Comment fonctionne le dépôt ?', a: 'Un dépôt remboursable est demandé au ramassage. Il vous est remis au retour de l\'appareil, après une vérification rapide.' },
    { q: 'Puis-je annuler ma réservation ?', a: 'Oui. Le courriel de confirmation contient un lien d\'annulation. La place est alors libérée pour un autre client.' },
  ],
  galerie: [
    { url: PX(4254548, 700), titre: 'La Voie lactée' },
    { url: PX(28956669, 700), titre: 'Une nuit d\'observation' },
    { url: PX(9680581, 700), titre: 'La Lune de près' },
    { url: PX(2901134, 700), titre: 'En famille sous les étoiles' },
    { url: PX(53153, 700), titre: 'Pleine Lune' },
    { url: PX(6325001, 700), titre: 'Radiotélescope' },
  ],
  titreSection: 'Réserver votre matériel',
  descriptionResa: 'Choisissez l\'appareil et vos dates. La disponibilité est vérifiée tout de suite et vous recevez une confirmation par courriel.',
  messageConfirmation: 'Merci ! Votre réservation est confirmée. Un courriel de confirmation vous a été envoyé avec les détails du ramassage.',
};

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

const argent = (n: number) => `${(Number(n) || 0).toLocaleString('fr-CA', { maximumFractionDigits: 2 })} $`;

function dateLocale(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Nombre de jours (inclusifs) entre deux dates « AAAA-MM-JJ ». 0 si invalide.
function nbJours(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const a = new Date(`${debut}T00:00:00`).getTime();
  const b = new Date(`${fin}T00:00:00`).getTime();
  if (isNaN(a) || isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

function formaterJour(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
}

interface ResaExistante { date_debut: string; date_fin: string; statut?: string; objet_reserve?: string | null }

// Étoiles du hero : positions fixes (pas d'aléatoire : le rendu reste identique d'une visite à l'autre)
const ETOILES = Array.from({ length: 90 }, (_, i) => {
  const a = (i * 9301 + 49297) % 233280;
  const b = (i * 7919 + 12345) % 233280;
  const c = (i * 104729 + 7) % 233280;
  return { x: (a / 233280) * 100, y: (b / 233280) * 100, t: 1 + (c % 3), d: (c % 40) / 10, o: 0.35 + ((c % 60) / 100) };
});

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigLocationAstro>;
  isPreviewMobile?: boolean;
  siteId?: number;
}

export default function TemplateLocationAstro({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const cfg: ConfigLocationAstro = { ...CONFIG_LOCATION_ASTRO_DEFAUT, ...(configPartiel || {}) } as ConfigLocationAstro;
  const objets: ObjetAstro[] = (Array.isArray(cfg.location_objets) ? cfg.location_objets : []).map((o, i) => ({
    id: String(o.id ?? i), nom: o.nom || 'Appareil', categorie: o.categorie || 'Matériel', niveau: o.niveau || '',
    resume: o.resume || '', description: o.description || '', prixJour: Number(o.prixJour) || 0,
    imageUrl: o.imageUrl || '', images: Array.isArray(o.images) ? o.images.filter(Boolean) : [],
    quantite: Math.max(1, parseInt(String(o.quantite), 10) || 1), disponible: o.disponible !== false,
    specs: Array.isArray(o.specs) ? o.specs.filter((s) => s && (s.label || s.valeur)) : [],
    inclus: Array.isArray(o.inclus) ? o.inclus.filter(Boolean) : [],
  }));

  const cp = cfg.couleurPrincipale;
  const ca = cfg.couleurAccent;
  const fond = cfg.couleurFond;
  const clair = cfg.couleurFondClair;

  const [largeur, setLargeur] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const f = () => setLargeur(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  const isMobile = isPreviewMobile || largeur <= 768;

  // ── Catalogue ──
  const categories = useMemo(() => ['Tous', ...Array.from(new Set(objets.map((o) => o.categorie)))], [objets]);
  const [filtre, setFiltre] = useState('Tous');
  const visibles = filtre === 'Tous' ? objets : objets.filter((o) => o.categorie === filtre);
  const [ouvert, setOuvert] = useState<ObjetAstro | null>(null);
  const [photoModal, setPhotoModal] = useState(0);

  useEffect(() => {
    if (!ouvert) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(null); };
    window.addEventListener('keydown', f);
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', f); document.body.style.overflow = avant; };
  }, [ouvert]);

  // ── Réservation ──
  const formRef = useRef<HTMLDivElement>(null);
  const auj = dateLocale(new Date());
  const [form, setForm] = useState({ objetId: '', debut: '', fin: '', nom: '', email: '', telephone: '', notes: '' });
  const [etape, setEtape] = useState<'form' | 'envoi' | 'succes' | 'erreur'>('form');
  const [message, setMessage] = useState('');
  const [existantes, setExistantes] = useState<ResaExistante[]>([]);

  const chargerDispos = useCallback(async () => {
    if (!siteId) return;
    try {
      const r = await fetch(`/api/reservations/disponibilites/${siteId}`);
      if (!r.ok) return;
      const d = await r.json();
      setExistantes(Array.isArray(d.reservations) ? d.reservations : []);
    } catch { /* sans réseau, le serveur refusera quand même un chevauchement */ }
  }, [siteId]);
  useEffect(() => { chargerDispos(); }, [chargerDispos]);

  const objetChoisi = objets.find((o) => o.id === form.objetId) || null;
  const jours = nbJours(form.debut, form.fin);
  const total = objetChoisi ? jours * objetChoisi.prixJour : 0;

  // Réservations (actives) de l'appareil choisi, en jours « AAAA-MM-JJ »
  const occupees = useMemo(() => {
    if (!objetChoisi) return [] as { d: string; f: string }[];
    return existantes
      .filter((r) => r.statut !== 'annulee' && r.objet_reserve === objetChoisi.nom)
      .map((r) => ({ d: String(r.date_debut).slice(0, 10), f: String(r.date_fin || r.date_debut).slice(0, 10) }))
      .filter((r) => r.f >= auj)
      .sort((a, b) => (a.d < b.d ? -1 : 1));
  }, [existantes, objetChoisi, auj]);

  const chevauchements = form.debut && form.fin ? occupees.filter((r) => r.d <= form.fin && r.f >= form.debut).length : 0;
  const complet = !!objetChoisi && chevauchements >= objetChoisi.quantite;

  let erreurDates = '';
  if (form.debut && form.fin) {
    if (form.fin < form.debut) erreurDates = 'La date de fin doit être après la date de début.';
    else if (jours < cfg.dureeMinJours) erreurDates = `Durée minimale : ${cfg.dureeMinJours} jour${cfg.dureeMinJours > 1 ? 's' : ''}.`;
    else if (cfg.dureeMaxJours > 0 && jours > cfg.dureeMaxJours) erreurDates = `Durée maximale : ${cfg.dureeMaxJours} jours.`;
  }

  const choisirObjet = (o: ObjetAstro) => {
    setForm((p) => ({ ...p, objetId: o.id }));
    setOuvert(null);
    setEtape('form');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetChoisi || complet || erreurDates) return;
    if (!siteId) { setEtape('erreur'); setMessage('Aperçu : la réservation est désactivée en mode démonstration.'); return; }
    setEtape('envoi');
    try {
      const notes = [
        `Du ${form.debut} au ${form.fin} (${jours} jour${jours > 1 ? 's' : ''}) — estimation ${argent(total)}${cfg.location_depot ? ` + dépôt : ${cfg.location_depot}` : ''}`,
        form.notes.trim(),
      ].filter(Boolean).join('\n');
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          nom_client: form.nom,
          email_client: form.email,
          telephone: form.telephone,
          date_debut: `${form.debut}T09:00:00`,
          date_fin: `${form.fin}T23:59:00`,
          nb_personnes: 1,
          notes,
          objet_reserve: objetChoisi.nom,
          type_reservation: 'location',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setEtape('succes'); setMessage(data.message || cfg.messageConfirmation); chargerDispos(); }
      else { setEtape('erreur'); setMessage(data.message || 'Une erreur est survenue.'); }
    } catch { setEtape('erreur'); setMessage('Impossible de joindre le serveur.'); }
  };

  const [faqOuverte, setFaqOuverte] = useState<number | null>(0);

  // ── Styles partagés ──
  const serif = "'Playfair Display', Georgia, serif";
  const sans = "'Inter', 'Helvetica Neue', sans-serif";
  const eyebrow: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 };
  const titreSec = (clairFond: boolean): React.CSSProperties => ({ fontFamily: serif, fontSize: 'clamp(28px, 4.2vw, 46px)', fontWeight: 700, lineHeight: 1.15, color: clairFond ? fond : '#fff', margin: 0 });
  const champ: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid rgba(196,181,253,0.28)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: sans };
  const labelChamp: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ca, marginBottom: 7 };

  const imageOuFond = (src: string, nom: string, style: React.CSSProperties, classe?: string) => src ? (
    <img src={src} alt={nom} style={style} className={classe}
      onError={(e) => { const el = e.currentTarget; el.style.display = 'none'; const p = el.parentElement; if (p) p.setAttribute('data-sans-photo', '1'); }} />
  ) : null;

  return (
    <div style={{ fontFamily: sans, background: fond, color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,500;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap" />
      <style>{`
        .ast *, .ast *::before, .ast *::after { box-sizing: border-box; }
        .ast { scroll-behavior: smooth; }
        .ast h1, .ast h2, .ast h3, .ast p { margin: 0; }
        .ast em { font-style: italic; color: ${ca}; }
        .ast-clair em { color: ${cp}; }
        @keyframes ast-scint { 0%,100% { opacity: var(--o); transform: scale(1); } 50% { opacity: 0.15; transform: scale(0.7); } }
        @keyframes ast-flotte { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes ast-entree { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ast-fondu { from { opacity: 0; } to { opacity: 1; } }
        .ast-etoile { position: absolute; border-radius: 50%; background: #fff; animation: ast-scint 4s ease-in-out infinite; }
        .ast-carte { transition: transform .3s, box-shadow .3s, border-color .3s; }
        .ast-carte:hover { transform: translateY(-6px); box-shadow: 0 18px 44px rgba(0,0,0,.45); border-color: ${ca}66 !important; }
        .ast-carte:hover .ast-photo { transform: scale(1.06); }
        .ast-photo { transition: transform .6s ease; }
        .ast-btn { background: ${cp}; color: #fff; border: none; padding: 13px 26px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; font-family: ${sans}; transition: transform .2s, box-shadow .2s, opacity .2s; }
        .ast-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px ${cp}77; }
        .ast-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ast-btn-ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,.4); padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; font-family: ${sans}; transition: background .2s, border-color .2s; }
        .ast-btn-ghost:hover { background: rgba(255,255,255,.1); border-color: #fff; }
        .ast-onglet { padding: 9px 20px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: ${sans}; transition: all .2s; }
        .ast-lien { color: rgba(255,255,255,.78); text-decoration: none; font-size: 14px; font-weight: 500; transition: color .2s; }
        .ast-lien:hover { color: ${ca}; }
        .ast-photo-vide { background: radial-gradient(circle at 30% 30%, ${cp}55, transparent 60%), linear-gradient(135deg, #1d1a38, #0c0a1f); display: flex; align-items: center; justify-content: center; font-size: 54px; }
        .ast-photo-vide[data-sans-photo]::after { content: '🔭'; }
        .ast input:focus, .ast select:focus, .ast textarea:focus { border-color: ${ca} !important; box-shadow: 0 0 0 3px ${cp}33; }
        .ast select option { color: #111; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${cp}88; border-radius: 3px; }
      `}</style>

      <div className="ast">
        {/* ── NAVIGATION ── */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${fond}e6`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${ca}22`, height: 68, display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="#haut" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
              {cfg.logoUrl ? <img src={cfg.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} /> : (
                <>
                  <span style={{ fontSize: 22, color: ca }}>✦</span>
                  <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>{cfg.nomEntreprise}</span>
                </>
              )}
            </a>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
                <a href="#catalogue" className="ast-lien">Catalogue</a>
                <a href="#fonctionnement" className="ast-lien">Comment ça marche</a>
                <a href="#faq" className="ast-lien">Questions</a>
                <a href="#contact" className="ast-lien">Contact</a>
                <a href="#reserver" className="ast-btn" style={{ padding: '9px 20px', fontSize: 13 }}>Réserver</a>
              </div>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="haut" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', backgroundImage: cfg.photoHeroUrl ? `url(${cfg.photoHeroUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: fond }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${fond}cc 0%, ${fond}99 45%, ${fond} 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {ETOILES.map((s, i) => (
              <span key={i} className="ast-etoile" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.t, height: s.t, animationDelay: `${s.d}s`, ['--o' as any]: s.o }} />
            ))}
          </div>
          {!isMobile && (
            <div style={{ position: 'absolute', right: '9%', top: '20%', width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle at 32% 30%, ${ca}, ${cp} 45%, #2a1458 100%)`, boxShadow: `0 0 80px ${cp}88, inset -18px -12px 36px rgba(0,0,0,.55)`, animation: 'ast-flotte 9s ease-in-out infinite', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: '-38%', top: '42%', width: '176%', height: 22, borderRadius: '50%', border: `2px solid ${ca}88`, transform: 'rotate(-18deg)' }} />
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, padding: '110px 24px 90px', animation: 'ast-entree .9s ease both' }}>
            <p style={eyebrow}>🔭 Location d'astronomie</p>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(38px, 7.2vw, 76px)', fontWeight: 800, lineHeight: 1.08, color: '#fff', marginBottom: 22 }}>{cfg.nomEntreprise}</h1>
            <p style={{ fontSize: 'clamp(16px, 2.4vw, 21px)', fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,.82)', maxWidth: 640, margin: '0 auto 38px' }}>{cfg.slogan}</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#catalogue" className="ast-btn" style={{ padding: '15px 34px', fontSize: 15 }}>Voir le catalogue →</a>
              <a href="#reserver" className="ast-btn-ghost" style={{ padding: '14px 30px', fontSize: 15 }}>Réserver mes dates</a>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.5)', fontSize: 22 }}>↓</div>
        </section>

        {/* ── CHIFFRES ── */}
        {cfg.stats.length > 0 && (
          <section style={{ background: `${cp}18`, borderTop: `1px solid ${ca}22`, borderBottom: `1px solid ${ca}22` }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '34px 24px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(cfg.stats.length, 4)}, 1fr)`, gap: 22, textAlign: 'center' }}>
              {cfg.stats.map((s, i) => (
                <div key={i}>
                  <p style={{ fontFamily: serif, fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 700, color: ca }}>{s.valeur}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── À PROPOS ── */}
        <section style={{ padding: isMobile ? '64px 22px' : '96px 24px', background: fond }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p style={eyebrow}>À propos</p>
            <h2 style={titreSec(false)}>Le ciel est à <em>portée de main</em>.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,.72)', marginTop: 22 }}>{cfg.description}</p>
          </div>
        </section>

        {/* ── CATALOGUE ── */}
        <section id="catalogue" style={{ padding: isMobile ? '64px 18px' : '96px 24px', background: `linear-gradient(180deg, ${fond}, #0b0920)` }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 38 }}>
              <p style={eyebrow}>Catalogue</p>
              <h2 style={titreSec(false)}>Notre matériel <em>d'observation</em></h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', marginTop: 14 }}>Cliquez sur un appareil pour voir sa fiche technique complète.</p>
            </div>

            {categories.length > 2 && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 38 }}>
                {categories.map((c) => (
                  <button key={c} className="ast-onglet" onClick={() => setFiltre(c)}
                    style={{ border: `1.5px solid ${filtre === c ? cp : 'rgba(255,255,255,.2)'}`, background: filtre === c ? cp : 'transparent', color: '#fff' }}>{c}</button>
                ))}
              </div>
            )}

            {visibles.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.5)', padding: 40 }}>Aucun appareil dans cette catégorie pour le moment.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(268px, 1fr))', gap: 24 }}>
                {visibles.map((o) => (
                  <div key={o.id} className="ast-carte" style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${ca}26`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: o.disponible ? 1 : 0.6 }}>
                    <div className="ast-photo-vide" onClick={() => { setPhotoModal(0); setOuvert(o); }} style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', cursor: 'zoom-in' }}>
                      {imageOuFond(o.imageUrl, o.nom, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }, 'ast-photo')}
                      <span style={{ position: 'absolute', top: 12, left: 12, background: `${fond}cc`, backdropFilter: 'blur(6px)', border: `1px solid ${ca}44`, color: ca, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999 }}>{o.categorie}</span>
                      {o.niveau && <span style={{ position: 'absolute', top: 12, right: 12, background: cp, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{o.niveau}</span>}
                      <span style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 999 }}>🔍 Spécifications</span>
                    </div>
                    <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, lineHeight: 1.3, color: '#fff', marginBottom: 8 }}>{o.nom}</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,.62)', marginBottom: 16, flex: 1 }}>{o.resume}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                        <p><span style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: ca }}>{argent(o.prixJour)}</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}> / jour</span></p>
                        <span style={{ fontSize: 11, fontWeight: 600, color: o.disponible ? '#86efac' : '#fca5a5' }}>{o.disponible ? '● En stock' : '● Indisponible'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="ast-btn-ghost" style={{ flex: 1, padding: '11px 8px', fontSize: 13 }} onClick={() => { setPhotoModal(0); setOuvert(o); }}>Fiche technique</button>
                        <button className="ast-btn" style={{ flex: 1, padding: '11px 8px', fontSize: 13 }} disabled={!o.disponible} onClick={() => choisirObjet(o)}>Réserver</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(cfg.location_conditions || cfg.location_depot) && (
              <div style={{ marginTop: 44, padding: '20px 26px', background: `${cp}1c`, border: `1px solid ${ca}33`, borderRadius: 12, fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,.78)' }}>
                {cfg.location_conditions && <p>📋 <strong style={{ color: '#fff' }}>Conditions :</strong> {cfg.location_conditions}</p>}
                {cfg.location_depot && <p style={{ marginTop: 6 }}>💳 <strong style={{ color: '#fff' }}>Dépôt :</strong> {cfg.location_depot}{cfg.heureRamassage ? <> &nbsp;·&nbsp; 🕘 <strong style={{ color: '#fff' }}>Ramassage :</strong> {cfg.heureRamassage}</> : null}</p>}
              </div>
            )}
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE (section claire) ── */}
        {cfg.etapes.length > 0 && (
          <section id="fonctionnement" className="ast-clair" style={{ padding: isMobile ? '64px 22px' : '96px 24px', background: clair, color: fond }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 54 }}>
                <p style={{ ...eyebrow, color: cp }}>Simple et rapide</p>
                <h2 style={titreSec(true)}>Comment ça <em>marche</em> ?</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(cfg.etapes.length, 4)}, 1fr)`, gap: 28 }}>
                {cfg.etapes.map((e, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '8px 10px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: `0 6px 24px ${cp}33`, fontFamily: serif, fontSize: 26, fontWeight: 700, color: cp }}>{i + 1}</div>
                    <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, color: fond, marginBottom: 6 }}>{e.titre}</h3>
                    <div style={{ width: 36, height: 3, background: cp, borderRadius: 2, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: `${fond}aa` }}>{e.texte}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── GALERIE ── */}
        {cfg.galerie.length > 0 && (
          <section style={{ padding: isMobile ? '64px 18px' : '96px 24px', background: '#0b0920' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <p style={eyebrow}>Galerie</p>
                <h2 style={titreSec(false)}>Ce que vous <em>verrez</em></h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
                {cfg.galerie.map((g, i) => (
                  <div key={i} className="ast-photo-vide" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: i % 4 === 0 ? '4 / 5' : '1 / 1' }}>
                    {imageOuFond(g.url, g.titre, { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s' })}
                    {g.titre && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 14px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,.7))', fontSize: 12.5, fontWeight: 500, color: '#fff' }}>{g.titre}</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── RÉSERVATION ── */}
        <section id="reserver" ref={formRef} style={{ padding: isMobile ? '64px 18px' : '96px 24px', background: `radial-gradient(ellipse at 50% 0%, ${cp}33, transparent 60%), ${fond}` }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 42 }}>
              <p style={eyebrow}>Réservation</p>
              <h2 style={titreSec(false)}>{cfg.titreSection}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.68)', maxWidth: 560, margin: '16px auto 0' }}>{cfg.descriptionResa}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${ca}30`, borderRadius: 18, padding: isMobile ? '26px 18px' : '40px 44px', backdropFilter: 'blur(8px)' }}>
              {etape === 'succes' ? (
                <div style={{ textAlign: 'center', padding: '28px 8px' }}>
                  <div style={{ fontSize: 60, marginBottom: 14 }}>🌠</div>
                  <h3 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Réservation confirmée !</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.75)', maxWidth: 440, margin: '0 auto 26px' }}>{message}</p>
                  <button className="ast-btn" onClick={() => { setEtape('form'); setForm({ objetId: '', debut: '', fin: '', nom: '', email: '', telephone: '', notes: '' }); }}>Nouvelle réservation</button>
                </div>
              ) : (
                <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={labelChamp}>Appareil <span style={{ color: '#f87171' }}>*</span></label>
                    <select required value={form.objetId} onChange={(e) => setForm((p) => ({ ...p, objetId: e.target.value }))} style={champ}>
                      <option value="">Choisir un appareil…</option>
                      {objets.filter((o) => o.disponible).map((o) => <option key={o.id} value={o.id}>{o.nom} — {argent(o.prixJour)} / jour</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelChamp}>Début de la location <span style={{ color: '#f87171' }}>*</span></label>
                      <input type="date" required min={auj} value={form.debut} style={{ ...champ, colorScheme: 'dark' } as React.CSSProperties}
                        onChange={(e) => setForm((p) => ({ ...p, debut: e.target.value, fin: p.fin && p.fin < e.target.value ? e.target.value : p.fin }))} />
                    </div>
                    <div>
                      <label style={labelChamp}>Fin de la location <span style={{ color: '#f87171' }}>*</span></label>
                      <input type="date" required min={form.debut || auj} value={form.fin} style={{ ...champ, colorScheme: 'dark' } as React.CSSProperties}
                        onChange={(e) => setForm((p) => ({ ...p, fin: e.target.value }))} />
                    </div>
                  </div>

                  {objetChoisi && occupees.length > 0 && (
                    <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,.6)' }}>
                      📅 Déjà réservé : {occupees.slice(0, 4).map((r) => (r.d === r.f ? formaterJour(r.d) : `${formaterJour(r.d)} → ${formaterJour(r.f)}`)).join(' · ')}{occupees.length > 4 ? ' …' : ''}
                      {objetChoisi.quantite > 1 ? ` (${objetChoisi.quantite} exemplaires en stock)` : ''}
                    </p>
                  )}
                  {erreurDates && <p style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', padding: '10px 14px', borderRadius: 8 }}>{erreurDates}</p>}
                  {!erreurDates && complet && <p style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', padding: '10px 14px', borderRadius: 8 }}>Cet appareil n'est plus disponible aux dates choisies. Essayez d'autres dates ou un autre appareil.</p>}

                  {objetChoisi && jours > 0 && !erreurDates && !complet && (
                    <div style={{ background: `${cp}22`, border: `1px solid ${ca}44`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{jours} jour{jours > 1 ? 's' : ''} × {argent(objetChoisi.prixJour)}</p>
                        {cfg.location_depot && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>Dépôt : {cfg.location_depot}</p>}
                      </div>
                      <p style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: ca }}>{argent(total)}</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelChamp}>Nom complet <span style={{ color: '#f87171' }}>*</span></label>
                      <input type="text" required value={form.nom} placeholder="Marie Dupont" style={champ} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelChamp}>Courriel <span style={{ color: '#f87171' }}>*</span></label>
                      <input type="email" required value={form.email} placeholder="marie@exemple.com" style={champ} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelChamp}>Téléphone</label>
                    <input type="tel" value={form.telephone} placeholder="(514) 555-0123" style={champ} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelChamp}>Notes ou demandes spéciales</label>
                    <textarea rows={3} value={form.notes} placeholder="Votre niveau, l'endroit d'observation, une question…" style={{ ...champ, resize: 'vertical' }} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>

                  {etape === 'erreur' && <p style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', padding: '10px 14px', borderRadius: 8 }}>{message}</p>}

                  <button type="submit" className="ast-btn" disabled={etape === 'envoi' || !objetChoisi || complet || !!erreurDates || jours < 1} style={{ width: '100%', padding: 16, fontSize: 16 }}>
                    {etape === 'envoi' ? '⏳ Envoi en cours…' : '✦ Confirmer la réservation'}
                  </button>
                  <p style={{ fontSize: 11.5, textAlign: 'center', color: 'rgba(255,255,255,.45)' }}>Un courriel de confirmation avec un lien d'annulation vous sera envoyé.</p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ (section claire) ── */}
        {cfg.faq.length > 0 && (
          <section id="faq" className="ast-clair" style={{ padding: isMobile ? '64px 22px' : '96px 24px', background: clair, color: fond }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <p style={{ ...eyebrow, color: cp }}>Questions fréquentes</p>
                <h2 style={titreSec(true)}>Avant de <em>partir</em></h2>
              </div>
              {cfg.faq.map((f, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${fond}1f` }}>
                  <button onClick={() => setFaqOuverte(faqOuverte === i ? null : i)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left', padding: '20px 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: serif, fontSize: 18, fontWeight: 600, color: fond }}>
                    <span>{f.q}</span>
                    <span style={{ color: cp, fontSize: 22, transition: 'transform .25s', transform: faqOuverte === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                  </button>
                  {faqOuverte === i && <p style={{ fontSize: 14.5, lineHeight: 1.75, color: `${fond}b3`, padding: '0 4px 22px', animation: 'ast-fondu .3s ease' }}>{f.a}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTACT ── */}
        <section id="contact" style={{ padding: isMobile ? '64px 22px' : '88px 24px', background: '#0b0920', textAlign: 'center' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <p style={eyebrow}>Contact</p>
            <h2 style={titreSec(false)}>Une question avant <em>de partir</em> ?</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 28px', justifyContent: 'center', margin: '30px 0 26px', fontSize: 14.5, color: 'rgba(255,255,255,.75)' }}>
              {cfg.adresse && <p>📍 {cfg.adresse}{cfg.ville ? `, ${cfg.ville}` : ''}</p>}
              {cfg.telephone && <p>📞 {cfg.telephone}</p>}
              {cfg.email && <a href={`mailto:${cfg.email}`} style={{ color: ca, textDecoration: 'none', fontWeight: 600 }}>✉️ {cfg.email}</a>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {cfg.instagram && <a className="ast-btn-ghost" style={{ padding: '9px 18px', fontSize: 13 }} href={`https://instagram.com/${cfg.instagram}`} target="_blank" rel="noopener noreferrer">📷 Instagram</a>}
              {cfg.facebook && <a className="ast-btn-ghost" style={{ padding: '9px 18px', fontSize: 13 }} href={`https://facebook.com/${cfg.facebook}`} target="_blank" rel="noopener noreferrer">👥 Facebook</a>}
              {cfg.siteExterne && <a className="ast-btn-ghost" style={{ padding: '9px 18px', fontSize: 13 }} href={cfg.siteExterne} target="_blank" rel="noopener noreferrer">🌐 Site web</a>}
            </div>
          </div>
        </section>

        <footer style={{ padding: 22, background: '#080616', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{cfg.nomEntreprise} — Propulsé par <span style={{ color: ca }}>e-Vend Studio</span></p>
        </footer>

        {/* ── FENÊTRE : FICHE TECHNIQUE ── */}
        {ouvert && (
          <div onClick={() => setOuvert(null)} role="dialog" aria-modal="true" aria-label={ouvert.nom}
            style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,4,16,.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 10 : 24, animation: 'ast-fondu .25s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#17142f', border: `1px solid ${ca}33`, borderRadius: 20, width: '100%', maxWidth: 980, maxHeight: '94vh', overflow: 'auto', boxShadow: `0 30px 90px rgba(0,0,0,.6), 0 0 60px ${cp}22`, animation: 'ast-entree .35s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, padding: isMobile ? '18px 18px 14px' : '24px 30px 18px', borderBottom: `1px solid ${ca}1f` }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ca, marginBottom: 6 }}>{ouvert.categorie}{ouvert.niveau ? ` · ${ouvert.niveau}` : ''}</p>
                  <h3 style={{ fontFamily: serif, fontSize: isMobile ? 21 : 28, fontWeight: 700, lineHeight: 1.2 }}>{ouvert.nom}</h3>
                </div>
                <button onClick={() => setOuvert(null)} aria-label="Fermer" style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr', gap: isMobile ? 20 : 34, padding: isMobile ? 18 : 30 }}>
                <div>
                  {(() => {
                    const toutes = [ouvert.imageUrl, ...ouvert.images].filter(Boolean);
                    const courante = toutes[Math.min(photoModal, Math.max(toutes.length - 1, 0))] || '';
                    return (
                      <>
                        <div className="ast-photo-vide" style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '4 / 3', background: undefined }}>
                          {imageOuFond(courante, ouvert.nom, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' })}
                        </div>
                        {toutes.length > 1 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            {toutes.map((u, i) => (
                              <button key={i} onClick={() => setPhotoModal(i)} aria-label={`Photo ${i + 1}`}
                                style={{ width: 72, height: 54, padding: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none', border: `2px solid ${i === photoModal ? cp : 'transparent'}` }}>
                                <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {ouvert.description && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,.72)', marginTop: 18 }}>{ouvert.description}</p>}
                </div>

                <div>
                  <div style={{ background: `${cp}22`, border: `1px solid ${ca}44`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <p><span style={{ fontFamily: serif, fontSize: 34, fontWeight: 700, color: ca }}>{argent(ouvert.prixJour)}</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}> / jour</span></p>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ouvert.disponible ? '#86efac' : '#fca5a5' }}>{ouvert.disponible ? `● ${ouvert.quantite} en stock` : '● Indisponible'}</span>
                  </div>

                  {ouvert.specs.length > 0 && (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ca, marginBottom: 10 }}>Fiche technique</p>
                      <div style={{ border: `1px solid ${ca}22`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                        {ouvert.specs.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '11px 16px', fontSize: 13.5, background: i % 2 === 0 ? 'rgba(255,255,255,.04)' : 'transparent' }}>
                            <span style={{ color: 'rgba(255,255,255,.55)' }}>{s.label}</span>
                            <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{s.valeur}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {ouvert.inclus.length > 0 && (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ca, marginBottom: 10 }}>Inclus avec l'appareil</p>
                      <ul style={{ listStyle: 'none', margin: '0 0 22px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ouvert.inclus.map((x, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}><span style={{ color: '#86efac' }}>✓</span><span>{x}</span></li>
                        ))}
                      </ul>
                    </>
                  )}

                  <button className="ast-btn" disabled={!ouvert.disponible} onClick={() => choisirObjet(ouvert)} style={{ width: '100%', padding: 15, fontSize: 15 }}>
                    {ouvert.disponible ? 'Réserver cet appareil →' : 'Indisponible pour le moment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}