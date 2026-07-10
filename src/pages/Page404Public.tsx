// src/pages/Page404Public.tsx
// e-Vend Studio — Page 404 publique
// Affichée aux VISITEURS quand SitePreview.tsx rencontre une erreur (site
// introuvable, id manquant, lien mort). Charge la config personnalisée par
// le gestionnaire via StudioConfigPage404.tsx — mêmes couleurs/textes/image
// que sa prévisualisation dans le dashboard.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface Config404 {
  titre: string;
  sous_titre: string;
  texte_bouton: string;
  url_bouton: string;
  couleur_fond: string;
  couleur_texte: string;
  couleur_bouton: string;
  image_url: string;
}

const DEFAUTS: Config404 = {
  titre: 'Page introuvable',
  sous_titre: "Oups\u00a0! La page que vous cherchez n'existe pas ou a \u00e9t\u00e9 d\u00e9plac\u00e9e.",
  texte_bouton: "Retour \u00e0 l'accueil",
  url_bouton: '/',
  couleur_fond: '#0a0f1e',
  couleur_texte: '#ffffff',
  couleur_bouton: '#f59e0b',
  image_url: '',
};

interface Props {
  vendeurId?: string | number | null;
}

export default function Page404Public({ vendeurId }: Props) {
  const [config, setConfig] = useState<Config404>(DEFAUTS);

  useEffect(() => {
    if (!vendeurId) return; // pas d'id → on garde les défauts génériques
    fetch(`${API_BASE}/studio/page-404/${vendeurId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig({ ...DEFAUTS, ...data }); })
      .catch(() => {}); // silencieux — les défauts restent utilisés
  }, [vendeurId]);

  return (
    <div style={{
      minHeight: '100vh',
      background: config.couleur_fond,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px',
        maxWidth: 480,
      }}>
        {config.image_url ? (
          <img
            src={config.image_url}
            alt="Illustration 404"
            style={{ maxWidth: '220px', maxHeight: '180px', objectFit: 'contain', borderRadius: '12px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ fontSize: '72px', lineHeight: 1 }}>🔍</div>
        )}

        <div style={{
          fontSize: '96px', fontWeight: 900,
          color: `${config.couleur_texte}0f`,
          lineHeight: 1, letterSpacing: '-4px',
          marginTop: '-24px', userSelect: 'none',
        }}>
          404
        </div>

        <h1 style={{ margin: '-16px 0 0', fontSize: '30px', fontWeight: 800, color: config.couleur_texte, lineHeight: 1.2 }}>
          {config.titre}
        </h1>

        <p style={{ margin: 0, fontSize: '15px', color: config.couleur_texte, opacity: 0.65, lineHeight: 1.7 }}>
          {config.sous_titre}
        </p>

        <a
          href={config.url_bouton || '/'}
          style={{
            marginTop: '10px',
            padding: '13px 32px',
            background: config.couleur_bouton,
            color: '#000',
            fontWeight: 700, fontSize: '14px',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: `0 4px 16px ${config.couleur_bouton}55`,
          }}
        >
          {config.texte_bouton}
        </a>
      </div>
    </div>
  );
}