// CHEMIN : src/pages/gestionnaire/VitrineOnglets.tsx
// Barre d'onglets des pages d'add-ons vitrine.

const T = { accent: '#2d6a9f', border: '#e1e4e8', light: '#6b7280' };

export default function VitrineOnglets({ onglets, actif, onChoisir }: { onglets: { id: string; label: string }[]; actif: string; onChoisir: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `2px solid ${T.border}`, marginBottom: 16 }}>
      {onglets.map(o => (
        <button key={o.id} type="button" onClick={() => onChoisir(o.id)}
          style={{ background: 'none', border: 'none', borderBottom: `3px solid ${actif === o.id ? T.accent : 'transparent'}`, marginBottom: -2, padding: '10px 16px', fontSize: 14, fontWeight: 700, color: actif === o.id ? T.accent : T.light, cursor: 'pointer', fontFamily: 'inherit' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}