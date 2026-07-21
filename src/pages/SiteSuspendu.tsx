// src/pages/SiteSuspendu.tsx
// Page publique affichée à la place du site quand le gestionnaire n'a pas
// reconfirmé un changement d'adresse courriel dans les 48h.
//
// ⚠️ Design par défaut — sera éventuellement personnalisable visuellement
// depuis une page de config admin (site suspendu / site en maintenance),
// pas encore construite. Structure volontairement simple pour être facile
// à brancher sur des valeurs dynamiques plus tard (couleurs, texte, logo).

export default function SiteSuspendu() {
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
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>
          Ce site est temporairement indisponible
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
          Le propriétaire de cette boutique doit reconfirmer son adresse courriel
          pour la remettre en ligne. Le site redeviendra accessible automatiquement
          dès que ce sera fait.
        </p>
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