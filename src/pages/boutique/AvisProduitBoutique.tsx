// CHEMIN : src/pages/boutique/AvisProduitBoutique.tsx
// e-Vend Studio — Add-on « Avis clients » (templates boutique solo) : avis publiés d'un produit sur sa fiche (thème sombre).
//   • useAvisProduit(gid, produitId, demo) : charge GET /api/boutique/avis/:gid/produit/:id (public) et garde le résultat en mémoire (la fiche se remonte quand la page se redessine).
//   • AvisProduitBoutique : note moyenne, répartition par étoiles, liste des avis (photos agrandissables, réponse du vendeur), « Afficher plus ».
// Rien n'est affiché si l'add-on est inactif ou si le produit n'a aucun avis (le serveur répond actif:false / total:0).

import { useState, useEffect, useCallback, type CSSProperties } from 'react';

export interface AvisPublic { id: number; note: number; titre: string | null; commentaire: string; photos: string[]; reponse: string | null; reponse_le: string | null; created_at: string; auteur: string }
export interface EtatAvis { actif: boolean; afficher_moyenne: boolean; total: number; moyenne: number; repartition: Record<string, number>; page: number; pages: number }
export interface AvisProduit { etat: EtatAvis | null; avis: AvisPublic[]; plus: () => void }

const MEMO: Record<string, { etat: EtatAvis; avis: AvisPublic[] }> = {};

/** Avis publiés d'un produit. `produitId` peut être absent (aucune fiche ouverte) ; `demo` : produits de démonstration, rien à charger. */
export function useAvisProduit(gestionnaireId: number, produitId: number | undefined, demo?: boolean): AvisProduit {
  const cle = `${gestionnaireId}:${produitId}`;
  const [etat, setEtat] = useState<EtatAvis | null>(produitId ? MEMO[cle]?.etat || null : null);
  const [avis, setAvis] = useState<AvisPublic[]>(produitId ? MEMO[cle]?.avis || [] : []);

  const charger = useCallback(async (page: number) => {
    if (demo || !gestionnaireId || !produitId) return;
    try {
      const r = await fetch(`/api/boutique/avis/${gestionnaireId}/produit/${produitId}?page=${page}`);
      if (!r.ok) return;
      const j = await r.json();
      if (!j || j.actif !== true) { setEtat(null); setAvis([]); delete MEMO[cle]; return; }
      setEtat(j);
      setAvis(prev => { const liste: AvisPublic[] = page === 1 ? j.avis || [] : [...prev, ...(j.avis || [])]; MEMO[cle] = { etat: j, avis: liste }; return liste; });
    } catch { /* l'onglet reste caché */ }
  }, [gestionnaireId, produitId, demo, cle]);

  useEffect(() => {
    if (!produitId || demo) { setEtat(null); setAvis([]); return; }
    setEtat(MEMO[cle]?.etat || null); setAvis(MEMO[cle]?.avis || []);
    charger(1);
  }, [charger, produitId, demo, cle]);

  const plus = useCallback(() => { if (etat && etat.page < etat.pages) charger(etat.page + 1); }, [etat, charger]);
  return { etat, avis, plus };
}

export function EtoilesAvis({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span aria-label={`${note} sur 5`} style={{ letterSpacing: 1, fontSize: taille, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= Math.round(note) ? '#fbbf24' : 'rgba(255,255,255,0.18)' }}>★</span>)}
    </span>
  );
}

const date = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

interface Props { donnees: AvisProduit; couleurAccent: string; connecte: boolean; ouvrirMesAvis: () => void; isMobile?: boolean }

export default function AvisProduitBoutique({ donnees, couleurAccent, connecte, ouvrirMesAvis, isMobile }: Props) {
  const { etat, avis, plus } = donnees;
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!photo) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setPhoto(null); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [photo]);
  if (!etat || !etat.actif || etat.total === 0) return null;

  const carte: CSSProperties = { background: '#1e1e1e', border: '1px solid #222', borderRadius: 12, padding: '20px 24px' };
  const max = Math.max(1, ...[1, 2, 3, 4, 5].map(n => etat.repartition[n] || 0));

  return (
    <div>
      {etat.afficher_moyenne && (
        <div style={{ display: 'flex', gap: isMobile ? 20 : 40, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: couleurAccent, lineHeight: 1 }}>{etat.moyenne.toFixed(1)}</div>
            <EtoilesAvis note={etat.moyenne} taille={20} />
            <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{etat.total} avis</div>
          </div>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            {[5, 4, 3, 2, 1].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#999', marginBottom: 4 }}>
                <span style={{ width: 14, textAlign: 'right' }}>{n}</span><span style={{ color: '#fbbf24' }}>★</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${((etat.repartition[n] || 0) / max) * 100}%`, height: '100%', background: couleurAccent }} /></div>
                <span style={{ width: 26 }}>{etat.repartition[n] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {avis.map(a => (
          <div key={a.id} style={carte}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${couleurAccent}20`, border: '1px solid rgba(201,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: couleurAccent }}>{(a.auteur || '?')[0]}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.auteur}</div><EtoilesAvis note={a.note} taille={13} /></div>
              </div>
              <span style={{ fontSize: 12, color: '#777' }}>{date(a.created_at)}</span>
            </div>
            {a.titre && <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, wordBreak: 'break-word' }}>{a.titre}</div>}
            <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.commentaire}</p>
            {a.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {a.photos.map(u => (
                  <button key={u} onClick={() => setPhoto(u)} aria-label="Agrandir la photo" style={{ padding: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in', background: 'none', width: 72, height: 72 }}>
                    <img src={u} alt="Photo de l'avis" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
            {a.reponse && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderLeft: `3px solid ${couleurAccent}`, background: 'rgba(255,255,255,0.04)', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: couleurAccent, marginBottom: 4 }}>Réponse du vendeur{a.reponse_le ? ` · ${date(a.reponse_le)}` : ''}</div>
                <div style={{ fontSize: 14, color: '#ccc', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.reponse}</div>
              </div>
            )}
          </div>
        ))}
        {etat.page < etat.pages && (
          <button onClick={plus} style={{ alignSelf: 'center', padding: '9px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Afficher plus d'avis</button>
        )}
      </div>

      <p style={{ margin: '24px 0 0', fontSize: 13, color: '#777' }}>
        Vous avez acheté ce produit ?{' '}
        <button onClick={ouvrirMesAvis} style={{ background: 'none', border: 'none', padding: 0, color: couleurAccent, textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          {connecte ? 'Laissez votre avis depuis « Mes avis »' : 'Connectez-vous pour laisser votre avis'}
        </button>
      </p>

      {photo && (
        <div onClick={() => setPhoto(null)} role="dialog" aria-label="Photo agrandie" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={photo} alt="Photo de l'avis agrandie" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setPhoto(null)} aria-label="Fermer" style={{ position: 'absolute', top: 14, right: 18, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}