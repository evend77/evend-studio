import React, { useState, useEffect, useRef, useMemo } from 'react';
import BulkEditProduits from './BulkEditProduits';



// ✅ Helper token — niveau module (accessible partout dans le fichier)
const getToken = () => localStorage.getItem('token');

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  accent:      '#2d6a9f',
  accentLight: '#e8f2fb',
  accentDark:  '#1d4f7a',
  teal:        '#0d9488',
  tealLight:   '#f0fdfa',
  bg:          '#f0f2f5',
  card:        '#ffffff',
  border:      '#e1e4e8',
  text:        '#1a2332',
  textLight:   '#6b7280',
  danger:      '#dc2626',
  dangerLight: '#fef2f2',
  success:     '#16a34a',
  successLight:'#f0fdf4',
  warning:     '#d97706',
  warningLight:'#fffbeb',
  purple:      '#7c3aed',
  purpleLight: '#f5f3ff',
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TypeVente = 'standard' | 'enchere';
type StatutProduit = 'actif' | 'inactif' | 'en_attente' | 'vendu' | 'suspendu';
type StatutEnchere = 'en_cours' | 'a_venir' | 'terminee' | 'annulee';
type TypeAnnonce = 'neuf' | 'occasion' | 'remis-a-neuf';
type EtatArticle = 'neuf' | 'comme-neuf' | 'tres-bon' | 'bon' | 'correct' | 'use' | 'a-reparer' | 'pieces';
type RetourOffert = 'non' | 'oui-description';
type Garantie = 'aucune' | '30j' | '6m' | '1an';
type SuiviInventaire = 'suivre' | 'non';

type SourceAnnonce = 
  | 'e-Vend' 
  | 'Shopify' 
  | 'eBay' 
  | 'Amazone' 
  | 'Etsy' 
  | 'WooCommerce' 
  | 'Magento' 
  | 'BigCommerce' 
  | 'Square' 
  | 'SooPOS' 
  | 'Dytel POS' 
  | 'Squarespace' 
  | 'Linnworks';

interface NoteInterne {
  id: number;
  date: string;
  contenu: string;
}

interface Produit {
  id: string;
  nom: string;
  sku: string;
  categorie: string;
  prix: number;
  stock: number;
  typeVente: TypeVente;
  statut: StatutProduit;
  dateCreation: string;
  image?: string;
  enchereId?: string;
  totalVentes?: number;
  note?: number;
  notes?: NoteInterne[];
  poids?: number;
  hauteur?: number;
  largeur?: number;
  longueur?: number;
  codeBarres?: string;
  marque?: string;
  modele?: string;
  tags?: string[];
  typeAnnonce?: TypeAnnonce;
  etat?: EtatArticle;
  retourOffert?: RetourOffert;
  garantie?: Garantie;
  paysFabrication?: string;
  formats?: string;
  adresseVente?: string;
  lienYoutube?: string;
  modeExpedition?: {
    transporteur: boolean;
    ramassage: boolean;
  };
  suiviInventaire?: SuiviInventaire;
  quantiteMinimum?: number;
  produitNumerique?: boolean;
  lienNumerique?: string;
  joursAccessibles?: number;
  telechargementsMax?: number;
  source?: SourceAnnonce;
  vues?: number;
  vendeur_id?: string;
}

interface Encherisseur {
  id: number;
  nom: string;
  email: string;
  miseCourante: number;
  misePrecedente: number;
  miseMax: number;
  nbMises: number;
  estGagnant: boolean;
}

interface EnchereVendeur {
  id: string;
  produitId: string;
  produit: string;
  sku: string;
  dateDebut: string;
  dateFin: string;
  prixBase: number;
  prixReserve: number | null;
  miseCourante: number;
  nbMises: number;
  statut: StatutEnchere;
  procuration: boolean;
  popcorn: boolean;
  incrementMin: number;
  reserveAtteinte: boolean;
  shopifyId?: string;
  encherisseurs: Encherisseur[];
}

interface MiseVendeur {
  id: number;
  acheteur_id: number;
  acheteur_email: string;
  acheteur_nom: string | null;
  montant: number;
  type_mise: string;
  est_gagnante: boolean;
  est_outbid: boolean;
  created_at: string;
}

interface FormEnchere {
  dateDebut: string;
  dateFin: string;
  prixBase: string;
  prixReserve: string;
  procuration: boolean;
  popcorn: boolean;
  popcornDelaiMises: string;
  popcornDelaiOffres: string;
  popcornNbFois: string;
}

type ActionType = 'desactiver' | 'supprimer' | 'activer' | 'vendre' | 'desactiver_bulk' | 'activer_bulk' | 'supprimer_bulk' | 'vendre_bulk' | null;

type TriOption = 
  | 'id-asc' 
  | 'nom-asc' 
  | 'prix-asc' 
  | 'prix-desc' 
  | 'stock-asc' 
  | 'stock-desc'
  | 'date-desc'
  | 'typeVente-asc'
  | 'source-asc'
  | 'vues-desc';

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const API_PRODUITS = `${API_BASE}/produits/gestionnaire`;
// Enchères non utilisées en Studio — constantes gardées pour éviter les erreurs TS
const API_ENCHERES  = `${API_BASE}/encheres`;
const API_ADMIN_ENC = `${API_BASE}/admin/encheres`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const PRODUITS_MOCK: Produit[] = [
  { 
    id: '#21303165', 
    nom: 'Montre à quartz pour enfant – Motif dinosaure', 
    sku: 'MON-DIN-001', 
    categorie: 'Montres', 
    prix: 16.99, 
    stock: 8, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-01-15', 
    enchereId: 'ENC-001', 
    totalVentes: 12, 
    note: 4.5,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.5,
    hauteur: 10,
    largeur: 5,
    longueur: 2,
    notes: [
      { id: 1, date: '15 jan 2026', contenu: 'Produit populaire, bien noté par les clients.' },
    ],
    source: 'e-Vend',
    vues: 245,
    vendeur_id: 'VEN-001'
  },
  { 
    id: '#21303166', 
    nom: 'Écusson brodé vintage – Série limitée', 
    sku: 'ECU-VIN-002', 
    categorie: 'Accessoires', 
    prix: 12.50, 
    stock: 23, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-01-22', 
    totalVentes: 8, 
    note: 4.2,
    typeAnnonce: 'occasion',
    etat: 'tres-bon',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.1,
    notes: [],
    source: 'eBay',
    vues: 89
  },
  { 
    id: '#21303167', 
    nom: 'Porte-clés artisanal en cuir véritable', 
    sku: 'CLE-CUI-003', 
    categorie: 'Maroquinerie', 
    prix: 24.00, 
    stock: 15, 
    typeVente: 'standard', 
    statut: 'actif', 
    dateCreation: '2026-02-01', 
    totalVentes: 34, 
    note: 4.7,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'oui-description',
    garantie: '6m',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.2,
    notes: [
      { id: 1, date: '1 fév 2026', contenu: 'Très bon vendeur, produit de qualité.' },
    ],
    source: 'Shopify',
    vues: 567
  },
  { 
    id: '#21303168', 
    nom: 'CD Glass Piano Bruce Brubeck Collection', 
    sku: 'CD-BRU-004', 
    categorie: 'Musique', 
    prix: 18.99, 
    stock: 4, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-02-10', 
    enchereId: 'ENC-002', 
    totalVentes: 3, 
    note: 4.0,
    typeAnnonce: 'occasion',
    etat: 'bon',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.1,
    notes: [],
    source: 'Amazone',
    vues: 123
  },
  { 
    id: '#21303169', 
    nom: 'Figurine rétro robot mécanique années 70', 
    sku: 'FIG-ROB-005', 
    categorie: 'Collectibles', 
    prix: 45.00, 
    stock: 2, 
    typeVente: 'standard', 
    statut: 'en_attente', 
    dateCreation: '2026-02-14', 
    totalVentes: 0, 
    note: 0,
    typeAnnonce: 'remis-a-neuf',
    etat: 'correct',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 1.2,
    notes: [
      { id: 1, date: '14 fév 2026', contenu: 'En attente de vérification par l\'équipe.' },
    ],
    source: 'Etsy',
    vues: 45
  },
  { 
    id: '#21303170', 
    nom: 'Lampe de bureau industrielle cuivre brossé', 
    sku: 'LAM-CUI-006', 
    categorie: 'Déco', 
    prix: 89.00, 
    stock: 6, 
    typeVente: 'standard', 
    statut: 'inactif', 
    dateCreation: '2026-02-18', 
    totalVentes: 2, 
    note: 3.5,
    typeAnnonce: 'occasion',
    etat: 'use',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 2.5,
    notes: [],
    source: 'WooCommerce',
    vues: 67
  },
  { 
    id: '#21303171', 
    nom: 'Faux billets loterie – Lot 6 pièces', 
    sku: 'FAU-LOT-007', 
    categorie: 'Jeux', 
    prix: 9.99, 
    stock: 50, 
    typeVente: 'enchere', 
    statut: 'actif', 
    dateCreation: '2026-02-20', 
    enchereId: 'ENC-003', 
    totalVentes: 5, 
    note: 4.3,
    typeAnnonce: 'neuf',
    etat: 'neuf',
    retourOffert: 'non',
    garantie: 'aucune',
    suiviInventaire: 'suivre',
    quantiteMinimum: 1,
    poids: 0.3,
    notes: [],
    source: 'e-Vend',
    vues: 234
  },
];

const ENCHERES_VENDEUR_MOCK: EnchereVendeur[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// CSS Print injecté dynamiquement
// ─────────────────────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body > * { display: none !important; }
  #evend-produits-vendeur-print { display: block !important; position: fixed; top: 0; left: 0; right: 0; background: white; padding: 20px; font-family: Arial, sans-serif; }
  @page { size: landscape; margin: 12mm 10mm; }
  table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
  tr { page-break-inside: avoid; }
  th { background-color: #e8f2fb !important; color: #2d6a9f !important; font-weight: bold !important; padding: 7px 8px !important; border: 1px solid #ccc !important; text-align: left !important; font-size: 9px !important; text-transform: uppercase; }
  td { padding: 6px 8px !important; border: 1px solid #ddd !important; font-size: 10px !important; }
  tfoot td { background-color: #e8f2fb !important; font-weight: bold !important; border-top: 2px solid #2d6a9f !important; }
  tr:nth-child(even) td { background-color: #f8f8f8 !important; }
  .print-section-title { font-size: 13px !important; font-weight: bold !important; color: #2d6a9f !important; margin: 16px 0 8px 0 !important; border-left: 4px solid #2d6a9f; padding-left: 8px; display: block !important; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color, background: bg, whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: checked ? T.teal : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: checked ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

function CountdownTimer({ dateFin }: { dateFin: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const calc = () => setDiff(Math.max(0, new Date(dateFin).getTime() - Date.now()));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [dateFin]);
  if (diff <= 0) return <span style={{ color: T.danger, fontSize: '12px', fontWeight: '700' }}>Expirée</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const box = (v: number, u: string) => (
    <span key={u} style={{ display: 'inline-flex', flexDirection: 'column' as const, alignItems: 'center', background: T.accent, color: '#fff', borderRadius: '5px', padding: '2px 6px', fontSize: '12px', fontWeight: '800', minWidth: '28px', marginRight: '2px' }}>
      {String(v).padStart(2,'0')}<span style={{ fontSize: '8px', fontWeight: '400', opacity: 0.8 }}>{u}</span>
    </span>
  );
  return <span>{box(d,'j')}{box(h,'h')}{box(m,'m')}{box(s,'s')}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PAGINATION
// ─────────────────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: `1px solid ${active ? T.accent : T.border}`,
    background: active ? T.accent : '#fff',
    color: active ? '#fff' : disabled ? T.textLight : T.text,
    fontWeight: active ? '700' : '500',
    fontSize: '13px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    minWidth: '36px',
    textAlign: 'center' as const,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', flexWrap: 'wrap' }}>
      <button style={btnStyle(false, page === 1)} onClick={() => page > 1 && onPageChange(page - 1)} disabled={page === 1}>← Préc.</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`dot-${i}`} style={{ padding: '6px 4px', color: T.textLight, fontSize: '13px' }}>…</span>
          : <button key={p} style={btnStyle(p === page)} onClick={() => onPageChange(p as number)}>{p}</button>
      )}
      <button style={btnStyle(false, page === totalPages)} onClick={() => page < totalPages && onPageChange(page + 1)} disabled={page === totalPages}>Suiv. →</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POPUP CRÉER ENCHÈRE — DYNAMIQUE (selon config admin)
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_ENCHERE = 'http://localhost:5000/api'; // enchères non utilisées en Studio

// Tooltip "Non autorisé" affiché au survol d'une section grisée
function TooltipNonAutorise({ children, message }: { children: React.ReactNode; message: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: '#1a2332', color: '#fff', borderRadius: '8px',
          padding: '8px 12px', fontSize: '12px', fontWeight: '500',
          whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          🔒 {message}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1a2332' }} />
        </div>
      )}
    </div>
  );
}

function PopupCreerEnchere({ produit, onClose, onSave }: { produit: Produit; onClose: () => void; onSave: (form: FormEnchere, commencer: boolean) => void }) {
  const now = new Date();

  // ── Config admin chargée depuis l'API ────────────────────────────────────
  const [adminConfig, setAdminConfig] = useState<any>(null);
  const [chargementConfig, setChargementConfig] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE_ENCHERE}/admin/encheres/vendeur-config`, {
          credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdminConfig(data);

          // Pré-remplir les dates si l'admin impose une durée
          if (data.vendor_auction_duration_setting) {
            const debut = new Date(now.getTime() + (data.default_start_days || 0) * 86400000);
            const fin   = new Date(debut.getTime()   + (data.default_end_days   || 2) * 86400000);
            setForm(f => ({
              ...f,
              dateDebut: debut.toISOString().slice(0, 16),
              dateFin:   fin.toISOString().slice(0, 16),
            }));
          }

          // Pré-remplir le prix de base si imposé
          if (data.vendor_base_price_setting && data.base_price > 0) {
            setForm(f => ({ ...f, prixBase: String(data.base_price) }));
          }

          // Pré-remplir le prix de réserve si imposé
          if (data.vendor_reserve_price_setting && data.reserve_price > 0) {
            setForm(f => ({ ...f, prixReserve: String(data.reserve_price) }));
          }
        }
      } catch (_) {
        // Si l'API échoue, on laisse tout activé par défaut (permissif)
      } finally {
        setChargementConfig(false);
      }
    };
    charger();
  }, []);

  // ── Helpers pour savoir si une fonctionnalité est autorisée ─────────────
  const proxyAutorise  = !adminConfig || (adminConfig.proxy_bidding  && adminConfig.vendor_proxy_bidding_setting);
  const popcornAutorise = !adminConfig || (adminConfig.popcorn_bidding && adminConfig.vendor_popcorn_bidding_setting);
  const datesLibres    = !adminConfig || !adminConfig.vendor_auction_duration_setting;
  const prixBaseLibre  = !adminConfig || !adminConfig.vendor_base_price_setting;
  const prixReserveLibre = !adminConfig || !adminConfig.vendor_reserve_price_setting;

  // ── Form state ────────────────────────────────────────────────────────────
  const defaultFin = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16);
  const [form, setForm] = useState<FormEnchere>({
    dateDebut: '',
    dateFin: defaultFin,
    prixBase: '',
    prixReserve: String(produit.prix),
    procuration: false,
    popcorn: false,
    popcornDelaiMises: '',
    popcornDelaiOffres: '',
    popcornNbFois: '',
  });
  const [erreurs, setErreurs] = useState<Partial<Record<keyof FormEnchere, string>>>({});

  const set = (k: keyof FormEnchere, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setErreurs(e => ({ ...e, [k]: undefined }));
  };

  const valider = () => {
    const e: Partial<Record<keyof FormEnchere, string>> = {};
    if (!form.dateDebut) e.dateDebut = 'Requis';
    if (!form.dateFin) e.dateFin = 'Requis';
    if (!form.prixBase || isNaN(Number(form.prixBase)) || Number(form.prixBase) <= 0) e.prixBase = 'Prix valide requis';
    if (!form.prixReserve || isNaN(Number(form.prixReserve)) || Number(form.prixReserve) <= 0) e.prixReserve = 'Prix valide requis';
    if (form.popcorn) {
      if (!form.popcornDelaiMises) e.popcornDelaiMises = 'Requis';
      if (!form.popcornDelaiOffres) e.popcornDelaiOffres = 'Requis';
      if (!form.popcornNbFois) e.popcornNbFois = 'Requis';
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  // ── Styles réutilisables ──────────────────────────────────────────────────
  const sectionGrise: React.CSSProperties = { opacity: 0.45, pointerEvents: 'none', userSelect: 'none' };
  const badgeVerrouille = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', marginLeft: '8px' }}>
      🔒 Imposé par l'admin
    </span>
  );

  const renderSection = (title: string, subtitle: string, children: React.ReactNode, desactive = false, msgTooltip = 'Non autorisé par l\'administrateur') => {
    const contenu = (
      <div style={{ border: `1px solid ${desactive ? '#e5e7eb' : T.border}`, borderRadius: '10px', marginBottom: '16px', background: desactive ? '#f9fafb' : '#fff' }}>
        <div style={{ background: desactive ? '#f3f4f6' : '#f8fafc', borderBottom: `1px solid ${desactive ? '#e5e7eb' : T.border}`, padding: '14px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: desactive ? T.textLight : T.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{title}</div>
          <div style={{ fontSize: '12px', color: T.textLight, marginTop: '2px' }}>{subtitle}</div>
          {desactive && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280' }}>
              🔒 Non autorisé par l'administrateur
            </div>
          )}
        </div>
        <div style={{ padding: '18px', ...(desactive ? sectionGrise : {}) }}>{children}</div>
      </div>
    );

    if (desactive) {
      return (
        <TooltipNonAutorise message={msgTooltip}>
          {contenu}
        </TooltipNonAutorise>
      );
    }
    return contenu;
  };

  // Input avec support verrouillage admin
  const inputField = (label: string, key: keyof FormEnchere, type = 'text', prefix?: string, placeholder?: string, verrouille = false) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '6px' }}>
        {label} <span style={{ color: T.danger, marginLeft: '2px' }}>*</span>
        {verrouille && badgeVerrouille}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${erreurs[key] ? T.danger : verrouille ? '#d1d5db' : T.border}`, borderRadius: '7px', overflow: 'hidden', background: verrouille ? '#f3f4f6' : '#fff' }}>
        {prefix && <span style={{ padding: '0 10px', background: '#f1f5f9', borderRight: `1px solid ${T.border}`, color: T.textLight, fontSize: '13px', height: '38px', display: 'flex', alignItems: 'center' }}>{prefix}</span>}
        <input
          type={type}
          value={form[key] as string}
          onChange={e => !verrouille && set(key, e.target.value)}
          placeholder={placeholder}
          disabled={verrouille}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 12px', fontSize: '13px', color: verrouille ? T.textLight : T.text, background: 'transparent', cursor: verrouille ? 'not-allowed' : 'text' }}
        />
        {verrouille && <span style={{ padding: '0 10px', color: '#9ca3af', fontSize: '14px' }}>🔒</span>}
      </div>
      {erreurs[key] && <div style={{ fontSize: '11px', color: T.danger, marginTop: '3px' }}>{erreurs[key]}</div>}
    </div>
  );

  if (chargementConfig) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: T.textLight, fontSize: '13px' }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* En-tête */}
        <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, #0f766e 100%)`, padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔨 Créer une enchère
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                Ajoutez une enchère à votre produit
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          {/* Détails produit */}
          <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '20px' }}>
            <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const }}>Produit ID</span><div style={{ fontSize: '13px', color: '#fff', fontWeight: '700', fontFamily: 'monospace' }}>{produit.id}</div></div>
            <div style={{ flex: 1 }}><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const }}>Nom du produit</span><div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{produit.nom}</div></div>
            <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const }}>Prix actuel</span><div style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>{produit.prix.toFixed(2)} $</div></div>
          </div>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

          {/* Durée */}
          {renderSection(
            'Durée de la vente aux enchères',
            datesLibres
              ? 'Définissez la durée de votre vente aux enchères.'
              : `Durée imposée par l'administrateur : début dans ${adminConfig?.default_start_days || 0} j, fin dans ${adminConfig?.default_end_days || 2} j.`,
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {inputField('De', 'dateDebut', 'datetime-local', undefined, 'Date et heure de début', !datesLibres)}
              {inputField('À', 'dateFin', 'datetime-local', undefined, undefined, !datesLibres)}
            </div>,
            false
          )}

          {/* Prix */}
          {renderSection('Prix', 'Ajoutez un prix de base et un prix de réserve.',
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {inputField('Prix de base', 'prixBase', 'number', '$', 'Entrez le prix de base ici', !prixBaseLibre)}
                {inputField('Prix de réserve', 'prixReserve', 'number', '$', undefined, !prixReserveLibre)}
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: '#92400e' }}>
                <strong>Prix de base</strong> — Le prix à partir duquel les enchères commenceront.<br />
                <strong>Prix de réserve</strong> — Le prix cible que votre enchère devrait atteindre.
              </div>
            </>
          )}

          {/* Mise en place */}
          {renderSection('Mise en place des enchères', 'Paramètres avancés configurés dans Configuration → Enchères.',
            <div style={{ color: T.textLight, fontSize: '13px', fontStyle: 'italic' }}>Les paramètres d'incrément minimum sont définis par l'administrateur.</div>
          )}

          {/* Enchères par procuration */}
          {renderSection(
            'Enchères par procuration',
            'Autorisez le client à soumettre une offre automatiquement.',
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: T.text, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>Enchères automatiques</div>
                <div style={{ fontSize: '12px', color: T.textLight, marginTop: '2px' }}>Permet aux acheteurs de définir une mise maximum automatique</div>
              </div>
              <Toggle checked={form.procuration} onChange={v => proxyAutorise && set('procuration', v)} />
            </div>,
            !proxyAutorise,
            'La mise par procuration n\'est pas autorisée par l\'administrateur'
          )}

          {/* Enchères Popcorn */}
          {renderSection(
            'Enchères de pop-corn 🍿',
            'Activez les enchères popcorn pour prolonger le délai à chaque nouvelle mise.',
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.popcorn ? '16px' : '0' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: T.text, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>Activer les enchères de pop-corn</div>
                  <div style={{ fontSize: '12px', color: T.textLight, marginTop: '2px' }}>Le délai final est prolongé à chaque nouvelle mise</div>
                </div>
                <Toggle checked={form.popcorn} onChange={v => popcornAutorise && set('popcorn', v)} />
              </div>

              {form.popcorn && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '16px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Prolonger les mises dans <span style={{ color: T.danger }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: T.textLight, whiteSpace: 'nowrap' as const }}>minutes</span>
                      <input type="number" value={form.popcornDelaiMises} onChange={e => set('popcornDelaiMises', e.target.value)} placeholder="ex: 5" style={{ flex: 1, border: `1px solid ${erreurs.popcornDelaiMises ? T.danger : T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    {erreurs.popcornDelaiMises && <div style={{ fontSize: '11px', color: T.danger, marginTop: '3px' }}>Requis</div>}
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Prolonger les offres de <span style={{ color: T.danger }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: T.textLight, whiteSpace: 'nowrap' as const }}>minutes</span>
                      <input type="number" value={form.popcornDelaiOffres} onChange={e => set('popcornDelaiOffres', e.target.value)} placeholder="ex: 3" style={{ flex: 1, border: `1px solid ${erreurs.popcornDelaiOffres ? T.danger : T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    {erreurs.popcornDelaiOffres && <div style={{ fontSize: '11px', color: T.danger, marginTop: '3px' }}>Requis</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Nombre max de prolongations <span style={{ color: T.danger }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: T.textLight }}>×</span>
                      <input type="number" value={form.popcornNbFois} onChange={e => set('popcornNbFois', e.target.value)} placeholder="ex: 10" style={{ flex: 1, border: `1px solid ${erreurs.popcornNbFois ? T.danger : T.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    {erreurs.popcornNbFois && <div style={{ fontSize: '11px', color: T.danger, marginTop: '3px' }}>Requis</div>}
                  </div>
                </div>
              )}
            </>,
            !popcornAutorise,
            'Les enchères popcorn ne sont pas autorisées par l\'administrateur'
          )}
        </div>

        {/* Footer actions */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', gap: '10px', background: '#f8fafc', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: T.textLight, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={() => { if (valider()) onSave(form, false); }} style={{ flex: 1, padding: '10px', background: T.teal, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>
            💾 Sauvegarder
          </button>
          <button onClick={() => { if (valider()) onSave(form, true); }} style={{ flex: 1.5, padding: '10px', background: `linear-gradient(135deg, ${T.teal}, #0f766e)`, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(13,148,136,0.35)' }}>
            🚀 Sauvegarder et commencer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POPUP VOIR ENCHÈRE
// ─────────────────────────────────────────────────────────────────────────────
function PopupVoirEnchere({ enchere, onClose, onEnchereArretee }: { enchere: EnchereVendeur; onClose: () => void; onEnchereArretee?: (id: string) => void }) {
  const statutColors: Record<StatutEnchere, { color: string; bg: string; label: string }> = {
    en_cours:  { color: T.success, bg: T.successLight, label: '🔴 En cours' },
    a_venir:   { color: T.warning, bg: T.warningLight, label: '⏳ À venir' },
    terminee:  { color: T.textLight, bg: '#f1f5f9', label: '✅ Terminée' },
    annulee:   { color: T.danger, bg: T.dangerLight, label: '⛔ Annulée' },
  };
  const sc = statutColors[enchere.statut];
  const [mises, setMises] = useState<MiseVendeur[]>([]);
  const [chargementMises, setChargementMises] = useState(true);
  const [vendeurPeutArreter, setVendeurPeutArreter] = useState(false);
  const [arretEnCours, setArretEnCours] = useState(false);
  const [msgArret, setMsgArret] = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        // Charger les mises reelles
        const resMises = await fetch(`${API_ENCHERES}/${enchere.id}/mises`);
        if (resMises.ok) {
          const data = await resMises.json();
          setMises(Array.isArray(data) ? data : []);
        }
        // Charger si admin permet au vendeur d'arreter
        const resConfig = await fetch(`${API_ADMIN_ENC}/vendeur-config`);
        if (resConfig.ok) {
          const cfg = await resConfig.json();
          setVendeurPeutArreter(!!cfg.vendor_can_stop_auction);
        }
      } catch (e) {
        console.warn('Erreur chargement popup enchere:', e);
      } finally {
        setChargementMises(false);
      }
    };
    charger();
  }, [enchere.id]);

  const handleArreterEnchere = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir arrêter cette enchère? Les tags Shopify seront retirés et le produit redeviendra une annonce normale.')) return;
    setArretEnCours(true);
    try {
      const res = await fetch(`${API_ENCHERES}/${enchere.id}/terminer`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMsgArret('✅ Enchère arrêtée avec succès. Les tags Shopify ont été retirés.');
      if (onEnchereArretee) onEnchereArretee(enchere.id);
    } catch (err: any) {
      setMsgArret('❌ ' + err.message);
    } finally {
      setArretEnCours(false);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* En-tête */}
        <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`, padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>🔨 Suivi de l'enchère</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{enchere.produit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge label={sc.label} color={sc.color} bg="rgba(255,255,255,0.2)" />
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginTop: '14px' }}>
            {[
              { label: 'Mise courante', value: enchere.miseCourante > 0 ? `CAD ${enchere.miseCourante.toFixed(2)}` : '—', color: '#fff' },
              { label: 'Prix réserve', value: enchere.prixReserve ? `CAD ${enchere.prixReserve.toFixed(2)}` : '—', color: enchere.reserveAtteinte ? '#6ee7b7' : '#fca5a5' },
              { label: 'Nb. de mises', value: String(enchere.nbMises), color: '#fff' },
              { label: 'Enchérisseurs', value: String(mises.filter((m, i, arr) => arr.findIndex(x => x.acheteur_id === m.acheteur_id) === i).length), color: '#fff' },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>{k.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: k.color, marginTop: '3px' }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* Infos enchère */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '9px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, marginBottom: '10px' }}>Détails de l'enchère</div>
              {[
                ['ID', <code key="id" style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{enchere.id}</code>],
                ['Début', enchere.dateDebut],
                ['Fin', enchere.dateFin],
                ['Prix de base', `CAD ${enchere.prixBase.toFixed(2)}`],
                ['Procuration', enchere.procuration ? '✅ Activée' : '❌ Non'],
                ['Popcorn', enchere.popcorn ? '🍿 Activée' : '❌ Non'],
              ].map(([l, v]) => (
                <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: '12px' }}>
                  <span style={{ color: T.textLight }}>{l}</span>
                  <span style={{ color: T.text, fontWeight: '600' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '9px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, marginBottom: '10px' }}>Timer en direct</div>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CountdownTimer dateFin={enchere.dateFin} />
                <div style={{ fontSize: '11px', color: T.textLight, marginTop: '10px' }}>Temps restant</div>
              </div>
              <div style={{ background: enchere.reserveAtteinte ? T.successLight : T.warningLight, borderRadius: '7px', padding: '8px 12px', textAlign: 'center', marginTop: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: enchere.reserveAtteinte ? T.success : T.warning }}>
                  {enchere.reserveAtteinte ? '✅ Réserve atteinte' : '⚠️ Réserve non atteinte'}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau mises reelles */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: T.text, marginBottom: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
              🔨 Historique des mises ({mises.length})
            </div>
            {chargementMises ? (
              <div style={{ textAlign: 'center', padding: '30px', color: T.textLight, fontSize: '13px' }}>⏳ Chargement des mises...</div>
            ) : mises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: T.textLight, fontSize: '13px', background: '#f8fafc', borderRadius: '9px' }}>Aucune mise pour le moment.</div>
            ) : (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '9px', overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      {['#','Enchérisseur','Courriel','Montant','Type','Statut','Date'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mises.map((m, i) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}`, background: m.est_gagnante ? '#f0fdf4' : i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: T.textLight }}>#{i + 1}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: T.text }}>{m.acheteur_nom || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: T.textLight }}>{m.acheteur_email}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '800', color: m.est_gagnante ? T.success : T.text }}>
                          CAD {parseFloat(String(m.montant)).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge label={m.type_mise === 'proxy' ? '🤖 Proxy' : m.type_mise === 'auto_proxy' ? '⚡ Auto' : '👤 Normal'} color={m.type_mise !== 'normale' ? T.purple : T.textLight} bg={m.type_mise !== 'normale' ? T.purpleLight : '#f1f5f9'} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {m.est_gagnante ? <Badge label="🏆 Gagnante" color={T.success} bg={T.successLight} /> : m.est_outbid ? <Badge label="Surpassée" color={T.textLight} bg="#f1f5f9" /> : <Badge label="Active" color={T.accent} bg={T.accentLight} />}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: T.textLight, whiteSpace: 'nowrap' as const }}>
                          {new Date(m.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          {/* Message arret */}
          <div style={{ flex: 1 }}>
            {msgArret && (
              <div style={{ fontSize: '12px', fontWeight: '600', color: msgArret.startsWith('✅') ? T.success : T.danger, background: msgArret.startsWith('✅') ? T.successLight : T.dangerLight, padding: '7px 12px', borderRadius: '7px', display: 'inline-block' }}>
                {msgArret}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Bouton arreter enchere */}
            {enchere.statut === 'en_cours' && vendeurPeutArreter && !msgArret.startsWith('✅') && (
              <button
                onClick={handleArreterEnchere}
                disabled={arretEnCours}
                style={{ padding: '9px 18px', background: arretEnCours ? '#f1f5f9' : T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: T.danger, cursor: arretEnCours ? 'not-allowed' : 'pointer', opacity: arretEnCours ? 0.6 : 1 }}
              >
                {arretEnCours ? '⏳ Arrêt en cours...' : "⛔ Arrêter l'enchère"}
              </button>
            )}
            {enchere.statut === 'en_cours' && !vendeurPeutArreter && (
              <div title="Non autorisé par l'administrateur" style={{ padding: '9px 18px', background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', color: T.textLight, cursor: 'not-allowed' }}>
                🔒 Arrêt non autorisé
              </div>
            )}
            <button onClick={onClose} style={{ padding: '9px 20px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: T.textLight, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL NOTES (CORRIGÉE)
// ─────────────────────────────────────────────────────────────────────────────
function ModalNotes({ produit, onAjouterNote, onSupprimerNote, onFermer }: {
  produit: Produit;
  onAjouterNote: (contenu: string) => Promise<void>;
  onSupprimerNote: (noteId: number) => Promise<void>;
  onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!nouvelleNote.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAjouterNote(nouvelleNote.trim());
      setNouvelleNote('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupprimer = async (noteId: number) => {
    if (suppressionEnCours) return;
    setSuppressionEnCours(noteId);
    try {
      await onSupprimerNote(noteId);
    } finally {
      setSuppressionEnCours(null);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onFermer()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header avec gradient */}
        <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>Notes internes</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0 0' }}>{produit.nom} · {produit.id}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Infos rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Stock', val: produit.stock, icon: '📦' },
              { label: 'Ventes', val: produit.totalVentes || 0, icon: '💰' },
              { label: 'Note', val: produit.note ? produit.note.toFixed(1) + ' ★' : 'N/A', icon: '⭐', alert: produit.note && produit.note < 3 },
            ].map((k, i) => (
              <div key={i} style={{ background: k.alert ? T.dangerLight : '#f8fafc', border: `1px solid ${k.alert ? '#fecaca' : T.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: k.alert ? T.danger : T.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: T.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Historique des notes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
              📋 Historique des notes ({produit.notes?.length || 0})
            </h4>

            {!produit.notes || produit.notes.length === 0 ? (
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>
                Aucune note pour ce produit.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...(produit.notes || [])].reverse().map(note => (
                  <div key={note.id} style={{ background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: T.textLight }}>{note.date}</span>
                      {/* Bouton supprimer note */}
                      <button
                        onClick={() => handleSupprimer(note.id)}
                        disabled={suppressionEnCours === note.id}
                        title="Supprimer cette note"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: suppressionEnCours === note.id ? 'wait' : 'pointer',
                          color: suppressionEnCours === note.id ? T.textLight : T.danger,
                          fontSize: '14px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: suppressionEnCours === note.id ? 0.5 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (suppressionEnCours !== note.id) e.currentTarget.style.background = T.dangerLight; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                      >
                        🗑️
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: T.text, margin: 0, lineHeight: '1.6' }}>{note.contenu}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ajouter une note */}
          <div style={{ background: T.accentLight, border: `1px solid #bfdbfe`, borderRadius: '10px', padding: '14px 16px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              ✏️ Ajouter une note
            </h4>
            <textarea
              value={nouvelleNote}
              onChange={e => setNouvelleNote(e.target.value)}
              rows={3}
              placeholder="Note personnelle (visible uniquement par vous)"
              disabled={isSubmitting}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit', opacity: isSubmitting ? 0.7 : 1 }}
            />
            <button
              onClick={handleSubmit}
              disabled={!nouvelleNote.trim() || isSubmitting}
              style={{ background: (nouvelleNote.trim() && !isSubmitting) ? T.accent : '#93c5fd', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '700', cursor: (nouvelleNote.trim() && !isSubmitting) ? 'pointer' : 'not-allowed' }}>
              {isSubmitting ? '⏳ Enregistrement...' : '💾 Enregistrer la note'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, background: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', background: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL MARQUER COMME VENDU
// ─────────────────────────────────────────────────────────────────────────────
function ModalMarquerVendu({ isOpen, produit, onConfirm, onCancel }: {
  isOpen: boolean;
  produit: Produit | null;
  onConfirm: (quantite: number, prixVente: number) => void;
  onCancel: () => void;
}) {
  const [quantite, setQuantite] = useState(1);
  const [prixVente, setPrixVente] = useState(produit?.prix || 0);

  if (!isOpen || !produit) return null;

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header avec gradient */}
        <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, #0f766e 100%)`, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💰</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>Marquer comme vendu</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0 0' }}>{produit.nom}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px' }}>
          
          {/* Info produit */}
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Stock actuel</p>
                <p style={{ fontSize: '18px', fontWeight: '800', color: produit.stock > 0 ? T.success : T.danger, margin: '4px 0 0 0' }}>
                  {produit.stock} unité(s)
                </p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Prix unitaire</p>
                <p style={{ fontSize: '18px', fontWeight: '800', color: T.accent, margin: '4px 0 0 0' }}>
                  {produit.prix.toFixed(2)} $
                </p>
              </div>
            </div>
          </div>

          {/* Quantité à vendre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: T.text, display: 'block', marginBottom: '8px' }}>
              Quantité vendue
            </label>
            <input
              type="number"
              min="1"
              max={produit.stock}
              value={quantite}
              onChange={(e) => setQuantite(Math.min(parseInt(e.target.value) || 1, produit.stock))}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${T.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '11px', color: T.textLight, margin: '4px 0 0 0' }}>
              Maximum: {produit.stock} unité(s)
            </p>
          </div>

          {/* Prix de vente */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: T.text, display: 'block', marginBottom: '8px' }}>
              Prix de vente (par unité)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={prixVente}
              onChange={(e) => setPrixVente(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${T.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Total */}
          <div style={{ background: T.tealLight, borderRadius: '8px', padding: '16px', marginBottom: '20px', border: `1px solid ${T.teal}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: T.teal }}>Total de la vente</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: T.teal }}>{(quantite * prixVente).toFixed(2)} $</span>
            </div>
          </div>
        </div>

        {/* Footer avec boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, background: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', background: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(quantite, prixVente)}
            disabled={quantite < 1 || quantite > produit.stock}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: (quantite >= 1 && quantite <= produit.stock) ? 'pointer' : 'not-allowed',
              background: (quantite >= 1 && quantite <= produit.stock) ? T.success : '#cccccc',
              color: 'white',
            }}>
            ✅ Confirmer la vente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────
function ModalConfirmation({ isOpen, type, produit, produitsCount = 0, onConfirm, onCancel }: {
  isOpen: boolean;
  type: ActionType;
  produit: Produit | null;
  produitsCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  
  if (!isOpen || !type) return null;

  const isBulk = type.includes('_bulk');
  const isSupprimer = type === 'supprimer' || type === 'supprimer_bulk';
  const isDesactiver = type === 'desactiver' || type === 'desactiver_bulk';
  const isActiver = type === 'activer' || type === 'activer_bulk';
  const isVendre = type === 'vendre' || type === 'vendre_bulk';
  
  const MOT_CONFIRMATION = 'CONFIRMER';
  const confirmationValide = confirmation === MOT_CONFIRMATION;

  const getTitle = () => {
    if (isBulk) {
      if (isSupprimer) return `SUPPRIMER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isDesactiver) return `DÉSACTIVER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isActiver) return `ACTIVER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isVendre) return `MARQUER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''} COMME VENDU${produitsCount > 1 ? 'S' : ''}`;
    } else {
      if (isSupprimer) return 'SUPPRIMER CE PRODUIT';
      if (isDesactiver) return 'DÉSACTIVER CE PRODUIT';
      if (isActiver) return 'ACTIVER CE PRODUIT';
      if (isVendre) return 'MARQUER CE PRODUIT COMME VENDU';
    }
    return '';
  };

  const getWarningMessage = () => {
    if (isBulk) {
      if (isSupprimer) return 'Cette action est irréversible';
      if (isDesactiver) return 'Les produits seront temporairement désactivés';
      if (isActiver) return 'Les produits seront de nouveau actifs';
      if (isVendre) return 'Les produits seront marqués comme vendus';
    } else {
      if (isSupprimer) return 'Cette action est irréversible';
      if (isDesactiver) return 'Le produit sera temporairement désactivé';
      if (isActiver) return 'Le produit sera de nouveau actif';
      if (isVendre) return 'Le produit sera marqué comme vendu';
    }
    return '';
  };

  const getIcon = () => {
    if (isSupprimer) return '🗑️';
    if (isDesactiver) return '⚠️';
    if (isActiver) return '✅';
    if (isVendre) return '💰';
    return '📋';
  };

  const getButtonColor = () => {
    if (isSupprimer) return T.danger;
    if (isDesactiver) return T.warning;
    if (isActiver) return T.success;
    if (isVendre) return T.success;
    return T.accent;
  };

  const getButtonText = () => {
    if (isBulk) {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isActiver) return 'Confirmer l\'activation';
      if (isVendre) return 'Confirmer la vente';
    } else {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isActiver) return 'Confirmer l\'activation';
      if (isVendre) return 'Confirmer la vente';
    }
    return 'Confirmer';
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header avec gradient */}
        <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{getIcon()}</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>{getTitle()}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0 0' }}>{getWarningMessage()}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Informations */}
          <div style={{ background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            {!isBulk && produit && (
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: T.accent, margin: 0 }}>{produit.nom}</p>
                <p style={{ fontSize: '12px', color: T.textLight, margin: '2px 0 0 0' }}>{produit.id} · {produit.sku}</p>
              </div>
            )}
            
            <p style={{ fontSize: '13px', color: T.text, margin: 0, lineHeight: '1.6' }}>
              {isSupprimer ? (
                isBulk ? (
                  <>
                    <strong>⚠️ Attention :</strong> Cette action supprimera définitivement ces produits.
                    <br />• Cette action est irréversible
                    <br />• Les produits ne seront plus disponibles
                    <br />• L'historique des ventes sera conservé
                  </>
                ) : (
                  <>
                    <strong>⚠️ Attention :</strong> Vous êtes sur le point de supprimer ce produit.
                    <br /><br />
                    <strong>Cette action supprimera définitivement :</strong>
                    <br />• Le produit "{produit?.nom}"
                    <br />• Toutes les données associées
                    <br />• L'historique des ventes
                  </>
                )
              ) : isDesactiver ? (
                isBulk ? (
                  <>
                    <strong>⚠️ En désactivant ces produits :</strong>
                    
                    <br />• Ils ne pourront plus être achetés
                    <br />• Vous pourrez les réactiver ultérieurement
                  </>
                ) : (
                  <>
                    <strong>⚠️ En désactivant ce produit :</strong>
                    
                    <br />• Il ne pourra plus être acheté
                    <br />• Vous pourrez le réactiver ultérieurement
                  </>
                )
              ) : isActiver ? (
                isBulk ? (
                  <>
                    <strong>✅ En activant ces produits :</strong>
                    
                    <br />• Ils pourront être achetés
                  </>
                ) : (
                  <>
                    <strong>✅ En activant ce produit :</strong>
                    
                    <br />• Il pourra être acheté
                  </>
                )
              ) : isVendre ? (
                isBulk ? (
                  <>
                    <strong>💰 En marquant ces produits comme vendus :</strong>
                    <br />• Ils ne seront plus disponibles à la vente
                    <br />• Le stock sera mis à jour
                    <br />• Cette action peut être réversible
                  </>
                ) : (
                  <>
                    <strong>💰 En marquant ce produit comme vendu :</strong>
                    <br />• Il ne sera plus disponible à la vente
                    <br />• Le stock sera mis à jour
                    <br />• Cette action peut être réversible
                  </>
                )
              ) : null}
            </p>
          </div>

          {/* Champ de confirmation pour la suppression */}
          {isSupprimer && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: T.text, display: 'block', marginBottom: '8px' }}>
                Tapez <strong style={{ color: T.danger }}>{MOT_CONFIRMATION}</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder={MOT_CONFIRMATION}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `2px solid ${confirmationValide ? T.success : T.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: '1px',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                }}
              />
              {confirmation && !confirmationValide && (
                <p style={{ fontSize: '12px', color: T.danger, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Le texte de confirmation ne correspond pas
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, background: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', background: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isSupprimer && !confirmationValide}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: (isSupprimer && !confirmationValide) ? 'not-allowed' : 'pointer',
              background: (isSupprimer && !confirmationValide) ? '#cccccc' : getButtonColor(),
              color: 'white',
            }}>
            {(isSupprimer && confirmationValide) ? '✅ ' + getButtonText() : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL IMPORT CSV
// ─────────────────────────────────────────────────────────────────────────────
function ModalImportCSV({ isOpen, onConfirm, onCancel }: {
  isOpen: boolean;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header avec gradient */}
        <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, #0f766e 100%)`, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>Importer des produits</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0 0' }}>Fichier CSV</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Zone de drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? T.teal : T.border}`,
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? T.tealLight : '#f8fafc',
              transition: 'all 0.2s',
              marginBottom: '20px',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: T.text, margin: '0 0 4px 0' }}>
              {file ? file.name : 'Cliquez ou glissez un fichier CSV'}
            </p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
              {file ? `${(file.size / 1024).toFixed(2)} Ko` : 'Format accepté : .csv'}
            </p>
          </div>

          {/* Instructions */}
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: `1px solid ${T.border}` }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>Format attendu :</h4>
            <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px 0' }}>• id, nom, sku, prix, stock, typeVente, statut, categorie</p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px 0' }}>• La première ligne doit contenir les en-têtes</p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>• Taille maximale : 5 Mo</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, background: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', background: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => file && onConfirm(file)}
            disabled={!file}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: file ? 'pointer' : 'not-allowed',
              background: file ? T.teal : '#cccccc',
              color: 'white',
            }}>
            {file ? '✅ Importer' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT POUR LE MENU DE TRI
// ─────────────────────────────────────────────────────────────────────────────
function MenuTri({ triOption, onTriChange }: { triOption: TriOption; onTriChange: (option: TriOption) => void }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const options: { value: TriOption; label: string }[] = [
    { value: 'id-asc', label: 'ID Produit (croissant)' },
    { value: 'nom-asc', label: 'Nom produit (A-Z)' },
    { value: 'prix-asc', label: 'Prix (croissant)' },
    { value: 'prix-desc', label: 'Prix (décroissant)' },
    { value: 'stock-asc', label: 'Stock (croissant)' },
    { value: 'stock-desc', label: 'Stock (décroissant)' },
    { value: 'date-desc', label: 'Date + récentes' },
    { value: 'typeVente-asc', label: 'Type de vente' },
    { value: 'source-asc', label: 'Source (A-Z)' },
    { value: 'vues-desc', label: 'Vues (décroissant)' },
  ];

  const getLabel = () => {
    const option = options.find(o => o.value === triOption);
    return option ? option.label : 'Trier par';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMenuOuvert(!menuOuvert)}
        style={{
          background: 'white',
          color: T.accent,
          border: `2px solid ${T.accent}`,
          borderRadius: '8px',
          padding: '9px 18px',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        🔽 {getLabel()}
      </button>
      
      {menuOuvert && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '45px',
          background: 'white',
          border: `1px solid ${T.border}`,
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          minWidth: '220px',
        }}>
          <div style={{ padding: '4px 0' }}>
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onTriChange(option.value);
                  setMenuOuvert(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  background: triOption === option.value ? T.accentLight : 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: T.text,
                  fontWeight: triOption === option.value ? '700' : '400',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = triOption === option.value ? T.accentLight : 'transparent'}
              >
                {option.label} {triOption === option.value && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU 3 POINTS AMÉLIORÉ
// ─────────────────────────────────────────────────────────────────────────────
function Menu3Points({ produit, onEnchere, onActiver, onDesactiver, onSupprimer, onNotes, onVendre, onBulkEdit, onDupliquer, naviguerVers, modeEncheres }: {
  produit: Produit;
  onEnchere: () => void;
  onActiver: () => void;
  onDesactiver: () => void;
  onSupprimer: () => void;
  onNotes: () => void;
  onVendre: () => void;
  onBulkEdit: () => void;
  onDupliquer: () => void;
  naviguerVers?: (page: string) => void;
  modeEncheres?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const item = (label: string, icon: string, onClick: () => void, color = T.text, disabled = false) => (
    <button
      key={label}
      onClick={() => { if (!disabled) { onClick(); setOuvert(false); } }}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '9px 14px',
        fontSize: '13px',
        color: disabled ? T.textLight : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = '#f0f4f8')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = 'none')}>
      <span style={{ fontSize: '15px' }}>{icon}</span>{label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOuvert(!ouvert)} style={{ background: '#f0f0f0', border: `1px solid ${T.border}`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '16px', color: T.text, display: 'flex', alignItems: 'center', minWidth: '36px', justifyContent: 'center' }}
        title="Actions">⋮</button>
      {ouvert && (
        <div style={{ position: 'fixed', right: 'auto', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '9px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, minWidth: '220px', overflow: 'hidden',
          top: (() => { const r = ref.current?.getBoundingClientRect(); return r ? (r.bottom + 240 > window.innerHeight ? r.top - 245 : r.bottom + 4) : 0; })() + 'px',
          left: (() => { const r = ref.current?.getBoundingClientRect(); return r ? Math.min(r.right - 220, window.innerWidth - 228) : 0; })() + 'px',
        }}>
          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${T.border}`, background: '#f8fafc' }}>Actions</div>
          
          {/* Voir en boutique */}
          {item('Voir en boutique', '👁️', () => {
            const id = String(produit.id).replace('#', '');
            const url = `https://e-vend.ca/produit/${id}`;
            const newTab = window.open(url, '_blank', 'noopener,noreferrer');
            if (newTab) newTab.opener = null;
          }, T.text)}
          
          {/* MODIFIER */}
          {item('Modifier', '✏️', () => { 
            const safeId = produit.id.replace('#', '');
            naviguerVers && naviguerVers(`modifier-annonce?id=${safeId}`); 
          }, T.text)}
          
          {/* Dupliquer */}
          {item('Dupliquer', '📋', () => {
            if (naviguerVers) {
              const safeId = produit.id.replace('#', '');
              naviguerVers(`creer-annonce?dupliquer=${safeId}`);
            }
          }, T.text)}
          
          {/* Notes internes */}
          {item('Notes internes', '📋', onNotes, T.accent)}
          
          {/* Modification groupée */}
          {item('Modification groupée', '✏️', onBulkEdit, T.purple)}
          
          <div style={{ borderTop: `1px solid ${T.border}` }} />
          
          {/* Vente par enchère */}
          {item('Vente par enchère 🔒', '🔨', modeEncheres === false ? () => {} : onEnchere, modeEncheres === false ? T.textLight : T.teal, modeEncheres === false)}
          
          {/* Marquer comme vendu */}
          {item('Marquer comme vendu', '💰', onVendre, T.success)}
          
          <div style={{ borderTop: `1px solid ${T.border}` }} />
          
          {/* Activer/Désactiver */}
          {produit.statut === 'inactif' || produit.statut === 'en_attente'
            ? item('Activer', '✅', onActiver, T.success)
            : item('Désactiver', '🚫', onDesactiver, T.warning, produit.statut === 'vendu')}
          
          <div style={{ borderTop: `1px solid ${T.border}` }} />
          
          {/* Supprimer */}
          {item('Supprimer', '🗑️', onSupprimer, T.danger)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT HELPER POUR LES ITEMS DU MENU
// ─────────────────────────────────────────────────────────────────────────────
function MenuItem({ children, onClick, style = {} }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 14px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        color: T.text,
        transition: 'background-color 0.2s',
        whiteSpace: 'nowrap' as const,
        ...style
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET LISTE DES PRODUITS
// ─────────────────────────────────────────────────────────────────────────────
function OngletListeProduits({ onEnchere, produits, setProduits, onNotes, onVendre, onBulkEdit, onDupliquer, afficherToast, naviguerVers, modeEncheres }: {
  onEnchere: (p: Produit) => void;
  produits: Produit[];
  setProduits: React.Dispatch<React.SetStateAction<Produit[]>>;
  onNotes: (p: Produit) => void;
  onVendre: (p: Produit) => void;
  onBulkEdit: (produitsSelectionnes: string[]) => void;
  onDupliquer: (p: Produit) => void;
  modeEncheres?: boolean;
  afficherToast: (msg: string, type?: 'success' | 'error') => void;
  naviguerVers?: (page: string) => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | StatutProduit>('tous');
  const [filtreType, setFiltreType] = useState<'tous' | TypeVente>('tous');
  const [filtreSource, setFiltreSource] = useState<'tous' | SourceAnnonce>('tous');
  const [triOption, setTriOption] = useState<TriOption>('date-desc');
  const [produitsSelectionnes, setProduitsSelectionnes] = useState<string[]>([]);
  const [menuActionGroupesOuvert, setMenuActionGroupesOuvert] = useState(false);
  const [pageProduits, setPageProduits] = useState(1);
  const [syncEnCours, setSyncEnCours] = useState(false);
  const [resynEnCours, setResynEnCours] = useState(false);
  const [syncModalOuvert, setSyncModalOuvert] = useState(false);
  const [syncLogs, setSyncLogs] = useState<{ type: 'info' | 'success' | 'error' | 'done'; msg: string }[]>([]);
  const [syncTermine, setSyncTermine] = useState(false);
  const [syncStats, setSyncStats] = useState<{ synchronises: number; erreurs: number } | null>(null);
  const [syncTitre, setSyncTitre] = useState('');
  const syncAbortRef = useRef<AbortController | null>(null);
  const syncLogsEndRef = useRef<HTMLDivElement>(null);

  const ajouterLog = (type: 'info' | 'success' | 'error' | 'done', msg: string) => {
    setSyncLogs(prev => [...prev, { type, msg }]);
    setTimeout(() => syncLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const ouvrirModalSync = (titre: string) => {
    setSyncTitre(titre); setSyncModalOuvert(true); setSyncLogs([]); setSyncTermine(false); setSyncStats(null);
  };
  const finSync = (synchronises: number, erreurs: number) => {
    setSyncStats({ synchronises, erreurs });
    ajouterLog('done', erreurs === 0
      ? `✅ Terminé ! ${synchronises} annonce(s) traitée(s) avec succès.`
      : `⚠️ Terminé avec ${erreurs} erreur(s). ${synchronises} annonce(s) réussie(s).`);
    setSyncTermine(true);
  };
  const rechargerProduits = async () => {
    const r = await fetch(API_PRODUITS, { headers: authHeaders() });
    if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setProduits(d); else if (d.produits) setProduits(d.produits); }
  };
  const handleSyncShopify = async () => {
    if (syncEnCours || resynEnCours) return;
    ouvrirModalSync('🔄 Synchroniser vers la boutique');
    setSyncEnCours(true);
    const ctrl = new AbortController(); syncAbortRef.current = ctrl;
    try {
      ajouterLog('info', '🔄 Connexion à la plateforme...');
      // Sync non disponible en Studio
      ajouterLog('info', '⚠️ Synchronisation non disponible en mode Studio.');
      finSync(0, 0);
    } catch (err: any) {
      if (err?.name === 'AbortError') { ajouterLog('info', '⛔ Arrêté par l\'utilisateur.'); finSync(0, 0); }
      else { ajouterLog('error', `❌ Erreur réseau : ${err?.message}`); finSync(0, 1); }
    } finally { setSyncEnCours(false); syncAbortRef.current = null; }
  };
  const handleResynchroComplete = async () => {
    if (syncEnCours || resynEnCours) return;
    ouvrirModalSync('🔁 Rafraîchir toutes les annonces');
    setResynEnCours(true);
    const ctrl = new AbortController(); syncAbortRef.current = ctrl;
    try {
      ajouterLog('info', '🔄 Connexion à la plateforme...');
      // Resync non disponible en Studio
      ajouterLog('info', '⚠️ Resynchronisation non disponible en mode Studio.');
      finSync(0, 0);
    } catch (err: any) {
      if (err?.name === 'AbortError') { ajouterLog('info', '⛔ Arrêté par l\'utilisateur.'); finSync(0, 0); }
      else { ajouterLog('error', `❌ Erreur réseau : ${err?.message}`); finSync(0, 1); }
    } finally { setResynEnCours(false); syncAbortRef.current = null; }
  };
  const handleStopSync = () => { if (syncAbortRef.current) syncAbortRef.current.abort(); };
  const handleFermerModalSync = () => { if (!syncEnCours && !resynEnCours) setSyncModalOuvert(false); };
  const PRODUITS_PAR_PAGE = 50;
  const [modalConfirmation, setModalConfirmation] = useState<{
    isOpen: boolean;
    type: ActionType;
    produit: Produit | null;
    produitsCount?: number;
  }>({
    isOpen: false,
    type: null,
    produit: null,
  });
  const menuActionRef = useRef<HTMLDivElement>(null);

  // Liste des sources disponibles pour le filtre
  const sourcesOptions: Array<'tous' | SourceAnnonce> = [
    'tous', 'e-Vend', 'Shopify', 'eBay', 'Amazone', 'Etsy', 'WooCommerce', 
    'Magento', 'BigCommerce', 'Square', 'SooPOS', 'Dytel POS', 'Squarespace', 'Linnworks'
  ];

  // Filtrer et trier les produits
  const filtresEtTries = useMemo(() => {
    let result = produits.filter(p => {
      const q = recherche.toLowerCase();
      const matchRech = p.nom.toLowerCase().includes(q) || p.id.includes(q) || p.sku.toLowerCase().includes(q);
      const matchStatut = filtreStatut === 'tous' || p.statut === filtreStatut;
      const matchType = filtreType === 'tous' || p.typeVente === filtreType;
      const matchSource = filtreSource === 'tous' || p.source === filtreSource;
      return matchRech && matchStatut && matchType && matchSource;
    });

    // Trier
    result = [...result].sort((a, b) => {
      switch(triOption) {
        case 'id-asc':
          return a.id.localeCompare(b.id);
        case 'nom-asc':
          return a.nom.localeCompare(b.nom);
        case 'prix-asc':
          return a.prix - b.prix;
        case 'prix-desc':
          return b.prix - a.prix;
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'date-desc':
          return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
        case 'typeVente-asc':
          return a.typeVente.localeCompare(b.typeVente);
        case 'source-asc':
          return (a.source || '').localeCompare(b.source || '');
        case 'vues-desc':
          return (b.vues || 0) - (a.vues || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [produits, recherche, filtreStatut, filtreType, filtreSource, triOption]);

  // Reset page quand les filtres changent
  useEffect(() => { setPageProduits(1); }, [recherche, filtreStatut, filtreType, filtreSource, triOption]);

  // Tranche visible selon la page courante
  const totalPagesProduits = Math.ceil(filtresEtTries.length / PRODUITS_PAR_PAGE);
  const produitsDeLaPage = filtresEtTries.slice(
    (pageProduits - 1) * PRODUITS_PAR_PAGE,
    pageProduits * PRODUITS_PAR_PAGE
  );

  const handleSelectionTous = () => {
    const idsDeLaPage = produitsDeLaPage.map(p => p.id);
    if (idsDeLaPage.every(id => produitsSelectionnes.includes(id))) {
      setProduitsSelectionnes(prev => prev.filter(id => !idsDeLaPage.includes(id)));
    } else {
      setProduitsSelectionnes(prev => prev.concat(idsDeLaPage.filter(id => !prev.includes(id))));
    }
  };

  const handleSelectionProduit = (id: string) => {
    setProduitsSelectionnes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleActionGroupe = (action: string) => {
    setMenuActionGroupesOuvert(false);
    if (produitsSelectionnes.length === 0) return;

    if (action === 'activer') {
      setModalConfirmation({
        isOpen: true,
        type: 'activer_bulk',
        produit: null,
        produitsCount: produitsSelectionnes.length,
      });
    } else if (action === 'desactiver') {
      setModalConfirmation({
        isOpen: true,
        type: 'desactiver_bulk',
        produit: null,
        produitsCount: produitsSelectionnes.length,
      });
    } else if (action === 'supprimer') {
      setModalConfirmation({
        isOpen: true,
        type: 'supprimer_bulk',
        produit: null,
        produitsCount: produitsSelectionnes.length,
      });
    } else if (action === 'bulkEdit') {
      onBulkEdit(produitsSelectionnes);
    }
  };

  const handleConfirmation = async () => {
    const { type, produit } = modalConfirmation;
    if (!type) return;
    setModalConfirmation({ isOpen: false, type: null, produit: null });

    // Récupérer le gestionnaireId depuis les props du composant parent via window ou props
    const gId = (window as any).__evend_gestionnaire_id__ || '';

    try {
      // Actions sur un seul produit
      if (type === 'activer' && produit) {
        const res = await fetch(`${API_PRODUITS}/${gId}/${produit.id.replace('#','')}/statut`, {
          method: 'PATCH', headers: authHeaders(),
          body: JSON.stringify({ statut: 'actif' }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
        setProduits(prev => prev.map(p => p.id === produit.id ? { ...p, statut: 'actif' } : p));
        afficherToast('✅ Produit activé');

      } else if (type === 'desactiver' && produit) {
        const res = await fetch(`${API_PRODUITS}/${gId}/${produit.id.replace('#','')}/statut`, {
          method: 'PATCH', headers: authHeaders(),
          body: JSON.stringify({ statut: 'inactif' }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
        setProduits(prev => prev.map(p => p.id === produit.id ? { ...p, statut: 'inactif' } : p));
        afficherToast('⚠️ Produit désactivé');

      } else if (type === 'supprimer' && produit) {
        const res = await fetch(`${API_PRODUITS}/${gId}/${produit.id}`, {
          method: 'DELETE', headers: authHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Erreur serveur');
        }
        setProduits(prev => prev.filter(p => p.id !== produit.id));
        afficherToast('🗑️ Produit supprimé');

      // Actions en masse
      } else if (type === 'activer_bulk') {
        await fetch(`${API_PRODUITS}/${gId}/bulk/statut`, {
          method: 'PATCH', headers: authHeaders(),
          body: JSON.stringify({ ids: produitsSelectionnes, statut: 'actif' }),
        });
        setProduits(prev => prev.map(p => produitsSelectionnes.includes(p.id) ? { ...p, statut: 'actif' } : p));
        setProduitsSelectionnes([]);
        afficherToast(`✅ ${produitsSelectionnes.length} produit(s) activé(s)`);

      } else if (type === 'desactiver_bulk') {
        await fetch(`${API_PRODUITS}/${gId}/bulk/statut`, {
          method: 'PATCH', headers: authHeaders(),
          body: JSON.stringify({ ids: produitsSelectionnes, statut: 'inactif' }),
        });
        setProduits(prev => prev.map(p => produitsSelectionnes.includes(p.id) ? { ...p, statut: 'inactif' } : p));
        setProduitsSelectionnes([]);
        afficherToast(`⚠️ ${produitsSelectionnes.length} produit(s) désactivé(s)`);

      } else if (type === 'supprimer_bulk') {
        await fetch(`${API_PRODUITS}/${gId}/bulk/supprimer`, {
          method: 'DELETE', headers: authHeaders(),
          body: JSON.stringify({ ids: produitsSelectionnes }),
        });
        setProduits(prev => prev.filter(p => !produitsSelectionnes.includes(p.id)));
        setProduitsSelectionnes([]);
        afficherToast(`🗑️ ${produitsSelectionnes.length} produit(s) supprimé(s)`);
      }
    } catch (err) {
      afficherToast("❌ Erreur lors de l'action", 'error');
    }
  };

  const statutLabel = (s: StatutProduit) => {
    if (s === 'actif') return <Badge label="✓ Actif" color={T.success} bg={T.successLight} />;
    if (s === 'inactif') return <Badge label="📝 Brouillon" color={T.textLight} bg="#f1f5f9" />;
    if (s === 'vendu') return <Badge label="💰 Vendu" color="#0369a1" bg="#e0f2fe" />;
    if (s === 'suspendu') return <Badge label="🚫 Suspendu (non-paiement)" color={T.danger} bg={T.dangerLight} />;
    return <Badge label="⏳ En attente" color={T.warning} bg={T.warningLight} />;
  };

  const typeLabel = (t: TypeVente) => t === 'enchere'
    ? <Badge label="🔨 Enchère" color={T.teal} bg={T.tealLight} />
    : <Badge label="📦 Standard" color={T.accent} bg={T.accentLight} />;

  const typeAnnonceLabel = (ta?: TypeAnnonce) => {
    if (ta === 'neuf') return <Badge label="Article neuf" color="#2d6a9f" bg="#e8f2fb" />;
    if (ta === 'occasion') return <Badge label="Article occasion" color="#b45309" bg="#ffedd5" />;
    if (ta === 'remis-a-neuf') return <Badge label="Remis à neuf" color="#6d28d9" bg="#ede9fe" />;
    return '—';
  };

  const sourceLabel = (source?: SourceAnnonce) => {
    if (!source) return '—';
    const colors: Record<SourceAnnonce, { color: string; bg: string }> = {
      'e-Vend': { color: T.teal, bg: T.tealLight },
      'Shopify': { color: '#96bf48', bg: '#f1f8e9' },
      'eBay': { color: '#0064d2', bg: '#e5f0ff' },
      'Amazone': { color: '#ff9900', bg: '#fff4e5' },
      'Etsy': { color: '#d5641c', bg: '#fef0e5' },
      'WooCommerce': { color: '#7e54a3', bg: '#f3eef9' },
      'Magento': { color: '#f26322', bg: '#fff0e6' },
      'BigCommerce': { color: '#2f8bcb', bg: '#eaf4fc' },
      'Square': { color: '#0070e0', bg: '#e5f0ff' },
      'SooPOS': { color: '#4a5568', bg: '#edf2f7' },
      'Dytel POS': { color: '#2d3748', bg: '#e2e8f0' },
      'Squarespace': { color: '#121212', bg: '#eaeaea' },
      'Linnworks': { color: '#00a1b0', bg: '#e5f6f8' },
    };
    const style = colors[source] || { color: T.textLight, bg: '#f1f5f9' };
    return <Badge label={source} color={style.color} bg={style.bg} />;
  };

  const etatLabel = (e?: EtatArticle) => {
    if (e === 'neuf') return '1. Neuf';
    if (e === 'comme-neuf') return '2. Comme neuf';
    if (e === 'tres-bon') return '3. Très bon';
    if (e === 'bon') return '4. Bon';
    if (e === 'correct') return '5. Correct';
    if (e === 'use') return '6. Usé';
    if (e === 'a-reparer') return '7. À réparer';
    if (e === 'pieces') return '8. Pour pièces';
    return '—';
  };

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuActionRef.current && !menuActionRef.current.contains(event.target as Node)) {
        setMenuActionGroupesOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
            {/* Barre d'outils */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '0 12px' }}>
          <span style={{ color: T.textLight, marginRight: '8px' }}>🔍</span>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher par nom, ID, SKU..." style={{ border: 'none', outline: 'none', fontSize: '13px', padding: '10px 0', width: '100%', color: T.text }} />
        </div>

        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value as any)} style={{ border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: T.text, background: '#fff', cursor: 'pointer' }}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Brouillon</option>
          <option value="suspendu">Suspendu (non-paiement)</option>
          <option value="en_attente">En attente</option>
          <option value="vendu">Vendu</option>
        </select>

        <select value={filtreType} onChange={e => setFiltreType(e.target.value as any)} style={{ border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: T.text, background: '#fff', cursor: 'pointer' }}>
          <option value="tous">Tous les types</option>
          <option value="standard">Standard</option>
          <option value="enchere">Enchère</option>
        </select>

        <select value={filtreSource} onChange={e => setFiltreSource(e.target.value as any)} style={{ border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: T.text, background: '#fff', cursor: 'pointer', minWidth: '150px' }}>
          {sourcesOptions.map(s => (
            <option key={s} value={s}>{s === 'tous' ? 'Toutes les sources' : s}</option>
          ))}
        </select>

        <MenuTri triOption={triOption} onTriChange={setTriOption} />

        <div style={{ position: 'relative' }} ref={menuActionRef}>
          <button
            onClick={() => produitsSelectionnes.length > 0 && setMenuActionGroupesOuvert(!menuActionGroupesOuvert)}
            style={{
              background: produitsSelectionnes.length > 0 ? T.accent : '#f0f0f0',
              color: produitsSelectionnes.length > 0 ? 'white' : T.textLight,
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: produitsSelectionnes.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            disabled={produitsSelectionnes.length === 0}
          >
            Actions ({produitsSelectionnes.length}) ▼
          </button>

          {menuActionGroupesOuvert && produitsSelectionnes.length > 0 && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '45px',
              background: 'white',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 100,
              minWidth: '200px',
            }}>
              <div style={{ padding: '4px 0' }}>
                <MenuItem onClick={() => handleActionGroupe('activer')} style={{ color: T.success }}>
                  ✅ Activer
                </MenuItem>
                <MenuItem onClick={() => handleActionGroupe('desactiver')} style={{ color: T.warning }}>
                  ⚠️ Désactiver
                </MenuItem>
                <MenuItem onClick={() => handleActionGroupe('supprimer')} style={{ color: T.danger }}>
                  🗑️ Supprimer
                </MenuItem>
                <div style={{ height: '1px', background: T.border, margin: '4px 0' }} />
                <MenuItem onClick={() => handleActionGroupe('bulkEdit')} style={{ color: T.purple }}>
                  ✏️ Modification groupée
                </MenuItem>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, borderRadius: '10px', border: `1px solid ${T.border}`, overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1300px' }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              <th style={{ padding: '11px 12px', width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={produitsDeLaPage.length > 0 && produitsDeLaPage.every(p => produitsSelectionnes.includes(p.id))}
                  onChange={handleSelectionTous}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', width: '52px' }}>Photo</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Produit / SKU</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Catégorie</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Type vente</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Source</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Type annonce</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>État</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Prix</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Stock</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Vues</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Ventes</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Statut</th>
              <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtresEtTries.length === 0 ? (
              <tr><td colSpan={15} style={{ padding: '60px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📦</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: T.textLight, marginBottom: '6px' }}>Aucun produit trouvé</div>
                <div style={{ fontSize: '13px', color: T.textLight }}>Ajoutez votre premier produit pour commencer à vendre.</div>
              </td></tr>
            ) : produitsDeLaPage.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={produitsSelectionnes.includes(p.id)}
                    onChange={() => handleSelectionProduit(p.id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </td>
                <td style={{ padding: '11px 12px' }}><code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: T.accent }}>{p.id}</code></td>
                <td style={{ padding: '6px 8px', textAlign: 'center', width: '52px' }}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.nom}
                      onClick={() => { const safeId = String(p.id).replace('#', ''); naviguerVers && naviguerVers(`modifier-annonce?id=${safeId}`); }}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${T.border}`, display: 'block', margin: '0 auto', cursor: 'pointer' }}
                      title="Modifier ce produit"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      onClick={() => { const safeId = String(p.id).replace('#', ''); naviguerVers && naviguerVers(`modifier-annonce?id=${safeId}`); }}
                      title="Modifier ce produit"
                      style={{ width: '40px', height: '40px', borderRadius: '6px', border: `1px dashed ${T.border}`, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '16px', cursor: 'pointer' }}
                    >📦</div>
                  )}
                </td>
                <td style={{ padding: '11px 12px', maxWidth: '200px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}
                    title={p.nom}>{p.nom}</div>
                  {p.sku && <div style={{ fontSize: '11px', color: T.textLight, marginTop: '2px' }}>SKU: {p.sku}</div>}
                </td>
                <td style={{ padding: '11px 12px', fontSize: '12px', color: T.textLight }}>{p.categorie || '—'}</td>
                <td style={{ padding: '11px 12px' }}>{typeLabel(p.typeVente)}</td>
                <td style={{ padding: '11px 12px' }}>{sourceLabel(p.source)}</td>
                <td style={{ padding: '11px 12px' }}>{typeAnnonceLabel(p.typeAnnonce)}</td>
                <td style={{ padding: '11px 12px', fontSize: '12px' }}>{etatLabel(p.etat)}</td>
                <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: T.text, whiteSpace: 'nowrap' }}>{p.prix.toFixed(2)} $</td>
                <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: p.stock <= 3 && p.stock > 0 ? T.warning : p.stock === 0 ? T.textLight : T.text, textAlign: 'center' }}>{p.stock}</td>
                <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: T.accent, textAlign: 'center' }}>{p.vues || 0}</td>
                <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: T.success, textAlign: 'center' }}>{p.totalVentes || 0}</td>
                <td style={{ padding: '11px 12px' }}>{statutLabel(p.statut)}</td>
                <td style={{ padding: '11px 12px' }}>
                  <Menu3Points
                    produit={p}
                    onEnchere={() => onEnchere(p)}
                    onActiver={() => setModalConfirmation({ isOpen: true, type: 'activer', produit: p })}
                    onDesactiver={() => setModalConfirmation({ isOpen: true, type: 'desactiver', produit: p })}
                    onSupprimer={() => setModalConfirmation({ isOpen: true, type: 'supprimer', produit: p })}
                    onNotes={() => onNotes(p)}
                    onVendre={() => onVendre(p)}
                    onDupliquer={() => onDupliquer(p)}
                    naviguerVers={naviguerVers}
                    onBulkEdit={() => {
                      setProduitsSelectionnes([p.id]);
                      onBulkEdit([p.id]);
                    }}
                    modeEncheres={modeEncheres}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pageProduits} totalPages={totalPagesProduits} onPageChange={setPageProduits} />
      <div style={{ marginTop: '10px', fontSize: '12px', color: T.textLight, display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {filtresEtTries.length} produit{filtresEtTries.length !== 1 ? 's' : ''}
          {totalPagesProduits > 1 && ` — Page ${pageProduits} / ${totalPagesProduits}`}
        </span>
        <span>Valeur totale: {filtresEtTries.reduce((sum, p) => sum + p.prix * p.stock, 0).toFixed(2)} $</span>
      </div>

      {/* Modale de confirmation */}
      <ModalConfirmation
        isOpen={modalConfirmation.isOpen}
        type={modalConfirmation.type}
        produit={modalConfirmation.produit}
        produitsCount={modalConfirmation.produitsCount}
        onConfirm={handleConfirmation}
        onCancel={() => setModalConfirmation({ isOpen: false, type: null, produit: null })}
      />


      {/* Modal Sync */}
      {syncModalOuvert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '620px', maxWidth: '95vw', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ background: '#1e3a5f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}>{syncTitre}</div>
              {(syncEnCours || resynEnCours) && (
                <button onClick={handleStopSync} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>⛔ Arrêter</button>
              )}
            </div>
            <div style={{ background: '#0f172a', padding: '16px 20px', minHeight: '220px', maxHeight: '360px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.8' }}>
              {syncLogs.length === 0 && <div style={{ color: '#475569', fontStyle: 'italic' }}>Initialisation...</div>}
              {syncLogs.map((log, i) => (
                <div key={i} style={{ color: log.type === 'success' ? '#4ade80' : log.type === 'error' ? '#f87171' : log.type === 'done' ? '#facc15' : '#94a3b8' }}>{log.msg}</div>
              ))}
              {(syncEnCours || resynEnCours) && <div style={{ color: '#475569', marginTop: '4px' }}>▋</div>}
              <div ref={syncLogsEndRef} />
            </div>
            {syncTermine && syncStats !== null && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e1e4e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: '#fafafa', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: syncStats.erreurs === 0 ? '#16a34a' : '#d97706' }}>
                  {syncStats.erreurs === 0
                    ? `✅ ${syncStats.synchronises} annonce(s) traitée(s) avec succès !`
                    : `⚠️ ${syncStats.synchronises} réussie(s) — ${syncStats.erreurs} erreur(s). Consultez les logs.`}
                </div>
                <button onClick={handleFermerModalSync} style={{ background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET VOS PRODUITS EN ENCHÈRE
// ─────────────────────────────────────────────────────────────────────────────
function OngletEncheresVendeur() {
  const [encheres, setEncheres] = useState<EnchereVendeur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | StatutEnchere>('tous');
  const [enchereSelectee, setEnchereSelectee] = useState<EnchereVendeur | null>(null);
  const [pageEncheres, setPageEncheres] = useState(1);
  const ENCHERES_PAR_PAGE = 50;

  const chargerEncheres = async () => {
    setChargement(true);
    try {
      const res = await fetch(API_ENCHERES, { headers: authHeaders() });
      if (!res.ok) throw new Error('Erreur chargement encheres');
      const data = await res.json();
      // Mapper les champs snake_case de l'API vers l'interface EnchereVendeur
      const mapped: EnchereVendeur[] = (Array.isArray(data) ? data : []).map((e: any) => ({
        id: String(e.id),
        produitId: String(e.produit_id),
        produit: e.produit_nom || e.nom || 'Produit #' + e.produit_id,
        sku: e.produit_sku || '',
        dateDebut: e.date_debut,
        dateFin: e.date_fin,
        prixBase: parseFloat(e.prix_base) || 0,
        prixReserve: e.prix_reserve ? parseFloat(e.prix_reserve) : null,
        miseCourante: parseFloat(e.mise_courante) || 0,
        nbMises: parseInt(e.nb_mises) || 0,
        statut: e.statut as StatutEnchere,
        procuration: !!e.procuration,
        popcorn: !!e.popcorn,
        incrementMin: parseFloat(e.increment_min) || 1,
        reserveAtteinte: !!e.reserve_atteinte,
        shopifyId: e.produit_shopify_id || '',
        encherisseurs: [],
      }));
      setEncheres(mapped);
    } catch (err) {
      console.error('Erreur chargement encheres:', err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerEncheres(); }, []);

  const handleEnchereArretee = (id: string) => {
    setEncheres(prev => prev.map(e => e.id === id ? { ...e, statut: 'terminee' as StatutEnchere } : e));
    setEnchereSelectee(null);
  };

  const filtres = encheres.filter(e => {
    const q = recherche.toLowerCase();
    const matchRech = e.produit.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchStatut = filtreStatut === 'tous' || e.statut === filtreStatut;
    return matchRech && matchStatut;
  });

  // Reset page quand les filtres changent
  useEffect(() => { setPageEncheres(1); }, [recherche, filtreStatut]);

  // Tranche visible selon la page courante
  const totalPagesEncheres = Math.ceil(filtres.length / ENCHERES_PAR_PAGE);
  const encheresDeLaPage = filtres.slice(
    (pageEncheres - 1) * ENCHERES_PAR_PAGE,
    pageEncheres * ENCHERES_PAR_PAGE
  );

  const statutLabel = (s: StatutEnchere) => {
    if (s === 'en_cours') return <Badge label="🔴 En cours" color={T.success} bg={T.successLight} />;
    if (s === 'a_venir') return <Badge label="⏳ À venir" color={T.warning} bg={T.warningLight} />;
    if (s === 'terminee') return <Badge label="✅ Terminée" color={T.textLight} bg="#f1f5f9" />;
    return <Badge label="⛔ Annulée" color={T.danger} bg={T.dangerLight} />;
  };

  // KPIs
  const kpis = [
    { label: 'En cours', value: encheres.filter(e => e.statut === 'en_cours').length, icon: '🔴', color: T.success, bg: T.successLight },
    { label: 'À venir', value: encheres.filter(e => e.statut === 'a_venir').length, icon: '⏳', color: T.warning, bg: T.warningLight },
    { label: 'Total mises', value: encheres.reduce((a, e) => a + e.nbMises, 0), icon: '🔨', color: T.accent, bg: T.accentLight },
    { label: 'Mise max', value: `${Math.max(...encheres.map(e => e.miseCourante), 0).toFixed(2)} $`, icon: '💰', color: T.teal, bg: T.tealLight },
  ];

  return (
    <div>
      {enchereSelectee && <PopupVoirEnchere enchere={enchereSelectee} onClose={() => setEnchereSelectee(null)} onEnchereArretee={handleEnchereArretee} />}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{k.icon}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: k.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{k.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '0 12px' }}>
          <span style={{ color: T.textLight, marginRight: '8px' }}>🔍</span>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher par produit, ID..." style={{ border: 'none', outline: 'none', fontSize: '13px', padding: '10px 0', width: '100%' }} />
        </div>
        {(['tous','en_cours','a_venir','terminee','annulee'] as const).map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${filtreStatut === s ? T.accent : T.border}`, background: filtreStatut === s ? T.accentLight : '#fff', color: filtreStatut === s ? T.accent : T.textLight, fontSize: '12px', fontWeight: filtreStatut === s ? '700' : '500', cursor: 'pointer' }}>
            {s === 'tous' ? 'Tous' : s === 'en_cours' ? '🔴 En cours' : s === 'a_venir' ? '⏳ À venir' : s === 'terminee' ? '✅ Terminées' : '⛔ Annulées'}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, borderRadius: '10px', border: `1px solid ${T.border}`, overflowX: 'auto' as const }}>
        {chargement ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: T.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Chargement de vos enchères...</div>
          </div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              {['ID', 'Produit', 'Début', 'Fin / Temps restant', 'Mise de base', 'Mise courante', 'Nb mises', 'Procuration', 'Popcorn', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtres.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: '60px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🔨</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: T.textLight, marginBottom: '6px' }}>Aucune enchère trouvée</div>
                <div style={{ fontSize: '13px', color: T.textLight }}>Créez une enchère depuis la liste de vos produits.</div>
              </td></tr>
            ) : encheresDeLaPage.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '11px 12px' }}><code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: T.teal }}>#{e.id}</code></td>
                <td style={{ padding: '11px 12px', maxWidth: '160px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.produit}>{e.produit}</div>
                  <div style={{ fontSize: '10px', color: T.textLight }}>{e.sku || '—'}</div>
                </td>
                <td style={{ padding: '11px 12px', fontSize: '11px', color: T.textLight, whiteSpace: 'nowrap' }}>
                  {new Date(e.dateDebut).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                </td>
                <td style={{ padding: '11px 12px' }}>
                  {e.statut === 'en_cours'
                    ? <CountdownTimer dateFin={e.dateFin} />
                    : <span style={{ fontSize: '11px', color: T.textLight }}>{new Date(e.dateFin).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</span>}
                </td>
                <td style={{ padding: '11px 12px', fontSize: '12px', fontWeight: '600', color: T.textLight, whiteSpace: 'nowrap' }}>
                  CAD {e.prixBase.toFixed(2)}
                </td>
                <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '800', color: e.miseCourante > 0 ? T.success : T.textLight, whiteSpace: 'nowrap' }}>
                  {e.miseCourante > 0 ? `CAD ${e.miseCourante.toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '11px 12px', fontSize: '14px', fontWeight: '700', color: T.text, textAlign: 'center' }}>{e.nbMises}</td>
                <td style={{ padding: '11px 12px', textAlign: 'center' }}>{e.procuration ? '✅' : '—'}</td>
                <td style={{ padding: '11px 12px', textAlign: 'center' }}>{e.popcorn ? '🍿' : '—'}</td>
                <td style={{ padding: '11px 12px' }}>{statutLabel(e.statut)}</td>
                <td style={{ padding: '11px 12px' }}>
                  <button onClick={() => setEnchereSelectee(e)}
                    style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    👁️ Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      <Pagination page={pageEncheres} totalPages={totalPagesEncheres} onPageChange={setPageEncheres} />
      <div style={{ marginTop: '10px', fontSize: '12px', color: T.textLight, textAlign: 'center' }}>
        {filtres.length} enchère{filtres.length !== 1 ? 's' : ''}
        {totalPagesEncheres > 1 && ` — Page ${pageEncheres} / ${totalPagesEncheres}`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ListeProduits({ naviguerVers, gestionnaireId: vendeurIdProp }: { naviguerVers?: (p: string) => void; gestionnaireId?: number }) {
  // Injecter CSS print au montage + exposer gestionnaireId pour les sous-composants
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'evend-produits-vendeur-print-style';
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    // Rendre le gestionnaireId accessible aux sous-composants via window
    if (vendeurIdProp) (window as any).__evend_gestionnaire_id__ = vendeurIdProp;
    return () => {
      const el = document.getElementById('evend-produits-vendeur-print-style');
      if (el) el.remove();
    };
  }, [vendeurIdProp]);

  const [onglet, setOnglet] = useState<'produits' | 'encheres'>('produits');
  const [produitEnchere, setProduitEnchere] = useState<Produit | null>(null);
  const [produitNotes, setProduitNotes] = useState<Produit | null>(null);
  const [produitVendu, setProduitVendu] = useState<Produit | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [bulkEditOuvert, setBulkEditOuvert] = useState(false);
  const [produitsBulkEdit, setProduitsBulkEdit] = useState<Produit[]>([]);
  const [modalImportCSV, setModalImportCSV] = useState(false);
  const [modeEncheres, setModeEncheres] = useState<boolean | null>(null);
  const [exportDonnees, setExportDonnees] = useState<boolean | null>(null);

  // En Studio, toutes les fonctionnalités sont actives selon le plan gestionnaire
  useEffect(() => {
    setModeEncheres(false);   // enchères non disponibles en Studio
    setExportDonnees(true);   // export CSV toujours disponible
  }, [vendeurIdProp]);

  const afficherToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3500);
  };

  // Charger les produits depuis l'API
  const chargerProduits = async () => {
    setChargement(true);
    try {
      const idCible = vendeurIdProp || (() => {
        try { const u = localStorage.getItem('user'); return u ? JSON.parse(u).id : null; } catch { return null; }
      })();
      const url = idCible ? `${API_PRODUITS}/${idCible}` : API_PRODUITS;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
    } catch (err) {
      afficherToast('❌ Erreur de chargement des produits', 'error');
      setProduits([]);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerProduits();
    const handleFocus = () => chargerProduits();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSaveEnchere = async (form: FormEnchere, commencer: boolean) => {
    if (!produitEnchere) return;
    try {
      const res = await fetch(`${API_BASE}/encheres`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          produit_id:            produitEnchere.id.replace('#', ''),
          date_debut:            form.dateDebut,
          date_fin:              form.dateFin,
          prix_base:             form.prixBase,
          prix_reserve:          form.prixReserve,
          procuration:           form.procuration,
          popcorn:               form.popcorn,
          popcorn_delai_mises:   form.popcornDelaiMises  || 5,
          popcorn_delai_offres:  form.popcornDelaiOffres || 10,
          popcorn_nb_fois:       form.popcornNbFois      || 3,
          commencer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        afficherToast(`❌ ${data.error || 'Erreur lors de la création de l\'enchère'}`, 'error');
        return;
      }

      setProduits(prev => prev.map(p =>
        p.id === produitEnchere.id ? { ...p, typeVente: 'enchere' } : p
      ));

      setProduitEnchere(null);
      afficherToast(commencer
        ? '🚀 Enchère créée et démarrée avec succès !'
        : '💾 Enchère sauvegardée. Elle démarrera à la date choisie.'
      );

      if (!data.shopify?.synced) {
        setTimeout(() => afficherToast('⚠️ Tags Shopify non synchronisés — vérifiez votre connexion Shopify', 'error'), 2000);
      }

      setTimeout(() => setOnglet('encheres'), 1200);

    } catch (err) {
      afficherToast('❌ Erreur réseau lors de la création de l\'enchère', 'error');
    }
  };

  const handleAjouterNote = async (produit: Produit, contenu: string) => {
    try {
      const res = await fetch(`${API_PRODUITS}/${(window as any).__evend_gestionnaire_id__ || ''}/${produit.id.replace('#','')}/notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ contenu }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      const nouvelleNote = data.note || {
        id: Date.now(),
        date: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''),
        contenu,
      };

      setProduits(prev => prev.map(p =>
        p.id === produit.id
          ? { ...p, notes: [...(p.notes || []), nouvelleNote] }
          : p
      ));
      if (produitNotes && produitNotes.id === produit.id) {
        setProduitNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), nouvelleNote] } : prev);
      }
      afficherToast('✅ Note enregistrée (chiffrée)');
    } catch (err) {
      const nouvelleNote = {
        id: Date.now(),
        date: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''),
        contenu,
      };
      setProduits(prev => prev.map(p =>
        p.id === produit.id ? { ...p, notes: [...(p.notes || []), nouvelleNote] } : p
      ));
      if (produitNotes && produitNotes.id === produit.id) {
        setProduitNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), nouvelleNote] } : prev);
      }
      afficherToast('✅ Note enregistrée localement');
    }
  };

  const handleOuvrirNotes = async (produit: Produit) => {
    setProduitNotes(produit);
    try {
      const res = await fetch(`${API_PRODUITS}/${(window as any).__evend_gestionnaire_id__ || ''}/${produit.id.replace('#','')}/notes`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notes)) {
        setProduits(prev => prev.map(p =>
          p.id === produit.id ? { ...p, notes: data.notes } : p
        ));
        setProduitNotes({ ...produit, notes: data.notes });
      }
    } catch (_) {
      // Utilise les notes déjà en mémoire
    }
  };

  const handleSupprimerNote = async (produit: Produit, noteId: number) => {
    try {
      const res = await fetch(`${API_PRODUITS}/${(window as any).__evend_gestionnaire_id__ || ''}/${produit.id.replace('#','')}/notes/${noteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erreur serveur');

      setProduits(prev => prev.map(p =>
        p.id === produit.id
          ? { ...p, notes: (p.notes || []).filter(n => n.id !== noteId) }
          : p
      ));
      setProduitNotes(prev => prev
        ? { ...prev, notes: (prev.notes || []).filter(n => n.id !== noteId) }
        : prev
      );
      afficherToast('🗑️ Note supprimée');
    } catch (err) {
      afficherToast('❌ Erreur lors de la suppression de la note', 'error');
    }
  };

  const handleMarquerVendu = async (produit: Produit, quantite: number, prixVente: number) => {
    try {
      const res = await fetch(`${API_PRODUITS}/${(window as any).__evend_gestionnaire_id__ || ''}/${produit.id.replace('#','')}/vendu`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ quantite, prixVente }),
      });

      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setProduits(prev => prev.map(p =>
        p.id === produit.id
          ? {
              ...p,
              stock: data.stock ?? Math.max(p.stock - quantite, 0),
              totalVentes: data.total_ventes ?? (p.totalVentes || 0) + quantite,
              statut: (data.statut as StatutProduit) ?? p.statut,
            }
          : p
      ));

      setProduitVendu(null);
      const newStock = data.stock ?? Math.max(produit.stock - quantite, 0);
      afficherToast(`💰 ${quantite} unité(s) vendue(s) — Stock ajusté à ${newStock}${data.statut === 'vendu' ? ' — Annonce passée en brouillon Shopify' : ''}`);
    } catch (err) {
      afficherToast('❌ Erreur lors de la mise à jour de la vente', 'error');
    }
  };

  const handleDupliquer = (produit: Produit) => {
    if (!naviguerVers) {
      afficherToast('❌ Navigation non disponible', 'error');
      return;
    }
    const safeId = produit.id.replace('#', '');
    naviguerVers(`creer-annonce?dupliquer=${safeId}`);
  };

  const handleImportCSV = async (file: File) => {
    try {
      afficherToast('⏳ Import en cours...');
      const formData = new FormData();
      formData.append('csv', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/import-csv/produits`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.quota_insuffisant) {
        const d = data.detail;
        const msg = 'Quota insuffisant pour importer ce CSV.\n\n' +
          'Forfait : ' + d.plan_nom + '\n' +
          'Annonces actives : ' + d.nb_actifs + ' / ' + d.limite_produits + '\n' +
          'Annonces restantes : ' + d.produits_restants + '\n' +
          'CSV contient : ' + d.nb_csv + ' produits\n\n' +
          'Upgradez votre forfait pour importer plus d annonces.';
        alert(msg);
        return;
      }

      if (data.success) {
        let msg = data.message;
        if (data.limite_appliquee) {
          msg += '\n\nSeulement ' + data.produits_restants + ' produits importes sur ' + data.nb_csv + ' - quota forfait atteint. Upgradez pour importer le reste.';
          alert(msg);
        } else {
          afficherToast(msg);
        }
        setModalImportCSV(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        afficherToast(data.error || 'Erreur import');
      }
        } catch (err) {
      afficherToast('Erreur reseau lors de l import');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'Nom', 'Catégorie', 'Prix', 'Stock', 'TypeVente', 'TypeAnnonce', 'État', 'Source', 'Vues', 'Statut', 'Ventes'];
    const csvData = produits.map(p => [
      p.id,
      p.sku,
      p.nom,
      p.categorie,
      p.prix,
      p.stock,
      p.typeVente,
      p.typeAnnonce || '',
      p.etat || '',
      p.source || '',
      p.vues || 0,
      p.statut,
      p.totalVentes || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    afficherToast('📊 Export CSV réussi !');
  };

  const handlePrint = () => {
    const printDiv = document.getElementById('evend-produits-vendeur-print');
    if (!printDiv) return;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Mes produits — e-Vend.ca</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; margin: 0; }
          @page { size: landscape; margin: 12mm 10mm; }
          h1 { font-size: 16px; color: #2d6a9f; margin: 0 0 2px 0; }
          p { margin: 0 0 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          th { background-color: #e8f2fb; color: #2d6a9f; font-weight: bold; padding: 7px 8px; border: 1px solid #ccc; text-align: left; font-size: 9px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; }
          tfoot td { background-color: #e8f2fb; font-weight: bold; border-top: 2px solid #2d6a9f; }
          tr:nth-child(even) td { background-color: #f8f8f8; }
          .section-title { font-size: 13px; font-weight: bold; color: #2d6a9f; text-transform: uppercase; margin: 20px 0 8px 0; border-left: 4px solid #2d6a9f; padding-left: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2d6a9f; padding-bottom: 10px; margin-bottom: 16px; }
          .note { font-size: 9px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>
        ${printDiv.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleBulkEdit = (idsSelectionnes: string[]) => {
    const produitsASelectionner = produits.filter(p => idsSelectionnes.includes(p.id));
    setProduitsBulkEdit(produitsASelectionner);
    setBulkEditOuvert(true);
  };

  const handleBulkSave = (produitsModifies: Produit[]) => {
    setProduits(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      produitsModifies.forEach(p => map.set(p.id, p));
      return Array.from(map.values());
    });
    setBulkEditOuvert(false);
    afficherToast('✅ Modifications groupées enregistrées');
  };

  // KPIs globaux
  const nbActifs = produits.filter(p => p.statut === 'actif').length;
  const nbEncheres = produits.filter(p => p.typeVente === 'enchere').length;
  const valeurTotale = produits.reduce((a, p) => a + p.prix * p.stock, 0);
  const nbVendus = produits.filter(p => p.statut === 'vendu').length;
  const totalVues = produits.reduce((a, p) => a + (p.vues || 0), 0);

  // Calcul des totaux pour l'impression
  const totalProduits = produits.length;
  const totalStock = produits.reduce((sum, p) => sum + p.stock, 0);
  const totalValeur = produits.reduce((sum, p) => sum + p.prix * p.stock, 0);

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.teal}`, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: T.textLight, fontSize: '14px', margin: 0 }}>Chargement des produits…</p>
    </div>
  );

  return (
    <div style={{ padding: '16px 20px 0', maxWidth: '100%' }}>
      {/* Zone d'impression cachée */}
      <div id="evend-produits-vendeur-print" style={{ display: 'none', visibility: 'hidden', position: 'absolute', top: '-9999px' }}>
        <div className="header">
          <div>
            <h1>e-Vend.ca — Mes produits</h1>
            <p>Généré le {new Date().toLocaleDateString('fr-CA')} · {produits.length} produits</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Vendeur: [Nom du vendeur]</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Type vente</th>
              <th>Source</th>
              <th>Type annonce</th>
              <th>État</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Vues</th>
              <th>Ventes</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace' }}>{p.id}</td>
                <td>{p.sku}</td>
                <td>{p.nom}</td>
                <td>{p.categorie}</td>
                <td>{p.typeVente === 'enchere' ? 'Enchère' : 'Standard'}</td>
                <td>{p.source || '—'}</td>
                <td>{p.typeAnnonce === 'neuf' ? 'Neuf' : p.typeAnnonce === 'occasion' ? 'Occasion' : p.typeAnnonce === 'remis-a-neuf' ? 'Remis à neuf' : '—'}</td>
                <td>{p.etat ? p.etat.replace('-', ' ') : '—'}</td>
                <td style={{ fontWeight: 'bold' }}>{p.prix.toFixed(2)} $</td>
                <td style={{ textAlign: 'center' }}>{p.stock}</td>
                <td style={{ textAlign: 'center' }}>{p.vues || 0}</td>
                <td style={{ textAlign: 'center' }}>{p.totalVentes || 0}</td>
                <td>{p.statut === 'actif' ? 'Actif' : p.statut === 'inactif' ? 'Brouillon' : p.statut === 'vendu' ? 'Vendu' : 'En attente'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={9}><strong>TOTAL — {totalProduits} produits</strong></td>
              <td><strong>{totalStock}</strong></td>
              <td><strong>{totalVues}</strong></td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        <p className="note">
          Rapport généré automatiquement par e-Vend Studio.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: toastType === 'error' ? T.danger : T.success, color: '#fff', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '360px' }}>
          {toast}
        </div>
      )}

      {/* Popups */}
      {produitEnchere && (
        <PopupCreerEnchere
          produit={produitEnchere}
          onClose={() => setProduitEnchere(null)}
          onSave={handleSaveEnchere}
        />
      )}

      {produitNotes && (
        <ModalNotes
          produit={produitNotes}
          onAjouterNote={(contenu) => handleAjouterNote(produitNotes, contenu)}
          onSupprimerNote={(noteId) => handleSupprimerNote(produitNotes, noteId)}
          onFermer={() => setProduitNotes(null)}
        />
      )}

      {produitVendu && (
        <ModalMarquerVendu
          isOpen={true}
          produit={produitVendu}
          onConfirm={(quantite, prixVente) => handleMarquerVendu(produitVendu, quantite, prixVente)}
          onCancel={() => setProduitVendu(null)}
        />
      )}

      {modalImportCSV && (
        <ModalImportCSV
          isOpen={true}
          onConfirm={handleImportCSV}
          onCancel={() => setModalImportCSV(false)}
        />
      )}

      {bulkEditOuvert && (
        <BulkEditProduits
          produits={produitsBulkEdit}
          onClose={() => setBulkEditOuvert(false)}
          onSave={handleBulkSave}
        />
      )}

      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📦 Vos Annonces
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => exportDonnees !== false && setModalImportCSV(true)}
              disabled={exportDonnees === false}
              title={exportDonnees === false ? 'Non inclus dans votre plan' : ''}
              style={{
                background: exportDonnees === false ? '#f1f5f9' : 'white',
                color: exportDonnees === false ? T.textLight : T.teal,
                border: `2px solid ${exportDonnees === false ? T.border : T.teal}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: exportDonnees === false ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: exportDonnees === false ? 0.6 : 1,
              }}
            >
              {exportDonnees === false ? '🔒' : '📤'} Importer CSV
            </button>
            <button
              onClick={() => exportDonnees !== false && handleExportCSV()}
              disabled={exportDonnees === false}
              title={exportDonnees === false ? 'Non inclus dans votre plan' : ''}
              style={{
                background: exportDonnees === false ? '#f1f5f9' : 'white',
                color: exportDonnees === false ? T.textLight : T.accent,
                border: `2px solid ${exportDonnees === false ? T.border : T.accent}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: exportDonnees === false ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: exportDonnees === false ? 0.6 : 1,
              }}
            >
              {exportDonnees === false ? '🔒' : '📊'} Exporter CSV
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: 'white',
                color: T.accent,
                border: `2px solid ${T.accent}`,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 16px' }}>Gérez vos produits et vos ventes aux enchères.</p>

        {/* KPIs rapides */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {[
            { label: 'Produits actifs', value: nbActifs, icon: '✅', color: T.success, bg: T.successLight },
            { label: 'En enchères', value: nbEncheres, icon: '🔨', color: T.teal, bg: T.tealLight },
            { label: 'Vendus', value: nbVendus, icon: '💰', color: '#0369a1', bg: '#e0f2fe' },
            { label: 'Valeur inventaire', value: `${valeurTotale.toFixed(0)} $`, icon: '📊', color: T.accent, bg: T.accentLight },
            { label: 'Total produits', value: produits.length, icon: '📦', color: T.textLight, bg: '#f1f5f9' },
            { label: 'Total vues', value: totalVues, icon: '👁️', color: T.purple, bg: T.purpleLight },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: k.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{k.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: k.color }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: '#f8fafc' }}>
          {[
            { key: 'produits', label: `📋 Liste des produits (${produits.length})`, bloque: false },
            { key: 'encheres', label: `🔨 Vos produits en enchère (${ENCHERES_VENDEUR_MOCK.length})`, bloque: modeEncheres === false },
          ].map(t => (
            <button key={t.key}
              onClick={() => { if (!t.bloque) setOnglet(t.key as any); }}
              disabled={t.bloque}
              title={t.bloque ? 'Non inclus dans votre plan' : ''}
              style={{ padding: '13px 22px', background: 'none', border: 'none', borderBottom: `3px solid ${onglet === t.key ? T.teal : 'transparent'}`, fontSize: '13px', fontWeight: onglet === t.key ? '800' : '500', color: t.bloque ? T.textLight : onglet === t.key ? T.teal : T.textLight, cursor: t.bloque ? 'not-allowed' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', opacity: t.bloque ? 0.5 : 1 }}>
              {t.bloque ? '🔒 ' : ''}{t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '20px' }}>
          {onglet === 'produits' && (
            <OngletListeProduits
              onEnchere={p => setProduitEnchere(p)}
              produits={produits}
              setProduits={setProduits}
              onNotes={p => handleOuvrirNotes(p)}
              onVendre={p => setProduitVendu(p)}
              onBulkEdit={handleBulkEdit}
              onDupliquer={handleDupliquer}
              afficherToast={afficherToast}
              naviguerVers={naviguerVers}
              modeEncheres={modeEncheres === null ? true : modeEncheres}
            />
          )}
          {onglet === 'encheres' && <OngletEncheresVendeur />}
        </div>
      </div>

      <div style={{ height: '40px' }} />
    </div>
  );
}

export { PopupVoirEnchere };