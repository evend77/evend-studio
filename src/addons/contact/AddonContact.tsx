// 📁 src/addons/contact/AddonContact.tsx
// e-Vend Studio — Add-on Contact générique
// Ne connaît AUCUN template. Reçoit un thème + une liste de champs + les infos
// nécessaires pour construire le payload EXACT attendu par /api/studio/contact.

import { useState } from 'react';

// ─── CONTRAT DE THÈME ─────────────────────────────────────────────────────────
export interface AddonTheme {
  primary: string;
  secondary?: string;
  bg: string;
  text: string;
  textDim?: string;
  border?: string;
  fontTitre: string;
  fontTexte: string;
}

// ─── CONTRAT DE CHAMPS ────────────────────────────────────────────────────────
export type ChampType = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface ChampFormulaire {
  id: string;
  type: ChampType;
  label: string;
  placeholder?: string;
  requis?: boolean;
  options?: string[];
  largeurPleine?: boolean;
}

// Champs à sens fixe pour le backend — tout champ dont l'id N'EST PAS dans cette
// liste est envoyé dans champs_extra (ex: 'style', 'age').
const CHAMPS_CONNUS = ['nom', 'prenom', 'email', 'telephone', 'sujet', 'message'];

// ─── DONNÉES FOURNIES PAR LE TEMPLATE ─────────────────────────────────────────
export interface AddonContactData {
  titre: string;
  sousTitre?: string;
  champs: ChampFormulaire[];
  boutonTexte: string;
  boutonTexteEnvoi?: string;
  messageSuccesTitre: string;
  messageSuccesTexte: string;
  messageSuccesEmoji?: string;
  endpoint: string;
  // ── Requis par le backend — sans vendeurId, le serveur refuse le message (400) ──
  vendeurId: number | string;
  templateId?: string;
  destinataireEmail?: string;
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
  const [indisponible, setIndisponible] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState(() => Date.now());

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
      const nomComplet = [form.prenom, form.nom].filter(Boolean).join(' ').trim() || form.nom || '';
      const champsExtra = data.champs
        .filter(c => !CHAMPS_CONNUS.includes(c.id))
        .map(c => ({ label: c.label, valeur: form[c.id] || '' }))
        .filter(c => c.valeur);

      const body = {
        vendeur_id: data.vendeurId,
        template_id: data.templateId || '',
        nom_expediteur: nomComplet,
        email_expediteur: form.email || '',
        telephone: form.telephone || '',
        sujet: form.sujet || '',
        message: form.message || '',
        champs_extra: champsExtra,
        honeypot,
        form_start_time: formStartTime,
      };

      const res = await fetch(data.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 403) {
        const resBody = await res.json().catch(() => null);
        if (resBody?.quota_atteint) {
          setIndisponible(true);
          return;
        }
      }
      if (!res.ok) {
        const resBody = await res.json().catch(() => null);
        throw new Error(resBody?.message || 'Réponse serveur non OK');
      }
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
        .evend-addon-contact select.ea-inp option { background: #fff; color: #1a1a1a; }
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
        ) : indisponible ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
            <h3 style={{ fontFamily: theme.fontTitre, fontSize: 20, fontWeight: 600, color: '#ef4444', marginBottom: 10 }}>
              Formulaire indisponible
            </h3>
            <p style={{ fontFamily: theme.fontTexte, fontSize: 13, color: textDim, maxWidth: 380, margin: '0 auto' }}>
              Le formulaire de contact n'est pas disponible pour le moment. Merci de réessayer plus tard ou de nous contacter autrement.
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

            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />

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