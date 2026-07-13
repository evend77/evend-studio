// src/pages/gestionnaire/BrandingEtOptions.tsx
// e-Vend Studio — Branding & Options — marketplace d'add-ons payants
// Le formulaire de contact N'EST PLUS ici — il est gratuit et inclus par défaut,
// configuré dans sa propre page (Configuration → Formulaire de contact).
// Cette page reste pour les add-ons vraiment payants, cross-cutting.
// Architecture pilotée par données : ajouter un futur add-on = une ligne dans ADDONS.

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface Props { gestionnaireId: number; onOptionsUpdated?: () => void; }

// ─────────────────────────────────────────────────────────────────────────
// CATALOGUE D'ADD-ONS — ajouter un add-on = une ligne ici
// ─────────────────────────────────────────────────────────────────────────

interface AddonDef {
  id: string;              // doit correspondre au champ backend (snake_case)
  categorie: string;
  nom: string;
  icone: string;
  couleur: string;
  prix: number;
  description: string;
  necessiteConfirmation: boolean;
  badge?: string;
  detailsActifTexte?: string;
}

const ADDONS: AddonDef[] = [
  {
    id: 'cacher_propulse', categorie: 'Branding', nom: 'Cacher le branding',
    icone: '🏷️', couleur: '#2563eb', prix: 2,
    description: 'Retirez le badge "Propulsé par e-Vend Studio" du footer de votre boutique.',
    necessiteConfirmation: false,
  },
  {
    id: 'verificateur_age', categorie: 'Sécurité & Conformité', nom: "Vérificateur d'âge",
    icone: '🔞', couleur: '#ef4444', prix: 5,
    description: "Popup de vérification d'âge — 3 modes, écran de blocage si refus, entièrement personnalisable.",
    necessiteConfirmation: true, detailsActifTexte: 'Configurez les détails dans Configuration → Vérificateur d\'âge',
  },
  {
    id: 'popup_annonce', categorie: 'Marketing & Promotions', nom: 'Popup Annonce',
    icone: '📢', couleur: '#e63946', prix: 3,
    description: 'Popup ou bannière configurable — promo, événement, fermeture. 3 formats, dates de début/fin.',
    necessiteConfirmation: true, detailsActifTexte: 'Configurez dans Configuration → Popup Annonce',
  },
  {
    id: 'reservation_ecole', categorie: 'Réservations', nom: 'Réservation — École/Cours',
    icone: '📅', couleur: '#6366f1', prix: 5,
    description: 'Créneaux de cours avec capacité, suivi des places en direct — Salle, Professeur, Niveau.',
    necessiteConfirmation: true, detailsActifTexte: 'Configurez dans Mes Réservations Écoles → Créer des créneaux',
  },
  {
    id: 'abonnement_ecole', categorie: 'Abonnements', nom: 'Abonnement — École/Cours',
    icone: '💳', couleur: '#a855f7', prix: 5,
    description: 'Forfaits récurrents (hebdomadaire, mensuel, annuel) — vos clients s\'abonnent directement sur votre site.',
    necessiteConfirmation: true, detailsActifTexte: 'Configurez dans Abonnements clients → Mes forfaits',
  },
];

const CATEGORIES_ORDRE = ['Branding', 'Marketing & Promotions', 'Sécurité & Conformité', 'Réservations', 'Abonnements'];

// ─────────────────────────────────────────────────────────────────────────
// CARTE D'ADD-ON — générique, sert pour tous les add-ons du catalogue
// ─────────────────────────────────────────────────────────────────────────

function AddonCard({ addon, actif, onToggle }: { addon: AddonDef; actif: boolean; onToggle: () => void }) {
  return (
    <div style={{ border: `2px solid ${actif ? addon.couleur : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s', background: '#fff' }}>
      <div style={{ padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${addon.couleur}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{addon.icone}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{addon.nom}</h3>
            {actif && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>Actif</span>}
            {!actif && addon.badge && <span style={{ fontSize: 10, background: `${addon.couleur}15`, color: addon.couleur, padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>{addon.badge}</span>}
          </div>
          <p style={{ fontSize: 11, color: addon.couleur, fontWeight: 700, margin: '0 0 5px' }}>+{addon.prix.toFixed(2)} $/mois + tx</p>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, margin: 0 }}>{addon.description}</p>
        </div>
        <div onClick={onToggle}
          style={{ width: 40, height: 22, borderRadius: 11, background: actif ? addon.couleur : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginTop: 2 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: actif ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
      {actif && addon.detailsActifTexte && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{addon.detailsActifTexte}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL DE CONFIRMATION — générique
// ─────────────────────────────────────────────────────────────────────────

function ModalConfirmationAddon({ addon, onAnnuler, onConfirmer }: { addon: AddonDef; onAnnuler: () => void; onConfirmer: () => void }) {
  return (
    <div onClick={onAnnuler}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: 'inherit' }}>
        <div style={{ background: `linear-gradient(135deg, ${addon.couleur}, ${addon.couleur}cc)`, padding: '26px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{addon.icone}</div>
          <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Activer {addon.nom}</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Add-On — facturation mensuelle</p>
        </div>
        <div style={{ padding: '22px 28px' }}>
          <div style={{ background: `${addon.couleur}10`, border: `1px solid ${addon.couleur}30`, borderRadius: 12, padding: '13px 16px', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1a1a1a', lineHeight: 1.6 }}>
              Des frais de <strong style={{ color: addon.couleur }}>{addon.prix.toFixed(2)} $/mois + taxes</strong> seront ajoutés à votre abonnement, effectifs dès le prochain renouvellement.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAnnuler} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Annuler</button>
            <button onClick={onConfirmer}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 10, background: addon.couleur, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✅ Activer — {addon.prix.toFixed(2)} $/mois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────

export default function BrandingEtOptions({ gestionnaireId, onOptionsUpdated }: Props) {
  const [actifs, setActifs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle' | 'ok' | 'err'>('idle');
  const [confirmationEnCours, setConfirmationEnCours] = useState<AddonDef | null>(null);
  const [planActuel, setPlanActuel] = useState('simplisse-25');

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }).then(r => r.ok ? r.json() : {} as any),
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }).then(r => r.ok ? r.json() : {} as any),
    ]).then(([opts, gest]: [any, any]) => {
      const map: Record<string, boolean> = {};
      for (const a of ADDONS) map[a.id] = !!opts[a.id];
      setActifs(map);
      setPlanActuel(gest?.plan || 'simplisse-25');
    }).catch(() => {});
  }, [gestionnaireId]);

  const sauvegarderOptions = async (patch?: Record<string, boolean>) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const nouveauxActifs = { ...actifs, ...(patch || {}) };
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(nouveauxActifs),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
      onOptionsUpdated?.();
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  const toggleAddon = (addon: AddonDef) => {
    const estActif = !!actifs[addon.id];
    if (!estActif && addon.necessiteConfirmation) {
      setConfirmationEnCours(addon);
      return;
    }
    const nouveauxActifs = { ...actifs, [addon.id]: !estActif };
    setActifs(nouveauxActifs);
    if (estActif) sauvegarderOptions({ [addon.id]: false });
    // Activation sans confirmation (cacher_propulse) : attend le bouton Sauvegarder global
  };

  const confirmerActivation = async () => {
    if (!confirmationEnCours) return;
    const id = confirmationEnCours.id;
    setConfirmationEnCours(null);
    setActifs(prev => ({ ...prev, [id]: true }));
    await sauvegarderOptions({ [id]: true });
  };

  const addonsActifs = ADDONS.filter(a => actifs[a.id]);
  const totalMensuel = addonsActifs.reduce((sum, a) => sum + a.prix, 0);
  const categories = CATEGORIES_ORDRE.map(cat => ({ nom: cat, addons: ADDONS.filter(a => a.categorie === cat) })).filter(c => c.addons.length > 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .boe-layout { display: flex; gap: 24px; align-items: flex-start; }
        .boe-sidebar { width: 260px; flex-shrink: 0; position: sticky; top: 20px; }
        @media (max-width: 760px) {
          .boe-layout { flex-direction: column; }
          .boe-sidebar { width: 100%; position: static; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚙️</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Branding & Options</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Personnalisez votre boutique et activez des fonctionnalités premium</p>
        </div>
      </div>

      <div className="boe-layout">
        <div style={{ flex: 1, minWidth: 0 }}>

          {addonsActifs.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                ✅ {addonsActifs.length} add-on{addonsActifs.length > 1 ? 's' : ''} actif{addonsActifs.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {addonsActifs.map(a => (
                  <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${a.couleur}40`, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                    <span>{a.icone}</span>{a.nom}
                    <span style={{ color: a.couleur, fontWeight: 800 }}>{a.prix.toFixed(2)}$</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {categories.map(cat => (
            <div key={cat.nom} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{cat.nom}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {cat.addons.map(addon => (
                  <AddonCard key={addon.id} addon={addon} actif={!!actifs[addon.id]} onToggle={() => toggleAddon(addon)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="boe-sidebar">
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', margin: '0 0 14px' }}>💰 Facturation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                <span>Plan actif</span>
                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{planActuel}</span>
              </div>
              {addonsActifs.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                  <span>{a.nom}</span><span style={{ fontWeight: 600, color: a.couleur }}>+{a.prix.toFixed(2)}$</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>Total options</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: totalMensuel > 0 ? '#dc2626' : '#888' }}>
                {totalMensuel > 0 ? `+${totalMensuel.toFixed(2).replace('.', ',')} $/mois` : 'Aucune'}
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#aaa', margin: '8px 0 14px' }}>+ taxes · ajusté au prochain renouvellement</p>

            <button onClick={() => sauvegarderOptions()} disabled={saving}
              style={{ width: '100%', padding: 11, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳...' : '💾 Sauvegarder'}
            </button>
            {statut === 'ok' && <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, textAlign: 'center', margin: '8px 0 0' }}>✅ Mis à jour!</p>}
            {statut === 'err' && <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textAlign: 'center', margin: '8px 0 0' }}>❌ Erreur</p>}
          </div>
        </div>
      </div>

      {confirmationEnCours && (
        <ModalConfirmationAddon
          addon={confirmationEnCours}
          onAnnuler={() => setConfirmationEnCours(null)}
          onConfirmer={confirmerActivation}
        />
      )}
    </div>
  );
}