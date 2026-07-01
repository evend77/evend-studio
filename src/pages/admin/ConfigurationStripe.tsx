import React, { useState, useEffect } from 'react';

const THEME = {
  sidebar:      '#1a2436',
  sidebarHover: '#243044',
  sidebarActive:'#2d6a9f',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  topbar:       '#ffffff',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
};

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', background: value ? '#0d9488' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

// ── Select Field ──────────────────────────────────────────────────────────────
function SelectField({ label, note, value, onChange, options, width = '340px' }: {
  label: string; note?: string; value: string;
  onChange: (v: string) => void; options: { val: string; label: string }[]; width?: string;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width, padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', cursor: 'pointer', outline: 'none', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        onFocus={e => (e.target.style.borderColor = THEME.accent)}
        onBlur={e => (e.target.style.borderColor = THEME.border)}>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: '6px 0 0' }}>{note}</p>}
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function InputField({ label, note, value, onChange, type = 'text', placeholder, width = '340px', suffix, showEye }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; width?: string; suffix?: string; showEye?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: '28px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input type={showEye && !show ? 'password' : type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width, padding: showEye ? '10px 42px 10px 14px' : '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, fontFamily: showEye ? 'monospace' : 'inherit' }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)} />
          {showEye && (
            <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: THEME.textLight, fontSize: '15px', padding: 0 }}>
              {show ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {suffix && <span style={{ fontSize: '13px', color: THEME.textLight, fontWeight: '600', whiteSpace: 'nowrap' as const }}>{suffix}</span>}
      </div>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: '6px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

// ── Toggle Row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, note, value, onChange }: {
  label: string; note?: string; value: boolean; onChange: (v: boolean) => void;
}) {
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
  const c = {
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  }[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
      <p style={{ fontSize: '13px', color: c.text, margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
}

// ── Checkbox Row ──────────────────────────────────────────────────────────────
function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '20px', marginBottom: '10px', fontSize: '13px', color: THEME.text, fontWeight: checked ? '600' : '400' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: '15px', height: '15px', accentColor: THEME.accent, cursor: 'pointer' }} />
      {label}
    </label>
  );
}

// ── Badge statut ──────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
      {label}
    </span>
  );
}

// ── Popup Vendeurs Connectés ──────────────────────────────────────────────────
function PopupVendeurs({ vendeurs, onClose, onUpdateStatus }: { vendeurs: any[]; onClose: () => void; onUpdateStatus: (id: number, status: string) => void }) {
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filtres = vendeurs.filter(v =>
    v.vendeur_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    v.vendeur_email?.toLowerCase().includes(recherche.toLowerCase()) ||
    v.stripe_account_id?.toLowerCase().includes(recherche.toLowerCase())
  );

  const statutColor = (s: string) => s === 'active' ? THEME.success : s === 'suspended' ? THEME.danger : s === 'pending' ? THEME.warning : THEME.textLight;

  const handleStatusChange = async (vendeurId: number, newStatus: string) => {
    setUpdatingId(vendeurId);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/admin/stripe/vendeurs/${vendeurId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stripe_account_status: newStatus })
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

        <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #3b82c4 100%)', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: '800' }}>
              💳 Vendeurs connectés à Stripe
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0', fontSize: '13px' }}>
              {filtres.length} compte{filtres.length !== 1 ? 's' : ''} Stripe Connect
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${THEME.border}`, background: '#f8fafc', flexShrink: 0 }}>
          <input type="text" placeholder="🔍 Rechercher par nom, courriel ou ID Stripe..."
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
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>ID Stripe Connect</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Type</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Statut</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: `2px solid ${THEME.border}` }}>Connecté le</th>
                <th style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'center' as const, borderBottom: `2px solid ${THEME.border}` }}>Action</th>
               </tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' as const, color: THEME.textLight }}>Aucun vendeur trouvé</td></tr>
              ) : filtres.map((v, i) => (
                <tr key={v.id}
                  style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: THEME.text }}>{v.vendeur_nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: THEME.textLight }}>{v.vendeur_email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#1e40af', fontFamily: 'monospace' }}>{v.stripe_account_id}</code>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: THEME.text }}>{v.stripe_account_type}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <select
                      value={v.stripe_account_status}
                      onChange={(e) => handleStatusChange(v.vendeur_id, e.target.value)}
                      disabled={updatingId === v.vendeur_id}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${THEME.border}`,
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statutColor(v.stripe_account_status) + '10',
                        color: statutColor(v.stripe_account_status),
                        cursor: 'pointer'
                      }}
                    >
                      <option value="active">Actif</option>
                      <option value="pending">En attente</option>
                      <option value="suspended">Suspendu</option>
                      <option value="restricted">Restreint</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: THEME.textLight }}>{new Date(v.connected_at).toLocaleDateString('fr-CA')}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' as const }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      {!v.stripe_account_id && (
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const r = await fetch(`https://evend-multivendeur-api.onrender.com/api/admin/stripe/onboarding/${v.vendeur_id}`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              const data = await r.json();
                              if (data.onboarding_url) {
                                window.open(data.onboarding_url, '_blank');
                              } else {
                                alert('Erreur: ' + (data.error || 'Impossible de générer le lien'));
                              }
                            } catch (e: any) {
                              alert('Erreur: ' + e.message);
                            }
                          }}
                          style={{ background: THEME.success, color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                          🔗 Connecter
                        </button>
                      )}
                      {v.stripe_account_id && (
                        <a href={`https://dashboard.stripe.com/connect/accounts/${v.stripe_account_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: THEME.accent, textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                          Voir Stripe →
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            Les comptes Stripe Connect sont gérés directement dans le dashboard Stripe.
          </p>
          <a href="https://dashboard.stripe.com/connect/accounts/overview" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: THEME.accent, fontWeight: '700', textDecoration: 'none' }}>
            Ouvrir Stripe Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── ONGLET 1 : Configuration paiement Stripe ──────────────────────────────────
function OngletPaiement({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>(config.payment_methods || {
    Cards: true, iDEAL: false, 'Payment Request Button (Apple Pay, Google Pay)': true,
    Sofort: false, Bancontact: false, EPS: false, FPX: false, giropay: false,
    Przelewy24: false, alipay: false, GrabPay: false, 'AfterPay/ClearPay': false,
    Paypal: false, 'Sepa Debit': false,
  });

  const isPayout   = config.use_stripe_for === 'STRIPE PAYOUT';
  const isTransfer = config.use_stripe_for === 'STRIPE TRANSFER';
  if (isPayout || isTransfer) return <OngletPayout config={config} setConfig={setConfig} onSave={onSave} />;

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updatePaymentMethods = (methods: Record<string, boolean>) => {
    setPaymentMethods(methods);
    setConfig('payment_methods', methods);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>

      <SectionTitle>⚙️ Paramètres généraux</SectionTitle>

      <SelectField label="Utiliser Stripe pour" value={config.use_stripe_for} onChange={(v) => setConfig('use_stripe_for', v)}
        options={[
          { val: 'STRIPE PAYMENT METHOD', label: 'STRIPE PAYMENT METHOD' },
          { val: 'STRIPE PAYOUT',         label: 'STRIPE PAYOUT' },
          { val: 'STRIPE TRANSFER',       label: 'STRIPE TRANSFER' },
        ]} />

      <SelectField label="Appliquer Stripe pour" value={config.use_stripe_for_who} onChange={(v) => setConfig('use_stripe_for_who', v)}
        options={[
          { val: 'BOTH',       label: 'BOTH' },
          { val: 'CHECKOUT',   label: 'CHECKOUT' },
          { val: 'MEMBERSHIP', label: 'MEMBERSHIP' },
        ]} />

      <SelectField label="Obtenir les détails de carte client sur" value={config.card_details_on} onChange={(v) => setConfig('card_details_on', v)}
        options={[{ val: 'THANK YOU PAGE', label: 'THANK YOU PAGE' }]} />

      <InputField
        label="Libellé sur le relevé bancaire (Statement Descriptor)"
        note="Texte affiché sur le relevé bancaire du client — requis par Stripe (max 22 caractères, sans caractères spéciaux)."
        value={config.statement_desc || ''} onChange={(v) => setConfig('statement_desc', v)} placeholder="e-Vend" width="280px" />

      <ToggleRow
        label="Restreindre l'accès vendeur aux commandes non payées"
        note="Empêche le vendeur de voir la commande si le client n'a pas encore payé."
        value={config.restrict_seller || false} onChange={(v) => setConfig('restrict_seller', v)} />

      <ToggleRow
        label="Annulation automatique de la commande"
        note="Annule automatiquement la commande si le client n'a pas payé dans le délai imparti."
        value={config.auto_cancel || true} onChange={(v) => setConfig('auto_cancel', v)} />

      {config.auto_cancel && (
        <div style={{ marginTop: '16px' }}>
          <InputField label="Délai d'annulation" note="Nombre d'heures avant l'annulation automatique." value={config.cancel_hour || '24'} onChange={(v) => setConfig('cancel_hour', v)} type="number" width="100px" suffix="heures" />
        </div>
      )}

      <SectionTitle>💳 Flux de paiement</SectionTitle>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' }}>Flux de paiement</label>
        {[
          { val: 'redirect', label: 'Rediriger vers la page Stripe' },
          { val: 'same',     label: 'Paiement sur la même page' },
        ].map(opt => (
          <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', color: THEME.text }}>
            <input type="radio" name="paymentFlow" value={opt.val} checked={config.payment_flow === opt.val}
              onChange={() => setConfig('payment_flow', opt.val)} style={{ accentColor: THEME.accent, width: '16px', height: '16px' }} />
            {opt.label}
          </label>
        ))}
        <NoteBox>
          <strong>Rediriger vers la page Stripe :</strong> Le client est redirigé vers Stripe pour entrer ses informations de paiement, puis revient sur la page de confirmation.<br />
          <strong>Paiement sur la même page :</strong> Les informations de paiement apparaissent en popup sur la page de confirmation.
        </NoteBox>
      </div>

      {config.payment_flow === 'same' && (
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' }}>Méthodes de paiement acceptées</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
            {Object.keys(paymentMethods).map(m => (
              <CheckboxRow key={m} label={m} checked={paymentMethods[m]} onChange={v => updatePaymentMethods({ ...paymentMethods, [m]: v })} />
            ))}
          </div>
        </div>
      )}

      <InputField label="Code de pays ISO" note="Le code pays à deux lettres de votre compte Stripe (ex : CA, US, FR)." value={config.country_code || 'CA'} onChange={(v) => setConfig('country_code', v)} placeholder="CA" width="120px" />
      <InputField label="Description du paiement" note="Description visible par le client lors du paiement (max 200 caractères)." value={config.description || ''} onChange={(v) => setConfig('description', v)} />

      <SectionTitle>🔧 Méthode de traitement</SectionTitle>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' }}>Méthode de traitement des paiements</label>
        {[
          { val: 'DIRECT CHARGES',      label: 'Direct Charges' },
          { val: 'DESTINATION CHARGES', label: 'Destination Charges' },
        ].map(opt => (
          <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', color: THEME.text }}>
            <input type="radio" name="processingMethod" value={opt.val} checked={config.processing_method === opt.val}
              onChange={() => setConfig('processing_method', opt.val)} style={{ accentColor: THEME.accent, width: '16px', height: '16px' }} />
            {opt.label}
          </label>
        ))}
      </div>

      <NoteBox>
        <strong>Separate Charges &amp; Transfer :</strong> L'admin reçoit le montant total, puis transfère les gains au vendeur. Fonctionne uniquement si les deux comptes sont dans la même région.<br /><br />
        <strong>Destination Charges :</strong> Les frais de traitement Stripe sont à la charge de l'admin uniquement et la commission est ajoutée aux frais d'application.<br /><br />
        <strong>Direct Charges :</strong> Les frais de traitement Stripe sont à la charge du vendeur uniquement et la commission admin est ajoutée aux frais d'application.
      </NoteBox>

      <SelectField label="Frais Stripe pris en charge par" value={config.stripe_fee_bear || 'Seller'} onChange={(v) => setConfig('stripe_fee_bear', v)}
        options={[
          { val: 'Seller', label: 'Seller' },
          { val: 'Admin',  label: 'Admin' },
        ]} />

      <SectionTitle>📧 Rappels de paiement</SectionTitle>

      <InputField label="Nom du paiement Stripe" note="Nom affiché pour ce mode de paiement dans la boutique." value={config.payment_name || ''} onChange={(v) => setConfig('payment_name', v)} />

      <ToggleRow
        label="Rappel de paiement commande Stripe"
        note="Envoie un rappel de paiement en attente au client par courriel."
        value={config.reminder_enabled || true} onChange={(v) => setConfig('reminder_enabled', v)} />

      {config.reminder_enabled && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <InputField label="Heure d'envoi du rappel" note="Délai après lequel le rappel est envoyé." value={config.reminder_time || '6'} onChange={(v) => setConfig('reminder_time', v)} type="number" suffix="heures" width="100px" />
          <InputField label="Nombre de jours de rappel" note="Durée pendant laquelle les rappels seront envoyés." value={config.reminder_days || '1'} onChange={(v) => setConfig('reminder_days', v)} type="number" suffix="jours" width="100px" />
        </div>
      )}

      <SectionTitle>⏱️ Délai de versement Stripe au vendeur</SectionTitle>

      <NoteBox type="info">
        💡 <strong>Délai propre à Stripe :</strong> Ce délai est indépendant du délai PayPal — chaque passerelle a son propre calendrier. Stripe impose déjà un minimum de 2 jours ouvrables avant tout transfert. Le délai configuré ici s'ajoute à ce délai Stripe standard, vous permettant de gérer remboursements et litiges avant versement.
      </NoteBox>

      <ToggleRow
        label="Activer le versement automatique (Autopay)"
        note="Si activé, Stripe verse automatiquement les gains du vendeur selon le délai configuré ci-dessous. Si désactivé, les versements sont manuels — tu dois les déclencher toi-même via l'API Stripe."
        value={config.delai_actif || false} onChange={(v) => setConfig('delai_actif', v)} />

      {config.delai_actif && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '24px', marginTop: '16px' }}>

          <SelectField
            label="Déclencher le versement après le statut"
            note="Le compte à rebours démarre une fois ce statut de commande atteint."
            value={config.delai_statut || 'commande_livree'} onChange={(v) => setConfig('delai_statut', v)}
            options={[
              { val: 'commande_payee',    label: 'Commande payée' },
              { val: 'commande_expediee', label: 'Commande expédiée' },
              { val: 'commande_livree',   label: 'Commande livrée' },
              { val: 'delai_retour',      label: 'Après délai de retour expiré' },
            ]} />

          <NoteBox type="info">
            💡 <strong>Comment ça fonctionne avec Stripe :</strong> Quand activé, le compte Stripe du vendeur est configuré en payout <code>daily</code> avec un délai de <strong>{config.delai_jours || 3} jours ouvrables</strong>. Stripe verse automatiquement chaque jour les transactions qui ont atteint ce délai.
          </NoteBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <InputField
              label="Délai avant versement (delay_days Stripe)"
              note="Minimum 2 jours (limite Stripe). Recommandé : 3 à 7 jours pour gérer les litiges. Correspond au paramètre delay_days de l'API Stripe."
              value={config.delai_jours || '3'} onChange={(v) => setConfig('delai_jours', v)}
              type="number" suffix="jours ouvrables" width="100px" />
            <InputField
              label="Montant minimum de versement"
              note="Stripe ne transfère pas les montants inférieurs à ce seuil."
              value={config.delai_min_montant || '5.00'} onChange={(v) => setConfig('delai_min_montant', v)}
              type="number" suffix="$" width="100px" />
          </div>

          <ToggleRow
            label="Notifier le vendeur lors du versement"
            note="Envoie un courriel au vendeur à chaque versement Stripe effectué."
            value={config.notif_versement || true} onChange={(v) => setConfig('notif_versement', v)} />

          <div style={{ marginTop: '16px' }}>
            <NoteBox type="success">
              ✅ <strong>Conformité Stripe Connect :</strong> Les transferts doivent être effectués en devise supportée (CAD, USD…). Le compte Stripe du vendeur doit être activé et vérifié. Stripe conserve un historique de tous les transferts dans votre dashboard Connect.
            </NoteBox>
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── ONGLET PAYOUT/TRANSFER ────────────────────────────────────────────────────
function OngletPayout({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <SectionTitle>⚙️ Paramètres {config.use_stripe_for === 'STRIPE PAYOUT' ? 'Payout' : 'Transfer'}</SectionTitle>

      <SelectField label="Utiliser Stripe pour" value={config.use_stripe_for} onChange={(v) => setConfig('use_stripe_for', v)}
        options={[
          { val: 'STRIPE PAYMENT METHOD', label: 'STRIPE PAYMENT METHOD' },
          { val: 'STRIPE PAYOUT',         label: 'STRIPE PAYOUT' },
          { val: 'STRIPE TRANSFER',       label: 'STRIPE TRANSFER' },
        ]} />
      <SelectField label="Appliquer Stripe pour" value={config.use_stripe_for_who} onChange={(v) => setConfig('use_stripe_for_who', v)}
        options={[
          { val: 'BOTH',       label: 'BOTH' },
          { val: 'CHECKOUT',   label: 'CHECKOUT' },
          { val: 'MEMBERSHIP', label: 'MEMBERSHIP' },
        ]} />

      <ToggleRow label="Envoyer la description avec le virement Stripe"
        note="Si activé, une description sera incluse dans le virement Stripe."
        value={config.send_description || false} onChange={(v) => setConfig('send_description', v)} />
      <ToggleRow label="Versement automatique au vendeur (Autopay)"
        note="Si activé, le gain total du vendeur sera automatiquement versé après le statut de commande sélectionné."
        value={config.autopay || false} onChange={(v) => setConfig('autopay', v)} />

      <div style={{ marginTop: '20px' }}>
        <SelectField label="Type de méthode de paiement pour le transfert" value={config.transfer_method || 'All payment methods'} onChange={(v) => setConfig('transfer_method', v)}
          options={[
            { val: 'All payment methods', label: 'All payment methods' },
            { val: 'Stripe only',         label: 'Stripe only' },
          ]} />
      </div>

      <div style={{ marginTop: '32px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── ONGLET 2 : Configuration Stripe vendeur ───────────────────────────────────
function OngletVendeur({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <SectionTitle>🏪 Configuration du compte Stripe vendeur</SectionTitle>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' }}>Type de compte Stripe vendeur</label>
        {['STANDARD', 'EXPRESS', 'CUSTOM'].map(t => (
          <label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '24px', fontSize: '14px', color: THEME.text, fontWeight: config.account_type === t ? '700' : '400' }}>
            <input type="radio" name="accountType" value={t} checked={config.account_type === t}
              onChange={() => setConfig('account_type', t)} style={{ accentColor: THEME.accent, width: '16px', height: '16px' }} />
            {t}
          </label>
        ))}
        <div style={{ marginTop: '14px' }}>
          <NoteBox type="info">
            <strong>STANDARD :</strong> Le vendeur possède un compte Stripe complet et gère lui-même ses paramètres. Idéal pour les vendeurs expérimentés.<br />
            <strong>EXPRESS :</strong> Stripe gère l'interface du vendeur. L'onboarding est simplifié — recommandé pour la majorité des vendeurs.<br />
            <strong>CUSTOM :</strong> Compte entièrement contrôlé par la plateforme. Invisible pour le vendeur. Nécessite une intégration plus poussée.
          </NoteBox>
        </div>
      </div>

      {/* ── Propriétés Controller — visibles pour tous les types ── */}
      {config.account_type && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>⚙️ Propriétés Controller</p>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 18px' }}>
            {config.account_type === 'CUSTOM'
              ? 'Configurez le comportement du compte Custom selon vos besoins.'
              : `Valeurs appliquées automatiquement par Stripe pour un compte ${config.account_type}.`}
          </p>

          {/* Tableau informatif pour STANDARD et EXPRESS */}
          {config.account_type !== 'CUSTOM' && (() => {
            const valeurs = config.account_type === 'STANDARD'
              ? [
                  { prop: 'losses.payments',        val: 'stripe',              desc: 'Stripe est responsable des pertes' },
                  { prop: 'fees.payer',              val: 'account',             desc: 'Stripe collecte les frais directement auprès du marchand' },
                  { prop: 'stripe_dashboard.type',  val: 'full',                desc: 'Le vendeur accède au dashboard Stripe complet' },
                  { prop: 'requirement_collection', val: 'stripe',              desc: 'Stripe gère la collecte des documents KYC' },
                ]
              : [ // EXPRESS
                  { prop: 'losses.payments',        val: 'application',         desc: 'La plateforme (e-Vend) est responsable des pertes' },
                  { prop: 'fees.payer',              val: 'application',         desc: 'La plateforme paie les frais Stripe (Stripe retourne application_express en réponse, mais application est la valeur à envoyer à la création)' },
                  { prop: 'stripe_dashboard.type',  val: 'express',             desc: 'Le vendeur accède au dashboard Express simplifié (pas le full dashboard)' },
                  { prop: 'requirement_collection', val: 'stripe',              desc: 'Stripe gère la collecte des documents KYC' },
                ];
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#e8f2fb' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' as const, color: THEME.text, fontWeight: '700' }}>Propriété</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' as const, color: THEME.text, fontWeight: '700' }}>Valeur</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' as const, color: THEME.text, fontWeight: '700' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {valeurs.map((row, i) => (
                    <tr key={row.prop} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: `1px solid ${THEME.border}` }}>
                      <td style={{ padding: '10px 12px' }}>
                        <code style={{ fontSize: '11px', background: '#e8f2fb', padding: '2px 7px', borderRadius: '4px', color: THEME.accent, fontFamily: 'monospace' }}>{row.prop}</code>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <code style={{ fontSize: '11px', background: '#f0fdf4', padding: '2px 7px', borderRadius: '4px', color: '#16a34a', fontFamily: 'monospace' }}>{row.val}</code>
                      </td>
                      <td style={{ padding: '10px 12px', color: THEME.textLight }}>{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}

          {/* Champs éditables seulement pour CUSTOM */}
          {config.account_type === 'CUSTOM' && (
            <>
              <SelectField
                label="Responsabilité des pertes (losses.payments)"
                note="stripe = Stripe couvre les pertes. application = votre plateforme est responsable. Pour CUSTOM : application."
                value={config.controller_losses || 'application'}
                onChange={(v) => setConfig('controller_losses', v)}
                options={[
                  { val: 'stripe',      label: 'stripe — Stripe est responsable des pertes' },
                  { val: 'application', label: 'application — La plateforme est responsable (défaut Custom)' },
                ]} width="420px" />

              <SelectField
                label="Qui paie les frais Stripe (fees.payer)"
                note="account = le vendeur paie les frais Stripe directement. application = la plateforme paie les frais. Note: Stripe retourne 'application_custom' en réponse mais la valeur à configurer est 'application'."
                value={config.controller_fees_payer === 'application_custom' ? 'application' : (config.controller_fees_payer || 'application')}
                onChange={(v) => setConfig('controller_fees_payer', v)}
                options={[
                  { val: 'application', label: 'application — La plateforme paie les frais (défaut Custom)' },
                  { val: 'account',     label: 'account — Le vendeur paie les frais Stripe' },
                ]} width="420px" />

              <SelectField
                label="Type de dashboard vendeur (stripe_dashboard.type)"
                note="none = aucun accès dashboard Stripe (défaut Custom). express = dashboard simplifié. full = dashboard complet."
                value={config.controller_dashboard || 'none'}
                onChange={(v) => setConfig('controller_dashboard', v)}
                options={[
                  { val: 'none',    label: 'none — Aucun accès au dashboard Stripe (défaut Custom)' },
                  { val: 'express', label: 'express — Dashboard simplifié' },
                  { val: 'full',    label: 'full — Dashboard Stripe complet' },
                ]} width="420px" />

              <SelectField
                label="Collecte des exigences (requirement_collection)"
                note="application = votre plateforme collecte les infos KYC (défaut Custom). stripe = Stripe collecte."
                value={config.controller_requirements || 'application'}
                onChange={(v) => setConfig('controller_requirements', v)}
                options={[
                  { val: 'application', label: 'application — La plateforme collecte les documents (défaut Custom)' },
                  { val: 'stripe',      label: 'stripe — Stripe gère la collecte des documents' },
                ]} width="420px" />

              <NoteBox type="warning">
                ⚠️ Ces paramètres correspondent aux propriétés <code>controller</code> de l'API Stripe. Une mauvaise configuration peut bloquer les paiements vendeurs. Consultez la <a href="https://docs.stripe.com/connect/migrate-to-controller-properties" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>documentation Stripe</a> avant de modifier.
              </NoteBox>
            </>
          )}
        </div>
      )}

      <SelectField label="Flux de connexion du compte vendeur" value={config.connect_flow || 'Connect via API'} onChange={(v) => setConfig('connect_flow', v)}
        options={[
          { val: 'Connect via API',   label: 'Connect via API' },
          { val: 'Connect via OAuth', label: 'Connect via OAuth' },
        ]} />

      <NoteBox>
        <strong>Connect via API :</strong> e-Vend crée le compte Stripe du vendeur programmatiquement et lui envoie un lien d'activation.<br />
        <strong>Connect via OAuth :</strong> Le vendeur se connecte lui-même en autorisant e-Vend depuis son compte Stripe existant.
      </NoteBox>

      <SectionTitle>🔧 Options du compte vendeur</SectionTitle>

      <ToggleRow
        label="Full Service Agreement (Accord de service complet)"
        note="Votre plateforme accepte les conditions de service Stripe Connect au nom du vendeur. Requis dans certaines régions."
        value={config.full_service !== undefined ? config.full_service : true} onChange={(v) => setConfig('full_service', v)} />
      <ToggleRow
        label="Cross-border Payouts (Versements transfrontaliers)"
        note="Autorise les versements vers des comptes bancaires dans d'autres pays. Des frais Stripe supplémentaires s'appliquent."
        value={config.cross_border || false} onChange={(v) => setConfig('cross_border', v)} />
      <ToggleRow
        label="Debit Negative Balance (Débit solde négatif)"
        note="Si le solde du vendeur est négatif (ex: remboursement), Stripe débitera automatiquement son compte bancaire."
        value={config.debit_negative !== undefined ? config.debit_negative : true} onChange={(v) => setConfig('debit_negative', v)} />
      <ToggleRow
        label="Définir un délai de versement personnalisé"
        note="Permet de configurer un calendrier de versement spécifique pour les vendeurs (quotidien, hebdomadaire, mensuel)."
        value={config.payout_time !== undefined ? config.payout_time : true} onChange={(v) => setConfig('payout_time', v)} />

      <div style={{ marginTop: '32px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── ONGLET 3 : Credentials ────────────────────────────────────────────────────
function OngletCredentials({ config, setConfig, onSave }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState<'principal' | 'connect' | null>(null);
  const [webhookStatut, setWebhookStatut] = useState<{ principal?: any; connect?: any }>({});

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enregistrerWebhook = async (type: 'principal' | 'connect') => {
    setWebhookLoading(type);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        'https://evend-multivendeur-api.onrender.com/api/admin/stripe/webhook/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur enregistrement webhook');

      if (type === 'principal') {
        setConfig(config.sandbox ? 'dev_webhook_secret' : 'prod_webhook_secret', data.signing_secret);
        setWebhookStatut(prev => ({ ...prev, principal: data }));
      } else {
        setConfig(config.sandbox ? 'dev_memb_webhook_secret' : 'prod_memb_webhook_secret', data.signing_secret);
        setWebhookStatut(prev => ({ ...prev, connect: data }));
      }
      // Sauvegarder immédiatement
      onSave();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setWebhookLoading(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <SectionTitle>🔑 Identifiants Stripe</SectionTitle>

      <ToggleRow
        label="Environnement Sandbox (mode test)"
        note="Si activé, les requêtes sont dirigées vers l'environnement de test Stripe. Désactiver pour passer en production."
        value={config.sandbox !== undefined ? config.sandbox : true} onChange={(v) => setConfig('sandbox', v)} />

      {config.sandbox && <NoteBox type="warning">⚠️ Mode Sandbox activé — Aucun vrai paiement ne sera traité. Utilisez les clés de test Stripe (préfixe pk_test_ / sk_test_).</NoteBox>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '24px 0 28px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚡ Enregistrement automatique des webhooks sur Stripe
        </p>
        <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
          Clique pour enregistrer l'endpoint directement sur Stripe. Le <strong>Signing Secret</strong> sera récupéré et sauvegardé automatiquement — tu n'as pas besoin d'aller dans le dashboard Stripe.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

          {/* Bouton Webhook Principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              disabled={webhookLoading === 'principal'}
              style={{ backgroundColor: webhookLoading === 'principal' ? '#999' : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '13px', fontWeight: '700', cursor: webhookLoading === 'principal' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => enregistrerWebhook('principal')}
            >
              {webhookLoading === 'principal' ? '⏳ Enregistrement...' : '🔗 Enregistrer Webhook principal'}
            </button>
            {webhookStatut.principal && (
              <div style={{ fontSize: '11px', color: THEME.success, fontWeight: '600' }}>
                ✅ ID: {webhookStatut.principal.webhook_id} — {webhookStatut.principal.events?.length} events
              </div>
            )}
            <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
              Écoute: payment_intent.succeeded, charge.refunded, charge.dispute.*, charge.updated, payout.*
            </p>
          </div>

          {/* Bouton Webhook Connect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              disabled={webhookLoading === 'connect'}
              style={{ backgroundColor: webhookLoading === 'connect' ? '#999' : '#635bff', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '13px', fontWeight: '700', cursor: webhookLoading === 'connect' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => enregistrerWebhook('connect')}
            >
              {webhookLoading === 'connect' ? '⏳ Enregistrement...' : '🔗 Enregistrer Webhook Connect (vendeurs)'}
            </button>
            {webhookStatut.connect && (
              <div style={{ fontSize: '11px', color: THEME.success, fontWeight: '600' }}>
                ✅ ID: {webhookStatut.connect.webhook_id} — Connect activé
              </div>
            )}
            <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
              Écoute: account.updated, account.application.deauthorized, payout.paid, payout.failed — <strong>Events on Connected accounts</strong>
            </p>
          </div>

        </div>

        <NoteBox type="warning">
          ⚠️ <strong>Important :</strong> Le Signing Secret n'est affiché <strong>qu'une seule fois</strong> par Stripe lors de la création du webhook. Ce bouton le récupère et le sauvegarde automatiquement. Si tu cliques à nouveau, un nouveau webhook est créé avec un nouveau secret — pense à supprimer l'ancien dans le dashboard Stripe.
        </NoteBox>
      </div>

      <NoteBox type="info">
        📡 <strong>Webhooks Stripe :</strong> Les webhooks notifient e-Vend lors d'événements (paiement réussi, remboursement, litige, compte vendeur activé, etc.). Vous devez créer 2 endpoints dans votre <strong>Dashboard Stripe → Developers → Webhooks</strong> et copier leur Signing Secret ici.
      </NoteBox>

      <SectionTitle>🔐 Clés {config.sandbox ? 'de développement (Sandbox)' : 'de production'}</SectionTitle>

      <InputField label={config.sandbox ? 'Clé publique de développement (Publishable key)' : 'Clé publique de production (Publishable key)'}
        note="Dashboard Stripe → Developers → API keys → Publishable key"
        value={config.sandbox ? (config.dev_publish_key || '') : (config.prod_publish_key || '')}
        onChange={(v) => setConfig(config.sandbox ? 'dev_publish_key' : 'prod_publish_key', v)}
        placeholder={config.sandbox ? 'pk_test_...' : 'pk_live_...'} width="440px" />

      <InputField label={config.sandbox ? 'Clé secrète de développement (Secret key)' : 'Clé secrète de production (Secret key)'}
        note="Dashboard Stripe → Developers → API keys → Secret key"
        value={config.sandbox ? (config.dev_secret_key || '') : (config.prod_secret_key || '')}
        onChange={(v) => setConfig(config.sandbox ? 'dev_secret_key' : 'prod_secret_key', v)}
        placeholder={config.sandbox ? 'sk_test_...' : 'sk_live_...'} width="440px" showEye />

      <InputField label={config.sandbox ? 'Client ID de développement' : 'Client ID de production'}
        note="Dashboard Stripe → Connect → Settings → Client ID. Requis seulement si tu utilises OAuth (Standard accounts)."
        value={config.sandbox ? (config.dev_client_id || '') : (config.prod_client_id || '')}
        onChange={(v) => setConfig(config.sandbox ? 'dev_client_id' : 'prod_client_id', v)}
        placeholder="ca_..." width="440px" />

      <InputField
        label={config.sandbox ? 'Signing Secret — Webhook compte principal (développement)' : 'Signing Secret — Webhook compte principal (production)'}
        note="Endpoint POST /api/webhooks/stripe — Dashboard Stripe → Developers → Webhooks → Endpoint sur votre compte → Signing secret (whsec_...). Écoute: payment_intent.succeeded, charge.refunded, charge.dispute.*"
        value={config.sandbox ? (config.dev_webhook_secret || '') : (config.prod_webhook_secret || '')}
        onChange={(v) => setConfig(config.sandbox ? 'dev_webhook_secret' : 'prod_webhook_secret', v)}
        placeholder="whsec_..." width="440px" showEye />

      <InputField
        label={config.sandbox ? 'Signing Secret — Webhook Connect (comptes vendeurs) (développement)' : 'Signing Secret — Webhook Connect (comptes vendeurs) (production)'}
        note='Endpoint POST /api/webhooks/stripe — Dashboard Stripe → Developers → Webhooks → Endpoint Connect → cocher "Events on Connected accounts" → Signing secret. Écoute: account.updated, payout.paid, payout.failed'
        value={config.sandbox ? (config.dev_memb_webhook_secret || '') : (config.prod_memb_webhook_secret || '')}
        onChange={(v) => setConfig(config.sandbox ? 'dev_memb_webhook_secret' : 'prod_memb_webhook_secret', v)}
        placeholder="whsec_..." width="440px" showEye />

      {!config.sandbox && (
        <NoteBox type="success">
          ✅ <strong>Mode Production activé</strong> — Les vrais paiements seront traités. Assurez-vous que toutes les clés de production sont correctes avant d'activer. Testez d'abord en sandbox.
        </NoteBox>
      )}

      <div style={{ marginTop: '32px' }}>
        <button onClick={handleSave}
          style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Enregistré!' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── Page principale ConfigurationStripe ───────────────────────────────────────
export default function ConfigurationStripe({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [onglet, setOnglet] = useState<'paiement' | 'vendeur' | 'credentials'>('paiement');
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

  // Charger la configuration Stripe
  const chargerConfiguration = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/stripe', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erreur chargement config Stripe:', error);
      showToast('Erreur lors du chargement de la configuration Stripe', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Charger les vendeurs Stripe Connect
  const chargerVendeurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/stripe/vendeurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendeurs(data);
      }
    } catch (error) {
      console.error('Erreur chargement vendeurs Stripe:', error);
    }
  };

  // Sauvegarder la configuration
  const sauvegarderConfiguration = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        showToast('Configuration Stripe sauvegardée avec succès!', 'success');
        await chargerConfiguration();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde Stripe:', error);
      showToast('Erreur lors de la sauvegarde de la configuration Stripe', 'danger');
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
      prev.map(v => v.vendeur_id === vendeurId ? { ...v, stripe_account_status: newStatus } : v)
    );
    showToast(`Statut du vendeur mis à jour`, 'success');
  };

  useEffect(() => {
    chargerConfiguration();
    chargerVendeurs();
  }, []);

  const onglets = [
    { id: 'paiement',    label: 'Configuration paiement Stripe' },
    { id: 'vendeur',     label: 'Configuration Stripe vendeur' },
    { id: 'credentials', label: 'Credentials' },
  ] as const;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration Stripe...</p>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            💳 Configuration Stripe
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Configurez les détails de l'application Stripe Connect.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ backgroundColor: THEME.danger, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            DÉSACTIVER
          </button>
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

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', borderBottom: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc' }}>
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: '14px 24px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: onglet === o.id ? '700' : '500', color: onglet === o.id ? THEME.accent : THEME.textLight, cursor: 'pointer', borderBottom: onglet === o.id ? `3px solid ${THEME.accent}` : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === 'paiement'    && <OngletPaiement config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} />}
        {onglet === 'vendeur'     && <OngletVendeur config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} />}
        {onglet === 'credentials' && <OngletCredentials config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} />}
      </div>
    </div>
  );
}
