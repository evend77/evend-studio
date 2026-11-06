// CHEMIN : src/pages/gestionnaire/ConfigMultiVendeurPremium.tsx
// e-Vend Studio — Configuration du template Multi-Vendeur Premium
// Onglets par page · Toggle actif/inactif par section · Textes + couleurs

import React, { useState, useEffect } from 'react';

const API_BASE = '/api';
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

// ─── RÉGLAGES SOUPLES (colonne `extra` côté base) ──────────────────────────
interface CarteAvantage { icone: string; titre: string; texte: string; }

const AVANTAGES_DEF = { actif: false, titre: '', sous_titre: '', cartes: [] as CarteAvantage[] };
const MAX_CARTES = 6;
const ICONES_SUGGEREES = ['🇨🇦', '🔒', '📍', '⚡', '💬', '🔨', '⭐', '🚚', '💳', '🎁', '🛡️', '❤️'];

const RESEAUX = [
  { cle: 'facebook',  nom: 'Facebook',    icone: '📘', ph: 'https://www.facebook.com/votre-page',   note: 'Lien vers votre page Facebook.' },
  { cle: 'instagram', nom: 'Instagram',   icone: '📸', ph: 'https://www.instagram.com/votre-compte', note: 'Lien vers votre page Instagram.' },
  { cle: 'x',         nom: 'X (Twitter)', icone: '✖️', ph: 'https://x.com/votre-compte',             note: 'Lien vers votre page X (Twitter).' },
  { cle: 'linkedin',  nom: 'LinkedIn',    icone: '💼', ph: 'https://linkedin.com/company/votre-page', note: 'Lien vers votre page LinkedIn.' },
  { cle: 'youtube',   nom: 'YouTube',     icone: '▶️', ph: 'https://youtube.com/@votre-chaine',      note: 'Lien vers votre page YouTube.' },
  { cle: 'tiktok',    nom: 'TikTok',      icone: '🎵', ph: 'https://tiktok.com/@votre-compte',       note: 'Lien vers votre page TikTok.' },
  { cle: 'pinterest', nom: 'Pinterest',   icone: '📌', ph: 'https://pinterest.com/votre-compte',     note: 'Lien vers votre page Pinterest.' },
];

const lienValide = (u: string) => /^https:\/\/[^\s<>"']+$/i.test((u || '').trim());

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

  // Réglages souples : cartes de l'accueil + réseaux sociaux (colonne `extra`)
  const extra: any = cfg.extra && typeof cfg.extra === 'object' ? cfg.extra : {};
  const av = { ...AVANTAGES_DEF, ...(extra.accueil_avantages || {}) };
  const cartes: CarteAvantage[] = Array.isArray(av.cartes) ? av.cartes : [];
  const reseaux: Record<string, string> = extra.reseaux_sociaux || {};
  const setExtra = (cle: string, valeur: any) =>
    setCfg((p: any) => ({ ...p, extra: { ...(p.extra && typeof p.extra === 'object' ? p.extra : {}), [cle]: valeur } }));
  const ba = { actif: false, url: '', ...(extra.accueil_banniere || {}) };
  const setBa = (patch: any) => setExtra('accueil_banniere', { ...ba, ...patch });
  const ap = { actif: false, titre: '', texte: '', image_url: '', ...(extra.accueil_apropos || {}) };
  const setAp = (patch: any) => setExtra('accueil_apropos', { ...ap, ...patch });
  const [envoiAp, setEnvoiAp] = useState(false);
  const [erreurAp, setErreurAp] = useState('');
  const choisirImageAp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEnvoiAp(true); setErreurAp('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/studio-categories/${gestionnaireId}/upload?dossier=apropos`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Échec de l'envoi");
      setAp({ image_url: data.image_url });
    } catch (err: any) { setErreurAp(err?.message || "Erreur lors de l'envoi"); }
    setEnvoiAp(false);
  };
  const hi = { actif: false, sur_titre: '', titre: '', texte: '', image_gauche: '', image_droite: '', ...(extra.accueil_histoire || {}) };
  const setHi = (patch: any) => setExtra('accueil_histoire', { ...hi, ...patch });
  const [envoiHi, setEnvoiHi] = useState('');
  const [erreurHi, setErreurHi] = useState('');
  const choisirImageHi = (cle: 'image_gauche' | 'image_droite') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEnvoiHi(cle); setErreurHi('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/studio-categories/${gestionnaireId}/upload?dossier=histoire`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Échec de l'envoi");
      setHi({ [cle]: data.image_url });
    } catch (err: any) { setErreurHi(err?.message || "Erreur lors de l'envoi"); }
    setEnvoiHi('');
  };
  const [envoiBa, setEnvoiBa] = useState(false);
  const [erreurBa, setErreurBa] = useState('');
  const choisirBanniere = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEnvoiBa(true); setErreurBa('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/studio-categories/${gestionnaireId}/upload?dossier=banniere`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Échec de l'envoi");
      setBa({ url: data.image_url });
    } catch (err: any) { setErreurBa(err?.message || "Erreur lors de l'envoi"); }
    setEnvoiBa(false);
  };
  const setAv = (patch: any) => setExtra('accueil_avantages', { ...av, ...patch });
  const majCarte = (i: number, patch: Partial<CarteAvantage>) => setAv({ cartes: cartes.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const ajouterCarte = () => { if (cartes.length < MAX_CARTES) setAv({ cartes: [...cartes, { icone: '⭐', titre: '', texte: '' }] }); };
  const supprimerCarte = (i: number) => setAv({ cartes: cartes.filter((_, j) => j !== i) });
  const deplacerCarte = (i: number, d: number) => {
    const k = i + d;
    if (k < 0 || k >= cartes.length) return;
    const copie = [...cartes];
    [copie[i], copie[k]] = [copie[k], copie[i]];
    setAv({ cartes: copie });
  };
  const setReseau = (cle: string, v: string) => setExtra('reseaux_sociaux', { ...reseaux, [cle]: v });

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
          <SectionCard titre="Photo de bannière (sous le menu)" icone="🖼️" actif={ba.actif} onToggle={(v: boolean) => setBa({ actif: v })}>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 14 }}>
              Une grande photo affichée en haut de l'accueil, juste sous le menu, avec un dégradé qui la fond dans le fond du site (comme sur les pages de boutique). Désactivée, l'accueil reste comme avant.
            </p>
            {ba.url && (
              <div style={{ position: 'relative', height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundImage: `url(${ba.url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.1), ${cfg.couleur_fond || '#0a0a0a'})` }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ padding: '10px 18px', background: DORE, color: '#000', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: envoiBa ? 'wait' : 'pointer', opacity: envoiBa ? 0.6 : 1 }}>
                {envoiBa ? 'Envoi…' : ba.url ? '📤 Remplacer la photo' : '📤 Choisir une photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={envoiBa} onChange={choisirBanniere} style={{ display: 'none' }} />
              </label>
              {ba.url && <button type="button" onClick={() => setBa({ url: '' })} style={{ padding: '10px 14px', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>🗑 Retirer</button>}
            </div>
            {erreurBa && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erreurBa}</p>}
            <p style={{ fontSize: 11, color: '#888', margin: '10px 0 0' }}>JPG, PNG, WEBP ou GIF · 5 Mo max · format large conseillé (ex. 1920 × 600 px). N'oubliez pas de cliquer sur « Sauvegarder ».</p>
            {ba.actif && !ba.url && <p style={{ color: '#b45309', fontSize: 12, margin: '8px 0 0' }}>⚠️ Aucune photo choisie : la bannière ne s'affichera pas.</p>}
          </SectionCard>

          <SectionCard titre="Bannière principale (Hero)" icone="🦸" actif={cfg.accueil_hero_actif} onToggle={(v: boolean) => set('accueil_hero_actif', v)}>
            <Champ label="Badge du hero" value={cfg.accueil_hero_badge} onChange={(v: string) => set('accueil_hero_badge', v)} placeholder="🇨🇦 Marketplace canadienne" note="Petite étiquette au-dessus du titre principal" />
          </SectionCard>

          <SectionCard titre="Section catégories" icone="📂" actif={cfg.accueil_categories_actif} onToggle={(v: boolean) => set('accueil_categories_actif', v)}>
            <Champ label="Titre de la section" value={cfg.accueil_categories_titre} onChange={(v: string) => set('accueil_categories_titre', v)} placeholder="Explorer par catégorie" />
          </SectionCard>

          <SectionCard titre="Section cartes (avantages)" icone="🎴" actif={av.actif} onToggle={(v: boolean) => setAv({ actif: v })} badge={`${cartes.length} / ${MAX_CARTES} cartes`}>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
              Affichée sur l'accueil, juste au-dessus des nouveautés. Idéale pour présenter vos points forts (ex. « Paiements sécurisés », « Livraison rapide »).
            </p>
            <Champ label="Titre de la section" value={av.titre} onChange={(v: string) => setAv({ titre: v })} placeholder="Pourquoi acheter chez nous ?" />
            <Champ label="Sous-titre (optionnel)" value={av.sous_titre} onChange={(v: string) => setAv({ sous_titre: v })} placeholder="Une courte phrase sous le titre" />

            {cartes.length === 0 && (
              <p style={{ fontSize: 13, color: '#999', margin: '0 0 12px' }}>Aucune carte pour l'instant. Ajoutez-en jusqu'à {MAX_CARTES}.</p>
            )}

            {cartes.map((c, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, marginBottom: 12, background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13, color: TXT, flex: 1 }}>Carte {i + 1}</strong>
                  <button type="button" onClick={() => deplacerCarte(i, -1)} disabled={i === 0} title="Monter"
                    style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>▲</button>
                  <button type="button" onClick={() => deplacerCarte(i, 1)} disabled={i === cartes.length - 1} title="Descendre"
                    style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: i === cartes.length - 1 ? 'not-allowed' : 'pointer', opacity: i === cartes.length - 1 ? 0.4 : 1 }}>▼</button>
                  <button type="button" onClick={() => supprimerCarte(i)} title="Supprimer cette carte"
                    style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff', color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
                </div>

                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Icône</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  <input value={c.icone} maxLength={8} onChange={e => majCarte(i, { icone: e.target.value })} placeholder="🙂"
                    style={{ width: 64, padding: '8px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 20, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                  {ICONES_SUGGEREES.map(ic => (
                    <button key={ic} type="button" onClick={() => majCarte(i, { icone: ic })}
                      style={{ width: 34, height: 34, border: `1px solid ${c.icone === ic ? DORE : '#e5e7eb'}`, background: c.icone === ic ? '#fffbeb' : '#fff', borderRadius: 8, fontSize: 17, cursor: 'pointer', padding: 0 }}>{ic}</button>
                  ))}
                </div>

                <Champ label="Titre de la carte" value={c.titre} onChange={(v: string) => majCarte(i, { titre: v })} placeholder="Paiements sécurisés" />
                <Champ label="Texte" value={c.texte} onChange={(v: string) => majCarte(i, { texte: v })} multiline placeholder="Une ou deux phrases pour expliquer l'avantage." />
              </div>
            ))}

            <button type="button" onClick={ajouterCarte} disabled={cartes.length >= MAX_CARTES}
              style={{ padding: '10px 18px', border: `2px dashed ${cartes.length >= MAX_CARTES ? '#e5e7eb' : DORE}`, background: '#fffbeb', color: '#92400e', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: cartes.length >= MAX_CARTES ? 'not-allowed' : 'pointer', opacity: cartes.length >= MAX_CARTES ? 0.5 : 1, fontFamily: 'inherit' }}>
              ＋ Ajouter une carte
            </button>
          </SectionCard>

          <SectionCard titre="Section nouveautés" icone="✨" actif={cfg.accueil_nouveautes_actif} onToggle={(v: boolean) => set('accueil_nouveautes_actif', v)} badge="8 produits affichés">
            <Champ label="Titre de la section" value={cfg.accueil_nouveautes_titre} onChange={(v: string) => set('accueil_nouveautes_titre', v)} placeholder="Nouveautés" />
          </SectionCard>

          <SectionCard titre="Encadré texte (sous les nouveautés)" icone="📝" actif={ap.actif} onToggle={(v: boolean) => setAp({ actif: v })}>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 14 }}>
              Un bel encadré aux couleurs de votre thème, affiché sous les nouveautés. Écrivez ce que vous voulez : description du site, mot de bienvenue, histoire, etc. Photo facultative en haut à gauche du texte.
            </p>
            <Champ label="Titre (optionnel)" value={ap.titre} onChange={(v: string) => setAp({ titre: v })} placeholder="À propos de nous" />
            <Champ label="Texte" value={ap.texte} onChange={(v: string) => setAp({ texte: v })} multiline placeholder="Présentez votre site..." note={`${(ap.texte || '').length} / 4000 caractères · les sauts de ligne sont conservés`} />
            {ap.image_url && (
              <div style={{ width: 160, height: 120, borderRadius: 10, marginBottom: 10, backgroundImage: `url(${ap.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e5e7eb' }} />
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ padding: '10px 18px', background: DORE, color: '#000', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: envoiAp ? 'wait' : 'pointer', opacity: envoiAp ? 0.6 : 1 }}>
                {envoiAp ? 'Envoi…' : ap.image_url ? '📤 Remplacer la photo' : '📤 Ajouter une photo (facultatif)'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={envoiAp} onChange={choisirImageAp} style={{ display: 'none' }} />
              </label>
              {ap.image_url && <button type="button" onClick={() => setAp({ image_url: '' })} style={{ padding: '10px 14px', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>🗑 Retirer</button>}
            </div>
            {erreurAp && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erreurAp}</p>}
            <p style={{ fontSize: 11, color: '#888', margin: '10px 0 0' }}>JPG, PNG, WEBP ou GIF · 5 Mo max. N'oubliez pas de cliquer sur « Sauvegarder ».</p>
            {ap.actif && !ap.texte.trim() && <p style={{ color: '#b45309', fontSize: 12, margin: '8px 0 0' }}>⚠️ Aucun texte : l'encadré ne s'affichera pas.</p>}
          </SectionCard>

          <SectionCard titre="Texte entre deux photos (au-dessus de l'appel à l'action)" icone="🖼️" actif={hi.actif} onToggle={(v: boolean) => setHi({ actif: v })}>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 14 }}>
              Une section « Notre histoire » : un texte centré, avec une photo de chaque côté. Le petit mot en écriture manuscrite et le titre en gros caractères sont réglés pour vous. Les deux photos sont facultatives.
            </p>
            <Champ label="Petit mot au-dessus du titre (optionnel)" value={hi.sur_titre} onChange={(v: string) => setHi({ sur_titre: v })} placeholder="Notre histoire" />
            <Champ label="Titre" value={hi.titre} onChange={(v: string) => setHi({ titre: v })} placeholder="Notre histoire" />
            <Champ label="Texte" value={hi.texte} onChange={(v: string) => setHi({ texte: v })} multiline placeholder="Racontez votre histoire..." note={`${(hi.texte || '').length} / 4000 caractères · une ligne vide sépare deux paragraphes`} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photo de gauche</p>
                {hi.image_gauche && <div style={{ width: 120, height: 160, borderRadius: 10, marginBottom: 8, backgroundImage: `url(${hi.image_gauche})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e5e7eb' }} />}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <label style={{ padding: '9px 14px', background: DORE, color: '#000', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: envoiHi ? 'wait' : 'pointer', opacity: envoiHi === 'image_gauche' ? 0.6 : 1 }}>
                    {envoiHi === 'image_gauche' ? 'Envoi…' : hi.image_gauche ? '📤 Remplacer' : '📤 Ajouter'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!!envoiHi} onChange={choisirImageHi('image_gauche')} style={{ display: 'none' }} />
                  </label>
                  {hi.image_gauche && <button type="button" onClick={() => setHi({ image_gauche: '' })} style={{ padding: '9px 12px', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>🗑</button>}
                </div>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photo de droite</p>
                {hi.image_droite && <div style={{ width: 120, height: 160, borderRadius: 10, marginBottom: 8, backgroundImage: `url(${hi.image_droite})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e5e7eb' }} />}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <label style={{ padding: '9px 14px', background: DORE, color: '#000', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: envoiHi ? 'wait' : 'pointer', opacity: envoiHi === 'image_droite' ? 0.6 : 1 }}>
                    {envoiHi === 'image_droite' ? 'Envoi…' : hi.image_droite ? '📤 Remplacer' : '📤 Ajouter'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!!envoiHi} onChange={choisirImageHi('image_droite')} style={{ display: 'none' }} />
                  </label>
                  {hi.image_droite && <button type="button" onClick={() => setHi({ image_droite: '' })} style={{ padding: '9px 12px', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>🗑</button>}
                </div>
              </div>
            </div>
            {erreurHi && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erreurHi}</p>}
            <p style={{ fontSize: 11, color: '#888', margin: '10px 0 0' }}>JPG, PNG, WEBP ou GIF · 5 Mo max · format vertical conseillé (ex. 800 × 1000 px). N'oubliez pas de cliquer sur « Sauvegarder ».</p>
            {hi.actif && !hi.texte.trim() && <p style={{ color: '#b45309', fontSize: 12, margin: '8px 0 0' }}>⚠️ Aucun texte : la section ne s'affichera pas.</p>}
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

          <SectionCard titre="Réseaux sociaux" icone="🌐" actif={true}>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
              Ces liens seront affichés dans le pied de page de votre site. Entrez l'adresse complète (https://…). Laissez vide pour ne pas afficher un réseau.
            </p>
            {RESEAUX.map(r => {
              const val = reseaux[r.cle] || '';
              const invalide = val.trim() !== '' && !lienValide(val);
              return (
                <div key={r.cle} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TXT }}>{r.icone} {r.nom}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{r.note}</div>
                  </div>
                  <div style={{ flex: '2 1 260px' }}>
                    <input type="url" value={val} onChange={e => setReseau(r.cle, e.target.value)} placeholder={r.ph}
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${invalide ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 10, fontSize: 13, color: TXT, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    {invalide && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>L'adresse doit commencer par https://</div>}
                  </div>
                  {lienValide(val) && (
                    <a href={val.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>↗ Voir</a>
                  )}
                </div>
              );
            })}
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