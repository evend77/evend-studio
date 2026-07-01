// src/pages/studio/ConfigTemplateVitrine.tsx
// e-Vend Studio — Configuration du template "Vitrine Simple"

import { useState, useCallback, useEffect, useRef } from 'react';
import TemplateVitrine from '../../templates/TemplateVitrine';
import type { ConfigVitrine, SousTypeVitrine } from '../../templates/TemplateVitrine';
import { CONFIG_DEFAUT } from '../../templates/TemplateVitrine';

type Onglet = 'type' | 'identite' | 'style' | 'contenu' | 'contact';

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}
    onFocus={e => (e.target.style.borderColor = '#c9a96e')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' as any }}
    onFocus={e => (e.target.style.borderColor = '#c9a96e')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
);

const Champ = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block' }}>{label}</label>
      {desc && <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{desc}</p>}
    </div>
    {children}
  </div>
);

const Sec = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigVitrine>;
  onSauvegarde?: (config: ConfigVitrine) => Promise<void>;
}

export default function ConfigTemplateVitrine({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig]           = useState<ConfigVitrine>({ ...CONFIG_DEFAUT, ...configInitiale });
  const [onglet, setOnglet]           = useState<Onglet>('type');
  const [modePreview, setModePreview] = useState(false);
  const [sauvegarde, setSauvegarde]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [device, setDevice]           = useState<'desktop' | 'mobile'>('desktop');

  // FIX REFRESH: sauvegarder l'onglet actif dans sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('studio_onglet') as Onglet | null;
    if (saved) setOnglet(saved);
  }, []);

  const setOngletPersist = (o: Onglet) => {
    setOnglet(o);
    sessionStorage.setItem('studio_onglet', o);
  };

  // Mise à jour partielle
  const maj = useCallback(<K extends keyof ConfigVitrine>(champ: K, valeur: ConfigVitrine[K]) => {
    setConfig(prev => ({ ...prev, [champ]: valeur }));
    setSauvegarde('idle');
  }, []);

  const handleSauvegarder = async () => {
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, sous_type: config.sousType }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
      }
      setSauvegarde('saved');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('error');
    }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'type',     label: 'Type',     icone: '🗂️' },
    { id: 'identite', label: 'Identité', icone: '🏠' },
    { id: 'style',    label: 'Style',    icone: '🎨' },
    { id: 'contenu',  label: 'Contenu',  icone: '✏️' },
    { id: 'contact',  label: 'Contact',  icone: '📲' },
  ];

  const PALETTES = [
    { nom: 'Doré',   cp: '#c9a96e', cs: '#1a1a1a', cf: '#fafaf8', ct: '#1a1a1a' },
    { nom: 'Marine', cp: '#3b82f6', cs: '#0f172a', cf: '#f8fafc', ct: '#0f172a' },
    { nom: 'Forêt',  cp: '#16a34a', cs: '#14532d', cf: '#f0fdf4', ct: '#14532d' },
    { nom: 'Rose',   cp: '#ec4899', cs: '#1a1a1a', cf: '#fff0f5', ct: '#1a1a1a' },
    { nom: 'Ardoise',cp: '#6366f1', cs: '#1e1b4b', cf: '#f5f3ff', ct: '#1e1b4b' },
    { nom: 'Brique', cp: '#ea580c', cs: '#1c1917', cf: '#fff7ed', ct: '#1c1917' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input[type=color] { width: 44px; height: 36px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: #fff; }
        .type-card { transition: all 0.2s; cursor: pointer; }
        .type-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        @media (max-width: 900px) {
          .studio-layout { flex-direction: column !important; }
          .panneau-preview { display: none !important; }
        }
      `}</style>

      {/* BARRE TOP */}
      <div style={{ background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#c9a96e' }}>e-Vend Studio</span>
          <span style={{ color: '#444' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>Modifier mon site</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#333', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? '#c9a96e' : 'transparent', border: 'none', color: device === d ? '#000' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? '#c9a96e' : '#333', border: 'none', borderRadius: 6, color: modePreview ? '#000' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={handleSauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : '#c9a96e', color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="studio-layout" style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* ══ PANNEAU CONFIG (gauche) ══ */}
        {!modePreview && (
          <div style={{ width: 380, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => setOngletPersist(o.id)} style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? '2px solid #c9a96e' : '2px solid transparent', color: onglet === o.id ? '#c9a96e' : '#888', fontSize: 10, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{o.icone}</div>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Contenu onglet */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {/* ── TYPE ── */}
              {onglet === 'type' && (
                <div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>Choisissez le type de site. La mise en page s'adapte automatiquement.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {([
                      { id: 'portfolio',    titre: '🖼 Portfolio',           desc: 'Artistes, photographes, architectes. Galerie + bio + contact.',         couleur: '#c9a96e' },
                      { id: 'carte',        titre: '📍 Carte & Présentation', desc: 'Restaurants, bars, hôtels. Horaires + adresse + réservation.',          couleur: '#f97316' },
                      { id: 'cv',           titre: '💼 CV Professionnel',     desc: 'Coachs, consultants, avocats. Services + témoignages + RDV.',           couleur: '#0ea5e9' },
                      { id: 'evenementiel', titre: '🎉 Événementiel',         desc: 'Mariages, conférences, festivals. Compteur + programme + billetterie.', couleur: '#ec4899' },
                    ] as const).map(type => (
                      <div key={type.id} className="type-card" onClick={() => maj('sousType', type.id as SousTypeVitrine)}
                        style={{ padding: '14px 16px', borderRadius: 10, border: `2px solid ${config.sousType === type.id ? type.couleur : '#e5e7eb'}`, background: config.sousType === type.id ? `${type.couleur}10` : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{type.titre}</p>
                            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{type.desc}</p>
                          </div>
                          {config.sousType === type.id && (
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: type.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── IDENTITÉ ── */}
              {onglet === 'identite' && (
                <div>
                  <Sec titre="Informations de base">
                    <Champ label="Nom / Titre principal">
                      <Input value={config.nomEntreprise} onChange={v => maj('nomEntreprise', v)} placeholder="Marie Dupont" />
                    </Champ>
                    <Champ label="Slogan / Sous-titre">
                      <Input value={config.slogan} onChange={v => maj('slogan', v)} placeholder="Photographe & Artiste visuelle" />
                    </Champ>
                    <Champ label="Description">
                      <Textarea value={config.description} onChange={v => maj('description', v)} placeholder="Décrivez votre activité..." rows={4} />
                    </Champ>
                  </Sec>
                  <Sec titre="Photo de couverture (Hero)">
                    <Champ label="URL de la photo principale" desc="Image plein écran en haut. Recommandé: 1600×900px">
                      <Input value={config.photoHeroUrl} onChange={v => maj('photoHeroUrl', v)} placeholder="https://..." />
                    </Champ>
                    {config.photoHeroUrl && (
                      <img src={config.photoHeroUrl} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </Sec>
                  <Sec titre="Logo (optionnel)">
                    <Champ label="URL du logo" desc="Si vide, votre nom s'affiche à la place">
                      <Input value={config.logoUrl} onChange={v => maj('logoUrl', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                  {config.sousType === 'cv' && (
                    <Sec titre="Profil professionnel">
                      <Champ label="Votre titre professionnel">
                        <Input value={config.cv_titre} onChange={v => maj('cv_titre', v)} placeholder="Avocate en droit des affaires" />
                      </Champ>
                      <Champ label="Photo portrait" desc="Format portrait recommandé: 600×800px">
                        <Input value={config.cv_photoPortrait} onChange={v => maj('cv_photoPortrait', v)} placeholder="https://..." />
                      </Champ>
                    </Sec>
                  )}
                  {config.sousType === 'evenementiel' && (
                    <Sec titre="Événement">
                      <Champ label="Date de l'événement">
                        <Input type="datetime-local" value={config.event_dateEvenement?.substring(0, 16)} onChange={v => maj('event_dateEvenement', new Date(v).toISOString())} />
                      </Champ>
                      <Champ label="Lieu">
                        <Input value={config.event_lieu} onChange={v => maj('event_lieu', v)} placeholder="Palais des congrès de Montréal" />
                      </Champ>
                      <Champ label="Photo de l'événement">
                        <Input value={config.event_photoEvent} onChange={v => maj('event_photoEvent', v)} placeholder="https://..." />
                      </Champ>
                    </Sec>
                  )}
                </div>
              )}

              {/* ── STYLE ── */}
              {onglet === 'style' && (
                <div>
                  <Sec titre="Palette de couleurs">
                    {[
                      { champ: 'couleurPrincipale' as const, label: 'Couleur principale', desc: 'Boutons, accents' },
                      { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire', desc: 'Fonds foncés, titres' },
                      { champ: 'couleurFond'       as const, label: 'Couleur de fond',    desc: 'Arrière-plan général' },
                      { champ: 'couleurTexte'      as const, label: 'Couleur du texte',   desc: 'Texte principal' },
                    ].map(({ champ, label, desc }) => (
                      <div key={champ} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{label}</p>
                          <p style={{ fontSize: 11, color: '#888' }}>{desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={config[champ] as string} onChange={e => maj(champ, e.target.value)} />
                          <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{config[champ] as string}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Palettes prédéfinies</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {PALETTES.map(p => (
                          <button key={p.nom} onClick={() => { maj('couleurPrincipale', p.cp); maj('couleurSecondaire', p.cs); maj('couleurFond', p.cf); maj('couleurTexte', p.ct); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.cp }} />
                            {p.nom}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Sec>
                  <Sec titre="Typographie">
                    {([
                      { id: 'moderne',   label: 'Moderne',   apercu: 'Inter — claire et contemporaine',      font: "'Inter', sans-serif" },
                      { id: 'classique', label: 'Classique', apercu: 'Playfair — élégante et raffinée',      font: "'Playfair Display', serif" },
                      { id: 'manuscrite',label: 'Manuscrite',apercu: 'Dancing Script — chaleureuse',         font: "'Dancing Script', cursive" },
                    ] as const).map(p => (
                      <div key={p.id} onClick={() => maj('police', p.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${config.police === p.id ? config.couleurPrincipale : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: config.police === p.id ? `${config.couleurPrincipale}0d` : '#fff', marginBottom: 8, transition: 'all 0.15s' }}>
                        <p style={{ fontFamily: p.font, fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: '#888' }}>{p.apercu}</p>
                      </div>
                    ))}
                  </Sec>
                </div>
              )}

              {/* ── CONTENU ── */}
              {onglet === 'contenu' && (
                <div>
                  {/* PORTFOLIO */}
                  {config.sousType === 'portfolio' && (
                    <Sec titre="Galerie photos">
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Ajoutez jusqu'à 12 photos.</p>
                      {config.portfolio_galerie.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, background: '#f7f7f5', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                          {item.url && <img src={item.url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <Input value={item.url}   onChange={v => { const g=[...config.portfolio_galerie]; g[i]={...g[i],url:v};   maj('portfolio_galerie',g); }} placeholder="URL de la photo" />
                            <Input value={item.titre} onChange={v => { const g=[...config.portfolio_galerie]; g[i]={...g[i],titre:v}; maj('portfolio_galerie',g); }} placeholder="Titre" />
                            <Input value={item.desc}  onChange={v => { const g=[...config.portfolio_galerie]; g[i]={...g[i],desc:v};  maj('portfolio_galerie',g); }} placeholder="Description" />
                          </div>
                          <button onClick={() => maj('portfolio_galerie', config.portfolio_galerie.filter((_,idx)=>idx!==i))} style={{ background:'#fee2e2',border:'none',borderRadius:4,width:26,height:26,cursor:'pointer',color:'#ef4444',flexShrink:0 }}>✕</button>
                        </div>
                      ))}
                      {config.portfolio_galerie.length < 12 && (
                        <button onClick={() => maj('portfolio_galerie', [...config.portfolio_galerie, { url:'', titre:'', desc:'' }])} style={{ width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:8,background:'transparent',color:'#888',cursor:'pointer',fontSize:13 }}>+ Ajouter une photo</button>
                      )}
                    </Sec>
                  )}

                  {/* CARTE */}
                  {config.sousType === 'carte' && (
                    <>
                      <Sec titre="Coordonnées">
                        <Champ label="Adresse"><Input value={config.carte_adresse}   onChange={v=>maj('carte_adresse',v)}   placeholder="1234 rue Saint-Denis" /></Champ>
                        <Champ label="Ville / Code postal"><Input value={config.carte_ville} onChange={v=>maj('carte_ville',v)} placeholder="Montréal, QC  H2X 3K6" /></Champ>
                        <Champ label="Téléphone"><Input value={config.carte_telephone} onChange={v=>maj('carte_telephone',v)} placeholder="(514) 555-0123" /></Champ>
                        <Champ label="Courriel"><Input value={config.carte_email}     onChange={v=>maj('carte_email',v)}     placeholder="bonjour@restaurant.ca" /></Champ>
                      </Sec>
                      <Sec titre="Liens externes">
                        <Champ label="Lien Google Maps"><Input value={config.carte_googleMapsUrl}  onChange={v=>maj('carte_googleMapsUrl',v)}  placeholder="https://maps.google.com/..." /></Champ>
                        <Champ label="Menu en ligne (optionnel)"><Input value={config.carte_menuUrl} onChange={v=>maj('carte_menuUrl',v)} placeholder="https://..." /></Champ>
                        <Champ label="Lien réservation (optionnel)"><Input value={config.carte_reservationUrl} onChange={v=>maj('carte_reservationUrl',v)} placeholder="https://..." /></Champ>
                      </Sec>
                      <Sec titre="Heures d'ouverture">
                        {config.carte_horaires.map((h, i) => (
                          <div key={i} style={{ display:'flex',gap:8,marginBottom:8,alignItems:'center' }}>
                            <Input value={h.jour}  onChange={v=>{const a=[...config.carte_horaires];a[i]={...a[i],jour:v};  maj('carte_horaires',a);}} placeholder="Lun – Ven" />
                            <Input value={h.heure} onChange={v=>{const a=[...config.carte_horaires];a[i]={...a[i],heure:v}; maj('carte_horaires',a);}} placeholder="11h – 22h" />
                            <button onClick={()=>maj('carte_horaires',config.carte_horaires.filter((_,idx)=>idx!==i))} style={{background:'#fee2e2',border:'none',borderRadius:4,width:32,height:36,cursor:'pointer',color:'#ef4444',flexShrink:0}}>✕</button>
                          </div>
                        ))}
                        <button onClick={()=>maj('carte_horaires',[...config.carte_horaires,{jour:'',heure:''}])} style={{width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13}}>+ Ajouter une plage horaire</button>
                      </Sec>
                    </>
                  )}

                  {/* CV */}
                  {config.sousType === 'cv' && (
                    <>
                      <Sec titre="Mes services">
                        {config.cv_services.map((s,i) => (
                          <div key={i} style={{background:'#f7f7f5',borderRadius:8,padding:12,marginBottom:10}}>
                            <div style={{display:'flex',gap:8,marginBottom:6}}>
                              <div style={{width:60}}><Input value={s.icone} onChange={v=>{const a=[...config.cv_services];a[i]={...a[i],icone:v};maj('cv_services',a);}} placeholder="🎯" /></div>
                              <Input value={s.titre} onChange={v=>{const a=[...config.cv_services];a[i]={...a[i],titre:v};maj('cv_services',a);}} placeholder="Titre du service" />
                            </div>
                            <Textarea value={s.desc} onChange={v=>{const a=[...config.cv_services];a[i]={...a[i],desc:v};maj('cv_services',a);}} placeholder="Description..." rows={2} />
                            <button onClick={()=>maj('cv_services',config.cv_services.filter((_,idx)=>idx!==i))} style={{marginTop:6,background:'#fee2e2',border:'none',borderRadius:4,padding:'3px 10px',cursor:'pointer',color:'#ef4444',fontSize:12}}>Retirer</button>
                          </div>
                        ))}
                        <button onClick={()=>maj('cv_services',[...config.cv_services,{icone:'⭐',titre:'',desc:''}])} style={{width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13}}>+ Ajouter un service</button>
                      </Sec>
                      <Sec titre="Témoignages">
                        {config.cv_temoignages.map((t,i) => (
                          <div key={i} style={{background:'#f7f7f5',borderRadius:8,padding:12,marginBottom:10}}>
                            <div style={{display:'flex',gap:8,marginBottom:6}}>
                              <Input value={t.nom}   onChange={v=>{const a=[...config.cv_temoignages];a[i]={...a[i],nom:v};  maj('cv_temoignages',a);}} placeholder="Nom du client" />
                              <Input value={t.poste} onChange={v=>{const a=[...config.cv_temoignages];a[i]={...a[i],poste:v};maj('cv_temoignages',a);}} placeholder="Poste" />
                            </div>
                            <Textarea value={t.texte} onChange={v=>{const a=[...config.cv_temoignages];a[i]={...a[i],texte:v};maj('cv_temoignages',a);}} placeholder="Ce que dit votre client..." rows={3} />
                            <button onClick={()=>maj('cv_temoignages',config.cv_temoignages.filter((_,idx)=>idx!==i))} style={{marginTop:6,background:'#fee2e2',border:'none',borderRadius:4,padding:'3px 10px',cursor:'pointer',color:'#ef4444',fontSize:12}}>Retirer</button>
                          </div>
                        ))}
                        <button onClick={()=>maj('cv_temoignages',[...config.cv_temoignages,{nom:'',texte:'',poste:''}])} style={{width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13}}>+ Ajouter un témoignage</button>
                      </Sec>
                      <Sec titre="Prise de rendez-vous">
                        <Champ label="Lien calendrier" desc="Calendly, Acuity, etc.">
                          <Input value={config.cv_rdvUrl} onChange={v=>maj('cv_rdvUrl',v)} placeholder="https://calendly.com/votrenom" />
                        </Champ>
                      </Sec>
                    </>
                  )}

                  {/* ÉVÉNEMENTIEL */}
                  {config.sousType === 'evenementiel' && (
                    <>
                      <Sec titre="Programme">
                        {config.event_programme.map((p,i) => (
                          <div key={i} style={{background:'#f7f7f5',borderRadius:8,padding:10,marginBottom:8}}>
                            <div style={{display:'flex',gap:8,marginBottom:6}}>
                              <div style={{width:80}}><Input value={p.heure} onChange={v=>{const a=[...config.event_programme];a[i]={...a[i],heure:v};maj('event_programme',a);}} placeholder="09h00" /></div>
                              <Input value={p.titre} onChange={v=>{const a=[...config.event_programme];a[i]={...a[i],titre:v};maj('event_programme',a);}} placeholder="Titre de l'activité" />
                            </div>
                            <Input value={p.desc} onChange={v=>{const a=[...config.event_programme];a[i]={...a[i],desc:v};maj('event_programme',a);}} placeholder="Description..." />
                            <button onClick={()=>maj('event_programme',config.event_programme.filter((_,idx)=>idx!==i))} style={{marginTop:6,background:'#fee2e2',border:'none',borderRadius:4,padding:'3px 10px',cursor:'pointer',color:'#ef4444',fontSize:12}}>Retirer</button>
                          </div>
                        ))}
                        <button onClick={()=>maj('event_programme',[...config.event_programme,{heure:'',titre:'',desc:''}])} style={{width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13}}>+ Ajouter une activité</button>
                      </Sec>
                      <Sec titre="Billetterie">
                        <Champ label="Lien billetterie externe" desc="Eventbrite, Billetterie.com, etc.">
                          <Input value={config.event_billeterieUrl} onChange={v=>maj('event_billeterieUrl',v)} placeholder="https://eventbrite.com/..." />
                        </Champ>
                      </Sec>
                    </>
                  )}
                </div>
              )}

              {/* ── CONTACT ── */}
              {onglet === 'contact' && (
                <div>
                  <Sec titre="Réseaux sociaux">
                    <p style={{fontSize:12,color:'#888',marginBottom:14}}>Entrez seulement votre nom d'utilisateur (sans le @).</p>
                    {([
                      {champ:'instagram' as const, label:'📷 Instagram', placeholder:'monpseudo'},
                      {champ:'facebook'  as const, label:'👥 Facebook',  placeholder:'ma-page'},
                      {champ:'tiktok'    as const, label:'🎵 TikTok',    placeholder:'monpseudo'},
                      {champ:'linkedin'  as const, label:'💼 LinkedIn',  placeholder:'prenom-nom'},
                    ]).map(r => (
                      <Champ key={r.champ} label={r.label}>
                        <Input value={config[r.champ] as string} onChange={v=>maj(r.champ,v)} placeholder={r.placeholder} />
                      </Champ>
                    ))}
                  </Sec>
                  <Sec titre="Autres liens">
                    <Champ label="Site web externe (optionnel)">
                      <Input value={config.siteExterne} onChange={v=>maj('siteExterne',v)} placeholder="https://monsite.com" />
                    </Champ>
                    <Champ label="Adresse courriel affichée" desc="Affichée dans la section Contact">
                      <Input value={config.carte_email} onChange={v=>maj('carte_email',v)} placeholder="moi@exemple.com" />
                    </Champ>
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PANNEAU PREVIEW (droite) ══ */}
        {/* FIX BOUCLE INFINIE: key={config.sousType} force remount complet quand le type change */}
        {/* FIX SECTIONS MANQUANTES: key change → TemplateVitrine recrée tous ses observers */}
        <div className="panneau-preview" style={{ flex: 1, background: '#e8e8e8', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: device === 'mobile' ? 390 : '100%',
            maxWidth: device === 'mobile' ? 390 : 1200,
            background: '#fff',
            borderRadius: device === 'mobile' ? 28 : 8,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: device === 'mobile' ? '8px solid #1a1a1a' : 'none',
            minHeight: device === 'mobile' ? 700 : 'auto',
            transition: 'all 0.3s ease',
          }}>
            <TemplateVitrine key={config.sousType} config={config} isPreviewMobile={device === 'mobile'} />
          </div>
        </div>
      </div>
    </div>
  );
}