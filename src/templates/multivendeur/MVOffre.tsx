// CHEMIN : src/templates/multivendeur/MVOffre.tsx
// e-Vend Studio — Add-on « Offres du jour » : compte à rebours d'une offre EN COURS (page produit et cartes).
// Basé sur l'heure du SERVEUR (heureServeur) : changer l'horloge de l'ordinateur ne prolonge rien. Le prix, lui, est décidé par le serveur.

import { useEffect, useState } from 'react';

const p2 = (n: number) => String(n).padStart(2, '0');

function useReste(finIso: string, heureServeur?: string | null): number {
  const [decalage] = useState(() => (heureServeur ? Date.parse(heureServeur) - Date.now() : 0));
  const calc = () => Math.max(0, Math.ceil((Date.parse(finIso) - (Date.now() + (Number.isFinite(decalage) ? decalage : 0))) / 1000));
  const [reste, setReste] = useState(calc);
  useEffect(() => {
    setReste(calc());
    const t = setInterval(() => setReste(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finIso]);
  return reste;
}

interface Props {
  fin: string;                       // ISO renvoyé par le serveur (offre_fin)
  heureServeur?: string | null;
  compact?: boolean;                 // petite ligne pour les cartes
  onFini?: () => void;               // appelé une fois à la fin (la page recharge alors le vrai prix)
}

export default function MVOffreCompteur({ fin, heureServeur, compact, onFini }: Props) {
  const reste = useReste(fin, heureServeur);
  const [fini, setFini] = useState(reste <= 0);
  useEffect(() => { if (reste <= 0 && !fini) { setFini(true); onFini && onFini(); } }, [reste]);   // eslint-disable-line react-hooks/exhaustive-deps
  const j = Math.floor(reste / 86400), h = Math.floor((reste % 86400) / 3600), m = Math.floor((reste % 3600) / 60), s = reste % 60;
  const urgent = reste < 3600;

  if (compact) {
    if (fini) return null;
    return (
      <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#fff',
        background: urgent ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#f97316,#ea580c)', fontVariantNumeric: 'tabular-nums' }}>
        🔥 {j > 0 ? `${j} j ` : ''}{p2(h)}:{p2(m)}:{p2(s)}
      </div>
    );
  }

  if (fini) return null;
  return (
    <div style={{ margin: '0 0 16px', padding: '14px 16px', borderRadius: 14, border: `2px solid ${urgent ? '#ef4444' : '#f97316'}`, background: 'linear-gradient(135deg,rgba(249,115,22,0.16),rgba(239,68,68,0.10))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>🔥 Offre du jour <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>· se termine dans</span></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['j', j], ['h', h], ['min', m], ['s', s]] as [string, number][]).map(([l, v]) => (
            <div key={l} style={{ minWidth: 48, textAlign: 'center', padding: '6px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{p2(v)}</div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}