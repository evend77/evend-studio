// CHEMIN : src/pages/gestionnaire/BoutiqueChatbot.tsx
// e-Vend Studio — Configuration du Chatbot (add-on « Chatbot », templates boutique solo).
// Adapté de ChatbotConfig.tsx (multivendeur) : mêmes 6 onglets (Messages, Apparence, Comportement, Sources, Réponses rapides, Liste noire),
// mêmes tables chatbot_*, mais API /api/boutique/gestionnaire/chatbot/… et aucun popup du navigateur (BoutiqueModale).
// Le chatbot cherche dans : produits actifs, politiques, FAQ, À propos, blog du gestionnaire (cases à cocher dans « Sources »).
// Réglages inutilisés par le widget MV (pages actives, son, historique) : volontairement non affichés.

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { bq, messageErreur, BQ } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

type Onglet = 'messages' | 'apparence' | 'comportement' | 'sources' | 'reponses' | 'blacklist';
type Cle = 'accueil_phrases' | 'transition_phrases' | 'attente_phrases' | 'erreur_phrases' | 'fin_phrases' | 'suggestions_defaut';
interface Cfg {
  actif: boolean;
  accueil_phrases: string[]; transition_phrases: string[]; attente_phrases: string[]; erreur_phrases: string[]; fin_phrases: string[]; suggestions_defaut: string[];
  bouton_couleur: string; bouton_couleur_survol: string; bulle_couleur: string; bulle_entete_couleur: string; texte_couleur: string; texte_entete_couleur: string; accroche_couleur: string;
  largeur_widget: number; hauteur_widget: number; bouton_taille: number; bouton_icone_taille: number;
  position_widget: string; marge_bas: number; marge_droite: number; marge_gauche: number; marge_haut: number;
  border_radius_widget: number; border_radius_bouton: number; police_texte: string; taille_texte: number;
  logo_url: string | null; logo_taille: number; icone_bouton: string;
  delai_reponse: number; animation_duree: number; suggerer_questions: boolean; afficher_bulle_bienvenue: boolean; delai_bulle_bienvenue: number; max_caracteres_question: number;
  sources_contenu: Record<string, boolean>; score_minimum: number | string; max_resultats: number;
  [k: string]: any;
}
interface Choix { label: string; reponse: string }
interface Menu { question: string; choix: Choix[] }
interface RD { id: number; mots: string; reponse: string; reponses: string; menu: Menu | null; actif: boolean; categorie: string }
interface LN { id: number; mots: string; message_reponse: string; actif: boolean }
interface SP { id: number; mots: string; url_source: string; titre: string; description: string; actif: boolean }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444', bg: '#f8fafc' };
const POSITIONS: [string, string][] = [['bottom-right', 'En bas à droite'], ['bottom-left', 'En bas à gauche'], ['top-right', 'En haut à droite'], ['top-left', 'En haut à gauche']];
const SOURCES: [string, string, string][] = [
  ['produits', '🛍️ Produits actifs', 'Titre, description et prix de vos produits en vente'],
  ['politiques', '📜 Politiques', 'Retour, confidentialité, conditions, expédition… (celles affichées sur votre site)'],
  ['faq', '❓ FAQ', 'Les questions de « Configurer mes pages » → FAQ'],
  ['apropos', '🏢 À propos', 'Le contenu de votre page À propos'],
  ['blog', '📝 Blog', 'Vos articles publiés dans « Mes blogs »'],
];
const PHRASES: [Cle, string, string, string][] = [
  ['accueil_phrases', '👋 Messages d’accueil', 'Premier message quand le visiteur ouvre le chat', '+ Ajouter une phrase d’accueil'],
  ['transition_phrases', '📝 Messages de transition', 'Phrase placée avant la réponse', '+ Ajouter une phrase de transition'],
  ['attente_phrases', '⏳ Messages d’attente', 'Affichés pendant que le chatbot cherche', '+ Ajouter une phrase d’attente'],
  ['erreur_phrases', '😕 Messages d’erreur', 'Quand aucune réponse n’est trouvée', '+ Ajouter un message d’erreur'],
  ['fin_phrases', '✨ Messages de fin', 'Ajoutés après la réponse', '+ Ajouter une phrase de fin'],
  ['suggestions_defaut', '💡 Suggestions', 'Questions proposées au visiteur (boutons cliquables)', '+ Ajouter une suggestion'],
];

let tmp = 0;
const idTemp = () => --tmp;
const motsVersTexte = (m: any) => (Array.isArray(m) ? m.join(', ') : '');
const textVersMots = (t: string) => t.split(',').map(x => x.trim()).filter(Boolean);

export default function BoutiqueChatbot({ accent, isMobile: mobileProp }: { gestionnaireId: number; accent?: string; isMobile?: boolean }) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [onglet, setOnglet] = useState<Onglet>('messages');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [rd, setRd] = useState<RD[]>([]);
  const [ln, setLn] = useState<LN[]>([]);
  const [sp, setSp] = useState<SP[]>([]);
  const [stats, setStats] = useState<{ total: number; sessions: number } | null>(null);
  const [guide, setGuide] = useState('');
  const [chargement, setChargement] = useState(true);
  const [inactif, setInactif] = useState(false);
  const [erreurChargement, setErreurChargement] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [sale, setSale] = useState(false);
  const [sousRd, setSousRd] = useState<'site' | 'divertissement'>('site');
  const [recherche, setRecherche] = useState('');
  const [modale, setModale] = useState<null | { type: 'erreur' | 'succes' | 'confirmer'; message: string; onConfirmer?: () => void }>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const charger = async () => {
    const [c, a, b, s, st, ad] = await Promise.all([
      bq('/chatbot/config'), bq('/chatbot/reponses-directes'), bq('/chatbot/blacklist'), bq('/chatbot/sources-personnalisees'), bq('/chatbot/stats'), bq('/addons'),
    ]);
    if (c.status === 403 && c.data && c.data.addon_inactif) { setInactif(true); setChargement(false); return; }
    if (!c.ok) { setErreurChargement(messageErreur(c)); setChargement(false); return; }
    setCfg(c.data.config);
    if (a.ok) setRd((a.data.reponses || []).map((x: any): RD => ({ id: x.id, mots: motsVersTexte(x.mots_cles), reponse: x.reponse || '', reponses: (x.reponses || []).join('\n'), menu: x.menu_choix && Array.isArray(x.menu_choix.choix) ? x.menu_choix : null, actif: x.actif, categorie: x.categorie || 'site' })));
    if (b.ok) setLn((b.data.blacklist || []).map((x: any): LN => ({ id: x.id, mots: motsVersTexte(x.mots_cles), message_reponse: x.message_reponse, actif: x.actif })));
    if (s.ok) setSp((s.data.sources || []).map((x: any): SP => ({ id: x.id, mots: motsVersTexte(x.mots_cles), url_source: x.url_source, titre: x.titre || '', description: x.description || '', actif: x.actif })));
    if (st.ok && st.data.total) setStats({ total: Number(st.data.total.total) || 0, sessions: Number(st.data.total.sessions) || 0 });
    if (ad.ok && Array.isArray(ad.data.addons)) { const g = ad.data.addons.find((x: any) => x.code === 'chatbot'); if (g && g.guide_url) setGuide(g.guide_url); }
    setSale(false);
    setChargement(false);
  };
  useEffect(() => { charger(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const maj = (k: string, v: any) => { setCfg(c => (c ? { ...c, [k]: v } : c)); setSale(true); };
  const majListe = (k: Cle, i: number, v: string) => { if (!cfg) return; const l = [...cfg[k]]; l[i] = v; maj(k, l); };

  const sauvegarder = async () => {
    if (!cfg) return;
    setEnCours(true);
    const corps: any = {};
    for (const k of Object.keys(cfg)) if (!['gestionnaire_id', 'created_at', 'updated_at', 'pages_actives', 'sonore_notification', 'max_historique', 'largeur_min', 'hauteur_min', 'ombre_widget'].includes(k)) corps[k] = cfg[k];
    corps.score_minimum = Number(cfg.score_minimum) || 0;
    const r = await bq('/chatbot/config', { method: 'PATCH', body: { config: corps } });
    if (!r.ok) { setEnCours(false); setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    const echecs: string[] = [];
    for (const it of rd) {
      const body: any = { mots_cles: textVersMots(it.mots), reponse: it.reponse, reponses: it.reponses.split('\n').map(x => x.trim()).filter(Boolean), menu_choix: it.menu && it.menu.choix.length ? it.menu : null, actif: it.actif, categorie: it.categorie };
      const x = it.id < 0 ? await bq('/chatbot/reponses-directes', { method: 'POST', body }) : await bq('/chatbot/reponses-directes', { method: 'PUT', body: { ...body, id: it.id } });
      if (!x.ok) echecs.push(`Réponse rapide « ${textVersMots(it.mots)[0] || '?'} » : ${messageErreur(x)}`);
    }
    for (const it of ln) {
      const body = { mots_cles: textVersMots(it.mots), message_reponse: it.message_reponse, actif: it.actif };
      const x = it.id < 0 ? await bq('/chatbot/blacklist', { method: 'POST', body }) : await bq('/chatbot/blacklist', { method: 'PUT', body: { ...body, id: it.id } });
      if (!x.ok) echecs.push(`Liste noire : ${messageErreur(x)}`);
    }
    for (const it of sp) {
      const body = { mots_cles: textVersMots(it.mots), url_source: it.url_source, titre: it.titre, description: it.description, actif: it.actif };
      const x = it.id < 0 ? await bq('/chatbot/sources-personnalisees', { method: 'POST', body }) : await bq(`/chatbot/sources-personnalisees/${it.id}`, { method: 'PUT', body });
      if (!x.ok) echecs.push(`Source « ${it.titre || it.url_source} » : ${messageErreur(x)}`);
    }
    setEnCours(false);
    if (echecs.length) { setModale({ type: 'erreur', message: 'Enregistré en partie. À corriger :\n' + echecs.join('\n') }); return; }
    await charger();
    setModale({ type: 'succes', message: 'Configuration du chatbot enregistrée.' });
  };

  const supprimer = (type: 'rd' | 'ln' | 'sp', it: { id: number }, texte: string) => {
    setModale({
      type: 'confirmer', message: texte, onConfirmer: async () => {
        if (it.id > 0) {
          const chemin = type === 'rd' ? 'reponses-directes' : type === 'ln' ? 'blacklist' : 'sources-personnalisees';
          const r = await bq(`/chatbot/${chemin}/${it.id}`, { method: 'DELETE' });
          if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
        }
        if (type === 'rd') setRd(l => l.filter(x => x.id !== it.id));
        else if (type === 'ln') setLn(l => l.filter(x => x.id !== it.id));
        else setSp(l => l.filter(x => x.id !== it.id));
        setModale(null);
      },
    });
  };

  const envoyerLogo = async (f: File | undefined) => {
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    let jeton: string | null = null; try { jeton = localStorage.getItem('token'); } catch (e) { /* ignore */ }
    try {
      const r = await fetch(`${BQ}/upload`, { method: 'POST', body: fd, credentials: 'include', headers: jeton ? { Authorization: `Bearer ${jeton}` } : {} });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) { setModale({ type: 'erreur', message: d.error || "Envoi impossible (image jusqu'à 5 Mo)." }); return; }
      maj('logo_url', d.url);
    } catch (e) { setModale({ type: 'erreur', message: 'Erreur réseau. Réessayez.' }); }
  };

  // ── Styles ──
  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: isMobile ? 14 : 20 };
  const champ: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: T.text, background: '#fff' };
  const lib: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 4 };
  const btn = (primaire?: boolean): CSSProperties => ({ padding: '9px 16px', borderRadius: 9, border: primaire ? 'none' : `1px solid ${T.border}`, background: primaire ? couleur : '#fff', color: primaire ? '#fff' : T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
  const grille: CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 };
  const titreSection: CSSProperties = { margin: '0 0 4px', fontSize: 15, color: T.text };
  const aide: CSSProperties = { margin: '0 0 10px', fontSize: 12, color: T.light };

  const Nombre = ({ k, nom, min, max, pas }: { k: string; nom: string; min?: number; max?: number; pas?: number }) => (
    <div><label style={lib}>{nom}</label><input type="number" style={champ} min={min} max={max} step={pas} value={cfg ? (cfg[k] as any) ?? '' : ''} onChange={e => maj(k, e.target.value === '' ? '' : Number(e.target.value))} /></div>
  );
  const Interrupteur = ({ k, nom, aide: a }: { k: string; nom: string; aide?: string }) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '8px 0' }}>
      <input type="checkbox" checked={!!(cfg && cfg[k])} onChange={e => maj(k, e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: couleur }} />
      <span><span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{nom}</span>{a && <span style={{ display: 'block', fontSize: 12, color: T.light }}>{a}</span>}</span>
    </label>
  );

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  if (inactif) return <div style={{ ...carte, margin: 20 }}><h2 style={{ marginTop: 0 }}>🤖 Chatbot</h2><p style={{ color: T.light }}>Cet add-on n'est pas activé. Activez-le dans « 📊 Mon plan & limites » pour configurer le chatbot.</p></div>;
  if (erreurChargement || !cfg) return <div style={{ ...carte, margin: 20 }}><p style={{ color: T.red }}>{erreurChargement || 'Erreur de chargement de la configuration.'}</p><button style={btn()} onClick={() => { setChargement(true); charger(); }}>Réessayer</button></div>;

  const onglets: [Onglet, string][] = [['messages', '💬 Messages'], ['apparence', '🎨 Apparence'], ['comportement', '⚙️ Comportement'], ['sources', '📚 Sources'], ['reponses', '⚡ Réponses rapides'], ['blacklist', '🚫 Liste noire']];
  const rdFiltre = rd.filter(r => {
    if (r.categorie !== sousRd) return false;
    const q = recherche.trim().toLowerCase();
    return !q || r.mots.toLowerCase().includes(q) || r.reponse.toLowerCase().includes(q) || r.reponses.toLowerCase().includes(q);
  });
  const majRd = (id: number, p: Partial<RD>) => { setRd(l => l.map(x => (x.id === id ? { ...x, ...p } : x))); setSale(true); };
  const majLn = (id: number, p: Partial<LN>) => { setLn(l => l.map(x => (x.id === id ? { ...x, ...p } : x))); setSale(true); };
  const majSp = (id: number, p: Partial<SP>) => { setSp(l => l.map(x => (x.id === id ? { ...x, ...p } : x))); setSale(true); };

  const Actif = ({ v, onChange }: { v: boolean; onChange: (b: boolean) => void }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: v ? T.green : T.light, cursor: 'pointer' }}>
      <input type="checkbox" checked={v} onChange={e => onChange(e.target.checked)} style={{ accentColor: couleur }} /> {v ? 'Actif' : 'Inactif'}
    </label>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? 20 : 24, color: T.text }}>🤖 Configuration du Chatbot
            {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: T.light }}>L'assistant de votre boutique répond à vos visiteurs avec le contenu de votre site.{stats ? ` ${stats.total} question(s) posée(s), ${stats.sessions} visiteur(s).` : ''}</p>
        </div>
        <button style={{ ...btn(true), opacity: enCours ? 0.6 : 1 }} disabled={enCours} onClick={sauvegarder}>{enCours ? '⏳ Enregistrement…' : sale ? '💾 Enregistrer les changements' : '💾 Enregistrer'}</button>
      </div>

      <div style={{ ...carte, marginBottom: 14, padding: isMobile ? 12 : 16, borderColor: cfg.actif ? T.green : T.border }}>
        <Interrupteur k="actif" nom={cfg.actif ? 'Chatbot allumé sur mon site' : 'Chatbot éteint (invisible pour les visiteurs)'} aide="Cliquez sur « Enregistrer » pour appliquer." />
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {onglets.map(([id, nom]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ ...btn(onglet === id), whiteSpace: 'nowrap', flex: '0 0 auto' }}>{nom}</button>
        ))}
      </div>

      <div style={carte}>
        {onglet === 'messages' && (
          <div style={{ display: 'grid', gap: 22 }}>
            {PHRASES.map(([k, nom, desc, ajout]) => (
              <div key={k}>
                <h3 style={titreSection}>{nom}</h3><p style={aide}>{desc}</p>
                {(cfg[k] as string[]).map((p, i) => (
                  <div key={`${k}-${i}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="text" style={champ} value={p} maxLength={300} onChange={e => majListe(k, i, e.target.value)} />
                    <button aria-label="Supprimer la phrase" style={btn()} onClick={() => maj(k, (cfg[k] as string[]).filter((_, j) => j !== i))}>🗑️</button>
                  </div>
                ))}
                <button style={btn()} onClick={() => maj(k, [...(cfg[k] as string[]), ''])}>{ajout}</button>
              </div>
            ))}
          </div>
        )}

        {onglet === 'apparence' && (
          <div style={{ display: 'grid', gap: 22 }}>
            <div>
              <h3 style={titreSection}>🎨 Couleurs</h3>
              <div style={grille}>
                {([['bouton_couleur', 'Bouton'], ['bouton_couleur_survol', 'Bouton (survol)'], ['bulle_entete_couleur', 'En-tête'], ['texte_entete_couleur', 'Texte de l’en-tête'], ['bulle_couleur', 'Fond du chat'], ['texte_couleur', 'Texte'], ['accroche_couleur', 'Accent (liens, boutons)']] as [string, string][]).map(([k, nom]) => (
                  <div key={k}><label style={lib}>{nom}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" aria-label={nom} value={/^#[0-9a-fA-F]{6}$/.test(String(cfg[k])) ? String(cfg[k]) : '#000000'} onChange={e => maj(k, e.target.value)} style={{ width: 44, height: 38, border: `1px solid ${T.border}`, borderRadius: 8, padding: 2, background: '#fff' }} />
                      <input type="text" style={champ} value={String(cfg[k] ?? '')} onChange={e => maj(k, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={titreSection}>📐 Taille et position</h3>
              <div style={grille}>
                <Nombre k="largeur_widget" nom="Largeur du chat (px)" min={240} max={700} />
                <Nombre k="hauteur_widget" nom="Hauteur du chat (px)" min={300} max={900} />
                <Nombre k="bouton_taille" nom="Taille du bouton (px)" min={30} max={120} />
                <Nombre k="bouton_icone_taille" nom="Taille de l’icône (px)" min={12} max={80} />
                <div><label style={lib}>Position</label>
                  <select style={champ} value={cfg.position_widget} onChange={e => maj('position_widget', e.target.value)}>{POSITIONS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
                </div>
                <Nombre k="marge_bas" nom="Marge du bas (px)" min={0} max={400} />
                <Nombre k="marge_haut" nom="Marge du haut (px)" min={0} max={400} />
                <Nombre k="marge_droite" nom="Marge de droite (px)" min={0} max={400} />
                <Nombre k="marge_gauche" nom="Marge de gauche (px)" min={0} max={400} />
              </div>
            </div>
            <div>
              <h3 style={titreSection}>✏️ Formes et texte</h3>
              <div style={grille}>
                <Nombre k="border_radius_widget" nom="Arrondi du chat (px)" min={0} max={60} />
                <Nombre k="border_radius_bouton" nom="Arrondi du bouton (px)" min={0} max={100} />
                <Nombre k="taille_texte" nom="Taille du texte (px)" min={10} max={24} />
                <div><label style={lib}>Police</label>
                  <select style={champ} value={cfg.police_texte} onChange={e => maj('police_texte', e.target.value)}>
                    {['Nunito', 'Inter', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS'].concat(['Nunito', 'Inter', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS'].includes(cfg.police_texte) ? [] : [cfg.police_texte]).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={lib}>Icône du bouton (emoji)</label><input type="text" style={champ} maxLength={4} value={cfg.icone_bouton} onChange={e => maj('icone_bouton', e.target.value)} /></div>
              </div>
            </div>
            <div>
              <h3 style={titreSection}>🖼️ Logo dans l’en-tête</h3><p style={aide}>Facultatif. Image jusqu’à 5 Mo.</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {cfg.logo_url && <img src={cfg.logo_url} alt="Logo du chatbot" style={{ width: 48, height: 48, objectFit: 'contain', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff' }} />}
                <input ref={fichier} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { envoyerLogo(e.target.files?.[0]); e.target.value = ''; }} />
                <button style={btn()} onClick={() => fichier.current?.click()}>{cfg.logo_url ? 'Changer le logo' : 'Choisir un logo'}</button>
                {cfg.logo_url && <button style={btn()} onClick={() => maj('logo_url', null)}>Retirer</button>}
                <div style={{ width: 120 }}><Nombre k="logo_taille" nom="Taille (px)" min={16} max={120} /></div>
              </div>
            </div>
            <div>
              <h3 style={titreSection}>👁️ Aperçu</h3>
              <div style={{ background: T.bg, borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: Math.min(300, cfg.largeur_widget), background: cfg.bulle_couleur, color: cfg.texte_couleur, borderRadius: cfg.border_radius_widget, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden', fontFamily: `${cfg.police_texte}, sans-serif`, fontSize: cfg.taille_texte }}>
                  <div style={{ background: cfg.bulle_entete_couleur, color: cfg.texte_entete_couleur, padding: '10px 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cfg.logo_url && <img src={cfg.logo_url} alt="" style={{ width: Math.min(cfg.logo_taille, 36), height: Math.min(cfg.logo_taille, 36), objectFit: 'contain' }} />}Assistant
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '8px 12px', display: 'inline-block', marginBottom: 8 }}>{cfg.accueil_phrases[0] || 'Bonjour!'}</div>
                    <div><span style={{ color: cfg.accroche_couleur, fontWeight: 700, textDecoration: 'underline' }}>Un lien de réponse</span></div>
                  </div>
                </div>
                <div style={{ width: cfg.bouton_taille, height: cfg.bouton_taille, borderRadius: cfg.border_radius_bouton, background: cfg.bouton_couleur, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: cfg.bouton_icone_taille }}>{cfg.icone_bouton}</div>
              </div>
            </div>
          </div>
        )}

        {onglet === 'comportement' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Interrupteur k="afficher_bulle_bienvenue" nom="Bulle de bienvenue" aide="Une petite bulle d’accueil apparaît près du bouton (une fois par visite)." />
            <Interrupteur k="suggerer_questions" nom="Suggestions de questions" aide="Affiche vos suggestions sous le message d’accueil et quand aucune réponse n’est trouvée." />
            <div style={grille}>
              <Nombre k="delai_bulle_bienvenue" nom="Délai avant la bulle (ms)" min={0} max={60000} pas={500} />
              <Nombre k="delai_reponse" nom="Délai de réponse (ms)" min={0} max={5000} pas={100} />
              <Nombre k="animation_duree" nom="Durée d’animation (ms)" min={0} max={2000} pas={50} />
              <Nombre k="max_caracteres_question" nom="Longueur max. d’une question" min={20} max={500} />
              <Nombre k="max_resultats" nom="Pages suggérées par réponse" min={1} max={10} />
              <Nombre k="score_minimum" nom="Pertinence minimale (0 à 1)" min={0} max={1} pas={0.01} />
            </div>
            <p style={aide}>Pertinence minimale : plus la valeur est haute, plus le chatbot est strict (0,05 convient à la plupart des sites).</p>
          </div>
        )}

        {onglet === 'sources' && (
          <div style={{ display: 'grid', gap: 22 }}>
            <div>
              <h3 style={titreSection}>📚 Où le chatbot cherche-t-il ?</h3><p style={aide}>Seul le contenu public de votre boutique est utilisé.</p>
              {SOURCES.map(([k, nom, desc]) => (
                <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2, accentColor: couleur }} checked={cfg.sources_contenu[k] !== false}
                    onChange={e => maj('sources_contenu', { ...cfg.sources_contenu, [k]: e.target.checked })} />
                  <span><span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{nom}</span><span style={{ display: 'block', fontSize: 12, color: T.light }}>{desc}</span></span>
                </label>
              ))}
            </div>
            <div>
              <h3 style={titreSection}>🔗 Sources personnalisées</h3>
              <p style={aide}>Quand un visiteur utilise ces mots-clés, le chatbot lui propose ce lien (adresse en https://).</p>
              {sp.map(it => (
                <div key={it.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10, display: 'grid', gap: 8 }}>
                  <div style={grille}>
                    <div><label style={lib}>Mots-clés (séparés par des virgules)</label><input style={champ} value={it.mots} onChange={e => majSp(it.id, { mots: e.target.value })} /></div>
                    <div><label style={lib}>Adresse (https://…)</label><input style={champ} value={it.url_source} onChange={e => majSp(it.id, { url_source: e.target.value })} /></div>
                    <div><label style={lib}>Titre</label><input style={champ} maxLength={200} value={it.titre} onChange={e => majSp(it.id, { titre: e.target.value })} /></div>
                  </div>
                  <div><label style={lib}>Description</label><textarea style={{ ...champ, minHeight: 60 }} maxLength={1000} value={it.description} onChange={e => majSp(it.id, { description: e.target.value })} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Actif v={it.actif} onChange={b => majSp(it.id, { actif: b })} />
                    <button style={btn()} onClick={() => supprimer('sp', it, 'Supprimer cette source ?')}>🗑️ Supprimer</button>
                  </div>
                </div>
              ))}
              <button style={btn()} onClick={() => { setSp(l => [...l, { id: idTemp(), mots: '', url_source: 'https://', titre: '', description: '', actif: true }]); setSale(true); }}>+ Ajouter une source</button>
            </div>
          </div>
        )}

        {onglet === 'reponses' && (
          <div>
            <p style={aide}>Les réponses rapides passent AVANT la recherche : si la question contient un de vos mots-clés, le chatbot répond tout de suite.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {([['site', '📘 Site / Fonctionnement'], ['divertissement', '🎉 Divertissement']] as ['site' | 'divertissement', string][]).map(([id, nom]) => (
                <button key={id} style={btn(sousRd === id)} onClick={() => setSousRd(id)}>{nom}</button>
              ))}
              <input style={{ ...champ, flex: 1, minWidth: 160 }} placeholder="Rechercher…" value={recherche} onChange={e => setRecherche(e.target.value)} />
            </div>
            {rdFiltre.map(it => (
              <div key={it.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10, display: 'grid', gap: 8 }}>
                <div><label style={lib}>Mots-clés (séparés par des virgules)</label><input style={champ} value={it.mots} onChange={e => majRd(it.id, { mots: e.target.value })} /></div>
                {sousRd === 'site' ? (
                  <div><label style={lib}>Réponse</label><textarea style={{ ...champ, minHeight: 70 }} maxLength={2000} value={it.reponse} onChange={e => majRd(it.id, { reponse: e.target.value })} /></div>
                ) : (
                  <div><label style={lib}>Réponses possibles (une par ligne — une est choisie au hasard)</label><textarea style={{ ...champ, minHeight: 80 }} value={it.reponses} onChange={e => majRd(it.id, { reponses: e.target.value })} /></div>
                )}
                {sousRd === 'site' && (it.menu ? (
                  <div style={{ background: T.bg, borderRadius: 8, padding: 10, display: 'grid', gap: 8 }}>
                    <label style={lib}>Menu de choix (boutons cliquables, 5 max.)</label>
                    <input style={champ} placeholder="Question du menu" maxLength={200} value={it.menu.question} onChange={e => majRd(it.id, { menu: { ...it.menu!, question: e.target.value } })} />
                    {it.menu.choix.map((c, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr auto', gap: 8 }}>
                        <input style={champ} placeholder="Texte du bouton" maxLength={80} value={c.label} onChange={e => majRd(it.id, { menu: { ...it.menu!, choix: it.menu!.choix.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) } })} />
                        <input style={champ} placeholder="Réponse affichée" value={c.reponse} onChange={e => majRd(it.id, { menu: { ...it.menu!, choix: it.menu!.choix.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)) } })} />
                        <button aria-label="Retirer le choix" style={btn()} onClick={() => majRd(it.id, { menu: { ...it.menu!, choix: it.menu!.choix.filter((_, j) => j !== i) } })}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {it.menu.choix.length < 5 && <button style={btn()} onClick={() => majRd(it.id, { menu: { ...it.menu!, choix: [...it.menu!.choix, { label: '', reponse: '' }] } })}>+ Ajouter un choix</button>}
                      <button style={btn()} onClick={() => majRd(it.id, { menu: null })}>Retirer le menu</button>
                    </div>
                  </div>
                ) : <div><button style={btn()} onClick={() => majRd(it.id, { menu: { question: '', choix: [{ label: '', reponse: '' }] } })}>+ Ajouter un menu de choix</button></div>)}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Actif v={it.actif} onChange={b => majRd(it.id, { actif: b })} />
                  <button style={btn()} onClick={() => supprimer('rd', it, 'Supprimer cette réponse rapide ?')}>🗑️ Supprimer</button>
                </div>
              </div>
            ))}
            {!rdFiltre.length && <p style={{ color: T.light, fontSize: 13 }}>Aucune réponse dans cette catégorie.</p>}
            <button style={btn()} onClick={() => { setRd(l => [...l, { id: idTemp(), mots: '', reponse: '', reponses: '', menu: null, actif: true, categorie: sousRd }]); setSale(true); }}>+ Ajouter une réponse rapide</button>
          </div>
        )}

        {onglet === 'blacklist' && (
          <div>
            <p style={aide}>Si la question contient un de ces mots, le chatbot ne cherche rien et répond seulement avec le message choisi.</p>
            {ln.map(it => (
              <div key={it.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10, display: 'grid', gap: 8 }}>
                <div><label style={lib}>Mots-clés (séparés par des virgules)</label><input style={champ} value={it.mots} onChange={e => majLn(it.id, { mots: e.target.value })} /></div>
                <div><label style={lib}>Message de réponse</label><textarea style={{ ...champ, minHeight: 60 }} maxLength={500} value={it.message_reponse} onChange={e => majLn(it.id, { message_reponse: e.target.value })} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Actif v={it.actif} onChange={b => majLn(it.id, { actif: b })} />
                  <button style={btn()} onClick={() => supprimer('ln', it, 'Supprimer cette entrée de la liste noire ?')}>🗑️ Supprimer</button>
                </div>
              </div>
            ))}
            <button style={btn()} onClick={() => { setLn(l => [...l, { id: idTemp(), mots: '', message_reponse: 'Veuillez rester courtois.', actif: true }]); setSale(true); }}>+ Ajouter une entrée</button>
          </div>
        )}
      </div>

      {modale && (
        <BoutiqueModale type={modale.type} message={modale.message} accent={couleur} onFermer={() => setModale(null)} onConfirmer={modale.onConfirmer} texteConfirmer={modale.type === 'confirmer' ? 'Supprimer' : undefined} />
      )}
    </div>
  );
}