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
};

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', background: value ? '#0d9488' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

// ── Toggle Row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ flex: 1, paddingRight: '40px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: THEME.text, margin: '0 0 2px' }}>{label}</p>
        {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0, lineHeight: 1.5 }}>{note}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ── Select Field ──────────────────────────────────────────────────────────────
function SelectField({ label, note, value, onChange, options, width = '400px' }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; width?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width, padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', cursor: 'pointer', outline: 'none', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        onFocus={e => (e.target.style.borderColor = THEME.accent)}
        onBlur={e => (e.target.style.borderColor = THEME.border)}>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, marginTop: '6px', margin: '6px 0 0' }}>{note}</p>}
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function InputField({ label, note, value, onChange, type = 'text', placeholder, required = false, width = '400px', suffix }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; width?: string; suffix?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
        {label} {required && <span style={{ color: THEME.danger }}>*</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width, padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }}
          onFocus={e => (e.target.style.borderColor = THEME.accent)}
          onBlur={e => (e.target.style.borderColor = THEME.border)} />
        {suffix && <span style={{ fontSize: '13px', color: THEME.textLight, fontWeight: '600' }}>{suffix}</span>}
      </div>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, marginTop: '6px', margin: '6px 0 0' }}>{note}</p>}
    </div>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '32px 0 20px', paddingBottom: '10px', borderBottom: `2px solid ${THEME.accent}` }}>
      <h3 style={{ fontSize: '13px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: 0 }}>{children}</h3>
    </div>
  );
}

// ── Note Box ──────────────────────────────────────────────────────────────────
function NoteBox({ children, type = 'warning' }: { children: React.ReactNode; type?: 'warning' | 'info' | 'success' }) {
  const colors = {
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  };
  const c = colors[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
      <p style={{ fontSize: '13px', color: c.text, margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

// ── Info conformité PayPal ────────────────────────────────────────────────────
function ConformitePayPal() {
  return (
    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px 20px', marginBottom: '28px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🅿️ Exigences de conformité PayPal
      </p>
      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#0c4a6e', lineHeight: 2 }}>
        <li>Les versements doivent être en <strong>CAD</strong> ou <strong>USD</strong> pour les comptes canadiens</li>
        <li>Montant minimum de versement PayPal : <strong>1,00 $</strong></li>
        <li>Les frais PayPal sont de <strong>2,9 % + 0,30 $</strong> par transaction (à la charge du vendeur ou de l'admin)</li>
        <li>Le délai de versement standard est de <strong>1 à 3 jours ouvrables</strong> après confirmation</li>
        <li>Le compte PayPal du vendeur doit être <strong>vérifié</strong> avant tout versement automatique</li>
      </ul>
    </div>
  );
}

// ── Popup Vendeurs PayPal Connectés ──────────────────────────────────────────
function PopupVendeurs({ vendeurs, onClose, onUpdateStatus }: { vendeurs: any[]; onClose: () => void; onUpdateStatus: (id: number, status: string) => void }) {
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filtres = vendeurs.filter(v =>
    v.vendeur_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    v.vendeur_email?.toLowerCase().includes(recherche.toLowerCase()) ||
    v.paypal_email?.toLowerCase().includes(recherche.toLowerCase())
  );

  const statutColor = (s: string) => s === 'verified' ? THEME.success : s === 'suspended' ? THEME.danger : s === 'pending' ? THEME.warning : THEME.textLight;
  const statutLabel = (s: string) => s === 'verified' ? 'Vérifié' : s === 'suspended' ? 'Suspendu' : s === 'pending' ? 'En attente' : 'Rejeté';

  const handleStatusChange = async (vendeurId: number, newStatus: string) => {
    setUpdatingId(vendeurId);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/admin/paypal/vendeurs/${vendeurId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paypal_account_status: newStatus })
      });
      
      if (response.ok) {
        onUpdateStatus(vendeurId, newStatus);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    } finally {
      setUpdatingId(null);
      setLoading(false);
    }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ background: 'linear-gradient(135deg, #003087 0%, #0070ba 60%, #009cde 100%)', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: '800' }}>
              🅿️ Vendeurs connectés à PayPal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0', fontSize: '13px' }}>
              {filtres.length} compte{filtres.length !== 1 ? 's' : ''} PayPal Connect
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${THEME.border}`, background: '#f8fafc', flexShrink: 0 }}>
          <input type="text" placeholder="🔍 Rechercher par nom, courriel ou PayPal..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ width: '100%', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)} />
        </div>

        <div style={{ overflowY: 'auto' as const, flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#f0f4f8', position: 'sticky' as const, top: 0, zIndex: 1 }}>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Vendeur</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Courriel</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>PayPal Email</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Statut</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'center' as const, borderBottom: `2px solid ${THEME.border}` }}>Versements</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Connecté le</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'center' as const, borderBottom: `2px solid ${THEME.border}` }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' as const, color: THEME.textLight }}>Aucun vendeur trouvé</td></tr>
              ) : filtres.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: THEME.text }}>{v.vendeur_nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: THEME.textLight }}>{v.vendeur_email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#003087', fontFamily: 'monospace' }}>{v.paypal_email}</code>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <select
                      value={v.paypal_account_status}
                      onChange={(e) => handleStatusChange(v.vendeur_id, e.target.value)}
                      disabled={updatingId === v.vendeur_id}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${THEME.border}`,
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statutColor(v.paypal_account_status) + '10',
                        color: statutColor(v.paypal_account_status),
                        cursor: 'pointer'
                      }}
                    >
                      <option value="verified">Vérifié</option>
                      <option value="pending">En attente</option>
                      <option value="suspended">Suspendu</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' as const }}>
                    {v.paypal_payouts_enabled ? 
                      <span style={{ color: THEME.success, fontWeight: '600', fontSize: '12px' }}>✅ Activé</span> : 
                      <span style={{ color: THEME.danger, fontSize: '12px' }}>❌ Désactivé</span>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: THEME.textLight }}>{new Date(v.connected_at).toLocaleDateString('fr-CA')}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' as const }}>
                    <a href={`https://www.paypal.com/businessmanage/account/`} target="_blank" rel="noopener noreferrer"
                      style={{ color: THEME.accent, textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                      Voir PayPal →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            Les comptes PayPal Connect sont gérés directement dans le dashboard PayPal.
          </p>
          <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: THEME.accent, fontWeight: '700', textDecoration: 'none' }}>
            Ouvrir PayPal Developer Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── ONGLET 1 : Configuration PayPal ──────────────────────────────────────────
function OngletConfiguration({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <ConformitePayPal />

      <SectionTitle>⚙️ Paramètres généraux PayPal</SectionTitle>

      <ToggleRow
        label="PAYPAL SANDBOX"
        note="Active le mode test PayPal (sandbox). Désactiver pour passer en production."
        value={config.sandbox || false} onChange={(v) => setConfig('sandbox', v)}
      />

      {config.sandbox && (
        <NoteBox type="warning">
          ⚠️ Mode Sandbox activé — Aucun vrai paiement ne sera traité. À désactiver avant de passer en production.
        </NoteBox>
      )}

      <div style={{ padding: '14px 0', borderBottom: `1px solid ${THEME.border}`, marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: THEME.text, margin: '0 0 4px' }}>PAYPAL PAYOUT CONFIGURATION</p>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 8px' }}>Configurez vos paramètres de paiement PayPal.</p>
        <a href="https://developer.paypal.com/docs/payouts/" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '13px', color: THEME.accent, fontWeight: '600', textDecoration: 'none' }}>
          📖 En savoir plus sur PayPal Payouts →
        </a>
      </div>

      <SectionTitle>💸 Versement automatique au vendeur</SectionTitle>

      <ToggleRow
        label="AUTOPAY TO SELLER"
        note="Si activé, le gain total du vendeur sera automatiquement versé après le statut de commande sélectionné."
        value={config.autopay !== undefined ? config.autopay : true} onChange={(v) => setConfig('autopay', v)}
      />

      {config.autopay && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '20px 24px', marginTop: '16px' }}>
          <SelectField
            label="PAY AFTER"
            note="Sélectionnez le statut de commande après lequel le vendeur recevra son gain total."
            value={config.pay_after || 'Pay After Refund Date'}
            onChange={(v) => setConfig('pay_after', v)}
            options={[
              { val: 'Pay After Refund Date',    label: 'Pay After Refund Date' },
              { val: 'Pay After Order Fulfilled', label: 'Pay After Order Fulfilled' },
              { val: 'Pay After Order Delivered', label: 'Pay After Order Delivered' },
              { val: 'Pay After Order Paid',      label: 'Pay After Order Paid' },
            ]}
          />

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
              PAYPAL CLIENT ID <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text" value={config.client_id || ''} onChange={e => setConfig('client_id', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace' }}
              onFocus={e => (e.target.style.borderColor = THEME.accent)}
              onBlur={e => (e.target.style.borderColor = THEME.border)}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
              PAYPAL SECRET KEY <span style={{ color: THEME.danger }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSecret ? 'text' : 'password'} value={config.secret_key || ''} onChange={e => setConfig('secret_key', e.target.value)}
                style={{ width: '100%', padding: '10px 44px 10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace' }}
                onFocus={e => (e.target.style.borderColor = THEME.accent)}
                onBlur={e => (e.target.style.borderColor = THEME.border)}
              />
              <button onClick={() => setShowSecret(!showSecret)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: THEME.textLight, fontSize: '16px', padding: 0 }}>
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionTitle>🔧 Paramètres de versement</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <InputField
          label="Délai de versement vendeur (jours)"
          note="Nombre de jours ouvrables avant versement après confirmation de commande."
          value={config.delai_vendeur || '3'} onChange={(v) => setConfig('delai_vendeur', v)}
          type="number" suffix="jours ouvrables" width="160px"
        />
        <InputField
          label="Montant minimum de versement"
          note="Montant minimum avant déclenchement d'un versement (min. PayPal : 1,00 $)."
          value={config.montant_min || '10.00'} onChange={(v) => setConfig('montant_min', v)}
          type="number" suffix="$" width="160px"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <SelectField
          label="Devise du versement"
          note="PayPal exige CAD ou USD pour les comptes canadiens."
          value={config.devise || 'CAD'}
          onChange={(v) => setConfig('devise', v)}
          options={[
            { val: 'CAD', label: 'CAD — Dollar canadien' },
            { val: 'USD', label: 'USD — Dollar américain' },
          ]}
          width="200px"
        />
        <SelectField
          label="Frais PayPal pris en charge par"
          note="2,9% + 0,30$ par transaction."
          value={config.frais_pris_en || 'Seller'}
          onChange={(v) => setConfig('frais_pris_en', v)}
          options={[
            { val: 'Seller', label: 'Seller (vendeur)' },
            { val: 'Admin',  label: 'Admin (plateforme)' },
          ]}
          width="220px"
        />
      </div>

      <NoteBox type="info">
        💡 <strong>Délai de versement :</strong> PayPal recommande un délai minimum de 3 jours ouvrables après confirmation de la commande pour réduire les risques de rétrofacturation. Ce délai s'additionne au délai de traitement PayPal (1-2 jours).
      </NoteBox>

      <div style={{ marginTop: '8px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── ONGLET 2 : AutoPay & Planification ───────────────────────────────────────
function OngletAutoPay({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <SectionTitle>📅 Planification des versements automatiques</SectionTitle>

      <ToggleRow
        label="SCHEDULE AUTOPAY"
        note="Active la planification automatique des versements PayPal aux vendeurs."
        value={config.schedule_autopay !== undefined ? config.schedule_autopay : true} onChange={(v) => setConfig('schedule_autopay', v)}
      />

      {config.schedule_autopay && (
        <>
          <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '24px', marginTop: '20px' }}>

            <SelectField
              label="PAYOUT TRANSACTION TYPE"
              value={config.transaction_type || 'sum_all'}
              onChange={(v) => setConfig('transaction_type', v)}
              options={[
                { val: 'sum_all',      label: 'Sum of all eligible order payouts' },
                { val: 'per_order',    label: 'Per order payout' },
                { val: 'manual',       label: 'Manual payout only' },
              ]}
            />

            <SelectField
              label="PAYOUT PERIOD"
              note="Sélectionnez la fréquence des versements automatiques."
              value={config.period || 'Weekly'}
              onChange={(v) => setConfig('period', v)}
              options={[
                { val: 'Daily',    label: 'Daily — Quotidien' },
                { val: 'Weekly',   label: 'Weekly — Hebdomadaire' },
                { val: 'Biweekly', label: 'Biweekly — Bimensuel' },
                { val: 'Monthly',  label: 'Monthly — Mensuel' },
              ]}
            />

            {config.period === 'Weekly' || config.period === 'Biweekly' ? (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                  BILLING DAY OF WEEK <span style={{ color: THEME.danger }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <select value={config.billing_day || 'Monday'} onChange={e => setConfig('billing_day', e.target.value)}
                    style={{ width: '220px', padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', cursor: 'pointer', outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = THEME.accent)}
                    onBlur={e => (e.target.style.borderColor = THEME.border)}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '13px', color: THEME.textLight }}>jour de la semaine</span>
                </div>
              </div>
            ) : config.period === 'Monthly' ? (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                  BILLING DATE OF MONTH <span style={{ color: THEME.danger }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="number" min="1" max="28" value={config.billing_date || '1'} onChange={e => setConfig('billing_date', e.target.value)}
                    style={{ width: '100px', padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = THEME.accent)}
                    onBlur={e => (e.target.style.borderColor = THEME.border)} />
                  <span style={{ fontSize: '13px', color: THEME.textLight }}>du mois (1-28)</span>
                </div>
                <p style={{ fontSize: '12px', color: THEME.textLight, marginTop: '6px' }}>Limité au 28 pour éviter les problèmes en février.</p>
              </div>
            ) : null}
          </div>

          <SectionTitle>⏱️ Délais et montants</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <InputField
              label="Délai de traitement avant versement"
              note="Jours ouvrables d'attente après confirmation avant versement PayPal."
              value={config.delai_traitement || '3'} onChange={(v) => setConfig('delai_traitement', v)}
              type="number" suffix="jours ouvrables" width="120px"
            />
            <InputField
              label="Montant minimum AutoPay"
              note="Le versement ne se déclenchera pas si le solde est inférieur à ce montant."
              value={config.montant_min_auto || '10.00'} onChange={(v) => setConfig('montant_min_auto', v)}
              type="number" suffix="$" width="120px"
            />
          </div>

          <NoteBox type="info">
            💡 <strong>Recommandation PayPal :</strong> Un délai de 3 à 5 jours ouvrables est recommandé pour permettre la résolution des litiges avant versement. Cela réduit les risques de solde négatif sur votre compte PayPal Business.
          </NoteBox>

          <SectionTitle>🔔 Notifications de versement</SectionTitle>

          <ToggleRow
            label="Notifier le vendeur lors d'un versement"
            note="Envoie un courriel au vendeur à chaque versement automatique effectué."
            value={config.notif_vendeur !== undefined ? config.notif_vendeur : true} onChange={(v) => setConfig('notif_vendeur', v)}
          />
          <ToggleRow
            label="Notifier l'administrateur lors d'un versement"
            note="Envoie un courriel à l'admin à chaque versement automatique effectué."
            value={config.notif_admin !== undefined ? config.notif_admin : true} onChange={(v) => setConfig('notif_admin', v)}
          />

          <NoteBox type="success">
            ✅ <strong>Conformité PayPal :</strong> Tous les versements automatiques sont enregistrés dans les journaux d'audit. Assurez-vous que les comptes PayPal des vendeurs sont vérifiés avant d'activer l'autopay.
          </NoteBox>
        </>
      )}

      <div style={{ marginTop: '24px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── Page principale ConfigurationPaypal ───────────────────────────────────────
export default function ConfigurationPaypal({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [onglet, setOnglet] = useState<'config' | 'autopay'>('config');
  const [showPopupVendeurs, setShowPopupVendeurs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [vendeurs, setVendeurs] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Charger la configuration PayPal
  const chargerConfiguration = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/paypal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erreur chargement config PayPal:', error);
      showToast('Erreur lors du chargement de la configuration PayPal', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Charger les vendeurs PayPal Connect
  const chargerVendeurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/paypal/vendeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendeurs(data);
      }
    } catch (error) {
      console.error('Erreur chargement vendeurs PayPal:', error);
    }
  };

  // Sauvegarder la configuration
  const sauvegarderConfiguration = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        showToast('Configuration PayPal sauvegardée avec succès!', 'success');
        await chargerConfiguration();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde PayPal:', error);
      showToast('Erreur lors de la sauvegarde de la configuration PayPal', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour un champ de configuration
  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  // Mettre à jour le statut d'un vendeur
  const updateVendeurStatus = (vendeurId: number, newStatus: string) => {
    setVendeurs((prev: any[]) =>
      prev.map(v => v.vendeur_id === vendeurId ? { ...v, paypal_account_status: newStatus } : v)
    );
    showToast(`Statut du vendeur mis à jour`, 'success');
  };

  useEffect(() => {
    chargerConfiguration();
    chargerVendeurs();
  }, []);

  const onglets = [
    { id: 'config',  label: 'Payment Methods' },
    { id: 'autopay', label: 'AutoPay Setting' },
  ] as const;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px',
          backgroundColor: toast.type === 'success' ? THEME.success : toast.type === 'danger' ? THEME.danger : THEME.accent,
          color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
          zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          {toast.type === 'success' ? '✅' : toast.type === 'danger' ? '❌' : 'ℹ️'} {toast.msg}
        </div>
      )}

      {showPopupVendeurs && <PopupVendeurs vendeurs={vendeurs} onClose={() => setShowPopupVendeurs(false)} onUpdateStatus={updateVendeurStatus} />}

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              🅿️ Configuration PayPal
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              Configurez les paramètres de paiement PayPal pour les vendeurs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { chargerVendeurs(); setShowPopupVendeurs(true); }}
              style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              👥 VOIR LES VENDEURS CONNECTÉS ({vendeurs.length})
            </button>
            <button onClick={sauvegarderConfiguration} disabled={saving}
              style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 24px 0', background: '#f8fafc', borderBottom: `2px solid ${THEME.border}` }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 0' }}>PAYMENT CONFIGURATION</p>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 12px' }}>Configurez vos paiements ici.</p>
          <div style={{ display: 'flex' }}>
            {onglets.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                style={{ padding: '10px 22px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: onglet === o.id ? '700' : '500', color: onglet === o.id ? THEME.accent : THEME.textLight, cursor: 'pointer', borderBottom: onglet === o.id ? `3px solid ${THEME.accent}` : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {onglet === 'config'  && <OngletConfiguration config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} />}
        {onglet === 'autopay' && <OngletAutoPay config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} />}
      </div>
    </div>
  );
}
