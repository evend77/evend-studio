// CHEMIN : src/pages/acheteur/Commandes.tsx
// e-Vend Studio — Dashboard acheteur : mes commandes
// Adapté de Commandes.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET /api/acheteur/:gid/commandes · PUT /commandes/:id/annuler · PUT /commandes/:id/confirmer-reception
//       POST /commandes/:id/retour · POST /commandes/:id/avis

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formaterPrix } from '../../templates/shared/devise';
import SuiviCommande from '../../templates/shared/SuiviCommande';

const API = '/api';

interface Article { titre?: string; nom?: string; prix?: number | string; quantite?: number; image_url?: string; image?: string }
interface Commande {
  id: number;
  numero_commande: string;
  statut: 'en_attente' | 'confirmee' | 'expediee' | 'livree' | 'annulee';
  statut_paiement: string;
  total: number | string;
  articles: Article[] | null;
  adresse_livraison: Record<string, any> | null;
  note: string | null;
  date_commande: string;
  numero_suivi: string | null;
  transporteur: string | null;
  url_suivi?: string | null;
  etiquette_provider?: string | null;
  etape_livraison?: string | null;
  historique_suivi?: unknown;
  recu_le: string | null;
  annule_par: string | null;
  raison_annulation: string | null;
  collaborateur_id: number | null;
  boutique: string | null;
  retour_statut: string | null;
  a_avis: boolean;
  avis_expire?: boolean;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  onEcrire?: (collaborateurId: number) => void;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)', green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6' };

const STATUTS: Record<string, { label: string; couleur: string; icone: string }> = {
  en_attente: { label: 'En attente', couleur: '#f59e0b', icone: '⏳' },
  confirmee:  { label: 'Confirmée',  couleur: '#3b82f6', icone: '✔️' },
  expediee:   { label: 'Expédiée',   couleur: '#8b5cf6', icone: '🚚' },
  livree:     { label: 'Livrée',     couleur: '#10b981', icone: '✅' },
  annulee:    { label: 'Annulée',    couleur: '#ef4444', icone: '✖️' },
};

const RAISONS: { id: string; label: string }[] = [
  { id: 'non_recu', label: 'Article non reçu' }, { id: 'non_conforme', label: 'Non conforme à la description' },
  { id: 'endommage', label: 'Arrivé endommagé' }, { id: 'pieces_manquantes', label: 'Pièces manquantes' },
  { id: 'defectueux', label: 'Produit défectueux' }, { id: 'mauvaise_taille', label: 'Mauvaise taille' },
  { id: 'erreur_commande', label: 'Erreur de commande' }, { id: 'change_idee', label: "J'ai changé d'idée" },
];

const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const nomArticle = (a: Article) => a.titre || a.nom || 'Article';

function Pastille({ statut }: { statut: string }) {
  const s = STATUTS[statut] || { label: statut, couleur: '#6b7280', icone: '•' };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${s.couleur}22`, border: `1px solid ${s.couleur}66`, color: s.couleur, whiteSpace: 'nowrap' }}>{s.icone} {s.label}</span>;
}

export default function Commandes({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', onEcrire }: Props) {
  const [liste, setListe] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [avisActifs, setAvisActifs] = useState(true);   // false = add-on « Avis clients » non actif : pas de bouton d'avis
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const [modal, setModal] = useState<null | { type: 'annuler' | 'retour' | 'avis'; cmd: Commande }>(null);
  const [raisonAnnul, setRaisonAnnul] = useState('');
  const [typeDemande, setTypeDemande] = useState<'retour' | 'echange' | 'remboursement'>('retour');
  const [raisons, setRaisons] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [note, setNote] = useState(5);
  const [titreAvis, setTitreAvis] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [avisDetailles, setAvisDetailles] = useState(false);       // option « Avis détaillés » du gestionnaire
  const [delaiRespecte, setDelaiRespecte] = useState<boolean | null>(null);
  const [communication, setCommunication] = useState(0);
  const [emballage, setEmballage] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);

  const base = `${API}/acheteur/${gestionnaireId}`;
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${base}/commandes`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setListe(j.commandes || []);
      setAvisDetailles(!!j.avis_detailles);
      setAvisActifs(j.avis_actifs !== false);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [base]);

  useEffect(() => { charger(); }, [charger]);

  const appeler = async (url: string, method: string, body: any | undefined, ok: string) => {
    setOccupe(true);
    try {
      const r = await fetch(`${base}${url}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Action impossible');
      showToast(j.message_acheteur || ok);
      setModal(null);
      await charger();
    } catch (e: any) { showToast(e.message || 'Action impossible', false); }
    finally { setOccupe(false); }
  };

  const ajouterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    for (const f of Array.from(fichiers)) {
      if (photos.length >= 5) { showToast('Maximum 5 photos', false); break; }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { showToast(`« ${f.name} » n'est pas une image JPEG, PNG ou WebP`, false); continue; }
      if (f.size > 5 * 1024 * 1024) { showToast(`« ${f.name} » dépasse 5 Mo`, false); continue; }
      setEnvoiPhoto(true);
      try {
        const fd = new FormData(); fd.append('file', f);
        const r = await fetch(`${base}/avis/photo`, { method: 'POST', credentials: 'include', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Envoi impossible');
        setPhotos(p => [...p, j.url].slice(0, 5));
      } catch (e: any) { showToast(e.message || 'Envoi impossible', false); }
      setEnvoiPhoto(false);
    }
  };

  const ouvrirModal = (type: 'annuler' | 'retour' | 'avis', cmd: Commande) => {
    setRaisonAnnul(''); setTypeDemande('retour'); setRaisons([]); setDetails(''); setNote(5); setTitreAvis(''); setCommentaire('');
    setDelaiRespecte(null); setCommunication(0); setEmballage(0); setPhotos([]);
    setModal({ type, cmd });
  };

  const kpis = useMemo(() => ({
    total: liste.length,
    enCours: liste.filter(c => ['en_attente', 'confirmee', 'expediee'].includes(c.statut)).length,
    livrees: liste.filter(c => c.statut === 'livree').length,
    depense: liste.filter(c => c.statut !== 'annulee').reduce((s, c) => s + num(c.total), 0),
  }), [liste]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return liste.filter(c => (filtre === 'toutes' || c.statut === filtre)
      && (!q || c.numero_commande.toLowerCase().includes(q) || (c.boutique || '').toLowerCase().includes(q) || (c.articles || []).some(a => nomArticle(a).toLowerCase().includes(q))));
  }, [liste, filtre, recherche]);

  const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const bouton = (fond: string, actif = true): React.CSSProperties => ({ padding: '9px 14px', borderRadius: 10, border: 'none', background: actif ? fond : 'rgba(255,255,255,.08)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: actif ? 'pointer' : 'not-allowed', fontFamily: 'inherit' });

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement de vos commandes…</div>;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {toast && <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>{toast.msg}</div>}

      <div style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)', borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>📦 Mes commandes</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.85)' }}>Suivez, annulez ou retournez vos achats</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: 18 }}>
        {[{ l: 'Commandes', v: kpis.total, c: '#3b82f6' }, { l: 'En cours', v: kpis.enCours, c: '#8b5cf6' }, { l: 'Livrées', v: kpis.livrees, c: '#10b981' }, { l: 'Dépensé', v: `${formaterPrix(kpis.depense)}`, c: couleurAccent }].map(k => (
          <div key={k.l} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 N° de commande, boutique, produit…" style={{ ...champ, flex: '1 1 220px', width: 'auto' }} />
        <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ ...champ, width: 'auto', background: '#111c33' }}>
          <option value="toutes">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
          <p style={{ margin: 0, fontSize: 14, color: C.textLight }}>{liste.length === 0 ? "Vous n'avez pas encore passé de commande." : 'Aucune commande ne correspond à ce filtre.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrees.map(c => {
            const open = ouverte === c.id;
            const peutAnnuler = (c.statut === 'en_attente' || c.statut === 'confirmee') && c.statut_paiement !== 'paye';
            const peutRetour = (c.statut === 'expediee' || c.statut === 'livree') && !(c.retour_statut === 'en_attente' || c.retour_statut === 'approuve');
            const adr = c.adresse_livraison || {};
            return (
              <div key={c.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div onClick={() => setOuverte(open ? null : c.id)} style={{ padding: isMobile ? '12px' : '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.numero_commande}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textLight }}>{fmtDate(c.date_commande)}{c.boutique ? ` · 🏪 ${c.boutique}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Pastille statut={c.statut} />
                    {c.retour_statut && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,.15)', color: '#fbbf24' }}>🔄 Retour : {c.retour_statut.replace('_', ' ')}</span>}
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{formaterPrix(num(c.total))}</span>
                    <span style={{ color: C.textLight, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
                  </div>
                </div>

                {open && (
                  <div style={{ padding: isMobile ? '0 12px 14px' : '0 18px 18px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ marginTop: 14 }}>
                      <SuiviCommande commande={c} theme="sombre" accent={couleurAccent} isMobile={isMobile} titre="Suivi de ma commande" />
                    </div>

                    <div style={{ margin: '12px 0' }}>
                      {(c.articles || []).map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,.06)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {(a.image_url || a.image) ? <img src={a.image_url || a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, color: '#fff', minWidth: 0, wordBreak: 'break-word' }}>{nomArticle(a)} <span style={{ color: C.textLight }}>× {a.quantite || 1}</span></span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{formaterPrix((num(a.prix) * (a.quantite || 1)))}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
                      {(adr.ligne1 || adr.adresse || adr.ville) && (
                        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 12 }}>
                          <b style={{ color: '#fff' }}>📍 Livraison</b><br />
                          {[adr.nom, adr.ligne1 || adr.adresse, adr.ville, adr.province, adr.code_postal].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 12 }}>
                        <b style={{ color: '#fff' }}>💳 Paiement</b><br />{c.statut_paiement === 'paye' ? 'Payé' : c.statut_paiement === 'rembourse' ? 'Remboursé' : 'En attente de paiement'}
                        {c.numero_suivi && <><br /><b style={{ color: '#fff' }}>🚚 Suivi</b> {c.transporteur ? `${c.transporteur} · ` : ''}{c.numero_suivi}{c.url_suivi && /^https?:\/\//i.test(c.url_suivi) && <> · <a href={c.url_suivi} target="_blank" rel="noopener noreferrer" style={{ color: couleurAccent, fontWeight: 700 }}>Suivre mon colis ↗</a></>}</>}
                        {c.recu_le && <><br />Reçue le {fmtDate(c.recu_le)}</>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      {c.statut === 'expediee' && <button style={bouton(`linear-gradient(135deg,${C.green},#059669)`)} onClick={() => appeler(`/commandes/${c.id}/confirmer-reception`, 'PUT', undefined, '✅ Réception confirmée')} disabled={occupe}>📬 J'ai reçu ma commande</button>}
                      {peutAnnuler && <button style={bouton('linear-gradient(135deg,#ef4444,#dc2626)')} onClick={() => ouvrirModal('annuler', c)}>✖️ Annuler</button>}
                      {peutRetour && <button style={bouton('linear-gradient(135deg,#f59e0b,#d97706)')} onClick={() => ouvrirModal('retour', c)}>🔄 Retour / remboursement</button>}
                      {avisActifs && c.statut === 'livree' && !c.a_avis && c.avis_expire && <span style={{ fontSize: 12, color: C.textLight, alignSelf: 'center' }}>⭐ Le délai pour donner un avis est dépassé.</span>}
                      {avisActifs && c.statut === 'livree' && !c.a_avis && !c.avis_expire && <button style={bouton('linear-gradient(135deg,#8b5cf6,#6366f1)')} onClick={() => ouvrirModal('avis', c)}>⭐ Donner un avis</button>}
                      {c.collaborateur_id && onEcrire && <button style={{ ...bouton('rgba(255,255,255,.1)'), border: `1px solid ${C.border}` }} onClick={() => onEcrire(c.collaborateur_id!)}>💬 Écrire au collaborateur</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modales ── */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget && !occupe) setModal(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#0f1a30', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
            {modal.type === 'annuler' && (
              <>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>Annuler {modal.cmd.numero_commande}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textLight }}>Cette action est définitive.</p>
                <textarea value={raisonAnnul} maxLength={300} onChange={e => setRaisonAnnul(e.target.value)} rows={3} placeholder="Raison (facultatif)" style={{ ...champ, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={{ ...bouton('rgba(255,255,255,.1)'), flex: 1 }} onClick={() => setModal(null)} disabled={occupe}>Garder la commande</button>
                  <button style={{ ...bouton('#ef4444', !occupe), flex: 1 }} disabled={occupe} onClick={() => appeler(`/commandes/${modal.cmd.id}/annuler`, 'PUT', { raison: raisonAnnul }, 'Commande annulée')}>{occupe ? '⏳…' : 'Annuler la commande'}</button>
                </div>
              </>
            )}
            {modal.type === 'retour' && (
              <>
                <h3 style={{ margin: '0 0 14px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>Demande pour {modal.cmd.numero_commande}</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['retour', 'echange', 'remboursement'] as const).map(t => (
                    <button key={t} onClick={() => setTypeDemande(t)} style={{ flex: 1, padding: '9px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${typeDemande === t ? couleurAccent : C.border}`, background: typeDemande === t ? `${couleurAccent}22` : 'rgba(255,255,255,.04)', color: typeDemande === t ? couleurAccent : '#fff' }}>
                      {t === 'retour' ? 'Retour' : t === 'echange' ? 'Échange' : 'Remboursement'}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.textLight }}>RAISONS *</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {RAISONS.map(r => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={raisons.includes(r.id)} onChange={() => setRaisons(p => (p.includes(r.id) ? p.filter(x => x !== r.id) : [...p, r.id]))} /> {r.label}
                    </label>
                  ))}
                </div>
                <textarea value={details} maxLength={1000} onChange={e => setDetails(e.target.value)} rows={3} placeholder="Détails (facultatif)" style={{ ...champ, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={{ ...bouton('rgba(255,255,255,.1)'), flex: 1 }} onClick={() => setModal(null)} disabled={occupe}>Fermer</button>
                  <button style={{ ...bouton('linear-gradient(135deg,#f59e0b,#d97706)', raisons.length > 0 && !occupe), flex: 1 }} disabled={!raisons.length || occupe}
                    onClick={() => appeler(`/commandes/${modal.cmd.id}/retour`, 'POST', { type_demande: typeDemande, raisons, details }, '📨 Demande envoyée')}>{occupe ? '⏳…' : 'Envoyer la demande'}</button>
                </div>
              </>
            )}
            {modal.type === 'avis' && (
              <>
                <h3 style={{ margin: '0 0 14px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>Votre avis sur {modal.cmd.boutique || 'cette boutique'}</h3>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setNote(n)} style={{ background: 'none', border: 'none', fontSize: 30, cursor: 'pointer', color: n <= note ? '#fbbf24' : 'rgba(255,255,255,.2)', padding: 0 }}>★</button>)}
                </div>
                <input value={titreAvis} maxLength={120} onChange={e => setTitreAvis(e.target.value)} placeholder="Titre (facultatif)" style={{ ...champ, marginBottom: 10 }} />
                <textarea value={commentaire} maxLength={1500} onChange={e => setCommentaire(e.target.value)} rows={4} placeholder="Votre commentaire…" style={{ ...champ, resize: 'vertical' }} />
                {avisDetailles && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, color: C.textLight, marginBottom: 6 }}>📦 Délai de livraison respecté ?</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[{ v: true, l: '✅ Oui' }, { v: false, l: '❌ Non' }].map(o => (
                          <button key={String(o.v)} type="button" onClick={() => setDelaiRespecte(delaiRespecte === o.v ? null : o.v)}
                            style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer', color: '#fff', border: `1px solid ${delaiRespecte === o.v ? (o.v ? C.green : C.red) : C.border}`, background: delaiRespecte === o.v ? (o.v ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)') : 'rgba(255,255,255,.05)' }}>{o.l}</button>
                        ))}
                      </div>
                    </div>
                    {([['💬 Communication avec le vendeur', communication, setCommunication], ["📦 Qualité de l'emballage", emballage, setEmballage]] as const).map(([titre, val, set]) => (
                      <div key={titre}>
                        <div style={{ fontSize: 13, color: C.textLight, marginBottom: 4 }}>{titre}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => set(val === n ? 0 : n)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: n <= val ? '#fbbf24' : 'rgba(255,255,255,.2)', padding: 0 }}>★</button>)}
                        </div>
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize: 13, color: C.textLight, marginBottom: 6 }}>📷 Photos (max 5) {envoiPhoto && <span style={{ color: C.amber }}>⏳ envoi…</span>}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {photos.map((u, i) => (
                          <div key={u} style={{ position: 'relative', width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                            <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', border: 'none', background: C.red, color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: '18px', padding: 0 }}>✕</button>
                          </div>
                        ))}
                        {photos.length < 5 && (
                          <label style={{ width: 56, height: 56, borderRadius: 10, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, color: C.textLight }}>
                            +<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={envoiPhoto} onChange={e => { ajouterPhotos(e.target.files); e.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={{ ...bouton('rgba(255,255,255,.1)'), flex: 1 }} onClick={() => setModal(null)} disabled={occupe}>Fermer</button>
                  <button style={{ ...bouton('linear-gradient(135deg,#8b5cf6,#6366f1)', !occupe), flex: 1 }} disabled={occupe || envoiPhoto}
                    onClick={() => appeler(`/commandes/${modal.cmd.id}/avis`, 'POST', { note, titre: titreAvis, commentaire, ...(avisDetailles ? { criteres: { delai_respecte: delaiRespecte, communication: communication || null, emballage: emballage || null }, photos } : {}) }, '⭐ Merci pour votre avis')}>{occupe ? '⏳…' : 'Publier'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}