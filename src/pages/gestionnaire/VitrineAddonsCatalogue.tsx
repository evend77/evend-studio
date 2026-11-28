// CHEMIN : src/pages/gestionnaire/VitrineAddonsCatalogue.tsx
// e-Vend Studio — Catalogue d'add-ons des sites VITRINE (intégré à « Mon plan & add-ons »).
// Même apparence que le catalogue multi-vendeur, mais système parallèle : pas de forfaits à paliers, donc pas d'add-on « inclus ».

import React, { useState, useMemo } from 'react';

export interface ItemVitrine {
  code: string;
  nom: string;
  description: string;
  emoji: string;
  categorie: string;
  prix_ht: number;
  revenu_partage: boolean;      // aucun frais : le gestionnaire touche une part des revenus
  guide_url?: string;
  actif: boolean;               // false = retiré par l'admin (visible seulement pour ceux qui l'ont déjà)
  achete: boolean;
}

// Thème sombre (même apparence que le dashboard acheteur)
const T = {
  accent: '#2d6a9f', accentLight: 'rgba(255,255,255,0.08)', bg: '#0b1226', border: 'rgba(255,255,255,0.1)', text: '#ffffff', textLight: 'rgba(255,255,255,0.55)',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626', purple: '#8b5cf6', canadaRed: '#d7141a',
};

const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const prixTexte = (it: ItemVitrine) => (it.prix_ht === 0 ? 'Gratuit' : $(it.prix_ht));
const periodeTexte = (it: ItemVitrine) => (it.prix_ht === 0 ? '' : '/mois');
const EMOJI_CATEGORIE: Record<string, string> = {
  'Branding': '🎨', 'Marketing & Promotions': '📣', 'Sécurité & Conformité': '🔒', 'Réservations': '📅',
  'Abonnements': '💳', 'Publicité & Revenus': '⭐', 'Statistiques': '📈', 'Support & Communication': '💬',
};
const emojiCat = (c: string) => EMOJI_CATEGORIE[c] || '🧩';

const MODAL = '#111c33';
const CARTE = 'rgba(255,255,255,0.04)';

interface Props {
  items: ItemVitrine[];
  busy: boolean;
  couleur: string;
  onBasculer: (it: ItemVitrine) => void;   // active (si inactif) ou désactive (si actif)
}

export default function VitrineAddonsCatalogue({ items, busy, couleur, onBasculer }: Props) {
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('toutes');
  const [detail, setDetail] = useState<ItemVitrine | null>(null);
  const [aActiver, setAActiver] = useState<ItemVitrine | null>(null);
  const [aDesactiver, setADesactiver] = useState<ItemVitrine | null>(null);

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.categorie))), [items]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items.filter(i => (filtre === 'toutes' || i.categorie === filtre) && (!q || i.nom.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)));
  }, [items, recherche, filtre]);

  const parCategorie = useMemo(() => {
    const g = new Map<string, ItemVitrine[]>();
    filtres.forEach(i => g.set(i.categorie, [...(g.get(i.categorie) || []), i]));
    return Array.from(g.entries());
  }, [filtres]);

  const nbActifs = items.filter(i => i.achete).length;

  const clic = (it: ItemVitrine) => { if (busy) return; if (it.achete) setADesactiver(it); else setAActiver(it); };

  const bouton = (it: ItemVitrine, grand = false): React.ReactElement => {
    const base: React.CSSProperties = { border: 'none', borderRadius: grand ? 10 : 8, padding: grand ? '14px 20px' : '8px 12px', fontSize: grand ? 15 : 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer', flex: 1, color: '#fff', fontFamily: 'inherit' };
    if (it.achete) return <button disabled={busy} onClick={() => clic(it)} style={{ ...base, background: T.success }}>✓ Actif</button>;
    return <button disabled={busy} onClick={() => clic(it)} style={{ ...base, background: couleur }}>{it.prix_ht === 0 ? 'Activer gratuit' : 'Activer'}</button>;
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 18, padding: '24px 24px', marginBottom: 24, color: T.text }}>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>🧩 Add-ons</h2>
      <p style={{ fontSize: 13, color: T.textLight, margin: '0 0 16px' }}>Ajoutez des fonctionnalités à votre site vitrine. Chaque add-on activé ajoute son menu sous VITRINE.</p>

      {/* Recherche + catégorie + compteurs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un add-on..."
          style={{ flex: 1, minWidth: 200, padding: '11px 14px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
        <select value={filtre} onChange={e => setFiltre(e.target.value)}
          style={{ padding: '11px 14px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, background: MODAL, color: '#fff', minWidth: 180, fontFamily: 'inherit' }}>
          <option value="toutes">Toutes les catégories</option>
          {categories.map(c => <option key={c} value={c}>{emojiCat(c)} {c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.textLight, flexWrap: 'wrap', marginBottom: 20 }}>
        <span>🧩 {items.length} add-on{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}</span>
        <span>✅ {nbActifs} actif{nbActifs > 1 ? 's' : ''}</span>
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
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>{cid}</h3>
              <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>{liste.length} add-on{liste.length > 1 ? 's' : ''} disponible{liste.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {liste.map(it => (
              <div key={it.code} style={{ background: CARTE, borderRadius: 16, border: `1px solid ${it.achete ? 'rgba(16,185,129,0.45)' : T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}`, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 30 }}>{it.categorie}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 26 }}>{it.emoji}</span>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>{it.nom}</h4>
                  </div>
                  <p style={{ fontSize: 12, color: T.textLight, margin: 0, lineHeight: 1.5 }}>{it.description.length > 90 ? it.description.slice(0, 90) + '...' : it.description}</p>
                </div>
                <div style={{ padding: '14px 18px 16px' }}>
                  <div style={{ marginBottom: 12 }}>
                    {it.revenu_partage ? (
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#6ee7b7' }}>Gratuit — revenu partagé</span>
                    ) : (
                      <><span style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{prixTexte(it)}</span><span style={{ fontSize: 12, color: T.textLight, marginLeft: 4 }}>{periodeTexte(it)}</span></>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {bouton(it)}
                    <button onClick={() => setDetail(it)}
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Voir détail</button>
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
          <div onClick={e => e.stopPropagation()} style={{ background: MODAL, border: `1px solid ${T.border}`, color: T.text, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '24px 28px', color: '#fff', background: `linear-gradient(135deg, ${T.accent}, ${T.purple})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 12 }}>{detail.categorie}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{detail.emoji}</span>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{detail.nom}</h2>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>
                    {detail.revenu_partage ? 'Gratuit — revenu partagé' : <>{prixTexte(detail)}<span style={{ fontSize: 15, fontWeight: 400, opacity: 0.8 }}>{periodeTexte(detail)}</span></>}
                  </div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 24px' }}>{detail.description}</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: 180 }}>{bouton(detail, true)}</div>
                {detail.guide_url && (
                  <a href={detail.guide_url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>📖 Guide</a>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.textLight, margin: '20px 0 0', textAlign: 'center' }}>
                {detail.revenu_partage ? 'Aucun frais : vous touchez une part des revenus générés par les publicités.' : 'Les frais sont facturés mensuellement en CAD et peuvent être résiliés à tout moment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation d'activation ── */}
      {aActiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: MODAL, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', color: T.text }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2436, #c9a96e)', padding: 28, color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{aActiver.emoji}</div>
              <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>Activer l'add-on</p>
              <p style={{ fontSize: 20, fontWeight: 900, margin: '0 0 14px' }}>{aActiver.nom}</p>
              {aActiver.prix_ht > 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '14px 20px', display: 'inline-block' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#c9a96e', lineHeight: 1 }}>{$(aActiver.prix_ht)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>/mois + taxes applicables (TPS/TVQ)</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 14, padding: '10px 24px', display: 'inline-block' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>Gratuit</div>
                </div>
              )}
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 0 14px' }}>
                En activant cet add-on, ses fonctionnalités seront <strong>immédiatement disponibles</strong> dans votre menu VITRINE.
              </p>
              {aActiver.prix_ht > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '14px 18px', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: '#fcd34d', margin: 0, lineHeight: 1.7 }}>
                    <strong>💳 Facturation :</strong> <strong>{$(aActiver.prix_ht)}/mois</strong> + taxes s'ajoutent à votre abonnement à chaque cycle de facturation.
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAActiver(null)} style={{ flex: 1, padding: 13, border: `1px solid ${T.border}`, borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'inherit' }}>Annuler</button>
                <button onClick={() => { const x = aActiver; setAActiver(null); setDetail(null); onBasculer(x); }}
                  style={{ flex: 1, padding: 13, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ {aActiver.prix_ht > 0 ? `Activer — ${$(aActiver.prix_ht)}` : 'Activer gratuitement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation de désactivation ── */}
      {aDesactiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: MODAL, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', color: T.text }}>
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '24px 28px', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 46, marginBottom: 8 }}>⚠️</div>
              <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Désactiver cet add-on ?</p>
              <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>{aDesactiver.nom}</p>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 0 12px' }}>
                En procédant, <strong>vous n'aurez plus accès aux fonctionnalités</strong> de cet add-on.
                <> Vos données sont <strong>conservées</strong> et réapparaîtront si vous le réactivez.</>
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => setADesactiver(null)} style={{ flex: 1, padding: 13, border: `1px solid ${T.border}`, borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'inherit' }}>Annuler</button>
                <button onClick={() => { const x = aDesactiver; setADesactiver(null); setDetail(null); onBasculer(x); }}
                  style={{ flex: 1, padding: 13, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔴 Désactiver</button>
              </div>
              <div style={{ marginTop: 16, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 12, color: '#fcd34d', margin: 0, lineHeight: 1.6 }}>
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