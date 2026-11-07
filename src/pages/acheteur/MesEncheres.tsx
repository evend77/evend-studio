// CHEMIN : src/pages/acheteur/MesEncheres.tsx
// e-Vend Studio — Dashboard acheteur : mes enchères (en tête, surpassé, à payer, perdues…)
// Session : cookie httpOnly (credentials: 'include').
// API : GET /api/marketplace/:gid/encheres/mes-encheres · POST /api/marketplace/:gid/encheres/:id/remettre-panier

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

const API = '/api';

type Etat = 'en_tete' | 'surpasse' | 'a_payer' | 'payee' | 'expiree' | 'perdue' | string;

interface Enchere {
  id: number;
  produit_id: number;
  titre: string;
  image_url: string | null;
  statut: string;
  etat: Etat;
  ma_mise: number;
  mise_actuelle: number | null;
  prix_final: number | null;
  date_fin: string;
  paiement_expire_le: string | null;
  dans_panier: boolean;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  naviguer?: (page: string) => void;
  /** ouvre la fiche produit du site (pour miser à nouveau) */
  onVoirProduit?: (produitId: number) => void;
}

const C = {
  green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6',
  border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)',
};

const argent = (v: number | null) => (v === null || v === undefined ? '—' : `${formaterPrix(Number(v))}`);

function duree(ms: number): string {
  if (ms <= 0) return 'Terminé';
  const t = Math.floor(ms / 1000);
  const j = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  if (j > 0) return `${j} j ${h} h`;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  return `${m} min ${String(s).padStart(2, '0')} s`;
}

const ETATS: Record<string, { texte: string; couleur: string }> = {
  en_tete:  { texte: '🏆 Vous êtes en tête', couleur: C.green },
  surpasse: { texte: '⚠️ Vous êtes surpassé', couleur: C.amber },
  a_payer:  { texte: '🎉 Gagné — à payer', couleur: C.green },
  payee:    { texte: '✅ Payée', couleur: C.blue },
  expiree:  { texte: '⌛ Délai de paiement dépassé', couleur: C.red },
  perdue:   { texte: 'Perdue', couleur: '#9ca3af' },
  annulee:  { texte: 'Annulée', couleur: '#9ca3af' },
  sans_gagnant: { texte: 'Terminée', couleur: '#9ca3af' },
};

export default function MesEncheres({ gestionnaireId, isMobile, couleurAccent = '#fbbf24', naviguer, onVoirProduit }: Props) {
  const base = `${API}/marketplace/${gestionnaireId}/encheres`;
  const [liste, setListe] = useState<Enchere[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<number | null>(null);
  const [onglet, setOnglet] = useState<'actives' | 'gagnees' | 'terminees'>('actives');
  const [maintenant, setMaintenant] = useState(Date.now());

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${base}/mes-encheres`, { credentials: 'include' });
      if (r.ok) { setListe((await r.json()).encheres || []); setErreur(''); }
      else setErreur((await r.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base]);

  useEffect(() => { charger(); const t = setInterval(charger, 15000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);

  const payer = async (e: Enchere) => {
    setOccupe(e.id); setErreur('');
    try {
      if (!e.dans_panier) {
        const r = await fetch(`${base}/${e.id}/remettre-panier`, { method: 'POST', credentials: 'include' });
        if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Impossible de remettre l\'article au panier.'); setOccupe(null); return; }
      }
      naviguer?.('panier');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(null);
  };

  const actives = liste.filter(e => e.statut === 'active');
  const gagnees = liste.filter(e => e.etat === 'a_payer' || e.etat === 'payee');
  const terminees = liste.filter(e => e.statut !== 'active' && e.etat !== 'a_payer' && e.etat !== 'payee');
  const aPayer = liste.filter(e => e.etat === 'a_payer').length;
  const vue = onglet === 'actives' ? actives : onglet === 'gagnees' ? gagnees : terminees;

  const tab = (id: typeof onglet, label: string, n: number) => (
    <button key={id} onClick={() => setOnglet(id)} style={{
      padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      border: `1px solid ${onglet === id ? couleurAccent : C.border}`, background: onglet === id ? `${couleurAccent}22` : 'transparent',
      color: onglet === id ? couleurAccent : 'rgba(255,255,255,0.7)',
    }}>{label} ({n})</button>
  );

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>🔨 Mes enchères</h2>
      <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 16px' }}>Suivez vos mises. Vous serez notifié si quelqu'un vous surpasse ou si vous gagnez.</p>

      {aPayer > 0 && (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, color: '#6ee7b7', fontSize: 14, fontWeight: 700 }}>
          🎉 Vous avez {aPayer} enchère{aPayer > 1 ? 's' : ''} gagnée{aPayer > 1 ? 's' : ''} à payer. Le délai est limité !
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tab('actives', 'En cours', actives.length)}
        {tab('gagnees', 'Gagnées', gagnees.length)}
        {tab('terminees', 'Terminées', terminees.length)}
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {vue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🔨</div>
          <p style={{ color: C.textLight, margin: 0 }}>Rien ici pour le moment.</p>
          <button onClick={() => naviguer?.('boutique')} style={{ marginTop: 14, padding: '9px 18px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, cursor: 'pointer' }}>
            Voir les enchères
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vue.map(e => {
            const et = ETATS[e.etat] || { texte: e.etat, couleur: '#9ca3af' };
            const finMs = new Date(e.date_fin).getTime() - maintenant;
            const payerMs = e.paiement_expire_le ? new Date(e.paiement_expire_le).getTime() - maintenant : 0;
            return (
              <div key={e.id} style={{ display: 'flex', gap: 14, background: C.cardBg, border: `1px solid ${et.couleur}44`, borderRadius: 14, padding: 14, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ width: isMobile ? '100%' : 96, height: isMobile ? 160 : 96, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e.image_url ? <img src={e.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30, opacity: 0.3 }}>🔨</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{e.titre}</div>
                  <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, color: et.couleur, background: `${et.couleur}22`, marginBottom: 8 }}>{et.texte}</span>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    <span>Ma mise : <strong style={{ color: '#fff' }}>{argent(e.ma_mise)}</strong></span>
                    {e.statut === 'active' && <span>Mise actuelle : <strong style={{ color: '#fff' }}>{argent(e.mise_actuelle)}</strong></span>}
                    {e.prix_final !== null && <span>Prix final : <strong style={{ color: '#fff' }}>{argent(e.prix_final)}</strong></span>}
                    {e.statut === 'active' && <span style={{ color: finMs < 120000 ? '#f87171' : undefined }}>⏱ {duree(finMs)}</span>}
                    {e.etat === 'a_payer' && e.paiement_expire_le && <span style={{ color: payerMs < 3600000 ? '#f87171' : '#fbbf24' }}>⏳ Payer dans {duree(payerMs)}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {e.etat === 'a_payer' && payerMs > 0 && (
                      <button disabled={occupe === e.id} onClick={() => payer(e)}
                        style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: occupe === e.id ? 0.6 : 1 }}>
                        {e.dans_panier ? '🛒 Aller au panier pour payer' : '🛒 Payer maintenant'}
                      </button>
                    )}
                    {(e.etat === 'surpasse' || e.etat === 'en_tete') && (
                      <button onClick={() => onVoirProduit?.(e.produit_id)}
                        style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${couleurAccent}`, background: 'transparent', color: couleurAccent, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                        {e.etat === 'surpasse' ? '🔨 Miser à nouveau' : 'Voir l\'enchère'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}