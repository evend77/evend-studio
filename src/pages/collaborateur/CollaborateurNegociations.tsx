// CHEMIN : src/pages/collaborateur/CollaborateurNegociations.tsx
// e-Vend Studio — Dashboard collaborateur : « Offres des acheteurs » (add-on « Faire une offre »).
// Le vendeur accepte, refuse ou répond par une contre-offre. Aucune réservation de stock : si le produit se vend entre-temps, l'offre tombe.
// API : /api/marketplace/:gid/negociations/collaborateur/(mes | :id/accepter | :id/refuser | :id/contre | reglages)

import { useState, useEffect, useCallback, type CSSProperties } from 'react';

interface Offre {
  id: number; produit_id: number; titre: string; variante: string; photo: string | null; sku: string | null; stock: number | null; acheteur: string | null;
  prix_produit: number; prix_offert: number; prix_contre: number | null; prix_final: number | null; message: string | null; message_vendeur: string | null; etat: string; cree: string; expire: string;
}
interface Reponse {
  addon_actif: boolean; validite_heures: number; reglages: { actif: boolean; minPct: number }; total: number; page: number; pages: number;
  stats: { a_repondre: number; contre: number; acceptees: number; payees: number }; offres: Offre[];
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444', orange: '#f59e0b' };
const $$ = (n: number | null) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(2)} $`);
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const ETATS: Record<string, { label: string; couleur: string; fond: string }> = {
  attente: { label: '⏳ À répondre', couleur: '#b45309', fond: '#fffbeb' },
  contre: { label: '💬 Contre-offre envoyée', couleur: '#1d4ed8', fond: '#eff6ff' },
  acceptee: { label: '✅ Acceptée — attend le paiement', couleur: '#047857', fond: '#ecfdf5' },
  payee: { label: '🛍️ Vendue', couleur: '#047857', fond: '#ecfdf5' },
  refusee: { label: 'Refusée', couleur: '#6b7280', fond: '#f3f4f6' },
  annulee: { label: "Retirée par l'acheteur", couleur: '#6b7280', fond: '#f3f4f6' },
  expiree: { label: '⌛ Expirée', couleur: '#6b7280', fond: '#f3f4f6' },
};
const FILTRES: [string, string][] = [['', 'Toutes'], ['attente', 'À répondre'], ['contre', 'Contre-offres'], ['acceptee', 'Acceptées'], ['payee', 'Vendues'], ['refusee', 'Refusées'], ['expiree', 'Expirées']];

export default function CollaborateurNegociations({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/marketplace/${gestionnaireId}/negociations/collaborateur`;
  const [data, setData] = useState<Reponse | null>(null);
  const [etat, setEtat] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [contre, setContre] = useState<Offre | null>(null);
  const [prixContre, setPrixContre] = useState('');
  const [mot, setMot] = useState('');
  const [reglOuvert, setReglOuvert] = useState(false);
  const [actif, setActif] = useState(true);
  const [minPct, setMinPct] = useState('50');

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) }); if (etat) p.set('etat', etat);
      const r = await fetch(`${base}/mes?${p}`, { credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j); setActif(j.reglages.actif); setMinPct(String(j.reglages.minPct));
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, etat]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500); };
  const envoyer = async (chemin: string, methode: string, corps: object, ok: string) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${chemin}`, { method: methode, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash(ok); setContre(null); setMot(''); charger();
      window.dispatchEvent(new Event('negociations-collab-maj'));
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

  if (data && !data.addon_actif) return <div style={{ padding: 30, textAlign: 'center', color: T.light }}>L'option « Faire une offre » n'est pas activée par votre marketplace.</div>;

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>🤝 Offres des acheteurs</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Les acheteurs vous proposent un prix. Acceptez, refusez ou contre-proposez. Une offre acceptée ou une contre-offre reste valide {data?.validite_heures ?? 48} h. <b>Le produit n'est pas réservé</b> : s'il se vend entre-temps, l'offre tombe.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>⚙️ Mes réglages <span style={{ fontWeight: 600, color: T.light, fontSize: 12 }}>— {data ? (data.reglages.actif ? `offres acceptées dès ${data.reglages.minPct} % du prix` : 'offres désactivées sur mes produits') : ''}</span></div>
          <button onClick={() => setReglOuvert(!reglOuvert)} style={btn('#fff', T.text, T.border)}>{reglOuvert ? 'Fermer' : 'Modifier'}</button>
        </div>
        {reglOuvert && (
          <div style={{ marginTop: 12, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Accepter les offres sur mes produits
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text }}>
              Offre minimale : <input type="number" min={10} max={99} value={minPct} onChange={e => setMinPct(e.target.value)} style={{ ...champ, width: 76 }} /> % du prix
            </label>
            <button disabled={occupe} onClick={() => envoyer('/reglages', 'PUT', { actif, min_pct: Number(minPct) }, 'Réglages enregistrés.')} style={btn(accent, '#fff')}>Enregistrer</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTRES.map(([id, label]) => (
          <button key={id || 'tous'} onClick={() => { setEtat(id); setPage(1); }} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${etat === id ? accent : T.border}`, background: etat === id ? `${accent}22` : '#fff', color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}{id === 'attente' && data ? ` (${data.stats.a_repondre})` : ''}
          </button>
        ))}
      </div>

      {chargement && !data ? <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>
        : !data || data.offres.length === 0 ? <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 30, textAlign: 'center', color: T.light }}>Aucune offre pour le moment.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.offres.map(o => {
              const st = ETATS[o.etat] || ETATS.refusee;
              const pct = o.prix_produit > 0 ? Math.round(((o.prix_produit - o.prix_offert) / o.prix_produit) * 100) : 0;
              return (
                <div key={o.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderLeft: `4px solid ${st.couleur}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {o.photo ? <img src={o.photo} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{o.titre}{o.variante ? ` — ${o.variante}` : ''}{o.sku ? <span style={{ fontWeight: 600, color: T.light }}> · SKU {o.sku}</span> : null}</div>
                      <div style={{ fontSize: 12, color: T.light, marginTop: 2 }}>{o.acheteur || 'Acheteur'} · reçue le {quand(o.cree)}{o.stock !== null && o.stock !== undefined ? ` · stock : ${o.stock}` : ''}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: T.text }}>
                        <span>Prix : <b>{$$(o.prix_produit)}</b></span>
                        <span>Offre : <b style={{ color: accent }}>{$$(o.prix_offert)}</b>{pct > 0 ? ` (−${pct} %)` : ''}</span>
                        {o.prix_contre !== null && <span>Ma contre-offre : <b>{$$(o.prix_contre)}</b></span>}
                        {o.etat === 'acceptee' && <span>Prix convenu : <b style={{ color: T.green }}>{$$(o.prix_final)}</b></span>}
                      </div>
                      {o.message && <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: T.text, fontStyle: 'italic' }}>« {o.message} »</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, color: st.couleur, background: st.fond, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                  {['attente', 'contre', 'acceptee'].includes(o.etat) && <div style={{ fontSize: 12, color: T.light, marginTop: 8 }}>{o.etat === 'attente' ? 'Répondre avant le ' : 'Valide jusqu\'au '}{quand(o.expire)}</div>}
                  {o.etat === 'attente' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button disabled={occupe} onClick={() => envoyer(`/${o.id}/accepter`, 'POST', {}, 'Offre acceptée. L\'acheteur est avisé.')} style={btn(T.green, '#fff')}>✓ Accepter {$$(o.prix_offert)}</button>
                      <button disabled={occupe} onClick={() => { setContre(o); setPrixContre(''); setMot(''); setErreur(''); }} style={btn('#fff', T.text, T.border)}>↔ Contre-offre</button>
                      <button disabled={occupe} onClick={() => { if (window.confirm('Refuser cette offre ?')) envoyer(`/${o.id}/refuser`, 'POST', {}, 'Offre refusée.'); }} style={btn('#fff', T.red, T.red)}>Refuser</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: T.light }}>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: page >= data.pages ? 'not-allowed' : 'pointer' }}>Suivant →</button>
        </div>
      )}

      {contre && (
        <div onClick={() => !occupe && setContre(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 14, padding: 20, boxSizing: 'border-box' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>↔ Contre-offre</div>
            <div style={{ fontSize: 13, color: T.light, marginBottom: 12 }}>« {contre.titre} » — prix {$$(contre.prix_produit)}, offre de l'acheteur {$$(contre.prix_offert)}. Votre prix doit être entre les deux.</div>
            <input autoFocus inputMode="decimal" value={prixContre} onChange={e => setPrixContre(e.target.value)} placeholder="Votre prix ($)" style={{ ...champ, width: '100%', marginBottom: 10, fontSize: 16 }} />
            <textarea value={mot} onChange={e => setMot(e.target.value.slice(0, 300))} rows={2} placeholder="Message (facultatif)" style={{ ...champ, width: '100%', marginBottom: 12, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={occupe || !prixContre} onClick={() => envoyer(`/${contre.id}/contre`, 'POST', { prix: Number(prixContre.replace(',', '.')), message: mot }, 'Contre-offre envoyée.')} style={{ ...btn(accent, '#fff'), flex: 1, opacity: !prixContre ? 0.5 : 1 }}>Envoyer</button>
              <button disabled={occupe} onClick={() => setContre(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}