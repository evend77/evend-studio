// CHEMIN : src/components/ResumePerso.tsx
// e-Vend Studio — Add-on « Produits personnalisés » : résumé de la personnalisation d'un article (panier, caisse, détail de commande acheteur et gestionnaire).
// Lit le cliché gardé dans la ligne (textes, choix, images, supplément, aperçu recto/verso). Tout est affiché comme du TEXTE ; les images viennent de notre stockage.
// Côté gestionnaire (`gestionnaire`), chaque image a un lien pour ouvrir/télécharger l'ORIGINAL envoyé par l'acheteur (c'est ce fichier qu'on utilise pour produire).

import React, { useState } from 'react';
import ApercuPerso, { FacePerso, ValeurApercu } from './ApercuPerso';

export interface PersoCliche { v?: number; supplement?: number; faces?: FacePerso[]; champs: { id: string; type: string; libelle: string; affichage: string; zone?: string | null; police?: string; couleur?: string; url?: string; dx?: number; dy?: number; zoom?: number; supplement?: number; hex?: string }[] }

const urlSure = (u?: string) => !!u && /^https:\/\/media\.e-vend\.ca\//.test(u);

export default function ResumePerso({ perso, gestionnaire = false, couleur = '#b47828', texte = '#44403c', doux = '#78716c', compact = false }: { perso: PersoCliche | null | undefined; gestionnaire?: boolean; couleur?: string; texte?: string; doux?: string; compact?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  if (!perso || !Array.isArray(perso.champs) || !perso.champs.length) return null;
  const faces = Array.isArray(perso.faces) ? perso.faces : [];
  const valeurs: ValeurApercu[] = perso.champs.filter(c => c.zone).map(c => ({ id: c.id, type: c.type, zone: c.zone, affichage: c.affichage, police: c.police, couleur: c.couleur, url: urlSure(c.url) ? c.url : undefined, dx: c.dx, dy: c.dy, zoom: c.zoom }));
  const peutApercu = faces.length > 0 && valeurs.length > 0;
  return (
    <div data-perso="resume" style={{ marginTop: 6, padding: gestionnaire ? '10px 12px' : '8px 10px', borderLeft: `3px solid ${couleur}`, background: 'rgba(180,120,40,0.06)', borderRadius: 6, fontSize: compact ? 12 : 13, color: texte, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: couleur, marginBottom: 4 }}>🎨 Personnalisation</div>
      {perso.champs.map(c => (
        <div key={c.id} style={{ marginBottom: 3 }}>
          <span style={{ color: doux }}>{c.libelle} : </span>
          {c.type === 'image' && urlSure(c.url)
            ? <span>
                <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: couleur, fontWeight: 700 }}>{gestionnaire ? '⬇ Ouvrir l’original' : 'Voir l’image'}</a>
                <span style={{ color: doux }}> ({c.affichage})</span>
              </span>
            : <strong style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {c.type === 'couleur' && c.hex && /^#[0-9a-f]{6}$/i.test(c.hex) && <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.hex, border: '1px solid #999', verticalAlign: 'middle', marginRight: 6 }} />}{c.affichage}</strong>}
          {['texte', 'texte_long', 'date', 'nombre'].includes(c.type) && gestionnaire && c.police && c.couleur && (
            <span style={{ marginLeft: 8, fontSize: 11, color: doux }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: /^#[0-9a-f]{6}$/i.test(c.couleur) ? c.couleur : '#000', border: '1px solid #999', verticalAlign: 'middle', marginRight: 4 }} />{c.couleur} · {c.police}
            </span>
          )}
        </div>
      ))}
      {Number(perso.supplement) > 0 && <div style={{ color: doux, fontSize: 12 }}>Supplément inclus : {Number(perso.supplement).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $ par article</div>}
      {peutApercu && (
        <div style={{ marginTop: 6 }}>
          <button type="button" onClick={() => setOuvert(o => !o)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>{ouvert ? '▲ Masquer l’aperçu' : '▼ Voir l’aperçu'}</button>
          {ouvert && <div style={{ maxWidth: 320, marginTop: 8 }}><ApercuPerso faces={faces} valeurs={valeurs} accent={couleur} texteOnglet="#fff" fondOnglet="rgba(0,0,0,0.55)" /><div style={{ fontSize: 11, color: doux, marginTop: 4 }}>Aperçu approximatif.</div></div>}
        </div>
      )}
    </div>
  );
}