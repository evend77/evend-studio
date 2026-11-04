import React, { useState, useRef, useCallback, useEffect } from 'react';

// ── Réutilise les mêmes couleurs que le reste du dashboard admin ──────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626', dangerLight: '#fee2e2',
};

const API = '/api';

interface ImageJointe { id: string; file: File; preview: string; }
interface DocJoint { id: string; file: File; }
interface Abonne {
  id: number;
  email: string;
  actif: boolean;
  source?: string;
  date_inscription: string;
  date_desabonnement?: string | null;
}
interface EchecEnvoi { email: string; erreur: string; }
interface Campagne {
  id: number;
  sujet: string;
  mode: 'tous' | 'manuel';
  total: number;
  envoyes: number;
  echecs: number;
  echecs_emails?: EchecEnvoi[];
  message?: string;
  images_apercu?: { nom: string; url: string }[];
  // Anciennes campagnes : noms seulement (string). Nouvelles : { nom, url } (url = PDF ouvrable).
  documents_noms?: (string | { nom: string; url?: string | null })[];
  statut: 'en_cours' | 'termine' | 'erreur';
  date_debut: string;
  date_fin?: string | null;
}

export default function PageMarketing() {
  // ═══════════════════════════════════════════════════════════════════════
  // ── COMPOSER UNE CAMPAGNE ──
  // ═══════════════════════════════════════════════════════════════════════
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'tous' | 'manuel'>('tous');
  const [destinatairesManuel, setDestinatairesManuel] = useState('');
  const [images, setImages] = useState<ImageJointe[]>([]);
  const [documents, setDocuments] = useState<DocJoint[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [statutEnvoi, setStatutEnvoi] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const insererJetonImage = useCallback((nomFichier: string) => {
    const ta = messageRef.current;
    const jeton = `{{img:${nomFichier}}}`;
    if (!ta) { setMessage(m => m + '\n' + jeton); return; }
    const start = ta.selectionStart ?? message.length;
    const end = ta.selectionEnd ?? message.length;
    const nouveau = message.slice(0, start) + jeton + message.slice(end);
    setMessage(nouveau);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + jeton.length; });
  }, [message]);

  const ajouterImages = (fichiers: FileList | null) => {
    if (!fichiers) return;
    Array.from(fichiers).forEach(file => {
      const id = `${file.name}-${Date.now()}`;
      setImages(prev => [...prev, { id, file, preview: URL.createObjectURL(file) }]);
      // 🔧 Insertion automatique du jeton {{img:nom}} dès l'upload — avant,
      // il fallait cliquer manuellement sur la vignette pour l'insérer dans
      // le texte ; un clic oublié faisait que l'image restait invisible
      // dans le formulaire mais n'était jamais réellement envoyée avec le
      // courriel (elle "semblait" là car la vignette s'affiche quand même).
      // On l'ajoute à la fin du message ; on peut toujours la déplacer en
      // cliquant à nouveau sur la vignette pour la réinsérer où on veut.
      setMessage(m => (m ? m + '\n' : '') + `{{img:${file.name}}}`);
    });
  };
  const ajouterDocuments = (fichiers: FileList | null) => {
    if (!fichiers) return;
    Array.from(fichiers).forEach(file => {
      setDocuments(prev => [...prev, { id: `${file.name}-${Date.now()}`, file }]);
    });
  };
  const retirerImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id));
  const retirerDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const apercuHtml = message
    .split('\n').join('<br>')
    .replace(/\{\{img:([^}]+)\}\}/g, (_m, nom) => {
      const img = images.find(i => i.file.name === nom);
      return img ? `<br><img src="${img.preview}" style="max-width:100%;border-radius:8px;margin:8px 0;"><br>` : `<br>[image: ${nom} — non trouvée]<br>`;
    });

  // Nb de destinataires visés — pour affichage avant l'envoi
  const nbDestinatairesManuel = destinatairesManuel.split(/[\n,;]/).map(e => e.trim()).filter(Boolean).length;

  const envoyerCampagne = async () => {
    if (!sujet || !message) {
      setStatutEnvoi({ type: 'err', msg: 'Sujet et message sont requis.' });
      return;
    }
    if (mode === 'manuel' && nbDestinatairesManuel === 0) {
      setStatutEnvoi({ type: 'err', msg: 'Ajoute au moins un courriel destinataire.' });
      return;
    }
    if (mode === 'tous' && !window.confirm(`Envoyer cette campagne à TOUS les abonnés actifs (${abonnesActifs} personnes) ?`)) {
      return;
    }
    setEnvoi(true);
    setStatutEnvoi(null);
    try {
      const fd = new FormData();
      fd.append('sujet', sujet);
      fd.append('message', message);
      fd.append('mode', mode);
      if (mode === 'manuel') fd.append('destinatairesManuel', destinatairesManuel);
      images.forEach(i => fd.append('images', i.file, i.file.name));
      documents.forEach(d => fd.append('documents', d.file, d.file.name));

      const r = await fetch(`${API}/admin/marketing/envoyer`, { method: 'POST', credentials: 'include', body: fd });
      const data = await r.json();
      if (r.ok && data.succes) {
        setStatutEnvoi({ type: 'ok', msg: `✅ Envoi démarré vers ${data.total} destinataire(s)${data.ignores ? ` (${data.ignores} adresse(s) désabonnée(s) ignorée(s))` : ''}. Suis la progression juste en dessous, section "Historique des envois".` });
        setSujet(''); setMessage(''); setImages([]); setDocuments([]); setDestinatairesManuel('');
        chargerCampagnes();
      } else {
        setStatutEnvoi({ type: 'err', msg: `❌ ${data.error || 'Erreur inconnue'}` });
      }
    } catch {
      setStatutEnvoi({ type: 'err', msg: '❌ Erreur de connexion au serveur' });
    } finally {
      setEnvoi(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ── HISTORIQUE DES ENVOIS (progression + échecs) ──
  // ═══════════════════════════════════════════════════════════════════════
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [chargementCampagnes, setChargementCampagnes] = useState(false);
  const [campagneOuverte, setCampagneOuverte] = useState<number | null>(null);
  const [detailsCampagnes, setDetailsCampagnes] = useState<Record<number, Campagne>>({});
  const [chargementDetail, setChargementDetail] = useState<number | null>(null);

  const chargerCampagnes = useCallback(async () => {
    setChargementCampagnes(true);
    try {
      const r = await fetch(`${API}/admin/marketing/campagnes`, { credentials: 'include' });
      const data = await r.json();
      if (r.ok) setCampagnes(data.campagnes || []);
    } catch {
      // silencieux — l'historique n'est pas critique, on ne bloque pas la page
    } finally {
      setChargementCampagnes(false);
    }
  }, []);

  // Charge le détail complet (message + images) d'une campagne seulement
  // quand l'admin l'ouvre — évite de faire transiter des images en base64
  // pour les 50 campagnes de la liste alors qu'on n'en regarde qu'une.
  const ouvrirCampagne = async (id: number) => {
    if (campagneOuverte === id) { setCampagneOuverte(null); return; }
    setCampagneOuverte(id);
    if (detailsCampagnes[id]) return; // déjà chargé
    setChargementDetail(id);
    try {
      const r = await fetch(`${API}/admin/marketing/campagnes/${id}`, { credentials: 'include' });
      const data = await r.json();
      if (r.ok) setDetailsCampagnes(prev => ({ ...prev, [id]: data.campagne }));
    } catch {
      // silencieux
    } finally {
      setChargementDetail(null);
    }
  };

  // Même logique de remplacement {{img:nom}} que l'aperçu du formulaire,
  // mais à partir des images sauvegardées en base64 dans la campagne.
  const construireApercuCampagne = (campagne: Campagne) => {
    const images = campagne.images_apercu || [];
    return (campagne.message || '')
      .split('\n').join('<br>')
      .replace(/\{\{img:([^}]+)\}\}/g, (_m, nom) => {
        const img = images.find(i => i.nom === nom);
        return img ? `<br><a href="${img.url}" target="_blank" rel="noopener noreferrer" title="Cliquer pour agrandir"><img src="${img.url}" style="max-width:200px;max-height:140px;object-fit:contain;border-radius:8px;margin:8px 0;border:1px solid #e5e7eb;"></a><br>` : `<br>[image manquante]<br>`;
      });
  };

  useEffect(() => { chargerCampagnes(); }, [chargerCampagnes]);

  // Rafraîchit automatiquement toutes les 3s tant qu'une campagne est en
  // cours d'envoi — c'est ce qui donne l'effet "progression en direct".
  useEffect(() => {
    const enCours = campagnes.some(c => c.statut === 'en_cours');
    if (!enCours) return;
    const intervalle = setInterval(chargerCampagnes, 3000);
    return () => clearInterval(intervalle);
  }, [campagnes, chargerCampagnes]);

  const formatHeure = (iso?: string | null) => iso ? new Date(iso).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  // ═══════════════════════════════════════════════════════════════════════
  // ── GESTION DES ABONNÉS (voir tout / supprimer les mauvais courriels) ──
  // ═══════════════════════════════════════════════════════════════════════
  const [abonnes, setAbonnes] = useState<Abonne[]>([]);
  const [chargementAbonnes, setChargementAbonnes] = useState(false);
  const [erreurAbonnes, setErreurAbonnes] = useState('');
  const [filtreGestion, setFiltreGestion] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'actifs' | 'inactifs'>('tous');
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);

  const chargerAbonnes = useCallback(async () => {
    setChargementAbonnes(true);
    setErreurAbonnes('');
    try {
      const r = await fetch(`${API}/admin/infolettre/tous`, { credentials: 'include' });
      const data = await r.json();
      if (r.ok) setAbonnes(data.abonnes || []);
      else setErreurAbonnes(data.error || 'Erreur de chargement');
    } catch {
      setErreurAbonnes('Erreur de connexion au serveur');
    } finally {
      setChargementAbonnes(false);
    }
  }, []);

  useEffect(() => { chargerAbonnes(); }, [chargerAbonnes]);

  const abonnesActifs = abonnes.filter(a => a.actif).length;

  const abonnesAffiches = abonnes
    .filter(a => a.email.toLowerCase().includes(filtreGestion.toLowerCase()))
    .filter(a => filtreStatut === 'tous' ? true : filtreStatut === 'actifs' ? a.actif : !a.actif);

  const supprimerAbonne = async (a: Abonne) => {
    if (!window.confirm(`Supprimer définitivement "${a.email}" de la liste infolettre ?\n\n(Utile pour un courriel qui rebondit / n'existe plus.)`)) return;
    setSuppressionEnCours(a.id);
    try {
      const r = await fetch(`${API}/admin/infolettre/${a.id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) setAbonnes(prev => prev.filter(x => x.id !== a.id));
      else {
        const data = await r.json().catch(() => ({}));
        alert(`❌ ${data.error || 'Erreur lors de la suppression'}`);
      }
    } catch {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const toggleActifAbonne = async (a: Abonne) => {
    try {
      const r = await fetch(`${API}/admin/infolettre/${a.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !a.actif }),
      });
      if (r.ok) setAbonnes(prev => prev.map(x => x.id === a.id ? { ...x, actif: !a.actif } : x));
    } catch {
      alert('❌ Erreur de connexion au serveur');
    }
  };

  // ── Styles partagés ──────────────────────────────────────────────────────
  const champStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 6, display: 'block' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, backgroundColor: T.bg, minHeight: '100%' }}>

      {/* ═══════════ SECTION 1 : COMPOSER UNE CAMPAGNE ═══════════ */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* ── Colonne gauche : formulaire ── */}
        <div style={{ flex: 1, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>📢 Campagne marketing / infolettre</h2>

          <div>
            <label style={labelStyle}>Destinataires</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button type="button" onClick={() => setMode('tous')}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${mode === 'tous' ? T.accent : T.border}`,
                  backgroundColor: mode === 'tous' ? T.accentLight : T.card, color: mode === 'tous' ? T.accent : T.textLight }}>
                Tous les abonnés actifs ({abonnesActifs})
              </button>
              <button type="button" onClick={() => setMode('manuel')}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${mode === 'manuel' ? T.accent : T.border}`,
                  backgroundColor: mode === 'manuel' ? T.accentLight : T.card, color: mode === 'manuel' ? T.accent : T.textLight }}>
                Liste précise
              </button>
            </div>
            {mode === 'manuel' && (
              <textarea
                style={{ ...champStyle, minHeight: 70, resize: 'vertical' }}
                value={destinatairesManuel}
                onChange={e => setDestinatairesManuel(e.target.value)}
                placeholder="un courriel par ligne, ou séparés par virgule..."
              />
            )}
            {mode === 'manuel' && <p style={{ fontSize: 11, color: T.textLight, marginTop: 4 }}>{nbDestinatairesManuel} destinataire(s) détecté(s)</p>}
          </div>

          <div>
            <label style={labelStyle}>Sujet</label>
            <input style={champStyle} value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Ex: Nos nouveautés de la semaine 🎉" />
          </div>

          <div>
            <label style={labelStyle}>Contenu du courriel</label>
            <textarea ref={messageRef} style={{ ...champStyle, minHeight: 160, resize: 'vertical' }} value={message}
              onChange={e => setMessage(e.target.value)} placeholder="Tape le contenu de ta campagne ici..." />
            <p style={{ fontSize: 11, color: T.textLight, marginTop: 4 }}>
              💡 Les images sont insérées automatiquement à la fin du message dès l'upload. Reclique sur une vignette pour la déplacer à la position du curseur.
            </p>
          </div>

          <div>
            <label style={labelStyle}>🖼️ Images (intégrées dans le message)</label>
            <input type="file" accept="image/*" multiple onChange={e => ajouterImages(e.target.files)} />
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {images.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 72 }}>
                    <img src={img.preview} onClick={() => insererJetonImage(img.file.name)}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer' }}
                      title="Cliquer pour insérer dans le texte" />
                    <button onClick={() => retirerImage(img.id)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', backgroundColor: T.danger, color: 'white', fontSize: 10, cursor: 'pointer', lineHeight: '18px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>📎 Documents (pièces jointes)</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple onChange={e => ajouterDocuments(e.target.files)} />
            {documents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {documents.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>
                    <span>📄 {d.file.name}</span>
                    <button onClick={() => retirerDocument(d.id)} style={{ border: 'none', background: 'none', color: T.danger, cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {statutEnvoi && (
            <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              backgroundColor: statutEnvoi.type === 'ok' ? '#dcfce7' : T.dangerLight,
              color: statutEnvoi.type === 'ok' ? T.success : T.danger }}>
              {statutEnvoi.msg}
            </div>
          )}

          <button onClick={envoyerCampagne} disabled={envoi}
            style={{ backgroundColor: envoi ? '#9ca3af' : T.accent, color: 'white', border: 'none', borderRadius: 8, padding: '11px 16px', fontSize: 13, fontWeight: 800, cursor: envoi ? 'not-allowed' : 'pointer' }}>
            {envoi ? '⏳ Démarrage...' : '📤 Envoyer la campagne'}
          </button>
        </div>

        {/* ── Colonne droite : aperçu ── */}
        <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: 10, padding: 16, alignSelf: 'flex-start' }}>
          <div style={{ backgroundColor: '#3a3a3a', borderRadius: '8px 8px 0 0', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: c }} />)}
            <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>Aperçu — {sujet || '(sans sujet)'}</span>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px', padding: 20, minHeight: 300 }}>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: apercuHtml || '<span style="color:#9ca3af">(ta campagne apparaîtra ici)</span>' }} />
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <p style={{ fontSize: 10, color: '#9ca3af' }}>
              Vous recevez ce courriel car vous êtes inscrit(e) à l'infolettre e-Vend Studio. <u>Se désabonner</u><br />
              e-Vend Studio — Saint-Arsène (Qc), G0L 2K0
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2 : HISTORIQUE DES ENVOIS ═══════════ */}
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: T.text, margin: 0 }}>📋 Historique des envois</h2>
          <button onClick={chargerCampagnes} disabled={chargementCampagnes}
            style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: T.accent, fontWeight: 700 }}>
            {chargementCampagnes ? '⏳ Chargement...' : '🔄 Rafraîchir'}
          </button>
        </div>

        {campagnes.length === 0 && !chargementCampagnes && (
          <p style={{ fontSize: 12, color: T.textLight, padding: '12px 0' }}>Aucune campagne envoyée pour l'instant.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {campagnes.map(c => {
            const pct = c.total > 0 ? Math.round(((c.envoyes + c.echecs) / c.total) * 100) : 0;
            const ouverte = campagneOuverte === c.id;
            return (
              <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => ouvrirCampagne(c.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', cursor: 'pointer', flexWrap: 'wrap' }}
                >
                  <div style={{ minWidth: 180 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{c.sujet}</p>
                    <p style={{ fontSize: 11, color: T.textLight, margin: '2px 0 0' }}>{formatHeure(c.date_debut)} · {c.mode === 'tous' ? 'Tous les abonnés' : 'Liste précise'}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 12, color: T.success, fontWeight: 700 }}>✅ {c.envoyes}</span>
                    {c.echecs > 0 && <span style={{ fontSize: 12, color: T.danger, fontWeight: 700 }}>❌ {c.echecs}</span>}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                      backgroundColor: c.statut === 'en_cours' ? '#fef3c7' : c.statut === 'erreur' ? T.dangerLight : '#dcfce7',
                      color: c.statut === 'en_cours' ? T.warning : c.statut === 'erreur' ? T.danger : T.success,
                    }}>
                      {c.statut === 'en_cours' ? `⏳ ${c.envoyes + c.echecs}/${c.total}` : c.statut === 'erreur' ? 'Erreur' : 'Terminé'}
                    </span>
                    <span style={{ fontSize: 11, color: T.textLight }}>{ouverte ? '👁️ ▲' : '👁️ ▼'}</span>
                  </div>
                </div>

                {c.statut === 'en_cours' && (
                  <div style={{ height: 4, background: T.bg }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: T.accent, transition: 'width 0.3s' }} />
                  </div>
                )}

                {ouverte && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: 14, backgroundColor: T.bg }}>
                    {chargementDetail === c.id && <p style={{ fontSize: 12, color: T.textLight }}>⏳ Chargement de l'aperçu...</p>}

                    {detailsCampagnes[c.id] && (
                      <>
                        {/* Aperçu visuel du courriel réellement envoyé */}
                        <div style={{ backgroundColor: '#525659', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                          <div style={{ backgroundColor: '#3a3a3a', borderRadius: '6px 6px 0 0', padding: '6px 10px', display: 'flex', gap: 5, alignItems: 'center' }}>
                            {['#ff5f57', '#febc2e', '#28c840'].map(col => <div key={col} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col }} />)}
                            <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>{c.sujet}</span>
                          </div>
                          <div style={{ backgroundColor: 'white', borderRadius: '0 0 6px 6px', padding: 16, maxHeight: 320, overflowY: 'auto' }}>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: construireApercuCampagne(detailsCampagnes[c.id]) }} />
                          </div>
                        </div>

                        {detailsCampagnes[c.id].documents_noms && detailsCampagnes[c.id].documents_noms!.length > 0 && (
                          <p style={{ fontSize: 11, color: T.textLight, marginBottom: 10 }}>
                            📎 Pièces jointes :{' '}
                            {detailsCampagnes[c.id].documents_noms!.map((doc, i) => {
                              const nomDoc = typeof doc === 'string' ? doc : doc.nom;
                              const urlDoc = typeof doc === 'string' ? null : doc.url;
                              return (
                                <span key={i}>
                                  {i > 0 && ', '}
                                  {urlDoc
                                    ? <a href={urlDoc} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, fontWeight: 700 }}>{nomDoc}</a>
                                    : nomDoc}
                                </span>
                              );
                            })}
                          </p>
                        )}

                        {c.echecs > 0 && detailsCampagnes[c.id].echecs_emails && (
                          <>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textLight, marginBottom: 6 }}>Courriels en échec :</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                              {detailsCampagnes[c.id].echecs_emails!.map((e, i) => (
                                <div key={i} style={{ fontSize: 11, color: T.text, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                  <span>{e.email}</span>
                                  <span style={{ color: T.danger, textAlign: 'right' }}>{e.erreur}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ SECTION 3 : GESTION DES ABONNÉS ═══════════ */}
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: T.text, margin: 0 }}>
            🧹 Gestion des abonnés infolettre
            <span style={{ fontWeight: 500, fontSize: 12, color: T.textLight, marginLeft: 8 }}>
              {abonnes.length} au total · {abonnesActifs} actifs
            </span>
          </h2>
          <button onClick={chargerAbonnes} disabled={chargementAbonnes}
            style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: T.accent, fontWeight: 700 }}>
            {chargementAbonnes ? '⏳ Chargement...' : '🔄 Rafraîchir'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...champStyle, maxWidth: 280 }}
            value={filtreGestion}
            onChange={e => setFiltreGestion(e.target.value)}
            placeholder="🔍 Chercher un courriel..."
          />
          {(['tous', 'actifs', 'inactifs'] as const).map(f => (
            <button key={f} onClick={() => setFiltreStatut(f)}
              style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${filtreStatut === f ? T.accent : T.border}`,
                backgroundColor: filtreStatut === f ? T.accentLight : T.card, color: filtreStatut === f ? T.accent : T.textLight }}>
              {f === 'tous' ? 'Tous' : f === 'actifs' ? 'Actifs' : 'Désabonnés'}
            </button>
          ))}
        </div>

        {erreurAbonnes && <p style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{erreurAbonnes}</p>}

        <div style={{ maxHeight: 420, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: T.bg, position: 'sticky', top: 0 }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textLight, fontWeight: 800 }}>Courriel</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textLight, fontWeight: 800 }}>Statut</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textLight, fontWeight: 800 }}>Inscrit le</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textLight, fontWeight: 800 }}>Source</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textLight, fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {abonnesAffiches.map(a => (
                <tr key={a.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 12px', color: T.text }}>{a.email}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      backgroundColor: a.actif ? '#dcfce7' : T.dangerLight,
                      color: a.actif ? T.success : T.danger,
                    }}>
                      {a.actif ? 'Actif' : 'Désabonné'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: T.textLight }}>
                    {new Date(a.date_inscription).toLocaleDateString('fr-CA')}
                  </td>
                  <td style={{ padding: '8px 12px', color: T.textLight }}>{a.source || '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleActifAbonne(a)}
                      style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: T.textLight, marginRight: 6 }}
                      title={a.actif ? 'Désactiver sans supprimer' : 'Réactiver'}>
                      {a.actif ? '⏸️' : '▶️'}
                    </button>
                    <button onClick={() => supprimerAbonne(a)} disabled={suppressionEnCours === a.id}
                      style={{ border: 'none', background: T.danger, color: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      title="Supprimer définitivement (ex: courriel qui rebondit)">
                      {suppressionEnCours === a.id ? '...' : '🗑️ Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
              {!chargementAbonnes && abonnesAffiches.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: T.textLight }}>Aucun abonné trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}