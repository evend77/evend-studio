/**
 * StatistiquesSignalements.tsx — src/pages/admin/StatistiquesSignalements.tsx
 * Page de statistiques détaillées pour les signalements
 * Graphiques, tendances, répartitions
 */

import React, { useState, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
  info: '#3b82f6', purple: '#8b5cf6', pink: '#ec4899',
};

// ── Types adaptés à la structure réelle de la BD ─────────────────────────────
interface StatsSignalements {
  total: number;
  nouveaux: number;
  enCours: number;
  resolus: number;
  parType: {
    type: string;
    count: number;
    pourcentage: number;
    couleur: string;
  }[];
  parGravite: {
    gravite: string;  // 'nouveau', 'en_cours', 'resolu', 'rejete'
    count: number;
    couleur: string;
  }[];
  parCible: {
    cible: 'vendeur' | 'acheteur';
    count: number;
  }[];
  evolution: {
    date: string;
    total: number;
    nouveaux: number;
  }[];
  tempsResolution: {
    moyenne: number; // en heures
    parGravite: {
      gravite: string;
      temps: number;
    }[];
  };
  topSignalants: {
    id: number;
    nom: string;
    type: 'vendeur' | 'acheteur';
    count: number;
  }[];
  topSignales: {
    id: number;
    nom: string;
    type: 'vendeur';
    count: number;
  }[];
}

// ── Composant KPI Card ──────────────────────────────────────────────────────
function KPICard({ icon, titre, valeur, sousTitre, couleur, tendance }: {
  icon: string;
  titre: string;
  valeur: string | number;
  sousTitre: string;
  couleur: string;
  tendance?: { valeur: number; positif: boolean };
}) {
  return (
    <div style={{
      backgroundColor: T.card,
      borderRadius: '14px',
      border: `1px solid ${T.border}`,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${couleur}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {icon}
        </div>
        {tendance && (
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            color: tendance.positif ? T.success : T.danger,
            backgroundColor: tendance.positif ? '#dcfce7' : '#fee2e2',
            padding: '4px 10px',
            borderRadius: '20px',
          }}>
            {tendance.positif ? '↑' : '↓'} {tendance.valeur}%
          </span>
        )}
      </div>
      <p style={{ fontSize: '28px', fontWeight: '800', color: T.text, margin: '0 0 4px 0', lineHeight: 1.2 }}>
        {valeur}
      </p>
      <p style={{ fontSize: '13px', fontWeight: '600', color: T.textLight, margin: '0 0 2px 0' }}>
        {titre}
      </p>
      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
        {sousTitre}
      </p>
    </div>
  );
}

// ── Composant Barre de progression ──────────────────────────────────────────
function ProgressBar({ valeur, max, couleur, label, pourcentage }: {
  valeur: number;
  max: number;
  couleur: string;
  label: string;
  pourcentage?: number;
}) {
  const pourcent = pourcentage || (max > 0 ? (valeur / max) * 100 : 0);
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: T.text }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: T.textLight }}>{valeur}</span>
      </div>
      <div style={{
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        height: '10px',
        overflow: 'hidden',
      }}>
        <div style={{
          backgroundColor: couleur,
          height: '100%',
          width: `${pourcent}%`,
          borderRadius: '8px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// ── Composant Carte de statistiques ─────────────────────────────────────────
function StatsCard({ titre, children, action }: {
  titre: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: T.card,
      borderRadius: '14px',
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: `2px solid ${T.accent}`,
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: '800',
          color: T.accent,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {titre}
        </h3>
        {action}
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
interface StatistiquesSignalementsProps {
  naviguerVers?: (page: string, data?: any) => void;
}

export default function StatistiquesSignalements({ naviguerVers }: StatistiquesSignalementsProps) {
  const [stats, setStats] = useState<StatsSignalements | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<'7j' | '30j' | '90j' | 'annee'>('30j');
  const token = localStorage.getItem('token');

  // Charger les stats depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/api/signalements/stats?periode=${periode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Stats reçues:', data);
          setStats(data);
        } else {
          console.error('Erreur chargement stats:', response.status);
        }
      } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [periode, token]);

  // Calculs
  const totalSignalements = stats?.total || 0;
  const tauxResolution = totalSignalements > 0 
    ? Math.round(((stats?.resolus || 0) / totalSignalements) * 100) 
    : 0;

  // Fonction pour obtenir le label de gravité
  const getGraviteLabel = (gravite: string) => {
    const labels: Record<string, string> = {
      'nouveau': '🆕 Nouveau',
      'en_cours': '⏳ En cours',
      'resolu': '✅ Résolu',
      'rejete': '❌ Rejeté'
    };
    return labels[gravite] || gravite;
  };

  // Fonction pour obtenir la couleur de gravité
  const getGraviteCouleur = (gravite: string) => {
    const couleurs: Record<string, string> = {
      'nouveau': T.info,
      'en_cours': T.warning,
      'resolu': T.success,
      'rejete': T.textLight
    };
    return couleurs[gravite] || T.textLight;
  };

  return (
    <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>
      
      {/* En-tête */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🚩 Statistiques des signalements
          </h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>
            Analyse et tendances des signalements sur la plateforme
          </p>
        </div>
        
        {/* Sélecteur de période */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: T.card, padding: '4px', borderRadius: '10px', border: `1px solid ${T.border}` }}>
          {[
            ['7j', '7 jours'],
            ['30j', '30 jours'],
            ['90j', '90 jours'],
            ['annee', 'Année'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriode(val as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: periode === val ? T.accent : 'transparent',
                color: periode === val ? 'white' : T.textLight,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: T.textLight }}>Chargement des statistiques...</p>
        </div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: T.textLight }}>Aucune donnée disponible</p>
        </div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <KPICard
              icon="🚩"
              titre="Signalements totaux"
              valeur={stats.total}
              sousTitre="Depuis le début"
              couleur={T.accent}
            />
            <KPICard
              icon="🆕"
              titre="Nouveaux"
              valeur={stats.nouveaux}
              sousTitre="Cette période"
              couleur={T.info}
            />
            <KPICard
              icon="⏳"
              titre="En cours"
              valeur={stats.enCours}
              sousTitre={`${totalSignalements > 0 ? Math.round((stats.enCours / totalSignalements) * 100) : 0}% du total`}
              couleur={T.warning}
            />
            <KPICard
              icon="✅"
              titre="Résolus"
              valeur={stats.resolus}
              sousTitre={`${tauxResolution}% de résolution`}
              couleur={T.success}
            />
          </div>

          {/* Graphiques et répartitions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
            
            {/* Répartition par type (catégorie) */}
            <StatsCard titre="📊 Répartition par catégorie">
              {stats.parType && stats.parType.length > 0 ? (
                stats.parType.map(item => (
                  <ProgressBar
                    key={item.type}
                    label={item.type}
                    valeur={item.count}
                    max={stats.total}
                    couleur={item.couleur}
                    pourcentage={item.pourcentage}
                  />
                ))
              ) : (
                <p style={{ textAlign: 'center', color: T.textLight, padding: '20px' }}>Aucune donnée</p>
              )}
              <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: T.textLight }}>
                Total: {stats.total} signalements
              </div>
            </StatsCard>

            {/* Répartition par statut (gravité) */}
            <StatsCard titre="📊 Répartition par statut">
              {stats.parGravite && stats.parGravite.length > 0 ? (
                stats.parGravite.map(item => (
                  <ProgressBar
                    key={item.gravite}
                    label={getGraviteLabel(item.gravite)}
                    valeur={item.count}
                    max={stats.total}
                    couleur={getGraviteCouleur(item.gravite)}
                  />
                ))
              ) : (
                <p style={{ textAlign: 'center', color: T.textLight, padding: '20px' }}>Aucune donnée</p>
              )}
              
              {/* Temps de résolution */}
              {stats.tempsResolution && stats.tempsResolution.moyenne > 0 && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${T.border}`
                }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: '0 0 4px 0' }}>
                    ⏱️ Temps moyen de résolution
                  </p>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: T.accent }}>
                      {stats.tempsResolution.moyenne}h
                    </span>
                  </div>
                </div>
              )}
            </StatsCard>

            {/* Répartition par type de signaleur */}
            <StatsCard titre="🎯 Signaleurs">
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', padding: '16px 0' }}>
                {stats.parCible && stats.parCible.map(item => (
                  <div key={item.cible} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: item.cible === 'vendeur' ? '#e0f2fe' : '#fce7f3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginBottom: '8px',
                    }}>
                      {item.cible === 'vendeur' ? '🏪' : '🛒'}
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: T.text, margin: '0 0 2px 0' }}>
                      {item.count}
                    </p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0, textTransform: 'capitalize' }}>
                      {item.cible === 'vendeur' ? 'Vendeurs' : 'Acheteurs'}
                    </p>
                  </div>
                ))}
              </div>
            </StatsCard>

            {/* Évolution */}
            <StatsCard titre="📈 Évolution (7 derniers jours)">
              {stats.evolution && stats.evolution.length > 0 ? (
                <>
                  <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    {stats.evolution.map((jour, i) => {
                      const max = Math.max(...stats.evolution.map(j => j.total), 1);
                      const hauteurTotal = (jour.total / max) * 120;
                      const hauteurNouveaux = (jour.nouveaux / max) * 120;
                      
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${hauteurTotal}px`, 
                            backgroundColor: T.accent,
                            borderRadius: '4px 4px 0 0',
                            opacity: 0.7,
                            transition: 'height 0.3s',
                          }} />
                          <div style={{ 
                            width: '100%', 
                            height: `${hauteurNouveaux}px`, 
                            backgroundColor: T.danger,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s',
                          }} />
                          <span style={{ fontSize: '9px', color: T.textLight }}>{jour.date}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: T.accent, borderRadius: '3px', opacity: 0.7 }} />
                      <span style={{ fontSize: '10px', color: T.textLight }}>Total</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: T.danger, borderRadius: '3px' }} />
                      <span style={{ fontSize: '10px', color: T.textLight }}>Nouveaux</span>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ textAlign: 'center', color: T.textLight, padding: '40px' }}>Aucune évolution</p>
              )}
            </StatsCard>
          </div>

          {/* Tableaux des tops */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Top signalants */}
            <StatsCard titre="👤 Utilisateurs qui signalent le plus">
              {stats.topSignalants && stats.topSignalants.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: T.textLight }}>Utilisateur</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: T.textLight }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: T.textLight }}>Signalements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSignalants.map((item, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 4px', fontSize: '12px', fontWeight: '600', color: T.text }}>
                          {item.nom || 'Anonyme'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: item.type === 'vendeur' ? '#e0f2fe' : '#fce7f3',
                            color: item.type === 'vendeur' ? '#0369a1' : '#be185d',
                          }}>
                            {item.type === 'vendeur' ? '🏪 Vendeur' : '🛒 Acheteur'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 4px', fontSize: '13px', fontWeight: '700', color: T.danger }}>
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: T.textLight, padding: '20px' }}>Aucun signalant</p>
              )}
            </StatsCard>

            {/* Top signalés (vendeurs) */}
            <StatsCard titre="🚨 Vendeurs les plus signalés">
              {stats.topSignales && stats.topSignales.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: T.textLight }}>Vendeur</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: T.textLight }}>Signalements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSignales.map((item, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 4px', fontSize: '12px', fontWeight: '600', color: T.text }}>
                          {item.nom || 'Inconnu'}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 4px', fontSize: '13px', fontWeight: '700', color: T.danger }}>
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: T.textLight, padding: '20px' }}>Aucun vendeur signalé</p>
              )}
            </StatsCard>
          </div>

          {/* Résumé et actions rapides */}
          <div style={{
            marginTop: '20px',
            backgroundColor: T.card,
            borderRadius: '12px',
            border: `1px solid ${T.border}`,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: T.text, margin: '0 0 4px 0' }}>
                📋 Résumé de la période
              </p>
              <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>
                {stats.nouveaux} nouveaux signalements · {stats.enCours} en cours · Taux de résolution {tauxResolution}%
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => naviguerVers && naviguerVers('signalements-liste')}
                style={{
                  backgroundColor: T.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Voir tous les signalements →
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  backgroundColor: 'white',
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🖨️ Exporter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
