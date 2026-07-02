/**
 * MesEncheres.tsx — Dashboard vendeur
 * Chemin : evend-dashboard/src/pages/vendeur/MesEncheres.tsx
 *
 * RÈGLES VIE PRIVÉE :
 *   - Pendant enchère    → surnom seulement (tous les enchérisseurs)
 *   - Après (gagnant)   → vrai nom + email du gagnant (pour expédition)
 *   - Autres enchérisseurs → surnom seulement, toujours
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const getToken = () => localStorage.getItem('token');

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0',
  accent: '#2d6a9f', accentLight: 'rgba(45,106,159,0.1)',
  green: '#10b981', greenLight: 'rgba(16,185,129,0.1)',
  orange: '#f59e0b', orangeLight: 'rgba(245,158,11,0.1)',
  red: '#ef4444', redLight: 'rgba(239,68,68,0.1)',
  text: '#1e293b', textLight: '#64748b', textXLight: '#94a3b8',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Encherisseur {
  acheteur_id: number;
  surnom: string;         // ce que le vendeur voit — toujours
  nb_mises: number;
  montant: number;
  est_gagnant: boolean;
  est_outbid: boolean;
}

interface GagnantInfo {
  acheteur_id: number;
  nom: string;            // vrai nom — vendeur peut voir pour expédition
  surnom: string | null;
  email: string;
  montant: number;
  statut_paiement: 'en_attente' | 'notifie' | 'paye' | 'expire' | 'annule';
  commande_id: number | null;
}

interface EnchereVendeur {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_image: string | null;
  statut: 'a_venir' | 'en_cours' | 'terminee' | 'annulee';
  date_debut: string;
  date_fin: string;
  prix_base: number;
  prix_reserve: number | null;
  mise_courante: number;
  nb_mises: number;
  reserve_atteinte: boolean;
  popcorn: boolean;
  annule_par: 'admin' | 'vendeur' | 'systeme' | null;
  raison_annulation: string | null;
  encherisseurs: Encherisseur[];
  gagnant: GagnantInfo | null;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function useTimer(dateFin: string) {
  const calc = () => {
    const diff = new Date(dateFin).getTime() - Date.now();
    if (diff <= 0) return null;
    return { j: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  };
  const [t, setT] = useState(calc());
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [dateFin]);
  return t;
}

function TimerPill({ dateFin }: { dateFin: string }) {
  const t = useTimer(dateFin);
  if (!t) return <span style={{ color: C.red, fontWeight: 700, fontSize: '12px' }}>Terminée</span>;
  const urgent = t.j === 0 && t.h < 1;
  return (
    <span style={{ color: urgent ? C.red : C.orange, fontWeight: 700, fontSize: '12px', background: urgent ? C.redLight : C.orangeLight, padding: '2px 8px', borderRadius: '20px' }}>
      ⏱ {t.j > 0 ? `${t.j}j ${t.h}h` : `${t.h}h ${t.m}m ${t.s}s`}
    </span>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function BadgeStatut({ statut }: { statut: EnchereVendeur['statut'] }) {
  const m: Record<string, { label: string; color: string; bg: string }> = {
    en_cours: { label: '🟢 En cours', color: C.green, bg: C.greenLight },
    a_venir:  { label: '🔵 À venir',  color: C.accent, bg: C.accentLight },
    terminee: { label: '⬛ Terminée', color: C.textLight, bg: '#f1f5f9' },
    annulee:  { label: '🔴 Annulée',  color: C.red, bg: C.redLight },
  };
  const { label, color, bg } = m[statut] || m.annulee;
  return <span style={{ fontSize: '11px', fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: '20px' }}>{label}</span>;
}

function BadgePaiement({ statut }: { statut: GagnantInfo['statut_paiement'] }) {
  const m: Record<string, { label: string; color: string; bg: string }> = {
    paye:       { label: '✅ Payé',       color: C.green,  bg: C.greenLight },
    notifie:    { label: '📧 Notifié',    color: C.orange, bg: C.orangeLight },
    en_attente: { label: '⏳ En attente', color: C.orange, bg: C.orangeLight },
    expire:     { label: '❌ Expiré',     color: C.red,    bg: C.redLight },
    annule:     { label: '🚫 Annulé',     color: C.red,    bg: C.redLight },
  };
  const { label, color, bg } = m[statut] || m.en_attente;
  return <span style={{ fontSize: '11px', fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: '20px' }}>{label}</span>;
}

// ─── Carte enchère ────────────────────────────────────────────────────────────
function CarteEnchere({ enc, onRefresh }: { enc: EnchereVendeur; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(enc.statut === 'en_cours');
  const [loading, setLoading]   = useState<string | null>(null);
  const [confirm, setConfirm]   = useState(false);

  async function action(acte: string) {
    setLoading(acte);
    try {
      const res = await fetch(`${API_BASE}/encheres-studio/${enc.id}/${acte}`, {
        method: 'PATCH',
        credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      onRefresh();
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setLoading(null);
      setConfirm(false);
    }
  }

  const mise = parseFloat(String(enc.mise_courante || 0));
  const base = parseFloat(String(enc.prix_base || 0));

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

      {/* ── Résumé cliquable ── */}
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
          {enc.produit_image ? <img src={enc.produit_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enc.produit_nom}</h3>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {enc.annule_par === 'admin'
                ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)' }}>🚫 Bloquée par admin</span>
                : <BadgeStatut statut={enc.statut} />
              }
              {enc.popcorn && <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange, background: C.orangeLight, padding: '3px 8px', borderRadius: '20px' }}>🍿</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: mise > 0 ? C.green : C.textLight }}>
              {mise > 0 ? `${mise.toFixed(2)} $` : `Départ : ${base.toFixed(2)} $`}
            </span>
            <span style={{ fontSize: '12px', color: C.textLight }}>{enc.nb_mises} mise{enc.nb_mises !== 1 ? 's' : ''}</span>
            {enc.statut === 'en_cours' && <TimerPill dateFin={enc.date_fin} />}
            {enc.reserve_atteinte && <span style={{ fontSize: '11px', color: C.green, fontWeight: 600 }}>✅ Réserve atteinte</span>}
            {!enc.reserve_atteinte && enc.prix_reserve && mise > 0 && (
              <span style={{ fontSize: '11px', color: C.textLight }}>Réserve : {parseFloat(String(enc.prix_reserve)).toFixed(2)} $</span>
            )}
          </div>
        </div>
        <span style={{ color: C.textXLight, fontSize: '14px', paddingTop: '4px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Actions ── */}
      {(enc.statut === 'a_venir' || enc.statut === 'en_cours') && (
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {enc.statut === 'a_venir' && (
            <button onClick={() => action('demarrer')} disabled={!!loading} style={{ padding: '7px 16px', background: C.green, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {loading === 'demarrer' ? '⏳...' : '▶ Démarrer'}
            </button>
          )}
          {enc.statut === 'en_cours' && !confirm && (
            <button onClick={() => setConfirm(true)} style={{ padding: '7px 16px', background: C.redLight, color: C.red, border: `1px solid ${C.red}40`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              ⏹ Terminer l'enchère
            </button>
          )}
          {enc.statut === 'en_cours' && confirm && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: C.textLight }}>Confirmer la fin ?</span>
              <button onClick={() => action('terminer')} disabled={!!loading} style={{ padding: '6px 14px', background: C.red, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {loading === 'terminer' ? '⏳...' : 'Oui, terminer'}
              </button>
              <button onClick={() => setConfirm(false)} style={{ padding: '6px 14px', background: '#f1f5f9', color: C.text, border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
            </div>
          )}
        </div>
      )}

      {/* ── Détails (expandable) ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px' }}>

          {/* Bloquée par admin */}
          {enc.annule_par === 'admin' && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#ef4444', fontSize: '13px' }}>🚫 Enchère bloquée par l'administration</p>
              {enc.raison_annulation && <p style={{ margin: 0, fontSize: '12px', color: 'rgba(239,68,68,0.7)' }}>Raison : {enc.raison_annulation}</p>}
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: C.textXLight }}>Contactez le support si vous pensez que c'est une erreur.</p>
            </div>
          )}

          {/* Gagnant — info complète pour expédition */}
          {enc.gagnant && (
            <div style={{ background: enc.gagnant.statut_paiement === 'paye' ? C.greenLight : C.orangeLight, border: `1px solid ${enc.gagnant.statut_paiement === 'paye' ? C.green : C.orange}30`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏆 Gagnant</p>
                  <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: C.text }}>
                    {enc.gagnant.nom}
                    {enc.gagnant.surnom && enc.gagnant.surnom !== enc.gagnant.nom && (
                      <span style={{ fontSize: '12px', fontWeight: 500, color: C.textLight, marginLeft: '8px' }}>({enc.gagnant.surnom})</span>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>{enc.gagnant.email}</p>
                  {enc.gagnant.commande_id && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.accent }}>
                      📦 Commande #{enc.gagnant.commande_id}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900, color: C.green }}>{enc.gagnant.montant.toFixed(2)} $</p>
                  <BadgePaiement statut={enc.gagnant.statut_paiement} />
                </div>
              </div>
              {enc.gagnant.statut_paiement === 'paye' && enc.gagnant.commande_id && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.green}30`, fontSize: '12px', color: C.green, fontWeight: 600 }}>
                  ✅ Paiement reçu — commande créée automatiquement (#{enc.gagnant.commande_id})
                </div>
              )}
              {enc.gagnant.statut_paiement !== 'paye' && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.orange}30`, fontSize: '12px', color: C.orange }}>
                  ⏳ En attente du paiement de l'acheteur
                </div>
              )}
            </div>
          )}

          {/* Pas de gagnant */}
          {enc.statut === 'terminee' && !enc.gagnant && (
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: C.textLight }}>
              {enc.nb_mises === 0 ? '❌ Aucune mise — enchère sans acheteur.' : '❌ Prix de réserve non atteint — aucun gagnant déclaré.'}
            </div>
          )}

          {/* Liste enchérisseurs — surnom seulement */}
          {enc.encherisseurs.length > 0 && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Enchérisseurs ({enc.encherisseurs.length})
                <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '8px', color: C.textXLight }}>— noms protégés</span>
              </p>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                {enc.encherisseurs.map((e, i) => (
                  <div key={e.acheteur_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: e.est_gagnant ? C.greenLight : i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: i < enc.encherisseurs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: e.est_gagnant ? C.green : C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>
                        {e.surnom.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: e.est_gagnant ? 700 : 500, color: C.text }}>
                          {e.surnom}
                          {e.est_gagnant && <span style={{ marginLeft: '6px', fontSize: '10px', color: C.green, fontWeight: 700 }}>🏆 GAGNANT</span>}
                          {e.est_outbid && !e.est_gagnant && <span style={{ marginLeft: '6px', fontSize: '10px', color: C.textXLight }}>surpassé</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>{e.nb_mises} mise{e.nb_mises !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: e.est_gagnant ? C.green : C.text }}>
                      {parseFloat(String(e.montant)).toFixed(2)} $
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textXLight, fontStyle: 'italic' }}>
                🔒 Les vrais noms des enchérisseurs sont confidentiels. Seul le nom du gagnant vous est communiqué pour l'expédition.
              </p>
            </div>
          )}

          {enc.nb_mises === 0 && enc.statut !== 'terminee' && (
            <p style={{ margin: 0, fontSize: '13px', color: C.textXLight, textAlign: 'center', padding: '20px 0' }}>Aucune mise pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MesEncheres({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [encheres, setEncheres] = useState<EnchereVendeur[]>([]);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState<string | null>(null);
  const [onglet, setOnglet]     = useState<'actives' | 'terminees'>('actives');

  const charger = useCallback(async () => {
    setLoading(true); setErreur(null);
    try {
      const res = await fetch(`${API_BASE}/encheres-studio/vendeur`, {
        credentials: 'include', headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Transformer les données
      const transformees: EnchereVendeur[] = (data || []).map((e: any) => {
        // Trier les encherisseurs par montant desc
        const encherisseurs: Encherisseur[] = (e.encherisseurs || []).map((enc: any) => ({
          acheteur_id:  enc.id,
          surnom:       enc.nom || `Enchérisseur #${enc.id}`,
          nb_mises:     enc.nbMises || 0,
          montant:      parseFloat(String(enc.miseCourante || 0)),
          est_gagnant:  enc.statut === 'plus_haut' && ['terminee'].includes(e.statut),
          est_outbid:   enc.statut === 'surpasse',
        })).sort((a: Encherisseur, b: Encherisseur) => b.montant - a.montant);

        // Gagnant — infos complètes
        let gagnant: GagnantInfo | null = null;
        if (e.gagnant && e.emailGagnant) {
          gagnant = {
            acheteur_id:    0,
            nom:            e.gagnant,
            surnom:         e.gagnant,
            email:          e.emailGagnant,
            montant:        parseFloat(String(e.miseGagnante || e.miseCourante || 0)),
            statut_paiement: e.statutPaiement || 'en_attente',
            commande_id:    e.commandeId || null,
          };
        }

        return {
          id:               e._id ? parseInt(e._id) : e.id,
          produit_id:       e.produit_id,
          produit_nom:      e.produit || `Produit #${e.produit_id}`,
          produit_image:    e.image_url || null,
          statut:           ['en_cours', 'a_venir', 'terminee', 'annulee'].includes(e.statut) ? e.statut :
                            e.statut?.startsWith('passee') ? 'terminee' : 'annulee',
          date_debut:       e.dateDebut,
          date_fin:         e.dateFin,
          prix_base:        parseFloat(String(e.prixBase || 0)),
          prix_reserve:     e.prixReserve ? parseFloat(String(e.prixReserve)) : null,
          mise_courante:    parseFloat(String(e.miseCourante || 0)),
          nb_mises:         parseInt(String(e.nbMises || 0)),
          reserve_atteinte: !!e.reserveAtteint,
          popcorn:          !!e.estPopcorn,
          annule_par:       e.annulePar || null,
          raison_annulation: e.raisonAnnulation || null,
          encherisseurs,
          gagnant,
        };
      });

      setEncheres(transformees);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const actives   = encheres.filter(e => ['en_cours', 'a_venir'].includes(e.statut));
  const terminees = encheres.filter(e => ['terminee', 'annulee'].includes(e.statut));
  const affichees = onglet === 'actives' ? actives : terminees;

  // Stats
  const totalMises   = encheres.reduce((s, e) => s + e.nb_mises, 0);
  const totalRevenu  = terminees.filter(e => e.gagnant?.statut_paiement === 'paye').reduce((s, e) => s + (e.gagnant?.montant || 0), 0);
  const enAttentePaiement = terminees.filter(e => e.gagnant && e.gagnant.statut_paiement !== 'paye').length;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: C.text }}>🔨 Mes enchères</h1>
          <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Gérez vos enchères et suivez les résultats en temps réel.</p>
        </div>
        <button onClick={charger} style={{ padding: '9px 18px', background: C.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          🔄 Rafraîchir
        </button>
      </div>

      {/* ── KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'En cours',        value: actives.filter(e => e.statut === 'en_cours').length, color: C.green,  bg: C.greenLight,  icon: '🟢' },
          { label: 'À venir',         value: actives.filter(e => e.statut === 'a_venir').length,  color: C.accent, bg: C.accentLight, icon: '🔵' },
          { label: 'Total mises',     value: totalMises,                                           color: C.text,   bg: '#f1f5f9',     icon: '🔨' },
          { label: 'En attente paiement', value: enAttentePaiement,                               color: C.orange, bg: C.orangeLight, icon: '⏳' },
          { label: 'Revenus encaissés',   value: `${totalRevenu.toFixed(2)} $`,                   color: C.green,  bg: C.greenLight,  icon: '💰' },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.icon} {k.label}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
        {([
          { id: 'actives',   label: `Actives (${actives.length})` },
          { id: 'terminees', label: `Historique (${terminees.length})` },
        ] as const).map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: onglet === o.id ? '#fff' : 'transparent', color: onglet === o.id ? C.accent : C.textLight, boxShadow: onglet === o.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Chargement de vos enchères...
        </div>
      ) : erreur ? (
        <div style={{ textAlign: 'center', padding: '40px', background: C.redLight, borderRadius: '14px', color: C.red }}>
          ❌ {erreur}
          <br />
          <button onClick={charger} style={{ marginTop: '12px', padding: '8px 20px', background: C.red, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Réessayer</button>
        </div>
      ) : affichees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔨</div>
          <p>{onglet === 'actives' ? 'Aucune enchère active.' : 'Aucune enchère passée.'}</p>
        </div>
      ) : (
        affichees.map(enc => <CarteEnchere key={enc.id} enc={enc} onRefresh={charger} />)
      )}
    </div>
  );
}