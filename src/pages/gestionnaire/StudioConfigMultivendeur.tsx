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
  bloquer_inscription_vendeur: boolean; bloquer_inscription_acheteur: boolean;
  mode_maintenance: boolean; message_maintenance: string;
  banniere_vendeur_active: boolean; banniere_vendeur_message: string;
  banniere_vendeur_couleur_bg: string; banniere_vendeur_couleur_tx: string;
  banniere_vendeur_hauteur: string; banniere_vendeur_police: string;
  banniere_acheteur_active: boolean; banniere_acheteur_message: string;
  banniere_acheteur_couleur_bg: string; banniere_acheteur_couleur_tx: string;
  banniere_acheteur_hauteur: string; banniere_acheteur_police: string;
  social_facebook: string; social_instagram: string; social_x: string;
  social_linkedin: string; social_youtube: string; social_tiktok: string;
  social_pinterest: string;
  // Config vendeur
  permettre_expedition: boolean; approuver_auto_vendeur: boolean;
  voir_details_client: boolean; voir_email_client: boolean; voir_telephone_client: boolean;
  permettre_tags: boolean; restreindre_tags_inscription: boolean;
  permettre_categories: boolean; restreindre_categories_inscription: boolean;
  permettre_devise_propre: boolean; methode_conversion: string;
  permettre_changement_unite_poids: boolean;
  restreindre_desactivation_avis: boolean; approuver_auto_avis: boolean;
  permettre_gestion_auto_approbation_avis: boolean; avis_avance: boolean;
  sso_actif: boolean; voir_total_du: boolean;
  notification_stock_faible: boolean; seuil_stock_faible: string;
  vacances_vendeur: boolean; vendeur_sur_boutique: boolean;
  verification_email: boolean; permettre_nom_boutique_inscription: boolean;
  option_inscription: string; shop_faq: boolean; c2c_marketplace: boolean;
  login_as_seller: boolean; check_customer_login: boolean;
  check_customer_purchase: boolean; minimum_purchase_amount: boolean;
  // Config produits
  approuver_auto_produit: boolean; gerer_inventaire_par_defaut: boolean;
  quantite_minimum_achat: boolean; application_quantite_minimum: string;
  prix_zero_autorise: boolean; texte_aide_formulaire: boolean;
  delais_livraison: boolean; cacher_champ_tags: boolean;
  support_video_media: boolean; permettre_ajout_prix_revient: boolean;
  afficher_nom_marque: boolean; type_prix_libre: boolean;
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
  mode_taxe: 'libre' | 'force_taxable' | 'force_non_taxable';
  destinataire_taxes: 'admin' | 'vendeur';
  // Config commande
  mode_expedition_obligatoire: boolean; numero_suivi_obligatoire: boolean;
  statut_preparation_commande: boolean; heures_preparation: string;
  taxes_incluses_prix: boolean; deduire_expedition_remboursement: boolean;
  deduire_taxes_remboursement: boolean; taxes_sur_expedition: boolean;
  permettre_etiquette_expedition: boolean; jours_remboursement: string;
  permettre_accepter_commande: boolean; annuler_auto_rejet: boolean;
  permettre_annuler_commande_acceptee: boolean; accepter_et_expedier: boolean;
  envoyer_mail_expedition: boolean; permettre_date_livraison_prevue: boolean;
  date_livraison_obligatoire: boolean; gestion_pourboire: string;
  permettre_cc_email_commande: boolean; rappel_expedition_auto: boolean;
  jours_avant_rappel: string; jours_max_rappel: string;
  tcs_sur_commandes: boolean; tds_sur_commandes: boolean;
  restreindre_expedition_fraude: boolean; generation_facture: string;
  permettre_infos_supplementaires: boolean;
  // Avancé
  google_translation: boolean; translation_panel: string; rtl_alignment: boolean;
  // Commission
  calcul_commission_base: string; type_commission_globale: string;
  commission_globale: string; seconde_commission_globale: string;
  type_commission_fixe: string; activer_commission_max: boolean;
  commission_max: string; baremes_commission: CommissionSlab[];
}

const DEFAUTS: ConfigMV = {
  nom_marketplace: '', email_contact: '', store_email: '', contact_number: '',
  devise: 'CAD', langue: 'fr', fuseau_horaire: 'America/Toronto',
  date_format: 'DD-MMM-YYYY', footer_text: 'Copyright ($annee) Tous droits réservés',
  stripe_actif: true, avis_actifs: true, notifs_auto_vendeurs: true,
  utiliser_plans_vendeur: false, max_produits: '50',
  bloquer_inscription_vendeur: false, bloquer_inscription_acheteur: false,
  mode_maintenance: false, message_maintenance: '',
  banniere_vendeur_active: false, banniere_vendeur_message: '',
  banniere_vendeur_couleur_bg: '#1e3a5f', banniere_vendeur_couleur_tx: '#ffffff',
  banniere_vendeur_hauteur: '36', banniere_vendeur_police: '13',
  banniere_acheteur_active: false, banniere_acheteur_message: '',
  banniere_acheteur_couleur_bg: '#1e3a5f', banniere_acheteur_couleur_tx: '#ffffff',
  banniere_acheteur_hauteur: '36', banniere_acheteur_police: '13',
  social_facebook: '', social_instagram: '', social_x: '',
  social_linkedin: '', social_youtube: '', social_tiktok: '', social_pinterest: '',
  permettre_expedition: true, approuver_auto_vendeur: true,
  voir_details_client: true, voir_email_client: false, voir_telephone_client: false,
  permettre_tags: true, restreindre_tags_inscription: false,
  permettre_categories: true, restreindre_categories_inscription: false,
  permettre_devise_propre: false, methode_conversion: 'automatique',
  permettre_changement_unite_poids: false, restreindre_desactivation_avis: false,
  approuver_auto_avis: true, permettre_gestion_auto_approbation_avis: false,
  avis_avance: false, sso_actif: false, voir_total_du: true,
  notification_stock_faible: false, seuil_stock_faible: '5',
  vacances_vendeur: false, vendeur_sur_boutique: false,
  verification_email: true, permettre_nom_boutique_inscription: true,
  option_inscription: 'ouvert', shop_faq: false, c2c_marketplace: false,
  login_as_seller: false, check_customer_login: false,
  check_customer_purchase: false, minimum_purchase_amount: false,
  approuver_auto_produit: true, gerer_inventaire_par_defaut: true,
  quantite_minimum_achat: false, application_quantite_minimum: 'produit',
  prix_zero_autorise: false, texte_aide_formulaire: false,
  delais_livraison: false, cacher_champ_tags: false,
  support_video_media: false, permettre_ajout_prix_revient: false,
  afficher_nom_marque: false, type_prix_libre: false, prix_minimum: '0',
  date_publication_future: false, date_vente_future: false,
  afficher_produits_futurs: false, liste_produits_desactives_mail: false,
  restreindre_caracteres_speciaux: false, frais_transaction: false,
  type_frais_transaction: 'normal', porteur_frais_transaction: 'admin',
  application_frais_transaction: 'commande', pourcentage_frais: '2.90',
  montant_fixe_frais: '0.30', texte_alternatif_media: true, prix_solde: false,
  arrondi_prix: '2', frais_manutention: false, weight_unit: 'kg',
  dimension_unit: 'cm', sauvegarder_brouillon: false,
  mode_taxe: 'libre', destinataire_taxes: 'admin',
  mode_expedition_obligatoire: false, numero_suivi_obligatoire: false,
  statut_preparation_commande: false, heures_preparation: '0',
  taxes_incluses_prix: false, deduire_expedition_remboursement: false,
  deduire_taxes_remboursement: false, taxes_sur_expedition: false,
  permettre_etiquette_expedition: false, jours_remboursement: '14',
  permettre_accepter_commande: true, annuler_auto_rejet: false,
  permettre_annuler_commande_acceptee: false, accepter_et_expedier: false,
  envoyer_mail_expedition: true, permettre_date_livraison_prevue: false,
  date_livraison_obligatoire: false, gestion_pourboire: 'vendeurs',
  permettre_cc_email_commande: false, rappel_expedition_auto: false,
  jours_avant_rappel: '2', jours_max_rappel: '30',
  tcs_sur_commandes: false, tds_sur_commandes: false,
  restreindre_expedition_fraude: false, generation_facture: 'anyTime',
  permettre_infos_supplementaires: false,
  google_translation: false, translation_panel: 'both', rtl_alignment: false,
  calcul_commission_base: 'normal', type_commission_globale: '%',
  commission_globale: '10.00', seconde_commission_globale: '0.00',
  type_commission_fixe: 'produit', activer_commission_max: false,
  commission_max: '0.00', baremes_commission: [],
};

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioConfigMultivendeur({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const [siteId, setSiteId]     = useState<number | null>(null);
  const [config, setConfig]     = useState<ConfigMV>(DEFAUTS);
  const [original, setOriginal] = useState<ConfigMV>(DEFAUTS);
  const [loading, setLoading]   = useState(true);
  const [onglet, setOnglet]     = useState<'generalite' | 'vendeur' | 'produits' | 'commande' | 'commission' | 'avance'>('generalite');
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);
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
      const mv = data.config?.multivendeur ?? {};
      const cfg = { ...DEFAUTS, ...mv };
      setConfig(cfg); setOriginal({ ...cfg });
    } catch { /* garder défauts */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    if (!siteId) return;
    try {
      const res = await fetch(`${API_BASE}/studio/sites/${siteId}/config`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ multivendeur: config }),
      });
      if (!res.ok) throw new Error();
      setOriginal({ ...config }); setModifie(false);
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {modifie && <button onClick={() => { setConfig({ ...original }); setModifie(false); }} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>}
          <button onClick={sauvegarder} disabled={!modifie} style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: `2px solid ${T.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'generalite',  label: '🌍 Généralité' },
          { id: 'vendeur',     label: '👤 Config vendeur' },
          { id: 'produits',    label: '📦 Produits' },
          { id: 'commande',    label: '🛒 Commandes' },
          { id: 'commission',  label: '💰 Commission' },
          { id: 'avance',      label: '⚙️ Avancé' },
        ].map(o => <Onglet key={o.id} label={o.label} actif={onglet === o.id as any} onClick={() => setOnglet(o.id as any)} />)}
      </div>

      {/* ══ GÉNÉRALITÉ ══ */}
      {onglet === 'generalite' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Informations marketplace" icon="🌍">
              <ParamLigne label="Nom de votre marketplace" description="Affiché dans l'interface et les emails.">
                <input style={{ ...inputStyle, width: '220px' }} value={config.nom_marketplace} onChange={e => set('nom_marketplace')(e.target.value)} placeholder="Ma Marketplace" />
              </ParamLigne>
              <ParamLigne label="Email de contact" description="Email principal de la marketplace.">
                <input style={{ ...inputStyle, width: '220px' }} type="email" value={config.email_contact} onChange={e => set('email_contact')(e.target.value)} placeholder="contact@mamarketplace.ca" />
              </ParamLigne>
              <ParamLigne label="Email de la boutique" description="Expéditeur des emails transactionnels.">
                <input style={{ ...inputStyle, width: '220px' }} type="email" value={config.store_email} onChange={e => set('store_email')(e.target.value)} placeholder="noreply@mamarketplace.ca" />
              </ParamLigne>
              <ParamLigne label="Numéro de téléphone">
                <input style={{ ...inputStyle, width: '180px' }} value={config.contact_number} onChange={e => set('contact_number')(e.target.value)} placeholder="514 555-1234" />
              </ParamLigne>
              <ParamLigne label="Devise">
                <select style={{ ...selectStyle, width: '160px' }} value={config.devise} onChange={e => set('devise')(e.target.value)}>
                  <option value="CAD">🇨🇦 CAD ($)</option>
                  <option value="USD">🇺🇸 USD ($)</option>
                  <option value="EUR">🇪🇺 EUR (€)</option>
                  <option value="GBP">🇬🇧 GBP (£)</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Langue">
                <select style={{ ...selectStyle, width: '160px' }} value={config.langue} onChange={e => set('langue')(e.target.value)}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Fuseau horaire">
                <select style={{ ...selectStyle, width: '220px' }} value={config.fuseau_horaire} onChange={e => set('fuseau_horaire')(e.target.value)}>
                  <option value="America/Toronto">EST — Toronto / Montréal</option>
                  <option value="America/Vancouver">PST — Vancouver</option>
                  <option value="America/Winnipeg">CST — Winnipeg</option>
                  <option value="America/Halifax">AST — Halifax</option>
                  <option value="America/New_York">EST — New York</option>
                  <option value="Europe/Paris">CET — Paris</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Texte du footer" derniere>
                <input style={{ ...inputStyle, width: '220px' }} value={config.footer_text} onChange={e => set('footer_text')(e.target.value)} placeholder="Copyright ($annee)…" />
              </ParamLigne>
            </Section>

            <Section titre="Méthode de paiement" icon="💳">
              <ParamLigne label="Stripe Connect" description="Paiements et virements vendeurs via Stripe." derniere>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: config.stripe_actif ? '#635bff' : T.textLight }}>{config.stripe_actif ? '⚡ Actif' : '— Inactif'}</span>
                  <Toggle actif={config.stripe_actif} onChange={() => toggleCritique(config.stripe_actif, v => set('stripe_actif')(v), 'Désactiver Stripe Connect', 'Les vendeurs ne recevront plus de virements Stripe. Confirmez-vous ?')} />
                </div>
              </ParamLigne>
            </Section>

            <Section titre="Fonctionnalités" icon="⭐">
              <ParamLigne label="Avis clients">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: config.avis_actifs ? T.success : T.textLight }}>{config.avis_actifs ? '✓ Actif' : '— Inactif'}</span>
                  <Toggle actif={config.avis_actifs} onChange={set('avis_actifs')} />
                </div>
              </ParamLigne>
              <ParamLigne label="Notifications automatiques vendeurs" description="Emails aux vendeurs pour les nouvelles commandes.">
                <Toggle actif={config.notifs_auto_vendeurs} onChange={set('notifs_auto_vendeurs')} />
              </ParamLigne>
              <ParamLigne label="Marketplace C2C" description="Permet aux acheteurs de devenir vendeurs." derniere>
                <Toggle actif={config.c2c_marketplace} onChange={set('c2c_marketplace')} />
              </ParamLigne>
            </Section>

            <Section titre="Mode maintenance" icon="🛠️" danger={config.mode_maintenance}>
              <ParamLigne label="Activer le mode maintenance">
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
            <Section titre="Paramètres financiers" icon="💰">
              <ParamLigne label="Utiliser les plans vendeur" description="Les commissions sont gérées par les plans vendeur.">
                <Toggle actif={config.utiliser_plans_vendeur} onChange={set('utiliser_plans_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Max produits par vendeur par défaut" derniere>
                <input type="number" style={{ ...inputStyle, width: '100px', textAlign: 'center' }} value={config.max_produits} onChange={e => set('max_produits')(e.target.value)} min="1" max="9999" />
              </ParamLigne>
            </Section>

            <Section titre="Inscriptions" icon="🔐">
              <ParamLigne label="Bloquer les inscriptions vendeur">
                <Toggle actif={config.bloquer_inscription_vendeur} onChange={set('bloquer_inscription_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Bloquer les inscriptions acheteur" derniere>
                <Toggle actif={config.bloquer_inscription_acheteur} onChange={set('bloquer_inscription_acheteur')} />
              </ParamLigne>
            </Section>

            <Section titre="Bannière dashboard vendeur" icon="🏪">
              <ParamLigne label="Activer la bannière vendeur">
                <Toggle actif={config.banniere_vendeur_active} onChange={set('banniere_vendeur_active')} />
              </ParamLigne>
              {config.banniere_vendeur_active && (<>
                <ParamLigne label="Message">
                  <input style={{ ...inputStyle, width: '250px' }} value={config.banniere_vendeur_message} onChange={e => set('banniere_vendeur_message')(e.target.value)} placeholder="Nouvelle fonctionnalité !" />
                </ParamLigne>
                <ParamLigne label="Fond">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_vendeur_couleur_bg} onChange={e => set('banniere_vendeur_couleur_bg')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_vendeur_couleur_bg} onChange={e => set('banniere_vendeur_couleur_bg')(e.target.value)} />
                  </div>
                </ParamLigne>
                <ParamLigne label="Texte">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={config.banniere_vendeur_couleur_tx} onChange={e => set('banniere_vendeur_couleur_tx')(e.target.value)} style={{ width: '36px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, width: '90px', fontFamily: 'monospace' }} value={config.banniere_vendeur_couleur_tx} onChange={e => set('banniere_vendeur_couleur_tx')(e.target.value)} />
                  </div>
                </ParamLigne>
                <ParamLigne label="Hauteur (px)">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.banniere_vendeur_hauteur} onChange={e => set('banniere_vendeur_hauteur')(e.target.value)} min="20" max="120" />
                </ParamLigne>
                <ParamLigne label="Police (px)" derniere>
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.banniere_vendeur_police} onChange={e => set('banniere_vendeur_police')(e.target.value)} min="10" max="72" />
                </ParamLigne>
                <BanPreview bg={config.banniere_vendeur_couleur_bg} tx={config.banniere_vendeur_couleur_tx} hauteur={config.banniere_vendeur_hauteur} police={config.banniere_vendeur_police} message={config.banniere_vendeur_message} />
              </>)}
            </Section>

            <Section titre="Bannière dashboard acheteur" icon="🛍️">
              <ParamLigne label="Activer la bannière acheteur" derniere>
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
              <ParamLigne label="Option d'inscription des vendeurs">
                <select style={{ ...selectStyle, width: '200px' }} value={config.option_inscription} onChange={e => set('option_inscription')(e.target.value)}>
                  <option value="ouvert">🔓 Ouverte à tous</option>
                  <option value="invitation">📨 Sur invitation</option>
                  <option value="bloque">🔒 Bloquée</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Approuver automatiquement les vendeurs" description="Sinon, validation manuelle requise.">
                <Toggle actif={config.approuver_auto_vendeur} onChange={set('approuver_auto_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Vérification email à l'inscription">
                <Toggle actif={config.verification_email} onChange={set('verification_email')} />
              </ParamLigne>
              <ParamLigne label="Nom de boutique à l'inscription" description="Exiger un nom de boutique lors de l'inscription.">
                <Toggle actif={config.permettre_nom_boutique_inscription} onChange={set('permettre_nom_boutique_inscription')} />
              </ParamLigne>
              <ParamLigne label="Mode vacances vendeur" description="Les vendeurs peuvent mettre leur boutique en pause.">
                <Toggle actif={config.vacances_vendeur} onChange={set('vacances_vendeur')} />
              </ParamLigne>
              <ParamLigne label="Vendeur sur la boutique" description="Les vendeurs ont une page boutique publique.">
                <Toggle actif={config.vendeur_sur_boutique} onChange={set('vendeur_sur_boutique')} />
              </ParamLigne>
              <ParamLigne label="Page FAQ boutique" description="Chaque vendeur peut créer une FAQ sur sa boutique.">
                <Toggle actif={config.shop_faq} onChange={set('shop_faq')} />
              </ParamLigne>
              <ParamLigne label="Connexion admin en tant que vendeur" description="Permet à l'admin de se connecter en tant que vendeur." derniere>
                <Toggle actif={config.login_as_seller} onChange={set('login_as_seller')} />
              </ParamLigne>
            </Section>

            <Section titre="Visibilité des données clients" icon="👁️">
              <ParamLigne label="Voir les détails clients">
                <Toggle actif={config.voir_details_client} onChange={set('voir_details_client')} />
              </ParamLigne>
              <ParamLigne label="Voir l'email des clients">
                <Toggle actif={config.voir_email_client} onChange={set('voir_email_client')} />
              </ParamLigne>
              <ParamLigne label="Voir le téléphone des clients" derniere>
                <Toggle actif={config.voir_telephone_client} onChange={set('voir_telephone_client')} />
              </ParamLigne>
            </Section>

            <Section titre="Tags et catégories" icon="🏷️">
              <ParamLigne label="Permettre les tags">
                <Toggle actif={config.permettre_tags} onChange={set('permettre_tags')} />
              </ParamLigne>
              <ParamLigne label="Restreindre tags à l'inscription">
                <Toggle actif={config.restreindre_tags_inscription} onChange={set('restreindre_tags_inscription')} />
              </ParamLigne>
              <ParamLigne label="Permettre les catégories">
                <Toggle actif={config.permettre_categories} onChange={set('permettre_categories')} />
              </ParamLigne>
              <ParamLigne label="Restreindre catégories à l'inscription" derniere>
                <Toggle actif={config.restreindre_categories_inscription} onChange={set('restreindre_categories_inscription')} />
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Devises et finances" icon="💱">
              <ParamLigne label="Devise propre par vendeur">
                <Toggle actif={config.permettre_devise_propre} onChange={set('permettre_devise_propre')} />
              </ParamLigne>
              {config.permettre_devise_propre && (
                <ParamLigne label="Méthode de conversion">
                  <select style={{ ...selectStyle, width: '200px' }} value={config.methode_conversion} onChange={e => set('methode_conversion')(e.target.value)}>
                    <option value="automatique">Conversion automatique</option>
                    <option value="manuelle">Conversion manuelle</option>
                  </select>
                </ParamLigne>
              )}
              <ParamLigne label="Voir le total dû (gains)" description="Affiche les gains sur le dashboard vendeur.">
                <Toggle actif={config.voir_total_du} onChange={set('voir_total_du')} />
              </ParamLigne>
              <ParamLigne label="Montant minimum de commande">
                <Toggle actif={config.minimum_purchase_amount} onChange={set('minimum_purchase_amount')} />
              </ParamLigne>
              <ParamLigne label="Changer l'unité de poids" derniere>
                <Toggle actif={config.permettre_changement_unite_poids} onChange={set('permettre_changement_unite_poids')} />
              </ParamLigne>
            </Section>

            <Section titre="Gestion des avis" icon="⭐">
              <ParamLigne label="Approuver automatiquement les avis">
                <Toggle actif={config.approuver_auto_avis} onChange={set('approuver_auto_avis')} />
              </ParamLigne>
              <ParamLigne label="Restreindre la désactivation des avis">
                <Toggle actif={config.restreindre_desactivation_avis} onChange={set('restreindre_desactivation_avis')} />
              </ParamLigne>
              <ParamLigne label="Auto-approbation gérable par vendeur">
                <Toggle actif={config.permettre_gestion_auto_approbation_avis} onChange={set('permettre_gestion_auto_approbation_avis')} />
              </ParamLigne>
              <ParamLigne label="Avis avancé">
                <Toggle actif={config.avis_avance} onChange={set('avis_avance')} />
              </ParamLigne>
              <ParamLigne label="Exiger connexion pour avis">
                <Toggle actif={config.check_customer_login} onChange={set('check_customer_login')} />
              </ParamLigne>
              <ParamLigne label="Exiger achat avant avis" derniere>
                <Toggle actif={config.check_customer_purchase} onChange={set('check_customer_purchase')} />
              </ParamLigne>
            </Section>

            <Section titre="Paramètres avancés vendeur" icon="⚙️">
              <ParamLigne label="SSO pour vendeurs" description="Authentification unique (Single Sign-On).">
                <Toggle actif={config.sso_actif} onChange={set('sso_actif')} />
              </ParamLigne>
              <ParamLigne label="Notification stock faible">
                <Toggle actif={config.notification_stock_faible} onChange={set('notification_stock_faible')} />
              </ParamLigne>
              {config.notification_stock_faible && (
                <ParamLigne label="Seuil de stock faible">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.seuil_stock_faible} onChange={e => set('seuil_stock_faible')(e.target.value)} min="0" />
                </ParamLigne>
              )}
              <ParamLigne label="Permettre expédition" derniere>
                <Toggle actif={config.permettre_expedition} onChange={set('permettre_expedition')} />
              </ParamLigne>
            </Section>
          </div>
        </div>
      )}

      {/* ══ PRODUITS ══ */}
      {onglet === 'produits' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Section titre="Gestion des produits" icon="📦">
              <ParamLigne label="Approuver automatiquement les produits">
                <Toggle actif={config.approuver_auto_produit} onChange={set('approuver_auto_produit')} />
              </ParamLigne>
              <ParamLigne label="Gérer l'inventaire par défaut">
                <Toggle actif={config.gerer_inventaire_par_defaut} onChange={set('gerer_inventaire_par_defaut')} />
              </ParamLigne>
              <ParamLigne label="Prix zéro autorisé">
                <Toggle actif={config.prix_zero_autorise} onChange={set('prix_zero_autorise')} />
              </ParamLigne>
              <ParamLigne label="Type de prix libre" description="Les vendeurs peuvent fixer un type de prix libre.">
                <Toggle actif={config.type_prix_libre} onChange={set('type_prix_libre')} />
              </ParamLigne>
              {config.type_prix_libre && (
                <ParamLigne label="Prix minimum">
                  <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.prix_minimum} onChange={e => set('prix_minimum')(e.target.value)} min="0" />
                </ParamLigne>
              )}
              <ParamLigne label="Quantité minimum d'achat">
                <Toggle actif={config.quantite_minimum_achat} onChange={set('quantite_minimum_achat')} />
              </ParamLigne>
              {config.quantite_minimum_achat && (
                <ParamLigne label="Application quantité minimum">
                  <select style={{ ...selectStyle, width: '160px' }} value={config.application_quantite_minimum} onChange={e => set('application_quantite_minimum')(e.target.value)}>
                    <option value="produit">Par produit</option>
                    <option value="commande">Par commande</option>
                  </select>
                </ParamLigne>
              )}
              <ParamLigne label="Texte d'aide formulaire produit">
                <Toggle actif={config.texte_aide_formulaire} onChange={set('texte_aide_formulaire')} />
              </ParamLigne>
              <ParamLigne label="Délais de livraison">
                <Toggle actif={config.delais_livraison} onChange={set('delais_livraison')} />
              </ParamLigne>
              <ParamLigne label="Cacher le champ tags">
                <Toggle actif={config.cacher_champ_tags} onChange={set('cacher_champ_tags')} />
              </ParamLigne>
              <ParamLigne label="Support vidéo media">
                <Toggle actif={config.support_video_media} onChange={set('support_video_media')} />
              </ParamLigne>
              <ParamLigne label="Ajouter le prix de revient">
                <Toggle actif={config.permettre_ajout_prix_revient} onChange={set('permettre_ajout_prix_revient')} />
              </ParamLigne>
              <ParamLigne label="Afficher le nom de marque">
                <Toggle actif={config.afficher_nom_marque} onChange={set('afficher_nom_marque')} />
              </ParamLigne>
              <ParamLigne label="Publication future" description="Programmer la publication d'un produit.">
                <Toggle actif={config.date_publication_future} onChange={set('date_publication_future')} />
              </ParamLigne>
              <ParamLigne label="Vente future" description="Programmer la date de début de vente.">
                <Toggle actif={config.date_vente_future} onChange={set('date_vente_future')} />
              </ParamLigne>
              <ParamLigne label="Afficher les produits futurs" derniere>
                <Toggle actif={config.afficher_produits_futurs} onChange={set('afficher_produits_futurs')} />
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Taxes et frais" icon="💰">
              <ParamLigne label="Mode de taxation">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    { val: 'libre', label: '🔓 Libre — le vendeur choisit', desc: 'La checkbox est visible et modifiable.' },
                    { val: 'force_taxable', label: '✅ Forcer taxable', desc: 'Checkbox cochée et verrouillée.' },
                    { val: 'force_non_taxable', label: '🚫 Forcer non-taxable', desc: 'Checkbox désactivée.' },
                  ] as const).map(opt => (
                    <label key={opt.val} onClick={() => set('mode_taxe')(opt.val)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${config.mode_taxe === opt.val ? T.accent : T.border}`, backgroundColor: config.mode_taxe === opt.val ? T.accentLight : '#f8fafc', transition: 'all 0.15s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', border: `2px solid ${config.mode_taxe === opt.val ? T.accent : '#9ca3af'}`, backgroundColor: config.mode_taxe === opt.val ? T.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {config.mode_taxe === opt.val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
                      </div>
                      <div><p style={{ fontSize: '12px', fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{opt.label}</p><p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
              </ParamLigne>

              <ParamLigne label="Destinataire des taxes">
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

              <ParamLigne label="Frais de transaction" description="Ajouter des frais sur chaque transaction.">
                <Toggle actif={config.frais_transaction} onChange={set('frais_transaction')} />
              </ParamLigne>
              {config.frais_transaction && (<>
                <ParamLigne label="Porteur des frais">
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

              <ParamLigne label="Arrondi des prix (décimales)" derniere>
                <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.arrondi_prix} onChange={e => set('arrondi_prix')(e.target.value)} min="0" max="4" />
              </ParamLigne>
            </Section>

            <Section titre="Unités et mesures" icon="📏">
              <ParamLigne label="Unité de poids">
                <select style={{ ...selectStyle, width: '120px' }} value={config.weight_unit} onChange={e => set('weight_unit')(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Unité de dimension" derniere>
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
              <ParamLigne label="Mode d'expédition obligatoire">
                <Toggle actif={config.mode_expedition_obligatoire} onChange={set('mode_expedition_obligatoire')} />
              </ParamLigne>
              <ParamLigne label="Numéro de suivi obligatoire">
                <Toggle actif={config.numero_suivi_obligatoire} onChange={set('numero_suivi_obligatoire')} />
              </ParamLigne>
              <ParamLigne label="Statut de préparation commande">
                <Toggle actif={config.statut_preparation_commande} onChange={set('statut_preparation_commande')} />
              </ParamLigne>
              {config.statut_preparation_commande && (
                <ParamLigne label="Heures de préparation">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.heures_preparation} onChange={e => set('heures_preparation')(e.target.value)} min="0" />
                </ParamLigne>
              )}
              <ParamLigne label="Permettre les étiquettes d'expédition">
                <Toggle actif={config.permettre_etiquette_expedition} onChange={set('permettre_etiquette_expedition')} />
              </ParamLigne>
              <ParamLigne label="Rappel d'expédition automatique">
                <Toggle actif={config.rappel_expedition_auto} onChange={set('rappel_expedition_auto')} />
              </ParamLigne>
              {config.rappel_expedition_auto && (<>
                <ParamLigne label="Jours avant rappel">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_avant_rappel} onChange={e => set('jours_avant_rappel')(e.target.value)} min="1" />
                </ParamLigne>
                <ParamLigne label="Jours max rappel">
                  <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_max_rappel} onChange={e => set('jours_max_rappel')(e.target.value)} min="1" />
                </ParamLigne>
              </>)}
              <ParamLigne label="Email d'expédition automatique">
                <Toggle actif={config.envoyer_mail_expedition} onChange={set('envoyer_mail_expedition')} />
              </ParamLigne>
              <ParamLigne label="Date de livraison prévue">
                <Toggle actif={config.permettre_date_livraison_prevue} onChange={set('permettre_date_livraison_prevue')} />
              </ParamLigne>
              {config.permettre_date_livraison_prevue && (
                <ParamLigne label="Date livraison obligatoire">
                  <Toggle actif={config.date_livraison_obligatoire} onChange={set('date_livraison_obligatoire')} />
                </ParamLigne>
              )}
              <ParamLigne label="Restreindre expédition (fraude)" derniere>
                <Toggle actif={config.restreindre_expedition_fraude} onChange={set('restreindre_expedition_fraude')} />
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Remboursements" icon="↩️">
              <ParamLigne label="Taxes incluses dans le prix">
                <Toggle actif={config.taxes_incluses_prix} onChange={set('taxes_incluses_prix')} />
              </ParamLigne>
              <ParamLigne label="Déduire expédition du remboursement">
                <Toggle actif={config.deduire_expedition_remboursement} onChange={set('deduire_expedition_remboursement')} />
              </ParamLigne>
              <ParamLigne label="Déduire taxes du remboursement">
                <Toggle actif={config.deduire_taxes_remboursement} onChange={set('deduire_taxes_remboursement')} />
              </ParamLigne>
              <ParamLigne label="Taxes sur l'expédition">
                <Toggle actif={config.taxes_sur_expedition} onChange={set('taxes_sur_expedition')} />
              </ParamLigne>
              <ParamLigne label="Délai de remboursement (jours)" derniere>
                <input type="number" style={{ ...inputStyle, width: '80px' }} value={config.jours_remboursement} onChange={e => set('jours_remboursement')(e.target.value)} min="0" />
              </ParamLigne>
            </Section>

            <Section titre="Gestion des commandes" icon="🛒">
              <ParamLigne label="Permettre d'accepter les commandes">
                <Toggle actif={config.permettre_accepter_commande} onChange={set('permettre_accepter_commande')} />
              </ParamLigne>
              <ParamLigne label="Annulation auto si rejet">
                <Toggle actif={config.annuler_auto_rejet} onChange={set('annuler_auto_rejet')} />
              </ParamLigne>
              <ParamLigne label="Annuler commande acceptée">
                <Toggle actif={config.permettre_annuler_commande_acceptee} onChange={set('permettre_annuler_commande_acceptee')} />
              </ParamLigne>
              <ParamLigne label="Accepter et expédier en une étape">
                <Toggle actif={config.accepter_et_expedier} onChange={set('accepter_et_expedier')} />
              </ParamLigne>
              <ParamLigne label="CC email commande">
                <Toggle actif={config.permettre_cc_email_commande} onChange={set('permettre_cc_email_commande')} />
              </ParamLigne>
              <ParamLigne label="Gestion du pourboire">
                <select style={{ ...selectStyle, width: '160px' }} value={config.gestion_pourboire} onChange={e => set('gestion_pourboire')(e.target.value)}>
                  <option value="vendeurs">Aux vendeurs</option>
                  <option value="admin">À la plateforme</option>
                  <option value="desactive">Désactivé</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Génération de facture">
                <select style={{ ...selectStyle, width: '160px' }} value={config.generation_facture} onChange={e => set('generation_facture')(e.target.value)}>
                  <option value="anyTime">À tout moment</option>
                  <option value="afterPayment">Après paiement</option>
                  <option value="afterDelivery">Après livraison</option>
                </select>
              </ParamLigne>
              <ParamLigne label="TCS sur commandes">
                <Toggle actif={config.tcs_sur_commandes} onChange={set('tcs_sur_commandes')} />
              </ParamLigne>
              <ParamLigne label="TDS sur commandes" derniere>
                <Toggle actif={config.tds_sur_commandes} onChange={set('tds_sur_commandes')} />
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
            <ParamLigne label="Commission maximum" description="Plafond de la commission par commande.">
              <Toggle actif={config.activer_commission_max} onChange={set('activer_commission_max')} />
            </ParamLigne>
            {config.activer_commission_max && (
              <ParamLigne label="Montant maximum ($)" derniere>
                <input type="number" style={{ ...inputStyle, width: '100px' }} value={config.commission_max} onChange={e => set('commission_max')(e.target.value)} min="0" step="0.01" />
              </ParamLigne>
            )}
          </Section>

          <Section titre="Barèmes de commission" icon="📊">
            <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 16px', lineHeight: 1.6 }}>
              Définissez des taux de commission différents selon le montant de la commande. Les barèmes sont prioritaires sur la commission globale.
            </p>
            {config.baremes_commission.map((bareme, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: `1px solid ${T.border}` }}>
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
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', fontWeight: 600 }}>Taux</p>
                  <input type="number" style={{ ...inputStyle }} value={bareme.premiereCommission} onChange={e => { const b = [...config.baremes_commission]; b[idx] = { ...b[idx], premiereCommission: e.target.value }; set('baremes_commission')(b); }} placeholder="10" />
                </div>
                <button onClick={() => set('baremes_commission')(config.baremes_commission.filter((_, i) => i !== idx))} style={{ padding: '6px 10px', background: '#fff', border: `1px solid ${T.danger}`, borderRadius: '8px', color: T.danger, cursor: 'pointer', fontSize: '14px', marginTop: '18px' }}>🗑</button>
              </div>
            ))}
            <button onClick={() => set('baremes_commission')([...config.baremes_commission, { min: '', max: '', type: '% + FIXED', premiereCommission: '', secondeCommission: '' }])} style={{ padding: '9px 18px', background: T.accentLight, border: `1px dashed ${T.accent}`, borderRadius: '8px', color: T.accent, fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              ＋ Ajouter un barème
            </button>
          </Section>
        </div>
      )}

      {/* ══ AVANCÉ ══ */}
      {onglet === 'avance' && (
        <div style={{ maxWidth: '700px' }}>
          <Section titre="Traduction et localisation" icon="🌐">
            <ParamLigne label="Traduction automatique (Google)" description="Active la traduction automatique du contenu.">
              <Toggle actif={config.google_translation} onChange={set('google_translation')} />
            </ParamLigne>
            {config.google_translation && (
              <ParamLigne label="Panneau de traduction">
                <select style={{ ...selectStyle, width: '200px' }} value={config.translation_panel} onChange={e => set('translation_panel')(e.target.value)}>
                  <option value="both">Vendeur et Admin</option>
                  <option value="admin">Admin seulement</option>
                  <option value="seller">Vendeur seulement</option>
                </select>
              </ParamLigne>
            )}
            <ParamLigne label="Alignement RTL" description="Pour les langues qui s'écrivent de droite à gauche (arabe, hébreu)." derniere>
              <Toggle actif={config.rtl_alignment} onChange={set('rtl_alignment')} />
            </ParamLigne>
          </Section>
        </div>
      )}
    </div>
  );
}