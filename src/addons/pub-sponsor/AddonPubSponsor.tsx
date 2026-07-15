// src/addons/pub-sponsor/AddonPubSponsor.tsx
// e-Vend Studio — Add-on Pub Sponsor
// Ne connaît AUCUN template. Reçoit un thème neutre + des données neutres,
// exactement comme AddonReservationEcole/AddonAbonnementEcole. Affiche UNE pub
// commanditaire dans une carte compacte à 2 zones (image + bandeau titre/
// description/bouton), à dimensions fixes peu importe le format de la pub,
// et facture le clic au commanditaire via l'API existante.
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
  prix_par_click?: number;
}

function parseExtra(extra: any) {
  if (!extra) return {};
  if (typeof extra === 'string') { try { return JSON.parse(extra); } catch { return {}; } }
  return extra;
}

export default function AddonPubSponsor({ theme, data }: { theme: AddonPubTheme; data: AddonPubData }) {
  const { gestionnaireId, pubActive, categorieSite, titreLabel } = data;
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

  const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as const;

  // ── Zone image — juste l'image + badges qui vivent PAR-DESSUS l'image ────
  const renderImage = () => {
    const compteur = extra.compteur;
    const code = extra.code_promo;
    return (
      <div
        className="addon-pub-image-zone"
        onClick={suivreLien}
        style={{ position: 'relative', width: '100%', overflow: 'hidden', cursor: pub.url_lien ? 'pointer' : 'default' }}
      >
        <img src={pub.url_image} alt={pub.titre} style={imgStyle} />
        <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,.55)', color: 'rgba(255,255,255,.85)', fontFamily: theme.fontTexte, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Publicité
        </span>
        {pub.type === 'social' && compteur !== undefined && (
          <div style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.65)', color: '#fff', fontFamily: theme.fontTexte, fontSize: 11, fontWeight: 700 }}>
            🔥 {compteur} récemment
          </div>
        )}
        {pub.type === 'codepromo' && code && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '5px 12px', borderRadius: 6, background: theme.primary, color: '#fff', fontFamily: theme.fontTexte, fontSize: 12, fontWeight: 700, letterSpacing: '0.03em' }}>
            🏷️ {code}
          </div>
        )}
        {pub.roue_active && (
          <button
            onClick={(e) => { e.stopPropagation(); setRoueOuverte(true); }}
            style={{ position: 'absolute', bottom: 8, right: 8, padding: '6px 12px', borderRadius: 20, border: 'none', background: theme.primary, color: '#fff', fontFamily: theme.fontTexte, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            🎡 Roue
          </button>
        )}
      </div>
    );
  };

  // ── Zone texte — titre / description / action, sous l'image, hauteur fixe ─
  const renderFooter = () => {
    if (pub.type === 'temoignage') {
      const note = extra.note || 5;
      const auteur = extra.auteur || '';
      return (
        <>
          <p style={{ margin: '0 0 4px', color: '#fbbf24', fontSize: 13, letterSpacing: 1 }}>{'★'.repeat(note)}{'☆'.repeat(5 - note)}</p>
          <p className="addon-pub-desc" style={{ margin: 0, color: theme.text, fontFamily: theme.fontTexte, fontSize: 13, fontStyle: 'italic' }}>
            « {pub.description} »
          </p>
          {auteur && <p style={{ margin: '4px 0 0', color: theme.textDim, fontFamily: theme.fontTexte, fontSize: 11 }}>— {auteur}</p>}
        </>
      );
    }

    if (pub.type === 'interactive') {
      const choix = [extra.choix1, extra.choix2, extra.choix3].filter(Boolean);
      return (
        <>
          <h4 style={{ margin: '0 0 6px', color: theme.text, fontFamily: theme.fontTitre, fontSize: 16, fontWeight: 700 }}>{pub.titre}</h4>
          {extra.question && <p style={{ margin: '0 0 8px', color: theme.textDim, fontFamily: theme.fontTexte, fontSize: 12 }}>{extra.question}</p>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {choix.map((c: string, i: number) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); suivreLien(); }}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${theme.primary}`, background: 'transparent', color: theme.primary, fontFamily: theme.fontTexte, fontSize: 11, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </>
      );
    }

    // basique / carrousel / video / avant_apres / parallaxe / minijeu / codepromo / social
    return (
      <>
        <h4 style={{ margin: '0 0 4px', color: theme.text, fontFamily: theme.fontTitre, fontSize: 16, fontWeight: 700 }}>{pub.titre}</h4>
        <p className="addon-pub-desc" style={{ margin: '0 0 10px', color: theme.textDim, fontFamily: theme.fontTexte, fontSize: 12.5, lineHeight: 1.4 }}>
          {pub.description}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); suivreLien(); }}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: theme.primary, color: '#fff', fontFamily: theme.fontTexte, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          🔗 En savoir plus
        </button>
      </>
    );
  };

  return (
    <section className="addon-pub-sponsor" style={{ background: theme.bg, padding: '48px 24px' }}>
      {titreLabel && (
        <p style={{ fontFamily: theme.fontTexte, fontSize: 11, fontWeight: 600, color: theme.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
          {titreLabel}
        </p>
      )}
      <div
        className="addon-pub-cadre"
        style={{
          display: 'flex', flexDirection: 'column', margin: '0 auto',
          borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${theme.border}`, background: theme.cardBg,
        }}
      >
        {renderImage()}
        <div className="addon-pub-footer" style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {renderFooter()}
        </div>
        <div style={{ padding: '6px 16px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: theme.fontTexte, fontSize: 10, color: theme.textDim }}>★ {pub.sponsor_nom}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: theme.textDim, opacity: 0.6 }}>ID #{pub.id}</span>
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
        .addon-pub-cadre {
          width: 100%;
          max-width: 380px;
          height: 400px;
        }
        .addon-pub-image-zone { height: 200px; flex: 0 0 200px; }
        .addon-pub-desc {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .addon-pub-sponsor { padding: 32px 16px !important; }
          .addon-pub-cadre { max-width: 300px; height: 340px; border-radius: 10px !important; }
          .addon-pub-image-zone { height: 150px; flex: 0 0 150px; }
        }
      `}</style>
    </section>
  );
}