// CommandesBrouillons.tsx
import React, { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================
interface DraftOrder {
  id: number;
  noCommandeEvend: string;
  nomCommande: string;
  montant: number;
  emailClient: string;
  nomClient: string;
  date: string;
  statut: 'brouillon' | 'facture_envoyee' | 'payee' | 'expediee';
}

interface Client {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  province: string;
  code_postal: string;
}

interface Produit {
  id: number;
  nom: string;
  prix: number;
  sku: string;
  stock: number;
}

interface PanierItem {
  id: string;
  produitId: number;
  nom: string;
  prix: number;
  quantite: number;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
function CommandesBrouillons() {
  const [brouillons, setBrouillons] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [modalCreationOuverte, setModalCreationOuverte] = useState(false);
  const [modalVoirOuverte, setModalVoirOuverte] = useState(false);
  const [brouillonSelectionne, setBrouillonSelectionne] = useState<DraftOrder | null>(null);

  // Charger les brouillons depuis la BD
  const chargerBrouillons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendeur/brouillons');
      const data = await res.json();
      setBrouillons(data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerBrouillons();
  }, []);

  const brouillonsFiltres = brouillons.filter(b =>
    recherche === '' ||
    b.id.toString().includes(recherche) ||
    b.noCommandeEvend.includes(recherche) ||
    b.nomClient.toLowerCase().includes(recherche.toLowerCase()) ||
    b.emailClient.toLowerCase().includes(recherche.toLowerCase())
  );

  const getBadgeStyle = (statut: string) => {
    const styles: any = {
      brouillon: { backgroundColor: '#FEF3E2', color: '#E67E22', texte: 'Brouillon' },
      facture_envoyee: { backgroundColor: '#E8F8F5', color: '#1ABC9C', texte: 'Facture envoyée' },
      payee: { backgroundColor: '#E8F8F5', color: '#27AE60', texte: 'Payée' },
      expediee: { backgroundColor: '#EBF5FB', color: '#3498DB', texte: 'Expédiée' },
    };
    return styles[statut] || styles.brouillon;
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* ============================================ */}
      {/* HEADER MOBILE */}
      {/* ============================================ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e1e3e5',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <button onClick={() => setMenuMobileOuvert(true)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>☰</button>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>e-Vend.ca</h2>
        <div style={{ width: 24 }} />
      </div>

      {/* ============================================ */}
      {/* MENU MOBILE */}
      {/* ============================================ */}
      {menuMobileOuvert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000
        }} onClick={() => setMenuMobileOuvert(false)}>
          <div style={{
            width: 280, height: '100%', backgroundColor: 'white',
            padding: 20, overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#537373' }}>e-Vend.ca</h3>
              <button onClick={() => setMenuMobileOuvert(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Tableau De Bord', 'Configuration', 'Vos Annonces',
                'Vos Commandes', 'Profil', 'Guides', 'Créer Une Annonce'
              ].map(item => (
                <div key={item} style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  backgroundColor: item === 'Vos Commandes' ? '#f0f5f5' : 'transparent',
                  color: item === 'Vos Commandes' ? '#537373' : '#333',
                  fontWeight: item === 'Vos Commandes' ? 600 : 400
                }}>{item}</div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CONTENU PRINCIPAL */}
      {/* ============================================ */}
      <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Fil d'Ariane */}
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Commandes / <span style={{ color: '#537373', fontWeight: 600 }}>Brouillons des commandes</span>
        </div>

        {/* En-tête avec bouton création */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0' }}>Brouillons des commandes</h1>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Voici la liste de tous les brouillons de commandes.</p>
          </div>
          <button
            onClick={() => setModalCreationOuverte(true)}
            style={{
              backgroundColor: '#537373', color: 'white', border: 'none',
              borderRadius: 6, padding: '10px 20px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 8
            }}
          >
            <span>➕</span> CRÉER UN PROJET DE COMMANDE
          </button>
        </div>

        {/* Filtres et recherche */}
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e1e3e5', marginBottom: 20 }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #e1e3e5',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                padding: '4px 14px', borderRadius: 4, fontSize: 12,
                border: '2px solid #537373', backgroundColor: '#537373',
                color: 'white', fontWeight: 600, cursor: 'pointer'
              }}>tout</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="rechercher des éléments"
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: 6,
                    padding: '6px 30px 6px 32px', fontSize: 12,
                    outline: 'none', width: 220
                  }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
              </div>
              <button style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>⊞</button>
              <button style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>↕</button>
            </div>
          </div>

          {/* TABLEAU RESPONSIVE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: '#537373' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>No. de commande e-Vend</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>NOM DE LA COMMANDE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>MONTANT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>E-MAIL CLIENT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>NOM DU CLIENT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>DATE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white', borderRight: '1px solid #6a8f8f' }}>STATUT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'white' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Chargement...</td></tr>
                ) : (
                  brouillonsFiltres.map((b, index) => {
                    const badge = getBadgeStyle(b.statut);
                    return (
                      <tr key={b.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#537373' }}>{b.id}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>{b.noCommandeEvend}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#537373' }}>{b.nomCommande}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>${b.montant.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0', color: '#537373' }}>{b.emailClient}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>{b.nomClient}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, borderBottom: '1px solid #f0f0f0', color: '#666' }}>{b.date}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: badge.backgroundColor, color: badge.color }}>{badge.texte}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>
                          <button
                            onClick={() => { setBrouillonSelectionne(b); setModalVoirOuverte(true); }}
                            style={{
                              backgroundColor: 'transparent', border: '1px solid #537373',
                              color: '#537373', borderRadius: 4, padding: '4px 10px',
                              fontSize: 11, cursor: 'pointer', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <span>👁️</span> Voir
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && brouillonsFiltres.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>Aucun brouillon trouvé.</div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL CRÉER UN PROJET DE COMMANDE */}
      {/* ============================================ */}
      {modalCreationOuverte && (
        <ModalCreationCommande onClose={() => setModalCreationOuverte(false)} onSuccess={chargerBrouillons} />
      )}

      {/* ============================================ */}
      {/* MODAL VOIR LE BROUILLON */}
      {/* ============================================ */}
      {modalVoirOuverte && brouillonSelectionne && (
        <ModalVoirBrouillon commande={brouillonSelectionne} onClose={() => setModalVoirOuverte(false)} />
      )}
    </div>
  );
}

// ============================================
// MODAL CRÉATION DE COMMANDE
// ============================================
function ModalCreationCommande({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [etape, setEtape] = useState<'client' | 'produits' | 'paiement'>('client');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [rechercheClient, setRechercheClient] = useState('');
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [nouveauClient, setNouveauClient] = useState({
    prenom: '', nom: '', email: '', telephone: '', adresse: '', ville: '', province: '', code_postal: ''
  });

  useEffect(() => {
    fetch('/api/vendeur/clients').then(res => res.json()).then(setClients).catch(console.error);
    fetch('/api/vendeur/produits').then(res => res.json()).then(setProduits).catch(console.error);
  }, []);

  const clientsFiltres = clients.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(rechercheClient.toLowerCase()) ||
    c.email.toLowerCase().includes(rechercheClient.toLowerCase())
  );

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(rechercheProduit.toLowerCase()) ||
    p.sku.toLowerCase().includes(rechercheProduit.toLowerCase())
  );

  const ajouterProduit = (produit: Produit) => {
    const existant = panier.find(p => p.produitId === produit.id);
    if (existant) {
      setPanier(panier.map(p => p.produitId === produit.id ? { ...p, quantite: p.quantite + 1 } : p));
    } else {
      setPanier([...panier, {
        id: Date.now().toString(),
        produitId: produit.id,
        nom: produit.nom,
        prix: produit.prix,
        quantite: 1
      }]);
    }
  };

  const modifierQuantite = (id: string, delta: number) => {
    setPanier(panier.map(item => {
      if (item.id === id) {
        const nouvelleQuantite = Math.max(0, item.quantite + delta);
        return nouvelleQuantite === 0 ? null : { ...item, quantite: nouvelleQuantite };
      }
      return item;
    }).filter(Boolean) as PanierItem[]);
  };

  const sousTotal = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
  const taxes = sousTotal * 0.14975;
  const total = sousTotal + taxes;

  const creerCommande = async () => {
    if (!clientSelectionne) return alert('Sélectionnez un client');
    if (panier.length === 0) return alert('Ajoutez au moins un produit');

    setLoading(true);
    try {
      const res = await fetch('/api/vendeur/brouillons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientSelectionne.id,
          articles: panier.map(p => ({ produit_id: p.produitId, quantite: p.quantite, prix: p.prix })),
          sous_total: sousTotal,
          taxes: taxes,
          total: total
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Erreur lors de la création');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const creerClient = async () => {
    if (!nouveauClient.prenom || !nouveauClient.nom || !nouveauClient.email) {
      return alert('Champs obligatoires manquants');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vendeur/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouveauClient)
      });
      if (res.ok) {
        const cree = await res.json();
        setClients([...clients, cree]);
        setClientSelectionne(cree);
        setShowNewClientForm(false);
        setNouveauClient({ prenom: '', nom: '', email: '', telephone: '', adresse: '', ville: '', province: '', code_postal: '' });
      } else {
        alert('Erreur création client');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 12, width: '100%',
        maxWidth: 1200, maxHeight: '90vh', overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e1e3e5',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Créer un projet de commande</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Commande manuelle pour téléphone / email</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Étapes */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e1e3e5', backgroundColor: '#fafafa' }}>
          {['client', 'produits', 'paiement'].map((e, idx) => (
            <div key={e} onClick={() => setEtape(e as any)} style={{
              flex: 1, padding: 12, textAlign: 'center', cursor: 'pointer',
              backgroundColor: etape === e ? 'white' : '#fafafa',
              borderBottom: etape === e ? '2px solid #537373' : 'none',
              fontWeight: etape === e ? 600 : 400,
              color: etape === e ? '#537373' : '#666'
            }}>
              {idx + 1}. {e.toUpperCase()}
            </div>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {/* ÉTAPE 1: CLIENT */}
          {etape === 'client' && (
            !showNewClientForm ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Sélectionner un client</h3>
                  <button onClick={() => setShowNewClientForm(true)} style={{
                    backgroundColor: '#537373', color: 'white', border: 'none',
                    borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer'
                  }}>➕ Créer un client</button>
                </div>

                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
                  <input type="text" placeholder="Rechercher un client" value={rechercheClient}
                    onChange={e => setRechercheClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #ddd', borderRadius: 8 }} />
                </div>

                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {clientsFiltres.map(c => (
                    <div key={c.id} onClick={() => setClientSelectionne(c)} style={{
                      padding: 12, border: `1px solid ${clientSelectionne?.id === c.id ? '#537373' : '#e1e3e5'}`,
                      borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                      backgroundColor: clientSelectionne?.id === c.id ? '#f0f5f5' : 'white'
                    }}>
                      <div style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{c.email}</div>
                    </div>
                  ))}
                </div>

                {clientSelectionne && (
                  <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>Client:</strong> {clientSelectionne.prenom} {clientSelectionne.nom}</div>
                    <button onClick={() => setEtape('produits')} style={{
                      backgroundColor: '#537373', color: 'white', border: 'none',
                      borderRadius: 6, padding: '8px 20px', cursor: 'pointer'
                    }}>Continuer →</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>Créer un nouveau client</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <input placeholder="Prénom *" value={nouveauClient.prenom} onChange={e => setNouveauClient({...nouveauClient, prenom: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Nom *" value={nouveauClient.nom} onChange={e => setNouveauClient({...nouveauClient, nom: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Email *" value={nouveauClient.email} onChange={e => setNouveauClient({...nouveauClient, email: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Téléphone" value={nouveauClient.telephone} onChange={e => setNouveauClient({...nouveauClient, telephone: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Adresse" value={nouveauClient.adresse} onChange={e => setNouveauClient({...nouveauClient, adresse: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Ville" value={nouveauClient.ville} onChange={e => setNouveauClient({...nouveauClient, ville: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Province" value={nouveauClient.province} onChange={e => setNouveauClient({...nouveauClient, province: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                  <input placeholder="Code postal" value={nouveauClient.code_postal} onChange={e => setNouveauClient({...nouveauClient, code_postal: e.target.value})} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNewClientForm(false)} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={creerClient} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{loading ? 'Création...' : 'Créer'}</button>
                </div>
              </>
            )
          )}

          {/* ÉTAPE 2: PRODUITS */}
          {etape === 'produits' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
                  <input placeholder="Rechercher un produit" value={rechercheProduit}
                    onChange={e => setRechercheProduit(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #ddd', borderRadius: 8 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Liste des produits */}
                <div style={{ border: '1px solid #e1e3e5', borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
                  <div style={{ padding: 12, backgroundColor: '#fafafa', borderBottom: '1px solid #e1e3e5', fontWeight: 600 }}>Produits</div>
                  {produitsFiltres.map(p => (
                    <div key={p.id} onClick={() => ajouterProduit(p)} style={{
                      padding: 12, borderBottom: '1px solid #e1e3e5', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.nom}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>SKU: {p.sku} | Stock: {p.stock}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#537373' }}>${p.prix.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Panier */}
                <div style={{ border: '1px solid #e1e3e5', borderRadius: 8 }}>
                  <div style={{ padding: 12, backgroundColor: '#fafafa', borderBottom: '1px solid #e1e3e5', fontWeight: 600 }}>Panier</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {panier.map(item => (
                      <div key={item.id} style={{ padding: 12, borderBottom: '1px solid #e1e3e5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{item.nom}</div>
                            <div style={{ fontSize: 11, color: '#666' }}>${item.prix.toFixed(2)}</div>
                          </div>
                          <button onClick={() => modifierQuantite(item.id, -Infinity)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                          <button onClick={() => modifierQuantite(item.id, -1)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>-</button>
                          <span>{item.quantite}</span>
                          <button onClick={() => modifierQuantite(item.id, 1)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>+</button>
                          <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#537373' }}>${(item.prix * item.quantite).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {panier.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Panier vide</div>}
                  <div style={{ padding: 12, borderTop: '1px solid #e1e3e5', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sous-total</span><span>${sousTotal.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}><span>Taxes (TVQ+TPS)</span><span>${taxes.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 16, borderTop: '1px solid #ddd', paddingTop: 8, marginTop: 4 }}>
                      <span>Total</span><span style={{ color: '#537373' }}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setEtape('client')} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>← Retour</button>
                <button onClick={() => setEtape('paiement')} disabled={panier.length === 0} style={{
                  padding: '10px 20px', backgroundColor: '#537373', color: 'white',
                  border: 'none', borderRadius: 6, cursor: panier.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: panier.length === 0 ? 0.5 : 1
                }}>Continuer →</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: PAIEMENT */}
          {etape === 'paiement' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h3>Résumé de la commande</h3>
                  <div style={{ backgroundColor: '#fafafa', borderRadius: 8, padding: 16 }}>
                    <div><strong>Client:</strong> {clientSelectionne?.prenom} {clientSelectionne?.nom}</div>
                    <div><strong>Email:</strong> {clientSelectionne?.email}</div>
                    <hr style={{ margin: '12px 0' }} />
                    {panier.map(i => (
                      <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span>{i.quantite}x {i.nom}</span>
                        <span>${(i.prix * i.quantite).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sous-total</span><span>${sousTotal.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}><span>Taxes</span><span>${taxes.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 12, paddingTop: 12, borderTop: '2px solid #ddd' }}>
                      <span>TOTAL</span><span style={{ color: '#537373' }}>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <input type="checkbox" /> Autoriser les codes de réduction lors du paiement
                    </label>
                    <textarea rows={3} placeholder="Note (optionnel)..." style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
                  </div>
                </div>

                <div>
                  <h3>Tags</h3>
                  <input placeholder="Entrez les tags ici" style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e1e3e5', paddingTop: 20 }}>
                <button onClick={() => setEtape('produits')} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>← Retour</button>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={creerCommande} disabled={loading} style={{
                    padding: '10px 24px', backgroundColor: '#27AE60', color: 'white',
                    border: 'none', borderRadius: 6, cursor: 'pointer'
                  }}>{loading ? 'Création...' : '💾 Créer le brouillon'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODAL VOIR LE BROUILLON
// ============================================
function ModalVoirBrouillon({ commande, onClose }: { commande: DraftOrder; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendeur/brouillons/${commande.id}`)
      .then(res => res.json())
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [commande.id]);

  const badge = (commande.statut === 'brouillon') ? { bg: '#FEF3E2', color: '#E67E22', texte: 'Brouillon' } : { bg: '#E8F8F5', color: '#1ABC9C', texte: 'Facture envoyée' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Détails du brouillon</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>Chargement...</div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#537373' }}>Commande #{commande.noCommandeEvend}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                  <div><strong>Date:</strong> {commande.date}</div>
                  <div><strong>Statut:</strong> <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>{badge.texte}</span></div>
                  <div><strong>Client:</strong> {commande.nomClient}</div>
                  <div><strong>Email:</strong> {commande.emailClient}</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4>Articles</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Qté</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Prix</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details?.articles?.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 8 }}>{item.nom}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{item.quantite}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>${item.prix.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>${(item.prix * item.quantite).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: '#fafafa', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sous-total</span><span>${(commande.montant / 1.14975).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Taxes</span><span>${(commande.montant - (commande.montant / 1.14975)).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
                  <span>TOTAL</span><span style={{ color: '#537373' }}>${commande.montant.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e5', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer' }}>Fermer</button>
          <button style={{ padding: '8px 16px', backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>📧 Envoyer la facture</button>
        </div>
      </div>
    </div>
  );
}

export default CommandesBrouillons;