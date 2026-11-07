// CHEMIN : src/templates/shared/BanniereDashboard.tsx
// e-Vend Studio — Bannière en haut du dashboard collaborateur / acheteur.
// Réglée par le gestionnaire : Config marketplace → Généralité → « Bannière dashboard collaborateur » / « … acheteur »
// (message, couleur de fond, couleur du texte, hauteur, taille de police). Rien ne s'affiche si elle est désactivée ou sans message.

interface Props { config?: Record<string, any>; type: 'collab' | 'acheteur' }

const couleur = (v: unknown, defaut: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : defaut);
const borne = (v: unknown, min: number, max: number, defaut: number) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defaut;
};

export default function BanniereDashboard({ config, type }: Props) {
  const mv = (config && config.multivendeur) || {};
  // Anciennes clés « banniere_vendeur_* » lues en repli pour le collaborateur
  const lire = (suffixe: string) => (type === 'collab' ? (mv[`banniere_collab_${suffixe}`] ?? mv[`banniere_vendeur_${suffixe}`]) : mv[`banniere_acheteur_${suffixe}`]);
  const message = String(lire('message') || '').trim();
  if (lire('active') !== true || !message) return null;
  return (
    <div
      role="status"
      style={{
        background: couleur(lire('couleur_bg'), '#1e3a5f'), color: couleur(lire('couleur_tx'), '#ffffff'),
        minHeight: borne(lire('hauteur'), 20, 120, 36), padding: '6px 16px', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        fontSize: borne(lire('police'), 10, 72, 13), fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word',
      }}
    >
      {message}
    </div>
  );
}