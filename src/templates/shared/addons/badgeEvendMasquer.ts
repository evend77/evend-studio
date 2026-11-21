// CHEMIN : src/templates/shared/addons/badgeEvendMasquer.ts
// e-Vend Studio — Add-on « Cacher le branding » (code : badge_evend_masquer) des templates boutique SOLO.
// Règle : le badge « Propulsé par e-Vend Studio » du pied de page est masqué SEULEMENT si l'add-on est activé
// (add-on acheté dans « Mon plan & limites » ET branché). Sinon il s'affiche toujours.
// `addons` vient de GET /api/boutique/catalogue/:gid/addons ({ code: true }). Ne sert JAMAIS au multivendeur.

export const CODE_BADGE = 'badge_evend_masquer';

export const badgeMasque = (addons: Record<string, boolean> | null | undefined): boolean => !!(addons && addons[CODE_BADGE]);

// Template Premium : le pied de page se lit dans config.premium.footer.afficherPropulse
export function configPremiumAvecBadge(config: any, addons: Record<string, boolean> | null | undefined): any {
  const premium = (config && config.premium) || {};
  return { ...config, premium: { ...premium, footer: { ...(premium.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse : le pied de page se lit dans config.simplisse.footer.afficherPropulse
export function configSimplisseAvecBadge(config: any, addons: Record<string, boolean> | null | undefined): any {
  const simplisse = (config && config.simplisse) || {};
  return { ...config, simplisse: { ...simplisse, footer: { ...(simplisse.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}