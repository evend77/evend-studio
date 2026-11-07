// CHEMIN : src/pages/collaborateur/CollaborateurMethodesExpedition.tsx
// e-Vend Studio — Config expédition du collaborateur — 4 modes + combine shipping + zones province
// Adapté de MethodesExpedition.tsx (e-Vend) : même logique, API /api/collab/:gestionnaireId/...
import React, { useState, useEffect, useCallback } from 'react';

const PROVINCES = [
  { code: 'AB', nom: 'Alberta' },
  { code: 'BC', nom: 'Colombie-Britannique' },
  { code: 'MB', nom: 'Manitoba' },
  { code: 'NB', nom: 'Nouveau-Brunswick' },
  { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
  { code: 'NS', nom: 'Nouvelle-Écosse' },
  { code: 'ON', nom: 'Ontario' },
  { code: 'PE', nom: 'Île-du-Prince-Édouard' },
  { code: 'QC', nom: 'Québec' },
  { code: 'SK', nom: 'Saskatchewan' },
  { code: 'NT', nom: 'Territoires du Nord-Ouest' },
  { code: 'NU', nom: 'Nunavut' },
  { code: 'YT', nom: 'Yukon' },
];

const TRANSPORTEURS = [
  { id: 14, nom: 'Livraison gratuite',           logo: '🎁', desc: 'Gratuit pour tous les clients ou selon montant minimum' },
  { id: 1,  nom: 'Canada Post / Postes Canada',  logo: '📮', desc: 'Service postal national, fiable et économique' },
  { id: 2,  nom: 'Purolator',                    logo: '🚚', desc: 'Livraison express, excellent pour les colis urgents' },
  { id: 3,  nom: 'FedEx Canada',                 logo: '✈️', desc: 'Livraison internationale et express' },
  { id: 4,  nom: 'UPS Canada',                   logo: '📦', desc: 'Solutions de livraison complètes' },
  { id: 5,  nom: 'Intelcom Courrier',             logo: '📬', desc: 'Spécialiste des livraisons e-commerce au Québec' },
  { id: 6,  nom: 'DHL Express Canada',            logo: '🌍', desc: 'Expert en livraison internationale rapide' },
  { id: 7,  nom: 'GLS Canada',                   logo: '🚛', desc: 'Solutions abordables pour colis' },
  { id: 8,  nom: 'CanPar',                        logo: '🇨🇦', desc: 'Services de messagerie canadienne' },
  { id: 9,  nom: 'Loomis Express',               logo: '📦', desc: 'Réseau de messagerie pancanadien' },
  { id: 10, nom: 'Transport A. Bélanger',         logo: '🚚', desc: 'Transporteur local spécialisé Québec' },
  { id: 11, nom: 'Groupe Robert',                logo: '🏭', desc: 'Transport lourd et logistique' },
  { id: 12, nom: 'Livraison locale (marché)',     logo: '🛵', desc: 'Livraison locale pour votre région' },
  { id: 13, nom: 'Ramassage sur place',           logo: '🏪', desc: 'Le client vient chercher sa commande' },
];

// 🆕 Logos disponibles pour un transporteur personnalisé (liste fermée,
// même liste que côté serveur pour cohérence)
const LOGOS_PERSONNALISES = ['🚚', '📦', '🚛', '📮', '🏍️', '🚐', '🛻', '✈️', '🚀', '📬'];

const MODES_CALCUL = [
  { value: 'fixe',    label: 'Frais fixe',              desc: 'Un prix fixe peu importe le poids' },
  { value: 'fixe_kg', label: 'Frais fixe + par kg',     desc: 'Prix fixe + supplément selon le poids' },
  { value: 'kg',      label: 'Frais par kg seulement',  desc: 'Prix calculé uniquement selon le poids' },
  { value: 'zone',    label: 'Frais par province',       desc: 'Prix différent selon la province de livraison' },
];

interface Config {
  transporteur_id: number;
  actif: boolean;
  mode_calcul: string;
  frais_fixes: number | null;
  frais_par_kg: number | null;
  gratuit_superieur: number | null;
  delais_estime: string;
  combine_shipping: boolean;
  combine_frais_fixe_unique: boolean;
  combine_kg_additionne: boolean;
  frais_zones: Record<string, string | null>;
}

interface MethodesExpeditionProps {
  gestionnaireId: number;
  accent?: string;
  isMobile?: boolean;
  onRetour?: () => void;
}

const C = {
  bg: '#f4f6f8', white: '#fff', border: '#e1e3e5',
  // 🎨 accent/radius suivent le thème choisi dans Configuration (variables
  // CSS posées par AppVendeur.tsx) — couleurs sémantiques (green/red/yellow)
  // restent fixes, jamais thémées.
  teal: 'var(--e-accent, #537373)', tealLight: '#e8f0f0', tealDark: '#3d5a5a',
  radius: 'var(--e-radius, 12px)',
  green: '#008060', greenLight: '#f0fdf4', greenBorder: '#86efac',
  red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
  yellow: '#f59e0b', yellowLight: '#fffbeb', yellowBorder: '#fde68a',
  text: '#1a2332', textLight: '#6b7280', textMuted: '#9ca3af',
};

// Bouton-lien vers le guide (à gauche, en bas de l'encadré ; s'ouvre dans un nouvel onglet)
function BoutonGuide({ surFondFonce }: { surFondFonce: boolean }) {
  return (
    <a
      href="https://e-vend.ca/documents/frais-expedition"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '36px', boxSizing: 'border-box',
        padding: '8px 14px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer',
        borderRadius: '10px', maxWidth: '100%',
        ...(surFondFonce
          ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }
          : { background: 'transparent', color: C.teal, border: `1px solid ${C.teal}` }),
      }}
    >
      <span aria-hidden="true">📖</span>
      Guide : frais d'expédition
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function CollaborateurMethodesExpedition({ gestionnaireId, accent, isMobile, onRetour }: MethodesExpeditionProps) {
  const API = `/api/collab/${gestionnaireId}`;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actifs, setActifs] = useState<number[]>([]);
  const [configs, setConfigs] = useState<Map<number, Config>>(new Map());
  const [enEdition, setEnEdition] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; texte: string } | null>(null);
  // 🆕 Livraison gratuite globale — prime sur TOUT (manuel ET calcul auto),
  // vit dans config_vendeur, chargée/sauvegardée séparément des méthodes
  // par transporteur (table différente), mais sous le même bouton Sauvegarder.
  const [livraisonGratuiteActif, setLivraisonGratuiteActif] = useState(false);
  const [livraisonGratuiteSeuil, setLivraisonGratuiteSeuil] = useState('0');
  const [livraisonGratuiteProvinces, setLivraisonGratuiteProvinces] = useState<string[]>([]);
  // 🆕 Transporteurs personnalisés (max 2, IDs réservés 101/102)
  const [personnalises, setPersonnalises] = useState<{ id: number; nom: string; logo: string }[]>([]);
  // 🆕 Confirmation de suppression (2 clics) — évite qu'un clic accidentel
  // sur "Supprimer" efface un transporteur personnalisé sans avertissement.
  const [confirmSuppression, setConfirmSuppression] = useState<number | null>(null);

  // 🆕 Liste combinée — les transporteurs personnalisés se comportent
  // exactement comme les fixes partout ailleurs dans ce fichier (même
  // boucle de rendu, même sauvegarde, même validation).
  const TRANSPORTEURS_AFFICHES = [
    ...TRANSPORTEURS,
    ...personnalises.map(p => ({ id: p.id, nom: p.nom || 'Nouveau transporteur', logo: p.logo || '📦', desc: 'Transporteur personnalisé' })),
  ];

  // Charger configs existantes
  useEffect(() => {
    if (!gestionnaireId) return;
    setLoading(true);
    fetch(`${API}/methodes-expedition`, {
      credentials: 'include',
    })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      const a: number[] = [];
      const c = new Map<number, Config>();
      const perso: { id: number; nom: string; logo: string }[] = [];
      data.forEach((item: any) => {
        a.push(item.transporteur_id);
        c.set(item.transporteur_id, {
          transporteur_id: item.transporteur_id,
          actif: item.actif,
          mode_calcul: item.mode_calcul || 'fixe',
          frais_fixes: item.frais_fixes ? parseFloat(item.frais_fixes) : null,
          frais_par_kg: item.frais_par_kg ? parseFloat(item.frais_par_kg) : null,
          gratuit_superieur: item.gratuit_superieur ? parseFloat(item.gratuit_superieur) : null,
          delais_estime: item.delais_estime || '',
          combine_shipping: item.combine_shipping || false,
          combine_frais_fixe_unique: item.combine_frais_fixe_unique !== false,
          combine_kg_additionne: item.combine_kg_additionne !== false,
          frais_zones: item.frais_zones || {},
        });
        // 🆕
        if ([101, 102].includes(item.transporteur_id)) {
          perso.push({
            id: item.transporteur_id,
            nom: item.nom_personnalise || 'Transporteur personnalisé',
            logo: item.logo_personnalise || '📦',
          });
        }
      });
      setActifs(a);
      setConfigs(c);
      setPersonnalises(perso);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [gestionnaireId]);

  // 🆕 Charger la livraison gratuite globale (config_vendeur — endpoint séparé)
  useEffect(() => {
    if (!gestionnaireId) return;
    fetch(`${API}/expedition-config`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setLivraisonGratuiteActif(data.livraison_gratuite_globale_actif || false);
        setLivraisonGratuiteSeuil(data.livraison_gratuite_globale_seuil?.toString() || '0');
        setLivraisonGratuiteProvinces(data.livraison_gratuite_globale_provinces || []);
      })
      .catch(() => {});
  }, [gestionnaireId]);

  const configParDefaut = (transporteurId: number): Config => ({
    transporteur_id: transporteurId,
    actif: true,
    mode_calcul: transporteurId === 14 ? 'fixe' : 'fixe',
    frais_fixes: transporteurId === 14 ? 0 : null,
    frais_par_kg: null,
    gratuit_superieur: null,
    delais_estime: [101, 102].includes(transporteurId) ? '' : (TRANSPORTEURS_AFFICHES.find(t => t.id === transporteurId)?.desc || ''),
    combine_shipping: false,
    combine_frais_fixe_unique: true,
    combine_kg_additionne: true,
    frais_zones: {},
  });

  const toggleActif = useCallback((id: number) => {
    setActifs(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      setConfigs(c => { const m = new Map(c); if (!m.has(id)) m.set(id, configParDefaut(id)); return m; });
      return [...prev, id];
    });
  }, []);

  const updateConfig = useCallback((id: number, field: keyof Config, value: any) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(id) || configParDefaut(id);
      m.set(id, { ...cur, [field]: value });
      return m;
    });
  }, []);

  const updateZone = useCallback((id: number, province: string, value: string) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(id) || configParDefaut(id);
      const zones = { ...(cur.frais_zones || {}) };
      if (value === '') { delete zones[province]; }
      else { zones[province] = value === 'non' ? null : value; }
      m.set(id, { ...cur, frais_zones: zones });
      return m;
    });
  }, []);

  // Validation avant sauvegarde
  const valider = (id: number, cfg: Config): string | null => {
    const mode = cfg.mode_calcul;
    if (mode === 'fixe' || mode === 'fixe_kg') {
      if (cfg.frais_fixes === null && id !== 14) return 'Frais fixe requis';
    }
    if (mode === 'kg' || mode === 'fixe_kg') {
      if (!cfg.frais_par_kg) return 'Frais par kg requis';
    }
    if (mode === 'zone') {
      const manquantes = PROVINCES.filter(p => !(p.code in (cfg.frais_zones || {})));
      if (manquantes.length > 0) return `Remplissez toutes les provinces (manque: ${manquantes.map(p => p.code).join(', ')})`;
    }
    return null;
  };

  const sauvegarder = async () => {
    // Valider toutes les configs actives
    for (const id of actifs) {
      const cfg = configs.get(id);
      if (!cfg) continue;
      const erreur = valider(id, cfg);
      if (erreur) {
        const t = TRANSPORTEURS_AFFICHES.find(t => t.id === id);
        setMessage({ type: 'error', texte: `❌ ${t?.nom}: ${erreur}` });
        return;
      }
    }
    // 🆕 Valider le nom des transporteurs personnalisés actifs
    for (const p of personnalises) {
      if (actifs.includes(p.id) && !p.nom.trim()) {
        setMessage({ type: 'error', texte: '❌ Donnez un nom à votre transporteur personnalisé avant de sauvegarder' });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    const dataToSave = actifs.map(id => {
      const cfg = configs.get(id) || configParDefaut(id);
      const perso = personnalises.find(p => p.id === id);
      return {
        transporteur_id: id,
        actif: true,
        mode_calcul: cfg.mode_calcul,
        frais_fixes: cfg.frais_fixes,
        frais_par_kg: cfg.frais_par_kg,
        gratuit_superieur: cfg.gratuit_superieur,
        delais_estime: cfg.delais_estime,
        combine_shipping: cfg.combine_shipping,
        combine_frais_fixe_unique: cfg.combine_frais_fixe_unique,
        combine_kg_additionne: cfg.combine_kg_additionne,
        frais_zones: cfg.mode_calcul === 'zone' ? cfg.frais_zones : null,
        // 🆕
        nom_personnalise: perso ? perso.nom.trim() : undefined,
        logo_personnalise: perso ? perso.logo : undefined,
      };
    });

    try {
      // 🆕 Les deux sauvegardes en parallèle — deux tables différentes
      // (vendeur_methodes_expedition vs config_vendeur), un seul bouton.
      const [r, rConfig] = await Promise.all([
        fetch(`${API}/methodes-expedition`, {
          method: 'PUT',
          credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ methodes: dataToSave })
        }),
        fetch(`${API}/expedition-config`, {
          method: 'PATCH',
          credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            livraison_gratuite_globale_actif: livraisonGratuiteActif,
            livraison_gratuite_globale_seuil: parseFloat(livraisonGratuiteSeuil) || 0,
            livraison_gratuite_globale_provinces: livraisonGratuiteProvinces,
          })
        }),
      ]);
      if (r.ok && rConfig.ok) {
        setMessage({ type: 'success', texte: '✅ Méthodes d\'expédition sauvegardées!' });
        setEnEdition(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = r.ok ? await rConfig.json() : await r.json();
        setMessage({ type: 'error', texte: `❌ ${err.message || err.error || 'Erreur'}` });
      }
    } catch {
      setMessage({ type: 'error', texte: '❌ Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      Chargement des méthodes d'expédition...
    </div>
  );

  return (
    <div style={{ background: 'transparent', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', ['--e-accent' as any]: accent || '#537373', ['--e-accent-dark' as any]: accent || '#3d5a5a' }}>
      {/* Studio : un seul style d'en-tête (le vibrant) ; mobile : grilles à une colonne */}
      <style>{`
        .e-hero-classique { display: none; }
        @media (max-width: 640px) {
          .mx-grid2 { grid-template-columns: minmax(0, 1fr) !important; }
          .mx-conteneur { padding: 14px !important; }
        }
      `}</style>
      <div className="mx-conteneur" style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '14px' : '24px' }}>

        {/* En-tête — CLASSIQUE (inchangé) */}
        <div className="e-hero-classique" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                {onRetour && (
                  <button onClick={onRetour} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: '14px', fontWeight: 600, padding: 0 }}>
                    ← Retour
                  </button>
                )}
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>🚚 Méthodes d'expédition</h1>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
                Configurez vos options de livraison. Les acheteurs choisissent parmi vos méthodes actives au checkout.
              </p>
            </div>
            <button
              onClick={sauvegarder}
              disabled={saving}
              style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 2px 8px rgba(83,115,115,0.3)' }}
            >
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder tout'}
            </button>
          </div>
          <div style={{ marginTop: '12px' }}><BoutonGuide surFondFonce={false} /></div>
        </div>

        {/* En-tête — VIBRANT (tous les autres thèmes) */}
        <div className="e-hero-vibrant" style={{ marginBottom: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--e-accent, #537373), var(--e-accent-dark, #3d5a5a))',
            borderRadius: C.radius, padding: '22px 26px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  {onRetour && (
                    <button onClick={onRetour} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: 600, padding: 0, opacity: 0.9 }}>
                      ← Retour
                    </button>
                  )}
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>🚚 Méthodes d'expédition</h1>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  Configurez vos options de livraison. Les acheteurs choisissent parmi vos méthodes actives au checkout.
                </p>
              </div>
              <button
                onClick={sauvegarder}
                disabled={saving}
                style={{ background: '#fff', color: 'var(--e-accent-dark, #3d5a5a)', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder tout'}
              </button>
            </div>
            {/* Bouton du guide — à gauche, en bas de l'encadré */}
            <div style={{ position: 'relative', zIndex: 2, marginTop: '16px' }}><BoutonGuide surFondFonce={true} /></div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, background: message.type === 'success' ? C.greenLight : C.redLight, border: `1px solid ${message.type === 'success' ? C.greenBorder : C.redBorder}`, color: message.type === 'success' ? C.green : C.red }}>
            {message.texte}
          </div>
        )}

        {/* Info */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#1e40af', display: 'flex', gap: '10px' }}>
          <span style={{ flexShrink: 0 }}>ℹ️</span>
          <span>Activez les transporteurs que vous utilisez et configurez leur mode de calcul. Les acheteurs voient uniquement vos méthodes actives avec le prix calculé automatiquement.</span>
        </div>

        {/* 🆕 Livraison gratuite globale — prime sur tout, manuel ET auto */}
        <div style={{ background: C.white, border: `2px solid ${livraisonGratuiteActif ? C.green : C.border}`, borderRadius: C.radius, padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 3px' }}>
                🎉 Livraison gratuite à partir d'un montant d'achat
              </p>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0, lineHeight: 1.5 }}>
                Une fois le seuil atteint (après rabais/code promo), les frais d'expédition sont ramenés à 0 $ — que ce soit une méthode manuelle ci-dessous ou le calcul automatique en temps réel. Prime sur toute autre configuration.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={livraisonGratuiteActif}
                onChange={() => setLivraisonGratuiteActif(!livraisonGratuiteActif)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '24px',
                background: livraisonGratuiteActif ? C.green : '#ccc', transition: '0.2s',
              }}>
                <span style={{
                  position: 'absolute', height: '18px', width: '18px', left: livraisonGratuiteActif ? '23px' : '3px',
                  bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.2s',
                }} />
              </span>
            </label>
          </div>

          {livraisonGratuiteActif && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Montant d'achat minimum ($ CAD)
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={livraisonGratuiteSeuil}
                  onChange={e => setLivraisonGratuiteSeuil(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '14px', width: '180px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Provinces concernées
                </label>
                <p style={{ fontSize: '11px', color: C.textMuted, margin: '0 0 8px' }}>
                  Aucune sélection = toutes les provinces.
                </p>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setLivraisonGratuiteProvinces([])}
                    style={{
                      fontSize: '12px', fontWeight: 600, color: C.teal, background: 'white',
                      border: `1px solid ${C.teal}`, borderRadius: '20px', padding: '4px 12px', cursor: 'pointer',
                    }}
                  >
                    Toutes les provinces
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PROVINCES.map(p => {
                    const selectionnee = livraisonGratuiteProvinces.includes(p.code);
                    return (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => {
                          setLivraisonGratuiteProvinces(prev =>
                            selectionnee ? prev.filter(c => c !== p.code) : [...prev, p.code]
                          );
                        }}
                        style={{
                          fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '20px',
                          cursor: 'pointer',
                          border: selectionnee ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                          background: selectionnee ? C.tealLight : 'white',
                          color: selectionnee ? C.tealDark : C.textLight,
                        }}
                      >
                        {p.code} — {p.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste transporteurs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {TRANSPORTEURS_AFFICHES.map(t => {
            const estActif = actifs.includes(t.id);
            const cfg = configs.get(t.id);
            const enEd = enEdition === t.id;

            return (
              <div key={t.id} style={{ background: C.white, borderRadius: C.radius, border: `2px solid ${estActif ? C.teal : C.border}`, overflow: 'hidden', transition: 'all 0.2s', boxShadow: estActif ? '0 2px 12px rgba(83,115,115,0.15)' : 'none' }}>

                {/* En-tête transporteur */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: estActif ? C.tealLight : C.white, cursor: 'pointer' }}
                  onClick={() => toggleActif(t.id)}>
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>{t.logo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: C.text }}>{t.nom}</span>
                      {estActif && <span style={{ background: C.green, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>✓ Actif</span>}
                      {t.id === 14 && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid #fde68a' }}>Recommandé produits numériques</span>}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textLight }}>{t.desc}</p>
                  </div>
                  {/* Toggle switch */}
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: estActif ? C.teal : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: estActif ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {/* Section config (visible si actif) */}
                {estActif && cfg && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px', background: '#fafbfc' }}>
                    {!enEd ? (
                      /* ── RÉSUMÉ ── */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '13px', color: C.textLight }}>
                            <strong>Mode:</strong> {MODES_CALCUL.find(m => m.value === cfg.mode_calcul)?.label || cfg.mode_calcul}
                          </span>
                          {(cfg.mode_calcul === 'fixe' || cfg.mode_calcul === 'fixe_kg') && cfg.frais_fixes !== null && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>💰 Frais fixe:</strong> {cfg.frais_fixes} $</span>
                          )}
                          {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && cfg.frais_par_kg && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>⚖️ Par kg:</strong> {cfg.frais_par_kg} $/kg</span>
                          )}
                          {cfg.mode_calcul === 'zone' && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>🗺️ Zones:</strong> {Object.keys(cfg.frais_zones || {}).length} provinces configurées</span>
                          )}
                          {cfg.gratuit_superieur && (
                            <span style={{ fontSize: '13px', color: C.green, fontWeight: 600 }}>🎁 Gratuit dès {cfg.gratuit_superieur} $</span>
                          )}
                          {cfg.combine_shipping && (
                            <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>📦 Combine shipping actif</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => setEnEdition(t.id)}
                            style={{ background: 'none', border: `1px solid ${C.teal}`, color: C.teal, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            ⚙️ Configurer
                          </button>
                          {/* 🆕 Supprimer — transporteurs personnalisés seulement (les 14 fixes se désactivent, ne se suppriment pas) */}
                          {[101, 102].includes(t.id) && (
                            confirmSuppression === t.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: C.red, fontWeight: 600, maxWidth: '190px' }}>
                                  ⚠️ Retirer "{t.nom}" ? Cliquez ensuite sur <strong>💾 Sauvegarder tout</strong> en haut pour rendre la suppression définitive. Les annonces qui l'utilisent perdront cette méthode.
                                </span>
                                <button
                                  onClick={() => {
                                    setPersonnalises(prev => prev.filter(p => p.id !== t.id));
                                    setActifs(prev => prev.filter(id => id !== t.id));
                                    setConfigs(prev => { const c = new Map(prev); c.delete(t.id); return c; });
                                    if (enEdition === t.id) setEnEdition(null);
                                    setConfirmSuppression(null);
                                    // ✅ Rappel visible : la suppression n'est pas
                                    // encore enregistrée tant que le vendeur n'a
                                    // pas cliqué sur "Sauvegarder tout".
                                    setMessage({ type: 'error', texte: `🗑️ "${t.nom}" retiré — cliquez sur 💾 Sauvegarder tout pour confirmer la suppression.` });
                                  }}
                                  style={{ background: C.red, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                  Retirer
                                </button>
                                <button
                                  onClick={() => setConfirmSuppression(null)}
                                  style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textLight, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmSuppression(t.id)}
                                style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                🗑️ Supprimer
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ── FORMULAIRE CONFIG ── */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* 🆕 Nom + logo — transporteurs personnalisés seulement */}
                        {[101, 102].includes(t.id) && (
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <label style={s.label}>Nom du transporteur *</label>
                              <input
                                type="text"
                                value={personnalises.find(p => p.id === t.id)?.nom || ''}
                                onChange={e => setPersonnalises(prev => prev.map(p => p.id === t.id ? { ...p, nom: e.target.value } : p))}
                                placeholder="Ex : Coursier régional XYZ"
                                maxLength={100}
                                style={s.input}
                              />
                            </div>
                            <div>
                              <label style={s.label}>Logo</label>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                {LOGOS_PERSONNALISES.map(logo => {
                                  const choisi = (personnalises.find(p => p.id === t.id)?.logo || '📦') === logo;
                                  return (
                                    <button
                                      key={logo}
                                      type="button"
                                      onClick={() => setPersonnalises(prev => prev.map(p => p.id === t.id ? { ...p, logo } : p))}
                                      style={{
                                        width: '34px', height: '34px', fontSize: '17px', borderRadius: '8px',
                                        border: choisi ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                                        background: choisi ? C.tealLight : C.white, cursor: 'pointer',
                                      }}
                                    >
                                      {logo}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mode de calcul */}
                        <div>
                          <label style={s.label}>Mode de calcul *</label>
                          <div className="mx-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                            {MODES_CALCUL.filter(m => t.id === 14 ? m.value === 'fixe' : true).map(mode => (
                              <div key={mode.value}
                                onClick={() => updateConfig(t.id, 'mode_calcul', mode.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: `2px solid ${cfg.mode_calcul === mode.value ? C.teal : C.border}`, background: cfg.mode_calcul === mode.value ? C.tealLight : C.white, cursor: 'pointer', transition: 'all 0.15s' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: cfg.mode_calcul === mode.value ? C.tealDark : C.text }}>{mode.label}</div>
                                <div style={{ fontSize: '11px', color: C.textMuted, marginTop: '2px' }}>{mode.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Champs selon le mode */}
                        <div className="mx-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          {/* Frais fixe */}
                          {(cfg.mode_calcul === 'fixe' || cfg.mode_calcul === 'fixe_kg') && (
                            <div>
                              <label style={s.label}>Frais fixe ($) {t.id !== 14 && '*'}</label>
                              <input type="number" step="0.01" min="0"
                                value={cfg.frais_fixes ?? ''}
                                onChange={e => updateConfig(t.id, 'frais_fixes', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="9.99" style={s.input} />
                            </div>
                          )}
                          {/* Frais par kg */}
                          {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && (
                            <div>
                              <label style={s.label}>Frais par kg ($/kg) *</label>
                              <input type="number" step="0.01" min="0"
                                value={cfg.frais_par_kg ?? ''}
                                onChange={e => updateConfig(t.id, 'frais_par_kg', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="2.50" style={s.input} />
                            </div>
                          )}
                          {/* Gratuit dès */}
                          <div>
                            <label style={s.label}>🎁 Livraison gratuite dès ($)</label>
                            <input type="number" step="0.01" min="0"
                              value={cfg.gratuit_superieur ?? ''}
                              onChange={e => updateConfig(t.id, 'gratuit_superieur', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="50.00 (optionnel)" style={s.input} />
                          </div>
                          {/* Délais */}
                          <div>
                            <label style={s.label}>⏱️ Délais estimés</label>
                            <input type="text"
                              value={cfg.delais_estime}
                              onChange={e => updateConfig(t.id, 'delais_estime', e.target.value)}
                              placeholder="2-5 jours ouvrables" style={s.input} />
                          </div>
                        </div>

                        {/* Frais par province */}
                        {cfg.mode_calcul === 'zone' && (
                          <div>
                            <label style={s.label}>🗺️ Frais par province (toutes requises) *</label>
                            <div className="mx-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                              {PROVINCES.map(p => {
                                const val = cfg.frais_zones?.[p.code];
                                const estNon = val === null;
                                const estVide = val === undefined;
                                return (
                                  <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: estNon ? C.redLight : estVide ? C.yellowLight : C.greenLight, border: `1px solid ${estNon ? C.redBorder : estVide ? C.yellowBorder : C.greenBorder}` }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, width: '28px', flexShrink: 0 }}>{p.code}</span>
                                    <span style={{ fontSize: '11px', color: C.textLight, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</span>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                                      <input type="number" step="0.01" min="0"
                                        value={estNon ? '' : (val || '')}
                                        disabled={estNon}
                                        onChange={e => updateZone(t.id, p.code, e.target.value)}
                                        placeholder="0.00"
                                        style={{ ...s.input, width: '70px', padding: '4px 6px', fontSize: '12px', opacity: estNon ? 0.5 : 1 }} />
                                      <button
                                        onClick={() => updateZone(t.id, p.code, estNon ? '' : 'non')}
                                        title={estNon ? 'Activer cette province' : 'Ne pas expédier'}
                                        style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: `1px solid ${estNon ? C.green : C.red}`, background: estNon ? C.greenLight : C.redLight, color: estNon ? C.green : C.red, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {estNon ? '✓ ON' : '✕ OFF'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p style={{ fontSize: '11px', color: C.textMuted, marginTop: '6px' }}>
                              Laissez 0 pour gratuit. Cliquez ✕ OFF pour ne pas expédier dans cette province.
                            </p>
                          </div>
                        )}

                        {/* Combine shipping */}
                        {t.id !== 13 && t.id !== 14 && (
                          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <input type="checkbox" id={`combine_${t.id}`}
                                checked={cfg.combine_shipping}
                                onChange={e => updateConfig(t.id, 'combine_shipping', e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                              <label htmlFor={`combine_${t.id}`} style={{ fontWeight: 700, fontSize: '14px', color: '#5b21b6', cursor: 'pointer' }}>
                                📦 Offrir le Combine Shipping
                              </label>
                            </div>
                            {cfg.combine_shipping && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '26px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input type="checkbox" id={`fixe_unique_${t.id}`}
                                    checked={cfg.combine_frais_fixe_unique}
                                    onChange={e => updateConfig(t.id, 'combine_frais_fixe_unique', e.target.checked)}
                                    style={{ width: '14px', height: '14px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                                  <label htmlFor={`fixe_unique_${t.id}`} style={{ fontSize: '13px', color: '#6d28d9', cursor: 'pointer' }}>
                                    Frais fixe chargé une seule fois (peu importe le nombre d'articles)
                                  </label>
                                </div>
                                {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id={`kg_add_${t.id}`}
                                      checked={cfg.combine_kg_additionne}
                                      onChange={e => updateConfig(t.id, 'combine_kg_additionne', e.target.checked)}
                                      style={{ width: '14px', height: '14px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                                    <label htmlFor={`kg_add_${t.id}`} style={{ fontSize: '13px', color: '#6d28d9', cursor: 'pointer' }}>
                                      Additionner le poids de tous les articles
                                      {!cfg.combine_kg_additionne && ' (sinon: poids du plus lourd seulement)'}
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Boutons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setEnEdition(null)}
                            style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            ✓ Terminé
                          </button>
                          <button onClick={() => { setConfigs(p => { const m = new Map(p); m.set(t.id, configParDefaut(t.id)); return m; }); setEnEdition(null); }}
                            style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textLight, borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
                            🔄 Réinitialiser
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🆕 Ajouter un transporteur personnalisé (max 2) */}
        {personnalises.length < 2 && (
          <button
            type="button"
            onClick={() => {
              const idLibre = [101, 102].find(id => !personnalises.some(p => p.id === id))!;
              setPersonnalises(prev => [...prev, { id: idLibre, nom: '', logo: '📦' }]);
              setActifs(prev => [...prev, idLibre]);
              setConfigs(prev => { const c = new Map(prev); c.set(idLibre, configParDefaut(idLibre)); return c; });
              setEnEdition(idLibre);
            }}
            style={{
              marginTop: '14px', width: '100%', padding: '14px', borderRadius: '12px',
              border: `2px dashed ${C.border}`, background: 'transparent', color: C.textLight,
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            ➕ Ajouter un transporteur personnalisé {personnalises.length > 0 && `(${personnalises.length}/2)`}
          </button>
        )}

        {/* Récap */}
        {actifs.length > 0 && (
          <div style={{ marginTop: '20px', background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: C.text }}>📋 Vos méthodes actives</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {actifs.map(id => {
                const t = TRANSPORTEURS_AFFICHES.find(t => t.id === id);
                const cfg = configs.get(id);
                return (
                  <div key={id} style={{ padding: '6px 12px', background: C.tealLight, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: C.tealDark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t?.logo}</span>
                    <span>{t?.nom}</span>
                    {cfg?.mode_calcul === 'fixe' && cfg.frais_fixes !== null && (
                      <span style={{ background: C.teal, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>{cfg.frais_fixes} $</span>
                    )}
                    {cfg?.mode_calcul === 'zone' && <span style={{ background: C.teal, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>Zones</span>}
                    {cfg?.gratuit_superieur && <span style={{ background: C.green, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>Gratuit dès {cfg.gratuit_superieur}$</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles communs
const s = {
  label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e1e3e5', borderRadius: '6px', fontSize: '14px', color: '#1a2332', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
};