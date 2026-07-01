// src/pages/acheteur/Panier.tsx
// Panier acheteur e-Vend — Design WOW premium beige/crème inspiré Amazon + Shopify

import { useState, useEffect } from "react";

const API_BASE = "https://evend-multivendeur-api.onrender.com/api";
const MINIMUM_GLOBAL = 10;

interface ArticlePanier {
  id: number;
  produit_shopify_id: string;
  titre: string;
  image_url: string;
  prix: number;
  quantite: number;
  vendeur_id: number;
  vendeur_nom: string;
  minimum_commande?: number;
}

interface GroupeVendeur {
  vendeur_id: number;
  vendeur_nom: string;
  articles: ArticlePanier[];
  sous_total: number;
  minimum: number;
}

interface ArticlePlusTard {
  id: number;
  produit_shopify_id: string;
  titre: string;
  image_url: string;
  prix: number;
  vendeur_id: number;
  vendeur_nom: string;
  created_at: string;
}

interface PanierProps {
  naviguer: (page: string, props?: any) => void;
}

// ── HOOK MOBILE ──────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Panier({ naviguer }: PanierProps) {
  const isMobile = useIsMobile();
  const [groupes, setGroupes] = useState<GroupeVendeur[]>([]);
  const [plusTard, setPlusTard] = useState<ArticlePlusTard[]>([]);
  const [vendeurSelectionne, setVendeurSelectionne] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCoursQte, setEnCoursQte] = useState<number | null>(null);
  const [enCoursSup, setEnCoursSup] = useState<number | null>(null);
  const [enCoursPlusTard, setEnCoursPlusTard] = useState<number | null>(null);
  const [enCoursRemettre, setEnCoursRemettre] = useState<number | null>(null);
  const [viderConfirm, setViderConfirm] = useState(false);
  const [banniereMultiOuverte, setBanniereMultiOuverte] = useState(false);
  const [banniereMinOuverte, setBanniereMinOuverte] = useState(false);
  // ✅ Token lu à chaque fetch — jamais figé au montage
  const getToken = () => localStorage.getItem("token");

  useEffect(() => { fetchPanier(); fetchPlusTard(); }, []);

  async function fetchPlusTard() {
    try {
      const res = await fetch(`${API_BASE}/panier/plus-tard`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPlusTard(data.articles || []);
    } catch {}
  }

  async function mettreDeCote(articleId: number) {
    setEnCoursPlusTard(articleId);
    try {
      await fetch(`${API_BASE}/panier/${articleId}/plus-tard`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await fetchPanier();
      await fetchPlusTard();
    } finally {
      setEnCoursPlusTard(null);
    }
  }

  async function remettreDansPanier(articleId: number) {
    setEnCoursRemettre(articleId);
    try {
      await fetch(`${API_BASE}/panier/plus-tard/${articleId}/remettre`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await fetchPanier();
      await fetchPlusTard();
    } finally {
      setEnCoursRemettre(null);
    }
  }

  async function supprimerPlusTard(articleId: number) {
    await fetch(`${API_BASE}/panier/plus-tard/${articleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchPlusTard();
  }

  async function fetchPanier() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/panier`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Impossible de charger le panier");
      const data = await res.json();
      const g = grouperParVendeur(data.articles || []);
      setGroupes(g);
      // Sélectionner le premier vendeur par défaut
      if (g.length > 0) {
        setVendeurSelectionne(prev => prev !== null && g.find(x => x.vendeur_id === prev) ? prev : g[0].vendeur_id);
      }
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  function grouperParVendeur(articles: ArticlePanier[]): GroupeVendeur[] {
    const map = new Map<number, GroupeVendeur>();
    for (const a of articles) {
      if (!map.has(a.vendeur_id)) {
        map.set(a.vendeur_id, {
          vendeur_id: a.vendeur_id,
          vendeur_nom: a.vendeur_nom,
          articles: [],
          sous_total: 0,
          minimum: a.minimum_commande || MINIMUM_GLOBAL,
        });
      }
      const g = map.get(a.vendeur_id)!;
      g.articles.push(a);
      g.sous_total += parseFloat(String(a.prix)) * a.quantite;
    }
    return Array.from(map.values());
  }

  async function modifierQte(id: number, qte: number) {
    if (qte < 1) return;
    setEnCoursQte(id);
    try {
      await fetch(`${API_BASE}/panier/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ quantite: qte }),
      });
      await fetchPanier();
    } finally {
      setEnCoursQte(null);
    }
  }

  async function supprimer(id: number) {
    setEnCoursSup(id);
    try {
      await fetch(`${API_BASE}/panier/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await fetchPanier();
    } finally {
      setEnCoursSup(null);
    }
  }

  async function viderPanier() {
    await fetch(`${API_BASE}/panier`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setGroupes([]);
    setViderConfirm(false);
  }

  // Groupe du vendeur sélectionné
  const groupeSelectionne = groupes.find(g => g.vendeur_id === vendeurSelectionne) || null;
  const totalArticles = groupes.reduce((s, g) => s + g.articles.reduce((a, ar) => a + ar.quantite, 0), 0);
  const totalGlobal = groupes.reduce((s, g) => s + g.sous_total, 0);
  const totalSelectionne = groupeSelectionne?.sous_total || 0;
  const articlesSelectionnes = groupeSelectionne?.articles.reduce((s, a) => s + a.quantite, 0) || 0;
  const multiVendeurs = groupes.length > 1;
  const sousMinimumGlobal = totalSelectionne < MINIMUM_GLOBAL && articlesSelectionnes > 0;
  const vendeurSousMinimum = groupeSelectionne && groupeSelectionne.sous_total < groupeSelectionne.minimum ? groupeSelectionne : null;
  const peutPayer = !sousMinimumGlobal && !vendeurSousMinimum && articlesSelectionnes > 0;

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={s.loadingWrap}>
        <div style={s.spinnerOuter}>
          <div style={s.spinner} />
        </div>
        <p style={s.loadingTxt}>Chargement de votre panier...</p>
        <p style={s.loadingSubTxt}>Recuperation de vos articles en cours</p>
      </div>
    </div>
  );

  // ── ERREUR ───────────────────────────────────────────────────────────────
  if (erreur) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={s.erreurWrap}>
        <div style={s.erreurIcone}>⚠️</div>
        <h2 style={s.erreurTitre}>Impossible de charger le panier</h2>
        <p style={s.erreurDesc}>{erreur}</p>
        <button style={s.btnReessayer} onClick={fetchPanier}>Reessayer</button>
      </div>
    </div>
  );

  // ── PANIER VIDE ──────────────────────────────────────────────────────────
  if (totalArticles === 0) return (
    <div style={s.page}>
      <style>{CSS}</style>
      <div style={s.videWrap}>
        <div style={s.videIllustration}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" fill="#fef9ee" stroke="#e7d5b8" strokeWidth="1.5"/>
            <path d="M35 42h8l6 28h26l6-21H45" stroke="#d4a853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="55" cy="76" r="3.5" fill="#d4a853"/>
            <circle cx="73" cy="76" r="3.5" fill="#d4a853"/>
            <path d="M60 30v8M54 33l6 5 6-5" stroke="#e7d5b8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={s.videTitre}>Votre panier est vide</h2>
        <p style={s.videDesc}>
          Vous n avez aucun article dans votre panier pour le moment.<br/>
          Decouvrez nos produits et commencez vos achats !
        </p>
        <button className="btn-decouvrir" style={s.btnDecouvrir} onClick={() => naviguer("catalogue")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Decouvrir les produits
        </button>
        <button style={s.btnVideContinuer} onClick={() => naviguer("dashboard")}>
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  // ── PANIER PRINCIPAL ─────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{CSS}</style>

      {/* Popup confirmation vider */}
      {viderConfirm && (
        <>
          <div style={s.overlay} onClick={() => setViderConfirm(false)} />
          <div style={s.popupConfirm}>
            <div style={s.popupIcone}>🗑️</div>
            <h3 style={s.popupTitre}>Vider le panier ?</h3>
            <p style={s.popupDesc}>Tous vos articles seront supprimes. Cette action est irreversible.</p>
            <div style={s.popupBtns}>
              <button style={s.popupBtnAnnuler} onClick={() => setViderConfirm(false)}>Annuler</button>
              <button style={s.popupBtnConfirmer} onClick={viderPanier}>Oui, vider</button>
            </div>
          </div>
        </>
      )}

      {/* ── EN-TÊTE ── */}
      <div style={{ ...s.topBar, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div style={s.topBarLeft}>
          <div style={s.topBarIcone}>🛒</div>
          <div>
            <h1 style={s.pageTitre}>Mon panier</h1>
            <p style={s.pageSousTitre}>
              {totalArticles} article{totalArticles > 1 ? "s" : ""} · {groupes.length} vendeur{groupes.length > 1 ? "s" : ""}
              {multiVendeurs && (
                <span style={{ color: "#b47828", fontWeight: 600 }}>
                  {" "}· Sélectionnez un vendeur pour passer à la caisse
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={s.topBarActions}>
          <button style={s.btnRetour} onClick={() => naviguer("catalogue")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            Continuer les achats
          </button>
          <button className="btn-vider" style={s.btnVider} onClick={() => setViderConfirm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Vider le panier
          </button>
        </div>
      </div>

      {/* ── BANNIÈRES ── */}
      <div style={s.bannieres}>
        {/* Info multi-vendeurs */}
        {multiVendeurs && (
          <div style={{ ...s.banniere, background: "#fffbeb", borderColor: "#fde68a", cursor: isMobile ? 'pointer' : 'default' }}
            onClick={() => isMobile && setBanniereMultiOuverte(o => !o)}>
            <div style={{ ...s.banniereIconeWrap, background: "#fef3c7" }}>
              <span style={{ fontSize: "20px" }}>💡</span>
            </div>
            <div style={s.banniereContent}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={s.banniereTitre}>Vous avez des articles de {groupes.length} vendeurs différents</p>
                {isMobile && <span style={{ fontSize: "12px", color: "#92400e", flexShrink: 0, marginLeft: '8px' }}>{banniereMultiOuverte ? '▲' : '▼'}</span>}
              </div>
              {(!isMobile || banniereMultiOuverte) && (
                <p style={s.banniereDesc}>
                  Chaque vendeur traite sa commande séparément. <strong>Sélectionnez un vendeur</strong> en cliquant sur son encadré pour passer à la caisse. Les articles des autres vendeurs restent dans votre panier pour un prochain achat.
                </p>
              )}
            </div>
            {!isMobile && <div style={{ ...s.banniereBadge, background: "#fde68a", color: "#92400e" }}>
              {groupes.length} vendeurs
            </div>}
          </div>
        )}

        {/* Minimum du vendeur sélectionné */}
        {groupeSelectionne && (
          <div style={{ ...s.banniere, ...(sousMinimumGlobal ? s.banniereWarn : s.banniereSuccess), cursor: isMobile ? 'pointer' : 'default' }}
            onClick={() => isMobile && setBanniereMinOuverte(o => !o)}>
            <div style={{ ...s.banniereIconeWrap, background: sousMinimumGlobal ? "#fef3c7" : "#dcfce7" }}>
              <span style={{ fontSize: "20px" }}>{sousMinimumGlobal ? "⚠️" : "✅"}</span>
            </div>
            <div style={s.banniereContent}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ ...s.banniereTitre, fontSize: isMobile ? '13px' : '14px' }}>
                  {sousMinimumGlobal ? "Commande minimum non atteinte" : "Commande minimum atteinte"}
                  {" "}— {groupeSelectionne.vendeur_nom}
                </p>
                {isMobile && <span style={{ fontSize: "12px", color: sousMinimumGlobal ? "#92400e" : "#166534", flexShrink: 0, marginLeft: '8px' }}>{banniereMinOuverte ? '▲' : '▼'}</span>}
              </div>
              {(!isMobile || banniereMinOuverte) && (
                <p style={s.banniereDesc}>
                  {sousMinimumGlobal
                    ? `Minimum requis : ${MINIMUM_GLOBAL.toFixed(2)} $. Il vous manque ${(MINIMUM_GLOBAL - totalSelectionne).toFixed(2)} $ pour passer à la caisse.`
                    : `Votre sélection de ${totalSelectionne.toFixed(2)} $ dépasse le minimum requis. Vous pouvez procéder au paiement.`}
                </p>
              )}
            </div>
            {!isMobile && <div style={{ ...s.banniereBadge, background: sousMinimumGlobal ? "#fde68a" : "#86efac", color: sousMinimumGlobal ? "#92400e" : "#166534" }}>
              Min. {MINIMUM_GLOBAL.toFixed(2)} $
            </div>}
          </div>
        )}
      </div>

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ ...s.layout, gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined }}>

        {/* ── COLONNE ARTICLES ── */}
        <div style={s.colArticles}>
          {groupes.map((groupe, gIdx) => {
            const estSelectionne = vendeurSelectionne === groupe.vendeur_id;
            const sousMini = estSelectionne && groupe.sous_total < groupe.minimum;
            const pct = Math.min(100, (groupe.sous_total / groupe.minimum) * 100);

            return (
              <div
                key={groupe.vendeur_id}
                style={{
                  ...s.groupeCard,
                  border: estSelectionne
                    ? "2px solid #b47828"
                    : "2px solid #e7d5b8",
                  boxShadow: estSelectionne
                    ? "0 0 0 4px rgba(180,120,40,0.12), 0 4px 20px rgba(180,120,40,0.15)"
                    : "0 1px 4px rgba(0,0,0,0.04)",
                  opacity: estSelectionne || groupes.length === 1 ? 1 : 0.55,
                  transition: "all 0.25s",
                }}
              >
                {/* Header vendeur — cliquable pour sélectionner */}
                <div
                  style={{
                    ...s.groupeHeader,
                    cursor: multiVendeurs ? "pointer" : "default",
                    background: estSelectionne
                      ? "linear-gradient(to right, #fef3c7, #fde68a)"
                      : "linear-gradient(to right, #fef9ee, #fef3c7)",
                    padding: isMobile ? "12px 14px" : "18px 24px",
                    gap: isMobile ? "10px" : "14px",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                  onClick={() => multiVendeurs && setVendeurSelectionne(groupe.vendeur_id)}
                >
                  {/* Ligne du haut: checkbox + avatar + nom + badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
                    {/* Checkbox */}
                    {multiVendeurs && (
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "7px", flexShrink: 0,
                        border: estSelectionne ? "2px solid #b47828" : "2px solid #d4a853",
                        background: estSelectionne ? "linear-gradient(135deg, #d4a853, #b47828)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: estSelectionne ? "0 2px 8px rgba(180,120,40,0.3)" : "none",
                        transition: "all 0.2s",
                      }}>
                        {estSelectionne && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    )}
                    {/* Avatar */}
                    <div style={s.vendeurAvatarWrap}>
                      <div style={{ ...s.vendeurAvatar, width: isMobile ? "36px" : "44px", height: isMobile ? "36px" : "44px", fontSize: isMobile ? "12px" : "14px", background: estSelectionne ? "linear-gradient(135deg, #b47828, #92400e)" : "linear-gradient(135deg, #d4a853, #b47828)" }}>
                        {groupe.vendeur_nom.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={s.vendeurOnline} />
                    </div>
                    {/* Nom + badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                        <p style={{ ...s.vendeurNom, fontSize: isMobile ? "14px" : "16px", margin: 0 }}>{groupe.vendeur_nom}</p>
                        <span style={{ ...s.vendeurBadgeVerifie, fontSize: "10px" }}>✓ Vérifié</span>
                        {estSelectionne && (
                          <span style={{ fontSize: "10px", background: "#b47828", color: "#fff", padding: "2px 7px", borderRadius: "20px", fontWeight: 700 }}>✓ Sélectionné</span>
                        )}
                      </div>
                      <p style={{ ...s.vendeurStats, fontSize: isMobile ? "12px" : "13px" }}>
                        {groupe.articles.length} article{groupe.articles.length > 1 ? "s" : ""} &nbsp;·&nbsp;
                        <strong style={{ color: sousMini ? "#dc2626" : "#b47828" }}>{groupe.sous_total.toFixed(2)} $</strong>
                        {!estSelectionne && multiVendeurs && !isMobile && (
                          <span style={{ color: "#a8926a", marginLeft: "8px", fontSize: "11px" }}>— Cliquez pour sélectionner</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Badge min — pleine largeur sur mobile en dessous */}
                  {sousMini ? (
                    <div style={{ ...s.badgeMini, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Min. {groupe.minimum.toFixed(2)} $
                    </div>
                  ) : (
                    <div style={{ ...s.badgeOk, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Minimum atteint
                    </div>
                  )}
                </div>

                {/* Barre progression minimum vendeur */}
                {sousMini && (
                  <div style={s.progressWrap}>
                    <div style={s.progressHeader}>
                      <span style={s.progressLabel}>
                        Progression vers le minimum de commande ({groupe.minimum.toFixed(2)} $)
                      </span>
                      <span style={s.progressPct}>{Math.round(pct)}%</span>
                    </div>
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${pct}%` }} />
                    </div>
                    <p style={s.progressNote}>
                      Ajoutez encore <strong>{(groupe.minimum - groupe.sous_total).toFixed(2)} $</strong> d articles de {groupe.vendeur_nom} pour debloquer la caisse.
                    </p>
                  </div>
                )}

                {/* Liste des articles */}
                <div style={s.articlesListe}>
                  {groupe.articles.map((article, aIdx) => (
                    <div
                      key={article.id}
                      className="article-row"
                      style={isMobile ? {
                        display: "flex", flexDirection: "column", gap: "0",
                        padding: "0", background: "#fff",
                        borderBottom: aIdx < groupe.articles.length - 1 ? "1px solid #f0e6d3" : "none",
                      } : {
                        ...s.articleRow,
                        borderBottom: aIdx < groupe.articles.length - 1 ? "1px solid #f0e6d3" : "none",
                      }}
                    >
                      {isMobile ? (
                        <>
                          {/* MOBILE: image + infos + boutons en ligne */}
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px" }}>
                            <a href={`https://evend-multivendeur-api.onrender.com/produit/${article.produit_shopify_id}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: "block", width: "76px", height: "76px", flexShrink: 0 }}>
                              {article.image_url
                                ? <img src={article.image_url} alt={article.titre} style={{ ...s.img, width: "76px", height: "76px" }} />
                                : <div style={s.imgPlaceholder}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a853" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                              }
                            </a>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1c1917", margin: "0 0 4px", lineHeight: 1.4 }}>{article.titre}</p>
                              <span style={s.articleVendeurTag}>Vendu par {article.vendeur_nom}</span>
                              <p style={{ fontSize: "15px", fontWeight: 700, color: "#b47828", margin: "6px 0 2px" }}>{parseFloat(String(article.prix)).toFixed(2)} $ / unité</p>
                              <p style={{ fontSize: "14px", fontWeight: 800, color: "#1c1917", margin: 0 }}>
                                Total : {(parseFloat(String(article.prix)) * article.quantite).toFixed(2)} $
                                {article.quantite > 1 && <span style={{ fontSize: "11px", color: "#a8926a", fontWeight: 400, marginLeft: "4px" }}>{article.quantite}×</span>}
                              </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                              <button className="btn-plus-tard" style={{ ...s.btnPlusTard, opacity: enCoursPlusTard === article.id ? 0.5 : 1 }}
                                onClick={() => mettreDeCote(article.id)} disabled={enCoursPlusTard === article.id} title="Plus tard">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                              </button>
                              <button className="btn-suppr" style={{ ...s.btnSupprimer, opacity: enCoursSup === article.id ? 0.5 : 1 }}
                                onClick={() => supprimer(article.id)} disabled={enCoursSup === article.id} title="Supprimer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                              </button>
                            </div>
                          </div>
                          {/* Barre quantité mobile */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fef9ee", padding: "10px 16px", borderTop: "1px solid #f0e6d3" }}>
                            <span style={{ fontSize: "13px", color: "#a8926a", fontWeight: 600 }}>Quantité</span>
                            <div style={s.qteControle}>
                              <button className="btn-qte" style={{ ...s.btnQte, opacity: enCoursQte === article.id || article.quantite <= 1 ? 0.4 : 1 }}
                                onClick={() => modifierQte(article.id, article.quantite - 1)} disabled={enCoursQte === article.id || article.quantite <= 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                              <div style={s.qteAffichage}>{enCoursQte === article.id ? <div style={s.qteMiniSpinner}/> : <span style={s.qteVal}>{article.quantite}</span>}</div>
                              <button className="btn-qte" style={{ ...s.btnQte, opacity: enCoursQte === article.id ? 0.4 : 1 }}
                                onClick={() => modifierQte(article.id, article.quantite + 1)} disabled={enCoursQte === article.id}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* DESKTOP: image cliquable */}
                          <div style={s.imgContainer}>
                            <a href={`https://evend-multivendeur-api.onrender.com/produit/${article.produit_shopify_id}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: "block", width: "100%", height: "100%" }}>
                              {article.image_url
                                ? <img src={article.image_url} alt={article.titre} style={s.img}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
                                : <div style={s.imgPlaceholder}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a853" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                              }
                            </a>
                          </div>
                          {/* Infos produit */}
                          <div style={s.articleInfos}>
                            <p style={s.articleTitre}>{article.titre}</p>
                            <div style={s.articleMeta}><span style={s.articleVendeurTag}>Vendu par {article.vendeur_nom}</span></div>
                            <div style={s.articlePrixWrap}>
                              <span style={s.articlePrixUnit}>{parseFloat(String(article.prix)).toFixed(2)} $</span>
                              <span style={s.articlePrixUnitLabel}>/ unité</span>
                            </div>
                          </div>
                        </>
                      )}
                                            {/* Controles quantite — desktop seulement */}
                      <div style={{ ...s.qteSection, display: isMobile ? "none" : undefined }}>
                        <p style={s.qteLabel}>Quantite</p>
                        <div style={s.qteControle}>
                          <button
                            className="btn-qte"
                            style={{
                              ...s.btnQte,
                              opacity: enCoursQte === article.id || article.quantite <= 1 ? 0.4 : 1,
                            }}
                            onClick={() => modifierQte(article.id, article.quantite - 1)}
                            disabled={enCoursQte === article.id || article.quantite <= 1}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                          <div style={s.qteAffichage}>
                            {enCoursQte === article.id ? (
                              <div style={s.qteMiniSpinner} />
                            ) : (
                              <span style={s.qteVal}>{article.quantite}</span>
                            )}
                          </div>
                          <button
                            className="btn-qte"
                            style={{
                              ...s.btnQte,
                              opacity: enCoursQte === article.id ? 0.4 : 1,
                            }}
                            onClick={() => modifierQte(article.id, article.quantite + 1)}
                            disabled={enCoursQte === article.id}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Sous-total article — desktop seulement */}
                      <div style={{ ...s.articleTotal, display: isMobile ? "none" : undefined }}>
                        <p style={s.articleTotalLabel}>Total</p>
                        <p style={s.articleTotalMontant}>
                          {(parseFloat(String(article.prix)) * article.quantite).toFixed(2)} $
                        </p>
                        {article.quantite > 1 && (
                          <p style={s.articleTotalDetail}>
                            {article.quantite} x {parseFloat(String(article.prix)).toFixed(2)} $
                          </p>
                        )}
                      </div>

                      {/* Boutons actions — desktop seulement */}
                      {!isMobile && <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                        {/* Mettre de côté */}
                        <div style={s.supprimerWrap}>
                          <button
                            className="btn-plus-tard"
                            style={{
                              ...s.btnPlusTard,
                              opacity: enCoursPlusTard === article.id ? 0.5 : 1,
                            }}
                            onClick={() => mettreDeCote(article.id)}
                            disabled={enCoursPlusTard === article.id}
                            title="Mettre de côté pour plus tard"
                          >
                            {enCoursPlusTard === article.id ? (
                              <div style={s.qteMiniSpinner} />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                              </svg>
                            )}
                          </button>
                          <span style={{ ...s.supprimerLabel, color: "#92400e" }}>+ Tard</span>
                        </div>

                        {/* Supprimer */}
                        <div style={s.supprimerWrap}>
                          <button
                            className="btn-suppr"
                            style={{
                              ...s.btnSuppr,
                              opacity: enCoursSup === article.id ? 0.5 : 1,
                            }}
                            onClick={() => supprimer(article.id)}
                            disabled={enCoursSup === article.id}
                            title="Supprimer cet article"
                          >
                            {enCoursSup === article.id ? (
                              <div style={s.qteMiniSpinner} />
                            ) : (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            )}
                          </button>
                          <span style={s.supprimerLabel}>Retirer</span>
                        </div>
                      </div>}
                    </div>
                  ))}
                </div>

                {/* Footer sous-total vendeur */}
                <div style={s.groupeFooter}>
                  <div style={s.groupeFooterLeft}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8926a" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <span style={s.groupeFooterLabel}>Sous-total {groupe.vendeur_nom}</span>
                  </div>
                  <span style={{ ...s.groupeFooterMontant, color: sousMini ? "#dc2626" : "#b47828" }}>
                    {groupe.sous_total.toFixed(2)} $ CAD
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── COLONNE RÉCAPITULATIF ── */}
        <div style={{ ...s.colRecap, position: isMobile ? "relative" : "sticky", top: isMobile ? "auto" : "20px" }}>

          {/* Carte récapitulatif */}
          <div style={s.recapCard}>
            <h2 style={s.recapTitre}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b47828" strokeWidth="2"><path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"/><path d="M18 2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
              Récapitulatif de commande
            </h2>

            {/* Vendeur sélectionné */}
            {groupeSelectionne ? (
              <div style={{ background: "#fef9ee", border: "1px solid #e7d5b8", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#b47828", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ✓ Vendeur sélectionné
                  </span>
                  <span style={{ fontSize: "12px", color: "#a8926a" }}>{articlesSelectionnes} article{articlesSelectionnes > 1 ? "s" : ""}</span>
                </div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#1c1917", margin: "0 0 2px" }}>{groupeSelectionne.vendeur_nom}</p>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#b47828", margin: 0 }}>{totalSelectionne.toFixed(2)} $ CAD</p>
              </div>
            ) : (
              <div style={{ background: "#f3f4f6", borderRadius: "10px", padding: "12px", marginBottom: "14px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#78716c", margin: 0 }}>Aucun vendeur sélectionné</p>
              </div>
            )}

            {/* Autres vendeurs non sélectionnés */}
            {multiVendeurs && (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#a8926a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
                  Restent dans le panier
                </p>
                {groupes.filter(g => g.vendeur_id !== vendeurSelectionne).map(g => (
                  <div key={g.vendeur_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", opacity: 0.6 }}>
                    <span style={{ fontSize: "13px", color: "#78716c" }}>{g.vendeur_nom}</span>
                    <span style={{ fontSize: "13px", color: "#78716c" }}>{g.sous_total.toFixed(2)} $</span>
                  </div>
                ))}
              </div>
            )}

            <div style={s.recapSeparateur} />

            {/* Lignes calcul */}
            <div style={s.recapLigneCalc}>
              <span style={s.recapCalcLabel}>Sous-total sélectionné</span>
              <span style={s.recapCalcValeur}>{totalSelectionne.toFixed(2)} $</span>
            </div>
            <div style={s.recapLigneCalc}>
              <span style={s.recapCalcLabel}>Frais de livraison</span>
              <span style={{ ...s.recapCalcValeur, color: "#16a34a" }}>Calculés à l'étape suivante</span>
            </div>
            <div style={s.recapLigneCalc}>
              <span style={s.recapCalcLabel}>Taxes (TPS/TVQ)</span>
              <span style={{ ...s.recapCalcValeur, color: "#78716c" }}>Calculées à l'étape suivante</span>
            </div>

            <div style={s.recapTotalWrap}>
              <div style={s.recapTotalLigne}>
                <span style={s.recapTotalLabel}>Total estimé</span>
                <div>
                  <span style={s.recapTotalMontant}>{totalSelectionne.toFixed(2)} $</span>
                  <span style={s.recapTotalDevise}> CAD</span>
                </div>
              </div>
              <p style={s.recapTotalNote}>Avant taxes et livraison</p>
            </div>

            {/* Raisons blocage */}
            {!peutPayer && articlesSelectionnes > 0 && (
              <div style={s.blocageWrap}>
                <p style={s.blocageTitre}>Caisse bloquée :</p>
                {sousMinimumGlobal && (
                  <div style={s.blocageItem}>
                    <span style={s.blocagePoint}>⚠️</span>
                    <span>Minimum non atteint — il manque {(MINIMUM_GLOBAL - totalSelectionne).toFixed(2)} $</span>
                  </div>
                )}
                {vendeurSousMinimum && (
                  <div style={s.blocageItem}>
                    <span style={s.blocagePoint}>⚠️</span>
                    <span>Minimum {vendeurSousMinimum.vendeur_nom} non atteint (manque {(vendeurSousMinimum.minimum - vendeurSousMinimum.sous_total).toFixed(2)} $)</span>
                  </div>
                )}
              </div>
            )}

            {!peutPayer && articlesSelectionnes === 0 && (
              <div style={s.blocageWrap}>
                <p style={s.blocageTitre}>Sélectionnez un vendeur</p>
                <div style={s.blocageItem}>
                  <span style={s.blocagePoint}>👆</span>
                  <span>Cliquez sur l'encadré d'un vendeur pour sélectionner sa commande</span>
                </div>
              </div>
            )}

            {/* Bouton passer a la caisse */}
            <button
              className={peutPayer ? "btn-caisse" : ""}
              style={{
                ...s.btnCaisse,
                opacity: peutPayer ? 1 : 0.45,
                cursor: peutPayer ? "pointer" : "not-allowed",
              }}
              onClick={() => { if (!peutPayer || !vendeurSelectionne) return; localStorage.setItem("checkout_vendeur_id", String(vendeurSelectionne)); naviguer("checkout", { vendeurId: vendeurSelectionne }); }}
              disabled={!peutPayer}
            >
              {peutPayer ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Passer à la caisse
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {articlesSelectionnes === 0 ? "Sélectionnez un vendeur" : "Caisse indisponible"}
                </>
              )}
            </button>

            <button style={s.btnContinuerAchats} onClick={() => naviguer("catalogue")}>
              Continuer les achats
            </button>
          </div>

          {/* Badge securite paiement */}
          <div style={s.securiteCard}>
            <div style={s.securiteHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={s.securiteTitre}>Paiement 100% securise</span>
            </div>
            <p style={s.securiteDesc}>
              Vos informations de paiement sont protegees par un chiffrement SSL 256 bits. Propulse par Stripe.
            </p>
            <div style={s.securiteBadges}>
              <span style={s.securiteBadge}>🔒 SSL</span>
              <span style={s.securiteBadge}>💳 Stripe</span>
              <span style={s.securiteBadge}>🛡️ PCI DSS</span>
            </div>
          </div>

          {/* Politique retour */}
          <div style={s.politiqueCard}>
            <p style={s.politiqueTitre}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b47828" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Politique de retour
            </p>
            <p style={s.politiqueDesc}>
              Chaque vendeur definit sa propre politique de retour. Consultez la page du vendeur pour plus de details.
            </p>
          </div>
        </div>
      </div>

      {/* ══ SECTION MIS DE CÔTÉ POUR PLUS TARD ═══════════════════════════ */}
      {plusTard.length > 0 && (
        <div style={s.plusTardSection}>
          {/* En-tête section */}
          <div style={s.plusTardHeader}>
            <div style={s.plusTardHeaderLeft}>
              <div style={s.plusTardIcone}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b47828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 style={s.plusTardTitre}>
                  Mis de côté pour plus tard
                </h2>
                <p style={s.plusTardSousTitre}>
                  {plusTard.length} article{plusTard.length > 1 ? "s" : ""} sauvegardé{plusTard.length > 1 ? "s" : ""} — cliquez sur "Ajouter au panier" pour les récupérer
                </p>
              </div>
            </div>
          </div>

          {/* Grille articles mis de côté */}
          <div style={{ ...s.plusTardGrille, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {plusTard.map((article) => (
              <div key={article.id} className="plus-tard-card" style={{ ...s.plusTardCard, padding: isMobile ? "12px 10px" : "20px", gap: isMobile ? "8px" : "12px" }}>
                {/* Image */}
                <div style={{ ...s.plusTardImg, aspectRatio: isMobile ? "1/1" : "4/3" }}>
                  <a
                    href={`https://evend-multivendeur-api.onrender.com/produit/${article.produit_shopify_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                  >
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.titre}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", border: "1px solid #f0e6d3", transition: "opacity 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#fef9ee", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                        📦
                      </div>
                    )}
                  </a>
                </div>

                {/* Infos */}
                <div style={s.plusTardInfos}>
                  <p style={s.plusTardVendeur}>{article.vendeur_nom}</p>
                  <p style={{ ...s.plusTardNom as React.CSSProperties, fontSize: isMobile ? "11px" : "14px", margin: isMobile ? "0 0 3px" : "0 0 6px" }}>{article.titre}</p>
                  <p style={{ ...s.plusTardPrix, fontSize: isMobile ? "13px" : "16px" }}>{parseFloat(String(article.prix)).toFixed(2)} $</p>
                  {!isMobile && <p style={s.plusTardDate}>
                    Mis de côté le {new Date(article.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
                  </p>}
                </div>

                {/* Boutons */}
                <div style={s.plusTardBtns}>
                  <button
                    style={{
                      ...s.btnRemettre,
                      padding: isMobile ? "8px 6px" : "10px 14px",
                      fontSize: isMobile ? "11px" : "13px",
                      opacity: enCoursRemettre === article.id ? 0.6 : 1,
                    }}
                    onClick={() => remettreDansPanier(article.id)}
                    disabled={enCoursRemettre === article.id}
                  >
                    {enCoursRemettre === article.id ? (
                      "⏳ Ajout..."
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        Ajouter au panier
                      </>
                    )}
                  </button>
                  <button
                    style={s.btnSupprimerPlusTard}
                    onClick={() => supprimerPlusTard(article.id)}
                    title="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CSS ANIMATIONS ────────────────────────────────────────────────────────
const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @media (max-width: 767px) {
    .groupe-header-mobile { padding: 12px 14px !important; gap: 10px !important; }
    .vendeur-nom-mobile { font-size: 14px !important; }
    .badge-verif-mobile { display: none !important; }
    .badge-status-mobile { font-size: 10px !important; padding: 2px 6px !important; }
    .recap-mobile { padding: 14px !important; }
  }
  @keyframes progress { from { width: 0%; } to { width: 100%; } }
  .article-row { animation: fadeInUp 0.3s ease; transition: background 0.2s; }
  .article-row:hover { background: #fef9ee !important; }
  .btn-qte:hover:not(:disabled) { background: linear-gradient(135deg, #d4a853, #b47828) !important; color: #fff !important; border-color: #b47828 !important; }
  .btn-suppr { transition: all 0.2s !important; }
  .btn-suppr:hover:not(:disabled) { background: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; transform: scale(1.05); }
  .btn-plus-tard:hover:not(:disabled) { background: #fef3c7 !important; border-color: #d4a853 !important; transform: scale(1.05); }
  .plus-tard-card:hover { background: #fef9ee !important; }
  .btn-vider:hover { background: #fef3c7 !important; border-color: #d4a853 !important; }
  .btn-caisse:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(180,120,40,0.4) !important; }
  .btn-decouvrir:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(180,120,40,0.3) !important; }
`;

// ─── STYLES ────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "1280px", margin: "0 auto", padding: "16px 12px 60px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1c1917", minHeight: "60vh" },

  // Loading
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "16px" },
  spinnerOuter: { width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #fef9ee, #fef3c7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(212,168,83,0.2)" },
  spinner: { width: "36px", height: "36px", border: "3px solid #f0e6d3", borderTop: "3px solid #b47828", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingTxt: { fontSize: "16px", fontWeight: 600, color: "#1c1917", margin: 0 },
  loadingSubTxt: { fontSize: "13px", color: "#a8926a", margin: 0 },

  // Erreur
  erreurWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "12px", textAlign: "center" },
  erreurIcone: { fontSize: "48px" },
  erreurTitre: { fontSize: "20px", fontWeight: 700, color: "#1c1917", margin: 0 },
  erreurDesc: { fontSize: "14px", color: "#78716c", margin: 0 },
  btnReessayer: { padding: "10px 24px", background: "linear-gradient(135deg, #d4a853, #b47828)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "8px" },

  // Vide
  videWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "16px", textAlign: "center" },
  videIllustration: { marginBottom: "8px" },
  videTitre: { fontSize: "24px", fontWeight: 700, color: "#1c1917", margin: 0 },
  videDesc: { fontSize: "15px", color: "#78716c", lineHeight: 1.7, margin: 0 },
  btnDecouvrir: { display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: "linear-gradient(135deg, #d4a853, #b47828)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", marginTop: "8px" },
  btnVideContinuer: { padding: "10px 24px", background: "transparent", color: "#a8926a", border: "1px solid #e7d5b8", borderRadius: "10px", fontSize: "14px", cursor: "pointer" },

  // Popup confirmation
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9998 },
  popupConfirm: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 9999, background: "#fffdf7", border: "1px solid #e7d5b8", borderRadius: "20px", padding: "36px 32px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  popupIcone: { fontSize: "48px", marginBottom: "12px" },
  popupTitre: { fontSize: "20px", fontWeight: 700, color: "#1c1917", margin: "0 0 8px" },
  popupDesc: { fontSize: "14px", color: "#78716c", margin: "0 0 24px", lineHeight: 1.6 },
  popupBtns: { display: "flex", gap: "12px", justifyContent: "center" },
  popupBtnAnnuler: { padding: "10px 24px", background: "transparent", color: "#78716c", border: "1px solid #e7d5b8", borderRadius: "10px", fontSize: "14px", cursor: "pointer", fontWeight: 500 },
  popupBtnConfirmer: { padding: "10px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", cursor: "pointer", fontWeight: 700 },

  // Top bar
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  topBarLeft: { display: "flex", alignItems: "center", gap: "16px" },
  topBarIcone: { fontSize: "36px" },
  pageTitre: { fontSize: "28px", fontWeight: 800, color: "#1c1917", margin: "0 0 4px", letterSpacing: "-0.5px" },
  pageSousTitre: { fontSize: "14px", color: "#a8926a", margin: 0 },
  topBarActions: { display: "flex", gap: "10px", alignItems: "center" },
  btnRetour: { display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#fff", border: "1px solid #e7d5b8", borderRadius: "10px", fontSize: "13px", color: "#78716c", cursor: "pointer", fontWeight: 500 },
  btnVider: { display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#fff", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "13px", color: "#dc2626", cursor: "pointer", fontWeight: 500, transition: "all 0.15s" },

  // Bannières
  bannieres: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  banniere: { display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px 20px", borderRadius: "14px", border: "1px solid" },
  banniereSuccess: { background: "#f0fdf4", borderColor: "#bbf7d0" },
  banniereWarn: { background: "#fffbeb", borderColor: "#fde68a" },
  banniereErreur: { background: "#fef2f2", borderColor: "#fecaca" },
  banniereIconeWrap: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  banniereContent: { flex: 1 },
  banniereTitre: { fontSize: "14px", fontWeight: 700, color: "#1c1917", margin: "0 0 4px" },
  banniereDesc: { fontSize: "13px", color: "#78716c", margin: 0, lineHeight: 1.6 },
  banniereBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" },

  // Layout
  layout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "28px", alignItems: "start" }, // override via isMobile inline
  colArticles: { display: "flex", flexDirection: "column", gap: "20px" },

  // Groupe vendeur
  groupeCard: { background: "#fffdf7", border: "1px solid #e7d5b8", borderRadius: "18px", overflow: "hidden", boxShadow: "0 2px 12px rgba(212,168,83,0.08)" },
  groupeHeader: { display: "flex", alignItems: "center", gap: "14px", padding: "18px 24px", background: "linear-gradient(to right, #fef9ee, #fef3c7)", borderBottom: "1px solid #f0e6d3" },
  vendeurAvatarWrap: { position: "relative", flexShrink: 0 },
  vendeurAvatar: { width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a853, #b47828)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, boxShadow: "0 2px 8px rgba(180,120,40,0.3)" },
  vendeurOnline: { position: "absolute", bottom: "1px", right: "1px", width: "11px", height: "11px", borderRadius: "50%", background: "#22c55e", border: "2px solid #fef9ee" },
  vendeurInfos: { flex: 1, minWidth: 0 },
  vendeurTopRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
  vendeurNom: { fontSize: "16px", fontWeight: 700, color: "#1c1917", margin: 0 },
  vendeurBadgeVerifie: { fontSize: "11px", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 },
  vendeurStats: { fontSize: "13px", color: "#a8926a", margin: 0 },
  badgeMini: { display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "12px", color: "#92400e", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  badgeOk: { display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "12px", color: "#16a34a", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },

  // Progression minimum
  progressWrap: { padding: "14px 24px", background: "#fffbeb", borderBottom: "1px solid #fde68a" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  progressLabel: { fontSize: "12px", color: "#92400e", fontWeight: 500 },
  progressPct: { fontSize: "12px", color: "#92400e", fontWeight: 700 },
  progressBar: { height: "6px", background: "#fde68a", borderRadius: "10px", overflow: "hidden", marginBottom: "8px" },
  progressFill: { height: "100%", background: "linear-gradient(to right, #f59e0b, #d97706)", borderRadius: "10px", transition: "width 0.5s ease" },
  progressNote: { fontSize: "12px", color: "#92400e", margin: 0 },

  // Articles liste
  articlesListe: {},
  articleRow: { display: "grid", gridTemplateColumns: "88px 1fr 140px 110px 50px", alignItems: "center", gap: "20px", padding: "20px 24px", background: "#fff" },

  // Image
  imgContainer: { width: "88px", height: "88px", flexShrink: 0 },
  img: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px", border: "1px solid #f0e6d3", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  imgPlaceholder: { width: "100%", height: "100%", background: "#fef9ee", borderRadius: "12px", border: "1px solid #f0e6d3", display: "flex", alignItems: "center", justifyContent: "center" },

  // Infos article
  articleInfos: { minWidth: 0 },
  articleTitre: { fontSize: "14px", fontWeight: 600, color: "#1c1917", margin: "0 0 6px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties,
  articleMeta: { marginBottom: "8px" },
  articleVendeurTag: { fontSize: "11px", color: "#a8926a", background: "#fef9ee", padding: "2px 8px", borderRadius: "6px", border: "1px solid #f0e6d3" },
  articlePrixWrap: { display: "flex", alignItems: "baseline", gap: "4px" },
  articlePrixUnit: { fontSize: "16px", fontWeight: 700, color: "#b47828" },
  articlePrixUnitLabel: { fontSize: "12px", color: "#a8926a" },

  // Quantite
  qteSection: {},
  qteLabel: { fontSize: "11px", color: "#a8926a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" },
  qteControle: { display: "flex", alignItems: "center", gap: "8px", background: "#fef9ee", border: "1px solid #e7d5b8", borderRadius: "10px", padding: "6px 10px", width: "fit-content" },
  btnQte: { width: "28px", height: "28px", border: "1px solid #e7d5b8", borderRadius: "7px", background: "#fff", color: "#92400e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 },
  qteAffichage: { width: "32px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" },
  qteVal: { fontSize: "15px", fontWeight: 700, color: "#1c1917" },
  qteMiniSpinner: { width: "14px", height: "14px", border: "2px solid #e7d5b8", borderTop: "2px solid #b47828", borderRadius: "50%", animation: "spin 0.6s linear infinite" },

  // Total article
  articleTotal: { textAlign: "right" },
  articleTotalLabel: { fontSize: "11px", color: "#a8926a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" },
  articleTotalMontant: { fontSize: "18px", fontWeight: 800, color: "#1c1917", margin: "0 0 2px" },
  articleTotalDetail: { fontSize: "11px", color: "#a8926a", margin: 0 },

  // Bouton supprimer
  supprimerWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  btnSuppr: { width: "38px", height: "38px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  supprimerLabel: { fontSize: "10px", color: "#a8926a", textTransform: "uppercase", letterSpacing: "0.5px" },

  // Footer groupe
  groupeFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "linear-gradient(to right, #fef9ee, #fef3c7)", borderTop: "1px solid #f0e6d3" },
  groupeFooterLeft: { display: "flex", alignItems: "center", gap: "8px" },
  groupeFooterLabel: { fontSize: "14px", color: "#78716c", fontWeight: 500 },
  groupeFooterMontant: { fontSize: "18px", fontWeight: 800 },

  // Récap
  colRecap: { position: "sticky", top: "20px", display: "flex", flexDirection: "column", gap: "14px" },
  recapCard: { background: "#fffdf7", border: "1px solid #e7d5b8", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 20px rgba(212,168,83,0.1)" },
  recapTitre: { display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: 700, color: "#1c1917", margin: "0 0 20px", paddingBottom: "14px", borderBottom: "1px solid #f0e6d3" },
  recapLigneVendeur: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  recapVendeurNom: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#78716c" },
  recapVendeurPoint: { width: "8px", height: "8px", borderRadius: "50%", background: "#d4a853", flexShrink: 0 },
  recapVendeurMontant: { fontSize: "13px", fontWeight: 600, color: "#1c1917" },
  recapSeparateur: { height: "1px", background: "#f0e6d3", margin: "14px 0" },
  recapLigneCalc: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  recapCalcLabel: { fontSize: "13px", color: "#78716c" },
  recapCalcValeur: { fontSize: "13px", fontWeight: 500, color: "#1c1917" },
  recapTotalWrap: { background: "linear-gradient(135deg, #fef9ee, #fef3c7)", border: "1px solid #e7d5b8", borderRadius: "12px", padding: "16px", margin: "16px 0 20px" },
  recapTotalLigne: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  recapTotalLabel: { fontSize: "16px", fontWeight: 700, color: "#1c1917" },
  recapTotalMontant: { fontSize: "24px", fontWeight: 900, color: "#b47828" },
  recapTotalDevise: { fontSize: "14px", fontWeight: 600, color: "#a8926a" },
  recapTotalNote: { fontSize: "11px", color: "#a8926a", margin: 0 },

  // Blocage
  blocageWrap: { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px", marginBottom: "16px" },
  blocageTitre: { fontSize: "12px", fontWeight: 700, color: "#92400e", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  blocageItem: { display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#92400e", marginBottom: "4px" },
  blocagePoint: { flexShrink: 0 },

  // Bouton caisse
  btnCaisse: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #d4a853, #b47828)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s", marginBottom: "10px", boxShadow: "0 4px 16px rgba(180,120,40,0.25)" },
  btnContinuerAchats: { width: "100%", padding: "12px", background: "transparent", color: "#92400e", border: "1px solid #e7d5b8", borderRadius: "12px", fontSize: "14px", cursor: "pointer", fontWeight: 500 },

  // Sécurité
  securiteCard: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "16px 18px" },
  securiteHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  securiteTitre: { fontSize: "14px", fontWeight: 700, color: "#166534" },
  securiteDesc: { fontSize: "12px", color: "#4b7c59", lineHeight: 1.6, margin: "0 0 12px" },
  securiteBadges: { display: "flex", gap: "8px", flexWrap: "wrap" },
  securiteBadge: { fontSize: "11px", fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "3px 10px", borderRadius: "20px" },

  // Politique
  politiqueCard: { background: "#fffdf7", border: "1px solid #e7d5b8", borderRadius: "14px", padding: "14px 18px" },
  politiqueTitre: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#92400e", margin: "0 0 6px" },
  politiqueDesc: { fontSize: "12px", color: "#a8926a", margin: 0, lineHeight: 1.6 },

  // Bouton mettre de côté
  btnPlusTard: { width: "38px", height: "38px", borderRadius: "10px", background: "#fef9ee", border: "1px solid #e7d5b8", color: "#b47828", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" },

  // Section Mis de côté pour plus tard
  plusTardSection: { marginTop: "32px" },
  plusTardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "20px 24px", background: "linear-gradient(135deg, #fef9ee, #fef3c7)", border: "1px solid #e7d5b8", borderRadius: "16px 16px 0 0", borderBottom: "none" },
  plusTardHeaderLeft: { display: "flex", alignItems: "center", gap: "14px" },
  plusTardIcone: { width: "44px", height: "44px", borderRadius: "12px", background: "rgba(180,120,40,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  plusTardTitre: { fontSize: "18px", fontWeight: 800, color: "#1c1917", margin: "0 0 4px", letterSpacing: "-0.3px" },
  plusTardSousTitre: { fontSize: "13px", color: "#a8926a", margin: 0 },

  plusTardGrille: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0", border: "1px solid #e7d5b8", borderRadius: "0 0 16px 16px", overflow: "hidden" }, // mobile: 2col via inline
  plusTardCard: { background: "#fffdf7", padding: "20px", borderRight: "1px solid #f0e6d3", borderBottom: "1px solid #f0e6d3", display: "flex", flexDirection: "column", gap: "12px", transition: "background 0.2s" }, // mobile: padding réduit via inline
  plusTardImg: { width: "100%", aspectRatio: "4/3", flexShrink: 0 }, // mobile: ratio 1/1 via inline
  plusTardInfos: { flex: 1 },
  plusTardVendeur: { fontSize: "11px", color: "#b47828", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" },
  plusTardNom: { fontSize: "14px", fontWeight: 600, color: "#1c1917", margin: "0 0 6px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties, // mobile: 12px via inline
  plusTardPrix: { fontSize: "16px", fontWeight: 800, color: "#b47828", margin: "0 0 4px" },
  plusTardDate: { fontSize: "11px", color: "#a8926a", margin: 0 },
  plusTardBtns: { display: "flex", flexDirection: "column", gap: "8px" },
  btnRemettre: { width: "100%", padding: "10px 14px", background: "linear-gradient(135deg, #d4a853, #b47828)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s" }, // mobile: compact via inline
  btnSupprimerPlusTard: { width: "100%", padding: "8px 14px", background: "transparent", color: "#a8926a", border: "1px solid #e7d5b8", borderRadius: "10px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
};