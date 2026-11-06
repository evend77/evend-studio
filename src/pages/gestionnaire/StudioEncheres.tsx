// CHEMIN : src/pages/gestionnaire/StudioEncheres.tsx
// e-Vend Studio — Gestionnaire : toutes les enchères de la boutique (suivi + annulation).
// API : GET /api/studio/encheres/:gid · POST /api/studio/encheres/:gid/:id/annuler

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = {
  accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', blue: '#3b82f6',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b',
};

interface Enchere {
  id: number; produit_id: number; titre: string; image_url: string | null; statut: string;
  prix_depart: number; prix_reserve: number | null; mise_actuelle: number | null; prix_final: number | null;
  nb_mises: number; nb_encherisseurs: number; date_fin: string; paiement_expire_le: string | null; boutique: string | null;
}

const STATUTS: { id: string; label: string; couleur: string }[] = [
  { id: 'active', label: 'En cours', couleur: C.green },
  { id: 'attente_paiement', label: 'À payer', couleur: C.orange },
  { id: 'payee', label: 'Payées', couleur: C.blue },
  { id: 'expiree', label: 'Non payées', couleur: C.red },
  { id: 'sans_gagnant', label: 'Sans gagnant', couleur: '#94a3b8' },
  { id: 'annulee', label: 'Annulées', couleur: '#94a3b8' },
];

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const argent = (v: number | null) => (v === null || v === undefined ? '—' : v.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }));
const quand = (d: string) => new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const StudioEncheres: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/encheres/${gestionnaireId}`;
  const [statut, setStatut] = useState('active');
  const [page, setPage] = useState(1);
  const [liste, setListe] = useState<Enchere[]>([]);
  const [compte, setCompte] = useState<Record<string, number>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [aAnnuler, setAAnnuler] = useState<Enchere | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${base}?statut=${statut}&page=${page}`, { credentials: 'include', headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErreur(d.error || 'Chargement impossible'); }
      else { setListe(d.encheres || []); setCompte(d.compte || {}); setErreur(''); }
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, statut, page]);

  useEffect(() => { charger(); }, [charger]);

  const annuler = async () => {
    if (!aAnnuler) return;
    setOccupe(true);
    try {
      const r = await fetch(`${base}/${aAnnuler.id}/annuler`, { method: 'POST', credentials: 'include', headers: entetes() });
      if (!r.ok) setErreur((await r.json().catch(() => ({}))).error || 'Annulation impossible');
      else setErreur('');
      setAAnnuler(null);
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', color: C.text }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22 }}>🔨 Enchères de la boutique</h2>
      <p style={{ margin: '0 0 16px', color: C.textLight, fontSize: 13 }}>
        Les collaborateurs lancent leurs enchères depuis leur liste de produits. Les règles (durée, incrément, délai de paiement) se règlent dans Config multi → Enchères.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => { setStatut(s.id); setPage(1); setChargement(true); }} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${statut === s.id ? s.couleur : C.border}`, background: statut === s.id ? `${s.couleur}1f` : '#fff', color: statut === s.id ? s.couleur : C.text,
          }}>{s.label} ({compte[s.id] || 0})</button>
        ))}
      </div>

      {erreur && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {chargement ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>
      ) : liste.length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textLight }}>Aucune enchère dans cette catégorie.</div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {liste.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, padding: 12, borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: C.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {e.image_url ? <img src={e.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🔨</span>}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titre}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{e.boutique || 'Collaborateur'} · fin {quand(e.date_fin)}</div>
              </div>
              <div style={{ fontSize: 13, minWidth: 150 }}>
                <div>Départ : <strong>{argent(e.prix_depart)}</strong>{e.prix_reserve !== null && <span style={{ color: C.textLight }}> · réserve {argent(e.prix_reserve)}</span>}</div>
                <div>{e.prix_final !== null ? <>Final : <strong>{argent(e.prix_final)}</strong></> : <>Actuelle : <strong>{argent(e.mise_actuelle)}</strong></>}</div>
              </div>
              <div style={{ fontSize: 12, color: C.textLight, minWidth: 90 }}>{e.nb_mises} mise{e.nb_mises > 1 ? 's' : ''}<br />{e.nb_encherisseurs} enchérisseur{e.nb_encherisseurs > 1 ? 's' : ''}</div>
              {e.statut === 'active' && (
                <button onClick={() => setAAnnuler(e)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}`, background: '#fff', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              )}
              {e.statut === 'attente_paiement' && e.paiement_expire_le && (
                <span style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>Paiement avant {quand(e.paiement_expire_le)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
        <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); setChargement(true); }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', opacity: page <= 1 ? 0.4 : 1, cursor: 'pointer' }}>← Précédent</button>
        <button disabled={liste.length < 30} onClick={() => { setPage(p => p + 1); setChargement(true); }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', opacity: liste.length < 30 ? 0.4 : 1, cursor: 'pointer' }}>Suivant →</button>
      </div>

      {aAnnuler && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🔨</div>
            <h3 style={{ margin: '8px 0' }}>Annuler cette enchère ?</h3>
            <p style={{ color: C.textLight, fontSize: 13, margin: '0 0 6px' }}>« {aAnnuler.titre} »</p>
            <p style={{ color: C.textLight, fontSize: 13, margin: '0 0 18px' }}>
              {aAnnuler.nb_mises > 0 ? `Les ${aAnnuler.nb_encherisseurs} enchérisseur(s) seront prévenus. ` : ''}L'unité revient en stock. Aucun montant n'a été prélevé.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAAnnuler(null)} style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Garder</button>
              <button disabled={occupe} onClick={annuler} style={{ flex: 1, padding: 10, border: 'none', background: C.red, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler l'enchère</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioEncheres;