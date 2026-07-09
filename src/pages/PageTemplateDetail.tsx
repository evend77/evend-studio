// src/pages/PageTemplateDetail.tsx
// e-Vend Studio — Page détail publique d'un template
// Route : /templates/:id
//
// Combine deux sources :
// 1. Les données du template (TEMPLATES dans PageTemplates.tsx) — nom, prix, fonctionnalités, photo.
// 2. Un "guide" long-form OPTIONNEL, stocké dans pages_plateforme (slug = `template-${id}`),
//    éditable depuis le dashboard admin existant (PagesPlateforme.tsx) — AUCUN backend à ajouter.
//    S'il n'existe pas encore pour ce template, la section guide est simplement absente.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';
import { TEMPLATES, PHOTOS, GROUPES, CATEGORIES, templatesDeCategorie } from './PageTemplates';

const API_BASE = '/api';

interface GuidePage {
  slug: string;
  titre: string;
  contenu: string;
  meta_description: string | null;
  updated_at: string;
}

function ouvrirApercu(templateId: string) {
  const url = `/site-preview?forceTemplate=${templateId}&demo=true`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function PageTemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [prixParTemplate, setPrixParTemplate] = useState<Record<string, string>>({});
  const [guide, setGuide] = useState<GuidePage | null>(null);
  const [guideCharge, setGuideCharge] = useState(false);

  const t = TEMPLATES.find(x => x.id === id);
  const groupe = t ? GROUPES.find(g => g.id === t.groupe) : undefined;
  const categorie = t ? CATEGORIES.find(c => templatesDeCategorie(c, TEMPLATES).some(ct => ct.id === t.id)) : undefined;
  const prixFinal = t ? (prixParTemplate[t.id] || t.prix || 'Gratuit') : 'Gratuit';
  const estGratuit = prixFinal === 'Gratuit';

  // ── SEO — utilise la meta_description du guide si dispo, sinon la description courte ──
  usePageSeo(t ? {
    titre: `${t.nom} — Template ${estGratuit ? 'gratuit' : prixFinal} | e-Vend Studio`,
    description: guide?.meta_description || t.description,
    url: `https://e-vend.ca/templates/${t.id}`,
  } : {});

  useEffect(() => {
    fetch('/api/templates/prix')
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const map: Record<string, string> = {};
        for (const tpl of TEMPLATES) {
          const surcharge = data.templates[tpl.id]?.prix_texte;
          const defautCategorie = data.groupes[tpl.groupe]?.prix_texte;
          map[tpl.id] = surcharge || defautCategorie || 'Gratuit';
        }
        setPrixParTemplate(map);
      })
      .catch(() => {});
  }, []);

  // Charge le guide long depuis pages_plateforme — silencieux si absent (404 normal, pas une erreur)
  useEffect(() => {
    if (!id) return;
    setGuideCharge(false);
    fetch(`${API_BASE}/pagesPlateforme/public/template-${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setGuide(data?.page || null))
      .catch(() => setGuide(null))
      .finally(() => setGuideCharge(true));
  }, [id]);

  if (!t) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 48 }}>🔍</p>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>Template introuvable</p>
        <button onClick={() => navigate('/templates')} style={{ padding: '10px 24px', background: '#c9a96e', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
          ← Voir tous les templates
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }

        .guide-contenu h1, .guide-contenu h2, .guide-contenu h3, .guide-contenu h4 {
          font-family: 'Syne', sans-serif; color: #fff; margin: 2em 0 0.6em; line-height: 1.25;
        }
        .guide-contenu h1 { font-size: 1.6rem; }
        .guide-contenu h2 { font-size: 1.3rem; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4em; }
        .guide-contenu h3 { font-size: 1.05rem; color: ${t.couleur}; }
        .guide-contenu p { color: rgba(255,255,255,0.65); line-height: 1.8; margin-bottom: 1.1em; font-size: 0.95rem; }
        .guide-contenu ul, .guide-contenu ol { color: rgba(255,255,255,0.65); padding-left: 1.5em; margin-bottom: 1.1em; }
        .guide-contenu li { margin-bottom: 0.4em; line-height: 1.7; font-size: 0.95rem; }
        .guide-contenu a { color: ${t.couleur}; text-decoration: underline; }
        .guide-contenu strong { color: rgba(255,255,255,0.9); font-weight: 600; }
        .guide-contenu img { max-width: 100%; height: auto; border-radius: 12px; }
        .guide-contenu blockquote {
          border-left: 3px solid ${t.couleur}; padding: 0.6em 1.2em; margin: 1.2em 0;
          background: ${t.couleur}10; border-radius: 0 8px 8px 0; color: rgba(255,255,255,0.6); font-style: italic;
        }
      `}</style>

      {/* ── NAV minimale ─────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#c9a96e' }}>e</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>VEND STUDIO</span>
          </div>
          <button onClick={() => navigate('/templates')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
            ← Tous les templates
          </button>
        </div>
      </nav>

      {/* ── Fil d'Ariane — bon pour le SEO et la navigation interne ────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          <span onClick={() => navigate('/templates')} style={{ cursor: 'pointer' }}>Templates</span>
          {categorie && (
            <>
              <span>/</span>
              <span onClick={() => navigate('/templates')} style={{ cursor: 'pointer' }}>{categorie.titre}</span>
            </>
          )}
          {groupe && (
            <>
              <span>/</span>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{groupe.label}</span>
            </>
          )}
          <span>/</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{t.nom}</span>
        </div>
      </div>

      {/* ── Hero du template ─────────────────────────────────────────────── */}
      <header style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 40, alignItems: 'start' }}
        className="template-detail-hero">
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {t.nouveau && <span style={{ background: '#f5a623', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>NOUVEAU</span>}
            {!t.disponible && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>BIENTÔT</span>}
            <span style={{ background: estGratuit ? t.couleur + '20' : '#f59e0b22', color: estGratuit ? t.couleur : '#b45309', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {prixFinal}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            {t.nom}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24, maxWidth: 560 }}>
            {t.description}
          </p>

          {/* Fonctionnalités complètes (pas tronquées à 3 comme sur la carte) */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Ce qui est inclus</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
              {t.fonctionnalites.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.couleur, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {t.disponible && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => ouvrirApercu(t.id)}
                style={{ padding: '13px 24px', background: 'transparent', border: `2px solid ${t.couleur}`, borderRadius: 10, color: t.couleur, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                👁 Aperçu en direct
              </button>
              <button onClick={() => navigate(`/inscription?template=${t.id}`)}
                style={{ padding: '13px 28px', background: t.couleur, border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                Commencer avec ce template →
              </button>
            </div>
          )}
        </div>

        {/* Photo */}
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${t.couleur}30`, boxShadow: `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${t.couleur}15` }}>
          <img src={PHOTOS[t.id] || PHOTOS.hero} alt={t.nom} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </header>

      {/* ── Guide long — SEULEMENT si un admin l'a rédigé dans pages_plateforme ── */}
      {guideCharge && guide?.contenu && (
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${t.couleur}50, transparent)`, marginBottom: 40 }} />
          <div className="guide-contenu" dangerouslySetInnerHTML={{ __html: guide.contenu }} />
        </section>
      )}

      {/* ── CTA bas de page ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: `linear-gradient(135deg, ${t.couleur}15, transparent)`, border: `1px solid ${t.couleur}30`, borderRadius: 20, padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Prêt à lancer votre site avec {t.nom} ?</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>Aucune carte de crédit requise pour commencer.</p>
          <button onClick={() => navigate(`/inscription?template=${t.id}`)}
            style={{ padding: '13px 32px', background: t.couleur, border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Créer mon site →
          </button>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 e-Vend Studio</p>
      </footer>
    </div>
  );
}