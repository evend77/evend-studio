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

// Template Simplisse Artisan : le pied de page se lit dans config.artisan.footer.afficherPropulse.
// `base` = config.artisan déjà lue : on n'écrase jamais la config du gestionnaire.
export function configArtisanAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const artisan = (base && typeof base === 'object') ? base : {};
  return { ...config, artisan: { ...artisan, footer: { ...(artisan.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Auto : le pied de page se lit dans config.auto.footer.afficherPropulse.
// `base` = config.auto déjà lue : on n'écrase jamais la config du gestionnaire.
export function configAutoAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const auto = (base && typeof base === 'object') ? base : {};
  return { ...config, auto: { ...auto, footer: { ...(auto.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Jouets : le pied de page se lit dans config.jouets.footer.afficherPropulse.
// `base` = config.jouets déjà lue : on n'écrase jamais la config du gestionnaire.
export function configJouetsAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const jouets = (base && typeof base === 'object') ? base : {};
  return { ...config, jouets: { ...jouets, footer: { ...(jouets.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Gothique : le pied de page se lit dans config.gothique.footer.afficherPropulse.
// `base` = config.gothique déjà lue : on n'écrase jamais la config du gestionnaire.
export function configGothiqueAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const gothique = (base && typeof base === 'object') ? base : {};
  return { ...config, gothique: { ...gothique, footer: { ...(gothique.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse BD : le pied de page se lit dans config.bd.footer.afficherPropulse.
// `base` = config.bd déjà lue : on n'écrase jamais la config du gestionnaire.
export function configBDAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const bd = (base && typeof base === 'object') ? base : {};
  return { ...config, bd: { ...bd, footer: { ...(bd.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Futuriste : le pied de page se lit dans config.futuriste.footer.afficherPropulse.
// `base` = config.futuriste déjà lue : on n'écrase jamais la config du gestionnaire.
export function configFuturisteAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const futuriste = (base && typeof base === 'object') ? base : {};
  return { ...config, futuriste: { ...futuriste, footer: { ...(futuriste.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Tech : le pied de page se lit dans config.tech.footer.afficherPropulse.
// `base` = config.tech déjà lue : on n'écrase jamais la config du gestionnaire.
export function configTechAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const tech = (base && typeof base === 'object') ? base : {};
  return { ...config, tech: { ...tech, footer: { ...(tech.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Rose : le pied de page se lit dans config.rose.footer.afficherPropulse.
// `base` = config.rose déjà lue : on n'écrase jamais la config du gestionnaire.
export function configRoseAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const rose = (base && typeof base === 'object') ? base : {};
  return { ...config, rose: { ...rose, footer: { ...(rose.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Bonbon : le pied de page se lit dans config.bonbon.footer.afficherPropulse.
// `base` = config.bonbon déjà lue : on n'écrase jamais la config du gestionnaire.
export function configBonbonAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const bonbon = (base && typeof base === 'object') ? base : {};
  return { ...config, bonbon: { ...bonbon, footer: { ...(bonbon.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Soleil : le pied de page se lit dans config.soleil.footer.afficherPropulse.
// `base` = config.soleil déjà lue : on n'écrase jamais la config du gestionnaire.
export function configSoleilAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const soleil = (base && typeof base === 'object') ? base : {};
  return { ...config, soleil: { ...soleil, footer: { ...(soleil.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Sentier : le pied de page se lit dans config.sentier.footer.afficherPropulse.
// `base` = config.sentier déjà lue : on n'écrase jamais la config du gestionnaire.
export function configSentierAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const sentier = (base && typeof base === 'object') ? base : {};
  return { ...config, sentier: { ...sentier, footer: { ...(sentier.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Chantier : le pied de page se lit dans config.chantier.footer.afficherPropulse.
// `base` = config.chantier déjà lue : on n'écrase jamais la config du gestionnaire.
export function configChantierAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const chantier = (base && typeof base === 'object') ? base : {};
  return { ...config, chantier: { ...chantier, footer: { ...(chantier.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Café : le pied de page se lit dans config.cafe.footer.afficherPropulse.
// `base` = config.cafe déjà lue : on n'écrase jamais la config du gestionnaire.
export function configCafeAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const cafe = (base && typeof base === 'object') ? base : {};
  return { ...config, cafe: { ...cafe, footer: { ...(cafe.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Sakura : le pied de page se lit dans config.sakura.footer.afficherPropulse.
// `base` = config.sakura déjà lue : on n'écrase jamais la config du gestionnaire.
export function configSakuraAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const sakura = (base && typeof base === 'object') ? base : {};
  return { ...config, sakura: { ...sakura, footer: { ...(sakura.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Sport : le pied de page se lit dans config.sport.footer.afficherPropulse.
// `base` = config.sport déjà lue : on n'écrase jamais la config du gestionnaire.
export function configSportAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const sport = (base && typeof base === 'object') ? base : {};
  return { ...config, sport: { ...sport, footer: { ...(sport.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Joyau : le pied de page se lit dans config.joyau.footer.afficherPropulse.
// `base` = config.joyau déjà lue : on n'écrase jamais la config du gestionnaire.
export function configJoyauAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const joyau = (base && typeof base === 'object') ? base : {};
  return { ...config, joyau: { ...joyau, footer: { ...(joyau.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Écume : le pied de page se lit dans config.ecume.footer.afficherPropulse.
// `base` = config.ecume déjà lue : on n'écrase jamais la config du gestionnaire.
export function configEcumeAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const ecume = (base && typeof base === 'object') ? base : {};
  return { ...config, ecume: { ...ecume, footer: { ...(ecume.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Audace : le pied de page se lit dans config.audace.footer.afficherPropulse.
// `base` = config.audace déjà lue : on n'écrase jamais la config du gestionnaire.
export function configAudaceAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const audace = (base && typeof base === 'object') ? base : {};
  return { ...config, audace: { ...audace, footer: { ...(audace.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Carnaval : le pied de page se lit dans config.carnaval.footer.afficherPropulse.
// `base` = config.carnaval déjà lue : on n'écrase jamais la config du gestionnaire.
export function configCarnavalAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const carnaval = (base && typeof base === 'object') ? base : {};
  return { ...config, carnaval: { ...carnaval, footer: { ...(carnaval.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Patchwork : le pied de page se lit dans config.patchwork.footer.afficherPropulse.
// `base` = config.patchwork déjà lue : on n'écrase jamais la config du gestionnaire.
export function configPatchworkAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const patchwork = (base && typeof base === 'object') ? base : {};
  return { ...config, patchwork: { ...patchwork, footer: { ...(patchwork.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Vigie : le pied de page se lit dans config.vigie.footer.afficherPropulse.
// `base` = config.vigie déjà lue : on n'écrase jamais la config du gestionnaire.
export function configVigieAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const vigie = (base && typeof base === 'object') ? base : {};
  return { ...config, vigie: { ...vigie, footer: { ...(vigie.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Aurore : le pied de page se lit dans config.aurore.footer.afficherPropulse.
// `base` = config.aurore déjà lue : on n'écrase jamais la config du gestionnaire.
export function configAuroreAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const aurore = (base && typeof base === 'object') ? base : {};
  return { ...config, aurore: { ...aurore, footer: { ...(aurore.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Galerie : le pied de page se lit dans config.galerie.footer.afficherPropulse.
// `base` = config.galerie déjà lue : on n'écrase jamais la config du gestionnaire.
export function configGalerieAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const galerie = (base && typeof base === 'object') ? base : {};
  return { ...config, galerie: { ...galerie, footer: { ...(galerie.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Rallye : le pied de page se lit dans config.rallye.footer.afficherPropulse.
// `base` = config.rallye déjà lue : on n'écrase jamais la config du gestionnaire.
export function configRallyeAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const rallye = (base && typeof base === 'object') ? base : {};
  return { ...config, rallye: { ...rallye, footer: { ...(rallye.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}

// Template Simplisse Paon : le pied de page se lit dans config.paon.footer.afficherPropulse.
// `base` = config.paon déjà lue : on n'écrase jamais la config du gestionnaire.
export function configPaonAvecBadge(config: any, addons: Record<string, boolean> | null | undefined, base: any): any {
  const paon = (base && typeof base === 'object') ? base : {};
  return { ...config, paon: { ...paon, footer: { ...(paon.footer || {}), afficherPropulse: !badgeMasque(addons) } } };
}