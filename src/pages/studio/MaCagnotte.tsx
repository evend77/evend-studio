// src/pages/studio/MaCagnotte.tsx
// e-Vend Studio — Cagnotte — Espace du gestionnaire : publication (prix fixe), dons reçus et branchement de Stripe / PayPal.

import { useState, useEffect, useCallback } from 'react';

const OR = '#c9a96e';

interface Don {
  id: number; nom_donateur: string; anonyme: boolean; montant: string; message: string | null;
  statut: 'en_attente' | 'complete' | 'annule'; mode_paiement: string | null; devise: string | null; anomalie: string | null; created_at: string; nom_campagne: string | null;
}
interface Etat {
  site_id: number | null; provinces: string[]; duree_max_jours: number; remboursement: { actif: boolean; pct: number }; objectif?: number;
  campagne: { id: number; statut: string; palier_nom: string | null; prix: number; total: number; publiee_le: string | null; fin_le: string | null; terminee_le: string | null; raison_fin: string | null; remb_statut: string; remb_montant: number | null; nb_dons: number; total_dons: number } | null;
  apercu: { palier: { nom: string }; prix: number } | null; modes: { stripe: boolean; paypal: boolean; env: string }; problemes: string[];
}
interface Devis { palier: string; prix: number; taxes: number; label_taxes: string; total: number; devise: string; }
interface ConfigPaiement {
  sandbox: boolean; devise: string; stripe_actif: boolean; paypal_actif: boolean; modes: { stripe: boolean; paypal: boolean };
  webhook_urls: { stripe: string; paypal: string }; [cle: string]: any;
}

async function api(chemin: string, options: { method?: string; body?: any } = {}) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(chemin, {
    method: options.method || 'GET', credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let data: any = null; try { data = await res.json(); } catch { /* vide */ }
  return { ok: res.ok, status: res.status, data };
}

const argent = (n: number | string | null | undefined) => `${Number(n || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const dateLongue = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');
const dateHeure = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MaCagnotte({ vendeurId }: { vendeurId: number }) {
  const [onglet, setOnglet] = useState<'publication' | 'dons' | 'paiements'>('publication');
  const [largeur, setLargeur] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const mobile = largeur < 720;
  useEffect(() => { const f = () => setLargeur(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: mobile ? '16px 12px 40px' : '28px 32px 40px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${OR}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💝</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Ma Cagnotte</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Publiez votre campagne, suivez vos dons, branchez vos paiements.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {([['publication', '🚀 Publication'], ['dons', '💝 Dons reçus'], ['paiements', '💳 Paiements']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ ...btnOnglet, ...(onglet === id ? btnOngletActif : {}) }}>{label}</button>
        ))}
      </div>
      {onglet === 'publication' && <Publication mobile={mobile} versPaiements={() => setOnglet('paiements')} />}
      {onglet === 'dons' && <Dons mobile={mobile} key={vendeurId} />}
      {onglet === 'paiements' && <Paiements mobile={mobile} />}
    </div>
  );
}

// ═══════════════ PUBLICATION ═══════════════
function Publication({ mobile, versPaiements }: { mobile: boolean; versPaiements: () => void }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [province, setProvince] = useState('QC');
  const [devis, setDevis] = useState<Devis | null>(null);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [confirmerFermeture, setConfirmerFermeture] = useState(false);

  const charger = useCallback(async () => {
    const r = await api('/api/cagnotte/campagne/etat');
    if (r.ok) setEtat(r.data); else setErreur((r.data && r.data.message) || 'Chargement impossible.');
    return r.ok ? (r.data as Etat) : null;
  }, []);

  // Retour de la page de paiement : on demande à Stripe si le paiement est fait (sans attendre de webhook)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const retour = p.get('cagnotte');
    (async () => {
      if (retour) { try { window.history.replaceState({}, '', window.location.pathname); } catch { /* ignore */ } }
      if (retour === 'paye') {
        setInfo('Vérification de votre paiement…');
        for (let i = 0; i < 4; i++) {
          const v = await api('/api/cagnotte/campagne/verifier', { method: 'POST' });
          if (v.ok && v.data && v.data.paye) { setInfo('✅ Paiement reçu — votre campagne est maintenant ouverte aux dons !'); break; }
          if (i === 3) setInfo("Paiement en cours de confirmation. Revenez dans quelques minutes : la campagne s'ouvrira automatiquement.");
          else await new Promise(r => setTimeout(r, 2000));
        }
      } else if (retour === 'annule') setInfo("Paiement annulé. Aucun montant n'a été prélevé.");
      await charger();
    })();
  }, [charger]);

  useEffect(() => {
    if (!etat || !etat.apercu) { setDevis(null); return; }
    api('/api/cagnotte/campagne/devis', { method: 'POST', body: { province } }).then(r => { if (r.ok) setDevis(r.data); else setDevis(null); });
  }, [etat, province]);

  async function payer() {
    setErreur(''); setOccupe(true);
    const r = await api('/api/cagnotte/campagne/payer', { method: 'POST', body: { province } });
    if (r.ok && r.data && r.data.checkout_url) { window.location.href = r.data.checkout_url; return; }
    setErreur((r.data && r.data.message) || 'Le paiement a échoué.'); setOccupe(false);
  }
  async function fermer() {
    setErreur(''); setOccupe(true);
    const r = await api('/api/cagnotte/campagne/fermer', { method: 'POST' });
    setOccupe(false); setConfirmerFermeture(false);
    if (!r.ok) { setErreur((r.data && r.data.message) || 'Impossible de fermer la campagne.'); return; }
    setInfo(r.data && r.data.nb === 0 ? 'Campagne fermée. Aucun don reçu : un remboursement partiel est traité.' : 'Campagne fermée. Merci !');
    await charger();
  }

  if (!etat) return <div style={carte}>{erreur ? <p style={{ color: '#b91c1c', margin: 0 }}>{erreur}</p> : <p style={{ color: '#888', margin: 0 }}>Chargement…</p>}</div>;
  const c = etat.campagne;
  const ouverte = !!c && c.statut === 'publiee';
  const enAttente = !!c && c.statut === 'en_attente_paiement';
  const terminee = !!c && c.statut === 'terminee';
  const labelRemb: Record<string, string> = { fait: 'Remboursement effectué', a_faire: 'Remboursement à venir', en_cours: 'Remboursement en cours', echec: 'Remboursement à traiter par Studio' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      {info && <div style={{ ...carte, background: '#ecfdf5', borderColor: '#6ee7b7', color: '#065f46', fontSize: 14 }}>{info}</div>}
      {erreur && <div style={{ ...carte, background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', fontSize: 14 }}>⚠️ {erreur}</div>}

      {ouverte && c && (
        <div style={carte}>
          <p style={etiquette}>Votre campagne</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#166534' }}>✅ Ouverte aux dons</p>
          <p style={{ fontSize: 14, color: '#444', margin: '0 0 14px', lineHeight: 1.6 }}>Jusqu'au <b>{dateLongue(c.fin_le)}</b> · palier « {c.palier_nom} » · {c.nb_dons} don{c.nb_dons > 1 ? 's' : ''} pour <b>{argent(c.total_dons)}</b>.</p>
          {!etat.modes.stripe && !etat.modes.paypal && <p style={alerteJaune}>⚠️ Aucun moyen de paiement actif : branchez Stripe ou PayPal dans l'onglet <a href="#" onClick={e => { e.preventDefault(); versPaiements(); }}>Paiements</a>, sinon personne ne peut donner.</p>}
          {!confirmerFermeture
            ? <button style={btnSec} onClick={() => setConfirmerFermeture(true)}>Fermer la campagne maintenant</button>
            : (
              <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 12, fontSize: 13.5, color: '#7c2d12' }}>
                Fermer la campagne arrête les dons immédiatement. {c.nb_dons === 0 && etat.remboursement.actif ? `Comme vous n'avez reçu aucun don, ${etat.remboursement.pct} % du prix payé vous sera remboursé.` : 'Cette action est définitive.'}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={btnDanger} disabled={occupe} onClick={fermer}>{occupe ? '…' : 'Oui, fermer'}</button>
                  <button style={btnSec} onClick={() => setConfirmerFermeture(false)}>Non</button>
                </div>
              </div>
            )}
        </div>
      )}

      {terminee && c && (
        <div style={carte}>
          <p style={etiquette}>Dernière campagne</p>
          <p style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>🏁 Terminée le {dateLongue(c.terminee_le)}</p>
          <p style={{ fontSize: 14, color: '#444', margin: 0, lineHeight: 1.6 }}>{c.nb_dons} don{c.nb_dons > 1 ? 's' : ''} reçu{c.nb_dons > 1 ? 's' : ''} pour <b>{argent(c.total_dons)}</b>.{c.remb_statut !== 'aucun' && <> {labelRemb[c.remb_statut] || ''}{c.remb_montant ? ` (${argent(c.remb_montant)})` : ''}.</>}</p>
        </div>
      )}

      {!ouverte && (
        <div style={carte}>
          <p style={etiquette}>{terminee ? 'Lancer une nouvelle campagne' : 'Publier ma campagne'}</p>
          {enAttente && <p style={alerteJaune}>Un paiement est en attente. S'il a été effectué, la campagne s'ouvrira dans quelques minutes ; sinon, vous pouvez relancer le paiement ci-dessous.</p>}
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 14px' }}>Votre page est prête à partir de votre menu « Ma campagne ». Pour ouvrir les dons, vous payez un <b>prix fixe</b> selon votre objectif : <b>aucune commission</b> sur les dons, et l'argent arrive directement sur votre propre Stripe / PayPal. Durée maximale : {etat.duree_max_jours} jours.</p>

          {etat.problemes.length > 0 ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>À faire avant de publier :</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: '#92400e', lineHeight: 1.7 }}>
                {etat.problemes.map(p => <li key={p}>{p}</li>)}
              </ul>
              {etat.problemes.some(p => /Stripe/.test(p)) && <button style={{ ...btnSec, marginTop: 10 }} onClick={versPaiements}>Aller aux paiements →</button>}
            </div>
          ) : (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Votre province (pour les taxes)</label>
              <select value={province} onChange={e => setProvince(e.target.value)} style={{ ...champ, width: mobile ? '100%' : 200, marginBottom: 12 }}>
                {etat.provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {devis ? (
                <div style={{ fontSize: 14, color: '#333', lineHeight: 1.9 }}>
                  <div style={ligneDevis}><span>Palier « {devis.palier} » (objectif {argent(etat.objectif || 0)})</span><b style={{ whiteSpace: 'nowrap' }}>{argent(devis.prix)}</b></div>
                  <div style={ligneDevis}><span>Taxes ({devis.label_taxes})</span><b style={{ whiteSpace: 'nowrap' }}>{argent(devis.taxes)}</b></div>
                  <div style={{ ...ligneDevis, borderTop: '1px solid #d1d5db', marginTop: 4, paddingTop: 6, fontSize: 16 }}><span>Total</span><b style={{ color: '#1a1a1a', whiteSpace: 'nowrap' }}>{argent(devis.total)} {devis.devise}</b></div>
                </div>
              ) : <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Calcul du prix…</p>}
              {etat.remboursement.actif && <p style={{ fontSize: 12.5, color: '#666', margin: '12px 0 0', lineHeight: 1.5 }}>Si votre campagne se termine sans aucun don, {etat.remboursement.pct} % du prix payé (taxes comprises) vous est remboursé.</p>}
            </div>
          )}

          <button style={{ ...btnPrim, opacity: etat.problemes.length || occupe || !devis ? 0.5 : 1, width: mobile ? '100%' : undefined }} disabled={etat.problemes.length > 0 || occupe || !devis} onClick={payer}>
            {occupe ? 'Redirection vers le paiement…' : `💳 Payer ${devis ? argent(devis.total) : ''} et publier`}
          </button>
          <p style={{ fontSize: 12, color: '#999', margin: '10px 0 0' }}>Paiement sécurisé par carte, via Stripe. Aucune publication sans paiement.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════ DONS ═══════════════
function Dons({ mobile }: { mobile: boolean }) {
  const [dons, setDons] = useState<Don[]>([]);
  const [totaux, setTotaux] = useState({ total: '0.00', count: 0, ce_mois: '0.00' });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'complete' | 'en_attente'>('tous');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    api('/api/dons/gestionnaire').then(r => {
      if (r.ok) { setDons(r.data.dons || []); setTotaux({ total: r.data.total || '0.00', count: r.data.count || 0, ce_mois: r.data.ce_mois || '0.00' }); }
      else setErreur((r.data && r.data.message) || 'Impossible de charger les dons.');
    }).finally(() => setChargement(false));
  }, []);

  const q = recherche.trim().toLowerCase();
  const liste = dons.filter(d => (filtre === 'tous' || d.statut === filtre) && (!q || d.nom_donateur.toLowerCase().includes(q) || (d.message || '').toLowerCase().includes(q)));
  const enAttente = dons.filter(d => d.statut === 'en_attente').length;
  const badge = (s: Don['statut']) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s === 'complete' ? '#dcfce7' : s === 'en_attente' ? '#fef9c3' : '#fee2e2', color: s === 'complete' ? '#16a34a' : s === 'en_attente' ? '#a16207' : '#dc2626', whiteSpace: 'nowrap' as const });
  const libelle = (s: Don['statut']) => (s === 'complete' ? '✅ Reçu' : s === 'en_attente' ? '⏳ En attente' : '❌ Annulé');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <Stat icone="💰" label="Total reçu" valeur={argent(totaux.total)} couleur={OR} />
        <Stat icone="✅" label="Dons reçus" valeur={String(totaux.count)} couleur="#16a34a" />
        <Stat icone="⏳" label="En attente" valeur={String(enAttente)} couleur="#d97706" />
        <Stat icone="📅" label="Ce mois-ci" valeur={argent(totaux.ce_mois)} couleur="#6366f1" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un donateur…" style={{ ...champ, width: mobile ? '100%' : 240 }} />
        {(['tous', 'complete', 'en_attente'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{ ...btnOnglet, padding: '7px 14px', fontSize: 12, ...(filtre === f ? btnOngletActif : {}) }}>{f === 'tous' ? 'Tous' : f === 'complete' ? 'Reçus' : 'En attente'}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>{liste.length} don(s)</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {chargement ? <p style={{ padding: 40, textAlign: 'center', color: '#aaa', margin: 0 }}>Chargement…</p>
          : erreur ? <p style={{ padding: 30, textAlign: 'center', color: '#b91c1c', margin: 0 }}>{erreur}</p>
          : liste.length === 0 ? (
            <div style={{ padding: 50, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>💝</div>
              <p style={{ fontSize: 15, color: '#888', margin: '0 0 6px' }}>Aucun don pour l'instant.</p>
              <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Une fois la campagne publiée, partagez votre page pour recevoir des dons.</p>
            </div>
          ) : mobile ? (
            liste.map(d => (
              <div key={d.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f1f1f1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <b style={{ fontSize: 14 }}>{d.anonyme ? '🕶 Don anonyme' : d.nom_donateur}</b>
                  <b style={{ color: OR, fontSize: 16 }}>{argent(d.montant)}</b>
                </div>
                {d.message && <p style={{ fontSize: 12.5, color: '#555', fontStyle: 'italic', margin: '6px 0 0', overflowWrap: 'anywhere' }}>« {d.message} »</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: '#999' }}>{dateHeure(d.created_at)}{d.mode_paiement ? ` · ${d.mode_paiement === 'paypal' ? 'PayPal' : 'Carte'}` : ''}</span>
                  <span style={badge(d.statut)}>{libelle(d.statut)}</span>
                </div>
                {d.anomalie && <p style={{ fontSize: 12, color: '#b91c1c', margin: '6px 0 0' }}>⚠️ {d.anomalie}</p>}
              </div>
            ))
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f8f8f6', borderBottom: '2px solid #e5e7eb' }}>
                  {['Donateur', 'Montant', 'Message', 'Moyen', 'Statut', 'Date'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {liste.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '13px 16px', fontWeight: 600 }}>{d.anonyme ? '🕶 Anonyme' : d.nom_donateur}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 800, color: OR, fontSize: 15 }}>{argent(d.montant)}</td>
                      <td style={{ padding: '13px 16px', maxWidth: 260, color: '#555', fontStyle: d.message ? 'italic' : 'normal', overflowWrap: 'anywhere' }}>{d.message ? `« ${d.message.length > 90 ? d.message.slice(0, 90) + '…' : d.message} »` : '—'}{d.anomalie && <div style={{ color: '#b91c1c', fontStyle: 'normal', fontSize: 12 }}>⚠️ {d.anomalie}</div>}</td>
                      <td style={{ padding: '13px 16px', color: '#666' }}>{d.mode_paiement === 'paypal' ? 'PayPal' : d.mode_paiement === 'stripe' ? 'Carte' : '—'}</td>
                      <td style={{ padding: '13px 16px' }}><span style={badge(d.statut)}>{libelle(d.statut)}</span></td>
                      <td style={{ padding: '13px 16px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{dateHeure(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

function Stat({ icone, label, valeur, couleur }: { icone: string; label: string; valeur: string; couleur: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ fontSize: 18 }}>{icone}</span><span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>{label}</span></div>
      <p style={{ fontSize: 22, fontWeight: 800, color: couleur, margin: 0, overflowWrap: 'anywhere' }}>{valeur}</p>
    </div>
  );
}

// ═══════════════ PAIEMENTS (Stripe / PayPal du gestionnaire) ═══════════════
function Paiements({ mobile }: { mobile: boolean }) {
  const [cfg, setCfg] = useState<ConfigPaiement | null>(null);
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState('');

  const charger = useCallback(() => { api('/api/gestionnaire/cagnotte-paiement').then(r => { if (r.ok) setCfg(r.data); else setMsg({ ok: false, texte: (r.data && r.data.error) || 'Chargement impossible.' }); }); }, []);
  useEffect(charger, [charger]);

  if (!cfg) return <div style={carte}><p style={{ margin: 0, color: msg ? '#b91c1c' : '#888' }}>{msg ? msg.texte : 'Chargement…'}</p></div>;
  const env = cfg.sandbox ? 'dev' : 'prod';
  const set = (k: string, v: string) => setSaisie(s => ({ ...s, [k]: v }));

  async function enregistrer(extra: Record<string, any> = {}) {
    setOccupe('save'); setMsg(null);
    const corps: Record<string, any> = { ...extra };
    for (const [k, v] of Object.entries(saisie) as [string, string][]) if (v.trim() !== '') corps[k] = v.trim();
    const r = await api('/api/gestionnaire/cagnotte-paiement', { method: 'POST', body: corps });
    setOccupe('');
    if (!r.ok) { setMsg({ ok: false, texte: (r.data && r.data.error) || 'Enregistrement refusé.' }); return false; }
    setSaisie({}); setMsg({ ok: true, texte: 'Enregistré ✓' }); charger(); return true;
  }
  async function action(chemin: string, fournisseur: 'stripe' | 'paypal') {
    setOccupe(chemin + fournisseur); setMsg(null);
    if (Object.keys(saisie).some(k => saisie[k].trim())) { if (!(await enregistrer())) { setOccupe(''); return; } }
    const r = await api(`/api/gestionnaire/cagnotte-paiement/${chemin}`, { method: 'POST', body: { fournisseur } });
    setOccupe(''); setMsg({ ok: !!(r.data && r.data.ok), texte: (r.data && (r.data.message || r.data.error)) || 'Échec.' }); charger();
  }

  const modeTxt = cfg.sandbox ? 'test' : 'production';
  const webhookStripe = !!cfg[`stripe_${env}_webhook`], webhookPaypal = !!cfg[`paypal_${env}_webhook`];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      {msg && <div style={{ ...carte, background: msg.ok ? '#ecfdf5' : '#fef2f2', borderColor: msg.ok ? '#6ee7b7' : '#fca5a5', color: msg.ok ? '#065f46' : '#b91c1c', fontSize: 14 }}>{msg.texte}</div>}

      <div style={carte}>
        <p style={etiquette}>Mode actuel</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => enregistrer({ sandbox: true })} style={{ ...btnOnglet, ...(cfg.sandbox ? btnOngletActif : {}) }}>🧪 Test (aucun vrai paiement)</button>
          <button onClick={() => enregistrer({ sandbox: false })} style={{ ...btnOnglet, ...(!cfg.sandbox ? btnOngletActif : {}) }}>🟢 Production (vrais dons)</button>
        </div>
        <p style={aide}>Essayez d'abord en mode test avec les clés de test, puis passez en production avec vos clés de production. L'argent des dons va directement sur votre compte : Studio n'y touche jamais et ne prend aucune commission.</p>
        <label style={etiquette}>Devise</label>
        <select style={{ ...champ, width: 120 }} value={cfg.devise} onChange={e => enregistrer({ devise: e.target.value })}><option value="CAD">CAD</option><option value="USD">USD</option></select>
      </div>

      {/* STRIPE */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <p style={{ ...etiquette, margin: 0 }}>💳 Stripe (cartes)</p>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={cfg.stripe_actif} onChange={e => enregistrer({ stripe_actif: e.target.checked })} /> Offrir ce moyen</label>
        </div>
        <p style={aide}>Dans votre compte Stripe : Développeurs → Clés API. Collez la clé secrète du mode {modeTxt} (commence par <code>{cfg.sandbox ? 'sk_test_' : 'sk_live_'}</code>).</p>
        <label style={etiquette}>Clé secrète ({modeTxt})</label>
        <input style={champ} type="password" autoComplete="off" placeholder={cfg[`stripe_${env}_secret_key_masque`] || (cfg.sandbox ? 'sk_test_…' : 'sk_live_…')} value={saisie[`stripe_${env}_secret_key`] || ''} onChange={e => set(`stripe_${env}_secret_key`, e.target.value)} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button style={btnPrim} disabled={!!occupe} onClick={() => enregistrer()}>{occupe === 'save' ? '…' : 'Enregistrer'}</button>
          <button style={btnSec} disabled={!!occupe} onClick={() => action('tester', 'stripe')}>{occupe === 'testerstripe' ? '…' : 'Tester la connexion'}</button>
          <button style={btnSec} disabled={!!occupe} onClick={() => action('webhook/register', 'stripe')}>{occupe === 'webhook/registerstripe' ? '…' : webhookStripe ? 'Recréer le webhook' : 'Créer le webhook'}</button>
        </div>
        <p style={{ ...aide, margin: '10px 0 0' }}>Webhook ({modeTxt}) : {webhookStripe ? '✅ en place — les dons sont confirmés automatiquement.' : '❌ à créer : sans lui, les dons ne sont pas confirmés. Enregistrez votre clé, puis cliquez « Créer le webhook ».'}</p>
      </div>

      {/* PAYPAL */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <p style={{ ...etiquette, margin: 0 }}>🅿️ PayPal</p>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={cfg.paypal_actif} onChange={e => enregistrer({ paypal_actif: e.target.checked })} /> Offrir ce moyen</label>
        </div>
        <p style={aide}>Dans developer.paypal.com : Apps &amp; Credentials → créez une application ({cfg.sandbox ? 'Sandbox' : 'Live'}), puis copiez son Client ID et son Secret.</p>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div><label style={etiquette}>Client ID ({modeTxt})</label><input style={champ} autoComplete="off" placeholder={cfg[`paypal_${env}_client_id`] || 'Client ID'} value={saisie[`paypal_${env}_client_id`] ?? ''} onChange={e => set(`paypal_${env}_client_id`, e.target.value)} /></div>
          <div><label style={etiquette}>Secret ({modeTxt})</label><input style={champ} type="password" autoComplete="off" placeholder={cfg[`paypal_${env}_secret_masque`] || 'Secret'} value={saisie[`paypal_${env}_secret`] || ''} onChange={e => set(`paypal_${env}_secret`, e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button style={btnPrim} disabled={!!occupe} onClick={() => enregistrer()}>{occupe === 'save' ? '…' : 'Enregistrer'}</button>
          <button style={btnSec} disabled={!!occupe} onClick={() => action('tester', 'paypal')}>{occupe === 'testerpaypal' ? '…' : 'Tester la connexion'}</button>
          <button style={btnSec} disabled={!!occupe} onClick={() => action('webhook/register', 'paypal')}>{occupe === 'webhook/registerpaypal' ? '…' : webhookPaypal ? 'Recréer le webhook' : 'Créer le webhook'}</button>
        </div>
        <p style={{ ...aide, margin: '10px 0 0' }}>Webhook ({modeTxt}) : {webhookPaypal ? '✅ en place.' : '❌ à créer (enregistrez vos clés, puis cliquez « Créer le webhook »).'}</p>
      </div>

      <div style={{ ...carte, background: '#f9fafb' }}>
        <p style={{ ...aide, margin: 0 }}>🔒 Vos clés secrètes sont enregistrées chiffrées et ne sont jamais réaffichées en entier. Moyens offerts aux donateurs en ce moment : <b>{[cfg.modes.stripe ? 'Carte (Stripe)' : '', cfg.modes.paypal ? 'PayPal' : ''].filter(Boolean).join(' + ') || 'aucun'}</b> (mode {modeTxt}).</p>
      </div>
    </div>
  );
}

// ─── styles partagés ───
const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 18px' };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' };
const aide: React.CSSProperties = { fontSize: 12.5, color: '#777', margin: '0 0 12px', lineHeight: 1.55 };
const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a1a1a' };
const btnPrim: React.CSSProperties = { background: OR, border: 'none', color: '#fff', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnSec: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', color: '#374151', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnDanger: React.CSSProperties = { background: '#dc2626', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnOnglet: React.CSSProperties = { background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnOngletActif: React.CSSProperties = { background: '#1a1a1a', borderColor: '#1a1a1a', color: '#fff' };
const alerteJaune: React.CSSProperties = { fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', margin: '0 0 14px', lineHeight: 1.5 };
const ligneDevis: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 };