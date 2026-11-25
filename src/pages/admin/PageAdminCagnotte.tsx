// src/pages/admin/PageAdminCagnotte.tsx
// e-Vend Studio — Dashboard admin : tarifs des campagnes de cagnotte, taxes, remboursement et suivi des campagnes.
// Aucun pourcentage ni prix n'est écrit dans le code : tout se règle ici (API : /api/admin/cagnotte).

import { useState, useEffect, useMemo } from 'react';

const API = '/api/admin/cagnotte';

interface Palier { id: string; nom: string; objectif_max: number | null; prix: number; }
interface Taxe { tps: number; tvq: number; tvh: number; label: string; }
interface Reglages {
  paliers: Palier[];
  taxes: Record<string, Taxe>;
  numeros_taxes: { tps?: string; tvq?: string };
  duree_max_jours: number;
  remboursement_actif: boolean;
  remboursement_pct: number;
  remboursement_auto: boolean;
  don_min: number;
  don_max: number;
  devise: string;
  provinces?: string[];
}
interface Campagne {
  id: number; gestionnaire_email: string | null; slug: string | null; palier_nom: string | null; objectif: string | null;
  prix: string; total: string; statut: string; publiee_le: string | null; fin_le: string | null; raison_fin: string | null;
  nb_dons: number; total_dons: string; remb_statut: string; remb_montant: string | null; remb_erreur: string | null; anomalie: string | null; created_at: string;
}

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const argent = (n: number | string | null) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(2)} $`);
const dateCourte = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const nombre = (v: string): number => (v === '' ? NaN : Number(v.replace(',', '.')));

const STATUTS: Record<string, { txt: string; couleur: string }> = {
  en_attente_paiement: { txt: 'Paiement en attente', couleur: '#fbbf24' },
  publiee: { txt: 'Ouverte', couleur: '#4ade80' },
  terminee: { txt: 'Terminée', couleur: '#9ca3af' },
  annulee: { txt: 'Annulée', couleur: '#f87171' },
};
const REMB: Record<string, string> = { aucun: '', a_faire: 'À rembourser', en_cours: 'En cours…', fait: 'Remboursé', echec: 'Échec' };

export default function PageAdminCagnotte() {
  const [onglet, setOnglet] = useState<'tarifs' | 'campagnes'>('tarifs');
  const [rg, setRg] = useState<Reglages | null>(null);
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [totaux, setTotaux] = useState<{ encaisse: string; rembourse: string; ouvertes: number } | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');
  const [sauve, setSauve] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [confirmer, setConfirmer] = useState<{ id: number; action: 'rembourser' | 'fermer' } | null>(null);
  const [pctManuel, setPctManuel] = useState('');
  const [enCours, setEnCours] = useState<number | null>(null);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true); setErreur('');
    try {
      const [a, b] = await Promise.all([fetch(`${API}/reglages`, { headers: entetes() }), fetch(`${API}/campagnes`, { headers: entetes() })]);
      if (!a.ok) throw new Error((await a.json().catch(() => ({}))).message || 'Impossible de charger les réglages.');
      setRg(await a.json());
      if (b.ok) { const d = await b.json(); setCampagnes(d.campagnes || []); setTotaux(d.totaux || null); }
      setModifie(false);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }

  function flash(m: string) { setOk(m); setTimeout(() => setOk(''), 3500); }
  function maj(p: Partial<Reglages>) { setRg(r => (r ? { ...r, ...p } : r)); setModifie(true); }
  function majPalier(i: number, p: Partial<Palier>) { if (!rg) return; maj({ paliers: rg.paliers.map((x, j) => (j === i ? { ...x, ...p } : x)) }); }
  function majTaxe(prov: string, p: Partial<Taxe>) { if (!rg) return; maj({ taxes: { ...rg.taxes, [prov]: { ...(rg.taxes[prov] || { tps: 0, tvq: 0, tvh: 0, label: 'Taxes' }), ...p } } }); }

  async function enregistrer() {
    if (!rg) return;
    setSauve(true); setErreur('');
    try {
      const res = await fetch(`${API}/reglages`, { method: 'PUT', headers: entetes(), body: JSON.stringify(rg) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Enregistrement refusé.");
      setRg({ ...d, provinces: rg.provinces }); setModifie(false); flash('Réglages enregistrés — appliqués aux nouvelles campagnes.');
    } catch (e: any) { setErreur(e.message || "Erreur lors de l'enregistrement."); }
    finally { setSauve(false); }
  }

  async function agir(id: number, action: 'rembourser' | 'fermer') {
    setEnCours(id); setErreur('');
    try {
      const corps = action === 'rembourser' && pctManuel.trim() ? { pct: nombre(pctManuel) } : {};
      const res = await fetch(`${API}/campagnes/${id}/${action}`, { method: 'POST', headers: entetes(), body: JSON.stringify(corps) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Action refusée.');
      flash(action === 'rembourser' ? (d.deja ? 'Déjà remboursée.' : `Remboursement de ${argent(d.montant)} effectué.`) : 'Campagne fermée.');
      setConfirmer(null); setPctManuel(''); await charger();
    } catch (e: any) { setErreur(e.message || 'Erreur.'); setConfirmer(null); }
    finally { setEnCours(null); }
  }

  // Exemple de calcul affiché sous les paliers (Québec)
  const exemple = useMemo(() => {
    if (!rg) return [];
    const t = rg.taxes.QC || { tps: 0, tvq: 0, tvh: 0 };
    return rg.paliers.map(p => {
      const taxes = Math.round(p.prix * 100 * (t.tps / 100)) + Math.round(p.prix * 100 * (t.tvq / 100)) + Math.round(p.prix * 100 * (t.tvh / 100));
      return { nom: p.nom, total: (Math.round(p.prix * 100) + taxes) / 100, rembourse: Math.floor((Math.round(p.prix * 100) + taxes) * (rg.remboursement_pct / 100)) / 100 };
    });
  }, [rg]);

  if (chargement) return <div style={s.page}><p style={s.muet}>Chargement…</p></div>;
  if (!rg) return <div style={s.page}><div style={s.erreur}>{erreur || 'Réglages introuvables.'} <button style={s.btnLigne} onClick={charger}>Réessayer</button></div></div>;

  const provinces = rg.provinces || Object.keys(rg.taxes);

  return (
    <div style={s.page}>
      <div style={s.entete}>
        <div>
          <h1 style={s.titre}>💝 Cagnotte — tarifs et campagnes</h1>
          <p style={s.sousTitre}>Prix fixe par campagne, sans commission sur les dons. Le gestionnaire paie la publication sur votre Stripe ; les dons arrivent sur son propre Stripe / PayPal.</p>
        </div>
        {ok && <div style={s.badgeOk}>✓ {ok}</div>}
      </div>

      {erreur && <div style={s.erreur}>{erreur}</div>}

      <div style={s.onglets}>
        <button style={{ ...s.onglet, ...(onglet === 'tarifs' ? s.ongletActif : {}) }} onClick={() => setOnglet('tarifs')}>⚙️ Tarifs et réglages</button>
        <button style={{ ...s.onglet, ...(onglet === 'campagnes' ? s.ongletActif : {}) }} onClick={() => setOnglet('campagnes')}>📋 Campagnes ({campagnes.length})</button>
      </div>

      {onglet === 'tarifs' && (
        <>
          {/* PALIERS */}
          <div style={s.carte}>
            <h2 style={s.h2}>Paliers de prix</h2>
            <p style={s.aide}>Le palier est choisi automatiquement selon l'objectif de la campagne : le plus petit palier dont l'objectif maximum couvre l'objectif demandé. Le dernier palier doit rester « sans limite ».</p>
            {rg.paliers.map((p, i) => (
              <div key={p.id} style={s.ligne}>
                <input style={{ ...s.input, flex: 2 }} value={p.nom} placeholder="Nom du palier" onChange={e => majPalier(i, { nom: e.target.value })} />
                <label style={s.champ}><span style={s.lbl}>Objectif max ($)</span>
                  <input style={s.input} inputMode="decimal" value={p.objectif_max === null ? '' : String(p.objectif_max)} placeholder="sans limite"
                    onChange={e => majPalier(i, { objectif_max: e.target.value === '' ? null : (nombre(e.target.value) as number) })} /></label>
                <label style={s.champ}><span style={s.lbl}>Prix ($)</span>
                  <input style={s.input} inputMode="decimal" value={Number.isNaN(p.prix) ? '' : String(p.prix)} onChange={e => majPalier(i, { prix: nombre(e.target.value) })} /></label>
                <button style={s.btnX} disabled={rg.paliers.length <= 1} title="Supprimer ce palier"
                  onClick={() => maj({ paliers: rg.paliers.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button style={s.btnAjout} disabled={rg.paliers.length >= 8}
              onClick={() => maj({ paliers: [...rg.paliers, { id: `p${Date.now().toString(36).slice(-5)}`, nom: 'Nouveau palier', objectif_max: 1000, prix: 29 }] })}>+ Ajouter un palier</button>
            {exemple.length > 0 && (
              <div style={s.exemple}>
                <p style={s.lbl}>Exemple au Québec (taxes comprises)</p>
                {exemple.map(x => <p key={x.nom} style={s.exLigne}>{x.nom} : <b>{x.total.toFixed(2)} $</b> payés · si 0 don, remboursé <b>{rg.remboursement_actif ? `${x.rembourse.toFixed(2)} $` : '0 $'}</b></p>)}
              </div>
            )}
          </div>

          {/* DURÉE / DONS */}
          <div style={s.carte}>
            <h2 style={s.h2}>Durée et dons</h2>
            <div style={s.grille}>
              <label style={s.champ}><span style={s.lbl}>Durée maximale (jours)</span>
                <input style={s.input} inputMode="numeric" value={String(rg.duree_max_jours)} onChange={e => maj({ duree_max_jours: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
              <label style={s.champ}><span style={s.lbl}>Don minimum ($)</span>
                <input style={s.input} inputMode="decimal" value={Number.isNaN(rg.don_min) ? '' : String(rg.don_min)} onChange={e => maj({ don_min: nombre(e.target.value) })} /></label>
              <label style={s.champ}><span style={s.lbl}>Don maximum ($)</span>
                <input style={s.input} inputMode="decimal" value={Number.isNaN(rg.don_max) ? '' : String(rg.don_max)} onChange={e => maj({ don_max: nombre(e.target.value) })} /></label>
              <label style={s.champ}><span style={s.lbl}>Devise</span>
                <select style={s.input} value={rg.devise} onChange={e => maj({ devise: e.target.value })}><option value="CAD">CAD</option><option value="USD">USD</option></select></label>
            </div>
          </div>

          {/* REMBOURSEMENT */}
          <div style={s.carte}>
            <h2 style={s.h2}>Remboursement si aucun don</h2>
            <p style={s.aide}>Quand une campagne se termine (échéance ou fermeture) avec 0 don, une partie du prix payé — taxes comprises — est remboursée. Le reste couvre vos frais de service.</p>
            <label style={s.coche}><input type="checkbox" checked={rg.remboursement_actif} onChange={e => maj({ remboursement_actif: e.target.checked })} /> Activer le remboursement</label>
            <div style={s.grille}>
              <label style={s.champ}><span style={s.lbl}>Pourcentage remboursé (%)</span>
                <input style={s.input} inputMode="decimal" disabled={!rg.remboursement_actif} value={Number.isNaN(rg.remboursement_pct) ? '' : String(rg.remboursement_pct)} onChange={e => maj({ remboursement_pct: nombre(e.target.value) })} /></label>
            </div>
            <label style={s.coche}><input type="checkbox" disabled={!rg.remboursement_actif} checked={rg.remboursement_auto} onChange={e => maj({ remboursement_auto: e.target.checked })} /> Rembourser automatiquement (sinon : « à rembourser » dans la liste, vous validez à la main)</label>
          </div>

          {/* TAXES */}
          <div style={s.carte}>
            <h2 style={s.h2}>Taxes sur le prix de publication</h2>
            <p style={s.aide}>Taux en % selon la province du gestionnaire (il la choisit avant de payer). Vérifiez ces taux avec votre comptable : ils sont modifiables ici.</p>
            <div style={s.grille}>
              <label style={s.champ}><span style={s.lbl}>N° de TPS (affichage)</span>
                <input style={s.input} value={rg.numeros_taxes.tps || ''} onChange={e => maj({ numeros_taxes: { ...rg.numeros_taxes, tps: e.target.value } })} /></label>
              <label style={s.champ}><span style={s.lbl}>N° de TVQ (affichage)</span>
                <input style={s.input} value={rg.numeros_taxes.tvq || ''} onChange={e => maj({ numeros_taxes: { ...rg.numeros_taxes, tvq: e.target.value } })} /></label>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={s.table}>
                <thead><tr>{['Province', 'TPS %', 'TVQ %', 'TVH %', 'Libellé'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {provinces.map(pv => {
                    const t = rg.taxes[pv] || { tps: 0, tvq: 0, tvh: 0, label: 'Taxes' };
                    return (
                      <tr key={pv}>
                        <td style={{ ...s.td, fontWeight: 700 }}>{pv}</td>
                        {(['tps', 'tvq', 'tvh'] as const).map(k => (
                          <td key={k} style={s.td}><input style={{ ...s.input, width: 78 }} inputMode="decimal" value={Number.isNaN(t[k]) ? '' : String(t[k])} onChange={e => majTaxe(pv, { [k]: nombre(e.target.value) } as Partial<Taxe>)} /></td>
                        ))}
                        <td style={s.td}><input style={{ ...s.input, width: 130 }} value={t.label} onChange={e => majTaxe(pv, { label: e.target.value })} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={s.barreSave}>
            <button style={{ ...s.btnSave, opacity: modifie && !sauve ? 1 : 0.5 }} disabled={!modifie || sauve} onClick={enregistrer}>{sauve ? 'Enregistrement…' : '💾 Enregistrer les réglages'}</button>
            {modifie && <button style={s.btnLigne} onClick={charger}>Annuler les changements</button>}
            <span style={s.muet}>Les campagnes déjà payées gardent leur prix.</span>
          </div>
        </>
      )}

      {onglet === 'campagnes' && (
        <>
          {totaux && (
            <div style={s.stats}>
              <div style={s.stat}><span style={s.lbl}>Encaissé (taxes comprises)</span><b style={s.statV}>{argent(totaux.encaisse)}</b></div>
              <div style={s.stat}><span style={s.lbl}>Remboursé</span><b style={s.statV}>{argent(totaux.rembourse)}</b></div>
              <div style={s.stat}><span style={s.lbl}>Campagnes ouvertes</span><b style={s.statV}>{totaux.ouvertes}</b></div>
            </div>
          )}
          <div style={s.carte}>
            {campagnes.length === 0 ? <p style={s.muet}>Aucune campagne pour l'instant.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead><tr>{['#', 'Gestionnaire', 'Palier', 'Payé', 'Statut', 'Fin', 'Dons', 'Remboursement', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {campagnes.map(c => {
                      const st = STATUTS[c.statut] || { txt: c.statut, couleur: '#9ca3af' };
                      const peutRemb = c.nb_dons === 0 && c.remb_statut !== 'fait' && ['publiee', 'terminee'].includes(c.statut);
                      return (
                        <tr key={c.id}>
                          <td style={s.td}>#{c.id}</td>
                          <td style={s.td}>{c.gestionnaire_email || '—'}{c.slug && <div style={s.petit}>{c.slug}</div>}</td>
                          <td style={s.td}>{c.palier_nom || '—'}<div style={s.petit}>objectif {argent(c.objectif)}</div></td>
                          <td style={s.td}>{argent(c.total)}</td>
                          <td style={s.td}><span style={{ ...s.pastille, color: st.couleur, borderColor: st.couleur }}>{st.txt}</span>{c.anomalie && <div style={{ ...s.petit, color: '#f87171' }}>⚠ {c.anomalie}</div>}</td>
                          <td style={s.td}>{dateCourte(c.fin_le)}{c.raison_fin && <div style={s.petit}>{c.raison_fin.replace(/_/g, ' ')}</div>}</td>
                          <td style={s.td}>{c.nb_dons} · {argent(c.total_dons)}</td>
                          <td style={s.td}>{REMB[c.remb_statut] || ''}{c.remb_montant && <div style={s.petit}>{argent(c.remb_montant)}</div>}{c.remb_erreur && <div style={{ ...s.petit, color: '#f87171' }}>{c.remb_erreur}</div>}</td>
                          <td style={s.td}>
                            {confirmer && confirmer.id === c.id ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                {confirmer.action === 'rembourser' && <input style={{ ...s.input, width: 70 }} placeholder={`${rg.remboursement_pct} %`} inputMode="decimal" value={pctManuel} onChange={e => setPctManuel(e.target.value)} />}
                                <button style={s.btnDanger} disabled={enCours === c.id} onClick={() => agir(c.id, confirmer.action)}>{enCours === c.id ? '…' : 'Confirmer'}</button>
                                <button style={s.btnLigne} onClick={() => { setConfirmer(null); setPctManuel(''); }}>Non</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {peutRemb && <button style={s.btnLigne} onClick={() => setConfirmer({ id: c.id, action: 'rembourser' })}>Rembourser</button>}
                                {c.statut === 'publiee' && <button style={s.btnLigne} onClick={() => setConfirmer({ id: c.id, action: 'fermer' })}>Fermer</button>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 24px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  titre: { fontSize: 24, fontWeight: 800, margin: '0 0 4px' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 640, margin: 0 },
  badgeOk: { background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.4)', color: '#4ade80', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 },
  erreur: { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  muet: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  onglets: { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  onglet: { background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  ongletActif: { background: '#c9a96e', borderColor: '#c9a96e', color: '#111' },
  carte: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 },
  h2: { fontSize: 15, fontWeight: 700, margin: '0 0 6px' },
  aide: { fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', maxWidth: 700 },
  ligne: { display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10, flexWrap: 'wrap' },
  grille: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 },
  champ: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 },
  lbl: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { flex: 1, minWidth: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  coche: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '8px 0', color: 'rgba(255,255,255,0.8)' },
  btnX: { background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 8, width: 34, height: 34, cursor: 'pointer' },
  btnAjout: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  exemple: { marginTop: 14, padding: 12, background: '#0a0a0a', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' },
  exLigne: { fontSize: 13, margin: '4px 0', color: 'rgba(255,255,255,0.75)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' },
  td: { padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top', color: '#fff' },
  petit: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  pastille: { border: '1px solid', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' },
  barreSave: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 },
  btnSave: { background: '#c9a96e', border: 'none', color: '#111', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnLigne: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: '#dc2626', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  stats: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 },
  stat: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 },
  statV: { fontSize: 22, fontWeight: 800, color: '#c9a96e' },
};