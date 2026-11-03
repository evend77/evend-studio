// src/components/LogoStudio.tsx
// Logo e-Vend Studio (boîte orange « e » + nom), commun au menu du haut et au bas de page.

import { useNavigate } from 'react-router-dom';

export default function LogoStudio({ petit = false }: { petit?: boolean }) {
  const navigate = useNavigate();
  const boite = petit ? 28 : 34;
  return (
    <a
      href="/"
      aria-label="e-Vend Studio — accueil"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate('/');
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}
    >
      <div style={{ width: boite + 'px', height: boite + 'px', borderRadius: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: petit ? '13px' : '16px', color: '#000' }}>e</div>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: petit ? '16px' : '18px', color: '#fff', whiteSpace: 'nowrap' }}>e-Vend Studio</span>
    </a>
  );
}