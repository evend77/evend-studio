// src/addons/reservation-ecole/AddonReservationEcole.tsx
// e-Vend Studio — Add-on Réservation École/Cours
// Ne connaît AUCUN template. Reçoit un thème neutre + des données neutres,
// exactement comme addons/contact/AddonContact.tsx. Affiche l'horaire du
// commerce et, si l'add-on est activé par le gestionnaire, permet aux clients
// de s'inscrire à un cours en temps réel (vraies places disponibles).

import { useState, useEffect } from 'react';

// ─── Contrat de thème — traduit par un petit adaptateur dans chaque template ──
export interface AddonReservationTheme {
  primary: string;       // couleur d'accent principale (boutons, badges)
  accentSecondaire?: string; // couleur du petit label au-dessus du titre (ex: "or")
  bg: string;             // fond de la section
  cardBg: string;         // fond du tableau/cartes
  border: string;
  text: string;
  textDim: string;
  fontTitre: string;
  fontTexte: string;
}

export interface AddonReservationData {
  siteId?: number | string;
  reservationActive?: boolean;
  titreLabel: string;          // ex: "Planning"
  titre: string;                // ex: "Horaires du studio" (peut contenir un <em>-style via titreAccent)
  titreAccent?: string;         // portion du titre à mettre en emphase (couleur accentSecondaire)
  labelBoutonHeader: string;    // ex: "Réserver une place"
  onClicBoutonHeader?: () => void;
  // Résout une couleur d'accent pour un "style" donné (ex: styles de danse). Optionnel.
  couleurParStyle?: (style: string) => string | undefined;
}

interface DispoReelle {
  id: number;
  date_debut: string;
  date_fin: string;
  capacite_max: number;
  titre: string | null;
  salle: string | null;
  professeur: string | null;
  niveau: string | null;
  style: string | null;
  prix: string | null;
  actif: boolean;
}

const NOMS_JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
function dispoVersAffichage(d: DispoReelle, placesRestantes: number) {
  const dt = new Date(d.date_debut);
  const jour = NOMS_JOURS[dt.getDay()];
  const heure = `${String(dt.getHours()).padStart(2,'0')}h${String(dt.getMinutes()).padStart(2,'0')}`;
  return {
    id: d.id, date_debut: d.date_debut, date_fin: d.date_fin,
    jour, heure,
    style: d.style || d.titre || 'Cours',
    niveau: d.niveau || '',
    salle: d.salle || '',
    professeur: d.professeur || '',
    prix: d.prix || '',
    places: d.capacite_max,
    placesRestantes,
  };
}
type CoursAffichable = ReturnType<typeof dispoVersAffichage>;

// ─── Popup d'inscription à un cours (utilise toujours une vraie date de créneau) ──
function PopupInscriptionCours({ theme, cours, siteId, onFermer, onInscrit }: { theme:AddonReservationTheme; cours:CoursAffichable; siteId?:number|string; onFermer:()=>void; onInscrit:()=>void }) {
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
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          nom_client: nom.trim(),
          email_client: email.trim(),
          telephone: telephone.trim(),
          date_debut: cours.date_debut,
          date_fin: cours.date_fin,
          nb_personnes: 1,
          type_reservation: 'cours',
          objet_reserve: `${cours.style}${cours.niveau ? ' — ' + cours.niveau : ''} (${cours.jour} ${cours.heure})`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErreur(data.message || "Erreur lors de l'inscription."); setEnvoi(false); return; }
      if (data.payment_required && data.reservation?.id) {
        window.location.href = `/paiement?type=reservation&id=${data.reservation.id}`;
        return;
      }
      setSucces(true);
      onInscrit();
    } catch {
      setErreur('Erreur de connexion. Réessayez.');
    }
    setEnvoi(false);
  };

  return (
    <div onClick={onFermer} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:theme.cardBg, border:`1px solid ${theme.primary}40`, borderRadius:14, padding:'28px 26px', maxWidth:420, width:'100%', position:'relative' }}>
        <button onClick={onFermer} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:theme.textDim, fontSize:18, cursor:'pointer' }}>✕</button>
        {succes ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>✅</p>
            <p style={{ fontFamily:theme.fontTitre, fontSize:22, fontWeight:700, color:theme.text, marginBottom:8 }}>Inscription envoyée !</p>
            <p style={{ fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Vous recevrez un courriel de confirmation sous peu.</p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily:theme.fontTexte, fontSize:10, fontWeight:700, color:theme.primary, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>S'inscrire</p>
            <p style={{ fontFamily:theme.fontTitre, fontSize:24, fontWeight:700, color:theme.text, marginBottom:4 }}>{cours.style}{cours.niveau ? ` — ${cours.niveau}` : ''}</p>
            <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim, marginBottom:20 }}>{cours.jour} {cours.heure}{cours.salle ? ` · ${cours.salle}` : ''}{cours.professeur ? ` · ${cours.professeur}` : ''}</p>
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
              {envoi ? 'Envoi...' : "Confirmer l'inscription"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AddonReservationEcole({ theme, data }: { theme:AddonReservationTheme; data:AddonReservationData }) {
  const { siteId, reservationActive, couleurParStyle } = data;
  const [filtre, setFiltre] = useState('Tous');
  const [popup, setPopup] = useState<CoursAffichable | null>(null);
  const [dispos, setDispos] = useState<DispoReelle[]>([]);
  const [reservationsBrutes, setReservationsBrutes] = useState<{ date_debut:string; nb_personnes:number; statut:string }[]>([]);
  const [chargement, setChargement] = useState(!!reservationActive);

  const chargerDispos = () => {
    if (!reservationActive || !siteId) return;
    setChargement(true);
    fetch(`/api/reservations/disponibilites/${siteId}`)
      .then(r => r.ok ? r.json() : { disponibilites: [], reservations: [] })
      .then(d => { setDispos(d.disponibilites || []); setReservationsBrutes(d.reservations || []); })
      .catch(() => {})
      .finally(() => setChargement(false));
  };
  useEffect(() => { chargerDispos(); }, [reservationActive, siteId]);

  const coursAffichables: CoursAffichable[] = dispos.filter(d => d.actif).map(d => {
    const placesReservees = reservationsBrutes
      .filter(r => r.date_debut === d.date_debut && r.statut !== 'annulee')
      .reduce((s, r) => s + (r.nb_personnes || 1), 0);
    return dispoVersAffichage(d, d.capacite_max - placesReservees);
  });

  const opts = ['Tous', ...Array.from(new Set(coursAffichables.map(h => h.style)))];
  const filtres = filtre==='Tous' ? coursAffichables : coursAffichables.filter(h => h.style===filtre);
  const colStyle = (style: string) => couleurParStyle?.(style) || theme.primary;
  const entetes = ['Jour / Heure','Style & Niveau','Professeur','Salle','Prix', ...(reservationActive ? [''] : [])];

  // L'add-on ne s'affiche que si le gestionnaire l'a activé — aucun repli statique.
  if (!reservationActive) return null;

  return (
    <section style={{ background:theme.bg, padding:'100px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontFamily:theme.fontTexte, fontSize:11, fontWeight:600, color:theme.accentSecondaire || theme.primary, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:12 }}>{data.titreLabel}</p>
            <h2 style={{ fontFamily:theme.fontTitre, fontSize:'clamp(36px,5vw,68px)', fontWeight:600, color:theme.text, lineHeight:1.05 }}>
              {data.titre} {data.titreAccent && <em style={{ fontStyle:'italic', color:theme.accentSecondaire || theme.primary }}>{data.titreAccent}</em>}
            </h2>
          </div>
          {data.labelBoutonHeader && (
            <button onClick={data.onClicBoutonHeader} style={{ padding:'13px 28px', borderRadius:8, border:'none', background:theme.primary, color:'#fff', fontFamily:theme.fontTexte, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {data.labelBoutonHeader}
            </button>
          )}
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {opts.map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{ padding:'7px 16px', borderRadius:20, cursor:'pointer', fontFamily:theme.fontTexte, fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:filtre===f?theme.primary:'rgba(255,255,255,.08)', color:filtre===f?'#fff':theme.text, border:`1px solid ${filtre===f?theme.primary:theme.border}`, transition:'all .25s' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' as any }}>
          <div style={{ background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:8, overflow:'hidden', minWidth: reservationActive ? 620 : 520 }}>
            <div style={{ display:'grid', gridTemplateColumns: reservationActive ? '110px 1fr 90px 90px 60px auto' : '110px 1fr 90px 90px 60px', gap:12, alignItems:'center', padding:'14px 20px', background:`${theme.text}08`, borderBottom:`2px solid ${theme.primary}30` }}>
              {entetes.map((h,i) => (
                <p key={i} style={{ fontFamily:theme.fontTexte, fontSize:10, fontWeight:700, color:theme.textDim, letterSpacing:'0.15em', textTransform:'uppercase' }}>{h}</p>
              ))}
            </div>
            {chargement ? (
              <p style={{ padding:24, fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Chargement des horaires...</p>
            ) : filtres.length === 0 ? (
              <p style={{ padding:24, fontFamily:theme.fontTexte, fontSize:13, color:theme.textDim }}>Aucun cours pour le moment.</p>
            ) : filtres.map((h,i) => {
              const col = colStyle(h.style);
              const complet = reservationActive && h.placesRestantes <= 0;
              return (
                <div key={h.id ?? i} style={{ display:'grid', gridTemplateColumns: reservationActive ? '110px 1fr 90px 90px 60px auto' : '110px 1fr 90px 90px 60px', gap:12, alignItems:'center', padding:'14px 20px', borderBottom:`1px solid ${theme.border}` }}>
                  <div><p style={{ fontFamily:theme.fontTexte, fontSize:12, fontWeight:700, color:theme.text }}>{h.jour}</p><p style={{ fontFamily:theme.fontTexte, fontSize:11, color:col }}>{h.heure}</p></div>
                  <div>
                    <span style={{ fontFamily:theme.fontTexte, fontSize:11, padding:'2px 10px', background:`${col}20`, border:`1px solid ${col}40`, color:col, borderRadius:12, fontWeight:700 }}>{h.style}</span>
                    <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim, marginTop:4 }}>
                      {h.niveau}{h.niveau ? ' · ' : ''}{reservationActive ? (complet ? 'Complet' : `${h.placesRestantes} places`) : `${h.places} places`}
                    </p>
                  </div>
                  <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim }}>{h.professeur}</p>
                  <p style={{ fontFamily:theme.fontTexte, fontSize:12, color:theme.textDim }}>{h.salle}</p>
                  <p style={{ fontFamily:theme.fontTitre, fontSize:18, fontWeight:700, color:col }}>{h.prix}</p>
                  {reservationActive && (
                    complet ? (
                      <span style={{ padding:'7px 14px', borderRadius:20, background:`${theme.text}10`, color:theme.textDim, fontFamily:theme.fontTexte, fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', whiteSpace:'nowrap' as any }}>
                        Complet
                      </span>
                    ) : (
                      <button onClick={() => setPopup(h)} style={{ padding:'7px 14px', borderRadius:20, background:col, color:'#fff', border:'none', fontFamily:theme.fontTexte, fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap' as any }}>
                        S'inscrire
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {popup && <PopupInscriptionCours theme={theme} cours={popup} siteId={siteId} onFermer={() => setPopup(null)} onInscrit={chargerDispos} />}
    </section>
  );
}