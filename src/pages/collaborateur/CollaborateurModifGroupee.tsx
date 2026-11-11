// CHEMIN : src/pages/collaborateur/CollaborateurModifGroupee.tsx
// e-Vend Studio — Add-on « Outils avancés d'annonces » : modification groupée de mes annonces
// Adapté de BulkEditProduits.tsx (e-Vend). API : PATCH /api/collab/:gid/produits/bulk/champs (blocs de 500)

import React, { useState, useEffect } from 'react';

interface Props {
  gestionnaireId: number; accent: string; isMobile: boolean;
  ids: number[];                                   // annonces à modifier
  apercu: { id: number; titre: string }[];         // titres connus (page affichée)
  onClose: () => void;
  onSaved: (nb: number, note?: string) => void;
}
interface Regles { prix_revient?: boolean; qte_min_active?: boolean; categories?: boolean }
interface Methode { id: number; nom?: string; transporteur_nom?: string; libelle_prix?: string }
interface Cat { id: number; nom: string; groupe_nom?: string | null }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', bg: '#f8fafc' };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };

function Ligne({ label, actif, onToggle, children }: { label: string; actif: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
      <input type="checkbox" checked={actif} onChange={onToggle} style={{ marginTop: 11, width: 17, height: 17, flexShrink: 0, cursor: 'pointer' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{label}</label>
        {actif ? children : <div style={{ fontSize: 12, color: T.light, fontStyle: 'italic', padding: '6px 0' }}>Cochez pour modifier ce champ</div>}
      </div>
    </div>
  );
}

export default function CollaborateurModifGroupee({ gestionnaireId, accent, isMobile, ids, apercu, onClose, onSaved }: Props) {
  const base = `/api/collab/${gestionnaireId}`;
  const [regles, setRegles] = useState<Regles>({});
  const [cats, setCats] = useState<Cat[]>([]);
  const [methodes, setMethodes] = useState<Methode[]>([]);
  const [actifs, setActifs] = useState<Record<string, boolean>>({});
  const [v, setV] = useState<Record<string, string>>({});
  const [mChoisies, setMChoisies] = useState<number[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [confirme, setConfirme] = useState(false);

  useEffect(() => {
    const get = (u: string) => fetch(`${base}${u}`, { credentials: 'include' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
    get('/produits-regles').then(d => d && setRegles(d));
    get('/categories').then(d => Array.isArray(d) && setCats(d));
    get('/methodes-expedition/details').then(d => Array.isArray(d) && setMethodes(d));
  }, [base]);

  const tog = (k: string) => setActifs(a => ({ ...a, [k]: !a[k] }));
  const set = (k: string, val: string) => setV(o => ({ ...o, [k]: val }));
  const nbActifs = Object.values(actifs).filter(Boolean).length;
  const aucun = nbActifs === 0;

  const champ = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Ligne key={k} label={label} actif={!!actifs[k]} onToggle={() => tog(k)}>
      <input value={v[k] ?? ''} onChange={e => set(k, e.target.value)} inputMode="decimal" style={inp} {...props} />
    </Ligne>
  );

  const section = (titre: string, contenu: React.ReactNode[]) => {
    const l = contenu.filter(Boolean);
    if (!l.length) return null;
    return (
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '4px 14px 6px', marginBottom: 10, background: '#fff' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, padding: '10px 0 2px' }}>{titre}</div>
        {l}
      </div>
    );
  };

  const enregistrer = async () => {
    setErreur('');
    const champs: Record<string, unknown> = {};
    const num = (k: string) => (v[k] ?? '').trim().replace(',', '.');
    for (const k of ['prix', 'prix_promo', 'prix_revient', 'stock', 'quantite_min', 'poids']) {
      if (!actifs[k]) continue;
      const x = num(k);
      if ((k === 'prix') && x === '') { setErreur('Entrez le nouveau prix.'); return; }
      champs[k] = x === '' ? null : x;
    }
    if (actifs.categorie_id) champs.categorie_id = v.categorie_id ? Number(v.categorie_id) : null;
    if (actifs.statut) champs.statut = v.statut || 'actif';
    if (actifs.date_expiration) {
      if (v.exp_mode === 'retirer') champs.date_expiration = null;
      else if (!v.date_expiration) { setErreur("Choisissez une date d'expiration (ou « Retirer l'expiration »)."); return; }
      else champs.date_expiration = v.date_expiration;
    }
    const avecMethodes = !!actifs.methodes;
    if (aucun) { setErreur('Cochez au moins un champ à modifier.'); return; }
    setOccupe(true);
    let total = 0; const ignores = new Set<string>();
    try {
      for (let i = 0; i < ids.length; i += 500) {
        const bloc = ids.slice(i, i + 500);
        const res = await fetch(`${base}/produits/bulk/champs`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: bloc, champs, ...(avecMethodes ? { methodes_expedition_ids: mChoisies } : {}) }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { setErreur((d.error || 'Modification impossible') + (total ? ` (${total} annonce${total > 1 ? 's' : ''} déjà modifiée${total > 1 ? 's' : ''}.)` : '')); setOccupe(false); setConfirme(false); return; }
        total += d.modifies || 0; (d.ignores || []).forEach((x: string) => ignores.add(x));
      }
    } catch { setErreur('Erreur réseau'); setOccupe(false); setConfirme(false); return; }
    setOccupe(false); setConfirme(false);
    const note = ignores.size ? `Ignoré (désactivé par la boutique) : ${Array.from(ignores).map(x => x === 'prix_revient' ? 'prix de revient' : 'quantité minimum').join(', ')}.` : undefined;
    onSaved(total, note);
  };

  const aff = apercu.slice(0, 6);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}>
      <div style={{ background: T.bg, borderRadius: isMobile ? '16px 16px 0 0' : 14, width: '100%', maxWidth: 640, maxHeight: isMobile ? '94vh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', background: '#fff', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>✏️ Modification groupée</div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 2 }}>{ids.length} annonce{ids.length > 1 ? 's' : ''} · cochez seulement ce que vous voulez changer</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.light }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: T.light }}>
            {aff.map(p => <div key={p.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.text }}>• {p.titre}</div>)}
            {ids.length > aff.length && <div style={{ marginTop: 2 }}>… et {ids.length - aff.length} autre{ids.length - aff.length > 1 ? 's' : ''}</div>}
          </div>

          {regles.categories !== false && cats.length > 0 && section('📂 Catégorie', [
            <Ligne key="c" label="Catégorie" actif={!!actifs.categorie_id} onToggle={() => tog('categorie_id')}>
              <select value={v.categorie_id ?? ''} onChange={e => set('categorie_id', e.target.value)} style={inp}>
                <option value="">— Aucune catégorie —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.groupe_nom ? `${c.groupe_nom} › ` : ''}{c.nom}</option>)}
              </select>
            </Ligne>,
          ])}

          {section('💰 Prix', [
            champ('prix', 'Prix de vente ($)'),
            champ('prix_promo', 'Prix promo ($) — laisser vide pour retirer la promo'),
            regles.prix_revient ? champ('prix_revient', 'Prix de revient ($)') : null,
          ])}

          {section('📦 Stock', [
            champ('stock', 'Quantité en stock — laisser vide = illimité', { inputMode: 'numeric' }),
            regles.qte_min_active ? champ('quantite_min', 'Quantité minimum par commande', { inputMode: 'numeric' }) : null,
            champ('poids', 'Poids (kg)'),
          ])}

          {section('📢 Publication', [
            <Ligne key="s" label="Statut" actif={!!actifs.statut} onToggle={() => tog('statut')}>
              <select value={v.statut ?? 'actif'} onChange={e => set('statut', e.target.value)} style={inp}>
                <option value="actif">Publier (active)</option>
                <option value="brouillon">Retirer de la vente (brouillon)</option>
              </select>
            </Ligne>,
            <Ligne key="e" label="Date d'expiration" actif={!!actifs.date_expiration} onToggle={() => tog('date_expiration')}>
              <select value={v.exp_mode ?? 'definir'} onChange={e => set('exp_mode', e.target.value)} style={{ ...inp, marginBottom: 6 }}>
                <option value="definir">Définir une date</option>
                <option value="retirer">Retirer l'expiration</option>
              </select>
              {(v.exp_mode ?? 'definir') === 'definir' && <input type="datetime-local" value={v.date_expiration ?? ''} onChange={e => set('date_expiration', e.target.value)} style={inp} />}
            </Ligne>,
          ])}

          {methodes.length > 0 && section('🚚 Expédition', [
            <Ligne key="m" label="Méthodes d'expédition (remplace celles de chaque annonce)" actif={!!actifs.methodes} onToggle={() => tog('methodes')}>
              {methodes.map(m => (
                <label key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mChoisies.includes(m.id)} onChange={() => setMChoisies(l => (l.includes(m.id) ? l.filter(x => x !== m.id) : [...l, m.id]))} />
                  <span>{m.nom || m.transporteur_nom || `Méthode ${m.id}`}{m.libelle_prix ? <span style={{ color: T.light }}> · {m.libelle_prix}</span> : null}</span>
                </label>
              ))}
            </Ligne>,
          ])}

          {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{erreur}</div>}
        </div>

        <div style={{ padding: '12px 18px', background: '#fff', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button disabled={occupe || aucun} onClick={() => { setErreur(''); setConfirme(true); }}
            style={{ flex: 2, padding: 11, border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: aucun ? 0.5 : 1 }}>
            Appliquer à {ids.length} annonce{ids.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {confirme && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>✏️</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Modifier {ids.length} annonce{ids.length > 1 ? 's' : ''} ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 16px' }}>{nbActifs} champ{nbActifs > 1 ? 's seront remplacés' : ' sera remplacé'} sur chacune des annonces choisies.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirme(false)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Retour</button>
              <button disabled={occupe} onClick={enregistrer} style={{ flex: 1, padding: 10, border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{occupe ? 'En cours…' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}