// src/pages/admin/PageAdminVitrinesAddons.tsx
// e-Vend Studio — Dashboard admin : prix des ADD-ONS des sites vitrine (système parallèle au multi-vendeur).
// Même présentation que PageAdminVitrinesPrix. « Offert » décoché = plus proposé aux nouveaux ; ceux qui l'ont déjà le gardent.
// API : /api/admin/vitrines-addons

import { useState, useEffect } from 'react';

const API = '/api/admin/vitrines-addons';

interface Addon { code: string; nom: string; description: string; emoji: string; categorie: string; prix_ht: number; revenu_partage: boolean; actif: boolean; }
interface Saisie { prix: string; actif: boolean; }

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const versSaisie = (a: Addon): Saisie => ({ prix: a.prix_ht.toFixed(2).replace('.', ','), actif: a.actif });

export default function PageAdminVitrinesAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [saisie, setSaisie] = useState<Record<string, Saisie>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');
  const [sauve, setSauve] = useState(false);

  useEffect(() => { charger(); }, []);

  const recevoir = (liste: Addon[]) => {
    setAddons(liste);
    setSaisie(Object.fromEntries(liste.map(a => [a.code, versSaisie(a)])));
  };

  async function charger() {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(API, { headers: entetes(), credentials: 'include' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Impossible de charger les add-ons.');
      recevoir(d.addons || []);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    finally { setChargement(false); }
  }

  const change = (a: Addon) => {
    const s = saisie[a.code];
    return !!s && (s.prix !== versSaisie(a).prix || s.actif !== a.actif);
  };
  const modifies = addons.filter(change);
  const maj = (code: string, v: Partial<Saisie>) => setSaisie(p => ({ ...p, [code]: { ...p[code], ...v } }));

  async function enregistrer() {
    setSauve(true); setErreur('');
    try {
      let liste = addons;
      for (const a of modifies) {
        const r = await fetch(`${API}/${a.code}`, { method: 'PUT', headers: entetes(), credentials: 'include', body: JSON.stringify({ prix_ht: saisie[a.code].prix, actif: saisie[a.code].actif }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(`${a.nom} : ${d.message || 'enregistrement refusé.'}`);
        liste = d.addons || liste;
      }
      recevoir(liste);
      setOk('Add-ons enregistrés.'); setTimeout(() => setOk(''), 3500);
    } catch (e: any) { setErreur(e.message || "Erreur lors de l'enregistrement."); }
    finally { setSauve(false); }
  }

  if (chargement) return <div style={s.page}><p style={s.muet}>Chargement…</p></div>;

  return (
    <div style={s.page}>
      <div style={s.entete}>
        <div>
          <h1 style={s.titre}>🧩 Vitrines — prix des add-ons</h1>
          <p style={s.sousTitre}>Prix mensuels des add-ons offerts aux sites vitrine. Ils s'affichent dans « Mon plan & add-ons » du gestionnaire. Le nouveau prix s'applique aussi à ceux qui ont déjà l'add-on.</p>
        </div>
        {ok && <div style={s.badgeOk}>✓ {ok}</div>}
      </div>

      {erreur && <div style={s.erreur}>{erreur}</div>}

      <div style={s.carte}>
        <h2 style={s.h2}>Add-ons</h2>
        <p style={s.aide}>Décochez « Offert » pour ne plus le proposer. Les gestionnaires qui l'ont déjà le gardent et peuvent le désactiver.</p>
        {addons.map(a => {
          const v = saisie[a.code] || versSaisie(a);
          return (
            <div key={a.code} style={s.ligne}>
              <div style={{ flex: 3, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.emoji} {a.nom}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{a.categorie}</div>
              </div>
              <label style={s.champ}><span style={s.lbl}>Prix ($ / mois)</span>
                {a.revenu_partage
                  ? <span style={{ fontSize: 13, color: '#4ade80', padding: '8px 0' }}>Revenu partagé</span>
                  : <input style={s.input} inputMode="decimal" value={v.prix} onChange={e => maj(a.code, { prix: e.target.value.replace(/[^0-9.,]/g, '') })} />}
              </label>
              <label style={s.coche}><input type="checkbox" checked={v.actif} onChange={e => maj(a.code, { actif: e.target.checked })} /> Offert</label>
            </div>
          );
        })}
      </div>

      <div style={s.barreSave}>
        <button style={{ ...s.btnSave, opacity: modifies.length && !sauve ? 1 : 0.5 }} disabled={!modifies.length || sauve} onClick={enregistrer}>{sauve ? 'Enregistrement…' : '💾 Enregistrer'}</button>
        {modifies.length > 0 && <button style={s.btnLigne} onClick={charger}>Annuler les changements</button>}
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
  carte: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 },
  h2: { fontSize: 15, fontWeight: 700, margin: '0 0 6px' },
  aide: { fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', maxWidth: 700 },
  ligne: { display: 'flex', gap: 14, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' },
  champ: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 },
  lbl: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { flex: 1, minWidth: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  coche: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, paddingBottom: 9, color: 'rgba(255,255,255,0.8)' },
  barreSave: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 },
  btnSave: { background: '#c9a96e', border: 'none', color: '#111', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnLigne: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};