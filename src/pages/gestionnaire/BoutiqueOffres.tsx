// CHEMIN : src/pages/gestionnaire/BoutiqueOffres.tsx
// e-Vend Studio — Add-on « Offres du jour » (templates boutique solo). Adapté de CollaborateurOffres.tsx (MV) : le gestionnaire programme un prix d'offre
// avec une date de début et de fin sur SES produits. Le serveur applique le prix à la seconde exacte (aucune tâche planifiée).
// API : /api/boutique/gestionnaire/offres/(mes | :produitId  PUT = créer/modifier, DELETE = retirer)

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

type Etat = 'aucune' | 'venir' | 'cours' | 'terminee';
interface Produit {
  id: number; titre: string; sku: string | null; photo: string | null; prix: number; prix_promo: number | null; stock: number | null;
  etat: Etat; offre: { prix: number; debut: string; fin: string } | null;
}
interface Reponse { total: number; page: number; pages: number; stats: { cours: number; venir: number; terminee: number }; produits: Produit[] }
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; produitInitial?: number | null; pagePlan?: string; naviguerVers?: (page: string) => void; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444', orange: '#f59e0b' };
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const pad = (n: number) => String(n).padStart(2, '0');
const versLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const reste = (fin: string) => {
  const s = Math.max(0, Math.floor((Date.parse(fin) - Date.now()) / 1000));
  const j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return j > 0 ? `${j} j ${h} h` : h > 0 ? `${h} h ${m} min` : `${m} min`;
};
const ETATS: Record<Etat, { label: string; couleur: string; fond: string }> = {
  cours: { label: '🔥 En cours', couleur: '#047857', fond: '#ecfdf5' },
  venir: { label: '🗓️ À venir', couleur: '#b45309', fond: '#fffbeb' },
  terminee: { label: 'Terminée', couleur: '#6b7280', fond: '#f3f4f6' },
  aucune: { label: 'Aucune offre', couleur: '#6b7280', fond: '#f3f4f6' },
};

export default function BoutiqueOffres({ accent, isMobile: mobileProp, produitInitial, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [data, setData] = useState<Reponse | null>(null);
  const [etat, setEtat] = useState<Etat | ''>('');
  const [recherche, setRecherche] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [inactif, setInactif] = useState(false);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [modal, setModal] = useState<Produit | null>(null);
  const [aRetirer, setARetirer] = useState<Produit | null>(null);
  const [prixOffre, setPrixOffre] = useState('');
  const [programmer, setProgrammer] = useState(false);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [erreurModal, setErreurModal] = useState('');

  useEffect(() => { const t = setTimeout(() => { setQ(recherche.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [recherche]);

  const charger = useCallback(async () => {
    const p = [`page=${page}`];
    if (etat) p.push(`etat=${etat}`);
    if (q) p.push(`q=${encodeURIComponent(q)}`);
    const r = await bq(`/offres/mes?${p.join('&')}`);
    if (r.ok) { setData(r.data); setErreur(''); setInactif(false); }
    else if (r.status === 403) setInactif(true);
    else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, etat, q]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };

  const ouvrir = useCallback((p: Produit) => {
    setModal(p); setErreurModal('');
    const actuelle = p.offre && p.etat !== 'terminee' ? p.offre : null;
    setPrixOffre(actuelle ? String(actuelle.prix) : '');
    const futur = !!actuelle && p.etat === 'venir';
    setProgrammer(futur);
    setDebut(futur && actuelle ? versLocal(new Date(actuelle.debut)) : versLocal(new Date(Date.now() + 3600000)));
    setFin(actuelle ? versLocal(new Date(actuelle.fin)) : versLocal(new Date(Date.now() + 24 * 3600000)));
  }, []);

  // Arrivée depuis le menu ⋮ d'un produit : on ouvre directement la fenêtre d'offre de CE produit
  useEffect(() => {
    if (!produitInitial) return;
    let annule = false;
    bq(`/offres/mes?produit_id=${produitInitial}`).then(r => {
      if (annule || !r.ok) return;
      const p = (r.data.produits || [])[0];
      if (p) ouvrir(p);
    });
    return () => { annule = true; };
  }, [produitInitial, ouvrir]);

  const duree = (heures: number) => { const d = programmer && debut ? new Date(debut) : new Date(); setFin(versLocal(new Date(d.getTime() + heures * 3600000))); };

  const enregistrer = async () => {
    if (!modal) return;
    setErreurModal('');
    if (!(Number(prixOffre) > 0)) { setErreurModal("Entrez le prix de l'offre."); return; }
    if (!fin) { setErreurModal('Choisissez la date de fin.'); return; }
    setOccupe(true);
    const corps: any = { prix_offre: Number(prixOffre), fin: new Date(fin).toISOString() };
    if (programmer && debut) corps.debut = new Date(debut).toISOString();
    const r = await bq(`/offres/${modal.id}`, { method: 'PUT', body: corps });
    setOccupe(false);
    if (r.ok) { setModal(null); flash(r.data.message || 'Offre enregistrée.'); charger(); }
    else setErreurModal(messageErreur(r));
  };

  const retirer = async () => {
    if (!aRetirer) return;
    setOccupe(true);
    const r = await bq(`/offres/${aRetirer.id}`, { method: 'DELETE' });
    setOccupe(false); setARetirer(null);
    if (r.ok) { flash('Offre retirée.'); charger(); } else setErreur(messageErreur(r));
  };

  const chip = (id: Etat | '', label: string, n?: number) => (
    <button key={id || 'tous'} onClick={() => { setEtat(id); setPage(1); }}
      style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${etat === id ? couleur : T.border}`, background: etat === id ? `${couleur}18` : '#fff', color: etat === id ? couleur : T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}{n !== undefined ? ` (${n})` : ''}
    </button>
  );
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 16 };
  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', color: T.text, background: '#fff' };

  if (inactif) return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ ...carte, textAlign: 'center', color: T.light }}>
        L'add-on « Offres du jour » n'est pas activé.
        {pagePlan && naviguerVers && <div style={{ marginTop: 10 }}><button onClick={() => naviguerVers(pagePlan)} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>Voir « Mon plan & limites »</button></div>}
      </div>
    </div>
  );

  const pct = modal && Number(prixOffre) > 0 && modal.prix > 0 ? Math.round(((modal.prix - Number(prixOffre)) / modal.prix) * 100) : null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? 20 : 24, color: T.text }}>🔥 Offres du jour</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.light }}>Programmez un prix spécial avec une date de début et de fin. Un compte à rebours s'affiche sur votre produit et le prix revient tout seul à la fin.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {chip('', 'Tous mes produits')}
        {chip('cours', 'En cours', data?.stats.cours)}
        {chip('venir', 'À venir', data?.stats.venir)}
        {chip('terminee', 'Terminées', data?.stats.terminee)}
        {chip('aucune', 'Sans offre')}
      </div>
      <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un produit (titre ou SKU)…" style={{ ...champ, marginBottom: 14, maxWidth: 420 }} />

      {chargement && !data ? <div style={{ ...carte, textAlign: 'center', color: T.light }}>Chargement…</div>
        : !data || data.produits.length === 0 ? <div style={{ ...carte, textAlign: 'center', color: T.light }}>Aucun produit.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.produits.map(p => {
              const st = ETATS[p.etat];
              return (
                <div key={p.id} style={{ ...carte, borderLeft: `4px solid ${p.etat === 'cours' ? T.green : p.etat === 'venir' ? T.orange : T.border}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    {p.photo
                      ? <img src={p.photo} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0, background: '#f3f4f6' }} />
                      : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px solid ${T.border}`, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                      <div style={{ fontSize: 12, color: T.light, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {p.sku && <span>SKU : <b style={{ color: T.text }}>{p.sku}</b></span>}
                        <span>Prix : <b style={{ color: T.text }}>{formaterArgent(p.prix)}</b></span>
                        {p.prix_promo !== null && p.prix_promo < p.prix && p.etat !== 'cours' && <span>Promo : {formaterArgent(p.prix_promo)}</span>}
                      </div>
                      {p.offre && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
                          <span style={{ padding: '2px 10px', borderRadius: 12, background: st.fond, color: st.couleur, fontWeight: 800 }}>{st.label}</span>
                          <span style={{ color: T.text, fontWeight: 800 }}>Offre : {formaterArgent(p.offre.prix)}</span>
                          <span style={{ color: T.light }}>{quand(p.offre.debut)} → {quand(p.offre.fin)}</span>
                          {p.etat === 'cours' && <span style={{ color: T.green, fontWeight: 700 }}>Se termine dans {reste(p.offre.fin)}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                      <button disabled={occupe} onClick={() => ouvrir(p)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: couleur, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {p.offre && p.etat !== 'terminee' ? '✏️ Modifier' : '🔥 Créer une offre'}
                      </button>
                      {p.offre && <button disabled={occupe} onClick={() => setARetirer(p)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.red}`, background: '#fff', color: T.red, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Retirer</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {data.pages > 1 && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 6 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
                <span style={{ fontSize: 13, color: T.light }}>Page {data.page} / {data.pages}</span>
                <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: page >= data.pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Suivant →</button>
              </div>
            )}
          </div>
        )}

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', color: T.text }}>🔥 Offre du jour</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 14px', paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              {modal.photo ? <img src={modal.photo} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{modal.titre}</div>
                <div style={{ fontSize: 12, color: T.light }}>Prix actuel : <b>{formaterArgent(modal.prix)}</b>{modal.sku ? ` · SKU ${modal.sku}` : ''}</div>
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 800, color: T.light, textTransform: 'uppercase' }}>Prix de l'offre ($)</label>
            <input type="number" min="0.01" step="0.01" value={prixOffre} onChange={e => setPrixOffre(e.target.value)} placeholder="Ex. 14.99" style={{ ...champ, margin: '4px 0 4px' }} />
            <div style={{ fontSize: 12, color: pct !== null && pct > 0 ? T.green : T.light, marginBottom: 12, fontWeight: 700 }}>
              {pct !== null && pct > 0 ? `Rabais de ${pct} %` : `Doit être plus bas que ${formaterArgent(modal.prix)}`}
            </div>

            <label style={{ fontSize: 12, fontWeight: 800, color: T.light, textTransform: 'uppercase' }}>Début</label>
            <div style={{ display: 'flex', gap: 14, margin: '6px 0 8px', fontSize: 14, color: T.text }}>
              <label style={{ cursor: 'pointer' }}><input type="radio" checked={!programmer} onChange={() => setProgrammer(false)} /> Maintenant</label>
              <label style={{ cursor: 'pointer' }}><input type="radio" checked={programmer} onChange={() => setProgrammer(true)} /> Programmer</label>
            </div>
            {programmer && <input type="datetime-local" value={debut} onChange={e => setDebut(e.target.value)} style={{ ...champ, marginBottom: 10 }} />}

            <label style={{ fontSize: 12, fontWeight: 800, color: T.light, textTransform: 'uppercase' }}>Fin</label>
            <input type="datetime-local" value={fin} onChange={e => setFin(e.target.value)} style={{ ...champ, margin: '4px 0 8px' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {([[24, '24 h'], [72, '3 jours'], [168, '7 jours'], [720, '30 jours']] as [number, string][]).map(([h, l]) => (
                <button key={h} type="button" onClick={() => duree(h)} style={{ padding: '5px 12px', borderRadius: 16, border: `1px solid ${T.border}`, background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.light, marginBottom: 12 }}>Durée : de 1 heure à 60 jours.</div>

            <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
              Les variantes qui ont leur propre prix ne sont pas touchées par l'offre.
            </div>

            {erreurModal && <div style={{ padding: '9px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{erreurModal}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Annuler</button>
              <button disabled={occupe} onClick={enregistrer} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: couleur, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{occupe ? '⏳ …' : "Enregistrer l'offre"}</button>
            </div>
          </div>
        </div>
      )}

      {aRetirer && (
        <BoutiqueModale type="confirmer" accent={T.red} titre="Retirer l'offre ?" enCours={occupe} texteConfirmer="Retirer"
          message={`Retirer l'offre de « ${aRetirer.titre} » ? Le prix redevient normal tout de suite.`}
          onConfirmer={retirer} onFermer={() => { if (!occupe) setARetirer(null); }} />
      )}
    </div>
  );
}