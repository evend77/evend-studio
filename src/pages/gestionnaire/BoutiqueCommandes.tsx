// CHEMIN : src/pages/gestionnaire/BoutiqueCommandes.tsx
// e-Vend Studio — Liste des commandes du gestionnaire (templates boutique, solo) : suivi d'expédition, remboursements, annulation.
// API : /api/boutique/gestionnaire/commandes

import React, { useCallback, useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; naviguerVers?: (page: string) => void; }
type Filtre = 'a_traiter' | 'expediees' | 'livrees' | 'attente' | 'annulees' | 'toutes';
const FILTRES: { id: Filtre; label: string }[] = [
  { id: 'a_traiter', label: 'À traiter' }, { id: 'expediees', label: 'Expédiées' }, { id: 'livrees', label: 'Livrées' },
  { id: 'attente', label: 'En attente de paiement' }, { id: 'annulees', label: 'Annulées' }, { id: 'toutes', label: 'Toutes' },
];

export function badgeCommande(c: { statut: string; statut_paiement: string }): { texte: string; couleur: string } {
  if (c.statut_paiement === 'rembourse') return { texte: 'Remboursée', couleur: '#6b7280' };
  if (c.statut === 'annulee') return { texte: 'Annulée', couleur: '#ef4444' };
  if (c.statut_paiement !== 'paye') return { texte: 'En attente de paiement', couleur: '#f59e0b' };
  if (c.statut === 'expediee') return { texte: 'Expédiée', couleur: '#06b6d4' };
  if (c.statut === 'livree') return { texte: 'Livrée', couleur: '#10b981' };
  return { texte: 'À traiter', couleur: '#4f46e5' };
}

const date = (d: string | null) => (d ? new Date(d).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function BoutiqueCommandes({ accent, isMobile }: Props) {
  const couleur = accent || '#4f46e5';
  const [filtre, setFiltre] = useState<Filtre>('a_traiter');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [donnees, setDonnees] = useState<any>(null);
  const [ouverte, setOuverte] = useState<any>(null);
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes'; message: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [suivi, setSuivi] = useState({ numero: '', transporteur: '' });
  const [rembModal, setRembModal] = useState<{ montant: string; stock: boolean; raison: string } | null>(null);
  const [confirmAnnul, setConfirmAnnul] = useState(false);

  const charger = useCallback(async () => {
    const r = await bq(`/commandes?filtre=${filtre}&q=${encodeURIComponent(q)}&page=${page}`);
    if (r.ok) setDonnees(r.data); else setModale({ type: 'erreur', message: messageErreur(r) });
  }, [filtre, q, page]);
  useEffect(() => { const t = setTimeout(charger, q ? 300 : 0); return () => clearTimeout(t); }, [charger, q]);

  const voir = async (id: number) => {
    const r = await bq(`/commandes/${id}`);
    if (r.ok) { setOuverte(r.data.commande); setSuivi({ numero: '', transporteur: '' }); } else setModale({ type: 'erreur', message: messageErreur(r) });
  };

  const agir = async (chemin: string, method: string, body: any, succes: string) => {
    setOccupe(true);
    const r = await bq(`/commandes/${ouverte.id}${chemin}`, { method, body });
    setOccupe(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return false; }
    setOuverte(r.data.commande); setModale({ type: 'succes', message: succes }); charger();
    return true;
  };

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12 };
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : '#e1e4e8'}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer' });
  const champ: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', width: '100%' };

  // ─── Détail d'une commande ───
  if (ouverte) {
    const c = ouverte; const b = badgeCommande(c); const adr = c.adresse_livraison || {}; const tx = c.taxes || {};
    const payee = c.statut_paiement === 'paye';
    const restant = Math.round((Number(c.total) - Number(c.rembourse)) * 100) / 100;
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        <button onClick={() => setOuverte(null)} style={{ ...btn(), marginBottom: 14 }}>← Retour à la liste</button>
        <div style={{ ...carte, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Commande {c.numero_commande}</h2>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${b.couleur}1a`, color: b.couleur, border: `1px solid ${b.couleur}55` }}>{b.texte}</span>
            <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 13 }}>{date(c.created_at)}</span>
          </div>
          {c.anomalie && <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>⚠️ {c.anomalie}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 14 }}>
          <div style={{ ...carte, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Articles</h3>
            {(c.articles || []).map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>{a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                <div style={{ flex: 1, fontSize: 14 }}>{a.titre}{a.variante ? ` — ${a.variante}` : ''}<div style={{ color: '#6b7280', fontSize: 12 }}>{formaterArgent(a.prix, c.devise)} × {a.quantite}</div></div>
                <strong>{formaterArgent(a.prix * a.quantite, c.devise)}</strong>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <Ligne n="Sous-total" v={formaterArgent(c.sous_total, c.devise)} />
              {Number(c.rabais) > 0 && <Ligne n={`Code promo ${c.code_promo || ''}`} v={`− ${formaterArgent(c.rabais, c.devise)}`} />}
              <Ligne n={`Expédition${c.methode_expedition && c.methode_expedition.nom ? ` (${c.methode_expedition.nom})` : ''}`} v={Number(c.frais_expedition) === 0 ? 'Gratuit' : formaterArgent(c.frais_expedition, c.devise)} />
              {Number(tx.tps) > 0 && <Ligne n="TPS" v={formaterArgent(tx.tps, c.devise)} />}
              {Number(tx.tvq) > 0 && <Ligne n="TVQ" v={formaterArgent(tx.tvq, c.devise)} />}
              {Number(tx.tvh) > 0 && <Ligne n="TVH" v={formaterArgent(tx.tvh, c.devise)} />}
              {Number(tx.tvp) > 0 && <Ligne n="Taxe provinciale" v={formaterArgent(tx.tvp, c.devise)} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 6 }}><span>Total</span><span>{formaterArgent(c.total, c.devise)}</span></div>
              {Number(c.rembourse) > 0 && <Ligne n="Déjà remboursé" v={`− ${formaterArgent(c.rembourse, c.devise)}`} />}
            </div>
          </div>
          <div>
            <div style={{ ...carte, padding: 16, marginBottom: 14, fontSize: 13, lineHeight: 1.6 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Client</h3>
              <div><strong>{[c.acheteur_prenom, c.acheteur_nom].filter(Boolean).join(' ') || adr.nom}</strong></div>
              <div style={{ color: '#6b7280' }}>{c.acheteur_email}</div>
              <h3 style={{ margin: '14px 0 6px', fontSize: 15 }}>Livraison</h3>
              <div>{adr.nom}<br />{adr.adresse1}{adr.adresse2 ? `, ${adr.adresse2}` : ''}<br />{adr.ville} {adr.province} {adr.code_postal}{adr.telephone ? <><br />📞 {adr.telephone}</> : null}</div>
              {c.note && <div style={{ marginTop: 8, background: '#f9fafb', borderRadius: 8, padding: 8 }}>💬 {c.note}</div>}
              <h3 style={{ margin: '14px 0 6px', fontSize: 15 }}>Paiement</h3>
              <div>{c.mode_paiement === 'stripe' ? '💳 Carte (Stripe)' : '🅿️ PayPal'}{c.env === 'dev' ? ' — mode test' : ''}<br /><span style={{ color: '#6b7280', fontSize: 12 }}>Réf. {c.reference_paiement || '—'}{c.paye_le ? ` · ${date(c.paye_le)}` : ''}</span></div>
              {c.numero_suivi && <div style={{ marginTop: 10 }}>📮 Suivi : <strong>{c.numero_suivi}</strong>{c.transporteur_suivi ? ` (${c.transporteur_suivi})` : ''}</div>}
            </div>
            {payee && c.statut !== 'annulee' && (
              <div style={{ ...carte, padding: 16, marginBottom: 14 }}>
                {c.statut === 'confirmee' && (<>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Expédier</h3>
                  <input style={{ ...champ, marginBottom: 8 }} placeholder="Numéro de suivi (facultatif)" value={suivi.numero} onChange={e => setSuivi(s => ({ ...s, numero: e.target.value }))} />
                  <input style={{ ...champ, marginBottom: 10 }} placeholder="Transporteur (facultatif)" value={suivi.transporteur} onChange={e => setSuivi(s => ({ ...s, transporteur: e.target.value }))} />
                  <button disabled={occupe} style={{ ...btn(true), width: '100%', marginBottom: 8 }} onClick={() => agir('/statut', 'PATCH', { statut: 'expediee', numero_suivi: suivi.numero, transporteur: suivi.transporteur }, 'Commande marquée comme expédiée.')}>📦 Marquer comme expédiée</button>
                </>)}
                {(c.statut === 'confirmee' || c.statut === 'expediee') && <button disabled={occupe} style={{ ...btn(), width: '100%' }} onClick={() => agir('/statut', 'PATCH', { statut: 'livree' }, 'Commande marquée comme livrée.')}>✅ Marquer comme livrée</button>}
              </div>
            )}
            {payee && restant > 0 && <button style={{ ...btn(false, true), width: '100%' }} onClick={() => setRembModal({ montant: restant.toFixed(2), stock: false, raison: '' })}>↩️ Rembourser…</button>}
            {!payee && c.statut !== 'annulee' && <button style={{ ...btn(false, true), width: '100%' }} onClick={() => setConfirmAnnul(true)}>Annuler cette commande</button>}
          </div>
        </div>

        {rembModal && (
          <div onClick={() => setRembModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: 20 }}>
            <div role="dialog" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 420, width: '100%', padding: 24 }}>
              <h3 style={{ margin: '0 0 6px' }}>Rembourser la commande</h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>Le remboursement est fait sur votre compte {c.mode_paiement === 'stripe' ? 'Stripe' : 'PayPal'}. Maximum : {formaterArgent(restant, c.devise)}.</p>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Montant</label>
              <input style={{ ...champ, marginBottom: 10 }} value={rembModal.montant} onChange={e => setRembModal({ ...rembModal, montant: e.target.value })} inputMode="decimal" />
              <label style={{ fontSize: 12, fontWeight: 700 }}>Raison (facultatif)</label>
              <input style={{ ...champ, marginBottom: 10 }} maxLength={200} value={rembModal.raison} onChange={e => setRembModal({ ...rembModal, raison: e.target.value })} />
              {Number(rembModal.montant.replace(',', '.')) >= restant && (
                <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 12, alignItems: 'center' }}><input type="checkbox" checked={rembModal.stock} onChange={e => setRembModal({ ...rembModal, stock: e.target.checked })} /> Remettre les articles en stock</label>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={btn()} onClick={() => setRembModal(null)}>Annuler</button>
                <button disabled={occupe} style={btn(true)} onClick={async () => {
                  const m = Number(rembModal.montant.replace(',', '.'));
                  if (!(m > 0)) { setModale({ type: 'erreur', message: 'Montant invalide.' }); return; }
                  const ok = await agir('/rembourser', 'POST', { montant: m, remettre_stock: rembModal.stock, raison: rembModal.raison }, `Remboursement de ${formaterArgent(m, c.devise)} effectué.`);
                  if (ok) setRembModal(null);
                }}>{occupe ? '⏳…' : 'Rembourser'}</button>
              </div>
            </div>
          </div>
        )}
        {confirmAnnul && <BoutiqueModale type="confirmer" accent={couleur} message="Annuler cette commande non payée ? Le stock réservé sera remis en vente." texteConfirmer="Oui, annuler" texteFermer="Non" enCours={occupe} onFermer={() => setConfirmAnnul(false)} onConfirmer={async () => { await agir('/annuler', 'POST', {}, 'Commande annulée.'); setConfirmAnnul(false); }} />}
        {modale && <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />}
      </div>
    );
  }

  // ─── Liste ───
  const cpt = donnees ? donnees.compteurs : {};
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 22 }}>📋 Liste des commandes</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTRES.map(f => (
          <button key={f.id} onClick={() => { setFiltre(f.id); setPage(1); }} style={{ border: `1px solid ${filtre === f.id ? couleur : '#e1e4e8'}`, background: filtre === f.id ? couleur : '#fff', color: filtre === f.id ? '#fff' : '#374151', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {f.label}{cpt[f.id] !== undefined ? ` (${cpt[f.id]})` : ''}
          </button>
        ))}
      </div>
      <input style={{ ...champ, maxWidth: 360, marginBottom: 12, display: 'block' }} placeholder="🔍 N° de commande, nom ou courriel" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
      <div style={{ ...carte, overflow: 'hidden' }}>
        {!donnees ? <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div> : donnees.commandes.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#6b7280' }}>Aucune commande{filtre === 'a_traiter' ? ' à traiter' : ''}.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Commande</th><th>Date</th><th>Client</th><th>Paiement</th><th>Statut</th><th style={{ textAlign: 'right', paddingRight: 14 }}>Total</th>
              </tr></thead>
              <tbody>
                {donnees.commandes.map((c: any) => { const b = badgeCommande(c); return (
                  <tr key={c.id} onClick={() => voir(c.id)} style={{ borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{c.numero_commande}{c.anomalie ? ' ⚠️' : ''}</td>
                    <td>{date(c.created_at)}</td>
                    <td>{c.nom_livraison || c.acheteur_email}</td>
                    <td>{c.mode_paiement === 'stripe' ? '💳' : '🅿️'}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${b.couleur}1a`, color: b.couleur, border: `1px solid ${b.couleur}55` }}>{b.texte}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: 14, fontWeight: 700 }}>{formaterArgent(c.total, c.devise)}</td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {donnees && donnees.total > donnees.limite && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, alignItems: 'center' }}>
          <button style={btn()} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span style={{ fontSize: 13 }}>Page {donnees.page} / {Math.ceil(donnees.total / donnees.limite)}</span>
          <button style={btn()} disabled={page >= Math.ceil(donnees.total / donnees.limite)} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
      {modale && <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />}
    </div>
  );
}

function Ligne({ n, v }: { n: string; v: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', padding: '3px 0' }}><span>{n}</span><span>{v}</span></div>;
}