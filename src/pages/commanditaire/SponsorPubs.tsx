// src/pages/commanditaire/SponsorPubs.tsx
import React, { useState, useEffect } from 'react';

interface Pub {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  url_lien: string;
  actif: boolean;
  statut: 'active' | 'pause' | 'budget_epuise' | 'en_attente';
  impressions: number;
  clics: number;
  type: string;
  effet: string | null;
  prix_par_click: number;
  budget_type: string;
  budget_montant: number;
  budget_depense: number;
  categories: string[];
  roue_active: boolean;
  created_at: string;
}

interface SponsorPubsProps {
  token: string;
}

const TYPE_ICONES: Record<string, string> = {
  basique: '📸', carrousel: '🎠', video: '🎬', interactive: '✨',
  social: '🔥', avant_apres: '🔄', parallaxe: '🎯', minijeu: '🎮',
  codepromo: '🏷️', temoignage: '⭐',
};

const STATUT_INFO: Record<string, { label: string; couleur: string }> = {
  active: { label: '✅ ACTIVE', couleur: '#16a34a' },
  pause: { label: '⏸ EN PAUSE', couleur: '#f59e0b' },
  budget_epuise: { label: '💸 BUDGET ÉPUISÉ', couleur: '#dc2626' },
  en_attente: { label: '⏳ EN ATTENTE', couleur: '#6b7280' },
};

function SponsorPubs({ token }: SponsorPubsProps) {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const fetchPubs = async () => {
    setLoading(true);
    setErreur('');
    try {
      const response = await fetch('/api/sponsors/pubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setPubs(data.pubs || []);
    } catch (error) {
      console.error('Erreur chargement pubs:', error);
      setErreur('Impossible de charger vos publicités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPubs(); }, []);

  const toggleActif = async (pub: Pub) => {
    setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: !p.actif } : p));
    try {
      const response = await fetch(`/api/sponsors/pubs/${pub.id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actif: !pub.actif }),
      });
      if (!response.ok) throw new Error('Erreur');
    } catch (error) {
      console.error('Erreur toggle:', error);
      setPubs(prev => prev.map(p => p.id === pub.id ? { ...p, actif: pub.actif } : p));
      alert('❌ Erreur lors du changement de statut');
    }
  };

  const supprimerPub = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette publicité ?')) return;
    try {
      const response = await fetch(`/api/sponsors/pubs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      setPubs(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{
        background: '#fef3c7', borderRadius: '12px', padding: '20px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#92400e' }}>📢 Gestion des publicités</h3>
          <p style={{ margin: '4px 0 0', color: '#78350f', fontSize: '14px' }}>
            Créez des publicités qui apparaîtront dans les sites des gestionnaires
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/sponsor/pubs/creer'}
          style={{
            padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
          }}
        >
          ➕ Créer une publicité
        </button>
      </div>

      {erreur && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          ❌ {erreur}
        </div>
      )}

      {pubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📢</p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#666' }}>Aucune publicité pour le moment</p>
          <p style={{ fontSize: '14px' }}>Créez votre première publicité pour atteindre les gestionnaires</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {pubs.map((pub) => (
            <div key={pub.id} style={{
              borderRadius: '12px', overflow: 'hidden', background: '#fff',
              border: `1px solid ${pub.actif ? '#eee' : '#fca5a5'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: pub.actif ? 1 : 0.7,
            }}>
              <div style={{ position: 'relative' }}>
                <img src={pub.url_image} alt={pub.titre} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <span style={{
                  position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff',
                  fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                }}>
                  {TYPE_ICONES[pub.type] || '📸'} {pub.type}
                </span>
                <span style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: STATUT_INFO[pub.statut]?.couleur || '#666', color: '#fff',
                  fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                }}>
                  {STATUT_INFO[pub.statut]?.label || pub.statut}
                </span>
              </div>
              <div style={{ padding: '14px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pub.titre}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {pub.description}
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '12px', color: '#555' }}>
                  <span>👁️ {pub.impressions ?? 0}</span>
                  <span>🖱️ {pub.clics ?? 0}</span>
                  <span>💰 {pub.prix_par_click}$/clic</span>
                </div>

                <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px' }}>
                  Budget : {pub.budget_depense ?? 0}$ / {pub.budget_montant}$ ({pub.budget_type})
                  {pub.roue_active && <span style={{ marginLeft: 8 }}>🎡 Roue activée</span>}
                </div>
                {pub.statut === 'budget_epuise' && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '10px', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px' }}>
                    Budget atteint — la pub redémarrera automatiquement à la prochaine période, ou réactivez-la manuellement.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#999' }}>{formatDate(pub.created_at)}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => window.location.href = `/sponsor/pubs/creer?id=${pub.id}`}
                      style={{ padding: '5px 12px', background: '#e0e7ff', border: 'none', borderRadius: '6px', color: '#4338ca', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => toggleActif(pub)}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                        background: pub.actif ? '#fef3c7' : '#dcfce7', color: pub.actif ? '#92400e' : '#166534',
                      }}
                    >
                      {pub.actif ? '⏸ Mettre en pause' : '▶️ Réactiver'}
                    </button>
                    <button
                      onClick={() => supprimerPub(pub.id)}
                      style={{ padding: '5px 10px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SponsorPubs;