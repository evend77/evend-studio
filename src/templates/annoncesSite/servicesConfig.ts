// src/templates/annoncesSite/servicesConfig.ts
// e-Vend Studio — Configuration du template « Néo Services » (emplois et services, fond noir, bleu néon) :
// schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['entete', 'hero', 'piliers', 'chiffres', 'categories', 'vedettes', 'annonces', 'histoire', 'etapes', 'forfaits', 'temoignages', 'galerie', 'faq', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string; obligatoire?: boolean }> = {
  entete:      { nom: 'Barre du haut (téléphone, courriel, message)', icone: '📣', navDefaut: '', note: 'Le téléphone et le courriel viennent de l\'onglet général.' },
  hero:        { nom: 'Bannière avec formulaire de demande', icone: '✨', navDefaut: '', note: 'Titre, points forts, boutons et formulaire de contact du site à droite.' },
  piliers:     { nom: 'Bande bleue : introduction + 3 cartes', icone: '🟦', navDefaut: 'Services' },
  chiffres:    { nom: 'Chiffres clés (4)', icone: '🔢', navDefaut: '' },
  categories:  { nom: 'Catégories (tuiles néon)', icone: '🗂️', navDefaut: 'Catégories', note: 'Générées automatiquement à partir de vos annonces.' },
  vedettes:    { nom: 'Annonces à la une', icone: '⭐', navDefaut: '', note: 'Vos annonces marquées « vedette », complétées par les plus récentes.' },
  annonces:    { nom: 'Toutes les annonces', icone: '📋', navDefaut: 'Annonces', note: 'Liste complète avec recherche, filtres (nature, contrat, lieu) et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  histoire:    { nom: 'Notre histoire (photo + texte)', icone: '📖', navDefaut: 'À propos' },
  etapes:      { nom: 'Comment ça fonctionne (étapes)', icone: '🪜', navDefaut: '' },
  forfaits:    { nom: 'Forfaits / tarifs (3 cartes)', icone: '💳', navDefaut: 'Tarifs', note: 'Affichage seulement : le bouton mène à un lien de votre choix (contact, téléphone…).' },
  temoignages: { nom: 'Témoignages', icone: '💬', navDefaut: '' },
  galerie:     { nom: 'Bande de photos', icone: '🖼️', navDefaut: '' },
  faq:         { nom: 'Questions fréquentes', icone: '❓', navDefaut: 'FAQ' },
  contact:     { nom: 'Contact (formulaire)', icone: '✉️', navDefaut: 'Contact' },
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
    { k: 'titreAccent', label: 'Titre — mots en néon', t: 'text', max: 50 },
    { k: 'texte', label: 'Texte', t: 'area', max: 400 },
    { k: 'puces', label: 'Points forts (un par ligne, 6 maximum)', t: 'puces', max: 90, maxItems: 6 },
    { k: 'btnTexte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton 1 — lien', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'btn2Texte', label: 'Bouton 2 — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
    { k: 'formTitre', label: 'Titre du formulaire', t: 'text', max: 70 },
    { k: 'image', label: 'Photo d\'ambiance derrière le formulaire (facultatif)', t: 'img' },
  ],
  piliers: [
    { k: 'titre', label: 'Titre', t: 'text', max: 100 }, { k: 'sousTitre', label: 'Sous-titre', t: 'text', max: 120 }, { k: 'texte', label: 'Texte', t: 'area', max: 400 },
    { k: 'items', label: 'Cartes', t: 'liste', maxItems: 6, sub: [
      { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 220 },
    ] },
  ],
  chiffres: [{ k: 'items', label: 'Chiffres (4 maximum)', t: 'liste', maxItems: 4, sub: [
    { k: 'valeur', label: 'Valeur', t: 'text', max: 20 }, { k: 'label', label: 'Texte', t: 'text', max: 40 },
  ] }],
  categories: [...ENTETE],
  vedettes: [...ENTETE, { k: 'nombre', label: 'Nombre d\'annonces (3 à 12)', t: 'text', max: 2 }],
  annonces: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'vide', label: 'Message quand aucune annonce ne correspond', t: 'text', max: 120 }],
  histoire: [
    { k: 'titre', label: 'Titre', t: 'text', max: 80 }, { k: 'texte', label: 'Texte', t: 'area', max: 1200 },
    { k: 'image', label: 'Photo', t: 'img' }, { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ],
  etapes: [
    { k: 'titre', label: 'Titre', t: 'text', max: 80 }, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'image', label: 'Photo', t: 'img' },
    { k: 'items', label: 'Étapes', t: 'liste', maxItems: 6, sub: [{ k: 'titre', label: 'Titre', t: 'text', max: 70 }, { k: 'texte', label: 'Texte', t: 'area', max: 200 }] },
  ],
  forfaits: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'items', label: 'Forfaits', t: 'liste', maxItems: 3, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Nom', t: 'text', max: 50 }, { k: 'texte', label: 'Description', t: 'area', max: 200 },
    { k: 'prix', label: 'Prix ou mention (ex. À partir de 99 $)', t: 'text', max: 40 }, { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 30 }, { k: 'lien', label: 'Bouton — lien', t: 'lien' },
  ] }],
  temoignages: [...ENTETE, { k: 'items', label: 'Témoignages', t: 'liste', maxItems: 3, sub: [
    { k: 'texte', label: 'Témoignage', t: 'area', max: 400 }, { k: 'auteur', label: 'Auteur', t: 'text', max: 60 },
  ] }],
  galerie: [{ k: 'items', label: 'Photos (8 maximum)', t: 'liste', maxItems: 8, sub: [{ k: 'image', label: 'Photo', t: 'img' }] }],
  faq: [...ENTETE, { k: 'items', label: 'Questions', t: 'liste', maxItems: 10, sub: [{ k: 'q', label: 'Question', t: 'text', max: 160 }, { k: 'r', label: 'Réponse', t: 'area', max: 700 }] }],
  contact: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  entete: { texte: 'Réponse rapide à toutes vos demandes.' },
  hero: { titre: 'Le bon service,', titreAccent: 'au bon moment.', texte: 'Découvrez nos services et nos offres d\'emploi. Parcourez les annonces et écrivez-nous directement.', puces: ['Équipe qualifiée et expérimentée', 'Soumission gratuite et sans engagement', 'Réponse rapide à vos demandes', 'Nouveaux postes affichés régulièrement'], btnTexte: 'Voir les annonces', btnLien: '#annonces', btn2Texte: 'Nous écrire', btn2Lien: '#contact', formTitre: 'Demande rapide — réponse gratuite', image: '' },
  piliers: { titre: 'Nos services, nos emplois', sousTitre: 'Une seule équipe, plusieurs façons de vous aider', texte: 'Du dépannage à l\'emploi à temps plein : découvrez ce que nous offrons et rejoignez notre équipe.', items: [
    { icone: '🛠️', titre: 'Nos services', texte: 'Rénovation, entretien, réparation : notre équipe intervient chez vous.' },
    { icone: '💼', titre: 'Offres d\'emploi', texte: 'Postes à temps plein, à temps partiel, contrats et saisonniers.' },
    { icone: '🤝', titre: 'Contact direct', texte: 'Un formulaire simple pour nous joindre : nous répondons rapidement.' },
  ] },
  chiffres: { items: [{ valeur: '24 h', label: 'Délai de réponse moyen' }, { valeur: '100 %', label: 'Contact direct' }, { valeur: '0 $', label: 'Frais de soumission' }, { valeur: '7/7', label: 'Annonces consultables' }] },
  categories: { surtitre: '', titre: 'Explorez par catégorie' },
  vedettes: { surtitre: '', titre: 'Annonces à la une', nombre: '6' },
  annonces: { surtitre: '', titre: 'Toutes les annonces', texte: 'Filtrez par nature, type de contrat et lieu.', vide: 'Aucune annonce ne correspond.' },
  histoire: { titre: 'Notre histoire', texte: 'Nous sommes une équipe d\'ici : nous offrons des services de qualité et nous recrutons des talents pour grandir avec vous.\n\nPourquoi nous choisir :\n1. Une équipe qualifiée et expérimentée\n2. Des tarifs clairs, sans surprise\n3. Une réponse rapide à toutes vos demandes\n4. Des postes ouverts régulièrement', image: '', btnTexte: 'Nous contacter', btnLien: '#contact' },
  etapes: { titre: 'Comment ça fonctionne', texte: 'Trois étapes simples pour obtenir un service ou postuler.', image: '', items: [
    { titre: 'Parcourez nos annonces', texte: 'Filtrez par catégorie, nature, contrat et lieu.' },
    { titre: 'Ouvrez la fiche', texte: 'Consultez les détails, les photos et les conditions.' },
    { titre: 'Écrivez-nous', texte: 'Un formulaire rapide : nous vous répondons par courriel.' },
  ] },
  forfaits: { surtitre: '', titre: 'Forfaits et tarifs', texte: 'Des formules claires pour vos besoins.', items: [
    { icone: '🙂', titre: 'Essentiel', texte: 'Pour un besoin ponctuel.', prix: 'À partir de 99 $', btnTexte: 'Demander', lien: '#contact' },
    { icone: '⭐', titre: 'Avancé', texte: 'Pour un projet complet.', prix: 'À partir de 249 $', btnTexte: 'Demander', lien: '#contact' },
    { icone: '👑', titre: 'Entreprise', texte: 'Pour des besoins récurrents.', prix: 'Sur mesure', btnTexte: 'Nous écrire', lien: '#contact' },
  ] },
  temoignages: { surtitre: '', titre: 'Ils nous font confiance', items: [{ texte: 'Réponse rapide et service impeccable. Je recommande sans hésiter.', auteur: 'Un client satisfait' }] },
  galerie: { items: [] },
  faq: { surtitre: 'FAQ', titre: 'Vos questions', items: [
    { q: 'Comment demander un service ou postuler ?', r: 'Ouvrez l\'annonce et remplissez le formulaire : votre message nous est transmis directement par courriel.' },
    { q: 'Y a-t-il des frais pour demander une soumission ?', r: 'Non. Parcourir les annonces et nous écrire est gratuit.' },
    { q: 'Y a-t-il un paiement sur ce site ?', r: 'Non. Les annonces sont affichées à titre informatif : les ententes et les paiements se font directement avec nous.' },
  ] },
  contact: { surtitre: '', titre: 'Une question ? Écrivez-nous', texte: 'Notre équipe vous répond rapidement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigServices {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurSecondaire: string; couleurFond: string; couleurCarte: string; couleurTexte: string;
  police: 'geometrique' | 'moderne' | 'arrondie';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'Néo Services', couleurPrincipale: '#2f3bff', couleurSecondaire: '#22e0ff', couleurFond: '#05050a', couleurCarte: '#0d0e1a', couleurTexte: '#ffffff', police: 'geometrique' as const };

const IDS: string[] = [...SECTION_IDS];
const MASQUEES_PAR_DEFAUT = ['forfaits', 'temoignages', 'galerie'];

export function normaliserConfig(brut: any): ConfigServices {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigServices['police'] = c.police === 'moderne' || c.police === 'arrondie' || c.police === 'geometrique' ? c.police : d.police;

  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: !MASQUEES_PAR_DEFAUT.includes(id), label: '' }); });

  const contenu = {} as ConfigServices['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });
  const n = parseInt(String(contenu.vedettes.nombre), 10);
  contenu.vedettes.nombre = String(Number.isFinite(n) ? Math.min(12, Math.max(3, n)) : 6);

  const reseaux = {} as ConfigServices['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurSecondaire: couleur(c.couleurSecondaire, d.couleurSecondaire),
    couleurFond: couleur(c.couleurFond, d.couleurFond), couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}