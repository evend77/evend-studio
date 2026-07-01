import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const getToken = () => localStorage.getItem('token');

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
interface Badge {
  id: string;
  nom: string;
  icone?: string;
  couleur?: string;
  niveau?: number;
  statut: string;
}

interface Vendeur {
  id: number;
  nom: string;
  email?: string;
  boutique?: string;
}

interface VendeurAvecBadges {
  vendeur_id: number;
  vendeur_nom: string;
  vendeur_email?: string;
  boutique_nom?: string;
  badges: Badge[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL ATTRIBUER / MODIFIER BADGE
// ─────────────────────────────────────────────────────────────────────────────
function ModalAttribuerBadge({
  isOpen,
  vendeurPreselectionne,
  badgesPreselectionnes,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  vendeurPreselectionne: VendeurAvecBadges | null;
  badgesPreselectionnes: string[];
  onClose: () => void;
  onSave: (vendeurId: number, badgeIds: string[]) => void;
}) {
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [vendeurSelectionne, setVendeurSelectionne] = useState<number | null>(null);
  const [badgesSelectionnes, setBadgesSelectionnes] = useState<string[]>([]);
  const [searchVendeur, setSearchVendeur] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const token = getToken();
    setLoading(true);

    Promise.all([
      fetch('https://evend-multivendeur-api.onrender.com/api/vendeurs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('https://evend-multivendeur-api.onrender.com/api/badges', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([v, b]) => {
        setVendeurs(Array.isArray(v) ? v : []);
        setBadges(Array.isArray(b) ? b.filter((x: Badge) => x.statut === 'actif') : []);
      })
      .catch(err => console.error('Erreur chargement modal:', err))
      .finally(() => setLoading(false));

    if (vendeurPreselectionne) {
      setVendeurSelectionne(vendeurPreselectionne.vendeur_id);
      setBadgesSelectionnes(badgesPreselectionnes);
    } else {
      setVendeurSelectionne(null);
      setBadgesSelectionnes([]);
    }
    setSearchVendeur('');
  }, [isOpen, vendeurPreselectionne, badgesPreselectionnes]);

  if (!isOpen) return null;

  const vendeursFiltres = vendeurs.filter(v =>
    (v.nom || '').toLowerCase().includes(searchVendeur.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchVendeur.toLowerCase())
  );

  const toggleBadge = (id: string) => {
    setBadgesSelectionnes(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!vendeurSelectionne) {
      alert('Veuillez sélectionner un vendeur');
      return;
    }
    onSave(vendeurSelectionne, badgesSelectionnes);
  };

  const isModification = vendeurPreselectionne !== null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%',
        maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #245a8a 100%)`,
          padding: '20px 24px', color: 'white', flexShrink: 0
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            {isModification ? '✏️ Modifier les badges du vendeur' : '🎖️ Attribuer un badge à un vendeur'}
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            {isModification
              ? `Modification des badges de ${vendeurPreselectionne?.vendeur_nom}`
              : 'Sélectionnez un vendeur puis les badges à lui attribuer'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            Chargement...
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* Section Vendeur */}
            <div style={{
              width: '50%', borderRight: `1px solid ${THEME.border}`,
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 10px 0' }}>
                  👤 Choisir un vendeur
                </p>
                <input
                  type="text"
                  value={searchVendeur}
                  onChange={e => setSearchVendeur(e.target.value)}
                  placeholder="🔍 Rechercher un vendeur..."
                  disabled={isModification}
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: `1px solid ${THEME.border}`, borderRadius: '8px',
                    fontSize: '12px', outline: 'none', boxSizing: 'border-box',
                    backgroundColor: isModification ? '#f3f4f6' : 'white',
                    color: isModification ? THEME.textLight : THEME.text,
                  }}
                />
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                {vendeursFiltres.length === 0 ? (
                  <p style={{ textAlign: 'center', color: THEME.textLight, fontSize: '12px', padding: '20px' }}>
                    Aucun vendeur trouvé
                  </p>
                ) : (
                  vendeursFiltres.map(v => (
                    <div
                      key={v.id}
                      onClick={() => !isModification && setVendeurSelectionne(v.id)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
                        cursor: isModification ? 'default' : 'pointer',
                        backgroundColor: vendeurSelectionne === v.id ? THEME.accentLight : 'transparent',
                        border: `2px solid ${vendeurSelectionne === v.id ? THEME.accent : 'transparent'}`,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isModification && vendeurSelectionne !== v.id) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={e => { if (vendeurSelectionne !== v.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: THEME.accent + '20',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '800', color: THEME.accent, flexShrink: 0
                        }}>
                          {(v.nom || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.text }}>{v.nom}</p>
                          {v.email && <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{v.email}</p>}
                        </div>
                        {vendeurSelectionne === v.id && (
                          <span style={{ marginLeft: 'auto', color: THEME.accent, fontSize: '16px' }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section Badges */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>
                  🎖️ Choisir les badges
                  {badgesSelectionnes.length > 0 && (
                    <span style={{
                      marginLeft: '8px', backgroundColor: THEME.accent, color: 'white',
                      borderRadius: '12px', padding: '2px 8px', fontSize: '11px'
                    }}>
                      {badgesSelectionnes.length} sélectionné{badgesSelectionnes.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                {badges.length === 0 ? (
                  <p style={{ textAlign: 'center', color: THEME.textLight, fontSize: '12px', padding: '20px' }}>
                    Aucun badge actif trouvé
                  </p>
                ) : (
                  badges.map(b => {
                    const selected = badgesSelectionnes.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => toggleBadge(b.id)}
                        style={{
                          padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
                          cursor: 'pointer',
                          backgroundColor: selected ? THEME.accentLight : 'transparent',
                          border: `2px solid ${selected ? THEME.accent : 'transparent'}`,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            backgroundColor: b.couleur || '#FFD700',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', flexShrink: 0
                          }}>
                            {b.icone || '🏆'}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.text }}>{b.nom}</p>
                            {b.niveau && <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Niveau {b.niveau}</p>}
                          </div>
                          {selected && (
                            <span style={{ marginLeft: 'auto', color: THEME.accent, fontSize: '16px' }}>✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${THEME.border}`,
          backgroundColor: '#fafafa', display: 'flex', gap: '12px',
          justifyContent: 'flex-end', flexShrink: 0
        }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', backgroundColor: 'white', border: `1px solid ${THEME.border}`,
            borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>Annuler</button>
          <button onClick={handleSave} style={{
            padding: '10px 24px', backgroundColor: THEME.accent, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
          }}>
            {isModification ? '✅ Enregistrer les modifications' : '✅ Attribuer les badges'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONFIRMATION SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────
function ModalConfirmSuppression({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%',
        maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', backgroundColor: '#fee2e2', borderBottom: `2px solid ${THEME.danger}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#991b1b' }}>
            🗑️ Confirmer la suppression
          </h3>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Cette action est irréversible</p>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: THEME.text, margin: '0 0 24px 0' }}>{message}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{
              padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px',
              backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '600', cursor: 'pointer'
            }}>Annuler</button>
            <button onClick={onConfirm} style={{
              padding: '10px 20px', border: 'none', borderRadius: '8px',
              backgroundColor: THEME.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>🗑️ Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function BadgesAttitres() {
  const [vendeurs, setVendeurs] = useState<VendeurAvecBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');

  // Sélection en masse
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [menuMasseOuvert, setMenuMasseOuvert] = useState(false);

  // Menu 3 points
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  // Modal attribuer/modifier
  const [modalAttribuerOuvert, setModalAttribuerOuvert] = useState(false);
  const [vendeurEnCours, setVendeurEnCours] = useState<VendeurAvecBadges | null>(null);
  const [badgesPreselectionnes, setBadgesPreselectionnes] = useState<string[]>([]);

  // Modal suppression
  const [modalSupprOuvert, setModalSupprOuvert] = useState(false);
  const [messageSuppr, setMessageSuppr] = useState('');
  const [actionSuppr, setActionSuppr] = useState<() => void>(() => {});

  // ─── Chargement ───
  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/vendeurs/badges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setVendeurs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      log.erreur('Erreur chargement badges attribués', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
    log.admin('Page visitée', 'Badges attribués');
  }, []);

  // ─── Filtrage ───
  const vendeursFiltres = vendeurs.filter(v =>
    (v.vendeur_nom || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (v.boutique_nom || '').toLowerCase().includes(recherche.toLowerCase())
  );

  // ─── Sélection ───
  const toggleSelection = (id: number) => {
    setSelectionnes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleTout = () => {
    if (selectionnes.length === vendeursFiltres.length) {
      setSelectionnes([]);
    } else {
      setSelectionnes(vendeursFiltres.map(v => v.vendeur_id));
    }
  };

  // ─── Menu 3 points ───
  const handleMenuClick = (e: React.MouseEvent, vendeurId: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 240;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth) left = rect.right - menuWidth;
    setMenuPosition({ left, top: rect.bottom + 5 });
    setMenuOuvert(vendeurId);
  };

  // ─── Attribuer / Modifier badges ───
  const ouvrirModalAttribuer = () => {
    setVendeurEnCours(null);
    setBadgesPreselectionnes([]);
    setModalAttribuerOuvert(true);
  };

  const ouvrirModalModifier = (vendeur: VendeurAvecBadges) => {
    setVendeurEnCours(vendeur);
    setBadgesPreselectionnes(vendeur.badges.map(b => b.id));
    setModalAttribuerOuvert(true);
    setMenuOuvert(null);
    setMenuPosition(null);
  };

  const handleSauvegardeBadges = async (vendeurId: number, badgeIds: string[]) => {
    try {
      const token = getToken();
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeurId}/badges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ badge_ids: badgeIds }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Erreur ${response.status}`);
      }
      alert('✅ Badges mis à jour avec succès !');
      setModalAttribuerOuvert(false);
      chargerDonnees();
      log.admin('Badges attribués', `Vendeur ID ${vendeurId} - ${badgeIds.length} badge(s)`);
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // ─── Suppression ───
  const demanderSuppressionVendeur = (vendeur: VendeurAvecBadges) => {
    setMenuOuvert(null);
    setMenuPosition(null);
    setMessageSuppr(`Voulez-vous vraiment supprimer tous les badges de ${vendeur.vendeur_nom} ?`);
    setActionSuppr(() => async () => {
      try {
        const token = getToken();
        const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.vendeur_id}/badges`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        setModalSupprOuvert(false);
        alert(`✅ Badges de ${vendeur.vendeur_nom} supprimés`);
        chargerDonnees();
        log.admin('Badges supprimés', `Vendeur ${vendeur.vendeur_nom}`);
      } catch (err) {
        alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    });
    setModalSupprOuvert(true);
  };

  const demanderSuppressionMasse = () => {
    setMenuMasseOuvert(false);
    const noms = vendeurs
      .filter(v => selectionnes.includes(v.vendeur_id))
      .map(v => v.vendeur_nom)
      .join(', ');
    setMessageSuppr(`Voulez-vous vraiment supprimer tous les badges de ${selectionnes.length} vendeur(s) : ${noms} ?`);
    setActionSuppr(() => async () => {
      try {
        const token = getToken();
        await Promise.all(
          selectionnes.map(id =>
            fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${id}/badges`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        setModalSupprOuvert(false);
        setSelectionnes([]);
        alert(`✅ Badges supprimés pour ${selectionnes.length} vendeur(s)`);
        chargerDonnees();
        log.admin('Badges supprimés en masse', `${selectionnes.length} vendeur(s)`);
      } catch (err) {
        alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    });
    setModalSupprOuvert(true);
  };

  const ouvrirModificationMasse = () => {
    setMenuMasseOuvert(false);
    // Pour la modification en masse, on ouvre le modal sans vendeur préselectionné
    // mais on bloque la sélection de vendeur (on modifiera tous les sélectionnés)
    setVendeurEnCours(null);
    setBadgesPreselectionnes([]);
    setModalAttribuerOuvert(true);
  };

  // ─── Stats ───
  const totalBadgesAttribues = vendeurs.reduce((acc, v) => acc + v.badges.length, 0);
  const vendeursAvecBadges = vendeurs.filter(v => v.badges.length > 0).length;

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '24px 28px', backgroundColor: THEME.bg, minHeight: '100vh' }}
      onClick={() => { setMenuOuvert(null); setMenuPosition(null); setMenuMasseOuvert(false); }}
    >
      {/* Modals */}
      <ModalAttribuerBadge
        isOpen={modalAttribuerOuvert}
        vendeurPreselectionne={vendeurEnCours}
        badgesPreselectionnes={badgesPreselectionnes}
        onClose={() => { setModalAttribuerOuvert(false); setVendeurEnCours(null); }}
        onSave={handleSauvegardeBadges}
      />

      {modalSupprOuvert && (
        <ModalConfirmSuppression
          message={messageSuppr}
          onConfirm={actionSuppr}
          onCancel={() => setModalSupprOuvert(false)}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Badges attribués
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: '4px 0 0 0' }}>
            Gestion des badges par vendeur
          </p>
        </div>
        <button
          onClick={ouvrirModalAttribuer}
          style={{
            backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(45,106,159,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#245a8a'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = THEME.accent}
        >
          🎖️ Attribuer un badge à un vendeur
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Vendeurs avec badges', val: String(vendeursAvecBadges), icon: '🏪', color: THEME.accent },
          { label: 'Total badges attribués', val: String(totalBadgesAttribues), icon: '🎖️', color: THEME.success },
          { label: 'Vendeurs sans badge', val: String(vendeurs.length - vendeursAvecBadges), icon: '⏳', color: THEME.warning },
          { label: 'Total vendeurs', val: String(vendeurs.length), icon: '👥', color: THEME.textLight },
        ].map((k, i) => (
          <div key={i} style={{
            backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              fontSize: '24px', width: '40px', height: '40px', borderRadius: '8px',
              backgroundColor: k.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: 0 }}>{k.val}</p>
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barre filtres + actions masse */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un vendeur ou boutique..."
          style={{
            border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', outline: 'none', width: '300px', backgroundColor: 'white'
          }}
        />

        {/* Actions en masse */}
        {selectionnes.length > 0 && (
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuMasseOuvert(prev => !prev)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                cursor: 'pointer', border: `2px solid ${THEME.accent}`,
                backgroundColor: THEME.accentLight, color: THEME.accent, display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              ⚡ Actions ({selectionnes.length} sélectionné{selectionnes.length > 1 ? 's' : ''}) ▾
            </button>

            {menuMasseOuvert && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: '4px',
                backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${THEME.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '220px', overflow: 'hidden'
              }}>
                <MenuItemAction
                  onClick={ouvrirModificationMasse}
                  icon="✏️"
                  label="Modifier les badges"
                />
                <div style={{ height: '1px', backgroundColor: THEME.border }} />
                <MenuItemAction
                  onClick={demanderSuppressionMasse}
                  icon="🗑️"
                  label="Supprimer tous les badges"
                  color={THEME.danger}
                  danger
                />
              </div>
            )}
          </div>
        )}

        <span style={{ fontSize: '12px', color: THEME.textLight, marginLeft: 'auto' }}>
          {vendeursFiltres.length} vendeur{vendeursFiltres.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={{
        backgroundColor: THEME.card, borderRadius: '12px',
        border: `1px solid ${THEME.border}`, overflow: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              <th style={{ padding: '14px 12px', width: '44px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectionnes.length === vendeursFiltres.length && vendeursFiltres.length > 0}
                  onChange={toggleTout}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '60px' }}>ID</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '200px' }}>Vendeur</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '200px' }}>Boutique</th>
              <th style={{ padding: '14px 8px', textAlign: 'left' }}>Badges attribués</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Total</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {vendeursFiltres.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
                  Aucun vendeur trouvé
                </td>
              </tr>
            ) : (
              vendeursFiltres.map((v, i) => (
                <tr key={v.vendeur_id} style={{
                  borderBottom: '1px solid #f5f5f5',
                  backgroundColor: selectionnes.includes(v.vendeur_id)
                    ? THEME.accentLight
                    : i % 2 === 0 ? 'white' : '#fafafa',
                }}>
                  {/* Case à cocher */}
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectionnes.includes(v.vendeur_id)}
                      onChange={() => toggleSelection(v.vendeur_id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>

                  {/* ID */}
                  <td style={{ padding: '14px 8px', fontWeight: '600', color: THEME.textLight, fontSize: '13px' }}>
                    #{v.vendeur_id}
                  </td>

                  {/* Vendeur */}
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        backgroundColor: THEME.accent + '20', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '800', color: THEME.accent
                      }}>
                        {(v.vendeur_nom || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: THEME.text, margin: 0, fontSize: '13px' }}>{v.vendeur_nom}</p>
                        {v.vendeur_email && (
                          <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{v.vendeur_email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Boutique */}
                  <td style={{ padding: '14px 8px', fontSize: '13px', color: THEME.textLight }}>
                    {v.boutique_nom || '—'}
                  </td>

                  {/* Badges */}
                  <td style={{ padding: '14px 8px' }}>
                    {v.badges.length === 0 ? (
                      <span style={{ fontSize: '12px', color: THEME.textLight, fontStyle: 'italic' }}>
                        Aucun badge attribué
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {v.badges.map(b => (
                          <span key={b.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            backgroundColor: (b.couleur || '#FFD700') + '22',
                            border: `1px solid ${b.couleur || '#FFD700'}`,
                            borderRadius: '20px', padding: '3px 10px',
                            fontSize: '11px', fontWeight: '700', color: THEME.text
                          }}>
                            {b.icone || '🏆'} {b.nom}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Total */}
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: v.badges.length > 0 ? THEME.accent : '#e5e7eb',
                      color: v.badges.length > 0 ? 'white' : THEME.textLight,
                      lineHeight: '28px', fontSize: '12px', fontWeight: '800', textAlign: 'center'
                    }}>
                      {v.badges.length}
                    </span>
                  </td>

                  {/* Menu 3 points */}
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => handleMenuClick(e, v.vendeur_id)}
                      style={{
                        background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '4px',
                        padding: '4px 8px', cursor: 'pointer', fontSize: '16px',
                        color: THEME.textLight, fontWeight: '700', lineHeight: 1
                      }}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Menu contextuel 3 points */}
      {menuOuvert !== null && menuPosition && (
        <div style={{
          position: 'fixed', left: menuPosition.left, top: menuPosition.top,
          zIndex: 9999, backgroundColor: 'white', borderRadius: '10px',
          border: `1px solid ${THEME.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '240px', overflow: 'hidden'
        }} onClick={e => e.stopPropagation()}>
          {(() => {
            const vendeur = vendeurs.find(v => v.vendeur_id === menuOuvert);
            if (!vendeur) return null;
            return (
              <div style={{ padding: '4px 0' }}>
                <MenuItemAction
                  onClick={() => ouvrirModalModifier(vendeur)}
                  icon="✏️"
                  label="Modifier les badges"
                />
                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                <MenuItemAction
                  onClick={() => demanderSuppressionVendeur(vendeur)}
                  icon="🗑️"
                  label="Supprimer tous les badges"
                  color={THEME.danger}
                  danger
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Pied de page */}
      <div style={{ marginTop: '16px', fontSize: '13px', color: THEME.textLight }}>
        {vendeursFiltres.length} vendeur{vendeursFiltres.length > 1 ? 's' : ''} affiché{vendeursFiltres.length > 1 ? 's' : ''}
        {selectionnes.length > 0 && ` · ${selectionnes.length} sélectionné${selectionnes.length > 1 ? 's' : ''}`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT HELPER MENU ITEM
// ─────────────────────────────────────────────────────────────────────────────
function MenuItemAction({ onClick, icon, label, color = '#1a2332', danger = false }: {
  onClick: () => void;
  icon: string;
  label: string;
  color?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
        padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: '13px', color, fontWeight: '600', textAlign: 'left', transition: 'background-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? '#fee2e2' : '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span> {label}
    </button>
  );
}
