// CHEMIN : src/templates/TemplateBoutiqueSimple.tsx
// Template Mono-produit (boutique-simple) : une seule page de vente pour UN produit (variantes/options gérées).
// Réutilise le moteur de TemplateBoutiqueSimplisse en mode `mono` ; la configuration est lue dans config.simple.
import TemplateBoutiqueSimplisse from './TemplateBoutiqueSimplisse';

// Compatibilité : la config générique « Modifier mon site » (ancien mono-produit) importe encore ces éléments depuis ce fichier.
export { DEFAUTS_PAR_TYPE, CONFIG_BOUTIQUE_SIMPLE_DEFAUT } from './TemplateBoutiqueSimpleAncien';
export type { TypeBoutique, VarianteProduit, ConfigBoutiqueSimple } from './TemplateBoutiqueSimpleAncien';

interface Props { config: any; siteId?: string; vendeurId?: number; }

export default function TemplateBoutiqueSimple({ config, siteId, vendeurId }: Props) {
  const cfg = { ...(config || {}), simplisse: (config && config.simple) || {} };
  return <TemplateBoutiqueSimplisse mono config={cfg} siteId={siteId as any} vendeurId={vendeurId as any} />;
}