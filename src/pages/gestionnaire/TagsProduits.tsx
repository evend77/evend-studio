/**
 * TagsProduits.tsx
 * src/pages/vendeur/TagsProduits.tsx
 * Page en lecture seule — consultation uniquement
 * Connectée à /api/tags (BD PostgreSQL)
 */

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tag {
  id: number;
  nom: string;
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const C = {
  teal:       '#537373',
  tealLight:  '#e8f0f0',
  border:     '#e1e4e8',
  text:       '#1a2332',
  textLight:  '#6b7280',
  green:      '#008060',
  greenLight: '#e6f4f1',
  blue:       '#1e40af',
  blueLight:  '#dbeafe',
};

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${color}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TagsProduits() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE}/tags`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setTags(Array.isArray(data) ? data : (data.tags || []));
      } catch (err: any) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const tagsFiltres = tags.filter(t =>
    t.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🏷️</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: C.text }}>Tags produits</h1>
          <span style={{ background: C.tealLight, color: C.teal, fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${C.teal}` }}>
            Lecture seule
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
          Liste des tags disponibles sur e-Vend. Vous pouvez les appliquer à vos produits lors de la création ou modification d'une annonce.
        </p>
      </div>

      {/* Bandeau info */}
      <div style={{ background: C.blueLight, border: `1px solid #93c5fd`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span style={{ fontSize: '13px', color: C.blue }}>
          Les tags sont gérés par l'administration d'e-Vend. Pour suggérer un nouveau tag, contactez le support.
        </span>
      </div>

      {/* Section tags */}
      <SectionCard icon="🏷️" title={`Tags disponibles (${tags.length})`} color={C.teal}>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un tag..."
            style={{ width: '100%', padding: '9px 14px', fontSize: '13px', border: `1px solid ${C.border}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: C.text }}
          />
        </div>

        {/* Contenu */}
        {chargement ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Chargement des tags...</div>
          </div>
        ) : erreur ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#E74C3C' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
            <div style={{ fontSize: '14px' }}>Erreur : {erreur}</div>
          </div>
        ) : tagsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontSize: '14px' }}>{recherche ? 'Aucun tag correspondant' : 'Aucun tag disponible'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {tagsFiltres.map(tag => (
              <div key={tag.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: C.tealLight, border: `1px solid ${C.teal}`,
                borderRadius: '8px', padding: '8px 14px',
                fontSize: '13px', fontWeight: '600', color: C.teal,
                cursor: 'default', userSelect: 'none',
              }}>
                <span style={{ fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>🏷️</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.nom}</span>
              </div>
            ))}
          </div>
        )}

        {/* Compteur filtré */}
        {recherche && tagsFiltres.length > 0 && (
          <div style={{ marginTop: '14px', fontSize: '12px', color: C.textLight, textAlign: 'right' }}>
            {tagsFiltres.length} résultat{tagsFiltres.length > 1 ? 's' : ''} sur {tags.length} tags
          </div>
        )}
      </SectionCard>

      {/* Section explication */}
      <SectionCard icon="💡" title="Comment utiliser les tags ?" color={C.green}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { step: '1', text: 'Lors de la création ou modification d\'une annonce, accédez à la section "Tags".' },
            { step: '2', text: 'Sélectionnez les tags qui correspondent le mieux à votre produit.' },
            { step: '3', text: 'Les tags aident les acheteurs à trouver vos produits via la recherche et les filtres.' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: C.green, color: '#fff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step}
              </div>
              <div style={{ fontSize: '13px', color: C.text, lineHeight: '1.5', paddingTop: '4px' }}>{text}</div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
