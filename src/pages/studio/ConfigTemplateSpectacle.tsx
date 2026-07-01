// src/pages/studio/ConfigTemplateSpectacle.tsx
// e-Vend Studio — Configuration du template Spectacle & Billet

import { useState, useCallback, useEffect } from 'react';
import TemplateSpectacle from '../../templates/TemplateSpectacle';
import type { ConfigSpectacle, ConfigRangee } from '../../templates/TemplateSpectacle';
import { CONFIG_SPECTACLE_DEFAUT } from '../../templates/TemplateSpectacle';

type Onglet = 'identite' | 'evenement' | 'salle' | 'style' | 'contact';

const CP = '#c9a96e';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{desc}</p>}
    {children}
  </div>
);

const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

const PALETTES = [
  { nom: 'Doré',    cp: '#c9a96e', cs: '#0d0d0d', cf: '#0d0d0d', ct: '#f0f0f0' },
  { nom: 'Rubis',   cp: '#dc2626', cs: '#0a0a0a', cf: '#0a0a0a', ct: '#f5f5f5' },
  { nom: 'Saphir',  cp: '#3b82f6', cs: '#050d1a', cf: '#050d1a', ct: '#e8f0ff' },
  { nom: 'Émeraude',cp: '#10b981', cs: '#021a10', cf: '#021a10', ct: '#e0fff0' },
  { nom: 'Violet',  cp: '#8b5cf6', cs: '#0d0520', cf: '#0d0520', ct: '#f0ebff' },
  { nom: 'Blanc',   cp: '#c9a96e', cs: '#f8f8f8', cf: '#ffffff', ct: '#1a1a1a' },
];

const TYPE_NUM_OPTIONS = [
  { id: 'sequentiel',  label: '1, 2, 3, 4...',         desc: 'Numérotation séquentielle de gauche à droite' },
  { id: 'impair_pair', label: 'Impair | Pair',           desc: '1,3,5... côté gauche / 2,4,6... côté droit (style théâtre)' },
  { id: 'centre_ext',  label: 'Centre → Extérieur',      desc: 'Numéros pairs côté gauche, impairs côté droit' },
  { id: 'allee',       label: 'Avec allée centrale',     desc: '1..N/2 gauche, N/2+1..N droite' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigSpectacle>;
  onSauvegarde?: (config: ConfigSpectacle) => Promise<void>;
}

export default function ConfigTemplateSpectacle({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig]           = useState<ConfigSpectacle>({ ...CONFIG_SPECTACLE_DEFAUT, ...configInitiale });
  const [onglet, setOnglet]           = useState<Onglet>('identite');
  const [device, setDevice]           = useState<'desktop' | 'mobile'>('desktop');
  const [modePreview, setModePreview] = useState(false);
  const [sauvegarde, setSauvegarde]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [generationMsg, setGenerationMsg]       = useState('');

  const maj = useCallback(<K extends keyof ConfigSpectacle>(champ: K, val: ConfigSpectacle[K]) => {
    setConfig(prev => ({ ...prev, [champ]: val }));
    setSauvegarde('idle');
  }, []);

  const majRangee = (idx: number, champ: keyof ConfigRangee, val: any) => {
    const rangees = [...config.rangees];
    rangees[idx] = { ...rangees[idx], [champ]: val };
    maj('rangees', rangees);
  };

  const ajouterRangee = () => {
    const dernier = config.rangees[config.rangees.length - 1];
    const prochainLabel = dernier
      ? String.fromCharCode(dernier.label.charCodeAt(0) + 1)
      : 'A';
    maj('rangees', [...config.rangees, {
      label: prochainLabel,
      nb_sieges: 12,
      debut_numero: 1,
      type_num: 'sequentiel',
      allee_centrale: false,
      zone: 'Parterre',
      couleur_zone: '#6366f1',
    }]);
  };

  const supprimerRangee = (idx: number) => {
    maj('rangees', config.rangees.filter((_, i) => i !== idx));
  };

  const genererPlan = async () => {
    setGenerationStatus('loading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sieges/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config_salle: { rangees: config.rangees } }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerationStatus('success');
        setGenerationMsg(data.message);
      } else {
        setGenerationStatus('error');
        setGenerationMsg(data.message || 'Erreur.');
      }
    } catch {
      setGenerationStatus('error');
      setGenerationMsg('Impossible de joindre le serveur.');
    }
    setTimeout(() => setGenerationStatus('idle'), 4000);
  };

  const sauvegarder = async () => {
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, template_id: 'reservation-spectacle' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('saved');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('error');
    }
  };

  const totalSieges = config.rangees.reduce((acc, r) => acc + r.nb_sieges, 0);

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'identite',   label: 'Identité',   icone: '🏠' },
    { id: 'evenement',  label: 'Événement',  icone: '🎭' },
    { id: 'salle',      label: 'Plan salle', icone: '🗺️' },
    { id: 'style',      label: 'Style',      icone: '🎨' },
    { id: 'contact',    label: 'Contact',    icone: '📲' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *, *::before, *::after { box-sizing: border-box; } input[type=color] { width: 40px; height: 32px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; }`}</style>

      {/* TOP BAR */}
      <div style={{ background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: CP }}>e-Vend Studio</span>
          <span style={{ color: '#444' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>🎭 Spectacle & Billet</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#333', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? CP : 'transparent', border: 'none', color: device === d ? '#000' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? CP : '#333', border: 'none', borderRadius: 6, color: modePreview ? '#000' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={sauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : CP, color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* PANNEAU CONFIG */}
        {!modePreview && (
          <div style={{ width: 400, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Badge */}
            <div style={{ padding: '10px 18px', background: '#6366f110', borderBottom: '2px solid #6366f130', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎭</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', margin: 0 }}>Spectacle & Billet</p>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{totalSieges} siège(s) configuré(s)</p>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => setOnglet(o.id)} style={{ flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? `2px solid ${CP}` : '2px solid transparent', color: onglet === o.id ? CP : '#888', fontSize: 9, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, marginBottom: 2 }}>{o.icone}</div>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {/* ── IDENTITÉ ── */}
              {onglet === 'identite' && (
                <div>
                  <Sec titre="Votre organisation">
                    <Champ label="Nom de l'organisation / producteur">
                      <Input value={config.nomEntreprise} onChange={(v: string) => maj('nomEntreprise', v)} placeholder="Grand Théâtre de Montréal" />
                    </Champ>
                    <Champ label="Slogan">
                      <Input value={config.slogan} onChange={(v: string) => maj('slogan', v)} placeholder="Une soirée inoubliable..." />
                    </Champ>
                    <Champ label="Description générale">
                      <Textarea value={config.description} onChange={(v: string) => maj('description', v)} placeholder="Décrivez votre organisation..." />
                    </Champ>
                  </Sec>
                  <Sec titre="Photo de couverture (Hero)">
                    <Champ label="URL image principale" desc="1600×900px recommandé">
                      <Input value={config.photoHeroUrl} onChange={(v: string) => maj('photoHeroUrl', v)} placeholder="https://..." />
                    </Champ>
                    {config.photoHeroUrl && <img src={config.photoHeroUrl} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => (e.currentTarget.style.display='none')} />}
                  </Sec>
                  <Sec titre="Logo (optionnel)">
                    <Champ label="URL du logo">
                      <Input value={config.logoUrl} onChange={(v: string) => maj('logoUrl', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                </div>
              )}

              {/* ── ÉVÉNEMENT ── */}
              {onglet === 'evenement' && (
                <div>
                  <Sec titre="Détails du spectacle">
                    <Champ label="Nom de l'artiste / spectacle">
                      <Input value={config.artiste} onChange={(v: string) => maj('artiste', v)} placeholder="Céline Dion" />
                    </Champ>
                    <Champ label="Description du spectacle">
                      <Textarea value={config.descriptionEvenement} onChange={(v: string) => maj('descriptionEvenement', v)} placeholder="Une performance exceptionnelle..." rows={4} />
                    </Champ>
                    <Champ label="Photo du spectacle / artiste">
                      <Input value={config.photoEvenement} onChange={(v: string) => maj('photoEvenement', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                  <Sec titre="Date et lieu">
                    <Champ label="Date et heure">
                      <Input type="datetime-local" value={config.dateEvenement?.substring(0,16)} onChange={(v: string) => maj('dateEvenement', new Date(v).toISOString())} />
                    </Champ>
                    <Champ label="Lieu / Salle">
                      <Input value={config.lieu} onChange={(v: string) => maj('lieu', v)} placeholder="Grand Théâtre de Montréal" />
                    </Champ>
                    <Champ label="Durée">
                      <Input value={config.duree} onChange={(v: string) => maj('duree', v)} placeholder="2h30 (incluant entracte)" />
                    </Champ>
                  </Sec>
                  <Sec titre="Réservation">
                    <Champ label="Message de confirmation" desc="Affiché après réservation + envoyé par email">
                      <Textarea value={config.messageConfirmation} onChange={(v: string) => maj('messageConfirmation', v)} rows={3} />
                    </Champ>
                    <Champ label="Max sièges par réservation">
                      <input type="number" min={1} max={20} value={config.maxSiegesParSelection}
                        onChange={e => maj('maxSiegesParSelection', parseInt(e.target.value))}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                    </Champ>
                  </Sec>
                </div>
              )}

              {/* ── PLAN DE SALLE ── */}
              {onglet === 'salle' && (
                <div>
                  <Sec titre="Configuration de la scène">
                    <Champ label="Label de la scène">
                      <Input value={config.labelScene} onChange={(v: string) => maj('labelScene', v)} placeholder="SCÈNE" />
                    </Champ>
                    <Champ label="Position de la scène">
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['haut', 'bas'] as const).map(pos => (
                          <div key={pos} onClick={() => maj('orientationScene', pos)}
                            style={{ flex: 1, padding: '10px', border: `2px solid ${config.orientationScene === pos ? CP : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'center', background: config.orientationScene === pos ? `${CP}12` : '#fff' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: config.orientationScene === pos ? CP : '#555', margin: 0 }}>
                              {pos === 'haut' ? '⬆️ En haut' : '⬇️ En bas'}
                            </p>
                            <p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0' }}>
                              {pos === 'haut' ? 'Rangée A = devant' : 'Rangée A = derrière'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Champ>
                  </Sec>

                  <Sec titre={`Rangées (${config.rangees.length} rangée(s) — ${totalSieges} sièges)`}>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 1.5 }}>
                      Configurez chaque rangée. Après avoir sauvegardé, cliquez "Générer le plan" pour créer les sièges dans la BD.
                    </p>

                    {config.rangees.map((rangee, idx) => (
                      <div key={idx} style={{ background: '#f7f7f5', borderRadius: 10, padding: '14px', marginBottom: 12, border: `1px solid ${rangee.couleur_zone}30` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: rangee.couleur_zone, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                              {rangee.label}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Rangée {rangee.label} — {rangee.nb_sieges} sièges</span>
                          </div>
                          <button onClick={() => supprimerRangee(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: '#ef4444', fontSize: 11 }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Label rangée</label>
                            <Input value={rangee.label} onChange={(v: string) => majRangee(idx, 'label', v)} placeholder="A" />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Nb sièges</label>
                            <input type="number" min={1} max={50} value={rangee.nb_sieges}
                              onChange={e => majRangee(idx, 'nb_sieges', parseInt(e.target.value))}
                              style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Zone / Catégorie</label>
                            <Input value={rangee.zone} onChange={(v: string) => majRangee(idx, 'zone', v)} placeholder="VIP / Parterre..." />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Couleur zone</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="color" value={rangee.couleur_zone} onChange={e => majRangee(idx, 'couleur_zone', e.target.value)} />
                              <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{rangee.couleur_zone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Type numérotation */}
                        <div>
                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>Type de numérotation</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {TYPE_NUM_OPTIONS.map(opt => (
                              <div key={opt.id} onClick={() => majRangee(idx, 'type_num', opt.id)}
                                style={{ padding: '8px 10px', border: `1.5px solid ${rangee.type_num === opt.id ? CP : '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer', background: rangee.type_num === opt.id ? `${CP}10` : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: rangee.type_num === opt.id ? CP : '#333', margin: 0 }}>{opt.label}</p>
                                  <p style={{ fontSize: 10, color: '#aaa', margin: '1px 0 0' }}>{opt.desc}</p>
                                </div>
                                {rangee.type_num === opt.id && <span style={{ color: CP, fontSize: 14 }}>✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Allée centrale */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                          <div onClick={() => majRangee(idx, 'allee_centrale', !rangee.allee_centrale)}
                            style={{ width: 40, height: 22, borderRadius: 11, background: rangee.allee_centrale ? CP : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 2, left: rangee.allee_centrale ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#555' }}>Allée centrale (divise la rangée en 2)</span>
                        </div>

                        {rangee.type_num === 'sequentiel' && (
                          <div style={{ marginTop: 8 }}>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Numéro de départ</label>
                            <input type="number" min={1} value={rangee.debut_numero}
                              onChange={e => majRangee(idx, 'debut_numero', parseInt(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                          </div>
                        )}
                      </div>
                    ))}

                    <button onClick={ajouterRangee} style={{ width: '100%', padding: '9px', border: '1.5px dashed #d0c9bb', borderRadius: 8, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                      + Ajouter une rangée
                    </button>

                    {/* Bouton générer plan */}
                    <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #0ea5e920' }}>
                      <p style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 700, marginBottom: 6 }}>⚡ Générer le plan de salle</p>
                      <p style={{ fontSize: 11, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
                        Cliquez après avoir configuré toutes vos rangées. Cette action crée les sièges dans la base de données.
                        <strong style={{ color: '#dc2626' }}> ⚠️ Supprime l'ancien plan si aucune réservation n'est active.</strong>
                      </p>
                      {generationMsg && (
                        <div style={{ padding: '8px 12px', borderRadius: 6, background: generationStatus === 'success' ? '#dcfce7' : '#fee2e2', color: generationStatus === 'success' ? '#16a34a' : '#dc2626', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                          {generationStatus === 'success' ? '✅' : '❌'} {generationMsg}
                        </div>
                      )}
                      <button onClick={genererPlan} disabled={generationStatus === 'loading'}
                        style={{ width: '100%', padding: '10px', background: generationStatus === 'loading' ? '#ccc' : '#0ea5e9', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: generationStatus === 'loading' ? 'wait' : 'pointer' }}>
                        {generationStatus === 'loading' ? '⏳ Génération...' : `🗺️ Générer ${totalSieges} sièges`}
                      </button>
                    </div>
                  </Sec>
                </div>
              )}

              {/* ── STYLE ── */}
              {onglet === 'style' && (
                <div>
                  <Sec titre="Palettes prédéfinies (fond sombre recommandé)">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {PALETTES.map(p => (
                        <button key={p.nom} onClick={() => { maj('couleurPrincipale', p.cp); maj('couleurSecondaire', p.cs); maj('couleurFond', p.cf); maj('couleurTexte', p.ct); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: p.cf, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.cp }} />
                          <span style={{ color: p.ct }}>{p.nom}</span>
                        </button>
                      ))}
                    </div>
                  </Sec>
                  <Sec titre="Couleurs personnalisées">
                    {[
                      { champ: 'couleurPrincipale' as const, label: 'Couleur principale (accent)', desc: 'Boutons, sièges sélectionnés' },
                      { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire',           desc: 'Fond héro, sections' },
                      { champ: 'couleurFond'       as const, label: 'Couleur de fond',              desc: 'Fond général (sombre recommandé)' },
                      { champ: 'couleurTexte'      as const, label: 'Couleur du texte',             desc: 'Texte principal' },
                    ].map(({ champ, label, desc }) => (
                      <div key={champ} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={config[champ] as string} onChange={e => maj(champ, e.target.value)} />
                          <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{config[champ] as string}</span>
                        </div>
                      </div>
                    ))}
                  </Sec>
                  <Sec titre="Typographie">
                    {([
                      { id: 'classique', label: 'Classique', font: "'Playfair Display', serif", desc: 'Élégant — idéal pour théâtre' },
                      { id: 'moderne',   label: 'Moderne',   font: "'Inter', sans-serif",       desc: 'Contemporain — polyvalent' },
                    ] as const).map(p => (
                      <div key={p.id} onClick={() => maj('police', p.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${config.police === p.id ? CP : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: config.police === p.id ? `${CP}0d` : '#fff', marginBottom: 8 }}>
                        <p style={{ fontFamily: p.font, fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{p.desc}</p>
                      </div>
                    ))}
                  </Sec>
                </div>
              )}

              {/* ── CONTACT ── */}
              {onglet === 'contact' && (
                <div>
                  <Sec titre="Coordonnées">
                    <Champ label="Adresse"><Input value={config.adresse}   onChange={(v: string) => maj('adresse', v)}   placeholder="1234 rue Saint-Denis" /></Champ>
                    <Champ label="Ville"><Input value={config.ville}       onChange={(v: string) => maj('ville', v)}     placeholder="Montréal, QC" /></Champ>
                    <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => maj('telephone', v)} placeholder="(514) 555-0123" /></Champ>
                    <Champ label="Courriel"><Input value={config.email}     onChange={(v: string) => maj('email', v)}     placeholder="info@theatre.ca" /></Champ>
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW */}
        <div style={{ flex: 1, background: '#2a2a2a', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: device === 'mobile' ? 390 : '100%',
            maxWidth: device === 'mobile' ? 390 : 1200,
            background: config.couleurFond,
            borderRadius: device === 'mobile' ? 28 : 8,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            border: device === 'mobile' ? '8px solid #1a1a1a' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <TemplateSpectacle
              config={config}
              isPreviewMobile={device === 'mobile'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}