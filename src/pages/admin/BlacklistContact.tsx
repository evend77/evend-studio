// src/pages/admin/BlacklistContact.tsx
// e-Vend Studio — Liste noire anti-spam (admin plateforme)
// Ajouter/retirer des mots sans redéployer — partagé par tous les gestionnaires.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface MotBlacklist {
  id: number;
  mot: string;
  created_at: string;
  created_by: string | null;
}

export default function BlacklistContact() {
  const [mots, setMots] = useState<MotBlacklist[]>([]);
  const [nouveauMot, setNouveauMot] = useState('');
  const [chargement, setChargement] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  const token = () => localStorage.getItem('token');

  const charger = () => {
    setChargement(true);
    fetch(`${API_BASE}/blacklist-contact`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setMots(d.mots || []))
      .catch(() => setErreur('Erreur de chargement.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, []);

  const ajouterMot = async () => {
    const mot = nouveauMot.trim().toLowerCase();
    if (!mot) return;
    setAjoutEnCours(true);
    setErreur('');
    try {
      const res = await fetch(`${API_BASE}/blacklist-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ mot }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.error || 'Erreur.'); setAjoutEnCours(false); return; }
      setNouveauMot('');
      charger();
    } catch {
      setErreur('Erreur de connexion.');
    }
    setAjoutEnCours(false);
  };

  const retirerMot = async (id: number) => {
    try {
      await fetch(`${API_BASE}/blacklist-contact/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setMots(prev => prev.filter(m => m.id !== id));
    } catch {
      setErreur('Erreur lors de la suppression.');
    }
  };

  const motsFiltres = mots.filter(m => m.mot.includes(recherche.toLowerCase()));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚫</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Liste noire anti-spam</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Formulaire de contact — partagée sur tous les sites</p>
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', margin: '16px 0 24px', fontSize: 12, color: '#1e40af' }}>
        ℹ️ Tout message contenant l'un de ces mots (dans le message ou le sujet) est automatiquement rejeté, sur tous les formulaires de contact de tous les gestionnaires.
      </div>

      {/* Ajouter un mot */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 10 }}>Ajouter un mot</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={nouveauMot}
            onChange={e => setNouveauMot(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ajouterMot()}
            placeholder="ex: arnaque"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={ajouterMot} disabled={ajoutEnCours || !nouveauMot.trim()}
            style={{ padding: '10px 22px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {ajoutEnCours ? '...' : '+ Ajouter'}
          </button>
        </div>
        {erreur && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{erreur}</p>}
      </div>

      {/* Liste */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: 0 }}>
            {mots.length} mot{mots.length > 1 ? 's' : ''} bloqué{mots.length > 1 ? 's' : ''}
          </p>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Filtrer..."
            style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 12, outline: 'none' }}
          />
        </div>

        {chargement ? (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>Chargement...</p>
        ) : motsFiltres.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>Aucun mot trouvé.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {motsFiltres.map(m => (
              <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '6px 8px 6px 14px', fontSize: 13, color: '#991b1b' }}>
                {m.mot}
                <button onClick={() => retirerMot(m.id)}
                  style={{ background: '#fecaca', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 11, cursor: 'pointer', color: '#7f1d1d', lineHeight: 1 }}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}