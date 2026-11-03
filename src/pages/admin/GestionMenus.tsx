// src/pages/admin/GestionMenus.tsx
// Gestion des menus de e-Vend Studio — menu du haut (« principal ») et pied de page (« footer »)
// affichés sur toutes les pages publiques. Route serveur : routes/menus.js

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
  label: '', url: '', type_lien: 'page', cible: '_self',
  icone: '', taille_texte: 14, gras: false, italique: false,
  couleur: '', visible: true, parent_id: null,
};

// custom = adresse libre · page = page du site · ancre = défilement vers une section de l'accueil
// politiques = liste déroulante des politiques (pied de page seulement)
const TYPE_LIENS = [
  { value: 'page',       label: 'Page du site',                         aide: 'Mène vers une page de Studio (ex. /blog, /faq, /contact).' },
  { value: 'ancre',      label: 'Section de l\'accueil (défilement)',   aide: 'Fait défiler l\'accueil jusqu\'à une section (ex. /#templates). Depuis une autre page, ramène d\'abord à l\'accueil puis défile.' },
  { value: 'custom',     label: 'Adresse personnalisée',                aide: 'Une adresse libre : /page-du-site ou https://autre-site.com.' },
  { value: 'politiques', label: 'Liste des politiques (pied de page)',  aide: 'Affiche la liste de vos politiques. Aucune adresse à saisir.' },
];

const LIENS_RAPIDES = [
  { label: 'Accueil',          url: '/',            type: 'page' },
  { label: 'Templates',        url: '/#templates',  type: 'ancre' },
  { label: 'Fonctionnalités',  url: '/#features',   type: 'ancre' },
  { label: 'Page Templates',   url: '/templates',   type: 'page' },
  { label: 'Blog',             url: '/blog',        type: 'page' },
  { label: 'FAQ',              url: '/faq',         type: 'page' },
  { label: 'Documents',        url: '/documents',   type: 'page' },
  { label: 'Contact',          url: '/contact',     type: 'page' },
];

const THEME = {
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
  barre: '#0b1220', orange: '#f5a623',
};

function lireToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

// Appel API : jamais d'exception ; renvoie { ok, data, message } (message = erreur lisible)
async function appeler(chemin: string, methode: string = 'GET', corps?: unknown): Promise<{ ok: boolean; data: any; message: string }> {
  const entetes: Record<string, string> = {};
  const token = lireToken();
  if (token) entetes.Authorization = `Bearer ${token}`;
  if (corps !== undefined) entetes['Content-Type'] = 'application/json';
  try {
    const res = await fetch(`${API_BASE}${chemin}`, {
      method: methode,
      credentials: 'include',
      headers: entetes,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
    let data: any = null;
    try { data = await res.json(); } catch { /* réponse vide ou non JSON */ }
    if (!res.ok) {
      return { ok: false, data, message: (data && (data.error || data.message)) || `Erreur ${res.status}` };
    }
    return { ok: true, data, message: '' };
  } catch {
    return { ok: false, data: null, message: 'Connexion impossible. Réessayez.' };
  }
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────

export default function GestionMenus({ naviguerVers }: { naviguerVers?: (page: string) => void }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [onglet, setOnglet] = useState<'principal' | 'footer'>('principal');
  const [loading, setLoading] = useState(true);
  const [menuActifId, setMenuActifId] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<'ajouter' | 'modifier' | null>(null);
  const [itemEnEdition, setItemEnEdition] = useState<MenuItem | null>(null);
  const [formItem, setFormItem] = useState<FormItem>(FORM_VIDE);
  const [modalMenu, setModalMenu] = useState(false);
  const [formMenu, setFormMenu] = useState({ nom: '', type: 'principal', description: '' });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreurItem, setErreurItem] = useState('');
  const [erreurMenu, setErreurMenu] = useState('');
  const [erreurPage, setErreurPage] = useState('');
  const [itemExpande, setItemExpande] = useState<Set<number>>(new Set());

  useEffect(() => { fetchMenus(true); }, []);

  async function fetchMenus(premier = false) {
    if (premier) setLoading(true);
    const r = await appeler('/menus');
    if (r.ok) {
      setMenus((r.data && r.data.menus) || []);
      if (!premier) setErreurPage('');
    } else {
      setErreurPage(`Impossible de charger les menus : ${r.message}`);
    }
    if (premier) setLoading(false);
  }

  // Action de la liste (masquer, réordonner, supprimer…) : recharge, et affiche l'erreur si refusée
  async function action(chemin: string, methode: string, corps?: unknown): Promise<boolean> {
    const r = await appeler(chemin, methode, corps);
    if (!r.ok) { setErreurPage(r.message); return false; }
    setErreurPage('');
    await fetchMenus();
    return true;
  }

  // ─── MENUS FILTRÉS PAR TYPE ──────────────────────────────────────────────

  const menusType = menus.filter(m => m.type === onglet);
  const menuActif: Menu | null = menusType.find(m => m.id === menuActifId) || menusType[0] || null;
  // Le site affiche le premier menu ACTIF de chaque type (le plus ancien)
  const menuAffiche: Menu | null = menusType.find(m => m.actif) || null;

  async function creerMenu() {
    if (!formMenu.nom.trim()) return;
    setErreurMenu('');
    const r = await appeler('/menus', 'POST', formMenu);
    if (!r.ok) { setErreurMenu(r.message); return; }
    setModalMenu(false);
    setFormMenu({ nom: '', type: 'principal', description: '' });
    if (r.data && r.data.menu) { setOnglet(r.data.menu.type === 'footer' ? 'footer' : 'principal'); setMenuActifId(r.data.menu.id); }
    await fetchMenus();
  }

  function toggleActifMenu(menu: Menu) { return action(`/menus/${menu.id}`, 'PATCH', { actif: !menu.actif }); }

  async function supprimerMenu(menu: Menu) {
    if (!window.confirm(`Supprimer le menu « ${menu.nom} » et tous ses items ?`)) return;
    await action(`/menus/${menu.id}`, 'DELETE');
  }

  function ouvrirAjout(parentId: number | null = null) {
    setFormItem({ ...FORM_VIDE, parent_id: parentId });
    setItemEnEdition(null);
    setErreurItem('');
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
      couleur: item.couleur || '',
      visible: item.visible,
      parent_id: item.parent_id,
    });
    setItemEnEdition(item);
    setErreurItem('');
    setModalItem('modifier');
  }

  async function sauvegarderItem() {
    if (!menuActif || !formItem.label.trim()) return;
    setSauvegarde(true);
    setErreurItem('');
    const corps = { ...formItem, url: formItem.type_lien === 'politiques' ? '' : formItem.url.trim() };
    const r = modalItem === 'ajouter'
      ? await appeler(`/menus/${menuActif.id}/items`, 'POST', corps)
      : itemEnEdition
        ? await appeler(`/menus/${menuActif.id}/items/${itemEnEdition.id}`, 'PATCH', corps)
        : null;
    setSauvegarde(false);
    if (r && !r.ok) { setErreurItem(r.message); return; }
    if (formItem.parent_id) setItemExpande(prev => new Set(prev).add(formItem.parent_id as number));
    setModalItem(null);
    await fetchMenus();
  }

  async function supprimerItem(item: MenuItem) {
    if (!menuActif) return;
    const avecSous = item.sous_items && item.sous_items.length > 0;
    const msg = avecSous
      ? `Supprimer « ${item.label} » et ses ${item.sous_items.length} sous-menu(s) ?`
      : `Supprimer « ${item.label} » ?`;
    if (!window.confirm(msg)) return;
    await action(`/menus/${menuActif.id}/items/${item.id}`, 'DELETE');
  }

  function toggleVisibleItem(item: MenuItem) {
    if (!menuActif) return Promise.resolve(false);
    return action(`/menus/${menuActif.id}/items/${item.id}`, 'PATCH', { visible: !item.visible });
  }

  // Échange l'élément avec son voisin (delta = -1 pour monter, +1 pour descendre)
  async function deplacerItem(item: MenuItem, items: MenuItem[], delta: -1 | 1) {
    if (!menuActif) return;
    const idx = items.findIndex(i => i.id === item.id);
    const cible = idx + delta;
    if (idx < 0 || cible < 0 || cible >= items.length) return;
    const ordres = items.map((it, i) => ({ id: it.id, ordre: i === idx ? cible : i === cible ? idx : i }));
    await action(`/menus/${menuActif.id}/items/reordonner`, 'PUT', { ordres });
  }

  // ─── RENDU D'UN ITEM (récursif, 1 niveau de sous-menu) ───────────────────

  function rendreItem(item: MenuItem, items: MenuItem[]) {
    const expande = itemExpande.has(item.id);
    const hasChildren = item.sous_items && item.sous_items.length > 0;
    const peutAvoirSousMenu = item.parent_id === null && item.type_lien !== 'politiques';

    return (
      <div key={item.id}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px',
          background: item.visible ? '#fff' : '#f8f9fa',
          border: `1px solid ${item.visible ? THEME.border : '#e5e7eb'}`,
          borderRadius: '10px',
          marginBottom: '6px',
          opacity: item.visible ? 1 : 0.6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {hasChildren ? (
            <button
              style={s.btnIcone}
              title={expande ? 'Cacher les sous-menus' : 'Voir les sous-menus'}
              onClick={() => {
                const n = new Set(itemExpande);
                if (expande) n.delete(item.id); else n.add(item.id);
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

          {item.icone && <span style={{ fontSize: '16px' }}>{item.icone}</span>}

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
            {item.type_lien === 'politiques' && (
              <span style={{ fontSize: '11px', color: THEME.textLight, marginLeft: '8px' }}>
                → liste de vos politiques
              </span>
            )}
          </div>

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

          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button style={{ ...s.btnAction, background: '#f0f2f5' }} onClick={() => deplacerItem(item, items, -1)} title="Monter">↑</button>
            <button style={{ ...s.btnAction, background: '#f0f2f5' }} onClick={() => deplacerItem(item, items, 1)} title="Descendre">↓</button>
            {peutAvoirSousMenu ? (
              <button style={{ ...s.btnAction, background: '#e8f2fb', color: THEME.accent }} onClick={() => ouvrirAjout(item.id)} title="Ajouter un sous-menu">+</button>
            ) : (
              <div style={{ width: '28px', flexShrink: 0 }} />
            )}
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

        {hasChildren && expande && (
          <div style={{ marginLeft: '24px', borderLeft: `2px solid ${THEME.border}`, paddingLeft: '12px', marginBottom: '6px' }}>
            {item.sous_items.map(si => rendreItem(si, item.sous_items))}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDU PRINCIPAL ─────────────────────────────────────────────────────

  if (loading) return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={s.spinner} />
        <span style={{ marginLeft: '12px', color: THEME.textLight }}>Chargement des menus...</span>
      </div>
    </div>
  );

  const typeAide = TYPE_LIENS.find(t => t.value === formItem.type_lien);
  const typesDisponibles = TYPE_LIENS.filter(t =>
    t.value !== 'politiques' || menuActif?.type === 'footer' || formItem.type_lien === 'politiques'
  );

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── EN-TÊTE ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>🛠️ Gestion des menus</h1>
          <p style={s.sousTitre}>Le menu du haut et le pied de page affichés sur toutes les pages publiques de e-Vend Studio</p>
        </div>
        <button style={s.btnCreer} onClick={() => { setErreurMenu(''); setFormMenu({ nom: '', type: onglet, description: '' }); setModalMenu(true); }}>
          + Créer un nouveau menu
        </button>
      </div>

      {erreurPage && (
        <div style={s.bandeauErreur} role="alert">
          <span>⚠️ {erreurPage}</span>
          <button style={s.btnFermer} onClick={() => setErreurPage('')} title="Fermer">✕</button>
        </div>
      )}

      {/* ── ONGLETS ── */}
      <div style={s.onglets}>
        {[
          { id: 'principal', label: '🧭 Menu du haut', count: menus.filter(m => m.type === 'principal').length },
          { id: 'footer',    label: '📄 Pied de page', count: menus.filter(m => m.type === 'footer').length },
        ].map(o => (
          <button
            key={o.id}
            style={{ ...s.ongletBtn, ...(onglet === o.id ? s.ongletActif : {}) }}
            onClick={() => setOnglet(o.id as 'principal' | 'footer')}
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
        <div>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitre}>
                {onglet === 'principal' ? '🧭 Menus du haut' : '📄 Menus du pied de page'}
              </span>
              <span style={{ fontSize: '12px', color: THEME.textLight }}>{menusType.length} menu{menusType.length > 1 ? 's' : ''}</span>
            </div>

            {menusType.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📋</p>
                <p style={{ color: THEME.textLight, fontSize: '14px' }}>Aucun menu créé</p>
                <p style={{ color: THEME.textLight, fontSize: '12px', margin: '6px 0 0' }}>
                  Sans menu, le site affiche ses liens par défaut.
                </p>
                <button style={{ ...s.btnCreer, marginTop: '12px', fontSize: '13px', padding: '8px 16px' }} onClick={() => { setErreurMenu(''); setFormMenu({ nom: '', type: onglet, description: '' }); setModalMenu(true); }}>
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
                  onClick={() => setMenuActifId(menu.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: menuActif?.id === menu.id ? THEME.accent : THEME.text, margin: '0 0 2px' }}>
                      {menu.nom}
                    </p>
                    <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
                      {menu.items?.length || 0} item{(menu.items?.length || 0) > 1 ? 's' : ''} · {menu.actif ? '✅ Actif' : '⏸ Inactif'}
                    </p>
                    {menuAffiche?.id === menu.id && (
                      <p style={{ fontSize: '11px', color: THEME.success, fontWeight: 700, margin: '3px 0 0' }}>🌐 Affiché sur le site</p>
                    )}
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
                      onClick={e => { e.stopPropagation(); supprimerMenu(menu); }}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
            {menusType.length > 1 && (
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0, padding: '10px 16px', background: '#fafbfc' }}>
                Le site n'affiche qu'un seul menu par type : le premier menu actif de la liste.
              </p>
            )}
          </div>
        </div>

        {/* ── ÉDITEUR DE MENU (droite) ── */}
        <div>
          {!menuActif ? (
            <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>👈</p>
                <p style={{ color: THEME.textLight, fontSize: '15px' }}>Créez ou sélectionnez un menu pour l'éditer</p>
              </div>
            </div>
          ) : (
            <div style={s.card}>
              <div style={{ ...s.cardHeader, marginBottom: '0' }}>
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
              <div style={s.apercuWrap}>
                <p style={s.apercuTitre}>Aperçu rendu</p>
                <div style={s.apercuMenu}>
                  {menuActif.type === 'principal' && (
                    <div style={s.apercuLogo} title="Logo fixe, affiché à gauche sur toutes les pages">
                      <span style={s.logoBoite}>e</span>
                      <span>e-Vend Studio</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', flex: 1, justifyContent: menuActif.type === 'principal' ? 'center' : 'flex-start' }}>
                    {menuActif.items.filter(i => i.visible).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.icone && <span style={{ fontSize: '14px' }}>{item.icone}</span>}
                        <span style={{
                          fontSize: item.taille_texte + 'px',
                          fontWeight: item.gras ? 700 : 400,
                          fontStyle: item.italique ? 'italic' : 'normal',
                          color: item.couleur || '#fff',
                          padding: '6px 10px',
                        }}>
                          {item.label}
                        </span>
                        {(item.sous_items?.some(si => si.visible) || item.type_lien === 'politiques') && (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>▾</span>
                        )}
                      </div>
                    ))}
                    {menuActif.items.filter(i => i.visible).length === 0 && (
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Aucun item visible</span>
                    )}
                  </div>
                  {menuActif.type === 'principal' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} title="Boutons fixes, affichés à droite sur toutes les pages">
                      <span style={s.apercuBtnSponsor}>⭐ Commanditaire</span>
                      <span style={s.apercuBtnCompte}>Mon compte →</span>
                    </div>
                  )}
                </div>
                {menuActif.type === 'principal' && (
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '8px 0 0' }}>
                    Le logo à gauche et les boutons « Commanditaire » et « Mon compte » à droite sont fixes : ils s'affichent toujours, sur toutes les pages publiques.
                  </p>
                )}
              </div>

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
                    {menuActif.items.map(item => rendreItem(item, menuActif.items))}
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
                  placeholder="ex: Menu d'été"
                  maxLength={100}
                  value={formMenu.nom}
                  onChange={e => setFormMenu({ ...formMenu, nom: e.target.value })}
                  autoFocus
                />
              </div>
              <div style={s.champWrap}>
                <label style={s.label}>Type</label>
                <select style={s.input} value={formMenu.type} onChange={e => setFormMenu({ ...formMenu, type: e.target.value })}>
                  <option value="principal">Menu du haut</option>
                  <option value="footer">Pied de page</option>
                </select>
              </div>
              <div style={s.champWrap}>
                <label style={s.label}>Description (optionnel)</label>
                <input
                  style={s.input}
                  placeholder="Description interne"
                  maxLength={500}
                  value={formMenu.description}
                  onChange={e => setFormMenu({ ...formMenu, description: e.target.value })}
                />
              </div>
              <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
                Un nouveau menu actif n'est affiché sur le site que s'il est le premier menu actif de son type.
              </p>
            </div>
            {erreurMenu && (
              <div style={s.erreurModal}>⚠️ {erreurMenu}</div>
            )}
            <div style={s.modalFooter}>
              <button style={s.btnAnnuler} onClick={() => setModalMenu(false)}>Annuler</button>
              <button
                style={{ ...s.btnSauvegarder, opacity: formMenu.nom.trim() ? 1 : 0.6 }}
                onClick={creerMenu}
                disabled={!formMenu.nom.trim()}
              >
                Créer le menu
              </button>
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>Texte affiché *</label>
                  <input
                    style={s.input}
                    placeholder="ex: Blog, Contact..."
                    maxLength={60}
                    value={formItem.label}
                    onChange={e => setFormItem({ ...formItem, label: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={s.label}>Type de lien</label>
                  <select
                    style={s.input}
                    value={formItem.type_lien}
                    onChange={e => setFormItem({ ...formItem, type_lien: e.target.value, url: e.target.value === 'politiques' ? '' : formItem.url })}
                  >
                    {typesDisponibles.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Ouvrir dans</label>
                  <select style={s.input} value={formItem.cible} onChange={e => setFormItem({ ...formItem, cible: e.target.value })}>
                    <option value="_self">Même onglet</option>
                    <option value="_blank">Nouvel onglet</option>
                  </select>
                </div>

                {typeAide && (
                  <p style={{ gridColumn: '1 / -1', fontSize: '12px', color: THEME.textLight, margin: '-6px 0 0' }}>{typeAide.aide}</p>
                )}

                {formItem.type_lien !== 'politiques' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={s.label}>Adresse du lien</label>
                    <input
                      style={s.input}
                      placeholder={formItem.type_lien === 'ancre' ? '/#templates' : '/blog ou https://...'}
                      maxLength={500}
                      value={formItem.url}
                      onChange={e => setFormItem({ ...formItem, url: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {LIENS_RAPIDES.map(lien => (
                        <button
                          key={lien.url}
                          type="button"
                          style={s.btnLienRapide}
                          onClick={() => setFormItem({ ...formItem, url: lien.url, type_lien: lien.type, label: formItem.label || lien.label })}
                        >
                          {lien.label}
                        </button>
                      ))}
                    </div>
                    {formItem.parent_id === null && !formItem.url.trim() && (
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: '6px 0 0' }}>
                        Sans adresse, l'item sert de titre pour regrouper des sous-menus.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label style={s.label}>Icône (emoji)</label>
                  <input
                    style={s.input}
                    placeholder="🏠 ⭐ 📦"
                    maxLength={16}
                    value={formItem.icone}
                    onChange={e => setFormItem({ ...formItem, icone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={s.label}>Couleur du texte</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(formItem.couleur) ? formItem.couleur : '#ffffff'}
                      onChange={e => setFormItem({ ...formItem, couleur: e.target.value })}
                      style={{ width: '44px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      style={{ ...s.input, flex: 1 }}
                      value={formItem.couleur}
                      onChange={e => setFormItem({ ...formItem, couleur: e.target.value })}
                      placeholder="Par défaut (couleur du site)"
                    />
                    {formItem.couleur && (
                      <button type="button" style={s.btnLienRapide} onClick={() => setFormItem({ ...formItem, couleur: '' })}>
                        Par défaut
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={s.label}>Taille du texte : {formItem.taille_texte}px</label>
                  <input
                    type="range"
                    min="10" max="24" step="1"
                    value={formItem.taille_texte}
                    onChange={e => setFormItem({ ...formItem, taille_texte: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: THEME.accent }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: THEME.textLight }}>
                    <span>10px</span>
                    <span style={{ fontSize: formItem.taille_texte + 'px', fontWeight: formItem.gras ? 700 : 400, fontStyle: formItem.italique ? 'italic' : 'normal', color: formItem.couleur || THEME.text }}>
                      {formItem.label || 'Aperçu'}
                    </span>
                    <span>24px</span>
                  </div>
                </div>

                <div>
                  <label style={s.label}>Style</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      style={{ ...s.btnStyle, ...(formItem.gras ? s.btnStyleActif : {}) }}
                      onClick={() => setFormItem({ ...formItem, gras: !formItem.gras })}
                    >
                      <strong>G</strong>
                    </button>
                    <button
                      type="button"
                      style={{ ...s.btnStyle, ...(formItem.italique ? s.btnStyleActif : {}) }}
                      onClick={() => setFormItem({ ...formItem, italique: !formItem.italique })}
                    >
                      <em>I</em>
                    </button>
                  </div>
                </div>

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

            {erreurItem && (
              <div style={s.erreurModal}>⚠️ {erreurItem}</div>
            )}
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

  bandeauErreur: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: `1px solid ${THEME.danger}`, borderRadius: '10px', color: THEME.danger, fontSize: '13px', fontWeight: 600 },

  onglets: { display: 'flex', gap: '4px', marginBottom: '20px', background: '#fff', padding: '4px', borderRadius: '12px', border: `1px solid ${THEME.border}`, width: 'fit-content' },
  ongletBtn: { padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: THEME.textLight, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' },
  ongletActif: { background: THEME.accent, color: '#fff', fontWeight: 700 },
  ongletBadge: { fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', minWidth: '20px', textAlign: 'center' },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },

  card: { background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${THEME.border}` },
  cardTitre: { fontSize: '14px', fontWeight: 700, color: THEME.text },

  menuListeItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${THEME.border}`, transition: 'background 0.15s' },
  menuListeItemActif: { background: '#e8f2fb', borderLeft: `3px solid ${THEME.accent}` },

  apercuWrap: { padding: '16px 20px', borderBottom: `1px solid ${THEME.border}` },
  apercuTitre: { fontSize: '11px', fontWeight: 600, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  apercuMenu: { display: 'flex', alignItems: 'center', gap: '12px', background: THEME.barre, padding: '8px 16px', borderRadius: '10px', flexWrap: 'wrap' },
  apercuLogo: { display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '14px', whiteSpace: 'nowrap' },
  logoBoite: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: THEME.orange, color: '#000', fontWeight: 900, fontSize: '14px' },
  apercuBtnSponsor: { fontSize: '12px', fontWeight: 700, color: THEME.orange, border: `1px solid ${THEME.orange}`, borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap' },
  apercuBtnCompte: { fontSize: '12px', fontWeight: 700, color: '#000', background: THEME.orange, borderRadius: '8px', padding: '6px 12px', whiteSpace: 'nowrap' },

  btnIcone: { width: '28px', height: '28px', border: `1px solid ${THEME.border}`, borderRadius: '6px', background: '#f0f2f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 },
  btnAction: { width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, transition: 'all 0.15s' },
  btnAjouter: { padding: '7px 14px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },

  spinner: { width: '32px', height: '32px', border: `3px solid ${THEME.border}`, borderTop: `3px solid ${THEME.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${THEME.border}` },
  modalTitre: { fontSize: '16px', fontWeight: 800, color: THEME.text, margin: 0 },
  btnFermer: { width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: '#f0f2f5', cursor: 'pointer', fontSize: '14px', flexShrink: 0 },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: `1px solid ${THEME.border}` },
  erreurModal: { margin: '0 24px 12px', padding: '10px 14px', background: '#fef2f2', border: `1px solid ${THEME.danger}`, borderRadius: '8px', color: THEME.danger, fontSize: '13px', fontWeight: 600 },

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