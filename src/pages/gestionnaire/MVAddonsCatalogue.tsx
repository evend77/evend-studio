// CHEMIN : src/pages/gestionnaire/MVAddonsCatalogue.tsx
// e-Vend Studio — Catalogue d'add-ons du gestionnaire Multi-Vendeur (intégré à « Mon plan & limites »).
// Remplace l'ancienne page « Branding & options » du menu multi-vendeur : une seule liste d'add-ons,
// avec recherche, catégories, « Voir détail » (modal + guide) et la règle « inclus au forfait = jamais facturé ».

import React, { useState, useMemo } from 'react';

export interface ItemAddon {
  cle: string;
  source: 'studio' | 'evend';
  code: string;
  nom: string;
  description: string;
  emoji: string;
  prix: number;                 // prix affiché (selon la période)
  periode: string;              // 'mois' | 'an' | 'gratuit' | 'variable'
  categorie_id: string;
  categorie_nom: string;
  categorie_emoji?: string;
  badges: string[];
  companie?: string | null;
  lien_documentation?: string | null;
  inclus: boolean;              // compris dans le forfait → 0,00 $
  achete: boolean;              // activé et facturé
  prix_facture: number;         // prix mensuel facturé (0 si inclus ou inactif)
}

const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', bg: '#f0f2f5', border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626', purple: '#8b5cf6', canadaRed: '#d7141a',
};

const EMOJI_EVEND: Record<string, string> = {
  'postes-canada': '🇨🇦', 'purolator': '🚚', 'canpar': '📦', 'expedition-gratuite': '🎁', 'fedex-canada': '✈️', 'ups-canada': '📫', 'dhl-canada': '🌍',
  'intelcom': '🚗', 'retrait-en-magasin': '🏬', 'shipstation': '🚢', 'sendle-canada': '🌱', 'poser-une-question': '❓', 'tags-categories-vendeur': '🏷️',
  'gestion-creneaux-horaires': '⏰', 'badges-vendeurs-clients': '🏅', 'affiliation-parrainage': '🤝', 'blog-vendeur': '📝', 'chat-vendeur-acheteur': '💬',
  'connexion-reseaux-sociaux': '🔑', 'personnel-administrateur': '👥', 'produit-global': '🌐', 'flux-de-produits': '📊', 'expiration-produits': '⏳',
  'marche-hyperlocal': '📍', 'assurance-transport': '🛡️', 'favoris-produits-vendeurs': '❤️', 'encheres-produits': '🔨', 'integration-zoho': '📈',
  'gestion-de-stock': '📦', 'tps-tvq-tvh': '🧾', 'produits-avec-reservation': '📅', 'offres-du-jour': '🔥', 'panier-divise': '🛒', 'zoom-meeting': '📹',
  'tarification-par-creneau': '⏱️', 'design-artiste': '🎨', 'options-personnalisees': '⚙️', 'payez-ce-que-vous-voulez': '💰', 'creneaux-de-livraison': '📅',
  'produits-en-lot': '📦', 'impression-a-la-demande': '🖨️', 'connecteur-shopify': '🛒', 'connecteur-woocommerce': '🐘', 'connecteur-etsy': '🧶',
  'connecteur-magento': '📈', 'connecteur-square': '💳', 'connecteur-lightspeed': '💡', 'connecteur-squarespace': '📐', 'connecteur-bigcommerce': '🏪',
  'connecteur-amazon': '🛍️', 'connecteur-ebay': '🏷️', 'stripe-connect': '💳', 'interac-online': '🏦', 'paybright': '💰', 'square-payments': '💳',
  'klaviyo-canada': '📧', 'whatsapp-canada': '💬', 'facebook-ads': '📣', 'google-ads': '🔍', 'avis-clients': '⭐', 'localisateur-magasin': '📍',
  'abonnements-stripe': '🔄', 'chat-gpt': '🤖', 'sauvegarde-base-donnees': '💾', 'filigrane': '💧', 'achats-groupes': '👥', 'pwa': '📱', 'alertes-sms': '📱',
  'inventaire-multi-emplacements': '📍', 'gestion-commandes-client': '📋', 'compliance-canada': '⚖️',
};
export const emojiEvend = (id: string) => EMOJI_EVEND[id] || '🧩';

const CATEGORIES_NOM: Record<string, string> = {
  gestionnaire: 'Gestionnaire', seller: 'Gestionnaire', product: 'Produit', shipping: 'Expédition', payment: 'Paiement',
  marketing: 'Marketing', connector: 'Connecteur', other: 'Autre',
};
const CATEGORIES_EMOJI: Record<string, string> = {
  shipping: '📦', gestionnaire: '👤', seller: '👤', product: '🛍️', connector: '🔌', payment: '💳', marketing: '📣', other: '⚙️', marketplace: '🏪',
};
export const nomCategorie = (id: string, nom?: string | null) => nom || CATEGORIES_NOM[id] || id;

const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const prixTexte = (it: ItemAddon) => (it.periode === 'gratuit' || it.prix === 0 ? 'Gratuit' : `${$(it.prix)}`);
const periodeTexte = (it: ItemAddon) => (it.periode === 'mois' ? '/mois' : it.periode === 'an' ? '/an' : '');

const Pastille = ({ b }: { b: string }) => {
  const m: Record<string, { t: string; c: string }> = {
    canada: { t: '🇨🇦 Canada', c: T.canadaRed }, exclusif: { t: '✨ Exclusif', c: T.purple }, populaire: { t: '⭐ Populaire', c: T.warning },
    gratuit: { t: '🎁 Gratuit', c: T.purple }, nouveau: { t: '🆕 Nouveau', c: T.success },
  };
  const x = m[b];
  return x ? <span style={{ background: x.c, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 30, textTransform: 'uppercase', letterSpacing: 0.5 }}>{x.t}</span> : null;
};

interface Props {
  items: ItemAddon[];
  busy: boolean;
  couleur: string;                       // couleur du forfait courant
  onBasculer: (it: ItemAddon) => void;   // active (si inactif) ou désactive (si acheté)
}

export default function MVAddonsCatalogue({ items, busy, couleur, onBasculer }: Props) {
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('toutes');
  const [detail, setDetail] = useState<ItemAddon | null>(null);
  const [aActiver, setAActiver] = useState<ItemAddon | null>(null);
  const [aDesactiver, setADesactiver] = useState<ItemAddon | null>(null);

  const categories = useMemo(() => {
    const m = new Map<string, { nom: string; emoji?: string }>();
    items.forEach(i => { if (!m.has(i.categorie_id)) m.set(i.categorie_id, { nom: i.categorie_nom, emoji: i.categorie_emoji }); });
    return Array.from(m.entries()).map(([id, c]) => ({ id, nom: c.nom, emoji: c.emoji }));
  }, [items]);
  const emojiCat = (id: string) => categories.find(c => c.id === id)?.emoji || CATEGORIES_EMOJI[id] || '📦';

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items.filter(i => (filtre === 'toutes' || i.categorie_id === filtre) && (!q || i.nom.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)));
  }, [items, recherche, filtre]);

  const parCategorie = useMemo(() => {
    const g = new Map<string, ItemAddon[]>();
    filtres.forEach(i => g.set(i.categorie_id, [...(g.get(i.categorie_id) || []), i]));
    return Array.from(g.entries());
  }, [filtres]);

  const nbActifs = items.filter(i => i.inclus || i.achete).length;
  const nbInclus = items.filter(i => i.inclus).length;

  const clic = (it: ItemAddon) => { if (it.inclus || busy) return; if (it.achete) setADesactiver(it); else setAActiver(it); };

  const bouton = (it: ItemAddon, grand = false): React.ReactElement => {
    const base: React.CSSProperties = { border: 'none', borderRadius: grand ? 10 : 8, padding: grand ? '14px 20px' : '8px 12px', fontSize: grand ? 15 : 12, fontWeight: 700, cursor: busy || it.inclus ? 'default' : 'pointer', flex: 1, color: '#fff', fontFamily: 'inherit' };
    if (it.inclus) return <div style={{ ...base, background: '#dcfce7', color: T.success, textAlign: 'center' }}>✅ Inclus dans votre forfait</div>;
    if (it.achete) return <button disabled={busy} onClick={() => clic(it)} style={{ ...base, background: T.success }}>✓ Actif</button>;
    return <button disabled={busy} onClick={() => clic(it)} style={{ ...base, background: couleur }}>{it.prix === 0 || it.periode === 'gratuit' ? 'Activer gratuit' : 'Activer'}</button>;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '22px 24px', marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', margin: '0 0 4px' }}>🧩 Add-ons</h2>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>Ajoutez des fonctionnalités à votre marketplace. Ceux déjà inclus dans votre forfait ne sont jamais facturés.</p>

      {/* Recherche + catégorie + compteurs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un add-on..."
          style={{ flex: 1, minWidth: 200, padding: '11px 14px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        <select value={filtre} onChange={e => setFiltre(e.target.value)}
          style={{ padding: '11px 14px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, background: '#fff', minWidth: 180, fontFamily: 'inherit' }}>
          <option value="toutes">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji || CATEGORIES_EMOJI[c.id] || '📦'} {c.nom}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.textLight, flexWrap: 'wrap', marginBottom: 20 }}>
        <span>🧩 {items.length} add-on{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}</span>
        <span>✅ {nbActifs} actif{nbActifs > 1 ? 's' : ''}</span>
        <span>🎁 {nbInclus} inclus dans votre forfait</span>
      </div>

      {parCategorie.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textLight }}>
          <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 8 }}>🔍</div>Aucun add-on ne correspond à votre recherche.
        </div>
      ) : parCategorie.map(([cid, liste]) => (
        <div key={cid} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{emojiCat(cid)}</div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>{liste[0].categorie_nom}</h3>
              <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>{liste.length} add-on{liste.length > 1 ? 's' : ''} disponible{liste.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {liste.map(it => (
              <div key={it.cle} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${it.inclus || it.achete ? '#bbf7d0' : T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}`, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ background: '#f3f4f6', color: T.textLight, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 30 }}>{it.categorie_nom}</span>
                    {it.badges.map(b => <Pastille key={b} b={b} />)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 26 }}>{it.emoji}</span>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>{it.nom}</h4>
                  </div>
                  <p style={{ fontSize: 12, color: T.textLight, margin: 0, lineHeight: 1.5 }}>{it.description.length > 90 ? it.description.slice(0, 90) + '...' : it.description}</p>
                </div>
                <div style={{ padding: '14px 18px 16px' }}>
                  <div style={{ marginBottom: 12 }}>
                    {it.inclus ? (
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.success }}>Inclus <span style={{ textDecoration: 'line-through', color: '#aaa', fontWeight: 500, fontSize: 12 }}>{prixTexte(it)}{periodeTexte(it)}</span></span>
                    ) : (
                      <><span style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{prixTexte(it)}</span><span style={{ fontSize: 12, color: T.textLight, marginLeft: 4 }}>{periodeTexte(it)}</span></>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {bouton(it)}
                    <button onClick={() => setDetail(it)}
                      style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Voir détail</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Modal détail ── */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 28px', color: '#fff', background: detail.badges.includes('canada') ? `linear-gradient(135deg, ${T.canadaRed}, ${T.accent})` : `linear-gradient(135deg, ${T.accent}, ${T.purple})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 12 }}>{detail.categorie_nom}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{detail.emoji}</span>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{detail.nom}</h2>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>
                    {detail.inclus ? 'Inclus dans votre forfait' : <>{prixTexte(detail)}<span style={{ fontSize: 15, fontWeight: 400, opacity: 0.8 }}>{periodeTexte(detail)}</span></>}
                  </div>
                  {detail.companie && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.9 }}>Par {detail.companie}</div>}
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <p style={{ fontSize: 15, color: T.text, lineHeight: 1.6, margin: '0 0 24px' }}>{detail.description}</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: 180 }}>{bouton(detail, true)}</div>
                {detail.lien_documentation && (
                  <a href={detail.lien_documentation} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '14px 20px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>📖 Guide</a>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.textLight, margin: '20px 0 0', textAlign: 'center' }}>
                {detail.inclus ? 'Cet add-on est compris dans votre forfait : aucun frais supplémentaire.' : 'Les frais sont facturés mensuellement en CAD et peuvent être résiliés à tout moment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation d'activation ── */}
      {aActiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2436, #c9a96e)', padding: 28, color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{aActiver.emoji}</div>
              <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>Activer l'add-on</p>
              <p style={{ fontSize: 20, fontWeight: 900, margin: '0 0 14px' }}>{aActiver.nom}</p>
              {aActiver.prix > 0 && aActiver.periode !== 'gratuit' ? (
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '14px 20px', display: 'inline-block' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#c9a96e', lineHeight: 1 }}>{$(aActiver.prix)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{aActiver.periode === 'an' ? '/an' : '/mois'} + taxes applicables (TPS/TVQ)</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 14, padding: '10px 24px', display: 'inline-block' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>Gratuit</div>
                </div>
              )}
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, margin: '0 0 14px' }}>
                En activant cet add-on, ses fonctionnalités seront <strong>immédiatement disponibles</strong> pour vous et vos collaborateurs.
              </p>
              {aActiver.prix_facture > 0 && (
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 18px', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.7 }}>
                    <strong>💳 Facturation :</strong> <strong>{$(aActiver.prix_facture)}/mois</strong> + taxes s'ajoutent à votre forfait à chaque cycle de facturation.
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAActiver(null)} style={{ flex: 1, padding: 13, border: `1px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#4b5563', fontFamily: 'inherit' }}>Annuler</button>
                <button onClick={() => { const x = aActiver; setAActiver(null); setDetail(null); onBasculer(x); }}
                  style={{ flex: 1, padding: 13, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ {aActiver.prix > 0 && aActiver.periode !== 'gratuit' ? `Activer — ${$(aActiver.prix)}` : 'Activer gratuitement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation de désactivation ── */}
      {aDesactiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '24px 28px', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 46, marginBottom: 8 }}>⚠️</div>
              <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Désactiver cet add-on ?</p>
              <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>{aDesactiver.nom}</p>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, margin: '0 0 12px' }}>
                En procédant, <strong>vous et vos collaborateurs n'aurez plus accès aux fonctionnalités</strong> de cet add-on.
                {aDesactiver.source === 'evend' && <> Les données associées pour vos collaborateurs peuvent être <strong>supprimées</strong>.</>}
                {aDesactiver.source === 'studio' && <> Vos données sont <strong>conservées</strong> et réapparaîtront si vous le réactivez.</>}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => setADesactiver(null)} style={{ flex: 1, padding: 13, border: `1px solid ${T.border}`, borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#4b5563', fontFamily: 'inherit' }}>Annuler</button>
                <button onClick={() => { const x = aDesactiver; setADesactiver(null); setDetail(null); onBasculer(x); }}
                  style={{ flex: 1, padding: 13, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔴 Désactiver</button>
              </div>
              <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  <strong>📋 Facturation :</strong> il ne sera plus facturé au prochain cycle. Le solde du mois en cours n'est pas remboursable.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}