import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';
function getToken() { return localStorage.getItem('token') || ''; }

// ── Types ─────────────────────────────────────────────────────────────────────
type StatutDemande = 'pending' | 'actif' | 'rejected' | 'snooze' | 'info_demandee';

interface DemandeVendeur {
  id: number;
  seller_id: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  province: string;
  code_postal?: string;
  boutique: string;
  description?: string;
  categorie?: string;
  site_web?: string;
  instagram?: string;
  facebook?: string;
  zone_expedition: string;
  type_entreprise: string;
  plan: string;
  statut: StatutDemande;
  note_admin?: string;
  snooze_jusqu_au?: string;
  nb_tentatives?: number;
  derniere_relance?: string;
  date_inscription?: string;
  created_at: string;
  scoreRisque: 'faible' | 'moyen' | 'eleve';
}

interface ApprobationsEnAttenteProps {
  naviguerVers: (page: string, data?: any) => void;
}

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
  orange: '#ea580c', purple: '#7c3aed',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formaterDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function calculerScoreRisque(d: any): 'faible' | 'moyen' | 'eleve' {
  let pts = 0;
  if (!d.boutique)         pts++;
  if (!d.zone_expedition)  pts++;
  if (!d.type_entreprise)  pts++;
  if (!d.telephone)        pts++;
  if (!d.adresse)          pts++;
  if (pts <= 1) return 'faible';
  if (pts <= 3) return 'moyen';
  return 'eleve';
}

function RisqueBadge({ niveau }: { niveau: string }) {
  const map: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    faible: { bg: '#dcfce7', color: '#16a34a', label: 'Faible', icon: '🟢' },
    moyen:  { bg: '#fef9c3', color: '#92400e', label: 'Moyen',  icon: '🟡' },
    eleve:  { bg: '#fee2e2', color: '#dc2626', label: 'Élevé',  icon: '🔴' },
  };
  const s = map[niveau] || map.faible;
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{s.icon} {s.label}</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { bg: string; color: string; icon: string }> = {
    'Plan Fondateur': { bg: '#f3f4f6', color: '#6b7280', icon: '🆓' },
    'Plan Argent':    { bg: '#f1f5f9', color: '#475569', icon: '🥈' },
    'Plan Or':        { bg: '#fef9c3', color: '#92400e', icon: '🥇' },
    'Plan Extrême':   { bg: '#fce7f3', color: '#be185d', icon: '🚀' },
    'Gratuit':        { bg: '#f3f4f6', color: '#6b7280', icon: '🆓' },
  };
  const s = map[plan] || { bg: '#f3f4f6', color: '#6b7280', icon: '📦' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{s.icon} {plan || 'Gratuit'}</span>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' | 'info' | 'orange' }) {
  const colors: Record<string, string> = { success: T.success, danger: T.danger, info: T.accent, orange: T.orange };
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: colors[type], color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '400px', lineHeight: '1.4' }}>
      {msg}
    </div>
  );
}

// ── Modal détail complet ───────────────────────────────────────────────────────
function ModalDetail({
  demande, loading, onApprouver, onRejeter, onDemanderInfo, onSnooze, onSauvegarderNote, onFermer,
}: {
  demande: DemandeVendeur;
  loading: boolean;
  onApprouver: () => void;
  onRejeter: (raison: string) => void;
  onDemanderInfo: (msg: string) => void;
  onSnooze: (date: string) => void;
  onSauvegarderNote: (note: string) => void;
  onFermer: () => void;
}) {
  const [onglet, setOnglet]   = useState<'profil' | 'boutique' | 'docs' | 'historique'>('profil');
  const [vue, setVue]         = useState<'detail' | 'rejeter' | 'info' | 'snooze'>('detail');
  const [raisonRejet, setRaisonRejet] = useState('');
  const [msgInfo, setMsgInfo] = useState('');
  const [dateSnooze, setDateSnooze] = useState('');
  const [noteTexte, setNoteTexte]   = useState(demande.note_admin || '');
  const [noteSaved, setNoteSaved]   = useState(false);

  const onglets = [
    { id: 'profil',     label: '👤 Personnel'  },
    { id: 'boutique',   label: '🏪 Boutique'   },
    { id: 'docs',       label: '📄 Documents'  },
    { id: 'historique', label: '🕐 Historique' },
  ];

  const Row = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', borderBottom: '1px solid #f3f4f6', padding: '10px 0' }}>
      <span style={{ fontSize: '12px', color: T.textLight, fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '12px', color: highlight ? T.danger : T.text, fontWeight: highlight ? '700' : '400' }}>
        {value || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Non fourni</span>}
      </span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏪</div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '900', margin: 0 }}>{demande.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0' }}>{demande.email} · {demande.seller_id}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <RisqueBadge niveau={demande.scoreRisque} />
              <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {onglets.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id as any)}
                style={{ padding: '8px 14px', border: 'none', borderRadius: '8px 8px 0 0', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: onglet === o.id ? 'white' : 'transparent', color: onglet === o.id ? T.accent : 'rgba(255,255,255,0.65)', transition: 'all 0.15s' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {vue === 'detail' && (
            <>
              {/* ── Onglet Profil ── */}
              {onglet === 'profil' && (
                <div>
                  <Row label="Nom complet"     value={demande.nom} />
                  <Row label="Courriel"         value={demande.email} />
                  <Row label="Téléphone"        value={demande.telephone} />
                  <Row label="Adresse"          value={demande.adresse} highlight={!demande.adresse} />
                  <Row label="Ville / Province" value={`${demande.ville || ''}${demande.ville && demande.province ? ', ' : ''}${demande.province || ''} ${demande.code_postal || ''}`.trim()} />
                  <Row label="Plan choisi"      value={<PlanBadge plan={demande.plan} />} />
                  <Row label="Seller ID"        value={<code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{demande.seller_id}</code>} />
                </div>
              )}

              {/* ── Onglet Boutique ── */}
              {onglet === 'boutique' && (
                <div>
                  <Row label="Nom boutique"    value={demande.boutique} />
                  <Row label="Catégorie"       value={demande.categorie} />
                  <Row label="Type entreprise" value={demande.type_entreprise} />
                  <Row label="Zone expédition" value={demande.zone_expedition} />
                  <Row label="Description"     value={<span style={{ lineHeight: '1.6', display: 'block' }}>{demande.description}</span>} />
                  <Row label="Site web"        value={demande.site_web ? <a href={`https://${demande.site_web}`} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{demande.site_web}</a> : undefined} />
                  <Row label="Instagram"       value={demande.instagram} />
                  <Row label="Facebook"        value={demande.facebook} />
                  {demande.description && demande.description.length < 50 && (
                    <div style={{ marginTop: '12px', backgroundColor: '#fef9c3', border: '1px solid #d97706', borderRadius: '8px', padding: '10px 14px' }}>
                      <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', margin: 0 }}>
                        ⚠️ Description très courte ({demande.description.length} car.) — profil possiblement incomplet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Onglet Documents ── */}
              {onglet === 'docs' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: "Pièce d'identité",   ok: !!demande.type_entreprise, valeur: demande.type_entreprise, icon: '🪪' },
                      { label: 'Zone expédition',     ok: !!demande.zone_expedition,  valeur: demande.zone_expedition,  icon: '📦' },
                      { label: 'Téléphone',           ok: !!demande.telephone,        valeur: demande.telephone,        icon: '📞' },
                      { label: 'Adresse complète',    ok: !!demande.adresse,          valeur: demande.adresse,          icon: '🏠' },
                    ].map((doc, i) => (
                      <div key={i} style={{ border: `2px solid ${doc.ok ? '#bbf7d0' : '#fecaca'}`, borderRadius: '10px', padding: '14px 16px', backgroundColor: doc.ok ? '#f0fdf4' : '#fff5f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '18px' }}>{doc.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: T.text }}>{doc.label}</span>
                        </div>
                        {doc.ok
                          ? <p style={{ fontSize: '12px', color: T.success, fontWeight: '700', margin: 0 }}>✅ {doc.valeur}</p>
                          : <p style={{ fontSize: '12px', color: T.danger,  fontWeight: '700', margin: 0 }}>❌ Non fourni</p>}
                      </div>
                    ))}
                  </div>
                  {/* Score de complétude */}
                  {(() => {
                    const items = [!!demande.type_entreprise, !!demande.zone_expedition, !!demande.adresse, !!demande.telephone, !!(demande.site_web || demande.instagram), !!(demande.description && demande.description.length > 80)];
                    const score = items.filter(Boolean).length;
                    const pct   = Math.round((score / items.length) * 100);
                    return (
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: T.text }}>Complétude du dossier</span>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: pct >= 80 ? T.success : pct >= 60 ? T.warning : T.danger }}>{pct}%</span>
                        </div>
                        <div style={{ backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: pct >= 80 ? T.success : pct >= 60 ? T.warning : T.danger, height: '100%', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginTop: '10px' }}>
                          {[
                            { label: 'Type entreprise', ok: !!demande.type_entreprise },
                            { label: 'Zone expédition',  ok: !!demande.zone_expedition  },
                            { label: 'Adresse',          ok: !!demande.adresse          },
                            { label: 'Téléphone',        ok: !!demande.telephone        },
                            { label: 'Présence web',     ok: !!(demande.site_web || demande.instagram) },
                            { label: 'Bonne description',ok: !!(demande.description && demande.description.length > 80) },
                          ].map((item, i) => (
                            <span key={i} style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: item.ok ? '#dcfce7' : '#fee2e2', color: item.ok ? T.success : T.danger }}>
                              {item.ok ? '✓' : '✗'} {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── Onglet Historique ── */}
              {onglet === 'historique' && (
                <div>
                  {/* Timeline */}
                  <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, marginBottom: '12px' }}>Historique de la demande</p>
                  <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '24px' }}>
                    <div style={{ position: 'absolute', left: '9px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#e5e7eb' }} />
                    {[
                      { date: formaterDate(demande.created_at || demande.date_inscription), label: 'Demande soumise', detail: `Via formulaire d'inscription`, icon: '📝', color: T.accent },
                      ...(demande.derniere_relance ? [{ date: formaterDate(demande.derniere_relance), label: 'Email de rappel envoyé', detail: 'Relance automatique', icon: '📧', color: T.warning }] : []),
                      ...((demande.nb_tentatives || 0) > 1 ? [{ date: formaterDate(demande.created_at), label: `${demande.nb_tentatives} tentatives d'inscription`, detail: 'Plusieurs soumissions détectées', icon: '🔄', color: T.orange }] : []),
                      ...(demande.snooze_jusqu_au ? [{ date: formaterDate(demande.snooze_jusqu_au), label: 'Mis en liste d\'attente', detail: `Rappel prévu le ${formaterDate(demande.snooze_jusqu_au)}`, icon: '⏰', color: T.orange }] : []),
                      { date: 'Aujourd\'hui', label: 'En cours de révision', detail: 'Dossier ouvert par un administrateur', icon: '👁', color: T.purple },
                    ].map((ev, i) => (
                      <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-24px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: ev.color, border: '2px solid white', flexShrink: 0, zIndex: 1 }} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 2px 0' }}>{ev.icon} {ev.label}</p>
                          <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 1px 0' }}>{ev.detail}</p>
                          <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontStyle: 'italic' }}>{ev.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note admin */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>
                      📝 Note interne (admin seulement)
                    </label>
                    <textarea rows={4} value={noteTexte} onChange={e => { setNoteTexte(e.target.value); setNoteSaved(false); }}
                      placeholder="Ajouter une note sur ce dossier... (sauvegardée en base de données)"
                      style={{ width: '100%', border: `1px solid ${noteSaved ? T.success : T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button onClick={() => { onSauvegarderNote(noteTexte); setNoteSaved(true); }}
                        style={{ padding: '7px 16px', backgroundColor: noteSaved ? T.success : T.accent, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {noteSaved ? '✅ Sauvegardée' : '💾 Sauvegarder la note'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Vue Rejeter ── */}
          {vue === 'rejeter' && (
            <div>
              <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: T.danger, margin: '0 0 4px 0' }}>🚫 Rejeter la demande de {demande.nom}</p>
                <p style={{ fontSize: '12px', color: '#7f1d1d', margin: 0 }}>Le statut sera mis à "rejected" dans la BD. Un courriel pourra être envoyé automatiquement.</p>
              </div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px' }}>Raison du rejet *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['Documents incomplets ou manquants', 'Informations de boutique insuffisantes', 'Activité ou produits non conformes aux politiques', 'Profil incomplet (adresse, description, etc.)', 'Doublon de compte existant', 'Autre raison'].map(r => (
                  <div key={r} onClick={() => setRaisonRejet(r)}
                    style={{ padding: '10px 14px', border: `2px solid ${raisonRejet === r ? T.danger : T.border}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: raisonRejet === r ? '#fff5f5' : 'white', fontSize: '12px', fontWeight: raisonRejet === r ? '700' : '400', color: raisonRejet === r ? T.danger : T.text, transition: 'all 0.12s' }}>
                    {raisonRejet === r ? '● ' : '○ '}{r}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setVue('detail')} style={{ flex: 1, padding: '11px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>← Annuler</button>
                <button onClick={() => raisonRejet && onRejeter(raisonRejet)} disabled={!raisonRejet || loading}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: raisonRejet ? T.danger : '#fca5a5', color: 'white', fontSize: '13px', fontWeight: '700', cursor: raisonRejet ? 'pointer' : 'not-allowed' }}>
                  {loading ? '⏳ En cours…' : '🚫 Confirmer le rejet'}
                </button>
              </div>
            </div>
          )}

          {/* ── Vue Demander info ── */}
          {vue === 'info' && (
            <div>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', margin: '0 0 4px 0' }}>📧 Demander des informations supplémentaires</p>
                <p style={{ fontSize: '12px', color: '#1e40af', margin: 0 }}>Sera envoyé à <strong>{demande.email}</strong>. La demande sera marquée "Info demandée". (Configuration email à venir)</p>
              </div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>Message à envoyer</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  `Bonjour ${demande.nom}, nous avons besoin d'une pièce d'identité valide pour compléter votre dossier.`,
                  `Bonjour ${demande.nom}, votre description de boutique est trop courte. Merci de la détailler davantage.`,
                  `Bonjour ${demande.nom}, nous avons besoin de votre numéro d'entreprise du Québec (NEQ).`,
                  `Bonjour ${demande.nom}, votre adresse complète est requise pour finaliser votre inscription.`,
                ].map(m => (
                  <div key={m} onClick={() => setMsgInfo(m)}
                    style={{ padding: '10px 14px', border: `2px solid ${msgInfo === m ? T.accent : T.border}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: msgInfo === m ? T.accentLight : 'white', fontSize: '12px', color: T.text, transition: 'all 0.12s' }}>
                    {m}
                  </div>
                ))}
              </div>
              <textarea rows={4} value={msgInfo} onChange={e => setMsgInfo(e.target.value)}
                placeholder="Ou rédigez votre propre message..."
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setVue('detail')} style={{ flex: 1, padding: '11px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>← Annuler</button>
                <button onClick={() => msgInfo && onDemanderInfo(msgInfo)} disabled={!msgInfo}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: msgInfo ? T.accent : '#93c5fd', color: 'white', fontSize: '13px', fontWeight: '700', cursor: msgInfo ? 'pointer' : 'not-allowed' }}>
                  📧 Envoyer (bientôt disponible)
                </button>
              </div>
            </div>
          )}

          {/* ── Vue Snooze ── */}
          {vue === 'snooze' && (
            <div>
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: T.orange, margin: '0 0 4px 0' }}>⏰ Mettre en liste d'attente</p>
                <p style={{ fontSize: '12px', color: '#7c2d12', margin: 0 }}>La demande sera suspendue et vous recevrez un rappel à la date choisie.</p>
              </div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>Rappel le</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                {[
                  { label: '+3 jours', date: (() => { const d = new Date(); d.setDate(d.getDate()+3);  return d.toISOString().slice(0,10); })() },
                  { label: '+1 sem.',  date: (() => { const d = new Date(); d.setDate(d.getDate()+7);  return d.toISOString().slice(0,10); })() },
                  { label: '+2 sem.',  date: (() => { const d = new Date(); d.setDate(d.getDate()+14); return d.toISOString().slice(0,10); })() },
                  { label: '+1 mois', date: (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10); })() },
                ].map(opt => (
                  <button key={opt.label} onClick={() => setDateSnooze(opt.date)}
                    style={{ padding: '8px 14px', border: `2px solid ${dateSnooze === opt.date ? T.orange : T.border}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: dateSnooze === opt.date ? '#fff7ed' : 'white', fontSize: '12px', fontWeight: '700', color: dateSnooze === opt.date ? T.orange : T.textLight }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <input type="date" value={dateSnooze} onChange={e => setDateSnooze(e.target.value)}
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setVue('detail')} style={{ flex: 1, padding: '11px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>← Annuler</button>
                <button onClick={() => dateSnooze && onSnooze(dateSnooze)} disabled={!dateSnooze || loading}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: dateSnooze ? T.orange : '#fdba74', color: 'white', fontSize: '13px', fontWeight: '700', cursor: dateSnooze ? 'pointer' : 'not-allowed' }}>
                  {loading ? '⏳ En cours…' : '⏰ Mettre en attente'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {vue === 'detail' && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            <button onClick={() => setVue('rejeter')}
              style={{ padding: '10px 16px', border: `1px solid ${T.danger}`, borderRadius: '8px', backgroundColor: 'white', color: T.danger, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              🚫 Rejeter
            </button>
            <button onClick={() => setVue('info')}
              style={{ padding: '10px 16px', border: `1px solid ${T.accent}`, borderRadius: '8px', backgroundColor: 'white', color: T.accent, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              📧 Demander info
            </button>
            <button onClick={() => setVue('snooze')}
              style={{ padding: '10px 16px', border: `1px solid ${T.orange}`, borderRadius: '8px', backgroundColor: 'white', color: T.orange, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              ⏰ Snooze
            </button>
            <button onClick={onApprouver} disabled={loading}
              style={{ marginLeft: 'auto', padding: '10px 24px', border: 'none', borderRadius: '8px', backgroundColor: loading ? '#86efac' : T.success, color: 'white', fontSize: '13px', fontWeight: '800', cursor: loading ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
              {loading ? '⏳ Approbation…' : '✅ Approuver ce vendeur'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ApprobationsEnAttente({ naviguerVers }: ApprobationsEnAttenteProps) {
  const [demandes,       setDemandes]       = useState<DemandeVendeur[]>([]);
  const [chargement,     setChargement]     = useState(true);
  const [erreur,         setErreur]         = useState<string | null>(null);
  const [recherche,      setRecherche]      = useState('');
  const [filtreRisque,   setFiltreRisque]   = useState('tous');
  const [demandeOuverte, setDemandeOuverte] = useState<DemandeVendeur | null>(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'danger'|'info'|'orange' } | null>(null);

  const showToast = (msg: string, type: 'success'|'danger'|'info'|'orange') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Charger SEULEMENT les vendeurs pending ────────────────────────────────
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch(`${API}/api/vendeurs/pending`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setDemandes(data.map((v: any) => ({ ...v, scoreRisque: calculerScoreRisque(v) })));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Approuver ─────────────────────────────────────────────────────────────
  const handleApprouver = async (d: DemandeVendeur) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/vendeurs/${d.id}/approuver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ statut: 'actif' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      // Retirer de la liste (cette page = pending seulement)
      setDemandes(prev => prev.filter(v => v.id !== d.id));
      setDemandeOuverte(null);
      showToast(`✅ ${d.nom} approuvé(e) ! Compte activé — ${d.email}`, 'success');
    } catch (err) {
      showToast(`❌ Erreur : ${err instanceof Error ? err.message : 'Erreur'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Rejeter ───────────────────────────────────────────────────────────────
  const handleRejeter = async (d: DemandeVendeur, raison: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/vendeurs/${d.id}/approuver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ statut: 'rejected' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      setDemandes(prev => prev.filter(v => v.id !== d.id));
      setDemandeOuverte(null);
      showToast(`🚫 ${d.nom} rejeté(e). Raison : ${raison}`, 'danger');
    } catch (err) {
      showToast(`❌ Erreur : ${err instanceof Error ? err.message : 'Erreur'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Demander info (log seulement pour l'instant) ──────────────────────────
  const handleDemanderInfo = async (d: DemandeVendeur, msg: string) => {
    showToast(`📧 Message noté pour ${d.email}. (Envoi email à configurer)`, 'info');
    setDemandeOuverte(null);
  };

  // ── Snooze ────────────────────────────────────────────────────────────────
  const handleSnooze = async (d: DemandeVendeur, date: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/vendeurs/${d.id}/snooze`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ snooze_jusqu_au: date }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      setDemandes(prev => prev.filter(v => v.id !== d.id));
      setDemandeOuverte(null);
      showToast(`⏰ ${d.nom} mis en attente jusqu'au ${formaterDate(date)}`, 'orange');
    } catch (err) {
      showToast(`❌ Erreur : ${err instanceof Error ? err.message : 'Erreur'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Sauvegarder note ──────────────────────────────────────────────────────
  const handleSauvegarderNote = async (d: DemandeVendeur, note: string) => {
    try {
      const res = await fetch(`${API}/api/vendeurs/${d.id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ note_admin: note }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      setDemandes(prev => prev.map(v => v.id === d.id ? { ...v, note_admin: note } : v));
      showToast('💾 Note sauvegardée en base de données', 'info');
    } catch {
      showToast('❌ Erreur lors de la sauvegarde de la note', 'danger');
    }
  };

  // ── Filtres ───────────────────────────────────────────────────────────────
  const filtres = demandes.filter(d => {
    const s = recherche.toLowerCase();
    const inSearch = !s ||
      (d.nom || '').toLowerCase().includes(s) ||
      (d.email || '').toLowerCase().includes(s) ||
      (d.boutique || '').toLowerCase().includes(s) ||
      (d.seller_id || '').toLowerCase().includes(s);
    const inRisque = filtreRisque === 'tous' || d.scoreRisque === filtreRisque;
    return inSearch && inRisque;
  });

  const nbEleve  = demandes.filter(d => d.scoreRisque === 'eleve').length;
  const nbMoyen  = demandes.filter(d => d.scoreRisque === 'moyen').length;
  const nbFaible = demandes.filter(d => d.scoreRisque === 'faible').length;

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {demandeOuverte && (
        <ModalDetail
          demande={demandeOuverte}
          loading={actionLoading}
          onApprouver={() => handleApprouver(demandeOuverte)}
          onRejeter={r => handleRejeter(demandeOuverte, r)}
          onDemanderInfo={m => handleDemanderInfo(demandeOuverte, m)}
          onSnooze={date => handleSnooze(demandeOuverte, date)}
          onSauvegarderNote={note => handleSauvegarderNote(demandeOuverte, note)}
          onFermer={() => setDemandeOuverte(null)}
        />
      )}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              Approbations en attente
            </h1>
            <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>
              Vendeurs · Nouvelles demandes d'inscription · Données en direct
            </p>
          </div>
          <button onClick={charger} disabled={chargement}
            style={{ padding: '8px 16px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.accent, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            {chargement ? '⏳' : '🔄'} Actualiser
          </button>
        </div>

        {/* Erreur */}
        {erreur && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: T.danger, fontSize: '13px', fontWeight: '600' }}>
            ❌ {erreur} —{' '}
            <button onClick={charger} style={{ background: 'none', border: 'none', color: T.danger, cursor: 'pointer', fontWeight: '700', textDecoration: 'underline' }}>Réessayer</button>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'En attente',   val: demandes.length, icon: '⏳', c: T.warning, sous: 'À traiter'           },
            { label: 'Risque élevé', val: nbEleve,         icon: '🔴', c: T.danger,  sous: 'Priorité haute'      },
            { label: 'Risque moyen', val: nbMoyen,         icon: '🟡', c: T.orange,  sous: 'À surveiller'        },
            { label: 'Risque faible',val: nbFaible,        icon: '🟢', c: T.success, sous: 'Dossiers complets'   },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
                <p style={{ fontSize: '26px', fontWeight: '900', color: T.text, margin: 0 }}>{chargement ? '…' : k.val}</p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, margin: '0 0 1px 0' }}>{k.label}</p>
              <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, boutique, email, seller ID..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px 8px 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <select value={filtreRisque} onChange={e => setFiltreRisque(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
            <option value="tous">Tous les risques</option>
            <option value="faible">🟢 Risque faible</option>
            <option value="moyen">🟡 Risque moyen</option>
            <option value="eleve">🔴 Risque élevé</option>
          </select>
          {(recherche || filtreRisque !== 'tous') && (
            <button onClick={() => { setRecherche(''); setFiltreRisque('tous'); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, backgroundColor: 'white', color: T.textLight, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
              ✕ Réinitialiser
            </button>
          )}
          <p style={{ fontSize: '12px', color: T.textLight, margin: 0, marginLeft: 'auto', whiteSpace: 'nowrap' as const }}>
            <strong>{filtres.length}</strong> / {demandes.length} demandes
          </p>
        </div>

        {/* Tableau */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {chargement ? (
            <div style={{ padding: '60px', textAlign: 'center', color: T.textLight }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Chargement depuis la base de données…</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}`, backgroundColor: '#f8fafc' }}>
                    {['Vendeur', 'Boutique', 'Plan', 'Risque', 'Date demande', 'Note', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: T.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtres.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '50px', textAlign: 'center', color: T.textLight }}>
                      {demandes.length === 0 ? '🎉 Aucune demande en attente' : '🔍 Aucun résultat'}
                    </td></tr>
                  ) : filtres.map((d, i) => (
                    <tr key={d.id}
                      style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa')}>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: T.accent, flexShrink: 0 }}>
                            {(d.nom || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{d.nom}</p>
                            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{d.email}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{d.boutique || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Non fourni</span>}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{d.seller_id}</p>
                      </td>

                      <td style={{ padding: '12px 16px' }}><PlanBadge plan={d.plan} /></td>
                      <td style={{ padding: '12px 16px' }}><RisqueBadge niveau={d.scoreRisque} /></td>

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textLight, whiteSpace: 'nowrap' as const }}>
                        {formaterDate(d.created_at || d.date_inscription)}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {d.note_admin
                          ? <span style={{ fontSize: '11px', backgroundColor: '#fef9c3', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>📝 Note</span>
                          : <span style={{ fontSize: '11px', color: '#ddd' }}>—</span>}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setDemandeOuverte(d)}
                            style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                            👁 Réviser
                          </button>
                          <button onClick={() => handleApprouver(d)} disabled={actionLoading}
                            style={{ backgroundColor: '#dcfce7', color: T.success, border: `1px solid ${T.success}`, borderRadius: '7px', padding: '7px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            ✅
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Légende */}
        <div style={{ marginTop: '16px', backgroundColor: T.card, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', gap: '20px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const }}>Score de risque :</span>
          <span style={{ fontSize: '11px', color: T.textLight }}>🟢 <strong>Faible</strong> — Dossier complet, toutes les infos présentes</span>
          <span style={{ fontSize: '11px', color: T.textLight }}>🟡 <strong>Moyen</strong> — Quelques éléments manquants</span>
          <span style={{ fontSize: '11px', color: T.textLight }}>🔴 <strong>Élevé</strong> — Données insuffisantes, vérification requise</span>
        </div>
      </div>
    </>
  );
}
