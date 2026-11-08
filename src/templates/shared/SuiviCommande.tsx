// CHEMIN : src/templates/shared/SuiviCommande.tsx
// e-Vend Studio — Timeline de suivi d'une commande (dashboard collaborateur ET dashboard acheteur).
// Adapté de la timeline d'e-Vend (Commandes.tsx, composant SuiviCommande) : mêmes étapes de livraison, mêmes états d'exception.
// Étapes « manuelles » : Reçue → Payée → Acceptée → Expédiée → Livrée.
// Quand une étiquette a été achetée (add-on Shippo…) : s'ajoutent « Étiquette créée » et « En transit » (suivi automatique du transporteur),
// puis l'historique détaillé (date, lieu, événement) est consultable.

import React, { useState } from 'react';

export interface CommandeSuivi {
  statut: string;                       // en_attente | confirmee | expediee | livree | annulee
  statut_paiement?: string;
  etape_livraison?: string | null;      // etiquette_creer | transit | tri | livraison | prete_ramassage | livree | livraison_echouee | retournee_expediteur
  etiquette_provider?: string | null;
  historique_suivi?: unknown;
  raison_annulation?: string | null;
  annule_par?: string | null;
  numero_suivi?: string | null;
  transporteur?: string | null;
  url_suivi?: string | null;
}

interface Etape { key: string; emoji: string; label: string; auto?: boolean; siActive?: boolean }
interface Evenement { date?: string; statut?: string; description?: string }

const ETAPES: Etape[] = [
  { key: 'creee',           emoji: '🧾', label: 'Commande reçue' },
  { key: 'payee',           emoji: '💳', label: 'Payée' },
  { key: 'acceptee',        emoji: '✔️', label: 'Acceptée' },
  { key: 'etiquette_creer', emoji: '🏷️', label: 'Étiquette créée', auto: true },
  { key: 'expediee',        emoji: '🚚', label: 'Expédiée' },
  { key: 'transit',         emoji: '🚛', label: 'En transit', auto: true },
  { key: 'tri',             emoji: '🏢', label: 'Centre de tri', siActive: true },
  { key: 'livraison',       emoji: '🛣️', label: 'En cours de livraison', siActive: true },
  { key: 'prete_ramassage', emoji: '🏪', label: 'Prêt à récupérer', siActive: true },
  { key: 'livree',          emoji: '🏠', label: 'Livrée' },
];
const EXCEPTIONS: Record<string, Etape> = {
  annulee:              { key: 'annulee', emoji: '❌', label: 'Annulée' },
  livraison_echouee:    { key: 'livraison_echouee', emoji: '⚠️', label: 'Échec de livraison' },
  retournee_expediteur: { key: 'retournee_expediteur', emoji: '↩️', label: "Retournée à l'expéditeur" },
};

/** Étape courante d'une commande (clé de ETAPES ou d'EXCEPTIONS). */
export function etapeActive(c: CommandeSuivi): string {
  if (c.statut === 'annulee') return 'annulee';
  const e = c.etape_livraison || '';
  if (e === 'livraison_echouee' || e === 'retournee_expediteur') return e;
  if (c.statut === 'livree' || e === 'livree') return 'livree';
  if (e === 'transit' || e === 'tri' || e === 'livraison' || e === 'prete_ramassage') return e;
  if (c.statut === 'expediee') return 'expediee';
  if (e === 'etiquette_creer') return 'etiquette_creer';
  if (c.statut === 'confirmee') return 'acceptee';
  if (c.statut_paiement === 'paye') return 'payee';
  return 'creee';
}

function lireHistorique(brut: unknown): Evenement[] {
  try {
    const h = typeof brut === 'string' ? JSON.parse(brut) : brut;
    return Array.isArray(h) ? (h as Evenement[]) : [];
  } catch { return []; }
}

const urlSure = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
const dateLongue = (d?: string) => { if (!d) return 'Date inconnue'; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return 'Date inconnue'; } };

interface Props {
  commande: CommandeSuivi;
  theme: 'clair' | 'sombre';
  accent: string;
  isMobile?: boolean;
  titre?: string;
  afficherInfosSuivi?: boolean;         // transporteur / n° de suivi / lien (déjà affichés ailleurs côté collaborateur)
}

export default function SuiviCommande({ commande, theme, accent, isMobile, titre = '🗺️ Suivi de la commande', afficherInfosSuivi = false }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const sombre = theme === 'sombre';
  const C = sombre
    ? { texte: '#fff', doux: 'rgba(255,255,255,.55)', ligne: 'rgba(255,255,255,.12)', fond: 'rgba(255,255,255,.04)', bord: 'rgba(255,255,255,.1)', futur: 'rgba(255,255,255,.07)' }
    : { texte: '#1a2332', doux: '#6b7280', ligne: '#e1e4e8', fond: '#f8fafc', bord: '#e1e4e8', futur: '#eef1f4' };
  const ROUGE = '#ef4444';
  const VERT = '#10b981';

  const actif = etapeActive(commande);
  const auto = !!commande.etiquette_provider;
  const exception = EXCEPTIONS[actif];

  // Étapes affichées : les étapes « automatiques » seulement si une étiquette a été achetée ; « en livraison » / « prêt à récupérer » seulement si c'est l'état actuel
  const visibles = ETAPES.filter((e) => (!e.auto || auto) && (!e.siActive || e.key === actif));
  let affichees: Etape[]; let indexActif: number;
  if (exception) {
    // La commande « bifurque » : on garde les étapes déjà franchies puis le marqueur d'exception
    let derniere = 'creee';
    if (actif === 'annulee') derniere = commande.statut_paiement === 'paye' || commande.statut_paiement === 'rembourse' ? 'payee' : 'creee';
    else derniere = auto ? 'transit' : 'expediee';
    const i = Math.max(0, visibles.findIndex((e) => e.key === derniere));
    affichees = [...visibles.slice(0, i + 1), exception];
    indexActif = affichees.length - 1;
  } else {
    affichees = visibles;
    indexActif = Math.max(0, visibles.findIndex((e) => e.key === actif));
  }
  const couleurDe = (e: Etape, i: number) => (exception && i === affichees.length - 1 ? ROUGE : e.key === 'livree' ? VERT : accent);
  const courante = affichees[indexActif];
  const historique = lireHistorique(commande.historique_suivi);
  const lien = urlSure(commande.url_suivi);

  return (
    <div style={{ background: sombre ? 'rgba(255,255,255,.03)' : '#fff', border: `1px solid ${C.bord}`, borderRadius: sombre ? 18 : 12, padding: isMobile ? 14 : 20, marginBottom: sombre ? 0 : 14 }}>
      <p style={{ margin: '0 0 16px', fontSize: sombre ? 14 : 12, fontWeight: 700, color: sombre ? '#fff' : C.doux, textTransform: sombre ? 'none' : 'uppercase', letterSpacing: sombre ? 0 : 0.3 }}>{titre}</p>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', minWidth: Math.max(affichees.length * 78, 300) }}>
          <div style={{ position: 'absolute', top: 16, left: 30, right: 30, height: 3, background: C.ligne, borderRadius: 2 }} />
          {affichees.length > 1 && indexActif > 0 && (
            <div style={{ position: 'absolute', top: 16, left: 30, height: 3, borderRadius: 2, background: couleurDe(courante, indexActif),
              width: `calc((100% - 60px) * ${indexActif / (affichees.length - 1)})`, transition: 'width .6s ease' }} />
          )}
          {affichees.map((e, i) => {
            const passee = i < indexActif; const cour = i === indexActif; const col = couleurDe(e, i);
            return (
              <div key={e.key} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: cour ? 16 : 13, fontWeight: 800,
                  background: passee || cour ? col : C.futur, color: passee || cour ? '#fff' : C.doux, border: cour ? `3px solid ${col}` : `2px solid ${passee ? col : C.ligne}`,
                  boxShadow: cour ? `0 0 14px ${col}66` : 'none' }}>
                  {passee ? '✓' : e.emoji}
                </div>
                <span style={{ fontSize: 10, lineHeight: 1.25, textAlign: 'center', maxWidth: 74, fontWeight: cour ? 700 : 500, color: cour ? col : passee ? C.texte : C.doux }}>{e.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: '11px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        background: exception ? 'rgba(239,68,68,.1)' : `${accent}1a`, border: `1px solid ${exception ? 'rgba(239,68,68,.35)' : accent + '40'}` }}>
        <span style={{ fontSize: 20 }}>{courante.emoji}</span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.texte }}>{courante.label}</p>
          {actif === 'annulee' && commande.raison_annulation && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.doux, wordBreak: 'break-word' }}>Raison : {commande.raison_annulation}{commande.annule_par ? ` · Par : ${commande.annule_par}` : ''}</p>
          )}
        </div>
      </div>

      {auto && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: VERT, fontWeight: 600 }}>🔄 Suivi automatique — le statut se met à jour tout seul selon le transporteur.</p>
      )}

      {afficherInfosSuivi && (commande.numero_suivi || commande.transporteur || lien) && (
        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: C.fond, border: `1px solid ${C.bord}`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
          <div><p style={{ margin: 0, fontSize: 10, color: C.doux, textTransform: 'uppercase' }}>Transporteur</p><p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: C.texte }}>{commande.transporteur || 'N/A'}</p></div>
          <div><p style={{ margin: 0, fontSize: 10, color: C.doux, textTransform: 'uppercase' }}>N° de suivi</p><p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: accent, wordBreak: 'break-all' }}>{commande.numero_suivi || 'N/A'}</p></div>
          <div><p style={{ margin: 0, fontSize: 10, color: C.doux, textTransform: 'uppercase' }}>Lien de suivi</p>
            {lien ? <a href={lien} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 3, fontSize: 12, fontWeight: 700, color: accent }}>🔗 Ouvrir →</a>
                  : <p style={{ margin: '3px 0 0', fontSize: 13, color: C.texte }}>N/A</p>}
          </div>
        </div>
      )}

      {auto && (
        <div style={{ marginTop: 12, border: `1px solid ${C.bord}`, borderRadius: 10, overflow: 'hidden' }}>
          <button type="button" onClick={() => setOuvert(!ouvert)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.fond, border: 'none', padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.texte }}>📍 Historique de suivi détaillé (date, lieu, statut)</span>
            <span style={{ fontSize: 11, color: C.doux, transform: ouvert ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
          </button>
          {ouvert && (
            <div style={{ padding: '12px 14px' }}>
              {historique.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: C.doux, fontStyle: 'italic' }}>Aucun événement de suivi reçu pour l'instant. Le transporteur envoie des mises à jour au fil du transit.</p>
              ) : historique.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, marginBottom: i < historique.length - 1 ? 10 : 0, borderBottom: i < historique.length - 1 ? `1px solid ${C.ligne}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.texte, wordBreak: 'break-word' }}>{ev.statut || 'Événement de suivi'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.doux, wordBreak: 'break-word' }}>{dateLongue(ev.date)}{ev.description ? ` — ${ev.description}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}