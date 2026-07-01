// src/pages/admin/PolitiquesPlateforme.tsx
// Politiques de la plateforme e-Vend — 6 onglets avec editeur riche
// SEPAREES des politiques vendeurs (config_vendeur)

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../config/api';

interface Politique {
  id: number;
  slug: string;
  titre: string;
  contenu: string | null;
  actif: boolean;
  updated_at: string;
  updated_by: string;
}

const POLITIQUES_CONFIG = [
  {
    slug: 'retour-remboursement',
    label: 'Politique de retour',
    icone: '↩️',
    description: 'Regles de retour, remboursement et echange de produits',
    modele: `<h1>Politique de retour et de remboursement</h1>

<p><strong>Derniere mise a jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Conditions de retour</h2>
<p>Nous acceptons les retours dans un delai de 30 jours suivant la date de livraison, sous reserve que les articles soient dans leur etat d'origine, non utilises et dans leur emballage d'origine.</p>

<h2>2. Articles non retournables</h2>
<ul>
  <li>Produits numeriques telecharges</li>
  <li>Articles en vente finale clairement identifies</li>
  <li>Produits personnalises ou sur commande</li>
</ul>

<h2>3. Processus de remboursement</h2>
<p>Une fois votre retour recu et inspecte, nous vous informerons par courriel. Si approuve, le remboursement sera traite dans un delai de 5 a 10 jours ouvrables.</p>

<h2>4. Frais d'expedition de retour</h2>
<p>Les frais d'expedition de retour sont a la charge du client, sauf en cas d'erreur de notre part ou d'article defectueux.</p>

<h2>5. Contact</h2>
<p>Pour initier un retour, contactez-nous a : <a href="mailto:contact@e-vend.ca">contact@e-vend.ca</a></p>`,
  },
  {
    slug: 'confidentialite',
    label: 'Confidentialite',
    icone: '🔒',
    description: 'Protection des donnees personnelles et vie privee',
    modele: `<h1>Politique de confidentialite</h1>

<p><strong>Derniere mise a jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<p>e-Vend s'engage a proteger votre vie privee. Cette politique explique comment nous collectons, utilisons et protegeons vos informations personnelles.</p>

<h2>1. Informations collectees</h2>
<ul>
  <li>Informations d'identification (nom, courriel, adresse)</li>
  <li>Informations de paiement (traitees de facon securisee par Stripe)</li>
  <li>Donnees d'utilisation et de navigation</li>
</ul>

<h2>2. Utilisation des donnees</h2>
<p>Vos donnees sont utilisees pour traiter vos commandes, ameliorer nos services et vous contacter au sujet de votre compte.</p>

<h2>3. Partage des donnees</h2>
<p>Nous ne vendons jamais vos donnees personnelles. Nous les partageons uniquement avec nos prestataires de services (paiement, livraison) dans le cadre de votre commande.</p>

<h2>4. Vos droits</h2>
<p>Vous avez le droit d'acceder, de corriger ou de supprimer vos donnees personnelles. Contactez-nous a contact@e-vend.ca.</p>`,
  },
  {
    slug: 'conditions-service',
    label: 'Conditions de service',
    icone: '📋',
    description: 'Termes et conditions d utilisation de la plateforme',
    modele: `<h1>Conditions de service</h1>

<p><strong>Derniere mise a jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Acceptance des conditions</h2>
<p>En utilisant la plateforme e-Vend, vous acceptez les presentes conditions de service. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>

<h2>2. Description du service</h2>
<p>e-Vend est une marketplace canadienne qui permet a des vendeurs independants de vendre leurs produits a des acheteurs.</p>

<h2>3. Comptes utilisateurs</h2>
<p>Vous etes responsable de maintenir la confidentialite de votre compte et de toutes les activites qui s'y deroulent.</p>

<h2>4. Comportement interdit</h2>
<ul>
  <li>Vendre des produits illegaux ou contrefaits</li>
  <li>Tromper les acheteurs sur la nature des produits</li>
  <li>Utiliser la plateforme a des fins frauduleuses</li>
</ul>

<h2>5. Limitation de responsabilite</h2>
<p>e-Vend agit en tant qu'intermediaire et n'est pas responsable des transactions entre vendeurs et acheteurs.</p>`,
  },
  {
    slug: 'expedition',
    label: 'Expedition',
    icone: '📦',
    description: 'Politique d expedition et de livraison',
    modele: `<h1>Politique d'expedition</h1>

<p><strong>Derniere mise a jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>1. Responsabilite d'expedition</h2>
<p>Chaque vendeur sur e-Vend est responsable de l'expedition de ses propres produits. Les delais et frais d'expedition varient selon le vendeur.</p>

<h2>2. Delais de traitement</h2>
<p>Les commandes sont generalement traitees dans un delai de 1 a 3 jours ouvrables apres la confirmation du paiement.</p>

<h2>3. Zones de livraison</h2>
<p>La majorite de nos vendeurs livrent partout au Canada. Certains offrent egalement la livraison internationale. Verifiez les options de livraison sur la page du vendeur.</p>

<h2>4. Suivi de commande</h2>
<p>Un numero de suivi vous sera fourni par courriel des que votre commande sera expediee.</p>

<h2>5. Problemes de livraison</h2>
<p>En cas de colis perdu ou endommage, contactez d'abord le vendeur. Si le probleme persiste, notre equipe de support peut vous aider.</p>`,
  },
  {
    slug: 'coordonnees',
    label: 'Coordonnees',
    icone: '📍',
    description: 'Informations de contact de la plateforme',
    modele: `<h1>Coordonnees</h1>

<h2>e-Vend — La marketplace canadienne</h2>

<p><strong>Courriel general :</strong> <a href="mailto:contact@e-vend.ca">contact@e-vend.ca</a></p>
<p><strong>Support client :</strong> <a href="mailto:support@e-vend.ca">support@e-vend.ca</a></p>
<p><strong>Site web :</strong> <a href="https://e-vend.ca">https://e-vend.ca</a></p>

<h2>Heures de service</h2>
<p>Lundi au vendredi : 9h00 - 17h00 (EST)</p>

<h2>Pour les vendeurs</h2>
<p>Pour toute question concernant votre compte vendeur : <a href="mailto:vendeurs@e-vend.ca">vendeurs@e-vend.ca</a></p>

<h2>Signalement</h2>
<p>Pour signaler un probleme ou un abus : <a href="mailto:signalement@e-vend.ca">signalement@e-vend.ca</a></p>`,
  },
  {
    slug: 'mention-legale',
    label: 'Mention legale',
    icone: '⚖️',
    description: 'Mentions legales et informations juridiques',
    modele: `<h1>Mentions legales</h1>

<p><strong>Derniere mise a jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>Editeur du site</h2>
<p><strong>Nom de l'entreprise :</strong> e-Vend inc.</p>
<p><strong>Siege social :</strong> Quebec, Canada</p>
<p><strong>Courriel :</strong> <a href="mailto:legal@e-vend.ca">legal@e-vend.ca</a></p>

<h2>Hebergement</h2>
<p>Ce site est heberge par Render (render.com), San Francisco, CA, USA.</p>

<h2>Propriete intellectuelle</h2>
<p>Tous les contenus presents sur e-Vend (textes, images, logos) sont proteges par le droit d'auteur. Toute reproduction est interdite sans autorisation prealable.</p>

<h2>Droit applicable</h2>
<p>Les presentes mentions legales sont soumises au droit canadien et quebecois. Tout litige sera soumis aux tribunaux competents du Quebec.</p>

<h2>Cookies</h2>
<p>Ce site utilise des cookies essentiels au fonctionnement du service. En continuant a naviguer, vous acceptez leur utilisation.</p>`,
  },
];

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

export default function PolitiquesPlateforme({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [politiques, setPolitiques]   = useState<Politique[]>([]);
  const [ongletActif, setOngletActif] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [sauvegarde, setSauvegarde]   = useState(false);
  const [messageSauvegarde, setMessageSauvegarde] = useState<string | null>(null);
  const [contenuEdite, setContenuEdite] = useState<Record<string, string>>({});
  const [modeApercu, setModeApercu]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchPolitiques(); }, []);

  async function fetchPolitiques() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/politiquesPlateforme`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const map: Record<string, string> = {};
      (data.politiques || []).forEach((p: Politique) => {
        map[p.slug] = p.contenu || '';
      });
      setContenuEdite(map);
      setPolitiques(data.politiques || []);
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarder() {
    const config = POLITIQUES_CONFIG[ongletActif];
    if (!config) return;
    setSauvegarde(true);
    try {
      await fetch(`${API_BASE}/politiquesPlateforme/${config.slug}`, {
        method: 'PATCH',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenuEdite[config.slug] || '' }),
      });
      setMessageSauvegarde('Sauvegarde avec succes !');
      setTimeout(() => setMessageSauvegarde(null), 3000);
      await fetchPolitiques();
    } finally {
      setSauvegarde(false);
    }
  }

  function insererModele() {
    const config = POLITIQUES_CONFIG[ongletActif];
    if (!config) return;
    if (contenuEdite[config.slug] && !window.confirm('Remplacer le contenu actuel par le modele ?')) return;
    setContenuEdite(prev => ({ ...prev, [config.slug]: config.modele }));
  }

  function insererBalise(avant: string, apres: string = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const config = POLITIQUES_CONFIG[ongletActif];
    const slug = config.slug;
    const contenu = contenuEdite[slug] || '';
    const debut = ta.selectionStart;
    const fin   = ta.selectionEnd;
    const selection = contenu.slice(debut, fin);
    const nouveau = contenu.slice(0, debut) + avant + selection + apres + contenu.slice(fin);
    setContenuEdite(prev => ({ ...prev, [slug]: nouveau }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + selection.length);
    }, 10);
  }

  function getPolitique(slug: string): Politique | undefined {
    return politiques.find(p => p.slug === slug);
  }

  const configActuelle = POLITIQUES_CONFIG[ongletActif];
  const politiqueActuelle = configActuelle ? getPolitique(configActuelle.slug) : undefined;
  const contenuActuel = configActuelle ? (contenuEdite[configActuelle.slug] ?? '') : '';
  const aContenu = contenuActuel.trim().length > 0;
  const modifie = contenuActuel !== (politiqueActuelle?.contenu || '');

  // Détecte si le contenu contient déjà des balises HTML
  const estHTML = /<[a-z][\s\S]*>/i.test(contenuActuel);

  // Convertit le texte brut en HTML structuré pour l'aperçu
  function texteVersHTML(texte: string): string {
    if (!texte.trim()) return '';
    const lignes = texte.split('\n');
    let html = '';
    for (const ligne of lignes) {
      const l = ligne.trim();
      if (!l) { html += '<br/>'; continue; }
      if (/^(PARTIE\s+[A-Z]|SECTION\s+\d+\s+-|TABLE DES)/i.test(l)) {
        html += `<h2>${l}</h2>`;
      } else if (/^[IVX]+\.\s+\S/.test(l) && l === l.toUpperCase()) {
        html += `<h2>${l}</h2>`;
      } else if (/^\d+\.\d+(\.\d+)?\s/.test(l)) {
        html += `<h3>${l}</h3>`;
      } else if (l.length < 80 && l === l.toUpperCase() && l.length > 3) {
        html += `<h2>${l}</h2>`;
      } else if (/^(Créer|Dernière mise à jour)\s*:/i.test(l)) {
        html += `<p><em>${l}</em></p>`;
      } else {
        html += `<p>${l}</p>`;
      }
    }
    return html;
  }

  const contenuApercu = estHTML ? contenuActuel : texteVersHTML(contenuActuel);

  if (loading) return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={s.spinner} />
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0;transform:translateX(-8px); } to { opacity:1;transform:translateX(0); } }
        .toolbar-btn:hover { background: ${T.accent} !important; color: #fff !important; }
        .onglet-btn:hover { background: #f0f2f5; }
        .btn-modele:hover { background: #e8f2fb !important; }
        .politique-content h1 { font-size:26px;font-weight:800;margin:0 0 20px;color:${T.text};border-bottom:2px solid ${T.accent};padding-bottom:10px; }
        .politique-content h3 { font-size:15px;font-weight:700;margin:16px 0 6px;color:${T.text}; }
        .politique-content br { display:block;content:"";margin:6px 0; }
        .politique-content h2 { font-size:18px;font-weight:700;margin:24px 0 10px;color:${T.text};border-bottom:1px solid ${T.border};padding-bottom:6px; }
        .politique-content p { margin:0 0 12px;line-height:1.7;color:${T.textLight}; }
        .politique-content ul, .politique-content ol { margin:0 0 12px;padding-left:24px; }
        .politique-content li { margin-bottom:4px;color:${T.textLight};line-height:1.6; }
        .politique-content a { color:${T.accent};text-decoration:underline; }
        .politique-content strong { color:${T.text}; }
      `}</style>

      {/* ── EN-TETE ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>📜 Politiques de la plateforme</h1>
          <p style={s.sousTitre}>
            Gestion des politiques legales de e-Vend — separees des politiques vendeurs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {messageSauvegarde && (
            <span style={{ fontSize: '13px', color: T.success, fontWeight: 600, background: '#f0fdf4', padding: '8px 14px', borderRadius: '8px', border: `1px solid #bbf7d0` }}>
              ✅ {messageSauvegarde}
            </span>
          )}
        </div>
      </div>

      <div style={s.layout}>
        {/* ── SIDEBAR ONGLETS ── */}
        <div style={s.sidebar}>
          <p style={s.sidebarTitre}>Politiques ecrites</p>
          {POLITIQUES_CONFIG.map((config, idx) => {
            const pol = getPolitique(config.slug);
            const aduContenu = contenuEdite[config.slug]?.trim().length > 0;
            const estActif = idx === ongletActif;
            return (
              <button
                key={config.slug}
                className="onglet-btn"
                style={{
                  ...s.ongletBtn,
                  ...(estActif ? s.ongletBtnActif : {}),
                }}
                onClick={() => { setOngletActif(idx); setModeApercu(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '18px' }}>{config.icone}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '13px', fontWeight: estActif ? 700 : 500, color: estActif ? T.accent : T.text, margin: 0 }}>
                      {config.label}
                    </p>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                      {aduContenu ? `Definie` : 'Non definie'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                    background: aduContenu ? '#f0fdf4' : '#f3f4f6',
                    color: aduContenu ? T.success : T.textLight,
                  }}>
                    {aduContenu ? '✓ Definie' : '—'}
                  </span>
                  {estActif && <span style={{ fontSize: '10px', color: T.accent }}>▶</span>}
                </div>
              </button>
            );
          })}

          {/* Info */}
          <div style={s.sidebarInfo}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: T.text, margin: '0 0 4px' }}>
              ℹ️ A propos
            </p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0, lineHeight: 1.5 }}>
              Ces politiques sont celles de la <strong>plateforme e-Vend</strong>, distinctes des politiques de chaque vendeur.
            </p>
          </div>
        </div>

        {/* ── EDITEUR PRINCIPAL ── */}
        <div style={s.editeurWrap}>
          {configActuelle && (
            <div style={s.card} key={configActuelle.slug}>
              {/* Header editeur */}
              <div style={s.editeurHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{configActuelle.icone}</span>
                    <div>
                      <h2 style={s.editeurTitre}>{configActuelle.label}</h2>
                      <p style={s.editeurDesc}>{configActuelle.description}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {politiqueActuelle?.updated_at && (
                    <span style={{ fontSize: '11px', color: T.textLight }}>
                      Mis a jour : {new Date(politiqueActuelle.updated_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {!aContenu && (
                    <button className="btn-modele" style={s.btnModele} onClick={insererModele}>
                      📄 Inserer un modele
                    </button>
                  )}
                  {aContenu && (
                    <button className="btn-modele" style={s.btnModele} onClick={insererModele}>
                      🔄 Reinitialiser le modele
                    </button>
                  )}
                  <button
                    style={{ ...s.btnApercu, background: modeApercu ? T.accent : '#f0f2f5', color: modeApercu ? '#fff' : T.text }}
                    onClick={() => setModeApercu(!modeApercu)}
                  >
                    {modeApercu ? '✏️ Editer' : '👁 Apercu'}
                  </button>
                </div>
              </div>

              {/* Mode apercu */}
              {modeApercu ? (
                <div style={s.apercuWrap}>
                  <div style={s.apercuBandeau}>
                    <span style={{ fontSize: '13px', color: T.textLight }}>
                      Apercu de rendu — tel qu il apparaitra sur le site
                    </span>
                    <button style={s.btnApercu} onClick={() => setModeApercu(false)}>
                      ✏️ Retour a l'edition
                    </button>
                  </div>
                  {aContenu ? (
                    <div
                      className="politique-content"
                      style={s.apercuContenu}
                      dangerouslySetInnerHTML={{ __html: contenuApercu }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: T.textLight }}>
                      <p style={{ fontSize: '40px', marginBottom: '10px' }}>📝</p>
                      <p>Aucun contenu a afficher. Commencez a rediger votre politique.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={s.editeurCorps}>
                  {/* Barre d'outils */}
                  <div style={s.toolbar}>
                    <span style={s.toolbarLabel}>Mise en forme :</span>
                    {[
                      { label: 'G',   avant: '<strong>', apres: '</strong>', title: 'Gras' },
                      { label: 'I',   avant: '<em>',     apres: '</em>',     title: 'Italique' },
                      { label: 'H1',  avant: '<h1>',     apres: '</h1>',     title: 'Titre principal' },
                      { label: 'H2',  avant: '<h2>',     apres: '</h2>',     title: 'Titre section' },
                      { label: 'H3',  avant: '<h3>',     apres: '</h3>',     title: 'Sous-titre' },
                      { label: '🔗',  avant: '<a href="">', apres: '</a>',   title: 'Lien' },
                      { label: '📋',  avant: '<ul>\n  <li>', apres: '</li>\n</ul>', title: 'Liste a puces' },
                      { label: '1.',  avant: '<ol>\n  <li>', apres: '</li>\n</ol>', title: 'Liste numerotee' },
                      { label: '💬',  avant: '<blockquote>', apres: '</blockquote>', title: 'Citation' },
                      { label: '—',   avant: '\n<hr />\n', apres: '',        title: 'Separateur' },
                      { label: '§',   avant: '<p>',      apres: '</p>',      title: 'Paragraphe' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        className="toolbar-btn"
                        style={s.toolbarBtn}
                        onClick={() => insererBalise(btn.avant, btn.apres)}
                        title={btn.title}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <div style={s.toolbarSep} />
                    <span style={{ fontSize: '11px', color: T.textLight }}>HTML supporte</span>
                  </div>

                  {/* Zone de texte */}
                  <textarea
                    ref={textareaRef}
                    style={s.textarea}
                    value={contenuActuel}
                    onChange={e => setContenuEdite(prev => ({ ...prev, [configActuelle.slug]: e.target.value }))}
                    placeholder={`Redigez la politique "${configActuelle.label}" ici...\n\nUtilisez les boutons ci-dessus pour formater le texte en HTML.\nOu cliquez sur "Inserer un modele" pour commencer avec un exemple.`}
                    spellCheck={false}
                  />

                  <div style={s.editeurFooter}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: T.textLight }}>
                        {contenuActuel.length} caracteres
                      </span>
                      {modifie && (
                        <span style={{ fontSize: '12px', color: T.warning, fontWeight: 600 }}>
                          ● Modifications non sauvegardees
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={s.btnApercu}
                        onClick={() => setModeApercu(true)}
                        disabled={!aContenu}
                      >
                        👁 Apercu
                      </button>
                      <button
                        style={{
                          ...s.btnSauvegarder,
                          opacity: sauvegarde || !modifie ? 0.5 : 1,
                          cursor: sauvegarde || !modifie ? 'not-allowed' : 'pointer',
                        }}
                        onClick={sauvegarder}
                        disabled={sauvegarde || !modifie}
                      >
                        {sauvegarde ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '13px', color: T.textLight, margin: 0 },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },

  sidebar: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: '20px' },
  sidebarTitre: { fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '1px', padding: '14px 16px 10px', margin: 0, borderBottom: `1px solid ${T.border}` },
  ongletBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s', justifyContent: 'space-between' },
  ongletBtnActif: { background: '#e8f2fb', borderLeft: `3px solid ${T.accent}` },
  sidebarInfo: { padding: '14px 16px', background: '#f8fafc', borderTop: `1px solid ${T.border}` },

  editeurWrap: {},
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', animation: 'slideIn 0.2s ease' },

  editeurHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: '12px', background: '#f8fafc' },
  editeurTitre: { fontSize: '17px', fontWeight: 800, color: T.text, margin: '0 0 2px' },
  editeurDesc: { fontSize: '12px', color: T.textLight, margin: 0 },

  btnModele: { padding: '7px 14px', background: '#f0f2f5', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: T.text, fontWeight: 500, transition: 'background 0.15s' },
  btnApercu: { padding: '7px 14px', background: '#f0f2f5', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: T.text, fontWeight: 500 },

  editeurCorps: {},
  toolbar: { display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', background: '#f8fafc' },
  toolbarLabel: { fontSize: '11px', color: T.textLight, fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' },
  toolbarBtn: { padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: T.text, transition: 'all 0.15s', minWidth: '28px' },
  toolbarSep: { width: '1px', height: '20px', background: T.border, margin: '0 4px' },

  textarea: { width: '100%', minHeight: '480px', padding: '20px', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.7', color: T.text, resize: 'vertical', boxSizing: 'border-box', background: '#fff' } as React.CSSProperties,

  editeurFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${T.border}`, background: '#f8fafc' },

  apercuWrap: {},
  apercuBandeau: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#fffbeb', borderBottom: `1px solid #fde68a` },
  apercuContenu: { padding: '40px 60px', maxHeight: '640px', overflowY: 'auto', fontSize: '15px', lineHeight: '1.8', color: T.text, maxWidth: '860px', margin: '0 auto' } as React.CSSProperties,

  btnSauvegarder: { padding: '9px 22px', background: T.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', transition: 'opacity 0.15s' },

  spinner: { width: '32px', height: '32px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};