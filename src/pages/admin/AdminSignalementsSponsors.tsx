// src/pages/admin/AdminSignalementsSponsors.tsx
import React, { useState, useEffect, useRef } from 'react';

interface Signalement {
  id: number;
  motif: string;
  commentaire: string | null;
  statut: 'nouveau' | 'traite';
  action_prise: 'bloquee' | 'autorisee' | null;
  note_admin: string | null;
  created_at: string;
  traite_at: string | null;
  pub_id: number;
  pub_titre: string;
  pub_description: string;
  pub_image: string;
  pub_actif: boolean;
  pub_statut: string;
  sponsor_nom: string;
  nb_signalements_pub: number;
}

const THEME = {
  accent: '#f59e0b', accentLight: '#fef3c7', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const LABELS_MOTIFS: Record<string, string> = {
  photo_inappropriee: '📷 Photo inappropriée ou choquante',
  texte_inapproprie: '✍️ Texte inapproprié ou offensant',
  spam: '🚫 Spam ou publicité trompeuse',
  contenu_violent: '⚠️ Contenu violent ou haineux',
  contenu_sexuel: '🔞 Contenu à caractère sexuel',
  arnaque: '💰 Arnaque ou fraude suspectée',
  droits_auteur: '© Violation de droits d\'auteur / marque',
  lien_suspect: '🔗 Lien suspect ou brisé',
  autre: '❓ Autre',
};

const API_BASE = '/api/sponsors/admin/signalements';
const PAR_PAGE = 50;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ModalTraiter({ signalement, onFermer, onTraite }: {
  signalement: Signalement; onFermer: () => void; onTraite: (id: number, action: 'bloquer' | 'autoriser', note: string) => void;
}) {
  const [note, setNote] = useState(signalement.note_admin || '');
  const [envoi, setEnvoi] = useState<'bloquer' | 'autoriser' | null>(null);

  const agir = async (action: 'bloquer' | 'autoriser') => {
    setEnvoi(action);
    await onTraite(signalement.id, action, note);
    setEnvoi(null);
  };

  const dejaTraite = signalement.statut === 'traite';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 22px', background: `linear-gradient(135deg, #1a2436, ${THEME.accent})`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>🚩 Signalement #{signalement.id}</p>
            <p style={{ fontSize: 11, opacity: 0.75, margin: '2px 0 0' }}>Pub #{signalement.pub_id} — {signalement.sponsor_nom}</p>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }}>
          {/* Gauche : visuel de la pub */}
          <div style={{ flex: '1 1 320px', padding: 20, borderRight: `1px solid ${THEME.border}` }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', margin: '0 0 10px' }}>Aperçu de la publicité</h4>
            <img src={signalement.pub_image} alt={signalement.pub_titre} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>{signalement.pub_titre}</p>
            <p style={{ fontSize: 12, color: THEME.textLight, margin: '0 0 10px' }}>{signalement.pub_description}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: signalement.pub_actif ? '#dcfce7' : '#fee2e2', color: signalement.pub_actif ? THEME.success : THEME.danger, fontWeight: 700 }}>
                {signalement.pub_actif ? 'Actuellement en ligne' : 'Actuellement hors ligne'}
              </span>
              {signalement.nb_signalements_pub > 1 && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fecaca', color: '#991b1b', fontWeight: 700 }}>
                  ⚠️ {signalement.nb_signalements_pub} signalements au total pour cette pub
                </span>
              )}
            </div>
          </div>

          {/* Droite : détails + actions + notes */}
          <div style={{ flex: '1 1 320px', padding: 20 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', margin: '0 0 10px' }}>Détails du signalement</h4>
            <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{LABELS_MOTIFS[signalement.motif] || signalement.motif}</p>
              {signalement.commentaire && <p style={{ fontSize: 12, color: THEME.text, margin: '0 0 6px', fontStyle: 'italic' }}>« {signalement.commentaire} »</p>}
              <p style={{ fontSize: 11, color: THEME.textLight, margin: 0 }}>Reçu le {formatDate(signalement.created_at)}</p>
            </div>

            {dejaTraite && (
              <div style={{ background: signalement.action_prise === 'bloquee' ? '#fecaca' : '#dcfce7', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: signalement.action_prise === 'bloquee' ? '#991b1b' : THEME.success }}>
                  {signalement.action_prise === 'bloquee' ? '🚫 Pub bloquée' : '✅ Pub autorisée'} — traité le {signalement.traite_at ? formatDate(signalement.traite_at) : ''}
                </p>
              </div>
            )}

            <h4 style={{ fontSize: 11, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', margin: '0 0 8px' }}>Note interne</h4>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} rows={4}
              placeholder="Notes sur ce signalement (visible seulement par l'équipe admin)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => agir('bloquer')} disabled={!!envoi}
                style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 8, background: THEME.danger, color: 'white', fontSize: 13, fontWeight: 700, cursor: envoi ? 'wait' : 'pointer', opacity: envoi ? 0.6 : 1 }}>
                {envoi === 'bloquer' ? '...' : '🚫 Bloquer la pub'}
              </button>
              <button onClick={() => agir('autoriser')} disabled={!!envoi}
                style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 8, background: THEME.success, color: 'white', fontSize: 13, fontWeight: 700, cursor: envoi ? 'wait' : 'pointer', opacity: envoi ? 0.6 : 1 }}>
                {envoi === 'autoriser' ? '...' : '✅ Autoriser (garder active)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSignalementsSponsors() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('nouveau');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [signalementActif, setSignalementActif] = useState<Signalement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE) });
      if (recherche) params.set('search', recherche);
      if (filtreStatut) params.set('statut', filtreStatut);
      const res = await fetch(`${API_BASE}?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setSignalements(data.signalements || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      showToast('❌ Erreur lors du chargement des signalements', 'error');
    }
    setChargement(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setRecherche(rechercheInput.trim()); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rechercheInput]);

  useEffect(() => { charger(); }, [page, recherche, filtreStatut]);

  const traiter = async (id: number, action: 'bloquer' | 'autoriser', note: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/traiter`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ action, note_admin: note }),
      });
      if (!res.ok) throw new Error();
      showToast(action === 'bloquer' ? '🚫 Pub bloquée' : '✅ Pub autorisée', 'success');
      setSignalementActif(null);
      charger();
    } catch {
      showToast('❌ Erreur lors du traitement', 'error');
    }
  };

  return (
    <div className="asig-container" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>🚩 Signalements</h1>
        <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Signalements de publicités envoyés par les visiteurs des sites</p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)} placeholder="🔍 Chercher par ID pub, titre ou sponsor..."
          style={{ flex: '1 1 300px', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }} />
        <select value={filtreStatut} onChange={e => { setPage(1); setFiltreStatut(e.target.value); }}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${THEME.border}`, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <option value="nouveau">⏳ Nouveaux (à traiter)</option>
          <option value="traite">✅ Traités</option>
          <option value="">Tous</option>
        </select>
        {total > 0 && <span style={{ fontSize: 12, color: THEME.textLight }}>{total} signalement{total > 1 ? 's' : ''}</span>}
      </div>

      {chargement ? (
        <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
      ) : signalements.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: THEME.textLight }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            {filtreStatut === 'nouveau' ? 'Aucun signalement en attente — tout est calme !' : 'Aucun signalement trouvé'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signalements.map(sig => (
            <div key={sig.id} onClick={() => setSignalementActif(sig)}
              style={{
                display: 'flex', gap: 14, alignItems: 'center', background: THEME.card,
                border: `1.5px solid ${sig.nb_signalements_pub > 1 && sig.statut === 'nouveau' ? '#fca5a5' : THEME.border}`,
                borderRadius: 12, padding: 12, cursor: 'pointer',
              }}>
              <img src={sig.pub_image} alt={sig.pub_titre} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{sig.pub_titre}</p>
                  <span style={{ fontSize: 10, color: THEME.textLight, fontFamily: 'monospace' }}>#{sig.pub_id}</span>
                  {sig.nb_signalements_pub > 1 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#fecaca', color: '#991b1b' }}>
                      ⚠️ {sig.nb_signalements_pub}x signalée
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: THEME.textLight, margin: '2px 0 0' }}>{sig.sponsor_nom} — {LABELS_MOTIFS[sig.motif] || sig.motif}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 4,
                  background: sig.statut === 'nouveau' ? '#fef3c7' : (sig.action_prise === 'bloquee' ? '#fecaca' : '#dcfce7'),
                  color: sig.statut === 'nouveau' ? '#92400e' : (sig.action_prise === 'bloquee' ? '#991b1b' : THEME.success),
                }}>
                  {sig.statut === 'nouveau' ? '⏳ Nouveau' : sig.action_prise === 'bloquee' ? '🚫 Bloquée' : '✅ Autorisée'}
                </span>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{formatDate(sig.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page <= 1 ? '#f3f4f6' : '#fff', color: page <= 1 ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer' }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 13, color: THEME.textLight }}>Page <strong>{page}</strong> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page >= totalPages ? '#f3f4f6' : '#fff', color: page >= totalPages ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'default' : 'pointer' }}>
            Suivant →
          </button>
        </div>
      )}

      {signalementActif && (
        <ModalTraiter signalement={signalementActif} onFermer={() => setSignalementActif(null)} onTraite={traiter} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .asig-container { padding: 16px 10px !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminSignalementsSponsors;