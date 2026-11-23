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
// Template Mono-produit (boutique-simple) : le pied de page se lit dans config.simple.footer.afficherPropulse
export function configSimpleAvecBadge(config: any, addons: Record<string, boolean> | null | undefined): any {
  const simple = (config && config.simple) || {};
  return { ...config, simple: { ...simple, footer: { ...(simple.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

export function configSimplisseAvecBadge(config: any, addons: Record<string, boolean> | null | undefined): any {
  const simplisse = (config && config.simplisse) || {};
  return { ...config, simplisse: { ...simplisse, footer: { ...(simplisse.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Boutique Complète : le pied de page se lit dans config.complete.footer.afficherPropulse.
// `base` = config.complete déjà lue (migrée si le site a encore l'ancienne config à plat) : on n'écrase jamais la config du gestionnaire.
export function configCompleteAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const complete = (base && typeof base === 'object') ? base : {};
  return { ...config, complete: { ...complete, footer: { ...(complete.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Catalogue Avancé : le pied de page se lit dans config.avance.footer.afficherPropulse.
// `base` = config.avance déjà lue : on n'écrase jamais la config du gestionnaire.
export function configCatalogueAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const avance = (base && typeof base === 'object') ? base : {};
  return { ...config, avance: { ...avance, footer: { ...(avance.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Mode : le pied de page se lit dans config.mode.footer.afficherPropulse.
// `base` = config.mode déjà lue (convertie si le site a encore l'ancienne config à plat) : on n'écrase jamais la config du gestionnaire.
export function configModeAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const mode = (base && typeof base === 'object') ? base : {};
  return { ...config, mode: { ...mode, footer: { ...(mode.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Boutique Agricole : le pied de page se lit dans config.ferme.footer.afficherPropulse.
// `base` = config.ferme déjà lue : on n'écrase jamais la config du gestionnaire.
export function configFermeAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const ferme = (base && typeof base === 'object') ? base : {};
  return { ...config, ferme: { ...ferme, footer: { ...(ferme.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}