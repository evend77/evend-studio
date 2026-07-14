// src/addons/pub-sponsor/AddonPubSponsor.tsx
// e-Vend Studio — Add-on Pub Sponsor
// Ne connaît AUCUN template. Reçoit un thème neutre + des données neutres,
// exactement comme AddonReservationEcole/AddonAbonnementEcole. Affiche UNE pub
// commanditaire dans un cadre à dimensions fixes (peu importe le format de la
// pub) et facture le clic au commanditaire via l'API existante.
//
// ⚠️ LIMITATION CONNUE (à lever plus tard côté backend) : sponsor_pubs ne stocke
// qu'une seule image (`url_image`) peu importe le format choisi à la création
// (carrousel/vidéo/avant-après/parallaxe/mini-jeu). Ces formats retombent donc
// ici sur un rendu "basique" (image + lien) jusqu'à ce que le stockage multi-
// images/vidéo soit ajouté à sponsor_pubs.js + SponsorPubsCreer.tsx.

import { useState, useEffect } from 'react';
import RoueFortune from '../../components/RoueFortune';

export interface AddonPubTheme {
  primary: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textDim: string;
  fontTitre: string;
  fontTexte: string;
}

export interface AddonPubData {
  siteId?: number | string;
  gestionnaireId?: number | string;
  pubActive?: boolean;
  categorieSite: string; // ex: 'cours' — sert à cibler les pubs pertinentes
  titreLabel?: string;   // ex: "Nos partenaires" — optionnel, petit label au-dessus
}

interface PubApi {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  url_lien: string;
  type: string;
  effet: string | null;
  extra_data: any;
  categories: string[];
  roue_active: boolean;
  codes_promo_roue: string[];
  sponsor_id: number;
  sponsor_nom: string;
}

function parseExtra(extra: any) {
  if (!extra) return {};
  if (typeof extra === 'string') { try { return JSON.parse(extra); } catch { return {}; } }
  return extra;
}

export default function AddonPubSponsor({ theme, data }: { theme: AddonPubTheme; data: AddonPubData }) {
  const { siteId, gestionnaireId, pubActive, categorieSite, titreLabel } = data;
  const [pub, setPub] = useState<PubApi | null>(null);
  const [chargement, setChargement] = useState(!!pubActive);
  const [roueOuverte, setRoueOuverte] = useState(false);

  const chargerPub = () => {
    if (!pubActive) return;
    setChargement(true);
    const url = `/api/sponsors/pub/random/${encodeURIComponent(categorieSite || 'general')}${gestionnaireId ? `?gestionnaireId=${gestionnaireId}` : ''}`;
    fetch(url)
      .then(r => r.ok ? r.json() : { pub: null })
      .then(d => setPub(d.pub || null))
      .catch(() => setPub(null))
      .finally(() => setChargement(false));
  };
  useEffect(() => { chargerPub(); }, [pubActive, categorieSite, gestionnaireId]);

  // L'add-on ne s'affiche que si activé — et rien tant qu'aucune pub n'est disponible
  // (pas de cadre vide sur le site).
  if (!pubActive || chargement) return null;
  if (!pub) return null;

  const extra = parseExtra(pub.extra_data);

  const enregistrerClic = () => {
    fetch(`/api/sponsors/pub/${pub.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestionnaireId }),
    }).catch(() => {});
  };

  const suivreLien = () => {
    enregistrerClic();
    if (pub.url_lien) window.open(pub.url_lien, '_blank', 'noopener,noreferrer');
  };

  // ── Contenu selon le format ────────────────────────────────────────────
  // basique / carrousel / video / avant_apres / parallaxe / minijeu → rendu image simple (voir limitation en en-tête)
  const renderContenu = () => {
    switch (pub.type) {
      case 'codepromo': {
        const code = extra.code_promo || '';
        return (
          <>
            <img src={pub.url_image} alt={pub.titre} style={imgStyle} />
            {code && (
              <div style={{ position:'absolute', bottom:16, left:16, padding:'8px 16px', borderRadius:8, background:theme.primary, color:'#fff', fontFamily:theme.fontTexte, fontSize:14, fontWeight:700, letterSpacing:'0.05em' }}>
                🏷️ {code}
              </div>
            )}
          </>
        );
      }
      case 'temoignage': {
        const note = extra.note || 5;
        const auteur = extra.auteur || '';
        return (
          <>
            <img src={pub.url_image} alt={pub.titre} style={imgStyle} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px', background:'linear-gradient(0deg, rgba(0,0,0,.75), transparent)' }}>
              <p style={{ margin:0, color:'#fbbf24', fontSize:14 }}>{'★'.repeat(note)}{'☆'.repeat(5-note)}</p>
              <p style={{ margin:'4px 0 0', color:'#fff', fontFamily:theme.fontTexte, fontSize:12, fontStyle:'italic' }}>{pub.description}</p>
              {auteur && <p style={{ margin:'2px 0 0', color:'rgba(255,255,255,.7)', fontFamily:theme.fontTexte, fontSize:11 }}>— {auteur}</p>}
            </div>
          </>
        );
      }
      case 'social': {
        const compteur = extra.compteur ?? 0;
        return (
          <>
            <img src={pub.url_image} alt={pub.titre} style={imgStyle} />
            <div style={{ position:'absolute', top:16, right:16, padding:'6px 14px', borderRadius:20, background:'rgba(0,0,0,.65)', color:'#fff', fontFamily:theme.fontTexte, fontSize:12, fontWeight:700 }}>
              🔥 {compteur} récemment
            </div>
          </>
        );
      }
      case 'interactive': {
        const choix = [extra.choix1, extra.choix2, extra.choix3].filter(Boolean);
        return (
          <>
            <img src={pub.url_image} alt={pub.titre} style={imgStyle} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 18px', background:'linear-gradient(0deg, rgba(0,0,0,.8), transparent)' }}>
              {extra.question && <p style={{ margin:'0 0 8px', color:'#fff', fontFamily:theme.fontTexte, fontSize:13, fontWeight:700 }}>{extra.question}</p>}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {choix.map((c: string, i: number) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); suivreLien(); }}
                    style={{ padding:'6px 12px', borderRadius:20, border:'1px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.15)', color:'#fff', fontFamily:theme.fontTexte, fontSize:11, cursor:'pointer' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }
      default:
        return <img src={pub.url_image} alt={pub.titre} style={imgStyle} />;
    }
  };

  const imgStyle = { width:'100%', height:'100%', objectFit:'cover', display:'block' } as const;

  return (
    <section className="addon-pub-sponsor" style={{ background:theme.bg, padding:'48px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        {titreLabel && (
          <p style={{ fontFamily:theme.fontTexte, fontSize:11, fontWeight:600, color:theme.primary, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>
            {titreLabel}
          </p>
        )}
        <div
          onClick={suivreLien}
          className="addon-pub-cadre"
          style={{
            position:'relative', width:'100%', margin:'0 auto', maxWidth:1320,
            borderRadius:12, overflow:'hidden', cursor: pub.url_lien ? 'pointer' : 'default',
            border:`1px solid ${theme.border}`, background:theme.cardBg,
          }}
        >
          {renderContenu()}
          <span style={{ position:'absolute', top:10, left:10, padding:'2px 8px', borderRadius:4, background:'rgba(0,0,0,.55)', color:'rgba(255,255,255,.85)', fontFamily:theme.fontTexte, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Publicité
          </span>
          {pub.roue_active && (
            <button
              onClick={(e) => { e.stopPropagation(); setRoueOuverte(true); }}
              style={{ position:'absolute', bottom:12, right:12, padding:'8px 16px', borderRadius:20, border:'none', background:theme.primary, color:'#fff', fontFamily:theme.fontTexte, fontSize:12, fontWeight:700, cursor:'pointer' }}
            >
              🎡 Tourner la roue
            </button>
          )}
        </div>
      </div>

      {roueOuverte && (
        <RoueFortune
          codes={pub.codes_promo_roue || []}
          sponsorName={pub.sponsor_nom}
          onClose={() => setRoueOuverte(false)}
          onWin={(code) => {
            fetch(`/api/sponsors/roue/${pub.id}/participer`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gagne: !!code }),
            }).catch(() => {});
          }}
        />
      )}

      <style>{`
        .addon-pub-cadre { aspect-ratio: 21 / 6; }
        @media (max-width: 768px) {
          .addon-pub-sponsor { padding: 32px 20px !important; }
          .addon-pub-cadre { aspect-ratio: 4 / 3; border-radius: 10px !important; }
        }
      `}</style>
    </section>
  );
}