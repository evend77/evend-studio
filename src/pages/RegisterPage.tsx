// src/pages/RegisterPage.tsx
// Page d'inscription vendeur e-Vend Studio

import { useState } from 'react';

const API_URL = 'http://localhost:5001';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    nom_boutique: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      console.log('Envoi de la requête à:', `${API_URL}/api/auth/register-vendeur-studio`);
      
      const response = await fetch(`${API_URL}/api/auth/register-vendeur-studio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          mot_de_passe: formData.password,
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          nom_boutique: formData.nom_boutique
        }),
      });

      console.log('Réponse reçue, status:', response.status);
      const data = await response.json();
      console.log('Données:', data);

      if (response.ok) {
        setSuccess(true);
        
        // Stocker le token et l'utilisateur dans localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Rediriger vers le dashboard après 1 seconde
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setError(data.message || data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err: any) {
      console.error('Erreur fetch:', err);
      setError(`Erreur de connexion au serveur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoMark}>e</span>
          <span style={styles.logoUnion}>⨀</span>
          <span style={styles.logoText}>VEND STUDIO</span>
        </div>

        <h1 style={styles.title}>Ouvrir une boutique</h1>
        <p style={styles.subtitle}>Rejoignez e-Vend Studio et commencez à vendre</p>

        {error && <div style={styles.error}>⚠️ {error}</div>}
        {success && <div style={styles.success}>✅ Compte créé avec succès ! Redirection vers votre tableau de bord...</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Prénom</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} style={styles.input} placeholder="Jean" required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} style={styles.input} placeholder="Dupont" required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} placeholder="vendeur@email.com" required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Téléphone (optionnel)</label>
            <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} style={styles.input} placeholder="514-123-4567" />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom de la boutique</label>
            <input type="text" name="nom_boutique" value={formData.nom_boutique} onChange={handleChange} style={styles.input} placeholder="Ma Belle Boutique" required />
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Mot de passe</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} placeholder="••••••" required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Confirmer</label>
              <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} style={styles.input} placeholder="••••••" required />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Création en cours...' : '✨ Créer ma boutique'}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="/login" style={styles.link}>← Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #060d1f, #0a1628)',
    padding: '20px',
  },
  card: {
    background: '#0b1529',
    borderRadius: '24px',
    padding: '48px',
    maxWidth: '550px',
    width: '100%',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '32px',
  },
  logoMark: {
    fontSize: '28px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #f5a623, #e8900c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoUnion: {
    fontSize: '10px',
    color: '#3b82f6',
    transform: 'translateY(-2px)',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '2px',
    color: '#fff',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: '32px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#f5a623',
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.2s',
  },
  error: {
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid #ef4444',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '20px',
    color: '#fca5a5',
    fontSize: '13px',
    textAlign: 'center',
  },
  success: {
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid #10b981',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '20px',
    color: '#6ee7b7',
    fontSize: '13px',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
  },
  link: {
    color: '#f5a623',
    fontSize: '13px',
    textDecoration: 'none',
  },
};