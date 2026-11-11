// CHEMIN : src/pages/gestionnaire/BoutiquePromos.tsx
// e-Vend Studio — Codes promo du gestionnaire (templates boutique, solo). Le rabais s'applique aux articles (pas à l'expédition) ; taxes calculées après rabais.
// API : /api/boutique/gestionnaire/promos

import React, { useCallback, useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; }
interface Code {
  id: number; code: string; description: string | null; type: 'pourcentage' | 'montant'; valeur: string; montant_minimum: string | null;
  utilisations_max: number | null; max_par_acheteur: number | null; date_debut: string | null; date_fin: string | null; actif: boolean; utilisations: number; rabais_total: string;
}
const VIDE = { id: 0, code: '', description: '', type: 'pourcentage' as 'pourcentage' | 'montant', valeur: '', montant_minimum: '', utilisations_max: '', max_par_acheteur: '', date_debut: '', date_fin: '', actif: true };
const jour = (d: string | null) => (d ? String(d).slice(0, 10) : '');

function statutDe(c: Code): { texte: string; couleur: string } {
  if (!c.actif) return { texte: 'Désactivé', couleur: '#6b7280' };
  if (c.date_fin && new Date(c.date_fin).getTime() < Date.now()) return { texte: 'Expiré', couleur: '#ef4444' };
  if (c.date_debut && new Date(c.date_debut).getTime() > Date.now()) return { texte: 'À venir', couleur: '#f59e0b' };
  if (c.utilisations_max !== null && c.utilisations >= c.utilisations_max) return { texte: 'Épuisé', couleur: '#ef4444' };
  return { texte: 'Actif', couleur: '#10b981' };
}

export default function BoutiquePromos({ accent }: Props) {
  const couleur = accent || '#4f46e5';
  const [codes, setCodes] = useState<Code[] | null>(null);
  const [form, setForm] = useState<typeof VIDE | null>(null);
  const [aSupprimer, setASupprimer] = useState<Code | null>(null);
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes'; message: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const r = await bq('/promos');
    if (r.ok) setCodes(r.data.codes); else { setCodes([]); setModale({ type: 'erreur', message: messageErreur(r) }); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const ouvrir = (c?: Code) => setForm(c ? {
    id: c.id, code: c.code, description: c.description || '', type: c.type, valeur: String(Number(c.valeur)), montant_minimum: c.montant_minimum ? String(Number(c.montant_minimum)) : '',
    utilisations_max: c.utilisations_max !== null ? String(c.utilisations_max) : '', max_par_acheteur: c.max_par_acheteur !== null ? String(c.max_par_acheteur) : '',
    date_debut: jour(c.date_debut), date_fin: jour(c.date_fin), actif: c.actif } : { ...VIDE });

  const sauver = async () => {
    if (!form) return;
    setOccupe(true);
    const corps = { ...form, valeur: form.valeur.replace(',', '.'), montant_minimum: form.montant_minimum.replace(',', '.'), date_debut: form.date_debut || null, date_fin: form.date_fin ? `${form.date_fin}T23:59:59` : null };
    const r = form.id ? await bq(`/promos/${form.id}`, { method: 'PUT', body: corps }) : await bq('/promos', { method: 'POST', body: corps });
    setOccupe(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setForm(null); setModale({ type: 'succes', message: form.id ? 'Code promo modifié.' : 'Code promo créé.' }); charger();
  };

  const basculer = async (c: Code) => {
    const r = await bq(`/promos/${c.id}`, { method: 'PUT', body: { ...c, valeur: Number(c.valeur), montant_minimum: c.montant_minimum, date_debut: c.date_debut, date_fin: c.date_fin, actif: !c.actif } });
    if (!r.ok) setModale({ type: 'erreur', message: messageErreur(r) }); else charger();
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    setOccupe(true);
    const r = await bq(`/promos/${aSupprimer.id}`, { method: 'DELETE' });
    setOccupe(false); setASupprimer(null);
    if (!r.ok) setModale({ type: 'erreur', message: messageErreur(r) }); else { setModale({ type: 'succes', message: 'Code supprimé.' }); charger(); }
  };

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12 };
  const champ: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', width: '100%' };
  const etiq: React.CSSProperties = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: '#374151' };
  const btn = (fort?: boolean): React.CSSProperties => ({ border: fort ? 'none' : '1px solid #e1e4e8', background: fort ? couleur : '#fff', color: fort ? '#fff' : '#374151', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🏷️ Réductions & codes promo</h2>
        <button style={{ ...btn(true), marginLeft: 'auto' }} onClick={() => ouvrir()}>+ Nouveau code</button>
      </div>
      <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>Le rabais s'applique aux articles (pas à l'expédition). Les taxes sont calculées après le rabais.</p>

      <div style={{ ...carte, overflow: 'hidden' }}>
        {!codes ? <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div> : codes.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#6b7280' }}>Aucun code promo pour le moment.<br /><br /><button style={btn(true)} onClick={() => ouvrir()}>Créer mon premier code</button></div>
        ) : (
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>Code</th><th>Réduction</th><th>Utilisations</th><th>Période</th><th>Statut</th><th /></tr></thead>
            <tbody>{codes.map(c => { const s = statutDe(c); return (
              <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 14px' }}><strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{c.code}</strong>{c.description && <div style={{ color: '#6b7280', fontSize: 12 }}>{c.description}</div>}</td>
                <td>{c.type === 'pourcentage' ? `${Number(c.valeur)} %` : formaterArgent(c.valeur)}{c.montant_minimum ? <div style={{ color: '#6b7280', fontSize: 12 }}>dès {formaterArgent(c.montant_minimum)}</div> : null}</td>
                <td>{c.utilisations}{c.utilisations_max !== null ? ` / ${c.utilisations_max}` : ''}{Number(c.rabais_total) > 0 ? <div style={{ color: '#6b7280', fontSize: 12 }}>{formaterArgent(c.rabais_total)} accordés</div> : null}</td>
                <td style={{ fontSize: 12, color: '#4b5563' }}>{c.date_debut || c.date_fin ? `${jour(c.date_debut) || '…'} → ${jour(c.date_fin) || '…'}` : 'Toujours'}</td>
                <td><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${s.couleur}1a`, color: s.couleur, border: `1px solid ${s.couleur}55` }}>{s.texte}</span></td>
                <td style={{ whiteSpace: 'nowrap', paddingRight: 12, textAlign: 'right' }}>
                  <button style={{ ...btn(), padding: '5px 9px', fontSize: 12 }} onClick={() => basculer(c)}>{c.actif ? 'Désactiver' : 'Activer'}</button>{' '}
                  <button style={{ ...btn(), padding: '5px 9px', fontSize: 12 }} onClick={() => ouvrir(c)}>Modifier</button>{' '}
                  <button style={{ ...btn(), padding: '5px 9px', fontSize: 12, color: '#b91c1c' }} onClick={() => setASupprimer(c)}>🗑️</button>
                </td>
              </tr>); })}</tbody>
          </table></div>
        )}
      </div>

      {form && (
        <div onClick={() => setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: 20, overflowY: 'auto' }}>
          <div role="dialog" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', padding: 24 }}>
            <h3 style={{ margin: '0 0 14px' }}>{form.id ? 'Modifier le code' : 'Nouveau code promo'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={etiq}>Code (ce que le client tape)</label>
                <input style={{ ...champ, fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={30} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ETE10" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={etiq}>Description (facultatif, pour vous)</label><input style={champ} maxLength={200} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label style={etiq}>Type</label>
                <select style={champ} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}><option value="pourcentage">Pourcentage (%)</option><option value="montant">Montant fixe ($)</option></select></div>
              <div><label style={etiq}>Valeur {form.type === 'pourcentage' ? '(%)' : '($)'}</label><input style={champ} inputMode="decimal" value={form.valeur} onChange={e => setForm({ ...form, valeur: e.target.value })} /></div>
              <div><label style={etiq}>Achat minimum ($)</label><input style={champ} inputMode="decimal" placeholder="Aucun" value={form.montant_minimum} onChange={e => setForm({ ...form, montant_minimum: e.target.value })} /></div>
              <div><label style={etiq}>Utilisations maximum</label><input style={champ} inputMode="numeric" placeholder="Illimité" value={form.utilisations_max} onChange={e => setForm({ ...form, utilisations_max: e.target.value })} /></div>
              <div><label style={etiq}>Limite par client</label><input style={champ} inputMode="numeric" placeholder="Illimité" value={form.max_par_acheteur} onChange={e => setForm({ ...form, max_par_acheteur: e.target.value })} /></div>
              <div />
              <div><label style={etiq}>Début (facultatif)</label><input type="date" style={champ} value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} /></div>
              <div><label style={etiq}>Fin (facultatif, incluse)</label><input type="date" style={champ} value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} /></div>
              <label style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} /> Code actif</label>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button style={btn()} onClick={() => setForm(null)}>Annuler</button>
              <button style={btn(true)} disabled={occupe} onClick={sauver}>{occupe ? '⏳…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {aSupprimer && <BoutiqueModale type="confirmer" accent={couleur} message={`Supprimer le code ${aSupprimer.code} ? Les commandes déjà passées avec ce code ne changent pas.`} texteConfirmer="Supprimer" enCours={occupe} onFermer={() => setASupprimer(null)} onConfirmer={supprimer} />}
      {modale && <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />}
    </div>
  );
}