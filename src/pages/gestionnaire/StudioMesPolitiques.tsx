/**
 * StudioMesPolitiques.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioMesPolitiques.tsx
 *
 * Permet à chaque vendeur de rédiger les 6 politiques de SON site :
 *   - Retour & remboursement
 *   - Confidentialité
 *   - Conditions de service
 *   - Expédition
 *   - Coordonnées
 *   - Mentions légales
 *
 * Routes API :
 *   GET /api/studio/politiques/:gestionnaireId         → toutes les politiques
 *   PUT /api/studio/politiques/:gestionnaireId/:slug   → sauvegarder
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Politique {
  slug:       string;
  titre:      string;
  contenu:    string;
  updated_at: string | null;
}

// ─── Config des 6 politiques ─────────────────────────────────────────────────
const POLITIQUES_CONFIG = [
  {
    slug:        'retour-remboursement',
    titre:       'Retour & remboursement',
    icone:       '↩️',
    description: 'Conditions de retour, remboursement et échange pour vos clients.',
    modele: `<h1>Politique de retour et de remboursement</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Conditions de retour</h2>
<p>Nous acceptons les retours dans un délai de 30 jours suivant la date de livraison, sous réserve que les articles soient dans leur état d'origine, non utilisés et dans leur emballage d'origine.</p>

<h2>2. Articles non retournables</h2>
<ul>
  <li>Produits numériques téléchargés</li>
  <li>Articles en vente finale clairement identifiés</li>
  <li>Produits personnalisés ou sur commande</li>
</ul>

<h2>3. Processus de remboursement</h2>
<p>Une fois votre retour reçu et inspecté, nous vous informerons par courriel. Si approuvé, le remboursement sera traité dans un délai de 5 à 10 jours ouvrables.</p>

<h2>4. Contact</h2>
<p>Pour initier un retour, contactez-nous via le formulaire de contact de notre site.</p>`,
  },
  {
    slug:        'confidentialite',
    titre:       'Confidentialité',
    icone:       '🔒',
    description: 'Protection des données personnelles de vos visiteurs et clients.',
    modele: `<h1>Politique de confidentialité</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<p>Nous nous engageons à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.</p>

<h2>1. Informations collectées</h2>
<ul>
  <li>Informations d'identification (nom, courriel, adresse)</li>
  <li>Informations de paiement (traitées de façon sécurisée par Stripe)</li>
  <li>Données d'utilisation et de navigation</li>
</ul>

<h2>2. Utilisation des données</h2>
<p>Vos données sont utilisées pour traiter vos commandes, améliorer nos services et vous contacter au sujet de votre compte.</p>

<h2>3. Vos droits</h2>
<p>Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles. Contactez-nous via notre formulaire de contact.</p>`,
  },
  {
    slug:        'conditions-service',
    titre:       'Conditions de service',
    icone:       '📋',
    description: "Termes et conditions d'utilisation de votre site.",
    modele: `<h1>Conditions de service</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Acceptation des conditions</h2>
<p>En utilisant ce site, vous acceptez les présentes conditions de service. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>

<h2>2. Description du service</h2>
<p>Ce site vous permet de découvrir nos produits et services, et d'effectuer des achats en ligne de façon sécurisée.</p>

<h2>3. Comptes utilisateurs</h2>
<p>Vous êtes responsable de maintenir la confidentialité de votre compte et de toutes les activités qui s'y déroulent.</p>

<h2>4. Limitation de responsabilité</h2>
<p>Nous ne sommes pas responsables des dommages indirects résultant de l'utilisation de ce site.</p>`,
  },
  {
    slug:        'expedition',
    titre:       "Expédition",
    icone:       '📦',
    description: "Délais, frais et zones de livraison pour vos commandes.",
    modele: `<h1>Politique d'expédition</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Délais de traitement</h2>
<p>Les commandes sont généralement traitées dans un délai de 1 à 3 jours ouvrables après la confirmation du paiement.</p>

<h2>2. Zones de livraison</h2>
<p>Nous livrons partout au Canada. Des options de livraison internationale peuvent être disponibles selon les produits.</p>

<h2>3. Suivi de commande</h2>
<p>Un numéro de suivi vous sera fourni par courriel dès que votre commande sera expédiée.</p>

<h2>4. Problèmes de livraison</h2>
<p>En cas de colis perdu ou endommagé, contactez-nous immédiatement via notre formulaire de contact.</p>`,
  },
  {
    slug:        'coordonnees',
    titre:       'Coordonnées',
    icone:       '📍',
    description: 'Informations de contact de votre entreprise.',
    modele: `<h1>Coordonnées</h1>

<h2>Nous joindre</h2>

<p>Pour toute question, n'hésitez pas à nous contacter via le formulaire de contact disponible sur notre site.</p>

<h2>Heures de service</h2>
<p>Lundi au vendredi : 9h00 - 17h00 (EST)</p>

<h2>Délai de réponse</h2>
<p>Nous nous engageons à répondre à toutes les demandes dans un délai de 24 à 48 heures ouvrables.</p>`,
  },
  {
    slug:        'mentions-legales',
    titre:       'Mentions légales',
    icone:       '⚖️',
    description: 'Informations juridiques et légales de votre entreprise.',
    modele: `<h1>Mentions légales</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>Éditeur du site</h2>
<p>Ce site est exploité dans le cadre d'une activité commerciale légalement constituée au Canada.</p>

<h2>Hébergement</h2>
<p>Ce site est hébergé via la plateforme e-Vend Studio.</p>

<h2>Propriété intellectuelle</h2>
<p>Tous les contenus présents sur ce site (textes, images, logos) sont protégés par le droit d'auteur. Toute reproduction est interdite sans autorisation préalable.</p>

<h2>Droit applicable</h2>
<p>Les présentes mentions légales sont soumises au droit canadien et québécois.</p>`,
  },
];

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e2e8f0',
  gold:        '#c9a96e',
  goldLight:   'rgba(201,169,110,0.12)',
  goldHover:   '#a07840',
  green:       '#10b981',
  greenLight:  'rgba(16,185,129,0.10)',
  red:         '#ef4444',
  orange:      '#f59e0b',
  orangeLight: 'rgba(245,158,11,0.10)',
  text:        '#1e293b',
  textLight:   '#64748b',
  textXLight:  '#94a3b8',
  border2:     '#cbd5e1',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red,
      color: '#fff', padding: '11px 24px',
      borderRadius: '12px', fontSize: '14px',
      fontWeight: 700, zIndex: 9999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease',
      whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioMesPolitiques({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [politiques, setPolitiques]     = useState<Record<string, string>>({});
  const [original, setOriginal]         = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [ongletActif, setOngletActif]   = useState(0);
  const [modeApercu, setModeApercu]     = useState(false);
  const [updatedAt, setUpdatedAt]       = useState<Record<string, string | null>>({});
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  const configActuelle = POLITIQUES_CONFIG[ongletActif];
  const contenuActuel  = politiques[configActuelle?.slug] ?? '';
  const modifie        = contenuActuel !== (original[configActuelle?.slug] ?? '');
  const aContenu       = contenuActuel.trim().length > 0;

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/politiques/${gestionnaireId}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const map: Record<string, string>      = {};
      const dates: Record<string, string | null> = {};
      (data.politiques || []).forEach((p: Politique) => {
        map[p.slug]   = p.contenu ?? '';
        dates[p.slug] = p.updated_at;
      });
      setPolitiques(map);
      setOriginal({ ...map });
      setUpdatedAt(dates);
    } catch {
      // Garder les champs vides
    } finally {
      setLoading(false);
    }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/politiques/${gestionnaireId}/${configActuelle.slug}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: contenuActuel, titre: configActuelle.titre }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOriginal(prev => ({ ...prev, [configActuelle.slug]: contenuActuel }));
      setUpdatedAt(prev => ({ ...prev, [configActuelle.slug]: data.politique?.updated_at }));
      setToast({ msg: 'Politique sauvegardée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally {
      setSaving(false);
    }
  }

  // ── Insérer modèle ────────────────────────────────────────────────────────
  function insererModele() {
    if (aContenu && !window.confirm('Remplacer le contenu actuel par le modèle ?')) return;
    setPolitiques(prev => ({ ...prev, [configActuelle.slug]: configActuelle.modele }));
    setModeApercu(false);
  }

  // ── Insérer balise HTML ───────────────────────────────────────────────────
  function insererBalise(avant: string, apres: string = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const slug    = configActuelle.slug;
    const contenu = politiques[slug] || '';
    const debut   = ta.selectionStart;
    const fin     = ta.selectionEnd;
    const sel     = contenu.slice(debut, fin);
    const nouveau = contenu.slice(0, debut) + avant + sel + apres + contenu.slice(fin);
    setPolitiques(prev => ({ ...prev, [slug]: nouveau }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + sel.length);
    }, 10);
  }

  // ── Aperçu HTML ──────────────────────────────────────────────────────────
  const estHTML      = /<[a-z][\s\S]*>/i.test(contenuActuel);
  const contenuApercu = estHTML ? contenuActuel : contenuActuel
    .split('\n')
    .map(l => l.trim() ? `<p>${l}</p>` : '<br/>')
    .join('');

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Chargement ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📜</div>
          <p style={{ margin: 0, fontSize: '14px' }}>Chargement de vos politiques…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
        .toolbar-btn:hover  { background: #c9a96e !important; color: #fff !important; }
        .onglet-pol:hover   { background: rgba(201,169,110,0.06) !important; }
        .btn-modele:hover   { background: rgba(201,169,110,0.15) !important; }
        .politique-apercu h1 { font-size:22px; font-weight:800; margin:0 0 16px; color:${C.text}; border-bottom:2px solid ${C.gold}; padding-bottom:8px; }
        .politique-apercu h2 { font-size:16px; font-weight:700; margin:20px 0 8px; color:${C.text}; border-bottom:1px solid ${C.border}; padding-bottom:4px; }
        .politique-apercu h3 { font-size:14px; font-weight:700; margin:14px 0 6px; color:${C.text}; }
        .politique-apercu p  { margin:0 0 10px; line-height:1.7; color:${C.textLight}; font-size:14px; }
        .politique-apercu ul,.politique-apercu ol { margin:0 0 10px; padding-left:22px; }
        .politique-apercu li { margin-bottom:4px; color:${C.textLight}; line-height:1.6; font-size:14px; }
        .politique-apercu a  { color:${C.gold}; text-decoration:underline; }
        .politique-apercu strong { color:${C.text}; }
        .politique-apercu blockquote { border-left:3px solid ${C.gold}; padding:8px 16px; margin:12px 0; background:${C.goldLight}; border-radius:0 8px 8px 0; color:${C.textLight}; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ══ En-tête ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #c9a96e, #a07840)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)',
          }}>📜</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Mes politiques</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Rédigez les 6 politiques légales de votre site</p>
          </div>
        </div>
      </div>

      {/* ══ Bandeau explicatif ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)',
        border: `1px solid rgba(201,169,110,0.25)`,
        borderRadius: '16px', padding: '18px 22px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}>
        <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 700, color: C.gold }}>
            Pourquoi des politiques ?
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            Les politiques légales protègent votre entreprise et inspirent confiance à vos visiteurs. Rédigez-les en HTML ou en texte simple — un modèle est disponible pour chacune. Elles seront affichées sur votre site automatiquement.
          </p>
        </div>
      </div>

      {/* ══ Layout sidebar + éditeur ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '1px', padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
            Vos politiques
          </p>

          {POLITIQUES_CONFIG.map((config, idx) => {
            const definie   = (politiques[config.slug] ?? '').trim().length > 0;
            const estActif  = idx === ongletActif;
            return (
              <button
                key={config.slug}
                className="onglet-pol"
                onClick={() => { setOngletActif(idx); setModeApercu(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', border: 'none', cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  background: estActif ? C.goldLight : 'transparent',
                  borderLeft: estActif ? `3px solid ${C.gold}` : '3px solid transparent',
                  transition: 'all 0.15s', justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{config.icone}</span>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: estActif ? 700 : 500, color: estActif ? C.gold : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {config.titre}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>
                      {definie ? 'Rédigée' : 'Non rédigée'}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                  borderRadius: '20px', flexShrink: 0,
                  background: definie ? C.greenLight : '#f3f4f6',
                  color: definie ? C.green : C.textXLight,
                }}>
                  {definie ? '✓' : '—'}
                </span>
              </button>
            );
          })}

          {/* Compteur */}
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: '12px', color: C.textLight, textAlign: 'center' }}>
              {Object.values(politiques).filter(v => v.trim().length > 0).length} / {POLITIQUES_CONFIG.length} politiques rédigées
            </p>
          </div>
        </div>

        {/* ── Éditeur principal ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: 'slideIn 0.2s ease' }} key={configActuelle.slug}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${C.border}`, background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{configActuelle.icone}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.text }}>{configActuelle.titre}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>{configActuelle.description}</p>
                {updatedAt[configActuelle.slug] && (
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textXLight }}>
                    Mis à jour : {formatDate(updatedAt[configActuelle.slug])}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {modifie && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange, background: C.orangeLight, padding: '3px 10px', borderRadius: '20px' }}>
                  ● Non sauvegardé
                </span>
              )}
              <button
                className="btn-modele"
                onClick={insererModele}
                style={{ padding: '7px 14px', background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: C.gold, fontWeight: 600, transition: 'all 0.15s' }}
              >
                {aContenu ? '🔄 Réinitialiser le modèle' : '📄 Insérer un modèle'}
              </button>
              <button
                onClick={() => setModeApercu(!modeApercu)}
                style={{ padding: '7px 14px', background: modeApercu ? C.gold : '#f0f2f5', border: `1px solid ${modeApercu ? C.gold : C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: modeApercu ? '#fff' : C.text, fontWeight: 600 }}
              >
                {modeApercu ? '✏️ Éditer' : '👁 Aperçu'}
              </button>
            </div>
          </div>

          {/* Mode aperçu */}
          {modeApercu ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                <span style={{ fontSize: '13px', color: C.textLight }}>Aperçu de rendu — tel qu'il apparaîtra sur votre site</span>
                <button onClick={() => setModeApercu(false)} style={{ padding: '5px 12px', background: '#f0f2f5', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: C.text, fontWeight: 600 }}>
                  ✏️ Retour à l'édition
                </button>
              </div>
              {aContenu ? (
                <div className="politique-apercu" style={{ padding: '36px 48px', maxHeight: '600px', overflowY: 'auto', fontSize: '14px', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: contenuApercu }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
                  <p style={{ fontSize: '40px', marginBottom: '10px' }}>📝</p>
                  <p>Aucun contenu à afficher. Commencez à rédiger ou insérez un modèle.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Barre d'outils HTML */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', background: '#f8fafc' }}>
                <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' }}>Mise en forme :</span>
                {[
                  { label: 'G',   avant: '<strong>', apres: '</strong>', title: 'Gras' },
                  { label: 'I',   avant: '<em>',     apres: '</em>',     title: 'Italique' },
                  { label: 'H1',  avant: '<h1>',     apres: '</h1>',     title: 'Titre principal' },
                  { label: 'H2',  avant: '<h2>',     apres: '</h2>',     title: 'Titre section' },
                  { label: 'H3',  avant: '<h3>',     apres: '</h3>',     title: 'Sous-titre' },
                  { label: '🔗',  avant: '<a href="">', apres: '</a>',   title: 'Lien' },
                  { label: '📋',  avant: '<ul>\n  <li>', apres: '</li>\n</ul>', title: 'Liste à puces' },
                  { label: '1.',  avant: '<ol>\n  <li>', apres: '</li>\n</ol>', title: 'Liste numérotée' },
                  { label: '💬',  avant: '<blockquote>', apres: '</blockquote>', title: 'Citation' },
                  { label: '—',   avant: '\n<hr />\n', apres: '',        title: 'Séparateur' },
                  { label: '§',   avant: '<p>',      apres: '</p>',      title: 'Paragraphe' },
                ].map(btn => (
                  <button
                    key={btn.label}
                    className="toolbar-btn"
                    title={btn.title}
                    onClick={() => insererBalise(btn.avant, btn.apres)}
                    style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: C.text, transition: 'all 0.15s', minWidth: '28px' }}
                  >
                    {btn.label}
                  </button>
                ))}
                <div style={{ width: '1px', height: '20px', background: C.border, margin: '0 4px' }} />
                <span style={{ fontSize: '11px', color: C.textXLight }}>HTML supporté</span>
              </div>

              {/* Zone de texte */}
              <textarea
                ref={textareaRef}
                value={contenuActuel}
                onChange={e => setPolitiques(prev => ({ ...prev, [configActuelle.slug]: e.target.value }))}
                placeholder={`Rédigez votre politique "${configActuelle.titre}" ici…\n\nUtilisez les boutons ci-dessus pour formater en HTML.\nOu cliquez sur "Insérer un modèle" pour commencer avec un exemple.`}
                spellCheck={false}
                style={{ width: '100%', minHeight: '460px', padding: '20px', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.7', color: C.text, resize: 'vertical', boxSizing: 'border-box', background: '#fff' }}
              />

              {/* Footer éditeur */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: C.textLight }}>{contenuActuel.length} caractères</span>
                  {modifie && (
                    <span style={{ fontSize: '12px', color: C.orange, fontWeight: 600 }}>● Modifications non sauvegardées</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {modifie && (
                    <button
                      onClick={() => setPolitiques(prev => ({ ...prev, [configActuelle.slug]: original[configActuelle.slug] ?? '' }))}
                      style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: C.textLight, fontWeight: 600 }}
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={sauvegarder}
                    disabled={saving || !modifie}
                    style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', boxShadow: modifie ? '0 4px 12px rgba(201,169,110,0.35)' : 'none', transition: 'all 0.15s' }}
                  >
                    {saving ? '⏳ Sauvegarde…' : '💾 Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}