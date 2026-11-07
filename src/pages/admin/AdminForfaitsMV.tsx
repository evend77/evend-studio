// CHEMIN : src/pages/admin/AdminForfaitsMV.tsx
// e-Vend Studio — ⭐ Forfaits & Plans MV (template Multi-vendeur Premium seulement)
// Onglet 1 : les forfaits (prix, vendeurs max, stockage, add-ons inclus).
// Onglet 2 : qui a quel forfait et quels add-ons (lecture seule — la facturation Stripe viendra plus tard).
// Studio ne prend jamais de commission : seul le forfait est facturé.

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';

interface PlanMV {
  id: number; plan_id: string; nom: string; prix: number; vendeurs_max: number | null; stockage_go: number | null;
  actif: boolean; ordre: number; addons_inclus: string[]; tous_addons: boolean; nb_gestionnaires: number;
}
interface AddonCat { code: string; nom: string; emoji: string; prix_ht: number; actif: boolean; templates: string[]; }
interface GestMV {
  id: number; nom: string; email: string; nom_boutique: string; statut: string;
  forfait: { plan_id: string; nom: string; par_defaut: boolean } | null;
  addons: { code: string; nom: string; emoji: string; inclus: boolean; prix_ht: number }[]; total_ht: number;
}

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8', accent: '#2d6a9f', accentLight: '#e8f2fb',
  text: '#1a2332', textLight: '#6b7280', success: '#16a34a', danger: '#dc2626', warning: '#d97706',
};
const TEMPLATE_MV = 'multivendeur-premium';

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 };

function Interrupteur({ actif, onChange }: { actif: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!actif)} role="switch" aria-checked={actif}
      style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: actif ? T.success : '#d1d5db', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: actif ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </div>
  );
}

interface Brouillon {
  id: number | null; plan_id: string; nom: string; prix: string; vendeurs_max: string; stockage_go: string;
  actif: boolean; ordre: string; addons_inclus: string[]; tous_addons: boolean;
}
const vide: Brouillon = { id: null, plan_id: 'mv-', nom: '', prix: '', vendeurs_max: '', stockage_go: '', actif: true, ordre: '0', addons_inclus: [], tous_addons: false };

export default function AdminForfaitsMV({ ongletInitial = 'forfaits' }: { ongletInitial?: 'forfaits' | 'gestionnaires' }) {
  const [onglet, setOnglet] = useState<'forfaits' | 'gestionnaires'>(ongletInitial);
  const [plans, setPlans] = useState<PlanMV[]>([]);
  const [catalogue, setCatalogue] = useState<AddonCat[]>([]);
  const [gest, setGest] = useState<GestMV[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState<Brouillon | null>(null);
  const [erreurModal, setErreurModal] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [aSupprimer, setASupprimer] = useState<PlanMV | null>(null);
  const [recherche, setRecherche] = useState('');

  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const [rp, ra, rg] = await Promise.all([
        fetch(`${API_BASE}/studio-forfaits/admin/mv/plans`, { headers: entetes(), credentials: 'include' }),
        fetch(`${API_BASE}/studio-forfaits/admin/addons?avec_evend=1`, { headers: entetes(), credentials: 'include' }),
        fetch(`${API_BASE}/studio-forfaits/admin/mv/gestionnaires`, { headers: entetes(), credentials: 'include' }),
      ]);
      const [jp, ja, jg] = await Promise.all([rp.json(), ra.json(), rg.json()]);
      if (!rp.ok) throw new Error(jp.error || 'Erreur de chargement des forfaits.');
      setPlans(jp.plans || []);
      setCatalogue((ja.addons || []).filter((a: AddonCat) => a.templates.length === 0 || a.templates.includes(TEMPLATE_MV)));
      setGest(jg.gestionnaires || []);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  async function sauver() {
    if (!modal) return;
    setEnCours(true); setErreurModal('');
    const edition = modal.id !== null;
    try {
      const corps = {
        plan_id: modal.plan_id, nom: modal.nom, prix: parseFloat(modal.prix), vendeurs_max: parseInt(modal.vendeurs_max, 10),
        stockage_go: parseFloat(modal.stockage_go), actif: modal.actif, ordre: parseInt(modal.ordre, 10) || 0,
        addons_inclus: modal.tous_addons ? [] : modal.addons_inclus, tous_addons: modal.tous_addons,
      };
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/mv/plans${edition ? '/' + modal.id : ''}`, {
        method: edition ? 'PUT' : 'POST', headers: entetes(), credentials: 'include', body: JSON.stringify(corps),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Enregistrement impossible.');
      setModal(null); flash(edition ? '✅ Forfait modifié' : '✅ Forfait créé'); charger();
    } catch (e: any) { setErreurModal(e.message); }
    finally { setEnCours(false); }
  }

  async function basculerActif(p: PlanMV) {
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/mv/plans/${p.id}`, {
        method: 'PUT', headers: entetes(), credentials: 'include',
        body: JSON.stringify({ nom: p.nom, prix: p.prix, vendeurs_max: p.vendeurs_max, stockage_go: p.stockage_go, actif: !p.actif, ordre: p.ordre, addons_inclus: p.addons_inclus, tous_addons: p.tous_addons }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPlans(prev => prev.map(x => (x.id === p.id ? { ...x, actif: !p.actif } : x)));
      flash(p.actif ? `⏸️ « ${p.nom} » désactivé (plus offert aux gestionnaires)` : `✅ « ${p.nom} » activé`, !p.actif);
    } catch (e: any) { flash('❌ ' + (e.message || 'Erreur'), false); }
  }

  async function supprimer() {
    if (!aSupprimer) return;
    setEnCours(true);
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/admin/mv/plans/${aSupprimer.id}`, { method: 'DELETE', headers: entetes(), credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPlans(p => p.filter(x => x.id !== aSupprimer.id)); setASupprimer(null); flash('🗑️ Forfait supprimé');
    } catch (e: any) { setASupprimer(null); flash('❌ ' + e.message, false); }
    finally { setEnCours(false); }
  }

  const majM = (patch: Partial<Brouillon>) => setModal(m => (m ? { ...m, ...patch } : m));
  const basculeAddon = (code: string) => modal && majM({ addons_inclus: modal.addons_inclus.includes(code) ? modal.addons_inclus.filter(c => c !== code) : [...modal.addons_inclus, code] });
  const nomAddon = (code: string) => catalogue.find(a => a.code === code);

  const gestFiltres = gest.filter(g => [g.nom_boutique, g.nom, g.email].join(' ').toLowerCase().includes(recherche.toLowerCase()));
  const revenuEstime = gest.reduce((s, g) => s + g.total_ht, 0);

  return (
    <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? T.success : T.danger, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,.2)', maxWidth: 420 }}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: T.text, textTransform: 'uppercase', letterSpacing: '.5px' }}>⭐ Forfaits & Plans MV</h1>
          <p style={{ fontSize: 13, color: T.textLight, margin: 0 }}>Template Multi-vendeur Premium · le forfait gère le nombre de vendeurs, le stockage et les add-ons inclus. Aucune commission sur les ventes.</p>
        </div>
        {onglet === 'forfaits' && (
          <button onClick={() => { setErreurModal(''); setModal({ ...vide, ordre: String((plans.reduce((m, p) => Math.max(m, p.ordre), 0)) + 10) }); }}
            style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>➕ Nouveau forfait</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['forfaits', '🗂️ Forfaits'], ['gestionnaires', '👥 Gestionnaires MV']] as const).map(([id, lbl]) => (
          <button key={id} onClick={() => setOnglet(id)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `2px solid ${onglet === id ? T.accent : T.border}`, background: onglet === id ? T.accentLight : '#fff', color: onglet === id ? T.accent : T.textLight }}>{lbl}</button>
        ))}
      </div>

      {erreur && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: T.danger, padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur} <button onClick={charger} style={{ marginLeft: 8, cursor: 'pointer' }}>Réessayer</button></div>}

      {chargement ? <p style={{ textAlign: 'center', color: T.textLight, padding: 60 }}>⏳ Chargement…</p> : onglet === 'forfaits' ? (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.accent}` }}>
                  {['Forfait', 'Prix HT/mois', 'Vendeurs max', 'Stockage', 'Add-ons inclus', 'Gestionnaires', 'Statut', ''].map(h => (
                    <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 ? '#fafafa' : '#fff', opacity: p.actif ? 1 : 0.6 }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 800, color: T.text }}>{p.nom}{i === 0 && p.actif && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#fef9c3', color: '#92400e', border: '1px solid #d97706', borderRadius: 10, padding: '1px 7px' }}>par défaut</span>}</div>
                      <code style={{ fontSize: 10, color: T.textLight }}>{p.plan_id}</code>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{fmt(p.prix)}</td>
                    <td style={{ padding: '12px 10px' }}>{p.vendeurs_max ?? '—'}</td>
                    <td style={{ padding: '12px 10px' }}>{p.stockage_go != null ? `${p.stockage_go} Go` : '—'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      {p.tous_addons ? <span style={{ fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', borderRadius: 10, padding: '2px 9px' }}>✨ Tous (actuels et futurs)</span>
                        : p.addons_inclus.length === 0 ? <span style={{ fontSize: 11, color: '#aaa' }}>Aucun</span>
                        : <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{p.addons_inclus.map(c => <span key={c} style={{ fontSize: 11, fontWeight: 700, background: T.accentLight, color: T.accent, borderRadius: 10, padding: '2px 9px' }}>{nomAddon(c)?.emoji || '🧩'} {nomAddon(c)?.nom || c}</span>)}</div>}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{p.nb_gestionnaires}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Interrupteur actif={p.actif} onChange={() => basculerActif(p)} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.actif ? T.success : T.textLight }}>{p.actif ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setErreurModal(''); setModal({ id: p.id, plan_id: p.plan_id, nom: p.nom, prix: String(p.prix), vendeurs_max: String(p.vendeurs_max ?? ''), stockage_go: String(p.stockage_go ?? ''), actif: p.actif, ordre: String(p.ordre), addons_inclus: [...p.addons_inclus], tous_addons: p.tous_addons }); }}
                        style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', marginRight: 6 }} title="Modifier">✏️</button>
                      <button onClick={() => setASupprimer(p)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 6, background: '#fff5f5', color: T.danger, cursor: 'pointer' }} title="Supprimer">🗑️</button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.textLight }}>Aucun forfait.</td></tr>}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: T.textLight, marginTop: 12, lineHeight: 1.6 }}>
            Le forfait « par défaut » est le premier de la liste (ordre le plus petit) : c'est celui d'un gestionnaire qui n'en a pas encore choisi.
            Un forfait utilisé par des gestionnaires ne peut pas être supprimé : désactivez-le (il n'est alors plus offert, mais ceux qui l'ont le gardent).
            Les add-ons se créent dans « Fonctionnalités & add-ons ».
          </p>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
            {[{ i: '🏪', l: 'Gestionnaires MV', v: String(gest.length) }, { i: '🧩', l: 'Avec un add-on payant', v: String(gest.filter(g => g.addons.some(a => !a.inclus)).length) }, { i: '💰', l: 'Total mensuel estimé (HT)', v: fmt(revenuEstime) }].map(k => (
              <div key={k.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 20 }}>{k.i}</div><div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{k.v}</div><div style={{ fontSize: 11, color: T.textLight }}>{k.l}</div>
              </div>
            ))}
          </div>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher boutique, nom, courriel…" style={{ ...champ, maxWidth: 360, marginBottom: 12 }} />
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.accent}` }}>
                  {['ID', 'Boutique', 'Forfait', 'Add-ons actifs', 'Total HT/mois'].map(h => <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {gestFiltres.map((g, i) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700, color: T.accent }}>#{g.id}</td>
                    <td style={{ padding: '10px' }}><div style={{ fontWeight: 700, color: T.text }}>{g.nom_boutique || '—'}</div><div style={{ fontSize: 11, color: T.textLight }}>{g.nom} · {g.email}</div></td>
                    <td style={{ padding: '10px' }}>{g.forfait ? <>{g.forfait.nom}{g.forfait.par_defaut && <span style={{ marginLeft: 6, fontSize: 10, color: T.textLight }}>(par défaut)</span>}</> : '—'}</td>
                    <td style={{ padding: '10px' }}>{g.addons.length === 0 ? <span style={{ fontSize: 11, color: '#aaa' }}>Aucun</span> : g.addons.map(a => <span key={a.code} title={a.inclus ? 'Inclus dans le forfait' : fmt(a.prix_ht) + '/mois'} style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, margin: '0 4px 4px 0', borderRadius: 10, padding: '2px 9px', background: a.inclus ? '#dcfce7' : T.accentLight, color: a.inclus ? T.success : T.accent }}>{a.emoji} {a.nom}{a.inclus ? ' (inclus)' : ` · ${fmt(a.prix_ht)}`}</span>)}</td>
                    <td style={{ padding: '10px', fontWeight: 800, color: T.text }}>{fmt(g.total_ht)}</td>
                  </tr>
                ))}
                {gestFiltres.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.textLight }}>Aucun gestionnaire.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal création / édition d'un forfait */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: `linear-gradient(135deg, ${T.accent}, #1a4a7a)`, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{modal.id !== null ? `✏️ Modifier — ${modal.nom}` : '➕ Nouveau forfait MV'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {erreurModal && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.danger, fontWeight: 600 }}>❌ {erreurModal}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={etiquette}>Nom *</label><input value={modal.nom} onChange={e => majM({ nom: e.target.value })} placeholder="ex: Croissance" style={champ} /></div>
                <div>
                  <label style={etiquette}>Identifiant *</label>
                  <input value={modal.plan_id} disabled={modal.id !== null} onChange={e => majM({ plan_id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} style={{ ...champ, fontFamily: 'monospace', background: modal.id !== null ? '#f3f4f6' : '#fff' }} />
                  {modal.id === null && <p style={{ fontSize: 10, color: T.textLight, margin: '3px 0 0' }}>Doit commencer par « mv- ». Permanent.</p>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={etiquette}>Prix HT / mois ($) *</label><input type="number" min="0" step="0.01" value={modal.prix} onChange={e => majM({ prix: e.target.value })} style={champ} /></div>
                <div><label style={etiquette}>Vendeurs max *</label><input type="number" min="1" value={modal.vendeurs_max} onChange={e => majM({ vendeurs_max: e.target.value })} style={champ} /></div>
                <div><label style={etiquette}>Stockage (Go) *</label><input type="number" min="0" step="0.5" value={modal.stockage_go} onChange={e => majM({ stockage_go: e.target.value })} style={champ} /></div>
              </div>
              <div style={{ maxWidth: 200 }}><label style={etiquette}>Ordre d'affichage</label><input type="number" value={modal.ordre} onChange={e => majM({ ordre: e.target.value })} style={champ} /></div>

              <div>
                <label style={etiquette}>Add-ons inclus dans ce forfait</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${modal.tous_addons ? '#6d28d9' : T.border}`, background: modal.tous_addons ? '#f5f3ff' : '#fff', cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={modal.tous_addons} onChange={e => majM({ tous_addons: e.target.checked })} />
                  <span><strong style={{ fontSize: 13 }}>✨ Tous les add-ons (actuels et futurs)</strong><br /><span style={{ fontSize: 11, color: T.textLight }}>Aucun add-on n'est jamais offert à l'achat avec ce forfait.</span></span>
                </label>
                {!modal.tous_addons && (catalogue.length === 0 ? <p style={{ fontSize: 12, color: T.textLight }}>Aucun add-on disponible.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catalogue.map(a => (
                      <label key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, border: `1px solid ${modal.addons_inclus.includes(a.code) ? T.accent + '66' : T.border}`, background: modal.addons_inclus.includes(a.code) ? T.accentLight : '#fff', cursor: 'pointer', opacity: a.actif ? 1 : 0.6 }}>
                        <input type="checkbox" checked={modal.addons_inclus.includes(a.code)} onChange={() => basculeAddon(a.code)} />
                        <span style={{ fontSize: 18 }}>{a.emoji || '🧩'}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{a.nom}{!a.actif && <em style={{ marginLeft: 6, color: T.danger, fontSize: 11 }}>(suspendu)</em>}</span>
                        <span style={{ fontSize: 12, color: T.textLight }}>{a.prix_ht === 0 ? 'Gratuit' : fmt(a.prix_ht) + '/mois'}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Actif</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textLight }}>Inactif : n'est plus offert aux gestionnaires (ceux qui l'ont le gardent).</p>
                </div>
                <Interrupteur actif={modal.actif} onChange={v => majM({ actif: v })} />
              </div>
              <div style={{ background: T.accentLight, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: T.accent, lineHeight: 1.6 }}>
                Lignes affichées au gestionnaire (fixes, pour tous les forfaits) : ✓ vendeurs actifs · ✓ stockage partagé · ✓ boutiques individuelles · ✓ catalogue unifié · ✓ fiche produit complète · ✓ 0 % de commission.
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={sauver} disabled={enCours || !modal.nom.trim() || modal.prix === '' || modal.vendeurs_max === '' || modal.stockage_go === ''}
                style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: enCours ? '#93c5fd' : T.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: enCours ? 'not-allowed' : 'pointer' }}>
                {enCours ? '⏳ …' : modal.id !== null ? '💾 Enregistrer' : '✅ Créer'}
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
              <p style={{ fontSize: 13, color: T.text, margin: 0 }}>
                {aSupprimer.nb_gestionnaires > 0
                  ? `${aSupprimer.nb_gestionnaires} gestionnaire(s) utilisent ce forfait : le serveur refusera. Désactivez-le plutôt.`
                  : 'Suppression définitive. Aucun gestionnaire n\'utilise ce forfait.'}
              </p>
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