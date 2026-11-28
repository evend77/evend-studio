// src/pages/admin/PageAdminVitrinesPrix.tsx
// e-Vend Studio — Dashboard admin : prix des sites VITRINE, UN PRIX PAR SOUS-CATÉGORIE (pas de paliers : une vitrine n'a pas de produits).
// Même présentation que PageAdminCagnotte. Tous les templates d'une sous-catégorie ont le prix de leur sous-catégorie ; il s'affiche dans
// « Choisir un template » et dans la galerie publique. Une sous-catégorie sans prix saisi garde son ancien prix (« Prix Template »).
// API : /api/admin/vitrines-prix (lecture publique des prix : /api/vitrines/prix).

import { useState, useEffect } from 'react';

const API = '/api/admin/vitrines-prix';

// Sous-catégories de la catégorie Vitrines — mêmes ids que Template.groupe dans PageTemplates.tsx
const GROUPES: { id: string; icone: string; label: string; desc: string }[] = [
  { id: 'vitrine',         icone: '🖼',  label: 'Sites vitrine (sans formulaire)',  desc: 'Présence en ligne simple — carte, galerie, présentation.' },
  { id: 'vitrine-contact', icone: '✉️', label: 'Sites vitrine (avec formulaire)',  desc: 'Portfolio, CV, pages pro avec formulaire de contact.' },
  { id: 'cours',           icone: '🎹', label: 'Cours & Formation',                desc: 'Portfolio artistique et page de cours.' },
  { id: 'resto',           icone: '🍔', label: 'Restaurant & Fast Food',           desc: 'Menu, réservation de table, avis.' },
  { id: 'profession',      icone: '💼', label: 'Profession',                       desc: 'Sites professionnels dédiés aux métiers.' },
  { id: 'reservation',     icone: '📅', label: 'Formulaires & Réservations',       desc: 'Système de réservation intégré.' },
];

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const argent = (n: number, devise: string, suffixe: string) =>
  n === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)}${suffixe ? ' ' + suffixe : ''}`;
const nombre = (v: string): number => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

export default function PageAdminVitrinesPrix() {
  const [prix, setPrix] = useState<Record<string, string>>({});
  const [devise, setDevise] = useState('CAD');
  const [suffixe, setSuffixe] = useState('/ mois');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');
  const [sauve, setSauve] = useState(false);
  const [modifie, setModifie] = useState(false);

  useEffect(() => { charger(); }, []);

  const versSaisie = (d: any) => {
    const m: Record<string, string> = {};
    for (const g of GROUPES) { const v = d.prix && d.prix[g.id]; if (v !== undefined && v !== null) m[g.id] = String(v).replace('.', ','); }
    setPrix(m); setDevise(d.devise || 'CAD'); setSuffixe(d.suffixe || '');
  };

  async function charger() {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(API, { headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Impossible de charger les prix.');
      versSaisie(d); setModifie(false);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }

  function flash(m: string) { setOk(m); setTimeout(() => setOk(''), 3500); }
  function majPrix(id: string, v: string) { setPrix(p => ({ ...p, [id]: v })); setModifie(true); }

  async function enregistrer() {
    setSauve(true); setErreur('');
    try {
      const corps: Record<string, number> = {};
      for (const g of GROUPES) { const n = nombre(prix[g.id] || ''); if (Number.isFinite(n)) corps[g.id] = n; }
      const r = await fetch(API, { method: 'PUT', headers: entetes(), body: JSON.stringify({ prix: corps, devise, suffixe: suffixe.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Enregistrement refusé.');
      versSaisie(d); setModifie(false);
      flash('Prix enregistrés — appliqués à tous les templates de chaque sous-catégorie.');
    } catch (e: any) { setErreur(e.message || "Erreur lors de l'enregistrement."); }
    finally { setSauve(false); }
  }

  if (chargement) return <div style={s.page}><p style={s.muet}>Chargement…</p></div>;

  return (
    <div style={s.page}>
      <div style={s.entete}>
        <div>
          <h1 style={s.titre}>🖼 Vitrines — prix par sous-catégorie</h1>
          <p style={s.sousTitre}>Une vitrine n'a pas de produits : pas de paliers, un seul prix par sous-catégorie. Tous les templates d'une sous-catégorie ont son prix, affiché dans « Choisir un template » et dans la galerie publique.</p>
        </div>
        {ok && <div style={s.badgeOk}>✓ {ok}</div>}
      </div>

      {erreur && <div style={s.erreur}>{erreur}</div>}

      <div style={s.carte}>
        <h2 style={s.h2}>Prix des sous-catégories</h2>
        <p style={s.aide}>Laissez un champ vide pour que la sous-catégorie garde le prix qu'elle avait avant. Un prix de 0 affiche « Gratuit ».</p>
        {GROUPES.map(g => {
          const n = nombre(prix[g.id] || '');
          return (
            <div key={g.id} style={s.ligne}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{g.icone} {g.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{g.desc}</div>
              </div>
              <label style={s.champ}><span style={s.lbl}>Prix ($)</span>
                <input style={s.input} inputMode="decimal" value={prix[g.id] || ''} placeholder="—" onChange={e => majPrix(g.id, e.target.value.replace(/[^0-9.,]/g, ''))} /></label>
              <div style={{ flex: 1, minWidth: 120, fontSize: 13, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end', paddingBottom: 10 }}>
                {Number.isFinite(n) ? <b style={{ color: '#fff' }}>{argent(n, devise, suffixe.trim())}</b> : <span style={{ color: 'rgba(255,255,255,0.4)' }}>prix précédent</span>}
              </div>
            </div>
          );
        })}
      </div>

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
        <button style={{ ...s.btnSave, opacity: modifie && !sauve ? 1 : 0.5 }} disabled={!modifie || sauve} onClick={enregistrer}>{sauve ? 'Enregistrement…' : '💾 Enregistrer les prix'}</button>
        {modifie && <button style={s.btnLigne} onClick={charger}>Annuler les changements</button>}
        <span style={s.muet}>Les prix s'affichent tels quels sur les cartes de templates.</span>
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