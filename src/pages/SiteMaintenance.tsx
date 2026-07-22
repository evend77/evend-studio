// src/pages/SiteMaintenance.tsx
// Page publique affichée à la place du site quand :
//  - le gestionnaire a lui-même activé le mode maintenance (StudioConfigGenerale.tsx, onglet Avancé)
//  - OU l'admin a mis le statut du gestionnaire à "En maintenance" (ListeGestionnaires.tsx)
//
// Contenu configurable depuis l'admin (ConfigPageSiteMaintenance.tsx), lu via
// la route publique GET /api/admin/config/page-maintenance/public.
// Si le gestionnaire a lui-même écrit un message personnalisé (message_maintenance),
// celui-ci remplace le sous-titre par défaut.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface ConfigMaintenance {
  titre:        string;
  sous_titre:   string;
  texte_bouton: string;
  url_bouton:   string;
  image_url:    string;
}

const DEFAUTS: ConfigMaintenance = {
  titre:        'Site en maintenance',
  sous_titre:   'Nous effectuons présentement des travaux de maintenance. Merci de revenir un peu plus tard.',
  texte_bouton: '',
  url_bouton:   '',
  image_url:    '',
};

export default function SiteMaintenance({ messagePersonnalise }: { messagePersonnalise?: string | null }) {
  const [config, setConfig] = useState<ConfigMaintenance>(DEFAUTS);

  useEffect(() => {
    fetch(`${API_BASE}/admin/config/page-maintenance/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setConfig({
            titre:        data.titre        || DEFAUTS.titre,
            sous_titre:   data.sous_titre   || DEFAUTS.sous_titre,
            texte_bouton: data.texte_bouton || '',
            url_bouton:   data.url_bouton   || '',
            image_url:    data.image_url    || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const sousTitre = messagePersonnalise?.trim() ? messagePersonnalise : config.sous_titre;

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '20px', padding: '48px 36px',
        maxWidth: '460px', width: '100%', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {config.image_url ? (
          <img
            src={config.image_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: 20 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        )}

        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>
          {config.titre}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
          {sousTitre}
        </p>

        {config.texte_bouton && (
          <a
            href={config.url_bouton || '#'}
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg,#c9a96e,#a07840)', borderRadius: '10px',
              color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20,
            }}
          >
            {config.texte_bouton}
          </a>
        )}

        <div style={{
          fontSize: 12, fontWeight: 700, color: '#c9a96e',
          background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)',
          borderRadius: '10px', padding: '10px 16px', display: 'inline-block',
        }}>
          e-Vend Studio
        </div>
      </div>
    </div>
  );
}