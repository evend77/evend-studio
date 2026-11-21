// CHEMIN : src/components/ApercuPerso.tsx
// e-Vend Studio — Add-on « Produits personnalisés » : aperçu APPROXIMATIF d'un produit personnalisé (recto/verso…). Photo vierge de la face + zones où se placent
// le texte et les images de l'acheteur. Utilisé par la page produit, le panier, les pages de commande et l'éditeur du gestionnaire (aucune donnée envoyée : tout est
// dessiné ici). Le texte est toujours affiché comme du TEXTE (jamais interprété comme du HTML).

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ZonePerso { id: string; nom?: string; x: number; y: number; w: number; h: number; forme: 'rect' | 'arrondi' | 'rond' }
export interface FacePerso { id: string; nom: string; photo_url: string; zones: ZonePerso[] }
export interface ValeurApercu { id: string; type: string; zone?: string | null; affichage?: string; police?: string; couleur?: string; url?: string; dx?: number; dy?: number; zoom?: number }

// Mêmes polices que le serveur (services/boutique_perso.js) : déjà présentes sur les appareils, rien à télécharger
export const PILES_POLICES: Record<string, string> = {
  sans: 'Arial, Helvetica, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: '"Courier New", Courier, monospace', impact: 'Impact, "Arial Black", sans-serif',
  script: '"Brush Script MT", "Segoe Script", cursive', trebuchet: '"Trebuchet MS", Tahoma, sans-serif', verdana: 'Verdana, Geneva, sans-serif',
};
const rayon = (f: ZonePerso['forme']) => (f === 'rond' ? '50%' : f === 'arrondi' ? '14%' : 0);

// Texte ajusté à la zone : la taille de la police diminue jusqu'à ce que tout entre
function TexteAjuste({ texte, police, couleur, multi }: { texte: string; police: string; couleur: string; multi: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState(16);
  const calculer = () => {
    const el = ref.current; if (!el) return;
    const h = el.clientHeight, w = el.clientWidth; if (!h || !w) return;
    let t = Math.max(6, Math.min(h * (multi ? 0.5 : 0.85), 120));
    el.style.fontSize = `${t}px`;
    let n = 0;
    while ((el.scrollWidth > w + 1 || el.scrollHeight > h + 1) && t > 5 && n++ < 40) { t *= 0.92; el.style.fontSize = `${t}px`; }
    setTaille(t);
  };
  useLayoutEffect(calculer, [texte, police, multi]);
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => calculer()); ro.observe(el); return () => ro.disconnect();
  }, [texte, police, multi]);
  return (
    <div ref={ref} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', fontFamily: police, color: couleur, fontSize: taille, lineHeight: 1.15, whiteSpace: multi ? 'pre-wrap' : 'nowrap', wordBreak: 'break-word', userSelect: 'none' }}>
      <span style={{ display: 'block', maxWidth: '100%' }}>{texte}</span>
    </div>
  );
}

export default function ApercuPerso({ faces, valeurs, polices = PILES_POLICES, faceActive, onFace, accent = '#c9a96e', montrerZones = false, zoneActive, texteOnglet = '#fff', fondOnglet = 'rgba(0,0,0,0.5)', onZoneDebut }: {
  faces: FacePerso[]; valeurs: ValeurApercu[]; polices?: Record<string, string>; faceActive?: string; onFace?: (id: string) => void; accent?: string; montrerZones?: boolean; zoneActive?: string | null;
  texteOnglet?: string; fondOnglet?: string; onZoneDebut?: (e: React.PointerEvent<HTMLDivElement>, face: FacePerso) => void;
}) {
  const [interne, setInterne] = useState<string>(faces[0] ? faces[0].id : '');
  const idFace = faceActive !== undefined ? faceActive : interne;
  const face = faces.find(f => f.id === idFace) || faces[0];
  if (!face) return null;
  const choisir = (id: string) => { setInterne(id); if (onFace) onFace(id); };
  return (
    <div>
      {faces.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {faces.map(f => (
            <button key={f.id} type="button" onClick={() => choisir(f.id)}
              style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${f.id === face.id ? accent : 'rgba(128,128,128,0.4)'}`, background: f.id === face.id ? accent : fondOnglet, color: f.id === face.id ? '#000' : texteOnglet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{f.nom}</button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', lineHeight: 0, background: '#fff', borderRadius: 8, overflow: 'hidden', touchAction: onZoneDebut ? 'none' : undefined }}
        onPointerDown={onZoneDebut ? (e) => onZoneDebut(e, face) : undefined}>
        <img src={face.photo_url} alt={face.nom} draggable={false} style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: onZoneDebut ? 'none' : undefined }}>
          {face.zones.map(z => {
            const vs = valeurs.filter(v => v.zone === z.id && (v.affichage || v.url));
            const actif = zoneActive === z.id;
            return (
              <div key={z.id} style={{ position: 'absolute', left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`, borderRadius: rayon(z.forme), overflow: 'hidden', display: 'flex', flexDirection: 'column',
                outline: montrerZones ? `2px ${actif ? 'solid' : 'dashed'} ${actif ? accent : 'rgba(0,120,255,0.8)'}` : undefined, outlineOffset: -1, background: montrerZones && !vs.length ? 'rgba(0,120,255,0.08)' : undefined }}>
                {vs.map(v => (
                  <div key={v.id} style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                    {v.type === 'image' && v.url
                      ? <img src={v.url} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: `translate(${v.dx || 0}%, ${v.dy || 0}%) scale(${v.zoom || 1})`, userSelect: 'none' }} />
                      : <TexteAjuste texte={v.affichage || ''} police={polices[v.police || 'sans'] || polices.sans || 'Arial, sans-serif'} couleur={v.couleur || '#000'} multi={v.type === 'texte_long'} />}
                  </div>
                ))}
                {montrerZones && !vs.length && <div style={{ margin: 'auto', fontSize: 10, color: 'rgba(0,80,200,0.9)', lineHeight: 1.2, textAlign: 'center', padding: 2 }}>{z.nom || 'Zone'}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}