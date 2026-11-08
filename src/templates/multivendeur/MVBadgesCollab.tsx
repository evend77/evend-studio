// CHEMIN : src/templates/multivendeur/MVBadgesCollab.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Badges d'une boutique (petites pastilles rondes avec info-bulle).
// Affichés à droite du nom de la boutique (page produit, page boutique). Rien si la boutique n'a pas de badge.

export interface BadgeCollab { id: string; nom: string; description?: string; icone: string; couleur: string; niveau?: number; }

export default function MVBadgesCollab({ badges, taille = 28 }: { badges?: BadgeCollab[] | null; taille?: number }) {
  if (!Array.isArray(badges) || badges.length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} aria-label="Badges de la boutique">
      {badges.slice(0, 8).map(b => (
        <span key={b.id} title={b.description ? `${b.nom} — ${b.description}` : b.nom}
          style={{ width: taille, height: taille, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(taille * 0.55), lineHeight: 1, cursor: 'help',
            background: `radial-gradient(circle at 35% 35%, ${b.couleur}dd, ${b.couleur}88)`, border: `2px solid ${b.couleur}`, boxShadow: `0 0 0 2px ${b.couleur}33` }}>
          {b.icone}
        </span>
      ))}
    </span>
  );
}