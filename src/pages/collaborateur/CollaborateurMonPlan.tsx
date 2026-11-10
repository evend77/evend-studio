// CHEMIN : src/pages/collaborateur/CollaborateurMonPlan.tsx
// e-Vend Studio — Add-on « Plans collaborateurs » : « Mon plan » du collaborateur (plan actuel, utilisation, choix d'un autre plan).
// Mode `obligatoire` : le collaborateur n'a pas encore de plan, il doit en choisir un (écran bloquant).
// API : GET /api/collab/:gid/plans/mon-plan · POST /api/collab/:gid/plans/choisir { plan_id }

import React, { useState } from 'react';

const API_BASE = '/api';

export interface PlanCollab {
  id: number; nom: string; emoji: string; description: string; prix_mensuel: number; limite_annonces: number | null; addons: string[];
  type_commission: 'pourcentage' | 'fixe' | 'mixte'; commission_pct: number; commission_fixe: number; commission_max: number | null; visible: boolean;
}
export interface EtatPlan {
  systeme: boolean; a_choisi?: boolean; bloque?: boolean; raison?: string | null; grace_restante?: number | null;
  plan?: PlanCollab | null; utilise?: number; limite?: number | null; addons?: string[];
  plans?: PlanCollab[]; addons_noms?: { code: string; nom: string; emoji: string }[]; paiement_en_ligne?: boolean;
}

const $$ = (n: number) => `${Number(n).toFixed(2)} $`;
const commission = (p: PlanCollab) => p.type_commission === 'fixe' ? `${$$(p.commission_fixe)} par commande`
  : p.type_commission === 'mixte' ? `${p.commission_pct} % + ${$$(p.commission_fixe)}` : `${p.commission_pct} %`;

interface Props { gestionnaireId: number; accent: string; isMobile: boolean; etat: EtatPlan; obligatoire?: boolean; onChange: () => void }

const CollaborateurMonPlan: React.FC<Props> = ({ gestionnaireId, accent, isMobile, etat, obligatoire, onChange }) => {
  const [occupe, setOccupe] = useState<number | null>(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');

  const choisir = async (p: PlanCollab) => {
    if (!window.confirm(`Choisir le plan « ${p.nom} » ?`)) return;
    setOccupe(p.id); setErreur(''); setMessage('');
    try {
      const r = await fetch(`${API_BASE}/collab/${gestionnaireId}/plans/choisir`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: p.id }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      setMessage('Plan enregistré.'); onChange();
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(null); }
  };

  const plans = etat.plans || [];
  const nomAddon = (c: string) => { const a = (etat.addons_noms || []).find((x) => x.code === c); return a ? `${a.emoji} ${a.nom}` : c; };
  const cible = etat.plan;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 16 : 24, color: '#333' }}>
      {obligatoire ? (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>👋 Choisissez votre plan</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>Cette marketplace utilise maintenant des plans. Choisissez le vôtre pour continuer à créer et modifier vos annonces. <b>Vos annonces actuelles restent en ligne.</b></p>
        </div>
      ) : (
        <h1 style={{ fontSize: 24, margin: '0 0 16px' }}>🧾 Mon plan</h1>
      )}
      {etat.raison === 'impaye' && <div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 }}>Votre plan est impayé : la création et la modification d'annonces sont bloquées.</div>}
      {message && <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>✅ {message}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>❌ {erreur}</div>}

      {cible && (
        <div style={{ background: '#fff', border: `2px solid ${accent}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Votre plan actuel</div>
          <div style={{ fontSize: 20, fontWeight: 800, margin: '4px 0' }}>{cible.emoji} {cible.nom}{!cible.visible && <span style={{ marginLeft: 8, fontSize: 11, background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: 10 }}>🎁 Offert pour vous</span>}</div>
          <div style={{ fontSize: 14, color: '#555' }}>
            📦 {etat.utilise ?? 0} / {cible.limite_annonces == null ? 'illimité' : cible.limite_annonces} annonces · 💼 Commission {commission(cible)}{cible.commission_max != null ? ` (max ${$$(cible.commission_max)})` : ''} · 💵 {cible.prix_mensuel > 0 ? `${$$(cible.prix_mensuel)}/mois` : 'Gratuit'}
          </div>
          {cible.limite_annonces != null && (
            <div style={{ background: '#eee', borderRadius: 6, height: 8, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((etat.utilise ?? 0) / cible.limite_annonces) * 100)}%`, height: '100%', background: (etat.utilise ?? 0) >= cible.limite_annonces ? '#ef4444' : accent }} />
            </div>
          )}
          <div style={{ fontSize: 13, color: '#666', marginTop: 10 }}>{cible.addons.length ? cible.addons.map(nomAddon).join(' · ') : 'Aucune fonctionnalité supplémentaire'}</div>
        </div>
      )}

      <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{cible ? 'Changer de plan' : 'Plans offerts'}</h3>
      {plans.filter((p) => !cible || p.id !== cible.id).length === 0 && <div style={{ color: '#999', fontSize: 14 }}>Aucun autre plan n'est offert pour l'instant.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
        {plans.filter((p) => !cible || p.id !== cible.id).map((p) => (
          <div key={p.id} style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28 }}>{p.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{p.nom}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, margin: '4px 0' }}>{p.prix_mensuel > 0 ? `${$$(p.prix_mensuel)}/mois` : 'Gratuit'}</div>
            {p.description && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{p.description}</div>}
            <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, color: '#444', flex: 1 }}>
              <li>{p.limite_annonces == null ? 'Annonces illimitées' : `${p.limite_annonces} annonces`}</li>
              <li>Commission : {commission(p)}{p.commission_max != null ? ` (max ${$$(p.commission_max)})` : ''}</li>
              {p.addons.map((c) => <li key={c}>{nomAddon(c)}</li>)}
            </ul>
            {p.prix_mensuel > 0 && !etat.paiement_en_ligne
              ? <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: 8 }}>Plan payant : l'abonnement en ligne arrive bientôt. Contactez le gestionnaire pour l'obtenir.</div>
              : <button disabled={occupe !== null} onClick={() => choisir(p)} style={{ padding: '10px', border: 'none', borderRadius: 8, background: accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: occupe !== null ? 0.6 : 1 }}>
                  {occupe === p.id ? '…' : 'Choisir ce plan'}
                </button>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborateurMonPlan;