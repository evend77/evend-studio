import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  AppProvider, Page, Card, BlockStack, Text, Grid,
  Navigation, Frame, Modal, TextField, Button, ButtonGroup, Badge,
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import fr from '@shopify/polaris/locales/fr.json';
import {
  HomeFilledIcon, SettingsIcon, ProductIcon, OrderIcon,
  PersonIcon, QuestionCircleIcon, PlusCircleIcon, EmailIcon
} from '@shopify/polaris-icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// Imports des composants vendeur
import CreerAnnonce from './pages/gestionnaire/CreerAnnonce';
import MonCompte from './pages/gestionnaire/MonCompte';
import ListeCommandes from './pages/gestionnaire/ListeCommandes';
import DetailCommande from './pages/gestionnaire/DetailCommande';
import PaiementsCommandes from './pages/gestionnaire/PaiementsCommandes';
import ListeCommissions from './pages/gestionnaire/ListeCommissions';
import RetourRemboursements from './pages/gestionnaire/RetourRemboursements';
import CommandesBrouillons from './pages/gestionnaire/CommandesBrouillons';
import DocumentsVendeur from './pages/gestionnaire/DocumentsVendeur';
import ConfigurationGenerale from './pages/gestionnaire/ConfigurationGenerale';
import ListeProduits from './pages/gestionnaire/ListeProduits';
import Categories from './pages/gestionnaire/Categories';
import MessagerieAcheteur from './pages/gestionnaire/MessagerieAcheteur';
import MessagerieAdministration from './pages/gestionnaire/MessagerieAdministration';
import MessagerieNotifications from './pages/gestionnaire/MessagerieNotifications';
import MonForfait from './pages/gestionnaire/MonForfait';
import PlansMembership from './pages/gestionnaire/PlansMembership';
import RapportVendeur from './pages/gestionnaire/RapportVendeur';
import MesAvis from './pages/gestionnaire/MesAvis';
import AvisProduits from './pages/gestionnaire/AvisProduits';
import MesBlogs from './pages/gestionnaire/MesBlogs';
import MaFaq from './pages/gestionnaire/MaFaq';
import FacturesVendeur from './pages/gestionnaire/FacturesVendeur';
import MesEncheres from './pages/gestionnaire/MesEncheres';
import ReductionsRabais from './pages/gestionnaire/ReductionsRabais';
import TagsProduits from './pages/gestionnaire/TagsProduits';
import TypesProduits from './pages/gestionnaire/TypesProduits';
import ConnecterBoutique from './pages/gestionnaire/ConnecterBoutique';
import ModifierAnnonce from './pages/gestionnaire/modifier-annonce';
import MesBadges from './pages/gestionnaire/MesBadges';
import MethodesExpedition from './pages/gestionnaire/MethodesExpedition';
import MesOffres from './pages/gestionnaire/MesOffres';
import { API_BASE } from './config/api';
import TemplateBoutique from './pages/gestionnaire/TemplateBoutique';

// =====================================================================
// TYPES
// =====================================================================
export interface VendeurUser {
  id:           number;
  email:        string;
  nom:          string;
  nom_boutique: string | null;
  role:         string;
  seller_id?:   string;
  statut?:      string;
  plan?:        string;
}

interface StatsVendeur {
  revenus: {
    total: number;
    mois: number;
    aujourdhui: number;
    croissance: number;
  };
  commandes: {
    total: number;
    enAttente: number;
    expediees: number;
    livrees: number;
    annulees: number;
    croissance: number;
  };
  produits: {
    total: number;
    actifs: number;
    enRupture: number;
    vues: number;
    vuesCroissance: number;
  };
  avis: {
    moyenne: number;
    total: number;
    cinqEtoiles: number;
    quatreEtoiles: number;
    troisEtoiles: number;
    deuxEtoiles: number;
    uneEtoile: number;
  };
  graphiques: {
    ventes30j: { date: string; ventes: number; commandes: number }[];
    topProduits: { nom: string; ventes: number; revenu: number }[];
    repartitionStatuts: { nom: string; valeur: number; couleur: string }[];
    visites: { date: string; vues: number }[];
  };
}

// Types pour le menu
interface SousMenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  onClick?: () => void;
  bloque?: boolean;
  cleAcces?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  sousMenu?: SousMenuItem[];
  cleAcces?: string;
}

// =====================================================================
// COMPOSANTS UTILITAIRES
// =====================================================================
const tooltipStyle: React.CSSProperties = {
  position: 'absolute', bottom: '-32px', left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0,0,0,0.75)', color: 'white',
  padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
  whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1000,
};

function IconeAvecTooltip({ emoji, texte, onClick, rouge }: {
  emoji: string; texte: string; onClick?: () => void; rouge?: boolean;
}) {
  const [survol, setSurvol] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setSurvol(true)} onMouseLeave={() => setSurvol(false)}
      style={{ position: 'relative', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
      {emoji}
      {rouge && (
        <span style={{
          position: 'absolute', top: '-4px', left: '14px',
          backgroundColor: '#E74C3C', borderRadius: '50%',
          width: '12px', height: '12px', display: 'block', border: '2px solid #1a1a1a',
        }} />
      )}
      {survol && <div style={tooltipStyle}>{texte}</div>}
    </div>
  );
}

function CarteKPI({ emoji, titre, valeur, sousTitre, couleur, tendance }: {
  emoji: string; 
  titre: string; 
  valeur: string; 
  sousTitre: string;
  couleur: string;
  tendance?: { valeur: number; positif: boolean };
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>{emoji}</span>
            <span style={{ color: '#666', fontSize: '14px' }}>{titre}</span>
          </div>
          {tendance && (
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: tendance.positif ? '#10b981' : '#ef4444',
              backgroundColor: tendance.positif ? '#d1fae5' : '#fee2e2',
              padding: '2px 8px',
              borderRadius: '20px',
            }}>
              {tendance.positif ? '↑' : '↓'} {tendance.valeur}%
            </span>
          )}
        </div>
        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#333' }}>
          <span style={{ color: couleur }}>{valeur}</span>
        </p>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{sousTitre}</p>
      </BlockStack>
    </Card>
  );
}

// =====================================================================
// COMPOSANT DASHBOARD
// =====================================================================
function Dashboard({ vendeur }: { vendeur: VendeurUser }) {
  const [periode, setPeriode] = useState('30');
  const [stats, setStats] = useState<StatsVendeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  
  const prenom = vendeur.nom?.split(' ')[0] || 'Vendeur';
  const getToken = () => localStorage.getItem('token');
  const isMobile = window.innerWidth <= 768;

  // Charger les stats
  useEffect(() => {
    const chargerStats = async () => {
      if (!vendeur?.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/vendeurs/${vendeur.id}/stats?periode=${periode}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Stats reçues pour période', periode, ':', data);
          setStats(data);
        } else {
          console.error('Erreur stats:', response.status);
          setErreur('Erreur chargement des statistiques');
        }
      } catch (error) {
        console.error('Erreur stats:', error);
        setErreur('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    chargerStats();
  }, [vendeur?.id, periode]);

  // Données pour le graphique selon période
  const donneesGraphique = stats?.graphiques?.ventes30j || [];

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100%', paddingBottom: '20px', color: '#333' }}>
      <Page title="Tableau de bord e-Vend">
        <BlockStack gap="500">
          
          {/* En-tête avec bienvenue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '600', margin: 0, color: '#333' }}>Bonjour, {prenom} 👋</h2>
            <Badge tone="success">Compte actif</Badge>
            {stats?.revenus?.croissance ? (
              <Badge tone={stats.revenus.croissance > 0 ? 'success' : 'critical'}>
                {`${stats.revenus.croissance > 0 ? '📈 +' : '📉 '}${stats.revenus.croissance.toFixed(1)}% vs mois dernier`}
              </Badge>
            ) : null}
            <Badge tone="info">
              {periode === '7' ? '📅 7 jours' : periode === '30' ? '📅 30 jours' : periode === '90' ? '📅 90 jours' : periode === '365' ? '📅 1 an' : '📅 Personnalisé'}
            </Badge>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: '#333' }}>Chargement de vos statistiques...</p>
            </div>
          ) : erreur ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>❌</div>
              <p style={{ color: '#b91c1c' }}>{erreur}</p>
            </div>
          ) : stats && (
            <>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <CarteKPI 
                    emoji="💰" 
                    titre="Revenus de la période" 
                    valeur={`${(stats.revenus?.mois || 0).toFixed(2)} $`}
                    sousTitre={`Total: ${(stats.revenus?.total || 0).toFixed(2)} $`}
                    couleur="#008060"
                    tendance={stats.revenus?.croissance ? { 
                      valeur: Math.abs(stats.revenus.croissance), 
                      positif: stats.revenus.croissance > 0 
                    } : undefined}
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <CarteKPI 
                    emoji="🛒" 
                    titre="Commandes" 
                    valeur={String(stats.commandes?.total || 0)}
                    sousTitre={`${stats.commandes?.enAttente || 0} en attente`}
                    couleur="#537373"
                    tendance={stats.commandes?.croissance ? { 
                      valeur: Math.abs(stats.commandes.croissance), 
                      positif: stats.commandes.croissance > 0 
                    } : undefined}
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <CarteKPI 
                    emoji="👁️" 
                    titre="Vues produits" 
                    valeur={String(stats.produits?.vues || 0)}
                    sousTitre={`${stats.produits?.vuesCroissance || 0}% vs hier`}
                    couleur="#F39C12"
                    tendance={stats.produits?.vuesCroissance ? { 
                      valeur: Math.abs(stats.produits.vuesCroissance), 
                      positif: stats.produits.vuesCroissance > 0 
                    } : undefined}
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <CarteKPI 
                    emoji="⭐" 
                    titre="Avis clients" 
                    valeur={(stats.avis?.moyenne || 0).toFixed(1)}
                    sousTitre={`${stats.avis?.total || 0} avis`}
                    couleur="#3498DB"
                  />
                </Grid.Cell>
              </Grid>

              {/* GRAPHIQUE PRINCIPAL - VENTES */}
              <Card>
                <BlockStack gap="300">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>📈</span>
                      <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', margin: 0, color: '#333' }}>Performance des ventes</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <ButtonGroup variant="segmented">
                        <Button pressed={periode === '7'} onClick={() => setPeriode('7')}>7j</Button>
                        <Button pressed={periode === '30'} onClick={() => setPeriode('30')}>30j</Button>
                        <Button pressed={periode === '90'} onClick={() => setPeriode('90')}>90j</Button>
                        <Button pressed={periode === '365'} onClick={() => setPeriode('365')}>1a</Button>
                      </ButtonGroup>
                      <Button onClick={() => setPeriode(periode)}>⟳</Button>
                    </div>
                  </div>

                  {donneesGraphique.length > 0 ? (
                    <div style={{ minHeight: '300px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={donneesGraphique}>
                          <defs>
                            <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#008060" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#008060" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#888" 
                            fontSize={isMobile ? 10 : 12} 
                            angle={periode === '365' ? -45 : 0}
                            textAnchor={periode === '365' ? 'end' : 'middle'}
                            height={periode === '365' ? 60 : 30}
                            interval={periode === '365' ? Math.floor(donneesGraphique.length / 12) : 0}
                          />
                          <YAxis stroke="#888" fontSize={isMobile ? 10 : 12} tickFormatter={(value) => `${value}$`} />
                          <Tooltip 
                            formatter={(value: any) => `${Number(value || 0).toFixed(2)} $`}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="ventes" 
                            stroke="#008060" 
                            strokeWidth={2}
                            fill="url(#colorVentes)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#666' }}>Aucune donnée de vente pour cette période</p>
                    </div>
                  )}
                </BlockStack>
              </Card>

              {/* STATS AVANCÉES */}
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  <Card>
                    <BlockStack gap="300">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>💰</span>
                        <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', margin: 0, color: '#333' }}>Revenus et commissions</h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                          <p style={{ color: '#666', margin: '0 0 4px 0' }}>Revenus aujourd'hui</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#059669' }}>
                            {(stats.revenus?.aujourdhui || 0).toFixed(2)} $
                          </p>
                        </div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                          <p style={{ color: '#666', margin: '0 0 4px 0' }}>Revenus de la période</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#059669' }}>
                            {(stats.revenus?.mois || 0).toFixed(2)} $
                          </p>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ color: '#666', margin: 0 }}>
                          Boutique : <strong style={{ color: '#333' }}>{vendeur.nom_boutique || '—'}</strong>
                        </p>
                      </div>
                    </BlockStack>
                  </Card>
                </Grid.Cell>

                {/* Répartition des avis */}
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  <Card>
                    <BlockStack gap="300">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⭐</span>
                        <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', margin: 0, color: '#333' }}>Distribution des avis</h3>
                      </div>
                      {stats.avis?.total > 0 ? (
                        <BlockStack gap="200">
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#333' }}>5 étoiles</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>{stats.avis.cinqEtoiles || 0}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                              <div style={{ 
                                width: `${((stats.avis.cinqEtoiles || 0) / (stats.avis.total || 1)) * 100}%`, 
                                height: '100%', 
                                backgroundColor: '#10b981',
                                borderRadius: '4px' 
                              }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#333' }}>4 étoiles</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>{stats.avis.quatreEtoiles || 0}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                              <div style={{ 
                                width: `${((stats.avis.quatreEtoiles || 0) / (stats.avis.total || 1)) * 100}%`, 
                                height: '100%', 
                                backgroundColor: '#3b82f6',
                                borderRadius: '4px' 
                              }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#333' }}>3 étoiles</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>{stats.avis.troisEtoiles || 0}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                              <div style={{ 
                                width: `${((stats.avis.troisEtoiles || 0) / (stats.avis.total || 1)) * 100}%`, 
                                height: '100%', 
                                backgroundColor: '#f59e0b',
                                borderRadius: '4px' 
                              }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#333' }}>2 étoiles</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>{stats.avis.deuxEtoiles || 0}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                              <div style={{ 
                                width: `${((stats.avis.deuxEtoiles || 0) / (stats.avis.total || 1)) * 100}%`, 
                                height: '100%', 
                                backgroundColor: '#f97316',
                                borderRadius: '4px' 
                              }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#333' }}>1 étoile</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>{stats.avis.uneEtoile || 0}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                              <div style={{ 
                                width: `${((stats.avis.uneEtoile || 0) / (stats.avis.total || 1)) * 100}%`, 
                                height: '100%', 
                                backgroundColor: '#ef4444',
                                borderRadius: '4px' 
                              }} />
                            </div>
                          </div>
                        </BlockStack>
                      ) : (
                        <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: '#666' }}>Aucun avis</p>
                        </div>
                      )}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              </Grid>
            </>
          )}
        </BlockStack>
      </Page>
    </div>
  );
}

// =====================================================================
// COMPOSANT INDICATEUR DE SESSION
// =====================================================================
function SessionIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const intervalRef = useRef<any>(null);

  const verifierToken = async () => {
    const currentToken = localStorage.getItem('token');
    setToken(currentToken);
    
    if (!currentToken) {
      setIsConnected(false);
      return;
    }

    try {
      // Vérifier si le token est valide
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erreur vérification token:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    verifierToken();
    
    // Vérifier toutes les 10 secondes
    intervalRef.current = setInterval(verifierToken, 10000);
    
    // Écouter les changements de localStorage (déconnexion d'un autre onglet)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        verifierToken();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isConnected === null) {
    return <span style={{ color: '#aaa', fontSize: '12px' }}>⏳ Vérification...</span>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: '16px',
      padding: '4px 10px',
      borderRadius: '20px',
      backgroundColor: isConnected ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${isConnected ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
    }}>
      <span style={{ fontSize: '14px' }}>{isConnected ? '✅' : '❌'}</span>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 600,
        color: isConnected ? '#4ade80' : '#f87171'
      }}>
        {isConnected ? 'Session connectée' : 'Session déconnectée'}
      </span>
    </div>
  );
}

// =====================================================================
// APP VENDEUR PRINCIPALE - AVEC MENU BLEU FONCÉ RESPONSIVE
// =====================================================================
interface AppVendeurProps {
  onLogout?:   () => void;
  vendeurUser?: VendeurUser | null;
}

function AppVendeur({ onLogout, vendeurUser }: AppVendeurProps) {
  const getToken = () => localStorage.getItem('token');

  const [pageActive, setPageActive] = useState('dashboard');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [message, setMessage] = useState('');
  const [aNotification, setANotification] = useState(true);
  const [heureActuelle, setHeureActuelle] = useState(new Date());
  const [recherche, setRecherche] = useState('');
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [footerText, setFooterText] = useState(`© Copyright ${new Date().getFullYear()} e-Vend, Tous droits réservés`);
  const [nomPlateforme, setNomPlateforme] = useState('e-Vend');
  const [banniereVendeurActive, setBanniereVendeurActive] = useState(false);
  const [banniereVendeurMessage, setBanniereVendeurMessage] = useState('');
  const [banniereVendeurCouleurBg, setBanniereVendeurCouleurBg] = useState('#1e3a5f');
  const [banniereVendeurCouleurTx, setBanniereVendeurCouleurTx] = useState('#ffffff');
  const [banniereVendeurHauteur, setBanniereVendeurHauteur] = useState('36');
  const [banniereVendeurPolice, setBanniereVendeurPolice] = useState('13');

  const [commandeSelectionnee, setCommandeSelectionnee] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success') {
      setPageActive('config-generale');
      setMenuOuvert('config');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('stripe') === 'refresh') {
      setPageActive('config-generale');
      setMenuOuvert('config');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMenuMobileOuvert(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/admin/configuration/config-publique`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.footer_text) setFooterText(data.footer_text);
        if (data?.nom_plateforme) setNomPlateforme(data.nom_plateforme);
        if (data?.banniere_vendeur_active !== undefined) setBanniereVendeurActive(data.banniere_vendeur_active);
        if (data?.banniere_vendeur_message) setBanniereVendeurMessage(data.banniere_vendeur_message);
        if (data?.banniere_vendeur_couleur_bg) setBanniereVendeurCouleurBg(data.banniere_vendeur_couleur_bg);
        if (data?.banniere_vendeur_couleur_tx) setBanniereVendeurCouleurTx(data.banniere_vendeur_couleur_tx);
        if (data?.banniere_vendeur_hauteur) setBanniereVendeurHauteur(data.banniere_vendeur_hauteur);
        if (data?.banniere_vendeur_police) setBanniereVendeurPolice(data.banniere_vendeur_police);
      })
      .catch(() => {});
  }, []);

  const [vendeur, setVendeur] = useState<VendeurUser>(() => {
    if (vendeurUser) return vendeurUser;
    try {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { id: 0, email: '', nom: 'Vendeur', nom_boutique: null, role: 'vendeur' };
  });

  useEffect(() => {
    if (vendeurUser) setVendeur(vendeurUser);
  }, [vendeurUser]);

  const [fonctionnalitesPlan, setFonctionnalitesPlan] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (!vendeur?.id) return;
    const chargerFonctionnalites = async () => {
      try {
        const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/vendeur/${vendeur.id}/plan-actif`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.limites?.fonctionnalites) {
          setFonctionnalitesPlan(data.limites.fonctionnalites);
        }
      } catch (e) {
        console.error('Erreur chargement fonctionnalités plan:', e);
      }
    };
    chargerFonctionnalites();
  }, [vendeur?.id, vendeur?.plan]);

  const aAcces = (cle: string): boolean => {
    if (!fonctionnalitesPlan) return true;
    return fonctionnalitesPlan[cle] === true;
  };

  useEffect(() => {
    const interval = setInterval(() => setHeureActuelle(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const ouvrirModal  = useCallback(() => setModalOuvert(true), []);
  const fermerModal  = useCallback(() => setModalOuvert(false), []);
  const envoyerMessage = useCallback(() => { setMessage(''); fermerModal(); }, [fermerModal]);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatHeure = (d: Date) => d.toLocaleTimeString('fr-CA');

  const initialeAvatar = vendeur.nom?.charAt(0)?.toUpperCase() || 'V';

  const ouvrirBoutiqueNouvelOnglet = () => {
    const vendeurId = vendeur?.id || vendeur?.seller_id;
    if (vendeurId) {
      window.open(`/boutique/${vendeurId}`, '_blank', 'noopener,noreferrer');
    } else {
      console.error('ID vendeur non trouvé');
      setPageActive('ma-boutique');
    }
  };

  const handleMenuClick = (menuId: string) => {
    setMenuOuvert(menuOuvert === menuId ? null : menuId);
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'TABLEAU DE BORD', icon: '📊' },
    {
      id: 'annonces', label: 'VOS ANNONCES', icon: '📦',
      sousMenu: [
        { id: 'annonces-liste', label: 'Liste des produits', icon: '📋' },
        { id: 'annonces-encheres', label: 'Mes enchères', icon: '🔨', cleAcces: 'modeEncheres' },
        { id: 'annonces-make-offer', label: 'Mes offres reçues', icon: '💬' },
        { id: 'annonces-tags', label: 'Tags produits', icon: '🏷️' },
        { id: 'annonces-types', label: 'Types produits', icon: '📑' },
        { id: 'annonces-categories', label: 'Collections', icon: '🗂️', cleAcces: 'collections' },
        { id: 'annonces-promos', label: 'Réductions & codes', icon: '🏷️', cleAcces: 'codesPromo' },
      ]
    },
    {
      id: 'commandes', label: 'VOS COMMANDES', icon: '📦',
      sousMenu: [
        { id: 'commandes-liste', label: 'Liste des commandes', icon: '📋' },
        { id: 'commandes-paiements', label: 'Paiements & commissions', icon: '💰' },
        { id: 'commandes-retours', label: 'Retour & remboursement', icon: '🔄' },
        { id: 'commandes-brouillon', label: 'Commande brouillon', icon: '📝', cleAcces: 'commandesBrouillon' },
        { id: 'commandes-documents', label: 'Documents vendeurs', icon: '📄' },
      ]
    },
    {
      id: 'config', label: 'CONFIGURATION', icon: '⚙️',
      sousMenu: [
        { id: 'config-generale', label: 'Configuration générale', icon: '🔧' },
        { id: 'config-expedition', label: "Méthode d'expédition", icon: '🚚' },
        { id: 'config-facture', label: 'Modèle de facture', icon: '🧾' },
      ]
    },
    {
      id: 'profil', label: 'PROFIL', icon: '👤',
      sousMenu: [
        { id: 'profil-compte', label: 'Mon compte', icon: '👤' },
        { id: 'ma-boutique', label: 'Ma boutique', icon: '🏪', onClick: ouvrirBoutiqueNouvelOnglet },
        { id: 'profil-paiement', label: 'Détails de paiement', icon: '💳' },
        { id: 'profil-avis', label: 'Mes avis', icon: '⭐' },
        { id: 'profil-avis-produits', label: 'Mes avis produits', icon: '📝' },
        { id: 'profil-blogs', label: 'Mes Blogs', icon: '📝', cleAcces: 'blog' },
        { id: 'profil-faq', label: 'Ma FAQ', icon: '❓', cleAcces: 'faq' },
        { id: 'profil-badges', label: 'Mes badges', icon: '🏅' },
        { id: 'profil-forfait', label: 'Mon forfait', icon: '📊' },
        { id: 'profil-rapport', label: 'Rapport financier', icon: '📈' },
        { id: 'profil-factures', label: 'Factures', icon: '🧾' },
      ]
    },
    {
      id: 'guides', label: 'GUIDES', icon: '❓',
      sousMenu: [
        { id: 'guides-vendeur', label: 'Guide du vendeur', icon: '📘' },
        { id: 'guides-stripe', label: 'Guide Stripe Connect', icon: '💳' },
        { id: 'guides-faq', label: 'FAQ', icon: '❓' },
      ]
    },
    {
      id: 'connecter-boutique', 
      label: 'CONNECTER BOUTIQUE', 
      icon: '🔌', 
      cleAcces: 'connecterBoutique'
    },
    { id: 'template-boutique', label: 'TEMPLATE BOUTIQUE', icon: '🎨' },  // ← NOUVEAU MENU AJOUTÉ
    { id: 'creer', label: 'CRÉER UNE ANNONCE', icon: '➕' },
    {
      id: 'messagerie', label: 'MESSAGERIE', icon: '✉️',
      badge: aNotification ? 1 : undefined,
      cleAcces: 'messagerie',
      sousMenu: [
        { id: 'messagerie-vendeur', label: 'Messages acheteurs', icon: '💬' },
        { id: 'messagerie-admin', label: 'Message administration', icon: '🛡️' },
        { id: 'messagerie-notifications', label: 'Notifications e-Vend', icon: '🔔', badge: aNotification ? 1 : undefined },
      ]
    },
  ];

  const menuStyle: React.CSSProperties = {
    width: isMobile ? (menuMobileOuvert ? '280px' : '0px') : '280px',
    background: '#0a1a3a',
    backgroundImage: 'linear-gradient(180deg, #0a1a3a 0%, #0e2a4a 100%)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    color: '#fff',
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
    zIndex: 1000,
    transition: 'width 0.3s ease',
    overflowX: 'hidden'
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    marginLeft: isMobile ? '0px' : '280px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    overflow: 'hidden',
    transition: 'margin-left 0.3s ease'
  };

  const topBarFixedStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isMobile ? '0px' : '280px',
    right: 0,
    zIndex: 900,
    height: '56px',
    transition: 'left 0.3s ease'
  };

  const footerFixedStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: isMobile ? '0px' : '280px',
    right: 0,
    height: '40px',
    backgroundColor: '#2c3e50',
    borderTop: '1px solid #34495e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '10px' : '12px',
    color: '#ecf0f1',
    zIndex: 900,
    transition: 'left 0.3s ease'
  };

  const renderPage = () => {
    if (pageActive === 'creer') {
      return <CreerAnnonce onRetour={() => setPageActive('annonces-liste')} />;
    }

    if (pageActive.startsWith('creer-annonce?dupliquer=')) {
      const dupliquerDeId = pageActive.replace('creer-annonce?dupliquer=', '');
      return (
        <CreerAnnonce
          dupliquerDeId={dupliquerDeId}
          onRetour={() => setPageActive('annonces-liste')}
          gestionnaireId={vendeur.id}
        />
      );
    }
    
    if (pageActive.startsWith('modifier-annonce?id=')) {
      const produitId = pageActive.replace('modifier-annonce?id=', '');
      return <CreerAnnonce produitId={produitId} onRetour={() => setPageActive('annonces-liste')} />;
    }

    if (pageActive.startsWith('modifier-annonce-')) {
      const produitId = pageActive.replace('modifier-annonce-', '');
      return <CreerAnnonce produitId={produitId} onRetour={() => setPageActive('annonces-liste')} />;
    }
    
    if (pageActive.startsWith('modifier-annonce')) {
      return <ModifierAnnonce />;
    }
    
    if (pageActive === 'profil-compte') return <MonCompte gestionnaireId={vendeur.id} />;
    
    if (pageActive === 'commandes-liste') {
      return (
        <ListeCommandes 
          naviguerVers={(page: string) => setPageActive(page)} 
          gestionnaireId={vendeur.id} 
          onVoirCommande={(id: number) => { 
            setCommandeSelectionnee(id); 
            setPageActive('commande-detail'); 
          }} 
        />
      );
    }

    if (pageActive === 'commande-detail') {
      if (!commandeSelectionnee) {
        setPageActive('commandes-liste');
        return null;
      }
      return <DetailCommande commandeId={commandeSelectionnee} retourListe={() => setPageActive('commandes-liste')} />;
    }
    
    if (pageActive === 'commandes-paiements') return <PaiementsCommandes />;
    if (pageActive === 'commandes-retours') return <RetourRemboursements />;
    if (pageActive === 'commandes-brouillon') return <CommandesBrouillons />;
    if (pageActive === 'commandes-documents') return <DocumentsVendeur />;
    
    if (pageActive === 'config-generale') return <ConfigurationGenerale />;
    if (pageActive === 'config-expedition') return <MethodesExpedition gestionnaireId={vendeur.id} onRetour={() => setPageActive('dashboard')} />;
    
    if (pageActive === 'annonces-liste') return <ListeProduits naviguerVers={setPageActive} gestionnaireId={vendeur.id} />;
    if (pageActive === 'annonces-encheres') return <MesEncheres />;
    if (pageActive === 'annonces-make-offer') return <MesOffres />;
    if (pageActive === 'annonces-categories') return <Categories />;
    if (pageActive === 'annonces-promos') return <ReductionsRabais />;
    if (pageActive === 'annonces-tags') return <TagsProduits />;
    if (pageActive === 'annonces-types') return <TypesProduits />;
    
    if (pageActive === 'messagerie-vendeur') return <MessagerieAcheteur />;
    if (pageActive === 'messagerie-admin') return <MessagerieAdministration />;
    if (pageActive === 'messagerie-notifications') return <MessagerieNotifications />;
    
    if (pageActive === 'profil-forfait') return <MonForfait />;
    if (pageActive === 'plans-membership') return <PlansMembership planActuelId="fondateur" naviguerVers={setPageActive} />;
    if (pageActive === 'profil-rapport') return <RapportVendeur nomVendeur={vendeur.nom_boutique || vendeur.nom} />;
    if (pageActive === 'profil-avis') return <MesAvis />;
    if (pageActive === 'profil-avis-produits') return <AvisProduits />;
    if (pageActive === 'profil-blogs') return <MesBlogs />;
    if (pageActive === 'profil-faq') return <MaFaq />;
    if (pageActive === 'profil-badges') return <MesBadges />;
    if (pageActive === 'profil-factures') return <FacturesVendeur naviguerVers={setPageActive} />;
    
    if (pageActive === 'connecter-boutique') return <ConnecterBoutique onRetour={() => setPageActive('dashboard')} vendorId={vendeur.id.toString()} />;
    
    // Page pour Template boutique
    if (pageActive === 'template-boutique') {
     return <TemplateBoutique />;
    }
    
    return <Dashboard vendeur={vendeur} />;
  };

  // Top bar avec indicateur de session
  const topBarContent = (
    <div style={{
      backgroundColor: '#1a1a1a',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: isMobile ? '12px' : '24px',
      paddingRight: isMobile ? '12px' : '24px',
      gap: isMobile ? '8px' : '12px',
      width: '100%'
    }}>
      {isMobile && (
        <button
          onClick={() => setMenuMobileOuvert(!menuMobileOuvert)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          ☰
        </button>
      )}
      
      <img
        src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo5.png?v=1758814369"
        alt="e-Vend"
        style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', objectFit: 'contain', flexShrink: 0 }}
      />
      {!isMobile && <span style={{ color: 'white', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>e-Vend.ca</span>}
      
      {!isMobile && (
        <div style={{ marginLeft: '8px' }}>
          <input type="text" placeholder="🔍 Rechercher..." value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{ border: '1px solid #444', background: '#2a2a2a', outline: 'none', fontSize: '13px', color: 'white', padding: '6px 14px', borderRadius: '20px', width: '200px' }}
          />
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', marginLeft: 'auto' }}>
        <IconeAvecTooltip emoji="✉️" texte="Contacter l'administration" onClick={ouvrirModal} />
        <IconeAvecTooltip emoji="🔔" texte="Vos messages de l'administration"
          onClick={() => setANotification(false)} rouge={aNotification} />
        <IconeAvecTooltip 
          emoji="👁️" 
          texte="Voir ma boutique" 
          onClick={ouvrirBoutiqueNouvelOnglet}
        />
        {!isMobile && (
          <button
            onClick={() => window.open('/', '_self')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            🏠 Retour à la plateforme
          </button>
        )}
      </div>

      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#ccc', fontSize: '13px', fontWeight: '600' }}>{formatDate(heureActuelle)}</span>
          <span style={{ color: '#aaa', fontSize: '13px' }}>{formatHeure(heureActuelle)}</span>
          <SessionIndicator />
        </div>
      )}
      
      {isMobile && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#ccc', fontSize: '11px' }}>{formatHeure(heureActuelle)}</span>
          <SessionIndicator />
        </div>
      )}
    </div>
  );

  return (
    <AppProvider i18n={fr}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        
        .menu-item { 
          transition: all .2s ease; 
          border-radius: 8px; 
          margin: 2px 10px;
          color: rgba(255,255,255,0.9);
        }
        .menu-item:hover { 
          background: rgba(59,130,246,0.3); 
        }
        .menu-item.active { 
          background: linear-gradient(135deg, #2563eb, #1e40af);
          box-shadow: 0 4px 10px rgba(37,99,235,0.3);
        }
        .menu-item.active .menu-label { 
          color:#fff; 
          font-weight:700; 
        }
        .sous-menu-item { 
          transition: all .2s ease; 
          border-radius: 6px; 
          color: rgba(255,255,255,0.8);
        }
        .sous-menu-item:hover { 
          background: rgba(59,130,246,0.2); 
        }
        .sous-menu-item.active { 
          background: rgba(37,99,235,0.4); 
          border-left: 3px solid #60a5fa; 
        }
        .menu-header {
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          borderRadius: 8px;
          margin: 2px 10px;
          transition: all .2s ease;
        }
        .menu-header:hover {
          background: rgba(59,130,246,0.3);
        }
        .menu-header.open {
          background: rgba(37,99,235,0.2);
          border-left: 3px solid #3b82f6;
        }
        
        .app-container {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          overflow: hidden;
        }
        
        .scrollable-area {
          margin-top: 56px;
          flex: 1;
          overflow-y: auto;
          height: calc(100vh - 96px);
          color: #333;
          padding-bottom: 40px;
        }
        
        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          zIndex: 999;
        }
      `}</style>

      <div className="app-container">
        
        {/* Menu latéral */}
        <div style={menuStyle}>
          <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: isMobile ? '28px' : '32px' }}>🛍️</span>
              {(!isMobile || menuMobileOuvert) && (
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: '#fff' }}>
                  {nomPlateforme.includes('-')
                    ? (() => {
                        const idx = nomPlateforme.indexOf('-');
                        const avant = nomPlateforme.slice(0, idx);
                        const apres = nomPlateforme.slice(idx + 1);
                        return <>{avant}<span style={{ color: '#60a5fa' }}>-</span>{apres}</>;
                      })()
                    : nomPlateforme
                  }
                </span>
              )}
            </div>
            {(!isMobile || menuMobileOuvert) && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Espace vendeur</p>
            )}
          </div>

          <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {menuItems.map((item) => (
              <div key={item.id}>
                {!item.sousMenu ? (
                  <div
                    className={`menu-item ${pageActive === item.id ? 'active' : ''}`}
                    onClick={() => {
                      if (item.cleAcces && !aAcces(item.cleAcces)) {
                        setPageActive('profil-forfait');
                        if (isMobile) setMenuMobileOuvert(false);
                        return;
                      }
                      setPageActive(item.id);
                      setMenuOuvert(null);
                      if (isMobile) setMenuMobileOuvert(false);
                    }}
                    style={{ padding: isMobile ? '10px 12px' : '12px 16px', cursor: item.cleAcces && !aAcces(item.cleAcces) ? 'not-allowed' : 'pointer', opacity: item.cleAcces && !aAcces(item.cleAcces) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '14px' }}
                  >
                    <span style={{ fontSize: isMobile ? '20px' : '22px', width: '28px' }}>{item.icon}</span>
                    {(!isMobile || menuMobileOuvert) && (
                      <>
                        <span className="menu-label" style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{item.label}</span>
                        {item.cleAcces && !aAcces(item.cleAcces) ? (
                          <span style={{ marginLeft: 'auto', fontSize: '13px' }}>🔒</span>
                        ) : item.badge ? (
                          <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px' }}>
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : (
                  (!isMobile || menuMobileOuvert) && (
                    <>
                      <div
                        className={`menu-header ${menuOuvert === item.id ? 'open' : ''}`}
                        onClick={() => {
                          if (item.cleAcces && !aAcces(item.cleAcces)) {
                            setPageActive('profil-forfait');
                            if (isMobile) setMenuMobileOuvert(false);
                            return;
                          }
                          handleMenuClick(item.id);
                        }}
                        style={{ 
                          padding: isMobile ? '10px 12px' : '12px 16px',
                          cursor: item.cleAcces && !aAcces(item.cleAcces) ? 'not-allowed' : 'pointer',
                          opacity: item.cleAcces && !aAcces(item.cleAcces) ? 0.5 : 1,
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '14px',
                          backgroundColor: menuOuvert === item.id ? 'rgba(37,99,235,0.2)' : 'transparent',
                          borderLeft: menuOuvert === item.id ? '3px solid #3b82f6' : '3px solid transparent'
                        }}
                      >
                        <span style={{ fontSize: isMobile ? '20px' : '22px', width: '28px' }}>{item.icon}</span>
                        <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {item.cleAcces && !aAcces(item.cleAcces) ? '🔒' : menuOuvert === item.id ? '▼' : '▶'}
                        </span>
                      </div>
                      
                      {menuOuvert === item.id && (
                        <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                          {item.sousMenu.map((sousItem) => {
                            const estBloque = sousItem.cleAcces ? !aAcces(sousItem.cleAcces) : false;
                            return (
                            <div
                              key={sousItem.id}
                              className={`sous-menu-item ${pageActive === sousItem.id ? 'active' : ''}`}
                              onClick={() => {
                                if (estBloque) {
                                  setPageActive('profil-forfait');
                                  if (isMobile) setMenuMobileOuvert(false);
                                  return;
                                }
                                if (sousItem.onClick) {
                                  sousItem.onClick();
                                } else {
                                  setPageActive(sousItem.id);
                                }
                                if (isMobile) setMenuMobileOuvert(false);
                              }}
                              style={{ 
                                padding: isMobile ? '8px 10px' : '8px 12px', 
                                marginLeft: '46px', 
                                marginRight: '10px', 
                                marginBottom: '2px', 
                                cursor: estBloque ? 'not-allowed' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                position: 'relative',
                                opacity: estBloque ? 0.5 : 1,
                                backgroundColor: pageActive === sousItem.id ? 'rgba(37,99,235,0.3)' : 'transparent'
                              }}
                            >
                              <span style={{ fontSize: isMobile ? '16px' : '18px', width: '24px' }}>{sousItem.icon}</span>
                              <span style={{ fontSize: isMobile ? '12px' : '14px', color: pageActive === sousItem.id ? '#fff' : 'rgba(255,255,255,0.9)' }}>{sousItem.label}</span>
                              {estBloque ? (
                                <span style={{ marginLeft: 'auto', fontSize: '13px' }} title="Non inclus dans votre plan">🔒</span>
                              ) : sousItem.badge ? (
                                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px' }}>
                                  {sousItem.badge}
                                </span>
                              ) : null}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            ))}
          </div>

          {(!isMobile || menuMobileOuvert) && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  {initialeAvatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vendeur.nom}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>
                    ID: {vendeur?.id}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    {vendeur.nom_boutique || vendeur.nom || 'Vendeur'}
                  </p>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; 
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; 
                    e.currentTarget.style.color = '#fca5a5';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  }}
                >
                  🚪 Déconnexion
                </button>
              )}
            </div>
          )}
        </div>

        {isMobile && menuMobileOuvert && (
          <div className="mobile-overlay" onClick={() => setMenuMobileOuvert(false)} />
        )}

        <div className="main-content" style={mainContentStyle}>
          
          <div className="top-bar-fixed" style={topBarFixedStyle}>
            {topBarContent}
          </div>

          {banniereVendeurActive && banniereVendeurMessage && (
            <div style={{
              position: 'fixed',
              top: '56px',
              left: isMobile ? '0px' : '280px',
              right: 0,
              zIndex: 899,
              height: `${banniereVendeurHauteur}px`,
              backgroundColor: banniereVendeurCouleurBg,
              color: banniereVendeurCouleurTx,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${banniereVendeurPolice}px`,
              fontWeight: '600',
              padding: '0 16px',
              textAlign: 'center',
              transition: 'left 0.3s ease',
            }}>
              {banniereVendeurMessage}
            </div>
          )}

          <div className="scrollable-area" style={{
            paddingTop: `${56 + (banniereVendeurActive && banniereVendeurMessage ? Number(banniereVendeurHauteur) : 0)}px`
          }}>
            {renderPage()}
          </div>

          <div className="footer-fixed" style={footerFixedStyle}>
            {footerText}
          </div>
        </div>
      </div>

      <Modal open={modalOuvert} onClose={fermerModal} title="Contacter l'administration"
        primaryAction={{ content: 'Envoyer', onAction: envoyerMessage }}
        secondaryActions={[{ content: 'Annuler', onAction: fermerModal }]}>
        <Modal.Section>
          <TextField 
            label="Votre message" 
            value={message} 
            onChange={setMessage}
            multiline={5} 
            autoComplete="off" 
            placeholder="Écrivez votre message ici..." 
          />
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}

export default AppVendeur;
