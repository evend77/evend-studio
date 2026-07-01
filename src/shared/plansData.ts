// ============================================================
//  src/shared/plansData.ts
//  SOURCE DE VÉRITÉ UNIQUE — Plans d'adhésion e-Vend
//  Utilise localStorage maintenant → remplacer par API plus tard
// ============================================================

const STORAGE_KEY = 'evend_plans';

// ── Types exportés ────────────────────────────────────────────────────────────

export interface Fonctionnalite {
  key: string;
  label: string;
  inclus: boolean;
  note?: string;
}

export interface PlanData {
  id: string;
  nom: string;
  emoji: string;
  prixHT: number;
  tps: number;
  tvq: number;
  fraisActivationHT: number;
  fraisActivationTPS: number;
  fraisActivationTVQ: number;
  periodeEssai: number;
  limiteProduits: number | 'Illimité';
  commission: number;
  couleurBanniere: string;
  couleurCarte: string;
  description: string;
  recommande: boolean;
  statut: 'actif' | 'inactif';
  position: number;
  visibleVendeur: boolean;
  fonctionnalites: Fonctionnalite[];
  // Abonnement
  typeAbonnement: 'mensuel' | 'annuel';
  // Frais activation
  fraisActivationActif: boolean;
  chargerFraisSur: string;
  // Restriction vendeurs
  assignerVendeurs: boolean;
  emailsVendeurs: string;
  // Info sup
  infoSupplementaire: string;
}

// ── Liste maître des fonctionnalités (ordre officiel) ─────────────────────────
export const FONCTIONNALITES_MASTER = [
  { key: 'tableauBord',          label: 'Tableau de bord vendeur',          icon: '📊', groupe: 'Base' },
  { key: 'gestionCommandes',     label: 'Gestion des commandes',             icon: '📦', groupe: 'Base' },
  { key: 'gestionRetours',       label: 'Gestion des retours (RMA)',         icon: '↩️', groupe: 'Base' },
  { key: 'paiementsStripePaypal',label: 'Paiements Stripe & PayPal',         icon: '💳', groupe: 'Base' },
  { key: 'modeVacances',         label: 'Mode vacances',                     icon: '🌴', groupe: 'Base' },
  { key: 'blog',                 label: 'Mes BLOG',                          icon: '📝', groupe: 'Contenu' },
  { key: 'faq',                  label: 'Ma FAQ',                            icon: '❓', groupe: 'Contenu' },
  { key: 'modeEncheres',         label: 'Mode enchères',                     icon: '🔨', groupe: 'Contenu' },
  { key: 'modeFaireOffre',       label: 'Mode faire une offre',              icon: '🤝', groupe: 'Contenu' },
  { key: 'publicationFuture',    label: 'Date de publication future',        icon: '📅', groupe: 'Contenu' },
  { key: 'gestionStocks',        label: 'Gestion des stocks & alertes',      icon: '📉', groupe: 'Avancé' },
  { key: 'codesPromo',           label: 'Codes promo (PayPal uniquement)',   icon: '🎟️', groupe: 'Avancé' },
  { key: 'collections',          label: 'Collections personnalisées',        icon: '🗂️', groupe: 'Avancé' },
  { key: 'statistiquesVisiteurs',label: 'Statistiques visiteurs',            icon: '👁️', groupe: 'Avancé' },
  { key: 'commandesBrouillon',   label: 'Commandes brouillon',               icon: '📋', groupe: 'Avancé' },
  { key: 'exportDonnees',        label: 'Export CSV/Excel',                  icon: '📤', groupe: 'Avancé' },
  { key: 'reseauxSociaux',       label: 'Intégration réseaux sociaux',       icon: '📱', groupe: 'Avancé' },
  { key: 'multiLangues',         label: 'Multi-langues boutique',            icon: '🌐', groupe: 'Avancé' },
  { key: 'apiAcces',             label: 'Accès API',                         icon: '🔌', groupe: 'Avancé' },
  { key: 'messagerie',           label: 'Messagerie interne',                icon: '✉️', groupe: 'Premium' },
  { key: 'etiquettesExpedition', label: "Étiquettes d'expédition",           icon: '🏷️', groupe: 'Premium' },
  { key: 'rapportsAvances',      label: 'Rapports avancés',                  icon: '📈', groupe: 'Premium' },
  { key: 'supportPrioritaire',   label: 'Support prioritaire',               icon: '🎯', groupe: 'Premium' },
  { key: 'connecterBoutique',    label: 'Connecter votre boutique',          icon: '🔌', groupe: 'Premium' },
  // ── NOUVEAU ──────────────────────────────────────────────────────────────────
  { key: 'chatVideo',            label: 'Chat vidéo en direct',              icon: '📹', groupe: 'Premium' },
];

// ── Helper: construire liste de fonctionnalités depuis un objet de flags ──────
export function buildFonctionnalites(flags: { [key: string]: boolean }, limiteProduits?: number | 'Illimité'): Fonctionnalite[] {
  return FONCTIONNALITES_MASTER.map(f => {
    let label = f.label;
    let note: string | undefined;

    // Label dynamique pour les produits
    if (f.key === 'tableauBord' && limiteProduits !== undefined) {
      // pas de changement
    }
    if (f.key === 'codesPromo' && flags[f.key]) {
      note = 'PayPal uniquement';
    }
    if (f.key === 'etiquettesExpedition' && flags[f.key]) {
      note = '🏷️ Shippo, EasyPost, Postes Canada';
    }
    if (f.key === 'messagerie' && flags[f.key]) {
      note = 'Nouveauté ✨';
    }
    if (f.key === 'chatVideo' && flags[f.key]) {
      note = 'Voir les articles en live 🎥';
    }

    return { key: f.key, label, inclus: !!flags[f.key], note };
  });
}

// ── Plans par défaut (données initiales) ──────────────────────────────────────
const PLANS_DEFAUT: PlanData[] = [
  {
    id: 'basic', nom: 'Plan Basic', emoji: '🌱', position: 1,
    prixHT: 0, tps: 0, tvq: 0,
    fraisActivationHT: 0, fraisActivationTPS: 0, fraisActivationTVQ: 0,
    periodeEssai: 2000, limiteProduits: 25, commission: 12,
    couleurBanniere: 'linear-gradient(135deg, #6b8f71 0%, #4a6b50 100%)',
    couleurCarte: '#f4f6f8',
    description: 'Idéal pour commencer à vendre sans frais mensuels.',
    recommande: false, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: false,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: false,
    emailsVendeurs: '', infoSupplementaire: '',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true,
    }, 25),
  },
  {
    id: 'bronze', nom: 'Plan Bronze', emoji: '🥉', position: 2,
    prixHT: 5, tps: 0.25, tvq: 0.50,
    fraisActivationHT: 50, fraisActivationTPS: 2.50, fraisActivationTVQ: 5,
    periodeEssai: 10, limiteProduits: 100, commission: 11.5,
    couleurBanniere: 'linear-gradient(135deg, #a07850 0%, #7d5a3c 100%)',
    couleurCarte: '#f4f0eb',
    description: 'Pour les vendeurs qui souhaitent développer leur boutique.',
    recommande: false, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: true,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: false,
    emailsVendeurs: '', infoSupplementaire: '',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true, blog: true, faq: true,
    }, 100),
  },
  {
    id: 'argent', nom: 'Plan Argent', emoji: '🥈', position: 3,
    prixHT: 10, tps: 0.50, tvq: 1.00,
    fraisActivationHT: 50, fraisActivationTPS: 2.50, fraisActivationTVQ: 5,
    periodeEssai: 10, limiteProduits: 200, commission: 11,
    couleurBanniere: 'linear-gradient(135deg, #7a8fa6 0%, #5a6f84 100%)',
    couleurCarte: '#f0f2f5',
    description: 'Plus de produits et de fonctionnalités pour croître.',
    recommande: false, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: true,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: false,
    emailsVendeurs: '', infoSupplementaire: '',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true, blog: true, faq: true,
      gestionStocks: true, statistiquesVisiteurs: true,
    }, 200),
  },
  {
    id: 'or', nom: 'Plan Or', emoji: '🥇', position: 4,
    prixHT: 20, tps: 1.00, tvq: 2.00,
    fraisActivationHT: 50, fraisActivationTPS: 2.50, fraisActivationTVQ: 5,
    periodeEssai: 10, limiteProduits: 500, commission: 10,
    couleurBanniere: 'linear-gradient(135deg, #c9961a 0%, #a07810 100%)',
    couleurCarte: '#fffbeb',
    description: 'Le plan populaire avec messagerie interne incluse.',
    recommande: true, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: true,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: false,
    emailsVendeurs: '', infoSupplementaire: '',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true, blog: true, faq: true,
      modeEncheres: true, modeFaireOffre: true, publicationFuture: true,
      gestionStocks: true, codesPromo: true, collections: true,
      statistiquesVisiteurs: true, commandesBrouillon: true, exportDonnees: true,
      messagerie: true, rapportsAvances: true, connecterBoutique: true,
    }, 500),
  },
  {
    id: 'extreme', nom: 'Plan Extrême', emoji: '🚀', position: 5,
    prixHT: 30, tps: 1.50, tvq: 3.00,
    fraisActivationHT: 75, fraisActivationTPS: 3.75, fraisActivationTVQ: 7.50,
    periodeEssai: 10, limiteProduits: 1000, commission: 9,
    couleurBanniere: 'linear-gradient(135deg, #537373 0%, #2c4a4a 100%)',
    couleurCarte: '#f0f5f5',
    description: "Toutes les fonctionnalités incluant étiquettes d'expédition et chat vidéo.",
    recommande: false, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: true,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: false,
    emailsVendeurs: '', infoSupplementaire: '',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true, blog: true, faq: true,
      modeEncheres: true, modeFaireOffre: true, publicationFuture: true,
      gestionStocks: true, codesPromo: true, collections: true,
      statistiquesVisiteurs: true, commandesBrouillon: true, exportDonnees: true,
      reseauxSociaux: true, multiLangues: true, messagerie: true,
      etiquettesExpedition: true, rapportsAvances: true, supportPrioritaire: true,
      connecterBoutique: true, chatVideo: true,
    }, 1000),
  },
  {
    id: 'fondateur', nom: 'Plan Fondateur', emoji: '👑', position: 6,
    prixHT: 0, tps: 0, tvq: 0,
    fraisActivationHT: 0, fraisActivationTPS: 0, fraisActivationTVQ: 0,
    periodeEssai: 5000, limiteProduits: 'Illimité', commission: 10,
    couleurBanniere: 'linear-gradient(135deg, #6d4fc2 0%, #4a2fa0 100%)',
    couleurCarte: '#f5f0ff',
    description: 'Réservé aux vendeurs inscrits durant la période de promotion.',
    recommande: false, statut: 'actif', visibleVendeur: true,
    typeAbonnement: 'mensuel', fraisActivationActif: false,
    chargerFraisSur: 'nouvelle_inscription', assignerVendeurs: true,
    emailsVendeurs: '', infoSupplementaire: 'Plan exclusif fondateurs.',
    fonctionnalites: buildFonctionnalites({
      tableauBord: true, gestionCommandes: true, gestionRetours: true,
      paiementsStripePaypal: true, modeVacances: true, blog: true, faq: true,
      modeEncheres: true, modeFaireOffre: true, publicationFuture: true,
      gestionStocks: true, codesPromo: true, collections: true,
      statistiquesVisiteurs: true, commandesBrouillon: true, exportDonnees: true,
      reseauxSociaux: true, multiLangues: true, messagerie: true,
      rapportsAvances: true, supportPrioritaire: true, connecterBoutique: true,
      chatVideo: true,
    }, 'Illimité'),
  },
];

// ============================================================
//  COUCHE D'ACCÈS AUX DONNÉES
//  → Pour migrer vers API: remplacer le corps de ces fonctions
//    par des appels fetch(). L'interface reste identique.
// ============================================================

/**
 * Récupère tous les plans
 * MIGRATION: return await fetch('/api/plans').then(r => r.json())
 */
export function getPlans(): PlanData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Premier lancement — initialiser avec les plans par défaut
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PLANS_DEFAUT));
      return PLANS_DEFAUT;
    }
    return JSON.parse(raw) as PlanData[];
  } catch {
    return PLANS_DEFAUT;
  }
}

/**
 * Récupère les plans visibles pour les vendeurs
 * MIGRATION: return await fetch('/api/plans?visible=true').then(r => r.json())
 */
export function getPlansVisibles(): PlanData[] {
  return getPlans().filter(p => p.statut === 'actif' && p.visibleVendeur);
}

/**
 * Récupère un plan par ID
 * MIGRATION: return await fetch(`/api/plans/${id}`).then(r => r.json())
 */
export function getPlanById(id: string): PlanData | undefined {
  return getPlans().find(p => p.id === id);
}

/**
 * Crée un nouveau plan
 * MIGRATION: return await fetch('/api/plans', { method: 'POST', body: JSON.stringify(plan) }).then(r => r.json())
 */
export function createPlan(plan: Omit<PlanData, 'id'>): PlanData {
  const plans = getPlans();
  const newPlan: PlanData = {
    ...plan,
    id: 'plan_' + Date.now(),
  };
  plans.push(newPlan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return newPlan;
}

/**
 * Met à jour un plan existant
 * MIGRATION: return await fetch(`/api/plans/${id}`, { method: 'PUT', body: JSON.stringify(updates) }).then(r => r.json())
 */
export function updatePlan(id: string, updates: Partial<PlanData>): PlanData | null {
  const plans = getPlans();
  const index = plans.findIndex(p => p.id === id);
  if (index === -1) return null;
  plans[index] = { ...plans[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return plans[index];
}

/**
 * Supprime un plan
 * MIGRATION: await fetch(`/api/plans/${id}`, { method: 'DELETE' })
 */
export function deletePlan(id: string): boolean {
  const plans = getPlans();
  const filtered = plans.filter(p => p.id !== id);
  if (filtered.length === plans.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Réinitialise les plans aux valeurs par défaut (utile pour les tests)
 */
export function resetPlans(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PLANS_DEFAUT));
}

/**
 * Helper: calcul TTC depuis prix HT
 */
export function calculerTTC(prixHT: number): { tps: number; tvq: number; ttc: number } {
  const tps = prixHT * 0.05;
  const tvq = prixHT * 0.09975;
  return { tps, tvq, ttc: prixHT + tps + tvq };
}

/**
 * Helper: formater un prix en dollars canadiens
 */
export function fmtPrix(n: number): string {
  return n === 0 ? 'Gratuit' : n.toFixed(2).replace('.', ',') + ' $';
}
