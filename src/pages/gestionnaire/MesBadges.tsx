import React, { useState, useEffect } from 'react';
import { 
  Page, Card, BlockStack, Text, Grid, Badge, 
  Spinner, EmptyState, Button
} from '@shopify/polaris';
import { 
  StarIcon, CheckCircleIcon, RewardIcon
} from '@shopify/polaris-icons';

// Types
interface BadgeAttribue {
  id: number;
  badge_id: string;
  vendeur_id: number;
  date_attribution: string;
  statut: 'actif' | 'inactif';
  note?: string;
  badge: {
    id: string;
    nom: string;
    description: string;
    icone: string;
    couleur: string;
    niveau: number;
    critere: string;
  };
}

interface StatistiquesBadges {
  total: number;
  parNiveau: {
    niveau1: number;
    niveau2: number;
    niveau3: number;
    niveau4: number;
    niveau5: number;
  };
  dernierBadge?: {
    id: number;
    date_attribution: string;
    badge: {
      id: string;
      nom: string;
      icone: string;
      couleur: string;
      niveau: number;
    };
  };
}

const API = 'https://evend-multivendeur-api.onrender.com';

// Fonction pour récupérer le token
const getToken = () => localStorage.getItem('token');

// Composant pour afficher un badge individuel
function CarteBadge({ badge, onPartager }: { badge: BadgeAttribue; onPartager?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Obtenir le niveau en texte
  const getNiveauTexte = (niveau: number) => {
    switch(niveau) {
      case 1: return 'Débutant';
      case 2: return 'Intermédiaire';
      case 3: return 'Avancé';
      case 4: return 'Expert';
      case 5: return 'Maître';
      default: return 'Niveau ' + niveau;
    }
  };
  
  // Obtenir la couleur du niveau
  const getNiveauCouleur = (niveau: number) => {
    switch(niveau) {
      case 1: return '#27AE60';
      case 2: return '#3498DB';
      case 3: return '#9B59B6';
      case 4: return '#F39C12';
      case 5: return '#E74C3C';
      default: return '#95A5A6';
    }
  };
  
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
        border: `2px solid ${badge.badge.couleur || '#e1e4e8'}20`,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'pointer'
      }}
    >
      {/* Icône principale */}
      <div style={{
        fontSize: '56px',
        textAlign: 'center',
        marginBottom: '16px',
        filter: badge.statut === 'inactif' ? 'grayscale(0.5)' : 'none',
        opacity: badge.statut === 'inactif' ? 0.7 : 1
      }}>
        {badge.badge.icone}
      </div>
      
      {/* Badge de niveau */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: getNiveauCouleur(badge.badge.niveau),
        color: 'white',
        borderRadius: '20px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Niv. {badge.badge.niveau}
      </div>
      
      {/* Titre */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        color: '#1a2332',
        textAlign: 'center'
      }}>
        {badge.badge.nom}
      </h3>
      
      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: '#6b7280',
        margin: '0 0 12px 0',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        {badge.badge.description}
      </p>
      
      {/* Critère */}
      {badge.badge.critere && (
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
      
      {/* Date d'attribution */}
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
      
      {/* Effet de brillance au hover */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${badge.badge.couleur}10, transparent)`,
          pointerEvents: 'none'
        }} />
      )}
    </div>
  );
}

// Composant pour afficher les statistiques
function StatistiquesBadges({ stats }: { stats: StatistiquesBadges }) {
  const niveaux = [
    { niveau: 1, nom: 'Débutant', couleur: '#27AE60', count: stats.parNiveau.niveau1 },
    { niveau: 2, nom: 'Intermédiaire', couleur: '#3498DB', count: stats.parNiveau.niveau2 },
    { niveau: 3, nom: 'Avancé', couleur: '#9B59B6', count: stats.parNiveau.niveau3 },
    { niveau: 4, nom: 'Expert', couleur: '#F39C12', count: stats.parNiveau.niveau4 },
    { niveau: 5, nom: 'Maître', couleur: '#E74C3C', count: stats.parNiveau.niveau5 }
  ];
  
  return (
    <Card>
      <BlockStack gap="400">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📊</span>
          <Text variant="headingMd" as="h2">Mes statistiques</Text>
        </div>
        
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <Text variant="headingLg" as="p" tone="success">
                {stats.total}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Badges obtenus
              </Text>
            </div>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <div style={{ marginTop: '8px' }}>
              <Text variant="bodySm" as="p" tone="subdued">
                Répartition par niveau
              </Text>
              <div style={{ marginTop: '12px' }}>
                {niveaux.map((n) => (
                  <div key={n.niveau} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: n.couleur, fontWeight: '500' }}>
                        {n.nom}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {n.count}
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${stats.total > 0 ? (n.count / stats.total) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: n.couleur,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Grid.Cell>
        </Grid>
      </BlockStack>
    </Card>
  );
}

// Composant principal
export default function MesBadges() {
  const [badges, setBadges] = useState<BadgeAttribue[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [stats, setStats] = useState<StatistiquesBadges>({
    total: 0,
    parNiveau: { niveau1: 0, niveau2: 0, niveau3: 0, niveau4: 0, niveau5: 0 }
  });
  
  // Récupérer l'ID du vendeur
  const getVendeurId = (): number => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.seller_id || 0;
      }
    } catch (e) {
      console.error('Erreur lecture user:', e);
    }
    return 0;
  };
  
  // Charger les badges du vendeur
  const chargerBadges = async () => {
    const vendeurId = getVendeurId();
    if (!vendeurId) {
      setErreur('Vendeur non identifié');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API}/api/vendeurs/${vendeurId}/badges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Pas de badges pour ce vendeur, ce n'est pas une erreur
          setBadges([]);
          setStats({ total: 0, parNiveau: { niveau1: 0, niveau2: 0, niveau3: 0, niveau4: 0, niveau5: 0 } });
          setLoading(false);
          return;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transformer les données
      const badgesTransformes = Array.isArray(data) ? data : (data.badges || []);
      
      // Calculer les statistiques
      const parNiveau = {
        niveau1: 0,
        niveau2: 0,
        niveau3: 0,
        niveau4: 0,
        niveau5: 0
      };
      
      badgesTransformes.forEach((badge: BadgeAttribue) => {
        const niveau = badge.badge?.niveau || 1;
        if (niveau === 1) parNiveau.niveau1++;
        else if (niveau === 2) parNiveau.niveau2++;
        else if (niveau === 3) parNiveau.niveau3++;
        else if (niveau === 4) parNiveau.niveau4++;
        else if (niveau === 5) parNiveau.niveau5++;
      });
      
      setBadges(badgesTransformes);
      setStats({
        total: badgesTransformes.length,
        parNiveau,
        dernierBadge: badgesTransformes[0]
      });
      
    } catch (err) {
      console.error('❌ Erreur chargement badges:', err);
      setErreur(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    chargerBadges();
  }, []);
  
  // Grouper les badges par niveau
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
  
  if (loading) {
    return (
      <Page title="Mes badges">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Spinner accessibilityLabel="Chargement des badges" size="large" />
          <span style={{ marginLeft: '16px', color: '#6b7280' }}>
            Chargement de vos badges...
          </span>
        </div>
      </Page>
    );
  }
  
  if (erreur) {
    return (
      <Page title="Mes badges">
        <EmptyState
          heading="Erreur de chargement"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Impossible de charger vos badges. Veuillez réessayer plus tard.</p>
          <Button onClick={chargerBadges}>Réessayer</Button>
        </EmptyState>
      </Page>
    );
  }
  
  if (badges.length === 0) {
    return (
      <Page title="Mes badges">
        <EmptyState
          heading="Aucun badge pour le moment"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Les badges sont des récompenses attribuées par l'administration pour 
            reconnaître vos performances et votre engagement. Continuez à exceller 
            pour débloquer vos premiers badges !
          </p>
          <Button onClick={() => window.location.href = '/vendeur/dashboard'}>
            Retour au tableau de bord
          </Button>
        </EmptyState>
      </Page>
    );
  }
  
  return (
    <Page title="Mes badges" subtitle="Vos récompenses et distinctions">
      <BlockStack gap="500">
        
        {/* En-tête avec compteur */}
        <Card>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                🏅
              </div>
              <div>
                <Text variant="headingLg" as="h2">
                  Vous avez obtenu {stats.total} badge{stats.total > 1 ? 's' : ''}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Félicitations ! Continuez à vous démarquer pour en obtenir plus.
                </Text>
              </div>
            </div>
            
            {stats.dernierBadge && (
              <Badge tone="success">
                {`🆕 Dernier badge : ${stats.dernierBadge.badge.nom}`}
              </Badge>
            )}
          </div>
        </Card>
        
        {/* Statistiques */}
        <StatistiquesBadges stats={stats} />
        
        {/* Badges par niveau */}
        {Object.entries(badgesParNiveau).map(([niveauKey, badgesList]) => {
          if (badgesList.length === 0) return null;
          const niveauInfo = niveauxTitres[niveauKey as keyof typeof niveauxTitres];
          
          return (
            <Card key={niveauKey}>
              <BlockStack gap="400">
                <div style={{
                  borderLeft: `4px solid ${niveauInfo.couleur}`,
                  paddingLeft: '16px'
                }}>
                  <Text variant="headingMd" as="h3">
                    {niveauInfo.titre}
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {niveauInfo.description}
                  </Text>
                </div>
                
                <Grid>
                  {badgesList.map((badge) => (
                    <Grid.Cell 
                      key={badge.id} 
                      columnSpan={{ xs: 6, sm: 4, md: 3, lg: 3, xl: 3 }}
                    >
                      <CarteBadge badge={badge} />
                    </Grid.Cell>
                  ))}
                </Grid>
              </BlockStack>
            </Card>
          );
        })}
        
        {/* Message de motivation */}
        {stats.total < 10 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span style={{ fontSize: '48px' }}>🚀</span>
              <div style={{ marginTop: '12px' }}>
                <Text variant="headingMd" as="h3">
                  Passez au niveau supérieur !
                </Text>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Plus vous vendez, plus vous gagnez de badges. Visez les 100 ventes 
                  pour obtenir le badge "Vendeur Or" !
                </Text>
              </div>
            </div>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
