// src/pages/gestionnaire/MesReservationsEcole.tsx
// e-Vend Studio — Mes réservations (École/Cours)
// Page unique à 3 onglets :
//   1) À venir  — agenda des créneaux futurs + inscrits (annulation)
//   2) Passé    — cours déjà terminés (consultation seulement)
//   3) Créer des créneaux — ex-page ConfigReservationEcole.tsx, fusionnée ici,
//      avec en plus la modification d'un créneau existant (pas juste actif/supprimer).
// Même palette sombre que PageChoisirTemplate.tsx.

import { useState, useEffect, useMemo } from 'react';

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

// ─── Palette sombre — identique à PageChoisirTemplate.tsx ──────────────────
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

interface Disponibilite {
  id: number;
  titre: string | null;
  date_debut: string;
  date_fin: string;
  capacite_max: number;
  actif: boolean;
  places_reservees: number;
  places_restantes: number;
  salle?: string | null;
  professeur?: string | null;
  niveau?: string | null;
  notes_internes?: string | null;
  style?: string | null;
  prix?: string | null;
}

interface Reservation {
  id: number;
  nom_client: string;
  email_client: string | null;
  telephone: string | null;
  date_debut: string;
  date_fin: string;
  nb_personnes: number;
  notes: string | null;
  statut: string;
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

const FORM_VIDE = { titre: '', date_debut: '', date_fin: '', capacite_max: '', salle: '', professeur: '', niveau: '', notes_internes: '', style: '', prix: '' };

export default function MesReservationsEcole({ gestionnaireId }: Props) {
  const isMobile = useIsMobile();
  const [dispos, setDispos] = useState<Disponibilite[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [erreur, setErreur] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [onglet, setOnglet] = useState<'a-venir' | 'passe' | 'creer'>('a-venir');

  // ── État du formulaire de création/édition (onglet "Créer des créneaux") ──
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [creneauEnEdition, setCreneauEnEdition] = useState<Disponibilite | null>(null);
  const [formulaire, setFormulaire] = useState(FORM_VIDE);
  const [creation, setCreation] = useState(false);
  const [erreurForm, setErreurForm] = useState('');
  const [confirmation, setConfirmation] = useState<{ titre: string; message: string; texteBouton: string; onConfirmer: () => void } | null>(null);

  const token = () => localStorage.getItem('token');

  const afficherToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setChargement(true);
    try {
      const [dRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/reservations/mes-disponibilites`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_BASE}/reservations/gestionnaire`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const dData = await dRes.json();
      const rData = await rRes.json();
      setDispos(dData.disponibilites || []);
      setReservations(rData.reservations || []);
    } catch {
      afficherToast('Erreur de chargement.', 'err');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, [gestionnaireId]);

  // Regroupe les réservations par créneau (même date_debut exacte)
  const reservationsParCreneau = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const r of reservations) {
      if (r.statut === 'annulee') continue;
      const cle = r.date_debut;
      if (!map[cle]) map[cle] = [];
      map[cle].push(r);
    }
    return map;
  }, [reservations]);

  const disposAvenir = useMemo(() => {
    const maintenant = Date.now();
    return dispos
      .filter(d => new Date(d.date_fin).getTime() >= maintenant)
      .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime());
  }, [dispos]);

  const disposPassees = useMemo(() => {
    const maintenant = Date.now();
    return dispos
      .filter(d => new Date(d.date_fin).getTime() < maintenant)
      .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());
  }, [dispos]);

  const annuler = (id: number, nomClient: string) => {
    setConfirmation({
      titre: 'Désinscrire ce client?',
      message: `${nomClient} sera retiré de ce créneau et une place se libérera. Cette action ne peut pas être annulée depuis cette page.`,
      texteBouton: '✕ Désinscrire',
      onConfirmer: async () => {
        setConfirmation(null);
        try {
          const res = await fetch(`${API_BASE}/reservations/${id}/statut`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ statut: 'annulee' }),
          });
          if (!res.ok) throw new Error();
          setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: 'annulee' } : r));
          charger(); // recharger pour remettre à jour les places restantes
          afficherToast('Client désinscrit — la place est de nouveau disponible.', 'ok');
        } catch {
          afficherToast('Erreur lors de la désinscription.', 'err');
        }
      },
    });
  };

  const toggleActif = async (d: Disponibilite) => {
    setDispos(prev => prev.map(x => x.id === d.id ? { ...x, actif: !x.actif } : x));
    try {
      await fetch(`${API_BASE}/reservations/disponibilites/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actif: !d.actif }),
      });
    } catch {
      charger(); // en cas d'échec, on recharge le vrai état
    }
  };

  const supprimer = (id: number, titre: string) => {
    setConfirmation({
      titre: 'Supprimer ce créneau?',
      message: `« ${titre || 'Ce créneau'} » sera supprimé définitivement. Cette action est irréversible.`,
      texteBouton: '🗑️ Supprimer',
      onConfirmer: async () => {
        setConfirmation(null);
        try {
          await fetch(`${API_BASE}/reservations/disponibilites/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token()}` },
          });
          setDispos(prev => prev.filter(d => d.id !== id));
          afficherToast('Créneau supprimé.', 'ok');
        } catch {
          afficherToast('Erreur lors de la suppression.', 'err');
        }
      },
    });
  };

  // ── Ouvrir le formulaire pour créer (vide) ou modifier (pré-rempli) ───────
  const ouvrirCreation = () => {
    setCreneauEnEdition(null);
    setFormulaire(FORM_VIDE);
    setErreurForm('');
    setAjoutOuvert(true);
  };
  const ouvrirEdition = (d: Disponibilite) => {
    setCreneauEnEdition(d);
    setFormulaire({
      titre: d.titre || '',
      date_debut: d.date_debut?.slice(0, 16) || '',
      date_fin: d.date_fin?.slice(0, 16) || '',
      capacite_max: String(d.capacite_max ?? ''),
      salle: d.salle || '',
      professeur: d.professeur || '',
      niveau: d.niveau || '',
      notes_internes: d.notes_internes || '',
      style: d.style || '',
      prix: d.prix || '',
    });
    setErreurForm('');
    setAjoutOuvert(true);
  };
  const fermerFormulaire = () => {
    setAjoutOuvert(false);
    setCreneauEnEdition(null);
    setFormulaire(FORM_VIDE);
    setErreurForm('');
  };

  const soumettreFormulaire = async () => {
    setErreurForm('');
    if (!formulaire.titre || !formulaire.date_debut || !formulaire.date_fin || !formulaire.capacite_max) {
      setErreurForm('Tous les champs sont requis.');
      return;
    }
    setCreation(true);
    const enEdition = !!creneauEnEdition;
    try {
      const url = enEdition ? `${API_BASE}/reservations/disponibilites/${creneauEnEdition!.id}` : `${API_BASE}/reservations/disponibilites`;
      const res = await fetch(url, {
        method: enEdition ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          titre: formulaire.titre,
          date_debut: formulaire.date_debut,
          date_fin: formulaire.date_fin,
          capacite_max: parseInt(formulaire.capacite_max, 10),
          salle: formulaire.salle || null,
          professeur: formulaire.professeur || null,
          niveau: formulaire.niveau || null,
          notes_internes: formulaire.notes_internes || null,
          style: formulaire.style || null,
          prix: formulaire.prix || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErreurForm(data.message || 'Erreur.'); setCreation(false); return; }
      fermerFormulaire();
      charger();
      afficherToast(enEdition ? 'Créneau modifié.' : 'Créneau créé.', 'ok');
    } catch {
      setErreurForm('Erreur de connexion.');
    }
    setCreation(false);
  };

  // ── Stats du header ──────────────────────────────────────────────────────
  const creneauxActifs = dispos.filter(d => d.actif).length;
  const totalReservationsActives = reservations.filter(r => r.statut !== 'annulee').length;
  const totalPlaces = dispos.reduce((s, d) => s + d.capacite_max, 0);
  const totalOccupees = dispos.reduce((s, d) => s + d.places_reservees, 0);

  const ONGLETS: { id: typeof onglet; label: string }[] = [
    { id: 'a-venir', label: `📆 À venir${disposAvenir.length ? ` (${disposAvenir.length})` : ''}` },
    { id: 'passe', label: '📁 Passé' },
    { id: 'creer', label: '➕ Créer des créneaux' },
  ];

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 96px)', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .mre-card { transition: all 0.2s ease; }
        .mre-card:hover { background: ${C.cardBgHover} !important; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 14px' : '40px 32px' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.type === 'ok' ? C.green : C.red, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast.msg}
          </div>
        )}

        {/* Modal de confirmation générique (désinscription / suppression) */}
        {confirmation && (
          <div onClick={() => setConfirmation(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#16161c', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 400, width: '100%', padding: '26px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
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

        {/* Modal création manuelle (réservation téléphone) */}
        {modalOuvert && (
          <ModalCreationManuelle
            dispos={dispos.filter(d => d.actif && d.places_restantes > 0)}
            onFermer={() => setModalOuvert(false)}
            onCree={() => { setModalOuvert(false); charger(); afficherToast('Réservation créée!', 'ok'); }}
            onErreur={(m) => afficherToast(m, 'err')}
            token={token()}
            isMobile={isMobile}
          />
        )}

        {/* ── Header dégradé ─────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          borderRadius: isMobile ? 16 : 24, marginBottom: 20, padding: isMobile ? 20 : 32,
          position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: 12 }}>
                  <span style={{ fontSize: isMobile ? 28 : 40 }}>📅</span>
                  <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                    Mes réservations
                  </h1>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: isMobile ? 13 : 16, color: 'rgba(255,255,255,0.8)', maxWidth: 560 }}>
                  Gérez vos créneaux de cours et vos inscriptions — annulez une place, ou ajoutez une réservation pour un client au téléphone.
                </p>
              </div>
              <button onClick={() => setModalOuvert(true)}
                style={{ width: isMobile ? '100%' : undefined, padding: '13px 24px', background: '#fff', color: '#c2410c', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                📞 Réservation par téléphone
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 24 : 40, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{creneauxActifs}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Créneaux actifs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{totalReservationsActives}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Réservations actives</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{totalOccupees}/{totalPlaces}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Places occupées</div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets — dropdown compact sur mobile, boutons sur desktop */}
        {isMobile ? (
          <select value={onglet} onChange={e => setOnglet(e.target.value as typeof onglet)}
            style={{ width: '100%', marginBottom: 18, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.inputBg, color: C.amber, fontSize: 14, fontWeight: 700, appearance: 'none' as any, WebkitAppearance: 'none' as any }}>
            {ONGLETS.map(o => (
              <option key={o.id} value={o.id} style={{ color: '#000' }}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                style={{
                  padding: '10px 18px', borderRadius: '10px 10px 0 0', border: 'none', borderBottom: `2px solid ${onglet === o.id ? C.amber : 'transparent'}`,
                  background: onglet === o.id ? 'rgba(245,158,11,0.1)' : 'transparent', color: onglet === o.id ? C.amber : C.textLight,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                }}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ONGLET : À VENIR / PASSÉ ─────────────────────────────────────── */}
        {(onglet === 'a-venir' || onglet === 'passe') && (
          chargement ? (
            <p style={{ color: C.textLight, textAlign: 'center', padding: 60 }}>Chargement de votre agenda...</p>
          ) : (onglet === 'a-venir' ? disposAvenir : disposPassees).length === 0 ? (
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
              <p style={{ color: C.textLight, fontSize: 14 }}>Aucun créneau {onglet === 'a-venir' ? 'à venir' : 'passé'}.</p>
              {onglet === 'a-venir' && <p style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Crée tes créneaux dans l'onglet « Créer des créneaux ».</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(onglet === 'a-venir' ? disposAvenir : disposPassees).map(d => {
                const insc = reservationsParCreneau[d.date_debut] || [];
                const complet = d.places_restantes <= 0;
                const estOuvert = ouvert === d.id;
                const passe = onglet === 'passe';
                return (
                  <div key={d.id} className="mre-card" style={{ background: C.cardBg, border: `1px solid ${estOuvert ? C.amber + '50' : C.border}`, borderRadius: 16, overflow: 'hidden', opacity: passe ? 0.75 : 1 }}>
                    <div onClick={() => setOuvert(estOuvert ? null : d.id)}
                      style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{d.titre || 'Créneau'}</p>
                          {!d.actif && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: C.textDim, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>INACTIF</span>}
                          {passe && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: C.textDim, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>TERMINÉ</span>}
                        </div>
                        <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>
                          📅 {new Date(d.date_debut).toLocaleString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          {' → '}{new Date(d.date_fin).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {(d.salle || d.professeur || d.niveau) && (
                          <p style={{ fontSize: 12, color: C.textDim, margin: '4px 0 0' }}>
                            {[d.salle && `📍 ${d.salle}`, d.professeur && `👤 ${d.professeur}`, d.niveau && `🎯 ${d.niveau}`].filter(Boolean).join('  ·  ')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: 13, fontWeight: 800,
                            color: complet ? C.red : d.places_restantes <= 3 ? C.amber : C.green,
                          }}>
                            {complet ? '🔴 Complet' : `🟢 ${d.places_restantes} libre${d.places_restantes > 1 ? 's' : ''}`}
                          </div>
                          <div style={{ fontSize: 11, color: C.textDim }}>{d.places_reservees}/{d.capacite_max} places</div>
                        </div>
                        <span style={{ color: C.textDim, fontSize: 18, transform: estOuvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, (d.places_reservees / d.capacite_max) * 100)}%`,
                        background: complet ? C.red : d.places_restantes <= 3 ? C.amber : C.green, transition: 'width 0.3s',
                      }} />
                    </div>

                    {/* Liste des inscrits */}
                    {estOuvert && (
                      <div style={{ padding: '4px 22px 18px', borderTop: `1px solid ${C.border}` }}>
                        {insc.length === 0 ? (
                          <p style={{ fontSize: 12, color: C.textDim, padding: '14px 0' }}>Aucune inscription pour ce créneau.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            {insc.map(r => (
                              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap' }}>
                                <div style={{ minWidth: 160 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{r.nom_client} {r.nb_personnes > 1 && <span style={{ color: C.textDim, fontWeight: 400 }}>({r.nb_personnes} pers.)</span>}</p>
                                  <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>
                                    {r.email_client && `✉️ ${r.email_client}`} {r.telephone && `· 📞 ${r.telephone}`}
                                  </p>
                                </div>
                                <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>
                                  Inscrit le {new Date(r.created_at).toLocaleDateString('fr-CA')}
                                </p>
                                {!passe && (
                                  <button onClick={() => annuler(r.id, r.nom_client)}
                                    style={{ background: C.redLight, color: C.red, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                    ✕ Annuler
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── ONGLET : CRÉER DES CRÉNEAUX ──────────────────────────────────── */}
        {onglet === 'creer' && (
          <div>
            {erreur && (
              <div style={{ background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.red }}>
                ⚠️ {erreur}
              </div>
            )}

            {/* Formulaire création / édition */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
              {!ajoutOuvert ? (
                <button onClick={ouvrirCreation}
                  style={{ width: '100%', padding: 12, border: `2px dashed ${C.amber}`, borderRadius: 10, background: 'transparent', color: C.amber, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  + Créer un créneau
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, marginBottom: 14 }}>
                    {creneauEnEdition ? `Modifier « ${creneauEnEdition.titre} »` : 'Nouveau créneau'}
                  </p>
                  {erreurForm && (
                    <div style={{ background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: C.red }}>
                      ⚠️ {erreurForm}
                    </div>
                  )}
                  <Champ label="Titre (ex: Cours Salsa débutant)">
                    <Inp value={formulaire.titre} onChange={(e: any) => setFormulaire(p => ({ ...p, titre: e.target.value }))} placeholder="Cours Salsa débutant" />
                  </Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <Champ label="Début">
                      <Inp type="datetime-local" value={formulaire.date_debut} onChange={(e: any) => setFormulaire(p => ({ ...p, date_debut: e.target.value }))} />
                    </Champ>
                    <Champ label="Fin">
                      <Inp type="datetime-local" value={formulaire.date_fin} onChange={(e: any) => setFormulaire(p => ({ ...p, date_fin: e.target.value }))} />
                    </Champ>
                  </div>
                  <Champ label="Capacité maximale (nombre de places)">
                    <Inp type="number" value={formulaire.capacite_max} onChange={(e: any) => setFormulaire(p => ({ ...p, capacite_max: e.target.value }))} placeholder="20" />
                  </Champ>

                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, margin: '16px 0 10px' }}>Optionnel</p>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <Champ label="Salle / Local">
                      <Inp value={formulaire.salle} onChange={(e: any) => setFormulaire(p => ({ ...p, salle: e.target.value }))} placeholder="Salle A" />
                    </Champ>
                    <Champ label="Professeur / Animateur">
                      <Inp value={formulaire.professeur} onChange={(e: any) => setFormulaire(p => ({ ...p, professeur: e.target.value }))} placeholder="Isabelle Morin" />
                    </Champ>
                  </div>
                  <Champ label="Niveau">
                    <Inp value={formulaire.niveau} onChange={(e: any) => setFormulaire(p => ({ ...p, niveau: e.target.value }))} placeholder="Débutant, Intermédiaire, Avancé..." />
                  </Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <Champ label="Style (affiché comme filtre sur votre site)">
                      <Inp value={formulaire.style} onChange={(e: any) => setFormulaire(p => ({ ...p, style: e.target.value }))} placeholder="Ballet, Hip-Hop, Salsa..." />
                    </Champ>
                    <Champ label="Prix (affiché sur votre site)">
                      <Inp value={formulaire.prix} onChange={(e: any) => setFormulaire(p => ({ ...p, prix: e.target.value }))} placeholder="25$" />
                    </Champ>
                  </div>
                  <Champ label="Notes internes (non visibles par les clients)">
                    <Inp value={formulaire.notes_internes} onChange={(e: any) => setFormulaire(p => ({ ...p, notes_internes: e.target.value }))} placeholder="Ex: apporter le matériel de sono" />
                  </Champ>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={soumettreFormulaire} disabled={creation}
                      style={{ flex: 1, padding: 11, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#f59e0b)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: creation ? 'wait' : 'pointer' }}>
                      {creation ? '⏳...' : creneauEnEdition ? '✅ Enregistrer les modifications' : '✅ Créer le créneau'}
                    </button>
                    <button onClick={fermerFormulaire}
                      style={{ padding: '11px 18px', border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'transparent', color: C.textLight, fontSize: 13, cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Liste de tous les créneaux (avec modification) */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, marginBottom: 14 }}>
                {dispos.length} créneau{dispos.length > 1 ? 'x' : ''}
              </p>

              {chargement ? (
                <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: 20 }}>Chargement...</p>
              ) : dispos.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: 20 }}>Aucun créneau créé pour l'instant.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...dispos].sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()).map(d => {
                    const complet = d.places_restantes <= 0;
                    return (
                      <div key={d.id} className="mre-card" style={{ border: `1.5px solid ${d.actif ? C.border : 'rgba(255,255,255,0.04)'}`, borderRadius: 10, padding: '14px 16px', opacity: d.actif ? 1 : 0.55 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{d.titre || '(sans titre)'}</p>
                            <p style={{ fontSize: 12, color: C.textLight, margin: 0 }}>
                              {new Date(d.date_debut).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                              {' → '}
                              {new Date(d.date_fin).toLocaleTimeString('fr-CA', { timeStyle: 'short' })}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: complet ? C.red : d.places_restantes <= 3 ? C.amber : C.green }}>
                              {complet ? '🔴 Complet' : `🟢 ${d.places_restantes} place${d.places_restantes > 1 ? 's' : ''} dispo`} sur {d.capacite_max} au total
                              <span style={{ fontWeight: 400, color: C.textDim, marginLeft: 6 }}>({d.places_reservees} réservée{d.places_reservees > 1 ? 's' : ''})</span>
                            </p>
                            {(d.salle || d.professeur || d.niveau) && (
                              <p style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                                {[d.style && `💃 ${d.style}`, d.salle && `📍 ${d.salle}`, d.professeur && `👤 ${d.professeur}`, d.niveau && `🎯 ${d.niveau}`, d.prix && `💲 ${d.prix}`].filter(Boolean).join('  ·  ')}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                            <div onClick={() => toggleActif(d)}
                              style={{ width: 36, height: 20, borderRadius: 10, background: d.actif ? C.amber : '#3a3a42', cursor: 'pointer', position: 'relative' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: d.actif ? 18 : 2, transition: 'left 0.2s' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button onClick={() => ouvrirEdition(d)}
                                style={{ background: 'none', border: 'none', color: C.amber, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                                ✏️ Modifier
                              </button>
                              <button onClick={() => supprimer(d.id, d.titre || '')}
                                style={{ background: 'none', border: 'none', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                                🗑️ Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL — Création manuelle (client au téléphone)
// ─────────────────────────────────────────────────────────────────────────

function ModalCreationManuelle({ dispos, onFermer, onCree, onErreur, token, isMobile }: {
  dispos: Disponibilite[]; onFermer: () => void; onCree: () => void; onErreur: (m: string) => void; token: string | null; isMobile: boolean;
}) {
  const [creneauId, setCreneauId] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [nbPersonnes, setNbPersonnes] = useState('1');
  const [notes, setNotes] = useState('');
  const [creation, setCreation] = useState(false);

  const creneau = dispos.find(d => String(d.id) === creneauId);

  const creer = async () => {
    if (!creneau || !nom.trim()) { onErreur('Choisissez un créneau et entrez le nom du client.'); return; }
    setCreation(true);
    try {
      const res = await fetch(`${API_BASE}/reservations/gestionnaire/creer-manuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nom_client: nom, email_client: email || null, telephone: telephone || null,
          date_debut: creneau.date_debut, date_fin: creneau.date_fin,
          nb_personnes: parseInt(nbPersonnes, 10) || 1, notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { onErreur(data.message || 'Erreur.'); setCreation(false); return; }
      onCree();
    } catch {
      onErreur('Erreur de connexion.');
      setCreation(false);
    }
  };

  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#16161c', border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', padding: '22px 26px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>📞 Réservation par téléphone</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>Pour un client qui n'a pas accès à votre site.</p>
        </div>
        <div style={{ padding: '22px 26px' }}>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Créneau *</Lbl>
            <select value={creneauId} onChange={e => setCreneauId(e.target.value)}
              style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.inputBg, color: C.text, boxSizing: 'border-box' }}>
              <option value="" style={{ color: '#000' }}>Choisir un créneau...</option>
              {dispos.map(d => (
                <option key={d.id} value={d.id} style={{ color: '#000' }}>
                  {d.titre} — {new Date(d.date_debut).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })} ({d.places_restantes} libres)
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Nom du client *</Lbl>
            <Inp value={nom} onChange={(e: any) => setNom(e.target.value)} placeholder="Jean Tremblay" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <Lbl>Téléphone</Lbl>
              <Inp value={telephone} onChange={(e: any) => setTelephone(e.target.value)} placeholder="514-555-0123" />
            </div>
            <div>
              <Lbl>Nombre de personnes</Lbl>
              <Inp type="number" min="1" value={nbPersonnes} onChange={(e: any) => setNbPersonnes(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Email (optionnel)</Lbl>
            <Inp type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="jean@exemple.ca" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Lbl>Notes</Lbl>
            <Inp value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Ex: allergie, préférence de place..." />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onFermer} style={{ flex: 1, padding: 11, border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'transparent', color: C.textLight, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button onClick={creer} disabled={creation}
              style={{ flex: 2, padding: 11, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#f59e0b)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: creation ? 'wait' : 'pointer' }}>
              {creation ? '⏳...' : '✅ Créer la réservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}