// 📁 src/addons/contact/AddonContact.tsx
// e-Vend Studio — Add-on Contact générique
// Ne connaît AUCUN template. Reçoit un thème + une liste de champs + un endpoint.

import { useState } from 'react';

// ─── CONTRAT DE THÈME ─────────────────────────────────────────────────────────
// Chaque template fournit un adaptateur qui traduit SES couleurs vers ce contrat.
export interface AddonTheme {
  primary: string;
  secondary?: string;
  bg: string;
  text: string;
  textDim?: string;      // texte atténué (labels, sous-titres) — défaut: text + 'aa'
  border?: string;       // défaut: primary + '30'
  fontTitre: string;     // ex: "'Cormorant Garamond',serif"
  fontTexte: string;     // ex: "'Poppins',sans-serif"
}

// ─── CONTRAT DE CHAMPS ────────────────────────────────────────────────────────
export type ChampType = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface ChampFormulaire {
  id: string;
  type: ChampType;
  label: string;
  placeholder?: string;
  requis?: boolean;
  options?: string[];       // uniquement pour type 'select'
  largeurPleine?: boolean;  // occupe toute la largeur de la grille (sinon 2 colonnes)
}

// ─── DONNÉES FOURNIES PAR LE TEMPLATE ─────────────────────────────────────────
export interface AddonContactData {
  titre: string;
  sousTitre?: string;
  champs: ChampFormulaire[];
  boutonTexte: string;
  boutonTexteEnvoi?: string;   // texte affiché pendant l'envoi (défaut: "Envoi...")
  messageSuccesTitre: string;
  messageSuccesTexte: string;
  messageSuccesEmoji?: string; // défaut: ✅
  endpoint: string;             // ex: '/api/studio/contact'
  payloadExtra: Record<string, any>; // ex: { studio: nomEcole, type: 'contact-danse' }
}

interface Props {
  theme: AddonTheme;
  data: AddonContactData;
  isMobile?: boolean;
}

export default function AddonContact({ theme, data, isMobile = false }: Props) {
  const [form, setForm]     = useState<Record<string, string>>({});
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const cp       = theme.primary;
  const textDim  = theme.textDim  || `${theme.text}99`;
  const border   = theme.border   || `${cp}30`;

  const champsRequisManquants = data.champs.filter(c => c.requis && !form[c.id]?.trim());

  const handleChange = (id: string, v: string) => setForm(prev => ({ ...prev, [id]: v }));

  const handleSubmit = async () => {
    if (champsRequisManquants.length > 0) return;
    setLoading(true);
    setErreur('');
    try {
      const res = await fetch(data.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...data.payloadExtra }),
      });
      if (!res.ok) throw new Error('Réponse serveur non OK');
      setEnvoye(true);
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evend-addon-contact" style={{ background: theme.bg }}>
      <style>{`
        .evend-addon-contact .ea-inp {
          width: 100%; box-sizing: border-box;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid ${border};
          color: ${theme.text};
          font-family: ${theme.fontTexte};
          font-size: 14px;
          outline: none;
          transition: border-color .2s;
        }
        .evend-addon-contact .ea-inp::placeholder { color: ${theme.text}55; }
        .evend-addon-contact .ea-inp:focus { border-color: ${cp}; }
        .evend-addon-contact .ea-label {
          font-family: ${theme.fontTexte};
          font-size: 9px; font-weight: 700;
          color: ${textDim};
          letter-spacing: 0.15em; text-transform: uppercase;
          display: block; margin-bottom: 6px;
        }
        .evend-addon-contact .ea-btn {
          background: ${cp}; color: #fff; border: none;
          font-family: ${theme.fontTexte}; font-weight: 700; font-size: 13px;
          letter-spacing: 0.05em; padding: 16px; width: 100%;
          cursor: pointer; transition: opacity .2s;
        }
        .evend-addon-contact .ea-btn:hover:not(:disabled) { opacity: 0.85; }
        .evend-addon-contact .ea-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .evend-addon-contact select.ea-inp { cursor: pointer; }
      `}</style>

      <div style={{
        padding: isMobile ? '32px 20px' : '40px 36px',
        border: `2px solid ${border}`,
        borderTop: `4px solid ${cp}`,
      }}>
        {envoye ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{data.messageSuccesEmoji || '✅'}</div>
            <h3 style={{ fontFamily: theme.fontTitre, fontSize: 26, fontWeight: 600, color: theme.text, marginBottom: 10 }}>
              {data.messageSuccesTitre}
            </h3>
            <p style={{ fontFamily: theme.fontTexte, fontSize: 14, color: textDim }}>
              {data.messageSuccesTexte}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontFamily: theme.fontTitre, fontSize: 22, fontWeight: 600, color: theme.text, marginBottom: data.sousTitre ? 0 : 4 }}>
              {data.titre}
            </h3>
            {data.sousTitre && (
              <p style={{ fontFamily: theme.fontTexte, fontSize: 13, color: textDim, marginTop: -8 }}>
                {data.sousTitre}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              {data.champs.map(champ => (
                <div key={champ.id} style={{ gridColumn: (champ.largeurPleine || isMobile) ? '1 / -1' : undefined }}>
                  <label className="ea-label">{champ.label}{champ.requis ? ' *' : ''}</label>

                  {champ.type === 'textarea' ? (
                    <textarea
                      className="ea-inp" rows={3}
                      placeholder={champ.placeholder}
                      value={form[champ.id] || ''}
                      onChange={e => handleChange(champ.id, e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  ) : champ.type === 'select' ? (
                    <select
                      className="ea-inp"
                      value={form[champ.id] || ''}
                      onChange={e => handleChange(champ.id, e.target.value)}
                    >
                      <option value="">Choisir...</option>
                      {champ.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      className="ea-inp"
                      type={champ.type}
                      placeholder={champ.placeholder}
                      value={form[champ.id] || ''}
                      onChange={e => handleChange(champ.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {erreur && (
              <p style={{ color: '#ef4444', fontSize: 12, fontFamily: theme.fontTexte }}>{erreur}</p>
            )}

            <button
              className="ea-btn"
              onClick={handleSubmit}
              disabled={loading || champsRequisManquants.length > 0}
            >
              {loading ? 'Envoi...' : (data.boutonTexteEnvoi || data.boutonTexte)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}