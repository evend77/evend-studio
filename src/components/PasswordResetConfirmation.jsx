export default function PasswordResetConfirmation() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
      <h2>Mot de passe réinitialisé avec succès !</h2>
      <p>Redirection vers la page de connexion dans 5 secondes...</p>
      <button onClick={() => navigate('/login')}>
        Se connecter maintenant
      </button>
    </div>
  );
}