import React, { useState, useEffect } from 'react';

function Toggle({ actif, onChange }: { actif: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '48px', height: '26px', borderRadius: '13px',
        backgroundColor: actif ? '#537373' : '#ccc',
        cursor: 'pointer', position: 'relative',
        transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: actif ? '25px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

function ConfigurationGenerale() {

  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Récupérer l'ID du vendeur connecté depuis le token JWT
  const getVendeurId = (): number => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.vendeur_id || payload.userId || 0;
    } catch { return 0; }
  };
  const vendeurId = getVendeurId();

  // Détecter retour depuis Stripe onboarding
  const stripeRetour = new URLSearchParams(window.location.search).get('stripe');
  const [stripeMessage, setStripeMessage] = useState<'success' | 'refresh' | null>(
    stripeRetour === 'success' ? 'success' : stripeRetour === 'refresh' ? 'refresh' : null
  );

  // ── Paramètres généraux ──
  const [montantMinimum, setMontantMinimum] = useState(false);
  const [montantPour, setMontantPour] = useState('TOUS LES CLIENTS');
  const [montantValeur, setMontantValeur] = useState('0');
  const [courierCC, setCourierCC] = useState(false);
  const [emailCC, setEmailCC] = useState('');
  const [listeCC, setListeCC] = useState<string[]>([]);
  const [approbationCommentaires, setApprobationCommentaires] = useState(false);
  const [fuseauHoraire, setFuseauHoraire] = useState(false);
  const [fuseauSelectionne, setFuseauSelectionne] = useState('');
  const [deuxFacteurs, setDeuxFacteurs] = useState(false);

  // ── Configuration boutique
  const [afficherNumEntreprise, setAfficherNumEntreprise] = useState(false);
  const [afficherNumTaxes, setAfficherNumTaxes] = useState(false);
  const [afficherAdresseEntreprise, setAfficherAdresseEntreprise] = useState(false);
  const [afficherTelephone, setAfficherTelephone] = useState(false);

  // ── Vacances ──
  const [vacancesActif, setVacancesActif] = useState(false);
  const [joursVacancesDebut, setJoursVacancesDebut] = useState('');
  const [joursVacancesFin, setJoursVacancesFin] = useState('');
  const [operationProduit, setOperationProduit] = useState('continuer');
  const [messageVacances, setMessageVacances] = useState('');

  // ── Paiements ──
  const [paypalActif, setPaypalActif] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [stripeActif, setStripeActif] = useState(false);

  // ── Stripe Connect ──
  const [stripeConnecte, setStripeConnecte]       = useState(false);
  const [stripeVerifie, setStripeVerifie]         = useState(false);
  const [stripeAccountId, setStripeAccountId]     = useState('');
  const [stripeAccountType, setStripeAccountType] = useState('');
  const [stripeDocsManquants, setStripeDocsManquants] = useState<string[]>([]);
  const [stripePopup, setStripePopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stripeChargement, setStripeChargement]   = useState(false);

  // ── Shipping — Shippo ──
  const [shippoActif, setShippoActif] = useState(false);
  const [shippoApiToken, setShippoApiToken] = useState('');
  const [shippoMode, setShippoMode] = useState<'test' | 'production'>('test');

  // ── Shipping — EasyPost ──
  const [easypostActif, setEasypostActif] = useState(false);
  const [easypostCleTest, setEasypostCleTest] = useState('');
  const [easypostCleProd, setEasypostCleProd] = useState('');
  const [easypostMode, setEasypostMode] = useState<'test' | 'production'>('test');

  // ── Shipping — Postes Canada ──
  const [postesActif, setPostesActif] = useState(false);
  const [postesUsername, setPostesUsername] = useState('');
  const [postesPassword, setPostesPassword] = useState('');
  const [postesCustomerNumber, setPostesCustomerNumber] = useState('');
  const [postesMode, setPostesMode] = useState<'dev' | 'production'>('dev');

  // Charger la configuration au chargement du composant
  useEffect(() => {
    chargerConfiguration();
  }, []);

  const chargerConfiguration = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); // Récupérer le token d'authentification
      const response = await fetch(`/api/vendeurs/${vendeurId}/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la configuration');
      }
      
      const data = await response.json();
      
      // Remplir les states avec les données récupérées
      setMontantMinimum(data.montant_minimum_actif || false);
      setMontantPour(data.montant_minimum_pour || 'TOUS LES CLIENTS');
      setMontantValeur(data.montant_minimum_valeur?.toString() || '0');
      setCourierCC(data.courier_cc_actif || false);
      setListeCC(data.courier_cc_liste || []);
      setApprobationCommentaires(data.approbation_commentaires_auto || false);
      setFuseauHoraire(data.fuseau_horaire_actif || false);
      setFuseauSelectionne(data.fuseau_horaire_selectionne || '');
      setDeuxFacteurs(data.deux_facteurs_actif || false);
      setAfficherNumEntreprise(data.afficher_num_entreprise || false);
      setAfficherNumTaxes(data.afficher_num_taxes || false);
      setAfficherAdresseEntreprise(data.afficher_adresse_entreprise || false);
      setAfficherTelephone(data.afficher_telephone || false);
      setVacancesActif(data.vacances_actif || false);
      setJoursVacancesDebut(data.vacances_date_debut || '');
      setJoursVacancesFin(data.vacances_date_fin || '');
      setOperationProduit(data.vacances_operation_produit || 'continuer');
      setMessageVacances(data.vacances_message || '');
      setPaypalActif(data.paypal_actif || false);
      setPaypalEmail(data.paypal_email || '');
      setStripeActif(data.stripe_actif || false);

      // Charger le statut Stripe Connect en temps réel
      chargerStatutStripe();
      setShippoActif(data.shippo_actif || false);
      setShippoApiToken(data.shippo_api_token || '');
      setShippoMode(data.shippo_mode || 'test');
      setEasypostActif(data.easypost_actif || false);
      setEasypostCleTest(data.easypost_cle_test || '');
      setEasypostCleProd(data.easypost_cle_prod || '');
      setEasypostMode(data.easypost_mode || 'test');
      setPostesActif(data.postes_actif || false);
      setPostesUsername(data.postes_username || '');
      setPostesPassword(data.postes_password || '');
      setPostesCustomerNumber(data.postes_customer_number || '');
      setPostesMode(data.postes_mode || 'dev');
      
    } catch (err) {
      console.error('Erreur chargement config:', err);
      setError('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  const sauvegarderConfiguration = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    const configData = {
      montant_minimum_actif: montantMinimum,
      montant_minimum_pour: montantPour,
      montant_minimum_valeur: parseFloat(montantValeur) || 0,
      courier_cc_actif: courierCC,
      courier_cc_liste: listeCC,
      approbation_commentaires_auto: approbationCommentaires,
      fuseau_horaire_actif: fuseauHoraire,
      fuseau_horaire_selectionne: fuseauSelectionne,
      deux_facteurs_actif: deuxFacteurs,
      afficher_num_entreprise: afficherNumEntreprise,
      afficher_num_taxes: afficherNumTaxes,
      afficher_adresse_entreprise: afficherAdresseEntreprise,
      afficher_telephone: afficherTelephone,
      vacances_actif: vacancesActif,
      vacances_date_debut: joursVacancesDebut || null,
      vacances_date_fin: joursVacancesFin || null,
      vacances_operation_produit: operationProduit,
      vacances_message: messageVacances,
      paypal_actif: paypalActif,
      paypal_email: paypalEmail,
      stripe_actif: stripeActif,
      shippo_actif: shippoActif,
      shippo_api_token: shippoApiToken,
      shippo_mode: shippoMode,
      easypost_actif: easypostActif,
      easypost_cle_test: easypostCleTest,
      easypost_cle_prod: easypostCleProd,
      easypost_mode: easypostMode,
      postes_actif: postesActif,
      postes_username: postesUsername,
      postes_password: postesPassword,
      postes_customer_number: postesCustomerNumber,
      postes_mode: postesMode
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendeurs/${vendeurId}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
      
      setSuccess('Configuration sauvegardée avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur sauvegarde config:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Charger le statut Stripe Connect en temps réel ──
  const chargerStatutStripe = async () => {
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`/api/vendeurs/${vendeurId}/stripe/statut`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        setError('Erreur lors du rafraîchissement du statut Stripe');
        return;
      }
      const data = await response.json();
      setStripeConnecte(data.connecte || false);
      setStripeVerifie(data.verifie || false);
      setStripeAccountId(data.stripe_account_id || '');
      setStripeAccountType(data.account_type || '');
      setStripeDocsManquants(data.docs_manquants || []);
      setStripePopup({ type: 'success', message: '✅ Statut Stripe mis à jour avec succès !' });
      setTimeout(() => setStripePopup(null), 5000);
    } catch (err) {
      console.error('Erreur statut Stripe:', err);
      setStripePopup({ type: 'error', message: '❌ Erreur lors du rafraîchissement du statut Stripe' });
      setTimeout(() => setStripePopup(null), 5000);
    }
  };

  // ── Lancer l'onboarding Stripe Connect ──
  const connecterStripe = async () => {
    setStripeChargement(true);
    setError(null);
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`/api/vendeurs/${vendeurId}/stripe/connect`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur connexion Stripe');

      // Rediriger vers la page d'onboarding Stripe
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion à Stripe');
    } finally {
      setStripeChargement(false);
    }
  };

  // ── Relancer l'onboarding si docs manquants ──
  const completerOnboarding = async () => {
    await connecterStripe(); // même logique — génère un nouveau lien
  };

  const ajouterCC = () => {
    if (emailCC && listeCC.length < 5) {
      setListeCC([...listeCC, emailCC]);
      setEmailCC('');
    }
  };

  // Fonctions pour gérer l'activation unique des transporteurs
  const activerShippo = () => {
    setShippoActif(true);
    setEasypostActif(false);
    setPostesActif(false);
  };

  const activerEasypost = () => {
    setShippoActif(false);
    setEasypostActif(true);
    setPostesActif(false);
  };

  const activerPostes = () => {
    setShippoActif(false);
    setEasypostActif(false);
    setPostesActif(true);
  };

  const desactiverShippo = () => {
    setShippoActif(false);
  };

  const desactiverEasypost = () => {
    setEasypostActif(false);
  };

  const desactiverPostes = () => {
    setPostesActif(false);
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  // ── Styles (inchangés) ──
  const inputStyle: React.CSSProperties = {
    border: '1px solid #ddd', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px',
    outline: 'none', backgroundColor: 'white',
    width: '100%', boxSizing: 'border-box' as const,
  };
  const selectStyle: React.CSSProperties = {
    border: '1px solid #ddd', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px',
    outline: 'none', backgroundColor: 'white',
    cursor: 'pointer', minWidth: '220px',
  };
  const selectFullStyle: React.CSSProperties = {
    ...selectStyle, width: '100%',
    boxSizing: 'border-box' as const, minWidth: 'unset',
  };
  const ligneStyle: React.CSSProperties = {
    padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
  };
  const titreToggleStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const encadreStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '10px',
    border: '1px solid #e1e3e5', marginBottom: '20px',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };
  const titreSectionStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: '700', margin: 0,
    color: '#537373', textTransform: 'uppercase', letterSpacing: '0.5px',
  };
  const sousTitreSectionStyle: React.CSSProperties = {
    fontSize: '12px', color: '#999', margin: '2px 0 0 0',
  };
  const enteteSectionStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px', borderBottom: '1px solid #e1e3e5',
    backgroundColor: '#f0f5f5',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: '600', color: '#555',
    display: 'block', marginBottom: '6px',
  };
  const btnSave: React.CSSProperties = {
    backgroundColor: '#537373', color: 'white', border: 'none',
    borderRadius: '6px', padding: '8px 18px', fontSize: '12px',
    fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px',
  };
  const btnTest: React.CSSProperties = {
    fontSize: '11px', color: '#537373', background: 'none',
    border: '1px solid #537373', borderRadius: '5px',
    padding: '5px 10px', cursor: 'pointer', fontWeight: '600',
  };

  // Sous-encadré transporteur
  const sousEncadre = (actif: boolean): React.CSSProperties => ({
    borderRadius: '8px', overflow: 'hidden',
    border: `2px solid ${actif ? '#537373' : '#e1e3e5'}`,
    marginBottom: '12px', transition: 'all 0.3s',
    boxShadow: actif ? '0 2px 6px rgba(83,115,115,0.15)' : 'none',
  });
  const sousEntete = (actif: boolean): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: actif ? '#f0f5f5' : '#fafafa',
    borderBottom: actif ? '1px solid #e1e3e5' : 'none',
  });

  // Sélecteur de mode test/prod
  const ModeSelector = ({ current, onChange }: { current: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[
        { val: 'test', label: '🧪 Test', bg: '#FEF9E7', color: '#B7950B' },
        { val: 'production', label: '🚀 Production', bg: '#E9F7EF', color: '#1E8449' },
      ].map(opt => (
        <button key={opt.val} onClick={() => onChange(opt.val)} style={{
          padding: '3px 10px', fontSize: '11px', fontWeight: '600',
          borderRadius: '12px', cursor: 'pointer', border: 'none',
          backgroundColor: current === opt.val ? opt.bg : '#f0f0f0',
          color: current === opt.val ? opt.color : '#aaa',
        }}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  // Pied de formulaire transporteur
  const PiedFormulaire = () => (
    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <button style={btnTest}>🔌 Tester la connexion</button>
      <button style={btnSave} onClick={sauvegarderConfiguration} disabled={saving}>
        {saving ? '💾 Enregistrement...' : '💾 Enregistrer'}
      </button>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '24px', maxWidth: '1200px' }}>

        {/* Messages d'erreur et succès */}
        {error && (
          <div style={{ backgroundColor: '#FDECEA', border: '1px solid #E74C3C', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#C0392B' }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: '#E9F7EF', border: '1px solid #27AE60', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#1E8449' }}>
            ✅ {success}
          </div>
        )}

        {/* ── Bannière retour Stripe onboarding ── */}
        {stripeMessage === 'success' && (
          <div style={{ backgroundColor: '#E9F7EF', border: '2px solid #27AE60', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>🎉</span>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#1E8449', margin: '0 0 4px 0' }}>
                Compte Stripe connecté avec succès !
              </p>
              <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
                Votre compte Stripe est maintenant lié à e-Vend. Vous pouvez recevoir des paiements directement dans votre compte bancaire.
              </p>
            </div>
            <button
              onClick={() => { setStripeMessage(null); window.history.replaceState({}, '', window.location.pathname); chargerStatutStripe(); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}
            >✕</button>
          </div>
        )}
        {stripeMessage === 'refresh' && (
          <div style={{ backgroundColor: '#FEF9E7', border: '2px solid #F39C12', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#B7950B', margin: '0 0 4px 0' }}>
                Onboarding incomplet
              </p>
              <p style={{ fontSize: '13px', color: '#555', margin: '0 0 8px 0' }}>
                Votre session Stripe a expiré ou vous avez quitté avant de terminer. Cliquez pour recommencer.
              </p>
              <button onClick={connecterStripe} style={{ backgroundColor: '#F39C12', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Reprendre l'onboarding Stripe →
              </button>
            </div>
            <button
              onClick={() => { setStripeMessage(null); window.history.replaceState({}, '', window.location.pathname); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}
            >✕</button>
          </div>
        )}

        {/* En-tête page */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
            Configuration Générale
          </h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
            Configurez ici les informations générales sur votre boutique.
          </p>
        </div>

        {/* ── Layout 2 colonnes ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

          {/* ════════════ COLONNE GAUCHE ════════════ */}
          <div>

            {/* ═══ Paramètres généraux ═══ */}
            <div style={encadreStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e1e3e5', backgroundColor: '#f0f5f5' }}>
                <p style={titreSectionStyle}>⚙️ Paramètres généraux</p>
                <p style={sousTitreSectionStyle}>Configurez les options générales de votre boutique.</p>
              </div>

              {/* Montant minimum */}
              <div style={ligneStyle}>
                <div style={titreToggleStyle}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                      Définir un montant minimum d'achat pour les commandes
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                      Activez cette option pour définir un montant minimum requis avant qu'un client puisse passer commande.
                    </p>
                  </div>
                  <Toggle actif={montantMinimum} onChange={() => setMontantMinimum(!montantMinimum)} />
                </div>
                {montantMinimum && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>ACHAT MINIMUM APPLICABLE POUR</label>
                      <select value={montantPour} onChange={e => setMontantPour(e.target.value)} style={selectStyle}>
                        <option>TOUS LES CLIENTS</option>
                        <option>CLIENTS ENREGISTRÉS</option>
                        <option>CLIENTS INVITÉS</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>SAISIR UN MONTANT D'ACHAT MINIMUM</label>
                      <input type="number" value={montantValeur} onChange={e => setMontantValeur(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* CC */}
              <div style={ligneStyle}>
                <div style={titreToggleStyle}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 2px 0' }}>
                      Activez cet onglet pour ajouter un courrier CC pour le courrier de commande
                    </p>
                  </div>
                  <Toggle actif={courierCC} onChange={() => setCourierCC(!courierCC)} />
                </div>
                {courierCC && (
                  <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>Saisissez les destinataires CC.</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <input type="email" placeholder="Entrez e-mail CC ici" value={emailCC} onChange={e => setEmailCC(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                      <button onClick={ajouterCC} disabled={listeCC.length >= 5} style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: listeCC.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: '600', whiteSpace: 'nowrap' as const }}>
                        Ajouter
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 8px 0' }}>note: Vous pouvez ajouter un maximum de 5 CC à un e-mail.</p>
                    {listeCC.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {listeCC.map((email, i) => (
                          <span key={i} style={{ backgroundColor: '#f0f5f5', border: '1px solid #537373', color: '#537373', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {email}
                            <span onClick={() => setListeCC(listeCC.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: '700', color: '#E74C3C' }}>×</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Commentaires */}
              <div style={ligneStyle}>
                <div style={titreToggleStyle}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 2px 0' }}>Activer l'approbation automatique des commentaires du vendeur (du client)</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Activez cette option pour permettre aux vendeurs d'approuver automatiquement les avis soumis par les clients.</p>
                  </div>
                  <Toggle actif={approbationCommentaires} onChange={() => setApprobationCommentaires(!approbationCommentaires)} />
                </div>
              </div>

              {/* Fuseau */}
              <div style={ligneStyle}>
                <div style={titreToggleStyle}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Activer mon fuseau horaire</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Activez cet onglet pour définir votre propre fuseau horaire pour la boutique.</p>
                  </div>
                  <Toggle actif={fuseauHoraire} onChange={() => setFuseauHoraire(!fuseauHoraire)} />
                </div>
                {fuseauHoraire && (
                  <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>FUSEAU HORAIRE</label>
                    <select value={fuseauSelectionne} onChange={e => setFuseauSelectionne(e.target.value)} style={selectStyle}>
                      <option value="">Sélectionner une option</option>
                      <option value="America/Toronto">America/Toronto (EST)</option>
                      <option value="America/Vancouver">America/Vancouver (PST)</option>
                      <option value="America/Halifax">America/Halifax (AST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 2FA */}
              <div style={{ ...ligneStyle, borderBottom: 'none' }}>
                <div style={titreToggleStyle}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0' }}>🔐 Activer l'authentification à deux facteurs (2FA)</p>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Sécurisez votre compte en exigeant une vérification supplémentaire lors de chaque connexion.</p>
                  </div>
                  <Toggle actif={deuxFacteurs} onChange={() => setDeuxFacteurs(!deuxFacteurs)} />
                </div>
                {deuxFacteurs && (
                  <div style={{ marginTop: '14px', backgroundColor: '#f0f5f5', borderRadius: '8px', padding: '14px 16px', border: '1px solid #b2cccc' }}>
                    <p style={{ fontSize: '12px', color: '#537373', fontWeight: '600', margin: '0 0 4px 0' }}>✅ Authentification à deux facteurs activée</p>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Un code de vérification sera envoyé à votre courriel à chaque connexion.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Gérer vos vacances ═══ */}
            <div style={encadreStyle}>
              <div style={{ ...enteteSectionStyle, borderLeft: vacancesActif ? '4px solid #537373' : '4px solid transparent', transition: 'border-color 0.3s' }}>
                <div>
                  <p style={titreSectionStyle}>🌴 Gérer vos vacances</p>
                  <p style={sousTitreSectionStyle}>Configurez le mode vacances pour votre boutique.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: vacancesActif ? '#537373' : '#999', fontWeight: '600' }}>
                    {vacancesActif ? 'Mode vacances actif' : 'Désactivé'}
                  </span>
                  <Toggle actif={vacancesActif} onChange={() => setVacancesActif(!vacancesActif)} />
                </div>
              </div>
              <div style={{ padding: '20px', backgroundColor: vacancesActif ? 'white' : '#fafafa', opacity: vacancesActif ? 1 : 0.6, transition: 'all 0.3s' }}>
                {!vacancesActif
                  ? <p style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '16px 0', margin: 0 }}>Activez le mode vacances pour configurer vos dates et paramètres.</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={labelStyle}>Date de début *</label>
                          <input type="date" value={joursVacancesDebut} onChange={e => setJoursVacancesDebut(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Date de fin <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span></label>
                          <input type="date" value={joursVacancesFin} onChange={e => setJoursVacancesFin(e.target.value)} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Opération sur les produits</label>
                        <select value={operationProduit} onChange={e => setOperationProduit(e.target.value)} style={selectFullStyle}>
                          <option value="continuer">Continuer à vendre</option>
                          <option value="desactiver">Désactiver les produits</option>
                        </select>
                      </div>
                      {operationProduit === 'continuer' && (
                        <div>
                          <label style={labelStyle}>Message pour les clients *</label>
                          <textarea value={messageVacances} onChange={e => setMessageVacances(e.target.value)} placeholder="Ex: Je suis en vacances du 1er au 15 juillet. Les commandes seront traitées à mon retour." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                      )}
                      <div style={{ backgroundColor: '#FEF9E7', border: '1px solid #F39C12', borderRadius: '6px', padding: '10px 14px' }}>
                        <p style={{ fontSize: '12px', color: '#7d6608', margin: 0 }}><strong>Note :</strong> Vos clients seront informés que vous êtes en vacances. Les commandes en cours ne seront pas affectées.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ backgroundColor: '#27AE60', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✅ Activer les vacances</button>
                        <button style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Pas maintenant</button>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* ═══ Paiements ═══ */}
            <div style={encadreStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e1e3e5', backgroundColor: '#f0f5f5' }}>
                <p style={titreSectionStyle}>💳 Configurer pour recevoir vos paiements</p>
                <p style={sousTitreSectionStyle}>Connectez vos comptes de paiement pour recevoir les fonds de vos ventes.</p>
              </div>

              {/* PayPal */}
              <div style={{ margin: '20px 20px 0 20px', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${paypalActif ? '#537373' : '#e1e3e5'}`, opacity: paypalActif ? 1 : 0.72, transition: 'all 0.3s', boxShadow: paypalActif ? '0 2px 8px rgba(83,115,115,0.15)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: paypalActif ? '1px solid #e1e3e5' : 'none', backgroundColor: '#f0f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🅿️</span>
                    <div>
                      <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: paypalActif ? '#537373' : '#999' }}>Paiement par PayPal</h2>
                      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{paypalActif ? 'Activé — configurez vos informations PayPal' : 'Désactivé'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: paypalActif ? '#537373' : '#999', fontWeight: '600' }}>{paypalActif ? 'Activé' : 'Désactivé'}</span>
                    <Toggle actif={paypalActif} onChange={() => setPaypalActif(!paypalActif)} />
                  </div>
                </div>
                {paypalActif && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Courriel PayPal *</label>
                      <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ backgroundColor: '#FEF9E7', border: '1px solid #F39C12', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#7d6608' }}>
                      <strong>Note:</strong> Entrez votre courriel PayPal professionnel.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button style={btnSave} onClick={sauvegarderConfiguration} disabled={saving}>💾 Enregistrer</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Séparateur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e1e3e5' }} />
                <span style={{ fontSize: '11px', color: '#bbb', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>ou</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e1e3e5' }} />
              </div>

              {/* Stripe */}
              <div style={{ margin: '0 20px 20px 20px', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${stripeActif ? '#537373' : '#e1e3e5'}`, opacity: stripeActif ? 1 : 0.72, transition: 'all 0.3s', boxShadow: stripeActif ? '0 2px 8px rgba(83,115,115,0.15)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: stripeActif ? '1px solid #e1e3e5' : 'none', backgroundColor: '#f0f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>💳</span>
                    <div>
                      <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: stripeActif ? '#537373' : '#999' }}>Paiement par Stripe</h2>
                      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
                        {stripeConnecte && stripeVerifie
                          ? `✅ Connecté — ${stripeAccountType} (${stripeAccountId})`
                          : stripeConnecte
                          ? '⚠️ Compte connecté — vérification incomplète'
                          : stripeActif ? 'Activé — connectez votre compte Stripe' : 'Désactivé'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: stripeActif ? '#537373' : '#999', fontWeight: '600' }}>{stripeActif ? 'Activé' : 'Désactivé'}</span>
                    <Toggle actif={stripeActif} onChange={() => setStripeActif(!stripeActif)} />
                  </div>
                </div>

                {stripeActif && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* ── Compte NON connecté ── */}
                    {!stripeConnecte && (
                      <>
                        <div style={{ backgroundColor: '#FDECEA', border: '1px solid #E74C3C', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>⚠️</span>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#C0392B', margin: '0 0 2px 0' }}>Compte Stripe non connecté</p>
                            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Connectez votre compte Stripe pour recevoir des paiements directement dans votre compte bancaire.</p>
                          </div>
                        </div>
                        <button
                          style={{ ...btnSave, backgroundColor: '#635bff', padding: '12px 24px', fontSize: '13px' }}
                          onClick={connecterStripe}
                          disabled={stripeChargement}
                        >
                          {stripeChargement ? '⏳ Connexion en cours...' : '💳 Connecter mon compte Stripe'}
                        </button>
                      </>
                    )}

                    {/* ── Compte connecté mais incomplet ── */}
                    {stripeConnecte && !stripeVerifie && (
                      <>
                        <div style={{ backgroundColor: '#FEF9E7', border: '1px solid #F39C12', borderRadius: '8px', padding: '14px 18px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#B7950B', margin: '0 0 6px 0' }}>⚠️ Vérification incomplète</p>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>Documents manquants :</p>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {stripeDocsManquants.map((doc, i) => (
                              <li key={i} style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          style={{ ...btnSave, backgroundColor: '#F39C12', padding: '12px 24px', fontSize: '13px' }}
                          onClick={completerOnboarding}
                          disabled={stripeChargement}
                        >
                          {stripeChargement ? '⏳ Chargement...' : '📋 Compléter ma vérification Stripe'}
                        </button>
                      </>
                    )}

                    {/* ── Compte connecté et vérifié ── */}
                    {stripeConnecte && stripeVerifie && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ backgroundColor: '#E9F7EF', border: '1px solid #27AE60', borderRadius: '8px', padding: '14px 18px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E8449', margin: '0 0 6px 0' }}>✅ Compte Stripe actif et vérifié</p>
                          <p style={{ fontSize: '12px', color: '#555', margin: '0 0 4px 0' }}>
                            <strong>Compte :</strong> {stripeAccountId}
                          </p>
                          <p style={{ fontSize: '12px', color: '#555', margin: '0 0 4px 0' }}>
                            <strong>Type :</strong> {stripeAccountType}
                          </p>
                          <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                            Les paiements sont activés et les virements se font automatiquement vers votre compte bancaire.
                          </p>
                        </div>

                        {/* Popup confirmation centré */}
                        {stripePopup && (
                          <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 9999,
                          }}>
                            <div style={{
                              backgroundColor: 'white',
                              borderRadius: '12px',
                              padding: '32px 40px',
                              textAlign: 'center',
                              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                              maxWidth: '400px',
                              width: '90%',
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                                {stripePopup.type === 'success' ? '✅' : '❌'}
                              </div>
                              <p style={{ fontSize: '16px', fontWeight: '700', color: stripePopup.type === 'success' ? '#1E8449' : '#E74C3C', margin: '0 0 8px 0' }}>
                                {stripePopup.type === 'success' ? 'Succès' : 'Erreur'}
                              </p>
                              <p style={{ fontSize: '14px', color: '#555', margin: '0 0 24px 0' }}>
                                {stripePopup.message}
                              </p>
                              <button
                                type="button"
                                onClick={() => setStripePopup(null)}
                                style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Fermer
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Boutons de gestion */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={{ backgroundColor: 'white', color: '#537373', border: '1px solid #537373', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            onClick={chargerStatutStripe}
                          >
                            🔄 Rafraîchir le statut
                          </button>
                          <button
                            style={{ backgroundColor: 'white', color: '#E74C3C', border: '1px solid #E74C3C', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            onClick={async () => {
                              if (!window.confirm('Déconnecter votre compte Stripe de e-Vend ?\n\nVotre compte Stripe ne sera PAS supprimé — vous pourrez reconnecter un autre compte.')) return;
                              try {
                                const token = localStorage.getItem('token');
                                await fetch(`/api/vendeurs/${vendeurId}/stripe/deconnecter`, {
                                  method: 'POST',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setStripeConnecte(false);
                                setStripeVerifie(false);
                                setStripeAccountId('');
                                setStripeAccountType('');
                                setSuccess('Compte Stripe déconnecté. Vous pouvez en connecter un autre.');
                              } catch { setError('Erreur lors de la déconnexion'); }
                            }}
                          >
                            🔌 Déconnecter mon compte
                          </button>
                        </div>

                        {/* ── Help text ── */}
                        <div style={{ backgroundColor: '#f0f5f5', borderRadius: '8px', padding: '14px 16px', border: '1px solid #d0e0e0' }}>
                        </div>

                        {/* Bouton dashboard Stripe en bas à gauche */}
                        <div>
                          <button
                            type="button"
                            style={{ backgroundColor: 'white', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            onClick={() => window.open(`https://dashboard.stripe.com/${stripeAccountId}/dashboard`, '_blank')}
                          >
                            🏦 Mon dashboard Stripe
                          </button>
                        </div>

                        {/* À quoi servent ces boutons */}
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', margin: '0 0 8px 0' }}>💡 À quoi servent ces boutons ?</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '12px', minWidth: '16px' }}>🔄</span>
                              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                                <strong>Rafraîchir le statut</strong> — Vérifie en temps réel auprès de Stripe si votre compte est toujours actif et si des documents supplémentaires vous sont demandés.
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '12px', minWidth: '16px' }}>🔌</span>
                              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                                <strong>Déconnecter mon compte</strong> — Retire le lien entre votre compte Stripe et e-Vend. <strong>Votre compte Stripe n'est pas supprimé</strong> — vous pouvez le reconnecter ou en connecter un autre à tout moment. Utilisez cette option si vous changez de compte bancaire ou si vous voulez utiliser un autre compte Stripe.
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '12px', minWidth: '16px' }}>🔘</span>
                              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                                <strong>Désactiver le toggle</strong> — Désactive temporairement la section Stripe dans votre profil. Votre compte reste lié — vous pouvez réactiver sans recommencer la configuration.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {!stripeActif && (
                  <div style={{ padding: '20px', backgroundColor: '#fafafa' }}>
                    <div style={{ backgroundColor: '#f4f6f8', border: '1px dashed #ddd', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#bbb' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>💳</div>
                      <p style={{ fontSize: '13px', margin: 0 }}>Activez cette section pour connecter votre compte Stripe.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>{/* fin colonne gauche */}

          {/* ════════════ COLONNE DROITE ════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── ENCADRÉ ÉTIQUETTES D'EXPÉDITION ── */}
            <div style={encadreStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e1e3e5', backgroundColor: '#f0f5f5' }}>
                <p style={titreSectionStyle}>🏷️ Étiquettes d'expédition</p>
                <p style={sousTitreSectionStyle}>
                  Connectez votre compte transporteur pour générer des étiquettes directement depuis vos commandes.
                </p>
              </div>

              <div style={{ padding: '16px' }}>

                {/* ── Shippo ── */}
                <div style={sousEncadre(shippoActif)}>
                  <div style={sousEntete(shippoActif)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🚢</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: shippoActif ? '#537373' : '#888' }}>Shippo</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Multi-transporteurs · API REST</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: shippoActif ? '#537373' : '#bbb' }}>
                        {shippoActif ? 'Actif' : 'Inactif'}
                      </span>
                      <Toggle 
                        actif={shippoActif} 
                        onChange={() => {
                          if (shippoActif) {
                            desactiverShippo();
                          } else {
                            activerShippo();
                          }
                        }} 
                      />
                    </div>
                  </div>
                  {shippoActif && (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>API Token *</label>
                        <input type="password" value={shippoApiToken} onChange={e => setShippoApiToken(e.target.value)} placeholder="shippo_live_xxxxxxxxxxxxxxxx" style={inputStyle} />
                        <p style={{ fontSize: '11px', color: '#999', margin: '5px 0 0 0' }}>
                          Disponible dans <span style={{ color: '#537373', fontWeight: '600' }}>goshippo.com → API Keys</span>
                        </p>
                      </div>
                      <div>
                        <label style={labelStyle}>Mode</label>
                        <ModeSelector current={shippoMode} onChange={v => setShippoMode(v as any)} />
                      </div>
                      <PiedFormulaire />
                    </div>
                  )}
                </div>

                {/* ── EasyPost ── */}
                <div style={sousEncadre(easypostActif)}>
                  <div style={sousEntete(easypostActif)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>📬</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: easypostActif ? '#537373' : '#888' }}>EasyPost</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Multi-transporteurs · Clés test & prod</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: easypostActif ? '#537373' : '#bbb' }}>
                        {easypostActif ? 'Actif' : 'Inactif'}
                      </span>
                      <Toggle 
                        actif={easypostActif} 
                        onChange={() => {
                          if (easypostActif) {
                            desactiverEasypost();
                          } else {
                            activerEasypost();
                          }
                        }} 
                      />
                    </div>
                  </div>
                  {easypostActif && (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Clé API — Test *</label>
                        <input type="password" value={easypostCleTest} onChange={e => setEasypostCleTest(e.target.value)} placeholder="EZAK_test_xxxxxxxxxxxxxxxx" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Clé API — Production *</label>
                        <input type="password" value={easypostCleProd} onChange={e => setEasypostCleProd(e.target.value)} placeholder="EZAK_xxxxxxxxxxxxxxxx" style={inputStyle} />
                        <p style={{ fontSize: '11px', color: '#999', margin: '5px 0 0 0' }}>
                          Disponible dans <span style={{ color: '#537373', fontWeight: '600' }}>easypost.com → API Keys</span>
                        </p>
                      </div>
                      <div>
                        <label style={labelStyle}>Mode actif</label>
                        <ModeSelector current={easypostMode} onChange={v => setEasypostMode(v as any)} />
                      </div>
                      <PiedFormulaire />
                    </div>
                  )}
                </div>

                {/* ── Postes Canada ── */}
                <div style={sousEncadre(postesActif)}>
                  <div style={sousEntete(postesActif)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🍁</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: postesActif ? '#537373' : '#888' }}>Postes Canada</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>100% canadien · Sans frais tiers</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: postesActif ? '#537373' : '#bbb' }}>
                        {postesActif ? 'Actif' : 'Inactif'}
                      </span>
                      <Toggle 
                        actif={postesActif} 
                        onChange={() => {
                          if (postesActif) {
                            desactiverPostes();
                          } else {
                            activerPostes();
                          }
                        }} 
                      />
                    </div>
                  </div>
                  {postesActif && (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Nom d'utilisateur API *</label>
                        <input type="text" value={postesUsername} onChange={e => setPostesUsername(e.target.value)} placeholder="Votre username API" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Mot de passe API *</label>
                        <input type="password" value={postesPassword} onChange={e => setPostesPassword(e.target.value)} placeholder="Votre mot de passe API" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Numéro de client *</label>
                        <input type="text" value={postesCustomerNumber} onChange={e => setPostesCustomerNumber(e.target.value)} placeholder="Ex: 1234567" style={inputStyle} />
                        <p style={{ fontSize: '11px', color: '#999', margin: '5px 0 0 0' }}>
                          Disponible dans <span style={{ color: '#537373', fontWeight: '600' }}>Solutions TI — Postes Canada</span>
                        </p>
                      </div>
                      <div>
                        <label style={labelStyle}>Environnement</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[
                            { val: 'dev', label: '🧪 Développement', bg: '#FEF9E7', color: '#B7950B' },
                            { val: 'production', label: '🚀 Production', bg: '#E9F7EF', color: '#1E8449' },
                          ].map(opt => (
                            <button key={opt.val} onClick={() => setPostesMode(opt.val as any)} style={{
                              padding: '3px 10px', fontSize: '11px', fontWeight: '600',
                              borderRadius: '12px', cursor: 'pointer', border: 'none',
                              backgroundColor: postesMode === opt.val ? opt.bg : '#f0f0f0',
                              color: postesMode === opt.val ? opt.color : '#aaa',
                            }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <PiedFormulaire />
                    </div>
                  )}
                </div>

                {/* Note globale */}
                <div style={{ backgroundColor: '#f0f5f5', borderRadius: '8px', padding: '12px 14px', marginTop: '8px', border: '1px solid #d0e0e0' }}>
                  <p style={{ fontSize: '11px', color: '#537373', margin: 0, fontWeight: '600' }}>
                    💡 Un seul transporteur peut être actif à la fois. Activez-en un pour commencer à générer des étiquettes.
                  </p>
                </div>

              </div>
            </div>

            {/* ── ENCADRÉ CONFIGURATION DE MA BOUTIQUE ── */}
            <div style={encadreStyle}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e1e3e5', backgroundColor: '#f0f5f5' }}>
                <p style={titreSectionStyle}>⚙️ Configuration de ma boutique</p>
                <p style={sousTitreSectionStyle}>
                  Personnalisez les informations affichées aux clients.
                </p>
              </div>

              <div style={{ padding: '16px' }}>
                
                {/* Section Pour les entreprises */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    🏢 Pour les entreprises
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Afficher mon numéro d'entreprise */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: '13px', color: '#333' }}>Afficher mon numéro d'entreprise</span>
                      <Toggle actif={afficherNumEntreprise} onChange={() => setAfficherNumEntreprise(!afficherNumEntreprise)} />
                    </div>

                    {/* Afficher les numéros de taxes */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: '13px', color: '#333' }}>Afficher les numéros de taxes</span>
                      <Toggle actif={afficherNumTaxes} onChange={() => setAfficherNumTaxes(!afficherNumTaxes)} />
                    </div>

                    {/* Afficher l'adresse de mon entreprise */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: '13px', color: '#333' }}>Afficher l'adresse de mon entreprise</span>
                      <Toggle actif={afficherAdresseEntreprise} onChange={() => setAfficherAdresseEntreprise(!afficherAdresseEntreprise)} />
                    </div>
                  </div>
                </div>

                {/* Séparateur */}
                <div style={{ height: '1px', backgroundColor: '#e1e3e5', margin: '12px 0' }} />

                {/* Section Tous les vendeurs */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    👤 Tous les vendeurs
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <span style={{ fontSize: '13px', color: '#333' }}>Afficher le numéro de téléphone</span>
                    <Toggle actif={afficherTelephone} onChange={() => setAfficherTelephone(!afficherTelephone)} />
                  </div>
                </div>

                {/* Bouton Enregistrer */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={btnSave} onClick={sauvegarderConfiguration} disabled={saving}>
                    {saving ? '💾 Enregistrement...' : '💾 Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

          </div>{/* fin colonne droite */}

        </div>

        {/* Bouton Enregistrer les modifications en bas de page */}
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          padding: '16px 0'
        }}>
          <button style={{ ...btnSave, padding: '12px 32px', fontSize: '14px' }} onClick={sauvegarderConfiguration} disabled={saving}>
            {saving ? '💾 ENREGISTREMENT...' : '💾 ENREGISTRER LES MODIFICATIONS'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfigurationGenerale;