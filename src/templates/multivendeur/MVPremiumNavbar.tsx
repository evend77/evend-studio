// CHEMIN : src/templates/multivendeur/MVPremiumNavbar.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Barre de navigation responsive (menu hamburger sur mobile)

import { useState } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';
import { fondDe, fondNav } from './mvTheme';

export default function MVPremiumNavbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const nom = config?.nom_boutique || 'Ma Marketplace';
  const accent = config?.couleur_accent || '#fbbf24';
  const liens: { label: string; dest: NavMV }[] = [
    { label: 'Accueil', dest: { page: 'accueil' } },
    { label: 'Catalogue', dest: { page: 'catalogue' } },
    { label: 'Boutiques', dest: { page: 'boutiques' } },
    { label: 'Enchères', dest: { page: 'encheres' } },
  ];
  const lienEncheres = config?.encheres_actif !== false;   // masqué si l'add-on Enchères n'est pas actif
  const liensVisibles = liens.filter(l => l.dest.page !== 'encheres' || lienEncheres);
  const aller = (d: NavMV) => { setMenuOuvert(false); naviguer(d); };
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: fondNav(config) }}>
      <style>{`
        @media (max-width:768px) {
          .mvn-liens { display:none !important; }
          .mvn-burger { display:flex !important; }
          .mvn-inner { padding:0 14px !important; gap:12px !important; }
        }
      `}</style>
      <div className="mvn-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0, flexShrink: 1 }} onClick={() => aller({ page: 'accueil' })}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg,${accent},${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', flexShrink: 0 }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
        </div>
        <div className="mvn-liens" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {liensVisibles.map(l => <span key={l.label} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' }} onClick={() => aller(l.dest)}>{l.label}</span>)}
          <button onClick={() => aller({ page: 'login' })} style={{ padding: '8px 18px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
        </div>
        <button className="mvn-burger" aria-label="Menu" onClick={() => setMenuOuvert(v => !v)}
          style={{ display: 'none', marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>
          {menuOuvert ? '✕' : '☰'}
        </button>
      </div>
      {menuOuvert && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: fondDe(config), borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {liensVisibles.map(l => (
            <div key={l.label} onClick={() => aller(l.dest)} style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.85)', fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{l.label}</div>
          ))}
          <div style={{ padding: '14px 20px' }}>
            <button onClick={() => aller({ page: 'login' })} style={{ width: '100%', padding: 12, background: accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
          </div>
        </div>
      )}
    </nav>
  );
}