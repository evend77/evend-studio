// src/hooks/useContactStudio.tsx
// e-Vend Studio — Hook de formulaire de contact universel
//
// Utilisation dans n'importe quel template :
//
//   const { envoyer, etat, erreur } = useContactStudio();
//
//   await envoyer({
//     nom:             'Marie Tremblay',
//     email:           'marie@exemple.com',
//     message:         'Bonjour...',
//     vendeurId:       42,
//     templateId:      'cours-coach',
//     // optionnels :
//     sujet:           'Question sur le programme Essentiel',
//     telephone:       '(514) 555-0000',
//     copieMoi:        true,
//     champsExtra:     [{ label: 'Objectif', valeur: 'Reconversion' }],
//   });

import { useState, useRef } from 'react';
import React from 'react';

export type EtatContact = 'idle' | 'loading' | 'ok' | 'err';

export interface ChampExtra {
  label: string;
  valeur: string;
}

export interface ParamsContact {
  nom:           string;
  email:         string;
  message:       string;
  vendeurId:     number | string;
  templateId?:   string;
  sujet?:        string;
  telephone?:    string;
  copieMoi?:     boolean;
  champsExtra?:  ChampExtra[];
}

export interface RetourContact {
  envoyer:       (params: ParamsContact) => Promise<boolean>;
  etat:          EtatContact;
  erreur:        string;
  resetEtat:     () => void;
  formStartTime: React.MutableRefObject<number>;
}

const API_BASE = '/api/studio';

export function useContactStudio(): RetourContact {
  const [etat, setEtat]     = useState<EtatContact>('idle');
  const [erreur, setErreur] = useState('');
  // Timestamp de début — à initialiser quand le formulaire est monté / focus premier champ
  const formStartTime = useRef<number>(Date.now());

  const resetEtat = () => { setEtat('idle'); setErreur(''); };

  const envoyer = async (params: ParamsContact): Promise<boolean> => {
    if (etat === 'loading') return false;

    // Validation frontend rapide
    if (!params.nom?.trim())     { setErreur('Votre nom est requis.');          setEtat('err'); return false; }
    if (!params.email?.trim())   { setErreur('Votre adresse email est requise.');setEtat('err'); return false; }
    if (!params.message?.trim()) { setErreur('Le message est requis.');          setEtat('err'); return false; }
    if (!params.vendeurId)       { setErreur('Erreur de configuration.');        setEtat('err'); return false; }

    setEtat('loading');
    setErreur('');

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_expediteur:   params.nom.trim(),
          email_expediteur: params.email.trim(),
          message:          params.message.trim(),
          sujet:            params.sujet?.trim() || '',
          telephone:        params.telephone?.trim() || '',
          champs_extra:     params.champsExtra || [],
          vendeur_id:       params.vendeurId,
          template_id:      params.templateId || '',
          copie_expediteur: params.copieMoi || false,
          honeypot:         '',              // Toujours vide (le champ caché HTML reste vide côté humain)
          form_start_time:  formStartTime.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || data.error || 'Erreur lors de l\'envoi.';
        setErreur(msg);
        setEtat('err');
        setTimeout(() => { setEtat('idle'); setErreur(''); }, 5000);
        return false;
      }

      setEtat('ok');
      return true;

    } catch (err) {
      setErreur('Erreur de connexion. Veuillez réessayer.');
      setEtat('err');
      setTimeout(() => { setEtat('idle'); setErreur(''); }, 5000);
      return false;
    }
  };

  return { envoyer, etat, erreur, resetEtat, formStartTime };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT HONEYPOT — À inclure dans tous les formulaires
// Invisible pour les humains, les bots le remplissent → rejeté par le backend
// ─────────────────────────────────────────────────────────────────────────────
export function HoneypotField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
      <input
        type="text"
        name="website"
        value={value}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXEMPLE D'UTILISATION COMPLET dans un template
// ─────────────────────────────────────────────────────────────────────────────
//
// import { useContactStudio, HoneypotField } from '../../hooks/useContactStudio';
//
// function SectionContact({ config, vendeurId }: { config: ConfigCoachVie; vendeurId?: number }) {
//   const { envoyer, etat, erreur } = useContactStudio();
//   const [form, setForm] = useState({ nom:'', email:'', message:'', honeypot:'' });
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (form.honeypot) return; // bot détecté côté client aussi
//     const ok = await envoyer({
//       nom:        form.nom,
//       email:      form.email,
//       message:    form.message,
//       vendeurId:  vendeurId || config.vendeurId,
//       templateId: 'cours-coach',
//       sujet:      'Demande d\'appel découverte',
//       champsExtra: [
//         { label: 'Objectif', valeur: form.objectif },
//       ],
//       copieMoi: true,
//     });
//     if (ok) { /* afficher confirmation */ }
//   };
//
//   return (
//     <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
//       <HoneypotField value={form.honeypot} onChange={v => setForm(p=>({...p,honeypot:v}))} />
//       <input value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} />
//       ...
//       {erreur && <p style={{ color:'red' }}>{erreur}</p>}
//       <button type="submit" disabled={etat==='loading'}>
//         {etat==='loading' ? 'Envoi...' : etat==='ok' ? '✅ Envoyé!' : 'Envoyer'}
//       </button>
//     </form>
//   );
// }