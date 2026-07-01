import React, { useState, useEffect } from 'react';
import { getPlansVisibles, fmtPrix, PlanData } from '../../shared/plansData';

interface PlansMembershipProps {
  naviguerVers?: (page: string) => void;
  planActuelId?: string;
}

export default function PlansMembership({ naviguerVers, planActuelId = 'fondateur' }: PlansMembershipProps) {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [planSurvol, setPlanSurvol] = useState<string | null>(null);
  const [modalConfirmOuvert, setModalConfirmOuvert] = useState(false);
  const [planChoisi, setPlanChoisi] = useState<PlanData | null>(null);
  const [periodeAffichee, setPeriodeAffichee] = useState<'mensuel' | 'annuel'>('mensuel');

  // ── Charger depuis localStorage ──
  useEffect(() => {
    const charger = () => {
      const p = getPlansVisibles();
      setPlans(p.sort((a, b) => a.position - b.position));
    };
    charger();
    window.addEventListener('focus', charger);
    window.addEventListener('storage', charger);
    return () => {
      window.removeEventListener('focus', charger);
      window.removeEventListener('storage', charger);
    };
  }, []);

  const choisirPlan = (plan: PlanData) => {
    if (plan.id === planActuelId) return;
    setPlanChoisi(plan);
    setModalConfirmOuvert(true);
  };

  const confirmer = () => {
    setModalConfirmOuvert(false);
    if (naviguerVers) naviguerVers('mon-forfait');
  };

  if (plans.length === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>⭐</div>
        <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Chargement des forfaits...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 8px 0', color: '#1a2e2e', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Choisissez votre forfait
          </h1>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px 0' }}>
            Tous les prix sont en dollars canadiens, taxes en sus. Changez de plan à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div style={{ display: 'inline-flex', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e1e3e5', padding: '4px', gap: '4px' }}>
            {[{ val: 'mensuel', label: '📅 Mensuel' }, { val: 'annuel', label: '📆 Annuel (–15%)' }].map(t => (
              <button
                key={t.val}
                onClick={() => setPeriodeAffichee(t.val as 'mensuel' | 'annuel')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '700',
                  backgroundColor: periodeAffichee === t.val ? '#537373' : 'transparent',
                  color: periodeAffichee === t.val ? 'white' : '#888',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des plans */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
          gap: '16px',
          marginBottom: '32px',
        }}>
          {plans.map(plan => {
            const prixBase = plan.prixHT;
            const prixAffiche = periodeAffichee === 'annuel' ? prixBase * 0.85 : prixBase;
            const tps = prixAffiche * 0.05;
            const tvq = prixAffiche * 0.09975;
            const ttc = prixAffiche + tps + tvq;
            const estActuel = plan.id === planActuelId;
            const estSurvole = planSurvol === plan.id;
            const nbFonctIncluses = plan.fonctionnalites.filter(f => f.inclus).length;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setPlanSurvol(plan.id)}
                onMouseLeave={() => setPlanSurvol(null)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: `2px solid ${estActuel ? '#537373' : estSurvole ? '#537373' : plan.recommande ? '#c9961a' : '#e1e3e5'}`,
                  boxShadow: estSurvole || estActuel ? '0 8px 24px rgba(83,115,115,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transform: estSurvole && !estActuel ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Badge Populaire */}
                {plan.recommande && !estActuel && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#c9961a', color: 'white', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: '800' }}>
                    ⭐ Populaire
                  </div>
                )}
                {/* Badge Actuel */}
                {estActuel && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#537373', color: 'white', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: '800' }}>
                    ✓ Votre plan
                  </div>
                )}

                {/* Header coloré */}
                <div style={{ background: plan.couleurBanniere, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{plan.emoji}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 12px 0' }}>{plan.nom}</h3>
                  {prixAffiche === 0 ? (
                    <div>
                      <p style={{ fontSize: '30px', fontWeight: '900', margin: '0 0 2px 0', lineHeight: 1 }}>Gratuit</p>
                      <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Sans frais mensuels</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '30px', fontWeight: '900', margin: '0 0 2px 0', lineHeight: 1 }}>
                        {ttc.toFixed(2).replace('.', ',')} $
                      </p>
                      <p style={{ fontSize: '11px', opacity: 0.8, margin: '0 0 4px 0' }}>/{periodeAffichee === 'mensuel' ? 'mois' : 'an'} TTC</p>
                      <p style={{ fontSize: '10px', opacity: 0.65, margin: 0 }}>
                        TPS {tps.toFixed(2)} $ · TVQ {tvq.toFixed(2)} $
                      </p>
                    </div>
                  )}
                </div>

                {/* Infos clés */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Produits', val: plan.limiteProduits === 'Illimité' ? '∞' : String(plan.limiteProduits) },
                    { label: 'Commission', val: `${plan.commission}%` },
                    { label: 'Essai', val: `${plan.periodeEssai}j` },
                  ].map(info => (
                    <div key={info.label} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a2e2e', margin: '0 0 1px 0' }}>{info.val}</p>
                      <p style={{ fontSize: '10px', color: '#aaa', margin: 0, textTransform: 'uppercase', fontWeight: '700' }}>{info.label}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {plan.description && (
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>{plan.description}</p>
                  </div>
                )}

                {/* Fonctionnalités */}
                <div style={{ padding: '14px 18px', flex: 1 }}>
                  <p style={{ fontSize: '10px', fontWeight: '800', color: '#537373', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
                    {nbFonctIncluses} fonctionnalité{nbFonctIncluses > 1 ? 's' : ''} incluse{nbFonctIncluses > 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '200px', overflowY: 'auto' }}>
                    {plan.fonctionnalites.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                        <span style={{ fontSize: '12px', color: f.inclus ? '#27AE60' : '#ddd', flexShrink: 0, marginTop: '1px' }}>{f.inclus ? '✅' : '✗'}</span>
                        <div>
                          <span style={{ fontSize: '12px', color: f.inclus ? '#333' : '#bbb', fontWeight: f.inclus ? '500' : '400', lineHeight: '1.3' }}>{f.label}</span>
                          {f.note && <span style={{ display: 'block', fontSize: '10px', color: '#537373', fontWeight: '700' }}>{f.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Frais activation */}
                {plan.fraisActivationHT > 0 && (
                  <div style={{ padding: '10px 18px', backgroundColor: '#fef9c3', borderTop: '1px solid #fde68a' }}>
                    <p style={{ fontSize: '11px', color: '#92400e', fontWeight: '700', margin: 0 }}>
                      🔑 Frais d'activation : {fmtPrix(plan.fraisActivationHT + plan.fraisActivationTPS + plan.fraisActivationTVQ)} TTC (unique)
                    </p>
                  </div>
                )}

                {/* Bouton CTA */}
                <div style={{ padding: '16px 18px' }}>
                  <button
                    onClick={() => choisirPlan(plan)}
                    disabled={estActuel}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: '8px', border: 'none',
                      fontSize: '13px', fontWeight: '800', cursor: estActuel ? 'default' : 'pointer',
                      background: estActuel ? '#f0f0f0' : plan.couleurBanniere,
                      color: estActuel ? '#aaa' : 'white',
                      boxShadow: estActuel ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {estActuel ? '✓ Plan actuel' : prixAffiche === 0 ? 'Commencer gratuitement' : `Choisir ce forfait →`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tableau comparatif */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e1e3e5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ padding: '16px 22px', backgroundColor: '#f0f5f5', borderBottom: '2px solid #537373', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#537373', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tableau comparatif des fonctionnalités</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#537373', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', minWidth: '180px' }}>
                    Fonctionnalité
                  </th>
                  {plans.map(p => (
                    <th key={p.id} style={{ padding: '12px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: p.id === planActuelId ? '#537373' : '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', backgroundColor: p.id === planActuelId ? '#f0f5f5' : 'transparent' }}>
                      {p.emoji} {p.nom.replace('Plan ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Ligne prix */}
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700', color: '#555', borderBottom: '1px solid #f0f0f0' }}>💰 Prix mensuel TTC</td>
                  {plans.map(p => {
                    const ttc = p.prixHT + p.tps + p.tvq;
                    return (
                      <td key={p.id} style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#537373', borderBottom: '1px solid #f0f0f0', backgroundColor: p.id === planActuelId ? '#f0f5f5' : 'transparent' }}>
                        {ttc === 0 ? 'Gratuit' : `${ttc.toFixed(2).replace('.', ',')} $`}
                      </td>
                    );
                  })}
                </tr>
                {/* Ligne commission */}
                <tr>
                  <td style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700', color: '#555', borderBottom: '1px solid #f0f0f0' }}>📊 Commission</td>
                  {plans.map(p => (
                    <td key={p.id} style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#333', borderBottom: '1px solid #f0f0f0', backgroundColor: p.id === planActuelId ? '#f0f5f5' : 'transparent' }}>
                      {p.commission}%
                    </td>
                  ))}
                </tr>
                {/* Ligne produits */}
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700', color: '#555', borderBottom: '1px solid #f0f0f0' }}>📦 Produits</td>
                  {plans.map(p => (
                    <td key={p.id} style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#333', borderBottom: '1px solid #f0f0f0', backgroundColor: p.id === planActuelId ? '#f0f5f5' : 'transparent' }}>
                      {p.limiteProduits === 'Illimité' ? '∞' : p.limiteProduits}
                    </td>
                  ))}
                </tr>
                {/* Lignes fonctionnalités */}
                {plans[0]?.fonctionnalites.map((f, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '9px 18px', fontSize: '12px', color: '#555', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{f.label}</span>
                      {f.key === 'codesPromo' && <span style={{ fontSize: '10px', backgroundColor: '#fef9c3', color: '#92400e', border: '1px solid #d97706', borderRadius: '8px', padding: '1px 6px', fontWeight: '700' }}>PayPal</span>}
                    </td>
                    {plans.map(p => {
                      const fonct = p.fonctionnalites.find(ff => ff.key === f.key);
                      return (
                        <td key={p.id} style={{ padding: '9px 10px', textAlign: 'center', fontSize: '14px', borderBottom: '1px solid #f5f5f5', backgroundColor: p.id === planActuelId ? '#f0f5f5' : 'transparent' }}>
                          {fonct?.inclus ? '✅' : <span style={{ color: '#ddd' }}>✗</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note taxes */}
        <div style={{ backgroundColor: '#e8f2fb', borderRadius: '10px', padding: '14px 18px', border: '1px solid #2d6a9f40', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>ℹ️</span>
          <p style={{ fontSize: '12px', color: '#2d6a9f', margin: 0, fontWeight: '600' }}>
            Tous les prix sont en dollars canadiens (CAD) et affichés TTC incluant TPS (5%) et TVQ (9,975%). Les plans sont gérés via Shopify Subscriptions.
          </p>
        </div>
      </div>

      {/* MODAL Confirmation */}
      {modalConfirmOuvert && planChoisi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: planChoisi.couleurBanniere, color: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                {planChoisi.emoji} {planChoisi.nom}
              </h3>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Confirmer la sélection de ce forfait</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #e1e3e5' }}>
                {[
                  { label: 'Prix mensuel TTC', val: planChoisi.prixHT === 0 ? 'Gratuit' : fmtPrix(planChoisi.prixHT + planChoisi.tps + planChoisi.tvq) },
                  { label: 'Commission', val: `${planChoisi.commission}%` },
                  { label: 'Produits', val: planChoisi.limiteProduits === 'Illimité' ? 'Illimité ∞' : String(planChoisi.limiteProduits) },
                  ...(planChoisi.fraisActivationHT > 0 ? [{ label: "Frais d'activation (unique)", val: fmtPrix(planChoisi.fraisActivationHT + planChoisi.fraisActivationTPS + planChoisi.fraisActivationTVQ) }] : []),
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>{r.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a2e2e' }}>{r.val}</span>
                  </div>
                ))}
              </div>
              {planChoisi.fraisActivationHT > 0 && (
                <div style={{ backgroundColor: '#fef9c3', border: '1px solid #d97706', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', margin: 0 }}>
                    ⚠️ Des frais d'activation uniques s'appliquent à ce forfait.
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setModalConfirmOuvert(false); setPlanChoisi(null); }} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={confirmer} style={{ background: planChoisi.couleurBanniere, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  ✅ Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
