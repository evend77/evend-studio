// src/pages/studio/ConfigTemplateVitrineProSante.tsx
// e-Vend Studio — Configurateur Template PREMIUM Vitrine Pro Santé

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_VITRINE_PRO_SANTE_DEFAUT,
  type ConfigVitrineProSante,
  type ServiceSante,
  type AvantageClinik,
  type MedecinSante,
  type TemoignageSante,
  type FAQSante,
  type StatSante,
} from '../../templates/TemplateVitrineProSante';

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 18px', marginBottom: 16 };
const CP = '#1e6fa8';
const btnP: React.CSSProperties = { background: CP, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnS: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnD: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' };

type Onglet = 'hero' | 'services' | 'avantages' | 'equipe' | 'temoignages' | 'faq' | 'contact' | 'apparence';

interface Props { vendeurId: string; templateId?: string; onSauvegarde: (config: ConfigVitrineProSante) => Promise<void>; }

export default function ConfigTemplateVitrineProSante({ vendeurId, templateId = 'vitrine-pro-sante', onSauvegarde }: Props) {
  const [config, setConfig]         = useState<ConfigVitrineProSante>(CONFIG_VITRINE_PRO_SANTE_DEFAUT);
  const [onglet, setOnglet]         = useState<Onglet>('hero');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces]         = useState('');
  const [erreur, setErreur]         = useState('');

  useEffect(() => {
    (async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (d.config && Object.keys(d.config).length > 0)
            setConfig({ ...CONFIG_VITRINE_PRO_SANTE_DEFAUT, ...d.config });
        }
      } catch {}
      setChargement(false);
    })();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigVitrineProSante>(k: K, v: ConfigVitrineProSante[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try { await onSauvegarde(config); setSucces('✅ Clinique sauvegardée !'); setTimeout(() => setSucces(''), 4000); }
    catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'hero',         label: 'Hero',         icone: '🏥' },
    { id: 'services',     label: 'Services',     icone: '➕' },
    { id: 'avantages',    label: 'Avantages',    icone: '💙' },
    { id: 'equipe',       label: 'Équipe',       icone: '👨‍⚕️' },
    { id: 'temoignages',  label: 'Patients',     icone: '⭐' },
    { id: 'faq',          label: 'FAQ',          icone: '❓' },
    { id: 'contact',      label: 'Contact',      icone: '📍' },
    { id: 'apparence',    label: 'Apparence',    icone: '🎨' },
  ];

  if (chargement) return <div style={{ textAlign: 'center', padding: 80 }}><p style={{ fontSize: 36 }}>⏳</p><p style={{ color: '#888' }}>Chargement...</p></div>;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🏥 Vitrine Pro Santé</h1>
            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>PREMIUM 25$</span>
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Clinique médicale · Dentaire · Optométrie · Scroll reveal · Carte Google Maps · Formulaire contact</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer" style={{ ...btnS, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>👁 Aperçu</a>
          <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>{sauvegarde ? '⏳...' : '💾 Sauvegarder'}</button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#16a34a', fontWeight: 600 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: '#dc2626', fontWeight: 600 }}>{erreur}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, background: '#f0f4f8', borderRadius: 12, padding: 4 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '7px 11px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? CP : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      {onglet === 'hero' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏥 Identité de la clinique</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nom de la clinique</label>
                <input style={inp} value={config.nomClinique} onChange={e => set('nomClinique', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Slogan</label>
                <input style={inp} value={config.sloganClinique} onChange={e => set('sloganClinique', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>URL du logo</label>
                <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://... (vide = ➕ + nom)" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📝 Titre hero</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Première ligne</label>
                <input style={inp} value={config.heroTitre1} onChange={e => set('heroTitre1', e.target.value)} placeholder="Soins professionnels" />
              </div>
              <div>
                <label style={lbl}>Mot accentué (en couleur principale)</label>
                <input style={inp} value={config.heroAccent} onChange={e => set('heroAccent', e.target.value)} placeholder="professionnels" />
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Ce mot dans la 1ère ligne sera coloré</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Deuxième ligne</label>
                <input style={inp} value={config.heroTitre2} onChange={e => set('heroTitre2', e.target.value)} placeholder="avec une touche humaine +" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Description sous le titre</label>
                <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={config.heroDescription} onChange={e => set('heroDescription', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Texte du bouton principal</label>
                <input style={inp} value={config.heroBouton} onChange={e => set('heroBouton', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🖼 Photo hero (équipe médicale)</h3>
            <label style={lbl}>URL de la photo principale</label>
            <input style={inp} value={config.heroPhoto} onChange={e => set('heroPhoto', e.target.value)} placeholder="https://..." />
            {config.heroPhoto && <img src={config.heroPhoto} alt="hero" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📊 Phrase d'impact + Statistiques</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Phrase d'impact (sous les stats)</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={config.phraseImpact} onChange={e => set('phraseImpact', e.target.value)} />
            </div>
            {config.stats.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <div>
                  {i === 0 && <label style={lbl}>Valeur</label>}
                  <input style={inp} value={s.valeur} onChange={e => { const arr = [...config.stats]; arr[i] = { ...arr[i], valeur: e.target.value }; set('stats', arr); }} placeholder="10 000+" />
                </div>
                <div>
                  {i === 0 && <label style={lbl}>Label</label>}
                  <input style={inp} value={s.label} onChange={e => { const arr = [...config.stats]; arr[i] = { ...arr[i], label: e.target.value }; set('stats', arr); }} placeholder="Patients traités" />
                </div>
                <button style={btnD} onClick={() => set('stats', config.stats.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button style={{ ...btnS, marginTop: 4 }} onClick={() => set('stats', [...config.stats, { valeur: '', label: '' }])}>+ Ajouter une statistique</button>
          </div>
        </>
      )}

      {/* ── SERVICES ─────────────────────────────────────────────────────────── */}
      {onglet === 'services' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Titre 1 (accentué)</label>
              <input style={inp} value={config.servicesTitre1} onChange={e => set('servicesTitre1', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre 2</label>
              <input style={inp} value={config.servicesTitre2} onChange={e => set('servicesTitre2', e.target.value)} />
            </div>
          </div>
          {config.services.map((s, i) => (
            <div key={i} style={{ background: '#f0f4f8', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'end', marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Icône</label>
                  <input style={{ ...inp, width: 64 }} value={s.icone} onChange={e => { const arr = [...config.services]; arr[i] = { ...arr[i], icone: e.target.value }; set('services', arr); }} placeholder="🏥" />
                </div>
                <div>
                  <label style={lbl}>Titre du service</label>
                  <input style={inp} value={s.titre} onChange={e => { const arr = [...config.services]; arr[i] = { ...arr[i], titre: e.target.value }; set('services', arr); }} />
                </div>
                <button style={{ ...btnD, marginBottom: 1 }} onClick={() => set('services', config.services.filter((_, j) => j !== i))}>✕</button>
              </div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={s.description} onChange={e => { const arr = [...config.services]; arr[i] = { ...arr[i], description: e.target.value }; set('services', arr); }} />
            </div>
          ))}
          <button style={btnP} onClick={() => set('services', [...config.services, { icone: '➕', titre: '', description: '' }])}>+ Ajouter un service</button>
        </div>
      )}

      {/* ── AVANTAGES ────────────────────────────────────────────────────────── */}
      {onglet === 'avantages' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Titre 1</label>
              <input style={inp} value={config.avantagesTitre1} onChange={e => set('avantagesTitre1', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre 2</label>
              <input style={inp} value={config.avantagesTitre2} onChange={e => set('avantagesTitre2', e.target.value)} />
            </div>
          </div>
          {config.avantages.map((a, i) => (
            <div key={i} style={{ background: '#f0f4f8', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={lbl}>Icône (emoji)</label>
                  <input style={inp} value={a.icone} onChange={e => { const arr = [...config.avantages]; arr[i] = { ...arr[i], icone: e.target.value }; set('avantages', arr); }} placeholder="🏠" />
                </div>
                <div>
                  <label style={lbl}>Titre</label>
                  <input style={inp} value={a.titre} onChange={e => { const arr = [...config.avantages]; arr[i] = { ...arr[i], titre: e.target.value }; set('avantages', arr); }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Description</label>
                  <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={a.description} onChange={e => { const arr = [...config.avantages]; arr[i] = { ...arr[i], description: e.target.value }; set('avantages', arr); }} />
                </div>
                <div>
                  <label style={lbl}>Texte du bouton</label>
                  <input style={inp} value={a.bouton} onChange={e => { const arr = [...config.avantages]; arr[i] = { ...arr[i], bouton: e.target.value }; set('avantages', arr); }} />
                </div>
                <div>
                  <label style={lbl}>Photo (URL)</label>
                  <input style={inp} value={a.photo} onChange={e => { const arr = [...config.avantages]; arr[i] = { ...arr[i], photo: e.target.value }; set('avantages', arr); }} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btnD} onClick={() => set('avantages', config.avantages.filter((_, j) => j !== i))}>🗑 Supprimer</button>
              </div>
            </div>
          ))}
          <button style={btnP} onClick={() => set('avantages', [...config.avantages, { icone: '🏥', titre: '', description: '', photo: '', bouton: 'En savoir plus' }])}>+ Ajouter un avantage</button>
        </div>
      )}

      {/* ── ÉQUIPE ───────────────────────────────────────────────────────────── */}
      {onglet === 'equipe' && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Titre 1</label>
              <input style={inp} value={config.equipeTitre1} onChange={e => set('equipeTitre1', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Titre 2</label>
              <input style={inp} value={config.equipeTitre2} onChange={e => set('equipeTitre2', e.target.value)} />
            </div>
          </div>
          {config.equipe.map((m, i) => (
            <div key={i} style={{ background: '#f0f4f8', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px', marginBottom: 10, display: 'flex', gap: 12 }}>
              {m.photo && <img src={m.photo} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>Nom</label>
                  <input style={inp} value={m.nom} onChange={e => { const arr = [...config.equipe]; arr[i] = { ...arr[i], nom: e.target.value }; set('equipe', arr); }} placeholder="Dr. Marie Dupont" />
                </div>
                <div>
                  <label style={lbl}>Spécialité</label>
                  <input style={inp} value={m.specialite} onChange={e => { const arr = [...config.equipe]; arr[i] = { ...arr[i], specialite: e.target.value }; set('equipe', arr); }} placeholder="Cardiologue" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Photo (URL)</label>
                  <input style={inp} value={m.photo} onChange={e => { const arr = [...config.equipe]; arr[i] = { ...arr[i], photo: e.target.value }; set('equipe', arr); }} placeholder="https://..." />
                </div>
              </div>
              <button style={{ ...btnD, alignSelf: 'flex-start' }} onClick={() => set('equipe', config.equipe.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button style={btnP} onClick={() => set('equipe', [...config.equipe, { nom: '', specialite: '', photo: '' }])}>+ Ajouter un membre</button>
        </div>
      )}

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────────── */}
      {onglet === 'temoignages' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section</label>
            <input style={inp} value={config.temoignagesTitre} onChange={e => set('temoignagesTitre', e.target.value)} />
          </div>
          {config.temoignages.map((t, i) => (
            <div key={i} style={{ background: '#f0f4f8', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Nom</label>
                  <input style={inp} value={t.nom} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], nom: e.target.value }; set('temoignages', arr); }} />
                </div>
                <div>
                  <label style={lbl}>Rôle (ex: Patient)</label>
                  <input style={inp} value={t.role} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], role: e.target.value }; set('temoignages', arr); }} />
                </div>
                <div>
                  <label style={lbl}>Photo (URL)</label>
                  <input style={inp} value={t.photo} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], photo: e.target.value }; set('temoignages', arr); }} placeholder="https://..." />
                </div>
              </div>
              <label style={lbl}>Témoignage</label>
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={t.texte} onChange={e => { const arr = [...config.temoignages]; arr[i] = { ...arr[i], texte: e.target.value }; set('temoignages', arr); }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={btnD} onClick={() => set('temoignages', config.temoignages.filter((_, j) => j !== i))}>✕</button>
              </div>
            </div>
          ))}
          <button style={btnP} onClick={() => set('temoignages', [...config.temoignages, { nom: '', role: 'Patient', photo: '', texte: '' }])}>+ Ajouter un témoignage</button>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      {onglet === 'faq' && (
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Titre de la section FAQ</label>
            <input style={inp} value={config.faqTitre} onChange={e => set('faqTitre', e.target.value)} />
          </div>
          {config.faq.map((item, i) => (
            <div key={i} style={{ background: '#f0f4f8', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Question</label>
                  <input style={inp} value={item.question} onChange={e => { const arr = [...config.faq]; arr[i] = { ...arr[i], question: e.target.value }; set('faq', arr); }} />
                </div>
                <button style={{ ...btnD, alignSelf: 'flex-end' }} onClick={() => set('faq', config.faq.filter((_, j) => j !== i))}>✕</button>
              </div>
              <label style={lbl}>Réponse</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={item.reponse} onChange={e => { const arr = [...config.faq]; arr[i] = { ...arr[i], reponse: e.target.value }; set('faq', arr); }} />
            </div>
          ))}
          <button style={btnP} onClick={() => set('faq', [...config.faq, { question: '', reponse: '' }])}>+ Ajouter une question</button>
        </div>
      )}

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      {onglet === 'contact' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📝 Section contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Titre section</label>
                <input style={inp} value={config.contactTitre} onChange={e => set('contactTitre', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <input style={inp} value={config.contactDescription} onChange={e => set('contactDescription', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📍 Coordonnées</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Courriel</label>
                <input style={inp} type="email" value={config.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Téléphone</label>
                <input style={inp} value={config.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Adresse complète</label>
                <input style={inp} value={config.adresse} onChange={e => set('adresse', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Heures d'ouverture</label>
                <input style={inp} value={config.heures} onChange={e => set('heures', e.target.value)} placeholder="Lun–Ven : 9h00 – 19h00" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Photo de la clinique (intérieur)</label>
                <input style={inp} value={config.photoClinik} onChange={e => set('photoClinik', e.target.value)} placeholder="https://..." />
                {config.photoClinik && <img src={config.photoClinik} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            </div>
          </div>

          <div style={{ ...card, background: '#f0f4f8', border: `1.5px solid ${CP}33` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: CP }}>🗺️ Carte Google Maps</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
              La carte s'affiche automatiquement via Google Maps Embed (sans clé API requise). Entrez l'adresse formatée pour l'URL.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Adresse pour la carte (URL-encodée, remplacez les espaces par +)</label>
                <input style={inp} value={config.carteAdresseQuery} onChange={e => set('carteAdresseQuery', e.target.value)} placeholder="1234+boulevard+de+la+Sante+Laval+QC" />
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Exemple : "1234+rue+Principale+Montreal+QC+H3B+1A1"</p>
              </div>
              {/* Aperçu */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', height: 200 }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${config.carteAdresseQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%" height="200" style={{ border: 0, display: 'block' }}
                  loading="lazy" title="Aperçu carte"
                />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📱 Réseaux sociaux</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { k: 'instagram' as const, l: 'Instagram (@)' },
                { k: 'facebook'  as const, l: 'Facebook (@)' },
                { k: 'youtube'   as const, l: 'YouTube (@)' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input style={inp} value={config[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 Footer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Slogan footer</label>
                <input style={inp} value={config.slogan} onChange={e => set('slogan', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Copyright</label>
                <input style={inp} value={config.copyright} onChange={e => set('copyright', e.target.value)} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── APPARENCE ────────────────────────────────────────────────────────── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🎨 Palette médicale</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { k: 'couleurPrincipale'  as const, l: 'Couleur principale', h: 'Boutons, icônes, accents → bleu médical' },
                { k: 'couleurSecondaire'  as const, l: 'Couleur secondaire',  h: 'Gradient du fond section contact' },
                { k: 'couleurFond'        as const, l: 'Fond sections grises', h: 'Sections alternées (services, équipe)' },
                { k: 'couleurTexte'       as const, l: 'Couleur texte',       h: 'Titres et corps de texte' },
              ].map(({ k, l, h }) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input type="color" value={config[k]} onChange={e => set(k, e.target.value)} style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} value={config[k]} onChange={e => set(k, e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{h}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { v: 'moderne'  as const, l: 'Inter (moderne, clean)' },
                { v: 'classique' as const, l: 'Playfair (classique)' },
                { v: 'sans'     as const, l: 'DM Sans (médical soft)' },
              ].map(({ v, l }) => (
                <div key={v} onClick={() => set('police', v)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === v ? CP : '#e5e7eb'}`, background: config.police === v ? CP + '12' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === v ? CP : '#444' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👁 Aperçu navbar</h3>
            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: config.couleurPrincipale, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>+</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: config.couleurTexte }}>{config.nomClinique}</span>
              </div>
              <button style={{ background: config.couleurPrincipale, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {config.heroBouton}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant bas */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(240,244,248,0.95)', backdropFilter: 'blur(6px)', borderTop: `1px solid ${CP}22`, margin: '0 -20px -28px', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnP, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder la clinique'}
        </button>
      </div>
    </div>
  );
}