// src/pages/gestionnaire/ConfigReservationEcole.tsx
// e-Vend Studio — Configuration des créneaux de réservation — Add-on École/Cours
// Spécifique à la catégorie "cours" (École de Danse et futurs templates
// similaires) — champs Salle/Professeur/Niveau propres à ce type de commerce.
// D'autres catégories (Resto, RDV) auront leur propre fichier séparé plus tard,
// mais partagent les mêmes tables/routes backend (disponibilites, reservations)
// et la même logique de capacité dans routes/reservations.js.

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const CP = '#6366f1';

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
}

const Inp = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e: any) => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' }}
    onFocus={(e: any) => e.target.style.borderColor = CP}
    onBlur={(e: any) => e.target.style.borderColor = '#e5e7eb'} />
);
const F = ({ label, children }: any) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

export default function ConfigReservationEcole({ gestionnaireId }: Props) {
  const [dispos, setDispos] = useState<Disponibilite[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [creation, setCreation] = useState(false);
  const [erreur, setErreur] = useState('');
  const [nouveau, setNouveau] = useState({ titre: '', date_debut: '', date_fin: '', capacite_max: '', salle: '', professeur: '', niveau: '', notes_internes: '' });

  const token = () => localStorage.getItem('token');

  const charger = () => {
    setChargement(true);
    fetch(`${API_BASE}/reservations/mes-disponibilites`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setDispos(d.disponibilites || []))
      .catch(() => setErreur('Erreur de chargement.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, [gestionnaireId]);

  const creerCreneau = async () => {
    setErreur('');
    if (!nouveau.titre || !nouveau.date_debut || !nouveau.date_fin || !nouveau.capacite_max) {
      setErreur('Tous les champs sont requis.');
      return;
    }
    setCreation(true);
    try {
      const res = await fetch(`${API_BASE}/reservations/disponibilites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          titre: nouveau.titre,
          date_debut: nouveau.date_debut,
          date_fin: nouveau.date_fin,
          capacite_max: parseInt(nouveau.capacite_max, 10),
          salle: nouveau.salle || null,
          professeur: nouveau.professeur || null,
          niveau: nouveau.niveau || null,
          notes_internes: nouveau.notes_internes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.message || 'Erreur.'); setCreation(false); return; }
      setNouveau({ titre: '', date_debut: '', date_fin: '', capacite_max: '', salle: '', professeur: '', niveau: '', notes_internes: '' });
      setAjoutOuvert(false);
      charger();
    } catch {
      setErreur('Erreur de connexion.');
    }
    setCreation(false);
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

  const supprimer = async (id: number) => {
    try {
      await fetch(`${API_BASE}/reservations/disponibilites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setDispos(prev => prev.filter(d => d.id !== id));
    } catch {
      setErreur('Erreur lors de la suppression.');
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${CP}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Réservations — Créneaux</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Créez vos créneaux, les places restantes se calculent automatiquement.</p>
        </div>
      </div>

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', margin: '16px 0', fontSize: 12, color: '#991b1b' }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Ajouter un créneau */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', margin: '20px 0' }}>
        {!ajoutOuvert ? (
          <button onClick={() => setAjoutOuvert(true)}
            style={{ width: '100%', padding: 11, border: `2px dashed ${CP}`, borderRadius: 8, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Créer un créneau
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 14 }}>Nouveau créneau</p>
            <F label="Titre (ex: Cours Salsa débutant)"><Inp value={nouveau.titre} onChange={(v: string) => setNouveau(p => ({ ...p, titre: v }))} placeholder="Cours Salsa débutant" /></F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <F label="Début"><Inp type="datetime-local" value={nouveau.date_debut} onChange={(v: string) => setNouveau(p => ({ ...p, date_debut: v }))} /></F>
              <F label="Fin"><Inp type="datetime-local" value={nouveau.date_fin} onChange={(v: string) => setNouveau(p => ({ ...p, date_fin: v }))} /></F>
            </div>
            <F label="Capacité maximale (nombre de places)"><Inp type="number" value={nouveau.capacite_max} onChange={(v: string) => setNouveau(p => ({ ...p, capacite_max: v }))} placeholder="20" /></F>

            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '16px 0 10px' }}>Optionnel</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <F label="Salle / Local"><Inp value={nouveau.salle} onChange={(v: string) => setNouveau(p => ({ ...p, salle: v }))} placeholder="Salle A" /></F>
              <F label="Professeur / Animateur"><Inp value={nouveau.professeur} onChange={(v: string) => setNouveau(p => ({ ...p, professeur: v }))} placeholder="Isabelle Morin" /></F>
            </div>
            <F label="Niveau"><Inp value={nouveau.niveau} onChange={(v: string) => setNouveau(p => ({ ...p, niveau: v }))} placeholder="Débutant, Intermédiaire, Avancé..." /></F>
            <F label="Notes internes (non visibles par les clients)"><Inp value={nouveau.notes_internes} onChange={(v: string) => setNouveau(p => ({ ...p, notes_internes: v }))} placeholder="Ex: apporter le matériel de sono" /></F>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={creerCreneau} disabled={creation}
                style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: CP, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {creation ? '⏳...' : '✅ Créer le créneau'}
              </button>
              <button onClick={() => { setAjoutOuvert(false); setErreur(''); }}
                style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: '#f3f4f6', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des créneaux */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 14 }}>
          {dispos.length} créneau{dispos.length > 1 ? 'x' : ''}
        </p>

        {chargement ? (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>Chargement...</p>
        ) : dispos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>Aucun créneau créé pour l'instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dispos.map(d => {
              const complet = d.places_restantes <= 0;
              return (
                <div key={d.id} style={{ border: `1.5px solid ${d.actif ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: 10, padding: '14px 16px', opacity: d.actif ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{d.titre || '(sans titre)'}</p>
                      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                        {new Date(d.date_debut).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                        {' → '}
                        {new Date(d.date_fin).toLocaleTimeString('fr-CA', { timeStyle: 'short' })}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: complet ? '#dc2626' : d.places_restantes <= 3 ? '#f59e0b' : '#16a34a' }}>
                        {complet ? '🔴 Complet' : `🟢 ${d.places_restantes} place${d.places_restantes > 1 ? 's' : ''} dispo`} sur {d.capacite_max} au total
                        <span style={{ fontWeight: 400, color: '#999', marginLeft: 6 }}>({d.places_reservees} réservée{d.places_reservees > 1 ? 's' : ''})</span>
                      </p>
                      {(d.salle || d.professeur || d.niveau) && (
                        <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                          {[d.salle && `📍 ${d.salle}`, d.professeur && `👤 ${d.professeur}`, d.niveau && `🎯 ${d.niveau}`].filter(Boolean).join('  ·  ')}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div onClick={() => toggleActif(d)}
                        style={{ width: 36, height: 20, borderRadius: 10, background: d.actif ? CP : '#ddd', cursor: 'pointer', position: 'relative' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: d.actif ? 18 : 2, transition: 'left 0.2s' }} />
                      </div>
                      <button onClick={() => supprimer(d.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: 0 }}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}