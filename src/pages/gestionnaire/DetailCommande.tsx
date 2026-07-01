import React, { useState, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';
type StatutLivraison = 'Livré' | 'En transit' | 'En cours de livraison' | 'Prêt à récupérer' | 'En attente';

interface DetailCommandeProps {
  commandeId?: number;
  retourListe: () => void;
}

interface Commande {
  id: number;
  store_order_id: string;
  date_commande: string;
  client_nom: string;
  client_email: string;
  statut_paiement: string;
  statut_commande: string;
  statut_acceptation?: string;
  etape_livraison?: string;
  montant: number;
  sous_total: number;
  frais_expedition: number;
  tps: number; tvq: number; tvh: number;
  pourboire: number;
  mode_paiement?: string;
  transporteur?: string;
  numero_suivi?: string;
  url_suivi?: string;
  adresse_livraison?: any;
  adresse_facturation?: any;
  produits?: any[];
  retours?: any[];
}

function DetailCommande({ commandeId, retourListe }: DetailCommandeProps) {
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [acceptationEnCours, setAcceptationEnCours] = useState(false);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);

  // États modals
  const [menuActionsOuvert, setMenuActionsOuvert] = useState(false);
  const [menuSupplOuvert, setMenuSupplOuvert] = useState(false);
  const [modalStatutOuvert, setModalStatutOuvert] = useState(false);
  const [modalTraitementOuvert, setModalTraitementOuvert] = useState(false);
  
  // Nouveaux modals de confirmation
  const [modalConfirmationAccept, setModalConfirmationAccept] = useState(false);
  const [modalConfirmationRefuse, setModalConfirmationRefuse] = useState(false);
  const [modalAnnulation, setModalAnnulation] = useState(false);
  
  // État pour la raison d'annulation
  const [raisonAnnulation, setRaisonAnnulation] = useState('');

  // États formulaire modal traitement commande
  const [numeroSuivi, setNumeroSuivi] = useState('');
  const [methodeExpedition, setMethodeExpedition] = useState('');
  const [urlSuivi, setUrlSuivi] = useState('');
  const [notifierClient, setNotifierClient] = useState(true);
  const [quantites, setQuantites] = useState<{ [key: number]: number }>({});
  const [statutTemp, setStatutTemp] = useState<StatutLivraison>('En attente');

  // ✅ Token lu à chaque fetch — jamais figé au montage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (commandeId) chargerCommande(commandeId);
  }, [commandeId]);

  const chargerCommande = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/vendeurs/commande/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommande(data);
        setNumeroSuivi(data.numero_suivi || '');
        setMethodeExpedition(data.transporteur || '');
        setUrlSuivi(data.url_suivi || '');
        const initialQuantites: { [key: number]: number } = {};
        if (data.produits) {
          data.produits.forEach((p: any, idx: number) => {
            initialQuantites[idx] = p.quantite || 1;
          });
        }
        setQuantites(initialQuantites);
      } else {
        setErreur('Commande introuvable');
      }
    } catch (e) {
      setErreur('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const mapEtapeToStatut = (etape?: string): StatutLivraison => {
    const map: Record<string, StatutLivraison> = {
      'livree': 'Livré',
      'expediee': 'En transit',
      'livraison': 'En cours de livraison',
      'payee': 'En attente',
      'creee': 'En attente',
      'acceptee': 'En attente',
    };
    return map[etape?.toLowerCase() || ''] || 'En attente';
  };

  // CORRECTION ICI : Les valeurs doivent correspondre à celles attendues par l'acheteur
  const mapStatutToEtape = (statut: StatutLivraison): string => {
    const map: Record<string, string> = {
      'Livré': 'livree',
      'En transit': 'expediee',
      'En cours de livraison': 'livraison',
      'Prêt à récupérer': 'livraison',
      'En attente': 'payee',
    };
    return map[statut] || 'payee';
  };

  // Ouvrir le modal de confirmation d'acceptation
  const ouvrirModalAcceptation = () => {
    setModalConfirmationAccept(true);
  };

  // Ouvrir le modal de confirmation de refus
  const ouvrirModalRefus = () => {
    setModalConfirmationRefuse(true);
  };

  // Ouvrir le modal d'annulation
  const ouvrirModalAnnulation = () => {
    setRaisonAnnulation('');
    setModalAnnulation(true);
    setMenuActionsOuvert(false);
  };

  // Confirmer l'annulation de la commande
  const confirmerAnnulation = async () => {
    if (!commande) return;
    
    if (!raisonAnnulation.trim()) {
      alert('Veuillez entrer une raison pour l\'annulation');
      return;
    }
    
    setAnnulationEnCours(true);
    
    try {
      const res = await fetch(`${API}/api/vendeurs/commande/${commande.id}/annuler`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raison_annulation: raisonAnnulation.trim() })
      });
      
      if (res.ok) {
        alert('❌ Commande annulée avec succès');
        setModalAnnulation(false);
        chargerCommande(commande.id);
      } else {
        const error = await res.json();
        alert(`❌ Erreur: ${error.message || 'Erreur lors de l\'annulation'}`);
      }
    } catch (e) {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setAnnulationEnCours(false);
    }
  };

  // Confirmer l'acceptation de la commande
  const confirmerAcceptation = async () => {
    if (!commande) return;
    
    setAcceptationEnCours(true);
    setModalConfirmationAccept(false);
    
    try {
      const res = await fetch(`${API}/api/vendeurs/commande/${commande.id}/accepter`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'accept' })
      });
      
      if (res.ok) {
        setCommande(prev => prev ? { ...prev, statut_acceptation: 'Accepted' } : prev);
        setModalTraitementOuvert(true);
      } else {
        const error = await res.json();
        alert(`❌ Erreur: ${error.message || 'Erreur lors de l\'acceptation'}`);
      }
    } catch (e) {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setAcceptationEnCours(false);
    }
  };

  // Confirmer le refus de la commande
  const confirmerRefus = async () => {
    if (!commande) return;
    
    setAcceptationEnCours(true);
    setModalConfirmationRefuse(false);
    
    try {
      const res = await fetch(`${API}/api/vendeurs/commande/${commande.id}/refuser`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'refuse' })
      });
      
      if (res.ok) {
        alert('❌ Commande refusée');
        setCommande(prev => prev ? { ...prev, statut_acceptation: 'Rejected' } : prev);
      } else {
        const error = await res.json();
        alert(`❌ Erreur: ${error.message || 'Erreur lors du refus'}`);
      }
    } catch (e) {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setAcceptationEnCours(false);
    }
  };

  // Modifier les infos de la commande (réouvrir le modal)
  const modifierInfosCommande = () => {
    setModalTraitementOuvert(true);
  };

  // Sauvegarder le traitement de la commande
  const sauvegarderTraitement = async () => {
    if (!commande) return;
    setSauvegarde(true);
    try {
      const body: any = {
        numero_suivi: numeroSuivi,
        transporteur: methodeExpedition,
        url_suivi: urlSuivi,
        quantites: quantites,
        etape_livraison: mapStatutToEtape(statutTemp),
        notifier_client: notifierClient
      };
      
      const res = await fetch(`${API}/api/vendeurs/commande/${commande.id}/traiter`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${getToken()}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        alert('✅ Commande traitée avec succès !');
        setModalTraitementOuvert(false);
        chargerCommande(commande.id);
      } else {
        const error = await res.json();
        alert(`❌ Erreur: ${error.error || 'Erreur lors du traitement'}`);
      }
    } catch (e) {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setSauvegarde(false);
    }
  };

  // Sauvegarder statut de livraison (RMA)
  const sauvegarderStatut = async () => {
    if (!commande) return;
    setSauvegarde(true);
    try {
      const body: any = {
        numero_suivi: commande.numero_suivi || '',
        transporteur: commande.transporteur || '',
        url_suivi: commande.url_suivi || '',
      };
      
      const res = await fetch(`${API}/api/suivi/commandes/${commande.id}/suivi`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${getToken()}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setCommande(prev => prev ? { 
          ...prev, 
          etape_livraison: mapStatutToEtape(statutTemp),
          statut_commande: mapStatutToEtape(statutTemp)
        } : prev);
        setModalStatutOuvert(false);
        alert('✅ Statut de livraison mis à jour!');
      } else {
        alert('❌ Erreur lors de la mise à jour du statut');
      }
    } catch (e) {
      alert('❌ Erreur de connexion');
    } finally {
      setSauvegarde(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────
  const sectionShippingStyle: React.CSSProperties = {
    backgroundColor: '#f0f5f5', borderRadius: '6px', padding: '8px 12px',
    marginBottom: '14px', borderLeft: '3px solid #537373',
  };

  const statutBadge = (statut: string) => {
    const s = statut?.toLowerCase() || '';
    let bg = '#EAF4FB', color = '#1A6FA0', border = '#AED6F1';
    if (s.includes('pay') || s.includes('fulfill') || s.includes('livr') || s.includes('trait') || s.includes('accept')) {
      bg = '#E9F7EF'; color = '#1E8449'; border = '#27AE60';
    } else if (s.includes('annul') || s.includes('rejet') || s.includes('void') || s.includes('refund')) {
      bg = '#FDECEA'; color = '#C0392B'; border = '#E74C3C';
    } else if (s.includes('attente') || s.includes('pending')) {
      bg = '#FEF9E7'; color = '#B7950B'; border = '#F39C12';
    }
    return (
      <span style={{ backgroundColor: bg, color, border: `1px solid ${border}`, padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
        {statut}
      </span>
    );
  };

  const infoRow = (label: string, valeur: string) => (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: '12px', color: '#888', width: '180px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{valeur || '—'}</span>
    </div>
  );

  const sectionCard = (titre: string, emoji: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e1e3e5', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '12px 18px', backgroundColor: '#f0f5f5', borderBottom: '2px solid #537373', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{emoji}</span>
        <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#537373', textTransform: 'uppercase' }}>{titre}</h3>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatMontant = (n?: number) => n !== undefined ? `$${parseFloat(String(n)).toFixed(2)}` : '$0.00';

  const afficherBoutonsAcceptation = commande && commande.statut_acceptation === 'Pending';
  const afficherBoutonModification = commande && commande.statut_acceptation === 'Accepted';

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#537373' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
      <p style={{ fontSize: '14px' }}>Chargement de la commande...</p>
    </div>
  );

  if (erreur || !commande) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
      <p style={{ color: '#C0392B', marginBottom: '16px' }}>{erreur || 'Commande introuvable'}</p>
      <button onClick={retourListe} style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>← Retour</button>
    </div>
  );

  const addrLiv = commande.adresse_livraison || {};
  const addrFact = commande.adresse_facturation || {};
  const articles = Array.isArray(commande.produits) ? commande.produits : [];
  const etapeLabel = {
    creee: 'Créée', payee: 'Payée', acceptee: 'Acceptée', traitement: 'En traitement',
    traitee: 'Traitée', expediee: 'Expédiée', livraison: 'En livraison', livree: 'Livrée',
    annulee: 'Annulée', refusee: 'Refusée',
  }[commande.etape_livraison || 'creee'] || commande.etape_livraison;

  const commission = parseFloat(String(commande.montant || 0)) * 0.15;
  const gains = parseFloat(String(commande.montant || 0)) - commission;

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}
      onClick={() => { setMenuActionsOuvert(false); setMenuSupplOuvert(false); }}>
      <div style={{ padding: '20px 24px' }}>

        {/* Fil d'Ariane */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
            <span onClick={retourListe} style={{ color: '#537373', fontWeight: '600', cursor: 'pointer' }}>Commandes</span>
            {' / '}<span style={{ color: '#333' }}>#{commande.store_order_id || commande.id}</span>
          </p>
          <button onClick={retourListe} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', color: '#537373', fontWeight: '700' }}>← Retour</button>
        </div>

        {/* En-tête */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e1e3e5', padding: '18px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', borderLeft: '4px solid #537373' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#2c3e50' }}>
              Commande #{commande.store_order_id || commande.id}
            </h1>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{formatDate(commande.date_commande)}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {statutBadge(etapeLabel || '—')}
            {statutBadge(commande.statut_paiement === 'Paid' ? 'Payé' : commande.statut_paiement === 'voided' ? 'Annulé' : commande.statut_paiement === 'refunded' ? 'Remboursé' : 'En attente')}
            {commande.statut_acceptation && statutBadge(commande.statut_acceptation)}
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* COLONNE GAUCHE */}
          <div>
            {sectionCard('Produits & Expédition', '📦', (
              <>
                {/* Résumé statut */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '10px 14px', backgroundColor: '#f0f5f5', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: 0 }}>
                      {articles.length} article{articles.length !== 1 ? 's' : ''} — {etapeLabel}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{formatDate(commande.date_commande)}</p>
                  </div>
                </div>

                {/* Table produits */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#537373' }}>
                      {['ID PRODUIT', 'IMAGE', 'NOM DU PRODUIT', 'PRIX', 'SKU', 'QTÉ', 'STATUT'].map((col, i) => (
                        <th key={i} style={{ padding: '9px 10px', fontSize: '10px', fontWeight: '700', color: 'white', textAlign: 'left', borderRight: '1px solid #6a8f8f' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {articles.length > 0 ? articles.map((a: any, i: number) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#537373', fontWeight: '600' }}>#{a.shopify_id || '—'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {a.image ? <img src={a.image} alt={a.nom} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /> : <span style={{ fontSize: '20px' }}>📦</span>}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{a.nom}</td>
                        <td style={{ padding: '10px', fontSize: '12px', fontWeight: '600' }}>${parseFloat(a.prix || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#888' }}>{a.sku || '—'}</td>
                        <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>{a.quantite || 1}</td>
                        <td style={{ padding: '10px' }}>{statutBadge(etapeLabel || '—')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px' }}>Aucun produit disponible</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Infos suivi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px 0' }}>Méthode d'expédition</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: 0 }}>{commande.transporteur || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px 0' }}>Numéro de suivi</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#537373', margin: 0, wordBreak: 'break-all' }}>{commande.numero_suivi || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px 0' }}>URL de suivi</p>
                    {commande.url_suivi
                      ? <a href={commande.url_suivi} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1A6FA0', fontWeight: '600' }}>🔗 Ouvrir</a>
                      : <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>N/A</p>
                    }
                  </div>
                </div>

                {/* LIGNE DES BOUTONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div>
                    {afficherBoutonsAcceptation && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={ouvrirModalAcceptation}
                          disabled={acceptationEnCours}
                          style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px', 
                            padding: '8px 20px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: acceptationEnCours ? 'wait' : 'pointer',
                            opacity: acceptationEnCours ? 0.7 : 1
                          }}>
                          ✓ Accepter la commande
                        </button>
                        <button 
                          onClick={ouvrirModalRefus}
                          disabled={acceptationEnCours}
                          style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px', 
                            padding: '8px 20px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: acceptationEnCours ? 'wait' : 'pointer',
                            opacity: acceptationEnCours ? 0.7 : 1
                          }}>
                          ✗ Refuser la commande
                        </button>
                      </div>
                    )}
                    {afficherBoutonModification && (
                      <button 
                        onClick={modifierInfosCommande}
                        style={{ 
                          backgroundColor: '#9b59b6', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '8px 20px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          cursor: 'pointer'
                        }}>
                        ✏️ Modifier les infos de la commande
                      </button>
                    )}
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuActionsOuvert(!menuActionsOuvert); }}
                      style={{ 
                        backgroundColor: '#537373', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '8px 20px', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                      Plus ▾
                    </button>
                    {menuActionsOuvert && (
                      <div onClick={e => e.stopPropagation()} style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '40px', 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e1e3e5', 
                        zIndex: 999, 
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', 
                        minWidth: '220px',
                        overflow: 'hidden'
                      }}>
                        {[
                          { icon: '🖨️', label: 'Imprimer la facture du client', action: () => { window.print(); setMenuActionsOuvert(false); } },
                          { icon: '📦', label: "Bordereau d'emballage", action: () => setMenuActionsOuvert(false) },
                          { icon: '🚫', label: "Annuler l'exécution", action: ouvrirModalAnnulation },
                        ].map((item: any, i) => (
                          <button 
                            key={i} 
                            onClick={item.action}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              width: '100%', 
                              padding: '10px 14px', 
                              border: 'none', 
                              backgroundColor: 'white', 
                              cursor: 'pointer', 
                              fontSize: '13px', 
                              color: '#333', 
                              textAlign: 'left',
                              borderBottom: i < 2 ? '1px solid #f5f5f5' : 'none'
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f5f5'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}
                          >
                            <span>{item.icon}</span><span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ))}

            {sectionCard('Facturation & Expédition', '📍', (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '2px solid #f0f5f5', paddingBottom: '6px' }}>Détails de facturation</h4>
                  {infoRow('Mode de paiement', commande.mode_paiement || 'e-Vend Stripe')}
                  {infoRow('Nom', addrFact.nom || commande.client_nom)}
                  {infoRow('Adresse', addrFact.ligne1 || '—')}
                  {infoRow('Code postal', addrFact.code_postal || '—')}
                  {infoRow('Ville', addrFact.ville || '—')}
                  {infoRow('Province', addrFact.province || '—')}
                  {infoRow('Pays', addrFact.pays || '—')}
                </div>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '2px solid #f0f5f5', paddingBottom: '6px' }}>Détails d'expédition</h4>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', width: '140px', flexShrink: 0 }}>Statut</span>
                    {statutBadge(etapeLabel || '—')}
                  </div>
                  {infoRow('Nom', addrLiv.nom || commande.client_nom)}
                  {infoRow('Adresse de livraison', addrLiv.ligne1 || '—')}
                  {infoRow('Code postal', addrLiv.code_postal || '—')}
                  {infoRow('Ville', addrLiv.ville || '—')}
                  {infoRow('Province', addrLiv.province || '—')}
                  {infoRow('Pays', addrLiv.pays || '—')}
                </div>
              </div>
            ))}

            {sectionCard('Détails du client', '👤', (
              <>
                {infoRow('Nom', commande.client_nom)}
                {infoRow('E-mail', commande.client_email)}
              </>
            ))}

            {sectionCard('Liste des demandes de retour (RMA)', '↩️', (
              commande.retours && commande.retours.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#537373' }}>
                      {['#', 'Date', 'Raison', 'Statut', 'Action'].map((col, i) => (
                        <th key={i} style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'left' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commande.retours.map((r: any, i: number) => (
                      <tr key={i} style={{ backgroundColor: '#fafafa' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#537373' }}>{r.id}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px' }}>{formatDate(r.date_creation)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px' }}>{r.raisons?.join(', ') || 'Autres'}</td>
                        <td style={{ padding: '10px 12px' }}>{statutBadge(r.statut)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Voir</button>
                            <button onClick={() => { setStatutTemp(mapEtapeToStatut(commande.etape_livraison)); setModalStatutOuvert(true); }}
                              style={{ backgroundColor: '#1A6FA0', color: 'white', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Statut</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
              ) : (
                <p style={{ color: '#aaa', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '16px 0', margin: 0 }}>Aucune demande de retour pour cette commande.</p>
              )
            ))}
          </div>

          {/* COLONNE DROITE */}
          <div>
            {sectionCard('État actuel de la commande', '📊', (
              <>
                {[
                  { label: 'Commandé le', val: formatDate(commande.date_commande) },
                  { label: 'Mode de livraison', val: commande.transporteur || 'Expédition gratuite' },
                  { label: 'Frais de port par', val: 'Expédition marchand' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>{item.label} →</span>
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500', textAlign: 'right' }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: '11px', color: '#888' }}>Statut commande →</span>
                  {statutBadge(etapeLabel || '—')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: '11px', color: '#888' }}>Statut paiement →</span>
                  {statutBadge(commande.statut_paiement === 'Paid' ? 'Payé' : commande.statut_paiement || '—')}
                </div>
                {[
                  { label: 'Sous-total', val: formatMontant(commande.sous_total || commande.montant) },
                  { label: 'Expédition', val: formatMontant(commande.frais_expedition) },
                  { label: 'TPS (5%)', val: formatMontant(commande.tps) },
                  { label: 'TVQ (9.975%)', val: formatMontant(commande.tvq) },
                  { label: 'TVH', val: formatMontant(commande.tvh) },
                  ...(parseFloat(String(commande.pourboire || 0)) > 0 ? [{ label: '💝 Pourboire', val: formatMontant(commande.pourboire) }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>{item.label} →</span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '4px', borderTop: '2px solid #537373' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#537373' }}>Paiement net →</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#537373' }}>{formatMontant(commande.montant)}</span>
                </div>
              </>
            ))}

            {sectionCard('Gains du vendeur', '💰', (
              <>
                {[
                  { label: 'Revenus des produits', val: formatMontant(gains), couleur: '#1E8449' },
                  { label: "Revenus frais d'expédition", val: formatMontant(commande.frais_expedition), couleur: '#333' },
                  { label: 'Taxes sur les bénéfices', val: '$0.00', couleur: '#333' },
                  { label: 'Revenus des pourboires', val: formatMontant(commande.pourboire), couleur: '#333' },
                  { label: 'Frais de transaction', val: `-$${commission.toFixed(2)}`, couleur: '#C0392B' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>{item.label} →</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: item.couleur }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '4px', borderTop: '2px solid #537373' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#537373' }}>Total des gains →</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#537373' }}>{formatMontant(gains)}</span>
                </div>
              </>
            ))}

            {sectionCard('Détails supplémentaires', '🔧', (
              <>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Sélectionnez l'option dans le menu déroulant pour effectuer l'action requise.</p>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <button onClick={e => { e.stopPropagation(); setMenuSupplOuvert(!menuSupplOuvert); }}
                    style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Plus ▾
                  </button>
                  {menuSupplOuvert && (
                    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 0, top: '36px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e3e5', zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '220px', overflow: 'hidden' }}>
                      {[
                        { icon: '🖨️', label: 'Imprimer la facture du client', action: () => { window.print(); setMenuSupplOuvert(false); } },
                        { icon: '📦', label: "Bordereau d'emballage", action: () => setMenuSupplOuvert(false) },
                        { icon: '📈', label: 'Imprimer votre relevé de vente', action: () => setMenuSupplOuvert(false) },
                      ].map((item: any, i) => (
                        <button key={i} onClick={item.action}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', color: '#537373', textAlign: 'left', borderBottom: i < 2 ? '1px solid #f5f5f5' : 'none', fontWeight: '500' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f5f5'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}
                        >
                          <span>{item.icon}</span><span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ))}

            {sectionCard('Analyse de fraude', '🛡️', (
              <>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Risque basé sur le profil de paiement.</p>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                    <span>BAS</span><span>MOYEN</span><span>HAUT</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: commande.statut_paiement === 'Paid' ? '20%' : '50%', height: '100%', backgroundColor: commande.statut_paiement === 'Paid' ? '#27AE60' : '#F39C12', borderRadius: '5px' }} />
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: '#537373', fontWeight: '600', margin: '8px 0 0 0' }}>
                  {commande.statut_paiement === 'Paid' ? 'Risque faible — Recommandation: Approuver' : 'Risque moyen — Vérifier la commande'}
                </p>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION ACCEPTATION */}
      {modalConfirmationAccept && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>✅</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'center', color: '#2c3e50' }}>Confirmer l'acceptation</h3>
            <p style={{ fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '16px' }}>
              En acceptant cette commande, vous vous engagez à :
            </p>
            <ul style={{ marginBottom: '24px', paddingLeft: '20px', color: '#555', fontSize: '13px' }}>
              <li>✓ Traiter la commande dans les délais impartis</li>
              <li>✓ Préparer et emballer les produits correctement</li>
              <li>✓ Expédier la commande à l'adresse fournie</li>
              <li>✓ Fournir un numéro de suivi dès l'expédition</li>
            </ul>
            <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '24px', fontStyle: 'italic' }}>
              Une fois acceptée, vous ne pourrez plus refuser cette commande.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setModalConfirmationAccept(false)}
                style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button 
                onClick={confirmerAcceptation}
                style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Confirmer l'acceptation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION REFUS */}
      {modalConfirmationRefuse && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>⚠️</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'center', color: '#dc3545' }}>Confirmer le refus</h3>
            <p style={{ fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '16px' }}>
              Êtes-vous sûr de vouloir <strong style={{ color: '#dc3545' }}>REFUSER</strong> cette commande ?
            </p>
            <div style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#856404', margin: 0 }}>
                ⚠️ <strong>Attention : Cette action est irréversible !</strong>
              </p>
              <p style={{ fontSize: '12px', color: '#856404', margin: '8px 0 0 0' }}>
                Le client sera automatiquement remboursé et vous ne pourrez plus revenir en arrière.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setModalConfirmationRefuse(false)}
                style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button 
                onClick={confirmerRefus}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ✗ Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL D'ANNULATION */}
      {modalAnnulation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>🚫</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'center', color: '#dc3545' }}>Annuler la commande</h3>
            
            <div style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#856404', margin: 0, fontWeight: 'bold' }}>
                ⚠️ ATTENTION : Cette action est irréversible !
              </p>
              <p style={{ fontSize: '12px', color: '#856404', margin: '8px 0 0 0' }}>
                L'annulation d'une commande entraîne :
              </p>
              <ul style={{ margin: '8px 0 0 20px', fontSize: '12px', color: '#856404' }}>
                <li>Le remboursement automatique du client</li>
                <li>L'annulation de l'exécution de la commande</li>
                <li>La perte des frais de transaction (non remboursés)</li>
                <li>L'impossibilité de revenir en arrière</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Raison de l'annulation <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                placeholder="Veuillez expliquer la raison de l'annulation..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              <button 
                onClick={() => setModalAnnulation(false)}
                style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button 
                onClick={confirmerAnnulation}
                disabled={annulationEnCours || !raisonAnnulation.trim()}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '10px 24px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  cursor: (annulationEnCours || !raisonAnnulation.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (annulationEnCours || !raisonAnnulation.trim()) ? 0.6 : 1
                }}>
                {annulationEnCours ? '⏳ Annulation...' : '✓ Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNIQUE - Traitement de la commande */}
      {modalTraitementOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '600px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#2c3e50' }}>📦 Traitement de la commande #{commande?.store_order_id || commande?.id}</h3>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px 0' }}>Sélectionnez les produits à traiter et les informations de livraison.</p>

            <div style={sectionShippingStyle}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: 0, textTransform: 'uppercase' }}>Produits à traiter</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f5f5' }}>
                  <th style={{ padding: '10px', fontSize: '12px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>Quantité commandée</th>
                  <th style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>Quantité à traiter</th>
                  <th style={{ padding: '10px', fontSize: '12px', textAlign: 'right' }}>Prix unitaire</th>
                 </tr>
              </thead>
              <tbody>
                {articles.map((article: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontSize: '13px' }}>
                      <div><strong>{article.nom}</strong></div>
                      <div style={{ fontSize: '11px', color: '#888' }}>ID: {article.shopify_id || article.id}</div>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center' }}>{article.quantite || 1}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max={article.quantite || 1}
                        value={quantites[idx] || 0}
                        onChange={(e) => setQuantites({...quantites, [idx]: parseInt(e.target.value) || 0})}
                        style={{ width: '70px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right' }}>${parseFloat(article.prix || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={sectionShippingStyle}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: 0, textTransform: 'uppercase' }}>Méthode d'expédition</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <select 
                value={methodeExpedition} 
                onChange={e => setMethodeExpedition(e.target.value)}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontSize: '13px' }}
              >
                <option value="">Sélectionnez une méthode</option>
                <option value="Livraison Marketplace">Livraison Marketplace</option>
                <option value="Poste Canada">Poste Canada</option>
                <option value="Purolator">Purolator</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div style={sectionShippingStyle}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: 0, textTransform: 'uppercase' }}>Informations de suivi</p>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Numéro de suivi <span style={{ color: '#999', fontWeight: '400' }}>(facultatif)</span></label>
              <input type="text" value={numeroSuivi} onChange={e => setNumeroSuivi(e.target.value)} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>URL de suivi <span style={{ color: '#999', fontWeight: '400' }}>(facultatif)</span></label>
              <input type="text" value={urlSuivi} onChange={e => setUrlSuivi(e.target.value)} placeholder="https://..." style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="notif-traitement" checked={notifierClient} onChange={e => setNotifierClient(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#537373', width: '16px', height: '16px' }} />
              <label htmlFor="notif-traitement" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Envoyer un e-mail de notification au client</label>
            </div>

            <div style={sectionShippingStyle}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: 0, textTransform: 'uppercase' }}>Statut de livraison</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <select value={statutTemp} onChange={e => setStatutTemp(e.target.value as StatutLivraison)}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontSize: '13px' }}>
                <option value="En attente">⏳ En attente</option>
                <option value="En transit">🚚 En transit</option>
                <option value="En cours de livraison">📍 En cours de livraison</option>
                <option value="Prêt à récupérer">🏪 Prêt à récupérer</option>
                <option value="Livré">✅ Livré</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <button onClick={() => setModalTraitementOuvert(false)}
                style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={sauvegarderTraitement} disabled={sauvegarde}
                style={{ backgroundColor: sauvegarde ? '#999' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: sauvegarde ? 'wait' : 'pointer' }}>
                {sauvegarde ? '⏳ Traitement...' : '✅ Remplir les articles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Changer statut RMA */}
      {modalStatutOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '420px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', textTransform: 'uppercase', color: '#2c3e50' }}>Changer le statut</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 20px 0' }}>Sélectionnez le nouveau statut de livraison.</p>
            <select value={statutTemp} onChange={e => setStatutTemp(e.target.value as StatutLivraison)}
              style={{ width: '100%', border: '2px solid #537373', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', marginBottom: '20px', boxSizing: 'border-box' }}>
              <option value="Livré">✅ Livré</option>
              <option value="En transit">🚚 En transit</option>
              <option value="En cours de livraison">📍 En cours de livraison</option>
              <option value="Prêt à récupérer">🏪 Prêt à récupérer sur place</option>
              <option value="En attente">⏳ En attente</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalStatutOuvert(false)} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
              <button onClick={sauvegarderStatut} style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailCommande;