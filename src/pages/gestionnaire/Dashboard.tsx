// CHEMIN : src/pages/gestionnaire/Dashboard.tsx
// e-Vend Studio — Tableau de bord du gestionnaire (thème sombre, même apparence que "Forfait & Plan")
//   GET /api/studio/mv/:gestionnaireId/dashboard?periode=7|30|90|365
// Template Multi-Vendeur Premium : statistiques complètes de la boutique.
// Autres templates : bloc "Mon site" seulement (les blocs sans données sont masqués).

import { useState, useEffect, useCallback } from 'react';

export interface VendeurUser {
  id: number;
  email: string;
  nom: string;
  nom_boutique: string | null;
  role: string;
  statut?: string;
  plan?: string;
  site_template_id?: string;
}

interface Stats {
  periode: number;
  est_mv: boolean;
  site: { template_id: string | null; publie: boolean; adresse: string | null; domaine_perso: string | null; domaine_statut: string | null } | null;
  ventes?: { periode: number; croissance: number | null; aujourdhui: number; total: number; commissions: number };
  commandes?: { periode: number; croissance: number | null; total: number; par_statut: Record<string, number> };
  graphique?: { date: string; ventes: number; commandes: number }[];
  pas?: 'day' | 'week';
  top_produits?: { nom: string; ventes: number; revenu: number }[];
  top_collaborateurs?: { nom: string; commandes: number; revenu: number }[];
  produits?: { total: number; actifs: number; brouillons: number; en_attente: number; ruptures: number };
  collaborateurs?: { total: number; actifs: number };
  acheteurs?: { total: number };
  avis?: { moyenne: number | null; total: number; distribution: Record<string, number> };
  a_faire?: { avis_en_attente: number; remboursements_en_attente: number; produits_en_attente: number; commandes_a_traiter: number };
}

const D = {
  fond: '#0c1328',
  carte: 'rgba(255,255,255,0.04)', bord: 'rgba(255,255,255,0.1)', bordDoux: 'rgba(255,255,255,0.06)',
  texte: '#ffffff', texte2: 'rgba(255,255,255,0.78)', discret: 'rgba(255,255,255,0.5)', puce: 'rgba(255,255,255,0.08)',
  accent: '#6366f1', accent2: '#8b5cf6', vert: '#34d399', rouge: '#f87171', jaune: '#fbbf24',
};

const $ = (n: number) => (Number(n) || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
const N = (n: number) => (Number(n) || 0).toLocaleString('fr-CA');

const STATUTS: Record<string, { label: string; couleur: string }> = {
  en_attente: { label: 'En attente', couleur: D.jaune },
  confirmee: { label: 'Confirmée', couleur: '#60a5fa' },
  en_preparation: { label: 'En préparation', couleur: '#a78bfa' },
  expediee: { label: 'Expédiée', couleur: '#22d3ee' },
  livree: { label: 'Livrée', couleur: D.vert },
  annulee: { label: 'Annulée', couleur: D.rouge },
  remboursee: { label: 'Remboursée', couleur: '#fb923c' },
};

const carte: React.CSSProperties = { background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: 20 };
const titre: React.CSSProperties = { fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: D.texte, margin: '0 0 14px' };

function Tendance({ v }: { v: number | null | undefined }) {
  if (v == null) return <span style={{ fontSize: 12, color: D.discret }}>—</span>;
  const hausse = v >= 0;
  return <span style={{ fontSize: 12, fontWeight: 700, color: hausse ? D.vert : D.rouge }}>{hausse ? '▲' : '▼'} {Math.abs(v).toFixed(1).replace('.', ',')} %</span>;
}

function KPI({ icone, label, valeur, sous, couleur }: { icone: string; label: string; valeur: string; sous?: React.ReactNode; couleur: string }) {
  return (
    <div style={{ ...carte, padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: couleur + '26', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icone}</span>
        <span style={{ fontSize: 12, color: D.discret, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: D.texte }}>{valeur}</div>
      {sous && <div style={{ fontSize: 12, color: D.discret }}>{sous}</div>}
    </div>
  );
}

function Graphique({ data, pas }: { data: { date: string; ventes: number; commandes: number }[]; pas: 'day' | 'week' }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const W = 760, H = 220, mg = { g: 46, d: 8, h: 12, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.ventes));
  const iw = W - mg.g - mg.d, ih = H - mg.h - mg.b;
  const bw = iw / Math.max(1, data.length);
  const y = (v: number) => mg.h + ih - (v / max) * ih;
  const lab = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }); };
  const pasLabel = Math.max(1, Math.ceil(data.length / 8));
  const total = data.reduce((s, d) => s + d.ventes, 0);
  if (total === 0) return <div style={{ padding: '48px 0', textAlign: 'center', color: D.discret, fontSize: 14 }}>Aucune vente payée sur cette période.</div>;
  const s = survol != null ? data[survol] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Ventes par période">
        <defs>
          <linearGradient id="gdash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={D.accent2} /><stop offset="100%" stopColor={D.accent} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={mg.g} x2={W - mg.d} y1={y(max * t)} y2={y(max * t)} stroke={D.bordDoux} />
            <text x={mg.g - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill={D.discret}>{Math.round(max * t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = (d.ventes / max) * ih;
          return (
            <g key={d.date} onMouseEnter={() => setSurvol(i)} onMouseLeave={() => setSurvol(null)}>
              <rect x={mg.g + i * bw} y={mg.h} width={bw} height={ih} fill="transparent" />
              <rect x={mg.g + i * bw + bw * 0.15} y={y(d.ventes)} width={Math.max(1, bw * 0.7)} height={Math.max(d.ventes > 0 ? 2 : 0, h)} rx={2}
                fill={survol === i ? '#fff' : 'url(#gdash)'} />
              {i % pasLabel === 0 && <text x={mg.g + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={D.discret}>{lab(d.date)}</text>}
            </g>
          );
        })}
      </svg>
      {s && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#111c33', border: `1px solid ${D.bord}`, borderRadius: 10, padding: '8px 12px', fontSize: 12, color: D.texte, pointerEvents: 'none' }}>
          <div style={{ color: D.discret }}>{pas === 'week' ? 'Semaine du ' : ''}{lab(s.date)}</div>
          <div style={{ fontWeight: 700 }}>{$(s.ventes)}</div>
          <div style={{ color: D.texte2 }}>{s.commandes} commande{s.commandes > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

function Classement({ lignes, vide }: { lignes: { nom: string; a: string; b: string; part: number }[]; vide: string }) {
  if (!lignes.length) return <div style={{ color: D.discret, fontSize: 13 }}>{vide}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {lignes.map((l, i) => (
        <div key={l.nom + i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: D.texte }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><b style={{ color: D.discret, marginRight: 8 }}>{i + 1}</b>{l.nom}</span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{l.b}</span>
          </div>
          <div style={{ height: 6, background: D.puce, borderRadius: 4, margin: '6px 0 3px' }}>
            <div style={{ width: `${Math.max(4, l.part * 100)}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${D.accent},${D.accent2})` }} />
          </div>
          <div style={{ fontSize: 11, color: D.discret }}>{l.a}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ vendeur, naviguerVers }: { vendeur: VendeurUser; naviguerVers?: (page: string) => void }) {
  const [periode, setPeriode] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const r = await fetch(`/api/studio/mv/${vendeur.id}/dashboard?periode=${periode}`, { credentials: 'include' });
      if (!r.ok) throw new Error('Impossible de charger les statistiques.');
      setStats(await r.json());
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement.'); }
    setChargement(false);
  }, [vendeur.id, periode]);

  useEffect(() => { charger(); }, [charger]);

  const nom = vendeur.nom_boutique || vendeur.nom || 'ma boutique';
  const mv = !!stats?.est_mv;
  const adresse = stats?.site?.adresse;
  const aFaire = stats?.a_faire;
  const taches = aFaire ? [
    { n: aFaire.commandes_a_traiter, t: 'commande(s) à traiter', p: 'mv-commandes', i: '📦' },
    { n: aFaire.produits_en_attente, t: 'produit(s) à approuver', p: 'mv-produits', i: '🛍️' },
    { n: aFaire.avis_en_attente, t: 'avis à modérer', p: 'mv-avis', i: '⭐' },
    { n: aFaire.remboursements_en_attente, t: 'demande(s) de remboursement', p: 'mv-commandes', i: '↩️' },
  ].filter((x) => x.n > 0) : [];
  const maxProd = Math.max(1, ...(stats?.top_produits || []).map((p) => p.revenu));
  const maxCollab = Math.max(1, ...(stats?.top_collaborateurs || []).map((p) => p.revenu));
  const totalStatuts = Object.values(stats?.commandes?.par_statut || {}).reduce((a, b) => a + b, 0);
  const maxAvis = Math.max(1, ...Object.values(stats?.avis?.distribution || {}));

  return (
    <div style={{ background: D.fond, minHeight: 'calc(100vh - 96px)', padding: '24px 28px 40px', color: D.texte }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Bannière */}
        <div style={{ borderRadius: 20, padding: '24px 28px', background: `linear-gradient(135deg,${D.accent},${D.accent2})`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Tableau de bord</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, margin: '4px 0 6px', fontWeight: 800 }}>Bonjour, {nom} 👋</h1>
            {adresse && (
              <a href={`https://${adresse}`} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>
                🌐 {adresse} {stats?.site?.domaine_statut && stats.site.domaine_perso ? `· domaine ${stats.site.domaine_statut}` : ''}
              </a>
            )}
          </div>
          {mv && (
            <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 12 }}>
              {[7, 30, 90, 365].map((p) => (
                <button key={p} onClick={() => setPeriode(p)} style={{ border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: periode === p ? '#fff' : 'transparent', color: periode === p ? D.accent : '#fff' }}>
                  {p === 365 ? '1 an' : `${p} j`}
                </button>
              ))}
            </div>
          )}
        </div>

        {erreur && (
          <div style={{ ...carte, borderColor: D.rouge, color: D.rouge, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{erreur}</span>
            <button onClick={charger} style={{ background: D.puce, color: D.texte, border: `1px solid ${D.bord}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Réessayer</button>
          </div>
        )}
        {chargement && !stats && <div style={{ ...carte, textAlign: 'center', color: D.discret }}>Chargement…</div>}

        {/* À faire */}
        {taches.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {taches.map((t) => (
              <button key={t.t} onClick={() => naviguerVers?.(t.p)} style={{ cursor: naviguerVers ? 'pointer' : 'default', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', color: D.jaune, borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
                {t.i} {t.n} {t.t}
              </button>
            ))}
          </div>
        )}

        {mv && stats && (
          <>
            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
              <KPI icone="💰" label={`Ventes (${periode === 365 ? '1 an' : periode + ' j'})`} couleur={D.vert} valeur={$(stats.ventes?.periode || 0)}
                sous={<><Tendance v={stats.ventes?.croissance} /> vs période précédente</>} />
              <KPI icone="🧾" label="Commandes" couleur="#60a5fa" valeur={N(stats.commandes?.periode || 0)}
                sous={<><Tendance v={stats.commandes?.croissance} /> · {N(stats.commandes?.total || 0)} au total</>} />
              <KPI icone="📅" label="Aujourd'hui" couleur={D.jaune} valeur={$(stats.ventes?.aujourdhui || 0)} sous={`${$(stats.ventes?.total || 0)} depuis le début`} />
              <KPI icone="🏦" label="Commissions" couleur={D.accent2} valeur={$(stats.ventes?.commissions || 0)} sous="Sur la période" />
              <KPI icone="🛍️" label="Produits" couleur="#22d3ee" valeur={N(stats.produits?.actifs || 0)}
                sous={`${N(stats.produits?.total || 0)} au total${stats.produits?.ruptures ? ` · ${stats.produits.ruptures} en rupture` : ''}`} />
              <KPI icone="🤝" label="Collaborateurs" couleur="#fb923c" valeur={N(stats.collaborateurs?.actifs || 0)} sous={`${N(stats.collaborateurs?.total || 0)} inscrits`} />
              <KPI icone="👥" label="Acheteurs" couleur="#f472b6" valeur={N(stats.acheteurs?.total || 0)} sous="Comptes inscrits" />
              {stats.avis && stats.avis.total > 0 && (
                <KPI icone="⭐" label="Avis" couleur={D.jaune} valeur={stats.avis.moyenne != null ? `${String(stats.avis.moyenne).replace('.', ',')} / 5` : '—'} sous={`${N(stats.avis.total)} avis publiés`} />
              )}
            </div>

            {/* Graphique */}
            <div style={carte}>
              <h3 style={titre}>📈 Ventes {stats.pas === 'week' ? 'par semaine' : 'par jour'}</h3>
              <Graphique data={stats.graphique || []} pas={stats.pas || 'day'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
              {/* Statuts */}
              {totalStatuts > 0 && (
                <div style={carte}>
                  <h3 style={titre}>📦 Commandes par statut</h3>
                  <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: D.puce, marginBottom: 14 }}>
                    {Object.entries(stats.commandes!.par_statut).map(([k, v]) => (
                      <div key={k} style={{ width: `${(v / totalStatuts) * 100}%`, background: STATUTS[k]?.couleur || D.discret }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(stats.commandes!.par_statut).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2 }}>
                        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: STATUTS[k]?.couleur || D.discret, marginRight: 8 }} />{STATUTS[k]?.label || k}</span>
                        <b style={{ color: D.texte }}>{v}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top produits */}
              {!!stats.top_produits?.length && (
                <div style={carte}>
                  <h3 style={titre}>🏆 Produits les plus vendus</h3>
                  <Classement vide="Aucune vente."
                    lignes={stats.top_produits.map((p) => ({ nom: p.nom, a: `${N(p.ventes)} vendu${p.ventes > 1 ? 's' : ''}`, b: $(p.revenu), part: p.revenu / maxProd }))} />
                </div>
              )}

              {/* Top collaborateurs */}
              {!!stats.top_collaborateurs?.length && (
                <div style={carte}>
                  <h3 style={titre}>🤝 Meilleurs collaborateurs</h3>
                  <Classement vide="Aucune vente."
                    lignes={stats.top_collaborateurs.map((p) => ({ nom: p.nom, a: `${N(p.commandes)} commande${p.commandes > 1 ? 's' : ''}`, b: $(p.revenu), part: p.revenu / maxCollab }))} />
                </div>
              )}

              {/* Avis */}
              {!!stats.avis && stats.avis.total > 0 && (
                <div style={carte}>
                  <h3 style={titre}>⭐ Répartition des avis</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[5, 4, 3, 2, 1].map((n) => {
                      const v = stats.avis!.distribution[String(n)] || 0;
                      return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: D.texte2 }}>
                          <span style={{ width: 28 }}>{n} ★</span>
                          <div style={{ flex: 1, height: 8, background: D.puce, borderRadius: 4 }}>
                            <div style={{ width: `${(v / maxAvis) * 100}%`, height: '100%', background: D.jaune, borderRadius: 4 }} />
                          </div>
                          <span style={{ width: 24, textAlign: 'right' }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Catalogue */}
              {!!stats.produits && stats.produits.total > 0 && (
                <div style={carte}>
                  <h3 style={titre}>🛍️ État du catalogue</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { l: 'Actifs', v: stats.produits.actifs, c: D.vert },
                      { l: 'Brouillons', v: stats.produits.brouillons, c: D.discret },
                      { l: 'À approuver', v: stats.produits.en_attente, c: D.jaune },
                      { l: 'En rupture', v: stats.produits.ruptures, c: D.rouge },
                    ].map((x) => (
                      <div key={x.l} style={{ background: D.puce, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: x.c }}>{x.v}</div>
                        <div style={{ fontSize: 12, color: D.discret }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Autres templates : bloc site seulement */}
        {stats && !mv && (
          <div style={carte}>
            <h3 style={titre}>🌐 Mon site</h3>
            <div style={{ fontSize: 14, color: D.texte2, lineHeight: 1.7 }}>
              {stats.site ? (
                <>
                  <div>Statut : <b style={{ color: stats.site.publie ? D.vert : D.jaune }}>{stats.site.publie ? 'Publié' : 'Non publié'}</b></div>
                  {adresse && <div>Adresse : <a href={`https://${adresse}`} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc' }}>{adresse}</a></div>}
                </>
              ) : 'Choisis un template pour créer ton site.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}