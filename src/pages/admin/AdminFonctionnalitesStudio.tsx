// CHEMIN : src/pages/admin/AdminFonctionnalitesStudio.tsx
// e-Vend Studio — ⭐ Forfaits & Plans → « Fonctionnalités & add-ons »
// Liste maître des add-ons (options_studio) : nom, prix, templates concernés, kill switch global.
// Un add-on est offert à l'achat seulement s'il n'est pas déjà inclus dans le forfait du gestionnaire.

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';

interface Addon {
  code: string; nom: string; description: string; emoji: string;
  prix_ht: number; actif: boolean; ordre: number; templates: string[];
  nb_achats: number; forfaits_inclus: string[];
}

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8', accent: '#2d6a9f', accentLight: '#e8f2fb',
  text: '#1a2332', textLight: '#6b7280', success: '#16a34a', danger: '#dc2626', warning: '#d97706',
};

// Templates connus (même identifiants que le catalogue des templates). Liste vide = tous les templates.
const TEMPLATES_CONNUS: { id: string; nom: string }[] = [
  { id: 'multivendeur-premium', nom: 'Multi-vendeur Premium' },
];

const EMOJIS = ['⭐', '🧩', '📝', '💬', '🏷️', '📊', '🔔', '🎁', '🛡️', '🚀', '📣', '🔌', '🌐', '📅', '💳', '🖼️'];

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

function Interrupteur({ actif, onChange, disabled }: { actif: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!actif)} role="switch" aria-checked={actif}
      style={{ width: 46, height: 25, borderRadius: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, background: actif ? T.success : '#d1d5db', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: actif ? 24 : 3, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </div>
  );
}

const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 };

interface Brouillon { code: string; nom: string; description: string; emoji: string; prix_ht: string; actif: boolean; ordre: string; templates: string[]; }
const videBase: Brouillon = { code: '', nom: '', description: '', emoji: '🧩', prix_ht: '0', actif: true, ordre: '0', templates: [] };

const TPL_MV = 'multivendeur-premium';

// portee « mv »     : add-ons du template Multi-vendeur (système séparé, géré avec ⭐ Forfaits & Plans MV)
// portee « autres » : add-ons de tous les autres templates (ensemble)
export default function AdminFonctionnalitesStudio({ portee = 'autres' }: { portee?: 'mv' | 'autres' }) {
  const [liste, setListe] = useState<Addon[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState<{ edition: boolean; d: Brouillon } | null>(null);
  const [erreurModal, setErreurModal] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [aSupprimer, setASupprimer] = useState<Addon | null>(null);

  const visibles = liste.filter(a => (portee === 'mv' ? a.templates.includes(TPL_MV) : !a.templates.includes(TPL_MV)));
  const vide: Brouillon = { ...videBase, templates: portee === 'mv' ? [TPL_MV] : [] };
  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/addons`, { headers: entetes(), credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement.');
      setListe(j.addons || []);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  async function sauver() {
    if (!modal) return;
    const d = modal.d;
    setEnCours(true); setErreurModal('');
    try {
      const corps = { code: d.code, nom: d.nom, description: d.description, emoji: d.emoji, prix_ht: parseFloat(d.prix_ht), actif: d.actif, ordre: parseInt(d.ordre, 10) || 0, templates: d.templates };
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/addons${modal.edition ? '/' + d.code : ''}`, {
        method: modal.edition ? 'PUT' : 'POST', headers: entetes(), credentials: 'include', body: JSON.stringify(corps),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Enregistrement impossible.');
      setModal(null); flash(modal.edition ? '✅ Add-on modifié' : '✅ Add-on créé'); charger();
    } catch (e: any) { setErreurModal(e.message); }
    finally { setEnCours(false); }
  }

  async function basculer(a: Addon, actif: boolean) {
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/addons/${a.code}`, {
        method: 'PUT', headers: entetes(), credentials: 'include',
        body: JSON.stringify({ nom: a.nom, description: a.description, emoji: a.emoji, prix_ht: a.prix_ht, actif, ordre: a.ordre, templates: a.templates }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setListe(p => p.map(x => (x.code === a.code ? { ...x, actif } : x)));
      flash(actif ? `✅ « ${a.nom} » réactivé pour tous` : `🔴 « ${a.nom} » suspendu pour tous`, actif);
    } catch (e: any) { flash('❌ ' + (e.message || 'Erreur'), false); }
  }

  async function supprimer() {
    if (!aSupprimer) return;
    setEnCours(true);
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/addons/${aSupprimer.code}`, { method: 'DELETE', headers: entetes(), credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setListe(p => p.filter(x => x.code !== aSupprimer.code)); setASupprimer(null); flash('🗑️ Add-on supprimé');
    } catch (e: any) { setASupprimer(null); flash('❌ ' + e.message, false); }
    finally { setEnCours(false); }
  }

  const nomTemplate = (id: string) => TEMPLATES_CONNUS.find(t => t.id === id)?.nom || id;
  const majD = (patch: Partial<Brouillon>) => setModal(m => (m ? { ...m, d: { ...m.d, ...patch } } : m));
  const basculeTemplate = (id: string) => majD({ templates: modal!.d.templates.includes(id) ? modal!.d.templates.filter(x => x !== id) : [...modal!.d.templates, id] });

  return (
    <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? T.success : T.danger, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,.2)', maxWidth: 420 }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: T.text, textTransform: 'uppercase', letterSpacing: '.5px' }}>🧩 Fonctionnalités & add-ons {portee === 'mv' ? 'MV' : '(autres templates)'}</h1>
          <p style={{ fontSize: 13, color: T.textLight, margin: 0 }}>{portee === 'mv' ? "Add-ons du template Multi-vendeur Premium : prix et interrupteur global. Chaque forfait MV choisit ce qu'il inclut dans « Gérer les forfaits MV »." : "Add-ons de tous les autres templates (système séparé du multi-vendeur) : prix et interrupteur global."}</p>
        </div>
        <button onClick={() => { setErreurModal(''); setModal({ edition: false, d: { ...vide } }); }}
          style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>➕ Nouvel add-on</button>
      </div>

      <div style={{ background: T.accentLight, border: `1px solid ${T.accent}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: T.accent, lineHeight: 1.6 }}>
        <strong>Règle :</strong> un add-on est actif pour un gestionnaire si l'interrupteur est ouvert <em>et</em> (son forfait l'inclut <em>ou</em> il l'a acheté). Un add-on déjà inclus dans le forfait n'est jamais offert à l'achat.
      </div>

      {erreur && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: T.danger, padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur} <button onClick={charger} style={{ marginLeft: 8, cursor: 'pointer' }}>Réessayer</button></div>}

      {chargement ? <p style={{ textAlign: 'center', color: T.textLight, padding: 60 }}>⏳ Chargement…</p> : visibles.length === 0 ? (
        <p style={{ textAlign: 'center', color: T.textLight, padding: 60 }}>Aucun add-on. Créez le premier.</p>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {visibles.map((a, i) => (
            <div key={a.code} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px 150px auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderBottom: i < liste.length - 1 ? `1px solid ${T.border}` : 'none', opacity: a.actif ? 1 : 0.6, background: a.actif ? '#fff' : '#fafafa' }}>
              <div style={{ fontSize: 24, textAlign: 'center' }}>{a.emoji}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{a.nom}</span>
                  {!a.actif && <span style={{ fontSize: 10, fontWeight: 800, background: '#fee2e2', color: T.danger, borderRadius: 10, padding: '2px 8px' }}>🔴 SUSPENDU</span>}
                </div>
                <code style={{ fontSize: 11, color: T.textLight, background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>{a.code}</code>
                <div style={{ fontSize: 11, color: T.textLight, marginTop: 4 }}>
                  {a.templates.length === 0 ? '🌐 Autres templates' : a.templates.map(nomTemplate).join(', ')}
                  {' · '}
                  {a.forfaits_inclus.length ? `Inclus : ${a.forfaits_inclus.join(', ')}` : 'Inclus dans aucun forfait'}
                  {' · '}
                  {a.nb_achats} achat{a.nb_achats > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: a.prix_ht === 0 ? T.success : T.text }}>{a.prix_ht === 0 ? 'Gratuit' : fmt(a.prix_ht) + '/mois'}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: 'uppercase', marginBottom: 4 }}>Interrupteur global</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Interrupteur actif={a.actif} onChange={v => basculer(a, v)} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.actif ? T.success : T.danger }}>{a.actif ? 'Actif' : 'Suspendu'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setErreurModal(''); setModal({ edition: true, d: { code: a.code, nom: a.nom, description: a.description, emoji: a.emoji, prix_ht: String(a.prix_ht), actif: a.actif, ordre: String(a.ordre), templates: [...a.templates] } }); }}
                  style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer' }} title="Modifier">✏️</button>
                <button onClick={() => setASupprimer(a)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 6, background: '#fff5f5', color: T.danger, cursor: 'pointer' }} title="Supprimer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: `linear-gradient(135deg, ${T.accent}, #1a4a7a)`, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{modal.edition ? `✏️ Modifier — ${modal.d.nom}` : '➕ Nouvel add-on'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {erreurModal && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.danger, fontWeight: 600 }}>❌ {erreurModal}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={etiquette}>Nom *</label>
                  <input value={modal.d.nom} onChange={e => majD({ nom: e.target.value })} placeholder="ex: Avis clients" style={champ} />
                </div>
                <div>
                  <label style={etiquette}>Code technique *</label>
                  <input value={modal.d.code} disabled={modal.edition} onChange={e => majD({ code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="ex: avis_clients" style={{ ...champ, fontFamily: 'monospace', background: modal.edition ? '#f3f4f6' : '#fff' }} />
                  {!modal.edition && <p style={{ fontSize: 10, color: T.textLight, margin: '3px 0 0' }}>Permanent : lettres minuscules, chiffres et _.</p>}
                </div>
              </div>
              <div>
                <label style={etiquette}>Description (vue par le gestionnaire)</label>
                <textarea rows={3} value={modal.d.description} onChange={e => majD({ description: e.target.value })} style={{ ...champ, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={etiquette}>Prix HT par mois ($)</label>
                  <input type="number" min="0" step="0.01" value={modal.d.prix_ht} onChange={e => majD({ prix_ht: e.target.value })} style={champ} />
                </div>
                <div>
                  <label style={etiquette}>Ordre d'affichage</label>
                  <input type="number" value={modal.d.ordre} onChange={e => majD({ ordre: e.target.value })} style={champ} />
                </div>
              </div>
              <div>
                <label style={etiquette}>Icône</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => majD({ emoji: e })} style={{ fontSize: 18, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', border: `2px solid ${modal.d.emoji === e ? T.accent : T.border}`, background: modal.d.emoji === e ? T.accentLight : '#fff' }}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Actif (interrupteur global)</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textLight }}>Fermé : l'add-on disparaît pour tout le monde, même si le forfait l'inclut.</p>
                </div>
                <Interrupteur actif={modal.d.actif} onChange={v => majD({ actif: v })} />
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={sauver} disabled={enCours || !modal.d.nom.trim() || (!modal.edition && modal.d.code.length < 2)}
                style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: enCours ? '#93c5fd' : T.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: enCours ? 'not-allowed' : 'pointer' }}>
                {enCours ? '⏳ …' : modal.edition ? '💾 Enregistrer' : '✅ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {aSupprimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: '#fee2e2', borderBottom: `2px solid ${T.danger}` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#991b1b' }}>🗑️ Supprimer « {aSupprimer.nom} » ?</h3>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 8px' }}>Suppression définitive. Si des gestionnaires l'ont acheté ou si un forfait l'inclut, le serveur refusera : utilisez plutôt l'interrupteur global.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => setASupprimer(null)} style={{ padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={supprimer} disabled={enCours} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: T.danger, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{enCours ? '⏳ …' : '🗑️ Supprimer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}