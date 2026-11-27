// src/pages/gestionnaire/ApparenceClassique.tsx
// e-Vend Studio — Éditeur d'apparence des templates « Classique » des petites annonces (Généraliste, Auto, Immobilier) :
// couleurs, polices, photos, textes, réseaux et sections (afficher / masquer / réordonner).
// Contrôle des liens/couleurs (normaliserConfig) avant l'enregistrement ; le site le refait à l'affichage ; le texte est nettoyé côté serveur.

import { useState, useEffect } from 'react';
import ChampPhotos from './ChampPhotos';
import { ChampEditeur, entetes, champ, lbl, carte, btn, petit } from './ApparenceAutoShowroom';
import { normaliserConfig, SCHEMA, SECTIONS_INFO, SECTION_IDS, RESEAUX, type ConfigClassique, type DefautClassique, type SectionId } from '../../templates/annoncesSite/classiqueConfig';

interface Props { gestionnaireId: number; templateId: string; defaut: DefautClassique; }

export default function ApparenceClassique({ gestionnaireId, templateId, defaut }: Props) {
  const [cfg, setCfg] = useState<ConfigClassique>(() => normaliserConfig({}, defaut));
  const [ouverte, setOuverte] = useState<SectionId | 'general' | null>('general');
  const [occupe, setOccupe] = useState(false);
  const [charge, setCharge] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4500); };

  useEffect(() => {
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { setCfg(normaliserConfig(d && d.config && d.config.annonces, defaut)); }).catch(() => {}).finally(() => setCharge(true));
  }, [gestionnaireId]);

  const maj = (p: Partial<ConfigClassique>) => setCfg((c) => ({ ...c, ...p }));
  const majContenu = (id: SectionId, k: string, v: any) => setCfg((c) => ({ ...c, contenu: { ...c.contenu, [id]: { ...c.contenu[id], [k]: v } } }));
  const deplacer = (i: number, d: number) => setCfg((c) => { const j = i + d; if (j < 0 || j >= c.sections.length) return c; const a = [...c.sections]; [a[i], a[j]] = [a[j], a[i]]; return { ...c, sections: a }; });
  const majSection = (i: number, p: Partial<ConfigClassique['sections'][0]>) => setCfg((c) => ({ ...c, sections: c.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) }));

  const sauver = async () => {
    setOccupe(true);
    try {
      const propre = normaliserConfig(cfg, defaut); // assainissement avant enregistrement
      const r = await fetch(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', headers: entetes(), credentials: 'include', body: JSON.stringify({ config: { annonces: propre }, template_id: templateId }) });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch { /* ignore */ } throw new Error(d.message || 'Erreur.'); }
      setCfg(propre); flash(true, 'Apparence enregistrée. Votre site est à jour.');
    } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };

  const reinitSection = (id: SectionId) => { if (window.confirm('Remettre les textes et photos de cette section aux valeurs d\'origine ?')) setCfg((c) => ({ ...c, contenu: { ...c.contenu, [id]: normaliserConfig({}, defaut).contenu[id] } })); };

  if (!charge) return <p style={{ color: '#6b7280' }}>Chargement…</p>;
  return (
    <div>
      <datalist id="liens-sections">{SECTION_IDS.map((id) => <option key={id} value={`#${id}`}>{SECTIONS_INFO[id].nom}</option>)}</datalist>
      {msg && <div style={{ background: msg.ok ? '#dcfce7' : '#fee2e2', color: msg.ok ? '#166534' : '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{msg.t}</div>}

      <div style={carte}>
        <button onClick={() => setOuverte(ouverte === 'general' ? null : 'general')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 800, padding: 0, fontFamily: 'inherit', color: '#111827' }}>
          <span>🎨 Général : nom, logo, couleurs, coordonnées</span><span>{ouverte === 'general' ? '▲' : '▼'}</span>
        </button>
        {ouverte === 'general' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={lbl}>Nom du site</label><input style={champ} maxLength={60} value={cfg.nomSite} onChange={(e) => maj({ nomSite: e.target.value })} /></div>
              <div><ChampPhotos gestionnaireId={gestionnaireId} etiquette="Logo" valeur={cfg.logoUrl ? [cfg.logoUrl] : []} onChange={(a) => maj({ logoUrl: a[0] || '' })} max={1} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, margin: '12px 0' }}>
              {([['couleurPrincipale', 'Couleur principale'], ['couleurFond', 'Fond de la page'], ['couleurTexte', 'Couleur du texte'], ['couleurEntete', 'Fond de l\'en-tête'], ['couleurPied', 'Fond du pied de page']] as const).map(([k, l]) => (
                <div key={k}><label style={lbl}>{l}</label><input type="color" style={{ ...champ, padding: 3, height: 40 }} value={cfg[k]} onChange={(e) => maj({ [k]: e.target.value } as any)} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 12, maxWidth: 260 }}><label style={lbl}>Police des titres</label><select style={champ} value={cfg.police} onChange={(e) => maj({ police: e.target.value as ConfigClassique['police'] })}><option value="classique">Classique (serif)</option><option value="moderne">Moderne (sans-serif)</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              <div><label style={lbl}>Téléphone</label><input style={champ} maxLength={25} value={cfg.telephone} onChange={(e) => maj({ telephone: e.target.value })} /></div>
              <div><label style={lbl}>Courriel affiché</label><input style={champ} type="email" maxLength={200} value={cfg.courriel} onChange={(e) => maj({ courriel: e.target.value })} /></div>
              <div><label style={lbl}>Adresse</label><input style={champ} maxLength={160} value={cfg.adresse} onChange={(e) => maj({ adresse: e.target.value })} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={cfg.afficherPropulse} onChange={(e) => maj({ afficherPropulse: e.target.checked })} />Afficher « Propulsé par e-Vend Studio » dans le pied de page</label>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '6px 0 0' }}>Les messages des visiteurs arrivent à votre courriel de compte, même si vous laissez « Courriel affiché » vide.</p>
            <label style={{ ...lbl, marginTop: 14 }}>Réseaux sociaux (adresses https://…, laissez vide pour masquer)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {RESEAUX.map((k) => <div key={k}><label style={{ ...lbl, fontWeight: 600, textTransform: 'capitalize' }}>{k}</label><input style={champ} maxLength={600} value={cfg.reseaux[k]} placeholder="https://…" onChange={(e) => maj({ reseaux: { ...cfg.reseaux, [k]: e.target.value } })} /></div>)}
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 2px 10px' }}>Sections du site, dans l'ordre d'affichage. Utilisez ↑ ↓ pour les déplacer et la case pour les retirer.</p>
      {cfg.sections.map((sec, i) => {
        const info = SECTIONS_INFO[sec.id];
        const ouv = ouverte === sec.id;
        const champs = SCHEMA[sec.id];
        return (
          <div key={sec.id} style={{ ...carte, padding: 0, opacity: sec.visible ? 1 : 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button style={{ ...petit, height: 22, width: 28, fontSize: 11 }} disabled={i === 0} onClick={() => deplacer(i, -1)} title="Monter">↑</button>
                <button style={{ ...petit, height: 22, width: 28, fontSize: 11 }} disabled={i === cfg.sections.length - 1} onClick={() => deplacer(i, 1)} title="Descendre">↓</button>
              </div>
              <span style={{ fontSize: 22 }}>{info.icone}</span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong style={{ fontSize: 15 }}>{info.nom}</strong>
                {info.note && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{info.note}</p>}
              </div>
              {info.obligatoire
                ? <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Toujours affichée</span>
                : <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><input type="checkbox" checked={sec.visible} onChange={(e) => majSection(i, { visible: e.target.checked })} />{sec.visible ? 'Affichée' : 'Masquée'}</label>}
              {champs.length > 0 && <button style={btn('#0f766e', false)} onClick={() => setOuverte(ouv ? null : sec.id)}>{ouv ? 'Fermer' : '✏️ Modifier'}</button>}
            </div>
            {ouv && champs.length > 0 && (
              <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0' }}><button style={btn('#6b7280', false)} onClick={() => reinitSection(sec.id)}>↺ Valeurs d'origine</button></div>
                {champs.map((ch) => <ChampEditeur gid={gestionnaireId} key={ch.k} ch={ch} valeur={cfg.contenu[sec.id][ch.k]} onChange={(v) => majContenu(sec.id, ch.k, v)} />)}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,.95)', borderTop: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btn()} disabled={occupe} onClick={sauver}>{occupe ? '⏳ Enregistrement…' : '💾 Enregistrer l\'apparence'}</button>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Les adresses d'images et de liens doivent commencer par https://. Tout texte est nettoyé automatiquement.</span>
      </div>
    </div>
  );
}