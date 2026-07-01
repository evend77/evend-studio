/**
 * StudioBadgesAttribues.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioBadgesAttribues.tsx
 *
 * 2 onglets : Collaborateurs / Acheteurs
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

interface Badge { id: string; nom: string; icone: string; couleur: string; niveau: number; statut: string; type_badge: string; }

interface CollaborateurAvecBadges {
  sous_gestionnaire_id: number; collaborateur_nom: string;
  collaborateur_email: string; boutique_nom: string; badges: Badge[];
}

interface AcheteurAvecBadges {
  acheteur_id: number; acheteur_nom: string; acheteur_email: string; badges: Badge[];
}

const C = {
  bg: '#f4f6f8', card: '#fff', border: '#e2e8f0',
  gold: '#c9a96e', goldLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444',
  text: '#1e293b', textLight: '#64748b', textXLight: '#94a3b8', border2: '#cbd5e1',
};

function Toast({ msg, type }: { msg: string; type: 'ok'|'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

function BadgePill({ badge, onRetirer }: { badge: Badge; onRetirer?: () => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: `${badge.couleur}18`, border: `1px solid ${badge.couleur}44`, fontSize: '12px', fontWeight: 700, color: C.text }}>
      <span>{badge.icone}</span>
      <span style={{ color: badge.couleur }}>{badge.nom}</span>
      {onRetirer && <button onClick={onRetirer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: '12px', padding: '0 0 0 2px', lineHeight: 1 }}>✕</button>}
    </div>
  );
}

function ModalAttribution({ titre, sousTitre, tousLesBadges, badgesActuels, onSave, onClose }: {
  titre: string; sousTitre: string; tousLesBadges: Badge[];
  badgesActuels: Badge[]; onSave: (ids: string[]) => void; onClose: () => void;
}) {
  const [selectionnes, setSelectionnes] = useState<string[]>(badgesActuels.map(b => b.id));
  const [recherche, setRecherche]       = useState('');
  const [saving, setSaving]             = useState(false);

  const filtres = tousLesBadges.filter(b => b.statut === 'actif' && b.nom.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>🏅 {titre}</p>
            <p style={{ fontSize: '12px', opacity: 0.75, margin: '4px 0 0' }}>{sousTitre}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Sélectionnés ({selectionnes.length})</p>
            {selectionnes.length === 0
              ? <p style={{ fontSize: '13px', color: C.textXLight, fontStyle: 'italic' }}>Aucun badge sélectionné</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectionnes.map(id => { const b = tousLesBadges.find(x => x.id === id); return b ? <BadgePill key={id} badge={b} onRetirer={() => setSelectionnes(prev => prev.filter(x => x !== id))} /> : null; })}
                </div>
            }
          </div>
          <div style={{ height: '1px', background: C.border, margin: '14px 0' }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un badge…" style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', outline: 'none', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtres.length === 0
              ? <p style={{ fontSize: '13px', color: C.textXLight, textAlign: 'center', padding: '20px' }}>Aucun badge actif</p>
              : filtres.map(badge => {
                  const est = selectionnes.includes(badge.id);
                  return (
                    <div key={badge.id} onClick={() => setSelectionnes(prev => est ? prev.filter(x => x !== badge.id) : [...prev, badge.id])}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `2px solid ${est ? badge.couleur : C.border}`, background: est ? `${badge.couleur}10` : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${badge.couleur}dd, ${badge.couleur}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: `2px solid ${badge.couleur}` }}>{badge.icone}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.text }}>{badge.nom}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.textLight }}>Niveau {badge.niveau}</p>
                      </div>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${est ? badge.couleur : C.border2}`, background: est ? badge.couleur : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {est && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}>✓</span>}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: C.textLight }}>{selectionnes.length} badge(s) sélectionné(s)</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>Annuler</button>
            <button onClick={() => { setSaving(true); onSave(selectionnes); }} disabled={saving}
              style={{ padding: '9px 22px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              {saving ? '⏳…' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListeAvecBadges<T extends { badges: Badge[] }>({
  items, getKey, getNom, getEmail, getSousTitre, tousLesBadges,
  onGerer, onRetirer, recherche, libelle,
}: {
  items: T[]; getKey: (i: T) => number; getNom: (i: T) => string;
  getEmail: (i: T) => string; getSousTitre?: (i: T) => string;
  tousLesBadges: Badge[]; onGerer: (i: T) => void;
  onRetirer: (item: T, badgeId: string) => void;
  recherche: string; libelle: string;
}) {
  const filtres = items.filter(i =>
    [getNom(i), getEmail(i)].join(' ').toLowerCase().includes(recherche.toLowerCase())
  );

  if (filtres.length === 0) return (
    <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '14px' }}>👤</div>
      <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: C.text }}>Aucun {libelle}</h2>
      <p style={{ margin: 0, fontSize: '14px', color: C.textLight }}>Ajoutez des {libelle}s pour leur attribuer des badges.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {filtres.map(item => (
        <div key={getKey(item)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(getNom(item) || getEmail(item)).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: C.text }}>{getNom(item) || '—'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: C.textLight }}>{getEmail(item)}{getSousTitre?.(item) ? ` · ${getSousTitre(item)}` : ''}</p>
            </div>
            <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {item.badges.length === 0
                ? <span style={{ fontSize: '12px', color: C.textXLight, fontStyle: 'italic' }}>Aucun badge</span>
                : item.badges.map(b => <BadgePill key={b.id} badge={b} onRetirer={() => onRetirer(item, b.id)} />)
              }
            </div>
            <button onClick={() => onGerer(item)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(201,169,110,0.3)' }}>
              🏅 Gérer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props { gestionnaireId: number; }

export default function StudioBadgesAttribues({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const [onglet, setOnglet]             = useState<'collaborateurs'|'acheteurs'>('collaborateurs');
  const [collaborateurs, setCollaborateurs] = useState<CollaborateurAvecBadges[]>([]);
  const [acheteurs, setAcheteurs]       = useState<AcheteurAvecBadges[]>([]);
  const [tousLesBadges, setTousLesBadges] = useState<Badge[]>([]);
  const [loading, setLoading]           = useState(true);
  const [recherche, setRecherche]       = useState('');
  const [modalSV, setModalSV]           = useState<CollaborateurAvecBadges | null>(null);
  const [modalAch, setModalAch]         = useState<AcheteurAvecBadges | null>(null);
  const [toast, setToast]               = useState<{msg:string;type:'ok'|'err'}|null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribues`,          { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribues-acheteurs`,{ credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/studio/badges/${gestionnaireId}`,                    { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [sv, ach, badges] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setCollaborateurs(Array.isArray(sv)     ? sv     : []);
      setAcheteurs(Array.isArray(ach)       ? ach    : []);
      setTousLesBadges(Array.isArray(badges)? badges : []);
    } catch { showToast('Erreur de chargement', 'err'); }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  function showToast(msg: string, type: 'ok'|'err') { setToast({ msg, type }); }

  // ── Attribution collaborateur ──────────────────────────────────────────────
  async function sauvegarderSV(sousGestionnaireId: number, badgeIds: string[]) {
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribuer`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sous_gestionnaire_id: sousGestionnaireId, badge_ids: badgeIds }),
      });
      setModalSV(null); await charger(); showToast('Badges mis à jour !', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  async function retirerSV(sv: CollaborateurAvecBadges, badgeId: string) {
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribuer/${sv.sous_gestionnaire_id}/${badgeId}`, {
        method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborateurs(prev => prev.map(s => s.sous_gestionnaire_id === sv.sous_gestionnaire_id ? { ...s, badges: s.badges.filter(b => b.id !== badgeId) } : s));
      showToast('Badge retiré', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  // ── Attribution acheteur ──────────────────────────────────────────────────
  async function sauvegarderAch(acheteurId: number, badgeIds: string[]) {
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribuer-acheteur`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ acheteur_id: acheteurId, badge_ids: badgeIds }),
      });
      setModalAch(null); await charger(); showToast('Badges mis à jour !', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  async function retirerAch(ach: AcheteurAvecBadges, badgeId: string) {
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/attribuer-acheteur/${ach.acheteur_id}/${badgeId}`, {
        method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      setAcheteurs(prev => prev.map(a => a.acheteur_id === ach.acheteur_id ? { ...a, badges: a.badges.filter(b => b.id !== badgeId) } : a));
      showToast('Badge retiré', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>🎖️</div><p style={{ margin: 0 }}>Chargement…</p></div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {modalSV && (
        <ModalAttribution
          titre="Attribuer des badges"
          sousTitre={`${modalSV.collaborateur_nom || modalSV.collaborateur_email}${modalSV.boutique_nom ? ` · 🏪 ${modalSV.boutique_nom}` : ''}`}
          tousLesBadges={tousLesBadges.filter(b => b.type_badge === 'collaborateur' || b.type_badge === 'les-deux')}
          badgesActuels={modalSV.badges}
          onSave={ids => sauvegarderSV(modalSV.sous_gestionnaire_id, ids)} onClose={() => setModalSV(null)}
        />
      )}
      {modalAch && (
        <ModalAttribution
          titre="Attribuer des badges"
          sousTitre={`${modalAch.acheteur_nom || modalAch.acheteur_email}`}
          tousLesBadges={tousLesBadges.filter(b => b.type_badge === 'acheteur' || b.type_badge === 'les-deux')}
          badgesActuels={modalAch.badges}
          onSave={ids => sauvegarderAch(modalAch.acheteur_id, ids)} onClose={() => setModalAch(null)}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>🎖️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Badges attribués</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Gérez les badges de vos collaborateurs et acheteurs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Collaborateurs', val: collaborateurs.length,                                          icon: '🏪' },
          { label: 'Avec badges',   val: collaborateurs.filter(sv => sv.badges.length > 0).length,       icon: '🏅' },
          { label: 'Acheteurs',     val: acheteurs.length,                                             icon: '👥' },
          { label: 'Avec badges',   val: acheteurs.filter(a => a.badges.length > 0).length,            icon: '🎖️' },
          { label: 'Badges dispo.', val: tousLesBadges.filter(b => b.statut === 'actif').length,       icon: '✨' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 14px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', margin: '0 0 3px' }}>{s.icon}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: '10px', color: C.textLight, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.border}`, marginBottom: '20px' }}>
        {([
          { id: 'collaborateurs', label: '🏪 Collaborateurs', count: collaborateurs.length },
          { id: 'acheteurs',     label: '👥 Acheteurs',     count: acheteurs.length },
        ] as const).map(o => (
          <button key={o.id} onClick={() => { setOnglet(o.id); setRecherche(''); }}
            style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: onglet === o.id ? 700 : 500, background: onglet === o.id ? C.card : 'transparent', color: onglet === o.id ? C.gold : C.textLight, borderBottom: onglet === o.id ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {o.label} <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: onglet === o.id ? C.goldLight : '#f0f2f5', color: onglet === o.id ? C.gold : C.textLight, marginLeft: '4px' }}>{o.count}</span>
          </button>
        ))}
      </div>

      {/* Filtre */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder={`🔍 Rechercher un ${onglet === 'collaborateurs' ? 'collaborateur' : 'acheteur'}…`}
          style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
      </div>

      {/* Contenu */}
      {onglet === 'collaborateurs' && (
        <ListeAvecBadges
          items={collaborateurs} getKey={i => i.sous_gestionnaire_id}
          getNom={i => i.collaborateur_nom} getEmail={i => i.collaborateur_email}
          getSousTitre={i => i.boutique_nom ? `🏪 ${i.boutique_nom}` : ''}
          tousLesBadges={tousLesBadges} onGerer={sv => setModalSV(sv)}
          onRetirer={(sv, bid) => retirerSV(sv, bid)}
          recherche={recherche} libelle="collaborateur"
        />
      )}
      {onglet === 'acheteurs' && (
        <ListeAvecBadges
          items={acheteurs} getKey={i => i.acheteur_id}
          getNom={i => i.acheteur_nom} getEmail={i => i.acheteur_email}
          tousLesBadges={tousLesBadges} onGerer={ach => setModalAch(ach)}
          onRetirer={(ach, bid) => retirerAch(ach, bid)}
          recherche={recherche} libelle="acheteur"
        />
      )}
    </div>
  );
}