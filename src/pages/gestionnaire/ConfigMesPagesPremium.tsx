// src/pages/gestionnaire/ConfigMesPagesPremium.tsx
// e-Vend Studio — Configuration du template Boutique Premium

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const CP = '#c9a96e';
const OR2 = '#e8c87a';

interface Props { gestionnaireId: number; }

type PageOnglet = 'accueil' | 'catalogue' | 'fiche-produit' | 'a-propos' | 'faq' | 'blog' | 'contact' | 'inscription' | 'footer' | 'options';

const PAGES: { id: PageOnglet; label: string; icone: string }[] = [
  { id: 'accueil',      label: 'Accueil',       icone: '🏠' },
  { id: 'catalogue',    label: 'Catalogue',      icone: '🛍' },
  { id: 'fiche-produit',label: 'Fiche produit',  icone: '📦' },
  { id: 'a-propos',     label: 'À propos',       icone: '💡' },
  { id: 'faq',          label: 'FAQ',            icone: '❓' },
  { id: 'blog',         label: 'Blog',           icone: '📝' },
  { id: 'contact',      label: 'Contact',        icone: '📬' },
  { id: 'inscription',  label: 'Compte / Inscription', icone: '👤' },
  { id: 'footer',       label: 'Footer',         icone: '📋' },
  { id: 'options',      label: 'Options Premium', icone: '💎' },
];

type TypeChampInsc = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
interface ChampInsc { id: string; type: TypeChampInsc; label: string; placeholder?: string; options?: string[]; requis?: boolean; }
const TYPE_CHAMP_LABELS: Record<TypeChampInsc, string> = { text: 'Texte court', email: 'Email', tel: 'Téléphone', select: 'Menu déroulant', textarea: 'Zone de texte', checkbox: 'Case à cocher' };
const MAX_CHAMPS_INSC = 10;

// Exemples de démonstration de la page À propos (mêmes que dans le template) : affichés sur le site tant que la liste est vide
const APROPOS_EX = {
  valeurs: [
    { ico: '💎', titre: 'Qualité sans compromis', desc: 'Chaque produit est sélectionné selon des critères rigoureux. Nous refusons la médiocrité — chaque article que vous recevez a été validé par notre équipe.' },
    { ico: '🤝', titre: 'Service humain', desc: "Derrière chaque commande, il y a une personne réelle. Notre équipe est disponible pour vous accompagner à chaque étape de votre expérience d'achat." },
    { ico: '🌱', titre: 'Responsabilité', desc: 'Nous choisissons prioritairement des fournisseurs éthiques et des emballages éco-responsables. Notre croissance respecte les gens et la planète.' },
  ],
  chiffres: [{ nb: '500+', label: 'Produits sélectionnés' }, { nb: '4.8/5', label: 'Note moyenne' }, { nb: '2 000+', label: 'Clients satisfaits' }, { nb: '30 jours', label: 'Politique de retour' }],
  equipe: [{ prenom: 'Alexandre', poste: 'Fondateur & Directeur', photo: '' }, { prenom: 'Marie', poste: 'Responsable des achats', photo: '' }, { prenom: 'Sophie', poste: 'Service à la clientèle', photo: '' }],
};
const EX = {
  avantages: [{ ico: '🚚', titre: 'Livraison Premium', desc: 'Offerte dès 100$' }, { ico: '🔒', titre: 'Paiement Sécurisé', desc: 'SSL & Stripe' }, { ico: '💎', titre: 'Qualité Garantie', desc: 'Sélection rigoureuse' }, { ico: '🔄', titre: 'Retour 30 Jours', desc: 'Sans questions' }],
  temoignages: [
    { texte: 'Qualité exceptionnelle, livraison ultra rapide. Je suis cliente fidèle depuis 2 ans !', auteur: 'Marie L.', ville: 'Montréal', note: 5 },
    { texte: 'Service client impeccable. Mes articles arrivent toujours parfaitement emballés.', auteur: 'Jean-Pierre M.', ville: 'Québec', note: 5 },
    { texte: 'Des produits haut de gamme à des prix justes. Ma boutique préférée!', auteur: 'Sophie R.', ville: 'Laval', note: 5 },
  ],
  reassurance: [{ ico: '🚚', texte: 'Livraison 2-5 jours' }, { ico: '🔒', texte: 'Paiement sécurisé Stripe' }, { ico: '🔄', texte: 'Retour sous 30 jours' }],
  livraisonInfos: [
    { ico: '🚚', titre: 'Livraison standard', delai: '2-5 jours ouvrables', info: 'Gratuite dès 100$' },
    { ico: '⚡', titre: 'Livraison express', delai: '1-2 jours ouvrables', info: 'Disponible au checkout' },
    { ico: '🔄', titre: 'Retours', delai: 'Sous 30 jours', info: 'Articles non utilisés dans emballage original' },
  ],
};
const MENU_PAGES: [string, string, boolean][] = [['accueil', 'Accueil', false], ['catalogue', 'Catalogue', false], ['blog', 'Blog', true], ['faq', 'FAQ', true], ['a-propos', 'À propos', true], ['contact', 'Contact', true]];
const MAX_VALEURS = 6, MAX_CHIFFRES = 6, MAX_EQUIPE = 12;

const INSCRIPTION_DEF = {
  titre: 'Créer un compte', sousTitre: '', boutonTexte: 'Créer mon compte',
  messageSuccesTitre: 'Compte créé avec succès !', messageSuccesTexte: 'Vous pouvez maintenant vous connecter.',
  libelles: { prenom: 'Prénom', nom: 'Nom', email: 'Courriel', mot_de_passe: 'Mot de passe', confirmation: 'Confirmez le mot de passe' },
  telephone: { mode: 'cache' as 'cache' | 'facultatif' | 'obligatoire' },
  adresse: { mode: 'obligatoire' as 'cache' | 'facultatif' | 'obligatoire' },
  infolettre: { affiche: false, texte: 'Je veux recevoir les nouveautés par courriel' },
  age: { affiche: true, minimum: 16, texte: 'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes: { affiche: true, texte: "J'accepte les termes et conditions de la boutique", url: '' },
  champs: [] as ChampInsc[],
};

// Fusionne la config sauvegardée avec les défauts (une config partielle ne perd jamais ses valeurs par défaut)
function fusionInscription(b: any) {
  const x = b && typeof b === 'object' ? b : {};
  const sous = (k: 'libelles' | 'telephone' | 'adresse' | 'infolettre' | 'age' | 'termes') => ({ ...INSCRIPTION_DEF[k], ...(x[k] && typeof x[k] === 'object' ? x[k] : {}) });
  return { ...INSCRIPTION_DEF, ...x, libelles: sous('libelles'), telephone: sous('telephone'), adresse: sous('adresse'), infolettre: sous('infolettre'), age: sous('age'), termes: sous('termes'), champs: Array.isArray(x.champs) ? x.champs : [] };
}

const DEF = {
  nomBoutique: 'Ma Boutique Premium',
  slogan: "L'excellence à votre portée",
  couleurAccent: CP,
  couleurFond: '#0a0a0a',
  couleurTexte: '#ffffff',
  logoUrl: '',
  description: "Fondée avec une passion pour l'excellence, notre boutique sélectionne rigoureusement chaque produit pour vous offrir ce qu'il y a de mieux.",
  afficherTicker: true,
  tickerTexte: '✦ LIVRAISON GRATUITE dès 100$ ✦ RETOUR 30 JOURS ✦ PAIEMENT SÉCURISÉ ✦',
  afficherBarreLivraison: true,
  seuilLivraisonGratuite: 100,
  afficherNotifVente: true,
  afficherNbVues: true,
  afficherWishlist: true,
  afficherAvis: true,
  catalogue: { colonnes: 3, afficherFiltres: true, afficherRecherche: true, afficherPrix: true, afficherStock: true, surtitre: '', titre: '', videTitre: '', videTexte: '' },
  ficheProduit: { afficherZoom: true, afficherAvis: true, afficherPartage: true, afficherSimilaires: true, similairesNombre: 4, boutonLabel: 'Ajouter au panier', boutonCouleur: CP, reassurance: [] as any[], livraisonInfos: [] as any[], similairesSurtitre: '', similairesTitre: '' },
  accueil: {
    heroSurtitre: '', boutonPrincipal: '', boutonSecondaire: '',
    afficherAvantages: true, avantages: [] as any[],
    afficherVedette: true, vedetteSurtitre: '', vedetteTitre: '', vedetteBouton: '', vedetteNombre: 8,
    afficherCategories: true, categoriesSurtitre: '', categoriesTitre: '',
    afficherTemoignages: true, temoignagesSurtitre: '', temoignagesTitre: '', temoignages: [] as any[],
    afficherInfolettre: true, infolettreSurtitre: '', infolettreTitre: '', infolettreTexte: '', infolettreBouton: '',
  },
  menu: { accueil: '', catalogue: '', blog: '', faq: '', 'a-propos': '', contact: '', masques: [] as string[] },
  aPropos: {
    titre: '', sousTitre: '', accroche: '',
    afficherValeurs: true, afficherChiffres: true, afficherEquipe: true, afficherCta: true,
    valeursSurtitre: '', valeursTitre: '', valeurs: [] as any[],
    chiffres: [] as any[],
    equipeSurtitre: '', equipeTitre: '', equipe: [] as any[],
    ctaSurtitre: '', ctaTitre: '', ctaTexte: '', ctaBoutonCatalogue: '', ctaBoutonContact: '',
  },
  faq: { titre: 'Questions fréquentes', items: [
    { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables. Livraison standard 2-5 jours.' },
    { question: 'Puis-je retourner un article ?', reponse: 'Oui, sous 30 jours dans leur emballage original.' },
    { question: 'Quels modes de paiement ?', reponse: 'Visa, Mastercard, American Express et Apple Pay via Stripe.' },
    { question: 'Comment suivre ma commande ?', reponse: 'Un courriel avec numéro de suivi vous est envoyé dès expédition.' },
  ]},
  blog: { titre: 'Notre univers', afficherAuteur: true, afficherDate: true, colonnes: 3, surtitre: '', videTitre: '' },
  inscription: INSCRIPTION_DEF,
  contact: { titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !', adresse: '', telephone: '', courriel: '', heures: '', afficherCarte: false, urlCarte: '', surtitre: '', coordonneesTitre: '', succesTitre: '', succesTexte: '' },
  footer: { nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée", couleurFond: '#050505', couleurTexte: '#ffffff', afficherPropulse: true, reseaux: { facebook: '', instagram: '', tiktok: '', twitter: '', youtube: '', linkedin: '', pinterest: '' }, colonnes: { titre1: 'Boutique', liens1: 'Accueil\nCatalogue\nBlog\nFAQ\nÀ propos', titre2: 'Aide', liens2: 'Contact\nRetours\nLivraison', titre3: 'Légal', liens3: 'Conditions\nConfidentialité' }, politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true, afficherMentions: true } },
};

// ─── Composants UI ────────────────────────────────────────────────────────────
// Liste modifiable (avantages, témoignages, réassurance…) : vide = le site affiche les exemples de démonstration
function ListeEditeur({ items, onChange, max, champs, vide, exemples, ajouter }: {
  items: any[]; onChange: (l: any[]) => void; max: number; vide: string; exemples: any[]; ajouter: string;
  champs: { k: string; ph: string; w?: number; multi?: boolean; type?: string }[];
}) {
  const liste = Array.isArray(items) ? items : [];
  const maj = (i: number, patch: any) => { const a = [...liste]; a[i] = { ...a[i], ...patch }; onChange(a); };
  const nouveau: any = {}; champs.forEach(ch => { nouveau[ch.k] = ''; });
  return (
    <>
      {liste.length === 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
          {vide}
          <div style={{ marginTop: 8 }}><button onClick={() => onChange(exemples.map(x => ({ ...x })))} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#334155' }}>✏️ Partir des exemples</button></div>
        </div>
      )}
      {liste.map((it, i) => (
        <div key={i} style={{ border: '1px solid #222', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {champs.map(ch => (
              <div key={ch.k} style={{ flex: ch.w ? `0 0 ${ch.w}px` : '1 1 160px', minWidth: 0 }}>
                {ch.multi
                  ? <Textarea value={it[ch.k] ?? ''} onChange={(v: string) => maj(i, { [ch.k]: v })} placeholder={ch.ph} rows={2} />
                  : <Inp type={ch.type || 'text'} value={it[ch.k] ?? ''} onChange={(v: string) => maj(i, { [ch.k]: ch.type === 'number' ? (parseInt(v, 10) || '') : v })} placeholder={ch.ph} />}
              </div>
            ))}
            <button onClick={() => onChange(liste.filter((_, k) => k !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
          </div>
        </div>
      ))}
      {liste.length < max && <button onClick={() => onChange([...liste, { ...nouveau }])} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{ajouter}</button>}
    </>
  );
}

const S = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ fontSize: 12, fontWeight: 700, color: CP, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, borderBottom: '1px solid #1a1a1a', paddingBottom: 10 }}>{titre}</h3>
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
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 13, color: '#e5e5e5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
);

const Couleur = ({ label, value, onChange }: any) => (
  <F label={label}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid #333', cursor: 'pointer', padding: 2, background: '#111' }} />
      <Inp value={value} onChange={onChange} placeholder="#c9a96e" />
    </div>
  </F>
);

const Toggle = ({ label, checked, onChange, desc }: any) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#777', lineHeight: 1.5 }}>{desc}</div>}
    </div>
    <button onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: checked ? CP : '#333', position: 'relative', flexShrink: 0, transition: 'background 0.25s', marginTop: 2 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
    </button>
  </div>
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 13, color: '#e5e5e5', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />
);

function EditeurChampInscription({ champ, index, total, ouvertParDefaut, onChange, onSupprimer, onDeplacer }: {
  champ: ChampInsc; index: number; total: number; ouvertParDefaut?: boolean;
  onChange: (c: ChampInsc) => void; onSupprimer: () => void; onDeplacer: (dir: -1 | 1) => void;
}) {
  const [ouvert, setOuvert] = useState(!!ouvertParDefaut);
  const btnFleche = (actif: boolean) => ({ width: 20, height: 16, border: '1px solid #333', borderRadius: 3, background: actif ? '#111' : '#0a0a0a', color: '#888', cursor: actif ? 'pointer' : 'default', fontSize: 8 } as const);
  return (
    <div style={{ border: '1px solid #222', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => onDeplacer(-1)} disabled={index === 0} style={btnFleche(index !== 0)}>▲</button>
          <button onClick={() => onDeplacer(1)} disabled={index === total - 1} style={btnFleche(index !== total - 1)}>▼</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#222' }}>{champ.label || '(sans nom)'}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{TYPE_CHAMP_LABELS[champ.type]}{champ.requis ? ' · Obligatoire' : ''}</p>
        </div>
        <button onClick={() => setOuvert(!ouvert)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>{ouvert ? '✕' : '✏️'}</button>
        <button onClick={onSupprimer} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
      </div>
      {ouvert && (
        <div style={{ padding: 14, borderTop: '1px solid #222' }}>
          <F label="Libellé affiché"><Inp value={champ.label} onChange={(v: string) => onChange({ ...champ, label: v })} placeholder="Ex : Ville" /></F>
          <F label="Type de champ">
            <select value={champ.type} onChange={e => onChange({ ...champ, type: e.target.value as TypeChampInsc })}
              style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 13, color: '#e5e5e5', boxSizing: 'border-box' as const }}>
              {Object.entries(TYPE_CHAMP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          {champ.type !== 'checkbox' && champ.type !== 'select' && <F label="Texte d'exemple (placeholder)"><Inp value={champ.placeholder || ''} onChange={(v: string) => onChange({ ...champ, placeholder: v })} /></F>}
          {champ.type === 'select' && <F label="Options — une par ligne"><Textarea value={(champ.options || []).join('\n')} onChange={(v: string) => onChange({ ...champ, options: v.split('\n').map(o => o.trim()).filter(Boolean) })} rows={4} /></F>}
          <Toggle label="Obligatoire" checked={!!champ.requis} onChange={(v: boolean) => onChange({ ...champ, requis: v })} />
        </div>
      )}
    </div>
  );
}

export default function ConfigMesPagesPremium({ gestionnaireId }: Props) {
  const [onglet, setOnglet]   = useState<PageOnglet>('accueil');
  const [config, setConfig]   = useState<any>(DEF);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [statut, setStatut]   = useState<'idle'|'ok'|'err'>('idle');
  const [apercu, setApercu]   = useState(false);

  const set   = useCallback((k: string, v: any) => setConfig((c: any) => ({ ...c, [k]: v })), []);
  const setFoot = useCallback((patch: any) => setConfig((c: any) => ({ ...c, footer: { ...c.footer, ...patch } })), []);
  const setCat  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, catalogue: { ...c.catalogue, ...patch } })), []);
  const setFP   = useCallback((patch: any) => setConfig((c: any) => ({ ...c, ficheProduit: { ...c.ficheProduit, ...patch } })), []);
  const setAP   = useCallback((patch: any) => setConfig((c: any) => ({ ...c, aPropos: { ...c.aPropos, ...patch } })), []);
  const setFaq  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, faq: { ...c.faq, ...patch } })), []);
  const setIns  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, inscription: { ...c.inscription, ...patch } })), []);
  const [dernierChampInsc, setDernierChampInsc] = useState<string | null>(null);
  const setAcc  = useCallback((patch: any) => setConfig((c: any) => ({ ...c, accueil: { ...c.accueil, ...patch } })), []);
  const setMenu = useCallback((patch: any) => setConfig((c: any) => ({ ...c, menu: { ...c.menu, ...patch } })), []);
  const setBlog = useCallback((patch: any) => setConfig((c: any) => ({ ...c, blog: { ...c.blog, ...patch } })), []);
  const setCont = useCallback((patch: any) => setConfig((c: any) => ({ ...c, contact: { ...c.contact, ...patch } })), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config?.premium) setConfig({ ...DEF, ...data.config.premium, inscription: fusionInscription(data.config.premium.inscription), aPropos: { ...DEF.aPropos, ...(data.config.premium.aPropos || {}) }, ...Object.fromEntries(['accueil', 'menu', 'catalogue', 'ficheProduit', 'blog', 'contact'].map(k => [k, { ...(DEF as any)[k], ...((data.config.premium as any)[k] || {}) }])) }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gestionnaireId]);

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ config: { premium: config } }),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#888',fontFamily:"'Inter',sans-serif" }}><div style={{ textAlign:'center' }}><div style={{ fontSize:32,marginBottom:12 }}>⏳</div><p>Chargement...</p></div></div>;

  const renderConfig = () => {
    switch (onglet) {
      case 'accueil': return (
        <>
          <S titre="Identité de la boutique">
            <F label="Nom de la boutique"><Inp value={config.nomBoutique} onChange={(v: string) => set('nomBoutique', v)} placeholder="Ma Boutique Premium" /></F>
            <F label="Slogan"><Inp value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="L'excellence à votre portée" /></F>
            <F label="Description (page À propos)"><Textarea value={config.description} onChange={(v: string) => set('description', v)} placeholder="Décrivez votre boutique..." rows={4} /></F>
            <F label="URL du logo"><Inp value={config.logoUrl} onChange={(v: string) => set('logoUrl', v)} placeholder="https://..." /></F>
          </S>
          <S titre="Couleurs">
            <Couleur label="Couleur accent (dorée par défaut)" value={config.couleurAccent} onChange={(v: string) => set('couleurAccent', v)} />
            <Couleur label="Couleur fond (noir par défaut)" value={config.couleurFond} onChange={(v: string) => set('couleurFond', v)} />
          </S>
          <S titre="Ticker défilant">
            <Toggle label="Afficher le ticker" checked={config.afficherTicker} onChange={(v: boolean) => set('afficherTicker', v)} desc="Barre défilante en haut de page — idéal pour annonces et promotions" />
            {config.afficherTicker && <F label="Texte du ticker"><Inp value={config.tickerTexte} onChange={(v: string) => set('tickerTexte', v)} placeholder="✦ LIVRAISON GRATUITE dès 100$ ✦" /></F>}
          </S>
          <S titre="Fonctionnalités avancées">
            <Toggle label="Barre livraison gratuite" checked={config.afficherBarreLivraison} onChange={(v: boolean) => set('afficherBarreLivraison', v)} desc="Barre de progression dans le panier vers la livraison gratuite" />
            {config.afficherBarreLivraison && <F label="Seuil livraison gratuite ($)"><Inp type="number" value={config.seuilLivraisonGratuite} onChange={(v: string) => set('seuilLivraisonGratuite', parseFloat(v))} placeholder="100" /></F>}
            <Toggle label="Notification dernière vente" checked={config.afficherNotifVente} onChange={(v: boolean) => set('afficherNotifVente', v)} desc="Démonstration seulement — sera une option payante (add-on). Jamais affiché sur une boutique avec de vraies annonces." />
            <Toggle label="Nombre de personnes qui regardent" checked={config.afficherNbVues} onChange={(v: boolean) => set('afficherNbVues', v)} desc="Démonstration seulement — sera une option payante (add-on). Jamais affiché sur une boutique avec de vraies annonces." />
            <Toggle label="Wishlist (favoris)" checked={config.afficherWishlist} onChange={(v: boolean) => set('afficherWishlist', v)} desc="Bouton cœur sur les cartes produit et la fiche produit" />
            <Toggle label="Avis clients" checked={config.afficherAvis} onChange={(v: boolean) => set('afficherAvis', v)} desc="Étoiles, notes et commentaires sur les fiches produit" />
          </S>

          <S titre="Menu du haut">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Renommez les liens du menu ou cachez les pages dont vous n'avez pas besoin. Vide = nom par défaut.</p>
            {MENU_PAGES.map(([id, defaut, masquable]) => {
              const masque = (config.menu.masques || []).includes(id);
              return (
                <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, opacity: masque ? 0.5 : 1 }}>
                  <div style={{ flex: 1 }}><Inp value={config.menu[id] || ''} onChange={(v: string) => setMenu({ [id]: v })} placeholder={defaut} /></div>
                  {masquable && <button onClick={() => setMenu({ masques: masque ? config.menu.masques.filter((x: string) => x !== id) : [...(config.menu.masques || []), id] })} style={{ background: masque ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: masque ? '#dc2626' : '#16a34a', cursor: 'pointer', minWidth: 78 }}>{masque ? 'Caché' : 'Affiché'}</button>}
                </div>
              );
            })}
          </S>
          <S titre="Accueil — bannière">
            <F label="Sur-titre"><Inp value={config.accueil.heroSurtitre} onChange={(v: string) => setAcc({ heroSurtitre: v })} placeholder="Collection exclusive" /></F>
            <F label="Bouton principal (vers le catalogue)"><Inp value={config.accueil.boutonPrincipal} onChange={(v: string) => setAcc({ boutonPrincipal: v })} placeholder="Découvrir la collection →" /></F>
            <F label="Bouton secondaire (vers le blogue)"><Inp value={config.accueil.boutonSecondaire} onChange={(v: string) => setAcc({ boutonSecondaire: v })} placeholder="Notre univers" /></F>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Le titre est le nom de la boutique et la phrase en dessous est le slogan (section Identité ci-dessus).</p>
          </S>
          <S titre="Accueil — avantages (bandeau)">
            <Toggle label="Afficher le bandeau d'avantages" checked={config.accueil.afficherAvantages !== false} onChange={(v: boolean) => setAcc({ afficherAvantages: v })} />
            <ListeEditeur items={config.accueil.avantages} onChange={(l) => setAcc({ avantages: l })} max={4} exemples={EX.avantages} ajouter="+ Ajouter un avantage"
              vide="Liste vide : le site affiche des exemples de démonstration (Livraison Premium, Paiement Sécurisé…)."
              champs={[{ k: 'ico', ph: '🚚', w: 64 }, { k: 'titre', ph: 'Titre' }, { k: 'desc', ph: 'Description courte' }]} />
          </S>
          <S titre="Accueil — produits vedette">
            <Toggle label="Afficher la section" checked={config.accueil.afficherVedette !== false} onChange={(v: boolean) => setAcc({ afficherVedette: v })} />
            <F label="Sur-titre"><Inp value={config.accueil.vedetteSurtitre} onChange={(v: string) => setAcc({ vedetteSurtitre: v })} placeholder="Sélection" /></F>
            <F label="Titre"><Inp value={config.accueil.vedetteTitre} onChange={(v: string) => setAcc({ vedetteTitre: v })} placeholder="Nos coups de cœur" /></F>
            <F label="Texte du bouton"><Inp value={config.accueil.vedetteBouton} onChange={(v: string) => setAcc({ vedetteBouton: v })} placeholder="Voir tout →" /></F>
            <F label="Nombre de produits affichés (1 à 12)"><Inp type="number" value={config.accueil.vedetteNombre} onChange={(v: string) => setAcc({ vedetteNombre: Math.max(1, Math.min(12, parseInt(v, 10) || 8)) })} placeholder="8" /></F>
          </S>
          <S titre="Accueil — catégories">
            <Toggle label="Afficher la section" checked={config.accueil.afficherCategories !== false} onChange={(v: boolean) => setAcc({ afficherCategories: v })} />
            <F label="Sur-titre"><Inp value={config.accueil.categoriesSurtitre} onChange={(v: string) => setAcc({ categoriesSurtitre: v })} placeholder="Univers" /></F>
            <F label="Titre"><Inp value={config.accueil.categoriesTitre} onChange={(v: string) => setAcc({ categoriesTitre: v })} placeholder="Nos catégories" /></F>
          </S>
          <S titre="Accueil — témoignages">
            <Toggle label="Afficher la section" checked={config.accueil.afficherTemoignages !== false} onChange={(v: boolean) => setAcc({ afficherTemoignages: v })} desc="Mettez ici de vrais témoignages de clients. Sinon, cachez la section." />
            <F label="Sur-titre"><Inp value={config.accueil.temoignagesSurtitre} onChange={(v: string) => setAcc({ temoignagesSurtitre: v })} placeholder="Témoignages" /></F>
            <F label="Titre"><Inp value={config.accueil.temoignagesTitre} onChange={(v: string) => setAcc({ temoignagesTitre: v })} placeholder="Ce que disent nos clients" /></F>
            <ListeEditeur items={config.accueil.temoignages} onChange={(l) => setAcc({ temoignages: l })} max={6} exemples={EX.temoignages} ajouter="+ Ajouter un témoignage"
              vide="Liste vide : le site affiche 3 témoignages d'exemple (démonstration)."
              champs={[{ k: 'texte', ph: 'Témoignage', multi: true }, { k: 'auteur', ph: 'Nom (ex: Marie L.)' }, { k: 'ville', ph: 'Ville' }, { k: 'note', ph: 'Note 1-5', w: 90, type: 'number' }]} />
          </S>
          <S titre="Accueil — infolettre">
            <Toggle label="Afficher la section" checked={config.accueil.afficherInfolettre !== false} onChange={(v: boolean) => setAcc({ afficherInfolettre: v })} desc="Démonstration seulement — sera une option payante (add-on). Jamais affichée sur une boutique avec de vraies annonces." />
            <F label="Sur-titre"><Inp value={config.accueil.infolettreSurtitre} onChange={(v: string) => setAcc({ infolettreSurtitre: v })} placeholder="Exclusivités" /></F>
            <F label="Titre"><Inp value={config.accueil.infolettreTitre} onChange={(v: string) => setAcc({ infolettreTitre: v })} placeholder="Restez dans la boucle" /></F>
            <F label="Texte"><Textarea value={config.accueil.infolettreTexte} onChange={(v: string) => setAcc({ infolettreTexte: v })} placeholder="Offres exclusives, nouvelles collections…" rows={2} /></F>
            <F label="Texte du bouton"><Inp value={config.accueil.infolettreBouton} onChange={(v: string) => setAcc({ infolettreBouton: v })} placeholder="S'inscrire →" /></F>
          </S>
        </>
      );

      case 'catalogue': return (
        <>
          <S titre="Affichage du catalogue">
            <F label="Colonnes par défaut (grille)">
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4].map(n => (
                  <button key={n} onClick={() => setCat({ colonnes: n })}
                    style={{ flex: 1, padding: '9px', border: `2px solid ${config.catalogue.colonnes === n ? CP : '#333'}`, borderRadius: 8, background: config.catalogue.colonnes === n ? `${CP}15` : '#111', color: config.catalogue.colonnes === n ? CP : '#666', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </F>
            <Toggle label="Afficher les filtres (prix, catégorie)" checked={config.catalogue.afficherFiltres} onChange={(v: boolean) => setCat({ afficherFiltres: v })} />
            <Toggle label="Afficher la recherche" checked={config.catalogue.afficherRecherche} onChange={(v: boolean) => setCat({ afficherRecherche: v })} />
            <Toggle label="Afficher les prix" checked={config.catalogue.afficherPrix} onChange={(v: boolean) => setCat({ afficherPrix: v })} />
            <Toggle label="Afficher le stock" checked={config.catalogue.afficherStock} onChange={(v: boolean) => setCat({ afficherStock: v })} />
          </S>
          <S titre="Textes de la page">
            <F label="Sur-titre"><Inp value={config.catalogue.surtitre} onChange={(v: string) => setCat({ surtitre: v })} placeholder="Catalogue" /></F>
            <F label="Titre"><Inp value={config.catalogue.titre} onChange={(v: string) => setCat({ titre: v })} placeholder="Tous nos produits" /></F>
            <F label="Message quand aucun produit — titre"><Inp value={config.catalogue.videTitre} onChange={(v: string) => setCat({ videTitre: v })} placeholder="Aucun produit" /></F>
            <F label="Message quand aucun produit — texte"><Inp value={config.catalogue.videTexte} onChange={(v: string) => setCat({ videTexte: v })} placeholder="Modifiez vos filtres" /></F>
          </S>
        </>
      );

      case 'fiche-produit': return (
        <>
          <S titre="Galerie & affichage">
            <Toggle label="Zoom image au survol / clic" checked={config.ficheProduit.afficherZoom} onChange={(v: boolean) => setFP({ afficherZoom: v })} desc="Permet aux clients de zoomer sur les images du produit" />
            <Toggle label="Avis clients" checked={config.ficheProduit.afficherAvis} onChange={(v: boolean) => setFP({ afficherAvis: v })} />
            <Toggle label="Boutons de partage (Facebook, Pinterest, X)" checked={config.ficheProduit.afficherPartage} onChange={(v: boolean) => setFP({ afficherPartage: v })} />
            <Toggle label="Produits similaires" checked={config.ficheProduit.afficherSimilaires} onChange={(v: boolean) => setFP({ afficherSimilaires: v })} />
            {config.ficheProduit.afficherSimilaires && (
              <F label="Nombre de produits similaires">
                <div style={{ display: 'flex', gap: 8 }}>
                  {[2, 4, 6].map(n => (
                    <button key={n} onClick={() => setFP({ similairesNombre: n })}
                      style={{ flex: 1, padding: '8px', border: `2px solid ${config.ficheProduit.similairesNombre === n ? CP : '#333'}`, borderRadius: 8, background: config.ficheProduit.similairesNombre === n ? `${CP}15` : '#111', color: config.ficheProduit.similairesNombre === n ? CP : '#666', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </F>
            )}
          </S>
          <S titre="Bouton d'achat">
            <F label="Texte du bouton">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {['Ajouter au panier', 'Commander maintenant', 'Acheter', 'Réserver'].map(lbl => (
                  <button key={lbl} onClick={() => setFP({ boutonLabel: lbl })}
                    style={{ padding: '8px 12px', textAlign: 'left', border: `2px solid ${config.ficheProduit.boutonLabel === lbl ? CP : '#333'}`, borderRadius: 7, background: config.ficheProduit.boutonLabel === lbl ? `${CP}15` : '#111', color: config.ficheProduit.boutonLabel === lbl ? CP : '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <Inp value={config.ficheProduit.boutonLabel} onChange={(v: string) => setFP({ boutonLabel: v })} placeholder="Texte personnalisé..." />
            </F>
            <Couleur label="Couleur du bouton" value={config.ficheProduit.boutonCouleur} onChange={(v: string) => setFP({ boutonCouleur: v })} />
          </S>
          <S titre="Rassurance (sous le bouton d'achat)">
            <ListeEditeur items={config.ficheProduit.reassurance} onChange={(l) => setFP({ reassurance: l })} max={5} exemples={EX.reassurance} ajouter="+ Ajouter une ligne"
              vide="Liste vide : le site affiche des lignes d'exemple (Livraison 2-5 jours, Paiement sécurisé…)."
              champs={[{ k: 'ico', ph: '🚚', w: 64 }, { k: 'texte', ph: 'Texte' }]} />
          </S>
          <S titre="Onglet « Livraison »">
            <ListeEditeur items={config.ficheProduit.livraisonInfos} onChange={(l) => setFP({ livraisonInfos: l })} max={6} exemples={EX.livraisonInfos} ajouter="+ Ajouter une ligne"
              vide="Liste vide : le site affiche des exemples (Livraison standard, express, Retours). Vos vraies méthodes et frais sont calculés à la caisse."
              champs={[{ k: 'ico', ph: '🚚', w: 64 }, { k: 'titre', ph: 'Titre' }, { k: 'delai', ph: 'Délai' }, { k: 'info', ph: 'Information' }]} />
          </S>
          <S titre="Produits similaires — textes">
            <F label="Sur-titre"><Inp value={config.ficheProduit.similairesSurtitre} onChange={(v: string) => setFP({ similairesSurtitre: v })} placeholder="Vous aimerez aussi" /></F>
            <F label="Titre"><Inp value={config.ficheProduit.similairesTitre} onChange={(v: string) => setFP({ similairesTitre: v })} placeholder="Produits similaires" /></F>
          </S>
        </>
      );

      case 'a-propos': {
        const ap = config.aPropos;
        const maj = (cle: string, i: number, patch: any) => { const arr = [...(ap[cle] || [])]; arr[i] = { ...arr[i], ...patch }; setAP({ [cle]: arr }); };
        const ret = (cle: string, i: number) => setAP({ [cle]: (ap[cle] || []).filter((_: any, k: number) => k !== i) });
        const exemples = (cle: 'valeurs' | 'chiffres' | 'equipe') => setAP({ [cle]: APROPOS_EX[cle].map((x: any) => ({ ...x })) });
        const vide = (cle: string) => !(ap[cle] || []).length;
        const noteVide = (cle: 'valeurs' | 'chiffres' | 'equipe') => (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
            Liste vide : le site affiche des <b>exemples de démonstration</b>. Ajoutez vos éléments pour les remplacer, ou partez des exemples pour les modifier.
            <div style={{ marginTop: 8 }}><button onClick={() => exemples(cle)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#334155' }}>✏️ Partir des exemples</button></div>
          </div>
        );
        return (
        <>
          <S titre="Titres">
            <F label="Titre principal"><Inp value={ap.titre} onChange={(v: string) => setAP({ titre: v })} placeholder="À propos de nous" /></F>
            <F label="Sous-titre (au-dessus du titre)"><Inp value={ap.sousTitre} onChange={(v: string) => setAP({ sousTitre: v })} placeholder="Notre histoire" /></F>
          </S>
          <S titre="Présentation">
            <F label="Phrase d'accroche (grosse phrase en haut)"><Textarea value={ap.accroche} onChange={(v: string) => setAP({ accroche: v })} placeholder="Nous croyons que le luxe devrait être accessible à tous — sans compromis sur la qualité." rows={2} /></F>
            <F label="Description de la boutique"><Textarea value={config.description} onChange={(v: string) => set('description', v)} placeholder="Racontez votre histoire..." rows={5} /></F>
          </S>
          <S titre="Sections affichées">
            <Toggle label="Bloc valeurs (cartes)" checked={ap.afficherValeurs !== false} onChange={(v: boolean) => setAP({ afficherValeurs: v })} />
            <Toggle label="Chiffres clés" checked={ap.afficherChiffres !== false} onChange={(v: boolean) => setAP({ afficherChiffres: v })} />
            <Toggle label="Section équipe" checked={ap.afficherEquipe !== false} onChange={(v: boolean) => setAP({ afficherEquipe: v })} />
            <Toggle label="Bloc final avec boutons" checked={ap.afficherCta !== false} onChange={(v: boolean) => setAP({ afficherCta: v })} />
          </S>
          <S titre="Nos valeurs">
            <F label="Sur-titre"><Inp value={ap.valeursSurtitre} onChange={(v: string) => setAP({ valeursSurtitre: v })} placeholder="NOS VALEURS" /></F>
            <F label="Titre"><Inp value={ap.valeursTitre} onChange={(v: string) => setAP({ valeursTitre: v })} placeholder="Ce qui nous définit" /></F>
            {vide('valeurs') && noteVide('valeurs')}
            {(ap.valeurs || []).map((v: any, i: number) => (
              <div key={i} style={{ border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 70 }}><Inp value={v.ico} onChange={(val: string) => maj('valeurs', i, { ico: val })} placeholder="💎" /></div>
                  <Inp value={v.titre} onChange={(val: string) => maj('valeurs', i, { titre: val })} placeholder="Titre de la valeur" />
                  <button onClick={() => ret('valeurs', i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
                </div>
                <Textarea value={v.desc} onChange={(val: string) => maj('valeurs', i, { desc: val })} placeholder="Description..." rows={2} />
              </div>
            ))}
            {(ap.valeurs || []).length < MAX_VALEURS && <button onClick={() => setAP({ valeurs: [...(ap.valeurs || []), { ico: '⭐', titre: '', desc: '' }] })} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une valeur</button>}
          </S>
          <S titre="Chiffres clés">
            {vide('chiffres') && noteVide('chiffres')}
            {(ap.chiffres || []).map((x: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 130 }}><Inp value={x.nb} onChange={(val: string) => maj('chiffres', i, { nb: val })} placeholder="500+" /></div>
                <Inp value={x.label} onChange={(val: string) => maj('chiffres', i, { label: val })} placeholder="Produits sélectionnés" />
                <button onClick={() => ret('chiffres', i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
            {(ap.chiffres || []).length < MAX_CHIFFRES && <button onClick={() => setAP({ chiffres: [...(ap.chiffres || []), { nb: '', label: '' }] })} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter un chiffre</button>}
          </S>
          <S titre="Équipe">
            <F label="Sur-titre"><Inp value={ap.equipeSurtitre} onChange={(v: string) => setAP({ equipeSurtitre: v })} placeholder="L'ÉQUIPE" /></F>
            <F label="Titre"><Inp value={ap.equipeTitre} onChange={(v: string) => setAP({ equipeTitre: v })} placeholder="Les visages derrière la boutique" /></F>
            {vide('equipe') && noteVide('equipe')}
            {(ap.equipe || []).map((m: any, i: number) => (
              <div key={i} style={{ border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Inp value={m.prenom} onChange={(val: string) => maj('equipe', i, { prenom: val })} placeholder="Prénom" />
                  <Inp value={m.poste} onChange={(val: string) => maj('equipe', i, { poste: val })} placeholder="Poste" />
                  <button onClick={() => ret('equipe', i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
                </div>
                <Inp value={m.photo} onChange={(val: string) => maj('equipe', i, { photo: val })} placeholder="URL de la photo (facultatif, https://...)" />
              </div>
            ))}
            {(ap.equipe || []).length < MAX_EQUIPE && <button onClick={() => setAP({ equipe: [...(ap.equipe || []), { prenom: '', poste: '', photo: '' }] })} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter une personne</button>}
          </S>
          <S titre="Bloc final">
            <F label="Sur-titre"><Inp value={ap.ctaSurtitre} onChange={(v: string) => setAP({ ctaSurtitre: v })} placeholder="REJOIGNEZ-NOUS" /></F>
            <F label="Titre"><Inp value={ap.ctaTitre} onChange={(v: string) => setAP({ ctaTitre: v })} placeholder="Prêt à découvrir notre sélection ?" /></F>
            <F label="Texte"><Textarea value={ap.ctaTexte} onChange={(v: string) => setAP({ ctaTexte: v })} placeholder="Des produits d'exception vous attendent..." rows={2} /></F>
            <F label="Bouton 1 (vers le catalogue)"><Inp value={ap.ctaBoutonCatalogue} onChange={(v: string) => setAP({ ctaBoutonCatalogue: v })} placeholder="Voir notre catalogue →" /></F>
            <F label="Bouton 2 (vers contact)"><Inp value={ap.ctaBoutonContact} onChange={(v: string) => setAP({ ctaBoutonContact: v })} placeholder="Nous contacter" /></F>
          </S>
        </>
        );
      }

      case 'faq': return (
        <>
          <S titre="Titre de la page">
            <F label="Titre"><Inp value={config.faq.titre} onChange={(v: string) => setFaq({ titre: v })} placeholder="Questions fréquentes" /></F>
          </S>
          <S titre="Questions & réponses">
            {config.faq.items.map((item: any, i: number) => (
              <div key={i} style={{ border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ marginBottom: 8 }}>
                  <Inp value={item.question} onChange={(v: string) => { const arr = [...config.faq.items]; arr[i] = { ...arr[i], question: v }; setFaq({ items: arr }); }} placeholder="Question..." />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Textarea value={item.reponse} onChange={(v: string) => { const arr = [...config.faq.items]; arr[i] = { ...arr[i], reponse: v }; setFaq({ items: arr }); }} placeholder="Réponse..." rows={2} />
                  <button onClick={() => setFaq({ items: config.faq.items.filter((_: any, j: number) => j !== i) })}
                    style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, padding: '0 10px', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => setFaq({ items: [...config.faq.items, { question: '', reponse: '' }] })}
              style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Ajouter une question
            </button>
          </S>
        </>
      );

      case 'blog': return (
        <>
          <S titre="Page blog">
            <F label="Titre de la page"><Inp value={config.blog.titre} onChange={(v: string) => set('blog', { ...config.blog, titre: v })} placeholder="Notre univers" /></F>
            <F label="Colonnes">
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => set('blog', { ...config.blog, colonnes: n })}
                    style={{ flex: 1, padding: '9px', border: `2px solid ${config.blog.colonnes === n ? CP : '#333'}`, borderRadius: 8, background: config.blog.colonnes === n ? `${CP}15` : '#111', color: config.blog.colonnes === n ? CP : '#666', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </F>
            <Toggle label="Afficher l'auteur" checked={config.blog.afficherAuteur} onChange={(v: boolean) => set('blog', { ...config.blog, afficherAuteur: v })} />
            <F label="Sur-titre"><Inp value={config.blog.surtitre} onChange={(v: string) => setBlog({ surtitre: v })} placeholder="Blogue" /></F>
            <F label="Message quand aucun article"><Inp value={config.blog.videTitre} onChange={(v: string) => setBlog({ videTitre: v })} placeholder="Aucun article" /></F>
            <Toggle label="Afficher la date" checked={config.blog.afficherDate} onChange={(v: boolean) => set('blog', { ...config.blog, afficherDate: v })} />
          </S>
        </>
      );

      case 'contact': return (
        <>
          <S titre="Page contact">
            <F label="Titre"><Inp value={config.contact.titre} onChange={(v: string) => setCont({ titre: v })} placeholder="Nous contacter" /></F>
            <F label="Sous-titre"><Inp value={config.contact.sousTitre} onChange={(v: string) => setCont({ sousTitre: v })} placeholder="Une question ? Écrivez-nous !" /></F>
            <F label="Adresse"><Inp value={config.contact.adresse} onChange={(v: string) => setCont({ adresse: v })} placeholder="123 rue Principale, Montréal QC" /></F>
            <F label="Téléphone"><Inp value={config.contact.telephone} onChange={(v: string) => setCont({ telephone: v })} placeholder="514 000-0000" /></F>
            <F label="Courriel"><Inp value={config.contact.courriel} onChange={(v: string) => setCont({ courriel: v })} placeholder="info@maboutique.ca" /></F>
            <F label="Heures d'ouverture"><Inp value={config.contact.heures} onChange={(v: string) => setCont({ heures: v })} placeholder="Lun-Ven 9h-17h" /></F>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.6 }}>Si aucune coordonnée n'est remplie, le site affiche des coordonnées d'exemple (démonstration). Remplissez-en au moins une pour les remplacer.</p>
            <F label="Sur-titre"><Inp value={config.contact.surtitre} onChange={(v: string) => setCont({ surtitre: v })} placeholder="Contact" /></F>
            <F label="Titre de la colonne coordonnées"><Inp value={config.contact.coordonneesTitre} onChange={(v: string) => setCont({ coordonneesTitre: v })} placeholder="Nos coordonnées" /></F>
            <F label="Message envoyé — titre"><Inp value={config.contact.succesTitre} onChange={(v: string) => setCont({ succesTitre: v })} placeholder="Message envoyé !" /></F>
            <F label="Message envoyé — texte"><Inp value={config.contact.succesTexte} onChange={(v: string) => setCont({ succesTexte: v })} placeholder="Nous vous répondrons sous peu." /></F>
            <Toggle label="Afficher Google Maps" checked={config.contact.afficherCarte} onChange={(v: boolean) => setCont({ afficherCarte: v })} />
            {config.contact.afficherCarte && <F label="URL de la carte"><Inp value={config.contact.urlCarte} onChange={(v: string) => setCont({ urlCarte: v })} placeholder="https://www.google.com/maps/embed?pb=..." /></F>}
            {config.contact.afficherCarte && <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>Dans Google Maps : Partager → Intégrer une carte → copiez l'adresse qui suit src="…" (elle doit commencer par https://).</p>}
          </S>
        </>
      );

      case 'inscription': {
        const ins = config.inscription;
        const champs: ChampInsc[] = ins.champs || [];
        const majChamp = (i: number, c: ChampInsc) => { const arr = [...champs]; arr[i] = c; setIns({ champs: arr }); };
        const deplacer = (i: number, dir: -1 | 1) => { const arr = [...champs]; const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setIns({ champs: arr }); };
        const ajouter = () => { const id = `champ_${Date.now()}`; setIns({ champs: [...champs, { id, type: 'text', label: '' }] }); setDernierChampInsc(id); };
        const Choix = ({ valeur, options, onChoisir }: { valeur: string; options: [string, string][]; onChoisir: (v: string) => void }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {options.map(([v, l]) => (
              <button key={v} onClick={() => onChoisir(v)}
                style={{ flex: 1, padding: '9px', border: `2px solid ${valeur === v ? CP : '#333'}`, borderRadius: 8, background: valeur === v ? `${CP}15` : '#111', color: valeur === v ? CP : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        );
        return (
          <>
            <S titre="Textes de la page">
              <F label="Titre"><Inp value={ins.titre} onChange={(v: string) => setIns({ titre: v })} placeholder="Créer un compte" /></F>
              <F label="Sous-titre (optionnel)"><Inp value={ins.sousTitre} onChange={(v: string) => setIns({ sousTitre: v })} /></F>
              <F label="Texte du bouton"><Inp value={ins.boutonTexte} onChange={(v: string) => setIns({ boutonTexte: v })} placeholder="Créer mon compte" /></F>
              <F label="Titre du message de succès"><Inp value={ins.messageSuccesTitre} onChange={(v: string) => setIns({ messageSuccesTitre: v })} /></F>
              <F label="Texte du message de succès"><Textarea value={ins.messageSuccesTexte} onChange={(v: string) => setIns({ messageSuccesTexte: v })} rows={2} /></F>
            </S>
            <S titre="Champs de base">
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.6 }}>Ces 5 champs sont toujours présents (le compte ne peut pas exister sans eux). Vous pouvez seulement changer leur libellé.</p>
              {([['prenom', 'Prénom'], ['nom', 'Nom'], ['email', 'Courriel'], ['mot_de_passe', 'Mot de passe'], ['confirmation', 'Confirmation du mot de passe']] as const).map(([k, l]) => (
                <F key={k} label={l}><Inp value={ins.libelles[k]} onChange={(v: string) => setIns({ libelles: { ...ins.libelles, [k]: v } })} /></F>
              ))}
            </S>
            <S titre="Champs facultatifs">
              <F label="Téléphone">
                <Choix valeur={ins.telephone.mode} onChoisir={v => setIns({ telephone: { mode: v } })} options={[['cache', 'Caché'], ['facultatif', 'Facultatif'], ['obligatoire', 'Obligatoire']]} />
              </F>
              <F label="Adresse de livraison (adresse, ville, code postal, province)">
                <Choix valeur={ins.adresse.mode} onChoisir={v => setIns({ adresse: { mode: v } })} options={[['cache', 'Cachée'], ['facultatif', 'Facultative'], ['obligatoire', 'Obligatoire']]} />
              </F>
              <p style={{ fontSize: 12, color: '#888', margin: '-6px 0 14px', lineHeight: 1.6 }}>Enregistrée de façon chiffrée et pré-remplie à la caisse. Format canadien vérifié (code postal, province).</p>
              <Toggle label="Case « infolettre »" checked={ins.infolettre.affiche} onChange={(v: boolean) => setIns({ infolettre: { ...ins.infolettre, affiche: v } })} desc="Le client peut cocher pour recevoir vos nouveautés (jamais obligatoire)" />
              {ins.infolettre.affiche && <F label="Texte de la case"><Inp value={ins.infolettre.texte} onChange={(v: string) => setIns({ infolettre: { ...ins.infolettre, texte: v } })} /></F>}
            </S>
            <S titre="Âge minimum">
              <Toggle label="Afficher la case de confirmation d'âge" checked={ins.age.affiche} onChange={(v: boolean) => setIns({ age: { ...ins.age, affiche: v } })} desc="Case obligatoire à cocher pour créer le compte" />
              {ins.age.affiche ? (
                <>
                  <F label="Âge minimum"><Inp type="number" value={ins.age.minimum} onChange={(v: string) => setIns({ age: { ...ins.age, minimum: Math.max(1, Math.min(99, parseInt(v, 10) || 16)) } })} placeholder="16" /></F>
                  <F label="Texte de la case — {age} est remplacé par l'âge minimum"><Inp value={ins.age.texte} onChange={(v: string) => setIns({ age: { ...ins.age, texte: v } })} /></F>
                </>
              ) : (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠️ Sans cette case, aucune confirmation d'âge n'est demandée. Vous restez responsable du respect des lois qui s'appliquent à votre boutique (ex. Loi 25 au Québec).
                </div>
              )}
            </S>
            <S titre="Termes et conditions">
              <Toggle label="Afficher la case « termes et conditions »" checked={ins.termes.affiche} onChange={(v: boolean) => setIns({ termes: { ...ins.termes, affiche: v } })} desc="Case obligatoire à cocher pour créer le compte" />
              {ins.termes.affiche && <>
                <F label="Texte de la case"><Inp value={ins.termes.texte} onChange={(v: string) => setIns({ termes: { ...ins.termes, texte: v } })} /></F>
                <F label="Lien vers vos conditions (optionnel)"><Inp value={ins.termes.url} onChange={(v: string) => setIns({ termes: { ...ins.termes, url: v } })} placeholder="https://..." /></F>
                {ins.termes.url && !/^https?:\/\//i.test(ins.termes.url) && <div style={{ fontSize: 12, color: '#dc2626', margin: '-6px 0 10px' }}>⚠️ Le lien doit commencer par https:// pour s'afficher.</div>}
              </>}
            </S>
            <S titre={`Champs personnalisés (${champs.length}/${MAX_CHAMPS_INSC})`}>
              {champs.map((c, i) => (
                <EditeurChampInscription key={c.id} champ={c} index={i} total={champs.length} ouvertParDefaut={c.id === dernierChampInsc}
                  onChange={nc => majChamp(i, nc)} onSupprimer={() => setIns({ champs: champs.filter((_, j) => j !== i) })} onDeplacer={dir => deplacer(i, dir)} />
              ))}
              {champs.length < MAX_CHAMPS_INSC && (
                <button onClick={ajouter} style={{ width: '100%', padding: '9px', border: `2px dashed ${CP}40`, borderRadius: 8, background: `${CP}05`, color: CP, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Ajouter un champ
                </button>
              )}
              <p style={{ fontSize: 11, color: '#888', margin: '10px 0 0' }}>Les réponses sont conservées avec le compte du client.</p>
            </S>
          </>
        );
      }

      case 'footer': return (
        <>
          <S titre="Identité du footer">
            <F label="Nom de la boutique"><Inp value={config.footer.nomBoutique} onChange={(v: string) => setFoot({ nomBoutique: v })} placeholder="Ma Boutique Premium" /></F>
            <F label="Slogan"><Inp value={config.footer.slogan} onChange={(v: string) => setFoot({ slogan: v })} placeholder="L'excellence à votre portée" /></F>
            <Couleur label="Couleur de fond" value={config.footer.couleurFond} onChange={(v: string) => setFoot({ couleurFond: v })} />
          </S>
          <S titre="Réseaux sociaux">
            {(['facebook','instagram','tiktok','twitter','youtube','linkedin','pinterest'] as const).map(r => (
              <F key={r} label={r.charAt(0).toUpperCase() + r.slice(1)}><Inp value={config.footer.reseaux[r]} onChange={(v: string) => setFoot({ reseaux: { ...config.footer.reseaux, [r]: v } })} placeholder="https://..." /></F>
            ))}
          </S>
          <S titre="Colonnes de liens">
            {[1,2,3].map(n => (
              <div key={n} style={{ marginBottom: 16 }}>
                <F label={`Titre colonne ${n}`}><Inp value={config.footer.colonnes[`titre${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`titre${n}`]: v } })} placeholder={`Titre ${n}`} /></F>
                <F label={`Liens colonne ${n} (un par ligne)`}><Textarea value={config.footer.colonnes[`liens${n}`]} onChange={(v: string) => setFoot({ colonnes: { ...config.footer.colonnes, [`liens${n}`]: v } })} rows={4} placeholder="Accueil&#10;Catalogue&#10;Blog" /></F>
              </div>
            ))}
          </S>
          <S titre="Liens légaux du bas de page">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.6 }}>Ces liens ouvrent vos politiques (Configuration → Mes politiques). Un lien n'apparaît que si la politique est rédigée.</p>
            {([['afficherConditions', 'Conditions de service'], ['afficherConfidentialite', 'Confidentialité'], ['afficherRetours', 'Retour & remboursement'], ['afficherLivraison', 'Expédition'], ['afficherMentions', 'Mentions légales']] as const).map(([k, l]) => (
              <Toggle key={k} label={l} checked={(config.footer.politiques || {})[k] !== false} onChange={(v: boolean) => setFoot({ politiques: { ...(config.footer.politiques || {}), [k]: v } })} />
            ))}
            <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0', lineHeight: 1.6 }}>Astuce : dans les colonnes de liens ci-dessus, écrire « Retours », « Livraison », « Conditions », « Confidentialité », « Coordonnées » ou « Mentions légales » ouvre aussi la politique correspondante.</p>
          </S>
          <S titre="Branding e-Vend Studio">
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#e5e5e5', margin: '0 0 3px' }}>Cacher "Propulsé par e-Vend Studio"</p>
                <p style={{ fontSize: 11, color: '#666', margin: 0 }}>Gérez cette option depuis <strong>Branding & options</strong> (+2$/mois).</p>
              </div>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚙️</span>
            </div>
          </S>
        </>
      );

      case 'options': return (
        <>
          <S titre="Options Premium exclusives">
            <div style={{ background: `${CP}08`, border: `1px solid ${CP}20`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.7 }}>
                💎 Ces options sont exclusives au template Premium et ne sont pas disponibles dans Simplisse.
              </p>
            </div>
            <Toggle label="Ticker défilant en haut" checked={config.afficherTicker} onChange={(v: boolean) => set('afficherTicker', v)} desc="Barre de défilement pour annonces et promotions" />
            {config.afficherTicker && <F label="Texte de la bannière du haut (ticker)"><Textarea value={config.tickerTexte} onChange={(v: string) => set('tickerTexte', v)} placeholder="✦ LIVRAISON GRATUITE dès 100$ ✦ RETOUR 30 JOURS ✦" rows={2} /></F>}
            <Toggle label="Notification dernière vente" checked={config.afficherNotifVente} onChange={(v: boolean) => set('afficherNotifVente', v)} desc="Démonstration seulement — sera une option payante (add-on). Jamais affiché sur une boutique avec de vraies annonces." />
            <Toggle label="Compteur de vues en temps réel" checked={config.afficherNbVues} onChange={(v: boolean) => set('afficherNbVues', v)} desc="Démonstration seulement — sera une option payante (add-on). Jamais affiché sur une boutique avec de vraies annonces." />
            <Toggle label="Barre de progression livraison" checked={config.afficherBarreLivraison} onChange={(v: boolean) => set('afficherBarreLivraison', v)} desc="Encourage les clients à ajouter plus d'articles" />
            <Toggle label="Wishlist (liste d'envies)" checked={config.afficherWishlist} onChange={(v: boolean) => set('afficherWishlist', v)} desc="Permet aux clients de sauvegarder leurs produits préférés" />
            <Toggle label="Zoom image sur fiche produit" checked={config.ficheProduit.afficherZoom} onChange={(v: boolean) => setFP({ afficherZoom: v })} desc="Zoom fluide au survol de la souris — effet luxe garanti" />
          </S>
          {config.afficherBarreLivraison && (
            <S titre="Livraison gratuite">
              <F label="Seuil de livraison gratuite ($)">
                <Inp type="number" value={config.seuilLivraisonGratuite} onChange={(v: string) => set('seuilLivraisonGratuite', parseFloat(v) || 100)} placeholder="100" />
              </F>
            </S>
          )}
        </>
      );

      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,#0a0a0a,#1a1a1a)`, border: `1px solid ${CP}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💎</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Config — Boutique Premium</h1>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Personnalisez votre boutique haut de gamme</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open(`/site-preview?vendeurId=${gestionnaireId}`, '_blank', 'noopener,noreferrer')}
            style={{ padding: '10px 18px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: '#555' }}>
            👁 Aperçu
          </button>
          <button onClick={sauvegarder} disabled={saving}
            style={{ padding: '10px 24px', background: `linear-gradient(135deg,${CP},${OR2})`, border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? '⏳ Sauvegarde...' : '✅ Sauvegarder'}
          </button>
        </div>
      </div>

      {statut === 'ok' && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#16a34a', fontWeight: 500 }}>✅ Configuration sauvegardée !</div>}
      {statut === 'err' && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', fontWeight: 500 }}>❌ Erreur lors de la sauvegarde.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Onglets */}
        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 8 }}>
          {PAGES.map(p => (
            <button key={p.id} onClick={() => setOnglet(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: onglet === p.id ? `${CP}15` : 'none', border: 'none', borderRadius: 8, color: onglet === p.id ? '#b8870e' : '#666', fontSize: 13, fontWeight: onglet === p.id ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 15 }}>{p.icone}</span>{p.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 28px' }}>
          {renderConfig()}
        </div>
      </div>
    </div>
  );
}