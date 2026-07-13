// src/pages/PagePaiement.tsx
// e-Vend Studio — Page publique de paiement (réservation ou abonnement).
// Affiche les moyens de paiement disponibles pour CE site précis (Stripe
// et/ou PayPal selon ce que le gestionnaire a configuré), redirige vers
// Stripe Checkout (hébergé, PCI géré par Stripe) ou capture PayPal côté
// navigateur (SDK JS PayPal). Neutre visuellement — sert tous les templates.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = '/api';

const C = {
  bg: '#f6f7f9', card: '#fff', border: '#e5e7eb', text: '#1a1a2e',
  textLight: '#6b7280', accent: '#635bff', green: '#16a34a', red: '#dc2626',
};

interface TaxInfo {
  taxable: boolean; montantHT: number; tps: number; provincial: number; total: number; province: string | null;
}

interface Details {
  id: number; nom_client: string; montant: number; devise: string;
  objet_reserve?: string; formation_titre?: string; frequence?: string;
  statut?: string; statut_paiement?: string;
  stripe_disponible: boolean; paypal_disponible?: boolean; paypal_client_id?: string;
  taxes?: TaxInfo;
}

const LABEL_FREQUENCE: Record<string, string> = { hebdomadaire: '/ semaine', mensuel: '/ mois', annuel: '/ an' };

export default function PagePaiement({ mode }: { mode: 'payer' | 'confirme' | 'annule' }) {
  const [params] = useSearchParams();
  const type = (params.get('type') || 'reservation') as 'reservation' | 'abonnement';
  const id = params.get('id');

  const [details, setDetails] = useState<Details | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [redirection, setRedirection] = useState(false);
  const [paypalPret, setPaypalPret] = useState(false);

  useEffect(() => {
    if (!id) { setErreur('Lien de paiement invalide.'); setChargement(false); return; }
    fetch(`${API_BASE}/paiements/${type}/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDetails)
      .catch(() => setErreur('Impossible de charger les détails du paiement.'))
      .finally(() => setChargement(false));
  }, [type, id]);

  // Charger le SDK PayPal dynamiquement une fois les détails connus
  useEffect(() => {
    if (mode !== 'payer' || !details?.paypal_disponible || !details.paypal_client_id) return;
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${details.paypal_client_id}&currency=${(details.devise || 'CAD').toUpperCase()}`;
    script.onload = () => setPaypalPret(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [mode, details?.paypal_disponible, details?.paypal_client_id]);

  // Rendre les boutons PayPal une fois le SDK chargé
  useEffect(() => {
    if (!paypalPret || !details || type !== 'reservation') return;
    const w = window as any;
    if (!w.paypal) return;
    w.paypal.Buttons({
      createOrder: (_: any, actions: any) => {
        const devise = (details.devise || 'CAD').toUpperCase();
        const taxTotal = (details.taxes?.tps || 0) + (details.taxes?.provincial || 0);
        const montantHT = details.taxes?.montantHT ?? Number(details.montant);
        const total = details.taxes?.total ?? Number(details.montant);
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: total.toFixed(2),
              currency_code: devise,
              breakdown: taxTotal > 0 ? {
                item_total: { value: montantHT.toFixed(2), currency_code: devise },
                tax_total: { value: taxTotal.toFixed(2), currency_code: devise },
              } : undefined,
            },
            items: taxTotal > 0 ? [{
              name: details.objet_reserve || 'Réservation',
              unit_amount: { value: montantHT.toFixed(2), currency_code: devise },
              tax: { value: taxTotal.toFixed(2), currency_code: devise },
              quantity: '1',
            }] : undefined,
          }],
        });
      },
      onApprove: async (_: any, actions: any) => {
        await actions.order.capture();
        await fetch(`${API_BASE}/paiements/reservation/${id}/confirmer-paypal`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: _.orderID }),
        });
        window.location.href = `/paiement-confirme?type=reservation&id=${id}`;
      },
    }).render('#paypal-boutons');
  }, [paypalPret, details, type, id]);

  const payerStripe = async () => {
    setRedirection(true);
    try {
      const res = await fetch(`${API_BASE}/paiements/${type}/${id}/stripe-checkout`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur.');
      window.location.href = data.url;
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de la redirection vers Stripe.');
      setRedirection(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>

        {chargement ? (
          <p style={{ textAlign: 'center', color: C.textLight, fontSize: 14 }}>Chargement...</p>

        ) : erreur ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>{erreur}</p>
          </div>

        ) : mode === 'confirme' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Paiement confirmé!</p>
            <p style={{ fontSize: 13, color: C.textLight }}>Un courriel de confirmation vous a été envoyé. Vous pouvez fermer cette page.</p>
          </div>

        ) : mode === 'annule' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>↩️</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Paiement annulé</p>
            <p style={{ fontSize: 13, color: C.textLight }}>Vous pouvez retourner sur le site pour réessayer.</p>
          </div>

        ) : details && (details.statut_paiement === 'recu' || details.statut === 'actif') ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Ce paiement a déjà été effectué.</p>
          </div>

        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Paiement sécurisé</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>{details?.objet_reserve || details?.formation_titre}</p>

            {details?.taxes?.taxable ? (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textLight, marginBottom: 4 }}>
                  <span>Sous-total</span><span>{details.taxes.montantHT.toFixed(2)} {(details.devise || 'CAD').toUpperCase()}</span>
                </div>
                {details.taxes.tps > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textLight, marginBottom: 4 }}>
                    <span>TPS/TVH</span><span>{details.taxes.tps.toFixed(2)} {(details.devise || 'CAD').toUpperCase()}</span>
                  </div>
                )}
                {details.taxes.provincial > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textLight, marginBottom: 8 }}>
                    <span>Taxe provinciale</span><span>{details.taxes.provincial.toFixed(2)} {(details.devise || 'CAD').toUpperCase()}</span>
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: C.text }}>
                  <span>Total {details?.frequence && LABEL_FREQUENCE[details.frequence]}</span>
                  <span>{details.taxes.total.toFixed(2)} {(details.devise || 'CAD').toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: C.textLight, marginBottom: 24 }}>
                {Number(details?.montant || 0).toFixed(2)} {(details?.devise || 'CAD').toUpperCase()}
                {details?.frequence && <span> {LABEL_FREQUENCE[details.frequence]}</span>}
              </p>
            )}

            {!details?.stripe_disponible && !details?.paypal_disponible && (
              <p style={{ fontSize: 13, color: C.red, textAlign: 'center' }}>Aucun moyen de paiement n'est actuellement disponible pour ce site. Contactez directement le commerce.</p>
            )}

            {details?.stripe_disponible && (
              <button onClick={payerStripe} disabled={redirection}
                style={{ width: '100%', padding: 14, border: 'none', borderRadius: 10, background: '#635bff', color: '#fff', fontSize: 14, fontWeight: 800, cursor: redirection ? 'wait' : 'pointer', marginBottom: 12 }}>
                {redirection ? '⏳ Redirection...' : '💳 Payer avec Stripe'}
              </button>
            )}

            {details?.paypal_disponible && type === 'reservation' && (
              <div id="paypal-boutons" style={{ marginTop: 8 }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}