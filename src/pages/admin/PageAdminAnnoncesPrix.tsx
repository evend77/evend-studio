// src/pages/admin/PageAdminAnnoncesPrix.tsx
// e-Vend Studio — Dashboard admin : grille de prix UNIQUE des templates de petites annonces (annonces-*).
// Paliers selon le nombre d'annonces actives (ex. 25 annonces = X $, 50 annonces = Y $). Aucun prix n'est écrit dans le code :
// ce qui est réglé ici s'affiche dans « Choisir un template », dans la galerie publique des templates et sert de limite d'annonces.
// API : /api/admin/annonces-prix (lecture publique des prix : /api/annonces/prix). Grille vide = chaque template garde ses « Prix Template ».

import { useState, useEffect } from 'react';

const API = '/api/admin/annonces-prix';

interface PalierSaisie { nom: string; limite: string; prix: string; }

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const argent = (n: number, devise: string, suffixe: string) =>
  `${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)}${suffixe ? ' ' + suffixe : ''}`;
const nombre = (v: string): number => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

export default function PageAdminAnnoncesPrix() {
  const [paliers, setPaliers] = useState<PalierSaisie[]>([]);
  const [devise, setDevise] = useState('CAD');
  const [suffixe, setSuffixe] = useState('/ mois');
  const [chargement, setChargement] = useState(true);
  const [sauve, setSauve] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(API, { headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Impossible de charger la grille.');
      setPaliers((d.paliers || []).map((p: any) => ({ nom: String(p.nom || ''), limite: String(p.limite), prix: String(p.prix).replace('.', ',') })));
      setDevise(d.devise || 'CAD'); setSuffixe(d.suffixe || ''); setModifie(false);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }

  const flash = (m: string) => { setOk(m); setTimeout(() => setOk(''), 4000); };
  const maj = (i: number, p: Partial<PalierSaisie>) => { setPaliers((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x))); setModifie(true); };
  const ajouter = () => { setPaliers((a) => [...a, { nom: '', limite: '', prix: '' }]); setModifie(true); };
  const retirer = (i: number) => { setPaliers((a) => a.filter((_, j) => j !== i)); setModifie(true); };

  async function enregistrer() {
    setSauve(true); setErreur('');
    try {
      const corps = { paliers: paliers.map((p) => ({ nom: p.nom.trim(), limite: nombre(p.limite), prix: nombre(p.prix) })), devise, suffixe: suffixe.trim() };
      const r = await fetch(API, { method: 'PUT', headers: entetes(), body: JSON.stringify(corps) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Enregistrement refusé.');
      setPaliers((d.paliers || []).map((p: any) => ({ nom: String(p.nom || ''), limite: String(p.limite), prix: String(p.prix).replace('.', ',') })));
      setDevise(d.devise || 'CAD'); setSuffixe(d.suffixe || ''); setModifie(false);
      flash(d.paliers && d.paliers.length ? 'Grille enregistrée — elle s\'applique à tous les templates de petites annonces.' : 'Grille vidée — les templates reprennent leurs « Prix Template ».');
    } catch (e: any) { setErreur(e.message || 'Erreur lors de l\'enregistrement.'); }
    finally { setSauve(false); }
  }

  if (chargement) return <div style={s.page}><p style={s.muet}>Chargement…</p></div>;

  const apercu = paliers
    .map((p) => ({ nom: p.nom.trim(), limite: parseInt(p.limite, 10), prix: nombre(p.prix) }))
    .filter((p) => Number.isInteger(p.limite) && p.limite > 0 && Number.isFinite(p.prix))
    .sort((a, b) => a.limite - b.limite);

  return (
    <div style={s.page}>
      <h1 style={s.titre}>📋 Annonces — grille de prix</h1>
      <p style={s.intro}>
        Une seule grille pour <b>tous</b> les templates de petites annonces. Chaque palier = un <b>nombre maximum d'annonces actives</b> et son prix.
        Ce que vous réglez ici s'affiche dans « Choisir un template » et dans la galerie publique, et le serveur refuse de publier au-delà de la limite du palier choisi.
      </p>

      {erreur && <div style={s.erreur}>{erreur}</div>}
      {ok && <div style={s.succes}>{ok}</div>}

      <div style={s.carte}>
        <div style={s.entete}>
          <span style={{ ...s.col, flex: 2 }}>Nom du palier</span>
          <span style={{ ...s.col, width: 130 }}>Annonces max.</span>
          <span style={{ ...s.col, width: 130 }}>Prix</span>
          <span style={{ width: 34 }} />
        </div>
        {paliers.length === 0 && <p style={{ ...s.muet, padding: '10px 4px' }}>Aucun palier : chaque template de petites annonces garde son propre « Prix Template ». Ajoutez un palier pour activer la grille unique.</p>}
        {paliers.map((p, i) => (
          <div key={i} style={s.ligne}>
            <input style={{ ...s.input, flex: 2 }} placeholder="Ex. Départ" maxLength={40} value={p.nom} onChange={(e) => maj(i, { nom: e.target.value })} />
            <input style={{ ...s.input, width: 130 }} placeholder="25" inputMode="numeric" value={p.limite} onChange={(e) => maj(i, { limite: e.target.value.replace(/[^0-9]/g, '') })} />
            <input style={{ ...s.input, width: 130 }} placeholder="14,99" inputMode="decimal" value={p.prix} onChange={(e) => maj(i, { prix: e.target.value.replace(/[^0-9.,]/g, '') })} />
            <button style={s.btnX} onClick={() => retirer(i)} title="Retirer ce palier">✕</button>
          </div>
        ))}
        <button style={s.btnAjout} onClick={ajouter} disabled={paliers.length >= 10}>+ Ajouter un palier</button>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
          <label style={s.lbl}>Devise
            <select style={s.input} value={devise} onChange={(e) => { setDevise(e.target.value); setModifie(true); }}><option value="CAD">CAD ($ canadien)</option><option value="USD">USD ($ américain)</option></select>
          </label>
          <label style={s.lbl}>Texte après le prix
            <input style={s.input} maxLength={20} placeholder="/ mois" value={suffixe} onChange={(e) => { setSuffixe(e.target.value); setModifie(true); }} />
          </label>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{ ...s.btnSauve, opacity: modifie && !sauve ? 1 : 0.55 }} disabled={!modifie || sauve} onClick={enregistrer}>{sauve ? 'Enregistrement…' : '💾 Enregistrer la grille'}</button>
          {modifie && <button style={s.btnLigne} onClick={charger}>Annuler les changements</button>}
        </div>
      </div>

      {apercu.length > 0 && (
        <div style={s.carte}>
          <h3 style={s.sousTitre}>Aperçu (ce que voit le gestionnaire)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            {apercu.map((p, i) => (
              <div key={i} style={s.tuile}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#7dffd5', textTransform: 'uppercase' }}>{p.nom || `${p.limite} annonces`}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '2px 0' }}>{argent(p.prix, devise, suffixe.trim())}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Jusqu'à {p.limite} annonce{p.limite > 1 ? 's' : ''} active{p.limite > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          <p style={{ ...s.muet, marginTop: 12 }}>Les cartes de templates affichent « À partir de {argent(Math.min(...apercu.map((p) => p.prix)), devise, suffixe.trim())} ».</p>
        </div>
      )}

      <div style={s.note}>
        <b>À savoir.</b> Seules les annonces <i>actives</i> (non expirées, non vendues, non archivées) comptent dans la limite. Un gestionnaire garde son palier s'il change de template d'annonces.
        Si vous <b>videz</b> la grille, les templates reviennent à leurs « Prix Template » individuels.
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', maxWidth: 900, color: '#fff', fontFamily: 'inherit' },
  titre: { fontSize: 26, fontWeight: 800, margin: '0 0 8px' },
  intro: { fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', margin: '0 0 20px' },
  muet: { fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 },
  carte: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 22px', marginBottom: 18 },
  entete: { display: 'flex', gap: 8, padding: '0 0 6px', alignItems: 'center' },
  col: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  ligne: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  input: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 14, padding: '9px 11px', fontFamily: 'inherit', minWidth: 0, boxSizing: 'border-box' },
  lbl: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' },
  btnX: { width: 34, height: 34, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 8, cursor: 'pointer' },
  btnAjout: { marginTop: 6, background: 'transparent', border: '1px dashed rgba(255,255,255,0.25)', color: '#fff', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnSauve: { background: '#0f766e', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnLigne: { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13 },
  sousTitre: { fontSize: 15, fontWeight: 800, margin: '0 0 12px' },
  tuile: { borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.25)' },
  erreur: { background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 14 },
  succes: { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 14 },
  note: { fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', padding: '4px 2px' },
};