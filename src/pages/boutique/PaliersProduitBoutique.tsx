// CHEMIN : src/pages/boutique/PaliersProduitBoutique.tsx
// e-Vend Studio — Add-on « Prix par palier de quantité » : tableau de la fiche produit des templates boutique (solo).
// Les paliers viennent du catalogue public (envoyés seulement si l'add-on est actif) ; le prix réellement facturé est TOUJOURS recalculé par le serveur.
// Le calcul ci-dessous ne sert qu'à l'affichage et reprend la règle du serveur : palier le plus haut atteint, rabais en % sur le prix actuel (promo comprise),
// prix fixe seulement s'il est plus bas que le prix actuel, prix fixe propre à chaque variante.

import React from 'react';

export interface PalierPublic { qte_min: number; type: 'pourcentage' | 'fixe'; valeur: number; variante: string | null; }

interface Props {
  produit: { prix: number; prix_promo?: number | null; variantes?: any[]; paliers?: PalierPublic[] };
  quantite: number;
  /** Nom de la variante choisie (comme envoyé au panier), '' si aucune */
  variante: string;
  couleur: string;
  fond?: string;
  bordure?: string;
  texte?: string;
  texteDiscret?: string;
}

const arrondi = (n: number) => Math.round(n * 100) / 100;
const px = (n: number) => Number(n || 0).toFixed(2).replace('.', ',') + ' $';

export default function PaliersProduitBoutique({ produit, quantite, variante, couleur, fond = 'rgba(255,255,255,0.03)', bordure = '#333', texte = '#fff', texteDiscret = '#888' }: Props) {
  const paliers = Array.isArray(produit.paliers) ? produit.paliers.filter(l => l && l.qte_min >= 2 && l.valeur > 0) : [];
  if (!paliers.length) return null;
  const type = paliers[0].type;
  const vars = (Array.isArray(produit.variantes) ? produit.variantes : []).filter(v => v && typeof v.nom === 'string' && v.nom.trim());
  const aVariantes = vars.length > 0;
  const baseProduit = produit.prix_promo && produit.prix_promo > 0 && produit.prix_promo < produit.prix ? produit.prix_promo : produit.prix;

  const boite: React.CSSProperties = { border: `1px solid ${bordure}`, background: fond, borderRadius: 12, padding: 16, marginBottom: 20 };
  const titre = <div style={{ fontSize: 13, fontWeight: 800, color: texte, marginBottom: 10 }}>💰 Plus vous en prenez, moins c'est cher</div>;

  // Prix de base de l'article choisi (variante ou produit). null = variante à choisir d'abord.
  let base: number | null = baseProduit;
  if (aVariantes) {
    const v = vars.find(x => x.nom.trim() === variante);
    if (v) base = v.prix !== null && v.prix !== undefined && v.prix !== '' && Number(v.prix) >= 0 ? Number(v.prix) : baseProduit;
    else base = null;
  }

  // Prix fixe avec variantes : le tableau dépend de la variante choisie
  if (type === 'fixe' && aVariantes && base === null) {
    return <div style={boite}>{titre}<p style={{ fontSize: 12, color: texteDiscret, margin: 0 }}>Choisissez une variante pour voir les prix par quantité.</p></div>;
  }
  const lignes = paliers.filter(l => (type === 'fixe' && aVariantes ? (l.variante || '') === variante : true)).sort((a, b) => a.qte_min - b.qte_min);
  if (!lignes.length) return null;

  const prixLigne = (l: PalierPublic): number | null => {
    if (l.type === 'fixe') return arrondi(l.valeur);
    return base === null ? null : arrondi(base * (1 - l.valeur / 100));
  };
  // Une ligne qui ne baisse pas le prix n'est jamais appliquée par le serveur
  const utile = (l: PalierPublic) => { const p = prixLigne(l); return base === null || p === null ? true : p > 0 && p < base; };
  let atteinte: PalierPublic | null = null;
  for (const l of lignes) if (l.qte_min <= quantite && utile(l) && (!atteinte || l.qte_min > atteinte.qte_min)) atteinte = l;
  const prixUnite = atteinte && base !== null ? prixLigne(atteinte) : null;
  const gain = prixUnite !== null && base !== null ? arrondi((base - prixUnite) * quantite) : 0;

  return (
    <div style={boite} data-testid="paliers-produit">
      {titre}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4 }}>
        {lignes.filter(utile).map(l => {
          const actif = atteinte === l;
          const p = prixLigne(l);
          return (
            <React.Fragment key={`${l.qte_min}|${l.variante || ''}`}>
              <div style={{ padding: '7px 10px', borderRadius: '8px 0 0 8px', fontSize: 13, fontWeight: actif ? 800 : 600, color: actif ? '#4ade80' : texte, background: actif ? 'rgba(74,222,128,0.12)' : 'transparent' }}>{l.qte_min}+ unités{actif ? ' ✓' : ''}</div>
              <div style={{ padding: '7px 10px', borderRadius: '0 8px 8px 0', fontSize: 13, fontWeight: actif ? 800 : 600, textAlign: 'right', color: actif ? '#4ade80' : couleur, background: actif ? 'rgba(74,222,128,0.12)' : 'transparent' }}>
                {p !== null ? `${px(p)} / unité` : `−${l.valeur} %`}
                {p !== null && l.type === 'pourcentage' && <span style={{ fontSize: 11, color: texteDiscret, fontWeight: 400, marginLeft: 6 }}>(−{l.valeur} %)</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {atteinte && prixUnite !== null && gain > 0 && (
        <p style={{ fontSize: 12, color: '#4ade80', margin: '10px 0 0', fontWeight: 700 }}>{quantite} × {px(prixUnite)} = {px(arrondi(prixUnite * quantite))} — vous économisez {px(gain)}</p>
      )}
      {type === 'fixe' && aVariantes && <p style={{ fontSize: 11, color: texteDiscret, margin: '8px 0 0' }}>Prix selon la variante choisie.</p>}
    </div>
  );
}