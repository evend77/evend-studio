// src/pages/admin/ListeSponsors.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface NoteInterne {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
}

export interface Sponsor {
  id: number;
  nom: string;
  email: string;
  site_web: string | null;
  description: string | null;
  forfait: string;
  forfait_pub: string;
  type_sponsor: 'photos' | 'pub' | 'both';
  active: boolean;
  created_at: string;
  photos_actives?: number;
  pubs_actives?: number;
  pubs_bloquees?: number;
  nbNotes?: number;
  notes?: NoteInterne[];
}

interface ListeSponsorsProps {
  onImpersonate: (sponsor: Sponsor, token: string) => void;
  onNaviguerVers?: (page: string, data?: any) => void;
}

type TriOption = 'id-desc' | 'nom-asc' | 'date-desc';
type ActionType = 'suspendre' | 'reactiver' | 'supprimer' | null;

const THEME = {
  sidebar: '#1a2436', accent: '#f59e0b', accentLight: '#fef3c7',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const API = '';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

const printStyles = `
  @media print {
    @page { size: landscape; margin: 1.5cm; }
    body * { visibility: hidden; }
    .print-table, .print-table * { visibility: visible; }
    .print-table { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
    .no-print { display: none !important; }
    th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center !important; font-weight: bold; border-bottom: 2px solid ${THEME.accent}; }
    td { text-align: center !important; padding: 8px 4px !important; border-bottom: 1px solid #e1e4e8; }
    .statut-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
  }
`;

// ── Petit item de menu déroulant ─────────────────────────────────────────────
function MenuItem({ children, onClick, style = {} }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: THEME.text, whiteSpace: 'nowrap', ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

// ── Modale de notes internes ─────────────────────────────────────────────────
function ModalNotes({ sponsor, onAjouterNote, onSupprimerNote, onFermer }: {
  sponsor: Sponsor; onAjouterNote: (contenu: string) => void; onSupprimerNote: (noteId: number) => void; onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [noteASupprimer, setNoteASupprimer] = useState<number | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${THEME.sidebar} 0%, ${THEME.accent} 100%)`, color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{sponsor.nom}</p>
                <p style={{ fontSize: 12, opacity: 0.7, margin: '2px 0 0' }}>⭐ {sponsor.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
            📋 Historique des notes ({sponsor.notes?.length || 0})
          </h4>
          {!sponsor.notes || sponsor.notes.length === 0 ? (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 20, textAlign: 'center', color: THEME.textLight, fontSize: 13, marginBottom: 20 }}>
              Aucune note pour ce sponsor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[...sponsor.notes].reverse().map(note => (
                <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
                  {noteASupprimer === note.id ? (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 10, padding: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: THEME.danger, margin: 0 }}>🗑️ Supprimer cette note ?</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setNoteASupprimer(null)} style={{ padding: '6px 14px', border: `1px solid ${THEME.border}`, borderRadius: 6, backgroundColor: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                        <button onClick={() => { onSupprimerNote(note.id); setNoteASupprimer(null); }} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, backgroundColor: THEME.danger, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
                      </div>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: THEME.text }}>{note.auteur}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: THEME.textLight }}>{note.date}</span>
                      <button onClick={() => setNoteASupprimer(note.id)} style={{ width: 20, height: 20, border: 'none', borderRadius: '50%', backgroundColor: '#fee2e2', color: THEME.danger, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: THEME.text, margin: 0, lineHeight: 1.6 }}>{note.contenu}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>✏️ Ajouter une note interne</h4>
            <textarea value={nouvelleNote} onChange={e => setNouvelleNote(e.target.value)} rows={3}
              placeholder="Note administrative (visible uniquement par l'équipe)"
              style={{ width: '100%', border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }} />
            <button onClick={() => { if (nouvelleNote.trim()) { onAjouterNote(nouvelleNote.trim()); setNouvelleNote(''); } }}
              disabled={!nouvelleNote.trim()}
              style={{ backgroundColor: nouvelleNote.trim() ? THEME.accent : '#fcd34d', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: nouvelleNote.trim() ? 'pointer' : 'not-allowed' }}>
              💾 Enregistrer la note
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: 8, backgroundColor: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Modale changer mot de passe ──────────────────────────────────────────────
function ModaleChangerMotDePasse({ isOpen, sponsor, onCancel, onConfirm }: {
  isOpen: boolean; sponsor: Sponsor | null; onCancel: () => void; onConfirm: (nouveauMotDePasse: string) => void;
}) {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  if (!isOpen || !sponsor) return null;
  const valideMotDePasse = nouveauMotDePasse.length >= 8;
  const confirmationValide = nouveauMotDePasse === confirmation && nouveauMotDePasse.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${THEME.sidebar} 0%, ${THEME.accent} 100%)`, color: 'white' }}>
          <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>🔑 Changer le mot de passe</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: '2px 0 0' }}>{sponsor.nom} · {sponsor.email}</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: THEME.text, display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
          <input type="password" value={nouveauMotDePasse} onChange={e => setNouveauMotDePasse(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
          <label style={{ fontSize: 12, fontWeight: 700, color: THEME.text, display: 'block', marginBottom: 6 }}>Confirmer</label>
          <input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          {nouveauMotDePasse && !valideMotDePasse && <p style={{ fontSize: 11, color: THEME.danger, margin: '8px 0 0' }}>Minimum 8 caractères</p>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', border: `1px solid ${THEME.border}`, borderRadius: 8, backgroundColor: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => confirmationValide && onConfirm(nouveauMotDePasse)} disabled={!confirmationValide}
            style={{ padding: '9px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: confirmationValide ? 'pointer' : 'not-allowed', backgroundColor: confirmationValide ? THEME.accent : '#fcd34d', color: 'white' }}>
            ✅ Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de confirmation (suspendre / réactiver / supprimer) ──────────────
function ModaleConfirmation({ isOpen, type, sponsor, onConfirm, onCancel }: {
  isOpen: boolean; type: ActionType; sponsor: Sponsor | null; onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen || !type) return null;
  const isSupprimer = type === 'supprimer';
  const isSuspendre = type === 'suspendre';
  const getTitle = () => isSupprimer ? 'SUPPRIMER CE SPONSOR' : isSuspendre ? 'SUSPENDRE CE SPONSOR' : 'RÉACTIVER CE SPONSOR';
  const getIcon = () => isSupprimer ? '🗑️' : isSuspendre ? '⚠️' : '✅';
  const getButtonColor = () => isSupprimer ? THEME.danger : isSuspendre ? THEME.warning : THEME.success;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${THEME.sidebar} 0%, ${THEME.accent} 100%)`, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{getIcon()}</div>
            <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{getTitle()}</p>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {sponsor && (
            <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: THEME.accent, margin: 0 }}>{sponsor.nom}</p>
              <p style={{ fontSize: 12, color: THEME.textLight, margin: '2px 0 0' }}>{sponsor.email}</p>
            </div>
          )}
          <p style={{ fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>
            {isSupprimer
              ? <>⚠️ Cette action supprimera définitivement ce sponsor, ses photos et ses publicités. Assurez-vous qu'aucun abonnement actif n'est en cours.</>
              : isSuspendre
              ? <>⚠️ Le sponsor ne pourra plus se connecter, mais ses photos/pubs existantes resteront en base (elles ne seront simplement plus créables/modifiables tant qu'il est suspendu).</>
              : <>✅ Le sponsor retrouvera l'accès normal à son tableau de bord.</>}
          </p>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', border: `1px solid ${THEME.border}`, borderRadius: 8, backgroundColor: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', backgroundColor: getButtonColor(), color: 'white' }}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
function ListeSponsors({ onImpersonate, onNaviguerVers }: ListeSponsorsProps) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [triOption, setTriOption] = useState<TriOption>('id-desc');
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [chargement, setChargement] = useState(true);
  const [sponsorNotes, setSponsorNotes] = useState<Sponsor | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modaleMdp, setModaleMdp] = useState<{ isOpen: boolean; sponsor: Sponsor | null }>({ isOpen: false, sponsor: null });
  const [modaleConfirmation, setModaleConfirmation] = useState<{ isOpen: boolean; type: ActionType; sponsor: Sponsor | null }>({ isOpen: false, type: null, sponsor: null });

  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const token = () => localStorage.getItem('token');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = async () => {
    setChargement(true);
    try {
      const res = await fetch(`${API}/api/sponsors/admin/liste`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const liste = data.sponsors || [];
      setSponsors(liste.map((s: any) => ({
        id: s.id, nom: s.nom, email: s.email, site_web: s.site_web, description: s.description,
        forfait: s.forfait, forfait_pub: s.forfait_pub, type_sponsor: s.type_sponsor,
        active: !!s.active, created_at: s.created_at,
        photos_actives: parseInt(s.photos_actives) || 0,
        pubs_actives: parseInt(s.pubs_actives) || 0,
        pubs_bloquees: parseInt(s.pubs_bloquees) || 0,
        nbNotes: parseInt(s.nb_notes) || 0,
      })));
    } catch (e) {
      console.error('Erreur chargement sponsors:', e);
      showToast('❌ Erreur lors du chargement des sponsors', 'error');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const filtresEtTries = useMemo(() => {
    let result = sponsors.filter(s => {
      const matchRecherche = s.nom.toLowerCase().includes(recherche.toLowerCase()) || s.email.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut = filtreStatut === 'tous' ? true : filtreStatut === 'actif' ? s.active : !s.active;
      return matchRecherche && matchStatut;
    });
    result = [...result].sort((a, b) => {
      switch (triOption) {
        case 'id-desc': return b.id - a.id;
        case 'nom-asc': return a.nom.localeCompare(b.nom);
        case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });
    return result;
  }, [recherche, filtreStatut, triOption, sponsors]);

  const handleOuvrirNotes = async (sponsor: Sponsor) => {
    try {
      const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}/notes`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      const notes: NoteInterne[] = data.map((n: any) => ({ id: n.id, date: formatDate(n.date_creation), auteur: n.auteur || 'Admin', contenu: n.contenu }));
      setSponsorNotes({ ...sponsor, notes });
      setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, notes, nbNotes: notes.length } : s));
    } catch {
      setSponsorNotes({ ...sponsor, notes: [] });
    }
  };

  const handleAjouterNote = async (sponsor: Sponsor, contenu: string) => {
    try {
      const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ contenu }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const nouvelleNote: NoteInterne = { id: saved.id, date: formatDate(saved.date_creation), auteur: saved.auteur, contenu: saved.contenu };
      setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, notes: [...(s.notes || []), nouvelleNote], nbNotes: (s.nbNotes || 0) + 1 } : s));
      setSponsorNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), nouvelleNote] } : prev);
      showToast('📋 Note enregistrée', 'success');
    } catch {
      showToast("❌ Erreur lors de l'enregistrement de la note", 'error');
    }
  };

  const handleSupprimerNote = async (sponsor: Sponsor, noteId: number) => {
    try {
      const res = await fetch(`${API}/api/sponsors/admin/notes/${noteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, notes: (s.notes || []).filter(n => n.id !== noteId), nbNotes: Math.max(0, (s.nbNotes || 1) - 1) } : s));
      setSponsorNotes(prev => prev ? { ...prev, notes: (prev.notes || []).filter(n => n.id !== noteId) } : prev);
      showToast('🗑️ Note supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression de la note', 'error');
    }
  };

  const handleChangementMotDePasse = async (nouveauMotDePasse: string) => {
    const sponsor = modaleMdp.sponsor;
    if (!sponsor) return;
    try {
      const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}/mot-de-passe`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ nouveau_mot_de_passe: nouveauMotDePasse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setModaleMdp({ isOpen: false, sponsor: null });
      showToast(`✅ Mot de passe de ${sponsor.nom} modifié`, 'success');
    } catch (err: any) {
      setModaleMdp({ isOpen: false, sponsor: null });
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleConfirmation = async () => {
    const { type, sponsor } = modaleConfirmation;
    if (!type || !sponsor) { setModaleConfirmation({ isOpen: false, type: null, sponsor: null }); return; }
    try {
      if (type === 'supprimer') {
        const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        if (!res.ok) throw new Error();
        setSponsors(prev => prev.filter(s => s.id !== sponsor.id));
        showToast('✅ Sponsor supprimé', 'success');
      } else {
        const nouveauStatut = type === 'suspendre' ? 'suspendu' : 'actif';
        const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}/statut`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ statut: nouveauStatut }),
        });
        if (!res.ok) throw new Error();
        setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, active: nouveauStatut === 'actif' } : s));
        showToast(`✅ Statut changé → ${nouveauStatut}`, 'success');
      }
    } catch {
      showToast('❌ Erreur lors de l\'action', 'error');
    }
    setModaleConfirmation({ isOpen: false, type: null, sponsor: null });
  };

  const handleImpersonate = async (sponsor: Sponsor) => {
    try {
      const res = await fetch(`${API}/api/sponsors/admin/${sponsor.id}/impersonate`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onImpersonate(sponsor, data.token);
    } catch {
      showToast("❌ Erreur lors de l'accès au dashboard du sponsor", 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Type', 'Forfait photo', 'Forfait pub', 'Photos actives', 'Pubs actives', 'Pubs bloquées', 'Statut', 'Inscription'];
    const csvData = filtresEtTries.map(s => [s.id, s.nom, s.email, s.type_sponsor, s.forfait, s.forfait_pub, s.photos_actives, s.pubs_actives, s.pubs_bloquees, s.active ? 'actif' : 'suspendu', formatDate(s.created_at)]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sponsors.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImprimer = () => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 100);
  };

  const setMenuRef = (id: number) => (el: HTMLDivElement | null) => { if (el) menuRefs.current.set(id, el); else menuRefs.current.delete(id); };
  const getMenuPosition = (id: number) => {
    const el = menuRefs.current.get(id);
    if (!el) return { left: 0, top: 0 };
    const rect = el.getBoundingClientRect();
    const left = rect.left - 200 - 10;
    return { left: left < 10 ? 10 : left, top: rect.top + 35 };
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuOuvert !== null) {
        const el = menuRefs.current.get(menuOuvert);
        if (el && !el.contains(e.target as Node)) setMenuOuvert(null);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [menuOuvert]);

  if (chargement) {
    return <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement des sponsors...</div>;
  }

  return (
    <>
      <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>Gestion des sponsors</h1>
            <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>{sponsors.length} sponsors inscrits</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }} className="no-print">
            <button onClick={handleExportCSV} style={{ backgroundColor: 'white', color: THEME.accent, border: `2px solid ${THEME.accent}`, borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📊 Exporter CSV</button>
            <button onClick={handleImprimer} style={{ backgroundColor: 'white', color: THEME.accent, border: `2px solid ${THEME.accent}`, borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨️ Imprimer</button>
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un sponsor..."
            style={{ border: `1px solid ${THEME.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, outline: 'none', width: 260 }} />
          {[{ val: 'tous', label: 'Tous' }, { val: 'actif', label: '✅ Actifs' }, { val: 'suspendu', label: '🔒 Suspendus' }].map(({ val, label }) => (
            <button key={val} onClick={() => setFiltreStatut(val)}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${filtreStatut === val ? THEME.accent : THEME.border}`, backgroundColor: filtreStatut === val ? THEME.accentLight : 'white', color: filtreStatut === val ? THEME.accent : THEME.textLight }}>
              {label}
            </button>
          ))}
          <select value={triOption} onChange={e => setTriOption(e.target.value as TriOption)}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <option value="id-desc">Plus récents</option>
            <option value="nom-asc">Nom (A-Z)</option>
            <option value="date-desc">Date d'inscription</option>
          </select>
        </div>

        <div className="print-table" style={{ backgroundColor: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                {['ID', 'Sponsor', 'E-mail', 'Type', 'Forfait photo', 'Forfait pub', 'Photos', 'Pubs', 'Bloquées', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '13px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>{h}</th>
                ))}
                <th className="no-print" style={{ padding: '13px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtresEtTries.map((s, i) => {
                const menuPos = getMenuPosition(s.id);
                const nbNotes = s.nbNotes || 0;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>#{s.id}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="no-print" style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: THEME.accent, flexShrink: 0 }}>{s.nom.charAt(0)}</div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: THEME.text, margin: 0 }}>{s.nom}</p>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12 }}>{s.email}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12 }}>
                      {s.type_sponsor === 'both' ? '⭐ Photos+Pub' : s.type_sponsor === 'photos' ? '📸 Photos' : '📢 Pub'}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{s.forfait || '—'}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{s.forfait_pub || '—'}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12 }}>{s.photos_actives ?? 0}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12 }}>{s.pubs_actives ?? 0}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      {(s.pubs_bloquees ?? 0) > 0 ? (
                        <span style={{
                          fontSize: 12, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
                          background: (s.pubs_bloquees ?? 0) >= 3 ? '#fecaca' : '#fef3c7',
                          color: (s.pubs_bloquees ?? 0) >= 3 ? '#991b1b' : '#92400e',
                        }} title={(s.pubs_bloquees ?? 0) >= 3 ? 'Beaucoup de pubs bloquées — à surveiller' : undefined}>
                          {(s.pubs_bloquees ?? 0) >= 3 && '⚠️ '}{s.pubs_bloquees}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ccc' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span className="statut-badge" style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 20, backgroundColor: s.active ? '#dcfce7' : '#ffedd5', color: s.active ? THEME.success : THEME.warning }}>
                        {s.active ? '✅ Actif' : '🔒 Suspendu'}
                      </span>
                    </td>
                    <td className="no-print" style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => handleOuvrirNotes(s)} style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: '1px solid #fde68a', borderRadius: 6, padding: '5px 8px', fontSize: 14, fontWeight: 700, cursor: 'pointer', position: 'relative', minWidth: 36 }} title="Notes internes">
                          📋
                          {nbNotes > 0 && <span style={{ position: 'absolute', top: -4, right: -4, backgroundColor: THEME.accent, color: 'white', fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 8, minWidth: 14, textAlign: 'center' }}>{nbNotes}</span>}
                        </button>
                        <button onClick={() => handleImpersonate(s)} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', minWidth: 60 }}>👤 Accéder</button>
                        <div ref={setMenuRef(s.id)} style={{ position: 'relative' }}>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOuvert(menuOuvert === s.id ? null : s.id); }}
                            style={{ background: '#f0f0f0', border: `1px solid ${THEME.border}`, cursor: 'pointer', padding: '5px 10px', borderRadius: 6, fontSize: 16, fontWeight: 800, minWidth: 36 }}>⋮</button>
                          {menuOuvert === s.id && (
                            <div style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 1000, width: 220 }}>
                              <div style={{ padding: '4px 0' }}>
                                <MenuItem onClick={() => { setMenuOuvert(null); setModaleMdp({ isOpen: true, sponsor: s }); }}>🔑 Changer le mot de passe</MenuItem>
                                <div style={{ height: 1, backgroundColor: THEME.border, margin: '4px 0' }} />
                                {s.active ? (
                                  <MenuItem onClick={() => { setMenuOuvert(null); setModaleConfirmation({ isOpen: true, type: 'suspendre', sponsor: s }); }} style={{ color: THEME.warning }}>⚠️ Suspendre</MenuItem>
                                ) : (
                                  <MenuItem onClick={() => { setMenuOuvert(null); setModaleConfirmation({ isOpen: true, type: 'reactiver', sponsor: s }); }} style={{ color: THEME.success }}>✅ Réactiver</MenuItem>
                                )}
                                <div style={{ height: 1, backgroundColor: THEME.border, margin: '4px 0' }} />
                                <MenuItem onClick={() => { setMenuOuvert(null); setModaleConfirmation({ isOpen: true, type: 'supprimer', sponsor: s }); }} style={{ color: THEME.danger }}>🗑️ Supprimer</MenuItem>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtresEtTries.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: THEME.textLight }}>Aucun sponsor trouvé</div>}
        </div>
      </div>

      {sponsorNotes && (
        <ModalNotes sponsor={sponsorNotes} onAjouterNote={(c) => handleAjouterNote(sponsorNotes, c)} onSupprimerNote={(id) => handleSupprimerNote(sponsorNotes, id)} onFermer={() => setSponsorNotes(null)} />
      )}
      <ModaleChangerMotDePasse isOpen={modaleMdp.isOpen} sponsor={modaleMdp.sponsor} onCancel={() => setModaleMdp({ isOpen: false, sponsor: null })} onConfirm={handleChangementMotDePasse} />
      <ModaleConfirmation isOpen={modaleConfirmation.isOpen} type={modaleConfirmation.type} sponsor={modaleConfirmation.sponsor} onConfirm={handleConfirmation} onCancel={() => setModaleConfirmation({ isOpen: false, type: null, sponsor: null })} />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </>
  );
}

export default ListeSponsors;