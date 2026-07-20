// src/components/ChatbotWidget.tsx
// Widget chatbot flottant pour les visiteurs du site d'un gestionnaire
// Version responsive : 75% écran sur mobile, dimensions normales sur PC
// N'affiche et ne fonctionne que pour LE site du gestionnaire dont l'id est
// passé en prop — jamais de mélange entre sites de gestionnaires différents.

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config/api';

interface Props { gestionnaireId: number; }

interface Message {
  id: string;
  texte: string;
  estUtilisateur: boolean;
  timestamp: Date;
  lien?: string;
  menu_choix?: { question: string; choix: { label: string; reponse: string }[] } | null;
}

interface ChatbotConfig {
  actif: boolean;
  accueil_phrases: string[];
  transition_phrases: string[];
  attente_phrases: string[];
  erreur_phrases: string[];
  fin_phrases: string[];
  suggestions_defaut: string[];
  bouton_couleur: string;
  bouton_couleur_survol: string;
  bulle_couleur: string;
  bulle_entete_couleur: string;
  texte_couleur: string;
  texte_entete_couleur: string;
  accroche_couleur: string;
  largeur_widget: number;
  hauteur_widget: number;
  largeur_min: number;
  hauteur_min: number;
  bouton_taille: number;
  bouton_icone_taille: number;
  position_widget: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
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
  logo_taille: number;
  icone_bouton: string;
  delai_reponse: number;
  animation_duree: number;
  suggerer_questions: boolean;
  afficher_bulle_bienvenue: boolean;
  delai_bulle_bienvenue: number;
  max_caracteres_question: number;
}

export default function ChatbotWidget({ gestionnaireId }: Props) {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [reponseEnCours, setReponseEnCours] = useState(false);
  const [sessionId] = useState(() => {
    const cle = `chatbot_session_id_${gestionnaireId}`;
    let id = localStorage.getItem(cle);
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(cle, id);
    }
    return id;
  });

  const messagesFinRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const debutRef = useRef(false);
  const inactifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactifTimerRef.current) {
      clearTimeout(inactifTimerRef.current);
      inactifTimerRef.current = null;
    }
    if (ouvert && !minimized && config) {
      inactifTimerRef.current = setTimeout(() => {
        setMinimized(true);
      }, 30000);
    }
  }, [ouvert, minimized, config]);

  useEffect(() => {
    if (!gestionnaireId) { setChargement(false); return; }
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/chatbot-public/config/${gestionnaireId}`);
        const data = await res.json();
        if (data.config && data.config.actif === true) {
          setConfig(data.config);
        } else {
          setConfig(null);
        }
      } catch (error) {
        console.error('Erreur chargement config chatbot:', error);
        setConfig(null);
      } finally {
        setChargement(false);
      }
    };
    fetchConfig();
  }, [gestionnaireId]);

  useEffect(() => {
    if (messagesFinRef.current) {
      messagesFinRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (ouvert && !minimized) {
      resetInactivityTimer();
    }
    return () => {
      if (inactifTimerRef.current) {
        clearTimeout(inactifTimerRef.current);
      }
    };
  }, [ouvert, minimized, messages, question, resetInactivityTimer]);

  useEffect(() => {
    if (!config || debutRef.current) return;
    debutRef.current = true;
  }, [config]);

  useEffect(() => {
    if (ouvert && config && messages.length === 0) {
      const phraseAccueil = config.accueil_phrases[Math.floor(Math.random() * config.accueil_phrases.length)];
      setMessages([{
        id: Date.now().toString(),
        texte: phraseAccueil,
        estUtilisateur: false,
        timestamp: new Date(),
      }]);
    }
  }, [ouvert, config, messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (ouvert && !minimized) {
          setMinimized(true);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ouvert, minimized]);

  const envoyerQuestion = useCallback(async (texte: string) => {
    if (!texte.trim() || reponseEnCours) return;

    const nouvelleQuestion: Message = {
      id: Date.now().toString(),
      texte: texte,
      estUtilisateur: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, nouvelleQuestion]);
    setQuestion('');
    setReponseEnCours(true);
    resetInactivityTimer();

    const phraseAttente = config?.attente_phrases[Math.floor(Math.random() * (config?.attente_phrases.length || 1))] || '🔍 Je cherche...';
    const messageAttenteId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: messageAttenteId,
      texte: phraseAttente,
      estUtilisateur: false,
      timestamp: new Date(),
    }]);

    try {
      const res = await fetch(`${API_BASE}/chatbot-public/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gestionnaire_id: gestionnaireId, question: texte, session_id: sessionId }),
      });
      const data = await res.json();

      setMessages(prev => prev.filter(m => m.id !== messageAttenteId));

      if (data.reponse || data.menu_choix) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          texte: data.reponse || '',
          estUtilisateur: false,
          timestamp: new Date(),
          lien: data.page?.lien,
          menu_choix: data.menu_choix || null,
        }]);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          texte: data.error,
          estUtilisateur: false,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== messageAttenteId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        texte: "😕 Désolé, une erreur est survenue. Veuillez réessayer.",
        estUtilisateur: false,
        timestamp: new Date(),
      }]);
    } finally {
      setReponseEnCours(false);
      resetInactivityTimer();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [reponseEnCours, config, sessionId, gestionnaireId, resetInactivityTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config && question.length > config.max_caracteres_question) {
      alert(`Maximum ${config.max_caracteres_question} caractères`);
      return;
    }
    envoyerQuestion(question);
    resetInactivityTimer();
  };

  if (chargement) return null;
  if (!config || !config.actif) return null;

  const getPositionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    switch (config.position_widget) {
      case 'bottom-right':
        styles.bottom = config.marge_bas;
        styles.right = config.marge_droite;
        break;
      case 'bottom-left':
        styles.bottom = config.marge_bas;
        styles.left = config.marge_gauche;
        break;
      case 'top-right':
        styles.top = config.marge_haut;
        styles.right = config.marge_droite;
        break;
      case 'top-left':
        styles.top = config.marge_haut;
        styles.left = config.marge_gauche;
        break;
    }
    return styles;
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .chatbot-widget-open-mobile {
            width: 75vw !important;
            max-width: 75vw !important;
            height: 75vh !important;
            max-height: 75vh !important;
            border-radius: 16px !important;
          }
          
          .chatbot-widget-open-mobile .chatbot-messages {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .chatbot-form-mobile {
            flex-direction: column !important;
            gap: 10px !important;
          }
          
          .chatbot-input-mobile {
            width: 100% !important;
          }
          
          .chatbot-button-mobile {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {!ouvert ? (
        <div
          onClick={() => {
            setOuvert(true);
            setMinimized(false);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            width: config.bouton_taille,
            height: config.bouton_taille,
            borderRadius: config.border_radius_bouton,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          {config.logo_url ? (
            <img 
              src={config.logo_url} 
              alt="Chat" 
              style={{ 
                width: config.bouton_taille, 
                height: config.bouton_taille,
                borderRadius: config.border_radius_bouton,
                objectFit: 'contain'
              }} 
            />
          ) : (
            <div
              style={{
                width: config.bouton_taille,
                height: config.bouton_taille,
                borderRadius: config.border_radius_bouton,
                backgroundColor: config.bouton_couleur,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: config.bouton_icone_taille,
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              }}
            >
              {config.icone_bouton || '💬'}
            </div>
          )}
        </div>
      ) : minimized ? (
        <div
          ref={widgetRef}
          onClick={() => {
            setMinimized(false);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            width: 220,
            backgroundColor: config.bulle_entete_couleur,
            borderRadius: config.border_radius_widget,
            color: config.texte_entete_couleur,
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: config.ombre_widget,
            zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {config.logo_url && <img src={config.logo_url} alt="Logo" style={{ width: 20, height: 20 }} />}
            <span style={{ fontSize: config.taille_texte, fontWeight: 500 }}>Assistant virtuel</span>
          </div>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setOuvert(false);
              setMinimized(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: config.texte_entete_couleur,
              cursor: 'pointer',
              fontSize: 14,
              opacity: 0.7
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          ref={widgetRef}
          className={isMobile ? "chatbot-widget-open-mobile" : ""}
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            width: isMobile ? '75vw' : config.largeur_widget,
            height: isMobile ? '75vh' : config.hauteur_widget,
            minWidth: isMobile ? 'auto' : config.largeur_min,
            minHeight: isMobile ? 'auto' : config.hauteur_min,
            backgroundColor: config.bulle_couleur,
            borderRadius: config.border_radius_widget,
            boxShadow: config.ombre_widget,
            fontFamily: config.police_texte,
            fontSize: config.taille_texte,
            color: config.texte_couleur,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: `all ${config.animation_duree}ms ease-in-out`,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: config.bulle_entete_couleur,
              color: config.texte_entete_couleur,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {config.logo_url && (
                <img src={config.logo_url} alt="Logo" style={{ width: 24, height: 24 }} />
              )}
              <span style={{ fontWeight: 600 }}>Assistant virtuel</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setMinimized(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: config.texte_entete_couleur,
                  fontSize: 18,
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
                title="Réduire"
              >
                −
              </button>
              <button
                onClick={() => setOuvert(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: config.texte_entete_couleur,
                  fontSize: 18,
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
                title="Fermer"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            className="chatbot-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: config.bulle_couleur,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.estUtilisateur ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.estUtilisateur ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: msg.estUtilisateur ? config.bouton_couleur : '#f0f2f5',
                    color: msg.estUtilisateur ? 'white' : config.texte_couleur,
                    fontSize: config.taille_texte,
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.texte}</div>
                  {/* Menu interactif — boutons cliquables */}
                  {msg.menu_choix && (
                    <div style={{ marginTop: '10px' }}>
                      {msg.menu_choix.question && (
                        <div style={{ fontSize: config.taille_texte, marginBottom: '8px', fontWeight: 500 }}>
                          {msg.menu_choix.question}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.menu_choix.choix.filter(c => c.label && c.reponse).map((choix, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // Afficher le choix comme message utilisateur puis la réponse
                              const msgUser: Message = {
                                id: Date.now().toString(),
                                texte: choix.label,
                                estUtilisateur: true,
                                timestamp: new Date(),
                              };
                              const msgBot: Message = {
                                id: (Date.now() + 1).toString(),
                                texte: choix.reponse,
                                estUtilisateur: false,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, msgUser, msgBot]);
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: `1.5px solid ${config.bouton_couleur}`,
                              background: 'white',
                              color: config.bouton_couleur,
                              fontSize: config.taille_texte - 1,
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = config.bouton_couleur;
                              (e.currentTarget as HTMLButtonElement).style.color = 'white';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'white';
                              (e.currentTarget as HTMLButtonElement).style.color = config.bouton_couleur;
                            }}
                          >
                            {choix.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.lien && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={msg.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔗 Lien cliqué:', msg.lien);
                        }}
                        style={{
                          display: 'inline-block',
                          color: msg.estUtilisateur ? '#fff' : config.bouton_couleur,
                          backgroundColor: 'transparent',
                          textDecoration: 'underline',
                          fontSize: config.taille_texte - 1,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        📖 Lire la suite →
                      </a>
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: config.taille_texte - 3,
                      opacity: 0.5,
                      marginTop: '4px',
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {reponseEnCours && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '18px',
                    backgroundColor: '#f0f2f5',
                    color: config.texte_couleur,
                  }}
                >
                  <span style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ animation: 'pulse 1.4s infinite' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.4s' }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesFinRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className={isMobile ? "chatbot-form-mobile" : ""}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e1e4e8',
              display: 'flex',
              gap: '8px',
              backgroundColor: config.bulle_couleur,
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Posez votre question..."
              disabled={reponseEnCours}
              maxLength={config.max_caracteres_question}
              className={isMobile ? "chatbot-input-mobile" : ""}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e1e4e8',
                borderRadius: '20px',
                fontSize: config.taille_texte,
                outline: 'none',
                fontFamily: config.police_texte,
              }}
            />
            <button
              type="submit"
              disabled={reponseEnCours || !question.trim()}
              className={isMobile ? "chatbot-button-mobile" : ""}
              style={{
                backgroundColor: config.bouton_couleur,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '10px 16px',
                cursor: reponseEnCours || !question.trim() ? 'not-allowed' : 'pointer',
                opacity: reponseEnCours || !question.trim() ? 0.5 : 1,
                fontSize: config.taille_texte,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!reponseEnCours && question.trim()) {
                  e.currentTarget.style.backgroundColor = config.bouton_couleur_survol;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = config.bouton_couleur;
              }}
            >
              Envoyer
            </button>
          </form>
        </div>
      )}
    </>
  );
}