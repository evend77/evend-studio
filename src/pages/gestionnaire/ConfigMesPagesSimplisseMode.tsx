// src/pages/gestionnaire/ConfigMesPagesSimplisseMode.tsx
// e-Vend Studio — Configuration du template Boutique Simplisse Mode
// Style : menu gauche + contenu droite (comme ConfigMesPagesPremium)

import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';
const CP = '#722f37';

interface Props { gestionnaireId: number; }

type PageOnglet = 'accueil' | 'sections' | 'catalogue' | 'fiche-produit' | 'lookbook' | 'instagram' | 'faq' | 'blog' | 'contact' | 'footer' | 'options';

const PAGES: { id: PageOnglet; label: string; icone: string }[] = [
  { id: 'accueil',      label: 'Accueil & Hero',     icone: '🏠' },
  { id: 'sections',     label: 'Sections & Ordre',   icone: '🔀' },
  { id: 'catalogue',    label: 'Catalogue',          icone: '👗' },
  { id: 'fiche-produit',label: 'Fiche produit',      icone: '📦' },
  { id: 'lookbook',     label: 'Lookbook',           icone: '📸' },
  { id: 'instagram',    label: 'Instagram',          icone: '📱' },
  { id: 'faq',          label: 'FAQ',                icone: '❓' },
  { id: 'blog',         label: 'Blog',               icone: '📝' },
  { id: 'contact',      label: 'Contact',            icone: '📬' },
  { id: 'footer',       label: 'Footer',             icone: '📋' },
  { id: 'options',      label: 'Options Mode',       icone: '✨' },
];

const SECTIONS_DEF = [
  { id:'hero',         label:'Hero',              icone:'🎬', actif:true,  ordre:1 },
  { id:'banniere',     label:'Bannière promo',    icone:'📢', actif:true,  ordre:2 },
  { id:'vedette',      label:'Produits vedette',  icone:'👗', actif:true,  ordre:3 },
  { id:'collections',  label:'Collections',       icone:'🗂',  actif:true,  ordre:4 },
  { id:'lookbook',     label:'Lookbook',          icone:'📸', actif:true,  ordre:5 },
  { id:'instagram',    label:'Vu sur Instagram',  icone:'📱', actif:false, ordre:6 },
  { id:'temoignages',  label:'Témoignages',       icone:'⭐', actif:true,  ordre:7 },
  { id:'blog',         label:'Articles du blog',  icone:'📰', actif:true,  ordre:8 },
  { id:'infolettre',   label:'Infolettre',        icone:'📧', actif:true,  ordre:9 },
];

const DEF: any = {
  nomBoutique: 'Ma Boutique Mode',
  slogan: 'Style & Élégance',
  couleurAccent: '#722f37',
  couleurFond: '#faf8f5',
  couleurTexte: '#0f0f0f',
  logoUrl: '',
  afficherBanniere: true,
  banniereTexte: '✦ LIVRAISON GRATUITE dès 80$ ✦ RETOURS GRATUITS 30 JOURS ✦ NOUVEAUTÉS CHAQUE SEMAINE ✦',
  banniereColor: '#722f37',
  sections: SECTIONS_DEF,
  afficherPopupPromo: false,
  popupPromoTexte: 'Obtenez 10% de réduction sur votre première commande !',
  popupPromoCode: 'MODE10',
  afficherBarreLivraison: true,
  seuilLivraisonGratuite: 80,
  afficherNotifVente: true,
  afficherNbVues: true,
  hero: { titre: 'La Mode\nComme un Art', sousTitre: 'Collections exclusives · Pièces uniques · Style intemporel', boutonLabel: 'Découvrir la collection', photo: '' },
  lookbook: { titre: 'Lookbook', sousTitre: 'Inspirations & Styles de la saison', photos: ['','','','','',''], disposition: 'masonry' },
  instagram: { handle: '@maboutique', titre: 'Suivez-nous sur Instagram', photos: ['','','','','',''] },
  catalogue: { colonnes: 3, afficherFiltresTaille: true, afficherFiltresCouleur: true, afficherGuidesTailles: true, afficherStock: true, afficherNote: true, afficherNouveauBadge: true, tailles: ['XS','S','M','L','XL','XXL'] },
  ficheProduit: { afficherZoom: true, afficherGuidesTailles: true, afficherCompleterLook: true, afficherAvis: true, afficherPartage: true, boutonLabel: 'Ajouter au panier', boutonCouleur: '' },
  faq: { titre: 'Questions fréquentes', items: [{ question:'Quels sont vos délais de livraison ?',reponse:'Les commandes sont expédiées sous 24–48h. Livraison standard 2-5 jours.' },{ question:'Comment utiliser le guide des tailles ?',reponse:'Disponible sur chaque fiche produit. Mesurez buste, taille et hanches.' },{ question:'Les retours sont-ils gratuits ?',reponse:'Oui ! Retours gratuits sous 30 jours pour articles non portés avec étiquettes.' }] },
  blog: { titre: 'Notre univers mode', colonnes: 3, afficherAuteur: true, afficherDate: true },
  contact: { titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !', adresse: '', telephone: '', courriel: '', afficherCarte: false, urlCarte: '' },
  footer: { nomBoutique: 'Ma Boutique Mode', slogan: 'Style & Élégance', couleurFond: '#0f0f0f', couleurTexte: '#ffffff', afficherPropulse: true, reseaux: { facebook:'',instagram:'',tiktok:'',twitter:'',youtube:'',pinterest:'' }, colonnes: { titre1:'Boutique',liens1:'Accueil\nCatalogue\nLookbook\nBlog',titre2:'Service',liens2:'Contact\nRetours\nLivraison\nGuide des tailles',titre3:'',liens3:'' } },
};

// ─── UI Components ────────────────────────────────────────────────────────────
const S = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, color: CP, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>{titre}</h3>
    {children}
  </div>
);

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '10px 12px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
);

const Couleur = ({ label, value, onChange }: any) => (
  <F label={label}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input type="color" value={value || '#722f37'} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
      <Inp value={value} onChange={onChange} placeholder="#722f37" />
    </div>
  </F>
);

const Toggle = ({ label, checked, onChange, desc }: any) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{desc}</div>}
    </div>
    <button onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: checked ? CP : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.25s', marginTop: 2 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
    </button>
  </div>
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: '100%', padding: '10px 12px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />
);

export default function ConfigMesPagesSimplisseMode({ gestionnaireId }: Props) {
  const [onglet, setOnglet]   = useState<PageOnglet>('accueil');
  const [config, setConfig]   = useState<any>(DEF);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [statut, setStatut]   = useState<'idle'|'ok'|'err'>('idle');

  const set     = useCallback((k: string, v: any) => setConfig((c: any) => ({ ...c, [k]: v })), []);
  const setFoot = useCallback((patch: any) => setConfig((c: any) => ({ ...c, footer: { ...c.footer, ...patch } })), []);
  const setCat  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, catalogue: { ...c.catalogue, ...patch } })), []);
  const setFP   = useCallback((patch: any) => setConfig((c: any) => ({ ...c, ficheProduit: { ...c.ficheProduit, ...patch } })), []);
  const setHero = useCallback((patch: any) => setConfig((c: any) => ({ ...c, hero: { ...c.hero, ...patch } })), []);
  const setFaq  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, faq: { ...c.faq, ...patch } })), []);
  const setCont = useCallback((patch: any) => setConfig((c: any) => ({ ...c, contact: { ...c.contact, ...patch } })), []);
  const setLook = useCallback((patch: any) => setConfig((c: any) => ({ ...c, lookbook: { ...c.lookbook, ...patch } })), []);
  const setInsta = useCallback((patch: any) => setConfig((c: any) => ({ ...c, instagram: { ...c.instagram, ...patch } })), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config?.mode) setConfig({ ...DEF, ...data.config.mode, sections: data.config.mode.sections || SECTIONS_DEF }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gestionnaireId]);

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ mode: config }),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  // Déplacer une section vers le haut ou le bas
  const deplacerSection = (id: string, direction: 'up' | 'down') => {
    const sections = [...(config.sections || SECTIONS_DEF)].sort((a: any, b: any) => a.ordre - b.ordre);
    const idx = sections.findIndex((s: any) => s.id === id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const newSections = sections.map((s: any, i: number) => {
      if (i === idx) return { ...s, ordre: sections[newIdx].ordre };
      if (i === newIdx) return { ...s, ordre: sections[idx].ordre };
      return s;
    });
    set('sections', newSections);
  };

  const toggleSection = (id: string) => {
    const sections = (config.sections || SECTIONS_DEF).map((s: any) => s.id === id ? { ...s, actif: !s.actif } : s);
    set('sections', sections);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#888',fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32,marginBottom:12 }}>⏳</div><p>Chargement...</p></div>
    </div>
  );

  const renderConfig = () => {
    switch (onglet) {

      case 'accueil': return (
        <>
          <S titre="Identité de la boutique">
            <F label="Nom de la boutique"><Inp value={config.nomBoutique} onChange={(v: string) => set('nomBoutique', v)} placeholder="Ma Boutique Mode" /></F>
            <F label="Slogan"><Inp value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="Style & Élégance" /></F>
            <F label="URL du logo"><Inp value={config.logoUrl} onChange={(v: string) => set('logoUrl', v)} placeholder="https://..." /></F>
          </S>
          <S titre="Couleurs">
            <Couleur label="Couleur accent" value={config.couleurAccent} onChange={(v: string) => set('couleurAccent', v)} />
            <Couleur label="Couleur de fond" value={config.couleurFond} onChange={(v: string) => set('couleurFond', v)} />
          </S>
          <S titre="Bannière défilante">
            <Toggle label="Afficher la bannière" checked={config.afficherBanniere} onChange={(v: boolean) => set('afficherBanniere', v)} desc="Barre de texte défilant en haut de page" />
            {config.afficherBanniere && <>
              <F label="Texte défilant"><Inp value={config.banniereTexte} onChange={(v: string) => set('banniereTexte', v)} placeholder="✦ LIVRAISON GRATUITE dès 80$ ✦" /></F>
              <Couleur label="Couleur de fond" value={config.banniereColor} onChange={(v: string) => set('banniereColor', v)} />
            </>}
          </S>
          <S titre="Section Hero">
            <F label="Titre (une ligne par saut = nouvelle ligne)">
              <Textarea value={config.hero?.titre} onChange={(v: string) => setHero({ titre: v })} placeholder={'La Mode\nComme un Art'} rows={3} />
              <div style={{ fontSize:11,color:'#888',marginTop:4 }}>💡 Chaque ligne alternera la couleur accent</div>
            </F>
            <F label="Sous-titre"><Inp value={config.hero?.sousTitre} onChange={(v: string) => setHero({ sousTitre: v })} placeholder="Collections exclusives..." /></F>
            <F label="Texte du bouton"><Inp value={config.hero?.boutonLabel} onChange={(v: string) => setHero({ boutonLabel: v })} placeholder="Découvrir la collection" /></F>
            <F label="Photo hero (URL)"><Inp value={config.hero?.photo} onChange={(v: string) => setHero({ photo: v })} placeholder="https://..." /></F>
          </S>
          <S titre="Popup promo">
            <Toggle label="Activer le popup de bienvenue" checked={config.afficherPopupPromo} onChange={(v: boolean) => set('afficherPopupPromo', v)} desc="S'affiche 4 secondes après l'arrivée sur le site" />
            {config.afficherPopupPromo && <>
              <F label="Message"><Inp value={config.popupPromoTexte} onChange={(v: string) => set('popupPromoTexte', v)} placeholder="Obtenez 10% de réduction..." /></F>
              <F label="Code promo"><Inp value={config.popupPromoCode} onChange={(v: string) => set('popupPromoCode', v)} placeholder="MODE10" /></F>
            </>}
          </S>
        </>
      );

      case 'sections': return (
        <>
          <S titre="Sections de la page accueil">
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              Activez/désactivez les sections et réordonnez-les avec les flèches. L'ordre affiché ici correspond à l'ordre sur la page.
            </p>
            {[...(config.sections || SECTIONS_DEF)].sort((a: any, b: any) => a.ordre - b.ordre).map((section: any, idx: number, arr: any[]) => (
              <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: section.actif ? '#fafafa' : '#f5f5f5', border: `1px solid ${section.actif ? '#e5e7eb' : '#ebebeb'}`, borderRadius: 8, marginBottom: 8, opacity: section.actif ? 1 : 0.6 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{section.icone}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{section.label}</div>
                  <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ordre {section.ordre}</div>
                </div>
                {/* Flèches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => deplacerSection(section.id, 'up')} disabled={idx === 0}
                    style={{ width: 26, height: 22, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 11, color: idx === 0 ? '#ccc' : '#555' }}>▲</button>
                  <button onClick={() => deplacerSection(section.id, 'down')} disabled={idx === arr.length - 1}
                    style={{ width: 26, height: 22, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 4, cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer', fontSize: 11, color: idx === arr.length - 1 ? '#ccc' : '#555' }}>▼</button>
                </div>
                {/* Toggle actif */}
                <button onClick={() => toggleSection(section.id)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: section.actif ? CP : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
                  <div style={{ position: 'absolute', top: 3, left: section.actif ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
                </button>
              </div>
            ))}
          </S>
        </>
      );

      case 'catalogue': return (
        <>
          <S titre="Affichage">
            <F label="Colonnes par défaut">
              <div style={{ display: 'flex', gap: 8 }}>
                {[2,3,4].map(n => (
                  <button key={n} onClick={() => setCat({ colonnes: n })}
                    style={{ flex:1,padding:'9px',border:`2px solid ${config.catalogue?.colonnes===n?CP:'#e5e7eb'}`,borderRadius:6,background:config.catalogue?.colonnes===n?`${CP}12`:'#fff',color:config.catalogue?.colonnes===n?CP:'#888',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </F>
            <Toggle label="Filtre par taille" checked={config.catalogue?.afficherFiltresTaille} onChange={(v: boolean) => setCat({ afficherFiltresTaille: v })} />
            <Toggle label="Filtre par couleur (pastilles visuelles)" checked={config.catalogue?.afficherFiltresCouleur} onChange={(v: boolean) => setCat({ afficherFiltresCouleur: v })} />
            <Toggle label="Guide des tailles (tableau popup)" checked={config.catalogue?.afficherGuidesTailles} onChange={(v: boolean) => setCat({ afficherGuidesTailles: v })} />
            <Toggle label="Afficher le stock" checked={config.catalogue?.afficherStock} onChange={(v: boolean) => setCat({ afficherStock: v })} />
            <Toggle label="Afficher la note moyenne" checked={config.catalogue?.afficherNote} onChange={(v: boolean) => setCat({ afficherNote: v })} />
            <Toggle label="Badge NOUVEAU" checked={config.catalogue?.afficherNouveauBadge} onChange={(v: boolean) => setCat({ afficherNouveauBadge: v })} />
          </S>
          <S titre="Tailles disponibles">
            <p style={{ fontSize:11,color:'#888',marginBottom:10,lineHeight:1.5 }}>Tailles affichées dans les filtres du catalogue. Séparées par des virgules.</p>
            <Inp value={(config.catalogue?.tailles||[]).join(',')} onChange={(v: string) => setCat({ tailles: v.split(',').map((t: string) => t.trim()).filter(Boolean) })} placeholder="XS,S,M,L,XL,XXL" />
          </S>
        </>
      );

      case 'fiche-produit': return (
        <>
          <S titre="Galerie & affichage">
            <Toggle label="Zoom image au survol / clic" checked={config.ficheProduit?.afficherZoom} onChange={(v: boolean) => setFP({ afficherZoom: v })} desc="Zoom fluide qui suit la position de la souris" />
            <Toggle label="Guide des tailles sur fiche produit" checked={config.ficheProduit?.afficherGuidesTailles} onChange={(v: boolean) => setFP({ afficherGuidesTailles: v })} desc="Lien 'Guide des tailles' à côté du sélecteur de taille" />
            <Toggle label="Section 'À porter avec'" checked={config.ficheProduit?.afficherCompleterLook} onChange={(v: boolean) => setFP({ afficherCompleterLook: v })} desc="Produits similaires de la même catégorie" />
            <Toggle label="Avis clients (onglet)" checked={config.ficheProduit?.afficherAvis} onChange={(v: boolean) => setFP({ afficherAvis: v })} />
            <Toggle label="Boutons de partage" checked={config.ficheProduit?.afficherPartage} onChange={(v: boolean) => setFP({ afficherPartage: v })} />
          </S>
          <S titre="Bouton d'achat">
            <F label="Texte du bouton">
              <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:8 }}>
                {['Ajouter au panier','Commander maintenant','Acheter','Réserver'].map(lbl => (
                  <button key={lbl} onClick={() => setFP({ boutonLabel: lbl })}
                    style={{ padding:'8px 12px',textAlign:'left',border:`2px solid ${config.ficheProduit?.boutonLabel===lbl?CP:'#e5e7eb'}`,borderRadius:6,background:config.ficheProduit?.boutonLabel===lbl?`${CP}12`:'#fff',color:config.ficheProduit?.boutonLabel===lbl?CP:'#666',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <Inp value={config.ficheProduit?.boutonLabel} onChange={(v: string) => setFP({ boutonLabel: v })} placeholder="Texte personnalisé..." />
            </F>
            <Couleur label="Couleur du bouton (vide = couleur accent)" value={config.ficheProduit?.boutonCouleur} onChange={(v: string) => setFP({ boutonCouleur: v })} />
          </S>
        </>
      );

      case 'lookbook': return (
        <>
          <S titre="Section Lookbook">
            <F label="Titre"><Inp value={config.lookbook?.titre} onChange={(v: string) => setLook({ titre: v })} placeholder="Lookbook" /></F>
            <F label="Sous-titre"><Inp value={config.lookbook?.sousTitre} onChange={(v: string) => setLook({ sousTitre: v })} placeholder="Inspirations & Styles de la saison" /></F>
            <F label="Disposition">
              {(['masonry','grille','plein'] as const).map(d => (
                <button key={d} onClick={() => setLook({ disposition: d })}
                  style={{ marginRight:8,padding:'7px 16px',border:`2px solid ${config.lookbook?.disposition===d?CP:'#e5e7eb'}`,borderRadius:6,background:config.lookbook?.disposition===d?`${CP}12`:'#fff',color:config.lookbook?.disposition===d?CP:'#888',fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:8 }}>
                  {d==='masonry'?'📐 Masonry':d==='grille'?'⊞ Grille':'🖼 Plein écran'}
                </button>
              ))}
            </F>
          </S>
          <S titre="Photos du lookbook (6 photos)">
            {[0,1,2,3,4,5].map(i => (
              <F key={i} label={`Photo ${i+1}`}>
                <Inp value={(config.lookbook?.photos||[])[i]||''} onChange={(v: string) => {
                  const arr = [...(config.lookbook?.photos||['','','','','',''])];
                  arr[i] = v;
                  setLook({ photos: arr });
                }} placeholder="https://..." />
              </F>
            ))}
          </S>
        </>
      );

      case 'instagram': return (
        <>
          <S titre="Section Instagram">
            <Toggle label="Activer la section Instagram" checked={(config.sections||SECTIONS_DEF).find((s: any)=>s.id==='instagram')?.actif||false} onChange={(v: boolean) => toggleSection('instagram')} desc="Grille de 6 photos avec lien vers votre compte" />
            <F label="Titre de la section"><Inp value={config.instagram?.titre} onChange={(v: string) => setInsta({ titre: v })} placeholder="Suivez-nous sur Instagram" /></F>
            <F label="Votre handle (@...)"><Inp value={config.instagram?.handle} onChange={(v: string) => setInsta({ handle: v })} placeholder="@maboutique" /></F>
          </S>
          <S titre="Photos Instagram (6 photos)">
            {[0,1,2,3,4,5].map(i => (
              <F key={i} label={`Photo ${i+1}`}>
                <Inp value={(config.instagram?.photos||[])[i]||''} onChange={(v: string) => {
                  const arr = [...(config.instagram?.photos||['','','','','',''])];
                  arr[i] = v;
                  setInsta({ photos: arr });
                }} placeholder="https://..." />
              </F>
            ))}
          </S>
        </>
      );

      case 'faq': return (
        <>
          <S titre="Page FAQ">
            <F label="Titre"><Inp value={config.faq?.titre} onChange={(v: string) => setFaq({ titre: v })} placeholder="Questions fréquentes" /></F>
          </S>
          <S titre="Questions & réponses">
            {(config.faq?.items||[]).map((item: any, i: number) => (
              <div key={i} style={{ border:'1px solid #e5e7eb',borderRadius:8,padding:12,marginBottom:10 }}>
                <div style={{ marginBottom:8 }}><Inp value={item.question} onChange={(v: string) => { const arr=[...config.faq.items]; arr[i]={...arr[i],question:v}; setFaq({items:arr}); }} placeholder="Question..."/></div>
                <div style={{ display:'flex',gap:8 }}>
                  <Textarea value={item.reponse} onChange={(v: string) => { const arr=[...config.faq.items]; arr[i]={...arr[i],reponse:v}; setFaq({items:arr}); }} placeholder="Réponse..." rows={2}/>
                  <button onClick={()=>setFaq({items:config.faq.items.filter((_: any,j: number)=>j!==i)})} style={{ background:'#fef2f2',border:'none',borderRadius:6,padding:'0 10px',color:'#ef4444',cursor:'pointer',flexShrink:0 }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={()=>setFaq({items:[...(config.faq?.items||[]),{question:'',reponse:''}]})}
              style={{ width:'100%',padding:'9px',border:`2px dashed ${CP}40`,borderRadius:6,background:`${CP}05`,color:CP,fontSize:12,fontWeight:600,cursor:'pointer' }}>
              + Ajouter une question
            </button>
          </S>
        </>
      );

      case 'blog': return (
        <>
          <S titre="Page blog">
            <F label="Titre"><Inp value={config.blog?.titre} onChange={(v: string) => set('blog', { ...config.blog, titre: v })} placeholder="Notre univers mode" /></F>
            <F label="Colonnes">
              <div style={{ display:'flex',gap:8 }}>
                {[1,2,3].map(n=>(
                  <button key={n} onClick={()=>set('blog',{...config.blog,colonnes:n})}
                    style={{ flex:1,padding:'9px',border:`2px solid ${config.blog?.colonnes===n?CP:'#e5e7eb'}`,borderRadius:6,background:config.blog?.colonnes===n?`${CP}12`:'#fff',color:config.blog?.colonnes===n?CP:'#888',fontWeight:700,fontSize:14,cursor:'pointer' }}>{n}</button>
                ))}
              </div>
            </F>
            <Toggle label="Afficher l'auteur" checked={config.blog?.afficherAuteur} onChange={(v: boolean) => set('blog', { ...config.blog, afficherAuteur: v })} />
            <Toggle label="Afficher la date" checked={config.blog?.afficherDate} onChange={(v: boolean) => set('blog', { ...config.blog, afficherDate: v })} />
          </S>
        </>
      );

      case 'contact': return (
        <>
          <S titre="Page contact">
            <F label="Titre"><Inp value={config.contact?.titre} onChange={(v: string) => setCont({ titre: v })} placeholder="Nous contacter" /></F>
            <F label="Sous-titre"><Inp value={config.contact?.sousTitre} onChange={(v: string) => setCont({ sousTitre: v })} placeholder="Une question ? Écrivez-nous !" /></F>
            <F label="Adresse"><Inp value={config.contact?.adresse} onChange={(v: string) => setCont({ adresse: v })} placeholder="123 rue de la Mode, Montréal QC" /></F>
            <F label="Téléphone"><Inp value={config.contact?.telephone} onChange={(v: string) => setCont({ telephone: v })} placeholder="514 000-0000" /></F>
            <F label="Courriel"><Inp value={config.contact?.courriel} onChange={(v: string) => setCont({ courriel: v })} placeholder="info@maboutique.ca" /></F>
            <Toggle label="Afficher Google Maps" checked={config.contact?.afficherCarte} onChange={(v: boolean) => setCont({ afficherCarte: v })} />
            {config.contact?.afficherCarte && <F label="URL Google Maps"><Inp value={config.contact?.urlCarte} onChange={(v: string) => setCont({ urlCarte: v })} placeholder="https://maps.google.com/..." /></F>}
          </S>
        </>
      );

      case 'footer': return (
        <>
          <S titre="Identité">
            <F label="Nom"><Inp value={config.footer?.nomBoutique} onChange={(v: string) => setFoot({ nomBoutique: v })} placeholder="Ma Boutique Mode" /></F>
            <F label="Slogan"><Inp value={config.footer?.slogan} onChange={(v: string) => setFoot({ slogan: v })} placeholder="Style & Élégance" /></F>
            <Couleur label="Couleur de fond" value={config.footer?.couleurFond} onChange={(v: string) => setFoot({ couleurFond: v })} />
          </S>
          <S titre="Réseaux sociaux">
            {(['facebook','instagram','tiktok','twitter','youtube','pinterest'] as const).map(r => (
              <F key={r} label={r.charAt(0).toUpperCase()+r.slice(1)}><Inp value={config.footer?.reseaux?.[r]} onChange={(v: string) => setFoot({ reseaux: { ...config.footer.reseaux, [r]: v } })} placeholder="https://..." /></F>
            ))}
          </S>
          <S titre="Colonnes de liens">
            {[1,2].map(n => (
              <div key={n} style={{ marginBottom:16 }}>
                <F label={`Titre colonne ${n}`}><Inp value={config.footer?.colonnes?.[`titre${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`titre${n}`]: v } })} placeholder={`Titre ${n}`}/></F>
                <F label={`Liens (un par ligne)`}><Textarea value={config.footer?.colonnes?.[`liens${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`liens${n}`]: v } })} rows={4} placeholder="Accueil&#10;Catalogue&#10;Blog"/></F>
              </div>
            ))}
          </S>
          <S titre="Branding e-Vend Studio">
            <div style={{ background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10 }}>
              <div><p style={{ fontSize:12,fontWeight:700,color:'#1a1a1a',margin:'0 0 3px' }}>Cacher "Propulsé par e-Vend Studio"</p><p style={{ fontSize:11,color:'#888',margin:0 }}>Gérez depuis <strong>Branding & options</strong> (+2$/mois).</p></div>
              <span style={{ fontSize:18 }}>⚙️</span>
            </div>
          </S>
        </>
      );

      case 'options': return (
        <>
          <S titre="Options exclusives Mode">
            <Toggle label="Notification dernière vente" checked={config.afficherNotifVente} onChange={(v: boolean) => set('afficherNotifVente', v)} desc="Popup en bas à gauche — ex: Sophie de Montréal a acheté..." />
            <Toggle label="Compteur de vues" checked={config.afficherNbVues} onChange={(v: boolean) => set('afficherNbVues', v)} desc="Nombre de personnes qui regardent le produit en ce moment" />
            <Toggle label="Barre livraison gratuite" checked={config.afficherBarreLivraison} onChange={(v: boolean) => set('afficherBarreLivraison', v)} desc="Progression vers la livraison gratuite dans le panier" />
            {config.afficherBarreLivraison && <F label="Seuil livraison gratuite ($)"><Inp type="number" value={config.seuilLivraisonGratuite} onChange={(v: string) => set('seuilLivraisonGratuite', parseFloat(v)||80)} placeholder="80" /></F>}
            <Toggle label="Zoom image sur fiche produit" checked={config.ficheProduit?.afficherZoom} onChange={(v: boolean) => setFP({ afficherZoom: v })} desc="Zoom fluide qui suit la souris — effet luxe" />
            <Toggle label="Wishlist (bouton cœur)" checked={true} onChange={() => {}} desc="Toujours activé pour le template Mode" />
            <Toggle label="Guide des tailles popup" checked={config.catalogue?.afficherGuidesTailles} onChange={(v: boolean) => setCat({ afficherGuidesTailles: v })} desc="Tableau de mesures buste/taille/hanches" />
            <Toggle label="Filtres couleur visuels" checked={config.catalogue?.afficherFiltresCouleur} onChange={(v: boolean) => setCat({ afficherFiltresCouleur: v })} desc="Pastilles de couleur dans les filtres du catalogue" />
          </S>
        </>
      );

      default: return null;
    }
  };

  return (
    <div style={{ maxWidth:960,margin:'0 auto',padding:'32px 24px',fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${CP},#a0435a)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>👗</div>
          <div>
            <h1 style={{ fontSize:20,fontWeight:800,color:'#1a1a1a',margin:0 }}>Config — Simplisse Mode</h1>
            <p style={{ fontSize:12,color:'#888',margin:0 }}>Personnalisez votre boutique mode</p>
          </div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>window.open(`http://localhost:3000/site-preview?vendeurId=${gestionnaireId}`,'_blank','noopener,noreferrer')}
            style={{ padding:'10px 18px',background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:600,color:'#555' }}>
            👁 Aperçu
          </button>
          <button onClick={sauvegarder} disabled={saving}
            style={{ padding:'10px 24px',background:`linear-gradient(135deg,${CP},#a0435a)`,border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:800,cursor:saving?'wait':'pointer',fontFamily:'inherit' }}>
            {saving?'⏳ Sauvegarde...':'✅ Sauvegarder'}
          </button>
        </div>
      </div>

      {statut==='ok'&&<div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#16a34a',fontWeight:500 }}>✅ Configuration sauvegardée !</div>}
      {statut==='err'&&<div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#ef4444',fontWeight:500 }}>❌ Erreur lors de la sauvegarde.</div>}

      <div style={{ display:'grid',gridTemplateColumns:'200px 1fr',gap:24,alignItems:'flex-start' }}>
        {/* Menu gauche */}
        <div style={{ background:'#fafafa',border:'1px solid #e5e7eb',borderRadius:12,padding:8 }}>
          {PAGES.map(p=>(
            <button key={p.id} onClick={()=>setOnglet(p.id)}
              style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',background:onglet===p.id?`${CP}15`:'none',border:'none',borderRadius:8,color:onglet===p.id?CP:'#666',fontSize:13,fontWeight:onglet===p.id?700:400,cursor:'pointer',marginBottom:2,textAlign:'left',transition:'all 0.15s',borderLeft:onglet===p.id?`3px solid ${CP}`:'3px solid transparent' }}>
              <span style={{ fontSize:15 }}>{p.icone}</span>{p.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'24px 28px' }}>
          {renderConfig()}
        </div>
      </div>
    </div>
  );
}