// CHEMIN : src/pages/gestionnaire/ConfigMesPagesSimplisseMode.tsx
// e-Vend Studio — Configuration des pages du template Simplisse Mode (indépendant des autres templates)
// Pattern identique à ConfigTemplateFoodTruck : panneau gauche + aperçu droit
// 100% mobile responsive

import ArticlesBlogConfig, { useArticlesBlog } from '../../components/ArticlesBlogConfig';
import { useState, useEffect, useCallback } from 'react';
import { migrerMode, POLICES_MODE } from '../../templates/TemplateBoutiqueSimplisseMode';   // conversion de l'ancienne config + liste fermée des polices

// ─── Couleur principale Simplisse Mode ────────────────────────────────────────────
const CP = '#722f37';

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
  afficherFiltresTaille?: boolean;
  afficherFiltresCouleur?: boolean;
  tailles?: string[];
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
  afficherRemonter?: boolean;
  popup?: { actif: boolean; delaiSecondes: number; texte: string; code: string };
  temoignages?: { texte: string; auteur: string; note: number }[];
  avantages?: { ico: string; titre: string; desc: string }[];
}

interface ConfigFooter {
  nomBoutique: string;
  slogan: string;
  couleurFond: string;
  couleurTexte: string;
  afficherPropulse: boolean; // toggle "Propulsé par e-Vend Studio"
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

interface GuideTailles { actif: boolean; titre: string; colonnes: string[]; lignes: { taille: string; valeurs: string[] }[]; note: string }

interface ConfigMode {
  identite: { logoUrl: string };   // logo affiché dans le menu
  lookbook: { titre: string; sousTitre: string; disposition: 'masonry' | 'grille' | 'plein'; photos: string[] };
  instagram: { titre: string; handle: string; photos: string[] };
  guideTailles: GuideTailles;
  accueil:  ConfigPageAccueil;
  catalogue: ConfigCatalogue;
  faq:      ConfigFaq;
  blog:     ConfigBlog;
  contact:  ConfigContact;
  footer:      ConfigFooter;
  ficheProduit: ConfigFicheProduit;
  aPropos: any;       // page « À propos » (vide = rien d'inventé sur le site)
  menu: any;          // menu du haut : libellés renommés + pages cachées
  inscription: any;   // page « Créer un compte » (même modèle que Premium) ; fusionnée avec les défauts à la lecture
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const HERO_DEFAUT: ConfigHero = {
  titre: 'Bienvenue dans notre boutique',
  sousTitre: 'Découvrez notre sélection de produits soigneusement choisis pour vous.',
  boutonLabel: 'Voir le catalogue',
  boutonLien: '/catalogue',
  photo: '',
  couleurFond: '#f2ede6',
  couleurTitre: '#0f0f0f',
  couleurBouton: CP,
  style: 'centre',
};

const BANNIERE_DEFAUT: ConfigBanniere = {
  defilant: true,
  actif: false,
  texte: '🎉 Livraison gratuite sur toutes les commandes de 75$ et plus !',
  couleurFond: CP,
  couleurTexte: '#ffffff',
  lien: '',
  labelLien: 'En savoir plus',
};

const SECTIONS_ACCUEIL: SectionPage[] = [
  { id: 'banniere',      label: 'Bannière défilante',    icone: '📢', actif: true,  ordre: 1 },
  { id: 'hero',          label: 'Section Hero',          icone: '🎬', actif: true,  ordre: 2 },
  { id: 'avantages',     label: 'Avantages / Badges',    icone: '✅', actif: true,  ordre: 3 },
  { id: 'vedette',       label: 'Produits en vedette',   icone: '👗', actif: true,  ordre: 4 },
  { id: 'categories',    label: 'Collections',           icone: '🗂', actif: true,  ordre: 5 },
  { id: 'nouveautes',    label: 'Nouveautés',            icone: '🆕', actif: false, ordre: 6 },
  { id: 'promo',         label: 'Offres spéciales',      icone: '🏷', actif: false, ordre: 7 },
  { id: 'lookbook',      label: 'Lookbook',              icone: '📸', actif: true,  ordre: 8 },
  { id: 'instagram',     label: 'Vu sur Instagram',      icone: '📱', actif: false, ordre: 9 },
  { id: 'temoignages',   label: 'Témoignages clients',   icone: '⭐', actif: true,  ordre: 10 },
  { id: 'newsletter',    label: 'Infolettre',            icone: '📧', actif: false, ordre: 11 },
  { id: 'blog-apercu',   label: 'Articles du blog',      icone: '📰', actif: true,  ordre: 12 },
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

const CONFIG_DEFAUT: ConfigMode = {
  identite: { logoUrl: '' },
  lookbook: { titre: 'Lookbook', sousTitre: '', disposition: 'masonry', photos: [] },
  instagram: { titre: 'Suivez-nous sur Instagram', handle: '', photos: [] },
  guideTailles: { actif: false, titre: 'Guide des tailles', colonnes: ['Buste (cm)', 'Taille (cm)', 'Hanches (cm)'], lignes: [], note: '' },
  accueil: {
    hero: { ...HERO_DEFAUT },
    banniere: { ...BANNIERE_DEFAUT },
    sections: SECTIONS_ACCUEIL,
    couleurPrimaire:   CP,
    couleurSecondaire: '#6b6560',
    couleurFondPage:   '#faf8f5',
    couleurTexte:      '#0f0f0f',
    police: 'Playfair Display',
    afficherRemonter: true,
    popup: { actif: false, delaiSecondes: 5, texte: '', code: '' },
  },
  catalogue: {
    titre: 'Notre catalogue',
    sousTitre: 'Tous nos produits disponibles.',
    colonnes: 3,
    afficherFiltres:  true,
    afficherRecherche: true,
    afficherPrix:     true,
    afficherStock:    true,
    afficherFiltresTaille: true,
    afficherFiltresCouleur: true,
    tailles: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    hero: { ...HERO_DEFAUT, titre: 'Notre catalogue', actif: false } as any,
    banniere: { ...BANNIERE_DEFAUT },
    sections: SECTIONS_CATALOGUE,
  },
  faq: {
    titre: 'Questions fréquentes',
    sousTitre: 'Trouvez rapidement les réponses à vos questions.',
    hero: { ...HERO_DEFAUT, titre: 'Questions fréquentes' },
    banniere: { ...BANNIERE_DEFAUT },
    items: [
      { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables.' },
      { question: 'Puis-je retourner un article ?',        reponse: 'Oui, sous 30 jours suivant la réception.' },
      { question: 'Quels modes de paiement acceptez-vous ?', reponse: 'Visa, Mastercard, PayPal et Apple Pay via Stripe.' },
    ],
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
    nomBoutique: 'Ma Boutique',
    slogan:      '',
    couleurFond: '#111827',
    couleurTexte: '#ffffff',
    afficherPropulse: true,
    reseaux: { facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes: { titre1:'Boutique', liens1:'Accueil\nCatalogue\nBlog\nÀ propos\nContact', titre2:'Aide', liens2:'FAQ\nRetours\nLivraison\nContactez-nous', titre3:'Légal', liens3:'' },
    politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true, afficherMentions: true, afficherCoordonnees: true },
  },
  ficheProduit: { ...FICHE_PRODUIT_DEFAUT },
  inscription: INSCRIPTION_DEF,
  aPropos: { titre: '', sousTitre: '', accroche: '', description: '', afficherValeurs: true, afficherChiffres: true, afficherEquipe: true, afficherCta: true, valeursSurtitre: '', valeursTitre: '', valeurs: [] as any[], chiffres: [] as any[], equipeSurtitre: '', equipeTitre: '', equipe: [] as any[], ctaSurtitre: '', ctaTitre: '', ctaTexte: '', ctaBoutonCatalogue: '', ctaBoutonContact: '' },
  menu: { accueil: '', catalogue: '', blog: '', faq: '', 'a-propos': '', contact: '', masques: [] as string[] },
};

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
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
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
        <F label="Titre principal" desc="Une ligne par saut de ligne : les lignes paires s'affichent en italique, dans votre couleur principale."><Txt value={hero.titre} onChange={(v: string) => set('titre', v)} rows={2} max={160} /></F>
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
          <Toggle label="Texte défilant" checked={banniere.defilant !== false} onChange={(v: boolean) => set('defilant', v)} desc="Le message défile en continu (arrêté pour les visiteurs qui limitent les animations)." />
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

type PageOnglet = 'identite' | 'accueil' | 'catalogue' | 'lookbook' | 'instagram' | 'guide' | 'faq' | 'a-propos' | 'blog' | 'contact' | 'fiche-produit' | 'inscription' | 'footer';

interface Props {
  gestionnaireId: number;
}

export default function ConfigMesPagesSimplisseMode({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigMode>(CONFIG_DEFAUT);
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
        const brut = migrerMode(data?.config && typeof data.config === 'object' ? data.config.mode : null);
        if (brut && typeof brut === 'object' && Object.keys(brut).length > 0) {
          const obj = (x: any) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
          setConfig(prev => ({
            ...prev, ...brut,
            identite: { ...prev.identite, ...obj(brut.identite) },
            lookbook: { ...prev.lookbook, ...obj(brut.lookbook), photos: Array.isArray(obj(brut.lookbook).photos) ? obj(brut.lookbook).photos.slice(0, 12) : prev.lookbook.photos },
            instagram: { ...prev.instagram, ...obj(brut.instagram), photos: Array.isArray(obj(brut.instagram).photos) ? obj(brut.instagram).photos.slice(0, 6) : prev.instagram.photos },
            guideTailles: { ...prev.guideTailles, ...obj(brut.guideTailles), colonnes: Array.isArray(obj(brut.guideTailles).colonnes) ? obj(brut.guideTailles).colonnes.slice(0, 6) : prev.guideTailles.colonnes, lignes: Array.isArray(obj(brut.guideTailles).lignes) ? obj(brut.guideTailles).lignes.slice(0, 14) : [] },
            accueil: { ...prev.accueil, ...obj(brut.accueil), popup: { ...prev.accueil.popup!, ...obj(obj(brut.accueil).popup) }, hero: { ...prev.accueil.hero, ...obj(obj(brut.accueil).hero) }, banniere: { ...prev.accueil.banniere, ...obj(obj(brut.accueil).banniere) }, sections: Array.isArray(obj(brut.accueil).sections) ? brut.accueil.sections : prev.accueil.sections },
            catalogue: { ...prev.catalogue, ...obj(brut.catalogue), hero: { ...prev.catalogue.hero, ...obj(obj(brut.catalogue).hero) }, banniere: { ...prev.catalogue.banniere, ...obj(obj(brut.catalogue).banniere) } },
            faq: { ...prev.faq, ...obj(brut.faq), hero: { ...prev.faq.hero, ...obj(obj(brut.faq).hero) }, banniere: { ...prev.faq.banniere, ...obj(obj(brut.faq).banniere) }, items: Array.isArray(obj(brut.faq).items) ? brut.faq.items : prev.faq.items },
            blog: { ...prev.blog, ...obj(brut.blog), hero: { ...prev.blog.hero, ...obj(obj(brut.blog).hero) }, banniere: { ...prev.blog.banniere, ...obj(obj(brut.blog).banniere) } },
            contact: { ...prev.contact, ...obj(brut.contact), hero: { ...prev.contact.hero, ...obj(obj(brut.contact).hero) }, banniere: { ...prev.contact.banniere, ...obj(obj(brut.contact).banniere) } },
            footer: { ...prev.footer, ...obj(brut.footer), reseaux: { ...prev.footer.reseaux, ...obj(obj(brut.footer).reseaux) }, colonnes: { ...prev.footer.colonnes, ...obj(obj(brut.footer).colonnes) }, politiques: { ...prev.footer.politiques, ...obj(obj(brut.footer).politiques) } },
            ficheProduit: { ...prev.ficheProduit, ...obj(brut.ficheProduit) },
            inscription: fusionInscription(brut.inscription),
            aPropos: { ...CONFIG_DEFAUT.aPropos, ...obj(brut.aPropos) },
            menu: { ...CONFIG_DEFAUT.menu, ...obj(brut.menu) },
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
        body: JSON.stringify({ config: { mode: config }, template_id: 'boutique-simplisse-mode' }),
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
  const setLook = useCallback((patch: Partial<ConfigMode['lookbook']>) => setConfig(c => ({ ...c, lookbook: { ...c.lookbook, ...patch } })), []);
  const setInsta = useCallback((patch: Partial<ConfigMode['instagram']>) => setConfig(c => ({ ...c, instagram: { ...c.instagram, ...patch } })), []);
  const setGuide = useCallback((patch: Partial<GuideTailles>) => setConfig(c => ({ ...c, guideTailles: { ...c.guideTailles, ...patch } })), []);
  const setIdent = useCallback((patch: Partial<ConfigMode['identite']>) => setConfig(c => ({ ...c, identite: { ...c.identite, ...patch } })), []);
  const setAcc  = useCallback((patch: Partial<ConfigPageAccueil>) => setConfig(c => ({ ...c, accueil:  { ...c.accueil,  ...patch } })), []);
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
    { id: 'accueil',   label: 'Accueil',   icone: '🏠' },
    { id: 'catalogue', label: 'Catalogue', icone: '📦' },
    { id: 'lookbook',  label: 'Lookbook',  icone: '📸' },
    { id: 'instagram', label: 'Instagram', icone: '📱' },
    { id: 'guide',     label: 'Guide des tailles', icone: '📏' },
    { id: 'faq',       label: 'FAQ',       icone: '❓' },
    { id: 'a-propos',  label: 'À propos',  icone: '💡' },
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
          <S titre="Police des titres">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>S'applique aux titres ; le texte du site reste en Inter.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {POLICES_MODE.map(p => {
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
            <Couleur label="Fond de page" value={config.accueil.couleurFondPage} onChange={(v: string) => setAcc({ couleurFondPage: v })} />
            <Couleur label="Texte principal" value={config.accueil.couleurTexte} onChange={(v: string) => setAcc({ couleurTexte: v })} />
            <Toggle label="Bouton « Retour en haut »" checked={config.accueil.afficherRemonter !== false} onChange={(v: boolean) => setAcc({ afficherRemonter: v })} desc="Petite flèche en bas à gauche quand on descend dans la page." />
          </S>
          <S titre="Produits, livraison et taxes">
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>Les produits viennent de <b>Vos annonces</b>. La livraison, les taxes et les paiements se règlent dans la <b>Configuration</b> de votre compte : ils s'appliquent automatiquement à la caisse.</p>
          </S>
        </>
      );

      case 'accueil': return (
        <>
          <S titre="Menu du haut">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Renommez les liens du menu ou cachez les pages dont vous n'avez pas besoin. Vide = nom par défaut.</p>
            {([['accueil', 'Accueil', false], ['catalogue', 'Catalogue', false], ['blog', 'Blog', true], ['faq', 'FAQ', true], ['a-propos', 'À propos', true], ['contact', 'Contact', true]] as [string, string, boolean][]).map(([id, defaut, masquable]) => {
              const masque = (config.menu.masques || []).includes(id);
              return (
                <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, opacity: masque ? 0.5 : 1 }}>
                  <div style={{ flex: 1 }}><Inp value={config.menu[id] || ''} onChange={(v: string) => setMenu({ [id]: v })} placeholder={defaut} /></div>
                  {masquable && <button onClick={() => setMenu({ masques: masque ? config.menu.masques.filter((x: string) => x !== id) : [...(config.menu.masques || []), id] })} style={{ background: masque ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: masque ? '#dc2626' : '#16a34a', cursor: 'pointer', minWidth: 78 }}>{masque ? 'Caché' : 'Affiché'}</button>}
                </div>
              );
            })}
          </S>
          <S titre="Popup de bienvenue">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Fenêtre affichée une seule fois par visite. Le code promo doit exister dans vos réductions : le popup l'affiche, il ne le crée pas.</p>
            <Toggle label="Activer le popup" checked={!!config.accueil.popup?.actif} onChange={(v: boolean) => setAcc({ popup: { ...(config.accueil.popup as any), actif: v } })} />
            {config.accueil.popup?.actif && <>
              <F label="Message"><Inp value={config.accueil.popup?.texte} onChange={(v: string) => setAcc({ popup: { ...(config.accueil.popup as any), texte: v } })} max={160} placeholder="Votre message" /></F>
              <F label="Code promo (optionnel)"><Inp value={config.accueil.popup?.code} onChange={(v: string) => setAcc({ popup: { ...(config.accueil.popup as any), code: v } })} max={30} placeholder="Code" /></F>
              <F label="Délai avant l'affichage (secondes)"><Inp type="number" value={String(config.accueil.popup?.delaiSecondes ?? 5)} onChange={(v: string) => setAcc({ popup: { ...(config.accueil.popup as any), delaiSecondes: Math.max(1, Math.min(60, parseInt(v, 10) || 5)) } })} /></F>
            </>}
          </S>
          <S titre="Bannière promotionnelle">
            <EditorBanniere banniere={config.accueil.banniere} onChange={b => setAcc({ banniere: b })} />
          </S>
          <S titre="Section Hero">
            <EditorHero hero={config.accueil.hero} onChange={h => setAcc({ hero: h })} />
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
          <S titre="Témoignages (section « Avis »)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Écrivez ici de vrais commentaires de vos clients. Tant qu'il n'y en a aucun, la section n'apparaît pas sur votre site.</p>
            {(config.accueil.temoignages || []).map((t, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>Témoignage {i + 1}</span>
                  <button onClick={() => { const a = [...(config.accueil.temoignages || [])]; a.splice(i, 1); setAcc({ temoignages: a }); }}
                    style={{ background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
                <F label="Commentaire"><Txt value={t.texte} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], texte: v }; setAcc({ temoignages: a }); }} rows={3} /></F>
                <F label="Nom du client"><Inp value={t.auteur} onChange={(v: string) => { const a = [...(config.accueil.temoignages || [])]; a[i] = { ...a[i], auteur: v }; setAcc({ temoignages: a }); }} /></F>
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
            <Toggle label="Filtre par taille" checked={config.catalogue.afficherFiltresTaille !== false} onChange={(v: boolean) => setCat({ afficherFiltresTaille: v })} desc="Basé sur les variantes de vos annonces dont le nom est une taille de la liste ci-dessous (ex. « M »)." />
            <Toggle label="Filtre par couleur (pastilles)" checked={config.catalogue.afficherFiltresCouleur !== false} onChange={(v: boolean) => setCat({ afficherFiltresCouleur: v })} desc="Basé sur les variantes dont le nom est une couleur connue (Noir, Rouge, Marine, Sauge…)." />
            <F label="Tailles proposées dans le filtre" desc="Séparées par des virgules. Seules les tailles présentes dans vos annonces s'affichent."><Inp value={(config.catalogue.tailles || []).join(',')} onChange={(v: string) => setCat({ tailles: v.split(',').map(t => limiter(t, 10).trim()).filter(Boolean).slice(0, 20) })} max={200} placeholder="XS,S,M,L,XL,XXL" /></F>
          </S>
          <S titre="Bannière promotionnelle">
            <EditorBanniere banniere={config.catalogue.banniere || BANNIERE_DEFAUT} onChange={b => setCat({ banniere: b })} />
          </S>
          <S titre="Sections de la page">
            <SectionsManager sections={config.catalogue.sections} onChange={s => setCat({ sections: s })} couleur={config.accueil.couleurPrimaire || CP} />
          </S>
        </>
      );

      case 'lookbook': {
        const photos = config.lookbook.photos || [];
        return (
          <>
            <S titre="Section Lookbook">
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>La section n'apparaît sur votre site que si vous ajoutez au moins une photo (et si elle est activée dans Accueil → Sections de la page).</p>
              <F label="Titre"><Inp value={config.lookbook.titre} onChange={(v: string) => setLook({ titre: v })} max={80} /></F>
              <F label="Sous-titre"><Inp value={config.lookbook.sousTitre} onChange={(v: string) => setLook({ sousTitre: v })} max={160} /></F>
              <F label="Disposition">
                <select value={config.lookbook.disposition} onChange={e => setLook({ disposition: e.target.value === 'grille' ? 'grille' : e.target.value === 'plein' ? 'plein' : 'masonry' })}
                  style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #e2ddd8', borderRadius: 2, fontSize: 14, background: '#fff', color: '#1a1a1a', fontFamily: 'inherit' }}>
                  <option value="masonry">Mosaïque (masonry)</option><option value="grille">Grille</option><option value="plein">Pleine largeur</option>
                </select>
              </F>
            </S>
            <S titre="Photos (12 max)">
              {photos.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <Inp value={u} onChange={(v: string) => { const a = [...photos]; a[i] = v; setLook({ photos: a }); }} placeholder="https://… (URL de l'image)" />
                  <button onClick={() => setLook({ photos: photos.filter((_, k) => k !== i) })} aria-label="Supprimer la photo" style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '8px 11px', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {photos.length < 12 && <button onClick={() => setLook({ photos: [...photos, ''] })} style={{ width: '100%', padding: 9, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une photo</button>}
            </S>
          </>
        );
      }

      case 'instagram': {
        const photos = config.instagram.photos || [];
        return (
          <>
            <S titre="Section « Vu sur Instagram »">
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>À activer dans Accueil → Sections de la page. Elle n'apparaît que si vous indiquez votre compte ou au moins une photo. Les photos sont celles que vous choisissez : rien n'est lu automatiquement depuis Instagram.</p>
              <F label="Titre"><Inp value={config.instagram.titre} onChange={(v: string) => setInsta({ titre: v })} max={80} /></F>
              <F label="Votre compte (@…)" desc="Lettres, chiffres, points et tirets bas seulement."><Inp value={config.instagram.handle} onChange={(v: string) => setInsta({ handle: v.replace(/[^A-Za-z0-9._@]/g, '') })} max={31} placeholder="@maboutique" /></F>
            </S>
            <S titre="Photos (6 max)">
              {photos.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <Inp value={u} onChange={(v: string) => { const a = [...photos]; a[i] = v; setInsta({ photos: a }); }} placeholder="https://… (URL de l'image)" />
                  <button onClick={() => setInsta({ photos: photos.filter((_, k) => k !== i) })} aria-label="Supprimer la photo" style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '8px 11px', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {photos.length < 6 && <button onClick={() => setInsta({ photos: [...photos, ''] })} style={{ width: '100%', padding: 9, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une photo</button>}
            </S>
          </>
        );
      }

      case 'guide': {
        const g = config.guideTailles; const cols = g.colonnes || [];
        const majLigne = (i: number, patch: any) => { const l = [...g.lignes]; l[i] = { ...l[i], ...patch }; setGuide({ lignes: l }); };
        return (
          <>
            <S titre="Guide des tailles">
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Saisissez VOS mesures : rien n'est pré-rempli. Le lien « Guide des tailles » apparaît sur les fiches produit qui ont des variantes, seulement si le guide est activé et contient au moins une taille.</p>
              <Toggle label="Activer le guide" checked={g.actif} onChange={(v: boolean) => setGuide({ actif: v })} />
              <F label="Titre"><Inp value={g.titre} onChange={(v: string) => setGuide({ titre: v })} max={60} /></F>
            </S>
            <S titre="Colonnes (6 max)">
              {cols.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Inp value={c} onChange={(v: string) => { const a = [...cols]; a[i] = v; setGuide({ colonnes: a }); }} max={30} placeholder="Ex. Buste (cm)" />
                  <button onClick={() => setGuide({ colonnes: cols.filter((_, k) => k !== i), lignes: g.lignes.map(l => ({ ...l, valeurs: (l.valeurs || []).filter((_, k) => k !== i) })) })} aria-label="Supprimer la colonne" style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '8px 11px', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {cols.length < 6 && <button onClick={() => setGuide({ colonnes: [...cols, ''], lignes: g.lignes.map(l => ({ ...l, valeurs: [...(l.valeurs || []), ''] })) })} style={{ width: '100%', padding: 9, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une colonne</button>}
            </S>
            <S titre="Tailles (14 max)">
              {g.lignes.map((l, i) => (
                <div key={i} style={{ border: '1px solid #e2ddd8', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Inp value={l.taille} onChange={(v: string) => majLigne(i, { taille: v })} max={20} placeholder="Taille (ex. M)" />
                    <button onClick={() => setGuide({ lignes: g.lignes.filter((_, k) => k !== i) })} aria-label="Supprimer la taille" style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '8px 11px', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, 1fr)`, gap: 6 }}>
                    {cols.map((c, k) => <Inp key={k} value={(l.valeurs || [])[k] || ''} onChange={(v: string) => { const a = cols.map((_, q) => (l.valeurs || [])[q] || ''); a[k] = v; majLigne(i, { valeurs: a }); }} max={20} placeholder={c || `Col. ${k + 1}`} />)}
                  </div>
                </div>
              ))}
              {g.lignes.length < 14 && <button onClick={() => setGuide({ lignes: [...g.lignes, { taille: '', valeurs: cols.map(() => '') }] })} style={{ width: '100%', padding: 9, border: `2px dashed ${CP}40`, borderRadius: 7, background: `${CP}05`, color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une taille</button>}
            </S>
            <S titre="Note sous le tableau (optionnelle)">
              <Txt value={g.note} onChange={(v: string) => setGuide({ note: v })} rows={2} max={300} />
            </S>
          </>
        );
      }

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
            <F label="Titre principal"><Inp value={ap.titre} onChange={(v: string) => setAP({ titre: v })} placeholder="À propos de nous" /></F>
            <F label="Sous-titre (au-dessus du titre)"><Inp value={ap.sousTitre} onChange={(v: string) => setAP({ sousTitre: v })} placeholder="Notre histoire" /></F>
          </S>
          <S titre="Présentation">
            <F label="Phrase d'accroche (grosse phrase en haut)"><Txt value={ap.accroche} onChange={(v: string) => setAP({ accroche: v })} rows={2} /></F>
            <F label="Description de la boutique"><Txt value={ap.description} onChange={(v: string) => setAP({ description: v })} placeholder="Racontez votre histoire..." rows={5} /></F>
          </S>
          <S titre="Sections affichées">
            <Toggle label="Bloc valeurs (cartes)" checked={ap.afficherValeurs !== false} onChange={(v: boolean) => setAP({ afficherValeurs: v })} />
            <Toggle label="Chiffres clés" checked={ap.afficherChiffres !== false} onChange={(v: boolean) => setAP({ afficherChiffres: v })} />
            <Toggle label="Section équipe" checked={ap.afficherEquipe !== false} onChange={(v: boolean) => setAP({ afficherEquipe: v })} />
            <Toggle label="Bloc final avec boutons" checked={ap.afficherCta !== false} onChange={(v: boolean) => setAP({ afficherCta: v })} />
          </S>
          <S titre="Nos valeurs">
            <F label="Sur-titre"><Inp value={ap.valeursSurtitre} onChange={(v: string) => setAP({ valeursSurtitre: v })} placeholder="Nos valeurs" /></F>
            <F label="Titre"><Inp value={ap.valeursTitre} onChange={(v: string) => setAP({ valeursTitre: v })} placeholder="Ce qui nous définit" /></F>
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
          <S titre="Équipe">
            <F label="Sur-titre"><Inp value={ap.equipeSurtitre} onChange={(v: string) => setAP({ equipeSurtitre: v })} placeholder="L'équipe" /></F>
            <F label="Titre"><Inp value={ap.equipeTitre} onChange={(v: string) => setAP({ equipeTitre: v })} placeholder="Les visages derrière la boutique" /></F>
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
          <S titre="Bloc final">
            <F label="Sur-titre"><Inp value={ap.ctaSurtitre} onChange={(v: string) => setAP({ ctaSurtitre: v })} placeholder="Rejoignez-nous" /></F>
            <F label="Titre"><Inp value={ap.ctaTitre} onChange={(v: string) => setAP({ ctaTitre: v })} placeholder="Prêt à découvrir notre sélection ?" /></F>
            <F label="Texte"><Txt value={ap.ctaTexte} onChange={(v: string) => setAP({ ctaTexte: v })} rows={2} /></F>
            <F label="Bouton 1 (vers le catalogue)"><Inp value={ap.ctaBoutonCatalogue} onChange={(v: string) => setAP({ ctaBoutonCatalogue: v })} placeholder="Voir notre catalogue →" /></F>
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
            <F label="Slogan (optionnel)"><Inp value={config.footer.slogan} onChange={(v: string) => setFoot({ slogan: v })} placeholder="Qualité artisanale depuis 2018." /></F>
          </S>
          <S titre="Couleurs">
            <Couleur label="Fond du footer" value={config.footer.couleurFond} onChange={(v: string) => setFoot({ couleurFond: v })} />
            <Couleur label="Texte du footer" value={config.footer.couleurTexte} onChange={(v: string) => setFoot({ couleurTexte: v })} />
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#0f0f0f,${CP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👗</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Config — Simplisse Mode</h1>
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