// src/pages/gestionnaire/SimplisseBranding.tsx
// e-Vend Studio — Branding & Options (Simplisse, Premium, Mode, Beauté)
// Toggle "Propulsé par e-Vend Studio" + Add-Ons payants

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface Props { gestionnaireId: number; onOptionsUpdated?: () => void; }

export default function SimplisseBranding({ gestionnaireId, onOptionsUpdated }: Props) {
  const [cacherPropulse,    setCacherPropulse]    = useState(false);
  const [verificateurAge,   setVerificateurAge]   = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [statut,            setStatut]            = useState<'idle'|'ok'|'err'>('idle');
  const [confirmVAge,       setConfirmVAge]       = useState(false);
  const [popupAnnonce,      setPopupAnnonce]      = useState(false);
  const [confirmPopup,      setConfirmPopup]      = useState(false);
  const [planActuel,        setPlanActuel]        = useState('simplisse-25');
  const [prixMensuel,       setPrixMensuel]       = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, {
        headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
      }).then(r => r.ok ? r.json() : {} as any),
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}`, {
        headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
      }).then(r => r.ok ? r.json() : {} as any),
    ]).then(([opts, gest]: [any, any]) => {
      setCacherPropulse(opts.cacher_propulse || false);
      setVerificateurAge(opts.verificateur_age || false);
      setPopupAnnonce(opts.popup_annonce || false);
      setPlanActuel(gest?.plan || 'simplisse-25');
      setPrixMensuel(parseFloat(opts.total_options_mensuel || '0'));
    }).catch(() => {});
  }, [gestionnaireId]);

  const sauvegarder = async (newVerif?: boolean, newPopup?: boolean) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({
          cacher_propulse: cacherPropulse,
          verificateur_age: newVerif !== undefined ? newVerif : verificateurAge,
          popup_annonce: newPopup !== undefined ? newPopup : popupAnnonce,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrixMensuel(parseFloat(data?.options?.total_options_mensuel || '0'));
      setStatut('ok');
      onOptionsUpdated?.(); // notifier le parent pour rafraîchir le menu
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  // Activer le vérificateur d'âge après confirmation
  const confirmerActivationVAge = async () => {
    setConfirmVAge(false);
    setVerificateurAge(true);
    await sauvegarder(true);
  };

  // Désactiver directement (pas de popup)
  const toggleVerificateur = () => {
    if (!verificateurAge) {
      // Activer → demander confirmation
      setConfirmVAge(true);
    } else {
      // Désactiver → direct
      setVerificateurAge(false);
      setTimeout(() => sauvegarder(false), 50);
    }
  };

  const fraisPropulse    = 2.00;
  const fraisVerif       = 5.00;
  const fraisPopup       = 3.00;
  const totalOptions     = (cacherPropulse ? fraisPropulse : 0) + (verificateurAge ? fraisVerif : 0) + (popupAnnonce ? fraisPopup : 0);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚙️</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Branding & Options</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Personnalisez votre boutique et activez des fonctionnalités premium</p>
        </div>
      </div>

      {/* ── Section Branding ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>🏷️ Branding e-Vend Studio</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>Contrôlez l'affichage du badge "Propulsé par e-Vend Studio" sur votre boutique.</p>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Cacher "Propulsé par e-Vend Studio"</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Retirez le badge du footer de votre boutique · <strong>+2,00 $/mois + tx</strong></p>
          </div>
          <div onClick={() => setCacherPropulse(v => !v)}
            style={{ width: 44, height: 24, borderRadius: 12, background: cacherPropulse ? '#2563eb' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: cacherPropulse ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* ── Section Add-Ons ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>🧩 Add-Ons disponibles</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>Fonctionnalités supplémentaires payantes — s'activent immédiatement et sont ajoutées à votre facture mensuelle.</p>

        {/* Add-On : Vérificateur d'âge */}
        <div style={{ border: `2px solid ${verificateurAge ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
          {/* En-tête de la carte */}
          <div style={{ background: verificateurAge ? '#fef2f2' : '#fafafa', padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: verificateurAge ? '#fecaca' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🔞</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Vérificateur d'âge</h3>
                <span style={{ fontSize: 11, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>+5,00 $/mois + tx</span>
                {verificateurAge && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>✅ Actif</span>}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                Affichez une popup de vérification d'âge sur votre boutique. 3 modes : boutons Oui/Non, date de naissance ou année. Écran de blocage total si refus. Entièrement personnalisable.
              </p>
            </div>
            {/* Toggle */}
            <div onClick={toggleVerificateur}
              style={{ width: 44, height: 24, borderRadius: 12, background: verificateurAge ? '#ef4444' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginTop: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: verificateurAge ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          {/* Détails si actif */}
          {verificateurAge && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #fecaca', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Configurez les détails dans <strong>Configuration → Vérificateur d'âge</strong></p>
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>5,00 $/mois</span>
            </div>
          )}
        </div>

        {/* Add-On : Popup Annonce */}
        <div style={{ border: `2px solid ${popupAnnonce ? '#e63946' : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s', marginTop: 12 }}>
          <div style={{ background: popupAnnonce ? '#fff5f5' : '#fafafa', padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: popupAnnonce ? '#fecaca' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📢</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Popup Annonce</h3>
                <span style={{ fontSize: 11, background: '#fff5f5', color: '#e63946', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>+3,00 $/mois + tx</span>
                {popupAnnonce && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>✅ Actif</span>}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                Affichez une popup ou bannière configurable sur votre boutique — promo, événement, fermeture. 3 formats, couleurs personnalisables, dates de début/fin.
              </p>
            </div>
            <div onClick={() => { if (!popupAnnonce) { setConfirmPopup(true); } else { setPopupAnnonce(false); setTimeout(() => sauvegarder(undefined, false), 50); } }}
              style={{ width: 44, height: 24, borderRadius: 12, background: popupAnnonce ? '#e63946' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginTop: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: popupAnnonce ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          {popupAnnonce && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #fecaca', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Configurez dans <strong>Configuration → Popup Annonce</strong></p>
              <span style={{ fontSize: 12, color: '#e63946', fontWeight: 700 }}>3,00 $/mois</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Récapitulatif facturation ──────────────────────────────────────── */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', margin: '0 0 14px' }}>💰 Récapitulatif de facturation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
            <span>Plan actif</span>
            <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{planActuel} · inclus</span>
          </div>
          {cacherPropulse && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
              <span>Cacher le branding</span><span style={{ fontWeight: 600, color: '#2563eb' }}>+2,00 $/mois</span>
            </div>
          )}
          {verificateurAge && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
              <span>Vérificateur d'âge</span><span style={{ fontWeight: 600, color: '#ef4444' }}>+5,00 $/mois</span>
            </div>
          )}
          {popupAnnonce && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
              <span>Popup Annonce</span><span style={{ fontWeight: 600, color: '#e63946' }}>+3,00 $/mois</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>Options supplémentaires</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: totalOptions > 0 ? '#dc2626' : '#888' }}>
              {totalOptions > 0 ? `+${totalOptions.toFixed(2).replace('.', ',')} $/mois` : 'Aucune option active'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>+ taxes applicables · ajusté au prochain renouvellement</p>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => sauvegarder()} disabled={saving}
          style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les options'}
        </button>
        {statut === 'ok' && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>✅ Options mises à jour !</span>}
        {statut === 'err' && <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 700 }}>❌ Erreur — réessayez.</span>}
      </div>


      {/* ── Popup confirmation activation Popup Annonce ── */}
      {confirmPopup && (
        <div onClick={() => setConfirmPopup(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: 'inherit' }}>
            <div style={{ background: 'linear-gradient(135deg,#e63946,#c1121f)', padding: '28px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📢</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Activer la Popup Annonce</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Add-On — facturation mensuelle</p>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#1a1a1a', lineHeight: 1.7 }}>
                  En activant cet add-on, des frais de <strong style={{ color: '#e63946' }}>3,00 $/mois + taxes</strong> seront ajoutés à votre abonnement.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {['✅ Popup ou bannière sur tous vos templates','✅ 3 formats : popup, bannière haut, bannière bas','✅ Couleurs et textes personnalisables','✅ Délai d\'apparition configurable','✅ Dates de début et fin de campagne'].map((item, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 13, color: '#444' }}>{item}</p>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmPopup(false)} style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Annuler</button>
                <button onClick={async () => { setConfirmPopup(false); setPopupAnnonce(true); await sauvegarder(undefined, true); }}
                  style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ Activer — 3,00 $/mois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup confirmation activation vérificateur d'âge ─────────────── */}
      {confirmVAge && (
        <div onClick={() => setConfirmVAge(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: 'inherit' }}>
            <div style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', padding: '28px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🔞</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Activer le Vérificateur d'âge</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Add-On Premium — facturation mensuelle</p>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#1a1a1a', lineHeight: 1.7 }}>
                  En activant cet add-on, des frais supplémentaires de <strong style={{ color: '#ef4444' }}>5,00 $/mois + taxes</strong> seront ajoutés à votre abonnement, effectifs dès le prochain renouvellement.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {['✅ Popup de vérification sur toute votre boutique','✅ 3 modes : Boutons, Date de naissance, Année','✅ Écran de blocage total si refus','✅ Entièrement personnalisable','✅ Mémorisation par navigateur configurable'].map((item, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 13, color: '#444' }}>{item}</p>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmVAge(false)}
                  style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
                  Annuler
                </button>
                <button onClick={confirmerActivationVAge}
                  style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ Activer — 5,00 $/mois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}