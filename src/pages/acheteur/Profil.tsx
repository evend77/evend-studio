/**
 * Profil.tsx — src/pages/acheteur/Profil.tsx
 * Connecté à la BD via API — nom + prénom corrects
 */

import React, { useState, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// ============================================================================
// TYPES
// ============================================================================
interface Adresse {
  id: string;
  nom: string;
  ligne1: string;
  ligne2?: string;
  ville: string;
  province: string;
  codePostal: string;
  pays: string;
  telephone: string;
  estPrincipale: boolean;
  type: 'livraison' | 'facturation';
}

interface ProfilAcheteur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance?: string;
  dateInscription: string;
  langue: 'fr' | 'en';
  preferences: { newsletter: boolean; notificationsPromo: boolean; };
  statistiques: { commandes: number; avis: number; wishlist: number; };
}

const C = {
  blue: '#3b82f6', blueLight: 'rgba(59,130,246,0.15)',
  purple: '#8b5cf6', purpleLight: 'rgba(139,92,246,0.15)',
  green: '#10b981', greenLight: 'rgba(16,185,129,0.15)',
  red: '#ef4444', redLight: 'rgba(239,68,68,0.15)',
  amber: '#f59e0b',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none',
};

// ============================================================================
// HELPER — extraire prénom et nom depuis une chaîne ou l'objet user
// ============================================================================
function extraireNomPrenom(userLocal: any): { prenom: string; nom: string } {
  // Si prenom est renseigné séparément
  if (userLocal?.prenom && userLocal.prenom.trim()) {
    return { prenom: userLocal.prenom.trim(), nom: (userLocal.nom || '').trim() };
  }
  // Si nom contient "Prénom Nom" (un seul champ avec tout dedans)
  const nomComplet = (userLocal?.nom || '').trim();
  if (nomComplet.includes(' ')) {
    const parts = nomComplet.split(' ');
    const prenom = parts[0];
    const nom = parts.slice(1).join(' ');
    return { prenom, nom };
  }
  return { prenom: '', nom: nomComplet };
}

// ============================================================================
// MODAL ÉDITION PROFIL
// ============================================================================
const EditProfilModal = ({
  profil, onClose, onSave, saving,
}: {
  profil: ProfilAcheteur; onClose: () => void;
  onSave: (data: any) => Promise<void>; saving: boolean;
}) => {
  const [form, setForm] = useState({
    prenom: profil.prenom || '',
    nom: profil.nom || '',
    email: profil.email || '',
    telephone: profil.telephone || '',
    dateNaissance: profil.dateNaissance || '',
    langue: profil.langue || 'fr',
    newsletter: profil.preferences?.newsletter ?? true,
    notificationsPromo: profil.preferences?.notificationsPromo ?? true,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#1a1f2e', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '22px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#fff' }}>✏️ Modifier mon profil</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informations personnelles</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Prénom</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle} placeholder="Louis" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Nom</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} placeholder="Bossé" />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Téléphone</label>
              <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} placeholder="418-555-0000" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Langue préférée</label>
            <select value={form.langue} onChange={(e) => setForm({ ...form, langue: e.target.value as 'fr' | 'en' })} style={inputStyle}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Préférences</h3>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.newsletter} onChange={(e) => setForm({ ...form, newsletter: e.target.checked })} style={{ width: '16px', height: '16px' }} />
              <span style={{ color: '#fff', fontSize: '13px' }}>Recevoir l'infolettre e-Vend</span>
            </label>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.notificationsPromo} onChange={(e) => setForm({ ...form, notificationsPromo: e.target.checked })} style={{ width: '16px', height: '16px' }} />
              <span style={{ color: '#fff', fontSize: '13px' }}>Recevoir les offres promotionnelles</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={saving}
              style={{ flex: 1, padding: '12px', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '⏳ Enregistrement...' : '✅ Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL ÉDITION ADRESSE
// ============================================================================
const EditAdresseModal = ({
  adresse, onClose, onSave, saving,
}: {
  adresse?: Adresse; onClose: () => void;
  onSave: (data: any) => Promise<void>; saving: boolean;
}) => {
  const [form, setForm] = useState({
    nom: adresse?.nom || 'Nouvelle adresse',
    ligne1: adresse?.ligne1 || '',
    ligne2: adresse?.ligne2 || '',
    ville: adresse?.ville || '',
    province: adresse?.province || 'Quebec',
    codePostal: adresse?.codePostal || '',
    pays: adresse?.pays || 'Canada',
    telephone: adresse?.telephone || '',
    estPrincipale: adresse?.estPrincipale || false,
    type: adresse?.type || ('livraison' as 'livraison' | 'facturation'),
  });

  const provinces = ['Quebec', 'Ontario', 'Colombie-Britannique', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nouvelle-Ecosse', 'Nouveau-Brunswick', 'Terre-Neuve-et-Labrador', 'Ile-du-Prince-Edouard'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#1a1f2e', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '22px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#fff' }}>{adresse ? '✏️ Modifier l\'adresse' : '➕ Nouvelle adresse'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Nom de l'adresse</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} placeholder="Maison, Bureau..." />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} style={inputStyle}>
                <option value="livraison">Livraison</option>
                <option value="facturation">Facturation</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Adresse ligne 1</label>
            <input type="text" value={form.ligne1} onChange={(e) => setForm({ ...form, ligne1: e.target.value })} style={inputStyle} placeholder="Numero et nom de rue" />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Adresse ligne 2 (optionnel)</label>
            <input type="text" value={form.ligne2} onChange={(e) => setForm({ ...form, ligne2: e.target.value })} style={inputStyle} placeholder="App, suite, bureau..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Ville</label>
              <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Code postal</label>
              <input type="text" value={form.codePostal} onChange={(e) => setForm({ ...form, codePostal: e.target.value })} style={inputStyle} placeholder="A1A 1A1" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Province</label>
              <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} style={inputStyle}>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Telephone</label>
              <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} placeholder="418-555-0000" />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.estPrincipale} onChange={(e) => setForm({ ...form, estPrincipale: e.target.checked })} style={{ width: '16px', height: '16px' }} />
              <span style={{ color: '#fff', fontSize: '13px' }}>Definir comme adresse principale</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button
              onClick={() => onSave(form)}
              disabled={saving}
              style={{ flex: 1, padding: '12px', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '⏳...' : adresse ? '✅ Mettre a jour' : '✅ Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL CHANGER MOT DE PASSE
// ============================================================================
const ChangerMotDePasseModal = ({ userId, onClose }: { userId: number; onClose: () => void }) => {
  const [form, setForm] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [erreur, setErreur] = useState('');
  const [saving, setSaving] = useState(false);
  const [succes, setSucces] = useState(false);

  const handleSubmit = async () => {
    setErreur('');
    if (!form.actuel) { setErreur('Entrez votre mot de passe actuel.'); return; }
    if (form.nouveau.length < 8) { setErreur('Le nouveau mot de passe doit avoir au moins 8 caracteres.'); return; }
    if (form.nouveau !== form.confirmation) { setErreur('Les mots de passe ne correspondent pas.'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/acheteurs/${userId}/mot-de-passe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ motDePasseActuel: form.actuel, nouveauMotDePasse: form.nouveau }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.message || 'Erreur lors du changement.'); return; }
      setSucces(true);
      setTimeout(onClose, 2000);
    } catch {
      setErreur('Erreur reseau. Veuillez reessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#1a1f2e', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '22px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>🔑 Changer le mot de passe</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          {succes ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>✅</div>
              <p style={{ color: C.green, fontWeight: 700, fontSize: '16px', margin: 0 }}>Mot de passe change avec succes!</p>
            </div>
          ) : (
            <>
              {erreur && (
                <div style={{ background: C.redLight, border: `1px solid ${C.red}40`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: C.red, fontSize: '13px' }}>
                  ⚠️ {erreur}
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Mot de passe actuel</label>
                <input type="password" value={form.actuel} onChange={(e) => setForm({ ...form, actuel: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Nouveau mot de passe</label>
                <input type="password" value={form.nouveau} onChange={(e) => setForm({ ...form, nouveau: e.target.value })} style={inputStyle} />
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textLight }}>Minimum 8 caracteres</p>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: C.textLight }}>Confirmer le nouveau mot de passe</label>
                <input type="password" value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? '⏳ Verification...' : '🔑 Confirmer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 2000, background: type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: '14px 20px', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span>{type === 'success' ? '✅' : '❌'}</span>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '18px', cursor: 'pointer', marginLeft: '8px', lineHeight: 1 }}>✕</button>
  </div>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function Profil({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [profil, setProfil] = useState<ProfilAcheteur | null>(null);
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalProfilOuvert, setModalProfilOuvert] = useState(false);
  const [modalAdresseOuvert, setModalAdresseOuvert] = useState(false);
  const [modalMdpOuvert, setModalMdpOuvert] = useState(false);
  const [adresseEdition, setAdresseEdition] = useState<Adresse | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const userRaw = localStorage.getItem('user');
  const userLocal = userRaw ? JSON.parse(userRaw) : null;
  const userId = userLocal?.id;
  const token = localStorage.getItem('token');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Charger profil depuis la BD ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const charger = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/acheteurs/${userId}/profil`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();

          // Extraire prénom/nom correctement depuis la BD
          // La BD peut avoir prenom NULL si le compte est ancien
          let prenom = (data.prenom || '').trim();
          let nom    = (data.nom    || '').trim();

          // Si prenom est vide mais nom contient tout ("Louis Bossé"), on sépare
          if (!prenom && nom.includes(' ')) {
            const parts = nom.split(' ');
            prenom = parts[0];
            nom    = parts.slice(1).join(' ');
          }

          // Fallback sur localStorage si toujours vide
          if (!prenom && !nom) {
            const local = extraireNomPrenom(userLocal);
            prenom = local.prenom;
            nom    = local.nom;
          }

          setProfil({
            id: data.id,
            prenom,
            nom,
            email: data.email || '',
            telephone: data.telephone || '',
            dateNaissance: data.date_naissance ? data.date_naissance.split('T')[0] : '',
            dateInscription: data.date_inscription
              ? new Date(data.date_inscription).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
              : '',
            langue: data.langue || 'fr',
            preferences: {
              newsletter: data.newsletter ?? true,
              notificationsPromo: data.notifications_promo ?? true,
            },
            statistiques: {
              commandes: parseInt(data.nb_commandes) || 0,
              avis:      parseInt(data.nb_avis)      || 0,
              wishlist:  parseInt(data.nb_wishlist)  || 0,
            },
          });
        } else {
          // Fallback localStorage complet
          const local = extraireNomPrenom(userLocal);
          setProfil({
            id: userId,
            prenom: local.prenom,
            nom: local.nom,
            email: userLocal?.email || '',
            telephone: userLocal?.telephone || '',
            dateNaissance: '',
            dateInscription: '',
            langue: 'fr',
            preferences: { newsletter: true, notificationsPromo: true },
            statistiques: { commandes: 0, avis: 0, wishlist: 0 },
          });
        }

        // Charger adresses
        const adrRes = await fetch(`${API}/api/acheteurs/${userId}/adresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (adrRes.ok) {
          const adrData = await adrRes.json();
          setAdresses(adrData.map((a: any) => ({
            id: String(a.id),
            nom: a.nom || 'Adresse',
            ligne1: a.ligne1 || '',
            ligne2: a.ligne2 || '',
            ville: a.ville || '',
            province: a.province || '',
            codePostal: a.code_postal || '',
            pays: a.pays || 'Canada',
            telephone: a.telephone || '',
            estPrincipale: a.est_principale || false,
            type: (a.type === 'facturation' ? 'facturation' : 'livraison') as 'livraison' | 'facturation',
          })));
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        const local = extraireNomPrenom(userLocal);
        if (userLocal) {
          setProfil({
            id: userId,
            prenom: local.prenom,
            nom: local.nom,
            email: userLocal.email || '',
            telephone: userLocal.telephone || '',
            dateNaissance: '',
            dateInscription: '',
            langue: 'fr',
            preferences: { newsletter: true, notificationsPromo: true },
            statistiques: { commandes: 0, avis: 0, wishlist: 0 },
          });
        }
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [userId]);

  // ── Sauvegarder le profil ────────────────────────────────────────────────
  const handleSaveProfil = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/acheteurs/${userId}/profil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone || null,
          date_naissance: data.dateNaissance || null,
          langue: data.langue,
          newsletter: data.newsletter,
          notifications_promo: data.notificationsPromo,
        }),
      });

      if (res.ok) {
        // Mettre à jour l'état local immédiatement
        setProfil(prev => prev ? {
          ...prev,
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          dateNaissance: data.dateNaissance,
          langue: data.langue,
          preferences: { newsletter: data.newsletter, notificationsPromo: data.notificationsPromo },
        } : prev);

        // Mettre à jour localStorage → sidebar se rafraîchit
        const updated = { ...userLocal, prenom: data.prenom, nom: data.nom, email: data.email, telephone: data.telephone };
        localStorage.setItem('user', JSON.stringify(updated));

        setModalProfilOuvert(false);
        showToast('Profil mis a jour avec succes!');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Erreur lors de la sauvegarde.', 'error');
      }
    } catch (err) {
      console.error('Erreur save profil:', err);
      showToast('Erreur reseau. Veuillez reessayer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Sauvegarder adresse ──────────────────────────────────────────────────
  const handleSaveAdresse = async (data: any) => {
    setSaving(true);
    try {
      const payload = {
        nom: data.nom,
        ligne1: data.ligne1,
        ligne2: data.ligne2 || null,
        ville: data.ville,
        province: data.province,
        code_postal: data.codePostal,
        pays: data.pays || 'Canada',
        telephone: data.telephone || null,
        est_principale: data.estPrincipale,
        type: data.type,
      };

      let res: Response;
      if (adresseEdition) {
        res = await fetch(`${API}/api/acheteurs/${userId}/adresses/${adresseEdition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/api/acheteurs/${userId}/adresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        const norm: Adresse = {
          id: String(saved.id || adresseEdition?.id || Date.now()),
          nom: data.nom, ligne1: data.ligne1, ligne2: data.ligne2,
          ville: data.ville, province: data.province, codePostal: data.codePostal,
          pays: data.pays || 'Canada', telephone: data.telephone,
          estPrincipale: data.estPrincipale, type: data.type,
        };
        if (adresseEdition) {
          // Si on passe en principale, désactiver les autres
          setAdresses(prev => prev.map(a => data.estPrincipale
            ? (a.id === adresseEdition.id ? norm : { ...a, estPrincipale: false })
            : (a.id === adresseEdition.id ? norm : a)
          ));
          showToast('Adresse mise a jour!');
        } else {
          setAdresses(prev => data.estPrincipale
            ? [...prev.map(a => ({ ...a, estPrincipale: false })), norm]
            : [...prev, norm]
          );
          showToast('Adresse ajoutee!');
        }
      } else {
        showToast('Erreur lors de la sauvegarde de l\'adresse.', 'error');
      }
    } catch (err) {
      console.error('Erreur save adresse:', err);
      showToast('Erreur reseau.', 'error');
    } finally {
      setSaving(false);
      setModalAdresseOuvert(false);
      setAdresseEdition(undefined);
    }
  };

  // ── Supprimer adresse ────────────────────────────────────────────────────
  const handleSupprimerAdresse = async (id: string) => {
    if (!window.confirm('Supprimer cette adresse?')) return;
    try {
      await fetch(`${API}/api/acheteurs/${userId}/adresses/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setAdresses(prev => prev.filter(a => a.id !== id));
      showToast('Adresse supprimee.');
    } catch {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  // ── Définir principale ───────────────────────────────────────────────────
  const handleSetPrincipale = async (id: string) => {
    try {
      await fetch(`${API}/api/acheteurs/${userId}/adresses/${id}/principale`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      setAdresses(prev => prev.map(a => ({ ...a, estPrincipale: a.id === id })));
      showToast('Adresse principale mise a jour!');
    } catch {
      setAdresses(prev => prev.map(a => ({ ...a, estPrincipale: a.id === id })));
    }
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid #3b82f6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profil) return null;

  const nomComplet = [profil.prenom, profil.nom].filter(Boolean).join(' ') || 'Acheteur';
  const initiales  = [(profil.prenom || '').charAt(0), (profil.nom || '').charAt(0)].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Bannière ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '24px', padding: '32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initiales}
            </div>

            {/* Nom + email */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: '0 0 5px', fontSize: '30px', fontWeight: 800, color: '#fff' }}>
                {nomComplet}
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
                {profil.email}
                {profil.telephone && <span style={{ marginLeft: '16px' }}>📞 {profil.telephone}</span>}
              </p>
              {profil.dateInscription && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Membre depuis {profil.dateInscription}
                </p>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => setModalProfilOuvert(true)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '30px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                ✏️ Modifier le profil
              </button>
              <button onClick={() => setModalMdpOuvert(true)} style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '30px', color: '#fbbf24', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                🔑 Mot de passe
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {[
              { v: profil.statistiques.commandes, l: 'Commandes' },
              { v: profil.statistiques.avis,      l: 'Avis' },
              { v: profil.statistiques.wishlist,   l: 'Wishlist' },
              { v: adresses.length,                l: 'Adresses' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{s.v}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grille infos + adresses ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Informations personnelles */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: '#fff' }}>👤 Informations personnelles</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'NOM COMPLET',        valeur: nomComplet },
              { label: 'EMAIL',              valeur: profil.email },
              { label: 'TELEPHONE',          valeur: profil.telephone || '—' },
              { label: 'DATE DE NAISSANCE',  valeur: profil.dateNaissance
                  ? new Date(profil.dateNaissance + 'T00:00:00').toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Non renseignee' },
              { label: 'LANGUE PREFEREE',    valeur: profil.langue === 'fr' ? 'Francais' : 'English' },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ margin: '0 0 3px', fontSize: '10px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 500 }}>{item.valeur}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Adresses */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
              📍 Mes adresses <span style={{ fontSize: '13px', color: C.textLight }}>({adresses.length})</span>
            </h2>
            <button onClick={() => { setAdresseEdition(undefined); setModalAdresseOuvert(true); }} style={{ padding: '7px 14px', background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: '8px', color: C.green, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              + Ajouter
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {adresses.length === 0 && (
              <p style={{ color: C.textLight, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Aucune adresse enregistree.</p>
            )}
            {adresses.map(adr => (
              <div key={adr.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${adr.estPrincipale ? C.blue : C.border}`, borderRadius: '14px', padding: '14px', position: 'relative', marginTop: adr.estPrincipale ? '10px' : '0' }}>
                {adr.estPrincipale && (
                  <span style={{ position: 'absolute', top: '-10px', left: '14px', background: C.blue, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                    Principale
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{adr.nom}</span>
                    <span style={{ fontSize: '11px', color: C.textLight, marginLeft: '8px' }}>{adr.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setAdresseEdition(adr); setModalAdresseOuvert(true); }} style={{ background: 'none', border: 'none', color: C.blue, fontSize: '15px', cursor: 'pointer' }} title="Modifier">✏️</button>
                    {!adr.estPrincipale && (
                      <button onClick={() => handleSupprimerAdresse(adr.id)} style={{ background: 'none', border: 'none', color: C.red, fontSize: '15px', cursor: 'pointer' }} title="Supprimer">🗑️</button>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7' }}>
                  {adr.ligne1}{adr.ligne2 && `, ${adr.ligne2}`}<br />
                  {adr.ville}, {adr.province} {adr.codePostal}<br />
                  {adr.pays}
                </p>
                {adr.telephone && <p style={{ margin: '5px 0 0', fontSize: '11px', color: C.textLight }}>📞 {adr.telephone}</p>}
                {!adr.estPrincipale && (
                  <button onClick={() => handleSetPrincipale(adr.id)} style={{ marginTop: '10px', padding: '5px 12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '20px', color: C.textLight, fontSize: '11px', cursor: 'pointer' }}>
                    Definir comme principale
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Préférences ──────────────────────────────────────────────────── */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 700, color: '#fff' }}>⚙️ Preferences de communication</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { icon: '📧', titre: 'Infolettre',              desc: 'Nouveautes et conseils',   actif: profil.preferences.newsletter },
            { icon: '🎁', titre: 'Offres promotionnelles',  desc: 'Offres exclusives',         actif: profil.preferences.notificationsPromo },
          ].map((pref, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{pref.icon}</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{pref.titre}</span>
              </div>
              <p style={{ margin: '0 0 10px 30px', fontSize: '12px', color: C.textLight }}>{pref.desc}</p>
              <div style={{ marginLeft: '30px' }}>
                <span style={{ padding: '4px 12px', background: pref.actif ? C.greenLight : C.redLight, color: pref.actif ? C.green : C.red, borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  {pref.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: '12px', color: C.textLight }}>
          Pour modifier, cliquez sur ✏️ Modifier le profil.
        </p>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {modalProfilOuvert && (
        <EditProfilModal
          profil={profil}
          onClose={() => setModalProfilOuvert(false)}
          onSave={handleSaveProfil}
          saving={saving}
        />
      )}
      {modalAdresseOuvert && (
        <EditAdresseModal
          adresse={adresseEdition}
          onClose={() => { setModalAdresseOuvert(false); setAdresseEdition(undefined); }}
          onSave={handleSaveAdresse}
          saving={saving}
        />
      )}
      {modalMdpOuvert && (
        <ChangerMotDePasseModal userId={userId} onClose={() => setModalMdpOuvert(false)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
