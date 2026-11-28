// src/pages/admin/PageAdminLocationsPrix.tsx
// e-Vend Studio — Dashboard admin : grille de prix du template LOCATION DE BIENS (reservation-location). Même présentation que PageAdminCagnotte.
// Paliers selon le nombre d'annonces de location permises (ex. 10 annonces = X $, 30 annonces = Y $). Aucun prix n'est écrit dans le code :
// ce qui est réglé ici s'affiche dans « Choisir un template » et dans la galerie publique des templates.
// API : /api/admin/locations-prix (lecture publique des prix : /api/locations/prix). Grille vide = le template garde le prix de sa sous-catégorie « Formulaires & Réservations ».

import { useState, useEffect, useMemo } from 'react';

const API = '/api/admin/locations-prix';

interface PalierSaisie { nom: string; limite: string; prix: string; }

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const argent = (n: number, devise: string, suffixe: string) =>
  `${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)}${suffixe ? ' ' + suffixe : ''}`;
const nombre = (v: string): number => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

export default function PageAdminLocationsPrix() {
  const [paliers, setPaliers] = useState<PalierSaisie[]>([]);
  const [devise, setDevise] = useState('CAD');
  const [suffixe, setSuffixe] = useState('/ mois');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');
  const [sauve, setSauve] = useState(false);
  const [modifie, setModifie] = useState(false);

  useEffect(() => { charger(); }, []);

  const versSaisie = (d: any) => {
    setPaliers((d.paliers || []).map((p: any) => ({ nom: String(p.nom || ''), limite: String(p.limite), prix: String(p.prix).replace('.', ',') })));
    setDevise(d.devise || 'CAD'); setSuffixe(d.suffixe || '');
  };

  async function charger() {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(API, { headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Impossible de charger la grille.');
      versSaisie(d); setModifie(false);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }

  function flash(m: string) { setOk(m); setTimeout(() => setOk(''), 3500); }
  function majPalier(i: number, p: Partial<PalierSaisie>) { setPaliers(a => a.map((x, j) => (j === i ? { ...x, ...p } : x))); setModifie(true); }

  async function enregistrer() {
    setSauve(true); setErreur('');
    try {
      const corps = { paliers: paliers.map(p => ({ nom: p.nom.trim(), limite: nombre(p.limite), prix: nombre(p.prix) })), devise, suffixe: suffixe.trim() };
      const r = await fetch(API, { method: 'PUT', headers: entetes(), body: JSON.stringify(corps) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Enregistrement refusé.');
      versSaisie(d); setModifie(false);
      flash(d.paliers && d.paliers.length ? "Grille enregistrée — appliquée au template de location de biens." : 'Grille vidée — le template reprend le prix de sa sous-catégorie.');
    } catch (e: any) { setErreur(e.message || "Erreur lors de l'enregistrement."); }
    finally { setSauve(false); }
  }

  // Aperçu de ce que voit le gestionnaire
  const apercu = useMemo(() => paliers
    .map(p => ({ nom: p.nom.trim(), limite: parseInt(p.limite, 10), prix: nombre(p.prix) }))
    .filter(p => Number.isInteger(p.limite) && p.limite > 0 && Number.isFinite(p.prix))
    .sort((a, b) => a.limite - b.limite), [paliers]);

  if (chargement) return <div style={s.page}><p style={s.muet}>Chargement…</p></div>;

  return (
    <div style={s.page}>
      <div style={s.entete}>
        <div>
          <h1 style={s.titre}>🏠 Locations — grille de prix</h1>
          <p style={s.sousTitre}>Une grille pour la location de biens : chaque palier = un nombre maximum d'annonces de location et son prix. Elle s'affiche dans « Choisir un template » et dans la galerie publique.</p>
        </div>
        {ok && <div style={s.badgeOk}>✓ {ok}</div>}
      </div>

      {erreur && <div style={s.erreur}>{erreur}</div>}

      {/* PALIERS */}
      <div style={s.carte}>
        <h2 style={s.h2}>Paliers de prix</h2>
        <p style={s.aide}>Chaque palier = le nombre d'annonces de location permises et son prix. Si vous videz la grille, le template reprend le prix de sa sous-catégorie « Formulaires & Réservations ».</p>
        {paliers.map((p, i) => (
          <div key={i} style={s.ligne}>
            <input style={{ ...s.input, flex: 2 }} value={p.nom} placeholder="Nom du palier" maxLength={40} onChange={e => majPalier(i, { nom: e.target.value })} />
            <label style={s.champ}><span style={s.lbl}>Annonces max.</span>
              <input style={s.input} inputMode="numeric" value={p.limite} placeholder="25" onChange={e => majPalier(i, { limite: e.target.value.replace(/\D/g, '') })} /></label>
            <label style={s.champ}><span style={s.lbl}>Prix ($)</span>
              <input style={s.input} inputMode="decimal" value={p.prix} placeholder="14,99" onChange={e => majPalier(i, { prix: e.target.value.replace(/[^0-9.,]/g, '') })} /></label>
            <button style={s.btnX} title="Supprimer ce palier" onClick={() => { setPaliers(a => a.filter((_, j) => j !== i)); setModifie(true); }}>✕</button>
          </div>
        ))}
        <button style={s.btnAjout} disabled={paliers.length >= 10}
          onClick={() => { setPaliers(a => [...a, { nom: 'Nouveau palier', limite: '', prix: '' }]); setModifie(true); }}>+ Ajouter un palier</button>
        {apercu.length > 0 && (
          <div style={s.exemple}>
            <p style={s.lbl}>Aperçu (ce que voit le gestionnaire)</p>
            {apercu.map((x, i) => <p key={i} style={s.exLigne}>{x.nom || `${x.limite} annonces`} : <b>{argent(x.prix, devise, suffixe.trim())}</b> · jusqu'à {x.limite} annonce{x.limite > 1 ? 's' : ''} active{x.limite > 1 ? 's' : ''}</p>)}
            <p style={{ ...s.exLigne, color: 'rgba(255,255,255,0.45)' }}>Les cartes de templates affichent « À partir de {argent(Math.min(...apercu.map(x => x.prix)), devise, suffixe.trim())} ».</p>
          </div>
        )}
      </div>

      {/* DEVISE / TEXTE */}
      <div style={s.carte}>
        <h2 style={s.h2}>Affichage du prix</h2>
        <div style={s.grille}>
          <label style={s.champ}><span style={s.lbl}>Devise</span>
            <select style={s.input} value={devise} onChange={e => { setDevise(e.target.value); setModifie(true); }}><option value="CAD">CAD</option><option value="USD">USD</option></select></label>
          <label style={s.champ}><span style={s.lbl}>Texte après le prix</span>
            <input style={s.input} maxLength={20} value={suffixe} placeholder="/ mois" onChange={e => { setSuffixe(e.target.value); setModifie(true); }} /></label>
        </div>
      </div>

      <div style={s.barreSave}>
        <button style={{ ...s.btnSave, opacity: modifie && !sauve ? 1 : 0.5 }} disabled={!modifie || sauve} onClick={enregistrer}>{sauve ? 'Enregistrement…' : '💾 Enregistrer la grille'}</button>
        {modifie && <button style={s.btnLigne} onClick={charger}>Annuler les changements</button>}
        <span style={s.muet}>Affichage seulement pour l'instant.</span>
      </div>
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