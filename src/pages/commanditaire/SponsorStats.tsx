// src/pages/commanditaire/SponsorStats.tsx
import React, { useState, useEffect } from 'react';

interface Stat {
  id: number;
  titre: string;
  type: string;
  impressions: number;
  clics: number;
  ctr: number;
  cout: number;
  budget_montant: number;
  budget_depense: number;
  budget_restant: number;
  prix_par_click: number;
  actif: boolean;
  created_at: string;
  daily_stats: Array<{
    date: string;
    impressions: number;
    clics: number;
    cout: number;
  }>;
}

interface SponsorStatsProps {
  token: string;
}

function SponsorStats({ token }: SponsorStatsProps) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalClics, setTotalClics] = useState(0);
  const [totalCout, setTotalCout] = useState(0);
  const [ctrGlobal, setCtrGlobal] = useState(0);
  const [periode, setPeriode] = useState<'7' | '30' | '90'>('30');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sponsors/pubs/stats?periode=${periode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setStats(data.stats || []);
      setTotalImpressions(data.total_impressions || 0);
      setTotalClics(data.total_clics || 0);
      setTotalCout(data.total_cout || 0);
      setCtrGlobal(data.ctr_global || 0);
    } catch (error) {
      console.error('Erreur stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [periode]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-CA').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement des statistiques...</div>;
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Période */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setPeriode('7')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: periode === '7' ? '2px solid #f59e0b' : '1px solid #d1d5db',
            background: periode === '7' ? '#fef3c7' : '#fff',
            color: periode === '7' ? '#92400e' : '#666',
            fontWeight: periode === '7' ? 700 : 400,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          📅 7 jours
        </button>
        <button
          onClick={() => setPeriode('30')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: periode === '30' ? '2px solid #f59e0b' : '1px solid #d1d5db',
            background: periode === '30' ? '#fef3c7' : '#fff',
            color: periode === '30' ? '#92400e' : '#666',
            fontWeight: periode === '30' ? 700 : 400,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          📊 30 jours
        </button>
        <button
          onClick={() => setPeriode('90')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: periode === '90' ? '2px solid #f59e0b' : '1px solid #d1d5db',
            background: periode === '90' ? '#fef3c7' : '#fff',
            color: periode === '90' ? '#92400e' : '#666',
            fontWeight: periode === '90' ? 700 : 400,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          📈 90 jours
        </button>
      </div>

      {/* Cartes d'aperçu */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>👁️ Impressions</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>
            {formatNumber(totalImpressions)}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>🖱️ Clics</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
            {formatNumber(totalClics)}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>📈 CTR (Clics / Impressions)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            {ctrGlobal.toFixed(2)}%
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>💰 Dépensé</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>
            {formatCurrency(totalCout)}
          </div>
        </div>
      </div>

      {/* Graphique (simplifié en barres) */}
      {stats.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>📈 Évolution des impressions (7 derniers jours)</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '150px' }}>
            {stats.slice(0, 7).map((stat, index) => {
              const maxImpressions = Math.max(...stats.map(s => s.impressions), 1);
              const height = (stat.impressions / maxImpressions) * 130;
              return (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    height: `${height}px`,
                    background: '#f59e0b',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                    minHeight: '4px',
                  }} />
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {formatDate(stat.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tableau détaillé */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📋 Détail par publicité</h3>
        </div>
        {stats.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '48px' }}>📊</div>
            <p>Aucune donnée disponible</p>
            <p style={{ fontSize: '13px' }}>Créez des publicités pour commencer à collecter des statistiques</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>Titre</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>👁️ Impressions</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>🖱️ Clics</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>📈 CTR</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>💰 Dépensé</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>💰 Budget</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>💰 Restant</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666', fontWeight: 600 }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const budgetPourcentage = stat.budget_montant > 0 
                    ? Math.min((stat.cout / stat.budget_montant) * 100, 100) 
                    : 0;
                  const budgetDepasse = budgetPourcentage > 80;
                  return (
                    <tr key={stat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>
                        {stat.titre || 'Sans titre'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#666' }}>
                        {stat.type === 'carrousel' ? '🎠' : '📸'} {stat.type}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>
                        {formatNumber(stat.impressions)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>
                        {formatNumber(stat.clics)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', color: stat.ctr > 5 ? '#16a34a' : '#f59e0b' }}>
                        {stat.ctr.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>
                        {formatCurrency(stat.cout)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {formatCurrency(stat.budget_montant)}
                          </span>
                          {stat.budget_montant > 0 && (
                            <div style={{
                              width: '100%',
                              height: '4px',
                              background: '#e5e7eb',
                              borderRadius: '2px',
                              marginTop: '4px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${budgetPourcentage}%`,
                                height: '100%',
                                background: budgetDepasse ? '#dc2626' : '#f59e0b',
                                borderRadius: '2px',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px' }}>
                        <span style={{ 
                          fontWeight: 600,
                          color: stat.budget_restant > 0 ? '#16a34a' : '#dc2626',
                        }}>
                          {formatCurrency(stat.budget_restant)}
                        </span>
                        {stat.budget_restant <= 0 && (
                          <span style={{ fontSize: '11px', color: '#dc2626', display: 'block' }}>
                            ⚠️ Épuisé
                          </span>
                        )}
                        {stat.budget_restant / stat.budget_montant < 0.2 && stat.budget_restant > 0 && stat.budget_montant > 0 && (
                          <span style={{ fontSize: '11px', color: '#f59e0b', display: 'block' }}>
                            ⚠️ Bientôt épuisé
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: stat.actif ? '#dcfce7' : '#fee2e2',
                          color: stat.actif ? '#166534' : '#dc2626',
                        }}>
                          {stat.actif ? '✅ Actif' : '❌ Inactif'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        💡 Les statistiques sont mises à jour en temps réel
      </div>
    </div>
  );
}

export default SponsorStats;