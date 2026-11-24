// CHEMIN : src/templates/TemplateBoutiqueSakura.tsx
// e-Vend Studio — Template Simplisse Sakura (papeterie et créativité : fond rose pâle, corail, titres manuscrits, hero centré, lignes ondulées, bande défilante à motif d'écailles)
// Rendu public — lit config.sakura + produits depuis l'API
// Pages : Accueil · Nos produits · Fiche produit · À propos · Blog · FAQ · Contact
// Compte acheteur + panier/caisse/commandes (AppAcheteurBoutique) · Add-ons : Produits personnalisés, Infolettre, Prix par palier, Vérificateur d'âge, Analytique, App installable
// 100% mobile responsive

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import AppAcheteurBoutique from '../AppAcheteurBoutique';   // espace acheteur (panier, caisse, commandes) partagé avec Premium
import useBoutiqueAnalytique from '../hooks/useBoutiqueAnalytique';   // add-on « Analytique » : compte les pages vues (après consentement du visiteur)
import BoutiqueBoutonInstallerApp from '../components/BoutiqueBoutonInstallerApp';   // add-on « App installable » : bouton « Installer l'app » (mobile)
import BoutiqueInfolettre from '../components/BoutiqueInfolettre';   // add-on « Infolettre » : rangée d'inscription dans le pied de page
import BoutiquePersonnalisation, { PersoRef, ThemePerso } from '../components/BoutiquePersonnalisation';   // add-on « Produits personnalisés » : champs + aperçu sur la page produit
import BoutiqueVerificateurAge from '../components/BoutiqueVerificateurAge';   // add-on « Vérificateur d'âge » : fenêtre bloquante à l'arrivée
import PaliersProduitBoutique from '../pages/boutique/PaliersProduitBoutique';   // add-on « Prix par palier » : tableau de la fiche produit
import { ba, ajouterAuPanier as ajouterAuPanierServeur, messageAcheteur, PROVINCES } from '../pages/boutique/boutiqueAcheteurApi';
import FaireOffreBoutique from '../pages/boutique/FaireOffreBoutique';   // add-on « Faire une offre » : bloc de la fiche produit
import BlocEnchereBoutique from '../pages/boutique/BlocEnchereBoutique';   // add-on « Enchères » : bloc de la fiche produit
import QuestionsProduitBoutique from '../pages/boutique/QuestionsProduitBoutique';   // add-on « Questions sur le produit » : bloc de la fiche produit
import AvisProduitBoutique, { useAvisProduit, EtoilesAvis } from '../pages/boutique/AvisProduitBoutique';   // add-on « Avis clients » : avis publiés de la fiche produit
import BoutiqueParutionCountdown, { useConfigParution, formaterDateParution } from '../components/BoutiqueParutionCountdown';   // add-on « Parution future » : compte à rebours
import OffreCompteur from './multivendeur/MVOffre';   // add-on « Offres du jour » : compte à rebours (heure du serveur)
import { BoutiqueSouhaitBouton, BoutiqueSouhaitCarte, BoutiqueSouhaitProduit, BoutiqueSouhaitsAcces, BoutiqueFavorisToast } from '../components/BoutiqueFavoris';   // add-on « Favoris » : cœurs, icône d'en-tête, notifications

// ─── Types (miroir de ConfigMesPagesSakura) ────────────────────────────────
interface SectionPage  { id: string; actif: boolean; ordre: number; label: string; icone: string; }
interface ConfigHero   { titre: string; sousTitre: string; boutonLabel: string; boutonLien: string; photo: string; couleurFond: string; couleurTitre: string; couleurBouton: string; style: 'centre'|'gauche'|'image-fond'; }
interface ConfigBanniere { defilant?: boolean; actif: boolean; texte: string; couleurFond: string; couleurTexte: string; lien: string; labelLien: string; }
interface ConfigFooter {
  nomBoutique: string; slogan: string; couleurFond: string; couleurTexte: string; afficherPropulse: boolean;
  images?: string[];   // bande d'images au-dessus du pied de page (Config → Pied de page)
  reseaux: { facebook:string; instagram:string; tiktok:string; twitter:string; youtube:string; linkedin:string; pinterest:string; };
  colonnes: { titre1:string; liens1:string; titre2:string; liens2:string; titre3:string; liens3:string; };
  politiques: { afficherConditions:boolean; afficherConfidentialite:boolean; afficherRetours:boolean; afficherLivraison:boolean; afficherMentions?:boolean; afficherCoordonnees?:boolean; };
}
interface ConfigAccueil {
  hero: ConfigHero; banniere: ConfigBanniere; sections: SectionPage[];
  couleurPrimaire: string; couleurSecondaire: string; couleurFondPage: string; couleurTexte: string; police: string;
  mode?: 'sombre' | 'clair'; afficherBascule?: boolean; afficherRemonter?: boolean;
  temoignages?: { titre?: string; texte: string; auteur: string; note: number }[];
  avantages?: { ico: string; titre: string; desc: string }[];
  // Sections propres à Sakura (toutes facultatives, saisies par le gestionnaire ; rien ne s'affiche tant qu'elles sont vides)
  couleurAccent?: string; couleurCarte?: string; seuilStock?: number | string;
  entete?: any; ticker?: any; diaporama?: any[]; vedette?: any; nouveautes?: any; selection?: any; bandeaux?: any[];
  presentation?: any; tuiles?: any[]; tuilesDisposition?: string; tuiles2?: any[]; tuiles2Disposition?: string; focus?: any;
  communaute?: any; chercheur?: any; comparatif?: any; lateral?: any; bandepromo?: any; video?: any; parcourir?: any; onde?: any; grostexte?: any; vitrine?: any; trouveur?: any; galerie?: any; grandnom?: any; collections?: any; temoignagesPhotos?: any; temoignagesSousTitre?: string; temoignagesPhoto?: string; temoignagesFantome?: string; chiffres?: any; temoignagesTitre?: string; cercles?: any; blogApercu?: any; decompte?: any; marques?: any; etapes?: any; accordeon?: any; accordeon2?: any; pastilles?: any; couleurViolet?: string;
}
interface ConfigCatalogue {
  titre: string; sousTitre: string; colonnes: 2|3|4;
  afficherFiltres: boolean; afficherRecherche: boolean; afficherPrix: boolean; afficherStock: boolean;
  hero: ConfigHero; banniere: ConfigBanniere; sections: SectionPage[];
}
interface ConfigFaq     { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; items: { question:string; reponse:string }[]; }
interface ConfigBlog    { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; afficherAuteur: boolean; afficherDate: boolean; colonnes: 2|3; }
interface ConfigContact { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; adresse: string; telephone: string; courriel: string; afficherCarte: boolean; urlCarte: string; }
interface ConfigSakura { accueil: ConfigAccueil; catalogue: ConfigCatalogue; faq: ConfigFaq; blog: ConfigBlog; contact: ConfigContact; footer: ConfigFooter; ficheProduit?: ConfigFicheProduit; }

interface ConfigFicheProduit {
  layout:              'image-gauche' | 'image-droite' | 'image-haut';
  photosMiniatures:    'dessous' | 'gauche';
  descriptionPosition: 'droite' | 'bas' | 'onglets';
  descriptionTronquee: boolean;
  afficherBreadcrumb:  boolean;
  afficherStock:       boolean;
  afficherCategorie:   boolean;
  afficherSku:         boolean;
  afficherRabaisPct:   boolean;
  afficherQte:         boolean;
  boutonLabel:         string;
  boutonCouleur:       string;
  afficherReassurance: boolean;
  reassuranceItems:    { icone: string; texte: string }[];
  afficherPartage:     boolean;
  afficherSimilaires:  boolean;
  similairesNombre:    2 | 4 | 6;
  similairesTitre:     string;
}

interface ProduitCat {
  id: number; titre: string; prix: number; prix_promo?: number; photo_principale?: string; emoji?: string;
  photos?: string[]; description?: string; stock?: number; categorie?: string; sku?: string;
  variantes?: { nom: string; valeurs?: string[]; prix?: number|string|null; stock?: number|string|null }[];   // démo : {nom, valeurs[]} ; vraies annonces : liste plate {nom, prix, stock}
  paliers?: { qte_min:number; type:'pourcentage'|'fixe'; valeur:number; variante:string|null }[];   // add-on « Prix par palier » : le serveur n'envoie rien si l'add-on est inactif
  offre_fin?: string | null;   // add-on « Offres du jour » : fin de l'offre en cours (le serveur décide du prix)
  date_parution?: string | null;   // add-on « Parution future » : date d'ouverture de la vente tant qu'elle n'est pas passée
  enchere?: { fin: string; mise: number; nb_mises: number; decalage?: number } | null;   // add-on « Enchères » : enchère en cours sur ce produit
}

interface AcheteurUser {
  id: number; prenom: string; nom: string; email: string;
  telephone?: string; adresse?: string; ville?: string; province?: string; code_postal?: string;
}

interface ArticleBlog {
  id: number; titre: string; slug: string; resume?: string; photo?: string;
  auteur?: string; date_publication?: string; categorie?: string;
  contenu?: string; tags?: string[]; vues?: number;
}

// ─── Config par défaut (fallback si la config est vide) ──────────────────────────────────
const CP = '#e0525c';
const CP_FONCE = '#b93d48';   // rose assez foncé pour du texte blanc : utilisé pour les écrans partagés (panier, caisse, compte)
const HERO_DEF: ConfigHero = { titre: 'Créez, plié après plié', sousTitre: 'Découvrez notre sélection de produits.', boutonLabel: 'Voir la boutique', boutonLien: '/catalogue', photo: '', couleurFond: '#f6b6b0', couleurTitre: '#4a2b2b', couleurBouton: '#4a2b2b', style: 'image-fond' };
const BAN_DEF: ConfigBanniere = { defilant: false, actif: false, texte: '', couleurFond: CP, couleurTexte: '#ffffff', lien: '', labelLien: 'En savoir plus' };
const CFG_DEF: ConfigSakura = {
  accueil: { hero: HERO_DEF, banniere: BAN_DEF, sections: [
    { id:'banniere', label:'Bannière', icone:'📢', actif:true, ordre:1 },
    { id:'hero', label:'Grande photo (diaporama)', icone:'🖼', actif:true, ordre:2 },
    { id:'vedette', label:'Meilleurs vendeurs (rangée)', icone:'⭐', actif:true, ordre:3 },
    { id:'categories', label:'Collections (carrousel)', icone:'🗂', actif:false, ordre:4 },
    { id:'presentation', label:'À propos (texte + photo)', icone:'✨', actif:true, ordre:5 },
    { id:'marques', label:'Bande de marques', icone:'🏷', actif:true, ordre:6 },
    { id:'ticker', label:'Bandeau défilant (simple)', icone:'➡️', actif:true, ordre:7 },
    { id:'temoignages', label:'Avis (cartes)', icone:'💬', actif:true, ordre:8 },
    { id:'blog-apercu', label:'Aperçu du blogue', icone:'📝', actif:true, ordre:9 },
    { id:'avantages', label:'Engagements (colonnes)', icone:'✅', actif:true, ordre:10 },
    { id:'grostexte', label:'Texte centré (avec photos)', icone:'🔤', actif:false, ordre:11 },
    { id:'tuiles', label:'Cartes promo (photo + offre)', icone:'🃏', actif:false, ordre:12 },
    { id:'decompte', label:'Compte à rebours', icone:'⏱', actif:false, ordre:13 },
    { id:'bandepromo', label:"Bandeau d'offre (corail)", icone:'🎀', actif:false, ordre:14 },
    { id:'comparatif', label:'Tableau comparatif', icone:'📊', actif:false, ordre:15 },
    { id:'bandeau', label:'Grandes bannières (photo + texte)', icone:'🎯', actif:false, ordre:16 },
    { id:'video', label:'Vidéo (YouTube ou Vimeo)', icone:'🎬', actif:false, ordre:17 },
    { id:'nouveautes', label:'Nouveautés (rangée)', icone:'🆕', actif:false, ordre:18 },
    { id:'parcourir', label:'Magasiner par catégorie (liste)', icone:'🛍', actif:false, ordre:19 },
    { id:'onde', label:'Texte ondulé qui défile', icone:'🌊', actif:false, ordre:20 },
    { id:'vitrine', label:'Vitrine produit (photo + points)', icone:'📍', actif:false, ordre:21 },
    { id:'trouveur', label:'Question avec réponses A, B, C', icone:'❓', actif:false, ordre:22 },
    { id:'galerie', label:'Galerie de photos inclinées', icone:'📷', actif:false, ordre:23 },
    { id:'pastilles', label:'Pastilles de garanties', icone:'🔰', actif:false, ordre:24 },
    { id:'grandnom', label:'Grand nom de la boutique', icone:'🔠', actif:false, ordre:25 },
    { id:'focus', label:'Mise en avant (image + produits)', icone:'🔥', actif:false, ordre:26 },
    { id:'etapes', label:'Points forts numérotés + image', icone:'🔢', actif:false, ordre:27 },
    { id:'accordeon', label:'Questions / réponses (bloc 1)', icone:'➕', actif:false, ordre:28 },
    { id:'accordeon2', label:'Questions / réponses (bloc 2)', icone:'➖', actif:false, ordre:29 },
    { id:'selection', label:'Notre sélection (rangée)', icone:'💎', actif:false, ordre:30 },
    { id:'promo', label:'Promos', icone:'💲', actif:false, ordre:31 },
    { id:'newsletter', label:'Infolettre', icone:'📧', actif:false, ordre:32 }
  ], couleurPrimaire:CP, couleurSecondaire:'#6b4545', couleurFondPage:'', couleurTexte:'', police:'Kalam', mode:'clair', afficherBascule:false, afficherRemonter:true },
  catalogue: { titre:'Nos produits', sousTitre:'Tous nos produits disponibles.', colonnes:3, afficherFiltres:true, afficherRecherche:true, afficherPrix:true, afficherStock:true, banniere:BAN_DEF, hero:HERO_DEF, sections:[] },
  faq: { titre:'Questions fréquentes', sousTitre:'Trouvez rapidement les réponses à vos questions.', hero:HERO_DEF, banniere:BAN_DEF, items:[] },
  blog: { titre:'Notre blogue', sousTitre:'Actualités, conseils et nouveautés.', hero:HERO_DEF, banniere:BAN_DEF, afficherAuteur:true, afficherDate:true, colonnes:3 },
  contact: { titre:'Nous contacter', sousTitre:'Une question ? Nous sommes là pour vous.', hero:HERO_DEF, banniere:BAN_DEF, adresse:'', telephone:'', courriel:'', afficherCarte:false, urlCarte:'' },
  footer: { nomBoutique:'Ma Boutique Sakura', slogan:'', couleurFond:'#e0525c', couleurTexte:'#ffffff', afficherPropulse:true, images:[],
    reseaux:{ facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes:{ titre1:'Boutique', liens1:'Accueil\nNos produits\nÀ propos\nBlog\nFAQ', titre2:'Aide', liens2:'Contact', titre3:'', liens3:'' },
    politiques:{ afficherConditions:true, afficherConfidentialite:true, afficherRetours:true, afficherLivraison:true, afficherMentions:true, afficherCoordonnees:true },
  },
};

// Exemples de FAQ : affichés seulement en démonstration (jamais de promesse inventée sur une vraie boutique)
const FAQ_DEMO = [
  { question: 'Comment fonctionne la commande ?', reponse: 'Ajoutez vos produits au panier, puis passez à la caisse. Vous recevez une confirmation par courriel.' },
  { question: 'Puis-je précommander une nouveauté ?', reponse: 'Ceci est un exemple de démonstration : votre boutique indique ici ses propres règles de précommande.' },
  { question: 'Offrez-vous des échantillons ?', reponse: 'Ceci est un exemple de démonstration : votre boutique indique ici ses propres services.' },
];

// Exemples de démonstration de la page À propos : affichés tant que le gestionnaire n'a rien saisi (Config Mes pages → À propos)
const APROPOS_DEMO = {
  accroche: "Le sakura vous attend.",
  description: "Exemple de démonstration : présentez ici votre boutique, votre sélection, vos coups de cœur et vos services. Ce texte est remplacé dès que vous écrivez le vôtre (Config Mes pages → À propos).",
  valeurs: [
    { ico: '🌸', titre: 'Sélection choisie avec soin', desc: 'Exemple : décrivez ici comment vous choisissez vos produits.' },
    { ico: '💬', titre: 'Conseils', desc: 'Exemple : expliquez comment vous aidez à trouver le bon produit.' },
    { ico: '🤝', titre: 'Service après-vente', desc: 'Exemple : parlez de votre politique de retour.' },
  ],
  chiffres: [{ nb: '10', label: "Ans d'expérience" }, { nb: '500', label: 'Produits en magasin' }, { nb: '30', label: 'Marques' }],
  equipe: [{ prenom: 'Marie', poste: 'Conseils et essais', photo: '' }, { prenom: 'Louis', poste: 'Inventaire et commandes', photo: '' }, { prenom: 'Sarah', poste: 'Service à la clientèle', photo: '' }],
  visite: { titre: 'Passez nous voir', texte: "Exemple de démonstration : indiquez ici vos heures d'ouverture et comment vous trouver.", adresse: '1234 rue Exemple', horaires: 'Exemple : lundi au samedi, 10 h à 18 h' },
};

const API_BASE = '/api';

// ── Polices proposées (liste fermée : jamais une valeur libre dans le CSS) ──
export const POLICES_SK: { valeur: string; label: string; css: string; google: string; poids?: number }[] = [
  { valeur: 'Kalam',         label: 'Manuscrite (Kalam)',        css: "'Kalam', 'Comic Sans MS', cursive",     google: 'Kalam:wght@400;700', poids: 700 },
  { valeur: 'Caveat',        label: 'Manuscrite fine (Caveat)',  css: "'Caveat', 'Comic Sans MS', cursive",    google: 'Caveat:wght@500;700', poids: 700 },
  { valeur: 'Patrick Hand',  label: 'Écriture ronde (Patrick Hand)', css: "'Patrick Hand', 'Comic Sans MS', cursive", google: 'Patrick+Hand', poids: 400 },
  { valeur: 'Nunito',        label: 'Douce (Nunito)',            css: "'Nunito', 'Inter', sans-serif",         google: 'Nunito:wght@500;800', poids: 800 },
  { valeur: 'Fraunces',      label: 'Chaleureuse à empattements (Fraunces)', css: "'Fraunces', Georgia, serif", google: 'Fraunces:wght@500;700', poids: 600 },
  { valeur: 'Inter',         label: 'Sobre (Inter)',             css: "'Inter', -apple-system, sans-serif",    google: 'Inter:wght@500;700', poids: 600 },
];
export const policeSK = (p: any) => POLICES_SK.find(x => x.valeur === String(p == null ? '' : p)) || POLICES_SK[0];
const hexOk = (v: any, def: string) => (/^#[0-9a-f]{3,8}$/i.test(String(v == null ? '' : v).trim()) ? String(v).trim() : def);

// ── Thèmes : clair par défaut, sombre au choix du gestionnaire (le visiteur peut basculer si c'est permis) ──
type Theme = { fond: string; s: string; s2: string; b: string; t: string; t2: string; d: string; err: string; errBg: string };
const THEMES: Record<'sombre' | 'clair', Theme> = {
  sombre: { fond: '#2a1518', s: '#3a1f23', s2: '#4a2830', b: '#7a3f48', t: '#ffe9e6', t2: '#f5c4bf', d: '#c99a98', err: '#ff9a9a', errBg: 'rgba(255,77,94,0.16)' },
  clair:  { fond: '#fbe6e4', s: '#ffffff', s2: '#fff3f1', b: '#f2b3ad', t: '#4a2b2b', t2: '#6b4545', d: '#8f6b6b', err: '#b4234a', errBg: '#ffe3e8' },
};
const THEME_CLAIR_PERSO: ThemePerso = { fond: '#f9fafb', texte: '#1a1a1a', doux: '#6b7280', bord: '#e5e7eb' };
const THEME_SOMBRE_PERSO: ThemePerso = { fond: '#1a1a1a', texte: '#f5f5f5', doux: '#a0a0a0', bord: 'rgba(255,255,255,0.16)' };

// ── Menu du haut configurable : liens simples, listes (sous-menu) et méga-menus (colonnes + carte promo) ──
type LienMenu = { label: string; type: 'page' | 'categorie' | 'url'; cible: string };
type ColonneMenu = { titre: string; liens: LienMenu[] };
type EntreeMenu = { id: string; label: string; style: 'lien' | 'liste' | 'mega'; type: 'page' | 'categorie' | 'url'; cible: string; liens: LienMenu[]; colonnes: ColonneMenu[]; intro: string; promo: { image: string; titre: string; bouton: string; type: 'page' | 'categorie' | 'url'; cible: string } | null };
const TYPES_LIEN = ['page', 'categorie', 'url'];
const typeLien = (v: any): 'page' | 'categorie' | 'url' => (TYPES_LIEN.includes(v) ? v : 'page');
const lienMenuSur = (x: any): LienMenu | null => {
  if (!x || typeof x !== 'object') return null;
  const label = nettoyerEnvoi(x.label, 60); if (!label) return null;
  return { label, type: typeLien(x.type), cible: nettoyerEnvoi(x.cible, 300) };
};
const entreesMenuSures = (brut: any): EntreeMenu[] => {
  if (!Array.isArray(brut)) return [];
  const out: EntreeMenu[] = [];
  brut.slice(0, 8).forEach((e: any, i: number) => {
    if (!e || typeof e !== 'object' || e.actif === false) return;
    const label = nettoyerEnvoi(e.label, 40); if (!label) return;
    const style: 'lien' | 'liste' | 'mega' = e.style === 'liste' || e.style === 'mega' ? e.style : 'lien';
    const liens = (Array.isArray(e.liens) ? e.liens : []).slice(0, 12).map(lienMenuSur).filter(Boolean) as LienMenu[];
    const colonnes = (Array.isArray(e.colonnes) ? e.colonnes : []).slice(0, 4).map((c: any) => ({ titre: nettoyerEnvoi(c && c.titre, 40), liens: (Array.isArray(c && c.liens) ? c.liens : []).slice(0, 10).map(lienMenuSur).filter(Boolean) as LienMenu[] })).filter((c: ColonneMenu) => c.titre || c.liens.length);
    const p = e.promo && typeof e.promo === 'object' ? e.promo : null;
    const promo = p && (urlSure(p.image) || nettoyerEnvoi(p.titre, 80)) ? { image: urlSure(p.image), titre: nettoyerEnvoi(p.titre, 80), bouton: nettoyerEnvoi(p.bouton, 30), type: typeLien(p.type), cible: nettoyerEnvoi(p.cible, 300) } : null;
    out.push({ id: 'm' + i, label, style, type: typeLien(e.type), cible: nettoyerEnvoi(e.cible, 300), liens, colonnes, intro: nettoyerEnvoi(e.intro, 200), promo });
  });
  return out;
};

// ── Inscription acheteur : défauts, fusionnés avec config.sakura.inscription si elle existe ──
type ChampInsc = { id:string; type:'text'|'email'|'tel'|'select'|'textarea'|'checkbox'; label:string; placeholder?:string; options?:string[]; requis?:boolean };
const INSC_DEF = {
  titre:'Créer un compte', sousTitre:'', boutonTexte:'Créer mon compte',
  messageSuccesTitre:'Compte créé avec succès !', messageSuccesTexte:'Vous pouvez maintenant vous connecter.',
  libelles:{ prenom:'Prénom', nom:'Nom', email:'Courriel', mot_de_passe:'Mot de passe', confirmation:'Confirmez le mot de passe' },
  telephone:{ mode:'cache' }, adresse:{ mode:'obligatoire' }, infolettre:{ affiche:false, texte:'Je veux recevoir les nouveautés par courriel' },
  age:{ affiche:true, minimum:16, texte:'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes:{ affiche:true, texte:"J'accepte les termes et conditions de la boutique", url:'' },
};
function fusionInsc(b:any){
  const x=b&&typeof b==='object'?b:{}; const sous=(k:'libelles'|'telephone'|'adresse'|'infolettre'|'age'|'termes')=>({...INSC_DEF[k],...(x[k]&&typeof x[k]==='object'?x[k]:{})});
  return { ...INSC_DEF, ...x, libelles:sous('libelles'), telephone:sous('telephone'), adresse:sous('adresse'), infolettre:sous('infolettre'), age:sous('age'), termes:sous('termes'), champs:(Array.isArray(x.champs)?x.champs:[]) as ChampInsc[] };
}
// Couleur hex (#rrggbb) → rgba, pour les textes du pied de page (la couleur du texte est choisie par le gestionnaire)
const hexVersRgba = (hex: string, a: number) => { const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return `rgba(255,255,255,${a})`; const n = parseInt(m[1], 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

const FICHE_DEF: ConfigFicheProduit = {
  layout: 'image-gauche', photosMiniatures: 'dessous', descriptionPosition: 'droite',
  descriptionTronquee: false, afficherBreadcrumb: true, afficherStock: true,
  afficherCategorie: true, afficherSku: false, afficherRabaisPct: true, afficherQte: true,
  boutonLabel: 'Ajouter au panier', boutonCouleur: '',
  afficherReassurance: true,
  reassuranceItems: [
    { icone: '🔒', texte: 'Paiement sécurisé Stripe' },
    { icone: '🔄', texte: 'Retour sous 30 jours' },
    { icone: '🚚', texte: 'Livraison rapide 24–48h' },
  ],
  afficherPartage: false, afficherSimilaires: true, similairesNombre: 4, similairesTitre: 'Vous aimerez aussi',
};



// ─── Props ────────────────────────────────────────────────────────────────────
// ── Protection des saisies et des liens (tous les champs du site public) ──────────────────────────
// À la frappe : retire les caractères de contrôle et limite la longueur. À l'envoi : retire les balises HTML, les < >, les espaces en trop.
// (React échappe déjà tout ce qui s'affiche ; le serveur nettoie et valide de son côté — ceci est la première barrière.)
const limiterSaisie = (v: any, max = 200): string => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
const nettoyerEnvoi = (v: any, max = 200): string => limiterSaisie(v, max * 2).replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, max);
const COURRIEL_OK = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
// Liens venant de la configuration : seulement http(s) ou chemin interne — jamais javascript:, data:, vbscript:
const urlSure = (u: any): string => { const t = String(u == null ? '' : u).trim(); return /^(https?:\/\/|\/(?!\/))/i.test(t) ? t : ''; };

// ── Sakura : lecture sûre des réglages saisis par le gestionnaire (texte nettoyé, longueurs limitées) ──
const listeLignes = (v: any, max: number, len = 80): string[] => String(v == null ? '' : v).split('\n').map(x => nettoyerEnvoi(x, len)).filter(Boolean).slice(0, max);
const listeObjets = (v: any, max: number): any[] => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').slice(0, max);
// Lignes « a | b | c » → tableaux de cellules nettoyées
const listeCellules = (v: any, max: number, nbCol: number, len = 160): string[][] => String(v == null ? '' : v).split('\n').slice(0, max * 2).map(l => l.split('|').slice(0, nbCol).map(c => nettoyerEnvoi(c, len))).filter(c => c.some(Boolean)).slice(0, max);
const luminance = (hex: string) => { const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return 0; const n = parseInt(m[1], 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const nbSur = (v: any): string => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) && n >= 0 && n < 1e7 ? String(n) : ''; };
// Couleurs de la maquette (réglables dans Config → Accueil)
const COUL = { rouge: '#fbe6e4', rougeNav: '#fbe6e4', bleu: '#e0525c', marine: '#4a2b2b', rose: '#e0525c' };
const ENT_DEF = { couleurFond: COUL.rouge, couleurNav: COUL.rougeNav, couleurTexte: '#4a2b2b', couleurBarre: COUL.rose, afficherRecherche: true, afficherCategories: true, afficherChat: true, pastille: { titre: '', sousTitre: '', lien: '' }, barreHaut: { actif: false, gauche: '', droite: '' } };

// Icônes en trait (style Feather, licence MIT) — pas d'emoji dans l'en-tête
// Icônes e-Vend : mêmes pictogrammes que le template Premium (émojis), pour toutes nos boutiques
const ICONES: Record<string, string> = { user: '👤', chat: '💬', cart: '🛒', search: '🔍', gift: '🎁', gauche: '‹', droite: '›', pause: '⏸', lecture: '▶' };
function Ico({ n, taille = 22 }: { n: string; taille?: number; epais?: number }) {
  const fleche = n === 'gauche' || n === 'droite';
  return <span aria-hidden="true" style={{ fontSize: fleche ? taille * 1.4 : taille * 0.8, lineHeight: 1, fontWeight: fleche ? 700 : 400, fontFamily: fleche ? 'inherit' : undefined, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{ICONES[n] || ''}</span>;
}

// Titre avec mots en dégradé : les mots entre *étoiles* prennent le dégradé (texte simple, jamais de HTML)
function TitreGrad({ texte }: { texte: any }) {
  const parts = String(texte == null ? '' : texte).split('*');
  return <>{parts.map((p, k) => (k % 2 === 1 ? <span key={k} className="sk-grad">{p}</span> : <span key={k}>{p}</span>))}</>;
}

// Bandeau défilant (ticker) : plusieurs messages en boucle, pause au survol, arrêté si le visiteur préfère moins d'animations
// Motif d'écailles (vagues japonaises) dessiné en CSS pur : arcs concentriques semi-transparents
const MOTIF_ECAILLES = 'radial-gradient(circle at 50% 100%, transparent 0 28%, rgba(255,255,255,0.16) 29% 31%, transparent 32% 44%, rgba(255,255,255,0.16) 45% 47%, transparent 48% 60%, rgba(255,255,255,0.16) 61% 63%, transparent 64%)';

function Ticker({ cfg, onLien }: { cfg: any; onLien: (l: string) => void }) {
  const msgs = listeLignes(cfg && cfg.messages, 12, 140);
  if (msgs.length === 0) return null;
  const fond = hexOk(cfg.couleurFond, COUL.rose), texte = hexOk(cfg.couleurTexte, '#ffffff'), accent = hexOk(cfg.couleurAccent, '#ffffff');
  const vit = cfg.vitesse === 'rapide' ? 0.3 : cfg.vitesse === 'lente' ? 0.9 : 0.55;
  const total = msgs.reduce((n, m) => n + m.length + 8, 0);
  const duree = Math.max(10, Math.min(150, total * vit));
  const lien = nettoyerEnvoi(cfg.lien, 300), icone = nettoyerEnvoi(cfg.icone, 4) || '⚡';
  const bloc = (k: number) => (
    <span key={k} aria-hidden={k > 0 ? 'true' : undefined} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {msgs.map((m, i) => <span key={i} style={{ whiteSpace: 'nowrap', padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: 48 }}><span style={{ color: i % 2 === 1 ? accent : texte }}>{m}</span><span aria-hidden="true" style={{ fontSize: '0.8em' }}>{icone}</span></span>)}
    </span>
  );
  return (
    <div role="region" aria-label="Annonces" onClick={lien ? () => onLien(lien) : undefined} style={{ background: fond, backgroundImage: MOTIF_ECAILLES, backgroundSize: '48px 24px', color: texte, overflow: 'hidden', fontFamily: 'var(--sk-fh)', fontSize: 'clamp(16px, 2.6vw, 28px)', fontWeight: 700, padding: '16px 0', cursor: lien ? 'pointer' : 'default' }}>
      <div className="ag-defile" style={{ display: 'inline-flex', width: 'max-content', animation: `ag-defile ${duree}s linear infinite` }}>
        {[0, 1, 2].map(bloc)}{[3, 4, 5].map(bloc)}
      </div>
    </div>
  );
}

// Rangée qui défile (produits, cercles, cartes…) : flèche, barre de progression, accrochage au doigt
function Defilant({ children, piste = 'rgba(255,255,255,0.12)', barre = '#4a2b2b', fleche = '#ffffff', flecheTexte = '#000000' }: { children: React.ReactNode; piste?: string; barre?: string; fleche?: string; flecheTexte?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState({ part: 1, pos: 0, peut: false });
  const nb = (Array.isArray(children) ? children.length : children ? 1 : 0);
  useEffect(() => {
    const maj = () => { const el = ref.current; if (!el) return; const max = el.scrollWidth - el.clientWidth; const part = el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1; const pos = max > 0 ? el.scrollLeft / max : 0; setEtat(e => (Math.abs(e.part - part) < 0.005 && Math.abs(e.pos - pos) < 0.005 && e.peut === (max > 4) ? e : { part, pos, peut: max > 4 })); };
    maj(); const el = ref.current; const t = setTimeout(maj, 350);
    if (el) el.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
    return () => { clearTimeout(t); if (el) el.removeEventListener('scroll', maj); window.removeEventListener('resize', maj); };
  }, [nb]);
  const aller = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' }); };
  const btn: React.CSSProperties = { position: 'absolute', top: '42%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: fleche, color: flecheTexte, border: '2px solid var(--sk-b)', boxShadow: '0 4px 12px rgba(0,0,0,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 };
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div ref={ref} className="sk-defil" style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x proximity', paddingBottom: 6, scrollbarWidth: 'none' }}>{children}</div>
        {etat.peut && etat.pos > 0.02 && <button onClick={() => aller(-1)} aria-label="Précédent" style={{ ...btn, left: 6 }}><Ico n="gauche" /></button>}
        {etat.peut && etat.pos < 0.98 && <button onClick={() => aller(1)} aria-label="Suivant" style={{ ...btn, right: 6 }}><Ico n="droite" /></button>}
      </div>
      {etat.peut && (
        <div aria-hidden="true" style={{ position: 'relative', height: 3, background: piste, marginTop: 18, borderRadius: 18 }}>
          <div style={{ position: 'absolute', top: 0, height: 3, borderRadius: 18, background: barre, width: `${etat.part * 100}%`, left: `${etat.pos * (1 - etat.part) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// Titre de section : serif, aligné à gauche (ou centré), sous-titre facultatif
function TitreSection({ titre, sous, isMobile, centre }: { titre?: string; sous?: string; fantome?: string; isMobile: boolean; centre?: boolean }) {
  const ti = nettoyerEnvoi(titre, 120), so = nettoyerEnvoi(sous, 200);
  if (!ti && !so) return null;
  return (
    <div style={{ textAlign: centre ? 'center' : 'left', margin: isMobile ? '0 0 22px' : '0 0 34px' }}>
      {ti && <h2 className="sk-fh" style={{ fontSize: isMobile ? 28 : 42, lineHeight: 1.12, color: 'var(--sk-t)', margin: 0, overflowWrap: 'anywhere' }}><TitreGrad texte={ti} /></h2>}
      {so && <p style={{ fontSize: isMobile ? 15 : 17, color: 'var(--sk-t2)', margin: centre ? '10px auto 0' : '10px 0 0', maxWidth: 720 }}>{so}</p>}
    </div>
  );
}

// Bord ondulé entre deux sections (trait foncé + remplissage de la couleur de la page)
function Vague({ haut, isMobile }: { haut?: boolean; isMobile: boolean }) {
  const H = isMobile ? 22 : 38, M = H / 2, a = M - 2;
  let d = `M0 ${M} Q50 ${M - a} 100 ${M}`;
  for (let k = 2; k <= 12; k++) d += ` T${k * 100} ${M}`;
  const rempli = d + (haut ? ` L1200 0 L0 0 Z` : ` L1200 ${H} L0 ${H} Z`);
  return (
    <svg aria-hidden="true" viewBox={`0 0 1200 ${H}`} preserveAspectRatio="none" style={haut ? { position: 'absolute', left: 0, right: 0, top: -1, width: '100%', height: H, display: 'block', pointerEvents: 'none' } : { position: 'absolute', left: 0, right: 0, bottom: -1, width: '100%', height: H, display: 'block', pointerEvents: 'none' }}>
      <path d={rempli} style={{ fill: 'var(--sk-fond)' }} stroke="none" />
      <path d={d} fill="none" style={{ stroke: 'var(--sk-b)' }} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Bandeau de texte ondulé qui défile (arrêté si le visiteur préfère moins d'animations)
function Onde({ msgs, isMobile }: { msgs: string[]; isMobile: boolean }) {
  const [len, setLen] = useState(0);
  const ref = useRef<SVGTextElement>(null);
  const W = isMobile ? 600 : 1200, H = isMobile ? 120 : 150, fs = isMobile ? 30 : 38, a = isMobile ? 24 : 32, step = W / 4, M = H / 2;
  const bloc = msgs.join('  ✿  ') + '  ✿  ';
  const reduit = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    const t = ref.current; if (!t) return;
    const m = () => { try { const l = t.getComputedTextLength(); if (l > 0) setLen(l); } catch { /* mesure impossible : le texte reste fixe */ } };
    m(); const doc: any = document; if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(m);
  }, [bloc, W]);
  let d = `M0 ${M} Q${step / 2} ${M - a * 2} ${step} ${M}`;
  for (let k = 2; k <= 8; k++) d += ` T${k * step} ${M}`;
  const reps = len > 0 ? Math.ceil((2 * W + len) / len) + 1 : 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={msgs.join('. ')} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'hidden' }}>
      <defs><path id="sk-onde" d={d} /></defs>
      <text ref={ref} x="-9999" y="-9999" className="sk-fh" fontSize={fs} aria-hidden="true">{bloc}</text>
      <text className="sk-fh" fontSize={fs} style={{ fill: 'var(--sk-t)' }} aria-hidden="true">
        <textPath href="#sk-onde" startOffset="0">
          {bloc.repeat(reps)}
          {len > 0 && !reduit && <animate attributeName="startOffset" from="0" to={-len} dur={`${Math.max(12, Math.round(len / 35))}s`} repeatCount="indefinite" />}
        </textPath>
      </text>
    </svg>
  );
}

// Diaporama du haut de page : photo à gauche, texte à droite sur fond lilas, points en bas, bord ondulé (pas de défilement auto si le visiteur préfère moins d'animations)
function Diaporama({ slides, isMobile, onLien }: { slides: { titre: string; texte: string; photo: string; bouton: string; lien: string; couleurFond: string; surtitre?: string }[]; isMobile: boolean; onLien: (l: string) => void }) {
  const [i, setI] = useState(0);
  const [lecture, setLecture] = useState(true);
  const n = slides.length;
  const reduit = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { if (n < 2 || !lecture || reduit) return; const t = setInterval(() => setI(x => (x + 1) % n), 7000); return () => clearInterval(t); }, [n, lecture, reduit]);
  if (n === 0) return null;
  const k = Math.min(i, n - 1);
  const s = slides[k];
  const photo = urlSure(s.photo);
  const fond = hexOk(s.couleurFond, '#f6b6b0');
  // Avec photo : texte blanc sur voile rose ; sans photo : texte selon la couleur de fond
  const encre = photo ? '#ffffff' : (luminance(fond) > 0.5 ? '#4a2b2b' : '#ffffff');
  const ombre = photo ? '0 2px 14px rgba(90,30,40,0.55)' : 'none';
  const fleche: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: isMobile ? 44 : 64, height: 34, borderRadius: 999, border: '2px solid ' + (photo ? '#ffffff' : '#e0525c'), background: 'rgba(255,255,255,0.18)', color: photo ? '#ffffff' : '#e0525c', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 };
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: photo ? `url("${encodeURI(photo).replace(/"/g, '%22')}") center/cover no-repeat, ${fond}` : fond, color: encre, ['--sk-hl' as any]: photo ? '#ffe3df' : (luminance(fond) > 0.5 ? '#e0525c' : '#ffe3df') }}>
      {photo && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(224,82,92,0.28) 0%, rgba(120,40,52,0.45) 100%)' }} />}
      <div key={k} className="sk-fondu" style={{ position: 'relative', minHeight: isMobile ? 460 : 640, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: isMobile ? '40px 60px 70px' : '60px 110px 90px', maxWidth: 1240, margin: '0 auto', boxSizing: 'border-box' }}>
        {s.surtitre && <div style={{ fontSize: isMobile ? 14 : 16, marginBottom: 10, textShadow: ombre }}>{s.surtitre}</div>}
        <h1 className="sk-fh" style={{ fontSize: isMobile ? 38 : 68, lineHeight: 1.08, color: encre, margin: '0 0 18px', maxWidth: 820, overflowWrap: 'anywhere', textShadow: ombre }}><TitreGrad texte={s.titre} /></h1>
        {s.texte && <p style={{ fontSize: isMobile ? 15 : 18, lineHeight: 1.6, margin: '0 0 26px', maxWidth: 560, overflowWrap: 'anywhere', textShadow: ombre }}>{s.texte}</p>}
        {s.bouton && <div><button onClick={() => onLien(s.lien)} className="sk-pill">{s.bouton}</button></div>}
      </div>
      {n > 1 && <button onClick={() => setI((k + n - 1) % n)} aria-label="Diapositive précédente" style={{ ...fleche, left: isMobile ? 8 : 16 }}>←</button>}
      {n > 1 && <button onClick={() => setI((k + 1) % n)} aria-label="Diapositive suivante" style={{ ...fleche, right: isMobile ? 8 : 16 }}>→</button>}
      {n > 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, j) => <button key={j} onClick={() => setI(j)} aria-label={`Diapositive ${j + 1}`} aria-current={j === k} style={{ width: 40, height: 4, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer', background: j === k ? encre : 'rgba(255,255,255,0.5)' }} />)}
          <button onClick={() => setLecture(l => !l)} aria-label={lecture ? 'Mettre en pause' : 'Reprendre'} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid ' + encre, background: 'rgba(255,255,255,0.2)', color: encre, cursor: 'pointer', padding: 0, fontSize: 10 }}>{lecture ? '❚❚' : '▶'}</button>
        </div>
      )}
    </div>
  );
}

// « Magasiner … pour [catégorie] » : le visiteur choisit une catégorie dans la liste, les vrais produits suivent
function RangeeFiltre({ titre, categories, produits, nombre, isMobile, rendre }: { titre: string; categories: string[]; produits: ProduitCat[]; nombre: number; isMobile: boolean; rendre: (p: ProduitCat) => React.ReactNode }) {
  const [sel, setSel] = useState('');
  const cat = sel && categories.includes(sel) ? sel : (categories[0] || '');
  const l = (cat ? produits.filter(p => p.categorie === cat) : produits).slice(0, nombre);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: isMobile ? 22 : 32 }}>
        <h2 className="sk-fh" style={{ fontSize: isMobile ? 28 : 42, lineHeight: 1.12, color: 'var(--sk-t)', margin: 0, overflowWrap: 'anywhere' }}><TitreGrad texte={titre} /></h2>
        {categories.length > 0 && (
          <select aria-label="Catégorie" value={cat} onChange={e => { const x = e.target.value; setSel(categories.includes(x) ? x : ''); }} className="sk-fh" style={{ background: 'var(--sk-s)', color: 'var(--sk-t)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '9px 14px' : '12px 20px', fontSize: isMobile ? 15 : 17, fontWeight: 700, cursor: 'pointer', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.22)', maxWidth: '100%' }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: isMobile ? 12 : 26 }}>
        {l.map(p => <div key={p.id}>{rendre(p)}</div>)}
      </div>
    </div>
  );
}

// Vitrine produit : grande photo avec points cliquables à gauche, fiche d'un vrai produit à droite (points pour changer de produit)
function Vitrine({ photo, points, produits, bouton, isMobile, onLien, onProduit, afficherPrix }: { photo: string; points: string[][]; produits: ProduitCat[]; bouton: string; isMobile: boolean; onLien: (l: string) => void; onProduit: (p: ProduitCat) => void; afficherPrix: boolean }) {
  const [k, setK] = useState(0);
  const n = produits.length;
  const p = n > 0 ? produits[Math.min(k, n - 1)] : null;
  const img = urlSure(photo);
  const promo = !!p && !!p.prix_promo && p.prix_promo < p.prix;
  const imgP = p ? urlSure(p.photo_principale) : '';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile || !p ? '1fr' : '1.15fr 1fr', border: '2px solid var(--sk-b)', borderRadius: 18, overflow: 'hidden', background: 'var(--sk-s)' }}>
      <div style={{ position: 'relative', minHeight: isMobile ? 320 : 560, borderRight: isMobile || !p ? 'none' : '2px solid var(--sk-b)', borderBottom: isMobile && p ? '2px solid var(--sk-b)' : 'none', background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s2)` : 'linear-gradient(135deg, #4a2b2b, #e8c7a3)' }}>
        {points.map((x, j) => {
          const px = Math.max(0, Math.min(100, parseFloat(x[0]) || 0)), py = Math.max(0, Math.min(100, parseFloat(x[1]) || 0));
          return <button key={j} onClick={() => onLien(x[2] || 'catalogue')} aria-label="Voir" style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, transform: 'translate(-50%, -50%)', width: 26, height: 26, borderRadius: '50%', background: '#ffffff', border: '4px solid #4a2b2b', cursor: 'pointer', boxShadow: '0 0 0 5px rgba(255,255,255,0.45)', padding: 0 }} />;
        })}
      </div>
      {p && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: isMobile ? '22px 16px 26px' : '30px 30px 34px', gap: 8 }}>
          <div role="img" aria-label={p.titre} style={{ width: '100%', maxWidth: 320, height: isMobile ? 220 : 300, borderRadius: 18, border: '2px solid var(--sk-b)', background: imgP ? `url("${encodeURI(imgP).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s2)` : 'var(--sk-s2)' }} />
          {p.categorie && <div style={{ fontSize: 14, color: 'var(--sk-t2)', marginTop: 8 }}>{p.categorie}</div>}
          <h3 className="sk-fh" style={{ fontSize: isMobile ? 22 : 28, lineHeight: 1.15, color: 'var(--sk-t)', margin: 0, overflowWrap: 'anywhere' }}>{p.titre}</h3>
          {afficherPrix && <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--sk-t)' }}>{promo ? <><span style={{ color: '#4a2b2b' }}>{prix(p.prix_promo!)}</span> <span style={{ fontSize: 14, fontWeight: 600, textDecoration: 'line-through', color: 'var(--sk-d)' }}>{prix(p.prix)}</span></> : prix(p.prix)}</div>}
          <button onClick={() => onProduit(p)} className="sk-pill" style={{ marginTop: 6 }}>{bouton || 'Choisir'}</button>
          {n > 1 && <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{produits.map((_, j) => <button key={j} onClick={() => setK(j)} aria-label={`Produit ${j + 1}`} aria-current={j === k} style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--sk-b)', padding: 0, cursor: 'pointer', background: j === k ? '#4a2b2b' : 'transparent' }} />)}</div>}
        </div>
      )}
    </div>
  );
}

// Cellule d'un tableau comparatif : oui / non deviennent des pastilles ✓ / ✗, le reste reste du texte
function CelluleOuiNon({ v }: { v: string }) {
  const t = v.trim().toLowerCase();
  const oui = /^(oui|yes|✓|✔|vrai)$/.test(t), non = /^(non|no|✗|✘|x|faux)$/.test(t);
  if (oui || non) return <span role="img" aria-label={oui ? 'Oui' : 'Non'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: oui ? '#34c759' : '#ff4d5e', color: '#ffffff', border: '2px solid var(--sk-b)', fontSize: 18, fontWeight: 900 }}>{oui ? '✓' : '✗'}</span>;
  return <span>{v || '—'}</span>;
}

// Accordéon (questions / réponses) : un seul bloc ouvert à la fois, au clavier aussi
function Accordeon({ items, isMobile }: { items: string[][]; isMobile: boolean }) {
  const [ouvert, setOuvert] = useState(-1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8 }}>
      {items.map((x, k) => {
        const o = ouvert === k;
        return (
          <div key={k} style={{ background: 'var(--sk-s2)', borderRadius: 18, overflow: 'hidden', border: '2px solid var(--sk-b)' }}>
            <button onClick={() => setOuvert(o ? -1 : k)} aria-expanded={o} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: isMobile ? '16px 16px' : '22px 24px', fontFamily: 'inherit', color: o ? '#4a2b2b' : 'var(--sk-t)' }}>
              <span className="sk-fh" style={{ fontSize: isMobile ? 18 : 24, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{x[0]}</span>
              <span aria-hidden="true" style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{o ? '−' : '+'}</span>
            </button>
            {o && x[1] && <div style={{ padding: isMobile ? '0 16px 18px' : '0 24px 24px', fontSize: isMobile ? 15 : 16, lineHeight: 1.7, color: 'var(--sk-t2)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{x[1]}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Date saisie « AAAA-MM-JJ » ou « AAAA-MM-JJ HH:mm » → millisecondes (0 si invalide)
const dateSure = (v: any): number => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(String(v == null ? '' : v).trim());
  if (!m) return 0;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]), h = Number(m[4] || 0), mi = Number(m[5] || 0);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return 0;
  const t = new Date(y, mo - 1, d, h, mi).getTime();
  return isFinite(t) ? t : 0;
};
// Compte à rebours vers la date saisie par le gestionnaire (heure de l'appareil du visiteur) : jamais affiché si la date est passée
function Decompte({ fin, isMobile }: { fin: number; isMobile: boolean }) {
  const [maint, setMaint] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setMaint(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const ms = fin - maint;
  if (ms <= 0) return null;
  const parts: [number, string][] = [[Math.floor(ms / 864e5), 'Jours'], [Math.floor(ms / 36e5) % 24, 'Heures'], [Math.floor(ms / 6e4) % 60, 'Minutes'], [Math.floor(ms / 1e3) % 60, 'Secondes']];
  return (
    <div role="timer" aria-label="Compte à rebours" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, flexWrap: 'nowrap' }}>
      {parts.map(([v, l], k) => (
        <Fragment key={l}>
          {k > 0 && <span aria-hidden="true" style={{ color: '#4a2b2b', fontSize: isMobile ? 24 : 34, fontWeight: 800 }}>:</span>}
          <div style={{ flex: 1, minWidth: 0, background: 'var(--sk-s2)', color: '#4a2b2b', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '10px 2px' : '14px 4px', textAlign: 'center' }}>
            <div className="sk-fh" style={{ fontSize: isMobile ? 30 : 46, lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
            <div style={{ fontSize: isMobile ? 10 : 13, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
const HL_J = {} as React.CSSProperties;   // mots en relief rose clair sur un fond foncé (photo)

interface Props {
  config: any;   // config brute de la BD — contient config.sakura
  siteId?: number;
  vendeurId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function merge<T>(def: T, override: any): T {
  if (!override || typeof override !== 'object') return def;
  return { ...def, ...override };
}
// ── Politiques légales du site : les 6 politiques fixes que le gestionnaire rédige (Configuration → Mes politiques) ──
const POLITIQUES_SLUGS = ['retour-remboursement','confidentialite','conditions-service','expedition','coordonnees','mentions-legales'];
const sansAccent = (t:string)=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// Reconnaît un lien de pied de page (ou un slug) qui désigne une politique : retourne son slug, sinon ''
function slugPolitique(dest:string):string {
  const d=sansAccent(dest).replace(/[-_]+/g,' ');
  const t:Record<string,string>={ 'conditions':'conditions-service','conditions de service':'conditions-service','conditions service':'conditions-service','termes':'conditions-service','termes et conditions':'conditions-service',
    'confidentialite':'confidentialite','politique de confidentialite':'confidentialite','vie privee':'confidentialite',
    'retours':'retour-remboursement','retour':'retour-remboursement','remboursement':'retour-remboursement','remboursements':'retour-remboursement','retour et remboursement':'retour-remboursement','retours et remboursements':'retour-remboursement','retour remboursement':'retour-remboursement',
    'livraison':'expedition','expedition':'expedition','livraison et expedition':'expedition',
    'coordonnees':'coordonnees','mentions legales':'mentions-legales' };
  return t[d]||'';
}
// Nettoie le HTML d'une politique avant l'affichage (le serveur le nettoie déjà à l'enregistrement) : retire scripts, cadres, formulaires, gestionnaires d'événements et liens javascript:
function htmlSur(h:string):string {
  try {
    const doc=new DOMParser().parseFromString('<div id="r">'+h+'</div>','text/html'); const racine=doc.getElementById('r'); if(!racine) return '';
    racine.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,svg,math').forEach(e=>e.remove());
    racine.querySelectorAll('*').forEach(e=>{
      Array.from(e.attributes).forEach(a=>{ const n=a.name.toLowerCase(), v=a.value.replace(/[\s\u0000-\u001f]/g,'').toLowerCase();
        if(n.startsWith('on')||n==='style'||((n==='href'||n==='src'||n==='xlink:href'||n==='action')&&!/^(https?:|mailto:|tel:|#|\/)/.test(v))) e.removeAttribute(a.name); });
      if(e.tagName==='A'){ e.setAttribute('target','_blank'); e.setAttribute('rel','noopener noreferrer'); }
    });
    return racine.innerHTML;
  } catch { return ''; }
}

function prix(n: number | string) { return Number(n || 0).toFixed(2).replace('.', ',') + ' $'; }

// ─── Composant Bannière ───────────────────────────────────────────────────────
function Banniere({ cfg }: { cfg: ConfigBanniere }) {
  if (!cfg?.actif) return null;
  const texte = String(cfg.texte || '');
  const lien = cfg.lien && cfg.labelLien ? <a href={urlSure(cfg.lien) || '#'} style={{ color: cfg.couleurTexte, fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}>{cfg.labelLien} →</a> : null;
  if (cfg.defilant) {
    // Bandeau défilant (CSS, arrêté si le visiteur préfère moins d'animations). La vitesse suit la longueur du texte.
    const duree = Math.max(14, Math.min(90, texte.length * 0.5 + 10));
    const bloc = (k: number) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 14, paddingRight: 48, whiteSpace: 'nowrap' }}><span>• {texte}</span>{lien}</span>;
    return (
      <div style={{ background: cfg.couleurFond, color: cfg.couleurTexte, overflow: 'hidden', fontSize: 14, fontWeight: 600, padding: '12px 0' }}>
        <div className="ag-defile" style={{ display: 'inline-flex', width: 'max-content', animation: `ag-defile ${duree}s linear infinite` }}>
          {[0, 1, 2, 3].map(bloc)}{[4, 5, 6, 7].map(bloc)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: cfg.couleurFond, color: cfg.couleurTexte, padding: '10px 20px', textAlign: 'center', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span>{texte}</span>{lien}
    </div>
  );
}

// ─── Composant Hero ───────────────────────────────────────────────────────────
function Hero({ cfg, cp, onNaviguer, cs }: { cfg: ConfigHero; cp: string; onNaviguer: (p: string) => void; cs?: string }) {
  const photoHero = urlSure(cfg.photo);   // seulement http(s) ou chemin interne
  const isFond = cfg.style === 'image-fond' && !!photoHero;
  // Lien du bouton (config) : page interne (/catalogue, /blog, /faq, /contact, /offres, /encheres, /connexion…) ou adresse complète (https://…). Vide : catalogue.
  const allerBouton = () => {
    const l = String(cfg.boutonLien || '').trim();
    if (!l) { onNaviguer('catalogue'); return; }
    if (/^(https?:)?\/\//i.test(l) || /^(mailto|tel):/i.test(l)) { window.location.href = l; return; }
    const cle = l.replace(/^\/+/, '').split(/[?#]/)[0].toLowerCase();
    const alias: Record<string, string> = { connexion: 'login', 'a-propos': 'a-propos' };
    onNaviguer(alias[cle] || cle || 'catalogue');
  };
  const isGauche = cfg.style === 'gauche';
  return (
    <div style={{
      background: isFond ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url("${encodeURI(photoHero).replace(/"/g, '%22')}") center/cover no-repeat` : cfg.couleurFond,
      minHeight: 'min(70vh, 560px)',
      display: 'flex', alignItems: 'center', justifyContent: isGauche ? 'flex-start' : 'center',
      padding: '60px 24px',
    }}>
      <div style={{ maxWidth: 680, textAlign: isGauche ? 'left' : 'center', width: '100%' }}>
        {!isFond && photoHero && !isGauche && (
          <img src={photoHero} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 0, marginBottom: 32 }} />
        )}
        {!isFond && photoHero && isGauche && (
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: isFond ? '#fff' : cfg.couleurTitre, lineHeight: 1.15, marginBottom: 16 }}>{cfg.titre}</h1>
              <p style={{ fontSize: 18, color: isFond ? 'rgba(255,255,255,0.85)' : (cs || '#555'), marginBottom: 28, lineHeight: 1.6 }}>{cfg.sousTitre}</p>
              <button onClick={allerBouton} style={{ background: cfg.couleurBouton, color: '#fff', border: isFond ? '2px solid rgba(255,255,255,0.9)' : '2px solid var(--sk-b)', borderRadius: 18, padding: '14px 32px', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, cursor: 'pointer' }}>{cfg.boutonLabel} →</button>
            </div>
            <img src={photoHero} alt="" style={{ width: 280, height: 220, objectFit: 'cover', borderRadius: 0, flexShrink: 0 }} />
          </div>
        )}
        {(isFond || !photoHero || (!isFond && !isGauche)) && (
          <>
            <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontWeight: 800, color: isFond ? '#fff' : cfg.couleurTitre, lineHeight: 1.15, marginBottom: 16 }}>{cfg.titre}</h1>
            <p style={{ fontSize: 18, color: isFond ? 'rgba(255,255,255,0.85)' : (cs || '#555'), marginBottom: 28, lineHeight: 1.6 }}>{cfg.sousTitre}</p>
            <button onClick={allerBouton} style={{ background: cfg.couleurBouton, color: '#fff', border: isFond ? '2px solid rgba(255,255,255,0.9)' : '2px solid var(--sk-b)', borderRadius: 18, padding: '14px 32px', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, cursor: 'pointer' }}>{cfg.boutonLabel} →</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Carte produit ────────────────────────────────────────────────────────────
// Add-on « Enchères » : temps restant d'une carte (heure du serveur, pas celle de l'appareil)
function CompteurEnchere({ fin, decalage, onFini }: { fin: string; decalage: number; onFini?: () => void }) {
  const [, setT] = useState(0);
  useEffect(() => { const t = setInterval(() => setT(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const ms = new Date(fin).getTime() - (Date.now() + decalage);
  const fini = useRef(false);
  useEffect(() => { if (ms <= 0 && !fini.current) { fini.current = true; if (onFini) onFini(); } });
  if (ms <= 0) return <span>Terminée</span>;
  const sec = Math.floor(ms / 1000), j = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), r = sec % 60;
  return <span>{j > 0 ? `${j}j ${h}h ${m}m` : h > 0 ? `${h}h ${String(m).padStart(2, '0')}m ${String(r).padStart(2, '0')}s` : `${m}m ${String(r).padStart(2, '0')}s`}</span>;
}
// Add-on « Enchères » : temps restant d'une carte de la page « Enchères »
function ResteEnchere({ fin, decalage, couleur }: { fin: string; decalage: number; couleur: string }) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setT(Date.now()), 1000); return () => clearInterval(i); }, []);
  const ms = new Date(fin).getTime() - (t + decalage);
  if (ms <= 0) return <span style={{ color: 'var(--sk-d)' }}>Terminée</span>;
  const s2 = Math.floor(ms / 1000), j = Math.floor(s2 / 86400), h = Math.floor((s2 % 86400) / 3600), m = Math.floor((s2 % 3600) / 60), sec = s2 % 60;
  const txt = j > 0 ? `${j} j ${h} h ${m} min` : h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(sec).padStart(2, '0')} s`;
  return <span style={{ color: ms < 300000 ? '#dc2626' : couleur, fontWeight: 800 }}>⏱ {txt}</span>;
}

interface CarteExtras { seuilStock?: number; clair?: boolean; gid?: number; connecte?: boolean; demo?: boolean; offre?: { heureServeur: string | null; onFini: () => void } }

function CarteProduit({ produit, cp, afficherPrix, onClick, extras }: { produit: ProduitCat; cp: string; afficherPrix: boolean; onClick: () => void; extras?: CarteExtras }) {
  const gid = extras?.gid, connecte = extras?.connecte, demo = extras?.demo, offre = extras?.offre;
  const seuil = extras?.seuilStock || 0;
  const enPromo = !!produit.prix_promo && produit.prix_promo < produit.prix;
  const rabais = enPromo ? Math.round((1 - Number(produit.prix_promo) / Number(produit.prix)) * 100) : 0;   // calculé sur les vrais prix
  const ench = produit.enchere || null;
  const venteBloquee = !!ench && produit.stock === 0;   // seul exemplaire réservé à l'enchère : pas de vente directe
  const peuRestant = seuil > 0 && typeof produit.stock === 'number' && produit.stock > 0 && produit.stock <= seuil && !ench;   // « Plus que N » : seulement si le stock réel est bas
  const pastille: React.CSSProperties = { position: 'absolute', left: 10, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, color: '#fff' };
  return (
    <div onClick={onClick} style={{ background: 'var(--sk-s)', color: 'var(--sk-t)', borderRadius: 18, border: '1px solid var(--sk-b)', borderBottom: '3px solid #e0525c', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', height: '100%', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.22)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
      <div style={{ height: 220, margin: 10, borderRadius: 14, border: 'none', background: 'var(--sk-s2)', overflow: 'hidden', position: 'relative' }}>
        {produit.photo_principale
          ? <img src={produit.photo_principale} alt={produit.titre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{produit.emoji || '🌸'}</div>
        }
        {enPromo && <span style={{ ...pastille, top: 10, background: '#ff4d6d' }}>-{rabais}%</span>}
        {produit.date_parution && <span style={{ ...pastille, top: enPromo ? 40 : 10, background: '#6d28d9' }}>Précommande</span>}
        {ench && <span style={{ ...pastille, top: enPromo ? 40 : 10, background: '#4a2b2b' }}>🌸 Enchère</span>}
        {peuRestant && <span style={{ ...pastille, top: enPromo || ench || produit.date_parution ? 70 : 10, background: '#4a2b2b', color: '#ffffff' }}>Plus que {produit.stock}</span>}
        {produit.stock === 0 && !ench && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: '#000000', color: '#ffffff', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Épuisé</span></div>}
        {gid !== undefined && <BoutiqueSouhaitCarte zone="superposition" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo} />}
      </div>
      <div style={{ padding: '14px 16px 16px', flex: 1 }}>
        {gid !== undefined && <BoutiqueSouhaitCarte zone="haut" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo} />}
        <h3 style={{ fontSize: 14, fontWeight: 500, textAlign: 'left', color: 'var(--sk-t)', margin: '0 0 6px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{produit.titre}</h3>
        {afficherPrix && !venteBloquee && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            {enPromo
              ? <>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e0525c' }}>{prix(produit.prix_promo!)}</span>
                  <span style={{ fontSize: 14, color: 'var(--sk-d)', textDecoration: 'line-through' }}>{prix(produit.prix)}</span>
                </>
              : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-t)' }}>{prix(produit.prix)}</span>
            }
          </div>
        )}
        {produit.offre_fin && offre && <OffreCompteur clair={extras?.clair} compact fin={produit.offre_fin} heureServeur={offre.heureServeur} onFini={offre.onFini} />}
        {produit.date_parution && <div style={{ marginTop: 8 }}><BoutiqueParutionCountdown compact dateParution={produit.date_parution} gestionnaireId={gid} heureServeur={offre ? offre.heureServeur : null} /></div>}
        {ench && (
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 18, border: '1px solid #4a2b2b55', background: '#4a2b2b0f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
              <div><div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sk-d)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ench.nb_mises > 0 ? 'Mise actuelle' : 'Mise de départ'}</div><div style={{ fontSize: 17, fontWeight: 800, color: '#4a2b2b' }}>{prix(ench.mise)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sk-d)', textTransform: 'uppercase' }}>Mises</div><div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sk-t)' }}>{ench.nb_mises}</div></div>
            </div>
            <div style={{ marginTop: 6, display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#4a2b2b', background: '#4a2b2b15', padding: '3px 8px', borderRadius: 18 }}>⏱ <CompteurEnchere fin={ench.fin} decalage={ench.decalage || 0} onFini={offre ? offre.onFini : undefined} /></div>
            <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ display: 'block', width: '100%', marginTop: 8, padding: '9px', background: '#4a2b2b', border: 'none', borderRadius: 999, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>🌸 Participer aux enchères</button>
          </div>
        )}
        {!ench && !venteBloquee && produit.stock !== 0 && <div style={{ marginTop: 12, background: cp, color: (luminance(cp) > 0.55 ? '#4a2b2b' : '#ffffff'), border: '2px solid var(--sk-b)', borderRadius: 18, padding: '9px 14px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>Voir le produit</div>}
        {gid !== undefined && <BoutiqueSouhaitCarte zone="bas" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo} />}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ cfg, onNaviguer, liensPol, extra, plus }: { cfg: ConfigFooter; onNaviguer: (p: string) => void; liensPol: string[][]; extra?: React.ReactNode; plus?: any }) {
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v);
  const iconeReseau: Record<string, string> = { facebook:'f', instagram:'📸', tiktok:'♪', twitter:'𝕏', youtube:'▶', linkedin:'in', pinterest:'P' };
  const p: any = plus || {};
  const bande = listeCellules(p.bande, 4, 2, 120).filter(x => x[0]);
  const aide: any = p.aide || {};
  const aideTitre = nettoyerEnvoi(aide.titre, 80), aideTexte = nettoyerEnvoi(aide.texte, 240), aideBtn = nettoyerEnvoi(aide.bouton, 30), aidePhoto = urlSure(aide.photo);
  const paiements = listeLignes(p.paiements, 8, 24);
  const fond = hexOk(cfg.couleurFond, '#4a2b2b'), texte = hexOk(cfg.couleurTexte, '#ffffff');
  const colonne = (titre: string, liens: string) => !titre ? null : (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{titre}</div>
      {liens.split('\n').filter(l => l.trim() && !slugPolitique(l)).map((l, i) => (
        <div key={i} style={{ marginBottom: 9 }}><button onClick={() => onNaviguer(l.trim().toLowerCase())} style={{ background: 'none', border: 'none', color: texte, opacity: 0.9, fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>{l}</button></div>
      ))}
    </div>
  );
  return (
    <footer style={{ background: fond, backgroundImage: MOTIF_ECAILLES, backgroundSize: '48px 24px', color: texte }}>
      {bande.length > 0 && (
        <div style={{ borderBottom: `2px solid ${hexVersRgba(texte, 0.35)}` }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {bande.map((b, i) => <div key={i} style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 700 }}>{b[0]}</div>{b[1] && <div style={{ fontSize: 13, opacity: 0.85 }}>{b[1]}</div>}</div>)}
          </div>
        </div>
      )}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--sk-fh)', overflowWrap: 'anywhere' }}>{cfg.nomBoutique}</div>
            {cfg.slogan && <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>{cfg.slogan}</p>}
            {reseauxActifs.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {reseauxActifs.map(([k, url]) => (
                  <a key={k} href={urlSure(url) || '#'} target="_blank" rel="noopener noreferrer" aria-label={k}
                    style={{ width: 38, height: 38, borderRadius: '50%', background: hexVersRgba(texte, 0.16), border: `2px solid ${hexVersRgba(texte, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: texte, textDecoration: 'none', fontWeight: 700 }}>{iconeReseau[k] || k[0].toUpperCase()}</a>
                ))}
              </div>
            )}
          </div>
          {colonne(cfg.colonnes.titre1, cfg.colonnes.liens1)}
          {colonne(cfg.colonnes.titre2, cfg.colonnes.liens2)}
          {cfg.colonnes.titre3 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{cfg.colonnes.titre3}</div>
              {cfg.colonnes.liens3.split('\n').filter(Boolean).map((l, i) => <div key={i} style={{ marginBottom: 9, fontSize: 15, opacity: 0.9 }}>{l}</div>)}
            </div>
          )}
          {aideTitre && (
            <div style={{ background: hexVersRgba(texte, 0.12), border: `2px solid ${hexVersRgba(texte, 0.3)}`, borderRadius: 18, overflow: 'hidden' }}>
              {aidePhoto && <img src={aidePhoto} alt="" loading="lazy" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{aideTitre}</div>
                {aideTexte && <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.95, margin: '0 0 12px' }}>{aideTexte}</p>}
                {aideBtn && <button onClick={() => onNaviguer(nettoyerEnvoi(aide.lien, 300).toLowerCase() || 'contact')} style={{ background: '#4a2b2b', color: '#ffffff', border: `2px solid ${hexVersRgba(texte, 0.3)}`, borderRadius: 18, padding: '9px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{aideBtn}</button>}
              </div>
            </div>
          )}
        </div>

        {extra}

        {paiements.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, opacity: 0.85, marginRight: 4 }}>Paiements acceptés :</span>
            {paiements.map((x, i) => <span key={i} style={{ background: '#fff', color: '#111', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{x}</span>)}
          </div>
        )}

        <div style={{ borderTop: `2px solid ${hexVersRgba(texte, 0.35)}`, padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>© {new Date().getFullYear()} {cfg.nomBoutique}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {liensPol.map(([slug, label]) => <button key={slug} onClick={() => onNaviguer(slug)} style={{ background: 'none', border: 'none', color: texte, opacity: 0.85, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>)}
          </div>
          {cfg.afficherPropulse !== false && (
            <a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, opacity: 0.7, color: texte, textDecoration: 'none' }}>Propulsé par e-Vend Studio</a>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TemplateBoutiqueSakura({ config: configBrut, siteId, vendeurId }: Props) {
  // Extraire config.sakura de la BD et merger avec les défauts
  const rawSK = (configBrut && typeof configBrut.sakura === 'object' && configBrut.sakura) || {};
  const fp: ConfigFicheProduit = { ...FICHE_DEF, ...(rawSK.ficheProduit || {}) };
  // Promesses de réassurance (retour, livraison) : seulement si le gestionnaire les a enregistrées, ou en démo
  const reassuranceVisible = !!configBrut?.__produits_demo__ || Array.isArray(rawSK.ficheProduit?.reassuranceItems);

  const cfg: ConfigSakura = {
    accueil:  { ...merge(CFG_DEF.accueil, rawSK.accueil), hero: merge(CFG_DEF.accueil.hero, rawSK.accueil?.hero), banniere: merge(CFG_DEF.accueil.banniere, rawSK.accueil?.banniere) },
    catalogue: merge(CFG_DEF.catalogue, rawSK.catalogue),
    faq:      merge(CFG_DEF.faq,      rawSK.faq),
    blog:     merge(CFG_DEF.blog,     rawSK.blog),
    contact:  merge(CFG_DEF.contact,  rawSK.contact),
    footer:   { ...merge(CFG_DEF.footer, rawSK.footer), reseaux: merge(CFG_DEF.footer.reseaux, rawSK.footer?.reseaux), colonnes: merge(CFG_DEF.footer.colonnes, rawSK.footer?.colonnes), politiques: merge(CFG_DEF.footer.politiques, rawSK.footer?.politiques) },
    ficheProduit: fp,
  };

  const logoUrl = urlSure(rawSK.identite?.logoUrl);   // logo (Config → Identité) : seulement http(s) ou chemin interne
  const police = policeSK(cfg.accueil.police);
  const cp = hexOk(cfg.accueil.couleurPrimaire, CP);
  const surCp = luminance(cp) > 0.55 ? '#4a2b2b' : '#ffffff';   // texte lisible sur la couleur principale
  const cpPartage = luminance(cp) > 0.6 ? CP_FONCE : cp;   // écrans partagés (panier, caisse, compte) : texte blanc
  const cs = cfg.accueil.couleurSecondaire || '#666'; // couleur secondaire (config → Accueil) : sous-titres et textes d'appoint

  // ── Thème : clair par défaut ; le gestionnaire choisit le mode (et peut permettre au visiteur de basculer) ──
  const cleTheme = `evend_theme_sakura_${vendeurId}`;
  const [modeVisiteur, setModeVisiteur] = useState<'sombre' | 'clair' | ''>(() => { try { const v = window.localStorage.getItem(cleTheme); return v === 'sombre' || v === 'clair' ? v : ''; } catch { return ''; } });
  const modeConfig: 'sombre' | 'clair' = cfg.accueil.mode === 'sombre' ? 'sombre' : 'clair';
  const basculeOk = cfg.accueil.afficherBascule !== false;
  const mode: 'sombre' | 'clair' = basculeOk && modeVisiteur ? modeVisiteur : modeConfig;
  const sombre = mode === 'sombre';
  const TH = THEMES[mode];
  const surchargeOk = mode === modeConfig;   // fond/texte personnalisés : seulement dans le mode choisi par le gestionnaire
  const fondPage = (surchargeOk && hexOk(cfg.accueil.couleurFondPage, '')) || TH.fond;
  const texteCouleur = (surchargeOk && hexOk(cfg.accueil.couleurTexte, '')) || TH.t;
  const basculerTheme = () => { const n = sombre ? 'clair' : 'sombre'; setModeVisiteur(n); try { window.localStorage.setItem(cleTheme, n); } catch { /* stockage indisponible : le choix vaut pour cette visite */ } };
  const varsTheme = { '--sk-fond': fondPage, '--sk-fh': police.css, '--sk-fhw': (police as any).poids || 700, '--sk-hl': hexOk(rawSK.accueil && rawSK.accueil.couleurAccent, TH === THEMES.sombre ? '#ffb3ab' : COUL.bleu), '--sk-s': TH.s, '--sk-s2': TH.s2, '--sk-b': TH.b, '--sk-t': texteCouleur, '--sk-t2': TH.t2, '--sk-d': TH.d, '--sk-err': TH.err, '--sk-errbg': TH.errBg } as React.CSSProperties;
  const [remonterVisible, setRemonterVisible] = useState(false);
  useEffect(() => { const f = () => setRemonterVisible(window.scrollY > 600); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);

  // ── State navigation interne ──────────────────────────────────────────────
  type PageId = 'accueil' | 'catalogue' | 'produit' | 'blog' | 'article' | 'faq' | 'a-propos' | 'contact' | 'login' | 'inscription' | 'compte' | 'offres' | 'encheres' | 'politique';
  const [page, setPage]               = useState<PageId>('accueil');
  const [produitActif, setProduitActif] = useState<ProduitCat | null>(null);
  const [articleActif, setArticleActif] = useState<ArticleBlog | null>(null);
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [larg, setLarg] = useState(1280);   // largeur réelle de la fenêtre : le menu latéral de l'accueil n'apparaît que sur grand écran
  const [isMobile, setIsMobile]       = useState(() => typeof window !== 'undefined' && Math.min(window.innerWidth, (window.screen && window.screen.width) || window.innerWidth) < 768);   // largeur réelle de l'écran : un contenu trop large ne doit jamais faire croire à un grand écran

  // ── State données ─────────────────────────────────────────────────────────
  const [produits, setProduits]       = useState<ProduitCat[]>([]);
  const [articles, setArticles]       = useState<ArticleBlog[]>([]);
  const [blogPage, setBlogPage]       = useState(1);
  const [blogPages, setBlogPages]     = useState(1);
  const [blogCharge, setBlogCharge]   = useState(false);
  const [articleErreur, setArticleErreur] = useState(false);
  const [politiquesRedigees, setPolitiquesRedigees] = useState<Record<string, boolean> | null>(null);   // slug → rédigée ? (null = pas encore lu)
  const [politique, setPolitique] = useState<{ slug: string; titre: string; contenu: string } | null>(null);
  const [politiqueStatut, setPolitiqueStatut] = useState<'idle' | 'loading' | 'err'>('idle');
  const politiqueEnCours = useRef('');
  const [categories, setCategories]   = useState<string[]>([]);
  const [filtreCat, setFiltreCat]     = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  // ── Sakura : recherche de l'en-tête ──
  const [rechEntete, setRechEntete] = useState('');
  const [rechCat, setRechCat] = useState('');
  const [cAge, setCAge] = useState('');
  const [cType, setCType] = useState('');
  const [cBudget, setCBudget] = useState('');
  // Filtres avancés du catalogue
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [seulPromo, setSeulPromo] = useState(false);
  const [seulStock, setSeulStock] = useState(false);
  const [tri, setTri] = useState<'recent' | 'prix-asc' | 'prix-desc' | 'nom'>('recent');
  const [acheteur, setAcheteur]     = useState<AcheteurUser | null>(null);
  const [nbPanier, setNbPanier]       = useState(0);
  const [vueCompte, setVueCompte]     = useState<'dashboard'|'panier'|'wishlist'|'avis'>('dashboard');
  const [avisPanier, setAvisPanier]   = useState('');
  const [loginForm, setLoginForm]     = useState({ email: '', mdp: '' });
  const [loginStatut, setLoginStatut] = useState<'idle'|'loading'|'err'>('idle');
  const [loginErreur, setLoginErreur] = useState('');
  const [inscVal, setInscVal]         = useState<Record<string, any>>({});
  const [inscStatut, setInscStatut]   = useState<'idle'|'loading'|'ok'>('idle');
  const [inscErreur, setInscErreur]   = useState('');
  const [honeypot, setHoneypot]       = useState('');
  const [sourisBougee, setSourisBougee] = useState(false);
  const debutInscription = useRef<number>(Date.now());
  const persoRef = useRef<PersoRef | null>(null);   // add-on « Produits personnalisés » : réponses de l'acheteur, lues au clic sur « Ajouter au panier »
  // Page produit : ces états sont ici (et non dans PageProduit) pour ne pas être remis à zéro quand la page se redessine
  const [photoIdx, setPhotoIdx]       = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [ongletActif, setOngletActif] = useState<'description'|'details'|'livraison'>('description');
  const ins = fusionInsc((rawSK as any).inscription);
  const produitsDemo = !!configBrut?.__produits_demo__;
  const [heureServeur, setHeureServeur] = useState<string | null>(null);   // heure du serveur (offres du jour, parution, enchères)
  const [enchereEtat, setEnchereEtat] = useState<Record<number, boolean>>({});   // add-on « Enchères » : enchère en cours par produit, lu en direct par le bloc de la fiche
  const enchActive = (x: ProduitCat) => enchereEtat[x.id] !== undefined ? enchereEtat[x.id] : !!x.enchere;
  const venteDirecteBloquee = (x: ProduitCat) => enchActive(x) && x.stock === 0;   // un seul exemplaire et il est réservé à l'enchère
  const [ouvertes, setOuvertes] = useState<Record<number, boolean>>({});   // Parution future : annonces dont le compte à rebours vient de finir
  const cfgParution = useConfigParution(vendeurId);
  const avisProd = useAvisProduit(vendeurId || 0, produitActif?.id, produitsDemo);   // add-on « Avis clients » : avis publiés du produit ouvert
  const avisReel = !!(avisProd.etat && avisProd.etat.actif && avisProd.etat.total > 0);
  const resumeAvis = () => { const e = avisProd.etat; return e && e.actif && e.total > 0 && e.afficher_moyenne ? { note: e.moyenne, nb: e.total } : null; };
  const { trackPageView } = useBoutiqueAnalytique(vendeurId, vendeurId > 0 && !configBrut?.__produits_demo__);   // add-on « Analytique » : rien n'est envoyé sans l'add-on, sans la bannière ou sans consentement
  const [faqOuvert, setFaqOuvert]     = useState<number | null>(null);
  const [contactEnvoi, setContactEnvoi] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [contactForm, setContactForm] = useState({ nom:'', courriel:'', message:'' });
  const [contactErr, setContactErr] = useState('');   // message d'erreur renvoyé par le serveur (ex. trop de messages)
  const [contactPiege, setContactPiege] = useState('');   // anti-bot : champ piège du formulaire de contact
  const debutContact = useRef(Date.now());              // anti-bot : délai minimum avant l'envoi
  const [varianteChoisie, setVarianteChoisie] = useState<Record<string, string>>({});
  const [qteChoisie, setQteChoisie]   = useState(1);


  useEffect(() => {
    const check = () => { setLarg(window.innerWidth); setIsMobile(Math.min(window.innerWidth, (window.screen && window.screen.width) || window.innerWidth) < 768); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Politiques légales (Configuration → Mes politiques) : lesquelles sont rédigées (un lien n'apparaît que si la politique l'est)
  useEffect(() => {
    fetch(`${API_BASE}/studio/politiques/${vendeurId}/public`).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !Array.isArray(d.politiques)) return;
      const m: Record<string, boolean> = {}; d.politiques.forEach((p: any) => { m[p.slug] = typeof p.contenu === 'string' && p.contenu.trim().length > 0; });
      setPolitiquesRedigees(m);
    }).catch(() => {});
  }, [vendeurId]);

  // Catalogue réel du serveur (prix en texte → nombres ; enchères, offres du jour et parutions incluses)
  const chargerCatalogue = useCallback(() => fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?limit=100`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      if (data.heure_serveur) setHeureServeur(String(data.heure_serveur));
      const decSrv = data.heure_serveur ? new Date(String(data.heure_serveur)).getTime() - Date.now() : 0;
      const liste: ProduitCat[] = (data.produits || data || []).map((x: any) => ({
        ...x, prix: Number(x.prix) || 0, prix_promo: x.prix_promo !== null && x.prix_promo !== undefined && x.prix_promo !== '' ? Number(x.prix_promo) : undefined,
        stock: x.stock !== null && x.stock !== undefined && x.stock !== '' ? Number(x.stock) : undefined, description: x.description || undefined, photo_principale: x.photo_principale || undefined,
        variantes: Array.isArray(x.variantes) ? x.variantes : [], paliers: Array.isArray(x.paliers) ? x.paliers : undefined,
        offre_fin: x.offre_fin || null, date_parution: x.date_parution || null,
        enchere: x.ench_fin ? { fin: x.ench_fin, mise: Number(x.ench_mise), nb_mises: Number(x.ench_nb) || 0, decalage: decSrv } : null,
      }));
      setProduits(liste);
      setCategories(Array.from(new Set(liste.map(p => p.categorie).filter(Boolean))) as string[]);
    }).catch(() => {}), [vendeurId]);

  // Charger produits — si démo hardcodée présente, l'utiliser directement
  useEffect(() => {
    if (configBrut?.__produits_demo__) {
      const liste = configBrut.__produits_demo__;
      setProduits(liste);
      const cats = Array.from(new Set(liste.map((p: any) => p.categorie).filter(Boolean))) as string[];
      setCategories(cats);
      return;
    }
    chargerCatalogue();
  }, [vendeurId, chargerCatalogue]);

  // Quand une offre se termine, la fiche ouverte reprend le vrai prix
  useEffect(() => { setProduitActif(a => { if (!a) return a; const n = produits.find(x => x.id === a.id); return n && (n.prix_promo !== a.prix_promo || n.offre_fin !== a.offre_fin) ? { ...a, prix_promo: n.prix_promo, offre_fin: n.offre_fin } : a; }); }, [produits]);

  // Add-on « Offres du jour » : lien du menu seulement s'il y a des offres en cours ; la page est lue au serveur (?offres=1), paginée
  const [nbOffres, setNbOffres] = useState(0);
  const [versionOffres, setVersionOffres] = useState(0);
  const compterOffres = useCallback(() => { if (produitsDemo) return; fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?offres=1&limit=1`).then(r => r.ok ? r.json() : null).then(d => { if (d && typeof d.total === 'number') setNbOffres(d.total); }).catch(() => {}); }, [vendeurId, produitsDemo]);
  useEffect(() => { compterOffres(); }, [compterOffres]);
  const OFFRES_PAR_PAGE = 24;
  const [offresListe, setOffresListe] = useState<ProduitCat[]>([]);
  const [offresTotal, setOffresTotal] = useState(0);
  const [offresPg, setOffresPg] = useState(1);
  const [offresCharge, setOffresCharge] = useState(false);
  const [offresErr, setOffresErr] = useState(false);
  useEffect(() => {
    if (page !== 'offres' || produitsDemo) return;
    let annule = false; setOffresErr(false);
    fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?offres=1&limit=${OFFRES_PAR_PAGE}&offset=${(offresPg - 1) * OFFRES_PAR_PAGE}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      if (annule) return;
      const l: ProduitCat[] = (Array.isArray(d.produits) ? d.produits : []).map((x: any) => ({ ...x, prix: Number(x.prix) || 0, prix_promo: x.prix_promo !== null && x.prix_promo !== undefined && x.prix_promo !== '' ? Number(x.prix_promo) : undefined, stock: x.stock !== null && x.stock !== undefined && x.stock !== '' ? Number(x.stock) : undefined, description: x.description || undefined, photo_principale: x.photo_principale || undefined, variantes: Array.isArray(x.variantes) ? x.variantes : [], offre_fin: x.offre_fin || null, date_parution: x.date_parution || null, enchere: null }));
      setOffresListe(l); setOffresTotal(Number(d.total) || 0); setOffresCharge(true);
    }).catch(() => { if (!annule) { setOffresErr(true); setOffresCharge(true); } });
    return () => { annule = true; };
  }, [page, offresPg, versionOffres, vendeurId, produitsDemo]);
  const rechargerOffres = useCallback(() => { if (!produitsDemo) chargerCatalogue(); compterOffres(); setVersionOffres(v => v + 1); }, [chargerCatalogue, compterOffres, produitsDemo]);
  const offreCtx = { heureServeur, onFini: () => { setTimeout(rechargerOffres, 1200); } };

  // Add-on « Enchères » : lien du menu seulement s'il y a au moins une enchère en cours ; la page lit la liste au serveur
  const [nbEncheres, setNbEncheres] = useState(0);
  const [encheresListe, setEncheresListe] = useState<any[]>([]);
  const [encheresProduits, setEncheresProduits] = useState<Record<number, ProduitCat>>({});
  const [encheresDec, setEncheresDec] = useState(0);
  const [encheresCharge, setEncheresCharge] = useState(false);
  const [encheresErr, setEncheresErr] = useState(false);
  const [versionEncheres, setVersionEncheres] = useState(0);
  useEffect(() => {
    if (produitsDemo) return;
    let annule = false;
    const compter = () => fetch(`${API_BASE}/boutique/encheres/${vendeurId}?limit=1`).then(r => r.ok ? r.json() : null).then(d => { if (!annule && d && d.pagination && typeof d.pagination.total === 'number') setNbEncheres(d.pagination.total); }).catch(() => {});
    compter(); const t = setInterval(compter, 60000);
    return () => { annule = true; clearInterval(t); };
  }, [vendeurId, produitsDemo]);
  useEffect(() => {
    if (page !== 'encheres' || produitsDemo) return;
    let annule = false; setEncheresErr(false);
    const lire = () => fetch(`${API_BASE}/boutique/encheres/${vendeurId}?limit=60`).then(r => r.ok ? r.json() : Promise.reject()).then(async d => {
      if (annule) return;
      const l: any[] = Array.isArray(d.encheres) ? d.encheres : [];
      setEncheresListe(l); setNbEncheres(d.pagination ? Number(d.pagination.total) || 0 : l.length); if (d.maintenant) setEncheresDec(new Date(d.maintenant).getTime() - Date.now()); setEncheresCharge(true);
      const ids = l.map(x => x.produit_id).filter((x: number) => Number.isInteger(x)).slice(0, 50);
      if (ids.length) { try { const r2 = await fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?ids=${ids.join(',')}&limit=50`); const c = r2.ok ? await r2.json() : null; if (!annule && c && Array.isArray(c.produits)) { const m: Record<number, ProduitCat> = {}; c.produits.forEach((x: any) => { m[Number(x.id)] = { ...x, prix: Number(x.prix) || 0, prix_promo: x.prix_promo != null && x.prix_promo !== '' ? Number(x.prix_promo) : undefined, stock: x.stock != null && x.stock !== '' ? Number(x.stock) : undefined, description: x.description || undefined, photo_principale: x.photo_principale || undefined, variantes: Array.isArray(x.variantes) ? x.variantes : [], enchere: null }; }); setEncheresProduits(m); } } catch { /* la carte reste visible, sans ouverture de fiche */ } }
    }).catch(() => { if (!annule) { setEncheresErr(true); setEncheresCharge(true); } });
    lire(); const t = setInterval(lire, 15000);
    return () => { annule = true; clearInterval(t); };
  }, [page, vendeurId, produitsDemo, versionEncheres]);

  // Blog de la boutique (Configuration → Mes blogs) : liste légère et paginée ; l'article complet se charge à son ouverture
  const versArticle = (x: any): ArticleBlog => ({ id: x.id, titre: x.titre, slug: x.slug, resume: x.extrait || undefined, photo: x.image_couverture || undefined, auteur: x.auteur || undefined, date_publication: x.date_publication || undefined, tags: Array.isArray(x.tags) ? x.tags : [], vues: x.vues });
  const chargerArticles = (p: number) => {
    if (!vendeurId) { if (Array.isArray(configBrut?.__articles_demo__)) setArticles(configBrut.__articles_demo__.map(versArticle)); setBlogCharge(true); return; }   // démonstration : articles d'exemple seulement

    fetch(`${API_BASE}/boutique/blog/${vendeurId}?page=${p}&limite=12`).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !Array.isArray(d.articles)) return;
      setBlogPage(d.page || p); setBlogPages(d.pages || 1);
      setArticles(prev => p === 1 ? d.articles.map(versArticle) : [...prev, ...d.articles.map(versArticle)]);
    }).catch(() => {}).finally(() => setBlogCharge(true));
  };
  useEffect(() => { chargerArticles(1); }, [vendeurId]);

  // Compte acheteur = celui du MV (mêmes clés que AppAcheteur)
  useEffect(() => {
    try { const u = localStorage.getItem(`mv_compte_${vendeurId}`), t = localStorage.getItem(`mv_token_${vendeurId}`); setAcheteur(u && t ? JSON.parse(u) : null); } catch { setAcheteur(null); }
  }, [vendeurId, page]);

  // Pastille du panier (panier du serveur)
  useEffect(() => {
    if (!acheteur) { setNbPanier(0); return; }
    ba(vendeurId, '/panier').then(r => { if (r.ok) setNbPanier((r.data.articles || []).reduce((s: number, a: any) => s + (a.quantite || 0), 0)); });
  }, [acheteur, vendeurId, page, vueCompte]);

  useEffect(() => { if (!avisPanier) return; const t = setTimeout(() => setAvisPanier(''), 4000); return () => clearTimeout(t); }, [avisPanier]);

  // Anti-bot du formulaire de contact : le délai se compte depuis l'ouverture de la page Contact
  useEffect(() => { if (page === 'contact') debutContact.current = Date.now(); }, [page]);

  // Anti-bot de l'inscription : champ piège + délai minimum + mouvement de souris
  useEffect(() => {
    if (page !== 'inscription') return;
    debutInscription.current = Date.now(); setSourisBougee(false);
    const bouge = () => setSourisBougee(true);
    window.addEventListener('mousemove', bouge, { once: true });
    return () => window.removeEventListener('mousemove', bouge);
  }, [page]);

  // Add-on « Analytique » : une page vue par changement de vue
  useEffect(() => {
    if (page === 'produit') { if (produitActif) trackPageView('/produit/' + produitActif.id, produitActif.titre); return; }
    if (page === 'politique') { trackPageView('/politique/' + (politiqueEnCours.current || '')); return; }
    if (page === 'article') { if (articleActif) trackPageView('/blog/' + (articleActif.slug || articleActif.id), articleActif.titre); return; }
    const noms: Record<string, [string, string]> = { accueil: ['/', 'Accueil'], catalogue: ['/catalogue', 'Catalogue'], blog: ['/blog', 'Blogue'], faq: ['/faq', 'FAQ'], contact: ['/contact', 'Contact'], offres: ['/offres', 'Offres du jour'], encheres: ['/encheres', 'Enchères'], login: ['/connexion', 'Connexion'], inscription: ['/inscription', 'Inscription'], compte: ['/compte', 'Compte'] };
    const n = noms[page]; if (n) trackPageView(n[0], n[1]);
  }, [page, produitActif?.id, articleActif?.id, trackPageView]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const ouvrirPolitique = useCallback((slugPol: string) => {
    politiqueEnCours.current = slugPol; setPolitique(null); setPolitiqueStatut('loading'); setPage('politique');
    fetch(`${API_BASE}/studio/politiques/${vendeurId}/public/${slugPol}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      if (politiqueEnCours.current !== slugPol) return;
      const p = d && d.politique; if (!p) throw new Error();
      setPolitique({ slug: slugPol, titre: String(p.titre || ''), contenu: typeof p.contenu === 'string' ? p.contenu : '' }); setPolitiqueStatut('idle');
    }).catch(() => { if (politiqueEnCours.current === slugPol) setPolitiqueStatut('err'); });
  }, [vendeurId]);

  const naviguer = useCallback((dest: string) => {
    setMenuOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (dest.toLowerCase() === 'panier') { setVueCompte('panier'); setPage('compte'); return; }
    const slugPol = slugPolitique(dest);
    if (slugPol) { ouvrirPolitique(slugPol); return; }
    const map: Record<string, PageId> = { accueil:'accueil', catalogue:'catalogue', blog:'blog', faq:'faq', 'a-propos':'a-propos', contact:'contact', compte:'compte', login:'login', inscription:'inscription', offres:'offres', encheres:'encheres', connexion:'login' };
    const cle = sansAccent(dest).replace(/\s+/g, '-');
    if (map[cle]) setPage(map[cle]);
  }, [ouvrirPolitique]);

  const voirProduit = (p: ProduitCat) => {
    setProduitActif(p);
    setQteChoisie(1);
    setVarianteChoisie({});
    setPhotoIdx(0); setDescExpanded(false); setOngletActif('description');
    setPage('produit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voirArticle = (a: ArticleBlog) => {
    setArticleActif(a); setArticleErreur(false);
    setPage('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (a.contenu === undefined && a.slug) {
      fetch(`${API_BASE}/boutique/blog/${vendeurId}/article/${encodeURIComponent(a.slug)}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
        if (!d || !d.article) throw new Error();
        setArticleActif(cur => cur && cur.id === a.id ? { ...cur, ...versArticle(d.article), contenu: String(d.article.contenu || '') } : cur);
      }).catch(() => setArticleErreur(true));
    }
  };

  // Add-on « Chatbot » : le widget (monté par SitePreview) demande d'ouvrir une page du site ; ce template sait les ouvrir sans recharger
  const navChatbot = useRef<(d: any) => void>(() => {});
  navChatbot.current = (d: any) => {
    if (!d || typeof d !== 'object') return; setMenuOuvert(false); window.scrollTo({ top: 0, behavior: 'smooth' });
    if (d.page === 'produit' && Number(d.produitId) > 0) { const pr = produits.find(x => Number(x.id) === Number(d.produitId)); if (pr) voirProduit(pr); else naviguer('catalogue'); return; }
    if (d.page === 'article' && typeof d.articleSlug === 'string') { voirArticle({ id: 0, titre: '', slug: d.articleSlug }); return; }
    if (d.page === 'politique' && typeof d.politiqueSlug === 'string' && POLITIQUES_SLUGS.includes(d.politiqueSlug)) { ouvrirPolitique(d.politiqueSlug); return; }
    if (d.page === 'faq' || d.page === 'a-propos' || d.page === 'blog' || d.page === 'contact' || d.page === 'catalogue') setPage(d.page);
  };
  useEffect(() => { const f = (e: Event) => navChatbot.current((e as CustomEvent).detail); window.addEventListener('boutique-chatbot-nav', f); return () => window.removeEventListener('boutique-chatbot-nav', f); }, []);

  // ── Panier (panier du serveur ; le compte acheteur est obligatoire) ───────
  const ajouterAuPanier = async (produit: ProduitCat) => {
    if (configBrut?.__produits_demo__) { setAvisPanier('Produit de démonstration : publiez vos annonces pour vendre.'); return; }
    if (!acheteur) { setAvisPanier('Connectez-vous pour ajouter au panier.'); naviguer('login'); return; }
    if (produit.date_parution && !ouvertes[produit.id]) { setAvisPanier(`Disponible le ${formaterDateParution(produit.date_parution)}`); return; }
    const plates = (produit.variantes || []).filter(v => v && !Array.isArray(v.valeurs));
    if (plates.length && !varianteChoisie.__v) { setAvisPanier('Choisissez une variante.'); return; }
    const variante = Object.values(varianteChoisie).join(' / ');
    let perso: Record<string, any> | undefined;
    if (persoRef.current) { const pp = await persoRef.current.preparer(); if (!pp.ok) { setAvisPanier(pp.erreur || 'Complétez la personnalisation.'); return; } perso = pp.personnalisation && Object.keys(pp.personnalisation).length ? pp.personnalisation : undefined; }
    const r = await ajouterAuPanierServeur(vendeurId, produit.id, qteChoisie, variante, perso);
    if (!r.ok) { setAvisPanier(messageAcheteur(r)); return; }
    setVueCompte('panier'); naviguer('compte');
  };
  const ouvrirCompte = () => { setVueCompte('dashboard'); naviguer(acheteur ? 'compte' : 'login'); };
  // Add-on « Favoris » : la liste de souhaits est une page de l'espace client (connecté) ; sinon on invite à se connecter
  const ouvrirSouhaits = () => { if (!acheteur) { setAvisPanier('Connectez-vous pour voir votre liste de souhaits.'); naviguer('login'); return; } setVueCompte('wishlist'); naviguer('compte'); };
  const ouvrirPanier = () => { if (!acheteur) { setAvisPanier('Connectez-vous pour voir votre panier.'); naviguer('login'); return; } setVueCompte('panier'); naviguer('compte'); };

  const handleLogin = async () => {
    setLoginStatut('loading'); setLoginErreur('');
    try {
      const res = await fetch(`${API_BASE}/marketplace/${vendeurId}/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'acheteur', email: loginForm.email, password: loginForm.mdp }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erreur');
      try { localStorage.setItem(`mv_token_${vendeurId}`, data.token); localStorage.setItem(`mv_compte_${vendeurId}`, JSON.stringify(data.compte)); } catch {}
      setAcheteur(data.compte);
      setLoginStatut('idle'); naviguer('compte');
    } catch (e: any) { setLoginErreur(e.message || 'Erreur'); setLoginStatut('err'); }
  };

  const handleInscription = async () => {
    setInscErreur('');
    const v = inscVal;
    if (v.mdp && v.mdp2 && v.mdp !== v.mdp2) return setInscErreur('Les mots de passe ne correspondent pas.');
    if (!(v.prenom || '').trim() || !(v.nom || '').trim()) return setInscErreur('Prénom et nom obligatoires.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v.email || '').trim())) return setInscErreur('Adresse courriel invalide.');
    if ((v.mdp || '').length < 8) return setInscErreur('Le mot de passe doit contenir au moins 8 caractères.');
    const tel = (v.telephone || '').trim();
    if (ins.telephone.mode === 'obligatoire' && !tel) return setInscErreur('Téléphone : obligatoire.');
    if (ins.telephone.mode !== 'cache' && tel && !/^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(tel)) return setInscErreur('Numéro de téléphone invalide (ex: 514-555-0100).');
    if (ins.adresse.mode !== 'cache') {
      const a = (v.adresse || '').trim(), vi = (v.ville || '').trim(), cpo = (v.code_postal || '').trim();
      if (ins.adresse.mode === 'obligatoire' || a || vi || cpo) {
        if (a.length < 3) return setInscErreur('Adresse invalide.');
        if (vi.length < 2) return setInscErreur('Ville invalide.');
        if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(cpo)) return setInscErreur('Code postal invalide (ex: H2X 1Y4).');
      }
    }
    const champs: Record<string, any> = {}; ins.champs.slice(0, 20).forEach((c: ChampInsc) => { const x = v['c_' + c.id]; champs[String(c.id).slice(0, 60)] = typeof x === 'boolean' ? x : nettoyerEnvoi(x, 1000); });
    setInscStatut('loading');
    try {
      const res = await fetch(`${API_BASE}/boutique/acheteur/${vendeurId}/inscription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        prenom: nettoyerEnvoi(v.prenom, 100), nom: nettoyerEnvoi(v.nom, 100), email: nettoyerEnvoi(v.email, 254), mot_de_passe: limiterSaisie(v.mdp, 200), confirmation: limiterSaisie(v.mdp2, 200),
        telephone: nettoyerEnvoi(v.telephone, 30), adresse: nettoyerEnvoi(v.adresse, 150), ville: nettoyerEnvoi(v.ville, 100), code_postal: nettoyerEnvoi(v.code_postal, 10), province: nettoyerEnvoi(v.province || 'QC', 4), infolettre: v.infolettre === true, age_confirme: v.age === true, termes_acceptes: v.termes === true, champs,
        duree_ms: Date.now() - debutInscription.current, souris: sourisBougee, website: limiterSaisie(honeypot, 100) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur lors de l'inscription.");
      setLoginForm({ email: (v.email || '').trim(), mdp: '' }); setInscStatut('ok');
    } catch (e: any) { setInscErreur(e.message || 'Erreur de connexion au serveur.'); setInscStatut('idle'); }
  };

  // ── Produits filtrés ──────────────────────────────────────────────────────
  const nombreSaisi = (v: string): number | null => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null; };
  const pMin = nombreSaisi(prixMin), pMax = nombreSaisi(prixMax);
  const prixEffectif = (p: ProduitCat) => (p.prix_promo && p.prix_promo < p.prix ? p.prix_promo : p.prix);
  const filtresActifs = !!(filtreCat || filtreRecherche || prixMin || prixMax || seulPromo || seulStock || tri !== 'recent');
  const reinitialiserFiltres = () => { setFiltreCat(''); setFiltreRecherche(''); setPrixMin(''); setPrixMax(''); setSeulPromo(false); setSeulStock(false); setTri('recent'); };
  const produitsFiltres = (() => {
    const l = produits.filter(p => {
      if (filtreCat && p.categorie !== filtreCat) return false;
      if (filtreRecherche) { const foin = sansAccent([p.titre, p.description, p.sku, p.categorie].filter(Boolean).join(' ')); if (!sansAccent(filtreRecherche).split(/\s+/).filter(Boolean).every(t => foin.includes(t))) return false; }   // chaque mot doit se trouver dans le titre, la description, le SKU ou la catégorie
      const px = prixEffectif(p);
      if (pMin !== null && px < pMin) return false;
      if (pMax !== null && px > pMax) return false;
      if (seulPromo && !(p.prix_promo && p.prix_promo < p.prix)) return false;
      if (seulStock && p.stock !== undefined && p.stock <= 0) return false;
      return true;
    });
    if (tri === 'prix-asc') l.sort((x, y) => prixEffectif(x) - prixEffectif(y));
    else if (tri === 'prix-desc') l.sort((x, y) => prixEffectif(y) - prixEffectif(x));
    else if (tri === 'nom') l.sort((x, y) => String(x.titre || '').localeCompare(String(y.titre || ''), 'fr'));
    return l;
  })();

  // ── Sections accueil triées ───────────────────────────────────────────────
  const sectionsAccueil = [...(cfg.accueil.sections || [])].sort((a, b) => a.ordre - b.ordre).filter(s => s.actif);

  // ── Envoi formulaire contact ──────────────────────────────────────────────
  const envoyerContact = async () => {
    const fin = (etat: 'ok' | 'err') => { setContactEnvoi(etat); setTimeout(() => setContactEnvoi('idle'), 4000); };
    const nom = nettoyerEnvoi(contactForm.nom, 100), courriel = nettoyerEnvoi(contactForm.courriel, 254), message = nettoyerEnvoi(contactForm.message, 5000);
    setContactErr('');
    if (!nom || !COURRIEL_OK.test(courriel)) { fin('err'); return; }
    if (message.length < 10) { setContactErr('Message trop court (minimum 10 caractères).'); fin('err'); return; }
    if (contactPiege) { setContactForm({ nom: '', courriel: '', message: '' }); fin('ok'); return; }   // champ piège rempli = robot : on fait semblant que c'est envoyé
    const duree = Date.now() - debutContact.current;
    if (duree < 3000) { setContactErr('Veuillez patienter quelques secondes avant d\'envoyer.'); fin('err'); return; }   // trop rapide pour un humain
    setContactEnvoi('loading');
    try {
      // Même route serveur que tous les templates : /api/studio/contact (anti-spam, quota et enregistrement dans Messagerie)
      const res = await fetch(`${API_BASE}/studio/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_expediteur: nom, email_expediteur: courriel, message, vendeur_id: vendeurId, template_id: 'boutique-sakura', honeypot: '', form_start_time: debutContact.current }),
      });
      if (!res.ok) { try { const j = await res.json(); if (j && typeof j.message === 'string') setContactErr(j.message.slice(0, 200)); } catch { /* réponse non JSON */ } throw new Error(); }
      setContactForm({ nom: '', courriel: '', message: '' });
      fin('ok');
    } catch {
      fin('err');
    }
  };

  // ── Sakura : actions ──────────────────────────────────────────────────────
  const h2Sec: React.CSSProperties = { fontSize: isMobile ? 34 : 48, fontWeight: 700, lineHeight: 1.05, color: 'var(--sk-t)', margin: 0, overflowWrap: 'anywhere' };
  const ouvrirRecherche = (q: string, cat = '') => { setFiltreCat(cat); setFiltreRecherche(nettoyerEnvoi(q, 100)); naviguer('catalogue'); };
  // Lien saisi par le gestionnaire : « catalogue », « blog », « contact »… · « cat:Jeux » (catégorie) · « chercheur » (section Chercheur de cadeau) · adresse https:// ou /chemin
  const allerChaine = (l: string) => {
    const s = nettoyerEnvoi(l, 300);
    if (/^cat:/i.test(s)) { allerLien('categorie', s.slice(4).trim()); return; }
    if (s.toLowerCase() === 'chercheur') { naviguer('accueil'); setTimeout(() => { const el = document.getElementById('sk-chercheur'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); return; }
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) { allerLien('url', s); return; }
    allerLien('page', s || 'catalogue');
  };
  // Chercheur de cadeau : les mots-clés des choix cherchent dans le titre, la description, le SKU et la catégorie ; le budget filtre le prix
  const lancerCadeau = (age: string[] | undefined, type: string[] | undefined, budget: string[] | undefined) => {
    const mots = [age && age[1], type && type[1]].filter(Boolean).join(' ');
    setFiltreCat(''); setFiltreRecherche(nettoyerEnvoi(mots, 100));
    setPrixMin(budget ? nbSur(budget[1]) : ''); setPrixMax(budget ? nbSur(budget[2]) : '');
    naviguer('catalogue');
  };

  // En-tête (couleurs réglables) : variables locales seulement, le reste du site garde son thème
  const ra: any = rawSK.accueil || {};
  const ent: any = { ...ENT_DEF, ...(ra.entete && typeof ra.entete === 'object' ? ra.entete : {}), pastille: { ...ENT_DEF.pastille, ...((ra.entete && ra.entete.pastille) || {}) }, barreHaut: { ...ENT_DEF.barreHaut, ...((ra.entete && ra.entete.barreHaut) || {}) } };
  const entFond = hexOk(ent.couleurFond, ENT_DEF.couleurFond), entNav = hexOk(ent.couleurNav, ENT_DEF.couleurNav), entTexte = hexOk(ent.couleurTexte, ENT_DEF.couleurTexte), entBarre = hexOk(ent.couleurBarre, ENT_DEF.couleurBarre);
  const couleurAccent = hexOk(ra.couleurAccent, COUL.bleu), couleurCarte = hexOk(ra.couleurCarte, COUL.marine), couleurViolet = hexOk(ra.couleurViolet, COUL.rose);
  const entSombre = luminance(entFond) < 0.6;
  const varsEntete = { '--sk-s': entFond, '--sk-s2': hexVersRgba(entTexte, 0.16), '--sk-t': entTexte, '--sk-t2': hexVersRgba(entTexte, 0.95), '--sk-d': hexVersRgba(entTexte, 0.7), '--sk-b': hexVersRgba(entTexte, 0.28) } as React.CSSProperties;
  const varsPanneau = { '--sk-s': '#ffffff', '--sk-s2': '#f4f4f5', '--sk-t': '#111111', '--sk-t2': '#333333', '--sk-d': '#666666', '--sk-b': '#e5e7eb' } as React.CSSProperties;
  const formRecherche = () => (
    <form role="search" onSubmit={e => { e.preventDefault(); setFiltreCat(rechCat); setFiltreRecherche(nettoyerEnvoi(rechEntete, 100)); setRechEntete(''); naviguer('catalogue'); }} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, maxWidth: 620, background: entFond, borderRadius: 18, padding: 4, gap: 4, border: `2px solid var(--sk-b)` }}>
      {ent.afficherCategories !== false && !isMobile && categories.length > 0 && (
        <select aria-label="Catégorie" value={rechCat} onChange={e => { const x = e.target.value; setRechCat(categories.includes(x) ? x : ''); }} style={{ background: hexVersRgba(entTexte, 0.1), color: entTexte, border: 'none', borderRadius: 18, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', maxWidth: 150, cursor: 'pointer', outline: 'none' }}>
          <option value="">Tout</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <input className="sk-rech" aria-label="Rechercher" value={rechEntete} onChange={e => setRechEntete(limiterSaisie(e.target.value, 100))} maxLength={100} placeholder="Rechercher…" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: entTexte, padding: '10px 12px', fontSize: 15, fontFamily: 'inherit' }} />
      <button type="submit" aria-label="Lancer la recherche" style={{ background: couleurAccent, color: '#ffffff', border: `2px solid var(--sk-b)`, width: 44, height: 44, borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico n="search" taille={20} /></button>
    </form>
  );

  // ── Styles communs ────────────────────────────────────────────────────────
  const styleInput: React.CSSProperties = { background: 'var(--sk-s2)', color: 'var(--sk-t)', width: '100%', padding: '12px 14px', border: '1.5px solid var(--sk-b)', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const styleBtn: React.CSSProperties  = { background: cp, color: surCp, border: 'none', borderRadius: 18, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' };

  // ══════════════════════════════════════════════════════════════════════════
  // NAV
  // ══════════════════════════════════════════════════════════════════════════
  const seuilStock = ra.seuilStock === undefined || ra.seuilStock === '' || ra.seuilStock === null ? 5 : Math.max(0, Math.min(99, parseInt(String(ra.seuilStock), 10) || 0));   // « Plus que N » : réglable, 0 = jamais
  const extras: CarteExtras = { clair: !sombre, gid: vendeurId > 0 ? vendeurId : undefined, connecte: !!acheteur, demo: produitsDemo, offre: offreCtx, seuilStock: seuilStock };
  // ── Menu du haut : entrées configurées (Config → Menu) ou, à défaut, le menu automatique (catalogue = méga-menu des vraies catégories) ──
  const entreesConfig = entreesMenuSures(rawSK.menu?.entrees);
  const masquesMenu: string[] = Array.isArray(rawSK.menu?.masques) ? rawSK.menu.masques : [];
  const libelleMenu = (id: string, defaut: string) => (typeof rawSK.menu?.[id] === 'string' && rawSK.menu[id].trim()) ? nettoyerEnvoi(rawSK.menu[id], 40) : defaut;
  const lienPage = (id: string, defaut: string): EntreeMenu => ({ id: 'd-' + id, label: libelleMenu(id, defaut), style: 'lien', type: 'page', cible: id, liens: [], colonnes: [], intro: '', promo: null });
  const entreesAuto = (): EntreeMenu[] => {
    const cats = categories.slice(0, 15);
    const cols: ColonneMenu[] = [];
    for (let k = 0; k < cats.length && cols.length < 3; k += 5) cols.push({ titre: cols.length === 0 ? 'Catégories' : '', liens: cats.slice(k, k + 5).map(c => ({ label: c, type: 'categorie' as const, cible: c })) });
    const catalogue: EntreeMenu = cats.length >= 2
      ? { id: 'd-catalogue', label: libelleMenu('catalogue', 'Nos produits'), style: 'mega', type: 'page', cible: 'catalogue', liens: [], colonnes: cols, intro: '', promo: null }
      : lienPage('catalogue', 'Nos produits');
    return ([lienPage('accueil', 'Accueil'), catalogue,
      ...(nbOffres > 0 ? [lienPage('offres', '🔥 Offres du jour')] : []), ...(nbEncheres > 0 ? [lienPage('encheres', '🌸 Enchères')] : []),
      lienPage('blog', 'Blog'), lienPage('faq', 'FAQ'), lienPage('a-propos', 'À propos'), lienPage('contact', 'Contact')] as EntreeMenu[])
      .filter(e => !masquesMenu.includes(e.cible));
  };
  const entreesMenu: EntreeMenu[] = entreesConfig.length > 0 ? entreesConfig : entreesAuto();
  const [menuOuvertId, setMenuOuvertId] = useState<string | null>(null);   // entrée dont le panneau est ouvert (survol, focus ou clic)
  const [mobileSous, setMobileSous] = useState<string | null>(null);
  const timerMenu = useRef<any>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const ouvrirMenu = (id: string) => { if (timerMenu.current) clearTimeout(timerMenu.current); setMenuOuvertId(id); };
  const fermerMenuTard = () => { if (timerMenu.current) clearTimeout(timerMenu.current); timerMenu.current = setTimeout(() => setMenuOuvertId(null), 180); };
  useEffect(() => {
    const dehors = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOuvertId(null); };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOuvertId(null); };
    document.addEventListener('mousedown', dehors); document.addEventListener('keydown', touche);
    return () => { document.removeEventListener('mousedown', dehors); document.removeEventListener('keydown', touche); if (timerMenu.current) clearTimeout(timerMenu.current); };
  }, []);
  // Ouvre la cible d'un lien du menu : page du site, catégorie du catalogue ou adresse (http(s) ou chemin interne)
  const allerLien = (type: 'page' | 'categorie' | 'url', cible: string) => {
    setMenuOuvertId(null); setMenuOuvert(false); setMobileSous(null);
    if (type === 'categorie') { setFiltreCat(cible); setFiltreRecherche(''); naviguer('catalogue'); return; }
    if (type === 'url') {
      const u = urlSure(cible); if (!u) return;
      if (/^https?:\/\//i.test(u)) { window.open(u, '_blank', 'noopener,noreferrer'); return; }
      const cle = u.replace(/^\/+/, '').split(/[?#]/)[0].toLowerCase(); naviguer(cle === 'connexion' ? 'login' : (cle || 'accueil')); return;
    }
    const cle = String(cible || '').replace(/^\/+/, '').split(/[?#]/)[0].toLowerCase();
    if (cle === 'catalogue') setFiltreCat('');
    naviguer(cle === 'connexion' ? 'login' : (cle || 'accueil'));
  };
  const entreeActive = (e: EntreeMenu) => e.type === 'page' && String(e.cible || '').replace(/^\/+/, '').toLowerCase() === page;
  const aSousMenu = (e: EntreeMenu) => (e.style === 'liste' && e.liens.length > 0) || (e.style === 'mega' && (e.colonnes.length > 0 || !!e.promo || !!e.intro));
  const styleLienPanneau: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--sk-t2)', fontSize: 14, padding: '7px 0', cursor: 'pointer', fontFamily: 'inherit' };

  const PanneauMenu = ({ e }: { e: EntreeMenu }) => {
    if (e.style === 'liste') {
      return (
        <div role="menu" style={{ ...varsPanneau, position: 'absolute', top: '100%', left: 0, minWidth: 220, background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '10px 18px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', zIndex: 200 }}>
          {e.liens.map((l, i) => <button key={i} role="menuitem" onClick={() => allerLien(l.type, l.cible)} style={styleLienPanneau}>{l.label}</button>)}
          {e.cible && <button onClick={() => allerLien(e.type, e.cible)} style={{ ...styleLienPanneau, color: cp, fontWeight: 700, borderTop: '1px solid var(--sk-b)', marginTop: 6, paddingTop: 10 }}>Tout voir →</button>}
        </div>
      );
    }
    return (
      <div role="menu" style={{ ...varsPanneau, position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--sk-s)', borderTop: '1px solid var(--sk-b)', borderBottom: '1px solid var(--sk-b)', boxShadow: '0 24px 50px rgba(0,0,0,0.4)', zIndex: 200 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', gap: 36, alignItems: 'flex-start' }}>
          {e.intro && <div style={{ width: 200, flexShrink: 0, color: 'var(--sk-d)', fontSize: 14, lineHeight: 1.6 }}><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{e.label}</div>{e.intro}</div>}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, e.colonnes.length)}, minmax(150px, 1fr))`, gap: 28 }}>
            {e.colonnes.map((c, ci) => (
              <div key={ci}>
                {c.titre && <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{c.titre}</div>}
                {c.liens.map((l, li) => <button key={li} role="menuitem" onClick={() => allerLien(l.type, l.cible)} style={styleLienPanneau}>{l.label}</button>)}
              </div>
            ))}
            {e.cible && <div><button onClick={() => allerLien(e.type, e.cible)} style={{ ...styleLienPanneau, color: cp, fontWeight: 700, padding: '7px 0' }}>Tout voir →</button></div>}
          </div>
          {e.promo && (
            <div style={{ width: 250, flexShrink: 0 }}>
              {e.promo.image && <img src={e.promo.image} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 18, display: 'block', marginBottom: 10 }} />}
              {e.promo.titre && <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 8 }}>{e.promo.titre}</div>}
              {e.promo.bouton && <button onClick={() => allerLien(e.promo!.type, e.promo!.cible)} style={{ background: cp, color: surCp, border: 'none', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{e.promo.bouton}</button>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Nav = () => { const cp = '#ffffff'; return (
    <>
    {ent.barreHaut.actif && (nettoyerEnvoi(ent.barreHaut.gauche, 160) || nettoyerEnvoi(ent.barreHaut.droite, 400)) && (
      <div style={{ background: entBarre, color: '#ffffff', fontSize: 14, fontWeight: 600 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '8px 14px' : '10px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>{nettoyerEnvoi(ent.barreHaut.gauche, 160)}</span>
          <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {listeCellules(ent.barreHaut.droite, 4, 2, 80).filter(c => c[0]).map((c, i) => (
              <button key={i} onClick={() => allerChaine(c[1] || 'contact')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{c[0]}</button>
            ))}
          </span>
        </div>
      </div>
    )}
    <nav ref={navRef} aria-label="Menu principal" style={{ ...varsEntete, position: 'sticky', top: 0, zIndex: 100, background: 'var(--sk-fond)', color: 'var(--sk-t)' }}>
      <div style={{ maxWidth: 1304, margin: '0 auto', padding: isMobile ? '8px 8px' : '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 6 : 10 }}>
        {isMobile && (
          <button onClick={() => setMenuOuvert(!menuOuvert)} aria-label="Menu" aria-expanded={menuOuvert}
            style={{ background: entFond, border: `2px solid var(--sk-b)`, borderRadius: 18, width: 42, height: 42, fontSize: 18, cursor: 'pointer', color: 'var(--sk-t)', padding: 0, lineHeight: 1, flexShrink: 0 }}>
            {menuOuvert ? '✕' : '☰'}
          </button>
        )}
        <button onClick={() => allerLien('page', 'accueil')} style={{ background: entFond, border: `2px solid var(--sk-b)`, borderRadius: 18, height: isMobile ? 48 : 64, padding: isMobile ? '0 14px' : '0 26px', fontSize: isMobile ? 20 : 26, fontWeight: 700, color: 'var(--sk-t)', cursor: 'pointer', flexShrink: 1, minWidth: 0, maxWidth: isMobile ? '46vw' : '34vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
          {logoUrl
            ? <img src={logoUrl} alt={cfg.footer.nomBoutique} style={{ height: isMobile ? 34 : 48, maxWidth: isMobile ? 130 : 220, objectFit: 'contain', display: 'block' }} />
            : cfg.footer.nomBoutique}
        </button>

        {!isMobile && ent.afficherRecherche !== false && <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>{formRecherche()}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 10 }}>
          {!isMobile && nettoyerEnvoi(ent.pastille.titre, 40) && (
            <button onClick={() => allerChaine(ent.pastille.lien || 'chercheur')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: hexVersRgba(entTexte, 0.1), border: `2px solid var(--sk-b)`, borderRadius: 999, padding: '10px 22px 10px 14px', flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', color: 'var(--sk-t)', textAlign: 'left', fontFamily: 'inherit' }}>
              <Ico n="gift" taille={32} epais={1.6} />
              <span><span className="sk-fh" style={{ display: 'block', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 }}>{nettoyerEnvoi(ent.pastille.titre, 40)}</span><span style={{ display: 'block', fontSize: 13, opacity: 0.85 }}>{nettoyerEnvoi(ent.pastille.sousTitre, 60)}</span></span>
            </button>
          )}
          {basculeOk && (
            <button onClick={basculerTheme} aria-label={sombre ? 'Passer au thème clair' : 'Passer au thème sombre'} title={sombre ? 'Thème clair' : 'Thème sombre'}
              style={{ background: 'none', border: 'none', borderRadius: 18, padding: '9px 8px', cursor: 'pointer', fontSize: 16, color: 'var(--sk-t2)' }}>{sombre ? '☀️' : '🌙'}</button>
          )}
          {vendeurId > 0 && <BoutiqueSouhaitsAcces clair={!entSombre} gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo} ouvrir={ouvrirSouhaits} variante="entete" />}
          <button onClick={ouvrirCompte} aria-label={acheteur ? 'Mon compte' : 'Se connecter'} title={acheteur ? (acheteur.prenom || 'Mon compte') : 'Connexion'}
            style={{ background: entFond, border: `2px solid var(--sk-b)`, borderRadius: 18, width: isMobile ? 42 : 56, height: isMobile ? 42 : 56, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, position: 'relative', color: 'var(--sk-t)', padding: 0 }}>{acheteur ? '👤' : '🔑'}{acheteur && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#4ade80', border: `1.5px solid ${entFond}` }} />}</button>
          {ent.afficherChat !== false && !isMobile && (
            <button onClick={() => allerLien('page', 'contact')} aria-label="Nous écrire" title="Nous écrire"
              style={{ background: entFond, border: `2px solid var(--sk-b)`, borderRadius: 18, width: isMobile ? 42 : 56, height: isMobile ? 42 : 56, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, position: 'relative', color: 'var(--sk-t)', padding: 0 }}>💬</button>
          )}
          <button onClick={ouvrirPanier} aria-label="Panier"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, background: entFond, border: `2px solid var(--sk-b)`, borderRadius: 18, height: isMobile ? 42 : 56, padding: '0 16px', cursor: 'pointer', color: 'var(--sk-t)', fontSize: 17 }}>
            🛒{nbPanier > 0 && <span style={{ background: '#4a2b2b', color: '#ffffff', borderRadius: 18, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>{nbPanier}</span>}
          </button>
        </div>
      </div>

      {isMobile && ent.afficherRecherche !== false && <div style={{ padding: '0 12px 12px', display: 'flex' }}>{formRecherche()}</div>}
      {!isMobile && entreesMenu.length > 0 && (
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{ maxWidth: 1304, margin: '0 auto', background: entNav, border: `2px solid var(--sk-b)`, borderRadius: 18, padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: '100%' }}>
            {entreesMenu.map(e => {
              const sous = aSousMenu(e); const ouvert = menuOuvertId === e.id; const actif = entreeActive(e);
              return (
                <div key={e.id} onMouseEnter={() => { if (sous) ouvrirMenu(e.id); }} onMouseLeave={() => { if (sous) fermerMenuTard(); }} style={{ position: e.style === 'liste' ? 'relative' : 'static', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <button aria-haspopup={sous ? 'menu' : undefined} aria-expanded={sous ? ouvert : undefined}
                    onFocus={() => { if (sous) ouvrirMenu(e.id); }}
                    onClick={() => { if (sous) { setMenuOuvertId(ouvert ? null : e.id); } else allerLien(e.type, e.cible); }}
                    style={{ background: 'none', border: 'none', borderBottom: actif || ouvert ? '3px solid #4a2b2b' : '3px solid transparent', borderRadius: 0, color: entTexte, fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '14px 16px', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {e.label}{sous && <span aria-hidden="true" style={{ fontSize: 10, opacity: 0.7 }}>{ouvert ? '▴' : '▾'}</span>}
                  </button>
                  {sous && ouvert && <PanneauMenu e={e} />}
                </div>
              );
            })}
          </div>
        )}

          </div>
        </div>
      )}

      {/* Menu mobile : accordéon (pas de survol sur téléphone) */}
      {isMobile && menuOuvert && (
        <div style={{ background: 'var(--sk-s)', borderTop: '1px solid var(--sk-b)', padding: '8px 20px 14px', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {entreesMenu.map(e => {
            const sous = aSousMenu(e); const ouvert = mobileSous === e.id; const actif = entreeActive(e);
            const liensPlats: LienMenu[] = e.style === 'liste' ? e.liens : e.colonnes.flatMap(c => c.liens);
            return (
              <div key={e.id} style={{ borderBottom: '1px solid var(--sk-b)' }}>
                <button onClick={() => { if (sous) setMobileSous(ouvert ? null : e.id); else allerLien(e.type, e.cible); }} aria-expanded={sous ? ouvert : undefined}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: actif ? cp : 'var(--sk-t)', fontSize: 16, fontWeight: actif ? 700 : 600, cursor: 'pointer', padding: '14px 4px', fontFamily: 'inherit' }}>
                  <span>{e.label}</span>{sous && <span aria-hidden="true">{ouvert ? '▴' : '▾'}</span>}
                </button>
                {sous && ouvert && (
                  <div style={{ padding: '0 4px 10px 12px' }}>
                    {liensPlats.map((l, i) => <button key={i} onClick={() => allerLien(l.type, l.cible)} style={{ ...styleLienPanneau, fontSize: 15, padding: '9px 0' }}>{l.label}</button>)}
                    {e.cible && <button onClick={() => allerLien(e.type, e.cible)} style={{ ...styleLienPanneau, fontSize: 15, padding: '9px 0', color: cp, fontWeight: 700 }}>Tout voir →</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </nav>
    </>
  ); };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE ACCUEIL
  // ══════════════════════════════════════════════════════════════════════════
  const PageAccueil = () => {
    const produitsVedette  = produits.filter((_, i) => i < 4);
    const produitsNouveaux = produits.filter((_, i) => i < 4);
    const produitsPromo    = produits.filter(p => p.prix_promo && p.prix_promo < p.prix).slice(0, 4);

    // ── Aides de rendu de l'accueil ──
    const section = (key: string, fond: string, enfant: React.ReactNode, large = 1400) => (
      <div key={key} style={{ background: fond }}><div style={{ maxWidth: large, margin: '0 auto', padding: isMobile ? '40px 16px' : '64px 32px' }}>{enfant}</div></div>
    );
    const sousTitreStyle: React.CSSProperties = { fontSize: isMobile ? 16 : 18, lineHeight: 1.55, color: 'var(--sk-t2)', margin: '10px 0 0', maxWidth: 720 };
    // Rangée de produits qui défile (Meilleurs vendeurs, Nouveautés, Sélection) : catégorie facultative, sinon les premiers produits
    const rangee = (key: string, r: any, defTitre: string, liste: ProduitCat[]) => {
      const cat = nettoyerEnvoi(r.categorie, 80);
      const nb = Math.max(2, Math.min(24, parseInt(r.nombre, 10) || 12));
      const l = (cat ? liste.filter(p => p.categorie === cat) : liste).slice(0, nb);
      if (l.length === 0) return null;
      const ti = nettoyerEnvoi(r.titre, 120) || defTitre, so = nettoyerEnvoi(r.sousTitre, 200);
      return (
        <div key={key}>
          <TitreSection titre={ti} sous={so} isMobile={isMobile} />
          <Defilant fleche="#ffffff" flecheTexte="var(--sk-b)">
            {l.map(p => <div key={p.id} style={{ flex: '0 0 auto', width: isMobile ? 200 : 290, scrollSnapAlign: 'start' }}><CarteProduit produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(p)} /></div>)}
          </Defilant>
        </div>
      );
    };
    // Cartes de promotion (texte à gauche, photo à droite) : couleur réglable
    const rendreTuiles = (key: string, liste: any, dispo: any) => {
      const tu = listeObjets(liste, 4).filter(t => t.titre || t.photo);
      if (tu.length === 0) return null;
      return (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 260 : 440}px, 1fr))`, gap: isMobile ? 8 : 10 }}>
          {tu.map((t, i) => {
            const img = urlSure(t.photo), bg = hexOk(t.couleur, i % 2 ? '#f1d5b6' : '#e8c7a3'), ti = nettoyerEnvoi(t.titre, 100), tx = nettoyerEnvoi(t.texte, 200), b = nettoyerEnvoi(t.bouton, 30);
            const clic = () => allerChaine(nettoyerEnvoi(t.lien, 300));
            return (
              <div key={i} role="link" tabIndex={0} onClick={clic} onKeyDown={e => { if (e.key === 'Enter') clic(); }} style={{ ...HL_J, display: 'flex', flexDirection: isMobile ? 'column' : 'row', borderRadius: 18, overflow: 'hidden', background: bg, color: (luminance(bg) > 0.5 ? '#4a2b2b' : '#ffffff'), border: '2px solid var(--sk-b)', minHeight: isMobile ? 0 : 340, cursor: 'pointer' }}>
                <div style={{ flex: '1 1 55%', minWidth: 0, padding: isMobile ? '24px 20px' : '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                  {ti && <h3 className="sk-fh" style={{ fontSize: isMobile ? 30 : 40, lineHeight: 1.06, margin: '0 0 14px', overflowWrap: 'anywhere' }}><TitreGrad texte={ti} /></h3>}
                  {tx && <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.6, color: 'inherit', margin: 0 }}>{tx}</p>}
                  {b && <span className="sk-pill" style={{ marginTop: 20 }}>{b}</span>}
                </div>
                {img && <div style={{ flex: '1 1 45%', minHeight: isMobile ? 220 : 0, background: `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat` }} />}
              </div>
            );
          })}
        </div>
      );
    };

    const renderSection = (sec: SectionPage) => {
      switch (sec.id) {
        case 'banniere':
          return <Banniere key={sec.id} cfg={cfg.accueil.banniere} />;

        case 'avantages': {
          // Engagements en cartes avec une pastille d'icône inclinée : vos vrais engagements. Exemples seulement en démonstration.
          const avSaisis = (Array.isArray(cfg.accueil.avantages) ? cfg.accueil.avantages : []).filter(a => a && (a.titre || a.desc));
          const avExemples = [{ ico: '🚚', titre: 'Livraison', desc: 'Exemple de démonstration : décrivez ici votre engagement.' }, { ico: '🌸', titre: 'En boutique', desc: 'Exemple de démonstration : retrait, conseils…' }];
          const avListe = avSaisis.length > 0 ? avSaisis : (configBrut?.__produits_demo__ ? avExemples : []);
          if (avListe.length === 0) return null;
          return (
            <div key={sec.id} style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 240 : 320}px, 1fr))`, gap: isMobile ? 46 : 36, paddingTop: 40 }}>
              {avListe.slice(0, 6).map(({ ico, titre, desc }, i) => (
                <div key={i} style={{ position: 'relative', background: 'var(--sk-s2)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '54px 18px 24px' : '62px 28px 30px', textAlign: 'center' }}>
                  <div aria-hidden="true" style={{ position: 'absolute', top: -38, left: '50%', width: 78, height: 78, marginLeft: -39, borderRadius: 18, background: cp, border: '2px solid var(--sk-b)', transform: `rotate(${i % 2 ? 6 : -6}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{nettoyerEnvoi(ico, 4)}</div>
                  <h3 className="sk-fh" style={{ fontSize: isMobile ? 22 : 26, lineHeight: 1.15, margin: '0 0 10px', color: 'var(--sk-t)', overflowWrap: 'anywhere' }}>{nettoyerEnvoi(titre, 60)}</h3>
                  {desc && <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--sk-t2)', margin: 0, overflowWrap: 'anywhere' }}>{nettoyerEnvoi(desc, 160)}</p>}
                </div>
              ))}
            </div>
          );
        }

        case 'etapes': {
          // Points forts numérotés à côté d'une image
          const e: any = ra.etapes || {};
          const items = listeCellules(e.items, 6, 2, 400).filter(x => x[0]);
          const img = urlSure(e.photo), ti = nettoyerEnvoi(e.titre, 120), bo = nettoyerEnvoi(e.bouton, 30);
          if (!ti && items.length === 0) return null;
          return (
            <div key={sec.id} style={{ display: 'grid', gridTemplateColumns: isMobile || !img ? '1fr' : '1fr 1fr', gap: isMobile ? 8 : 10 }}>
              {img && <div role="img" aria-label={ti || 'Image'} style={{ borderRadius: 18, minHeight: isMobile ? 260 : 520, background: `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` }} />}
              <div style={{ ['--sk-hl' as any]: '#e0525c', background: 'var(--sk-s)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '24px 18px' : '40px 36px' }}>
                {ti && <h2 style={{ ...h2Sec, marginBottom: 24 }}><TitreGrad texte={ti} /></h2>}
                {items.map((x, k) => (
                  <div key={k} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div aria-hidden="true" className="sk-fh" style={{ flex: '0 0 auto', width: 52, height: 52, borderRadius: '50%', border: '3px solid #4a2b2b', color: '#4a2b2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{k + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 16, marginBottom: 4, overflowWrap: 'anywhere' }}>{x[0]}</div>
                      {x[1] && <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--sk-t2)', margin: 0, overflowWrap: 'anywhere' }}>{x[1]}</p>}
                    </div>
                  </div>
                ))}
                {bo && <button onClick={() => allerChaine(nettoyerEnvoi(e.lien, 300))} className="sk-pill" style={{ marginTop: 6 }}>{bo}</button>}
              </div>
            </div>
          );
        }

        case 'accordeon':
        case 'accordeon2': {
          // Questions / réponses (ex. composition, garanties, FAQ) : « Question | Réponse », une ligne par bloc
          const a: any = (sec.id === 'accordeon2' ? ra.accordeon2 : ra.accordeon) || {};
          const items = listeCellules(a.items, 20, 2, 900).filter(x => x[0]);
          const ti = nettoyerEnvoi(a.titre, 120);
          if (items.length === 0) return null;
          return (
            <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8 }}>
              {ti && <div style={{ ['--sk-hl' as any]: '#e0525c', background: 'var(--sk-s)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '18px 12px' : '26px 20px', textAlign: 'center' }}><h2 style={{ ...h2Sec, color: '#4a2b2b', fontSize: isMobile ? 30 : 42 }}><TitreGrad texte={ti} /></h2></div>}
              <Accordeon items={items} isMobile={isMobile} />
            </div>
          );
        }

        case 'pastilles': {
          // Grille de garanties : « symbole | texte » (un emoji e-Vend) dans des pastilles rondes
          const pa: any = ra.pastilles || {};
          const items = listeCellules(pa.items, 12, 2, 60).filter(x => x[0] || x[1]);
          const ti = nettoyerEnvoi(pa.titre, 120);
          if (items.length === 0) return null;
          return (
            <div key={sec.id}>
              {ti && <TitreSection titre={ti} isMobile={isMobile} centre />}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? 22 : 34 }}>
                {items.map((x, k) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    {x[1] ? <div aria-hidden="true" style={{ width: isMobile ? 84 : 104, height: isMobile ? 84 : 104, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--sk-s2)', border: '2px solid var(--sk-b)', boxShadow: '0 4px 12px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 36 : 46, overflow: 'hidden' }}>{nettoyerEnvoi(x[0], 8)}</div> : null}
                    <div className="sk-fh" style={{ fontSize: isMobile ? 16 : 20, lineHeight: 1.2, color: 'var(--sk-t)', overflowWrap: 'anywhere' }}>{x[1] || x[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        case 'comparatif': {
          // Tableau comparatif saisi à la main : produits « photo | nom | prix | lien », critères « critère | valeur 1 | valeur 2 … » (oui / non = pastilles ✓ / ✗)
          const c: any = ra.comparatif || {};
          const prods = listeCellules(c.produits, 4, 4, 300).filter(x => x[1]);
          const crit = listeCellules(c.criteres, 12, 5, 80).filter(x => x[0]);
          if (prods.length === 0) return null;
          const n = prods.length, cL = isMobile ? 110 : 200, cP = isMobile ? 130 : 160;
          const bord = '2px solid var(--sk-b)';
          return (
            <div key={sec.id}>
              <TitreSection titre={c.titre} sous={c.sousTitre} isMobile={isMobile} centre />
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: bord, borderRadius: 18, background: 'var(--sk-s2)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `minmax(${cL}px, 1.2fr) repeat(${n}, minmax(${cP}px, 1fr))`, minWidth: cL + n * cP }}>
                  <div className="sk-fh" style={{ display: 'flex', alignItems: 'center', padding: 16, fontSize: isMobile ? 20 : 26, color: 'var(--sk-t)' }}>{nettoyerEnvoi(c.libelle, 40) || 'Nos produits'}</div>
                  {prods.map((x, k) => {
                    const img = urlSure(x[0]);
                    return (
                      <div key={k} style={{ borderLeft: bord, padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ height: isMobile ? 100 : 130, borderRadius: 18, border: bord, background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` : 'var(--sk-s)' }} />
                        <div className="sk-fh" style={{ fontSize: 15, margin: '10px 0 4px', overflowWrap: 'anywhere' }}>{x[1]}</div>
                        {x[2] && <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{x[2]}</div>}
                        {x[3] && <button onClick={() => allerChaine(x[3])} className="sk-pill" style={{ padding: '6px 16px', fontSize: 13 }}>Voir</button>}
                      </div>
                    );
                  })}
                  {crit.map((r, k) => (
                    <Fragment key={k}>
                      <div className="sk-fh" style={{ borderTop: bord, display: 'flex', alignItems: 'center', padding: '14px 16px', fontSize: isMobile ? 16 : 20, color: 'var(--sk-t)', overflowWrap: 'anywhere' }}>{r[0]}</div>
                      {prods.map((_, j) => <div key={j} style={{ borderTop: bord, borderLeft: bord, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', fontSize: 15, textAlign: 'center', overflowWrap: 'anywhere' }}><CelluleOuiNon v={r[j + 1] || ''} /></div>)}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        case 'parcourir': {
          // « Magasiner … [liste de catégories] » : vrais produits de la boutique, catégorie choisie par le visiteur
          const r: any = ra.parcourir || {};
          if (produits.length === 0) return null;
          return <RangeeFiltre key={sec.id} titre={nettoyerEnvoi(r.titre, 80) || 'Magasiner la catégorie'} categories={categories} produits={produits} nombre={Math.max(2, Math.min(12, parseInt(r.nombre, 10) || 6))} isMobile={isMobile} rendre={p => <CarteProduit produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(p)} />} />;
        }

        case 'onde': {
          const o: any = ra.onde || {};
          const msgs = listeLignes(o.messages, 6, 80);
          if (msgs.length === 0) return null;
          return <Onde key={sec.id} msgs={msgs} isMobile={isMobile} />;
        }

        case 'grostexte': {
          // Grand texte centré avec de petites photos arrondies au milieu des mots : {1} {2} {3} {4} = photo 1 à 4
          const g: any = ra.grostexte || {};
          const tx = nettoyerEnvoi(g.texte, 400); if (!tx) return null;
          const phs = listeLignes(g.photos, 4, 400).map(urlSure);
          const sous = nettoyerEnvoi(g.sousTexte, 500), bo = nettoyerEnvoi(g.bouton, 30);
          return (
            <div key={sec.id} style={{ textAlign: 'center', maxWidth: 1000, margin: '0 auto' }}>
              <h2 className="sk-fh" style={{ fontSize: isMobile ? 26 : 46, lineHeight: isMobile ? 1.9 : 1.75, color: 'var(--sk-t)', margin: 0, overflowWrap: 'anywhere' }}>
                {tx.split(/(\{[1-4]\})/).map((x, i) => {
                  const m = /^\{([1-4])\}$/.exec(x);
                  if (m) { const u = phs[Number(m[1]) - 1]; return u ? <span key={i} role="img" aria-label="Photo" style={{ display: 'inline-block', verticalAlign: 'middle', width: isMobile ? 88 : 210, height: isMobile ? 46 : 86, borderRadius: 18, border: '2px solid var(--sk-b)', margin: '0 6px', background: `url("${encodeURI(u).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` }} /> : null; }
                  return <TitreGrad key={i} texte={x} />;
                })}
              </h2>
              {sous && <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.7, color: 'var(--sk-t)', margin: '22px auto 0', maxWidth: 820, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{sous}</p>}
              {bo && <div style={{ marginTop: 24 }}><button onClick={() => allerChaine(nettoyerEnvoi(g.lien, 300))} className="sk-pill">{bo}</button></div>}
            </div>
          );
        }

        case 'vitrine': {
          const v: any = ra.vitrine || {};
          const cat = nettoyerEnvoi(v.categorie, 80);
          const nb = Math.max(2, Math.min(6, parseInt(v.nombre, 10) || 4));
          const l = (cat ? produits.filter(p => p.categorie === cat) : produits).slice(0, nb);
          const pts = listeCellules(v.points, 4, 3, 300);
          if (!urlSure(v.photo) && l.length === 0) return null;
          return <Vitrine key={sec.id} photo={String(v.photo == null ? '' : v.photo)} points={pts} produits={l} bouton={nettoyerEnvoi(v.bouton, 30)} isMobile={isMobile} onLien={allerChaine} onProduit={voirProduit} afficherPrix={cfg.catalogue.afficherPrix} />;
        }

        case 'trouveur': {
          // Question avec réponses A, B, C… : chaque réponse ouvre la catégorie ou la page choisie par le gestionnaire
          const t: any = ra.trouveur || {};
          const q = nettoyerEnvoi(t.titre, 160), opts = listeCellules(t.options, 6, 2, 300).filter(x => x[0]);
          if (!q || opts.length === 0) return null;
          const img = urlSure(t.photo), et = nettoyerEnvoi(t.etiquette, 40);
          return (
            <div key={sec.id} style={{ display: 'grid', gridTemplateColumns: isMobile || !img ? '1fr' : '1fr 1fr', border: '2px solid var(--sk-b)', borderRadius: 18, overflow: 'hidden', background: 'var(--sk-s)' }}>
              <div style={{ padding: isMobile ? '24px 16px' : '40px 44px' }}>
                {et && <div className="sk-fh" style={{ fontSize: isMobile ? 26 : 40, color: 'var(--sk-t)', marginBottom: 14 }}>{et}</div>}
                <h2 className="sk-fh" style={{ fontSize: isMobile ? 22 : 28, lineHeight: 1.25, color: 'var(--sk-t)', margin: '0 0 22px', overflowWrap: 'anywhere' }}>{q}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {opts.map((x, i) => (
                    <button key={i} onClick={() => allerChaine(x[1] || 'catalogue')} style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', background: 'var(--sk-fond)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '12px 12px' : '16px 18px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--sk-t)' }}>
                      <span aria-hidden="true" className="sk-fh" style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%', border: '2px solid var(--sk-b)', background: 'var(--sk-s)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{'ABCDEF'[i]}</span>
                      <span className="sk-fh" style={{ fontSize: isMobile ? 17 : 20, overflowWrap: 'anywhere' }}>{x[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              {img && <div role="img" aria-label={q} style={{ minHeight: isMobile ? 260 : 480, borderLeft: isMobile ? 'none' : '2px solid var(--sk-b)', borderTop: isMobile ? '2px solid var(--sk-b)' : 'none', background: `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s2)` }} />}
            </div>
          );
        }

        case 'galerie': {
          // Rangée de photos inclinées (vos propres photos) : « photo | lien »
          const ga: any = ra.galerie || {};
          const items = listeCellules(ga.items, 8, 2, 400).filter(x => urlSure(x[0]));
          if (items.length === 0) return null;
          return (
            <div key={sec.id}>
              <TitreSection titre={ga.titre} sous={ga.sousTitre} isMobile={isMobile} centre />
              <Defilant fleche="#ffffff" flecheTexte="var(--sk-b)">
                {items.map((x, i) => {
                  const u = urlSure(x[0]);
                  return <button key={i} onClick={() => x[1] && allerChaine(x[1])} aria-label="Photo" style={{ flex: '0 0 auto', width: isMobile ? 170 : 230, height: isMobile ? 210 : 290, borderRadius: 18, border: '2px solid var(--sk-b)', padding: 0, cursor: x[1] ? 'pointer' : 'default', transform: `rotate(${i % 2 ? 2 : -2}deg)`, margin: '10px 4px', scrollSnapAlign: 'start', background: `url("${encodeURI(u).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` }} />;
                })}
              </Defilant>
            </div>
          );
        }

        case 'grandnom': {
          const gn: any = ra.grandnom || {};
          const tx = nettoyerEnvoi(gn.texte, 40);
          if (!tx) return null;
          return <div key={sec.id} aria-hidden="true" className="sk-fh" style={{ textAlign: 'center', fontSize: isMobile ? 'clamp(48px, 17vw, 90px)' : 'clamp(80px, 13vw, 190px)', lineHeight: 1.05, color: '#e0525c', WebkitTextStroke: '2px var(--sk-b)', textShadow: '5px 5px 0 var(--sk-b)', overflow: 'hidden', overflowWrap: 'anywhere', padding: '10px 0' }}>{tx}</div>;
        }

        case 'ticker':
          return <Ticker key={sec.id} cfg={ra.ticker} onLien={allerChaine} />;

        case 'hero': {
          // Diaporama réglable (Config → Accueil) ; vide : le Hero simple de l'ancienne config s'affiche comme une seule diapositive
          const slidesCfg = listeObjets(ra.diaporama, 6).filter(s => s.titre || s.photo);
          const h = cfg.accueil.hero;
          const slides = (slidesCfg.length > 0 ? slidesCfg : (h && (h.titre || h.photo) ? [{ titre: h.titre, texte: h.sousTitre, bouton: h.boutonLabel, lien: h.boutonLien, photo: h.photo, couleurFond: h.couleurFond }] : [])).map((s: any) => ({ titre: nettoyerEnvoi(s.titre, 120), texte: nettoyerEnvoi(s.texte, 260), photo: String(s.photo == null ? '' : s.photo), bouton: nettoyerEnvoi(s.bouton, 30), lien: nettoyerEnvoi(s.lien, 300), couleurFond: String(s.couleurFond || ''), surtitre: nettoyerEnvoi(s.surtitre, 60) }));
          return <Diaporama key={sec.id} slides={slides} isMobile={isMobile} onLien={allerChaine} />;
        }

        case 'vedette':
          return rangee(sec.id, ra.vedette || {}, 'Meilleurs vendeurs', produits);

        case 'bandeau': {
          // Grandes bannières : photo pleine largeur, texte centré, un ou deux boutons
          const bans = listeObjets(ra.bandeaux, 4).filter(b => b.titre || b.photo);
          if (bans.length === 0) return null;
          return (
            <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
              {bans.map((b, i) => {
                const img = urlSure(b.photo), ti = nettoyerEnvoi(b.titre, 120), so = nettoyerEnvoi(b.sousTitre, 160), bo = nettoyerEnvoi(b.bouton, 30), bo2 = nettoyerEnvoi(b.bouton2, 30);
                return (
                  <div key={i} style={{ ['--sk-hl' as any]: '#f6b6b0', position: 'relative', borderRadius: 18, overflow: 'hidden', border: '2px solid var(--sk-b)', minHeight: isMobile ? 420 : 520, background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` : hexOk(b.couleurFond, '#f6b6b0'), display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(5,6,15,0.45)' }} />
                    <div style={{ position: 'relative', padding: isMobile ? '28px 18px' : '40px 32px', maxWidth: 900 }}>
                      {ti && <h2 className="sk-fh" style={{ ...h2Sec, color: '#fff', fontSize: isMobile ? 34 : 62 }}><TitreGrad texte={ti} /></h2>}
                      {so && <p style={{ fontSize: isMobile ? 16 : 20, lineHeight: 1.5, color: '#ffe9e6', margin: '14px 0 0' }}>{so}</p>}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
                        {bo && <button onClick={() => allerChaine(nettoyerEnvoi(b.lien, 300))} className="sk-pill">{bo}</button>}
                        {bo2 && <button onClick={() => allerChaine(nettoyerEnvoi(b.lien2, 300))} className="sk-pill" style={{ background: 'transparent', borderColor: '#ffffff' }}>{bo2}</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        case 'presentation': {
          // À propos : titre et texte, avec une photo facultative (à gauche ou à droite)
          const p: any = ra.presentation || {};
          const ti = nettoyerEnvoi(p.titre, 120); if (!ti) return null;
          const tx = nettoyerEnvoi(p.texte, 900), bo = nettoyerEnvoi(p.bouton, 30), img = urlSure(p.photo);
          const carteTexte = (
            <div style={{ ['--sk-hl' as any]: '#e0525c', background: 'var(--sk-s)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '26px 18px' : '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ ...h2Sec, marginBottom: 18 }}><TitreGrad texte={ti} /></h2>
              {tx && <p style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1.7, color: 'var(--sk-t2)', margin: 0, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{tx}</p>}
              {bo && <div><button onClick={() => allerChaine(nettoyerEnvoi(p.lien, 300))} className="sk-pill" style={{ marginTop: 24 }}>{bo}</button></div>}
            </div>
          );
          if (!img) return <div key={sec.id}>{carteTexte}</div>;
          const carteImg = <div role="img" aria-label={ti} style={{ borderRadius: 18, minHeight: isMobile ? 260 : 440, background: `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` }} />;
          const inv = !isMobile && p.inverser === true;
          return <div key={sec.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 8 : 10 }}>{inv ? <>{carteImg}{carteTexte}</> : <>{carteTexte}{carteImg}</>}</div>;
        }

        case 'tuiles':
          return rendreTuiles(sec.id, ra.tuiles, ra.tuilesDisposition);

        case 'focus': {
          // Mise en avant : grande image à gauche (titre et bouton au centre) + grille de vrais produits à droite
          const f: any = ra.focus || {};
          const cat = nettoyerEnvoi(f.categorie, 80);
          const nb = Math.max(2, Math.min(6, parseInt(f.nombre, 10) || 4));
          const l = (cat ? produits.filter(p => p.categorie === cat) : produits).slice(0, nb);
          const img = urlSure(f.photo), ti = nettoyerEnvoi(f.titre, 100), tx = nettoyerEnvoi(f.texte, 300), bo = nettoyerEnvoi(f.bouton, 30);
          if (!img && !ti && l.length === 0) return null;
          return (
            <div key={sec.id} style={{ ...HL_J, display: 'grid', gridTemplateColumns: isMobile || l.length === 0 ? '1fr' : '1fr 1.5fr', gap: isMobile ? 14 : 24 }}>
              <div style={{ position: 'relative', minHeight: isMobile ? 380 : 560, borderRadius: 18, overflow: 'hidden', border: '2px solid var(--sk-b)', background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` : 'linear-gradient(135deg, #4a2b2b, #e8c7a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,6,15,0.2), rgba(5,6,15,0.78))' }} />
                <div style={{ position: 'relative', padding: 24 }}>
                  {ti && <h2 className="sk-fh" style={{ fontSize: isMobile ? 28 : 34, lineHeight: 1.1, color: '#fff', margin: 0, overflowWrap: 'anywhere' }}><TitreGrad texte={ti} /></h2>}
                  {tx && <p style={{ fontSize: 16, color: '#ffe9e6', lineHeight: 1.5, margin: '10px 0 0' }}>{tx}</p>}
                  {bo && <button onClick={() => allerChaine(nettoyerEnvoi(f.lien, 300))} className="sk-pill" style={{ marginTop: 18 }}>{bo}</button>}
                </div>
              </div>
              {l.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? 10 : 16, alignContent: 'start' }}>
                  {l.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(p)} />)}
                </div>
              )}
            </div>
          );
        }

        case 'marques': {
          // Bande de marques / éditeurs : logos (vos propres images) ou simples noms
          const m: any = ra.marques || {};
          const items = listeCellules(m.items, 10, 3, 300).filter(x => x[0] || x[1]);
          if (items.length === 0) return null;
          return (
            <div key={sec.id} style={{ padding: isMobile ? '18px 12px' : '26px 32px' }}>
              <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 14 : 30 }}>
                {items.map((x, i) => {
                  const img = urlSure(x[0]), nom = x[1] || '', lien = x[2] || '';
                  const inner = img ? <img src={img} alt={nom} loading="lazy" style={{ height: isMobile ? 52 : 80, maxWidth: isMobile ? 120 : 180, objectFit: 'contain', display: 'block' }} /> : <span className="sk-fh" style={{ fontSize: isMobile ? 22 : 30, color: 'var(--sk-t)' }}>{nom}</span>;
                  return lien
                    ? <button key={i} onClick={() => allerChaine(lien)} aria-label={nom || 'Marque'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{inner}</button>
                    : <div key={i}>{inner}</div>;
                })}
              </div>
            </div>
          );
        }

        case 'decompte': {
          // Compte à rebours vers une date réelle saisie par le gestionnaire ; date vide, invalide ou passée = section cachée
          const d: any = ra.decompte || {};
          const fin = dateSure(d.fin);
          if (!fin || fin <= Date.now()) return null;
          const img = urlSure(d.photo), ti = nettoyerEnvoi(d.titre, 120), so = nettoyerEnvoi(d.sousTitre, 160), bo = nettoyerEnvoi(d.bouton, 30);
          return (
            <div key={sec.id} style={{ borderRadius: 18, overflow: 'hidden', minHeight: isMobile ? 420 : 520, background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` : `radial-gradient(circle at 25% 30%, ${hexOk(d.couleurFond, '#f6b6b0')}, rgba(255,255,255,0) 62%), var(--sk-s)`, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-end', padding: isMobile ? 10 : 48 }}>
              <div style={{ ...HL_J, background: 'var(--sk-s2)', border: '2px solid var(--sk-b)', color: 'var(--sk-t)', borderRadius: 18, padding: isMobile ? '22px 14px' : '34px 32px', width: '100%', maxWidth: 560 }}>
                {ti && <h2 className="sk-fh" style={{ fontSize: isMobile ? 30 : 42, lineHeight: 1.06, margin: 0, overflowWrap: 'anywhere' }}><TitreGrad texte={ti} /></h2>}
                {so && <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.6, color: 'var(--sk-t2)', margin: '12px 0 20px' }}>{so}</p>}
                <Decompte fin={fin} isMobile={isMobile} />
                {bo && <button onClick={() => allerChaine(nettoyerEnvoi(d.lien, 300))} className="sk-pill" style={{ marginTop: 22 }}>{bo}</button>}
              </div>
            </div>
          );
        }

        case 'nouveautes':
          return rangee(sec.id, ra.nouveautes || {}, 'Nouveautés', [...produits].sort((x, y) => Number(y.id) - Number(x.id)));

        case 'selection':
          return rangee(sec.id, ra.selection || {}, 'Notre sélection', produits);

        case 'temoignages': {
          // Avis saisis par le gestionnaire : cartes (étoiles, titre, texte, nom, lieu, photo) en défilement, avec des photos facultatives entre les cartes. Exemples seulement en démonstration.
          const saisis = (Array.isArray(cfg.accueil.temoignages) ? cfg.accueil.temoignages : []).filter(t => t && typeof t.texte === 'string' && t.texte.trim());
          const exemples = [
            { titre: 'Exemple de titre', texte: 'Exemple de démonstration : remplacez cet avis par un vrai avis de client.', auteur: 'Client A', lieu: 'Ville', note: 5, photo: '' },
            { titre: 'Exemple de titre', texte: 'Exemple de démonstration : remplacez cet avis par un vrai avis de client.', auteur: 'Client B', lieu: 'Ville', note: 4, photo: '' },
            { titre: 'Exemple de titre', texte: 'Exemple de démonstration : remplacez cet avis par un vrai avis de client.', auteur: 'Client C', lieu: 'Ville', note: 5, photo: '' },
          ];
          const liste: any[] = saisis.length > 0 ? saisis : (configBrut?.__produits_demo__ ? exemples : []);
          if (liste.length === 0) return null;
          const phs = listeLignes(ra.temoignagesPhotos, 6, 400).map(urlSure).filter(Boolean);
          const cartes: React.ReactNode[] = [];
          liste.slice(0, 8).forEach((t, i) => {
            if (phs[i]) cartes.push(<div key={'p' + i} role="img" aria-label="Photo" style={{ flex: '0 0 auto', width: isMobile ? 190 : 230, minHeight: 300, borderRadius: 18, border: '2px solid var(--sk-b)', scrollSnapAlign: 'start', background: `url("${encodeURI(phs[i]).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s)` }} />);
            const note = Math.max(1, Math.min(5, Math.round(Number(t.note) || 5))), av = urlSure(t.photo), ti = nettoyerEnvoi(t.titre, 80), au = nettoyerEnvoi(t.auteur, 60), lieu = nettoyerEnvoi(t.lieu, 60);
            cartes.push(
              <div key={'t' + i} style={{ flex: '0 0 auto', width: isMobile ? 250 : 290, scrollSnapAlign: 'start', background: 'var(--sk-s2)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#4a2b2b', fontSize: 20, letterSpacing: 2, marginBottom: 10 }} aria-label={`${note} étoiles sur 5`}>{'★'.repeat(note)}<span style={{ color: 'rgba(255,255,255,0.25)' }}>{'★'.repeat(5 - note)}</span></div>
                {ti && <h3 className="sk-fh" style={{ fontSize: 22, lineHeight: 1.2, color: 'var(--sk-t)', margin: '0 0 8px', overflowWrap: 'anywhere' }}>« {ti} »</h3>}
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--sk-t)', margin: '0 0 16px', overflowWrap: 'anywhere', flex: 1 }}>{nettoyerEnvoi(t.texte, 600)}</p>
                {(au || lieu) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {av && <div role="img" aria-label={au} style={{ flex: '0 0 auto', width: 46, height: 46, borderRadius: 18, border: '2px solid var(--sk-b)', background: `url("${encodeURI(av).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s2)` }} />}
                    <div style={{ minWidth: 0 }}>{au && <div className="sk-fh" style={{ fontSize: 17, color: 'var(--sk-t)', overflowWrap: 'anywhere' }}>{au}</div>}{lieu && <div style={{ fontSize: 14, color: 'var(--sk-t2)' }}>{lieu}</div>}</div>
                  </div>
                )}
              </div>
            );
          });
          return (
            <div key={sec.id}>
              <TitreSection titre={ra.temoignagesTitre} sous={ra.temoignagesSousTitre} isMobile={isMobile} />
              <Defilant fleche="#ffffff" flecheTexte="var(--sk-b)">{cartes}</Defilant>
            </div>
          );
        }

        case 'blog-apercu': {
          if (articles.length === 0) return null;
          const b: any = ra.blogApercu || {};
          const ti = nettoyerEnvoi(b.titre, 120) || 'Notre blogue', so = nettoyerEnvoi(b.sousTitre, 200), bo = nettoyerEnvoi(b.bouton, 30) || 'Lire le blogue';
          const dateFr = (d?: string) => { if (!d) return ''; const t = new Date(d); return isNaN(t.getTime()) ? '' : t.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }); };
          return (
            <div key={sec.id}>
              <TitreSection titre={ti} sous={so} isMobile={isMobile} />
              <button onClick={() => naviguer('blog')} className="sk-fh" style={{ background: 'none', border: 'none', color: 'var(--sk-t)', fontSize: 17, cursor: 'pointer', padding: 0, margin: isMobile ? '-10px 0 20px' : '-20px 0 26px', display: 'block', textDecoration: 'underline' }}>{bo} →</button>
              <Defilant fleche="#ffffff" flecheTexte="var(--sk-b)">
                {articles.slice(0, 10).map(a => {
                  const minutes = a.contenu ? Math.max(1, Math.round(String(a.contenu).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length / 200)) : 0;
                  return (
                    <div key={a.id} onClick={() => voirArticle(a)} role="link" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') voirArticle(a); }} style={{ flex: '0 0 auto', width: isMobile ? 250 : 280, background: 'var(--sk-s)', color: 'var(--sk-t)', border: '2px solid var(--sk-b)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', scrollSnapAlign: 'start' }}>
                      {urlSure(a.photo) ? <img src={urlSure(a.photo)} alt="" loading="lazy" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block', borderBottom: '2px solid var(--sk-b)' }} /> : <div style={{ height: 190, background: 'var(--sk-s2)', borderBottom: '2px solid var(--sk-b)' }} />}
                      <div style={{ padding: 18 }}>
                        {dateFr(a.date_publication) && <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sk-d)', marginBottom: 8 }}>{dateFr(a.date_publication)}</div>}
                        <h3 className="sk-fh" style={{ fontSize: 20, lineHeight: 1.25, margin: '0 0 14px', color: 'var(--sk-t)' }}>{a.titre}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--sk-d)' }}>
                          <span>{minutes ? `${minutes} min de lecture` : ''}</span><span style={{ textTransform: 'uppercase' }}>{a.categorie || ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Defilant>
            </div>
          );
        }

        case 'categories': {
          // Carrousel de collections : vos vraies catégories, avec la photo d'un de leurs produits et le vrai nombre d'articles
          if (categories.length === 0) return null;
          const co: any = ra.collections || {};
          return (
            <div key={sec.id}>
              <TitreSection titre={nettoyerEnvoi(co.titre, 120) || 'Magasiner par collection'} sous={co.sousTitre} isMobile={isMobile} />
              <Defilant fleche="#ffffff" flecheTexte="var(--sk-b)">
                {categories.slice(0, 12).map((cat, i) => {
                  const avecPhoto = produits.find(p => p.categorie === cat && urlSure(p.photo_principale));
                  const img = avecPhoto ? urlSure(avecPhoto.photo_principale) : '';
                  const nb = produits.filter(p => p.categorie === cat).length;
                  return (
                    <button key={cat} onClick={() => allerLien('categorie', cat)} style={{ flex: '0 0 auto', width: isMobile ? 220 : 270, scrollSnapAlign: 'start', textAlign: 'center', padding: 0, border: '2px solid var(--sk-b)', borderRadius: 18, overflow: 'hidden', background: 'var(--sk-s)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--sk-t)' }}>
                      <div style={{ padding: 18 }}>
                        <div style={{ height: isMobile ? 170 : 210, borderRadius: 18, border: '2px solid var(--sk-b)', transform: `rotate(${i % 2 ? 2 : -2}deg)`, background: img ? `url("${encodeURI(img).replace(/"/g, '%22')}") center/cover no-repeat, var(--sk-s2)` : 'linear-gradient(135deg, #4a2b2b, #e8c7a3)' }} />
                      </div>
                      <div style={{ position: 'relative', background: cp, color: (luminance(cp) > 0.55 ? '#4a2b2b' : '#ffffff'), borderTop: '2px solid var(--sk-b)', padding: '22px 10px 14px' }}>
                        <span style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', background: 'var(--sk-s2)', color: 'var(--sk-t)', border: '2px solid var(--sk-b)', borderRadius: 18, padding: '2px 12px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{nb} article{nb > 1 ? 's' : ''}</span>
                        <span className="sk-fh" style={{ fontSize: isMobile ? 20 : 24, overflowWrap: 'anywhere' }}>{cat}</span>
                      </div>
                    </button>
                  );
                })}
              </Defilant>
            </div>
          );
        }


        case 'bandepromo': {
          // Bandeau d'offre brun foncé : seulement si le gestionnaire a écrit un titre
          const b: any = ra.bandepromo || {};
          const ti = nettoyerEnvoi(b.titre, 100); if (!ti) return null;
          const tx = nettoyerEnvoi(b.texte, 240), bo = nettoyerEnvoi(b.bouton, 30);
          return (
            <div key={sec.id} style={{ ['--sk-hl' as any]: '#ffe3df', background: '#e0525c', color: '#ffffff', borderRadius: 24, padding: isMobile ? '26px 18px' : '36px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                <h2 className="sk-fh" style={{ fontSize: isMobile ? 26 : 36, lineHeight: 1.1, color: '#ffffff', margin: 0, overflowWrap: 'anywhere' }}><TitreGrad texte={ti} /></h2>
                {tx && <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.5, margin: '8px 0 0', overflowWrap: 'anywhere' }}>{tx}</p>}
              </div>
              {bo && <button onClick={() => allerChaine(nettoyerEnvoi(b.lien, 300))} className="sk-pill" style={{ background: '#ffffff', color: '#e0525c', boxShadow: '0 4px 0 #b93d48' }}>{bo}</button>}
            </div>
          );
        }

        case 'video': {
          // Vidéo YouTube ou Vimeo seulement (adresses reconnues, jamais d'adresse libre dans l'iframe)
          const v: any = ra.video || {};
          const u = nettoyerEnvoi(v.url, 300);
          let src = '';
          const yt = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#].*)?$/i.exec(u);
          const vm = /^https?:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d{5,12})(?:[/?#].*)?$/i.exec(u);
          if (yt) src = `https://www.youtube-nocookie.com/embed/${yt[1]}`; else if (vm) src = `https://player.vimeo.com/video/${vm[1]}`;
          const ti = nettoyerEnvoi(v.titre, 120);
          if (!src && !configBrut?.__produits_demo__) return null;
          return (
            <div key={sec.id}>
              {ti && <TitreSection titre={ti} sous={nettoyerEnvoi(v.sousTitre, 200)} isMobile={isMobile} centre />}
              <div style={{ position: 'relative', width: '100%', maxWidth: 860, margin: '0 auto', aspectRatio: '16 / 9', borderRadius: 18, overflow: 'hidden', border: '2px solid var(--sk-b)', background: 'var(--sk-s2)', boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
                {src
                  ? <iframe src={src} title={ti || 'Vidéo'} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sk-t2)', textAlign: 'center', padding: 16 }}><span style={{ fontSize: 44 }}>▶</span><span style={{ fontSize: 15 }}>Exemple de démonstration : votre vidéo YouTube ou Vimeo s'affiche ici</span></div>}
              </div>
            </div>
          );
        }

        case 'promo':
          if (produitsPromo.length === 0) return null;
          return (
            <div key={sec.id}>
              <div>
                <TitreSection titre="Offres spéciales" isMobile={isMobile} />
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(220px,1fr))`, gap: 20 }}>
                  {produitsPromo.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(p)} />)}
                </div>
              </div>
            </div>
          );

        case 'newsletter':
          // Vraie inscription = add-on « Infolettre » (rangée du pied de page). Ce bloc d'exemple (sans envoi) ne sert qu'en démonstration.
          if (!configBrut?.__produits_demo__) return null;
          return (
            <div key={sec.id} style={{ background: cp, padding: '56px 24px', borderTop: '2px solid var(--sk-b)', borderBottom: '2px solid var(--sk-b)' }}>
              <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Restez informé</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Recevez nos offres exclusives et nouveautés en avant-première.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <input type="email" maxLength={254} placeholder="votre@courriel.com" style={{ flex: 1, minWidth: 220, padding: '13px 18px', borderRadius: 18, border: 'none', fontSize: 15, outline: 'none' }} />
                  <button style={{ background: 'var(--sk-s)', color: cp, border: 'none', borderRadius: 18, padding: '13px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>S'inscrire →</button>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    // Bannière, bandeau et grande photo en pleine largeur ; le reste dans une colonne centrée
    const HAUT = ['banniere', 'ticker', 'hero'];
    const rendus = sectionsAccueil.map(sec => ({ sec, r: renderSection(sec) })).filter(x => x.r);
    return <>
      {rendus.filter(x => HAUT.includes(x.sec.id)).map(x => <Fragment key={x.sec.id}>{x.r}</Fragment>)}
      <div style={{ maxWidth: 1304, margin: '0 auto', padding: isMobile ? '28px 14px 40px' : '56px 24px 72px', display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 80 }}>
        {rendus.filter(x => !HAUT.includes(x.sec.id)).map((x, k, a) => <Fragment key={x.sec.id}><div>{x.r}</div>{k < a.length - 1 && <div aria-hidden="true" className="sk-onde" />}</Fragment>)}
      </div>
    </>;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE CATALOGUE
  // ══════════════════════════════════════════════════════════════════════════
  const PageCatalogue = () => {
    const colMap: Record<number, string> = { 2: 'repeat(auto-fill,minmax(300px,1fr))', 3: 'repeat(auto-fill,minmax(220px,1fr))', 4: 'repeat(auto-fill,minmax(180px,1fr))' };
    return (
      <div style={{ minHeight: '60vh' }}>
        {(cfg.catalogue.sections || []).find(x => x.id === 'banniere')?.actif !== false && <Banniere cfg={cfg.catalogue.banniere} />}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          {/* En-tête */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{cfg.catalogue.titre}</h1>
            {cfg.catalogue.sousTitre && <p style={{ fontSize: 16, color: cs }}>{cfg.catalogue.sousTitre}</p>}
          </div>

          {/* Filtres */}
          {(cfg.catalogue.afficherRecherche || cfg.catalogue.afficherFiltres) && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {cfg.catalogue.afficherRecherche && (
                  <input type="text" placeholder="🔍 Rechercher un produit..." value={filtreRecherche} onChange={e => setFiltreRecherche(limiterSaisie(e.target.value, 100))} maxLength={100}
                    style={{ ...styleInput, maxWidth: 320, flex: 1 }} />
                )}
                {cfg.catalogue.afficherFiltres && categories.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setFiltreCat('')}
                      style={{ background: !filtreCat ? cp : 'var(--sk-s2)', color: !filtreCat ? surCp : 'var(--sk-t2)', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Tous
                    </button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setFiltreCat(cat === filtreCat ? '' : cat)}
                        style={{ background: filtreCat === cat ? cp : 'var(--sk-s2)', color: filtreCat === cat ? surCp : 'var(--sk-t2)', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {cfg.catalogue.afficherFiltres && (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '12px 16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sk-t2)' }}>Prix
                    <input inputMode="decimal" value={prixMin} onChange={e => setPrixMin(limiterSaisie(e.target.value, 8).replace(/[^0-9.,]/g, ''))} maxLength={8} placeholder="min" aria-label="Prix minimum" style={{ ...styleInput, width: 80, padding: '7px 10px' }} />
                    <span>–</span>
                    <input inputMode="decimal" value={prixMax} onChange={e => setPrixMax(limiterSaisie(e.target.value, 8).replace(/[^0-9.,]/g, ''))} maxLength={8} placeholder="max" aria-label="Prix maximum" style={{ ...styleInput, width: 80, padding: '7px 10px' }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sk-t2)', cursor: 'pointer' }}><input type="checkbox" checked={seulPromo} onChange={e => setSeulPromo(e.target.checked)} /> En promo</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sk-t2)', cursor: 'pointer' }}><input type="checkbox" checked={seulStock} onChange={e => setSeulStock(e.target.checked)} /> En stock</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sk-t2)', marginLeft: isMobile ? 0 : 'auto' }}>Trier
                    <select value={tri} onChange={e => setTri(['prix-asc', 'prix-desc', 'nom'].includes(e.target.value) ? e.target.value as any : 'recent')} style={{ ...styleInput, width: 'auto', padding: '7px 10px' }}>
                      <option value="recent">Nouveautés</option><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option><option value="nom">Nom (A–Z)</option>
                    </select>
                  </label>
                  {filtresActifs && <button onClick={reinitialiserFiltres} style={{ background: 'none', border: '1px solid var(--sk-b)', borderRadius: 8, color: 'var(--sk-t2)', fontSize: 13, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Réinitialiser</button>}
                </div>
              )}
            </div>
          )}

          {/* Résultats */}
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--sk-d)' }}>{produitsFiltres.length} produit(s)</div>

          {produitsFiltres.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--sk-d)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--sk-t2)', marginBottom: 8 }}>Aucun produit trouvé</h2>
                <p>Essayez de modifier vos filtres.</p>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: colMap[cfg.catalogue.colonnes] || colMap[3], gap: 20 }}>
                {produitsFiltres.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(p)} />)}
              </div>
          }
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE FICHE PRODUIT — config dynamique via fp (ConfigFicheProduit)
  // ══════════════════════════════════════════════════════════════════════════
  const PageProduit = () => {
    if (!produitActif) return null;
    const p = produitActif;
    const enPromo = p.prix_promo && p.prix_promo < p.prix;
    const photos = [p.photo_principale, ...(p.photos || [])].filter(Boolean) as string[];
    const btnCouleur = fp.boutonCouleur || cp;
    const varsPlates = (p.variantes || []).filter(v => v && !Array.isArray(v.valeurs));
    const nomVar = varianteChoisie.__v || '';
    const vSel = varsPlates.find(v => v.nom === nomVar) || null;
    const stockDe = (v: any): number | null => v && v.stock !== null && v.stock !== undefined && v.stock !== '' ? Math.max(0, Number(v.stock)) : (p.stock !== undefined && p.stock !== null ? p.stock : null);
    const stockMax = varsPlates.length ? (vSel ? stockDe(vSel) : null) : (p.stock !== undefined ? p.stock : null);
    const prixVar = vSel && vSel.prix !== null && vSel.prix !== undefined && vSel.prix !== '' && Number(vSel.prix) >= 0 ? Number(vSel.prix) : null;
    const epuise = (p.stock === 0 && !enchActive(p)) || (vSel !== null && stockDe(vSel) === 0);
    const modeDemo = !!configBrut?.__produits_demo__;
    const parutionBloquee = !!p.date_parution && !ouvertes[p.id];   // pas encore en vente : compte à rebours, aucun achat
    const bloque = parutionBloquee || venteDirecteBloquee(p);
    const resume = resumeAvis();

    // Galerie component
    const GalerieBlock = () => (
      <div>
        {fp.photosMiniatures === 'gauche' && photos.length > 1 ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {photos.map((ph, i) => (
                <div key={i} onClick={() => setPhotoIdx(i)}
                  style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${photoIdx === i ? btnCouleur : 'var(--sk-b)'}`, flexShrink: 0 }}>
                  <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1, borderRadius: 18, overflow: 'hidden', background: 'var(--sk-s2)', aspectRatio: '1' }}>
              {photos.length > 0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: 'var(--sk-b)' }}>{p.emoji||'📦'}</div>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--sk-s2)', aspectRatio: '1', marginBottom: 10 }}>
              {photos.length > 0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: 'var(--sk-b)' }}>{p.emoji||'📦'}</div>}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {photos.map((ph, i) => (
                  <div key={i} onClick={() => setPhotoIdx(i)}
                    style={{ width: 60, height: 60, borderRadius: 7, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${photoIdx === i ? btnCouleur : 'var(--sk-b)'}` }}>
                    <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );

    // Info panel component
    const InfoBlock = () => (
      <div>
        {fp.afficherCategorie && p.categorie && <div style={{ fontSize: 12, color: btnCouleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{p.categorie}</div>}
        <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: 'var(--sk-t)', marginBottom: 14, lineHeight: 1.2 }}>{p.titre}</h1>
        {fp.afficherSku && p.sku && <div style={{ fontSize: 12, color: 'var(--sk-d)', marginBottom: 10 }}>SKU : {p.sku}</div>}

        {/* Prix */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          {prixVar !== null ? <span style={{ fontSize: 32, fontWeight: 800, color: btnCouleur }}>{prix(prixVar)}</span> : enPromo ? (
            <>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{prix(p.prix_promo!)}</span>
              <span style={{ fontSize: 20, color: 'var(--sk-d)', textDecoration: 'line-through' }}>{prix(p.prix)}</span>
              {fp.afficherRabaisPct && <span style={{ background: 'var(--sk-errbg)', color: '#ef4444', fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
                -{Math.round((1 - p.prix_promo! / p.prix) * 100)}%
              </span>}
            </>
          ) : <span style={{ fontSize: 32, fontWeight: 800, color: btnCouleur }}>{prix(p.prix)}</span>}
        </div>

        {resume && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}><EtoilesAvis clair={!sombre} note={resume.note} taille={16} /><span style={{ fontSize: 13, color: 'var(--sk-d)' }}>{resume.note.toFixed(1)} ({resume.nb} avis)</span><button onClick={() => { const el = document.getElementById('catalogue-avis'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: btnCouleur, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Voir les avis</button></div>}

        {p.offre_fin && <OffreCompteur clair={!sombre} fin={p.offre_fin} heureServeur={heureServeur} onFini={offreCtx.onFini} />}
        {p.date_parution && <BoutiqueParutionCountdown dateParution={p.date_parution} gestionnaireId={vendeurId} heureServeur={heureServeur} onOuvert={() => { setOuvertes(m => ({ ...m, [p.id]: true })); setTimeout(() => { chargerCatalogue(); }, 1500); }} />}

        {/* Stock */}
        {enchActive(p) && <div style={{ marginBottom: 16 }}><span style={{ fontSize: 13, color: '#e0525c', fontWeight: 600 }}>🌸 {p.stock === undefined || p.stock === null || p.stock === 0 ? '1 unité en vente aux enchères' : 'En stock (1 réservé enchère)'}</span></div>}
        {!parutionBloquee && fp.afficherStock && p.stock !== undefined && !(enchActive(p) && p.stock === 0) && (
          <div style={{ marginBottom: 16 }}>
            {p.stock > 0
              ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ En stock ({p.stock} disponible{p.stock > 1 ? 's' : ''})</span>
              : <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>❌ Épuisé</span>}
          </div>
        )}

        {/* Paliers de prix (add-on « Prix par palier ») */}
        {!parutionBloquee && p.paliers && p.paliers.length > 0 && <PaliersProduitBoutique produit={p as any} quantite={qteChoisie} variante={Object.values(varianteChoisie).join(' / ')} couleur={btnCouleur} fond="#f9fafb" bordure="var(--sk-b)" texte="#1a1a1a" texteDiscret="#6b7280" />}

        {/* Variantes (vraies annonces : liste plate) */}
        {!parutionBloquee && varsPlates.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 7 }}>Variante</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {varsPlates.map(v => { const sel = nomVar === v.nom; const out = stockDe(v) === 0; const pv = v.prix !== null && v.prix !== undefined && v.prix !== '' && Number(v.prix) >= 0 ? Number(v.prix) : null;
                return <button key={v.nom} disabled={out} aria-pressed={sel} onClick={() => { setVarianteChoisie({ __v: v.nom }); setQteChoisie(1); }}
                  style={{ padding: '7px 14px', borderRadius: 7, border: `2px solid ${sel ? btnCouleur : 'var(--sk-b)'}`, background: sel ? `${btnCouleur}12` : '#fff', color: sel ? btnCouleur : '#333', fontSize: 13, fontWeight: 600, cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.4 : 1, textDecoration: out ? 'line-through' : 'none' }}>
                  {v.nom}{pv !== null && <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12 }}>{prix(pv)}</span>}{out && <span style={{ marginLeft: 8, fontSize: 11 }}>Épuisé</span>}
                </button>; })}
            </div>
          </div>
        )}

        {/* Variantes (démo : nom + valeurs) */}
        {!parutionBloquee && p.variantes && p.variantes.filter(v => Array.isArray(v.valeurs)).map(v => (
          <div key={v.nom} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 7 }}>{v.nom}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {(v.valeurs || []).map(val => (
                <button key={val} onClick={() => setVarianteChoisie(prev => ({ ...prev, [v.nom]: val }))}
                  style={{ padding: '7px 14px', borderRadius: 7, border: `2px solid ${varianteChoisie[v.nom] === val ? btnCouleur : 'var(--sk-b)'}`, background: varianteChoisie[v.nom] === val ? `${btnCouleur}12` : '#fff', color: varianteChoisie[v.nom] === val ? btnCouleur : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Produits personnalisés (add-on) */}
        {!bloque && vendeurId > 0 && !modeDemo && <BoutiquePersonnalisation key={p.id} gestionnaireId={vendeurId} produitId={p.id} couleur={btnCouleur} theme={sombre ? THEME_SOMBRE_PERSO : THEME_CLAIR_PERSO} reference={persoRef} />}

        {/* Quantité */}
        {!bloque && fp.afficherQte && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 7 }}>Quantité</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setQteChoisie(q => Math.max(1, q - 1))}
                style={{ width: 38, height: 38, borderRadius: 7, border: '1.5px solid var(--sk-b)', background: 'var(--sk-s)', cursor: 'pointer', fontSize: 17, fontWeight: 700 }}>−</button>
              <span style={{ fontSize: 17, fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{qteChoisie}</span>
              <button onClick={() => setQteChoisie(q => stockMax != null ? Math.min(Math.max(1, stockMax), q + 1) : q + 1)} disabled={stockMax != null && qteChoisie >= stockMax}
                style={{ width: 38, height: 38, borderRadius: 7, border: '1.5px solid var(--sk-b)', background: 'var(--sk-s)', cursor: stockMax != null && qteChoisie >= stockMax ? 'not-allowed' : 'pointer', fontSize: 17, fontWeight: 700, opacity: stockMax != null && qteChoisie >= stockMax ? 0.4 : 1 }}>+</button>
            </div>
          </div>
        )}

        {/* Bouton (+ liste de souhaits avant / après selon le réglage du gestionnaire) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <BoutiqueSouhaitProduit clair={!sombre} zone="avant_panier" enLigne gestionnaireId={vendeurId} produitId={p.id} connecte={!!acheteur} demo={produitsDemo} masque={parutionBloquee && cfgParution.bloquer_wishlist} />
          {parutionBloquee
            ? (cfgParution.afficher_message_atc && cfgParution.texte_atc_bloque
                ? <div style={{ flex: 1, minWidth: 180, padding: '14px 16px', borderRadius: 18, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>{cfgParution.texte_atc_bloque}</div>
                : <button disabled style={{ flex: 1, minWidth: 180, padding: '14px 24px', background: btnCouleur, color: (luminance(btnCouleur) > 0.55 ? '#4a2b2b' : '#ffffff'), border: 'none', borderRadius: 18, fontSize: 15, fontWeight: 700, opacity: 0.5, cursor: 'not-allowed' }}>⏳ Pas encore disponible</button>)
            : !venteDirecteBloquee(p) && (
                <button onClick={() => ajouterAuPanier(p)} disabled={epuise}
                  style={{ flex: 1, minWidth: 180, padding: '14px 24px', background: epuise ? 'var(--sk-b)' : btnCouleur, color: epuise ? '#aaa' : '#fff', border: 'none', borderRadius: 18, fontSize: 15, fontWeight: 700, cursor: epuise ? 'not-allowed' : 'pointer' }}>
                  {epuise ? 'Épuisé' : `🛒 ${fp.boutonLabel}`}
                </button>)}
          <BoutiqueSouhaitProduit clair={!sombre} zone="apres_panier" enLigne gestionnaireId={vendeurId} produitId={p.id} connecte={!!acheteur} demo={produitsDemo} masque={parutionBloquee && cfgParution.bloquer_wishlist} />
        </div>

        {/* Enchère et « Faire une offre » (add-ons) */}
        {!parutionBloquee && <BlocEnchereBoutique clair={!sombre} gestionnaireId={vendeurId} produitId={p.id} couleurAccent={btnCouleur} isDemo={modeDemo}
          onEtat={a => { if (enchereEtat[p.id] === true && a === false) setTimeout(rechargerOffres, 400); setEnchereEtat(m => m[p.id] === a ? m : { ...m, [p.id]: a }); }}
          allerConnexion={() => { setAvisPanier('Connectez-vous pour miser.'); naviguer('login'); }} />}
        <FaireOffreBoutique clair={!sombre} gestionnaireId={vendeurId} produitId={p.id} prix={prixVar !== null ? prixVar : enPromo ? p.prix_promo! : p.prix} variante={Object.values(varianteChoisie).join(' / ')}
          varianteRequise={varsPlates.length > 0 && !vSel || !!(p.variantes && p.variantes.some(v => Array.isArray(v.valeurs) && !varianteChoisie[v.nom]))} masque={p.stock === 0 || parutionBloquee} couleurAccent={btnCouleur} isDemo={modeDemo}
          allerConnexion={() => { setAvisPanier('Connectez-vous pour faire une offre.'); naviguer('login'); }} onPanier={() => { setVueCompte('panier'); naviguer('compte'); }} />

        {/* Réassurance */}
        {fp.afficherReassurance && reassuranceVisible && fp.reassuranceItems.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {fp.reassuranceItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--sk-t2)' }}>
                <span>{item.icone}</span><span>{item.texte}</span>
              </div>
            ))}
          </div>
        )}

        {/* Partage */}
        {fp.afficherPartage && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--sk-d)', alignSelf: 'center' }}>Partager :</span>
            {[['Facebook','🔵'],['Pinterest','📌'],['X','🐦']].map(([nom, ico]) => (
              <button key={nom} style={{ padding: '5px 10px', border: '1px solid var(--sk-b)', borderRadius: 6, background: 'var(--sk-s)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {ico} {nom}
              </button>
            ))}
          </div>
        )}

        {/* Description — position 'droite' ou 'onglets' */}
        {fp.descriptionPosition !== 'bas' && p.description && (
          fp.descriptionPosition === 'onglets' ? (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--sk-b)', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--sk-b)', marginBottom: 16 }}>
                {(['description','details','livraison'] as const).map(ong => (
                  <button key={ong} onClick={() => setOngletActif(ong)}
                    style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: `2px solid ${ongletActif===ong ? btnCouleur : 'transparent'}`, color: ongletActif===ong ? btnCouleur : '#888', fontSize: 13, fontWeight: ongletActif===ong ? 700 : 500, cursor: 'pointer', marginBottom: -2, textTransform: 'capitalize' }}>
                    {ong === 'description' ? 'Description' : ong === 'details' ? 'Détails' : 'Livraison'}
                  </button>
                ))}
              </div>
              {ongletActif === 'description' && <div style={{ fontSize: 14, color: 'var(--sk-t2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{p.description}</div>}
              {ongletActif === 'details'     && <div style={{ fontSize: 14, color: 'var(--sk-d)' }}>Aucun détail supplémentaire.</div>}
              {ongletActif === 'livraison'   && <div style={{ fontSize: 14, color: 'var(--sk-t2)', lineHeight: 1.8 }}>{configBrut?.__produits_demo__ ? <>Livraison standard : 2–5 jours ouvrables.<br />Livraison express disponible au moment du paiement.</> : <>Les modes et les frais de livraison sont présentés à l'étape du paiement.</>}</div>}
            </div>
          ) : (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--sk-b)', paddingTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 10 }}>Description</h3>
              <div style={{ fontSize: 14, color: 'var(--sk-t2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', overflow: fp.descriptionTronquee && !descExpanded ? 'hidden' : 'visible', maxHeight: fp.descriptionTronquee && !descExpanded ? 120 : 'none' }}>
                {p.description}
              </div>
              {fp.descriptionTronquee && p.description.length > 300 && (
                <button onClick={() => setDescExpanded(!descExpanded)}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: btnCouleur, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {descExpanded ? '▲ Réduire' : '▼ Lire plus'}
                </button>
              )}
            </div>
          )
        )}
      </div>
    );

    // Description pleine largeur (bas)
    const DescriptionBas = () => fp.descriptionPosition === 'bas' && p.description ? (
      <div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid var(--sk-b)' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 16 }}>Description</h3>
        <div style={{ fontSize: 15, color: 'var(--sk-t2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: fp.descriptionTronquee && !descExpanded ? 160 : 'none', overflow: fp.descriptionTronquee && !descExpanded ? 'hidden' : 'visible' }}>
          {p.description}
        </div>
        {fp.descriptionTronquee && p.description.length > 400 && (
          <button onClick={() => setDescExpanded(!descExpanded)}
            style={{ marginTop: 10, background: 'none', border: 'none', color: btnCouleur, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {descExpanded ? '▲ Réduire' : '▼ Lire plus'}
          </button>
        )}
      </div>
    ) : null;

    // Questions et avis (add-ons) : sous la description, avant les produits similaires
    const blocsBas = (vendeurId > 0 && !modeDemo) ? (
      <div style={{ marginTop: 40 }}>
        <QuestionsProduitBoutique clair={!sombre} gestionnaireId={vendeurId} produitId={p.id} couleurAccent={btnCouleur} isDemo={modeDemo}
          allerConnexion={() => { setAvisPanier('Connectez-vous pour poser une question.'); naviguer('login'); }} />
        {avisReel && (
          <div id="catalogue-avis" style={{ marginTop: 40 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 16px' }}>⭐ Avis clients ({avisProd.etat!.total})</h3>
            <AvisProduitBoutique clair={!sombre} donnees={avisProd} couleurAccent={btnCouleur} connecte={!!acheteur} isMobile={isMobile}
              ouvrirMesAvis={() => { if (!acheteur) { setAvisPanier('Connectez-vous pour laisser un avis.'); naviguer('login'); return; } setVueCompte('avis'); naviguer('compte'); }} />
          </div>
        )}
      </div>
    ) : null;

    // Layout image-haut
    if (!isMobile && fp.layout === 'image-haut') {
      return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          {fp.afficherBreadcrumb && (
            <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--sk-d)' }}>
              <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Accueil</button>
              <span>›</span><button onClick={() => naviguer('catalogue')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Nos produits</button>
              <span>›</span><span style={{ color: 'var(--sk-t2)' }}>{p.titre}</span>
            </div>
          )}
          <div style={{ marginBottom: 36 }}>{GalerieBlock()}</div>
          {InfoBlock()}
          <DescriptionBas />
          {blocsBas}
          {fp.afficherSimilaires && produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).length > 0 && (
            <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--sk-b)' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 20 }}>{fp.similairesTitre}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                {produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).slice(0, fp.similairesNombre).map(pr => (
                  <CarteProduit key={pr.id} produit={pr} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(pr)} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Layout gauche/droite (défaut + mobile)
    const imageCol = GalerieBlock();
    const infoCol  = InfoBlock();
    const isInverse = !isMobile && fp.layout === 'image-droite';

    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {fp.afficherBreadcrumb && (
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--sk-d)' }}>
            <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Accueil</button>
            <span>›</span><button onClick={() => naviguer('catalogue')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Nos produits</button>
            <span>›</span><span style={{ color: 'var(--sk-t2)' }}>{p.titre}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {isInverse ? <>{infoCol}{imageCol}</> : <>{imageCol}{infoCol}</>}
        </div>
        <DescriptionBas />
        {blocsBas}
        {fp.afficherSimilaires && produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).length > 0 && (
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--sk-b)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 20 }}>{fp.similairesTitre}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).slice(0, fp.similairesNombre).map(pr => (
                <CarteProduit key={pr.id} produit={pr} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(pr)} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE BLOG
  // ══════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  // OFFRES DU JOUR / ENCHÈRES (thème clair)
  // ══════════════════════════════════════════════════════════════════════════
  const colsGrille = isMobile ? 'repeat(2,1fr)' : `repeat(${Math.min(4, Math.max(2, Number(cfg.catalogue.colonnes) || 3))},1fr)`;
  const lienReessayer: React.CSSProperties = { background: 'none', border: 'none', color: cp, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' };
  const PageEncheres = () => (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 8px' }}>🌸 Enchères</h1>
        <p style={{ margin: 0, color: 'var(--sk-d)', fontSize: 15 }}>Les enchères qui se terminent bientôt sont en premier. Une mise est un engagement d'achat.</p>
      </div>
      {!encheresCharge ? <p style={{ color: 'var(--sk-d)' }}>Chargement…</p>
        : encheresErr ? <p style={{ color: 'var(--sk-err)' }}>Impossible de charger les enchères. <button onClick={() => setVersionEncheres(v => v + 1)} style={lienReessayer}>Réessayer</button></p>
        : encheresListe.length === 0
          ? <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--sk-d)' }}><div style={{ fontSize: 52, marginBottom: 14 }}>🌸</div><h3 style={{ fontWeight: 600, marginBottom: 16 }}>Aucune enchère en cours pour le moment. Revenez bientôt !</h3><button onClick={() => naviguer('catalogue')} style={{ ...styleBtn, width: 'auto', padding: '12px 28px' }}>Voir le catalogue</button></div>
          : <div style={{ display: 'grid', gridTemplateColumns: colsGrille, gap: isMobile ? 12 : 20 }}>
              {encheresListe.map((e: any) => (
                <div key={e.id} onClick={() => { const pr = encheresProduits[Number(e.produit_id)]; if (pr) voirProduit(pr); else { const dans = produits.find(x => Number(x.id) === Number(e.produit_id)); if (dans) voirProduit(dans); } }} style={{ background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '1/1', background: 'var(--sk-s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {e.image_url ? <img src={e.image_url} alt={e.titre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44, opacity: 0.3 }}>🌸</span>}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titre}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: cp }}>{prix(e.mise_actuelle !== null ? e.mise_actuelle : e.prix_depart)}</div>
                    <div style={{ fontSize: 12, color: 'var(--sk-d)', margin: '2px 0 6px' }}>{e.mise_actuelle === null ? 'Prix de départ' : `${e.nb_mises} mise${e.nb_mises > 1 ? 's' : ''}`}{e.reserve && e.reserve.atteinte ? ' · réserve atteinte' : ''}</div>
                    <div style={{ fontSize: 12 }}><ResteEnchere fin={e.date_fin} decalage={encheresDec} couleur={cpPartage} /></div>
                  </div>
                </div>))}
            </div>}
    </div>
  );
  const PageOffres = () => {
    const pages = Math.max(1, Math.ceil(offresTotal / OFFRES_PAR_PAGE));
    const btnPg = (actif: boolean, off = false): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: `1px solid ${actif ? cp : 'var(--sk-b)'}`, background: actif ? cp : 'var(--sk-s)', color: actif ? surCp : off ? '#6b7280' : 'var(--sk-t2)', fontWeight: actif ? 800 : 500, fontSize: 13, cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.5 : 1 });
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 8px' }}>🔥 Offres du jour</h1>
          <p style={{ margin: 0, color: 'var(--sk-d)', fontSize: 15 }}>Les offres qui se terminent bientôt sont en premier. Le prix revient à la normale dès la fin du compte à rebours.</p>
        </div>
        {!offresCharge ? <p style={{ color: 'var(--sk-d)' }}>Chargement…</p>
          : offresErr ? <p style={{ color: 'var(--sk-err)' }}>Impossible de charger les offres. <button onClick={() => setVersionOffres(v => v + 1)} style={lienReessayer}>Réessayer</button></p>
          : offresListe.length === 0
            ? <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--sk-d)' }}><div style={{ fontSize: 52, marginBottom: 14 }}>🔥</div><h3 style={{ fontWeight: 600, marginBottom: 16 }}>Aucune offre du jour pour le moment. Revenez bientôt !</h3><button onClick={() => naviguer('catalogue')} style={{ ...styleBtn, width: 'auto', padding: '12px 28px' }}>Voir le catalogue →</button></div>
            : <>
              <div style={{ display: 'grid', gridTemplateColumns: colsGrille, gap: isMobile ? 12 : 20 }}>{offresListe.map(pr => <CarteProduit key={pr.id} produit={pr} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} extras={extras} onClick={() => voirProduit(pr)} />)}</div>
              {pages > 1 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
                <button disabled={offresPg <= 1} onClick={() => { setOffresPg(offresPg - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={btnPg(false, offresPg <= 1)}>← Préc.</button>
                {Array.from({ length: pages }, (_, k) => k + 1).filter(n => n === 1 || n === pages || Math.abs(n - offresPg) <= 1).map((n, i, a) => (<span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{i > 0 && n - a[i - 1] > 1 && <span style={{ color: 'var(--sk-d)' }}>…</span>}<button onClick={() => { setOffresPg(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={btnPg(n === offresPg)}>{n}</button></span>))}
                <button disabled={offresPg >= pages} onClick={() => { setOffresPg(offresPg + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={btnPg(false, offresPg >= pages)}>Suiv. →</button>
              </div>}
            </>}
      </div>
    );
  };

  // PAGE POLITIQUE (pages légales rédigées dans Configuration → Mes politiques)
  const PagePolitique = () => {
    const contenu = politique && politique.contenu.trim() ? htmlSur(politique.contenu) : '';
    const demoPol = !!configBrut?.__produits_demo__;
    const polCfg: any = { ...CFG_DEF.footer.politiques, ...(cfg.footer.politiques || {}) };
    const polOk = (slug: string) => demoPol || (politiquesRedigees ? politiquesRedigees[slug] === true : false);
    const ongletsPol = ([['conditions-service','Conditions de service',polCfg.afficherConditions],['confidentialite','Confidentialité',polCfg.afficherConfidentialite],['retour-remboursement','Retour & remboursement',polCfg.afficherRetours],['expedition','Expédition',polCfg.afficherLivraison],['coordonnees','Coordonnées',polCfg.afficherCoordonnees],['mentions-legales','Mentions légales',polCfg.afficherMentions]] as [string, string, any][]).filter(([slug, , actif]) => actif !== false && (polOk(slug) || slug === (politique && politique.slug)));
    const titreAffiche = politique && politique.titre && !/<h1[\s>]/i.test(contenu) ? politique.titre : '';
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <style>{`.pol-contenu h1{font-size:30px;font-weight:800;color:var(--sk-t);margin:0 0 20px;line-height:1.2}.pol-contenu h2{font-size:20px;font-weight:800;color:var(--sk-t);margin:32px 0 10px}.pol-contenu h3{font-size:16px;font-weight:700;color:var(--sk-t);margin:22px 0 8px}.pol-contenu p{color:var(--sk-t2);line-height:1.9;margin:0 0 14px;font-size:15px}.pol-contenu ul,.pol-contenu ol{color:var(--sk-t2);padding-left:22px;margin:0 0 14px}.pol-contenu li{line-height:1.8;margin-bottom:6px;font-size:15px}.pol-contenu a{color:${cp};text-decoration:underline}.pol-contenu strong{color:var(--sk-t)}.pol-contenu blockquote{border-left:3px solid ${cp};padding:8px 18px;margin:16px 0;color:var(--sk-t2)}.pol-contenu hr{border:0;border-top:1px solid var(--sk-b);margin:24px 0}`}</style>
        <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', color: cp, fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Retour à l'accueil</button>
        {ongletsPol.length > 1 && <nav aria-label="Pages légales" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {ongletsPol.map(([slug, nom]) => { const actif = politique ? politique.slug === slug : politiqueEnCours.current === slug; return <button key={slug} onClick={() => { if (!actif) ouvrirPolitique(slug); }} aria-current={actif ? 'page' : undefined} style={{ padding: '8px 16px', borderRadius: 18, border: `1px solid ${actif ? cp : 'var(--sk-b)'}`, background: actif ? cp : 'transparent', color: actif ? surCp : 'var(--sk-t2)', fontSize: 13, fontWeight: actif ? 800 : 600, cursor: actif ? 'default' : 'pointer' }}>{nom}</button>; })}
        </nav>}
        {politiqueStatut === 'loading' && <p style={{ color: 'var(--sk-d)' }}>Chargement…</p>}
        {politiqueStatut === 'err' && <p style={{ color: '#dc2626' }}>Impossible de charger cette page. Veuillez réessayer.</p>}
        {politiqueStatut === 'idle' && politique && (contenu
          ? <>{titreAffiche && <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 20px', lineHeight: 1.2 }}>{titreAffiche}</h1>}<div className="pol-contenu" dangerouslySetInnerHTML={{ __html: contenu }} /></>
          : <><h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 16 }}>{politique.titre}</h1><p style={{ color: 'var(--sk-d)' }}>Cette page n'a pas encore été rédigée.</p></>)}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CONNEXION / INSCRIPTION (thème clair)
  // ══════════════════════════════════════════════════════════════════════════
  const styleLabel: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--sk-t2)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' };
  const carteAuth: React.CSSProperties = { background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? 22 : 32, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' };
  // Longueur maximale d'un champ du formulaire d'inscription (à la frappe ; le serveur revalide)
  const maxInsc = (cle: string, type: string): number => type === 'email' ? 254 : type === 'password' ? 200 : type === 'tel' || cle === 'telephone' ? 30 : cle === 'code_postal' ? 10 : cle === 'province' ? 4 : 150;
  const champInsc = (cle: string, libelle: string, type: string, ph: string, requis: boolean, extra?: any) => (
    <div key={cle} style={{ marginBottom: 18 }}>
      <label style={styleLabel}>{libelle}{requis && ' *'}</label>
      {type === 'textarea'
        ? <textarea value={inscVal[cle] || ''} onChange={e => setInscVal(f => ({ ...f, [cle]: limiterSaisie(e.target.value, 1000) }))} maxLength={1000} placeholder={ph} rows={3} style={{ ...styleInput, resize: 'vertical' }} />
        : type === 'select'
        ? <select value={inscVal[cle] || ''} onChange={e => setInscVal(f => ({ ...f, [cle]: limiterSaisie(e.target.value, 1000) }))} style={styleInput}><option value="">— Choisir —</option>{(extra || []).map((o: string) => <option key={o} value={o}>{o}</option>)}</select>
        : <input type={type} value={inscVal[cle] || ''} onChange={e => setInscVal(f => ({ ...f, [cle]: limiterSaisie(e.target.value, maxInsc(cle, type)) }))} maxLength={maxInsc(cle, type)} placeholder={ph} style={styleInput} autoComplete={type === 'password' ? 'new-password' : undefined} />}
    </div>
  );
  const caseInsc = (cle: string, contenu: any, requis: boolean) => (
    <div key={cle} onClick={() => setInscVal(f => ({ ...f, [cle]: !f[cle] }))} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
      <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: 5, border: `2px solid ${inscVal[cle] ? cp : '#9ca3af'}`, background: inscVal[cle] ? `${cp}22` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cp, fontSize: 12, marginTop: 2 }}>{inscVal[cle] && '✓'}</div>
      <span style={{ fontSize: 13, color: 'var(--sk-t2)', lineHeight: 1.5 }}>{contenu}{requis && <span style={{ color: '#ef4444' }}> *</span>}</span>
    </div>
  );

  const PageInscription = () => (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sk-t)', margin: 0 }}>{ins.titre}</h1>
          {ins.sousTitre && <p style={{ color: 'var(--sk-d)', marginTop: 10, fontSize: 14 }}>{ins.sousTitre}</p>}
          <p style={{ color: 'var(--sk-d)', marginTop: 10, fontSize: 14 }}>Vous avez déjà un compte ? <button onClick={() => naviguer('login')} style={{ background: 'none', border: 'none', color: cp, fontSize: 14, cursor: 'pointer', fontWeight: 700 }}>Se connecter</button></p>
        </div>
        {inscStatut === 'ok' ? (
          <div style={{ ...carteAuth, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: 'var(--sk-t)', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{ins.messageSuccesTitre}</h2>
            <p style={{ color: 'var(--sk-d)', fontSize: 14, margin: '0 0 22px' }}>{ins.messageSuccesTexte}</p>
            <button onClick={() => naviguer('login')} style={styleBtn}>→ Se connecter</button>
          </div>
        ) : (
          <div style={carteAuth}>
            <div style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }} aria-hidden="true"><input type="text" name="website" maxLength={100} value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
            {champInsc('prenom', ins.libelles.prenom, 'text', '', true)}
            {champInsc('nom', ins.libelles.nom, 'text', '', true)}
            {champInsc('email', ins.libelles.email, 'email', 'votre@courriel.com', true)}
            {ins.telephone.mode !== 'cache' && champInsc('telephone', 'Téléphone', 'tel', '', ins.telephone.mode === 'obligatoire')}
            {ins.adresse.mode !== 'cache' && <>
              {champInsc('adresse', 'Adresse', 'text', 'Numéro et rue', ins.adresse.mode === 'obligatoire')}
              {champInsc('ville', 'Ville', 'text', '', ins.adresse.mode === 'obligatoire')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {champInsc('code_postal', 'Code postal', 'text', 'H2X 1Y4', ins.adresse.mode === 'obligatoire')}
                <div style={{ marginBottom: 18 }}>
                  <label style={styleLabel}>Province{ins.adresse.mode === 'obligatoire' ? ' *' : ''}</label>
                  <select value={inscVal.province || 'QC'} onChange={e => setInscVal(f => ({ ...f, province: e.target.value }))} style={styleInput}>{PROVINCES.map(pv => <option key={pv.code} value={pv.code}>{pv.nom}</option>)}</select>
                </div>
              </div>
            </>}
            {champInsc('mdp', ins.libelles.mot_de_passe, 'password', 'Minimum 8 caractères', true)}
            {champInsc('mdp2', ins.libelles.confirmation, 'password', '', true)}
            {inscVal.mdp2 && inscVal.mdp !== inscVal.mdp2 && <div style={{ fontSize: 12, color: '#ef4444', margin: '-10px 0 14px' }}>⚠️ Les mots de passe ne correspondent pas.</div>}
            {ins.champs.map((c: ChampInsc) => c.type === 'checkbox'
              ? caseInsc('c_' + c.id, c.label, !!c.requis)
              : champInsc('c_' + c.id, c.label, c.type, c.placeholder || '', !!c.requis, c.options))}
            {ins.infolettre.affiche && caseInsc('infolettre', ins.infolettre.texte, false)}
            {ins.age.affiche && caseInsc('age', String(ins.age.texte).replace('{age}', String(ins.age.minimum)), true)}
            {ins.termes.affiche && caseInsc('termes', /^https?:\/\//i.test(ins.termes.url || '')
              ? <a href={urlSure(ins.termes.url) || undefined} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: cp, textDecoration: 'underline' }}>{ins.termes.texte}</a>
              : ins.termes.texte, true)}
            {inscErreur && <div role="alert" style={{ background: 'var(--sk-errbg)', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--sk-err)' }}>⚠️ {inscErreur}</div>}
            <button onClick={handleInscription} disabled={inscStatut === 'loading'} style={styleBtn}>{inscStatut === 'loading' ? '⏳ Création en cours…' : ins.boutonTexte}</button>
          </div>
        )}
      </div>
    </div>
  );

  const PageLogin = () => (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sk-t)', margin: 0 }}>Connexion</h1>
          <p style={{ color: 'var(--sk-d)', marginTop: 10, fontSize: 14 }}>Accédez à votre panier, vos commandes et votre compte</p>
        </div>
        <div style={carteAuth}>
          <div style={{ marginBottom: 18 }}><label style={styleLabel}>Courriel</label><input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: limiterSaisie(e.target.value, 254) }))} maxLength={254} placeholder="votre@courriel.com" style={styleInput} /></div>
          <div style={{ marginBottom: 24 }}><label style={styleLabel}>Mot de passe</label><input type="password" value={loginForm.mdp} onChange={e => setLoginForm(f => ({ ...f, mdp: limiterSaisie(e.target.value, 200) }))} maxLength={200} placeholder="••••••••" style={styleInput} onKeyDown={e => e.key === 'Enter' && handleLogin()} /></div>
          {loginErreur && <div role="alert" style={{ background: 'var(--sk-errbg)', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--sk-err)' }}>❌ {loginErreur}</div>}
          <button onClick={handleLogin} disabled={loginStatut === 'loading'} style={styleBtn}>{loginStatut === 'loading' ? '⏳ Connexion…' : 'Se connecter →'}</button>
          <div style={{ textAlign: 'center', marginTop: 18 }}><span style={{ fontSize: 13, color: 'var(--sk-d)' }}>Pas encore de compte ? </span><button onClick={() => { setInscStatut('idle'); setInscErreur(''); naviguer('inscription'); }} style={{ background: 'none', border: 'none', color: cp, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>Créer un compte</button></div>
        </div>
      </div>
    </div>
  );

  const PageBlog = () => (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.blog.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{cfg.blog.titre}</h1>
      {cfg.blog.sousTitre && <p style={{ fontSize: 16, color: cs, marginBottom: 36 }}>{cfg.blog.sousTitre}</p>}
      {articles.length === 0 && !blogCharge
        ? <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--sk-d)' }}>…</div>
        : articles.length === 0
        ? <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--sk-d)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontSize: 20, color: 'var(--sk-t2)', marginBottom: 8 }}>Aucun article pour l'instant</h2>
            <p>Revenez bientôt !</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${cfg.blog.colonnes === 2 ? '340px' : '280px'},1fr))`, gap: 24 }}>
            {articles.map(a => (
              <div key={a.id} onClick={() => voirArticle(a)}
                style={{ background: 'var(--sk-s)', borderRadius: 18, border: '1px solid var(--sk-b)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${cp}15`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                {a.photo && <img src={a.photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                <div style={{ padding: 20 }}>
                  {a.categorie && <span style={{ fontSize: 11, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.categorie}</span>}
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sk-t)', margin: '8px 0 10px', lineHeight: 1.3 }}>{a.titre}</h2>
                  {a.resume && <p style={{ fontSize: 14, color: 'var(--sk-d)', lineHeight: 1.6, marginBottom: 14 }}>{a.resume}</p>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--sk-d)' }}>
                    {cfg.blog.afficherAuteur && a.auteur && <span>✍️ {a.auteur}</span>}
                    {cfg.blog.afficherDate   && a.date_publication && <span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
      {blogPage < blogPages && <div style={{ textAlign: 'center', marginTop: 36 }}><button onClick={() => chargerArticles(blogPage + 1)} style={{ background: 'none', border: `2px solid ${cp}`, color: cp, borderRadius: 18, padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Voir plus d'articles</button></div>}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE ARTICLE BLOG
  // ══════════════════════════════════════════════════════════════════════════
  const PageArticle = () => {
    if (!articleActif) return null;
    const a = articleActif;
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        <button onClick={() => setPage('blog')} style={{ background: 'none', border: 'none', color: cp, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Retour au blogue
        </button>
        {a.photo && <img src={a.photo} alt="" style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 18, marginBottom: 32 }} />}
        {a.categorie && <span style={{ fontSize: 12, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.categorie}</span>}
        <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: 'var(--sk-t)', margin: '12px 0 16px', lineHeight: 1.2 }}>{a.titre}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--sk-d)', marginBottom: 32 }}>
          {cfg.blog.afficherAuteur && a.auteur && <span>✍️ {a.auteur}</span>}
          {cfg.blog.afficherDate && a.date_publication && <span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
        </div>
        {a.resume && <p style={{ fontSize: 18, color: 'var(--sk-t2)', lineHeight: 1.8, marginBottom: 32, fontStyle: 'italic', borderLeft: `4px solid ${cp}`, paddingLeft: 20 }}>{a.resume}</p>}
        <style>{`.sp-article{font-size:16px;line-height:1.9;color:var(--sk-t2);overflow-wrap:anywhere}.sp-article h2{font-size:24px;font-weight:800;color:var(--sk-t);margin:1.8em 0 .6em;line-height:1.25}.sp-article h3{font-size:19px;font-weight:700;color:${cp};margin:1.5em 0 .5em}.sp-article h4{font-size:16px;font-weight:700;color:var(--sk-t);margin:1.3em 0 .4em}.sp-article p{margin:0 0 1.1em}.sp-article a{color:${cp};text-decoration:underline}.sp-article img{max-width:100%;height:auto;border-radius:12px;margin:14px 0}.sp-article blockquote{border-left:3px solid ${cp};margin:1.4em 0;padding:.4em 1.2em;background:#f8fafc;border-radius:0 8px 8px 0;font-style:italic}.sp-article ul,.sp-article ol{padding-left:1.5em;margin:0 0 1.1em}.sp-article ul{list-style:disc}.sp-article ol{list-style:decimal}.sp-article li{margin-bottom:.4em}.sp-article hr{border:none;border-top:1px solid var(--sk-b);margin:2em 0}.sp-article table{width:100%;border-collapse:collapse;margin:1.4em 0;font-size:14px;display:block;overflow-x:auto}.sp-article th{color:${cp};text-align:left;padding:10px 12px;border-bottom:2px solid var(--sk-b)}.sp-article td{padding:9px 12px;border-bottom:1px solid var(--sk-b)}.sp-article pre,.sp-article code{background:#f3f4f6;border-radius:6px;padding:2px 6px;font-size:.9em}.sp-article pre{padding:14px;overflow-x:auto}`}</style>
        {a.contenu !== undefined
          ? <div className="sp-article" dangerouslySetInnerHTML={{ __html: a.contenu || '<p>Contenu à venir…</p>' }} />
          : articleErreur
            ? <p style={{ fontSize: 15, color: 'var(--sk-d)', lineHeight: 1.9 }}>Cet article est introuvable ou n'est plus disponible.</p>
            : <p style={{ fontSize: 15, color: 'var(--sk-d)' }}>Chargement…</p>}
        {(a.tags || []).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 36 }}>{(a.tags || []).map(t => <span key={t} style={{ fontSize: 12, color: 'var(--sk-d)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '4px 12px' }}>#{t}</span>)}</div>}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE FAQ
  // ══════════════════════════════════════════════════════════════════════════
  const PageFaq = () => (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.faq.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{cfg.faq.titre}</h1>
      {cfg.faq.sousTitre && <p style={{ fontSize: 16, color: cs, marginBottom: 40 }}>{cfg.faq.sousTitre}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {(cfg.faq.items.length > 0 ? cfg.faq.items : (configBrut?.__produits_demo__ ? FAQ_DEMO : [])).map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--sk-b)' }}>
            <button onClick={() => setFaqOuvert(faqOuvert === i ? null : i)}
              style={{ width: '100%', background: 'none', border: 'none', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16, textAlign: 'left' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--sk-t)', lineHeight: 1.4 }}>{item.question}</span>
              <span style={{ fontSize: 20, color: cp, flexShrink: 0, transition: 'transform 0.2s', transform: faqOuvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {faqOuvert === i && (
              <div style={{ paddingBottom: 20, fontSize: 15, color: 'var(--sk-t2)', lineHeight: 1.7 }}>{item.reponse}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE À PROPOS (Config Mes pages → À propos ; vide : exemples affichés seulement en démo)
  // ══════════════════════════════════════════════════════════════════════════
  const PageAPropos = () => {
    const ap: any = rawSK.aPropos || {};
    const demo = !!configBrut?.__produits_demo__;
    const liste = (cle: string, ex: any[], ok: (x: any) => boolean) => { const l = (Array.isArray(ap[cle]) ? ap[cle] : []).filter((x: any) => x && typeof x === 'object' && ok(x)); return l.length > 0 ? l : (demo ? ex : []); };
    const valeurs = liste('valeurs', APROPOS_DEMO.valeurs, x => !!(x.titre || x.desc));
    const chiffres = liste('chiffres', APROPOS_DEMO.chiffres, x => !!(x.nb || x.label));
    const equipe = liste('equipe', APROPOS_DEMO.equipe, x => !!(x.prenom || x.poste));
    const t = (cle: string, defaut: string) => (typeof ap[cle] === 'string' && ap[cle].trim()) ? ap[cle].trim() : defaut;
    const accroche = t('accroche', demo ? APROPOS_DEMO.accroche : '');
    const description = t('description', demo ? APROPOS_DEMO.description : '');
    const lbl: React.CSSProperties = { fontSize: 12, color: cp, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 };
    const coulEq = [cp, '#6366f1', '#10b981'];
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={lbl}>{t('sousTitre', 'Notre histoire')}</div>
        <h1 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 32px' }}>{t('titre', 'À propos')}</h1>
        {(accroche || description) && (
          <div style={{ background: `${cp}0d`, border: `1px solid ${cp}25`, borderRadius: 18, padding: isMobile ? '28px 20px' : '44px 52px', marginBottom: 48 }}>
            <div style={{ maxWidth: 680 }}>
              {accroche && <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--sk-t)', lineHeight: 1.5, margin: '0 0 16px' }}>{accroche}</p>}
              {description && <p style={{ fontSize: 15, color: 'var(--sk-t2)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{description}</p>}
            </div>
          </div>
        )}
        {ap.afficherValeurs !== false && valeurs.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={lbl}>{t('valeursSurtitre', 'Nos engagements')}</div>
              <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--sk-t)', margin: 0 }}>{t('valeursTitre', 'Ce en quoi nous croyons')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
              {valeurs.map((v: any, i: number) => (
                <div key={i} style={{ background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '24px 22px' }}>
                  {v.ico && <div style={{ width: 48, height: 48, borderRadius: 18, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{v.ico}</div>}
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-t)', margin: '0 0 8px' }}>{v.titre}</h3>
                  <p style={{ fontSize: 14, color: 'var(--sk-d)', lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {ap.afficherChiffres !== false && chiffres.length > 0 && (
          <div style={{ background: 'var(--sk-s2)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '36px 20px', marginBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : `repeat(${Math.min(chiffres.length, 4)},1fr)`, gap: 24, textAlign: 'center' }}>
              {chiffres.map((x: any, i: number) => (
                <div key={i}><div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: cp, marginBottom: 4 }}>{x.nb}</div><div style={{ fontSize: 13, color: 'var(--sk-d)' }}>{x.label}</div></div>
              ))}
            </div>
          </div>
        )}
        {ap.afficherEquipe !== false && equipe.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={lbl}>{t('equipeSurtitre', 'À propos')}</div>
              <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--sk-t)', margin: 0 }}>{t('equipeTitre', 'Notre équipe')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
              {equipe.map((m: any, i: number) => { const col = coulEq[i % 3]; const photo = /^https?:\/\//i.test(m.photo || '') ? m.photo : ''; return (
                <div key={i} style={{ background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
                  {photo
                    ? <img src={photo} alt={m.prenom || ''} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block' }} />
                    : <div style={{ width: 72, height: 72, borderRadius: '50%', background: col, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>{(m.prenom || '?').charAt(0).toUpperCase()}</div>}
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 4 }}>{m.prenom}</div>
                  <div style={{ fontSize: 13, color: col, fontWeight: 600 }}>{m.poste}</div>
                </div>
              ); })}
            </div>
          </div>
        )}
        {ap.afficherVisite !== false && (() => {
          const v: any = ap.visite || {};
          const demoV = !!configBrut?.__produits_demo__;
          const vTitre = nettoyerEnvoi(v.titre, 100) || (demoV ? APROPOS_DEMO.visite.titre : '');
          const vTexte = nettoyerEnvoi(v.texte, 1000) || (demoV ? APROPOS_DEMO.visite.texte : '');
          const vAdresse = nettoyerEnvoi(v.adresse, 200) || (demoV ? APROPOS_DEMO.visite.adresse : '');
          const vHoraires = nettoyerEnvoi(v.horaires, 200) || (demoV ? APROPOS_DEMO.visite.horaires : '');
          if (!vTitre && !vTexte && !vAdresse && !vHoraires) return null;
          return (
            <div style={{ background: 'var(--sk-s)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: isMobile ? '28px 20px' : '40px 44px', marginBottom: 48, textAlign: 'center' }}>
              <div style={lbl}>{nettoyerEnvoi(v.surtitre, 60) || 'Nous rendre visite'}</div>
              {vTitre && <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 14px' }}>{vTitre}</h2>}
              {vTexte && <p style={{ fontSize: 15, color: 'var(--sk-t2)', lineHeight: 1.8, maxWidth: 640, margin: '0 auto 18px', whiteSpace: 'pre-line' }}>{vTexte}</p>}
              {vAdresse && <p style={{ fontSize: 14, color: 'var(--sk-d)', margin: '0 0 6px' }}>📍 {vAdresse}</p>}
              {vHoraires && <p style={{ fontSize: 14, color: cp, fontWeight: 600, margin: 0 }}>🕗 {vHoraires}</p>}
            </div>
          );
        })()}
        {ap.afficherCta !== false && (
          <div style={{ textAlign: 'center', padding: '44px 24px', background: `${cp}0d`, border: `1px solid ${cp}25`, borderRadius: 18 }}>
            <div style={lbl}>{t('ctaSurtitre', 'Rejoignez-nous')}</div>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--sk-t)', margin: '0 0 10px' }}>{t('ctaTitre', "Besoin d'un conseil ?")}</h2>
            <p style={{ fontSize: 15, color: 'var(--sk-t2)', margin: '0 auto 24px', maxWidth: 460 }}>{t('ctaTexte', 'Découvrez la boutique dès maintenant.')}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => naviguer('catalogue')} style={{ background: cp, color: surCp, border: 'none', borderRadius: 18, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t('ctaBoutonCatalogue', 'Voir notre catalogue →')}</button>
              <button onClick={() => naviguer('contact')} style={{ background: 'var(--sk-s)', color: 'var(--sk-t)', border: '1px solid var(--sk-b)', borderRadius: 18, padding: '13px 24px', fontSize: 15, cursor: 'pointer' }}>{t('ctaBoutonContact', 'Nous contacter')}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE CONTACT
  // ══════════════════════════════════════════════════════════════════════════
  const PageContact = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.contact.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--sk-t)', marginBottom: 8 }}>{cfg.contact.titre}</h1>
      {cfg.contact.sousTitre && <p style={{ fontSize: 16, color: cs, marginBottom: 40 }}>{cfg.contact.sousTitre}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48 }}>
        {/* Coordonnées */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 24 }}>Nos coordonnées</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cfg.contact.adresse && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 18, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-d)', marginBottom: 2 }}>Adresse</div><div style={{ fontSize: 15, color: 'var(--sk-t)' }}>{cfg.contact.adresse}</div></div>
              </div>
            )}
            {cfg.contact.telephone && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 18, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📞</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-d)', marginBottom: 2 }}>Téléphone</div><a href={`tel:${cfg.contact.telephone}`} style={{ fontSize: 15, color: cp, textDecoration: 'none', fontWeight: 600 }}>{cfg.contact.telephone}</a></div>
              </div>
            )}
            {cfg.contact.courriel && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 18, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉️</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-d)', marginBottom: 2 }}>Courriel</div><a href={`mailto:${cfg.contact.courriel}`} style={{ fontSize: 15, color: cp, textDecoration: 'none', fontWeight: 600 }}>{cfg.contact.courriel}</a></div>
              </div>
            )}
          </div>
          {cfg.contact.afficherCarte && urlSure(cfg.contact.urlCarte) && (
            <div style={{ marginTop: 28, borderRadius: 18, overflow: 'hidden', height: 260 }}>
              <iframe src={urlSure(cfg.contact.urlCarte)} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Carte" />
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--sk-t)', marginBottom: 24 }}>Envoyer un message</h2>
          {contactEnvoi === 'ok'
            ? <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 18, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <h3 style={{ color: '#16a34a', margin: '0 0 8px' }}>Message envoyé !</h3>
                <p style={{ color: 'var(--sk-t2)', margin: 0 }}>Nous vous répondrons dans les meilleurs délais.</p>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sk-t2)', display: 'block', marginBottom: 6 }}>Votre nom</label>
                  <input value={contactForm.nom} onChange={e => setContactForm(f => ({ ...f, nom: limiterSaisie(e.target.value, 100) }))} maxLength={100} placeholder="Jean Tremblay" style={styleInput} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sk-t2)', display: 'block', marginBottom: 6 }}>Votre courriel</label>
                  <input type="email" value={contactForm.courriel} onChange={e => setContactForm(f => ({ ...f, courriel: limiterSaisie(e.target.value, 254) }))} maxLength={254} placeholder="jean@exemple.ca" style={styleInput} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sk-t2)', display: 'block', marginBottom: 6 }}>Votre message</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: limiterSaisie(e.target.value, 5000) }))} maxLength={5000} rows={5} placeholder="Décrivez votre question..." style={{ ...styleInput, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }} aria-hidden="true"><input type="text" name="website" maxLength={100} value={contactPiege} onChange={e => setContactPiege(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                {contactEnvoi === 'err' && <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>❌ {contactErr || 'Erreur — vérifiez les champs et réessayez.'}</p>}
                <button onClick={envoyerContact} disabled={contactEnvoi === 'loading' || !contactForm.nom || !contactForm.courriel || !contactForm.message}
                  style={{ ...styleBtn, opacity: (!contactForm.nom || !contactForm.courriel || !contactForm.message) ? 0.5 : 1 }}>
                  {contactEnvoi === 'loading' ? '⏳ Envoi...' : 'Envoyer le message →'}
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  // Espace acheteur : plein écran (panier, caisse, commandes) ; il a son propre menu et son bouton « Retour à la boutique »
  // Liens légaux du pied de page : seulement les politiques rédigées et affichées (en démonstration : toutes)
  const polFooter: any = { ...CFG_DEF.footer.politiques, ...(cfg.footer.politiques || {}) };
  const polVisible = (slug: string) => !!configBrut?.__produits_demo__ || (politiquesRedigees ? politiquesRedigees[slug] === true : false);
  const liensPol: string[][] = [['retour-remboursement','Retour & remboursement',polFooter.afficherRetours],['confidentialite','Confidentialité',polFooter.afficherConfidentialite],['conditions-service','Conditions de service',polFooter.afficherConditions],['expedition','Expédition',polFooter.afficherLivraison],['coordonnees','Coordonnées',polFooter.afficherCoordonnees],['mentions-legales','Mentions légales',polFooter.afficherMentions]].filter(([slug, , actif]) => (actif as any) !== false && polVisible(slug as string)).map(([slug, label]) => [slug as string, label as string]);

  if (page === 'compte') return <AppAcheteurBoutique key={vueCompte} vendeurId={vendeurId} pageInitiale={vueCompte} config={{ couleur_accent: cpPartage, nom_boutique: cfg.footer.nomBoutique, gestionnaire_id: vendeurId }} naviguerTemplate={(d: any) => { setVueCompte('dashboard'); if (d && d.page === 'produit') { const pr = produits.find(x => Number(x.id) === Number(d.produitId)); if (pr) { voirProduit(pr); return; } } naviguer(d && d.page ? d.page : 'accueil'); }} />;

  return (
    <div style={{ ...varsTheme, fontFamily: "'DM Mono', 'Inter', monospace", background: fondPage, color: texteCouleur, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${police.google}&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } button { font-family: inherit; color: inherit; } ::placeholder { color: var(--sk-d); opacity: 1; } .sk-rech::placeholder { color: #6b4545; } select option { background: #ffffff; color: #ffffff; } h1, h2, .sk-fh { font-family: var(--sk-fh); font-weight: var(--sk-fhw) !important; } .sk-grad { color: var(--sk-hl, #4a2b2b); } .sk-pill { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: #e0525c; color: #ffffff; border: 2px solid #4a2b2b; border-radius: 999px; padding: 12px 28px; box-shadow: 0 4px 0 #4a2b2b; box-shadow: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s ease, box-shadow 0.15s ease; } .sk-pill::after { content: '→'; margin-left: 4px; }
.sk-pill:hover { filter: brightness(1.08); transform: translateY(1px); }
.sk-onde { height: 12px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='12' viewBox='0 0 28 12'%3E%3Cpath d='M0 6 Q7 0 14 6 T28 6' fill='none' stroke='%23e0525c' stroke-width='2'/%3E%3C/svg%3E"); background-repeat: repeat-x; background-position: center; opacity: 0.85; } .sk-fondu { animation: sk-fondu 0.5s ease; } .sk-defil { scrollbar-width: none; } .sk-defil::-webkit-scrollbar { display: none; } @keyframes sk-fondu { from { opacity: 0; } to { opacity: 1; } } @keyframes ag-defile { from { transform: translateX(0); } to { transform: translateX(-50%); } } @media (prefers-reduced-motion: reduce) { .ag-defile, .sk-fondu { animation: none !important; } } .ag-defile:hover { animation-play-state: paused !important; }`}</style>

      {vendeurId > 0 && !configBrut?.__produits_demo__ && <BoutiqueVerificateurAge gid={vendeurId} />}
      <Nav />
      {vendeurId > 0 && <BoutiqueSouhaitsAcces clair={!sombre} gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo} ouvrir={ouvrirSouhaits} variante="flottant" />}
      {vendeurId > 0 && <BoutiqueFavorisToast gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo} />}
      {avisPanier && <div role="status" style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: 'var(--sk-s)', border: `1px solid ${cp}`, color: 'var(--sk-t)', padding: '12px 20px', borderRadius: 18, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', maxWidth: '92vw' }}>{avisPanier}</div>}

      <main style={{ flex: 1 }}>
        {page === 'accueil'   && <PageAccueil />}
        {page === 'catalogue' && <PageCatalogue />}
        {page === 'produit'   && PageProduit()}
        {page === 'blog'      && <PageBlog />}
        {page === 'politique' && <PagePolitique />}
        {page === 'article'   && <PageArticle />}
        {page === 'faq'       && <PageFaq />}
        {page === 'a-propos'  && <PageAPropos />}
        {page === 'contact'   && <PageContact />}
        {page === 'offres'    && PageOffres()}
        {page === 'encheres'  && PageEncheres()}
        {page === 'login'     && PageLogin()}
        {page === 'inscription' && PageInscription()}
      </main>

      {cfg.accueil.afficherRemonter !== false && remonterVisible && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Remonter en haut de la page" style={{ position: 'fixed', left: isMobile ? 12 : 24, bottom: isMobile ? 14 : 28, zIndex: 90, width: isMobile ? 46 : 56, height: isMobile ? 46 : 56, borderRadius: '50%', background: cp, color: (luminance(cp) > 0.55 ? '#4a2b2b' : '#ffffff'), border: '2px solid var(--sk-b)', boxShadow: '0 4px 12px rgba(0,0,0,0.22)', cursor: 'pointer', fontSize: 20, fontWeight: 800 }}>↑</button>
      )}

      <Footer cfg={cfg.footer} plus={rawSK.footer} onNaviguer={naviguer} liensPol={liensPol} extra={vendeurId > 0 && !configBrut?.__produits_demo__ ? (
        <>
          <BoutiqueInfolettre gestionnaireId={vendeurId} couleur={cpPartage} theme={{ titre: cfg.footer.couleurTexte, doux: hexVersRgba(cfg.footer.couleurTexte, 0.65), bord: hexVersRgba(cfg.footer.couleurTexte, 0.14), champFond: hexVersRgba(cfg.footer.couleurTexte, 0.08), champBord: hexVersRgba(cfg.footer.couleurTexte, 0.25), champTexte: cfg.footer.couleurTexte, boutonTexte: '#fff' }} />
          <BoutiqueBoutonInstallerApp couleur={cpPartage} texte={cfg.footer.couleurTexte} texteDoux={hexVersRgba(cfg.footer.couleurTexte, 0.75)} />
        </>
      ) : undefined} />
    </div>
  );
}