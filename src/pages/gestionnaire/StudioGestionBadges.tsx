/**
 * StudioGestionBadges.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioGestionBadges.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

interface Badge {
  id: string; nom: string; description: string;
  statut: 'actif' | 'inactif'; icone: string; couleur: string;
  niveau: number; critere: string; type_badge: string; nb_attribues: number; created_at: string;
}

const ICONES = ['🥇','🥈','🥉','🏆','👑','🌟','⭐','✨','🎯','🚀','💎','🔰','🎖️','🏅','📿','💍','⚡','🔥','💯','✅','🌱','🌿','🍃','♻️','🌍','🤝','🎨','📦','📍','📊','📈','💹','🛡️','🔒','🎁','❤️','🎂','🛒','💌','🤩','🙏'];

const COULEURS = [
  { nom: 'Or',        code: '#FFD700' }, { nom: 'Argent',     code: '#C0C0C0' },
  { nom: 'Bronze',    code: '#CD7F32' }, { nom: 'Rouge',      code: '#E74C3C' },
  { nom: 'Bleu',      code: '#3498DB' }, { nom: 'Vert',       code: '#27AE60' },
  { nom: 'Violet',    code: '#9B59B6' }, { nom: 'Orange',     code: '#F39C12' },
  { nom: 'Or Studio', code: '#c9a96e' }, { nom: 'Rose',       code: '#ec4899' },
  { nom: 'Turquoise', code: '#14b8a6' }, { nom: 'Indigo',     code: '#6366f1' },
];

const CRITERES_SV = [
  'Nombre de ventes', 'Note moyenne', 'Ancienneté', 'Nombre de produits',
  'Temps de réponse', 'Délai d\'expédition', 'Plan d\'abonnement',
  'Chiffre d\'affaires', 'Recommandations', 'Manuel',
];

const CRITERES_ACH = [
  'Premier achat', 'Nombre de commandes', 'Montant total dépensé',
  'Client fidèle', 'Parrainage', 'Avis laissé', 'Ancienneté client',
  'Acheteur VIP', 'Manuel',
];

const CRITERES_DEUX = Array.from(new Set([...CRITERES_SV, ...CRITERES_ACH]));

const TYPES_BADGE = [
  { value: 'collaborateur', label: '🏪 Collaborateur', desc: 'Attribuable aux collaborateurs seulement',  bg: 'rgba(201,169,110,0.1)', color: '#c9a96e' },
  { value: 'acheteur',     label: '👥 Acheteur',     desc: 'Attribuable aux acheteurs seulement',      bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  { value: 'les-deux',     label: '🌟 Les deux',     desc: 'Attribuable à tous',                       bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
];

const C = {
  bg: '#f4f6f8', card: '#fff', border: '#e2e8f0',
  gold: '#c9a96e', goldLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', greenLight: 'rgba(16,185,129,0.10)',
  red: '#ef4444', redLight: 'rgba(239,68,68,0.10)',
  orange: '#f59e0b', blue: '#3b82f6', blueLight: 'rgba(59,130,246,0.10)',
  text: '#1e293b', textLight: '#64748b', textXLight: '#94a3b8', border2: '#cbd5e1',
};

function Toast({ msg, type }: { msg: string; type: 'ok'|'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

function ApercuBadge({ icone, couleur, nom, niveau }: { icone: string; couleur: string; nom: string; niveau: number }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${couleur}dd, ${couleur}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: `0 4px 14px ${couleur}66, 0 0 0 3px ${couleur}33`, border: `2px solid ${couleur}` }}>
        {icone}
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, maxWidth: '64px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom || 'Aperçu'}</span>
      <span style={{ fontSize: '10px', color: couleur, fontWeight: 700 }}>Niv. {niveau}</span>
    </div>
  );
}

function TypeBadgePill({ type }: { type: string }) {
  const t = TYPES_BADGE.find(x => x.value === type) ?? TYPES_BADGE[2];
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: t.bg, color: t.color }}>{t.label}</span>
  );
}

function ModalBadge({ badge, onClose, onSave }: { badge: Partial<Badge>|null; onClose: () => void; onSave: (d: any) => void }) {
  const [nom, setNom]         = useState(badge?.nom || '');
  const [desc, setDesc]       = useState(badge?.description || '');
  const [icone, setIcone]     = useState(badge?.icone || '🏅');
  const [couleur, setCouleur] = useState(badge?.couleur || '#FFD700');
  const [niveau, setNiveau]   = useState(badge?.niveau || 1);
  const [critere, setCritere] = useState(badge?.critere || '');
  const [statut, setStatut]   = useState<'actif'|'inactif'>(badge?.statut || 'actif');
  const [typeBadge, setTypeBadge] = useState(badge?.type_badge || 'les-deux');
  const [saving, setSaving]   = useState(false);

  const criteres = typeBadge === 'collaborateur' ? CRITERES_SV : typeBadge === 'acheteur' ? CRITERES_ACH : CRITERES_DEUX;

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#f8fafc', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>{badge?.id ? '✏️ Modifier le badge' : '✨ Nouveau badge'}</p>
            <p style={{ fontSize: '12px', opacity: 0.75, margin: '3px 0 0' }}>Personnalisez votre badge</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 140px', gap: '24px' }}>
          <div>

            {/* Type de badge */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Type de badge</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {TYPES_BADGE.map(t => (
                  <div key={t.value} onClick={() => { setTypeBadge(t.value); setCritere(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: `2px solid ${typeBadge === t.value ? t.color : C.border}`, background: typeBadge === t.value ? t.bg : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${typeBadge === t.value ? t.color : C.border2}`, background: typeBadge === t.value ? t.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {typeBadge === t.value && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.text }}>{t.label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: C.textLight }}>{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Nom du badge *</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Client fidèle, Vendeur étoile…" style={inp} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Décrivez ce badge…" rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>

            {/* Niveau + Statut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Niveau</label>
                <input type="number" value={niveau} onChange={e => setNiveau(Number(e.target.value))} min={1} max={10} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Statut</label>
                <select value={statut} onChange={e => setStatut(e.target.value as any)} style={inp}>
                  <option value="actif">✅ Actif</option>
                  <option value="inactif">○ Inactif</option>
                </select>
              </div>
            </div>

            {/* Critère */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Critère d'attribution
                {typeBadge !== 'les-deux' && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px', background: typeBadge === 'collaborateur' ? C.goldLight : C.blueLight, color: typeBadge === 'collaborateur' ? C.gold : C.blue }}>
                  {typeBadge === 'collaborateur' ? 'Critères collaborateur' : 'Critères acheteur'}
                </span>}
              </label>
              <select value={critere} onChange={e => setCritere(e.target.value)} style={inp}>
                <option value="">— Choisir un critère —</option>
                {criteres.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Icônes */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Icône</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ICONES.map(i => (
                  <button key={i} onClick={() => setIcone(i)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: icone === i ? `2px solid ${C.gold}` : `1px solid ${C.border}`, background: icone === i ? C.goldLight : '#f8fafc', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i}</button>
                ))}
              </div>
            </div>

            {/* Couleurs */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Couleur</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {COULEURS.map(c => (
                  <button key={c.code} onClick={() => setCouleur(c.code)} title={c.nom} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.code, border: couleur === c.code ? `3px solid ${C.text}` : '2px solid transparent', cursor: 'pointer', boxShadow: couleur === c.code ? `0 0 0 2px #fff, 0 0 0 4px ${c.code}` : 'none', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Aperçu</p>
            <ApercuBadge icone={icone} couleur={couleur} nom={nom} niveau={niveau} />
            <TypeBadgePill type={typeBadge} />
            <div style={{ marginTop: '8px', background: '#1a2436', borderRadius: '12px', padding: '12px', textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fond sombre</p>
              <ApercuBadge icone={icone} couleur={couleur} nom={nom} niveau={niveau} />
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>Annuler</button>
          <button onClick={() => { if (nom.trim()) { setSaving(true); onSave({ nom, description: desc, icone, couleur, niveau, critere, statut, type_badge: typeBadge }); } }} disabled={!nom.trim() || saving}
            style={{ padding: '9px 22px', background: nom.trim() ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: nom.trim() ? '#fff' : '#94a3b8', cursor: nom.trim() ? 'pointer' : 'not-allowed' }}>
            {saving ? '⏳…' : badge?.id ? '💾 Modifier' : '✨ Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props { gestionnaireId: number; }

export default function StudioGestionBadges({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const [badges, setBadges]               = useState<Badge[]>([]);
  const [loading, setLoading]             = useState(true);
  const [recherche, setRecherche]         = useState('');
  const [filtre, setFiltre]               = useState<'tous'|'actif'|'inactif'>('tous');
  const [filtreType, setFiltreType]       = useState<'tous'|'collaborateur'|'acheteur'|'les-deux'>('tous');
  const [selectionnes, setSelectionnes]   = useState<string[]>([]);
  const [modal, setModal]                 = useState<Partial<Badge>|null|false>(false);
  const [confirmSuppr, setConfirmSuppr]   = useState<string|null>(null);
  const [confirmBulk, setConfirmBulk]     = useState(false);
  const [toast, setToast]                 = useState<{msg:string;type:'ok'|'err'}|null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/studio/badges/${gestionnaireId}`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBadges(Array.isArray(data) ? data : []);
    } catch { showToast('Erreur lors du chargement', 'err'); }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  function showToast(msg: string, type: 'ok'|'err') { setToast({ msg, type }); }

  const filtres = badges.filter(b => {
    const m = [b.nom, b.description, b.critere].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const f = filtre === 'tous' || b.statut === filtre;
    const ft = filtreType === 'tous' || b.type_badge === filtreType;
    return m && f && ft;
  });

  async function creerOuModifier(badgeExistant: Partial<Badge>|null, data: any) {
    try {
      const url    = badgeExistant?.id ? `${API_BASE}/studio/badges/${gestionnaireId}/${badgeExistant.id}` : `${API_BASE}/studio/badges/${gestionnaireId}`;
      const method = badgeExistant?.id ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      setModal(false);
      await charger();
      showToast(badgeExistant?.id ? 'Badge modifié !' : 'Badge créé !', 'ok');
    } catch { showToast('Erreur lors de la sauvegarde', 'err'); }
  }

  async function confirmerSupprimer(id: string) {
    setConfirmSuppr(null);
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/${id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      setBadges(prev => prev.filter(b => b.id !== id));
      showToast('Badge supprimé', 'ok');
    } catch { showToast('Erreur lors de la suppression', 'err'); }
  }

  async function actionBulk(action: 'actif'|'inactif'|'supprimer') {
    if (!selectionnes.length) return;
    if (action === 'supprimer') { setConfirmBulk(true); return; }
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/bulk/statut`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: selectionnes, statut: action }) });
      setBadges(prev => prev.map(b => selectionnes.includes(b.id) ? { ...b, statut: action } : b));
      setSelectionnes([]); showToast('Action effectuée !', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  async function confirmerBulkSupprimer() {
    setConfirmBulk(false);
    try {
      await fetch(`${API_BASE}/studio/badges/${gestionnaireId}/bulk`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: selectionnes }) });
      setBadges(prev => prev.filter(b => !selectionnes.includes(b.id)));
      setSelectionnes([]); showToast('Badges supprimés !', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>🏅</div><p style={{ margin: 0 }}>Chargement des badges…</p></div>
    </div>
  );

  // Stats par type
  const nbSV  = badges.filter(b => b.type_badge === 'collaborateur').length;
  const nbAch = badges.filter(b => b.type_badge === 'acheteur').length;
  const nbDeux= badges.filter(b => b.type_badge === 'les-deux').length;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {modal !== false && <ModalBadge badge={modal} onClose={() => setModal(false)} onSave={d => creerOuModifier(modal, d)} />}

      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: C.text }}>Supprimer ce badge ?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmSuppr(null)} style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#fff', color: C.textLight }}>Annuler</button>
              <button onClick={() => confirmerSupprimer(confirmSuppr)} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: C.red, color: '#fff' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {confirmBulk && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: C.text }}>Supprimer {selectionnes.length} badge(s) ?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmBulk(false)} style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#fff', color: C.textLight }}>Annuler</button>
              <button onClick={confirmerBulkSupprimer} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: C.red, color: '#fff' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>🏅</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Mes badges</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>{badges.length} badge{badges.length > 1 ? 's' : ''} créé{badges.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setModal(null)} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
          ✨ Nouveau badge
        </button>
      </div>

      {/* Stats par type */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: '🏪 Collaborateurs', val: nbSV,   bg: C.goldLight, color: C.gold },
          { label: '👥 Acheteurs',     val: nbAch,  bg: C.blueLight, color: C.blue },
          { label: '🌟 Les deux',      val: nbDeux, bg: C.greenLight, color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un badge…" style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />

        {/* Filtre statut */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['tous','actif','inactif'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: filtre === f ? C.gold : '#f0f2f5', color: filtre === f ? '#fff' : C.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {f === 'tous' ? 'Tous' : f === 'actif' ? '✅' : '○'} ({f === 'tous' ? badges.length : badges.filter(b => b.statut === f).length})
            </button>
          ))}
        </div>

        {/* Filtre type */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            { val: 'tous',         label: 'Tous types' },
            { val: 'collaborateur', label: '🏪 SV' },
            { val: 'acheteur',     label: '👥 Ach.' },
            { val: 'les-deux',     label: '🌟 Les deux' },
          ] as const).map(f => (
            <button key={f.val} onClick={() => setFiltreType(f.val)} style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', background: filtreType === f.val ? '#1a2436' : '#f0f2f5', color: filtreType === f.val ? '#fff' : C.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions groupées */}
      {selectionnes.length > 0 && (
        <div style={{ background: '#1a2436', borderRadius: '12px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectionnes.length} sélectionné(s)</span>
          <button onClick={() => actionBulk('actif')} style={{ padding: '6px 14px', background: '#dcfce7', color: C.green, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✅ Activer</button>
          <button onClick={() => actionBulk('inactif')} style={{ padding: '6px 14px', background: '#fff7ed', color: C.orange, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>○ Désactiver</button>
          <button onClick={() => actionBulk('supprimer')} style={{ padding: '6px 14px', background: '#fee2e2', color: C.red, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>🗑️ Supprimer</button>
          <button onClick={() => setSelectionnes([])} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      )}

      {/* Grille badges */}
      {filtres.length === 0 ? (
        <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: C.text }}>{badges.length === 0 ? 'Aucun badge créé' : 'Aucun résultat'}</h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.textLight }}>{badges.length === 0 ? 'Créez vos premiers badges pour vos collaborateurs et acheteurs.' : 'Modifiez vos filtres.'}</p>
          {badges.length === 0 && <button onClick={() => setModal(null)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>✨ Créer mon premier badge</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filtres.map(badge => {
            const typeInfo = TYPES_BADGE.find(t => t.value === badge.type_badge) ?? TYPES_BADGE[2];
            return (
              <div key={badge.id} style={{ background: C.card, border: `1px solid ${selectionnes.includes(badge.id) ? C.gold : C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                <div style={{ padding: '16px', background: `linear-gradient(135deg, ${badge.couleur}18, ${badge.couleur}08)`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" checked={selectionnes.includes(badge.id)} onChange={() => setSelectionnes(prev => prev.includes(badge.id) ? prev.filter(id => id !== badge.id) : [...prev, badge.id])} style={{ cursor: 'pointer', flexShrink: 0 }} />
                  <ApercuBadge icone={badge.icone} couleur={badge.couleur} nom={badge.nom} niveau={badge.niveau} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.nom}</p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: badge.statut === 'actif' ? C.greenLight : '#f3f4f6', color: badge.statut === 'actif' ? C.green : C.textLight }}>
                        {badge.statut === 'actif' ? '✅ Actif' : '○ Inactif'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: typeInfo.bg, color: typeInfo.color }}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  {badge.description && <p style={{ margin: '0 0 8px', fontSize: '12px', color: C.textLight, lineHeight: 1.5 }}>{badge.description}</p>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {badge.critere && <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: C.goldLight, color: C.gold }}>📊 {badge.critere}</span>}
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#f0f2f5', color: C.textLight }}>
                      👥 {badge.nb_attribues} attribué{badge.nb_attribues > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setModal(badge)} style={{ flex: 1, padding: '7px', border: `1px solid ${C.border}`, borderRadius: '8px', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>✏️ Modifier</button>
                    <button onClick={() => setConfirmSuppr(badge.id)} style={{ padding: '7px 12px', border: `1px solid #fecaca`, borderRadius: '8px', background: '#fff5f5', fontSize: '12px', cursor: 'pointer', color: C.red }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}