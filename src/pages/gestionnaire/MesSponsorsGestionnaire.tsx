// src/pages/gestionnaire/MesSponsorsGestionnaire.tsx
import React, { useState, useEffect } from 'react';

interface PubGestionnaire {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  type: string;
  categories: string[];
  sponsor_id: number;
  sponsor_nom: string;
  bloquee: boolean;
  sponsor_bloque: boolean;
}

interface MonetisationDetail {
  pub_id: number;
  titre: string;
  sponsor_nom: string;
  impressions: number;
  clics: number;
  revenu_brut: number;
  revenu_gestionnaire: number;
}

interface MesSponsorsGestionnaireProps {
  gestionnaireId: number | string;
}

const API_BASE = '/api/gestionnaires/addon-pub-sponsor';

function MesSponsorsGestionnaire({ gestionnaireId }: MesSponsorsGestionnaireProps) {
  const [onglet, setOnglet] = useState<'pubs' | 'monetisation'>('pubs');
  const [pubs, setPubs] = useState<PubGestionnaire[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const [monetisation, setMonetisation] = useState<{
    taux_partage_pub: number; total_revenu_brut: number; total_revenu_gestionnaire: number; detail: MonetisationDetail[];
  } | null>(null);
  const [loadingMonetisation, setLoadingMonetisation] = useState(true);
  const [periode, setPeriode] = useState<'7' | '30' | '90'>('30');

  const token = () => localStorage.getItem('token') || '';

  const fetchPubs = async () => {
    setLoadingPubs(true);
    try {
      const res = await fetch(`${API_BASE}/pubs`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPubs(data.pubs || []);
    } catch (e) {
      console.error('Erreur chargement pubs:', e);
    } finally {
      setLoadingPubs(false);
    }
  };

  const fetchMonetisation = async () => {
    setLoadingMonetisation(true);
    try {
      const res = await fetch(`${API_BASE}/monetisation?periode=${periode}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setMonetisation(data);
    } catch (e) {
      console.error('Erreur chargement monétisation:', e);
    } finally {
      setLoadingMonetisation(false);
    }
  };

  useEffect(() => { fetchPubs(); }, []);
  useEffect(() => { fetchMonetisation(); }, [periode]);

  const bloquerPub = async (pubId: number, bloquer: boolean) => {
    setPubs(prev => prev.map(p => p.id === pubId ? { ...p, bloquee: bloquer } : p));
    try {
      await fetch(`${API_BASE}/pubs/${pubId}/bloquer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ bloquer }),
      });
    } catch (e) {
      console.error('Erreur blocage pub:', e);
      fetchPubs();
    }
  };

  const bloquerSponsor = async (sponsorId: number, bloquer: boolean) => {
    setPubs(prev => prev.map(p => p.sponsor_id === sponsorId ? { ...p, sponsor_bloque: bloquer } : p));
    try {
      await fetch(`${API_BASE}/sponsors/${sponsorId}/bloquer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ bloquer }),
      });
    } catch (e) {
      console.error('Erreur blocage sponsor:', e);
      fetchPubs();
    }
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(num || 0);

  // Regrouper par sponsor pour l'affichage
  const sponsorsMap = new Map<number, { nom: string; pubs: PubGestionnaire[]; bloque: boolean }>();
  pubs.forEach(p => {
    if (!sponsorsMap.has(p.sponsor_id)) sponsorsMap.set(p.sponsor_id, { nom: p.sponsor_nom, pubs: [], bloque: p.sponsor_bloque });
    sponsorsMap.get(p.sponsor_id)!.pubs.push(p);
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 8px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>⭐</span> Mes sponsors
      </h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
        Gérez les publicités affichées sur votre site et suivez vos revenus générés.
      </p>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
        <button
          onClick={() => setOnglet('pubs')}
          style={{
            padding: '12px 20px', background: 'transparent', border: 'none',
            borderBottom: onglet === 'pubs' ? '3px solid #f59e0b' : '3px solid transparent',
            color: onglet === 'pubs' ? '#f59e0b' : '#666',
            fontWeight: onglet === 'pubs' ? 700 : 500, cursor: 'pointer', fontSize: 14,
          }}
        >
          📢 Publicités sur mon site
        </button>
        <button
          onClick={() => setOnglet('monetisation')}
          style={{
            padding: '12px 20px', background: 'transparent', border: 'none',
            borderBottom: onglet === 'monetisation' ? '3px solid #f59e0b' : '3px solid transparent',
            color: onglet === 'monetisation' ? '#f59e0b' : '#666',
            fontWeight: onglet === 'monetisation' ? 700 : 500, cursor: 'pointer', fontSize: 14,
          }}
        >
          💰 Monétisation
        </button>
      </div>

      {/* ── ONGLET PUBS ─────────────────────────────────────────────── */}
      {onglet === 'pubs' && (
        loadingPubs ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>⏳ Chargement...</div>
        ) : sponsorsMap.size === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#666' }}>Aucune publicité active pour le moment</p>
            <p style={{ fontSize: 13 }}>Les publicités commanditaires apparaîtront ici dès qu'elles seront disponibles.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from(sponsorsMap.entries()).map(([sponsorId, s]) => (
              <div key={sponsorId} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', background: s.bloque ? '#fef2f2' : '#f9fafb', borderBottom: '1px solid #e5e7eb',
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{s.nom}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>{s.pubs.length} publicité{s.pubs.length > 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => bloquerSponsor(sponsorId, !s.bloque)}
                    style={{
                      padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${s.bloque ? '#16a34a' : '#dc2626'}`,
                      background: s.bloque ? '#16a34a' : '#fff', color: s.bloque ? '#fff' : '#dc2626',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {s.bloque ? '✓ Débloquer ce sponsor' : '🚫 Bloquer ce sponsor'}
                  </button>
                </div>
                <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {s.pubs.map(p => (
                    <div key={p.id} style={{
                      border: `1.5px solid ${p.bloquee ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden',
                      opacity: s.bloque ? 0.5 : 1,
                    }}>
                      <img src={p.url_image} alt={p.titre} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: 10 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.titre}
                        </p>
                        <button
                          disabled={s.bloque}
                          onClick={() => bloquerPub(p.id, !p.bloquee)}
                          style={{
                            width: '100%', padding: '6px 0', borderRadius: 6, border: 'none',
                            background: p.bloquee ? '#16a34a' : '#fef2f2',
                            color: p.bloquee ? '#fff' : '#dc2626',
                            fontSize: 11, fontWeight: 700, cursor: s.bloque ? 'default' : 'pointer',
                          }}
                        >
                          {p.bloquee ? '✓ Débloquée' : '🚫 Bloquer'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ONGLET MONÉTISATION ─────────────────────────────────────── */}
      {onglet === 'monetisation' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['7', '30', '90'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                style={{
                  padding: '6px 16px', borderRadius: 20,
                  border: periode === p ? '2px solid #f59e0b' : '1px solid #d1d5db',
                  background: periode === p ? '#fef3c7' : '#fff',
                  color: periode === p ? '#92400e' : '#666',
                  fontWeight: periode === p ? 700 : 400, cursor: 'pointer', fontSize: 13,
                }}
              >
                {p} jours
              </button>
            ))}
          </div>

          {loadingMonetisation ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>⏳ Chargement...</div>
          ) : !monetisation ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Erreur lors du chargement.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>📊 Votre part actuelle</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{monetisation.taux_partage_pub}%</div>
                  <div style={{ fontSize: 11, color: '#999' }}>Défini par e-Vend Studio</div>
                </div>
                <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>💰 Revenu total généré</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{formatCurrency(monetisation.total_revenu_brut)}</div>
                </div>
                <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>🏦 Votre part</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{formatCurrency(monetisation.total_revenu_gestionnaire)}</div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>📋 Détail par publicité</h3>
                </div>
                {monetisation.detail.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                    Aucune donnée pour cette période.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#666' }}>Publicité</th>
                          <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#666' }}>Sponsor</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, color: '#666' }}>Impressions</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, color: '#666' }}>Clics</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, color: '#666' }}>Revenu total</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, color: '#666' }}>Votre part</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monetisation.detail.map(d => (
                          <tr key={d.pub_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{d.titre}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#666' }}>{d.sponsor_nom}</td>
                            <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: 13 }}>{d.impressions}</td>
                            <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: 13 }}>{d.clics}</td>
                            <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: 13 }}>{formatCurrency(d.revenu_brut)}</td>
                            <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{formatCurrency(d.revenu_gestionnaire)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MesSponsorsGestionnaire;