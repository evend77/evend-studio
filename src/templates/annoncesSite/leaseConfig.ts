// src/templates/annoncesSite/leaseConfig.ts
// e-Vend Studio — Configuration du template « Auto Leasing » (thème sombre, accent rouge, titres condensés) :
// schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).
// Ici : bornage de longueur + contrôle des liens/couleurs à l'affichage. Réutilise les contrôles de autoShowroomConfig.

import { texte, paragraphe, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['hero', 'atouts', 'types', 'vehicules', 'offres', 'apropos', 'guide', 'temoignages', 'actualites', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string }> = {
  hero:        { nom: 'Bannière d\'accueil',            icone: '🏁', navDefaut: '', note: 'Grand titre, texte, photo de fond et 2 boutons.' },
  atouts:      { nom: 'Nos atouts (cartes défilantes)', icone: '⭐', navDefaut: '' },
  types:       { nom: 'Types de contrat (photo + texte)', icone: '📄', navDefaut: 'Contrats' },
  vehicules:   { nom: 'Véhicules disponibles (vos annonces)', icone: '🚗', navDefaut: 'Véhicules', note: 'Affiche vos annonces de « Mes annonces » en carrousel, avec recherche et catégories.' },
  offres:      { nom: 'Meilleures offres (2 grandes cartes)', icone: '🔥', navDefaut: 'Offres' },
  apropos:     { nom: 'À propos (photo teintée)',       icone: '🏢', navDefaut: 'À propos' },
  guide:       { nom: 'Ce qu\'il faut savoir (grille de cartes)', icone: '📋', navDefaut: 'Infos' },
  temoignages: { nom: 'Avis des clients',               icone: '💬', navDefaut: 'Avis' },
  actualites:  { nom: 'Nouvelles',                      icone: '📰', navDefaut: 'Nouvelles' },
  contact:     { nom: 'Contact (bas de page)',          icone: '📞', navDefaut: 'Contact' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 140 },
  { k: 'texte', label: 'Texte', t: 'area', max: 400 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  hero: [
    { k: 'titre', label: 'Grand titre', t: 'text', max: 140 },
    { k: 'texte', label: 'Texte sous le titre', t: 'area', max: 300 },
    { k: 'image', label: 'Photo de fond', t: 'img', aide: 'Format paysage recommandé. Une photo sombre ou assombrie donne le meilleur résultat.' },
    { k: 'btn1Texte', label: 'Bouton 1 (plein) — texte', t: 'text', max: 40 },
    { k: 'btn1Lien', label: 'Bouton 1 — lien', t: 'lien', aide: 'Ex. #contact, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'btn2Texte', label: 'Bouton 2 (contour) — texte', t: 'text', max: 40 },
    { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  atouts: [{ k: 'items', label: 'Cartes', t: 'liste', maxItems: 9, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 220 },
  ] }],
  types: [{ k: 'items', label: 'Types de contrat', t: 'liste', maxItems: 4, sub: [
    { k: 'surtitre', label: 'Petit titre', t: 'text', max: 40 }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 400 },
    { k: 'image', label: 'Photo', t: 'img' }, { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ] }],
  vehicules: [...ENTETE,
    { k: 'suffixePrix', label: 'Texte après le prix (ex. / mois)', t: 'text', max: 20, aide: 'Laissez vide pour un prix d\'achat sans « / mois ».' },
    { k: 'btnTexte', label: 'Texte du bouton des cartes', t: 'text', max: 30 },
    { k: 'vide', label: 'Message quand aucun véhicule ne correspond', t: 'text', max: 120 }],
  offres: [...ENTETE, { k: 'items', label: 'Offres', t: 'liste', maxItems: 4, sub: [
    { k: 'image', label: 'Photo de fond', t: 'img' }, { k: 'titre', label: 'Titre', t: 'text', max: 90 }, { k: 'prix', label: 'Prix (ex. Dès 149 $ / mois)', t: 'text', max: 50 },
    { k: 'btnTexte', label: 'Lien — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Lien — adresse', t: 'lien' },
  ] }],
  apropos: [
    { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
    { k: 'titre', label: 'Titre', t: 'text', max: 100 },
    { k: 'titreAccent', label: 'Fin du titre en couleur (facultatif)', t: 'text', max: 60 },
    { k: 'texteGras', label: 'Phrase d\'accroche', t: 'area', max: 300 },
    { k: 'texte', label: 'Texte', t: 'area', max: 900 },
    { k: 'image', label: 'Photo (teintée à la couleur principale)', t: 'img' },
    { k: 'btn1Texte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btn1Lien', label: 'Bouton 1 — lien', t: 'lien' },
    { k: 'btn2Texte', label: 'Bouton 2 — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  guide: [...ENTETE, { k: 'items', label: 'Cartes', t: 'liste', maxItems: 9, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 260 },
    { k: 'btnTexte', label: 'Lien — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Lien — adresse', t: 'lien' },
  ] }],
  temoignages: [...ENTETE, { k: 'items', label: 'Avis', t: 'liste', maxItems: 8, sub: [
    { k: 'nom', label: 'Nom', t: 'text', max: 60 }, { k: 'role', label: 'Fonction / entreprise', t: 'text', max: 80 }, { k: 'photo', label: 'Photo', t: 'img' },
    { k: 'texte', label: 'Avis', t: 'area', max: 500 }, { k: 'date', label: 'Date (texte libre)', t: 'text', max: 30 },
  ] }],
  actualites: [...ENTETE, { k: 'items', label: 'Nouvelles', t: 'liste', maxItems: 6, sub: [
    { k: 'image', label: 'Photo', t: 'img' }, { k: 'titre', label: 'Titre', t: 'text', max: 100 }, { k: 'texte', label: 'Résumé', t: 'area', max: 260 },
    { k: 'date', label: 'Date (texte libre)', t: 'text', max: 30 }, { k: 'btnTexte', label: 'Lien — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Lien — adresse', t: 'lien' },
  ] }],
  contact: [...ENTETE],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
const P = (n: number) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=1400`;

export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  hero: { titre: 'Experts en location de véhicules pour particuliers et entreprises', texte: 'Vous conduisez. Nous nous occupons du reste.', image: P(358070), btn1Texte: 'Demander une soumission', btn1Lien: '#contact', btn2Texte: 'En savoir plus', btn2Lien: '#apropos' },
  atouts: { items: [
    { icone: '💳', titre: 'Mieux que la concurrence', texte: 'Vous avez trouvé une meilleure offre ailleurs ? Écrivez-nous et obtenez un mois gratuit.' },
    { icone: '🚘', titre: 'Tarifs abordables', texte: 'Nous surveillons les prix du marché pour vous offrir les meilleures conditions.' },
    { icone: '📑', titre: 'Paperasse réglée', texte: 'Tous nos véhicules sont garantis, immatriculés et couverts par une assistance routière.' },
  ] },
  types: { items: [
    { surtitre: 'TYPE DE CONTRAT', titre: 'Entreprises', texte: 'Nous louons des véhicules aux entreprises de toutes tailles. Que vous receviez des partenaires à l\'aéroport ou livriez des documents toute la journée, nous trouvons la solution.', image: P(210019), btnTexte: 'En savoir plus', btnLien: '#contact' },
  ] },
  vehicules: { surtitre: 'VÉHICULES', titre: 'Options disponibles', texte: 'Tous ces véhicules sont disponibles à la location dès maintenant.', suffixePrix: '/ mois', btnTexte: 'En savoir plus', vide: 'Aucun véhicule ne correspond.' },
  offres: { surtitre: 'OFFRES', titre: 'Meilleures offres', texte: 'Profitez de prix spéciaux sur la location de véhicules !', items: [
    { image: '', titre: 'Compacte 1.0 turbo — édition sport', prix: 'Dès 149 $ / mois', btnTexte: 'Me renseigner', btnLien: '#contact' },
    { image: '', titre: 'Berline diesel 2.0 — 5 portes', prix: 'Dès 225 $ / mois', btnTexte: 'Me renseigner', btnLien: '#contact' },
  ] },
  apropos: { surtitre: 'À PROPOS', titre: 'Roulez avec un faible taux de', titreAccent: 'location', texteGras: 'Nous sommes un spécialiste de la location pour les particuliers et les entreprises.', texte: 'Nous offrons plus d\'une centaine de contrats de location de voitures et de fourgonnettes. Depuis nos débuts, nous avons satisfait des milliers de clients.\n\nNotre réseau de fabricants et de distributeurs nous permet de vous obtenir les meilleures conditions. Notre objectif : une collaboration continue pour que vous reveniez nous voir.', image: P(3802510), btn1Texte: 'Demander une soumission', btn1Lien: '#contact', btn2Texte: 'En savoir plus', btn2Lien: '#guide' },
  guide: { surtitre: 'À SAVOIR', titre: 'Tout ce qu\'il faut savoir sur la location', texte: 'Vous n\'avez jamais loué un véhicule ? C\'est simple !', items: [
    { icone: '🛡️', titre: 'Assurance complète', texte: 'Notre partenaire assureur couvre tous les risques, inclus dans le forfait de base.', btnTexte: 'En savoir plus', btnLien: '#contact' },
    { icone: '🔧', titre: 'Entretien inclus', texte: 'Un véhicule inspecté et prêt à rouler. Aucune mauvaise surprise sur la route.', btnTexte: 'En savoir plus', btnLien: '#contact' },
    { icone: '🧳', titre: 'Location pour voyages', texte: 'Un voyage en famille ou des déplacements quotidiens : nous trouvons l\'option qui vous convient.', btnTexte: 'En savoir plus', btnLien: '#contact' },
    { icone: '💼', titre: 'Location pour affaires', texte: 'Nous travaillons avec les entreprises qui ont besoin de véhicules fiables.', btnTexte: 'En savoir plus', btnLien: '#contact' },
    { icone: '📆', titre: 'Contrats court terme', texte: 'Commencez avec 3 ou 6 mois et prolongez au besoin.', btnTexte: 'En savoir plus', btnLien: '#contact' },
    { icone: '📘', titre: 'Guide du contrat', texte: 'Le loyer mensuel dépend du véhicule, de la durée et du kilométrage choisis.', btnTexte: 'En savoir plus', btnLien: '#contact' },
  ] },
  temoignages: { surtitre: 'AVIS', titre: 'Ce que disent nos clients', texte: 'Nous sommes heureux de recevoir vos témoignages et de vous offrir un service exceptionnel !', items: [
    { nom: 'Daniella M.', role: 'Directrice marketing', photo: '', texte: 'L\'entreprise nous a accompagnés à chaque étape. Le processus de location et de signature était simple et clair, sans paiements cachés.', date: 'Octobre 2025' },
    { nom: 'Marc-André T.', role: 'Entrepreneur', photo: '', texte: 'Service impeccable. Le véhicule était exactement comme décrit. Je recommande sans hésiter.', date: 'Mars 2026' },
  ] },
  actualites: { surtitre: 'NOUVELLES', titre: 'Dernières nouvelles', texte: '', items: [] },
  contact: { surtitre: 'CONTACT', titre: 'Nos coordonnées', texte: 'Une question ou une soumission ? Écrivez-nous, nous répondons rapidement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigLease {
  nomSite: string; nomAccent: string; slogan: string; logoUrl: string;
  couleurPrincipale: string; couleurFond: string; couleurCarte: string; couleurTexte: string;
  police: 'condensee' | 'oswald' | 'moderne';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;   // « Propulsé par e-Vend Studio » dans le pied de page
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'FUTURE', nomAccent: 'LEASE', slogan: 'Location de véhicules', couleurPrincipale: '#e8173c', couleurFond: '#1b1b1d', couleurCarte: '#121213', couleurTexte: '#ffffff', police: 'condensee' as const };

const IDS: string[] = [...SECTION_IDS];

export function normaliserConfig(brut: any): ConfigLease {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigLease['police'] = c.police === 'oswald' || c.police === 'moderne' || c.police === 'condensee' ? c.police : d.police;

  // Sections : ordre et visibilité (ids connus seulement, sans doublon ; les manquantes s'ajoutent à la fin)
  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: id !== 'actualites', label: '' }); });

  const contenu = {} as ConfigLease['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });

  const reseaux = {} as ConfigLease['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), nomAccent: texte(c.nomAccent ?? d.nomAccent, 40), slogan: texte(c.slogan ?? d.slogan, 60),
    logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurFond: couleur(c.couleurFond, d.couleurFond),
    couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}

// (paragraphe est réexporté pour les gabarits qui affichent du texte multi-lignes)
export { paragraphe };