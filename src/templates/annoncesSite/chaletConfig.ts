// src/templates/annoncesSite/chaletConfig.ts
// e-Vend Studio — Configuration du template « Chalet Boréal » (location de vacances / chalets, fond marine, menthe et vert forêt) :
// schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['entete', 'hero', 'vedettes', 'apropos', 'atouts', 'categories', 'annonces', 'temoignages', 'activites', 'etapes', 'galerie', 'faq', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string; obligatoire?: boolean }> = {
  entete:      { nom: 'Barre du haut (téléphone, courriel, message)', icone: '📣', navDefaut: '', note: 'Le téléphone et le courriel viennent de l\'onglet général.' },
  hero:        { nom: 'Bannière avec photo et recherche de séjour', icone: '🏔️', navDefaut: '', note: 'Grande photo, titre, deux boutons et une barre de recherche (région, voyageurs) qui filtre vos chalets.' },
  vedettes:    { nom: 'Chalets à la une (carrousel)', icone: '⭐', navDefaut: 'Nos chalets', note: 'Vos annonces marquées « vedette », complétées par les plus récentes.' },
  apropos:     { nom: 'Présentation (texte + boutons)', icone: '📖', navDefaut: 'À propos' },
  atouts:      { nom: 'Nos atouts (3 ou 4 colonnes)', icone: '✅', navDefaut: '' },
  categories:  { nom: 'Régions et types (tuiles)', icone: '🗺️', navDefaut: 'Régions', note: 'Générées automatiquement à partir de la catégorie de vos annonces (ex. Charlevoix, Laurentides).' },
  annonces:    { nom: 'Tous les chalets', icone: '🏕️', navDefaut: 'Réserver', note: 'Liste complète avec recherche, filtres (région, voyageurs, chambres, spa, animaux, prix) et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  temoignages: { nom: 'Avis de voyageurs', icone: '💬', navDefaut: '' },
  activites:   { nom: 'Activités autour des chalets (bande verte)', icone: '🌲', navDefaut: 'Activités' },
  etapes:      { nom: 'Comment réserver (étapes)', icone: '🪜', navDefaut: '' },
  galerie:     { nom: 'Bande de photos', icone: '🖼️', navDefaut: '' },
  faq:         { nom: 'Questions fréquentes', icone: '❓', navDefaut: 'FAQ' },
  contact:     { nom: 'Contact (formulaire de demande de séjour)', icone: '✉️', navDefaut: 'Contact' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 120 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  entete: [
    { k: 'texte', label: 'Message (vide = pas de barre si aucun téléphone ni courriel)', t: 'text', max: 140 },
  ],
  hero: [
    { k: 'titre', label: 'Titre — début', t: 'text', max: 70 },
    { k: 'titreAccent', label: 'Titre — mots en couleur', t: 'text', max: 50 },
    { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'btnTexte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton 1 — lien', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'btn2Texte', label: 'Bouton 2 — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
    { k: 'rechercheTitre', label: 'Titre de la barre de recherche (vide = pas de barre)', t: 'text', max: 60 },
    { k: 'image', label: 'Photo de la bannière (grande photo de paysage)', t: 'img' },
  ],
  vedettes: [...ENTETE, { k: 'nombre', label: 'Nombre de chalets (3 à 12)', t: 'text', max: 2 }],
  apropos: [
    { k: 'titre', label: 'Titre', t: 'text', max: 160 }, { k: 'texte', label: 'Texte', t: 'area', max: 900 },
    { k: 'image', label: 'Photo (facultatif)', t: 'img' },
    { k: 'btnTexte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton 1 — lien', t: 'lien' },
    { k: 'btn2Texte', label: 'Bouton 2 — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  atouts: [
    { k: 'items', label: 'Atouts (4 maximum)', t: 'liste', maxItems: 4, sub: [
      { k: 'icone', label: 'Icône (emoji, facultatif)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 260 },
    ] },
  ],
  categories: [...ENTETE],
  annonces: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'vide', label: 'Message quand aucun chalet ne correspond', t: 'text', max: 120 }],
  temoignages: [...ENTETE, { k: 'items', label: 'Avis', t: 'liste', maxItems: 3, sub: [
    { k: 'titre', label: 'Titre court', t: 'text', max: 60 }, { k: 'texte', label: 'Avis', t: 'area', max: 400 }, { k: 'auteur', label: 'Auteur', t: 'text', max: 60 },
  ] }],
  activites: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'items', label: 'Activités (4 maximum)', t: 'liste', maxItems: 4, sub: [
    { k: 'image', label: 'Photo', t: 'img' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'text', max: 100 },
  ] }],
  etapes: [
    { k: 'titre', label: 'Titre', t: 'text', max: 80 }, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'image', label: 'Photo', t: 'img' },
    { k: 'items', label: 'Étapes', t: 'liste', maxItems: 6, sub: [{ k: 'titre', label: 'Titre', t: 'text', max: 70 }, { k: 'texte', label: 'Texte', t: 'area', max: 200 }] },
  ],
  galerie: [{ k: 'items', label: 'Photos (8 maximum)', t: 'liste', maxItems: 8, sub: [{ k: 'image', label: 'Photo', t: 'img' }] }],
  faq: [...ENTETE, { k: 'items', label: 'Questions', t: 'liste', maxItems: 10, sub: [{ k: 'q', label: 'Question', t: 'text', max: 160 }, { k: 'r', label: 'Réponse', t: 'area', max: 700 }] }],
  contact: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  entete: { texte: 'Réponse à toute demande de séjour en moins de 24 h.' },
  hero: { titre: 'Des chalets pour', titreAccent: 'souffler en nature.', texte: 'Lacs, forêts et montagnes : choisissez votre chalet, repérez vos dates et écrivez-nous. Nous vous répondons personnellement.', btnTexte: 'Voir les chalets', btnLien: '#annonces', btn2Texte: 'Nous écrire', btn2Lien: '#contact', rechercheTitre: 'Trouvez votre séjour', image: '' },
  vedettes: { surtitre: '', titre: 'Trouvez votre chalet', nombre: '6' },
  apropos: { titre: 'Des chalets choisis un à un, pour des séjours qui ressemblent à vos vacances.', texte: 'Nous gérons nous-mêmes chacun de nos chalets : entretien, accueil et conseils sur la région. Pas d\'intermédiaire, pas de surprise : vous nous écrivez, nous confirmons la disponibilité et les conditions du séjour.', image: '', btnTexte: 'Voir les chalets', btnLien: '#annonces', btn2Texte: 'Notre histoire', btn2Lien: '#contact' },
  atouts: { items: [
    { icone: '🌲', titre: 'En pleine nature', texte: 'Des emplacements calmes, au bord de l\'eau ou en forêt, loin du bruit.' },
    { icone: '🔥', titre: 'Tout pour se détendre', texte: 'Foyer, spa, terrasse et literie de qualité : on pense au confort.' },
    { icone: '🤝', titre: 'Accueil personnalisé', texte: 'Nous vous remettons les clés, vos conseils d\'activités et restons joignables.' },
  ] },
  categories: { surtitre: '', titre: 'Explorez par région' },
  annonces: { surtitre: '', titre: 'Tous nos chalets', texte: 'Filtrez par région, nombre de voyageurs, chambres et équipements.', vide: 'Aucun chalet ne correspond à votre recherche.' },
  temoignages: { surtitre: '', titre: 'Ils sont revenus', items: [
    { titre: 'Un séjour parfait', texte: 'Chalet propre, calme et très bien équipé. Le spa face au lac, c\'était magique.', auteur: 'Un voyageur' },
    { titre: 'Parfait en famille', texte: 'Il y avait de la place pour tout le monde et les enfants ont adoré le sentier derrière le chalet.', auteur: 'Une famille' },
    { titre: 'Hôtes chaleureux', texte: 'Réponse rapide, conseils précieux sur la région. Nous y retournons l\'hiver prochain.', auteur: 'Un couple' },
  ] },
  activites: { surtitre: '', titre: 'À faire autour de nos chalets', texte: 'Quelques idées pour remplir vos journées.', items: [
    { image: '', titre: 'Randonnée', texte: 'Sentiers balisés à partir du chalet.' },
    { image: '', titre: 'Kayak et pêche', texte: 'Accès au lac, équipement sur demande.' },
    { image: '', titre: 'Ski et raquette', texte: 'Pistes et sentiers à quelques minutes.' },
    { image: '', titre: 'Soirées au feu', texte: 'Bois et foyer extérieur disponibles.' },
  ] },
  etapes: { titre: 'Comment réserver', texte: 'Trois étapes simples, sans paiement en ligne.', image: '', items: [
    { titre: 'Choisissez un chalet', texte: 'Parcourez les fiches : photos, équipements, capacité, prix par nuit.' },
    { titre: 'Écrivez-nous vos dates', texte: 'Un formulaire rapide : dates, nombre de voyageurs, questions.' },
    { titre: 'Nous confirmons', texte: 'Nous répondons par courriel avec la disponibilité et les conditions.' },
  ] },
  galerie: { items: [] },
  faq: { surtitre: 'FAQ', titre: 'Vos questions', items: [
    { q: 'Comment réserver un chalet ?', r: 'Ouvrez la fiche du chalet et envoyez-nous une demande avec vos dates : nous vous répondons par courriel avec la disponibilité.' },
    { q: 'Y a-t-il un paiement sur ce site ?', r: 'Non. Les annonces sont affichées à titre informatif : la réservation et le paiement se font directement avec nous.' },
    { q: 'Les animaux sont-ils acceptés ?', r: 'Cela dépend du chalet : l\'information figure dans la fiche de chaque annonce (rubrique Équipements).' },
  ] },
  contact: { surtitre: '', titre: 'Une demande de séjour ? Écrivez-nous', texte: 'Indiquez vos dates et le nombre de voyageurs : nous vous répondons rapidement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigChalet {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurSecondaire: string; couleurFond: string; couleurCarte: string; couleurBande: string; couleurTexte: string;
  police: 'geometrique' | 'moderne' | 'arrondie';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'Chalet Boréal', couleurPrincipale: '#7dffd5', couleurSecondaire: '#e4f56b', couleurFond: '#1b2130', couleurCarte: '#252c40', couleurBande: '#274139', couleurTexte: '#ffffff', police: 'moderne' as const };

const IDS: string[] = [...SECTION_IDS];
const MASQUEES_PAR_DEFAUT = ['etapes', 'galerie'];

export function normaliserConfig(brut: any): ConfigChalet {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigChalet['police'] = c.police === 'moderne' || c.police === 'arrondie' || c.police === 'geometrique' ? c.police : d.police;

  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: !MASQUEES_PAR_DEFAUT.includes(id), label: '' }); });

  const contenu = {} as ConfigChalet['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });
  const n = parseInt(String(contenu.vedettes.nombre), 10);
  contenu.vedettes.nombre = String(Number.isFinite(n) ? Math.min(12, Math.max(3, n)) : 6);

  const reseaux = {} as ConfigChalet['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurSecondaire: couleur(c.couleurSecondaire, d.couleurSecondaire),
    couleurFond: couleur(c.couleurFond, d.couleurFond), couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurBande: couleur(c.couleurBande, d.couleurBande), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}