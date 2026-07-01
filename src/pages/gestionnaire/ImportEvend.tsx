// src/pages/gestionnaire/ImportEvend.tsx
// e-Vend Studio — Page "Importer mes annonces e-Vend"

import React, { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

interface Props { gestionnaireId: number; }

export default function ImportEvend({ gestionnaireId }: Props) {
  const [chargement, setChargement] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const chargerAnnonces = async () => {
    setChargement(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/produits/vendeur/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnonces(data.produits || data || []);
      }
    } catch {}
    setChargement(false);
  };

  const toggleSelection = (id: number) =>
    setSelectionnes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toutSelectionner = () =>
    setSelectionnes(selectionnes.length === annonces.length ? [] : annonces.map(a => a.id));

  const importerSelection = async () => {
    if (selectionnes.length === 0) return;
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/import-annonces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ annonce_ids: selectionnes }),
      });
      setImportDone(true);
      setTimeout(() => setImportDone(false), 3000);
    } catch {
      alert('Erreur lors de l\'importation.');
    }
    setImporting(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Importer mes annonces e-Vend</h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
        Sélectionnez les produits e-Vend que vous souhaitez afficher sur votre site Studio.
      </p>

      {annonces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 24 }}>
            Cliquez sur le bouton pour charger vos annonces e-Vend.
          </p>
          <button onClick={chargerAnnonces} disabled={chargement}
            style={{ padding: '12px 28px', background: '#c9a96e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            {chargement ? '⏳ Chargement...' : '📦 Charger mes annonces'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#666' }}>
                <strong>{annonces.length}</strong> annonce(s) — <strong>{selectionnes.length}</strong> sélectionnée(s)
              </p>
              <button onClick={toutSelectionner}
                style={{ fontSize: 12, color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                {selectionnes.length === annonces.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <button onClick={importerSelection} disabled={selectionnes.length === 0 || importing}
              style={{ padding: '10px 24px', background: importDone ? '#10b981' : selectionnes.length > 0 ? '#c9a96e' : '#e5e7eb', border: 'none', borderRadius: 8, color: selectionnes.length > 0 ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: selectionnes.length > 0 ? 'pointer' : 'not-allowed', transition: 'background .3s' }}>
              {importDone ? '✅ Importé!' : importing ? '⏳...' : `Importer (${selectionnes.length})`}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {annonces.map((a: any) => {
              const sel = selectionnes.includes(a.id);
              return (
                <div key={a.id} onClick={() => toggleSelection(a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', borderRadius: 10, border: `2px solid ${sel ? '#c9a96e' : '#e5e7eb'}`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: sel ? '0 2px 12px rgba(201,169,110,0.15)' : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${sel ? '#c9a96e' : '#ccc'}`, background: sel ? '#c9a96e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                    {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  {a.image_url && (
                    <img src={a.image_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                      {a.titre || a.nom || 'Produit sans titre'}
                    </p>
                    <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0' }}>
                      {a.prix ? `${a.prix} $` : ''}{a.categorie ? ` · ${a.categorie}` : ''}{a.statut ? ` · ${a.statut}` : ''}
                    </p>
                  </div>
                  {sel && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a96e', flexShrink: 0 }}>✓ Sélectionné</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}