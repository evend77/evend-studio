// src/pages/vendeur/MesOffres.tsx
// Page vendeur — Gérer les offres Make Offer reçues sur ses annonces
// Inclut : affichage code promo + statut code (actif / expiré / utilisé)

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';


// ✅ Helper token — niveau module
const getToken = () => localStorage.getItem('token');

const THEME = {
  accent:      '#2563eb',
  accentLight: '#eff6ff',
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e5e7eb',
  text:        '#1a2332',
  textLight:   '#6b7280',
  danger:      '#dc2626',
  success:     '#16a34a',
  warning:     '#d97706',
};

interface Offre {
  id:                   number;
  annonce_id:           string;
  acheteur_email:       string;
  acheteur_nom:         string | null;
  montant:              string;
  montant_rabais:       string | null;
  statut:               'en_attente' | 'accepte' | 'refuse' | 'expire';
  message:              string | null;
  expires_at:           string | null;
  accepted_at:          string | null;
  refused_at:           string | null;
  created_at:           string;
  produit_titre:        string | null;
  code_promo:           string | null;
  code_promo_expire_at: string | null;
  code_promo_utilise:   boolean | null;
  // Image produit + variante
  produit_image_url:    string | null;
  produit_url:          string | null;
  variante_info:        { variante_id?: string; titre?: string; image_url?: string } | null;
}

type Filtre     = 'tous' | 'en_attente' | 'accepte' | 'refuse' | 'expire';
type StatutCode = 'actif' | 'expire' | 'utilise' | 'aucun';

function getStatutCode(offre: Offre): StatutCode {
  if (!offre.code_promo) return 'aucun';
  if (offre.code_promo_utilise) return 'utilise';
  if (offre.code_promo_expire_at && new Date(offre.code_promo_expire_at) < new Date()) return 'expire';
  return 'actif';
}

function BadgeStatut({ statut }: { statut: string }) {
  const configs: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    en_attente: { label: 'En attente', bg: '#fef9c3', color: '#92400e', icon: '⏳' },
    accepte:    { label: 'Acceptée',   bg: '#dcfce7', color: '#15803d', icon: '✅' },
    refuse:     { label: 'Refusée',    bg: '#fee2e2', color: '#b91c1c', icon: '❌' },
    expire:     { label: 'Expirée',    bg: '#f3f4f6', color: '#6b7280', icon: '⏰' },
  };
  const c = configs[statut] || configs.expire;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', backgroundColor: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
}

function BadgeCode({ statut }: { statut: StatutCode }) {
  if (statut === 'aucun') return null;
  const configs: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    actif:   { label: 'Code actif',   bg: '#dcfce7', color: '#15803d', icon: '🟢' },
    expire:  { label: 'Code expiré',  bg: '#f3f4f6', color: '#6b7280', icon: '⏰' },
    utilise: { label: 'Code utilisé', bg: '#eff6ff', color: '#1d4ed8', icon: '✔️' },
  };
  const c = configs[statut];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', backgroundColor: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
}

function BlocCodePromo({ offre }: { offre: Offre }) {
  const [copie, setCopie] = useState(false);
  const statutCode = getStatutCode(offre);
  if (!offre.code_promo) return null;

  const expireDate = offre.code_promo_expire_at
    ? new Date(offre.code_promo_expire_at).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const copierCode = () => {
    navigator.clipboard.writeText(offre.code_promo!).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  };

  const bgColor   = statutCode === 'actif' ? '#f0fdf4' : statutCode === 'utilise' ? '#eff6ff' : '#f9fafb';
  const bdColor   = statutCode === 'actif' ? '#86efac' : statutCode === 'utilise' ? '#bfdbfe' : '#e5e7eb';
  const codeColor = statutCode === 'actif' ? '#15803d' : statutCode === 'utilise' ? '#1d4ed8' : '#9ca3af';

  return (
    <div style={{ backgroundColor: bgColor, border: `1px solid ${bdColor}`, borderRadius: '10px', padding: '14px 16px', marginTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🎟️ Code promo généré
        </p>
        <BadgeCode statut={statutCode} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, backgroundColor: 'white', border: `2px dashed ${codeColor}`, borderRadius: '8px', padding: '10px 16px', textAlign: 'center', opacity: statutCode === 'expire' ? 0.6 : 1 }}>
          <span style={{ fontSize: '22px', fontWeight: '900', color: codeColor, letterSpacing: '3px', fontFamily: 'monospace', textDecoration: statutCode === 'expire' ? 'line-through' : 'none' }}>
            {offre.code_promo}
          </span>
        </div>
        {statutCode === 'actif' && (
          <button
            onClick={copierCode}
            style={{ padding: '10px 14px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: copie ? '#f0fdf4' : 'white', color: copie ? THEME.success : THEME.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
          >
            {copie ? '✅ Copié !' : '📋 Copier'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {offre.montant_rabais && (
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            💸 Rabais : <strong style={{ color: THEME.text }}>{parseFloat(offre.montant_rabais).toFixed(2)} $</strong>
          </p>
        )}
        {expireDate && (
          <p style={{ fontSize: '12px', color: statutCode === 'expire' ? THEME.danger : THEME.textLight, margin: 0 }}>
            {statutCode === 'expire' ? '⏰ Expiré le' : '⏳ Expire le'} : <strong>{expireDate}</strong>
          </p>
        )}
      </div>

      {statutCode === 'actif' && (
        <p style={{ fontSize: '11px', color: '#15803d', margin: '4px 0 0', fontStyle: 'italic' }}>
          L'acheteur peut entrer ce code au checkout Shopify pour obtenir son rabais de {offre.montant_rabais ? parseFloat(offre.montant_rabais).toFixed(2) + ' $' : ''}.
        </p>
      )}
      {statutCode === 'expire' && (
        <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0', fontStyle: 'italic' }}>
          Ce code a expiré — l'acheteur ne peut plus l'utiliser. Vous pouvez lui envoyer un message pour renouveler l'offre.
        </p>
      )}
      {statutCode === 'utilise' && (
        <p style={{ fontSize: '11px', color: '#1d4ed8', margin: '4px 0 0', fontWeight: '600' }}>
          ✔️ Code utilisé par l'acheteur — achat complété avec succès.
        </p>
      )}
    </div>
  );
}

function CarteOffre({ offre, onAccepter, onRefuser, loading }: {
  offre: Offre; onAccepter: (id: number) => void; onRefuser: (id: number) => void; loading: boolean;
}) {
  const montant      = parseFloat(offre.montant).toFixed(2);
  const dateCreation = new Date(offre.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const expiration   = offre.expires_at ? new Date(offre.expires_at) : null;
  const estExpireBientot = expiration && expiration.getTime() - Date.now() < 6 * 60 * 60 * 1000 && offre.statut === 'en_attente';

  return (
    <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${offre.statut === 'en_attente' ? '#bfdbfe' : THEME.border}`, padding: '20px 24px', boxShadow: offre.statut === 'en_attente' ? '0 0 0 2px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>

        {/* ── Photo produit / variante ── */}
        {(() => {
          const imgUrl = offre.variante_info?.image_url || offre.produit_image_url;
          return imgUrl ? (
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <img
                src={imgUrl}
                alt={offre.produit_titre || 'Produit'}
                style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: `1px solid ${THEME.border}`, display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {offre.variante_info?.titre && (
                <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.72)', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {offre.variante_info.titre}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flexShrink: 0, width: '72px', height: '72px', borderRadius: '10px', border: `1px solid ${THEME.border}`, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              📦
            </div>
          );
        })()}

        {/* ── Infos acheteur + produit ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: THEME.text }}>{offre.acheteur_nom || offre.acheteur_email}</span>
            {offre.acheteur_nom && <span style={{ fontSize: '12px', color: THEME.textLight }}>{offre.acheteur_email}</span>}
            <BadgeStatut statut={offre.statut} />
          </div>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 2px' }}>
            {offre.produit_titre || `Produit #${offre.annonce_id}`}
            {offre.variante_info?.titre && (
              <span style={{ marginLeft: '6px', backgroundColor: '#f0f2f5', color: THEME.textLight, fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>
                {offre.variante_info.titre}
              </span>
            )}
          </p>
          <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Reçue le {dateCreation}</p>
        </div>

        {/* ── Montant ── */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: offre.statut === 'accepte' ? THEME.success : THEME.accent, margin: 0, lineHeight: 1 }}>{montant} $</p>
          <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0' }}>Offre proposée</p>
          {offre.montant_rabais && offre.statut === 'accepte' && (
            <p style={{ fontSize: '11px', color: THEME.success, margin: '2px 0 0', fontWeight: '700' }}>🎁 -{parseFloat(offre.montant_rabais).toFixed(2)} $ de rabais</p>
          )}
        </div>
      </div>

      {offre.message && (
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}`, padding: '10px 14px', marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</p>
          <p style={{ fontSize: '13px', color: THEME.text, margin: 0, fontStyle: 'italic' }}>"{offre.message}"</p>
        </div>
      )}

      {estExpireBientot && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>Cette offre expire bientôt — {expiration?.toLocaleString('fr-CA')}</p>
        </div>
      )}

      {offre.expires_at && offre.statut === 'en_attente' && !estExpireBientot && (
        <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 14px' }}>⏱️ Expire le {new Date(offre.expires_at).toLocaleString('fr-CA')}</p>
      )}

      {offre.statut === 'en_attente' && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onAccepter(offre.id)} disabled={loading} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', border: 'none', borderRadius: '8px', backgroundColor: THEME.success, color: 'white', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            ✅ Accepter l'offre
          </button>
          <button onClick={() => onRefuser(offre.id)} disabled={loading} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.danger, fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            ❌ Refuser
          </button>
        </div>
      )}

      {offre.statut === 'accepte' && offre.accepted_at && (
        <p style={{ fontSize: '12px', color: THEME.success, fontWeight: '600', margin: 0 }}>
          ✅ Acceptée le {new Date(offre.accepted_at).toLocaleString('fr-CA')} — L'acheteur a été notifié par courriel.
        </p>
      )}
      {offre.statut === 'refuse' && offre.refused_at && (
        <p style={{ fontSize: '12px', color: THEME.danger, fontWeight: '600', margin: 0 }}>
          ❌ Refusée le {new Date(offre.refused_at).toLocaleString('fr-CA')} — L'acheteur a été notifié par courriel.
        </p>
      )}
      {offre.statut === 'expire' && (
        <p style={{ fontSize: '12px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>⏰ Cette offre a expiré sans réponse.</p>
      )}

      {offre.statut === 'accepte' && <BlocCodePromo offre={offre} />}
    </div>
  );
}

export default function MesOffres() {
  const [offres, setOffres]               = useState<Offre[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filtre, setFiltre]               = useState<Filtre>('tous');
  const [message, setMessage]             = useState<{ type: 'success' | 'error'; texte: string } | null>(null);
  const [confirmer, setConfirmer]         = useState<{ id: number; action: 'accepter' | 'refuser' } | null>(null);


  const chargerOffres = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/make-offer/vendeur`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setOffres(data.offres || []);
    } catch {
      setMessage({ type: 'error', texte: 'Erreur lors du chargement des offres.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerOffres(); }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const executerAction = async (id: number, action: 'accepter' | 'refuser') => {
    setConfirmer(null);
    setActionLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/make-offer/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', texte: data.message });
        setOffres(prev => prev.map(o =>
          o.id === id ? {
            ...o,
            statut:      action === 'accepter' ? 'accepte'  : 'refuse',
            accepted_at: action === 'accepter' ? new Date().toISOString() : o.accepted_at,
            refused_at:  action === 'refuser'  ? new Date().toISOString() : o.refused_at,
            code_promo:  action === 'accepter' ? (data.code_promo || o.code_promo) : o.code_promo,
          } : o
        ));
        if (action === 'accepter') setTimeout(() => chargerOffres(), 1500);
      } else {
        setMessage({ type: 'error', texte: data.message || 'Une erreur est survenue.' });
      }
    } catch {
      setMessage({ type: 'error', texte: 'Erreur de connexion.' });
    } finally {
      setActionLoading(false);
    }
  };

  const offresFiltrees = filtre === 'tous' ? offres : offres.filter(o => o.statut === filtre);
  const compter        = (s: Filtre) => s === 'tous' ? offres.length : offres.filter(o => o.statut === s).length;
  const nbEnAttente    = compter('en_attente');
  const codesActifs    = offres.filter(o => getStatutCode(o) === 'actif').length;
  const codesExpires   = offres.filter(o => getStatutCode(o) === 'expire').length;
  const codesUtilises  = offres.filter(o => getStatutCode(o) === 'utilise').length;

  const filtres: { id: Filtre; label: string; icon: string }[] = [
    { id: 'tous',       label: 'Toutes',     icon: '📋' },
    { id: 'en_attente', label: 'En attente', icon: '⏳' },
    { id: 'accepte',    label: 'Acceptées',  icon: '✅' },
    { id: 'refuse',     label: 'Refusées',   icon: '❌' },
    { id: 'expire',     label: 'Expirées',   icon: '⏰' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💬 Mes offres reçues</h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Gérez les offres de vos acheteurs — acceptez ou refusez en un clic.</p>
        </div>
        <button onClick={chargerOffres} disabled={loading} style={{ padding: '10px 18px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🔄 {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {/* Bandeau offres en attente */}
      {nbEnAttente > 0 && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>💬</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#1e40af', margin: '0 0 2px' }}>{nbEnAttente} offre{nbEnAttente > 1 ? 's' : ''} en attente de votre réponse</p>
            <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0 }}>Les offres sans réponse expirent automatiquement après le délai configuré.</p>
          </div>
        </div>
      )}

      {/* Stats codes promo */}
      {(codesActifs + codesExpires + codesUtilises) > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {codesActifs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 14px' }}>
              <span style={{ fontSize: '14px' }}>🟢</span>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', margin: 0 }}>{codesActifs} code{codesActifs > 1 ? 's' : ''} actif{codesActifs > 1 ? 's' : ''}</p>
            </div>
          )}
          {codesUtilises > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 14px' }}>
              <span style={{ fontSize: '14px' }}>✔️</span>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', margin: 0 }}>{codesUtilises} code{codesUtilises > 1 ? 's' : ''} utilisé{codesUtilises > 1 ? 's' : ''}</p>
            </div>
          )}
          {codesExpires > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px' }}>
              <span style={{ fontSize: '14px' }}>⏰</span>
              <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, margin: 0 }}>{codesExpires} code{codesExpires > 1 ? 's' : ''} expiré{codesExpires > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* Message succès/erreur */}
      {message && (
        <div style={{ backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          <p style={{ fontSize: '13px', fontWeight: '600', color: message.type === 'success' ? '#15803d' : '#b91c1c', margin: 0 }}>{message.texte}</p>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filtres.map(f => (
          <button key={f.id} onClick={() => setFiltre(f.id)} style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${filtre === f.id ? THEME.accent : THEME.border}`, backgroundColor: filtre === f.id ? THEME.accentLight : 'white', color: filtre === f.id ? THEME.accent : THEME.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
            {f.icon} {f.label}
            <span style={{ backgroundColor: filtre === f.id ? THEME.accent : '#e5e7eb', color: filtre === f.id ? 'white' : THEME.textLight, borderRadius: '10px', padding: '0 6px', fontSize: '10px', fontWeight: '800' }}>{compter(f.id)}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: THEME.textLight }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <p>Chargement de vos offres...</p>
        </div>
      ) : offresFiltrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: THEME.text, margin: '0 0 6px' }}>
            {filtre === 'tous' ? 'Aucune offre reçue' : `Aucune offre "${filtres.find(f => f.id === filtre)?.label.toLowerCase()}"`}
          </p>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            {filtre === 'tous' ? 'Activez Make Offer sur vos annonces pour commencer à recevoir des offres.' : 'Essayez un autre filtre.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {offresFiltrees.map(offre => (
            <CarteOffre key={offre.id} offre={offre} loading={actionLoading}
              onAccepter={(id) => setConfirmer({ id, action: 'accepter' })}
              onRefuser={(id)  => setConfirmer({ id, action: 'refuser' })}
            />
          ))}
        </div>
      )}

      {/* Modal confirmation */}
      {confirmer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${THEME.border}`, backgroundColor: confirmer.action === 'accepter' ? '#f0fdf4' : '#fef2f2' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: confirmer.action === 'accepter' ? '#15803d' : '#b91c1c' }}>
                {confirmer.action === 'accepter' ? '✅ Confirmer l\'acceptation' : '❌ Confirmer le refus'}
              </h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {confirmer.action === 'accepter' ? (
                <>
                  <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 12px' }}>
                    L'acheteur recevra un courriel avec un <strong>code promo unique</strong> pour obtenir son rabais au checkout Shopify.
                  </p>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#15803d', margin: 0 }}>
                      🎟️ Un code promo sera créé automatiquement sur Shopify, valide pour une seule utilisation.
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 20px' }}>
                  L'acheteur recevra un courriel l'informant que son offre a été refusée. Il pourra faire une nouvelle offre ou acheter au prix affiché.
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmer(null)} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={() => executerAction(confirmer.id, confirmer.action)} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: confirmer.action === 'accepter' ? THEME.success : THEME.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {confirmer.action === 'accepter' ? '✅ Oui, accepter + envoyer code' : '❌ Oui, refuser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}