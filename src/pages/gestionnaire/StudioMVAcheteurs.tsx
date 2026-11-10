// CHEMIN : src/pages/gestionnaire/StudioMVAcheteurs.tsx
// e-Vend Studio — Multi-vendeur : « Mes acheteurs ». Le gestionnaire voit les acheteurs inscrits sur sa marketplace,
// leurs commandes, et peut suspendre / réactiver un compte.
// API : /api/studio/mv/:gid/acheteurs (GET ?q ?statut ?page) · /acheteurs/:id (GET) · /acheteurs/:id/suspendre (POST) · /acheteurs/:id/reactiver (POST)

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Acheteur { id: number; prenom: string | null; nom: string | null; email: string; telephone: string | null; created_at: string; suspendu: boolean; suspendu_raison: string | null; nb_commandes: number; total_depense: number; derniere: string | null }
interface Liste { acheteurs: Acheteur[]; total: number; page: number; pages: number; stats: { total: number; suspendus: number; nouveaux: number } }
interface Fiche extends Omit<Acheteur, 'nb_commandes' | 'total_depense' | 'derniere'> {
  infolettre?: boolean; suspendu_le?: string | null;
  commandes: { id: number; numero_commande: string; statut: string; statut_paiement: string; total: number | string; date_commande: string; boutique: string | null }[];
  boutiques: { boutique: string | null; nb: number; total: number }[];
}

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const quand = (d: string | null) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
const $$ = (n: number | string) => `${Number(n).toFixed(2)} $`;
const nomComplet = (a: { prenom: string | null; nom: string | null; email: string }) => `${a.prenom || ''} ${a.nom || ''}`.trim() || a.email;
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const bouton = (couleur: string, plein = true): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: plein ? 'none' : `1px solid ${couleur}`, background: plein ? couleur : '#fff', color: plein ? '#fff' : couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
const STATUT_CMD: Record<string, string> = { en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée', remboursee: 'Remboursée' };

const StudioMVAcheteurs: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}/acheteurs`;
  const [data, setData] = useState<Liste | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [susp, setSusp] = useState<{ id: number; nom: string } | null>(null);
  const [raison, setRaison] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setQEff(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (statut) p.set('statut', statut);
      if (qEff) p.set('q', qEff);
      const r = await fetch(`${base}?${p}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, statut, qEff]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500); };

  const ouvrir = async (id: number) => {
    setErreur('');
    try {
      const r = await fetch(`${base}/${id}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      setFiche(j);
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
  };

  const agir = async (id: number, action: 'suspendre' | 'reactiver', corps?: object) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}/${id}/${action}`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify(corps || {}) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash(action === 'suspendre' ? 'Compte suspendu.' : 'Compte réactivé.');
      setSusp(null); setRaison(''); setFiche(null); await charger();
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const st = data?.stats;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, color: C.text }}>
      <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>👥 Mes acheteurs</h1>
      <p style={{ color: C.textLight, fontSize: 13, margin: '0 0 16px' }}>Les acheteurs inscrits sur votre marketplace. Un compte suspendu ne peut plus se connecter ni commander.</p>

      {message && <div style={{ background: '#ecfdf5', border: `1px solid ${C.green}`, color: '#065f46', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>✅ {message}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: `1px solid ${C.red}`, color: '#991b1b', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>❌ {erreur}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        {[['👥', 'Acheteurs', st?.total ?? 0], ['🆕', 'Nouveaux (30 jours)', st?.nouveaux ?? 0], ['⛔', 'Suspendus', st?.suspendus ?? 0]].map(([e, l, v]) => (
          <div key={String(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: C.textLight }}>{e} {l}</div><div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input style={{ ...champ, flex: 1, minWidth: 220 }} placeholder="🔎 Rechercher un nom ou un courriel" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={champ} value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}>
          <option value="">Tous les comptes</option><option value="actif">Actifs</option><option value="suspendu">Suspendus</option>
        </select>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {chargement && !data && <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>Chargement…</div>}
        {data && data.acheteurs.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>Aucun acheteur trouvé.</div>}
        {data && data.acheteurs.map((a) => (
          <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, opacity: a.suspendu ? 0.75 : 1 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800 }}>{nomComplet(a)} {a.suspendu && <span style={{ fontSize: 11, background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: 10, marginLeft: 6 }}>⛔ Suspendu</span>}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{a.email} · inscrit le {quand(a.created_at)}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 110 }}>
              <div style={{ fontWeight: 800 }}>{$$(a.total_depense)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{a.nb_commandes} commande{a.nb_commandes > 1 ? 's' : ''}{a.derniere ? ` · ${quand(a.derniere)}` : ''}</div>
            </div>
            <button style={bouton(C.accent, false)} onClick={() => ouvrir(a.id)}>Voir</button>
          </div>
        ))}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
          <button style={bouton(C.accent, false)} disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          <span style={{ fontSize: 13, color: C.textLight }}>Page {data.page} / {data.pages}</span>
          <button style={bouton(C.accent, false)} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}

      {fiche && (
        <div onClick={() => setFiche(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 640 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{nomComplet(fiche)} {fiche.suspendu && <span style={{ fontSize: 12, background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: 10 }}>⛔ Suspendu</span>}</h2>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>{fiche.email}{fiche.telephone ? ` · ${fiche.telephone}` : ''}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>Inscrit le {quand(fiche.created_at)}{fiche.infolettre ? ' · abonné à l\'infolettre' : ''}</div>
              </div>
              <button style={bouton(C.textLight, false)} onClick={() => setFiche(null)}>✕</button>
            </div>
            {fiche.suspendu && <div style={{ background: '#fef2f2', border: `1px solid ${C.red}`, color: '#991b1b', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginTop: 12 }}>Suspendu le {quand(fiche.suspendu_le || null)}{fiche.suspendu_raison ? ` — ${fiche.suspendu_raison}` : ''}</div>}

            <h4 style={{ margin: '18px 0 8px' }}>🏪 Où il achète</h4>
            {fiche.boutiques.length === 0 && <div style={{ fontSize: 13, color: C.textLight }}>Aucun achat payé pour l'instant.</div>}
            {fiche.boutiques.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span>{b.boutique || 'Boutique supprimée'}</span><span style={{ color: C.textLight }}>{b.nb} commande{b.nb > 1 ? 's' : ''} · <b style={{ color: C.text }}>{$$(b.total)}</b></span>
              </div>
            ))}

            <h4 style={{ margin: '18px 0 8px' }}>🛒 Dernières commandes</h4>
            {fiche.commandes.length === 0 && <div style={{ fontSize: 13, color: C.textLight }}>Aucune commande.</div>}
            {fiche.commandes.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                <span><b>{c.numero_commande}</b> · {c.boutique || '—'}</span>
                <span style={{ color: C.textLight }}>{quand(c.date_commande)} · {STATUT_CMD[c.statut] || c.statut}{c.statut_paiement !== 'paye' ? ' (non payée)' : ''} · <b style={{ color: C.text }}>{$$(c.total)}</b></span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              {fiche.suspendu
                ? <button style={bouton(C.green)} disabled={occupe} onClick={() => agir(fiche.id, 'reactiver')}>✅ Réactiver le compte</button>
                : <button style={bouton(C.red)} onClick={() => { setSusp({ id: fiche.id, nom: nomComplet(fiche) }); setRaison(''); }}>⛔ Suspendre le compte</button>}
            </div>
          </div>
        </div>
      )}

      {susp && (
        <div onClick={() => setSusp(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 26, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}>
            <div style={{ fontSize: 40, textAlign: 'center' }}>⚠️</div>
            <h3 style={{ margin: '6px 0 8px', fontSize: 19, textAlign: 'center' }}>Suspendre {susp.nom} ?</h3>
            <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.6, margin: '0 0 12px', textAlign: 'center' }}>Il ne pourra plus se connecter ni commander. Ses commandes passées ne changent pas. Vous pouvez le réactiver quand vous voulez.</p>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Raison (pour vous, facultatif)</label>
            <textarea style={{ ...champ, width: '100%', boxSizing: 'border-box', minHeight: 60, marginTop: 4 }} maxLength={300} value={raison} onChange={(e) => setRaison(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setSusp(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', color: C.textLight, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button disabled={occupe} onClick={() => agir(susp.id, 'suspendre', { raison })} style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Suspendre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVAcheteurs;