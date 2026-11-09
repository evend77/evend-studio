// CHEMIN : src/templates/multivendeur/effetsCatalogue.ts
// e-Vend Studio — Catalogue des effets de boutique (repris tel quel d'e-Vend : AppVendeur.tsx).
// Thèmes saisonniers + effets de vente, avec bornes de réglage (taille / nombre / vitesse).

export interface EffetSaisonnier {
  id: string;
  nom: string;
  emoji: string;
  description: string;
  type: 'guirlande' | 'flottant' | 'volant' | 'marcheur' | 'pendu' | 'neige' | 'filante' | 'statique' | 'texte3d' | 'ruban' | 'drapeau' | 'vagabond';
  // Bornes de personnalisation (optionnelles — un effet sans ces champs
  // n'affiche simplement pas de curseur de réglage dans ConfigurationGenerale).
  tailleMin?: number;
  tailleMax?: number;
  tailleDefaut?: number;
  nombreMin?: number;
  nombreMax?: number;
  nombreDefaut?: number;
  // Vitesse de déplacement, en secondes (plus petit = plus rapide) — utilisé
  // par 'marcheur' (traîneau) et 'neige' (durée de la chute).
  vitesseMin?: number;
  vitesseMax?: number;
  vitesseDefaut?: number;
  // 'marcheur' : où l'animation traverse l'écran ('bas' par défaut, ex:
  // faucheuse au sol ; 'haut' pour un traîneau qui vole en haut de l'écran).
  positionMarcheur?: 'haut' | 'bas';
  // 'guirlande' : quand true, affiche des ampoules colorées personnalisables
  // (guirlande lumineuse de Noël) au lieu de l'emoji répété (citrouilles).
  ampoules?: boolean;
  couleursDefaut?: string[];
  stylesAnimationDisponibles?: string[];
  // 'statique' : décor fixe ancré dans un coin bas de l'écran (sapin, bonhomme).
  ancrage?: 'bas-gauche' | 'bas-droite';
  // 'texte3d' : mot/texte qui tombe en tournant sur lui-même (effet recto-
  // verso). texteDefaut est pré-rempli (ex: "VENDREDI NOIR") mais reste
  // 100% modifiable par le vendeur (voir EffetConfig.texte) — pas besoin de
  // gérer FR/EN séparément, le vendeur édite simplement le texte affiché.
  texteDefaut?: string;
  couleurTexteDefaut?: string;
  vitesseRotationMin?: number;
  vitesseRotationMax?: number;
  vitesseRotationDefaut?: number;
  // 'drapeau' : liste des drapeaux proposés au choix (couleurs simplifiées à
  // 2 tons — décoratif, pas une reproduction héraldique exacte).
  drapeauxDisponibles?: { id: string; nom: string; couleurs: [string, string] }[];
  // 'neige' : liste d'emojis qui alternent en tombant (ex: cœurs pour la
  // Saint-Valentin). Sans cette liste, repli sur les flocons de neige par
  // défaut — garde le moteur générique ("chute d'emojis qui dérivent") sans
  // changer le comportement des thèmes existants (Noël).
  emojisChute?: string[];
}

// Réglages par effet choisis par le vendeur : { [effetId]: { taille?, nombre?, ... } }
// Stocké dans config_vendeur.effets_config / vente_effets_config (JSONB) —
// voir vendeurs_config.js.
export type EffetConfig = {
  taille?: number; nombre?: number; vitesse?: number; couleurs?: string[]; styleAnimation?: string;
  texte?: string; couleur?: string; vitesseRotation?: number; drapeaux?: string[];
};
export type EffetsConfigMap = Record<string, EffetConfig>;

// ─────────────────────────────────────────────────────────────────────────────
// 🏷️ EFFETS DE VENTE (Vendredi noir, liquidation, rubans, drapeaux...) —
// catégorie INDÉPENDANTE des thèmes saisonniers : pas de choix exclusif
// "un seul à la fois", chaque effet se coche/décoche séparément et peut
// tourner EN MÊME TEMPS qu'un thème saisonnier (ex: neige de Noël + Vendredi
// noir tous les deux actifs). Stocké dans config_vendeur.vente_effets_actifs
// + vente_effets_config (JSONB) — 100% opt-in, comportement inchangé tant
// que le vendeur n'active rien ici.
export const EFFETS_VENTE: EffetSaisonnier[] = [
  {
    id: 'vendredi-noir', nom: 'Vendredi noir', emoji: '🏷️', type: 'texte3d',
    description: "Un mot qui tombe en tournant sur lui-même. Modifiable en tout temps (ex: passer en anglais ou changer le texte).",
    texteDefaut: 'VENDREDI NOIR', couleurTexteDefaut: '#1a1a1a',
    tailleMin: 18, tailleMax: 48, tailleDefaut: 28,
    nombreMin: 1, nombreMax: 15, nombreDefaut: 6,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
    vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
  },
  {
    id: 'liquidation', nom: 'Liquidation / Rabais', emoji: '💯', type: 'texte3d',
    description: 'Un pourcentage ou message de rabais qui tombe en tournant.',
    texteDefaut: '50% RABAIS', couleurTexteDefaut: '#c0392b',
    tailleMin: 18, tailleMax: 48, tailleDefaut: 28,
    nombreMin: 1, nombreMax: 15, nombreDefaut: 6,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
    vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
  },
  {
    id: 'merci', nom: 'Merci', emoji: '🙏', type: 'texte3d',
    description: 'Un mot de remerciement qui tombe en tournant.',
    texteDefaut: 'MERCI', couleurTexteDefaut: '#537373',
    tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
    nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
    vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
  },
  {
    id: 'joyeux-noel', nom: 'Joyeux Noël', emoji: '🎅', type: 'texte3d',
    description: 'Un souhait des Fêtes qui tombe en tournant.',
    texteDefaut: 'JOYEUX NOËL', couleurTexteDefaut: '#b91c1c',
    tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
    nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
    vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
  },
  {
    id: 'texte-libre', nom: 'Texte personnalisé', emoji: '✏️', type: 'texte3d',
    description: 'Écrivez votre propre mot ou message — il tombera en tournant sur lui-même.',
    texteDefaut: 'SOLDES', couleurTexteDefaut: '#2d6a9f',
    tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
    nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
    vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
  },
  {
    id: 'rubans', nom: 'Rubans qui tombent', emoji: '🎀', type: 'ruban',
    description: 'Des rubans colorés qui tombent en se tortillant.',
    couleurTexteDefaut: '#e0455f',
    tailleMin: 40, tailleMax: 120, tailleDefaut: 70,
    nombreMin: 2, nombreMax: 25, nombreDefaut: 10,
    vitesseMin: 3, vitesseMax: 14, vitesseDefaut: 7,
  },
  {
    id: 'drapeaux', nom: 'Drapeaux du Canada', emoji: '🇨🇦', type: 'drapeau',
    description: 'Le drapeau du Canada et/ou de la ou des provinces de votre choix, qui tombent.',
    tailleMin: 20, tailleMax: 50, tailleDefaut: 30,
    nombreMin: 1, nombreMax: 20, nombreDefaut: 8,
    vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 8,
    drapeauxDisponibles: [
      { id: 'ca', nom: 'Canada', couleurs: ['#ff0000', '#ffffff'] },
      { id: 'qc', nom: 'Québec', couleurs: ['#003DA5', '#ffffff'] },
      { id: 'on', nom: 'Ontario', couleurs: ['#c8102e', '#ffffff'] },
      { id: 'bc', nom: 'Colombie-Britannique', couleurs: ['#003DA5', '#FDB927'] },
      { id: 'ab', nom: 'Alberta', couleurs: ['#00205B', '#FFD700'] },
      { id: 'mb', nom: 'Manitoba', couleurs: ['#c8102e', '#00205b'] },
      { id: 'sk', nom: 'Saskatchewan', couleurs: ['#046A38', '#FFD700'] },
      { id: 'ns', nom: 'Nouvelle-Écosse', couleurs: ['#00247D', '#ffffff'] },
      { id: 'nb', nom: 'Nouveau-Brunswick', couleurs: ['#FFCE00', '#c8102e'] },
      { id: 'pe', nom: 'Île-du-Prince-Édouard', couleurs: ['#c8102e', '#046A38'] },
      { id: 'nl', nom: 'Terre-Neuve-et-Labrador', couleurs: ['#00205B', '#FFD700'] },
      { id: 'yt', nom: 'Yukon', couleurs: ['#00205B', '#046A38'] },
      { id: 'nt', nom: 'Territoires du Nord-Ouest', couleurs: ['#00205B', '#046A38'] },
      { id: 'nu', nom: 'Nunavut', couleurs: ['#FFD700', '#c8102e'] },
    ],
  },
];

export interface ThemeSaisonnier {
  id: string;
  nom: string;
  emoji: string;
  description: string;
  effets: EffetSaisonnier[];
}

export const THEMES_SAISONNIERS: Record<string, ThemeSaisonnier> = {
  halloween: {
    id: 'halloween', nom: 'Halloween', emoji: '🎃',
    description: "Décorations d'Halloween en survol du tableau de bord.",
    effets: [
      {
        id: 'guirlande', nom: 'Guirlande de citrouilles', emoji: '🎃', type: 'guirlande',
        description: "Une guirlande de citrouilles reliées par un fil courbe, tout en haut de l'écran.",
        // Pas de "nombre" réglable : le nombre de citrouilles s'ajuste tout
        // seul selon la largeur de l'écran pour garder un espacement propre.
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'fantomes', nom: 'Fantômes flottants', emoji: '👻', type: 'flottant',
        description: 'Quelques fantômes qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'chauvesouris', nom: 'Chauves-souris', emoji: '🦇', type: 'volant',
        description: "Des chauves-souris qui traversent l'écran de temps en temps.",
        tailleMin: 14, tailleMax: 40, tailleDefaut: 22,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
      {
        id: 'faucheuse', nom: 'La Faucheuse', emoji: '💀', type: 'marcheur',
        description: 'Un petit personnage qui marche lentement en bas de l\'écran.',
      },
      {
        id: 'araignees', nom: 'Araignées pendues', emoji: '🕷️', type: 'pendu',
        description: 'Des araignées qui montent et descendent le long de leur fil.',
        tailleMin: 14, tailleMax: 38, tailleDefaut: 20,
      },
    ],
  },
  noel: {
    id: 'noel', nom: 'Hiver / Noël', emoji: '🎄',
    description: "Décorations d'hiver et de Noël en survol du tableau de bord.",
    effets: [
      {
        id: 'traineau', nom: 'Traîneau du père Noël', emoji: '🎅🛷', type: 'vagabond',
        description: 'Le père Noël en traîneau qui se promène librement partout sur la page (pas juste en haut).',
        // Image large (scène traîneau + 2 rennes, ratio ~2:1) — taille = hauteur affichée.
        tailleMin: 30, tailleMax: 110, tailleDefaut: 55,
        // Secondes pour compléter un tour complet du parcours : plus petit = plus rapide.
        vitesseMin: 14, vitesseMax: 50, vitesseDefaut: 26,
      },
      {
        id: 'neige', nom: 'Chute de neige', emoji: '❄️', type: 'neige',
        description: 'De vrais flocons qui tombent en dérivant, comme une chute de neige naturelle.',
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
      },
      {
        id: 'guirlande-lumiere', nom: 'Guirlande lumineuse', emoji: '💡', type: 'guirlande',
        description: 'Une guirlande de lumières scintillantes reliées par un fil, couleurs et animation personnalisables.',
        ampoules: true,
        tailleMin: 8, tailleMax: 20, tailleDefaut: 12,
        couleursDefaut: ['#ff4545', '#3ddc84', '#3d8bff', '#ff5ebd', '#ffd23d'],
        stylesAnimationDisponibles: ['fixe', 'scintillement', 'chenillard', 'vague'],
      },
      {
        id: 'sapin', nom: 'Sapin décoré', emoji: '🎄', type: 'statique',
        description: "Un sapin de Noël décoré, fixe en bas de l'écran.",
        ancrage: 'bas-droite',
        tailleMin: 60, tailleMax: 160, tailleDefaut: 100,
      },
      {
        id: 'bonhomme', nom: 'Bonhomme de neige', emoji: '⛄', type: 'statique',
        description: "Un bonhomme de neige, fixe en bas de l'écran.",
        ancrage: 'bas-gauche',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
      {
        id: 'etoile-filante', nom: 'Étoile filante', emoji: '💫', type: 'filante',
        description: 'Une étoile filante qui traverse le ciel de temps en temps.',
        tailleMin: 18, tailleMax: 40, tailleDefaut: 26,
      },
      {
        id: 'cadeaux', nom: 'Cadeaux flottants', emoji: '🎁', type: 'flottant',
        description: 'Des cadeaux qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 44, tailleDefaut: 24,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
    ],
  },
  'saint-valentin': {
    id: 'saint-valentin', nom: 'Saint-Valentin', emoji: '💘',
    description: 'Décorations de la Saint-Valentin en survol du tableau de bord.',
    effets: [
      {
        id: 'pluie-coeurs', nom: 'Pluie de cœurs', emoji: '❤️', type: 'neige',
        description: 'Des cœurs qui tombent doucement en dérivant, comme une pluie de confettis.',
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
        emojisChute: ['❤️', '💕', '💖'],
      },
      {
        id: 'coeurs-flottants', nom: 'Cœurs flottants', emoji: '💕', type: 'flottant',
        description: 'Quelques cœurs qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'guirlande-coeurs', nom: 'Guirlande de cœurs', emoji: '❤️', type: 'guirlande',
        description: "Une guirlande de petits cœurs reliés par un fil, tout en haut de l'écran.",
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'cupidon', nom: 'Cupidon volant', emoji: '💘', type: 'volant',
        description: "Une flèche de Cupidon qui traverse l'écran de temps en temps.",
        tailleMin: 14, tailleMax: 40, tailleDefaut: 22,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
      {
        id: 'bouquet', nom: 'Bouquet de roses', emoji: '💐', type: 'statique',
        description: "Un bouquet de roses, fixe en bas de l'écran.",
        ancrage: 'bas-droite',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
    ],
  },
  paques: {
    id: 'paques', nom: 'Pâques', emoji: '🐰',
    description: 'Décorations de Pâques en survol du tableau de bord.',
    effets: [
      {
        id: 'pluie-oeufs', nom: "Pluie d'œufs", emoji: '🥚', type: 'neige',
        description: "Des œufs de Pâques qui tombent doucement en dérivant.",
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
        emojisChute: ['🥚'],
      },
      {
        id: 'fleurs-flottantes', nom: 'Fleurs flottantes', emoji: '🌷', type: 'flottant',
        description: 'Quelques fleurs qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'guirlande-oeufs', nom: "Guirlande d'œufs", emoji: '🥚', type: 'guirlande',
        description: "Une guirlande d'œufs colorés reliés par un fil, tout en haut de l'écran.",
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'lapin', nom: 'Lapin qui bondit', emoji: '🐰', type: 'volant',
        description: "Un lapin de Pâques qui traverse l'écran de temps en temps.",
        tailleMin: 14, tailleMax: 40, tailleDefaut: 22,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
      {
        id: 'panier', nom: 'Panier de Pâques', emoji: '🧺', type: 'statique',
        description: "Un panier de Pâques, fixe en bas de l'écran.",
        ancrage: 'bas-gauche',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
    ],
  },
  automne: {
    id: 'automne', nom: 'Automne', emoji: '🍂',
    description: "Décorations d'automne en survol du tableau de bord.",
    effets: [
      {
        id: 'pluie-feuilles', nom: 'Pluie de feuilles', emoji: '🍁', type: 'neige',
        description: "Des feuilles d'automne qui tombent doucement en dérivant.",
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
        emojisChute: ['🍁', '🍂', '🍃'],
      },
      {
        id: 'feuilles-flottantes', nom: 'Feuilles flottantes', emoji: '🍂', type: 'flottant',
        description: 'Quelques feuilles qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'guirlande-feuilles', nom: 'Guirlande de feuilles', emoji: '🍁', type: 'guirlande',
        description: "Une guirlande de feuilles reliées par un fil, tout en haut de l'écran.",
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'oiseaux-migrateurs', nom: 'Oiseaux migrateurs', emoji: '🐦', type: 'volant',
        description: "Des oiseaux migrateurs qui traversent l'écran de temps en temps.",
        tailleMin: 14, tailleMax: 40, tailleDefaut: 22,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
      {
        id: 'recolte', nom: "Récolte d'automne", emoji: '🎃🌽', type: 'statique',
        description: "Une citrouille et des épis de maïs, fixes en bas de l'écran.",
        ancrage: 'bas-droite',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
    ],
  },
  'nouvel-an': {
    id: 'nouvel-an', nom: 'Nouvel An', emoji: '🎆',
    description: 'Décorations du Nouvel An en survol du tableau de bord.',
    effets: [
      {
        id: 'pluie-confettis', nom: 'Pluie de confettis', emoji: '🎊', type: 'neige',
        description: 'Des confettis qui tombent doucement en dérivant.',
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
        emojisChute: ['🎊', '🎉', '✨'],
      },
      {
        id: 'etincelles-flottantes', nom: 'Étincelles flottantes', emoji: '✨', type: 'flottant',
        description: 'Quelques étincelles qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'guirlande-ballons', nom: 'Guirlande de ballons', emoji: '🎈', type: 'guirlande',
        description: "Une guirlande de ballons reliés par un fil, tout en haut de l'écran.",
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'feu-artifice', nom: "Feu d'artifice", emoji: '🎆', type: 'filante',
        description: "Un feu d'artifice qui éclate dans le ciel de temps en temps.",
        tailleMin: 18, tailleMax: 40, tailleDefaut: 26,
      },
      {
        id: 'champagne', nom: 'Champagne', emoji: '🥂', type: 'statique',
        description: 'Une coupe de champagne, fixe en bas de l\'écran.',
        ancrage: 'bas-gauche',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
    ],
  },
  'saint-patrick': {
    id: 'saint-patrick', nom: 'Saint-Patrick', emoji: '☘️',
    description: 'Décorations de la Saint-Patrick en survol du tableau de bord.',
    effets: [
      {
        id: 'pluie-trefles', nom: 'Pluie de trèfles', emoji: '🍀', type: 'neige',
        description: 'Des trèfles qui tombent doucement en dérivant.',
        tailleMin: 10, tailleMax: 30, tailleDefaut: 16,
        nombreMin: 5, nombreMax: 60, nombreDefaut: 25,
        vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10,
        emojisChute: ['🍀'],
      },
      {
        id: 'trefles-flottants', nom: 'Trèfles flottants', emoji: '🍀', type: 'flottant',
        description: 'Quelques trèfles qui flottent doucement dans les coins.',
        tailleMin: 16, tailleMax: 46, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 4,
      },
      {
        id: 'guirlande-trefles', nom: 'Guirlande de trèfles', emoji: '🍀', type: 'guirlande',
        description: "Une guirlande de trèfles reliés par un fil, tout en haut de l'écran.",
        tailleMin: 16, tailleMax: 34, tailleDefaut: 20,
      },
      {
        id: 'arc-en-ciel', nom: 'Arc-en-ciel volant', emoji: '🌈', type: 'volant',
        description: "Un arc-en-ciel qui traverse l'écran de temps en temps.",
        tailleMin: 14, tailleMax: 40, tailleDefaut: 22,
        nombreMin: 1, nombreMax: 8, nombreDefaut: 3,
      },
      {
        id: 'pot-or', nom: "Pot d'or", emoji: '💰', type: 'statique',
        description: "Un pot d'or de lutin, fixe en bas de l'écran.",
        ancrage: 'bas-droite',
        tailleMin: 50, tailleMax: 140, tailleDefaut: 90,
      },
    ],
  },
};