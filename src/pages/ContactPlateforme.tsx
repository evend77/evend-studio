// src/pages/Contact.tsx
// Page de contact e-Vend Studio — Formulaire avec envoi via AWS SES + anti-spam

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = '/api';

interface FormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
  honeypot: string;  // ← Champ anti-bot invisible
}

export default function ContactPlateforme() {
  const navigate = useNavigate();
  const [formStartTime] = useState(Date.now()); // ← Timestamp anti-bot rapide
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    email: '',
    sujet: '',
    message: '',
    honeypot: ''      // ← Champ anti-bot
  });
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [errors, setErrors] = useState<Partial<Omit<FormData, 'honeypot'>>>({});

  usePageSeo({
    titre: 'Contactez-nous | e-Vend Studio',
    description: 'Une question ? Une suggestion ? Contactez l\'équipe e-Vend Studio. Nous vous répondrons dans les plus brefs délais.',
    url: 'https://e-vend.ca/contact',
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer la popup après 5 secondes
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Omit<FormData, 'honeypot'>> = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.sujet.trim()) {
      newErrors.sujet = 'Le sujet est requis';
    } else if (formData.sujet.trim().length < 3) {
      newErrors.sujet = 'Le sujet doit contenir au moins 3 caractères';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    } else if (formData.message.length > 5000) {
      newErrors.message = 'Le message ne peut pas dépasser 5000 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[name as keyof Omit<FormData, 'honeypot'>]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/contactPlateforme/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email,
          sujet: formData.sujet,
          message: formData.message,
          honeypot: formData.honeypot,        // ← Champ anti-bot
          form_start_time: formStartTime      // ← Timestamp anti-bot rapide
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPopupType('success');
        setPopupMessage('✅ Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
        setShowPopup(true);
        // Réinitialiser le formulaire (sauf honeypot et timestamp)
        setFormData({ 
          nom: '', 
          email: '', 
          sujet: '', 
          message: '',
          honeypot: ''
        });
      } else if (res.status === 429) {
        setPopupType('error');
        setPopupMessage(`❌ ${data.error || 'Trop de messages. Veuillez réessayer plus tard.'}`);
        setShowPopup(true);
      } else {
        setPopupType('error');
        setPopupMessage(`❌ ${data.error || 'Une erreur est survenue. Veuillez réessayer.'}`);
        setShowPopup(true);
      }
    } catch (error) {
      setPopupType('error');
      setPopupMessage('❌ Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerLoad {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes bounceUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .input-focus:focus {
          border-color: #fbbf24 !important;
          box-shadow: 0 0 0 3px rgba(251,191,36,0.1) !important;
          outline: none;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(251,191,36,0.3);
        }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmerLoad 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={s.scrollTopButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Popup de confirmation */}
      {showPopup && (
        <>
          <div style={s.popupOverlay} onClick={closePopup} />
          <div style={s.popup}>
            <button onClick={closePopup} style={s.popupClose}>✕</button>
            <div style={s.popupIcon}>
              {popupType === 'success' ? '✅' : '❌'}
            </div>
            <p style={s.popupMessage}>{popupMessage}</p>
            <button onClick={closePopup} style={s.popupButton}>
              {popupType === 'success' ? 'Fermer' : 'Réessayer'}
            </button>
          </div>
        </>
      )}

      {/* Navigation */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>e</div>
            <span style={s.logoText}>e-Vend Studio</span>
          </div>
          <button onClick={() => navigate('/')} style={s.btnBack}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Contactez-nous</h1>
          <p style={s.heroSubtitle}>
            Une question ? Une suggestion ? Notre équipe est là pour vous aider
          </p>
        </div>
      </div>

      <main style={s.main}>
        <div style={s.container}>
          <div style={s.grid}>
            {/* Formulaire */}
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Envoyez-nous un message</h2>
              <p style={s.formSubtitle}>
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
              </p>

              <form onSubmit={handleSubmit} style={s.form}>
                {/* ═══ HONEYPOT — Champ invisible anti-bot ═══ */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Nom complet <span style={s.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="input-focus"
                    style={{...s.input, ...(errors.nom && s.inputError)}}
                    placeholder="Jean Dupont"
                  />
                  {errors.nom && <span style={s.errorText}>{errors.nom}</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Adresse email <span style={s.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-focus"
                    style={{...s.input, ...(errors.email && s.inputError)}}
                    placeholder="jean.dupont@exemple.com"
                  />
                  {errors.email && <span style={s.errorText}>{errors.email}</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Sujet <span style={s.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    className="input-focus"
                    style={{...s.input, ...(errors.sujet && s.inputError)}}
                    placeholder="Question sur mon compte"
                  />
                  {errors.sujet && <span style={s.errorText}>{errors.sujet}</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Message <span style={s.required}>*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="input-focus"
                    style={{...s.textarea, ...(errors.message && s.inputError)}}
                    placeholder="Décrivez votre demande en détail..."
                    rows={6}
                  />
                  {errors.message && <span style={s.errorText}>{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  style={s.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={s.spinner} />
                  ) : (
                    'Envoyer le message →'
                  )}
                </button>
              </form>
            </div>

            {/* Informations de contact */}
            <div style={s.infoCard}>
              <div style={s.infoSection}>
                <h3 style={s.infoTitle}>📧 Email</h3>
                <a href="mailto:support@e-vend.ca" style={s.infoLink}>support@e-vend.ca</a>
              </div>

              <div style={s.infoSection}>
                <h3 style={s.infoTitle}>⏰ Horaires</h3>
                <p style={s.infoText}>Lundi au vendredi: 9h - 17h</p>
                <p style={s.infoText}>Samedi: 10h - 14h</p>
                <p style={s.infoText}>Dimanche: Fermé</p>
              </div>

              <div style={s.infoSection}>
                <h3 style={s.infoTitle}>📍 Localisation</h3>
                <p style={s.infoText}>Québec, Canada</p>
              </div>

              <div style={s.infoSection}>
                <h3 style={s.infoTitle}>⚡ Délai de réponse</h3>
                <p style={s.infoText}>Nous nous engageons à vous répondre sous 24 à 48 heures ouvrables.</p>
              </div>

              <div style={s.faqLink}>
                <p style={s.faqLinkText}>Consultez notre <button onClick={() => navigate('/faq')} style={s.faqLinkBtn}>FAQ</button> pour des réponses rapides aux questions fréquentes.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>© 2026 e-Vend Studio · Le marché d'ici, pour les gens d'ici 🇨🇦</p>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#060d1f', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' },

  scrollTopButton: {
    position: 'fixed', bottom: '30px', right: '30px', width: '48px', height: '48px',
    borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, boxShadow: '0 4px 15px rgba(251,191,36,0.3)', color: '#000',
  },

  popupOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    zIndex: 1000, animation: 'fadeUp 0.2s ease',
  },
  popup: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: '#0d1729', border: '1px solid rgba(251,191,36,0.3)',
    borderRadius: '20px', padding: '32px', minWidth: '320px', maxWidth: '450px',
    textAlign: 'center', zIndex: 1001, animation: 'popupIn 0.3s ease',
  },
  popupClose: {
    position: 'absolute', top: '12px', right: '16px',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
    fontSize: '20px', cursor: 'pointer',
  },
  popupIcon: { fontSize: '48px', marginBottom: '16px' },
  popupMessage: { fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: '24px' },
  popupButton: {
    padding: '10px 24px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
    color: '#000', cursor: 'pointer',
  },

  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  navInner: {
    maxWidth: '1200px', margin: '0 auto', padding: '0 20px',
    height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoIcon: {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#000',
  },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#fff' },
  btnBack: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '6px 0',
  },

  hero: {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(6,13,31,0) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '48px 20px',
  },
  heroInner: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' },
  heroTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)',
    fontWeight: 800, color: '#fff', marginBottom: '16px',
  },
  heroSubtitle: {
    fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
    color: 'rgba(255,255,255,0.55)', maxWidth: '600px', margin: '0 auto',
  },

  main: { padding: '48px 20px 80px' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },

  formCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' },
  formTitle: { fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#fff' },
  formSubtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  required: { color: '#fbbf24' },
  input: {
    padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    fontSize: '14px', color: '#fff', transition: 'all 0.2s',
  },
  textarea: {
    padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    fontSize: '14px', color: '#fff', fontFamily: "'DM Sans', sans-serif",
    resize: 'vertical', transition: 'all 0.2s',
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: '11px', color: '#ef4444' },
  submitBtn: {
    padding: '14px 28px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
    color: '#000', cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px',
  },
  spinner: {
    display: 'inline-block', width: '20px', height: '20px',
    border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000',
    borderRadius: '50%', animation: 'spin 0.6s linear infinite',
  },

  infoCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' },
  infoSection: { marginBottom: '32px' },
  infoTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#fbbf24' },
  infoLink: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'block' },
  infoText: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '4px' },
  faqLink: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  faqLinkText: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  faqLinkBtn: { background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif" },

  footer: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: '12px' },
};