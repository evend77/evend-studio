import React, { useState } from 'react';

const documents = [
  {
    id: 73688,
    nomVendeur: 'idée-cadeau',
    facturedDe: '31-12-2025',
    factureA: '30-01-2026',
    dateCreation: '07-02-2026',
    idFacture: '1001',
  },
];

function DocumentsVendeur() {
  const [recherche, setRecherche] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [tousSelectionnes, setTousSelectionnes] = useState(false);

  const toggleTous = () => {
    if (tousSelectionnes) {
      setSelectionnes([]);
    } else {
      setSelectionnes(documents.map(d => d.id));
    }
    setTousSelectionnes(!tousSelectionnes);
  };

  const toggleUn = (id: number) => {
    setSelectionnes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const documentsFiltres = documents.filter(d =>
    recherche === '' ||
    d.id.toString().includes(recherche) ||
    d.nomVendeur.toLowerCase().includes(recherche.toLowerCase()) ||
    d.idFacture.includes(recherche)
  );

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '20px 24px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>
            📄 Documents Vendeur
          </h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
            Voici la liste de vos factures automatisées.
          </p>
        </div>

        {/* Carte principale */}
        <div style={{
          backgroundColor: 'white', borderRadius: '10px',
          border: '1px solid #e1e3e5', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>

          {/* Barre filtres */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '2px solid #537373',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            backgroundColor: '#f9fafb',
          }}>
            {/* Gauche : filtre tout + dates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button style={{
                padding: '5px 16px', borderRadius: '20px', fontSize: '12px',
                border: '2px solid #537373', backgroundColor: '#537373',
                color: 'white', fontWeight: '600', cursor: 'pointer',
              }}>
                tout
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666' }}>
                <span>Du</span>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: '6px',
                    padding: '5px 8px', fontSize: '12px', outline: 'none',
                  }}
                />
                <span>au</span>
                <input
                  type="date"
                  value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: '6px',
                    padding: '5px 8px', fontSize: '12px', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Droite : recherche + tri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Rechercher..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: '20px',
                    padding: '6px 14px', fontSize: '12px',
                    outline: 'none', width: '190px',
                    backgroundColor: 'white',
                  }}
                />
              </div>
              <button style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                color: '#537373', fontSize: '16px',
              }}>↕</button>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '130px' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#537373' }}>
                <th style={{ padding: '11px 10px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={tousSelectionnes}
                    onChange={toggleTous}
                    style={{ cursor: 'pointer', accentColor: 'white' }}
                  />
                </th>
                {[
                  'ID', 'NOM DU VENDEUR', 'FACTURE DE', 'FACTURE À',
                  'DATE DE CRÉATION', 'ID DE FACTURE', 'ACTION'
                ].map((col, i) => (
                  <th key={i} style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'white',
                    borderRight: '1px solid #6a8f8f',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documentsFiltres.map((doc, index) => (
                <tr
                  key={doc.id}
                  style={{
                    backgroundColor: selectionnes.includes(doc.id)
                      ? '#f0f5f5'
                      : index % 2 === 0 ? 'white' : '#fafafa',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!selectionnes.includes(doc.id))
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f9f9';
                  }}
                  onMouseLeave={e => {
                    if (!selectionnes.includes(doc.id))
                      (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa';
                  }}
                >
                  <td style={{ padding: '11px 10px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <input
                      type="checkbox"
                      checked={selectionnes.includes(doc.id)}
                      onChange={() => toggleUn(doc.id)}
                      style={{ cursor: 'pointer', accentColor: '#537373' }}
                    />
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '600', color: '#537373', borderBottom: '1px solid #f0f0f0' }}>
                    {doc.id}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: '#537373', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {doc.nomVendeur.charAt(0).toUpperCase()}
                      </div>
                      <span>{doc.nomVendeur}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                    {doc.facturedDe}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                    {doc.factureA}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{
                      backgroundColor: '#EAF4FB', color: '#1A6FA0',
                      border: '1px solid #AED6F1', padding: '3px 10px',
                      borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                    }}>
                      📅 {doc.dateCreation}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '600', color: '#537373', borderBottom: '1px solid #f0f0f0' }}>
                    #{doc.idFacture}
                  </td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <button style={{
                      backgroundColor: '#537373', color: 'white',
                      border: 'none', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '11px',
                      cursor: 'pointer', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      🖨️ Imprimer la facture
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documentsFiltres.length === 0 && (
            <div style={{ padding: '50px', textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontSize: '14px' }}>Aucun document trouvé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentsVendeur;
