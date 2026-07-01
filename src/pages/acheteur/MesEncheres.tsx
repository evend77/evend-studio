/**
 * MesEncheres.tsx
 * src/pages/acheteur/MesEncheres.tsx
 * Données réelles API — style identique à l'original
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type OngletEnchere = 'en_cours' | 'remportees' | 'perdues';

interface MiseAPI {
  id: number;
  enchere_id: number;
  acheteur_id: string;
  acheteur_nom: string;
  acheteur_email: string;
  montant: number;
  created_at: string;
}

interface EnchereAPI {
  id: number;
  produit_id: string;
  titre?: string;
  prix_base: number;
  mise_courante: number | null;
  prix_reserve: number | null;
  increment_min: number;
  date_debut: string;
  date_fin: string;
  statut: string;
  nb_mises?: number;
  plus_haut_encherisseur?: string;
  gagnant_id?: string;
  gagnant_nom?: string;
  montant_gagnant?: number;
  produit_image_url?: string;
}

interface EnchereEnrichie extends EnchereAPI {
  mes_mises: MiseAPI[];
  ma_derniere_mise: number | null;
  statut_acheteur: 'en_cours' | 'remportee' | 'perdue';
  produit_nom: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

// Couleurs identiques à l'original
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  yellow: '#f59e0b',
  yellowLight: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function fmt(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return '—';
  return parseFloat(String(montant)).toFixed(2) + ' $';
}

function getMiseMin(enc: EnchereAPI): number {
  const base = parseFloat(String(enc.mise_courante || enc.prix_base || 0));
  const incr = parseFloat(String(enc.increment_min || 1));
  return base > 0 ? base + incr : parseFloat(String(enc.prix_base || 0));
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('fr-CA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function useTimer(dateFin: string) {
  const calc = useCallback(() => {
    const diff = Math.max(0, new Date(dateFin).getTime() - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return { d: pad(d), h: pad(h), m: pad(m), s: pad(s), fini: diff <= 0 };
  }, [dateFin]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const iv = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(iv);
  }, [calc]);
  return t;
}

// ─── Timer visuel ─────────────────────────────────────────────────────────────

const TimerDisplay = ({ dateFin }: { dateFin: string }) => {
  const t = useTimer(dateFin);
  if (t.fini) return <span style={{ fontSize: '13px', color: C.red, fontWeight: 700 }}>⏰ Terminée</span>;
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
      {[{ n: t.d, u: 'j' }, { n: t.h, u: 'h' }, { n: t.m, u: 'm' }, { n: t.s, u: 's' }].map(({ n, u }) => (
        <div key={u} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: '28px' }}>
          <div style={{
            background: '#1e3a5f', color: '#60a5fa', fontWeight: 900,
            fontSize: '15px', borderRadius: '5px', padding: '2px 5px',
            fontFamily: 'monospace', lineHeight: 1.3,
          }}>{n}</div>
          <div style={{ fontSize: '8px', color: C.textLight, textTransform: 'uppercase', marginTop: '2px' }}>{u}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Badge statut — identique à l'original ───────────────────────────────────

const StatutBadge = ({ statut }: { statut: 'en_cours' | 'remportee' | 'perdue' }) => {
  const cfg = {
    en_cours:  { bg: C.blueLight,  color: C.blue,  icon: '⏳', label: 'En cours' },
    remportee: { bg: C.greenLight, color: C.green,  icon: '🏆', label: 'Remportée' },
    perdue:    { bg: C.redLight,   color: C.red,    icon: '❌', label: 'Perdue' },
  }[statut];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 700, padding: '4px 10px',
      borderRadius: '20px', background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Modal Détail ─────────────────────────────────────────────────────────────

const ModalDetail = ({
  enc, onClose, acheteurId, acheteurNom, acheteurEmail, onMiseOk,
}: {
  enc: EnchereEnrichie;
  onClose: () => void;
  acheteurId: string;
  acheteurNom: string;
  acheteurEmail: string;
  onMiseOk: (encId: number, nouvelleMise: number) => void;
}) => {
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; txt: string } | null>(null);
  const miseMin = getMiseMin(enc);
  const t = useTimer(enc.date_fin);
  const reserveAtteinte = enc.prix_reserve ? (enc.mise_courante ?? 0) >= enc.prix_reserve : true;

  const soumettre = async () => {
    const val = parseFloat(montant);
    if (!val || val < miseMin) { setMsg({ type: 'err', txt: `Mise minimum : ${fmt(miseMin)}` }); return; }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/encheres/${enc.id}/mises`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acheteur_id: acheteurId, acheteur_email: acheteurEmail, acheteur_nom: acheteurNom, montant: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise');
      setMsg({ type: 'ok', txt: `✅ Mise de ${fmt(data.mise?.montant ?? val)} enregistrée !` });
      setMontant('');
      onMiseOk(enc.id, data.mise_courante ?? val);
    } catch (e: any) {
      setMsg({ type: 'err', txt: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: `1px solid ${C.purple}40`,
          borderRadius: '24px', width: '100%', maxWidth: '640px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header gradient — style du dashboard vendeur */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          borderRadius: '24px 24px 0 0', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              🔨 Suivi de l'enchère
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {enc.produit_nom}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', color: '#fff', fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Stats 4 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: 'MISE COURANTE', val: fmt(enc.mise_courante ?? enc.prix_base), color: C.blue },
            { label: 'PRIX RÉSERVE',  val: enc.prix_reserve ? fmt(enc.prix_reserve) : 'Non défini', color: C.yellow },
            { label: 'NB. DE MISES',  val: String(enc.nb_mises ?? enc.mes_mises.length), color: '#fff' },
            { label: 'ENCHÉRISSEURS', val: String(enc.nb_mises ?? 0), color: '#fff' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ padding: '14px 16px', borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '9px', color: C.textLight, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Corps 2 colonnes */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Détails */}
          <div>
            <div style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
              DÉTAILS DE L'ENCHÈRE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { k: 'ID',               v: String(enc.id) },
                { k: 'Début',            v: formatDate(enc.date_debut) },
                { k: 'Fin',              v: formatDate(enc.date_fin) },
                { k: 'Prix de base',     v: fmt(enc.prix_base) },
                { k: 'Ma dernière mise', v: fmt(enc.ma_derniere_mise) },
                { k: 'Incrément min.',   v: fmt(enc.increment_min) },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '7px' }}>
                  <span style={{ fontSize: '12px', color: C.textLight }}>{k}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '7px' }}>
                <span style={{ fontSize: '12px', color: C.textLight }}>Procuration</span>
                <span style={{ fontSize: '11px', color: C.red }}>✖ Non</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: C.textLight }}>Réserve</span>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: reserveAtteinte ? C.green : C.yellow,
                  background: reserveAtteinte ? C.greenLight : C.yellowLight,
                  padding: '2px 8px', borderRadius: '20px',
                }}>
                  {reserveAtteinte ? '✅ Atteinte' : '⚠️ Non atteinte'}
                </span>
              </div>
            </div>
          </div>

          {/* Timer + mise rapide */}
          <div>
            <div style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
              TIMER EN DIRECT
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <TimerDisplay dateFin={enc.date_fin} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: C.textLight, marginBottom: '16px' }}>Temps restant</div>

            {!reserveAtteinte && (
              <div style={{ background: C.yellowLight, border: `1px solid ${C.yellow}40`, borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: C.yellow, fontWeight: 600, textAlign: 'center' }}>
                ⚠️ Réserve non atteinte
              </div>
            )}

            {enc.statut_acheteur === 'en_cours' && !t.fini && (
              <div style={{ background: C.blueLight, borderRadius: '12px', padding: '14px', border: `1px solid ${C.blue}20` }}>
                <div style={{ fontSize: '11px', color: C.blue, fontWeight: 700, marginBottom: '8px' }}>⚡ PLACER UNE MISE</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number" value={montant} onChange={e => setMontant(e.target.value)}
                    placeholder={`Min. ${fmt(miseMin)}`}
                    onKeyDown={e => e.key === 'Enter' && soumettre()}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${C.blue}40`, background: 'rgba(15,23,42,0.7)', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={soumettre} disabled={loading}
                    style={{ padding: '8px 16px', background: loading ? C.blueLight : C.blue, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? '…' : '→'}
                  </button>
                </div>
                {msg && (
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: msg.type === 'ok' ? C.green : C.red, background: msg.type === 'ok' ? C.greenLight : C.redLight, padding: '6px 10px', borderRadius: '6px' }}>
                    {msg.txt}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Historique mises */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            🔨 HISTORIQUE DE MES MISES ({enc.mes_mises.length})
          </div>
          {enc.mes_mises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: C.textLight, background: C.cardBg, borderRadius: '12px', border: `1px solid ${C.border}` }}>
              Aucune mise pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {enc.mes_mises.map((mise, i) => (
                <div key={mise.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: i === 0 ? C.blueLight : C.cardBg,
                  borderRadius: '10px',
                  border: `1px solid ${i === 0 ? C.blue + '30' : C.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: i === 0 ? C.blue : '#fff' }}>
                      {fmt(mise.montant)}
                      {i === 0 && <span style={{ fontSize: '10px', marginLeft: '8px', color: C.blue }}>⭐ Dernière</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                      {new Date(mise.created_at).toLocaleString('fr-CA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bannière remportée */}
        {enc.statut_acheteur === 'remportee' && (
          <div style={{ margin: '0 24px 24px', padding: '16px', background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.green, marginBottom: '6px' }}>🏆 Enchère remportée — Commande confirmée automatiquement</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Montant gagnant : <strong style={{ color: '#fff' }}>{fmt(enc.montant_gagnant ?? enc.mise_courante)}</strong></div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Le vendeur vous contactera prochainement pour finaliser la livraison.</div>
          </div>
        )}

        {/* Bannière perdue */}
        {enc.statut_acheteur === 'perdue' && (
          <div style={{ margin: '0 24px 24px', padding: '16px', background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.red, marginBottom: '6px' }}>❌ Enchère perdue</div>
            {enc.gagnant_nom && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Remportée par : <strong style={{ color: '#fff' }}>{enc.gagnant_nom.split(' ')[0]} {(enc.gagnant_nom.split(' ')[1] || '')[0]}.</strong></div>}
            {enc.montant_gagnant && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Montant gagnant : <strong style={{ color: '#fff' }}>{fmt(enc.montant_gagnant)}</strong></div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Carte Enchère En Cours ───────────────────────────────────────────────────

const EnchereEnCoursCard = ({
  enc, onVoirDetail, acheteurId, acheteurNom, acheteurEmail, onMiseOk,
}: {
  enc: EnchereEnrichie;
  onVoirDetail: () => void;
  acheteurId: string; acheteurNom: string; acheteurEmail: string;
  onMiseOk: (id: number, mise: number) => void;
}) => {
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; txt: string } | null>(null);
  const miseMin = getMiseMin(enc);
  const t = useTimer(enc.date_fin);
  const jeGagne = enc.ma_derniere_mise !== null
    && (enc.mise_courante ?? 0) > 0
    && enc.ma_derniere_mise >= (enc.mise_courante ?? 0);

  const soumettre = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = parseFloat(montant);
    if (!val || val < miseMin) { setMsg({ type: 'err', txt: `Min : ${fmt(miseMin)}` }); return; }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/encheres/${enc.id}/mises`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acheteur_id: acheteurId, acheteur_email: acheteurEmail, acheteur_nom: acheteurNom, montant: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMsg({ type: 'ok', txt: `✅ ${fmt(data.mise?.montant ?? val)} enregistrée !` });
      setMontant('');
      onMiseOk(enc.id, data.mise_courante ?? val);
    } catch (e: any) {
      setMsg({ type: 'err', txt: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div
      style={{ background: C.cardBg, border: `1px solid ${jeGagne ? C.green + '50' : C.border}`, borderRadius: '20px', padding: '18px', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Image — identique à l'original */}
        <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0, overflow: 'hidden' }}>
          {enc.produit_image_url
            ? <img src={enc.produit_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🔨'}
        </div>

        <div style={{ flex: 1 }}>
          {/* Titre */}
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            {enc.produit_nom}
            {jeGagne && <span style={{ marginLeft: '10px', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: C.greenLight, color: C.green, border: `1px solid ${C.green}30` }}>⭐ En tête</span>}
          </h3>

          {/* Grid 2 colonnes — identique à l'original */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Votre mise actuelle</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.yellow }}>{fmt(enc.ma_derniere_mise)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Mise la plus élevée</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>{fmt(enc.mise_courante ?? enc.prix_base)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Mise minimum suivante</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.blue }}>{fmt(miseMin)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Date de fin</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{formatDate(enc.date_fin)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Nombre d'offres</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{enc.nb_mises ?? enc.mes_mises.length}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Temps restant</p>
              <TimerDisplay dateFin={enc.date_fin} />
            </div>
          </div>

          {/* ─── Zone mise rapide inline (nouveau) ─── */}
          {!t.fini && (
            <div style={{ background: C.blueLight, borderRadius: '10px', padding: '12px', border: `1px solid ${C.blue}20`, marginTop: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: C.blue, fontWeight: 700, marginBottom: '8px' }}>⚡ Placer une mise directement</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number" value={montant}
                  onChange={e => setMontant(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') soumettre(e as any); }}
                  placeholder={`Min. ${fmt(miseMin)}`}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: `1.5px solid ${C.blue}30`, background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
                <button onClick={soumettre} disabled={loading}
                  style={{ padding: '9px 18px', background: loading ? C.blueLight : C.blue, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {loading ? '…' : '🔨 Miser'}
                </button>
              </div>
              {msg && (
                <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: msg.type === 'ok' ? C.green : C.red, background: msg.type === 'ok' ? C.greenLight : C.redLight, padding: '5px 10px', borderRadius: '6px' }}>
                  {msg.txt}
                </div>
              )}
            </div>
          )}

          {/* Bouton voir détails — identique à l'original */}
          <button
            onClick={e => { e.stopPropagation(); onVoirDetail(); }}
            style={{ marginTop: '4px', padding: '8px 16px', background: C.blueLight, border: `1px solid ${C.blue}40`, borderRadius: '8px', color: C.blue, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Voir détails →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Carte Remportée — identique à l'original ────────────────────────────────

const EnchereRemporteeCard = ({ enc, onVoirDetail }: { enc: EnchereEnrichie; onVoirDetail: () => void }) => (
  <div
    style={{ background: C.cardBg, border: `1px solid ${C.green}30`, borderRadius: '20px', padding: '18px', transition: 'all 0.2s ease', cursor: 'pointer' }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = C.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
    onClick={onVoirDetail}
  >
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0, overflow: 'hidden' }}>
        {enc.produit_image_url ? <img src={enc.produit_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏆'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{enc.produit_nom}</h3>
          <StatutBadge statut="remportee" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Montant gagnant</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.green }}>{fmt(enc.montant_gagnant ?? enc.mise_courante)}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Commande</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.green }}>✅ Confirmée</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Nombre d'offres</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{enc.nb_mises ?? enc.mes_mises.length}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Date de fin</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{formatDate(enc.date_fin)}</p>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Note</p>
            <p style={{ margin: 0, fontSize: '11px', color: C.textLight, fontStyle: 'italic' }}>Le vendeur vous contactera prochainement.</p>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onVoirDetail(); }}
          style={{ marginTop: '8px', padding: '8px 16px', background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: '8px', color: C.green, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Voir détails →
        </button>
      </div>
    </div>
  </div>
);

// ─── Carte Perdue — identique à l'original ───────────────────────────────────

const EncherePerdueCard = ({ enc, onVoirDetail }: { enc: EnchereEnrichie; onVoirDetail: () => void }) => (
  <div
    style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px', transition: 'all 0.2s ease', cursor: 'pointer' }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = C.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
    onClick={onVoirDetail}
  >
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0, overflow: 'hidden' }}>
        {enc.produit_image_url ? <img src={enc.produit_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '❌'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{enc.produit_nom}</h3>
          <StatutBadge statut="perdue" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Votre dernière enchère</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.yellow }}>{fmt(enc.ma_derniere_mise)}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Montant gagnant</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.red }}>{fmt(enc.montant_gagnant)}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Date de fin</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{formatDate(enc.date_fin)}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Nombre d'offres</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{enc.nb_mises ?? enc.mes_mises.length}</p>
          </div>
          {enc.gagnant_nom && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textLight }}>Gagnant</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.purple }}>
                {enc.gagnant_nom.split(' ')[0]} {(enc.gagnant_nom.split(' ')[1] || '')[0]}.
              </p>
            </div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onVoirDetail(); }}
          style={{ marginTop: '8px', padding: '8px 16px', background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: '8px', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Voir détails →
        </button>
      </div>
    </div>
  </div>
);

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function MesEncheres({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [onglet, setOnglet] = useState<OngletEnchere>('en_cours');
  const [recherche, setRecherche] = useState('');
  const [encheres, setEncheres] = useState<EnchereEnrichie[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modalEnc, setModalEnc] = useState<EnchereEnrichie | null>(null);

  const customer = (window as any).evendCustomer || {};
  const acheteurId    = String(customer.id    || '');
  const acheteurNom   = customer.nom           || '';
  const acheteurEmail = customer.email         || '';

  const chargerEncheres = useCallback(async () => {
    if (!acheteurId) {
      setErreur('Vous devez être connecté pour voir vos enchères.');
      setLoading(false);
      return;
    }
    setLoading(true); setErreur(null);
    try {
      const resMises = await fetch(`${API_BASE}/encheres/acheteur/${acheteurId}/mises`);
      const misesBrutes: MiseAPI[] = resMises.ok ? await resMises.json() : [];

      const encIds = Array.from(new Set(misesBrutes.map(m => m.enchere_id)));
      if (encIds.length === 0) { setEncheres([]); setLoading(false); return; }

      const encheresBrutes: EnchereAPI[] = (await Promise.all(
        encIds.map(id => fetch(`${API_BASE}/encheres/publique/${id}`).then(r => r.ok ? r.json() : null).catch(() => null))
      )).filter(Boolean);

      const enrichies: EnchereEnrichie[] = encheresBrutes.map(enc => {
        const mesMises = misesBrutes
          .filter(m => m.enchere_id === enc.id)
          .sort((a, b) => b.montant - a.montant);
        const maDerniereMise = mesMises.length > 0 ? mesMises[0].montant : null;

        let statutAcheteur: 'en_cours' | 'remportee' | 'perdue';
        if (enc.statut === 'active' || enc.statut === 'upcoming') {
          statutAcheteur = 'en_cours';
        } else if (enc.gagnant_id && String(enc.gagnant_id) === acheteurId) {
          statutAcheteur = 'remportee';
        } else {
          statutAcheteur = 'perdue';
        }

        return {
          ...enc,
          mes_mises: mesMises,
          ma_derniere_mise: maDerniereMise,
          statut_acheteur: statutAcheteur,
          produit_nom: enc.titre || `Produit #${enc.produit_id}`,
        };
      });

      setEncheres(enrichies);
    } catch {
      setErreur('Impossible de charger vos enchères. Réessayez plus tard.');
    } finally { setLoading(false); }
  }, [acheteurId]);

  useEffect(() => { chargerEncheres(); }, [chargerEncheres]);

  const handleMiseOk = useCallback((encId: number, nouvelleMise: number) => {
    const update = (e: EnchereEnrichie): EnchereEnrichie => {
      if (e.id !== encId) return e;
      const nouvelle: MiseAPI = {
        id: Date.now(), enchere_id: encId, acheteur_id: acheteurId,
        acheteur_nom: acheteurNom, acheteur_email: acheteurEmail,
        montant: nouvelleMise, created_at: new Date().toISOString(),
      };
      return { ...e, mise_courante: nouvelleMise, ma_derniere_mise: nouvelleMise, mes_mises: [nouvelle, ...e.mes_mises] };
    };
    setEncheres(prev => prev.map(update));
    setModalEnc(prev => prev && prev.id === encId ? update(prev) : prev);
  }, [acheteurId, acheteurNom, acheteurEmail]);

  const nbEnCours    = encheres.filter(e => e.statut_acheteur === 'en_cours').length;
  const nbRemportees = encheres.filter(e => e.statut_acheteur === 'remportee').length;
  const nbPerdues    = encheres.filter(e => e.statut_acheteur === 'perdue').length;

  const encheresFiltrees = encheres
    .filter(e => {
      if (onglet === 'en_cours')   return e.statut_acheteur === 'en_cours';
      if (onglet === 'remportees') return e.statut_acheteur === 'remportee';
      if (onglet === 'perdues')    return e.statut_acheteur === 'perdue';
      return true;
    })
    .filter(e => e.produit_nom.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>

      {modalEnc && (
        <ModalDetail enc={modalEnc} onClose={() => setModalEnc(null)}
          acheteurId={acheteurId} acheteurNom={acheteurNom} acheteurEmail={acheteurEmail}
          onMiseOk={handleMiseOk}
        />
      )}

      {/* En-tête — identique à l'original */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', borderRadius: '24px', padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <span style={{ fontSize: '40px' }}>🔨</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>Mes enchères</h1>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Suivez toutes vos enchères en cours, remportées et perdues.
          </p>
          <div style={{ display: 'flex', gap: '40px' }}>
            {[{ n: nbEnCours, label: 'En cours' }, { n: nbRemportees, label: 'Remportées' }, { n: nbPerdues, label: 'Perdues' }].map(({ n, label }) => (
              <div key={label}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{loading ? '…' : n}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onglets — identiques à l'original */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
        {([
          { id: 'en_cours',   label: 'Enchères en cours',   icon: '⏳', n: nbEnCours },
          { id: 'remportees', label: 'Enchères remportées', icon: '🏆', n: nbRemportees },
          { id: 'perdues',    label: 'Enchères perdues',    icon: '❌', n: nbPerdues },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: onglet === tab.id ? C.purple : 'rgba(255,255,255,0.05)', color: onglet === tab.id ? '#fff' : C.textLight, fontSize: '14px', fontWeight: onglet === tab.id ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {!loading && tab.n > 0 && (
              <span style={{ background: onglet === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px' }}>{tab.n}</span>
            )}
          </button>
        ))}
      </div>

      {/* Barre de recherche — identique à l'original */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div />
        <input
          type="text" placeholder="🔍 Rechercher une enchère..." value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '30px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', width: '250px' }}
        />
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: C.textLight }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '15px' }}>Chargement de vos enchères…</p>
        </div>
      ) : erreur ? (
        <div style={{ textAlign: 'center', padding: '60px', background: C.redLight, borderRadius: '20px', border: `1px dashed ${C.red}40` }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: C.red, fontWeight: 700, marginBottom: '12px' }}>{erreur}</p>
          <button onClick={chargerEncheres} style={{ padding: '10px 24px', background: C.red, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Réessayer</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {encheresFiltrees.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: `1px dashed ${C.border}` }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔨</div>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucune enchère trouvée</p>
              <p style={{ color: C.textLight, fontSize: '13px' }}>Consultez nos produits pour commencer à enchérir !</p>
            </div>
          ) : encheresFiltrees.map(enc => {
            if (onglet === 'en_cours') return (
              <EnchereEnCoursCard key={enc.id} enc={enc} onVoirDetail={() => setModalEnc(enc)}
                acheteurId={acheteurId} acheteurNom={acheteurNom} acheteurEmail={acheteurEmail}
                onMiseOk={handleMiseOk} />
            );
            if (onglet === 'remportees') return (
              <EnchereRemporteeCard key={enc.id} enc={enc} onVoirDetail={() => setModalEnc(enc)} />
            );
            return <EncherePerdueCard key={enc.id} enc={enc} onVoirDetail={() => setModalEnc(enc)} />;
          })}
        </div>
      )}
    </div>
  );
}