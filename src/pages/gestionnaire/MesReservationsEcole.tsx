// src/pages/gestionnaire/MesReservationsEcole.tsx
// e-Vend Studio — Mes réservations (École/Cours)
// Agenda des créneaux créés dans Configuration > Réservation École/Cours,
// avec la liste des clients inscrits par créneau, annulation, et création
// manuelle (client qui appelle par téléphone). Même palette que PageChoisirTemplate.tsx.

import { useState, useEffect, useMemo } from 'react';

const API_BASE = '/api';

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

export default function MesReservationsEcole({ gestionnaireId }: Props) {
  const [dispos, setDispos] = useState<Disponibilite[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [erreur, setErreur] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [filtre, setFiltre] = useState<'a-venir' | 'tous'>('a-venir');

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

  const disposAffiches = useMemo(() => {
    const maintenant = Date.now();
    return dispos
      .filter(d => filtre === 'tous' || new Date(d.date_debut).getTime() >= maintenant - 86400000)
      .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime());
  }, [dispos, filtre]);

  const annuler = async (id: number) => {
    if (!window.confirm('Annuler cette réservation?')) return;
    try {
      const res = await fetch(`${API_BASE}/reservations/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ statut: 'annulee' }),
      });
      if (!res.ok) throw new Error();
      setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: 'annulee' } : r));
      // Recharger pour que les places restantes se remettent à jour
      charger();
      afficherToast('Réservation annulée.', 'ok');
    } catch {
      afficherToast('Erreur lors de l\'annulation.', 'err');
    }
  };

  // ── Stats du header ──────────────────────────────────────────────────────
  const creneauxActifs = dispos.filter(d => d.actif).length;
  const totalReservationsActives = reservations.filter(r => r.statut !== 'annulee').length;
  const totalPlaces = dispos.reduce((s, d) => s + d.capacite_max, 0);
  const totalOccupees = dispos.reduce((s, d) => s + d.places_reservees, 0);

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 96px)', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .mre-card { transition: all 0.2s ease; }
        .mre-card:hover { background: ${C.cardBgHover} !important; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.type === 'ok' ? C.green : C.red, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast.msg}
          </div>
        )}

        {/* Modal création manuelle */}
        {modalOuvert && (
          <ModalCreationManuelle
            dispos={dispos.filter(d => d.actif && d.places_restantes > 0)}
            onFermer={() => setModalOuvert(false)}
            onCree={() => { setModalOuvert(false); charger(); afficherToast('Réservation créée!', 'ok'); }}
            onErreur={(m) => afficherToast(m, 'err')}
            token={token()}
          />
        )}

        {/* ── Header dégradé ─────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          borderRadius: 24, marginBottom: 28, padding: 32,
          position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <span style={{ fontSize: 40 }}>📅</span>
                  <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                    Mes réservations
                  </h1>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 16, color: 'rgba(255,255,255,0.8)', maxWidth: 560 }}>
                  Gérez vos créneaux de cours et vos inscriptions — annulez une place, ou ajoutez une réservation pour un client au téléphone.
                </p>
              </div>
              <button onClick={() => setModalOuvert(true)}
                style={{ padding: '13px 24px', background: '#fff', color: '#c2410c', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                📞 Réservation par téléphone
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{creneauxActifs}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Créneaux actifs</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{totalReservationsActives}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Réservations actives</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{totalOccupees}/{totalPlaces}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Places occupées</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['a-venir', 'tous'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              style={{
                padding: '8px 18px', borderRadius: 20, border: `1px solid ${filtre === f ? C.amber : C.border}`,
                background: filtre === f ? 'rgba(245,158,11,0.15)' : 'transparent', color: filtre === f ? C.amber : C.textLight,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              {f === 'a-venir' ? '📆 À venir' : 'Tous les créneaux'}
            </button>
          ))}
        </div>

        {/* Liste des créneaux — agenda */}
        {chargement ? (
          <p style={{ color: C.textLight, textAlign: 'center', padding: 60 }}>Chargement de votre agenda...</p>
        ) : disposAffiches.length === 0 ? (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
            <p style={{ color: C.textLight, fontSize: 14 }}>Aucun créneau {filtre === 'a-venir' ? 'à venir' : ''}.</p>
            <p style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Crée tes créneaux dans Configuration → Réservation École/Cours.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disposAffiches.map(d => {
              const insc = reservationsParCreneau[d.date_debut] || [];
              const complet = d.places_restantes <= 0;
              const estOuvert = ouvert === d.id;
              return (
                <div key={d.id} className="mre-card" style={{ background: C.cardBg, border: `1px solid ${estOuvert ? C.amber + '50' : C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div onClick={() => setOuvert(estOuvert ? null : d.id)}
                    style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{d.titre || 'Créneau'}</p>
                        {!d.actif && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: C.textDim, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>INACTIF</span>}
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
                              <button onClick={() => annuler(r.id)}
                                style={{ background: C.redLight, color: C.red, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                ✕ Annuler
                              </button>
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
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL — Création manuelle (client au téléphone)
// ─────────────────────────────────────────────────────────────────────────

function ModalCreationManuelle({ dispos, onFermer, onCree, onErreur, token }: {
  dispos: Disponibilite[]; onFermer: () => void; onCree: () => void; onErreur: (m: string) => void; token: string | null;
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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