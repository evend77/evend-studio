import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', purple: '#7c3aed',
};

const API = 'https://evend-multivendeur-api.onrender.com';
const getToken = () => localStorage.getItem('token');

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface Commande {
  id: number;
  store_order_id: string;
  vendeur_id: number;
  vendeur_nom: string;
  boutique: string;
  mode_paiement: string;
  statut_paiement: 'Paid' | 'voided' | 'refunded' | 'pending';
  statut_commande: 'Fulfilled' | 'Unfulfilled' | 'Partially Fulfilled';
  statut_acceptation: 'Accepted' | 'Rejected' | 'Pending';
  date_commande: string;
  montant: number;
  client_nom: string;
  client_email: string;
  ville: string;
  province: string;
  pays: string;
  produits: { nom: string; sku: string; prix: number; qte: number; image?: string }[];
  transporteur: string;
  numero_suivi: string;
  url_suivi: string;
  statut_livraison: string;
  earning_produit: number;
  earning_shipping: number;
  transaction_charge: number;
  risque_fraude: 'LOW' | 'MEDIUM' | 'HIGH';
  raisons_risque: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGS STATUTS
// ─────────────────────────────────────────────────────────────────────────────
const statutPaiementConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Paid':     { label: 'Payé',       bg: '#dcfce7', color: THEME.success },
  'voided':   { label: 'Annulé',     bg: '#fee2e2', color: THEME.danger },
  'refunded': { label: 'Remboursé',  bg: '#fef9c3', color: THEME.warning },
  'pending':  { label: 'En attente', bg: '#f3f4f6', color: THEME.textLight },
};
const statutCommandeConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Fulfilled':           { label: 'Fulfillé',     bg: '#dcfce7', color: THEME.success },
  'Unfulfilled':         { label: 'Non fulfillé', bg: '#fee2e2', color: THEME.danger },
  'Partially Fulfilled': { label: 'Partiel',      bg: '#fef9c3', color: THEME.warning },
};
const statutAcceptConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Accepted': { label: 'Accepté',    bg: '#dcfce7', color: THEME.success },
  'Rejected': { label: 'Rejeté',    bg: '#fee2e2', color: THEME.danger },
  'Pending':  { label: 'En attente', bg: '#fef9c3', color: THEME.warning },
};
const risqueConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  'LOW':    { label: 'Faible', bg: '#dcfce7', color: THEME.success, icon: '🟢' },
  'MEDIUM': { label: 'Moyen',  bg: '#fef9c3', color: THEME.warning, icon: '🟡' },
  'HIGH':   { label: 'Élevé',  bg: '#fee2e2', color: THEME.danger,  icon: '🔴' },
};

function BadgePill({ cfg, small }: { cfg: { label: string; bg: string; color: string }; small?: boolean }) {
  return (
    <span style={{
      fontSize: small ? '10px' : '11px', fontWeight: '700',
      padding: small ? '2px 7px' : '3px 10px', borderRadius: '20px',
      backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' as const,
    }}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU CONTEXTUEL
// ─────────────────────────────────────────────────────────────────────────────
const MenuContextuel = ({ commande, onClose, naviguerVers }: any) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<'top' | 'bottom'>('bottom');

  React.useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 250) setPosition('top');
    }
  }, []);

  return (
    <div ref={menuRef} style={{
      position: 'absolute',
      [position === 'bottom' ? 'top' : 'bottom']: '100%',
      right: 0,
      marginTop: position === 'bottom' ? '4px' : undefined,
      marginBottom: position === 'top' ? '4px' : undefined,
      backgroundColor: 'white', borderRadius: '10px',
      border: `1px solid ${THEME.border}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
      minWidth: '190px', overflow: 'hidden',
    }}>
      {[
        { label: '👁️ Voir le détail', action: () => naviguerVers('commande-detail', commande) },
        { label: '🔄 Sync avec Shopify', action: () => {} },
        { label: '📧 Envoyer rappel', action: () => {} },
        { label: '↩️ Créer RMA', action: () => {} },
        { label: '🖨️ Facture vendeur', action: () => {} },
        { label: '🖨️ Facture client', action: () => {} },
      ].map((item, idx) => (
        <button key={idx} onClick={() => { item.action(); onClose(); }} style={{
          display: 'flex', width: '100%', padding: '10px 16px',
          background: 'none', border: 'none',
          borderTop: idx > 0 ? '1px solid #f5f5f5' : 'none',
          cursor: 'pointer', fontSize: '12px', color: THEME.text,
          fontWeight: '600', textAlign: 'left',
        }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
interface GestionCommandesProps {
  naviguerVers: (page: string, data?: any) => void;
}

export default function GestionCommandes({ naviguerVers }: GestionCommandesProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState('tous');
  const [filtreVendeur, setFiltreVendeur] = useState('tous');
  const [filtreRisque, setFiltreRisque] = useState('tous');
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [selectionnes, setSelectionnes] = useState<number[]>([]);

  // ─── Chargement ───
  const chargerCommandes = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API}/api/commandes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      // Normaliser les données BD → interface
      const normalized: Commande[] = data.map((c: any) => ({
        ...c,
        montant: parseFloat(c.montant) || 0,
        earning_produit: parseFloat(c.earning_produit) || 0,
        earning_shipping: parseFloat(c.earning_shipping) || 0,
        transaction_charge: parseFloat(c.transaction_charge) || 0,
        produits: typeof c.produits === 'string' ? JSON.parse(c.produits) : (c.produits || []),
        raisons_risque: typeof c.raisons_risque === 'string' ? JSON.parse(c.raisons_risque) : (c.raisons_risque || []),
      }));

      setCommandes(normalized);
      log.admin('Commandes chargées', `${normalized.length} commandes récupérées`);
    } catch (err) {
      console.error('❌ Erreur chargement commandes:', err);
      log.erreur('Erreur chargement commandes', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerCommandes();
    log.admin('Page visitée', 'Gestion des commandes');
  }, []);

  // ─── Filtres ───
  const vendeurs = Array.from(new Set(commandes.map(c => c.vendeur_nom)));

  const commandesFiltrees = commandes.filter(c => {
    const s = recherche.toLowerCase();
    const matchRecherche = !s ||
      (c.store_order_id || '').toLowerCase().includes(s) ||
      (c.vendeur_nom || '').toLowerCase().includes(s) ||
      (c.client_nom || '').toLowerCase().includes(s) ||
      String(c.id).includes(s);
    const matchPaiement = filtreStatutPaiement === 'tous' || c.statut_paiement === filtreStatutPaiement;
    const matchVendeur = filtreVendeur === 'tous' || c.vendeur_nom === filtreVendeur;
    const matchRisque = filtreRisque === 'tous' || c.risque_fraude === filtreRisque;
    return matchRecherche && matchPaiement && matchVendeur && matchRisque;
  });

  const totalMontant = commandesFiltrees.reduce((s, c) => s + (parseFloat(String(c.montant)) || 0), 0);
  const nbAlertes = commandes.filter(c => c.risque_fraude === 'HIGH').length;

  // ─── Sélection ───
  const toggleSelection = (id: number) => {
    setSelectionnes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toutSelectionner = () => {
    setSelectionnes(selectionnes.length === commandesFiltrees.length ? [] : commandesFiltrees.map(c => c.id));
  };

  // ─── Export CSV ───
  const exportCSV = () => {
    const headers = ['Order ID', 'Store Order ID', 'Vendeur', 'Client', 'Mode Paiement', 'Statut Paiement', 'Statut Commande', 'Montant', 'Date', 'Risque'];
    const rows = commandesFiltrees.map(c => [
      c.id, c.store_order_id, c.vendeur_nom, c.client_nom,
      c.mode_paiement, c.statut_paiement, c.statut_commande,
      parseFloat(String(c.montant)).toFixed(2),
      c.date_commande, c.risque_fraude,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'commandes-evend.csv'; a.click();
    log.admin('Export CSV', `${commandesFiltrees.length} commandes exportées`);
  };

  // ─── Formatage date ───
  const formatDate = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '28px 32px', maxWidth: '1400px', backgroundColor: THEME.bg, minHeight: '100vh' }}
      onClick={() => setMenuOuvert(null)}
    >
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Toutes les commandes
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            {commandes.length} commandes sur la plateforme · {commandesFiltrees.length} affichées
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportCSV} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            📤 Export CSV
          </button>
          <button onClick={chargerCommandes} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Alerte fraude */}
      {nbAlertes > 0 && (
        <div style={{ backgroundColor: '#fee2e2', border: `1px solid ${THEME.danger}`, borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.danger, margin: '0 0 2px 0' }}>
              {nbAlertes} commande{nbAlertes > 1 ? 's' : ''} à risque élevé détectée{nbAlertes > 1 ? 's' : ''} par Shopify
            </p>
            <p style={{ fontSize: '11px', color: '#991b1b', margin: 0 }}>
              Vérifiez ces commandes avant de les accepter.
            </p>
          </div>
          <button onClick={() => setFiltreRisque('HIGH')} style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Voir
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total commandes',  val: String(commandes.length), icon: '📦', c: THEME.accent },
          { label: 'Payées',           val: String(commandes.filter(c => c.statut_paiement === 'Paid').length), icon: '✅', c: THEME.success },
          { label: 'Annulées',         val: String(commandes.filter(c => c.statut_paiement === 'voided').length), icon: '❌', c: THEME.danger },
          { label: 'Montant total',    val: `${commandes.reduce((s, c) => s + (parseFloat(String(c.montant)) || 0), 0).toFixed(0)} $`, icon: '💰', c: THEME.warning },
          { label: 'Risque élevé',     val: String(nbAlertes), icon: '🚨', c: THEME.danger },
        ].map((k, i) => (
          <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '20px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '800', color: THEME.text, margin: 0, lineHeight: 1 }}>{k.val}</p>
              <p style={{ fontSize: '10px', color: THEME.textLight, margin: '2px 0 0 0', fontWeight: '600' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <input
          type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Order ID, vendeur, client..."
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', outline: 'none', width: '230px', backgroundColor: 'white' }}
        />
        <select value={filtreStatutPaiement} onChange={e => setFiltreStatutPaiement(e.target.value)}
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}>
          <option value="tous">Tous les paiements</option>
          <option value="Paid">✅ Payé</option>
          <option value="voided">❌ Annulé</option>
          <option value="refunded">↩️ Remboursé</option>
          <option value="pending">⏳ En attente</option>
        </select>
        <select value={filtreVendeur} onChange={e => setFiltreVendeur(e.target.value)}
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}>
          <option value="tous">Tous les vendeurs</option>
          {vendeurs.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filtreRisque} onChange={e => setFiltreRisque(e.target.value)}
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}>
          <option value="tous">Tous les risques</option>
          <option value="LOW">🟢 Faible</option>
          <option value="MEDIUM">🟡 Moyen</option>
          <option value="HIGH">🔴 Élevé</option>
        </select>
        {(filtreStatutPaiement !== 'tous' || filtreVendeur !== 'tous' || filtreRisque !== 'tous' || recherche) && (
          <button onClick={() => { setFiltreStatutPaiement('tous'); setFiltreVendeur('tous'); setFiltreRisque('tous'); setRecherche(''); }}
            style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: THEME.textLight, cursor: 'pointer', fontWeight: '600' }}>
            ✕ Réinitialiser
          </button>
        )}
        {selectionnes.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: THEME.accent, fontWeight: '700' }}>{selectionnes.length} sélectionnée{selectionnes.length > 1 ? 's' : ''}</span>
            <button style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: `1px solid ${THEME.accent}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Sync sélection
            </button>
          </div>
        )}
        <span style={{ marginLeft: selectionnes.length === 0 ? 'auto' : '0', fontSize: '12px', color: THEME.textLight }}>
          Total filtré : <strong>{totalMontant.toFixed(2)} $</strong>
        </span>
      </div>

      {/* Tableau */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              <th style={{ padding: '12px 14px', width: '36px' }}>
                <input type="checkbox"
                  checked={selectionnes.length === commandesFiltrees.length && commandesFiltrees.length > 0}
                  onChange={toutSelectionner}
                  style={{ cursor: 'pointer', accentColor: THEME.accent }} />
              </th>
              {['Order ID', 'Store #', 'Vendeur', 'Client', 'Mode paiement', 'Paiement', 'Commande', 'Acceptation', 'Risque', 'Date', 'Montant', ''].map(h => (
                <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commandesFiltrees.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ padding: '50px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.25 }}>📦</div>
                  <p style={{ fontSize: '14px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>Aucune commande trouvée</p>
                </td>
              </tr>
            ) : commandesFiltrees.map((c, i) => {
              const estRisque = c.risque_fraude === 'HIGH';
              const paiementCfg = statutPaiementConfig[c.statut_paiement] || statutPaiementConfig['pending'];
              const commandeCfg = statutCommandeConfig[c.statut_commande] || statutCommandeConfig['Unfulfilled'];
              const acceptCfg = statutAcceptConfig[c.statut_acceptation] || statutAcceptConfig['Pending'];
              const risqueCfg = risqueConfig[c.risque_fraude] || risqueConfig['LOW'];

              return (
                <tr key={c.id}
                  style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: estRisque ? '#fff5f5' : i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer' }}
                  onClick={() => naviguerVers('commande-detail', c)}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f7ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = estRisque ? '#fff5f5' : i % 2 === 0 ? 'white' : '#fafafa'}
                >
                  <td style={{ padding: '12px 14px' }} onClick={e => { e.stopPropagation(); toggleSelection(c.id); }}>
                    <input type="checkbox" checked={selectionnes.includes(c.id)} onChange={() => toggleSelection(c.id)} style={{ cursor: 'pointer', accentColor: THEME.accent }} />
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>{c.id}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: THEME.text }}>{c.store_order_id}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.text, margin: 0 }}>{c.vendeur_nom}</p>
                      <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{c.boutique}</p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: THEME.text, margin: 0 }}>{c.client_nom}</p>
                      <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{c.ville}</p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: '11px', color: THEME.textLight }}>{(c.mode_paiement || '').replace('e-Vend ', '')}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}><BadgePill cfg={paiementCfg} /></td>
                  <td style={{ padding: '12px 12px' }}><BadgePill cfg={commandeCfg} /></td>
                  <td style={{ padding: '12px 12px' }}><BadgePill cfg={acceptCfg} /></td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '13px' }}>{risqueCfg.icon}</span>
                      <BadgePill cfg={risqueCfg} small />
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: '11px', color: THEME.textLight, whiteSpace: 'nowrap' as const }}>{formatDate(c.date_commande)}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: THEME.text }}>{parseFloat(String(c.montant)).toFixed(2)} $</span>
                  </td>
                  <td style={{ padding: '12px 12px', position: 'relative' as const }} onClick={e => e.stopPropagation()}>
                    <div style={{ position: 'relative' as const, display: 'inline-block' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOuvert(menuOuvert === c.id ? null : c.id); }}
                        style={{ background: 'white', border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px', color: THEME.textLight }}
                      >
                        ⋯
                      </button>
                      {menuOuvert === c.id && (
                        <MenuContextuel commande={c} onClose={() => setMenuOuvert(null)} naviguerVers={naviguerVers} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pied */}
      <div style={{ marginTop: '12px', fontSize: '12px', color: THEME.textLight }}>
        {commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? 's' : ''} affichée{commandesFiltrees.length > 1 ? 's' : ''}
        {selectionnes.length > 0 && ` · ${selectionnes.length} sélectionnée${selectionnes.length > 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
