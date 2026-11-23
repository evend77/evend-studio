// CHEMIN : src/pages/gestionnaire/ConfigMesPagesRose.tsx
// e-Vend Studio — Configuration des pages du template Simplisse Rosé (indépendant des autres templates)
// Pattern identique à ConfigTemplateFoodTruck : panneau gauche + aperçu droit
// 100% mobile responsive

import ArticlesBlogConfig, { useArticlesBlog } from '../../components/ArticlesBlogConfig';
import { useState, useEffect, useCallback } from 'react';
import { POLICES_RS } from '../../templates/TemplateBoutiqueRose';   // liste fermée des polices

// ─── Couleur principale Simplisse Rosé ────────────────────────────────────────────
const CP = '#e0147a';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionPage {
  id: string;
  label: string;
  icone: string;
  actif: boolean;
  ordre: number;
}

interface ConfigBanniere {
  defilant?: boolean;
  actif: boolean;
  texte: string;
  couleurFond: string;
  couleurTexte: string;
  lien: string;
  labelLien: string;
}

interface ConfigHero {
  titre: string;
  sousTitre: string;
  boutonLabel: string;
  boutonLien: string;
  photo: string;
  couleurFond: string;
  couleurTitre: string;
  couleurBouton: string;
  style: 'centre' | 'gauche' | 'image-fond';
}

interface ConfigCatalogue {
  titre: string;
  sousTitre: string;
  colonnes: 2 | 3 | 4;
  afficherFiltres: boolean;
  afficherRecherche: boolean;
  afficherPrix: boolean;
  afficherStock: boolean;
  hero: ConfigHero;
  banniere: ConfigBanniere;
  sections: SectionPage[];
}

interface ConfigPageAccueil {
  hero: ConfigHero;
  banniere: ConfigBanniere;
  sections: SectionPage[];
  couleurPrimaire: string;
  couleurSecondaire: string;
  couleurFondPage: string;
  couleurTexte: string;
  police: string;
  mode: 'sombre' | 'clair';
  afficherBascule: boolean;
  afficherRemonter: boolean;
  temoignages?: { titre?: string; texte: string; auteur: string; lieu?: string; photo?: string; note: number }[];
  couleurAccent?: string; couleurViolet?: string; comparatif?: any; parcourir?: any; onde?: any; grostexte?: any; vitrine?: any; trouveur?: any; galerie?: any; grandnom?: any; collections?: any; temoignagesSousTitre?: string; temoignagesPhotos?: string; seuilStock?: number | string;
  entete?: any; ticker?: any; diaporama?: any[]; vedette?: any; nouveautes?: any; selection?: any; bandeaux?: any[]; tuiles?: any[]; tuilesDisposition?: string; focus?: any; marques?: any; decompte?: any; presentation?: any; etapes?: any; accordeon?: any; accordeon2?: any; pastilles?: any; temoignagesTitre?: string; blogApercu?: any;
  avantages?: { ico: string; titre: string; desc: string }[];
}

interface ConfigFooter {
  nomBoutique: string;
  slogan: string;
  couleurFond: string;
  couleurTexte: string;
  afficherPropulse: boolean; // toggle "Propulsé par e-Vend Studio"
  images?: string[];         // bande d'images au-dessus du pied de page
  bande?: string; aide?: any; paiements?: string;   // Rosé : bande d'engagements, boîte d'aide, moyens de paiement
  reseaux: {
    facebook: string;
    instagram: string;
    tiktok: string;
    twitter: string;
    youtube: string;
    linkedin: string;
    pinterest: string;
  };
  colonnes: {
    titre1: string; liens1: string;
    titre2: string; liens2: string;
    titre3: string; liens3: string;
  };
  politiques: {
    afficherConditions: boolean;
    afficherConfidentialite: boolean;
    afficherRetours: boolean;
    afficherLivraison: boolean;
    afficherMentions?: boolean;
    afficherCoordonnees?: boolean;
  };
}

interface ConfigFaq {
  titre: string;
  sousTitre: string;
  hero: ConfigHero;
  banniere: ConfigBanniere;
  items: { question: string; reponse: string }[];
}

interface ConfigBlog {
  titre: string;
  sousTitre: string;
  hero: ConfigHero;
  banniere: ConfigBanniere;
  afficherAuteur: boolean;
  afficherDate: boolean;
  colonnes: 2 | 3;
}

interface ConfigContact {
  titre: string;
  sousTitre: string;
  hero: ConfigHero;
  banniere: ConfigBanniere;
  adresse: string;
  telephone: string;
  courriel: string;
  afficherCarte: boolean;
  urlCarte: string;
}


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

// Menu du haut configurable (liens, listes déroulantes, méga-menus)
type TypeLien = 'page' | 'categorie' | 'url';
interface LienMenu { label: string; type: TypeLien; cible: string }
interface ColonneMenu { titre: string; liens: LienMenu[] }
interface EntreeMenu { label: string; style: 'lien' | 'liste' | 'mega'; type: TypeLien; cible: string; liens: LienMenu[]; colonnes: ColonneMenu[]; intro: string; promo: { image: string; titre: string; bouton: string; type: TypeLien; cible: string }; actif: boolean }

interface ConfigRose {
  identite: { logoUrl: string };   // logo affiché dans le menu
  accueil:  ConfigPageAccueil;
  catalogue: ConfigCatalogue;
  faq:      ConfigFaq;
  blog:     ConfigBlog;
  contact:  ConfigContact;
  footer:      ConfigFooter;
  ficheProduit: ConfigFicheProduit;
  aPropos: any;       // page « À propos » (vide = rien d'inventé sur le site)
  menu: any;          // menu du haut : { entrees: EntreeMenu[] } ; libellés renommés + pages cachées (menu automatique)
  inscription: any;   // page « Créer un compte » (même modèle que Premium) ; fusionnée avec les défauts à la lecture
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const HERO_DEFAUT: ConfigHero = {
  titre: 'Passez au niveau supérieur',
  sousTitre: 'Découvrez notre sélection de produits.',
  boutonLabel: 'Voir la boutique',
  boutonLien: '/catalogue',
  photo: '',
  couleurFond: '#d9c8ff',
  couleurTitre: '#1b0f33',
  couleurBouton: '#e0147a',
  style: 'image-fond',
};

const BANNIERE_DEFAUT: ConfigBanniere = {
  defilant: false,
  actif: false,
  texte: '',
  couleurFond: CP,
  couleurTexte: '#ffffff',
  lien: '',
  labelLien: 'En savoir plus',
};

const SECTIONS_ACCUEIL: SectionPage[] = [
  { id: 'banniere', label: "Bannière promo", icone: '📢', actif: true, ordre: 1 },
  { id: 'hero', label: "Diaporama (photo + texte)", icone: '🖼', actif: true, ordre: 2 },
  { id: 'onde', label: "Texte ondulé qui défile", icone: '🌊', actif: true, ordre: 3 },
  { id: 'parcourir', label: "Magasiner par catégorie (liste)", icone: '🛍', actif: true, ordre: 4 },
  { id: 'vedette', label: "Meilleurs vendeurs (rangée)", icone: '⭐', actif: true, ordre: 5 },
  { id: 'grostexte', label: "Grand texte avec petites photos", icone: '🔤', actif: true, ordre: 6 },
  { id: 'categories', label: "Collections (carrousel)", icone: '🗂', actif: true, ordre: 7 },
  { id: 'vitrine', label: "Vitrine produit (photo + points)", icone: '📍', actif: true, ordre: 8 },
  { id: 'nouveautes', label: "Nouveautés (rangée)", icone: '🆕', actif: true, ordre: 9 },
  { id: 'trouveur', label: "Question avec réponses A, B, C", icone: '❓', actif: true, ordre: 10 },
  { id: 'comparatif', label: "Tableau comparatif", icone: '📊', actif: true, ordre: 11 },
  { id: 'avantages', label: "Engagements (cartes)", icone: '✅', actif: true, ordre: 12 },
  { id: 'temoignages', label: "Avis (cartes)", icone: '💬', actif: true, ordre: 13 },
  { id: 'galerie', label: "Galerie de photos inclinées", icone: '📷', actif: true, ordre: 14 },
  { id: 'pastilles', label: "Pastilles de garanties", icone: '🔰', actif: true, ordre: 15 },
  { id: 'blog-apercu', label: "Aperçu du blogue", icone: '📝', actif: true, ordre: 16 },
  { id: 'grandnom', label: "Grand nom de la boutique", icone: '🔠', actif: true, ordre: 17 },
  { id: 'ticker', label: "Bandeau défilant (simple)", icone: '➡️', actif: false, ordre: 18 },
  { id: 'bandeau', label: "Grandes bannières", icone: '🎯', actif: false, ordre: 19 },
  { id: 'focus', label: "Mise en avant (image + produits)", icone: '🔥', actif: false, ordre: 20 },
  { id: 'etapes', label: "Points forts numérotés + image", icone: '🔢', actif: false, ordre: 21 },
  { id: 'presentation', label: "À propos (texte + photo)", icone: '✨', actif: false, ordre: 22 },
  { id: 'tuiles', label: "Cartes promo", icone: '🃏', actif: false, ordre: 23 },
  { id: 'marques', label: "Bande de marques", icone: '🏷', actif: false, ordre: 24 },
  { id: 'decompte', label: "Compte à rebours", icone: '⏱', actif: false, ordre: 25 },
  { id: 'accordeon', label: "Questions / réponses (bloc 1)", icone: '➕', actif: false, ordre: 26 },
  { id: 'accordeon2', label: "Questions / réponses (bloc 2)", icone: '➖', actif: false, ordre: 27 },
  { id: 'selection', label: "Notre sélection (rangée)", icone: '💎', actif: false, ordre: 28 },
  { id: 'promo', label: "Promos", icone: '💲', actif: false, ordre: 29 },
  { id: 'newsletter', label: "Infolettre", icone: '📧', actif: false, ordre: 30 },
];

const SECTIONS_CATALOGUE: SectionPage[] = [
  { id: 'banniere',   label: 'Bannière promo',      icone: '📢', actif: false, ordre: 1 },
  { id: 'hero',       label: 'Section Hero',        icone: '🖼', actif: false, ordre: 2 },
  { id: 'filtres',    label: 'Barre de filtres',    icone: '🔍', actif: true,  ordre: 3 },
  { id: 'grille',     label: 'Grille produits',     icone: '📦', actif: true,  ordre: 4 },
  { id: 'pagination', label: 'Pagination',          icone: '📄', actif: true,  ordre: 5 },
];


const FICHE_PRODUIT_DEFAUT: ConfigFicheProduit = {
  layout:              'image-gauche',
  photosMiniatures:    'dessous',
  descriptionPosition: 'droite',
  descriptionTronquee: false,
  afficherBreadcrumb:  true,
  afficherStock:       true,
  afficherCategorie:   true,
  afficherSku:         false,
  afficherRabaisPct:   true,
  afficherQte:         true,
  boutonLabel:         'Ajouter au panier',
  boutonCouleur:       CP,
  afficherReassurance: true,
  reassuranceItems: [
    { icone: '🔒', texte: 'Paiement sécurisé Stripe' },
    { icone: '🔄', texte: 'Retour sous 30 jours' },
    { icone: '🚚', texte: 'Livraison rapide 24–48h' },
  ],
  afficherPartage:     false,
  afficherSimilaires:  true,
  similairesNombre:    4,
  similairesTitre:     'Vous aimerez aussi',
};

// ─── Compte / Inscription (même modèle que Premium) ───────────────────────────
type TypeChampInsc = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
interface ChampInsc { id: string; type: TypeChampInsc; label: string; placeholder?: string; options?: string[]; requis?: boolean; }
const TYPE_CHAMP_LABELS: Record<TypeChampInsc, string> = { text: 'Texte court', email: 'Email', tel: 'Téléphone', select: 'Menu déroulant', textarea: 'Zone de texte', checkbox: 'Case à cocher' };
const MAX_CHAMPS_INSC = 10;
const INSCRIPTION_DEF = {
  titre: 'Créer un compte', sousTitre: '', boutonTexte: 'Créer mon compte',
  messageSuccesTitre: 'Compte créé avec succès !', messageSuccesTexte: 'Vous pouvez maintenant vous connecter.',
  libelles: { prenom: 'Prénom', nom: 'Nom', email: 'Courriel', mot_de_passe: 'Mot de passe', confirmation: 'Confirmez le mot de passe' },
  telephone: { mode: 'cache' as 'cache' | 'facultatif' | 'obligatoire' },
  adresse: { mode: 'obligatoire' as 'cache' | 'facultatif' | 'obligatoire' },
  infolettre: { affiche: false, texte: 'Je veux recevoir les nouveautés par courriel' },
  age: { affiche: true, minimum: 16, texte: 'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes: { affiche: true, texte: "J'accepte les termes et conditions de la boutique", url: '' },
  champs: [] as ChampInsc[],
};

// Fusionne la config sauvegardée avec les défauts (une config partielle ne perd jamais ses valeurs par défaut)
function fusionInscription(b: any) {
  const x = b && typeof b === 'object' ? b : {};
  const sous = (k: 'libelles' | 'telephone' | 'adresse' | 'infolettre' | 'age' | 'termes') => ({ ...INSCRIPTION_DEF[k], ...(x[k] && typeof x[k] === 'object' ? x[k] : {}) });
  return { ...INSCRIPTION_DEF, ...x, libelles: sous('libelles'), telephone: sous('telephone'), adresse: sous('adresse'), infolettre: sous('infolettre'), age: sous('age'), termes: sous('termes'), champs: Array.isArray(x.champs) ? x.champs : [] };
}

const CONFIG_DEFAUT: ConfigRose = {
  identite: { logoUrl: '' },
  accueil: {
    hero: { ...HERO_DEFAUT },
    banniere: { ...BANNIERE_DEFAUT },
    sections: SECTIONS_ACCUEIL,
    couleurPrimaire:   CP,
    couleurSecondaire: '#6e5f8e',
    couleurFondPage:   '',
    couleurTexte:      '',
    police: 'Fraunces',
    mode: 'clair',
    afficherBascule: false,
    afficherRemonter: true,
  },
  catalogue: {
    titre: 'Nos produits',
    sousTitre: 'Tous nos produits disponibles.',
    colonnes: 3,
    afficherFiltres:  true,
    afficherRecherche: true,
    afficherPrix:     true,
    afficherStock:    true,
    hero: { ...HERO_DEFAUT, titre: 'Nos produits', actif: false } as any,
    banniere: { ...BANNIERE_DEFAUT },
    sections: SECTIONS_CATALOGUE,
  },
  faq: {
    titre: 'Questions fréquentes',
    sousTitre: 'Trouvez rapidement les réponses à vos questions.',
    hero: { ...HERO_DEFAUT, titre: 'Questions fréquentes' },
    banniere: { ...BANNIERE_DEFAUT },
    items: [],   // vide : la gestionnaire écrit ses vraies réponses (aucune promesse inventée sur sa boutique)
  },
  blog: {
    titre: 'Notre blogue',
    sousTitre: 'Actualités, conseils et nouveautés.',
    hero: { ...HERO_DEFAUT, titre: 'Notre blogue' },
    banniere: { ...BANNIERE_DEFAUT },
    afficherAuteur: true,
    afficherDate:   true,
    colonnes: 3,
  },
  contact: {
    titre: 'Nous contacter',
    sousTitre: 'Une question ? Nous sommes là pour vous.',
    hero: { ...HERO_DEFAUT, titre: 'Nous contacter' },
    banniere: { ...BANNIERE_DEFAUT },
    adresse:    '',
    telephone:  '',
    courriel:   '',
    afficherCarte: false,
    urlCarte:   '',
  },
  footer: {
    nomBoutique: 'Ma Boutique Rosée',
    slogan:      '',
    couleurFond: '#c9b3ff',
    couleurTexte: '#1b0f33',
    afficherPropulse: true,
    images: [],
    reseaux: { facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes: { titre1:'Boutique', liens1:'Accueil\nNos produits\nÀ propos\nBlog\nContact', titre2:'Aide', liens2:'FAQ\nRetours\nLivraison\nContactez-nous', titre3:'Légal', liens3:'' },
    politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true, afficherMentions: true, afficherCoordonnees: true },
  },
  ficheProduit: { ...FICHE_PRODUIT_DEFAUT },
  inscription: INSCRIPTION_DEF,
  aPropos: { titre: '', sousTitre: '', accroche: '', description: '', afficherValeurs: true, afficherChiffres: true, afficherEquipe: true, afficherCta: true, valeursSurtitre: '', valeursTitre: '', valeurs: [] as any[], chiffres: [] as any[], equipeSurtitre: '', equipeTitre: '', equipe: [] as any[], ctaSurtitre: '', ctaTitre: '', ctaTexte: '', ctaBoutonCatalogue: '', ctaBoutonContact: '', afficherVisite: true, visite: { surtitre: '', titre: '', texte: '', adresse: '', horaires: '' } },
  menu: { accueil: '', catalogue: '', blog: '', faq: '', 'a-propos': '', contact: '', masques: [] as string[], entrees: [] as EntreeMenu[] },
};

const AIDE_LIENS = "Un lien peut être : une page (catalogue, blog, faq, contact, a-propos), une catégorie (cat:Peluches) ou une adresse (https://… ou /chemin).";

// Liste d'éléments modifiables (carte, tuile…) : champs texte, monter / descendre / supprimer
function EditeurListe({ liste, onChange, max, vide, champs, etiquette }: { liste: any[]; onChange: (l: any[]) => void; max: number; vide: any; etiquette: string; champs: { cle: string; label: string; max: number; placeholder?: string; aide?: string }[] }) {
  const maj = (i: number, p: any) => onChange(liste.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const bouger = (i: number, d: number) => { const a = [...liste]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <>
      {liste.map((b, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fafafa' }}>
          {champs.map(c => (
            <F key={c.cle} label={`${etiquette} ${i + 1} — ${c.label}`} desc={c.aide}><Inp value={b[c.cle] || ''} onChange={(v: string) => maj(i, { [c.cle]: v })} max={c.max} placeholder={c.placeholder} /></F>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={i === 0} onClick={() => bouger(i, -1)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>↑ Monter</button>
            <button disabled={i === liste.length - 1} onClick={() => bouger(i, 1)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: i === liste.length - 1 ? 'default' : 'pointer', opacity: i === liste.length - 1 ? 0.4 : 1 }}>↓ Descendre</button>
            <button onClick={() => onChange(liste.filter((_, k) => k !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
          </div>
        </div>
      ))}
      {liste.length < max && <button onClick={() => onChange([...liste, { ...vide }])} style={{ background: '#f3f4f6', border: '1px dashed #bbb', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Ajouter</button>}
    </>
  );
}

// ─── Composants utilitaires (même style que FoodTruck) ───────────────────────

// Protection des champs : retire les caractères de contrôle et limite la longueur à la frappe (le serveur nettoie aussi)
const limiter = (v: any, max: number): string => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
const Inp = ({ value, onChange, placeholder, type = 'text', max = 300 }: any) => (
  <input type={type} value={value ?? ''} placeholder={placeholder} maxLength={type === 'number' ? undefined : max}
    onChange={e => onChange(type === 'number' ? e.target.value.slice(0, 12) : limiter(e.target.value, max))}
    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box', fontFamily: 'inherit' }}
    onFocus={e => (e.target.style.borderColor = CP)}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Txt = ({ value, onChange, placeholder, rows = 3, max = 3000 }: any) => (
  <textarea value={value ?? ''} placeholder={placeholder} rows={rows} maxLength={max}
    onChange={e => onChange(limiter(e.target.value, max))}
    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box', lineHeight: 1.5 }}
    onFocus={e => (e.target.style.borderColor = CP)}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const F = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
    {desc && <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px', lineHeight: 1.5 }}>{desc}</p>}
    {children}
  </div>
);

const S = ({ titre, children }: any) => (
  <div style={{ marginBottom: 30 }}>
    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: CP, margin: '0 0 16px', paddingBottom: 10, borderBottom: '2px solid #eef2ff' }}>
      {titre}
    </h3>
    {children}
  </div>
);

const Couleur = ({ label, value, onChange }: any) => (
  <F label={label}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input type="color" value={value || '#1b0f33'} onChange={e => onChange(e.target.value)}
        style={{ width: 44, height: 40, padding: 2, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }} />
      <Inp value={value} onChange={onChange} max={9} />
    </div>
  </F>
);

const Toggle = ({ label, checked, onChange, desc }: any) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 14, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
      {desc && <p style={{ fontSize: 12, color: '#777', margin: '3px 0 0', lineHeight: 1.5 }}>{desc}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: checked ? CP : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background .25s', marginTop: 2 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
    </button>
  </div>
);

// ─── Gestionnaire de sections (réordonnables + toggle) ────────────────────────

function SectionsManager({ sections, onChange, couleur = CP }: { sections: SectionPage[]; onChange: (s: SectionPage[]) => void; couleur?: string }) {
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);

  const deplacer = (i: number, d: -1 | 1) => {
    const arr = [...sorted];
    const ni = i + d;
    if (ni < 0 || ni >= arr.length) return;
    const t = arr[i].ordre; arr[i] = { ...arr[i], ordre: arr[ni].ordre }; arr[ni] = { ...arr[ni], ordre: t };
    onChange(arr);
  };

  const toggler = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));

  return (
    <div>
      <div style={{ background: `${couleur}10`, border: `1px solid ${couleur}30`, borderRadius: 7, padding: 9, fontSize: 11, color: '#333', marginBottom: 12 }}>
        <strong>Sections</strong> — Activez/désactivez et réordonnez avec ▲▼
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: sec.actif ? `${couleur}08` : '#fafafa', border: `2px solid ${sec.actif ? couleur : '#e5e7eb'}`, borderRadius: 8, padding: '7px 9px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{sec.icone}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
            </div>
            <button onClick={() => toggler(sec.id)}
              style={{ width: 38, height: 19, borderRadius: 10, border: 'none', cursor: 'pointer', background: sec.actif ? couleur : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 1.5, left: sec.actif ? 19 : 1.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0}
                style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 7, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1}
                style={{ width: 18, height: 14, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 7, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 9, padding: '5px 9px', background: '#f5f5f5', borderRadius: 6, fontSize: 11, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section(s) active(s) sur {sorted.length}
      </div>
    </div>
  );
}

// ─── Éditeur Hero ─────────────────────────────────────────────────────────────

function EditorHero({ hero, onChange }: { hero: ConfigHero; onChange: (h: ConfigHero) => void }) {
  const set = (k: keyof ConfigHero, v: any) => onChange({ ...hero, [k]: v });
  return (
    <>
      <S titre="Textes">
        <F label="Titre principal"><Inp value={hero.titre} onChange={(v: string) => set('titre', v)} /></F>
        <F label="Sous-titre"><Txt value={hero.sousTitre} onChange={(v: string) => set('sousTitre', v)} rows={2} /></F>
        <F label="Label du bouton"><Inp value={hero.boutonLabel} onChange={(v: string) => set('boutonLabel', v)} /></F>
        <F label="Lien du bouton" desc="Ex: /catalogue"><Inp value={hero.boutonLien} onChange={(v: string) => set('boutonLien', v)} /></F>
      </S>
      <S titre="Photo">
        <F label="URL de l'image" desc="Collez l'URL d'une image hébergée"><Inp value={hero.photo} onChange={(v: string) => set('photo', v)} placeholder="https://..." /></F>
      </S>
      <S titre="Style">
        <F label="Disposition">
          <select value={hero.style} onChange={e => set('style', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, background: '#fff', color: '#1a1a1a' }}>
            <option value="centre">Centré</option>
            <option value="gauche">Aligné à gauche</option>
            <option value="image-fond">Image en fond</option>
          </select>
        </F>
        <Couleur label="Couleur de fond" value={hero.couleurFond} onChange={(v: string) => set('couleurFond', v)} />
        <Couleur label="Couleur du titre" value={hero.couleurTitre} onChange={(v: string) => set('couleurTitre', v)} />
        <Couleur label="Couleur du bouton" value={hero.couleurBouton} onChange={(v: string) => set('couleurBouton', v)} />
      </S>
    </>
  );
}

// ─── Éditeur Bannière ─────────────────────────────────────────────────────────

function EditorBanniere({ banniere, onChange }: { banniere: ConfigBanniere; onChange: (b: ConfigBanniere) => void }) {
  const set = (k: keyof ConfigBanniere, v: any) => onChange({ ...banniere, [k]: v });
  return (
    <>
      <Toggle label="Activer la bannière" checked={banniere.actif} onChange={(v: boolean) => set('actif', v)}
        desc="Affiche une bande d'annonce en haut de la page" />
      {banniere.actif && (
        <>
          <Toggle label="Texte défilant" checked={!!banniere.defilant} onChange={(v: boolean) => set('defilant', v)} desc="Le message défile en continu (désactivé automatiquement pour les visiteurs qui limitent les animations)." />
          <S titre="Contenu">
            <F label="Message"><Inp value={banniere.texte} onChange={(v: string) => set('texte', v)} placeholder="🎉 Livraison gratuite dès 75$!" /></F>
            <F label="Lien (optionnel)"><Inp value={banniere.lien} onChange={(v: string) => set('lien', v)} placeholder="https://..." /></F>
            <F label="Label du lien"><Inp value={banniere.labelLien} onChange={(v: string) => set('labelLien', v)} placeholder="En savoir plus" /></F>
          </S>
          <S titre="Couleurs">
            <Couleur label="Fond de la bannière" value={banniere.couleurFond} onChange={(v: string) => set('couleurFond', v)} />
            <Couleur label="Texte de la bannière" value={banniere.couleurTexte} onChange={(v: string) => set('couleurTexte', v)} />
          </S>
        </>
      )}
    </>
  );
}


function EditeurChampInscription({ champ, index, total, ouvertParDefaut, onChange, onSupprimer, onDeplacer }: {
  champ: ChampInsc; index: number; total: number; ouvertParDefaut?: boolean;
  onChange: (c: ChampInsc) => void; onSupprimer: () => void; onDeplacer: (dir: -1 | 1) => void;
}) {
  const [ouvert, setOuvert] = useState(!!ouvertParDefaut);
  const btnFleche = (actif: boolean) => ({ width: 20, height: 16, border: '1px solid #d1d5db', borderRadius: 3, background: actif ? '#fff' : '#f3f4f6', color: '#888', cursor: actif ? 'pointer' : 'default', fontSize: 8 } as const);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => onDeplacer(-1)} disabled={index === 0} style={btnFleche(index !== 0)}>▲</button>
          <button onClick={() => onDeplacer(1)} disabled={index === total - 1} style={btnFleche(index !== total - 1)}>▼</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#222' }}>{champ.label || '(sans nom)'}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{TYPE_CHAMP_LABELS[champ.type]}{champ.requis ? ' · Obligatoire' : ''}</p>
        </div>
        <button onClick={() => setOuvert(!ouvert)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>{ouvert ? '✕' : '✏️'}</button>
        <button onClick={onSupprimer} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
      </div>
      {ouvert && (
        <div style={{ padding: 14, borderTop: '1px solid #e5e7eb' }}>
          <F label="Libellé affiché"><Inp value={champ.label} onChange={(v: string) => onChange({ ...champ, label: v })} placeholder="Ex : Ville" /></F>
          <F label="Type de champ">
            <select value={champ.type} onChange={e => onChange({ ...champ, type: e.target.value as TypeChampInsc })}
              style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as const }}>
              {Object.entries(TYPE_CHAMP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          {champ.type !== 'checkbox' && champ.type !== 'select' && <F label="Texte d'exemple (placeholder)"><Inp value={champ.placeholder || ''} onChange={(v: string) => onChange({ ...champ, placeholder: v })} /></F>}
          {champ.type === 'select' && <F label="Options — une par ligne"><Txt value={(champ.options || []).join('\n')} onChange={(v: string) => onChange({ ...champ, options: v.split('\n').map(o => o.trim()).filter(Boolean) })} rows={4} /></F>}
          <Toggle label="Obligatoire" checked={!!champ.requis} onChange={(v: boolean) => onChange({ ...champ, requis: v })} />
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────


// ─── Éditeur du menu du haut : liens simples, listes déroulantes, méga-menus ─────────
const MAX_ENTREES = 8;
const PAGES_SITE: { v: string; l: string }[] = [
  { v: 'accueil', l: 'Accueil' }, { v: 'catalogue', l: 'Nos produits' }, { v: 'offres', l: 'Offres du jour' }, { v: 'encheres', l: 'Enchères' },
  { v: 'blog', l: 'Blog' }, { v: 'faq', l: 'FAQ' }, { v: 'a-propos', l: 'À propos' }, { v: 'contact', l: 'Contact' }, { v: 'compte', l: 'Mon compte' },
];
const lienVide = (): LienMenu => ({ label: '', type: 'page', cible: 'catalogue' });
const entreeVide = (): EntreeMenu => ({ label: '', style: 'lien', type: 'page', cible: 'catalogue', liens: [], colonnes: [], intro: '', promo: { image: '', titre: '', bouton: '', type: 'page', cible: 'catalogue' }, actif: true });
const selStyle: React.CSSProperties = { width: '100%', padding: '9px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, background: '#fff', color: '#1a1a1a', fontFamily: 'inherit', boxSizing: 'border-box' };
const btnPetit: React.CSSProperties = { background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '4px 9px', fontSize: 12, cursor: 'pointer', color: '#444' };

// Choix de la destination d'un lien : page du site, catégorie du catalogue ou adresse web
function CibleLien({ type, cible, onChange, categories }: { type: TypeLien; cible: string; onChange: (t: TypeLien, c: string) => void; categories: string[] }) {
  const t: TypeLien = type === 'categorie' || type === 'url' ? type : 'page';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 6 }}>
      <select value={t} onChange={e => { const v = e.target.value === 'categorie' ? 'categorie' : e.target.value === 'url' ? 'url' : 'page'; onChange(v, v === 'page' ? 'catalogue' : v === 'categorie' ? (categories[0] || '') : ''); }} style={selStyle} aria-label="Type de lien">
        <option value="page">Page du site</option><option value="categorie">Catégorie</option><option value="url">Adresse web</option>
      </select>
      {t === 'page' && (
        <select value={cible} onChange={e => onChange(t, limiter(e.target.value, 60))} style={selStyle} aria-label="Page">
          {PAGES_SITE.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
      )}
      {t === 'categorie' && (categories.length > 0
        ? <select value={cible} onChange={e => onChange(t, limiter(e.target.value, 120))} style={selStyle} aria-label="Catégorie">
            {!categories.includes(cible) && <option value={cible}>{cible || '— choisir —'}</option>}
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        : <Inp value={cible} onChange={(v: string) => onChange(t, v)} placeholder="Nom exact de la catégorie" max={120} />)}
      {t === 'url' && <Inp value={cible} onChange={(v: string) => onChange(t, v)} placeholder="https://… ou /page" max={300} />}
    </div>
  );
}

function ListeLiens({ liens, onChange, max, categories }: { liens: LienMenu[]; onChange: (l: LienMenu[]) => void; max: number; categories: string[] }) {
  const maj = (i: number, patch: Partial<LienMenu>) => { const l = [...liens]; l[i] = { ...l[i], ...patch }; onChange(l); };
  return (
    <>
      {liens.map((l, i) => (
        <div key={i} style={{ border: '1px solid #eef0f3', borderRadius: 8, padding: 8, marginBottom: 6, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <Inp value={l.label} onChange={(v: string) => maj(i, { label: v })} placeholder="Texte du lien" max={60} />
            <button onClick={() => { if (i > 0) { const a = [...liens]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange(a); } }} disabled={i === 0} style={{ ...btnPetit, opacity: i === 0 ? 0.4 : 1 }} aria-label="Monter">↑</button>
            <button onClick={() => { if (i < liens.length - 1) { const a = [...liens]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; onChange(a); } }} disabled={i === liens.length - 1} style={{ ...btnPetit, opacity: i === liens.length - 1 ? 0.4 : 1 }} aria-label="Descendre">↓</button>
            <button onClick={() => onChange(liens.filter((_, k) => k !== i))} style={{ ...btnPetit, background: '#fef2f2', color: '#dc2626' }} aria-label="Supprimer le lien">✕</button>
          </div>
          <CibleLien type={l.type} cible={l.cible} categories={categories} onChange={(t, c) => maj(i, { type: t, cible: c })} />
        </div>
      ))}
      {liens.length < max && <button onClick={() => onChange([...liens, lienVide()])} style={{ width: '100%', padding: 7, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter un lien</button>}
    </>
  );
}

function MenuEditeur({ entrees, onChange, gestionnaireId }: { entrees: EntreeMenu[]; onChange: (e: EntreeMenu[]) => void; gestionnaireId: number }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState<number | null>(null);
  useEffect(() => {
    fetch(`/api/boutique/catalogue/${gestionnaireId}?limit=100`).then(r => r.ok ? r.json() : null).then(d => {
      const liste: any[] = (d && (d.produits || d)) || [];
      if (Array.isArray(liste)) setCategories(Array.from(new Set(liste.map(p => (p && typeof p.categorie === 'string' ? p.categorie.trim() : '')).filter(Boolean))).slice(0, 60) as string[]);
    }).catch(() => {});
  }, [gestionnaireId]);
  const maj = (i: number, patch: Partial<EntreeMenu>) => { const l = [...entrees]; l[i] = { ...l[i], ...patch }; onChange(l); };
  const deplacer = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= entrees.length) return; const l = [...entrees]; [l[i], l[j]] = [l[j], l[i]]; onChange(l); setOuvert(j); };
  return (
    <>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
        {entrees.length === 0
          ? <>Aucune entrée : votre site affiche un menu <b>automatique</b> (Catalogue avec vos vraies catégories en méga-menu). Ajoutez des entrées pour créer votre propre menu.</>
          : <>Menu personnalisé : {entrees.length} entrée(s) sur {MAX_ENTREES}. Supprimez toutes les entrées pour revenir au menu automatique.</>}
        <br />Trois styles : <b>Lien simple</b>, <b>Liste déroulante</b> (sous-menu) et <b>Méga-menu</b> (colonnes + carte promo).
      </div>
      {entrees.map((e, i) => {
        const ouv = ouvert === i;
        return (
          <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, marginBottom: 10, background: '#fff', opacity: e.actif === false ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => setOuvert(ouv ? null : i)}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label || '(sans nom)'} <span style={{ fontWeight: 500, color: '#888', fontSize: 11 }}>· {e.style === 'mega' ? 'méga-menu' : e.style === 'liste' ? 'liste' : 'lien'}</span></span>
              <button onClick={ev => { ev.stopPropagation(); deplacer(i, -1); }} disabled={i === 0} style={{ ...btnPetit, opacity: i === 0 ? 0.4 : 1 }} aria-label="Monter l'entrée">↑</button>
              <button onClick={ev => { ev.stopPropagation(); deplacer(i, 1); }} disabled={i === entrees.length - 1} style={{ ...btnPetit, opacity: i === entrees.length - 1 ? 0.4 : 1 }} aria-label="Descendre l'entrée">↓</button>
              <button onClick={ev => { ev.stopPropagation(); onChange(entrees.filter((_, k) => k !== i)); setOuvert(null); }} style={{ ...btnPetit, background: '#fef2f2', color: '#dc2626' }} aria-label="Supprimer l'entrée">✕</button>
              <span style={{ fontSize: 11, color: '#888' }}>{ouv ? '▴' : '▾'}</span>
            </div>
            {ouv && (
              <div style={{ padding: '4px 12px 14px', borderTop: '1px solid #f1f5f9' }}>
                <Toggle label="Entrée visible" checked={e.actif !== false} onChange={(v: boolean) => maj(i, { actif: v })} />
                <F label="Texte affiché dans le menu"><Inp value={e.label} onChange={(v: string) => maj(i, { label: v })} max={40} placeholder="Boutique" /></F>
                <F label="Style">
                  <select value={e.style} onChange={ev => maj(i, { style: ev.target.value === 'mega' ? 'mega' : ev.target.value === 'liste' ? 'liste' : 'lien' })} style={selStyle}>
                    <option value="lien">Lien simple (un clic)</option>
                    <option value="liste">Liste déroulante (sous-menu)</option>
                    <option value="mega">Méga-menu (colonnes + carte promo)</option>
                  </select>
                </F>
                <F label={e.style === 'lien' ? 'Destination du lien' : 'Destination du texte (optionnel, utilisée pour « Tout voir → »)'}>
                  <CibleLien type={e.type} cible={e.cible} categories={categories} onChange={(t, c) => maj(i, { type: t, cible: c })} />
                </F>
                {e.style === 'liste' && (
                  <F label="Liens du sous-menu (12 max)"><ListeLiens liens={e.liens || []} max={12} categories={categories} onChange={l => maj(i, { liens: l })} /></F>
                )}
                {e.style === 'mega' && (
                  <>
                    <F label="Texte d'introduction (optionnel)"><Inp value={e.intro} onChange={(v: string) => maj(i, { intro: v })} max={200} placeholder="Une phrase sous le titre" /></F>
                    <F label="Colonnes (4 max, 10 liens chacune)">
                      {(e.colonnes || []).map((c, ci) => (
                        <div key={ci} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <Inp value={c.titre} onChange={(v: string) => { const cols = [...e.colonnes]; cols[ci] = { ...cols[ci], titre: v }; maj(i, { colonnes: cols }); }} max={40} placeholder={`Titre de la colonne ${ci + 1}`} />
                            <button onClick={() => maj(i, { colonnes: e.colonnes.filter((_, k) => k !== ci) })} style={{ ...btnPetit, background: '#fef2f2', color: '#dc2626' }} aria-label="Supprimer la colonne">✕</button>
                          </div>
                          <ListeLiens liens={c.liens || []} max={10} categories={categories} onChange={l => { const cols = [...e.colonnes]; cols[ci] = { ...cols[ci], liens: l }; maj(i, { colonnes: cols }); }} />
                        </div>
                      ))}
                      {(e.colonnes || []).length < 4 && <button onClick={() => maj(i, { colonnes: [...(e.colonnes || []), { titre: '', liens: [] }] })} style={{ width: '100%', padding: 8, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une colonne</button>}
                    </F>
                    <F label="Carte promo (optionnelle)" desc="Image + titre + bouton à droite du méga-menu. Laissez vide pour ne rien afficher.">
                      <div style={{ display: 'grid', gap: 6 }}>
                        <Inp value={e.promo?.image || ''} onChange={(v: string) => maj(i, { promo: { ...entreeVide().promo, ...e.promo, image: v } })} placeholder="URL de l'image (https://…)" />
                        <Inp value={e.promo?.titre || ''} onChange={(v: string) => maj(i, { promo: { ...entreeVide().promo, ...e.promo, titre: v } })} placeholder="Titre" max={80} />
                        <Inp value={e.promo?.bouton || ''} onChange={(v: string) => maj(i, { promo: { ...entreeVide().promo, ...e.promo, bouton: v } })} placeholder="Texte du bouton" max={30} />
                        <CibleLien type={e.promo?.type || 'page'} cible={e.promo?.cible || 'catalogue'} categories={categories} onChange={(t, c) => maj(i, { promo: { ...entreeVide().promo, ...e.promo, type: t, cible: c } })} />
                      </div>
                    </F>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
      {entrees.length < MAX_ENTREES && (
        <button onClick={() => { onChange([...entrees, entreeVide()]); setOuvert(entrees.length); }} style={{ width: '100%', padding: 10, border: `2px dashed ${CP}60`, borderRadius: 8, background: `${CP}08`, color: CP, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter une entrée au menu</button>
      )}
    </>
  );
}

// Champs d'un sous-objet de l'accueil (texte, zone de texte, couleur, nombre, choix) : une seule définition par section
type ChampDef = { cle: string; label: string; max?: number; rows?: number; aide?: string; placeholder?: string; genre?: 'zone' | 'couleur' | 'nombre' | 'choix'; choix?: [string, string][]; defaut?: string };
function Champs({ obj, onPatch, champs }: { obj: any; onPatch: (p: any) => void; champs: ChampDef[] }) {
  return (
    <>
      {champs.map(c => {
        const val = obj && obj[c.cle] != null ? obj[c.cle] : '';
        if (c.genre === 'couleur') return <Couleur key={c.cle} label={c.label} value={val || c.defaut || '#1b0f33'} onChange={(v: string) => onPatch({ [c.cle]: v })} />;
        if (c.genre === 'zone') return <F key={c.cle} label={c.label} desc={c.aide}><Txt value={String(val)} onChange={(v: string) => onPatch({ [c.cle]: v })} rows={c.rows || 4} max={c.max || 2000} placeholder={c.placeholder} /></F>;
        if (c.genre === 'nombre') return <F key={c.cle} label={c.label} desc={c.aide}><Inp type="number" value={String(val)} onChange={(v: string) => onPatch({ [c.cle]: v === '' ? '' : Math.max(0, Math.min(999, parseInt(v, 10) || 0)) })} placeholder={c.placeholder} /></F>;
        if (c.genre === 'choix') return (
          <F key={c.cle} label={c.label} desc={c.aide}>
            <select value={String(val || c.choix![0][0])} onChange={e => onPatch({ [c.cle]: c.choix!.some(x => x[0] === e.target.value) ? e.target.value : c.choix![0][0] })} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}>
              {c.choix!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
        );
        return <F key={c.cle} label={c.label} desc={c.aide}><Inp value={String(val)} onChange={(v: string) => onPatch({ [c.cle]: v })} max={c.max || 200} placeholder={c.placeholder} /></F>;
      })}
    </>
  );
}
const NOTE_SECTION: React.CSSProperties = { fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 };

type PageOnglet = 'identite' | 'menu' | 'accueil' | 'catalogue' | 'faq' | 'a-propos' | 'blog' | 'contact' | 'fiche-produit' | 'inscription' | 'footer';

interface Props {
  gestionnaireId: number;
}

export default function ConfigMesPagesRose({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigRose>(CONFIG_DEFAUT);
  const [page, setPage] = useState<PageOnglet>('identite');
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const articlesBlog = useArticlesBlog(); // vrais articles de « Mes blogs » (onglet Blog + aperçu)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Charger la config depuis l'API
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${gestionnaireId}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const brut = data?.config && typeof data.config === 'object' ? data.config.rose : null;
        if (brut && typeof brut === 'object' && Object.keys(brut).length > 0) {
          const obj = (x: any) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
          setConfig(prev => ({
            ...prev, ...brut,
            identite: { ...prev.identite, ...obj(brut.identite) },
                        accueil: { ...prev.accueil, ...obj(brut.accueil), hero: { ...prev.accueil.hero, ...obj(obj(brut.accueil).hero) }, banniere: { ...prev.accueil.banniere, ...obj(obj(brut.accueil).banniere) }, entete: { ...obj(obj(brut.accueil).entete), barreHaut: { ...obj(obj(obj(brut.accueil).entete).barreHaut) } } },
            catalogue: { ...prev.catalogue, ...obj(brut.catalogue), hero: { ...prev.catalogue.hero, ...obj(obj(brut.catalogue).hero) }, banniere: { ...prev.catalogue.banniere, ...obj(obj(brut.catalogue).banniere) } },
            faq: { ...prev.faq, ...obj(brut.faq), hero: { ...prev.faq.hero, ...obj(obj(brut.faq).hero) }, banniere: { ...prev.faq.banniere, ...obj(obj(brut.faq).banniere) }, items: Array.isArray(obj(brut.faq).items) ? brut.faq.items : prev.faq.items },
            blog: { ...prev.blog, ...obj(brut.blog), hero: { ...prev.blog.hero, ...obj(obj(brut.blog).hero) }, banniere: { ...prev.blog.banniere, ...obj(obj(brut.blog).banniere) } },
            contact: { ...prev.contact, ...obj(brut.contact), hero: { ...prev.contact.hero, ...obj(obj(brut.contact).hero) }, banniere: { ...prev.contact.banniere, ...obj(obj(brut.contact).banniere) } },
            footer: { ...prev.footer, ...obj(brut.footer), images: Array.isArray(obj(brut.footer).images) ? obj(brut.footer).images.slice(0, 4) : [], reseaux: { ...prev.footer.reseaux, ...obj(obj(brut.footer).reseaux) }, colonnes: { ...prev.footer.colonnes, ...obj(obj(brut.footer).colonnes) }, politiques: { ...prev.footer.politiques, ...obj(obj(brut.footer).politiques) } },
            ficheProduit: { ...prev.ficheProduit, ...obj(brut.ficheProduit) },
            inscription: fusionInscription(brut.inscription),
            aPropos: { ...CONFIG_DEFAUT.aPropos, ...obj(brut.aPropos) },
            menu: { ...CONFIG_DEFAUT.menu, ...obj(brut.menu), entrees: Array.isArray(obj(brut.menu).entrees) ? obj(brut.menu).entrees.slice(0, MAX_ENTREES) : [] },
          }));
        }
      })
      .catch(() => {});
  }, [gestionnaireId]);

  const handleSave = async () => {
    setSauv('loading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ config: { rose: config }, template_id: 'boutique-rose' }),
      });
      if (!res.ok) throw new Error();
      setSauv('ok');
      setTimeout(() => setSauv('idle'), 2500);
    } catch {
      setSauv('err');
      setTimeout(() => setSauv('idle'), 3000);
    }
  };

  // Helpers pour mettre à jour config imbriqué
  const setIdent = useCallback((patch: Partial<ConfigRose['identite']>) => setConfig(c => ({ ...c, identite: { ...c.identite, ...patch } })), []);
  const setAcc  = useCallback((patch: Partial<ConfigPageAccueil>) => setConfig(c => ({ ...c, accueil:  { ...c.accueil,  ...patch } })), []);
  const setEntete = useCallback((p: any) => setConfig(c => ({ ...c, accueil: { ...c.accueil, entete: { ...(c.accueil.entete || {}), ...p } } })), []);
  const setBarreHaut = useCallback((p: any) => setConfig(c => ({ ...c, accueil: { ...c.accueil, entete: { ...(c.accueil.entete || {}), barreHaut: { ...((c.accueil.entete || {}).barreHaut || {}), ...p } } } })), []);
  const setTicker = useCallback((p: any) => setConfig(c => ({ ...c, accueil: { ...c.accueil, ticker: { ...(c.accueil.ticker || {}), ...p } } })), []);
  const setSub = useCallback((cle: string, p: any) => setConfig(c => ({ ...c, accueil: { ...c.accueil, [cle]: { ...((c.accueil as any)[cle] || {}), ...p } } })), []);
  const setCat  = useCallback((patch: Partial<ConfigCatalogue>)   => setConfig(c => ({ ...c, catalogue: { ...c.catalogue, ...patch } })), []);
  const setFaq  = useCallback((patch: Partial<ConfigFaq>)         => setConfig(c => ({ ...c, faq:      { ...c.faq,      ...patch } })), []);
  const setBlog = useCallback((patch: Partial<ConfigBlog>)        => setConfig(c => ({ ...c, blog:     { ...c.blog,     ...patch } })), []);
  const setCont = useCallback((patch: Partial<ConfigContact>)     => setConfig(c => ({ ...c, contact:  { ...c.contact,  ...patch } })), []);
  const setFiche = useCallback((patch: Partial<ConfigFicheProduit>) => setConfig(c => ({ ...c, ficheProduit: { ...c.ficheProduit, ...patch } })), []);
  const setAP   = useCallback((patch: any) => setConfig(c => ({ ...c, aPropos: { ...c.aPropos, ...patch } })), []);
  const setMenu = useCallback((patch: any) => setConfig(c => ({ ...c, menu: { ...c.menu, ...patch } })), []);
  const setIns  = useCallback((patch: any) => setConfig(c => ({ ...c, inscription: { ...c.inscription, ...patch } })), []);
  const [dernierChampInsc, setDernierChampInsc] = useState<string | null>(null);
  const setFoot = useCallback((patch: Partial<ConfigFooter>)      => setConfig(c => ({ ...c, footer:   { ...c.footer,   ...patch } })), []);

  const PAGES: { id: PageOnglet; label: string; icone: string }[] = [
    { id: 'identite',  label: 'Identité',  icone: '🏪' },
    { id: 'menu',      label: 'Menu',      icone: '🧭' },
    { id: 'accueil',   label: 'Accueil',   icone: '🏠' },
    { id: 'catalogue', label: 'Produits', icone: '📦' },
    { id: 'faq',       label: 'FAQ',       icone: '❓' },
    { id: 'a-propos',  label: 'À propos',  icone: '🏢' },
    { id: 'blog',      label: 'Blog',      icone: '📝' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
    { id: 'fiche-produit', label: 'Fiche produit', icone: '🛍' },
    { id: 'inscription', label: 'Compte', icone: '👤' },
    { id: 'footer',    label: 'Footer',    icone: '📋' },
  ];

  // ── Panneau de config selon la page sélectionnée ──────────────────────────
  const renderConfig = () => {
    switch (page) {

      case 'identite': return (
        <>
          <S titre="Votre boutique">
            <F label="Nom de la boutique" desc="Affiché dans le menu (si aucun logo), le pied de page et le compte acheteur."><Inp value={config.footer.nomBoutique} onChange={(v: string) => setFoot({ nomBoutique: v })} max={80} /></F>
            <F label="Slogan" desc="Affiché dans le pied de page."><Inp value={config.footer.slogan} onChange={(v: string) => setFoot({ slogan: v })} max={160} /></F>
            <F label="Logo (URL de l'image)" desc="Remplace le nom dans le menu du haut. Collez l'URL d'une image hébergée (https://…). Vide = le nom s'affiche."><Inp value={config.identite.logoUrl} onChange={(v: string) => setIdent({ logoUrl: v })} placeholder="https://..." max={500} /></F>
            {/^https?:\/\//i.test(config.identite.logoUrl || '') && <img src={config.identite.logoUrl} alt="Logo" style={{ height: 44, maxWidth: 200, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 8, padding: 6, background: '#fff' }} />}
          </S>
          <S titre="Thème (clair / sombre)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Le thème clair est appliqué par défaut. Choisissez le thème d'ouverture de votre site ; les couleurs « Fond de page » et « Texte principal » ci-dessous ne s'appliquent que si elles sont remplies (vide = couleurs du thème).</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {([['clair', '☀️ Clair (rose et lilas)', '#ffd3ec', '#1b0f33'], ['sombre', '🌙 Sombre (prune)', '#2d1650', '#fff0fa']] as [string, string, string, string][]).map(([v, l, bg, fg]) => {
                const actif = (config.accueil.mode === 'sombre' ? 'sombre' : 'clair') === v;
                return (
                  <button key={v} onClick={() => setAcc({ mode: v as 'sombre' | 'clair' })}
                    style={{ padding: '14px 22px', borderRadius: 10, border: `2px solid ${actif ? CP : '#e5e7eb'}`, background: bg, color: fg, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minWidth: 130 }}>
                    {l}{actif ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
            <Toggle label="Bouton clair / sombre pour les visiteurs" checked={config.accueil.afficherBascule !== false} onChange={(v: boolean) => setAcc({ afficherBascule: v })} desc="Le visiteur peut changer le thème ; son choix est gardé dans son navigateur." />
            <Toggle label="Bouton « Retour en haut »" checked={config.accueil.afficherRemonter !== false} onChange={(v: boolean) => setAcc({ afficherRemonter: v })} desc="Petite flèche en bas à droite quand on descend dans la page." />
          </S>
          <S titre="Police du site">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {POLICES_RS.map(p => {
                const actif = (config.accueil.police || 'Inter') === p.valeur;
                return (
                  <button key={p.valeur} onClick={() => setAcc({ police: p.valeur })}
                    style={{ padding: '12px 18px', borderRadius: 10, border: `2px solid ${actif ? CP : '#e5e7eb'}`, background: actif ? `${CP}12` : '#fff', color: actif ? CP : '#444', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </S>
          <S titre="Couleurs">
            <Couleur label="Couleur primaire" value={config.accueil.couleurPrimaire} onChange={(v: string) => setAcc({ couleurPrimaire: v })} />
            <Couleur label="Couleur secondaire" value={config.accueil.couleurSecondaire} onChange={(v: string) => setAcc({ couleurSecondaire: v })} />
            <Couleur label="Fond de page (optionnel)" value={config.accueil.couleurFondPage} onChange={(v: string) => setAcc({ couleurFondPage: v })} />
            <Couleur label="Texte principal (optionnel)" value={config.accueil.couleurTexte} onChange={(v: string) => setAcc({ couleurTexte: v })} />
            {(config.accueil.couleurFondPage || config.accueil.couleurTexte) && <button onClick={() => setAcc({ couleurFondPage: '', couleurTexte: '' })} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555' }}>Revenir aux couleurs du thème</button>}
          </S>
          <S titre="Produits, livraison et taxes">
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>Les produits viennent de <b>Vos annonces</b>. La livraison, les taxes et les paiements se règlent dans la <b>Configuration</b> de votre compte : ils s'appliquent automatiquement à la caisse.</p>
          </S>
        </>
      );

      case 'menu': return (
        <>
          <S titre="Menu du haut">
            <MenuEditeur entrees={config.menu.entrees || []} onChange={(e: EntreeMenu[]) => setMenu({ entrees: e })} gestionnaireId={gestionnaireId} />
          </S>
        </>
      );

      case 'accueil': return (
        <>
          <S titre="Menu automatique (si aucun menu personnalisé)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Ne s'applique que si vous n'avez créé aucune entrée dans l'onglet « Menu ». Renommez les liens ou cachez les pages dont vous n'avez pas besoin. Vide = nom par défaut.</p>
            {([['accueil', 'Accueil', false], ['catalogue', 'Nos produits', false], ['blog', 'Blog', true], ['faq', 'FAQ', true], ['a-propos', 'À propos', true], ['contact', 'Contact', true]] as [string, string, boolean][]).map(([id, defaut, masquable]) => {
              const masque = (config.menu.masques || []).includes(id);
              return (
                <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, opacity: masque ? 0.5 : 1 }}>
                  <div style={{ flex: 1 }}><Inp value={config.menu[id] || ''} onChange={(v: string) => setMenu({ [id]: v })} placeholder={defaut} /></div>
                  {masquable && <button onClick={() => setMenu({ masques: masque ? config.menu.masques.filter((x: string) => x !== id) : [...(config.menu.masques || []), id] })} style={{ background: masque ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: masque ? '#dc2626' : '#16a34a', cursor: 'pointer', minWidth: 78 }}>{masque ? 'Caché' : 'Affiché'}</button>}
                </div>
              );
            })}
          </S>
                    <S titre="Bannière promotionnelle">
            <EditorBanniere banniere={config.accueil.banniere} onChange={b => setAcc({ banniere: b })} />
          </S>
          <S titre="Section Hero">
            <EditorHero hero={config.accueil.hero} onChange={h => setAcc({ hero: h })} />
          </S>
          <S titre="En-tête du site (couleurs, recherche, barre du haut)">
            <p style={NOTE_SECTION}>Par défaut : en-tête et menu lilas en pastilles à bordure foncée, texte foncé, barre du haut rose. Chaque couleur est réglable.</p>
            <Champs obj={config.accueil.entete} onPatch={setEntete} champs={[
              { cle: 'couleurBarre', label: 'Couleur de la barre du haut', genre: 'couleur', defaut: '#e0147a' },
              { cle: 'couleurFond', label: 'Couleur des pastilles de l\'en-tête', genre: 'couleur', defaut: '#d9c8ff' },
              { cle: 'couleurNav', label: 'Couleur de la bande du menu', genre: 'couleur', defaut: '#c9b3ff' },
              { cle: 'couleurTexte', label: "Couleur du texte et des bordures de l'en-tête", genre: 'couleur', defaut: '#1b0f33' }]} />
            <Toggle label="Afficher la barre de recherche" checked={config.accueil.entete?.afficherRecherche !== false} onChange={(v: boolean) => setEntete({ afficherRecherche: v })} />
            <Toggle label="Menu des catégories dans la recherche" checked={config.accueil.entete?.afficherCategories !== false} onChange={(v: boolean) => setEntete({ afficherCategories: v })} />
            <Toggle label="Afficher la barre du haut" checked={!!config.accueil.entete?.barreHaut?.actif} onChange={(v: boolean) => setBarreHaut({ actif: v })} />
            <F label="Texte à gauche"><Inp value={config.accueil.entete?.barreHaut?.gauche || ''} onChange={(v: string) => setBarreHaut({ gauche: v })} max={160} /></F>
            <F label="Liens à droite (un par ligne : Texte | lien)" desc={AIDE_LIENS}><Txt value={config.accueil.entete?.barreHaut?.droite || ''} onChange={(v: string) => setBarreHaut({ droite: v })} rows={3} max={400} placeholder={'Aide | contact\nBlogue | blog'} /></F>
          </S>
          <S titre="Couleurs des sections et « Plus que N »">
            <Champs obj={config.accueil} onPatch={setAcc as any} champs={[
              { cle: 'couleurAccent', label: 'Rose vif (boutons, mots en relief)', genre: 'couleur', defaut: '#e0147a' },
              { cle: 'seuilStock', label: 'Afficher « Plus que N » quand le stock réel est de N ou moins', genre: 'nombre', placeholder: '5', aide: 'Vide = 5. Zéro = jamais. Basé sur le vrai stock du produit.' }]} />
          </S>
          <S titre="Diaporama du haut (texte sur photo)">
            <p style={NOTE_SECTION}>Jusqu'à 6 diapositives : une photo avec le titre, le texte et un bouton à gauche. Mettez un mot entre *étoiles* pour le mettre en couleur (ex. « Une peau *douce* »). Sans photo, un fond rose s'affiche. Vide : le Hero simple ci-dessus s'affiche.</p>
            <EditeurListe etiquette="Diapositive" liste={config.accueil.diaporama || []} onChange={l => setAcc({ diaporama: l } as any)} max={6} vide={{ surtitre: '', titre: '', texte: '', photo: '', bouton: '', lien: '', couleurFond: '' }} champs={[
              { cle: 'surtitre', label: 'petit texte au-dessus du titre (optionnel)', max: 60 }, { cle: 'titre', label: 'titre', max: 120 }, { cle: 'texte', label: 'texte', max: 260 }, { cle: 'photo', label: 'photo (URL https://…)', max: 1000, placeholder: 'https://…' },
              { cle: 'bouton', label: 'texte du bouton', max: 30, placeholder: 'Magasiner' }, { cle: 'lien', label: 'lien', max: 300, placeholder: 'catalogue', aide: AIDE_LIENS }, { cle: 'couleurFond', label: 'couleur de fond sans photo (#05060f, vide = lueur néon)', max: 9 }]} />
          </S>
          <S titre="Bandeau défilant (messages qui défilent)">
            <p style={NOTE_SECTION}>Un message par ligne (jusqu'à 12). Écrivez seulement ce qui est vrai pour votre boutique. Aucun message = pas de bandeau. Le défilement s'arrête au survol, et si le visiteur préfère moins d'animations.</p>
            <Champs obj={config.accueil.ticker} onPatch={setTicker} champs={[
              { cle: 'messages', label: 'Messages (un par ligne)', genre: 'zone', rows: 4, max: 1500, placeholder: 'Livraison gratuite dès 100 $' },
              { cle: 'vitesse', label: 'Vitesse', genre: 'choix', choix: [['normale', 'Normale'], ['lente', 'Lente'], ['rapide', 'Rapide']] },
              { cle: 'couleurFond', label: 'Couleur de fond', genre: 'couleur', defaut: '#e0147a' }, { cle: 'couleurTexte', label: 'Couleur du texte', genre: 'couleur', defaut: '#ffffff' }, { cle: 'couleurAccent', label: 'Couleur des messages en alternance', genre: 'couleur', defaut: '#ffffff' },
              { cle: 'icone', label: 'Petit symbole entre les messages', max: 4, placeholder: '⚡' }, { cle: 'lien', label: 'Lien au clic (optionnel)', max: 300, placeholder: 'catalogue', aide: AIDE_LIENS }]} />
          </S>
          <S titre="Texte ondulé qui défile">
            <p style={NOTE_SECTION}>Un message par ligne (jusqu'à 6), écrit en vague qui défile sous le diaporama. N'écrivez que ce qui est vrai pour votre boutique. Aucune ligne = section cachée. Le défilement s'arrête si le visiteur préfère moins d'animations.</p>
            <Champs obj={config.accueil.onde} onPatch={(p: any) => setSub('onde', p)} champs={[{ cle: 'messages', label: 'Messages (un par ligne)', genre: 'zone', rows: 4, max: 500, placeholder: 'Livraison gratuite dès 100 $' }]} />
          </S>
          <S titre="Magasiner par catégorie (liste déroulante)">
            <p style={NOTE_SECTION}>Le visiteur choisit une catégorie dans la liste ; vos vrais produits de cette catégorie s'affichent. Les catégories viennent de votre catalogue. Aucun produit = section cachée.</p>
            <Champs obj={config.accueil.parcourir} onPatch={(p: any) => setSub('parcourir', p)} champs={[{ cle: 'titre', label: 'Titre', max: 80, placeholder: 'Magasiner pour' }, { cle: 'nombre', label: 'Nombre de produits (2 à 12)', genre: 'nombre', placeholder: '6' }]} />
          </S>
          <S titre="Grand texte avec petites photos">
            <p style={NOTE_SECTION}>Une grande phrase centrée. Écrivez <b>{'{1}'}</b>, <b>{'{2}'}</b>, <b>{'{3}'}</b> ou <b>{'{4}'}</b> à l'endroit où une petite photo arrondie doit apparaître (la photo 1 à 4 de la liste ci-dessous). Mettez un mot entre *étoiles* pour le mettre en couleur. Texte vide = section cachée.</p>
            <Champs obj={config.accueil.grostexte} onPatch={(p: any) => setSub('grostexte', p)} champs={[
              { cle: 'texte', label: 'Grande phrase', genre: 'zone', rows: 3, max: 400, placeholder: 'Des soins {1} choisis avec amour, une routine {2} simple' },
              { cle: 'photos', label: 'Petites photos (une URL https://… par ligne, 4 maximum)', genre: 'zone', rows: 4, max: 1600, placeholder: 'https://…/photo1.jpg' },
              { cle: 'sousTexte', label: 'Texte sous la phrase (optionnel)', genre: 'zone', rows: 3, max: 500 },
              { cle: 'bouton', label: 'Texte du bouton (optionnel)', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, aide: AIDE_LIENS }]} />
          </S>
          <S titre="Collections (carrousel de catégories)">
            <p style={NOTE_SECTION}>Une carte par catégorie de votre catalogue, avec la photo d'un de ses produits et le vrai nombre d'articles. Rien à saisir sauf le titre.</p>
            <Champs obj={config.accueil.collections} onPatch={(p: any) => setSub('collections', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120, placeholder: 'Magasiner par *collection*' }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }]} />
          </S>
          <S titre="Vitrine produit (photo avec points + fiche)">
            <p style={NOTE_SECTION}>Une grande photo à gauche avec des points cliquables, et à droite la fiche d'un vrai produit (points pour changer de produit). Points, une ligne chacun (4 max) : <b>position horizontale % | position verticale % | lien</b> (ex. 30 | 40 | catalogue). Catégorie vide = vos premiers produits.</p>
            <Champs obj={config.accueil.vitrine} onPatch={(p: any) => setSub('vitrine', p)} champs={[
              { cle: 'photo', label: 'Grande photo (URL https://…)', max: 1000, placeholder: 'https://…' },
              { cle: 'points', label: 'Points (une ligne : x % | y % | lien)', genre: 'zone', rows: 3, max: 600, placeholder: '30 | 40 | catalogue' },
              { cle: 'categorie', label: 'Catégorie (nom exact, optionnel)', max: 80 }, { cle: 'nombre', label: 'Nombre de produits (2 à 6)', genre: 'nombre', placeholder: '4' },
              { cle: 'bouton', label: 'Texte du bouton', max: 30, placeholder: 'Choisir' }]} />
          </S>
          <S titre="Question avec réponses A, B, C">
            <p style={NOTE_SECTION}>Une question et jusqu'à 6 réponses, une par ligne : <b>réponse | lien</b> (ex. Hydrater | cat:Soins visage). Chaque réponse ouvre la page ou la catégorie choisie. Aucune question ou aucune réponse = section cachée.</p>
            <Champs obj={config.accueil.trouveur} onPatch={(p: any) => setSub('trouveur', p)} champs={[
              { cle: 'etiquette', label: 'Petit titre (optionnel)', max: 40, placeholder: 'Trouvez votre soin' }, { cle: 'titre', label: 'Question', max: 160 },
              { cle: 'photo', label: 'Photo à droite (URL https://…, optionnel)', max: 1000 },
              { cle: 'options', label: 'Réponses (une ligne : réponse | lien)', genre: 'zone', rows: 5, max: 1800, placeholder: 'Hydrater en profondeur | cat:Soins visage' }]} />
          </S>
          <S titre="Galerie de photos inclinées">
            <p style={NOTE_SECTION}>Vos propres photos (jusqu'à 8), une par ligne : <b>photo | lien (optionnel)</b>. N'utilisez que des photos dont vous avez les droits. Aucune photo = section cachée.</p>
            <Champs obj={config.accueil.galerie} onPatch={(p: any) => setSub('galerie', p)} champs={[
              { cle: 'titre', label: 'Titre', max: 120 }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 },
              { cle: 'items', label: 'Photos (une ligne : photo | lien)', genre: 'zone', rows: 5, max: 3000, placeholder: 'https://…/photo.jpg | catalogue' }]} />
          </S>
          <S titre="Pastilles de garanties (grille)">
            <p style={NOTE_SECTION}>Jusqu'à 12 pastilles rondes, une par ligne : <b>symbole | texte</b> (ex. 🔒 | Paiement sécurisé). N'écrivez que des garanties réelles.</p>
            <Champs obj={config.accueil.pastilles} onPatch={(p: any) => setSub('pastilles', p)} champs={[{ cle: 'titre', label: 'Titre (optionnel)', max: 120 }, { cle: 'items', label: 'Pastilles (une ligne : symbole | texte)', genre: 'zone', rows: 5, max: 800, placeholder: '🔒 | Paiement sécurisé' }]} />
          </S>
          <S titre="Grand nom de la boutique">
            <p style={NOTE_SECTION}>Le nom de votre boutique en très grosses lettres, au-dessus du pied de page. Vide = section cachée.</p>
            <Champs obj={config.accueil.grandnom} onPatch={(p: any) => setSub('grandnom', p)} champs={[{ cle: 'texte', label: 'Texte', max: 40 }]} />
          </S>
          <S titre="Tableau comparatif">
            <p style={NOTE_SECTION}>Comparez jusqu'à 4 produits, saisis à la main (rien n'est inventé). Produits, une ligne chacun : <b>photo | nom | prix | lien</b>. Critères, une ligne chacun : <b>critère | valeur du produit 1 | valeur du produit 2 …</b> (même ordre que les produits ; écrivez « oui » ou « non » pour afficher une pastille ✓ ou ✗). Aucun produit = section cachée.</p>
            <Champs obj={config.accueil.comparatif} onPatch={(p: any) => setSub('comparatif', p)} champs={[
              { cle: 'titre', label: 'Titre de la section', max: 120 }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }, { cle: 'libelle', label: 'Titre de la première colonne', max: 40, placeholder: 'Nos produits' },
              { cle: 'produits', label: 'Produits (une ligne : photo | nom | prix | lien)', genre: 'zone', rows: 4, max: 2000, placeholder: 'https://…/photo.jpg | Casque X | 129 $ | catalogue' },
              { cle: 'criteres', label: 'Critères (une ligne : critère | valeur 1 | valeur 2 …)', genre: 'zone', rows: 6, max: 2500, placeholder: 'Autonomie | 30 h | 8 h | 3 h' }]} />
          </S>
          <S titre="Points forts numérotés + image">
            <p style={NOTE_SECTION}>Une photo à gauche et, à droite, jusqu'à 6 points forts numérotés. Une ligne par point : <b>titre | texte</b>. Mettez un mot entre *étoiles* dans le titre de la section pour le mettre en couleur. Aucun point et aucun titre = section cachée.</p>
            <Champs obj={config.accueil.etapes} onPatch={(p: any) => setSub('etapes', p)} champs={[
              { cle: 'titre', label: 'Titre de la section', max: 120 }, { cle: 'photo', label: 'Photo (URL https://…)', max: 1000, placeholder: 'https://…' },
              { cle: 'items', label: 'Points forts (un par ligne : titre | texte)', genre: 'zone', rows: 6, max: 3000, placeholder: 'Livraison rapide | Expédition en 24 h' },
              { cle: 'bouton', label: 'Texte du bouton (optionnel)', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, aide: AIDE_LIENS }]} />
          </S>
          <S titre="À propos (texte + photo)">
            <Champs obj={config.accueil.presentation} onPatch={(p: any) => setSub('presentation', p)} champs={[{ cle: 'titre', label: 'Titre (vide = section cachée)', max: 120 }, { cle: 'texte', label: 'Texte', genre: 'zone', rows: 5, max: 900 }, { cle: 'photo', label: 'Photo (URL https://…, optionnel)', max: 1000, placeholder: 'https://…' }, { cle: 'bouton', label: 'Texte du bouton', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, aide: AIDE_LIENS }]} />
            <Toggle label="Photo à gauche et texte à droite (bureau)" checked={config.accueil.presentation?.inverser === true} onChange={(v: boolean) => setSub('presentation', { inverser: v })} />
          </S>
          <S titre="Grandes bannières (photo pleine largeur)">
            <p style={NOTE_SECTION}>Jusqu'à 4 grandes bannières : photo pleine largeur avec titre, texte et jusqu'à deux boutons. Aucune = la section n'apparaît pas.</p>
            <EditeurListe etiquette="Bannière" liste={config.accueil.bandeaux || []} onChange={l => setAcc({ bandeaux: l } as any)} max={4} vide={{ titre: '', sousTitre: '', bouton: '', lien: '', bouton2: '', lien2: '', photo: '', couleurFond: '' }} champs={[
              { cle: 'titre', label: 'titre', max: 120 }, { cle: 'sousTitre', label: 'texte', max: 160 }, { cle: 'bouton', label: 'texte du bouton', max: 30 }, { cle: 'lien', label: 'lien', max: 300, aide: AIDE_LIENS },
              { cle: 'photo', label: 'photo (URL https://…)', max: 1000, placeholder: 'https://…' }, { cle: 'bouton2', label: 'texte du 2e bouton (optionnel)', max: 30 }, { cle: 'lien2', label: 'lien du 2e bouton', max: 300, aide: AIDE_LIENS }, { cle: 'couleurFond', label: 'couleur de fond sans photo (#140b3a)', max: 9 }]} />
          </S>
          <S titre="Cartes promo (2 cartes avec photo)">
            <p style={NOTE_SECTION}>Jusqu'à 4 cartes : texte à gauche, photo à droite. Mettez un mot entre *étoiles* pour le mettre en couleur.</p>
            <EditeurListe etiquette="Carte" liste={config.accueil.tuiles || []} onChange={l => setAcc({ tuiles: l } as any)} max={4} vide={{ titre: '', texte: '', bouton: 'Voir maintenant', lien: '', photo: '', couleur: '' }} champs={[
              { cle: 'titre', label: 'titre', max: 100 }, { cle: 'texte', label: 'texte', max: 200 }, { cle: 'bouton', label: 'texte du bouton', max: 30 }, { cle: 'lien', label: 'lien', max: 300, aide: AIDE_LIENS },
              { cle: 'photo', label: 'photo (URL https://…)', max: 1000, placeholder: 'https://…' }, { cle: 'couleur', label: 'couleur de la carte (#d9c8ff, vide = automatique)', max: 9 }]} />
          </S>
          <S titre="Bande de marques">
            <p style={NOTE_SECTION}>Une marque par ligne (jusqu'à 10) : <b>adresse du logo | nom | lien</b>. Logo vide = le nom s'affiche en texte. N'utilisez que des logos dont vous avez le droit. Aucune ligne = pas de bande.</p>
            <Champs obj={config.accueil.marques} onPatch={(p: any) => setSub('marques', p)} champs={[{ cle: 'items', label: 'Marques (une par ligne)', genre: 'zone', rows: 5, max: 3000, placeholder: 'https://…/logo.png | Nom de la marque | cat:Audio' }]} />
          </S>
          <S titre="Mise en avant (image + rangée de produits)">
            <p style={NOTE_SECTION}>Grande image à gauche avec une carte (titre, texte, bouton) ; à droite, une rangée de vos vrais produits (catégorie vide = vos premiers produits).</p>
            <Champs obj={config.accueil.focus} onPatch={(p: any) => setSub('focus', p)} champs={[
              { cle: 'titre', label: 'Titre', max: 100 }, { cle: 'texte', label: 'Texte', genre: 'zone', rows: 3, max: 300 }, { cle: 'photo', label: 'Photo de gauche (URL https://…)', max: 1000 },
              { cle: 'bouton', label: 'Texte du bouton', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, aide: AIDE_LIENS }, { cle: 'categorie', label: 'Catégorie des produits (nom exact, optionnel)', max: 80 }, { cle: 'nombre', label: 'Nombre de produits (2 à 24)', genre: 'nombre', placeholder: '10' }]} />
          </S>
          <S titre="Compte à rebours">
            <p style={NOTE_SECTION}>Compte à rebours vers une date réelle (ex. lancement, vente). Date au format <b>AAAA-MM-JJ HH:mm</b> (ex. 2026-12-31 18:00), selon l'heure de l'appareil du visiteur. Date vide, invalide ou passée = la section ne s'affiche pas.</p>
            <Champs obj={config.accueil.decompte} onPatch={(p: any) => setSub('decompte', p)} champs={[
              { cle: 'titre', label: 'Titre', max: 120, placeholder: 'Un *lancement* approche' }, { cle: 'sousTitre', label: 'Sous-titre', max: 160 }, { cle: 'fin', label: 'Date de fin (AAAA-MM-JJ HH:mm)', max: 16, placeholder: '2026-12-31 18:00' },
              { cle: 'photo', label: 'Photo de fond (URL https://…, optionnel)', max: 1000 }, { cle: 'couleurFond', label: 'Couleur de fond sans photo (#ff9fd6)', genre: 'couleur', defaut: '#e0147a' }, { cle: 'bouton', label: 'Texte du bouton (optionnel)', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, aide: AIDE_LIENS }]} />
          </S>
          <S titre="Meilleurs vendeurs (rangée de produits)">
            <p style={NOTE_SECTION}>Rangée qui défile avec vos vrais produits. Catégorie vide = vos premiers produits.</p>
            <Champs obj={config.accueil.vedette} onPatch={(p: any) => setSub('vedette', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120, placeholder: 'Nos *favoris*' }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }, { cle: 'categorie', label: 'Catégorie (nom exact, optionnel)', max: 80 }, { cle: 'nombre', label: 'Nombre de produits (2 à 24)', genre: 'nombre', placeholder: '12' }]} />
          </S>
          <S titre="Nouveautés (rangée de produits)">
            <Champs obj={config.accueil.nouveautes} onPatch={(p: any) => setSub('nouveautes', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120, placeholder: 'Nouveautés' }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }, { cle: 'categorie', label: 'Catégorie (nom exact, optionnel)', max: 80 }, { cle: 'nombre', label: 'Nombre de produits (2 à 24)', genre: 'nombre', placeholder: '12' }]} />
          </S>
          <S titre="Notre sélection (rangée de produits)">
            <p style={NOTE_SECTION}>Cette rangée est désactivée par défaut : activez-la dans « Sections de la page ».</p>
            <Champs obj={config.accueil.selection} onPatch={(p: any) => setSub('selection', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120, placeholder: 'Notre *sélection*' }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }, { cle: 'categorie', label: 'Catégorie (nom exact, optionnel)', max: 80 }, { cle: 'nombre', label: 'Nombre de produits (2 à 24)', genre: 'nombre', placeholder: '12' }]} />
          </S>
          <S titre="Questions / réponses — bloc 1 (accordéon)">
            <p style={NOTE_SECTION}>Un bloc par ligne (jusqu'à 20) : <b>Question | Réponse</b>. Idéal pour des caractéristiques, une composition ou une FAQ. Aucune ligne = section cachée.</p>
            <Champs obj={config.accueil.accordeon} onPatch={(p: any) => setSub('accordeon', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120 }, { cle: 'items', label: 'Blocs (une ligne : Question | Réponse)', genre: 'zone', rows: 6, max: 6000, placeholder: 'Garantie | Deux ans sur tous nos produits' }]} />
          </S>
          <S titre="Questions / réponses — bloc 2 (accordéon)">
            <p style={NOTE_SECTION}>Même principe que le bloc 1 (ex. foire aux questions).</p>
            <Champs obj={config.accueil.accordeon2} onPatch={(p: any) => setSub('accordeon2', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120 }, { cle: 'items', label: 'Blocs (une ligne : Question | Réponse)', genre: 'zone', rows: 6, max: 6000, placeholder: 'Livrez-vous partout ? | Oui, partout au pays' }]} />
          </S>
          <S titre="Aperçu du blogue">
            <p style={NOTE_SECTION}>Affiche vos vrais articles (Configuration → Mes blogs). Aucun article = pas de section.</p>
            <Champs obj={config.accueil.blogApercu} onPatch={(p: any) => setSub('blogApercu', p)} champs={[{ cle: 'titre', label: 'Titre', max: 120 }, { cle: 'sousTitre', label: 'Sous-titre', max: 200 }, { cle: 'bouton', label: 'Texte du lien', max: 30, placeholder: 'Lire le blogue' }]} />
          </S>
          <S titre="Sections de la page">
            <SectionsManager sections={config.accueil.sections} onChange={s => setAcc({ sections: s })} couleur={config.accueil.couleurPrimaire || CP} />
          </S>
          <S titre="Avantages (bandeau sous le hero)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Vos vrais engagements (livraison, retours, paiement…). Tant qu'il n'y en a aucun, le bandeau n'apparaît pas sur votre site.</p>
            {(config.accueil.avantages || []).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 60 }}><Inp value={a.ico} onChange={(v: string) => { const l = [...(config.accueil.avantages || [])]; l[i] = { ...l[i], ico: v }; setAcc({ avantages: l }); }} placeholder="🚚" /></div>
                <Inp value={a.titre} onChange={(v: string) => { const l = [...(config.accueil.avantages || [])]; l[i] = { ...l[i], titre: v }; setAcc({ avantages: l }); }} placeholder="Titre" />
                <Inp value={a.desc} onChange={(v: string) => { const l = [...(config.accueil.avantages || [])]; l[i] = { ...l[i], desc: v }; setAcc({ avantages: l }); }} placeholder="Détail" />
                <button onClick={() => { const l = [...(config.accueil.avantages || [])]; l.splice(i, 1); setAcc({ avantages: l }); }} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            {(config.accueil.avantages || []).length < 6 && (
              <button onClick={() => setAcc({ avantages: [...(config.accueil.avantages || []), { ico: '✅', titre: '', desc: '' }] })}
                style={{ width: '100%', padding: '8px', border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Ajouter un avantage
              </button>
            )}
          </S>
          <S titre="Avis clients (cartes)">
            <Champs obj={config.accueil} onPatch={setAcc as any} champs={[
              { cle: 'temoignagesTitre', label: 'Titre de la section (optionnel)', max: 120, placeholder: 'Ce que disent nos *clients*' }, { cle: 'temoignagesSousTitre', label: 'Sous-titre (optionnel)', max: 200 },
              { cle: 'temoignagesPhotos', label: 'Photos entre les cartes (une URL https://… par ligne, optionnel)', genre: 'zone', rows: 3, max: 1600 }]} />
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Écrivez ici de vrais commentaires de vos clients. Tant qu'il n'y en a aucun, la section n'apparaît pas sur votre site.</p>
            {(config.accueil.temoignages || []).map((t, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>Témoignage {i + 1}</span>
                  <button onClick={() => { const a = [...(config.accueil.temoignages || [])]; a.splice(i, 1); setAcc({ temoignages: a }); }}
                    style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
                <F label="Titre (optionnel)"><Inp value={t.titre || ''} max={80} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], titre: v }; setAcc({ temoignages: a }); }} /></F>
                <F label="Commentaire"><Txt value={t.texte} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], texte: v }; setAcc({ temoignages: a }); }} rows={3} /></F>
                <F label="Nom du client"><Inp value={t.auteur} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], auteur: v }; setAcc({ temoignages: a }); }} /></F>
                <F label="Ville ou titre (optionnel)"><Inp value={t.lieu || ''} max={60} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], lieu: v }; setAcc({ temoignages: a }); }} /></F>
                <F label="Photo du client (URL https://…, optionnel)"><Inp value={t.photo || ''} max={1000} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], photo: v }; setAcc({ temoignages: a }); }} /></F>
                <F label="Note (1 à 5)"><Inp type="number" value={String(t.note ?? 5)} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], note: Math.max(1, Math.min(5, parseInt(v, 10) || 5)) }; setAcc({ temoignages: a }); }} /></F>
              </div>
            ))}
            {(config.accueil.temoignages || []).length < 6 && (
              <button onClick={() => setAcc({ temoignages: [...(config.accueil.temoignages || []), { texte: '', auteur: '', note: 5 }] })}
                style={{ width: '100%', padding: '8px', border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Ajouter un témoignage
              </button>
            )}
          </S>
        </>
      );

      case 'catalogue': return (
        <>
          <S titre="En-tête de la page catalogue">
            <F label="Titre"><Inp value={config.catalogue.titre} onChange={(v: string) => setCat({ titre: v })} /></F>
            <F label="Sous-titre"><Inp value={config.catalogue.sousTitre} onChange={(v: string) => setCat({ sousTitre: v })} /></F>
          </S>
          <S titre="Grille produits">
            <F label="Nombre de colonnes">
              <div style={{ display: 'flex', gap: 6 }}>
                {([2, 3, 4] as const).map(n => (
                  <button key={n} onClick={() => setCat({ colonnes: n })}
                    style={{ flex: 1, padding: '6px', border: `2px solid ${config.catalogue.colonnes === n ? CP : '#e5e7eb'}`, borderRadius: 6, background: config.catalogue.colonnes === n ? `${CP}15` : '#fff', color: config.catalogue.colonnes === n ? CP : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </F>
            <Toggle label="Afficher les filtres" checked={config.catalogue.afficherFiltres} onChange={(v: boolean) => setCat({ afficherFiltres: v })} />
            <Toggle label="Afficher la recherche" checked={config.catalogue.afficherRecherche} onChange={(v: boolean) => setCat({ afficherRecherche: v })} />
            <Toggle label="Afficher les prix" checked={config.catalogue.afficherPrix} onChange={(v: boolean) => setCat({ afficherPrix: v })} />
            <Toggle label="Afficher le stock" checked={config.catalogue.afficherStock} onChange={(v: boolean) => setCat({ afficherStock: v })} />
          </S>
          <S titre="Bannière promotionnelle">
            <EditorBanniere banniere={config.catalogue.banniere || BANNIERE_DEFAUT} onChange={b => setCat({ banniere: b })} />
          </S>
          <S titre="Sections de la page">
            <SectionsManager sections={config.catalogue.sections} onChange={s => setCat({ sections: s })} couleur={config.accueil.couleurPrimaire || CP} />
          </S>
        </>
      );

      case 'faq': return (
        <>
          <S titre="En-tête">
            <F label="Titre de la page"><Inp value={config.faq.titre} onChange={(v: string) => setFaq({ titre: v })} /></F>
            <F label="Sous-titre"><Txt value={config.faq.sousTitre} onChange={(v: string) => setFaq({ sousTitre: v })} rows={2} /></F>
          </S>
          <S titre="Bannière">
            <EditorBanniere banniere={config.faq.banniere} onChange={b => setFaq({ banniere: b })} />
          </S>
          <S titre="Questions / Réponses">
            {config.faq.items.map((item, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>Q{i + 1}</span>
                  <button onClick={() => { const a = [...config.faq.items]; a.splice(i, 1); setFaq({ items: a }); }}
                    style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
                <F label="Question"><Inp value={item.question} onChange={(v: string) => { const a = [...config.faq.items]; a[i] = { ...a[i], question: v }; setFaq({ items: a }); }} /></F>
                <F label="Réponse"><Txt value={item.reponse} onChange={(v: string) => { const a = [...config.faq.items]; a[i] = { ...a[i], reponse: v }; setFaq({ items: a }); }} rows={3} /></F>
              </div>
            ))}
            <button onClick={() => setFaq({ items: [...config.faq.items, { question: '', reponse: '' }] })}
              style={{ width: '100%', padding: '8px', border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Ajouter une question
            </button>
          </S>
        </>
      );

      case 'a-propos': {
        const ap = config.aPropos;
        const maj = (cle: string, i: number, patch: any) => { const arr = [...(ap[cle] || [])]; arr[i] = { ...arr[i], ...patch }; setAP({ [cle]: arr }); };
        const ret = (cle: string, i: number) => setAP({ [cle]: (ap[cle] || []).filter((_: any, k: number) => k !== i) });
        const btnAj = (txt: string, fn: () => void) => <button onClick={fn} style={{ width: '100%', padding: '8px', border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{txt}</button>;
        const btnX = (fn: () => void) => <button onClick={fn} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>;
        return (
        <>
          <S titre="Titres">
            <F label="Titre principal"><Inp value={ap.titre} onChange={(v: string) => setAP({ titre: v })} placeholder="À propos" /></F>
            <F label="Sous-titre (au-dessus du titre)"><Inp value={ap.sousTitre} onChange={(v: string) => setAP({ sousTitre: v })} placeholder="Notre histoire" /></F>
          </S>
          <S titre="Présentation">
            <F label="Phrase d'accroche (grosse phrase en haut)"><Txt value={ap.accroche} onChange={(v: string) => setAP({ accroche: v })} rows={2} /></F>
            <F label="Histoire de l'entreprise"><Txt value={ap.description} onChange={(v: string) => setAP({ description: v })} placeholder="Racontez votre histoire..." rows={5} /></F>
          </S>
          <S titre="Sections affichées">
            <Toggle label="Bloc engagements (cartes)" checked={ap.afficherValeurs !== false} onChange={(v: boolean) => setAP({ afficherValeurs: v })} />
            <Toggle label="Chiffres clés" checked={ap.afficherChiffres !== false} onChange={(v: boolean) => setAP({ afficherChiffres: v })} />
            <Toggle label="Section équipe" checked={ap.afficherEquipe !== false} onChange={(v: boolean) => setAP({ afficherEquipe: v })} />
            <Toggle label="Bloc final avec boutons" checked={ap.afficherCta !== false} onChange={(v: boolean) => setAP({ afficherCta: v })} />
          </S>
          <S titre="Nos engagements">
            <F label="Sur-titre"><Inp value={ap.valeursSurtitre} onChange={(v: string) => setAP({ valeursSurtitre: v })} placeholder="Nos engagements" /></F>
            <F label="Titre"><Inp value={ap.valeursTitre} onChange={(v: string) => setAP({ valeursTitre: v })} placeholder="Ce en quoi nous croyons" /></F>
            {(ap.valeurs || []).map((v: any, i: number) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 64 }}><Inp value={v.ico} onChange={(val: string) => maj('valeurs', i, { ico: val })} placeholder="💎" /></div>
                  <Inp value={v.titre} onChange={(val: string) => maj('valeurs', i, { titre: val })} placeholder="Titre de la valeur" />
                  {btnX(() => ret('valeurs', i))}
                </div>
                <Txt value={v.desc} onChange={(val: string) => maj('valeurs', i, { desc: val })} placeholder="Description..." rows={2} />
              </div>
            ))}
            {(ap.valeurs || []).length < 6 && btnAj('+ Ajouter une valeur', () => setAP({ valeurs: [...(ap.valeurs || []), { ico: '⭐', titre: '', desc: '' }] }))}
          </S>
          <S titre="Chiffres clés">
            {(ap.chiffres || []).map((x: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 110 }}><Inp value={x.nb} onChange={(val: string) => maj('chiffres', i, { nb: val })} placeholder="500+" /></div>
                <Inp value={x.label} onChange={(val: string) => maj('chiffres', i, { label: val })} placeholder="Produits vendus" />
                {btnX(() => ret('chiffres', i))}
              </div>
            ))}
            {(ap.chiffres || []).length < 6 && btnAj('+ Ajouter un chiffre', () => setAP({ chiffres: [...(ap.chiffres || []), { nb: '', label: '' }] }))}
          </S>
          <S titre="La famille / l'équipe">
            <F label="Sur-titre"><Inp value={ap.equipeSurtitre} onChange={(v: string) => setAP({ equipeSurtitre: v })} placeholder="À propos" /></F>
            <F label="Titre"><Inp value={ap.equipeTitre} onChange={(v: string) => setAP({ equipeTitre: v })} placeholder="Notre équipe" /></F>
            {(ap.equipe || []).map((m: any, i: number) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Inp value={m.prenom} onChange={(val: string) => maj('equipe', i, { prenom: val })} placeholder="Prénom" />
                  <Inp value={m.poste} onChange={(val: string) => maj('equipe', i, { poste: val })} placeholder="Poste" />
                  {btnX(() => ret('equipe', i))}
                </div>
                <Inp value={m.photo} onChange={(val: string) => maj('equipe', i, { photo: val })} placeholder="URL de la photo (facultatif, https://...)" />
              </div>
            ))}
            {(ap.equipe || []).length < 12 && btnAj('+ Ajouter une personne', () => setAP({ equipe: [...(ap.equipe || []), { prenom: '', poste: '', photo: '' }] }))}
          </S>
          <S titre="Passez nous voir (visite)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Vos vraies informations de visite. Tant que tout est vide, ce bloc n'apparaît pas sur votre site.</p>
            <Toggle label="Afficher le bloc visite" checked={ap.afficherVisite !== false} onChange={(v: boolean) => setAP({ afficherVisite: v })} />
            <F label="Sur-titre"><Inp value={ap.visite?.surtitre || ''} onChange={(v: string) => setAP({ visite: { ...(ap.visite || {}), surtitre: v } })} max={60} placeholder="Nous rendre visite" /></F>
            <F label="Titre"><Inp value={ap.visite?.titre || ''} onChange={(v: string) => setAP({ visite: { ...(ap.visite || {}), titre: v } })} max={100} placeholder="Passez nous voir" /></F>
            <F label="Texte d'invitation"><Txt value={ap.visite?.texte || ''} onChange={(v: string) => setAP({ visite: { ...(ap.visite || {}), texte: v } })} rows={3} max={1000} /></F>
            <F label="Adresse"><Inp value={ap.visite?.adresse || ''} onChange={(v: string) => setAP({ visite: { ...(ap.visite || {}), adresse: v } })} max={200} /></F>
            <F label="Heures d'ouverture"><Inp value={ap.visite?.horaires || ''} onChange={(v: string) => setAP({ visite: { ...(ap.visite || {}), horaires: v } })} max={200} /></F>
          </S>
          <S titre="Bloc final">
            <F label="Sur-titre"><Inp value={ap.ctaSurtitre} onChange={(v: string) => setAP({ ctaSurtitre: v })} placeholder="Rejoignez-nous" /></F>
            <F label="Titre"><Inp value={ap.ctaTitre} onChange={(v: string) => setAP({ ctaTitre: v })} placeholder="Prêt à goûter nos produits ?" /></F>
            <F label="Texte"><Txt value={ap.ctaTexte} onChange={(v: string) => setAP({ ctaTexte: v })} rows={2} /></F>
            <F label="Bouton 1 (vers le catalogue)"><Inp value={ap.ctaBoutonCatalogue} onChange={(v: string) => setAP({ ctaBoutonCatalogue: v })} placeholder="Voir nos produits →" /></F>
            <F label="Bouton 2 (vers contact)"><Inp value={ap.ctaBoutonContact} onChange={(v: string) => setAP({ ctaBoutonContact: v })} placeholder="Nous contacter" /></F>
          </S>
        </>
        );
      }

      case 'blog': return (
        <>
          <S titre="En-tête">
            <F label="Titre de la page"><Inp value={config.blog.titre} onChange={(v: string) => setBlog({ titre: v })} /></F>
            <F label="Sous-titre"><Txt value={config.blog.sousTitre} onChange={(v: string) => setBlog({ sousTitre: v })} rows={2} /></F>
          </S>
          <S titre="Bannière">
            <EditorBanniere banniere={config.blog.banniere} onChange={b => setBlog({ banniere: b })} />
          </S>
          <S titre="Mes articles (écrits dans « Mes blogs »)">
            <ArticlesBlogConfig etat={articlesBlog} />
          </S>
          <S titre="Grille articles">
            <F label="Colonnes">
              <div style={{ display: 'flex', gap: 6 }}>
                {([2, 3] as const).map(n => (
                  <button key={n} onClick={() => setBlog({ colonnes: n })}
                    style={{ flex: 1, padding: '6px', border: `2px solid ${config.blog.colonnes === n ? CP : '#e5e7eb'}`, borderRadius: 6, background: config.blog.colonnes === n ? `${CP}15` : '#fff', color: config.blog.colonnes === n ? CP : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {n} colonnes
                  </button>
                ))}
              </div>
            </F>
            <Toggle label="Afficher l'auteur" checked={config.blog.afficherAuteur} onChange={(v: boolean) => setBlog({ afficherAuteur: v })} />
            <Toggle label="Afficher la date" checked={config.blog.afficherDate} onChange={(v: boolean) => setBlog({ afficherDate: v })} />
          </S>
        </>
      );

      case 'contact': return (
        <>
          <S titre="En-tête">
            <F label="Titre"><Inp value={config.contact.titre} onChange={(v: string) => setCont({ titre: v })} /></F>
            <F label="Sous-titre"><Txt value={config.contact.sousTitre} onChange={(v: string) => setCont({ sousTitre: v })} rows={2} /></F>
          </S>
          <S titre="Bannière">
            <EditorBanniere banniere={config.contact.banniere} onChange={b => setCont({ banniere: b })} />
          </S>
          <S titre="Coordonnées">
            <F label="Adresse"><Inp value={config.contact.adresse} onChange={(v: string) => setCont({ adresse: v })} placeholder="123 rue Principale, Montréal, QC" /></F>
            <F label="Téléphone"><Inp value={config.contact.telephone} onChange={(v: string) => setCont({ telephone: v })} placeholder="514 000-0000" /></F>
            <F label="Courriel"><Inp value={config.contact.courriel} onChange={(v: string) => setCont({ courriel: v })} placeholder="info@maboutique.ca" /></F>
            <Toggle label="Afficher une carte Google Maps" checked={config.contact.afficherCarte} onChange={(v: boolean) => setCont({ afficherCarte: v })} />
            {config.contact.afficherCarte && (
              <F label="URL embed Google Maps" desc="Obtenez le lien depuis Google Maps > Partager > Intégrer">
                <Txt value={config.contact.urlCarte} onChange={(v: string) => setCont({ urlCarte: v })} rows={2} placeholder="https://maps.google.com/maps?..." />
              </F>
            )}
          </S>
        </>
      );


      case 'fiche-produit': return (
        <>
          <S titre="Disposition générale">
            <F label="Layout de la page">
              {([
                ['image-gauche', '◧ Image gauche / Info droite'],
                ['image-droite', '◨ Image droite / Info gauche'],
                ['image-haut',   '⬆ Image en haut pleine largeur'],
              ] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setFiche({ layout: val })}
                  style={{ display: 'block', width: '100%', marginBottom: 5, padding: '8px 11px', textAlign: 'left', border: `2px solid ${config.ficheProduit.layout === val ? CP : '#e5e7eb'}`, borderRadius: 6, background: config.ficheProduit.layout === val ? `${CP}10` : '#fff', color: config.ficheProduit.layout === val ? CP : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {lbl}
                </button>
              ))}
            </F>
            <F label="Miniatures photos">
              <div style={{ display: 'flex', gap: 6 }}>
                {([['dessous','⬇ En dessous'],['gauche','◁ À gauche']] as const).map(([val,lbl]) => (
                  <button key={val} onClick={() => setFiche({ photosMiniatures: val })}
                    style={{ flex:1, padding:'7px 4px', border:`2px solid ${config.ficheProduit.photosMiniatures===val?CP:'#e5e7eb'}`, borderRadius:6, background:config.ficheProduit.photosMiniatures===val?`${CP}10`:'#fff', color:config.ficheProduit.photosMiniatures===val?CP:'#555', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </F>
            <F label="Position de la description">
              {([
                ["droite",  "▶ À droite de l'image (dans le panneau info)"],
                ['bas',     '⬇ En bas, pleine largeur'],
                ['onglets', '📑 En onglets (Description / Détails / Livraison)'],
              ] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setFiche({ descriptionPosition: val })}
                  style={{ display:'block', width:'100%', marginBottom:5, padding:'8px 11px', textAlign:'left', border:`2px solid ${config.ficheProduit.descriptionPosition===val?CP:'#e5e7eb'}`, borderRadius:6, background:config.ficheProduit.descriptionPosition===val?`${CP}10`:'#fff', color:config.ficheProduit.descriptionPosition===val?CP:'#555', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {lbl}
                </button>
              ))}
            </F>
            <Toggle label="Tronquer la description" checked={config.ficheProduit.descriptionTronquee} onChange={(v:boolean) => setFiche({ descriptionTronquee: v })} desc="Affiche un bouton 'Lire plus' si la description est longue" />
          </S>

          <S titre="Éléments à afficher">
            <Toggle label="Breadcrumb (Accueil › Catalogue › Produit)" checked={config.ficheProduit.afficherBreadcrumb} onChange={(v:boolean) => setFiche({ afficherBreadcrumb: v })} />
            <Toggle label="Catégorie du produit" checked={config.ficheProduit.afficherCategorie} onChange={(v:boolean) => setFiche({ afficherCategorie: v })} />
            <Toggle label="Badge stock (En stock / Épuisé)" checked={config.ficheProduit.afficherStock} onChange={(v:boolean) => setFiche({ afficherStock: v })} />
            <Toggle label="SKU / Code produit" checked={config.ficheProduit.afficherSku} onChange={(v:boolean) => setFiche({ afficherSku: v })} />
            <Toggle label="Pourcentage de rabais (-25%)" checked={config.ficheProduit.afficherRabaisPct} onChange={(v:boolean) => setFiche({ afficherRabaisPct: v })} />
            <Toggle label="Sélecteur de quantité" checked={config.ficheProduit.afficherQte} onChange={(v:boolean) => setFiche({ afficherQte: v })} />
            <Toggle label="Boutons de partage (Facebook, Pinterest, X)" checked={config.ficheProduit.afficherPartage} onChange={(v:boolean) => setFiche({ afficherPartage: v })} />
          </S>

          <S titre="Bouton d'achat">
            <F label="Texte du bouton">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
                {['Ajouter au panier', 'Commander maintenant', 'Acheter', 'Réserver'].map(lbl => (
                  <button key={lbl} onClick={() => setFiche({ boutonLabel: lbl })}
                    style={{ padding:'7px 11px', textAlign:'left', border:`2px solid ${config.ficheProduit.boutonLabel===lbl?CP:'#e5e7eb'}`, borderRadius:6, background:config.ficheProduit.boutonLabel===lbl?`${CP}10`:'#fff', color:config.ficheProduit.boutonLabel===lbl?CP:'#555', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <Inp value={config.ficheProduit.boutonLabel} onChange={(v:string) => setFiche({ boutonLabel: v })} placeholder="Texte personnalisé..." />
            </F>
            <Couleur label="Couleur du bouton" value={config.ficheProduit.boutonCouleur} onChange={(v:string) => setFiche({ boutonCouleur: v })} />
          </S>

          <S titre="Bloc de réassurance (sous le bouton)">
            <Toggle label="Afficher le bloc de réassurance" checked={config.ficheProduit.afficherReassurance} onChange={(v:boolean) => setFiche({ afficherReassurance: v })} />
            {config.ficheProduit.afficherReassurance && (
              <>
                {config.ficheProduit.reassuranceItems.map((item, i) => (
                  <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:7, padding:9, marginBottom:7 }}>
                    <div style={{ display:'flex', gap:6, marginBottom:5 }}>
                      <Inp value={item.icone} onChange={(v:string) => {
                        const arr = [...config.ficheProduit.reassuranceItems];
                        arr[i] = { ...arr[i], icone: v };
                        setFiche({ reassuranceItems: arr });
                      }} placeholder="🔒" />
                      <Inp value={item.texte} onChange={(v:string) => {
                        const arr = [...config.ficheProduit.reassuranceItems];
                        arr[i] = { ...arr[i], texte: v };
                        setFiche({ reassuranceItems: arr });
                      }} placeholder="Paiement sécurisé" />
                      <button onClick={() => setFiche({ reassuranceItems: config.ficheProduit.reassuranceItems.filter((_,j) => j !== i) })}
                        style={{ background:'#fef2f2', border:'none', borderRadius:5, padding:'0 8px', color:'#ef4444', cursor:'pointer', flexShrink:0 }}>✕</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setFiche({ reassuranceItems: [...config.ficheProduit.reassuranceItems, { icone:'✅', texte:'' }] })}
                  style={{ width:'100%', padding:'7px', border:`2px dashed ${CP}40`, borderRadius:6, background:`${CP}05`, color:CP, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  + Ajouter un élément
                </button>
              </>
            )}
          </S>

          <S titre="Produits similaires">
            <Toggle label="Afficher les produits similaires" checked={config.ficheProduit.afficherSimilaires} onChange={(v:boolean) => setFiche({ afficherSimilaires: v })} />
            {config.ficheProduit.afficherSimilaires && (
              <>
                <F label="Titre de la section">
                  <Inp value={config.ficheProduit.similairesTitre} onChange={(v:string) => setFiche({ similairesTitre: v })} placeholder="Vous aimerez aussi" />
                </F>
                <F label="Nombre de produits à afficher">
                  <div style={{ display:'flex', gap:6 }}>
                    {([2,4,6] as const).map(n => (
                      <button key={n} onClick={() => setFiche({ similairesNombre: n })}
                        style={{ flex:1, padding:'7px', border:`2px solid ${config.ficheProduit.similairesNombre===n?CP:'#e5e7eb'}`, borderRadius:6, background:config.ficheProduit.similairesNombre===n?`${CP}10`:'#fff', color:config.ficheProduit.similairesNombre===n?CP:'#555', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </F>
              </>
            )}
          </S>
        </>
      );

      case 'inscription': {
        // Réglages de la page « Créer un compte » de la boutique (champs, âge minimum, termes). La page de connexion n'a rien à régler.
        const ins = config.inscription;
        const champs: ChampInsc[] = ins.champs || [];
        const majChamp = (i: number, c: ChampInsc) => { const arr = [...champs]; arr[i] = c; setIns({ champs: arr }); };
        const deplacer = (i: number, dir: -1 | 1) => { const arr = [...champs]; const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setIns({ champs: arr }); };
        const ajouter = () => { const id = `champ_${Date.now()}`; setIns({ champs: [...champs, { id, type: 'text', label: '' }] }); setDernierChampInsc(id); };
        const Choix = ({ valeur, options, onChoisir }: { valeur: string; options: [string, string][]; onChoisir: (v: string) => void }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {options.map(([v, l]) => (
              <button key={v} onClick={() => onChoisir(v)}
                style={{ flex: 1, padding: '9px', border: `2px solid ${valeur === v ? CP : '#e5e7eb'}`, borderRadius: 8, background: valeur === v ? `${CP}15` : '#fff', color: valeur === v ? CP : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        );
        return (
          <>
            <S titre="Textes de la page">
              <F label="Titre"><Inp value={ins.titre} onChange={(v: string) => setIns({ titre: v })} placeholder="Créer un compte" /></F>
              <F label="Sous-titre (optionnel)"><Inp value={ins.sousTitre} onChange={(v: string) => setIns({ sousTitre: v })} /></F>
              <F label="Texte du bouton"><Inp value={ins.boutonTexte} onChange={(v: string) => setIns({ boutonTexte: v })} placeholder="Créer mon compte" /></F>
              <F label="Titre du message de succès"><Inp value={ins.messageSuccesTitre} onChange={(v: string) => setIns({ messageSuccesTitre: v })} /></F>
              <F label="Texte du message de succès"><Txt value={ins.messageSuccesTexte} onChange={(v: string) => setIns({ messageSuccesTexte: v })} rows={2} /></F>
            </S>
            <S titre="Champs de base">
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.6 }}>Ces 5 champs sont toujours présents (le compte ne peut pas exister sans eux). Vous pouvez seulement changer leur libellé.</p>
              {([['prenom', 'Prénom'], ['nom', 'Nom'], ['email', 'Courriel'], ['mot_de_passe', 'Mot de passe'], ['confirmation', 'Confirmation du mot de passe']] as const).map(([k, l]) => (
                <F key={k} label={l}><Inp value={ins.libelles[k]} onChange={(v: string) => setIns({ libelles: { ...ins.libelles, [k]: v } })} /></F>
              ))}
            </S>
            <S titre="Champs facultatifs">
              <F label="Téléphone">
                <Choix valeur={ins.telephone.mode} onChoisir={v => setIns({ telephone: { mode: v } })} options={[['cache', 'Caché'], ['facultatif', 'Facultatif'], ['obligatoire', 'Obligatoire']]} />
              </F>
              <F label="Adresse de livraison (adresse, ville, code postal, province)">
                <Choix valeur={ins.adresse.mode} onChoisir={v => setIns({ adresse: { mode: v } })} options={[['cache', 'Cachée'], ['facultatif', 'Facultative'], ['obligatoire', 'Obligatoire']]} />
              </F>
              <p style={{ fontSize: 12, color: '#888', margin: '-6px 0 14px', lineHeight: 1.6 }}>Enregistrée de façon chiffrée et pré-remplie à la caisse. Format canadien vérifié (code postal, province).</p>
              <Toggle label="Case « infolettre »" checked={ins.infolettre.affiche} onChange={(v: boolean) => setIns({ infolettre: { ...ins.infolettre, affiche: v } })} desc="Le client peut cocher pour recevoir vos nouveautés (jamais obligatoire)" />
              {ins.infolettre.affiche && <F label="Texte de la case"><Inp value={ins.infolettre.texte} onChange={(v: string) => setIns({ infolettre: { ...ins.infolettre, texte: v } })} /></F>}
            </S>
            <S titre="Âge minimum">
              <Toggle label="Afficher la case de confirmation d'âge" checked={ins.age.affiche} onChange={(v: boolean) => setIns({ age: { ...ins.age, affiche: v } })} desc="Case obligatoire à cocher pour créer le compte" />
              {ins.age.affiche ? (
                <>
                  <F label="Âge minimum"><Inp type="number" value={ins.age.minimum} onChange={(v: string) => setIns({ age: { ...ins.age, minimum: Math.max(1, Math.min(99, parseInt(v, 10) || 16)) } })} placeholder="16" /></F>
                  <F label="Texte de la case — {age} est remplacé par l'âge minimum"><Inp value={ins.age.texte} onChange={(v: string) => setIns({ age: { ...ins.age, texte: v } })} /></F>
                </>
              ) : (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠️ Sans cette case, aucune confirmation d'âge n'est demandée. Vous restez responsable du respect des lois qui s'appliquent à votre boutique (ex. Loi 25 au Québec).
                </div>
              )}
            </S>
            <S titre="Termes et conditions">
              <Toggle label="Afficher la case « termes et conditions »" checked={ins.termes.affiche} onChange={(v: boolean) => setIns({ termes: { ...ins.termes, affiche: v } })} desc="Case obligatoire à cocher pour créer le compte" />
              {ins.termes.affiche && <>
                <F label="Texte de la case"><Inp value={ins.termes.texte} onChange={(v: string) => setIns({ termes: { ...ins.termes, texte: v } })} /></F>
                <F label="Lien vers vos conditions (optionnel)"><Inp value={ins.termes.url} onChange={(v: string) => setIns({ termes: { ...ins.termes, url: v } })} placeholder="https://..." /></F>
                {ins.termes.url && !/^https?:\/\//i.test(ins.termes.url) && <div style={{ fontSize: 12, color: '#dc2626', margin: '-6px 0 10px' }}>⚠️ Le lien doit commencer par https:// pour s'afficher.</div>}
              </>}
            </S>
            <S titre={`Champs personnalisés (${champs.length}/${MAX_CHAMPS_INSC})`}>
              {champs.map((c, i) => (
                <EditeurChampInscription key={c.id} champ={c} index={i} total={champs.length} ouvertParDefaut={c.id === dernierChampInsc}
                  onChange={nc => majChamp(i, nc)} onSupprimer={() => setIns({ champs: champs.filter((_, j) => j !== i) })} onDeplacer={dir => deplacer(i, dir)} />
              ))}
              {champs.length < MAX_CHAMPS_INSC && (
                <button onClick={ajouter} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Ajouter un champ
                </button>
              )}
              <p style={{ fontSize: 11, color: '#888', margin: '10px 0 0' }}>Les réponses sont conservées avec le compte du client.</p>
            </S>
          </>
        );
      }

      case 'footer': return (
        <>
          <S titre="Identité">
            <F label="Nom de la boutique"><Inp value={config.footer.nomBoutique} onChange={(v: string) => setFoot({ nomBoutique: v })} /></F>
            <F label="Slogan (optionnel)"><Inp value={config.footer.slogan} onChange={(v: string) => setFoot({ slogan: v })} placeholder="Votre boutique en une phrase." /></F>
          </S>
          <S titre="Bande d'images (au-dessus du pied de page)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Jusqu'à 4 photos. Vide = aucune bande.</p>
            {(config.footer.images || []).map((u: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ flex: 1 }}><Inp value={u} onChange={(v: string) => setFoot({ images: (config.footer.images || []).map((x: string, k: number) => (k === i ? v : x)) })} max={1000} placeholder="https://…" /></div>
                <button onClick={() => setFoot({ images: (config.footer.images || []).filter((_: string, k: number) => k !== i) })} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>Retirer</button>
              </div>
            ))}
            {(config.footer.images || []).length < 4 && (
              <button onClick={() => setFoot({ images: [...(config.footer.images || []), ''] })} style={{ background: '#f3f4f6', border: '1px dashed #bbb', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Ajouter une photo</button>
            )}
          </S>
          <S titre="Couleurs">
            <Couleur label="Fond du footer" value={config.footer.couleurFond} onChange={(v: string) => setFoot({ couleurFond: v })} />
            <Couleur label="Texte du footer" value={config.footer.couleurTexte} onChange={(v: string) => setFoot({ couleurTexte: v })} />
          </S>
          <S titre="Bande d'engagements (en haut du pied de page)">
            <p style={NOTE_SECTION}>Jusqu'à 4 lignes : <b>Titre | Texte</b>. Écrivez seulement ce qui est vrai. Vide = pas de bande.</p>
            <F label="Lignes"><Txt value={config.footer.bande || ''} onChange={(v: string) => setFoot({ bande: v })} rows={3} max={800} placeholder={'Livraison | Selon votre politique\nRetours | Selon votre politique'} /></F>
          </S>
          <S titre="Boîte d'aide (avec photo)">
            <Champs obj={config.footer.aide} onPatch={(p: any) => setFoot({ aide: { ...(config.footer.aide || {}), ...p } })} champs={[{ cle: 'titre', label: 'Titre (vide = pas de boîte)', max: 80 }, { cle: 'texte', label: 'Texte', max: 240 }, { cle: 'bouton', label: 'Texte du bouton', max: 30 }, { cle: 'lien', label: 'Lien du bouton', max: 300, placeholder: 'contact', aide: AIDE_LIENS }, { cle: 'photo', label: 'Photo (URL https://…)', max: 1000 }]} />
          </S>
          <S titre="Moyens de paiement acceptés">
            <p style={NOTE_SECTION}>Un par ligne (jusqu'à 8), en texte. N'indiquez que ceux que vous acceptez vraiment.</p>
            <F label="Moyens de paiement"><Txt value={config.footer.paiements || ''} onChange={(v: string) => setFoot({ paiements: v })} rows={3} max={300} placeholder={'Visa\nMastercard'} /></F>
          </S>
          <S titre="Colonnes de liens">
            {([1, 2, 3] as const).map(n => (
              <div key={n} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: 9, marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#555', margin: '0 0 6px' }}>Colonne {n}</p>
                <F label="Titre">
                  <Inp value={(config.footer.colonnes as any)[`titre${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`titre${n}`]: v } })} />
                </F>
                <F label="Liens (1 par ligne)">
                  <Txt value={(config.footer.colonnes as any)[`liens${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`liens${n}`]: v } })} rows={4} placeholder="Accueil&#10;Catalogue&#10;Contact" />
                </F>
              </div>
            ))}
          </S>
          <S titre="Réseaux sociaux">
            {[
              ['facebook', 'Facebook', '🔵'],
              ['instagram', 'Instagram', '🟣'],
              ['tiktok', 'TikTok', '⚫'],
              ['twitter', 'X (Twitter)', '🐦'],
              ['youtube', 'YouTube', '🔴'],
              ['linkedin', 'LinkedIn', '🔷'],
              ['pinterest', 'Pinterest', '📌'],
            ].map(([k, label, ico]) => (
              <F key={k} label={`${ico} ${label}`}>
                <Inp value={(config.footer.reseaux as any)[k]} onChange={(v: string) => setFoot({ reseaux: { ...config.footer.reseaux, [k]: v } })} placeholder="https://..." />
              </F>
            ))}
          </S>
          <S titre="Politiques (liens dans le footer)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Ces liens ouvrent vos politiques (Configuration → Mes politiques). Un lien n'apparaît que si la politique est rédigée.</p>
            {([['afficherConditions', 'Conditions de service'], ['afficherConfidentialite', 'Confidentialité'], ['afficherRetours', 'Retour & remboursement'], ['afficherLivraison', 'Expédition'], ['afficherCoordonnees', 'Coordonnées'], ['afficherMentions', 'Mentions légales']] as [string, string][]).map(([k, l]) => (
              <Toggle key={k} label={l} checked={(config.footer.politiques as any)[k] !== false} onChange={(v: boolean) => setFoot({ politiques: { ...config.footer.politiques, [k]: v } })} />
            ))}
            <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0', lineHeight: 1.6 }}>Astuce : dans les colonnes de liens ci-dessus, écrire « Retours », « Livraison », « Conditions », « Confidentialité », « Coordonnées » ou « Mentions légales » ouvre aussi la politique correspondante.</p>
          </S>
          <S titre="Branding e-Vend Studio">
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', margin: '0 0 3px' }}>Cacher "Propulsé par e-Vend Studio"</p>
                <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Gérez cette option et son tarif (+2$/mois) depuis <strong>Branding & options</strong>.</p>
              </div>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚙️</span>
            </div>
          </S>
        </>
      );

      default: return null;
    }
  };

  // ── Layout (même présentation que Premium : onglets à gauche, contenu pleine largeur) ──
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '16px 12px' : '28px 24px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#05060f,#e0147a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛍</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Config — Simplisse Rosé</h1>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Personnalisez les pages de votre boutique</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open(`/site-preview?vendeurId=${gestionnaireId}`, '_blank', 'noopener,noreferrer')}
            style={{ padding: '10px 18px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#555' }}>
            👁 Aperçu
          </button>
          <button onClick={handleSave} disabled={sauv === 'loading'}
            style={{ padding: '10px 24px', background: sauv === 'ok' ? '#16a34a' : sauv === 'err' ? '#dc2626' : CP, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 800, cursor: sauv === 'loading' ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {sauv === 'loading' ? '⏳ Sauvegarde...' : sauv === 'ok' ? '✅ Sauvegardé !' : sauv === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '210px 1fr', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 8, display: isMobile ? 'flex' : 'block', flexWrap: 'wrap', gap: 4, position: isMobile ? 'static' : 'sticky', top: 12 }}>
          {PAGES.map(pg => (
            <button key={pg.id} onClick={() => setPage(pg.id as PageOnglet)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: isMobile ? 'auto' : '100%', padding: '10px 12px', background: page === pg.id ? `${CP}15` : 'none', border: 'none', borderRadius: 8, color: page === pg.id ? CP : '#666', fontSize: 13, fontWeight: page === pg.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ fontSize: 15 }}>{pg.icone}</span>{pg.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? '18px 16px' : '26px 30px', minWidth: 0 }}>
          {renderConfig()}
        </div>
      </div>
    </div>
  );
}