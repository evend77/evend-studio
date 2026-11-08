// CHEMIN : src/templates/multivendeur/MVChatbot.tsx
// e-Vend Studio — Add-on « Chatbot » (sans IA) pour le template Multi-vendeur Premium.
// Même fonctionnement que le chatbot des autres templates (réponses rapides, sources personnalisées, recherche dans le site),
// avec deux différences propres à la marketplace :
//  • les liens de réponse (produit, boutique, FAQ, blog, document, politique) s'ouvrent DANS le site, sans fermer la conversation ;
//  • le widget n'est monté que si l'add-on est actif (voir TemplateMultiVendeurPremium).
// Toutes les requêtes portent l'id de CETTE marketplace : jamais de mélange entre marketplaces.

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import type { NavMVPremium } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface Props {
  gestionnaireId: number | string;
  pageActuelle: string;   // page du site affichée (réglage « Afficher le widget sur »)
  naviguer: (dest: NavMVPremium) => void;
}

interface LienReponse { label: string; nav: NavMVPremium; }

interface Message {
  id: string;
  texte: string;
  estUtilisateur: boolean;
  timestamp: Date;
  lien?: string;
  liens?: LienReponse[];
  menu_choix?: { question: string; choix: { label: string; reponse: string }[] } | null;
}

interface ConfigChatbot {
  actif: boolean;
  accueil_phrases: string[];
  attente_phrases: string[];
  bouton_couleur: string;
  bouton_couleur_survol: string;
  bulle_couleur: string;
  bulle_entete_couleur: string;
  texte_couleur: string;
  texte_entete_couleur: string;
  largeur_widget: number;
  hauteur_widget: number;
  largeur_min: number;
  hauteur_min: number;
  bouton_taille: number;
  bouton_icone_taille: number;
  position_widget: string;
  marge_bas: number;
  marge_droite: number;
  marge_gauche: number;
  marge_haut: number;
  border_radius_widget: number;
  border_radius_bouton: number;
  ombre_widget: string;
  police_texte: string;
  taille_texte: number;
  logo_url: string | null;
  icone_bouton: string;
  animation_duree: number;
  max_caracteres_question: number;
  pages_actives?: string[];
}

// Les anciennes marketplaces ont « bas-droite » en base, les réglages enregistrés depuis la page de config ont « bottom-right » : on accepte les deux.
function coinDe(position: string): 'bas-droite' | 'bas-gauche' | 'haut-droite' | 'haut-gauche' {
  const v = String(position || '').toLowerCase();
  const bas = !(v.includes('haut') || v.includes('top'));
  const gauche = v.includes('gauche') || v.includes('left');
  return `${bas ? 'bas' : 'haut'}-${gauche ? 'gauche' : 'droite'}` as 'bas-droite' | 'bas-gauche' | 'haut-droite' | 'haut-gauche';
}

// Mini mise en forme des réponses personnalisées : **gras** et [texte](lien). Rien d'autre n'est interprété (pas de HTML).
function rendreTexte(texte: string, couleurLien: string): ReactNode[] {
  return texte.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((morceau, i) => {
    const gras = morceau.match(/^\*\*([^*]+)\*\*$/);
    if (gras) return <strong key={i}>{gras[1]}</strong>;
    const lien = morceau.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (lien) {
      if (/^(https?:\/\/|\/(?!\/))/i.test(lien[2])) {
        return <a key={i} href={lien[2]} target="_blank" rel="noopener noreferrer" style={{ color: couleurLien, textDecoration: 'underline', fontWeight: 600 }}>{lien[1]}</a>;
      }
      return <span key={i}>{lien[1]}</span>;
    }
    return <span key={i}>{morceau}</span>;
  });
}

const ICONE_LIEN: Record<string, string> = { produit: '🛍️', boutique: '🏪', faq: '❓', blog: '📝', document: '📄', politique: '📜' };
const court = (t: string, max: number) => (t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t);

export default function MVChatbot({ gestionnaireId, pageActuelle, naviguer }: Props) {
  const [config, setConfig] = useState<ConfigChatbot | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [reponseEnCours, setReponseEnCours] = useState(false);
  const [sessionId] = useState(() => {
    const cle = `chatbot_session_id_${gestionnaireId}`;
    try {
      let id = localStorage.getItem(cle);
      if (!id) {
        id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem(cle, id);
      }
      return id;
    } catch {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);   // stockage indisponible : session le temps de la visite
    }
  });

  const messagesFinRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const inactifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactifTimerRef.current) {
      clearTimeout(inactifTimerRef.current);
      inactifTimerRef.current = null;
    }
    if (ouvert && !minimized && config) {
      inactifTimerRef.current = setTimeout(() => setMinimized(true), 30000);
    }
  }, [ouvert, minimized, config]);

  useEffect(() => {
    if (!gestionnaireId) { setChargement(false); return; }
    let actif = true;
    fetch(`${API_BASE}/chatbot-public/config/${gestionnaireId}`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (actif) setConfig(data?.config && data.config.actif === true ? data.config : null); })
      .catch(() => { if (actif) setConfig(null); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [gestionnaireId]);

  useEffect(() => {
    messagesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (ouvert && !minimized) resetInactivityTimer();
    return () => { if (inactifTimerRef.current) clearTimeout(inactifTimerRef.current); };
  }, [ouvert, minimized, messages, question, resetInactivityTimer]);

  useEffect(() => {
    if (ouvert && config && messages.length === 0) {
      const phrases = config.accueil_phrases?.length ? config.accueil_phrases : ['Bonjour! Comment puis-je vous aider?'];
      setMessages([{
        id: Date.now().toString(),
        texte: phrases[Math.floor(Math.random() * phrases.length)],
        estUtilisateur: false,
        timestamp: new Date(),
      }]);
    }
  }, [ouvert, config, messages.length]);

  useEffect(() => {
    const clicExterieur = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node) && ouvert && !minimized) setMinimized(true);
    };
    document.addEventListener('mousedown', clicExterieur);
    return () => document.removeEventListener('mousedown', clicExterieur);
  }, [ouvert, minimized]);

  const envoyerQuestion = useCallback(async (texte: string) => {
    if (!texte.trim() || reponseEnCours) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), texte, estUtilisateur: true, timestamp: new Date() }]);
    setQuestion('');
    setReponseEnCours(true);
    resetInactivityTimer();

    const attentes = config?.attente_phrases?.length ? config.attente_phrases : ['🔍 Je cherche...'];
    const messageAttenteId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: messageAttenteId,
      texte: attentes[Math.floor(Math.random() * attentes.length)],
      estUtilisateur: false,
      timestamp: new Date(),
    }]);

    try {
      const res = await fetch(`${API_BASE}/chatbot-public/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gestionnaire_id: Number(gestionnaireId), question: texte, session_id: sessionId }),
      });
      const data = await res.json();

      setMessages(prev => prev.filter(m => m.id !== messageAttenteId));

      if (data.reponse || data.menu_choix) {
        const vus = new Set<string>();
        const liens: LienReponse[] = [];
        for (const p of (Array.isArray(data.pages) ? data.pages : [])) {
          if (!p?.nav?.page) continue;
          const label = `${ICONE_LIEN[p.type] || '📄'} Voir « ${court(String(p.pageTitre || p.titre || ''), 30)} »`;
          const cle = label + JSON.stringify(p.nav);
          if (vus.has(cle)) continue;
          vus.add(cle);
          liens.push({ label, nav: p.nav });
        }
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          texte: data.reponse || '',
          estUtilisateur: false,
          timestamp: new Date(),
          lien: data.page?.lien,
          liens,
          menu_choix: data.menu_choix || null,
        }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), texte: data.error, estUtilisateur: false, timestamp: new Date() }]);
      }
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== messageAttenteId),
        { id: Date.now().toString(), texte: '😕 Désolé, une erreur est survenue. Veuillez réessayer.', estUtilisateur: false, timestamp: new Date() },
      ]);
    } finally {
      setReponseEnCours(false);
      resetInactivityTimer();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [reponseEnCours, config, sessionId, gestionnaireId, resetInactivityTimer]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    envoyerQuestion(question);
  };

  const ouvrirLien = (nav: NavMVPremium) => {
    naviguer(nav);        // la page du site change, la conversation reste là
    setMinimized(true);   // le widget se réduit pour laisser voir la page
  };

  if (chargement) return null;
  if (!config || !config.actif) return null;

  // Réglage « Afficher le widget sur » (Config → Comportement) : toutes les pages, accueil, pages produit ou pages d'aide
  const choixPages = config.pages_actives?.[0] || 'toutes';
  const visibleIci = choixPages === 'toutes'
    || (choixPages === 'accueil' && pageActuelle === 'accueil')
    || (choixPages === 'produit' && pageActuelle === 'produit')
    || (choixPages === 'aide' && ['documents', 'politique', 'contact'].includes(pageActuelle));
  if (!visibleIci) return null;

  const coin = coinDe(config.position_widget);
  const positionStyles: CSSProperties = {};
  if (coin.startsWith('bas')) positionStyles.bottom = config.marge_bas; else positionStyles.top = config.marge_haut;
  if (coin.endsWith('gauche')) positionStyles.left = config.marge_gauche; else positionStyles.right = config.marge_droite;

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const cEntete = config.texte_entete_couleur;

  return (
    <>
      <style>{`
        @keyframes mvChatPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @media (max-width: 768px) {
          .mvchat-ouvert { width: 75vw !important; max-width: 75vw !important; height: 75vh !important; max-height: 75vh !important; border-radius: 16px !important; }
          .mvchat-ouvert .mvchat-messages { overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; }
          .mvchat-form { flex-direction: column !important; gap: 10px !important; }
          .mvchat-input { width: 100% !important; }
          .mvchat-envoyer { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      {!ouvert ? (
        <div
          role="button"
          aria-label="Ouvrir l'assistant virtuel"
          onClick={() => { setOuvert(true); setMinimized(false); setTimeout(() => inputRef.current?.focus(), 200); }}
          style={{
            position: 'fixed', ...positionStyles,
            width: config.bouton_taille, height: config.bouton_taille,
            borderRadius: config.border_radius_bouton, backgroundColor: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          {config.logo_url ? (
            <img src={config.logo_url} alt="Chat" style={{ width: config.bouton_taille, height: config.bouton_taille, borderRadius: config.border_radius_bouton, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: config.bouton_taille, height: config.bouton_taille, borderRadius: config.border_radius_bouton,
              backgroundColor: config.bouton_couleur, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: config.bouton_icone_taille, boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}>
              {config.icone_bouton || '💬'}
            </div>
          )}
        </div>
      ) : minimized ? (
        <div
          ref={widgetRef}
          onClick={() => { setMinimized(false); setTimeout(() => inputRef.current?.focus(), 200); }}
          style={{
            position: 'fixed', ...positionStyles, width: 220,
            backgroundColor: config.bulle_entete_couleur, borderRadius: config.border_radius_widget, color: cEntete,
            padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: config.ombre_widget, zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {config.logo_url && <img src={config.logo_url} alt="Logo" style={{ width: 20, height: 20 }} />}
            <span style={{ fontSize: config.taille_texte, fontWeight: 500 }}>Assistant virtuel</span>
          </div>
          <button
            aria-label="Fermer"
            onClick={(e) => { e.stopPropagation(); setOuvert(false); setMinimized(false); }}
            style={{ background: 'none', border: 'none', color: cEntete, cursor: 'pointer', fontSize: 14, opacity: 0.7 }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          ref={widgetRef}
          className={isMobile ? 'mvchat-ouvert' : ''}
          style={{
            position: 'fixed', ...positionStyles,
            width: isMobile ? '75vw' : config.largeur_widget,
            height: isMobile ? '75vh' : config.hauteur_widget,
            minWidth: isMobile ? 'auto' : config.largeur_min,
            minHeight: isMobile ? 'auto' : config.hauteur_min,
            backgroundColor: config.bulle_couleur, borderRadius: config.border_radius_widget, boxShadow: config.ombre_widget,
            fontFamily: config.police_texte, fontSize: config.taille_texte, color: config.texte_couleur,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: `all ${config.animation_duree}ms ease-in-out`, zIndex: 9999,
          }}
        >
          <div style={{
            backgroundColor: config.bulle_entete_couleur, color: cEntete, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {config.logo_url && <img src={config.logo_url} alt="Logo" style={{ width: 24, height: 24 }} />}
              <span style={{ fontWeight: 600 }}>Assistant virtuel</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMinimized(true)} title="Réduire" aria-label="Réduire"
                style={{ background: 'none', border: 'none', color: cEntete, fontSize: 18, cursor: 'pointer', opacity: 0.8 }}>−</button>
              <button onClick={() => setOuvert(false)} title="Fermer" aria-label="Fermer"
                style={{ background: 'none', border: 'none', color: cEntete, fontSize: 18, cursor: 'pointer', opacity: 0.8 }}>✕</button>
            </div>
          </div>

          <div
            className="mvchat-messages"
            style={{
              flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
              backgroundColor: config.bulle_couleur, WebkitOverflowScrolling: 'touch',
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.estUtilisateur ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px',
                  borderRadius: msg.estUtilisateur ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.estUtilisateur ? config.bouton_couleur : '#f0f2f5',
                  color: msg.estUtilisateur ? 'white' : config.texte_couleur,
                  fontSize: config.taille_texte, wordBreak: 'break-word', position: 'relative',
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.estUtilisateur ? msg.texte : rendreTexte(msg.texte, config.bouton_couleur)}</div>

                  {/* Menu interactif — boutons cliquables */}
                  {msg.menu_choix && (
                    <div style={{ marginTop: 10 }}>
                      {msg.menu_choix.question && (
                        <div style={{ fontSize: config.taille_texte, marginBottom: 8, fontWeight: 500 }}>{msg.menu_choix.question}</div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {msg.menu_choix.choix.filter(c => c.label && c.reponse).map((choix, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const maintenant = Date.now();
                              setMessages(prev => [
                                ...prev,
                                { id: maintenant.toString(), texte: choix.label, estUtilisateur: true, timestamp: new Date() },
                                { id: (maintenant + 1).toString(), texte: choix.reponse, estUtilisateur: false, timestamp: new Date() },
                              ]);
                            }}
                            style={{
                              textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${config.bouton_couleur}`,
                              background: 'white', color: config.bouton_couleur, fontSize: config.taille_texte - 1,
                              cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = config.bouton_couleur; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = config.bouton_couleur; }}
                          >
                            {choix.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Liens vers les pages du site (produit, boutique, FAQ, blog, document, politique) */}
                  {msg.liens && msg.liens.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.liens.map((l, idx) => (
                        <button
                          key={idx}
                          onClick={() => ouvrirLien(l.nav)}
                          style={{
                            textAlign: 'left', padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${config.bouton_couleur}`,
                            background: 'white', color: config.bouton_couleur, fontSize: config.taille_texte - 1, cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.lien && !msg.texte.includes(msg.lien) && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={msg.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block', color: config.bouton_couleur, textDecoration: 'underline',
                          fontSize: config.taille_texte - 1, fontWeight: 'bold', padding: '4px 8px', borderRadius: 4,
                        }}
                      >
                        📖 Lire la suite →
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize: config.taille_texte - 3, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {reponseEnCours && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 12px', borderRadius: 18, backgroundColor: '#f0f2f5', color: config.texte_couleur }}>
                  <span style={{ display: 'flex', gap: 4 }}>
                    <span style={{ animation: 'mvChatPulse 1.4s infinite' }}>●</span>
                    <span style={{ animation: 'mvChatPulse 1.4s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'mvChatPulse 1.4s infinite 0.4s' }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesFinRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className={isMobile ? 'mvchat-form' : ''}
            style={{ padding: '12px 16px', borderTop: '1px solid #e1e4e8', display: 'flex', gap: 8, backgroundColor: config.bulle_couleur, flexShrink: 0 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Posez votre question..."
              disabled={reponseEnCours}
              maxLength={config.max_caracteres_question}
              className={isMobile ? 'mvchat-input' : ''}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #e1e4e8', borderRadius: 20, fontSize: config.taille_texte, outline: 'none', fontFamily: config.police_texte }}
            />
            <button
              type="submit"
              disabled={reponseEnCours || !question.trim()}
              className={isMobile ? 'mvchat-envoyer' : ''}
              style={{
                backgroundColor: config.bouton_couleur, color: 'white', border: 'none', borderRadius: 20, padding: '10px 16px',
                cursor: reponseEnCours || !question.trim() ? 'not-allowed' : 'pointer',
                opacity: reponseEnCours || !question.trim() ? 0.5 : 1, fontSize: config.taille_texte, transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { if (!reponseEnCours && question.trim()) e.currentTarget.style.backgroundColor = config.bouton_couleur_survol; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = config.bouton_couleur; }}
            >
              Envoyer
            </button>
          </form>
        </div>
      )}
    </>
  );
}