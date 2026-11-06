// CHEMIN : src/pages/gestionnaire/StudioModelesCourriel.tsx
// e-Vend Studio — Dashboard gestionnaire (multivendeur) : modèles de courriel de la boutique + serveur d'envoi (SMTP)
// API : /api/studio/courriels/:gestionnaireId/...

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

interface Variable { cle: string; desc: string }
interface Section { cle: string; label: string; icone: string; couleur: string }
interface Modele {
  cle: string; section: string; nom: string; destinataire: 'acheteur' | 'collaborateur' | 'gestionnaire';
  branche: boolean; variables: Variable[]; sujet: string; html: string; actif: boolean; modifie: boolean;
}
interface Smtp {
  host: string; port: number; utilisateur: string; mot_de_passe_defini: boolean;
  expediteur_email: string; expediteur_nom: string; actif: boolean; derniere_verification: string | null;
}

const C = {
  accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.12)', green: '#10b981', red: '#ef4444', orange: '#f59e0b',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
};
const DEST: Record<string, string> = { acheteur: 'Acheteur', collaborateur: 'Collaborateur', gestionnaire: 'Gestionnaire' };

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const champ: React.CSSProperties = { width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' };
const btn = (primaire: boolean, off?: boolean): React.CSSProperties => ({
  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.55 : 1,
  border: primaire ? 'none' : `1px solid ${C.border}`, background: primaire ? C.accent : '#fff', color: primaire ? '#fff' : C.text,
});

interface Props { gestionnaireId: number }

const StudioModelesCourriel: React.FC<Props> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/courriels/${gestionnaireId}`;
  const [sections, setSections] = useState<Section[]>([]);
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState('');
  const [sectionActive, setSectionActive] = useState('');
  const [selection, setSelection] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<'apercu' | 'editeur' | 'variables'>('apercu');
  const [sujet, setSujet] = useState('');
  const [html, setHtml] = useState('');
  const [sauvegarde, setSauvegarde] = useState(false);
  const [apercu, setApercu] = useState<{ sujet: string; html: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [popupReinit, setPopupReinit] = useState(false);
  const [popupTest, setPopupTest] = useState(false);
  const [destTest, setDestTest] = useState('');
  const [envoiTest, setEnvoiTest] = useState(false);
  const [vueSmtp, setVueSmtp] = useState(false);
  const [smtp, setSmtp] = useState<Smtp | null>(null);
  const refHtml = useRef<HTMLTextAreaElement>(null);

  const afficher = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const charger = useCallback(async () => {
    setChargement(true); setErreurChargement('');
    try {
      const [r, s] = await Promise.all([
        fetch(`${base}/modeles`, { credentials: 'include', headers: entetes() }),
        fetch(`${base}/smtp`, { credentials: 'include', headers: entetes() }),
      ]);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur de chargement.');
      setSections(d.sections); setModeles(d.modeles);
      setSectionActive((a) => a || (d.sections[0] && d.sections[0].cle) || '');
      if (s.ok) setSmtp((await s.json()).smtp);
    } catch (e: any) { setErreurChargement(e.message || 'Erreur de chargement.'); }
    setChargement(false);
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const modele = modeles.find((m) => m.cle === selection) || null;
  const choisir = (m: Modele) => { setSelection(m.cle); setSujet(m.sujet); setHtml(m.html); setOnglet('apercu'); setVueSmtp(false); };
  const modifie = !!modele && (sujet !== modele.sujet || html !== modele.html);

  // Aperçu (rendu côté serveur avec valeurs d'exemple)
  useEffect(() => {
    if (!modele || onglet !== 'apercu') return;
    let annule = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${base}/apercu`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify({ sujet, html }) });
        const d = await r.json();
        if (!annule && r.ok) setApercu(d);
      } catch { /* ignore */ }
    }, 250);
    return () => { annule = true; clearTimeout(t); };
  }, [base, modele, onglet, sujet, html]);

  const enregistrer = async (m: Modele, patch: Partial<Pick<Modele, 'sujet' | 'html' | 'actif'>>) => {
    const corps = { sujet: patch.sujet ?? m.sujet, html: patch.html ?? m.html, actif: patch.actif ?? m.actif };
    const r = await fetch(`${base}/modeles/${m.cle}`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify(corps) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Erreur.');
    setModeles((l) => l.map((x) => (x.cle === m.cle ? { ...x, ...corps, html: d.html || corps.html, modifie: true } : x)));
    return d;
  };

  const sauver = async () => {
    if (!modele) return;
    setSauvegarde(true);
    try { const d = await enregistrer(modele, { sujet, html }); setHtml(d.html || html); afficher('Modèle enregistré ✅'); }
    catch (e: any) { afficher(e.message, false); }
    setSauvegarde(false);
  };

  const basculer = async (m: Modele) => {
    try { await enregistrer(m, { actif: !m.actif }); afficher(!m.actif ? 'Modèle activé' : 'Modèle désactivé'); }
    catch (e: any) { afficher(e.message, false); }
  };

  const reinitialiser = async () => {
    if (!modele) return;
    try {
      const r = await fetch(`${base}/modeles/${modele.cle}/reinitialiser`, { method: 'POST', credentials: 'include', headers: entetes() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur.');
      setModeles((l) => l.map((x) => (x.cle === modele.cle ? { ...x, sujet: d.sujet, html: d.html, modifie: false } : x)));
      setSujet(d.sujet); setHtml(d.html); afficher('Modèle remis à zéro');
    } catch (e: any) { afficher(e.message, false); }
    setPopupReinit(false);
  };

  const envoyerTest = async () => {
    if (!modele) return;
    setEnvoiTest(true);
    try {
      const r = await fetch(`${base}/modeles/${modele.cle}/test`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify({ destinataire: destTest, sujet, html }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur.');
      afficher('Courriel de test envoyé 📨'); setPopupTest(false);
    } catch (e: any) { afficher(e.message, false); }
    setEnvoiTest(false);
  };

  const inserer = (cle: string) => {
    const ta = refHtml.current; const v = `{$${cle}}`;
    if (!ta) { setHtml((h) => h + v); return; }
    const a = ta.selectionStart, b = ta.selectionEnd;
    setHtml(html.slice(0, a) + v + html.slice(b));
    setOnglet('editeur');
    setTimeout(() => { ta.focus(); ta.setSelectionRange(a + v.length, a + v.length); }, 0);
  };

  if (chargement) return <div style={{ padding: 40, color: C.textLight }}>Chargement…</div>;
  if (erreurChargement) return <div style={{ padding: 40, color: C.red }}>{erreurChargement} <button style={btn(false)} onClick={charger}>Réessayer</button></div>;

  const liste = modeles.filter((m) => m.section === sectionActive);
  const smtpOk = !!(smtp && smtp.actif);

  return (
    <div style={{ padding: 24, background: C.bg, minHeight: '100%', color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>📧 Modèles de courriel</h2>
          <div style={{ color: C.textLight, fontSize: 13, marginTop: 4 }}>Personnalisez les messages envoyés aux acheteurs et collaborateurs de votre boutique.</div>
        </div>
        <button style={btn(false)} onClick={() => { setVueSmtp(true); setSelection(null); }}>⚙️ Serveur d'envoi (SMTP)</button>
      </div>

      {!smtpOk && (
        <div style={{ background: '#fffbeb', border: `1px solid ${C.orange}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          ⚠️ <strong>Aucun courriel ne sera envoyé</strong> tant que votre serveur d'envoi n'est pas configuré et activé.{' '}
          <a href="#smtp" onClick={(e) => { e.preventDefault(); setVueSmtp(true); setSelection(null); }} style={{ color: C.accent, fontWeight: 600 }}>Configurer maintenant</a>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {sections.map((s) => (
          <button key={s.cle} onClick={() => { setSectionActive(s.cle); setSelection(null); setVueSmtp(false); }}
            style={{ ...btn(sectionActive === s.cle && !vueSmtp), background: sectionActive === s.cle && !vueSmtp ? s.couleur : '#fff', color: sectionActive === s.cle && !vueSmtp ? '#fff' : C.text }}>
            {s.icone} {s.label}
          </button>
        ))}
      </div>

      {vueSmtp ? (
        <PanneauSmtp base={base} smtp={smtp} onSauve={(s) => setSmtp(s)} afficher={afficher} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,320px) 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {liste.map((m) => (
              <div key={m.cle} onClick={() => choisir(m)} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: selection === m.cle ? C.accentLight : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.nom}</div>
                  <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} title={m.actif ? 'Actif' : 'Désactivé'}>
                    <input type="checkbox" checked={m.actif} onChange={() => basculer(m)} />
                  </label>
                </div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span>→ {DEST[m.destinataire]}</span>
                  {m.modifie && <span style={{ color: C.accent }}>• personnalisé</span>}
                  {!m.branche && <span style={{ color: C.orange }}>• pas encore envoyé automatiquement</span>}
                </div>
              </div>
            ))}
            {liste.length === 0 && <div style={{ padding: 20, color: C.textMuted, fontSize: 13 }}>Aucun modèle dans cette section.</div>}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, minHeight: 300 }}>
            {!modele ? (
              <div style={{ color: C.textMuted, textAlign: 'center', padding: 60 }}>Choisissez un modèle à gauche pour le voir ou le modifier.</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 17 }}>{modele.nom}</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={btn(false)} onClick={() => setPopupTest(true)}>📨 Envoyer un test</button>
                    <button style={btn(false)} onClick={() => setPopupReinit(true)}>↩︎ Réinitialiser</button>
                    <button style={btn(true, !modifie || sauvegarde)} disabled={!modifie || sauvegarde} onClick={sauver}>{sauvegarde ? 'Enregistrement…' : '💾 Enregistrer'}</button>
                  </div>
                </div>
                {!modele.branche && (
                  <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.textLight, marginBottom: 12 }}>
                    ℹ️ Ce modèle est prêt à être modifié, mais l'envoi automatique n'est pas encore branché. Il sera utilisé dès l'activation de la fonction correspondante.
                  </div>
                )}
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textLight }}>Sujet</label>
                <input style={{ ...champ, marginBottom: 12 }} value={sujet} maxLength={200} onChange={(e) => setSujet(e.target.value)} />

                <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                  {(['apercu', 'editeur', 'variables'] as const).map((o) => (
                    <button key={o} onClick={() => setOnglet(o)} style={{ padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: onglet === o ? C.accent : C.textLight, borderBottom: onglet === o ? `2px solid ${C.accent}` : '2px solid transparent' }}>
                      {o === 'apercu' ? '👁 Aperçu' : o === 'editeur' ? '✏️ Éditeur' : '🔖 Variables'}
                    </button>
                  ))}
                </div>

                {onglet === 'apercu' && (
                  <div>
                    <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Sujet :</strong> {apercu ? apercu.sujet : '…'}</div>
                    <iframe title="Aperçu" sandbox="" srcDoc={apercu ? apercu.html : ''} style={{ width: '100%', height: 480, border: `1px solid ${C.border}`, borderRadius: 8, background: '#f1f5f9' }} />
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Aperçu avec des valeurs d'exemple.</div>
                  </div>
                )}
                {onglet === 'editeur' && (
                  <div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {modele.variables.map((v) => (
                        <button key={v.cle} title={v.desc} onClick={() => inserer(v.cle)} style={{ ...btn(false), padding: '4px 8px', fontSize: 11 }}>{`{$${v.cle}}`}</button>
                      ))}
                    </div>
                    <textarea ref={refHtml} value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false}
                      style={{ ...champ, height: 420, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12, resize: 'vertical' }} />
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Cliquez sur une variable pour l'insérer là où se trouve le curseur. Les balises &lt;script&gt;, &lt;style&gt; et les formulaires sont retirés à l'enregistrement.</div>
                  </div>
                )}
                {onglet === 'variables' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {modele.variables.map((v) => (
                        <tr key={v.cle} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '8px 4px', fontFamily: 'ui-monospace,Menlo,monospace', whiteSpace: 'nowrap' }}>{`{$${v.cle}}`}</td>
                          <td style={{ padding: '8px 4px', color: C.textLight }}>{v.desc}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right' }}><button style={{ ...btn(false), padding: '4px 8px', fontSize: 11 }} onClick={() => inserer(v.cle)}>Insérer</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {popupReinit && (
        <Fenetre onFermer={() => setPopupReinit(false)} titre="Réinitialiser ce modèle ?">
          <p style={{ fontSize: 14, color: C.textLight }}>Vos modifications seront remplacées par le texte de base. Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={btn(false)} onClick={() => setPopupReinit(false)}>Annuler</button>
            <button style={{ ...btn(true), background: C.red }} onClick={reinitialiser}>Réinitialiser</button>
          </div>
        </Fenetre>
      )}
      {popupTest && (
        <Fenetre onFermer={() => setPopupTest(false)} titre="Envoyer un courriel de test">
          <p style={{ fontSize: 13, color: C.textLight }}>Envoyé avec votre serveur SMTP, avec des valeurs d'exemple (le texte actuellement à l'écran).</p>
          <input style={{ ...champ, marginBottom: 14 }} type="email" placeholder="votre@courriel.com" value={destTest} onChange={(e) => setDestTest(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={btn(false)} onClick={() => setPopupTest(false)}>Annuler</button>
            <button style={btn(true, envoiTest || !destTest)} disabled={envoiTest || !destTest} onClick={envoyerTest}>{envoiTest ? 'Envoi…' : 'Envoyer'}</button>
          </div>
        </Fenetre>
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 14, zIndex: 3000, boxShadow: '0 4px 14px rgba(0,0,0,.2)' }}>{toast.msg}</div>
      )}
    </div>
  );
};

const Fenetre: React.FC<{ titre: string; onFermer: () => void; children: React.ReactNode }> = ({ titre, onFermer, children }) => (
  <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 22, width: '100%', maxWidth: 440 }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 17 }}>{titre}</h3>
      {children}
    </div>
  </div>
);

// ── Panneau SMTP ─────────────────────────────────────────────────────────────
const PanneauSmtp: React.FC<{ base: string; smtp: Smtp | null; onSauve: (s: Smtp) => void; afficher: (m: string, ok?: boolean) => void }> = ({ base, smtp, onSauve, afficher }) => {
  const [f, setF] = useState({
    host: smtp?.host || '', port: smtp?.port || 587, utilisateur: smtp?.utilisateur || '', mot_de_passe: '',
    expediteur_email: smtp?.expediteur_email || '', expediteur_nom: smtp?.expediteur_nom || '', actif: smtp ? smtp.actif : true,
  });
  const [enCours, setEnCours] = useState(false);
  const [dest, setDest] = useState('');
  const [test, setTest] = useState(false);
  const maj = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));

  const sauver = async () => {
    setEnCours(true);
    try {
      const r = await fetch(`${base}/smtp`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify({ ...f, port: Number(f.port) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur.');
      onSauve(d.smtp); maj('mot_de_passe', ''); afficher('Réglages SMTP enregistrés ✅');
    } catch (e: any) { afficher(e.message, false); }
    setEnCours(false);
  };
  const tester = async () => {
    setTest(true);
    try {
      const r = await fetch(`${base}/smtp/tester`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify({ destinataire: dest }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur.');
      afficher('Connexion réussie, courriel de test envoyé 📨');
    } catch (e: any) { afficher(e.message, false); }
    setTest(false);
  };

  const L = (t: string) => <label style={{ fontSize: 12, fontWeight: 600, color: C.textLight, display: 'block', marginBottom: 4 }}>{t}</label>;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, maxWidth: 680 }}>
      <h3 style={{ margin: '0 0 6px 0' }}>⚙️ Serveur d'envoi (SMTP)</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: 13, color: C.textLight }}>
        Les courriels de votre boutique partent de <strong>votre</strong> serveur (Gmail, Outlook, votre hébergeur, Brevo, Mailgun, Amazon SES…). Demandez les informations SMTP à votre fournisseur.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 12 }}>
        <div>{L('Serveur (ex. smtp.exemple.com)')}<input style={champ} value={f.host} onChange={(e) => maj('host', e.target.value)} /></div>
        <div>{L('Port')}
          <select style={champ} value={f.port} onChange={(e) => maj('port', Number(e.target.value))}>
            {[587, 465, 2525, 25].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>{L('Utilisateur')}<input style={champ} autoComplete="off" value={f.utilisateur} onChange={(e) => maj('utilisateur', e.target.value)} /></div>
        <div>{L('Mot de passe')}<input style={champ} type="password" autoComplete="new-password" placeholder={smtp?.mot_de_passe_defini ? '•••••••• (inchangé)' : ''} value={f.mot_de_passe} onChange={(e) => maj('mot_de_passe', e.target.value)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>{L("Adresse d'expédition")}<input style={champ} type="email" value={f.expediteur_email} onChange={(e) => maj('expediteur_email', e.target.value)} /></div>
        <div>{L("Nom d'expéditeur")}<input style={champ} value={f.expediteur_nom} onChange={(e) => maj('expediteur_nom', e.target.value)} /></div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 16 }}>
        <input type="checkbox" checked={f.actif} onChange={(e) => maj('actif', e.target.checked)} /> Activer l'envoi des courriels de ma boutique
      </label>
      <button style={btn(true, enCours)} disabled={enCours} onClick={sauver}>{enCours ? 'Enregistrement…' : '💾 Enregistrer'}</button>

      {smtp && (
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Tester la connexion</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...champ, flex: 1, minWidth: 200 }} type="email" placeholder="Envoyer un test à…" value={dest} onChange={(e) => setDest(e.target.value)} />
            <button style={btn(false, test || !dest)} disabled={test || !dest} onClick={tester}>{test ? 'Test…' : '📨 Tester'}</button>
          </div>
          {smtp.derniere_verification && <div style={{ fontSize: 12, color: C.green, marginTop: 8 }}>Dernier test réussi : {new Date(smtp.derniere_verification).toLocaleString('fr-CA')}</div>}
        </div>
      )}
      <div style={{ marginTop: 18, fontSize: 12, color: C.textMuted }}>🔒 Votre mot de passe est chiffré et n'est jamais affiché. Limite d'envoi : 300 courriels par heure.</div>
    </div>
  );
};

export default StudioModelesCourriel;