// src/pages/commanditaire/SponsorPubsCreer.tsx
import React, { useState, useRef, useEffect } from 'react';
import RoueFortune from '../../components/RoueFortune';

const THEME = {
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  accent: '#f59e0b',
  accentHover: '#d97706',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
};

type TypePub = 
  | 'basique' 
  | 'carrousel' 
  | 'video' 
  | 'interactive' 
  | 'social' 
  | 'avant_apres' 
  | 'parallaxe' 
  | 'minijeu' 
  | 'codepromo' 
  | 'temoignage';

type EffetCarrousel = 'fondu' | 'slide' | 'page' | 'explosion' | 'zoom' | 'flip';

const EFFETS: { id: EffetCarrousel; label: string; prix: number; description: string }[] = [
  { id: 'fondu', label: 'Fondu', prix: 0.80, description: 'Transition douce entre les images' },
  { id: 'slide', label: 'Slide', prix: 0.80, description: 'Glissement latéral' },
  { id: 'page', label: 'Page qui tourne', prix: 1.00, description: 'Effet livre 📖' },
  { id: 'zoom', label: 'Zoom', prix: 0.80, description: 'Zoom progressif' },
  { id: 'flip', label: 'Flip 3D', prix: 1.00, description: 'Retournement en 3D 🃏' },
  { id: 'explosion', label: 'Explosion', prix: 1.50, description: 'Éclatement en morceaux 💥' },
];

const FORMATS: { id: TypePub; label: string; emoji: string; prix: number; description: string }[] = [
  { id: 'basique', label: 'Statique', emoji: '📸', prix: 0.50, description: '1 photo fixe' },
  { id: 'carrousel', label: 'Carrousel', emoji: '🎠', prix: 0.80, description: '5 photos qui défilent' },
  { id: 'video', label: 'Vidéo', emoji: '🎬', prix: 1.50, description: 'Vidéo 30s max' },
  { id: 'interactive', label: 'Interactive', emoji: '🪄', prix: 2.00, description: 'Question + choix' },
  { id: 'social', label: 'Social Proof', emoji: '🔥', prix: 1.50, description: 'Compteur en temps réel' },
  { id: 'avant_apres', label: 'Avant/Après', emoji: '🔄', prix: 1.50, description: 'Comparaison avec glissière' },
  { id: 'parallaxe', label: 'Parallaxe 3D', emoji: '🎯', prix: 2.50, description: 'Effet de profondeur' },
  { id: 'minijeu', label: 'Mini-jeu', emoji: '🎮', prix: 3.00, description: 'Quiz ou jeu interactif' },
  { id: 'codepromo', label: 'Code promo', emoji: '🏷️', prix: 0.60, description: 'Code réduction affiché' },
  { id: 'temoignage', label: 'Témoignage', emoji: '⭐', prix: 1.00, description: 'Avis client + note' },
];

// ── CATÉGORIES DE SITES ──────────────────────────────────────────────
const CATEGORIES_SITES = [
  { id: 'general', label: 'Général', emoji: '🌍' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { id: 'vitrine', label: 'Vitrine', emoji: '🎨' },
  { id: 'cours', label: 'Cours/École', emoji: '💃' },
  { id: 'restaurant', label: 'Restauration', emoji: '🍽️' },
  { id: 'beaute', label: 'Beauté', emoji: '💄' },
  { id: 'jardin', label: 'Jardin/Bricolage', emoji: '🏠' },
  { id: 'auto', label: 'Auto', emoji: '🚗' },
  { id: 'sante', label: 'Santé', emoji: '🏥' },
  { id: 'evenement', label: 'Événements', emoji: '🎭' },
  { id: 'technologie', label: 'Technologie', emoji: '💻' },
  { id: 'mode', label: 'Mode', emoji: '👗' },
];

function SponsorPubsCreer() {
  const [typePub, setTypePub] = useState<TypePub>('basique');
  const [effet, setEffet] = useState<EffetCarrousel>('fondu');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [lien, setLien] = useState('');
  const [codePromo, setCodePromo] = useState('');
  const [question, setQuestion] = useState('');
  const [choix1, setChoix1] = useState('');
  const [choix2, setChoix2] = useState('');
  const [choix3, setChoix3] = useState('');
  const [compteur, setCompteur] = useState(12);
  const [note, setNote] = useState(5);
  const [auteur, setAuteur] = useState('');
  const [budgetType, setBudgetType] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('jour');
  const [budgetMontant, setBudgetMontant] = useState(10);
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]);
  
  // ── ROUE DE LA FORTUNE ──────────────────────────────────────────────
  const [roueActive, setRoueActive] = useState(false);
  const [codesPromoRoue, setCodesPromoRoue] = useState('');
  const [apercuRoueOuvert, setApercuRoueOuvert] = useState(false);
  
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagesCarrousel, setImagesCarrousel] = useState<File[]>([]);
  const [imagesCarrouselUrl, setImagesCarrouselUrl] = useState<string[]>([]);
  const [imageAvant, setImageAvant] = useState<File | null>(null);
  const [imageAvantUrl, setImageAvantUrl] = useState<string>('');
  const [imageApres, setImageApres] = useState<File | null>(null);
  const [imageApresUrl, setImageApresUrl] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [indexCarrousel, setIndexCarrousel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prixEstime, setPrixEstime] = useState(0.50);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carrouselInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');

  // ── Toggle catégorie ──────────────────────────────────────────────────
  const toggleCategorie = (catId: string) => {
    setCategoriesSelectionnees(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  // ── Calcul du prix estimé ──────────────────────────────────────────────
  useEffect(() => {
    const format = FORMATS.find(f => f.id === typePub);
    if (typePub === 'carrousel') {
      const effetTrouve = EFFETS.find(e => e.id === effet);
      setPrixEstime(effetTrouve?.prix || 0.80);
    } else {
      setPrixEstime(format?.prix || 0.50);
    }
  }, [typePub, effet]);

  // ── Upload image basique ──────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  };

  // ── Upload carrousel ──────────────────────────────────────────────────
  const handleCarrouselChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const total = imagesCarrousel.length + newFiles.length;
    if (total > 5) {
      alert('⚠️ Maximum 5 photos pour le carrousel');
      return;
    }
    setImagesCarrousel(prev => [...prev, ...newFiles]);
    setImagesCarrouselUrl(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };

  // ── Upload avant/après ────────────────────────────────────────────────
  const handleAvantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageAvant(file);
    setImageAvantUrl(URL.createObjectURL(file));
  };

  const handleApresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageApres(file);
    setImageApresUrl(URL.createObjectURL(file));
  };

  // ── Upload vidéo ──────────────────────────────────────────────────────
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('⚠️ Veuillez sélectionner une vidéo');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      alert('⚠️ Vidéo trop grande (max 30 MB)');
      return;
    }
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  // ── Supprimer une photo du carrousel ──────────────────────────────────
  const removeCarrouselImage = (index: number) => {
    setImagesCarrousel(prev => prev.filter((_, i) => i !== index));
    setImagesCarrouselUrl(prev => prev.filter((_, i) => i !== index));
    if (indexCarrousel >= index && indexCarrousel > 0) {
      setIndexCarrousel(indexCarrousel - 1);
    }
  };

  // ── Navigation carrousel ──────────────────────────────────────────────
  const prevSlide = () => {
    setIndexCarrousel(prev => (prev === 0 ? imagesCarrouselUrl.length - 1 : prev - 1));
  };
  const nextSlide = () => {
    setIndexCarrousel(prev => (prev === imagesCarrouselUrl.length - 1 ? 0 : prev + 1));
  };

  // ── Rendu de l'effet carrousel ──────────────────────────────────────
  const renderCarrouselEffet = (urls: string[], index: number, effetActif: EffetCarrousel) => {
    const total = urls.length;
    if (total === 0) return null;

    if (effetActif === 'page' || effetActif === 'flip') {
      const isFront = index % 2 === 0;
      return (
        <div style={{
          perspective: '1000px',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            transform: isFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
            transition: 'transform 0.8s ease',
            transformStyle: 'preserve-3d' as const,
            backfaceVisibility: 'hidden' as const,
            width: '100%',
            height: '100%',
          }}>
            <img src={urls[index]} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
        </div>
      );
    }

    if (effetActif === 'explosion') {
      return (
        <div style={{ opacity: 1, transform: 'scale(1)', transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', width: '100%', height: '100%' }}>
          <img src={urls[index]} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
        </div>
      );
    }

    if (effetActif === 'zoom') {
      return (
        <div style={{ transform: 'scale(1)', transition: 'transform 0.7s ease', width: '100%', height: '100%', overflow: 'hidden' }}>
          <img src={urls[index]} alt={`Slide ${index + 1}`} style={{ width: '110%', height: '110%', objectFit: 'cover', margin: '-5%', transition: 'transform 0.7s ease' }} />
        </div>
      );
    }

    if (effetActif === 'slide') {
      return (
        <div style={{ transform: 'translateX(0)', transition: 'transform 0.6s ease', width: '100%', height: '100%' }}>
          <img src={urls[index]} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
        </div>
      );
    }

    return (
      <div style={{ opacity: 1, transition: 'opacity 0.8s ease', width: '100%', height: '100%' }}>
        <img src={urls[index]} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
      </div>
    );
  };

  // ── Rendu de l'aperçu selon le type ──────────────────────────────────
  const renderApercu = () => {
    if (typePub === 'video' && videoUrl) {
      return (
        <video src={videoUrl} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} controls muted />
      );
    }

    if (typePub === 'avant_apres' && imageAvantUrl && imageApresUrl) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '250px', overflow: 'hidden', borderRadius: '8px' }}>
          <img src={imageAvantUrl} alt="Avant" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '50%',
            height: '100%',
            overflow: 'hidden',
            borderLeft: '3px solid #fff',
          }}>
            <img src={imageApresUrl} alt="Après" style={{ position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      );
    }

    if (typePub === 'parallaxe' && imageUrl) {
      return (
        <div style={{
          width: '100%',
          height: '250px',
          overflow: 'hidden',
          borderRadius: '8px',
          transform: 'perspective(800px) rotateX(5deg)',
          transition: 'transform 0.2s',
        }}>
          <img src={imageUrl} alt="Parallaxe" style={{ width: '120%', height: '120%', objectFit: 'cover', margin: '-10%', transform: 'scale(1.1)' }} />
        </div>
      );
    }

    if (typePub === 'interactive' && imageUrl) {
      return (
        <div style={{ width: '100%', height: '250px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Interactive" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '12px' }}>
            <p style={{ fontSize: '14px', color: '#fff', margin: '0 0 8px' }}>{question || 'Choisissez votre option'}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[choix1, choix2, choix3].filter(c => c).map((c, i) => (
                <button key={i} style={{ padding: '4px 12px', background: THEME.accent, border: 'none', borderRadius: '6px', color: '#000', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (typePub === 'social' && imageUrl) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Social" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '20px', color: '#fff', fontSize: '14px', fontWeight: '700' }}>
            🔥 {compteur} personnes regardent
          </div>
        </div>
      );
    }

    if (typePub === 'minijeu' && imageUrl) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Mini-jeu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '16px 24px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px' }}>🎮</div>
            <p style={{ fontSize: '14px', color: '#fff', margin: '8px 0 0' }}>Trouvez l'intrus !</p>
          </div>
        </div>
      );
    }

    if (typePub === 'codepromo' && imageUrl) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Code promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', padding: '8px 20px', borderRadius: '8px' }}>
            <span style={{ color: THEME.accent, fontSize: '20px', fontWeight: '800', letterSpacing: '2px' }}>
              {codePromo || 'PROMO10'}
            </span>
          </div>
        </div>
      );
    }

    if (typePub === 'temoignage' && imageUrl) {
      return (
        <div style={{ width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <img src={imageUrl} alt="Témoignage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '12px' }}>
            <div style={{ color: THEME.accent, fontSize: '14px', marginBottom: '4px' }}>{'⭐'.repeat(Math.min(note, 5))}</div>
            <p style={{ fontSize: '13px', color: '#fff', margin: '0 0 4px', fontStyle: 'italic' }}>
              "{description || 'Super produit, je recommande !'}"
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>- {auteur || 'Client satisfait'}</p>
          </div>
        </div>
      );
    }

    if (typePub === 'basique' && imageUrl) {
      return <img src={imageUrl} alt="Pub" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />;
    }

    if (typePub === 'carrousel' && imagesCarrouselUrl.length > 0) {
      return renderCarrouselEffet(imagesCarrouselUrl, indexCarrousel, effet);
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: '#555', flexDirection: 'column', background: '#1a1a2e', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px' }}>{FORMATS.find(f => f.id === typePub)?.emoji || '📸'}</div>
        <p style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>Ajoutez des médias</p>
      </div>
    );
  };

  // ── Soumission ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagesUrls: string[] = [];

      const uploadFile = async (file: File, folder: string) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/sponsors/photos/sponsor/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        return data.photo?.url_image;
      };

      if (typePub === 'basique' && image) {
        const url = await uploadFile(image, 'sponsors');
        if (url) imagesUrls.push(url);
      } else if (typePub === 'carrousel' && imagesCarrousel.length > 0) {
        for (const img of imagesCarrousel) {
          const url = await uploadFile(img, 'sponsors');
          if (url) imagesUrls.push(url);
        }
      } else if (typePub === 'video' && videoFile) {
        const url = await uploadFile(videoFile, 'sponsors/videos');
        if (url) imagesUrls.push(url);
      } else if (typePub === 'avant_apres') {
        if (imageAvant) {
          const url = await uploadFile(imageAvant, 'sponsors');
          if (url) imagesUrls.push(url);
        }
        if (imageApres) {
          const url = await uploadFile(imageApres, 'sponsors');
          if (url) imagesUrls.push(url);
        }
      } else if (image) {
        const url = await uploadFile(image, 'sponsors');
        if (url) imagesUrls.push(url);
      }

      const extraData: any = {};
      if (typePub === 'interactive') {
        extraData.question = question;
        extraData.choix = [choix1, choix2, choix3].filter(c => c);
      }
      if (typePub === 'social') {
        extraData.compteur = compteur;
      }
      if (typePub === 'codepromo') {
        extraData.code_promo = codePromo;
      }
      if (typePub === 'temoignage') {
        extraData.note = note;
        extraData.auteur = auteur;
      }

      const response = await fetch('/api/sponsors/pubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titre,
          description,
          url_lien: lien,
          type: typePub,
          effet: typePub === 'carrousel' ? effet : null,
          images: imagesUrls,
          prix_par_click: prixEstime,
          budget_type: budgetType,
          budget_montant: budgetMontant,
          categories: categoriesSelectionnees,
          roue_active: roueActive,
          codes_promo_roue: roueActive ? codesPromoRoue.split(',').map(c => c.trim()).filter(c => c) : [],
          ...extraData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur création pub');
      }

      alert('✅ Publicité créée avec succès !');
      window.location.href = '/sponsor-dashboard?onglet=pubs';
    } catch (error: any) {
      console.error('Erreur création pub:', error);
      alert('❌ Erreur lors de la création : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── RENDU ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', background: THEME.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideIn 0.4s ease forwards; }
        .format-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2);
          transition: all 0.3s;
        }
        .categorie-btn:hover {
          transform: scale(1.05);
          transition: all 0.2s;
        }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              📢 Studio de publicité
            </h1>
            <p style={{ fontSize: '14px', color: THEME.textLight, margin: '4px 0 0' }}>
              Créez votre publicité en quelques clics
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/sponsor-dashboard?onglet=pubs'}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Retour
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* ─── GAUCHE : FORMULAIRE ─────────────────────────────────────── */}
          <div style={{ background: THEME.card, borderRadius: '14px', padding: '24px', border: `1px solid ${THEME.border}` }}>
            <form onSubmit={handleSubmit}>
              {/* Sélection du format */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: THEME.text }}>
                  📸 Format de publicité
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {FORMATS.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setTypePub(f.id)}
                      className="format-card"
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: typePub === f.id ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                        cursor: 'pointer',
                        background: typePub === f.id ? 'rgba(245, 158, 11, 0.05)' : '#fff',
                        textAlign: 'center' as const,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '20px' }}>{f.emoji}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600, lineHeight: 1.1 }}>{f.label}</div>
                      <div style={{ fontSize: '8px', color: THEME.accent, fontWeight: 700 }}>{f.prix}$</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Effets (carrousel uniquement) */}
              {typePub === 'carrousel' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: THEME.text }}>
                    ✨ Effet de transition
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {EFFETS.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => setEffet(e.id)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: effet === e.id ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                          cursor: 'pointer',
                          background: effet === e.id ? 'rgba(245, 158, 11, 0.05)' : '#fff',
                          textAlign: 'center' as const,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: '16px' }}>
                          {e.id === 'fondu' && '🌫️'}
                          {e.id === 'slide' && '➡️'}
                          {e.id === 'page' && '📖'}
                          {e.id === 'zoom' && '🔍'}
                          {e.id === 'flip' && '🃏'}
                          {e.id === 'explosion' && '💥'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600 }}>{e.label}</div>
                        <div style={{ fontSize: '9px', color: THEME.accent, fontWeight: 700 }}>{e.prix}$</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload média */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: THEME.text }}>
                  {typePub === 'video' ? '🎬 Vidéo (max 30s)' : 
                   typePub === 'avant_apres' ? '🔄 Images Avant/Après' :
                   typePub === 'carrousel' ? '📸 Images (max 5)' : 
                   '📸 Image'}
                </label>

                {typePub === 'video' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        border: '2px dashed #ddd',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: videoUrl ? 'rgba(245, 158, 11, 0.05)' : '#fafafa',
                      }}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      {videoUrl ? (
                        <div>
                          <video src={videoUrl} style={{ maxHeight: '80px', borderRadius: '8px' }} controls muted />
                          <p style={{ fontSize: '12px', color: THEME.accent, marginTop: '4px' }}>✅ Vidéo sélectionnée</p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '32px' }}>🎬</div>
                          <p style={{ fontSize: '13px', color: THEME.textLight }}>Cliquez pour choisir une vidéo</p>
                          <p style={{ fontSize: '11px', color: THEME.textLight }}>MP4, MOV • Max 30 MB</p>
                        </div>
                      )}
                      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
                    </div>
                  </div>
                )}

                {typePub === 'avant_apres' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      style={{
                        border: '2px dashed #ddd',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: imageAvantUrl ? 'rgba(245, 158, 11, 0.05)' : '#fafafa',
                      }}
                      onClick={() => document.getElementById('avantInput')?.click()}
                    >
                      {imageAvantUrl ? (
                        <div>
                          <img src={imageAvantUrl} alt="Avant" style={{ maxHeight: '60px', borderRadius: '4px' }} />
                          <p style={{ fontSize: '10px', color: THEME.accent }}>✅ Avant</p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '20px' }}>⬅️</div>
                          <p style={{ fontSize: '11px', color: THEME.textLight }}>Avant</p>
                        </div>
                      )}
                      <input id="avantInput" type="file" accept="image/*" onChange={handleAvantChange} style={{ display: 'none' }} />
                    </div>
                    <div
                      style={{
                        border: '2px dashed #ddd',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: imageApresUrl ? 'rgba(245, 158, 11, 0.05)' : '#fafafa',
                      }}
                      onClick={() => document.getElementById('apresInput')?.click()}
                    >
                      {imageApresUrl ? (
                        <div>
                          <img src={imageApresUrl} alt="Après" style={{ maxHeight: '60px', borderRadius: '4px' }} />
                          <p style={{ fontSize: '10px', color: THEME.accent }}>✅ Après</p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '20px' }}>➡️</div>
                          <p style={{ fontSize: '11px', color: THEME.textLight }}>Après</p>
                        </div>
                      )}
                      <input id="apresInput" type="file" accept="image/*" onChange={handleApresChange} style={{ display: 'none' }} />
                    </div>
                  </div>
                )}

                {typePub === 'carrousel' && (
                  <div>
                    <div
                      style={{
                        border: '2px dashed #ddd',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#fafafa',
                      }}
                      onClick={() => carrouselInputRef.current?.click()}
                    >
                      <div style={{ fontSize: '20px' }}>📤</div>
                      <p style={{ fontSize: '12px', color: THEME.textLight }}>Ajouter ({imagesCarrousel.length}/5)</p>
                      <input ref={carrouselInputRef} type="file" accept="image/*" multiple onChange={handleCarrouselChange} style={{ display: 'none' }} />
                    </div>
                    {imagesCarrouselUrl.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {imagesCarrouselUrl.map((url, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img src={url} alt={`img-${idx}`} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                            <button onClick={() => removeCarrouselImage(idx)} style={{ position: 'absolute', top: '-4px', right: '-4px', background: THEME.danger, color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {typePub !== 'video' && typePub !== 'avant_apres' && typePub !== 'carrousel' && (
                  <div
                    style={{
                      border: '2px dashed #ddd',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: imageUrl ? 'rgba(245, 158, 11, 0.05)' : '#fafafa',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUrl ? (
                      <div>
                        <img src={imageUrl} alt="Aperçu" style={{ maxHeight: '80px', borderRadius: '8px' }} />
                        <p style={{ fontSize: '12px', color: THEME.accent, marginTop: '4px' }}>✅ Image sélectionnée</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '32px' }}>📤</div>
                        <p style={{ fontSize: '13px', color: THEME.textLight }}>Cliquez pour choisir une image</p>
                        <p style={{ fontSize: '11px', color: THEME.textLight }}>JPG, PNG, WEBP • Max 5 MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>
                )}
              </div>

              {/* ── CIBLAGE PAR CATÉGORIE ────────────────────────────────── */}
              <div style={{ marginBottom: '20px', background: '#f0f9ff', padding: '16px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#0369a1' }}>
                  🎯 Cibler les catégories de sites
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                  {CATEGORIES_SITES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategorie(cat.id)}
                      className="categorie-btn"
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: categoriesSelectionnees.includes(cat.id) ? '2px solid #f59e0b' : '1px solid #d1d5db',
                        background: categoriesSelectionnees.includes(cat.id) ? 'rgba(245, 158, 11, 0.1)' : '#fff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>{cat.emoji}</div>
                      <div style={{ fontSize: '9px', fontWeight: categoriesSelectionnees.includes(cat.id) ? 700 : 400 }}>
                        {cat.label}
                      </div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  {categoriesSelectionnees.length === 0 ? '🌍 Aucune catégorie sélectionnée → la pub apparaît partout' :
                   `✅ ${categoriesSelectionnees.length} catégorie(s) sélectionnée(s)`}
                </p>
              </div>

              {/* ── ROUE DE LA FORTUNE ────────────────────────────────────── */}
              <div style={{ marginBottom: '20px', background: '#fef3c7', padding: '16px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#92400e' }}>
                  🎡 Roue de la fortune
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRoueActive(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: roueActive ? '2px solid #f59e0b' : '1px solid #d1d5db',
                      background: roueActive ? 'rgba(245, 158, 11, 0.1)' : '#fff',
                      cursor: 'pointer',
                      fontWeight: roueActive ? 700 : 400,
                      color: roueActive ? '#92400e' : '#666',
                    }}
                  >
                    ✅ Activée
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoueActive(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: !roueActive ? '2px solid #f59e0b' : '1px solid #d1d5db',
                      background: !roueActive ? 'rgba(245, 158, 11, 0.1)' : '#fff',
                      cursor: 'pointer',
                      fontWeight: !roueActive ? 700 : 400,
                      color: !roueActive ? '#92400e' : '#666',
                    }}
                  >
                    ❌ Désactivée
                  </button>
                </div>

                {roueActive && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#666' }}>
                      🎁 Codes promo disponibles (séparés par des virgules) :
                    </p>
                    <input
                      type="text"
                      value={codesPromoRoue}
                      onChange={(e) => setCodesPromoRoue(e.target.value)}
                      placeholder="PROMO10, PROMO20, GRATUIT, CADEAN"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none',
                        marginTop: '4px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setApercuRoueOuvert(true)}
                        style={{
                          padding: '6px 14px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                      >
                        🎡 Prévisualiser la roue
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      📊 Les statistiques de la roue seront visibles dans le dashboard
                    </p>
                  </div>
                )}
              </div>

              {/* Champs spécifiques selon le type */}
              {typePub === 'interactive' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>❓ Question</label>
                    <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Quelle offre vous intéresse ?" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" value={choix1} onChange={(e) => setChoix1(e.target.value)} placeholder="Option 1" style={{ padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                    <input type="text" value={choix2} onChange={(e) => setChoix2(e.target.value)} placeholder="Option 2" style={{ padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                    <input type="text" value={choix3} onChange={(e) => setChoix3(e.target.value)} placeholder="Option 3" style={{ padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                </>
              )}

              {typePub === 'social' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>🔥 Nombre de personnes (social proof)</label>
                  <input type="number" value={compteur} onChange={(e) => setCompteur(parseInt(e.target.value) || 0)} min={1} max={999} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                </div>
              )}

              {typePub === 'codepromo' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>🏷️ Code promo</label>
                  <input type="text" value={codePromo} onChange={(e) => setCodePromo(e.target.value.toUpperCase())} placeholder="PROMO10" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none', textTransform: 'uppercase', letterSpacing: '2px' }} />
                </div>
              )}

              {typePub === 'temoignage' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>⭐ Note (1-5)</label>
                    <input type="number" value={note} onChange={(e) => setNote(Math.min(5, Math.max(1, parseInt(e.target.value) || 5)))} min={1} max={5} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>👤 Auteur du témoignage</label>
                    <input type="text" value={auteur} onChange={(e) => setAuteur(e.target.value)} placeholder="Marie D." style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                </>
              )}

              {/* Titre */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>📝 Titre (max 40)</label>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 40))} placeholder="Titre accrocheur" required style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                <div style={{ fontSize: '10px', color: '#999', textAlign: 'right' }}>{titre.length}/40</div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>📄 Description (max 90)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 90))} placeholder="Description..." rows={2} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                <div style={{ fontSize: '10px', color: '#999', textAlign: 'right' }}>{description.length}/90</div>
              </div>

              {/* Lien */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: THEME.text }}>🔗 Lien</label>
                <input type="url" value={lien} onChange={(e) => setLien(e.target.value)} placeholder="https://..." required style={{ width: '100%', padding: '8px 12px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>

              {/* ── BUDGET ── */}
              <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#166534' }}>
                  💰 Budget de la publicité
                </label>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {['jour', 'semaine', 'mois', 'annee'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBudgetType(type as any)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: budgetType === type ? '2px solid #16a34a' : '1px solid #d1d5db',
                        background: budgetType === type ? '#dcfce7' : '#fff',
                        color: budgetType === type ? '#166534' : '#666',
                        fontWeight: budgetType === type ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {type === 'jour' && '📅 Jour'}
                      {type === 'semaine' && '📆 Semaine'}
                      {type === 'mois' && '📊 Mois'}
                      {type === 'annee' && '📈 Année'}
                    </button>
                  ))}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>$</span>
                  <input
                    type="number"
                    value={budgetMontant}
                    onChange={(e) => setBudgetMontant(parseFloat(e.target.value) || 0)}
                    min={1}
                    step={1}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {budgetType === 'jour' && '/ jour'}
                    {budgetType === 'semaine' && '/ semaine'}
                    {budgetType === 'mois' && '/ mois'}
                    {budgetType === 'annee' && '/ année'}
                  </span>
                </div>
                
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  ✅ La publicité s'arrêtera automatiquement lorsque le budget sera atteint
                </p>
              </div>

              {/* Prix estimé */}
              <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>💰 Prix estimé par clic</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{prixEstime.toFixed(2)}$ CAD</span>
              </div>

              {/* Bouton publier */}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#000', fontSize: '15px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳ Publication...' : '📤 Publier'}
              </button>
            </form>
          </div>

          {/* ─── DROITE : APERÇU ────────────────────────────────────────── */}
          <div style={{ background: THEME.card, borderRadius: '14px', padding: '24px', border: `1px solid ${THEME.border}`, position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👁️ Aperçu en direct
            </h3>

            <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, position: 'relative', height: '250px', background: '#111' }}>
                {renderApercu()}
              </div>

              <div style={{ padding: '14px 16px', flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>
                  {titre || 'Titre de la publicité'}
                </h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                  {description || 'Description de votre offre...'}
                </p>
                <button style={{ padding: '6px 14px', background: THEME.accent, border: 'none', borderRadius: '6px', color: '#000', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  🔗 En savoir plus
                </button>
                {roueActive && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#f59e0b' }}>
                    🎡 Roue de la fortune activée !
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '12px' }}>
                  <span>⭐ e-Vend Studio</span>
                  <span>💰 {prixEstime.toFixed(2)}$/clic</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11px', color: THEME.textLight, textAlign: 'center' }}>
              ⚡ Modifications en temps réel
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE PRÉVISUALISATION DE LA ROUE ────────────────────── */}
      {apercuRoueOuvert && (
        <RoueFortune
          codes={codesPromoRoue.split(',').map(c => c.trim()).filter(c => c) || ['PROMO10', 'PROMO20', 'GRATUIT']}
          onWin={(code) => {
            alert(`🎉 Aperçu : Vous avez gagné ${code} ! (Ceci est une simulation)`);
            setApercuRoueOuvert(false);
          }}
          onClose={() => setApercuRoueOuvert(false)}
          sponsorName="Aperçu - e-Vend Studio"
        />
      )}
    </div>
  );
}

export default SponsorPubsCreer;