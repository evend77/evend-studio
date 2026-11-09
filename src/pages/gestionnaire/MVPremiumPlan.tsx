// CHEMIN : src/pages/gestionnaire/MVPremiumPlan.tsx
// e-Vend Studio — Forfait & Plan Multi-Vendeur Premium
//
// Les forfaits, leurs prix, limites et add-ons inclus viennent du SERVEUR (admin : ⭐ Forfaits & Plans MV).
// Rien n'est écrit en dur ici sauf l'apparence (couleur/icône) et les lignes fixes communes à tous les forfaits.
//   GET    /api/studio-forfaits/mv/mon-forfait          → { forfait, addons[], plans[], total_ht }
//   PUT    /api/studio-forfaits/mv/mon-forfait          → { plan_id }
//   POST   /api/studio-forfaits/mv/addons/:code/activer
//   DELETE /api/studio-forfaits/mv/addons/:code
// La facturation Stripe viendra plus tard : on enregistre seulement les choix.

import { useState, useEffect, useCallback } from 'react';
import MVAddonsCatalogue, { ItemAddon } from './MVAddonsCatalogue';

const API_BASE = '/api';

interface Props { gestionnaireId: number; }

interface Plan {
  plan_id: string; nom: string; prix: number; vendeurs_max: number | null; stockage_go: number | null;
  actif: boolean; ordre: number; addons_inclus: string[]; tous_addons: boolean;
}
interface Addon {
  code: string; nom: string; description: string; emoji: string; prix_ht: number; guide_url?: string; categorie?: string;
  inclus: boolean; achete: boolean; actif_pour_gestionnaire: boolean; prix_facture: number;
}
interface LigneResume { code: string; nom: string; emoji: string; inclus: boolean; prix_ht: number; }
interface Categorie { id: string; nom: string; emoji: string; }
interface Etat { categories?: Categorie[]; forfait: (Plan & { par_defaut?: boolean }) | null; addons: Addon[]; lignes: LigneResume[]; plans: Plan[]; total_ht: number; }

// Thème sombre (même apparence que le dashboard acheteur)
const D = {
  panneau: 'linear-gradient(160deg,#0f172a 0%,#0b1226 100%)',
  carte: 'rgba(255,255,255,0.04)', bord: 'rgba(255,255,255,0.1)', bordDoux: 'rgba(255,255,255,0.06)',
  texte: '#ffffff', texte2: 'rgba(255,255,255,0.78)', discret: 'rgba(255,255,255,0.5)', puce: 'rgba(255,255,255,0.08)', modal: '#111c33',
};

const mensuel = (it: ItemAddon) => (it.periode === 'an' ? it.prix / 12 : it.periode === 'mois' ? it.prix : 0);

// Apparence seulement (le contenu vient du serveur). Un forfait inconnu reçoit une couleur de la liste, selon sa position.
const STYLE: Record<string, { couleur: string; icone: string; badge?: string }> = {
  'mv-demarrage': { couleur: '#6366f1', icone: '🌱' },
  'mv-croissance': { couleur: '#2563eb', icone: '📈', badge: 'Populaire' },
  'mv-affaires': { couleur: '#0891b2', icone: '💼' },
  'mv-pro': { couleur: '#c9a96e', icone: '⭐' },
  'mv-marche': { couleur: '#dc2626', icone: '🏪', badge: 'Ultime' },
};
const PALETTE = ['#6366f1', '#2563eb', '#0891b2', '#c9a96e', '#dc2626', '#7c3aed', '#059669'];
const styleDe = (p: Plan, i: number) => STYLE[p.plan_id] || { couleur: PALETTE[i % PALETTE.length], icone: '🏷️' };

const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const go = (n: number | null) => (n == null ? '—' : `${Number.isInteger(n) ? n : String(n).replace('.', ',')} Go`);
const nbV = (n: number | null) => (n == null ? 'Vendeurs illimités' : `${n} vendeur${n > 1 ? 's' : ''} actif${n > 1 ? 's' : ''}`);

interface LigneAncienne { nom: string; prix_ht: number; }

const inclut = (p: Plan | null | undefined, code: string) => !!p && (p.tous_addons || p.addons_inclus.includes(code));

export default function MVPremiumPlan({ gestionnaireId }: Props) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);
  const [cible, setCible] = useState<string | null>(null);        // forfait en cours de confirmation
  const [anciens, setAnciens] = useState<LigneAncienne[]>([]);
  const [stockageUtilise] = useState(0);                          // Mo — le calcul réel viendra plus tard

  const entetes = useCallback((json = false): Record<string, string> => {
    const h: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }, []);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/mv/mon-forfait`, { headers: entetes(), credentials: 'include' });
      if (!r.ok) throw new Error();
      setEtat(await r.json());
      setErreurChargement(false);
      try {
        const b = await fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/facturation-cycle`, { headers: entetes(), credentials: 'include' });
        const bd = b.ok ? await b.json().catch(() => ({ achats: [] })) : { achats: [] };
        setAnciens([
          ...(bd.achats || []).map((a: any) => ({ nom: `Bloc de ${a.quantite_messages} messages (formulaire de contact)`, prix_ht: parseFloat(a.prix_ht) || 0 })),
        ]);
      } catch { setAnciens([]); }
    } catch { setErreurChargement(true); }
    setLoading(false);
  }, [entetes, gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  const notifier = (type: 'ok' | 'err', texte: string) => {
    setMsg({ type, texte });
    setTimeout(() => setMsg(null), 4000);
  };

  const appeler = async (url: string, method: string, body?: unknown) => {
    const r = await fetch(`${API_BASE}/studio-forfaits${url}`, {
      method, headers: entetes(!!body), credentials: 'include', body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || j.message || 'Erreur — réessayez.');
    return j;
  };

  const confirmerChangement = async (planId: string) => {
    setBusy(true); setCible(null);
    try {
      const j = await appeler('/mv/mon-forfait', 'PUT', { plan_id: planId });
      const devenus: string[] = j.devenus_inclus || [];
      const noms = devenus.map(c => etat?.addons.find(a => a.code === c)?.nom || c);
      notifier('ok', noms.length ? `Forfait mis à jour ! ${noms.join(', ')} ${noms.length > 1 ? 'sont maintenant inclus' : 'est maintenant inclus'} — vous ne le payez plus.` : 'Forfait mis à jour !');
      await charger();
    } catch (e: any) { notifier('err', e.message); }
    setBusy(false);
  };

  const basculerAddon = async (it: ItemAddon) => {
    setBusy(true);
    try {
      const base = '/mv/addons';
      const id = encodeURIComponent(it.code);
      if (it.achete) await appeler(`${base}/${id}`, 'DELETE');
      else await appeler(`${base}/${id}/activer`, 'POST');
      notifier('ok', it.achete ? `${it.nom} désactivé.` : `${it.nom} activé !`);
      await charger();
    } catch (e: any) { notifier('err', e.message); }
    setBusy(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: "'Inter',sans-serif", color: '#888' }}>
      Chargement...
    </div>
  );
  if (erreurChargement || !etat || !etat.forfait) return (
    <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', fontFamily: "'Inter',sans-serif", color: '#555' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
      <p style={{ fontSize: 14 }}>Impossible de charger vos forfaits pour le moment.</p>
      <button onClick={() => { setLoading(true); charger(); }}
        style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
    </div>
  );

  const plans = [...etat.plans].sort((a, b) => a.ordre - b.ordre || a.prix - b.prix);
  const courant = plans.find(p => p.plan_id === etat.forfait!.plan_id) || etat.forfait!;
  const idxCourant = plans.findIndex(p => p.plan_id === courant.plan_id);
  const styleCourant = styleDe(courant, Math.max(idxCourant, 0));
  const stockageMax = (courant.stockage_go || 0) * 1024;
  const stockagePct = stockageMax ? Math.min((stockageUtilise / stockageMax) * 100, 100) : 0;
  const stockageAffiche = stockageUtilise < 1024 ? `${stockageUtilise.toFixed(0)} Mo` : `${(stockageUtilise / 1024).toFixed(1)} Go`;
  // Add-ons du multi-vendeur (leur propre catalogue, géré dans ⭐ Forfaits & Plans MV)
  // Sections dans l'ordre défini par l'admin (liste du serveur) ; un code de catégorie inconnu tombe dans « Autres ».
  const cats = etat.categories && etat.categories.length ? etat.categories : [{ id: 'autres', nom: 'Autres', emoji: '🧩' }];
  const rang = (id?: string) => { const i = cats.findIndex(c => c.id === id); return i < 0 ? cats.length : i; };
  const catDe = (id?: string) => cats.find(c => c.id === id) || cats.find(c => c.id === 'autres') || cats[cats.length - 1];
  const items: ItemAddon[] = [
    ...[...etat.addons].sort((a, b) => rang(a.categorie) - rang(b.categorie)).map((a): ItemAddon => ({
      cle: 'studio:' + a.code, source: 'studio', code: a.code, nom: a.nom, description: a.description, emoji: a.emoji, prix: a.prix_ht, periode: 'mois',
      categorie_id: catDe(a.categorie).id, categorie_nom: catDe(a.categorie).nom, categorie_emoji: catDe(a.categorie).emoji, badges: [], inclus: a.inclus, achete: a.achete, prix_facture: a.prix_facture, lien_documentation: a.guide_url || null,
    })),
  ];
  const nomAddon = (code: string) => items.find(a => a.code === code)?.nom || code;
  const prixAddon = (code: string) => { const it = items.find(a => a.code === code); return it ? mensuel(it) : 0; };

  // Lignes d'un forfait : ce qu'il ajoute par rapport au précédent (« tout du forfait précédent + … »)
  const lignes = (p: Plan, i: number): { texte: string; fort?: boolean }[] => {
    const prec = i > 0 ? plans[i - 1] : null;
    const out: { texte: string; fort?: boolean }[] = [];
    if (prec) out.push({ texte: `Tout du forfait ${prec.nom}, plus :`, fort: true });
    out.push({ texte: nbV(p.vendeurs_max) });
    out.push({ texte: `${go(p.stockage_go)} de stockage partagé` });
    if (!prec) {
      out.push({ texte: 'Boutiques individuelles' });
      out.push({ texte: 'Catalogue unifié' });
      out.push({ texte: 'Fiche produit complète' });
    }
    if (p.tous_addons) {
      out.push({ texte: '✨ Tous les add-ons inclus', fort: true });
    } else {
      items.filter(a => inclut(p, a.code) && !inclut(prec, a.code)).forEach(a => out.push({ texte: `${a.emoji} ${a.nom} inclus`, fort: true }));
    }
    out.push({ texte: '0 % de commission sur vos ventes', fort: true });
    return out;
  };

  const planCible = cible ? plans.find(p => p.plan_id === cible) || null : null;
  const idxCible = planCible ? plans.findIndex(p => p.plan_id === planCible.plan_id) : -1;
  const estDowngrade = !!planCible && idxCible < idxCourant;

  return (
    <div style={{ maxWidth: 1140, margin: '24px auto', padding: '28px 24px', fontFamily: "'Inter',sans-serif", background: D.panneau, borderRadius: 24, color: D.texte, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
        .mvp-plan { transition: transform .2s, box-shadow .2s; } .mvp-plan:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.35); }`}</style>

      {/* En-tête : bandeau dégradé (couleur du forfait courant) */}
      <div style={{ background: `linear-gradient(135deg, ${styleCourant.couleur} 0%, ${styleCourant.couleur}aa 100%)`, borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>🏪 Forfait & Plan Multi-Vendeur Premium</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
          Tous les prix sont en dollars canadiens + taxes applicables · <strong style={{ color: '#fff' }}>0 % de commission sur vos ventes</strong>
        </p>
        {etat.forfait.par_defaut && (
          <p style={{ fontSize: 13, color: '#fff', background: 'rgba(0,0,0,0.22)', display: 'inline-block', padding: '6px 14px', borderRadius: 10, margin: '12px 0 0' }}>
            Vous êtes sur le forfait de départ <strong>{courant.nom}</strong>. Passez à un forfait supérieur quand vous voulez.
          </p>
        )}
      </div>

      {/* Barre stockage */}
      <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: D.texte }}>💾 Stockage utilisé</span>
            <span style={{ fontSize: 13, color: D.discret }}>{stockageAffiche} / {go(courant.stockage_go)}</span>
          </div>
          <div style={{ height: 8, background: D.puce, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stockagePct}%`, background: stockagePct > 85 ? '#ef4444' : stockagePct > 60 ? '#f59e0b' : styleCourant.couleur, borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: D.discret, flexShrink: 0 }}>
          {stockagePct < 60 ? '✅ Espace disponible' : stockagePct < 85 ? '⚠️ Espace limité' : '🔴 Presque plein'}
        </div>
        <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, color: D.discret }}>
          ⚡ Calcul réel du stockage à venir
        </div>
      </div>

      {/* Grille des forfaits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {plans.map((plan, i) => {
          const st = styleDe(plan, i);
          const estActuel = plan.plan_id === courant.plan_id;
          const estUpgrade = i > idxCourant;
          return (
            <div key={plan.plan_id} className="mvp-plan" style={{ background: D.carte, border: `2px solid ${estActuel ? st.couleur : D.bord}`, borderRadius: 16, overflow: 'hidden', boxShadow: estActuel ? `0 4px 20px ${st.couleur}30` : 'none', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {st.badge && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: st.couleur, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{st.badge}</div>
              )}
              {estActuel && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: st.couleur, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>Actuel</div>
              )}

              <div style={{ background: `linear-gradient(135deg, ${st.couleur}22, ${st.couleur}08)`, padding: '28px 16px 16px', borderBottom: `1px solid ${st.couleur}20`, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{st.icone}</div>
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: D.texte, margin: '0 0 12px' }}>{plan.nom}</h3>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 900, color: '#fff' }}>
                  {$(plan.prix)}<span style={{ fontSize: 12, fontWeight: 500, color: D.discret }}>/mois</span>
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${D.bordDoux}`, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: `${st.couleur}33`, color: '#fff', padding: '4px 10px', borderRadius: 20 }}>👥 {plan.vendeurs_max ?? '∞'} vendeurs</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: D.puce, color: D.texte2, padding: '4px 10px', borderRadius: 20 }}>💾 {go(plan.stockage_go)}</span>
              </div>

              <div style={{ padding: '14px 16px', flex: 1 }}>
                {lignes(plan, i).map((l, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: st.couleur, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 12, color: l.fort ? D.texte : D.texte2, lineHeight: 1.4, fontWeight: l.fort ? 700 : 400 }}>{l.texte}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0 16px 16px' }}>
                {estActuel ? (
                  <div style={{ textAlign: 'center', padding: '10px', background: `${st.couleur}33`, borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#fff' }}>✅ Forfait actuel</div>
                ) : (
                  <button onClick={() => setCible(plan.plan_id)} disabled={busy}
                    style={{ width: '100%', padding: '10px', border: `2px solid ${st.couleur}`, borderRadius: 10, background: estUpgrade ? st.couleur : 'transparent', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                    {estUpgrade ? `Passer à ${plan.nom} ↑` : `Rétrograder à ${plan.nom} ↓`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-ons (Studio + catalogue e-Vend) */}
      {items.length > 0 && <MVAddonsCatalogue items={items} busy={busy} couleur={styleCourant.couleur} onBasculer={basculerAddon} />}

      {/* Total */}
      <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: '18px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2, marginBottom: 6 }}>
          <span>Forfait {courant.nom}</span><strong>{$(courant.prix)}</strong>
        </div>
        {(etat.lignes || []).map(l => (
          <div key={l.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2, marginBottom: 6 }}>
            <span>{l.emoji} {l.nom}{l.inclus ? ' (inclus)' : ''}</span><strong>{l.inclus ? $(0) : $(l.prix_ht)}</strong>
          </div>
        ))}
        {anciens.map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2, marginBottom: 6 }}>
            <span>⚙️ {l.nom} <span style={{ color: D.discret }}>(messagerie)</span></span><strong>{$(l.prix_ht)}</strong>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${D.bord}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: D.texte }}>
          <span>Total mensuel</span><span>{$(etat.total_ht + anciens.reduce((t, l) => t + l.prix_ht, 0))} <span style={{ fontSize: 11, fontWeight: 500, color: D.discret }}>+ taxes</span></span>
        </div>
      </div>

      {msg && <div style={{ textAlign: 'center', color: msg.type === 'ok' ? '#34d399' : '#f87171', fontWeight: 700, marginBottom: 16 }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.texte}</div>}

      <p style={{ textAlign: 'center', fontSize: 12, color: D.discret, margin: 0 }}>
        Tous les prix sont en $ CAD + taxes applicables · Facturé mensuellement · Annulable en tout temps · Aucune commission sur vos ventes
      </p>

      {/* Modal confirmation */}
      {planCible && (() => {
        const st = styleDe(planCible, idxCible);
        const diff = planCible.prix - courant.prix;
        const perdus = estDowngrade ? items.filter(a => inclut(courant, a.code) && !inclut(planCible, a.code)) : [];
        const gagnes = !estDowngrade ? items.filter(a => !inclut(courant, a.code) && inclut(planCible, a.code)) : [];
        const fusionnes = gagnes.filter(a => a.achete);     // déjà payés → ne les paiera plus
        const fond = estDowngrade ? 'linear-gradient(135deg,#dc2626,#ef4444)' : `linear-gradient(135deg, ${st.couleur}dd, ${st.couleur})`;
        return (
          <div onClick={() => setCible(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: D.modal, border: `1px solid ${D.bord}`, color: D.texte, borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', fontFamily: 'inherit' }}>
              <div style={{ background: fond, padding: '26px 30px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{estDowngrade ? '⚠️' : st.icone}</div>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: 0 }}>
                  {estDowngrade ? `Rétrograder au forfait ${planCible.nom}` : `Passer au forfait ${planCible.nom}`}
                </h2>
              </div>
              <div style={{ padding: '22px 30px 26px' }}>
                <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                    <span style={{ fontSize: 13, color: D.discret }}>Forfait actuel</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.texte }}>{courant.nom} — {$(courant.prix)}/mois</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                    <span style={{ fontSize: 13, color: D.discret }}>Nouveau forfait</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{planCible.nom} — {$(planCible.prix)}/mois</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${D.bord}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: D.texte }}>Différence</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: diff >= 0 ? '#fff' : '#34d399' }}>{diff >= 0 ? '+' : '−'}{$(Math.abs(diff))}/mois</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, background: `${st.couleur}33`, color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>👥 {planCible.vendeurs_max ?? '∞'} vendeurs</span>
                  <span style={{ fontSize: 12, background: D.puce, color: D.texte2, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>💾 {go(planCible.stockage_go)}</span>
                </div>

                {estDowngrade && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 13, color: D.texte2, lineHeight: 1.7 }}>
                      Vous passez de <strong>{courant.nom}</strong> ({courant.vendeurs_max ?? '∞'} vendeurs, {go(courant.stockage_go)}) à <strong>{planCible.nom}</strong> ({planCible.vendeurs_max ?? '∞'} vendeurs, {go(planCible.stockage_go)}).
                      Si vous dépassez {planCible.vendeurs_max ?? '∞'} vendeurs actifs ou {go(planCible.stockage_go)}, certaines fonctionnalités seront limitées.
                    </p>
                  </div>
                )}

                {perdus.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#fdba74' }}>Ne seront plus inclus :</p>
                    {perdus.map(a => (
                      <p key={a.code} style={{ margin: '0 0 4px', fontSize: 13, color: '#fed7aa', lineHeight: 1.5 }}>
                        {a.emoji} <strong>{nomAddon(a.code)}</strong> sera désactivé, sauf si vous l'activez ensuite à {$(prixAddon(a.code))}/mois.
                      </p>
                    ))}
                  </div>
                )}

                {gagnes.length > 0 && (
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#6ee7b7' }}>Ce que vous gagnez :</p>
                    {gagnes.map(a => (
                      <p key={a.code} style={{ margin: '0 0 4px', fontSize: 13, color: '#a7f3d0', lineHeight: 1.5 }}>
                        {a.emoji} <strong>{a.nom}</strong> inclus{fusionnes.some(f => f.code === a.code) ? ` — vous ne paierez plus les ${$(a.prix_facture)}/mois de cet add-on.` : '.'}
                      </p>
                    ))}
                  </div>
                )}

                {!estDowngrade && (
                  <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#fcd34d', lineHeight: 1.6 }}>
                      Le changement est effectif immédiatement. La facturation de <strong>{$(planCible.prix)}/mois + taxes</strong> s'appliquera à votre prochain renouvellement.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setCible(null)}
                    style={{ flex: 1, padding: '11px', border: `1px solid ${D.bord}`, borderRadius: 10, background: D.puce, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: D.texte }}>Annuler</button>
                  <button onClick={() => confirmerChangement(planCible.plan_id)}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: fond, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {estDowngrade ? 'Confirmer la rétrogradation' : `✅ Confirmer — ${$(planCible.prix)}/mois`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}