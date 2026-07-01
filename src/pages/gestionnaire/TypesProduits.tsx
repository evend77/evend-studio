/**
 * TypesProduits.tsx
 * src/pages/vendeur/TypesProduits.tsx
 * Page en lecture seule — consultation uniquement
 * Connectée à /api/types-produits (BD PostgreSQL)
 */

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TypeProduit {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
}

// ─── Icônes par nom (hardcodées côté frontend) ────────────────────────────────
const ICONES: Record<string, string> = {
  'Produit physique':  '📦',
  'Produit numerique': '💾',
  'Service':           '🛠️',
  'Billet Evenement':  '🎟️',
  'Abonnement':        '🔄',
  'Enchere':           '🔨',
};

function getIcone(nom: string): string {
  return ICONES[nom] ?? '📦';
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
        <span style={{ fontSize: '13px', fontWeight: '800', color, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TypesProduits() {
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE}/types-produits`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🗂️</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: C.text }}>Types de produits</h1>
          <span style={{ background: C.tealLight, color: C.teal, fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${C.teal}` }}>
            Lecture seule
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
          Les types de produits définissent la nature de ce que vous vendez. Choisissez le bon type lors de la création d'une annonce.
        </p>
      </div>

      {/* Bandeau info */}
      <div style={{ background: C.blueLight, border: `1px solid #93c5fd`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span style={{ fontSize: '13px', color: C.blue }}>
          Les types de produits sont définis par l'administration d'e-Vend. Ils ne peuvent pas être modifiés par les vendeurs.
        </span>
      </div>

      {/* Section types */}
      <SectionCard icon="🗂️" title={`Types disponibles (${types.length})`} color={C.teal}>
        {chargement ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textLight }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Chargement...</div>
          </div>
        ) : erreur ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#E74C3C' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
            <div style={{ fontSize: '14px' }}>Erreur : {erreur}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {types.map(type => (
              <div key={type.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                background: '#f8fafc', border: `1px solid ${C.border}`,
                borderRadius: '10px', padding: '16px',
              }}>
                <div style={{
                  width: '44px', height: '44px', flexShrink: 0,
                  background: C.tealLight, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  {getIcone(type.nom)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>
                    {type.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: C.textLight, lineHeight: '1.5' }}>
                    {type.description || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Section explication */}
      <SectionCard icon="💡" title="Comment choisir le bon type ?" color={C.green}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { step: '1', text: "Lors de la création d'une annonce, la section \"Type de produit\" vous demande de choisir parmi ces options." },
            { step: '2', text: 'Choisissez selon la nature de ce que vous vendez — physique, numérique, service, etc.' },
            { step: '3', text: 'Le type choisi détermine les options disponibles (expédition, téléchargement, réservation...).' },
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
