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
  icone?: string | null;
  avantages?: string[] | null;
  etiquette?: string | null;
  texte_bouton?: string | null;
}

const LABEL_FREQUENCE: Record<string, string> = { hebdomadaire: '/ semaine', mensuel: '/ mois', annuel: '/ an' };

const NOM_FREQUENCE: Record<string, string> = { hebdomadaire: 'Semaine', mensuel: 'Mois', annuel: 'An' };

type Frequence = 'hebdomadaire' | 'mensuel' | 'annuel';
interface ChoixAbonnement { formation: Formation; frequence: Frequence; prix: number; }

const montant = (n: number) => n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const estHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);
// Couleur du thème avec transparence (si ce n'est pas un code #rrggbb, la couleur est gardée telle quelle)
const voile = (c: string, alpha: string) => (estHex(c) ? c + alpha : c);
// Texte lisible sur un fond de la couleur du thème : noir si la couleur est pâle
const texteSur = (c: string) => {
  if (!estHex(c)) return '#fff';
  const n = parseInt(c.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160 ? '#111' : '#fff';
};

// ─── Carte verticale d'un forfait ──────────────────────────────────────────────
function CarteForfait({ theme, formation: f, prix, onChoisir }: { theme:AddonAbonnementTheme; formation:Formation; prix:{ frequence:Frequence; prix:number }[]; onChoisir:(c:ChoixAbonnement)=>void }) {
  const [frequence, setFrequence] = useState<Frequence | null>(null);
  const choisi = prix.find(p => p.frequence === frequence) || prix.find(p => p.frequence === 'mensuel') || prix[0];
  const enVedette = !!f.etiquette;
  const avantages = Array.isArray(f.avantages) ? f.avantages : [];

  return (
    <div style={{ position:'relative', background:theme.cardBg, border:`${enVedette ? 2 : 1}px solid ${enVedette ? theme.primary : theme.border}`, borderRadius:18, boxShadow: enVedette ? `0 12px 40px ${voile(theme.primary, '33')}` : 'none', display:'flex', flexDirection:'column', textAlign:'center', overflow:'hidden' }}>
      {f.etiquette && (
        <span style={{ position:'absolute', top:14, right:14, background:theme.primary, color:texteSur(theme.primary), fontFamily:theme.fontTexte, fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{f.etiquette}</span>
      )}
      <div style={{ padding:`${f.etiquette ? 52 : 32}px 24px 24px`, background:voile(theme.primary, '14'), borderBottom:`1px solid ${theme.border}` }}>
        {f.icone && <div style={{ fontSize:42, lineHeight:1, marginBottom:12 }}>{f.icone}</div>}
        <p style={{ fontFamily:theme.fontTitre, fontSize:24, fontWeight:700, color:theme.text, margin:0, overflowWrap:'anywhere' }}>{f.titre}</p>
        {f.description && <p style={{ fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim, margin:'8px 0 0', lineHeight:1.5 }}>{f.description}</p>}
        {choisi && (
          <p style={{ margin:'20px 0 0', color:theme.text, fontFamily:theme.fontTexte }}>
            <span style={{ fontSize:36, fontWeight:800 }}>{montant(choisi.prix)} $</span>
            <span style={{ fontSize:13, color:theme.textDim }}> {LABEL_FREQUENCE[choisi.frequence]}</span>
          </p>
        )}
        {prix.length > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:14, flexWrap:'wrap' }}>
            {prix.map(p => {
              const actif = p.frequence === choisi.frequence;
              return (
                <button key={p.frequence} type="button" aria-pressed={actif} onClick={() => setFrequence(p.frequence)}
                  style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${actif ? theme.primary : theme.border}`, background: actif ? voile(theme.primary, '33') : 'transparent', color: actif ? theme.text : theme.textDim, fontFamily:theme.fontTexte, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {NOM_FREQUENCE[p.frequence]}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ padding:'22px 24px 24px', display:'flex', flexDirection:'column', flex:1 }}>
        {avantages.length > 0 && (
          <ul style={{ listStyle:'none', margin:'0 0 22px', padding:0, textAlign:'left' }}>
            {avantages.map((a, i) => (
              <li key={i} style={{ display:'flex', gap:10, marginBottom:10, fontFamily:theme.fontTexte, fontSize:13, color:theme.text, lineHeight:1.5 }}>
                <span aria-hidden="true" style={{ color:theme.primary, fontWeight:800 }}>✓</span>
                <span style={{ overflowWrap:'anywhere' }}>{a}</span>
              </li>
            ))}
          </ul>
        )}
        {choisi && (
          <button type="button" onClick={() => onChoisir({ formation:f, frequence:choisi.frequence, prix:choisi.prix })}
            style={{ marginTop:'auto', width:'100%', padding:'13px 16px', borderRadius:12, border:'none', background:theme.primary, color:texteSur(theme.primary), fontFamily:theme.fontTexte, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {f.texte_bouton || "S'abonner"}
          </button>
        )}
      </div>
    </div>
  );
}

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
      <div onClick={e => e.stopPropagation()} style={{ background:theme.bg, border:`1px solid ${theme.primary}40`, borderRadius:14, padding:'28px 26px', maxWidth:420, width:'100%', position:'relative' }}>
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
            <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim, marginBottom:20 }}>{montant(choix.prix)} $ {LABEL_FREQUENCE[choix.frequence]}</p>
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
              style={{ width:'100%', marginTop:8, padding:'12px 0', borderRadius:8, border:'none', background:theme.primary, color:texteSur(theme.primary), fontFamily:theme.fontTexte, fontSize:13, fontWeight:700, cursor:'pointer', opacity:envoi?.6:1 }}>
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
    <section style={{ background:theme.bg, padding:'clamp(56px,8vw,100px) clamp(16px,4vw,48px)' }}>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(260px, 100%), 320px))', justifyContent:'center', alignItems:'stretch', gap:24 }}>
            {formations.map(f => <CarteForfait key={f.id} theme={theme} formation={f} prix={prixDisponibles(f)} onChoisir={setChoix} />)}
          </div>
        )}
      </div>
      {choix && <PopupInscriptionAbonnement theme={theme} choix={choix} siteId={siteId} onFermer={() => setChoix(null)} />}
    </section>
  );
}