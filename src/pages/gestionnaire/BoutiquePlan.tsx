// CHEMIN : src/pages/gestionnaire/BoutiquePlan.tsx
// e-Vend Studio — « Mon plan & limites » des templates boutique (solo : Premium, Simplisse, Mode, Beauté…).
// Même apparence sombre que la page du multivendeur. Les paliers viennent de l'admin (page « Prix Template »).
// Un seul écran pour tous les templates solo.
// API : GET/PUT /api/boutique/gestionnaire/plan ; les add-ons et le total (section du bas) : voir BoutiqueAddons.tsx

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueAddons, { prixEnNombre } from './BoutiqueAddons';

interface Palier { label: string; limite: number; prix: string; plan_id: string; }
interface EtatPlan { template_id: string; plan: string; limite: number | null; nb_actifs: number; palier_actuel: string | null; paliers: Palier[]; }

interface Props {
  gestionnaireId: number;
  accent?: string;
  naviguerVers?: (page: string) => void;
  onAddonsChange?: (actifs: Record<string, boolean>) => void;   // prévient le menu quand un add-on est activé / désactivé
  base?: string;          // autre API de même forme (petites annonces : /api/studio/annonces-site) ; défaut = boutique
  sansAddons?: boolean;   // petites annonces : pas d'add-ons boutique
  pageListe?: string;     // page « Voir mes annonces » (défaut : liste des annonces boutique)
}

const COULEURS = ['#c9a96e', '#a78bfa', '#f472b6', '#fb923c', '#ef4444', '#14b8a6', '#3b82f6'];
const D = {
  carte: 'rgba(255,255,255,0.04)', bord: 'rgba(255,255,255,0.1)', bordDoux: 'rgba(255,255,255,0.06)',
  texte: '#ffffff', texte2: 'rgba(255,255,255,0.78)', discret: 'rgba(255,255,255,0.5)', puce: 'rgba(255,255,255,0.08)', modal: '#111c33',
};
const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

function prixAffiche(prix: string): string {
  const p = (prix || '').trim();
  if (!p) return '—';
  return /[$€]/.test(p) ? p : `${p} $`;
}

export default function BoutiquePlan({ accent, naviguerVers, onAddonsChange, base, sansAddons, pageListe }: Props) {
  const couleurBase = accent || '#c9a96e';
  const [etat, setEtat] = useState<EtatPlan | null>(null);
  const [chargement, setChargement] = useState(true);
  const [cible, setCible] = useState<number | null>(null);        // limite du palier en cours de confirmation
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);
  const [erreurChargement, setErreurChargement] = useState('');

  const notifier = (type: 'ok' | 'err', texte: string) => { setMsg({ type, texte }); setTimeout(() => setMsg(null), 4500); };

  const charger = async () => {
    const r = await bq('/plan', { base });
    if (r.ok) { setEtat(r.data as EtatPlan); setErreurChargement(''); } else setErreurChargement(messageErreur(r));
    setChargement(false);
  };
  useEffect(() => { charger(); }, []);

  const cadre = (contenu: React.ReactNode) => (
    <div style={{ minHeight: 'calc(100vh - 96px)', padding: '28px 28px 40px', fontFamily: "'Inter',sans-serif", color: D.texte }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
          .bqp-palier { transition: transform .2s, box-shadow .2s; } .bqp-palier:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.35); }`}</style>
        {contenu}
      </div>
    </div>
  );

  if (chargement) return cadre(<div style={{ padding: 60, textAlign: 'center', color: D.discret }}>⏳ Chargement de votre plan…</div>);
  if (!etat) return cadre(<div style={{ padding: 40, textAlign: 'center', color: '#f87171' }}>{erreurChargement || 'Plan introuvable'}</div>);

  if (!etat.paliers.length) {
    return cadre(
      <>
        <div style={{ background: `linear-gradient(135deg, ${couleurBase} 0%, ${couleurBase}aa 100%)`, borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>📊 Mon plan & limites</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
            Votre template actuel n'a pas de limite d'annonces. Vous avez {etat.nb_actifs} annonce{etat.nb_actifs > 1 ? 's' : ''} active{etat.nb_actifs > 1 ? 's' : ''}.
          </p>
        </div>
        {!sansAddons && <BoutiqueAddons couleur={couleurBase} palier={null} onChange={onAddonsChange} />}
      </>
    );
  }

  const limite = etat.limite || 0;
  const actuel = etat.paliers.find(p => p.limite === etat.limite) || etat.paliers[0];
  const indexActuel = etat.paliers.indexOf(actuel);
  const pct = limite > 0 ? Math.min(100, Math.round((etat.nb_actifs / limite) * 100)) : 0;
  const couleurBarre = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  const reste = Math.max(0, limite - etat.nb_actifs);
  const couleurDe = (i: number) => COULEURS[i % COULEURS.length];
  const couleurCourante = couleurDe(indexActuel);
  const nomPalier = (p: Palier, i: number) => p.label || `Palier ${i + 1}`;

  const palierCible = cible !== null ? etat.paliers.find(p => p.limite === cible) || null : null;
  const idxCible = palierCible ? etat.paliers.indexOf(palierCible) : -1;
  const estDowngrade = !!palierCible && idxCible < indexActuel;

  const sauvegarder = async () => {
    if (!palierCible) return;
    setEnCours(true);
    const r = await bq('/plan', { method: 'PUT', body: { limite: palierCible.limite }, base });
    setEnCours(false);
    const nom = nomPalier(palierCible, idxCible);
    const lim = palierCible.limite;
    setCible(null);
    if (r.ok) {
      notifier('ok', `Votre palier est maintenant « ${nom} » (${lim} annonces actives).`);
      await charger();
    } else {
      notifier('err', messageErreur(r));
    }
  };

  return cadre(
    <>
      {/* En-tête : bandeau dégradé (couleur du palier actuel) */}
      <div style={{ background: `linear-gradient(135deg, ${couleurCourante} 0%, ${couleurCourante}aa 100%)`, borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>📊 Mon plan & limites</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
          Seules vos annonces actives comptent dans la limite · Tous les prix sont en dollars canadiens + taxes applicables
        </p>
      </div>

      {/* Utilisation des annonces */}
      <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: '18px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: D.discret, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Palier actuel</p>
            <span style={{ fontSize: 18, fontWeight: 800, color: couleurCourante }}>{actuel.label || `${actuel.limite} annonces`}</span>
            <span style={{ marginLeft: 10, fontSize: 12, background: D.puce, color: D.texte2, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{prixAffiche(actuel.prix)}/mois</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: D.discret, margin: '0 0 4px' }}>📦 Annonces actives</p>
            <span style={{ fontSize: 22, fontWeight: 800, color: pct >= 90 ? '#f87171' : '#fff' }}>{etat.nb_actifs}</span>
            <span style={{ fontSize: 14, color: D.discret }}> / {limite}</span>
          </div>
        </div>
        <div style={{ background: D.puce, borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: couleurBarre, borderRadius: 8, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: D.discret }}>{pct}% utilisé</span>
          <span style={{ fontSize: 11, color: reste <= 5 ? '#f87171' : D.discret, fontWeight: reste <= 5 ? 700 : 400 }}>{reste} emplacement{reste > 1 ? 's' : ''} restant{reste > 1 ? 's' : ''}</span>
        </div>
        {pct >= 90 && (
          <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5', fontWeight: 500 }}>
            ⚠️ Vous approchez de votre limite. Passez au palier supérieur pour continuer à publier des annonces.
          </div>
        )}
      </div>

      {/* Grille des paliers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 12 }}>
        {etat.paliers.map((p, i) => {
          const c = couleurDe(i);
          const estActuel = p.limite === actuel.limite;
          const estUpgrade = i > indexActuel;
          const impossible = etat.nb_actifs > p.limite;
          return (
            <div key={p.plan_id} className="bqp-palier" style={{ background: D.carte, border: `2px solid ${estActuel ? c : D.bord}`, borderRadius: 16, overflow: 'hidden', boxShadow: estActuel ? `0 4px 20px ${c}30` : 'none', position: 'relative', display: 'flex', flexDirection: 'column', opacity: impossible ? 0.6 : 1 }}>
              {estActuel && <div style={{ position: 'absolute', top: 12, left: 12, background: c, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>Actuel</div>}
              <div style={{ background: `linear-gradient(135deg, ${c}22, ${c}08)`, padding: '34px 16px 16px', borderBottom: `1px solid ${c}20`, textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: D.texte, margin: '0 0 12px' }}>{nomPalier(p, i)}</h3>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900, color: '#fff' }}>
                  {prixAffiche(p.prix)}<span style={{ fontSize: 12, fontWeight: 500, color: D.discret }}>/mois</span>
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${D.bordDoux}`, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: `${c}33`, color: '#fff', padding: '4px 10px', borderRadius: 20 }}>📦 {p.limite} annonces actives</span>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                {estActuel ? (
                  <div style={{ textAlign: 'center', padding: '10px', background: `${c}33`, borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#fff' }}>✅ Palier actuel</div>
                ) : impossible ? (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#fca5a5', fontWeight: 600, lineHeight: 1.4 }}>⚠️ Vous avez {etat.nb_actifs} annonces actives : désactivez-en d'abord.</div>
                ) : (
                  <button onClick={() => setCible(p.limite)} disabled={enCours}
                    style={{ width: '100%', padding: '10px', border: `2px solid ${c}`, borderRadius: 10, background: estUpgrade ? c : 'transparent', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {estUpgrade ? `Passer à ${nomPalier(p, i)} ↑` : `Rétrograder à ${nomPalier(p, i)} ↓`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: D.discret, textAlign: 'center', margin: '0 0 6px' }}>Pour changer de template, rendez-vous dans « Choisir un template » : votre palier est ajusté automatiquement.</p>
      {naviguerVers && <div style={{ textAlign: 'center', marginBottom: 8 }}><button onClick={() => naviguerVers(pageListe || 'annonces-liste')} style={{ background: 'none', border: 'none', color: couleurBase, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Voir mes annonces →</button></div>}

      {msg && <div style={{ textAlign: 'center', color: msg.type === 'ok' ? '#34d399' : '#f87171', fontWeight: 700, margin: '14px 0' }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.texte}</div>}

      {/* Add-ons + récapitulatif (palier + add-ons = total réel) */}
      {!sansAddons && <BoutiqueAddons couleur={couleurCourante} palier={{ label: nomPalier(actuel, indexActuel), prix: actuel.prix }} onChange={onAddonsChange} />}

      {/* Confirmation de changement de palier */}
      {palierCible && (() => {
        const c = couleurDe(idxCible);
        const pa = prixEnNombre(actuel.prix), pn = prixEnNombre(palierCible.prix);
        const diff = pa !== null && pn !== null ? pn - pa : null;
        const fond = estDowngrade ? 'linear-gradient(135deg,#dc2626,#ef4444)' : `linear-gradient(135deg, ${c}dd, ${c})`;
        return (
          <div onClick={() => { if (!enCours) setCible(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: D.modal, border: `1px solid ${D.bord}`, color: D.texte, borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', fontFamily: 'inherit' }}>
              <div style={{ background: fond, padding: '26px 30px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{estDowngrade ? '⚠️' : '📊'}</div>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: 0 }}>
                  {estDowngrade ? `Rétrograder au palier ${nomPalier(palierCible, idxCible)}` : `Passer au palier ${nomPalier(palierCible, idxCible)}`}
                </h2>
              </div>
              <div style={{ padding: '22px 30px 26px' }}>
                <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                    <span style={{ fontSize: 13, color: D.discret }}>Palier actuel</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{nomPalier(actuel, indexActuel)} — {prixAffiche(actuel.prix)}/mois</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: diff !== null ? 8 : 0, gap: 10 }}>
                    <span style={{ fontSize: 13, color: D.discret }}>Nouveau palier</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{nomPalier(palierCible, idxCible)} — {prixAffiche(palierCible.prix)}/mois</span>
                  </div>
                  {diff !== null && (
                    <div style={{ borderTop: `1px solid ${D.bord}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>Différence</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: diff >= 0 ? '#fff' : '#34d399' }}>{diff >= 0 ? '+' : '−'}{$(Math.abs(diff))}/mois</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, background: `${c}33`, color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>📦 {palierCible.limite} annonces actives</span>
                </div>
                {estDowngrade && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: D.texte2, lineHeight: 1.7 }}>
                      Votre limite passera de <strong>{actuel.limite}</strong> à <strong>{palierCible.limite}</strong> annonces actives. Vous ne pourrez pas publier plus de {palierCible.limite} annonces actives à la fois.
                    </p>
                  </div>
                )}
                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#fcd34d', lineHeight: 1.6 }}>
                    Le changement est effectif immédiatement. La facturation de <strong>{prixAffiche(palierCible.prix)}/mois + taxes</strong> s'appliquera à votre prochain renouvellement.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setCible(null)} disabled={enCours}
                    style={{ flex: 1, padding: '11px', border: `1px solid ${D.bord}`, borderRadius: 10, background: D.puce, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: D.texte }}>Annuler</button>
                  <button onClick={sauvegarder} disabled={enCours}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: fond, color: '#fff', fontSize: 14, fontWeight: 800, cursor: enCours ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                    {enCours ? '⏳…' : estDowngrade ? 'Confirmer la rétrogradation' : `✅ Confirmer — ${prixAffiche(palierCible.prix)}/mois`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}