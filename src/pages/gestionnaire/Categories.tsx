/**
 * Categories.tsx
 * src/pages/vendeur/Categories.tsx
 * Page en lecture seule — consultation uniquement
 * Connectée à /api/categories (BD PostgreSQL)
 */

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Categorie {
  id: number;
  nom: string;
  description: string | null;
  parent_id: number | null;
  active: boolean;
  product_count?: number;
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const C = {
  teal:       '#537373',
  tealLight:  '#e8f0f0',
  border:     '#e1e4e8',
  text:       '#1a2332',
  textLight:  '#6b7280',
  green:      '#008060',
  blue:       '#1e40af',
  blueLight:  '#dbeafe',
};

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${color}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', paddingRight: '20px', boxSizing: 'border-box' as const }}>{children}</div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Categories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const liste = Array.isArray(data) ? data : (data.categories || []);
        // Trier alphabétiquement
        liste.sort((a: Categorie, b: Categorie) => a.nom.localeCompare(b.nom, 'fr'));
        setCategories(liste);
      } catch (err: any) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const catsFiltrees = categories.filter(c =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  // Séparer principales (sans parent) et sous-catégories
  const principales = catsFiltrees.filter(c => !c.parent_id);
  const sousCategories = catsFiltrees.filter(c => !!c.parent_id);

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', boxSizing: 'border-box' as const }}>

      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>📂</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: C.text }}>Catégories</h1>
          <span style={{ background: C.tealLight, color: C.teal, fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${C.teal}` }}>
            Lecture seule
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
          Liste des catégories disponibles sur e-Vend. Choisissez la bonne catégorie lors de la création d'une annonce.
        </p>
      </div>

      {/* Bandeau info */}
      <div style={{ background: C.blueLight, border: `1px solid #93c5fd`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span style={{ fontSize: '13px', color: C.blue }}>
          Les catégories sont gérées par l'administration d'e-Vend. Pour suggérer une nouvelle catégorie, contactez le support.
        </span>
      </div>

      {/* Section liste */}
      <SectionCard icon="📂" title={`Catégories disponibles (${categories.length})`} color={C.teal}>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une catégorie..."
            style={{ width: '100%', padding: '9px 14px', fontSize: '13px', border: `1px solid ${C.border}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const, color: C.text }}
          />
        </div>

        {chargement ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Chargement des catégories...</div>
          </div>
        ) : erreur ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#E74C3C' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
            <div style={{ fontSize: '14px' }}>Erreur : {erreur}</div>
          </div>
        ) : catsFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontSize: '14px' }}>{recherche ? 'Aucune catégorie correspondante' : 'Aucune catégorie disponible'}</div>
          </div>
        ) : (
          <>
            {/* Catégories principales */}
            {principales.length > 0 && (
              <div style={{ marginBottom: sousCategories.length > 0 ? '20px' : 0 }}>
                {recherche === '' && (
                  <div style={{ fontSize: '11px', fontWeight: '700', color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Catégories principales ({principales.length})
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {principales.map(cat => (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: C.tealLight, border: `1px solid ${C.teal}`,
                      borderRadius: '6px', padding: '5px 10px',
                      fontSize: '12px', fontWeight: '600', color: C.teal,
                      cursor: 'default', alignSelf: 'start',
                    }}>
                      <span style={{ fontSize: '11px', flexShrink: 0 }}>📁</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={cat.nom}>{cat.nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sous-catégories */}
            {sousCategories.length > 0 && (
              <div>
                {recherche === '' && (
                  <div style={{ fontSize: '11px', fontWeight: '700', color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Sous-catégories ({sousCategories.length})
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {sousCategories.map(cat => (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: '#f8fafc', border: `1px solid ${C.border}`,
                      borderRadius: '8px', padding: '8px 12px',
                      fontSize: '12px', fontWeight: '500', color: C.text,
                      cursor: 'default',
                    }}>
                      <span style={{ fontSize: '12px', flexShrink: 0, opacity: 0.5 }}>└</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={cat.nom}>{cat.nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compteur filtré */}
            {recherche && (
              <div style={{ marginTop: '14px', fontSize: '12px', color: C.textLight, textAlign: 'right' as const }}>
                {catsFiltrees.length} résultat{catsFiltrees.length > 1 ? 's' : ''} sur {categories.length} catégories
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* Section conseils */}
      <SectionCard icon="💡" title="Comment bien choisir sa catégorie ?" color={C.green}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {[
            { step: '1', text: "Lors de la création d'une annonce, utilisez la barre de recherche pour trouver rapidement la bonne catégorie." },
            { step: '2', text: 'Choisissez la catégorie la plus précise possible — une sous-catégorie est toujours meilleure qu\'une catégorie générale.' },
            { step: '3', text: 'Une bonne catégorie aide les acheteurs à trouver vos produits plus facilement via les filtres de recherche.' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: C.green, color: '#fff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
