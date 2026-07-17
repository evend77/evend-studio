// src/pages/commanditaire/SponsorAbonnement.tsx
import React, { useState, useEffect } from 'react';

interface SponsorAbonnementProps {
  sponsorInfo: any;
  token: string;
}

interface PlanAffiche {
  id: string;
  label: string;
  maxPhotos?: number | null;
  maxPubsActives?: number | null;
  prix: number;
}

function SponsorAbonnement({ sponsorInfo, token }: SponsorAbonnementProps) {
  const peutPhotos = sponsorInfo?.type_sponsor === 'photos' || sponsorInfo?.type_sponsor === 'both';
  const peutPubs = sponsorInfo?.type_sponsor === 'pub' || sponsorInfo?.type_sponsor === 'both';

  // Les forfaits viennent maintenant de la BD (gérés dans l'admin), plus du code en dur.
  const [plansPhotos, setPlansPhotos] = useState<PlanAffiche[]>([]);
  const [plansPub, setPlansPub] = useState<PlanAffiche[]>([]);
  const [chargementPlans, setChargementPlans] = useState(true);

  // Portefeuille prépayé (finance les clics — obligatoire pour qu'une pub s'affiche)
  const [solde, setSolde] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [montantsSuggeres, setMontantsSuggeres] = useState<number[]>([20, 50, 100, 250]);
  const [montantPersonnalise, setMontantPersonnalise] = useState('');
  const [chargementRecharge, setChargementRecharge] = useState(false);
  const [afficherHistorique, setAfficherHistorique] = useState(false);

  const chargerPortefeuille = async () => {
    try {
      const res = await fetch('/api/sponsors/portefeuille/solde', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSolde(data.solde ?? 0);
      setTransactions(data.transactions || []);
      if (data.montants_suggeres) setMontantsSuggeres(data.montants_suggeres);
    } catch (e) {
      console.error('Erreur chargement portefeuille:', e);
    }
  };

  useEffect(() => { if (peutPubs) chargerPortefeuille(); }, [peutPubs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recharge = params.get('recharge');
    if (recharge === 'succes') {
      alert('✅ Recharge reçue ! Votre solde sera mis à jour dans quelques instants.');
      setTimeout(chargerPortefeuille, 2000);
    } else if (recharge === 'annule') {
      alert('La recharge a été annulée.');
    }
    if (recharge) {
      params.delete('recharge');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recharger = async (montant: number) => {
    if (!montant || montant < 5) return;
    setChargementRecharge(true);
    try {
      const res = await fetch('/api/sponsors/portefeuille/recharger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ montant }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(`❌ ${data.error || 'Erreur lors de la création du paiement'}`);
    } catch (e) {
      alert('❌ Erreur réseau lors de la recharge');
    }
    setChargementRecharge(false);
  };

  useEffect(() => {
    const charger = async () => {
      try {
        const [resPhotos, resPub] = await Promise.all([
          fetch('/api/sponsors/plans-photos', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sponsors/plans-pub', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const dataPhotos = await resPhotos.json();
        const dataPub = await resPub.json();
        setPlansPhotos((dataPhotos.plans || []).map((p: any) => ({ id: p.key || p.id, label: p.label, maxPhotos: p.maxPhotos, prix: p.prix })));
        setPlansPub((dataPub.plans || []).map((p: any) => ({ id: p.key || p.id, label: p.label, maxPubsActives: p.maxPubsActives, prix: p.prix })));
      } catch (e) {
        console.error('Erreur chargement des forfaits:', e);
      } finally {
        setChargementPlans(false);
      }
    };
    charger();
  }, [token]);

  const [changement, setChangement] = useState(false);
  const [planActuelId, setPlanActuelId] = useState<string>(sponsorInfo?.forfait || 'decouverte');
  const [photosUtilisees, setPhotosUtilisees] = useState<number>(sponsorInfo?.photos_utilisees || 0);
  const [erreurChangement, setErreurChangement] = useState('');

  const [planPubActuelId, setPlanPubActuelId] = useState<string>(sponsorInfo?.forfait_pub || 'decouverte');
  const [pubsUtilisees, setPubsUtilisees] = useState<number>(sponsorInfo?.pubs_utilisees || 0);
  const [erreurChangementPub, setErreurChangementPub] = useState('');

  const planActuel = plansPhotos.find(p => p.id === planActuelId) || plansPhotos[0];
  const limite = planActuel?.maxPhotos ?? null;
  const pourcentage = limite ? Math.min((photosUtilisees / limite) * 100, 100) : 0;
  const proche = limite ? photosUtilisees / limite >= 0.8 : false;

  const planPubActuel = plansPub.find(p => p.id === planPubActuelId) || plansPub[0];
  const limitePub = planPubActuel?.maxPubsActives ?? null;
  const pourcentagePub = limitePub ? Math.min((pubsUtilisees / limitePub) * 100, 100) : 0;
  const prochePub = limitePub ? pubsUtilisees / limitePub >= 0.8 : false;

  const changerForfait = async (nouveauForfaitId: string) => {
    if (nouveauForfaitId === planActuelId) return;
    setErreurChangement('');
    setChangement(true);
    try {
      const response = await fetch('/api/sponsors/forfait-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ forfait: nouveauForfaitId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErreurChangement(data.error || 'Erreur lors du changement de forfait');
        return;
      }
      setPlanActuelId(nouveauForfaitId);
      alert(`✅ ${data.message}`);
    } catch (error) {
      console.error('Erreur changement forfait:', error);
      setErreurChangement('Erreur réseau lors du changement de forfait');
    } finally {
      setChangement(false);
    }
  };

  const [changementPub, setChangementPub] = useState(false);
  const changerForfaitPub = async (nouveauForfaitId: string) => {
    if (nouveauForfaitId === planPubActuelId) return;
    setErreurChangementPub('');
    setChangementPub(true);
    try {
      const response = await fetch('/api/sponsors/forfait-pub', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ forfait: nouveauForfaitId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErreurChangementPub(data.error || 'Erreur lors du changement de forfait');
        return;
      }
      setPlanPubActuelId(nouveauForfaitId);
      alert(`✅ ${data.message}`);
    } catch (error) {
      console.error('Erreur changement forfait pub:', error);
      setErreurChangementPub('Erreur réseau lors du changement de forfait');
    } finally {
      setChangementPub(false);
    }
  };

  if (chargementPlans) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>⏳ Chargement des forfaits...</div>;
  }

  return (
    <div>
      {peutPubs && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💳 Portefeuille publicitaire
          </h3>
          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 16px' }}>
            Chaque clic sur vos pubs débite ce solde. Une pub ne s'affiche jamais si votre solde est à 0$.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#999' }}>Solde disponible</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: solde !== null && solde <= 0 ? '#dc2626' : '#16a34a' }}>
                {solde !== null ? solde.toFixed(2) : '—'}$
              </div>
              {solde !== null && solde <= 0 && (
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>⚠️ Vos pubs sont en pause — rechargez pour les réactiver</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {montantsSuggeres.map(m => (
              <button key={m} onClick={() => recharger(m)} disabled={chargementRecharge}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #f59e0b', background: '#fff', color: '#f59e0b', fontWeight: 700, fontSize: '14px', cursor: chargementRecharge ? 'wait' : 'pointer' }}>
                +{m}$
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number" min={5} value={montantPersonnalise} onChange={e => setMontantPersonnalise(e.target.value)}
              placeholder="Montant personnalisé ($)"
              style={{ flex: 1, maxWidth: 220, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            <button
              onClick={() => recharger(parseFloat(montantPersonnalise))}
              disabled={chargementRecharge || !montantPersonnalise || parseFloat(montantPersonnalise) < 5}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 700, fontSize: '14px', cursor: 'pointer', opacity: (!montantPersonnalise || parseFloat(montantPersonnalise) < 5) ? 0.5 : 1 }}
            >
              💳 Recharger
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#bbb', margin: '6px 0 0' }}>Montant minimum : 5$</p>

          <button onClick={() => setAfficherHistorique(v => !v)} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#666', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
            {afficherHistorique ? 'Masquer' : 'Voir'} l'historique des transactions
          </button>

          {afficherHistorique && (
            <div style={{ marginTop: '12px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              {transactions.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Aucune transaction pour le moment.</div>
              ) : (
                transactions.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.type === 'recharge' ? '💳 Recharge' : t.type === 'remboursement' ? '↩️ Remboursement' : `🖱️ Clic${t.pub_titre ? ' — ' + t.pub_titre : ''}`}</div>
                      <div style={{ color: '#999' }}>{new Date(t.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: t.type === 'depense' ? '#dc2626' : '#16a34a' }}>
                      {t.type === 'depense' ? '−' : '+'}{parseFloat(t.montant).toFixed(2)}$
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: peutPhotos && peutPubs ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {/* Forfait Photos */}
        {peutPhotos && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Forfait Photos
            </h3>

            {/* Barre de progression */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                <span>{photosUtilisees} photo{photosUtilisees > 1 ? 's' : ''} utilisée{photosUtilisees > 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 700 }}>{limite === null ? 'Illimité' : `/ ${limite}`}</span>
              </div>
              {limite !== null && (
                <div style={{ width: '100%', height: '10px', background: '#f3f4f6', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pourcentage}%`, height: '100%',
                    background: proche ? '#dc2626' : '#f59e0b',
                    borderRadius: '20px', transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
              {proche && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: '6px 0 0' }}>
                  ⚠️ Vous approchez de votre limite — pensez à passer à un forfait supérieur.
                </p>
              )}
            </div>

            {erreurChangement && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ❌ {erreurChangement}
              </div>
            )}

            {/* Les 4 paliers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plansPhotos.map((plan) => {
                const estActuel = plan.id === planActuelId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => !changement && changerForfait(plan.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', borderRadius: '10px',
                      border: estActuel ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      background: estActuel ? '#fef3c7' : '#fff',
                      cursor: changement ? 'wait' : 'pointer',
                      opacity: changement ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: estActuel ? '#92400e' : '#1a1a1a' }}>
                        {plan.label} {estActuel && '✓'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {plan.maxPhotos === null ? 'Photos illimitées' : `${plan.maxPhotos} photos`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: estActuel ? '#92400e' : '#333' }}>
                      {plan.prix}$<span style={{ fontSize: '11px', fontWeight: 400 }}>/mois</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Forfait Publicité */}
        {peutPubs && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📢 Forfait Publicité
            </h3>

            {/* Barre de progression */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                <span>{pubsUtilisees} pub{pubsUtilisees > 1 ? 's' : ''} active{pubsUtilisees > 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 700 }}>{limitePub === null ? 'Illimité' : `/ ${limitePub}`}</span>
              </div>
              {limitePub !== null && (
                <div style={{ width: '100%', height: '10px', background: '#f3f4f6', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pourcentagePub}%`, height: '100%',
                    background: prochePub ? '#dc2626' : '#f59e0b',
                    borderRadius: '20px', transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
              {prochePub && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: '6px 0 0' }}>
                  ⚠️ Vous approchez de votre limite de pubs actives — pensez à passer à un forfait supérieur.
                </p>
              )}
            </div>

            {erreurChangementPub && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ❌ {erreurChangementPub}
              </div>
            )}

            {/* Les 4 paliers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plansPub.map((plan) => {
                const estActuel = plan.id === planPubActuelId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => !changementPub && changerForfaitPub(plan.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', borderRadius: '10px',
                      border: estActuel ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      background: estActuel ? '#fef3c7' : '#fff',
                      cursor: changementPub ? 'wait' : 'pointer',
                      opacity: changementPub ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: estActuel ? '#92400e' : '#1a1a1a' }}>
                        {plan.label} {estActuel && '✓'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {plan.maxPubsActives === null ? 'Pubs actives illimitées' : `${plan.maxPubsActives} pubs actives`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: estActuel ? '#92400e' : '#333' }}>
                      {plan.prix}$<span style={{ fontSize: '11px', fontWeight: 400 }}>/mois</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#999', margin: '12px 0 0' }}>
              💡 Le prix par clic et le budget de chaque pub restent séparés — ce forfait détermine seulement combien de pubs peuvent rouler en même temps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorAbonnement;