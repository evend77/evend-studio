// src/pages/gestionnaire/MesAbonnementsEcole.tsx
// e-Vend Studio — Mes abonnements (École/Cours)
// Page à 2 onglets :
//   1) Mes forfaits — créer/modifier/désactiver les forfaits récurrents
//   2) Mes abonnés  — liste des clients abonnés, annulation
// Même palette sombre que MesReservationsEcole.tsx / PageChoisirTemplate.tsx.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// ─── Palette sombre — identique aux autres pages du dashboard ──────────────
const C = {
  bg: '#0d0d12',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBgHover: 'rgba(255,255,255,0.05)',
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
};

interface Props { gestionnaireId: number; }

interface Formation {
  id: number;
  titre: string;
  description: string | null;
  prix_hebdomadaire: number | null;
  prix_mensuel: number | null;
  prix_annuel: number | null;
  actif: boolean;
}

interface Abonne {
  id: number;
  formation_id: number;
  formation_titre: string;
  numero_membre: number;
  nom_client: string;
  email_client: string;
  telephone: string | null;
  frequence: 'hebdomadaire' | 'mensuel' | 'annuel' | string;
  montant: number;
  devise: string;
  statut: 'en_attente_paiement' | 'actif' | 'annule' | 'impaye' | string;
  date_debut: string | null;
  prochaine_facturation: string | null;
  annule_le: string | null;
  created_at: string;
}

const Inp = (props: any) => (
  <input {...props}
    style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box', fontFamily: 'inherit', ...(props.style || {}) }} />
);
const Lbl = ({ children }: any) => (
  <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{children}</label>
);
const Champ = ({ label, children }: any) => (
  <div style={{ marginBottom: 14 }}>
    <Lbl>{label}</Lbl>
    {children}
  </div>
);

const FORM_VIDE = { titre: '', description: '', prix_hebdomadaire: '', prix_mensuel: '', prix_annuel: '' };

const LABEL_FREQUENCE: Record<string, string> = { hebdomadaire: '/ semaine', mensuel: '/ mois', annuel: '/ an' };

export default function MesAbonnementsEcole({ gestionnaireId }: Props) {
  const isMobile = useIsMobile();
  const [onglet, setOnglet] = useState<'forfaits' | 'abonnes'>('forfaits');
  const [chargement, setChargement] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmation, setConfirmation] = useState<{ titre: string; message: string; texteBouton: string; onConfirmer: () => void } | null>(null);

  const [formations, setFormations] = useState<Formation[]>([]);
  const [abonnes, setAbonnes] = useState<Abonne[]>([]);

  // ── Toggle "Activer les abonnements" ───────────────────────────────────────
  const [abonnementActif, setAbonnementActifState] = useState(false);
  const [sauvOption, setSauvOption] = useState(false);

  // ── Formulaire création/édition de forfait ─────────────────────────────────
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [formationEnEdition, setFormationEnEdition] = useState<Formation | null>(null);
  const [formulaire, setFormulaire] = useState(FORM_VIDE);
  const [creation, setCreation] = useState(false);
  const [erreurForm, setErreurForm] = useState('');

  const token = () => localStorage.getItem('token');

  const afficherToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setChargement(true);
    try {
      const [fRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/abonnements/mes-formations`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_BASE}/abonnements/abonnes`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const fData = await fRes.json();
      const aData = await aRes.json();
      setFormations(fData.formations || []);
      setAbonnes(aData.abonnes || []);
    } catch {
      afficherToast('Erreur de chargement.', 'err');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, [gestionnaireId]);

  useEffect(() => {
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`)
      .then(r => r.ok ? r.json() : Promise.resolve({} as Record<string, any>))
      .then(data => setAbonnementActifState(!!data?.abonnement_ecole))
      .catch(() => {});
  }, [gestionnaireId]);

  const sauvegarderOption = async (valeur: boolean) => {
    setSauvOption(true);
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ abonnement_ecole: valeur }),
      });
      if (!res.ok) throw new Error();
      setAbonnementActifState(valeur);
      afficherToast(valeur ? 'Option activée.' : 'Option désactivée.', 'ok');
    } catch {
      afficherToast('Erreur lors de la sauvegarde de l\'option.', 'err');
    }
    setSauvOption(false);
  };

  // ── Formulaire forfait ───────────────────────────────────────────────────
  const ouvrirCreation = () => {
    setFormationEnEdition(null);
    setFormulaire(FORM_VIDE);
    setErreurForm('');
    setAjoutOuvert(true);
  };
  const ouvrirEdition = (f: Formation) => {
    setFormationEnEdition(f);
    setFormulaire({
      titre: f.titre || '',
      description: f.description || '',
      prix_hebdomadaire: f.prix_hebdomadaire != null ? String(f.prix_hebdomadaire) : '',
      prix_mensuel: f.prix_mensuel != null ? String(f.prix_mensuel) : '',
      prix_annuel: f.prix_annuel != null ? String(f.prix_annuel) : '',
    });
    setErreurForm('');
    setAjoutOuvert(true);
  };
  const fermerFormulaire = () => {
    setAjoutOuvert(false);
    setFormationEnEdition(null);
    setFormulaire(FORM_VIDE);
    setErreurForm('');
  };

  const soumettreFormulaire = async () => {
    setErreurForm('');
    if (!formulaire.titre.trim()) { setErreurForm('Le titre est requis.'); return; }
    if (!formulaire.prix_hebdomadaire && !formulaire.prix_mensuel && !formulaire.prix_annuel) {
      setErreurForm('Au moins un prix (hebdomadaire, mensuel ou annuel) est requis.');
      return;
    }
    setCreation(true);
    const enEdition = !!formationEnEdition;
    try {
      const url = enEdition ? `${API_BASE}/abonnements/formations/${formationEnEdition!.id}` : `${API_BASE}/abonnements/formations`;
      const res = await fetch(url, {
        method: enEdition ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          titre: formulaire.titre,
          description: formulaire.description || null,
          prix_hebdomadaire: formulaire.prix_hebdomadaire ? parseFloat(formulaire.prix_hebdomadaire) : null,
          prix_mensuel: formulaire.prix_mensuel ? parseFloat(formulaire.prix_mensuel) : null,
          prix_annuel: formulaire.prix_annuel ? parseFloat(formulaire.prix_annuel) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErreurForm(data.message || 'Erreur.'); setCreation(false); return; }
      fermerFormulaire();
      charger();
      afficherToast(enEdition ? 'Forfait modifié.' : 'Forfait créé.', 'ok');
    } catch {
      setErreurForm('Erreur de connexion.');
    }
    setCreation(false);
  };

  const toggleActifFormation = async (f: Formation) => {
    setFormations(prev => prev.map(x => x.id === f.id ? { ...x, actif: !x.actif } : x));
    try {
      await fetch(`${API_BASE}/abonnements/formations/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actif: !f.actif }),
      });
    } catch {
      charger();
    }
  };

  const supprimerFormation = (f: Formation) => {
    setConfirmation({
      titre: 'Supprimer ce forfait?',
      message: `« ${f.titre} » sera supprimé définitivement. Les clients déjà abonnés ne seront pas affectés, mais plus personne ne pourra s'y inscrire. Cette action est irréversible.`,
      texteBouton: '🗑️ Supprimer',
      onConfirmer: async () => {
        setConfirmation(null);
        try {
          await fetch(`${API_BASE}/abonnements/formations/${f.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
          setFormations(prev => prev.filter(x => x.id !== f.id));
          afficherToast('Forfait supprimé.', 'ok');
        } catch {
          afficherToast('Erreur lors de la suppression.', 'err');
        }
      },
    });
  };

  // ── Annulation d'un abonnement client ────────────────────────────────────
  const annulerAbonnement = (a: Abonne) => {
    setConfirmation({
      titre: 'Annuler cet abonnement?',
      message: `L'abonnement de ${a.nom_client} sera annulé. La période déjà payée reste active jusqu'à son terme — aucun remboursement automatique, mais aucun prélèvement futur n'aura lieu.`,
      texteBouton: '✕ Annuler l\'abonnement',
      onConfirmer: async () => {
        setConfirmation(null);
        try {
          const res = await fetch(`${API_BASE}/abonnements/${a.id}/annuler`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
          if (!res.ok) throw new Error();
          setAbonnes(prev => prev.map(x => x.id === a.id ? { ...x, statut: 'annule' } : x));
          afficherToast('Abonnement annulé.', 'ok');
        } catch {
          afficherToast('Erreur lors de l\'annulation.', 'err');
        }
      },
    });
  };

  // ── Stats du header ──────────────────────────────────────────────────────
  const abonnesActifs = abonnes.filter(a => a.statut === 'actif');
  const forfaitsActifs = formations.filter(f => f.actif).length;
  const mrr = abonnesActifs.reduce((s, a) => {
    if (a.frequence === 'mensuel') return s + Number(a.montant);
    if (a.frequence === 'hebdomadaire') return s + Number(a.montant) * 4.33;
    if (a.frequence === 'annuel') return s + Number(a.montant) / 12;
    return s;
  }, 0);

  const ONGLETS: { id: typeof onglet; label: string }[] = [
    { id: 'forfaits', label: `📦 Mes forfaits${formations.length ? ` (${formations.length})` : ''}` },
    { id: 'abonnes', label: `👥 Mes abonnés${abonnesActifs.length ? ` (${abonnesActifs.length})` : ''}` },
  ];

  const BADGE_STATUT: Record<string, { label: string; bg: string; color: string }> = {
    actif:               { label: '🟢 Actif',    bg: C.greenLight, color: C.green },
    en_attente_paiement: { label: '🟡 En attente', bg: 'rgba(245,158,11,0.15)', color: C.amber },
    annule:              { label: '⚪ Annulé',    bg: 'rgba(255,255,255,0.06)', color: C.textDim },
    impaye:              { label: '🔴 Impayé',    bg: C.redLight, color: C.red },
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 96px)', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        .mae-card { transition: all 0.2s ease; }
        .mae-card:hover { background: ${C.cardBgHover} !important; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 14px' : '40px 32px' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.type === 'ok' ? C.green : C.red, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast.msg}
          </div>
        )}

        {/* Modal de confirmation générique */}
        {confirmation && (
          <div onClick={() => setConfirmation(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#16161c', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 420, width: '100%', padding: '26px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>{confirmation.titre}</p>
              <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 22px', lineHeight: 1.5 }}>{confirmation.message}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmation(null)}
                  style={{ flex: 1, padding: 11, border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'transparent', color: C.textLight, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={confirmation.onConfirmer}
                  style={{ flex: 1, padding: 11, border: 'none', borderRadius: 10, background: C.red, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {confirmation.texteBouton}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header dégradé ─────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: isMobile ? 16 : 24, marginBottom: 20, padding: isMobile ? 20 : 32,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: 12 }}>
              <span style={{ fontSize: isMobile ? 28 : 40 }}>💳</span>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                Mes abonnements
              </h1>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: isMobile ? 13 : 16, color: 'rgba(255,255,255,0.85)', maxWidth: 560 }}>
              Gérez vos forfaits récurrents et vos abonnés — créez des formules hebdomadaires, mensuelles ou annuelles.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 24 : 40, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{forfaitsActifs}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Forfaits actifs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{abonnesActifs.length}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Abonnés actifs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{mrr.toFixed(0)} $</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Revenu récurrent / mois (est.)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Encadré — activation des abonnements (visible peu importe l'onglet) */}
        <div style={{ background: 'rgba(168,85,247,0.08)', border: `1.5px solid #a855f750`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#c084fc', margin: '0 0 4px' }}>⚙️ Option d'affichage sur votre site</p>
          <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 16px' }}>Sans cette option, aucun forfait n'apparaît sur votre site et personne ne peut s'abonner.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Activer les abonnements en ligne</p>
              <p style={{ fontSize: 11, color: C.textDim, margin: '2px 0 0' }}>Affiche vos forfaits sur votre site avec un bouton d'inscription.</p>
            </div>
            <div onClick={() => !sauvOption && sauvegarderOption(!abonnementActif)}
              style={{ width: 44, height: 24, borderRadius: 12, background: abonnementActif ? '#a855f7' : '#3a3a42', cursor: sauvOption ? 'wait' : 'pointer', position: 'relative', flexShrink: 0, opacity: sauvOption ? 0.6 : 1 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: abonnementActif ? 23 : 3, transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>

        {/* Onglets — dropdown compact sur mobile, boutons sur desktop */}
        {isMobile ? (
          <select value={onglet} onChange={e => setOnglet(e.target.value as typeof onglet)}
            style={{ width: '100%', marginBottom: 18, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.inputBg, color: '#c084fc', fontSize: 14, fontWeight: 700, appearance: 'none' as any, WebkitAppearance: 'none' as any }}>
            {ONGLETS.map(o => <option key={o.id} value={o.id} style={{ color: '#000' }}>{o.label}</option>)}
          </select>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                style={{
                  padding: '10px 18px', borderRadius: '10px 10px 0 0', border: 'none', borderBottom: `2px solid ${onglet === o.id ? '#a855f7' : 'transparent'}`,
                  background: onglet === o.id ? 'rgba(168,85,247,0.1)' : 'transparent', color: onglet === o.id ? '#c084fc' : C.textLight,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                }}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ONGLET : MES FORFAITS ─────────────────────────────────────────── */}
        {onglet === 'forfaits' && (
          <div>
            {/* Formulaire création / édition */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
              {!ajoutOuvert ? (
                <button onClick={ouvrirCreation}
                  style={{ width: '100%', padding: 12, border: `2px dashed #a855f7`, borderRadius: 10, background: 'transparent', color: '#c084fc', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  + Créer un forfait
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, marginBottom: 14 }}>
                    {formationEnEdition ? `Modifier « ${formationEnEdition.titre} »` : 'Nouveau forfait'}
                  </p>
                  {erreurForm && (
                    <div style={{ background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: C.red }}>
                      ⚠️ {erreurForm}
                    </div>
                  )}
                  <Champ label="Titre (ex: Cours illimités, Abonnement Débutant...)">
                    <Inp value={formulaire.titre} onChange={(e: any) => setFormulaire(p => ({ ...p, titre: e.target.value }))} placeholder="Abonnement illimité" />
                  </Champ>
                  <Champ label="Description (optionnel)">
                    <Inp value={formulaire.description} onChange={(e: any) => setFormulaire(p => ({ ...p, description: e.target.value }))} placeholder="Accès à tous les cours, réservation prioritaire..." />
                  </Champ>

                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, margin: '16px 0 10px' }}>
                    Prix — au moins un des trois
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 14 }}>
                    <Champ label="Hebdomadaire ($)">
                      <Inp type="number" min="0" step="0.01" value={formulaire.prix_hebdomadaire} onChange={(e: any) => setFormulaire(p => ({ ...p, prix_hebdomadaire: e.target.value }))} placeholder="15.00" />
                    </Champ>
                    <Champ label="Mensuel ($)">
                      <Inp type="number" min="0" step="0.01" value={formulaire.prix_mensuel} onChange={(e: any) => setFormulaire(p => ({ ...p, prix_mensuel: e.target.value }))} placeholder="49.00" />
                    </Champ>
                    <Champ label="Annuel ($)">
                      <Inp type="number" min="0" step="0.01" value={formulaire.prix_annuel} onChange={(e: any) => setFormulaire(p => ({ ...p, prix_annuel: e.target.value }))} placeholder="499.00" />
                    </Champ>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={soumettreFormulaire} disabled={creation}
                      style={{ flex: 1, padding: 11, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: creation ? 'wait' : 'pointer' }}>
                      {creation ? '⏳...' : formationEnEdition ? '✅ Enregistrer les modifications' : '✅ Créer le forfait'}
                    </button>
                    <button onClick={fermerFormulaire}
                      style={{ padding: '11px 18px', border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'transparent', color: C.textLight, fontSize: 13, cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des forfaits */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, marginBottom: 14 }}>
                {formations.length} forfait{formations.length > 1 ? 's' : ''}
              </p>

              {chargement ? (
                <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: 20 }}>Chargement...</p>
              ) : formations.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: 20 }}>Aucun forfait créé pour l'instant.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formations.map(f => (
                    <div key={f.id} className="mae-card" style={{ border: `1.5px solid ${f.actif ? C.border : 'rgba(255,255,255,0.04)'}`, borderRadius: 10, padding: '14px 16px', opacity: f.actif ? 1 : 0.55 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{f.titre}</p>
                          {f.description && <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 6px' }}>{f.description}</p>}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {f.prix_hebdomadaire != null && <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>{Number(f.prix_hebdomadaire).toFixed(2)}$ / sem</span>}
                            {f.prix_mensuel != null && <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>{Number(f.prix_mensuel).toFixed(2)}$ / mois</span>}
                            {f.prix_annuel != null && <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>{Number(f.prix_annuel).toFixed(2)}$ / an</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <div onClick={() => toggleActifFormation(f)}
                            style={{ width: 36, height: 20, borderRadius: 10, background: f.actif ? '#a855f7' : '#3a3a42', cursor: 'pointer', position: 'relative' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: f.actif ? 18 : 2, transition: 'left 0.2s' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => ouvrirEdition(f)}
                              style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                              ✏️ Modifier
                            </button>
                            <button onClick={() => supprimerFormation(f)}
                              style={{ background: 'none', border: 'none', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ONGLET : MES ABONNÉS ──────────────────────────────────────────── */}
        {onglet === 'abonnes' && (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
            {chargement ? (
              <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: 40 }}>Chargement des abonnés...</p>
            ) : abonnes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                <p style={{ fontSize: 13, color: C.textLight }}>Aucun abonné pour l'instant.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: isMobile ? 720 : 'auto' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Membre', 'Client', 'Forfait', 'Montant', 'Statut', 'Prochaine facturation', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {abonnes.map(a => {
                      const badge = BADGE_STATUT[a.statut] || { label: a.statut, bg: 'rgba(255,255,255,0.06)', color: C.textDim };
                      return (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px', color: C.textLight, fontWeight: 700, whiteSpace: 'nowrap' }}>#{String(a.numero_membre).padStart(4, '0')}</td>
                          <td style={{ padding: '12px', color: C.text }}>
                            <p style={{ margin: 0, fontWeight: 700 }}>{a.nom_client}</p>
                            <p style={{ margin: 0, fontSize: 11, color: C.textDim }}>{a.email_client}</p>
                          </td>
                          <td style={{ padding: '12px', color: C.textLight }}>{a.formation_titre}</td>
                          <td style={{ padding: '12px', color: C.text, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {Number(a.montant).toFixed(2)} {(a.devise || 'CAD').toUpperCase()} <span style={{ color: C.textDim, fontWeight: 400 }}>{LABEL_FREQUENCE[a.frequence] || ''}</span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{badge.label}</span>
                          </td>
                          <td style={{ padding: '12px', color: C.textLight, whiteSpace: 'nowrap' }}>
                            {a.statut === 'actif' && a.prochaine_facturation ? new Date(a.prochaine_facturation).toLocaleDateString('fr-CA', { dateStyle: 'medium' }) : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {a.statut === 'actif' && (
                              <button onClick={() => annulerAbonnement(a)}
                                style={{ background: C.redLight, color: C.red, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                ✕ Annuler
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}