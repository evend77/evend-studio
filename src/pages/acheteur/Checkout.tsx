// src/pages/acheteur/Checkout.tsx
// Page checkout e-Vend — résumé commande + infos livraison + redirection Stripe Connect

import { useState, useEffect } from "react";
import { API_BASE } from "../../config/api";

interface CheckoutProps {
  naviguer: (page: string, props?: any) => void;
}

interface ArticlePanier {
  id: number;
  produit_shopify_id: string;
  variant_id: string;
  titre: string;
  image_url: string;
  prix: number;
  quantite: number;
  vendeur_id: number;
  vendeur_nom: string;
}

interface InfosLivraison {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  province: string;
  code_postal: string;
  pays: string;
}

type Etape = "livraison" | "recapitulatif" | "paiement";

export default function Checkout({ naviguer }: CheckoutProps) {
  const [etape, setEtape] = useState<Etape>("livraison");
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  const [loading, setLoading] = useState(true);
  const [soumis, setSoumis] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [infos, setInfos] = useState<InfosLivraison>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    province: "QC",
    code_postal: "",
    pays: "Canada",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPanier();
    prefillInfosAcheteur();
  }, []);

  async function fetchPanier() {
    try {
      const res = await fetch(`${API_BASE}/panier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setErreur("Impossible de charger le panier");
    } finally {
      setLoading(false);
    }
  }

  async function prefillInfosAcheteur() {
    try {
      const res = await fetch(`${API_BASE}/acheteurs/profil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setInfos((prev) => ({
        ...prev,
        prenom: data.prenom || "",
        nom: data.nom || "",
        email: data.email || "",
        telephone: data.telephone || "",
        adresse: data.adresse || "",
        ville: data.ville || "",
        province: data.province || "QC",
        code_postal: data.code_postal || "",
      }));
    } catch {
      // Silencieux — le formulaire reste vide
    }
  }

  // ── Grouper par vendeur ──────────────────────────────────────────────────

  const articlesParVendeur = articles.reduce((acc, art) => {
    if (!acc[art.vendeur_id]) {
      acc[art.vendeur_id] = { vendeur_nom: art.vendeur_nom, articles: [], sous_total: 0 };
    }
    acc[art.vendeur_id].articles.push(art);
    acc[art.vendeur_id].sous_total += art.prix * art.quantite;
    return acc;
  }, {} as Record<number, { vendeur_nom: string; articles: ArticlePanier[]; sous_total: number }>);

  const total = Object.values(articlesParVendeur).reduce((s, g) => s + g.sous_total, 0);
  const totalArticles = articles.reduce((s, a) => s + a.quantite, 0);

  // ── Validation formulaire ────────────────────────────────────────────────

  function validerFormulaire(): boolean {
    return Object.values(infos).every((v) => v.trim() !== "");
  }

  // ── Soumission commande → Stripe ─────────────────────────────────────────

  async function passerCommande() {
    setSoumis(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_BASE}/checkout/creer-commande`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ infos_livraison: infos }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de la commande");
      }

      // Si plusieurs vendeurs → on redirige vers le 1er paiement
      // (paiements séquentiels par vendeur)
      if (data.stripe_url) {
        window.location.href = data.stripe_url;
      } else {
        // Fallback : page confirmation si déjà payé
        naviguer("commande-confirmee", { commande_id: data.commande_id });
      }
    } catch (e: any) {
      setErreur(e.message);
      setSoumis(false);
    }
  }

  // ─── RENDU ────────────────────────────────────────────────────────────────

  if (loading) return <Chargement />;
  if (articles.length === 0 && !loading) {
    return (
      <div style={styles.page}>
        <p style={{ color: "var(--color-text-secondary)", textAlign: "center", paddingTop: "4rem" }}>
          Votre panier est vide.{" "}
          <button style={styles.lien} onClick={() => naviguer("panier")}>
            Retourner au panier
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── En-tête + étapes ── */}
      <div style={styles.header}>
        <button style={styles.retour} onClick={() => naviguer("panier")}>
          ← Panier
        </button>
        <h1 style={styles.titre}>Paiement</h1>
      </div>

      <BarreEtapes etapeCourante={etape} />

      <div style={styles.layout}>
        {/* ── Col gauche : formulaire ── */}
        <div style={styles.colFormulaire}>
          {/* ÉTAPE 1 : Informations de livraison */}
          {etape === "livraison" && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitre}>Informations de livraison</h2>

              <div style={styles.grille2}>
                <Champ label="Prénom" valeur={infos.prenom} onChange={(v) => setInfos({ ...infos, prenom: v })} />
                <Champ label="Nom" valeur={infos.nom} onChange={(v) => setInfos({ ...infos, nom: v })} />
              </div>
              <Champ label="Courriel" type="email" valeur={infos.email} onChange={(v) => setInfos({ ...infos, email: v })} />
              <Champ label="Téléphone" type="tel" valeur={infos.telephone} onChange={(v) => setInfos({ ...infos, telephone: v })} />
              <Champ label="Adresse" valeur={infos.adresse} onChange={(v) => setInfos({ ...infos, adresse: v })} />
              <div style={styles.grille2}>
                <Champ label="Ville" valeur={infos.ville} onChange={(v) => setInfos({ ...infos, ville: v })} />
                <ChampSelect
                  label="Province"
                  valeur={infos.province}
                  onChange={(v) => setInfos({ ...infos, province: v })}
                  options={PROVINCES}
                />
              </div>
              <div style={styles.grille2}>
                <Champ label="Code postal" valeur={infos.code_postal} onChange={(v) => setInfos({ ...infos, code_postal: v.toUpperCase() })} />
                <Champ label="Pays" valeur={infos.pays} onChange={(v) => setInfos({ ...infos, pays: v })} disabled />
              </div>

              <button
                style={{ ...styles.btnPrimaire, marginTop: "1.5rem", opacity: validerFormulaire() ? 1 : 0.5 }}
                onClick={() => validerFormulaire() && setEtape("recapitulatif")}
                disabled={!validerFormulaire()}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : Récapitulatif */}
          {etape === "recapitulatif" && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitre}>Vérifier la commande</h2>

              {/* Adresse confirmée */}
              <div style={styles.adresseConfirmee}>
                <div style={styles.adresseIcone}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" stroke="var(--color-text-info)" strokeWidth="1.2" fill="none" />
                    <circle cx="8" cy="6" r="1.5" fill="var(--color-text-info)" />
                  </svg>
                </div>
                <div>
                  <p style={styles.adresseNom}>{infos.prenom} {infos.nom}</p>
                  <p style={styles.adresseDetail}>{infos.adresse}, {infos.ville} {infos.province} {infos.code_postal}</p>
                  <p style={styles.adresseDetail}>{infos.email} · {infos.telephone}</p>
                </div>
                <button style={styles.btnModifier} onClick={() => setEtape("livraison")}>
                  Modifier
                </button>
              </div>

              {/* Articles groupés par vendeur */}
              {Object.entries(articlesParVendeur).map(([vendeurId, groupe]) => (
                <div key={vendeurId} style={styles.groupeRecap}>
                  <p style={styles.groupeVendeurNom}>Commande · {groupe.vendeur_nom}</p>
                  {groupe.articles.map((a) => (
                    <div key={a.id} style={styles.ligneArticle}>
                      <div style={styles.badgeQte}>{a.quantite}</div>
                      <span style={styles.ligneNom}>{a.titre}</span>
                      <span style={styles.lignePrix}>{(a.prix * a.quantite).toFixed(2)} $</span>
                    </div>
                  ))}
                  <div style={styles.groupeSousTotal}>
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>Sous-total</span>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{groupe.sous_total.toFixed(2)} $</span>
                  </div>
                </div>
              ))}

              {erreur && <p style={styles.erreur}>{erreur}</p>}

              <button
                style={{ ...styles.btnPrimaire, marginTop: "1rem", opacity: soumis ? 0.6 : 1 }}
                onClick={passerCommande}
                disabled={soumis}
              >
                {soumis ? "Traitement en cours…" : `Payer ${total.toFixed(2)} $ →`}
              </button>

              <p style={styles.securiteNote}>
                Paiement sécurisé par Stripe · Vos données sont protégées
              </p>
            </div>
          )}
        </div>

        {/* ── Col droite : résumé commande ── */}
        <div style={styles.colResume}>
          <div style={styles.resumeCard}>
            <h3 style={styles.resumeTitre}>
              {totalArticles} article{totalArticles > 1 ? "s" : ""}
            </h3>

            {articles.map((a) => (
              <div key={a.id} style={styles.resumeArticle}>
                <div style={styles.resumeImageWrap}>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.titre} style={styles.resumeImage} />
                  ) : (
                    <div style={styles.resumeImagePlaceholder} />
                  )}
                  <span style={styles.resumeQteBadge}>{a.quantite}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.resumeNom}>{a.titre}</p>
                  <p style={styles.resumeVendeur}>{a.vendeur_nom}</p>
                </div>
                <p style={styles.resumePrix}>{(a.prix * a.quantite).toFixed(2)} $</p>
              </div>
            ))}

            <div style={styles.resumeDivider} />
            <div style={styles.resumeTotal}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Total</span>
              <span style={{ fontSize: "18px", fontWeight: 500 }}>{total.toFixed(2)} $</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SOUS-COMPOSANTS ───────────────────────────────────────────────────────

function BarreEtapes({ etapeCourante }: { etapeCourante: Etape }) {
  const etapes: { id: Etape; label: string }[] = [
    { id: "livraison", label: "Livraison" },
    { id: "recapitulatif", label: "Vérification" },
    { id: "paiement", label: "Paiement" },
  ];
  const idx = etapes.findIndex((e) => e.id === etapeCourante);

  return (
    <div style={styles.barreEtapes}>
      {etapes.map((e, i) => (
        <div key={e.id} style={styles.etapeItem}>
          <div style={{
            ...styles.etapePoint,
            background: i <= idx ? "var(--color-text-primary)" : "var(--color-background-tertiary)",
            border: i <= idx ? "none" : "0.5px solid var(--color-border-secondary)",
          }}>
            {i < idx ? (
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="var(--color-background-primary)" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>
            ) : (
              <span style={{ fontSize: "11px", color: i === idx ? "var(--color-background-primary)" : "var(--color-text-tertiary)", fontWeight: 500 }}>{i + 1}</span>
            )}
          </div>
          <span style={{ fontSize: "13px", color: i <= idx ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontWeight: i === idx ? 500 : 400 }}>
            {e.label}
          </span>
          {i < etapes.length - 1 && (
            <div style={{ flex: 1, height: "0.5px", background: i < idx ? "var(--color-text-primary)" : "var(--color-border-tertiary)", margin: "0 8px", marginBottom: "12px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Champ({
  label, valeur, onChange, type = "text", disabled = false,
}: {
  label: string; valeur: string; onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div style={styles.champWrap}>
      <label style={styles.champLabel}>{label}</label>
      <input
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...styles.champInput, opacity: disabled ? 0.6 : 1 }}
        placeholder={label}
      />
    </div>
  );
}

function ChampSelect({
  label, valeur, onChange, options,
}: {
  label: string; valeur: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div style={styles.champWrap}>
      <label style={styles.champLabel}>{label}</label>
      <select value={valeur} onChange={(e) => onChange(e.target.value)} style={styles.champInput}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Chargement() {
  return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Chargement…</p>
    </div>
  );
}

const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "Colombie-Britannique" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "Nouveau-Brunswick" },
  { value: "NL", label: "Terre-Neuve-et-Labrador" },
  { value: "NS", label: "Nouvelle-Écosse" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Île-du-Prince-Édouard" },
  { value: "QC", label: "Québec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NT", label: "Territoires du Nord-Ouest" },
  { value: "NU", label: "Nunavut" },
  { value: "YT", label: "Yukon" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: "var(--font-sans, system-ui)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem",
  },
  retour: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--color-text-secondary)",
    padding: 0,
  },
  titre: {
    fontSize: "22px",
    fontWeight: 500,
    color: "var(--color-text-primary)",
    margin: 0,
  },
  barreEtapes: {
    display: "flex",
    alignItems: "center",
    marginBottom: "2.5rem",
  },
  etapeItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  etapePoint: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "2rem",
    alignItems: "start",
  },
  colFormulaire: {},
  section: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "1.75rem",
  },
  sectionTitre: {
    fontSize: "16px",
    fontWeight: 500,
    color: "var(--color-text-primary)",
    margin: "0 0 1.5rem",
  },
  grille2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  champWrap: { marginBottom: "12px" },
  champLabel: {
    display: "block",
    fontSize: "12px",
    color: "var(--color-text-secondary)",
    marginBottom: "6px",
  },
  champInput: {
    width: "100%",
    padding: "9px 12px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    fontSize: "14px",
    color: "var(--color-text-primary)",
    background: "var(--color-background-primary)",
    boxSizing: "border-box",
    outline: "none",
  } as React.CSSProperties,
  btnPrimaire: {
    width: "100%",
    padding: "13px",
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    border: "none",
    borderRadius: "var(--border-radius-md)",
    fontSize: "15px",
    fontWeight: 500,
    cursor: "pointer",
  },
  adresseConfirmee: {
    display: "flex",
    gap: "12px",
    padding: "14px",
    background: "var(--color-background-secondary)",
    borderRadius: "var(--border-radius-md)",
    border: "0.5px solid var(--color-border-tertiary)",
    marginBottom: "1.5rem",
  },
  adresseIcone: { paddingTop: "2px", flexShrink: 0 },
  adresseNom: { fontSize: "14px", fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" },
  adresseDetail: { fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 2px" },
  btnModifier: {
    marginLeft: "auto",
    alignSelf: "flex-start",
    background: "none",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    padding: "4px 10px",
    fontSize: "12px",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    whiteSpace: "nowrap",
  },
  groupeRecap: {
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md)",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  groupeVendeurNom: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    margin: 0,
    padding: "10px 14px",
    background: "var(--color-background-secondary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  },
  ligneArticle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  },
  badgeQte: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "var(--color-background-tertiary)",
    border: "0.5px solid var(--color-border-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--color-text-primary)",
    flexShrink: 0,
  },
  ligneNom: { flex: 1, fontSize: "14px", color: "var(--color-text-primary)" },
  lignePrix: { fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" },
  groupeSousTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "var(--color-background-secondary)",
  },
  erreur: {
    color: "var(--color-text-danger)",
    fontSize: "14px",
    margin: "1rem 0 0",
    padding: "10px 14px",
    background: "var(--color-background-danger)",
    borderRadius: "var(--border-radius-md)",
    border: "0.5px solid var(--color-border-danger)",
  },
  securiteNote: {
    fontSize: "12px",
    color: "var(--color-text-tertiary)",
    textAlign: "center",
    margin: "12px 0 0",
  },
  lien: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-info)",
    fontSize: "inherit",
    textDecoration: "underline",
    padding: 0,
  },

  // Résumé droite
  colResume: { position: "sticky", top: "1.5rem" },
  resumeCard: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "1.25rem",
  },
  resumeTitre: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    margin: "0 0 1rem",
  },
  resumeArticle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  resumeImageWrap: { position: "relative", flexShrink: 0 },
  resumeImage: {
    width: "52px",
    height: "52px",
    objectFit: "cover",
    borderRadius: "var(--border-radius-md)",
    border: "0.5px solid var(--color-border-tertiary)",
  },
  resumeImagePlaceholder: {
    width: "52px",
    height: "52px",
    background: "var(--color-background-tertiary)",
    borderRadius: "var(--border-radius-md)",
  },
  resumeQteBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "var(--color-text-secondary)",
    color: "var(--color-background-primary)",
    fontSize: "11px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resumeNom: {
    fontSize: "13px",
    fontWeight: 500,
    margin: "0 0 2px",
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  resumeVendeur: { fontSize: "12px", color: "var(--color-text-tertiary)", margin: 0 },
  resumePrix: { fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0, flexShrink: 0 },
  resumeDivider: { height: "0.5px", background: "var(--color-border-tertiary)", margin: "1rem 0" },
  resumeTotal: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
};