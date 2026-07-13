// src/pages/SitePreview.tsx
// e-Vend Studio — Aperçu du site du vendeur (rendu réel)
// Accessible via /site-preview?vendeurId=X
// Mode démo : /site-preview?forceTemplate=xxx&demo=true — 100% hardcodé, zéro API

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Page404Public                  from './Page404Public';
import CookieBanner                   from '../components/CookieBanner';
import VerificateurAge                from '../components/VerificateurAge';
import TemplateVitrine                from '../templates/TemplateVitrine';
import TemplateReservation            from '../templates/TemplateReservation';
import TemplateSpectacle              from '../templates/TemplateSpectacle';
import TemplateCagnottePro            from '../templates/TemplateCagnottePro';
import TemplateBoutiqueSimple         from '../templates/TemplateBoutiqueSimple';
import TemplateBoutiqueComplete       from '../templates/TemplateBoutiqueComplete';
import TemplateAgricole               from '../templates/TemplateAgricole';
import TemplateVitrineProSante        from '../templates/TemplateVitrineProSante';
import TemplateVitrineProMariage      from '../templates/TemplateVitrineProMariage';
import TemplateVitrineProBeaute       from '../templates/TemplateVitrineProBeaute';
import TemplateVitrineProTech         from '../templates/TemplateVitrineProTech';
import TemplateVitrineProEntrepreneur from '../templates/TemplateVitrineProEntrepreneur';
import TemplateEnchereFlash           from '../templates/TemplateEnchereFlash';
import TemplateEnchereGalerie         from '../templates/TemplateEnchereGalerie';
import TemplateEnchereLive            from '../templates/TemplateEnchereLive';
import TemplateSalon                  from '../templates/TemplateSalon';
import TemplatePaysager               from '../templates/TemplatePaysager';
import TemplateAvocat                 from '../templates/TemplateAvocat';
import TemplateResto                  from '../templates/TemplateResto';
import TemplateBistro                 from '../templates/TemplateBistro';
import TemplatePiano                  from '../templates/TemplatePiano';
import TemplateLangues                from '../templates/TemplateLangues';
import TemplateFormationWeb           from '../templates/TemplateFormationWeb';
import TemplateEcoleCuisine           from '../templates/TemplateEcoleCuisine';
import TemplateStudioYoga             from '../templates/TemplateStudioYoga';
import TemplateEquitation             from '../templates/TemplateEquitation';
import TemplateEcolePeinture          from '../templates/TemplateEcolePeinture';
import TemplateEcoleDanse             from '../templates/TemplateEcoleDanse';
import TemplateFoodTruck              from '../templates/TemplateFoodTruck';
import TemplateBoulangerie            from '../templates/TemplateBoulangerie';
import TemplateCoachVie               from '../templates/TemplateCoachVie';
import TemplateBoutiqueSimplisse      from '../templates/TemplateBoutiqueSimplisse';
import TemplateBoutiqueSimplisseMode  from '../templates/TemplateBoutiqueSimplisseMode';
import TemplateBoutiquePremium        from '../templates/TemplateBoutiquePremium';
import TemplateBoutiqueBeaute         from '../templates/TemplateBoutiqueBeaute';
import TemplateMultiVendeurPremium    from '../templates/multivendeur/TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface SitePreviewProps {
  vendeurIdProp?: number | string;
  hidePreviewBar?: boolean;
}

// ─── Configs démo 100% hardcodées — zéro API ─────────────────────────────────
const DEMO_PRODUITS_PREMIUM = [
  { id:1, titre:'Montre Édition Limitée', prix:299.99, prix_promo:249.99, stock:5, categorie:'Accessoires', note_moyenne:4.8, nb_avis:124, description:'Montre de luxe avec boîtier en acier inoxydable et cadran saphir. Étanche 50m. Garantie 2 ans.', photo_principale:'' },
  { id:2, titre:'Sac Cuir Véritable', prix:189.99, stock:12, categorie:'Maroquinerie', note_moyenne:4.9, nb_avis:87, description:'Sac en cuir pleine fleur tanné végétal. Doublure en suède. Fabriqué à la main.', photo_principale:'' },
  { id:3, titre:'Parfum Signature', prix:149.99, stock:20, categorie:'Beauté', note_moyenne:4.7, nb_avis:203, description:'Eau de parfum 100ml. Notes de tête: bergamote. Notes de cœur: rose, jasmin.', photo_principale:'' },
  { id:4, titre:'Coffret Soins Premium', prix:89.99, prix_promo:69.99, stock:8, categorie:'Beauté', note_moyenne:4.6, nb_avis:56, description:'Coffret de 5 produits de soin visage haut de gamme.', photo_principale:'' },
  { id:5, titre:'Ceinture Cuir Italien', prix:119.99, stock:15, categorie:'Maroquinerie', note_moyenne:4.8, nb_avis:41, description:'Ceinture en cuir de veau italien. Boucle en laiton doré.', photo_principale:'' },
  { id:6, titre:'Écharpe Cachemire', prix:199.99, prix_promo:159.99, stock:7, categorie:'Mode', note_moyenne:4.9, nb_avis:67, description:'Écharpe 100% cachemire mongolien. Tissage fait main.', photo_principale:'' },
  { id:7, titre:'Chapeau Fedora', prix:59.99, stock:10, categorie:'Accessoires', note_moyenne:4.5, nb_avis:34, description:'Chapeau fedora en laine feutrée. Ruban en soie.', photo_principale:'' },
  { id:8, titre:'Portefeuille Slim', prix:79.99, stock:25, categorie:'Maroquinerie', note_moyenne:4.7, nb_avis:92, description:'Portefeuille ultra-mince en cuir de veau. 6 emplacements cartes.', photo_principale:'' },
];

const DEMO_PRODUITS_SIMPLISSE_MODE = [
  { id:1, titre:'Robe Midi Fleurie', prix:89.99, prix_promo:69.99, stock:15, categorie:'Robes', note_moyenne:4.8, nb_avis:42, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Rouge','Bleu','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:2, titre:'Blazer Oversized Crème', prix:129.99, stock:8, categorie:'Vestes', note_moyenne:4.9, nb_avis:28, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:3, titre:'Jean Taille Haute', prix:74.99, prix_promo:59.99, stock:20, categorie:'Pantalons', note_moyenne:4.7, nb_avis:61, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Noir','Bleu','Blanc'], type:'couleur' },{ nom:'Taille', valeurs:['36','38','40','42','44'], type:'taille' }] },
  { id:4, titre:'Top Épaules Dénudées', prix:44.99, stock:25, categorie:'Hauts', note_moyenne:4.6, nb_avis:33, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Blanc','Rose','Sauge'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:5, titre:'Manteau Long Camel', prix:189.99, prix_promo:149.99, stock:6, categorie:'Manteaux', note_moyenne:4.9, nb_avis:19, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:6, titre:'Jupe Plissée Midi', prix:59.99, stock:18, categorie:'Jupes', note_moyenne:4.7, nb_avis:47, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Bordeaux','Vert','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
];

const DEMO_PRODUITS_SIMPLISSE = [
  { id: 1, titre: 'T-Shirt Premium Blanc', prix: 29.99, prix_promo: 19.99, stock: 50, categorie: 'Vêtements', description: 'T-shirt 100% coton bio, coupe régulière. Disponible en S, M, L, XL.', photo_principale: '' },
  { id: 2, titre: 'Casquette Signature',   prix: 24.99, stock: 30,  categorie: 'Accessoires', description: 'Casquette ajustable brodée. Taille unique.', photo_principale: '' },
  { id: 3, titre: 'Sac Tote Canvas',       prix: 34.99, stock: 25,  categorie: 'Accessoires', description: 'Sac fourre-tout en canvas épais. Contenance 15L.', photo_principale: '' },
  { id: 4, titre: 'Hoodie Zip Gris',       prix: 59.99, prix_promo: 44.99, stock: 20, categorie: 'Vêtements', description: 'Hoodie zip molleton doux. Poche kangourou.', photo_principale: '' },
  { id: 5, titre: 'Chaussettes Pack x3',   prix: 14.99, stock: 100, categorie: 'Vêtements', description: 'Pack de 3 paires de chaussettes coton doux.', photo_principale: '' },
  { id: 6, titre: 'Bouteille Inox 500ml',  prix: 39.99, stock: 40,  categorie: 'Maison',      description: 'Bouteille isotherme 24h chaud / 48h froid.', photo_principale: '' },
];

const DEMO_CONFIG_SIMPLISSE = {
  simplisse: {
    accueil: {
      couleurPrimaire: '#2563eb', couleurSecondaire: '#64748b',
      couleurFondPage: '#ffffff', couleurTexte: '#1a1a1a', police: 'Inter',
      banniere: { actif: true, texte: '🎉 Livraison gratuite dès 75$ !', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      hero: { titre: 'Bienvenue dans Ma Belle Boutique', sousTitre: 'Découvrez notre sélection de produits soigneusement choisis pour vous.', boutonLabel: 'Voir le catalogue', boutonLien: '/catalogue', photo: '', couleurFond: '#f8fafc', couleurTitre: '#1a1a1a', couleurBouton: '#2563eb', style: 'centre' },
      sections: [
        { id: 'banniere',    label: 'Bannière',    icone: '📢', actif: true, ordre: 1 },
        { id: 'hero',        label: 'Hero',        icone: '🖼', actif: true, ordre: 2 },
        { id: 'avantages',   label: 'Avantages',   icone: '✅', actif: true, ordre: 3 },
        { id: 'vedette',     label: 'Vedette',     icone: '⭐', actif: true, ordre: 4 },
        { id: 'categories',  label: 'Catégories',  icone: '🗂', actif: true, ordre: 5 },
        { id: 'temoignages', label: 'Témoignages', icone: '💬', actif: true, ordre: 6 },
      ],
    },
    catalogue: {
      titre: 'Notre catalogue', sousTitre: 'Tous nos produits disponibles.',
      colonnes: 3, afficherFiltres: true, afficherRecherche: true, afficherPrix: true, afficherStock: true,
      sections: [],
    },
    faq: {
      titre: 'Questions fréquentes', sousTitre: 'Trouvez rapidement les réponses à vos questions.',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      items: [
        { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables.' },
        { question: 'Puis-je retourner un article ?', reponse: 'Oui, sous 30 jours suivant la réception.' },
        { question: 'Quels modes de paiement acceptez-vous ?', reponse: 'Visa, Mastercard et Apple Pay via Stripe.' },
      ],
    },
    blog: {
      titre: 'Notre blogue', sousTitre: 'Actualités, conseils et nouveautés.',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      afficherAuteur: true, afficherDate: true, colonnes: 3,
    },
    contact: {
      titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !',
      banniere: { actif: false, texte: '', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
      adresse: '123 rue Principale, Montréal, QC H2X 1Y6',
      telephone: '514 000-0000', courriel: 'info@mabellboutique.ca',
      afficherCarte: false, urlCarte: '',
    },
    footer: {
      nomBoutique: 'Ma Belle Boutique', slogan: 'Qualité artisanale depuis 2020',
      couleurFond: '#111827', couleurTexte: '#ffffff', afficherPropulse: true,
      reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', tiktok: '', twitter: '', youtube: '', linkedin: '', pinterest: '' },
      colonnes: { titre1: 'Boutique', liens1: 'Accueil\nCatalogue\nBlog\nFAQ', titre2: 'Aide', liens2: 'Contact', titre3: '', liens3: '' },
      politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true },
    },
  },
  // Surcharger les méthodes de fetch pour retourner les produits démo
  __demo__: true,
};

// Config démo générique pour tous les autres templates
const DEMO_CONFIG_GENERIQUE = {
  nom_boutique: 'Boutique Démo',
  description: 'Ceci est un aperçu démo du template.',
};

export default function SitePreview({ vendeurIdProp, hidePreviewBar }: SitePreviewProps = {}) {
  const [params]  = useSearchParams();
  const vendeurId = vendeurIdProp != null ? String(vendeurIdProp) : params.get('vendeurId');
  const forceTemplate = params.get('forceTemplate');
  const isDemo    = params.get('demo') === 'true';

  const [siteData, setSiteData] = useState<any>(null);
  const [configMV, setConfigMV] = useState<any>({});
  const [options, setOptions] = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState('');

  useEffect(() => {
    // Mode démo — zéro appel API
    if (isDemo && forceTemplate) {
      setLoading(false);
      return;
    }
    if (!vendeurId) { setErreur('ID vendeur manquant.'); setLoading(false); return; }
    fetch(`${API_BASE}/studio/sites/${vendeurId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSiteData(data);
        else setErreur('Site non trouvé ou non configuré.');
      })
      .catch(() => setErreur('Erreur de connexion.'))
      .finally(() => setLoading(false));

    // Charger la config spécifique multi-vendeur (table séparée)
    fetch(`${API_BASE}/gestionnaires/${vendeurId}/config-multivendeur`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data) setConfigMV(data); })
      .catch(() => {});

    // Charger les options/add-ons activés (route publique) — ex: reservation_ecole
    fetch(`${API_BASE}/gestionnaires/${vendeurId}/options`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data) setOptions(data); })
      .catch(() => {});
  }, [vendeurId, forceTemplate, isDemo]);

  useEffect(() => {
    if (siteData || (isDemo && forceTemplate)) window.scrollTo(0, 0);
  }, [siteData, isDemo, forceTemplate]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16, background: '#0d0d0d' }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <p style={{ color: '#888', fontSize: 15 }}>Chargement de l'aperçu...</p>
    </div>
  );

  if (erreur) return <Page404Public gestionnaireId={vendeurId} />;

  // ── Déterminer templateId et config ───────────────────────────────────────
  const templateId = forceTemplate || siteData?.template_id || 'vitrine';
  const siteId     = siteData?.id;
  const configBD   = isDemo
    ? (templateId.startsWith('boutique-simplisse') ? DEMO_CONFIG_SIMPLISSE : DEMO_CONFIG_GENERIQUE)
    : (siteData?.config || {});
  const config = { ...configBD, vendeurId: Number(vendeurId || 0) };

  // ── Rendu du template ─────────────────────────────────────────────────────
  const renderTemplate = () => {
    if (templateId === 'salon-coiffure')           return <TemplateSalon config={config} vendeurId={String(vendeurId || '0')} />;
    if (templateId === 'vitrine-paysager')         return <TemplatePaysager config={config} />;
    if (templateId === 'vitrine-avocat')           return <TemplateAvocat config={config} />;
    if (templateId === 'vitrine-resto')            return <TemplateResto config={config} />;
    if (templateId === 'vitrine-bistro')           return <TemplateBistro config={config} />;
    if (templateId === 'cours-piano')              return <TemplatePiano config={config} />;
    if (templateId === 'cours-langues')            return <TemplateLangues config={config} />;
    if (templateId === 'cours-web')                return <TemplateFormationWeb config={config} />;
    if (templateId === 'cours-cuisine')            return <TemplateEcoleCuisine config={config} />;
    if (templateId === 'cours-yoga')               return <TemplateStudioYoga config={config} />;
    if (templateId === 'cours-equitation')         return <TemplateEquitation config={config} />;
    if (templateId === 'cours-peinture')           return <TemplateEcolePeinture config={config} />;
    if (templateId === 'cours-danse')              return <TemplateEcoleDanse config={config} siteId={siteId} reservationActive={!!options.reservation_ecole} abonnementActive={!!options.abonnement_ecole} />;
    if (templateId === 'vitrine-foodtruck')        return <TemplateFoodTruck config={config} />;
    if (templateId === 'vitrine-boulangerie')      return <TemplateBoulangerie config={config} />;
    if (templateId === 'cours-coach')              return <TemplateCoachVie config={config} />;
    if (templateId === 'agricole')                 return <TemplateAgricole config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-sante')        return <TemplateVitrineProSante config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-mariage')      return <TemplateVitrineProMariage config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-beaute')       return <TemplateVitrineProBeaute config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-tech')         return <TemplateVitrineProTech config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'vitrine-pro-entrepreneur') return <TemplateVitrineProEntrepreneur config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-flash')            return <TemplateEnchereFlash config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-galerie')          return <TemplateEnchereGalerie config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'enchere-live')             return <TemplateEnchereLive config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'boutique-complete')        return <TemplateBoutiqueComplete config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'boutique-simple')          return <TemplateBoutiqueSimple config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId.startsWith('boutique-premium')) {
      const configDemo = isDemo
        ? { ...config, __produits_demo__: DEMO_PRODUITS_PREMIUM }
        : config;
      return <TemplateBoutiquePremium config={configDemo} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('boutique-beaute')) {
      const DEMO_PRODUITS_BEAUTE = [
        { id:1, titre:'Sérum Éclat Vitamine C', prix:49.99, prix_promo:39.99, stock:25, categorie:'Soins Visage', est_nouveau:true, note_moyenne:4.8, nb_avis:142, description:'Sérum concentré en vitamine C pure à 15%.', photo_principale:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', variantes:[{nom:'Format',valeurs:['30ml','50ml'],type:'taille'}] },
        { id:2, titre:'Crème Hydratante Rose', prix:34.99, stock:40, categorie:'Soins Visage', note_moyenne:4.9, nb_avis:87, description:'Crème riche à l\'extrait de rose de Damas.', photo_principale:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80' },
        { id:3, titre:'Palette Yeux « Sunset »', prix:42.00, stock:18, categorie:'Maquillage', est_nouveau:true, note_moyenne:4.7, nb_avis:203, description:'Palette de 12 fards aux teintes rosées et dorées.', photo_principale:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80' },
        { id:4, titre:'Brume Fixatrice Hydra', prix:24.99, prix_promo:18.99, stock:60, categorie:'Maquillage', note_moyenne:4.6, nb_avis:56, description:'Brume fixatrice formule aloe vera.', photo_principale:'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80' },
        { id:5, titre:'Masque Purifiant Argile', prix:29.99, stock:35, categorie:'Soins Visage', note_moyenne:4.8, nb_avis:41, description:'Masque à l\'argile verte et au charbon actif.', photo_principale:'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80' },
        { id:6, titre:'Rouge à Lèvres Mat Velours', prix:19.99, stock:50, categorie:'Maquillage', note_moyenne:4.7, nb_avis:92, description:'Rouge à lèvres mat longue tenue.', photo_principale:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', variantes:[{nom:'Couleur',valeurs:['Rose Nude','Rouge Passion','Bordeaux','Corail','Fuchsia'],type:'couleur'}] },
      ];
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_BEAUTE } : config;
      return <TemplateBoutiqueBeaute config={configDemo} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('multi-vendeur-premium')) {
      const configMVFinal = isDemo ? config : { ...config, ...configMV };
      return <TemplateMultiVendeurPremium config={configMVFinal} vendeurId={Number(vendeurId || 0)} isDemo={isDemo} />;
    }
    if (templateId.startsWith('boutique-simplisse-mode')) {
      const configDemo = isDemo ? { ...config, __produits_demo__: DEMO_PRODUITS_SIMPLISSE_MODE } : config;
      return <TemplateBoutiqueSimplisseMode config={configDemo} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('boutique-simplisse')) {
      // En mode démo — injecter les produits hardcodés via config
      const configDemo = isDemo
        ? { ...config, __produits_demo__: DEMO_PRODUITS_SIMPLISSE }
        : config;
      return <TemplateBoutiqueSimplisse config={configDemo} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    }
    if (templateId.startsWith('cagnotte-'))        return <TemplateCagnottePro config={config} siteId={siteId} vendeurId={Number(vendeurId || 0)} />;
    if (templateId === 'reservation-spectacle')    return <TemplateSpectacle config={config} siteId={siteId} />;
    if (templateId.startsWith('reservation-'))     return <TemplateReservation config={config} siteId={siteId} />;
    return <TemplateVitrine config={config} />;
  };

  return (
    <>
      {/* Bandeau MODE DÉMO — en bas pour ne pas cacher le header des templates */}
      {isDemo && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000, background: '#f59e0b', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'sans-serif', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>🎭</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>MODE DÉMO — Aperçu du template</span>
            <span style={{ fontSize: 11, color: '#444' }}>Aucune donnée n'est sauvegardée. Les produits et contenus sont fictifs.</span>
          </div>
          <button onClick={() => window.close()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ✕ Fermer
          </button>
        </div>
      )}

      {/* Barre d'aperçu normale (non démo, non site public live) */}
      {!isDemo && !hidePreviewBar && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 36, background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a96e', letterSpacing: '1px' }}>e-VEND STUDIO</span>
            <span style={{ color: '#444', fontSize: 11 }}>›</span>
            <span style={{ fontSize: 11, color: '#666' }}>Mode aperçu — {templateId}</span>
          </div>
          <button onClick={() => window.close()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            ✕ Fermer
          </button>
        </div>
      )}

      {/* Cookies — seulement en mode normal */}
      {!isDemo && vendeurId && <CookieBanner vendeurId={Number(vendeurId)} />}

      {/* Vérificateur d'âge — actif seulement si l'add-on est activé, jamais en mode démo */}
      {!isDemo && vendeurId && <VerificateurAge vendeurId={Number(vendeurId)} />}

      {/* Contenu */}
      <div style={{ paddingBottom: 44 }}>
        {renderTemplate()}
      </div>
    </>
  );
}