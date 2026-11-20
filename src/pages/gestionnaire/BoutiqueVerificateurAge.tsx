// CHEMIN : src/pages/gestionnaire/BoutiqueVerificateurAge.tsx
// e-Vend Studio — Add-on « Vérificateur d'âge » (boutique solo) : configuration côté gestionnaire.
// Réglages de la fenêtre affichée à l'arrivée sur SA boutique : âge minimum, mode, mémorisation, thème/couleurs, logo, textes, redirection.
// API : GET/PUT /api/boutique/gestionnaire/verificateur-age  (l'enregistrement exige l'add-on actif) — aucun lien avec le MV.

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const ROUGE = '#ef4444';
const TXT = '#1a1a2e';

const MODES = [
  { id: 'boutons', label: 'Boutons Oui / Non', desc: 'Simple et rapide — 2 boutons Accepter / Refuser', icone: '🔘' },
  { id: 'date_naissance', label: 'Date de naissance', desc: 'Champs Jour / Mois / Année — validation automatique', icone: '📅' },
  { id: 'annee_naissance', label: 'Année de naissance', desc: "Saisie de l'année seulement — plus simple", icone: '🗓️' },
];
const THEMES = [
  { id: 'sombre', label: 'Sombre', fond: '#0f0f0f', accent: '#ef4444' },
  { id: 'bleu', label: 'Bleu Pro', fond: '#0a1628', accent: '#3b82f6' },
  { id: 'violet', label: 'Violet', fond: '#0d0618', accent: '#8b5cf6' },
  { id: 'vert', label: 'Vert', fond: '#021a0a', accent: '#22c55e' },
  { id: 'custom', label: 'Personnalisé', fond: '#0f0f0f', accent: '#ef4444' },
];
const AGES = [16, 18, 19, 21, 25];
const JOURS = [1, 7, 30, 90, 365];

const CFG_DEF: any = {
  actif: true, age_minimum: 18, mode: 'boutons', theme: 'sombre',
  titre: "Vérification d'âge requise",
  message: 'Ce site est réservé aux personnes majeures. Veuillez confirmer votre âge pour continuer.',
  texte_accepter: "Oui, j'ai 18 ans ou plus", texte_refuser: "Non, j'ai moins de 18 ans",
  couleur_fond: '#0f0f0f', couleur_accent: '#ef4444', logo_url: '', url_redirection_refus: '', se_souvenir_jours: 30,
};

function Champ({ label, value, onChange, placeholder = '', multiline = false, max }: any) {
  const s: any = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: TXT, outline: 'none', fontFamily: 'inherit', resize: multiline ? 'vertical' : 'none', boxSizing: 'border-box' };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      {multiline ? <textarea value={value} maxLength={max} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={s} />
        : <input type="text" value={value} maxLength={max} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s} />}
    </div>
  );
}

// Mini aperçu de la fenêtre
function ApercuPopup({ cfg }: { cfg: any }) {
  const accent = cfg.couleur_accent || '#ef4444', fond = cfg.couleur_fond || '#0f0f0f';
  const msg = String(cfg.message || '');
  return (
    <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: fond, borderRadius: 16, padding: '20px 24px', maxWidth: 320, width: '100%', boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent}40` }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔞</div>
          <div style={{ display: 'inline-block', background: accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, marginBottom: 10 }}>{cfg.age_minimum}+</div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{cfg.titre || "Vérification d'âge"}</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{msg.slice(0, 80)}{msg.length > 80 ? '...' : ''}</p>
        </div>
        {cfg.mode === 'boutons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: 10, background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{String(cfg.texte_accepter || '').slice(0, 35) || `Oui, j'ai ${cfg.age_minimum} ans ou plus`}</div>
            <div style={{ padding: 10, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, textAlign: 'center' }}>{String(cfg.texte_refuser || '').slice(0, 35) || `Non, j'ai moins de ${cfg.age_minimum} ans`}</div>
          </div>
        )}
        {cfg.mode === 'date_naissance' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 6, marginBottom: 8 }}>
              {['Jour', 'Mois', 'Année'].map(p => <div key={p} style={{ padding: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{p}</div>)}
            </div>
            <div style={{ padding: 10, background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Confirmer mon âge</div>
          </div>
        )}
        {cfg.mode === 'annee_naissance' && (
          <div>
            <div style={{ padding: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 8 }}>Ex : 1990</div>
            <div style={{ padding: 10, background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Confirmer mon âge</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoutiqueVerificateurAge({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const [cfg, setCfg] = useState<any>(CFG_DEF);
  const [addonActif, setAddonActif] = useState(true);
  const [existe, setExiste] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [onglet, setOnglet] = useState<'general' | 'apparence' | 'textes' | 'avance'>('general');
  const [guide, setGuide] = useState('');
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes'; message: string } | null>(null);

  const charger = useCallback(async () => {
    const [r, a] = await Promise.all([bq('/verificateur-age'), bq('/addons')]);
    if (r.ok && r.data && r.data.config) {
      setCfg({ ...CFG_DEF, ...r.data.config, logo_url: r.data.config.logo_url || '', url_redirection_refus: r.data.config.url_redirection_refus || '' });
      setAddonActif(r.data.addon_actif !== false);
      setExiste(r.data.existe === true);
    } else if (!r.ok) setModale({ type: 'erreur', message: messageErreur(r) });
    if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'verificateur_age'); if (g && g.guide_url) setGuide(g.guide_url); }
    setChargement(false);
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const set = (key: string, val: any) => {
    setCfg((prev: any) => {
      const next = { ...prev, [key]: val };
      if (key === 'age_minimum') {   // les textes des boutons suivent l'âge s'ils le contiennent
        const ancien = String(prev.age_minimum);
        if (String(prev.texte_accepter || '').includes(ancien)) next.texte_accepter = prev.texte_accepter.replace(ancien, String(val));
        if (String(prev.texte_refuser || '').includes(ancien)) next.texte_refuser = prev.texte_refuser.replace(ancien, String(val));
      }
      return next;
    });
  };
  const appliquerTheme = (id: string) => {
    const t = THEMES.find(x => x.id === id);
    if (t && id !== 'custom') setCfg((prev: any) => ({ ...prev, theme: id, couleur_fond: t.fond, couleur_accent: t.accent }));
    else set('theme', id);
  };

  const sauvegarder = async () => {
    setOccupe(true);
    const r = await bq('/verificateur-age', { method: 'PUT', body: cfg });
    setOccupe(false);
    if (r.ok) { setExiste(true); if (r.data && r.data.config) setCfg((p: any) => ({ ...p, ...r.data.config, logo_url: r.data.config.logo_url || '', url_redirection_refus: r.data.config.url_redirection_refus || '' })); setModale({ type: 'succes', message: cfg.actif ? 'Configuration enregistrée. La vérification est active sur votre boutique.' : 'Configuration enregistrée. La vérification est en pause (non affichée).' }); }
    else setModale({ type: 'erreur', message: messageErreur(r) });
  };

  const ONGLETS = [{ id: 'general', label: 'Général', icone: '⚙️' }, { id: 'apparence', label: 'Apparence', icone: '🎨' }, { id: 'textes', label: 'Textes', icone: '✏️' }, { id: 'avance', label: 'Avancé', icone: '🔧' }];
  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 16 };
  const choix = (actif: boolean): React.CSSProperties => ({ padding: '10px 20px', border: `2px solid ${actif ? ROUGE : '#e5e7eb'}`, background: actif ? ROUGE : '#fff', color: actif ? '#fff' : TXT, borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', minWidth: 64, fontFamily: 'inherit' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement…</div>;
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔞</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TXT, margin: 0 }}>Vérificateur d'âge</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Configurez la fenêtre de vérification qui s'affiche à l'arrivée sur votre boutique</p>
        </div>
        {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #1e0533, #0d0a2e)', color: 'white', fontSize: 13, fontWeight: 700 }}><span>📖</span><span>Guide</span></a>}
      </div>

      {!addonActif && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 18 }}>
          🔒 L'add-on <strong>Vérificateur d'âge</strong> n'est pas activé : vous pouvez regarder les réglages, mais l'enregistrement est désactivé. Activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      )}
      {addonActif && !existe && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 18 }}>
          ℹ️ Rien n'est encore enregistré : la fenêtre ne s'affiche pas sur votre boutique tant que vous n'avez pas cliqué sur « Sauvegarder la configuration ».
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', background: '#f9fafb', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ flex: 1, minWidth: isMobile ? 70 : 0, padding: '10px 8px', border: 'none', borderRadius: 9, background: onglet === o.id ? '#fff' : 'transparent', color: onglet === o.id ? TXT : '#888', fontSize: 13, fontWeight: onglet === o.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{o.icone} {o.label}</button>
            ))}
          </div>

          {onglet === 'general' && (
            <div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 12px' }}>Activation</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: TXT }}>
                  <input type="checkbox" checked={cfg.actif !== false} onChange={e => set('actif', e.target.checked)} style={{ width: 18, height: 18 }} />
                  Afficher la vérification d'âge sur ma boutique
                </label>
                <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0' }}>Décochez pour mettre la vérification en pause sans perdre vos réglages.</p>
              </div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Âge minimum requis</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AGES.map(age => <button key={age} onClick={() => set('age_minimum', age)} style={choix(cfg.age_minimum === age)}>{age}+</button>)}
                </div>
                <p style={{ fontSize: 12, color: '#888', margin: '10px 0 0' }}>Au Québec et en Ontario, l'âge légal pour l'alcool et le cannabis est 18/19 ans. Si vous relevez l'âge, les visiteurs déjà acceptés sont redemandés.</p>
              </div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Mode de vérification</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MODES.map(m => (
                    <div key={m.id} onClick={() => set('mode', m.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: `2px solid ${cfg.mode === m.id ? ROUGE : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer', background: cfg.mode === m.id ? '#fef2f2' : '#fafafa' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.mode === m.id ? '#fecaca' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{m.icone}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TXT }}>{m.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{m.desc}</p>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${cfg.mode === m.id ? ROUGE : '#ddd'}`, background: cfg.mode === m.id ? ROUGE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.mode === m.id && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Mémorisation</h3>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>Combien de jours avant de redemander la vérification à un visiteur accepté ?</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {JOURS.map(j => <button key={j} onClick={() => set('se_souvenir_jours', j)} style={{ ...choix(cfg.se_souvenir_jours === j), padding: '8px 16px', fontSize: 13, minWidth: 0 }}>{j === 1 ? '1 jour' : j === 365 ? '1 an' : `${j} jours`}</button>)}
                </div>
              </div>
            </div>
          )}

          {onglet === 'apparence' && (
            <div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Thème</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
                  {THEMES.map(t => (
                    <div key={t.id} onClick={() => appliquerTheme(t.id)} style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${cfg.theme === t.id ? ROUGE : '#e5e7eb'}` }}>
                      <div style={{ height: 52, background: `linear-gradient(135deg, ${t.fond}, ${t.accent}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔞</div>
                      </div>
                      <div style={{ padding: 8, textAlign: 'center', background: cfg.theme === t.id ? '#fef2f2' : '#fafafa' }}><p style={{ fontSize: 12, fontWeight: 700, color: TXT, margin: 0 }}>{t.label}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              {cfg.theme === 'custom' && (
                <div style={carte}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 16px' }}>Couleurs personnalisées</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    {[{ label: 'Fond de la fenêtre', key: 'couleur_fond' }, { label: "Couleur d'accent", key: 'couleur_accent' }].map(c => (
                      <div key={c.key}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="color" aria-label={c.label} value={/^#[0-9a-fA-F]{6}$/.test(cfg[c.key]) ? cfg[c.key] : '#000000'} onChange={e => set(c.key, e.target.value)} style={{ width: 44, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                          <span style={{ fontSize: 13, color: TXT, fontWeight: 600, fontFamily: 'monospace' }}>{cfg[c.key]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Logo (optionnel)</h3>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Adresse https:// d'une image à afficher en haut de la fenêtre (remplace l'icône 🔞)</p>
                <Champ label="" value={cfg.logo_url || ''} onChange={(v: string) => set('logo_url', v)} placeholder="https://..." max={500} />
              </div>
            </div>
          )}

          {onglet === 'textes' && (
            <div style={carte}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 20px' }}>Textes de la fenêtre</h3>
              <Champ label="Titre" value={cfg.titre} onChange={(v: string) => set('titre', v)} placeholder="Vérification d'âge requise" max={200} />
              <Champ label="Message" value={cfg.message} onChange={(v: string) => set('message', v)} multiline placeholder="Ce site est réservé aux personnes majeures..." max={600} />
              {cfg.mode === 'boutons' ? <>
                <Champ label="Bouton Accepter" value={cfg.texte_accepter} onChange={(v: string) => set('texte_accepter', v)} placeholder="Oui, j'ai 18 ans ou plus" max={200} />
                <Champ label="Bouton Refuser" value={cfg.texte_refuser} onChange={(v: string) => set('texte_refuser', v)} placeholder="Non, j'ai moins de 18 ans" max={200} />
              </> : <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Les textes des boutons Accepter / Refuser ne servent qu'au mode « Boutons Oui / Non ».</p>}
            </div>
          )}

          {onglet === 'avance' && (
            <div>
              <div style={carte}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: '0 0 8px' }}>Redirection en cas de refus</h3>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Adresse https:// vers laquelle envoyer le visiteur refusé (laissez vide pour Google)</p>
                <Champ label="" value={cfg.url_redirection_refus || ''} onChange={(v: string) => set('url_redirection_refus', v)} placeholder="https://www.google.com" max={500} />
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
                <strong>⚖️ Avertissement légal</strong><br />
                La vérification d'âge par simple déclaration ne garantit pas la conformité légale dans toutes les juridictions. Consultez un conseiller juridique pour votre situation spécifique.
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 20 }}>
            <button onClick={sauvegarder} disabled={occupe || !addonActif} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: occupe || !addonActif ? 'not-allowed' : 'pointer', opacity: !addonActif ? 0.5 : 1, fontFamily: 'inherit' }}>
              {occupe ? '⏳ Sauvegarde...' : '💾 Sauvegarder la configuration'}
            </button>
          </div>
        </div>

        <div style={{ position: isMobile ? 'static' : 'sticky', top: 24 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 16, border: '1px solid #333' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', textAlign: 'center' }}>Aperçu en direct</p>
            <ApercuPopup cfg={cfg} />
            <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>L'aperçu se met à jour en temps réel</p>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: TXT, margin: '0 0 10px' }}>ℹ️ À propos de cet add-on</p>
            {["✅ S'affiche à l'arrivée sur votre boutique", '✅ Mémorisation par navigateur', '✅ 3 modes de vérification', '✅ Écran de blocage si refus', '✅ Entièrement personnalisable'].map((t, i) => <p key={i} style={{ fontSize: 12, color: '#555', margin: '0 0 6px' }}>{t}</p>)}
          </div>
        </div>
      </div>

      {modale && <BoutiqueModale type={modale.type} accent={accent} message={modale.message} onFermer={() => setModale(null)} />}
    </div>
  );
}