// src/pages/studio/ConfigTemplateSalon.tsx
// e-Vend Studio — Configuration du template Salon de Coiffure & Beauté

import { useState, useEffect } from 'react';
import TemplateSalon from '../../templates/TemplateSalon';
import type { ConfigSalon, ServiceSalon, MembreSalon } from '../../templates/TemplateSalon';
import { CONFIG_SALON_DEFAUT } from '../../templates/TemplateSalon';

type Onglet = 'identite' | 'apparence' | 'a-propos' | 'services' | 'equipe' | 'galerie' | 'reservations' | 'contact';

const CP = '#7b7cb6';

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
  { nom: 'Violet & Citron', cp: '#7b7cb6', ca: '#d4e44a', cf: '#f5f0e8', cs: '#5c5ca0', ct: '#1a1a1a' },
  { nom: 'Olive & Sable',   cp: '#8b7355', ca: '#e8d5a3', cf: '#faf7f2', cs: '#6b5b40', ct: '#1a1a1a' },
  { nom: 'Rose & Or',       cp: '#c9738a', ca: '#f5d47a', cf: '#fdf8f6', cs: '#a85b70', ct: '#1a1a1a' },
  { nom: 'Noir & Crème',    cp: '#1a1a1a', ca: '#f5f0e8', cf: '#f5f0e8', cs: '#0d0d0d', ct: '#1a1a1a' },
  { nom: 'Vert Sauge',      cp: '#6b8c7a', ca: '#d4e8a3', cf: '#f2f7f4', cs: '#4a6b58', ct: '#1a1a1a' },
  { nom: 'Bleu Ardoise',    cp: '#5b7fa6', ca: '#d4e4f5', cf: '#f0f5fa', cs: '#3a5c80', ct: '#1a1a1a' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigSalon>;
  onSauvegarde?: (config: ConfigSalon) => Promise<void>;
}

export default function ConfigTemplateSalon({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigSalon>({ ...CONFIG_SALON_DEFAUT, ...configInitiale });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop' | 'tablette' | 'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Charger config sauvegardée
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigSalon, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ config, template_id: 'salon-coiffure' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('ok');
      setTimeout(() => setSauvegarde('idle'), 2500);
    } catch {
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // Helpers services / équipe / galerie
  const updateService = (i: number, k: keyof ServiceSalon, v: string) => {
    const s = [...config.services];
    s[i] = { ...s[i], [k]: v };
    set('services', s);
  };
  const ajouterService = () => set('services', [...config.services, { nom: 'Nouveau service', sousNom: '', description: '', prix: '', duree: '', photo: '', categorie: 'Autre' }]);
  const supprimerService = (i: number) => { const s = [...config.services]; s.splice(i, 1); set('services', s); };

  const updateMembre = (i: number, k: keyof MembreSalon, v: string) => {
    const m = [...config.equipe];
    m[i] = { ...m[i], [k]: v };
    set('equipe', m);
  };
  const ajouterMembre = () => set('equipe', [...config.equipe, { nom: 'Prénom N.', role: 'Styliste', photo: '' }]);
  const supprimerMembre = (i: number) => { const m = [...config.equipe]; m.splice(i, 1); set('equipe', m); };

  const updateGalerie = (i: number, url: string) => { const g = [...config.galerie]; g[i] = url; set('galerie', g); };
  const ajouterGalerie = () => set('galerie', [...config.galerie, '']);
  const supprimerGalerie = (i: number) => { const g = [...config.galerie]; g.splice(i, 1); set('galerie', g); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite', label: 'Identité', emoji: '🏷️' },
    { id: 'apparence', label: 'Apparence', emoji: '🎨' },
    { id: 'a-propos', label: 'À propos', emoji: '📖' },
    { id: 'services', label: 'Services', emoji: '✂️' },
    { id: 'equipe', label: 'Équipe', emoji: '👥' },
    { id: 'galerie', label: 'Galerie', emoji: '📸' },
    { id: 'reservations', label: 'Réservations', emoji: '📅' },
    { id: 'contact', label: 'Contact', emoji: '📍' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* ── Panneau gauche ── */}
      <div style={{ width: 380, minWidth: 340, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, #7b7cb6, #d4e44a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✂️</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Salon de Coiffure</p>
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: onglet === o.id ? CP : '#f3f4f6',
                color: onglet === o.id ? '#fff' : '#555',
                transition: 'all 0.15s',
              }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu onglet */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── IDENTITÉ ── */}
          {onglet === 'identite' && (
            <>
              <Sec titre="Nom & Accroche">
                <Champ label="Nom du salon *"><Input value={config.nomSalon} onChange={(v: string) => set('nomSalon', v)} placeholder="Élara Salon" /></Champ>
                <Champ label="Slogan" desc="Phrase principale affichée dans le hero"><Input value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="Nous faisons vos cheveux autrement" /></Champ>
                <Champ label="Description courte"><Textarea value={config.description} onChange={(v: string) => set('description', v)} placeholder="Décrivez votre salon en 1-2 phrases" rows={2} /></Champ>
              </Sec>
              <Sec titre="Médias">
                <Champ label="Photo Hero (URL)" desc="Grande photo en arrière-plan de la page d'accueil"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} placeholder="https://..." /></Champ>
                <Champ label="Logo (URL)" desc="Optionnel — apparaît dans la navigation"><Input value={config.logoUrl} onChange={(v: string) => set('logoUrl', v)} placeholder="https://..." /></Champ>
                <Champ label="Instagram" desc="Votre handle Instagram"><Input value={config.instagramHandle} onChange={(v: string) => set('instagramHandle', v)} placeholder="@votresalon" /></Champ>
              </Sec>
            </>
          )}

          {/* ── APPARENCE ── */}
          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurPrimaire: p.cp, couleurAccent: p.ca, couleurFond: p.cf, couleurFondSombre: p.cs, couleurTexte: p.ct }))}
                      style={{ padding: '8px 10px', borderRadius: 8, border: `2px solid ${config.couleurPrimaire === p.cp ? p.cp : '#e5e7eb'}`, cursor: 'pointer', background: '#fff', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cp }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.ca }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid #eee' }} />
                      </div>
                      {p.nom}
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                <Champ label="Couleur primaire (nav, accents)">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={config.couleurPrimaire} onChange={e => set('couleurPrimaire', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurPrimaire} onChange={(v: string) => set('couleurPrimaire', v)} placeholder="#7b7cb6" />
                  </div>
                </Champ>
                <Champ label="Couleur accent (boutons, badges)">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={config.couleurAccent} onChange={e => set('couleurAccent', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurAccent} onChange={(v: string) => set('couleurAccent', v)} placeholder="#d4e44a" />
                  </div>
                </Champ>
                <Champ label="Couleur de fond (pages)">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={config.couleurFond} onChange={e => set('couleurFond', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurFond} onChange={(v: string) => set('couleurFond', v)} placeholder="#f5f0e8" />
                  </div>
                </Champ>
              </Sec>
              <Sec titre="Aperçu couleurs">
                <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', height: 48 }}>
                  <div style={{ flex: 2, background: config.couleurPrimaire, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Primaire</span>
                  </div>
                  <div style={{ flex: 1, background: config.couleurAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 600 }}>Accent</span>
                  </div>
                  <div style={{ flex: 1, background: config.couleurFond, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Fond</span>
                  </div>
                </div>
              </Sec>
            </>
          )}

          {/* ── À PROPOS ── */}
          {onglet === 'a-propos' && (
            <>
              <Sec titre="Section À propos">
                <Champ label="Titre principal"><Input value={config.aPropsTitre} onChange={(v: string) => set('aPropsTitre', v)} placeholder="Nous faisons les cheveux autrement" /></Champ>
                <Champ label="Paragraphe 1"><Textarea value={config.aPropsTexte1} onChange={(v: string) => set('aPropsTexte1', v)} rows={3} /></Champ>
                <Champ label="Paragraphe 2 (italique)"><Textarea value={config.aPropsTexte2} onChange={(v: string) => set('aPropsTexte2', v)} rows={2} /></Champ>
              </Sec>
              <Sec titre="Photos À propos (effet page de livre)">
                <Champ label="Photo 1 (recto)" desc="S'affiche en avant — l'utilisateur peut cliquer pour tourner"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} placeholder="https://..." /></Champ>
                <Champ label="Photo 2 (verso)" desc="S'affiche en arrière-plan et au dos de la page"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} placeholder="https://..." /></Champ>
                <div style={{ background: '#f0f0ff', border: '1px solid #d0d0ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#5555aa' }}>
                  💡 Les deux photos s'animent comme les pages d'un livre. L'animation est automatique toutes les 3,5 secondes, et l'utilisateur peut cliquer pour tourner manuellement.
                </div>
              </Sec>
            </>
          )}

          {/* ── SERVICES ── */}
          {onglet === 'services' && (
            <>
              {config.services.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Service {i + 1}</span>
                    <button onClick={() => supprimerService(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕ Supprimer</button>
                  </div>
                  <Champ label="Nom"><Input value={s.nom} onChange={(v: string) => updateService(i, 'nom', v)} placeholder="Coupe & Style" /></Champ>
                  <Champ label="Sous-titre (style, techniques)"><Input value={s.sousNom} onChange={(v: string) => updateService(i, 'sousNom', v)} placeholder="Cut · Blowdry · Updo's" /></Champ>
                  <Champ label="Catégorie" desc="Utilisé pour le filtre sur la page Services"><Input value={s.categorie} onChange={(v: string) => updateService(i, 'categorie', v)} placeholder="Coupe" /></Champ>
                  <Champ label="Description"><Textarea value={s.description} onChange={(v: string) => updateService(i, 'description', v)} rows={2} /></Champ>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Champ label="Prix"><Input value={s.prix} onChange={(v: string) => updateService(i, 'prix', v)} placeholder="À partir de 75$" /></Champ>
                    <Champ label="Durée"><Input value={s.duree} onChange={(v: string) => updateService(i, 'duree', v)} placeholder="1h" /></Champ>
                  </div>
                  <Champ label="Photo (URL)"><Input value={s.photo} onChange={(v: string) => updateService(i, 'photo', v)} placeholder="https://..." /></Champ>
                </div>
              ))}
              <button onClick={ajouterService} style={{ width: '100%', padding: '10px', border: `2px dashed ${CP}`, borderRadius: 10, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un service
              </button>
            </>
          )}

          {/* ── ÉQUIPE ── */}
          {onglet === 'equipe' && (
            <>
              {config.equipe.map((m, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Membre {i + 1}</span>
                    <button onClick={() => supprimerMembre(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={m.nom} onChange={(v: string) => updateMembre(i, 'nom', v)} placeholder="Sophie M." /></Champ>
                  <Champ label="Rôle"><Input value={m.role} onChange={(v: string) => updateMembre(i, 'role', v)} placeholder="Fondatrice & Styliste" /></Champ>
                  <Champ label="Photo (URL)"><Input value={m.photo} onChange={(v: string) => updateMembre(i, 'photo', v)} placeholder="https://..." /></Champ>
                </div>
              ))}
              <button onClick={ajouterMembre} style={{ width: '100%', padding: '10px', border: `2px dashed ${CP}`, borderRadius: 10, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un membre
              </button>
            </>
          )}

          {/* ── GALERIE ── */}
          {onglet === 'galerie' && (
            <>
              <div style={{ background: '#f0f7ff', border: '1px solid #bcd', borderRadius: 8, padding: 10, fontSize: 12, color: '#456', marginBottom: 16 }}>
                📸 La galerie "Transformations" s'affiche en défilement horizontal avec des photos en forme de bulles arrondies.
              </div>
              {config.galerie.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  {url && <img src={url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  <div style={{ flex: 1 }}><Input value={url} onChange={(v: string) => updateGalerie(i, v)} placeholder={`URL photo ${i + 1}`} /></div>
                  <button onClick={() => supprimerGalerie(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#dc2626', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
              ))}
              <button onClick={ajouterGalerie} style={{ width: '100%', padding: '10px', border: `2px dashed ${CP}`, borderRadius: 10, background: 'transparent', color: CP, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter une photo
              </button>
            </>
          )}

          {/* ── RÉSERVATIONS ── */}
          {onglet === 'reservations' && (
            <>
              <Sec titre="Textes de réservation">
                <Champ label="Texte du bouton"><Input value={config.boutonReservationTexte} onChange={(v: string) => set('boutonReservationTexte', v)} placeholder="Réserver maintenant" /></Champ>
                <Champ label="Message d'introduction" desc="Affiché en haut de la page de réservation"><Textarea value={config.messageReservation} onChange={(v: string) => set('messageReservation', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Gestion des créneaux">
                <div style={{ background: '#fff8e6', border: '1px solid #f5d87a', borderRadius: 10, padding: 14, fontSize: 13, color: '#7a5a00' }}>
                  <strong>📅 Les créneaux disponibles</strong> sont gérés depuis la section <strong>Gestion des réservations</strong> dans votre tableau de bord. Vos clients ne verront que les créneaux que vous avez activés.
                </div>
              </Sec>
            </>
          )}

          {/* ── CONTACT ── */}
          {onglet === 'contact' && (
            <>
              <Sec titre="Coordonnées">
                <Champ label="Adresse"><Input value={config.adresse} onChange={(v: string) => set('adresse', v)} placeholder="123 rue Laurier Ouest" /></Champ>
                <Champ label="Ville / Code postal"><Input value={config.ville} onChange={(v: string) => set('ville', v)} placeholder="Montréal, QC H2T 2N3" /></Champ>
                <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => set('telephone', v)} placeholder="(514) 555-0199" /></Champ>
                <Champ label="Courriel"><Input value={config.email} onChange={(v: string) => set('email', v)} placeholder="info@votresalon.ca" /></Champ>
                <Champ label="Horaires"><Input value={config.horaires} onChange={(v: string) => set('horaires', v)} placeholder="Lun – Dim : 10h – 18h" /></Champ>
              </Sec>
            </>
          )}
        </div>

        {/* Footer boutons */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_SALON_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid ${CP}`, background:apercu?CP:'transparent', color:apercu?'#fff':CP, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':CP, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#f5f0e8', overflow:'hidden' }}>
        <div style={{ background:'#ede8e0', borderBottom:`1px solid ${CP}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CP, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #ddd', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CP}22`:'transparent', color:modeApercu===m?CP:'#888', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #ccc`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f0e8', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>✂️</div>
          <p style={{ fontSize:15, color:CP, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CP}80` }}>Template Salon de Coiffure & Beauté — Gratuit</p>
        </div>
      )}
    </div>
  );
}