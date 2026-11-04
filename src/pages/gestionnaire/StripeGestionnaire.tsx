// 📁 CHEMIN : src/pages/gestionnaire/StripeGestionnaire.tsx
import React, { useState, useEffect } from 'react';

const THEME = {
  accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', card: '#ffffff',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: THEME.text,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
};

const METHODES_DEFAUT: Record<string, boolean> = {
  Cards: true, iDEAL: false, 'Payment Request Button (Apple Pay, Google Pay)': true,
  Sofort: false, Bancontact: false, EPS: false, FPX: false, giropay: false,
  Przelewy24: false, alipay: false, GrabPay: false, 'AfterPay/ClearPay': false,
  'Sepa Debit': false,
};

// ── Petits composants (inline, pas de fichier helper) ────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: value ? '#0d9488' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

function ToggleRow({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ flex: 1, paddingRight: 40 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, margin: '0 0 2px' }}>{label}</p>
        {note && <p style={{ fontSize: 12, color: THEME.textLight, margin: 0, lineHeight: 1.5 }}>{note}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '32px 0 20px', paddingBottom: 10, borderBottom: `2px solid ${THEME.accent}` }}>
      {children}
    </h3>
  );
}

function NoteBox({ children, type = 'warning' }: { children: React.ReactNode; type?: 'warning' | 'info' | 'success' }) {
  const c = {
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  }[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: c.text, margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
}

function SelectField({ label, note, value, onChange, options, width = '340px' }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; width?: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width, padding: '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, background: '#fff', cursor: 'pointer', outline: 'none' }}>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      {note && <p style={{ fontSize: 12, color: THEME.textLight, margin: '6px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function InputField({ label, note, value, onChange, placeholder, type = 'text', width = '340px', secret = false, suffix }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; width?: string; secret?: boolean; suffix?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input type={secret && !show ? 'password' : type} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} autoComplete="off"
            style={{ width, padding: secret ? '10px 42px 10px 14px' : '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: secret ? 'monospace' : 'inherit' }} />
          {secret && (
            <button type="button" onClick={() => setShow(!show)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0 }}>
              {show ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {suffix && <span style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600, whiteSpace: 'nowrap' }}>{suffix}</span>}
      </div>
      {note && <p style={{ fontSize: 12, color: THEME.textLight, margin: '6px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginRight: 20, marginBottom: 10, fontSize: 13, color: THEME.text, fontWeight: checked ? 600 : 400 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: THEME.accent, cursor: 'pointer' }} />
      {label}
    </label>
  );
}

function Badge({ ok, okLabel, koLabel }: { ok: boolean; okLabel: string; koLabel: string }) {
  const color = ok ? THEME.success : THEME.warning;
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {ok ? '✅ ' + okLabel : '⚠️ ' + koLabel}
    </span>
  );
}

function BoutonEnregistrer({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div style={{ marginTop: 32 }}>
      <button onClick={onClick} disabled={saving}
        style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? '💾 Sauvegarde...' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}

// ── Popup collaborateurs connectés ───────────────────────────────────────────
function PopupCollaborateurs({ collaborateurs, onClose }: { collaborateurs: any[]; onClose: () => void }) {
  const [recherche, setRecherche] = useState('');
  const r = recherche.toLowerCase();
  const filtres = collaborateurs.filter(c =>
    (c.nom || '').toLowerCase().includes(r) ||
    (c.email || '').toLowerCase().includes(r) ||
    (c.stripe_account_id || '').toLowerCase().includes(r)
  );
  const statutColor = (s: string) => s === 'active' ? THEME.success : s === 'suspended' ? THEME.danger : s === 'pending' ? THEME.warning : THEME.textLight;
  const th: React.CSSProperties = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', borderBottom: `2px solid ${THEME.border}` };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 900, maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #3b82c4 100%)', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>💳 Collaborateurs connectés à Stripe</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0', fontSize: 13 }}>
              {filtres.length} compte{filtres.length !== 1 ? 's' : ''} Stripe Connect
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', width: 36, height: 36, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${THEME.border}`, background: '#f8fafc', flexShrink: 0 }}>
          <input type="text" placeholder="🔍 Rechercher par nom, courriel ou ID Stripe..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ width: '100%', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f4f8', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={th}>Collaborateur</th>
                <th style={th}>Courriel</th>
                <th style={th}>ID Stripe Connect</th>
                <th style={th}>Type</th>
                <th style={th}>Statut</th>
                <th style={th}>Connecté le</th>
                <th style={{ ...th, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: THEME.textLight }}>Aucun collaborateur trouvé</td></tr>
              ) : filtres.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: THEME.text }}>{c.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: THEME.textLight }}>{c.email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {c.stripe_account_id
                      ? <code style={{ fontSize: 11, background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, color: '#1e40af', fontFamily: 'monospace' }}>{c.stripe_account_id}</code>
                      : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: THEME.text }}>{c.account_type || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${THEME.border}`, fontSize: 12, fontWeight: 600, background: statutColor(c.statut) + '10', color: statutColor(c.statut) }}>
                      {c.statut === 'active' ? 'Actif' : c.statut === 'pending' ? 'En attente' : (c.statut || 'Inconnu')}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: THEME.textLight }}>{c.connected_at ? new Date(c.connected_at).toLocaleDateString('fr-CA') : '—'}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                    {c.stripe_account_id && (
                      <a href={`https://dashboard.stripe.com/connect/accounts/${c.stripe_account_id}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: THEME.accent, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Voir Stripe →</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: THEME.textLight, margin: 0 }}>Les comptes Stripe Connect sont gérés directement dans ton dashboard Stripe.</p>
          <a href="https://dashboard.stripe.com/connect/accounts/overview" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: THEME.accent, fontWeight: 700, textDecoration: 'none' }}>Ouvrir Stripe Dashboard →</a>
        </div>
      </div>
    </div>
  );
}

// ── Props partagées par les sous-onglets ─────────────────────────────────────
interface OngletProps {
  pv: (k: string, def?: any) => any;          // lire un paramètre (JSON "parametres")
  setPar: (k: string, v: any) => void;        // modifier un paramètre
  saving: boolean;
  onSave: () => void;
}

// ── SOUS-ONGLET 1 : Configuration paiement Stripe ────────────────────────────
function OngletPaiement({ pv, setPar, saving, onSave }: OngletProps) {
  const utiliserPour = pv('use_stripe_for', 'STRIPE PAYMENT METHOD');
  const appliquerPour = pv('use_stripe_for_who', 'BOTH');
  const methodes: Record<string, boolean> = pv('payment_methods', METHODES_DEFAUT);

  const selUtiliserPour = (
    <SelectField label="Utiliser Stripe pour" value={utiliserPour} onChange={v => setPar('use_stripe_for', v)}
      options={[
        { val: 'STRIPE PAYMENT METHOD', label: 'STRIPE PAYMENT METHOD' },
        { val: 'STRIPE PAYOUT',         label: 'STRIPE PAYOUT' },
        { val: 'STRIPE TRANSFER',       label: 'STRIPE TRANSFER' },
      ]} />
  );
  const selAppliquerPour = (
    <SelectField label="Appliquer Stripe pour" value={appliquerPour} onChange={v => setPar('use_stripe_for_who', v)}
      options={[
        { val: 'BOTH',       label: 'BOTH' },
        { val: 'CHECKOUT',   label: 'CHECKOUT' },
        { val: 'MEMBERSHIP', label: 'MEMBERSHIP' },
      ]} />
  );

  // ── Mode Payout / Transfer ──
  if (utiliserPour === 'STRIPE PAYOUT' || utiliserPour === 'STRIPE TRANSFER') {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900 }}>
        <SectionTitle>⚙️ Paramètres {utiliserPour === 'STRIPE PAYOUT' ? 'Payout' : 'Transfer'}</SectionTitle>
        {selUtiliserPour}
        {selAppliquerPour}
        <ToggleRow label="Envoyer la description avec le virement Stripe"
          note="Si activé, une description sera incluse dans le virement Stripe."
          value={pv('send_description', false)} onChange={v => setPar('send_description', v)} />
        <ToggleRow label="Versement automatique au collaborateur (Autopay)"
          note="Si activé, le gain total du collaborateur sera automatiquement versé après le statut de commande sélectionné."
          value={pv('autopay', false)} onChange={v => setPar('autopay', v)} />
        <div style={{ marginTop: 20 }}>
          <SelectField label="Type de méthode de paiement pour le transfert" value={pv('transfer_method', 'All payment methods')} onChange={v => setPar('transfer_method', v)}
            options={[
              { val: 'All payment methods', label: 'All payment methods' },
              { val: 'Stripe only',         label: 'Stripe only' },
            ]} />
        </div>
        <BoutonEnregistrer saving={saving} onClick={onSave} />
      </div>
    );
  }

  const autoCancel = pv('auto_cancel', true);
  const rappel = pv('reminder_enabled', true);
  const delaiActif = pv('delai_actif', false);
  const flux = pv('payment_flow', 'redirect');

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>

      <SectionTitle>⚙️ Paramètres généraux</SectionTitle>
      {selUtiliserPour}
      {selAppliquerPour}

      <SelectField label="Obtenir les détails de carte client sur" value={pv('card_details_on', 'THANK YOU PAGE')} onChange={v => setPar('card_details_on', v)}
        options={[{ val: 'THANK YOU PAGE', label: 'THANK YOU PAGE' }]} />

      <InputField label="Libellé sur le relevé bancaire (Statement Descriptor)"
        note="Texte affiché sur le relevé bancaire du client — requis par Stripe (max 22 caractères, sans caractères spéciaux)."
        value={pv('statement_desc', '')} onChange={v => setPar('statement_desc', v)} placeholder="Ma Marketplace" width="280px" />

      <ToggleRow label="Restreindre l'accès collaborateur aux commandes non payées"
        note="Empêche le collaborateur de voir la commande si le client n'a pas encore payé."
        value={pv('restrict_seller', false)} onChange={v => setPar('restrict_seller', v)} />

      <ToggleRow label="Annulation automatique de la commande"
        note="Annule automatiquement la commande si le client n'a pas payé dans le délai imparti."
        value={autoCancel} onChange={v => setPar('auto_cancel', v)} />

      {autoCancel && (
        <div style={{ marginTop: 16 }}>
          <InputField label="Délai d'annulation" note="Nombre d'heures avant l'annulation automatique."
            value={String(pv('cancel_hour', '24'))} onChange={v => setPar('cancel_hour', v)} type="number" width="100px" suffix="heures" />
        </div>
      )}

      <SectionTitle>💳 Flux de paiement</SectionTitle>

      <div style={{ marginBottom: 28 }}>
        <label style={{ ...LABEL_STYLE, marginBottom: 12 }}>Flux de paiement</label>
        {[
          { val: 'redirect', label: 'Rediriger vers la page Stripe' },
          { val: 'same',     label: 'Paiement sur la même page' },
        ].map(opt => (
          <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: THEME.text }}>
            <input type="radio" name="paymentFlow" checked={flux === opt.val}
              onChange={() => setPar('payment_flow', opt.val)} style={{ accentColor: THEME.accent, width: 16, height: 16 }} />
            {opt.label}
          </label>
        ))}
        <NoteBox>
          <strong>Rediriger vers la page Stripe :</strong> Le client est redirigé vers Stripe pour entrer ses informations de paiement, puis revient sur la page de confirmation.<br />
          <strong>Paiement sur la même page :</strong> Les informations de paiement apparaissent en popup sur la page de confirmation.
        </NoteBox>
      </div>

      {flux === 'same' && (
        <div style={{ marginBottom: 28 }}>
          <label style={{ ...LABEL_STYLE, marginBottom: 12 }}>Méthodes de paiement acceptées</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.keys(METHODES_DEFAUT).map(m => (
              <CheckboxRow key={m} label={m} checked={!!methodes[m]}
                onChange={v => setPar('payment_methods', { ...METHODES_DEFAUT, ...methodes, [m]: v })} />
            ))}
          </div>
        </div>
      )}

      <InputField label="Code de pays ISO" note="Le code pays à deux lettres de ton compte Stripe (ex : CA, US, FR)."
        value={pv('country_code', 'CA')} onChange={v => setPar('country_code', v)} placeholder="CA" width="120px" />
      <InputField label="Description du paiement" note="Description visible par le client lors du paiement (max 200 caractères)."
        value={pv('description', '')} onChange={v => setPar('description', v)} />

      <SectionTitle>🔧 Méthode de traitement</SectionTitle>

      <div style={{ marginBottom: 24 }}>
        <label style={{ ...LABEL_STYLE, marginBottom: 12 }}>Méthode de traitement des paiements</label>
        {[
          { val: 'DIRECT CHARGES',      label: 'Direct Charges' },
          { val: 'DESTINATION CHARGES', label: 'Destination Charges' },
        ].map(opt => (
          <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: THEME.text }}>
            <input type="radio" name="processingMethod" checked={pv('processing_method', 'DIRECT CHARGES') === opt.val}
              onChange={() => setPar('processing_method', opt.val)} style={{ accentColor: THEME.accent, width: 16, height: 16 }} />
            {opt.label}
          </label>
        ))}
      </div>

      <NoteBox>
        <strong>Separate Charges &amp; Transfer :</strong> Tu reçois le montant total, puis tu transfères les gains au collaborateur. Fonctionne uniquement si les deux comptes sont dans la même région.<br /><br />
        <strong>Destination Charges :</strong> Les frais de traitement Stripe sont à ta charge (gestionnaire) uniquement et ta commission est ajoutée aux frais d'application.<br /><br />
        <strong>Direct Charges :</strong> Les frais de traitement Stripe sont à la charge du collaborateur uniquement et ta commission est ajoutée aux frais d'application.
      </NoteBox>

      <SelectField label="Frais Stripe pris en charge par" value={pv('stripe_fee_bear', 'Seller')} onChange={v => setPar('stripe_fee_bear', v)}
        options={[
          { val: 'Seller', label: 'Collaborateur' },
          { val: 'Admin',  label: 'Gestionnaire (moi)' },
        ]} />

      <SectionTitle>📧 Rappels de paiement</SectionTitle>

      <InputField label="Nom du paiement Stripe" note="Nom affiché pour ce mode de paiement dans la boutique."
        value={pv('payment_name', '')} onChange={v => setPar('payment_name', v)} />

      <ToggleRow label="Rappel de paiement commande Stripe"
        note="Envoie un rappel de paiement en attente au client par courriel."
        value={rappel} onChange={v => setPar('reminder_enabled', v)} />

      {rappel && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <InputField label="Heure d'envoi du rappel" note="Délai après lequel le rappel est envoyé."
            value={String(pv('reminder_time', '6'))} onChange={v => setPar('reminder_time', v)} type="number" suffix="heures" width="100px" />
          <InputField label="Nombre de jours de rappel" note="Durée pendant laquelle les rappels seront envoyés."
            value={String(pv('reminder_days', '1'))} onChange={v => setPar('reminder_days', v)} type="number" suffix="jours" width="100px" />
        </div>
      )}

      <SectionTitle>⏱️ Délai de versement Stripe au collaborateur</SectionTitle>

      <NoteBox type="info">
        💡 <strong>Délai propre à Stripe :</strong> Stripe impose déjà un minimum de 2 jours ouvrables avant tout transfert. Le délai configuré ici s'ajoute à ce délai Stripe standard, ce qui te permet de gérer remboursements et litiges avant versement.
      </NoteBox>

      <ToggleRow label="Activer le versement automatique (Autopay)"
        note="Si activé, Stripe verse automatiquement les gains du collaborateur selon le délai configuré ci-dessous. Si désactivé, les versements sont manuels — tu dois les déclencher toi-même via l'API Stripe."
        value={delaiActif} onChange={v => setPar('delai_actif', v)} />

      {delaiActif && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 24, marginTop: 16 }}>
          <SelectField label="Déclencher le versement après le statut"
            note="Le compte à rebours démarre une fois ce statut de commande atteint."
            value={pv('delai_statut', 'commande_livree')} onChange={v => setPar('delai_statut', v)}
            options={[
              { val: 'commande_payee',    label: 'Commande payée' },
              { val: 'commande_expediee', label: 'Commande expédiée' },
              { val: 'commande_livree',   label: 'Commande livrée' },
              { val: 'delai_retour',      label: 'Après délai de retour expiré' },
            ]} />

          <NoteBox type="info">
            💡 <strong>Comment ça fonctionne avec Stripe :</strong> Quand activé, le compte Stripe du collaborateur est configuré en payout <code>daily</code> avec un délai de <strong>{pv('delai_jours', '3')} jours ouvrables</strong>. Stripe verse automatiquement chaque jour les transactions qui ont atteint ce délai.
          </NoteBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <InputField label="Délai avant versement (delay_days Stripe)"
              note="Minimum 2 jours (limite Stripe). Recommandé : 3 à 7 jours pour gérer les litiges. Correspond au paramètre delay_days de l'API Stripe."
              value={String(pv('delai_jours', '3'))} onChange={v => setPar('delai_jours', v)} type="number" suffix="jours ouvrables" width="100px" />
            <InputField label="Montant minimum de versement"
              note="Stripe ne transfère pas les montants inférieurs à ce seuil."
              value={String(pv('delai_min_montant', '5.00'))} onChange={v => setPar('delai_min_montant', v)} type="number" suffix="$" width="100px" />
          </div>

          <ToggleRow label="Notifier le collaborateur lors du versement"
            note="Envoie un courriel au collaborateur à chaque versement Stripe effectué."
            value={pv('notif_versement', true)} onChange={v => setPar('notif_versement', v)} />

          <div style={{ marginTop: 16 }}>
            <NoteBox type="success">
              ✅ <strong>Conformité Stripe Connect :</strong> Les transferts doivent être effectués en devise supportée (CAD, USD…). Le compte Stripe du collaborateur doit être activé et vérifié. Stripe conserve un historique de tous les transferts dans ton dashboard Connect.
            </NoteBox>
          </div>
        </div>
      )}

      <BoutonEnregistrer saving={saving} onClick={onSave} />
    </div>
  );
}

// ── SOUS-ONGLET 2 : Configuration Stripe collaborateur ───────────────────────
function OngletCollaborateur({ pv, setPar, saving, onSave, accountType, setAccountType }: OngletProps & { accountType: string; setAccountType: (v: string) => void }) {
  const code = (txt: string, bg: string, color: string) => (
    <code style={{ fontSize: 11, background: bg, padding: '2px 7px', borderRadius: 4, color, fontFamily: 'monospace' }}>{txt}</code>
  );

  const valeurs = accountType === 'standard'
    ? [
        { prop: 'losses.payments',        val: 'stripe',      desc: 'Stripe est responsable des pertes' },
        { prop: 'fees.payer',             val: 'account',     desc: 'Stripe collecte les frais directement auprès du collaborateur' },
        { prop: 'stripe_dashboard.type',  val: 'full',        desc: 'Le collaborateur accède au dashboard Stripe complet' },
        { prop: 'requirement_collection', val: 'stripe',      desc: 'Stripe gère la collecte des documents KYC' },
      ]
    : [
        { prop: 'losses.payments',        val: 'application', desc: 'Toi (la plateforme) es responsable des pertes' },
        { prop: 'fees.payer',             val: 'application', desc: 'La plateforme paie les frais Stripe (Stripe retourne application_express en réponse, mais application est la valeur à envoyer à la création)' },
        { prop: 'stripe_dashboard.type',  val: 'express',     desc: 'Le collaborateur accède au dashboard Express simplifié (pas le full dashboard)' },
        { prop: 'requirement_collection', val: 'stripe',      desc: 'Stripe gère la collecte des documents KYC' },
      ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <SectionTitle>🏪 Configuration du compte Stripe collaborateur</SectionTitle>

      <div style={{ marginBottom: 28 }}>
        <label style={{ ...LABEL_STYLE, marginBottom: 12 }}>Type de compte Stripe collaborateur</label>
        {[
          { v: 'standard', l: 'STANDARD' },
          { v: 'express',  l: 'EXPRESS' },
          { v: 'custom',   l: 'CUSTOM' },
        ].map(t => (
          <label key={t.v} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginRight: 24, fontSize: 14, color: THEME.text, fontWeight: accountType === t.v ? 700 : 400 }}>
            <input type="radio" name="accountType" checked={accountType === t.v}
              onChange={() => setAccountType(t.v)} style={{ accentColor: THEME.accent, width: 16, height: 16 }} />
            {t.l}
          </label>
        ))}
        <div style={{ marginTop: 14 }}>
          <NoteBox type="info">
            <strong>STANDARD :</strong> Le collaborateur possède un compte Stripe complet et gère lui-même ses paramètres. Idéal pour les collaborateurs expérimentés.<br />
            <strong>EXPRESS :</strong> Stripe gère l'interface du collaborateur. L'onboarding est simplifié — recommandé pour la majorité des collaborateurs.<br />
            <strong>CUSTOM :</strong> Compte entièrement contrôlé par toi. Invisible pour le collaborateur. Nécessite une intégration plus poussée.
          </NoteBox>
        </div>
      </div>

      {/* Propriétés Controller */}
      <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>⚙️ Propriétés Controller</p>
        <p style={{ fontSize: 12, color: THEME.textLight, margin: '0 0 18px' }}>
          {accountType === 'custom'
            ? 'Configure le comportement du compte Custom selon tes besoins.'
            : `Valeurs appliquées automatiquement par Stripe pour un compte ${accountType.toUpperCase()}.`}
        </p>

        {accountType !== 'custom' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#e8f2fb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: THEME.text, fontWeight: 700 }}>Propriété</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: THEME.text, fontWeight: 700 }}>Valeur</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: THEME.text, fontWeight: 700 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {valeurs.map((row, i) => (
                <tr key={row.prop} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '10px 12px' }}>{code(row.prop, '#e8f2fb', THEME.accent)}</td>
                  <td style={{ padding: '10px 12px' }}>{code(row.val, '#f0fdf4', '#16a34a')}</td>
                  <td style={{ padding: '10px 12px', color: THEME.textLight }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {accountType === 'custom' && (
          <>
            <SelectField label="Responsabilité des pertes (losses.payments)"
              note="stripe = Stripe couvre les pertes. application = ta plateforme est responsable. Pour CUSTOM : application."
              value={pv('controller_losses', 'application')} onChange={v => setPar('controller_losses', v)} width="420px"
              options={[
                { val: 'stripe',      label: 'stripe — Stripe est responsable des pertes' },
                { val: 'application', label: 'application — La plateforme est responsable (défaut Custom)' },
              ]} />
            <SelectField label="Qui paie les frais Stripe (fees.payer)"
              note="account = le collaborateur paie les frais Stripe directement. application = la plateforme paie les frais. Note : Stripe retourne 'application_custom' en réponse mais la valeur à configurer est 'application'."
              value={pv('controller_fees_payer', 'application') === 'application_custom' ? 'application' : pv('controller_fees_payer', 'application')}
              onChange={v => setPar('controller_fees_payer', v)} width="420px"
              options={[
                { val: 'application', label: 'application — La plateforme paie les frais (défaut Custom)' },
                { val: 'account',     label: 'account — Le collaborateur paie les frais Stripe' },
              ]} />
            <SelectField label="Type de dashboard collaborateur (stripe_dashboard.type)"
              note="none = aucun accès dashboard Stripe (défaut Custom). express = dashboard simplifié. full = dashboard complet."
              value={pv('controller_dashboard', 'none')} onChange={v => setPar('controller_dashboard', v)} width="420px"
              options={[
                { val: 'none',    label: 'none — Aucun accès au dashboard Stripe (défaut Custom)' },
                { val: 'express', label: 'express — Dashboard simplifié' },
                { val: 'full',    label: 'full — Dashboard Stripe complet' },
              ]} />
            <SelectField label="Collecte des exigences (requirement_collection)"
              note="application = ta plateforme collecte les infos KYC (défaut Custom). stripe = Stripe collecte."
              value={pv('controller_requirements', 'application')} onChange={v => setPar('controller_requirements', v)} width="420px"
              options={[
                { val: 'application', label: 'application — La plateforme collecte les documents (défaut Custom)' },
                { val: 'stripe',      label: 'stripe — Stripe gère la collecte des documents' },
              ]} />
            <NoteBox type="warning">
              ⚠️ Ces paramètres correspondent aux propriétés <code>controller</code> de l'API Stripe. Une mauvaise configuration peut bloquer les paiements des collaborateurs. Consulte la <a href="https://docs.stripe.com/connect/migrate-to-controller-properties" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>documentation Stripe</a> avant de modifier.
            </NoteBox>
          </>
        )}
      </div>

      <SelectField label="Flux de connexion du compte collaborateur" value={pv('connect_flow', 'Connect via API')} onChange={v => setPar('connect_flow', v)}
        options={[
          { val: 'Connect via API',   label: 'Connect via API' },
          { val: 'Connect via OAuth', label: 'Connect via OAuth' },
        ]} />

      <NoteBox>
        <strong>Connect via API :</strong> Studio crée le compte Stripe du collaborateur programmatiquement et lui envoie un lien d'activation.<br />
        <strong>Connect via OAuth :</strong> Le collaborateur se connecte lui-même en autorisant ta plateforme depuis son compte Stripe existant.
      </NoteBox>

      <SectionTitle>🔧 Options du compte collaborateur</SectionTitle>

      <ToggleRow label="Full Service Agreement (Accord de service complet)"
        note="Ta plateforme accepte les conditions de service Stripe Connect au nom du collaborateur. Requis dans certaines régions."
        value={pv('full_service', true)} onChange={v => setPar('full_service', v)} />
      <ToggleRow label="Cross-border Payouts (Versements transfrontaliers)"
        note="Autorise les versements vers des comptes bancaires dans d'autres pays. Des frais Stripe supplémentaires s'appliquent."
        value={pv('cross_border', false)} onChange={v => setPar('cross_border', v)} />
      <ToggleRow label="Debit Negative Balance (Débit solde négatif)"
        note="Si le solde du collaborateur est négatif (ex : remboursement), Stripe débitera automatiquement son compte bancaire."
        value={pv('debit_negative', true)} onChange={v => setPar('debit_negative', v)} />
      <ToggleRow label="Définir un délai de versement personnalisé"
        note="Permet de configurer un calendrier de versement spécifique pour les collaborateurs (quotidien, hebdomadaire, mensuel)."
        value={pv('payout_time', true)} onChange={v => setPar('payout_time', v)} />

      <BoutonEnregistrer saving={saving} onClick={onSave} />
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function StripeGestionnaire(_props: { gestionnaireId?: number }) {
  // Même authentification que les autres pages gestionnaire (token + cookie)
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [onglet, setOnglet] = useState<'paiement' | 'collaborateur' | 'credentials'>('paiement');
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState<'principal' | 'connect' | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  // Config reçue du serveur (JAMAIS de clé secrète en clair — seulement masquée)
  const [cfg, setCfg] = useState<any>({});
  // Valeurs modifiées (les clés secrètes restent vides = inchangées)
  const [form, setForm] = useState<any>({});
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const val = (k: string, def: any = '') => (form[k] !== undefined ? form[k] : (cfg[k] ?? def));

  // Paramètres détaillés (stockés en un seul objet JSON "parametres")
  const parServeur = cfg.parametres || {};
  const pv = (k: string, def: any = '') => {
    const fusion = { ...parServeur, ...(form.parametres || {}) };
    return fusion[k] !== undefined && fusion[k] !== null ? fusion[k] : def;
  };
  const setPar = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, parametres: { ...parServeur, ...(p.parametres || {}), [k]: v } }));

  const charger = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/gestionnaire/stripe', { credentials: 'include', headers: auth });
      if (r.ok) { setCfg(await r.json()); setForm({}); }
      const r2 = await fetch('/api/gestionnaire/stripe/collaborateurs', { credentials: 'include', headers: auth });
      if (r2.ok) setCollaborateurs(await r2.json());
    } catch (e) {
      showToast('Erreur de chargement de la configuration Stripe', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const sandbox: boolean = val('sandbox', true);
  const env = sandbox ? 'dev' : 'prod';
  const cleSecreteEnregistree = !!cfg[`${env}_secret_key_masque`];
  const aDesModifs = Object.keys(form).length > 0;

  const sauvegarder = async (silencieux = false): Promise<boolean> => {
    setSaving(true);
    try {
      const r = await fetch('/api/gestionnaire/stripe', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Erreur de sauvegarde');
      if (!silencieux) showToast('Configuration Stripe sauvegardée', 'success');
      await charger();
      return true;
    } catch (e: any) {
      showToast(e.message, 'danger');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const tester = async () => {
    setTesting(true);
    try {
      if (aDesModifs && !(await sauvegarder(true))) return;
      const r = await fetch('/api/gestionnaire/stripe/tester', { method: 'POST', credentials: 'include', headers: auth });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Connexion Stripe impossible');
      showToast(`Connexion OK — compte ${data.account_id || ''}${data.connect_actif ? ' (Connect actif)' : ' (Connect non activé)'}`, data.connect_actif ? 'success' : 'danger');
      await charger();
    } catch (e: any) {
      showToast(e.message, 'danger');
    } finally {
      setTesting(false);
    }
  };

  const enregistrerWebhook = async (type: 'principal' | 'connect') => {
    setWebhookLoading(type);
    try {
      if (aDesModifs && !(await sauvegarder(true))) return;
      const r = await fetch('/api/gestionnaire/stripe/webhook/register', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ type }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Erreur enregistrement webhook');
      showToast(type === 'principal' ? 'Webhook principal enregistré' : 'Webhook Connect enregistré', 'success');
      await charger();
    } catch (e: any) {
      showToast(e.message, 'danger');
    } finally {
      setWebhookLoading(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement de la configuration Stripe...</div>;
  }

  const wh = (cfg.webhooks && cfg.webhooks[env]) || {};
  const btn = (bg: string, disabled: boolean): React.CSSProperties => ({
    backgroundColor: disabled ? '#999' : bg, color: 'white', border: 'none', borderRadius: 8,
    padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  });
  const pasDeCle = !cleSecreteEnregistree && !form[`${env}_secret_key`];

  const onglets = [
    { id: 'paiement',      label: 'Configuration paiement Stripe' },
    { id: 'collaborateur', label: 'Configuration Stripe collaborateur' },
    { id: 'credentials',   label: 'Identifiants' },
  ] as const;

  const propsOnglet: OngletProps = { pv, setPar, saving, onSave: () => { sauvegarder(); } };

  return (
    <div style={{ maxWidth: 1100 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {showPopup && <PopupCollaborateurs collaborateurs={collaborateurs} onClose={() => setShowPopup(false)} />}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💳 Configuration Stripe</h1>
          <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Connecte ton propre compte Stripe Connect pour que tes collaborateurs y lient le leur.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={tester} disabled={testing || pasDeCle} style={btn(THEME.accent, testing || pasDeCle)}>
            {testing ? '⏳ Test...' : '🔍 Tester la connexion'}
          </button>
          <button onClick={() => setShowPopup(true)} style={btn(THEME.accent, false)}>
            👥 COLLABORATEURS CONNECTÉS ({collaborateurs.length})
          </button>
          <button onClick={() => sauvegarder()} disabled={saving || !aDesModifs} style={btn(THEME.success, saving || !aDesModifs)}>
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', borderBottom: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc', overflowX: 'auto' }}>
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: '14px 24px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: onglet === o.id ? 700 : 500, color: onglet === o.id ? THEME.accent : THEME.textLight, cursor: 'pointer', borderBottom: onglet === o.id ? `3px solid ${THEME.accent}` : '3px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === 'paiement' && <OngletPaiement {...propsOnglet} />}

        {onglet === 'collaborateur' && (
          <OngletCollaborateur {...propsOnglet}
            accountType={val('account_type', 'express')}
            setAccountType={v => set('account_type', v)} />
        )}

        {onglet === 'credentials' && (
          <div style={{ padding: '28px 32px', maxWidth: 900 }}>

            {/* Statut */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Badge ok={cleSecreteEnregistree} okLabel="Clés enregistrées" koLabel="Clés manquantes" />
              <Badge ok={!!cfg.connect_actif} okLabel="Connect actif" koLabel="Connect non vérifié" />
              <Badge ok={!!wh.principal} okLabel="Webhook principal" koLabel="Webhook principal absent" />
              <Badge ok={!!wh.connect} okLabel="Webhook Connect" koLabel="Webhook Connect absent" />
            </div>

            <SectionTitle>🔑 Identifiants Stripe</SectionTitle>

            <ToggleRow label="Environnement Sandbox (mode test)"
              note="Si activé, les requêtes sont dirigées vers l'environnement de test Stripe. Désactive-le pour passer en production, seulement quand tes clés de production sont enregistrées."
              value={sandbox} onChange={v => set('sandbox', v)} />

            <div style={{ marginTop: 20 }}>
              {sandbox
                ? <NoteBox type="warning">⚠️ Mode Sandbox activé — Aucun vrai paiement ne sera traité. Utilise les clés de test Stripe (préfixe pk_test_ / sk_test_).</NoteBox>
                : <NoteBox type="success">✅ <strong>Mode Production activé</strong> — Les vrais paiements seront traités. Assure-toi que toutes les clés de production sont correctes. Teste d'abord en sandbox.</NoteBox>}
            </div>

            <SectionTitle>🔐 Clés {sandbox ? 'de développement (Sandbox)' : 'de production'}</SectionTitle>

            <InputField label={sandbox ? 'Clé publique de développement (Publishable key)' : 'Clé publique de production (Publishable key)'}
              note="Dashboard Stripe → Developers → API keys → Publishable key"
              value={val(`${env}_publish_key`)} onChange={v => set(`${env}_publish_key`, v.trim())}
              placeholder={sandbox ? 'pk_test_...' : 'pk_live_...'} width="440px" />

            <InputField label={sandbox ? 'Clé secrète de développement (Secret key)' : 'Clé secrète de production (Secret key)'}
              note={cleSecreteEnregistree
                ? `🔒 Clé enregistrée et chiffrée : ${cfg[`${env}_secret_key_masque`]}. Laisse vide pour la conserver, ou colle une nouvelle clé pour la remplacer.`
                : "Dashboard Stripe → Developers → API keys → Secret key. Elle sera chiffrée avant d'être enregistrée."}
              value={form[`${env}_secret_key`] || ''} onChange={v => set(`${env}_secret_key`, v.trim())}
              placeholder={cleSecreteEnregistree ? '•••••••• (inchangée)' : (sandbox ? 'sk_test_...' : 'sk_live_...')} width="440px" secret />

            <InputField label={sandbox ? 'Client ID de développement' : 'Client ID de production'}
              note="Dashboard Stripe → Connect → Settings → Client ID. Requis seulement si tu utilises OAuth (comptes Standard)."
              value={val(`${env}_client_id`)} onChange={v => set(`${env}_client_id`, v.trim())} placeholder="ca_..." width="440px" />

            <SectionTitle>⚡ Webhooks (automatiques)</SectionTitle>

            <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
              Clique pour enregistrer l'endpoint directement sur ton compte Stripe. Le <strong>Signing Secret</strong> est récupéré et sauvegardé automatiquement (chiffré) — tu n'as pas besoin d'aller dans le dashboard Stripe. Enregistre d'abord tes clés.
            </p>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <button onClick={() => enregistrerWebhook('principal')} disabled={webhookLoading !== null || pasDeCle}
                    style={btn(THEME.accent, webhookLoading !== null || pasDeCle)}>
                    {webhookLoading === 'principal' ? '⏳ Enregistrement...' : '🔗 Enregistrer Webhook principal'}
                  </button>
                </div>
                {wh.principal && <div style={{ fontSize: 11, color: THEME.success, fontWeight: 600 }}>✅ Webhook principal enregistré</div>}
                <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
                  Écoute : payment_intent.succeeded, charge.refunded, charge.dispute.*, charge.updated, payout.*
                </p>
                {cfg.webhook_urls?.principal && <p style={{ fontSize: 11, color: THEME.textLight, margin: 0, wordBreak: 'break-all' }}>URL : <code>{cfg.webhook_urls.principal}</code></p>}
              </div>

              <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <button onClick={() => enregistrerWebhook('connect')} disabled={webhookLoading !== null || pasDeCle}
                    style={btn('#635bff', webhookLoading !== null || pasDeCle)}>
                    {webhookLoading === 'connect' ? '⏳ Enregistrement...' : '🔗 Enregistrer Webhook Connect (collaborateurs)'}
                  </button>
                </div>
                {wh.connect && <div style={{ fontSize: 11, color: THEME.success, fontWeight: 600 }}>✅ Webhook Connect enregistré</div>}
                <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
                  Écoute : account.updated, account.application.deauthorized, payout.paid, payout.failed — <strong>Events on Connected accounts</strong>
                </p>
                {cfg.webhook_urls?.connect && <p style={{ fontSize: 11, color: THEME.textLight, margin: 0, wordBreak: 'break-all' }}>URL : <code>{cfg.webhook_urls.connect}</code></p>}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <NoteBox type="warning">
                ⚠️ <strong>Important :</strong> Le Signing Secret n'est affiché <strong>qu'une seule fois</strong> par Stripe lors de la création du webhook. Ce bouton le récupère et le sauvegarde automatiquement. Si tu cliques à nouveau, un nouveau webhook est créé avec un nouveau secret — pense à supprimer l'ancien dans ton dashboard Stripe.
              </NoteBox>
              <NoteBox type="warning">
                ⚠️ Ton compte Stripe doit avoir <strong>Connect activé</strong> et ton profil de plateforme approuvé par Stripe pour que tes collaborateurs puissent se lier. Le bouton « Tester la connexion » te dit si c'est le cas.
              </NoteBox>
            </div>

            <BoutonEnregistrer saving={saving} onClick={() => { sauvegarder(); }} />
          </div>
        )}
      </div>
    </div>
  );
}