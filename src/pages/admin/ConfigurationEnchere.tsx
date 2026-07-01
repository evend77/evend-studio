import React, { useState, useEffect } from 'react';
import { EnchereInstructionsModal } from '../../components/EnchereInstructionsModal';

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

// ─────────────────────────────────────────────────────────────────────────────
// Composants réutilisables
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', background: value ? '#0d9488' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

function ToggleRow({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ flex: 1, paddingRight: '32px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: THEME.text, margin: '0 0 2px' }}>{label}</p>
        {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0, lineHeight: 1.5 }}>{note}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function SelectField({ label, note, value, onChange, options, width = '340px' }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  options: { val: string; label: string }[]; width?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ width, padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', cursor: 'pointer', outline: 'none', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        onFocus={e => (e.target.style.borderColor = THEME.accent)}
        onBlur={e => (e.target.style.borderColor = THEME.border)}>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: '6px 0 0' }}>{note}</p>}
    </div>
  );
}

function InputField({ label, note, value, onChange, type = 'text', placeholder, width = '340px', suffix }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; width?: string; suffix?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width, padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }}
          onFocus={e => (e.target.style.borderColor = THEME.accent)}
          onBlur={e => (e.target.style.borderColor = THEME.border)} />
        {suffix && <span style={{ fontSize: '13px', color: THEME.textLight, fontWeight: '600' }}>{suffix}</span>}
      </div>
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: '6px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '32px 0 4px', paddingBottom: '8px', borderBottom: `2px solid ${THEME.accent}` }}>
      {icon && <span style={{ fontSize: '15px' }}>{icon}</span>}
      <h3 style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.7px', margin: 0 }}>{children}</h3>
    </div>
  );
}

function SubSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f0f4f8', borderLeft: `3px solid ${THEME.accent}`, padding: '10px 16px', margin: '24px 0 16px', borderRadius: '0 6px 6px 0' }}>
      <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: 0 }}>{children}</p>
    </div>
  );
}

function NoteBox({ children, type = 'warning' }: { children: React.ReactNode; type?: 'warning' | 'info' | 'success' }) {
  const c = {
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  }[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
      <p style={{ fontSize: '13px', color: c.text, margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function RadioGroup({ label, note, options, value, onChange }: {
  label: string; note?: string; options: { val: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</label>
      {options.map(o => (
        <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px', color: THEME.text }}>
          <input type="radio" name={label} value={o.val} checked={value === o.val} onChange={() => onChange(o.val)}
            style={{ accentColor: THEME.accent, width: '15px', height: '15px' }} />
          {o.label}
        </label>
      ))}
      {note && <p style={{ fontSize: '12px', color: THEME.textLight, margin: '4px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function SaveButton({ onClick, saved, saving }: { onClick: () => void; saved: boolean; saving?: boolean }) {
  return (
    <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: `1px solid ${THEME.border}` }}>
      <button onClick={onClick} disabled={saving}
        style={{ backgroundColor: saved ? THEME.success : THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 32px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}>
        {saving ? '💾 Sauvegarde...' : (saved ? '✓ Enregistré!' : 'Enregistrer les modifications')}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET 1 : Configuration générale
// ─────────────────────────────────────────────────────────────────────────────
function OngletConfigGenerale({ config, setConfig, onSave, saving }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void; saving?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [bidRules, setBidRules] = useState<any[]>(config.bid_rules || [
    { from: '0.00', to: '5.00', minGap: '0.50', maxGap: '0.00' },
    { from: '5.00', to: '10.00', minGap: '1.00', maxGap: '0.00' }
  ]);
  const [newBidRule, setNewBidRule] = useState({ from: '', to: '', minGap: '', maxGap: '' });
  const [bannedUsernames, setBannedUsernames] = useState<string[]>(config.banned_usernames || []);
  const [newBannedUser, setNewBannedUser] = useState('');
  const [sortOptions, setSortOptions] = useState<Record<string,boolean>>(config.sort_options || {
    'Alphabétiquement, A-Z': true, 'Alphabétiquement, Z-A': true,
    'Enchère courante, Haute-Basse': true, 'Enchère courante, Basse-Haute': true,
    'Fin enchère bientôt': true, 'Fin enchère la plus tardive': true,
  });

  const handleSave = () => {
    // Mettre à jour les données dans le parent avant sauvegarde
    setConfig('bid_rules', bidRules);
    setConfig('sort_options', sortOptions);
    setConfig('banned_usernames', bannedUsernames);
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addBidRule = () => {
    if (newBidRule.from && newBidRule.to && newBidRule.minGap) {
      setBidRules([...bidRules, { ...newBidRule }]);
      setNewBidRule({ from: '', to: '', minGap: '', maxGap: '' });
    }
  };

  const addBannedUser = () => {
    if (newBannedUser.trim()) {
      setBannedUsernames([...bannedUsernames, newBannedUser.trim()]);
      setNewBannedUser('');
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '900px' }}>

      <SubSectionLabel>⚙️ Configuration générale</SubSectionLabel>

      <InputField label="Courriel de l'administrateur"
        note="Identifiant de courriel pour recevoir les mises à jour de vos enchères en cours."
        value={config.admin_email || ''} onChange={(v) => setConfig('admin_email', v)} placeholder="admin@e-vend.ca" />

      <SelectField label="Fuseau horaire"
        note="Sélectionnez votre fuseau horaire actuel."
        value={config.timezone || 'America/Montreal'} onChange={(v) => setConfig('timezone', v)}
        options={[
          { val: 'America/Montreal',  label: 'America/Montreal' },
          { val: 'America/Toronto',   label: 'America/Toronto' },
          { val: 'America/Vancouver', label: 'America/Vancouver' },
          { val: 'America/New_York',  label: 'America/New_York' },
          { val: 'UTC',              label: 'UTC' },
        ]} />

      <ToggleRow label="Notification courriel pour chaque mise (administrateur)"
        note="Activez cette option pour recevoir des notifications par courriel pour chaque mise."
        value={config.notif_email_admin || false} onChange={(v) => setConfig('notif_email_admin', v)} />

      <ToggleRow label="Activer la passerelle SMS Twilio"
        note="Enverra des SMS aux gagnants d'enchère et aux clients qui ont rejoint l'enchère."
        value={config.twilio_sms || false} onChange={(v) => setConfig('twilio_sms', v)} />

      <ToggleRow label="Ajouter le type de produit 'auction' sur le produit Shopify"
        note="Le type 'auction' sera assigné au produit 'shopify auction' créé ou mis à jour."
        value={config.add_product_type !== undefined ? config.add_product_type : true} onChange={(v) => setConfig('add_product_type', v)} />

      <InputField label="Nom d'expéditeur (From Name)"
        note="Nom affiché comme expéditeur dans les courriels envoyés aux clients."
        value={config.from_name || 'Les enchères e-Vend'} onChange={(v) => setConfig('from_name', v)} />

      <ToggleRow label="Inclure les images des produits dans les courriels d'enchère"
        value={config.include_images !== undefined ? config.include_images : true} onChange={(v) => setConfig('include_images', v)} />

      <ToggleRow label="Ajouter l'option 'Trier par' sur la page de liste des enchères"
        value={config.sort_by_option !== undefined ? config.sort_by_option : true} onChange={(v) => setConfig('sort_by_option', v)} />

      {config.sort_by_option && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px', marginTop: '8px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, marginBottom: '10px' }}>Options de tri disponibles</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.keys(sortOptions).map(k => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: THEME.text }}>
                <input type="checkbox" checked={sortOptions[k]} onChange={e => setSortOptions(p => ({ ...p, [k]: e.target.checked }))}
                  style={{ accentColor: THEME.accent, width: '14px', height: '14px' }} />
                {k}
              </label>
            ))}
          </div>
        </div>
      )}

      <ToggleRow label="Afficher les tags produits"
        value={config.show_products_tag !== undefined ? config.show_products_tag : true} onChange={(v) => setConfig('show_products_tag', v)} />

      <ToggleRow label="Supprimer l'en-tête des gabarits de courriel"
        value={config.remove_header_mail || false} onChange={(v) => setConfig('remove_header_mail', v)} />

      <ToggleRow label="Supprimer le pied de page des gabarits de courriel"
        value={config.remove_footer_mail || false} onChange={(v) => setConfig('remove_footer_mail', v)} />

      <SubSectionLabel>📋 Configuration de la page des enchères</SubSectionLabel>

      <ToggleRow label="Activer les grilles Bootstrap"
        value={config.bootstrap_grids !== undefined ? config.bootstrap_grids : true} onChange={(v) => setConfig('bootstrap_grids', v)} />

      <SelectField label="Trier les enchères en cours"
        note="Les enchères seront affichées dans cet ordre sur le site."
        value={config.sort_running || 'Recently Added'} onChange={(v) => setConfig('sort_running', v)}
        options={[
          { val: 'Recently Added',  label: 'Recently Added — Récemment ajoutés' },
          { val: 'Ending Soon',     label: 'Ending Soon — Fin prochaine' },
          { val: 'Price Low High',  label: 'Price Low High — Prix croissant' },
          { val: 'Price High Low',  label: 'Price High Low — Prix décroissant' },
        ]} />

      <SubSectionLabel>💰 Enchère courante &amp; plus haut enchérisseur</SubSectionLabel>

      <ToggleRow label="Afficher la mise de départ pour les enchères à venir"
        value={config.show_start_bid_upcoming || false} onChange={(v) => setConfig('show_start_bid_upcoming', v)} />
      <ToggleRow label="Afficher l'enchère courante"
        value={config.display_current_bid !== undefined ? config.display_current_bid : true} onChange={(v) => setConfig('display_current_bid', v)} />
      <ToggleRow label="Afficher le plus haut enchérisseur"
        value={config.display_highest_bidder !== undefined ? config.display_highest_bidder : true} onChange={(v) => setConfig('display_highest_bidder', v)} />
      <ToggleRow label="Afficher l'enchère courante (page produit)"
        value={config.display_current_bid_product !== undefined ? config.display_current_bid_product : true} onChange={(v) => setConfig('display_current_bid_product', v)} />
      <ToggleRow label="Afficher l'enchère courante (page collection)"
        value={config.display_current_bid_collection !== undefined ? config.display_current_bid_collection : true} onChange={(v) => setConfig('display_current_bid_collection', v)} />
      <ToggleRow label="Afficher la mise de départ"
        value={config.display_start_bid || false} onChange={(v) => setConfig('display_start_bid', v)} />
      <ToggleRow label="Afficher la mise de départ jusqu'à la première mise"
        value={config.display_start_bid_until !== undefined ? config.display_start_bid_until : true} onChange={(v) => setConfig('display_start_bid_until', v)} />
      <ToggleRow label="Afficher le nombre de mises"
        value={config.display_bid_count || false} onChange={(v) => setConfig('display_bid_count', v)} />

      <SubSectionLabel>🔨 Configuration des enchères</SubSectionLabel>

      <ToggleRow label="Démarrer l'enchère automatiquement"
        value={config.start_auction_auto !== undefined ? config.start_auction_auto : true} onChange={(v) => setConfig('start_auction_auto', v)} />
      <ToggleRow label="Relancer les enchères non réussies"
        value={config.restart_unsucc || false} onChange={(v) => setConfig('restart_unsucc', v)} />

      <ToggleRow label="Activer les mises par procuration (Proxy Bidding)"
        value={config.proxy_bidding !== undefined ? config.proxy_bidding : true} onChange={(v) => setConfig('proxy_bidding', v)} />

      {config.proxy_bidding && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px', marginTop: '-4px', marginBottom: '16px' }}>
          <ToggleRow label="Placer une mise normale et une mise par procuration avec un seul bouton"
            value={config.proxy_normal_single !== undefined ? config.proxy_normal_single : true} onChange={(v) => setConfig('proxy_normal_single', v)} />
        </div>
      )}

      <ToggleRow label="Règle de mise par défaut"
        value={config.default_bid_rule !== undefined ? config.default_bid_rule : true} onChange={(v) => setConfig('default_bid_rule', v)} />

      {config.default_bid_rule && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '20px', marginTop: '-4px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '14px' }}>Règles d'incrément des mises *</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
            {[
              { label: 'De (CAD)', key: 'from', val: newBidRule.from },
              { label: 'À (CAD)', key: 'to',  val: newBidRule.to },
              { label: 'Incrément min.', key: 'minGap', val: newBidRule.minGap },
              { label: 'Incrément max.', key: 'maxGap', val: newBidRule.maxGap },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, marginBottom: '4px' }}>{f.label}</label>
                <input type="number" value={f.val}
                  onChange={e => setNewBidRule(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="CAD"
                  style={{ width: '100%', padding: '8px 10px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }}
                  onFocus={e => (e.target.style.borderColor = THEME.accent)}
                  onBlur={e => (e.target.style.borderColor = THEME.border)} />
              </div>
            ))}
            <button onClick={addBidRule}
              style={{ background: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              + Ajouter
            </button>
          </div>
          {bidRules.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#f1f5f9', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', color: THEME.text }}>
              <span>De CAD {r.from} à CAD {r.to} — Incrément min. CAD {r.minGap}{r.maxGap && r.maxGap !== '0.00' ? ` / max. CAD ${r.maxGap}` : ''}</span>
              <button onClick={() => setBidRules(bidRules.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.danger, fontSize: '16px', padding: '0 4px' }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      <ToggleRow label="Permettre de miser depuis la page collection"
        value={config.place_from_collection || false} onChange={(v) => setConfig('place_from_collection', v)} />
      <ToggleRow label="Mises en nombres entiers uniquement"
        value={config.integer_only || false} onChange={(v) => setConfig('integer_only', v)} />
      <ToggleRow label="Incrément de mise maximum"
        value={config.max_bid_increment !== undefined ? config.max_bid_increment : true} onChange={(v) => setConfig('max_bid_increment', v)} />
      <ToggleRow label="Créer une variante d'enchère sur Achat immédiat"
        value={config.create_auction_variant || false} onChange={(v) => setConfig('create_auction_variant', v)} />
      <ToggleRow label="Activer le multi-langue"
        value={config.multi_language || false} onChange={(v) => setConfig('multi_language', v)} />
      <ToggleRow label="Arrêter l'enchère si le produit est hors stock"
        value={config.stop_if_out_of_stock !== undefined ? config.stop_if_out_of_stock : true} onChange={(v) => setConfig('stop_if_out_of_stock', v)} />
      <ToggleRow label="Afficher le montant maximum de mise autorisé"
        value={config.show_max_bid_allowed || false} onChange={(v) => setConfig('show_max_bid_allowed', v)} />
      <ToggleRow label="Enchère Popcorn"
        value={config.popcorn_bidding !== undefined ? config.popcorn_bidding : true} onChange={(v) => setConfig('popcorn_bidding', v)} />

      <InputField label="Montant plafonné pour les enchérisseurs"
        note="Les enchérisseurs devront être approuvés pour miser au-delà de ce montant."
        value={config.capped_amount || '0'} onChange={(v) => setConfig('capped_amount', v)} type="number" suffix="$" width="120px" />

      <ToggleRow label="Autoriser les mises pour plusieurs unités"
        value={config.allow_bid_multiple || false} onChange={(v) => setConfig('allow_bid_multiple', v)} />
      <ToggleRow label="Activer l'option de modification de mise"
        value={config.enable_edit_bid !== undefined ? config.enable_edit_bid : true} onChange={(v) => setConfig('enable_edit_bid', v)} />

      <SubSectionLabel>🏆 Gagnants</SubSectionLabel>

      <ToggleRow label="Approuver le gagnant automatiquement"
        value={config.approve_winner_auto !== undefined ? config.approve_winner_auto : true} onChange={(v) => setConfig('approve_winner_auto', v)} />
      <ToggleRow label="Déclarer plusieurs gagnants"
        value={config.multiple_winners || false} onChange={(v) => setConfig('multiple_winners', v)} />

      <RadioGroup label="Montant gagnant en cas de mise par procuration"
        value={config.winning_amount_proxy || 'last_bid'} onChange={(v) => setConfig('winning_amount_proxy', v)}
        options={[
          { val: 'last_bid', label: 'Dernière mise selon la règle d\'incrément' },
          { val: 'proxy_amount', label: 'Égal au montant proxy le plus élevé' },
        ]} />

      <ToggleRow label="Masquer l'option d'achat du produit gagnant pour les gagnants (site)"
        value={config.hide_winning_purchase || false} onChange={(v) => setConfig('hide_winning_purchase', v)} />
      <ToggleRow label="Modifier la mise gagnante"
        value={config.edit_winning_bid || false} onChange={(v) => setConfig('edit_winning_bid', v)} />
      <ToggleRow label="Envoyer un rappel d'achat"
        value={config.send_purchase_reminder !== undefined ? config.send_purchase_reminder : true} onChange={(v) => setConfig('send_purchase_reminder', v)} />

      {config.send_purchase_reminder && (
        <InputField label="Nombre de jours pour le rappel d'achat"
          value={config.purchase_reminder_days || '1'} onChange={(v) => setConfig('purchase_reminder_days', v)} type="number" suffix="jours" width="100px" />
      )}

      <InputField label="Nom du produit gagnant"
        value={config.winning_product_name || 'e-Vend enchères'} onChange={(v) => setConfig('winning_product_name', v)} />

      <ToggleRow label="Créneaux horaires pour le rappel d'achat"
        value={config.time_slots_reminder || false} onChange={(v) => setConfig('time_slots_reminder', v)} />
      <ToggleRow label="Profil de livraison personnalisé"
        value={config.custom_shipping || false} onChange={(v) => setConfig('custom_shipping', v)} />

      <RadioGroup label="Montant à payer par le gagnant de l'enchère"
        value={config.amount_to_pay || 'winning_bid'} onChange={(v) => setConfig('amount_to_pay', v)}
        options={[
          { val: 'winning_bid', label: 'Mise gagnante (Winning Bid)' },
          { val: 'percent_bid', label: '% de la mise gagnante' },
        ]} />

      <ToggleRow label="Déclarer le prochain gagnant si le paiement automatique échoue"
        value={config.declare_next_if_fails || false} onChange={(v) => setConfig('declare_next_if_fails', v)} />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px' }}>Fenêtre de paiement du gagnant</label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={config.window_unit || 'Hours'} onChange={e => setConfig('window_unit', e.target.value)}
            style={{ padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', minWidth: '120px' }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)}>
            <option>Hours</option><option>Days</option><option>Minutes</option>
          </select>
          <input type="number" value={config.window_value || '24'} onChange={e => setConfig('window_value', e.target.value)}
            style={{ width: '100px', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)} />
        </div>
      </div>

      <ToggleRow label="Déclarer le prochain gagnant après expiration de la fenêtre"
        value={config.declare_next_winner !== undefined ? config.declare_next_winner : true} onChange={(v) => setConfig('declare_next_winner', v)} />

      {config.declare_next_winner && (
        <InputField label="Nombre de fois pour déclarer le prochain gagnant"
          value={config.declare_next_times || '2'} onChange={(v) => setConfig('declare_next_times', v)} type="number" width="100px" />
      )}

      <SubSectionLabel>🖥️ Affichage (front-end)</SubSectionLabel>

      <InputField label="Nombre de jours d'affichage des détails après la fin de l'enchère"
        value={config.days_visible_after_end || '5'} onChange={(v) => setConfig('days_visible_after_end', v)} type="number" suffix="jours" width="100px" />

      <ToggleRow label="Afficher le prix de réserve"
        value={config.show_reserved_price || false} onChange={(v) => setConfig('show_reserved_price', v)} />
      <ToggleRow label="Afficher le montant minimum de mise autorisé"
        value={config.show_min_bid_amount !== undefined ? config.show_min_bid_amount : true} onChange={(v) => setConfig('show_min_bid_amount', v)} />

      <InputField label="Devise" value={config.currency || 'CAD'} onChange={(v) => setConfig('currency', v)} placeholder="CAD" width="120px" />

      <ToggleRow label="Afficher la mise de fin"
        value={config.show_ending_bid !== undefined ? config.show_ending_bid : true} onChange={(v) => setConfig('show_ending_bid', v)} />
      <ToggleRow label="Informer les enchérisseurs si le prix de réserve est atteint"
        value={config.inform_bidders !== undefined ? config.inform_bidders : true} onChange={(v) => setConfig('inform_bidders', v)} />
      <ToggleRow label="Mettre en évidence l'enchère courante"
        value={config.highlight_current_bid || false} onChange={(v) => setConfig('highlight_current_bid', v)} />

      <ToggleRow label="Confirmation lors de la mise du client"
        value={config.confirmation_bid !== undefined ? config.confirmation_bid : true} onChange={(v) => setConfig('confirmation_bid', v)} />

      {config.confirmation_bid && (
        <InputField label="Libellé personnalisé de confirmation"
          value={config.confirmation_label || ''} onChange={(v) => setConfig('confirmation_label', v)} placeholder="Confirmer ma mise" />
      )}

      <ToggleRow label="Afficher la description des enchères popcorn"
        value={config.display_popcorn_desc !== undefined ? config.display_popcorn_desc : true} onChange={(v) => setConfig('display_popcorn_desc', v)} />
      <ToggleRow label="Remplissage automatique de la mise minimum"
        value={config.autofill_min_bid !== undefined ? config.autofill_min_bid : true} onChange={(v) => setConfig('autofill_min_bid', v)} />
      <ToggleRow label="Pagination sur la page des enchères"
        value={config.pagination_auctions !== undefined ? config.pagination_auctions : true} onChange={(v) => setConfig('pagination_auctions', v)} />
      <ToggleRow label="Afficher la mise par procuration du client"
        value={config.display_proxy_bid !== undefined ? config.display_proxy_bid : true} onChange={(v) => setConfig('display_proxy_bid', v)} />
      <ToggleRow label="Supprimer le prix de réserve"
        value={config.remove_reserve_price || false} onChange={(v) => setConfig('remove_reserve_price', v)} />
      <ToggleRow label="Notification d'enchère dépassée (Outbid)"
        value={config.outbid_notif !== undefined ? config.outbid_notif : true} onChange={(v) => setConfig('outbid_notif', v)} />

      <ToggleRow label="Nom d'utilisateur d'enchère"
        value={config.bidding_username !== undefined ? config.bidding_username : true} onChange={(v) => setConfig('bidding_username', v)} />

      {config.bidding_username && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px', marginTop: '-4px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, marginBottom: '10px' }}>Noms d'utilisateurs bannis</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="text" value={newBannedUser} onChange={e => setNewBannedUser(e.target.value)}
              placeholder="Nom d'utilisateur..."
              style={{ flex: 1, padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = THEME.accent)}
              onBlur={e => (e.target.style.borderColor = THEME.border)} />
            <button onClick={addBannedUser} style={{ background: THEME.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Ajouter</button>
          </div>
          {bannedUsernames.map((u, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#fff', borderRadius: '6px', marginBottom: '4px', fontSize: '13px', color: THEME.text, border: `1px solid ${THEME.border}` }}>
              <span>{u}</span>
              <button onClick={() => setBannedUsernames(bannedUsernames.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.danger, fontSize: '15px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <ToggleRow label="Exiger l'adresse et le numéro de téléphone du client"
        value={config.mandate_address || false} onChange={(v) => setConfig('mandate_address', v)} />
      <ToggleRow label="Affichage personnalisé des mises"
        value={config.customized_bid_show || false} onChange={(v) => setConfig('customized_bid_show', v)} />
      <ToggleRow label="Afficher les mises des autres enchérisseurs"
        value={config.show_bids_from_others !== undefined ? config.show_bids_from_others : true} onChange={(v) => setConfig('show_bids_from_others', v)} />
      <ToggleRow label="Afficher le prix premium"
        value={config.display_premium_price || false} onChange={(v) => setConfig('display_premium_price', v)} />
      <ToggleRow label="Préférence de livraison"
        value={config.delivery_preference || false} onChange={(v) => setConfig('delivery_preference', v)} />
      <ToggleRow label="Afficher la mise maximum sur la page de détails de la mise"
        value={config.display_max_bid_page !== undefined ? config.display_max_bid_page : true} onChange={(v) => setConfig('display_max_bid_page', v)} />

      {config.display_max_bid_page && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '12px 16px', marginTop: '-8px', marginBottom: '16px' }}>
          <ToggleRow label="Afficher la mise maximum propre du client"
            value={config.display_max_bid_customer || false} onChange={(v) => setConfig('display_max_bid_customer', v)} />
        </div>
      )}

      <ToggleRow label="Paramètres façade pour les enchérisseurs bannis"
        value={config.front_end_banned_setting !== undefined ? config.front_end_banned_setting : true} onChange={(v) => setConfig('front_end_banned_setting', v)} />

      {config.front_end_banned_setting && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px', marginTop: '-8px', marginBottom: '16px' }}>
          {[
            { val: 'hide',    label: 'Masquer le bouton Placer une mise' },
            { val: 'message', label: 'Afficher le bouton avec un message' },
          ].map(o => (
            <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px', fontSize: '14px', color: THEME.text }}>
              <input type="radio" name="bannedBidder" value={o.val} checked={config.banned_bidder_option === o.val}
                onChange={() => setConfig('banned_bidder_option', o.val)} style={{ accentColor: THEME.accent, width: '15px', height: '15px' }} />
              {o.label}
            </label>
          ))}
        </div>
      )}

      <ToggleRow label="Restreindre les mises consécutives"
        value={config.restrict_consecutive || false} onChange={(v) => setConfig('restrict_consecutive', v)} />
      <ToggleRow label="Masquer les noms des enchérisseurs pour tous"
        value={config.hide_bidders_name_all || false} onChange={(v) => setConfig('hide_bidders_name_all', v)} />
      <ToggleRow label="Permettre aux enchérisseurs de masquer leur nom"
        value={config.allow_hide_name !== undefined ? config.allow_hide_name : true} onChange={(v) => setConfig('allow_hide_name', v)} />

      <InputField label="Nombre de jours avant pour afficher l'enchère"
        value={config.days_prior_view || '0'} onChange={(v) => setConfig('days_prior_view', v)} type="number" suffix="jours" width="100px" />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px' }}>Courriel au plus haut enchérisseur</label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={config.mail_to_highest_unit || 'Hours'} onChange={e => setConfig('mail_to_highest_unit', e.target.value)}
            style={{ padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', minWidth: '120px' }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)}>
            <option>Hours</option><option>Days</option><option>Minutes</option>
          </select>
          <input type="number" value={config.mail_to_highest_value || '0'} onChange={e => setConfig('mail_to_highest_value', e.target.value)}
            style={{ width: '100px', padding: '9px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = THEME.accent)}
            onBlur={e => (e.target.style.borderColor = THEME.border)} />
        </div>
      </div>

      <SubSectionLabel>📧 Notifications par courriel</SubSectionLabel>

      <ToggleRow label="Envoyer un courriel à l'enchérisseur automatique en cas de perte"
        value={config.send_mail_auto_bidder || false} onChange={(v) => setConfig('send_mail_auto_bidder', v)} />
      <ToggleRow label="Ajouter un champ courriel"
        value={config.add_email_field || false} onChange={(v) => setConfig('add_email_field', v)} />
      <ToggleRow label="Désactiver le courriel de fin d'enchère pour l'admin"
        value={config.disable_finish_auction || false} onChange={(v) => setConfig('disable_finish_auction', v)} />
      <ToggleRow label="Courriel d'annulation du gagnant pour l'admin"
        value={config.winner_cancel_mail || false} onChange={(v) => setConfig('winner_cancel_mail', v)} />
      <ToggleRow label="Configuration du courriel de la mise la plus haute"
        value={config.highest_bid_mail_config || false} onChange={(v) => setConfig('highest_bid_mail_config', v)} />
      <ToggleRow label="Notification courriel pour chaque mise (clients)"
        value={config.email_notif_every_bid || false} onChange={(v) => setConfig('email_notif_every_bid', v)} />

      <SubSectionLabel>📦 Commandes</SubSectionLabel>

      <SelectField label="Gérer les commandes"
        value={config.manage_orders || 'Within store'} onChange={(v) => setConfig('manage_orders', v)}
        options={[
          { val: 'Within store',  label: 'Within store — Dans la boutique' },
          { val: 'Outside store', label: 'Outside store — En dehors de la boutique' },
        ]} />

      <SubSectionLabel>💳 Frais d'enchère</SubSectionLabel>

      <SelectField label="Type de frais"
        value={config.fee_type || 'Joining Fee'} onChange={(v) => setConfig('fee_type', v)}
        options={[
          { val: 'Joining Fee',    label: 'Joining Fee — Frais d\'adhésion' },
          { val: 'No Fee',         label: 'No Fee — Sans frais' },
          { val: 'Reservation Fee',label: 'Reservation Fee — Frais de réservation' },
        ]} />

      <RadioGroup label="Règle de frais d'adhésion"
        value={config.joining_fee_rule || 'per_auction'} onChange={(v) => setConfig('joining_fee_rule', v)}
        options={[
          { val: 'per_auction', label: 'Le client paye les frais d\'adhésion pour chaque enchère.' },
          { val: 'once_any',    label: 'Le client paye les frais d\'adhésion une seule fois pour n\'importe quelle enchère ou étiquette.' },
        ]} />

      <ToggleRow label="Facturer les taxes sur les frais d'adhésion"
        value={config.charge_taxes_joining || false} onChange={(v) => setConfig('charge_taxes_joining', v)} />

      <ToggleRow label="Conditions générales"
        value={config.terms_conditions !== undefined ? config.terms_conditions : true} onChange={(v) => setConfig('terms_conditions', v)} />

      {config.terms_conditions && (
        <div style={{ marginTop: '-8px', marginBottom: '20px' }}>
          <InputField label="URL des conditions générales"
            value={config.terms_url || 'https://e-vend.ca/pages/guide-pour-les-encheres-e-vend'} onChange={(v) => setConfig('terms_url', v)} width="500px" />
          <ToggleRow label="Lien par défaut des conditions générales"
            value={config.default_terms_handle || false} onChange={(v) => setConfig('default_terms_handle', v)} />
          <ToggleRow label="Conditions générales basées sur les étiquettes"
            value={config.tag_based_terms || false} onChange={(v) => setConfig('tag_based_terms', v)} />
        </div>
      )}

      <ToggleRow label="Restreindre les mises sur les commandes de frais d'adhésion en attente"
        value={config.restrict_pending_joining || false} onChange={(v) => setConfig('restrict_pending_joining', v)} />

      <RadioGroup label="Frais d'adhésion à l'enchère"
        value={config.auction_joining_fee || 'per_auction_wise'} onChange={(v) => setConfig('auction_joining_fee', v)}
        options={[
          { val: 'per_auction_wise', label: 'Frais d\'adhésion par enchère' },
          { val: 'every_auction',    label: 'Frais d\'adhésion pour chaque enchère' },
          { val: 'every_tag',        label: 'Frais d\'adhésion pour chaque étiquette d\'enchère' },
        ]} />

      <ToggleRow label="Rembourser les frais d'adhésion"
        value={config.refund_joining_fee || false} onChange={(v) => setConfig('refund_joining_fee', v)} />
      <ToggleRow label="Options disponibles après activation des frais d'adhésion"
        value={config.options_after_joining || false} onChange={(v) => setConfig('options_after_joining', v)} />
      <ToggleRow label="Activer la fonctionnalité multi-devise"
        value={config.multi_currency || false} onChange={(v) => setConfig('multi_currency', v)} />

      <SaveButton onClick={handleSave} saved={saved} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET 2 : Configuration widget — 5 layouts avec prévisualisation
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUTS_INFO = [
  { id: 'Layout 1', nom: 'Minimal', desc: "S'intègre dans n'importe quel thème", couleur: '#111827' },
  { id: 'Layout 2', nom: 'Professionnel teal', desc: 'Moderne et rassurant', couleur: '#0d9488' },
  { id: 'Layout 3', nom: 'Sombre élégant', desc: 'Premium et haut de gamme', couleur: '#7c3aed' },
  { id: 'Layout 4', nom: 'Luxe doré', desc: 'Prestige — antiquités, collections', couleur: '#78350f' },
  { id: 'Layout 5', nom: 'Néon futuriste', desc: 'Tech — gaming, streetwear, sneakers', couleur: '#4f46e5' },
];

function WidgetPreview({ layout, afficherBidder }: { layout: string; afficherBidder: boolean }) {
  const [timer, setTimer] = React.useState({ d: '02', h: '14', m: '33', s: '07' });
  React.useEffect(() => {
    const end = new Date(Date.now() + (2 * 86400 + 14 * 3600 + 33 * 60 + 7) * 1000);
    const tick = () => {
      const diff = Math.max(0, end.getTime() - Date.now());
      const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
      setTimer({ d: pad(Math.floor(diff / 86400000)), h: pad(Math.floor((diff % 86400000) / 3600000)), m: pad(Math.floor((diff % 3600000) / 60000)), s: pad(Math.floor((diff % 60000) / 1000)) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const T = ({ v, u }: { v: string; u: string }) => (
    <div style={{ display: 'inline-flex', flexDirection: 'column' as const, alignItems: 'center', minWidth: '26px' }}>
      <span style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1 }}>{v}</span>
      <span style={{ fontSize: '8px', textTransform: 'uppercase' as const, opacity: .6, marginTop: '1px' }}>{u}</span>
    </div>
  );
  const S = ({ c }: { c: string }) => <span style={{ fontSize: '14px', opacity: .35, margin: '0 1px', paddingBottom: '4px', color: c }}>:</span>;

  const Bidder = ({ bg, bd, avBg, avC, lC, nC, aC }: any) => !afficherBidder ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 9px', background: bg, border: `1px solid ${bd}`, borderRadius: '7px', marginTop: '7px' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: avBg, color: avC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, flexShrink: 0 }}>MC</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '8px', textTransform: 'uppercase' as const, color: lC, marginBottom: '1px' }}>Plus haut enchérisseur</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: nC }}>Marie C.</div>
      </div>
      <span style={{ fontSize: '10px', fontWeight: 800, color: aC }}>124 $</span>
    </div>
  );

  const Inp = (border: string, bg: string, color: string, ph: string) =>
    <input type="number" placeholder={ph} readOnly style={{ width: '100%', border: `1.5px solid ${border}`, borderRadius: '6px', padding: '6px 9px', fontSize: '11px', color, background: bg, marginTop: '7px', outline: 'none', boxSizing: 'border-box' as const }} />;

  const Btn = (bg: string, color: string, txt: string, extra?: React.CSSProperties) =>
    <button style={{ display: 'block', width: '100%', padding: '9px', marginTop: '7px', background: bg, color, border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', ...extra }}>{txt}</button>;

  if (layout === 'Layout 1') return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '11px', padding: '12px', fontFamily: 'inherit' }}>
      <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '5px' }}>Fin : 12 avr., 11 h 53</div>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', paddingBottom: '7px' }}><T v={timer.d} u="j"/><S c="#111"/><T v={timer.h} u="h"/><S c="#111"/><T v={timer.m} u="m"/><S c="#111"/><T v={timer.s} u="s"/></div>
      <div style={{ height: '1px', background: '#f3f4f6', margin: '5px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '10px' }}><span style={{ color: '#6b7280' }}>Mise courante</span><span style={{ fontWeight: 700, color: '#111' }}>124 $ <span style={{ background: '#f0fdf4', color: '#166534', fontSize: '8px', padding: '1px 5px', borderRadius: '20px' }}>8 mises</span></span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '10px' }}><span style={{ color: '#6b7280' }}>Incrément min.</span><span style={{ fontWeight: 700, color: '#111' }}>5,00 $</span></div>
      <Bidder bg="#f9fafb" bd="#e5e7eb" avBg="#e5e7eb" avC="#374151" lC="#6b7280" nC="#111827" aC="#16a34a" />
      {Inp('#d1d5db', '#f9fafb', '#111', 'Min. 129,00 $')}
      {Btn('#111827', '#fff', 'Placer ma mise')}
    </div>
  );

  if (layout === 'Layout 2') return (
    <div style={{ background: '#fff', borderRadius: '13px', overflow: 'hidden', border: '1px solid #ccfbf1', fontFamily: 'inherit' }}>
      <div style={{ background: '#0d9488', padding: '11px 13px', color: '#fff' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' as const, opacity: .75, marginBottom: '2px' }}>Mise courante</div>
        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-.5px' }}>124,00 $ CAD</div>
        <div style={{ fontSize: '8px', opacity: .75, marginTop: '2px' }}>8 mises · Réserve non atteinte</div>
      </div>
      <div style={{ padding: '11px 13px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', background: '#f0fdfa', borderRadius: '8px', padding: '7px', marginBottom: '8px' }}><T v={timer.d} u="j"/><S c="#5eead4"/><T v={timer.h} u="h"/><S c="#5eead4"/><T v={timer.m} u="m"/><S c="#5eead4"/><T v={timer.s} u="s"/></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280', marginBottom: '7px' }}><span>Réserve : <strong style={{ color: '#0f766e' }}>200 $</strong></span><span>Min. : <strong style={{ color: '#0f766e' }}>129 $</strong></span></div>
        <Bidder bg="#f0fdfa" bd="#99f6e4" avBg="#99f6e4" avC="#0f766e" lC="#0d9488" nC="#0f766e" aC="#0f766e" />
        {Inp('#d1fae5', '#f0fdfa', '#134e4a', 'Votre mise')}
        {Btn('#0d9488', '#fff', 'Placer ma mise →')}
      </div>
    </div>
  );

  if (layout === 'Layout 3') return (
    <div style={{ background: '#18181b', borderRadius: '15px', overflow: 'hidden', border: '1px solid #27272a', fontFamily: 'inherit' }}>
      <div style={{ background: '#27272a', padding: '7px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#a1a1aa', fontWeight: 700 }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />En direct</div>
        <div style={{ fontSize: '9px', color: '#52525b' }}>Fin 12 avr.</div>
      </div>
      <div style={{ padding: '13px' }}>
        <div style={{ fontSize: '8px', color: '#71717a', textTransform: 'uppercase' as const, letterSpacing: '.07em', marginBottom: '2px' }}>Mise courante</div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>124 <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 400 }}>$</span></div>
        <div style={{ fontSize: '9px', color: '#71717a', margin: '2px 0 10px' }}>8 enchérisseurs · min. 129 $</div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {[['d', timer.d], ['h', timer.h], ['m', timer.m], ['s', timer.s]].map(([u, v]) => (
            <div key={u} style={{ flex: 1, background: '#27272a', borderRadius: '7px', padding: '7px 3px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: '7px', color: '#71717a', textTransform: 'uppercase' as const, marginTop: '1px' }}>{u}</div>
            </div>
          ))}
        </div>
        <Bidder bg="#27272a" bd="#3f3f46" avBg="#3f3f46" avC="#a1a1aa" lC="#71717a" nC="#e4e4e7" aC="#86efac" />
        {Inp('#3f3f46', '#27272a', '#fff', 'Votre mise')}
        {Btn('#7c3aed', '#fff', 'Enchérir maintenant')}
      </div>
    </div>
  );

  if (layout === 'Layout 4') return (
    <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '16px', overflow: 'hidden', fontFamily: 'inherit' }}>
      <div style={{ background: '#78350f', padding: '12px 14px' }}>
        <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#fde68a', marginBottom: '3px' }}>Vente aux enchères</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#fef3c7', letterSpacing: '-1px' }}>124,00 $</div>
        <div style={{ fontSize: '8px', color: '#fde68a', marginTop: '2px' }}>8 mises · Réserve non atteinte</div>
      </div>
      <div style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', background: '#fffbeb', border: '1.5px solid #fde047', borderRadius: '9px', padding: '7px', marginBottom: '9px' }}><T v={timer.d} u="j"/><S c="#fbbf24"/><T v={timer.h} u="h"/><S c="#fbbf24"/><T v={timer.m} u="m"/><S c="#fbbf24"/><T v={timer.s} u="s"/></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '9px' }}>
          {[['Réserve', '200 $'], ['Min. suivante', '129 $']].map(([k, v]) => (
            <div key={k} style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: '7px', padding: '6px 9px' }}>
              <div style={{ fontSize: '8px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' as const }}>{k}</div>
              <div style={{ fontSize: '11px', color: '#78350f', fontWeight: 800, marginTop: '1px' }}>{v}</div>
            </div>
          ))}
        </div>
        <Bidder bg="#fffbeb" bd="#fde047" avBg="#fde68a" avC="#78350f" lC="#92400e" nC="#78350f" aC="#92400e" />
        {Inp('#d97706', '#fff', '#78350f', 'Votre offre')}
        {Btn('#78350f', '#fef3c7', 'Soumettre mon offre', { borderRadius: '10px', fontWeight: 900 })}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0f', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1e1b4b', fontFamily: 'inherit' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg,#818cf8,#c084fc,#f472b6)' }} />
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1e1b4b', borderRadius: '20px', padding: '3px 8px', fontSize: '9px', color: '#a5b4fc', fontWeight: 800 }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8' }} />LIVE</div>
          <span style={{ fontSize: '9px', color: '#4b5563' }}>Fin dans {timer.d}j {timer.h}h {timer.m}m</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '.07em', marginBottom: '2px' }}>Mise courante</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}><sup style={{ fontSize: '14px', color: '#818cf8', fontWeight: 700, verticalAlign: 'super' }}>$</sup>124</div>
          <div style={{ fontSize: '9px', color: '#6366f1', marginTop: '2px' }}>8 enchérisseurs actifs</div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
          {[['d', timer.d], ['h', timer.h], ['m', timer.m], ['s', timer.s]].map(([u, v]) => (
            <div key={u} style={{ flex: 1, background: '#13131f', border: '1px solid #312e81', borderRadius: '7px', padding: '7px 3px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#a5b4fc' }}>{v}</div>
              <div style={{ fontSize: '7px', color: '#4f46e5', textTransform: 'uppercase' as const, marginTop: '1px' }}>{u}</div>
            </div>
          ))}
        </div>
        <Bidder bg="#13131f" bd="#312e81" avBg="#1e1b4b" avC="#a5b4fc" lC="#6366f1" nC="#c7d2fe" aC="#818cf8" />
        {Inp('#312e81', '#13131f', '#fff', 'Entrez votre mise…')}
        {Btn('#4f46e5', '#fff', 'ENCHÉRIR MAINTENANT', { letterSpacing: '.04em', borderRadius: '10px' })}
      </div>
    </div>
  );
}

function OngletConfigWidget({ config, setConfig, onSave, saving }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void; saving?: boolean }) {
  const [saved, setSaved] = useState(false);
  const selectedLayout = config.selected_layout || 'Layout 1';
  const afficherBidder = config.display_highest_bidder !== false;

  const dateFormatKeys = [
    { key: '%H', desc: 'Horloge 24h', ex: '14' },
    { key: '%I', desc: 'Horloge 12h', ex: '02' },
    { key: '%M', desc: 'Minutes', ex: '01 (Minutes)' },
    { key: '%S', desc: 'Secondes', ex: '01 (Secondes)' },
    { key: '%p', desc: 'AM ou PM', ex: 'AM or PM' },
    { key: '%e', desc: 'Jour', ex: '1' },
    { key: '%d', desc: 'Jour (zéro)', ex: '01' },
    { key: '%m', desc: 'Mois (numérique)', ex: '01' },
    { key: '%b', desc: 'Mois (court)', ex: 'Jan' },
    { key: '%B', desc: 'Mois (complet)', ex: 'January' },
    { key: '%y', desc: 'Année (2 chiffres)', ex: '20' },
    { key: '%Y', desc: 'Année (4 chiffres)', ex: '2020' },
  ];

  const handleSave = () => { onSave(); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px' }}>
      <SubSectionLabel>🎨 Sélection du widget d'enchère</SubSectionLabel>
      <p style={{ fontSize: '13px', color: THEME.textLight, margin: '-8px 0 20px' }}>
        Cliquez sur un layout pour le sélectionner. Le compteur dans chaque prévisualisation est en temps réel.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {LAYOUTS_INFO.map(l => {
          const isSelected = selectedLayout === l.id;
          return (
            <div key={l.id} onClick={() => setConfig('selected_layout', l.id)} style={{ border: isSelected ? `2.5px solid ${l.couleur}` : `1.5px solid ${THEME.border}`, borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? `0 4px 20px ${l.couleur}33` : 'none', background: '#fff' }}>
              <div style={{ padding: '10px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}` }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: THEME.text }}>{l.id} — {l.nom}</div>
                  <div style={{ fontSize: '11px', color: THEME.textLight, marginTop: '2px' }}>{l.desc}</div>
                </div>
                {isSelected && <div style={{ background: l.couleur, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', flexShrink: 0, marginLeft: '8px' }}>✓ Actif</div>}
              </div>
              <div style={{ padding: '12px', background: '#f8fafc' }}>
                <WidgetPreview layout={l.id} afficherBidder={afficherBidder} />
              </div>
            </div>
          );
        })}
      </div>

      <SubSectionLabel>⏱️ Paramètres du minuteur</SubSectionLabel>
      <ToggleRow label="Afficher les secondes dans le minuteur" value={config.display_seconds !== undefined ? config.display_seconds : true} onChange={(v) => setConfig('display_seconds', v)} />

      <SubSectionLabel>📅 Format de date</SubSectionLabel>
      <InputField label="Format de date" note="Utilisez les codes ci-dessous pour définir un format de date pour les enchères." value={config.date_format || '%e-%b-%Y %l:%M %p'} onChange={(v) => setConfig('date_format', v)} width="340px" />

      <NoteBox type="info">
        <strong>Codes de format disponibles (utilisez espace, '/', '-', ',' comme séparateurs) :</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '10px' }}>
          {dateFormatKeys.map(d => (
            <div key={d.key} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#1e40af', flexShrink: 0 }}>{d.key}</code>
              <span style={{ fontSize: '12px' }}>{d.desc} — <em style={{ color: '#6b7280' }}>{d.ex}</em></span>
            </div>
          ))}
        </div>
      </NoteBox>

      <SaveButton onClick={handleSave} saved={saved} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET 3 : Restrictions vendeur
// ─────────────────────────────────────────────────────────────────────────────
function OngletRestrictionsVendeur({ config, setConfig, onSave, saving }: { config: any; setConfig: (key: string, value: any) => void; onSave: () => void; saving?: boolean }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '900px' }}>
      <SubSectionLabel>🔒 Restrictions vendeur (Multivendeur)</SubSectionLabel>
      <p style={{ fontSize: '13px', color: THEME.textLight, margin: '-10px 0 20px', lineHeight: 1.6 }}>
        Restreignez les modifications que le vendeur peut apporter. Ces paramètres s'appliquent uniquement côté multivendeur (MVM).
      </p>

      <ToggleRow label="Paramètre de paiement automatique"
        value={config.auto_pay_setting || false} onChange={(v) => setConfig('auto_pay_setting', v)} />

      <ToggleRow label="Paramètre de mise par procuration (Proxy Bidding)"
        value={config.proxy_bidding_setting || false} onChange={(v) => setConfig('proxy_bidding_setting', v)} />

      <ToggleRow label="Paramètre des enchères popcorn"
        value={config.popcorn_bidding_setting || false} onChange={(v) => setConfig('popcorn_bidding_setting', v)} />

      <ToggleRow label="Paramètre de durée d'enchère"
        value={config.auction_duration_setting || false} onChange={(v) => setConfig('auction_duration_setting', v)} />

      {config.auction_duration_setting && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '20px 24px', marginTop: '-4px', marginBottom: '16px' }}>
          <NoteBox type="info">
            💡 <strong>Exemple :</strong> Si vous définissez Début à 2 jours et Fin à 5 jours, lorsqu'un vendeur créera une enchère depuis son panel, l'heure de début sera préremplie à 2 jours après l'heure actuelle, et l'heure de fin sera préremplie à 5 jours après l'heure de début.
          </NoteBox>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '8px' }}>Heure de début par défaut</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', color: THEME.textLight, background: '#f0f4f8' }}>jours</div>
                <input type="number" value={config.default_start_days || '0'} onChange={e => setConfig('default_start_days', e.target.value)}
                  style={{ width: '80px', padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = THEME.accent)}
                  onBlur={e => (e.target.style.borderColor = THEME.border)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', marginBottom: '8px' }}>Heure de fin par défaut</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '13px', color: THEME.textLight, background: '#f0f4f8' }}>jours</div>
                <input type="number" value={config.default_end_days || '2'} onChange={e => setConfig('default_end_days', e.target.value)}
                  style={{ width: '80px', padding: '8px 12px', border: `2px solid ${THEME.border}`, borderRadius: '6px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = THEME.accent)}
                  onBlur={e => (e.target.style.borderColor = THEME.border)} />
              </div>
            </div>
          </div>
        </div>
      )}

      <ToggleRow label="Paramètre de prix de base"
        value={config.base_price_setting || false} onChange={(v) => setConfig('base_price_setting', v)} />

      {config.base_price_setting && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px 24px', marginTop: '-4px', marginBottom: '16px' }}>
          <InputField label="Prix de base"
            note="Saisissez ce champ pour préremplir le prix de base côté vendeur."
            value={config.base_price || '0'} onChange={(v) => setConfig('base_price', v)} type="number" suffix="$" width="120px" />
        </div>
      )}

      <ToggleRow label="Paramètre de prix de réserve"
        value={config.reserve_price_setting || false} onChange={(v) => setConfig('reserve_price_setting', v)} />

      {config.reserve_price_setting && (
        <div style={{ background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '16px 24px', marginTop: '-4px', marginBottom: '16px' }}>
          <InputField label="Prix de réserve"
            note="Saisissez ce champ pour préremplir le prix de réserve côté vendeur."
            value={config.reserve_price || '10'} onChange={(v) => setConfig('reserve_price', v)} type="number" suffix="$" width="120px" />
        </div>
      )}

      <ToggleRow label="Permettre au vendeur d'arrêter une enchère en cours"
        note="Si activé, le vendeur peut mettre fin à une enchère active depuis son tableau de bord. Les tags Shopify seront retirés automatiquement."
        value={config.vendor_can_stop_auction || false} onChange={(v) => setConfig('vendor_can_stop_auction', v)} />

      <NoteBox type="info">
        💡 Ces restrictions s'appliquent côté multivendeur uniquement. L'administrateur conserve toujours l'accès complet à tous les paramètres d'enchère depuis ce dashboard.
      </NoteBox>

      <SaveButton onClick={handleSave} saved={saved} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale — ConfigurationEnchere
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfigurationEnchere({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [onglet, setOnglet] = useState<'general' | 'widget' | 'vendeur'>('general');
  const [instructionsOuvertes, setInstructionsOuvertes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Charger la configuration des enchères
  const chargerConfiguration = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/encheres', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (typeof data.bid_rules === 'string') data.bid_rules = JSON.parse(data.bid_rules);
        if (typeof data.banned_usernames === 'string') data.banned_usernames = JSON.parse(data.banned_usernames);
        if (typeof data.sort_options === 'string') data.sort_options = JSON.parse(data.sort_options);
        if (!Array.isArray(data.bid_rules)) data.bid_rules = [];
        if (!Array.isArray(data.banned_usernames)) data.banned_usernames = [];
        if (!data.sort_options || typeof data.sort_options !== 'object') data.sort_options = {};
        setConfig(data);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement config enchères:', error);
      showToast('Erreur lors du chargement de la configuration des enchères', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder la configuration
  const sauvegarderConfiguration = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/admin/encheres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        showToast('Configuration des enchères sauvegardée avec succès!', 'success');
        await chargerConfiguration();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde enchères:', error);
      showToast('Erreur lors de la sauvegarde de la configuration des enchères', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour un champ de configuration
  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    chargerConfiguration();
  }, []);

  const onglets = [
    { id: 'general', label: '⚙️ Configuration générale' },
    { id: 'widget',  label: '🎨 Configuration widget' },
    { id: 'vendeur', label: '🔒 Restrictions vendeur' },
  ] as const;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration des enchères...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 28px', maxWidth: '1100px' }}>

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

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            🔨 Configuration des enchères
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Configurez tous les paramètres du module d'enchères e-Vend.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setInstructionsOuvertes(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #1c0a00, #431a00)',
              color: 'white', fontSize: '13px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(67,26,0,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span>📋</span>
            <span>Guide d'installation</span>
          </button>
          <button onClick={sauvegarderConfiguration} disabled={saving}
            style={{ backgroundColor: THEME.success, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>

        <EnchereInstructionsModal ouvert={instructionsOuvertes} onFermer={() => setInstructionsOuvertes(false)} />
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', borderBottom: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc', overflowX: 'auto' as const }}>
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: '14px 24px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: onglet === o.id ? '700' : '500', color: onglet === o.id ? THEME.accent : THEME.textLight, cursor: 'pointer', borderBottom: onglet === o.id ? `3px solid ${THEME.accent}` : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
              {o.label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto' as const, maxHeight: 'calc(100vh - 200px)' }}>
          {onglet === 'general' && <OngletConfigGenerale config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} saving={saving} />}
          {onglet === 'widget'  && <OngletConfigWidget config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} saving={saving} />}
          {onglet === 'vendeur' && <OngletRestrictionsVendeur config={config} setConfig={updateConfig} onSave={sauvegarderConfiguration} saving={saving} />}
        </div>
      </div>
    </div>
  );
}
