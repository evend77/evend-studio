// src/templates/shared/Checkout.tsx
// e-Vend Studio — Checkout acheteur — partagé tous templates transactionnels

import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── TYPES ────────────────────────────────────────────────────────────────

interface Article {
  id: number;
  titre: string;
  image_url: string;
  prix: number;
  quantite: number;
  vendeur_nom: string;
  facturation_taxes?: boolean;  // ✅ AJOUTÉ pour les taxes par produit
  produit_numerique?: boolean;  // ✅ AJOUTÉ pour détecter les produits numériques
}

interface Vendeur {
  id: number;
  nom: string;
  nom_boutique?: string;
  ville: string;
  stripe_actif: boolean;
  paypal_actif: boolean;
  stripe_compte_id: string | null;
  paypal_email: string | null;
}

interface Adresse {
  id: number;
  prenom: string;
  nom: string;
  adresse: string;
  ville: string;
  province: string;
  code_postal: string;
  pays: string;
  telephone?: string;
  par_defaut?: boolean;
}

interface Acheteur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

interface TaxesCalc {
  sous_total: number;
  frais_expedition: number;
  tps: string;
  tvq: string;
  tvh: string;
  total_taxes: string;
  pourboire: number;
  total: string;
  label_taxe: string;
  province: string;
}

interface CheckoutProps {
  naviguer: (page: string, props?: any) => void;
  vendeurId?: number;
  gestionnaireId?: number;
  config?: Record<string, any>;
}

const PROVINCES = [
  { code: 'AB', nom: 'Alberta' },
  { code: 'BC', nom: 'Colombie-Britannique' },
  { code: 'MB', nom: 'Manitoba' },
  { code: 'NB', nom: 'Nouveau-Brunswick' },
  { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
  { code: 'NS', nom: 'Nouvelle-Écosse' },
  { code: 'ON', nom: 'Ontario' },
  { code: 'PE', nom: 'Île-du-Prince-Édouard' },
  { code: 'QC', nom: 'Québec' },
  { code: 'SK', nom: 'Saskatchewan' },
  { code: 'NT', nom: 'Territoires du Nord-Ouest' },
  { code: 'NU', nom: 'Nunavut' },
  { code: 'YT', nom: 'Yukon' },
];

interface MethodeExpedition {
  id: number;
  transporteur_id: number;
  nom: string;
  logo: string;
  mode_calcul: string;
  frais_fixes: number;
  frais_par_kg: number;
  gratuit_superieur: number | null;
  delais_estime: string;
  combine_shipping: boolean;
  frais_zones: Record<string, string | null> | null;
  // Calculé par le backend selon province + articles
  frais_calcule: number;
  detail_calcul: string;
  gratuit_applique: boolean;
  non_disponible: boolean;
  gratuit: boolean;
  ramassage: boolean;
}

// Noms des transporteurs (fallback si le backend ne les envoie pas)
const TRANSPORTEURS_NOMS: Record<number, { nom: string; logo: string }> = {
  1:  { nom: 'Canada Post / Postes Canada', logo: '📮' },
  2:  { nom: 'Purolator',                   logo: '🚚' },
  3:  { nom: 'FedEx Canada',                logo: '✈️' },
  4:  { nom: 'UPS Canada',                  logo: '📦' },
  5:  { nom: 'Intelcom Courrier',            logo: '📬' },
  6:  { nom: 'DHL Express Canada',           logo: '🌍' },
  7:  { nom: 'GLS Canada',                  logo: '🚛' },
  8:  { nom: 'CanPar',                      logo: '🇨🇦' },
  9:  { nom: 'Loomis Express',              logo: '📦' },
  10: { nom: 'Transport A. Bélanger',        logo: '🚚' },
  11: { nom: 'Groupe Robert',               logo: '🏭' },
  12: { nom: 'Livraison locale',            logo: '🛵' },
  13: { nom: 'Ramassage sur place',          logo: '🏪' },
  14: { nom: 'Livraison gratuite',           logo: '🎁' },
};

// ─── PALETTE — identique au panier ────────────────────────────────────────
const C = {
  bg: '#1a1714',
  bgLight: '#f3f0eb',
  card: '#24201c',
  cardHover: '#2c2820',
  border: '#3d3528',
  borderAccent: '#b47828',
  borderLight: '#2e2820',
  accent: '#b47828',
  accentLight: '#d4a853',
  accentGlow: 'rgba(180,120,40,0.18)',
  text: '#f5efe6',
  textSub: '#c9b99a',
  textMuted: '#8a7a65',
  success: '#4ade80',
  successBg: 'rgba(74,222,128,0.08)',
  successBorder: 'rgba(74,222,128,0.25)',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,0.08)',
  dangerBorder: 'rgba(248,113,113,0.25)',
  warning: '#fbbf24',
  warningBg: 'rgba(251,191,36,0.08)',
  warningBorder: 'rgba(251,191,36,0.25)',
  stripe: '#6772e5',
  paypal: '#003087',
  gold: '#d4a853',
};

// ─── ÉTAPES ───────────────────────────────────────────────────────────────
const ETAPES = ['Livraison', 'Vérification', 'Paiement'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ✅ Helper: récupère le token frais à chaque appel
function getToken(gid: number): string | null {
  return localStorage.getItem(`mv_token_${gid}`);
}

export default function Checkout({ naviguer, vendeurId, gestionnaireId = 0, config = {} }: CheckoutProps) {
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const isMobile = useIsMobile();
  const [articles, setArticles]     = useState<Article[]>([]);
  const [tousNumeriques, setTousNumeriques] = useState(false);
  const [panierMixte, setPanierMixte] = useState(false);
  const [vendeur, setVendeur]       = useState<Vendeur | null>(null);
  const [acheteur, setAcheteur]     = useState<Acheteur | null>(null);
  const [adresses, setAdresses]     = useState<Adresse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [erreur, setErreur]         = useState<string | null>(null);
  const [paiementBloque, setPaiementBloque] = useState(false);

  const [adresseLivraison, setAdresseLivraison] = useState<Adresse | null>(null);
  const [adresseFacturation, setAdresseFacturation] = useState<Adresse | null>(null);
  const [memeAdresse, setMemeAdresse]     = useState(true);
  const [modifierLivraison, setModifierLivraison] = useState(false);
  const [modifierFacturation, setModifierFacturation] = useState(false);

  const [formAdresse, setFormAdresse] = useState({
    prenom: '', nom: '', adresse: '', ville: '', province: 'QC', code_postal: '', pays: 'Canada', telephone: '',
  });

  const [expedition, setExpedition] = useState<number | null>(null); // ID de la méthode sélectionnée
  const [methodesExpedition, setMethodesExpedition] = useState<MethodeExpedition[]>([]);
  const [pourboire, setPourboire] = useState(0);
  const [pourboireCustom, setPourboireCustom] = useState('');
  const [modePaiement, setModePaiement] = useState<'stripe' | 'paypal' | null>(null);
  const [taxes, setTaxes] = useState<TaxesCalc | null>(null);
  const [taxesLoading, setTaxesLoading] = useState(false);
  const [soumission, setSoumission] = useState(false);
  const [etapeActive, setEtapeActive] = useState(0);

  // Note pour le vendeur
  const [noteVendeur, setNoteVendeur] = useState('');

  // Code promo
  const [codePromoInput, setCodePromoInput] = useState('');
  const [codePromoLoading, setCodePromoLoading] = useState(false);
  const [codePromoErreur, setCodePromoErreur] = useState<string | null>(null);
  const [codePromoInfo, setCodePromoInfo] = useState<{ code: string; rabais: string; reduction_id: number } | null>(null);

  // ✅ FIX 1: vId calculé une seule fois, stable
  const vId = vendeurId || parseInt(localStorage.getItem('checkout_vendeur_id') || '0');

  useEffect(() => { if (vId) fetchInfos(); }, [vId]);

  useEffect(() => {
    if (adresseLivraison) {
      recalculerExpedition(adresseLivraison.province);
      calculerTaxes();
    }
  }, [adresseLivraison, pourboire]);

  useEffect(() => {
    if (adresseLivraison && expedition !== null) calculerTaxes();
  }, [expedition]);

  useEffect(() => {
    if (vendeur) {
      if (vendeur.stripe_actif) setModePaiement('stripe');
      else if (vendeur.paypal_actif) setModePaiement('paypal');
      else setModePaiement(null);
    }
  }, [vendeur]);

  // ✅ FIX 1: token lu DANS la fonction, pas à la racine du composant
  async function fetchInfos() {
    const token = getToken(gestionnaireId);
    if (!token) {
      naviguer('login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/checkout/infos?collaborateur_id=${vId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      // ✅ Si 401/403, rediriger vers connexion plutôt qu'afficher une erreur cryptique
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        naviguer('login');
        return;
      }
      if (!res.ok) throw new Error('Impossible de charger le checkout');
      const data = await res.json();
      setArticles(data.articles || []);
      setTousNumeriques(data.tous_numeriques || false);
      setPanierMixte(data.panier_mixte || false);
      // Charger les méthodes d'expédition
      const methodes = (data.methodes_expedition || []).map((m: any) => ({
        ...m,
        nom: m.nom || TRANSPORTEURS_NOMS[m.transporteur_id]?.nom || 'Expédition',
        logo: m.logo || TRANSPORTEURS_NOMS[m.transporteur_id]?.logo || '📦',
      }));
      setMethodesExpedition(methodes);
      // ✅ Sélectionner automatiquement la 1ère méthode (souvent free shipping)
      if (methodes.length > 0) setExpedition(methodes[0].id);
      const vendeurData = data.vendeur || null;
      setVendeur(vendeurData);
      setAcheteur(data.acheteur || null);
      setAdresses(data.adresses || []);

      if (vendeurData && !vendeurData.stripe_actif && !vendeurData.paypal_actif) {
        setPaiementBloque(true);
      }

      const defaut = data.adresses?.find((a: Adresse) => a.par_defaut) || data.adresses?.[0] || null;
      if (defaut) {
        setAdresseLivraison(defaut);
        setAdresseFacturation(defaut);
      } else if (data.acheteur) {
        setFormAdresse(f => ({ ...f, prenom: data.acheteur.prenom || '', nom: data.acheteur.nom || '' }));
        setModifierLivraison(true);
      }
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Recalcule les frais d'expédition selon la province (appelle le backend)
  async function recalculerExpedition(province: string) {
    const token = getToken(gestionnaireId);
    if (!token || !vId) return;
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/checkout/infos?collaborateur_id=${vId}&province=${province}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const methodes = (data.methodes_expedition || []).map((m: any) => ({
        ...m,
        nom: m.nom || TRANSPORTEURS_NOMS[m.transporteur_id]?.nom || 'Expédition',
        logo: m.logo || TRANSPORTEURS_NOMS[m.transporteur_id]?.logo || '📦',
      }));
      setMethodesExpedition(methodes);
      // Garder la méthode sélectionnée si elle existe encore, sinon prendre la première
      if (methodes.length > 0) {
        const existeEncore = methodes.find((m: MethodeExpedition) => m.id === expedition);
        if (!existeEncore) setExpedition(methodes[0].id);
      }
    } catch {}
  }

  // ✅ FIX 1: token lu dans la fonction + retourne les taxes calculées
  // ✅ FIX 2: envoi des articles avec facturation_taxes au backend
  async function calculerTaxes(
    adr?: Adresse | null,
    exp?: number,
    tip?: number
  ): Promise<TaxesCalc | null> {
    const token = getToken(gestionnaireId);
    if (!token) return null;

    const adresseUtilisee = adr ?? adresseLivraison;
    const expeditionUtilisee = exp ?? expedition;
    const pourboireUtilise = tip ?? pourboire;

    if (!adresseUtilisee) return null;

    const province = adresseUtilisee.province || 'QC';
    const methodeSelectionnee = methodesExpedition.find(m => m.id === expeditionUtilisee);
    // Utiliser frais_calcule (calculé par backend selon mode+province) au lieu de frais_fixes brut
    const frais = methodeSelectionnee ? (methodeSelectionnee.frais_calcule ?? methodeSelectionnee.frais_fixes ?? 0) : 0;
    const sousTotal = articles.reduce((s, a) => s + parseFloat(String(a.prix)) * a.quantite, 0);

    // ✅ Préparer les articles avec leur statut de taxe pour le backend
    const articlesAvecTaxe = articles.map(a => ({
      id: a.id,
      prix: a.prix,
      quantite: a.quantite,
      facturation_taxes: a.facturation_taxes || false
    }));

    setTaxesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/checkout/taxes`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sous_total: sousTotal, 
          frais_expedition: frais, 
          province, 
          pourboire: pourboireUtilise,
          articles: articlesAvecTaxe  // ✅ AJOUTÉ
        }),
      });
      if (!res.ok) return null;
      const data: TaxesCalc = await res.json();
      setTaxes(data);
      return data;
    } catch {
      return null;
    } finally {
      setTaxesLoading(false);
    }
  }

  // ✅ FIX 2: token lu dans la fonction + guard sur taxes + calcul à la volée si manquant
  async function validerPaiement() {
    const token = getToken(gestionnaireId);
    if (!token) {
      naviguer('login');
      return;
    }
    if (!modePaiement) return;
    if (!tousNumeriques && !adresseLivraison) return;

    setErreur(null);
    setSoumission(true);

    try {
      // Taxes indicatives seulement — Stripe recalcule au vrai paiement côté vendeur.
      const sousTotal = articles.reduce((s, a) => s + parseFloat(String(a.prix)) * a.quantite, 0);
      const methodeSelectionnee = methodesExpedition.find(m => m.id === expedition);
      const frais = tousNumeriques ? 0 : (methodeSelectionnee ? (methodeSelectionnee.frais_calcule ?? methodeSelectionnee.frais_fixes ?? 0) : 0);
      const rabais = codePromoInfo ? parseFloat(codePromoInfo.rabais) : 0;
      const totalFinal = taxes
        ? parseFloat((parseFloat(taxes.total) - rabais).toFixed(2))
        : parseFloat((sousTotal - rabais + frais + pourboire).toFixed(2));

      if (!totalFinal || totalFinal <= 0) {
        setErreur('Total invalide. Veuillez vérifier votre commande.');
        setSoumission(false);
        return;
      }

      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/checkout/commande`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendeur_id: vId,
          mode_paiement: modePaiement,
          infos_livraison: tousNumeriques ? (adresseLivraison || {}) : adresseLivraison,
          infos_facturation: memeAdresse ? adresseLivraison : adresseFacturation,
          frais_expedition: frais,
          methode_expedition_id: expedition,
          pourboire,
          taxes: taxes ? taxes.total_taxes : '0',
          total: totalFinal,
          code_promo: codePromoInfo?.code || null,
          reduction_id: codePromoInfo?.reduction_id || null,
          rabais_code_promo: codePromoInfo ? parseFloat(codePromoInfo.rabais) : 0,
          note_acheteur: noteVendeur.trim() || null,
        }),
      });

      // ✅ Si 401/403 pendant le paiement, rediriger
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        naviguer('login');
        return;
      }

      const data = await res.json();
      if (res.ok && data.stripe_url && modePaiement === 'stripe') {
        window.location.href = data.stripe_url;
      } else if (res.ok) {
        naviguer('commande-confirmee', { commande_id: data.commande_id });
      } else {
        throw new Error(data.error || 'Erreur lors du paiement');
      }
    } catch (e: any) {
      setErreur(e.message);
      setSoumission(false);
    }
  }

  async function appliquerCodePromo() {
    const code = codePromoInput.trim().toUpperCase();
    if (!code) return;
    setCodePromoLoading(true);
    setCodePromoErreur(null);
    setCodePromoInfo(null);
    try {
      const montant = articles.reduce((sum, a) => sum + parseFloat(String(a.prix)) * a.quantite, 0);
      const annonceId = articles.length === 1 ? articles[0].id : '';
      const url = `${API_BASE}/make-offer/valider-code?code=${encodeURIComponent(code)}&montant_panier=${montant}${annonceId ? `&annonce_id=${annonceId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCodePromoInfo({ code: data.code, rabais: data.rabais, reduction_id: data.reduction_id });
        setCodePromoErreur(null);
      } else {
        setCodePromoErreur(data.message || 'Code invalide.');
      }
    } catch {
      setCodePromoErreur('Erreur de connexion. Veuillez r\u00e9essayer.');
    } finally {
      setCodePromoLoading(false);
    }
  }

  function retirerCodePromo() {
    setCodePromoInput('');
    setCodePromoInfo(null);
    setCodePromoErreur(null);
  }

  const sousTotal = articles.reduce((s, a) => s + parseFloat(String(a.prix)) * a.quantite, 0);
  const methodeExpeditionSelectionnee = methodesExpedition.find(m => m.id === expedition);
  const fraisExp = methodeExpeditionSelectionnee
    ? (methodeExpeditionSelectionnee.frais_calcule ?? methodeExpeditionSelectionnee.frais_fixes ?? 0)
    : 0;
  const rabaisCode = codePromoInfo ? parseFloat(codePromoInfo.rabais) : 0;
  const sousTotalApresRabais = Math.max(0, sousTotal - rabaisCode);
  const aucunPaiement = vendeur && !vendeur.stripe_actif && !vendeur.paypal_actif;
  // Les taxes sont indicatives seulement — Stripe les recalcule côté vendeur
  // Produit numérique : l'adresse de livraison n'est pas obligatoire
  const peutPayer = modePaiement !== null && !aucunPaiement
    && (tousNumeriques || adresseLivraison !== null)
    && (tousNumeriques || methodesExpedition.length === 0 || expedition !== null);

  // ─── POPUP PAIEMENT BLOQUÉ ────────────────────────────────────────────
  if (paiementBloque && vendeur) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px',
      }}>
        <div style={{
          background: '#24201c',
          border: '1px solid rgba(248,113,113,0.4)',
          borderRadius: '20px',
          padding: '48px 40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(248,113,113,0.12)',
            border: '2px solid rgba(248,113,113,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 20px',
          }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f5efe6', margin: '0 0 12px' }}>
            Paiement temporairement indisponible
          </h2>
          <p style={{ fontSize: '14px', color: '#c9b99a', lineHeight: 1.7, margin: '0 0 8px' }}>
           La boutique de <strong style={{ color: '#f5efe6' }}>{vendeur.nom_boutique || vendeur.nom}</strong> ne peut
            pas recevoir de paiements pour le moment.
          </p>
          <p style={{ fontSize: '13px', color: '#8a7a65', lineHeight: 1.6, margin: '0 0 32px' }}>
            Le vendeur n'a pas encore configuré son compte Stripe ou PayPal.
            Vous pouvez contacter le vendeur via la messagerie ou réessayer plus tard.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              style={{
                padding: '14px', background: 'linear-gradient(135deg, #d4a853, #b47828)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 800, cursor: 'pointer',
              }}
              onClick={() => naviguer('messagerie')}
            >
              💬 Contacter le vendeur
            </button>
            <button
              style={{
                padding: '14px', background: 'transparent',
                color: '#c9b99a', border: '1px solid #3d3528',
                borderRadius: '12px', fontSize: '14px', cursor: 'pointer',
              }}
              onClick={() => naviguer('panier')}
            >
              ← Retour au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={s.spinner} />
        <span style={{ color: C.textMuted, fontSize: '14px', letterSpacing: '0.03em' }}>Chargement du paiement...</span>
      </div>
    </div>
  );

  if (erreur && !articles.length) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', padding: '60px', color: C.danger }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</p>
        <p style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px', color: C.danger }}>{erreur}</p>
        <button style={s.btnSecondaire} onClick={() => naviguer('panier')}>← Retour au panier</button>
      </div>
    </div>
  );

  // ─── RENDU PRINCIPAL ─────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{CSS}</style>

      {/* ── EN-TÊTE ── */}
      <div style={{ ...s.header, padding: isMobile ? '12px 16px' : '14px 32px' }}>
        <button style={s.btnRetour} onClick={() => naviguer('panier')}>
          ← Panier
        </button>
        <h1 style={s.headerTitre}>Paiement</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.textMuted }}>
          <span style={{ color: C.success, fontSize: '13px' }}>🔒</span>
          <span>Connexion sécurisée</span>
        </div>
      </div>

      {/* ── BARRE DE PROGRESSION ── */}
      <div style={{ ...s.progressBar, padding: isMobile ? '10px 16px' : '12px 32px', gap: isMobile ? '4px' : '6px', overflowX: 'auto' as const }}>
        {ETAPES.map((e, i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: i <= etapeActive ? `linear-gradient(135deg, ${C.accentLight}, ${C.accent})` : C.card,
              border: `2px solid ${i <= etapeActive ? C.accent : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800,
              color: i <= etapeActive ? '#fff' : C.textMuted,
              transition: 'all 0.3s',
              boxShadow: i === etapeActive ? `0 0 10px ${C.accentGlow}` : 'none',
            }}>
              {i < etapeActive ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '13px', fontWeight: i === etapeActive ? 700 : 400, color: i <= etapeActive ? C.text : C.textMuted }}>
              {e}
            </span>
            {i < ETAPES.length - 1 && (
              <div style={{ width: '40px', height: '2px', background: i < etapeActive ? C.accent : C.border, borderRadius: '2px', margin: '0 4px', transition: 'all 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Erreur non fatale */}
      {erreur && articles.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 0', padding: '0 20px' }}>
          <div style={{ ...s.alerte, ...s.alerteDanger }}>
            <span>⚠️</span>
            <span>{erreur}</span>
          </div>
        </div>
      )}

      {/* ── LAYOUT 2 COLONNES ── */}
      <div style={{ ...s.layout, gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined, padding: isMobile ? '12px' : '24px 20px' }}>

        {/* ══ COLONNE GAUCHE ══════════════════════════════════════════════ */}
        <div style={s.colGauche}>

          {/* ── 1. VENDEUR SÉLECTIONNÉ ── */}
          {vendeur && (
            <div style={s.vendeurBanner}>
              <div style={s.vendeurAvatar}>
                {(vendeur.nom_boutique || vendeur.nom).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '11px', color: C.textMuted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vous achetez auprès de</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>{vendeur.nom_boutique || vendeur.nom}</p>
                {vendeur.ville && <p style={{ fontSize: '12px', color: C.textMuted, margin: '2px 0 0' }}>📍 {vendeur.ville}</p>}
              </div>
              <div style={s.vendeurBadge}>✓ Vendeur vérifié</div>
            </div>
          )}

          {/* ── 2. ARTICLES ── */}
          <Section titre="Articles commandés" icone="📦" numero={1}>
            {tousNumeriques && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}>📲</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80', margin: '0 0 2px' }}>Produit numérique</p>
                  <p style={{ fontSize: '12px', color: '#c9b99a', margin: 0 }}>Vous recevrez votre fichier dans votre espace acheteur après confirmation du paiement. Aucune expédition requise.</p>
                </div>
              </div>
            )}
            {panierMixte && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}>📦</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', margin: '0 0 2px' }}>Commande mixte</p>
                  <p style={{ fontSize: '12px', color: '#c9b99a', margin: 0, lineHeight: 1.5 }}>
                    Votre commande contient des produits physiques et numériques.
                    Les frais d'expédition s'appliquent uniquement aux articles physiques.
                    Les produits numériques vous seront livrés électroniquement après paiement.
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {articles.map((article, idx) => (
                <div key={article.id} style={{
                  ...s.articleRow,
                  borderBottom: idx < articles.length - 1 ? `1px solid ${C.border}` : 'none',
                  paddingBottom: idx < articles.length - 1 ? '14px' : 0,
                }}>
                  <div style={s.articleImgWrap}>
                    {article.image_url ? (
                      <img src={article.image_url} alt={article.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: C.border, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📦</div>
                    )}
                    <div style={s.qteBadge}>{article.quantite}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.articleTitre}>{article.titre}</p>
                    {article.produit_numerique && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', padding: '1px 7px', borderRadius: '20px', marginBottom: '4px', display: 'inline-block' }}>📲 Numérique</span>
                    )}
                    <p style={s.articleVendeur}>Vendu par {vendeur?.nom_boutique || vendeur?.nom}</p>
                    <p style={s.articlePrixUnit}>{parseFloat(String(article.prix)).toFixed(2)} $ / unité</p>
                  </div>
                  <p style={s.articleTotal}>{(parseFloat(String(article.prix)) * article.quantite).toFixed(2)} $</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. ADRESSE DE LIVRAISON ── */}
          <Section titre="Adresse de livraison" icone="📍" numero={2}>
            {adresses.length > 0 && !modifierLivraison ? (
              <div>
                {adresses.map(adr => (
                  <AdresseCard
                    key={adr.id}
                    adr={adr}
                    selecte={adresseLivraison?.id === adr.id}
                    onClick={() => {
                      setAdresseLivraison(adr);
                      if (memeAdresse) setAdresseFacturation(adr);
                    }}
                  />
                ))}
                <button style={s.btnLien} onClick={() => setModifierLivraison(true)}>
                  + Utiliser une autre adresse
                </button>
              </div>
            ) : (
              <FormulaireAdresse
                form={formAdresse}
                onChange={setFormAdresse}
                onValider={(adr) => {
                  const nouvelleAdr = { ...adr, id: Date.now() } as Adresse;
                  setAdresseLivraison(nouvelleAdr);
                  if (memeAdresse) setAdresseFacturation(nouvelleAdr);
                  setModifierLivraison(false);
                }}
                onAnnuler={adresses.length > 0 ? () => setModifierLivraison(false) : undefined}
              />
            )}
          </Section>

          {/* ── 4. ADRESSE DE FACTURATION ── */}
          <Section titre="Adresse de facturation" icone="📄" numero={3}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <RadioOption
                actif={memeAdresse}
                label="Identique à l'adresse de livraison"
                onClick={() => setMemeAdresse(true)}
              />
              <RadioOption
                actif={!memeAdresse}
                label="Utiliser une adresse de facturation différente"
                onClick={() => setMemeAdresse(false)}
              />
            </div>
            {!memeAdresse && (
              <div style={{ marginTop: '16px' }}>
                {adresses.length > 0 && !modifierFacturation ? (
                  <div>
                    {adresses.map(adr => (
                      <AdresseCard
                        key={adr.id}
                        adr={adr}
                        selecte={adresseFacturation?.id === adr.id}
                        onClick={() => setAdresseFacturation(adr)}
                      />
                    ))}
                    <button style={s.btnLien} onClick={() => setModifierFacturation(true)}>
                      + Autre adresse de facturation
                    </button>
                  </div>
                ) : (
                  <FormulaireAdresse
                    form={formAdresse}
                    onChange={setFormAdresse}
                    onValider={(adr) => {
                      setAdresseFacturation({ ...adr, id: Date.now() } as Adresse);
                      setModifierFacturation(false);
                    }}
                    onAnnuler={adresses.length > 0 ? () => setModifierFacturation(false) : undefined}
                  />
                )}
              </div>
            )}
          </Section>

          {/* ── 5. EXPÉDITION ── */}
          {tousNumeriques ? (
            <Section titre="Livraison" icone="📲" numero={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px' }}>
                <span style={{ fontSize: '28px' }}>📲</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80', margin: '0 0 3px' }}>Livraison électronique — Gratuit</p>
                  <p style={{ fontSize: '12px', color: '#c9b99a', margin: 0, lineHeight: 1.5 }}>Votre produit numérique sera disponible dans votre espace acheteur et envoyé par courriel dès que le paiement sera confirmé.</p>
                </div>
              </div>
            </Section>
          ) : (
          <Section titre="Mode d'expédition" icone="🚚" numero={4}>
            {!adresseLivraison ? (
              <div style={s.infoBandeau}>
                <span>ℹ️</span>
                <span style={{ fontSize: '13px', color: C.textMuted }}>Veuillez d'abord sélectionner une adresse de livraison</span>
              </div>
            ) : (
              <div>
                <div style={s.infoBandeau}>
                  <span style={{ fontSize: '14px' }}>📍</span>
                  <span style={{ fontSize: '13px', color: C.textSub }}>
                    Livraison à <strong style={{ color: C.text }}>{adresseLivraison.ville}, {adresseLivraison.province}</strong>
                    {panierMixte && <span style={{ color: '#fbbf24', fontSize: '11px', display: 'block', marginTop: '3px' }}>⚠️ Frais calculés pour les articles physiques seulement — les produits numériques sont gratuits.</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {methodesExpedition.map((methode) => {
                    const fraisCalcule = methode.frais_calcule ?? methode.frais_fixes ?? 0;
                    const estGratuit = methode.gratuit_applique || fraisCalcule === 0;
                    const estSelectionnee = expedition === methode.id;
                    const prixAffiche = estGratuit ? 'Gratuit' : `${fraisCalcule.toFixed(2)} $`;
                    return (
                      <div
                        key={methode.id}
                        className="selectable-card"
                        style={{
                          ...s.expeditionCard,
                          ...(estSelectionnee ? s.expeditionCardActif : {}),
                        }}
                        onClick={() => setExpedition(methode.id)}
                      >
                        <RadioDot actif={estSelectionnee} />
                        <span style={{ fontSize: '22px', flexShrink: 0 }}>{methode.logo}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{methode.nom}</p>
                          {methode.delais_estime && (
                            <p style={{ fontSize: '12px', color: C.textMuted, margin: '1px 0 0' }}>⏱ {methode.delais_estime}</p>
                          )}
                          {methode.detail_calcul && !estGratuit && (
                            <p style={{ fontSize: '11px', color: C.textMuted, margin: '1px 0 0', fontStyle: 'italic' }}>
                              {methode.detail_calcul}
                            </p>
                          )}
                          {methode.gratuit_superieur && !methode.gratuit_applique && (
                            <p style={{ fontSize: '11px', color: C.success, margin: '2px 0 0', fontWeight: 600 }}>
                              🎁 Gratuit dès {methode.gratuit_superieur.toFixed(2)} $ d'achat
                            </p>
                          )}
                          {methode.gratuit_applique && (
                            <p style={{ fontSize: '11px', color: C.success, margin: '2px 0 0', fontWeight: 700 }}>
                              🎁 Livraison gratuite appliquée !
                            </p>
                          )}
                          {methode.combine_shipping && (
                            <p style={{ fontSize: '11px', color: '#7c3aed', margin: '2px 0 0' }}>
                              📦 Combine shipping
                            </p>
                          )}
                        </div>
                        <span style={{
                          fontSize: '14px', fontWeight: 700,
                          color: estGratuit ? C.success : C.accentLight,
                          background: estGratuit ? C.successBg : C.accentGlow,
                          padding: '3px 10px', borderRadius: '20px',
                          flexShrink: 0,
                        }}>
                          {prixAffiche}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>
          )}

          {/* ── 6. MODE DE PAIEMENT ── */}
          <Section titre="Mode de paiement" icone="💳" numero={5}>
            {aucunPaiement ? (
              <div style={{ ...s.alerte, ...s.alerteDanger }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: C.danger, margin: '0 0 4px' }}>
                    Ce vendeur ne peut pas recevoir de paiement pour l'instant
                  </p>
                  <p style={{ fontSize: '13px', color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
                    Ni Stripe ni PayPal ne sont configurés. Veuillez contacter le vendeur ou réessayer plus tard.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Stripe */}
                <div
                  className={vendeur?.stripe_actif ? 'selectable-card' : ''}
                  style={{
                    ...s.paiementCard,
                    ...(modePaiement === 'stripe' ? s.paiementCardActif : {}),
                    opacity: vendeur?.stripe_actif ? 1 : 0.4,
                    cursor: vendeur?.stripe_actif ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => vendeur?.stripe_actif && setModePaiement('stripe')}
                >
                  <RadioDot actif={modePaiement === 'stripe'} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
                      Paiement par carte — Stripe
                    </p>
                    <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>
                      Visa, Mastercard, Amex — Sécurisé SSL
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={s.cardLogo}>VISA</span>
                    <span style={s.cardLogo}>MC</span>
                    <span style={{ fontSize: '16px' }}>🔒</span>
                  </div>
                  {!vendeur?.stripe_actif && <span style={s.badgeIndispo}>Non disponible</span>}
                </div>
                {modePaiement === 'stripe' && (
                  <div style={{ ...s.alerte, ...s.alerteSuccess, fontSize: '13px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Vous serez redirigé vers la page de paiement sécurisée Stripe du vendeur.</span>
                  </div>
                )}

                {/* PayPal */}
                <div
                  className={vendeur?.paypal_actif ? 'selectable-card' : ''}
                  style={{
                    ...s.paiementCard,
                    ...(modePaiement === 'paypal' ? s.paiementCardActif : {}),
                    opacity: vendeur?.paypal_actif ? 1 : 0.4,
                    cursor: vendeur?.paypal_actif ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => vendeur?.paypal_actif && setModePaiement('paypal')}
                >
                  <RadioDot actif={modePaiement === 'paypal'} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
                      PayPal
                    </p>
                    <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>
                      Compte PayPal ou carte via PayPal
                    </p>
                  </div>
                  <span style={{ fontSize: '22px' }}>🅿️</span>
                  {!vendeur?.paypal_actif && <span style={s.badgeIndispo}>Non disponible</span>}
                </div>
                {modePaiement === 'paypal' && (
                  <div style={{ ...s.alerte, ...s.alerteSuccess, fontSize: '13px' }}>
                    <span>🅿️</span>
                    <span>Vous serez redirigé vers PayPal pour finaliser votre achat auprès du vendeur.</span>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── 7. POURBOIRE ── */}
          <Section titre={`Soutenir ${vendeur?.nom_boutique || vendeur?.nom || 'le vendeur'} (optionnel)`} icone="🎁" numero={6}>
            <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '14px', lineHeight: 1.5 }}>
              Chaque pourboire va directement au vendeur. C'est 100 % pour lui ! 🙌
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[0, 1, 2, 5].map(pct => {
                const montant = pct === 0 ? 0 : Math.round(sousTotal * pct) / 100 * 100 / 100;
                const label = pct === 0 ? 'Aucun' : `${pct}% (${montant.toFixed(2)} $)`;
                const isActif = pourboire === (pct === 0 ? 0 : sousTotal * pct / 100) && pourboireCustom === '';
                return (
                  <button
                    key={pct}
                    className="btn-pourboire"
                    style={{
                      ...s.btnPourboire,
                      ...(isActif ? s.btnPourboireActif : {}),
                    }}
                    onClick={() => {
                      setPourboire(pct === 0 ? 0 : sousTotal * pct / 100);
                      setPourboireCustom('');
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <input
                style={s.inputCustom}
                placeholder="Autre $"
                value={pourboireCustom}
                onChange={e => {
                  setPourboireCustom(e.target.value);
                  setPourboire(parseFloat(e.target.value) || 0);
                }}
              />
            </div>
          </Section>

          {/* ══ ENCADRÉ INFO e-VEND — RÔLE DE LA PLATEFORME ══════════════════ */}
          <div style={s.infoEvend}>
            <div style={s.infoEvendHeader}>
              <div style={s.infoEvendIcone}>🛒</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
                  Vous achetez directement du vendeur
                </p>
                <p style={{ fontSize: '12px', color: C.textMuted, margin: '2px 0 0' }}>
                  Comprendre le fonctionnement d'e-Vend
                </p>
              </div>
              <div style={s.evendBadge}>e-Vend</div>
            </div>

            <div style={s.infoEvendDivider} />

            <div style={{ ...s.infoEvendGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
              <div style={s.infoEvendItem}>
                <div style={{ ...s.infoEvendDot, background: C.accent }}>💳</div>
                <div>
                  <p style={s.infoItemTitre}>Paiement redirigé vers le vendeur</p>
                  <p style={s.infoItemTexte}>
                    e-Vend ne traite pas votre paiement. Vous êtes redirigé vers la page sécurisée Stripe Connect ou PayPal du vendeur. e-Vend n'a jamais accès à vos informations de paiement.
                  </p>
                </div>
              </div>

              <div style={s.infoEvendItem}>
                <div style={{ ...s.infoEvendDot, background: '#4ade80' }}>🚚</div>
                <div>
                  <p style={s.infoItemTitre}>Livraison gérée par le vendeur</p>
                  <p style={s.infoItemTexte}>
                    Chaque vendeur est indépendant et gère lui-même l'expédition, les délais et le suivi de votre commande. Contactez-le directement via la messagerie pour toute question de livraison.
                  </p>
                </div>
              </div>

              <div style={s.infoEvendItem}>
                <div style={{ ...s.infoEvendDot, background: '#60a5fa' }}>↩️</div>
                <div>
                  <p style={s.infoItemTitre}>Retours & litiges — responsabilité du vendeur</p>
                  <p style={s.infoItemTexte}>
                    Les politiques de retour sont établies par chaque vendeur. En cas de litige, commencez par contacter le vendeur. e-Vend peut jouer un rôle de médiateur à sa discrétion, mais n'intervient pas dans les remboursements.
                  </p>
                </div>
              </div>

              <div style={s.infoEvendItem}>
                <div style={{ ...s.infoEvendDot, background: '#f59e0b' }}>🔒</div>
                <div>
                  <p style={s.infoItemTitre}>Technologie sécurisée, vendeurs indépendants</p>
                  <p style={s.infoItemTexte}>
                    e-Vend fournit uniquement les outils technologiques qui mettent en relation les acheteurs et les vendeurs. Chaque vendeur est un entrepreneur indépendant qui a accepté nos conditions d'utilisation.
                  </p>
                </div>
              </div>
            </div>

            <div style={s.infoEvendFooter}>
              <span style={{ fontSize: '13px' }}>🔒</span>
              <span style={{ fontSize: '13px', color: C.textMuted }}>
                Vos données personnelles sont protégées. e-Vend ne vend jamais vos informations.{' '}
                <a href="/politique/confidentialite" style={{ color: C.accent, textDecoration: 'none' }}>
                  Politique de confidentialité →
                </a>
              </span>
            </div>
          </div>

        </div>

        {/* ══ COLONNE DROITE — RÉCAPITULATIF ══════════════════════════════ */}
        <div style={{ ...s.colDroite, position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : '20px', order: isMobile ? -1 : 0 }}>
          <div style={s.recapCard}>

            <div style={s.recapHeader}>
              <h2 style={s.recapTitre}>Récapitulatif</h2>
              {vendeur && <span style={s.recapVendeurBadge}>{vendeur.nom_boutique || vendeur.nom}</span>}
            </div>

            {/* Articles mini */}
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {articles.map(a => (
                <div key={a.id} style={s.recapArticleLigne}>
                  <div style={{ position: 'relative', flexShrink: 0, width: '48px', height: '48px' }}>
                    {a.image_url
                      ? <img src={a.image_url} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      : <div style={{ width: '100%', height: '100%', background: C.border, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                    }
                    <div style={s.recapQteBadge}>{a.quantite}</div>
                  </div>
                  <span style={s.recapArticleNom}>{a.titre}</span>
                  <span style={s.recapArticlePrix}>{(parseFloat(String(a.prix)) * a.quantite).toFixed(2)} $</span>
                </div>
              ))}
            </div>

            <div style={s.divider} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <LigneRecap label={`Sous-total (${articles.reduce((s, a) => s + a.quantite, 0)} art.)`} valeur={`${sousTotal.toFixed(2)} $`} />
              <LigneRecap
                label={methodeExpeditionSelectionnee ? `Expédition — ${methodeExpeditionSelectionnee.nom}` : 'Expédition'}
                valeur={!methodeExpeditionSelectionnee ? '—' : fraisExp === 0 ? 'Gratuite' : `${fraisExp.toFixed(2)} $`}
                couleur={fraisExp === 0 ? C.success : undefined}
                note={methodeExpeditionSelectionnee?.delais_estime || methodeExpeditionSelectionnee?.detail_calcul}
              />
              {/* Taxes indicatives — recalculées par Stripe au paiement */}
              {taxesLoading ? (
                <LigneRecap label="Taxes (est.)" valeur="Calcul..." muted />
              ) : taxes ? (
                <>
                  {(taxes as any).aucune_taxe ? (
                    <LigneRecap label="Taxes" valeur="Non taxable" muted />
                  ) : (
                    <>
                      {parseFloat(taxes.tps) > 0 && <LigneRecap label="TPS ~5%" valeur={`~${taxes.tps} $`} muted />}
                      {parseFloat(taxes.tvq) > 0 && <LigneRecap label="TVQ ~9,975%" valeur={`~${taxes.tvq} $`} muted />}
                      {parseFloat(taxes.tvh) > 0 && <LigneRecap label="TVH" valeur={`~${taxes.tvh} $`} muted />}
                      {parseFloat(taxes.tps) === 0 && parseFloat(taxes.tvq) === 0 && parseFloat(taxes.tvh) === 0 && (
                        <LigneRecap label="Taxes" valeur="0,00 $" muted />
                      )}
                    </>
                  )}
                </>
              ) : (
                <LigneRecap label="Taxes (est.)" valeur="—" muted note="Sélectionnez une adresse" />
              )}
              {codePromoInfo && (
                <LigneRecap label={`Code promo — ${codePromoInfo.code}`} valeur={`-${parseFloat(codePromoInfo.rabais).toFixed(2)} $`} couleur={C.success} />
              )}
              {pourboire > 0 && <LigneRecap label="Pourboire" valeur={`${pourboire.toFixed(2)} $`} muted />}
            </div>

            <div style={s.divider} />

            {/* Bloc code promo */}
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎟️ Code promo</p>
              {!codePromoInfo ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={codePromoInput}
                    onChange={e => { setCodePromoInput(e.target.value.toUpperCase()); setCodePromoErreur(null); }}
                    onKeyDown={e => e.key === 'Enter' && appliquerCodePromo()}
                    placeholder="Ex : OFFRE-A1B2"
                    style={{ flex: 1, padding: '9px 12px', border: `1px solid ${codePromoErreur ? C.danger : C.border}`, borderRadius: '10px', fontSize: '13px', color: C.text, background: 'rgba(255,255,255,0.04)', outline: 'none', fontFamily: 'inherit', letterSpacing: '1px', boxSizing: 'border-box' as const }}
                  />
                  <button
                    onClick={appliquerCodePromo}
                    disabled={codePromoLoading || !codePromoInput.trim()}
                    style={{ padding: '9px 14px', border: 'none', borderRadius: '10px', background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: codePromoLoading || !codePromoInput.trim() ? 'not-allowed' : 'pointer', opacity: codePromoLoading || !codePromoInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap' as const, flexShrink: 0 }}
                  >
                    {codePromoLoading ? '...' : 'Appliquer'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 900, color: C.success, margin: '0 0 2px', letterSpacing: '1px', fontFamily: 'monospace' }}>✅ {codePromoInfo.code}</p>
                    <p style={{ fontSize: '12px', color: C.success, margin: 0, opacity: 0.8 }}>-{parseFloat(codePromoInfo.rabais).toFixed(2)} $ de rabais</p>
                  </div>
                  <button onClick={retirerCodePromo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: '20px', padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              )}
              {codePromoErreur && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '9px 12px', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                  <p style={{ fontSize: '12px', color: C.danger, margin: 0, lineHeight: 1.4 }}>{codePromoErreur}</p>
                </div>
              )}
            </div>

            <div style={s.divider} />

            {/* Note pour le vendeur */}
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📝 Note pour le vendeur <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(facultatif)</span>
              </p>
              <textarea
                value={noteVendeur}
                onChange={e => setNoteVendeur(e.target.value.slice(0, 500))}
                placeholder="Instructions spéciales, allergies, date de livraison souhaitée, message cadeau..."
                rows={3}
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${noteVendeur.length > 400 ? C.danger : C.border}`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: C.text,
                  background: 'rgba(255,255,255,0.04)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box' as const,
                  lineHeight: '1.5',
                }}
              />
              <p style={{ fontSize: '11px', color: noteVendeur.length > 400 ? C.danger : C.textMuted, margin: '4px 0 0', textAlign: 'right' }}>
                {noteVendeur.length}/500
              </p>
            </div>

            <div style={s.divider} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>Total estimé</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: codePromoInfo ? C.success : C.accentLight }}>
                  {taxesLoading
                    ? '...'
                    : taxes
                      ? `${(parseFloat(taxes.total) - rabaisCode).toFixed(2)} $`
                      : `${(sousTotalApresRabais + fraisExp).toFixed(2)} $`}
                </span>
                <p style={{ fontSize: '11px', color: C.textMuted, margin: '2px 0 0' }}>
                  {taxes ? 'CAD · taxes estimées incluses' : 'CAD · taxes non estimées'}
                </p>
              </div>
            </div>

            {taxes && adresseLivraison && !(taxes as any).aucune_taxe && (
              <p style={{ fontSize: '11px', color: C.textMuted, margin: '4px 0 4px', textAlign: 'center' }}>
                Taxes estimées pour {adresseLivraison.province} ({taxes.label_taxe})
              </p>
            )}
            {/* Note estimation taxes — masquée si produit non taxable */}
            {taxes && !(taxes as any).aucune_taxe && (
              <p style={{
                fontSize: '11px', color: C.textMuted, fontStyle: 'italic',
                margin: '4px 0 12px', textAlign: 'center', lineHeight: 1.5,
              }}>
                ℹ️ Estimation des taxes — celles-ci seront validées à la page de paiement.
              </p>
            )}

            <div style={s.divider} />

            {/* Mode paiement badge */}
            {modePaiement && (
              <div style={s.paiementBadge}>
                <span style={{ fontSize: '18px' }}>{modePaiement === 'stripe' ? '💳' : '🅿️'}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0 }}>
                    {modePaiement === 'stripe' ? 'Stripe — Carte bancaire' : 'PayPal'}
                  </p>
                  <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>Paiement sécurisé SSL</p>
                </div>
                <span style={{ fontSize: '16px', color: C.success, marginLeft: 'auto' }}>🔒</span>
              </div>
            )}



            {/* ── BOUTON PAYER ── */}
            <button
              className={peutPayer && !soumission ? 'btn-payer' : ''}
              style={{
                ...s.btnPayer,
                opacity: peutPayer && !soumission ? 1 : 0.45,
                cursor: peutPayer && !soumission ? 'pointer' : 'not-allowed',
              }}
              onClick={validerPaiement}
              disabled={!peutPayer || soumission}
            >
              {soumission ? (
                <><div style={{ ...s.spinner, width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#fff' }} /> Traitement...</>
              ) : aucunPaiement ? (
                <>⚠️ Paiement indisponible</>
              ) : !modePaiement ? (
                <>🔒 Choisir un mode de paiement</>
              ) : !adresseLivraison ? (
                <>📍 Adresse requise</>
              ) : methodesExpedition.length > 0 && expedition === null ? (
                <>🚚 Choisir une méthode d'expédition</>
              ) : (
                <>
                  {modePaiement === 'stripe' ? '💳' : '🅿️'}
                  {' '}Payer {taxes ? `${taxes.total} $ CAD` : `${(sousTotal + fraisExp).toFixed(2)} $ CAD`}
                </>
              )}
            </button>

            <p style={{ fontSize: '11px', color: C.textMuted, textAlign: 'center', marginTop: '10px', lineHeight: 1.6 }}>
              En passant votre commande, vous acceptez les{' '}
              <a href="/politique/conditions-service" style={{ color: C.accent, textDecoration: 'none' }}>conditions d'utilisation</a>
              {' '}et la{' '}
              <a href="/politique/confidentialite" style={{ color: C.accent, textDecoration: 'none' }}>politique de confidentialité</a>.
            </p>

            <div style={s.securiteWrap}>
              <span>🔒</span>
              <span style={{ fontSize: '12px', color: C.textMuted }}>SSL 256 bits — Paiement 100% sécurisé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────

function Section({ titre, icone, numero, children }: { titre: string; icone: string; numero: number; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <div style={s.sectionNumero}>{numero}</div>
        <span style={{ fontSize: '18px' }}>{icone}</span>
        <h2 style={s.sectionTitre}>{titre}</h2>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function AdresseCard({ adr, selecte, onClick }: { adr: Adresse; selecte: boolean; onClick: () => void }) {
  return (
    <div
      className="selectable-card"
      style={{ ...s.adresseCard, ...(selecte ? s.adresseCardActif : {}) }}
      onClick={onClick}
    >
      <RadioDot actif={selecte} />
      <div>
        <p style={s.adresseNom}>{adr.prenom} {adr.nom}</p>
        <p style={s.adresseLigne}>{adr.adresse}</p>
        <p style={s.adresseLigne}>{adr.ville}, {adr.province} {adr.code_postal}</p>
        <p style={s.adresseLigne}>{adr.pays}</p>
        {adr.telephone && <p style={s.adresseLigne}>Tél : {adr.telephone}</p>}
        {adr.par_defaut && <span style={s.badgeDefaut}>Adresse par défaut</span>}
      </div>
    </div>
  );
}

function RadioDot({ actif }: { actif: boolean }) {
  return (
    <div style={{
      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${actif ? C.accent : C.border}`,
      background: actif ? C.accent : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
      boxShadow: actif ? `0 0 8px ${C.accentGlow}` : 'none',
    }}>
      {actif && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
    </div>
  );
}

function RadioOption({ actif, label, onClick }: { actif: boolean; label: string; onClick: () => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onClick}>
      <RadioDot actif={actif} />
      <span style={{ fontSize: '14px', color: actif ? C.text : C.textSub }}>{label}</span>
    </label>
  );
}

function LigneRecap({ label, valeur, couleur, muted, note }: {
  label: string; valeur: string; couleur?: string; muted?: boolean; note?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span style={{ fontSize: muted ? '12px' : '13px', color: muted ? C.textMuted : C.textSub }}>{label}</span>
        {note && <p style={{ fontSize: '11px', color: C.textMuted, margin: '1px 0 0' }}>{note}</p>}
      </div>
      <span style={{ fontSize: muted ? '12px' : '13px', fontWeight: muted ? 400 : 600, color: couleur || (muted ? C.textMuted : C.text) }}>
        {valeur}
      </span>
    </div>
  );
}

function FormulaireAdresse({ form, onChange, onValider, onAnnuler }: {
  form: any; onChange: (f: any) => void; onValider: (f: any) => void; onAnnuler?: () => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={s.inputLabel}>Prénom *</label>
          <input style={s.input} value={form.prenom} onChange={e => onChange({ ...form, prenom: e.target.value })} placeholder="Prénom" />
        </div>
        <div>
          <label style={s.inputLabel}>Nom *</label>
          <input style={s.input} value={form.nom} onChange={e => onChange({ ...form, nom: e.target.value })} placeholder="Nom" />
        </div>
      </div>
      <div>
        <label style={s.inputLabel}>Adresse *</label>
        <input style={s.input} value={form.adresse} onChange={e => onChange({ ...form, adresse: e.target.value })} placeholder="123 rue Principale" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={s.inputLabel}>Ville *</label>
          <input style={s.input} value={form.ville} onChange={e => onChange({ ...form, ville: e.target.value })} placeholder="Ville" />
        </div>
        <div>
          <label style={s.inputLabel}>Province *</label>
          <select style={s.input} value={form.province} onChange={e => onChange({ ...form, province: e.target.value })}>
            {PROVINCES.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={s.inputLabel}>Code postal *</label>
          <input style={s.input} value={form.code_postal} onChange={e => onChange({ ...form, code_postal: e.target.value.toUpperCase() })} placeholder="G0L 2K0" />
        </div>
        <div>
          <label style={s.inputLabel}>Téléphone</label>
          <input style={s.input} value={form.telephone} onChange={e => onChange({ ...form, telephone: e.target.value })} placeholder="418-000-0000" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          style={{ ...s.btnPrimaire, opacity: form.prenom && form.nom && form.adresse && form.ville && form.code_postal ? 1 : 0.5 }}
          onClick={() => onValider(form)}
          disabled={!form.prenom || !form.nom || !form.adresse || !form.ville || !form.code_postal}
        >
          Utiliser cette adresse
        </button>
        {onAnnuler && (
          <button style={s.btnSecondaire} onClick={onAnnuler}>Annuler</button>
        )}
      </div>
    </div>
  );
}

// ─── CSS GLOBAL ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 767px) {
    .checkout-section-body { padding: 12px 14px !important; }
    .checkout-article-img { width: 56px !important; height: 56px !important; }
    .checkout-recap-article { font-size: 12px !important; }
    .checkout-btn-payer { font-size: 14px !important; padding: 14px !important; }
  }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }

  .selectable-card { transition: all 0.18s ease; }
  .selectable-card:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(180,120,40,0.15) !important; border-color: #b47828 !important; }

  .btn-payer { transition: all 0.2s ease !important; }
  .btn-payer:hover { transform: translateY(-2px) !important; box-shadow: 0 12px 32px rgba(180,120,40,0.4) !important; }

  .btn-pourboire { transition: all 0.18s ease; }
  .btn-pourboire:hover { border-color: #b47828 !important; color: #d4a853 !important; }

  input:focus, select:focus {
    outline: none !important;
    border-color: #b47828 !important;
    box-shadow: 0 0 0 3px rgba(180,120,40,0.15) !important;
  }
`;

// ─── STYLES ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg,
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    color: C.text,
  },

  header: {
    background: C.card,
    borderBottom: `1px solid ${C.border}`,
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  btnRetour: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: C.accent,
    fontWeight: 700,
    padding: 0,
    letterSpacing: '0.01em',
  },
  headerTitre: {
    fontSize: '20px',
    fontWeight: 900,
    color: C.text,
    margin: 0,
    flex: 1,
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },

  progressBar: {
    background: C.card,
    borderBottom: `1px solid ${C.border}`,
    padding: '12px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },

  layout: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    alignItems: 'start',
  },

  colGauche: { display: 'flex', flexDirection: 'column', gap: '16px' },
  colDroite: { position: 'sticky', top: '20px' },

  // Vendeur banner
  vendeurBanner: {
    background: `linear-gradient(135deg, ${C.card}, #2a2218)`,
    border: `1px solid ${C.borderAccent}`,
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
    animation: 'fadeIn 0.4s ease',
  },
  vendeurAvatar: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: 900, color: '#fff', flexShrink: 0,
    boxShadow: `0 4px 14px ${C.accentGlow}`,
  },
  vendeurBadge: {
    fontSize: '12px', fontWeight: 700, color: C.success,
    background: C.successBg, border: `1px solid ${C.successBorder}`,
    padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
  },

  // Section
  section: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
    animation: 'fadeIn 0.4s ease',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: `1px solid ${C.border}`,
  },
  sectionNumero: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 900, color: '#fff', flexShrink: 0,
    boxShadow: `0 2px 8px ${C.accentGlow}`,
  },
  sectionTitre: {
    fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.01em',
  },
  sectionBody: {
    padding: '18px 20px',
  },

  // Articles
  articleRow: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
  },
  articleImgWrap: {
    position: 'relative', flexShrink: 0, width: '68px', height: '68px',
  },
  qteBadge: {
    position: 'absolute', top: '-6px', right: '-6px',
    width: '20px', height: '20px', borderRadius: '50%',
    background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${C.card}`,
  },
  articleTitre: {
    fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.3,
  },
  articleVendeur: {
    fontSize: '12px', color: C.textMuted, margin: '0 0 4px',
  },
  articlePrixUnit: {
    fontSize: '12px', color: C.textSub, margin: 0,
  },
  articleTotal: {
    fontSize: '15px', fontWeight: 800, color: C.accentLight, margin: 0, flexShrink: 0,
  },

  // Adresse
  adresseCard: {
    display: 'flex', gap: '12px', padding: '14px 16px',
    border: `1px solid ${C.border}`, borderRadius: '12px',
    marginBottom: '10px', cursor: 'pointer',
    background: 'transparent', transition: 'all 0.18s',
  },
  adresseCardActif: {
    border: `2px solid ${C.accent}`,
    background: 'rgba(180,120,40,0.06)',
    boxShadow: `0 0 0 3px ${C.accentGlow}`,
  },
  adresseNom: {
    fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 4px',
  },
  adresseLigne: {
    fontSize: '13px', color: C.textSub, margin: '0 0 2px',
  },
  badgeDefaut: {
    display: 'inline-block', marginTop: '6px',
    fontSize: '11px', fontWeight: 700, color: C.accentLight,
    background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
    padding: '2px 8px', borderRadius: '20px',
  },

  // Expédition
  expeditionCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: '12px',
    cursor: 'pointer', background: 'transparent',
  },
  expeditionCardActif: {
    border: `2px solid ${C.accent}`,
    background: 'rgba(180,120,40,0.06)',
    boxShadow: `0 0 0 3px ${C.accentGlow}`,
  },

  // Paiement
  paiementCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', border: `1px solid ${C.border}`, borderRadius: '12px',
    background: 'transparent', transition: 'all 0.18s',
  },
  paiementCardActif: {
    border: `2px solid ${C.accent}`,
    background: 'rgba(180,120,40,0.06)',
    boxShadow: `0 0 0 3px ${C.accentGlow}`,
  },
  cardLogo: {
    fontSize: '10px', fontWeight: 900, color: '#fff',
    background: '#3d3528', padding: '3px 6px', borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  badgeIndispo: {
    fontSize: '11px', color: C.textMuted, background: C.border,
    padding: '2px 8px', borderRadius: '20px',
  },

  // Alertes
  alerte: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '12px 16px', borderRadius: '12px',
  },
  alerteSuccess: {
    background: C.successBg,
    border: `1px solid ${C.successBorder}`,
    color: C.success,
  },
  alerteDanger: {
    background: C.dangerBg,
    border: `1px solid ${C.dangerBorder}`,
    color: C.danger,
  },
  alerteWarning: {
    background: C.warningBg,
    border: `1px solid ${C.warningBorder}`,
    color: C.warning,
  },

  infoBandeau: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`, borderRadius: '10px',
    fontSize: '13px',
  },

  // Pourboire
  btnPourboire: {
    padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: '20px',
    background: 'transparent', cursor: 'pointer', fontSize: '13px', color: C.textSub, fontWeight: 500,
  },
  btnPourboireActif: {
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    borderColor: C.accent, color: '#fff', fontWeight: 700,
    boxShadow: `0 4px 12px ${C.accentGlow}`,
  },
  inputCustom: {
    width: '100px', padding: '8px 12px',
    border: `1px solid ${C.border}`, borderRadius: '20px',
    fontSize: '13px', color: C.text, background: 'transparent',
    outline: 'none', fontFamily: 'inherit',
  },

  // Formulaire
  inputLabel: {
    display: 'block', fontSize: '11px', fontWeight: 700, color: C.textMuted,
    marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  },
  input: {
    width: '100%', padding: '10px 14px',
    border: `1px solid ${C.border}`, borderRadius: '10px',
    fontSize: '14px', color: C.text, background: 'rgba(255,255,255,0.04)',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  btnPrimaire: {
    padding: '10px 20px',
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    boxShadow: `0 4px 14px ${C.accentGlow}`,
  },
  btnSecondaire: {
    padding: '10px 20px', background: 'transparent', color: C.textSub,
    border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
  },
  btnLien: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: C.accent, fontSize: '13px', fontWeight: 700,
    padding: '4px 0', textDecoration: 'none' as const,
  },

  // Recap droite
  recapCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '18px', padding: '20px',
    boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
    animation: 'fadeIn 0.4s ease',
  },
  recapHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', paddingBottom: '14px', borderBottom: `1px solid ${C.border}`,
  },
  recapTitre: { fontSize: '16px', fontWeight: 900, color: C.text, margin: 0 },
  recapVendeurBadge: {
    fontSize: '12px', fontWeight: 700, color: C.accentLight,
    background: C.accentGlow, padding: '3px 10px', borderRadius: '20px',
    border: `1px solid ${C.borderAccent}`,
  },
  recapArticleLigne: { display: 'flex', alignItems: 'center', gap: '10px' },
  recapQteBadge: {
    position: 'absolute', top: '-5px', right: '-5px',
    width: '18px', height: '18px', borderRadius: '50%',
    background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  recapArticleNom: {
    flex: 1, fontSize: '13px', color: C.textSub, lineHeight: 1.4,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  } as React.CSSProperties,
  recapArticlePrix: { fontSize: '13px', fontWeight: 700, color: C.text, flexShrink: 0 },
  divider: { height: '1px', background: C.border, margin: '14px 0' },

  paiementBadge: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`, borderRadius: '12px',
    marginBottom: '14px',
  },

  btnPayer: {
    width: '100%', padding: '16px',
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    color: '#fff', border: 'none', borderRadius: '14px',
    fontSize: '16px', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: `0 6px 20px ${C.accentGlow}`,
    cursor: 'pointer', letterSpacing: '-0.01em',
  },

  securiteWrap: {
    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
    marginTop: '10px', padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
    border: `1px solid ${C.border}`,
  },

  // ── ENCADRÉ INFO e-VEND ──────────────────────────────────────────────────
  infoEvend: {
    background: `linear-gradient(135deg, #1e1b16, #221e18)`,
    border: `1px solid ${C.borderAccent}`,
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
    animation: 'fadeIn 0.5s ease',
  },
  infoEvendHeader: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '20px 24px',
    background: 'rgba(180,120,40,0.06)',
    borderBottom: `1px solid ${C.border}`,
  },
  infoEvendIcone: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', flexShrink: 0,
    boxShadow: `0 4px 14px ${C.accentGlow}`,
  },
  evendBadge: {
    marginLeft: 'auto', fontSize: '12px', fontWeight: 900,
    color: C.accentLight, background: C.accentGlow,
    border: `1px solid ${C.borderAccent}`, padding: '4px 12px',
    borderRadius: '20px', letterSpacing: '0.06em',
    flexShrink: 0,
  },
  infoEvendDivider: { height: '1px', background: C.border },
  infoEvendGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0', padding: '0',
  },
  infoEvendItem: {
    display: 'flex', gap: '12px',
    padding: '18px 20px',
    borderBottom: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`,
    animation: 'slideIn 0.4s ease',
  },
  infoEvendDot: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', flexShrink: 0, opacity: 0.9,
  },
  infoItemTitre: {
    fontSize: '13px', fontWeight: 800, color: C.text,
    margin: '0 0 5px', lineHeight: 1.3,
  },
  infoItemTexte: {
    fontSize: '12px', color: C.textMuted, margin: 0, lineHeight: 1.6,
  },
  infoEvendFooter: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '14px 20px',
    background: 'rgba(255,255,255,0.02)',
  },

  spinner: {
    width: '32px', height: '32px',
    border: `3px solid ${C.border}`,
    borderTop: `3px solid ${C.accent}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};