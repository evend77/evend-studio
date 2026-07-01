// src/components/admin/ParutionInstructionsModal.tsx
import React, { useState, useEffect } from 'react';

interface Props {
  ouvert: boolean;
  onFermer: () => void;
}

// ── Données des étapes ─────────────────────────────────────────────────────
const ETAPES = [
  {
    numero: 1,
    titre: 'Ouvrir l\'éditeur de thème Shopify',
    icone: '🎨',
    couleur: '#6366f1',
    description: 'Accédez à l\'éditeur de thème dans votre admin Shopify.',
    instructions: [
      'Connectez-vous à votre admin Shopify',
      'Dans le menu de gauche, cliquez sur <strong>Boutique en ligne</strong>',
      'Cliquez sur <strong>Thèmes</strong>',
      'À côté de votre thème actif, cliquez sur <strong>Personnaliser</strong>',
    ],
    tip: '💡 Assurez-vous d\'être sur votre thème actif (celui avec l\'étiquette verte "Actif").',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
  {
    numero: 2,
    titre: 'Naviguer vers la page Produit',
    icone: '🛍️',
    couleur: '#0ea5e9',
    description: 'Dans l\'éditeur, sélectionnez le bon type de page.',
    instructions: [
      'En haut au centre de l\'éditeur, cliquez sur le menu déroulant de pages',
      'Sélectionnez <strong>Pages produit</strong> (ou "Product pages")',
      'Vous verrez apparaître les sections disponibles dans la barre de gauche',
    ],
    tip: '💡 Si vous ne voyez pas "Pages produit", cherchez "Produit" ou "Product" dans la liste déroulante.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
  {
    numero: 3,
    titre: 'Ajouter un bloc "Liquid personnalisé" — Données produit',
    icone: '📦',
    couleur: '#10b981',
    description: 'Ce bloc invisible permet au widget de connaître les tags de votre produit.',
    instructions: [
      'Dans le panneau gauche, trouvez la section <strong>Informations produit</strong> et cliquez dessus',
      'Faites défiler vers le bas et cliquez sur <strong>Ajouter un bloc</strong>',
      'Choisissez <strong>Liquid personnalisé</strong>',
      'Dans le champ de nom en haut, écrivez : <code>e-Vend | Données produit (parution future)</code>',
      'Collez le code ci-dessous dans la zone de texte du bloc',
    ],
    tip: '💡 Ce bloc est invisible pour vos clients — il transmet seulement des données techniques au widget.',
    code: `{% comment %}
  Ce bloc expose les tags du produit pour le widget
  de compte à rebours de parution future e-Vend.
  NE PAS SUPPRIMER.
{% endcomment %}

{% if product and product.id %}
<div id="evend-product-data" 
     data-tags="{{ product.tags | json | escape }}" 
     style="display:none">
</div>
{% endif %}`,
    codeLangue: 'Liquid',
    codeInstructions: 'Copiez ce code et collez-le dans la zone de texte du bloc Liquid personnalisé :',
  },
  {
    numero: 4,
    titre: 'Modifier le fichier theme.liquid',
    icone: '📄',
    couleur: '#f59e0b',
    description: 'Ajoutez le script du widget dans le fichier principal de votre thème.',
    instructions: [
      'Toujours dans votre admin Shopify, allez dans <strong>Boutique en ligne → Thèmes</strong>',
      'Cliquez sur les <strong>3 points (...)</strong> à côté de votre thème actif',
      'Cliquez sur <strong>Modifier le code</strong>',
      'Dans la liste de gauche, sous <strong>Layout</strong>, cliquez sur <strong>theme.liquid</strong>',
      'Trouvez la balise <code>&lt;/body&gt;</code> tout en bas du fichier (utilisez Ctrl+F pour chercher)',
      'Collez le code ci-dessous <strong>juste avant</strong> la balise <code>&lt;/body&gt;</code>',
    ],
    tip: '⚠️ Soyez prudent dans cet éditeur — ne modifiez que l\'endroit indiqué. En cas de doute, faites une copie du contenu avant.',
    code: `<!-- Widget parution future e-Vend -->
<script src="https://evend-multivendeur-api.onrender.com/parution-futur-widget.js" defer></script>`,
    codeLangue: 'HTML',
    codeInstructions: 'Collez ce code juste avant </body> dans theme.liquid :',
  },
  {
    numero: 5,
    titre: 'Sauvegarder et tester',
    icone: '✅',
    couleur: '#16a34a',
    description: 'Vérifiez que tout fonctionne correctement.',
    instructions: [
      'Cliquez sur <strong>Sauvegarder</strong> dans l\'éditeur de code',
      'Retournez dans l\'éditeur de thème (Personnaliser) et cliquez sur <strong>Enregistrer</strong>',
      'Créez une annonce avec une <strong>date de parution future</strong> dans votre dashboard e-Vend',
      'Visitez la page produit correspondante sur votre boutique',
      'Le compte à rebours devrait apparaître automatiquement ! 🎉',
    ],
    tip: '💡 Si le widget n\'apparaît pas, attendez 1-2 minutes et rechargez la page. Les changements de thème peuvent prendre un moment.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
];

// ── Composant bloc de code copiable ───────────────────────────────────────
function CodeBlock({ code, langue, instructions }: { code: string; langue: string; instructions: string }) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>{instructions}</p>
      <div style={{ position: 'relative', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1e293b' }}>
        {/* Header barre */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginLeft: '4px' }}>{langue}</span>
          </div>
          <button
            onClick={copier}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: copie ? '#16a34a20' : '#ffffff10',
              color: copie ? '#4ade80' : '#94a3b8',
              border: `1px solid ${copie ? '#16a34a40' : '#ffffff15'}`,
              borderRadius: '6px', padding: '5px 12px',
              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copie ? (
              <><span>✓</span><span>Copié !</span></>
            ) : (
              <><CopyIcon /><span>Copier</span></>
            )}
          </button>
        </div>
        {/* Code */}
        <pre style={{
          margin: 0, padding: '16px 20px',
          fontSize: '12px', lineHeight: '1.7',
          color: '#e2e8f0', overflowX: 'auto',
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{code}</pre>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export function ParutionInstructionsModal({ ouvert, onFermer }: Props) {
  const [etapeActive, setEtapeActive] = useState(0);
  const etape = ETAPES[etapeActive];

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    if (ouvert) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onFermer(); }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>

        {/* ── En-tête ── */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #1e0533 0%, #0d0a2e 100%)', position: 'relative', overflow: 'hidden' }}>
          {/* Étoiles décoratives */}
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)',
              width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
              top: `${10 + (i * 13) % 80}%`, left: `${5 + (i * 17) % 90}%`,
              animation: `twinkle ${1.5 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
            }} />
          ))}
          <style>{`@keyframes twinkle { from { opacity: 0.2; } to { opacity: 1; } }`}</style>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🗓️</div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>Guide d'installation</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Widget Parution Future — e-Vend</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                Suivez ces {ETAPES.length} étapes simples pour activer le compte à rebours sur votre boutique Shopify.
              </p>
            </div>
            <button onClick={onFermer} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            >×</button>
          </div>

          {/* Barre de progression */}
          <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {ETAPES.map((_, i) => (
                <div key={i} onClick={() => setEtapeActive(i)} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= etapeActive ? 'white' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'background 0.3s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Étape {etapeActive + 1} sur {ETAPES.length}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{Math.round(((etapeActive + 1) / ETAPES.length) * 100)}% complété</span>
            </div>
          </div>
        </div>

        {/* ── Navigation étapes (sidebar miniature) ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar étapes */}
          <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid #f1f5f9', overflowY: 'auto', padding: '16px 12px', backgroundColor: '#fafafa' }}>
            {ETAPES.map((e, i) => (
              <button key={i} onClick={() => setEtapeActive(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '4px', textAlign: 'left',
                backgroundColor: etapeActive === i ? e.couleur + '15' : 'transparent',
                transition: 'all 0.15s',
              }}
                onMouseEnter={ev => { if (etapeActive !== i) (ev.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor = etapeActive === i ? e.couleur + '15' : 'transparent'; }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: i <= etapeActive ? e.couleur : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, transition: 'background 0.2s' }}>
                  {i < etapeActive ? <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>✓</span> : <span style={{ color: i === etapeActive ? 'white' : '#94a3b8', fontWeight: '800', fontSize: '11px' }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: '11px', fontWeight: etapeActive === i ? '700' : '500', color: etapeActive === i ? e.couleur : '#64748b', lineHeight: 1.3 }}>{e.titre}</span>
              </button>
            ))}
          </div>

          {/* Contenu de l'étape */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

            {/* Titre étape */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: etape.couleur + '15', border: `2px solid ${etape.couleur}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {etape.icone}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: etape.couleur, textTransform: 'uppercase', letterSpacing: '1px' }}>Étape {etape.numero}</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{etape.titre}</h3>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>{etape.description}</p>

            {/* Instructions */}
            <div style={{ marginBottom: '20px' }}>
              {etape.instructions.map((instruction, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: etape.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'white', flexShrink: 0, marginTop: '1px' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: instruction }} />
                </div>
              ))}
            </div>

            {/* Bloc de code */}
            {etape.code && etape.codeLangue && etape.codeInstructions && (
              <CodeBlock code={etape.code} langue={etape.codeLangue} instructions={etape.codeInstructions} />
            )}

            {/* Tip */}
            <div style={{ marginTop: '20px', backgroundColor: etape.couleur + '0d', border: `1px solid ${etape.couleur}30`, borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>
                {etape.tip.startsWith('⚠️') ? '⚠️' : '💡'}
              </span>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: etape.tip.replace(/^(💡|⚠️)\s*/, '') }} />
            </div>
          </div>
        </div>

        {/* ── Pied de page navigation ── */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
          <button
            onClick={() => setEtapeActive(Math.max(0, etapeActive - 1))}
            disabled={etapeActive === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
              backgroundColor: etapeActive === 0 ? '#f8fafc' : 'white',
              color: etapeActive === 0 ? '#cbd5e1' : '#64748b',
              fontSize: '13px', fontWeight: '700', cursor: etapeActive === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >← Précédent</button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {ETAPES.map((_, i) => (
              <div key={i} onClick={() => setEtapeActive(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === etapeActive ? ETAPES[i].couleur : '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s', transform: i === etapeActive ? 'scale(1.3)' : 'scale(1)' }} />
            ))}
          </div>

          {etapeActive < ETAPES.length - 1 ? (
            <button
              onClick={() => setEtapeActive(Math.min(ETAPES.length - 1, etapeActive + 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                backgroundColor: etape.couleur, color: 'white',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                transition: 'opacity 0.15s', boxShadow: `0 4px 12px ${etape.couleur}40`,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >Suivant →</button>
          ) : (
            <button onClick={onFermer} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              backgroundColor: '#16a34a', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
            }}>
              ✓ Terminé — Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}