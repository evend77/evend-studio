// CHEMIN : src/pages/gestionnaire/BoutiquePlan.tsx
// e-Vend Studio — « Mon plan & limites » des templates boutique (solo : Premium, Simplisse, Mode, Beauté…).
// Les paliers viennent de l'admin (page « Prix Template »). Un seul écran pour tous les templates solo.
// API : GET/PUT /api/boutique/gestionnaire/plan

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Palier { label: string; limite: number; prix: string; plan_id: string; }
interface EtatPlan { template_id: string; plan: string; limite: number | null; nb_actifs: number; palier_actuel: string | null; paliers: Palier[]; }

interface Props {
  gestionnaireId: number;
  accent?: string;
  naviguerVers?: (page: string) => void;
}

const COULEURS = ['#c9a96e', '#a78bfa', '#f472b6', '#fb923c', '#ef4444', '#14b8a6', '#3b82f6'];

function prixAffiche(prix: string): string {
  const p = (prix || '').trim();
  if (!p) return '—';
  return /[$€]/.test(p) ? p : `${p} $`;
}

export default function BoutiquePlan({ accent, naviguerVers }: Props) {
  const couleurBase = accent || '#c9a96e';
  const [etat, setEtat] = useState<EtatPlan | null>(null);
  const [chargement, setChargement] = useState(true);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const charger = async () => {
    const r = await bq('/plan');
    if (r.ok) setEtat(r.data as EtatPlan); else setErreur(messageErreur(r));
    setChargement(false);
  };
  useEffect(() => { charger(); }, []);

  if (chargement) return <div style={{ padding: 60, textAlign: 'center', color: '#888', fontFamily: "'Inter', sans-serif" }}>⏳ Chargement de votre plan…</div>;
  if (!etat) return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{erreur || 'Plan introuvable'}</div>;

  if (!etat.paliers.length) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📊</div>
        <h2 style={{ margin: '0 0 8px', color: '#1a1a1a' }}>Mon plan & limites</h2>
        <p style={{ color: '#666', lineHeight: 1.6 }}>Votre template actuel n'a pas de limite d'annonces. Vous avez {etat.nb_actifs} annonce{etat.nb_actifs > 1 ? 's' : ''} active{etat.nb_actifs > 1 ? 's' : ''}.</p>
      </div>
    );
  }

  const limite = etat.limite || 0;
  const actuel = etat.paliers.find(p => p.limite === etat.limite) || etat.paliers[0];
  const indexActuel = etat.paliers.indexOf(actuel);
  const choix = etat.paliers.find(p => p.limite === choisi) || null;
  const aChange = !!choix && choix.limite !== actuel.limite;
  const pct = limite > 0 ? Math.min(100, Math.round((etat.nb_actifs / limite) * 100)) : 0;
  const couleurBarre = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  const reste = Math.max(0, limite - etat.nb_actifs);
  const couleurDe = (i: number) => COULEURS[i % COULEURS.length];

  const sauvegarder = async () => {
    if (!choix) return;
    setEnCours(true);
    const r = await bq('/plan', { method: 'PUT', body: { limite: choix.limite } });
    setEnCours(false);
    setConfirmer(false);
    if (r.ok) {
      setSucces(`Votre palier est maintenant « ${choix.label} » (${choix.limite} annonces actives).`);
      setChoisi(null);
      await charger();
    } else {
      setErreur(messageErreur(r));
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: couleurBase, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Mon plan & limites</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Seules vos annonces actives comptent dans la limite.</p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Palier actuel</p>
            <span style={{ fontSize: 18, fontWeight: 800, color: couleurDe(indexActuel) }}>{actuel.label || `${actuel.limite} annonces`}</span>
            <span style={{ marginLeft: 10, fontSize: 12, background: '#f3f4f6', color: '#374151', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{prixAffiche(actuel.prix)}/mois</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#888', margin: '0 0 4px' }}>Annonces actives</p>
            <span style={{ fontSize: 22, fontWeight: 800, color: pct >= 90 ? '#ef4444' : '#1a1a1a' }}>{etat.nb_actifs}</span>
            <span style={{ fontSize: 14, color: '#888' }}> / {limite}</span>
          </div>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: couleurBarre, borderRadius: 8, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#888' }}>{pct}% utilisé</span>
          <span style={{ fontSize: 11, color: reste <= 5 ? '#ef4444' : '#888', fontWeight: reste <= 5 ? 700 : 400 }}>{reste} emplacement{reste > 1 ? 's' : ''} restant{reste > 1 ? 's' : ''}</span>
        </div>
        {pct >= 90 && (
          <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', fontWeight: 500 }}>
            ⚠️ Vous approchez de votre limite. Passez au palier supérieur pour continuer à publier des annonces.
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>Choisir un palier</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {etat.paliers.map((p, i) => {
          const estActuel = p.limite === actuel.limite;
          const estChoisi = choisi === p.limite;
          const impossible = etat.nb_actifs > p.limite;
          const c = couleurDe(i);
          return (
            <div key={p.plan_id} onClick={() => { if (!impossible && !estActuel) setChoisi(p.limite); }}
              style={{ border: `2px solid ${estChoisi || estActuel ? c : '#e5e7eb'}`, borderRadius: 10, padding: '16px 14px', cursor: impossible || estActuel ? 'default' : 'pointer', background: estChoisi ? `${c}12` : '#fafafa', opacity: impossible ? 0.5 : 1, position: 'relative' }}>
              {estActuel && <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: c, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: '0 0 6px 6px', whiteSpace: 'nowrap' }}>PALIER ACTUEL</div>}
              <div style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, marginTop: estActuel ? 10 : 0 }}>{p.label || `Palier ${i + 1}`}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>{prixAffiche(p.prix)}<span style={{ fontSize: 10, fontWeight: 500, color: '#888' }}>/mois</span></div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c }}>{p.limite} annonces actives</div>
              {impossible && <div style={{ marginTop: 8, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>⚠️ Vous avez {etat.nb_actifs} annonces actives : désactivez-en d'abord.</div>}
            </div>
          );
        })}
      </div>

      <button onClick={() => aChange && setConfirmer(true)} disabled={!aChange || enCours}
        style={{ width: '100%', padding: 13, background: aChange ? couleurDe(etat.paliers.indexOf(choix!)) : '#e5e7eb', color: aChange ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: aChange ? 'pointer' : 'not-allowed' }}>
        {aChange && choix ? `Passer à ${choix.label || choix.limite + ' annonces'} — ${prixAffiche(choix.prix)}/mois →` : 'Sélectionnez un palier différent'}
      </button>
      <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 }}>Pour changer de template, rendez-vous dans « Choisir un template » : votre palier est ajusté automatiquement.</p>
      {naviguerVers && <div style={{ textAlign: 'center', marginTop: 4 }}><button onClick={() => naviguerVers('annonces-liste')} style={{ background: 'none', border: 'none', color: couleurBase, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Voir mes annonces →</button></div>}

      {confirmer && choix && (
        <BoutiqueModale type="confirmer" accent={couleurBase} enCours={enCours} titre="Changer de palier ?"
          message={`Vous passez à « ${choix.label || choix.limite + ' annonces'} » (${choix.limite} annonces actives, ${prixAffiche(choix.prix)}/mois).`}
          texteConfirmer="Confirmer" onConfirmer={sauvegarder} onFermer={() => { if (!enCours) setConfirmer(false); }} />
      )}
      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {succes && <BoutiqueModale type="succes" accent={couleurBase} message={succes} onFermer={() => setSucces('')} />}
    </div>
  );
}