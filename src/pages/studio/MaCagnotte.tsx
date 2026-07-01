// src/pages/studio/MaCagnotte.tsx
// e-Vend Studio — CagnottePro — Dashboard vendeur

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';
const CP = '#c9a96e';

interface Don {
  id: number;
  nom_donateur: string;
  anonyme: boolean;
  montant: string;
  message: string;
  statut: 'en_attente' | 'complete' | 'annule';
  created_at: string;
  nom_campagne: string;
  site_slug: string;
}

function StatCard({ icone, label, valeur, couleur }: { icone: string; label: string; valeur: string; couleur: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icone}</span>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: couleur, margin: 0 }}>{valeur}</p>
    </div>
  );
}

export default function MaCagnotte({ vendeurId }: { vendeurId: number }) {
  const [dons, setDons]         = useState<Don[]>([]);
  const [total, setTotal]       = useState('0.00');
  const [loading, setLoading]   = useState(true);
  const [filtre, setFiltre]     = useState<'tous' | 'complete' | 'en_attente'>('tous');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/dons/vendeur`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setDons(data.dons || []); setTotal(data.total || '0.00'); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendeurId]);

  const donsFiltres = dons.filter(d => {
    const okStatut = filtre === 'tous' || d.statut === filtre;
    const okRecherche = !recherche || d.nom_donateur.toLowerCase().includes(recherche.toLowerCase()) || (d.message || '').toLowerCase().includes(recherche.toLowerCase());
    return okStatut && okRecherche;
  });

  const totalComplete = dons.filter(d => d.statut === 'complete').length;
  const totalEnAttente = dons.filter(d => d.statut === 'en_attente').length;
  const montantCeMois = dons
    .filter(d => d.statut === 'complete' && new Date(d.created_at).getMonth() === new Date().getMonth())
    .reduce((acc, d) => acc + parseFloat(d.montant), 0);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: '28px 32px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* EN-TÊTE */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💝</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Ma Cagnotte</h1>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>CagnottePro — Suivi de vos dons reçus</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icone="💰" label="Total reçu"     valeur={`${total}$`}              couleur={CP} />
        <StatCard icone="✅" label="Dons complétés" valeur={String(totalComplete)}    couleur="#16a34a" />
        <StatCard icone="⏳" label="En attente"     valeur={String(totalEnAttente)}   couleur="#d97706" />
        <StatCard icone="📅" label="Ce mois-ci"     valeur={`${montantCeMois.toFixed(2)}$`} couleur="#6366f1" />
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un donateur..."
          style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: 240 }} />
        {(['tous', 'complete', 'en_attente'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 16px', border: `1px solid ${filtre === f ? CP : '#e5e7eb'}`, borderRadius: 8, background: filtre === f ? CP : '#fff', color: filtre === f ? '#fff' : '#555', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {f === 'tous' ? 'Tous' : f === 'complete' ? '✅ Complétés' : '⏳ En attente'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>{donsFiltres.length} don(s)</span>
      </div>

      {/* TABLEAU */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Chargement...</div>
        ) : donsFiltres.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💝</div>
            <p style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>Aucun don pour l'instant.</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>Partagez votre page CagnottePro pour recevoir des dons.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f8f6', borderBottom: '2px solid #e5e7eb' }}>
                  {['#', 'Donateur', 'Montant', 'Message', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donsFiltres.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px', color: '#aaa', fontSize: 11 }}>#{d.id}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: d.anonyme ? '#e5e7eb' : `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {d.anonyme ? '🕶' : d.nom_donateur.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{d.nom_donateur}</p>
                          {d.anonyme && <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>Don anonyme</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: CP }}>{parseFloat(d.montant).toFixed(2)}$</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: 250 }}>
                      {d.message ? (
                        <div style={{ background: '#f8f8f6', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#555', fontStyle: 'italic', border: `1px solid ${CP}20` }}>
                          "{d.message.length > 80 ? d.message.substring(0, 80) + '...' : d.message}"
                        </div>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: d.statut === 'complete' ? '#dcfce7' : d.statut === 'en_attente' ? '#fef9c3' : '#fee2e2',
                        color: d.statut === 'complete' ? '#16a34a' : d.statut === 'en_attente' ? '#d97706' : '#dc2626',
                      }}>
                        {d.statut === 'complete' ? '✅ Complété' : d.statut === 'en_attente' ? '⏳ En attente' : '❌ Annulé'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTAL */}
            <div style={{ padding: '16px 24px', borderTop: `2px solid ${CP}30`, background: `${CP}08`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: '#888', fontWeight: 600 }}>Total des dons complétés :</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: CP }}>{total}$</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}