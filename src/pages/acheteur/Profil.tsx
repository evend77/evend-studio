// CHEMIN : src/pages/acheteur/Profil.tsx
// e-Vend Studio — Dashboard acheteur : mon profil, mes adresses, mot de passe
// Adapté de Profil.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET/PUT /api/acheteur/:gid/profil · PUT /profil/mot-de-passe · GET/POST/PUT/DELETE /adresses

import React, { useState, useEffect, useCallback } from 'react';

const API = '/api';

interface ProfilData {
  id: number; prenom: string; nom: string; email: string; telephone: string | null;
  infolettre: boolean | null; notifications_promo: boolean; langue: 'fr' | 'en'; date_naissance: string | null;
  created_at: string; nb_commandes: string | number; nb_avis: string | number; nb_wishlist: string | number;
}
interface Adresse {
  id: number; nom: string; type: 'livraison' | 'facturation'; ligne1: string; ligne2: string | null; ville: string;
  province: string; code_postal: string; pays: string; telephone: string | null; est_principale: boolean;
}
type FormAdresse = Omit<Adresse, 'id'> & { id?: number };

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  onProfilMaj?: (p: { prenom: string; nom: string; email: string }) => void; // met à jour la barre latérale
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)', green: '#10b981', red: '#ef4444' };
const PROVINCES = ['QC', 'ON', 'BC', 'AB', 'MB', 'NB', 'NL', 'NS', 'PE', 'SK', 'NT', 'NU', 'YT'];
const ADR_VIDE: FormAdresse = { nom: '', type: 'livraison', ligne1: '', ligne2: '', ville: '', province: 'QC', code_postal: '', pays: 'Canada', telephone: '', est_principale: false };

export default function Profil({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', onProfilMaj }: Props) {
  const base = `${API}/acheteur/${gestionnaireId}`;
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', date_naissance: '', langue: 'fr' as 'fr' | 'en', infolettre: false, notifications_promo: true });
  const [modalAdr, setModalAdr] = useState<FormAdresse | null>(null);
  const [modalMdp, setModalMdp] = useState(false);
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [erreurModal, setErreurModal] = useState('');

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  const appel = async (url: string, method = 'GET', body?: any) => {
    const r = await fetch(`${base}${url}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Action impossible');
    return j;
  };

  const charger = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([appel('/profil'), appel('/adresses')]);
      setProfil(p);
      setAdresses(a.adresses || []);
      setForm({ prenom: p.prenom || '', nom: p.nom || '', email: p.email || '', telephone: p.telephone || '', date_naissance: p.date_naissance || '', langue: p.langue === 'en' ? 'en' : 'fr', infolettre: !!p.infolettre, notifications_promo: !!p.notifications_promo });
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  const sauverProfil = async () => {
    setOccupe(true);
    try {
      await appel('/profil', 'PUT', form);
      try {
        const cle = `mv_compte_${gestionnaireId}`;
        const saved = JSON.parse(localStorage.getItem(cle) || '{}');
        localStorage.setItem(cle, JSON.stringify({ ...saved, prenom: form.prenom, nom: form.nom, email: form.email, telephone: form.telephone }));
      } catch { /* stockage indisponible : sans conséquence */ }
      onProfilMaj?.({ prenom: form.prenom, nom: form.nom, email: form.email });
      showToast('✅ Profil mis à jour');
      await charger();
    } catch (e: any) { showToast(e.message, false); }
    finally { setOccupe(false); }
  };

  const sauverAdresse = async () => {
    if (!modalAdr) return;
    setOccupe(true); setErreurModal('');
    try {
      if (modalAdr.id) await appel(`/adresses/${modalAdr.id}`, 'PUT', modalAdr);
      else await appel('/adresses', 'POST', modalAdr);
      setModalAdr(null);
      showToast('📍 Adresse enregistrée');
      await charger();
    } catch (e: any) { setErreurModal(e.message); }
    finally { setOccupe(false); }
  };

  const actionAdresse = async (a: Adresse, action: 'principale' | 'supprimer') => {
    try {
      if (action === 'principale') await appel(`/adresses/${a.id}/principale`, 'PUT');
      else { if (!window.confirm('Supprimer cette adresse ?')) return; await appel(`/adresses/${a.id}`, 'DELETE'); }
      await charger();
    } catch (e: any) { showToast(e.message, false); }
  };

  const changerMdp = async () => {
    setErreurModal('');
    if (mdp.nouveau.length < 8) { setErreurModal('Le nouveau mot de passe doit avoir au moins 8 caractères.'); return; }
    if (mdp.nouveau !== mdp.confirmation) { setErreurModal('La confirmation ne correspond pas.'); return; }
    setOccupe(true);
    try {
      await appel('/profil/mot-de-passe', 'PUT', { actuel: mdp.actuel, nouveau: mdp.nouveau });
      setModalMdp(false); setMdp({ actuel: '', nouveau: '', confirmation: '' });
      showToast('🔒 Mot de passe modifié');
    } catch (e: any) { setErreurModal(e.message); }
    finally { setOccupe(false); }
  };

  const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const etiquette: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', margin: '0 0 5px' };
  const carte: React.CSSProperties = { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: isMobile ? 14 : 22, marginBottom: 18 };
  const bouton = (fond: string, actif = true): React.CSSProperties => ({ padding: '10px 18px', borderRadius: 10, border: 'none', background: actif ? fond : 'rgba(255,255,255,.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: actif ? 'pointer' : 'not-allowed', fontFamily: 'inherit' });
  const grille: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;
  if (!profil) return <div style={{ textAlign: 'center', padding: 60, color: '#fca5a5' }}>{erreur || 'Profil introuvable'}</div>;

  const initiale = (form.prenom || form.nom || '?')[0].toUpperCase();
  const modalCadre = (titre: string, contenu: React.ReactNode) => (
    <div onClick={e => { if (e.target === e.currentTarget && !occupe) { setModalAdr(null); setModalMdp(false); setErreurModal(''); } }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: '#0f1a30', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>{titre}</h3>
        {contenu}
        {erreurModal && <p style={{ margin: '12px 0 0', fontSize: 12, color: '#fca5a5' }}>{erreurModal}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {toast && <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>{toast.msg}</div>}

      <div style={{ background: 'linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%)', borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initiale}</div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 19 : 24, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[form.prenom, form.nom].filter(Boolean).join(' ')}</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,.85)' }}>Membre depuis {new Date(profil.created_at).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })} · id: {profil.id}</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,.85)' }}>📦 {profil.nb_commandes} commande(s) · ⭐ {profil.nb_avis} avis · ❤️ {profil.nb_wishlist} souhait(s)</p>
        </div>
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      {/* Informations personnelles */}
      <div style={carte}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontFamily: "'Sora',sans-serif" }}>👤 Informations personnelles</h2>
        <div style={grille}>
          <div><label style={etiquette}>Prénom *</label><input style={champ} value={form.prenom} maxLength={60} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
          <div><label style={etiquette}>Nom *</label><input style={champ} value={form.nom} maxLength={60} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
          <div><label style={etiquette}>Courriel *</label><input style={champ} type="email" value={form.email} maxLength={120} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label style={etiquette}>Téléphone</label><input style={champ} type="tel" value={form.telephone} maxLength={30} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
          <div><label style={etiquette}>Date de naissance</label><input style={champ} type="date" value={form.date_naissance} onChange={e => setForm({ ...form, date_naissance: e.target.value })} /></div>
          <div><label style={etiquette}>Langue</label>
            <select style={{ ...champ, background: '#111c33' }} value={form.langue} onChange={e => setForm({ ...form, langue: e.target.value as 'fr' | 'en' })}><option value="fr">Français</option><option value="en">English</option></select></div>
        </div>
        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={form.infolettre} onChange={e => setForm({ ...form, infolettre: e.target.checked })} /> Recevoir l'infolettre</label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={form.notifications_promo} onChange={e => setForm({ ...form, notifications_promo: e.target.checked })} /> Recevoir les notifications de promotions</label>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={bouton(`linear-gradient(135deg,${C.green},#059669)`, !occupe && !!form.prenom.trim() && !!form.nom.trim() && !!form.email.trim())} disabled={occupe || !form.prenom.trim() || !form.nom.trim() || !form.email.trim()} onClick={sauverProfil}>{occupe ? '⏳…' : '💾 Enregistrer'}</button>
          <button style={{ ...bouton('rgba(255,255,255,.1)'), border: `1px solid ${C.border}` }} onClick={() => { setErreurModal(''); setModalMdp(true); }}>🔒 Changer le mot de passe</button>
        </div>
      </div>

      {/* Adresses */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontFamily: "'Sora',sans-serif" }}>📍 Mes adresses</h2>
          <button style={bouton(`linear-gradient(135deg,${couleurAccent},#f59e0b)`)} onClick={() => { setErreurModal(''); setModalAdr({ ...ADR_VIDE }); }}><span style={{ color: '#000' }}>+ Ajouter</span></button>
        </div>
        {adresses.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: C.textLight }}>Aucune adresse enregistrée.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {adresses.map(a => (
              <div key={a.id} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${a.est_principale ? couleurAccent + '88' : C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 13 }}>{a.nom}</b>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,.2)', color: '#a5b4fc' }}>{a.type === 'facturation' ? 'Facturation' : 'Livraison'}</span>
                    {a.est_principale && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${couleurAccent}25`, color: couleurAccent }}>★ Principale</span>}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {a.ligne1}{a.ligne2 ? `, ${a.ligne2}` : ''}<br />{a.ville}, {a.province} {a.code_postal}<br />{a.pays}{a.telephone ? ` · ${a.telephone}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { setErreurModal(''); setModalAdr({ ...a, ligne2: a.ligne2 || '', telephone: a.telephone || '' }); }} style={{ ...bouton('rgba(255,255,255,.1)'), padding: '6px 12px', fontSize: 11 }}>✏️ Modifier</button>
                  {!a.est_principale && <button onClick={() => actionAdresse(a, 'principale')} style={{ ...bouton('rgba(255,255,255,.1)'), padding: '6px 12px', fontSize: 11 }}>★ Principale</button>}
                  {!a.est_principale && <button onClick={() => actionAdresse(a, 'supprimer')} style={{ ...bouton('rgba(239,68,68,.25)'), padding: '6px 12px', fontSize: 11, color: '#fca5a5' }}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAdr && modalCadre(modalAdr.id ? "Modifier l'adresse" : 'Nouvelle adresse', (
        <>
          <div style={grille}>
            <div><label style={etiquette}>Nom de l'adresse</label><input style={champ} value={modalAdr.nom} maxLength={60} placeholder="Maison, Bureau…" onChange={e => setModalAdr({ ...modalAdr, nom: e.target.value })} /></div>
            <div><label style={etiquette}>Type</label><select style={{ ...champ, background: '#111c33' }} value={modalAdr.type} onChange={e => setModalAdr({ ...modalAdr, type: e.target.value as any })}><option value="livraison">Livraison</option><option value="facturation">Facturation</option></select></div>
          </div>
          <div style={{ margin: '14px 0' }}><label style={etiquette}>Adresse *</label><input style={champ} value={modalAdr.ligne1} maxLength={160} onChange={e => setModalAdr({ ...modalAdr, ligne1: e.target.value })} /></div>
          <div style={{ margin: '14px 0' }}><label style={etiquette}>Appartement, bureau…</label><input style={champ} value={modalAdr.ligne2 || ''} maxLength={160} onChange={e => setModalAdr({ ...modalAdr, ligne2: e.target.value })} /></div>
          <div style={grille}>
            <div><label style={etiquette}>Ville *</label><input style={champ} value={modalAdr.ville} maxLength={80} onChange={e => setModalAdr({ ...modalAdr, ville: e.target.value })} /></div>
            <div><label style={etiquette}>Province *</label><select style={{ ...champ, background: '#111c33' }} value={modalAdr.province} onChange={e => setModalAdr({ ...modalAdr, province: e.target.value })}>{PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label style={etiquette}>Code postal *</label><input style={champ} value={modalAdr.code_postal} maxLength={12} onChange={e => setModalAdr({ ...modalAdr, code_postal: e.target.value.toUpperCase() })} /></div>
            <div><label style={etiquette}>Pays</label><input style={champ} value={modalAdr.pays} maxLength={40} onChange={e => setModalAdr({ ...modalAdr, pays: e.target.value })} /></div>
          </div>
          <div style={{ margin: '14px 0' }}><label style={etiquette}>Téléphone</label><input style={champ} type="tel" value={modalAdr.telephone || ''} maxLength={30} onChange={e => setModalAdr({ ...modalAdr, telephone: e.target.value })} /></div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={modalAdr.est_principale} onChange={e => setModalAdr({ ...modalAdr, est_principale: e.target.checked })} /> Définir comme adresse principale</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button style={{ ...bouton('rgba(255,255,255,.1)'), flex: 1 }} onClick={() => setModalAdr(null)} disabled={occupe}>Annuler</button>
            <button style={{ ...bouton(`linear-gradient(135deg,${C.green},#059669)`, !occupe && !!modalAdr.ligne1.trim() && !!modalAdr.ville.trim() && !!modalAdr.code_postal.trim()), flex: 1 }} disabled={occupe || !modalAdr.ligne1.trim() || !modalAdr.ville.trim() || !modalAdr.code_postal.trim()} onClick={sauverAdresse}>{occupe ? '⏳…' : 'Enregistrer'}</button>
          </div>
        </>
      ))}

      {modalMdp && modalCadre('Changer le mot de passe', (
        <>
          <div style={{ marginBottom: 14 }}><label style={etiquette}>Mot de passe actuel</label><input style={champ} type="password" autoComplete="current-password" value={mdp.actuel} onChange={e => setMdp({ ...mdp, actuel: e.target.value })} /></div>
          <div style={{ marginBottom: 14 }}><label style={etiquette}>Nouveau mot de passe (8 caractères min.)</label><input style={champ} type="password" autoComplete="new-password" value={mdp.nouveau} onChange={e => setMdp({ ...mdp, nouveau: e.target.value })} /></div>
          <div><label style={etiquette}>Confirmer</label><input style={champ} type="password" autoComplete="new-password" value={mdp.confirmation} onChange={e => setMdp({ ...mdp, confirmation: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button style={{ ...bouton('rgba(255,255,255,.1)'), flex: 1 }} onClick={() => setModalMdp(false)} disabled={occupe}>Annuler</button>
            <button style={{ ...bouton(`linear-gradient(135deg,${C.green},#059669)`, !occupe && !!mdp.actuel && !!mdp.nouveau), flex: 1 }} disabled={occupe || !mdp.actuel || !mdp.nouveau} onClick={changerMdp}>{occupe ? '⏳…' : 'Modifier'}</button>
          </div>
        </>
      ))}
    </div>
  );
}