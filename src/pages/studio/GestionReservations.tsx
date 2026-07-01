// src/pages/studio/GestionReservations.tsx
// e-Vend Studio — Dashboard réservations du vendeur
// 3 vues : Journalière, Hebdomadaire, Mensuelle

import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';
const COULEUR  = '#c9a96e';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Reservation {
  id: number;
  nom_client: string;
  email_client: string;
  telephone: string;
  date_debut: string;
  date_fin: string;
  nb_personnes: number;
  notes: string;
  statut: 'confirmee' | 'en_attente' | 'annulee' | 'completee';
  objet_reserve: string;
  type_reservation: string;
}

interface Disponibilite {
  id: number;
  date_debut: string;
  date_fin: string;
  capacite_max: number;
  titre: string;
  actif: boolean;
}

type VueCalendrier = 'jour' | 'semaine' | 'mois';

const STATUT_CONFIG = {
  confirmee:   { label: 'Confirmée',   couleur: '#16a34a', bg: '#dcfce7' },
  en_attente:  { label: 'En attente',  couleur: '#d97706', bg: '#fef9c3' },
  annulee:     { label: 'Annulée',     couleur: '#dc2626', bg: '#fee2e2' },
  completee:   { label: 'Complétée',   couleur: '#6366f1', bg: '#ede9fe' },
};

// ─── HELPERS DATE ─────────────────────────────────────────────────────────────
const JOURS_FR   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_FR    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function debutSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay();
  d.setDate(d.getDate() - (jour === 0 ? 6 : jour - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function memeJour(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function GestionReservations({ vendeurId }: { vendeurId: number }) {
  const [vue, setVue]                   = useState<VueCalendrier>('semaine');
  const [dateRef, setDateRef]           = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dispos, setDispos]             = useState<Disponibilite[]>([]);
  const [loading, setLoading]           = useState(true);
  const [onglet, setOnglet]             = useState<'calendrier' | 'liste' | 'dispos'>('calendrier');
  const [modalRes, setModalRes]         = useState<Reservation | null>(null);
  const [showAjoutDispo, setShowAjoutDispo] = useState(false);
  const [nouvelleDispo, setNouvelleDispo]   = useState({ date_debut: '', date_fin: '', titre: '', capacite_max: 1 });

  const token = localStorage.getItem('token');

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, dispoRes] = await Promise.all([
        fetch(`${API_BASE}/reservations/vendeur`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/reservations/mes-disponibilites`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [resData, dispoData] = await Promise.all([resRes.json(), dispoRes.json()]);
      setReservations(resData.reservations || []);
      setDispos(dispoData.disponibilites || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { charger(); }, [charger]);

  const changerStatut = async (id: number, statut: string) => {
    await fetch(`${API_BASE}/reservations/${id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ statut }),
    });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: statut as any } : r));
    setModalRes(null);
  };

  const ajouterDispo = async () => {
    if (!nouvelleDispo.date_debut || !nouvelleDispo.date_fin) return;
    await fetch(`${API_BASE}/reservations/disponibilites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(nouvelleDispo),
    });
    setShowAjoutDispo(false);
    setNouvelleDispo({ date_debut: '', date_fin: '', titre: '', capacite_max: 1 });
    charger();
  };

  const supprimerDispo = async (id: number) => {
    await fetch(`${API_BASE}/reservations/disponibilites/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    charger();
  };

  // Stats rapides
  const stats = {
    total:     reservations.length,
    aVenir:    reservations.filter(r => new Date(r.date_debut) > new Date() && r.statut !== 'annulee').length,
    attente:   reservations.filter(r => r.statut === 'en_attente').length,
    semaine:   reservations.filter(r => {
      const d = new Date(r.date_debut);
      const debut = debutSemaine(new Date());
      const fin   = new Date(debut); fin.setDate(fin.getDate() + 7);
      return d >= debut && d < fin && r.statut !== 'annulee';
    }).length,
  };

  // ── VUE JOURNALIÈRE ──────────────────────────────────────────────────────────
  const VueJour = () => {
    const heures = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h
    const resJour = reservations.filter(r => memeJour(new Date(r.date_debut), dateRef));

    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
          {dateRef.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' — '}
          <span style={{ color: COULEUR }}>{resJour.length} réservation(s)</span>
        </div>
        <div style={{ position: 'relative' }}>
          {heures.map(h => (
            <div key={h} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ width: 64, padding: '8px 12px', fontSize: 12, color: '#aaa', fontWeight: 600, borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
                {h}:00
              </div>
              <div style={{ flex: 1, minHeight: 48, position: 'relative', padding: '4px 8px' }}>
                {resJour.filter(r => new Date(r.date_debut).getHours() === h).map(r => {
                  const cfg = STATUT_CONFIG[r.statut];
                  return (
                    <div key={r.id} onClick={() => setModalRes(r)} style={{ background: cfg.bg, border: `1px solid ${cfg.couleur}40`, borderLeft: `3px solid ${cfg.couleur}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{r.nom_client}</p>
                      <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{formatHeure(r.date_debut)} · {r.nb_personnes} pers.</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── VUE HEBDOMADAIRE ─────────────────────────────────────────────────────────
  const VueSemaine = () => {
    const debut = debutSemaine(dateRef);
    const jours = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(debut);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* En-tête jours */}
        <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '2px solid #e5e7eb' }}>
          <div style={{ borderRight: '1px solid #f0f0f0' }} />
          {jours.map((j, i) => {
            const aujd = memeJour(j, new Date());
            return (
              <div key={i} style={{ padding: '12px 8px', textAlign: 'center', background: aujd ? `${COULEUR}12` : '#fff', borderRight: i < 6 ? '1px solid #f0f0f0' : 'none' }}>
                <p style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>{JOURS_FR[j.getDay()]}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: aujd ? COULEUR : '#1a1a1a', margin: '4px 0 0' }}>{j.getDate()}</p>
              </div>
            );
          })}
        </div>
        {/* Créneaux horaires */}
        {Array.from({ length: 13 }, (_, i) => i + 7).map(h => (
          <div key={h} style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '1px solid #f5f5f5', minHeight: 60 }}>
            <div style={{ padding: '4px 8px', fontSize: 11, color: '#aaa', fontWeight: 600, borderRight: '1px solid #f0f0f0', paddingTop: 8 }}>{h}h</div>
            {jours.map((j, i) => {
              const resJourHeure = reservations.filter(r => memeJour(new Date(r.date_debut), j) && new Date(r.date_debut).getHours() === h);
              return (
                <div key={i} style={{ borderRight: i < 6 ? '1px solid #f0f0f0' : 'none', padding: '3px 4px' }}>
                  {resJourHeure.map(r => {
                    const cfg = STATUT_CONFIG[r.statut];
                    return (
                      <div key={r.id} onClick={() => setModalRes(r)} style={{ background: cfg.bg, border: `1px solid ${cfg.couleur}30`, borderLeft: `2px solid ${cfg.couleur}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer', marginBottom: 2 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nom_client}</p>
                        <p style={{ fontSize: 10, color: '#888', margin: 0 }}>{formatHeure(r.date_debut)}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── VUE MENSUELLE ────────────────────────────────────────────────────────────
  const VueMois = () => {
    const annee  = dateRef.getFullYear();
    const mois   = dateRef.getMonth();
    const premier = new Date(annee, mois, 1);
    const dernier = new Date(annee, mois + 1, 0);
    const debutGrille = new Date(premier);
    const jourdeSemaine = premier.getDay();
    debutGrille.setDate(premier.getDate() - (jourdeSemaine === 0 ? 6 : jourdeSemaine - 1));

    const semaines: Date[][] = [];
    let current = new Date(debutGrille);
    while (current <= dernier || semaines.length < 5) {
      const sem: Date[] = [];
      for (let i = 0; i < 7; i++) {
        sem.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      semaines.push(sem);
      if (semaines.length >= 6) break;
    }

    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* En-tête jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8f8f6', borderBottom: '1px solid #e5e7eb' }}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j => (
            <div key={j} style={{ padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>{j}</div>
          ))}
        </div>
        {semaines.map((sem, si) => (
          <div key={si} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: si < semaines.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            {sem.map((jour, ji) => {
              const dansMois = jour.getMonth() === mois;
              const aujd     = memeJour(jour, new Date());
              const resJour  = reservations.filter(r => memeJour(new Date(r.date_debut), jour) && r.statut !== 'annulee');
              return (
                <div key={ji} onClick={() => { setDateRef(new Date(jour)); setVue('jour'); }}
                  style={{ minHeight: 88, padding: '6px 8px', borderRight: ji < 6 ? '1px solid #f0f0f0' : 'none', background: aujd ? `${COULEUR}10` : dansMois ? '#fff' : '#fafafa', cursor: 'pointer' }}>
                  {/* CORRECTION: fusion des deux propriétés color en une seule */}
                  <div style={{ fontSize: 13, fontWeight: aujd ? 800 : 500, color: aujd ? '#fff' : (dansMois ? '#1a1a1a' : '#ccc'), marginBottom: 4, width: 24, height: 24, borderRadius: '50%', background: aujd ? COULEUR : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {jour.getDate()}
                  </div>
                  {resJour.slice(0, 3).map(r => {
                    const cfg = STATUT_CONFIG[r.statut];
                    return (
                      <div key={r.id} onClick={e => { e.stopPropagation(); setModalRes(r); }}
                        style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.couleur, borderRadius: 3, padding: '1px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatHeure(r.date_debut)} {r.nom_client}
                      </div>
                    );
                  })}
                  {resJour.length > 3 && <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>+{resJour.length - 3} autres</p>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Navigation dates
  const navPrev = () => {
    const d = new Date(dateRef);
    if (vue === 'jour')     d.setDate(d.getDate() - 1);
    if (vue === 'semaine')  d.setDate(d.getDate() - 7);
    if (vue === 'mois')     d.setMonth(d.getMonth() - 1);
    setDateRef(d);
  };
  const navNext = () => {
    const d = new Date(dateRef);
    if (vue === 'jour')     d.setDate(d.getDate() + 1);
    if (vue === 'semaine')  d.setDate(d.getDate() + 7);
    if (vue === 'mois')     d.setMonth(d.getMonth() + 1);
    setDateRef(d);
  };

  const titreNav = () => {
    if (vue === 'jour')    return dateRef.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
    if (vue === 'semaine') {
      const debut = debutSemaine(dateRef);
      const fin   = new Date(debut); fin.setDate(fin.getDate() + 6);
      return `${debut.getDate()} – ${fin.getDate()} ${MOIS_FR[fin.getMonth()]} ${fin.getFullYear()}`;
    }
    return `${MOIS_FR[dateRef.getMonth()]} ${dateRef.getFullYear()}`;
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: '28px 32px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* EN-TÊTE */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📅 Réservations</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Gérez vos disponibilités et suivez vos réservations.</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total',      valeur: stats.total,   icone: '📋', couleur: '#6366f1' },
          { label: 'À venir',    valeur: stats.aVenir,  icone: '🔜', couleur: '#16a34a' },
          { label: 'Ce semaine', valeur: stats.semaine, icone: '📅', couleur: COULEUR },
          { label: 'En attente', valeur: stats.attente, icone: '⏳', couleur: '#d97706' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icone}</span>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.couleur, margin: 0 }}>{s.valeur}</p>
          </div>
        ))}
      </div>

      {/* ONGLETS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['calendrier', '📅 Calendrier'], ['liste', '📋 Liste'], ['dispos', '⚙️ Disponibilités']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setOnglet(id)}
            style={{ padding: '9px 20px', borderRadius: 8, background: onglet === id ? COULEUR : '#fff', color: onglet === id ? '#fff' : '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: onglet === id ? `1px solid ${COULEUR}` : '1px solid #e5e7eb' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CALENDRIER ── */}
      {onglet === 'calendrier' && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={navPrev} style={{ width: 36, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0, minWidth: 220, textAlign: 'center', textTransform: 'capitalize' }}>{titreNav()}</h2>
              <button onClick={navNext} style={{ width: 36, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
              <button onClick={() => setDateRef(new Date())} style={{ padding: '7px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}>Aujourd'hui</button>
            </div>
            <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 8, padding: 3, gap: 2 }}>
              {([['jour', '📆 Jour'], ['semaine', '📅 Semaine'], ['mois', '🗓 Mois']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setVue(v)}
                  style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: vue === v ? '#fff' : 'transparent', color: vue === v ? '#1a1a1a' : '#888', fontWeight: vue === v ? 700 : 500, fontSize: 13, cursor: 'pointer', boxShadow: vue === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Chargement...</div>
          ) : (
            <>
              {vue === 'jour'    && <VueJour />}
              {vue === 'semaine' && <VueSemaine />}
              {vue === 'mois'    && <VueMois />}
            </>
          )}
        </>
      )}

      {/* ── LISTE ── */}
      {onglet === 'liste' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f8f6', borderBottom: '2px solid #e5e7eb' }}>
                {['Client', 'Date', 'Personnes', 'Type', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Aucune réservation pour l'instant.</td></tr>
              ) : reservations.map((r, i) => {
                const cfg = STATUT_CONFIG[r.statut];
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, margin: 0 }}>{r.nom_client}</p>
                      <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{r.email_client}</p>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      <p style={{ margin: 0 }}>{formatDate(r.date_debut)}</p>
                      <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{formatHeure(r.date_debut)}</p>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{r.nb_personnes}</td>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: 12 }}>{r.type_reservation || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.couleur }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setModalRes(r)} style={{ padding: '5px 12px', border: `1px solid ${COULEUR}40`, borderRadius: 6, background: '#fff', color: COULEUR, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Voir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DISPONIBILITÉS ── */}
      {onglet === 'dispos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: '#555' }}>Définissez les créneaux où les clients peuvent réserver.</p>
            <button onClick={() => setShowAjoutDispo(true)}
              style={{ padding: '10px 20px', background: COULEUR, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Ajouter un créneau
            </button>
          </div>

          {showAjoutDispo && (
            <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${COULEUR}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Nouveau créneau de disponibilité</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>Début</label>
                  <input type="datetime-local" value={nouvelleDispo.date_debut} onChange={e => setNouvelleDispo(p => ({ ...p, date_debut: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>Fin</label>
                  <input type="datetime-local" value={nouvelleDispo.date_fin} onChange={e => setNouvelleDispo(p => ({ ...p, date_fin: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>Titre (optionnel)</label>
                  <input value={nouvelleDispo.titre} onChange={e => setNouvelleDispo(p => ({ ...p, titre: e.target.value }))} placeholder="ex: Service du soir"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>Capacité max</label>
                  <input type="number" min={1} value={nouvelleDispo.capacite_max} onChange={e => setNouvelleDispo(p => ({ ...p, capacite_max: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={ajouterDispo} style={{ padding: '10px 24px', background: COULEUR, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Enregistrer</button>
                <button onClick={() => setShowAjoutDispo(false)} style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#555' }}>Annuler</button>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {dispos.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
                <p style={{ fontSize: 15 }}>Aucun créneau défini.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Ajoutez des créneaux pour que vos clients puissent réserver.</p>
              </div>
            ) : dispos.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < dispos.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${COULEUR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📅</div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{d.titre || 'Créneau disponible'}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
                      {formatDate(d.date_debut)} {formatHeure(d.date_debut)} → {formatHeure(d.date_fin)} · Max {d.capacite_max} pers.
                    </p>
                  </div>
                </div>
                <button onClick={() => supprimerDispo(d.id)} style={{ padding: '6px 14px', background: '#fee2e2', border: 'none', borderRadius: 6, color: '#dc2626', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL RÉSERVATION ── */}
      {modalRes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalRes(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Réservation #{modalRes.id}</h2>
              <button onClick={() => setModalRes(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['👤 Client',    modalRes.nom_client],
                ['📧 Email',     modalRes.email_client],
                ['📞 Téléphone', modalRes.telephone || '—'],
                ['📅 Date',      `${formatDate(modalRes.date_debut)} à ${formatHeure(modalRes.date_debut)}`],
                ['👥 Personnes', String(modalRes.nb_personnes)],
                ['📝 Notes',     modalRes.notes || '—'],
              ].map(([label, valeur]) => (
                <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f8f8f6', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: '#888', minWidth: 110 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{valeur}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f8f8f6', borderRadius: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#888', minWidth: 110 }}>Statut</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUT_CONFIG[modalRes.statut].bg, color: STATUT_CONFIG[modalRes.statut].couleur }}>
                  {STATUT_CONFIG[modalRes.statut].label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {modalRes.statut !== 'confirmee' && (
                <button onClick={() => changerStatut(modalRes.id, 'confirmee')} style={{ padding: '9px 18px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#16a34a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✅ Confirmer</button>
              )}
              {modalRes.statut !== 'completee' && (
                <button onClick={() => changerStatut(modalRes.id, 'completee')} style={{ padding: '9px 18px', background: '#ede9fe', border: 'none', borderRadius: 8, color: '#6366f1', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✓ Marquer complétée</button>
              )}
              {modalRes.statut !== 'annulee' && (
                <button onClick={() => changerStatut(modalRes.id, 'annulee')} style={{ padding: '9px 18px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✕ Annuler</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}