// CHEMIN : src/templates/TemplateBoutiqueSimple.tsx
// Template Mono-produit (boutique-simple) : une seule page de vente pour UN produit (variantes/options gérées).
// Réutilise le moteur de TemplateBoutiqueSimplisse en mode `mono` ; la configuration est lue dans config.simple.
import TemplateBoutiqueSimplisse from './TemplateBoutiqueSimplisse';

interface Props { config: any; siteId?: string; vendeurId?: number; }

export default function TemplateBoutiqueSimple({ config, siteId, vendeurId }: Props) {
  const cfg = { ...(config || {}), simplisse: (config && config.simple) || {} };
  return <TemplateBoutiqueSimplisse mono config={cfg} siteId={siteId as any} vendeurId={vendeurId as any} />;
}