// src/pages/gestionnaire/ConfigMesPagesSimplisse.tsx
// e-Vend Studio — Configuration des pages du template Simplisse
// Pattern identique à ConfigTemplateFoodTruck : panneau gauche + aperçu droit
// 100% mobile responsive

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
    colonnes: { titre1:'Boutique', liens1:'Accueil\nCatalogue\nBlog\nContact', titre2:'Aide', liens2:'FAQ\nRetours\nLivraison\nContactez-nous', titre3:'Légal', liens3:'' },
    politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true },
  },
  ficheProduit: { ...FICHE_PRODUIT_DEFAUT },
};

// ─── Composants utilitaires (même style que FoodTruck) ───────────────────────

const Inp = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value ?? ''} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={e => (e.target.style.borderColor = CP)}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Txt = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value ?? ''} placeholder={placeholder} rows={rows}
    onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: 5, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={e => (e.target.style.borderColor = CP)}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const F = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 11 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>{label}</label>
    {desc && <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4, margin: '0 0 4px' }}>{desc}</p>}
    {children}
  </div>
);

const S = ({ titre, children }: any) => (
  <div style={{ marginBottom: 18 }}>
    <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aaa', marginBottom: 9, paddingBottom: 5, borderBottom: '1px solid #f0f0f0', margin: '0 0 9px' }}>
      {titre}
    </h3>
    {children}
  </div>
);

const Couleur = ({ label, value, onChange }: any) => (
  <F label={label}>
    <div style={{ display: 'flex', gap: 6 }}>
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        style={{ width: 34, height: 30, padding: 2, border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer', flexShrink: 0 }} />
      <Inp value={value} onChange={onChange} />
    </div>
  </F>
);

const Toggle = ({ label, checked, onChange, desc }: any) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
      {desc && <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{desc}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: checked ? CP : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
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

// ─── Aperçu visuel mini ────────────────────────────────────────────────────────

function ApercuMini({ config, pageCourante }: { config: ConfigSimplisse; pageCourante: string }) {
  const acc = config.accueil;
  const foot = config.footer;

  const sectionsTriees = [...(pageCourante === 'accueil' ? acc.sections : config.catalogue.sections)]
    .sort((a, b) => a.ordre - b.ordre)
    .filter(s => s.actif);

  const hero = pageCourante === 'accueil' ? acc.hero
    : pageCourante === 'catalogue' ? config.catalogue.hero
    : pageCourante === 'faq' ? config.faq.hero
    : pageCourante === 'blog' ? config.blog.hero
    : config.contact.hero;

  const banniere = pageCourante === 'accueil' ? acc.banniere
    : pageCourante === 'catalogue' ? { actif: false } as any
    : pageCourante === 'faq' ? config.faq.banniere
    : pageCourante === 'blog' ? config.blog.banniere
    : config.contact.banniere;

  const mini: React.CSSProperties = { fontSize: 9, padding: '3px 7px', borderRadius: 4, textAlign: 'center' };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>

      {/* Nav mini */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: acc.couleurPrimaire }}>{foot.nomBoutique || 'Ma Boutique'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Accueil','Catalogue','Blog','FAQ','Contact'].map(p => (
            <span key={p} style={{ fontSize: 8, color: '#888' }}>{p}</span>
          ))}
        </div>
        <span style={{ fontSize: 9, background: acc.couleurPrimaire, color: '#fff', borderRadius: 4, padding: '2px 6px' }}>🛒 0</span>
      </div>

      {/* Bannière */}
      {banniere?.actif && (
        <div style={{ background: banniere.couleurFond, color: banniere.couleurTexte, fontSize: 9, padding: '4px 10px', textAlign: 'center' }}>
          {banniere.texte || 'Bannière promo'}
        </div>
      )}

      {/* Sections selon la page */}
      {pageCourante === 'accueil' && (
        <>
          {sectionsTriees.map(sec => {
            if (sec.id === 'hero') return (
              <div key={sec.id} style={{ background: hero.couleurFond, padding: '14px 10px', textAlign: hero.style === 'gauche' ? 'left' : 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: hero.couleurTitre || '#1a1a1a', marginBottom: 3 }}>{hero.titre || 'Titre hero'}</div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 6 }}>{hero.sousTitre || 'Sous-titre'}</div>
                <span style={{ background: hero.couleurBouton || CP, color: '#fff', ...mini }}>{hero.boutonLabel || 'Voir catalogue'}</span>
              </div>
            );
            if (sec.id === 'avantages') return (
              <div key={sec.id} style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 8px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                {['🚚 Livraison','🔒 Sécurisé','🔄 Retours'].map(t => <span key={t} style={{ fontSize: 8, color: '#555' }}>{t}</span>)}
              </div>
            );
            if (sec.id === 'vedette') return (
              <div key={sec.id} style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>⭐ Produits en vedette</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                  {['👟','🎒','🧴','🎁'].map(e => (
                    <div key={e} style={{ background: '#f3f4f6', borderRadius: 4, padding: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>{e}</div>
                      <div style={{ fontSize: 7, color: '#555', marginTop: 2 }}>49$</div>
                    </div>
                  ))}
                </div>
              </div>
            );
            if (sec.id === 'categories') return (
              <div key={sec.id} style={{ padding: '6px 10px', background: '#f8fafc' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🗂 Catégories</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['Mode','Maison','Sport','Tech'].map(c => (
                    <span key={c} style={{ fontSize: 8, background: `${acc.couleurPrimaire}15`, color: acc.couleurPrimaire, borderRadius: 4, padding: '2px 6px' }}>{c}</span>
                  ))}
                </div>
              </div>
            );
            if (sec.id === 'temoignages') return (
              <div key={sec.id} style={{ padding: '6px 10px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>💬 Témoignages</div>
                <div style={{ fontSize: 8, color: '#555', fontStyle: 'italic' }}>"Excellent service, livraison rapide!" — Marie L.</div>
              </div>
            );
            if (sec.id === 'newsletter') return (
              <div key={sec.id} style={{ padding: '6px 10px', background: `${acc.couleurPrimaire}10`, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 3 }}>📧 Restez informé</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ flex: 1, height: 16, background: '#fff', borderRadius: 3, border: '1px solid #ddd' }} />
                  <div style={{ height: 16, padding: '0 6px', background: acc.couleurPrimaire, borderRadius: 3, display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 7, color: '#fff' }}>S'inscrire</span>
                  </div>
                </div>
              </div>
            );
            return null;
          })}
        </>
      )}

      {pageCourante === 'catalogue' && (
        <>
          <div style={{ background: '#f8fafc', padding: '6px 10px', display: 'flex', gap: 4, alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ flex: 1, height: 16, background: '#fff', borderRadius: 3, border: '1px solid #ddd', display: 'flex', alignItems: 'center', paddingLeft: 5 }}>
              <span style={{ fontSize: 7, color: '#aaa' }}>🔍 Rechercher...</span>
            </div>
            <span style={{ fontSize: 8, background: '#e5e7eb', borderRadius: 4, padding: '2px 5px', color: '#555' }}>Filtres</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.catalogue.colonnes}, 1fr)`, gap: 5, padding: '8px 10px' }}>
            {[...Array(config.catalogue.colonnes * 2)].map((_, i) => (
              <div key={i} style={{ background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: 40, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'📦'}</div>
                <div style={{ padding: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>Produit {i + 1}</div>
                  {config.catalogue.afficherPrix && <div style={{ fontSize: 8, color: acc.couleurPrimaire, fontWeight: 700 }}>29,99$</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pageCourante === 'faq' && (
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{config.faq.titre}</div>
          {config.faq.items.slice(0, 3).map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: '5px 0' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>Q: {item.question}</div>
              <div style={{ fontSize: 8, color: '#888' }}>A: {item.reponse.substring(0, 50)}…</div>
            </div>
          ))}
        </div>
      )}

      {pageCourante === 'blog' && (
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{config.blog.titre}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.blog.colonnes, 2)},1fr)`, gap: 5 }}>
            {[...Array(Math.min(config.blog.colonnes, 4))].map((_, i) => (
              <div key={i} style={{ background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: 30, background: '#e5e7eb' }} />
                <div style={{ padding: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#1a1a1a' }}>Article {i + 1}</div>
                  {config.blog.afficherDate && <div style={{ fontSize: 7, color: '#aaa' }}>15 juin 2025</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pageCourante === 'contact' && (
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{config.contact.titre}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              {config.contact.adresse && <div style={{ fontSize: 8, color: '#555', marginBottom: 3 }}>📍 {config.contact.adresse}</div>}
              {config.contact.courriel && <div style={{ fontSize: 8, color: '#555', marginBottom: 3 }}>✉️ {config.contact.courriel}</div>}
              {config.contact.telephone && <div style={{ fontSize: 8, color: '#555' }}>📞 {config.contact.telephone}</div>}
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 5, padding: 5 }}>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 20, background: '#e5e7eb', borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 12, background: acc.couleurPrimaire, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 7, color: '#fff' }}>Envoyer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {pageCourante === 'footer' && (
        <div style={{ background: foot.couleurFond, padding: '10px', color: foot.couleurTexte }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
            {[
              { titre: foot.colonnes.titre1, liens: foot.colonnes.liens1 },
              { titre: foot.colonnes.titre2, liens: foot.colonnes.liens2 },
              { titre: foot.colonnes.titre3, liens: foot.colonnes.liens3 },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>{col.titre}</div>
                {col.liens.split('\n').filter(Boolean).map((l, j) => (
                  <div key={j} style={{ fontSize: 7, opacity: 0.6, marginBottom: 2 }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${foot.couleurTexte}30`, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {foot.politiques.afficherConditions && <span style={{ fontSize: 7, opacity: 0.5 }}>Conditions</span>}
              {foot.politiques.afficherConfidentialite && <span style={{ fontSize: 7, opacity: 0.5 }}>Confidentialité</span>}
              {foot.politiques.afficherRetours && <span style={{ fontSize: 7, opacity: 0.5 }}>Retours</span>}
            </div>
            {foot.afficherPropulse && (
              <span style={{ fontSize: 7, opacity: 0.4 }}>Propulsé par e-Vend Studio</span>
            )}
          </div>
        </div>
      )}

      {/* Footer mini toujours visible sauf si on édite le footer */}
      {pageCourante !== 'footer' && (
        <div style={{ background: foot.couleurFond, padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 7, color: foot.couleurTexte, opacity: 0.6 }}>© {foot.nomBoutique}</span>
          {foot.afficherPropulse && <span style={{ fontSize: 6, color: foot.couleurTexte, opacity: 0.4 }}>Propulsé par e-Vend Studio</span>}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

type PageOnglet = 'accueil' | 'catalogue' | 'faq' | 'blog' | 'contact' | 'fiche-produit' | 'footer';

interface Props {
  gestionnaireId: number;
}

export default function ConfigMesPagesSimplisse({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ConfigSimplisse>(CONFIG_DEFAUT);
  const [page, setPage] = useState<PageOnglet>('accueil');
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [modeApercu, setModeApercu] = useState<'desktop' | 'mobile'>('desktop');
  const [panneauOuvert, setPanneauOuvert] = useState(false); // mobile: toggle config/aperçu
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
        if (data?.config?.simplisse) {
          setConfig(prev => ({ ...prev, ...data.config.simplisse }));
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
        body: JSON.stringify({ config: { simplisse: config }, template_id: 'boutique-simplisse' }),
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
  const setFoot = useCallback((patch: Partial<ConfigFooter>)      => setConfig(c => ({ ...c, footer:   { ...c.footer,   ...patch } })), []);

  const PAGES: { id: PageOnglet; label: string; icone: string }[] = [
    { id: 'accueil',   label: 'Accueil',   icone: '🏠' },
    { id: 'catalogue', label: 'Catalogue', icone: '📦' },
    { id: 'faq',       label: 'FAQ',       icone: '❓' },
    { id: 'blog',      label: 'Blog',      icone: '📝' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
    { id: 'fiche-produit', label: 'Fiche produit', icone: '🛍' },
    { id: 'footer',    label: 'Footer',    icone: '📋' },
  ];

  // ── Panneau de config selon la page sélectionnée ──────────────────────────
  const renderConfig = () => {
    switch (page) {

      case 'accueil': return (
        <>
          <S titre="Couleurs globales du site">
            <Couleur label="Couleur primaire" value={config.accueil.couleurPrimaire} onChange={(v: string) => setAcc({ couleurPrimaire: v })} />
            <Couleur label="Couleur secondaire" value={config.accueil.couleurSecondaire} onChange={(v: string) => setAcc({ couleurSecondaire: v })} />
            <Couleur label="Fond de page" value={config.accueil.couleurFondPage} onChange={(v: string) => setAcc({ couleurFondPage: v })} />
            <Couleur label="Texte principal" value={config.accueil.couleurTexte} onChange={(v: string) => setAcc({ couleurTexte: v })} />
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
            <EditorBanniere banniere={config.faq.banniere} onChange={b => setFaq({ banniere: b })} />
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

      case 'blog': return (
        <>
          <S titre="En-tête">
            <F label="Titre de la page"><Inp value={config.blog.titre} onChange={(v: string) => setBlog({ titre: v })} /></F>
            <F label="Sous-titre"><Txt value={config.blog.sousTitre} onChange={(v: string) => setBlog({ sousTitre: v })} rows={2} /></F>
          </S>
          <S titre="Bannière">
            <EditorBanniere banniere={config.blog.banniere} onChange={b => setBlog({ banniere: b })} />
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
            <Toggle label="Conditions de service" checked={config.footer.politiques.afficherConditions} onChange={(v: boolean) => setFoot({ politiques: { ...config.footer.politiques, afficherConditions: v } })} />
            <Toggle label="Politique de confidentialité" checked={config.footer.politiques.afficherConfidentialite} onChange={(v: boolean) => setFoot({ politiques: { ...config.footer.politiques, afficherConfidentialite: v } })} />
            <Toggle label="Politique de retours" checked={config.footer.politiques.afficherRetours} onChange={(v: boolean) => setFoot({ politiques: { ...config.footer.politiques, afficherRetours: v } })} />
            <Toggle label="Politique de livraison" checked={config.footer.politiques.afficherLivraison} onChange={(v: boolean) => setFoot({ politiques: { ...config.footer.politiques, afficherLivraison: v } })} />
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

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter',sans-serif", background: '#f8f9fb' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,#1e3a8a,${CP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🛍</div>
        <div>
          <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Template Simplisse</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Configuration de mes pages</p>
        </div>

        {/* Onglets pages */}
        <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 8 }}>
          {PAGES.map(p => (
            <button key={p.id} onClick={() => setPage(p.id as PageOnglet)}
              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: page === p.id ? CP : '#f3f4f6', color: page === p.id ? '#fff' : '#555', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 4 }}>
              {p.icone} {p.label}
            </button>
          ))}
        </div>

        {/* Bouton toggle mobile */}
        {isMobile && (
          <button onClick={() => setPanneauOuvert(!panneauOuvert)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${CP}`, background: panneauOuvert ? CP : '#fff', color: panneauOuvert ? '#fff' : CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {panneauOuvert ? '👁 Aperçu' : '⚙️ Config'}
          </button>
        )}

        {/* Bouton sauvegarder */}
        <button onClick={handleSave} disabled={sauv === 'loading'}
          style={{ padding: '7px 18px', background: sauv === 'ok' ? '#16a34a' : sauv === 'err' ? '#dc2626' : CP, border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 13, cursor: sauv === 'loading' ? 'wait' : 'pointer', flexShrink: 0 }}>
          {sauv === 'loading' ? '⏳ Sauvegarde...' : sauv === 'ok' ? '✅ Sauvegardé !' : sauv === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
        </button>
      </div>

      {/* ── Corps : panneau gauche + aperçu droit ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

        {/* Panneau config (gauche) */}
        {(!isMobile || panneauOuvert) && (
          <div style={{ width: isMobile ? '100%' : 360, minWidth: isMobile ? 'auto' : 320, background: '#fff', borderRight: isMobile ? 'none' : '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {renderConfig()}
            </div>
          </div>
        )}

        {/* Aperçu (droite) */}
        {(!isMobile || !panneauOuvert) && (
          <div style={{ flex: 1, background: '#f0f2f5', overflow: 'auto', padding: 16 }}>

            {/* Contrôles aperçu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aperçu</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['desktop', 'mobile'] as const).map(m => (
                  <button key={m} onClick={() => setModeApercu(m)}
                    style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #e5e7eb', background: modeApercu === m ? '#1a1a1a' : '#fff', color: modeApercu === m ? '#fff' : '#555', fontSize: 11, cursor: 'pointer' }}>
                    {m === 'desktop' ? '🖥' : '📱'} {m}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 10, color: '#aaa' }}>— Page : <strong style={{ color: '#555' }}>{PAGES.find(p => p.id === page)?.label}</strong></span>
            </div>

            {/* Cadre aperçu */}
            <div style={{
              margin: '0 auto',
              maxWidth: modeApercu === 'mobile' ? 375 : '100%',
              transition: 'max-width .3s ease',
            }}>
              {/* Barre navigateur simulée */}
              <div style={{ background: '#e5e7eb', borderRadius: '8px 8px 0 0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ flex: 1, background: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: '#aaa', marginLeft: 4 }}>
                  {config.footer.nomBoutique?.toLowerCase().replace(/\s/g, '') || 'maboutique'}.e-vend.ca/{page === 'accueil' ? '' : page}
                </div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                <ApercuMini config={config} pageCourante={page} />
              </div>
            </div>

            {/* Note info */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 12 }}>
              L'aperçu est une représentation simplifiée. Le rendu final sera visible via <strong>Aperçu de mon site</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}