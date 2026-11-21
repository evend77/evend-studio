// CHEMIN : src/pages/gestionnaire/BoutiqueMonoProduit.tsx
// e-Vend Studio — Template Mono-produit : « Produit vendu ». Le site affiche UN seul produit ; ici le gestionnaire voit ses annonces actives
// et choisit lequel est affiché (cas typique : il vient d'un template multi-produit). Un nouveau produit se crée dans « Ajouter un produit ».
// API : GET/PUT /api/boutique/gestionnaire/mono-produit  (voir routes/boutique_mono_gestionnaire.js)
import { useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; naviguerVers?: (page: string) => void; }

export default function BoutiqueMonoProduit({ accent, isMobile, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const [etat, setEtat] = useState<{ mono: boolean; retenu_id: number | null; produits: { id: number; titre: string; prix: number; photo: string | null }[] } | null>(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [enCours, setEnCours] = useState<number | null>(null);

  const charger = () => { bq('/mono-produit').then(r => { if (r.ok && r.data) setEtat(r.data); else setErreur(messageErreur(r)); }); };
  useEffect(() => { charger(); }, []);

  const choisir = async (id: number) => {
    setErreur(''); setMessage(''); setEnCours(id);
    const r = await bq('/mono-produit', { method: 'PUT', body: { produit_id: id } });
    setEnCours(null);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    setEtat(prev => prev ? { ...prev, retenu_id: id } : prev);
    setMessage('Produit vendu mis à jour. Votre site affiche maintenant ce produit.');
    setTimeout(() => setMessage(''), 4000);
  };

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: isMobile ? 14 : 18 };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '16px 12px' : '28px 24px', fontFamily: "'Inter',sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px' }}>🎯 Produit vendu</h1>
      <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px', lineHeight: 1.6 }}>
        Votre template Mono-produit vend un seul produit (avec autant de variantes que vous voulez, jusqu'à 20). Choisissez ici celui qui s'affiche sur votre site.
      </p>
      {message && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✅ {message}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>❌ {erreur}</div>}
      {!etat && !erreur && <p style={{ color: '#888', fontSize: 14 }}>Chargement…</p>}
      {etat && !etat.mono && <div style={carte}><p style={{ margin: 0, fontSize: 14, color: '#666' }}>Cette page sert uniquement au template Mono-produit.</p></div>}
      {etat && etat.mono && etat.produits.length === 0 && (
        <div style={{ ...carte, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 14px' }}>Vous n'avez aucune annonce active. Votre site affiche « Notre produit arrive bientôt ».</p>
          {naviguerVers && <button onClick={() => naviguerVers('annonces-creer')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>➕ Ajouter mon produit</button>}
        </div>
      )}
      {etat && etat.mono && etat.produits.map(p => {
        const actif = etat.retenu_id === p.id;
        return (
          <div key={p.id} style={{ ...carte, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, borderColor: actif ? couleur : '#e5e7eb', borderWidth: actif ? 2 : 1 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>{p.photo && <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{formaterArgent(p.prix)}</div>
            </div>
            {actif
              ? <span style={{ fontSize: 12, fontWeight: 700, color: couleur, background: `${couleur}15`, borderRadius: 20, padding: '6px 12px', flexShrink: 0 }}>Affiché sur le site</span>
              : <button disabled={enCours !== null} onClick={() => choisir(p.id)} style={{ background: '#fff', color: couleur, border: `1.5px solid ${couleur}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: enCours !== null ? 'wait' : 'pointer', flexShrink: 0 }}>{enCours === p.id ? '…' : 'Vendre celui-ci'}</button>}
          </div>
        );
      })}
      {etat && etat.mono && etat.produits.length > 1 && <p style={{ fontSize: 12, color: '#888', marginTop: 12, lineHeight: 1.6 }}>Les autres annonces actives ne sont pas visibles sur le site. Vous pouvez les désactiver depuis « Liste des produits ».</p>}
    </div>
  );
}