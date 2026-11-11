// CHEMIN : src/pages/boutique/CommandeBoutique.tsx
// e-Vend Studio — Page de retour après le paiement (Stripe ou PayPal) et confirmation de commande, commune aux templates boutique (solo).
// URL de retour : ?page=commande-confirmee&commande=BQ-… (PayPal ajoute &mode=paypal&token=<order>)

import React, { useEffect, useState } from 'react';
import { ba, messageAcheteur, argent, paramUrl } from './boutiqueAcheteurApi';

interface Props { gestionnaireId: number; accent?: string; numeroCommande?: string; naviguerVers: (page: string) => void; }

export default function CommandeBoutique({ gestionnaireId: gid, accent, numeroCommande, naviguerVers }: Props) {
  const couleur = accent || '#111827';
  const numero = numeroCommande || paramUrl('commande') || '';
  const [commande, setCommande] = useState<any>(null);
  const [etat, setEtat] = useState<'verif' | 'ok' | 'attente' | 'erreur'>('verif');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;
    (async () => {
      if (!numero) { setErreur('Commande introuvable.'); setEtat('erreur'); return; }
      // PayPal : l'acheteur revient après avoir approuvé → on capture le paiement
      const orderId = paramUrl('token');
      if (paramUrl('mode') === 'paypal' && orderId) {
        const c = await ba(gid, `/commandes/${encodeURIComponent(numero)}/paypal/capturer`, { method: 'POST', body: { order_id: orderId } });
        if (!c.ok) { if (!annule) { setErreur(messageAcheteur(c)); setEtat('erreur'); } return; }
      }
      // Stripe : la confirmation arrive par le webhook, parfois quelques secondes plus tard
      for (let i = 0; i < 8 && !annule; i++) {
        const r = await ba(gid, `/commandes/${encodeURIComponent(numero)}`);
        if (!r.ok) { setErreur(messageAcheteur(r)); setEtat('erreur'); return; }
        setCommande(r.data.commande);
        if (r.data.commande.statut_paiement === 'paye') { setEtat('ok'); return; }
        if (r.data.commande.statut === 'annulee') { setErreur("Cette commande a été annulée. Aucun montant n'a été prélevé."); setEtat('erreur'); return; }
        await new Promise(res => setTimeout(res, 2000));
      }
      if (!annule) setEtat('attente');
    })();
    return () => { annule = true; };
  }, [gid, numero]);

  const boite: React.CSSProperties = { maxWidth: 620, margin: '0 auto', padding: '48px 16px', textAlign: 'center' };
  if (etat === 'verif') return <div style={boite}>⏳ Vérification de votre paiement…</div>;
  if (etat === 'erreur') return (
    <div style={boite}><div style={{ fontSize: 40 }}>⚠️</div><p style={{ color: '#b91c1c' }}>{erreur}</p>
      <button onClick={() => naviguerVers('panier')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>Retour au panier</button></div>);
  if (etat === 'attente') return (
    <div style={boite}><div style={{ fontSize: 40 }}>🕐</div><h2>Paiement en cours de confirmation</h2>
      <p style={{ color: '#6b7280' }}>Votre paiement est en cours de traitement. Vous recevrez la confirmation de la commande <strong>{numero}</strong> dans quelques instants.</p>
      <button onClick={() => naviguerVers('accueil')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>Retour à la boutique</button></div>);

  const c = commande;
  return (
    <div style={boite}>
      <div style={{ fontSize: 46 }}>✅</div>
      <h1 style={{ fontSize: 26, margin: '8px 0' }}>Merci pour votre commande !</h1>
      <p style={{ color: '#6b7280' }}>Commande <strong>{c.numero_commande}</strong> — total payé : <strong>{argent(c.total, c.devise)}</strong></p>
      <div style={{ textAlign: 'left', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, margin: '22px 0' }}>
        {(c.articles || []).map((a: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span>{a.titre}{a.variante ? ` — ${a.variante}` : ''} × {a.quantite}</span><span>{argent(a.prix * a.quantite, c.devise)}</span></div>)}
        {Number(c.rabais) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#047857' }}><span>Code {c.code_promo}</span><span>− {argent(c.rabais, c.devise)}</span></div>}
        {Number(c.frais_expedition) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4b5563' }}><span>Expédition</span><span>{argent(c.frais_expedition, c.devise)}</span></div>}
        {c.taxes && Number(c.taxes.total_taxes) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4b5563' }}><span>Taxes</span><span>{argent(c.taxes.total_taxes, c.devise)}</span></div>}
      </div>
      <button onClick={() => naviguerVers('accueil')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', cursor: 'pointer', fontWeight: 600 }}>Continuer mes achats</button>
    </div>
  );
}