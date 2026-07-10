// src/pages/gestionnaire/MessagerieFormulaireContact.tsx
// e-Vend Studio — Messages via formulaire de contact
// Liste des messages reçus par le formulaire de contact (add-on gratuit),
// avec quota mensuel (100 gratuits) + achat de blocs de 50 (+2$/bloc,
// facturé au prochain cycle — voir Mes services).

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

interface MessageContact {
  id: number;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  sujet: string | null;
  message: string;
  champs_supplementaires?: Record<string, string>;
  lu: boolean;
  date: string;
}

interface Palier { id: string; quantite: number; prix_ht: number; }

const PALIERS_DEFAUT: Palier[] = [
  { id: 'bloc-50',   quantite: 50,   prix_ht: 2.00 },
  { id: 'bloc-100',  quantite: 100,  prix_ht: 3.50 },
  { id: 'bloc-500',  quantite: 500,  prix_ht: 15.00 },
  { id: 'bloc-1000', quantite: 1000, prix_ht: 25.00 },
];

interface QuotaInfo {
  utilises: number;
  inclus: number;         // 100 par défaut
  blocs_achetes: number;  // messages supplémentaires achetés ce cycle (tous paliers confondus)
  limite_totale: number;  // inclus + blocs_achetes
  cycle_fin: string | null;
}

const T = {
  accent: '#2563eb', accentLight: '#eff6ff',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', warning: '#d97706', success: '#16a34a',
};

interface Props { gestionnaireId: number }

export default function MessagerieFormulaireContact({ gestionnaireId }: Props) {
  const [messages, setMessages] = useState<MessageContact[]>([]);
  const [messageOuvert, setMessageOuvert] = useState<MessageContact | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [filtreLu, setFiltreLu] = useState<'tous' | 'non_lu' | 'lu'>('tous');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [modalAchatOuvert, setModalAchatOuvert] = useState(false);
  const [achatEnCours, setAchatEnCours] = useState(false);
  const [paliers, setPaliers] = useState<Palier[]>(PALIERS_DEFAUT);
  const [palierChoisi, setPalierChoisi] = useState<string>('bloc-100');

  const getToken = () => localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Chargement ──────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    try {
      const [msgRes, quotaRes] = await Promise.all([
        fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/messages`, {
          credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/quota`, {
          credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);
      if (msgRes.ok) setMessages(await msgRes.json());
      if (quotaRes.ok) setQuota(await quotaRes.json());
    } catch {
      // silencieux — la page reste utilisable avec ce qui est déjà chargé
    } finally {
      setLoading(false);
    }
  }, [gestionnaireId]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, [charger]);

  useEffect(() => {
    fetch(`${API_BASE}/messagerie-contact/paliers`, {
      credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setPaliers(data); })
      .catch(() => {}); // repli silencieux sur PALIERS_DEFAUT
  }, []);

  // ── Marquer lu ────────────────────────────────────────────────────────
  const marquerCommeLu = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/messagerie-contact/messages/${id}/lire`, {
        method: 'PUT', credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m));
    } catch {}
  };

  const toutMarquerLu = async () => {
    try {
      const res = await fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/lire-tout`, {
        method: 'PUT', credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => ({ ...m, lu: true })));
        showToast('✅ Tous les messages marqués comme lus', 'success');
      }
    } catch {}
  };

  const ouvrirMessage = (m: MessageContact) => {
    if (!m.lu) marquerCommeLu(m.id);
    setMessageOuvert({ ...m, lu: true });
  };

  // ── Achat de bloc ─────────────────────────────────────────────────────
  const acheterBloc = async () => {
    setAchatEnCours(true);
    try {
      const res = await fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/acheter-bloc`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ palier_id: palierChoisi }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const p = paliers.find(pl => pl.id === palierChoisi);
        showToast(`✅ +${p?.quantite ?? ''} messages ajoutés — sera facturé au prochain cycle`, 'success');
        setModalAchatOuvert(false);
        await charger();
      } else {
        showToast(data.error || '❌ Erreur lors de l\'achat', 'danger');
      }
    } catch {
      showToast('❌ Erreur de connexion', 'danger');
    }
    setAchatEnCours(false);
  };

  // ── Filtres ───────────────────────────────────────────────────────────
  const messagesFiltres = messages.filter(m => {
    if (filtreLu === 'tous') return true;
    return filtreLu === 'lu' ? m.lu : !m.lu;
  });
  const nbNonLus = messages.filter(m => !m.lu).length;

  // ── Quota — dérivés d'affichage ────────────────────────────────────────
  const utilises = quota?.utilises ?? messages.length;
  const limiteTotale = quota?.limite_totale ?? 100;
  const pourcentage = Math.min(100, Math.round((utilises / limiteTotale) * 100));
  const quotaAtteint = utilises >= limiteTotale;
  const couleurQuota = pourcentage >= 100 ? T.danger : pourcentage >= 80 ? T.warning : T.success;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#ef4444' : '#3b82f6',
          color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: 420,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Modal message ouvert ─────────────────────────────────────────── */}
      {messageOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(5px)' }}
          onClick={e => e.target === e.currentTarget && setMessageOuvert(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 600, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 22px', backgroundColor: T.accentLight, borderBottom: `2px solid ${T.accent}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>{messageOuvert.nom || 'Anonyme'}</p>
                  <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>
                    {messageOuvert.email} {messageOuvert.telephone ? `· ${messageOuvert.telephone}` : ''}
                  </p>
                </div>
                <button onClick={() => setMessageOuvert(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.textLight, padding: 4 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: 22 }}>
              {messageOuvert.sujet && (
                <p style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 10 }}>📌 {messageOuvert.sujet}</p>
              )}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{messageOuvert.message}</p>
              </div>
              {messageOuvert.champs_supplementaires && Object.keys(messageOuvert.champs_supplementaires).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {Object.entries(messageOuvert.champs_supplementaires).map(([k, v]) => (
                    <p key={k} style={{ fontSize: 12, color: T.textLight, margin: '2px 0' }}><strong style={{ color: T.text }}>{k} :</strong> {v}</p>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11, color: T.textLight, margin: 0 }}>{new Date(messageOuvert.date).toLocaleString('fr-CA')}</p>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {messageOuvert.email && (
                <a href={`mailto:${messageOuvert.email}`} style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>✉️ Répondre par courriel →</a>
              )}
              <button onClick={() => setMessageOuvert(null)} style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal achat de bloc ──────────────────────────────────────────── */}
      {modalAchatOuvert && (
        <div onClick={() => setModalAchatOuvert(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ background: `linear-gradient(135deg, ${T.accent}, #7c3aed)`, padding: '26px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>📦</div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Acheter des messages supplémentaires</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Ajouté immédiatement à votre quota</p>
            </div>
            <div style={{ padding: '22px 28px' }}>

              {/* Grille des paliers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {paliers.map(p => {
                  const actif = palierChoisi === p.id;
                  const prixParMessage = p.prix_ht / p.quantite;
                  return (
                    <div key={p.id} onClick={() => setPalierChoisi(p.id)}
                      style={{
                        border: `2px solid ${actif ? T.accent : '#e5e7eb'}`, borderRadius: 12, padding: '14px 12px',
                        cursor: 'pointer', background: actif ? T.accentLight : '#fafafa', position: 'relative', textAlign: 'center',
                      }}>
                      {actif && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>✓</span>
                        </div>
                      )}
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', margin: '0 0 2px' }}>{p.quantite}</p>
                      <p style={{ fontSize: 10, color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>messages</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: T.accent, margin: '0 0 2px' }}>{p.prix_ht.toFixed(2).replace('.', ',')} $</p>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{(prixParMessage).toFixed(3).replace('.', ',')} $/message</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: T.accentLight, border: `1px solid ${T.accent}30`, borderRadius: 12, padding: '13px 16px', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                  Ajouté à votre <strong>prochaine facture mensuelle</strong> — pas de paiement immédiat, une seule facturation par mois.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModalAchatOuvert(false)} style={{ flex: 1, padding: 10, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#555' }}>Annuler</button>
                <button onClick={acheterBloc} disabled={achatEnCours}
                  style={{ flex: 2, padding: 10, border: 'none', borderRadius: 10, background: T.accent, color: '#fff', fontSize: 13, fontWeight: 800, cursor: achatEnCours ? 'wait' : 'pointer' }}>
                  {achatEnCours ? '⏳...' : `✅ Ajouter — ${paliers.find(p => p.id === palierChoisi)?.prix_ht.toFixed(2).replace('.', ',') ?? ''} $`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: T.bg, minHeight: 'calc(100vh - 112px)', marginTop: -20, padding: 20, borderRadius: 8 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📋 Messages via formulaire contact
            </h2>
            <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>
              Reçus sur votre site public — également envoyés par courriel
              {nbNonLus > 0 && (
                <span style={{ marginLeft: 10, backgroundColor: T.danger, color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {nbNonLus} non lu{nbNonLus > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          {nbNonLus > 0 && (
            <button onClick={toutMarquerLu} style={{ backgroundColor: 'white', color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>

        {/* ── Bandeau quota ────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: T.card, border: `1.5px solid ${quotaAtteint ? T.danger : T.border}`, borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  Quota mensuel : <strong style={{ color: couleurQuota }}>{utilises} / {limiteTotale}</strong>
                </span>
                {quota && quota.blocs_achetes > 0 && (
                  <span style={{ fontSize: 11, color: T.textLight }}>({quota.inclus} inclus + {quota.blocs_achetes} achetés)</span>
                )}
              </div>
              <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pourcentage}%`, height: '100%', background: couleurQuota, transition: 'width 0.3s' }} />
              </div>
              {quotaAtteint && (
                <p style={{ fontSize: 12, color: T.danger, fontWeight: 700, margin: '8px 0 0' }}>
                  ⚠️ Quota atteint — le formulaire de contact affiche un message d'indisponibilité aux visiteurs jusqu'à l'achat d'un bloc ou le prochain cycle.
                </p>
              )}
            </div>
            <button onClick={() => setModalAchatOuvert(true)}
              style={{ padding: '10px 20px', background: T.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              📦 Acheter des messages
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['tous', 'non_lu', 'lu'] as const).map(f => (
            <button key={f} onClick={() => setFiltreLu(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${filtreLu === f ? T.accent : T.border}`,
                background: filtreLu === f ? T.accentLight : '#fff', color: filtreLu === f ? T.accent : T.textLight,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
              {f === 'tous' ? 'Tous' : f === 'non_lu' ? 'Non lus' : 'Lus'}
            </button>
          ))}
          <p style={{ fontSize: 11, color: T.textLight, margin: '0 0 0 auto' }}>
            <strong>{messagesFiltres.length}</strong> / {messages.length}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: T.textLight }}>
            <div style={{ width: 40, height: 40, margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgba(37,99,235,0.2)', borderTop: `3px solid ${T.accent}`, animation: 'spin 0.8s linear infinite' }} />
            <p>Chargement des messages...</p>
          </div>
        )}

        {/* Liste */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messagesFiltres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: T.textLight, backgroundColor: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📭</div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Aucun message</p>
              </div>
            ) : (
              messagesFiltres.map(m => (
                <div key={m.id} onClick={() => ouvrirMessage(m)}
                  style={{
                    backgroundColor: m.lu ? T.card : '#fafeff',
                    border: `1px solid ${m.lu ? T.border : T.accent + '40'}`,
                    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                    borderLeft: `4px solid ${T.accent}`,
                    boxShadow: m.lu ? 'none' : `0 1px 6px ${T.accent}20`,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = m.lu ? 'none' : `0 1px 6px ${T.accent}20`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📋</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          {!m.lu && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: T.danger, flexShrink: 0 }} />}
                          <p style={{ fontSize: 14, fontWeight: m.lu ? 600 : 800, color: T.text, margin: 0 }}>{m.nom || 'Anonyme'}</p>
                          {m.sujet && (
                            <span style={{ backgroundColor: T.accentLight, color: T.accent, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{m.sujet}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: T.textLight, margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {m.message}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: T.textLight, margin: 0, whiteSpace: 'nowrap' }}>{new Date(m.date).toLocaleDateString('fr-CA')}</p>
                      <span style={{ backgroundColor: m.lu ? '#dcfce7' : '#fee2e2', color: m.lu ? T.success : T.danger, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                        {m.lu ? '✓ Lu' : '● Non lu'}
                      </span>
                      <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>Voir →</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Note bas de page */}
        <div style={{ marginTop: 20, backgroundColor: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>
            100 messages gratuits par mois inclus. Les blocs supplémentaires achetés apparaissent aussi dans votre facture, section <strong>Mes services</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}