// src/pages/gestionnaire/ConfigMultiVendeurPremium.tsx
// e-Vend Studio — Configuration du template Multi-Vendeur Premium
// Onglets par page · Toggle actif/inactif par section · Textes + couleurs

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';
const TXT  = '#1a1a2e';
const DORE = '#fbbf24';

interface Props { gestionnaireId: number; }

// ─── CONFIG PAR DÉFAUT ─────────────────────────────────────────────────────
const CFG_DEF = {
  // Identité globale
  nom_boutique: 'Ma Marketplace',
  slogan: 'La marketplace canadienne de confiance',
  couleur_accent: '#fbbf24',
  couleur_fond: '#0a0a0a',

  // Page Accueil
  accueil_hero_actif: true,
  accueil_hero_badge: '🇨🇦 Marketplace canadienne',
  accueil_categories_actif: true,
  accueil_categories_titre: 'Explorer par catégorie',
  accueil_nouveautes_actif: true,
  accueil_nouveautes_titre: 'Nouveautés',
  accueil_cta_vendeurs_actif: true,
  accueil_cta_titre: 'Vous êtes vendeur ?',
  accueil_cta_texte: 'Rejoignez notre marketplace et vendez vos produits à des milliers de clients canadiens.',

  // Page Catalogue
  catalogue_sidebar_actif: true,
  catalogue_filtres_actif: true,
  catalogue_tri_defaut: 'recent',

  // Page Boutiques
  boutiques_hero_titre: 'Découvrez nos boutiques',
  boutiques_hero_texte: 'Explorez les boutiques de nos vendeurs — artisans, collectionneurs et commerçants locaux.',

  // Page Produit
  produit_onglet_description_actif: true,
  produit_onglet_details_actif: true,
  produit_onglet_livraison_actif: true,
  produit_similaires_actif: true,

  // Page Enchères
  encheres_actif: true,
  encheres_hero_titre: 'Participez aux enchères',
  encheres_hero_texte: 'Misez sur des produits uniques de nos vendeurs.',

  // Footer
  footer_documents_actif: true,
  footer_politiques_actif: true,
};

// ─── COMPOSANTS UI ──────────────────────────────────────────────────────────
function Toggle({ value, onChange, couleur = DORE }: any) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? couleur : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function Champ({ label, value, onChange, type = 'text', placeholder = '', multiline = false, note = '' }: any) {
  const styleBase: any = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: TXT, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: multiline ? 'vertical' : 'none' };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} style={styleBase} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={styleBase} />}
      {note && <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>{note}</p>}
    </div>
  );
}

function SectionCard({ titre, icone, actif, onToggle, children, badge }: any) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${actif ? `${DORE}50` : '#e5e7eb'}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, transition: 'border-color 0.2s' }}>
      <div style={{ background: actif ? 'linear-gradient(135deg,#fffbeb,#fff)' : '#fafafa', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: actif ? '1px solid #fde68a' : '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 20 }}>{icone}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: TXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {titre}
            {badge && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{badge}</span>}
          </h3>
        </div>
        {onToggle && <Toggle value={actif} onChange={onToggle} />}
      </div>
      {actif !== false && <div style={{ padding: '18px 20px' }}>{children}</div>}
    </div>
  );
}

// ─── PAGE PRINCIPALE ────────────────────────────────────────────────────────
export default function ConfigMultiVendeurPremium({ gestionnaireId }: Props) {
  const [cfg, setCfg] = useState<any>(CFG_DEF);
  const [onglet, setOnglet] = useState<'identite'|'accueil'|'catalogue'|'boutiques'|'produit'|'encheres'|'footer'>('identite');
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle'|'ok'|'err'>('idle');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/config-multivendeur`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
    }).then(r => r.ok ? r.json() : {} as any).then((data: any) => {
      if (data && Object.keys(data).length > 0) setCfg((p: any) => ({ ...p, ...data }));
    }).catch(() => {});
  }, [gestionnaireId]);

  const set = (k: string, v: any) => setCfg((p: any) => ({ ...p, [k]: v }));

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/config-multivendeur`, {
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

  const ouvrirApercu = () => {
    window.open(`http://localhost:3000/site-preview?vendeurId=${gestionnaireId}`, '_blank', 'noopener,noreferrer');
  };

  const ONGLETS = [
    { id: 'identite',  label: 'Identité',  icone: '🏷️' },
    { id: 'accueil',   label: 'Accueil',   icone: '🏠' },
    { id: 'catalogue', label: 'Catalogue', icone: '🛍️' },
    { id: 'boutiques', label: 'Boutiques', icone: '🏪' },
    { id: 'produit',   label: 'Produit',   icone: '📦' },
    { id: 'encheres',  label: 'Enchères',  icone: '🔨' },
    { id: 'footer',    label: 'Footer',    icone: '🔗' },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: TXT, margin: 0 }}>Configurer mes pages</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Multi-Vendeur Premium — personnalisez chaque page de votre marketplace</p>
        </div>
        <button onClick={ouvrirApercu}
          style={{ padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
          👁 Aperçu de mon site →
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 0, background: '#f9fafb', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id as any)}
            style={{ flex: '1 1 auto', minWidth: 90, padding: '11px 10px', border: 'none', borderRadius: 10, background: onglet === o.id ? '#fff' : 'transparent', color: onglet === o.id ? TXT : '#888', fontSize: 13, fontWeight: onglet === o.id ? 800 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ══════════ ONGLET IDENTITÉ ══════════ */}
      {onglet === 'identite' && (
        <div>
          <SectionCard titre="Nom & slogan" icone="🏷️" actif={true}>
            <Champ label="Nom de la marketplace" value={cfg.nom_boutique} onChange={(v: string) => set('nom_boutique', v)} placeholder="Ma Marketplace" />
            <Champ label="Slogan" value={cfg.slogan} onChange={(v: string) => set('slogan', v)} placeholder="La marketplace canadienne de confiance" />
          </SectionCard>

          <SectionCard titre="Couleurs du site" icone="🎨" actif={true}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Couleur accent</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={cfg.couleur_accent} onChange={e => set('couleur_accent', e.target.value)} style={{ width: 44, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontSize: 12, color: TXT, fontFamily: 'monospace' }}>{cfg.couleur_accent}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Couleur de fond</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={cfg.couleur_fond} onChange={e => set('couleur_fond', e.target.value)} style={{ width: 44, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontSize: 12, color: TXT, fontFamily: 'monospace' }}>{cfg.couleur_fond}</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thèmes rapides</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8 }}>
              {[
                { label: 'Doré', accent: '#fbbf24', fond: '#0a0a0a' },
                { label: 'Bleu', accent: '#3b82f6', fond: '#060d1f' },
                { label: 'Émeraude', accent: '#10b981', fond: '#021810' },
                { label: 'Violet', accent: '#a855f7', fond: '#0d0618' },
                { label: 'Rose', accent: '#ec4899', fond: '#190613' },
                { label: 'Orange', accent: '#f97316', fond: '#1a0d02' },
              ].map(t => (
                <div key={t.label} onClick={() => { set('couleur_accent', t.accent); set('couleur_fond', t.fond); }}
                  style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '2px solid #e5e7eb', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = t.accent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                  <div style={{ height: 36, background: t.fond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.accent }} />
                  </div>
                  <div style={{ padding: '5px', textAlign: 'center', background: '#fafafa' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: TXT, margin: 0 }}>{t.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET ACCUEIL ══════════ */}
      {onglet === 'accueil' && (
        <div>
          <SectionCard titre="Bannière principale (Hero)" icone="🦸" actif={cfg.accueil_hero_actif} onToggle={(v: boolean) => set('accueil_hero_actif', v)}>
            <Champ label="Badge du hero" value={cfg.accueil_hero_badge} onChange={(v: string) => set('accueil_hero_badge', v)} placeholder="🇨🇦 Marketplace canadienne" note="Petite étiquette au-dessus du titre principal" />
          </SectionCard>

          <SectionCard titre="Section catégories" icone="📂" actif={cfg.accueil_categories_actif} onToggle={(v: boolean) => set('accueil_categories_actif', v)}>
            <Champ label="Titre de la section" value={cfg.accueil_categories_titre} onChange={(v: string) => set('accueil_categories_titre', v)} placeholder="Explorer par catégorie" />
          </SectionCard>

          <SectionCard titre="Section nouveautés" icone="✨" actif={cfg.accueil_nouveautes_actif} onToggle={(v: boolean) => set('accueil_nouveautes_actif', v)} badge="8 produits affichés">
            <Champ label="Titre de la section" value={cfg.accueil_nouveautes_titre} onChange={(v: string) => set('accueil_nouveautes_titre', v)} placeholder="Nouveautés" />
          </SectionCard>

          <SectionCard titre="Appel à l'action vendeurs" icone="📣" actif={cfg.accueil_cta_vendeurs_actif} onToggle={(v: boolean) => set('accueil_cta_vendeurs_actif', v)}>
            <Champ label="Titre" value={cfg.accueil_cta_titre} onChange={(v: string) => set('accueil_cta_titre', v)} placeholder="Vous êtes vendeur ?" />
            <Champ label="Texte" value={cfg.accueil_cta_texte} onChange={(v: string) => set('accueil_cta_texte', v)} multiline placeholder="Rejoignez notre marketplace..." />
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET CATALOGUE ══════════ */}
      {onglet === 'catalogue' && (
        <div>
          <SectionCard titre="Filtres latéraux" icone="🗂️" actif={cfg.catalogue_sidebar_actif} onToggle={(v: boolean) => set('catalogue_sidebar_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Liste des catégories à gauche du catalogue, permettant de filtrer rapidement.</p>
          </SectionCard>

          <SectionCard titre="Panneau de filtres avancés" icone="⚙️" actif={cfg.catalogue_filtres_actif} onToggle={(v: boolean) => set('catalogue_filtres_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Tri, fourchette de prix et filtre de stock.</p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tri par défaut</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: 'recent', l: 'Plus récent' }, { v: 'prix_asc', l: 'Prix ↑' },
                { v: 'prix_desc', l: 'Prix ↓' }, { v: 'alpha_az', l: 'A → Z' },
              ].map(o => (
                <button key={o.v} onClick={() => set('catalogue_tri_defaut', o.v)}
                  style={{ padding: '7px 14px', border: `2px solid ${cfg.catalogue_tri_defaut === o.v ? DORE : '#e5e7eb'}`, background: cfg.catalogue_tri_defaut === o.v ? '#fffbeb' : '#fff', color: cfg.catalogue_tri_defaut === o.v ? '#92400e' : TXT, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET BOUTIQUES ══════════ */}
      {onglet === 'boutiques' && (
        <div>
          <SectionCard titre="Bannière de la page Boutiques" icone="🦸" actif={true}>
            <Champ label="Titre" value={cfg.boutiques_hero_titre} onChange={(v: string) => set('boutiques_hero_titre', v)} placeholder="Découvrez nos boutiques" />
            <Champ label="Texte" value={cfg.boutiques_hero_texte} onChange={(v: string) => set('boutiques_hero_texte', v)} multiline placeholder="Explorez les boutiques de nos vendeurs..." />
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET PRODUIT ══════════ */}
      {onglet === 'produit' && (
        <div>
          <SectionCard titre="Onglet Description" icone="📝" actif={cfg.produit_onglet_description_actif} onToggle={(v: boolean) => set('produit_onglet_description_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Affiche la description complète du produit.</p>
          </SectionCard>
          <SectionCard titre="Onglet Détails" icone="📋" actif={cfg.produit_onglet_details_actif} onToggle={(v: boolean) => set('produit_onglet_details_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Marque, modèle, état, garantie, SKU et autres spécifications.</p>
          </SectionCard>
          <SectionCard titre="Onglet Livraison" icone="🚚" actif={cfg.produit_onglet_livraison_actif} onToggle={(v: boolean) => set('produit_onglet_livraison_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Informations générales sur la livraison et le ramassage.</p>
          </SectionCard>
          <SectionCard titre="Produits similaires" icone="🔗" actif={cfg.produit_similaires_actif} onToggle={(v: boolean) => set('produit_similaires_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Affiche jusqu'à 4 produits suggérés en bas de la fiche produit.</p>
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET ENCHÈRES ══════════ */}
      {onglet === 'encheres' && (
        <div>
          <SectionCard titre="Module Enchères" icone="🔨" actif={cfg.encheres_actif} onToggle={(v: boolean) => set('encheres_actif', v)} badge="Add-on requis">
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Désactiver cache le lien Enchères du menu et de la navigation.</p>
            <Champ label="Titre de la bannière" value={cfg.encheres_hero_titre} onChange={(v: string) => set('encheres_hero_titre', v)} placeholder="Participez aux enchères" />
            <Champ label="Texte" value={cfg.encheres_hero_texte} onChange={(v: string) => set('encheres_hero_texte', v)} multiline placeholder="Misez sur des produits uniques..." />
          </SectionCard>
        </div>
      )}

      {/* ══════════ ONGLET FOOTER ══════════ */}
      {onglet === 'footer' && (
        <div>
          <SectionCard titre="Lien Documents" icone="📄" actif={cfg.footer_documents_actif} onToggle={(v: boolean) => set('footer_documents_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Affiche le lien vers vos guides et documents dans le pied de page.</p>
          </SectionCard>
          <SectionCard titre="Liens Politiques" icone="📋" actif={cfg.footer_politiques_actif} onToggle={(v: boolean) => set('footer_politiques_actif', v)}>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Affiche les liens vers vos politiques légales (confidentialité, retours, etc.).</p>
          </SectionCard>
        </div>
      )}

      {/* Sauvegarder */}
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 24, paddingTop: 24, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', bottom: 0, background: '#fff', paddingBottom: 8 }}>
        <button onClick={sauvegarder} disabled={saving}
          style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(251,191,36,0.3)' }}>
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les changements'}
        </button>
        {statut === 'ok' && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>✅ Configuration sauvegardée !</span>}
        {statut === 'err' && <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 700 }}>❌ Erreur — réessayez.</span>}
      </div>
    </div>
  );
}