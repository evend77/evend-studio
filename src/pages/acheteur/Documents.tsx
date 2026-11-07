// CHEMIN : src/pages/acheteur/Documents.tsx
// e-Vend Studio — Dashboard acheteur : mes documents (sommaires mensuels d'achats, impression / PDF)
// Adapté de DocumentsAcheteur.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET /api/acheteur/:gid/sommaires · GET /sommaires/:annee/:mois/commandes
// Le PDF est produit par la fenêtre d'impression du navigateur (« Enregistrer en PDF »).

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

const API = '/api';

interface Sommaire { annee: number; mois: number; periode_label: string; nb_commandes: number; total_depense: number; boutiques: string[] }
interface CommandeMois { id: number; numero_commande: string; date_commande: string; statut: string; total: number | string; articles: { titre?: string; nom?: string; quantite?: number; prix?: number | string }[] | null; boutique: string | null }

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  nomSite?: string;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)' };
const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export default function Documents({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', nomSite = 'Ma Marketplace' }: Props) {
  const [sommaires, setSommaires] = useState<Sommaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, CommandeMois[]>>({});
  const [occupe, setOccupe] = useState<string | null>(null);
  const [annee, setAnnee] = useState<number | 'toutes'>('toutes');

  const base = `${API}/acheteur/${gestionnaireId}`;

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${base}/sommaires`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setSommaires(j.sommaires || []);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [base]);

  useEffect(() => { charger(); }, [charger]);

  const cle = (s: Sommaire) => `${s.annee}-${s.mois}`;

  const chargerDetail = async (s: Sommaire): Promise<CommandeMois[]> => {
    const k = cle(s);
    if (detail[k]) return detail[k];
    setOccupe(k);
    try {
      const r = await fetch(`${base}/sommaires/${s.annee}/${s.mois}/commandes`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setDetail(d => ({ ...d, [k]: j.commandes || [] }));
      return j.commandes || [];
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); return []; }
    finally { setOccupe(null); }
  };

  const basculer = async (s: Sommaire) => {
    const k = cle(s);
    if (ouvert === k) { setOuvert(null); return; }
    setOuvert(k);
    await chargerDetail(s);
  };

  const imprimer = async (s: Sommaire) => {
    const cmds = await chargerDetail(s);
    const w = window.open('', '_blank');
    if (!w) { setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les fenêtres pour ce site."); return; }
    const lignes = cmds.map(c => `
      <tr><td>${esc(c.numero_commande)}</td><td>${esc(new Date(c.date_commande).toLocaleDateString('fr-CA'))}</td><td>${esc(c.boutique || '')}</td>
      <td>${esc((c.articles || []).map(a => `${a.titre || a.nom || 'Article'} × ${a.quantite || 1}`).join(', '))}</td>
      <td style="text-align:right">${formaterPrix(num(c.total))}</td></tr>`).join('');
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Sommaire ${esc(s.periode_label)}</title>
      <style>body{font-family:Arial,sans-serif;color:#111;padding:32px}h1{margin:0 0 4px;font-size:22px}p{margin:2px 0;color:#555;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:8px 6px;text-align:left;vertical-align:top}
      th{background:#f3f4f6}.t{margin-top:16px;text-align:right;font-size:15px;font-weight:bold}</style></head><body>
      <h1>${esc(nomSite)} — Sommaire d'achats</h1><p>${esc(s.periode_label)}</p>
      <p>${s.nb_commandes} commande(s) · Total dépensé : ${formaterPrix(num(s.total_depense))}</p>
      <table><thead><tr><th>N°</th><th>Date</th><th>Boutique</th><th>Articles</th><th style="text-align:right">Total</th></tr></thead><tbody>${lignes}</tbody></table>
      <p class="t">Total : ${formaterPrix(num(s.total_depense))}</p>
      <p style="margin-top:24px;font-size:11px">Document généré le ${esc(new Date().toLocaleDateString('fr-CA'))}. Ce sommaire ne remplace pas vos reçus de paiement.</p>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const annees = Array.from(new Set(sommaires.map(s => s.annee))).sort((a, b) => b - a);
  const affiches = sommaires.filter(s => annee === 'toutes' || s.annee === annee);
  const totalAffiche = affiches.reduce((t, s) => t + num(s.total_depense), 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)', borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>📄 Mes documents</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.9)' }}>Sommaires mensuels de vos achats · {formaterPrix(totalAffiche)} au total</p>
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      {annees.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
          {(['toutes', ...annees] as (number | 'toutes')[]).map(a => (
            <button key={String(a)} onClick={() => setAnnee(a)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, border: `1px solid ${annee === a ? couleurAccent : C.border}`, background: annee === a ? `${couleurAccent}22` : 'rgba(255,255,255,.04)', color: annee === a ? couleurAccent : 'rgba(255,255,255,.7)' }}>{a === 'toutes' ? 'Toutes' : a}</button>
          ))}
        </div>
      )}

      {affiches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🗂️</div>
          <p style={{ margin: 0, fontSize: 14, color: C.textLight }}>Aucun sommaire pour le moment. Ils apparaissent dès votre première commande.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {affiches.map(s => {
            const k = cle(s);
            const open = ouvert === k;
            return (
              <div key={k} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: isMobile ? '12px' : '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div onClick={() => basculer(s)} style={{ flex: '1 1 200px', minWidth: 0, cursor: 'pointer' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>{s.periode_label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nb_commandes} commande{s.nb_commandes > 1 ? 's' : ''}{s.boutiques.length ? ` · ${s.boutiques.join(', ')}` : ''}</p>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: couleurAccent }}>{formaterPrix(num(s.total_depense))}</span>
                  <button onClick={() => imprimer(s)} disabled={occupe === k} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(14,165,233,.5)', background: 'rgba(14,165,233,.15)', color: '#7dd3fc', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{occupe === k ? '⏳…' : '🖨️ PDF'}</button>
                  <button onClick={() => basculer(s)} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 12 }}>{open ? '▲' : '▼'}</button>
                </div>
                {open && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: isMobile ? '6px 12px 12px' : '8px 18px 16px' }}>
                    {!detail[k] ? <p style={{ fontSize: 12, color: C.textLight }}>Chargement…</p> : detail[k].map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <b style={{ color: '#fff' }}>{c.numero_commande}</b> <span style={{ color: C.textLight }}>· {new Date(c.date_commande).toLocaleDateString('fr-CA')}{c.boutique ? ` · ${c.boutique}` : ''}</span>
                          <div style={{ color: 'rgba(255,255,255,.6)', wordBreak: 'break-word' }}>{(c.articles || []).map(a => `${a.titre || a.nom || 'Article'} × ${a.quantite || 1}`).join(', ')}</div>
                        </div>
                        <b style={{ whiteSpace: 'nowrap' }}>{formaterPrix(num(c.total))}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}