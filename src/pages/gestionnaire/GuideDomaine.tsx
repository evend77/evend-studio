// src/pages/gestionnaire/GuideDomaine.tsx
// e-Vend Studio — Modal guide complet sur les domaines (sous-domaine gratuit,
// achat via e-Vend Studio, connexion d'un domaine déjà possédé)

import React, { useState } from 'react';

interface Props {
  onFermer: () => void;
}

type Onglet = 'vue-ensemble' | 'sous-domaine' | 'achat' | 'existant';
type Registraire = 'whc' | 'godaddy' | 'namecheap' | 'ovh' | 'google' | 'cloudflare';

const REGISTRAIRES: { id: Registraire; nom: string; icone: string }[] = [
  { id: 'whc', nom: 'WHC.ca', icone: '🇨🇦' },
  { id: 'godaddy', nom: 'GoDaddy', icone: '🟢' },
  { id: 'namecheap', nom: 'Namecheap', icone: '🐫' },
  { id: 'ovh', nom: 'OVH', icone: '🔵' },
  { id: 'google', nom: 'Google Domains / Squarespace', icone: '🔴' },
  { id: 'cloudflare', nom: 'Cloudflare', icone: '🟠' },
];

const INSTRUCTIONS_REGISTRAIRES: Record<Registraire, { chemin: string; note?: string }> = {
  whc: { chemin: `Domaines → sélectionner le domaine → "DNS Zone Editor" → "Add record"` },
  godaddy: { chemin: `Mes produits → domaine → "DNS" → "Ajouter" un enregistrement` },
  namecheap: { chemin: `Domain List → "Manage" → onglet "Advanced DNS" → "Add New Record"` },
  ovh: { chemin: `Web Cloud → Noms de domaine → domaine → onglet "Zone DNS" → "Ajouter une entrée"` },
  google: {
    chemin: `Paramètres DNS du domaine → "Enregistrements personnalisés" → "Gérer les enregistrements personnalisés"`,
    note: 'Si le domaine est chez Squarespace (ex-Google Domains), le menu est similaire sous "DNS Settings".',
  },
  cloudflare: {
    chemin: `Sélectionner le domaine → "DNS" → "Records" → "Add record"`,
    note: '⚠️ Mettre le statut du proxy sur "DNS only" (nuage gris), pas "Proxied" (nuage orange), sinon la connexion peut échouer.',
  },
};

export default function GuideDomaine({ onFermer }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('vue-ensemble');
  const [registraireActif, setRegistraireActif] = useState<Registraire>('whc');

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'vue-ensemble', label: 'Vue d\'ensemble', icone: '🗺️' },
    { id: 'sous-domaine', label: 'Sous-domaine gratuit', icone: '🎁' },
    { id: 'achat', label: 'Acheter un domaine', icone: '🛒' },
    { id: 'existant', label: 'J\'ai déjà un domaine', icone: '🔗' },
  ];

  return (
    <div
      onClick={onFermer}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 780,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* ── En-tête ── */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730a3 100%)', color: '#fff',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📖 Guide des domaines</h2>
            <p style={{ fontSize: 13, opacity: 0.85, margin: '4px 0 0' }}>
              Tout savoir sur les sous-domaines, l'achat et la connexion de domaines
            </p>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        {/* ── Onglets ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', flexShrink: 0 }}>
          {onglets.map(o => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              style={{
                padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                color: onglet === o.id ? '#4F46E5' : '#888',
                borderBottom: onglet === o.id ? '3px solid #4F46E5' : '3px solid transparent',
              }}
            >
              {o.icone} {o.label}
            </button>
          ))}
        </div>

        {/* ── Contenu scrollable ── */}
        <div style={{ padding: 28, overflowY: 'auto', fontSize: 14, color: '#333', lineHeight: 1.6 }}>

          {/* ══════════ VUE D'ENSEMBLE ══════════ */}
          {onglet === 'vue-ensemble' && (
            <div>
              <p style={{ marginBottom: 20 }}>
                e-Vend Studio offre <strong>trois façons</strong> de donner une adresse web à votre boutique. Voici comment elles se comparent :
              </p>

              {/* Diagramme visuel des 3 options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={carteOption('#10b981')}>
                  <div style={{ fontSize: 30 }}>🎁</div>
                  <div style={titreCarte}>Sous-domaine gratuit</div>
                  <div style={sousTitreCarte}>xxx.e-vendstudio.ca</div>
                  <ul style={listeCarte}>
                    <li>100% gratuit</li>
                    <li>Actif en 5 secondes</li>
                    <li>Aucune configuration</li>
                  </ul>
                </div>
                <div style={carteOption('#4F46E5')}>
                  <div style={{ fontSize: 30 }}>🛒</div>
                  <div style={titreCarte}>Acheter via Studio</div>
                  <div style={sousTitreCarte}>monentreprise.com</div>
                  <ul style={listeCarte}>
                    <li>Domaine professionnel</li>
                    <li>Tout automatique</li>
                    <li>Taxes incluses</li>
                  </ul>
                </div>
                <div style={carteOption('#f59e0b')}>
                  <div style={{ fontSize: 30 }}>🔗</div>
                  <div style={titreCarte}>Domaine déjà possédé</div>
                  <div style={sousTitreCarte}>www.mondomaine.com</div>
                  <ul style={listeCarte}>
                    <li>Garder son domaine actuel</li>
                    <li>Petite config DNS requise</li>
                    <li>2 $/mois + taxes (frais de service)</li>
                  </ul>
                </div>
              </div>

              {/* Diagramme de flux SVG simple */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>
                  Comment le visiteur arrive sur votre site
                </p>
                <svg viewBox="0 0 700 140" style={{ width: '100%', height: 'auto' }}>
                  <rect x="10" y="50" width="140" height="40" rx="8" fill="#eef2ff" stroke="#4F46E5" strokeWidth="1.5" />
                  <text x="80" y="75" textAnchor="middle" fontSize="13" fill="#4F46E5" fontWeight="700">Visiteur tape</text>

                  <line x1="150" y1="70" x2="200" y2="70" stroke="#c7c7c7" strokeWidth="2" markerEnd="url(#fleche)" />

                  <rect x="205" y="20" width="180" height="35" rx="8" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="295" y="42" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="700">xxx.e-vendstudio.ca</text>

                  <rect x="205" y="60" width="180" height="35" rx="8" fill="#eef2ff" stroke="#4F46E5" strokeWidth="1.5" />
                  <text x="295" y="82" textAnchor="middle" fontSize="11" fill="#3730a3" fontWeight="700">monentreprise.com</text>

                  <rect x="205" y="100" width="180" height="35" rx="8" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="295" y="122" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="700">www.mondomaine.com</text>

                  <line x1="385" y1="37" x2="450" y2="70" stroke="#c7c7c7" strokeWidth="2" />
                  <line x1="385" y1="77" x2="450" y2="70" stroke="#c7c7c7" strokeWidth="2" />
                  <line x1="385" y1="117" x2="450" y2="70" stroke="#c7c7c7" strokeWidth="2" markerEnd="url(#fleche)" />

                  <rect x="455" y="45" width="220" height="50" rx="8" fill="#1a1a2e" />
                  <text x="565" y="66" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">Votre site e-Vend Studio</text>
                  <text x="565" y="82" textAnchor="middle" fontSize="10" fill="#a5a5c5">(le même site, 3 portes d'entrée)</text>

                  <defs>
                    <marker id="fleche" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#c7c7c7" />
                    </marker>
                  </defs>
                </svg>
              </div>

              <div style={boiteInfo('#eff6ff', '#3b82f6', '#1e40af')}>
                💡 <strong>Bon à savoir :</strong> vous pouvez combiner les options ! Garder votre sous-domaine gratuit ET connecter un domaine personnalisé en même temps — les deux mèneront à votre même site.
              </div>
            </div>
          )}

          {/* ══════════ SOUS-DOMAINE GRATUIT ══════════ */}
          {onglet === 'sous-domaine' && (
            <div>
              <h3 style={titreSection}>🎁 Le sous-domaine gratuit</h3>
              <p>
                Chaque compte e-Vend Studio inclut gratuitement une adresse du type <code style={codeStyle}>votreboutique.e-vendstudio.ca</code>.
                C'est la solution la plus rapide pour être en ligne immédiatement.
              </p>

              <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Comment faire :</p>
              <EtapesVisuelles etapes={[
                { num: 1, titre: 'Choisir un nom', desc: 'Dans la section "Sous-domaine gratuit", tapez le nom souhaité (ex: ma-boutique).' },
                { num: 2, titre: 'Vérification automatique', desc: 'e-Vend Studio vérifie en temps réel si le nom est disponible pendant que vous tapez.' },
                { num: 3, titre: 'Sauvegarder', desc: 'Cliquez sur "Sauvegarder les modifications" — c\'est actif immédiatement, aucune attente.' },
              ]} couleur="#10b981" />

              <p style={{ fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Avantages :</p>
              <ul style={{ paddingLeft: 20 }}>
                <li>✅ Entièrement gratuit, pour toujours</li>
                <li>✅ Actif en quelques secondes, sans configuration technique</li>
                <li>✅ Idéal pour tester votre boutique avant d'investir dans un domaine</li>
                <li>✅ Certificat de sécurité (HTTPS) inclus automatiquement</li>
              </ul>

              <div style={boiteInfo('#fffbeb', '#f59e0b', '#92400e')}>
                ⚠️ Vous pouvez changer de sous-domaine à tout moment, mais l'ancien redevient alors disponible pour quelqu'un d'autre.
              </div>
            </div>
          )}

          {/* ══════════ ACHAT DE DOMAINE ══════════ */}
          {onglet === 'achat' && (
            <div>
              <h3 style={titreSection}>🛒 Acheter un domaine via e-Vend Studio</h3>
              <p>
                Envie d'une adresse professionnelle comme <code style={codeStyle}>monentreprise.com</code> ? e-Vend Studio s'occupe de
                tout — achat, configuration technique et connexion à votre site — en un seul paiement.
              </p>

              <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Comment faire :</p>
              <EtapesVisuelles etapes={[
                { num: 1, titre: 'Entrer un nom', desc: 'Tapez le nom souhaité, sans extension (ex: monentreprise).' },
                { num: 2, titre: 'Comparer les extensions', desc: 'e-Vend Studio vérifie .com, .ca, .net et .org en même temps, avec le prix de chacune.' },
                { num: 3, titre: 'Choisir et acheter', desc: 'Cliquez "Acheter" sur l\'extension voulue — vous êtes redirigé vers un paiement Stripe sécurisé.' },
                { num: 4, titre: 'Tout se fait automatiquement', desc: 'Domaine enregistré, DNS configuré, connecté à votre site et facture générée — sans aucune action de votre part.' },
              ]} couleur="#4F46E5" />

              <p style={{ fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Avantages :</p>
              <ul style={{ paddingLeft: 20 }}>
                <li>✅ Aucune connaissance technique requise — tout est automatisé</li>
                <li>✅ Prix transparent, taxes (TPS/TVQ) incluses avant de payer</li>
                <li>✅ Renouvellement automatique disponible (activable en un clic)</li>
                <li>✅ Facture officielle générée pour votre comptabilité</li>
                <li>✅ Rappel par courriel avant l'expiration, pour ne jamais être pris au dépourvu</li>
              </ul>

              <div style={boiteInfo('#fef2f2', '#ef4444', '#991b1b')}>
                ⚠️ <strong>Important :</strong> le domaine est valide <strong>1 an</strong>. Sans renouvellement avant l'échéance,
                votre site devient inaccessible via ce domaine jusqu'au renouvellement.
              </div>
            </div>
          )}

          {/* ══════════ DOMAINE DÉJÀ POSSÉDÉ ══════════ */}
          {onglet === 'existant' && (
            <div>
              <h3 style={titreSection}>🔗 Connecter un domaine que vous possédez déjà</h3>
              <p>
                Vous avez déjà acheté un domaine ailleurs (chez WHC, GoDaddy, Namecheap, etc.) ? Vous pouvez le connecter à votre
                site e-Vend Studio sans avoir à le racheter.
              </p>

              <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Comment faire :</p>
              <EtapesVisuelles etapes={[
                { num: 1, titre: 'Entrer le domaine avec www', desc: 'Dans "J\'ai déjà un domaine", tapez-le avec le www devant (ex: www.mondomaine.com).' },
                { num: 2, titre: 'Configurer le DNS', desc: 'Chez votre fournisseur de domaine, ajoutez l\'enregistrement CNAME indiqué (voir instructions ci-dessous).' },
                { num: 3, titre: 'Attendre la validation', desc: 'La propagation DNS prend généralement de quelques minutes à quelques heures.' },
                { num: 4, titre: 'Domaine actif', desc: 'Le statut passe à "Actif et sécurisé" une fois la validation complétée — SSL inclus automatiquement.' },
              ]} couleur="#f59e0b" />

              {/* Frais de connexion */}
              <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)', border: '2px solid #f59e0b', borderRadius: 12, padding: '16px 20px', marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>💳</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>Frais de connexion : 2 $/mois + taxes</span>
                </div>
                <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
                  Connecter un domaine que vous possédez déjà à e-Vend Studio entraîne des frais de service de
                  <strong> 2 $ CAD par mois</strong> (plus TPS et TVQ). Ces frais couvrent la gestion technique de la connexion,
                  le certificat de sécurité (HTTPS) et le maintien de votre domaine relié à votre site. Ils s'ajoutent à votre
                  facturation mensuelle et apparaîtront dans la section <strong>« Mes services »</strong> de votre tableau de bord.
                </p>
                <p style={{ fontSize: 12, color: '#a16207', margin: '10px 0 0' }}>
                  💡 À noter : un domaine <strong>acheté directement via e-Vend Studio</strong> (onglet « Acheter un domaine ») n'a
                  <strong> pas</strong> ces frais mensuels — seulement le coût annuel du domaine.
                </p>
              </div>

              {/* Pourquoi le www */}
              <div style={boiteInfo('#eff6ff', '#3b82f6', '#1e40af')}>
                💡 <strong>Pourquoi le "www" est obligatoire :</strong> pour des raisons techniques de DNS, un domaine "racine"
                (sans www) ne peut pas pointer directement vers e-Vend Studio. Si vous voulez que <code>mondomaine.com</code> (sans www)
                fonctionne aussi, configurez une <strong>redirection</strong> chez votre fournisseur vers <code>www.mondomaine.com</code> —
                la plupart l'offrent gratuitement (voir "Domain Forwarding" ci-dessous selon le fournisseur).
              </div>

              {/* Diagramme CNAME */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, margin: '20px 0' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>
                  L'enregistrement DNS à créer
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
                  <ChampDNS label="Type" valeur="CNAME" />
                  <ChampDNS label="Nom / Hôte" valeur="www" />
                  <ChampDNS label="Valeur / Cible" valeur="evend-studio.onrender.com" large />
                  <ChampDNS label="TTL" valeur="Automatique / 3600" />
                </div>
              </div>

              {/* Instructions par registraire */}
              <p style={{ fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Instructions selon votre fournisseur :</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {REGISTRAIRES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegistraireActif(r.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: registraireActif === r.id ? '2px solid #4F46E5' : '1.5px solid #e5e7eb',
                      background: registraireActif === r.id ? '#eef2ff' : '#fff',
                      color: registraireActif === r.id ? '#4F46E5' : '#666',
                    }}
                  >
                    {r.icone} {r.nom}
                  </button>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
                <p style={{ margin: 0 }}>
                  📍 <strong>Chemin dans l'interface :</strong> {INSTRUCTIONS_REGISTRAIRES[registraireActif].chemin}
                </p>
                {INSTRUCTIONS_REGISTRAIRES[registraireActif].note && (
                  <p style={{ margin: '10px 0 0', fontSize: 13, color: '#92400e', background: '#fffbeb', padding: '8px 12px', borderRadius: 6 }}>
                    {INSTRUCTIONS_REGISTRAIRES[registraireActif].note}
                  </p>
                )}
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#888' }}>
                  Une fois dans la section DNS, ajoutez un enregistrement avec les valeurs indiquées ci-dessus (Type: CNAME, Nom: www, Valeur: evend-studio.onrender.com).
                </p>
              </div>

              <div style={boiteInfo('#fef2f2', '#ef4444', '#991b1b')}>
                ⚠️ Ces instructions ne couvrent pas tous les fournisseurs existants. Si le vôtre n'est pas listé, cherchez une section
                "DNS", "Zone DNS" ou "Gestion des domaines" dans son panneau de contrôle — le principe (ajouter un CNAME) reste le même partout.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────────
function EtapesVisuelles({ etapes, couleur }: { etapes: { num: number; titre: string; desc: string }[]; couleur: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {etapes.map((e, i) => (
        <div key={e.num} style={{ display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: couleur, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {e.num}
            </div>
            {i < etapes.length - 1 && <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 24 }} />}
          </div>
          <div style={{ paddingBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{e.titre}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{e.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChampDNS({ label, valeur, large }: { label: string; valeur: string; large?: boolean }) {
  return (
    <div style={{ flex: large ? '2 1 220px' : '1 1 120px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>{valeur}</div>
    </div>
  );
}

// ── Styles réutilisables ──────────────────────────────────────────────────────
const titreSection: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 };
const codeStyle: React.CSSProperties = { background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 };
const titreCarte: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginTop: 8 };
const sousTitreCarte: React.CSSProperties = { fontSize: 11, fontFamily: 'monospace', color: '#888', marginBottom: 10 };
const listeCarte: React.CSSProperties = { fontSize: 12, color: '#555', paddingLeft: 18, margin: 0 };

function carteOption(couleur: string): React.CSSProperties {
  return {
    background: '#fff', border: `2px solid ${couleur}30`, borderRadius: 12, padding: 16,
    borderTop: `4px solid ${couleur}`,
  };
}

function boiteInfo(bg: string, borderColor: string, texteColor: string): React.CSSProperties {
  return {
    background: bg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '12px 16px',
    fontSize: 13, color: texteColor, marginTop: 16, lineHeight: 1.6,
  };
}