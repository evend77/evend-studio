// CHEMIN : src/pages/gestionnaire/StudioCategories.tsx
// e-Vend Studio — Dashboard gestionnaire : catégories et groupes de catégories de MA boutique
// (+ choix « taxable » par catégorie). Adapté de GestionCategories.tsx (e-Vend), même apparence,
// responsive mobile (cartes au lieu du tableau).
// API : /api/studio-categories/:gestionnaireId/{categories,groupes,upload}  (cookie httpOnly, credentials: 'include')

import React, { useState, useEffect } from 'react';

interface Categorie {
  id: number;
  nom: string;
  active: boolean;
  productCount?: number;
  image?: string | null;
  description?: string;
  groupeId?: number | null;
  groupeNom?: string | null;
  taxable: boolean;
}

interface Groupe {
  id: number;
  nom: string;
  ordre?: number | null;
  active: boolean;
  nbCategories?: number;
  image?: string | null;
}

const THEME = {
  sidebar: '#1a2436', accent: '#2d6a9f', accentLight: '#e8f2fb', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const HEADERS = { 'Content-Type': 'application/json' };

function useIsMobile(): boolean {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}

async function erreurServeur(res: Response, defaut: string): Promise<string> {
  const j = await res.json().catch(() => ({}));
  return j.error || j.message || defaut;
}

// ─── Envoi d'image (R2) ───────────────────────────────────────────────────────

function ChampImage({ base, titre, imagePreview, setImagePreview, imageUrl, setImageUrl, uploading, setUploading, erreur, setErreur, original }: {
  base: string; titre: string;
  imagePreview: string | null; setImagePreview: (v: string | null) => void;
  imageUrl: string | null; setImageUrl: (v: string | null) => void;
  uploading: boolean; setUploading: (v: boolean) => void;
  erreur?: string; setErreur: (v: string | undefined) => void;
  original: string | null;
}) {
  const choisir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewLocal = URL.createObjectURL(file);
    setImagePreview(previewLocal);
    setUploading(true);
    setErreur(undefined);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${base}/upload`, { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Échec de l\'upload');
      setImageUrl(data.image_url);
      setImagePreview(data.image_url);
    } catch (err: any) {
      setErreur(err?.message || 'Erreur lors de l\'upload de l\'image');
      setImagePreview(original);
      setImageUrl(original);
    } finally {
      URL.revokeObjectURL(previewLocal);
      setUploading(false);
      e.target.value = '';
    }
  };
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>{titre}</label>
      {imagePreview && (
        <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', width: '100%', maxHeight: '200px', border: `1px solid ${THEME.border}`, position: 'relative' }}>
          <img src={imagePreview} alt="Aperçu" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block', opacity: uploading ? 0.5 : 1 }} />
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: THEME.text, background: 'rgba(255,255,255,0.6)' }}>
              ⏳ Envoi en cours...
            </div>
          )}
        </div>
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choisir} disabled={uploading}
        style={{ width: '100%', padding: '10px', border: `2px dashed ${erreur ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
      {erreur
        ? <p style={{ fontSize: '11px', color: THEME.danger, margin: '5px 0 0 0' }}>{erreur}</p>
        : <p style={{ fontSize: '11px', color: THEME.textLight, margin: '5px 0 0 0' }}>Formats acceptés: JPG, PNG, GIF, WEBP. Taille max: 5MB</p>}
      {imageUrl && !uploading && (
        <button type="button" onClick={() => { setImageUrl(null); setImagePreview(null); }}
          style={{ marginTop: 6, background: 'none', border: 'none', color: THEME.danger, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Retirer l'image</button>
      )}
    </div>
  );
}

// ─── Fenêtre modale (cadre commun) ────────────────────────────────────────────

function CadreModal({ icone, titre, sousTitre, largeur, onClose, children, pied }: {
  icone: string; titre: string; sousTitre: string; largeur: number; onClose: () => void; children: React.ReactNode; pied: React.ReactNode;
}) {
  const mobile = useIsMobile();
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: mobile ? '10px' : '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: `${largeur}px`, maxHeight: mobile ? '94vh' : '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: mobile ? '16px' : '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icone}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{titre}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{sousTitre}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: mobile ? '16px' : '20px 24px' }}>{children}</div>
        <div style={{ padding: mobile ? '12px 16px' : '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>{pied}</div>
      </div>
    </div>
  );
}

const btnAnnuler: React.CSSProperties = { padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' };
const btnSauver = (ok: boolean): React.CSSProperties => ({ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: ok ? 'pointer' : 'not-allowed', backgroundColor: ok ? THEME.accent : '#cccccc', color: 'white' });
const champTexte = (err?: string): React.CSSProperties => ({ width: '100%', padding: '12px 14px', border: `2px solid ${err ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' });
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' };

// ─── Modale catégorie ─────────────────────────────────────────────────────────

function ModalCategorie({ isOpen, categorie, groupes, base, onClose, onSave }: {
  isOpen: boolean; categorie?: Categorie | null; groupes: Groupe[]; base: string; onClose: () => void;
  onSave: (nom: string, description?: string, image?: string, groupeId?: number | null, taxable?: boolean) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [groupeId, setGroupeId] = useState<number | null>(null);
  const [taxable, setTaxable] = useState(true);
  const [erreurs, setErreurs] = useState<{ nom?: string; image?: string }>({});

  useEffect(() => {
    setNom(categorie?.nom || '');
    setDescription(categorie?.description || '');
    setImagePreview(categorie?.image || null);
    setImageUrl(categorie?.image || null);
    setGroupeId(categorie?.groupeId ?? null);
    setTaxable(categorie ? categorie.taxable !== false : true);
    setUploading(false);
    setErreurs({});
  }, [categorie, isOpen]);

  if (!isOpen) return null;

  const sauver = () => {
    if (!nom.trim()) { setErreurs({ nom: 'Le nom de la catégorie est requis' }); return; }
    onSave(nom.trim(), description.trim() || undefined, imageUrl || undefined, groupeId, taxable);
  };
  const ok = !!nom.trim() && !uploading;

  return (
    <CadreModal icone="🗂️" titre={categorie ? 'Modifier la catégorie' : 'Créer une catégorie'}
      sousTitre={categorie ? 'Modifier les informations de la catégorie' : 'Ajouter une nouvelle catégorie'} largeur={560} onClose={onClose}
      pied={<>
        <button onClick={onClose} style={btnAnnuler}>Annuler</button>
        <button onClick={sauver} disabled={!ok} style={btnSauver(ok)}>{uploading ? '⏳ Upload en cours...' : (nom.trim() ? '✅ Enregistrer' : 'Enregistrer')}</button>
      </>}>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Nom de la catégorie <span style={{ color: THEME.danger }}>*</span></label>
        <input type="text" value={nom} maxLength={100} onChange={e => setNom(e.target.value)} style={champTexte(erreurs.nom)} placeholder="Ex: Électronique" />
        {erreurs.nom && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.nom}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Groupe {groupeId == null && <span style={{ color: THEME.warning, fontWeight: '500' }}>(non assigné)</span>}</label>
        <select value={groupeId ?? ''} onChange={e => setGroupeId(e.target.value ? parseInt(e.target.value, 10) : null)} style={{ ...champTexte(), border: `2px solid ${THEME.border}`, backgroundColor: 'white' }}>
          <option value="">— Aucun groupe —</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{!g.active ? ' (inactif)' : ''}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Description (optionnelle)</label>
        <textarea value={description} maxLength={1000} onChange={e => setDescription(e.target.value)}
          style={{ ...champTexte(), minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Description de la catégorie..." />
      </div>

      <ChampImage base={base} titre="Image de la catégorie" imagePreview={imagePreview} setImagePreview={setImagePreview} imageUrl={imageUrl} setImageUrl={setImageUrl}
        uploading={uploading} setUploading={setUploading} erreur={erreurs.image} setErreur={v => setErreurs(p => ({ ...p, image: v }))} original={categorie?.image || null} />

      {/* Taxes : le gestionnaire décide si les produits de cette catégorie sont taxables. */}
      <div style={{ marginBottom: '20px', padding: '14px 16px', backgroundColor: taxable ? '#f0f9ff' : '#fef9c3', border: `1px solid ${taxable ? '#bae6fd' : '#d97706'}`, borderRadius: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} style={{ marginTop: '2px', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 4px 0' }}>🏷️ Catégorie taxable (TPS/TVQ)</p>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0, lineHeight: 1.5 }}>
              Cochée : les taxes s'appliquent aux produits de cette catégorie au paiement. <strong>Décochée : aucune taxe</strong> — à réserver aux catégories où une exemption existe réellement selon Revenu Québec / l'ARC (ex: aliments de base, produits agricoles ou de pêche).
              <br /><br />
              ⚠️ En cas de doute, laissez coché — consultez d'abord{' '}
              <a href="https://www.revenuquebec.ca/fr/citoyens/taxes/biens-et-services-taxables-detaxes-ou-exoneres/tps-et-tvq/alimentation-produits-taxables-detaxes-ou-exoneres/produits-alimentaires-de-base/" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent, fontWeight: '600' }}>
                la page de Revenu Québec sur les produits détaxés
              </a>.
            </p>
          </div>
        </label>
      </div>
    </CadreModal>
  );
}

// ─── Modale groupe ────────────────────────────────────────────────────────────

function ModalGroupe({ isOpen, groupe, base, onClose, onSave }: {
  isOpen: boolean; groupe?: Groupe | null; base: string; onClose: () => void;
  onSave: (nom: string, ordre: number | null, image: string | null) => void;
}) {
  const [nom, setNom] = useState('');
  const [ordre, setOrdre] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erreurs, setErreurs] = useState<{ nom?: string; image?: string }>({});

  useEffect(() => {
    setNom(groupe?.nom || '');
    setOrdre(groupe?.ordre != null ? String(groupe.ordre) : '');
    setImagePreview(groupe?.image || null);
    setImageUrl(groupe?.image || null);
    setUploading(false);
    setErreurs({});
  }, [groupe, isOpen]);

  if (!isOpen) return null;

  const sauver = () => {
    if (!nom.trim()) { setErreurs({ nom: 'Le nom du groupe est requis' }); return; }
    onSave(nom.trim(), ordre.trim() ? parseInt(ordre, 10) : null, imageUrl);
  };
  const ok = !!nom.trim() && !uploading;

  return (
    <CadreModal icone="📁" titre={groupe ? 'Modifier le groupe' : 'Créer un groupe'}
      sousTitre={groupe ? 'Modifier les informations du groupe' : 'Ajouter un nouveau groupe de catégories'} largeur={480} onClose={onClose}
      pied={<>
        <button onClick={onClose} style={btnAnnuler}>Annuler</button>
        <button onClick={sauver} disabled={!ok} style={btnSauver(ok)}>{uploading ? '⏳ Upload en cours...' : (nom.trim() ? '✅ Enregistrer' : 'Enregistrer')}</button>
      </>}>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Nom du groupe <span style={{ color: THEME.danger }}>*</span></label>
        <input type="text" value={nom} maxLength={100} onChange={e => setNom(e.target.value)} style={champTexte(erreurs.nom)} placeholder="Ex: Maison" />
        {erreurs.nom && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.nom}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Ordre d'affichage (optionnel)</label>
        <input type="number" min={0} value={ordre} onChange={e => setOrdre(e.target.value)} style={champTexte()} placeholder="Ex: 1" />
        <p style={{ fontSize: '11px', color: THEME.textLight, margin: '5px 0 0 0' }}>Détermine l'ordre d'affichage sur le site. Laisser vide pour trier par nom.</p>
      </div>

      <ChampImage base={base} titre="Image du groupe" imagePreview={imagePreview} setImagePreview={setImagePreview} imageUrl={imageUrl} setImageUrl={setImageUrl}
        uploading={uploading} setUploading={setUploading} erreur={erreurs.image} setErreur={v => setErreurs(p => ({ ...p, image: v }))} original={groupe?.image || null} />
    </CadreModal>
  );
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

function ModalConfirmation({ isOpen, title, message, onConfirm, onCancel }: {
  isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: THEME.text, margin: '0 0 20px 0' }}>{message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={btnAnnuler}>Annuler</button>
            <button onClick={onConfirm} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: THEME.danger, color: 'white' }}>Confirmer</button>
          </div>
        </div>
      </div>
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

// Menu « ⋮ » : activer / désactiver / supprimer
function MenuActions({ ouvert, onToggle, onActiver, onDesactiver, onSupprimer }: {
  ouvert: boolean; onToggle: () => void; onActiver: () => void; onDesactiver: () => void; onSupprimer: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} style={{ background: '#f0f0f0', border: `1px solid ${THEME.border}`, cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', fontSize: '14px' }}>⋮</button>
      {ouvert && (
        <div style={{ position: 'fixed', backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: '160px' }}
          ref={el => {
            if (el) {
              const btn = el.previousSibling as HTMLElement;
              const rect = btn?.getBoundingClientRect();
              if (rect) {
                el.style.top = rect.bottom + 4 + 'px';
                el.style.left = Math.max(8, Math.min(rect.right - 160, window.innerWidth - 168)) + 'px';
              }
            }
          }}>
          <div style={{ padding: '4px 0' }}>
            <MenuItem onClick={onActiver}>✓ Activer</MenuItem>
            <MenuItem onClick={onDesactiver}>⚠ Désactiver</MenuItem>
            <MenuItem onClick={onSupprimer} style={{ color: THEME.danger }}>🗑 Supprimer</MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

const th = (align: 'left' | 'center'): React.CSSProperties => ({ padding: '13px 8px', textAlign: align, fontSize: '11px', fontWeight: '700', color: THEME.accent });
const btnModifier: React.CSSProperties = { backgroundColor: THEME.accentLight, color: THEME.accent, border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' };
const pastille = (ok: boolean): React.CSSProperties => ({ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: ok ? '#dcfce7' : '#fee2e2', color: ok ? THEME.success : THEME.danger, whiteSpace: 'nowrap' });

function Pagination({ parPage, page, total, setPage }: { parPage: number; page: number; total: number; setPage: (f: (p: number) => number) => void }) {
  return (
    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: THEME.textLight, flexWrap: 'wrap', gap: 8 }}>
      <span>{parPage} par page</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>Page {page} / {total || 1}</span>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          style={{ padding: '4px 8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>←</button>
        <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total}
          style={{ padding: '4px 8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', background: 'white', cursor: page >= total ? 'not-allowed' : 'pointer', opacity: page >= total ? 0.5 : 1 }}>→</button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function StudioCategories({ gestionnaireId }: { gestionnaireId: number }) {
  const base = `/api/studio-categories/${gestionnaireId}`;
  const mobile = useIsMobile();
  const [ongletActif, setOngletActif] = useState<'categories' | 'groupes'>('categories');

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modalCategorie, setModalCategorie] = useState<{ isOpen: boolean; categorie?: Categorie | null }>({ isOpen: false, categorie: null });
  const [modalConfirmation, setModalConfirmation] = useState<{ isOpen: boolean; type: 'desactiver' | 'activer' | 'supprimer' | null; categorie?: Categorie | null }>({ isOpen: false, type: null, categorie: null });
  const [currentPage, setCurrentPage] = useState(1);

  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [searchGroupes, setSearchGroupes] = useState('');
  const [selectedIdsGroupes, setSelectedIdsGroupes] = useState<number[]>([]);
  const [menuOuvertGroupe, setMenuOuvertGroupe] = useState<number | null>(null);
  const [loadingGroupes, setLoadingGroupes] = useState(true);
  const [modalGroupe, setModalGroupe] = useState<{ isOpen: boolean; groupe?: Groupe | null }>({ isOpen: false, groupe: null });
  const [modalConfirmationGroupe, setModalConfirmationGroupe] = useState<{ isOpen: boolean; type: 'desactiver' | 'activer' | 'supprimer' | null; groupe?: Groupe | null }>({ isOpen: false, type: null, groupe: null });
  const [currentPageGroupes, setCurrentPageGroupes] = useState(1);

  const afficherToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const chargerCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base}/categories`, { credentials: 'include', headers: HEADERS });
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setCategories((data.categories || []).map((c: any) => ({
        id: c.id, nom: c.nom, active: c.active !== false, description: c.description || '', image: c.image || null,
        productCount: c.product_count || 0, groupeId: c.groupe_id ?? null, groupeNom: c.groupe_nom ?? null, taxable: c.taxable !== false,
      })));
    } catch {
      afficherToast('❌ Erreur chargement des catégories', false);
    } finally { setLoading(false); }
  };

  const chargerGroupes = async () => {
    try {
      setLoadingGroupes(true);
      const res = await fetch(`${base}/groupes`, { credentials: 'include', headers: HEADERS });
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setGroupes((data.groupes || []).map((g: any) => ({
        id: g.id, nom: g.nom, ordre: g.ordre, active: g.active !== false, nbCategories: parseInt(g.nb_categories, 10) || 0, image: g.image || null,
      })));
    } catch {
      afficherToast('❌ Erreur chargement des groupes', false);
    } finally { setLoadingGroupes(false); }
  };

  useEffect(() => { chargerCategories(); chargerGroupes(); /* eslint-disable-next-line */ }, [gestionnaireId]);

  // ── Catégories ──
  const filteredCategories = categories.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()) || c.id.toString().includes(search));
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = () => setSelectedIds(selectedIds.length === paginatedCategories.length ? [] : paginatedCategories.map(c => c.id));
  const handleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const corpsCategorie = (c: Categorie, active: boolean) => JSON.stringify({
    nom: c.nom, description: c.description, image: c.image, groupe_id: c.groupeId ?? null, active, taxable: c.taxable,
  });

  const handleAction = async (categorie: Categorie, action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        const res = await fetch(`${base}/categories/${categorie.id}`, { method: 'DELETE', credentials: 'include', headers: HEADERS });
        if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
        setCategories(prev => prev.filter(c => c.id !== categorie.id));
        afficherToast(`🗑️ Catégorie "${categorie.nom}" supprimée`);
      } else {
        const active = action === 'activer';
        const res = await fetch(`${base}/categories/${categorie.id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corpsCategorie(categorie, active) });
        if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
        setCategories(prev => prev.map(c => c.id === categorie.id ? { ...c, active } : c));
        afficherToast(`✅ Catégorie "${categorie.nom}" ${active ? 'activée' : 'désactivée'}`);
      }
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || "Erreur lors de l'action"}`, false);
    }
    setMenuOuvert(null);
    setModalConfirmation({ isOpen: false, type: null, categorie: null });
  };

  const handleBulkAction = async (action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        const rs = await Promise.all(selectedIds.map(id => fetch(`${base}/categories/${id}`, { method: 'DELETE', credentials: 'include', headers: HEADERS })));
        if (rs.some(r => !r.ok)) throw new Error('Certaines suppressions ont échoué');
        setCategories(prev => prev.filter(c => !selectedIds.includes(c.id)));
        afficherToast(`🗑️ ${selectedIds.length} catégorie(s) supprimée(s)`);
      } else {
        const active = action === 'activer';
        const rs = await Promise.all(selectedIds.map(id => {
          const cat = categories.find(c => c.id === id)!;
          return fetch(`${base}/categories/${id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corpsCategorie(cat, active) });
        }));
        if (rs.some(r => !r.ok)) throw new Error('Certaines modifications ont échoué');
        setCategories(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, active } : c));
        afficherToast(`✅ ${selectedIds.length} catégorie(s) ${active ? 'activée(s)' : 'désactivée(s)'}`);
      }
      setSelectedIds([]);
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || 'Erreur action groupée'}`, false);
      chargerCategories();
    }
    setModalConfirmation({ isOpen: false, type: null });
  };

  const handleSaveCategorie = async (nom: string, description?: string, image?: string, groupeId?: number | null, taxable?: boolean) => {
    try {
      const corps = JSON.stringify({ nom, description, image, groupe_id: groupeId ?? null, active: modalCategorie.categorie ? modalCategorie.categorie.active : true, taxable: taxable !== false });
      const res = modalCategorie.categorie
        ? await fetch(`${base}/categories/${modalCategorie.categorie.id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corps })
        : await fetch(`${base}/categories`, { method: 'POST', credentials: 'include', headers: HEADERS, body: corps });
      if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
      afficherToast(`✅ Catégorie "${nom}" ${modalCategorie.categorie ? 'modifiée' : 'créée'}`);
      setModalCategorie({ isOpen: false, categorie: null });
      await Promise.all([chargerCategories(), chargerGroupes()]);
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || 'Erreur lors de la sauvegarde'}`, false);
    }
  };

  // ── Groupes ──
  const filteredGroupes = groupes.filter(g => g.nom.toLowerCase().includes(searchGroupes.toLowerCase()) || g.id.toString().includes(searchGroupes));
  const itemsParPageGroupes = 20;
  const totalPagesGroupes = Math.ceil(filteredGroupes.length / itemsParPageGroupes);
  const paginatedGroupes = filteredGroupes.slice((currentPageGroupes - 1) * itemsParPageGroupes, currentPageGroupes * itemsParPageGroupes);

  const handleSelectAllGroupes = () => setSelectedIdsGroupes(selectedIdsGroupes.length === paginatedGroupes.length ? [] : paginatedGroupes.map(g => g.id));
  const handleSelectGroupe = (id: number) => setSelectedIdsGroupes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const corpsGroupe = (g: Groupe, active: boolean) => JSON.stringify({ nom: g.nom, ordre: g.ordre, active, image: g.image ?? null });

  const handleActionGroupe = async (groupe: Groupe, action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        const res = await fetch(`${base}/groupes/${groupe.id}`, { method: 'DELETE', credentials: 'include', headers: HEADERS });
        if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
        setGroupes(prev => prev.filter(g => g.id !== groupe.id));
        afficherToast(`🗑️ Groupe "${groupe.nom}" supprimé`);
      } else {
        const active = action === 'activer';
        const res = await fetch(`${base}/groupes/${groupe.id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corpsGroupe(groupe, active) });
        if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
        setGroupes(prev => prev.map(g => g.id === groupe.id ? { ...g, active } : g));
        afficherToast(`✅ Groupe "${groupe.nom}" ${active ? 'activé' : 'désactivé'}`);
      }
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || "Erreur lors de l'action"}`, false);
    }
    setMenuOuvertGroupe(null);
    setModalConfirmationGroupe({ isOpen: false, type: null, groupe: null });
  };

  const handleBulkActionGroupe = async (action: 'activer' | 'desactiver' | 'supprimer') => {
    try {
      if (action === 'supprimer') {
        const rs = await Promise.all(selectedIdsGroupes.map(id => fetch(`${base}/groupes/${id}`, { method: 'DELETE', credentials: 'include', headers: HEADERS })));
        if (rs.some(r => !r.ok)) throw new Error('Certains groupes ont encore des catégories assignées');
        setGroupes(prev => prev.filter(g => !selectedIdsGroupes.includes(g.id)));
        afficherToast(`🗑️ ${selectedIdsGroupes.length} groupe(s) supprimé(s)`);
      } else {
        const active = action === 'activer';
        const rs = await Promise.all(selectedIdsGroupes.map(id => {
          const g = groupes.find(x => x.id === id)!;
          return fetch(`${base}/groupes/${id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corpsGroupe(g, active) });
        }));
        if (rs.some(r => !r.ok)) throw new Error('Certaines modifications ont échoué');
        setGroupes(prev => prev.map(g => selectedIdsGroupes.includes(g.id) ? { ...g, active } : g));
        afficherToast(`✅ ${selectedIdsGroupes.length} groupe(s) ${active ? 'activé(s)' : 'désactivé(s)'}`);
      }
      setSelectedIdsGroupes([]);
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || 'Erreur action groupée'}`, false);
      chargerGroupes();
    }
    setModalConfirmationGroupe({ isOpen: false, type: null, groupe: null });
  };

  const handleSaveGroupe = async (nom: string, ordre: number | null, image: string | null) => {
    try {
      const corps = JSON.stringify({ nom, ordre, active: modalGroupe.groupe ? modalGroupe.groupe.active : true, image });
      const res = modalGroupe.groupe
        ? await fetch(`${base}/groupes/${modalGroupe.groupe.id}`, { method: 'PUT', credentials: 'include', headers: HEADERS, body: corps })
        : await fetch(`${base}/groupes`, { method: 'POST', credentials: 'include', headers: HEADERS, body: corps });
      if (!res.ok) throw new Error(await erreurServeur(res, 'Erreur'));
      afficherToast(`✅ Groupe "${nom}" ${modalGroupe.groupe ? 'modifié' : 'créé'}`);
      setModalGroupe({ isOpen: false, groupe: null });
      await Promise.all([chargerGroupes(), chargerCategories()]);
    } catch (err: any) {
      afficherToast(`❌ ${err?.message || 'Erreur lors de la sauvegarde'}`, false);
    }
  };

  // ── Éléments d'interface communs ──
  const enTete = (titre: string, sous: string, labelBtn: string, onClick: () => void) => (
    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: mobile ? 'stretch' : 'center', flexDirection: mobile ? 'column' : 'row', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: mobile ? '19px' : '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' }}>{titre}</h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>{sous}</p>
      </div>
      <button onClick={onClick}
        style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span>+</span> {labelBtn}
      </button>
    </div>
  );

  const barreRecherche = (valeur: string, onChange: (v: string) => void, placeholder: string, nbResultats: number, nbSel: number,
    onAct: (t: 'activer' | 'desactiver' | 'supprimer') => void) => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
      <input type="text" value={valeur} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 14px', fontSize: '13px', outline: 'none', width: mobile ? '100%' : '300px', boxSizing: 'border-box' }} />
      <span style={{ fontSize: '12px', color: THEME.textLight }}>{nbResultats} résultat{nbResultats !== 1 ? 's' : ''}</span>
      {nbSel > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginLeft: mobile ? 0 : 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => onAct('activer')} style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✓ Activer ({nbSel})</button>
          <button onClick={() => onAct('desactiver')} style={{ backgroundColor: THEME.warning, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>⚠ Désactiver ({nbSel})</button>
          <button onClick={() => onAct('supprimer')} style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🗑 Supprimer ({nbSel})</button>
        </div>
      )}
    </div>
  );

  const chargement = (texte: string) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: THEME.textLight }}>{texte}</p>
      </div>
    </div>
  );

  const cadreListe = { backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'auto' } as React.CSSProperties;
  const carteMobile = (i: number) => ({ padding: '14px', borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }) as React.CSSProperties;

  return (
    <div style={{ padding: mobile ? '16px 12px' : '28px 32px', width: '100%', boxSizing: 'border-box' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', left: mobile ? '20px' : 'auto', zIndex: 9999, background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `2px solid ${THEME.border}`, overflowX: 'auto' }}>
        {([{ id: 'categories', label: '🗂️ Catégories', count: categories.length }, { id: 'groupes', label: '📁 Groupes', count: groupes.length }] as const).map(onglet => (
          <button key={onglet.id} onClick={() => setOngletActif(onglet.id)}
            style={{ padding: mobile ? '12px 14px' : '12px 20px', border: 'none', borderBottom: ongletActif === onglet.id ? `2px solid ${THEME.accent}` : '2px solid transparent', marginBottom: '-2px', background: 'none', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap',
              fontWeight: ongletActif === onglet.id ? '700' : '500', color: ongletActif === onglet.id ? THEME.accent : THEME.textLight }}>
            {onglet.label} <span style={{ fontSize: '12px', opacity: 0.7 }}>({onglet.count})</span>
          </button>
        ))}
      </div>

      {/* ═════════════ CATÉGORIES ═════════════ */}
      {ongletActif === 'categories' && loading && chargement('Chargement des catégories...')}

      {ongletActif === 'categories' && !loading && (
        <>
          {enTete('🗂️ Catégories', `${categories.length} catégorie${categories.length > 1 ? 's' : ''} — ${categories.filter(c => c.active).length} actives`, 'Créer une catégorie', () => setModalCategorie({ isOpen: true, categorie: null }))}
          {barreRecherche(search, v => { setSearch(v); setCurrentPage(1); }, '🔍 Rechercher une catégorie...', filteredCategories.length, selectedIds.length, t => setModalConfirmation({ isOpen: true, type: t }))}

          <div style={cadreListe}>
            {!mobile ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
                  <tr>
                    <th style={{ padding: '13px 8px', width: '40px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.length === paginatedCategories.length && paginatedCategories.length > 0} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={th('center')}>#ID</th>
                    <th style={th('left')}>Nom</th>
                    <th style={th('left')}>Groupe</th>
                    <th style={th('center')}>Produits</th>
                    <th style={th('center')}>Taxable</th>
                    <th style={th('center')}>Statut</th>
                    <th style={th('center')}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((cat, index) => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => handleSelect(cat.id)} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', color: THEME.textLight }}>{cat.id}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {cat.image && <img src={cat.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />}
                          <span style={{ fontSize: '13px', fontWeight: '500', color: THEME.text }}>{cat.nom}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                        {cat.groupeNom
                          ? <span style={{ fontSize: '12px', color: THEME.text }}>{cat.groupeNom}</span>
                          : <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#fef3c7', color: THEME.warning }}>⚠ Non assigné</span>}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', color: THEME.accent }}>{cat.productCount || 0}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {cat.taxable
                          ? <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>🏷️ Oui</span>
                          : <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#fef9c3', color: '#92400e' }}>Non taxée</span>}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={pastille(cat.active)}>{cat.active ? '✓ Active' : '✗ Inactive'}</span></td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <button onClick={() => setModalCategorie({ isOpen: true, categorie: cat })} style={btnModifier}>✏️ Modifier</button>
                          <MenuActions ouvert={menuOuvert === cat.id} onToggle={() => setMenuOuvert(menuOuvert === cat.id ? null : cat.id)}
                            onActiver={() => { setModalConfirmation({ isOpen: true, type: 'activer', categorie: cat }); setMenuOuvert(null); }}
                            onDesactiver={() => { setModalConfirmation({ isOpen: true, type: 'desactiver', categorie: cat }); setMenuOuvert(null); }}
                            onSupprimer={() => { setModalConfirmation({ isOpen: true, type: 'supprimer', categorie: cat }); setMenuOuvert(null); }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                {paginatedCategories.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 12, color: THEME.textLight, borderBottom: `1px solid ${THEME.border}`, background: '#f8fafc' }}>
                    <input type="checkbox" checked={selectedIds.length === paginatedCategories.length} onChange={handleSelectAll} /> Tout sélectionner
                  </label>
                )}
                {paginatedCategories.map((cat, index) => (
                  <div key={cat.id} style={carteMobile(index)}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => handleSelect(cat.id)} style={{ marginTop: 4 }} />
                      {cat.image && <img src={cat.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text, wordBreak: 'break-word' }}>{cat.nom}</div>
                        <div style={{ fontSize: 11, color: THEME.textLight, marginTop: 2 }}>#{cat.id} · {cat.productCount || 0} produit{(cat.productCount || 0) > 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 12, color: THEME.text, marginTop: 4 }}>{cat.groupeNom ? `📁 ${cat.groupeNom}` : <span style={{ color: THEME.warning, fontWeight: 700 }}>⚠ Non assigné</span>}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                      <span style={pastille(cat.active)}>{cat.active ? '✓ Active' : '✗ Inactive'}</span>
                      {cat.taxable
                        ? <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: '#e0f2fe', color: '#0369a1' }}>🏷️ Taxable</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: '#fef9c3', color: '#92400e' }}>Non taxée</span>}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => setModalCategorie({ isOpen: true, categorie: cat })} style={btnModifier}>✏️ Modifier</button>
                        <MenuActions ouvert={menuOuvert === cat.id} onToggle={() => setMenuOuvert(menuOuvert === cat.id ? null : cat.id)}
                          onActiver={() => { setModalConfirmation({ isOpen: true, type: 'activer', categorie: cat }); setMenuOuvert(null); }}
                          onDesactiver={() => { setModalConfirmation({ isOpen: true, type: 'desactiver', categorie: cat }); setMenuOuvert(null); }}
                          onSupprimer={() => { setModalConfirmation({ isOpen: true, type: 'supprimer', categorie: cat }); setMenuOuvert(null); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredCategories.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>{search ? `Aucune catégorie pour "${search}"` : 'Aucune catégorie trouvée'}</div>
            )}
          </div>

          <Pagination parPage={itemsPerPage} page={currentPage} total={totalPages} setPage={setCurrentPage} />

          <ModalCategorie isOpen={modalCategorie.isOpen} categorie={modalCategorie.categorie} groupes={groupes} base={base}
            onClose={() => setModalCategorie({ isOpen: false, categorie: null })} onSave={handleSaveCategorie} />

          <ModalConfirmation isOpen={modalConfirmation.isOpen}
            title={modalConfirmation.type === 'activer' ? 'Activer la catégorie' : modalConfirmation.type === 'desactiver' ? 'Désactiver la catégorie' : 'Supprimer la catégorie'}
            message={modalConfirmation.categorie
              ? `Êtes-vous sûr de vouloir ${modalConfirmation.type === 'activer' ? 'activer' : modalConfirmation.type === 'desactiver' ? 'désactiver' : 'supprimer'} la catégorie "${modalConfirmation.categorie.nom}" ?`
              : `Êtes-vous sûr de vouloir ${modalConfirmation.type} ${selectedIds.length} catégorie(s) ?`}
            onConfirm={modalConfirmation.categorie ? () => handleAction(modalConfirmation.categorie!, modalConfirmation.type!) : () => handleBulkAction(modalConfirmation.type!)}
            onCancel={() => setModalConfirmation({ isOpen: false, type: null, categorie: null })} />
        </>
      )}

      {/* ═════════════ GROUPES ═════════════ */}
      {ongletActif === 'groupes' && loadingGroupes && chargement('Chargement des groupes...')}

      {ongletActif === 'groupes' && !loadingGroupes && (
        <>
          {enTete('📁 Groupes de catégories', `${groupes.length} groupe${groupes.length > 1 ? 's' : ''} — ${groupes.filter(g => g.active).length} actifs`, 'Créer un groupe', () => setModalGroupe({ isOpen: true, groupe: null }))}
          {barreRecherche(searchGroupes, v => { setSearchGroupes(v); setCurrentPageGroupes(1); }, '🔍 Rechercher un groupe...', filteredGroupes.length, selectedIdsGroupes.length, t => setModalConfirmationGroupe({ isOpen: true, type: t }))}

          <div style={cadreListe}>
            {!mobile ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
                  <tr>
                    <th style={{ padding: '13px 8px', width: '40px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIdsGroupes.length === paginatedGroupes.length && paginatedGroupes.length > 0} onChange={handleSelectAllGroupes} style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={th('center')}>#ID</th>
                    <th style={th('center')}>Image</th>
                    <th style={th('left')}>Nom</th>
                    <th style={th('center')}>Ordre</th>
                    <th style={th('center')}>Catégories</th>
                    <th style={th('center')}>Statut</th>
                    <th style={th('center')}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGroupes.map((g, index) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}><input type="checkbox" checked={selectedIdsGroupes.includes(g.id)} onChange={() => handleSelectGroupe(g.id)} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', color: THEME.textLight }}>{g.id}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {g.image
                          ? <img src={g.image} alt={g.nom} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: `1px solid ${THEME.border}` }} />
                          : <span style={{ fontSize: '11px', color: THEME.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'left' }}><span style={{ fontSize: '13px', fontWeight: '500', color: THEME.text }}>{g.nom}</span></td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '12px', color: THEME.textLight }}>{g.ordre ?? '—'}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', color: THEME.accent }}>{g.nbCategories ?? 0}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={pastille(g.active)}>{g.active ? '✓ Actif' : '✗ Inactif'}</span></td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <button onClick={() => setModalGroupe({ isOpen: true, groupe: g })} style={btnModifier}>✏️ Modifier</button>
                          <MenuActions ouvert={menuOuvertGroupe === g.id} onToggle={() => setMenuOuvertGroupe(menuOuvertGroupe === g.id ? null : g.id)}
                            onActiver={() => { setModalConfirmationGroupe({ isOpen: true, type: 'activer', groupe: g }); setMenuOuvertGroupe(null); }}
                            onDesactiver={() => { setModalConfirmationGroupe({ isOpen: true, type: 'desactiver', groupe: g }); setMenuOuvertGroupe(null); }}
                            onSupprimer={() => { setModalConfirmationGroupe({ isOpen: true, type: 'supprimer', groupe: g }); setMenuOuvertGroupe(null); }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                {paginatedGroupes.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 12, color: THEME.textLight, borderBottom: `1px solid ${THEME.border}`, background: '#f8fafc' }}>
                    <input type="checkbox" checked={selectedIdsGroupes.length === paginatedGroupes.length} onChange={handleSelectAllGroupes} /> Tout sélectionner
                  </label>
                )}
                {paginatedGroupes.map((g, index) => (
                  <div key={g.id} style={carteMobile(index)}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={selectedIdsGroupes.includes(g.id)} onChange={() => handleSelectGroupe(g.id)} style={{ marginTop: 4 }} />
                      {g.image && <img src={g.image} alt={g.nom} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: `1px solid ${THEME.border}` }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text, wordBreak: 'break-word' }}>{g.nom}</div>
                        <div style={{ fontSize: 11, color: THEME.textLight, marginTop: 2 }}>#{g.id} · Ordre {g.ordre ?? '—'} · {g.nbCategories ?? 0} catégorie{(g.nbCategories ?? 0) > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                      <span style={pastille(g.active)}>{g.active ? '✓ Actif' : '✗ Inactif'}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => setModalGroupe({ isOpen: true, groupe: g })} style={btnModifier}>✏️ Modifier</button>
                        <MenuActions ouvert={menuOuvertGroupe === g.id} onToggle={() => setMenuOuvertGroupe(menuOuvertGroupe === g.id ? null : g.id)}
                          onActiver={() => { setModalConfirmationGroupe({ isOpen: true, type: 'activer', groupe: g }); setMenuOuvertGroupe(null); }}
                          onDesactiver={() => { setModalConfirmationGroupe({ isOpen: true, type: 'desactiver', groupe: g }); setMenuOuvertGroupe(null); }}
                          onSupprimer={() => { setModalConfirmationGroupe({ isOpen: true, type: 'supprimer', groupe: g }); setMenuOuvertGroupe(null); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredGroupes.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>{searchGroupes ? `Aucun groupe pour "${searchGroupes}"` : 'Aucun groupe trouvé'}</div>
            )}
          </div>

          <Pagination parPage={itemsParPageGroupes} page={currentPageGroupes} total={totalPagesGroupes} setPage={setCurrentPageGroupes} />

          <ModalGroupe isOpen={modalGroupe.isOpen} groupe={modalGroupe.groupe} base={base}
            onClose={() => setModalGroupe({ isOpen: false, groupe: null })} onSave={handleSaveGroupe} />

          <ModalConfirmation isOpen={modalConfirmationGroupe.isOpen}
            title={modalConfirmationGroupe.type === 'activer' ? 'Activer le groupe' : modalConfirmationGroupe.type === 'desactiver' ? 'Désactiver le groupe' : 'Supprimer le groupe'}
            message={modalConfirmationGroupe.groupe
              ? (modalConfirmationGroupe.type === 'supprimer' && (modalConfirmationGroupe.groupe.nbCategories ?? 0) > 0
                ? `⚠️ Ce groupe a encore ${modalConfirmationGroupe.groupe.nbCategories} catégorie(s) assignée(s). Réassigne-les d'abord à un autre groupe — la suppression sera refusée tant qu'il en reste.`
                : `Êtes-vous sûr de vouloir ${modalConfirmationGroupe.type === 'activer' ? 'activer' : modalConfirmationGroupe.type === 'desactiver' ? 'désactiver' : 'supprimer'} le groupe "${modalConfirmationGroupe.groupe.nom}" ?`)
              : `Êtes-vous sûr de vouloir ${modalConfirmationGroupe.type} ${selectedIdsGroupes.length} groupe(s) ?`}
            onConfirm={modalConfirmationGroupe.groupe ? () => handleActionGroupe(modalConfirmationGroupe.groupe!, modalConfirmationGroupe.type!) : () => handleBulkActionGroupe(modalConfirmationGroupe.type!)}
            onCancel={() => setModalConfirmationGroupe({ isOpen: false, type: null, groupe: null })} />
        </>
      )}
    </div>
  );
}