import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// ── Fonction pour générer l'URL Shopify à partir du nom (comme dans ListeProduits) ──
const generateShopifyUrl = (nom, id) => {
  const slug = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `https://e-vend.ca/products/${slug}`;
};

// ── Parser les images (supporte string JSON, array PostgreSQL {url1,url2}, ou array JS) ──
const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string') {
    // Format PostgreSQL array: {url1,url2}
    if (images.startsWith('{') && images.endsWith('}')) {
      return images.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
    // Format JSON: ["url1","url2"]
    try { return JSON.parse(images).filter(Boolean); } catch {}
  }
  return [];
};

// ── Composant accordion Blog ──────────────────────────────────────────────────
function BlogArticle({ article }) {
    const [ouvert, setOuvert] = React.useState(false);
    const tags = Array.isArray(article.tags) ? article.tags
        : typeof article.tags === 'string' ? (article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
        : [];
    const dateAffichee = article.date_publication || article.date_creation || article.created_at;
    
    return (
        <div style={{ border: `1px solid ${ouvert ? '#537373' : '#e1e3e5'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8f9fa', transition: 'border-color 0.2s' }}>
            <div style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }} onClick={() => setOuvert(!ouvert)}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#2c3e50' }}>{article.titre}</h3>
                    {!ouvert && (
                        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                            {article.contenu.replace(/<[^>]*>/g, '').slice(0, 160)}...
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {dateAffichee && <span style={{ fontSize: '12px', color: '#999' }}>📅 {new Date(dateAffichee).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        {article.vues > 0 && <span style={{ fontSize: '12px', color: '#999' }}>👁 {article.vues} vue{article.vues > 1 ? 's' : ''}</span>}
                        {tags.map(tag => (
                            <span key={tag} style={{ backgroundColor: '#eef3f3', color: '#537373', padding: '1px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>#{tag}</span>
                        ))}
                    </div>
                </div>
                <span style={{ fontSize: '18px', color: '#537373', flexShrink: 0, marginTop: '4px' }}>{ouvert ? '▲' : '▼'}</span>
            </div>
            {ouvert && (
                <div style={{ 
                    borderTop: '1px solid #e1e3e5', 
                    padding: '20px', 
                    fontSize: '15px', 
                    lineHeight: '1.8', 
                    color: '#444'
                }}>
                    <style>{`
                        .blog-contenu img {
                            max-width: 100% !important;
                            height: auto !important;
                            max-height: 400px !important;
                            object-fit: contain !important;
                            borderRadius: 12px !important;
                            margin: 15px 0 !important;
                            boxShadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                            display: block !important;
                        }
                        .blog-contenu p {
                            margin-bottom: 15px !important;
                        }
                        .blog-contenu h1, .blog-contenu h2, .blog-contenu h3 {
                            color: #2c3e50 !important;
                            margin-top: 20px !important;
                            margin-bottom: 10px !important;
                        }
                    `}</style>
                    <div 
                        className="blog-contenu"
                        dangerouslySetInnerHTML={{ __html: article.contenu }} 
                    />
                </div>
            )}
        </div>
    );
}

function BlogListe({ articles }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {articles.map(a => <BlogArticle key={a.id} article={a} />)}
        </div>
    );
}

function FaqItem({ item }) {
    const [ouvert, setOuvert] = React.useState(false);
    return (
        <div onClick={() => setOuvert(!ouvert)}
            style={{ border: `1px solid ${ouvert ? '#537373' : '#e1e3e5'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: ouvert ? '#f0f5f5' : '#f8f9fa', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: ouvert ? '#537373' : '#2c3e50', flex: 1 }}>
                    ❓ {item.question}
                </h3>
                <span style={{ fontSize: '18px', color: '#537373', flexShrink: 0, transition: 'transform 0.2s', transform: ouvert ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
            {ouvert && (
                <div style={{ borderTop: '1px solid #e1e3e5', padding: '14px 20px' }}>
                    <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', margin: 0 }}>
                        💬 {item.reponse}
                    </p>
                </div>
            )}
        </div>
    );
}

function FaqListe({ items }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, i) => <FaqItem key={item.id || i} item={item} />)}
        </div>
    );
}

// ── Composant pour afficher les badges du vendeur ──────────────────────────────────
function BadgesVendeur({ vendeurId }) {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        parNiveau: { niveau1: 0, niveau2: 0, niveau3: 0, niveau4: 0, niveau5: 0 }
    });

    useEffect(() => {
        const chargerBadges = async () => {
            try {
                setLoading(true);
                const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/boutique-publique/vendeur/${vendeurId}/badges`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setBadges([]);
                        setLoading(false);
                        return;
                    }
                    throw new Error(`Erreur ${response.status}`);
                }
                
                const data = await response.json();
                const badgesData = Array.isArray(data) ? data : (data.badges || []);
                
                const parNiveau = {
                    niveau1: 0,
                    niveau2: 0,
                    niveau3: 0,
                    niveau4: 0,
                    niveau5: 0
                };
                
                badgesData.forEach(badge => {
                    const niveau = badge.badge?.niveau || 1;
                    if (niveau === 1) parNiveau.niveau1++;
                    else if (niveau === 2) parNiveau.niveau2++;
                    else if (niveau === 3) parNiveau.niveau3++;
                    else if (niveau === 4) parNiveau.niveau4++;
                    else if (niveau === 5) parNiveau.niveau5++;
                });
                
                setBadges(badgesData);
                setStats({
                    total: badgesData.length,
                    parNiveau
                });
                
            } catch (err) {
                console.error('Erreur chargement badges:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (vendeurId) {
            chargerBadges();
        }
    }, [vendeurId]);

    const getNiveauCouleur = (niveau) => {
        switch(niveau) {
            case 1: return '#27AE60';
            case 2: return '#3498DB';
            case 3: return '#9B59B6';
            case 4: return '#F39C12';
            case 5: return '#E74C3C';
            default: return '#95A5A6';
        }
    };

    const CarteBadge = ({ badge }) => {
        const [isHovered, setIsHovered] = useState(false);
        
        return (
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: isHovered 
                        ? '0 12px 24px rgba(0,0,0,0.12)' 
                        : '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${badge.badge?.couleur || '#e1e4e8'}20`,
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    cursor: 'pointer'
                }}
            >
                <div style={{
                    fontSize: '56px',
                    textAlign: 'center',
                    marginTop: '8px',
                    marginBottom: '24px'
                }}>
                    {badge.badge?.icone || '🏅'}
                </div>
                
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: getNiveauCouleur(badge.badge?.niveau || 1),
                    color: 'white',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    Niv. {badge.badge?.niveau || 1}
                </div>
                
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: '0 0 8px 0',
                    marginTop: '8px',
                    color: '#1a2332',
                    textAlign: 'center'
                }}>
                    {badge.badge?.nom || 'Badge'}
                </h3>
                
                <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: '0 0 12px 0',
                    textAlign: 'center',
                    lineHeight: '1.4'
                }}>
                    {badge.badge?.description || ''}
                </p>
                
                {badge.badge?.critere && (
                    <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginTop: '12px',
                        fontSize: '11px',
                        color: '#475569',
                        textAlign: 'center'
                    }}>
                        🎯 {badge.badge.critere}
                    </div>
                )}
                
                {badge.date_attribution && (
                    <div style={{
                        marginTop: '12px',
                        fontSize: '11px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        borderTop: '1px solid #f0f0f0',
                        paddingTop: '12px'
                    }}>
                        Obtenu le {new Date(badge.date_attribution).toLocaleDateString('fr-CA')}
                    </div>
                )}
                
                {isHovered && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${badge.badge?.couleur || '#537373'}10, transparent)`,
                        pointerEvents: 'none'
                    }} />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #537373',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                }}></div>
                <p style={{ color: '#666' }}>Chargement des badges...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#e74c3c' }}>
                <span style={{ fontSize: '48px' }}>⚠️</span>
                <p>Impossible de charger les badges.</p>
            </div>
        );
    }

    if (badges.length === 0) {
        return (
            <div style={{
                backgroundColor: '#E6E6E6',
                borderRadius: '16px',
                padding: '60px 20px',
                border: '1px solid #e1e3e5',
                textAlign: 'center'
            }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px', opacity: 0.5 }}>🏅</span>
                <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '10px' }}>Aucun badge pour le moment</h3>
                <p style={{ color: '#666' }}>
                    Ce vendeur n'a pas encore reçu de badges. 
                    Les badges sont attribués par l'administration pour récompenser 
                    les performances et l'engagement.
                </p>
            </div>
        );
    }

    const badgesParNiveau = {
        niveau1: badges.filter(b => b.badge?.niveau === 1),
        niveau2: badges.filter(b => b.badge?.niveau === 2),
        niveau3: badges.filter(b => b.badge?.niveau === 3),
        niveau4: badges.filter(b => b.badge?.niveau === 4),
        niveau5: badges.filter(b => b.badge?.niveau === 5)
    };

    const niveauxTitres = {
        niveau1: { titre: '🌟 Débutant', couleur: '#27AE60', description: 'Les premiers pas' },
        niveau2: { titre: '⭐ Intermédiaire', couleur: '#3498DB', description: 'Vous progressez' },
        niveau3: { titre: '🏆 Avancé', couleur: '#9B59B6', description: 'Un vendeur confirmé' },
        niveau4: { titre: '👑 Expert', couleur: '#F39C12', description: 'Expert reconnu' },
        niveau5: { titre: '💎 Maître', couleur: '#E74C3C', description: 'L\'élite des vendeurs' }
    };

    return (
        <div style={{
            backgroundColor: '#E6E6E6',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #e1e3e5',
            boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
        }}>
            <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 0 24px 0',
                color: '#2c3e50',
                borderBottom: '2px solid #537373',
                paddingBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '28px' }}>🏅</span>
                Badges et distinctions
            </h2>

            <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: '#537373',
                    lineHeight: 1
                }}>
                    {stats.total}
                </div>
                <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
                    badge{stats.total > 1 ? 's' : ''} obtenu{stats.total > 1 ? 's' : ''}
                </p>
            </div>

            {Object.entries(badgesParNiveau).map(([niveauKey, badgesList]) => {
                if (badgesList.length === 0) return null;
                const niveauInfo = niveauxTitres[niveauKey];
                
                return (
                    <div key={niveauKey} style={{ marginBottom: '32px' }}>
                        <div style={{
                            borderLeft: `4px solid ${niveauInfo.couleur}`,
                            paddingLeft: '16px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                margin: 0,
                                color: '#2c3e50'
                            }}>
                                {niveauInfo.titre}
                            </h3>
                            <p style={{
                                fontSize: '13px',
                                color: '#666',
                                margin: '4px 0 0 0'
                            }}>
                                {niveauInfo.description}
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {badgesList.map((badge) => (
                                <CarteBadge key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function BoutiquePublique() {
    const { vendeurId } = useParams();
    const [ongletActif, setOngletActif] = useState('produits');
    const [sousOngletAvis, setSousOngletAvis] = useState('produits');
    const [boutiqueData, setBoutiqueData] = useState(null);
    const [configGlobale, setConfigGlobale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [produitsPage, setProduitsPage] = useState(1);
    const [produitsParPage, setProduitsParPage] = useState(12);
    const [triProduits, setTriProduits] = useState('date_desc');
    const [recherche, setRecherche] = useState('');
    const [filtres, setFiltres] = useState({
        categories: [],
        tags: []
    });
    const [modalAvisOuvert, setModalAvisOuvert] = useState(false);
    const [typeAvis, setTypeAvis] = useState('vendeur');
    const [produitSelectionne, setProduitSelectionne] = useState(null);
    const [modalSignalerOuvert, setModalSignalerOuvert] = useState(false);
    const [menuBoutonsOuvert, setMenuBoutonsOuvert] = useState(false);
    const [filtreCatMobileOuvert, setFiltreCatMobileOuvert] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    React.useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    const [formAvis, setFormAvis] = useState({
        nom: '',
        email: '',
        note_globale: 5,
        qualite_detail: 5,
        prix_raisonnable: 5,
        vitesse_expedition: 5,
        qualite_discution: 5,
        titre: '',
        commentaire: '',
        produit_id: null
    });
    const [formSignaler, setFormSignaler] = useState({
        nom: '',
        email: '',
        raison_type: 'produit_fake',
        raison_autre: '',
        description: ''
    });
    const [messageSucces, setMessageSucces] = useState('');
    const [messageErreur, setMessageErreur] = useState('');
    
    // États pour les favoris
    const [estFavori, setEstFavori] = useState(false);
    const [loadingFavori, setLoadingFavori] = useState(false);
    const [messageFavori, setMessageFavori] = useState('');
    const [acheteurId, setAcheteurId] = useState(null);

    useEffect(() => {
        document.body.style.backgroundColor = '#DCD7C9';
        document.documentElement.style.backgroundColor = '#DCD7C9';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.minHeight = '100vh';
        
        return () => {
            document.body.style.backgroundColor = '';
            document.documentElement.style.backgroundColor = '';
        };
    }, []);

    // Récupérer l'acheteur connecté
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('https://evend-multivendeur-api.onrender.com/api/auth/verify', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.role === 'acheteur') {
                    setAcheteurId(data.user.id);
                }
            })
            .catch(err => console.error('Erreur vérification acheteur:', err));
        }
    }, []);

    useEffect(() => {
        const id = window.location.pathname.split('/').pop();
        console.log('🆔 ID from URL:', id);
        
        Promise.all([
            fetch(`https://evend-multivendeur-api.onrender.com/api/boutique-publique/vendeur/${id}`),
            fetch(`https://evend-multivendeur-api.onrender.com/api/admin/configuration/config-publique`).catch(() => null)
        ])
        .then(async ([boutiqueRes, configRes]) => {
            if (!boutiqueRes.ok) {
                const err = await boutiqueRes.json().catch(() => ({ error: `Erreur ${boutiqueRes.status}` }));
                throw new Error(err.error || `Erreur ${boutiqueRes.status}`);
            }
            const boutiqueData = await boutiqueRes.json();
            
            let configData = null;
            if (configRes && configRes.ok) {
                configData = await configRes.json();
                console.log('✅ Configuration globale chargée:', configData);
            } else {
                console.log('ℹ️ Aucune configuration globale trouvée');
            }
            
            console.log('✅ Données boutique reçues:', boutiqueData);
            
            // Parser les images de chaque produit (PostgreSQL retourne parfois {url1,url2} au lieu d'un array)
            if (boutiqueData?.produits) {
                boutiqueData.produits = boutiqueData.produits.map(p => ({
                    ...p,
                    images: parseImages(p.images)
                }));
            }
            
            setBoutiqueData(boutiqueData);
            setConfigGlobale(configData);
            setLoading(false);
        })
        .catch(err => {
            console.error('❌ Erreur:', err);
            setError(err.message);
            setLoading(false);
        });
    }, []);

    // Vérifier si le vendeur est favori
    const verifierFavori = async () => {
        if (!acheteurId || !boutiqueData?.vendeur?.id) return;
        
        try {
            const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/favoris/vendeur/${boutiqueData.vendeur.id}/favori/check`, {
                headers: {
                    'x-acheteur-id': acheteurId
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setEstFavori(data.isFavori);
            }
        } catch (error) {
            console.error('Erreur vérification favori:', error);
        }
    };

    // Appeler la vérification quand les données sont chargées
    useEffect(() => {
        if (boutiqueData?.vendeur?.id && acheteurId) {
            verifierFavori();
        }
    }, [boutiqueData, acheteurId]);

    // Gérer l'ajout/retrait des favoris
    const gererFavori = async () => {
        if (!acheteurId) {
            setMessageFavori('Vous devez être connecté en tant qu\'acheteur');
            setTimeout(() => setMessageFavori(''), 3000);
            return;
        }
        
        setLoadingFavori(true);
        
        try {
            const url = `https://evend-multivendeur-api.onrender.com/api/favoris/vendeur/${boutiqueData.vendeur.id}/favori`;
            const method = estFavori ? 'DELETE' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-acheteur-id': acheteurId
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setEstFavori(!estFavori);
                setMessageFavori(estFavori ? '❌ Vendeur retiré des favoris' : '❤️ Vendeur ajouté aux favoris');
                setTimeout(() => setMessageFavori(''), 3000);
            } else {
                setMessageFavori(data.error || 'Erreur lors de l\'opération');
                setTimeout(() => setMessageFavori(''), 3000);
            }
        } catch (error) {
            console.error('Erreur gestion favori:', error);
            setMessageFavori('Erreur de connexion');
            setTimeout(() => setMessageFavori(''), 3000);
        } finally {
            setLoadingFavori(false);
        }
    };

    const getBanniereStyle = () => {
        if (boutiqueData?.vendeur?.banniere_url) {
            console.log('🎨 Utilisation bannière vendeur:', boutiqueData.vendeur.banniere_url);
            return {
                type: 'image',
                url: boutiqueData.vendeur.banniere_url,
                source: 'vendeur'
            };
        }
        
        if (configGlobale?.banniere_defaut_url) {
            console.log('🎨 Utilisation bannière admin par défaut:', configGlobale.banniere_defaut_url);
            return {
                type: 'image',
                url: configGlobale.banniere_defaut_url,
                source: 'admin'
            };
        }
        
        console.log('🎨 Utilisation bannière par défaut (dégradé)');
        return {
            type: 'gradient',
            gradient: 'linear-gradient(135deg, #2c3e50, #537373, #70a9a1)',
            source: 'default'
        };
    };

    const getLogoContent = () => {
        if (boutiqueData?.vendeur?.logo_url) {
            console.log('🎨 Utilisation logo vendeur:', boutiqueData.vendeur.logo_url);
            return {
                type: 'image',
                url: boutiqueData.vendeur.logo_url,
                source: 'vendeur'
            };
        }
        
        if (configGlobale?.logo_defaut_url) {
            console.log('🎨 Utilisation logo admin par défaut:', configGlobale.logo_defaut_url);
            return {
                type: 'image',
                url: configGlobale.logo_defaut_url,
                source: 'admin'
            };
        }
        
        console.log('🎨 Utilisation logo par défaut (🏪)');
        return {
            type: 'emoji',
            content: '🏪',
            background: 'linear-gradient(135deg, #537373, #70a9a1)',
            source: 'default'
        };
    };

    const soumettreAvis = (e) => {
        e.preventDefault();
        setMessageErreur('');
        setMessageSucces('');

        const url = typeAvis === 'vendeur' 
            ? 'https://evend-multivendeur-api.onrender.com/api/boutique-publique/avis'
            : 'https://evend-multivendeur-api.onrender.com/api/boutique-publique/avis-produit';

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formAvis,
                vendeur_id: boutiqueData.vendeur.id,
                produit_id: formAvis.produit_id
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setMessageSucces('Votre avis a été envoyé! Merci.');
                setModalAvisOuvert(false);
                setFormAvis({
                    nom: '', email: '', note_globale: 5,
                    qualite_detail: 5, prix_raisonnable: 5,
                    vitesse_expedition: 5, qualite_discution: 5,
                    titre: '', commentaire: '',
                    produit_id: null
                });
            } else {
                setMessageErreur(data.error || 'Erreur lors de l\'envoi');
            }
        })
        .catch(err => {
            setMessageErreur('Erreur: ' + err.message);
        });
    };

    const ouvrirModalAvisProduit = (produit) => {
        setTypeAvis('produit');
        setProduitSelectionne(produit);
        setFormAvis({...formAvis, produit_id: produit.id});
        setModalAvisOuvert(true);
    };

    const ouvrirModalAvisVendeur = () => {
        setTypeAvis('vendeur');
        setProduitSelectionne(null);
        setFormAvis({...formAvis, produit_id: null});
        setModalAvisOuvert(true);
    };

    const soumettreSignaler = (e) => {
        e.preventDefault();
        setMessageErreur('');
        setMessageSucces('');

        fetch('https://evend-multivendeur-api.onrender.com/api/boutique-publique/signaler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formSignaler,
                vendeur_id: boutiqueData.vendeur.id
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setMessageSucces('Signalement envoyé. Merci de votre aide!');
                setModalSignalerOuvert(false);
                setFormSignaler({
                    nom: '', email: '', raison_type: 'produit_fake',
                    raison_autre: '', description: ''
                });
            } else {
                setMessageErreur(data.error || 'Erreur lors de l\'envoi');
            }
        })
        .catch(err => {
            setMessageErreur('Erreur: ' + err.message);
        });
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#DCD7C9'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #537373',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                }}></div>
                <p style={{ color: '#666', fontSize: '16px' }}>Chargement de la boutique...</p>
            </div>
        );
    }

    if (error || !boutiqueData || !boutiqueData.vendeur) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#DCD7C9'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏪</div>
                <h2 style={{ fontSize: '24px', color: '#e74c3c', marginBottom: '8px' }}>Boutique non trouvée</h2>
                <p style={{ color: '#666' }}>La boutique que vous recherchez n'existe pas.</p>
                {error && <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Erreur: {error}</p>}
            </div>
        );
    }

    const vendeur = boutiqueData.vendeur;
    const banniere = getBanniereStyle();
    const logo = getLogoContent();

    const getProduitsTries = () => {
        let produits = [...(boutiqueData.produits || [])];
        
        if (recherche) {
            produits = produits.filter(p => 
                p.nom?.toLowerCase().includes(recherche.toLowerCase())
            );
        }
        
        if (filtres.categories.length > 0) {
            produits = produits.filter(p => 
                filtres.categories.includes(p.categorie_id)
            );
        }
        
        if (filtres.tags.length > 0) {
            produits = produits.filter(p => {
                const produitTags = p.tags || [];
                return produitTags.some(tag => filtres.tags.includes(tag.id));
            });
        }
        
        switch(triProduits) {
            case 'nom_asc':
                produits.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
                break;
            case 'nom_desc':
                produits.sort((a, b) => (b.nom || '').localeCompare(a.nom || ''));
                break;
            case 'prix_asc':
                produits.sort((a, b) => (a.prix || 0) - (b.prix || 0));
                break;
            case 'prix_desc':
                produits.sort((a, b) => (b.prix || 0) - (a.prix || 0));
                break;
            case 'date_asc':
                produits.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
                break;
            case 'date_desc':
            default:
                produits.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
        }
        
        return produits;
    };

    const produitsFiltres = getProduitsTries();
    const totalPages = Math.ceil(produitsFiltres.length / produitsParPage);
    const produitsPagination = produitsFiltres.slice(
        (produitsPage - 1) * produitsParPage,
        produitsPage * produitsParPage
    );

    const onglets = [
        { id: 'produits', label: '🛍️ Produits', count: boutiqueData.produits?.length || 0 },
        { id: 'avis', label: '⭐ Avis', count: (boutiqueData.avis?.length || 0) + (boutiqueData.avis_produits?.length || 0) },
        { id: 'description', label: '📝 Description' },
        { id: 'politique', label: '📋 Politique' },
        { id: 'blog', label: '📰 Blog', count: boutiqueData.blog?.length || 0 },
        { id: 'faq', label: '❓ FAQ', count: boutiqueData.faq?.length || 0 },
        { id: 'badges', label: '🏅 Badges' },
        { id: 'en-savoir-plus', label: '➕ En savoir plus' }
    ];

    const renderEtoiles = (note) => {
        const noteValue = parseFloat(note) || 0;
        const etoilesPleines = Math.floor(noteValue);
        const demiEtoile = noteValue - etoilesPleines >= 0.5;
        const etoilesVides = 5 - etoilesPleines - (demiEtoile ? 1 : 0);
        
        return (
            <span style={{ display: 'inline-flex', gap: '2px' }}>
                {[...Array(etoilesPleines)].map((_, i) => (
                    <span key={`plein-${i}`} style={{ color: '#f1c40f' }}>★</span>
                ))}
                {demiEtoile && <span style={{ color: '#f1c40f', fontSize: '20px' }}>½</span>}
                {[...Array(etoilesVides)].map((_, i) => (
                    <span key={`vide-${i}`} style={{ color: '#ddd' }}>☆</span>
                ))}
            </span>
        );
    };

    const renderEtoilesInput = (name, valeur, setter) => {
        return (
            <div style={{ display: 'flex', gap: '5px' }}>
                {[1, 2, 3, 4, 5].map(etoile => (
                    <span
                        key={etoile}
                        style={{
                            fontSize: '24px',
                            color: etoile <= valeur ? '#f1c40f' : '#ddd',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease'
                        }}
                        onClick={() => setter({...formAvis, [name]: etoile})}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const getNoteMoyenneSecurisee = () => {
        if (typeof vendeur.note_moyenne === 'number') return vendeur.note_moyenne;
        if (vendeur.note_moyenne) return parseFloat(vendeur.note_moyenne) || 5.0;
        return 5.0;
    };

    const noteMoyennePrincipale = getNoteMoyenneSecurisee();

    const renderContenu = () => {
        switch (ongletActif) {
            case 'produits':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        {/* ... contenu produits existant ... */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#666' }}>Trier par:</span>
                                    <select 
                                        style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                        value={triProduits}
                                        onChange={(e) => setTriProduits(e.target.value)}
                                    >
                                        <option value="date_desc">Date décroissante</option>
                                        <option value="date_asc">Date croissante</option>
                                        <option value="nom_asc">Nom A-Z</option>
                                        <option value="nom_desc">Nom Z-A</option>
                                        <option value="prix_asc">Prix croissant</option>
                                        <option value="prix_desc">Prix décroissant</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#666' }}>Afficher:</span>
                                    <select 
                                        style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                        value={produitsParPage}
                                        onChange={(e) => {
                                            setProduitsParPage(Number(e.target.value));
                                            setProduitsPage(1);
                                        }}
                                    >
                                        <option value="12">12</option>
                                        <option value="24">24</option>
                                        <option value="36">36</option>
                                        <option value="48">48</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0' }}>
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit..."
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '6px 0 0 6px',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '250px',
                                        outline: 'none'
                                    }}
                                    value={recherche}
                                    onChange={(e) => {
                                        setRecherche(e.target.value);
                                        setProduitsPage(1);
                                    }}
                                />
                                <button style={{
                                    border: 'none',
                                    backgroundColor: '#537373',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '0 6px 6px 0',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{ fontSize: '18px' }}>🔍</span>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{ width: isMobile ? '100%' : '250px', flexShrink: 0, backgroundColor: '#E6E6E6' }}>
                                {boutiqueData.categories && boutiqueData.categories.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isMobile ? 'pointer' : 'default' }}
                                            onClick={() => isMobile && setFiltreCatMobileOuvert(o => !o)}>
                                            Filtrer par catégories
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {isMobile ? (filtreCatMobileOuvert ? '▲' : '▼') : boutiqueData.categories.reduce((acc, cat) => acc + cat.nombre_annonces, 0)}
                                            </span>
                                        </h3>
                                        {(!isMobile || filtreCatMobileOuvert) && <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: '8px' }}>
                                            {boutiqueData.categories.map(cat => (
                                                <label key={cat.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}>
                                                    <input 
                                                        type="checkbox" 
                                                        style={{ cursor: 'pointer' }}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFiltres({
                                                                    ...filtres,
                                                                    categories: [...filtres.categories, cat.id]
                                                                });
                                                            } else {
                                                                setFiltres({
                                                                    ...filtres,
                                                                    categories: filtres.categories.filter(id => id !== cat.id)
                                                                });
                                                            }
                                                            setProduitsPage(1);
                                                        }}
                                                    />
                                                    <span style={{ flex: 1, color: '#666' }}>{cat.nom}</span>
                                                    <span style={{
                                                        backgroundColor: '#537373',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '22px',
                                                        height: '22px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '11px'
                                                    }}>{cat.nombre_annonces}</span>
                                                </label>
                                            ))}
                                        </div>}
                                    </div>
                                )}

                                {boutiqueData.tags && boutiqueData.tags.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <h3 style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            margin: '0 0 12px 0',
                                            color: '#2c3e50',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            Filtrer par TAG
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {boutiqueData.tags.reduce((acc, tag) => acc + tag.nombre_annonces, 0)}
                                            </span>
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {boutiqueData.tags.map(tag => (
                                                <label key={tag.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}>
                                                    <input 
                                                        type="checkbox" 
                                                        style={{ cursor: 'pointer' }}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFiltres({
                                                                    ...filtres,
                                                                    tags: [...filtres.tags, tag.id]
                                                                });
                                                            } else {
                                                                setFiltres({
                                                                    ...filtres,
                                                                    tags: filtres.tags.filter(id => id !== tag.id)
                                                                });
                                                            }
                                                            setProduitsPage(1);
                                                        }}
                                                    />
                                                    <span style={{ flex: 1, color: '#666' }}>{tag.nom}</span>
                                                    <span style={{
                                                        backgroundColor: '#537373',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '22px',
                                                        height: '22px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '11px'
                                                    }}>{tag.nombre_annonces}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                {produitsPagination.length > 0 ? (
                                    <>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                            gap: isMobile ? '10px' : '20px',
                                            marginBottom: '32px'
                                        }}>
                                            {produitsPagination.map(produit => (
                                                <div key={produit.id} style={{
                                                    border: '1px solid #e1e3e5',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#E6E6E6'
                                                }}>
                                                    <div style={{
                                                        height: isMobile ? '130px' : '200px',
                                                        backgroundColor: '#f8f9fa',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {produit.images && produit.images[0] ? (
                                                            <img 
                                                                src={produit.images[0]} 
                                                                alt={produit.nom} 
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#f4f6f8'
                                                            }}>
                                                                <span style={{ fontSize: '48px' }}>📦</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: isMobile ? '10px 8px' : '16px' }}>
                                                        <h3 style={{
                                                            fontSize: isMobile ? '11px' : '14px',
                                                            fontWeight: '600',
                                                            margin: '0 0 5px 0',
                                                            color: '#333',
                                                            height: isMobile ? '30px' : '40px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}>{produit.nom}</h3>
                                                        <p style={{
                                                            fontSize: isMobile ? '13px' : '18px',
                                                            fontWeight: '700',
                                                            color: '#537373',
                                                            margin: '0 0 8px 0'
                                                        }}>
                                                            ${parseFloat(produit.prix).toFixed(2)}
                                                        </p>
                                                        <button 
                                                            style={{
                                                                width: '100%',
                                                                backgroundColor: '#f8f9fa',
                                                                border: '1px solid #537373',
                                                                color: '#537373',
                                                                padding: isMobile ? '6px 4px' : '8px',
                                                                borderRadius: '6px',
                                                                fontSize: isMobile ? '11px' : '13px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.backgroundColor = '#537373';
                                                                e.target.style.color = 'white';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.backgroundColor = '#f8f9fa';
                                                                e.target.style.color = '#537373';
                                                            }}
                                                            onClick={() => {
                                                                const url = `https://evend-multivendeur-api.onrender.com/produit/${produit.id}`;
                                                                window.open(url, '_blank', 'noopener,noreferrer');
                                                            }}
                                                        >
                                                            Voir le produit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {totalPages > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <button 
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        backgroundColor: 'white',
                                                        color: '#333',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '6px',
                                                        cursor: produitsPage === 1 ? 'not-allowed' : 'pointer',
                                                        fontSize: '14px',
                                                        opacity: produitsPage === 1 ? 0.5 : 1
                                                    }}
                                                    onClick={() => setProduitsPage(p => Math.max(1, p-1))}
                                                    disabled={produitsPage === 1}
                                                >
                                                    ←
                                                </button>
                                                {[...Array(totalPages)].map((_, i) => {
                                                    const page = i + 1;
                                                    if (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - produitsPage) <= 2
                                                    ) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                style={{
                                                                    border: '1px solid #ddd',
                                                                    backgroundColor: page === produitsPage ? '#537373' : 'white',
                                                                    color: page === produitsPage ? 'white' : '#333',
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                                onClick={() => setProduitsPage(page)}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (
                                                        page === produitsPage - 3 ||
                                                        page === produitsPage + 3
                                                    ) {
                                                        return <span key={page} style={{ color: '#666', fontSize: '14px' }}>...</span>;
                                                    }
                                                    return null;
                                                })}
                                                <button 
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        backgroundColor: 'white',
                                                        color: '#333',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '6px',
                                                        cursor: produitsPage === totalPages ? 'not-allowed' : 'pointer',
                                                        fontSize: '14px',
                                                        opacity: produitsPage === totalPages ? 0.5 : 1
                                                    }}
                                                    onClick={() => setProduitsPage(p => Math.min(totalPages, p+1))}
                                                    disabled={produitsPage === totalPages}
                                                >
                                                    →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '60px 20px',
                                        color: '#999'
                                    }}>
                                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                                        <p style={{ fontSize: '18px', marginBottom: '8px' }}>Aucun produit disponible</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'avis':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            borderBottom: '10px solid',
                            borderImage: 'linear-gradient(to right, #537373, #70a9a1, #8cc0c0) 1',
                            flexWrap: 'wrap',
                            marginBottom: '24px',
                            padding: '0 8px'
                        }}>
                            <button
                                onClick={() => setSousOngletAvis('produits')}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: sousOngletAvis === 'produits' ? 'rgba(83,115,115,0.05)' : 'transparent',
                                    color: sousOngletAvis === 'produits' ? '#537373' : '#666',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: sousOngletAvis === 'produits' ? '600' : '500',
                                    marginBottom: '-10px',
                                    borderBottom: sousOngletAvis === 'produits' ? '10px solid #537373' : '10px solid transparent'
                                }}
                            >
                                🛍️ Avis produits
                            </button>
                            <button
                                onClick={() => setSousOngletAvis('vendeur')}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: sousOngletAvis === 'vendeur' ? 'rgba(83,115,115,0.05)' : 'transparent',
                                    color: sousOngletAvis === 'vendeur' ? '#537373' : '#666',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: sousOngletAvis === 'vendeur' ? '600' : '500',
                                    marginBottom: '-10px',
                                    borderBottom: sousOngletAvis === 'vendeur' ? '10px solid #537373' : '10px solid transparent'
                                }}
                            >
                                👤 Avis vendeur
                            </button>
                        </div>

                        {sousOngletAvis === 'vendeur' ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '32px',
                                    flexWrap: 'wrap',
                                    gap: '20px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '48px',
                                            fontWeight: '700',
                                            color: '#537373',
                                            lineHeight: 1
                                        }}>
                                            {getNoteMoyenneSecurisee().toFixed(1)}
                                        </div>
                                        <div style={{ margin: '8px 0' }}>
                                            {renderEtoiles(getNoteMoyenneSecurisee())}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666' }}>
                                            Basé sur {vendeur.nombre_avis || 0} avis
                                        </div>
                                    </div>
                                    <button 
                                        style={{
                                            backgroundColor: '#537373',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '25px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={ouvrirModalAvisVendeur}
                                    >
                                        ✍️ Écrire un avis sur le vendeur
                                    </button>
                                </div>
                                
                                {boutiqueData.avis && boutiqueData.avis.length > 0 ? (
                                    boutiqueData.avis.map(avis => (
                                        <div key={avis.id} style={{
                                            border: '1px solid #e1e3e5',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            marginBottom: '16px',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '12px',
                                                flexWrap: 'wrap',
                                                gap: '10px'
                                            }}>
                                                <div>
                                                    <span style={{
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        color: '#333',
                                                        marginRight: '10px'
                                                    }}>{avis.nom_visiteur || 'Anonyme'}</span>
                                                    {avis.verified_purchase && (
                                                        <span style={{
                                                            backgroundColor: '#27ae60',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            marginLeft: '8px'
                                                        }}>
                                                            ✓ Achat vérifié
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '16px' }}>
                                                    {renderEtoiles(avis.note_globale || 5)}
                                                </span>
                                            </div>
                                            {avis.titre && <h4 style={{
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                margin: '0 0 8px 0',
                                                color: '#444'
                                            }}>{avis.titre}</h4>}
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#666',
                                                lineHeight: '1.6',
                                                margin: '0 0 8px 0'
                                            }}>{avis.commentaire}</p>
                                            
                                            {(avis.qualite_detail || avis.prix_raisonnable || avis.vitesse_expedition || avis.qualite_discution) && (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                                    gap: '10px',
                                                    margin: '15px 0',
                                                    padding: '10px',
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '8px'
                                                }}>
                                                    {avis.qualite_detail && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            <span>Qualité des détails:</span>
                                                            {renderEtoiles(avis.qualite_detail)}
                                                        </div>
                                                    )}
                                                    {avis.prix_raisonnable && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            <span>Prix raisonnable:</span>
                                                            {renderEtoiles(avis.prix_raisonnable)}
                                                        </div>
                                                    )}
                                                    {avis.vitesse_expedition && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            <span>Vitesse d'expédition:</span>
                                                            {renderEtoiles(avis.vitesse_expedition)}
                                                        </div>
                                                    )}
                                                    {avis.qualite_discution && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            <span>Qualité de discussion:</span>
                                                            {renderEtoiles(avis.qualite_discution)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#999',
                                                margin: 0
                                            }}>
                                                {new Date(avis.created_at).toLocaleDateString('fr-CA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '80px 20px 60px',
                                        color: '#999',
                                        position: 'relative'
                                    }}>
                                        <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>⭐</div>
                                        <p style={{ fontSize: '18px', marginBottom: '8px', position: 'relative', zIndex: 2 }}>Aucun avis sur le vendeur</p>
                                        <p style={{ fontSize: '14px', color: '#aaa', position: 'relative', zIndex: 2 }}>Soyez le premier à donner votre avis !</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginBottom: '24px'
                                }}>
                                    <button 
                                        style={{
                                            backgroundColor: '#537373',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '25px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => {
                                            if (boutiqueData.produits && boutiqueData.produits.length > 0) {
                                                ouvrirModalAvisProduit(boutiqueData.produits[0]);
                                            }
                                        }}
                                    >
                                        ✍️ Écrire un avis sur un produit
                                    </button>
                                </div>
                                
                                {boutiqueData.avis_produits && boutiqueData.avis_produits.length > 0 ? (
                                    boutiqueData.avis_produits.map(avis => (
                                        <div key={avis.id} style={{
                                            border: '1px solid #e1e3e5',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            marginBottom: '16px',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '12px',
                                                flexWrap: 'wrap',
                                                gap: '10px'
                                            }}>
                                                <div>
                                                    <span style={{
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        color: '#333',
                                                        marginRight: '10px'
                                                    }}>{avis.nom_visiteur || 'Anonyme'}</span>
                                                    {avis.produit_nom && (
                                                        <span style={{
                                                            backgroundColor: '#53737320',
                                                            color: '#537373',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            marginLeft: '8px'
                                                        }}>
                                                            📦 {avis.produit_nom}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '16px' }}>
                                                    {renderEtoiles(avis.note_globale || 5)}
                                                </span>
                                            </div>
                                            {avis.titre && <h4 style={{
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                margin: '0 0 8px 0',
                                                color: '#444'
                                            }}>{avis.titre}</h4>}
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#666',
                                                lineHeight: '1.6',
                                                margin: '0 0 8px 0'
                                            }}>{avis.commentaire}</p>
                                            
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#999',
                                                margin: 0
                                            }}>
                                                {new Date(avis.created_at).toLocaleDateString('fr-CA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '80px 20px 60px',
                                        color: '#999',
                                        position: 'relative'
                                    }}>
                                        <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>📦</div>
                                        <p style={{ fontSize: '18px', marginBottom: '8px', position: 'relative', zIndex: 2 }}>Aucun avis sur les produits</p>
                                        <p style={{ fontSize: '14px', color: '#aaa', position: 'relative', zIndex: 2 }}>Soyez le premier à donner votre avis !</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );

            case 'politique':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            color: '#2c3e50',
                            borderBottom: '2px solid #537373',
                            paddingBottom: '12px'
                        }}>📋 Politique de la boutique</h2>
                        
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                margin: '0 0 16px 0',
                                color: '#537373',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '24px' }}>🔄</span>
                                Retours
                            </h3>
                            
                            {vendeur.politique_retours && vendeur.politique_retours.trim() !== '' ? (
                                <>
                                    <div style={{ 
                                        fontSize: '15px', 
                                        lineHeight: '1.7', 
                                        color: '#444',
                                        marginBottom: '20px'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: vendeur.politique_retours }}
                                    />
                                    <div style={{
                                        backgroundColor: '#e8f0fe',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        border: '1px solid #bbd4fd'
                                    }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1967d2' }}>
                                            ⏱️ Délai de retour: {vendeur.jours_remboursement === -1 ? 'Illimité' : `${vendeur.jours_remboursement || 30} jours`}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: '#fff3f3',
                                    borderRadius: '8px',
                                    color: '#999',
                                    border: '1px dashed #e74c3c'
                                }}>
                                    <span style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔄</span>
                                    <p style={{ fontSize: '16px', marginBottom: '8px', color: '#e74c3c' }}>Aucune politique de retours disponible</p>
                                    <p style={{ fontSize: '14px', color: '#aaa' }}>Contactez le vendeur pour plus d'informations.</p>
                                </div>
                            )}
                        </div>

                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                margin: '0 0 16px 0',
                                color: '#537373',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '24px' }}>🚚</span>
                                Livraison
                            </h3>
                            
                            {vendeur.politique_livraison && vendeur.politique_livraison.trim() !== '' ? (
                                <>
                                    <div style={{ 
                                        fontSize: '15px', 
                                        lineHeight: '1.7', 
                                        color: '#444',
                                        marginBottom: '20px'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: vendeur.politique_livraison }}
                                    />
                                    <div style={{
                                        backgroundColor: '#e8f0fe',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        border: '1px solid #bbd4fd'
                                    }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1967d2' }}>
                                            📍 Zone d'expédition: {vendeur.zone_expedition || 'Canada entier'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: '#fff3f3',
                                    borderRadius: '8px',
                                    color: '#999',
                                    border: '1px dashed #e74c3c'
                                }}>
                                    <span style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🚚</span>
                                    <p style={{ fontSize: '16px', marginBottom: '8px', color: '#e74c3c' }}>Aucune politique de livraison disponible</p>
                                    <p style={{ fontSize: '14px', color: '#aaa' }}>Contactez le vendeur pour plus d'informations.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'description':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            color: '#2c3e50',
                            borderBottom: '2px solid #537373',
                            paddingBottom: '12px'
                        }}>📝 Description de la boutique</h2>
                        <div style={{
                            fontSize: '15px',
                            color: '#444',
                            lineHeight: '1.7',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
                            backgroundColor: '#f8f9fa',
                            padding: '24px',
                            borderRadius: '12px'
                        }}>
                            {vendeur.description_longue ? (
                                <div dangerouslySetInnerHTML={{ __html: vendeur.description_longue }} />
                            ) : (
                                <p>{vendeur.description_courte || 'Aucune description disponible.'}</p>
                            )}
                            
                            <div style={{
                                marginTop: '32px',
                                padding: '20px',
                                backgroundColor: '#E6E6E6',
                                borderRadius: '12px',
                                border: '1px solid #e1e3e5'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#2c3e50' }}>📊 Informations complémentaires</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>📍 Région administrative</p>
                                        <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>{vendeur.region || 'Non spécifiée'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>📅 Membre depuis</p>
                                        <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>
                                            {new Date(vendeur.date_inscription).toLocaleDateString('fr-CA', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>📦 Produits en vente</p>
                                        <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>{vendeur.total_produits || 0}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>🛒 Articles vendus</p>
                                        <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>{vendeur.total_commandes || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'blog':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            color: '#2c3e50',
                            borderBottom: '2px solid #537373',
                            paddingBottom: '12px'
                        }}>📰 Blog de la boutique</h2>
                        
                        {boutiqueData.blog && boutiqueData.blog.filter(a => a.statut === 'publie').length > 0 ? (
                            <BlogListe articles={boutiqueData.blog.filter(a => a.statut === 'publie')} />
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '80px 20px 60px',
                                color: '#999',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>📰</div>
                                <p style={{ fontSize: '18px', marginBottom: '8px', position: 'relative', zIndex: 2 }}>Aucun article de blog disponible</p>
                                <p style={{ fontSize: '14px', color: '#aaa', position: 'relative', zIndex: 2 }}>Revenez plus tard pour découvrir les nouveautés !</p>
                            </div>
                        )}
                    </div>
                );

            case 'faq':
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            color: '#2c3e50',
                            borderBottom: '2px solid #537373',
                            paddingBottom: '12px'
                        }}>❓ Foire aux questions</h2>
                        
                        {boutiqueData.faq && boutiqueData.faq.filter(f => f.active !== false).length > 0 ? (
                            <FaqListe items={boutiqueData.faq.filter(f => f.active !== false).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))} />
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '80px 20px 60px',
                                color: '#999',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>❓</div>
                                <p style={{ fontSize: '18px', marginBottom: '8px', position: 'relative', zIndex: 2 }}>Aucune question fréquente disponible</p>
                                <p style={{ fontSize: '14px', color: '#aaa', position: 'relative', zIndex: 2 }}>Consultez la politique ou contactez le vendeur pour plus d'informations !</p>
                            </div>
                        )}
                    </div>
                );

            case 'badges':
                return <BadgesVendeur vendeurId={vendeur.id} />;

            case 'en-savoir-plus': {
                const noteMoyenne = getNoteMoyenneSecurisee();
                
                return (
                    <div style={{
                        backgroundColor: '#E6E6E6',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid #e1e3e5',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            color: '#2c3e50',
                            borderBottom: '2px solid #537373',
                            paddingBottom: '12px'
                        }}>➕ En savoir plus</h2>
                        
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                                color: '#537373',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #e1e3e5'
                            }}>📋 GÉNÉRALITÉS</h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '16px'
                            }}>
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>📅</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Membre depuis</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {new Date(vendeur.date_inscription).toLocaleDateString('fr-CA', {
                                                year: 'numeric',
                                                month: 'long'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>📦</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Produits en vente</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>{vendeur.total_produits || 0}</p>
                                    </div>
                                </div>
                                
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🛒</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Articles vendus</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>{vendeur.total_commandes || 0}</p>
                                    </div>
                                </div>
                                
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>⭐</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Note moyenne</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>{noteMoyenne.toFixed(1)}/5.0</p>
                                    </div>
                                </div>
                                
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>📍</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Région administrative</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>{vendeur.region || 'Non spécifiée'}</p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🚚</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Zone d'expédition</p>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>{vendeur.zone_expedition || 'Canada'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                                color: '#537373',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #e1e3e5'
                            }}>🏢 DÉTAILS ENTREPRISE</h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '16px'
                            }}>
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🏢</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Type d'entreprise</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.type_entreprise || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🔢</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>No. d'entreprise</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.num_entreprise_provincial || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🏷️</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>TPS/TVH</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.no_tps || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>🏷️</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>TVQ / Taxe provinciale</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.no_taxe_provinciale || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>📍</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Adresse entreprise</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.adresse_entreprise || vendeur.region || 'Non spécifiée'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '32px' }}>📞</span>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Téléphone</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                            {vendeur.telephone || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {vendeur.site_web && (
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <span style={{ fontSize: '32px' }}>🌐</span>
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Site web</p>
                                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                                                <a href={vendeur.site_web} target="_blank" rel="noopener noreferrer" style={{color: '#537373'}}>
                                                    {vendeur.site_web.replace(/^https?:\/\//, '')}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {!vendeur.est_entreprise_enregistree && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    color: '#999',
                                    marginTop: '20px'
                                }}>
                                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune information d'entreprise disponible</p>
                                    <p style={{ fontSize: '14px' }}>Ce vendeur n'a pas encore enregistré les détails de son entreprise.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div style={{
            backgroundColor: '#DCD7C9',
            minHeight: '100vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <style>{`
                .blog-contenu img {
                    max-width: 100%;
                    height: auto;
                    max-height: 400px;
                    object-fit: contain;
                    border-radius: 12px;
                    margin: 15px 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .banniere-container {
                    width: 100%;
                    height: 400px;
                    overflow: hidden;
                    position: relative;
                }
                .banniere-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                }
                
                .logo-container {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #537373, #70a9a1);
                    flex-shrink: 0;
                    border: 4px solid #537373;
                    boxShadow: 0 5px 15px rgba(83,115,115,0.3);
                }
                .logo-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    border-radius: 50%;
                }
                .logo-emoji {
                    font-size: 42px;
                    line-height: 1;
                }
            `}</style>

            {/* Barre de navigation */}
            <div style={{
                backgroundColor: '#2c3e50',
                padding: isMobile ? '10px 14px' : '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', flexShrink: 0 }}>
                    <h1 style={{
                        fontSize: isMobile ? '18px' : '24px',
                        margin: 0,
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #fff, #e0e0e0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        whiteSpace: 'nowrap'
                    }}>🏪 e-Vend</h1>
                    <button 
                        onClick={() => window.close()}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            padding: isMobile ? '6px 10px' : '8px 16px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '12px' : '14px',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        ← Retour
                    </button>
                </div>
                {!isMobile && (
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#ecf0f1', fontWeight: '500' }}>
                            {new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <span style={{
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '600',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        padding: isMobile ? '6px 10px' : '8px 16px',
                        borderRadius: '20px',
                        color: '#fff',
                        maxWidth: isMobile ? '120px' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>{vendeur.nom_boutique}</span>
                </div>
            </div>

            {/* Bannière */}
            <div className="banniere-container" style={isMobile ? { height: '160px' } : {}}>
                {banniere.type === 'image' ? (
                    <img 
                        src={banniere.url} 
                        alt={`Bannière de ${vendeur.nom_boutique}`}
                        className="banniere-image"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            parent.style.background = 'linear-gradient(135deg, #2c3e50, #537373, #70a9a1)';
                            parent.style.backgroundSize = '200% 200%';
                            parent.style.animation = 'gradient 15s ease infinite';
                            
                            const overlay = document.createElement('div');
                            overlay.style.position = 'absolute';
                            overlay.style.top = '0';
                            overlay.style.left = '0';
                            overlay.style.right = '0';
                            overlay.style.bottom = '0';
                            overlay.style.backgroundColor = 'rgba(0,0,0,0.3)';
                            overlay.style.display = 'flex';
                            overlay.style.alignItems = 'center';
                            overlay.style.justifyContent = 'center';
                            
                            const textDiv = document.createElement('div');
                            textDiv.style.textAlign = 'center';
                            textDiv.style.color = 'white';
                            textDiv.innerHTML = 
                                '<p style="font-size:16px; opacity:0.9; margin-bottom:12px; letter-spacing:2px;">BIENVENUE DANS LA BOUTIQUE</p>' +
                                '<h1 style="font-size:56px; font-weight:700; margin:0; text-shadow:2px 2px 4px rgba(0,0,0,0.3);">' + 
                                vendeur.nom_boutique + 
                                '</h1>';
                            
                            overlay.appendChild(textDiv);
                            parent.appendChild(overlay);
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: banniere.gradient,
                        backgroundSize: '200% 200%',
                        animation: 'gradient 15s ease infinite',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ textAlign: 'center', color: 'white' }}>
                                <p style={{
                                    fontSize: '16px',
                                    opacity: 0.9,
                                    marginBottom: '12px',
                                    letterSpacing: '2px'
                                }}>BIENVENUE DANS LA BOUTIQUE</p>
                                <h1 style={{
                                    fontSize: '56px',
                                    fontWeight: '700',
                                    margin: 0,
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                                }}>{vendeur.nom_boutique}</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: isMobile ? '12px' : '24px',
                marginTop: isMobile ? '-80px' : '-150px',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Infos boutique */}
                <div style={{
                    backgroundColor: '#E6E6E6',
                    borderRadius: '16px 16px 0 0',
                    padding: isMobile ? '16px 14px' : '28px',
                    marginBottom: '0',
                    border: '1px solid #e1e3e5',
                    borderBottom: 'none',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '16px' : '28px',
                    alignItems: isMobile ? 'stretch' : 'flex-start',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}>
                    <div className="logo-container">
                        {logo.type === 'image' ? (
                            <img 
                                src={logo.url} 
                                alt={`Logo de ${vendeur.nom_boutique}`}
                                className="logo-image"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    parent.style.background = 'linear-gradient(135deg, #537373, #70a9a1)';
                                    parent.innerHTML = '<span class="logo-emoji">🏪</span>';
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: logo.background
                            }}>
                                <span className="logo-emoji">{logo.content}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <h2 style={{
                                fontSize: isMobile ? '20px' : '28px',
                                fontWeight: '700',
                                margin: 0,
                                color: '#2c3e50'
                            }}>{vendeur.nom_boutique}</h2>
                            
                            {vendeur.region && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #537373, #70a9a1)',
                                    color: '#fff',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 10px rgba(83,115,115,0.3)'
                                }}>
                                    <span className="fa fa-map-signs" style={{ marginRight: '5px' }}></span>
                                    {vendeur.region}
                                </div>
                            )}
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                <span style={{ fontSize: '16px' }}>📅</span>
                                <span>Membre depuis {new Date(vendeur.date_inscription).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' })}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                <span style={{ fontSize: '16px' }}>📦</span>
                                <span>{vendeur.total_produits || 0} produits</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                <span style={{ fontSize: '16px' }}>🛒</span>
                                <span>{vendeur.total_commandes|| 0} articles vendus</span>
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{ fontSize: '18px' }}>
                                {renderEtoiles(noteMoyennePrincipale)}
                            </div>
                            <span style={{
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                {vendeur.nombre_avis || 0} avis
                            </span>
                        </div>
                    </div>

                    {/* Boutons de contact — hamburger sur mobile, colonne sur PC */}
                    {isMobile ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuBoutonsOuvert(o => !o)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, #537373, #70a9a1)',
                                    border: 'none', borderRadius: '40px',
                                    padding: '10px 18px', color: 'white',
                                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(83,115,115,0.3)',
                                    width: '100%', justifyContent: 'center'
                                }}
                            >
                                <span>⋯</span> Actions
                                <span style={{ fontSize: '10px' }}>{menuBoutonsOuvert ? '▲' : '▼'}</span>
                            </button>
                            {menuBoutonsOuvert && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                                    background: '#fff', borderRadius: '12px', overflow: 'hidden',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    border: '1px solid #e1e3e5', zIndex: 100
                                }}>
                                    {[
                                        { label: estFavori ? '❤️ Favori ✓' : '🤍 Vendeur Favori', bg: '#9b59b6', action: gererFavori },
                                        { label: '✉️ Email', bg: '#537373', action: () => window.location.href = `mailto:${vendeur.email}` },
                                        { label: '💬 Chat', bg: '#3498db', action: () => window.open(`/messagerie?vendeur=${vendeur.id}`, '_blank') },
                                        { label: '⚠️ Signaler', bg: '#e74c3c', action: () => { setModalSignalerOuvert(true); setMenuBoutonsOuvert(false); } },
                                    ].map((btn, i) => (
                                        <button key={i} onClick={() => { btn.action(); setMenuBoutonsOuvert(false); }} style={{
                                            display: 'block', width: '100%', padding: '13px 18px',
                                            background: 'none', border: 'none',
                                            borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
                                            textAlign: 'left', fontSize: '14px', fontWeight: '600',
                                            color: btn.bg, cursor: 'pointer'
                                        }}>{btn.label}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'center' }}>
                        <button 
                            style={{ background: estFavori ? 'linear-gradient(135deg, #8e44ad, #9b59b6)' : 'linear-gradient(135deg, #9b59b6, #8e44ad)', border: 'none', borderRadius: '40px', padding: '10px 22px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: loadingFavori ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(155, 89, 182, 0.3)', transition: 'all 0.2s ease', width: '140px', justifyContent: 'center', opacity: loadingFavori ? 0.7 : 1 }}
                            onClick={gererFavori} disabled={loadingFavori}
                        >
                            <span style={{ fontSize: '16px' }}>{loadingFavori ? '⏳' : (estFavori ? '❤️' : '🤍')}</span>
                            {estFavori ? 'Favori ✓' : 'Vendeur Favori'}
                        </button>
                        <button style={{ background: 'linear-gradient(135deg, #537373, #70a9a1)', border: 'none', borderRadius: '40px', padding: '10px 22px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(83,115,115,0.3)', transition: 'all 0.2s ease', width: '140px', justifyContent: 'center' }}
                            onClick={() => window.location.href = `mailto:${vendeur.email}`}>
                            <span style={{ fontSize: '16px' }}>✉️</span>Email
                        </button>
                        <button style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', border: 'none', borderRadius: '40px', padding: '10px 22px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(52,152,219,0.3)', transition: 'all 0.2s ease', width: '140px', justifyContent: 'center' }}
                            onClick={() => window.open(`/messagerie?vendeur=${vendeur.id}`, '_blank')}>
                            <span style={{ fontSize: '16px' }}>💬</span>Chat
                        </button>
                        <button style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', border: 'none', borderRadius: '40px', padding: '10px 22px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)', transition: 'all 0.2s ease', width: '140px', justifyContent: 'center' }}
                            onClick={() => setModalSignalerOuvert(true)}>
                            <span style={{ fontSize: '16px' }}>⚠️</span>Signaler
                        </button>
                    </div>
                    )}
                </div>

                {/* Message temporaire pour les favoris */}
                {messageFavori && (
                    <div style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        backgroundColor: messageFavori.includes('ajouté') ? '#27ae60' : (messageFavori.includes('retiré') ? '#e74c3c' : '#f39c12'),
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        zIndex: 9999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        animation: 'fadeInOut 3s ease forwards'
                    }}>
                        {messageFavori}
                    </div>
                )}

                {/* Onglets principaux */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    borderImage: 'linear-gradient(to right, #537373, #70a9a1, #8cc0c0) 1',
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible',
                    marginBottom: '24px',
                    backgroundColor: '#E6E6E6',
                    padding: isMobile ? '0 8px' : '0 16px',
                    borderRadius: '0',
                    border: '1px solid #e1e3e5',
                    borderTop: 'none',
                    borderBottom: '20px solid',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.02)'
                }}>
                    {onglets.map(onglet => (
                        <button
                            key={onglet.id}
                            onClick={() => setOngletActif(onglet.id)}
                            style={{
                                padding: isMobile ? '10px 10px' : '12px 18px',
                                border: 'none',
                                backgroundColor: ongletActif === onglet.id ? 'rgba(83,115,115,0.05)' : 'transparent',
                                color: ongletActif === onglet.id ? '#537373' : '#666',
                                cursor: 'pointer',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: ongletActif === onglet.id ? '600' : '500',
                                transition: 'all 0.2s ease',
                                marginBottom: '-20px',
                                borderBottom: ongletActif === onglet.id ? '20px solid #537373' : '20px solid transparent',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                        >
                            {onglet.label}
                            {onglet.count !== undefined && onglet.count > 0 && (
                                <span style={{
                                    backgroundColor: '#537373',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    marginLeft: '8px'
                                }}>{onglet.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Contenu */}
                {renderContenu()}
            </div>

            {/* MODAL AVIS UNIFIÉ */}
            {modalAvisOuvert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }} onClick={() => setModalAvisOuvert(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e1e3e5',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: 0,
                                color: '#2c3e50'
                            }}>
                                {typeAvis === 'vendeur' ? '✍️ Écrire un avis sur le vendeur' : `✍️ Écrire un avis sur ${produitSelectionne?.nom || 'le produit'}`}
                            </h2>
                            <button style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '28px',
                                cursor: 'pointer',
                                color: '#666'
                            }} onClick={() => setModalAvisOuvert(false)}>×</button>
                        </div>
                        <form onSubmit={soumettreAvis} style={{ padding: '20px' }}>
                            {messageSucces && (
                                <div style={{
                                    backgroundColor: '#d4edda',
                                    color: '#155724',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '16px'
                                }}>{messageSucces}</div>
                            )}
                            {messageErreur && (
                                <div style={{
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '16px'
                                }}>{messageErreur}</div>
                            )}
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333'
                                }}>Votre nom *</label>
                                <input
                                    type="text"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    value={formAvis.nom}
                                    onChange={e => setFormAvis({...formAvis, nom: e.target.value})}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333'
                                }}>Votre email *</label>
                                <input
                                    type="email"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    value={formAvis.email}
                                    onChange={e => setFormAvis({...formAvis, email: e.target.value})}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333'
                                }}>Note globale *</label>
                                {renderEtoilesInput('note_globale', formAvis.note_globale, setFormAvis)}
                            </div>
                            
                            {typeAvis === 'vendeur' && (
                                <>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        margin: '20px 0 10px 0',
                                        color: '#2c3e50'
                                    }}>Critères détaillés</h3>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#333'
                                        }}>Qualité des détails de l'annonce</label>
                                        {renderEtoilesInput('qualite_detail', formAvis.qualite_detail, setFormAvis)}
                                    </div>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#333'
                                        }}>Prix raisonnable</label>
                                        {renderEtoilesInput('prix_raisonnable', formAvis.prix_raisonnable, setFormAvis)}
                                    </div>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#333'
                                        }}>Vitesse d'expédition</label>
                                        {renderEtoilesInput('vitesse_expedition', formAvis.vitesse_expedition, setFormAvis)}
                                    </div>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#333'
                                        }}>Qualité de discussion</label>
                                        {renderEtoilesInput('qualite_discution', formAvis.qualite_discution, setFormAvis)}
                                    </div>
                                </>
                            )}
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333'
                                }}>Titre de l'avis</label>
                                <input
                                    type="text"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    value={formAvis.titre}
                                    onChange={e => setFormAvis({...formAvis, titre: e.target.value})}
                                    placeholder="Résumé de votre expérience"
                                />
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#333'
                                }}>Votre commentaire *</label>
                                <textarea
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                    rows="4"
                                    value={formAvis.commentaire}
                                    onChange={e => setFormAvis({...formAvis, commentaire: e.target.value})}
                                    placeholder="Partagez votre expérience..."
                                />
                            </div>
                            
                            <button type="submit" style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#537373',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}>
                                Envoyer mon avis
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SIGNALER */}
            {modalSignalerOuvert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setModalSignalerOuvert(false)}>
                    <div style={{
                        background: '#0f172a',
                        borderRadius: '24px',
                        width: '90%',
                        maxWidth: '550px',
                        padding: '30px',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '22px' }}>
                            ⚠️ Signaler ce vendeur
                        </h2>
                        <form onSubmit={soumettreSignaler}>
                            {messageSucces && (
                                <div style={{
                                    backgroundColor: '#10b98120',
                                    color: '#10b981',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                    border: '1px solid #10b98140'
                                }}>{messageSucces}</div>
                            )}
                            {messageErreur && (
                                <div style={{
                                    backgroundColor: '#ef444420',
                                    color: '#ef4444',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                    border: '1px solid #ef444440'
                                }}>{messageErreur}</div>
                            )}
                            
                            <input
                                type="text"
                                placeholder="Votre nom *"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '15px',
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                value={formSignaler.nom}
                                onChange={e => setFormSignaler({...formSignaler, nom: e.target.value})}
                            />
                            
                            <input
                                type="email"
                                placeholder="Votre email *"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '15px',
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                value={formSignaler.email}
                                onChange={e => setFormSignaler({...formSignaler, email: e.target.value})}
                            />
                            
                            <select
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '15px',
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                                value={formSignaler.raison_type}
                                onChange={e => setFormSignaler({...formSignaler, raison_type: e.target.value})}
                            >
                                <option value="produit_fake">Produit contrefait / faux</option>
                                <option value="arnaque">Tentative d'arnaque</option>
                                <option value="comportement">Comportement inapproprié</option>
                                <option value="livraison">Problème de livraison</option>
                                <option value="qualite">Qualité non conforme</option>
                                <option value="autre">Autre</option>
                            </select>
                            
                            {formSignaler.raison_type === 'autre' && (
                                <input
                                    type="text"
                                    placeholder="Précisez la raison *"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        marginBottom: '15px',
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    value={formSignaler.raison_autre}
                                    onChange={e => setFormSignaler({...formSignaler, raison_autre: e.target.value})}
                                />
                            )}
                            
                            <textarea
                                placeholder="Description détaillée *"
                                required
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                                value={formSignaler.description}
                                onChange={e => setFormSignaler({...formSignaler, description: e.target.value})}
                            />
                            
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setModalSignalerOuvert(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '12px 20px',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 5px 15px rgba(231, 76, 60, 0.4)'
                                    }}
                                >
                                    Envoyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                backgroundColor: '#2c3e50',
                color: '#ecf0f1',
                textAlign: 'center',
                padding: '16px',
                marginTop: '40px',
                fontSize: '13px'
            }}>
                <p>© {configGlobale?.footer_text || `Copyright ${new Date().getFullYear()} e-Vend, Tous droits réservés`}</p>
            </div>
        </div>
    );
}

export default BoutiquePublique;