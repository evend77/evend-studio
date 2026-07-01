// src/components/EnchereInstructionsModal.tsx
import React, { useState, useEffect } from 'react';

interface Props {
  ouvert: boolean;
  onFermer: () => void;
}

const ETAPES = [
  {
    numero: 1,
    titre: 'Ouvrir l\'éditeur de code du thème Shopify',
    icone: '🎨',
    couleur: '#f59e0b',
    description: 'Accédez à l\'éditeur de code de votre thème pour modifier le fichier principal.',
    instructions: [
      'Connectez-vous à votre <strong>admin Shopify</strong>',
      'Dans le menu de gauche, cliquez sur <strong>Boutique en ligne</strong>',
      'Cliquez sur <strong>Thèmes</strong>',
      'À côté de votre thème actif, cliquez sur les <strong>3 points (...)</strong>',
      'Cliquez sur <strong>Modifier le code</strong>',
    ],
    tip: '💡 Assurez-vous d\'être sur votre thème actif (celui avec l\'étiquette verte "Actif"). Nous vous recommandons de faire une copie de sauvegarde de votre thème avant de commencer.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
  {
    numero: 2,
    titre: 'Ajouter le script dans theme.liquid',
    icone: '📄',
    couleur: '#ef4444',
    description: 'Ajoutez le script du widget enchères dans le fichier principal de votre thème.',
    instructions: [
      'Dans la liste de fichiers à gauche, sous la section <strong>Layout</strong>, cliquez sur <strong>theme.liquid</strong>',
      'Le contenu du fichier s\'affiche à droite — utilisez <strong>Ctrl+F</strong> (ou Cmd+F sur Mac) pour chercher',
      'Tapez <code>&lt;/body&gt;</code> dans la barre de recherche et appuyez sur Entrée',
      'Cliquez juste <strong>avant</strong> la balise <code>&lt;/body&gt;</code> pour y placer votre curseur',
      'Collez le code ci-dessous à cet endroit',
      'Cliquez sur <strong>Sauvegarder</strong> en haut à droite de l\'éditeur',
    ],
    tip: '⚠️ Ne modifiez rien d\'autre dans ce fichier. Si vous voyez déjà un commentaire "Widget enchères e-Vend", ne l\'ajoutez pas une deuxième fois.',
    code: `<!-- Widget enchères e-Vend -->
<script>
  window.evendCustomer = {
    id: '{{ customer.id }}',
    email: '{{ customer.email }}',
    nom: '{{ customer.first_name }} {{ customer.last_name }}'
  };
  window.evendProductTags = {{ product.tags | json }};
  window.evendProductId = '{{ product.id }}';
</script>

<script src="https://evend-multivendeur-api.onrender.com/public/evend-auction-widget.js" defer></script>`,
    codeLangue: 'Liquid + HTML',
    codeInstructions: 'Collez ce code juste avant </body> dans theme.liquid :',
  },
  {
    numero: 3,
    titre: 'Aller dans l\'éditeur de thème (Personnaliser)',
    icone: '🖌️',
    couleur: '#8b5cf6',
    description: 'Accédez maintenant à l\'éditeur visuel pour ajouter un bloc sur la page produit.',
    instructions: [
      'Retournez dans <strong>Boutique en ligne → Thèmes</strong>',
      'À côté de votre thème actif, cliquez sur <strong>Personnaliser</strong>',
      'En haut au centre de l\'écran, cliquez sur le menu déroulant qui indique le type de page',
      'Sélectionnez <strong>Pages produit</strong> (ou "Product pages")',
      'Vous verrez apparaître les sections de la page produit dans le panneau de gauche',
    ],
    tip: '💡 Il est important d\'être dans la vue "Pages produit" — les blocs que vous ajoutez ici s\'appliquent à toutes vos pages de produits automatiquement.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
  {
    numero: 4,
    titre: 'Ajouter un bloc "Liquid personnalisé"',
    icone: '📦',
    couleur: '#10b981',
    description: 'Ce petit bloc invisible permet au widget de lire les informations du produit affiché.',
    instructions: [
      'Dans le panneau de gauche, cliquez sur la section <strong>Informations produit</strong> pour l\'ouvrir',
      'Faites défiler vers le bas de cette section et cliquez sur <strong>Ajouter un bloc</strong>',
      'Dans la liste qui apparaît, choisissez <strong>Liquid personnalisé</strong>',
      'En haut du panneau de droite, dans le champ de nom, écrivez : <code>e-Vend | Données enchères</code>',
      'Collez le code ci-dessous dans la grande zone de texte du bloc',
      'Cliquez sur <strong>Enregistrer</strong> en haut à droite',
    ],
    tip: '💡 Ce bloc est totalement invisible pour vos visiteurs. Il sert uniquement à passer les données du produit au widget d\'enchères en arrière-plan.',
    code: `{% comment %}
  Ce bloc expose les informations du produit pour le
  widget d'enchères e-Vend.
  NE PAS SUPPRIMER.
{% endcomment %}

{% if product and product.id %}
<div id="evend-product-data"
     data-product-id="{{ product.id }}"
     data-tags="{{ product.tags | json | escape }}"
     data-title="{{ product.title | escape }}"
     data-price="{{ product.price }}"
     style="display:none">
</div>
{% endif %}`,
    codeLangue: 'Liquid',
    codeInstructions: 'Collez ce code dans la zone de texte du bloc Liquid personnalisé :',
  },
  {
    numero: 5,
    titre: 'Tester une enchère',
    icone: '✅',
    couleur: '#16a34a',
    description: 'Vérifiez que tout fonctionne correctement sur votre boutique.',
    instructions: [
      'Depuis votre <strong>dashboard vendeur e-Vend</strong>, créez une annonce en mode <strong>Enchère</strong>',
      'Visitez la page produit correspondante sur votre boutique Shopify',
      'Le widget d\'enchères devrait apparaître automatiquement sur la page produit',
      'Testez en cliquant sur le bouton <strong>"Placer une offre"</strong> pour vérifier le bon fonctionnement',
    ],
    tip: '💡 Si le widget n\'apparaît pas immédiatement, videz le cache de votre navigateur avec Ctrl+Shift+R (ou Cmd+Shift+R sur Mac) et rechargez la page.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
];

// ── Bloc de code copiable ──────────────────────────────────────────────────
function CodeBlock({ code, langue, instructions }: { code: string; langue: string; instructions: string }) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>{instructions}</p>
      <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginLeft: '4px' }}>{langue}</span>
          </div>
          <button onClick={copier} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: copie ? '#16a34a20' : '#ffffff10',
            color: copie ? '#4ade80' : '#94a3b8',
            border: `1px solid ${copie ? '#16a34a40' : '#ffffff15'}`,
            borderRadius: '6px', padding: '5px 12px',
            fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copie
              ? <><span>✓</span><span>Copié !</span></>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg><span>Copier</span></>
            }
          </button>
        </div>
        <pre style={{ margin: 0, padding: '16px 20px', fontSize: '12px', lineHeight: '1.7', color: '#e2e8f0', overflowX: 'auto', fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>{code}</pre>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export function EnchereInstructionsModal({ ouvert, onFermer }: Props) {
  const [etapeActive, setEtapeActive] = useState(0);
  const etape = ETAPES[etapeActive];

  useEffect(() => {
    if (!ouvert) setEtapeActive(0);
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

        {/* En-tête */}
        <div style={{ padding: '24px 28px 20px', background: 'linear-gradient(135deg, #1c0a00 0%, #431a00 60%, #2d0d00 100%)', position: 'relative', overflow: 'hidden' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', fontSize: `${8 + (i % 4) * 4}px`, top: `${5 + (i * 17) % 85}%`, left: `${3 + (i * 23) % 92}%`, opacity: 0.08 + (i % 3) * 0.05, transform: `rotate(${i * 41}deg)`, pointerEvents: 'none' }}>🔨</div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔨</div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>Guide d'installation</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Widget Enchères — e-Vend</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                Suivez ces {ETAPES.length} étapes pour activer le widget d'enchères sur votre boutique Shopify.
              </p>
            </div>
            <button onClick={onFermer}
              style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            >×</button>
          </div>

          {/* Barre de progression */}
          <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {ETAPES.map((_, i) => (
                <div key={i} onClick={() => setEtapeActive(i)} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= etapeActive ? '#f59e0b' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'background 0.3s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Étape {etapeActive + 1} sur {ETAPES.length}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{Math.round(((etapeActive + 1) / ETAPES.length) * 100)}% complété</span>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid #f1f5f9', overflowY: 'auto', padding: '16px 12px', backgroundColor: '#fafafa' }}>
            {ETAPES.map((e, i) => (
              <button key={i} onClick={() => setEtapeActive(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '4px', textAlign: 'left' as const,
                backgroundColor: etapeActive === i ? e.couleur + '15' : 'transparent', transition: 'all 0.15s',
              }}
                onMouseEnter={ev => { if (etapeActive !== i) (ev.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor = etapeActive === i ? e.couleur + '15' : 'transparent'; }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: i <= etapeActive ? e.couleur : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, transition: 'background 0.2s' }}>
                  {i < etapeActive
                    ? <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>✓</span>
                    : <span style={{ color: i === etapeActive ? 'white' : '#94a3b8', fontWeight: '800', fontSize: '11px' }}>{i + 1}</span>
                  }
                </div>
                <span style={{ fontSize: '11px', fontWeight: etapeActive === i ? '700' : '500', color: etapeActive === i ? e.couleur : '#64748b', lineHeight: 1.3 }}>{e.titre}</span>
              </button>
            ))}
          </div>

          {/* Contenu étape */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: etape.couleur + '15', border: `2px solid ${etape.couleur}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {etape.icone}
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: etape.couleur, textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Étape {etape.numero}</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: '2px 0 0' }}>{etape.titre}</h3>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>{etape.description}</p>

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

            {etape.code && etape.codeLangue && etape.codeInstructions && (
              <CodeBlock code={etape.code} langue={etape.codeLangue} instructions={etape.codeInstructions} />
            )}

            <div style={{ marginTop: '20px', backgroundColor: etape.couleur + '0d', border: `1px solid ${etape.couleur}30`, borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{etape.tip.startsWith('⚠️') ? '⚠️' : '💡'}</span>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: etape.tip.replace(/^(💡|⚠️)\s*/, '') }} />
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
          <button onClick={() => setEtapeActive(Math.max(0, etapeActive - 1))} disabled={etapeActive === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: etapeActive === 0 ? '#f8fafc' : 'white', color: etapeActive === 0 ? '#cbd5e1' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: etapeActive === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            ← Précédent
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {ETAPES.map((_, i) => (
              <div key={i} onClick={() => setEtapeActive(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === etapeActive ? etape.couleur : '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s', transform: i === etapeActive ? 'scale(1.3)' : 'scale(1)' }} />
            ))}
          </div>

          {etapeActive < ETAPES.length - 1 ? (
            <button onClick={() => setEtapeActive(Math.min(ETAPES.length - 1, etapeActive + 1))}
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: etape.couleur, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${etape.couleur}40`, transition: 'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >Suivant →</button>
          ) : (
            <button onClick={onFermer}
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
              ✓ Terminé — Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}