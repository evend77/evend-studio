/**
 * AvisProduits.tsx
 * src/pages/vendeur/AvisProduits.tsx
 * Page pour le vendeur - Gérer les avis sur ses produits
 */

import React, { useState, useEffect } from 'react';

// Types
interface AvisProduit {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_prix: number;
  produit_image?: string;
  acheteur_id: number;
  prenom: string;
  nom: string;
  acheteur_email: string;
  note: number;
  commentaire: string;
  photos: string[];
  date_avis: string;
  date_modification?: string;
  reponse_vendeur?: string;
  date_reponse_vendeur?: string;
  commande_id: number;
  date_achat: string;
}

// Couleurs
const C = {
  accent: '#537373',
  accentLight: '#eef3f3',
  bg: '#f4f6f8',
  card: '#fff',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  success: '#008060',
  warning: '#d97706',
  danger: '#dc2626',
  gold: '#f59e0b',
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.1)',
};

const getToken = () => localStorage.getItem('token');
const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

// Composant étoiles
const Etoiles = ({ note, taille = 16 }: { note: number; taille?: number }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: taille, color: i <= note ? C.gold : '#d1d5db' }}>★</span>
    ))}
  </div>
);

// Toast notification
const Toast = ({ msg, type }: { msg: string; type: 'success' | 'danger' }) => (
  <div style={{
    position: 'fixed',
    top: '80px',
    right: '24px',
    backgroundColor: type === 'success' ? C.success : C.danger,
    color: 'white',
    padding: '12px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    zIndex: 2000,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
  }}>
    {msg}
  </div>
);

export default function AvisProduits() {
  const [avis, setAvis] = useState<AvisProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [reponseEnCours, setReponseEnCours] = useState<number | null>(null);
  const [texteReponse, setTexteReponse] = useState('');
  const [modificationEnCours, setModificationEnCours] = useState<number | null>(null);
  const [texteModification, setTexteModification] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreNote, setFiltreNote] = useState(0);
  const [filtreRepondu, setFiltreRepondu] = useState<'tous' | 'repondu' | 'attente'>('tous');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Charger les avis depuis la BD
  useEffect(() => {
    async function charger() {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/avis-produits/vendeur/produits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();

        const avisFormates: AvisProduit[] = (data.avis || []).map((a: any) => ({
          id: a.id,
          produit_id: a.produit_id,
          produit_nom: a.produit_nom,
          produit_prix: a.produit_prix,
          produit_image: a.produit_image,
          acheteur_id: a.acheteur_id,
          prenom: a.prenom,
          nom: a.nom,
          acheteur_email: a.acheteur_email,
          note: a.note,
          commentaire: a.commentaire,
          photos: a.photos || [],
          date_avis: a.date_avis ? new Date(a.date_avis).toLocaleDateString('fr-CA') : '',
          date_modification: a.date_modification ? new Date(a.date_modification).toLocaleDateString('fr-CA') : undefined,
          reponse_vendeur: a.reponse_vendeur,
          date_reponse_vendeur: a.date_reponse_vendeur ? new Date(a.date_reponse_vendeur).toLocaleDateString('fr-CA') : undefined,
          commande_id: a.commande_id,
          date_achat: a.date_achat ? new Date(a.date_achat).toLocaleDateString('fr-CA') : '',
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

  // Publier une réponse
  const envoyerReponse = async (id: number) => {
    if (!texteReponse.trim()) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/avis-produits/${id}/reponse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reponse: texteReponse.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');

      setAvis(prev => prev.map(a => a.id === id
        ? {
            ...a,
            reponse_vendeur: texteReponse.trim(),
            date_reponse_vendeur: new Date().toLocaleDateString('fr-CA')
          }
        : a
      ));
      setReponseEnCours(null);
      setTexteReponse('');
      showToast('✅ Votre réponse a été publiée avec succès !', 'success');
    } catch {
      showToast('❌ Erreur lors de la publication. Réessayez.', 'danger');
    }
  };

  // Modifier une réponse existante
  const modifierReponse = async (id: number, nouvelleReponse: string) => {
    if (!nouvelleReponse.trim()) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/avis-produits/${id}/reponse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reponse: nouvelleReponse.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');

      setAvis(prev => prev.map(a => a.id === id
        ? {
            ...a,
            reponse_vendeur: nouvelleReponse.trim(),
            date_reponse_vendeur: new Date().toLocaleDateString('fr-CA')
          }
        : a
      ));
      setModificationEnCours(null);
      setTexteModification('');
      showToast('✅ Votre réponse a été modifiée avec succès !', 'success');
    } catch {
      showToast('❌ Erreur lors de la modification.', 'danger');
    }
  };

  // Filtres
  const avisFiltres = avis.filter(a => {
    const s = recherche.toLowerCase();
    const inSearch = !s ||
      a.produit_nom.toLowerCase().includes(s) ||
      `${a.prenom} ${a.nom}`.toLowerCase().includes(s) ||
      a.commentaire.toLowerCase().includes(s);
    const inNote = filtreNote === 0 || a.note === filtreNote;
    const inRepondu = filtreRepondu === 'tous' ||
      (filtreRepondu === 'repondu' ? !!a.reponse_vendeur : !a.reponse_vendeur);
    return inSearch && inNote && inRepondu;
  });

  const moyenneNote = avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0;
  const nonRepondus = avis.filter(a => !a.reponse_vendeur).length;

  return (
    <div style={{ paddingBottom: '60px', backgroundColor: C.bg, minHeight: '100vh' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #537373 0%, #3a5a5a 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, color: '#fff' }}>
            📝 Avis sur mes produits
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Consultez et répondez aux avis laissés par vos acheteurs.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Note moyenne', val: avis.length > 0 ? moyenneNote.toFixed(1) + ' / 5' : '—', icon: '⭐', color: C.gold },
          { label: 'Total avis', val: String(avis.length), icon: '💬', color: C.accent },
          { label: 'Sans réponse', val: String(nonRepondus), icon: '⏳', color: C.warning },
          { label: 'Avis 5 étoiles', val: String(avis.filter(a => a.note === 5).length), icon: '🏆', color: C.success },
        ].map((k, i) => (
          <div key={i} style={{
            backgroundColor: C.card,
            borderRadius: '16px',
            border: `1px solid ${C.border}`,
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px' }}>{k.icon}</span>
              <p style={{ fontSize: '28px', fontWeight: '900', color: k.color, margin: 0 }}>{k.val}</p>
            </div>
            <p style={{ fontSize: '12px', color: C.textLight, margin: 0, fontWeight: '600' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher produit, acheteur..."
            style={{
              width: '100%',
              border: `1px solid ${C.border}`,
              borderRadius: '30px',
              padding: '10px 16px 10px 40px',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[0, 5, 4, 3, 2, 1].map(n => (
            <button
              key={n}
              onClick={() => setFiltreNote(n)}
              style={{
                padding: '6px 14px',
                borderRadius: '30px',
                border: `1px solid ${filtreNote === n ? C.accent : C.border}`,
                backgroundColor: filtreNote === n ? C.accentLight : 'white',
                color: filtreNote === n ? C.accent : C.textLight,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {n === 0 ? 'Toutes' : '★'.repeat(n)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            ['tous', 'Tous'],
            ['attente', '⏳ Sans réponse'],
            ['repondu', '✅ Répondus']
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltreRepondu(val)}
              style={{
                padding: '6px 14px',
                borderRadius: '30px',
                border: `1px solid ${filtreRepondu === val ? C.accent : C.border}`,
                backgroundColor: filtreRepondu === val ? C.accentLight : 'white',
                color: filtreRepondu === val ? C.accent : C.textLight,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des avis */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
          <p>Chargement des avis...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {avisFiltres.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: C.card,
              borderRadius: '20px',
              border: `1px solid ${C.border}`,
              color: C.textLight
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>
                {avis.length === 0 ? 'Aucun avis sur vos produits pour le moment.' : 'Aucun avis trouvé avec ces filtres.'}
              </p>
            </div>
          ) : (
            avisFiltres.map(a => (
              <div key={a.id} style={{
                backgroundColor: C.card,
                borderRadius: '20px',
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {/* En-tête avec image produit */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {/* Image du produit */}
                      {a.produit_image && a.produit_image.startsWith('http') ? (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#f0f0f0',
                          flexShrink: 0,
                        }}>
                          <img 
                            src={a.produit_image} 
                            alt={a.produit_nom}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${C.accent}30, ${C.accent}10)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '30px',
                          flexShrink: 0,
                        }}>
                          📦
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <p style={{ fontSize: '15px', fontWeight: '800', color: C.text, margin: 0 }}>
                            {a.prenom} {a.nom}
                          </p>
                          <Etoiles note={a.note} taille={14} />
                          <span style={{ fontSize: '11px', color: C.textLight }}>· {a.date_avis}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: C.accent, fontWeight: '600', margin: 0 }}>
                          📦 {a.produit_nom} · Commande #{a.commande_id}
                        </p>
                      </div>
                    </div>
                    <div>
                      {a.reponse_vendeur ? (
                        <span style={{
                          backgroundColor: '#dcfce7',
                          color: C.success,
                          padding: '4px 12px',
                          borderRadius: '30px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>✅ Répondu</span>
                      ) : (
                        <span style={{
                          backgroundColor: '#fef9c3',
                          color: '#92400e',
                          padding: '4px 12px',
                          borderRadius: '30px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>⏳ En attente</span>
                      )}
                    </div>
                  </div>

                  {/* Commentaire */}
                  <p style={{
                    fontSize: '14px',
                    color: C.text,
                    margin: '16px 0 0 74px',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    « {a.commentaire} »
                  </p>

                  {/* Photos uploadées par l'acheteur */}
                  {a.photos && a.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginLeft: '74px', flexWrap: 'wrap' }}>
                      {a.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          onClick={() => window.open(photo, '_blank')}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: `1px solid ${C.border}`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Réponse existante avec bouton modifier */}
                {a.reponse_vendeur && modificationEnCours !== a.id && (
                  <div style={{
                    padding: '14px 24px 14px 98px',
                    backgroundColor: C.blueLight,
                    borderBottom: `1px solid ${C.border}`
                  }}>
                    <div style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: C.blue }}>🏪 Votre réponse</span>
                            {a.date_reponse_vendeur && (
                              <span style={{ fontSize: '10px', color: C.textLight }}>· {a.date_reponse_vendeur}</span>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: C.text, margin: 0, lineHeight: '1.6' }}>
                            {a.reponse_vendeur}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setModificationEnCours(a.id);
                            setTexteModification(a.reponse_vendeur || '');
                          }}
                          style={{
                            background: 'white',
                            color: C.blue,
                            border: `1px solid ${C.blue}40`,
                            borderRadius: '20px',
                            padding: '5px 14px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modification de réponse */}
                {a.reponse_vendeur && modificationEnCours === a.id && (
                  <div style={{
                    padding: '14px 24px 14px 98px',
                    backgroundColor: C.blueLight,
                    borderBottom: `1px solid ${C.border}`
                  }}>
                    <div style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: '16px' }}>
                      <textarea
                        value={texteModification}
                        onChange={e => setTexteModification(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          border: `1px solid ${C.blue}`,
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'vertical',
                          marginBottom: '10px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => modifierReponse(a.id, texteModification)}
                          disabled={!texteModification.trim()}
                          style={{
                            backgroundColor: texteModification.trim() ? C.success : '#86efac',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '6px 18px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: texteModification.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          💾 Enregistrer
                        </button>
                        <button
                          onClick={() => { setModificationEnCours(null); setTexteModification(''); }}
                          style={{
                            backgroundColor: 'white',
                            color: C.textLight,
                            border: `1px solid ${C.border}`,
                            borderRadius: '20px',
                            padding: '6px 18px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zone pour répondre (si pas de réponse) */}
                <div style={{ padding: '16px 24px 20px 98px' }}>
                  {!a.reponse_vendeur && reponseEnCours !== a.id && (
                    <button
                      onClick={() => { setReponseEnCours(a.id); setTexteReponse(''); }}
                      style={{
                        backgroundColor: C.accentLight,
                        color: C.accent,
                        border: `1px solid ${C.accent}`,
                        borderRadius: '30px',
                        padding: '8px 20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      ↩ Répondre à cet avis
                    </button>
                  )}

                  {reponseEnCours === a.id && (
                    <div>
                      <textarea
                        value={texteReponse}
                        onChange={e => setTexteReponse(e.target.value)}
                        placeholder="Rédigez votre réponse publique à cet avis..."
                        rows={3}
                        style={{
                          width: '100%',
                          border: `1px solid ${C.accent}`,
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          marginBottom: '12px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => envoyerReponse(a.id)}
                          disabled={!texteReponse.trim()}
                          style={{
                            backgroundColor: texteReponse.trim() ? C.success : '#86efac',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            padding: '8px 24px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: texteReponse.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          ✅ Publier la réponse
                        </button>
                        <button
                          onClick={() => { setReponseEnCours(null); setTexteReponse(''); }}
                          style={{
                            backgroundColor: 'white',
                            color: C.textLight,
                            border: `1px solid ${C.border}`,
                            borderRadius: '30px',
                            padding: '8px 20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: C.textLight, margin: '12px 0 0 0' }}>
                        ⚠️ Votre réponse sera visible publiquement. Vous pouvez la modifier plus tard.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}