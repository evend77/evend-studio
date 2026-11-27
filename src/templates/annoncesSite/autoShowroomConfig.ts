// src/templates/annoncesSite/autoShowroomConfig.ts
// e-Vend Studio — Configuration du template « Auto Showroom » : schéma des sections, valeurs par défaut,
// normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur du gestionnaire.

// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).
// Ici : seulement bornage de longueur + contrôle des liens/couleurs à l'affichage (React échappe déjà tout texte).
export const texte = (v: unknown, max = 200): string => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max) : '');
export const paragraphe = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const emoji = (v: unknown): string => texte(v, 6);
const dateIso = (v: unknown): string => { const t = texte(v, 30); return /^\d{4}-\d{2}-\d{2}/.test(t) && !Number.isNaN(new Date(t.replace(' ', 'T')).getTime()) ? t : ''; };
export const telephone = (v: unknown): string => { const t = texte(v, 25); return /^[0-9+()\-.\s]{4,25}$/.test(t) ? t : ''; };
export const courriel = (v: unknown): string => { const t = texte(v, 200).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? t : ''; };
export const couleur = (v: unknown, defaut: string): string => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toLowerCase() : defaut);
/** URL https uniquement (images, réseaux). Refuse javascript:, data:, http:… */
export function urlHttps(v: unknown): string {
  if (typeof v !== 'string') return '';
  const t = v.trim();
  if (!t || t.length > 600 || /\s/.test(t)) return '';
  try { const u = new URL(t); return u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.') ? u.href : ''; } catch { return ''; }
}
export const telHref = (t: string) => { const d = t.replace(/[^0-9+]/g, ''); return d ? `tel:${d}` : ''; };
/** Lien de bouton : #section, https://, tel:, mailto: — sinon null. */
export function lien(v: unknown, idsValides: string[]): { type: 'ancre' | 'externe' | 'tel' | 'mail'; valeur: string } | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  if (t.startsWith('#')) { const id = t.slice(1); return idsValides.includes(id) ? { type: 'ancre', valeur: id } : null; }
  if (/^tel:/i.test(t)) { const n = t.slice(4).replace(/[^0-9+]/g, ''); return n.length >= 4 ? { type: 'tel', valeur: `tel:${n}` } : null; }
  if (/^mailto:/i.test(t)) { const m = courriel(t.slice(7)); return m ? { type: 'mail', valeur: `mailto:${m}` } : null; }
  const u = urlHttps(t); return u ? { type: 'externe', valeur: u } : null;
}

export type TypeChamp = 'text' | 'area' | 'img' | 'lien' | 'date' | 'emoji' | 'liste' | 'puces';
export interface Champ { k: string; label: string; t: TypeChamp; max?: number; aide?: string; sub?: Champ[]; maxItems?: number; }

export const SECTION_IDS = ['hero', 'etapes', 'apropos', 'vehicules', 'avantages', 'offres', 'temoignages', 'promo', 'faq', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string }> = {
  hero:        { nom: 'Bannière d\'accueil',     icone: '🏁', navDefaut: 'Accueil' },
  etapes:      { nom: 'Comment ça marche',       icone: '🧭', navDefaut: 'Comment ça marche' },
  apropos:     { nom: 'À propos',                icone: '🏢', navDefaut: 'À propos' },
  vehicules:   { nom: 'Véhicules (vos annonces)', icone: '🚗', navDefaut: 'Nos véhicules', note: 'Affiche vos annonces de « Mes annonces » avec recherche et filtres.' },
  avantages:   { nom: 'Nos avantages',           icone: '⭐', navDefaut: 'Avantages' },
  offres:      { nom: 'Forfaits / services',     icone: '💳', navDefaut: 'Services' },
  temoignages: { nom: 'Témoignages',             icone: '💬', navDefaut: 'Avis' },
  promo:       { nom: 'Bandeau promotion',       icone: '🎁', navDefaut: 'Promotion' },
  faq:         { nom: 'Questions fréquentes',    icone: '❓', navDefaut: 'FAQ' },
  contact:     { nom: 'Contact (bas de page)',   icone: '📞', navDefaut: 'Contact' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 140 },
  { k: 'texte', label: 'Texte', t: 'area', max: 600 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  hero: [
    { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
    { k: 'titre', label: 'Grand titre', t: 'text', max: 140 },
    { k: 'texte', label: 'Texte', t: 'area', max: 400 },
    { k: 'image', label: 'Photo principale', t: 'img', aide: 'Format paysage recommandé. Une photo de votre meilleur véhicule.' },
    { k: 'btn1Texte', label: 'Bouton 1 — texte', t: 'text', max: 40 },
    { k: 'btn1Lien', label: 'Bouton 1 — lien', t: 'lien', aide: 'Ex. #vehicules, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'btn2Texte', label: 'Bouton 2 — texte', t: 'text', max: 40 },
    { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  etapes: [...ENTETE, { k: 'items', label: 'Étapes', t: 'liste', maxItems: 6, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 250 },
  ] }],
  apropos: [...ENTETE, { k: 'image', label: 'Photo', t: 'img' }, { k: 'points', label: 'Points forts (un par ligne)', t: 'puces', maxItems: 8, max: 90 },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' }],
  vehicules: [...ENTETE],
  avantages: [...ENTETE, { k: 'image', label: 'Photo', t: 'img' }, { k: 'items', label: 'Avantages', t: 'liste', maxItems: 6, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 300 },
  ] }],
  offres: [...ENTETE, { k: 'items', label: 'Forfaits / services', t: 'liste', maxItems: 6, sub: [
    { k: 'etiquette', label: 'Étiquette (ex. Populaire)', t: 'text', max: 24 }, { k: 'nom', label: 'Nom', t: 'text', max: 50 }, { k: 'prix', label: 'Prix ou texte (ex. Dès 99 $)', t: 'text', max: 40 },
    { k: 'texte', label: 'Description', t: 'area', max: 200 }, { k: 'lignes', label: 'Détails (un par ligne : Nom : valeur)', t: 'puces', maxItems: 8, max: 80 },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ] }],
  temoignages: [...ENTETE, { k: 'items', label: 'Témoignages', t: 'liste', maxItems: 8, sub: [
    { k: 'nom', label: 'Nom', t: 'text', max: 60 }, { k: 'photo', label: 'Photo', t: 'img' }, { k: 'texte', label: 'Témoignage', t: 'area', max: 500 }, { k: 'date', label: 'Date (texte libre)', t: 'text', max: 30 },
  ] }],
  promo: [
    { k: 'titre', label: 'Titre', t: 'text', max: 140 }, { k: 'texte', label: 'Texte sous le compte à rebours', t: 'area', max: 300 },
    { k: 'dateFin', label: 'Date de fin (AAAA-MM-JJ) — laissez vide pour sans compte à rebours', t: 'date' },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ],
  faq: [...ENTETE, { k: 'items', label: 'Questions', t: 'liste', maxItems: 12, sub: [
    { k: 'q', label: 'Question', t: 'text', max: 160 }, { k: 'r', label: 'Réponse', t: 'area', max: 700 },
  ] }],
  contact: [{ k: 'titre', label: 'Titre', t: 'text', max: 140 }, { k: 'texte', label: 'Texte', t: 'area', max: 400 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
const P = (n: number) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  hero: { surtitre: 'VÉHICULES D\'OCCASION', titre: 'Trouvez le véhicule qu\'il vous faut, en quelques minutes !', texte: 'Parcourez nos annonces, comparez et écrivez-nous directement. Simple, rapide, sans paiement en ligne.', image: P(358070), btn1Texte: 'Voir les véhicules', btn1Lien: '#vehicules', btn2Texte: 'Nous joindre', btn2Lien: '#contact' },
  etapes: { surtitre: 'COMMENT ÇA MARCHE', titre: 'Acheter n\'a jamais été aussi simple', texte: 'Trouvez votre prochain véhicule en quatre étapes, sans tracas.', items: [
    { icone: '🔍', titre: 'Parcourez', texte: 'Consultez toutes nos annonces avec photos et fiches détaillées.' },
    { icone: '⚖️', titre: 'Comparez', texte: 'Filtrez par marque, année, kilométrage ou prix.' },
    { icone: '✉️', titre: 'Écrivez-nous', texte: 'Posez vos questions depuis l\'annonce : nous répondons rapidement.' },
    { icone: '🔑', titre: 'Essayez et repartez', texte: 'Prenez rendez-vous, faites l\'essai routier et concluez l\'entente.' },
  ] },
  apropos: { surtitre: 'BIENVENUE', titre: 'Votre partenaire de confiance pour l\'auto', texte: 'Depuis plusieurs années, nous sélectionnons des véhicules inspectés et honnêtement décrits. Notre priorité : une transaction claire et sans surprise.', image: P(170811), points: ['Véhicules inspectés', 'Historique transparent', 'Accompagnement personnalisé'], btnTexte: 'En savoir plus', btnLien: '#contact' },
  vehicules: { surtitre: 'NOS VÉHICULES', titre: 'Découvrez notre sélection', texte: 'Tous nos véhicules sont affichés avec photos et caractéristiques. Cliquez sur une annonce pour nous écrire.' },
  avantages: { surtitre: 'POURQUOI NOUS', titre: 'Un service pensé pour vous', texte: 'Nous rendons l\'achat d\'un véhicule plus simple et plus transparent.', image: P(210019), items: [
    { icone: '🛡️', titre: 'Sécuritaire', texte: 'Chaque véhicule est vérifié avant d\'être affiché.' },
    { icone: '⚡', titre: 'Rapide', texte: 'Une question ? Écrivez depuis l\'annonce, réponse sous 24 h.' },
  ] },
  offres: { surtitre: 'SERVICES', titre: 'Des services flexibles', texte: 'Choisissez ce qui vous convient.', items: [
    { etiquette: '', nom: 'Inspection', prix: 'Dès 99 $', texte: 'Inspection complète avant achat.', lignes: ['Points vérifiés : 120', 'Rapport : écrit', 'Délai : 24 h'], btnTexte: 'Nous écrire', btnLien: '#contact' },
    { etiquette: 'Populaire', nom: 'Financement', prix: 'Sur demande', texte: 'Nous vous aidons à trouver la meilleure option.', lignes: ['Réponse : rapide', 'Mise de fonds : flexible', 'Crédit : tous profils'], btnTexte: 'Nous écrire', btnLien: '#contact' },
    { etiquette: '', nom: 'Reprise', prix: 'Évaluation gratuite', texte: 'Faites évaluer votre véhicule actuel.', lignes: ['Évaluation : gratuite', 'Délai : 48 h', 'Paiement : comptant'], btnTexte: 'Nous écrire', btnLien: '#contact' },
  ] },
  temoignages: { surtitre: 'TÉMOIGNAGES', titre: 'Ce que disent nos clients', texte: '', items: [
    { nom: 'Marc-André T.', photo: '', texte: 'Service impeccable ! Le véhicule était exactement comme décrit. Je recommande sans hésiter.', date: 'Mars 2026' },
    { nom: 'Sophie L.', photo: '', texte: 'Réponse rapide, aucune pression, et un excellent suivi après l\'achat.', date: 'Janvier 2026' },
  ] },
  promo: { titre: 'Profitez de notre offre spéciale de saison', texte: 'Mentionnez le code SAISON lors de votre visite.', dateFin: '', btnTexte: 'Nous joindre', btnLien: '#contact' },
  faq: { surtitre: 'FAQ', titre: 'Vos questions, nos réponses', texte: 'Une autre question ? Contactez-nous, nous répondrons avec plaisir.', items: [
    { q: 'Les véhicules sont-ils inspectés ?', r: 'Oui, chaque véhicule est vérifié avant d\'être affiché. Le rapport est disponible sur demande.' },
    { q: 'Puis-je faire un essai routier ?', r: 'Bien sûr. Écrivez-nous depuis l\'annonce pour fixer un rendez-vous.' },
    { q: 'Acceptez-vous les reprises ?', r: 'Oui, nous évaluons votre véhicule actuel gratuitement.' },
    { q: 'Y a-t-il un paiement en ligne ?', r: 'Non. Ce site affiche les annonces : l\'entente se conclut directement avec nous.' },
  ] },
  contact: { titre: 'Une question ? Parlons-en !', texte: 'Écrivez-nous depuis une annonce ou joignez-nous directement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigShowroom {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurAccent: string; couleurSombre: string; couleurFond: string;
  police: 'arrondie' | 'moderne' | 'classique';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<'facebook' | 'instagram' | 'youtube' | 'twitter' | 'tiktok' | 'linkedin', string>;
  piedTexte: string;
  afficherPropulse: boolean;   // « Propulsé par e-Vend Studio » dans le pied de page
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}
export const RESEAUX = ['facebook', 'instagram', 'youtube', 'twitter', 'tiktok', 'linkedin'] as const;

export const DEFAUTS_GLOBAUX = { nomSite: 'Auto Showroom', logoUrl: '', couleurPrincipale: '#f15a22', couleurAccent: '#5b3fc4', couleurSombre: '#2f3033', couleurFond: '#f5f5f5', police: 'arrondie' as const, telephone: '', courriel: '', adresse: '', piedTexte: '' };

// ─── Normalisation : toute valeur est assainie selon son type ──────────────────────
export function normChamp(raw: unknown, ch: Champ, defaut: any, idsLiens: string[] = [...SECTION_IDS]): any {
  const brut = raw === undefined ? defaut : raw;
  switch (ch.t) {
    case 'text':  return texte(brut, ch.max || 200);
    case 'area':  return paragraphe(brut, ch.max || 1000);
    case 'img':   return urlHttps(brut);
    case 'emoji': return emoji(brut);
    case 'date':  return dateIso(brut);
    case 'lien':  { const l = lien(brut, idsLiens); return l ? (l.type === 'ancre' ? `#${l.valeur}` : l.valeur) : ''; }
    case 'puces': { const a = Array.isArray(brut) ? brut : (typeof brut === 'string' ? brut.split('\n') : []); return a.map((x) => texte(x, ch.max || 120)).filter(Boolean).slice(0, ch.maxItems || 10); }
    case 'liste': {
      const a = Array.isArray(brut) ? brut : [];
      return a.slice(0, ch.maxItems || 8).map((it) => { const o: Record<string, any> = {}; (ch.sub || []).forEach((s) => { o[s.k] = normChamp(it && typeof it === 'object' ? (it as any)[s.k] : undefined, s, s.t === 'liste' || s.t === 'puces' ? [] : '', idsLiens); }); return o; })
        .filter((o) => Object.values(o).some((v) => (Array.isArray(v) ? v.length : !!v)));
    }
  }
}

export function normaliserConfig(brut: any): ConfigShowroom {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigShowroom['police'] = c.police === 'moderne' || c.police === 'classique' || c.police === 'arrondie' ? c.police : d.police;

  // Sections : ordre et visibilité (ids connus seulement, sans doublon ; les manquantes s'ajoutent à la fin)
  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (SECTION_IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: true, label: '' }); });

  const contenu = {} as ConfigShowroom['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k]); });
    contenu[id] = o;
  });

  const reseaux = {} as ConfigShowroom['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 60) || d.nomSite,
    logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurAccent: couleur(c.couleurAccent, d.couleurAccent),
    couleurSombre: couleur(c.couleurSombre, d.couleurSombre), couleurFond: couleur(c.couleurFond, d.couleurFond),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200), afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}