// src/pages/gestionnaire/ConfigVerificateurAge.tsx
// e-Vend Studio — Configuration du vérificateur d'âge (Add-On)
// Visible seulement si l'add-on est activé dans Branding & Options

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const ROUGE = '#ef4444';
const TXT   = '#1a1a2e';

interface Props { gestionnaireId: number; }

const MODES = [
  { id: 'boutons',         label: 'Boutons Oui / Non',      desc: 'Simple et rapide — 2 boutons Accepter / Refuser',       icone: '🔘' },
  { id: 'date_naissance',  label: 'Date de naissance',      desc: 'Champs Jour / Mois / Année — validation automatique',   icone: '📅' },
  { id: 'annee_naissance', label: 'Année de naissance',     desc: 'Saisie de l\'année seulement — plus simple',            icone: '🗓️' },
];

const THEMES = [
  { id: 'sombre',  label: 'Sombre',    fond: '#0f0f0f', accent: '#ef4444' },
  { id: 'bleu',    label: 'Bleu Pro',  fond: '#0a1628', accent: '#3b82f6' },
  { id: 'violet',  label: 'Violet',    fond: '#0d0618', accent: '#8b5cf6' },
  { id: 'vert',    label: 'Vert',      fond: '#021a0a', accent: '#22c55e' },
  { id: 'custom',  label: 'Personnalisé', fond: '#0f0f0f', accent: '#ef4444' },
];

const CFG_DEF = {
  actif: true,
  age_minimum: 18,
  mode: 'boutons',
  theme: 'sombre',
  titre: 'Vérification d\'âge requise',
  message: 'Ce site est réservé aux personnes majeures. Veuillez confirmer votre âge pour continuer.',
  texte_accepter: 'Oui, j\'ai 18 ans ou plus',
  texte_refuser: 'Non, j\'ai moins de 18 ans',
  couleur_fond: '#0f0f0f',
  couleur_accent: '#ef4444',
  logo_url: '',
  url_redirection_refus: '',
  se_souvenir_jours: 30,
};

function Champ({ label, value, onChange, type='text', placeholder='', multiline=false }: any) {
  const s: any = { width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, color:TXT, outline:'none', fontFamily:'inherit', resize:multiline?'vertical':'none', boxSizing:'border-box' };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={s} />
                 : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} />}
    </div>
  );
}

// Mini aperçu du popup
function ApercuPopup({ cfg }: { cfg: any }) {
  const accent = cfg.couleur_accent || '#ef4444';
  const fond   = cfg.couleur_fond   || '#0f0f0f';
  return (
    <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: fond, borderRadius: 16, padding: '20px 24px', maxWidth: 320, width: '100%', boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent}40` }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔞</div>
          <div style={{ display: 'inline-block', background: accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, marginBottom: 10 }}>{cfg.age_minimum}+</div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{cfg.titre || 'Vérification d\'âge'}</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{cfg.message?.slice(0, 80)}{cfg.message?.length > 80 ? '...' : ''}</p>
        </div>
        {cfg.mode === 'boutons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px', background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{cfg.texte_accepter?.slice(0, 35) || `Oui, j'ai ${cfg.age_minimum} ans ou plus`}</div>
            <div style={{ padding: '10px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, textAlign: 'center' }}>{cfg.texte_refuser?.slice(0, 35) || `Non, j'ai moins de ${cfg.age_minimum} ans`}</div>
          </div>
        )}
        {cfg.mode === 'date_naissance' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 6, marginBottom: 8 }}>
              {['Jour', 'Mois', 'Année'].map(p => <div key={p} style={{ padding: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{p}</div>)}
            </div>
            <div style={{ padding: '10px', background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Confirmer mon âge</div>
          </div>
        )}
        {cfg.mode === 'annee_naissance' && (
          <div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 8 }}>Ex : 1990</div>
            <div style={{ padding: '10px', background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Confirmer mon âge</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfigVerificateurAge({ gestionnaireId }: Props) {
  const [cfg, setCfg]     = useState<any>(CFG_DEF);
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle'|'ok'|'err'>('idle');
  const [onglet, setOnglet] = useState<'general'|'apparence'|'textes'|'avance'>('general');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/verificateur-age`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
    }).then(r => r.ok ? r.json() : {}).then(data => {
      if (data && Object.keys(data).length > 0) setCfg((prev: any) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, [gestionnaireId]);

  const set = (key: string, val: any) => {
    setCfg((prev: any) => {
      const next = { ...prev, [key]: val };
      // Mettre à jour les textes automatiquement si on change l'âge et que le texte contient l'ancien âge
      if (key === 'age_minimum') {
        const ancien = prev.age_minimum;
        if (prev.texte_accepter?.includes(String(ancien))) {
          next.texte_accepter = prev.texte_accepter.replace(String(ancien), String(val));
        }
        if (prev.texte_refuser?.includes(String(ancien))) {
          next.texte_refuser = prev.texte_refuser.replace(String(ancien), String(val));
        }
      }
      return next;
    });
  };

  const appliquerTheme = (themeId: string) => {
    const t = THEMES.find(t => t.id === themeId);
    if (t && themeId !== 'custom') {
      setCfg((prev: any) => ({ ...prev, theme: themeId, couleur_fond: t.fond, couleur_accent: t.accent }));
    } else {
      set('theme', themeId);
    }
  };

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/verificateur-age`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  const ONGLETS = [
    { id:'general',    label:'Général',    icone:'⚙️' },
    { id:'apparence',  label:'Apparence',  icone:'🎨' },
    { id:'textes',     label:'Textes',     icone:'✏️' },
    { id:'avance',     label:'Avancé',     icone:'🔧' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#dc2626,#991b1b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔞</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TXT, margin: 0 }}>Vérificateur d'âge</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Configurez la popup de vérification qui s'affiche sur votre boutique</p>
        </div>
        <div style={{ marginLeft: 'auto', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: ROUGE }}>
          Add-On actif · 5,00 $/mois
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Panneau gauche */}
        <div>
          {/* Onglets */}
          <div style={{ display: 'flex', gap: 0, background: '#f9fafb', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid #e5e7eb' }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id as any)}
                style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 9, background: onglet === o.id ? '#fff' : 'transparent', color: onglet === o.id ? TXT : '#888', fontSize: 13, fontWeight: onglet === o.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {o.icone} {o.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Général ── */}
          {onglet === 'general' && (
            <div>
              {/* Âge minimum */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Âge minimum requis</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[16, 18, 19, 21, 25].map(age => (
                    <button key={age} onClick={() => set('age_minimum', age)}
                      style={{ padding: '10px 20px', border: `2px solid ${cfg.age_minimum === age ? ROUGE : '#e5e7eb'}`, background: cfg.age_minimum === age ? ROUGE : '#fff', color: cfg.age_minimum === age ? '#fff' : TXT, borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s', minWidth: 64 }}>
                      {age}+
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#888', margin: '10px 0 0' }}>Au Québec et en Ontario, l'âge légal pour l'alcool et le cannabis est 18/19 ans.</p>
              </div>

              {/* Mode de vérification */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Mode de vérification</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MODES.map(m => (
                    <div key={m.id} onClick={() => set('mode', m.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: `2px solid ${cfg.mode === m.id ? ROUGE : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer', background: cfg.mode === m.id ? '#fef2f2' : '#fafafa', transition: 'all 0.15s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.mode === m.id ? '#fecaca' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{m.icone}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TXT }}>{m.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{m.desc}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', border: `2px solid ${cfg.mode === m.id ? ROUGE : '#ddd'}`, background: cfg.mode === m.id ? ROUGE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {cfg.mode === m.id && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mémorisation */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Mémorisation</h3>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>Combien de jours avant de redemander la vérification ?</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[1, 7, 30, 90, 365].map(j => (
                    <button key={j} onClick={() => set('se_souvenir_jours', j)}
                      style={{ padding: '8px 16px', border: `2px solid ${cfg.se_souvenir_jours === j ? ROUGE : '#e5e7eb'}`, background: cfg.se_souvenir_jours === j ? ROUGE : '#fff', color: cfg.se_souvenir_jours === j ? '#fff' : TXT, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {j === 1 ? '1 jour' : j === 365 ? '1 an' : `${j} jours`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Onglet Apparence ── */}
          {onglet === 'apparence' && (
            <div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Thème</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
                  {THEMES.map(t => (
                    <div key={t.id} onClick={() => appliquerTheme(t.id)}
                      style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${cfg.theme === t.id ? ROUGE : '#e5e7eb'}`, transition: 'all 0.15s' }}>
                      <div style={{ height: 52, background: `linear-gradient(135deg, ${t.fond}, ${t.accent}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔞</div>
                      </div>
                      <div style={{ padding: '8px', textAlign: 'center', background: cfg.theme === t.id ? '#fef2f2' : '#fafafa' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: TXT, margin: 0 }}>{t.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {cfg.theme === 'custom' && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Couleurs personnalisées</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { label: 'Fond du popup', key: 'couleur_fond' },
                      { label: 'Couleur accent', key: 'couleur_accent' },
                    ].map(c => (
                      <div key={c.key}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="color" value={cfg[c.key]} onChange={e => set(c.key, e.target.value)}
                            style={{ width: 44, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                          <span style={{ fontSize: 13, color: TXT, fontWeight: 600, fontFamily: 'monospace' }}>{cfg[c.key]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Logo (optionnel)</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>URL d'une image à afficher en haut du popup (remplace l'icône 🔞)</p>
                <Champ label="" value={cfg.logo_url || ''} onChange={(v: string) => set('logo_url', v)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* ── Onglet Textes ── */}
          {onglet === 'textes' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 20px' }}>Textes du popup</h3>
              <Champ label="Titre" value={cfg.titre} onChange={(v: string) => set('titre', v)} placeholder="Vérification d'âge requise" />
              <Champ label="Message" value={cfg.message} onChange={(v: string) => set('message', v)} multiline placeholder="Ce site est réservé aux personnes majeures..." />
              {cfg.mode === 'boutons' && <>
                <Champ label="Bouton Accepter" value={cfg.texte_accepter} onChange={(v: string) => set('texte_accepter', v)} placeholder="Oui, j'ai 18 ans ou plus" />
                <Champ label="Bouton Refuser" value={cfg.texte_refuser} onChange={(v: string) => set('texte_refuser', v)} placeholder="Non, j'ai moins de 18 ans" />
              </>}
            </div>
          )}

          {/* ── Onglet Avancé ── */}
          {onglet === 'avance' && (
            <div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Redirection en cas de refus</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>URL vers laquelle rediriger le visiteur refusé (laissez vide pour Google)</p>
                <Champ label="" value={cfg.url_redirection_refus || ''} onChange={(v: string) => set('url_redirection_refus', v)} placeholder="https://www.google.com" />
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
                <strong>⚖️ Avertissement légal</strong><br />
                La vérification d'âge par simple déclaration ne garantit pas la conformité légale dans toutes les juridictions. Consultez un conseiller juridique pour votre situation spécifique.
              </div>
            </div>
          )}

          {/* Bouton sauvegarder */}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={sauvegarder} disabled={saving}
              style={{ padding: '12px 28px', background: `linear-gradient(135deg,#dc2626,${ROUGE})`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder la configuration'}
            </button>
            {statut === 'ok' && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>✅ Sauvegardé !</span>}
            {statut === 'err' && <span style={{ fontSize: 13, color: ROUGE, fontWeight: 700 }}>❌ Erreur — réessayez.</span>}
          </div>
        </div>

        {/* Aperçu en direct */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: '16px', border: '1px solid #333' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', textAlign: 'center' }}>Aperçu en direct</p>
            <ApercuPopup cfg={{...cfg}} />
            <p style={{ fontSize: 11, color: '#555', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>
              L'aperçu se met à jour en temps réel
            </p>
          </div>

          {/* Infos add-on */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: TXT, margin: '0 0 10px' }}>ℹ️ À propos de cet add-on</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['✅ S\'affiche sur tous vos templates', '✅ Mémorisation par navigateur', '✅ 3 modes de vérification', '✅ Écran de blocage si refus', '✅ Entièrement personnalisable'].map((item, i) => (
                <p key={i} style={{ fontSize: 12, color: '#555', margin: 0 }}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}