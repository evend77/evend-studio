import React, { useState } from 'react';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', purple: '#7c3aed',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type StatutLitige = 'ouvert' | 'en_cours' | 'en_attente_vendeur' | 'en_attente_client' | 'resolu' | 'rembourse' | 'rejete' | 'escalade';
type MotifLitige = 'non_recu' | 'non_conforme' | 'defectueux' | 'mauvais_article' | 'endommage' | 'retard' | 'autre';
type AuteurMessage = 'admin' | 'vendeur' | 'client' | 'systeme';

interface Message {
  id: number;
  auteur: AuteurMessage;
  nom: string;
  texte: string;
  date: string;
  interne: boolean; // note interne admin seulement
}

interface Litige {
  id: string;
  commandeId: string;
  storeOrderId: string;
  vendeur: string;
  boutique: string;
  client: string;
  emailClient: string;
  produit: string;
  montant: number;
  motif: MotifLitige;
  statut: StatutLitige;
  dateOuverture: string;
  dateDerniereMaj: string;
  heuresEcoulees: number;
  priorite: 'normale' | 'haute' | 'urgente';
  description: string;
  messages: Message[];
  remboursementDemande: number;
  adminAssigne: string | null;
  noteInterne: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const LITIGES_MOCK: Litige[] = [
  {
    id: 'RMA-2026-0012', commandeId: '13882042', storeOrderId: '#1016',
    vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC',
    client: 'Marie Tremblay', emailClient: 'marie@example.com',
    produit: 'Bougie artisanale lavande', montant: 14.99,
    motif: 'defectueux', statut: 'ouvert',
    dateOuverture: '22/02/2026 09:15', dateDerniereMaj: '22/02/2026 09:15',
    heuresEcoulees: 72, priorite: 'urgente',
    description: 'La bougie est arrivée cassée et l\'odeur ne correspond pas à la description du produit.',
    remboursementDemande: 14.99, adminAssigne: null, noteInterne: '',
    messages: [
      { id: 1, auteur: 'client', nom: 'Marie Tremblay', texte: 'J\'ai reçu ma bougie cassée et elle ne sent pas du tout la lavande comme indiqué. Je veux un remboursement complet.', date: '22/02/2026 09:15', interne: false },
      { id: 2, auteur: 'systeme', nom: 'Système', texte: 'RMA-2026-0012 ouvert automatiquement. Vendeur notifié par courriel.', date: '22/02/2026 09:16', interne: false },
    ],
  },
  {
    id: 'RMA-2026-0011', commandeId: '13879676', storeOrderId: '#1014',
    vendeur: 'Vic', boutique: "Mom's World",
    client: 'Sophie Martin', emailClient: 'sophie@example.com',
    produit: '101 70s Hits CD', montant: 10.00,
    motif: 'non_recu', statut: 'en_attente_vendeur',
    dateOuverture: '21/02/2026 14:30', dateDerniereMaj: '21/02/2026 14:30',
    heuresEcoulees: 50, priorite: 'haute',
    description: 'Commande passée il y a 3 semaines, rien reçu. Le numéro de suivi ne fonctionne pas.',
    remboursementDemande: 10.00, adminAssigne: 'Admin e-Vend', noteInterne: 'Vérifier avec Vic si la commande a vraiment été expédiée.',
    messages: [
      { id: 1, auteur: 'client', nom: 'Sophie Martin', texte: 'Ma commande est passée il y a 3 semaines et je n\'ai toujours rien reçu. Le numéro de suivi 12345 ne retourne aucun résultat sur le site de Poste Canada.', date: '21/02/2026 14:30', interne: false },
      { id: 2, auteur: 'systeme', nom: 'Système', texte: 'Vendeur "Vic" notifié. Délai de réponse : 48 heures.', date: '21/02/2026 14:31', interne: false },
      { id: 3, auteur: 'admin', nom: 'Admin e-Vend', texte: 'Vérifier avec Vic si la commande a vraiment été expédiée.', date: '21/02/2026 15:00', interne: true },
    ],
  },
  {
    id: 'RMA-2026-0010', commandeId: '13629869', storeOrderId: '#1011',
    vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC',
    client: 'Pierre Gagnon', emailClient: 'pierre@example.com',
    produit: 'Coffret thés du monde', montant: 10.00,
    motif: 'mauvais_article', statut: 'en_cours',
    dateOuverture: '19/02/2026 10:00', dateDerniereMaj: '20/02/2026 11:22',
    heuresEcoulees: 30, priorite: 'normale',
    description: 'J\'ai reçu un coffret de café au lieu du coffret de thés commandé.',
    remboursementDemande: 10.00, adminAssigne: null, noteInterne: '',
    messages: [
      { id: 1, auteur: 'client', nom: 'Pierre Gagnon', texte: 'J\'ai commandé le coffret thés du monde mais j\'ai reçu un coffret café. Ce n\'est pas ce que j\'ai commandé.', date: '19/02/2026 10:00', interne: false },
      { id: 2, auteur: 'vendeur', nom: 'idée-cadeau', texte: 'Bonjour Pierre, nous nous excusons pour cette erreur. Nous allons vous envoyer le bon produit dès demain et vous n\'aurez pas à retourner le café!', date: '20/02/2026 09:00', interne: false },
      { id: 3, auteur: 'client', nom: 'Pierre Gagnon', texte: 'Merci pour la réponse rapide, j\'attends le bon produit.', date: '20/02/2026 11:22', interne: false },
    ],
  },
  {
    id: 'RMA-2026-0009', commandeId: '13629778', storeOrderId: '#1010',
    vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC',
    client: 'Lucie Bouchard', emailClient: 'lucie@example.com',
    produit: 'Carnet de voyage cuir', montant: 10.00,
    motif: 'non_conforme', statut: 'escalade',
    dateOuverture: '15/02/2026 08:00', dateDerniereMaj: '20/02/2026 16:00',
    heuresEcoulees: 120, priorite: 'urgente',
    description: 'Le carnet reçu est en similicuir bon marché, pas du vrai cuir comme annoncé. Photos à l\'appui.',
    remboursementDemande: 10.00, adminAssigne: 'Admin e-Vend', noteInterne: 'Vendeur non coopératif. La description du produit est trompeuse. Rembourser le client et avertir le vendeur formellement.',
    messages: [
      { id: 1, auteur: 'client', nom: 'Lucie Bouchard', texte: 'Ce carnet est clairement en plastique, pas en cuir. La description est mensongère. Je veux mon remboursement.', date: '15/02/2026 08:00', interne: false },
      { id: 2, auteur: 'vendeur', nom: 'idée-cadeau', texte: 'Notre produit est en cuir végétalien, ce qui est mentionné dans les détails.', date: '15/02/2026 15:00', interne: false },
      { id: 3, auteur: 'client', nom: 'Lucie Bouchard', texte: 'Non, nulle part dans l\'annonce il est écrit "cuir végétalien". C\'est trompeur!', date: '16/02/2026 09:00', interne: false },
      { id: 4, auteur: 'admin', nom: 'Admin e-Vend', texte: 'Vendeur non coopératif. Description trompeuse confirmée. Escalade en cours.', date: '20/02/2026 16:00', interne: true },
    ],
  },
  {
    id: 'RMA-2026-0008', commandeId: '13069465', storeOrderId: '#1003',
    vendeur: 'Vic', boutique: "Mom's World",
    client: 'Alex Test', emailClient: 'alex@test.com',
    produit: 'Produit test', montant: 5.00,
    motif: 'retard', statut: 'resolu',
    dateOuverture: '10/02/2026 12:00', dateDerniereMaj: '18/02/2026 14:30',
    heuresEcoulees: 0, priorite: 'normale',
    description: 'Délai de livraison dépassé de 2 semaines.',
    remboursementDemande: 0, adminAssigne: null, noteInterne: '',
    messages: [
      { id: 1, auteur: 'client', nom: 'Alex Test', texte: 'Ma commande est très en retard.', date: '10/02/2026 12:00', interne: false },
      { id: 2, auteur: 'vendeur', nom: 'Vic', texte: 'Désolé, retard dû à Poste Canada. Le colis est en route.', date: '11/02/2026 10:00', interne: false },
      { id: 3, auteur: 'client', nom: 'Alex Test', texte: 'Reçu! Merci pour le suivi.', date: '18/02/2026 14:30', interne: false },
    ],
  },
  {
    id: 'RMA-2026-0007', commandeId: '13812366', storeOrderId: '#1012',
    vendeur: 'Vic', boutique: "Mom's World",
    client: 'Louis Bossé', emailClient: 'alex.bosse@hotmail.com',
    produit: '101 70s Hits CD', montant: 10.00,
    motif: 'endommage', statut: 'rembourse',
    dateOuverture: '12/02/2026 16:00', dateDerniereMaj: '16/02/2026 10:00',
    heuresEcoulees: 0, priorite: 'normale',
    description: 'CD arrivé brisé dans son boîtier.',
    remboursementDemande: 10.00, adminAssigne: null, noteInterne: '',
    messages: [
      { id: 1, auteur: 'client', nom: 'Louis Bossé', texte: 'Mon CD est arrivé brisé.', date: '12/02/2026 16:00', interne: false },
      { id: 2, auteur: 'vendeur', nom: 'Vic', texte: 'Nous vous remboursons immédiatement. Désolé pour le désagrément.', date: '13/02/2026 09:00', interne: false },
      { id: 3, auteur: 'systeme', nom: 'Système', texte: 'Remboursement de 10,00 $ traité avec succès via PayPal.', date: '16/02/2026 10:00', interne: false },
    ],
  },
];

const MOTIF_CONFIG: Record<MotifLitige, { label: string; icon: string }> = {
  non_recu:      { label: 'Non reçu',        icon: '📭' },
  non_conforme:  { label: 'Non conforme',     icon: '❌' },
  defectueux:    { label: 'Défectueux',       icon: '🔧' },
  mauvais_article:{ label: 'Mauvais article', icon: '🔄' },
  endommage:     { label: 'Endommagé',        icon: '💥' },
  retard:        { label: 'Retard livraison', icon: '⏰' },
  autre:         { label: 'Autre',            icon: '❓' },
};

const STATUT_CONFIG: Record<StatutLitige, { label: string; bg: string; color: string; icon: string }> = {
  ouvert:              { label: 'Ouvert',              bg: '#fee2e2', color: THEME.danger,   icon: '🔴' },
  en_cours:            { label: 'En cours',            bg: '#fef9c3', color: THEME.warning,  icon: '🟡' },
  en_attente_vendeur:  { label: 'Attente vendeur',     bg: '#fef9c3', color: '#b45309',      icon: '⏳' },
  en_attente_client:   { label: 'Attente client',      bg: '#e0f2fe', color: '#0369a1',      icon: '⏳' },
  resolu:              { label: 'Résolu',              bg: '#dcfce7', color: THEME.success,  icon: '✅' },
  rembourse:           { label: 'Remboursé',           bg: '#dcfce7', color: THEME.success,  icon: '💚' },
  rejete:              { label: 'Rejeté',              bg: '#f3f4f6', color: THEME.textLight, icon: '⛔' },
  escalade:            { label: 'Escaladé',            bg: '#f3e8ff', color: THEME.purple,   icon: '🚨' },
};

const PRIORITE_CONFIG = {
  normale:  { label: 'Normale', color: THEME.textLight, bg: '#f3f4f6' },
  haute:    { label: 'Haute',   color: THEME.warning,   bg: '#fef9c3' },
  urgente:  { label: 'Urgente', color: THEME.danger,    bg: '#fee2e2' },
};

interface LitigesRetoursProps {
  naviguerVers: (page: string, data?: any) => void;
}

export default function LitigesRetours({ naviguerVers }: LitigesRetoursProps) {
  const [litiges, setLitiges] = useState<Litige[]>(LITIGES_MOCK);
  const [litigeSelectionne, setLitigeSelectionne] = useState<Litige | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreMotif, setFiltreMotif] = useState<string>('tous');
  const [filtrePriorite, setFiltrePriorite] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [estNoteInterne, setEstNoteInterne] = useState(false);
  const [noteInterneEdition, setNoteInterneEdition] = useState('');
  const [modalDecisionOuvert, setModalDecisionOuvert] = useState(false);
  const [decision, setDecision] = useState<'rembourser' | 'rejeter' | null>(null);

  // ── Filtres ────────────────────────────────────────────────────────────────
  const litigesFiltres = litiges.filter(l => {
    const matchRecherche = l.id.toLowerCase().includes(recherche.toLowerCase()) ||
      l.client.toLowerCase().includes(recherche.toLowerCase()) ||
      l.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
      l.produit.toLowerCase().includes(recherche.toLowerCase()) ||
      l.storeOrderId.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || l.statut === filtreStatut;
    const matchMotif = filtreMotif === 'tous' || l.motif === filtreMotif;
    const matchPriorite = filtrePriorite === 'tous' || l.priorite === filtrePriorite;
    return matchRecherche && matchStatut && matchMotif && matchPriorite;
  }).sort((a, b) => {
    // Urgents en premier, puis par heures écoulées
    const prio = { urgente: 3, haute: 2, normale: 1 };
    if (prio[b.priorite] !== prio[a.priorite]) return prio[b.priorite] - prio[a.priorite];
    return b.heuresEcoulees - a.heuresEcoulees;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const nbOuverts = litiges.filter(l => l.statut === 'ouvert').length;
  const nbEscalades = litiges.filter(l => l.statut === 'escalade').length;
  const nbSansReponse = litiges.filter(l => l.heuresEcoulees >= 48 && !['resolu', 'rembourse', 'rejete'].includes(l.statut)).length;
  const montantEnLitige = litiges.filter(l => !['resolu', 'rembourse', 'rejete'].includes(l.statut)).reduce((s, l) => s + l.remboursementDemande, 0);
  const tauxResolution = Math.round((litiges.filter(l => ['resolu', 'rembourse'].includes(l.statut)).length / litiges.length) * 100);

  // ── Actions ───────────────────────────────────────────────────────────────
  const envoyerMessage = () => {
    if (!nouveauMessage.trim() || !litigeSelectionne) return;
    const msg: Message = {
      id: Date.now(), auteur: 'admin', nom: 'Admin e-Vend',
      texte: nouveauMessage, date: new Date().toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      interne: estNoteInterne,
    };
    const maj = litiges.map(l =>
      l.id === litigeSelectionne.id ? { ...l, messages: [...l.messages, msg] } : l
    );
    setLitiges(maj);
    setLitigeSelectionne(maj.find(l => l.id === litigeSelectionne.id) || null);
    setNouveauMessage('');
  };

  const changerStatut = (litigeId: string, nouveauStatut: StatutLitige) => {
    const maj = litiges.map(l => l.id === litigeId ? { ...l, statut: nouveauStatut } : l);
    setLitiges(maj);
    if (litigeSelectionne?.id === litigeId) setLitigeSelectionne(maj.find(l => l.id === litigeId) || null);
  };

  const escalader = (litigeId: string) => {
    const msg: Message = {
      id: Date.now(), auteur: 'systeme', nom: 'Système',
      texte: 'Ce litige a été escaladé à la direction. Les deux parties seront notifiées.',
      date: new Date().toLocaleString('fr-CA'), interne: false,
    };
    const maj = litiges.map(l =>
      l.id === litigeId
        ? { ...l, statut: 'escalade' as StatutLitige, priorite: 'urgente' as const, adminAssigne: 'Admin e-Vend', messages: [...l.messages, msg] }
        : l
    );
    setLitiges(maj);
    if (litigeSelectionne?.id === litigeId) setLitigeSelectionne(maj.find(l => l.id === litigeId) || null);
  };

  const forcerDecision = () => {
    if (!litigeSelectionne || !decision) return;
    const nouveauStatut: StatutLitige = decision === 'rembourser' ? 'rembourse' : 'rejete';
    const msg: Message = {
      id: Date.now(), auteur: 'admin', nom: 'Admin e-Vend',
      texte: decision === 'rembourser'
        ? `Décision administrative : Remboursement de ${litigeSelectionne.remboursementDemande.toFixed(2)} $ accordé au client. Montant débité de la prochaine payout du vendeur.`
        : 'Décision administrative : La demande de retour a été rejetée. Le dossier est fermé.',
      date: new Date().toLocaleString('fr-CA'), interne: false,
    };
    const maj = litiges.map(l =>
      l.id === litigeSelectionne.id ? { ...l, statut: nouveauStatut, messages: [...l.messages, msg] } : l
    );
    setLitiges(maj);
    setLitigeSelectionne(maj.find(l => l.id === litigeSelectionne.id) || null);
    setModalDecisionOuvert(false);
    setDecision(null);
  };

  const sauvegarderNote = () => {
    if (!litigeSelectionne) return;
    const maj = litiges.map(l => l.id === litigeSelectionne.id ? { ...l, noteInterne: noteInterneEdition } : l);
    setLitiges(maj);
    setLitigeSelectionne(maj.find(l => l.id === litigeSelectionne.id) || null);
  };

  // ── Composants UI ──────────────────────────────────────────────────────────
  const Badge = ({ cfg }: { cfg: { label: string; bg: string; color: string } }) => (
    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' as const }}>
      {cfg.label}
    </span>
  );

  const ChronoBadge = ({ heures, statut }: { heures: number; statut: StatutLitige }) => {
    if (['resolu', 'rembourse', 'rejete'].includes(statut)) return null;
    const couleur = heures >= 72 ? THEME.danger : heures >= 48 ? '#d97706' : THEME.success;
    const bg = heures >= 72 ? '#fee2e2' : heures >= 48 ? '#fef9c3' : '#dcfce7';
    return (
      <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', backgroundColor: bg, color: couleur, display: 'flex', alignItems: 'center', gap: '3px' }}>
        ⏱️ {heures >= 24 ? `${Math.floor(heures / 24)}j ${heures % 24}h` : `${heures}h`}
        {heures >= 48 && ' ⚠️'}
      </span>
    );
  };

  // Vue détail litige
  if (litigeSelectionne) {
    const l = litigeSelectionne;
    const statutCfg = STATUT_CONFIG[l.statut];
    const estFerme = ['resolu', 'rembourse', 'rejete'].includes(l.statut);

    return (
      <div style={{ padding: '24px 32px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setLitigeSelectionne(null)} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.accent, cursor: 'pointer', fontWeight: '600', padding: 0 }}>
            ← Litiges & Retours
          </button>
          <span style={{ color: '#aaa' }}>›</span>
          <span style={{ fontSize: '12px', color: THEME.textLight }}>{l.id}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: THEME.text }}>{l.id}</h1>
              <Badge cfg={statutCfg} />
              <span style={{ fontSize: '12px', backgroundColor: PRIORITE_CONFIG[l.priorite].bg, color: PRIORITE_CONFIG[l.priorite].color, padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
                {l.priorite === 'urgente' ? '🔥' : l.priorite === 'haute' ? '⚡' : '—'} {PRIORITE_CONFIG[l.priorite].label}
              </span>
              <ChronoBadge heures={l.heuresEcoulees} statut={l.statut} />
            </div>
            <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
              Commande {l.storeOrderId} · {l.produit} · Ouvert le {l.dateOuverture}
            </p>
          </div>

          {!estFerme && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {l.statut !== 'escalade' && (
                <button onClick={() => escalader(l.id)} style={{ backgroundColor: '#f3e8ff', color: THEME.purple, border: `1px solid ${THEME.purple}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  🚨 Escalader
                </button>
              )}
              <button onClick={() => setModalDecisionOuvert(true)} style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ⚖️ Forcer une décision
              </button>
              <select onChange={e => e.target.value && changerStatut(l.id, e.target.value as StatutLitige)} defaultValue=""
                style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', backgroundColor: 'white' }}>
                <option value="" disabled>Changer statut...</option>
                <option value="en_cours">🟡 En cours</option>
                <option value="en_attente_vendeur">⏳ Attente vendeur</option>
                <option value="en_attente_client">⏳ Attente client</option>
                <option value="resolu">✅ Résolu</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

          {/* COLONNE PRINCIPALE */}
          <div>

            {/* Description */}
            <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{MOTIF_CONFIG[l.motif].icon}</span>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Motif : {MOTIF_CONFIG[l.motif].label}
                </h3>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '13px', color: THEME.text, lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                  "{l.description}"
                </p>
                {l.remboursementDemande > 0 && (
                  <div style={{ marginTop: '12px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '10px 14px', border: '1px solid #d97706', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span>💰</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#92400e' }}>
                      Remboursement demandé : {l.remboursementDemande.toFixed(2)} $
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fil de conversation */}
            <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💬</span>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Fil de conversation ({l.messages.length} messages)
                  </h3>
                </div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {l.messages.map(msg => {
                  const configs: Record<AuteurMessage, { couleur: string; bg: string; align: 'left' | 'right' }> = {
                    admin:    { couleur: THEME.accent,      bg: THEME.accentLight,  align: 'right' },
                    vendeur:  { couleur: '#7c3aed',         bg: '#f3e8ff',          align: 'left' },
                    client:   { couleur: THEME.text,        bg: '#f8fafc',          align: 'left' },
                    systeme:  { couleur: THEME.textLight,   bg: '#f0f0f0',          align: 'left' },
                  };
                  const cfg = configs[msg.auteur];
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: cfg.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexDirection: cfg.align === 'right' ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: cfg.couleur }}>
                            {msg.auteur === 'admin' ? '🛡️' : msg.auteur === 'vendeur' ? '🏪' : msg.auteur === 'systeme' ? '🤖' : '👤'} {msg.nom}
                          </span>
                          {msg.interne && (
                            <span style={{ fontSize: '10px', backgroundColor: '#fef9c3', color: '#92400e', border: '1px solid #d97706', borderRadius: '8px', padding: '1px 6px', fontWeight: '700' }}>
                              🔒 Note interne
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: '#aaa' }}>{msg.date}</span>
                        </div>
                        <div style={{ backgroundColor: msg.interne ? '#fef9c3' : cfg.bg, border: `1px solid ${msg.interne ? '#d97706' : cfg.couleur + '30'}`, borderRadius: '10px', padding: '10px 14px' }}>
                          <p style={{ fontSize: '13px', color: THEME.text, margin: 0, lineHeight: '1.5' }}>{msg.texte}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zone de réponse */}
              {!estFerme && (
                <div style={{ padding: '16px 20px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: estNoteInterne ? '#92400e' : THEME.textLight }}>
                      <input type="checkbox" checked={estNoteInterne} onChange={e => setEstNoteInterne(e.target.checked)} style={{ accentColor: '#d97706' }} />
                      🔒 Note interne (visible seulement par l'admin)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <textarea
                      value={nouveauMessage}
                      onChange={e => setNouveauMessage(e.target.value)}
                      placeholder={estNoteInterne ? 'Ajouter une note interne...' : 'Répondre au client et au vendeur...'}
                      rows={3}
                      style={{ flex: 1, border: `1px solid ${estNoteInterne ? '#d97706' : THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'vertical' as const, backgroundColor: estNoteInterne ? '#fef9c3' : 'white' }}
                    />
                    <button onClick={envoyerMessage} disabled={!nouveauMessage.trim()} style={{ backgroundColor: estNoteInterne ? '#d97706' : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: nouveauMessage.trim() ? 'pointer' : 'not-allowed', opacity: nouveauMessage.trim() ? 1 : 0.5, flexShrink: 0 }}>
                      {estNoteInterne ? '🔒 Sauvegarder' : '📤 Envoyer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div>

            {/* Infos litige */}
            <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Infos du dossier</h3>
              </div>
              <div>
                {[
                  { label: '🏪 Vendeur', val: `${l.vendeur} (${l.boutique})` },
                  { label: '👤 Client', val: l.client },
                  { label: '📦 Produit', val: l.produit },
                  { label: '💰 Montant commande', val: `${l.montant.toFixed(2)} $` },
                  { label: '↩️ Remboursement demandé', val: l.remboursementDemande > 0 ? `${l.remboursementDemande.toFixed(2)} $` : '—' },
                  { label: '📅 Ouvert le', val: l.dateOuverture },
                  { label: '🔄 Dernière MAJ', val: l.dateDerniereMaj },
                  { label: '👷 Admin assigné', val: l.adminAssigne || 'Non assigné' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '9px 18px', borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <span style={{ fontSize: '10px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: THEME.text, fontWeight: '600' }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note interne admin */}
            <div style={{ backgroundColor: '#fef9c3', borderRadius: '12px', border: '1px solid #d97706', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒</span>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Note interne admin</h3>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <textarea
                  value={noteInterneEdition || l.noteInterne}
                  onChange={e => setNoteInterneEdition(e.target.value)}
                  placeholder="Ajouter une note interne sur ce dossier..."
                  rows={4}
                  style={{ width: '100%', border: '1px solid #d97706', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', resize: 'vertical' as const, backgroundColor: 'white', boxSizing: 'border-box' as const }}
                />
                <button onClick={sauvegarderNote} style={{ marginTop: '8px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>
                  💾 Sauvegarder la note
                </button>
              </div>
            </div>

            {/* Actions rapides */}
            {!estFerme && (
              <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions rapides</h3>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setDecision('rembourser'); setModalDecisionOuvert(true); }} style={{ backgroundColor: '#dcfce7', color: THEME.success, border: `1px solid ${THEME.success}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                    💚 Forcer remboursement client
                  </button>
                  <button onClick={() => { setDecision('rejeter'); setModalDecisionOuvert(true); }} style={{ backgroundColor: '#f3f4f6', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                    ⛔ Rejeter la demande
                  </button>
                  <button onClick={() => escalader(l.id)} disabled={l.statut === 'escalade'} style={{ backgroundColor: l.statut === 'escalade' ? '#f3f4f6' : '#f3e8ff', color: l.statut === 'escalade' ? '#aaa' : THEME.purple, border: `1px solid ${l.statut === 'escalade' ? '#ddd' : THEME.purple}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', cursor: l.statut === 'escalade' ? 'default' : 'pointer', textAlign: 'left' }}>
                    🚨 {l.statut === 'escalade' ? 'Déjà escaladé' : 'Escalader à la direction'}
                  </button>
                  <button onClick={() => changerStatut(l.id, 'resolu')} style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: `1px solid ${THEME.accent}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                    ✅ Marquer comme résolu
                  </button>
                </div>
              </div>
            )}

            {estFerme && (
              <div style={{ backgroundColor: '#dcfce7', borderRadius: '12px', border: `1px solid ${THEME.success}`, padding: '16px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', margin: '0 0 6px 0' }}>✅</p>
                <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.success, margin: '0 0 4px 0' }}>Dossier fermé</p>
                <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Ce litige a été {l.statut === 'rembourse' ? 'remboursé' : l.statut === 'resolu' ? 'résolu' : 'rejeté'} le {l.dateDerniereMaj}.</p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL Forcer décision */}
        {modalDecisionOuvert && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', backgroundColor: '#fee2e2', borderBottom: `2px solid ${THEME.danger}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#991b1b', textTransform: 'uppercase' }}>⚖️ Intervention administrative</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{l.id} · Cette action est définitive et enregistrée</p>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  Choisissez la décision administrative pour ce litige. Les deux parties seront notifiées par courriel et l'action sera enregistrée dans les journaux d'audit.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div onClick={() => setDecision('rembourser')} style={{ border: `2px solid ${decision === 'rembourser' ? THEME.success : THEME.border}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', backgroundColor: decision === 'rembourser' ? '#dcfce7' : 'white' }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.success, margin: '0 0 4px 0' }}>💚 Rembourser le client</p>
                    <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                      {l.remboursementDemande > 0 ? `${l.remboursementDemande.toFixed(2)} $ déduit de la prochaine payout du vendeur.` : 'Aucun montant de remboursement spécifié.'}
                    </p>
                  </div>
                  <div onClick={() => setDecision('rejeter')} style={{ border: `2px solid ${decision === 'rejeter' ? THEME.danger : THEME.border}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', backgroundColor: decision === 'rejeter' ? '#fee2e2' : 'white' }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.danger, margin: '0 0 4px 0' }}>⛔ Rejeter la demande</p>
                    <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>La demande de retour sera fermée. Le client sera notifié de la décision.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setModalDecisionOuvert(false); setDecision(null); }} style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                  <button disabled={!decision} onClick={forcerDecision} style={{ backgroundColor: decision ? THEME.danger : '#ddd', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: decision ? 'pointer' : 'not-allowed' }}>
                    ⚖️ Confirmer la décision
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VUE LISTE ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Litiges & Retours
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            {litiges.length} dossiers au total · {litigesFiltres.length} affichés
          </p>
        </div>
        <button style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
          📤 Export CSV
        </button>
      </div>

      {/* Alerte litiges sans réponse */}
      {nbSansReponse > 0 && (
        <div style={{ backgroundColor: '#fee2e2', border: `1px solid ${THEME.danger}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⏱️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.danger, margin: '0 0 2px 0' }}>
              {nbSansReponse} litige{nbSansReponse > 1 ? 's' : ''} sans réponse depuis plus de 48h !
            </p>
            <p style={{ fontSize: '11px', color: '#991b1b', margin: 0 }}>
              Ces dossiers nécessitent une attention immédiate pour éviter l'escalade.
            </p>
          </div>
          <button onClick={() => setFiltrePriorite('urgente')} style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Voir →
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Ouverts', val: String(nbOuverts), icon: '🔴', c: THEME.danger },
          { label: 'Escaladés', val: String(nbEscalades), icon: '🚨', c: THEME.purple },
          { label: 'Sans réponse +48h', val: String(nbSansReponse), icon: '⏱️', c: THEME.warning },
          { label: 'Montant en litige', val: `${montantEnLitige.toFixed(0)} $`, icon: '💰', c: THEME.warning },
          { label: 'Taux résolution', val: `${tauxResolution} %`, icon: '✅', c: THEME.success },
        ].map((k, i) => (
          <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '20px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '800', color: THEME.text, margin: 0, lineHeight: 1 }}>{k.val}</p>
              <p style={{ fontSize: '10px', color: THEME.textLight, margin: '2px 0 0 0', fontWeight: '600' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Motifs fréquents */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '14px 20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>📊 Motifs les plus fréquents</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(MOTIF_CONFIG).map(([key, cfg]) => {
            const count = litiges.filter(l => l.motif === key).length;
            if (count === 0) return null;
            return (
              <div key={key} onClick={() => setFiltreMotif(filtreMotif === key ? 'tous' : key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', backgroundColor: filtreMotif === key ? THEME.accentLight : '#f0f0f0', border: `1px solid ${filtreMotif === key ? THEME.accent : '#ddd'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: filtreMotif === key ? THEME.accent : THEME.text }}>{cfg.label}</span>
                <span style={{ fontSize: '11px', backgroundColor: filtreMotif === key ? THEME.accent : '#ddd', color: filtreMotif === key ? 'white' : THEME.textLight, borderRadius: '10px', padding: '1px 7px', fontWeight: '800' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 ID, vendeur, client, produit..."
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', outline: 'none', width: '230px', backgroundColor: 'white' }} />
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600' }}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filtrePriorite} onChange={e => setFiltrePriorite(e.target.value)}
          style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600' }}>
          <option value="tous">Toutes priorités</option>
          <option value="urgente">🔥 Urgente</option>
          <option value="haute">⚡ Haute</option>
          <option value="normale">— Normale</option>
        </select>
        {(filtreStatut !== 'tous' || filtreMotif !== 'tous' || filtrePriorite !== 'tous' || recherche) && (
          <button onClick={() => { setFiltreStatut('tous'); setFiltreMotif('tous'); setFiltrePriorite('tous'); setRecherche(''); }}
            style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: THEME.textLight, cursor: 'pointer', fontWeight: '600' }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau litiges */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              {['ID Dossier', 'Commande', 'Client / Vendeur', 'Produit', 'Motif', 'Montant', 'Délai', 'Priorité', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {litigesFiltres.map((l, i) => {
              const statutCfg = STATUT_CONFIG[l.statut];
              const estFerme = ['resolu', 'rembourse', 'rejete'].includes(l.statut);
              const nbNonLus = l.messages.filter(m => m.auteur === 'client').length;
              return (
                <tr key={l.id} onClick={() => setLitigeSelectionne(l)}
                  style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: l.priorite === 'urgente' && !estFerme ? '#fff8f8' : i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer', opacity: estFerme ? 0.7 : 1 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f7ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = l.priorite === 'urgente' && !estFerme ? '#fff8f8' : i % 2 === 0 ? 'white' : '#fafafa'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: THEME.accent }}>{l.id}</span>
                      {l.adminAssigne && <p style={{ fontSize: '10px', color: '#aaa', margin: '2px 0 0 0' }}>👷 Assigné</p>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.text }}>{l.storeOrderId}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.text, margin: 0 }}>{l.client}</p>
                    <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>🏪 {l.vendeur}</p>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '12px', color: THEME.text }}>{l.produit}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{MOTIF_CONFIG[l.motif].icon}</span>
                      <span style={{ fontSize: '11px', color: THEME.textLight }}>{MOTIF_CONFIG[l.motif].label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: l.remboursementDemande > 0 ? THEME.danger : THEME.textLight }}>
                      {l.remboursementDemande > 0 ? `${l.remboursementDemande.toFixed(2)} $` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <ChronoBadge heures={l.heuresEcoulees} statut={l.statut} />
                    {estFerme && <span style={{ fontSize: '10px', color: '#aaa' }}>Fermé</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', backgroundColor: PRIORITE_CONFIG[l.priorite].bg, color: PRIORITE_CONFIG[l.priorite].color }}>
                      {l.priorite === 'urgente' ? '🔥' : l.priorite === 'haute' ? '⚡' : '—'} {PRIORITE_CONFIG[l.priorite].label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', backgroundColor: statutCfg.bg, color: statutCfg.color, whiteSpace: 'nowrap' as const }}>
                        {statutCfg.icon} {statutCfg.label}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: THEME.textLight }}>💬 {l.messages.filter(m => !m.interne).length}</span>
                      <button style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        Ouvrir →
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {litigesFiltres.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.25 }}>🔍</div>
            <p style={{ fontSize: '14px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>Aucun litige trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
