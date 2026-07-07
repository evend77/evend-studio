// src/components/BandeauEssai.tsx
// Bandeau d'essai affiché en haut du dashboard gestionnaire.
// Jaune pendant les 12 premiers jours, rouge les 2 derniers.
// Invisible si l'abonnement est actif ou qu'il n'y a pas d'essai.

import React, { useState, useEffect } from 'react';

interface Props {
  gestionnaireId: number;
  isMobile: boolean;
  offsetTop?: number; // top de la top-bar (défaut: 56px)
  onHauteur?: (h: number) => void; // notifie le parent de la hauteur occupée
}

export default function BandeauEssai({ gestionnaireId, isMobile, offsetTop = 56, onHauteur }: Props) {
  const [joursRestants, setJoursRestants] = useState<number | null>(null);
  const [statut, setStatut] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/abonnements-studio/mon-abonnement', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.abonnement) return;
        setStatut(data.abonnement.statut);
        if (data.abonnement.jours_essai_restants !== null && data.abonnement.jours_essai_restants !== undefined) {
          setJoursRestants(data.abonnement.jours_essai_restants);
        }
      })
      .catch(() => {});
  }, [gestionnaireId]);

  // Rien à afficher si pas en période d'essai ou abonnement actif
  if (statut !== 'essai' || joursRestants === null) {
    onHauteur?.(0);
    return null;
  }

  const estUrgent  = joursRestants <= 2;
  const hauteur    = 40;

  const couleurBg  = estUrgent ? '#fef2f2' : '#fffbeb';
  const couleurBrd = estUrgent ? '#fca5a5' : '#fcd34d';
  const couleurTxt = estUrgent ? '#991b1b' : '#92400e';
  const icone      = estUrgent ? '🚨' : '⏳';

  const message = estUrgent
    ? `${icone} Plus que ${joursRestants} jour${joursRestants !== 1 ? 's' : ''} d'essai ! Configurez votre paiement pour ne pas perdre vos données.`
    : `${icone} Période d'essai gratuite — ${joursRestants} jour${joursRestants !== 1 ? 's' : ''} restant${joursRestants !== 1 ? 's' : ''}`;

  onHauteur?.(hauteur);

  return (
    <div
      style={{
        position:        'fixed',
        top:             `${offsetTop}px`,
        left:            isMobile ? '0px' : '280px',
        right:           0,
        zIndex:          898,
        height:          `${hauteur}px`,
        background:      couleurBg,
        borderBottom:    `2px solid ${couleurBrd}`,
        color:           couleurTxt,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             12,
        fontSize:        13,
        fontWeight:      600,
        padding:         '0 16px',
        textAlign:       'center',
        transition:      'left 0.3s ease',
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => {
          // Redirige vers la page "Mes services" pour configurer le paiement
          window.dispatchEvent(new CustomEvent('naviguer-mes-services'));
        }}
        style={{
          padding:         '4px 14px',
          background:      estUrgent ? '#dc2626' : '#f59e0b',
          border:          'none',
          borderRadius:    6,
          color:           '#fff',
          fontWeight:      700,
          fontSize:        12,
          cursor:          'pointer',
          whiteSpace:      'nowrap',
          flexShrink:      0,
        }}
      >
        Configurer le paiement →
      </button>
    </div>
  );
}