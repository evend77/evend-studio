import React, { useState, useEffect } from 'react';
import { Page } from '@shopify/polaris';


// ✅ Helper token — niveau module (accessible partout dans le fichier)
const getToken = () => localStorage.getItem('token');

const API_BASE = (window as any).REACT_APP_API_URL || 'https://evend-multivendeur-api.onrender.com/api';

const T = {
  accent: '#537373', accentLight: '#eef3f3',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#008060', warning: '#d97706', danger: '#dc2626',
  gold: '#f59e0b',
};

interface Avis {
  id: number;
  acheteur: string;
  avatar: string;
  produit: string;
  produit_id: number;
  note: number;
  commentaire: string;
  date: string;
  reponse?: string;
  dateReponse?: string;
  commande?: string;
}

function Etoiles({ note, taille = 16 }: { note: number; taille?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: taille, color: i <= note ? T.gold : '#d1d5db' }}>★</span>
      ))}
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success'|'danger' }) {
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: type === 'success' ? T.success : T.danger, color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

export default function MesAvis() {
  const [avis, setAvis]                     = useState<Avis[]>([]);
  const [loading, setLoading]               = useState(true);
  const [reponseEnCours, setReponseEnCours] = useState<number | null>(null);
  const [texteReponse,   setTexteReponse]   = useState('');
  const [recherche,      setRecherche]      = useState('');
  const [filtreNote,     setFiltreNote]     = useState(0);
  const [filtreRepondu,  setFiltreRepondu]  = useState<'tous'|'repondu'|'attente'>('tous');
  const [toast,          setToast]          = useState<{ msg: string; type: 'success'|'danger' } | null>(null);

  const showToast = (msg: string, type: 'success'|'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Charger les avis depuis la BD ─────────────────────────────────────────
  useEffect(() => {
    async function charger() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/avis/vendeur`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();

        const avisFormates: Avis[] = (data.avis || []).map((a: any) => ({
          id:         a.id,
          acheteur:   a.prenom && a.nom ? `${a.prenom} ${a.nom}` : a.nom_visiteur || a.acheteur_email || 'Acheteur',
          avatar:     (a.prenom || a.nom_visiteur || a.acheteur_email || 'A')[0].toUpperCase(),
          produit:    a.produit_nom || 'Avis boutique',
          produit_id: a.vendeur_id,
          note:       parseFloat(String(a.note || a.note_globale)) || 0,
          commentaire: a.commentaire || '',
          date:       a.created_at ? String(a.created_at).slice(0, 10) : '',
          reponse:    a.reponse_vendeur || undefined,
          dateReponse: a.date_reponse ? String(a.date_reponse).slice(0, 10) : undefined,
          commande:   a.commande_id ? `#${a.commande_id}` : undefined,
        }));

        setAvis(avisFormates);
      } catch (err) {
        console.error('Erreur chargement avis:', err);
        setAvis([]);
      } finally {
        setLoading(false);
      }
    }
    charger();
  }, []);

  // ── Envoyer réponse ────────────────────────────────────────────────────────
  const envoyerReponse = async (id: number) => {
    if (!texteReponse.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/avis/${id}/reponse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ reponse: texteReponse.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');

      setAvis(prev => prev.map(a => a.id === id
        ? { ...a, reponse: texteReponse.trim(), dateReponse: new Date().toISOString().slice(0, 10) }
        : a
      ));
      setReponseEnCours(null);
      setTexteReponse('');
      showToast('✅ Votre réponse a été publiée avec succès !', 'success');
    } catch {
      showToast('❌ Erreur lors de la publication. Réessayez.', 'danger');
    }
  };

  const avisFiltres = avis.filter(a => {
    const s = recherche.toLowerCase();
    const inSearch  = !s || a.acheteur.toLowerCase().includes(s) || a.produit.toLowerCase().includes(s) || a.commentaire.toLowerCase().includes(s);
    const inNote    = filtreNote === 0 || a.note === filtreNote;
    const inRepondu = filtreRepondu === 'tous' || (filtreRepondu === 'repondu' ? !!a.reponse : !a.reponse);
    return inSearch && inNote && inRepondu;
  });

  const moyenneNote  = avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0;
  const nonRepondus  = avis.filter(a => !a.reponse).length;

  return (
    <Page title="Mes avis clients">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ paddingBottom: '60px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Note moyenne',   val: avis.length > 0 ? moyenneNote.toFixed(1) + ' / 5' : '—',  icon: '⭐', color: T.gold    },
            { label: 'Total avis',     val: String(avis.length),                                        icon: '💬', color: T.accent  },
            { label: 'Sans réponse',   val: String(nonRepondus),                                        icon: '⏳', color: T.warning },
            { label: 'Avis 5 étoiles', val: String(avis.filter(a => a.note === 5).length),             icon: '🏆', color: T.success },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>{k.icon}</span>
                <p style={{ fontSize: '20px', fontWeight: '900', color: k.color, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', color: T.textLight, margin: 0, fontWeight: '600' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher acheteur, produit..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 10px 8px 28px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0,5,4,3,2,1].map(n => (
              <button key={n} onClick={() => setFiltreNote(n)}
                style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${filtreNote === n ? T.accent : T.border}`, backgroundColor: filtreNote === n ? T.accentLight : 'white', color: filtreNote === n ? T.accent : T.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {n === 0 ? 'Toutes' : '★'.repeat(n)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([['tous','Tous'],['attente','⏳ Sans réponse'],['repondu','✅ Répondus']] as const).map(([val,label]) => (
              <button key={val} onClick={() => setFiltreRepondu(val)}
                style={{ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${filtreRepondu === val ? T.accent : T.border}`, backgroundColor: filtreRepondu === val ? T.accentLight : 'white', color: filtreRepondu === val ? T.accent : T.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste avis */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: T.textLight }}>
            <p>Chargement des avis...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {avisFiltres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, color: T.textLight }}>
                <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.3 }}>💬</div>
                <p style={{ fontSize: '13px', fontWeight: '600' }}>
                  {avis.length === 0 ? 'Aucun avis reçu pour le moment.' : 'Aucun avis trouvé avec ces filtres.'}
                </p>
              </div>
            ) : avisFiltres.map(a => (
              <div key={a.id} style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{a.avatar}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: 0 }}>{a.acheteur}</p>
                          <Etoiles note={a.note} />
                          <span style={{ fontSize: '11px', color: T.textLight }}>· {a.date}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: T.accent, fontWeight: '600', margin: 0 }}>
                          📦 {a.produit}{a.commande ? ` · Commande ${a.commande}` : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {a.reponse
                        ? <span style={{ backgroundColor: '#dcfce7', color: T.success, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✅ Répondu</span>
                        : <span style={{ backgroundColor: '#fef9c3', color: '#92400e', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>⏳ Sans réponse</span>
                      }
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: T.text, margin: '12px 0 0 54px', lineHeight: '1.6', fontStyle: 'italic' }}>« {a.commentaire} »</p>
                </div>
                {a.reponse && (
                  <div style={{ padding: '14px 20px 14px 54px', backgroundColor: '#f8fffe', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ borderLeft: `3px solid ${T.success}`, paddingLeft: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: T.success }}>🏪 Votre réponse</span>
                        {a.dateReponse && <span style={{ fontSize: '10px', color: T.textLight }}>· {a.dateReponse}</span>}
                      </div>
                      <p style={{ fontSize: '13px', color: T.text, margin: 0, lineHeight: '1.6' }}>{a.reponse}</p>
                    </div>
                  </div>
                )}
                <div style={{ padding: '12px 20px 12px 54px' }}>
                  {!a.reponse && reponseEnCours !== a.id && (
                    <button onClick={() => { setReponseEnCours(a.id); setTexteReponse(''); }}
                      style={{ backgroundColor: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      ↩ Répondre à cet avis
                    </button>
                  )}
                  {reponseEnCours === a.id && (
                    <div>
                      <textarea value={texteReponse} onChange={e => setTexteReponse(e.target.value)}
                        placeholder="Rédigez votre réponse publique à cet avis..." rows={3}
                        style={{ width: '100%', border: `1px solid ${T.accent}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: '10px' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => envoyerReponse(a.id)} disabled={!texteReponse.trim()}
                          style={{ backgroundColor: texteReponse.trim() ? T.success : '#86efac', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: '700', cursor: texteReponse.trim() ? 'pointer' : 'not-allowed' }}>
                          ✅ Publier la réponse
                        </button>
                        <button onClick={() => { setReponseEnCours(null); setTexteReponse(''); }}
                          style={{ backgroundColor: 'white', color: T.textLight, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: T.textLight, margin: '8px 0 0 0' }}>⚠️ Votre réponse sera visible publiquement. Vous ne pouvez répondre qu'une seule fois par avis.</p>
                    </div>
                  )}
                  {a.reponse && (
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0, fontStyle: 'italic' }}>🔒 Vous avez déjà répondu à cet avis.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
