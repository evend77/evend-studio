import React, { useState } from 'react';
import { Commande } from './GestionCommandes';
import { log } from '../../services/logger';

const API = 'https://evend-multivendeur-api.onrender.com';
const getToken = () => localStorage.getItem('token');

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGS STATUTS
// ─────────────────────────────────────────────────────────────────────────────
const statutPaiementConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Paid':     { label: 'Payé',        bg: '#dcfce7', color: THEME.success },
  'voided':   { label: 'Annulé',      bg: '#fee2e2', color: THEME.danger },
  'refunded': { label: 'Remboursé',   bg: '#fef9c3', color: THEME.warning },
  'pending':  { label: 'En attente',  bg: '#f3f4f6', color: THEME.textLight },
};
const statutCommandeConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Fulfilled':           { label: 'Fulfillé',          bg: '#dcfce7', color: THEME.success },
  'Unfulfilled':         { label: 'Non fulfillé',      bg: '#fee2e2', color: THEME.danger },
  'Partially Fulfilled': { label: 'Partiellement fulfillé', bg: '#fef9c3', color: THEME.warning },
};
const statutAcceptConfig: Record<string, { label: string; bg: string; color: string }> = {
  'Accepted': { label: 'Acceptée',    bg: '#dcfce7', color: THEME.success },
  'Rejected': { label: 'Refusée',    bg: '#fee2e2', color: THEME.danger },
  'Pending':  { label: 'En attente', bg: '#fef9c3', color: THEME.warning },
};
const risqueConfig: Record<string, { label: string; couleurBarre: string; pct: number; icon: string; bg: string; color: string }> = {
  'LOW':    { label: 'Faible',  couleurBarre: THEME.success, pct: 15,  icon: '🛡️', bg: '#dcfce7', color: THEME.success },
  'MEDIUM': { label: 'Moyen',   couleurBarre: THEME.warning, pct: 55,  icon: '⚠️', bg: '#fef9c3', color: THEME.warning },
  'HIGH':   { label: 'Élevé',   couleurBarre: THEME.danger,  pct: 90,  icon: '🚨', bg: '#fee2e2', color: THEME.danger },
};
const etatTraitementOptions = [
  'En préparation',
  'Prêt pour expédition',
  'En cours de livraison',
  'En transit',
  'Livré',
  'Tentative de livraison échouée',
  'Retourné à l\'expéditeur',
];

function Badge({ cfg }: { cfg: { label: string; bg: string; color: string } }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' as const }}>
      {cfg.label}
    </span>
  );
}

interface DetailCommandeProps {
  commande: Commande;
  naviguerVers: (page: string, data?: any) => void;
}

export default function DetailCommande({ commande: initial, naviguerVers }: DetailCommandeProps) {
  const [c, setC] = useState<Commande>(initial);

  // Modals
  const [actionsOuvertes, setActionsOuvertes]         = useState(false);
  const [modalRMAOuvert, setModalRMAOuvert]           = useState(false);
  const [modalCaptureOuvert, setModalCaptureOuvert]   = useState(false);
  const [modalFulfillOuvert, setModalFulfillOuvert]   = useState(false);
  const [modalRefusOuvert, setModalRefusOuvert]       = useState(false);

  // Formulaire fulfillment (modal)
  const [etatTraitement, setEtatTraitement]       = useState(c.statut_livraison || 'En préparation');
  const [transporteur, setTransporteur]           = useState(c.transporteur || '');
  const [numeroSuivi, setNumeroSuivi]             = useState(c.numero_suivi || '');
  const [urlSuivi, setUrlSuivi]                   = useState(c.url_suivi || '');
  const [noteAcheteur, setNoteAcheteur]           = useState('');
  const [savingFulfill, setSavingFulfill]         = useState(false);
  const [savingAccept, setSavingAccept]           = useState(false);
  const [savingRefus, setSavingRefus]             = useState(false);
  const [noteRefus, setNoteRefus]                 = useState('');

  // Calculs
  const earning_produit    = parseFloat(String(c.earning_produit))    || 0;
  const earning_shipping   = parseFloat(String(c.earning_shipping))   || 0;
  const transaction_charge = parseFloat(String(c.transaction_charge)) || 0;
  const montant            = parseFloat(String(c.montant))            || 0;
  const totalEarning       = earning_produit + earning_shipping + transaction_charge;
  const sousTotal          = (c.produits || []).reduce((s, p) => s + p.prix * p.qte, 0);
  const estComplete        = c.statut_paiement === 'Paid' && c.statut_commande === 'Fulfilled';
  const risque             = risqueConfig[c.risque_fraude] || risqueConfig['LOW'];
  const acceptCfg          = statutAcceptConfig[c.statut_acceptation] || statutAcceptConfig['Pending'];

  // Styles
  const sectionStyle: React.CSSProperties = {
    backgroundColor: THEME.card, borderRadius: '12px',
    border: `1px solid ${THEME.border}`, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px',
  };
  const sectionHeaderStyle: React.CSSProperties = {
    padding: '14px 20px', backgroundColor: '#f8fafc',
    borderBottom: `2px solid ${THEME.accent}`,
    display: 'flex', alignItems: 'center', gap: '8px',
  };
  const ligneStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 20px', borderBottom: '1px solid #f5f5f5',
  };
  const labelStyle: React.CSSProperties = { fontSize: '12px', color: THEME.textLight, fontWeight: '500' };
  const valeurStyle: React.CSSProperties = { fontSize: '13px', color: THEME.text, fontWeight: '600' };

  // ─── ACCEPTER LA COMMANDE ───────────────────────────────────────────────────
  const accepterCommande = async () => {
    setSavingAccept(true);
    try {
      const res = await fetch(`${API}/api/commandes/${c.id}/acceptation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ statut_acceptation: 'Accepted' }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated = await res.json();
      setC(prev => ({ ...prev, statut_acceptation: 'Accepted' }));
      log.admin('Commande acceptée', `Commande #${c.id} acceptée`);
      // Ouvre automatiquement le modal fulfillment
      setModalFulfillOuvert(true);
    } catch (err) {
      console.error('❌ Erreur acceptation:', err);
      log.erreur('Erreur acceptation commande', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingAccept(false);
    }
  };

  // ─── REFUSER LA COMMANDE ────────────────────────────────────────────────────
  const refuserCommande = async () => {
    setSavingRefus(true);
    try {
      const res = await fetch(`${API}/api/commandes/${c.id}/acceptation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ statut_acceptation: 'Rejected' }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setC(prev => ({ ...prev, statut_acceptation: 'Rejected' }));
      log.admin('Commande refusée', `Commande #${c.id} refusée. Note: ${noteRefus}`);
      setModalRefusOuvert(false);
      setNoteRefus('');
    } catch (err) {
      console.error('❌ Erreur refus:', err);
      log.erreur('Erreur refus commande', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingRefus(false);
    }
  };

  // ─── ENREGISTRER FULFILLMENT ────────────────────────────────────────────────
  const enregistrerFulfillment = async () => {
    setSavingFulfill(true);
    try {
      const res = await fetch(`${API}/api/commandes/${c.id}/suivi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          transporteur,
          numero_suivi: numeroSuivi,
          url_suivi: urlSuivi,
          statut_livraison: etatTraitement,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setC(prev => ({
        ...prev,
        transporteur,
        numero_suivi: numeroSuivi,
        url_suivi: urlSuivi,
        statut_livraison: etatTraitement,
      }));
      log.admin('Fulfillment mis à jour', `Commande #${c.id} — ${etatTraitement} via ${transporteur}`);
      setModalFulfillOuvert(false);
    } catch (err) {
      console.error('❌ Erreur fulfillment:', err);
      log.erreur('Erreur fulfillment', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingFulfill(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + new Date(d).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', backgroundColor: THEME.bg, minHeight: '100vh' }}
      onClick={() => setActionsOuvertes(false)}>

      {/* Fil d'Ariane */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        <button onClick={() => naviguerVers('commandes-toutes')} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.accent, cursor: 'pointer', fontWeight: '600', padding: 0 }}>
          Commandes
        </button>
        <span style={{ color: '#aaa', fontSize: '12px' }}>›</span>
        <span style={{ fontSize: '12px', color: THEME.textLight }}>Commande {c.store_order_id}</span>
      </div>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: THEME.text }}>
              Commande {c.store_order_id}
            </h1>
            <Badge cfg={statutPaiementConfig[c.statut_paiement] || statutPaiementConfig['pending']} />
            <Badge cfg={statutCommandeConfig[c.statut_commande] || statutCommandeConfig['Unfulfilled']} />
            <Badge cfg={acceptCfg} />
            {c.risque_fraude === 'HIGH' && (
              <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#fee2e2', color: THEME.danger, border: `1px solid ${THEME.danger}`, borderRadius: '20px', padding: '4px 12px' }}>
                🚨 Risque élevé
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            Order ID: {c.id} · {formatDate(c.date_commande)} · {(c.mode_paiement || '').replace('e-Vend ', '')}
          </p>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, alignItems: 'center' }}>

          {/* ACCEPTER */}
          {c.statut_acceptation !== 'Accepted' && c.statut_acceptation !== 'Rejected' && (
            <button
              onClick={accepterCommande}
              disabled={savingAccept}
              style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: savingAccept ? 'not-allowed' : 'pointer', opacity: savingAccept ? 0.7 : 1, boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
              {savingAccept ? '...' : '✅ Accepter la commande'}
            </button>
          )}

          {/* REFUSER */}
          {c.statut_acceptation !== 'Rejected' && (
            <button
              onClick={() => setModalRefusOuvert(true)}
              style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
              ❌ Refuser la commande
            </button>
          )}

          {/* TRAITEMENT (si acceptée) */}
          {c.statut_acceptation === 'Accepted' && (
            <button
              onClick={() => setModalFulfillOuvert(true)}
              style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
              📦 Traitement & Suivi
            </button>
          )}

          <button onClick={() => setModalRMAOuvert(true)} style={{ backgroundColor: 'white', color: THEME.warning, border: `1px solid ${THEME.warning}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            ↩️ Demande RMA
          </button>

          {/* Menu Actions */}
          <div style={{ position: 'relative' as const }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setActionsOuvertes(!actionsOuvertes)} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Actions ▾
            </button>
            {actionsOuvertes && (
              <div style={{ position: 'absolute' as const, right: 0, top: '100%', marginTop: '4px', backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${THEME.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: '190px', overflow: 'hidden' }}>
                {[
                  { label: '🔄 Sync Shopify', action: () => {} },
                  { label: '🖨️ Facture vendeur', action: () => {} },
                  { label: '🖨️ Facture client', action: () => {} },
                  { label: '📧 Envoyer rappel client', action: () => {} },
                  { label: '💳 Capturer le paiement', action: () => setModalCaptureOuvert(true) },
                ].map((item, idx) => (
                  <button key={idx} onClick={() => { item.action(); setActionsOuvertes(false); }}
                    style={{ display: 'flex', width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderTop: idx > 0 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', fontSize: '13px', color: THEME.text, fontWeight: '600', textAlign: 'left' as const }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bannière succès */}
      {estComplete && (
        <div style={{ backgroundColor: '#dcfce7', border: `1px solid #86efac`, borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>✅</span>
          <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.success, margin: 0 }}>Cette commande est complète et livrée avec succès.</p>
        </div>
      )}

      {/* Bannière refusée */}
      {c.statut_acceptation === 'Rejected' && (
        <div style={{ backgroundColor: '#fee2e2', border: `1px solid ${THEME.danger}`, borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>❌</span>
          <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.danger, margin: 0 }}>Cette commande a été refusée. Aucune action supplémentaire n'est requise.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* ── COLONNE PRINCIPALE ── */}
        <div>

          {/* Produits & Fulfillment */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📦</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                Produits & Fulfillment
              </h3>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: THEME.textLight }}>{(c.produits || []).length} produit{(c.produits || []).length > 1 ? 's' : ''}</span>
            </div>

            {/* État fulfillment */}
            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{c.statut_commande === 'Fulfilled' ? '✅' : '⏳'}</span>
              <p style={{ fontSize: '12px', fontWeight: '600', color: THEME.textLight, margin: 0 }}>
                {c.statut_commande === 'Fulfilled' ? `Fulfillé le ${formatDate(c.date_commande)}` : 'En attente de fulfillment'}
              </p>
              {c.statut_livraison && (
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', backgroundColor: THEME.accentLight, color: THEME.accent, padding: '3px 10px', borderRadius: '20px' }}>
                  {c.statut_livraison}
                </span>
              )}
            </div>

            {/* Liste produits */}
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${THEME.border}` }}>
                  {['Produit', 'SKU', 'Prix unitaire', 'Qté', 'Total', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: '10px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(c.produits || []).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '44px', height: '44px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📦</div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{p.nom}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>#{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: THEME.textLight }}>{p.sku || '--'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: THEME.text }}>{p.prix.toFixed(2)} $</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: THEME.text }}>{p.qte}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: THEME.text }}>{(p.prix * p.qte).toFixed(2)} $</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge cfg={statutCommandeConfig[c.statut_commande] || statutCommandeConfig['Unfulfilled']} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Infos expédition actuelles */}
            <div style={{ padding: '16px 20px', borderTop: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: 0 }}>🚚 Informations d'expédition</p>
                {c.statut_acceptation === 'Accepted' && (
                  <button onClick={() => setModalFulfillOuvert(true)} style={{ background: 'none', border: `1px solid ${THEME.accent}`, borderRadius: '6px', padding: '4px 12px', fontSize: '11px', color: THEME.accent, fontWeight: '700', cursor: 'pointer' }}>
                    ✏️ Modifier
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'État du traitement', val: c.statut_livraison || '—' },
                  { label: 'Transporteur', val: c.transporteur || '—' },
                  { label: 'Numéro de suivi', val: c.numero_suivi || '—' },
                  { label: 'URL de suivi', val: c.url_suivi ? '🔗 Lien disponible' : 'N/A' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <p style={{ fontSize: '10px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase' as const, margin: '0 0 2px 0' }}>{item.label}</p>
                    {item.label === 'URL de suivi' && c.url_suivi ? (
                      <a href={c.url_suivi} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: THEME.accent, fontWeight: '600', textDecoration: 'none' }}>
                        🔗 Suivre le colis →
                      </a>
                    ) : (
                      <p style={{ fontSize: '13px', color: THEME.text, fontWeight: '600', margin: 0 }}>{item.val}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📋</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Billing & Shipping Details</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <div style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px 0' }}>📄 Facturation</p>
                {[
                  { label: 'Mode de paiement', val: (c.mode_paiement || '').replace('e-Vend ', '') },
                  { label: 'Nom', val: c.client_nom },
                  { label: 'Ville', val: c.ville },
                  { label: 'Province', val: c.province },
                  { label: 'Pays', val: c.pays },
                  { label: 'Courriel', val: c.client_email },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: THEME.textLight, minWidth: '130px', flexShrink: 0 }}>{item.label} —</span>
                    <span style={{ fontSize: '12px', color: THEME.text, fontWeight: '600' }}>{item.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px 0' }}>🚚 Livraison</p>
                {[
                  { label: 'Statut commande', val: <Badge cfg={statutCommandeConfig[c.statut_commande] || statutCommandeConfig['Unfulfilled']} /> },
                  { label: 'Nom', val: c.client_nom },
                  { label: 'Ville', val: c.ville },
                  { label: 'Province', val: c.province },
                  { label: 'Pays', val: c.pays },
                  { label: 'Méthode', val: 'Expédition gratuite' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: THEME.textLight, minWidth: '130px', flexShrink: 0 }}>{item.label} —</span>
                    {typeof item.val === 'string' ? (
                      <span style={{ fontSize: '12px', color: THEME.text, fontWeight: '600' }}>{item.val}</span>
                    ) : item.val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vendeur */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>🏪</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Détails du vendeur</h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {[
                { label: 'Nom du vendeur', val: c.vendeur_nom },
                { label: 'Nom de la boutique', val: c.boutique },
                { label: 'Numéro de facture', val: `e-V${c.id}` },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: THEME.textLight, minWidth: '160px' }}>{item.label} —</span>
                  <span style={{ fontSize: '13px', color: THEME.text, fontWeight: '600' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Client */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>👤</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Détails du client</h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {[
                { label: 'Nom', val: c.client_nom },
                { label: 'Courriel', val: c.client_email },
                { label: 'Ville', val: `${c.ville}, ${c.province}` },
                { label: 'Pays', val: c.pays },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: THEME.textLight, minWidth: '100px' }}>{item.label} —</span>
                  <span style={{ fontSize: '13px', color: THEME.text, fontWeight: '600' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div>

          {/* Statut actuel */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📊</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Statut actuel</h3>
            </div>
            <div style={{ padding: '0' }}>
              {[
                { label: 'Commandé le', val: formatDate(c.date_commande) },
                { label: 'Méthode livraison', val: 'Expédition gratuite' },
                { label: 'Expédition par', val: 'Merchant Shipping' },
                { label: 'Statut commande', val: <Badge cfg={statutCommandeConfig[c.statut_commande] || statutCommandeConfig['Unfulfilled']} /> },
                { label: 'Statut paiement', val: <Badge cfg={statutPaiementConfig[c.statut_paiement] || statutPaiementConfig['pending']} /> },
                { label: 'Acceptation', val: <Badge cfg={acceptCfg} /> },
              ].map((item, idx) => (
                <div key={idx} style={{ ...ligneStyle, backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', alignItems: 'center' }}>
                  <span style={labelStyle}>{item.label}</span>
                  {typeof item.val === 'string' ? (
                    <span style={{ ...valeurStyle, fontSize: '12px', textAlign: 'right' as const, maxWidth: '150px' }}>{item.val}</span>
                  ) : item.val}
                </div>
              ))}
            </div>
          </div>

          {/* Résumé financier */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>💰</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Résumé financier</h3>
            </div>
            <div>
              {[
                { label: 'Sous-total', val: `${sousTotal.toFixed(2)} $` },
                { label: 'Expédition', val: '0,00 $' },
                { label: 'Taxe totale', val: '0 $' },
                { label: 'Net (paiement)', val: `${montant.toFixed(2)} $`, bold: true },
              ].map((item, idx) => (
                <div key={idx} style={{ ...ligneStyle, backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <span style={item.bold ? { ...labelStyle, fontWeight: '800', color: THEME.text } : labelStyle}>{item.label}</span>
                  <span style={item.bold ? { ...valeurStyle, fontSize: '16px', color: THEME.accent } : valeurStyle}>{item.val}</span>
                </div>
              ))}
              {c.statut_paiement !== 'Paid' && (
                <div style={{ padding: '12px 20px' }}>
                  <button onClick={() => setModalCaptureOuvert(true)} style={{ width: '100%', backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    💳 Capturer le paiement
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gains vendeur */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>🏦</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Gains du vendeur</h3>
            </div>
            <div>
              {[
                { label: '📦 Gain produit',        val: `${earning_produit.toFixed(2)} $`,    color: THEME.success },
                { label: '🚚 Gain expédition',      val: `${earning_shipping.toFixed(2)} $`,   color: THEME.textLight },
                { label: '💸 Frais transaction',    val: `${transaction_charge.toFixed(2)} $`, color: THEME.danger },
                { label: '✅ Gain total',           val: `${totalEarning.toFixed(2)} $`,       color: THEME.accent, bold: true },
              ].map((item, idx) => (
                <div key={idx} style={{ ...ligneStyle, backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <span style={labelStyle}>{item.label}</span>
                  <span style={{ fontSize: item.bold ? '15px' : '13px', fontWeight: '700', color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Analysis */}
          <div style={{ ...sectionStyle, border: `2px solid ${c.risque_fraude === 'HIGH' ? THEME.danger : c.risque_fraude === 'MEDIUM' ? THEME.warning : THEME.border}` }}>
            <div style={{ ...sectionHeaderStyle, borderBottom: `2px solid ${risque.couleurBarre}`, backgroundColor: risque.bg }}>
              <span style={{ fontSize: '18px' }}>{risque.icon}</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: risque.color, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                Fraud Analysis — Shopify
              </h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: THEME.textLight, fontWeight: '600' }}>Niveau de risque</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: risque.color }}>{risque.label}</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', overflow: 'hidden', position: 'relative' as const }}>
                  <div style={{ position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: `${risque.pct}%`, backgroundColor: risque.couleurBarre, borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  {['Faible', 'Moyen', 'Élevé'].map((l, i) => (
                    <span key={i} style={{ fontSize: '10px', color: '#aaa', fontWeight: '600' }}>{l}</span>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: risque.bg, border: `1px solid ${risque.couleurBarre}40`, borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: risque.color, margin: '0 0 4px 0', textTransform: 'uppercase' as const }}>Recommandation Shopify</p>
                <p style={{ fontSize: '12px', color: risque.color, margin: 0 }}>
                  {c.risque_fraude === 'LOW' && 'Commande à faible risque. Aucune action requise.'}
                  {c.risque_fraude === 'MEDIUM' && "Vérification recommandée avant d'expédier."}
                  {c.risque_fraude === 'HIGH' && '⚠️ Risque élevé détecté — Ne pas expédier avant vérification manuelle.'}
                </p>
              </div>
              {(c.raisons_risque || []).length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: THEME.textLight, textTransform: 'uppercase' as const, margin: '0 0 8px 0' }}>Raisons détectées :</p>
                  {(c.raisons_risque || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', padding: '8px 12px', backgroundColor: '#fff5f5', borderRadius: '6px', border: `1px solid ${THEME.danger}20` }}>
                      <span style={{ fontSize: '12px', flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontSize: '12px', color: THEME.text }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {(c.raisons_risque || []).length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
                  <span>✅</span>
                  <span style={{ fontSize: '12px', color: THEME.success, fontWeight: '600' }}>Aucun indicateur de risque détecté.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL — TRAITEMENT & SUIVI (FULFILLMENT)
      ════════════════════════════════════════════════════════════════════════ */}
      {modalFulfillOuvert && (
        <div style={{ position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', boxShadow: '0 16px 56px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' as const }}>

            {/* Header modal */}
            <div style={{ padding: '20px 28px', backgroundColor: THEME.accentLight, borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: THEME.accent, textTransform: 'uppercase' as const }}>📦 Traitement de la commande</h3>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>Commande {c.store_order_id} · {c.client_nom}</p>
              </div>
              <button onClick={() => setModalFulfillOuvert(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: THEME.textLight, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* État du traitement */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                  📋 État du traitement *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {etatTraitementOptions.map(opt => (
                    <button key={opt} onClick={() => setEtatTraitement(opt)}
                      style={{
                        padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' as const,
                        border: etatTraitement === opt ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                        backgroundColor: etatTraitement === opt ? THEME.accentLight : 'white',
                        color: etatTraitement === opt ? THEME.accent : THEME.text,
                      }}>
                      {opt === 'Livré' ? '✅ ' : opt === 'En cours de livraison' ? '🚚 ' : opt === 'En préparation' ? '📦 ' : opt === 'Prêt pour expédition' ? '📫 ' : opt === 'En transit' ? '✈️ ' : opt === 'Tentative de livraison échouée' ? '❌ ' : '↩️ '}{opt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: THEME.border, margin: '20px 0' }} />

              {/* Transporteur + suivi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Transporteur</label>
                  <select value={transporteur} onChange={e => setTransporteur(e.target.value)}
                    style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Sélectionner...</option>
                    <option value="Poste Canada">📮 Poste Canada</option>
                    <option value="Purolator">🚚 Purolator</option>
                    <option value="FedEx">📦 FedEx</option>
                    <option value="UPS">🟤 UPS</option>
                    <option value="Canpar">🔵 Canpar</option>
                    <option value="DHL">🟡 DHL</option>
                    <option value="Autre">🔲 Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Numéro de suivi</label>
                  <input type="text" value={numeroSuivi} onChange={e => setNumeroSuivi(e.target.value)}
                    placeholder="ex: 1234567890"
                    style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
              </div>

              {/* URL suivi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>URL de suivi</label>
                <input type="text" value={urlSuivi} onChange={e => setUrlSuivi(e.target.value)}
                  placeholder="https://www.canadapost-postescanada.ca/track-reperage/..."
                  style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>

              {/* Note acheteur */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Note pour l'acheteur</label>
                <textarea rows={3} value={noteAcheteur} onChange={e => setNoteAcheteur(e.target.value)}
                  placeholder="Message visible par l'acheteur (ex: Votre colis est en route, livraison prévue demain...)"
                  style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                <p style={{ fontSize: '10px', color: THEME.textLight, margin: '4px 0 0 0' }}>
                  💡 API de suivi en temps réel à venir — pour l'instant, mise à jour manuelle.
                </p>
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalFulfillOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={enregistrerFulfillment} disabled={savingFulfill}
                  style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: savingFulfill ? 'not-allowed' : 'pointer', opacity: savingFulfill ? 0.7 : 1 }}>
                  {savingFulfill ? '⏳ Enregistrement...' : '💾 Enregistrer le traitement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL — REFUS DE COMMANDE
      ════════════════════════════════════════════════════════════════════════ */}
      {modalRefusOuvert && (
        <div style={{ position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#fee2e2', borderBottom: `2px solid ${THEME.danger}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: THEME.danger, textTransform: 'uppercase' as const }}>❌ Refuser la commande</h3>
              <p style={{ fontSize: '12px', color: '#991b1b', margin: 0 }}>Commande {c.store_order_id} · {c.client_nom}</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#fff5f5', border: `1px solid ${THEME.danger}30`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: THEME.danger, fontWeight: '700', margin: '0 0 4px 0' }}>⚠️ Action irréversible</p>
                <p style={{ fontSize: '12px', color: '#991b1b', margin: 0 }}>Une fois refusée, la commande ne pourra plus être traitée. Le client sera notifié.</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Raison du refus</label>
                <select style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none' }}>
                  <option>Produit en rupture de stock</option>
                  <option>Commande frauduleuse suspectée</option>
                  <option>Adresse de livraison invalide</option>
                  <option>Problème de paiement</option>
                  <option>Autre</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Note (optionnel)</label>
                <textarea rows={3} value={noteRefus} onChange={e => setNoteRefus(e.target.value)}
                  placeholder="Détails supplémentaires pour l'audit..."
                  style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalRefusOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={refuserCommande} disabled={savingRefus}
                  style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: savingRefus ? 'not-allowed' : 'pointer', opacity: savingRefus ? 0.7 : 1 }}>
                  {savingRefus ? '⏳...' : '❌ Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL — RMA
      ════════════════════════════════════════════════════════════════════════ */}
      {modalRMAOuvert && (
        <div style={{ position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#fef9c3', borderBottom: `2px solid ${THEME.warning}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#92400e', textTransform: 'uppercase' as const }}>↩️ Demande de retour (RMA)</h3>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Commande {c.store_order_id} · {c.client_nom}</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Raison du retour</label>
                <select style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none' }}>
                  <option>Produit défectueux</option>
                  <option>Produit non conforme à la description</option>
                  <option>Mauvais produit reçu</option>
                  <option>Produit endommagé lors de la livraison</option>
                  <option>Client a changé d'avis</option>
                  <option>Autre</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const }}>Notes</label>
                <textarea rows={3} placeholder="Détails supplémentaires..."
                  style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalRMAOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => setModalRMAOuvert(false)} style={{ backgroundColor: THEME.warning, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  ↩️ Soumettre RMA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL — CAPTURE PAIEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {modalCaptureOuvert && (
        <div style={{ position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '400px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#dcfce7', borderBottom: `2px solid ${THEME.success}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#166534', textTransform: 'uppercase' as const }}>💳 Capturer le paiement</h3>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Commande {c.store_order_id} · {montant.toFixed(2)} $</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '24px', fontWeight: '900', color: THEME.success, margin: '0 0 4px 0' }}>{montant.toFixed(2)} $</p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>Montant à capturer pour {c.client_nom}</p>
              </div>
              <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 20px 0' }}>
                Cette action va capturer le paiement auprès du client via {(c.mode_paiement || '').replace('e-Vend ', '')}.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalCaptureOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => setModalCaptureOuvert(false)} style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  💳 Capturer {montant.toFixed(2)} $
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
