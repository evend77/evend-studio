// src/pages/gestionnaire/ChatbotConfig.tsx
// Configuration du chatbot du gestionnaire — e-Vend Studio
// 6 onglets : Messages, Apparence, Comportement, Sources, Réponses rapides, Blacklist
// Toutes les routes sont scopées automatiquement sur le gestionnaire connecté
// (le backend lit req.user.id — aucun id n'est jamais envoyé par ce fichier).

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../config/api';

// Types
interface ChatbotConfig {
  gestionnaire_id: number;
  actif: boolean;
  
  // Messages
  accueil_phrases: string[];
  transition_phrases: string[];
  attente_phrases: string[];
  erreur_phrases: string[];
  fin_phrases: string[];
  suggestions_defaut: string[];
  
  // Apparence - Couleurs
  bouton_couleur: string;
  bouton_couleur_survol: string;
  bulle_couleur: string;
  bulle_entete_couleur: string;
  texte_couleur: string;
  texte_entete_couleur: string;
  accroche_couleur: string;
  
  // Dimensions
  largeur_widget: number;
  hauteur_widget: number;
  largeur_min: number;
  hauteur_min: number;
  bouton_taille: number;
  bouton_icone_taille: number;
  
  // Position
  position_widget: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  marge_bas: number;
  marge_droite: number;
  marge_gauche: number;
  marge_haut: number;
  
  // Bordures
  border_radius_widget: number;
  border_radius_bouton: number;
  ombre_widget: string;
  
  // Typographie
  police_texte: string;
  taille_texte: number;
  
  // Logo
  logo_url: string | null;
  logo_taille: number;
  icone_bouton: string;
  
  // Comportement
  pages_actives: string[];
  delai_reponse: number;
  animation_duree: number;
  suggerer_questions: boolean;
  afficher_bulle_bienvenue: boolean;
  delai_bulle_bienvenue: number;
  sonore_notification: boolean;
  max_historique: number;
  max_caracteres_question: number;
  
  // Sources — quelles tables de contenu du gestionnaire le chatbot doit chercher
  sources_contenu: { pages: boolean; produits: boolean; blog: boolean };
  score_minimum: number;
  max_resultats: number;
}

// Types pour les réponses directes et blacklist
interface MenuChoix {
  question: string; // "Que voulez-vous savoir sur les plans ?"
  choix: { label: string; reponse: string }[]; // max 5 boutons
}

interface ReponseDirecte {
  id: number;
  mots_cles: string[];
  reponse: string;
  reponses?: string[]; // réponses multiples (divertissement) — une choisie au hasard
  menu_choix?: MenuChoix | null; // menu interactif (site) — boutons cliquables
  actif: boolean;
  ordre: number;
  categorie?: string; // 'site' ou 'divertissement'
}

interface BlacklistItem {
  id: number;
  mots_cles: string[];
  message_reponse: string;
  actif: boolean;
}

// Type pour les sources personnalisées
interface SourcePersonnalisee {
  id: number;
  mots_cles: string[];
  url_source: string;
  titre: string;
  description: string;
  actif: boolean;
  ordre: number;
}

type OngletType = 'messages' | 'apparence' | 'comportement' | 'sources' | 'reponses' | 'blacklist';
type SousOngletReponses = 'site' | 'divertissement';

const T = {
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  accent: '#2d6a9f',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

export default function ChatbotConfig({ gestionnaireId }: { gestionnaireId: number }) {
  const [onglet, setOnglet] = useState<OngletType>('messages');
  const [sousOngletReponses, setSousOngletReponses] = useState<SousOngletReponses>('site');
  const [rechercheReponses, setRechercheReponses] = useState<string>('');
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [reponsesDirectes, setReponsesDirectes] = useState<ReponseDirecte[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [sourcesPersonnalisees, setSourcesPersonnalisees] = useState<SourcePersonnalisee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // États temporaires pour les modifications (pas de sauvegarde auto)
  const [tempReponses, setTempReponses] = useState<ReponseDirecte[]>([]);
  const [tempBlacklist, setTempBlacklist] = useState<BlacklistItem[]>([]);
  const [tempSources, setTempSources] = useState<SourcePersonnalisee[]>([]);
  
  // États pour le texte brut des mots-clés (permet de taper des virgules)
  const [tempMotsClesReponses, setTempMotsClesReponses] = useState<{ [key: number]: string }>({});
  const [tempMotsClesBlacklist, setTempMotsClesBlacklist] = useState<{ [key: number]: string }>({});
  const [tempMotsClesSources, setTempMotsClesSources] = useState<{ [key: number]: string }>({});
  
  const token = localStorage.getItem('token');

  // Compteur pour IDs temporaires — petit entier négatif, jamais envoyé à la BD
  const tempIdRef = useRef(-1);
  function nextTempId() { return tempIdRef.current--; }

  // Charger la configuration
  useEffect(() => {
    fetchConfig();
    fetchReponsesDirectes();
    fetchBlacklist();
    fetchSourcesPersonnalisees();
  }, []);

  // Initialiser les états temporaires quand les données sont chargées
  useEffect(() => {
    if (reponsesDirectes.length > 0) {
      setTempReponses(JSON.parse(JSON.stringify(reponsesDirectes)));
    } else {
      setTempReponses([]);
    }
  }, [reponsesDirectes]);

  useEffect(() => {
    if (blacklist.length > 0) {
      setTempBlacklist(JSON.parse(JSON.stringify(blacklist)));
    } else {
      setTempBlacklist([]);
    }
  }, [blacklist]);

  useEffect(() => {
    if (sourcesPersonnalisees.length > 0) {
      setTempSources(JSON.parse(JSON.stringify(sourcesPersonnalisees)));
    } else {
      setTempSources([]);
    }
  }, [sourcesPersonnalisees]);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chatbot/config`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConfig(data.config);
    } catch (error) {
      setMessage('❌ Erreur de chargement');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReponsesDirectes() {
    try {
      const res = await fetch(`${API_BASE}/chatbot/reponses-directes`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // S'assurer que chaque réponse a une catégorie (par défaut 'site')
      const reponses = (data.reponses || []).map((r: ReponseDirecte) => ({
        ...r,
        categorie: r.categorie || 'site'
      }));
      setReponsesDirectes(reponses);
    } catch (error) {
      console.error('Erreur chargement réponses directes:', error);
    }
  }

  async function fetchBlacklist() {
    try {
      const res = await fetch(`${API_BASE}/chatbot/blacklist`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBlacklist(data.blacklist || []);
    } catch (error) {
      console.error('Erreur chargement blacklist:', error);
    }
  }

  async function fetchSourcesPersonnalisees() {
    try {
      const res = await fetch(`${API_BASE}/chatbot/sources-personnalisees`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSourcesPersonnalisees(data.sources || []);
    } catch (error) {
      console.error('Erreur chargement sources personnalisées:', error);
    }
  }

  // SAUVEGARDE TOTALE - Appelée uniquement quand on clique sur le bouton
  async function sauvegarderTout() {
    setSaving(true);
    let hasError = false;
    
    // 1. Sauvegarder la config principale
    if (config) {
      try {
        const res = await fetch(`${API_BASE}/chatbot/config`, {
          method: 'PATCH',
          credentials: 'include', headers: { Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ config }),
        });
        if (!res.ok) hasError = true;
      } catch (error) {
        hasError = true;
      }
    }
    
    // 2. Sauvegarder les réponses directes modifiées (avec catégorie)
    for (const item of tempReponses) {
      try {
        // Convertir le texte brut en tableau de mots-clés si nécessaire
        const texteBrut = tempMotsClesReponses[item.id];
        let motsCles = item.mots_cles;
        if (texteBrut !== undefined) {
          motsCles = texteBrut.split(',').map(m => m.trim()).filter(m => m !== '');
        }
        
        const itemASauvegarder = { ...item, mots_cles: motsCles, categorie: item.categorie || 'site' };
        
        if (item.id < 0) {
          await fetch(`${API_BASE}/chatbot/reponses-directes`, {
            method: 'POST',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        } else {
          await fetch(`${API_BASE}/chatbot/reponses-directes`, {
            method: 'PUT',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        }
      } catch (error) {
        hasError = true;
      }
    }
    
    // 3. Sauvegarder la blacklist modifiée
    for (const item of tempBlacklist) {
      try {
        const texteBrut = tempMotsClesBlacklist[item.id];
        let motsCles = item.mots_cles;
        if (texteBrut !== undefined) {
          motsCles = texteBrut.split(',').map(m => m.trim()).filter(m => m !== '');
        }
        
        const itemASauvegarder = { ...item, mots_cles: motsCles };
        
        if (item.id < 0) {
          await fetch(`${API_BASE}/chatbot/blacklist`, {
            method: 'POST',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        } else {
          await fetch(`${API_BASE}/chatbot/blacklist`, {
            method: 'PUT',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        }
      } catch (error) {
        hasError = true;
      }
    }
    
    // 4. Sauvegarder les sources personnalisées
    for (const item of tempSources) {
      try {
        const texteBrut = tempMotsClesSources[item.id];
        let motsCles = item.mots_cles;
        if (texteBrut !== undefined) {
          motsCles = texteBrut.split(',').map(m => m.trim()).filter(m => m !== '');
        }
        
        const itemASauvegarder = { ...item, mots_cles: motsCles };
        
        if (item.id < 0) {
          await fetch(`${API_BASE}/chatbot/sources-personnalisees`, {
            method: 'POST',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        } else {
          await fetch(`${API_BASE}/chatbot/sources-personnalisees/${item.id}`, {
            method: 'PUT',
            credentials: 'include', headers: { Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemASauvegarder),
          });
        }
      } catch (error) {
        hasError = true;
      }
    }
    
    // Recharger toutes les données
    await fetchReponsesDirectes();
    await fetchBlacklist();
    await fetchSourcesPersonnalisees();
    
    // Nettoyer les états temporaires de texte brut
    setTempMotsClesReponses({});
    setTempMotsClesBlacklist({});
    setTempMotsClesSources({});
    
    setMessage(hasError ? '❌ Erreur lors de la sauvegarde' : '✅ Toutes les modifications ont été sauvegardées !');
    setTimeout(() => setMessage(null), 3000);
    setSaving(false);
  }

  async function ajouterReponseDirecte() {
    const newId = nextTempId(); // petit entier négatif — jamais envoyé à la BD
    const newItem: ReponseDirecte = {
      id: newId,
      mots_cles: [],
      reponse: 'Nouvelle réponse...',
      actif: true,
      ordre: tempReponses.length + 1,
      categorie: sousOngletReponses // La catégorie correspond au sous-onglet actif
    };
    setTempReponses([...tempReponses, newItem]);
    setTempMotsClesReponses(prev => ({ ...prev, [newId]: '' }));
  }

  async function supprimerReponseDirecteTemp(id: number) {
    if (!window.confirm('Supprimer cette réponse ?')) return;
    if (id > 0) {
      try {
        const res = await fetch(`${API_BASE}/chatbot/reponses-directes/${id}`, {
          method: 'DELETE',
          credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMessage('✅ Réponse supprimée');
          fetchReponsesDirectes();
        }
      } catch (error) {
        setMessage('❌ Erreur');
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      setTempReponses(tempReponses.filter(item => item.id !== id));
      setTempMotsClesReponses(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }

  async function ajouterBlacklistTemp() {
    const newId = nextTempId(); // petit entier négatif — jamais envoyé à la BD
    const newItem: BlacklistItem = {
      id: newId,
      mots_cles: [],
      message_reponse: 'Veuillez rester courtois...',
      actif: true
    };
    setTempBlacklist([...tempBlacklist, newItem]);
    setTempMotsClesBlacklist(prev => ({ ...prev, [newId]: '' }));
  }

  async function supprimerBlacklistTemp(id: number) {
    if (!window.confirm('Supprimer cette entrée de la blacklist ?')) return;
    if (id > 0) {
      try {
        const res = await fetch(`${API_BASE}/chatbot/blacklist/${id}`, {
          method: 'DELETE',
          credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMessage('✅ Entrée supprimée');
          fetchBlacklist();
        }
      } catch (error) {
        setMessage('❌ Erreur');
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      setTempBlacklist(tempBlacklist.filter(item => item.id !== id));
      setTempMotsClesBlacklist(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }

  async function ajouterSourceTemp() {
    const newId = nextTempId(); // petit entier négatif — jamais envoyé à la BD
    const newItem: SourcePersonnalisee = {
      id: newId,
      mots_cles: [],
      url_source: 'https://exemple.com/page',
      titre: 'Nouvelle source',
      description: 'Description de la source...',
      actif: true,
      ordre: tempSources.length + 1
    };
    setTempSources([...tempSources, newItem]);
    setTempMotsClesSources(prev => ({ ...prev, [newId]: '' }));
  }

  async function supprimerSourceTemp(id: number) {
    if (!window.confirm('Supprimer cette source ?')) return;
    if (id > 0) {
      try {
        const res = await fetch(`${API_BASE}/chatbot/sources-personnalisees/${id}`, {
          method: 'DELETE',
          credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMessage('✅ Source supprimée');
          fetchSourcesPersonnalisees();
        }
      } catch (error) {
        setMessage('❌ Erreur');
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      setTempSources(tempSources.filter(item => item.id !== id));
      setTempMotsClesSources(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }

  // Mettre à jour une propriété
  function updateConfig<K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  }

  // Gérer les tableaux de phrases
  function updatePhrasesArray(key: keyof Pick<ChatbotConfig, 'accueil_phrases' | 'transition_phrases' | 'attente_phrases' | 'erreur_phrases' | 'fin_phrases' | 'suggestions_defaut'>, index: number, value: string) {
    if (!config) return;
    const newArray = [...config[key]];
    newArray[index] = value;
    setConfig({ ...config, [key]: newArray });
  }

  function addPhrase(key: keyof Pick<ChatbotConfig, 'accueil_phrases' | 'transition_phrases' | 'attente_phrases' | 'erreur_phrases' | 'fin_phrases' | 'suggestions_defaut'>) {
    if (!config) return;
    setConfig({ ...config, [key]: [...config[key], 'Nouvelle phrase'] });
  }

  function removePhrase(key: keyof Pick<ChatbotConfig, 'accueil_phrases' | 'transition_phrases' | 'attente_phrases' | 'erreur_phrases' | 'fin_phrases' | 'suggestions_defaut'>, index: number) {
    if (!config) return;
    const newArray = config[key].filter((_, i) => i !== index);
    setConfig({ ...config, [key]: newArray });
  }

  if (loading) {
    return (
      <div style={s.page}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={s.spinner} />
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p>Erreur de chargement de la configuration</p>
        </div>
      </div>
    );
  }

  // Fonction pour obtenir la valeur affichée des mots-clés
  function getMotsClesDisplay(item: ReponseDirecte | BlacklistItem | SourcePersonnalisee, id: number, type: 'reponse' | 'blacklist' | 'source'): string {
    let tempValue: string | undefined;
    if (type === 'reponse') tempValue = tempMotsClesReponses[id];
    else if (type === 'blacklist') tempValue = tempMotsClesBlacklist[id];
    else tempValue = tempMotsClesSources[id];
    
    if (tempValue !== undefined) return tempValue;
    return item.mots_cles.join(', ');
  }

  // Fonction pour mettre à jour le texte brut
  function updateMotsClesText(id: number, value: string, type: 'reponse' | 'blacklist' | 'source') {
    if (type === 'reponse') {
      setTempMotsClesReponses(prev => ({ ...prev, [id]: value }));
    } else if (type === 'blacklist') {
      setTempMotsClesBlacklist(prev => ({ ...prev, [id]: value }));
    } else {
      setTempMotsClesSources(prev => ({ ...prev, [id]: value }));
    }
  }

  // Filtrer les réponses par catégorie + recherche mot-clé
  const reponsesFiltrees = tempReponses.filter(r => {
    if (r.categorie !== sousOngletReponses) return false;
    if (!rechercheReponses.trim()) return true;
    const q = rechercheReponses.toLowerCase();
    const dansMots = r.mots_cles?.some(m => m.toLowerCase().includes(q));
    const dansReponse = r.reponse?.toLowerCase().includes(q);
    const dansReponses = r.reponses?.some(rep => rep.toLowerCase().includes(q));
    return dansMots || dansReponse || dansReponses;
  });

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0;transform:translateX(-8px); } to { opacity:1;transform:translateX(0); } }
        .tab-btn:hover { background: #f0f2f5; }
        .sous-tab-btn:hover { background: #f0f2f5; }
      `}</style>

      {/* En-tête */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>🤖 Configuration du Chatbot</h1>
          <p style={s.sousTitre}>
            Personnalisez l'assistant virtuel de e-Vend — Apparence, messages, comportement
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {message && (
            <span style={{
              fontSize: '13px',
              color: message.includes('✅') ? T.success : T.danger,
              background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {message}
            </span>
          )}
          <button
            style={{ ...s.btnSauvegarder, opacity: saving ? 0.5 : 1 }}
            onClick={sauvegarderTout}
            disabled={saving}
          >
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Onglets principaux */}
      <div style={s.tabs}>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'messages' ? s.tabActif : {}) }}
          onClick={() => setOnglet('messages')}
        >
          💬 Messages
        </button>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'apparence' ? s.tabActif : {}) }}
          onClick={() => setOnglet('apparence')}
        >
          🎨 Apparence
        </button>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'comportement' ? s.tabActif : {}) }}
          onClick={() => setOnglet('comportement')}
        >
          ⚙️ Comportement
        </button>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'sources' ? s.tabActif : {}) }}
          onClick={() => setOnglet('sources')}
        >
          📚 Sources
        </button>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'reponses' ? s.tabActif : {}) }}
          onClick={() => setOnglet('reponses')}
        >
          ⚡ Réponses rapides
        </button>
        <button
          className="tab-btn"
          style={{ ...s.tab, ...(onglet === 'blacklist' ? s.tabActif : {}) }}
          onClick={() => setOnglet('blacklist')}
        >
          🚫 Blacklist
        </button>
      </div>

      {/* Contenu des onglets */}
      <div style={s.card}>
        
        {/* ==================== ONGLET MESSAGES ==================== */}
        {onglet === 'messages' && (
          <div style={s.ongletContent}>
            {/* Messages d'accueil */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>👋 Messages d'accueil</h3>
              <p style={s.sectionDesc}>Premier message quand l'utilisateur ouvre le chat</p>
              {config.accueil_phrases.map((phrase, idx) => (
                <div key={`accueil-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('accueil_phrases', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('accueil_phrases', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('accueil_phrases')}>+ Ajouter une phrase d'accueil</button>
            </div>

            {/* Messages de transition */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>📝 Messages de transition</h3>
              <p style={s.sectionDesc}>Phrases avant d'afficher la réponse</p>
              {config.transition_phrases.map((phrase, idx) => (
                <div key={`transition-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('transition_phrases', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('transition_phrases', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('transition_phrases')}>+ Ajouter une phrase de transition</button>
            </div>

            {/* Messages d'attente */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>⏳ Messages d'attente</h3>
              <p style={s.sectionDesc}>Pendant que le chatbot cherche la réponse</p>
              {config.attente_phrases.map((phrase, idx) => (
                <div key={`attente-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('attente_phrases', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('attente_phrases', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('attente_phrases')}>+ Ajouter une phrase d'attente</button>
            </div>

            {/* Messages d'erreur */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>😕 Messages d'erreur</h3>
              <p style={s.sectionDesc}>Quand aucune réponse n'est trouvée</p>
              {config.erreur_phrases.map((phrase, idx) => (
                <div key={`erreur-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('erreur_phrases', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('erreur_phrases', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('erreur_phrases')}>+ Ajouter un message d'erreur</button>
            </div>

            {/* Messages de fin */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>✨ Messages de fin</h3>
              <p style={s.sectionDesc}>Après chaque réponse</p>
              {config.fin_phrases.map((phrase, idx) => (
                <div key={`fin-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('fin_phrases', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('fin_phrases', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('fin_phrases')}>+ Ajouter une phrase de fin</button>
            </div>

            {/* Suggestions par défaut */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>💡 Suggestions par défaut</h3>
              <p style={s.sectionDesc}>Questions suggérées quand aucune réponse n'est trouvée</p>
              {config.suggestions_defaut.map((phrase, idx) => (
                <div key={`suggestion-${idx}`} style={s.phraseRow}>
                  <input
                    type="text"
                    style={s.phraseInput}
                    value={phrase}
                    onChange={(e) => updatePhrasesArray('suggestions_defaut', idx, e.target.value)}
                  />
                  <button style={s.btnRemove} onClick={() => removePhrase('suggestions_defaut', idx)}>🗑️</button>
                </div>
              ))}
              <button style={s.btnAdd} onClick={() => addPhrase('suggestions_defaut')}>+ Ajouter une suggestion</button>
            </div>
          </div>
        )}

        {/* ==================== ONGLET RÉPONSES RAPIDES ==================== */}
        {onglet === 'reponses' && (
          <div style={s.ongletContent}>
            <p style={{ marginBottom: '16px', color: T.textLight, fontSize: '13px' }}>
              ⚡ Les réponses rapides sont utilisées AVANT la recherche dans les documents. 
              Si l'utilisateur tape un mot-clé, le chatbot répond directement sans chercher dans la base de données.
            </p>
            
            {/* Sous-onglets pour catégoriser les réponses */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: `1px solid ${T.border}` }}>
              <button
                className="sous-tab-btn"
                onClick={() => setSousOngletReponses('site')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  fontWeight: sousOngletReponses === 'site' ? 600 : 400,
                  cursor: 'pointer',
                  color: sousOngletReponses === 'site' ? T.accent : T.textLight,
                  borderBottom: sousOngletReponses === 'site' ? `2px solid ${T.accent}` : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                📘 Site / Fonctionnement
              </button>
              <button
                className="sous-tab-btn"
                onClick={() => setSousOngletReponses('divertissement')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  fontWeight: sousOngletReponses === 'divertissement' ? 600 : 400,
                  cursor: 'pointer',
                  color: sousOngletReponses === 'divertissement' ? T.accent : T.textLight,
                  borderBottom: sousOngletReponses === 'divertissement' ? `2px solid ${T.accent}` : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                🎉 Divertissement / Humour
              </button>
            </div>
            
            {/* Barre de recherche */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Rechercher par mot-clé ou réponse..."
                value={rechercheReponses}
                onChange={e => setRechercheReponses(e.target.value)}
                style={{ ...s.textInput, marginBottom: 0 }}
              />
              {rechercheReponses && (
                <div style={{ fontSize: '12px', color: T.textLight, marginTop: '4px' }}>
                  {reponsesFiltrees.length} résultat{reponsesFiltrees.length !== 1 ? 's' : ''} trouvé{reponsesFiltrees.length !== 1 ? 's' : ''}
                  <button onClick={() => setRechercheReponses('')} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: '12px' }}>✕ Effacer</button>
                </div>
              )}
            </div>

            <button style={{ ...s.btnAdd, marginBottom: '20px' }} onClick={ajouterReponseDirecte}>+ Ajouter une réponse rapide ({sousOngletReponses === 'site' ? 'Site' : 'Divertissement'})</button>
            
            {reponsesFiltrees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.textLight, background: '#f9fafb', borderRadius: '12px' }}>
                ⚡ Aucune réponse rapide dans cette catégorie. Cliquez sur "+ Ajouter" pour commencer.
              </div>
            ) : (
              reponsesFiltrees.map((item) => (
                <div key={item.id} style={{ ...s.section, borderBottom: `1px solid ${T.border}`, marginBottom: '16px', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <input type="checkbox" checked={item.actif} onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, actif: e.target.checked } : r))} />
                        Actif
                      </label>
                      <input type="number" value={item.ordre} onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, ordre: parseInt(e.target.value) } : r))} style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${T.border}` }} />
                      <select 
                        value={item.categorie || 'site'} 
                        onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, categorie: e.target.value } : r))}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px' }}
                      >
                        <option value="site">📘 Site / Fonctionnement</option>
                        <option value="divertissement">🎉 Divertissement / Humour</option>
                      </select>
                    </div>
                    <button style={s.btnRemove} onClick={() => supprimerReponseDirecteTemp(item.id)}>🗑️ Supprimer</button>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={s.label}>Mots-clés (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      value={getMotsClesDisplay(item, item.id, 'reponse')}
                      onChange={(e) => updateMotsClesText(item.id, e.target.value, 'reponse')}
                      style={s.textInput} 
                      placeholder="bonjour, salut, hello" 
                    />
                  </div>
                  <div>
                    <label style={s.label}>
                      {item.categorie === 'divertissement' ? 'Réponse principale (ou laissez vide si vous utilisez les variantes ci-dessous)' : 'Réponse texte (laissez vide si vous utilisez un menu interactif)'}
                    </label>
                    <textarea 
                      value={item.reponse} 
                      onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, reponse: e.target.value } : r))}
                      style={{ ...s.textInput, minHeight: '80px', fontFamily: 'inherit' }} 
                    />
                  </div>
                  {/* Menu interactif — seulement pour site/fonctionnement */}
                  {item.categorie !== 'divertissement' && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ ...s.label, color: '#15803d', marginBottom: 0 }}>🎛️ Menu interactif (boutons cliquables)</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!item.menu_choix}
                            onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? {
                              ...r,
                              menu_choix: e.target.checked ? { question: 'Que voulez-vous savoir ?', choix: [{ label: '', reponse: '' }] } : null
                            } : r))}
                          />
                          Activer le menu
                        </label>
                      </div>
                      {item.menu_choix && (
                        <>
                          <p style={{ fontSize: '11px', color: '#16a34a', marginBottom: '8px' }}>Si le menu est activé, la réponse texte ci-dessus est ignorée.</p>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ ...s.label, fontSize: '11px' }}>Question affichée au visiteur</label>
                            <input
                              type="text"
                              value={item.menu_choix.question}
                              onChange={(e) => setTempReponses(tempReponses.map(r => r.id === item.id ? {
                                ...r, menu_choix: { ...r.menu_choix!, question: e.target.value }
                              } : r))}
                              style={{ ...s.textInput, marginBottom: 0 }}
                              placeholder="Que voulez-vous savoir sur les plans ?"
                            />
                          </div>
                          <label style={{ ...s.label, fontSize: '11px' }}>Boutons (max 5)</label>
                          {item.menu_choix.choix.map((choix, idx) => (
                            <div key={idx} style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, minWidth: '60px' }}>Bouton {idx + 1}</span>
                                <input
                                  type="text"
                                  value={choix.label}
                                  onChange={(e) => {
                                    const newChoix = [...item.menu_choix!.choix];
                                    newChoix[idx] = { ...newChoix[idx], label: e.target.value };
                                    setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, menu_choix: { ...r.menu_choix!, choix: newChoix } } : r));
                                  }}
                                  style={{ ...s.textInput, marginBottom: 0, flex: 1 }}
                                  placeholder="ex: Prix des plans"
                                />
                                <button
                                  onClick={() => {
                                    const newChoix = item.menu_choix!.choix.filter((_, i) => i !== idx);
                                    setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, menu_choix: { ...r.menu_choix!, choix: newChoix } } : r));
                                  }}
                                  style={{ ...s.btnRemove, padding: '4px 8px', fontSize: '12px' }}
                                >✕</button>
                              </div>
                              <textarea
                                value={choix.reponse}
                                onChange={(e) => {
                                  const newChoix = [...item.menu_choix!.choix];
                                  newChoix[idx] = { ...newChoix[idx], reponse: e.target.value };
                                  setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, menu_choix: { ...r.menu_choix!, choix: newChoix } } : r));
                                }}
                                style={{ ...s.textInput, minHeight: '55px', fontFamily: 'inherit', marginBottom: 0, fontSize: '12px' }}
                                placeholder="Réponse affichée quand le visiteur clique ce bouton..."
                              />
                            </div>
                          ))}
                          {item.menu_choix.choix.length < 5 && (
                            <button
                              onClick={() => {
                                const newChoix = [...item.menu_choix!.choix, { label: '', reponse: '' }];
                                setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, menu_choix: { ...r.menu_choix!, choix: newChoix } } : r));
                              }}
                              style={{ fontSize: '12px', padding: '4px 12px', background: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}
                            >+ Ajouter un bouton</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {/* Réponses multiples — seulement pour divertissement */}
                  {item.categorie === 'divertissement' && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <label style={{ ...s.label, color: '#0369a1' }}>🎲 Variantes de réponses (une choisie au hasard)</label>
                      <p style={{ fontSize: '11px', color: '#0284c7', marginBottom: '8px' }}>Ajoutez plusieurs variantes pour varier les réponses. Si aucune variante, la réponse principale est utilisée.</p>
                      {(item.reponses || []).map((rep, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                          <textarea
                            value={rep}
                            onChange={(e) => {
                              const newReponses = [...(item.reponses || [])];
                              newReponses[idx] = e.target.value;
                              setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, reponses: newReponses } : r));
                            }}
                            style={{ ...s.textInput, minHeight: '60px', fontFamily: 'inherit', flex: 1, marginBottom: 0 }}
                            placeholder={`Variante ${idx + 1}...`}
                          />
                          <button
                            onClick={() => {
                              const newReponses = (item.reponses || []).filter((_, i) => i !== idx);
                              setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, reponses: newReponses } : r));
                            }}
                            style={{ ...s.btnRemove, padding: '4px 8px', fontSize: '12px' }}
                          >✕</button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newReponses = [...(item.reponses || []), ''];
                          setTempReponses(tempReponses.map(r => r.id === item.id ? { ...r, reponses: newReponses } : r));
                        }}
                        style={{ fontSize: '12px', padding: '4px 12px', background: '#0369a1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}
                      >+ Ajouter une variante</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== ONGLET BLACKLIST ==================== */}
        {onglet === 'blacklist' && (
          <div style={s.ongletContent}>
            <p style={{ marginBottom: '16px', color: T.textLight, fontSize: '13px' }}>
              🚫 Si l'utilisateur tape un mot de la blacklist, le chatbot répondra avec le message défini.
            </p>
            <button style={{ ...s.btnAdd, marginBottom: '20px' }} onClick={ajouterBlacklistTemp}>+ Ajouter un mot à la blacklist</button>
            
            {tempBlacklist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.textLight, background: '#f9fafb', borderRadius: '12px' }}>
                🚫 Aucun mot dans la blacklist. Cliquez sur "+ Ajouter" pour commencer.
              </div>
            ) : (
              tempBlacklist.map((item) => (
                <div key={item.id} style={{ ...s.section, borderBottom: `1px solid ${T.border}`, marginBottom: '16px', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <input type="checkbox" checked={item.actif} onChange={(e) => setTempBlacklist(tempBlacklist.map(b => b.id === item.id ? { ...b, actif: e.target.checked } : b))} />
                      Actif
                    </label>
                    <button style={s.btnRemove} onClick={() => supprimerBlacklistTemp(item.id)}>🗑️ Supprimer</button>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={s.label}>Mots interdits (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      value={getMotsClesDisplay(item, item.id, 'blacklist')}
                      onChange={(e) => updateMotsClesText(item.id, e.target.value, 'blacklist')}
                      style={s.textInput} 
                      placeholder="ex: insulte, gros mot, interdit" 
                    />
                  </div>
                  <div>
                    <label style={s.label}>Message de réponse</label>
                    <textarea 
                      value={item.message_reponse} 
                      onChange={(e) => setTempBlacklist(tempBlacklist.map(b => b.id === item.id ? { ...b, message_reponse: e.target.value } : b))}
                      style={{ ...s.textInput, minHeight: '80px', fontFamily: 'inherit' }} 
                      placeholder="Message envoyé quand l'utilisateur utilise un mot interdit..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== ONGLET APPARENCE ==================== */}
        {onglet === 'apparence' && (
          <div style={s.ongletContent}>
            <div style={s.twoColumns}>
              {/* Colonne gauche - Couleurs */}
              <div>
                <h3 style={s.sectionTitle}>🎨 Couleurs</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Bouton principal</label>
                  <input
                    type="color"
                    value={config.bouton_couleur}
                    onChange={(e) => updateConfig('bouton_couleur', e.target.value)}
                    style={s.colorInput}
                  />
                  <input
                    type="text"
                    value={config.bouton_couleur}
                    onChange={(e) => updateConfig('bouton_couleur', e.target.value)}
                    style={s.colorText}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Bouton au survol</label>
                  <input
                    type="color"
                    value={config.bouton_couleur_survol}
                    onChange={(e) => updateConfig('bouton_couleur_survol', e.target.value)}
                    style={s.colorInput}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Fond de la bulle</label>
                  <input
                    type="color"
                    value={config.bulle_couleur}
                    onChange={(e) => updateConfig('bulle_couleur', e.target.value)}
                    style={s.colorInput}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>En-tête de la bulle</label>
                  <input
                    type="color"
                    value={config.bulle_entete_couleur}
                    onChange={(e) => updateConfig('bulle_entete_couleur', e.target.value)}
                    style={s.colorInput}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Couleur du texte</label>
                  <input
                    type="color"
                    value={config.texte_couleur}
                    onChange={(e) => updateConfig('texte_couleur', e.target.value)}
                    style={s.colorInput}
                  />
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>📐 Dimensions du widget</h3>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Largeur (px)</label>
                    <input
                      type="number"
                      value={config.largeur_widget}
                      onChange={(e) => updateConfig('largeur_widget', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Hauteur (px)</label>
                    <input
                      type="number"
                      value={config.hauteur_widget}
                      onChange={(e) => updateConfig('hauteur_widget', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Largeur min (px)</label>
                    <input
                      type="number"
                      value={config.largeur_min}
                      onChange={(e) => updateConfig('largeur_min', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Hauteur min (px)</label>
                    <input
                      type="number"
                      value={config.hauteur_min}
                      onChange={(e) => updateConfig('hauteur_min', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>🔘 Bouton d'ouverture</h3>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Taille du bouton (px)</label>
                    <input
                      type="number"
                      value={config.bouton_taille}
                      onChange={(e) => updateConfig('bouton_taille', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Taille de l'icône (px)</label>
                    <input
                      type="number"
                      value={config.bouton_icone_taille}
                      onChange={(e) => updateConfig('bouton_icone_taille', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Icône de remplacement (emoji)</label>
                  <input
                    type="text"
                    value={config.icone_bouton}
                    onChange={(e) => updateConfig('icone_bouton', e.target.value)}
                    style={s.textInput}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Colonne droite - Position, bordures, typo */}
              <div>
                <h3 style={s.sectionTitle}>📍 Position</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Position du widget</label>
                  <select
                    value={config.position_widget}
                    onChange={(e) => updateConfig('position_widget', e.target.value as any)}
                    style={s.selectInput}
                  >
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                    <option value="top-right">Haut droite</option>
                    <option value="top-left">Haut gauche</option>
                  </select>
                </div>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Marge haut (px)</label>
                    <input
                      type="number"
                      value={config.marge_haut}
                      onChange={(e) => updateConfig('marge_haut', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Marge bas (px)</label>
                    <input
                      type="number"
                      value={config.marge_bas}
                      onChange={(e) => updateConfig('marge_bas', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Marge gauche (px)</label>
                    <input
                      type="number"
                      value={config.marge_gauche}
                      onChange={(e) => updateConfig('marge_gauche', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Marge droite (px)</label>
                    <input
                      type="number"
                      value={config.marge_droite}
                      onChange={(e) => updateConfig('marge_droite', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>🔲 Bordures & ombres</h3>
                <div style={s.fieldRow}>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Bordure widget (px)</label>
                    <input
                      type="number"
                      value={config.border_radius_widget}
                      onChange={(e) => updateConfig('border_radius_widget', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                  <div style={s.fieldGroupSmall}>
                    <label style={s.label}>Bordure bouton (px)</label>
                    <input
                      type="number"
                      value={config.border_radius_bouton}
                      onChange={(e) => updateConfig('border_radius_bouton', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Ombre (CSS)</label>
                  <input
                    type="text"
                    value={config.ombre_widget}
                    onChange={(e) => updateConfig('ombre_widget', e.target.value)}
                    style={s.textInput}
                  />
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>✍️ Typographie</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Police</label>
                  <input
                    type="text"
                    value={config.police_texte}
                    onChange={(e) => updateConfig('police_texte', e.target.value)}
                    style={s.textInput}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Taille du texte (px)</label>
                  <input
                    type="number"
                    value={config.taille_texte}
                    onChange={(e) => updateConfig('taille_texte', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>🖼️ Logo</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>URL du logo</label>
                  <input
                    type="text"
                    value={config.logo_url || ''}
                    onChange={(e) => updateConfig('logo_url', e.target.value || null)}
                    style={s.textInput}
                    placeholder="/uploads/chatbot-logo.png"
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Taille du logo (px)</label>
                  <input
                    type="number"
                    value={config.logo_taille}
                    onChange={(e) => updateConfig('logo_taille', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                </div>
              </div>
            </div>

            {/* Aperçu en direct */}
            <div style={s.previewSection}>
              <h3 style={s.sectionTitle}>👁️ Aperçu en direct</h3>
              <div style={s.previewContainer}>
                <div style={{
                  ...s.previewWidget,
                  width: config.largeur_widget,
                  backgroundColor: config.bulle_couleur,
                  borderRadius: config.border_radius_widget,
                  boxShadow: config.ombre_widget,
                  fontFamily: config.police_texte,
                  fontSize: config.taille_texte,
                  color: config.texte_couleur,
                }}>
                  <div style={{
                    ...s.previewHeader,
                    backgroundColor: config.bulle_entete_couleur,
                    color: config.texte_entete_couleur,
                    borderRadius: `${config.border_radius_widget}px ${config.border_radius_widget}px 0 0`,
                  }}>
                    {config.logo_url ? (
                      <img src={config.logo_url} alt="logo" style={{ width: 24, height: 24 }} />
                    ) : (
                      <span>🤖</span>
                    )}
                    <span style={{ fontWeight: 600 }}>Assistant e-Vend</span>
                    <span style={{ cursor: 'pointer', marginLeft: 'auto' }}>✕</span>
                  </div>
                  <div style={s.previewBody}>
                    <div style={{ background: '#f0f2f5', padding: 10, borderRadius: 12, marginBottom: 12 }}>
                      {config.accueil_phrases[0]}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Poser une question..."
                        style={{ flex: 1, padding: 8, border: `1px solid ${T.border}`, borderRadius: 20 }}
                      />
                      <button style={{ background: config.bouton_couleur, border: 'none', borderRadius: 20, padding: '8px 16px', color: '#fff' }}>
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
                <button style={{
                  ...s.previewButton,
                  backgroundColor: config.bouton_couleur,
                  width: config.bouton_taille,
                  height: config.bouton_taille,
                  borderRadius: config.border_radius_bouton,
                  fontSize: config.bouton_icone_taille,
                }}>
                  {config.icone_bouton}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ONGLET COMPORTEMENT ==================== */}
        {onglet === 'comportement' && (
          <div style={s.ongletContent}>
            <div style={s.twoColumns}>
              <div>
                <h3 style={s.sectionTitle}>📄 Pages d'affichage</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Afficher le widget sur</label>
                  <select
                    value={config.pages_actives[0]}
                    onChange={(e) => updateConfig('pages_actives', [e.target.value])}
                    style={s.selectInput}
                  >
                    <option value="toutes">Toutes les pages</option>
                    <option value="accueil">Page d'accueil uniquement</option>
                    <option value="produit">Pages produit uniquement</option>
                    <option value="aide">Pages d'aide uniquement</option>
                  </select>
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>⏱️ Timing</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Délai de réponse (ms)</label>
                  <input
                    type="number"
                    value={config.delai_reponse}
                    onChange={(e) => updateConfig('delai_reponse', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                  <p style={s.hint}>Simule un temps de réflexion</p>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Durée des animations (ms)</label>
                  <input
                    type="number"
                    value={config.animation_duree}
                    onChange={(e) => updateConfig('animation_duree', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>✨ Fonctionnalités</h3>
                <div style={s.checkboxGroup}>
                  <label style={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={config.suggerer_questions}
                      onChange={(e) => updateConfig('suggerer_questions', e.target.checked)}
                    />
                    Suggérer des questions après chaque réponse
                  </label>
                </div>
                <div style={s.checkboxGroup}>
                  <label style={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={config.afficher_bulle_bienvenue}
                      onChange={(e) => updateConfig('afficher_bulle_bienvenue', e.target.checked)}
                    />
                    Afficher une bulle de bienvenue à l'ouverture
                  </label>
                </div>
                {config.afficher_bulle_bienvenue && (
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Délai avant bulle (ms)</label>
                    <input
                      type="number"
                      value={config.delai_bulle_bienvenue}
                      onChange={(e) => updateConfig('delai_bulle_bienvenue', parseInt(e.target.value))}
                      style={s.numberInput}
                    />
                  </div>
                )}
                <div style={s.checkboxGroup}>
                  <label style={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={config.sonore_notification}
                      onChange={(e) => updateConfig('sonore_notification', e.target.checked)}
                    />
                    Son de notification pour les nouvelles réponses
                  </label>
                </div>
              </div>

              <div>
                <h3 style={s.sectionTitle}>🔒 Limitations</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Historique max (messages)</label>
                  <input
                    type="number"
                    value={config.max_historique}
                    onChange={(e) => updateConfig('max_historique', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Caractères max par question</label>
                  <input
                    type="number"
                    value={config.max_caracteres_question}
                    onChange={(e) => updateConfig('max_caracteres_question', parseInt(e.target.value))}
                    style={s.numberInput}
                  />
                </div>

                <h3 style={{ ...s.sectionTitle, marginTop: '30px' }}>🔘 État du chatbot</h3>
                <div style={s.checkboxGroup}>
                  <label style={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={config.actif}
                      onChange={(e) => updateConfig('actif', e.target.checked)}
                    />
                    Activer le chatbot sur le site
                  </label>
                </div>
                {!config.actif && (
                  <p style={{ ...s.hint, color: T.warning }}>
                    ⚠️ Le chatbot est désactivé. Il n'apparaîtra pas sur le site.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ONGLET SOURCES ==================== */}
        {onglet === 'sources' && (
          <div style={s.ongletContent}>
            {/* Section existante : Pages à interroger */}
            <div style={s.twoColumns}>
              <div>
                <h3 style={s.sectionTitle}>📚 Contenu à interroger</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Sources de connaissances</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={config.sources_contenu.pages}
                      onChange={(e) => updateConfig('sources_contenu', { ...config.sources_contenu, pages: e.target.checked })}
                    />
                    Pages du site (À propos, Contact, Politiques...)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={config.sources_contenu.produits}
                      onChange={(e) => updateConfig('sources_contenu', { ...config.sources_contenu, produits: e.target.checked })}
                    />
                    Produits (nom, description, prix)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={config.sources_contenu.blog}
                      onChange={(e) => updateConfig('sources_contenu', { ...config.sources_contenu, blog: e.target.checked })}
                    />
                    Articles de blog
                  </label>
                </div>
                <p style={s.hint}>
                  Le chatbot lira le contenu de ces sections de votre site pour répondre aux questions. Décochez ce qui ne s'applique pas à votre site (ex: Produits pour un site vitrine sans boutique).
                </p>
              </div>

              <div>
                <h3 style={s.sectionTitle}>🎯 Paramètres de recherche</h3>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Score de pertinence minimum (0-1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.score_minimum}
                    onChange={(e) => updateConfig('score_minimum', parseFloat(e.target.value))}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <input
                    type="number"
                    value={config.score_minimum}
                    onChange={(e) => updateConfig('score_minimum', parseFloat(e.target.value))}
                    style={{ ...s.numberInput, width: '80px' }}
                    step="0.05"
                    min="0"
                    max="1"
                  />
                  <p style={s.hint}>Plus le score est élevé, plus la réponse doit être précise</p>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Nombre max de résultats</label>
                  <input
                    type="number"
                    value={config.max_resultats}
                    onChange={(e) => updateConfig('max_resultats', parseInt(e.target.value))}
                    style={s.numberInput}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Section Sources personnalisées (mot-clé → URL) */}
            <div style={{ marginTop: '40px', borderTop: `2px solid ${T.border}`, paddingTop: '24px' }}>
              <h3 style={s.sectionTitle}>🎯 Sources personnalisées</h3>
              <p style={s.sectionDesc}>
                Associez des mots-clés à une URL spécifique. Séparez les mots-clés par des virgules.
              </p>
              
              <button style={{ ...s.btnAdd, marginBottom: '20px' }} onClick={ajouterSourceTemp}>
                + Ajouter une source personnalisée
              </button>
              
              {tempSources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: T.textLight, background: '#f9fafb', borderRadius: '12px' }}>
                  🎯 Aucune source personnalisée. Cliquez sur "+ Ajouter" pour créer une association mot-clé → URL.
                </div>
              ) : (
                tempSources.map((source) => (
                  <div key={source.id} style={{ ...s.section, borderBottom: `1px solid ${T.border}`, marginBottom: '16px', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <input type="checkbox" checked={source.actif} onChange={(e) => setTempSources(tempSources.map(s => s.id === source.id ? { ...s, actif: e.target.checked } : s))} />
                        Actif
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="number" 
                          value={source.ordre} 
                          onChange={(e) => setTempSources(tempSources.map(s => s.id === source.id ? { ...s, ordre: parseInt(e.target.value) } : s))} 
                          style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px' }} 
                        />
                        <button style={s.btnRemove} onClick={() => supprimerSourceTemp(source.id)}>🗑️ Supprimer</button>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={s.label}>Mots-clés (séparés par des virgules)</label>
                      <input 
                        type="text" 
                        value={getMotsClesDisplay(source, source.id, 'source')}
                        onChange={(e) => updateMotsClesText(source.id, e.target.value, 'source')}
                        style={s.textInput} 
                        placeholder="ex: livraison, horaire, cours" 
                      />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={s.label}>URL source</label>
                      <input 
                        type="url" 
                        value={source.url_source} 
                        onChange={(e) => setTempSources(tempSources.map(s => s.id === source.id ? { ...s, url_source: e.target.value } : s))}
                        style={s.textInput} 
                        placeholder="https://votresite.e-vendstudio.ca/pages/livraison" 
                      />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={s.label}>Titre (optionnel)</label>
                      <input 
                        type="text" 
                        value={source.titre} 
                        onChange={(e) => setTempSources(tempSources.map(s => s.id === source.id ? { ...s, titre: e.target.value } : s))}
                        style={s.textInput} 
                        placeholder="Titre de la source" 
                      />
                    </div>
                    
                    <div>
                      <label style={s.label}>Description (optionnel)</label>
                      <textarea 
                        value={source.description} 
                        onChange={(e) => setTempSources(tempSources.map(s => s.id === source.id ? { ...s, description: e.target.value } : s))}
                        style={{ ...s.textInput, minHeight: '60px', fontFamily: 'inherit' }} 
                        placeholder="Description de ce que contient cette source..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ ...s.infoBox, marginTop: '30px' }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                💡 <strong>Comment ça fonctionne ?</strong><br />
                1. Le chatbot vérifie d'abord la blacklist<br />
                2. Ensuite il vérifie les réponses rapides<br />
                3. Puis les sources personnalisées (si un mot-clé correspond, il donne le lien)<br />
                4. Enfin, il cherche dans vos pages d'aide normalement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '13px', color: T.textLight, margin: 0 },
  
  tabs: { display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '12px 24px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: T.textLight, borderRadius: '10px 10px 0 0', transition: 'all 0.15s' },
  tabActif: { background: T.card, color: T.accent, fontWeight: 600, borderBottom: `2px solid ${T.accent}` },
  
  card: { background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  ongletContent: { padding: '28px' },
  
  section: { marginBottom: '32px', borderBottom: `1px solid ${T.border}`, paddingBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: T.text, margin: '0 0 6px' },
  sectionDesc: { fontSize: '12px', color: T.textLight, margin: '0 0 16px' },
  
  phraseRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
  phraseInput: { flex: 1, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px' },
  
  btnAdd: { padding: '6px 14px', background: '#f0f2f5', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: T.text, marginTop: '4px' },
  btnRemove: { padding: '6px 12px', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  
  twoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  
  fieldGroup: { marginBottom: '16px' },
  fieldGroupSmall: { flex: 1, marginBottom: '16px' },
  fieldRow: { display: 'flex', gap: '20px' },
  
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: T.textLight, marginBottom: '6px' },
  
  colorInput: { width: '50px', height: '40px', border: `1px solid ${T.border}`, borderRadius: '8px', cursor: 'pointer', verticalAlign: 'middle', marginRight: '10px' },
  colorText: { width: '100px', padding: '8px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px' },
  
  numberInput: { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', width: '100%' },
  textInput: { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', width: '100%' },
  selectInput: { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', width: '100%', background: '#fff' },
  
  checkboxGroup: { marginBottom: '12px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: T.text },
  
  hint: { fontSize: '11px', color: T.textLight, marginTop: '4px' },
  
  infoBox: { background: '#e8f2fb', borderRadius: '12px', padding: '16px', borderLeft: `3px solid ${T.accent}` },
  
  previewSection: { marginTop: '40px', paddingTop: '24px', borderTop: `2px solid ${T.border}` },
  previewContainer: { position: 'relative', minHeight: '300px', background: '#f8fafc', borderRadius: '12px', padding: '20px', marginTop: '12px' },
  previewWidget: { position: 'relative', margin: '0 auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  previewHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontWeight: 500 },
  previewBody: { padding: '16px', flex: 1 },
  previewButton: { position: 'absolute', bottom: '20px', right: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  
  btnSauvegarder: { padding: '9px 22px', background: T.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' },
  
  spinner: { width: '32px', height: '32px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};