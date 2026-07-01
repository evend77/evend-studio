import React, { useState, useEffect } from 'react';

const THEME = {
  accent:      '#2d6a9f',
  accentLight: '#e8f2fb',
  bg:          '#f0f2f5',
  card:        '#ffffff',
  border:      '#e1e4e8',
  text:        '#1a2332',
  textLight:   '#6b7280',
  danger:      '#dc2626',
  success:     '#16a34a',
  warning:     '#d97706',
  purple:      '#7c3aed',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Encherisseur {
  id: number; nom: string; email: string;
  miseCourante: number; misePrecedente: number; miseMax: number;
  nbMises: number; statut: 'actif' | 'surpasse' | 'banni';
}

interface EnchereEnCours {
  id: string; produit: string; vendeur: string; dateDebut: string; dateFin: string;
  prixBase: number; prixReserve: number; miseCourante: number; nbMises: number;
  statut: 'en_cours' | 'a_venir' | 'popcorn';
  encherisseurs: Encherisseur[];
}

interface EncherePasse {
  id: string; produit: string; vendeur: string; dateDebut: string; dateFin: string;
  prixBase: number; prixReserve: number; miseGagnante: number | null;
  gagnant: string | null; emailGagnant: string | null;
  statut: 'gagnee' | 'reserve_non_atteint' | 'annulee' | 'non_achetee';
  statutAchat: 'achete' | 'non_achete' | 'en_attente' | null;
  nbMises: number; reserveAtteint: boolean; fraisAdhesion: number;
  encherisseurs: Encherisseur[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────
const ENCHERES_EN_COURS: EnchereEnCours[] = [
  {
    id: '#5128900', produit: 'Montre Rolex Submariner Vintage', vendeur: 'Boutique Érable',
    dateDebut: '2026-02-25 09:00', dateFin: '2026-02-28 21:00',
    prixBase: 100, prixReserve: 500, miseCourante: 342, nbMises: 12, statut: 'en_cours',
    encherisseurs: [
      { id: 1, nom: 'Louis-Alexandre Bossé', email: 'la@bos.ca', miseCourante: 342, misePrecedente: 295, miseMax: 500, nbMises: 5, statut: 'actif' },
      { id: 2, nom: 'Marie Tremblay',        email: 'marie@t.ca', miseCourante: 295, misePrecedente: 250, miseMax: 300, nbMises: 4, statut: 'surpasse' },
      { id: 3, nom: 'Jean-Pierre Leblanc',   email: 'jp@lb.ca',  miseCourante: 250, misePrecedente: 200, miseMax: 280, nbMises: 3, statut: 'surpasse' },
    ],
  },
  {
    id: '#5128915', produit: 'CD Glass Piano Bruce Brubaker', vendeur: 'Mode Montréal',
    dateDebut: '2026-02-27 14:00', dateFin: '2026-02-27 23:59',
    prixBase: 20, prixReserve: 50, miseCourante: 47, nbMises: 6, statut: 'popcorn',
    encherisseurs: [
      { id: 4, nom: 'Sophie Gagné',  email: 'sophie@g.ca', miseCourante: 47, misePrecedente: 35, miseMax: 60, nbMises: 3, statut: 'actif' },
      { id: 5, nom: 'Marc Côté',     email: 'marc@c.ca',   miseCourante: 35, misePrecedente: 25, miseMax: 50, nbMises: 3, statut: 'surpasse' },
    ],
  },
  {
    id: '#5128932', produit: 'Porte-clés artisanal en cuir', vendeur: 'Artisans du Nord',
    dateDebut: '2026-03-01 10:00', dateFin: '2026-03-05 18:00',
    prixBase: 15, prixReserve: 40, miseCourante: 0, nbMises: 0, statut: 'a_venir',
    encherisseurs: [],
  },
  {
    id: '#5128948', produit: 'Faux billets loterie - Lot 6 billets', vendeur: 'TechShop QC',
    dateDebut: '2026-02-24 08:00', dateFin: '2026-02-28 20:00',
    prixBase: 5, prixReserve: 20, miseCourante: 18, nbMises: 9, statut: 'en_cours',
    encherisseurs: [
      { id: 6, nom: 'Isabelle Roy',    email: 'isa@r.ca',  miseCourante: 18, misePrecedente: 14, miseMax: 25, nbMises: 4, statut: 'actif' },
      { id: 7, nom: 'Patrick Simard',  email: 'pat@s.ca',  miseCourante: 14, misePrecedente: 10, miseMax: 18, nbMises: 3, statut: 'surpasse' },
      { id: 8, nom: 'Claire Beaulieu', email: 'cl@b.ca',   miseCourante: 10, misePrecedente: 6,  miseMax: 12, nbMises: 2, statut: 'surpasse' },
    ],
  },
];

const ENCHERES_PASSEES: EncherePasse[] = [
  {
    id: '#5128515', produit: 'Porte-stylo Donald Trump Gag', vendeur: 'TechShop QC',
    dateDebut: '2025-12-21 20:55', dateFin: '2025-12-22 20:53',
    prixBase: 10, prixReserve: 12, miseGagnante: 14, gagnant: 'Louis-Alexandre Bossé', emailGagnant: 'la@bos.ca',
    statut: 'non_achetee', statutAchat: 'non_achete', nbMises: 3, reserveAtteint: true, fraisAdhesion: 2,
    encherisseurs: [
      { id: 1, nom: 'Louis-Alexandre Bossé', email: 'la@bos.ca', miseCourante: 14, misePrecedente: 12, miseMax: 15, nbMises: 2, statut: 'actif' },
      { id: 2, nom: 'Marie Tremblay', email: 'marie@t.ca', miseCourante: 12, misePrecedente: 10, miseMax: 13, nbMises: 1, statut: 'surpasse' },
    ],
  },
  {
    id: '#5108076', produit: 'Porte-stylo Donald Trump Gag 1', vendeur: 'TechShop QC',
    dateDebut: '2025-11-23 20:48', dateFin: '2025-11-26 20:46',
    prixBase: 10, prixReserve: 12, miseGagnante: 25, gagnant: 'Louis-Alexandre Bossé', emailGagnant: 'la@bos.ca',
    statut: 'gagnee', statutAchat: 'achete', nbMises: 5, reserveAtteint: true, fraisAdhesion: 2,
    encherisseurs: [
      { id: 1, nom: 'Louis-Alexandre Bossé', email: 'la@bos.ca', miseCourante: 25, misePrecedente: 20, miseMax: 30, nbMises: 3, statut: 'actif' },
      { id: 3, nom: 'Jean-Pierre Leblanc', email: 'jp@lb.ca', miseCourante: 20, misePrecedente: 15, miseMax: 22, nbMises: 2, statut: 'surpasse' },
    ],
  },
  {
    id: '#5104514', produit: 'CD Glass Piano Bruce Brubaker', vendeur: 'Boutique Érable',
    dateDebut: '2025-11-19 10:13', dateFin: '2025-11-20 09:12',
    prixBase: 1, prixReserve: 15, miseGagnante: null, gagnant: null, emailGagnant: null,
    statut: 'reserve_non_atteint', statutAchat: null, nbMises: 0, reserveAtteint: false, fraisAdhesion: 0,
    encherisseurs: [],
  },
  {
    id: '#5104483', produit: 'Montre pour femme à quartz modèle 1', vendeur: 'Mode Montréal',
    dateDebut: '2025-11-17 11:57', dateFin: '2025-11-17 12:44',
    prixBase: 20, prixReserve: 50, miseGagnante: null, gagnant: null, emailGagnant: null,
    statut: 'annulee', statutAchat: null, nbMises: 0, reserveAtteint: false, fraisAdhesion: 0,
    encherisseurs: [],
  },
  {
    id: '#5102574', produit: 'Montre pour femme', vendeur: 'Mode Montréal',
    dateDebut: '2025-11-14 08:55', dateFin: '2025-11-15 07:52',
    prixBase: 15, prixReserve: 15, miseGagnante: 15.99, gagnant: 'Louis-Alexandre Bossé', emailGagnant: 'la@bos.ca',
    statut: 'gagnee', statutAchat: 'en_attente', nbMises: 2, reserveAtteint: true, fraisAdhesion: 3,
    encherisseurs: [
      { id: 1, nom: 'Louis-Alexandre Bossé', email: 'la@bos.ca', miseCourante: 15.99, misePrecedente: 15, miseMax: 20, nbMises: 2, statut: 'actif' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}30`, borderRadius: '20px', padding: '3px 11px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  );
}

function statutEnCoursLabel(s: string) {
  if (s === 'en_cours') return <Badge label="En cours" color="#16a34a" bg="#f0fdf4" />;
  if (s === 'popcorn')  return <Badge label="🍿 Popcorn" color="#d97706" bg="#fffbeb" />;
  return <Badge label="À venir" color="#2d6a9f" bg="#eff6ff" />;
}

function statutPasseLabel(s: string) {
  if (s === 'gagnee')               return <Badge label="✅ Gagnée" color="#16a34a" bg="#f0fdf4" />;
  if (s === 'reserve_non_atteint')  return <Badge label="❌ Réserve non atteinte" color="#dc2626" bg="#fef2f2" />;
  if (s === 'annulee')              return <Badge label="⚠️ Annulée" color="#d97706" bg="#fffbeb" />;
  return <Badge label="🔴 Non achetée" color="#dc2626" bg="#fef2f2" />;
}

function statutAchatLabel(s: string | null) {
  if (!s) return <span style={{ color: THEME.textLight, fontSize: '12px' }}>—</span>;
  if (s === 'achete')     return <Badge label="Acheté" color="#16a34a" bg="#f0fdf4" />;
  if (s === 'non_achete') return <Badge label="Non acheté" color="#dc2626" bg="#fef2f2" />;
  return <Badge label="En attente" color="#d97706" bg="#fffbeb" />;
}

function statutEncherisseurLabel(s: string) {
  if (s === 'actif')    return <Badge label="Plus haut" color="#16a34a" bg="#f0fdf4" />;
  if (s === 'surpasse') return <Badge label="Surpassé" color="#d97706" bg="#fffbeb" />;
  return <Badge label="Banni" color="#dc2626" bg="#fef2f2" />;
}

// Timer compte à rebours
function CountdownTimer({ dateFin }: { dateFin: string }) {
  const calcRemaining = () => {
    const end = new Date(dateFin).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      j: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };

  const [t, setT] = useState(calcRemaining());
  useEffect(() => {
    const interval = setInterval(() => setT(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, [dateFin]);

  if (t.expired) return <span style={{ color: THEME.danger, fontWeight: '700', fontSize: '13px' }}>Expirée</span>;

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[
        { v: t.j, label: 'j' },
        { v: t.h, label: 'h' },
        { v: t.m, label: 'm' },
        { v: t.s, label: 's' },
      ].map(u => (
        <div key={u.label} style={{ background: THEME.accent, color: '#fff', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', minWidth: '32px', textAlign: 'center' as const }}>
          {String(u.v).padStart(2, '0')}<span style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px' }}>{u.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Popup enchère en cours
// ─────────────────────────────────────────────────────────────────────────────
function PopupEnchereEnCours({ enchere, onClose }: { enchere: EnchereEnCours; onClose: () => void }) {
  const [confirmerAction, setConfirmerAction] = useState<string | null>(null);
  const [miseManuelleMontant, setMiseManuelleMontant] = useState('');
  const [miseManuelleBidder, setMiseManuelleBidder]   = useState('');
  const [banniId, setBanniId] = useState<number | null>(null);

  const actionColor = (a: string) => {
    if (a === 'Terminer maintenant') return THEME.danger;
    if (a === 'Annuler')             return '#6b7280';
    if (a === 'Mise manuelle')       return THEME.accent;
    return '#7c3aed';
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* En-tête dégradé */}
        <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #3b82c4 100%)', padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '17px', fontWeight: '800' }}>{enchere.produit}</h2>
              {statutEnCoursLabel(enchere.statut)}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '12px' }}>
              Enchère {enchere.id} · Vendeur : {enchere.vendeur}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '17px' }}>
            ✕
          </button>
        </div>

        <div style={{ overflowY: 'auto' as const, flex: 1 }}>
          {/* Infos & timer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', borderBottom: `1px solid ${THEME.border}` }}>
            {[
              { label: 'Mise courante', value: enchere.miseCourante > 0 ? `CAD ${enchere.miseCourante.toFixed(2)}` : '—', color: THEME.success },
              { label: 'Prix de réserve', value: `CAD ${enchere.prixReserve.toFixed(2)}`, color: enchere.miseCourante >= enchere.prixReserve ? THEME.success : THEME.danger },
              { label: 'Nombre de mises', value: String(enchere.nbMises), color: THEME.accent },
              { label: 'Enchérisseurs actifs', value: String(enchere.encherisseurs.filter(e => e.statut !== 'banni').length), color: THEME.purple },
            ].map(k => (
              <div key={k.label} style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '11px', color: THEME.textLight, textTransform: 'uppercase' as const, fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.4px' }}>{k.label}</p>
                <p style={{ fontSize: '22px', fontWeight: '800', color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Timer + dates */}
          <div style={{ display: 'flex', gap: '24px', padding: '16px 24px', background: '#f8fafc', borderBottom: `1px solid ${THEME.border}`, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <div>
              <p style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Temps restant</p>
              <CountdownTimer dateFin={enchere.dateFin} />
            </div>
            <div style={{ height: '40px', width: '1px', background: THEME.border }} />
            <div>
              <p style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Début</p>
              <p style={{ fontSize: '13px', color: THEME.text, margin: 0 }}>{enchere.dateDebut}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Fin prévue</p>
              <p style={{ fontSize: '13px', color: THEME.text, margin: 0 }}>{enchere.dateFin}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '700', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Prix de base</p>
              <p style={{ fontSize: '13px', color: THEME.text, margin: 0 }}>CAD {enchere.prixBase.toFixed(2)}</p>
            </div>
            {enchere.miseCourante >= enchere.prixReserve && (
              <Badge label="✅ Prix de réserve atteint" color={THEME.success} bg="#f0fdf4" />
            )}
            {enchere.miseCourante < enchere.prixReserve && enchere.miseCourante > 0 && (
              <Badge label="❌ Réserve non atteinte" color={THEME.danger} bg="#fef2f2" />
            )}
          </div>

          {/* Tableau enchérisseurs */}
          <div style={{ padding: '20px 24px 0' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
              👥 Enchérisseurs en cours ({enchere.encherisseurs.length})
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                {['#', 'Enchérisseur', 'Courriel', 'Mise courante', 'Mise précédente', 'Mise max.', 'Nb mises', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enchere.encherisseurs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '30px', textAlign: 'center' as const, color: THEME.textLight, fontSize: '14px' }}>Aucune mise pour le moment</td></tr>
              ) : enchere.encherisseurs.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.textLight }}>{i + 1}</td>
                  <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: THEME.text }}>{e.nom}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: THEME.textLight }}>{e.email}</td>
                  <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: i === 0 ? THEME.success : THEME.text }}>CAD {e.miseCourante.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.textLight }}>CAD {e.misePrecedente.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.purple }}>CAD {e.miseMax.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.text, textAlign: 'center' as const }}>{e.nbMises}</td>
                  <td style={{ padding: '12px 14px' }}>{statutEncherisseurLabel(e.statut)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {e.statut !== 'banni' && (
                      <button onClick={() => setBanniId(e.id)}
                        style={{ background: '#fef2f2', color: THEME.danger, border: `1px solid ${THEME.danger}30`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        🚫 Bannir
                      </button>
                    )}
                    {e.statut === 'banni' && (
                      <span style={{ fontSize: '12px', color: THEME.danger }}>Banni</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Confirmation bannissement */}
          {banniId !== null && (
            <div style={{ margin: '16px 24px', background: '#fef2f2', border: `1px solid ${THEME.danger}30`, borderRadius: '8px', padding: '14px 18px' }}>
              <p style={{ fontSize: '13px', color: THEME.danger, margin: '0 0 10px', fontWeight: '600' }}>
                Confirmer le bannissement de {enchere.encherisseurs.find(e => e.id === banniId)?.nom} ?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setBanniId(null)}
                  style={{ background: '#fff', color: THEME.danger, border: `1px solid ${THEME.danger}`, borderRadius: '6px', padding: '6px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Confirmer le bannissement
                </button>
                <button onClick={() => setBanniId(null)}
                  style={{ background: THEME.border, color: THEME.textLight, border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div style={{ padding: '20px 24px 24px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 14px' }}>⚡ Actions rapides</p>

            {confirmerAction === 'Mise manuelle' ? (
              <div style={{ background: '#f0f6ff', border: `1px solid ${THEME.accent}30`, borderRadius: '10px', padding: '18px 20px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.accent, margin: '0 0 14px' }}>Ajouter une mise manuelle</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, marginBottom: '6px' }}>Nom de l'enchérisseur</label>
                    <input type="text" value={miseManuelleBidder} onChange={e => setMiseManuelleBidder(e.target.value)}
                      placeholder="Nom complet..."
                      style={{ width: '200px', padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, marginBottom: '6px' }}>Montant (CAD)</label>
                    <input type="number" value={miseManuelleMontant} onChange={e => setMiseManuelleMontant(e.target.value)}
                      placeholder="0.00"
                      style={{ width: '120px', padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <button onClick={() => setConfirmerAction(null)}
                      style={{ background: THEME.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      Confirmer la mise
                    </button>
                    <button onClick={() => setConfirmerAction(null)}
                      style={{ background: '#fff', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : confirmerAction ? (
              <div style={{ background: '#fef2f2', border: `1px solid ${THEME.danger}30`, borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.danger, margin: '0 0 12px' }}>
                  Confirmer : {confirmerAction} l'enchère?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setConfirmerAction(null)}
                    style={{ background: THEME.danger, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Oui, confirmer
                  </button>
                  <button onClick={() => setConfirmerAction(null)}
                    style={{ background: '#fff', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {[
                { label: 'Terminer maintenant', icon: '⏹️' },
                { label: 'Annuler', icon: '🚫' },
                { label: 'Mise manuelle', icon: '✍️' },
              ].map(a => (
                <button key={a.label} onClick={() => setConfirmerAction(a.label)}
                  style={{ background: confirmerAction === a.label ? actionColor(a.label) : '#fff', color: confirmerAction === a.label ? '#fff' : actionColor(a.label), border: `2px solid ${actionColor(a.label)}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Popup enchère passée
// ─────────────────────────────────────────────────────────────────────────────
function PopupEncherePasse({ enchere, onClose }: { enchere: EncherePasse; onClose: () => void }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '860px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* En-tête dégradé selon statut */}
        <div style={{
          background: enchere.statut === 'gagnee'
            ? 'linear-gradient(135deg, #064e3b 0%, #059669 100%)'
            : enchere.statut === 'annulee'
              ? 'linear-gradient(135deg, #78350f 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
          padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '17px', fontWeight: '800' }}>{enchere.produit}</h2>
              {statutPasseLabel(enchere.statut)}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '12px' }}>
              Enchère {enchere.id} · Vendeur : {enchere.vendeur}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '17px' }}>
            ✕
          </button>
        </div>

        <div style={{ overflowY: 'auto' as const, flex: 1 }}>
          {/* Métriques clés */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', borderBottom: `1px solid ${THEME.border}` }}>
            {[
              { label: 'Mise gagnante', value: enchere.miseGagnante ? `CAD ${enchere.miseGagnante.toFixed(2)}` : '—', color: THEME.success },
              { label: 'Prix de réserve', value: `CAD ${enchere.prixReserve.toFixed(2)}`, color: enchere.reserveAtteint ? THEME.success : THEME.danger },
              { label: 'Total mises', value: String(enchere.nbMises), color: THEME.accent },
              { label: 'Frais d\'adhésion', value: enchere.fraisAdhesion > 0 ? `CAD ${enchere.fraisAdhesion.toFixed(2)}` : '—', color: THEME.purple },
            ].map(k => (
              <div key={k.label} style={{ padding: '16px 20px', borderRight: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '11px', color: THEME.textLight, textTransform: 'uppercase' as const, fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.4px' }}>{k.label}</p>
                <p style={{ fontSize: '22px', fontWeight: '800', color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Infos détaillées */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', padding: '0', borderBottom: `1px solid ${THEME.border}` }}>
            {/* Produit */}
            <div style={{ padding: '20px 24px', borderRight: `1px solid ${THEME.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>Détails du produit</p>
              {[
                { label: 'ID enchère', val: enchere.id },
                { label: 'Vendeur', val: enchere.vendeur },
                { label: 'Prix de base', val: `CAD ${enchere.prixBase.toFixed(2)}` },
                { label: 'Prix de réserve', val: `CAD ${enchere.prixReserve.toFixed(2)}` },
                { label: 'Réserve atteinte', val: enchere.reserveAtteint ? '✅ Oui' : '❌ Non' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: THEME.textLight }}>{r.label}</span>
                  <span style={{ color: THEME.text, fontWeight: '600' }}>{r.val}</span>
                </div>
              ))}
            </div>
            {/* Gagnant */}
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>Gagnant &amp; achat</p>
              {[
                { label: 'Gagnant', val: enchere.gagnant ?? 'Aucun gagnant' },
                { label: 'Courriel', val: enchere.emailGagnant ?? '—' },
                { label: 'Mise gagnante', val: enchere.miseGagnante ? `CAD ${enchere.miseGagnante.toFixed(2)}` : '—' },
                { label: 'Statut d\'achat', val: enchere.statutAchat ?? '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: THEME.textLight }}>{r.label}</span>
                  <span style={{ color: THEME.text, fontWeight: '600' }}>
                    {r.label === 'Statut d\'achat' ? statutAchatLabel(enchere.statutAchat) : r.val}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: THEME.textLight }}>Durée</span>
                <span style={{ color: THEME.text, fontWeight: '600' }}>{enchere.dateDebut.split(' ')[0]} → {enchere.dateFin.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Historique mises */}
          <div style={{ padding: '20px 24px 0' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
              📋 Historique des mises ({enchere.encherisseurs.length})
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                {['#', 'Enchérisseur', 'Courriel', 'Mise', 'Mise précédente', 'Mise max.', 'Nb mises', 'Résultat'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enchere.encherisseurs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center' as const, color: THEME.textLight, fontSize: '14px' }}>Aucune mise enregistrée</td></tr>
              ) : enchere.encherisseurs.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.textLight }}>{i + 1}</td>
                  <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: THEME.text }}>{e.nom}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: THEME.textLight }}>{e.email}</td>
                  <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: i === 0 ? THEME.success : THEME.text }}>CAD {e.miseCourante.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.textLight }}>CAD {e.misePrecedente.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.purple }}>CAD {e.miseMax.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: THEME.text, textAlign: 'center' as const }}>{e.nbMises}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {i === 0 && enchere.statut === 'gagnee' ? <Badge label="🏆 Gagnant" color={THEME.success} bg="#f0fdf4" /> : statutEncherisseurLabel(e.statut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ height: '24px' }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglet Enchères en cours
// ─────────────────────────────────────────────────────────────────────────────
function OngletEnCoursTab() {
  const [enchereSelectee, setEnchereSelectee] = useState<EnchereEnCours | null>(null);
  const [filtreStatut,     setFiltreStatut]    = useState('tous');
  const [recherche,        setRecherche]       = useState('');

  const filtrées = ENCHERES_EN_COURS.filter(e => {
    const matchRech = e.produit.toLowerCase().includes(recherche.toLowerCase()) || e.id.includes(recherche) || e.vendeur.toLowerCase().includes(recherche.toLowerCase());
    const matchStat = filtreStatut === 'tous' || e.statut === filtreStatut;
    return matchRech && matchStat;
  });

  const stats = {
    enCours: ENCHERES_EN_COURS.filter(e => e.statut === 'en_cours').length,
    aVenir:  ENCHERES_EN_COURS.filter(e => e.statut === 'a_venir').length,
    popcorn: ENCHERES_EN_COURS.filter(e => e.statut === 'popcorn').length,
    totalMises: ENCHERES_EN_COURS.reduce((s, e) => s + e.nbMises, 0),
  };

  return (
    <div style={{ padding: '20px 20px' }}>
      {enchereSelectee && <PopupEnchereEnCours enchere={enchereSelectee} onClose={() => setEnchereSelectee(null)} />}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'En cours', value: stats.enCours, color: THEME.success, bg: '#f0fdf4', icon: '🔴' },
          { label: 'À venir',  value: stats.aVenir,  color: THEME.accent,  bg: '#eff6ff', icon: '⏳' },
          { label: 'Popcorn',  value: stats.popcorn, color: '#d97706',     bg: '#fffbeb', icon: '🍿' },
          { label: 'Total mises aujourd\'hui', value: stats.totalMises, color: THEME.purple, bg: '#f5f3ff', icon: '🔨' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}20`, borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: k.color, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>{k.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: k.color, margin: 0 }}>{k.value}</p>
              </div>
              <span style={{ fontSize: '22px' }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher par produit, ID, vendeur..."
          style={{ flex: '1', minWidth: '240px', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = THEME.accent)}
          onBlur={e => (e.target.style.borderColor = THEME.border)} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { val: 'tous', label: 'Tous' },
            { val: 'en_cours', label: '🔴 En cours' },
            { val: 'a_venir',  label: '⏳ À venir' },
            { val: 'popcorn',  label: '🍿 Popcorn' },
          ].map(f => (
            <button key={f.val} onClick={() => setFiltreStatut(f.val)}
              style={{ padding: '8px 14px', border: `2px solid ${filtreStatut === f.val ? THEME.accent : THEME.border}`, borderRadius: '8px', background: filtreStatut === f.val ? THEME.accentLight : '#fff', color: filtreStatut === f.val ? THEME.accent : THEME.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, overflowX: 'auto' as const }}>
        <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              {['ID', 'Produit', 'Vendeur', 'Début', 'Fin / Temps restant', 'Mise courante', 'Nb mises', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrées.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center' as const, color: THEME.textLight, fontSize: '14px' }}>Aucune enchère trouvée</td></tr>
            ) : filtrées.map((e, i) => (
              <tr key={e.id}
                style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc', cursor: 'default', transition: 'background 0.15s' }}
                onMouseEnter={ev => (ev.currentTarget.style.background = THEME.accentLight)}
                onMouseLeave={ev => (ev.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}>
                <td style={{ padding: '13px 14px' }}><code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', color: THEME.accent }}>{e.id}</code></td>
                <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: '600', color: THEME.text, maxWidth: '200px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={e.produit}>{e.produit}</div>
                </td>
                <td style={{ padding: '13px 14px', fontSize: '12px', color: THEME.textLight }}>{e.vendeur}</td>
                <td style={{ padding: '13px 14px', fontSize: '12px', color: THEME.textLight, whiteSpace: 'nowrap' as const }}>{e.dateDebut}</td>
                <td style={{ padding: '13px 14px' }}>
                  {e.statut !== 'a_venir' ? <CountdownTimer dateFin={e.dateFin} /> : <span style={{ fontSize: '12px', color: THEME.textLight }}>{e.dateFin}</span>}
                </td>
                <td style={{ padding: '13px 14px', fontSize: '14px', fontWeight: '700', color: e.nbMises > 0 ? THEME.success : THEME.textLight }}>
                  {e.nbMises > 0 ? `CAD ${e.miseCourante.toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '13px 14px', fontSize: '14px', fontWeight: '700', color: THEME.text, textAlign: 'center' as const }}>{e.nbMises}</td>
                <td style={{ padding: '13px 14px' }}>{statutEnCoursLabel(e.statut)}</td>
                <td style={{ padding: '13px 14px' }}>
                  <button onClick={() => setEnchereSelectee(e)}
                    style={{ background: THEME.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' as const }}>
                    👁️ Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglet Enchères passées
// ─────────────────────────────────────────────────────────────────────────────
function OngletPasseesTab() {
  const [enchereSelectee, setEnchereSelectee] = useState<EncherePasse | null>(null);
  const [filtreStatut,    setFiltreStatut]    = useState('tous');
  const [recherche,       setRecherche]       = useState('');

  const filtrées = ENCHERES_PASSEES.filter(e => {
    const matchRech = e.produit.toLowerCase().includes(recherche.toLowerCase()) || e.id.includes(recherche) || e.vendeur.toLowerCase().includes(recherche.toLowerCase()) || (e.gagnant ?? '').toLowerCase().includes(recherche.toLowerCase());
    const matchStat = filtreStatut === 'tous' || e.statut === filtreStatut;
    return matchRech && matchStat;
  });

  const stats = {
    gagnees:     ENCHERES_PASSEES.filter(e => e.statut === 'gagnee').length,
    nonAtteint:  ENCHERES_PASSEES.filter(e => e.statut === 'reserve_non_atteint').length,
    annulees:    ENCHERES_PASSEES.filter(e => e.statut === 'annulee').length,
    nonAchetees: ENCHERES_PASSEES.filter(e => e.statut === 'non_achetee').length,
  };

  return (
    <div style={{ padding: '20px 20px' }}>
      {enchereSelectee && <PopupEncherePasse enchere={enchereSelectee} onClose={() => setEnchereSelectee(null)} />}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Gagnées', value: stats.gagnees, color: THEME.success, bg: '#f0fdf4', icon: '✅' },
          { label: 'Réserve non atteinte', value: stats.nonAtteint, color: THEME.danger, bg: '#fef2f2', icon: '❌' },
          { label: 'Annulées', value: stats.annulees, color: '#d97706', bg: '#fffbeb', icon: '⚠️' },
          { label: 'Non achetées', value: stats.nonAchetees, color: '#7c3aed', bg: '#f5f3ff', icon: '🔴' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}20`, borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: k.color, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>{k.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: k.color, margin: 0 }}>{k.value}</p>
              </div>
              <span style={{ fontSize: '22px' }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher par produit, ID, vendeur, gagnant..."
          style={{ flex: '1', minWidth: '240px', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = THEME.accent)}
          onBlur={e => (e.target.style.borderColor = THEME.border)} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {[
            { val: 'tous', label: 'Toutes' },
            { val: 'gagnee', label: '✅ Gagnées' },
            { val: 'reserve_non_atteint', label: '❌ Réserve' },
            { val: 'annulee', label: '⚠️ Annulées' },
            { val: 'non_achetee', label: '🔴 Non achetées' },
          ].map(f => (
            <button key={f.val} onClick={() => setFiltreStatut(f.val)}
              style={{ padding: '8px 12px', border: `2px solid ${filtreStatut === f.val ? THEME.accent : THEME.border}`, borderRadius: '8px', background: filtreStatut === f.val ? THEME.accentLight : '#fff', color: filtreStatut === f.val ? THEME.accent : THEME.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, overflowX: 'auto' as const }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              {['ID', 'Produit', 'Vendeur', 'Période', 'Gagnant', 'Mise gagnante', 'Réserve', 'Mises', 'Achat', 'Résultat', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 10px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrées.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center' as const, color: THEME.textLight, fontSize: '14px' }}>Aucune enchère trouvée</td></tr>
            ) : filtrées.map((e, i) => (
              <tr key={e.id}
                style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc', cursor: 'default', transition: 'background 0.15s' }}
                onMouseEnter={ev => (ev.currentTarget.style.background = THEME.accentLight)}
                onMouseLeave={ev => (ev.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}>
                <td style={{ padding: '10px 10px' }}><code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: THEME.accent }}>{e.id}</code></td>
                <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: '600', color: THEME.text, maxWidth: '140px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={e.produit}>{e.produit}</div>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: THEME.textLight, whiteSpace: 'nowrap' as const }}>{e.vendeur}</td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: THEME.textLight, whiteSpace: 'nowrap' as const }}>
                  {e.dateDebut.split(' ')[0]}<br/>{e.dateFin.split(' ')[0]}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: THEME.text, maxWidth: '120px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={e.gagnant ?? ''}>{e.gagnant ?? <span style={{ color: THEME.textLight }}>—</span>}</div>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: e.miseGagnante ? THEME.success : THEME.textLight }}>
                  {e.miseGagnante ? `CAD ${e.miseGagnante.toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' as const }}>
                  {e.reserveAtteint ? <Badge label="Oui" color={THEME.success} bg="#f0fdf4" /> : <Badge label="Non" color={THEME.danger} bg="#fef2f2" />}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '700', color: THEME.text, textAlign: 'center' as const }}>{e.nbMises}</td>
                <td style={{ padding: '10px 8px' }}>{statutAchatLabel(e.statutAchat)}</td>
                <td style={{ padding: '10px 8px' }}>{statutPasseLabel(e.statut)}</td>
                <td style={{ padding: '10px 8px' }}>
                  <button onClick={() => setEnchereSelectee(e)}
                    style={{ background: THEME.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    👁️ Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale — GestionEncheres
// ─────────────────────────────────────────────────────────────────────────────
export default function GestionEncheres({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [onglet, setOnglet] = useState<'en_cours' | 'passees'>('en_cours');

  return (
    <div style={{ padding: '16px 20px 0', maxWidth: '100%' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            🔨 Gestion des enchères
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Suivez et gérez toutes les enchères de la plateforme en temps réel.
          </p>
        </div>
        <button style={{ background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          + Ajouter une enchère
        </button>
      </div>

      {/* Carte avec onglets */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc' }}>
          {[
            { id: 'en_cours', label: `🔴 Enchères en cours (${ENCHERES_EN_COURS.length})` },
            { id: 'passees',  label: `📋 Enchères passées (${ENCHERES_PASSEES.length})` },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id as any)}
              style={{ padding: '14px 28px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: onglet === o.id ? '700' : '500', color: onglet === o.id ? THEME.accent : THEME.textLight, cursor: 'pointer', borderBottom: onglet === o.id ? `3px solid ${THEME.accent}` : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === 'en_cours' && <OngletEnCoursTab />}
        {onglet === 'passees'  && <OngletPasseesTab />}
      </div>
    </div>
  );
}
