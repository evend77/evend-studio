import React, { useState } from 'react';

const collections = [
  { id: 1214911, nom: 'Couture & Tricot – Fournitures et Matériaux' },
  { id: 1214910, nom: 'Vidéos numériques (formations, tutoriels, contenus)' },
  { id: 1214907, nom: 'Templates & modèles numériques' },
  { id: 1214905, nom: 'Outils business & marketing numériques' },
  { id: 1214904, nom: 'Jeux & contenus interactifs (numérique)' },
  { id: 1214903, nom: 'Images & photos numériques' },
  { id: 1214901, nom: 'Documents PDF (ebooks, guides, rapports)' },
  { id: 1214899, nom: 'Cours & formations en ligne' },
  { id: 1214897, nom: 'Audio (musique, podcasts, méditations)' },
  { id: 1214896, nom: 'Applications & logiciels' },
  { id: 1214893, nom: 'Accès membres & contenus privés' },
  { id: 1212220, nom: 'Écusson / Patch' },
  { id: 1210529, nom: "Décoration d'Halloween" },
  { id: 1210528, nom: 'Décoration de Noël' },
  { id: 1184978, nom: 'Anneaux ou bagues surprise' },
  { id: 1184977, nom: 'Bijoux fantaisie' },
  { id: 1184976, nom: 'Accessoires de mode' },
  { id: 1184975, nom: 'Gadgets et accessoires' },
  { id: 1184974, nom: 'Farces et attrapes' },
  { id: 1184973, nom: 'Cartes de voeux' },
];

function Collections() {
  const [recherche, setRecherche] = useState('');
  const [parPage, setParPage] = useState(15);
  const [page, setPage] = useState(1);

  const collectionsFiltrees = collections.filter(c =>
    recherche === '' ||
    c.id.toString().includes(recherche) ||
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(collectionsFiltrees.length / parPage);
  const collectionsPaginees = collectionsFiltrees.slice((page - 1) * parPage, page * parPage);

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '20px 24px' }}>

        {/* Fil d'Ariane */}
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
          Produits / <span style={{ color: '#537373', fontWeight: '600' }}>COLLECTIONS</span>
        </p>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>
              🗂️ Collections
            </h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Voici toutes les collections de votre boutique.
            </p>
          </div>
          <button style={{
            backgroundColor: '#537373', color: 'white',
            border: 'none', borderRadius: '6px',
            padding: '9px 16px', fontSize: '12px',
            fontWeight: '600', cursor: 'pointer',
          }}>
            📥 COLLECTIONS D'EXPORTATION
          </button>
        </div>

        {/* Tableau */}
        <div style={{
          backgroundColor: 'white', borderRadius: '10px',
          border: '1px solid #e1e3e5', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>

          {/* Onglet + recherche */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '0 16px',
            borderBottom: '1px solid #e1e3e5', flexWrap: 'wrap', gap: '8px',
          }}>
            <div style={{ display: 'flex' }}>
              <button style={{
                padding: '12px 16px', border: 'none',
                borderBottom: '3px solid #537373',
                backgroundColor: 'transparent',
                color: '#537373', fontWeight: '700',
                fontSize: '13px', cursor: 'pointer',
              }}>
                Tout
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Rechercher une collection..."
                  value={recherche}
                  onChange={e => { setRecherche(e.target.value); setPage(1); }}
                  style={{
                    border: '1px solid #ddd', borderRadius: '20px',
                    padding: '6px 14px', fontSize: '12px',
                    outline: 'none', width: '220px',
                  }}
                />
              </div>
              <button style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
              }}>↕</button>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '150px' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#537373' }}>
                <th style={{
                  padding: '12px 20px', textAlign: 'center',
                  fontSize: '11px', fontWeight: '700', color: 'white',
                  borderRight: '1px solid #6a8f8f',
                }}>
                  #ID
                </th>
                <th style={{
                  padding: '12px 20px', textAlign: 'center',
                  fontSize: '11px', fontWeight: '700', color: 'white',
                  borderRight: '1px solid #6a8f8f',
                }}>
                  NOM DE LA COLLECTION
                </th>
                <th style={{
                  padding: '12px 20px', textAlign: 'center',
                  fontSize: '11px', fontWeight: '700', color: 'white',
                }}>
                  STATUT
                </th>
              </tr>
            </thead>
            <tbody>
              {collectionsPaginees.map((collection, index) => (
                <tr
                  key={collection.id}
                  style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f5f5'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa'}
                >
                  <td style={{
                    padding: '12px 20px', textAlign: 'center',
                    fontSize: '13px', fontWeight: '600', color: '#537373',
                    borderBottom: '1px solid #f0f0f0',
                    borderRight: '1px solid #f0f0f0',
                  }}>
                    {collection.id}
                  </td>
                  <td style={{
                    padding: '12px 20px', textAlign: 'center',
                    fontSize: '13px', borderBottom: '1px solid #f0f0f0',
                    borderRight: '1px solid #f0f0f0',
                  }}>
                    {collection.nom}
                  </td>
                  <td style={{
                    padding: '12px 20px', textAlign: 'center',
                    borderBottom: '1px solid #f0f0f0',
                  }}>
                    <span style={{
                      backgroundColor: '#E9F7EF', color: '#1E8449',
                      border: '1px solid #27AE60', padding: '3px 12px',
                      borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      letterSpacing: '0.5px',
                    }}>
                      ✓ ACTIVÉ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {collectionsPaginees.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p>Aucune collection trouvée.</p>
            </div>
          )}

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666' }}>
              <span>par page</span>
              <select
                value={parPage}
                onChange={e => { setParPage(Number(e.target.value)); setPage(1); }}
                style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666' }}>
              <span>page: {page} / {totalPages || 1}</span>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  border: '1px solid #ddd', borderRadius: '4px',
                  padding: '4px 10px', backgroundColor: 'white',
                  color: page === 1 ? '#ccc' : '#537373',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >‹</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  border: '1px solid #ddd', borderRadius: '4px',
                  padding: '4px 10px', backgroundColor: 'white',
                  color: page >= totalPages ? '#ccc' : '#537373',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Collections;
