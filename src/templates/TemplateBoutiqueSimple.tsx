// src/templates/TemplateBoutiqueSimple.tsx
// e-Vend Studio — Boutique Mono-Produit Simple
// Tout sur une seule page : produit + checkout intégré

import { useState, useRef, useEffect } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TypeBoutique =
  | 'electronique' | 'mode' | 'bebe' | 'animaux'
  | 'maison' | 'sport' | 'beaute' | 'art';

export interface VarianteProduit {
  nom: string;   // ex: 'Couleur', 'Taille'
  options: string[]; // ex: ['Rouge', 'Bleu', 'Vert']
}

export interface ConfigBoutiqueSimple {
  typeBoutique: TypeBoutique;
  nomEntreprise: string;
  slogan: string;
  logoUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';

  // Produit
  nomProduit: string;
  descriptionCourte: string;
  descriptionLongue: string;
  prix: number;
  prixAvant?: number;       // prix barré
  photosProduit: string[];  // jusqu'à 8 photos
  videoUrl?: string;        // YouTube ou URL directe
  variantes: VarianteProduit[];
  enStock: boolean;
  nbEnStock?: number;

  // Livraison
  fraisLivraison: number;   // 0 = gratuit
  delaiLivraison: string;   // ex: '3-5 jours ouvrables'
  retourPolitique: string;

  // Confiance
  garantie: string;
  avis: { nom: string; note: number; texte: string; date: string }[];

  // Contact
  email: string;
  telephone: string;
  instagram: string;
  facebook: string;

  // Message confirmation
  messageConfirmation: string;
}

export const CONFIG_BOUTIQUE_SIMPLE_DEFAUT: ConfigBoutiqueSimple = {
  typeBoutique: 'electronique',
  nomEntreprise: 'Ma Boutique',
  slogan: 'Qualité garantie, livraison rapide',
  logoUrl: '',
  couleurPrincipale: '#1a1a1a',
  couleurSecondaire: '#c9a96e',
  couleurFond: '#ffffff',
  couleurTexte: '#1a1a1a',
  police: 'moderne',
  nomProduit: 'Écouteurs sans fil Pro',
  descriptionCourte: 'Son cristallin, autonomie 40h, réduction de bruit active.',
  descriptionLongue: `Découvrez une expérience audio exceptionnelle avec nos écouteurs sans fil Pro. Dotés de la dernière technologie de réduction de bruit active, ils vous plongent dans votre musique comme jamais auparavant.

**Caractéristiques :**
• Réduction de bruit active (ANC)
• Autonomie 40 heures
• Recharge rapide — 15 min = 3h d'écoute
• Connectivité Bluetooth 5.3
• Qualité audio Hi-Res certifiée
• Poids ultra-léger : 250g`,
  prix: 149.99,
  prixAvant: 199.99,
  photosProduit: [
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  videoUrl: '',
  variantes: [
    { nom: 'Couleur', options: ['Noir', 'Blanc', 'Bleu minuit'] },
  ],
  enStock: true,
  nbEnStock: 15,
  fraisLivraison: 0,
  delaiLivraison: '3-5 jours ouvrables',
  retourPolitique: 'Retour gratuit sous 30 jours.',
  garantie: '2 ans de garantie fabricant incluse.',
  avis: [
    { nom: 'Marie L.', note: 5, texte: 'Qualité incroyable! La réduction de bruit est parfaite pour le travail.', date: '2026-05-15' },
    { nom: 'Pierre M.', note: 5, texte: 'Livraison rapide, produit exactement comme décrit. Je recommande!', date: '2026-05-20' },
    { nom: 'Sophie T.', note: 4, texte: 'Très bon son, confortable à porter. Un peu cher mais ça vaut le coup.', date: '2026-06-01' },
  ],
  email: '',
  telephone: '',
  instagram: '',
  facebook: '',
  messageConfirmation: 'Merci pour votre commande! Vous recevrez une confirmation par courriel sous peu.',
};

const DEFAUTS_PAR_TYPE: Partial<Record<TypeBoutique, Partial<ConfigBoutiqueSimple>>> = {
  electronique: {
    nomProduit: 'Écouteurs sans fil Pro',
    descriptionCourte: 'Son cristallin, autonomie 40h, réduction de bruit active.',
    prix: 149.99, prixAvant: 199.99,
    couleurPrincipale: '#1a1a1a', couleurSecondaire: '#c9a96e',
    variantes: [{ nom: 'Couleur', options: ['Noir', 'Blanc', 'Bleu minuit'] }],
    photosProduit: ['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  mode: {
    nomProduit: 'Robe d\'été Élégante',
    descriptionCourte: 'Légère, fluide et parfaite pour toutes les occasions.',
    prix: 89.99, prixAvant: 129.99,
    couleurPrincipale: '#ec4899', couleurSecondaire: '#1a1a1a',
    variantes: [
      { nom: 'Taille', options: ['XS', 'S', 'M', 'L', 'XL'] },
      { nom: 'Couleur', options: ['Blanc', 'Bleu ciel', 'Rose poudré'] },
    ],
    photosProduit: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  bebe: {
    nomProduit: 'Poussette Premium 3-en-1',
    descriptionCourte: 'Légère, sécuritaire et ultra-confortable pour bébé.',
    prix: 349.99, prixAvant: 449.99,
    couleurPrincipale: '#6366f1', couleurSecondaire: '#1a1a1a',
    variantes: [{ nom: 'Couleur', options: ['Gris', 'Beige', 'Bleu marine'] }],
    photosProduit: ['https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=800'],
  },
  animaux: {
    nomProduit: 'Lit orthopédique pour chien',
    descriptionCourte: 'Confort optimal, mousse mémoire, lavable en machine.',
    prix: 79.99, prixAvant: 99.99,
    couleurPrincipale: '#16a34a', couleurSecondaire: '#1a1a1a',
    variantes: [
      { nom: 'Taille', options: ['Petit', 'Moyen', 'Grand', 'Très grand'] },
      { nom: 'Couleur', options: ['Gris', 'Beige', 'Brun'] },
    ],
    photosProduit: ['https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  maison: {
    nomProduit: 'Lampe LED Design Nordique',
    descriptionCourte: 'Éclairage d\'ambiance, 3 modes de luminosité, bois naturel.',
    prix: 59.99, prixAvant: 79.99,
    couleurPrincipale: '#d97706', couleurSecondaire: '#1a1a1a',
    variantes: [{ nom: 'Couleur bois', options: ['Chêne', 'Noyer', 'Pin'] }],
    photosProduit: ['https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  sport: {
    nomProduit: 'Vélo de montagne Pro',
    descriptionCourte: 'Cadre aluminium léger, 21 vitesses, freins à disque.',
    prix: 599.99, prixAvant: 799.99,
    couleurPrincipale: '#dc2626', couleurSecondaire: '#1a1a1a',
    variantes: [
      { nom: 'Taille cadre', options: ['S (15")', 'M (17")', 'L (19")', 'XL (21")'] },
      { nom: 'Couleur', options: ['Rouge', 'Noir', 'Bleu'] },
    ],
    photosProduit: ['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  beaute: {
    nomProduit: 'Sérum Vitamine C Premium',
    descriptionCourte: 'Éclat immédiat, anti-âge, formule concentrée 20%.',
    prix: 49.99, prixAvant: 69.99,
    couleurPrincipale: '#f97316', couleurSecondaire: '#1a1a1a',
    variantes: [{ nom: 'Format', options: ['30ml', '50ml', '100ml'] }],
    photosProduit: ['https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
  art: {
    nomProduit: 'Tableau Original — Série Zen',
    descriptionCourte: 'Acrylique sur toile, pièce unique signée par l\'artiste.',
    prix: 299.99,
    couleurPrincipale: '#8b5cf6', couleurSecondaire: '#1a1a1a',
    variantes: [{ nom: 'Format', options: ['30x30cm', '50x50cm', '80x80cm'] }],
    photosProduit: ['https://images.pexels.com/photos/1585325/pexels-photo-1585325.jpeg?auto=compress&cs=tinysrgb&w=800'],
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getPoliceCSS(p: string) {
  switch(p) {
    case 'classique': return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default: return "'Inter', sans-serif";
  }
}

function Etoiles({ note }: { note: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 14 }}>
      {'★'.repeat(note)}{'☆'.repeat(5 - note)}
    </span>
  );
}

// ─── FORMULAIRE CHECKOUT INTÉGRÉ ──────────────────────────────────────────────
interface CheckoutProps {
  config: ConfigBoutiqueSimple;
  variantesChoisies: Record<string, string>;
  quantite: number;
  cp: string; cs: string;
  siteId?: number;
  vendeurId?: number;
}

function CheckoutIntegre({ config, variantesChoisies, quantite, cp, cs, siteId, vendeurId }: CheckoutProps) {
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '',
    adresse: '', ville: '', province: 'QC', codePostal: '',
  });
  const [etape, setEtape] = useState<'form' | 'recap' | 'envoi' | 'succes' | 'erreur'>('form');
  const [message, setMessage] = useState('');

  const sous_total = config.prix * quantite;
  const taxes      = parseFloat((sous_total * 0.14975).toFixed(2));
  const livraison  = config.fraisLivraison;
  const total      = parseFloat((sous_total + taxes + livraison).toFixed(2));

  const varianteLabel = Object.entries(variantesChoisies)
    .map(([k, v]) => `${k}: ${v}`).join(', ');

  const handleCommande = async () => {
    setEtape('envoi');
    try {
      const res = await fetch('/api/boutique-studio/creer-commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id:          siteId,
          vendeur_id:       vendeurId,
          nom_client:       form.nom,
          email_client:     form.email,
          telephone:        form.telephone,
          adresse_livraison:`${form.adresse}, ${form.ville}, ${form.province} ${form.codePostal}`,
          produit_nom:      config.nomProduit,
          variante:         varianteLabel || null,
          quantite,
          prix_unitaire:    config.prix,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          setEtape('succes');
          setMessage(data.message || config.messageConfirmation);
        }
      } else {
        setEtape('erreur');
        setMessage(data.message || 'Une erreur est survenue.');
      }
    } catch {
      setEtape('erreur');
      setMessage('Impossible de joindre le serveur.');
    }
  };

  if (etape === 'succes') return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Commande confirmée!</h3>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{message}</p>
    </div>
  );

  if (etape === 'erreur') return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button onClick={() => setEtape('form')} style={{ padding: '9px 24px', background: cp, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Réessayer</button>
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Récap commande */}
      <div style={{ background: '#f8f8f6', borderRadius: 10, padding: '14px 16px', border: `1px solid ${cp}20` }}>
        <p style={{ fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px', fontSize: 14 }}>{config.nomProduit}</p>
        {varianteLabel && <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>{varianteLabel}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#666' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Sous-total ({quantite}x)</span><span>{sous_total.toFixed(2)}$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Taxes (TPS+TVQ)</span><span>{taxes.toFixed(2)}$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Livraison</span><span style={{ color: livraison === 0 ? '#16a34a' : '#1a1a1a' }}>{livraison === 0 ? 'GRATUITE' : `${livraison.toFixed(2)}$`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: '#1a1a1a', paddingTop: 8, borderTop: '1px solid #e5e7eb', marginTop: 4 }}>
            <span>Total</span><span style={{ color: cp }}>{total.toFixed(2)}$</span>
          </div>
        </div>
      </div>

      {/* Infos client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Nom complet *</label>
          <input value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} placeholder="Marie Dupont" style={inputStyle} required />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Courriel *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="marie@exemple.com" style={inputStyle} required />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Téléphone</label>
        <input value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} placeholder="(514) 555-0123" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Adresse de livraison *</label>
        <input value={form.adresse} onChange={e => setForm(p => ({...p, adresse: e.target.value}))} placeholder="1234 rue des Érables" style={inputStyle} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Ville *</label>
          <input value={form.ville} onChange={e => setForm(p => ({...p, ville: e.target.value}))} placeholder="Montréal" style={inputStyle} required />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Prov.</label>
          <select value={form.province} onChange={e => setForm(p => ({...p, province: e.target.value}))} style={{ ...inputStyle, background: '#fff' }}>
            {['QC','ON','BC','AB','MB','SK','NS','NB','NL','PE','YT','NT','NU'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Code postal</label>
          <input value={form.codePostal} onChange={e => setForm(p => ({...p, codePostal: e.target.value}))} placeholder="H2X 3K6" style={inputStyle} />
        </div>
      </div>

      <button
        onClick={handleCommande}
        disabled={!form.nom || !form.email || !form.adresse || !form.ville || etape === 'envoi'}
        style={{
          padding: '14px', background: (!form.nom || !form.email || !form.adresse) ? '#e5e7eb' : cp,
          border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800,
          cursor: (!form.nom || !form.email || !form.adresse) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}>
        {etape === 'envoi' ? '⏳ Traitement...' : `🔒 Commander — ${total.toFixed(2)}$`}
      </button>
      <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: 0 }}>
        🔒 Paiement sécurisé via Stripe. Vos données sont protégées.
      </p>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
interface Props {
  config?: Partial<ConfigBoutiqueSimple>;
  isPreviewMobile?: boolean;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateBoutiqueSimple({ config: configPartiel, isPreviewMobile = false, siteId, vendeurId }: Props) {
  const typeBoutique = (configPartiel?.typeBoutique || 'electronique') as TypeBoutique;
  const defauts = DEFAUTS_PAR_TYPE[typeBoutique] || {};
  const config: ConfigBoutiqueSimple = { ...CONFIG_BOUTIQUE_SIMPLE_DEFAUT, ...defauts, ...configPartiel };

  const isMobile = isPreviewMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const police   = getPoliceCSS(config.police);
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;

  const [photoActive, setPhotoActive]           = useState(0);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string, string>>({});
  const [quantite, setQuantite]                 = useState(1);
  const [showCheckout, setShowCheckout]         = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  // Initialiser variantes par défaut
  useEffect(() => {
    const init: Record<string, string> = {};
    config.variantes.forEach(v => { if (v.options.length > 0) init[v.nom] = v.options[0]; });
    setVariantesChoisies(init);
  }, []);

  const scrollToCheckout = () => {
    setShowCheckout(true);
    setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const noteMoyenne = config.avis.length
    ? (config.avis.reduce((acc, a) => acc + a.note, 0) / config.avis.length).toFixed(1)
    : null;

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap" />
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .photo-thumb { transition: all 0.2s; cursor: pointer; opacity: 0.6; }
        .photo-thumb:hover, .photo-thumb.active { opacity: 1; border-color: ${cp} !important; }
        .btn-acheter {
          background: ${cp}; color: #fff; border: none;
          padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700;
          cursor: pointer; width: 100%; transition: all 0.2s;
        }
        .btn-acheter:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-acheter:disabled { background: #e5e7eb; color: #aaa; cursor: not-allowed; transform: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${cp}60; border-radius: 3px; }
      `}</style>

      {/* HEADER MINIMAL */}
      <header style={{ background: cf, borderBottom: `1px solid ${cp}20`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display='none')} />}
          <span style={{ fontSize: 18, fontWeight: 700, color: ct }}>{config.nomEntreprise}</span>
        </div>
        {config.slogan && !isMobile && <span style={{ fontSize: 13, color: `${ct}66`, fontStyle: 'italic' }}>{config.slogan}</span>}
        <button onClick={scrollToCheckout} style={{ padding: '8px 20px', background: cp, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Commander
        </button>
      </header>

      {/* SECTION PRODUIT */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', gap: isMobile ? 0 : 56, flexDirection: isMobile ? 'column' : 'row' }}>

          {/* ── GALERIE PHOTOS ── */}
          <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : 520 }}>
            {/* Photo principale */}
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#f8f8f6', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {config.photosProduit[photoActive] ? (
                <img src={config.photosProduit[photoActive]} alt={config.nomProduit} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: 64, color: '#ddd' }}>📦</div>
              )}
            </div>
            {/* Miniatures */}
            {config.photosProduit.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {config.photosProduit.map((url, i) => (
                  <div key={i} className={`photo-thumb ${photoActive === i ? 'active' : ''}`}
                    onClick={() => setPhotoActive(i)}
                    style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `2px solid ${photoActive === i ? cp : '#e5e7eb'}` }}>
                    <img src={url} alt={`${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display='none')} />
                  </div>
                ))}
              </div>
            )}
            {/* Vidéo */}
            {config.videoUrl && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                {config.videoUrl.includes('youtube') || config.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={config.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen title="Vidéo produit"
                  />
                ) : (
                  <video src={config.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            )}
          </div>

          {/* ── INFOS PRODUIT ── */}
          <div style={{ flex: 1 }}>
            {/* Titre + prix */}
            <h1 style={{ fontSize: `clamp(22px, 3vw, 34px)`, fontWeight: 800, color: ct, marginBottom: 12, lineHeight: 1.2 }}>
              {config.nomProduit}
            </h1>

            {/* Avis résumé */}
            {noteMoyenne && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Etoiles note={Math.round(parseFloat(noteMoyenne))} />
                <span style={{ fontSize: 13, color: '#888' }}>{noteMoyenne} ({config.avis.length} avis)</span>
              </div>
            )}

            {/* Prix */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: cp }}>{config.prix.toFixed(2)}$</span>
              {config.prixAvant && (
                <>
                  <span style={{ fontSize: 18, color: '#aaa', textDecoration: 'line-through' }}>{config.prixAvant.toFixed(2)}$</span>
                  <span style={{ fontSize: 13, fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: 20 }}>
                    -{Math.round((1 - config.prix/config.prixAvant)*100)}%
                  </span>
                </>
              )}
            </div>

            {/* Description courte */}
            <p style={{ fontSize: 16, color: `${ct}88`, lineHeight: 1.6, marginBottom: 24 }}>{config.descriptionCourte}</p>

            {/* Variantes */}
            {config.variantes.map(variante => (
              <div key={variante.nom} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: ct, marginBottom: 8 }}>
                  {variante.nom} : <span style={{ color: cp }}>{variantesChoisies[variante.nom] || ''}</span>
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {variante.options.map(opt => (
                    <button key={opt} onClick={() => setVariantesChoisies(prev => ({ ...prev, [variante.nom]: opt }))}
                      style={{
                        padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${variantesChoisies[variante.nom] === opt ? cp : '#e5e7eb'}`,
                        background: variantesChoisies[variante.nom] === opt ? `${cp}15` : '#fff',
                        color: variantesChoisies[variante.nom] === opt ? cp : ct,
                        transition: 'all 0.15s',
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: ct }}>Quantité :</p>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQuantite(q => Math.max(1, q-1))} style={{ width: 36, height: 36, border: 'none', background: '#f8f8f6', cursor: 'pointer', fontSize: 18 }}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{quantite}</span>
                <button onClick={() => setQuantite(q => q+1)} style={{ width: 36, height: 36, border: 'none', background: '#f8f8f6', cursor: 'pointer', fontSize: 18 }}>+</button>
              </div>
            </div>

            {/* Stock */}
            <div style={{ marginBottom: 20 }}>
              {config.enStock ? (
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ En stock{config.nbEnStock ? ` (${config.nbEnStock} restants)` : ''}</span>
              ) : (
                <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>✗ Rupture de stock</span>
              )}
            </div>

            {/* Bouton commander */}
            <button className="btn-acheter" onClick={scrollToCheckout} disabled={!config.enStock} style={{ marginBottom: 16 }}>
              {config.enStock ? `🛒 Commander — ${(config.prix * quantite).toFixed(2)}$` : '❌ Indisponible'}
            </button>

            {/* Badges confiance */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {config.fraisLivraison === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                  <span>🚚</span> Livraison gratuite
                </div>
              )}
              {config.garantie && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                  <span>🛡️</span> {config.garantie}
                </div>
              )}
              {config.retourPolitique && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                  <span>↩️</span> {config.retourPolitique}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION LONGUE */}
      <section style={{ background: '#f8f8f6', padding: '56px 24px', borderTop: `1px solid ${cp}15` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: `clamp(20px, 3vw, 28px)`, fontWeight: 700, color: ct, marginBottom: 6 }}>Description du produit</h2>
          <div style={{ width: 48, height: 3, background: cp, borderRadius: 2, marginBottom: 24 }} />
          <div style={{ fontSize: 15, color: `${ct}99`, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {config.descriptionLongue}
          </div>
        </div>
      </section>

      {/* AVIS */}
      {config.avis.length > 0 && (
        <section style={{ padding: '56px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: `clamp(20px, 3vw, 28px)`, fontWeight: 700, color: ct, marginBottom: 6 }}>Avis clients</h2>
            <div style={{ width: 48, height: 3, background: cp, borderRadius: 2, marginBottom: 32 }} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {config.avis.map((a, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: ct }}>{a.nom}</span>
                    <Etoiles note={a.note} />
                  </div>
                  <p style={{ fontSize: 13, color: `${ct}88`, lineHeight: 1.6, margin: 0 }}>{a.texte}</p>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>{new Date(a.date).toLocaleDateString('fr-CA')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION CHECKOUT INTÉGRÉ */}
      <section ref={checkoutRef} id="commander" style={{ background: `${cp}08`, padding: '56px 24px', borderTop: `2px solid ${cp}30` }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: `clamp(20px, 3vw, 28px)`, fontWeight: 700, color: ct, marginBottom: 6, textAlign: 'center' }}>
            Passer ma commande
          </h2>
          <div style={{ width: 48, height: 3, background: cp, borderRadius: 2, margin: '0 auto 32px' }} />

          {showCheckout ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${cp}20` }}>
              <CheckoutIntegre
                config={config}
                variantesChoisies={variantesChoisies}
                quantite={quantite}
                cp={cp} cs={cs}
                siteId={siteId}
                vendeurId={vendeurId}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: `${ct}88`, marginBottom: 24 }}>
                Vous êtes sur le point de commander <strong>{config.nomProduit}</strong>.
              </p>
              <button className="btn-acheter" onClick={() => setShowCheckout(true)} style={{ maxWidth: 320, margin: '0 auto', display: 'block' }}>
                🛒 Continuer — {(config.prix * quantite).toFixed(2)}$
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '24px', background: ct, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          {config.nomEntreprise} — Propulsé par <span style={{ color: cs }}>e-Vend Studio</span>
        </p>
        {(config.email || config.telephone) && (
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
            {config.email && <a href={`mailto:${config.email}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>✉️ {config.email}</a>}
            {config.telephone && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📞 {config.telephone}</span>}
          </div>
        )}
      </footer>
    </div>
  );
}

export { DEFAUTS_PAR_TYPE };