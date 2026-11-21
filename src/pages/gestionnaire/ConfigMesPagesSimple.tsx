// CHEMIN : src/pages/gestionnaire/ConfigMesPagesSimple.tsx
// e-Vend Studio — Configuration des pages du template Mono-produit (boutique-simple) : une page de vente + Blog, À propos, Contact, Compte, Footer.
// Dérivé de ConfigMesPagesSimplisse (même présentation). La config est enregistrée dans config.simple.
// Pattern identique à ConfigTemplateFoodTruck : panneau gauche + aperçu droit
// 100% mobile responsive

import ArticlesBlogConfig, { useArticlesBlog } from '../../components/ArticlesBlogConfig';
import { useState, useEffect, useCallback } from 'react';

// ─── Couleur principale Simplisse ────────────────────────────────────────────
const CP = '#2563eb';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionPage {
  id: string;
  label: string;
  icone: string;
  actif: boolean;
  ordre: number;
}

interface ConfigBanniere {
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

interface ConfigSimplisse {
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
  couleurFond: '#f8fafc',
  couleurTitre: '#1a1a1a',
  couleurBouton: CP,
  style: 'centre',
};

const BANNIERE_DEFAUT: ConfigBanniere = {
  actif: false,
  texte: '🎉 Livraison gratuite sur toutes les commandes de 75$ et plus !',
  couleurFond: CP,
  couleurTexte: '#ffffff',
  lien: '',
  labelLien: 'En savoir plus',
};

const SECTIONS_ACCUEIL: SectionPage[] = [
  { id: 'banniere',      label: 'Bannière promo',        icone: '📢', actif: true,  ordre: 1 },
  { id: 'hero',          label: 'Section Hero',          icone: '🖼', actif: true,  ordre: 2 },
  { id: 'avantages',     label: 'Avantages / Badges',    icone: '✅', actif: true,  ordre: 3 },
  { id: 'vedette',       label: 'Produits en vedette',   icone: '⭐', actif: true,  ordre: 4 },
  { id: 'categories',    label: 'Catégories',            icone: '🗂', actif: true,  ordre: 5 },
  { id: 'nouveautes',    label: 'Nouveautés',            icone: '🆕', actif: true,  ordre: 6 },
  { id: 'promo',         label: 'Offres spéciales',      icone: '🏷', actif: false, ordre: 7 },
  { id: 'temoignages',   label: 'Témoignages clients',   icone: '💬', actif: true,  ordre: 8 },
  { id: 'newsletter',    label: 'Infolettre',            icone: '📧', actif: false, ordre: 9 },
  { id: 'blog-apercu',   label: 'Aperçu du blog',        icone: '📝', actif: false, ordre: 10 },
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

// ─── Page de vente (Mono-produit) : défauts. Aucun texte inventé : vide = rien d'affiché (sauf le titre du produit) ───
const VENTE_DEFAUT: any = {
  afficherHero: true, heroSurtitre: '', heroTitre: '', heroSousTitre: '', heroBouton: 'Acheter maintenant', heroPhoto: '',
  afficherConfiance: true,
  afficherBenefices: true, beneficesTitre: "Pourquoi vous allez l'adorer", benefices: [],
  afficherDetails: true, details: [],
  afficherAvis: true, avisTitre: 'Ce que disent nos clients',
  afficherFaq: true, faqTitre: 'Questions fréquentes',
  afficherCta: true, ctaTitre: '', ctaTexte: '', ctaBouton: 'Acheter maintenant',
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

const CONFIG_DEFAUT: ConfigSimplisse = {
  accueil: {
    hero: { ...HERO_DEFAUT },
    banniere: { ...BANNIERE_DEFAUT },
    sections: SECTIONS_ACCUEIL,
    couleurPrimaire:   CP,
    couleurSecondaire: '#64748b',
    couleurFondPage:   '#ffffff',
    couleurTexte:      '#1a1a1a',
    police: 'Inter',
  },
  catalogue: {
    titre: 'Notre catalogue',
    sousTitre: 'Tous nos produits disponibles.',
    colonnes: 3,
    afficherFiltres:  true,
    afficherRecherche: true,
    afficherPrix:     true,
    afficherStock:    true,
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

type ConfigSimple = ConfigSimplisse & { vente: any; blocs?: any[] };
const CONFIG_DEFAUT_SIMPLE: ConfigSimple = {
  ...CONFIG_DEFAUT,
  vente: VENTE_DEFAUT,
  faq: { ...CONFIG_DEFAUT.faq, items: [] },   // aucune question inventée : le gestionnaire écrit les siennes
  footer: { ...CONFIG_DEFAUT.footer, colonnes: { ...CONFIG_DEFAUT.footer.colonnes, liens1: 'Accueil\nBlog\nÀ propos\nContact', liens2: 'Retours\nLivraison\nContactez-nous' } },
};

// ─── Composants utilitaires (même style que FoodTruck) ───────────────────────

const Inp = ({ value, onChange, placeholder, type = 'text', max }: any) => (
  <input type={type} value={value ?? ''} placeholder={placeholder} maxLength={max}
    onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box', fontFamily: 'inherit' }}
    onFocus={e => (e.target.style.borderColor = CP)}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Txt = ({ value, onChange, placeholder, rows = 3, max }: any) => (
  <textarea value={value ?? ''} placeholder={placeholder} rows={rows} maxLength={max}
    onChange={e => onChange(e.target.value)}
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
      <Inp value={value} onChange={onChange} />
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

type PageOnglet = 'accueil' | 'faq' | 'a-propos' | 'blog' | 'contact' | 'fiche-produit' | 'inscription' | 'footer';

interface Props {
  gestionnaireId: number;
}

// ─── Blocs de la page de vente (config.simple.blocs) ─────────────────────────────────────────────────────────────
// Chaque bloc : { id, type, actif, ordre, fond, ...contenu }. Les boutiques déjà configurées sont migrées depuis l'ancienne page de vente.
const INFO_BLOC: Record<string, { label: string; icone: string; unique?: boolean; desc: string }> = {
  hero:        { label: 'Accroche (hero)',           icone: '🖼️', desc: 'Grand titre + texte + bouton, avec une photo, un collage de photos ou une image de fond. Vous pouvez en ajouter plusieurs.' },
  confiance:   { label: 'Bandeau de confiance',      icone: '🛡️', desc: 'Vos engagements en une ligne (livraison, retours, paiement…).' },
  produit:     { label: 'Produit à acheter',         icone: '🛒', unique: true, desc: 'Photos, options, quantité et bouton panier. Ce bloc est obligatoire : vous pouvez le déplacer mais pas le supprimer.' },
  video:       { label: 'Vidéo de présentation',     icone: '▶️', desc: 'Une vidéo YouTube ou Vimeo pour présenter le produit.' },
  defilant:    { label: 'Phrase défilante',          icone: '↔️', desc: 'Une phrase qui défile : vitesse, police et effets réglables.' },
  citation:    { label: 'Grande citation',           icone: '❝',  desc: 'Une phrase forte, en grand.' },
  piliers:     { label: 'Valeurs / piliers',         icone: '🧱', desc: 'Cartes avec photo et titre ; un clic sur « + » affiche le texte.' },
  chronologie: { label: 'Chronologie',               icone: '🕰️', desc: 'Les grandes dates de votre histoire, avec photo et texte.' },
  comparatif:  { label: 'Tableau comparatif',        icone: '⚖️', desc: 'Comparez votre produit aux autres avec des ✓ et des ✗.' },
  benefices:   { label: 'Bénéfices',                 icone: '✨', desc: 'Ce que le produit apporte au client (3 est idéal).' },
  details:     { label: 'Détails texte + photo',     icone: '📖', desc: 'Sections texte et photo qui s\'alternent.' },
  avis:        { label: 'Avis clients',              icone: '⭐', desc: 'De vrais commentaires de vos clients.' },
  faq:         { label: 'Questions fréquentes',      icone: '❓', unique: true, desc: 'Les questions s\'écrivent dans l\'onglet FAQ.' },
  cta:         { label: 'Appel final',               icone: '📣', desc: 'Dernier titre + bouton en bas de page.' },
};
const ORDRE_TYPES_AJOUT = ['hero', 'video', 'defilant', 'citation', 'piliers', 'chronologie', 'comparatif', 'confiance', 'benefices', 'details', 'avis', 'faq', 'cta'];
const POLICES_DEFIL_LABELS: [string, string][] = [['sans', 'Moderne (sans empattement)'], ['serif', 'Élégante (serif)'], ['mono', 'Machine à écrire'], ['arrondie', 'Arrondie'], ['condensee', 'Condensée'], ['manuscrite', 'Manuscrite']];
const POLICES_DEFIL_CSS: Record<string, string> = { sans: 'Inter, system-ui, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: 'ui-monospace, Menlo, Consolas, monospace', arrondie: '"Trebuchet MS", "Segoe UI", sans-serif', condensee: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif', manuscrite: '"Brush Script MT", "Segoe Script", cursive' };
const limB = (v: any, max: number): string => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);

const analyserVideoCfg = (u: any): 'youtube' | 'vimeo' | null => {
  const t = String(u == null ? '' : u).trim().slice(0, 300);
  if (/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{11}(?:[?&#/].*)?$/i.test(t)) return 'youtube';
  if (/^https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)\d{6,12}(?:\/[a-f0-9]{6,20})?(?:[/?#].*)?$/i.test(t)) return 'vimeo';
  return null;
};

function blocsDefautCfg(rv: any, accueil: any): any[] {
  const r = rv || {};
  const l: any[] = [
    { id: 'hero', type: 'hero', actif: r.afficherHero !== false, surtitre: r.heroSurtitre || '', titre: r.heroTitre || '', sousTitre: r.heroSousTitre || '', bouton: (typeof r.heroBouton === 'string' && r.heroBouton.trim()) ? r.heroBouton : 'Acheter maintenant', lien: '', photo: r.heroPhoto || '', photos: [], disposition: 'photo', afficherPrix: true, fond: 'auto' },
    { id: 'confiance', type: 'confiance', actif: r.afficherConfiance !== false, items: Array.isArray(accueil?.avantages) ? accueil.avantages : [], fond: 'auto' },
    { id: 'produit', type: 'produit', actif: true, fond: 'auto' },
    { id: 'benefices', type: 'benefices', actif: r.afficherBenefices !== false, surtitre: r.beneficesSurtitre || '', titre: r.beneficesTitre || "Pourquoi vous allez l'adorer", items: Array.isArray(r.benefices) ? r.benefices : [], fond: 'auto' },
    { id: 'details', type: 'details', actif: r.afficherDetails !== false, items: Array.isArray(r.details) ? r.details : [], fond: 'auto' },
    { id: 'avis', type: 'avis', actif: r.afficherAvis !== false, titre: r.avisTitre || 'Ce que disent nos clients', items: Array.isArray(accueil?.temoignages) ? accueil.temoignages : [], fond: 'auto' },
    { id: 'faq', type: 'faq', actif: r.afficherFaq !== false, titre: r.faqTitre || 'Questions fréquentes', fond: 'auto' },
    { id: 'cta', type: 'cta', actif: r.afficherCta !== false, titre: r.ctaTitre || '', texte: r.ctaTexte || '', bouton: (typeof r.ctaBouton === 'string' && r.ctaBouton.trim()) ? r.ctaBouton : 'Acheter maintenant', lien: '', fond: 'auto' },
  ];
  return l.map((b, i) => ({ ...b, ordre: i * 10 }));
}

function nouveauBloc(type: string): any {
  const id = type + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const base: any = { id, type, actif: true, ordre: 0, fond: 'auto' };
  switch (type) {
    case 'hero':        return { ...base, surtitre: '', titre: '', sousTitre: '', bouton: '', lien: '', photo: '', photos: ['', '', ''], disposition: 'collage', afficherPrix: false };
    case 'confiance':   return { ...base, items: [] };
    case 'video':       return { ...base, surtitre: '', titre: '', texte: '', url: '' };
    case 'defilant':    return { ...base, texte: '', vitesse: 5, direction: 'gauche', police: 'sans', taille: 56, style: 'contour', separateur: '✦', couleurTexte: '', couleur2: '#8b5cf6', gras: true, italique: false, majuscules: true, espacement: 2, incline: false, pauseSurvol: true };
    case 'citation':    return { ...base, texte: '', auteur: '', role: '', taille: 34, police: 'serif' };
    case 'piliers':     return { ...base, surtitre: '', titre: '', colonnes: 3, items: [] };
    case 'chronologie': return { ...base, surtitre: '', titre: '', items: [] };
    case 'comparatif':  return { ...base, surtitre: '', titre: '', colonnes: ['Nous', 'Les autres'], lignes: [] };
    case 'benefices':   return { ...base, surtitre: '', titre: '', items: [] };
    case 'details':     return { ...base, items: [] };
    case 'avis':        return { ...base, titre: 'Ce que disent nos clients', items: [] };
    case 'faq':         return { ...base, titre: 'Questions fréquentes' };
    case 'cta':         return { ...base, titre: '', texte: '', bouton: 'Acheter maintenant', lien: '' };
    default:            return base;
  }
}

const Sel = ({ value, onChange, options }: { value: any; onChange: (v: string) => void; options: [string, string][] }) => (
  <select value={value ?? ''} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#fff', color: '#1a1a1a', boxSizing: 'border-box', fontFamily: 'inherit' }}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

const Rng = ({ value, onChange, min, max, gauche, droite }: { value: number; onChange: (v: number) => void; min: number; max: number; gauche?: string; droite?: string }) => (
  <div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}><span>{gauche ?? min}</span><strong style={{ color: '#333' }}>{value}</strong><span>{droite ?? max}</span></div>
  </div>
);

// Liste d'éléments (ajouter, supprimer, monter, descendre)
function Liste({ items, max, onChange, nouveau, nom, ajout, rendu }: { items: any; max: number; onChange: (l: any[]) => void; nouveau: () => any; nom: string; ajout: string; rendu: (it: any, maj: (p: any) => void, i: number) => any }) {
  const l: any[] = Array.isArray(items) ? items : [];
  const bt: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 11, padding: '3px 8px', color: '#555' };
  const deplacer = (i: number, d: number) => { const a = [...l]; const j = i + d; if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; onChange(a); };
  return (
    <div>
      {l.map((it, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>{nom} {i + 1}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ ...bt, opacity: i === 0 ? 0.4 : 1 }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === l.length - 1} style={{ ...bt, opacity: i === l.length - 1 ? 0.4 : 1 }}>▼</button>
              <button onClick={() => onChange(l.filter((_, k) => k !== i))} style={{ ...bt, background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>🗑️</button>
            </div>
          </div>
          {rendu(it, (p: any) => { const a = [...l]; a[i] = { ...a[i], ...p }; onChange(a); }, i)}
        </div>
      ))}
      {l.length < max && (
        <button onClick={() => onChange([...l, nouveau()])} style={{ width: '100%', padding: '10px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{ajout}</button>
      )}
    </div>
  );
}

// Éditeur du contenu d'un bloc selon son type
function EditeurBloc({ b, maj }: { b: any; maj: (p: any) => void }) {
  const c = (cle: string, max: number) => ({ value: b[cle], onChange: (v: string) => maj({ [cle]: limB(v, max) }), max });
  const ci = (cle: string, max: number) => (it: any, m: (p: any) => void) => ({ value: it[cle], onChange: (v: string) => m({ [cle]: limB(v, max) }), max });
  const note = (t: string) => <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>{t}</p>;
  const FONDS: [string, string][] = [['auto', 'Automatique'], ['blanc', 'Fond de la page'], ['gris', 'Gris clair'], ['couleur', 'Couleur du site'], ['sombre', 'Sombre']];
  const selFond = (b.type !== 'hero' && b.type !== 'produit') ? <F label="Couleur de fond de ce bloc"><Sel value={b.fond || 'auto'} onChange={(v: string) => maj({ fond: v })} options={FONDS} /></F> : null;
  switch (b.type) {
    case 'produit': return <>{note("Les photos, les options (taille, couleur…), la quantité et le bouton panier viennent du produit choisi dans « Produit vendu ». Rien à régler ici : déplacez le bloc avec ▲▼ pour changer sa place.")}</>;
    case 'hero': return (
      <>
        <F label="Présentation"><Sel value={b.disposition || 'photo'} onChange={(v: string) => maj({ disposition: v })} options={[['photo', 'Texte + une photo'], ['collage', 'Texte + collage de photos (jusqu\'à 3)'], ['centre', 'Texte centré seul'], ['fond', 'Photo en fond + texte centré']]} /></F>
        <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} placeholder="Ex : Notre histoire" /></F>
        <F label="Titre" desc="Pour la première accroche, vide = le nom de votre produit."><Inp {...c('titre', 160)} /></F>
        <F label="Texte" desc="Optionnel."><Txt {...c('sousTitre', 400)} rows={3} /></F>
        <F label="Texte du bouton" desc="Vide = aucun bouton."><Inp {...c('bouton', 40)} placeholder="Acheter maintenant" /></F>
        <F label="Lien du bouton" desc="Vide = descend vers le produit à acheter. Sinon : https://… ou /page"><Inp {...c('lien', 600)} placeholder="https://..." /></F>
        {(b.disposition === 'photo' || b.disposition === 'fond' || !b.disposition) && <F label="Photo (URL)" desc="Pour la première accroche, vide = la photo principale du produit."><Inp {...c('photo', 600)} placeholder="https://..." /></F>}
        {b.disposition === 'collage' && [0, 1, 2].map(i => (
          <F key={i} label={`Photo ${i + 1} du collage (URL)`}><Inp value={(b.photos || [])[i] || ''} max={600} placeholder="https://..." onChange={(v: string) => { const a = [...(b.photos || ['', '', ''])]; while (a.length < 3) a.push(''); a[i] = limB(v, 600); maj({ photos: a }); }} /></F>
        ))}
        <Toggle label="Afficher le prix et la note" desc="Prix du produit, prix barré et note moyenne sous le texte." checked={!!b.afficherPrix} onChange={(x: boolean) => maj({ afficherPrix: x })} />
      </>
    );
    case 'confiance': return (
      <>
        {selFond}
        {note("Vos vrais engagements. Tant qu'il n'y en a aucun, le bandeau n'apparaît pas sur votre site.")}
        <Liste items={b.items} max={6} nom="Engagement" ajout="+ Ajouter un engagement" nouveau={() => ({ ico: '✅', titre: '', desc: '' })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<div style={{ display: 'flex', gap: 8 }}><div style={{ width: 60 }}><Inp {...ci('ico', 8)(it, m)} placeholder="🚚" /></div><Inp {...ci('titre', 60)(it, m)} placeholder="Titre" /><Inp {...ci('desc', 120)(it, m)} placeholder="Détail" /></div>)} />
      </>
    );
    case 'video': {
      const typeV = analyserVideoCfg(b.url);
      return (
        <>
          {selFond}
          <F label="Lien de la vidéo" desc="Collez le lien de votre vidéo YouTube ou Vimeo.">
            <Inp {...c('url', 300)} placeholder="https://www.youtube.com/watch?v=..." />
            {b.url ? <p style={{ fontSize: 12, margin: '6px 0 0', color: typeV ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{typeV ? `✓ Lien ${typeV === 'youtube' ? 'YouTube' : 'Vimeo'} reconnu` : '⚠ Lien non reconnu : seuls YouTube et Vimeo sont acceptés. Tant que le lien est invalide, le bloc n\'apparaît pas.'}</p> : null}
          </F>
          <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} /></F>
          <F label="Titre" desc="Optionnel."><Inp {...c('titre', 140)} /></F>
          <F label="Texte sous le titre" desc="Optionnel."><Txt {...c('texte', 400)} rows={2} /></F>
        </>
      );
    }
    case 'defilant': return (
      <>
        {selFond}
        <div style={{ background: b.fond === 'sombre' ? '#111827' : '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 10px', marginBottom: 14, overflow: 'hidden', whiteSpace: 'nowrap' }} aria-label="Aperçu du style">
          {(() => {
            const col = (typeof b.couleurTexte === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(b.couleurTexte)) ? b.couleurTexte : CP;
            const st: any = { fontFamily: POLICES_DEFIL_CSS[b.police] || POLICES_DEFIL_CSS.sans, fontSize: 28, fontWeight: b.gras !== false ? 900 : 400, fontStyle: b.italique ? 'italic' : 'normal', textTransform: b.majuscules !== false ? 'uppercase' : 'none', letterSpacing: `${(b.espacement ?? 2) / 20}em`,
              ...(b.style === 'contour' ? { color: 'transparent', WebkitTextStroke: `1px ${col}` } : b.style === 'degrade' ? { backgroundImage: `linear-gradient(90deg, ${col}, ${b.couleur2 || '#8b5cf6'})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' } : { color: col }) };
            return <span style={st}>{b.texte || 'Votre phrase'} {b.separateur || '✦'} {b.texte || 'Votre phrase'}</span>;
          })()}
        </div>
        <F label="Phrase" desc="Elle se répète automatiquement."><Inp {...c('texte', 200)} placeholder="Ex : Fait main • Livraison rapide" /></F>
        <F label="Vitesse"><Rng value={b.vitesse ?? 5} min={1} max={10} gauche="Lent" droite="Rapide" onChange={(v: number) => maj({ vitesse: v })} /></F>
        <F label="Direction"><Sel value={b.direction || 'gauche'} onChange={(v: string) => maj({ direction: v })} options={[['gauche', '← Vers la gauche'], ['droite', '→ Vers la droite']]} /></F>
        <F label="Police"><Sel value={b.police || 'sans'} onChange={(v: string) => maj({ police: v })} options={POLICES_DEFIL_LABELS} /></F>
        <F label="Taille du texte (ordinateur)"><Rng value={b.taille ?? 56} min={16} max={140} onChange={(v: number) => maj({ taille: v })} /></F>
        <F label="Effet du texte"><Sel value={b.style || 'plein'} onChange={(v: string) => maj({ style: v })} options={[['plein', 'Plein (couleur unie)'], ['contour', 'Contour (lettres creuses)'], ['degrade', 'Dégradé de deux couleurs']]} /></F>
        <Couleur label="Couleur du texte (vide = couleur du site)" value={b.couleurTexte} onChange={(v: string) => maj({ couleurTexte: limB(v, 9) })} />
        {b.style === 'degrade' && <Couleur label="Deuxième couleur du dégradé" value={b.couleur2} onChange={(v: string) => maj({ couleur2: limB(v, 9) })} />}
        <F label="Séparateur entre les phrases"><Inp {...c('separateur', 6)} placeholder="✦" /></F>
        <F label="Espacement des lettres"><Rng value={b.espacement ?? 2} min={0} max={20} onChange={(v: number) => maj({ espacement: v })} /></F>
        <Toggle label="Texte en gras" checked={b.gras !== false} onChange={(x: boolean) => maj({ gras: x })} />
        <Toggle label="Texte en italique" checked={!!b.italique} onChange={(x: boolean) => maj({ italique: x })} />
        <Toggle label="Tout en majuscules" checked={b.majuscules !== false} onChange={(x: boolean) => maj({ majuscules: x })} />
        <Toggle label="Bandeau légèrement incliné" checked={!!b.incline} onChange={(x: boolean) => maj({ incline: x })} />
        <Toggle label="Pause quand la souris passe dessus" checked={b.pauseSurvol !== false} onChange={(x: boolean) => maj({ pauseSurvol: x })} />
        {note("Pour les visiteurs qui ont désactivé les animations sur leur appareil, la phrase reste fixe.")}
      </>
    );
    case 'citation': return (
      <>
        {selFond}
        <F label="Citation"><Txt {...c('texte', 400)} rows={3} /></F>
        <F label="Auteur" desc="Optionnel."><Inp {...c('auteur', 80)} /></F>
        <F label="Fonction" desc="Optionnel."><Inp {...c('role', 80)} /></F>
        <F label="Police"><Sel value={b.police || 'serif'} onChange={(v: string) => maj({ police: v })} options={POLICES_DEFIL_LABELS} /></F>
        <F label="Taille du texte (ordinateur)"><Rng value={b.taille ?? 34} min={18} max={64} onChange={(v: number) => maj({ taille: v })} /></F>
      </>
    );
    case 'piliers': return (
      <>
        {selFond}
        <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} /></F>
        <F label="Titre" desc="Optionnel."><Inp {...c('titre', 140)} /></F>
        <F label="Cartes par ligne (ordinateur)"><Sel value={String(b.colonnes ?? 3)} onChange={(v: string) => maj({ colonnes: Number(v) })} options={[['2', '2'], ['3', '3'], ['4', '4']]} /></F>
        {note("Chaque carte : une photo, un titre et un « + » qui affiche le texte. Une carte vide n'apparaît pas.")}
        <Liste items={b.items} max={8} nom="Carte" ajout="+ Ajouter une carte" nouveau={() => ({ titre: '', texte: '', photo: '' })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<><F label="Titre"><Inp {...ci('titre', 80)(it, m)} /></F><F label="Texte (affiché au clic sur +)"><Txt {...ci('texte', 500)(it, m)} rows={3} /></F><F label="Photo (URL)" desc="Optionnel."><Inp {...ci('photo', 600)(it, m)} placeholder="https://..." /></F></>)} />
      </>
    );
    case 'chronologie': return (
      <>
        {selFond}
        <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} /></F>
        <F label="Titre" desc="Optionnel."><Inp {...c('titre', 140)} /></F>
        <Liste items={b.items} max={12} nom="Date" ajout="+ Ajouter une date" nouveau={() => ({ annee: '', titre: '', texte: '', photo: '' })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<><F label="Année ou date"><Inp {...ci('annee', 12)(it, m)} placeholder="2021" /></F><F label="Titre"><Inp {...ci('titre', 80)(it, m)} /></F><F label="Texte"><Txt {...ci('texte', 500)(it, m)} rows={3} /></F><F label="Photo (URL)" desc="Optionnel."><Inp {...ci('photo', 600)(it, m)} placeholder="https://..." /></F></>)} />
      </>
    );
    case 'comparatif': {
      const cols: string[] = Array.isArray(b.colonnes) && b.colonnes.length >= 2 ? b.colonnes : ['Nous', 'Les autres'];
      const lignes: any[] = Array.isArray(b.lignes) ? b.lignes : [];
      const majCols = (nc: string[], nl: any[]) => maj({ colonnes: nc, lignes: nl.map(l => ({ ...l, valeurs: nc.map((_, i) => Array.isArray(l.valeurs) ? l.valeurs[i] === true : false) })) });
      return (
        <>
          {selFond}
          <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} /></F>
          <F label="Titre" desc="Optionnel."><Inp {...c('titre', 140)} /></F>
          <F label="Colonnes" desc="La première colonne (votre produit) est mise en avant.">
            {cols.map((nom, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <Inp value={nom} max={40} onChange={(v: string) => { const a = [...cols]; a[i] = limB(v, 40); majCols(a, lignes); }} placeholder={i === 0 ? 'Nous' : 'Autre'} />
                {cols.length > 2 && i > 0 && <button onClick={() => majCols(cols.filter((_, k) => k !== i), lignes.map(l => ({ ...l, valeurs: (l.valeurs || []).filter((_: any, k: number) => k !== i) })))} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>}
              </div>
            ))}
            {cols.length < 4 && <button onClick={() => majCols([...cols, ''], lignes)} style={{ padding: '6px 12px', border: `1px dashed ${CP}60`, borderRadius: 7, background: 'transparent', color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une colonne</button>}
          </F>
          <F label="Lignes du tableau" desc="Cochez ✓ quand le critère s'applique à la colonne.">
            <Liste items={lignes} max={12} nom="Critère" ajout="+ Ajouter une ligne" nouveau={() => ({ critere: '', valeurs: cols.map(() => false) })} onChange={(l: any[]) => maj({ lignes: l })}
              rendu={(it: any, m: any) => (
                <>
                  <F label="Critère"><Inp {...ci('critere', 100)(it, m)} /></F>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {cols.map((nom, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#333', cursor: 'pointer' }}>
                        <input type="checkbox" checked={Array.isArray(it.valeurs) && it.valeurs[i] === true} onChange={e => { const v = cols.map((_, k) => Array.isArray(it.valeurs) ? it.valeurs[k] === true : false); v[i] = e.target.checked; m({ valeurs: v }); }} />
                        {nom || `Colonne ${i + 1}`}
                      </label>
                    ))}
                  </div>
                </>
              )} />
          </F>
        </>
      );
    }
    case 'benefices': return (
      <>
        {selFond}
        <F label="Petit texte au-dessus du titre" desc="Optionnel."><Inp {...c('surtitre', 80)} /></F>
        <F label="Titre"><Inp {...c('titre', 140)} /></F>
        <Liste items={b.items} max={6} nom="Bénéfice" ajout="+ Ajouter un bénéfice" nouveau={() => ({ ico: '✨', titre: '', desc: '' })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<><div style={{ display: 'flex', gap: 8, marginBottom: 8 }}><div style={{ width: 70 }}><Inp {...ci('ico', 8)(it, m)} placeholder="✨" /></div><Inp {...ci('titre', 80)(it, m)} placeholder="Titre" /></div><Txt {...ci('desc', 300)(it, m)} rows={2} placeholder="Description" /></>)} />
      </>
    );
    case 'details': return (
      <>
        {selFond}
        {note("Sections texte + photo qui s'alternent : fabrication, utilisation, matériaux, histoire…")}
        <Liste items={b.items} max={6} nom="Détail" ajout="+ Ajouter un détail" nouveau={() => ({ titre: '', texte: '', photo: '' })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<><F label="Titre"><Inp {...ci('titre', 120)(it, m)} /></F><F label="Texte"><Txt {...ci('texte', 1200)(it, m)} rows={4} /></F><F label="Photo (URL)" desc="Optionnel."><Inp {...ci('photo', 600)(it, m)} placeholder="https://..." /></F></>)} />
      </>
    );
    case 'avis': return (
      <>
        {selFond}
        <F label="Titre"><Inp {...c('titre', 140)} /></F>
        {note("Écrivez de vrais commentaires de vos clients. Tant qu'il n'y en a aucun, la section n'apparaît pas.")}
        <Liste items={b.items} max={6} nom="Témoignage" ajout="+ Ajouter un témoignage" nouveau={() => ({ texte: '', auteur: '', note: 5 })} onChange={(l: any[]) => maj({ items: l })}
          rendu={(it: any, m: any) => (<><F label="Commentaire"><Txt {...ci('texte', 600)(it, m)} rows={3} /></F><F label="Nom du client"><Inp {...ci('auteur', 60)(it, m)} /></F><F label="Note (1 à 5)"><Inp type="number" value={String(it.note ?? 5)} onChange={(v: string) => m({ note: Math.max(1, Math.min(5, parseInt(v, 10) || 5)) })} /></F></>)} />
      </>
    );
    case 'faq': return (
      <>
        {selFond}
        <F label="Titre de la section"><Inp {...c('titre', 140)} /></F>
        {note("Les questions et les réponses s'écrivent dans l'onglet « FAQ » de cette page. Tant qu'il n'y en a aucune, la section n'apparaît pas.")}
      </>
    );
    case 'cta': return (
      <>
        {selFond}
        <F label="Titre" desc="Vide = le nom de votre produit."><Inp {...c('titre', 160)} /></F>
        <F label="Texte" desc="Optionnel."><Txt {...c('texte', 300)} rows={2} /></F>
        <F label="Texte du bouton" desc="Vide = aucun bouton."><Inp {...c('bouton', 40)} placeholder="Acheter maintenant" /></F>
        <F label="Lien du bouton" desc="Vide = descend vers le produit à acheter. Sinon : https://… ou /page"><Inp {...c('lien', 600)} placeholder="https://..." /></F>
      </>
    );
    default: return null;
  }
}

// Gestionnaire de blocs : activer/désactiver, réordonner (▲▼), modifier, supprimer, ajouter
function BlocsManager({ blocs, onChange }: { blocs: any[]; onChange: (l: any[]) => void }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const l = [...blocs].sort((a, b) => a.ordre - b.ordre);
  const emettre = (a: any[]) => onChange(a.map((b, i) => ({ ...b, ordre: i * 10 })));
  const deplacer = (i: number, d: number) => { const a = [...l]; const j = i + d; if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; emettre(a); };
  const maj = (id: string, patch: any) => emettre(l.map(b => b.id === id ? { ...b, ...patch } : b));
  const present = (t: string) => l.some(b => b.type === t);
  const bt = (off: boolean): React.CSSProperties => ({ width: 26, height: 22, border: '1px solid #ddd', borderRadius: 4, background: off ? '#f5f5f5' : '#fff', cursor: off ? 'default' : 'pointer', fontSize: 10, color: off ? '#ccc' : '#555' });
  return (
    <div>
      <div style={{ background: `${CP}10`, border: `1px solid ${CP}30`, borderRadius: 8, padding: 10, fontSize: 12, color: '#333', marginBottom: 12, lineHeight: 1.6 }}>
        <strong>Blocs de la page</strong> — Réordonnez avec ▲▼, cachez avec l'interrupteur, cliquez sur ✎ pour modifier le contenu. Un bloc sans contenu n'apparaît pas sur votre site.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {l.map((b, i) => {
          const info = INFO_BLOC[b.type] || { label: b.type, icone: '▫️', desc: '' };
          const est = ouvert === b.id;
          const oblig = b.type === 'produit';
          const resume = (b.titre || b.texte || b.url || '').toString().slice(0, 38);
          return (
            <div key={b.id} style={{ border: `2px solid ${b.actif ? CP : '#e5e7eb'}`, borderRadius: 10, background: b.actif ? `${CP}06` : '#fafafa', opacity: b.actif ? 1 : 0.75 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{info.icone}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: b.actif ? '#1a1a1a' : '#999' }}>{info.label}</div>
                  {resume && <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume}</div>}
                </div>
                {oblig
                  ? <span style={{ fontSize: 10, color: '#666', background: '#eef2ff', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>Obligatoire</span>
                  : <button onClick={() => maj(b.id, { actif: !b.actif })} aria-label={b.actif ? 'Cacher ce bloc' : 'Afficher ce bloc'} style={{ width: 40, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: b.actif ? CP : '#d1d5db', position: 'relative', flexShrink: 0 }}><div style={{ position: 'absolute', top: 2, left: b.actif ? 22 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} /></button>}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  <button onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter" style={bt(i === 0)}>▲</button>
                  <button onClick={() => deplacer(i, 1)} disabled={i === l.length - 1} aria-label="Descendre" style={bt(i === l.length - 1)}>▼</button>
                </div>
                <button onClick={() => setOuvert(est ? null : b.id)} aria-label="Modifier" style={{ ...bt(false), width: 30, color: CP, borderColor: `${CP}60` }}>{est ? '✕' : '✎'}</button>
                {!oblig && (aSupprimer === b.id
                  ? <button onClick={() => { setASupprimer(null); if (ouvert === b.id) setOuvert(null); emettre(l.filter(x => x.id !== b.id)); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Supprimer ?</button>
                  : <button onClick={() => { setASupprimer(b.id); setTimeout(() => setASupprimer(x => x === b.id ? null : x), 3500); }} aria-label="Supprimer ce bloc" style={{ ...bt(false), color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>🗑️</button>)}
              </div>
              {est && <div style={{ padding: '4px 14px 14px', borderTop: '1px solid #e5e7eb', background: '#fff', borderRadius: '0 0 8px 8px' }}><p style={{ fontSize: 12, color: '#888', margin: '10px 0 12px', lineHeight: 1.6 }}>{info.desc}</p><EditeurBloc b={b} maj={(p: any) => maj(b.id, p)} /></div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setAjoutOuvert(o => !o)} style={{ width: '100%', padding: '11px', border: `2px dashed ${CP}60`, borderRadius: 8, background: `${CP}06`, color: CP, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{ajoutOuvert ? '✕ Fermer' : '+ Ajouter un bloc'}</button>
        {ajoutOuvert && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8, marginTop: 10 }}>
            {ORDRE_TYPES_AJOUT.map(t => { const info = INFO_BLOC[t]; const deja = info.unique && present(t); return (
              <button key={t} disabled={deja} onClick={() => { const nb = nouveauBloc(t); const a = [...l, nb]; emettre(a); setOuvert(nb.id); setAjoutOuvert(false); }}
                style={{ textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, background: deja ? '#f9fafb' : '#fff', cursor: deja ? 'default' : 'pointer', opacity: deja ? 0.5 : 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{info.icone} {info.label}</div>
                <div style={{ fontSize: 11, color: '#777', marginTop: 4, lineHeight: 1.4 }}>{deja ? 'Déjà sur la page' : info.desc}</div>
              </button>
            ); })}
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, padding: '6px 10px', background: '#f5f5f5', borderRadius: 6, fontSize: 11, color: '#666' }}>
        <strong>{l.filter(b => b.actif).length}</strong> bloc(s) affiché(s) sur {l.length}
      </div>
    </div>
  );
}

export default function ConfigMesPagesSimple({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigSimple>(CONFIG_DEFAUT_SIMPLE);
  const [page, setPage] = useState<PageOnglet>('accueil');
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
        if (data?.config?.simple) {
          const sv = data.config.simple;
          setConfig(prev => ({ ...prev, ...sv, inscription: fusionInscription(sv.inscription), aPropos: { ...CONFIG_DEFAUT.aPropos, ...(sv.aPropos || {}) }, menu: { ...CONFIG_DEFAUT.menu, ...(sv.menu || {}) }, vente: { ...VENTE_DEFAUT, ...(sv.vente || {}) }, accueil: { ...CONFIG_DEFAUT.accueil, ...(sv.accueil || {}), banniere: { ...CONFIG_DEFAUT.accueil.banniere, ...((sv.accueil || {}).banniere || {}) } } }));
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
        body: JSON.stringify({ config: { simple: config }, template_id: 'boutique-simple' }),
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
    { id: 'accueil',   label: 'Page de vente', icone: '🏠' },
    { id: 'faq',       label: 'FAQ',       icone: '❓' },
    { id: 'a-propos',  label: 'À propos',  icone: '💡' },
    { id: 'blog',      label: 'Blog',      icone: '📝' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
    { id: 'fiche-produit', label: 'Zone d\'achat', icone: '🛍' },
    { id: 'inscription', label: 'Compte', icone: '👤' },
    { id: 'footer',    label: 'Footer',    icone: '📋' },
  ];

  // ── Panneau de config selon la page sélectionnée ──────────────────────────
  const renderConfig = () => {
    switch (page) {

      case 'accueil': {
        const blocsEdit: any[] = Array.isArray(config.blocs) ? config.blocs : blocsDefautCfg(config.vente, config.accueil);
        return (
        <>
          <S titre="Blocs de la page de vente">
            <BlocsManager blocs={blocsEdit} onChange={(l: any[]) => setConfig(c => ({ ...c, blocs: l }))} />
          </S>
          <S titre="Menu du haut">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Renommez les liens du menu ou cachez les pages dont vous n'avez pas besoin. Vide = nom par défaut.</p>
            {([['accueil', 'Accueil', false], ['blog', 'Blog', true], ['a-propos', 'À propos', true], ['contact', 'Contact', true]] as [string, string, boolean][]).map(([id, defaut, masquable]) => {
              const masque = (config.menu.masques || []).includes(id);
              return (
                <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, opacity: masque ? 0.5 : 1 }}>
                  <div style={{ flex: 1 }}><Inp value={config.menu[id] || ''} onChange={(v: string) => setMenu({ [id]: v })} placeholder={defaut} /></div>
                  {masquable && <button onClick={() => setMenu({ masques: masque ? config.menu.masques.filter((x: string) => x !== id) : [...(config.menu.masques || []), id] })} style={{ background: masque ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: masque ? '#dc2626' : '#16a34a', cursor: 'pointer', minWidth: 78 }}>{masque ? 'Caché' : 'Affiché'}</button>}
                </div>
              );
            })}
          </S>
          <S titre="Couleurs globales du site">
            <Couleur label="Couleur primaire" value={config.accueil.couleurPrimaire} onChange={(v: string) => setAcc({ couleurPrimaire: v })} />
            <Couleur label="Couleur secondaire" value={config.accueil.couleurSecondaire} onChange={(v: string) => setAcc({ couleurSecondaire: v })} />
            <Couleur label="Fond de page" value={config.accueil.couleurFondPage} onChange={(v: string) => setAcc({ couleurFondPage: v })} />
            <Couleur label="Texte principal" value={config.accueil.couleurTexte} onChange={(v: string) => setAcc({ couleurTexte: v })} />
          </S>
          <S titre="Bannière promotionnelle">
            <EditorBanniere banniere={config.accueil.banniere} onChange={b => setAcc({ banniere: b })} />
          </S>
        </>
        );
      }

      case 'faq': return (
        <>
          <S titre="Questions fréquentes (sur la page de vente)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Le titre de la section, sa couleur de fond, son emplacement et sa visibilité se règlent dans l'onglet « Page de vente » (bloc « Questions fréquentes »).</p>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Tant qu'il n'y a aucune question, la section n'apparaît pas sur votre site.</p>
            {config.faq.items.map((item, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>Question {i + 1}</span>
                  <button onClick={() => { const a = [...config.faq.items]; a.splice(i, 1); setFaq({ items: a }); }}
                    style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
                </div>
                <F label="Question"><Inp max={200} value={item.question} onChange={(v: string) => { const a = [...config.faq.items]; a[i] = { ...a[i], question: limB(v, 200) }; setFaq({ items: a }); }} /></F>
                <F label="Réponse"><Txt max={2000} value={item.reponse} onChange={(v: string) => { const a = [...config.faq.items]; a[i] = { ...a[i], reponse: limB(v, 2000) }; setFaq({ items: a }); }} rows={3} /></F>
              </div>
            ))}
            <button onClick={() => setFaq({ items: [...config.faq.items, { question: '', reponse: '' }] })}
              style={{ width: '100%', padding: '10px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#1e3a8a,${CP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛍</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Config — Mono-produit</h1>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Personnalisez la page de vente de votre produit</p>
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