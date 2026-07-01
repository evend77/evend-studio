import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

// Types
interface Categorie {
  id: number;
  nom: string;
  active: boolean;
  productCount?: number;
  image?: string;
  description?: string;
  dateCreation?: string;
}

// Thème cohérent avec l'administration
const THEME = {
  sidebar:      '#1a2436',
  sidebarHover: '#243044',
  sidebarActive:'#2d6a9f',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  topbar:       '#ffffff',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
  orange:       '#ea580c',
  purple:       '#7c3aed',
};

const API = 'https://evend-multivendeur-api.onrender.com/api/categories';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// Modale pour créer/éditer une catégorie
function ModalCategorie({
  isOpen,
  categorie,
  onClose,
  onSave
}: {
  isOpen: boolean;
  categorie?: Categorie | null;
  onClose: () => void;
  onSave: (nom: string, description?: string, image?: string) => void;
}) {
  const [nom, setNom] = useState(categorie?.nom || '');
  const [description, setDescription] = useState(categorie?.description || '');
  const [imagePreview, setImagePreview] = useState<string | null>(categorie?.image || null);
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  useEffect(() => {
    if (categorie) {
      setNom(categorie.nom);
      setDescription(categorie.description || '');
      setImagePreview(categorie.image || null);
    } else {
      setNom('');
      setDescription('');
      setImagePreview(null);
    }
  }, [categorie]);

  if (!isOpen) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom de la catégorie est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (valider()) {
      onSave(nom.trim(), description.trim() || undefined, imagePreview || undefined);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🗂️</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>
                  {categorie ? 'Modifier la catégorie' : 'Créer une catégorie'}
                </p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>
                  {categorie ? 'Modifier les informations de la catégorie' : 'Ajouter une nouvelle catégorie'}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Nom de la catégorie <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${erreurs.nom ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Ex: Électronique"
            />
            {erreurs.nom && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.nom}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>Description (optionnelle)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Description de la catégorie..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>Image de la catégorie</label>
            {imagePreview && (
              <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', width: '100%', maxHeight: '200px', border: `1px solid ${THEME.border}` }}>
                <img src={imagePreview} alt="Aperçu" style={{ width: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: '100%', padding: '10px', border: `2px dashed ${THEME.border}`, borderRadius: '8px', fontSize: '13px' }} />
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '5px 0 0 0' }}>Formats acceptés: JPG, PNG, GIF. Taille max: 5MB</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={!nom.trim()} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: nom.trim() ? 'pointer' : 'not-allowed', backgroundColor: nom.trim() ? THEME.accent : '#cccccc', color: 'white' }}>
            {nom.trim() ? '✅ Enregistrer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale de confirmation
function ModalConfirmation({ isOpen, title, message, onConfirm, onCancel }: {
  isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: THEME.text, margin: '0 0 20px 0' }}>{message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
            <button onClick={onConfirm} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: THEME.danger, color: 'white' }}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function GestionCategories({ onNaviguerVers }: { onNaviguerVers?: (page: string, data?: any) => void }) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modalCategorie, setModalCategorie] = useState<{ isOpen: boolean; categorie?: Categorie | null }>({ isOpen: false, categorie: null });
  const [modalConfirmation, setModalConfirmation] = useState<{ isOpen: boolean; type: 'desactiver' | 'activer' | 'supprimer' | null; categorie?: Categorie | null }>({ isOpen: false, type: null, categorie: null });

  const afficherToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Charger les catégories depuis la BD
  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const res = await fetch(API, { headers: authHeaders() });
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();
        // Normaliser : BD retourne { id, nom, active }
        const liste = (data.categories || data).map((c: any) => ({
          id: c.id,
          nom: c.nom,
          active: c.active !== false,
          description: c.description || '',
          image: c.image || null,
          productCount: c.product_count || 0,
        }));
        setCategories(liste);
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
        afficherToast('❌ Erreur chargement des catégories', false);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  // Filtrer
  const filteredCategories = categories.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toString().includes(search)
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCategories.length) setSelectedIds([]);
    else setSelectedIds(paginatedCategories.map(c => c.id));
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAction = async (categorie: Categorie, action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        const res = await fetch(`${API}/${categorie.id}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error();
        setCategories(prev => prev.filter(c => c.id !== categorie.id));
        afficherToast(`🗑️ Catégorie "${categorie.nom}" supprimée`);
      } else {
        const active = action === 'activer';
        const res = await fetch(`${API}/${categorie.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ nom: categorie.nom, active }),
        });
        if (!res.ok) throw new Error();
        setCategories(prev => prev.map(c => c.id === categorie.id ? { ...c, active } : c));
        afficherToast(`✅ Catégorie "${categorie.nom}" ${active ? 'activée' : 'désactivée'}`);
      }
    } catch {
      afficherToast('❌ Erreur lors de l\'action', false);
    }
    setMenuOuvert(null);
    setModalConfirmation({ isOpen: false, type: null, categorie: null });
  };

  const handleBulkAction = async (action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        await Promise.all(selectedIds.map(id => fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() })));
        setCategories(prev => prev.filter(c => !selectedIds.includes(c.id)));
        afficherToast(`🗑️ ${selectedIds.length} catégorie(s) supprimée(s)`);
      } else {
        const active = action === 'activer';
        await Promise.all(selectedIds.map(id => {
          const cat = categories.find(c => c.id === id);
          return fetch(`${API}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ nom: cat?.nom, active }) });
        }));
        setCategories(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, active } : c));
        afficherToast(`✅ ${selectedIds.length} catégorie(s) ${active ? 'activée(s)' : 'désactivée(s)'}`);
      }
      setSelectedIds([]);
    } catch {
      afficherToast('❌ Erreur action groupée', false);
    }
    setModalConfirmation({ isOpen: false, type: null });
  };

  const handleSaveCategorie = async (nom: string, description?: string, image?: string) => {
    try {
      if (modalCategorie.categorie) {
        // Modifier
        const res = await fetch(`${API}/${modalCategorie.categorie.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ nom, description, image, active: modalCategorie.categorie.active }),
        });
        if (!res.ok) throw new Error();
        setCategories(prev => prev.map(c => c.id === modalCategorie.categorie!.id ? { ...c, nom, description, image } : c));
        afficherToast(`✅ Catégorie "${nom}" modifiée`);
      } else {
        // Créer
        const res = await fetch(API, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ nom, description, image, active: true }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCategories(prev => [...prev, { id: data.id, nom, description, image, active: true, productCount: 0 }]);
        afficherToast(`✅ Catégorie "${nom}" créée`);
      }
      setModalCategorie({ isOpen: false, categorie: null });
    } catch {
      afficherToast('❌ Erreur lors de la sauvegarde', false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' }}>
            🗂️ Catégories
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} — {categories.filter(c => c.active).length} actives
          </p>
        </div>
        <button
          onClick={() => setModalCategorie({ isOpen: true, categorie: null })}
          style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>+</span> Créer une catégorie
        </button>
      </div>

      {/* Barre de recherche + actions groupées */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="🔍 Rechercher une catégorie..."
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 14px', fontSize: '13px', outline: 'none', width: '300px' }}
        />
        <span style={{ fontSize: '12px', color: THEME.textLight }}>{filteredCategories.length} résultat{filteredCategories.length !== 1 ? 's' : ''}</span>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button onClick={() => setModalConfirmation({ isOpen: true, type: 'activer' })}
              style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              ✓ Activer ({selectedIds.length})
            </button>
            <button onClick={() => setModalConfirmation({ isOpen: true, type: 'desactiver' })}
              style={{ backgroundColor: THEME.warning, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              ⚠ Désactiver ({selectedIds.length})
            </button>
            <button onClick={() => setModalConfirmation({ isOpen: true, type: 'supprimer' })}
              style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              🗑 Supprimer ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
            <tr>
              <th style={{ padding: '13px 8px', width: '40px', textAlign: 'center' }}>
                <input type="checkbox"
                  checked={selectedIds.length === paginatedCategories.length && paginatedCategories.length > 0}
                  onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent }}>#ID</th>
              <th style={{ padding: '13px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent }}>Nom</th>
              <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent }}>Produits</th>
              <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent }}>Statut</th>
              <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.map((cat, index) => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => handleSelect(cat.id)} style={{ cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', color: THEME.textLight }}>{cat.id}</td>
                <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {cat.image && <img src={cat.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />}
                    <span style={{ fontSize: '13px', fontWeight: '500', color: THEME.text }}>{cat.nom}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', color: THEME.accent }}>{cat.productCount || 0}</td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: cat.active ? '#dcfce7' : '#fee2e2', color: cat.active ? THEME.success : THEME.danger }}>
                    {cat.active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => setModalCategorie({ isOpen: true, categorie: cat })}
                      style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: `1px solid #bfdbfe`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      ✏️ Modifier
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setMenuOuvert(menuOuvert === cat.id ? null : cat.id)}
                        style={{ background: '#f0f0f0', border: `1px solid ${THEME.border}`, cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', fontSize: '14px' }}>⋮</button>
                      {menuOuvert === cat.id && (
                        <div style={{ position: 'fixed', backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: '160px' }}
                          ref={el => {
                            if (el) {
                              const btn = el.previousSibling as HTMLElement;
                              const rect = btn?.getBoundingClientRect();
                              if (rect) {
                                el.style.top = rect.bottom + 4 + 'px';
                                el.style.left = Math.min(rect.right - 160, window.innerWidth - 168) + 'px';
                              }
                            }
                          }}>
                          <div style={{ padding: '4px 0' }}>
                            <MenuItem onClick={() => { setModalConfirmation({ isOpen: true, type: 'activer', categorie: cat }); setMenuOuvert(null); }}>✓ Activer</MenuItem>
                            <MenuItem onClick={() => { setModalConfirmation({ isOpen: true, type: 'desactiver', categorie: cat }); setMenuOuvert(null); }}>⚠ Désactiver</MenuItem>
                            <MenuItem onClick={() => { setModalConfirmation({ isOpen: true, type: 'supprimer', categorie: cat }); setMenuOuvert(null); }} style={{ color: THEME.danger }}>🗑 Supprimer</MenuItem>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCategories.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
            {search ? `Aucune catégorie pour "${search}"` : 'Aucune catégorie trouvée'}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: THEME.textLight }}>
        <span>{itemsPerPage} par page</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Page {currentPage} / {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ padding: '4px 8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>←</button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            style={{ padding: '4px 8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1 }}>→</button>
        </div>
      </div>

      {/* Modales */}
      <ModalCategorie
        isOpen={modalCategorie.isOpen}
        categorie={modalCategorie.categorie}
        onClose={() => setModalCategorie({ isOpen: false, categorie: null })}
        onSave={handleSaveCategorie}
      />

      <ModalConfirmation
        isOpen={modalConfirmation.isOpen}
        title={modalConfirmation.type === 'activer' ? 'Activer la catégorie' : modalConfirmation.type === 'desactiver' ? 'Désactiver la catégorie' : 'Supprimer la catégorie'}
        message={
          modalConfirmation.categorie
            ? `Êtes-vous sûr de vouloir ${modalConfirmation.type === 'activer' ? 'activer' : modalConfirmation.type === 'desactiver' ? 'désactiver' : 'supprimer'} la catégorie "${modalConfirmation.categorie.nom}" ?`
            : `Êtes-vous sûr de vouloir ${modalConfirmation.type} ${selectedIds.length} catégorie(s) ?`
        }
        onConfirm={
          modalConfirmation.categorie
            ? () => handleAction(modalConfirmation.categorie!, modalConfirmation.type!)
            : () => handleBulkAction(modalConfirmation.type!)
        }
        onCancel={() => setModalConfirmation({ isOpen: false, type: null, categorie: null })}
      />
    </div>
  );
}

function MenuItem({ children, onClick, style = {} }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: THEME.text, ...style }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}
