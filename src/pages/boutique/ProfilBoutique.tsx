// CHEMIN : src/pages/boutique/ProfilBoutique.tsx
// e-Vend Studio — « Mon profil » de l'acheteur des templates boutique (solo) : informations, carnet d'adresses (plusieurs adresses de livraison
// et de facturation, comme Amazon), mot de passe. Distinct du profil du multivendeur (pages/acheteur/Profil.tsx, inchangé).
// API : /api/boutique/acheteur/<gestionnaire>/ profil, adresses, mot-de-passe

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import FormulaireAdresseBoutique, { AdresseCarnet, AdresseSaisie, adresseVide, ligneAdresse } from './FormulaireAdresseBoutique';

interface Profil { id: number; prenom: string; nom: string; email: string; telephone: string | null; infolettre: boolean; created_at: string; }
interface Props { gestionnaireId: number; isMobile?: boolean; couleurAccent?: string; onProfilMaj?: (p: { prenom: string; nom: string; telephone?: string }) => void; }

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)', green: '#10b981', red: '#ef4444', blue: '#3b82f6' };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' };
const etiq: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, color: C.textLight };

function Fenetre({ titre, couleur, clair, onFermer, children }: { titre: string; couleur: string; clair?: boolean; onFermer: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} onClick={e => { if (e.target === e.currentTarget) onFermer(); }}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: clair ? '#fffdf7' : '#1a1f2e', color: clair ? '#1c1917' : '#fff', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '18px 22px', background: couleur, borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>{titre}</h2>
          <button onClick={onFermer} aria-label="Fermer" style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export default function ProfilBoutique({ gestionnaireId: gid, isMobile, couleurAccent, onProfilMaj }: Props) {
  const accent = couleurAccent && couleurAccent !== '#fbbf24' ? couleurAccent : '#b47828';
  const [profil, setProfil] = useState<Profil | null>(null);
  const [nbCommandes, setNbCommandes] = useState(0);
  const [adresses, setAdresses] = useState<AdresseCarnet[]>([]);
  const [max, setMax] = useState(20);
  const [chargement, setChargement] = useState(true);
  const [erreurPage, setErreurPage] = useState('');
  const [modal, setModal] = useState<'profil' | 'mdp' | 'adresse' | null>(null);
  const [edition, setEdition] = useState<AdresseCarnet | null>(null);
  const [aSupprimer, setASupprimer] = useState<AdresseCarnet | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurModal, setErreurModal] = useState('');
  const [toast, setToast] = useState<{ texte: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', infolettre: false });
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });

  const minuteur = useRef<any>(null);
  const avis = (texte: string, ok = true) => { setToast({ texte, ok }); if (minuteur.current) clearTimeout(minuteur.current); minuteur.current = setTimeout(() => setToast(null), 4000); };
  useEffect(() => () => { if (minuteur.current) clearTimeout(minuteur.current); }, []);

  const charger = useCallback(async () => {
    const [p, a] = await Promise.all([ba(gid, '/profil'), ba(gid, '/adresses')]);
    if (!p.ok) { setErreurPage(messageAcheteur(p)); setChargement(false); return; }
    setProfil(p.data.profil); setNbCommandes(p.data.stats.commandes);
    if (a.ok) { setAdresses(a.data.adresses); setMax(a.data.max || 20); }
    setChargement(false);
  }, [gid]);
  useEffect(() => { charger(); }, [charger]);

  const ouvrirProfil = () => { if (!profil) return; setForm({ prenom: profil.prenom || '', nom: profil.nom || '', telephone: profil.telephone || '', infolettre: profil.infolettre }); setErreurModal(''); setModal('profil'); };
  const sauverProfil = async () => {
    setEnCours(true); setErreurModal('');
    const r = await ba(gid, '/profil', { method: 'PUT', body: form });
    setEnCours(false);
    if (!r.ok) { setErreurModal(messageAcheteur(r)); return; }
    const p = r.data.profil as Profil;
    setProfil(x => (x ? { ...x, ...p } : x));
    try { const k = `mv_compte_${gid}`; const s = localStorage.getItem(k); if (s) localStorage.setItem(k, JSON.stringify({ ...JSON.parse(s), prenom: p.prenom, nom: p.nom, telephone: p.telephone })); } catch (e) { /* stockage indisponible */ }
    if (onProfilMaj) onProfilMaj({ prenom: p.prenom, nom: p.nom, telephone: p.telephone || undefined });
    setModal(null); avis('Profil mis à jour.');
  };

  const sauverMdp = async () => {
    setErreurModal('');
    if (mdp.nouveau !== mdp.confirmation) { setErreurModal('Les mots de passe ne correspondent pas.'); return; }
    setEnCours(true);
    const r = await ba(gid, '/mot-de-passe', { method: 'PUT', body: { actuel: mdp.actuel, nouveau: mdp.nouveau } });
    setEnCours(false);
    if (!r.ok) { setErreurModal(messageAcheteur(r)); return; }
    setModal(null); setMdp({ actuel: '', nouveau: '', confirmation: '' }); avis('Mot de passe modifié.');
  };

  const sauverAdresse = async (a: AdresseSaisie) => {
    setEnCours(true); setErreurModal('');
    const r = edition ? await ba(gid, `/adresses/${edition.id}`, { method: 'PUT', body: a }) : await ba(gid, '/adresses', { method: 'POST', body: a });
    setEnCours(false);
    if (!r.ok) { setErreurModal(messageAcheteur(r)); return; }
    setModal(null); setEdition(null); avis(edition ? 'Adresse mise à jour.' : 'Adresse ajoutée.');
    charger();
  };
  const supprimer = async () => {
    if (!aSupprimer) return;
    setEnCours(true);
    const r = await ba(gid, `/adresses/${aSupprimer.id}`, { method: 'DELETE' });
    setEnCours(false); setASupprimer(null);
    if (!r.ok) { avis(messageAcheteur(r), false); return; }
    avis('Adresse supprimée.'); charger();
  };
  const principale = async (a: AdresseCarnet) => {
    const r = await ba(gid, `/adresses/${a.id}/principale`, { method: 'PUT' });
    if (!r.ok) { avis(messageAcheteur(r), false); return; }
    avis('Adresse principale mise à jour.'); charger();
  };

  if (chargement) return <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>Chargement du profil…</div>;
  if (!profil) return <div style={{ textAlign: 'center', padding: 60, color: '#f87171' }}>{erreurPage || 'Profil introuvable.'}</div>;

  const nomComplet = [profil.prenom, profil.nom].filter(Boolean).join(' ') || 'Client';
  const initiales = [(profil.prenom || '').charAt(0), (profil.nom || '').charAt(0)].filter(Boolean).join('').toUpperCase() || '?';
  const membre = profil.created_at ? new Date(profil.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const boutonPlein = (couleur: string, off?: boolean): React.CSSProperties => ({ flex: 1, padding: 12, background: off ? 'rgba(255,255,255,0.1)' : couleur, border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: off ? 'wait' : 'pointer', opacity: off ? 0.7 : 1 });
  const boutonGris: React.CSSProperties = { flex: 1, padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

  const blocAdresses = (type: 'livraison' | 'facturation', titre: string) => {
    const liste = adresses.filter(a => a.type === type);
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{titre} ({liste.length})</div>
        {liste.length === 0 && <p style={{ color: C.textLight, fontSize: 12, margin: '0 0 6px' }}>Aucune adresse de {type}.</p>}
        {liste.map(a => (
          <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${a.est_principale ? C.blue : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, position: 'relative', marginTop: a.est_principale ? 12 : 0 }}>
            {a.est_principale && <span style={{ position: 'absolute', top: -10, left: 14, background: C.blue, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Principale</span>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, minWidth: 0 }}>{a.nom}{a.libelle ? <span style={{ fontSize: 11, color: C.textLight, marginLeft: 8, fontWeight: 500 }}>{a.libelle}</span> : null}</div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => { setEdition(a); setErreurModal(''); setModal('adresse'); }} title="Modifier" style={{ background: 'none', border: 'none', color: C.blue, fontSize: 15, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => setASupprimer(a)} title="Supprimer" style={{ background: 'none', border: 'none', color: C.red, fontSize: 15, cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{ligneAdresse(a)}<br />{a.pays}</p>
            {a.telephone && <p style={{ margin: '5px 0 0', fontSize: 11, color: C.textLight }}>📞 {a.telephone}</p>}
            {!a.est_principale && <button onClick={() => principale(a)} style={{ marginTop: 10, padding: '5px 12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 20, color: C.textLight, fontSize: 11, cursor: 'pointer' }}>Définir comme principale</button>}
          </div>
        ))}
      </div>
    );
  };

  const carteInfo = (label: string, valeur: string) => (
    <div><p style={{ margin: '0 0 3px', fontSize: 10, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p><p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 500, wordBreak: 'break-word' }}>{valeur}</p></div>
  );

  return (
    <div style={{ padding: isMobile ? '0 4px' : 0 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #8b5cf6 100%)`, borderRadius: 24, padding: isMobile ? '20px 16px' : 32, marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initiales}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: '0 0 5px', fontSize: isMobile ? 20 : 30, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomComplet}</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profil.email}</p>
              {profil.telephone && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>📞 {profil.telephone}</p>}
              {membre && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Membre depuis {membre}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: isMobile ? '100%' : 'auto', flexShrink: 0 }}>
              <button onClick={ouvrirProfil} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 30, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✏️ Modifier le profil</button>
              <button onClick={() => { setMdp({ actuel: '', nouveau: '', confirmation: '' }); setErreurModal(''); setModal('mdp'); }} style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 30, color: '#fbbf24', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔑 Mot de passe</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 20 : 40, flexWrap: 'wrap' }}>
            {[{ v: nbCommandes, l: 'Commandes' }, { v: adresses.length, l: 'Adresses' }].map(s => (
              <div key={s.l}><div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff' }}>{s.v}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{s.l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>👤 Informations personnelles</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {carteInfo('Nom complet', nomComplet)}
            {carteInfo('Courriel', profil.email)}
            {carteInfo('Téléphone', profil.telephone || '—')}
            {carteInfo('Infolettre', profil.infolettre ? 'Abonné(e)' : 'Non abonné(e)')}
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 11, color: C.textLight }}>Votre courriel est votre identifiant de connexion : il ne peut pas être modifié ici.</p>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📍 Mes adresses <span style={{ fontSize: 13, color: C.textLight }}>({adresses.length}/{max})</span></h2>
            <button disabled={adresses.length >= max} onClick={() => { setEdition(null); setErreurModal(''); setModal('adresse'); }} style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.15)', border: `1px solid ${C.green}66`, borderRadius: 8, color: C.green, fontSize: 12, fontWeight: 600, cursor: adresses.length >= max ? 'not-allowed' : 'pointer', opacity: adresses.length >= max ? 0.5 : 1 }}>+ Ajouter</button>
          </div>
          {adresses.length === 0 && <p style={{ color: C.textLight, fontSize: 13, textAlign: 'center', padding: '10px 0 20px' }}>Aucune adresse enregistrée. Ajoutez-en une pour payer plus vite.</p>}
          {blocAdresses('livraison', 'Adresses de livraison')}
          {blocAdresses('facturation', 'Adresses de facturation')}
        </div>
      </div>

      {modal === 'profil' && (
        <Fenetre titre="✏️ Modifier mon profil" couleur="linear-gradient(135deg, #3b82f6, #8b5cf6)" onFermer={() => setModal(null)}>
          {erreurModal && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>⚠️ {erreurModal}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={etiq}>Prénom</label><input style={champ} value={form.prenom} maxLength={80} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label style={etiq}>Nom</label><input style={champ} value={form.nom} maxLength={80} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={etiq}>Téléphone</label><input style={champ} value={form.telephone} maxLength={30} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="418-555-0000" /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 22, fontSize: 13 }}><input type="checkbox" checked={form.infolettre} onChange={e => setForm({ ...form, infolettre: e.target.checked })} /> Recevoir l'infolettre de la boutique</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setModal(null)} style={boutonGris}>Annuler</button>
            <button onClick={sauverProfil} disabled={enCours} style={boutonPlein('linear-gradient(135deg, #3b82f6, #8b5cf6)', enCours)}>{enCours ? '⏳ Enregistrement…' : '✅ Enregistrer'}</button>
          </div>
        </Fenetre>
      )}

      {modal === 'mdp' && (
        <Fenetre titre="🔑 Changer le mot de passe" couleur="linear-gradient(135deg, #f59e0b, #d97706)" onFermer={() => setModal(null)}>
          {erreurModal && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>⚠️ {erreurModal}</div>}
          <div style={{ marginBottom: 14 }}><label style={etiq}>Mot de passe actuel</label><input type="password" style={champ} autoComplete="current-password" value={mdp.actuel} onChange={e => setMdp({ ...mdp, actuel: e.target.value })} /></div>
          <div style={{ marginBottom: 14 }}><label style={etiq}>Nouveau mot de passe</label><input type="password" style={champ} autoComplete="new-password" value={mdp.nouveau} onChange={e => setMdp({ ...mdp, nouveau: e.target.value })} /><p style={{ margin: '4px 0 0', fontSize: 11, color: C.textLight }}>Minimum 8 caractères</p></div>
          <div style={{ marginBottom: 22 }}><label style={etiq}>Confirmer le nouveau mot de passe</label><input type="password" style={champ} autoComplete="new-password" value={mdp.confirmation} onChange={e => setMdp({ ...mdp, confirmation: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') sauverMdp(); }} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setModal(null)} style={boutonGris}>Annuler</button>
            <button onClick={sauverMdp} disabled={enCours} style={boutonPlein('linear-gradient(135deg, #f59e0b, #d97706)', enCours)}>{enCours ? '⏳ Vérification…' : '🔑 Confirmer'}</button>
          </div>
        </Fenetre>
      )}

      {modal === 'adresse' && (
        <Fenetre titre={edition ? "✏️ Modifier l'adresse" : '➕ Nouvelle adresse'} couleur={`linear-gradient(135deg, ${accent}, ${accent}cc)`} clair onFermer={() => { setModal(null); setEdition(null); }}>
          <FormulaireAdresseBoutique key={edition ? edition.id : 'nouvelle'} accent={accent} titreBouton={edition ? '✅ Mettre à jour' : '✅ Ajouter'} afficherType afficherPrincipale enCours={enCours} erreur={erreurModal}
            initiale={edition ? { libelle: edition.libelle, nom: edition.nom, adresse1: edition.adresse1, adresse2: edition.adresse2, ville: edition.ville, province: edition.province, code_postal: edition.code_postal, pays: edition.pays, telephone: edition.telephone, type: edition.type, est_principale: edition.est_principale } : adresseVide('livraison', nomComplet === 'Client' ? '' : nomComplet, profil.telephone || '')}
            onValider={a => sauverAdresse(a)} onAnnuler={() => { setModal(null); setEdition(null); }} />
        </Fenetre>
      )}

      {aSupprimer && (
        <Fenetre titre="🗑️ Supprimer cette adresse ?" couleur="linear-gradient(135deg, #ef4444, #dc2626)" onFermer={() => { if (!enCours) setASupprimer(null); }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{aSupprimer.nom}{aSupprimer.libelle ? ` · ${aSupprimer.libelle}` : ''}</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textLight }}>{ligneAdresse(aSupprimer)}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setASupprimer(null)} disabled={enCours} style={boutonGris}>Annuler</button>
            <button onClick={supprimer} disabled={enCours} style={boutonPlein('linear-gradient(135deg, #ef4444, #dc2626)', enCours)}>{enCours ? '⏳…' : 'Supprimer'}</button>
          </div>
        </Fenetre>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 2000, background: toast.ok ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: '14px 20px', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{toast.ok ? '✅' : '❌'}</span><span>{toast.texte}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', marginLeft: 8, lineHeight: 1 }}>✕</button>
        </div>
      )}
    </div>
  );
}