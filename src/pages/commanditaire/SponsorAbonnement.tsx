// src/pages/commanditaire/SponsorAbonnement.tsx
import React, { useState } from 'react';

interface SponsorAbonnementProps {
  sponsorInfo: any;
  token: string;
}

// 🚧 Codé en dur pour l'instant (miroir de config/plansPhotos.js côté backend)
// — sera remplacé par un fetch admin plus tard.
const PLANS_PHOTOS = [
  { id: 'decouverte', label: 'Découverte', maxPhotos: 10, prix: 15 },
  { id: 'standard', label: 'Standard', maxPhotos: 25, prix: 29 },
  { id: 'premium', label: 'Premium', maxPhotos: 60, prix: 59 },
  { id: 'illimite', label: 'Illimité', maxPhotos: null, prix: 99 },
];

function SponsorAbonnement({ sponsorInfo, token }: SponsorAbonnementProps) {
  const peutPhotos = sponsorInfo?.type_sponsor === 'photos' || sponsorInfo?.type_sponsor === 'both';
  const peutPubs = sponsorInfo?.type_sponsor === 'pub' || sponsorInfo?.type_sponsor === 'both';

  const [changement, setChangement] = useState(false);
  const [planActuelId, setPlanActuelId] = useState<string>(sponsorInfo?.forfait || 'decouverte');
  const [photosUtilisees, setPhotosUtilisees] = useState<number>(sponsorInfo?.photos_utilisees || 0);
  const [erreurChangement, setErreurChangement] = useState('');

  const planActuel = PLANS_PHOTOS.find(p => p.id === planActuelId) || PLANS_PHOTOS[0];
  const limite = planActuel.maxPhotos;
  const pourcentage = limite ? Math.min((photosUtilisees / limite) * 100, 100) : 0;
  const proche = limite ? photosUtilisees / limite >= 0.8 : false;

  const changerForfait = async (nouveauForfaitId: string) => {
    if (nouveauForfaitId === planActuelId) return;
    setErreurChangement('');
    setChangement(true);
    try {
      const response = await fetch('/api/sponsors/forfait-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ forfait: nouveauForfaitId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErreurChangement(data.error || 'Erreur lors du changement de forfait');
        return;
      }
      setPlanActuelId(nouveauForfaitId);
      alert(`✅ ${data.message}`);
    } catch (error) {
      console.error('Erreur changement forfait:', error);
      setErreurChangement('Erreur réseau lors du changement de forfait');
    } finally {
      setChangement(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: peutPhotos && peutPubs ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {/* Forfait Photos */}
        {peutPhotos && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Forfait Photos
            </h3>

            {/* Barre de progression */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                <span>{photosUtilisees} photo{photosUtilisees > 1 ? 's' : ''} utilisée{photosUtilisees > 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 700 }}>{limite === null ? 'Illimité' : `/ ${limite}`}</span>
              </div>
              {limite !== null && (
                <div style={{ width: '100%', height: '10px', background: '#f3f4f6', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pourcentage}%`, height: '100%',
                    background: proche ? '#dc2626' : '#f59e0b',
                    borderRadius: '20px', transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
              {proche && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: '6px 0 0' }}>
                  ⚠️ Vous approchez de votre limite — pensez à passer à un forfait supérieur.
                </p>
              )}
            </div>

            {erreurChangement && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ❌ {erreurChangement}
              </div>
            )}

            {/* Les 4 paliers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PLANS_PHOTOS.map((plan) => {
                const estActuel = plan.id === planActuelId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => !changement && changerForfait(plan.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', borderRadius: '10px',
                      border: estActuel ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      background: estActuel ? '#fef3c7' : '#fff',
                      cursor: changement ? 'wait' : 'pointer',
                      opacity: changement ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: estActuel ? '#92400e' : '#1a1a1a' }}>
                        {plan.label} {estActuel && '✓'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {plan.maxPhotos === null ? 'Photos illimitées' : `${plan.maxPhotos} photos`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: estActuel ? '#92400e' : '#333' }}>
                      {plan.prix}$<span style={{ fontSize: '11px', fontWeight: 400 }}>/mois</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Forfait Publicité */}
        {peutPubs && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📢 Forfait Publicité
            </h3>
            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Forfait actuel</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                {sponsorInfo?.forfait_pub || 'Basique'}
              </div>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {sponsorInfo?.forfait_pub === 'basique' && '1000 impressions • 50$ / mois'}
                {sponsorInfo?.forfait_pub === 'standard' && '5000 impressions • 100$ / mois'}
                {sponsorInfo?.forfait_pub === 'premium' && '20000 impressions • 250$ / mois'}
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/api/sponsors/checkout/pubs'}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Mettre à jour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorAbonnement;