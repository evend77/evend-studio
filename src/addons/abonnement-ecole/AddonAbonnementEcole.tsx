// src/addons/abonnement-ecole/AddonAbonnementEcole.tsx
// e-Vend Studio — Add-on Abonnement École/Cours
// Ne connaît AUCUN template. Reçoit un thème neutre + des données neutres,
// exactement comme addons/reservation-ecole/AddonReservationEcole.tsx.
// Affiche les forfaits récurrents du commerce et permet à un client de s'y
// abonner (nom/courriel/téléphone) via un modal. Aucune donnée n'est affichée
// si l'add-on n'est pas activé par le gestionnaire (même principe que réservation).

import { useState, useEffect } from 'react';

// ─── Contrat de thème — traduit par un petit adaptateur dans chaque template ──
export interface AddonAbonnementTheme {
  primary: string;
  accentSecondaire?: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textDim: string;
  fontTitre: string;
  fontTexte: string;
}

export interface AddonAbonnementData {
  siteId?: number | string;
  abonnementActif?: boolean;
  titreLabel: string;      // ex: "Forfaits"
  titre: string;             // ex: "Nos abonnements"
  titreAccent?: string;      // portion du titre en emphase (ex: "abonnements")
}

interface Formation {
  id: number;
  titre: string;
  description: string | null;
  prix_hebdomadaire: number | null;
  prix_mensuel: number | null;
  prix_annuel: number | null;
}

const LABEL_FREQUENCE: Record<string, string> = { hebdomadaire: '/ semaine', mensuel: '/ mois', annuel: '/ an' };

interface ChoixAbonnement { formation: Formation; frequence: 'hebdomadaire' | 'mensuel' | 'annuel'; prix: number; }

// ─── Popup d'inscription à un forfait ──────────────────────────────────────────
function PopupInscriptionAbonnement({ theme, choix, siteId, onFermer }: { theme:AddonAbonnementTheme; choix:ChoixAbonnement; siteId?:number|string; onFermer:()=>void }) {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  const soumettre = async () => {
    setErreur('');
    if (!nom.trim() || !telephone.trim() || !email.trim()) { setErreur('Tous les champs sont requis.'); return; }
    if (!siteId) { setErreur('Impossible de déterminer le site. Réessayez plus tard.'); return; }
    setEnvoi(true);
    try {
      const res = await fetch('/api/abonnements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          formation_id: choix.formation.id,
          nom_client: nom.trim(),
          email_client: email.trim(),
          telephone: telephone.trim(),
          frequence: choix.frequence,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErreur(data.message || "Erreur lors de l'inscription."); setEnvoi(false); return; }
      if (data.payment_required && data.abonnement?.id) {
        window.location.href = `/paiement?type=abonnement&id=${data.abonnement.id}`;
        return;
      }
      setSucces(true);
    } catch {
      setErreur('Erreur de connexion. Réessayez.');
    }
    setEnvoi(false);
  };

  return (
    <div onClick={onFermer} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#14141f', border:`1px solid ${theme.primary}40`, borderRadius:14, padding:'28px 26px', maxWidth:420, width:'100%', position:'relative' }}>
        <button onClick={onFermer} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:theme.textDim, fontSize:18, cursor:'pointer' }}>✕</button>
        {succes ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>🎉</p>
            <p style={{ fontFamily:theme.fontTitre, fontSize:22, fontWeight:700, color:theme.text, marginBottom:8 }}>Abonnement confirmé !</p>
            <p style={{ fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Vous recevrez un courriel de confirmation avec votre numéro de membre sous peu.</p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily:theme.fontTexte, fontSize:10, fontWeight:700, color:theme.primary, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>S'abonner</p>
            <p style={{ fontFamily:theme.fontTitre, fontSize:24, fontWeight:700, color:theme.text, marginBottom:4 }}>{choix.formation.titre}</p>
            <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim, marginBottom:20 }}>{choix.prix.toFixed(2)} $ {LABEL_FREQUENCE[choix.frequence]}</p>
            {erreur && <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:'#ff6b6b', marginBottom:14, background:'rgba(255,107,107,.1)', padding:'8px 12px', borderRadius:6 }}>⚠️ {erreur}</p>}
            {[
              { v: nom, set: setNom, ph: 'Nom complet', type: 'text' },
              { v: telephone, set: setTelephone, ph: 'Téléphone', type: 'tel' },
              { v: email, set: setEmail, ph: 'Courriel', type: 'email' },
            ].map((f, i) => (
              <input key={i} type={f.type} value={f.v} placeholder={f.ph} onChange={e => f.set(e.target.value)}
                style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', marginBottom:10, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.bg, color:theme.text, fontFamily:theme.fontTexte, fontSize:13, outline:'none' }} />
            ))}
            <button onClick={soumettre} disabled={envoi}
              style={{ width:'100%', marginTop:8, padding:'12px 0', borderRadius:8, border:'none', background:theme.primary, color:'#fff', fontFamily:theme.fontTexte, fontSize:13, fontWeight:700, cursor:'pointer', opacity:envoi?.6:1 }}>
              {envoi ? 'Envoi...' : "Confirmer l'abonnement"}
            </button>
            <p style={{ fontFamily:theme.fontTexte, fontSize:10, color:theme.textDim, marginTop:10, textAlign:'center' }}>Vous pourrez annuler en tout temps.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AddonAbonnementEcole({ theme, data }: { theme:AddonAbonnementTheme; data:AddonAbonnementData }) {
  const { siteId, abonnementActif } = data;
  const [formations, setFormations] = useState<Formation[]>([]);
  const [chargement, setChargement] = useState(!!abonnementActif);
  const [choix, setChoix] = useState<ChoixAbonnement | null>(null);

  useEffect(() => {
    if (!abonnementActif || !siteId) return;
    setChargement(true);
    fetch(`/api/abonnements/formations/${siteId}`)
      .then(r => r.ok ? r.json() : { formations: [] })
      .then(d => setFormations(d.formations || []))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [abonnementActif, siteId]);

  // L'add-on ne s'affiche que si le gestionnaire l'a activé — aucun repli.
  if (!abonnementActif) return null;

  const prixDisponibles = (f: Formation): { frequence: 'hebdomadaire' | 'mensuel' | 'annuel'; prix: number }[] => {
    const liste: { frequence: 'hebdomadaire' | 'mensuel' | 'annuel'; prix: number }[] = [];
    if (f.prix_hebdomadaire != null) liste.push({ frequence: 'hebdomadaire', prix: Number(f.prix_hebdomadaire) });
    if (f.prix_mensuel != null) liste.push({ frequence: 'mensuel', prix: Number(f.prix_mensuel) });
    if (f.prix_annuel != null) liste.push({ frequence: 'annuel', prix: Number(f.prix_annuel) });
    return liste;
  };

  return (
    <section style={{ background:theme.bg, padding:'100px 48px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <p style={{ fontFamily:theme.fontTexte, fontSize:11, fontWeight:600, color:theme.accentSecondaire || theme.primary, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:12 }}>{data.titreLabel}</p>
          <h2 style={{ fontFamily:theme.fontTitre, fontSize:'clamp(32px,4.5vw,56px)', fontWeight:600, color:theme.text, lineHeight:1.1 }}>
            {data.titre} {data.titreAccent && <em style={{ fontStyle:'italic', color:theme.accentSecondaire || theme.primary }}>{data.titreAccent}</em>}
          </h2>
        </div>

        {chargement ? (
          <p style={{ textAlign:'center', fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Chargement des forfaits...</p>
        ) : formations.length === 0 ? (
          <p style={{ textAlign:'center', fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Aucun forfait disponible pour le moment.</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fit, minmax(260px, 1fr))`, gap:24 }}>
            {formations.map(f => {
              const prix = prixDisponibles(f);
              return (
                <div key={f.id} style={{ background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:16, padding:'32px 28px', display:'flex', flexDirection:'column' }}>
                  <p style={{ fontFamily:theme.fontTitre, fontSize:22, fontWeight:700, color:theme.text, marginBottom:8 }}>{f.titre}</p>
                  {f.description && <p style={{ fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim, marginBottom:20, lineHeight:1.5, flex:1 }}>{f.description}</p>}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop: f.description ? 0 : 20 }}>
                    {prix.map(p => (
                      <button key={p.frequence} onClick={() => setChoix({ formation: f, frequence: p.frequence, prix: p.prix })}
                        style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', padding:'12px 16px', borderRadius:10, border:`1.5px solid ${theme.primary}`, background:'transparent', cursor:'pointer', fontFamily:theme.fontTexte }}>
                        <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{p.prix.toFixed(2)} $ <span style={{ color:theme.textDim, fontWeight:400 }}>{LABEL_FREQUENCE[p.frequence]}</span></span>
                        <span style={{ fontSize:11, fontWeight:700, color:theme.primary, textTransform:'uppercase', letterSpacing:'0.05em' }}>S'abonner →</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {choix && <PopupInscriptionAbonnement theme={theme} choix={choix} siteId={siteId} onFermer={() => setChoix(null)} />}
    </section>
  );
}