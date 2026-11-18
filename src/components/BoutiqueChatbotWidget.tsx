// CHEMIN : src/components/BoutiqueChatbotWidget.tsx
// e-Vend Studio — Widget « Chatbot » (sans IA) flottant des templates boutique (solo). Adapté de ChatbotWidget.tsx (MV) ; le MV garde le sien, intact.
// Parle à /api/boutique/chatbot/:gid/(config | ask). N'existe que si l'add-on est activé ET que le gestionnaire a allumé le chatbot (sinon /config répond 404).
// Les résultats portent un « nav » : le widget le transmet au site par l'évènement 'boutique-chatbot-nav' (le template ouvre la bonne page sans recharger).
// Aucun popup du navigateur. Réglages du gestionnaire utilisés : couleurs, taille, position, police, logo, icône, phrases, suggestions, bulle de bienvenue, délai de réponse.

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config/api';

interface Props { gestionnaireId: number }

interface Choix { label: string; reponse: string }
interface PageNav { titre: string; pageTitre?: string; nav?: any; type?: string }
interface Msg {
  id: string; texte: string; moi: boolean; heure: Date;
  menu?: { question: string; choix: Choix[] } | null;
  pages?: PageNav[]; lien?: { url: string; texte: string } | null; suggestions?: string[];
}
interface Cfg {
  actif: boolean; accueil_phrases: string[]; attente_phrases: string[]; suggestions_defaut: string[];
  bouton_couleur: string; bouton_couleur_survol: string; bulle_couleur: string; bulle_entete_couleur: string; texte_couleur: string; texte_entete_couleur: string; accroche_couleur: string;
  largeur_widget: number; hauteur_widget: number; largeur_min: number; hauteur_min: number; bouton_taille: number; bouton_icone_taille: number;
  position_widget: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; marge_bas: number; marge_droite: number; marge_gauche: number; marge_haut: number;
  border_radius_widget: number; border_radius_bouton: number; ombre_widget: string; police_texte: string; taille_texte: number;
  logo_url: string | null; logo_taille: number; icone_bouton: string; delai_reponse: number; animation_duree: number;
  suggerer_questions: boolean; afficher_bulle_bienvenue: boolean; delai_bulle_bienvenue: number; max_caracteres_question: number;
}

const hasard = (l: string[] | undefined, defaut: string) => (Array.isArray(l) && l.length ? l[Math.floor(Math.random() * l.length)] : defaut);
const attendre = (ms: number) => new Promise(r => setTimeout(r, ms));
const lireSession = (cle: string) => { try { return sessionStorage.getItem(cle); } catch (e) { return null; } };
const ecrireSession = (cle: string, v: string) => { try { sessionStorage.setItem(cle, v); } catch (e) { /* ignoré */ } };

export default function BoutiqueChatbotWidget({ gestionnaireId }: Props) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [reduit, setReduit] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [bulle, setBulle] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [session] = useState(() => {
    const cle = `boutique_chatbot_session_${gestionnaireId}`;
    let id: string | null = null;
    try { id = localStorage.getItem(cle); } catch (e) { id = null; }
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
      try { localStorage.setItem(cle, id); } catch (e) { /* ignoré */ }
    }
    return id;
  });
  const finRef = useRef<HTMLDivElement>(null);
  const saisieRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const inactifRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gestionnaireId) return;
    let vivant = true;
    fetch(`${API_BASE}/boutique/chatbot/${gestionnaireId}/config`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (vivant) setCfg(d && d.config && d.config.actif ? d.config : null); })
      .catch(() => { if (vivant) setCfg(null); });
    return () => { vivant = false; };
  }, [gestionnaireId]);

  useEffect(() => { const f = () => setMobile(window.innerWidth <= 768); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, enCours]);

  // Bulle de bienvenue (fermée seulement ; une fois par visite)
  useEffect(() => {
    if (!cfg || !cfg.afficher_bulle_bienvenue || ouvert || lireSession(`bcb_bulle_${gestionnaireId}`)) return;
    const t = setTimeout(() => setBulle(true), Math.max(0, cfg.delai_bulle_bienvenue || 0));
    return () => clearTimeout(t);
  }, [cfg, ouvert, gestionnaireId]);
  const fermerBulle = () => { setBulle(false); ecrireSession(`bcb_bulle_${gestionnaireId}`, '1'); };

  // Message d'accueil à la première ouverture
  useEffect(() => {
    if (ouvert && cfg && messages.length === 0) {
      setMessages([{ id: 'accueil', texte: hasard(cfg.accueil_phrases, 'Bonjour! Comment puis-je vous aider?'), moi: false, heure: new Date(), suggestions: cfg.suggerer_questions ? cfg.suggestions_defaut : [] }]);
    }
  }, [ouvert, cfg, messages.length]);

  // Réduit automatiquement après 30 s d'inactivité ou au clic à l'extérieur
  const relancerInactivite = useCallback(() => {
    if (inactifRef.current) clearTimeout(inactifRef.current);
    if (ouvert && !reduit) inactifRef.current = setTimeout(() => setReduit(true), 30000);
  }, [ouvert, reduit]);
  useEffect(() => { relancerInactivite(); return () => { if (inactifRef.current) clearTimeout(inactifRef.current); }; }, [relancerInactivite, messages, question]);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (zoneRef.current && !zoneRef.current.contains(e.target as Node) && ouvert && !reduit) setReduit(true); };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [ouvert, reduit]);

  const envoyer = useCallback(async (texte: string) => {
    const t = texte.trim();
    if (!t || enCours || !cfg) return;
    const idAttente = 'att' + Date.now();
    setMessages(p => [...p.map(m => (m.suggestions ? { ...m, suggestions: [] } : m)), { id: 'u' + Date.now(), texte: t, moi: true, heure: new Date() }, { id: idAttente, texte: hasard(cfg.attente_phrases, '🔍 Je cherche…'), moi: false, heure: new Date() }]);
    setQuestion(''); setEnCours(true);
    const debut = Date.now();
    let rep: any = null;
    try {
      const r = await fetch(`${API_BASE}/boutique/chatbot/${gestionnaireId}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: t, session_id: session }) });
      rep = await r.json().catch(() => null);
      if (!rep) rep = { error: '😕 Désolé, une erreur est survenue. Veuillez réessayer.' };
    } catch (e) { rep = { error: '😕 Désolé, une erreur est survenue. Veuillez réessayer.' }; }
    const reste = (cfg.delai_reponse || 0) - (Date.now() - debut);
    if (reste > 0) await attendre(Math.min(reste, 5000));
    const m: Msg = {
      id: 'b' + Date.now(), moi: false, heure: new Date(),
      texte: rep.reponse || (rep.menu_choix ? '' : rep.error || ''),
      menu: rep.menu_choix || null,
      pages: Array.isArray(rep.pages) ? rep.pages.filter((p: PageNav) => p && p.nav) : [],
      lien: rep.lien && typeof rep.lien.url === 'string' && /^https:\/\//i.test(rep.lien.url) ? rep.lien : null,
      suggestions: rep.found === false && cfg.suggerer_questions && Array.isArray(rep.suggestions) ? rep.suggestions : [],
    };
    setMessages(p => [...p.filter(x => x.id !== idAttente), m]);
    setEnCours(false);
    setTimeout(() => saisieRef.current?.focus(), 100);
  }, [enCours, cfg, gestionnaireId, session]);

  const aller = (nav: any) => { window.dispatchEvent(new CustomEvent('boutique-chatbot-nav', { detail: nav })); if (mobile) setReduit(true); };

  if (!cfg) return null;

  const pos: React.CSSProperties = {};
  if (cfg.position_widget.startsWith('bottom')) pos.bottom = cfg.marge_bas; else pos.top = cfg.marge_haut;
  if (cfg.position_widget.endsWith('left')) pos.left = cfg.marge_gauche; else pos.right = cfg.marge_droite;
  const police = `${cfg.police_texte || 'Nunito'}, system-ui, -apple-system, 'Segoe UI', sans-serif`;
  const grand = cfg.max_caracteres_question || 500;

  if (!ouvert) {
    return (
      <>
        {bulle && (
          <div role="status" style={{ position: 'fixed', ...pos, [cfg.position_widget.startsWith('bottom') ? 'bottom' : 'top']: (cfg.position_widget.startsWith('bottom') ? cfg.marge_bas : cfg.marge_haut) + cfg.bouton_taille + 12, maxWidth: 240, background: cfg.bulle_couleur, color: cfg.texte_couleur, borderRadius: 14, padding: '10px 32px 10px 14px', fontSize: cfg.taille_texte, fontFamily: police, boxShadow: cfg.ombre_widget, zIndex: 9999, cursor: 'pointer' }}
            onClick={() => { fermerBulle(); setOuvert(true); setReduit(false); setTimeout(() => saisieRef.current?.focus(), 200); }}>
            {hasard(cfg.accueil_phrases, 'Bonjour! Comment puis-je vous aider?')}
            <button aria-label="Fermer le message" onClick={e => { e.stopPropagation(); fermerBulle(); }} style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: cfg.texte_couleur, opacity: 0.5, fontSize: 14 }}>✕</button>
          </div>
        )}
        <button aria-label="Ouvrir l'assistant virtuel" onClick={() => { fermerBulle(); setOuvert(true); setReduit(false); setTimeout(() => saisieRef.current?.focus(), 200); }}
          style={{ position: 'fixed', ...pos, width: cfg.bouton_taille, height: cfg.bouton_taille, borderRadius: cfg.border_radius_bouton, background: cfg.logo_url ? 'transparent' : cfg.bouton_couleur, border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontSize: cfg.bouton_icone_taille, boxShadow: cfg.logo_url ? 'none' : '0 2px 10px rgba(0,0,0,0.2)' }}>
          {cfg.logo_url ? <img src={cfg.logo_url} alt="" style={{ width: cfg.bouton_taille, height: cfg.bouton_taille, borderRadius: cfg.border_radius_bouton, objectFit: 'contain' }} /> : (cfg.icone_bouton || '💬')}
        </button>
      </>
    );
  }

  if (reduit) {
    return (
      <div ref={zoneRef} onClick={() => { setReduit(false); setTimeout(() => saisieRef.current?.focus(), 200); }} role="button" tabIndex={0}
        style={{ position: 'fixed', ...pos, width: 220, background: cfg.bulle_entete_couleur, color: cfg.texte_entete_couleur, borderRadius: cfg.border_radius_widget, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: cfg.ombre_widget, zIndex: 9999, fontFamily: police }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cfg.logo_url && <img src={cfg.logo_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
          <span style={{ fontSize: cfg.taille_texte, fontWeight: 600 }}>Assistant virtuel</span>
        </div>
        <button aria-label="Fermer" onClick={e => { e.stopPropagation(); setOuvert(false); setReduit(false); }} style={{ background: 'none', border: 'none', color: cfg.texte_entete_couleur, cursor: 'pointer', fontSize: 14, opacity: 0.8 }}>✕</button>
      </div>
    );
  }

  const puce: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${cfg.bouton_couleur}`, background: '#fff', color: cfg.bouton_couleur, fontSize: cfg.taille_texte - 1, cursor: 'pointer', fontWeight: 600, fontFamily: police };

  return (
    <div ref={zoneRef} role="dialog" aria-label="Assistant virtuel"
      style={{ position: 'fixed', ...pos, width: mobile ? '92vw' : cfg.largeur_widget, maxWidth: '96vw', height: mobile ? '78vh' : cfg.hauteur_widget, maxHeight: '90vh', minWidth: mobile ? 0 : cfg.largeur_min, minHeight: mobile ? 0 : cfg.hauteur_min, background: cfg.bulle_couleur, borderRadius: cfg.border_radius_widget, boxShadow: cfg.ombre_widget, fontFamily: police, fontSize: cfg.taille_texte, color: cfg.texte_couleur, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: `all ${cfg.animation_duree}ms ease-in-out`, zIndex: 9999 }}>
      <div style={{ background: cfg.bulle_entete_couleur, color: cfg.texte_entete_couleur, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cfg.logo_url && <img src={cfg.logo_url} alt="" style={{ width: cfg.logo_taille || 24, height: cfg.logo_taille || 24, objectFit: 'contain' }} />}
          <span style={{ fontWeight: 700 }}>Assistant virtuel</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button aria-label="Réduire" onClick={() => setReduit(true)} style={{ background: 'none', border: 'none', color: cfg.texte_entete_couleur, fontSize: 18, cursor: 'pointer', opacity: 0.85 }}>−</button>
          <button aria-label="Fermer" onClick={() => setOuvert(false)} style={{ background: 'none', border: 'none', color: cfg.texte_entete_couleur, fontSize: 18, cursor: 'pointer', opacity: 0.85 }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, WebkitOverflowScrolling: 'touch' }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.moi ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '86%', padding: '10px 14px', borderRadius: m.moi ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.moi ? cfg.bouton_couleur : '#f0f2f5', color: m.moi ? '#fff' : cfg.texte_couleur, wordBreak: 'break-word' }}>
              {m.texte && <div style={{ whiteSpace: 'pre-wrap' }}>{m.texte}</div>}
              {m.menu && (
                <div style={{ marginTop: 10 }}>
                  {m.menu.question && <div style={{ fontWeight: 600, marginBottom: 8 }}>{m.menu.question}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {m.menu.choix.filter(c => c.label && c.reponse).map((c, i) => (
                      <button key={i} onClick={() => setMessages(p => [...p, { id: 'c' + Date.now(), texte: c.label, moi: true, heure: new Date() }, { id: 'r' + Date.now(), texte: c.reponse, moi: false, heure: new Date() }])} style={puce}>{c.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {m.pages && m.pages.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.pages.map((p, i) => (
                    <button key={i} onClick={() => aller(p.nav)} style={puce}>
                      {p.type === 'produit' ? '🛍️ Voir' : p.type === 'blog' ? '📝 Lire' : '👉 Ouvrir'} : {p.titre.length > 48 ? p.titre.slice(0, 48) + '…' : p.titre}
                    </button>
                  ))}
                </div>
              )}
              {m.lien && (
                <div style={{ marginTop: 10 }}>
                  <a href={m.lien.url} target="_blank" rel="noopener noreferrer" style={{ ...puce, display: 'inline-block', textDecoration: 'none' }}>🔗 {m.lien.texte}</a>
                </div>
              )}
              {m.suggestions && m.suggestions.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.suggestions.map((s, i) => <button key={i} onClick={() => envoyer(s)} style={puce}>{s}</button>)}
                </div>
              )}
              <div style={{ fontSize: cfg.taille_texte - 3, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>{m.heure.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        <div ref={finRef} />
      </div>

      <form onSubmit={e => { e.preventDefault(); envoyer(question); }} style={{ padding: '12px 16px', borderTop: '1px solid #e1e4e8', display: 'flex', gap: 8, background: cfg.bulle_couleur, flexShrink: 0 }}>
        <input ref={saisieRef} type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Posez votre question…" aria-label="Votre question" disabled={enCours} maxLength={grand}
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #e1e4e8', borderRadius: 20, fontSize: Math.max(16, cfg.taille_texte), outline: 'none', fontFamily: police }} />
        <button type="submit" disabled={enCours || !question.trim()}
          style={{ background: cfg.bouton_couleur, color: '#fff', border: 'none', borderRadius: 20, padding: '10px 16px', cursor: enCours || !question.trim() ? 'not-allowed' : 'pointer', opacity: enCours || !question.trim() ? 0.5 : 1, fontSize: cfg.taille_texte, fontFamily: police }}>
          Envoyer
        </button>
      </form>
    </div>
  );
}