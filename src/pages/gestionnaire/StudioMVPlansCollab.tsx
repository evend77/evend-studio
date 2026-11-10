// CHEMIN : src/pages/gestionnaire/StudioMVPlansCollab.tsx
// e-Vend Studio — Multi-vendeur : add-on « Plans collaborateurs ». Le gestionnaire crée ses plans (limite d'annonces,
// fonctionnalités, commission), règle le système (jours de grâce, action si impayé) et assigne les plans.
// API : /api/studio/mv/:gid/plans  (GET · POST /plans · PUT /plans/:id · DELETE /plans/:id · PUT /config · PUT /collaborateurs/:id · POST /assigner-tous)

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Plan {
  id: number; nom: string; emoji: string; description: string; prix_mensuel: number; limite_annonces: number | null; addons: string[];
  type_commission: 'pourcentage' | 'fixe' | 'mixte'; commission_pct: number; commission_fixe: number; commission_max: number | null;
  visible: boolean; actif: boolean; nb_collaborateurs?: number;
}
interface AddonDispo { code: string; nom: string; emoji: string; actif: boolean }
interface Collab { id: number; nom_boutique: string; nom_responsable: string; email: string; statut: string; plan_id: number | null; plan_statut: string; abonne?: boolean; plan_annule?: boolean; nb_annonces: number }
interface Config { actif: boolean; jours_grace: number; action_impaye: 'bloquer' | 'bloquer_masquer'; taxes_ajoutees: boolean }
interface Reponse { addon_actif: boolean; config?: Config; plans?: Plan[]; addons_disponibles?: AddonDispo[]; collaborateurs?: Collab[]; sans_plan?: number }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
const bouton = (couleur: string, plein = true): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: plein ? 'none' : `1px solid ${couleur}`, background: plein ? couleur : '#fff', color: plein ? '#fff' : couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
const carte: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const $$ = (n: number) => `${Number(n).toFixed(2)} $`;

const VIDE: Plan = { id: 0, nom: '', emoji: '📦', description: '', prix_mensuel: 0, limite_annonces: 20, addons: [], type_commission: 'pourcentage', commission_pct: 10, commission_fixe: 0, commission_max: null, visible: true, actif: true };

const resumeCommission = (p: Plan) => p.type_commission === 'fixe' ? `${$$(p.commission_fixe)} par commande`
  : p.type_commission === 'mixte' ? `${p.commission_pct} % + ${$$(p.commission_fixe)}` : `${p.commission_pct} %`;

const StudioMVPlansCollab: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}/plans`;
  const [data, setData] = useState<Reponse | null>(null);
  const [onglet, setOnglet] = useState<'plans' | 'collabs' | 'config'>('plans');
  const [edition, setEdition] = useState<Plan | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [planTous, setPlanTous] = useState('');

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(base, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j); if (j.config) setCfg(j.config);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const agir = async (chemin: string, methode: string, corps: object | undefined, ok: string): Promise<any> => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${chemin}`, { method: methode, credentials: 'include', headers: entetes(), body: corps ? JSON.stringify(corps) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const err: any = new Error(j.error || 'Erreur'); err.status = r.status; throw err; }
      flash(j.message || ok); await charger(); return j;
    } catch (e: any) { setErreur(e.message || 'Erreur'); return null; }
    finally { setOccupe(false); }
  };

  if (chargement && !data) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;
  if (data && !data.addon_actif) return (
    <div style={{ maxWidth: 640, margin: '40px auto', ...carte, textAlign: 'center' }}>
      <div style={{ fontSize: 44 }}>🧾</div>
      <h2 style={{ margin: '8px 0', color: C.text }}>Plans collaborateurs</h2>
      <p style={{ color: C.textLight, fontSize: 14 }}>Cet add-on n'est pas activé. Activez-le dans « Mon plan & limites » pour créer des plans pour vos collaborateurs.</p>
    </div>
  );
  if (!data || !cfg) return <div style={{ padding: 40, color: C.red }}>{erreur || 'Erreur'}</div>;

  const plans = data.plans || [];
  const collabs = data.collaborateurs || [];
  const dispo = data.addons_disponibles || [];

  const sauverPlan = async () => {
    if (!edition) return;
    const corps = { ...edition, limite_annonces: edition.limite_annonces === null || (edition.limite_annonces as any) === '' ? null : Number(edition.limite_annonces),
      commission_max: edition.commission_max === null || (edition.commission_max as any) === '' ? null : Number(edition.commission_max) };
    const r = edition.id ? await agir(`/plans/${edition.id}`, 'PUT', corps, 'Plan enregistré.') : await agir('/plans', 'POST', corps, 'Plan créé.');
    if (r) setEdition(null);
  };

  const assigner = async (c: Collab, planId: string) => {
    const corps = { plan_id: planId === '' ? null : Number(planId) };
    setOccupe(true); setErreur('');
    try {
      let r = await fetch(`${base}/collaborateurs/${c.id}`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify(corps) });
      let j = await r.json().catch(() => ({}));
      if (r.status === 409 && window.confirm(`${j.error}\n\nForcer quand même ?`)) {
        r = await fetch(`${base}/collaborateurs/${c.id}`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify({ ...corps, forcer: true }) });
        j = await r.json().catch(() => ({}));
      }
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash('Plan assigné.'); await charger();
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const onglets: [typeof onglet, string][] = [['plans', '🧾 Plans'], ['collabs', `👥 Collaborateurs${data.sans_plan ? ` (${data.sans_plan} sans plan)` : ''}`], ['config', '⚙️ Config plans']];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, color: C.text }}>
      <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>🧾 Plans collaborateurs</h1>
      <p style={{ color: C.textLight, fontSize: 13, margin: '0 0 16px' }}>
        Créez des plans (limite d'annonces, fonctionnalités, commission) pour vos collaborateurs. Quand les plans sont utilisés, <b>la commission du plan remplace celle de Config multi → Commission</b>.
      </p>
      {message && <div style={{ background: '#ecfdf5', border: `1px solid ${C.green}`, color: '#065f46', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>✅ {message}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: `1px solid ${C.red}`, color: '#991b1b', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>❌ {erreur}</div>}

      <div style={{ ...carte, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderColor: cfg.actif ? C.green : C.orange }}>
        <b>{cfg.actif ? '🟢 Les plans sont utilisés' : '🟠 Les plans ne sont pas encore utilisés'}</b>
        <span style={{ color: C.textLight, fontSize: 13, flex: 1 }}>{cfg.actif ? 'Vos collaborateurs doivent avoir un plan.' : 'Tant que c\'est désactivé, rien ne change pour vos collaborateurs.'}</span>
        <button disabled={occupe} style={bouton(cfg.actif ? C.red : C.green)} onClick={() => {
          if (!cfg.actif && !window.confirm(`Activer les plans ?\n\nLes collaborateurs existants devront choisir un plan avant de créer ou modifier des annonces (leurs annonces restent en ligne). Vous pouvez leur assigner un plan à l'avance dans l'onglet Collaborateurs.`)) return;
          agir('/config', 'PUT', { actif: !cfg.actif }, cfg.actif ? 'Plans désactivés.' : 'Plans activés.');
        }}>{cfg.actif ? 'Désactiver' : 'Activer les plans'}</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {onglets.map(([id, l]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ ...bouton(C.accent, onglet === id), padding: '9px 16px' }}>{l}</button>
        ))}
      </div>

      {onglet === 'plans' && (
        <>
          <div style={{ textAlign: 'right', marginBottom: 10 }}><button style={bouton(C.green)} onClick={() => setEdition({ ...VIDE })}>➕ Nouveau plan</button></div>
          {plans.length === 0 && <div style={{ ...carte, textAlign: 'center', color: C.textLight }}>Aucun plan pour l'instant. Créez-en un (ex. « Gratuit », « Pro »).</div>}
          {plans.map((p) => (
            <div key={p.id} style={{ ...carte, opacity: p.actif ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 32 }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{p.nom}
                    {!p.visible && <span style={{ marginLeft: 8, fontSize: 11, background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: 10 }}>🔒 Caché</span>}
                    {!p.actif && <span style={{ marginLeft: 8, fontSize: 11, background: '#f1f5f9', color: C.textLight, padding: '2px 8px', borderRadius: 10 }}>Archivé</span>}
                  </div>
                  {p.description && <div style={{ color: C.textLight, fontSize: 13, margin: '2px 0 6px' }}>{p.description}</div>}
                  <div style={{ fontSize: 13 }}>
                    💵 {p.prix_mensuel > 0 ? `${$$(p.prix_mensuel)}/mois` : 'Gratuit'} · 📦 {p.limite_annonces == null ? 'Annonces illimitées' : `${p.limite_annonces} annonces`} · 💼 Commission {resumeCommission(p)}{p.commission_max != null ? ` (max ${$$(p.commission_max)})` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>
                    {p.addons.length ? p.addons.map((c) => { const a = dispo.find((x) => x.code === c); return a ? `${a.emoji} ${a.nom}` : c; }).join(' · ') : 'Aucune fonctionnalité en plus'}
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>👥 {p.nb_collaborateurs || 0} collaborateur{(p.nb_collaborateurs || 0) > 1 ? 's' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={bouton(C.accent, false)} onClick={() => setEdition({ ...p })}>✏️ Modifier</button>
                  <button style={bouton(C.red, false)} disabled={occupe} onClick={() => { if (window.confirm(`Supprimer le plan « ${p.nom} » ?${(p.nb_collaborateurs || 0) > 0 ? '\n\nDes collaborateurs l\'ont : il sera archivé (ils le gardent).' : ''}`)) agir(`/plans/${p.id}`, 'DELETE', undefined, 'Plan supprimé.'); }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {onglet === 'collabs' && (
        <div style={carte}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
            <b style={{ fontSize: 13 }}>Assigner à tous ceux qui n'ont pas de plan :</b>
            <select style={{ ...champ, width: 220 }} value={planTous} onChange={(e) => setPlanTous(e.target.value)}>
              <option value="">— Choisir un plan —</option>
              {plans.filter((p) => p.actif).map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nom}{!p.visible ? ' (caché)' : ''}</option>)}
            </select>
            <button style={bouton(C.accent)} disabled={!planTous || occupe} onClick={() => { if (window.confirm(`Assigner ce plan aux ${data.sans_plan || 0} collaborateur(s) sans plan ?`)) agir('/assigner-tous', 'POST', { plan_id: Number(planTous), seulement_sans_plan: true }, 'Plan assigné.'); }}>Assigner</button>
          </div>
          {collabs.length === 0 && <div style={{ color: C.textLight, textAlign: 'center', padding: 20 }}>Aucun collaborateur.</div>}
          {collabs.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700 }}>{c.nom_boutique || c.nom_responsable}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{c.email} · 📦 {c.nb_annonces} annonce{c.nb_annonces > 1 ? 's' : ''}{c.statut !== 'actif' ? ` · ${c.statut}` : ''}</div>
              </div>
              {!c.plan_id && <span style={{ fontSize: 11, background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: 10 }}>Sans plan</span>}
              {c.abonne && <span style={{ fontSize: 11, background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 10 }}>{c.plan_annule ? '🔄 Abonnement annulé' : '🔄 Abonné'}</span>}
              {c.plan_statut === 'impaye' && <span style={{ fontSize: 11, background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: 10 }}>Impayé</span>}
              <select style={{ ...champ, width: 220 }} disabled={occupe || !!c.abonne} title={c.abonne ? 'Abonnement actif : le collaborateur change de plan lui-même' : ''} value={c.plan_id || ''} onChange={(e) => assigner(c, e.target.value)}>
                <option value="">— Aucun plan —</option>
                {plans.filter((p) => p.actif || p.id === c.plan_id).map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nom}{!p.visible ? ' (caché)' : ''}</option>)}
              </select>

            </div>
          ))}
        </div>
      )}

      {onglet === 'config' && (
        <div style={carte}>
          <h3 style={{ marginTop: 0 }}>⚙️ Config plans</h3>
          <p style={{ fontSize: 13, color: C.textLight, marginTop: 0 }}>Les plans payants sont facturés chaque mois par Stripe, sur votre compte Stripe. Ce que vous décidez quand un collaborateur ne paie pas son plan (abonnement mensuel Stripe).</p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '10px 0 4px' }}>Jours de grâce après un paiement échoué</label>
          <input type="number" min={0} max={90} style={{ ...champ, width: 120 }} value={cfg.jours_grace} onChange={(e) => setCfg({ ...cfg, jours_grace: Number(e.target.value) })} />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '14px 0 4px' }}>Après les jours de grâce</label>
          <select style={{ ...champ, maxWidth: 420 }} value={cfg.action_impaye} onChange={(e) => setCfg({ ...cfg, action_impaye: e.target.value as Config['action_impaye'] })}>
            <option value="bloquer">Bloquer la création et la modification d'annonces</option>
            <option value="bloquer_masquer">Bloquer ET masquer ses annonces de la boutique</option>
          </select>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '14px 0' }}>
            <input type="checkbox" checked={cfg.taxes_ajoutees} onChange={(e) => setCfg({ ...cfg, taxes_ajoutees: e.target.checked })} />
            Ajouter les taxes au prix des plans (TPS/TVQ… selon la province réglée dans Config multi → Commission)
          </label>
          <button style={bouton(C.green)} disabled={occupe} onClick={() => agir('/config', 'PUT', { jours_grace: cfg.jours_grace, action_impaye: cfg.action_impaye, taxes_ajoutees: cfg.taxes_ajoutees }, 'Réglages enregistrés.')}>💾 Enregistrer</button>
        </div>
      )}

      {edition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 20 }} onClick={() => setEdition(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{edition.id ? 'Modifier le plan' : 'Nouveau plan'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Emoji</label><input style={{ ...champ, textAlign: 'center' }} value={edition.emoji} maxLength={4} onChange={(e) => setEdition({ ...edition, emoji: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Nom du plan</label><input style={champ} value={edition.nom} maxLength={80} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} /></div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginTop: 10 }}>Description (visible par le collaborateur)</label>
            <textarea style={{ ...champ, minHeight: 60 }} maxLength={500} value={edition.description} onChange={(e) => setEdition({ ...edition, description: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Prix par mois ($, 0 = gratuit)</label><input type="number" min={0} step="0.01" style={champ} value={edition.prix_mensuel} onChange={(e) => setEdition({ ...edition, prix_mensuel: Number(e.target.value) })} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Limite d'annonces (vide = illimité)</label><input type="number" min={1} style={champ} value={edition.limite_annonces ?? ''} onChange={(e) => setEdition({ ...edition, limite_annonces: e.target.value === '' ? null : Number(e.target.value) })} /></div>
            </div>
            <div style={{ background: C.bg, borderRadius: 10, padding: 12, marginTop: 12 }}>
              <b style={{ fontSize: 13 }}>💼 Commission de ce plan</b>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                <div><label style={{ fontSize: 12 }}>Type</label>
                  <select style={champ} value={edition.type_commission} onChange={(e) => setEdition({ ...edition, type_commission: e.target.value as Plan['type_commission'] })}>
                    <option value="pourcentage">Pourcentage</option><option value="fixe">Montant fixe</option><option value="mixte">% + montant fixe</option>
                  </select></div>
                {edition.type_commission !== 'fixe' && <div><label style={{ fontSize: 12 }}>Pourcentage (%)</label><input type="number" min={0} max={100} step="0.01" style={champ} value={edition.commission_pct} onChange={(e) => setEdition({ ...edition, commission_pct: Number(e.target.value) })} /></div>}
                {edition.type_commission !== 'pourcentage' && <div><label style={{ fontSize: 12 }}>Montant fixe ($)</label><input type="number" min={0} step="0.01" style={champ} value={edition.commission_fixe} onChange={(e) => setEdition({ ...edition, commission_fixe: Number(e.target.value) })} /></div>}
              </div>
              <label style={{ fontSize: 12, display: 'block', marginTop: 8 }}>Commission maximum par commande ($, vide = aucun plafond)</label>
              <input type="number" min={0} step="0.01" style={{ ...champ, maxWidth: 200 }} value={edition.commission_max ?? ''} onChange={(e) => setEdition({ ...edition, commission_max: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
            <div style={{ marginTop: 12 }}>
              <b style={{ fontSize: 13 }}>🧩 Fonctionnalités incluses</b>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 6, marginTop: 8 }}>
                {dispo.map((a) => (
                  <label key={a.code} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, opacity: a.actif ? 1 : 0.5 }} title={a.actif ? '' : "Cet add-on n'est pas activé dans votre boutique"}>
                    <input type="checkbox" disabled={!a.actif} checked={edition.addons.includes(a.code)} onChange={(e) => setEdition({ ...edition, addons: e.target.checked ? [...edition.addons, a.code] : edition.addons.filter((x) => x !== a.code) })} />
                    {a.emoji} {a.nom}{!a.actif ? ' (non activé)' : ''}
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textLight, marginTop: 6 }}>Un add-on doit être activé dans votre boutique ET inclus dans le plan pour que le collaborateur l'utilise.</div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 12 }}>
              <input type="checkbox" checked={edition.visible} onChange={(e) => setEdition({ ...edition, visible: e.target.checked })} />
              Visible par les collaborateurs (décochez pour un plan caché, offert seulement par vous)
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={bouton(C.textLight, false)} onClick={() => setEdition(null)}>Annuler</button>
              <button style={bouton(C.green)} disabled={occupe} onClick={sauverPlan}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVPlansCollab;