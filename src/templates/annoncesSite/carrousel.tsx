// src/templates/annoncesSite/carrousel.tsx
// e-Vend Studio — Carrousel horizontal (défilement tactile + flèches rondes), partagé par les templates sombres.

import { useRef } from 'react';

export const CSS_CARROUSEL = `.vl-car{display:flex;gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:4px 2px}.vl-car::-webkit-scrollbar{display:none}
.vl-car>*{flex:0 0 calc((100% - 66px)/4);scroll-snap-align:start;min-width:0}.vl-car.vl-large>*{flex:0 0 min(100%, 820px)}
@media(max-width:980px){.vl-car>*{flex:0 0 calc((100% - 22px)/2)}}@media(max-width:560px){.vl-car>*{flex:0 0 82%}.vl-car.vl-large>*{flex:0 0 92%}}`;

export function Carrousel({ children, couleur, fond, large = false }: { children: React.ReactNode; couleur: string; fond: string; large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pas = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: 'smooth' }); };
  const n = Array.isArray(children) ? children.length : 1;
  const fl = (cote: 'g' | 'd'): React.CSSProperties => ({ position: 'absolute', top: '42%', [cote === 'g' ? 'left' : 'right']: -6, width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${couleur}`, background: fond, color: couleur, fontSize: 22, lineHeight: 1, cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 });
  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} className={large ? 'vl-car vl-large' : 'vl-car'}>{children}</div>
      {n > 1 && <><button aria-label="Précédent" style={fl('g')} onClick={() => pas(-1)}>‹</button><button aria-label="Suivant" style={fl('d')} onClick={() => pas(1)}>›</button></>}
    </div>
  );
}