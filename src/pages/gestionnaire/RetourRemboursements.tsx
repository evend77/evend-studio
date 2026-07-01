import React, { useState } from 'react';

const rmas = [
  {
    orderId: '13084573',
    rmaId: '571223',
    raison: 'Demande de retour refusée',
    couleur: '#E74C3C',
    bgCouleur: '#FDECEA',
  },
  {
    orderId: '13629869',
    rmaId: '586387',
    raison: 'Autres',
    couleur: '#1E8449',
    bgCouleur: '#E9F7EF',
  },
];

function RetourRemboursements() {
  const [recherche, setRecherche] = useState('');

  const rmasFiltres = rmas.filter(r =>
    recherche === '' ||
    r.orderId.includes(recherche) ||
    r.rmaId.includes(recherche) ||
    r.raison.toLowerCase().includes(recherche.toLowerCase())
  );

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#537373',
    borderRight: '1px solid #6a8f8f',
    borderBottom: '2px solid #3a5a5a',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '13px',
    textAlign: 'center',
    borderBottom: '1px solid #f0f0f0',
    borderRight: '1px solid #f0f0f0',
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '20px 24px' }}>

        {/* Fil d'Ariane */}
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
          Commandes / <span style={{ color: '#537373', fontWeight: '600' }}>Liste RMA (Retours et remboursements)</span>
        </p>

        {/* En-tête */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>
            Liste RMA (Retours et remboursements)
          </h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
            Voici la liste de toutes les demandes RMA.
          </p>
        </div>

        {/* Tableau */}
        <div style={{
          backgroundColor: 'white', borderRadius: '8px',
          border: '1px solid #e1e3e5', overflow: 'hidden',
        }}>

          {/* Filtres + recherche */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #e1e3e5',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '8px',
          }}>
            <button style={{
              padding: '4px 14px', borderRadius: '4px', fontSize: '12px',
              border: '2px solid #537373', backgroundColor: '#f0f5f5',
              color: '#537373', fontWeight: '600', cursor: 'pointer',
            }}>
              tout
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="rechercher des éléments"
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: '6px',
                    padding: '6px 30px 6px 10px', fontSize: '12px',
                    outline: 'none', width: '200px',
                  }}
                />
                <span style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', color: '#999',
                }}>🔍</span>
              </div>
              <button style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
              }}>⊞</button>
              <button style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
              }}>↕</button>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>ORDER ID</th>
                <th style={thStyle}>RMA ID</th>
                <th style={thStyle}>RAISON</th>
                <th style={thStyle}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rmasFiltres.map((rma, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#537373', cursor: 'pointer' }}>
                    {rma.orderId}
                  </td>
                  <td style={{ ...tdStyle, color: '#666' }}>
                    {rma.rmaId}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      backgroundColor: rma.bgCouleur,
                      color: rma.couleur,
                      border: `1px solid ${rma.couleur}`,
                      padding: '3px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                    }}>
                      {rma.raison}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #537373',
                      color: '#537373', borderRadius: '4px',
                      padding: '4px 10px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: '600',
                    }}>
                      👁️ Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rmasFiltres.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Aucune demande RMA trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RetourRemboursements;
