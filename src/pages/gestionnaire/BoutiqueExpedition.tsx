// CHEMIN : src/pages/gestionnaire/BoutiqueExpedition.tsx
// e-Vend Studio — Méthodes d'expédition du gestionnaire (templates boutique, solo).
// 4 modes de calcul (fixe, au kg, fixe + kg, par province), « gratuit dès X $ », combine shipping, transporteurs personnalisés,
// et livraison gratuite globale. Chaque annonce choisit ensuite ses méthodes. Le serveur recalcule toujours les frais.
// API : /api/boutique/gestionnaire/expedition

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Transporteur { id: number; nom: string; logo: string; }
interface Zone { non: boolean; prix: string; }
interface Fiche {
  mode: 'fixe' | 'kg' | 'fixe_kg' | 'zone';
  fixes: string; parKg: string; gratuit: string; delais: string;
  combine: boolean; fixeUnique: boolean; kgAdd: boolean;
  zones: Record<string, Zone>;
  nom: string; logo: string;
}
interface Props { gestionnaireId: number; accent?: string; }

const MODES: { v: Fiche['mode']; nom: string; aide: string }[] = [
  { v: 'fixe', nom: 'Frais fixe', aide: 'Un montant fixe.' },
  { v: 'kg', nom: 'Au kilo', aide: 'Un tarif par kg, selon le poids des produits.' },
  { v: 'fixe_kg', nom: 'Fixe + au kilo', aide: 'Un montant fixe, plus un tarif par kg.' },
  { v: 'zone', nom: 'Par province', aide: 'Un prix différent pour chaque province (ou aucune livraison).' },
];

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 5 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #e1e4e8', borderRadius: 8, padding: '9px 11px', fontSize: 14, fontFamily: 'inherit' };

export default function BoutiqueExpedition({ accent }: Props) {
  const couleur = accent || '#4f46e5';
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [idsPerso, setIdsPerso] = useState<number[]>([101, 102]);
  const [logosPerso, setLogosPerso] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [fiches, setFiches] = useState<Record<number, Fiche>>({});
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<{ type: 'erreur' | 'succes'; texte: string } | null>(null);
  // Livraison gratuite globale
  const [gAct, setGAct] = useState(false);
  const [gSeuil, setGSeuil] = useState('');
  const [gProvs, setGProvs] = useState<string[]>([]);
  const [gEnCours, setGEnCours] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, m, c] = await Promise.all([bq('/expedition/transporteurs'), bq('/expedition/methodes'), bq('/expedition/config')]);
      if (!t.ok) { setMsg({ type: 'erreur', texte: messageErreur(t) }); setChargement(false); return; }
      const provs: string[] = t.data.provinces || [];
      setTransporteurs(t.data.transporteurs || []);
      setIdsPerso(t.data.ids_personnalises || [101, 102]);
      setLogosPerso(t.data.logos_personnalises || []);
      setProvinces(provs);
      const f: Record<number, Fiche> = {};
      if (m.ok && Array.isArray(m.data)) {
        m.data.forEach((x: any) => {
          if (!x.actif) return;
          const zones: Record<string, Zone> = {};
          provs.forEach(p => {
            const v = x.frais_zones ? x.frais_zones[p] : undefined;
            zones[p] = { non: v === null || v === 'non', prix: v === null || v === undefined || v === 'non' ? '' : String(v) };
          });
          f[x.transporteur_id] = {
            mode: x.mode_calcul || 'fixe',
            fixes: x.frais_fixes === null || x.frais_fixes === undefined ? '' : String(Number(x.frais_fixes)),
            parKg: x.frais_par_kg === null || x.frais_par_kg === undefined ? '' : String(Number(x.frais_par_kg)),
            gratuit: x.gratuit_superieur === null || x.gratuit_superieur === undefined ? '' : String(Number(x.gratuit_superieur)),
            delais: x.delais_estime || '', combine: !!x.combine_shipping, fixeUnique: x.combine_frais_fixe_unique !== false, kgAdd: x.combine_kg_additionne !== false,
            zones, nom: x.nom_personnalise || '', logo: x.logo_personnalise || '',
          };
        });
      }
      setFiches(f);
      if (c.ok) {
        setGAct(!!c.data.livraison_gratuite_globale_actif);
        setGSeuil(c.data.livraison_gratuite_globale_seuil ? String(Number(c.data.livraison_gratuite_globale_seuil)) : '');
        setGProvs(c.data.livraison_gratuite_globale_provinces || []);
      }
      setChargement(false);
    })();
  }, []);

  if (chargement) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div>;

  const toutesLesIds = transporteurs.map(t => t.id).concat(idsPerso);
  const ficheVide = (id: number): Fiche => {
    const zones: Record<string, Zone> = {};
    provinces.forEach(p => { zones[p] = { non: false, prix: '' }; });
    return { mode: 'fixe', fixes: id === 13 || id === 14 ? '0' : '', parKg: '', gratuit: '', delais: '', combine: false, fixeUnique: true, kgAdd: true, zones, nom: '', logo: logosPerso[0] || '🚚' };
  };
  const bascule = (id: number) => {
    const n = { ...fiches };
    if (n[id]) { delete n[id]; if (ouvert === id) setOuvert(null); } else { n[id] = ficheVide(id); setOuvert(id); }
    setFiches(n);
  };
  const maj = (id: number, ch: Partial<Fiche>) => setFiches(f => ({ ...f, [id]: { ...f[id], ...ch } }));
  const majZone = (id: number, p: string, ch: Partial<Zone>) => setFiches(f => ({ ...f, [id]: { ...f[id], zones: { ...f[id].zones, [p]: { ...f[id].zones[p], ...ch } } } }));

  const sauvegarder = async () => {
    const methodes: any[] = [];
    for (const id of toutesLesIds) {
      const f = fiches[id]; if (!f) continue;
      const nomT = idsPerso.indexOf(id) >= 0 ? (f.nom || 'Transporteur personnalisé') : (transporteurs.filter(t => t.id === id)[0] || { nom: '' }).nom;
      if (f.mode === 'zone') {
        for (const p of provinces) if (!f.zones[p].non && f.zones[p].prix.trim() === '') { setMsg({ type: 'erreur', texte: `${nomT} : indiquez le prix pour ${p} (ou cochez « ne livre pas »).` }); setOuvert(id); return; }
      }
      const o: any = {
        transporteur_id: id, mode_calcul: f.mode, frais_fixes: f.fixes, frais_par_kg: f.parKg, gratuit_superieur: f.gratuit, delais_estime: f.delais,
        combine_shipping: f.combine, combine_frais_fixe_unique: f.fixeUnique, combine_kg_additionne: f.kgAdd,
      };
      if (f.mode === 'zone') { o.frais_zones = {}; provinces.forEach(p => { o.frais_zones[p] = f.zones[p].non ? null : f.zones[p].prix; }); }
      if (idsPerso.indexOf(id) >= 0) { o.nom_personnalise = f.nom; o.logo_personnalise = f.logo; }
      methodes.push(o);
    }
    setEnCours(true);
    const r = await bq('/expedition/methodes', { method: 'PUT', body: { methodes } });
    setEnCours(false);
    setMsg(r.ok ? { type: 'succes', texte: 'Vos méthodes d’expédition sont enregistrées. Choisissez-les ensuite dans chaque annonce.' } : { type: 'erreur', texte: messageErreur(r) });
  };

  const sauverGratuite = async () => {
    setGEnCours(true);
    const r = await bq('/expedition/config', { method: 'PATCH', body: { livraison_gratuite_globale_actif: gAct, livraison_gratuite_globale_seuil: gSeuil, livraison_gratuite_globale_provinces: gProvs } });
    setGEnCours(false);
    setMsg(r.ok ? { type: 'succes', texte: 'Livraison gratuite enregistrée.' } : { type: 'erreur', texte: messageErreur(r) });
  };

  const aucune = Object.keys(fiches).length === 0;

  const carteTransporteur = (id: number, nom: string, logo: string) => {
    const f = fiches[id]; const actif = !!f; const estOuvert = ouvert === id && actif;
    return (
      <div key={id} style={{ border: `2px solid ${actif ? couleur : '#e1e4e8'}`, borderRadius: 12, background: actif ? '#fafaff' : '#fff', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={() => (actif ? setOuvert(estOuvert ? null : id) : bascule(id))}>
          <input type="checkbox" checked={actif} onChange={() => bascule(id)} onClick={e => e.stopPropagation()} style={{ width: 17, height: 17 }} />
          <span style={{ fontSize: 22 }}>{actif && idsPerso.indexOf(id) >= 0 ? f.logo : logo}</span>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#1a2332' }}>{actif && idsPerso.indexOf(id) >= 0 && f.nom ? f.nom : nom}</div>
          {actif && <span style={{ fontSize: 12, color: '#6b7280' }}>{MODES.filter(m => m.v === f.mode)[0].nom} {estOuvert ? '▲' : '▼'}</span>}
        </div>
        {estOuvert && f && (
          <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #eef0f3' }}>
            {idsPerso.indexOf(id) >= 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, margin: '12px 0' }}>
                <div><label style={lbl}>Nom du transporteur</label><input value={f.nom} onChange={e => maj(id, { nom: e.target.value })} maxLength={100} style={champ} /></div>
                <div><label style={lbl}>Logo</label>
                  <select value={f.logo} onChange={e => maj(id, { logo: e.target.value })} style={champ}>{logosPerso.map(l => <option key={l} value={l}>{l}</option>)}</select>
                </div>
              </div>
            )}
            <label style={{ ...lbl, marginTop: 12 }}>Calcul des frais</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {MODES.map(m => (
                <button key={m.v} type="button" onClick={() => maj(id, { mode: m.v })} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${f.mode === m.v ? couleur : '#e1e4e8'}`, background: f.mode === m.v ? couleur : '#fff', color: f.mode === m.v ? '#fff' : '#1a2332', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{m.nom}</button>
              ))}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>{MODES.filter(m => m.v === f.mode)[0].aide}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {(f.mode === 'fixe' || f.mode === 'fixe_kg') && <div><label style={lbl}>Frais fixe ($)</label><input type="number" min="0" step="0.01" value={f.fixes} onChange={e => maj(id, { fixes: e.target.value })} style={champ} /></div>}
              {(f.mode === 'kg' || f.mode === 'fixe_kg') && <div><label style={lbl}>Prix par kg ($)</label><input type="number" min="0" step="0.01" value={f.parKg} onChange={e => maj(id, { parKg: e.target.value })} style={champ} /></div>}
              <div><label style={lbl}>Gratuit dès ($)</label><input type="number" min="0" step="0.01" value={f.gratuit} onChange={e => maj(id, { gratuit: e.target.value })} placeholder="Jamais" style={champ} /></div>
              <div><label style={lbl}>Délai estimé</label><input value={f.delais} onChange={e => maj(id, { delais: e.target.value })} maxLength={100} placeholder="Ex : 3 à 5 jours" style={champ} /></div>
            </div>

            {f.mode === 'zone' && (
              <div style={{ marginTop: 14 }}>
                <label style={lbl}>Prix par province</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {provinces.map(p => (
                    <div key={p} style={{ border: '1px solid #e1e4e8', borderRadius: 8, padding: 8, background: f.zones[p].non ? '#f9fafb' : '#fff' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p}</div>
                      <input type="number" min="0" step="0.01" disabled={f.zones[p].non} value={f.zones[p].prix} onChange={e => majZone(id, p, { prix: e.target.value })} placeholder="$" style={{ ...champ, padding: '6px 8px', marginBottom: 4 }} />
                      <label style={{ fontSize: 11, color: '#6b7280', display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.zones[p].non} onChange={e => majZone(id, p, { non: e.target.checked })} />ne livre pas</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {f.mode !== 'zone' && (
              <div style={{ marginTop: 14, background: '#f9fafb', borderRadius: 10, padding: 12 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.combine} onChange={e => maj(id, { combine: e.target.checked })} />Combiner l’expédition de plusieurs produits (combine shipping)
                </label>
                {f.combine && (
                  <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 13 }}>
                    {(f.mode === 'fixe' || f.mode === 'fixe_kg') && <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.fixeUnique} onChange={e => maj(id, { fixeUnique: e.target.checked })} />Un seul frais fixe pour toute la commande</label>}
                    {(f.mode === 'kg' || f.mode === 'fixe_kg') && <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.kgAdd} onChange={e => maj(id, { kgAdd: e.target.checked })} />Additionner les poids (sinon, seul le plus lourd compte)</label>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 0 40px', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#1a2332' }}>🚚 Méthodes d’expédition</h2>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
        Cochez les transporteurs que vous utilisez et réglez vos tarifs. Dans chaque annonce, vous choisirez ensuite les méthodes offertes. Sans méthode, la livraison est gratuite.
      </p>

      {transporteurs.map(t => carteTransporteur(t.id, t.nom, t.logo))}
      {idsPerso.map((id, i) => carteTransporteur(id, `Transporteur personnalisé ${i + 1}`, '🚚'))}

      <button onClick={sauvegarder} disabled={enCours} style={{ width: '100%', padding: 13, border: 'none', borderRadius: 10, background: couleur, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', margin: '10px 0 28px' }}>
        {enCours ? '⏳ Enregistrement…' : aucune ? '💾 Enregistrer (aucune méthode : livraison gratuite)' : '💾 Enregistrer mes méthodes'}
      </button>

      <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 14, padding: 22 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#1a2332' }}>🎁 Livraison gratuite dès un montant</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>Offrez la livraison à vos clients quand leur commande atteint un montant, partout ou dans certaines provinces.</p>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={gAct} onChange={e => setGAct(e.target.checked)} style={{ width: 17, height: 17 }} />Activer
        </label>
        {gAct && (
          <>
            <div style={{ maxWidth: 220, marginBottom: 12 }}><label style={lbl}>Montant d’achat minimum ($)</label><input type="number" min="0" step="0.01" value={gSeuil} onChange={e => setGSeuil(e.target.value)} style={champ} /></div>
            <label style={lbl}>Provinces concernées (aucune cochée = toutes)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {provinces.map(p => {
                const on = gProvs.indexOf(p) >= 0;
                return <button key={p} type="button" onClick={() => setGProvs(on ? gProvs.filter(x => x !== p) : gProvs.concat([p]))} style={{ padding: '5px 12px', borderRadius: 16, border: `1px solid ${on ? couleur : '#e1e4e8'}`, background: on ? couleur : '#fff', color: on ? '#fff' : '#1a2332', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{p}</button>;
              })}
            </div>
          </>
        )}
        <button onClick={sauverGratuite} disabled={gEnCours} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: couleur, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{gEnCours ? '⏳…' : '💾 Enregistrer'}</button>
      </div>

      {msg && <BoutiqueModale type={msg.type} accent={couleur} message={msg.texte} onFermer={() => setMsg(null)} />}
    </div>
  );
}