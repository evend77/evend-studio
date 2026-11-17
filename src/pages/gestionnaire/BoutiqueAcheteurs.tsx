// CHEMIN : src/pages/gestionnaire/BoutiqueAcheteurs.tsx
// e-Vend Studio — « Mes acheteurs » des templates boutique (solo : Premium, Simplisse, Mode, Beauté…).
// Acheteurs inscrits sur la boutique du gestionnaire connecté (même compte que le MV, filtré sur ce site).
// API : GET /api/boutique/gestionnaire/acheteurs, GET …/acheteurs/:id, PUT …/acheteurs/:id/suspendre

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';

interface Acheteur { id: number; prenom: string; nom: string; email: string; telephone: string | null; infolettre: boolean; suspendu: boolean; created_at: string; }
interface Reponse { id: string; label: string; valeur: any; }
interface Adresse { libelle?: string; nom: string; adresse1: string; adresse2?: string; ville: string; province: string; code_postal: string; pays: string; telephone: string; type?: string; est_principale?: boolean; }
interface Fiche { reponses: Reponse[]; adresse: Adresse | null; adresses?: Adresse[]; }

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; }

function duree(iso: string) {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return 'hier';
  if (d < 30) return `il y a ${d} jours`;
  if (d < 365) return `il y a ${Math.floor(d / 30)} mois`;
  return `il y a ${Math.floor(d / 365)} an(s)`;
}
const dateLongue = (iso: string) => { try { return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return ''; } };
const valeurTexte = (v: any) => (v === true ? 'Oui' : v === false ? 'Non' : Array.isArray(v) ? v.join(', ') : String(v ?? ''));
const initiale = (a: Acheteur) => ((a.prenom || a.nom || a.email || '?').charAt(0)).toUpperCase();

export default function BoutiqueAcheteurs({ accent, isMobile }: Props) {
  const CP = accent || '#c9a96e';
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'actif' | 'suspendu'>('tous');
  const [ouvert, setOuvert] = useState<Acheteur | null>(null);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [chargFiche, setChargFiche] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await bq('/acheteurs');
      if (r.ok) setAcheteurs(r.data.acheteurs || []); else setErreur(messageErreur(r));
      setChargement(false);
    })();
  }, []);

  const voir = async (a: Acheteur) => {
    setOuvert(a); setFiche(null); setChargFiche(true);
    const r = await bq(`/acheteurs/${a.id}`);
    if (r.ok) setFiche(r.data as Fiche);
    setChargFiche(false);
  };

  const basculer = async (a: Acheteur) => {
    setEnCours(true); setErreur('');
    const r = await bq(`/acheteurs/${a.id}/suspendre`, { method: 'PUT', body: { suspendu: !a.suspendu } });
    if (r.ok) {
      const s = !a.suspendu;
      setAcheteurs(prev => prev.map(x => x.id === a.id ? { ...x, suspendu: s } : x));
      setOuvert(prev => prev ? { ...prev, suspendu: s } : prev);
    } else setErreur(messageErreur(r));
    setEnCours(false);
  };

  const filtres = acheteurs.filter(a => {
    const okS = filtre === 'tous' || (filtre === 'suspendu' ? a.suspendu : !a.suspendu);
    const q = recherche.trim().toLowerCase();
    return okS && (!q || `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(q));
  });
  const nbActifs = acheteurs.filter(a => !a.suspendu).length;
  const nbInfolettre = acheteurs.filter(a => a.infolettre).length;
  const carte = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' } as const;
  const pastille = (s: boolean) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s ? '#fee2e2' : '#dcfce7', color: s ? '#dc2626' : '#16a34a' } as const);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh', padding: isMobile ? '18px 14px' : '28px 32px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👥</div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Mes acheteurs</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Clients inscrits sur votre boutique</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[['👥', 'Total inscrits', acheteurs.length, CP], ['✅', 'Actifs', nbActifs, '#16a34a'], ['✉️', 'Infolettre', nbInfolettre, '#6366f1']].map(([ic, lb, v, c]) => (
          <div key={String(lb)} style={{ ...carte, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{ic}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>{lb}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: String(c) }}>{v}</div>
          </div>
        ))}
      </div>

      {erreur && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un acheteur..."
          style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: isMobile ? '100%' : 260 }} />
        {(['tous', 'actif', 'suspendu'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 16px', border: `1px solid ${filtre === f ? CP : '#e5e7eb'}`, borderRadius: 8, background: filtre === f ? CP : '#fff', color: filtre === f ? '#fff' : '#555', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {f === 'tous' ? 'Tous' : f === 'actif' ? '✅ Actifs' : '🚫 Suspendus'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>{filtres.length} acheteur(s)</span>
      </div>

      <div style={{ ...carte, overflow: 'hidden' }}>
        {chargement ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Chargement...</div>
        ) : filtres.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p style={{ fontSize: 15, color: '#888', margin: 0 }}>Aucun acheteur inscrit pour l'instant.</p>
            <p style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>Les acheteurs apparaîtront ici quand ils s'inscriront sur votre boutique.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f8f6', borderBottom: '2px solid #e5e7eb' }}>
                  {['Acheteur', 'Courriel', 'Téléphone', 'Statut', 'Inscrit', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: CP, flexShrink: 0 }}>{initiale(a)}</div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{a.prenom} {a.nom}</p>
                          <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>#{a.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>{a.email}</td>
                    <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>{a.telephone || '—'}</td>
                    <td style={{ padding: '14px 16px' }}><span style={pastille(a.suspendu)}>{a.suspendu ? 'Suspendu' : 'Actif'}</span></td>
                    <td style={{ padding: '14px 16px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{duree(a.created_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => voir(a)} style={{ padding: '5px 12px', border: `1px solid ${CP}40`, borderRadius: 6, background: '#fff', color: CP, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Voir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ouvert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setOuvert(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 20 : 32, maxWidth: 560, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${CP}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: CP }}>{initiale(ouvert)}</div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{ouvert.prenom} {ouvert.nom}</h2>
                  <p style={{ fontSize: 13, color: '#888', margin: 0, wordBreak: 'break-all' }}>{ouvert.email}</p>
                </div>
              </div>
              <button onClick={() => setOuvert(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['📞 Téléphone', ouvert.telephone || '—'], ['📅 Inscrit le', dateLongue(ouvert.created_at) || '—'], ['✉️ Infolettre', ouvert.infolettre ? 'Oui' : 'Non']].map(([l, v]) => (
                <div key={l} style={{ padding: '10px 14px', background: '#f8f8f6', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{v}</span>
                </div>
              ))}
              <div style={{ padding: '10px 14px', background: '#f8f8f6', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>Statut</span>
                <span style={pastille(ouvert.suspendu)}>{ouvert.suspendu ? 'Suspendu' : 'Actif'}</span>
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <button disabled={enCours} onClick={() => basculer(ouvert)}
                style={{ padding: '8px 18px', background: ouvert.suspendu ? '#dcfce7' : '#fee2e2', border: 'none', borderRadius: 8, color: ouvert.suspendu ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 13, cursor: enCours ? 'wait' : 'pointer', opacity: enCours ? 0.6 : 1 }}>
                {ouvert.suspendu ? '✅ Réactiver' : '🚫 Suspendre'}
              </button>
              {!ouvert.suspendu && <p style={{ fontSize: 11, color: '#aaa', margin: '8px 0 0' }}>Un acheteur suspendu ne peut plus se connecter à votre boutique.</p>}
            </div>

            {chargFiche ? <p style={{ color: '#aaa', fontSize: 13 }}>Chargement...</p> : fiche && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 10px' }}>Adresses enregistrées</h3>
                {(fiche.adresses && fiche.adresses.length > 0 ? fiche.adresses : fiche.adresse ? [fiche.adresse] : []).map((a, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: '#f8f8f6', borderRadius: 8, fontSize: 13, color: '#333', lineHeight: 1.6, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 }}>
                      {a.type === 'facturation' ? 'Facturation' : 'Livraison'}{a.libelle ? ` — ${a.libelle}` : ''}{a.est_principale ? ' · principale' : ''}
                    </div>
                    {a.nom && <div style={{ fontWeight: 600 }}>{a.nom}</div>}
                    <div>{a.adresse1}{a.adresse2 ? `, ${a.adresse2}` : ''}</div>
                    <div>{a.ville}, {a.province} {a.code_postal}</div>
                    <div>{a.pays}</div>
                    {a.telephone && <div>📞 {a.telephone}</div>}
                  </div>
                ))}
                {!(fiche.adresses && fiche.adresses.length) && !fiche.adresse && <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 20px' }}>Aucune adresse enregistrée.</p>}
                <div style={{ marginBottom: 10 }} />

                {fiche.reponses.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 10px' }}>Réponses à l'inscription</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {fiche.reponses.map((r, i) => (
                        <div key={r.id + i} style={{ padding: '10px 14px', background: '#f8f8f6', borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{r.label}</div>
                          <div style={{ fontSize: 13, color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>{valeurTexte(r.valeur)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}