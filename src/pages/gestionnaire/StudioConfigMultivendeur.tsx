// CHEMIN : src/pages/gestionnaire/StudioConfigMultivendeur.tsx
/**
 * StudioConfigMultivendeur.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioConfigMultivendeur.tsx
 *
 * Configuration complète du template marketplace multivendeur.
 * Inspiré de ConfigurationGenerale.tsx d'e-Vend.
 * Retiré : tout ce qui est Shopify, PayPal (Stripe seulement).
 *
 * Routes API :
 *   GET /api/studio/sites/:gestionnaireId      → config actuelle
 *   PUT /api/studio/sites/:id/config      → sauvegarder (clé "multivendeur")
 */

import React, { useState, useEffect, useCallback } from 'react';
import StripeGestionnaire from './StripeGestionnaire';
import { oublierDevise } from '../../templates/shared/devise';

const API_BASE = (window as any).API_BASE || '/api';

// ─── Palette Studio ───────────────────────────────────────────────────────────
const T = {
  accent:      '#c9a96e',
  accentLight: 'rgba(201,169,110,0.12)',
  bg:          '#f4f6f8',
  card:        '#fff',
  border:      '#e2e8f0',
  text:        '#1e293b',
  textLight:   '#64748b',
  success:     '#10b981',
  warning:     '#f59e0b',
  danger:      '#ef4444',
};

const inputStyle: React.CSSProperties = {
  border: `1px solid #cbd5e1`, borderRadius: '8px', padding: '8px 12px',
  fontSize: '13px', outline: 'none', backgroundColor: 'white',
  width: '100%', boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

// ─── Sous-composants ──────────────────────────────────────────────────────────
function Toggle({ actif, onChange }: { actif: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!actif)} style={{ width: '48px', height: '26px', borderRadius: '13px', backgroundColor: actif ? T.success : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: actif ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function Section({ titre, icon, children, danger }: { titre: string; icon: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${danger ? '#fecdd3' : T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${danger ? T.danger : T.accent}`, backgroundColor: danger ? '#fff5f5' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: danger ? T.danger : T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function ParamLigne({ label, description, children, derniere }: { label: string; description?: string; children: React.ReactNode; derniere?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', paddingBottom: derniere ? 0 : '16px', marginBottom: derniere ? 0 : '16px', borderBottom: derniere ? 'none' : '1px solid #f0f0f0' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{label}</p>
        {description && <p style={{ fontSize: '11px', color: T.textLight, margin: 0, lineHeight: 1.5 }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Onglet({ label, actif, onClick }: { label: string; actif: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', borderBottom: actif ? `3px solid ${T.accent}` : '3px solid transparent', backgroundColor: actif ? '#fff' : 'transparent', color: actif ? T.accent : T.textLight, cursor: 'pointer', transition: 'all 0.2s', borderRadius: '8px 8px 0 0', marginRight: '4px' }}>
      {label}
    </button>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', backgroundColor: type === 'success' ? T.success : T.danger, color: 'white', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {type === 'success' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

function ModalConfirm({ titre, message, onConfirmer, onAnnuler }: { titre: string; message: string; onConfirmer: () => void; onAnnuler: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={e => e.target === e.currentTarget && onAnnuler()}>
      <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', backgroundColor: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: T.danger, margin: 0 }}>⚠️ {titre}</p>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px', lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onAnnuler} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button onClick={onConfirmer} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Types Commission ─────────────────────────────────────────────────────────
interface CommissionSlab { min: string; max: string; type: string; premiereCommission: string; secondeCommission: string; }

// ─── Interface config complète ────────────────────────────────────────────────
interface ConfigMV {
  // Généralité
  nom_marketplace: string; email_contact: string; store_email: string;
  contact_number: string; devise: string; langue: string;
  fuseau_horaire: string; date_format: string; footer_text: string;
  stripe_actif: boolean; avis_actifs: boolean; notifs_auto_vendeurs: boolean;
  utiliser_plans_vendeur: boolean; max_produits: string;
  bloquer_inscription_collaborateur: boolean; bloquer_inscription_acheteur: boolean;
  mode_maintenance: boolean; message_maintenance: string;
  banniere_collab_active: boolean; banniere_collab_message: string;
  banniere_collab_couleur_bg: string; banniere_collab_couleur_tx: string;
  banniere_collab_hauteur: string; banniere_collab_police: string;
  banniere_acheteur_active: boolean; banniere_acheteur_message: string;
  banniere_acheteur_couleur_bg: string; banniere_acheteur_couleur_tx: string;
  banniere_acheteur_hauteur: string; banniere_acheteur_police: string;
  social_facebook: string; social_instagram: string; social_x: string;
  social_linkedin: string; social_youtube: string; social_tiktok: string;
  social_pinterest: string;
  // Config vendeur
  approuver_auto_collaborateur: boolean;
  voir_details_client: boolean; voir_email_client: boolean; voir_telephone_client: boolean;
  permettre_tags: boolean;
  permettre_categories: boolean;
  permettre_changement_unite_poids: boolean;
  approuver_auto_avis: boolean; permettre_gestion_auto_approbation_avis: boolean;
  notification_stock_faible: boolean; seuil_stock_faible: string;
  vacances_vendeur: boolean;
  verification_email: boolean;
  shop_faq: boolean; c2c_marketplace: boolean;
  login_as_seller: boolean; minimum_purchase_amount: boolean;
  // Config produits
  approuver_auto_produit: boolean; gerer_inventaire_par_defaut: boolean;
  quantite_minimum_achat: boolean; application_quantite_minimum: string;
  prix_zero_autorise: boolean; texte_aide_formulaire: boolean;
  support_video_media: boolean; permettre_ajout_prix_revient: boolean;
  texte_aide_produit: string;
  prix_minimum: string; date_publication_future: boolean;
  date_vente_future: boolean; afficher_produits_futurs: boolean;
  liste_produits_desactives_mail: boolean;
  restreindre_caracteres_speciaux: boolean;
  frais_transaction: boolean; type_frais_transaction: string;
  porteur_frais_transaction: string; application_frais_transaction: string;
  pourcentage_frais: string; montant_fixe_frais: string;
  texte_alternatif_media: boolean; prix_solde: boolean;
  arrondi_prix: string; frais_manutention: boolean;
  weight_unit: string; dimension_unit: string; sauvegarder_brouillon: boolean;
  destinataire_taxes: 'admin' | 'vendeur';
  // Config commande
  mode_expedition_obligatoire: boolean; numero_suivi_obligatoire: boolean;
  taxes_incluses_prix: boolean;
  permettre_etiquette_expedition: boolean; jours_remboursement: string; jours_delai_avis: string; remboursement_collab_autonome: boolean;
  permettre_accepter_commande: boolean;
  permettre_annuler_commande_acceptee: boolean; accepter_et_expedier: boolean;
  envoyer_mail_expedition: boolean; permettre_date_livraison_prevue: boolean;
  date_livraison_obligatoire: boolean; gestion_pourboire: string;
  permettre_cc_email_commande: boolean; rappel_expedition_auto: boolean;
  jours_avant_rappel: string; jours_max_rappel: string;
  generation_facture: string;
  permettre_infos_supplementaires: boolean;
  // Avancé
  google_translation: boolean; translation_panel: string;
  // Commission
  calcul_commission_base: string; type_commission_globale: string;
  commission_globale: string; seconde_commission_globale: string;
  commission_fixe_application: string; activer_commission_max: boolean;
  commission_max: string; baremes_commission: CommissionSlab[];
  commission_taxable: boolean; commission_province: string;
  // Taux de taxes (en %, réglés par le gestionnaire ; tous les collaborateurs les utilisent)
  taxe_tps: string; taxe_tvq: string;
  taxe_tvh_on: string; taxe_tvh_nb: string; taxe_tvh_ns: string; taxe_tvh_nl: string; taxe_tvh_pe: string;
  taxe_tvp_bc: string; taxe_tvp_sk: string; taxe_tvp_mb: string;
  // Enchères
  encheres_actives: boolean; enchere_duree_min_h: string; enchere_duree_max_jours: string;
  enchere_increment_min: string; enchere_reserve_permise: boolean;
  enchere_delai_paiement_h: string; enchere_max_par_collab: string;
}

const DEFAUTS: ConfigMV = {
  nom_marketplace: '', email_contact: '', store_email: '', contact_number: '',
  devise: 'CAD', langue: 'fr', fuseau_horaire: 'America/Toronto',
  date_format: 'DD-MMM-YYYY', footer_text: 'Copyright ($annee) Tous droits réservés',
  stripe_actif: true, avis_actifs: true, notifs_auto_vendeurs: true,
  utiliser_plans_vendeur: false, max_produits: '50',
  bloquer_inscription_collaborateur: false, bloquer_inscription_acheteur: false,
  mode_maintenance: false, message_maintenance: '',
  banniere_collab_active: false, banniere_collab_message: '',
  banniere_collab_couleur_bg: '#1e3a5f', banniere_collab_couleur_tx: '#ffffff',
  banniere_collab_hauteur: '36', banniere_collab_police: '13',
  banniere_acheteur_active: false, banniere_acheteur_message: '',
  banniere_acheteur_couleur_bg: '#1e3a5f', banniere_acheteur_couleur_tx: '#ffffff',
  banniere_acheteur_hauteur: '36', banniere_acheteur_police: '13',
  social_facebook: '', social_instagram: '', social_x: '',
  social_linkedin: '', social_youtube: '', social_tiktok: '', social_pinterest: '',
  approuver_auto_collaborateur: false,
  voir_details_client: true, voir_email_client: false, voir_telephone_client: false,
  permettre_tags: true,
  permettre_categories: true,
  permettre_changement_unite_poids: false,
  approuver_auto_avis: true, permettre_gestion_auto_approbation_avis: false,
  notification_stock_faible: false, seuil_stock_faible: '5',
  vacances_vendeur: false,
  verification_email: true,
  shop_faq: false, c2c_marketplace: false,
  login_as_seller: false, minimum_purchase_amount: false,
  approuver_auto_produit: true, gerer_inventaire_par_defaut: true,
  quantite_minimum_achat: false, application_quantite_minimum: 'produit',
  prix_zero_autorise: false, texte_aide_formulaire: false,
  support_video_media: false, permettre_ajout_prix_revient: false,
  texte_aide_produit: '', prix_minimum: '0',
  date_publication_future: false, date_vente_future: false,
  afficher_produits_futurs: false, liste_produits_desactives_mail: false,
  restreindre_caracteres_speciaux: false, frais_transaction: false,
  type_frais_transaction: 'normal', porteur_frais_transaction: 'admin',
  application_frais_transaction: 'commande', pourcentage_frais: '2.90',
  montant_fixe_frais: '0.30', texte_alternatif_media: true, prix_solde: false,
  arrondi_prix: '2', frais_manutention: false, weight_unit: 'kg',
  dimension_unit: 'cm', sauvegarder_brouillon: false,
  destinataire_taxes: 'admin',
  mode_expedition_obligatoire: false, numero_suivi_obligatoire: false,
  taxes_incluses_prix: false,
  permettre_etiquette_expedition: false, jours_remboursement: '14', jours_delai_avis: '90', remboursement_collab_autonome: false,
  permettre_accepter_commande: true,
  permettre_annuler_commande_acceptee: false, accepter_et_expedier: false,
  envoyer_mail_expedition: true, permettre_date_livraison_prevue: false,
  date_livraison_obligatoire: false, gestion_pourboire: 'vendeurs',
  permettre_cc_email_commande: false, rappel_expedition_auto: false,
  jours_avant_rappel: '2', jours_max_rappel: '30',
  generation_facture: 'anyTime',
  permettre_infos_supplementaires: false,
  google_translation: false, translation_panel: 'both',
  calcul_commission_base: 'normal', type_commission_globale: '%',
  commission_globale: '10.00', seconde_commission_globale: '0.00',
  commission_fixe_application: 'commande', activer_commission_max: false,
  commission_max: '0.00', baremes_commission: [],
  commission_taxable: false, commission_province: 'QC',
  taxe_tps: '5', taxe_tvq: '9.975',
  taxe_tvh_on: '13', taxe_tvh_nb: '15', taxe_tvh_ns: '15', taxe_tvh_nl: '15', taxe_tvh_pe: '15',
  taxe_tvp_bc: '7', taxe_tvp_sk: '6', taxe_tvp_mb: '7',
  encheres_actives: false, enchere_duree_min_h: '1', enchere_duree_max_jours: '14',
  enchere_increment_min: '1.00', enchere_reserve_permise: true,
  enchere_delai_paiement_h: '24', enchere_max_par_collab: '0',
};

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

// Validation des barèmes de commission : retourne la liste des problèmes (vide = OK)
function problemesBaremes(liste: ConfigMV['baremes_commission']): string[] {
  const pb: string[] = [];
  const nb = (v: unknown) => parseFloat(String(v ?? '').replace(',', '.'));
  const plages: { i: number; min: number; max: number }[] = [];
  (liste as any[]).forEach((b, i) => {
    const n = i + 1;
    const min = String(b.min ?? '').trim() === '' ? 0 : nb(b.min);
    const max = String(b.max ?? '').trim() === '' ? Infinity : nb(b.max);
    const a = nb(b.premiereCommission), f = String(b.secondeCommission ?? '').trim() === '' ? 0 : nb(b.secondeCommission);
    if (!Number.isFinite(min) || min < 0) pb.push(`Barème ${n} : le minimum est invalide.`);
    else if (Number.isNaN(max) || max < 0) pb.push(`Barème ${n} : le maximum est invalide.`);
    else if (max < min) pb.push(`Barème ${n} : le maximum doit être plus grand que le minimum.`);
    else plages.push({ i: n, min, max });
    if (!Number.isFinite(a) || a < 0) pb.push(`Barème ${n} : le taux est obligatoire (0 ou plus).`);
    else if (b.type !== 'FIXED' && a > 100) pb.push(`Barème ${n} : le pourcentage ne peut pas dépasser 100.`);
    if (b.type === '% + FIXED' && (!Number.isFinite(f) || f < 0)) pb.push(`Barème ${n} : le montant fixe est invalide.`);
  });
  for (let x = 0; x < plages.length; x++) for (let y = x + 1; y < plages.length; y++) {
    if (plages[x].min <= plages[y].max && plages[y].min <= plages[x].max) pb.push(`Barèmes ${plages[x].i} et ${plages[y].i} : les montants se chevauchent.`);
  }
  return pb;
}

export default function StudioConfigMultivendeur({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const [siteId, setSiteId]     = useState<number | null>(null);
  const [config, setConfig]     = useState<ConfigMV>(DEFAUTS);
  const [original, setOriginal] = useState<ConfigMV>(DEFAUTS);
  const [loading, setLoading]   = useState(true);
  const [onglet, setOnglet]     = useState<'generalite' | 'vendeur' | 'produits' | 'commande' | 'commission' | 'encheres' | 'stripe' | 'avance'>('generalite');
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);
  // SMTP du gestionnaire (Modèles de courriel → Serveur d'envoi) : sans serveur actif, l'email d'expédition automatique est bloqué
  const [smtpOk, setSmtpOk] = useState<boolean | null>(null);
  const [modalConfirm, setModalConfirm] = useState<{ titre: string; message: string; action: () => void } | null>(null);
  const [modifie, setModifie]   = useState(false);

  const marquer = () => setModifie(true);
  const set = <K extends keyof ConfigMV>(key: K) => (v: ConfigMV[K]) => { setConfig(c => ({ ...c, [key]: v })); marquer(); };

  const showToast = (msg: string, type: 'success' | 'danger') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const toggleCritique = (valeur: boolean, setter: (v: boolean) => void, titre: string, msg: string) => {
    if (valeur) setModalConfirm({ titre, message: msg, action: () => { setter(false); marquer(); setModalConfirm(null); } });
    else { setter(true); marquer(); }
  };

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSiteId(data.id);
      const mv = { ...(data.config?.multivendeur ?? {}) };
      // Anciennes clés « vendeur » → « collaborateur » (reprise des valeurs déjà enregistrées)
      for (const k of Object.keys(mv)) {
        if (k.startsWith('banniere_vendeur_')) { const n = k.replace('banniere_vendeur_', 'banniere_collab_'); if (mv[n] === undefined) mv[n] = mv[k]; delete mv[k]; }
      }
      delete mv.approuver_auto_vendeur;   // ancien réglage inactif (valeur par défaut « true » jamais appliquée) : on ne la reprend pas
      for (const k of ['delais_livraison', 'cacher_champ_tags', 'afficher_nom_marque', 'type_prix_libre', 'permettre_expedition', 'vendeur_sur_boutique', 'permettre_nom_boutique_inscription', 'option_inscription', 'restreindre_tags_inscription', 'restreindre_categories_inscription', 'permettre_devise_propre', 'methode_conversion', 'voir_total_du', 'sso_actif', 'statut_preparation_commande', 'restreindre_expedition_fraude', 'deduire_expedition_remboursement', 'deduire_taxes_remboursement', 'taxes_sur_expedition', 'tcs_sur_commandes', 'tds_sur_commandes', 'annuler_auto_rejet', 'mode_taxe', 'type_commission_fixe', 'rtl_alignment', 'heures_preparation', 'restreindre_desactivation_avis', 'avis_avance', 'check_customer_login', 'check_customer_purchase']) delete mv[k];   // réglages supprimés de Config vendeur
      if (mv.bloquer_inscription_vendeur !== undefined) { if (mv.bloquer_inscription_collaborateur === undefined) mv.bloquer_inscription_collaborateur = mv.bloquer_inscription_vendeur; delete mv.bloquer_inscription_vendeur; }
      // Nom de la marketplace et courriel de contact : une seule source, partagée avec « Configurer mes pages »
      try {
        const r2 = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/config-multivendeur`);
        if (r2.ok) {
          const pages = await r2.json();
          if (typeof pages?.nom_boutique === 'string' && pages.nom_boutique) mv.nom_marketplace = pages.nom_boutique;
          if (typeof pages?.extra?.contact?.courriel === 'string') mv.email_contact = pages.extra.contact.courriel;
        }
      } catch { /* on garde les valeurs actuelles */ }
      const cfg = { ...DEFAUTS, ...mv };
      setConfig(cfg); setOriginal({ ...cfg });
    } catch { /* garder défauts */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    if (onglet !== 'commande') return;
    fetch(`${API_BASE}/studio/courriels/${gestionnaireId}/smtp`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setSmtpOk(!!(d && d.smtp && d.smtp.actif && d.smtp.host && d.smtp.expediteur_email)))
      .catch(() => setSmtpOk(false));
  }, [onglet, gestionnaireId, token]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  const CLES_TAXES: (keyof ConfigMV)[] = ['taxe_tps', 'taxe_tvq', 'taxe_tvh_on', 'taxe_tvh_nb', 'taxe_tvh_ns', 'taxe_tvh_nl', 'taxe_tvh_pe', 'taxe_tvp_bc', 'taxe_tvp_sk', 'taxe_tvp_mb'];

  async function sauvegarder() {
    // Taux de taxes : nombres entre 0 et 30 (virgule acceptée), enregistrés avec un point
    const aSauver: ConfigMV = { ...config };
    for (const k of CLES_TAXES) {
      const n = parseFloat(String(config[k]).replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || n > 30) { showToast('❌ Taux de taxe invalide : entrez un nombre entre 0 et 30', 'danger'); setOnglet('generalite'); return; }
      (aSauver as any)[k] = String(n);
    }
    // Enchères : valeurs cohérentes
    const nEnch = (v: unknown) => parseFloat(String(v).replace(',', '.'));
    const dMin = nEnch(aSauver.enchere_duree_min_h), dMax = nEnch(aSauver.enchere_duree_max_jours), inc = nEnch(aSauver.enchere_increment_min);
    const dPay = nEnch(aSauver.enchere_delai_paiement_h), mxC = nEnch(aSauver.enchere_max_par_collab);
    const erreurEnch =
      !(dMin >= 1 && dMin <= 720) ? 'Durée minimale : entre 1 et 720 heures.' :
      !(dMax >= 1 && dMax <= 60) ? 'Durée maximale : entre 1 et 60 jours.' :
      dMin > dMax * 24 ? 'La durée minimale ne peut pas dépasser la durée maximale.' :
      !(inc >= 0.01) ? "La mise minimale d'augmentation doit être d'au moins 0,01 $." :
      !(dPay >= 1 && dPay <= 24) ? 'Délai de paiement du gagnant : entre 1 et 24 heures.' :
      !(mxC >= 0 && mxC <= 500) ? 'Enchères actives par collaborateur : entre 0 et 500.' : '';
    if (erreurEnch) { showToast('❌ ' + erreurEnch, 'danger'); setOnglet('encheres'); return; }
    const pbBar = problemesBaremes(aSauver.baremes_commission);
    if (pbBar.length) { showToast('❌ ' + pbBar[0], 'danger'); setOnglet('commission'); return; }
    const cg = parseFloat(String(aSauver.commission_globale).replace(',', '.'));
    if (!Number.isFinite(cg) || cg < 0 || (aSauver.type_commission_globale === '%' && cg > 100)) { showToast('❌ Commission globale invalide', 'danger'); setOnglet('commission'); return; }
    // Validations simples
    const courrielOk = (v: string) => v === '' || /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.trim());
    if (!aSauver.nom_marketplace.trim()) { showToast('❌ Le nom de la marketplace est obligatoire', 'danger'); setOnglet('generalite'); return; }
    if (!courrielOk(aSauver.email_contact) || !courrielOk(aSauver.store_email)) { showToast('❌ Courriel invalide (Généralité)', 'danger'); setOnglet('generalite'); return; }
    const max = parseInt(String(aSauver.max_produits), 10);
    const pmin = Number(aSauver.prix_minimum);
    if (aSauver.prix_minimum !== '' && (!Number.isFinite(pmin) || pmin < 0 || pmin > 1000000)) { showToast('❌ Prix minimum invalide : entrez un nombre positif (0 = aucun minimum)', 'danger'); setOnglet('produits'); return; }
    if (aSauver.max_produits !== '' && (!Number.isFinite(max) || max < 0 || max > 100000)) { showToast('❌ Max produits : entrez un nombre entre 0 et 100000 (0 = illimité)', 'danger'); setOnglet('generalite'); return; }
    for (const k of ['social_facebook', 'social_instagram', 'social_x', 'social_linkedin', 'social_youtube', 'social_tiktok', 'social_pinterest'] as const) {
      const v = String(aSauver[k] || '').trim();
      if (v && (/[\s<>"']/.test(v) || /^(javascript|data|vbscript):/i.test(v) || !/^(https?:\/\/)?[^/.\s]+\.[^/\s]+/i.test(v))) { showToast('❌ Lien de réseau social invalide : ' + k.replace('social_', ''), 'danger'); setOnglet('generalite'); return; }
      (aSauver as any)[k] = v === '' || /^https?:\/\//i.test(v) ? v : `https://${v}`;
    }
    try {
      // 1) Nom + courriel de contact : enregistrés à la source commune avec « Configurer mes pages »
      const resId = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/config-multivendeur/identite`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom_boutique: aSauver.nom_marketplace.trim(), courriel_contact: aSauver.email_contact.trim() }),
      });
      if (!resId.ok) throw new Error((await resId.json().catch(() => ({}))).message || 'identite');
      // 2) Le reste de la config (sans les 2 champs partagés, pour ne pas les garder en double)
      const { nom_marketplace: _n, email_contact: _e, ...sansIdentite } = aSauver as any;
      // Le serveur attend l'identifiant du GESTIONNAIRE dans l'URL et la config sous la clé « config »
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config: { multivendeur: sansIdentite } }),
      });
      if (!res.ok) throw new Error();
      oublierDevise(gestionnaireId);
      setConfig(aSauver); setOriginal({ ...aSauver }); setModifie(false);
      showToast('✅ Configuration sauvegardée !', 'success');
    } catch { showToast('❌ Erreur lors de la sauvegarde', 'danger'); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div><p style={{ color: T.textLight }}>Chargement…</p></div>
    </div>
  );

  // ── Bannière preview ──────────────────────────────────────────────────────
  const BanPreview = ({ bg, tx, hauteur, police, message }: any) => (
    <div style={{ backgroundColor: bg, color: tx, height: `${hauteur}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${police}px`, fontWeight: 600, borderRadius: '6px', marginTop: '12px', padding: '0 12px', textAlign: 'center' }}>
      {message || 'Aperçu de la bannière…'}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {modalConfirm && <ModalConfirm titre={modalConfirm.titre} message={modalConfirm.message} onConfirmer={modalConfirm.action} onAnnuler={() => setModalConfirm(null)} />}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>🏪</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: T.text }}>Configuration marketplace</h1>
            <p style={{ margin: 0, fontSize: '13px', color: T.textLight }}>Paramètres avancés de votre marketplace multivendeur</p>
          </div>
        </div>
        {onglet !== 'stripe' && <div style={{ display: 'flex', gap: '10px' }}>
          {modifie && <button onClick={() => { setConfig({ ...original }); setModifie(false); }} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>}
          <button onClick={sauvegarder} disabled={!modifie} style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: `2px solid ${T.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'generalite',  label: '🌍 Généralité' },
          { id: 'vendeur',     label: '👤 Config vendeur' },
          { id: 'produits',    label: '📦 Produits' },
          { id: 'commande',    label: '🛒 Commandes' },
          { id: 'commission',  label: '💰 Commission' },
          { id: 'encheres',    label: '🔨 Enchères' },
          { id: 'stripe',      label: '💳 Config Stripe Connect' },
          { id: 'avance',      label: '⚙️ Avancé' },
        ].map(o => <Onglet key={o.id} label={o.label} actif={onglet === o.id as any} onClick={() => setOnglet(o.id as any)} />)}
      </div>

      {/* ══ GÉNÉRALITÉ ══ */}
      {onglet === 'generalite' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Informations marketplace" icon="🌍">
              <ParamLigne label="Nom de votre marketplace" description="Affiché dans le menu, la connexion, le pied de page et les courriels. C'est le même champ que « Configurer mes pages → Identité » : modifié ici ou là, il change aux deux endroits.">
                <input style={{ ...inputStyle, width: '220px' }} value={config.nom_marketplace} onChange={e => set('nom_marketplace')(e.target.value)} placeholder="Ma Marketplace" />
              </ParamLigne>
              <ParamLigne label="Email de contact" description="Affiché sur la page Contact du site. Même champ que « Configurer mes pages → Contact » : modifié ici ou là, il change aux deux endroits.">
                <input style={{ ...inputStyle, width: '220px' }} type="email" value={config.email_contact} onChange={e => set('email_contact')(e.target.value)} placeholder="contact@mamarketplace.ca" />
              </ParamLigne>
              <ParamLigne label="Email de la boutique" description="Adresse officielle de la boutique (enregistrée avec cette configuration).">
                <input style={{ ...inputStyle, width: '220px' }} type="email" value={config.store_email} onChange={e => set('store_email')(e.target.value)} placeholder="noreply@mamarketplace.ca" />
              </ParamLigne>
              <ParamLigne label="Numéro de téléphone">
                <input style={{ ...inputStyle, width: '180px' }} value={config.contact_number} onChange={e => set('contact_number')(e.target.value)} placeholder="514 555-1234" />
              </ParamLigne>
              <ParamLigne label="Devise" description="S'applique à tous les prix du site, des dashboards, du panier, du paiement Stripe et des courriels. Aucune conversion : les prix gardent leur valeur numérique.">
                <select style={{ ...selectStyle, width: '160px' }} value={config.devise} onChange={e => set('devise')(e.target.value)}>
                  <option value="CAD">🇨🇦 CAD ($)</option>
                  <option value="USD">🇺🇸 USD ($)</option>
                  <option value="EUR">🇪🇺 EUR (€)</option>
                  <option value="GBP">🇬🇧 GBP (£)</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Langue" description="Le site est en français pour le moment. La traduction viendra plus tard.">
                <select style={{ ...selectStyle, width: '160px' }} value={config.langue} onChange={e => set('langue')(e.target.value)}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Fuseau horaire" description="Détermine « aujourd'hui » pour le mode vacances, le rapport financier et les dates des courriels d'enchères.">
                <select style={{ ...selectStyle, width: '220px' }} value={config.fuseau_horaire} onChange={e => set('fuseau_horaire')(e.target.value)}>
                  <option value="America/Toronto">Toronto / Montréal (heure de l'Est)</option>
                  <option value="America/Halifax">Halifax (heure de l'Atlantique)</option>
                  <option value="America/St_Johns">Terre-Neuve (St. John's)</option>
                  <option value="America/Winnipeg">Winnipeg (heure du Centre)</option>
                  <option value="America/Regina">Regina (Saskatchewan)</option>
                  <option value="America/Edmonton">Edmonton (heure des Rocheuses)</option>
                  <option value="America/Vancouver">Vancouver (heure du Pacifique)</option>
                  <option value="America/New_York">New York (heure de l'Est)</option>
                  <option value="America/Chicago">Chicago (heure du Centre)</option>
                  <option value="America/Denver">Denver (heure des Rocheuses)</option>
                  <option value="America/Los_Angeles">Los Angeles (heure du Pacifique)</option>
                  <option value="Europe/London">Londres</option>
                  <option value="Europe/Paris">Paris</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Texte du footer" description="Affiché en bas de chaque page, à gauche. ($annee) est remplacé par l'année en cours." derniere>
                <input style={{ ...inputStyle, width: '220px' }} value={config.footer_text} onChange={e => set('footer_text')(e.target.value)} placeholder="Copyright ($annee)…" />
              </ParamLigne>
            </Section>

            <Section titre="Méthode de paiement" icon="💳">
              <ParamLigne label="Stripe Connect" description="Paiements et virements vendeurs via Stripe. Le paiement hors plateforme (Interac, etc.) viendra plus tard, en add-on." derniere>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: config.stripe_actif ? '#635bff' : T.textLight }}>{config.stripe_actif ? '⚡ Actif' : '— Inactif'}</span>
                  <Toggle actif={config.stripe_actif} onChange={() => toggleCritique(config.stripe_actif, v => set('stripe_actif')(v), 'Désactiver Stripe Connect', 'Les vendeurs ne recevront plus de virements Stripe. Confirmez-vous ?')} />
                </div>
              </ParamLigne>
            </Section>

            <Section titre="Fonctionnalités" icon="⭐">
              <ParamLigne label="Avis clients" description="Désactivé : les acheteurs ne peuvent plus laisser d'avis et l'onglet Avis disparaît des boutiques. Vous modérez les avis dans Multi-vendeur → Avis.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: config.avis_actifs ? T.success : T.textLight }}>{config.avis_actifs ? '✓ Actif' : '— Inactif'}</span>
                  <Toggle actif={config.avis_actifs} onChange={set('avis_actifs')} />
                </div>
              </ParamLigne>
              <ParamLigne label="Notifications automatiques vendeurs" description="À venir : notifications dans la messagerie du collaborateur.">
                <Toggle actif={config.notifs_auto_vendeurs} onChange={set('notifs_auto_vendeurs')} />
              </ParamLigne>
              <ParamLigne label="Marketplace C2C" description="Permet aux acheteurs de devenir vendeurs." derniere>
                <Toggle actif={config.c2c_marketplace} onChange={set('c2c_marketplace')} />
              </ParamLigne>
            </Section>

            <Section titre="Mode maintenance" icon="🛠️" danger={config.mode_maintenance}>
              <ParamLigne label="Activer le mode maintenance" description="Le site n'est plus accessible : les visiteurs voient la page de maintenance (votre message ci-dessous). Vous gardez accès à votre dashboard.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: config.mode_maintenance ? T.danger : T.textLight }}>{config.mode_maintenance ? '🛑 Actif' : '— Inactif'}</span>
                  <Toggle actif={config.mode_maintenance} onChange={set('mode_maintenance')} />
                </div>
              </ParamLigne>
              {config.mode_maintenance && (
                <ParamLigne label="Message de maintenance" derniere>
                  <input style={{ ...inputStyle, width: '280px' }} value={config.message_maintenance} onChange={e => set('message_maintenance')(e.target.value)} placeholder="Site en maintenance…" />
                </ParamLigne>
              )}
            </Section>
          </div>

          <div>
            <Section titre="Taux de taxes" icon="🧾">
              <ParamLigne label="Taux TPS (%)" description="Taxe fédérale. Appliquée sur les ventes taxables dans toutes les provinces sauf celles à TVH.">
                <input type="number" step="0.001" min="0" max="30" style={{ ...inputStyle, width: '110px' }} value={config.taxe_tps} onChange={e => set('taxe_tps')(e.target.value)} />
              </ParamLigne>
              <ParamLigne label="Taux TVQ (%)" description="Taxe de vente du Québec. S'applique aux mêmes transactions que la TPS.">
                <input type="number" step="0.001" min="0" max="30" style={{ ...inputStyle, width: '110px' }} value={config.taxe_tvq} onChange={e => set('taxe_tvq')(e.target.value)} />
              </ParamLigne>
              <ParamLigne label="Taux TVH par province (%)" description="Ontario, Nouveau-Brunswick, Nouvelle-Écosse, Terre-Neuve-et-Labrador, Île-du-Prince-Édouard. La TVH remplace la TPS. Modifiable si le gouvernement ajuste un taux.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 96px)', gap: '10px' }}>
                  {([['taxe_tvh_on', 'Ontario (ON)'], ['taxe_tvh_nb', 'Nouveau-Brunswick (NB)'], ['taxe_tvh_ns', 'Nouvelle-Écosse (NS)'], ['taxe_tvh_nl', 'Terre-Neuve-et-Labrador (NL)'], ['taxe_tvh_pe', 'Île-du-Prince-Édouard (PE)']] as const).map(([k, nom]) => (
                    <div key={k}>
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 3px', lineHeight: 1.3, minHeight: '26px' }}>{nom}</p>
                      <input type="number" step="0.001" min="0" max="30" style={{ ...inputStyle, width: '96px' }} value={config[k]} onChange={e => set(k)(e.target.value)} />
                    </div>
                  ))}
                </div>
              </ParamLigne>
              <ParamLigne label="Taux TVP par province (%)" description="Colombie-Britannique, Saskatchewan, Manitoba : taxe de vente provinciale SÉPARÉE de la TPS (ce ne sont pas des taxes harmonisées en une seule). Les deux montants sont calculés et facturés distinctement." derniere>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 96px)', gap: '10px' }}>
                  {([['taxe_tvp_bc', 'Colombie-Britannique (BC)'], ['taxe_tvp_sk', 'Saskatchewan (SK)'], ['taxe_tvp_mb', 'Manitoba (MB)']] as const).map(([k, nom]) => (
                    <div key={k}>
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 3px', lineHeight: 1.3, minHeight: '26px' }}>{nom}</p>
                      <input type="number" step="0.001" min="0" max="30" style={{ ...inputStyle, width: '96px' }} value={config[k]} onChange={e => set(k)(e.target.value)} />
                    </div>
                  ))}
                </div>
              </ParamLigne>
            </Section>

            <Section titre="Paramètres financiers" icon="💰">
              <ParamLigne label="Utiliser les plans vendeur" description="À venir (add-on) : plans de collaborateurs avec leurs propres limites.">
                <Toggle actif={config.utiliser_plans_vendeur} onChange={set('utiliser_plans_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Max produits par vendeur par défaut" description="Un collaborateur ne peut pas créer plus d'annonces que cette limite (tant que les plans vendeur ne sont pas utilisés). 0 = illimité." derniere>
                <input type="number" style={{ ...inputStyle, width: '100px', textAlign: 'center' }} value={config.max_produits} onChange={e => set('max_produits')(e.target.value)} min="0" max="100000" />
              </ParamLigne>
            </Section>

            <Section titre="Inscriptions" icon="🔐">
              <ParamLigne label="Bloquer les inscriptions vendeur">
                <Toggle actif={config.bloquer_inscription_collaborateur} onChange={set('bloquer_inscription_collaborateur')} />
              </ParamLigne>
              <ParamLigne label="Bloquer les inscriptions acheteur" description="Cache le lien « Créer un compte acheteur » et refuse toute nouvelle inscription." derniere>
                <Toggle actif={config.bloquer_inscription_acheteur} onChange={set('bloquer_inscription_acheteur')} />
              </ParamLigne>
            </Section>

            <Section titre="Bannière dashboard collaborateur" icon="🏪">
              <ParamLigne label="Activer la bannière collaborateur" description="S'affiche en haut du dashboard de tous vos collaborateurs.">
                <Toggle actif={config.banniere_collab_active} onChange={set('banniere_collab_active')} />
              </ParamLigne>
              {config.banniere_collab_active && (<>
                <ParamLigne label="Message">
                  <input style={{ ...inputStyle, width: '250px' }} value={config.banniere_collab_message} onChange={e => set('banniere_collab_message')(e.target.value)} placeholder="Nouvelle fonctionnalité !" />
                </ParamLigne>
                <ParamLigne label="Fond">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_collab_couleur_bg} onChange={e => set('banniere_collab_couleur_bg')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_collab_couleur_bg} onChange={e => set('banniere_collab_couleur_bg')(e.target.value)} />
                  </div>
                </ParamLigne>
                <ParamLigne label="Texte">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_collab_couleur_tx} onChange={e => set('banniere_collab_couleur_tx')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_collab_couleur_tx} onChange={e => set('banniere_collab_couleur_tx')(e.target.value)} />
                  </div>
                </ParamLigne>
                <ParamLigne label="Hauteur (px)">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.banniere_collab_hauteur} onChange={e => set('banniere_collab_hauteur')(e.target.value)} min="20" max="120" />
                </ParamLigne>
                <ParamLigne label="Police (px)" derniere>
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.banniere_collab_police} onChange={e => set('banniere_collab_police')(e.target.value)} min="10" max="72" />
                </ParamLigne>
                <BanPreview bg={config.banniere_collab_couleur_bg} tx={config.banniere_collab_couleur_tx} hauteur={config.banniere_collab_hauteur} police={config.banniere_collab_police} message={config.banniere_collab_message} />
              </>)}
            </Section>

            <Section titre="Bannière dashboard acheteur" icon="🛍️">
              <ParamLigne label="Activer la bannière acheteur" description="S'affiche en haut du dashboard de vos acheteurs." derniere>
                <Toggle actif={config.banniere_acheteur_active} onChange={set('banniere_acheteur_active')} />
              </ParamLigne>
              {config.banniere_acheteur_active && (<>
                <ParamLigne label="Message">
                  <input style={{ ...inputStyle, width: '250px' }} value={config.banniere_acheteur_message} onChange={e => set('banniere_acheteur_message')(e.target.value)} placeholder="Message pour les acheteurs" />
                </ParamLigne>
                <ParamLigne label="Fond">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_acheteur_couleur_bg} onChange={e => set('banniere_acheteur_couleur_bg')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_acheteur_couleur_bg} onChange={e => set('banniere_acheteur_couleur_bg')(e.target.value)} />
                  </div>
                </ParamLigne>
                <ParamLigne label="Texte" derniere>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_acheteur_couleur_tx} onChange={e => set('banniere_acheteur_couleur_tx')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_acheteur_couleur_tx} onChange={e => set('banniere_acheteur_couleur_tx')(e.target.value)} />
                  </div>
                </ParamLigne>
                <BanPreview bg={config.banniere_acheteur_couleur_bg} tx={config.banniere_acheteur_couleur_tx} hauteur={config.banniere_acheteur_hauteur} police={config.banniere_acheteur_police} message={config.banniere_acheteur_message} />
              </>)}
            </Section>

            <Section titre="Réseaux sociaux" icon="📱">
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: T.textLight, lineHeight: 1.5 }}>Les réseaux remplis s'affichent en logos cliquables au centre du bas de page (ils s'ouvrent dans un nouvel onglet).</p>
              {([
                { key: 'social_facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/mapage' },
                { key: 'social_instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/moncompte' },
                { key: 'social_x', label: '🐦 X (Twitter)', placeholder: 'https://x.com/moncompte' },
                { key: 'social_linkedin', label: '💼 LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                { key: 'social_youtube', label: '▶️ YouTube', placeholder: 'https://youtube.com/@...' },
                { key: 'social_tiktok', label: '🎵 TikTok', placeholder: 'https://tiktok.com/@...' },
                { key: 'social_pinterest', label: '📌 Pinterest', placeholder: 'https://pinterest.ca/...' },
              ] as const).map((s, i, arr) => (
                <ParamLigne key={s.key} label={s.label} derniere={i === arr.length - 1}>
                  <input type="url" style={{ ...inputStyle, width: '240px' }} value={config[s.key]} onChange={e => set(s.key)(e.target.value)} placeholder={s.placeholder} />
                </ParamLigne>
              ))}
            </Section>
          </div>
        </div>
      )}

      {/* ══ CONFIG VENDEUR ══ */}
      {onglet === 'vendeur' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Inscription et gestion" icon="👤">
              <ParamLigne label="Approuver automatiquement les collaborateurs" description="Activé : le compte est actif dès l'inscription. Désactivé : le nouveau collaborateur reste « en attente » jusqu'à ce que tu l'approuves.">
                <Toggle actif={config.approuver_auto_collaborateur} onChange={set('approuver_auto_collaborateur')} />
              </ParamLigne>
              <ParamLigne label="Vérification courriel à l'inscription" description="À venir : ce réglage n'est pas encore actif.">
                <Toggle actif={config.verification_email} onChange={set('verification_email')} />
              </ParamLigne>
              <ParamLigne label="Mode vacances collaborateur" description="Les collaborateurs peuvent mettre leur boutique en pause.">
                <Toggle actif={config.vacances_vendeur} onChange={set('vacances_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Page FAQ boutique" description="À venir : ce réglage n'est pas encore actif. Futur add-on payant.">
                <Toggle actif={config.shop_faq} onChange={set('shop_faq')} />
              </ParamLigne>
              <ParamLigne label="Connexion admin en tant que collaborateur" description="À venir : ce réglage n'est pas encore actif." derniere>
                <Toggle actif={config.login_as_seller} onChange={set('login_as_seller')} />
              </ParamLigne>
            </Section>

            <Section titre="Visibilité des données (page boutique)" icon="👁️">
              <ParamLigne label="Section « Adresse, site web et réseaux sociaux »" description="Activé : le collaborateur peut remplir cette section et l'afficher dans l'onglet « + de détails » de sa boutique. Désactivé : section verrouillée.">
                <Toggle actif={config.voir_details_client} onChange={set('voir_details_client')} />
              </ParamLigne>
              <ParamLigne label="Afficher le courriel du collaborateur" description="Le courriel de son compte apparaît dans « + de détails » (s'il a activé l'affichage).">
                <Toggle actif={config.voir_email_client} onChange={set('voir_email_client')} />
              </ParamLigne>
              <ParamLigne label="Afficher le téléphone du collaborateur" description="Le téléphone de son compte apparaît dans « + de détails » (s'il a activé l'affichage)." derniere>
                <Toggle actif={config.voir_telephone_client} onChange={set('voir_telephone_client')} />
              </ParamLigne>
            </Section>

            <Section titre="Tags et catégories" icon="🏷️">
              <ParamLigne label="Permettre les tags" description="À venir : ce réglage n'est pas encore actif.">
                <Toggle actif={config.permettre_tags} onChange={set('permettre_tags')} />
              </ParamLigne>
              <ParamLigne label="Permettre les catégories" description="Désactivé : le champ catégorie disparaît à la création d'une annonce et la liste des catégories disparaît du catalogue (la recherche et les filtres restent)." derniere>
                <Toggle actif={config.permettre_categories} onChange={set('permettre_categories')} />
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Finances" icon="💰">
              <ParamLigne label="Montant minimum de commande" description="À venir : ce réglage n'est pas encore actif.">
                <Toggle actif={config.minimum_purchase_amount} onChange={set('minimum_purchase_amount')} />
              </ParamLigne>
              <ParamLigne label="Changer l'unité de poids" description="À venir : ce réglage n'est pas encore actif. (lb au lieu de kg)" derniere>
                <Toggle actif={config.permettre_changement_unite_poids} onChange={set('permettre_changement_unite_poids')} />
              </ParamLigne>
            </Section>

            <Section titre="Gestion des avis" icon="⭐">
              <ParamLigne label="Approuver automatiquement les avis" description="Activé : un avis est publié dès que l'acheteur l'envoie. Désactivé : il attend votre approbation dans Multi-vendeur → Avis (une pastille vous prévient), sauf pour les boutiques à qui vous laissez le choix ci-dessous.">
                <Toggle actif={config.approuver_auto_avis} onChange={set('approuver_auto_avis')} />
              </ParamLigne>
              <ParamLigne label="Auto-approbation gérable par collaborateur" description={config.approuver_auto_avis ? "Sans effet tant que « Approuver automatiquement les avis » est activé : tous les avis sont déjà publiés tout de suite." : "Activé : chaque collaborateur peut, dans sa Configuration, publier automatiquement les avis de sa boutique. Désactivé : tous ses avis passent par vous."}>
                <Toggle actif={config.permettre_gestion_auto_approbation_avis} onChange={set('permettre_gestion_auto_approbation_avis')} />
              </ParamLigne>
              <ParamLigne label="Délai pour laisser un avis (jours)" description="L'acheteur peut donner son avis une fois la commande livrée (ou confirmée reçue), pendant ce nombre de jours. 0 = sans limite. S'applique seulement si « Avis clients » est activé dans Généralité." derniere>
                <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_delai_avis} onChange={e => set('jours_delai_avis')(e.target.value)} min="0" max="3650" />
              </ParamLigne>
            </Section>

            <Section titre="Paramètres avancés collaborateur" icon="⚙️">
              <ParamLigne label="Notification stock faible" description="À venir : ce réglage n'est pas encore actif. Viendra avec les notifications automatiques.">
                <Toggle actif={config.notification_stock_faible} onChange={set('notification_stock_faible')} />
              </ParamLigne>
              {config.notification_stock_faible && (
                <ParamLigne label="Seuil de stock faible" derniere>
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.seuil_stock_faible} onChange={e => set('seuil_stock_faible')(e.target.value)} min="0" />
                </ParamLigne>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* ══ PRODUITS ══ */}
      {onglet === 'produits' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Gestion des produits" icon="📦">
              <ParamLigne label="Approuver automatiquement les produits" description="Activé : une annonce publiée est visible tout de suite. Désactivé : elle reste « en attente » jusqu'à ce que tu l'approuves (page Produits).">
                <Toggle actif={config.approuver_auto_produit} onChange={set('approuver_auto_produit')} />
              </ParamLigne>
              <ParamLigne label="Gérer l'inventaire" description="Désactivé : on ne gère plus le stock. Les ventes continuent même à 0 et le champ stock disparaît du formulaire d'annonce.">
                <Toggle actif={config.gerer_inventaire_par_defaut} onChange={set('gerer_inventaire_par_defaut')} />
              </ParamLigne>
              <ParamLigne label="Prix zéro autorisé" description="Activé : une annonce peut être gratuite (0 $). Désactivé : un prix supérieur à 0 est obligatoire.">
                <Toggle actif={config.prix_zero_autorise} onChange={set('prix_zero_autorise')} />
              </ParamLigne>
              <ParamLigne label="Prix minimum" description="Prix de vente minimum d'une annonce (0 = aucun minimum). Appliqué à la création et à la modification.">
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.prix_minimum} onChange={e => set('prix_minimum')(e.target.value)} min="0" step="0.01" />
              </ParamLigne>
              <ParamLigne label="Quantité minimum d'achat" description="Le collaborateur peut fixer une quantité minimum par annonce. L'acheteur est averti dans le panier et bloqué au paiement tant qu'elle n'est pas atteinte.">
                <Toggle actif={config.quantite_minimum_achat} onChange={set('quantite_minimum_achat')} />
              </ParamLigne>
              {config.quantite_minimum_achat && (
                <ParamLigne label="Application de la quantité minimum" description="Par produit : l'acheteur doit prendre au moins X unités de ce produit. Par commande : la commande doit contenir au moins X articles au total.">
                  <select style={{ ...selectStyle, width: '160px' }} value={config.application_quantite_minimum} onChange={e => set('application_quantite_minimum')(e.target.value)}>
                    <option value="produit">Par produit</option>
                    <option value="commande">Par commande</option>
                  </select>
                </ParamLigne>
              )}
              <ParamLigne label="Texte d'aide du formulaire d'annonce" description="Activé : une zone de texte apparaît ici. Ton message s'affiche en haut du formulaire « Créer une annonce » de tes collaborateurs.">
                <Toggle actif={config.texte_aide_formulaire} onChange={set('texte_aide_formulaire')} />
              </ParamLigne>
              {config.texte_aide_formulaire && (
                <ParamLigne label="Ton texte d'aide" description="Ex. : consignes pour les photos, règles de la marketplace, produits interdits… (1 000 caractères max.)">
                  <textarea style={{ ...inputStyle, width: '100%', minHeight: '90px', resize: 'vertical', boxSizing: 'border-box' }} maxLength={1000} value={config.texte_aide_produit} onChange={e => set('texte_aide_produit')(e.target.value)} placeholder="Texte affiché aux collaborateurs…" />
                </ParamLigne>
              )}
              <ParamLigne label="Prix de revient" description="Activé : le collaborateur peut entrer son prix de revient (jamais visible par les acheteurs) et voit son profit calculé dans le formulaire d'annonce.">
                <Toggle actif={config.permettre_ajout_prix_revient} onChange={set('permettre_ajout_prix_revient')} />
              </ParamLigne>
              <ParamLigne label="Support vidéo média" description="À venir : ce réglage n'est pas encore actif.">
                <Toggle actif={config.support_video_media} onChange={set('support_video_media')} />
              </ParamLigne>
              <ParamLigne label="Publication future" description="À venir : ce réglage n'est pas encore actif. Programmer la publication d'une annonce.">
                <Toggle actif={config.date_publication_future} onChange={set('date_publication_future')} />
              </ParamLigne>
              <ParamLigne label="Vente future" description="À venir : ce réglage n'est pas encore actif. Programmer la date de début de vente.">
                <Toggle actif={config.date_vente_future} onChange={set('date_vente_future')} />
              </ParamLigne>
              <ParamLigne label="Afficher les produits futurs" description="À venir : ce réglage n'est pas encore actif." derniere>
                <Toggle actif={config.afficher_produits_futurs} onChange={set('afficher_produits_futurs')} />
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Taxes et frais" icon="💰">
              <ParamLigne label="Destinataire des taxes" description="À venir : on y revient plus tard.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    { val: 'admin', label: '🏢 Admin', desc: 'Les taxes vont à la plateforme.' },
                    { val: 'vendeur', label: '🧑‍💼 Vendeur', desc: 'Les taxes sont versées au vendeur.' },
                  ] as const).map(opt => (
                    <label key={opt.val} onClick={() => set('destinataire_taxes')(opt.val)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${config.destinataire_taxes === opt.val ? T.accent : T.border}`, backgroundColor: config.destinataire_taxes === opt.val ? T.accentLight : '#f8fafc', transition: 'all 0.15s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', border: `2px solid ${config.destinataire_taxes === opt.val ? T.accent : '#9ca3af'}`, backgroundColor: config.destinataire_taxes === opt.val ? T.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {config.destinataire_taxes === opt.val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
                      </div>
                      <div><p style={{ fontSize: '12px', fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{opt.label}</p><p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
              </ParamLigne>

              <ParamLigne label="Frais de transaction" description="À venir : on y revient plus tard (à revoir avec l'onglet Commission).">
                <Toggle actif={config.frais_transaction} onChange={set('frais_transaction')} />
              </ParamLigne>
              {config.frais_transaction && (<>
                <ParamLigne label="Porteur des frais" description="À venir : on y revient plus tard.">
                  <select style={{ ...selectStyle, width: '160px' }} value={config.porteur_frais_transaction} onChange={e => set('porteur_frais_transaction')(e.target.value)}>
                    <option value="admin">Plateforme</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="acheteur">Acheteur</option>
                  </select>
                </ParamLigne>
                <ParamLigne label="Application des frais">
                  <select style={{ ...selectStyle, width: '160px' }} value={config.application_frais_transaction} onChange={e => set('application_frais_transaction')(e.target.value)}>
                    <option value="commande">Par commande</option>
                    <option value="produit">Par produit</option>
                  </select>
                </ParamLigne>
                <ParamLigne label="Pourcentage (%)">
                  <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.pourcentage_frais} onChange={e => set('pourcentage_frais')(e.target.value)} min="0" step="0.01" />
                </ParamLigne>
                <ParamLigne label="Montant fixe ($)">
                  <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.montant_fixe_frais} onChange={e => set('montant_fixe_frais')(e.target.value)} min="0" step="0.01" />
                </ParamLigne>
              </>)}

              <ParamLigne label="Arrondi des prix (décimales)" description="À venir : on y revient plus tard." derniere>
                <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.arrondi_prix} onChange={e => set('arrondi_prix')(e.target.value)} min="0" max="4" />
              </ParamLigne>
            </Section>

            <Section titre="Unités et mesures" icon="📏">
              <ParamLigne label="Unité de poids" description="À venir : pas encore actif (le poids des annonces est en kg pour l'instant).">
                <select style={{ ...selectStyle, width: '120px' }} value={config.weight_unit} onChange={e => set('weight_unit')(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Unité de dimension" description="À venir : servira au système d'étiquettes Shippo / EasyPost." derniere>
                <select style={{ ...selectStyle, width: '120px' }} value={config.dimension_unit} onChange={e => set('dimension_unit')(e.target.value)}>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                  <option value="mm">mm</option>
                </select>
              </ParamLigne>
            </Section>
          </div>
        </div>
      )}

      {/* ══ COMMANDES ══ */}
      {onglet === 'commande' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Expédition et livraison" icon="🚚">
              <ParamLigne label="Mode d'expédition obligatoire" description="Activé : le collaborateur doit choisir au moins une méthode d'expédition dans « Créer une annonce ». Désactivé : facultatif, et sans méthode choisie la livraison est gratuite.">
                <Toggle actif={config.mode_expedition_obligatoire} onChange={set('mode_expedition_obligatoire')} />
              </ParamLigne>
              <ParamLigne label="Numéro de suivi obligatoire" description="Activé : pour marquer une commande expédiée, le collaborateur doit remplir le transporteur et le numéro de suivi.">
                <Toggle actif={config.numero_suivi_obligatoire} onChange={set('numero_suivi_obligatoire')} />
              </ParamLigne>
              <ParamLigne label="Permettre les étiquettes d'expédition" description="À venir : étiquettes d'expédition (Shippo / EasyPost).">
                <Toggle actif={config.permettre_etiquette_expedition} onChange={set('permettre_etiquette_expedition')} />
              </ParamLigne>
              <ParamLigne label="Rappel d'expédition automatique" description="Un message dans la messagerie du collaborateur (et un courriel si votre serveur d'envoi est actif) lui rappelle ses commandes payées non expédiées.">
                <Toggle actif={config.rappel_expedition_auto} onChange={set('rappel_expedition_auto')} />
              </ParamLigne>
              {config.rappel_expedition_auto && (<>
                <ParamLigne label="Jours avant rappel" description="Premier rappel : nombre de jours après le paiement. Ensuite, un rappel par jour.">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_avant_rappel} onChange={e => set('jours_avant_rappel')(e.target.value)} min="1" />
                </ParamLigne>
                <ParamLigne label="Jours max rappel" description="Plus aucun rappel après ce nombre de jours depuis le paiement.">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_max_rappel} onChange={e => set('jours_max_rappel')(e.target.value)} min="1" />
                </ParamLigne>
              </>)}
              <ParamLigne label="Email d'expédition automatique" description={smtpOk === false ? "Bloqué : configurez et activez votre serveur d'envoi (SMTP) dans Modèles de courriel → Serveur d'envoi pour débloquer cette option." : "Un courriel est envoyé à l'acheteur quand la commande est expédiée (transporteur, suivi, date prévue)."}>
                <div style={smtpOk === false ? { opacity: 0.45, pointerEvents: 'none' } : undefined} title={smtpOk === false ? "Serveur d'envoi (SMTP) non configuré" : undefined}>
                  <Toggle actif={smtpOk === false ? false : config.envoyer_mail_expedition} onChange={set('envoyer_mail_expedition')} />
                </div>
              </ParamLigne>
              <ParamLigne label="Date de livraison prévue" description="Le collaborateur peut indiquer une date de livraison prévue en expédiant. À venir : l'afficher aussi à l'acheteur dans son tableau de bord.">
                <Toggle actif={config.permettre_date_livraison_prevue} onChange={set('permettre_date_livraison_prevue')} />
              </ParamLigne>
              {config.permettre_date_livraison_prevue && (
                <ParamLigne label="Date livraison obligatoire" derniere>
                  <Toggle actif={config.date_livraison_obligatoire} onChange={set('date_livraison_obligatoire')} />
                </ParamLigne>
              )}
            </Section>
          </div>

          <div>
            <Section titre="Remboursements" icon="↩️">
              <ParamLigne label="Le collaborateur peut rembourser lui-même (sans mon approbation)">
                <Toggle actif={config.remboursement_collab_autonome} onChange={set('remboursement_collab_autonome')} />
              </ParamLigne>
              <p style={{ margin: '-4px 0 10px', fontSize: 11, color: '#888', lineHeight: 1.5 }}>
                {config.remboursement_collab_autonome
                  ? 'Activé : quand un collaborateur refuse une commande ou rembourse un client, le remboursement part tout de suite.'
                  : 'Désactivé : chaque refus ou remboursement du collaborateur attend votre approbation (encadré orange en haut de la page Commandes).'}
              </p>
              <ParamLigne label="Taxes incluses dans le prix" description="Activé : les prix contiennent déjà les taxes. Le panier et le paiement les extraient du prix au lieu de les ajouter.">
                <Toggle actif={config.taxes_incluses_prix} onChange={set('taxes_incluses_prix')} />
              </ParamLigne>
              <ParamLigne label="Délai de remboursement (jours)" description="Après la livraison, l'acheteur a ce nombre de jours pour demander un retour ou un remboursement. 0 = sans limite." derniere>
                <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_remboursement} onChange={e => set('jours_remboursement')(e.target.value)} min="0" />
              </ParamLigne>
            </Section>

            <Section titre="Gestion des commandes" icon="🛒">
              <ParamLigne label="Permettre d'accepter les commandes" description="Activé : une commande payée attend que le collaborateur l'accepte. Désactivé : elle est confirmée automatiquement au paiement.">
                <Toggle actif={config.permettre_accepter_commande} onChange={set('permettre_accepter_commande')} />
              </ParamLigne>
              <ParamLigne label="Annuler commande acceptée" description="Activé : le collaborateur peut encore refuser (et rembourser) une commande déjà acceptée. Désactivé : il ne peut refuser qu'avant de l'accepter.">
                <Toggle actif={config.permettre_annuler_commande_acceptee} onChange={set('permettre_annuler_commande_acceptee')} />
              </ParamLigne>
              <ParamLigne label="Accepter et expédier en une étape" description="Ajoute le bouton « Accepter et expédier » (nécessite d'avoir activé l'acceptation des commandes).">
                <Toggle actif={config.accepter_et_expedier} onChange={set('accepter_et_expedier')} />
              </ParamLigne>
              <ParamLigne label="CC email commande" description="À venir : recevoir une copie des courriels de commande.">
                <Toggle actif={config.permettre_cc_email_commande} onChange={set('permettre_cc_email_commande')} />
              </ParamLigne>
              <ParamLigne label="Gestion du pourboire" description={{ vendeurs: "100 % du pourboire va au collaborateur.", admin: "100 % du pourboire vous est versé (retenu comme la commission, via Stripe).", split50: "Moitié au collaborateur, moitié à vous (retenue via Stripe). Le cent impair va au collaborateur.", desactive: "Aucun pourboire n'est offert à l'acheteur." }[config.gestion_pourboire] || ''}>
                <select style={{ ...selectStyle, width: '200px' }} value={config.gestion_pourboire} onChange={e => set('gestion_pourboire')(e.target.value)}>
                  <option value="vendeurs">Aux collaborateurs</option>
                  <option value="admin">À la plateforme</option>
                  <option value="split50">Partagé 50 / 50</option>
                  <option value="desactive">Désactivé</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Génération de facture" description="À venir : factures automatiques." derniere>
                <select style={{ ...selectStyle, width: '160px' }} value={config.generation_facture} onChange={e => set('generation_facture')(e.target.value)}>
                  <option value="anyTime">À tout moment</option>
                  <option value="afterPayment">Après paiement</option>
                  <option value="afterDelivery">Après livraison</option>
                </select>
              </ParamLigne>
            </Section>
          </div>
        </div>
      )}

      {/* ══ COMMISSION ══ */}
      {onglet === 'commission' && (
        <div style={{ maxWidth: '800px' }}>
          <Section titre="Commission globale" icon="💰">
            <ParamLigne label="Base de calcul">
              <select style={{ ...selectStyle, width: '200px' }} value={config.calcul_commission_base} onChange={e => set('calcul_commission_base')(e.target.value)}>
                <option value="normal">Normal (montant HT)</option>
                <option value="avec_taxes">Avec taxes</option>
                <option value="avec_expedition">Avec expédition</option>
              </select>
            </ParamLigne>
            <ParamLigne label="Type de commission globale">
              <select style={{ ...selectStyle, width: '200px' }} value={config.type_commission_globale} onChange={e => set('type_commission_globale')(e.target.value)}>
                <option value="%">Pourcentage (%)</option>
                <option value="FIXED">Fixe ($)</option>
                <option value="% + FIXED">Pourcentage + Fixe</option>
              </select>
            </ParamLigne>
            <ParamLigne label="Commission globale">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.commission_globale} onChange={e => set('commission_globale')(e.target.value)} min="0" step="0.01" />
                <span style={{ fontSize: '13px', color: T.textLight }}>{config.type_commission_globale === '%' ? '%' : '$'}</span>
              </div>
            </ParamLigne>
            {config.type_commission_globale === '% + FIXED' && (
              <ParamLigne label="Deuxième commission (fixe)">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.seconde_commission_globale} onChange={e => set('seconde_commission_globale')(e.target.value)} min="0" step="0.01" />
                  <span style={{ fontSize: '13px', color: T.textLight }}>$</span>
                </div>
              </ParamLigne>
            )}
            {config.type_commission_globale !== '%' && (
              <ParamLigne label="Commission fixe appliquée" description="Par commande : le montant fixe est prélevé une seule fois. Par article : il est multiplié par le nombre d'articles achetés (s'applique aussi aux barèmes).">
                <select style={{ ...selectStyle, width: '200px' }} value={config.commission_fixe_application} onChange={e => set('commission_fixe_application')(e.target.value)}>
                  <option value="commande">Par commande</option>
                  <option value="article">Par article acheté</option>
                </select>
              </ParamLigne>
            )}
            <ParamLigne label="Commission maximum" description="Plafond de la commission par commande.">
              <Toggle actif={config.activer_commission_max} onChange={set('activer_commission_max')} />
            </ParamLigne>
            {config.activer_commission_max && (
              <ParamLigne label="Montant maximum ($)" derniere>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.commission_max} onChange={e => set('commission_max')(e.target.value)} min="0" step="0.01" />
              </ParamLigne>
            )}
          </Section>

          <Section titre="Taxes sur ma commission" icon="🧾">
            <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 12px', lineHeight: 1.5 }}>
              Votre commission est facturée au <strong>collaborateur</strong> (jamais à l'acheteur). Si vous êtes inscrit aux taxes, vous devez normalement y ajouter la TPS/TVQ. Validez avec votre comptable.
            </p>
            <ParamLigne label="Ma commission est taxable" description="Les taxes sont ajoutées au montant prélevé au collaborateur, en plus de la commission, avec les taux de l'encadré « Taux de taxes » (onglet Généralité).">
              <Toggle actif={config.commission_taxable} onChange={set('commission_taxable')} />
            </ParamLigne>
            {config.commission_taxable && (
              <ParamLigne label="Ma province" description="Détermine les taxes appliquées à la commission.">
                <select style={{ ...selectStyle, width: '200px' }} value={config.commission_province} onChange={e => set('commission_province')(e.target.value)}>
                  {['QC', 'ON', 'NB', 'NS', 'NL', 'PE', 'BC', 'SK', 'MB', 'AB', 'NT', 'NU', 'YT'].map(pv => <option key={pv} value={pv}>{pv}</option>)}
                </select>
              </ParamLigne>
            )}
          </Section>

          <Section titre="Barèmes de commission" icon="📊">
            <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 16px', lineHeight: 1.6 }}>
              Définissez des taux de commission différents selon le montant de la commande. Les barèmes sont prioritaires sur la commission globale. Les montants Min/Max suivent la base de calcul choisie plus haut ; si aucun barème ne correspond à la commande, la commission globale s'applique.
            </p>
            {config.baremes_commission.map((bareme, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: bareme.type === '% + FIXED' ? '1fr 1fr 1fr 1fr 1fr auto' : '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                <div>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>Min ($)</p>
                  <input type="number" style={{ ...inputStyle }} value={bareme.min} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], min: e.target.value }; set('baremes_commission')(b); }} placeholder="0" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>Max ($)</p>
                  <input type="number" style={{ ...inputStyle }} value={bareme.max} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], max: e.target.value }; set('baremes_commission')(b); }} placeholder="9999" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>Type</p>
                  <select style={selectStyle} value={bareme.type} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], type: e.target.value }; set('baremes_commission')(b); }}>
                    <option value="%">%</option>
                    <option value="FIXED">Fixe</option>
                    <option value="% + FIXED">% + Fixe</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>{bareme.type === 'FIXED' ? 'Montant ($)' : bareme.type === '% + FIXED' ? 'Taux (%)' : 'Taux (%)'}</p>
                  <input type="number" style={{ ...inputStyle }} value={bareme.premiereCommission} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], premiereCommission: e.target.value }; set('baremes_commission')(b); }} placeholder="10" />
                </div>
                {bareme.type === '% + FIXED' && (
                  <div>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>Fixe ($)</p>
                    <input type="number" min="0" step="0.01" style={{ ...inputStyle }} value={bareme.secondeCommission ?? ''} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], secondeCommission: e.target.value }; set('baremes_commission')(b); }} placeholder="0.30" />
                  </div>
                )}
                <button onClick={() => set('baremes_commission')(config.baremes_commission.filter((_, i) => i !== idx))} style={{ padding: '6px 10px', background: '#fff', border: `1px solid ${T.danger}`, borderRadius: '8px', color: T.danger, cursor: 'pointer', fontSize: '14px', marginTop: '18px' }}>🗑</button>
              </div>
            ))}
            {problemesBaremes(config.baremes_commission).length > 0 && (
              <div style={{ background: '#FEF5E7', color: '#B9770E', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', lineHeight: 1.6 }}>
                {problemesBaremes(config.baremes_commission).map((m, i) => <div key={i}>⚠️ {m}</div>)}
              </div>
            )}
            <button onClick={() => set('baremes_commission')([...config.baremes_commission, { min: '', max: '', type: '% + FIXED', premiereCommission: '', secondeCommission: '' }])} style={{ padding: '9px 18px', background: T.accentLight, border: `1px dashed ${T.accent}`, borderRadius: '8px', color: T.accent, fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              ＋ Ajouter un barème
            </button>
          </Section>
        </div>
      )}

      {/* ══ ENCHÈRES ══ */}
      {onglet === 'encheres' && (
        <div style={{ maxWidth: '700px' }}>
          <Section titre="Enchères sur votre marketplace" icon="🔨">
            <ParamLigne label="Activer les enchères" description="Permet à vos collaborateurs de convertir une annonce en enchère. Les enchères en cours continuent si vous désactivez.">
              <Toggle actif={config.encheres_actives} onChange={set('encheres_actives')} />
            </ParamLigne>
            <ParamLigne label="Durée minimale" description="Durée la plus courte permise pour une enchère.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.enchere_duree_min_h} onChange={e => set('enchere_duree_min_h')(e.target.value)} min="1" max="720" step="1" />
                <span style={{ fontSize: '13px', color: T.textLight }}>heure(s)</span>
              </div>
            </ParamLigne>
            <ParamLigne label="Durée maximale" description="Durée la plus longue permise pour une enchère.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.enchere_duree_max_jours} onChange={e => set('enchere_duree_max_jours')(e.target.value)} min="1" max="60" step="1" />
                <span style={{ fontSize: '13px', color: T.textLight }}>jour(s)</span>
              </div>
            </ParamLigne>
            <ParamLigne label="Mise minimale d'augmentation" description="Montant minimum dont une mise doit dépasser la mise actuelle.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.enchere_increment_min} onChange={e => set('enchere_increment_min')(e.target.value)} min="0.01" step="0.01" />
                <span style={{ fontSize: '13px', color: T.textLight }}>$</span>
              </div>
            </ParamLigne>
            <ParamLigne label="Permettre un prix de réserve" description="Le collaborateur peut fixer un prix minimum caché : sous ce prix, l'enchère se termine sans gagnant.">
              <Toggle actif={config.enchere_reserve_permise} onChange={set('enchere_reserve_permise')} />
            </ParamLigne>
            <ParamLigne label="Délai de paiement du gagnant" description="Temps accordé au gagnant pour payer dans son panier. Maximum 24 h (la session de paiement Stripe expire après 24 h). Passé ce délai, l'enchère est annulée et le produit est remis en vente.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.enchere_delai_paiement_h} onChange={e => set('enchere_delai_paiement_h')(e.target.value)} min="1" max="24" step="1" />
                <span style={{ fontSize: '13px', color: T.textLight }}>heure(s) (max 24)</span>
              </div>
            </ParamLigne>
            <ParamLigne label="Enchères actives par collaborateur" description="Limite d'enchères en cours en même temps pour un collaborateur. 0 = aucune limite." derniere>
              <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.enchere_max_par_collab} onChange={e => set('enchere_max_par_collab')(e.target.value)} min="0" max="500" step="1" />
            </ParamLigne>
          </Section>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: T.textLight, lineHeight: 1.6 }}>
            ℹ️ Une enchère réserve 1 unité du produit ; les autres unités restent en vente normale. Les enchères ne sont pas offertes sur les produits à variantes. Les courriels d'enchère se modifient dans « Modèles de courriel ». N'oubliez pas de cliquer sur « Sauvegarder ».
          </div>
        </div>
      )}

      {/* ══ CONFIG STRIPE CONNECT ══ */}
      {onglet === 'stripe' && <StripeGestionnaire gestionnaireId={gestionnaireId} />}

      {/* ══ AVANCÉ ══ */}
      {onglet === 'avance' && (
        <div style={{ maxWidth: '700px' }}>
          <Section titre="Traduction et localisation" icon="🌐">
            <ParamLigne label="Traduction automatique (Google)" description="À venir : traduction automatique du contenu (pas encore active)." derniere={!config.google_translation}>
              <Toggle actif={config.google_translation} onChange={set('google_translation')} />
            </ParamLigne>
            {config.google_translation && (
              <ParamLigne label="Panneau de traduction" description="À venir : qui voit le panneau de traduction." derniere>
                <select style={{ ...selectStyle, width: '200px' }} value={config.translation_panel} onChange={e => set('translation_panel')(e.target.value)}>
                  <option value="both">Collaborateur et Admin</option>
                  <option value="admin">Admin seulement</option>
                  <option value="seller">Collaborateur seulement</option>
                </select>
              </ParamLigne>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}