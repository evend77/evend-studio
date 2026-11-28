// CHEMIN : src/pages/gestionnaire/VitrinePlan.tsx
// e-Vend Studio — « Mon plan & add-ons » des sites VITRINE. Même apparence que le multi-vendeur, SANS paliers :
// un seul prix par sous-catégorie (admin : Templates → Vitrines (tarifs)) + les add-ons (admin : Vitrines (add-ons)).
//   GET    /api/vitrines-addons/mon-etat        → { addons[], total_ht }
//   POST   /api/vitrines-addons/:code/activer
//   DELETE /api/vitrines-addons/:code
// La facturation Stripe viendra plus tard : on enregistre seulement les choix.

import { useState, useEffect, useCallback } from 'react';
import VitrineAddonsCatalogue, { ItemVitrine } from './VitrineAddonsCatalogue';
import { TEMPLATES } from '../PageTemplates';

const API_BASE = '/api';
const BLEU = '#2563eb';

interface Props { gestionnaireId: number; templateId: string; onOptionsUpdated?: () => void; }
interface Etat { addons: ItemVitrine[]; total_ht: number; }
interface PrixSite { texte: string; nombre: number; }
interface Bloc { nom: string; prix_ht: number; }

// Thème sombre (même apparence que le multi-vendeur)
const D = {
  carte: 'rgba(255,255,255,0.04)', bord: 'rgba(255,255,255,0.1)',
  texte: '#ffffff', texte2: 'rgba(255,255,255,0.78)', discret: 'rgba(255,255,255,0.5)',
};

const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const lireNombre = (t: string) => { const n = parseFloat((t.match(/\d+(?:[.,]\d+)?/) || ['0'])[0].replace(',', '.')); return Number.isFinite(n) ? n : 0; };

// Même ordre de priorité que « Choisir un template » : prix de la sous-catégorie, sinon prix du template, sinon défaut, sinon Gratuit
async function chargerPrixSite(templateId: string): Promise<PrixSite | null> {
  const lire = (url: string) => fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [vitrines, prix] = await Promise.all([lire(`${API_BASE}/vitrines/prix`), lire(`${API_BASE}/templates/prix`)]);
  if (!vitrines && !prix) return null;
  const groupe = TEMPLATES.find(t => t.id === templateId)?.groupe || '';
  const v = vitrines?.actif ? vitrines.groupes?.[groupe] : null;
  if (v && v.prix_texte) return { texte: String(v.prix_texte), nombre: Number(v.prix_nombre) || 0 };
  if (!prix?.success) return null;
  const texte = String(prix.templates?.[templateId]?.prix_texte || prix.groupes?.[groupe]?.prix_texte || 'Gratuit');
  return { texte, nombre: lireNombre(texte) };
}

export default function VitrinePlan({ gestionnaireId, templateId, onOptionsUpdated }: Props) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [prixSite, setPrixSite] = useState<PrixSite | null>(null);
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  const entetes = useCallback((): Record<string, string> => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/vitrines-addons/mon-etat`, { headers: entetes(), credentials: 'include' });
      if (!r.ok) throw new Error();
      setEtat(await r.json());
      setErreurChargement(false);
      setPrixSite(await chargerPrixSite(templateId));
      try {
        const b = await fetch(`${API_BASE}/messagerie-contact/gestionnaire/${gestionnaireId}/facturation-cycle`, { headers: entetes(), credentials: 'include' });
        const bd = b.ok ? await b.json().catch(() => ({ achats: [] })) : { achats: [] };
        setBlocs((bd.achats || []).map((a: any) => ({ nom: `Bloc de ${a.quantite_messages} messages (formulaire de contact)`, prix_ht: parseFloat(a.prix_ht) || 0 })));
      } catch { setBlocs([]); }
    } catch { setErreurChargement(true); }
    setLoading(false);
  }, [entetes, gestionnaireId, templateId]);

  useEffect(() => { charger(); }, [charger]);

  const notifier = (type: 'ok' | 'err', texte: string) => {
    setMsg({ type, texte });
    setTimeout(() => setMsg(null), 4000);
  };

  const basculerAddon = async (it: ItemVitrine) => {
    setBusy(true);
    try {
      const id = encodeURIComponent(it.code);
      const r = await fetch(`${API_BASE}/vitrines-addons/${id}${it.achete ? '' : '/activer'}`, { method: it.achete ? 'DELETE' : 'POST', headers: entetes(), credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || j.message || 'Erreur — réessayez.');
      notifier('ok', it.achete ? `${it.nom} désactivé.` : `${it.nom} activé !`);
      await charger();
      onOptionsUpdated?.();   // met le menu VITRINE à jour tout de suite
    } catch (e: any) { notifier('err', e.message); }
    setBusy(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.55)' }}>
      Chargement...
    </div>
  );
  if (erreurChargement || !etat) return (
    <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.75)' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
      <p style={{ fontSize: 14 }}>Impossible de charger votre plan pour le moment.</p>
      <button onClick={() => { setLoading(true); charger(); }}
        style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: BLEU, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
    </div>
  );

  const nomTemplate = TEMPLATES.find(t => t.id === templateId)?.nom || templateId;
  const factures = etat.addons.filter(a => a.achete);
  const total = (prixSite?.nombre || 0) + etat.total_ht + blocs.reduce((t, l) => t + l.prix_ht, 0);
  const ligne = { display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: D.texte2, marginBottom: 6 } as const;

  return (
    <div style={{ minHeight: 'calc(100vh - 96px)', padding: '28px 28px 40px', fontFamily: "'Inter',sans-serif", color: D.texte }}>
     <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');`}</style>

      <div style={{ background: `linear-gradient(135deg, ${BLEU} 0%, ${BLEU}aa 100%)`, borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>🖼️ Mon plan & add-ons — Vitrine</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
          Tous les prix sont en dollars canadiens + taxes applicables
        </p>
      </div>

      <div style={{ background: D.carte, border: `2px solid ${BLEU}`, borderRadius: 16, padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: D.discret, marginBottom: 4 }}>Votre site vitrine</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800 }}>{nomTemplate}</div>
        </div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 900 }}>{prixSite ? prixSite.texte : '—'}</div>
      </div>

      {etat.addons.length > 0 && <VitrineAddonsCatalogue items={etat.addons} busy={busy} couleur={BLEU} onBasculer={basculerAddon} />}

      <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: '18px 24px', marginBottom: 20 }}>
        <div style={ligne}><span>Site vitrine — {nomTemplate}</span><strong>{prixSite ? $(prixSite.nombre) : '—'}</strong></div>
        {factures.map(a => (
          <div key={a.code} style={ligne}>
            <span>{a.emoji} {a.nom}</span><strong>{a.revenu_partage ? 'revenu partagé' : $(a.prix_ht)}</strong>
          </div>
        ))}
        {blocs.map((l, i) => (
          <div key={i} style={ligne}>
            <span>⚙️ {l.nom} <span style={{ color: D.discret }}>(messagerie)</span></span><strong>{$(l.prix_ht)}</strong>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${D.bord}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
          <span>Total mensuel</span><span>{prixSite ? $(total) : '—'} <span style={{ fontSize: 11, fontWeight: 500, color: D.discret }}>+ taxes</span></span>
        </div>
      </div>

      {msg && <div style={{ textAlign: 'center', color: msg.type === 'ok' ? '#34d399' : '#f87171', fontWeight: 700, marginBottom: 16 }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.texte}</div>}

      <p style={{ textAlign: 'center', fontSize: 12, color: D.discret, margin: 0 }}>
        Tous les prix sont en $ CAD + taxes applicables · Facturé mensuellement · Annulable en tout temps
      </p>
     </div>
    </div>
  );
}