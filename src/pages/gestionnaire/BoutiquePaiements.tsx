// CHEMIN : src/pages/gestionnaire/BoutiquePaiements.tsx
// e-Vend Studio — Paiements reçus du gestionnaire (templates boutique, solo) : ventes, taxes perçues, remboursements, par mode de paiement.
// L'argent va directement sur SON Stripe / SON PayPal : aucune commission. Les taxes perçues sont à remettre aux gouvernements par le gestionnaire.
// API : GET /api/boutique/gestionnaire/commandes/paiements/resume?du=&au=

import React, { useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; naviguerVers?: (page: string) => void; }

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function BoutiquePaiements({ accent, isMobile, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const [du, setDu] = useState(iso(new Date(Date.now() - 30 * 86400000)));
  const [au, setAu] = useState(iso(new Date()));
  const [d, setD] = useState<any>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;
    bq(`/commandes/paiements/resume?du=${du}&au=${au}`).then(r => { if (annule) return; if (r.ok) { setD(r.data); setErreur(''); } else setErreur(messageErreur(r)); });
    return () => { annule = true; };
  }, [du, au]);

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, padding: 16 };
  const champ: React.CSSProperties = { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 };
  const t = d ? d.totaux : null;
  const cases = t ? [
    { n: 'Ventes (avant taxes)', v: t.ventes, c: '#111827' }, { n: 'Expédition facturée', v: t.expedition, c: '#111827' },
    { n: 'Taxes perçues', v: t.taxes_percues, c: '#b45309' }, { n: 'Remboursé', v: t.rembourse, c: '#b91c1c' }, { n: 'Net encaissé', v: t.net, c: '#047857' },
  ] : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>💰 Paiements reçus</h2>
      <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>Les paiements vont directement sur votre compte Stripe / PayPal. Aucune commission n'est prélevée par la plateforme.</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
        Du <input type="date" style={champ} value={du} max={au} onChange={e => setDu(e.target.value)} /> au <input type="date" style={champ} value={au} min={du} onChange={e => setAu(e.target.value)} />
      </div>
      {erreur && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 12 }}>{erreur}</div>}
      {!d ? <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
            {cases.map(c => <div key={c.n} style={carte}><div style={{ fontSize: 12, color: '#6b7280' }}>{c.n}</div><div style={{ fontSize: 22, fontWeight: 800, color: c.c, marginTop: 4 }}>{formaterArgent(c.v)}</div></div>)}
          </div>
          {t.taxes_percues > 0 && (
            <div style={{ ...carte, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Taxes perçues (à remettre aux gouvernements)</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
                {t.tps > 0 && <span>TPS : <strong>{formaterArgent(t.tps)}</strong></span>}{t.tvq > 0 && <span>TVQ : <strong>{formaterArgent(t.tvq)}</strong></span>}
                {t.tvh > 0 && <span>TVH : <strong>{formaterArgent(t.tvh)}</strong></span>}{t.tvp > 0 && <span>Taxe provinciale : <strong>{formaterArgent(t.tvp)}</strong></span>}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Montants avant remboursements. Vérifiez avec votre comptable.</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {(['stripe', 'paypal'] as const).map(m => (
              <div key={m} style={carte}><strong>{m === 'stripe' ? '💳 Carte (Stripe)' : '🅿️ PayPal'}</strong>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }}>{d.par_mode[m].nb} paiement{d.par_mode[m].nb > 1 ? 's' : ''} · {formaterArgent(d.par_mode[m].brut)}{d.par_mode[m].rembourse > 0 ? ` · remboursé ${formaterArgent(d.par_mode[m].rembourse)}` : ''}</div></div>
            ))}
          </div>
          {d.anomalies.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, color: '#991b1b' }}>⚠️ Paiements à vérifier</h3>
              {d.anomalies.map((a: any) => <div key={a.id} style={{ fontSize: 13, marginBottom: 4 }}><strong>{a.numero_commande}</strong> — {a.anomalie}</div>)}
              {naviguerVers && <button onClick={() => naviguerVers('commandes-liste')} style={{ marginTop: 8, border: '1px solid #fca5a5', background: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Ouvrir les commandes</button>}
            </div>
          )}
          <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontWeight: 700, borderBottom: '1px solid #eee' }}>{d.nb_commandes} paiement{d.nb_commandes > 1 ? 's' : ''} du {d.du} au {d.au}</div>
            {d.paiements.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>Aucun paiement sur cette période.</div> : (
              <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}><th style={{ padding: '8px 16px' }}>Commande</th><th>Date</th><th>Mode</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right', paddingRight: 16 }}>Remboursé</th></tr></thead>
                <tbody>{d.paiements.map((p: any) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 16px', fontWeight: 600 }}>{p.numero_commande}</td><td>{new Date(p.paye_le).toLocaleDateString('fr-CA')}</td>
                    <td>{p.mode_paiement === 'stripe' ? '💳' : '🅿️'}</td><td style={{ textAlign: 'right' }}>{formaterArgent(p.total, p.devise)}</td>
                    <td style={{ textAlign: 'right', paddingRight: 16, color: Number(p.rembourse) > 0 ? '#b91c1c' : '#9ca3af' }}>{Number(p.rembourse) > 0 ? formaterArgent(p.rembourse, p.devise) : '—'}</td>
                  </tr>))}</tbody>
              </table></div>
            )}
          </div>
        </>
      )}
      <span style={{ display: 'none', color: couleur }} />
    </div>
  );
}