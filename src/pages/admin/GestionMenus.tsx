// src/pages/admin/GestionMenus.tsx
// Gestion des menus de la plateforme e-Vend — Page admin complète

import { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

// ─── TYPES ────────────────────────────────────────────────────────────────

interface MenuItem {
  id: number;
  menu_id: number;
  parent_id: number | null;
  label: string;
  url: string | null;
  type_lien: string;
  cible: string;
  icone: string | null;
  ordre: number;
  taille_texte: number;
  gras: boolean;
  italique: boolean;
  couleur: string | null;
  visible: boolean;
  sous_items: MenuItem[];
}

interface Menu {
  id: number;
  nom: string;
  slug: string;
  type: string;
  description: string | null;
  actif: boolean;
  items: MenuItem[];
}

interface FormItem {
  label: string;
  url: string;
  type_lien: string;
  cible: string;
  icone: string;
  taille_texte: number;
  gras: boolean;
  italique: boolean;
  couleur: string;
  visible: boolean;
  parent_id: number | null;
}

const FORM_VIDE: FormItem = {
  label: '', url: '', type_lien: 'custom', cible: '_self',
  icone: '', taille_texte: 14, gras: false, italique: false,
  couleur: '#1a2436', visible: true, parent_id: null,
};

const TYPE_LIENS = [
  { value: 'custom',     label: 'URL personnalisé' },
  { value: 'catalogue',  label: 'Catalogue produits' },
  { value: 'page',       label: 'Page du site' },
  { value: 'categorie',  label: 'Catégorie produits' },
  { value: 'blog',       label: 'Blog' },
];

const LIENS_RAPIDES = [
  { label: 'Accueil', url: '/' },
  { label: 'Catalogue', url: '/catalogue' },
  { label: 'Enchères', url: '/encheres' },
  { label: 'Les boutiques', url: '/boutiques' },
  { label: 'Blog', url: '/blog' },
  { label: 'À propos', url: '/a-propos' },
  { label: 'Contact', url: '/contact' },
  { label: 'Connexion', url: '/login' },
  { label: 'Mon compte', url: '/dashboard' },
];

const THEME = {
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
  sidebar: '#1a2436',
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────

export default function GestionMenus({ naviguerVers }: { naviguerVers?: (page: string) => void }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [onglet, setOnglet] = useState<'principal' | 'footer'>('principal');
  const [loading, setLoading] = useState(true);
  const [menuActif, setMenuActif] = useState<Menu | null>(null);
  const [modalItem, setModalItem] = useState<'ajouter' | 'modifier' | null>(null);
  const [itemEnEdition, setItemEnEdition] = useState<MenuItem | null>(null);
  const [formItem, setFormItem] = useState<FormItem>(FORM_VIDE);
  const [modalMenu, setModalMenu] = useState(false);
  const [formMenu, setFormMenu] = useState({ nom: '', type: 'principal', description: '' });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [itemExpande, setItemExpande] = useState<Set<number>>(new Set());
  const token = localStorage.getItem('token');

  useEffect(() => { fetchMenus(); }, []);
  useEffect(() => {
    if (menus.length > 0) {
      const type = onglet === 'principal' ? 'principal' : 'footer';
      const found = menus.find(m => m.type === type);
      setMenuActif(found || menus[0] || null);
    }
  }, [onglet, menus]);

  async function fetchMenus() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMenus(data.menus || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function creerMenu() {
    if (!formMenu.nom.trim()) return;
    try {
      await fetch(`${API_BASE}/menus`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formMenu),
      });
      setModalMenu(false);
      setFormMenu({ nom: '', type: 'principal', description: '' });
      await fetchMenus();
    } catch (err) { console.error(err); }
  }

  async function toggleActifMenu(menu: Menu) {
    await fetch(`${API_BASE}/menus/${menu.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !menu.actif }),
    });
    await fetchMenus();
  }

  async function supprimerMenu(id: number) {
    if (!window.confirm('Supprimer ce menu et tous ses items ?')) return;
    await fetch(`${API_BASE}/menus/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchMenus();
  }

  function ouvrirAjout(parentId: number | null = null) {
    setFormItem({ ...FORM_VIDE, parent_id: parentId });
    setItemEnEdition(null);
    setModalItem('ajouter');
  }

  function ouvrirModifier(item: MenuItem) {
    setFormItem({
      label: item.label,
      url: item.url || '',
      type_lien: item.type_lien,
      cible: item.cible,
      icone: item.icone || '',
      taille_texte: item.taille_texte,
      gras: item.gras,
      italique: item.italique,
      couleur: item.couleur || '#1a2436',
      visible: item.visible,
      parent_id: item.parent_id,
    });
    setItemEnEdition(item);
    setModalItem('modifier');
  }

  async function sauvegarderItem() {
    if (!menuActif || !formItem.label.trim()) return;
    setSauvegarde(true);
    try {
      if (modalItem === 'ajouter') {
        await fetch(`${API_BASE}/menus/${menuActif.id}/items`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(formItem),
        });
      } else if (itemEnEdition) {
        await fetch(`${API_BASE}/menus/${menuActif.id}/items/${itemEnEdition.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(formItem),
        });
      }
      setModalItem(null);
      await fetchMenus();
    } finally {
      setSauvegarde(false);
    }
  }

  async function supprimerItem(item: MenuItem) {
    if (!menuActif) return;
    if (!window.confirm(`Supprimer "${item.label}" ?`)) return;
    await fetch(`${API_BASE}/menus/${menuActif.id}/items/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchMenus();
  }

  async function toggleVisibleItem(item: MenuItem) {
    if (!menuActif) return;
    await fetch(`${API_BASE}/menus/${menuActif.id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !item.visible }),
    });
    await fetchMenus();
  }

  async function monterItem(item: MenuItem, items: MenuItem[]) {
    if (!menuActif) return;
    const idx = items.findIndex(i => i.id === item.id);
    if (idx <= 0) return;
    const ordres = items.map((it, i) => {
      if (i === idx - 1) return { id: it.id, ordre: idx };
      if (i === idx) return { id: it.id, ordre: idx - 1 };
      return { id: it.id, ordre: i };
    });
    await fetch(`${API_BASE}/menus/${menuActif.id}/items/reordonner`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordres }),
    });
    await fetchMenus();
  }

  async function descendreItem(item: MenuItem, items: MenuItem[]) {
    if (!menuActif) return;
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= items.length - 1) return;
    const ordres = items.map((it, i) => {
      if (i === idx + 1) return { id: it.id, ordre: idx };
      if (i === idx) return { id: it.id, ordre: idx + 1 };
      return { id: it.id, ordre: i };
    });
    await fetch(`${API_BASE}/menus/${menuActif.id}/items/reordonner`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordres }),
    });
    await fetchMenus();
  }

  // ─── RENDU ITEM RÉCURSIF ─────────────────────────────────────────────────

  function RenduItem({ item, items, niveau = 0 }: { item: MenuItem; items: MenuItem[]; niveau?: number }) {
    const expande = itemExpande.has(item.id);
    const hasChildren = item.sous_items && item.sous_items.length > 0;

    return (
      <div style={{ marginLeft: niveau * 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px',
          background: item.visible ? '#fff' : '#f8f9fa',
          border: `1px solid ${item.visible ? THEME.border : '#e5e7eb'}`,
          borderRadius: '10px',
          marginBottom: '6px',
          opacity: item.visible ? 1 : 0.6,
          transition: 'all 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {/* Expand/collapse si sous-items */}
          {hasChildren ? (
            <button
              style={s.btnIcone}
              onClick={() => {
                const n = new Set(itemExpande);
                expande ? n.delete(item.id) : n.add(item.id);
                setItemExpande(n);
              }}
            >
              {expande ? '▾' : '▸'}
            </button>
          ) : (
            <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.visible ? THEME.accent : '#d1d5db' }} />
            </div>
          )}

          {/* Icône */}
          {item.icone && <span style={{ fontSize: '16px' }}>{item.icone}</span>}

          {/* Label avec style */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: item.taille_texte + 'px',
              fontWeight: item.gras ? 700 : 500,
              fontStyle: item.italique ? 'italic' : 'normal',
              color: item.couleur || THEME.text,
            }}>
              {item.label}
            </span>
            {item.url && (
              <span style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '8px' }}>
                → {item.url}
              </span>
            )}
          </div>

          {/* Badges */}
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: item.visible ? '#e8f2fb' : '#f3f4f6',
            color: item.visible ? THEME.accent : THEME.textLight,
            fontWeight: 600,
          }}>
            {item.type_lien}
          </span>

          {item.cible === '_blank' && (
            <span style={{ fontSize: '10px', color: THEME.textLight }} title="Nouvel onglet">🔗</span>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button style={{ ...s.btnAction, background: '#f0f2f5' }} onClick={() => monterItem(item, items)} title="Monter">↑</button>
            <button style={{ ...s.btnAction, background: '#f0f2f5' }} onClick={() => descendreItem(item, items)} title="Descendre">↓</button>
            <button style={{ ...s.btnAction, background: '#e8f2fb', color: THEME.accent }} onClick={() => ouvrirAjout(item.id)} title="Ajouter sous-item">+</button>
            <button
              style={{ ...s.btnAction, background: item.visible ? '#f0fdf4' : '#f3f4f6', color: item.visible ? THEME.success : THEME.textLight }}
              onClick={() => toggleVisibleItem(item)}
              title={item.visible ? 'Masquer' : 'Afficher'}
            >
              {item.visible ? '👁' : '🚫'}
            </button>
            <button style={{ ...s.btnAction, background: '#e8f2fb', color: THEME.accent }} onClick={() => ouvrirModifier(item)} title="Modifier">✏️</button>
            <button style={{ ...s.btnAction, background: '#fef2f2', color: THEME.danger }} onClick={() => supprimerItem(item)} title="Supprimer">🗑</button>
          </div>
        </div>

        {/* Sous-items */}
        {hasChildren && expande && (
          <div style={{ marginLeft: '12px', borderLeft: `2px solid ${THEME.border}`, paddingLeft: '12px', marginBottom: '6px' }}>
            {item.sous_items.map(si => (
              <RenduItem key={si.id} item={si} items={item.sous_items} niveau={0} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── MENUS FILTRÉS PAR TYPE ──────────────────────────────────────────────

  const menusType = menus.filter(m => m.type === (onglet === 'principal' ? 'principal' : 'footer'));

  // ─── RENDU PRINCIPAL ─────────────────────────────────────────────────────

  if (loading) return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={s.spinner} />
        <span style={{ marginLeft: '12px', color: THEME.textLight }}>Chargement des menus...</span>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* ── EN-TÊTE ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>🛠️ Gestion des menus</h1>
          <p style={s.sousTitre}>Configurez les menus de navigation de votre plateforme</p>
        </div>
        <button style={s.btnCreer} onClick={() => setModalMenu(true)}>
          + Créer un nouveau menu
        </button>
      </div>

      {/* ── ONGLETS ── */}
      <div style={s.onglets}>
        {[
          { id: 'principal', label: '🧭 Menu principal', count: menus.filter(m => m.type === 'principal').length },
          { id: 'footer',    label: '📄 Pied de page',   count: menus.filter(m => m.type === 'footer').length },
        ].map(o => (
          <button
            key={o.id}
            style={{ ...s.ongletBtn, ...(onglet === o.id ? s.ongletActif : {}) }}
            onClick={() => setOnglet(o.id as any)}
          >
            {o.label}
            <span style={{ ...s.ongletBadge, background: onglet === o.id ? THEME.accent : '#e5e7eb', color: onglet === o.id ? '#fff' : THEME.textLight }}>
              {o.count}
            </span>
          </button>
        ))}
      </div>

      <div style={s.layout}>
        {/* ── LISTE DES MENUS (gauche) ── */}
        <div style={s.colMenus}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitre}>
                {onglet === 'principal' ? '🧭 Menus principaux' : '📄 Menus pied de page'}
              </span>
              <span style={{ fontSize: '12px', color: THEME.textLight }}>{menusType.length} menu{menusType.length > 1 ? 's' : ''}</span>
            </div>

            {menusType.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📋</p>
                <p style={{ color: THEME.textLight, fontSize: '14px' }}>Aucun menu créé</p>
                <button style={{ ...s.btnCreer, marginTop: '12px', fontSize: '13px', padding: '8px 16px' }} onClick={() => setModalMenu(true)}>
                  + Créer un menu
                </button>
              </div>
            ) : (
              menusType.map(menu => (
                <div
                  key={menu.id}
                  style={{
                    ...s.menuListeItem,
                    ...(menuActif?.id === menu.id ? s.menuListeItemActif : {}),
                  }}
                  onClick={() => setMenuActif(menu)}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: menuActif?.id === menu.id ? THEME.accent : THEME.text, margin: '0 0 2px' }}>
                      {menu.nom}
                    </p>
                    <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
                      {menu.items?.length || 0} item{(menu.items?.length || 0) > 1 ? 's' : ''} · {menu.actif ? '✅ Actif' : '⏸ Inactif'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      style={{ ...s.btnIcone, background: menu.actif ? '#f0fdf4' : '#f3f4f6', color: menu.actif ? THEME.success : THEME.textLight }}
                      onClick={e => { e.stopPropagation(); toggleActifMenu(menu); }}
                      title={menu.actif ? 'Désactiver' : 'Activer'}
                    >
                      {menu.actif ? '✅' : '⏸'}
                    </button>
                    <button
                      style={{ ...s.btnIcone, background: '#fef2f2', color: THEME.danger }}
                      onClick={e => { e.stopPropagation(); supprimerMenu(menu.id); }}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── ÉDITEUR DE MENU (droite) ── */}
        <div style={s.colEditeur}>
          {!menuActif ? (
            <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>👈</p>
                <p style={{ color: THEME.textLight, fontSize: '15px' }}>Sélectionnez un menu pour l'éditer</p>
              </div>
            </div>
          ) : (
            <div style={s.card}>
              {/* Header éditeur */}
              <div style={{ ...s.cardHeader, borderBottom: `1px solid ${THEME.border}`, marginBottom: '0' }}>
                <div>
                  <span style={s.cardTitre}>✏️ {menuActif.nom}</span>
                  {menuActif.description && (
                    <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0' }}>{menuActif.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: menuActif.actif ? '#f0fdf4' : '#f3f4f6',
                    color: menuActif.actif ? THEME.success : THEME.textLight,
                    fontWeight: 600,
                  }}>
                    {menuActif.actif ? '✅ Actif' : '⏸ Inactif'}
                  </span>
                  <button style={s.btnAjouter} onClick={() => ouvrirAjout(null)}>
                    + Ajouter un item
                  </button>
                </div>
              </div>

              {/* Aperçu du menu */}
              {menuActif.items && menuActif.items.length > 0 && (
                <div style={s.apercuWrap}>
                  <p style={s.apercuTitre}>Aperçu rendu</p>
                  <div style={s.apercuMenu}>
                    {menuActif.items.filter(i => i.visible).map(item => (
                      <div key={item.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.icone && <span style={{ fontSize: '14px' }}>{item.icone}</span>}
                        <a href={item.url || '#'} target={item.cible} style={{
                          fontSize: item.taille_texte + 'px',
                          fontWeight: item.gras ? 700 : 400,
                          fontStyle: item.italique ? 'italic' : 'normal',
                          color: item.couleur || '#fff',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          transition: 'background 0.15s',
                        }}>
                          {item.label}
                        </a>
                        {item.sous_items?.length > 0 && (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>▾</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des items */}
              <div style={{ padding: '20px' }}>
                {menuActif.items && menuActif.items.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.text }}>
                        {menuActif.items.length} item{menuActif.items.length > 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: '12px', color: THEME.textLight }}>
                        Cliquez ▸ pour voir les sous-menus
                      </span>
                    </div>
                    {menuActif.items.map(item => (
                      <RenduItem key={item.id} item={item} items={menuActif.items} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontSize: '40px', marginBottom: '10px' }}>🔗</p>
                    <p style={{ color: THEME.textLight, fontSize: '14px', marginBottom: '16px' }}>
                      Ce menu ne contient aucun item
                    </p>
                    <button style={s.btnAjouter} onClick={() => ouvrirAjout(null)}>
                      + Ajouter le premier item
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ MODAL CRÉER MENU ══════════════════════════════════════════════ */}
      {modalMenu && (
        <>
          <div style={s.overlay} onClick={() => setModalMenu(false)} />
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitre}>📋 Nouveau menu</h3>
              <button style={s.btnFermer} onClick={() => setModalMenu(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.champWrap}>
                <label style={s.label}>Nom du menu *</label>
                <input
                  style={s.input}
                  placeholder="ex: Menu principal"
                  value={formMenu.nom}
                  onChange={e => setFormMenu({ ...formMenu, nom: e.target.value })}
                />
              </div>
              <div style={s.champWrap}>
                <label style={s.label}>Type</label>
                <select style={s.input} value={formMenu.type} onChange={e => setFormMenu({ ...formMenu, type: e.target.value })}>
                  <option value="principal">Menu principal (navbar)</option>
                  <option value="footer">Pied de page</option>
                </select>
              </div>
              <div style={s.champWrap}>
                <label style={s.label}>Description (optionnel)</label>
                <input
                  style={s.input}
                  placeholder="Description interne"
                  value={formMenu.description}
                  onChange={e => setFormMenu({ ...formMenu, description: e.target.value })}
                />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnAnnuler} onClick={() => setModalMenu(false)}>Annuler</button>
              <button style={s.btnSauvegarder} onClick={creerMenu}>Créer le menu</button>
            </div>
          </div>
        </>
      )}

      {/* ══ MODAL AJOUTER/MODIFIER ITEM ═══════════════════════════════════ */}
      {modalItem && (
        <>
          <div style={s.overlay} onClick={() => setModalItem(null)} />
          <div style={{ ...s.modal, maxWidth: '600px' }}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitre}>
                {modalItem === 'ajouter' ? '➕ Ajouter un item' : '✏️ Modifier l\'item'}
                {formItem.parent_id && <span style={{ fontSize: '13px', fontWeight: 400, color: THEME.textLight, marginLeft: '8px' }}>— sous-menu</span>}
              </h3>
              <button style={s.btnFermer} onClick={() => setModalItem(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Label */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>Label affiché *</label>
                  <input
                    style={s.input}
                    placeholder="ex: Catalogue, À propos..."
                    value={formItem.label}
                    onChange={e => setFormItem({ ...formItem, label: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Type de lien */}
                <div>
                  <label style={s.label}>Type de lien</label>
                  <select style={s.input} value={formItem.type_lien} onChange={e => setFormItem({ ...formItem, type_lien: e.target.value })}>
                    {TYPE_LIENS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Cible */}
                <div>
                  <label style={s.label}>Ouvrir dans</label>
                  <select style={s.input} value={formItem.cible} onChange={e => setFormItem({ ...formItem, cible: e.target.value })}>
                    <option value="_self">Même onglet</option>
                    <option value="_blank">Nouvel onglet</option>
                  </select>
                </div>

                {/* URL */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>URL / Lien</label>
                  <input
                    style={s.input}
                    placeholder="/catalogue ou https://..."
                    value={formItem.url}
                    onChange={e => setFormItem({ ...formItem, url: e.target.value })}
                  />
                  {/* Liens rapides */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {LIENS_RAPIDES.map(lien => (
                      <button
                        key={lien.url}
                        style={s.btnLienRapide}
                        onClick={() => setFormItem({ ...formItem, url: lien.url, label: formItem.label || lien.label })}
                      >
                        {lien.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icône */}
                <div>
                  <label style={s.label}>Icône (emoji)</label>
                  <input
                    style={s.input}
                    placeholder="🏠 🛒 ⭐ 📦"
                    value={formItem.icone}
                    onChange={e => setFormItem({ ...formItem, icone: e.target.value })}
                  />
                </div>

                {/* Couleur */}
                <div>
                  <label style={s.label}>Couleur du texte</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formItem.couleur}
                      onChange={e => setFormItem({ ...formItem, couleur: e.target.value })}
                      style={{ width: '44px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      style={{ ...s.input, flex: 1 }}
                      value={formItem.couleur}
                      onChange={e => setFormItem({ ...formItem, couleur: e.target.value })}
                      placeholder="#1a2436"
                    />
                  </div>
                </div>

                {/* Taille du texte */}
                <div>
                  <label style={s.label}>Taille du texte : {formItem.taille_texte}px</label>
                  <input
                    type="range"
                    min="10" max="24" step="1"
                    value={formItem.taille_texte}
                    onChange={e => setFormItem({ ...formItem, taille_texte: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: THEME.accent }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: THEME.textLight }}>
                    <span>10px</span>
                    <span style={{ fontSize: formItem.taille_texte + 'px', fontWeight: formItem.gras ? 700 : 400, fontStyle: formItem.italique ? 'italic' : 'normal', color: formItem.couleur }}>
                      {formItem.label || 'Aperçu'}
                    </span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Style texte */}
                <div>
                  <label style={s.label}>Style</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{ ...s.btnStyle, ...(formItem.gras ? s.btnStyleActif : {}) }}
                      onClick={() => setFormItem({ ...formItem, gras: !formItem.gras })}
                    >
                      <strong>G</strong>
                    </button>
                    <button
                      style={{ ...s.btnStyle, ...(formItem.italique ? s.btnStyleActif : {}) }}
                      onClick={() => setFormItem({ ...formItem, italique: !formItem.italique })}
                    >
                      <em>I</em>
                    </button>
                  </div>
                </div>

                {/* Visible */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        background: formItem.visible ? THEME.accent : '#d1d5db',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                      }}
                      onClick={() => setFormItem({ ...formItem, visible: !formItem.visible })}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '2px',
                        left: formItem.visible ? '22px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                    Visible dans le menu
                  </label>
                </div>
              </div>
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnAnnuler} onClick={() => setModalItem(null)}>Annuler</button>
              <button
                style={{ ...s.btnSauvegarder, opacity: sauvegarde || !formItem.label.trim() ? 0.6 : 1 }}
                onClick={sauvegarderItem}
                disabled={sauvegarde || !formItem.label.trim()}
              >
                {sauvegarde ? '⏳ Sauvegarde...' : modalItem === 'ajouter' ? 'Ajouter l\'item' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: THEME.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: THEME.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '14px', color: THEME.textLight, margin: 0 },
  btnCreer: { padding: '10px 20px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },

  onglets: { display: 'flex', gap: '4px', marginBottom: '20px', background: '#fff', padding: '4px', borderRadius: '12px', border: `1px solid ${THEME.border}`, width: 'fit-content' },
  ongletBtn: { padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: THEME.textLight, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' },
  ongletActif: { background: THEME.accent, color: '#fff', fontWeight: 700 },
  ongletBadge: { fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', minWidth: '20px', textAlign: 'center' },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },

  card: { background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${THEME.border}` },
  cardTitre: { fontSize: '14px', fontWeight: 700, color: THEME.text },

  colMenus: {},
  colEditeur: {},

  menuListeItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${THEME.border}`, transition: 'background 0.15s' },
  menuListeItemActif: { background: '#e8f2fb', borderLeft: `3px solid ${THEME.accent}` },

  apercuWrap: { padding: '16px 20px', borderBottom: `1px solid ${THEME.border}` },
  apercuTitre: { fontSize: '11px', fontWeight: 600, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  apercuMenu: { display: 'flex', alignItems: 'center', gap: '4px', background: THEME.sidebar, padding: '8px 16px', borderRadius: '10px', flexWrap: 'wrap' },

  btnIcone: { width: '28px', height: '28px', border: `1px solid ${THEME.border}`, borderRadius: '6px', background: '#f0f2f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 },
  btnAction: { width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, transition: 'all 0.15s' },
  btnAjouter: { padding: '7px 14px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },

  spinner: { width: '32px', height: '32px', border: `3px solid ${THEME.border}`, borderTop: `3px solid ${THEME.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${THEME.border}` },
  modalTitre: { fontSize: '16px', fontWeight: 800, color: THEME.text, margin: 0 },
  btnFermer: { width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: '#f0f2f5', cursor: 'pointer', fontSize: '14px' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: `1px solid ${THEME.border}` },

  // Formulaire
  champWrap: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: THEME.text, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '9px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' } as React.CSSProperties,

  // Style texte
  btnStyle: { width: '36px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '8px', background: '#f0f2f5', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnStyleActif: { background: THEME.accent, borderColor: THEME.accent, color: '#fff' },

  // Liens rapides
  btnLienRapide: { padding: '3px 10px', border: `1px solid ${THEME.border}`, borderRadius: '20px', background: '#f0f2f5', fontSize: '11px', color: THEME.textLight, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' },

  // Boutons footer modal
  btnAnnuler: { padding: '9px 18px', background: '#f0f2f5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: THEME.textLight },
  btnSauvegarder: { padding: '9px 18px', background: THEME.accent, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#fff', transition: 'opacity 0.15s' },
};