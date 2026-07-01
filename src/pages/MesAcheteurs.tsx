// src/pages/studio/MesAcheteurs.tsx
// e-Vend Studio — Liste des acheteurs du site vendeur
// Inspiré de ListeAcheteurs.tsx de e-Vend

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';
const CP = '#c9a96e';

interface Acheteur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  statut: 'actif' | 'suspendu';
  created_at: string;
  derniere_connexion: string;
  nb_commandes: number;
  total_achats: number;
}

interface Commande {
  id: number;
  produit_nom: string;
  variante: string;
  quantite: number;
  total: number;
  statut: string;
  created_at: string;
}

function dureeDepuis(iso: string) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 30) return `il y a ${diff} jours`;
  if (diff < 365) return `il y a ${Math.floor(diff/30)} mois`;
  return `il y a ${Math.floor(diff/365)} an(s)`;
}

function StatCard({ icone, label, valeur, couleur }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icone}</span>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.08em', color: '#888', margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: couleur, margin: 0 }}>{valeur}</p>
    </div>
  );
}

export default function MesAcheteurs({ vendeurId }: { vendeurId: number }) {
  const [acheteurs, setAcheteurs]   = useState<Acheteur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [recherche, setRecherche]   = useState('');
  const [filtre, setFiltre]         = useState<'tous' | 'actif' | 'suspendu'>('tous');
  const [modalAcheteur, setModalAcheteur] = useState<Acheteur | null>(null);
  const [commandes, setCommandes]   = useState<Commande[]>([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_BASE}/acheteurs-studio/vendeur`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAcheteurs(data.acheteurs || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ouvrirModal = async (a: Acheteur) => {
    setModalAcheteur(a);
    setLoadingCommandes(true);
    try {
      const res = await fetch(`${API_BASE}/acheteurs-studio/${a.id}/commandes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCommandes(data.commandes || []);
    } catch {}
    setLoadingCommandes(false);
  };

  const changerStatut = async (id: number, statut: string) => {
    await fetch(`${API_BASE}/acheteurs-studio/${id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ statut }),
    });
    setAcheteurs(prev => prev.map(a => a.id === id ? { ...a, statut: statut as any } : a));
    setModalAcheteur(prev => prev ? { ...prev, statut: statut as any } : null);
  };

  const acheteursFiltres = acheteurs.filter(a => {
    const okStatut   = filtre === 'tous' || a.statut === filtre;
    const okRecherche = !recherche ||
      `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(recherche.toLowerCase());
    return okStatut && okRecherche;
  });

  const totalAchats = acheteurs.reduce((acc, a) => acc + parseFloat(String(a.total_achats || 0)), 0);
  const nbActifs    = acheteurs.filter(a => a.statut === 'actif').length;

  const STATUT_CONFIG = {
    actif:    { label: 'Actif',    bg: '#dcfce7', couleur: '#16a34a' },
    suspendu: { label: 'Suspendu', bg: '#fee2e2', couleur: '#dc2626' },
  };

  const COMMANDE_STATUT: Record<string, { label: string; couleur: string; bg: string }> = {
    complete:    { label: 'Complétée',  couleur: '#16a34a', bg: '#dcfce7' },
    en_attente:  { label: 'En attente', couleur: '#d97706', bg: '#fef9c3' },
    annulee:     { label: 'Annulée',    couleur: '#dc2626', bg: '#fee2e2' },
    expediee:    { label: 'Expédiée',   couleur: '#6366f1', bg: '#ede9fe' },
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: '28px 32px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* EN-TÊTE */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👥</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Mes acheteurs</h1>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Clients inscrits sur votre site Studio</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icone="👥" label="Total inscrits"  valeur={acheteurs.length}          couleur={CP} />
        <StatCard icone="✅" label="Actifs"           valeur={nbActifs}                   couleur="#16a34a" />
        <StatCard icone="🛒" label="Total commandes" valeur={acheteurs.reduce((a,b) => a + parseInt(String(b.nb_commandes||0)), 0)} couleur="#6366f1" />
        <StatCard icone="💰" label="Total achats"    valeur={`${totalAchats.toFixed(2)}$`} couleur="#d97706" />
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un acheteur..."
          style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: 260 }} />
        {(['tous', 'actif', 'suspendu'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 16px', border: `1px solid ${filtre === f ? CP : '#e5e7eb'}`, borderRadius: 8, background: filtre === f ? CP : '#fff', color: filtre === f ? '#fff' : '#555', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {f === 'tous' ? 'Tous' : f === 'actif' ? '✅ Actifs' : '🚫 Suspendus'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>{acheteursFiltres.length} acheteur(s)</span>
      </div>

      {/* TABLEAU */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Chargement...</div>
        ) : acheteursFiltres.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p style={{ fontSize: 15, color: '#888' }}>Aucun acheteur inscrit pour l'instant.</p>
            <p style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>Les acheteurs apparaîtront ici quand ils s'inscriront sur votre site.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f8f6', borderBottom: '2px solid #e5e7eb' }}>
                {['Acheteur', 'Email', 'Commandes', 'Total achats', 'Statut', 'Inscrit', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 11, textTransform: 'uppercase' as any, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acheteursFiltres.map((a, i) => {
                const sc = STATUT_CONFIG[a.statut] || STATUT_CONFIG.actif;
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: CP, flexShrink: 0 }}>
                          {(a.prenom || a.nom).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{a.prenom} {a.nom}</p>
                          <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>#{a.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>{a.email}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>{a.nb_commandes || 0}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: CP }}>{parseFloat(String(a.total_achats || 0)).toFixed(2)}$</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.couleur }}>{sc.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{dureeDepuis(a.created_at)}</td>
                    <td style={{ padding: '14px 16px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{dureeDepuis(a.derniere_connexion)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => ouvrirModal(a)}
                        style={{ padding: '5px 12px', border: `1px solid ${CP}40`, borderRadius: 6, background: '#fff', color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL ACHETEUR */}
      {modalAcheteur && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setModalAcheteur(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: CP }}>
                  {(modalAcheteur.prenom || modalAcheteur.nom).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{modalAcheteur.prenom} {modalAcheteur.nom}</h2>
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{modalAcheteur.email}</p>
                </div>
              </div>
              <button onClick={() => setModalAcheteur(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {/* Infos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                ['📞 Téléphone',      modalAcheteur.telephone || '—'],
                ['📅 Inscrit',        dureeDepuis(modalAcheteur.created_at)],
                ['🕐 Dernière conn.', dureeDepuis(modalAcheteur.derniere_connexion)],
                ['🛒 Commandes',      String(modalAcheteur.nb_commandes || 0)],
                ['💰 Total achats',   `${parseFloat(String(modalAcheteur.total_achats||0)).toFixed(2)}$`],
              ].map(([label, valeur]) => (
                <div key={label} style={{ padding: '10px 14px', background: '#f8f8f6', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{valeur}</span>
                </div>
              ))}
              <div style={{ padding: '10px 14px', background: '#f8f8f6', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>Statut</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: modalAcheteur.statut === 'actif' ? '#dcfce7' : '#fee2e2', color: modalAcheteur.statut === 'actif' ? '#16a34a' : '#dc2626' }}>
                  {modalAcheteur.statut === 'actif' ? 'Actif' : 'Suspendu'}
                </span>
              </div>
            </div>

            {/* Actions statut */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {modalAcheteur.statut === 'actif' ? (
                <button onClick={() => changerStatut(modalAcheteur.id, 'suspendu')}
                  style={{ padding: '8px 18px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  🚫 Suspendre
                </button>
              ) : (
                <button onClick={() => changerStatut(modalAcheteur.id, 'actif')}
                  style={{ padding: '8px 18px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#16a34a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  ✅ Réactiver
                </button>
              )}
            </div>

            {/* Commandes */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>
                Historique des commandes ({commandes.length})
              </h3>
              {loadingCommandes ? (
                <p style={{ color: '#aaa', fontSize: 13 }}>Chargement...</p>
              ) : commandes.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 13 }}>Aucune commande.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {commandes.map(c => {
                    const sc = COMMANDE_STATUT[c.statut] || { label: c.statut, couleur: '#888', bg: '#f5f5f5' };
                    return (
                      <div key={c.id} style={{ padding: '12px 16px', background: '#f8f8f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0, fontSize: 13 }}>{c.produit_nom}</p>
                          {c.variante && <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{c.variante}</p>}
                          <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{dureeDepuis(c.created_at)} · Qté: {c.quantite}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: CP, margin: 0 }}>{parseFloat(String(c.total)).toFixed(2)}$</p>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.couleur }}>{sc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}