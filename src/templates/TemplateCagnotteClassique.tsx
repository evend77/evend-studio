// src/templates/TemplateCagnotteClassique.tsx
// e-Vend Studio — Cagnotte « Classique » : page publique d'une campagne de dons, avec fenêtre de don (Stripe et/ou PayPal du gestionnaire).
// Aucune commission : les dons vont directement sur le compte de l'organisateur.
// Les dons ne s'ouvrent qu'une fois la campagne publiée (paiement du prix fixe fait) — l'état vient de GET /api/dons/public/:siteId.

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ─────────────────────────────────────────────────────────

export type SousTypeCagnotte = 'personnel' | 'projet' | 'communaute' | 'environnement' | 'urgence';

export interface ConfigCagnotte {
  sousType: SousTypeCagnotte;
  nomEntreprise: string;
  slogan: string;
  logoUrl: string;
  photoHeroUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';

  // Campagne
  nomCampagne: string;
  descriptionCampagne: string;
  objectifMontant: number;
  photoCampagne: string;
  dateFinCampagne: string;
  nomOrganisateur: string;
  photoOrganisateur: string;
  bioOrganisateur: string;

  misesAJour: { date: string; titre: string; texte: string }[];

  montantsSuggeres: number[];
  montantMinimum: number;
  messageRemerciement: string;
  afficherDonateurs: boolean;

  // Contact / partage
  email: string;
  instagram: string;
  facebook: string;
  siteExterne: string;
}

const dansJours = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const CONFIG_CAGNOTTE_DEFAUT: ConfigCagnotte = {
  sousType: 'communaute',
  nomEntreprise: 'Comité des loisirs',
  slogan: 'Ensemble, redonnons vie à la patinoire du quartier',
  logoUrl: '',
  photoHeroUrl: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#1a1a1a',
  couleurFond: '#fafaf8',
  couleurTexte: '#1a1a1a',
  police: 'moderne',
  nomCampagne: 'Rénover la patinoire du quartier',
  descriptionCampagne: `Bonjour à tous,\n\nDepuis des années, la patinoire du quartier réunit les enfants, les familles et les aînés. Aujourd'hui, la baie vitrée est fissurée et l'éclairage ne suffit plus.\n\nVotre don servira à :\n• remplacer l'éclairage par des projecteurs DEL ;\n• réparer les bandes et la surface ;\n• installer de nouveaux bancs.\n\nChaque dollar compte. Merci de faire partie de cette belle aventure !`,
  objectifMontant: 5000,
  photoCampagne: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
  dateFinCampagne: dansJours(60),
  nomOrganisateur: 'Comité des loisirs du quartier',
  photoOrganisateur: '',
  bioOrganisateur: 'Une équipe de bénévoles qui organise les activités du quartier depuis 2015.',
  misesAJour: [
    { date: new Date().toISOString(), titre: 'Merci pour votre soutien !', texte: 'Grâce à vous, nous avons déjà amassé une première tranche de notre objectif. Chaque don compte !' },
  ],
  montantsSuggeres: [10, 25, 50, 100],
  montantMinimum: 5,
  messageRemerciement: 'Merci infiniment pour votre générosité ! Votre don fait une réelle différence pour notre communauté.',
  afficherDonateurs: true,
  email: '',
  instagram: '',
  facebook: '',
  siteExterne: '',
};

// Textes de départ proposés dans la page de configuration (un clic pré-remplit les champs ; rien n'est imposé)
export const MODELES_CAGNOTTE: Record<SousTypeCagnotte, { label: string; emoji: string; slogan: string; nomCampagne: string; description: string; remerciement: string }> = {
  personnel: { label: 'Personnel', emoji: '❤️', slogan: "Votre soutien m'aide à avancer", nomCampagne: 'Aidez-moi à réaliser mon projet de vie',
    description: "Bonjour,\n\nJe me permets de vous écrire pour vous parler de ma situation et de ce que cette cagnotte permettra de réaliser.\n\n[Expliquez ici votre histoire, le besoin et à quoi serviront les fonds.]\n\nMerci du fond du cœur pour chaque geste.",
    remerciement: "Merci de tout cœur ! Votre geste compte énormément pour moi." },
  projet: { label: 'Projet', emoji: '🚀', slogan: 'Aidez-nous à donner vie à ce projet', nomCampagne: 'Financer notre projet créatif',
    description: "Bonjour,\n\nNous préparons un projet qui nous tient à cœur et nous avons besoin de vous pour le concrétiser.\n\n[Décrivez le projet, l'échéancier et l'utilisation précise des fonds.]\n\nChaque contribution nous rapproche du but.",
    remerciement: "Merci d'y croire avec nous ! Nous vous tiendrons au courant de l'avancement." },
  communaute: { label: 'Communauté', emoji: '🤝', slogan: 'Ensemble, on va plus loin', nomCampagne: 'Soutenir notre organisme',
    description: "Bonjour à tous,\n\nNotre organisme a besoin de votre appui pour poursuivre sa mission auprès de la communauté.\n\n[Présentez l'organisme, le besoin et l'impact attendu.]\n\nMerci de contribuer à cette belle cause collective.",
    remerciement: "Merci de votre générosité ! Grâce à vous, notre communauté avance." },
  environnement: { label: 'Environnement', emoji: '🌿', slogan: 'Agissons pour la nature', nomCampagne: 'Un geste pour la planète',
    description: "Bonjour,\n\nNous organisons une action concrète pour protéger notre environnement.\n\n[Décrivez l'action, le lieu, les résultats attendus et l'utilisation des fonds.]\n\nChaque don aide à faire une vraie différence.",
    remerciement: "Merci d'agir avec nous pour la nature !" },
  urgence: { label: 'Urgence', emoji: '🆘', slogan: 'Un coup de main est nécessaire maintenant', nomCampagne: "Soutien d'urgence",
    description: "Bonjour,\n\nUne situation urgente nous oblige à demander l'aide de la communauté.\n\n[Expliquez ce qui s'est passé, ce dont on a besoin en priorité et comment les fonds seront utilisés.]\n\nMerci de votre solidarité rapide.",
    remerciement: "Merci pour votre solidarité. Votre aide arrive au bon moment." },
};

// ─── HELPERS ────────────────────────────────────────────────────────
function getPoliceCSS(p: string) {
  switch (p) {
    case 'classique': return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default: return "'Inter', sans-serif";
  }
}
function getGoogleFonts(p: string) {
  switch (p) {
    case 'classique': return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap';
    case 'manuscrite': return 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap';
    default: return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  }
}
const EMOJI_TYPE: Record<SousTypeCagnotte, string> = { personnel: '❤️', projet: '🚀', communaute: '🤝', environnement: '🌿', urgence: '🆘' };
const couleurValide = (c: any, defaut: string) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : defaut);
// Lien réseau social : accepte un nom d'utilisateur ou une adresse https complète
const lienReseau = (base: string, v: string) => (/^https:\/\//i.test(v) ? v : `${base}${encodeURIComponent(v.replace(/^@/, '').trim())}`);
const argent = (n: number) => `${Number.isInteger(n) ? n.toLocaleString('fr-CA') : n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

interface EtatPublic {
  statut: 'non_publiee' | 'publiee' | 'terminee';
  ouvert: boolean;
  fin_le: string | null;
  objectif: number | null;
  modes: { stripe: boolean; paypal: boolean };
  don_min: number;
  don_max: number;
  total: string;
  count: number;
  dons: { id: number; nom_donateur: string; montant: string; message: string | null; created_at: string }[];
}

const AVIS_LEGAL = "Les dons sont versés directement à l'organisateur, qui est seul responsable de la collecte et de l'utilisation des fonds. e-Vend Studio ne perçoit aucune commission sur les dons. Sauf mention contraire de l'organisateur, un don ne donne pas droit à un reçu fiscal.";

// ─── MODAL DE DON ──────────────────────────────────────────────────────
interface ModalDonProps {
  config: ConfigCagnotte;
  cp: string; cs: string;
  siteId?: number;
  modes: { stripe: boolean; paypal: boolean };
  minimum: number;
  maximum: number;
  apercu: boolean;
  onClose: () => void;
}

function ModalDon({ config, cp, cs, siteId, modes, minimum, maximum, apercu, onClose }: ModalDonProps) {
  const [montant, setMontant] = useState<number | ''>(config.montantsSuggeres[1] || config.montantsSuggeres[0] || 25);
  const [montantCustom, setMontantCustom] = useState('');
  const [nomDonateur, setNomDonateur] = useState('');
  const [anonyme, setAnonyme] = useState(false);
  const [message, setMessage] = useState('');
  const [etape, setEtape] = useState<'form' | 'envoi'>('form');
  const [erreurMsg, setErreurMsg] = useState('');

  const montantFinal = montantCustom ? parseFloat(montantCustom.replace(',', '.')) : (typeof montant === 'number' ? montant : 0);
  const montantValide = Number.isFinite(montantFinal) ? montantFinal : 0;
  const nbModes = (modes.stripe ? 1 : 0) + (modes.paypal ? 1 : 0);

  const payer = async (mode: 'stripe' | 'paypal') => {
    setErreurMsg('');
    if (apercu) { setErreurMsg("Aperçu : les dons s'ouvriront une fois la campagne publiée."); return; }
    if (!montantValide || montantValide < minimum) { setErreurMsg(`Le montant minimum est de ${minimum} $.`); return; }
    if (montantValide > maximum) { setErreurMsg(`Le montant maximum est de ${maximum} $.`); return; }
    if (!anonyme && !nomDonateur.trim()) { setErreurMsg('Veuillez entrer votre nom ou cocher « Don anonyme ».'); return; }
    setEtape('envoi');
    try {
      const res = await fetch('/api/dons/creer-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, montant: Math.round(montantValide * 100) / 100, nom_donateur: anonyme ? 'Anonyme' : nomDonateur.trim(), anonyme, message: message.trim() || null, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.checkout_url) { window.location.href = data.checkout_url; return; }
      setEtape('form');
      setErreurMsg(data.message || 'Erreur lors de la création du paiement.');
    } catch {
      setEtape('form');
      setErreurMsg('Impossible de joindre le serveur. Réessayez dans un instant.');
    }
  };

  const labelBtn = (mode: 'stripe' | 'paypal') => etape === 'envoi' ? '⏳ Redirection…' : (mode === 'paypal' ? 'Payer avec PayPal' : (nbModes > 1 ? '💳 Payer par carte' : `💝 Faire un don de ${montantValide ? montantValide.toFixed(2) + ' $' : '…'}`));

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 480, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '92vh', overflowY: 'auto', color: '#1a1a1a' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>💝 Faire un don</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{config.nomCampagne}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lbl}>Choisir un montant</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 8, marginBottom: 10 }}>
              {config.montantsSuggeres.map(m => (
                <button key={m} onClick={() => { setMontant(m); setMontantCustom(''); }}
                  style={{ padding: '10px 6px', border: `2px solid ${montant === m && !montantCustom ? cp : '#e5e7eb'}`, borderRadius: 8, background: montant === m && !montantCustom ? `${cp}15` : '#fff', color: '#1a1a1a', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {m} $
                </button>
              ))}
            </div>
            <input type="text" inputMode="decimal" value={montantCustom} onChange={e => { setMontantCustom(e.target.value.replace(/[^0-9.,]/g, '')); setMontant(''); }}
              placeholder={`Autre montant (min. ${minimum} $)`} aria-label="Autre montant"
              style={{ width: '100%', padding: '11px 12px', border: `2px solid ${montantCustom ? cp : '#e5e7eb'}`, borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={lbl}>Votre nom</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div onClick={() => setAnonyme(!anonyme)} role="switch" aria-checked={anonyme}
                style={{ width: 40, height: 22, borderRadius: 11, background: anonyme ? cp : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: anonyme ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: '#555' }}>Don anonyme (votre nom n'apparaîtra pas)</span>
            </div>
            {!anonyme && (
              <input value={nomDonateur} onChange={e => setNomDonateur(e.target.value)} placeholder="Votre prénom et nom" maxLength={80}
                style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            )}
          </div>

          <div>
            <label style={lbl}>Message (optionnel)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={500} placeholder="Laissez un mot d'encouragement…"
              style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {erreurMsg && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', fontSize: 13 }}>⚠️ {erreurMsg}</div>}

          {montantValide > 0 && (
            <div style={{ background: `${cp}10`, border: `1px solid ${cp}30`, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Votre don</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: cp }}>{montantValide.toFixed(2)} $</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(modes.stripe || apercu) && (
              <button onClick={() => payer('stripe')} disabled={etape === 'envoi' || !montantValide}
                style={{ padding: 14, background: !montantValide ? '#e5e7eb' : `linear-gradient(135deg, ${cs}dd, ${cp})`, border: 'none', borderRadius: 12, color: !montantValide ? '#aaa' : '#fff', fontSize: 16, fontWeight: 800, cursor: montantValide ? 'pointer' : 'not-allowed' }}>
                {labelBtn('stripe')}
              </button>
            )}
            {modes.paypal && (
              <button onClick={() => payer('paypal')} disabled={etape === 'envoi' || !montantValide}
                style={{ padding: 14, background: !montantValide ? '#e5e7eb' : '#ffc439', border: 'none', borderRadius: 12, color: !montantValide ? '#aaa' : '#111', fontSize: 16, fontWeight: 800, cursor: montantValide ? 'pointer' : 'not-allowed' }}>
                {labelBtn('paypal')}
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#999', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            🔒 Paiement sécurisé{modes.stripe && modes.paypal ? ' par Stripe ou PayPal' : modes.paypal ? ' par PayPal' : ' par Stripe'}. {AVIS_LEGAL}
          </p>
        </div>
      </div>
    </div>
  );
}
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 };

// ─── BARRE DE PROGRESSION ──────────────────────────────────────────────
function BarreProgression({ total, objectif, cp, nbDonateurs }: { total: number; objectif: number; cp: string; nbDonateurs: number }) {
  const pct = objectif > 0 ? Math.min(Math.round((total / objectif) * 100), 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: cp }}>{argent(Math.round(total))}</span>
        <span style={{ fontSize: 13, color: '#888' }}>objectif {argent(objectif)}</span>
      </div>
      <div style={{ height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}
        role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${cp}cc, ${cp})`, borderRadius: 5, transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{pct} % atteint</span>
        <span style={{ fontSize: 13, color: '#888' }}>· {nbDonateurs} donateur{nbDonateurs > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────
interface Props {
  config?: Partial<ConfigCagnotte>;
  isPreviewMobile?: boolean;
  siteId?: number;
  vendeurId?: number;   // conservé pour compatibilité : le serveur retrouve lui-même le gestionnaire
}

export default function TemplateCagnotteClassique({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const config: ConfigCagnotte = { ...CONFIG_CAGNOTTE_DEFAUT, ...(configPartiel || {}) };
  if (!Array.isArray(config.montantsSuggeres) || !config.montantsSuggeres.length) config.montantsSuggeres = CONFIG_CAGNOTTE_DEFAUT.montantsSuggeres;
  if (!Array.isArray(config.misesAJour)) config.misesAJour = [];
  const largeur = useLargeur();
  const isMobile = isPreviewMobile || largeur <= 768;
  const police = getPoliceCSS(config.police);
  const heroRef = useRef<HTMLDivElement>(null);
  const cp = couleurValide(config.couleurPrincipale, '#c9a96e');
  const cs = couleurValide(config.couleurSecondaire, '#1a1a1a');
  const cf = couleurValide(config.couleurFond, '#fafaf8');
  const ct = couleurValide(config.couleurTexte, '#1a1a1a');

  const apercu = !siteId;   // sans site publié (aperçu dans Studio, image d'aperçu) : chiffres de démonstration, pas de vrai don
  const [modalDon, setModalDon] = useState(false);
  const [etat, setEtat] = useState<EtatPublic | null>(null);
  const [retour, setRetour] = useState<{ type: 'succes' | 'annule' | 'erreur'; texte: string } | null>(null);
  const [lienCopie, setLienCopie] = useState(false);

  const chargerEtat = () => {
    if (!siteId) return;
    fetch(`/api/dons/public/${siteId}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d === 'object') setEtat(d as EtatPublic); })
      .catch(() => {});
  };
  useEffect(chargerEtat, [siteId]);

  // Retour de Stripe / PayPal (adresse du site avec ?don=…)
  useEffect(() => {
    if (!siteId) return;
    const p = new URLSearchParams(window.location.search);
    const don = p.get('don');
    if (!don) return;
    const nettoyer = () => { try { window.history.replaceState({}, '', window.location.pathname + window.location.hash); } catch { /* ignore */ } };
    if (don === 'succes') { setRetour({ type: 'succes', texte: config.messageRemerciement }); nettoyer(); setTimeout(chargerEtat, 2500); }
    else if (don === 'annule') { setRetour({ type: 'annule', texte: "Le paiement a été annulé. Aucun montant n'a été prélevé." }); nettoyer(); }
    else if (don === 'retour' && p.get('mode') === 'paypal') {
      const donId = p.get('don_id'), orderId = p.get('token');
      nettoyer();
      fetch('/api/dons/paypal/capturer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site_id: siteId, don_id: donId, order_id: orderId }) })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (ok && d.paye) { setRetour({ type: 'succes', texte: config.messageRemerciement }); chargerEtat(); }
          else setRetour({ type: 'erreur', texte: (d && d.message) || "Le paiement PayPal n'a pas été confirmé. Aucun montant n'a été prélevé." });
        })
        .catch(() => setRetour({ type: 'erreur', texte: 'Impossible de confirmer le paiement. Si vous avez été débité, contactez l’organisateur.' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  useEffect(() => {
    const onScroll = () => { if (heroRef.current) heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.2}px`; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Chiffres affichés ──
  const objectif = Math.max(1, (etat && etat.objectif) || Number(config.objectifMontant) || 1);
  const total = apercu ? Math.round(objectif * 0.3) : Number(etat ? etat.total : 0) || 0;
  const nbDonateurs = apercu ? 12 : (etat ? etat.count : 0);
  const donsListe = apercu
    ? [{ id: 1, nom_donateur: 'Sophie L.', montant: '50', message: 'Bravo pour votre belle initiative !' }, { id: 2, nom_donateur: 'Anonyme', montant: '25', message: null }, { id: 3, nom_donateur: 'Marc-André', montant: '100', message: 'Pour les enfants du quartier.' }]
    : (etat ? etat.dons : []);
  const fin = (etat && etat.fin_le) || config.dateFinCampagne;
  const finMs = fin ? new Date(fin).getTime() : NaN;
  const joursRestants = Number.isFinite(finMs) ? Math.max(0, Math.ceil((finMs - Date.now()) / 86400000)) : null;
  const termine = !apercu && etat !== null && etat.statut === 'terminee';
  const nonOuvert = !apercu && etat !== null && !etat.ouvert && !termine;
  const donsOuverts = apercu || etat === null || etat.ouvert;
  const modes = apercu ? { stripe: true, paypal: false } : (etat ? etat.modes : { stripe: true, paypal: false });
  const minimum = Math.max(Number(config.montantMinimum) || 1, etat ? etat.don_min : 1);
  const maximum = etat ? etat.don_max : 10000;
  const emoji = EMOJI_TYPE[config.sousType] || '💝';
  const peutAfficherDons = config.afficherDonateurs !== false && donsListe.length > 0;

  const ouvrirDon = () => { if (donsOuverts) setModalDon(true); };
  const copierLien = () => {
    try { navigator.clipboard.writeText(window.location.href.split('?')[0]).then(() => { setLienCopie(true); setTimeout(() => setLienCopie(false), 2500); }); } catch { /* ignore */ }
  };
  const libelleBouton = termine ? 'Campagne terminée' : nonOuvert ? 'Bientôt ouvert aux dons' : '💝 Faire un don';

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden' }}>
      <link rel="stylesheet" href={getGoogleFonts(config.police)} />
      <style>{`
        .cg-root *, .cg-root *::before, .cg-root *::after { box-sizing: border-box; }
        .cg-btn { background: linear-gradient(135deg, ${cp}, ${cp}dd); color: #fff; border: none; padding: 14px 36px; border-radius: 50px; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 24px ${cp}44; transition: transform .2s, box-shadow .2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
        .cg-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 32px ${cp}66; }
        .cg-btn:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; }
        .cg-don { transition: transform .2s; } .cg-don:hover { transform: translateY(-2px); }
        @keyframes cg-bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)} }
        .cg-sep { width: 48px; height: 3px; background: ${cp}; border-radius: 2px; margin: 14px 0 20px; } .cg-sep-c { margin: 14px auto 20px; }
        .cg-root h1, .cg-root h2, .cg-root h3, .cg-root p { margin: 0; }
      `}</style>

      <div className="cg-root">
        {modalDon && <ModalDon config={config} cp={cp} cs={cs} siteId={siteId} modes={modes} minimum={minimum} maximum={maximum} apercu={apercu} onClose={() => setModalDon(false)} />}

        {/* Message de retour (don réussi / annulé) */}
        {retour && (
          <div role="status" style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 900, width: 'calc(100% - 32px)', maxWidth: 520, background: retour.type === 'succes' ? '#ecfdf5' : retour.type === 'annule' ? '#fffbeb' : '#fef2f2', border: `1px solid ${retour.type === 'succes' ? '#6ee7b7' : retour.type === 'annule' ? '#fcd34d' : '#fca5a5'}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,.18)', color: '#1a1a1a' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 26 }}>{retour.type === 'succes' ? '🎉' : retour.type === 'annule' ? 'ℹ️' : '⚠️'}</span>
              <div style={{ flex: 1 }}>
                {retour.type === 'succes' && <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Don reçu — merci !</p>}
                <p style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{retour.texte}</p>
              </div>
              <button onClick={() => setRetour(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
          </div>
        )}

        {/* NAV */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${cf}ee`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cp}22`, height: 64, display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {config.logoUrl && /^https?:\/\//i.test(config.logoUrl) && <img src={config.logoUrl} alt="logo" style={{ height: 32, objectFit: 'contain' }} />}
              <span style={{ fontSize: 17, fontWeight: 700, color: cs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{config.nomEntreprise}</span>
            </div>
            <button onClick={ouvrirDon} disabled={!donsOuverts} className="cg-btn" style={{ padding: '9px 20px', fontSize: 14, flexShrink: 0 }}>
              {donsOuverts ? '💝 Faire un don' : (termine ? 'Terminée' : 'Bientôt')}
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section ref={heroRef} style={{ minHeight: '70vh', backgroundImage: config.photoHeroUrl ? `url(${config.photoHeroUrl})` : undefined, backgroundColor: cs, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cs}99 0%, ${cs}dd 100%)` }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, padding: '80px 20px 40px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>{emoji} Campagne de dons</p>
            <h1 style={{ fontSize: 'clamp(28px, 6vw, 58px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16, overflowWrap: 'anywhere' }}>{config.nomCampagne}</h1>
            <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto 32px' }}>{config.slogan}</p>
            <button onClick={ouvrirDon} disabled={!donsOuverts} className="cg-btn" style={{ fontSize: 17, padding: '15px 40px' }}>{donsOuverts ? '💝 Faire un don maintenant' : libelleBouton}</button>
          </div>
          <div style={{ position: 'absolute', bottom: 24, left: '50%', color: 'rgba(255,255,255,0.5)', fontSize: 20, animation: 'cg-bounce 2s infinite' }}>↓</div>
        </section>

        {(termine || nonOuvert) && (
          <div style={{ background: termine ? '#111827' : '#fffbeb', color: termine ? '#fff' : '#92400e', padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
            {termine ? '🏁 Cette campagne est terminée. Merci à toutes les personnes qui ont contribué !' : "⏳ Cette cagnotte n'est pas encore ouverte aux dons. Revenez bientôt !"}
          </div>
        )}

        {/* SECTION PRINCIPALE */}
        <section style={{ padding: isMobile ? '40px 16px' : '64px 24px', background: cf }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: isMobile ? 32 : 48, flexDirection: isMobile ? 'column-reverse' : 'row', alignItems: 'flex-start' }}>

            <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
              {config.photoCampagne && (
                <img src={config.photoCampagne} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 32, boxShadow: `0 8px 32px ${cs}20`, objectFit: 'cover', maxHeight: 380 }} onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: cs, marginBottom: 6 }}>À propos de cette campagne</h2>
              <div className="cg-sep" />
              <div style={{ fontSize: 15, color: `${ct}cc`, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 40, overflowWrap: 'anywhere' }}>{config.descriptionCampagne}</div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 20, background: `${cp}08`, borderRadius: 12, border: `1px solid ${cp}20`, marginBottom: 40 }}>
                {config.photoOrganisateur
                  ? <img src={config.photoOrganisateur} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                  : <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${cp}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👤</div>}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Organisé par</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: cs, marginBottom: 4 }}>{config.nomOrganisateur}</p>
                  {config.bioOrganisateur && <p style={{ fontSize: 12.5, color: `${ct}99`, lineHeight: 1.5 }}>{config.bioOrganisateur}</p>}
                </div>
              </div>

              {config.misesAJour.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: cs, marginBottom: 6 }}>Mises à jour</h3>
                  <div className="cg-sep" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {config.misesAJour.map((m, i) => (
                      <div key={i} style={{ padding: '18px 20px', background: '#fff', borderRadius: 10, border: `1px solid ${cp}20`, borderLeft: `4px solid ${cp}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: cs }}>{m.titre}</p>
                          <p style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{m.date ? new Date(m.date).toLocaleDateString('fr-CA') : ''}</p>
                        </div>
                        <p style={{ fontSize: 13, color: `${ct}aa`, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{m.texte}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0 }}>
              <div style={{ background: '#fff', color: '#1a1a1a', borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${cp}20`, position: isMobile ? 'static' : 'sticky', top: 80 }}>
                <BarreProgression total={total} objectif={objectif} cp={cp} nbDonateurs={nbDonateurs} />

                {joursRestants !== null && !termine && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '20px 0', padding: '12px 16px', background: joursRestants < 7 ? '#fee2e2' : `${cp}10`, borderRadius: 8, border: `1px solid ${joursRestants < 7 ? '#fca5a5' : cp + '30'}` }}>
                    <span style={{ fontSize: 20 }}>{joursRestants < 7 ? '⏰' : '📅'}</span>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: joursRestants < 7 ? '#dc2626' : cs }}>{joursRestants} jour{joursRestants > 1 ? 's' : ''}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>restant{joursRestants > 1 ? 's' : ''} pour contribuer</p>
                    </div>
                  </div>
                )}

                <button onClick={ouvrirDon} disabled={!donsOuverts} className="cg-btn" style={{ width: '100%', padding: 14, fontSize: 16, borderRadius: 12, marginTop: termine ? 20 : 0, marginBottom: 12 }}>{libelleBouton}</button>
                <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>🔒 Paiement sécurisé · aucune commission sur les dons</p>

                {peutAfficherDons && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Derniers donateurs</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {donsListe.slice(0, 5).map((d, i) => (
                        <div key={d.id || i} className="cg-don" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${cp}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                            {d.nom_donateur === 'Anonyme' ? '🕶' : (d.nom_donateur || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: cs, overflowWrap: 'anywhere' }}>{d.nom_donateur}</p>
                            {d.message && <p style={{ fontSize: 11, color: '#888', fontStyle: 'italic', overflowWrap: 'anywhere' }}>« {d.message.substring(0, 60)}{d.message.length > 60 ? '…' : ''} »</p>}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: cp, flexShrink: 0 }}>{Math.round(parseFloat(d.montant))} $</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PARTAGE */}
        <section style={{ padding: '56px 20px', background: `${cp}10`, borderTop: `1px solid ${cp}20` }}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Partagez</p>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 700, color: cs, marginBottom: 8 }}>Aidez-nous à passer le mot !</h2>
            <div className="cg-sep cg-sep-c" />
            <p style={{ fontSize: 14, color: `${ct}aa`, marginBottom: 24 }}>Chaque partage peut faire la différence.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {config.facebook && <a href={lienReseau('https://facebook.com/', config.facebook)} target="_blank" rel="noopener noreferrer" style={btnSocial('#1877f2')}>👥 Facebook</a>}
              {config.instagram && <a href={lienReseau('https://instagram.com/', config.instagram)} target="_blank" rel="noopener noreferrer" style={btnSocial('#e1306c')}>📷 Instagram</a>}
              {config.siteExterne && /^https:\/\//i.test(config.siteExterne) && <a href={config.siteExterne} target="_blank" rel="noopener noreferrer" style={btnSocial(cs)}>🌐 Site web</a>}
              {config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email) && <a href={`mailto:${config.email}`} style={btnSocial(cs)}>✉️ Nous écrire</a>}
              <button onClick={copierLien} style={{ ...btnSocial(cs), border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{lienCopie ? '✓ Lien copié' : '🔗 Copier le lien'}</button>
            </div>
          </div>
        </section>

        <footer style={{ padding: '22px 20px', background: cs, textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', maxWidth: 640, margin: '0 auto 10px', lineHeight: 1.6 }}>{AVIS_LEGAL}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span></p>
        </footer>
      </div>
    </div>
  );
}

const btnSocial = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-block' });

function useLargeur() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}