import React, { useState, useRef, useCallback } from 'react';

// ── Réutilise les mêmes couleurs que le reste du dashboard admin ──────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

const API = '/api';

interface ImageJointe { id: string; file: File; preview: string; }
interface DocJoint { id: string; file: File; }

export default function ReponseClient() {
  const [destinataire, setDestinataire] = useState('');
  const [sujet, setSujet] = useState('Réponse de l\'équipe e-Vend Studio');
  const [messageClient, setMessageClient] = useState('');
  const [messageReponse, setMessageReponse] = useState('');
  const [images, setImages] = useState<ImageJointe[]>([]);
  const [documents, setDocuments] = useState<DocJoint[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const reponseRef = useRef<HTMLTextAreaElement>(null);

  // ── Insère le jeton {{img:nom}} à la position du curseur dans la réponse ──
  const insererJetonImage = useCallback((nomFichier: string) => {
    const ta = reponseRef.current;
    const jeton = `{{img:${nomFichier}}}`;
    if (!ta) { setMessageReponse(m => m + '\n' + jeton); return; }
    const start = ta.selectionStart ?? messageReponse.length;
    const end = ta.selectionEnd ?? messageReponse.length;
    const nouveau = messageReponse.slice(0, start) + jeton + messageReponse.slice(end);
    setMessageReponse(nouveau);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + jeton.length; });
  }, [messageReponse]);

  const ajouterImages = (fichiers: FileList | null) => {
    if (!fichiers) return;
    Array.from(fichiers).forEach(file => {
      const id = `${file.name}-${Date.now()}`;
      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { id, file, preview }]);
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

  // ── Aperçu simplifié : remplace les jetons {{img:...}} par les vraies previews locales ──
  const apercuHtml = messageReponse
    .split('\n').join('<br>')
    .replace(/\{\{img:([^}]+)\}\}/g, (_m, nom) => {
      const img = images.find(i => i.file.name === nom);
      return img ? `<br><img src="${img.preview}" style="max-width:100%;border-radius:8px;margin:8px 0;"><br>` : `<br>[image: ${nom} — non trouvée]<br>`;
    });

  const envoyer = async () => {
    if (!destinataire || !messageReponse) {
      setStatut({ type: 'err', msg: 'Adresse du client et réponse sont requis.' });
      return;
    }
    setEnvoi(true);
    setStatut(null);
    try {
      const fd = new FormData();
      fd.append('destinataire', destinataire);
      fd.append('sujet', sujet);
      fd.append('messageClient', messageClient);
      fd.append('messageReponse', messageReponse);
      images.forEach(i => fd.append('images', i.file, i.file.name));
      documents.forEach(d => fd.append('documents', d.file, d.file.name));

      const r = await fetch(`${API}/admin/repondre-client`, {
        method: 'POST', credentials: 'include', body: fd,
      });
      const data = await r.json();
      if (r.ok && data.succes) {
        setStatut({ type: 'ok', msg: `✅ Message envoyé à ${destinataire}` });
        setMessageReponse(''); setImages([]); setDocuments([]);
      } else {
        setStatut({ type: 'err', msg: `❌ ${data.erreur || 'Erreur inconnue'}` });
      }
    } catch (e) {
      setStatut({ type: 'err', msg: '❌ Erreur de connexion au serveur' });
    } finally {
      setEnvoi(false);
    }
  };

  const champStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 6, display: 'block' };

  return (
    <div style={{ display: 'flex', gap: 20, padding: 20, backgroundColor: T.bg, minHeight: '100%' }}>
      {/* ── Colonne gauche : formulaire ── */}
      <div style={{ flex: 1, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>✉️ Répondre à un client</h2>

        <div>
          <label style={labelStyle}>Courriel du client</label>
          <input style={champStyle} value={destinataire} onChange={e => setDestinataire(e.target.value)} placeholder="client@exemple.com" />
        </div>

        <div>
          <label style={labelStyle}>Sujet</label>
          <input style={champStyle} value={sujet} onChange={e => setSujet(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Message original du client (collé manuellement)</label>
          <textarea style={{ ...champStyle, minHeight: 90, resize: 'vertical' }} value={messageClient}
            onChange={e => setMessageClient(e.target.value)} placeholder="Colle ici ce que le client t'a écrit..." />
        </div>

        <div>
          <label style={labelStyle}>Ta réponse</label>
          <textarea ref={reponseRef} style={{ ...champStyle, minHeight: 140, resize: 'vertical' }} value={messageReponse}
            onChange={e => setMessageReponse(e.target.value)} placeholder="Tape ta réponse ici..." />
          <p style={{ fontSize: 11, color: T.textLight, marginTop: 4 }}>
            💡 Clique une image ci-dessous pour l'insérer dans le texte à la position du curseur.
          </p>
        </div>

        {/* Images (intégrées dans le texte) */}
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

        {/* Documents (pièces jointes classiques) */}
        <div>
          <label style={labelStyle}>📎 Documents (PDF, etc. — pièces jointes)</label>
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

        {statut && (
          <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            backgroundColor: statut.type === 'ok' ? '#dcfce7' : '#fee2e2',
            color: statut.type === 'ok' ? T.success : T.danger }}>
            {statut.msg}
          </div>
        )}

        <button onClick={envoyer} disabled={envoi}
          style={{ backgroundColor: envoi ? '#9ca3af' : T.accent, color: 'white', border: 'none', borderRadius: 8, padding: '11px 16px', fontSize: 13, fontWeight: 800, cursor: envoi ? 'not-allowed' : 'pointer' }}>
          {envoi ? '⏳ Envoi en cours...' : '📤 Envoyer au client'}
        </button>
      </div>

      {/* ── Colonne droite : aperçu ── */}
      <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: 10, padding: 16, alignSelf: 'flex-start' }}>
        <div style={{ backgroundColor: '#3a3a3a', borderRadius: '8px 8px 0 0', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: c }} />)}
          <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>Aperçu — {sujet}</span>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px', padding: 20, minHeight: 300 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Bonjour,</p>
          {messageClient && (
            <div style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid ${T.accent}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', margin: '10px 0', fontSize: 12, fontStyle: 'italic', color: T.textLight }}
              dangerouslySetInnerHTML={{ __html: '<strong>Votre message :</strong><br>' + messageClient.split('\n').join('<br>') }} />
          )}
          <p style={{ fontSize: 12, fontWeight: 700, margin: '10px 0 4px' }}>Notre réponse :</p>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: apercuHtml || '<span style="color:#9ca3af">(ta réponse apparaîtra ici)</span>' }} />
        </div>
      </div>
    </div>
  );
}