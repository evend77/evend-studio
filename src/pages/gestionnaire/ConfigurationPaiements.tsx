// src/pages/gestionnaire/ConfigurationPaiements.tsx
// e-Vend Studio — Le gestionnaire connecte son propre compte Stripe (Connect
// Standard) et configure PayPal (simple courriel, pas de Partner/Platform —
// e-Vend Studio ne prend aucune commission, l'argent va 100% chez le gestionnaire).
// Même palette sombre que MesReservationsEcole.tsx / MesAbonnementsEcole.tsx.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

const C = {
  bg: '#0d0d12',
  cardBg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(255,255,255,0.05)',
  text: '#fff',
  textLight: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.35)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  green: '#22c55e',
  greenLight: 'rgba(34,197,94,0.15)',
  amber: '#f59e0b',
  amberLight: 'rgba(245,158,11,0.15)',
};

interface Props { gestionnaireId: number; }

export default function ConfigurationPaiements({ gestionnaireId }: Props) {
  const [chargement, setChargement] = useState(true);
  const [connexion, setConnexion] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmation, setConfirmation] = useState<{ titre: string; message: string; texteBouton: string; onConfirmer: () => void } | null>(null);

  // ── Stripe ────────────────────────────────────────────────────────────────
  const [stripeConnecte, setStripeConnecte] = useState(false);
  const [stripeVerifie, setStripeVerifie] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [stripeAccountType, setStripeAccountType] = useState('');
  const [stripeDocsManquants, setStripeDocsManquants] = useState<string[]>([]);

  // ── Bannière de retour d'onboarding Stripe (?stripe=success|refresh) ──────
  const stripeRetour = new URLSearchParams(window.location.search).get('stripe');
  const [bandeauRetour, setBandeauRetour] = useState<'success' | 'refresh' | null>(
    stripeRetour === 'success' ? 'success' : stripeRetour === 'refresh' ? 'refresh' : null
  );

  // ── PayPal ────────────────────────────────────────────────────────────────
  const [paypalActif, setPaypalActifState] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [sauvPaypal, setSauvPaypal] = useState(false);

  const token = () => localStorage.getItem('token');
  const afficherToast = (msg: string, type: 'ok' | 'err') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const chargerStatutStripe = async () => {
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/stripe/statut`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setStripeConnecte(data.connecte || false);
      setStripeVerifie(data.verifie || false);
      setStripeAccountId(data.stripe_account_id || '');
      setStripeAccountType(data.account_type || '');
      setStripeDocsManquants(data.docs_manquants || []);
    } catch {
      afficherToast('Erreur lors du chargement du statut Stripe.', 'err');
    }
  };

  const chargerPaypal = async () => {
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/paypal`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPaypalActifState(!!data.paypal_actif);
      setPaypalEmail(data.paypal_email || '');
      setPaypalClientId(data.paypal_client_id || '');
    } catch {}
  };

  useEffect(() => {
    Promise.all([chargerStatutStripe(), chargerPaypal()]).finally(() => setChargement(false));
  }, [gestionnaireId]);

  const connecterStripe = async () => {
    setConnexion(true);
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/stripe/connect`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur.');
      if (data.onboarding_url) window.location.href = data.onboarding_url;
    } catch (err: any) {
      afficherToast(err.message || 'Erreur lors de la connexion à Stripe.', 'err');
      setConnexion(false);
    }
  };

  const deconnecterStripe = () => {
    setConfirmation({
      titre: 'Déconnecter votre compte Stripe?',
      message: 'Votre compte Stripe ne sera PAS supprimé — seulement délié de e-Vend Studio. Vous pourrez reconnecter le même compte ou un autre en tout temps.',
      texteBouton: '🔌 Déconnecter',
      onConfirmer: async () => {
        setConfirmation(null);
        try {
          await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/stripe/deconnecter`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
          setStripeConnecte(false); setStripeVerifie(false); setStripeAccountId(''); setStripeAccountType('');
          afficherToast('Compte Stripe déconnecté.', 'ok');
        } catch {
          afficherToast('Erreur lors de la déconnexion.', 'err');
        }
      },
    });
  };

  const sauvegarderPaypal = async (actif: boolean, email: string, clientId: string) => {
    setSauvPaypal(true);
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/paypal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ paypal_actif: actif, paypal_email: email, paypal_client_id: clientId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Erreur.'); }
      afficherToast('PayPal mis à jour.', 'ok');
    } catch (err: any) {
      afficherToast(err.message || 'Erreur lors de la sauvegarde.', 'err');
    }
    setSauvPaypal(false);
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 96px)', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.type === 'ok' ? C.green : C.red, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast.msg}
          </div>
        )}

        {confirmation && (
          <div onClick={() => setConfirmation(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#16161c', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 420, width: '100%', padding: '26px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>{confirmation.titre}</p>
              <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 22px', lineHeight: 1.5 }}>{confirmation.message}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmation(null)} style={{ flex: 1, padding: 11, border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'transparent', color: C.textLight, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={confirmation.onConfirmer} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 10, background: C.red, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{confirmation.texteBouton}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>💳</span>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Sora', sans-serif" }}>Paiements</h1>
        </div>
        <p style={{ fontSize: 14, color: C.textLight, margin: '0 0 28px' }}>
          Connectez votre compte pour recevoir directement les paiements de vos réservations et abonnements. e-Vend Studio ne prend aucune commission — 100% de l'argent va sur votre propre compte.
        </p>

        {/* Bannières retour onboarding */}
        {bandeauRetour === 'success' && (
          <div style={{ background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.green, margin: '0 0 2px' }}>Compte Stripe connecté avec succès!</p>
              <p style={{ fontSize: 12, color: C.textLight, margin: 0 }}>Vous pouvez maintenant recevoir des paiements directement dans votre compte bancaire.</p>
            </div>
            <button onClick={() => { setBandeauRetour(null); window.history.replaceState({}, '', window.location.pathname); chargerStatutStripe(); }}
              style={{ background: 'none', border: 'none', color: C.textDim, fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {bandeauRetour === 'refresh' && (
          <div style={{ background: C.amberLight, border: `1px solid ${C.amber}40`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.amber, margin: '0 0 6px' }}>Onboarding incomplet</p>
              <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 10px' }}>Votre session Stripe a expiré ou vous avez quitté avant de terminer.</p>
              <button onClick={connecterStripe} style={{ background: C.amber, color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reprendre l'onboarding →</button>
            </div>
            <button onClick={() => { setBandeauRetour(null); window.history.replaceState({}, '', window.location.pathname); }}
              style={{ background: 'none', border: 'none', color: C.textDim, fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* ── Carte Stripe ──────────────────────────────────────────────── */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${stripeConnecte && stripeVerifie ? C.green + '50' : C.border}`, borderRadius: 16, padding: '24px 26px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ fontSize: 26 }}>💳</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Stripe</p>
              <p style={{ fontSize: 12, color: C.textDim, margin: 0 }}>Cartes de crédit/débit, virements automatiques</p>
            </div>
          </div>

          {chargement ? (
            <p style={{ fontSize: 13, color: C.textLight }}>Chargement...</p>
          ) : !stripeConnecte ? (
            <>
              <div style={{ background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>Compte Stripe non connecté — connectez-le pour recevoir des paiements.</p>
              </div>
              <button onClick={connecterStripe} disabled={connexion}
                style={{ padding: '13px 26px', border: 'none', borderRadius: 10, background: '#635bff', color: '#fff', fontSize: 13, fontWeight: 800, cursor: connexion ? 'wait' : 'pointer' }}>
                {connexion ? '⏳ Connexion en cours...' : '💳 Connecter mon compte Stripe'}
              </button>
            </>
          ) : !stripeVerifie ? (
            <>
              <div style={{ background: C.amberLight, border: `1px solid ${C.amber}40`, borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.amber, margin: '0 0 8px' }}>⚠️ Vérification incomplète</p>
                {stripeDocsManquants.length > 0 && (
                  <>
                    <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 6px' }}>Documents manquants :</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {stripeDocsManquants.map((d, i) => <li key={i} style={{ fontSize: 12, color: C.textDim, marginBottom: 2 }}>{d}</li>)}
                    </ul>
                  </>
                )}
              </div>
              <button onClick={connecterStripe} disabled={connexion}
                style={{ padding: '13px 26px', border: 'none', borderRadius: 10, background: C.amber, color: '#1a1a1a', fontSize: 13, fontWeight: 800, cursor: connexion ? 'wait' : 'pointer' }}>
                {connexion ? '⏳ Chargement...' : '📋 Compléter ma vérification Stripe'}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: '0 0 6px' }}>✅ Compte Stripe actif et vérifié</p>
                <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 2px' }}><strong>Compte :</strong> {stripeAccountId}</p>
                <p style={{ fontSize: 12, color: C.textLight, margin: 0 }}><strong>Type :</strong> {stripeAccountType}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => chargerStatutStripe()} style={{ background: 'transparent', color: C.textLight, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔄 Rafraîchir le statut</button>
                <button onClick={deconnecterStripe} style={{ background: 'transparent', color: C.red, border: `1.5px solid ${C.red}40`, borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔌 Déconnecter</button>
              </div>
            </>
          )}
        </div>

        {/* ── Carte PayPal ──────────────────────────────────────────────── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: paypalActif ? 18 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26 }}>🅿️</span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>PayPal</p>
                <p style={{ fontSize: 12, color: C.textDim, margin: 0 }}>Offrez PayPal en plus de Stripe à vos clients</p>
              </div>
            </div>
            <div onClick={() => { const v = !paypalActif; setPaypalActifState(v); sauvegarderPaypal(v, paypalEmail, paypalClientId); }}
              style={{ width: 44, height: 24, borderRadius: 12, background: paypalActif ? '#0070ba' : '#3a3a42', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: paypalActif ? 23 : 3, transition: 'left 0.2s' }} />
            </div>
          </div>

          {paypalActif && (
            <>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Courriel PayPal *</label>
              <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="votre-compte@exemple.com"
                style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box', marginBottom: 12 }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Client ID PayPal *</label>
              <input type="text" value={paypalClientId} onChange={e => setPaypalClientId(e.target.value)} placeholder="AeA1QRj8..."
                style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box', marginBottom: 6, fontFamily: 'monospace' }} />
              <p style={{ fontSize: 11, color: C.textDim, margin: '0 0 12px' }}>
                Créez une app gratuite sur <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" style={{ color: '#0070ba' }}>developer.paypal.com</a> → copiez le "Client ID" (public, sans danger à partager).
              </p>

              <div style={{ background: C.amberLight, border: `1px solid ${C.amber}30`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.textLight, marginBottom: 14 }}>
                Le courriel identifie votre compte, le Client ID permet au bouton de paiement de fonctionner sur votre site. Les paiements vont directement sur votre compte — e-Vend Studio n'y a jamais accès.
              </div>
              <button onClick={() => sauvegarderPaypal(paypalActif, paypalEmail, paypalClientId)} disabled={sauvPaypal}
                style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: '#0070ba', color: '#fff', fontSize: 12, fontWeight: 700, cursor: sauvPaypal ? 'wait' : 'pointer' }}>
                {sauvPaypal ? '⏳...' : '💾 Enregistrer'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}