// CHEMIN : src/pages/gestionnaire/BoutiqueTaxes.tsx
// e-Vend Studio — Taxes du gestionnaire (templates boutique, solo). Il perçoit et gère ses taxes lui-même.
// Non inscrit aux taxes (Mon compte) = aucune taxe n'est ajoutée aux commandes.
// API : GET/PUT /api/boutique/gestionnaire/taxes

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface LigneProvince { province: string; label: string; tps: number; tvq: number; tvh: number; tvp: number; }
interface Etat {
  inscrit: boolean; no_tps: string | null; no_taxe_provinciale: string | null; province_entreprise: string | null;
  taux: Record<string, number>; defauts: Record<string, number>; personnalises: Record<string, number>;
  taxer_expedition: boolean; par_province: LigneProvince[];
}
interface Props { gestionnaireId: number; accent?: string; naviguerVers?: (page: string) => void; }

const CHAMPS: { cle: string; nom: string }[] = [
  { cle: 'taxe_tps', nom: 'TPS (fédérale)' }, { cle: 'taxe_tvq', nom: 'TVQ (Québec)' },
  { cle: 'taxe_tvh_on', nom: 'TVH Ontario' }, { cle: 'taxe_tvh_nb', nom: 'TVH Nouveau-Brunswick' }, { cle: 'taxe_tvh_ns', nom: 'TVH Nouvelle-Écosse' },
  { cle: 'taxe_tvh_nl', nom: 'TVH Terre-Neuve-et-Labrador' }, { cle: 'taxe_tvh_pe', nom: 'TVH Île-du-Prince-Édouard' },
  { cle: 'taxe_tvp_bc', nom: 'TVP Colombie-Britannique' }, { cle: 'taxe_tvp_sk', nom: 'TVP Saskatchewan' }, { cle: 'taxe_tvp_mb', nom: 'TVP Manitoba' },
];

const fmt = (n: number) => `${parseFloat(n.toFixed(3))}`.replace('.', ',') + ' %';

export default function BoutiqueTaxes({ accent, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const [etat, setEtat] = useState<Etat | null>(null);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [taxerExp, setTaxerExp] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<{ type: 'erreur' | 'succes'; texte: string } | null>(null);

  const appliquer = (e: Etat) => {
    setEtat(e);
    const v: Record<string, string> = {};
    CHAMPS.forEach(c => { v[c.cle] = String(e.taux[c.cle]).replace('.', ','); });
    setValeurs(v);
    setTaxerExp(e.taxer_expedition);
  };

  useEffect(() => {
    bq('/taxes').then(r => { if (r.ok) appliquer(r.data as Etat); else setMsg({ type: 'erreur', texte: messageErreur(r) }); });
  }, []);

  if (!etat) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>{msg ? msg.texte : '⏳ Chargement…'}</div>;

  const sauvegarder = async () => {
    setEnCours(true);
    const r = await bq('/taxes', { method: 'PUT', body: { taux: valeurs, taxer_expedition: taxerExp } });
    setEnCours(false);
    if (r.ok) { appliquer(r.data as Etat); setMsg({ type: 'succes', texte: 'Taxes enregistrées.' }); }
    else setMsg({ type: 'erreur', texte: messageErreur(r) });
  };
  const retourDefauts = () => { const v: Record<string, string> = {}; CHAMPS.forEach(c => { v[c.cle] = String(etat.defauts[c.cle]).replace('.', ','); }); setValeurs(v); };

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 14, padding: 22, marginBottom: 18 };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 0 40px', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#1a2332' }}>🧾 Taxes</h2>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
        Vous percevez et gérez vos taxes vous-même : Studio ne les touche jamais. Elles sont calculées selon la province de livraison de l’acheteur.
      </p>

      <div style={{ ...carte, borderColor: etat.inscrit ? '#bbf7d0' : '#fed7aa', background: etat.inscrit ? '#f0fdf4' : '#fff7ed' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: etat.inscrit ? '#166534' : '#9a3412', marginBottom: 6 }}>
          {etat.inscrit ? '✅ Vous êtes inscrit aux taxes' : '⚠️ Vous n’êtes pas inscrit aux taxes'}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
          {etat.inscrit
            ? `Les taxes sont ajoutées aux commandes.${etat.no_tps ? ` N° TPS/TVH : ${etat.no_tps}.` : ''}${etat.no_taxe_provinciale ? ` N° taxe provinciale : ${etat.no_taxe_provinciale}.` : ''}`
            : 'Aucune taxe n’est ajoutée à vos commandes. Si vous êtes inscrit à la TPS/TVQ, indiquez-le dans « Mon compte » (entreprise enregistrée).'}
        </p>
        {naviguerVers && <button onClick={() => naviguerVers('profil-compte')} style={{ marginTop: 10, background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}>Modifier dans Mon compte →</button>}
      </div>

      <div style={{ ...carte, opacity: etat.inscrit ? 1 : 0.6 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1a2332' }}>Taux de taxes</h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>Les taux officiels sont déjà inscrits. Modifiez-les seulement s’ils changent (entre 0 % et 30 %).</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {CHAMPS.map(c => (
            <div key={c.cle}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 5 }}>{c.nom}</label>
              <div style={{ position: 'relative' }}>
                <input value={valeurs[c.cle] || ''} onChange={e => setValeurs({ ...valeurs, [c.cle]: e.target.value })} inputMode="decimal"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e1e4e8', borderRadius: 8, padding: '9px 28px 9px 12px', fontSize: 14 }} />
                <span style={{ position: 'absolute', right: 10, top: 9, color: '#9ca3af', fontSize: 13 }}>%</span>
              </div>
            </div>
          ))}
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={taxerExp} onChange={e => setTaxerExp(e.target.checked)} style={{ width: 17, height: 17 }} />
          Taxer aussi les frais d’expédition (quand la commande contient un produit taxable)
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button onClick={sauvegarder} disabled={enCours} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: couleur, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{enCours ? '⏳…' : '💾 Enregistrer'}</button>
          <button onClick={retourDefauts} style={{ padding: '10px 16px', border: '1px solid #e1e4e8', borderRadius: 8, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>↺ Taux officiels</button>
        </div>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#1a2332' }}>Ce que paiera l’acheteur, par province</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}><th style={{ padding: 6 }}>Province</th><th style={{ padding: 6 }}>Taxes</th><th style={{ padding: 6 }}>Détail</th></tr></thead>
            <tbody>
              {etat.par_province.map(p => (
                <tr key={p.province} style={{ borderTop: '1px solid #f0f1f3' }}>
                  <td style={{ padding: 6, fontWeight: 700 }}>{p.province}</td>
                  <td style={{ padding: 6 }}>{p.label}</td>
                  <td style={{ padding: 6, color: '#6b7280' }}>{[p.tps ? `TPS ${fmt(p.tps)}` : '', p.tvq ? `TVQ ${fmt(p.tvq)}` : '', p.tvh ? `TVH ${fmt(p.tvh)}` : '', p.tvp ? `TVP ${fmt(p.tvp)}` : ''].filter(Boolean).join(' + ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 0', lineHeight: 1.5 }}>💡 Pour qu’une catégorie ne soit pas taxée (ex. produits exemptés), décochez « taxable » dans vos catégories.</p>
      </div>

      {msg && <BoutiqueModale type={msg.type} accent={couleur} message={msg.texte} onFermer={() => setMsg(null)} />}
    </div>
  );
}