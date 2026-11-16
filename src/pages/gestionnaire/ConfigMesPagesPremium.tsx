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
  afficherPopupPromo: false,
  popupPromoTexte: 'Obtenez 10% de réduction sur votre première commande !',
  popupPromoCode: 'BIENVENUE10',
  afficherBarreLivraison: true,
  seuilLivraisonGratuite: 100,
  afficherNotifVente: true,
  afficherNbVues: true,
  afficherWishlist: true,
  afficherAvis: true,
  catalogue: { colonnes: 3, afficherFiltres: true, afficherRecherche: true, afficherPrix: true, afficherStock: true },
  ficheProduit: { afficherZoom: true, afficherAvis: true, afficherPartage: true, afficherSimilaires: true, similairesNombre: 4, boutonLabel: 'Ajouter au panier', boutonCouleur: CP },
  aPropos: {
    titre: 'À propos de nous', sousTitre: 'Notre histoire',
    afficherValeurs: true, afficherChiffres: true, afficherEquipe: true, afficherCta: true,
    valeurs: [
      { ico: '💎', titre: 'Qualité sans compromis', desc: 'Chaque produit est sélectionné selon des critères rigoureux.' },
      { ico: '🤝', titre: 'Service humain', desc: 'Notre équipe est disponible pour vous accompagner à chaque étape.' },
      { ico: '🌱', titre: 'Responsabilité', desc: 'Nous choisissons prioritairement des fournisseurs éthiques.' },
    ],
    chiffres: [
      { nb: '500+', label: 'Produits sélectionnés' },
      { nb: '4.8/5', label: 'Note moyenne' },
      { nb: '2 000+', label: 'Clients satisfaits' },
      { nb: '30 jours', label: 'Politique de retour' },
    ],
  },
  faq: { titre: 'Questions fréquentes', items: [
    { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables. Livraison standard 2-5 jours.' },
    { question: 'Puis-je retourner un article ?', reponse: 'Oui, sous 30 jours dans leur emballage original.' },
    { question: 'Quels modes de paiement ?', reponse: 'Visa, Mastercard, American Express et Apple Pay via Stripe.' },
    { question: 'Comment suivre ma commande ?', reponse: 'Un courriel avec numéro de suivi vous est envoyé dès expédition.' },
  ]},
  blog: { titre: 'Notre univers', afficherAuteur: true, afficherDate: true, colonnes: 3 },
  inscription: INSCRIPTION_DEF,
  contact: { titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !', adresse: '', telephone: '', courriel: '', afficherCarte: false, urlCarte: '' },
  footer: { nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée", couleurFond: '#050505', couleurTexte: '#ffffff', afficherPropulse: true, reseaux: { facebook: '', instagram: '', tiktok: '', twitter: '', youtube: '', linkedin: '', pinterest: '' }, colonnes: { titre1: 'Boutique', liens1: 'Accueil\nCatalogue\nBlog\nFAQ\nÀ propos', titre2: 'Aide', liens2: 'Contact\nRetours\nLivraison', titre3: 'Légal', liens3: 'Conditions\nConfidentialité' }, politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true } },
};

// ─── Composants UI ────────────────────────────────────────────────────────────
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
  const setCont = useCallback((patch: any) => setConfig((c: any) => ({ ...c, contact: { ...c.contact, ...patch } })), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config?.premium) setConfig({ ...DEF, ...data.config.premium, inscription: fusionInscription(data.config.premium.inscription) }); })
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
          <S titre="Popup promo">
            <Toggle label="Activer le popup de bienvenue" checked={config.afficherPopupPromo} onChange={(v: boolean) => set('afficherPopupPromo', v)} desc="S'affiche automatiquement 4 secondes après l'arrivée sur le site" />
            {config.afficherPopupPromo && <>
              <F label="Message du popup"><Inp value={config.popupPromoTexte} onChange={(v: string) => set('popupPromoTexte', v)} placeholder="Obtenez 10% de réduction..." /></F>
              <F label="Code promo à afficher"><Inp value={config.popupPromoCode} onChange={(v: string) => set('popupPromoCode', v)} placeholder="BIENVENUE10" /></F>
            </>}
          </S>
          <S titre="Fonctionnalités avancées">
            <Toggle label="Barre livraison gratuite" checked={config.afficherBarreLivraison} onChange={(v: boolean) => set('afficherBarreLivraison', v)} desc="Barre de progression dans le panier vers la livraison gratuite" />
            {config.afficherBarreLivraison && <F label="Seuil livraison gratuite ($)"><Inp type="number" value={config.seuilLivraisonGratuite} onChange={(v: string) => set('seuilLivraisonGratuite', parseFloat(v))} placeholder="100" /></F>}
            <Toggle label="Notification dernière vente" checked={config.afficherNotifVente} onChange={(v: boolean) => set('afficherNotifVente', v)} desc="Popup en bas à gauche — ex: Marie de Montréal a acheté la Montre..." />
            <Toggle label="Nombre de personnes qui regardent" checked={config.afficherNbVues} onChange={(v: boolean) => set('afficherNbVues', v)} desc="Affiche un compteur sur la fiche produit pour créer l'urgence" />
            <Toggle label="Wishlist (favoris)" checked={config.afficherWishlist} onChange={(v: boolean) => set('afficherWishlist', v)} desc="Bouton cœur sur les cartes produit et la fiche produit" />
            <Toggle label="Avis clients" checked={config.afficherAvis} onChange={(v: boolean) => set('afficherAvis', v)} desc="Étoiles, notes et commentaires sur les fiches produit" />
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
        </>
      );

      case 'a-propos': return (
        <>
          <S titre="Titres">
            <F label="Titre principal"><Inp value={config.aPropos.titre} onChange={(v: string) => setAP({ titre: v })} placeholder="À propos de nous" /></F>
            <F label="Sous-titre"><Inp value={config.aPropos.sousTitre} onChange={(v: string) => setAP({ sousTitre: v })} placeholder="Notre histoire" /></F>
          </S>
          <S titre="Sections">
            <Toggle label="Bloc valeurs (3 cartes)" checked={config.aPropos.afficherValeurs} onChange={(v: boolean) => setAP({ afficherValeurs: v })} />
            <Toggle label="Chiffres clés (4 statistiques)" checked={config.aPropos.afficherChiffres} onChange={(v: boolean) => setAP({ afficherChiffres: v })} />
            <Toggle label="Section équipe" checked={config.aPropos.afficherEquipe} onChange={(v: boolean) => setAP({ afficherEquipe: v })} />
            <Toggle label="Bouton CTA vers catalogue" checked={config.aPropos.afficherCta} onChange={(v: boolean) => setAP({ afficherCta: v })} />
          </S>
          <S titre="Nos valeurs">
            {config.aPropos.valeurs.map((v: any, i: number) => (
              <div key={i} style={{ border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Inp value={v.ico} onChange={(val: string) => { const arr = [...config.aPropos.valeurs]; arr[i] = { ...arr[i], ico: val }; setAP({ valeurs: arr }); }} placeholder="💎" />
                  <Inp value={v.titre} onChange={(val: string) => { const arr = [...config.aPropos.valeurs]; arr[i] = { ...arr[i], titre: val }; setAP({ valeurs: arr }); }} placeholder="Titre de la valeur" />
                </div>
                <Inp value={v.desc} onChange={(val: string) => { const arr = [...config.aPropos.valeurs]; arr[i] = { ...arr[i], desc: val }; setAP({ valeurs: arr }); }} placeholder="Description..." />
              </div>
            ))}
          </S>
          <S titre="Chiffres clés">
            {config.aPropos.chiffres.map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Inp value={c.nb} onChange={(val: string) => { const arr = [...config.aPropos.chiffres]; arr[i] = { ...arr[i], nb: val }; setAP({ chiffres: arr }); }} placeholder="500+" />
                <Inp value={c.label} onChange={(val: string) => { const arr = [...config.aPropos.chiffres]; arr[i] = { ...arr[i], label: val }; setAP({ chiffres: arr }); }} placeholder="Produits sélectionnés" />
              </div>
            ))}
          </S>
        </>
      );

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
            <Toggle label="Afficher Google Maps" checked={config.contact.afficherCarte} onChange={(v: boolean) => setCont({ afficherCarte: v })} />
            {config.contact.afficherCarte && <F label="URL de la carte"><Inp value={config.contact.urlCarte} onChange={(v: string) => setCont({ urlCarte: v })} placeholder="https://maps.google.com/..." /></F>}
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
            <Toggle label="Popup promo au chargement" checked={config.afficherPopupPromo} onChange={(v: boolean) => set('afficherPopupPromo', v)} desc="Apparaît après 4 secondes — idéal pour les codes promo" />
            <Toggle label="Notification dernière vente" checked={config.afficherNotifVente} onChange={(v: boolean) => set('afficherNotifVente', v)} desc="Popup en bas à gauche — crée de la preuve sociale" />
            <Toggle label="Compteur de vues en temps réel" checked={config.afficherNbVues} onChange={(v: boolean) => set('afficherNbVues', v)} desc="Affiche le nombre de personnes qui regardent le produit" />
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