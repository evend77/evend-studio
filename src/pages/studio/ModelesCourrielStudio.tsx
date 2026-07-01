// src/pages/studio/ModelesCourrielStudio.tsx
// e-Vend Studio — Gestion des modèles de courriel pour le vendeur
// Templates : confirmation réservation, rappel, annulation

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const COULEUR = '#c9a96e';

type TypeTemplate = 'confirmation' | 'rappel' | 'annulation' | 'bienvenue';

interface TemplateCourriel {
  type: TypeTemplate;
  sujet: string;
  html: string;
  actif: boolean;
}

const TEMPLATES_DEFAUT: Record<TypeTemplate, TemplateCourriel> = {
  confirmation: {
    type: 'confirmation',
    actif: true,
    sujet: 'Votre réservation est confirmée ✅',
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
  <div style="background:{$couleur};padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">{$nomSite}</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="color:#1a1a1a">Bonjour {$nomClient} 👋</h2>
    <p style="color:#555;margin:16px 0">Votre réservation a bien été confirmée. Voici le récapitulatif :</p>
    <div style="background:#f8f8f6;border-left:4px solid {$couleur};padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
      <p><strong>📅 Date :</strong> {$dateReservation}</p>
      <p style="margin-top:8px"><strong>👥 Personnes :</strong> {$nbPersonnes}</p>
      <p style="margin-top:8px"><strong>📋 Réf. :</strong> #{$idReservation}</p>
    </div>
    <p style="color:#555">{$notesSupplementaires}</p>
    <p style="margin-top:24px;color:#888;font-size:13px">À bientôt!<br><strong>{$nomSite}</strong></p>
  </div>
  <div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center">
    <p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p>
  </div>
</div>`,
  },
  rappel: {
    type: 'rappel',
    actif: true,
    sujet: 'Rappel — Votre réservation demain 🔔',
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
  <div style="background:{$couleur};padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">{$nomSite}</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="color:#1a1a1a">🔔 Rappel de réservation</h2>
    <p style="color:#555;margin:16px 0">Bonjour <strong>{$nomClient}</strong>, nous vous rappelons votre réservation de demain :</p>
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:16px 20px;margin:20px 0;border-radius:8px">
      <p style="font-size:16px;font-weight:700;color:#856404">📅 {$dateReservation}</p>
      <p style="margin-top:8px;color:#856404">👥 {$nbPersonnes} personne(s)</p>
    </div>
    <p style="color:#555">Pour toute question, contactez-nous directement.</p>
    <p style="margin-top:24px;color:#888;font-size:13px">À demain!<br><strong>{$nomSite}</strong></p>
  </div>
  <div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center">
    <p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p>
  </div>
</div>`,
  },
  annulation: {
    type: 'annulation',
    actif: true,
    sujet: 'Votre réservation a été annulée',
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">{$nomSite}</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="color:#1a1a1a">Réservation annulée</h2>
    <p style="color:#555;margin:16px 0">Bonjour <strong>{$nomClient}</strong>, votre réservation du <strong>{$dateReservation}</strong> a été annulée.</p>
    <p style="color:#555">Si vous souhaitez effectuer une nouvelle réservation, n'hésitez pas à nous contacter.</p>
    <p style="margin-top:24px;color:#888;font-size:13px">Cordialement,<br><strong>{$nomSite}</strong></p>
  </div>
  <div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center">
    <p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p>
  </div>
</div>`,
  },
  bienvenue: {
    type: 'bienvenue',
    actif: true,
    sujet: 'Bienvenue chez {$nomSite} 🎉',
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
  <div style="background:{$couleur};padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">{$nomSite}</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:48px">🎉</div>
      <h2 style="color:#1a1a1a;margin-top:12px">Bienvenue!</h2>
    </div>
    <p style="color:#555;margin:16px 0">Bonjour <strong>{$nomClient}</strong>, merci de nous faire confiance. Nous avons hâte de vous accueillir!</p>
    <p style="margin-top:24px;color:#888;font-size:13px">L'équipe de <strong>{$nomSite}</strong></p>
  </div>
  <div style="background:#f8f8f6;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:16px 32px;text-align:center">
    <p style="font-size:11px;color:#aaa">Propulsé par e-Vend Studio</p>
  </div>
</div>`,
  },
};

const TYPE_CONFIG: Record<TypeTemplate, { label: string; icone: string; couleur: string }> = {
  confirmation: { label: 'Confirmation',  icone: '✅', couleur: '#16a34a' },
  rappel:       { label: 'Rappel',        icone: '🔔', couleur: '#d97706' },
  annulation:   { label: 'Annulation',    icone: '❌', couleur: '#dc2626' },
  bienvenue:    { label: 'Bienvenue',     icone: '🎉', couleur: '#6366f1' },
};

const VARIABLES = [
  { cle: '{$nomClient}',         desc: 'Nom du client' },
  { cle: '{$emailClient}',       desc: 'Email du client' },
  { cle: '{$dateReservation}',   desc: 'Date et heure de la réservation' },
  { cle: '{$nbPersonnes}',       desc: 'Nombre de personnes' },
  { cle: '{$idReservation}',     desc: 'Numéro de réservation' },
  { cle: '{$nomSite}',           desc: 'Nom de votre site/entreprise' },
  { cle: '{$couleur}',           desc: 'Couleur principale de votre site' },
  { cle: '{$notesSupplementaires}', desc: 'Notes supplémentaires du client' },
];

export default function ModelesCourrielStudio({ vendeurId }: { vendeurId: number }) {
  const [typeActif, setTypeActif] = useState<TypeTemplate>('confirmation');
  const [templates, setTemplates] = useState<Record<TypeTemplate, TemplateCourriel>>(TEMPLATES_DEFAUT);
  const [onglet, setOnglet] = useState<'editeur' | 'preview' | 'variables'>('editeur');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [emailTest, setEmailTest] = useState('');
  const [envoi, setEnvoi] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const template = templates[typeActif];

  const majTemplate = (champ: keyof TemplateCourriel, valeur: any) => {
    setTemplates(prev => ({ ...prev, [typeActif]: { ...prev[typeActif], [champ]: valeur } }));
    setSauvegarde('idle');
  };

  const sauvegarder = async () => {
    setSauvegarde('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/modeles-courriel/${vendeurId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(templates),
      });
      if (!res.ok) throw new Error();
      setSauvegarde('saved');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('error');
    }
  };

  const envoyerTest = async () => {
    if (!emailTest) return;
    setEnvoi('sending');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: typeActif, destinataire: emailTest, template }),
      });
      if (!res.ok) throw new Error();
      setEnvoi('sent');
      setTimeout(() => setEnvoi('idle'), 4000);
    } catch {
      setEnvoi('error');
    }
  };

  const insererVariable = (cle: string) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const newHtml = template.html.substring(0, start) + cle + template.html.substring(end);
    majTemplate('html', newHtml);
    setTimeout(() => { textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + cle.length; }, 10);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: '28px 32px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* EN-TÊTE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📧 Modèles de courriel</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Personnalisez les emails envoyés automatiquement à vos clients.</p>
        </div>
        <button onClick={sauvegarder} disabled={sauvegarde === 'saving'}
          style={{ padding: '10px 24px', background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : COULEUR, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* SIDEBAR types */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {(Object.keys(TYPE_CONFIG) as TypeTemplate[]).map(type => {
              const cfg = TYPE_CONFIG[type];
              const actif = typeActif === type;
              return (
                <div key={type} onClick={() => setTypeActif(type)}
                  style={{ padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: actif ? `${COULEUR}12` : '#fff', borderLeft: actif ? `3px solid ${COULEUR}` : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 20 }}>{cfg.icone}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: actif ? 700 : 500, color: actif ? '#1a1a1a' : '#555', margin: 0 }}>{cfg.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: templates[type].actif ? '#22c55e' : '#aaa' }} />
                      <span style={{ fontSize: 10, color: '#aaa' }}>{templates[type].actif ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test email */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px', marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>🧪 Tester l'email</p>
            <input value={emailTest} onChange={e => setEmailTest(e.target.value)} placeholder="votre@email.com"
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', marginBottom: 10 }} />
            <button onClick={envoyerTest} disabled={!emailTest || envoi === 'sending'}
              style={{ width: '100%', padding: '9px', background: envoi === 'sent' ? '#22c55e' : envoi === 'error' ? '#ef4444' : '#1a1a1a', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {envoi === 'sending' ? '⏳...' : envoi === 'sent' ? '✓ Envoyé!' : envoi === 'error' ? '✕ Erreur' : '📤 Envoyer test'}
            </button>
          </div>
        </div>

        {/* ÉDITEUR PRINCIPAL */}
        <div style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

            {/* Header template */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{TYPE_CONFIG[typeActif].icone}</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{TYPE_CONFIG[typeActif].label}</h2>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{template.actif ? 'Actif' : 'Inactif'}</span>
                <div onClick={() => majTemplate('actif', !template.actif)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: template.actif ? COULEUR : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: template.actif ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </label>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
              {([['editeur', '✏️ Éditeur'], ['preview', '👁 Aperçu'], ['variables', '📋 Variables']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setOnglet(id)}
                  style={{ padding: '12px 20px', border: 'none', background: 'transparent', borderBottom: onglet === id ? `2px solid ${COULEUR}` : '2px solid transparent', color: onglet === id ? COULEUR : '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>

              {/* ÉDITEUR */}
              {onglet === 'editeur' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Sujet de l'email</label>
                    <input value={template.sujet} onChange={e => majTemplate('sujet', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = COULEUR} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Corps HTML de l'email</label>
                    <textarea id="html-editor" value={template.html} onChange={e => majTemplate('html', e.target.value)} rows={18}
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = COULEUR} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {VARIABLES.slice(0, 5).map(v => (
                      <button key={v.cle} onClick={() => insererVariable(v.cle)}
                        style={{ padding: '4px 12px', border: `1px solid ${COULEUR}40`, borderRadius: 20, background: `${COULEUR}10`, color: COULEUR, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        + {v.cle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* APERÇU */}
              {onglet === 'preview' && (
                <div>
                  <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f7f7f5', borderRadius: 8, fontSize: 13 }}>
                    <strong>Sujet :</strong> {template.sujet.replace('{$nomSite}', 'Mon Restaurant')}
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <iframe
                      srcDoc={template.html
                        .replace(/\{\$nomClient\}/g, 'Marie Dupont')
                        .replace(/\{\$emailClient\}/g, 'marie@exemple.com')
                        .replace(/\{\$dateReservation\}/g, 'Vendredi 14 juin 2026 à 19h30')
                        .replace(/\{\$nbPersonnes\}/g, '4')
                        .replace(/\{\$idReservation\}/g, '1042')
                        .replace(/\{\$nomSite\}/g, 'Mon Restaurant')
                        .replace(/\{\$couleur\}/g, COULEUR)
                        .replace(/\{\$notesSupplementaires\}/g, 'Table près de la fenêtre svp.')
                      }
                      style={{ width: '100%', height: 500, border: 'none' }}
                      title="Aperçu email"
                    />
                  </div>
                </div>
              )}

              {/* VARIABLES */}
              {onglet === 'variables' && (
                <div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Cliquez sur une variable pour la copier, puis collez-la dans votre email.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {VARIABLES.map(v => (
                      <div key={v.cle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f7f7f5', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <div>
                          <code style={{ fontSize: 13, fontWeight: 700, color: COULEUR, background: `${COULEUR}15`, padding: '2px 8px', borderRadius: 4 }}>{v.cle}</code>
                          <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{v.desc}</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(v.cle); }}
                          style={{ padding: '6px 14px', border: `1px solid ${COULEUR}40`, borderRadius: 6, background: '#fff', color: COULEUR, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          Copier
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}