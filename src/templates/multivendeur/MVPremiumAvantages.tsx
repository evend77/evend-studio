// CHEMIN : src/templates/multivendeur/MVPremiumAvantages.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Section « cartes » de l'accueil
// Configurée par le gestionnaire dans « Configurer mes pages » > Accueil > Section cartes (avantages).
// Données : config.extra.accueil_avantages = { actif, titre, sous_titre, cartes: [{ icone, titre, texte }] }

interface Carte { icone?: string; titre?: string; texte?: string; }

export default function MVPremiumAvantages({ config = {} }: { config?: Record<string, any> }) {
  const av = config?.extra?.accueil_avantages;
  if (!av || av.actif !== true) return null;

  const cartes: Carte[] = (Array.isArray(av.cartes) ? av.cartes : [])
    .filter((c: Carte) => c && ((c.titre || '').trim() || (c.texte || '').trim()))
    .slice(0, 6);
  if (cartes.length === 0) return null;

  const accent = config.couleur_accent || '#fbbf24';
  const titre = (av.titre || '').trim();
  const sousTitre = (av.sous_titre || '').trim();

  return (
    <section className="mv-section" style={s.section}>
      <style>{`
        .mva-carte:hover { transform:translateY(-3px); border-color:${accent}55 !important; }
        @media (max-width:640px) { .mva-grille { grid-template-columns:minmax(0,1fr) !important; gap:12px !important; } }
      `}</style>
      <div className="mv-pad" style={s.container}>
        {(titre || sousTitre) && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            {titre && <h2 style={s.titre}>{titre}</h2>}
            {sousTitre && <p style={s.sousTitre}>{sousTitre}</p>}
          </div>
        )}
        <div className="mva-grille" style={s.grille}>
          {cartes.map((c, i) => (
            <div key={i} className="mva-carte" style={s.carte}>
              {(c.icone || '').trim() && <div style={s.icone}>{c.icone}</div>}
              {(c.titre || '').trim() && <h3 style={s.carteTitre}>{c.titre}</h3>}
              {(c.texte || '').trim() && <p style={s.texte}>{c.texte}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section:   { padding: '60px 0' },
  container: { maxWidth: 1280, margin: '0 auto', padding: '0 24px' },
  titre:     { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, margin: 0, lineHeight: 1.2 },
  sousTitre: { fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '12px auto 0', maxWidth: 640 },
  grille:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  carte:     { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '28px 26px', transition: 'transform 0.2s, border-color 0.2s' },
  icone:     { fontSize: 34, lineHeight: 1, marginBottom: 18 },
  carteTitre:{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 10px', color: '#fff' },
  texte:     { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' },
};